# Report System Refactoring Plan
**리포트 시스템 6개 → 3개 타입 리팩토링 계획서**

---

## 📋 목차
1. [개요](#1-개요)
2. [현재 구조 분석](#2-현재-구조-분석)
3. [3가지 리포트 타입 설계](#3-3가지-리포트-타입-설계)
4. [백엔드 API 설계](#4-백엔드-api-설계)
5. [프론트엔드 컴포넌트 설계](#5-프론트엔드-컴포넌트-설계)
6. [마이그레이션 전략](#6-마이그레이션-전략)
7. [구현 단계](#7-구현-단계)

---

## 1. 개요

### 1.1 목표
- 현재 6개의 리포트 타입을 3개로 통합 및 재구성
- 각 리포트 타입별로 명확한 목적과 구조 정의
- PDF 출력 시 각 리포트마다 전용 타이틀 페이지 및 요약 제공

### 1.2 리포트 타입 변경
**기존 (6개)**:
- DAILY
- WEEKLY
- MONTHLY
- AI_INSIGHTS
- PREDICTIONS
- PERFORMANCE

**변경 후 (3개)**:
- **DAILY** - 일일 클러스터 상태 리포트 (장애예측 부분 제외)
- **TREND** - 7일간 트렌드 데이터 리포트 (NEW)
- **PREDICTIONS** - AI 장애 예측 리포트 (NEW)

---

## 2. 현재 구조 분석

### 2.1 현재 Daily Report 섹션 구조
(위치: `/app/reports/view/[id]/page.tsx`)

| 순서 | 섹션명 | 라인 | 용도 | 변경 계획 |
|-----|--------|-----|------|----------|
| 0 | ReportTitlePage | 428-448 | PDF 첫 페이지 (High Risk 포함) | **High Risk 부분 제거** |
| 1 | ExecutiveSummary | 452-487 | 요약 정보 | 유지 |
| 2 | InfrastructureStatus | 490-542 | 인프라 상태 | 유지 |
| 3 | PerformanceMetrics | 545-573 | 성능 메트릭 | 유지 |
| 4 | CapacityManagement | 576-606 | 용량 관리 | 유지 |
| 5 | AIInsightsSection | 609-634 | AI 인사이트 | 유지 |
| 6 | AvailabilityRecovery | 637-669 | 가용성/복구 | 유지 |
| 7 | **PredictionSection** | 672-688 | **12개 장애예측 카드** | **→ PREDICTIONS로 이동** |
| 8 | OperationalHistory | 691-721 | 운영 히스토리 | 유지 |
| 9 | DetailedTables | 724-761 | 상세 테이블 | 유지 |

### 2.2 현재 ReportTitlePage 구조
(위치: `/components/reports/sections/ReportTitlePage.tsx`)

**포함 내용**:
- Report Title, Generated At, Time Range
- Cluster Status Summary (Health, Capacity, Alerts, OSDs)
- **High Risk Predictions Summary** (lines 153-228) - **→ PREDICTIONS로 이동**
- **highRiskSummary** (LLM 생성 요약) - **→ PREDICTIONS로 이동**

### 2.3 현재 PredictionSection 구조
(위치: `/components/reports/sections/PredictionSection.tsx`)

**표시 내용**:
- 12개 장애예측 카드 (Severity 순 정렬)
- 각 카드: name, severity, probability, confidence, timeToImpact
- AI Analysis, Affected Components, Recommended Actions

---

## 3. 3가지 리포트 타입 설계

### 3.1 DAILY Report

#### 목적
일일 클러스터 상태 및 운영 현황 종합 리포트

#### 구조
```
📄 DAILY Report
├── 📊 Title Page (PDF only)
│   ├── Report Title & Metadata
│   ├── Cluster Status Summary
│   └── ❌ High Risk Predictions (제거)
├── 1️⃣ Executive Summary
│   ├── Health Score
│   ├── Key KPIs
│   ├── Risks
│   └── Critical Issues
├── 2️⃣ Infrastructure Status
│   ├── Hosts
│   ├── Disks
│   ├── Pools
│   └── Network Topology
├── 3️⃣ Performance Metrics
│   ├── IOPS Trends
│   ├── Latency Distribution
│   └── Throughput
├── 4️⃣ Capacity Management
│   ├── Current Usage
│   ├── Pool Usage
│   └── Predictions
├── 5️⃣ AI Insights
│   ├── Anomalies
│   ├── Predictions (요약만)
│   └── Recommendations
├── 6️⃣ Availability & Recovery
│   ├── Data Protection
│   ├── Recovery Readiness
│   └── Replication Status
├── ❌ AI Failure Predictions (제거 - PREDICTIONS로 이동)
├── 7️⃣ Operational History
│   ├── Config Changes
│   ├── Maintenance Logs
│   └── Incidents
└── 8️⃣ Detailed Tables
    ├── OSDs
    ├── Pools
    ├── Clients
    └── Config Params
```

#### 변경 사항
- ❌ **제거**: PredictionSection (line 672-688)
- ❌ **제거**: ReportTitlePage의 High Risk Predictions 부분 (lines 153-228)
- ✅ **유지**: 나머지 모든 섹션

---

### 3.2 TREND Report (NEW)

#### 목적
7일간 트렌드 데이터 기반 차트/테이블 중심 리포트

#### 구조
```
📄 TREND Report
├── 📊 Title Page (PDF only)
│   ├── Report Title & Metadata
│   ├── Time Range (7 days)
│   ├── Cluster Summary
│   └── Trend Summary (전체 트렌드 요약)
├── 1️⃣ Capacity Trends (용량 관련)
│   ├── 📈 Cluster Capacity Trend Chart
│   ├── 📈 Pool Capacity Trend Chart
│   ├── 📈 OSD Utilization Trend Chart
│   └── 📊 Capacity Trend Table
├── 2️⃣ Performance Trends (성능 관련)
│   ├── 📈 Latency Trend Chart (Read/Write)
│   ├── 📈 IOPS Trend Chart
│   ├── 📈 Throughput Trend Chart
│   └── 📊 Performance Trend Table
├── 3️⃣ Availability Trends (가용성/신뢰성)
│   ├── 📈 OSD Status Trend Chart (UP/DOWN)
│   ├── 📈 PG Status Trend Chart
│   ├── 📈 Monitor Health Trend Chart
│   └── 📊 Availability Trend Table
├── 4️⃣ I/O Pattern Trends (I/O 패턴)
│   ├── 📈 Read/Write Ratio Trend Chart
│   ├── 📈 Operation Queue Trend Chart
│   └── 📊 I/O Pattern Table
├── 5️⃣ Recovery & Rebalancing Trends
│   ├── 📈 Recovery Objects Trend Chart
│   ├── 📈 Misplaced Objects Trend Chart
│   ├── 📈 Balancer Score Trend Chart
│   └── 📊 Recovery Trend Table
├── 6️⃣ Client Activity Trends
│   ├── 📈 Active Clients Trend Chart
│   ├── 📈 Client I/O Trend Chart
│   └── 📊 Client Activity Table
├── 7️⃣ Hardware Resource Trends
│   ├── 📈 CPU Usage Trend Chart
│   ├── 📈 Memory Usage Trend Chart
│   ├── 📈 Disk I/O Trend Chart
│   ├── 📈 Network Traffic Trend Chart
│   └── 📊 Resource Trend Table
└── 8️⃣ Error & Warning Trends
    ├── 📈 Scrub Error Trend Chart
    ├── 📈 Health Warning Trend Chart
    ├── 📈 Active Alert Trend Chart
    └── 📊 Error Trend Table
```

#### 데이터 요구사항
각 섹션별로 **7일간의 시계열 데이터** 필요 (1시간 단위 집계)

---

### 3.3 PREDICTIONS Report (NEW)

#### 목적
AI 기반 12개 장애 예측 카테고리 상세 리포트

#### 구조
```
📄 PREDICTIONS Report
├── 📊 Title Page (PDF only)
│   ├── Report Title & Metadata
│   ├── Time Range
│   ├── Cluster Summary
│   ├── ✅ High Risk Predictions Summary (DAILY에서 이동)
│   └── ✅ AI-Generated High Risk Summary (LLM)
├── 1️⃣ Prediction Summary (NEW - 상세 요약)
│   ├── 📊 Overall Risk Score
│   ├── 📊 Risk Distribution (Critical/High/Medium/Low)
│   ├── 📊 Category Breakdown (12개 카테고리별)
│   ├── 📊 Time to Impact Distribution
│   ├── 📊 Confidence Level Statistics
│   ├── 📊 Affected Components Summary
│   ├── 📈 Risk Trend (Past 7 days)
│   └── 🤖 LLM-Generated Comprehensive Analysis
├── 2️⃣ AI Failure Predictions (12 Categories)
│   ├── 🔴 1. OSD Failure Prediction
│   ├── 🔴 2. Capacity Exhaustion Prediction
│   ├── 🔴 3. Performance Degradation Prediction
│   ├── 🟠 4. PG Imbalance Prediction
│   ├── 🟠 5. Network Bottleneck Prediction
│   ├── 🟠 6. Memory Shortage Prediction
│   ├── 🟡 7. Rebalancing Needed Prediction
│   ├── 🟡 8. Hotspot OSD Prediction
│   ├── 🔵 9. Cluster Expansion Recommendation
│   ├── 🟣 10. SMART Disk Failure Prediction
│   ├── 🟣 11. Metric Disk Failure Prediction
│   └── ⚪ 12. Comprehensive Analysis
└── 3️⃣ Recommended Actions Summary
    ├── Immediate Actions (High/Critical)
    ├── Short-term Actions (Medium)
    ├── Long-term Actions (Low)
    └── Commands & Scripts
```

#### 새로운 요소
- ✅ **Prediction Summary 섹션 추가** (매우 상세한 요약)
- ✅ **Title Page에 High Risk Summary 포함**
- ✅ **12개 장애예측 카드 전체 포함** (DAILY에서 이동)

---

## 4. 백엔드 API 설계

### 4.1 새로운 Trend Report API

#### 4.1.1 Endpoint
```
GET /api/reports/trend/generate
POST /api/reports/trend/generate
```

#### 4.1.2 Request
```java
public class TrendReportRequest {
    private LocalDateTime startTime;  // 7일 전
    private LocalDateTime endTime;    // 현재
    private String granularity;       // "1h", "30m", "15m"
    private List<String> categories;  // 선택적 카테고리 필터
}
```

#### 4.1.3 Response
```java
public class TrendReportResponse extends ReportResponse {
    // 기본 ReportResponse 필드 상속

    // Trend-specific data
    private TrendReportData trendData;

    @Data
    @Builder
    public static class TrendReportData {
        // 1. Capacity Trends
        private CapacityTrends capacity;

        // 2. Performance Trends
        private PerformanceTrends performance;

        // 3. Availability Trends
        private AvailabilityTrends availability;

        // 4. I/O Pattern Trends
        private IOPatternTrends ioPattern;

        // 5. Recovery & Rebalancing Trends
        private RecoveryTrends recovery;

        // 6. Client Activity Trends
        private ClientActivityTrends clientActivity;

        // 7. Hardware Resource Trends
        private ResourceTrends resources;

        // 8. Error & Warning Trends
        private ErrorTrends errors;
    }

    // Each trend category
    @Data
    @Builder
    public static class CapacityTrends {
        private List<TrendPoint> clusterCapacity;      // 총 용량
        private List<TrendPoint> usedCapacity;         // 사용 용량
        private List<TrendPoint> availableCapacity;    // 가용 용량
        private List<TrendPoint> utilizationPercent;   // 사용률
        private Map<String, List<TrendPoint>> poolUsage;  // Pool별 사용량
        private List<TrendPoint> osdUtilization;       // OSD 사용률 평균
        private Map<String, Object> statistics;        // 통계 정보
        private List<String> insights;                 // AI 인사이트
    }

    @Data
    @Builder
    public static class PerformanceTrends {
        private List<TrendPoint> readLatency;          // 읽기 레이턴시
        private List<TrendPoint> writeLatency;         // 쓰기 레이턴시
        private List<TrendPoint> readIops;             // 읽기 IOPS
        private List<TrendPoint> writeIops;            // 쓰기 IOPS
        private List<TrendPoint> totalIops;            // 전체 IOPS
        private List<TrendPoint> readThroughput;       // 읽기 처리량
        private List<TrendPoint> writeThroughput;      // 쓰기 처리량
        private List<TrendPoint> totalThroughput;      // 전체 처리량
        private Map<String, Object> statistics;
        private List<String> insights;
    }

    @Data
    @Builder
    public static class AvailabilityTrends {
        private List<TrendPoint> upOsds;               // UP OSD 수
        private List<TrendPoint> downOsds;             // DOWN OSD 수
        private List<TrendPoint> activePgs;            // Active PG 수
        private List<TrendPoint> degradedPgs;          // Degraded PG 수
        private List<TrendPoint> inconsistentPgs;      // Inconsistent PG 수
        private List<TrendPoint> monitorQuorum;        // Monitor 쿼럼
        private List<TrendPoint> healthScore;          // 전체 Health Score
        private Map<String, Object> statistics;
        private List<String> insights;
    }

    @Data
    @Builder
    public static class IOPatternTrends {
        private List<TrendPoint> readRatio;            // 읽기 비율
        private List<TrendPoint> writeRatio;           // 쓰기 비율
        private List<TrendPoint> queueLength;          // 작업 큐 길이
        private List<TrendPoint> slowOps;              // Slow ops 수
        private List<TrendPoint> blockedOps;           // Blocked ops 수
        private Map<String, Object> statistics;
        private List<String> insights;
    }

    @Data
    @Builder
    public static class RecoveryTrends {
        private List<TrendPoint> recoveringObjects;    // 복구 중 객체
        private List<TrendPoint> recoverySpeed;        // 복구 속도
        private List<TrendPoint> misplacedObjects;     // 잘못 배치된 객체
        private List<TrendPoint> degradedObjects;      // Degraded 객체
        private List<TrendPoint> balancerScore;        // Balancer 점수
        private Map<String, Object> statistics;
        private List<String> insights;
    }

    @Data
    @Builder
    public static class ClientActivityTrends {
        private List<TrendPoint> activeClients;        // 활성 클라이언트
        private List<TrendPoint> clientIops;           // 클라이언트 IOPS
        private List<TrendPoint> clientBandwidth;      // 클라이언트 대역폭
        private Map<String, Object> statistics;
        private List<String> insights;
    }

    @Data
    @Builder
    public static class ResourceTrends {
        private List<TrendPoint> avgCpuUsage;          // 평균 CPU 사용률
        private List<TrendPoint> avgMemUsage;          // 평균 메모리 사용률
        private List<TrendPoint> diskIops;             // 디스크 IOPS
        private List<TrendPoint> diskLatency;          // 디스크 레이턴시
        private List<TrendPoint> networkRx;            // 네트워크 수신
        private List<TrendPoint> networkTx;            // 네트워크 송신
        private List<TrendPoint> networkErrors;        // 네트워크 에러
        private Map<String, Object> statistics;
        private List<String> insights;
    }

    @Data
    @Builder
    public static class ErrorTrends {
        private List<TrendPoint> scrubErrors;          // Scrub 에러
        private List<TrendPoint> deepScrubErrors;      // Deep scrub 에러
        private List<TrendPoint> readErrors;           // 읽기 에러
        private List<TrendPoint> writeErrors;          // 쓰기 에러
        private List<TrendPoint> healthWarnings;       // Health 경고
        private List<TrendPoint> activeAlerts;         // 활성 알림
        private Map<String, Object> statistics;
        private List<String> insights;
    }
}
```

#### 4.1.4 Prometheus 쿼리 매핑

**trend-report.md의 메트릭을 기반으로 각 카테고리별 PromQL**:

| 카테고리 | 메트릭 | PromQL (7일간) |
|---------|-------|---------------|
| **Capacity** | 총 용량 | `ceph_cluster_total_bytes[7d:1h]` |
| | 사용 용량 | `ceph_cluster_total_used_bytes[7d:1h]` |
| | 사용률 | `(ceph_cluster_total_used_bytes / ceph_cluster_total_bytes * 100)[7d:1h]` |
| **Performance** | 읽기 레이턴시 | `(rate(ceph_osd_op_r_latency_sum[5m]) / rate(ceph_osd_op_r_latency_count[5m]))[7d:1h]` |
| | 쓰기 레이턴시 | `(rate(ceph_osd_op_w_latency_sum[5m]) / rate(ceph_osd_op_w_latency_count[5m]))[7d:1h]` |
| | IOPS | `sum(rate(ceph_osd_op[5m]))[7d:1h]` |
| | 처리량 | `sum(rate(ceph_osd_op_r_out_bytes[5m]) + rate(ceph_osd_op_w_in_bytes[5m]))[7d:1h]` |
| **Availability** | UP OSDs | `count(ceph_osd_up == 1)[7d:1h]` |
| | Active PGs | `ceph_pg_active[7d:1h]` |
| | Degraded PGs | `ceph_pg_degraded[7d:1h]` |
| **I/O Pattern** | 읽기 비율 | `(rate(ceph_osd_op_r[5m]) / (rate(ceph_osd_op_r[5m]) + rate(ceph_osd_op_w[5m])) * 100)[7d:1h]` |
| | Queue Length | `ceph_osd_op_queue_length[7d:1h]` |
| **Recovery** | 복구 객체 | `ceph_cluster_recovering_objects[7d:1h]` |
| | Misplaced | `ceph_cluster_misplaced_objects[7d:1h]` |
| **Resources** | CPU 사용률 | `(100 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)[7d:1h]` |
| | 메모리 사용률 | `((1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100)[7d:1h]` |
| **Errors** | Scrub Errors | `sum(ceph_pg_scrub_errors)[7d:1h]` |
| | Active Alerts | `count(ALERTS{alertstate="firing"})[7d:1h]` |

### 4.2 수정된 Predictions Report API

#### 4.2.1 Endpoint
```
POST /api/reports/predictions/generate
```

#### 4.2.2 Response 확장
```java
public class PredictionsReportResponse extends ReportResponse {
    // 기본 ReportResponse 필드 상속

    // Predictions-specific data
    private PredictionsSummary predictionsSummary;
    private List<PredictionDetail> predictions;  // 12개 카드
    private List<RecommendedAction> actions;

    @Data
    @Builder
    public static class PredictionsSummary {
        private Double overallRiskScore;           // 전체 위험 점수 (0-100)
        private RiskDistribution riskDistribution; // 위험도 분포
        private CategoryBreakdown categoryBreakdown; // 카테고리별 분석
        private TimeToImpactDistribution timeDistribution;
        private ConfidenceStatistics confidenceStats;
        private AffectedComponentsSummary affectedComponents;
        private List<TrendPoint> riskTrendLast7Days; // 7일간 위험도 추세
        private String llmComprehensiveAnalysis;   // LLM 종합 분석
    }

    @Data
    @Builder
    public static class RiskDistribution {
        private Integer criticalCount;
        private Integer highCount;
        private Integer mediumCount;
        private Integer lowCount;
        private Double criticalPercent;
        private Double highPercent;
        private Double mediumPercent;
        private Double lowPercent;
    }

    @Data
    @Builder
    public static class CategoryBreakdown {
        private Map<String, CategoryRisk> categories; // 12개 카테고리

        @Data
        @Builder
        public static class CategoryRisk {
            private String severity;
            private Double probability;
            private Integer timeToImpact;
            private String trend;
        }
    }

    @Data
    @Builder
    public static class TimeToImpactDistribution {
        private Integer immediate;      // < 24h
        private Integer shortTerm;      // 24h - 7d
        private Integer mediumTerm;     // 7d - 30d
        private Integer longTerm;       // > 30d
    }

    @Data
    @Builder
    public static class ConfidenceStatistics {
        private Double averageConfidence;
        private Double highConfidenceCount;  // > 80%
        private Double mediumConfidenceCount; // 50-80%
        private Double lowConfidenceCount;   // < 50%
    }

    @Data
    @Builder
    public static class AffectedComponentsSummary {
        private Map<String, Integer> componentCounts;  // 컴포넌트별 영향 받는 예측 수
        private List<String> criticalComponents;       // 가장 위험한 컴포넌트
    }

    @Data
    @Builder
    public static class PredictionDetail {
        private String id;
        private String category;
        private String name;
        private String severity;
        private Double probability;
        private Double confidence;
        private Integer timeToImpact;
        private String aiAnalysis;
        private List<String> affectedComponents;
        private List<String> recommendedActions;
        private String trend;
    }

    @Data
    @Builder
    public static class RecommendedAction {
        private String priority;  // immediate, short-term, long-term
        private String category;
        private String action;
        private List<String> commands;
        private String estimatedTime;
    }
}
```

### 4.3 수정된 Daily Report API

**변경사항 없음** - 동일한 endpoint 사용, 단 응답에서 prediction 섹션 제거

```
POST /api/reports/daily/generate
```

---

## 5. 프론트엔드 컴포넌트 설계

### 5.1 컴포넌트 구조

```
components/
├── reports/
│   ├── QuickReportCards.tsx         (수정 - 3개 카드만 표시)
│   ├── sections/
│   │   ├── daily/                   (NEW - Daily Report 전용)
│   │   │   ├── DailyTitlePage.tsx
│   │   │   └── (기존 섹션들 재사용)
│   │   ├── trend/                   (NEW - Trend Report 전용)
│   │   │   ├── TrendTitlePage.tsx
│   │   │   ├── CapacityTrendsSection.tsx
│   │   │   ├── PerformanceTrendsSection.tsx
│   │   │   ├── AvailabilityTrendsSection.tsx
│   │   │   ├── IOPatternTrendsSection.tsx
│   │   │   ├── RecoveryTrendsSection.tsx
│   │   │   ├── ClientActivityTrendsSection.tsx
│   │   │   ├── ResourceTrendsSection.tsx
│   │   │   └── ErrorTrendsSection.tsx
│   │   ├── predictions/             (NEW - Predictions Report 전용)
│   │   │   ├── PredictionsTitlePage.tsx
│   │   │   ├── PredictionsSummarySection.tsx (NEW - 상세 요약)
│   │   │   ├── PredictionSection.tsx (기존 - 이동)
│   │   │   └── RecommendedActionsSection.tsx
│   │   └── (기존 공통 섹션들)
│   │       ├── ReportTitlePage.tsx  (수정 - High Risk 제거)
│   │       ├── ExecutiveSummary.tsx
│   │       ├── InfrastructureStatus.tsx
│   │       ├── PerformanceMetrics.tsx
│   │       ├── CapacityManagement.tsx
│   │       ├── AIInsightsSection.tsx
│   │       ├── AvailabilityRecovery.tsx
│   │       ├── OperationalHistory.tsx
│   │       └── DetailedTables.tsx
```

### 5.2 새로운 컴포넌트 상세

#### 5.2.1 TrendTitlePage
```typescript
interface TrendTitlePageProps {
  reportTitle: string;
  generatedAt: string;
  timeRange: {
    start: string;
    end: string;
  };
  clusterSummary: {
    health: string;
    capacityUtilization: number;
    activeAlerts: number;
    totalOsds: number;
    upOsds: number;
  };
  trendSummary: {
    capacityGrowth: string;      // "증가/감소/안정"
    performanceTrend: string;    // "개선/악화/안정"
    availabilityTrend: string;   // "개선/악화/안정"
    keyFindings: string[];       // 주요 발견사항
  };
}
```

#### 5.2.2 TrendSection 공통 구조
```typescript
interface TrendSectionProps {
  title: string;
  charts: ChartData[];
  table: TableData;
  statistics: {
    average: number;
    min: number;
    max: number;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
  };
  insights: string[];
}

interface ChartData {
  type: 'line' | 'area' | 'bar';
  title: string;
  data: TrendPoint[];
  xAxis: string;
  yAxis: string;
  unit: string;
}
```

#### 5.2.3 PredictionsTitlePage
```typescript
interface PredictionsTitlePageProps {
  reportTitle: string;
  generatedAt: string;
  timeRange: {
    start: string;
    end: string;
  };
  clusterSummary: {
    health: string;
    capacityUtilization: number;
    activeAlerts: number;
    totalOsds: number;
    upOsds: number;
  };
  highRiskPredictions: HighRiskPrediction[];  // DAILY에서 이동
  highRiskSummary: string;  // LLM 생성 요약
  overallRiskScore: number;  // 전체 위험 점수
}
```

#### 5.2.4 PredictionsSummarySection (NEW)
```typescript
interface PredictionsSummarySectionProps {
  overallRiskScore: number;
  riskDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  categoryBreakdown: {
    [category: string]: {
      severity: string;
      probability: number;
      timeToImpact: number;
    };
  };
  timeToImpactDistribution: {
    immediate: number;
    shortTerm: number;
    mediumTerm: number;
    longTerm: number;
  };
  confidenceStats: {
    average: number;
    high: number;
    medium: number;
    low: number;
  };
  affectedComponents: {
    [component: string]: number;
  };
  riskTrend: TrendPoint[];
  llmAnalysis: string;
}
```

**표시 내용**:
- 🎯 Overall Risk Score (Gauge Chart)
- 📊 Risk Distribution (Pie Chart)
- 📊 Category Breakdown (12개 카테고리, Horizontal Bar Chart)
- ⏰ Time to Impact Distribution (Bar Chart)
- 🎓 Confidence Level Statistics (Bar Chart)
- 🔧 Affected Components (Top 10, Bar Chart)
- 📈 Risk Trend (Last 7 days, Line Chart)
- 🤖 LLM Comprehensive Analysis (Text with highlights)

### 5.3 페이지 구조

#### 5.3.1 Daily Report View
```typescript
// app/reports/view/[id]/page.tsx
export default function DailyReportViewPage() {
  return (
    <>
      <DailyTitlePage />  {/* High Risk 제거 */}
      <ExecutiveSummary />
      <InfrastructureStatus />
      <PerformanceMetrics />
      <CapacityManagement />
      <AIInsightsSection />
      <AvailabilityRecovery />
      {/* PredictionSection 제거 */}
      <OperationalHistory />
      <DetailedTables />
    </>
  );
}
```

#### 5.3.2 Trend Report View (NEW)
```typescript
// app/reports/trend/view/[id]/page.tsx
export default function TrendReportViewPage() {
  return (
    <>
      <TrendTitlePage />
      <CapacityTrendsSection />
      <PerformanceTrendsSection />
      <AvailabilityTrendsSection />
      <IOPatternTrendsSection />
      <RecoveryTrendsSection />
      <ClientActivityTrendsSection />
      <ResourceTrendsSection />
      <ErrorTrendsSection />
    </>
  );
}
```

#### 5.3.3 Predictions Report View (NEW)
```typescript
// app/reports/predictions/view/[id]/page.tsx
export default function PredictionsReportViewPage() {
  return (
    <>
      <PredictionsTitlePage />  {/* High Risk 포함 */}
      <PredictionsSummarySection />  {/* NEW - 상세 요약 */}
      <PredictionSection />  {/* 12개 카드 */}
      <RecommendedActionsSection />
    </>
  );
}
```

---

## 6. 마이그레이션 전략

### 6.1 단계별 마이그레이션

#### Phase 1: 백엔드 준비
1. ✅ TrendReportResponse DTO 생성
2. ✅ PredictionsReportResponse DTO 확장
3. ✅ TrendReportService 구현 (Prometheus 쿼리)
4. ✅ PredictionReportService 확장 (Summary 추가)
5. ✅ API Endpoint 생성

#### Phase 2: 프론트엔드 컴포넌트
1. ✅ Trend Report 컴포넌트 생성
   - TrendTitlePage
   - 8개 Trend Section 컴포넌트
2. ✅ Predictions Report 컴포넌트 생성/수정
   - PredictionsTitlePage (High Risk 포함)
   - PredictionsSummarySection (NEW)
   - PredictionSection (이동)
   - RecommendedActionsSection
3. ✅ Daily Report 컴포넌트 수정
   - ReportTitlePage (High Risk 제거)
   - PredictionSection 제거

#### Phase 3: 페이지 및 라우팅
1. ✅ `/app/reports/trend/view/[id]/page.tsx` 생성
2. ✅ `/app/reports/predictions/view/[id]/page.tsx` 생성
3. ✅ `/app/reports/view/[id]/page.tsx` 수정
4. ✅ QuickReportCards 수정 (3개 카드만)

#### Phase 4: 통합 테스트
1. ✅ Daily Report 생성 테스트
2. ✅ Trend Report 생성 테스트
3. ✅ Predictions Report 생성 테스트
4. ✅ PDF 출력 테스트

### 6.2 호환성 유지

**기존 리포트 데이터 처리**:
- 기존 DAILY 리포트: 그대로 표시 (단, PredictionSection은 숨김)
- 기존 WEEKLY/MONTHLY: → TREND로 변환
- 기존 AI_INSIGHTS/PREDICTIONS/PERFORMANCE: → PREDICTIONS로 변환

```typescript
// 타입 변환 로직
function normalizeReportType(type: string): 'DAILY' | 'TREND' | 'PREDICTIONS' {
  switch (type) {
    case 'DAILY':
      return 'DAILY';
    case 'WEEKLY':
    case 'MONTHLY':
      return 'TREND';
    case 'AI_INSIGHTS':
    case 'PREDICTIONS':
    case 'PERFORMANCE':
      return 'PREDICTIONS';
    default:
      return 'DAILY';
  }
}
```

---

## 7. 구현 단계

### 7.1 백엔드 구현 순서

#### Step 1: DTO 및 모델 생성
```
1. TrendReportResponse.java
2. PredictionsReportResponse.java
3. 관련 inner classes
```

#### Step 2: Trend Report Service 구현
```
1. TrendReportService.java
   - collectCapacityTrends()
   - collectPerformanceTrends()
   - collectAvailabilityTrends()
   - collectIOPatternTrends()
   - collectRecoveryTrends()
   - collectClientActivityTrends()
   - collectResourceTrends()
   - collectErrorTrends()
   - generateTrendReport()

2. TrendDataCollector.java (Helper)
   - queryPrometheus7Days()
   - aggregateHourly()
   - calculateStatistics()
   - generateInsights()
```

#### Step 3: Predictions Report Service 확장
```
1. PredictionReportService.java
   - calculateOverallRiskScore()
   - getRiskDistribution()
   - getCategoryBreakdown()
   - getTimeToImpactDistribution()
   - getConfidenceStatistics()
   - getAffectedComponentsSummary()
   - getRiskTrendLast7Days()
   - generateLLMComprehensiveAnalysis()
   - generatePredictionsReport()
```

#### Step 4: Controller 구현
```
1. TrendReportController.java
   - POST /api/reports/trend/generate
   - GET /api/reports/trend/{id}

2. PredictionsReportController.java
   - POST /api/reports/predictions/generate
   - GET /api/reports/predictions/{id}
```

### 7.2 프론트엔드 구현 순서

#### Step 1: Trend Report 컴포넌트
```
1. components/reports/sections/trend/TrendTitlePage.tsx
2. components/reports/sections/trend/CapacityTrendsSection.tsx
3. components/reports/sections/trend/PerformanceTrendsSection.tsx
4. components/reports/sections/trend/AvailabilityTrendsSection.tsx
5. components/reports/sections/trend/IOPatternTrendsSection.tsx
6. components/reports/sections/trend/RecoveryTrendsSection.tsx
7. components/reports/sections/trend/ClientActivityTrendsSection.tsx
8. components/reports/sections/trend/ResourceTrendsSection.tsx
9. components/reports/sections/trend/ErrorTrendsSection.tsx
```

#### Step 2: Predictions Report 컴포넌트
```
1. components/reports/sections/predictions/PredictionsTitlePage.tsx
2. components/reports/sections/predictions/PredictionsSummarySection.tsx
3. components/reports/sections/predictions/RecommendedActionsSection.tsx
4. components/reports/sections/PredictionSection.tsx 이동
```

#### Step 3: 기존 컴포넌트 수정
```
1. components/reports/sections/ReportTitlePage.tsx (High Risk 제거)
2. components/reports/QuickReportCards.tsx (3개 카드로 변경)
```

#### Step 4: 페이지 생성/수정
```
1. app/reports/trend/view/[id]/page.tsx (NEW)
2. app/reports/predictions/view/[id]/page.tsx (NEW)
3. app/reports/view/[id]/page.tsx (수정)
```

#### Step 5: API 클라이언트
```
1. lib/api/reportApi.ts
   - generateTrendReport()
   - generatePredictionsReport()
```

#### Step 6: Store 업데이트
```
1. stores/report.ts
   - 타입 변경 반영
```

### 7.3 예상 소요 시간

| 단계 | 작업 | 예상 시간 |
|-----|-----|----------|
| **백엔드** | DTO 생성 | 2시간 |
| | TrendReportService 구현 | 8시간 |
| | PredictionsReportService 확장 | 4시간 |
| | Controller 구현 | 2시간 |
| | 테스트 | 4시간 |
| **프론트엔드** | Trend 컴포넌트 (8개) | 12시간 |
| | Predictions 컴포넌트 (3개) | 6시간 |
| | 기존 컴포넌트 수정 | 3시간 |
| | 페이지 구현 | 4시간 |
| | API 연동 | 2시간 |
| **통합** | 통합 테스트 | 4시간 |
| | PDF 출력 테스트 | 3시간 |
| | 버그 수정 | 4시간 |
| **합계** | | **58시간** |

---

## 8. 체크리스트

### 8.1 백엔드
- [ ] TrendReportResponse DTO 생성
- [ ] PredictionsReportResponse DTO 확장
- [ ] TrendReportService 구현
- [ ] TrendDataCollector 구현
- [ ] PredictionReportService 확장
- [ ] TrendReportController 구현
- [ ] PredictionsReportController 구현
- [ ] Prometheus 쿼리 최적화
- [ ] 백엔드 단위 테스트
- [ ] 백엔드 통합 테스트

### 8.2 프론트엔드
- [ ] TrendTitlePage 컴포넌트
- [ ] 8개 Trend Section 컴포넌트
- [ ] PredictionsTitlePage 컴포넌트
- [ ] PredictionsSummarySection 컴포넌트
- [ ] RecommendedActionsSection 컴포넌트
- [ ] PredictionSection 이동
- [ ] ReportTitlePage 수정 (High Risk 제거)
- [ ] QuickReportCards 수정 (3개 카드)
- [ ] Trend Report 페이지
- [ ] Predictions Report 페이지
- [ ] Daily Report 페이지 수정
- [ ] API 클라이언트 구현
- [ ] Store 업데이트
- [ ] TypeScript 타입 정의

### 8.3 통합 및 테스트
- [ ] Daily Report 생성 테스트
- [ ] Trend Report 생성 테스트
- [ ] Predictions Report 생성 테스트
- [ ] PDF 출력 테스트 (3종)
- [ ] 차트 렌더링 테스트
- [ ] 반응형 레이아웃 테스트
- [ ] 프린트 스타일 테스트
- [ ] 성능 테스트 (7일 데이터)
- [ ] 에러 처리 테스트
- [ ] 기존 리포트 호환성 테스트

---

## 9. 주요 고려사항

### 9.1 성능 최적화
- Prometheus 쿼리 최적화 (7일 데이터 → 168개 포인트)
- 차트 렌더링 최적화 (ECharts lazy loading)
- PDF 생성 시간 최적화 (차트 pre-rendering)

### 9.2 데이터 정합성
- Prometheus 데이터 누락 처리
- 시간대 변환 일관성 (UTC ↔ Local)
- 차트 데이터 보간 (missing points)

### 9.3 사용자 경험
- 로딩 상태 명확한 표시
- 에러 메시지 개선
- 프린트 미리보기 기능
- 차트 확대/축소 기능

---

## 10. 다음 단계

1. **이 계획서 리뷰** - 사용자 승인
2. **백엔드 DTO 생성** - Phase 1 시작
3. **TrendReportService 구현** - Prometheus 연동
4. **프론트엔드 컴포넌트 구현** - Trend 섹션부터
5. **통합 테스트** - 전체 flow 검증

---

**문서 버전**: 1.0
**작성일**: 2025-11-04
**최종 수정일**: 2025-11-04
