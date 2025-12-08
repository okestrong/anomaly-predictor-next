vLLM은 OpenAI 호환 API를 제공하므로, LangChain4j의 OpenAI 모듈을 사용하면서 `baseUrl`만 vLLM 서버 주소로 변경하면 됩니다.

## Maven 의존성

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
    <version>1.8.0</version>
</dependency>
```

## 기본 사용 예제

```java
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.chat.StreamingChatResponseHandler;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.openai.OpenAiStreamingChatModel;

import java.time.Duration;
import java.util.concurrent.CountDownLatch;

public class VllmStreamingExample {

    public static void main(String[] args) throws InterruptedException {
        // vLLM 서버용 StreamingChatModel 설정
        StreamingChatModel model = OpenAiStreamingChatModel.builder()
                .baseUrl("http://localhost:8000/v1")  // vLLM 서버 주소
                .apiKey("EMPTY")                       // vLLM은 보통 API 키 불필요
                .modelName("gpt-oss")                  // 실제 모델명으로 변경
                .temperature(0.7)
                .maxTokens(2048)
                .timeout(Duration.ofSeconds(120))
                .logRequests(true)
                .logResponses(true)
                .build();

        CountDownLatch latch = new CountDownLatch(1);

        model.chat("한국의 수도에 대해 설명해주세요.", new StreamingChatResponseHandler() {
            
            private final StringBuilder fullResponse = new StringBuilder();

            @Override
            public void onPartialResponse(String partialResponse) {
                System.out.print(partialResponse);
                fullResponse.append(partialResponse);
            }

            @Override
            public void onCompleteResponse(ChatResponse response) {
                System.out.println("\n\n=== 스트리밍 완료 ===");
                System.out.println("전체 응답 길이: " + fullResponse.length() + " 글자");
                System.out.println("Finish Reason: " + response.finishReason());
                latch.countDown();
            }

            @Override
            public void onError(Throwable error) {
                System.err.println("에러 발생: " + error.getMessage());
                error.printStackTrace();
                latch.countDown();
            }
        });

        latch.await();  // 비동기 완료 대기
    }
}
```

## Spring Boot 통합 예제

**application.yml:**
```yaml
vllm:
  base-url: http://localhost:8000/v1
  model-name: gpt-oss
  temperature: 0.7
  max-tokens: 2048
  timeout: 120
```

**VllmConfig.java:**
```java
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiStreamingChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class VllmConfig {

    @Value("${vllm.base-url}")
    private String baseUrl;

    @Value("${vllm.model-name}")
    private String modelName;

    @Value("${vllm.temperature:0.7}")
    private Double temperature;

    @Value("${vllm.max-tokens:2048}")
    private Integer maxTokens;

    @Value("${vllm.timeout:120}")
    private Integer timeout;

    @Bean
    public StreamingChatModel streamingChatModel() {
        return OpenAiStreamingChatModel.builder()
                .baseUrl(baseUrl)
                .apiKey("EMPTY")
                .modelName(modelName)
                .temperature(temperature)
                .maxTokens(maxTokens)
                .timeout(Duration.ofSeconds(timeout))
                .logRequests(true)
                .logResponses(true)
                .build();
    }

    // 비스트리밍 모델도 필요한 경우
    @Bean
    public ChatModel chatModel() {
        return OpenAiChatModel.builder()
                .baseUrl(baseUrl)
                .apiKey("EMPTY")
                .modelName(modelName)
                .temperature(temperature)
                .maxTokens(maxTokens)
                .timeout(Duration.ofSeconds(timeout))
                .build();
    }
}
```

**StreamingChatController.java (SSE 방식):**
```java
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.chat.StreamingChatResponseHandler;
import dev.langchain4j.model.chat.response.ChatResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.FluxSink;

@RestController
@RequestMapping("/api/chat")
public class StreamingChatController {

    private final StreamingChatModel streamingChatModel;

    public StreamingChatController(StreamingChatModel streamingChatModel) {
        this.streamingChatModel = streamingChatModel;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(@RequestParam String message) {
        return Flux.create(sink -> {
            streamingChatModel.chat(message, new StreamingChatResponseHandler() {
                @Override
                public void onPartialResponse(String partial) {
                    sink.next(partial);
                }

                @Override
                public void onCompleteResponse(ChatResponse response) {
                    sink.complete();
                }

                @Override
                public void onError(Throwable error) {
                    sink.error(error);
                }
            });
        }, FluxSink.OverflowStrategy.BUFFER);
    }
}
```

## AI Service + Streaming (Flux 반환)

```xml
<!-- 추가 의존성 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-reactor</artifactId>
    <version>1.8.0</version>
</dependency>
```

```java
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.SystemMessage;
import reactor.core.publisher.Flux;

// AI Service 인터페이스
public interface VllmAssistant {

    @SystemMessage("당신은 친절한 AI 어시스턴트입니다.")
    Flux<String> chat(String userMessage);
}

// Bean 등록
@Bean
public VllmAssistant vllmAssistant(StreamingChatModel streamingChatModel) {
    return AiServices.builder(VllmAssistant.class)
            .streamingChatModel(streamingChatModel)
            .chatMemory(MessageWindowChatMemory.withMaxMessages(20))
            .build();
}

// 사용
@RestController
public class AssistantController {

    private final VllmAssistant assistant;

    public AssistantController(VllmAssistant assistant) {
        this.assistant = assistant;
    }

    @GetMapping(value = "/assistant/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> chat(@RequestParam String message) {
        return assistant.chat(message);
    }
}
```

## ChatMessage 리스트로 요청하기

```java
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.request.ChatRequest;

import java.util.List;

public void chatWithMessages() {
    List<ChatMessage> messages = List.of(
            SystemMessage.from("당신은 전문적인 개발자 어시스턴트입니다."),
            UserMessage.from("Spring Boot에서 vLLM을 연동하는 방법을 알려주세요.")
    );

    ChatRequest request = ChatRequest.builder()
            .messages(messages)
            .build();

    streamingChatModel.chat(request, new StreamingChatResponseHandler() {
        @Override
        public void onPartialResponse(String partial) {
            System.out.print(partial);
        }

        @Override
        public void onCompleteResponse(ChatResponse response) {
            System.out.println("\n완료!");
        }

        @Override
        public void onError(Throwable error) {
            error.printStackTrace();
        }
    });
}
```

## 주의사항

| 항목 | 설명 |
|------|------|
| `apiKey` | vLLM은 보통 인증 없이 동작하므로 `"EMPTY"` 또는 `"no-key"` 사용 |
| `baseUrl` | vLLM 기본 포트는 `8000`, 경로는 `/v1` 포함 필요 |
| `modelName` | vLLM 실행 시 지정한 모델명과 일치해야 함 (`--served-model-name`) |
| `timeout` | 대용량 응답 시 충분히 길게 설정 |

vLLM 서버 실행 예시:
```bash
python -m vllm.entrypoints.openai.api_server \
    --model /path/to/gpt-oss \
    --served-model-name gpt-oss \
    --host 0.0.0.0 \
    --port 8000
```

추가로 Tool Calling이나 RAG 연동이 필요하면 말씀해 주세요!