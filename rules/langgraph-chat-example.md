제공해주신 **LangGraph 아키텍처 설계 문서**를 바탕으로, `org.bsc.langgraph4j` (1.7.x 버전 기준)와 Spring Boot, LangChain4j를 활용한 **Ceph 진단 AI 시스템**의 핵심 구현 코드를 작성해 드립니다.

이 코드는 다음 핵심 기능을 포함합니다:

1.  **CephDiagnosisState**: 문서의 '2. 상태 모델링'을 반영한 상태 객체.
2.  **ToolSet**: '3. 도구 기반 정보 수집'을 위한 Mock 도구.
3.  **Graph Configuration**: '4. 조건 분기와 라우팅' 및 '7. Human-in-the-Loop'가 적용된 그래프 정의.
4.  **Controller**: SSE 스트리밍 및 승인 처리를 위한 엔드포인트.

-----

### 1\. Maven Dependencies (`pom.xml`)

`langgraph4j`와 `langchain4j` 관련 의존성을 추가합니다.

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <dependency>
        <groupId>org.bsc.langgraph4j</groupId>
        <artifactId>langgraph4j-core</artifactId>
        <version>1.7.4</version> </dependency>
    
    <dependency>
        <groupId>org.bsc.langgraph4j</groupId>
        <artifactId>langgraph4j-langchain4j</artifactId>
        <version>1.7.4</version>
    </dependency>

    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-open-ai-spring-boot-starter</artifactId>
        <version>0.35.0</version>
    </dependency>
    
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```

-----

### 2\. State Definition (`CephDiagnosisState.java`)

설계 문서의 **Context Window 최적화** 전략에 따라 Raw 데이터와 LLM용 요약 데이터를 관리하는 상태 클래스입니다.

```java
package com.example.cephai.state;

import org.bsc.langgraph4j.state.AgentState;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.util.Map;
import java.util.HashMap;

@Data
@EqualsAndHashCode(callSuper = true)
public class CephDiagnosisState extends AgentState {

    // 설계 문서: Raw 데이터 (LLM에 직접 전달 안 함)
    private Map<String, Object> rawCephData = new HashMap<>();
    
    // 설계 문서: 진단 결과 및 실행 제어
    private String pendingAction; // 승인 대기 중인 작업 (예: "osd_out")
    private boolean requiresApproval;
    private boolean approved;
    private String diagnosisResult;

    public CephDiagnosisState(Map<String, Object> initData) {
        super(initData);
    }
}
```

-----

### 3\. Tools Definition (`CephToolSet.java`)

설계 문서의 **Tool Set 구성**을 반영하여, 에이전트가 호출할 수 있는 Ceph 명령 도구들을 정의합니다.

```java
package com.example.cephai.tools;

import dev.langchain4j.agent.tool.Tool;
import org.springframework.stereotype.Component;

@Component
public class CephToolSet {

    // Read-Only: 자동 실행 가능
    @Tool("Ceph 클러스터의 전체 건강 상태(health)를 조회합니다.")
    public String fetchCephHealth() {
        // 실제로는 `ceph status` 명령 실행
        return "{ \"status\": \"HEALTH_WARN\", \"details\": \"OSD.3 is down\" }";
    }

    @Tool("특정 OSD의 상세 로그를 조회합니다.")
    public String fetchOsdLog(int osdId) {
        return "[OSD." + osdId + "] 2024-11-24 10:00:00 ERROR: structured_read_error on /dev/sdb";
    }

    // Write: 승인 필요 (Human-in-the-Loop 대상)
    @Tool("OSD를 클러스터에서 제외(out) 시킵니다. 위험한 작업입니다.")
    public String osdOut(int osdId) {
        return "Command executed: ceph osd out " + osdId;
    }
}
```

-----

### 4\. Graph Configuration (`CephGraphConfig.java`)

이 부분이 핵심입니다. **상태 그래프, 조건 분기, 체크포인트** 설정을 포함합니다.

```java
package com.example.cephai.config;

import com.example.cephai.state.CephDiagnosisState;
import com.example.cephai.tools.CephToolSet;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.service.tool.ToolExecutor;
import org.bsc.langgraph4j.StateGraph;
import org.bsc.langgraph4j.CompiledGraph;
import org.bsc.langgraph4j.action.EdgeAction;
import org.bsc.langgraph4j.checkpoint.MemorySaver; // 실제 운영시 PostgresSaver 사용
import org.bsc.langgraph4j.prebuilt.ToolNode;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;

import static org.bsc.langgraph4j.StateGraph.END;
import static org.bsc.langgraph4j.StateGraph.START;

@Configuration
public class CephGraphConfig {

    private final ChatLanguageModel chatModel;
    private final CephToolSet cephToolSet;

    public CephGraphConfig(ChatLanguageModel chatModel, CephToolSet cephToolSet) {
        this.chatModel = chatModel;
        this.cephToolSet = cephToolSet;
    }

    @Bean
    public CompiledGraph<CephDiagnosisState> cephDiagnosisGraph() throws Exception {
        
        // 1. 그래프 생성 (State 정의)
        var workflow = new StateGraph<>(CephDiagnosisState::new);

        // 2. 노드 정의
        // (A) Agent Node: LLM이 상황을 판단하고 Tool을 호출하거나 답변 생성
        workflow.addNode("agent", state -> {
            // 여기서 LangChain4j AiServices 등을 이용해 LLM 호출 로직 구현
            // 예시 단순화: 마지막 메시지를 보고 Tool 호출 여부 결정 로직이 들어감
            // 실제 구현에서는 ToolCallingAgent 로직을 사용합니다.
            System.out.println(">>> Agent Reasoning...");
            return Map.of("last_agent_thought", "Analyzing request...");
        });

        // (B) Tools Node: CephToolSet 실행
        // LangGraph4j의 유틸리티를 사용하거나 직접 구현
        // 여기서는 개념적으로 Tool 실행 노드 정의
        workflow.addNode("tools", new ToolNode(cephToolSet));

        // (C) Human Approval Node: 승인 대기 상태 처리
        workflow.addNode("wait_for_approval", state -> {
            System.out.println("!!! Waiting for Human Approval for: " + state.getPendingAction());
            // 이 노드는 실행 후 상태만 업데이트하고 멈춥니다 (interruptBefore로 제어)
            return Map.of("requiresApproval", true);
        });
        
        // (D) Execution Node: 승인된 위험 작업 실행
        workflow.addNode("execute_solution", state -> {
            System.out.println(">>> Executing Approved Action: " + state.getPendingAction());
            // 실제 ceph osd out 등의 로직 수행
            return Map.of("diagnosisResult", "Action Executed Successfully");
        });

        // 3. 엣지 및 조건부 라우팅 (설계 문서 4. 조건 분기)
        workflow.addEdge(START, "agent");

        // Agent -> 다음 단계 결정 (Conditional Edge)
        workflow.addConditionalEdge("agent",
            state -> {
                // 로직: LLM이 Tool 호출을 원하면 "tools"
                // LLM이 위험 작업(Write)을 제안하면 "check_safety"
                // 답변이 완료되었으면 END
                
                // *예시 로직*
                boolean isToolCall = checkIfToolCall(state);
                if (isToolCall) return "tools";
                
                boolean isDangerous = checkIfDangerousAction(state);
                if (isDangerous) return "wait_for_approval";
                
                return END;
            },
            Map.of(
                "tools", "tools",
                "wait_for_approval", "wait_for_approval",
                END, END
            )
        );

        // Tools 실행 후 다시 Agent로 복귀
        workflow.addEdge("tools", "agent");

        // 승인 대기 후 -> (승인 여부에 따라 분기)
        workflow.addConditionalEdge("wait_for_approval",
            state -> state.isApproved() ? "execute" : "reject",
            Map.of(
                "execute", "execute_solution",
                "reject", END // 혹은 다시 agent로 가서 "거절됨" 알림
            )
        );
        
        workflow.addEdge("execute_solution", END);

        // 4. 컴파일 (체크포인트 설정 포함)
        // 설계 문서: PostgresSaver 사용 -> 여기서는 MemorySaver로 대체
        return workflow.compile(
            org.bsc.langgraph4j.CompileConfig.builder()
                .checkpointSaver(new MemorySaver()) 
                .interruptBefore("wait_for_approval") // 이 노드 실행 전 멈춤 (Human-in-the-Loop)
                .build()
        );
    }

    // 헬퍼 메서드 (Stub)
    private boolean checkIfToolCall(CephDiagnosisState state) { return false; /* 실제 구현 필요 */ }
    private boolean checkIfDangerousAction(CephDiagnosisState state) { return false; /* 실제 구현 필요 */ }
}
```

-----

### 5\. Service & Controller (`DiagnosisController.java`)

SSE 스트리밍과 사용자 승인 입력을 처리하는 컨트롤러입니다. 설계 문서의 **8. 스트리밍**과 **7. 승인 플로우**를 구현합니다.

```java
package com.example.cephai.controller;

import com.example.cephai.state.CephDiagnosisState;
import org.bsc.langgraph4j.CompiledGraph;
import org.bsc.langgraph4j.RunnableConfig;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/ceph")
public class DiagnosisController {

    private final CompiledGraph<CephDiagnosisState> graph;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    public DiagnosisController(CompiledGraph<CephDiagnosisState> graph) {
        this.graph = graph;
    }

    // 1. 진단 시작 (SSE 스트리밍)
    @GetMapping(value = "/diagnose", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter diagnose(@RequestParam String threadId, @RequestParam String query) {
        SseEmitter emitter = new SseEmitter(60000L);

        executor.submit(() -> {
            try {
                // 초기 입력 설정
                var inputs = Map.of("messages", query);
                
                // 세션 ID 설정 (Thread ID)
                var config = RunnableConfig.builder()
                        .threadId(threadId)
                        .build();

                // 그래프 스트리밍 실행
                graph.stream(inputs, config).forEach(nodeOutput -> {
                    try {
                        // 설계 문서: 진행 상황 실시간 전달
                        // Node 이름과 결과 데이터를 스트리밍
                        String eventData = nodeOutput.node() + ": " + nodeOutput.state().toString();
                        emitter.send(SseEmitter.event().name("progress").data(eventData));
                        
                        // 만약 승인 대기 상태에 도달했다면 클라이언트에 알림
                        if ("wait_for_approval".equals(nodeOutput.node())) {
                            emitter.send(SseEmitter.event().name("approval_required").data("Action required"));
                        }
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                });

                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    // 2. 작업 승인 (Human-in-the-Loop)
    @PostMapping("/approve")
    public String approveAction(@RequestParam String threadId, @RequestParam boolean approved) {
        var config = RunnableConfig.builder()
                .threadId(threadId)
                .build();

        // 승인 상태 업데이트와 함께 그래프 재개
        // updateState를 통해 현재 State에 approved 플래그 주입
        // LangGraph4j 에서는 상태 업데이트 후 invoke/stream을 호출하여 interrupt 된 지점부터 재개
        
        Map<String, Object> update = Map.of("approved", approved);
        graph.updateState(config, update); 
        
        // 멈춘 지점("wait_for_approval") 다음부터 실행 재개
        // 별도의 스레드나 비동기로 실행 결과를 다시 스트리밍으로 보낼 수도 있음
        executor.submit(() -> {
             graph.invoke(Map.of(), config); 
        });

        return approved ? "Approved. Resuming execution..." : "Rejected. Stopping.";
    }
}
```

### 코드 구현의 주요 포인트 설명

1.  **상태 분리 (`CephDiagnosisState`)**:

    * 설계 문서에 명시된 대로 `rawCephData` 필드를 두어 대용량 데이터는 메모리에만 유지하고, 실제 LLM 추론에는 필요한 요약 정보만 메시지로 변환하여 전달하는 구조를 잡을 수 있습니다.

2.  **안전한 실행 흐름 (`addConditionalEdge`)**:

    * `agent` 노드에서 도구 호출이 필요한지 판단합니다.
    * 도구가 'Read-Only'(정보 조회)인 경우 `tools` 노드로 바로 이동하여 자동 실행합니다.
    * 도구가 'Write'(설정 변경)인 경우, `wait_for_approval` 노드로 라우팅되도록 조건부 엣지를 설정합니다.

3.  **인터럽트 및 재개 (`CompileConfig`)**:

    * `interruptBefore("wait_for_approval")` 설정을 통해, 위험 작업 실행 직전에 그래프 실행이 **자동으로 일시 정지**됩니다. 상태는 `Saver`(Checkpoint)에 저장됩니다.
    * 사용자가 `/approve` API를 호출하면, `threadId`를 통해 저장된 상태를 불러오고, 승인 플래그를 업데이트한 뒤 중단된 지점부터 다시 실행합니다.

4.  **확장성**:

    * 주석 처리된 `PostgresSaver`를 실제 DB 연동 구현체로 교체하면 설계 문서의 **5. 체크포인트와 세션 관리** 기능이 완성되어 서버 재시작 후에도 대화를 이어갈 수 있습니다.