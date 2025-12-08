# LangGraph4j Tool Calling 예제 (Spring Boot + vLLM)

LangGraph4j를 사용한 Tool Calling 예제를 만들어드릴게요. 3가지 도구를 정의하고, LLM이 도구 선택 → 호출 → 최종 답변 생성하는 흐름으로 구성합니다.

## 1. 프로젝트 구조

```
src/main/java/com/example/langgraph/
├── config/
│   └── LangGraphConfig.java
├── tools/
│   ├── WeatherTool.java
│   ├── CalculatorTool.java
│   └── SearchTool.java
├── agent/
│   └── ToolCallingAgent.java
├── service/
│   └── AgentService.java
└── controller/
    └── AgentController.java
```

## 2. 도구 정의

```java
// tools/WeatherTool.java
package com.example.langgraph.tools;

import dev.langchain4j.agent.tool.Tool;
import org.springframework.stereotype.Component;

@Component
public class WeatherTool {

    @Tool(name = "get_weather", 
          value = "주어진 도시의 현재 날씨 정보를 조회합니다. 도시 이름을 입력받아 온도, 날씨 상태를 반환합니다.")
    public String getWeather(String city) {
        // 실제로는 외부 API 호출
        // 여기서는 예시로 mock 데이터 반환
        return switch (city.toLowerCase()) {
            case "서울", "seoul" -> "서울: 맑음, 기온 22°C, 습도 45%";
            case "부산", "busan" -> "부산: 흐림, 기온 24°C, 습도 65%";
            case "제주", "jeju" -> "제주: 비, 기온 20°C, 습도 80%";
            default -> city + ": 정보 없음. 지원되는 도시: 서울, 부산, 제주";
        };
    }
}
```

```java
// tools/CalculatorTool.java
package com.example.langgraph.tools;

import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import org.springframework.stereotype.Component;

@Component
public class CalculatorTool {

    @Tool(name = "calculate", 
          value = "수학 계산을 수행합니다. 두 숫자와 연산자(add, subtract, multiply, divide)를 입력받습니다.")
    public String calculate(
            @P("첫 번째 숫자") double a,
            @P("두 번째 숫자") double b,
            @P("연산자: add, subtract, multiply, divide 중 하나") String operator) {
        
        double result = switch (operator.toLowerCase()) {
            case "add", "+" -> a + b;
            case "subtract", "-" -> a - b;
            case "multiply", "*" -> a * b;
            case "divide", "/" -> {
                if (b == 0) throw new IllegalArgumentException("0으로 나눌 수 없습니다.");
                yield a / b;
            }
            default -> throw new IllegalArgumentException("지원하지 않는 연산자: " + operator);
        };
        
        return String.format("계산 결과: %.2f %s %.2f = %.2f", a, operator, b, result);
    }
}
```

```java
// tools/SearchTool.java
package com.example.langgraph.tools;

import dev.langchain4j.agent.tool.Tool;
import org.springframework.stereotype.Component;

@Component
public class SearchTool {

    @Tool(name = "search_knowledge", 
          value = "내부 지식 베이스에서 정보를 검색합니다. 검색 쿼리를 입력받아 관련 정보를 반환합니다.")
    public String searchKnowledge(String query) {
        // 실제로는 벡터 DB 검색 등 수행
        // 여기서는 mock 데이터 반환
        if (query.contains("회사") || query.contains("company")) {
            return "회사 정보: ABC Corp는 2010년 설립된 IT 기업으로, 클라우드 솔루션을 제공합니다. 직원 수 500명, 본사는 서울에 위치합니다.";
        } else if (query.contains("제품") || query.contains("product")) {
            return "주요 제품: CloudManager Pro - 클라우드 인프라 관리 솔루션, DataSync - 실시간 데이터 동기화 서비스";
        } else if (query.contains("정책") || query.contains("policy")) {
            return "휴가 정책: 연차 15일, 병가 무제한(진단서 필요), 재택근무 주 3일 가능";
        }
        return "'" + query + "'에 대한 검색 결과를 찾을 수 없습니다.";
    }
}
```

## 3. LangGraph 설정

```java
// config/LangGraphConfig.java
package com.example.langgraph.config;

import com.example.langgraph.tools.CalculatorTool;
import com.example.langgraph.tools.SearchTool;
import com.example.langgraph.tools.WeatherTool;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.service.tool.ToolProvider;
import dev.langchain4j.service.tool.ToolProviderResult;
import dev.langchain4j.agent.tool.ToolSpecification;
import dev.langchain4j.agent.tool.ToolSpecifications;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.List;

@Configuration
public class LangGraphConfig {

    @Value("${vllm.base-url:http://localhost:8000/v1}")
    private String vllmBaseUrl;

    @Value("${vllm.model-name:gpt-oss}")
    private String modelName;

    @Value("${vllm.api-key:EMPTY}")
    private String apiKey;

    @Bean
    public ChatLanguageModel chatLanguageModel() {
        return OpenAiChatModel.builder()
                .baseUrl(vllmBaseUrl)
                .apiKey(apiKey)
                .modelName(modelName)
                .temperature(0.0)
                .timeout(Duration.ofSeconds(60))
                .logRequests(true)
                .logResponses(true)
                .build();
    }

    @Bean
    public List<ToolSpecification> toolSpecifications(
            WeatherTool weatherTool,
            CalculatorTool calculatorTool,
            SearchTool searchTool) {
        
        List<ToolSpecification> specs = new java.util.ArrayList<>();
        specs.addAll(ToolSpecifications.toolSpecificationsFrom(weatherTool));
        specs.addAll(ToolSpecifications.toolSpecificationsFrom(calculatorTool));
        specs.addAll(ToolSpecifications.toolSpecificationsFrom(searchTool));
        return specs;
    }
}
```

## 4. Agent Executor 구현

```java
// agent/ToolCallingAgent.java
package com.example.langgraph.agent;

import dev.langchain4j.agent.tool.ToolExecutionRequest;
import dev.langchain4j.agent.tool.ToolSpecification;
import dev.langchain4j.data.message.*;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.output.Response;
import lombok.extern.slf4j.Slf4j;
import org.bsc.langgraph4j.StateGraph;
import org.bsc.langgraph4j.action.EdgeAction;
import org.bsc.langgraph4j.action.NodeAction;
import org.bsc.langgraph4j.state.AgentState;
import org.bsc.langgraph4j.state.AppenderChannel;
import org.bsc.langgraph4j.state.Channel;
import org.springframework.stereotype.Component;

import java.util.*;

import static org.bsc.langgraph4j.StateGraph.END;
import static org.bsc.langgraph4j.StateGraph.START;

@Slf4j
@Component
public class ToolCallingAgent {

    private final ChatLanguageModel chatModel;
    private final List<ToolSpecification> toolSpecifications;
    private final Map<String, Object> toolExecutors;

    public ToolCallingAgent(
            ChatLanguageModel chatModel,
            List<ToolSpecification> toolSpecifications,
            com.example.langgraph.tools.WeatherTool weatherTool,
            com.example.langgraph.tools.CalculatorTool calculatorTool,
            com.example.langgraph.tools.SearchTool searchTool) {
        
        this.chatModel = chatModel;
        this.toolSpecifications = toolSpecifications;
        
        // 도구 실행기 매핑
        this.toolExecutors = Map.of(
            "get_weather", weatherTool,
            "calculate", calculatorTool,
            "search_knowledge", searchTool
        );
    }

    // Agent State 정의
    public static class ToolAgentState extends AgentState {
        
        public ToolAgentState(Map<String, Object> initData) {
            super(initData);
        }

        public List<ChatMessage> messages() {
            return value("messages", Collections.emptyList());
        }

        public String input() {
            return value("input", "");
        }

        public String output() {
            return value("output", "");
        }

        public List<ToolExecutionRequest> pendingToolCalls() {
            return value("pending_tool_calls", Collections.emptyList());
        }

        // State Channel 정의
        public static Map<String, Channel<?>> SCHEMA = Map.of(
            "messages", AppenderChannel.<ChatMessage>of(ArrayList::new),
            "input", Channel.of(() -> ""),
            "output", Channel.of(() -> ""),
            "pending_tool_calls", Channel.of(ArrayList::new)
        );
    }

    // 그래프 빌드
    public StateGraph<ToolAgentState> buildGraph() throws Exception {
        
        return new StateGraph<>(ToolAgentState.SCHEMA, ToolAgentState::new)
            // 노드 추가
            .addNode("agent", agentNode())
            .addNode("tools", toolsNode())
            
            // 엣지 정의
            .addEdge(START, "agent")
            .addConditionalEdges("agent", shouldContinue(), 
                Map.of(
                    "tools", "tools",
                    "end", END
                ))
            .addEdge("tools", "agent");
    }

    // Agent 노드: LLM 호출하여 도구 사용 여부 결정
    private NodeAction<ToolAgentState> agentNode() {
        return state -> {
            log.info("=== Agent Node 실행 ===");
            
            List<ChatMessage> messages = new ArrayList<>(state.messages());
            
            // 첫 호출이면 사용자 입력 추가
            if (messages.isEmpty()) {
                messages.add(SystemMessage.from("""
                    당신은 도움이 되는 AI 어시스턴트입니다.
                    사용자의 질문에 답하기 위해 필요한 경우 도구를 사용하세요.
                    도구를 사용한 후에는 그 결과를 바탕으로 최종 답변을 생성하세요.
                    """));
                messages.add(UserMessage.from(state.input()));
            }

            // LLM 호출 (도구 명세 포함)
            Response<AiMessage> response = chatModel.generate(messages, toolSpecifications);
            AiMessage aiMessage = response.content();
            
            log.info("LLM 응답: {}", aiMessage);

            // 상태 업데이트
            List<ChatMessage> updatedMessages = new ArrayList<>(messages);
            updatedMessages.add(aiMessage);

            Map<String, Object> updates = new HashMap<>();
            updates.put("messages", updatedMessages);
            
            if (aiMessage.hasToolExecutionRequests()) {
                updates.put("pending_tool_calls", aiMessage.toolExecutionRequests());
                log.info("도구 호출 요청: {}", aiMessage.toolExecutionRequests());
            } else {
                updates.put("pending_tool_calls", Collections.emptyList());
                updates.put("output", aiMessage.text());
                log.info("최종 답변: {}", aiMessage.text());
            }

            return updates;
        };
    }

    // Tools 노드: 도구 실행
    private NodeAction<ToolAgentState> toolsNode() {
        return state -> {
            log.info("=== Tools Node 실행 ===");
            
            List<ToolExecutionRequest> toolCalls = state.pendingToolCalls();
            List<ChatMessage> messages = new ArrayList<>(state.messages());

            for (ToolExecutionRequest request : toolCalls) {
                String toolName = request.name();
                String arguments = request.arguments();
                
                log.info("도구 실행: {} with args: {}", toolName, arguments);
                
                String result = executeToolCall(toolName, arguments);
                
                log.info("도구 결과: {}", result);
                
                // ToolExecutionResultMessage 추가
                ToolExecutionResultMessage resultMessage = ToolExecutionResultMessage.from(
                    request,
                    result
                );
                messages.add(resultMessage);
            }

            return Map.of(
                "messages", messages,
                "pending_tool_calls", Collections.emptyList()
            );
        };
    }

    // 조건부 엣지: 도구 호출 필요 여부 판단
    private EdgeAction<ToolAgentState> shouldContinue() {
        return state -> {
            List<ToolExecutionRequest> pendingCalls = state.pendingToolCalls();
            if (pendingCalls != null && !pendingCalls.isEmpty()) {
                log.info("도구 호출 필요 → tools 노드로 이동");
                return "tools";
            }
            log.info("도구 호출 불필요 → 종료");
            return "end";
        };
    }

    // 도구 실행 헬퍼
    private String executeToolCall(String toolName, String argumentsJson) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = 
                new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> args = mapper.readValue(argumentsJson, Map.class);

            return switch (toolName) {
                case "get_weather" -> {
                    var tool = (com.example.langgraph.tools.WeatherTool) toolExecutors.get(toolName);
                    yield tool.getWeather((String) args.get("arg0"));
                }
                case "calculate" -> {
                    var tool = (com.example.langgraph.tools.CalculatorTool) toolExecutors.get(toolName);
                    yield tool.calculate(
                        ((Number) args.get("a")).doubleValue(),
                        ((Number) args.get("b")).doubleValue(),
                        (String) args.get("operator")
                    );
                }
                case "search_knowledge" -> {
                    var tool = (com.example.langgraph.tools.SearchTool) toolExecutors.get(toolName);
                    yield tool.searchKnowledge((String) args.get("arg0"));
                }
                default -> "알 수 없는 도구: " + toolName;
            };
        } catch (Exception e) {
            log.error("도구 실행 실패", e);
            return "도구 실행 오류: " + e.getMessage();
        }
    }
}
```

## 5. Service 레이어

```java
// service/AgentService.java
package com.example.langgraph.service;

import com.example.langgraph.agent.ToolCallingAgent;
import com.example.langgraph.agent.ToolCallingAgent.ToolAgentState;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bsc.langgraph4j.CompiledGraph;
import org.bsc.langgraph4j.RunnableConfig;
import org.bsc.langgraph4j.StateGraph;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AgentService {

    private final ToolCallingAgent toolCallingAgent;
    private CompiledGraph<ToolAgentState> compiledGraph;

    @PostConstruct
    public void init() throws Exception {
        StateGraph<ToolAgentState> graph = toolCallingAgent.buildGraph();
        this.compiledGraph = graph.compile();
        log.info("LangGraph Agent 초기화 완료");
    }

    public String runAgent(String userInput) {
        log.info("Agent 실행 시작: {}", userInput);
        
        try {
            // 초기 상태 설정
            Map<String, Object> initialState = Map.of(
                "input", userInput,
                "messages", new java.util.ArrayList<>(),
                "output", "",
                "pending_tool_calls", new java.util.ArrayList<>()
            );

            // 그래프 실행
            RunnableConfig config = RunnableConfig.builder()
                .threadId("thread-" + System.currentTimeMillis())
                .build();

            // invoke로 최종 상태 얻기
            Optional<ToolAgentState> finalState = compiledGraph.invoke(initialState, config);

            if (finalState.isPresent()) {
                String output = finalState.get().output();
                log.info("Agent 실행 완료: {}", output);
                return output;
            }
            
            return "응답을 생성할 수 없습니다.";
            
        } catch (Exception e) {
            log.error("Agent 실행 실패", e);
            return "오류 발생: " + e.getMessage();
        }
    }

    // 스트리밍 버전
    public void runAgentStreaming(String userInput, 
                                  java.util.function.Consumer<String> onStep) {
        log.info("Agent 스트리밍 실행 시작: {}", userInput);
        
        try {
            Map<String, Object> initialState = Map.of(
                "input", userInput,
                "messages", new java.util.ArrayList<>(),
                "output", "",
                "pending_tool_calls", new java.util.ArrayList<>()
            );

            RunnableConfig config = RunnableConfig.builder()
                .threadId("thread-" + System.currentTimeMillis())
                .build();

            // stream으로 각 단계 출력
            var stateIterator = compiledGraph.stream(initialState, config);
            
            stateIterator.forEachRemaining(nodeOutput -> {
                String nodeName = nodeOutput.node();
                ToolAgentState state = nodeOutput.state();
                
                String stepInfo = String.format("[%s] 처리 중...", nodeName);
                onStep.accept(stepInfo);
                
                if ("agent".equals(nodeName) && !state.output().isEmpty()) {
                    onStep.accept("최종 답변: " + state.output());
                }
            });
            
        } catch (Exception e) {
            log.error("Agent 스트리밍 실행 실패", e);
            onStep.accept("오류 발생: " + e.getMessage());
        }
    }
}
```

## 6. REST Controller

```java
// controller/AgentController.java
package com.example.langgraph.controller;

import com.example.langgraph.service.AgentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.time.Duration;

@RestController
@RequestMapping("/api/agent")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;

    // 일반 요청
    @PostMapping("/chat")
    public ChatResponse chat(@RequestBody ChatRequest request) {
        String response = agentService.runAgent(request.message());
        return new ChatResponse(response);
    }

    // SSE 스트리밍
    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> chatStream(@RequestBody ChatRequest request) {
        return Flux.create(sink -> {
            agentService.runAgentStreaming(request.message(), step -> {
                sink.next(step);
            });
            sink.complete();
        });
    }

    public record ChatRequest(String message) {}
    public record ChatResponse(String response) {}
}
```

## 7. application.yml

```yaml
# application.yml
server:
  port: 8080

vllm:
  base-url: http://localhost:8000/v1
  model-name: gpt-oss
  api-key: EMPTY

logging:
  level:
    com.example.langgraph: DEBUG
    dev.langchain4j: DEBUG
```

## 8. 테스트

```java
// test/AgentServiceTest.java
package com.example.langgraph;

import com.example.langgraph.service.AgentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class AgentServiceTest {

    @Autowired
    private AgentService agentService;

    @Test
    void testWeatherQuery() {
        String response = agentService.runAgent("서울 날씨 알려줘");
        System.out.println("응답: " + response);
    }

    @Test
    void testCalculation() {
        String response = agentService.runAgent("123 곱하기 456은 얼마야?");
        System.out.println("응답: " + response);
    }

    @Test
    void testKnowledgeSearch() {
        String response = agentService.runAgent("회사 정보를 알려줘");
        System.out.println("응답: " + response);
    }

    @Test
    void testMultipleTools() {
        String response = agentService.runAgent(
            "서울 날씨 확인하고, 100 더하기 200 계산해줘"
        );
        System.out.println("응답: " + response);
    }
}
```

## 실행 흐름 요약

```
사용자 입력: "서울 날씨 알려줘"
     ↓
[START] → [agent 노드]
     │      - LLM이 도구 필요 여부 판단
     │      - get_weather 도구 호출 결정
     ↓
[shouldContinue] → "tools"
     ↓
[tools 노드]
     │      - get_weather("서울") 실행
     │      - 결과: "서울: 맑음, 기온 22°C..."
     ↓
[agent 노드]
     │      - ToolMessage 포함하여 LLM 재호출
     │      - 최종 답변 생성
     ↓
[shouldContinue] → "end"
     ↓
[END] → 최종 응답 반환
```

이 구조로 LLM이 먼저 어떤 도구를 사용할지 판단하고, 도구 결과를 받아 최종 답변을 생성하는 전형적인 ReAct 패턴이 구현됩니다.