# Ceph 진단 AI를 위한 LangGraph 아키텍처 설계

## 시스템 구조 개요

* **LLM 서빙**: vLLM (OpenAI 호환 엔드포인트) - 폐쇄망 환경
* **백엔드**: Spring Boot (+ langgraph4j, langchain4j / Spring AI)
* **프론트**: React 채팅 UI
* **대상 시스템**: Ceph 분산 스토리지 클러스터

**LangGraph(LangGraph4j)**는 Ceph 진단 워크플로우를 그래프 형태로 설계하고 실행하는 핵심 엔진입니다.

---

## 1. 상태 그래프(StateGraph) - Ceph 진단 플로우 설계

### 기본 개념
* **노드(Node)**: 각 진단 단계를 의미 (예: 상태 수집, 로그 분석, 메트릭 평가, 진단 결과 생성)
* **엣지(Edge)**: 진단 플로우의 순서와 조건부 분기를 정의

### Ceph 진단 AI에서의 활용
진단 워크플로우를 명시적 그래프로 표현:

1. `user_query` 노드: 사용자 질문 분석 ("ceph 건강상태 알려줘", "OSD가 다운됐어" 등)
2. `intent_router` 노드: 질문 의도 파악
    - 상태 조회 → `health_check` 서브그래프
    - 문제 진단 → `diagnosis` 서브그래프
    - 해결책 실행 → `human_approval` 노드
3. `data_collection` 서브그래프: 필요한 Ceph 데이터 병렬 수집
4. `diagnosis_agent` 노드: vLLM을 통한 문제 분석
5. `solution_generator` 노드: 해결책 생성
6. `response` 노드: 최종 응답 포맷팅

---

## 2. 상태(State) 모델링 - Context Window 최적화

### Ceph 진단용 State 구조
```java
public class CephDiagnosisState {
    // 대화 컨텍스트
    private List<Message> messages;
    
    // Raw 데이터 (DB 저장, LLM에는 전달 안 함)
    private Map<String, Object> rawCephData;
    private List<String> fullLogs;
    
    // 요약된 컨텍스트 (LLM에 전달)
    private CephHealthSummary healthSummary;
    private List<String> criticalEvents;
    private Map<String, String> keyMetrics;
    
    // 진단 결과
    private DiagnosisResult diagnosis;
    private List<Solution> proposedSolutions;
    
    // 실행 제어
    private boolean requiresApproval;
    private String threadId;
}
```

### Context Window 관리 전략
- **Raw 데이터**: 전체 `ceph status`, `osd tree` 등은 State의 `rawCephData`에 저장
- **LLM 전달**: 요약된 정보만 전달
    - 예: "OSD 3번 Down (disk failure), PG 2.4f stuck unclean 3일째"
- **토큰 절약**: 중요 정보만 추출하여 LLM Context 효율 극대화

---

## 3. 도구(Tool) 기반 정보 수집 - Agent 대신 Tool 활용

### Tool Set 구성 (Agent 대신 직접 호출)
```java
@Component
public class CephToolSet {
    @Tool("ceph_health 상태 조회")
    public CephHealth fetchCephHealth() { }
    
    @Tool("OSD 트리 구조 조회")
    public OsdTree fetchOsdTree() { }
    
    @Tool("PG 상태 조회")
    public PgStatus fetchPgStatus() { }
    
    @Tool("최근 에러 로그 조회")
    public List<LogEntry> fetchRecentLogs(int hours) { }
    
    @Tool("성능 메트릭 조회")
    public Metrics fetchMetrics(String type) { }
}
```

### 병렬 실행 서브그래프 - 전체 건강검진
```java
// "전체 상태 점검해줘" 요청 시 병렬 실행
StateGraph healthCheckSubgraph = new StateGraph()
    .addParallelNodes(
        "health_node" -> fetchCephHealth(),
        "osd_node" -> fetchOsdTree(),
        "pg_node" -> fetchPgStatus(),
        "log_node" -> fetchRecentLogs(24)
    )
    .addNode("summarize", this::summarizeHealthData);
```

---

## 4. 조건 분기와 라우팅 - 안전성 확보

### Read-Only vs Write 작업 분리
```java
graph.addConditionalEdge("solution_generator", 
    state -> {
        if (state.getSolution().isReadOnly()) {
            return "auto_execute";  // 정보 조회는 자동 실행
        } else {
            return "human_approval";  // 변경 작업은 승인 필요
        }
    },
    Map.of(
        "auto_execute", "execute_solution",
        "human_approval", "wait_for_approval"
    )
);
```

### 작업 유형별 라우팅
- **자동 실행 (Read-Only)**:
    - `ceph status`, `ceph osd tree`
    - 로그 조회, 메트릭 수집

- **승인 필요 (Write)**:
    - `ceph osd out`, `ceph osd reweight`
    - PG 재배치, 설정 변경

---

## 5. 체크포인트와 세션 관리 - 장기 진단 지원

### Postgres Saver를 통한 상태 저장
```java
@Configuration
public class LangGraphConfig {
    @Bean
    public PostgresSaver checkpointSaver(DataSource dataSource) {
        return new PostgresSaver(dataSource)
            .withTablePrefix("ceph_diagnosis_");
    }
}
```

### 세션 기반 진단 이력 관리
- **threadId 기반 세션**: 각 사용자/클러스터별 독립된 진단 세션
- **체크포인트 활용**:
    - 장기 진단 작업 중단/재개
    - 과거 진단 이력 참조
    - 문제 패턴 학습

---

## 6. 멀티 에이전트 구조 - 전문화된 진단

### Ceph 진단용 에이전트 구성
```java
public class CephAgents {
    // 건강 상태 전문가
    @Agent("일반 상태 조회 및 모니터링")
    public HealthMonitorAgent healthAgent;
    
    // 문제 진단 전문가  
    @Agent("장애 원인 분석 및 진단")
    public DiagnosisAgent diagnosisAgent;
    
    // 성능 튜닝 전문가
    @Agent("성능 최적화 및 튜닝 조언")
    public PerformanceAgent performanceAgent;
    
    // 복구 작업 전문가
    @Agent("복구 절차 및 작업 실행")
    public RecoveryAgent recoveryAgent;
}
```

### 에이전트 핸드오프 예시
1. 사용자: "OSD가 계속 죽어요"
2. `HealthMonitorAgent`: 상태 확인 → OSD.3 반복 다운 감지
3. `DiagnosisAgent`로 핸드오프: 로그 분석 → 디스크 불량 진단
4. `RecoveryAgent`로 핸드오프: OSD 교체 절차 제시

---

## 7. Human-in-the-Loop - 위험 작업 승인

### 승인 플로우 구현
```java
graph.addNode("wait_for_approval", state -> {
    // 위험 작업 설명 생성
    String description = generateActionDescription(state);
    state.setApprovalRequired(true);
    state.setApprovalMessage(description);
    
    // 체크포인트 저장 후 대기
    checkpoint.save(state);
    return state;
});

// React UI에서 승인 시 재개
graph.resume(threadId, Map.of("approved", true));
```

### 위험 레벨 분류
- **Level 0 (자동)**: 읽기 전용 조회
- **Level 1 (알림)**: 경미한 설정 변경
- **Level 2 (승인)**: OSD 재가중치, PG 재배치
- **Level 3 (이중승인)**: OSD 제거, 풀 삭제

---

## 8. 스트리밍과 실시간 피드백

### SSE를 통한 진행 상황 전달
```java
@RestController
public class DiagnosisController {
    @GetMapping(value = "/diagnose", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<DiagnosisEvent>> diagnose(@RequestParam String query) {
        return langGraph.streamEvents(query)
            .map(event -> ServerSentEvent.<DiagnosisEvent>builder()
                .event(event.getType())  // "collecting_data", "analyzing", etc.
                .data(event.getData())
                .build());
    }
}
```

### React UI 실시간 표시
- `collecting_data`: "Ceph 데이터 수집 중... 🔄"
- `analyzing`: "문제 분석 중... 🔍"
- `solution_found`: "해결책 발견! ✅"
- 토큰 스트리밍: ChatGPT 스타일 타이핑 효과

---

## 9. 서브그래프 재사용 패턴

### 공통 진단 패턴 모듈화
```java
// 재사용 가능한 서브그래프들
public class DiagnosisSubgraphs {
    // OSD 문제 진단 서브그래프
    public StateGraph osdDiagnosisGraph() {
        return new StateGraph()
            .addNode("check_osd_status", this::checkOsdStatus)
            .addNode("analyze_osd_logs", this::analyzeOsdLogs)
            .addNode("check_disk_health", this::checkDiskHealth)
            .addNode("generate_osd_solution", this::generateOsdSolution);
    }
    
    // PG 문제 진단 서브그래프
    public StateGraph pgDiagnosisGraph() { ... }
    
    // 성능 문제 진단 서브그래프
    public StateGraph performanceDiagnosisGraph() { ... }
}
```

---

## 10. 시간 여행과 문제 재현

### 디버깅과 사후 분석
```java
// 특정 시점의 상태로 되돌아가기
public void analyzeIncident(String threadId, LocalDateTime incidentTime) {
    // 해당 시점의 체크포인트 로드
    State historicalState = checkpoint.loadAt(threadId, incidentTime);
    
    // 당시 Ceph 상태 재구성
    CephHealth historicalHealth = historicalState.getRawCephData();
    
    // 문제 재현 및 분석
    DiagnosisResult result = langGraph.replayFrom(historicalState);
}
```

---

## 실전 구현 체크리스트

### 필수 구현 사항
- [x] **StateGraph 정의**: 전체 진단 플로우 그래프 구성
- [x] **Tool Set 구현**: Ceph API 호출 도구들
- [x] **Context 최적화**: Raw 데이터와 요약 분리
- [x] **Human-in-the-Loop**: 위험 작업 승인 플로우
- [x] **Postgres Saver**: 세션/체크포인트 관리
- [x] **병렬 실행**: 데이터 수집 병렬화
- [x] **WebSocket 혹은 SSE 스트리밍**: 실시간 진행 상황

### 선택적 구현 사항
- [ ] **멀티 에이전트**: 전문화된 에이전트 분리 (복잡도에 따라)
- [ ] **시간 여행**: 과거 상태 재현 (운영 필요시)
- [ ] **Studio 활용**: 시각적 플로우 설계 (팀 협업시)

---

## 보안 및 안전성 고려사항

### 폐쇄망 환경 대응
- 외부 웹검색 RAG 제외
- 내부 Ceph 문서/매뉴얼 임베딩 DB 구축
- 로컬 vLLM 서버 활용

### 작업 안전성
- 모든 Write 작업은 Human-in-the-Loop 필수
- 작업 이력 완전 기록 (Audit Trail)
- 롤백 가능한 작업만 자동화

### 성능 최적화
- 빈번한 조회는 캐싱 (Redis/Hazelcast)
- 대용량 로그는 요약 후 전달
- 토큰 사용량 모니터링 및 알림

---

## 결론

LangGraph4j를 활용한 Ceph 진단 AI는 다음과 같은 핵심 기능들을 통해 구현됩니다:

1. **StateGraph**: 진단 워크플로우의 명확한 정의
2. **Tool 기반 정보 수집**: 효율적인 Ceph 데이터 획득
3. **Context Window 관리**: 대규모 데이터의 스마트한 요약
4. **Human-in-the-Loop**: 안전한 작업 실행
5. **체크포인트/세션**: 장기 진단 작업 지원
6. **병렬 실행**: 빠른 데이터 수집
7. **실시간 스트리밍**: 우수한 사용자 경험

이 아키텍처는 Ceph 클러스터의 복잡한 문제를 안전하고 효과적으로 진단하고 해결하는 대화형 AI 시스템을 구축하는 데 최적화되어 있습니다.