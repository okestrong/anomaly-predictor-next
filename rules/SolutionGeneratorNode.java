package com.okestro.anomaly.predictor.services.trouble.graph.nodes;

import com.okestro.anomaly.predictor.services.trouble.dto.TroubleResponse;
import com.okestro.anomaly.predictor.services.trouble.graph.state.*;
import com.okestro.anomaly.predictor.services.trouble.graph.tools.RAGTool;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.chat.StreamingChatResponseHandler;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.input.Prompt;
import dev.langchain4j.model.input.PromptTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * 해결책 생성 노드
 * 진단 결과를 바탕으로 실행 가능한 해결책 제시
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SolutionGeneratorNode {

    private final ChatModel chatModel;
    private final StreamingChatModel streamingChatModel;
    private final RAGTool ragTool;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    private static final String SOLUTION_GENERATION_PROMPT = """
        당신은 Ceph 클러스터 트러블슈팅 전문가입니다.
        진단 결과를 바탕으로 실행 가능한 해결책을 제시하세요.

        ## 진단 결과
        **근본 원인**: {{root_cause}}
        **신뢰도**: {{confidence}}
        **영향 범위**: {{impact_scope}}
        **영향받는 컴포넌트**: {{affected_components}}

        ## 상세 분석
        {{diagnosis_details}}

        ## 관련 문서
        {{rag_knowledge}}

        ## Ceph 명령어 구문 참고 (매우 중요!)
        아래는 Ceph 공식 문서에서 가져온 정확한 명령어 구문입니다.
        **반드시 이 구문을 참고하여 정확한 명령어를 작성하세요:**

        {{command_syntax}}

        **해결책 요구사항**:
        1. 단계별로 명확한 조치 방법을 제시하세요
        2. 실행할 명령어를 정확히 명시하세요
        3. 각 명령어의 위험도를 평가하세요 (low, medium, high, critical)
        4. 예상되는 영향을 명확히 설명하세요
        5. 소요 시간을 추정하세요

        **명령어 작성 규칙** (매우 중요!):
        - COMMANDS 섹션에는 **실행 가능한 명령어만** 작성하세요
        - bash 주석(#)을 절대 사용하지 마세요
        - 주석이나 설명은 STEPS나 DESCRIPTION 섹션에 작성하세요
        - 한 줄에 하나의 명령어만 작성하세요
        - 명령어와 인자만 작성하고, 추가 설명은 포함하지 마세요

        **응답 형식** (반드시 이 형식을 따르세요):
        ```
        SOLUTION_TITLE: [해결책 제목]
        RISK_LEVEL: [low|medium|high|critical]
        ESTIMATED_MINUTES: [예상 소요 시간(분)]

        STEPS:
        1. [첫 번째 단계]
        2. [두 번째 단계]
        ...

        COMMANDS:
        ```bash
        ceph health detail
        ceph osd tree
        ceph pg dump
        ```

        EXPECTED_IMPACTS:
        - [영향 1]
        - [영향 2]

        DESCRIPTION:
        [상세한 해결책 설명을 마크다운으로]
        ```

        **명령어 예시 (올바른 형식)**:
        ```bash
        ceph health detail
        ceph osd tree
        systemctl restart ceph-osd@1
        ```

        **잘못된 예시 (절대 사용 금지)**:
        ```bash
        # 클러스터 상태 확인
        ceph health detail
        $ ceph osd tree
        ```
        """;

    public TroubleState process(TroubleState state) {
        long startTime = System.currentTimeMillis();

        try {
            log.info("💡 SolutionGeneratorNode - Generating solutions");

            state.setCurrentNode("solution_generator");
            state.setStatus(WorkflowStatus.GENERATING_SOLUTION);

            DiagnosisResult diagnosis = state.getDiagnosis();
            if (diagnosis == null) {
                throw new IllegalStateException("No diagnosis available for solution generation");
            }

            // RAG에서 해결책 검색
            String ragSolutions = searchSolutions(state, diagnosis);

            // Ceph 명령어 구문 검색 (정확성 향상을 위해)
            String commandSyntax = searchCommandSyntax(state, diagnosis);

            // LLM으로 해결책 생성
            List<Solution> solutions = generateSolutions(state, diagnosis, ragSolutions, commandSyntax);
            state.setProposedSolutions(solutions);

            // 첫 번째 해결책을 선택
            if (!solutions.isEmpty()) {
                state.setSelectedSolution(solutions.getFirst());
            }

            log.info("✅ Generated {} solution(s)", solutions.size());

            // 해결책은 SolutionCard로 표시되므로 메시지에 추가하지 않음
            // (중복 표시 방지)

            return state;

        } catch (Exception e) {
            log.error("❌ Error in SolutionGeneratorNode", e);
            state.setStatus(WorkflowStatus.ERROR);
            state.setErrorInfo(ErrorInfo.builder()
                    .errorCode("SOLUTION_GENERATION_ERROR")
                    .message(e.getMessage())
                    .node("solution_generator")
                    .recoverable(true)
                    .build());
            return state;

        } finally {
            long executionTime = System.currentTimeMillis() - startTime;
            state.recordNodeExecutionTime("solution_generator", executionTime);
            log.info("⏱️ SolutionGeneratorNode execution time: {} ms", executionTime);
        }
    }

    /**
     * RAG에서 해결책 검색
     */
    private String searchSolutions(TroubleState state, DiagnosisResult diagnosis) {
        try {
            String searchQuery = String.format("%s 해결 방법", diagnosis.getRootCause());

            log.info("🔍 Searching solutions for: {}", searchQuery);

            return ragTool.searchTroubleshootingGuide("solution", searchQuery);

        } catch (Exception e) {
            log.error("Error searching solutions", e);
            return "No specific solutions found in documentation.";
        }
    }

    /**
     * Ceph 명령어 구문 검색 (정확한 명령어 생성을 위해)
     */
    private String searchCommandSyntax(TroubleState state, DiagnosisResult diagnosis) {
        try {
            // affected_components를 기반으로 관련 명령어 검색
            List<String> components = diagnosis.getAffectedComponents();
            if (components == null || components.isEmpty()) {
                components = List.of("osd", "pg", "mon");
            }

            StringBuilder commandDocs = new StringBuilder();
            for (String component : components) {
                String searchQuery = String.format("ceph %s 명령어 사용법", component);
                log.info("📖 Searching command syntax for: {}", searchQuery);

                String doc = ragTool.searchDocumentation(searchQuery);
                if (doc != null && !doc.isEmpty() && !doc.startsWith("Error:")) {
                    commandDocs.append("## ").append(component.toUpperCase()).append(" Commands\n");
                    commandDocs.append(doc).append("\n\n");
                }
            }

            // 추가로 systemctl, journalctl 같은 시스템 명령어 구문도 검색
            String systemCommandsQuery = "systemctl journalctl 명령어 사용법";
            log.info("📖 Searching system command syntax");
            String systemDoc = ragTool.searchDocumentation(systemCommandsQuery);
            if (systemDoc != null && !systemDoc.isEmpty() && !systemDoc.startsWith("Error:")) {
                commandDocs.append("## System Commands\n");
                commandDocs.append(systemDoc).append("\n");
            }

            String result = commandDocs.toString();
            if (result.isEmpty()) {
                return "명령어 구문 문서를 찾을 수 없습니다.";
            }

            log.info("✅ Found command syntax documentation: {} characters", result.length());
            return result;

        } catch (Exception e) {
            log.error("Error searching command syntax", e);
            return "명령어 구문 검색 중 오류가 발생했습니다.";
        }
    }

    /**
     * LLM으로 해결책 생성
     */
    private List<Solution> generateSolutions(TroubleState state, DiagnosisResult diagnosis,
                                             String ragSolutions, String commandSyntax) {
        try {
            Map<String, Object> variables = new HashMap<>();
            variables.put("root_cause", diagnosis.getRootCause());
            variables.put("confidence", String.format("%.0f%%", diagnosis.getConfidence() * 100));
            variables.put("impact_scope", diagnosis.getImpactScope());
            variables.put("affected_components", String.join(", ", diagnosis.getAffectedComponents()));
            variables.put("diagnosis_details", diagnosis.getDetails());
            variables.put("rag_knowledge", ragSolutions);
            variables.put("command_syntax", commandSyntax);

            PromptTemplate template = PromptTemplate.from(SOLUTION_GENERATION_PROMPT);
            Prompt prompt = template.apply(variables);

            // LLM 스트리밍 호출 (타이핑 효과)
            String response = callLLMWithStreaming(state.getThreadId(), prompt.text());

            Solution solution = parseSolutionResponse(response);

            return Collections.singletonList(solution);

        } catch (Exception e) {
            log.error("Error generating solutions", e);
            return Collections.singletonList(createFallbackSolution(diagnosis));
        }
    }

    /**
     * LLM 응답을 Solution으로 파싱
     */
    private Solution parseSolutionResponse(String response) {
        String title = "Generated Solution";
        String riskLevel = "medium";
        int estimatedMinutes = 10;
        List<String> steps = new ArrayList<>();
        List<CommandToExecute> commands = new ArrayList<>();
        List<String> expectedImpacts = new ArrayList<>();
        String description = response;

        String[] lines = response.split("\n");
        StringBuilder currentSection = new StringBuilder();
        String section = null;

        for (String line : lines) {
            String trimmedLine = line.trim();

            if (trimmedLine.startsWith("SOLUTION_TITLE:")) {
                title = trimmedLine.substring(15).trim();
            } else if (trimmedLine.startsWith("RISK_LEVEL:")) {
                riskLevel = trimmedLine.substring(11).trim().toLowerCase();
            } else if (trimmedLine.startsWith("ESTIMATED_MINUTES:")) {
                try {
                    estimatedMinutes = Integer.parseInt(trimmedLine.substring(18).trim());
                } catch (NumberFormatException e) {
                    estimatedMinutes = 10;
                }
            } else if (trimmedLine.equals("STEPS:")) {
                section = "steps";
            } else if (trimmedLine.equals("COMMANDS:")) {
                section = "commands";
            } else if (trimmedLine.equals("EXPECTED_IMPACTS:")) {
                section = "impacts";
            } else if (trimmedLine.equals("DESCRIPTION:")) {
                section = "description";
            } else if (section != null) {
                switch (section) {
                    case "steps":
                        if (trimmedLine.matches("^\\d+\\..*")) {
                            steps.add(trimmedLine.substring(trimmedLine.indexOf(".") + 1).trim());
                        }
                        break;
                    case "commands":
                        if (!trimmedLine.equals("```") && !trimmedLine.equals("```bash") && !trimmedLine.isEmpty()) {
                            CommandToExecute cmd = parseCommand(trimmedLine, riskLevel);
                            if (cmd != null) {
                                commands.add(cmd);
                            }
                        }
                        break;
                    case "impacts":
                        if (trimmedLine.startsWith("-")) {
                            expectedImpacts.add(trimmedLine.substring(1).trim());
                        }
                        break;
                    case "description":
                        currentSection.append(line).append("\n");
                        break;
                }
            }
        }

        if (!currentSection.isEmpty()) {
            description = currentSection.toString();
        }

        return Solution.builder()
                .id(UUID.randomUUID().toString())
                .title(title)
                .description(description)
                .steps(steps)
                .commands(commands)
                .readOnly(isReadOnly(commands))
                .riskLevel(riskLevel)
                .expectedImpacts(expectedImpacts)
                .estimatedMinutes(estimatedMinutes)
                .referenceUrls(Collections.emptyList())
                .build();
    }

    /**
     * 명령어 파싱 (승인 여부만 판단, 실제 실행하지 않음)
     */
    private CommandToExecute parseCommand(String commandLine, String defaultRiskLevel) {
        if (commandLine == null || commandLine.trim().isEmpty()) {
            return null;
        }

        String[] parts = commandLine.trim().split("\\s+");
        if (parts.length == 0) {
            return null;
        }

        String command = parts[0];
        List<String> args = new ArrayList<>(Arrays.asList(parts).subList(1, parts.length));

        // 위험도 판단 (실행하지 않고 분석만)
        String riskLevel = determineCommandRiskLevel(command, args);
        boolean requiresApproval = !riskLevel.equals("low");

        log.debug("Command '{}' risk level: {}, requires approval: {}",
                commandLine, riskLevel, requiresApproval);

        return CommandToExecute.builder()
                .command(command)
                .args(args)
                .timeout(30)
                .description("Execute " + commandLine)
                .requiresApproval(requiresApproval)
                .riskLevel(riskLevel)
                .potentialImpacts(Collections.emptyList()) // Executor API will provide this on actual execution
                .build();
    }

    /**
     * 명령어 위험도 판단
     */
    private String determineCommandRiskLevel(String command, List<String> args) {
        // ceph 명령어 분석
        if ("ceph".equals(command)) {
            if (args.isEmpty()) {
                return "low";
            }

            String subcommand = args.get(0);

            // 단일 단어 읽기 전용 명령어
            if (Arrays.asList("status", "health", "df", "-s", "quorum_status").contains(subcommand)) {
                return "low";
            }

            // 두 단어 읽기 전용 명령어 (예: osd tree, pg stat 등)
            if (args.size() >= 2) {
                String secondArg = args.get(1);

                // osd 관련 읽기 전용 명령어
                if ("osd".equals(subcommand)) {
                    if (Arrays.asList("tree", "stat", "status", "dump", "pool").contains(secondArg)) {
                        return "low";
                    }
                    // osd pool 관련
                    if ("pool".equals(secondArg) && args.size() >= 3) {
                        String thirdArg = args.get(2);
                        if (Arrays.asList("ls", "stats").contains(thirdArg)) {
                            return "low";
                        }
                    }
                }

                // pg 관련 읽기 전용 명령어
                if ("pg".equals(subcommand)) {
                    if (Arrays.asList("stat", "dump", "dump_stuck").contains(secondArg)) {
                        return "low";
                    }
                }

                // mon 관련 읽기 전용 명령어
                if ("mon".equals(subcommand)) {
                    if (Arrays.asList("stat", "dump").contains(secondArg)) {
                        return "low";
                    }
                }

                // 위험한 명령어 체크
                if (Arrays.asList("out", "down", "rm", "destroy", "delete").contains(secondArg)) {
                    return "critical";
                }
            }

            return "medium";
        }

        // 읽기 전용 Linux 명령어
        if (Arrays.asList("ls", "cat", "tail", "head", "find", "grep", "df", "free", "uptime", "ps", "netstat", "ss", "lsblk", "iostat", "vmstat").contains(command)) {
            return "low";
        }

        // 위험한 시스템 명령어
        if (Arrays.asList("systemctl", "service", "reboot", "shutdown").contains(command)) {
            return "critical";
        }

        // 기타 명령어는 medium
        return "medium";
    }

    /**
     * 읽기 전용 여부 확인
     */
    private boolean isReadOnly(List<CommandToExecute> commands) {
        return commands.stream()
                .allMatch(cmd -> "low".equals(cmd.getRiskLevel()));
    }

    /**
     * 폴백 해결책 생성
     */
    private Solution createFallbackSolution(DiagnosisResult diagnosis) {
        return Solution.builder()
                .id(UUID.randomUUID().toString())
                .title("Manual Investigation Required")
                .description("Automated solution generation was unsuccessful. Please review the diagnosis and collected data manually.")
                .steps(Arrays.asList(
                        "Review the diagnosis details",
                        "Check Ceph documentation for " + diagnosis.getRootCause(),
                        "Consult with Ceph experts if needed"
                ))
                .commands(Collections.emptyList())
                .readOnly(true)
                .riskLevel("low")
                .expectedImpacts(Collections.singletonList("No automated action will be taken"))
                .estimatedMinutes(30)
                .referenceUrls(Collections.emptyList())
                .build();
    }

    // ========== 헬퍼 메서드 ==========

    private String formatSolutionsMessage(List<Solution> solutions) {
        if (solutions.isEmpty()) {
            return "해결책을 생성할 수 없습니다.";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("# 제안된 해결책\n\n");

        for (int i = 0; i < solutions.size(); i++) {
            Solution solution = solutions.get(i);
            sb.append(String.format("## %d. %s\n\n", i + 1, solution.getTitle()));
            sb.append(String.format("**위험도**: %s | **예상 소요 시간**: %d분\n\n",
                    getRiskLevelText(solution.getRiskLevel()),
                    solution.getEstimatedMinutes()));

            sb.append("### 실행 단계\n");
            for (int j = 0; j < solution.getSteps().size(); j++) {
                sb.append(String.format("%d. %s\n", j + 1, solution.getSteps().get(j)));
            }
            sb.append("\n");

            if (!solution.getCommands().isEmpty()) {
                sb.append("### 실행 명령어\n```bash\n");
                solution.getCommands().forEach(cmd ->
                        sb.append(String.format("%s %s\n", cmd.getCommand(), String.join(" ", cmd.getArgs())))
                );
                sb.append("```\n\n");
            }

            if (!solution.getExpectedImpacts().isEmpty()) {
                sb.append("### 예상 영향\n");
                solution.getExpectedImpacts().forEach(impact ->
                        sb.append(String.format("- %s\n", impact))
                );
                sb.append("\n");
            }

            sb.append("---\n\n");
        }

        return sb.toString();
    }

    /**
     * LLM 스트리밍 호출 및 WebSocket으로 실시간 토큰 전송
     * LangChain4j 1.8.0 API에 맞게 수정됨
     */
    private String callLLMWithStreaming(String threadId, String promptText) {
        try {
            StringBuilder fullResponse = new StringBuilder();
            CompletableFuture<String> future = new CompletableFuture<>();

            // LangChain4j 1.8.0: StreamingChatResponseHandler 사용
            streamingChatModel.chat(promptText, new StreamingChatResponseHandler() {
                @Override
                public void onPartialResponse(String token) {
                    fullResponse.append(token);

                    // WebSocket으로 스트리밍 청크 전송
                    if (messagingTemplate != null && threadId != null) {
                        try {
                            TroubleResponse chunkResponse = TroubleResponse.builder()
                                    .type(TroubleResponse.ResponseType.STREAMING_CHUNK)
                                    .threadId(threadId)
                                    .message(Message.builder()
                                            .role(MessageRole.ASSISTANT)
                                            .content(token)
                                            .build())
                                    .build();

                            String destination = "/topic/trouble/" + threadId;
                            messagingTemplate.convertAndSend(destination, chunkResponse);
                        } catch (Exception e) {
                            log.warn("Failed to send streaming chunk", e);
                        }
                    }
                }

                @Override
                public void onCompleteResponse(ChatResponse response) {
                    future.complete(fullResponse.toString());
                }

                @Override
                public void onError(Throwable error) {
                    log.error("Streaming error", error);
                    future.completeExceptionally(error);
                }
            });

            // 스트리밍 완료 대기
            return future.join();

        } catch (Exception e) {
            log.error("Error in streaming LLM call, falling back to non-streaming", e);
            // Fallback to non-streaming
            return chatModel.chat(promptText);
        }
    }

    private String getRiskLevelText(String riskLevel) {
        return switch (riskLevel) {
            case "low" -> "🟢 낮음";
            case "medium" -> "🟡 중간";
            case "high" -> "🟠 높음";
            case "critical" -> "🔴 매우 높음";
            default -> "⚪ 알 수 없음";
        };
    }
}