# Dashboard Data Documentation
## 작성일: 2025-01-16

이 문서는 메인 대시보드(`app/dashboard/page.tsx`)와 관련 컴포넌트들이 필요로 하는 데이터 구조를 정의합니다.
모든 용량 관련 값은 **바이트(bytes)** 단위로 통일되었으며, 프론트엔드에서 동적으로 B, KB, MB, GB, TB로 변환하여 표시합니다.

---

## 1. Dashboard 전체 데이터 구조

```json
{
  "capacity": { /* CapacityData - 아래 참조 */ },
  "clusterHealth": { /* ClusterHealthData - 아래 참조 */ },
  "riskAssessment": { /* RiskAssessmentData - 아래 참조 */ },
  "charts": { /* ChartData - 아래 참조 */ },
  "alerts": [ /* AlertData[] - 아래 참조 */ ],
  "aiInsights": [ /* AIInsightData[] - 아래 참조 */ ],
  "timestamp": 1705401600000,
  "dataSource": "ceph-api"
}
```

---

## 2. Capacity Data (저장소 용량 정보)

**사용 컴포넌트**: `CapacityStatus.tsx`, `PoolUsageChart.tsx`

### 데이터 구조
```json
{
  "totalBytes": 10995116277760,
  "usedBytes": 7696581394432,
  "availableBytes": 3298534883328,
  "usagePercent": 70.0,
  "dailyGrowthBytes": 107374182400,
  "timeToFullDays": 30,
  "growthTrend": "increasing",
  "pools": [
    {
      "name": "rbd",
      "usedBytes": 4398046511104,
      "usagePercent": 65.5,
      "type": "replicated"
    },
    {
      "name": "cephfs_data",
      "usedBytes": 2199023255552,
      "usagePercent": 78.2,
      "type": "replicated"
    },
    {
      "name": "ec_pool",
      "usedBytes": 1099511627776,
      "usagePercent": 45.0,
      "type": "erasure"
    }
  ],
  "usageTrend": [65, 67, 68, 69, 69, 70, 70]
}
```

### 필드 설명
- `totalBytes` (number): 전체 저장소 용량 (바이트)
- `usedBytes` (number): 사용 중인 용량 (바이트)
- `availableBytes` (number): 사용 가능한 용량 (바이트)
- `usagePercent` (number): 사용률 (0-100 퍼센트)
- `dailyGrowthBytes` (number): 일일 증가량 (바이트/일)
- `timeToFullDays` (number): 용량 포화까지 남은 일수
- `growthTrend` (string): 증가 추세 - "increasing" | "stable" | "decreasing" | "unknown"
- `pools` (array): 각 풀별 용량 정보
  - `name` (string): 풀 이름
  - `usedBytes` (number): 풀 사용 용량 (바이트)
  - `usagePercent` (number): 풀 사용률 (0-100)
  - `type` (string): 풀 타입 - "replicated" | "erasure"
- `usageTrend` (number[]): 최근 7일간 사용률 추이 (각 값은 0-100 퍼센트)

### 백엔드 수집 방법
```java
// Ceph API 호출
GET /api/v1/df
- totalBytes: stats.total_bytes
- usedBytes: stats.total_used_bytes
- availableBytes: stats.total_avail_bytes
- usagePercent: (usedBytes / totalBytes) * 100

// Pool 정보
GET /api/v1/pool
- pools[].name: pool.pool_name
- pools[].usedBytes: pool.stats.bytes_used
- pools[].usagePercent: (bytes_used / max_bytes) * 100
- pools[].type: pool.type (1=replicated, 3=erasure)

// Prometheus로 증가 추세 계산
Query: rate(ceph_pool_bytes_used[1d])
- dailyGrowthBytes: rate 값을 바이트로 변환
- timeToFullDays: availableBytes / dailyGrowthBytes

// 7일 추이
Query: ceph_cluster_total_used_bytes[7d]
- usageTrend: 7일간의 사용률 배열 (각 값을 퍼센트로 변환)
```

---

## 3. Cluster Health Data (클러스터 상태 정보)

**사용 컴포넌트**: `ClusterStatus.tsx`

### 데이터 구조
```json
{
  "status": "HEALTH_WARN",
  "message": "1 OSDs down, PGs degraded",
  "osds": {
    "total": 12,
    "up": 11,
    "in": 11,
    "down": 1,
    "out": 1,
    "averageUsage": 68.5
  },
  "monitors": {
    "total": 3,
    "active": 3,
    "standby": 0
  },
  "pgs": {
    "total": 512,
    "activeClean": 480,
    "scrubbing": 20,
    "degraded": 12,
    "recovering": 0
  },
  "clientConnections": 156,
  "version": "19.2.1 squid"
}
```

### 필드 설명
- `status` (string): 클러스터 전체 상태 - "HEALTH_OK" | "HEALTH_WARN" | "HEALTH_ERR"
- `message` (string): 상태 요약 메시지
- `osds` (object): OSD 상태 정보
  - `total` (number): 전체 OSD 개수
  - `up` (number): 활성 OSD 개수
  - `in` (number): 클러스터에 포함된 OSD 개수
  - `down` (number): 다운된 OSD 개수
  - `out` (number): 클러스터에서 제외된 OSD 개수
  - `averageUsage` (number): OSD 평균 사용률 (0-100 퍼센트)
- `monitors` (object): 모니터 상태
  - `total` (number): 전체 모니터 개수
  - `active` (number): 활성 모니터 개수
  - `standby` (number): 대기 중인 모니터 개수
- `pgs` (object): Placement Group 상태
  - `total` (number): 전체 PG 개수
  - `activeClean` (number): 정상 상태 PG 개수
  - `scrubbing` (number): 스크러빙 중인 PG 개수
  - `degraded` (number): 성능 저하 상태 PG 개수
  - `recovering` (number): 복구 중인 PG 개수
- `clientConnections` (number): 현재 클라이언트 연결 수
- `version` (string): Ceph 버전

### 백엔드 수집 방법
```java
// Ceph API 호출
GET /api/v1/health/full
- status: health.status
- message: health.checks[].summary.message (concatenate)

GET /api/v1/osd
- osds.total: osds.length
- osds.up: osds.filter(o => o.up == 1).length
- osds.in: osds.filter(o => o.in == 1).length
- osds.down: osds.filter(o => o.up == 0).length
- osds.out: osds.filter(o => o.in == 0).length

GET /api/v1/osd/perf
- osds.averageUsage: average(osds[].perf_stat.apply_latency_ms)

GET /api/v1/mon
- monitors.total: mons.length
- monitors.active: mons.filter(m => m.rank >= 0).length

GET /api/v1/pg_summary
- pgs.total: pg_summary.num_pgs
- pgs.activeClean: pg_stats['active+clean']
- pgs.scrubbing: pg_stats['scrubbing']
- pgs.degraded: pg_stats['degraded']

// Prometheus
Query: ceph_mon_metadata
- version: ceph_version label value
```

---

## 4. Risk Assessment Data (위험도 평가)

**사용 컴포넌트**: `RiskPanel.tsx`

### 데이터 구조
```json
{
  "overallRisk": "medium",
  "riskScore": 65,
  "risks": [
    {
      "level": "high",
      "category": "capacity",
      "title": "Storage Capacity Warning",
      "description": "Storage pool 'rbd' is 78% full. Consider expanding capacity or cleaning up unused data.",
      "timestamp": 1705401600000
    },
    {
      "level": "medium",
      "category": "performance",
      "title": "High OSD Latency",
      "description": "OSD.5 showing latency spikes above 50ms. Check disk health.",
      "timestamp": 1705398000000
    }
  ],
  "recommendations": [
    "Add 2 more OSDs to distribute load",
    "Enable compression on EC pools",
    "Schedule scrubbing during off-peak hours"
  ]
}
```

### 필드 설명
- `overallRisk` (string): 전체 위험도 레벨 - "low" | "medium" | "high" | "critical" | "unknown"
- `riskScore` (number): 위험도 점수 (0-100, 높을수록 위험)
- `risks` (array): 개별 위험 항목들
  - `level` (string): 위험 수준 - "low" | "medium" | "high" | "critical"
  - `category` (string): 위험 카테고리 - "capacity" | "performance" | "health" | "security"
  - `title` (string): 위험 제목
  - `description` (string): 위험 상세 설명
  - `timestamp` (number): 탐지 시각 (Unix timestamp, milliseconds)
- `recommendations` (string[]): AI 기반 권장 사항 목록

### 백엔드 수집 방법
```java
// 위험도는 여러 지표를 종합하여 계산
// 1. Capacity Risk
if (usagePercent > 80) -> high
if (timeToFullDays < 30) -> high

// 2. Performance Risk
Query: rate(ceph_osd_op_r_latency_sum[5m])
if (latency > 50ms) -> medium
if (latency > 100ms) -> high

// 3. Health Risk
GET /api/v1/health/full
if (status == "HEALTH_ERR") -> critical
if (status == "HEALTH_WARN") -> medium

// 4. Overall Risk Score (0-100)
riskScore = (capacityRisk * 0.4) + (performanceRisk * 0.3) + (healthRisk * 0.3)

// 5. Recommendations (Predictor API 활용)
POST http://predictor-api:8000/api/anomaly/recommend
Request: { cluster_metrics, current_risks }
Response: { recommendations[] }
```

---

## 5. Chart Data (차트 데이터)

**사용 컴포넌트**: 각 차트 컴포넌트들

### 5.1 Pool Usage Chart
```json
{
  "data": [
    {
      "timestamp": 1705401600000,
      "value": 7696581394432,
      "label": "Used"
    }
  ],
  "currentUsage": 70.0,
  "trend": "increasing"
}
```

### 5.2 IOPS Chart
```json
{
  "readIops": [
    { "timestamp": 1705401600000, "value": 1250 },
    { "timestamp": 1705401660000, "value": 1320 }
  ],
  "writeIops": [
    { "timestamp": 1705401600000, "value": 890 },
    { "timestamp": 1705401660000, "value": 920 }
  ],
  "currentReadIops": 1320,
  "currentWriteIops": 920
}
```

**백엔드 수집**:
```java
// Prometheus
Query: rate(ceph_pool_rd_total[1m])  // Read IOPS
Query: rate(ceph_pool_wr_total[1m])  // Write IOPS
```

### 5.3 Latency Chart
```json
{
  "data": [
    { "timestamp": 1705401600000, "value": 12.5 },
    { "timestamp": 1705401660000, "value": 13.2 }
  ],
  "currentLatency": 13.2,
  "averageLatency": 12.8
}
```

**백엔드 수집**:
```java
// Prometheus
Query: ceph_osd_apply_latency_ms
```

### 5.4 Throughput Chart
```json
{
  "readThroughput": [
    { "timestamp": 1705401600000, "value": 524288000 },
    { "timestamp": 1705401660000, "value": 536870912 }
  ],
  "writeThroughput": [
    { "timestamp": 1705401600000, "value": 314572800 },
    { "timestamp": 1705401660000, "value": 335544320 }
  ],
  "currentReadMb": 512.0,
  "currentWriteMb": 320.0
}
```

**필드 설명**:
- `readThroughput/writeThroughput`: 시계열 처리량 데이터 (바이트/초)
- `currentReadMb/currentWriteMb`: 현재 처리량 (MB/s 단위로 표시용)

**백엔드 수집**:
```java
// Prometheus
Query: rate(ceph_pool_rd_bytes[1m])  // 바이트/초
Query: rate(ceph_pool_wr_bytes[1m])  // 바이트/초

// MB/s 변환은 프론트엔드에서 수행
currentReadMb = readThroughput[last].value / (1024 * 1024)
```

### 5.5 OSD Performance Chart
```json
{
  "data": [
    { "timestamp": 1705401600000, "value": 15.2, "label": "OSD.0" },
    { "timestamp": 1705401600000, "value": 18.5, "label": "OSD.1" }
  ],
  "averagePerformance": 16.8,
  "slowOsds": 2
}
```

**백엔드 수집**:
```java
GET /api/v1/osd/perf
- data[]: osd별 apply_latency_ms
- slowOsds: latency > 30ms인 OSD 개수
```

### 5.6 Network Error Chart
```json
{
  "data": [
    { "timestamp": 1705401600000, "value": 12 },
    { "timestamp": 1705401660000, "value": 15 }
  ],
  "totalErrors": 127,
  "errorRate": 0.02
}
```

**백엔드 수집**:
```java
// Prometheus
Query: ceph_osd_nw_rx_err_total + ceph_osd_nw_tx_err_total
```

### 5.7 Scrub Error Chart
```json
{
  "data": [
    { "timestamp": 1705401600000, "value": 3 },
    { "timestamp": 1705401660000, "value": 3 }
  ],
  "totalErrors": 3,
  "lastScrubTime": 1705390800000
}
```

**백엔드 수집**:
```java
GET /api/v1/pg_summary
- scrub_errors: pg별 scrub_errors 합계

Query: ceph_pg_last_scrub_stamp
- lastScrubTime: 가장 최근 스크럽 시각
```

### 5.8 PG Inconsistency Chart
```json
{
  "data": [
    { "timestamp": 1705401600000, "value": 2 },
    { "timestamp": 1705401660000, "value": 2 }
  ],
  "inconsistentPgs": 2,
  "inconsistencyRate": 0.39
}
```

**백엔드 수집**:
```java
GET /api/v1/pg_summary
- inconsistentPgs: state에 'inconsistent' 포함된 PG 개수
- inconsistencyRate: (inconsistentPgs / totalPgs) * 100
```

---

## 6. Alert Data (알림 정보)

**사용 컴포넌트**: `AlertCenter.tsx`

### 데이터 구조
```json
[
  {
    "id": "alert-001",
    "severity": "critical",
    "type": "OSD_DOWN",
    "component": "OSD.5",
    "message": "OSD.5 is down",
    "description": "OSD.5 has been marked down and needs immediate attention. Last seen: 2 minutes ago.",
    "timestamp": 1705401540000,
    "resolved": false,
    "affectedComponents": ["OSD.5", "PG-2.3a", "PG-2.4b"]
  },
  {
    "id": "alert-002",
    "severity": "warning",
    "type": "HIGH_CAPACITY",
    "component": "Pool.rbd",
    "message": "Pool 'rbd' usage above 75%",
    "description": "The 'rbd' pool has reached 78% capacity utilization.",
    "timestamp": 1705398000000,
    "resolved": false,
    "affectedComponents": ["Pool.rbd"]
  }
]
```

### 필드 설명
- `id` (string): 알림 고유 ID
- `severity` (string): 심각도 - "info" | "warning" | "error" | "critical"
- `type` (string): 알림 유형 - "OSD_DOWN" | "HIGH_CAPACITY" | "PG_DEGRADED" | "NETWORK_ERROR" 등
- `component` (string): 영향 받는 컴포넌트
- `message` (string): 짧은 알림 메시지
- `description` (string): 상세 설명
- `timestamp` (number): 발생 시각 (Unix timestamp, milliseconds)
- `resolved` (boolean): 해결 여부
- `affectedComponents` (string[]): 영향 받는 컴포넌트 목록

### 백엔드 수집 방법
```java
GET /api/v1/health/full
- alerts: health.checks[] 배열을 Alert 형식으로 변환

// Prometheus AlertManager 연동
GET /api/v1/alerts
- 활성 알림 목록 조회

// Custom Rules
- OSD down > 5분: CRITICAL
- Pool usage > 80%: WARNING
- Pool usage > 90%: ERROR
- PG degraded > 10분: WARNING
- Network errors > 100/min: WARNING
```

---

## 7. AI Insights Data (AI 분석 정보)

**사용 컴포넌트**: `PredictionDashboard.tsx`

### 데이터 구조
```json
[
  {
    "id": "insight-001",
    "title": "Predicted Capacity Shortage",
    "description": "Based on current growth trends, storage pool 'rbd' will reach 90% capacity within 28 days.",
    "severity": "high",
    "category": "capacity_prediction",
    "confidence": 0.89,
    "recommendations": [
      "Plan capacity expansion",
      "Review data retention policies",
      "Enable compression on pool"
    ],
    "timestamp": 1705401600000,
    "metadata": {
      "affected_pool": "rbd",
      "predicted_date": "2025-02-13",
      "current_growth_rate_bytes_per_day": 107374182400,
      "model_version": "v2.1.0"
    }
  },
  {
    "id": "insight-002",
    "title": "OSD Performance Anomaly Detected",
    "description": "OSD.5 shows unusual latency patterns that may indicate disk degradation.",
    "severity": "medium",
    "category": "performance_anomaly",
    "confidence": 0.76,
    "recommendations": [
      "Run SMART diagnostics on OSD.5",
      "Consider preemptive replacement",
      "Monitor for further degradation"
    ],
    "timestamp": 1705398000000,
    "metadata": {
      "affected_osd": "OSD.5",
      "anomaly_score": 0.82,
      "baseline_latency_ms": 12.5,
      "current_latency_ms": 45.3
    }
  }
]
```

### 필드 설명
- `id` (string): 인사이트 고유 ID
- `title` (string): 인사이트 제목
- `description` (string): 상세 설명
- `severity` (string): 심각도 - "low" | "medium" | "high" | "critical"
- `category` (string): 분석 카테고리
  - "capacity_prediction": 용량 예측
  - "performance_anomaly": 성능 이상 탐지
  - "failure_prediction": 장애 예측
  - "optimization": 최적화 제안
- `confidence` (number): 신뢰도 (0.0-1.0)
- `recommendations` (string[]): AI 권장 사항 목록
- `timestamp` (number): 분석 시각 (Unix timestamp, milliseconds)
- `metadata` (object): 추가 메타데이터 (카테고리별로 다름)

### 백엔드 수집 방법
```java
// Predictor API 호출
POST http://predictor-api:8000/api/anomaly/detect
Request: {
  "metrics": {
    "capacity": {...},
    "performance": {...},
    "health": {...}
  },
  "historical_data": [...]
}

Response: {
  "anomalies": [...],
  "predictions": [...],
  "recommendations": [...]
}

// 용량 예측 모델
POST http://predictor-api:8000/api/capacity/predict
Request: {
  "pool_name": "rbd",
  "current_usage_bytes": 7696581394432,
  "time_series_data_bytes": [...]  // 최근 30일 데이터 (바이트)
}

Response: {
  "predicted_full_date": "2025-02-13",
  "confidence": 0.89,
  "daily_growth_bytes": 107374182400
}

// OSD 이상 탐지
POST http://predictor-api:8000/api/osd/detect-anomaly
Request: {
  "osd_id": 5,
  "latency_series": [...],
  "iops_series": [...]
}

Response: {
  "is_anomaly": true,
  "anomaly_score": 0.82,
  "predicted_failure_probability": 0.15
}
```

---

## 8. 타입 정의 위치

모든 타입 정의는 `/lib/api/dashboardApi.ts`에 있습니다:

```typescript
export interface DashboardData { ... }
export interface CapacityData { ... }
export interface ClusterHealthData { ... }
export interface RiskAssessmentData { ... }
export interface ChartData { ... }
export interface AlertData { ... }
export interface AIInsightData { ... }
```

---

## 9. WebSocket 실시간 업데이트

대시보드는 WebSocket을 통해 10초마다 실시간으로 데이터를 업데이트합니다.

### WebSocket 메시지 형식
```json
{
  "type": "dashboard_update",
  "timestamp": 1705401600000,
  "data": {
    /* DashboardData 전체 또는 일부 */
  }
}
```

### 프론트엔드 연결
```typescript
import { DashboardWebSocket } from '@/lib/api/dashboardApi';

const ws = new DashboardWebSocket(
  (data) => { /* 메시지 수신 처리 */ },
  (connected) => { /* 연결 상태 변경 */ },
  (error) => { /* 에러 처리 */ }
);

ws.connect('ws://localhost:8080/ws/dashboard');
```

---

## 10. 단위 변환 규칙

### 용량 단위
- **백엔드**: 모든 용량 값을 **바이트(bytes)** 단위로 반환
- **프론트엔드**: `formatBytes()` 함수로 동적 변환하여 표시
  - 1024 B 미만: "XXX B"
  - 1024 B ~ 1 MB: "XX.X KB"
  - 1 MB ~ 1 GB: "XX.X MB"
  - 1 GB ~ 1 TB: "XX.X GB"
  - 1 TB 이상: "XX.X TB"

### 처리량 단위
- **백엔드**: 바이트/초(bytes/second) 단위로 반환
- **프론트엔드**: `formatBandwidth()` 함수로 동적 변환
  - "XXX B/s", "XX.X KB/s", "XX.X MB/s", "XX.X GB/s"

### 비율/퍼센트
- 항상 0-100 범위의 숫자
- 소수점 1자리까지 표시: `formatPercent(value, 1)`

---

## 11. 주의사항

1. **바이트 단위 통일**: 모든 용량 관련 값은 바이트로 저장하고 프론트엔드에서 변환
2. **타임스탬프**: Unix timestamp (밀리초) 사용
3. **Null Safety**: 모든 선택적 필드는 `|| 0` 또는 `|| []`로 기본값 처리
4. **실시간 업데이트**: WebSocket 연결 유지 및 재연결 로직 필수
5. **에러 핸들링**: API 호출 실패 시 fallback 데이터 표시
6. **성능**: 대용량 시계열 데이터는 샘플링하여 전송 (최대 100개 데이터 포인트)

---

**작성자**: Claude Code
**최종 수정**: 2025-01-16
