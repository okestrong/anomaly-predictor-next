# PG Optimization Backend Integration Plan

## 목차
1. [개요](#개요)
2. [API 엔드포인트](#api-엔드포인트)
3. [데이터 모델](#데이터-모델)
4. [백엔드 구현 계획](#백엔드-구현-계획)
5. [프론트엔드 통합 전략](#프론트엔드-통합-전략)
6. [실시간 데이터 업데이트](#실시간-데이터-업데이트)
7. [보안 및 권한 관리](#보안-및-권한-관리)
8. [에러 처리 및 롤백](#에러-처리-및-롤백)

---

## 개요

PG(Placement Group) 최적화 도구는 Ceph 클러스터의 데이터 분산을 최적화하여 성능을 향상시키는 핵심 기능입니다.

### 주요 기능
- **실시간 Pool 모니터링**: 현재 PG 분포 상태 및 불균형 감지
- **최적 PG 수 계산**: 클러스터 규모와 복제 정책 기반 자동 계산
- **영향도 분석**: 최적화 수행 시 예상되는 데이터 이동량과 성능 영향
- **시뮬레이션**: 실제 수행 전 가상 시뮬레이션으로 위험도 평가
- **실행 및 모니터링**: 최적화 실행과 실시간 진행상황 추적

---

## API 엔드포인트

### 1. Pool 정보 조회

```http
GET /api/v1/optimization/pools
```

**Response:**
```json
{
  "pools": [
    {
      "id": "pool-1",
      "name": "rbd",
      "currentPGs": 128,
      "recommendedPGs": 256,
      "maxPGs": 512,
      "osdCount": 24,
      "replicaSize": 3,
      "utilization": 72.5,
      "dataSize": "1.2 TB",
      "imbalanceScore": 35,
      "status": "warning",
      "metadata": {
        "createdAt": "2024-01-15T10:00:00Z",
        "lastOptimized": "2024-01-10T08:00:00Z",
        "pgAutoscaleMode": "on"
      }
    }
  ],
  "clusterStats": {
    "totalOSDs": 24,
    "activeOSDs": 24,
    "totalPGs": 448,
    "activePGs": 448,
    "misplacedObjects": 1250,
    "degradedObjects": 0
  }
}
```

### 2. PG 최적화 분석

```http
POST /api/v1/optimization/analyze
```

**Request:**
```json
{
  "poolId": "pool-1",
  "targetPGs": 256,
  "simulationMode": true
}
```

**Response:**
```json
{
  "analysisId": "analysis-uuid-123",
  "pool": {
    "id": "pool-1",
    "name": "rbd"
  },
  "optimization": {
    "currentPGs": 128,
    "targetPGs": 256,
    "pgDifference": 128,
    "recommendationReason": "Current PG count is below optimal for data distribution"
  },
  "impact": {
    "dataMovement": "500 GB",
    "estimatedDuration": "2.5 hours",
    "performanceImpact": {
      "iopsReduction": "15%",
      "latencyIncrease": "20ms",
      "networkUtilization": "450 MB/s"
    },
    "riskAssessment": {
      "level": "medium",
      "factors": [
        "Moderate data movement required",
        "Peak hours operation not recommended",
        "Sufficient free capacity available"
      ]
    }
  },
  "distribution": {
    "before": {
      "osdUtilization": [
        {"osdId": 0, "utilization": 85, "pgCount": 6},
        {"osdId": 1, "utilization": 72, "pgCount": 5}
      ],
      "standardDeviation": 8.5
    },
    "after": {
      "osdUtilization": [
        {"osdId": 0, "utilization": 78, "pgCount": 11},
        {"osdId": 1, "utilization": 76, "pgCount": 10}
      ],
      "standardDeviation": 2.1
    }
  }
}
```

### 3. 시뮬레이션 실행

```http
POST /api/v1/optimization/simulate
```

**Request:**
```json
{
  "analysisId": "analysis-uuid-123",
  "speed": "normal",
  "includeNetworkImpact": true
}
```

**Response (WebSocket Stream):**
```json
{
  "type": "simulation_step",
  "data": {
    "step": 1,
    "action": "Analyzing current PG distribution",
    "progress": 20,
    "pgsMoved": 0,
    "dataTransferred": "0 GB",
    "currentOSDLoads": [
      {"osdId": 0, "load": 85},
      {"osdId": 1, "load": 72}
    ],
    "timestamp": "2024-01-15T10:00:05Z"
  }
}
```

### 4. 최적화 실행

```http
POST /api/v1/optimization/execute
```

**Request:**
```json
{
  "analysisId": "analysis-uuid-123",
  "executionOptions": {
    "maxBackfillPGs": 4,
    "recoveryPriority": "low",
    "throttleNetwork": true,
    "pauseOnError": true
  },
  "schedule": {
    "startTime": "2024-01-16T02:00:00Z",
    "maintenanceWindow": "4h"
  }
}
```

**Response:**
```json
{
  "executionId": "exec-uuid-456",
  "status": "scheduled",
  "scheduledTime": "2024-01-16T02:00:00Z",
  "estimatedCompletion": "2024-01-16T04:30:00Z",
  "rollbackPlan": {
    "available": true,
    "snapshotId": "snapshot-789"
  }
}
```

### 5. 실행 상태 모니터링

```http
GET /api/v1/optimization/status/{executionId}
```

**Response:**
```json
{
  "executionId": "exec-uuid-456",
  "status": "in_progress",
  "startedAt": "2024-01-16T02:00:00Z",
  "progress": {
    "percentage": 45,
    "pgsProcessed": 58,
    "totalPgs": 128,
    "dataTransferred": "225 GB",
    "estimatedTimeRemaining": "1h 22m"
  },
  "performance": {
    "currentIOPS": 4250,
    "currentLatency": "25ms",
    "networkUtilization": "380 MB/s"
  },
  "errors": [],
  "warnings": [
    {
      "timestamp": "2024-01-16T02:45:00Z",
      "message": "OSD.5 responding slowly, throttling backfill"
    }
  ]
}
```

### 6. 최적화 중단/롤백

```http
POST /api/v1/optimization/abort
```

**Request:**
```json
{
  "executionId": "exec-uuid-456",
  "rollback": true,
  "reason": "Performance degradation detected"
}
```

---

## 데이터 모델

### Pool Entity
```java
@Entity
@Table(name = "optimization_pools")
public class OptimizationPool {
    @Id
    private String poolId;
    private String poolName;
    private Integer currentPGs;
    private Integer recommendedPGs;
    private Integer maxPGs;
    private Integer osdCount;
    private Integer replicaSize;
    private Double utilization;
    private String dataSize;
    private Integer imbalanceScore;
    private PoolStatus status;

    @OneToMany(mappedBy = "pool")
    private List<OptimizationHistory> history;

    private LocalDateTime lastAnalyzed;
    private LocalDateTime lastOptimized;
}
```

### Optimization Analysis Entity
```java
@Entity
@Table(name = "optimization_analyses")
public class OptimizationAnalysis {
    @Id
    private String analysisId;

    @ManyToOne
    private OptimizationPool pool;

    private Integer targetPGs;
    private String dataMovement;
    private Duration estimatedDuration;
    private Double performanceImpact;
    private RiskLevel riskLevel;

    @OneToOne
    private SimulationResult simulation;

    @OneToOne
    private OptimizationExecution execution;

    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}
```

### Execution Entity
```java
@Entity
@Table(name = "optimization_executions")
public class OptimizationExecution {
    @Id
    private String executionId;

    @ManyToOne
    private OptimizationAnalysis analysis;

    private ExecutionStatus status;
    private LocalDateTime scheduledTime;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    @Embedded
    private ExecutionProgress progress;

    @ElementCollection
    private List<ExecutionLog> logs;

    private String rollbackSnapshotId;
    private Boolean rollbackAvailable;
}
```

---

## 백엔드 구현 계획

### 1단계: 데이터 수집 레이어
```java
@Service
public class CephMetricsCollector {

    @Scheduled(fixedDelay = 30000) // 30초마다
    public void collectPoolMetrics() {
        // 1. Ceph Manager API에서 pool 정보 수집
        // 2. OSD 분포 및 사용률 계산
        // 3. PG 분포 불균형 지수 계산
        // 4. 데이터베이스 업데이트
        // 5. 이상 감지 시 알림 발송
    }

    public PoolMetrics getPoolMetrics(String poolId) {
        // Ceph 명령어 실행: ceph osd pool get {pool} all
        // JSON 파싱 및 메트릭 객체 생성
    }
}
```

### 2단계: 최적화 분석 엔진
```java
@Service
public class OptimizationAnalyzer {

    public OptimizationPlan analyzePGDistribution(String poolId) {
        // 1. 현재 PG 분포 분석
        PoolMetrics metrics = metricsCollector.getPoolMetrics(poolId);

        // 2. 최적 PG 수 계산
        int optimalPGs = calculateOptimalPGs(
            metrics.getOsdCount(),
            metrics.getReplicaSize()
        );

        // 3. 데이터 이동량 예측
        DataMovement movement = predictDataMovement(
            metrics.getCurrentPGs(),
            optimalPGs,
            metrics.getDataSize()
        );

        // 4. 위험도 평가
        RiskAssessment risk = assessRisk(movement, metrics);

        return OptimizationPlan.builder()
            .currentPGs(metrics.getCurrentPGs())
            .targetPGs(optimalPGs)
            .dataMovement(movement)
            .risk(risk)
            .build();
    }

    private int calculateOptimalPGs(int osdCount, int replicaSize) {
        // PG 계산 공식: (OSD 수 × 100) / 복제 수
        int calculated = (osdCount * 100) / replicaSize;

        // 2의 거듭제곱으로 반올림
        return roundToPowerOfTwo(calculated);
    }
}
```

### 3단계: 시뮬레이션 엔진
```java
@Service
public class OptimizationSimulator {

    public SimulationResult simulate(OptimizationPlan plan) {
        SimulationContext context = new SimulationContext(plan);

        List<SimulationStep> steps = Arrays.asList(
            new PGCalculationStep(),
            new DataDistributionStep(),
            new NetworkImpactStep(),
            new PerformanceImpactStep(),
            new VerificationStep()
        );

        for (SimulationStep step : steps) {
            SimulationStepResult result = step.execute(context);

            // WebSocket으로 실시간 전송
            broadcastSimulationUpdate(result);

            if (result.hasError()) {
                break;
            }
        }

        return context.getFinalResult();
    }
}
```

### 4단계: 실행 엔진
```java
@Service
@Transactional
public class OptimizationExecutor {

    public ExecutionResult execute(OptimizationPlan plan, ExecutionOptions options) {
        // 1. 스냅샷 생성 (롤백용)
        String snapshotId = createSnapshot(plan.getPoolId());

        // 2. Ceph 설정 조정
        adjustCephSettings(options);

        // 3. PG 수 변경 명령 실행
        try {
            // pg_num 설정
            executeCephCommand("osd pool set %s pg_num %d",
                plan.getPoolName(), plan.getTargetPGs());

            // pgp_num 설정 (점진적)
            for (int i = plan.getCurrentPGs(); i <= plan.getTargetPGs(); i += 16) {
                executeCephCommand("osd pool set %s pgp_num %d",
                    plan.getPoolName(), Math.min(i, plan.getTargetPGs()));

                // 진행상황 모니터링
                monitorProgress(plan.getPoolId());

                // 성능 영향 확인
                if (detectPerformanceDegradation()) {
                    if (options.isPauseOnError()) {
                        pauseOptimization();
                    }
                }

                Thread.sleep(options.getStepDelay());
            }

        } catch (Exception e) {
            // 롤백 처리
            if (options.isAutoRollback()) {
                rollback(snapshotId);
            }
            throw new OptimizationException("Execution failed", e);
        }

        return ExecutionResult.success(snapshotId);
    }
}
```

### 5단계: 모니터링 서비스
```java
@Service
public class OptimizationMonitor {

    private final Map<String, ExecutionContext> activeExecutions = new ConcurrentHashMap<>();

    @Scheduled(fixedDelay = 5000) // 5초마다
    public void monitorActiveOptimizations() {
        for (ExecutionContext context : activeExecutions.values()) {
            // 1. 진행상황 체크
            Progress progress = checkProgress(context);

            // 2. 성능 메트릭 수집
            PerformanceMetrics metrics = collectMetrics(context);

            // 3. 이상 감지
            if (detectAnomalies(metrics)) {
                handleAnomaly(context, metrics);
            }

            // 4. WebSocket으로 상태 전송
            broadcastStatus(context, progress, metrics);
        }
    }
}
```

---

## 프론트엔드 통합 전략

### 1. API 클라이언트 구현
```typescript
// services/optimizationService.ts
export class OptimizationService {
  private apiClient: ApiClient;
  private wsClient: WebSocketClient;

  async getPools(): Promise<Pool[]> {
    return this.apiClient.get('/optimization/pools');
  }

  async analyzePool(poolId: string, targetPGs: number): Promise<Analysis> {
    return this.apiClient.post('/optimization/analyze', {
      poolId,
      targetPGs,
      simulationMode: true
    });
  }

  subscribeToSimulation(analysisId: string, onUpdate: (step: SimulationStep) => void) {
    this.wsClient.subscribe(`/topic/simulation/${analysisId}`, onUpdate);
  }

  async executeOptimization(analysisId: string, options: ExecutionOptions) {
    return this.apiClient.post('/optimization/execute', {
      analysisId,
      executionOptions: options
    });
  }
}
```

### 2. State Management (Redux)
```typescript
// store/optimizationSlice.ts
export const optimizationSlice = createSlice({
  name: 'optimization',
  initialState: {
    pools: [],
    selectedPool: null,
    analysis: null,
    simulation: {
      isRunning: false,
      steps: [],
      currentStep: 0
    },
    execution: {
      status: 'idle',
      progress: 0,
      logs: []
    }
  },
  reducers: {
    setSelectedPool: (state, action) => {
      state.selectedPool = action.payload;
    },
    updateSimulationStep: (state, action) => {
      state.simulation.steps[action.payload.step] = action.payload;
      state.simulation.currentStep = action.payload.step;
    },
    updateExecutionProgress: (state, action) => {
      state.execution.progress = action.payload.progress;
      state.execution.logs.push(action.payload.log);
    }
  }
});
```

### 3. WebSocket 연결 관리
```typescript
// hooks/useOptimizationWebSocket.ts
export const useOptimizationWebSocket = (executionId: string) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const client = new Client({
      brokerURL: process.env.NEXT_PUBLIC_WS_URL,
      onConnect: () => {
        client.subscribe(`/topic/optimization/${executionId}`, (message) => {
          const update = JSON.parse(message.body);

          switch(update.type) {
            case 'progress':
              dispatch(updateExecutionProgress(update.data));
              break;
            case 'simulation_step':
              dispatch(updateSimulationStep(update.data));
              break;
            case 'error':
              dispatch(setOptimizationError(update.data));
              break;
          }
        });
      }
    });

    client.activate();

    return () => client.deactivate();
  }, [executionId]);
};
```

---

## 실시간 데이터 업데이트

### WebSocket 메시지 형식

```typescript
// 진행상황 업데이트
{
  type: "OPTIMIZATION_PROGRESS",
  data: {
    executionId: "exec-uuid-456",
    progress: 45,
    pgsProcessed: 58,
    totalPgs: 128,
    dataTransferred: "225 GB",
    currentPhase: "rebalancing",
    estimatedTimeRemaining: "1h 22m"
  }
}

// 성능 메트릭 업데이트
{
  type: "PERFORMANCE_METRICS",
  data: {
    executionId: "exec-uuid-456",
    timestamp: "2024-01-16T03:00:00Z",
    iops: {
      read: 4500,
      write: 2800
    },
    latency: {
      read: 12,
      write: 25
    },
    networkBandwidth: 380, // MB/s
    osdUtilization: [
      {osdId: 0, utilization: 78},
      {osdId: 1, utilization: 76}
    ]
  }
}

// 알림/경고
{
  type: "OPTIMIZATION_ALERT",
  data: {
    executionId: "exec-uuid-456",
    severity: "warning",
    message: "Performance degradation detected",
    details: {
      metric: "latency",
      threshold: 20,
      current: 25
    },
    suggestedAction: "Consider pausing optimization"
  }
}
```

---

## 보안 및 권한 관리

### 1. 권한 레벨
- **READ**: Pool 정보 조회, 분석 결과 확인
- **ANALYZE**: 최적화 분석 수행, 시뮬레이션 실행
- **EXECUTE**: 실제 최적화 실행
- **ADMIN**: 모든 권한 + 롤백, 강제 중단

### 2. API 보안
```java
@RestController
@RequestMapping("/api/v1/optimization")
@RequiredArgsConstructor
public class OptimizationController {

    @PreAuthorize("hasRole('OPTIMIZATION_ANALYZE')")
    @PostMapping("/analyze")
    public ResponseEntity<Analysis> analyze(@Valid @RequestBody AnalyzeRequest request) {
        // 권한 확인 후 분석 수행
    }

    @PreAuthorize("hasRole('OPTIMIZATION_EXECUTE')")
    @PostMapping("/execute")
    public ResponseEntity<ExecutionResponse> execute(@Valid @RequestBody ExecuteRequest request) {
        // 실행 권한 확인
        // 감사 로그 기록
        auditService.log("OPTIMIZATION_EXECUTE", request);

        return optimizationService.execute(request);
    }
}
```

### 3. 감사 로깅
```java
@Entity
@Table(name = "optimization_audit_logs")
public class OptimizationAuditLog {
    @Id
    private String logId;
    private String userId;
    private String action;
    private String poolId;
    private String executionId;
    private String ipAddress;
    private LocalDateTime timestamp;
    private String details;
    private AuditResult result;
}
```

---

## 에러 처리 및 롤백

### 1. 에러 타입 정의
```java
public enum OptimizationErrorType {
    INSUFFICIENT_CAPACITY("Not enough free capacity for rebalancing"),
    PERFORMANCE_DEGRADATION("Cluster performance degraded below threshold"),
    OSD_FAILURE("OSD failure detected during optimization"),
    NETWORK_ERROR("Network connectivity issue"),
    TIMEOUT("Operation timed out"),
    PERMISSION_DENIED("Insufficient permissions"),
    INVALID_CONFIGURATION("Invalid PG configuration");
}
```

### 2. 롤백 메커니즘
```java
@Service
public class RollbackService {

    public void rollback(String executionId, String snapshotId) {
        // 1. 현재 실행 중지
        optimizationExecutor.abort(executionId);

        // 2. 스냅샷에서 이전 설정 복원
        PoolSnapshot snapshot = snapshotRepository.findById(snapshotId);

        // 3. PG 수 원복
        cephCommand.execute("osd pool set %s pg_num %d",
            snapshot.getPoolName(), snapshot.getPgNum());
        cephCommand.execute("osd pool set %s pgp_num %d",
            snapshot.getPoolName(), snapshot.getPgpNum());

        // 4. 설정 원복
        restoreCephSettings(snapshot.getSettings());

        // 5. 검증
        verifyRollback(snapshot);

        // 6. 알림
        notificationService.notify("Optimization rolled back successfully");
    }
}
```

### 3. 에러 복구 전략
```typescript
// Frontend error handling
const handleOptimizationError = async (error: OptimizationError) => {
  switch(error.type) {
    case 'PERFORMANCE_DEGRADATION':
      // 자동 일시 정지
      await pauseOptimization(error.executionId);

      // 사용자에게 선택지 제공
      const action = await showDialog({
        title: 'Performance Degradation Detected',
        message: 'Continue with reduced speed or abort?',
        options: ['Continue Slow', 'Abort', 'Rollback']
      });

      switch(action) {
        case 'Continue Slow':
          await resumeOptimization(error.executionId, {speed: 'slow'});
          break;
        case 'Abort':
          await abortOptimization(error.executionId);
          break;
        case 'Rollback':
          await rollbackOptimization(error.executionId);
          break;
      }
      break;

    case 'OSD_FAILURE':
      // 즉시 중단 및 롤백
      await emergencyRollback(error.executionId);
      break;

    default:
      // 일반 에러 처리
      showErrorNotification(error.message);
  }
};
```

---

## 향후 개선 계획

### Phase 1 (3개월)
- ✅ 기본 PG 최적화 기능
- ✅ 시뮬레이션 엔진
- ✅ 실시간 모니터링
- ⏳ 자동 롤백 메커니즘

### Phase 2 (6개월)
- 🔄 AI 기반 최적화 추천
- 🔄 스케줄링 기능 (유지보수 윈도우)
- 🔄 다중 Pool 동시 최적화
- 🔄 히스토리 및 트렌드 분석

### Phase 3 (9개월)
- 📋 예측적 최적화 (사전 예방)
- 📋 클러스터 간 최적화 조정
- 📋 자동화된 성능 튜닝
- 📋 기계학습 기반 패턴 인식

---

## 테스트 계획

### 단위 테스트
```java
@Test
public void testOptimalPGCalculation() {
    // Given
    int osdCount = 24;
    int replicaSize = 3;

    // When
    int optimalPGs = calculator.calculateOptimalPGs(osdCount, replicaSize);

    // Then
    assertEquals(1024, optimalPGs); // (24 * 100) / 3 = 800 → 1024 (2의 거듭제곱)
}
```

### 통합 테스트
```java
@Test
@SpringBootTest
public void testEndToEndOptimization() {
    // 1. Pool 생성
    Pool pool = createTestPool();

    // 2. 분석 수행
    Analysis analysis = optimizationService.analyze(pool.getId());

    // 3. 시뮬레이션 실행
    SimulationResult simulation = simulatorService.simulate(analysis.getId());

    // 4. 최적화 실행
    ExecutionResult result = executorService.execute(analysis.getId());

    // 5. 검증
    assertThat(result.getStatus()).isEqualTo(ExecutionStatus.SUCCESS);
    assertThat(getPoolPGCount(pool.getId())).isEqualTo(analysis.getTargetPGs());
}
```

### 부하 테스트
- 대용량 데이터 이동 시나리오 (>1TB)
- 다중 Pool 동시 최적화
- 네트워크 대역폭 제한 상황
- OSD 장애 발생 시나리오

---

## 모니터링 대시보드

### Grafana Dashboard 구성
1. **실시간 최적화 진행률**
   - PG 이동 진행상황
   - 데이터 전송률
   - 예상 완료 시간

2. **성능 영향 모니터링**
   - IOPS 변화
   - Latency 추이
   - 네트워크 사용률

3. **클러스터 건강도**
   - OSD 상태
   - PG 상태 분포
   - 객체 복제 상태

4. **히스토리 분석**
   - 과거 최적화 이력
   - 성공/실패 비율
   - 평균 소요 시간

---

## 결론

PG 최적화 백엔드 시스템은 Ceph 클러스터의 성능을 극대화하는 핵심 기능입니다.
안전한 시뮬레이션, 실시간 모니터링, 자동 롤백 기능을 통해
위험을 최소화하면서도 효율적인 데이터 분산을 달성할 수 있습니다.

이 시스템은 단순한 PG 수 조정을 넘어,
클러스터 전체의 성능과 안정성을 종합적으로 고려하는
지능형 최적화 플랫폼으로 발전할 예정입니다.