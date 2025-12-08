라이브러리 문서를 확인해보겠습니다.이제 LangGraph4j의 최신 API를 확인해보겠습니다.이제 LangGraph4j의 AgentExecutor 예제와 langchain4j 1.8.0의 정확한 API를 확인했습니다. `ChatLanguageModel` 대신 `ChatModel`을 사용해야 하고, LangGraph4j의 AgentExecutor를 활용해야 합니다.이제 정확한 정보를 파악했습니다. 라이브러리 버전과 올바른 API를 사용하여 수정된 예제를 작성하겠습니다.

핵심 변경사항:
1. `ChatLanguageModel` → `ChatModel` (langchain4j 1.x에서 변경됨)
2. `langgraph4j-agent-executor` 사용 시 `org.bsc.langgraph4j.agentexecutor.AgentExecutor` 사용
3. vLLM은 OpenAI 호환 API이므로 `OpenAiChatModel` 사용

# LangGraph4j Tool Calling 예제 (수정본 - langchain4j 1.8.0 + langgraph4j 1.7.4)

확인한 결과, langchain4j 1.x 버전에서는 `ChatLanguageModel`이 `ChatModel`로 변경되었고, langgraph4j는 내장된 `AgentExecutor`를 제공합니다. 수정된 예제입니다.

## 1. build.gradle (의존성)

```groovy
dependencies {
    implementation 'dev.langchain4j:langchain4j:1.8.0'
    implementation 'dev.langchain4j:langchain4j-open-ai:1.8.0'
    implementation 'org.bsc.langgraph4j:langgraph4j-core:1.7.4'
    implementation 'org.bsc.langgraph4j:langgraph4j-langchain4j:1.7.4'  // langchain4j 통합 모듈 추가
    implementation 'org.bsc.langgraph4j:langgraph4j-agent-executor:1.7.4'
    
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'com.fasterxml.jackson.core:jackson-databind'
    
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
}
```

## 2. 도구(Tool) 정의

```java
// tools/WeatherTool.java
package com.example.langgraph.tools;

import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import org.springframework.stereotype.Component;

@Component
public class WeatherTool {

    @Tool("주어진 도시의 현재 날씨 정보를 조회합니다. 도시 이름을 입력하면 온도와 날씨 상태를 반환합니다.")
    public String getWeather(@P("도시 이름") String city) {
        // 실제로는 외부 API 호출
        return switch (city.toLowerCase()) {
            case "서울", "seoul" -> "서울: 맑음, 기온 22°C, 습도 45%";
            case "부산", "busan" -> "부산: 흐림, 기온 24°C, 습도 65%";
            case "제주", "jeju" -> "제주: 비, 기온 20°C, 습도 80%";
            default -> city + ": 정보 없음. 지원 도시: 서울, 부산, 제주";
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

    @Tool("수학 계산을 수행합니다. 두 숫자와 연산자를 입력받아 계산 결과를 반환합니다.")
    public String calculate(
            @P("첫 번째 숫자") double a,
            @P("두 번째 숫자") double b,
            @P("연산자: add, subtract, multiply, divide") String operator) {
        
        double result = switch (operator.toLowerCase()) {
            case "add", "+" -> a + b;
            case "subtract", "-" -> a - b;
            case "multiply", "*" -> a * b;
            case "divide", "/" -> {
                if (b == 0) throw new IllegalArgumentException("0으로 나눌 수 없습니다");
                yield a / b;
            }
            default -> throw new IllegalArgumentException("지원하지 않는 연산자: " + operator);
        };
        
        return String.format("%.2f %s %.2f = %.2f", a, operator, b, result);
    }
}
```

```java
// tools/SearchTool.java
package com.example.langgraph.tools;

import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import org.springframework.stereotype.Component;

@Component
public class SearchTool {

    @Tool("내부 지식베이스에서 정보를 검색합니다. 검색 쿼리를 입력하면 관련 정보를 반환합니다.")
    public String searchKnowledge(@P("검색할 내용") String query) {
        // 실제로는 벡터 DB 검색 등
        if (query.contains("회사") || query.contains("company")) {
            return "회사 정보: ABC Corp는 2010년 설립된 IT 기업, 클라우드 솔루션 제공, 직원 500명";
        } else if (query.contains("제품") || query.contains("product")) {
            return "주요 제품: CloudManager Pro - 클라우드 인프라 관리, DataSync - 실시간 데이터 동기화";
        } else if (query.contains("정책") || query.contains("policy")) {
            return "휴가 정책: 연차 15일, 병가 무제한(진단서 필요), 재택근무 주 3일 가능";
        }
        return "'" + query + "'에 대한 검색 결과를 찾을 수 없습니다.";
    }
}
```

## 3. 통합 도구 클래스 (AgentExecutor에서 사용)

```java
// tools/AllTools.java
package com.example.langgraph.tools;

import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;

/**
 * AgentExecutor.toolsFromObject() 에 전달할 통합 도구 클래스
 */
public class AllTools {

    @Tool("주어진 도시의 현재 날씨 정보를 조회합니다")
    public String getWeather(@P("도시 이름 (예: 서울, 부산, 제주)") String city) {
        return switch (city.toLowerCase()) {
            case "서울", "seoul" -> "서울: 맑음, 기온 22°C, 습도 45%";
            case "부산", "busan" -> "부산: 흐림, 기온 24°C, 습도 65%";
            case "제주", "jeju" -> "제주: 비, 기온 20°C, 습도 80%";
            default -> city + ": 정보 없음";
        };
    }

    @Tool("수학 계산을 수행합니다")
    public String calculate(
            @P("첫 번째 숫자") double a,
            @P("두 번째 숫자") double b,
            @P("연산자: add, subtract, multiply, divide") String operator) {
        
        double result = switch (operator.toLowerCase()) {
            case "add" -> a + b;
            case "subtract" -> a - b;
            case "multiply" -> a * b;
            case "divide" -> b != 0 ? a / b : 0;
            default -> 0;
        };
        return String.format("%.2f %s %.2f = %.2f", a, operator, b, result);
    }

    @Tool("내부 지식베이스에서 정보를 검색합니다")
    public String searchKnowledge(@P("검색 쿼리") String query) {
        if (query.contains("회사")) {
            return "회사 정보: ABC Corp, 2010년 설립, IT 기업, 직원 500명";
        } else if (query.contains("제품")) {
            return "주요 제품: CloudManager Pro, DataSync";
        } else if (query.contains("정책")) {
            return "휴가 정책: 연차 15일, 재택근무 주 3일";
        }
        return "검색 결과 없음: " + query;
    }
}
```

## 4. LangGraph Config (ChatModel 사용)

```java
// config/LangGraphConfig.java
package com.example.langgraph.config;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class LangGraphConfig {

    @Value("${vllm.base-url:http://localhost:8000/v1}")
    private String vllmBaseUrl;

    @Value("${vllm.model-name:gpt-oss}")
    private String modelName;

    @Value("${vllm.api-key:EMPTY}")
    private String apiKey;

    @Bean
    public ChatModel chatModel() {
        return OpenAiChatModel.builder()
                .baseUrl(vllmBaseUrl)
                .apiKey(apiKey)
                .modelName(modelName)
                .temperature(0.0)
                .timeout(Duration.ofSeconds(120))
                .maxRetries(2)
                .logRequests(true)
                .logResponses(true)
                .build();
    }
}
```

## 5. Agent Service (AgentExecutor 사용)

```java
// service/AgentService.java
package com.example.langgraph.service;

import com.example.langgraph.tools.AllTools;
import dev.langchain4j.model.chat.ChatModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bsc.langgraph4j.CompiledGraph;
import org.bsc.langgraph4j.RunnableConfig;
import org.bsc.langgraph4j.agentexecutor.AgentExecutor;
import org.bsc.langgraph4j.state.AgentState;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AgentService {

    private final ChatModel chatModel;
    private CompiledGraph<AgentExecutor.State> compiledAgent;

    @PostConstruct
    public void init() throws Exception {
        // AgentExecutor 빌드 - 내장된 ReACT Agent 사용
        var stateGraph = AgentExecutor.builder()
                .chatModel(chatModel)
                .toolsFromObject(new AllTools())  // 도구 클래스 등록
                .build();

        // 그래프 컴파일
        this.compiledAgent = stateGraph.compile();
        
        log.info("LangGraph4j AgentExecutor 초기화 완료");
    }

    /**
     * 동기 방식 Agent 실행
     */
    public String runAgent(String userInput) {
        log.info("Agent 실행 시작: {}", userInput);
        
        try {
            // RunnableConfig 설정
            RunnableConfig config = RunnableConfig.builder()
                    .threadId("thread-" + System.currentTimeMillis())
                    .build();

            // 초기 상태 - messages 키에 사용자 입력
            Map<String, Object> initialState = Map.of(
                    "messages", userInput
            );

            // invoke로 실행하고 최종 상태 획득
            Optional<AgentExecutor.State> finalState = compiledAgent.invoke(initialState, config);

            if (finalState.isPresent()) {
                AgentExecutor.State state = finalState.get();
                // agent_response 또는 messages에서 최종 응답 추출
                String response = state.agentResponse().orElse("");
                if (response.isEmpty()) {
                    // messages 리스트에서 마지막 AI 메시지 추출
                    var messages = state.messages();
                    if (!messages.isEmpty()) {
                        var lastMessage = messages.get(messages.size() - 1);
                        response = lastMessage.toString();
                    }
                }
                log.info("Agent 실행 완료");
                return response;
            }
            
            return "응답을 생성할 수 없습니다.";
            
        } catch (Exception e) {
            log.error("Agent 실행 실패", e);
            return "오류 발생: " + e.getMessage();
        }
    }

    /**
     * 스트리밍 방식 Agent 실행
     */
    public void runAgentStreaming(String userInput, java.util.function.Consumer<String> onStep) {
        log.info("Agent 스트리밍 실행: {}", userInput);
        
        try {
            RunnableConfig config = RunnableConfig.builder()
                    .threadId("thread-" + System.currentTimeMillis())
                    .build();

            Map<String, Object> initialState = Map.of("messages", userInput);

            // stream()으로 각 단계별 상태 출력
            for (var nodeOutput : compiledAgent.stream(initialState, config)) {
                String nodeName = nodeOutput.node();
                AgentExecutor.State state = nodeOutput.state();
                
                log.debug("Node: {}, State: {}", nodeName, state);
                onStep.accept(String.format("[%s] 처리 중...", nodeName));
                
                // __END__ 노드에서 최종 응답
                if ("__END__".equals(nodeName)) {
                    String response = state.agentResponse().orElse("완료");
                    onStep.accept("최종 답변: " + response);
                }
            }
            
        } catch (Exception e) {
            log.error("Agent 스트리밍 실행 실패", e);
            onStep.accept("오류: " + e.getMessage());
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

@RestController
@RequestMapping("/api/agent")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;

    @PostMapping("/chat")
    public ChatResponse chat(@RequestBody ChatRequest request) {
        String response = agentService.runAgent(request.message());
        return new ChatResponse(response);
    }

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
    org.bsc.langgraph4j: DEBUG
```

## 8. 테스트 코드

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
        String response = agentService.runAgent("서울 날씨 어때?");
        System.out.println("응답: " + response);
    }

    @Test
    void testCalculation() {
        String response = agentService.runAgent("123 곱하기 456 계산해줘");
        System.out.println("응답: " + response);
    }

    @Test
    void testKnowledgeSearch() {
        String response = agentService.runAgent("회사 정보 알려줘");
        System.out.println("응답: " + response);
    }

    @Test
    void testMultipleTools() {
        String response = agentService.runAgent(
            "서울 날씨 확인하고, 100 더하기 200도 계산해줘"
        );
        System.out.println("응답: " + response);
    }

    @Test
    void testStreaming() {
        agentService.runAgentStreaming("부산 날씨 알려줘", step -> {
            System.out.println("STEP: " + step);
        });
    }
}
```

## 실행 흐름

```
사용자: "서울 날씨 알려줘"
    ↓
[START] → [agent 노드] (LLM 호출, Tool 선택)
    ↓
LLM 응답: getWeather("서울") 호출 필요
    ↓
[action 노드] → getWeather 실행
    ↓
Tool 결과: "서울: 맑음, 기온 22°C..."
    ↓
[agent 노드] → Tool 결과 기반 최종 답변 생성
    ↓
[END] → "서울의 현재 날씨는 맑고 기온은 22도입니다..."
```

## 주요 변경 포인트

| 항목 | 이전 (잘못됨) | 수정 후 (올바름) |
|------|--------------|----------------|
| 모델 인터페이스 | `ChatLanguageModel` | `ChatModel` |
| 빌더 | 직접 StateGraph 구성 | `AgentExecutor.builder()` 사용 |
| Tool 등록 | 수동 ToolSpecification | `.toolsFromObject(new AllTools())` |
| 상태 클래스 | 커스텀 AgentState | `AgentExecutor.State` (내장) |

이제 라이브러리 버전에 맞는 올바른 API를 사용하고 있습니다. `langgraph4j-agent-executor`의 내장 `AgentExecutor`가 ReACT 패턴(LLM → Tool → LLM → 최종응답)을 자동으로 처리해줍니다.