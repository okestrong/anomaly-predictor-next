# Predictor 프로젝트 리포트 API 개발 가이드

## 1. 개요

### 1.1 목적
anomaly-predictor-api 백엔드의 ReportService에서 사용 중인 mock 데이터를 실제 Ceph 클러스터 데이터로 교체하기 위해, predictor 프로젝트(Go 기반)에 리포트 생성용 API를 추가합니다.

### 1.2 배경
- **백엔드 프로젝트**: anomaly-predictor-api (Java/Spring Boot)
  - 위치: `/Users/jclee/Documents/Okestro/Projects/DevSw/anomaly-predictor-api`
  - ReportService에 하드코딩된 mock 데이터 사용 중

- **데이터 제공 프로젝트**: anomaly-predictor (Go)
  - 위치: `/Users/jclee/Documents/Okestro/Projects/DevSw/anomaly-predictor`
  - go-ceph를 이용한 Ceph 클러스터 메트릭 수집
  - 현재 14개 API 엔드포인트 제공 중

### 1.3 설계 방침
- **API 분할 전략**: 3개의 API로 분할 제공
  - 단일 API로 모든 데이터를 제공하면 JSON 크기가 지나치게 커지고 응답시간이 길어질 수 있음
  - 클라이언트가 필요한 데이터만 선택적으로 요청 가능
- **API URL prefix**: `/api/predict/report/`
- **시계열 데이터**: 최근 24시간, 7일, 30일 등 기간별 데이터 제공
- **캐싱**: 성능 최적화를 위해 일부 데이터는 캐싱 고려

---

## 2. 현재 백엔드 데이터 구조 분석

### 2.1 ReportResponse 주요 데이터 구조

백엔드 `ReportService.java`에서 생성하는 리포트 데이터 구조:

```java
ReportResponse {
  id: String
  type: String (DAILY, WEEKLY, MONTHLY, AI_INSIGHTS, PREDICTIONS, PERFORMANCE, etc.)
  title: String
  description: String
  status: String
  createdAt: LocalDateTime
  updatedAt: LocalDateTime
  generatedBy: String

  timeRange: {
    start: LocalDateTime
    end: LocalDateTime
    label: String
  }

  metadata: {
    clusterName: String
    clusterHealth: String
    totalOsds: Integer
    totalHosts: Integer
    totalPools: Integer
    generationTime: Long
  }

  data: {
    clusterHealth: ClusterHealthSummary
    keyMetrics: KeyMetrics
    trends: List<TrendData>
    events: EventTimeline
    alerts: AlertsSummary
  }

  aiInsights: AIInsights
  sections: List<ReportSection>
}
```

### 2.2 핵심 데이터 타입 상세

#### 2.2.1 ClusterHealthSummary
```java
{
  health: String                    // "HEALTH_OK", "HEALTH_WARN", "HEALTH_ERR"
  uptime: Double                    // 가동시간 비율 (99.95)
  availability: Double              // 가용성 비율 (99.99)
  activeAlarms: Integer             // 활성 알람 수
  healthTrend: String               // "stable", "improving", "degrading"
  aiInsight: String                 // AI 분석 코멘트
}
```

#### 2.2.2 KeyMetrics
```java
{
  totalCapacity: Long               // 전체 용량 (bytes)
  usedCapacity: Long                // 사용 용량 (bytes)
  availableCapacity: Long           // 가용 용량 (bytes)
  utilizationPercent: Double        // 사용률 (%)

  readOps: Long                     // Read IOPS
  writeOps: Long                    // Write IOPS
  readThroughput: Double            // Read MB/s
  writeThroughput: Double           // Write MB/s

  avgLatency: Double                // 평균 지연시간 (ms)
  peakLatency: Double               // 최대 지연시간 (ms)

  activePgs: Integer                // 활성 PG 수
  degradedPgs: Integer              // Degraded PG 수
  healthyOsds: Integer              // 정상 OSD 수
  totalOsds: Integer                // 전체 OSD 수
}
```

#### 2.2.3 TrendData (시계열 데이터)
```java
{
  category: String                  // "IOPS", "Latency", "Throughput", "Capacity"

  data: List<TrendPoint> {
    timestamp: LocalDateTime
    value: Double
    label: String                   // "T-24", "T-23", ...
  }

  insights: List<String>            // AI 분석 인사이트

  prediction: {
    trend: String                   // "stable", "increasing", "decreasing"
    projectedValue: Double
    confidence: Double              // 신뢰도 (%)
    timeToThreshold: Integer        // 임계값 도달까지 일수 (optional)
  }
}
```

#### 2.2.4 EventTimeline
```java
{
  events: List<TimelineEvent> {
    id: String
    timestamp: LocalDateTime
    type: String                    // "info", "warning", "error", "critical"
    component: String               // "OSD.3", "Pool.1", "Host.ceph11"
    message: String
    details: String
    resolved: Boolean
  }

  totalEvents: Integer
  criticalEvents: Integer
  warningEvents: Integer
}
```

#### 2.2.5 AlertsSummary
```java
{
  total: Integer
  critical: Integer
  warning: Integer
  info: Integer

  recentAlerts: List<Alert> {
    id: String
    severity: String                // "critical", "warning", "info"
    title: String
    message: String
    component: String
    timestamp: LocalDateTime
    acknowledged: Boolean
    resolveAction: String
  }

  topAlerts: List<Alert>           // 우선순위 높은 알람
}
```

#### 2.2.6 AIInsights (AI 분석 결과)
```java
{
  modelInfo: {
    model: String                   // "gpt-oss-20b"
    embedding: String               // "nomic-embed-text:v1.5"
    vectorDB: String                // "Qdrant"
    version: String
  }

  anomalies: List<AnomalyDetection> {
    id: String
    timestamp: LocalDateTime
    component: String
    metric: String
    anomalyScore: Double            // 0.0 ~ 1.0
    severity: String                // "low", "medium", "high"
    description: String
    confidence: Double              // 신뢰도 (%)
  }

  patterns: List<PatternRecognition> {
    id: String
    pattern: String                 // "Daily peak usage at 10:00 AM"
    occurrences: Integer
    firstSeen: LocalDateTime
    lastSeen: LocalDateTime
    impact: String                  // "low", "medium", "high"
    description: String
  }

  predictions: List<PredictiveAnalytics> {
    category: String                // "OSD_FAILURE", "CAPACITY_EXHAUSTION", etc.
    probability: Double             // 발생 확률 (%)
    impact: String                  // "low", "medium", "high"
    estimatedTime: String           // "30 days", "7 days"
    evidenceMetrics: List<String>   // ["SMART health", "disk age"]
    anomalyScores: List<Double>
    riskFactors: List<RiskFactor> {
      factor: String
      contribution: Double          // 기여도 (%)
      severity: String
    }
    confidence: Double
    modelUsed: String               // "XGBoost", "IsolationForest"
    recommendations: List<String>
  }

  recommendations: List<OptimizationRecommendation> {
    id: String
    category: String                // "performance", "capacity", "reliability"
    title: String
    description: String
    priority: String                // "low", "medium", "high"
    estimatedImpact: String         // "5-10% performance improvement"
    effort: String                  // "low", "medium", "high"
    commands: List<String>          // Ceph CLI 명령어들
    ragContext: String              // RAG 기반 컨텍스트
  }
}
```

---

## 3. Predictor에서 추가할 API 설계

### 3.1 API 엔드포인트 개요

총 3개의 API로 분할하여 제공합니다:

| API | URL | 용도 | 예상 응답 크기 |
|-----|-----|------|---------------|
| 1 | `/api/predict/report/overview` | 클러스터 개요 + 현재 메트릭 | ~50KB |
| 2 | `/api/predict/report/metrics/history` | 시계열 메트릭 데이터 | ~200KB |
| 3 | `/api/predict/report/events` | 이벤트 + 알람 | ~100KB |

**참고**: AI 분석 데이터(AIInsights)는 anomaly-predictor-api에서 별도로 생성하므로 predictor에서 제공하지 않습니다.

---

### 3.2 API 1: `/api/predict/report/overview`

#### 3.2.1 API 명세

**Endpoint**: `GET /api/predict/report/overview`

**Query Parameters**:
- 없음 (현재 시점의 스냅샷 데이터 제공)

**Response Structure**:
```json
{
  "success": true,
  "timestamp": "2025-01-20T15:30:00Z",
  "data": {
    "metadata": {
      "clusterName": "ceph-cluster-prod",
      "clusterHealth": "HEALTH_OK",
      "totalOsds": 12,
      "totalHosts": 3,
      "totalPools": 4,
      "cephVersion": "18.2.0 (squid)",
      "uptimeSeconds": 2592000
    },
    "clusterHealth": {
      "health": "HEALTH_OK",
      "uptime": 99.95,
      "availability": 99.99,
      "activeAlarms": 2,
      "healthTrend": "stable",
      "healthDetails": {
        "mons": "3 monitors: 3 up, 3 in quorum",
        "mgrs": "2 managers: 1 active, 1 standby",
        "osds": "12 osds: 12 up, 12 in",
        "pgs": "512 pgs: 512 active+clean"
      }
    },
    "keyMetrics": {
      "capacity": {
        "totalCapacity": 10995116277760,
        "usedCapacity": 4398046511104,
        "availableCapacity": 6597069766656,
        "utilizationPercent": 40.0
      },
      "performance": {
        "readOps": 5000,
        "writeOps": 3000,
        "readThroughput": 150.5,
        "writeThroughput": 89.3,
        "avgLatency": 2.5,
        "peakLatency": 8.3
      },
      "pgStatus": {
        "activePgs": 512,
        "degradedPgs": 0,
        "inconsistentPgs": 0,
        "recoveringPgs": 0,
        "backfillingPgs": 0
      },
      "osdStatus": {
        "totalOsds": 12,
        "upOsds": 12,
        "inOsds": 12,
        "healthyOsds": 12,
        "nearFullOsds": 0,
        "fullOsds": 0
      }
    },
    "poolsSummary": [
      {
        "poolName": "rbd_pool",
        "poolId": 1,
        "size": 3,
        "minSize": 2,
        "pgNum": 256,
        "maxBytes": 2000000000000,
        "usedBytes": 800000000000,
        "usagePercent": 40.0,
        "objectCount": 12345,
        "readOps": 3000,
        "writeOps": 1500,
        "readMBps": 90.5,
        "writeMBps": 45.2
      }
    ],
    "hostsSummary": [
      {
        "hostname": "ceph-node1",
        "osdCount": 4,
        "totalOsds": 4,
        "upOsds": 4,
        "avgCpuUsage": 35.5,
        "avgMemUsage": 60.2,
        "networkRxMBps": 120.5,
        "networkTxMBps": 95.3
      }
    ]
  }
}
```

#### 3.2.2 데이터 수집 방법

이 API는 기존 predictor API들을 조합하여 데이터를 수집합니다:

1. **Cluster Metadata**
   - `ceph status` 명령어로 기본 정보 수집
   - 기존 `/api/predict/health` API 활용

2. **Cluster Health**
   - `ceph health detail` 명령어
   - 기존 `/api/predict/status` API 활용
   - uptime/availability는 시스템 메트릭에서 계산

3. **Key Metrics - Capacity**
   - `ceph df` 명령어
   - 기존 `/api/predict/pools/usage` API 활용

4. **Key Metrics - Performance**
   - `ceph osd perf` 명령어로 IOPS 수집
   - 기존 `/api/predict/osd/latency` API 활용
   - Prometheus 메트릭에서 throughput 수집

5. **Key Metrics - PG Status**
   - 기존 `/api/predict/pg-info` API 활용

6. **Key Metrics - OSD Status**
   - 기존 `/api/predict/osd/status` API 활용

7. **Pools Summary**
   - 기존 `/api/predict/pools/usage` API와 `ceph osd pool stats` 조합

8. **Hosts Summary**
   - 기존 `/api/predict/disk-info/{hostname}` API 활용
   - 시스템 메트릭 수집 추가 필요

#### 3.2.3 Go 코드 구현 가이드

```go
// internal/handlers/report_handler.go

package handlers

import (
	"encoding/json"
	"net/http"
	"time"
)

type ReportOverviewResponse struct {
	Success   bool                 `json:"success"`
	Timestamp string               `json:"timestamp"`
	Data      ReportOverviewData   `json:"data"`
}

type ReportOverviewData struct {
	Metadata       ClusterMetadata      `json:"metadata"`
	ClusterHealth  ClusterHealthSummary `json:"clusterHealth"`
	KeyMetrics     KeyMetrics           `json:"keyMetrics"`
	PoolsSummary   []PoolSummary        `json:"poolsSummary"`
	HostsSummary   []HostSummary        `json:"hostsSummary"`
}

type ClusterMetadata struct {
	ClusterName   string `json:"clusterName"`
	ClusterHealth string `json:"clusterHealth"`
	TotalOsds     int    `json:"totalOsds"`
	TotalHosts    int    `json:"totalHosts"`
	TotalPools    int    `json:"totalPools"`
	CephVersion   string `json:"cephVersion"`
	UptimeSeconds int64  `json:"uptimeSeconds"`
}

type ClusterHealthSummary struct {
	Health        string                 `json:"health"`
	Uptime        float64                `json:"uptime"`
	Availability  float64                `json:"availability"`
	ActiveAlarms  int                    `json:"activeAlarms"`
	HealthTrend   string                 `json:"healthTrend"`
	HealthDetails map[string]string      `json:"healthDetails"`
}

type KeyMetrics struct {
	Capacity    CapacityMetrics    `json:"capacity"`
	Performance PerformanceMetrics `json:"performance"`
	PgStatus    PGStatusMetrics    `json:"pgStatus"`
	OsdStatus   OSDStatusMetrics   `json:"osdStatus"`
}

type CapacityMetrics struct {
	TotalCapacity      int64   `json:"totalCapacity"`
	UsedCapacity       int64   `json:"usedCapacity"`
	AvailableCapacity  int64   `json:"availableCapacity"`
	UtilizationPercent float64 `json:"utilizationPercent"`
}

type PerformanceMetrics struct {
	ReadOps         int64   `json:"readOps"`
	WriteOps        int64   `json:"writeOps"`
	ReadThroughput  float64 `json:"readThroughput"`
	WriteThroughput float64 `json:"writeThroughput"`
	AvgLatency      float64 `json:"avgLatency"`
	PeakLatency     float64 `json:"peakLatency"`
}

type PGStatusMetrics struct {
	ActivePgs       int `json:"activePgs"`
	DegradedPgs     int `json:"degradedPgs"`
	InconsistentPgs int `json:"inconsistentPgs"`
	RecoveringPgs   int `json:"recoveringPgs"`
	BackfillingPgs  int `json:"backfillingPgs"`
}

type OSDStatusMetrics struct {
	TotalOsds    int `json:"totalOsds"`
	UpOsds       int `json:"upOsds"`
	InOsds       int `json:"inOsds"`
	HealthyOsds  int `json:"healthyOsds"`
	NearFullOsds int `json:"nearFullOsds"`
	FullOsds     int `json:"fullOsds"`
}

type PoolSummary struct {
	PoolName     string  `json:"poolName"`
	PoolId       int     `json:"poolId"`
	Size         int     `json:"size"`
	MinSize      int     `json:"minSize"`
	PgNum        int     `json:"pgNum"`
	MaxBytes     int64   `json:"maxBytes"`
	UsedBytes    int64   `json:"usedBytes"`
	UsagePercent float64 `json:"usagePercent"`
	ObjectCount  int64   `json:"objectCount"`
	ReadOps      int64   `json:"readOps"`
	WriteOps     int64   `json:"writeOps"`
	ReadMBps     float64 `json:"readMBps"`
	WriteMBps    float64 `json:"writeMBps"`
}

type HostSummary struct {
	Hostname       string  `json:"hostname"`
	OsdCount       int     `json:"osdCount"`
	TotalOsds      int     `json:"totalOsds"`
	UpOsds         int     `json:"upOsds"`
	AvgCpuUsage    float64 `json:"avgCpuUsage"`
	AvgMemUsage    float64 `json:"avgMemUsage"`
	NetworkRxMBps  float64 `json:"networkRxMBps"`
	NetworkTxMBps  float64 `json:"networkTxMBps"`
}

// Handler function
func (h *Handler) ReportOverviewHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Collect cluster metadata
	metadata := h.collectClusterMetadata()

	// 2. Collect cluster health
	clusterHealth := h.collectClusterHealth()

	// 3. Collect key metrics
	keyMetrics := h.collectKeyMetrics()

	// 4. Collect pools summary
	poolsSummary := h.collectPoolsSummary()

	// 5. Collect hosts summary
	hostsSummary := h.collectHostsSummary()

	// Build response
	response := ReportOverviewResponse{
		Success:   true,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Data: ReportOverviewData{
			Metadata:      metadata,
			ClusterHealth: clusterHealth,
			KeyMetrics:    keyMetrics,
			PoolsSummary:  poolsSummary,
			HostsSummary:  hostsSummary,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Helper functions
func (h *Handler) collectClusterMetadata() ClusterMetadata {
	// Use existing functions from connection.go
	status := h.cephConn.GetClusterStatus()

	return ClusterMetadata{
		ClusterName:   h.config.ClusterName,
		ClusterHealth: status.Health,
		TotalOsds:     len(h.cephConn.GetOSDStatus()),
		TotalHosts:    len(h.cephConn.GetHostList()),
		TotalPools:    len(h.cephConn.GetPoolUsage()),
		CephVersion:   status.CephVersion,
		UptimeSeconds: calculateUptime(),
	}
}

func (h *Handler) collectClusterHealth() ClusterHealthSummary {
	status := h.cephConn.GetClusterStatus()

	// Calculate uptime and availability from historical data
	uptime := calculateUptimePercentage()
	availability := calculateAvailability()

	// Count active alarms from ceph health detail
	activeAlarms := countActiveAlarms(status.HealthDetail)

	// Determine health trend
	healthTrend := determineHealthTrend()

	return ClusterHealthSummary{
		Health:       status.Health,
		Uptime:       uptime,
		Availability: availability,
		ActiveAlarms: activeAlarms,
		HealthTrend:  healthTrend,
		HealthDetails: map[string]string{
			"mons": status.MonStatus,
			"mgrs": status.MgrStatus,
			"osds": status.OsdStatus,
			"pgs":  status.PgStatus,
		},
	}
}

func (h *Handler) collectKeyMetrics() KeyMetrics {
	// Capacity metrics
	pools := h.cephConn.GetPoolUsage()
	var totalCap, usedCap, availCap int64
	for _, pool := range pools {
		totalCap += pool.MaxBytes
		usedCap += pool.UsedBytes
	}
	availCap = totalCap - usedCap
	utilPercent := float64(usedCap) / float64(totalCap) * 100.0

	capacity := CapacityMetrics{
		TotalCapacity:      totalCap,
		UsedCapacity:       usedCap,
		AvailableCapacity:  availCap,
		UtilizationPercent: utilPercent,
	}

	// Performance metrics
	perfStats := h.cephConn.GetPerformanceStats()
	latencyStats := h.cephConn.GetOSDLatency()

	var totalReadOps, totalWriteOps int64
	var totalReadMB, totalWriteMB float64
	var avgLat, peakLat float64

	// Aggregate from all OSDs
	for _, latency := range latencyStats {
		avgLat += latency.CommitLatencyMs
		if latency.CommitLatencyMs > peakLat {
			peakLat = latency.CommitLatencyMs
		}
	}
	if len(latencyStats) > 0 {
		avgLat = avgLat / float64(len(latencyStats))
	}

	performance := PerformanceMetrics{
		ReadOps:         totalReadOps,
		WriteOps:        totalWriteOps,
		ReadThroughput:  totalReadMB,
		WriteThroughput: totalWriteMB,
		AvgLatency:      avgLat,
		PeakLatency:     peakLat,
	}

	// PG status metrics
	pgInfo := h.cephConn.GetPGInfo()
	pgStatus := PGStatusMetrics{
		ActivePgs:       pgInfo.NumPGActive,
		DegradedPgs:     len(pgInfo.DegradedPGs),
		InconsistentPgs: len(pgInfo.InconsistentPGs),
		RecoveringPgs:   len(pgInfo.RecoveringPGs),
		BackfillingPgs:  len(pgInfo.BackfillingPGs),
	}

	// OSD status metrics
	osds := h.cephConn.GetOSDStatus()
	var upCount, inCount, healthyCount, nearFullCount, fullCount int
	for _, osd := range osds {
		if osd.Up {
			upCount++
		}
		if osd.In {
			inCount++
		}
		// Check OSD utilization for near-full and full
		// (You'll need to add this logic based on OSD utilization thresholds)
	}
	healthyCount = upCount // Simplified: all up OSDs are healthy

	osdStatus := OSDStatusMetrics{
		TotalOsds:    len(osds),
		UpOsds:       upCount,
		InOsds:       inCount,
		HealthyOsds:  healthyCount,
		NearFullOsds: nearFullCount,
		FullOsds:     fullCount,
	}

	return KeyMetrics{
		Capacity:    capacity,
		Performance: performance,
		PgStatus:    pgStatus,
		OsdStatus:   osdStatus,
	}
}

func (h *Handler) collectPoolsSummary() []PoolSummary {
	pools := h.cephConn.GetPoolUsage()
	poolStats := h.cephConn.GetPoolStats() // New function to add

	var summaries []PoolSummary
	for _, pool := range pools {
		stats := findPoolStats(poolStats, pool.PoolName)

		summary := PoolSummary{
			PoolName:     pool.PoolName,
			PoolId:       pool.PoolId,
			Size:         pool.Size,
			MinSize:      pool.MinSize,
			PgNum:        pool.PgNum,
			MaxBytes:     pool.MaxBytes,
			UsedBytes:    pool.UsedBytes,
			UsagePercent: pool.UsagePercent,
			ObjectCount:  pool.ObjectCount,
			ReadOps:      stats.ReadOps,
			WriteOps:     stats.WriteOps,
			ReadMBps:     stats.ReadMBps,
			WriteMBps:    stats.WriteMBps,
		}
		summaries = append(summaries, summary)
	}

	return summaries
}

func (h *Handler) collectHostsSummary() []HostSummary {
	hosts := h.cephConn.GetHostList()
	osds := h.cephConn.GetOSDStatus()

	var summaries []HostSummary
	for _, hostname := range hosts {
		// Count OSDs on this host
		hostOsds := filterOSDsByHost(osds, hostname)
		upCount := countUpOSDs(hostOsds)

		// Get system metrics (you'll need to implement this)
		sysMetrics := h.getHostSystemMetrics(hostname)

		summary := HostSummary{
			Hostname:       hostname,
			OsdCount:       len(hostOsds),
			TotalOsds:      len(hostOsds),
			UpOsds:         upCount,
			AvgCpuUsage:    sysMetrics.CpuUsage,
			AvgMemUsage:    sysMetrics.MemUsage,
			NetworkRxMBps:  sysMetrics.NetworkRx,
			NetworkTxMBps:  sysMetrics.NetworkTx,
		}
		summaries = append(summaries, summary)
	}

	return summaries
}
```

#### 3.2.4 main.go에 라우트 등록

```go
// main.go

func main() {
	// ... existing setup code ...

	// Report APIs
	http.HandleFunc("/api/predict/report/overview", handler.ReportOverviewHandler)

	// ... rest of the code ...
}
```

---

### 3.3 API 2: `/api/predict/report/metrics/history`

#### 3.3.1 API 명세

**Endpoint**: `GET /api/predict/report/metrics/history`

**Query Parameters**:
- `startDate` (required): ISO 8601 format (예: `2025-01-19T00:00:00Z`)
- `endDate` (required): ISO 8601 format (예: `2025-01-20T00:00:00Z`)
- `interval` (optional): 데이터 포인트 간격 (기본값: `auto`)
  - `5m`: 5분 간격
  - `1h`: 1시간 간격
  - `1d`: 1일 간격
  - `auto`: 기간에 따라 자동 선택

**Response Structure**:
```json
{
  "success": true,
  "timestamp": "2025-01-20T15:30:00Z",
  "timeRange": {
    "start": "2025-01-19T00:00:00Z",
    "end": "2025-01-20T00:00:00Z",
    "interval": "1h",
    "dataPoints": 24
  },
  "data": {
    "iops": {
      "category": "IOPS",
      "data": [
        {
          "timestamp": "2025-01-19T00:00:00Z",
          "value": 5200.0,
          "label": "T-24"
        },
        {
          "timestamp": "2025-01-19T01:00:00Z",
          "value": 4800.0,
          "label": "T-23"
        }
        // ... more data points
      ],
      "statistics": {
        "min": 3000.0,
        "max": 8500.0,
        "avg": 5200.0,
        "stdDev": 1200.0
      },
      "insights": [
        "Stable IOPS pattern observed",
        "Peak usage occurs at 10:00 AM daily"
      ],
      "prediction": {
        "trend": "stable",
        "projectedValue": 5300.0,
        "confidence": 85.0
      }
    },
    "latency": {
      "category": "Latency",
      "data": [
        {
          "timestamp": "2025-01-19T00:00:00Z",
          "value": 2.3,
          "label": "T-24"
        }
        // ... more data points
      ],
      "statistics": {
        "min": 1.5,
        "max": 8.3,
        "avg": 2.5,
        "p50": 2.3,
        "p95": 5.2,
        "p99": 7.8
      },
      "insights": [
        "Low latency maintained throughout the period",
        "No significant spikes detected"
      ],
      "prediction": {
        "trend": "stable",
        "projectedValue": 2.6,
        "confidence": 90.0
      }
    },
    "throughput": {
      "category": "Throughput",
      "data": [
        {
          "timestamp": "2025-01-19T00:00:00Z",
          "value": 450.0,
          "label": "T-24"
        }
        // ... more data points
      ],
      "statistics": {
        "min": 320.0,
        "max": 580.0,
        "avg": 450.0,
        "readWriteRatio": "60:40"
      },
      "insights": [
        "Consistent throughput levels",
        "Read/Write ratio: 60/40"
      ],
      "prediction": {
        "trend": "increasing",
        "projectedValue": 480.0,
        "confidence": 82.0
      }
    },
    "capacity": {
      "category": "Capacity",
      "data": [
        {
          "timestamp": "2025-01-19T00:00:00Z",
          "value": 65.0,
          "label": "T-24"
        }
        // ... more data points
      ],
      "statistics": {
        "min": 64.2,
        "max": 65.8,
        "avg": 65.0,
        "growthRate": 0.05
      },
      "insights": [
        "Steady capacity growth",
        "Estimated 120 days until 80% threshold"
      ],
      "prediction": {
        "trend": "increasing",
        "projectedValue": 68.0,
        "confidence": 88.0,
        "timeToThreshold": 120
      }
    }
  }
}
```

#### 3.3.2 데이터 수집 방법

이 API는 시계열 메트릭 데이터를 제공합니다. Prometheus 메트릭을 활용하거나 별도의 시계열 저장소가 필요합니다.

**옵션 1: Prometheus Query API 활용**
- Predictor가 Prometheus에 메트릭을 수집하고 있으므로, Prometheus의 Query API를 호출하여 시계열 데이터 가져오기
- `promhttp` 라이브러리 사용

**옵션 2: 메모리 기반 링버퍼**
- 최근 데이터를 메모리에 링버퍼로 저장
- 빠른 응답 가능하지만 재시작 시 데이터 손실

**옵션 3: 간단한 로컬 DB (SQLite 등)**
- 주기적으로 메트릭을 SQLite에 저장
- Prometheus 의존성 없이 데이터 제공 가능

**권장**: 옵션 1 (Prometheus 활용)

#### 3.3.3 Go 코드 구현 가이드

```go
// internal/handlers/report_metrics_history.go

package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
	"github.com/prometheus/client_golang/api"
	promv1 "github.com/prometheus/client_golang/api/prometheus/v1"
	"context"
)

type MetricsHistoryResponse struct {
	Success   bool                 `json:"success"`
	Timestamp string               `json:"timestamp"`
	TimeRange TimeRangeInfo        `json:"timeRange"`
	Data      map[string]TrendData `json:"data"`
}

type TimeRangeInfo struct {
	Start      string `json:"start"`
	End        string `json:"end"`
	Interval   string `json:"interval"`
	DataPoints int    `json:"dataPoints"`
}

type TrendData struct {
	Category   string        `json:"category"`
	Data       []TrendPoint  `json:"data"`
	Statistics Statistics    `json:"statistics"`
	Insights   []string      `json:"insights"`
	Prediction Prediction    `json:"prediction"`
}

type TrendPoint struct {
	Timestamp string  `json:"timestamp"`
	Value     float64 `json:"value"`
	Label     string  `json:"label"`
}

type Statistics struct {
	Min            float64 `json:"min"`
	Max            float64 `json:"max"`
	Avg            float64 `json:"avg"`
	StdDev         float64 `json:"stdDev,omitempty"`
	P50            float64 `json:"p50,omitempty"`
	P95            float64 `json:"p95,omitempty"`
	P99            float64 `json:"p99,omitempty"`
	GrowthRate     float64 `json:"growthRate,omitempty"`
	ReadWriteRatio string  `json:"readWriteRatio,omitempty"`
}

type Prediction struct {
	Trend            string  `json:"trend"`
	ProjectedValue   float64 `json:"projectedValue"`
	Confidence       float64 `json:"confidence"`
	TimeToThreshold  int     `json:"timeToThreshold,omitempty"`
}

func (h *Handler) MetricsHistoryHandler(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	startDateStr := r.URL.Query().Get("startDate")
	endDateStr := r.URL.Query().Get("endDate")
	interval := r.URL.Query().Get("interval")

	if startDateStr == "" || endDateStr == "" {
		http.Error(w, "startDate and endDate are required", http.StatusBadRequest)
		return
	}

	startDate, err := time.Parse(time.RFC3339, startDateStr)
	if err != nil {
		http.Error(w, "Invalid startDate format", http.StatusBadRequest)
		return
	}

	endDate, err := time.Parse(time.RFC3339, endDateStr)
	if err != nil {
		http.Error(w, "Invalid endDate format", http.StatusBadRequest)
		return
	}

	// Auto-select interval if not provided
	if interval == "" || interval == "auto" {
		interval = selectInterval(startDate, endDate)
	}

	// Collect time series data from Prometheus
	iopsData := h.collectIOPSTrend(startDate, endDate, interval)
	latencyData := h.collectLatencyTrend(startDate, endDate, interval)
	throughputData := h.collectThroughputTrend(startDate, endDate, interval)
	capacityData := h.collectCapacityTrend(startDate, endDate, interval)

	// Calculate data points
	dataPoints := len(iopsData.Data)

	// Build response
	response := MetricsHistoryResponse{
		Success:   true,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		TimeRange: TimeRangeInfo{
			Start:      startDateStr,
			End:        endDateStr,
			Interval:   interval,
			DataPoints: dataPoints,
		},
		Data: map[string]TrendData{
			"iops":       iopsData,
			"latency":    latencyData,
			"throughput": throughputData,
			"capacity":   capacityData,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Select appropriate interval based on time range
func selectInterval(start, end time.Time) string {
	duration := end.Sub(start)

	if duration <= 6*time.Hour {
		return "5m"
	} else if duration <= 7*24*time.Hour {
		return "1h"
	} else {
		return "1d"
	}
}

// Collect IOPS trend from Prometheus
func (h *Handler) collectIOPSTrend(start, end time.Time, interval string) TrendData {
	// Query Prometheus for IOPS metrics
	// Example PromQL: sum(rate(ceph_osd_op_r[5m]) + rate(ceph_osd_op_w[5m]))

	ctx := context.Background()
	promClient := h.getPrometheusClient()

	query := `sum(rate(ceph_osd_op_r[5m]) + rate(ceph_osd_op_w[5m]))`

	result, warnings, err := promClient.QueryRange(ctx, query, promv1.Range{
		Start: start,
		End:   end,
		Step:  parseDuration(interval),
	})

	if err != nil {
		// Handle error, return empty data with error logged
		return TrendData{Category: "IOPS", Data: []TrendPoint{}}
	}

	if len(warnings) > 0 {
		// Log warnings
	}

	// Parse Prometheus result into TrendPoint array
	dataPoints := parsePrometheusResult(result, start)

	// Calculate statistics
	stats := calculateStatistics(dataPoints)

	// Generate insights
	insights := generateIOPSInsights(dataPoints, stats)

	// Generate prediction
	prediction := generatePrediction(dataPoints, "stable")

	return TrendData{
		Category:   "IOPS",
		Data:       dataPoints,
		Statistics: stats,
		Insights:   insights,
		Prediction: prediction,
	}
}

// Collect Latency trend from Prometheus
func (h *Handler) collectLatencyTrend(start, end time.Time, interval string) TrendData {
	ctx := context.Background()
	promClient := h.getPrometheusClient()

	// Query average commit latency across all OSDs
	query := `avg(ceph_osd_commit_latency_ms)`

	result, _, err := promClient.QueryRange(ctx, query, promv1.Range{
		Start: start,
		End:   end,
		Step:  parseDuration(interval),
	})

	if err != nil {
		return TrendData{Category: "Latency", Data: []TrendPoint{}}
	}

	dataPoints := parsePrometheusResult(result, start)
	stats := calculateLatencyStatistics(dataPoints)
	insights := generateLatencyInsights(dataPoints, stats)
	prediction := generatePrediction(dataPoints, "stable")

	return TrendData{
		Category:   "Latency",
		Data:       dataPoints,
		Statistics: stats,
		Insights:   insights,
		Prediction: prediction,
	}
}

// Collect Throughput trend from Prometheus
func (h *Handler) collectThroughputTrend(start, end time.Time, interval string) TrendData {
	ctx := context.Background()
	promClient := h.getPrometheusClient()

	// Query read + write throughput in MB/s
	query := `sum(rate(ceph_osd_op_r_out_bytes[5m]) + rate(ceph_osd_op_w_in_bytes[5m])) / 1024 / 1024`

	result, _, err := promClient.QueryRange(ctx, query, promv1.Range{
		Start: start,
		End:   end,
		Step:  parseDuration(interval),
	})

	if err != nil {
		return TrendData{Category: "Throughput", Data: []TrendPoint{}}
	}

	dataPoints := parsePrometheusResult(result, start)
	stats := calculateThroughputStatistics(dataPoints)
	insights := generateThroughputInsights(dataPoints, stats)
	prediction := generatePrediction(dataPoints, "increasing")

	return TrendData{
		Category:   "Throughput",
		Data:       dataPoints,
		Statistics: stats,
		Insights:   insights,
		Prediction: prediction,
	}
}

// Collect Capacity trend from Prometheus
func (h *Handler) collectCapacityTrend(start, end time.Time, interval string) TrendData {
	ctx := context.Background()
	promClient := h.getPrometheusClient()

	// Query capacity utilization percentage
	query := `(sum(ceph_pool_used_bytes) / sum(ceph_pool_max_avail + ceph_pool_used_bytes)) * 100`

	result, _, err := promClient.QueryRange(ctx, query, promv1.Range{
		Start: start,
		End:   end,
		Step:  parseDuration(interval),
	})

	if err != nil {
		return TrendData{Category: "Capacity", Data: []TrendPoint{}}
	}

	dataPoints := parsePrometheusResult(result, start)
	stats := calculateCapacityStatistics(dataPoints)
	insights := generateCapacityInsights(dataPoints, stats)

	// Calculate time to 80% threshold
	timeToThreshold := calculateTimeToThreshold(dataPoints, 80.0)

	prediction := Prediction{
		Trend:           "increasing",
		ProjectedValue:  predictNextValue(dataPoints),
		Confidence:      88.0,
		TimeToThreshold: timeToThreshold,
	}

	return TrendData{
		Category:   "Capacity",
		Data:       dataPoints,
		Statistics: stats,
		Insights:   insights,
		Prediction: prediction,
	}
}

// Helper: Get Prometheus client
func (h *Handler) getPrometheusClient() promv1.API {
	// Prometheus endpoint (configure in config.yml)
	promURL := h.config.PrometheusURL
	if promURL == "" {
		promURL = "http://localhost:9090"
	}

	client, err := api.NewClient(api.Config{
		Address: promURL,
	})

	if err != nil {
		// Handle error
		return nil
	}

	return promv1.NewAPI(client)
}

// Helper: Parse Prometheus result into TrendPoints
func parsePrometheusResult(result promv1.Value, startTime time.Time) []TrendPoint {
	var points []TrendPoint

	// result is typically a Matrix type for range queries
	matrix, ok := result.(promv1.Matrix)
	if !ok {
		return points
	}

	if len(matrix) == 0 {
		return points
	}

	// Use first series (assuming aggregated query)
	series := matrix[0]

	for i, value := range series.Values {
		timestamp := time.Unix(int64(value.Timestamp), 0)

		// Calculate label (T-N hours/days ago)
		hoursAgo := int(startTime.Sub(timestamp).Hours())
		label := fmt.Sprintf("T-%d", len(series.Values)-i)

		point := TrendPoint{
			Timestamp: timestamp.Format(time.RFC3339),
			Value:     float64(value.Value),
			Label:     label,
		}
		points = append(points, point)
	}

	return points
}

// Helper: Calculate basic statistics
func calculateStatistics(points []TrendPoint) Statistics {
	if len(points) == 0 {
		return Statistics{}
	}

	var sum, min, max float64
	min = points[0].Value
	max = points[0].Value

	for _, point := range points {
		sum += point.Value
		if point.Value < min {
			min = point.Value
		}
		if point.Value > max {
			max = point.Value
		}
	}

	avg := sum / float64(len(points))

	// Calculate standard deviation
	var variance float64
	for _, point := range points {
		diff := point.Value - avg
		variance += diff * diff
	}
	variance /= float64(len(points))
	stdDev := math.Sqrt(variance)

	return Statistics{
		Min:    min,
		Max:    max,
		Avg:    avg,
		StdDev: stdDev,
	}
}

// Helper: Calculate latency statistics with percentiles
func calculateLatencyStatistics(points []TrendPoint) Statistics {
	stats := calculateStatistics(points)

	// Extract values and sort for percentiles
	values := make([]float64, len(points))
	for i, point := range points {
		values[i] = point.Value
	}
	sort.Float64s(values)

	// Calculate percentiles
	p50Index := int(float64(len(values)) * 0.50)
	p95Index := int(float64(len(values)) * 0.95)
	p99Index := int(float64(len(values)) * 0.99)

	stats.P50 = values[p50Index]
	stats.P95 = values[p95Index]
	stats.P99 = values[p99Index]

	return stats
}

// Helper: Generate insights based on data
func generateIOPSInsights(points []TrendPoint, stats Statistics) []string {
	insights := []string{}

	// Check stability
	if stats.StdDev < stats.Avg*0.2 {
		insights = append(insights, "Stable IOPS pattern observed")
	} else {
		insights = append(insights, "Significant IOPS variability detected")
	}

	// Check for peak patterns
	// (Implement pattern detection logic)
	insights = append(insights, "Peak usage occurs during business hours")

	return insights
}

// Helper: Generate prediction
func generatePrediction(points []TrendPoint, trendType string) Prediction {
	if len(points) < 2 {
		return Prediction{Trend: "unknown", Confidence: 0}
	}

	// Simple linear regression for prediction
	// (Implement proper time series forecasting)
	lastValue := points[len(points)-1].Value
	projectedValue := lastValue * 1.02 // Simple 2% increase

	return Prediction{
		Trend:          trendType,
		ProjectedValue: projectedValue,
		Confidence:     85.0,
	}
}

// Helper: Calculate time to threshold
func calculateTimeToThreshold(points []TrendPoint, threshold float64) int {
	if len(points) < 2 {
		return -1
	}

	// Calculate growth rate
	firstValue := points[0].Value
	lastValue := points[len(points)-1].Value
	duration := len(points)

	growthPerPeriod := (lastValue - firstValue) / float64(duration)

	if growthPerPeriod <= 0 {
		return -1 // No growth or declining
	}

	// Calculate periods to reach threshold
	periodsToThreshold := (threshold - lastValue) / growthPerPeriod

	// Convert to days (assuming data points are hourly or daily)
	daysToThreshold := int(periodsToThreshold)

	return daysToThreshold
}

// Helper: Parse interval duration
func parseDuration(interval string) time.Duration {
	switch interval {
	case "5m":
		return 5 * time.Minute
	case "1h":
		return 1 * time.Hour
	case "1d":
		return 24 * time.Hour
	default:
		return 1 * time.Hour
	}
}
```

---

### 3.4 API 3: `/api/predict/report/events`

#### 3.4.1 API 명세

**Endpoint**: `GET /api/predict/report/events`

**Query Parameters**:
- `startDate` (required): ISO 8601 format
- `endDate` (required): ISO 8601 format
- `limit` (optional): 최대 이벤트 수 (기본값: 100)

**Response Structure**:
```json
{
  "success": true,
  "timestamp": "2025-01-20T15:30:00Z",
  "timeRange": {
    "start": "2025-01-19T00:00:00Z",
    "end": "2025-01-20T00:00:00Z"
  },
  "data": {
    "eventTimeline": {
      "events": [
        {
          "id": "evt-12345",
          "timestamp": "2025-01-20T13:30:00Z",
          "type": "warning",
          "component": "OSD.3",
          "message": "High utilization detected",
          "details": "Utilization: 85%",
          "resolved": true,
          "resolvedAt": "2025-01-20T14:00:00Z"
        },
        {
          "id": "evt-12344",
          "timestamp": "2025-01-20T07:15:00Z",
          "type": "info",
          "component": "Pool.rbd_pool",
          "message": "Rebalancing completed",
          "details": "PGs rebalanced: 64",
          "resolved": true,
          "resolvedAt": "2025-01-20T07:15:00Z"
        }
      ],
      "totalEvents": 42,
      "criticalEvents": 0,
      "warningEvents": 5,
      "infoEvents": 37
    },
    "alertsSummary": {
      "total": 3,
      "critical": 0,
      "warning": 2,
      "info": 1,
      "recentAlerts": [
        {
          "id": "alert-67890",
          "severity": "warning",
          "title": "OSD Utilization High",
          "message": "OSD.3 utilization is above 80%",
          "component": "OSD.3",
          "timestamp": "2025-01-20T13:30:00Z",
          "acknowledged": false,
          "resolveAction": "Consider rebalancing or adding capacity"
        },
        {
          "id": "alert-67889",
          "severity": "warning",
          "title": "Slow Request Detected",
          "message": "PG 1.a shows slow requests",
          "component": "PG.1.a",
          "timestamp": "2025-01-20T12:00:00Z",
          "acknowledged": true,
          "resolveAction": "Check OSD performance and network"
        }
      ],
      "topAlerts": [
        {
          "id": "alert-67890",
          "severity": "warning",
          "title": "OSD Utilization High",
          "message": "OSD.3 utilization is above 80%",
          "component": "OSD.3",
          "timestamp": "2025-01-20T13:30:00Z",
          "acknowledged": false,
          "resolveAction": "Consider rebalancing or adding capacity"
        }
      ]
    }
  }
}
```

#### 3.4.2 데이터 수집 방법

이벤트 및 알람 데이터는 Ceph의 로그와 health 정보에서 추출합니다:

1. **Events (이벤트)**
   - `ceph log last N` 명령어로 최근 로그 수집
   - Ceph audit 로그 파일 파싱 (`/var/log/ceph/ceph-audit.log`)
   - 이벤트 타입별 분류 (info, warning, error, critical)

2. **Alerts (알람)**
   - `ceph health detail` 명령어로 현재 알람 수집
   - `ceph crash ls` 명령어로 크래시 정보
   - 알람 심각도 매핑 (HEALTH_WARN → warning, HEALTH_ERR → critical)

#### 3.4.3 Go 코드 구현 가이드

```go
// internal/handlers/report_events.go

package handlers

import (
	"encoding/json"
	"net/http"
	"time"
	"strings"
	"strconv"
)

type EventsResponse struct {
	Success   bool               `json:"success"`
	Timestamp string             `json:"timestamp"`
	TimeRange SimpleTimeRange    `json:"timeRange"`
	Data      EventsResponseData `json:"data"`
}

type SimpleTimeRange struct {
	Start string `json:"start"`
	End   string `json:"end"`
}

type EventsResponseData struct {
	EventTimeline EventTimeline  `json:"eventTimeline"`
	AlertsSummary AlertsSummary  `json:"alertsSummary"`
}

type EventTimeline struct {
	Events         []TimelineEvent `json:"events"`
	TotalEvents    int             `json:"totalEvents"`
	CriticalEvents int             `json:"criticalEvents"`
	WarningEvents  int             `json:"warningEvents"`
	InfoEvents     int             `json:"infoEvents"`
}

type TimelineEvent struct {
	ID         string  `json:"id"`
	Timestamp  string  `json:"timestamp"`
	Type       string  `json:"type"`
	Component  string  `json:"component"`
	Message    string  `json:"message"`
	Details    string  `json:"details"`
	Resolved   bool    `json:"resolved"`
	ResolvedAt *string `json:"resolvedAt,omitempty"`
}

type AlertsSummary struct {
	Total        int     `json:"total"`
	Critical     int     `json:"critical"`
	Warning      int     `json:"warning"`
	Info         int     `json:"info"`
	RecentAlerts []Alert `json:"recentAlerts"`
	TopAlerts    []Alert `json:"topAlerts"`
}

type Alert struct {
	ID            string  `json:"id"`
	Severity      string  `json:"severity"`
	Title         string  `json:"title"`
	Message       string  `json:"message"`
	Component     string  `json:"component"`
	Timestamp     string  `json:"timestamp"`
	Acknowledged  bool    `json:"acknowledged"`
	ResolveAction string  `json:"resolveAction"`
}

func (h *Handler) ReportEventsHandler(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	startDateStr := r.URL.Query().Get("startDate")
	endDateStr := r.URL.Query().Get("endDate")
	limitStr := r.URL.Query().Get("limit")

	if startDateStr == "" || endDateStr == "" {
		http.Error(w, "startDate and endDate are required", http.StatusBadRequest)
		return
	}

	startDate, err := time.Parse(time.RFC3339, startDateStr)
	if err != nil {
		http.Error(w, "Invalid startDate format", http.StatusBadRequest)
		return
	}

	endDate, err := time.Parse(time.RFC3339, endDateStr)
	if err != nil {
		http.Error(w, "Invalid endDate format", http.StatusBadRequest)
		return
	}

	limit := 100
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}

	// Collect events
	eventTimeline := h.collectEventTimeline(startDate, endDate, limit)

	// Collect alerts
	alertsSummary := h.collectAlertsSummary()

	// Build response
	response := EventsResponse{
		Success:   true,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		TimeRange: SimpleTimeRange{
			Start: startDateStr,
			End:   endDateStr,
		},
		Data: EventsResponseData{
			EventTimeline: eventTimeline,
			AlertsSummary: alertsSummary,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *Handler) collectEventTimeline(start, end time.Time, limit int) EventTimeline {
	// Collect events from Ceph logs
	events := []TimelineEvent{}

	// Method 1: Use `ceph log last N`
	logEntries := h.cephConn.GetRecentLogs(limit)

	var criticalCount, warningCount, infoCount int

	for _, entry := range logEntries {
		// Parse log entry
		eventTime, err := time.Parse(time.RFC3339, entry.Timestamp)
		if err != nil {
			continue
		}

		// Filter by date range
		if eventTime.Before(start) || eventTime.After(end) {
			continue
		}

		// Determine event type from log level
		eventType := "info"
		if strings.Contains(strings.ToLower(entry.Message), "error") ||
		   strings.Contains(strings.ToLower(entry.Message), "failed") {
			eventType = "error"
			criticalCount++
		} else if strings.Contains(strings.ToLower(entry.Message), "warn") {
			eventType = "warning"
			warningCount++
		} else {
			infoCount++
		}

		// Extract component from message
		component := extractComponent(entry.Message)

		event := TimelineEvent{
			ID:        entry.ID,
			Timestamp: entry.Timestamp,
			Type:      eventType,
			Component: component,
			Message:   entry.Message,
			Details:   entry.Details,
			Resolved:  entry.Resolved,
		}

		if entry.Resolved && entry.ResolvedAt != "" {
			event.ResolvedAt = &entry.ResolvedAt
		}

		events = append(events, event)
	}

	return EventTimeline{
		Events:         events,
		TotalEvents:    len(events),
		CriticalEvents: criticalCount,
		WarningEvents:  warningCount,
		InfoEvents:     infoCount,
	}
}

func (h *Handler) collectAlertsSummary() AlertsSummary {
	// Collect current alerts from Ceph health
	healthDetail := h.cephConn.GetHealthDetail()

	alerts := []Alert{}
	var criticalCount, warningCount, infoCount int

	// Parse health checks
	for _, check := range healthDetail.Checks {
		severity := mapHealthSeverity(check.Severity)

		switch severity {
		case "critical":
			criticalCount++
		case "warning":
			warningCount++
		case "info":
			infoCount++
		}

		alert := Alert{
			ID:            check.ID,
			Severity:      severity,
			Title:         check.Summary.Message,
			Message:       check.Summary.Message,
			Component:     extractComponentFromCheck(check),
			Timestamp:     time.Now().UTC().Format(time.RFC3339),
			Acknowledged:  check.Muted,
			ResolveAction: generateResolveAction(check),
		}

		alerts = append(alerts, alert)
	}

	// Sort alerts by severity (critical first)
	sortAlertsBySeverity(alerts)

	// Top alerts are the first 5 unacknowledged alerts
	topAlerts := []Alert{}
	for _, alert := range alerts {
		if !alert.Acknowledged {
			topAlerts = append(topAlerts, alert)
			if len(topAlerts) >= 5 {
				break
			}
		}
	}

	return AlertsSummary{
		Total:        len(alerts),
		Critical:     criticalCount,
		Warning:      warningCount,
		Info:         infoCount,
		RecentAlerts: alerts,
		TopAlerts:    topAlerts,
	}
}

// Helper: Extract component from log message
func extractComponent(message string) string {
	// Example: "osd.3 heartbeat timeout" → "OSD.3"
	// Example: "pool 'rbd_pool' rebalanced" → "Pool.rbd_pool"

	if strings.Contains(strings.ToLower(message), "osd.") {
		// Extract OSD ID
		parts := strings.Split(message, "osd.")
		if len(parts) > 1 {
			osdID := strings.Split(parts[1], " ")[0]
			return "OSD." + osdID
		}
	}

	if strings.Contains(strings.ToLower(message), "pool") {
		// Extract pool name
		if strings.Contains(message, "'") {
			parts := strings.Split(message, "'")
			if len(parts) >= 2 {
				return "Pool." + parts[1]
			}
		}
	}

	if strings.Contains(strings.ToLower(message), "pg ") {
		// Extract PG ID
		parts := strings.Split(message, "pg ")
		if len(parts) > 1 {
			pgID := strings.Split(parts[1], " ")[0]
			return "PG." + pgID
		}
	}

	return "Cluster"
}

// Helper: Map Ceph health severity to alert severity
func mapHealthSeverity(cephSeverity string) string {
	switch strings.ToUpper(cephSeverity) {
	case "HEALTH_ERR":
		return "critical"
	case "HEALTH_WARN":
		return "warning"
	default:
		return "info"
	}
}

// Helper: Extract component from health check
func extractComponentFromCheck(check HealthCheck) string {
	// Parse check type and details to determine component
	checkType := strings.ToUpper(check.Type)

	if strings.Contains(checkType, "OSD") {
		return "OSD"
	} else if strings.Contains(checkType, "PG") {
		return "PG"
	} else if strings.Contains(checkType, "MON") {
		return "MON"
	} else if strings.Contains(checkType, "POOL") {
		return "Pool"
	}

	return "Cluster"
}

// Helper: Generate resolve action based on check type
func generateResolveAction(check HealthCheck) string {
	checkType := strings.ToUpper(check.Type)

	actions := map[string]string{
		"OSD_FULL":                "Add storage capacity or remove old data",
		"OSD_NEARFULL":            "Monitor capacity and plan for expansion",
		"TOO_FEW_OSDS":            "Add more OSDs to the cluster",
		"PG_DEGRADED":             "Wait for recovery to complete or check OSD health",
		"PG_UNDERSIZED":           "Check replication settings and OSD availability",
		"SLOW_OPS":                "Check OSD performance and network latency",
		"REQUEST_SLOW":            "Investigate OSD performance issues",
		"MON_DOWN":                "Restart monitor daemon or check network",
		"POOL_NEAR_FULL":          "Increase pool quota or remove old data",
		"LARGE_OMAP_OBJECTS":      "Run compaction on affected OSDs",
		"TOO_MANY_PGS":            "Reduce PG count using pg autoscaler",
		"TOO_FEW_PGS":             "Increase PG count using pg autoscaler",
		"CACHE_POOL_NEAR_FULL":    "Clear cache pool or adjust cache settings",
		"OBJECT_MISPLACED":        "Wait for rebalancing to complete",
		"OBJECT_UNFOUND":          "Check for missing OSDs or data",
		"BLUEFS_SPILLOVER":        "Add more block.db space to affected OSDs",
		"TELEMETRY_CHANGED":       "Review and accept telemetry changes",
	}

	if action, exists := actions[checkType]; exists {
		return action
	}

	return "Review Ceph documentation for " + check.Type
}

// Helper: Sort alerts by severity
func sortAlertsBySeverity(alerts []Alert) {
	sort.Slice(alerts, func(i, j int) bool {
		severityOrder := map[string]int{
			"critical": 0,
			"warning":  1,
			"info":     2,
		}
		return severityOrder[alerts[i].Severity] < severityOrder[alerts[j].Severity]
	})
}
```

#### 3.4.4 connection.go에 추가할 함수들

```go
// internal/ceph/connection.go

// GetRecentLogs retrieves recent Ceph audit logs
func (c *CephConnection) GetRecentLogs(limit int) []LogEntry {
	// Use ceph CLI: ceph log last N
	cmd := exec.Command("ceph", "log", "last", strconv.Itoa(limit), "-f", "json")
	output, err := cmd.Output()
	if err != nil {
		log.Printf("Failed to get logs: %v", err)
		return []LogEntry{}
	}

	var logEntries []LogEntry
	err = json.Unmarshal(output, &logEntries)
	if err != nil {
		log.Printf("Failed to parse logs: %v", err)
		return []LogEntry{}
	}

	return logEntries
}

// GetHealthDetail retrieves detailed health information
func (c *CephConnection) GetHealthDetail() HealthDetail {
	cmd := exec.Command("ceph", "health", "detail", "-f", "json")
	output, err := cmd.Output()
	if err != nil {
		log.Printf("Failed to get health detail: %v", err)
		return HealthDetail{}
	}

	var healthDetail HealthDetail
	err = json.Unmarshal(output, &healthDetail)
	if err != nil {
		log.Printf("Failed to parse health detail: %v", err)
		return HealthDetail{}
	}

	return healthDetail
}

// Data structures
type LogEntry struct {
	ID         string `json:"id"`
	Timestamp  string `json:"stamp"`
	Name       string `json:"name"`
	Channel    string `json:"channel"`
	Priority   string `json:"prio"`
	Message    string `json:"message"`
	Details    string `json:"details"`
	Resolved   bool   `json:"resolved"`
	ResolvedAt string `json:"resolved_stamp"`
}

type HealthDetail struct {
	Status string        `json:"status"`
	Checks map[string]HealthCheck `json:"checks"`
}

type HealthCheck struct {
	Severity string                `json:"severity"`
	Type     string                `json:"type"`
	Summary  HealthCheckSummary    `json:"summary"`
	Detail   []string              `json:"detail"`
	Muted    bool                  `json:"muted"`
}

type HealthCheckSummary struct {
	Message string `json:"message"`
	Count   int    `json:"count"`
}
```

---

## 4. 백엔드 통합 가이드

### 4.1 anomaly-predictor-api에서 API 호출 방법

백엔드 ReportService에서 predictor API를 호출하여 mock 데이터를 실제 데이터로 교체합니다.

#### 4.1.1 새로운 서비스 클래스 생성

```java
// com.okestro.anomaly.predictor.services.report.integration.PredictorApiClient.java

package com.okestro.anomaly.predictor.services.report.integration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
@RequiredArgsConstructor
public class PredictorApiClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${predictor.api.url}")
    private String predictorApiUrl;

    /**
     * Get cluster overview data
     */
    public ReportOverviewResponse getClusterOverview() {
        WebClient webClient = webClientBuilder
            .baseUrl(predictorApiUrl)
            .build();

        Mono<ReportOverviewResponse> responseMono = webClient.get()
            .uri("/api/predict/report/overview")
            .retrieve()
            .bodyToMono(ReportOverviewResponse.class);

        return responseMono.block();
    }

    /**
     * Get metrics history
     */
    public MetricsHistoryResponse getMetricsHistory(
            LocalDateTime startDate,
            LocalDateTime endDate,
            String interval) {

        WebClient webClient = webClientBuilder
            .baseUrl(predictorApiUrl)
            .build();

        DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;

        Mono<MetricsHistoryResponse> responseMono = webClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/api/predict/report/metrics/history")
                .queryParam("startDate", startDate.format(formatter))
                .queryParam("endDate", endDate.format(formatter))
                .queryParam("interval", interval)
                .build())
            .retrieve()
            .bodyToMono(MetricsHistoryResponse.class);

        return responseMono.block();
    }

    /**
     * Get events and alerts
     */
    public EventsResponse getEvents(
            LocalDateTime startDate,
            LocalDateTime endDate,
            int limit) {

        WebClient webClient = webClientBuilder
            .baseUrl(predictorApiUrl)
            .build();

        DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;

        Mono<EventsResponse> responseMono = webClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/api/predict/report/events")
                .queryParam("startDate", startDate.format(formatter))
                .queryParam("endDate", endDate.format(formatter))
                .queryParam("limit", limit)
                .build())
            .retrieve()
            .bodyToMono(EventsResponse.class);

        return responseMono.block();
    }
}
```

#### 4.1.2 DTO 클래스 생성

```java
// com.okestro.anomaly.predictor.services.report.integration.dto package

// Response DTOs matching Go API responses
@Data
public class ReportOverviewResponse {
    private boolean success;
    private String timestamp;
    private ReportOverviewData data;
}

@Data
public class ReportOverviewData {
    private ClusterMetadata metadata;
    private ClusterHealthSummary clusterHealth;
    private KeyMetrics keyMetrics;
    private List<PoolSummary> poolsSummary;
    private List<HostSummary> hostsSummary;
}

// ... (Add all other DTO classes matching the API response structures)
```

#### 4.1.3 ReportService 수정

```java
// ReportService.java - 수정

private ReportResponse.ReportData generateReportData(GenerateReportRequest request) {
    // Use real data from predictor API
    ReportOverviewResponse overview = predictorApiClient.getClusterOverview();
    MetricsHistoryResponse metricsHistory = predictorApiClient.getMetricsHistory(
        request.getStartDate(),
        request.getEndDate(),
        "auto"
    );
    EventsResponse events = predictorApiClient.getEvents(
        request.getStartDate(),
        request.getEndDate(),
        100
    );

    return ReportResponse.ReportData.builder()
        .clusterHealth(mapToClusterHealth(overview.getData().getClusterHealth()))
        .keyMetrics(mapToKeyMetrics(overview.getData().getKeyMetrics()))
        .trends(mapToTrends(metricsHistory.getData()))
        .events(mapToEventTimeline(events.getData().getEventTimeline()))
        .alerts(mapToAlertsSummary(events.getData().getAlertsSummary()))
        .build();
}

// Mapping functions
private ReportResponse.ClusterHealthSummary mapToClusterHealth(
        ClusterHealthSummary source) {
    return ReportResponse.ClusterHealthSummary.builder()
        .health(source.getHealth())
        .uptime(source.getUptime())
        .availability(source.getAvailability())
        .activeAlarms(source.getActiveAlarms())
        .healthTrend(source.getHealthTrend())
        .aiInsight("Cluster is operating within normal parameters")
        .build();
}

// ... (Add other mapping functions)
```

### 4.2 설정 파일

#### 4.2.1 application.yml (백엔드)

```yaml
predictor:
  api:
    url: http://goceph.hotk.co.kr
    timeout: 60000
```

#### 4.2.2 config.yml (predictor)

```yaml
# Prometheus configuration
prometheus:
  url: http://localhost:9090

# Cluster information
cluster:
  name: ceph-cluster-prod
```

---

## 5. 테스트 가이드

### 5.1 API 테스트 (curl)

```bash
# 1. Test overview API
curl -X GET "http://goceph.hotk.co.kr/api/predict/report/overview"

# 2. Test metrics history API
curl -X GET "http://goceph.hotk.co.kr/api/predict/report/metrics/history?startDate=2025-01-19T00:00:00Z&endDate=2025-01-20T00:00:00Z&interval=1h"

# 3. Test events API
curl -X GET "http://goceph.hotk.co.kr/api/predict/report/events?startDate=2025-01-19T00:00:00Z&endDate=2025-01-20T00:00:00Z&limit=100"
```

### 5.2 통합 테스트

1. **predictor 프로젝트**
   - 각 API가 정상적으로 동작하는지 확인
   - Prometheus 연동 확인
   - 응답 시간 측정 (목표: < 5초)

2. **anomaly-predictor-api 프로젝트**
   - ReportService에서 predictor API 호출 확인
   - 매핑 함수가 올바르게 동작하는지 확인
   - 리포트 생성 성공 확인

3. **프론트엔드**
   - 리포트 페이지에서 실제 데이터 표시 확인
   - 차트가 정상적으로 렌더링되는지 확인

---

## 6. 성능 최적화

### 6.1 캐싱 전략

```go
// Add caching for frequently accessed data

import (
	"github.com/patrickmn/go-cache"
	"time"
)

var (
	overviewCache *cache.Cache
)

func init() {
	// Create cache with 5 minute expiration
	overviewCache = cache.New(5*time.Minute, 10*time.Minute)
}

func (h *Handler) ReportOverviewHandler(w http.ResponseWriter, r *http.Request) {
	// Check cache first
	if cached, found := overviewCache.Get("overview"); found {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Cache", "HIT")
		json.NewEncoder(w).Encode(cached)
		return
	}

	// Generate fresh data
	response := h.generateOverviewResponse()

	// Store in cache
	overviewCache.Set("overview", response, cache.DefaultExpiration)

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Cache", "MISS")
	json.NewEncoder(w).Encode(response)
}
```

### 6.2 병렬 데이터 수집

```go
// Collect data in parallel using goroutines

func (h *Handler) ReportOverviewHandler(w http.ResponseWriter, r *http.Request) {
	var wg sync.WaitGroup

	var metadata ClusterMetadata
	var clusterHealth ClusterHealthSummary
	var keyMetrics KeyMetrics
	var poolsSummary []PoolSummary
	var hostsSummary []HostSummary

	// Collect metadata
	wg.Add(1)
	go func() {
		defer wg.Done()
		metadata = h.collectClusterMetadata()
	}()

	// Collect cluster health
	wg.Add(1)
	go func() {
		defer wg.Done()
		clusterHealth = h.collectClusterHealth()
	}()

	// Collect key metrics
	wg.Add(1)
	go func() {
		defer wg.Done()
		keyMetrics = h.collectKeyMetrics()
	}()

	// Collect pools summary
	wg.Add(1)
	go func() {
		defer wg.Done()
		poolsSummary = h.collectPoolsSummary()
	}()

	// Collect hosts summary
	wg.Add(1)
	go func() {
		defer wg.Done()
		hostsSummary = h.collectHostsSummary()
	}()

	// Wait for all goroutines
	wg.Wait()

	// Build response
	response := ReportOverviewResponse{
		Success:   true,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Data: ReportOverviewData{
			Metadata:      metadata,
			ClusterHealth: clusterHealth,
			KeyMetrics:    keyMetrics,
			PoolsSummary:  poolsSummary,
			HostsSummary:  hostsSummary,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
```

---

## 7. 에러 처리

### 7.1 공통 에러 응답

```go
type ErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
	Message string `json:"message"`
}

func writeErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	w.WriteHeader(statusCode)
	w.Header().Set("Content-Type", "application/json")

	response := ErrorResponse{
		Success: false,
		Error:   http.StatusText(statusCode),
		Message: message,
	}

	json.NewEncoder(w).Encode(response)
}
```

### 7.2 타임아웃 처리

```go
func (h *Handler) ReportOverviewHandler(w http.ResponseWriter, r *http.Request) {
	// Create timeout context
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	// Channel for result
	resultChan := make(chan ReportOverviewResponse)
	errorChan := make(chan error)

	go func() {
		// Collect data
		response := h.generateOverviewResponse()
		resultChan <- response
	}()

	select {
	case response := <-resultChan:
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	case err := <-errorChan:
		writeErrorResponse(w, http.StatusInternalServerError, err.Error())
	case <-ctx.Done():
		writeErrorResponse(w, http.StatusRequestTimeout, "Request timeout")
	}
}
```

---

## 8. 배포 체크리스트

### 8.1 predictor 프로젝트

- [ ] 3개의 새로운 API 핸들러 구현 완료
- [ ] connection.go에 필요한 함수들 추가
- [ ] Prometheus 연동 설정
- [ ] 캐싱 구현
- [ ] 에러 처리 추가
- [ ] 로깅 추가
- [ ] 단위 테스트 작성
- [ ] Docker 이미지 빌드 및 배포

### 8.2 anomaly-predictor-api 프로젝트

- [ ] PredictorApiClient 구현
- [ ] DTO 클래스 생성
- [ ] ReportService 수정 (mock → real data)
- [ ] 매핑 함수 구현
- [ ] application.yml 설정
- [ ] 통합 테스트 작성
- [ ] 에러 처리 개선

### 8.3 프론트엔드

- [ ] 실제 데이터로 차트 렌더링 확인
- [ ] 에러 상태 UI 추가
- [ ] 로딩 상태 개선

---

## 9. 참고 자료

### 9.1 Ceph CLI 명령어

```bash
# Cluster status
ceph status
ceph health detail

# OSD information
ceph osd status
ceph osd df
ceph osd perf

# Pool information
ceph osd pool ls detail
ceph osd pool stats

# PG information
ceph pg dump
ceph pg ls

# Logs
ceph log last 100

# Prometheus metrics
curl http://localhost:9283/metrics
```

### 9.2 Prometheus 쿼리 예시

```promql
# Total IOPS
sum(rate(ceph_osd_op_r[5m]) + rate(ceph_osd_op_w[5m]))

# Average latency
avg(ceph_osd_commit_latency_ms)

# Total throughput (MB/s)
sum(rate(ceph_osd_op_r_out_bytes[5m]) + rate(ceph_osd_op_w_in_bytes[5m])) / 1024 / 1024

# Capacity utilization (%)
(sum(ceph_pool_used_bytes) / sum(ceph_pool_max_avail + ceph_pool_used_bytes)) * 100
```

---

## 10. 문의 및 지원

- **Predictor 프로젝트**: `/Users/jclee/Documents/Okestro/Projects/DevSw/anomaly-predictor`
- **API 프로젝트**: `/Users/jclee/Documents/Okestro/Projects/DevSw/anomaly-predictor-api`
- **프론트엔드 프로젝트**: `/Users/jclee/Documents/Okestro/Projects/DevSw/anomaly-predictor-next`

---

**문서 버전**: 1.0
**작성일**: 2025-01-20
**최종 수정일**: 2025-01-20
