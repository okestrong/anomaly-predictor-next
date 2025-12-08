gpt-oss-20b 모델의 tool calling 지원 여부를 조사해보겠습니다.# gpt-oss-20b Tool Calling 지원 조사 결과

## 요약

**gpt-oss-20b는 설계상 Tool Calling을 지원하지만, vLLM에서 사용 시 현재 제약사항이 있습니다.**

---

## 1. 공식 지원 여부

gpt-oss 모델은 tool use, few-shot function calling, CoT reasoning 등에서 강력한 성능을 보이며, Responses API를 통해 agentic workflows에서 사용하도록 설계되었습니다.

gpt-oss-20b의 핵심 기능으로 "Agentic capabilities: Use the models' native capabilities for function calling, web browsing, Python code execution, and Structured Outputs"가 명시되어 있습니다.

---

## 2. vLLM에서의 Tool Calling 현황

### 권장 실행 방법
vLLM에서 gpt-oss 모델의 tool calling을 사용하려면 다음 인자로 실행해야 합니다:
`vllm serve ... --tool-call-parser openai --enable-auto-tool-choice`
(vLLM >= 0.10.2 필요)

### ⚠️ 현재 문제점

**`/v1/chat/completions` 엔드포인트 버그:**

gpt-oss-120b 모델을 vLLM의 `/v1/chat/completions` 엔드포인트에서 tool calling과 함께 사용할 때 제대로 작동하지 않습니다:
- `--tool-call-parser hermes` 사용 시 vLLM 시작 실패
- parser 생략 시 parser 필요 에러 발생
- `mistral` 또는 `llama3_json` parser 사용 시 "incorrect number of parameters" 또는 인자 누락 에러 발생
- 반면 `/v1/responses` (Harmony) 엔드포인트에서는 tool calling이 정상 작동합니다.

**tool_calls 파싱 안됨:**

사용자들이 tool calling 테스트 시 tool_calls가 파싱되지 않고 content에 JSON 형태로 반환되는 문제를 보고했습니다:
```
ChatCompletionMessage(content='[{ "name": "get_weather", "parameters": { "city": "Berlin" } }]', ... tool_calls=[], reasoning_content="The user asks current weather in Berlin...")
```

**llama.cpp/GGUF 변환 시 문제:**

llama.cpp로 변환하여 tool calls 사용 시, 모델이 reasoning_content에서 tool 사용 의도를 표현하지만 실제 tool_call 구조를 반환하지 않고 텍스트로만 출력됩니다.

---

## 3. 해결 방법

### 방법 1: Harmony 형식 + Responses API 사용

vLLM은 OpenAI Responses API와 gpt-oss toolkit을 통합하여 이러한 기능을 지원합니다. 이 통합을 통해 vLLM은 모델의 tool call을 파싱하고, 실제로 검색 및 코드 인터프리터 도구를 호출하며, 출력을 파싱하여 모델에 다시 전달하는 루프를 구현합니다.

```python
# Responses API 사용 예시
from openai import OpenAI

client = OpenAI(base_url="http://localhost:8000/v1", api_key="EMPTY")

response = client.responses.create(
    model="openai/gpt-oss-20b",
    instructions="You are a helpful assistant.",
    input="What's the weather in Seoul?",
    tools=[...]  # tool 정의
)
```

### 방법 2: 시스템 프롬프트에 도구 명시

Ollama의 completions API를 사용하여 성공한 사용자에 따르면:
- 시스템 프롬프트에 도구를 명시적으로 나열
- 스키마도 포함하면 hallucination 감소
- gpt-oss:20b는 매우 좋은 agentic 모델이며 instruction following에 뛰어남

### 방법 3: LangChain4j에서 프롬프트 기반 접근

Tool calling이 불안정하므로, 프롬프트에 도구 설명을 포함시키고 응답을 파싱하는 방식 사용:

```java
// 시스템 프롬프트에 도구 정의 포함
String systemPrompt = """
    당신은 도움이 되는 AI 어시스턴트입니다.
    다음 도구를 사용할 수 있습니다:
    
    1. getWeather(city: string) - 도시의 날씨 조회
    2. calculate(a: number, b: number, operator: string) - 수학 계산
    3. searchKnowledge(query: string) - 지식 검색
    
    도구를 사용하려면 다음 JSON 형식으로 응답하세요:
    {"tool": "도구이름", "parameters": {...}}
    """;
```

---

## 4. 결론 및 권장사항

| 항목 | 상태 |
|------|------|
| gpt-oss-20b Tool Calling 설계 | ✅ 지원 |
| vLLM `/v1/responses` API | ✅ 작동 |
| vLLM `/v1/chat/completions` API | ❌ 불안정/버그 |
| LangChain4j 호환성 | ⚠️ 제한적 |

### 권장사항

1. **vLLM 버전**: 0.10.2 이상 사용
2. **실행 옵션**:
   ```bash
   vllm serve openai/gpt-oss-20b \
       --tool-call-parser openai \
       --enable-auto-tool-choice \
       --async-scheduling
   ```
3. **API 선택**: 가능하면 `/v1/responses` 엔드포인트 사용
4. **대안**: Tool calling이 불안정할 경우:
    - 프롬프트 기반 도구 호출 구현
    - 또는 tool calling이 안정적인 다른 모델 고려 (예: Qwen2.5, Llama 3.1)

현재 vLLM에서 gpt-oss의 `/v1/chat/completions` tool calling 지원은 활발히 개선 중이므로, 최신 vLLM 릴리스를 확인하는 것이 좋습니다.