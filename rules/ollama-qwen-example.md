## Ollama 로 띄운 Qwen 모델을 이용하여 번역을 요청하는 예제
```python
import os
from typing import TypedDict

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, START, END

# 1. State 정의 (그래프에서 흐르는 데이터 구조)
class TranslationState(TypedDict):
    english_text: str       # 입력: 영어 텍스트
    korean_translation: str # 출력: 번역된 한글 텍스트

# 2. LLM 설정 (Ollama에 떠있는 Qwen 연결)
# 앞서 docker-compose로 띄운 Ollama 컨테이너를 바라봅니다.
llm = ChatOpenAI(
    base_url="https://qwen.hotk.co.kr/v1",
    api_key="EMPTY",
    model="qwen2.5:7b",  # 설치한 모델명 (qwen:7b 등 상황에 맞춰 변경)
    temperature=0.1,     # 번역은 창의성보다 정확성이 중요하므로 낮게 설정
)

# 3. 노드 함수 정의 (실제 번역 작업을 수행하는 일꾼)
def translate_node(state: TranslationState):
    english_text = state["english_text"]

    # 프롬프트 구성: 역할 부여 + 지시사항
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a professional translator. Translate the following English text into natural and fluent Korean. Return ONLY the translated text without any explanation."),
        ("user", "{text}")
    ])

    # 체인 실행 (Prompt -> LLM)
    chain = prompt | llm
    result = chain.invoke({"text": english_text})

    # 결과로 State 업데이트
    return {"korean_translation": result.content}

# 4. 그래프 구성 (Workflow 조립)
workflow = StateGraph(TranslationState)

# 노드 추가
workflow.add_node("translator", translate_node)

# 엣지 연결 (시작 -> 번역기 -> 끝)
workflow.add_edge(START, "translator")
workflow.add_edge("translator", END)

# 그래프 컴파일 (실행 가능한 앱으로 변환)
app = workflow.compile()

# 5. 실행 테스트
if __name__ == "__main__":
    # 테스트할 영어 문장
    input_text = "Ceph is a distributed object, block, and file storage platform."

    print(f"--- Input (English) ---\n{input_text}\n")

    # 그래프 실행
    result = app.invoke({"english_text": input_text})

    print(f"--- Output (Korean / Qwen) ---\n{result['korean_translation']}")
```