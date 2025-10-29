# Predictor 리포트 API 업그레이드 가이드 #1

## 1. 개요

### 1.1 현재 상황
`/api/predict/report/overview` API가 구현되어 있으나, 백엔드 ReportService에서 필요로 하는 일부 데이터가 누락되어 있습니다.

**현재 API 응답 구조:**
- ✅ metadata (완벽)
- ✅ clusterHealth (완벽)
- ✅ keyMetrics - 현재 시점 메트릭 (완벽)
- ✅ poolsSummary (보너스)
- ✅ hostsSummary (보너스)
- ❌ **trends** - 시계열 트렌드 데이터 (누락)
- ❌ **events** - 이벤트 타임라인 (누락)
- ⚠️ **alerts** - 알림 상세 정보 (불충분)

### 1.2 목표
백엔드에서 리포트 생성에 필요한 모든 데이터를 제공하도록 API 응답을 확장합니다.

---

## 2. 누락된 데이터 분석

### 2.1 Trends (시계열 트렌드 데이터)

**백엔드 필요 구조:**
```java
trends: List<TrendData> {
  category: String      // "IOPS", "Latency", "Throughput", "Capacity"
  data: List<TrendPoint> {
    timestamp: LocalDateTime
    value: Double
    label: String       // "T-24", "14:00" 등
  }
  insights: List<String>
  prediction: PredictionData {
    trend: String       // "stable", "increasing", "decreasing"
    projectedValue: Double
    confidence: Double
    timeToThreshold: Integer  // days (optional)
  }
}
```

**현재 API:** 현재 시점의 단일 값만 제공
- `readOps: 5000`
- `writeOps: 3000`
- `avgLatency: 2.5`

**필요한 것:** 최근 24시간의 시계열 데이터 배열

**데이터 소스:**
- Prometheus의 시계열 메트릭 쿼리
- 범위 쿼리 (range query) 사용
- 시간 간격: 1시간 (24개 데이터 포인트)

---

### 2.2 Events (이벤트 타임라인)

**백엔드 필요 구조:**
```java
events: EventTimeline {
  events: List<TimelineEvent> {
    id: String
    timestamp: LocalDateTime
    type: String        // "info", "warning", "error"
    component: String   // "OSD.3", "Pool.rbd_pool", "Monitor.a"
    message: String
    details: String
    resolved: Boolean
  }
}
```

**현재 API:** 없음

**필요한 것:**
- Ceph 클러스터에서 발생한 최근 이벤트 (OSD down/up, rebalancing, recovery, scrub errors 등)
- 최근 24시간 ~ 7일 데이터

**데이터 소스:**
- Ceph health detail (`ceph health detail`)
- Ceph log 분석
- Prometheus alert history
- OSD 상태 변화 이력
- PG 상태 변화 이력

---

### 2.3 Alerts (알림 상세 정보)

**백엔드 필요 구조:**
```java
alerts: AlertsSummary {
  total: Integer
  critical: Integer
  warning: Integer
  info: Integer
  recentAlerts: List<Alert> {
    id: String
    severity: String    // "critical", "warning", "info"
    title: String
    message: String
    component: String
    timestamp: LocalDateTime
    acknowledged: Boolean
    resolveAction: String
  }
  topAlerts: List<Alert>  // 중요도 높은 순
}
```

**현재 API:**
```json
"clusterHealth": {
  "activeAlarms": 2
}
```

**필요한 것:**
- 알림의 상세 정보 (severity, title, message, component 등)
- 알림 분류 (critical, warning, info)
- 해결 방법 제안

**데이터 소스:**
- Ceph health warnings/errors
- Prometheus alerts
- OSD near-full/full 상태
- PG degraded/inconsistent 상태

---

## 3. 확장된 API 응답 구조

### 3.1 기존 구조 유지 + 추가

```json
{
  "success": true,
  "timestamp": "2025-01-20T15:30:00Z",
  "data": {
    // ========== 기존 데이터 (유지) ==========
    "metadata": { ... },
    "clusterHealth": { ... },
    "keyMetrics": { ... },
    "poolsSummary": [ ... ],
    "hostsSummary": [ ... ],

    // ========== 추가 데이터 ==========
    "trends": [
      {
        "category": "IOPS",
        "data": [
          {
            "timestamp": "2025-01-20T00:00:00Z",
            "value": 4800,
            "label": "00:00"
          },
          {
            "timestamp": "2025-01-20T01:00:00Z",
            "value": 4500,
            "label": "01:00"
          }
          // ... 24 data points
        ],
        "insights": [
          "Stable IOPS pattern over 24 hours",
          "Peak usage during business hours (09:00-17:00)"
        ],
        "prediction": {
          "trend": "stable",
          "projectedValue": 5200.0,
          "confidence": 85.0
        }
      },
      {
        "category": "Latency",
        "data": [ ... ],
        "insights": [ ... ],
        "prediction": { ... }
      },
      {
        "category": "Throughput",
        "data": [ ... ],
        "insights": [ ... ],
        "prediction": { ... }
      },
      {
        "category": "Capacity",
        "data": [ ... ],
        "insights": [ ... ],
        "prediction": {
          "trend": "increasing",
          "projectedValue": 68.0,
          "confidence": 88.0,
          "timeToThreshold": 120  // days until 80% threshold
        }
      }
    ],

    "events": [
      {
        "id": "evt-20250120-001",
        "timestamp": "2025-01-20T13:00:00Z",
        "type": "warning",
        "component": "OSD.3",
        "message": "High utilization detected",
        "details": "Utilization: 85%, threshold: 80%",
        "resolved": true
      },
      {
        "id": "evt-20250120-002",
        "timestamp": "2025-01-20T10:30:00Z",
        "type": "info",
        "component": "Pool.rbd_pool",
        "message": "Rebalancing completed",
        "details": "Moved 150 PGs, duration: 45 minutes",
        "resolved": true
      },
      {
        "id": "evt-20250120-003",
        "timestamp": "2025-01-20T08:15:00Z",
        "type": "error",
        "component": "OSD.7",
        "message": "OSD marked down",
        "details": "Heartbeat timeout, network issue suspected",
        "resolved": false
      }
    ],

    "alerts": {
      "total": 3,
      "critical": 1,
      "warning": 1,
      "info": 1,
      "recentAlerts": [
        {
          "id": "alert-001",
          "severity": "critical",
          "title": "OSD Down",
          "message": "OSD.7 is down and needs immediate attention",
          "component": "OSD.7",
          "timestamp": "2025-01-20T08:15:00Z",
          "acknowledged": false,
          "resolveAction": "Check network connectivity and OSD daemon status. Restart OSD if necessary."
        },
        {
          "id": "alert-002",
          "severity": "warning",
          "title": "OSD Utilization High",
          "message": "OSD.3 utilization is above 80%",
          "component": "OSD.3",
          "timestamp": "2025-01-20T13:00:00Z",
          "acknowledged": false,
          "resolveAction": "Consider rebalancing data or adding capacity to prevent OSD from becoming full."
        },
        {
          "id": "alert-003",
          "severity": "info",
          "title": "Rebalancing Complete",
          "message": "Pool rebalancing finished successfully",
          "component": "Pool.rbd_pool",
          "timestamp": "2025-01-20T10:30:00Z",
          "acknowledged": true,
          "resolveAction": "No action required"
        }
      ],
      "topAlerts": [
        {
          "id": "alert-001",
          "severity": "critical",
          ...
        }
      ]
    }
  }
}
```

---

## 4. 데이터 수집 방법

### 4.1 Trends - Prometheus 시계열 쿼리

#### 4.1.1 IOPS Trend
```go
// Read IOPS - 최근 24시간, 1시간 간격
query := `sum(rate(ceph_pool_rd_ops[5m]))`
start := time.Now().Add(-24 * time.Hour)
end := time.Now()
step := time.Hour

// Prometheus range query
result, err := prometheusClient.QueryRange(ctx, query, start, end, step)

// Write IOPS
queryWrite := `sum(rate(ceph_pool_wr_ops[5m]))`
```

#### 4.1.2 Latency Trend
```go
// Average commit latency
query := `avg(ceph_osd_commit_latency_ms)`
```

#### 4.1.3 Throughput Trend
```go
// Read throughput (MB/s)
queryRead := `sum(rate(ceph_pool_rd_bytes[5m])) / 1024 / 1024`

// Write throughput (MB/s)
queryWrite := `sum(rate(ceph_pool_wr_bytes[5m])) / 1024 / 1024`
```

#### 4.1.4 Capacity Trend
```go
// Capacity utilization (%)
query := `(ceph_cluster_total_used_bytes / ceph_cluster_total_bytes) * 100`
```

#### 4.1.5 Insights 생성 로직
```go
func generateInsights(trendData []TrendPoint, category string) []string {
    insights := []string{}

    // Calculate statistics
    avg := calculateAverage(trendData)
    stdDev := calculateStdDev(trendData)
    trend := detectTrend(trendData)  // "stable", "increasing", "decreasing"

    // Generate insights based on category
    switch category {
    case "IOPS":
        if stdDev/avg < 0.1 {
            insights = append(insights, "Stable IOPS pattern over 24 hours")
        }
        peak := findPeakHours(trendData)
        if len(peak) > 0 {
            insights = append(insights, fmt.Sprintf("Peak usage during %s", formatHours(peak)))
        }

    case "Latency":
        if avg < 5.0 {
            insights = append(insights, "Low latency maintained")
        }
        if !hasSpikes(trendData) {
            insights = append(insights, "No significant spikes detected")
        }

    case "Throughput":
        insights = append(insights, "Consistent throughput levels")
        ratio := calculateReadWriteRatio(trendData)
        insights = append(insights, fmt.Sprintf("Read/Write ratio: %d/%d", ratio.read, ratio.write))

    case "Capacity":
        if trend == "increasing" {
            daysToThreshold := estimateDaysToThreshold(trendData, 80.0)
            insights = append(insights, fmt.Sprintf("Estimated %d days until 80%% threshold", daysToThreshold))
        }
        insights = append(insights, "Steady capacity growth")
    }

    return insights
}
```

#### 4.1.6 Prediction 생성 로직
```go
func generatePrediction(trendData []TrendPoint, category string) PredictionData {
    // Simple linear regression for trend prediction
    slope, intercept := linearRegression(trendData)

    // Predict value 24 hours ahead
    projectedValue := slope*24 + intercept

    // Determine trend direction
    var trend string
    if abs(slope) < threshold {
        trend = "stable"
    } else if slope > 0 {
        trend = "increasing"
    } else {
        trend = "decreasing"
    }

    // Calculate confidence based on R-squared
    confidence := calculateRSquared(trendData, slope, intercept)

    prediction := PredictionData{
        Trend:          trend,
        ProjectedValue: projectedValue,
        Confidence:     confidence * 100,
    }

    // For capacity, calculate time to threshold
    if category == "Capacity" && trend == "increasing" {
        daysToThreshold := calculateTimeToThreshold(trendData, slope, 80.0)
        prediction.TimeToThreshold = daysToThreshold
    }

    return prediction
}
```

---

### 4.2 Events - Ceph 이벤트 수집

#### 4.2.1 데이터 소스
1. **Ceph Health Detail**
   ```bash
   ceph health detail --format json
   ```

2. **Ceph Log (최근 이벤트)**
   ```bash
   ceph log last 100 --format json
   ```

3. **OSD 상태 변화**
   - Monitor OSD up/down events
   - Track via Prometheus or Ceph API

4. **PG 상태 변화**
   - degraded, inconsistent, recovering 상태 추적

#### 4.2.2 Go 코드 구현
```go
type TimelineEvent struct {
    ID        string    `json:"id"`
    Timestamp time.Time `json:"timestamp"`
    Type      string    `json:"type"`      // "info", "warning", "error"
    Component string    `json:"component"` // "OSD.3", "Pool.rbd_pool"
    Message   string    `json:"message"`
    Details   string    `json:"details"`
    Resolved  bool      `json:"resolved"`
}

func collectEvents(conn *rados.Conn) ([]TimelineEvent, error) {
    events := []TimelineEvent{}

    // 1. Get recent health changes
    healthEvents, err := getHealthEvents(conn)
    if err != nil {
        log.Warn("Failed to get health events:", err)
    } else {
        events = append(events, healthEvents...)
    }

    // 2. Get OSD state changes
    osdEvents, err := getOSDStateChanges(conn)
    if err != nil {
        log.Warn("Failed to get OSD events:", err)
    } else {
        events = append(events, osdEvents...)
    }

    // 3. Get PG state changes
    pgEvents, err := getPGStateChanges(conn)
    if err != nil {
        log.Warn("Failed to get PG events:", err)
    } else {
        events = append(events, pgEvents...)
    }

    // 4. Get pool operations
    poolEvents, err := getPoolEvents(conn)
    if err != nil {
        log.Warn("Failed to get pool events:", err)
    } else {
        events = append(events, poolEvents...)
    }

    // Sort by timestamp (most recent first)
    sort.Slice(events, func(i, j int) bool {
        return events[i].Timestamp.After(events[j].Timestamp)
    })

    // Limit to last 50 events
    if len(events) > 50 {
        events = events[:50]
    }

    return events, nil
}

func getHealthEvents(conn *rados.Conn) ([]TimelineEvent, error) {
    // Execute: ceph health detail --format json
    cmd, err := json.Marshal(map[string]interface{}{
        "prefix": "health",
        "detail": "detail",
        "format": "json",
    })

    buf, _, err := conn.MonCommand(cmd)
    if err != nil {
        return nil, err
    }

    // Parse health output and convert to events
    var health map[string]interface{}
    json.Unmarshal(buf, &health)

    events := []TimelineEvent{}

    // Check for active health warnings/errors
    if checks, ok := health["checks"].(map[string]interface{}); ok {
        for checkName, checkData := range checks {
            check := checkData.(map[string]interface{})
            severity := check["severity"].(string)

            event := TimelineEvent{
                ID:        fmt.Sprintf("health-%s-%d", checkName, time.Now().Unix()),
                Timestamp: time.Now(),
                Type:      mapSeverityToType(severity),
                Component: "Cluster",
                Message:   check["summary"].(map[string]interface{})["message"].(string),
                Details:   fmt.Sprintf("Check: %s", checkName),
                Resolved:  false,
            }
            events = append(events, event)
        }
    }

    return events, nil
}

func getOSDStateChanges(conn *rados.Conn) ([]TimelineEvent, error) {
    events := []TimelineEvent{}

    // Get OSD tree to check current state
    cmd, _ := json.Marshal(map[string]interface{}{
        "prefix": "osd tree",
        "format": "json",
    })

    buf, _, err := conn.MonCommand(cmd)
    if err != nil {
        return nil, err
    }

    // Parse and look for down OSDs
    var osdTree map[string]interface{}
    json.Unmarshal(buf, &osdTree)

    if nodes, ok := osdTree["nodes"].([]interface{}); ok {
        for _, node := range nodes {
            n := node.(map[string]interface{})
            if n["type"].(string) == "osd" {
                osdID := int(n["id"].(float64))
                status := n["status"].(string)

                if status == "down" {
                    event := TimelineEvent{
                        ID:        fmt.Sprintf("osd-down-%d-%d", osdID, time.Now().Unix()),
                        Timestamp: time.Now(), // TODO: Get actual timestamp from logs
                        Type:      "error",
                        Component: fmt.Sprintf("OSD.%d", osdID),
                        Message:   "OSD marked down",
                        Details:   "Heartbeat timeout, network issue suspected",
                        Resolved:  false,
                    }
                    events = append(events, event)
                }
            }
        }
    }

    return events, nil
}

func getPGStateChanges(conn *rados.Conn) ([]TimelineEvent, error) {
    events := []TimelineEvent{}

    // Get PG status
    cmd, _ := json.Marshal(map[string]interface{}{
        "prefix": "pg stat",
        "format": "json",
    })

    buf, _, err := conn.MonCommand(cmd)
    if err != nil {
        return nil, err
    }

    var pgStat map[string]interface{}
    json.Unmarshal(buf, &pgStat)

    // Check for degraded, inconsistent, recovering PGs
    if stats, ok := pgStat["pg_stats"].([]interface{}); ok {
        for _, stat := range stats {
            s := stat.(map[string]interface{})
            state := s["state"].(string)
            pgid := s["pgid"].(string)

            if strings.Contains(state, "degraded") ||
               strings.Contains(state, "inconsistent") ||
               strings.Contains(state, "recovering") {

                eventType := "warning"
                if strings.Contains(state, "inconsistent") {
                    eventType = "error"
                }

                event := TimelineEvent{
                    ID:        fmt.Sprintf("pg-%s-%d", pgid, time.Now().Unix()),
                    Timestamp: time.Now(),
                    Type:      eventType,
                    Component: fmt.Sprintf("PG.%s", pgid),
                    Message:   fmt.Sprintf("PG in %s state", state),
                    Details:   fmt.Sprintf("Acting set: %v", s["acting"]),
                    Resolved:  strings.Contains(state, "recovering"),
                }
                events = append(events, event)
            }
        }
    }

    return events, nil
}

func getPoolEvents(conn *rados.Conn) ([]TimelineEvent, error) {
    // Check for recent pool rebalancing operations
    // This would typically come from monitoring PG movements
    events := []TimelineEvent{}

    // Example: Rebalancing completed event
    // In real implementation, this would be tracked over time

    return events, nil
}

func mapSeverityToType(severity string) string {
    switch severity {
    case "HEALTH_ERR":
        return "error"
    case "HEALTH_WARN":
        return "warning"
    default:
        return "info"
    }
}
```

---

### 4.3 Alerts - 알림 상세 정보

#### 4.3.1 데이터 구조
```go
type AlertsSummary struct {
    Total        int     `json:"total"`
    Critical     int     `json:"critical"`
    Warning      int     `json:"warning"`
    Info         int     `json:"info"`
    RecentAlerts []Alert `json:"recentAlerts"`
    TopAlerts    []Alert `json:"topAlerts"`
}

type Alert struct {
    ID            string    `json:"id"`
    Severity      string    `json:"severity"` // "critical", "warning", "info"
    Title         string    `json:"title"`
    Message       string    `json:"message"`
    Component     string    `json:"component"`
    Timestamp     time.Time `json:"timestamp"`
    Acknowledged  bool      `json:"acknowledged"`
    ResolveAction string    `json:"resolveAction"`
}
```

#### 4.3.2 Go 코드 구현
```go
func collectAlerts(conn *rados.Conn) (*AlertsSummary, error) {
    alerts := []Alert{}

    // 1. Get health warnings/errors
    healthAlerts, err := getHealthAlerts(conn)
    if err != nil {
        log.Warn("Failed to get health alerts:", err)
    } else {
        alerts = append(alerts, healthAlerts...)
    }

    // 2. Check OSD near-full/full
    osdAlerts, err := getOSDAlerts(conn)
    if err != nil {
        log.Warn("Failed to get OSD alerts:", err)
    } else {
        alerts = append(alerts, osdAlerts...)
    }

    // 3. Check PG issues
    pgAlerts, err := getPGAlerts(conn)
    if err != nil {
        log.Warn("Failed to get PG alerts:", err)
    } else {
        alerts = append(alerts, pgAlerts...)
    }

    // 4. Prometheus alerts (if available)
    prometheusAlerts, err := getPrometheusAlerts()
    if err != nil {
        log.Warn("Failed to get Prometheus alerts:", err)
    } else {
        alerts = append(alerts, prometheusAlerts...)
    }

    // Count by severity
    summary := &AlertsSummary{
        Total:        len(alerts),
        Critical:     0,
        Warning:      0,
        Info:         0,
        RecentAlerts: alerts,
        TopAlerts:    []Alert{},
    }

    for _, alert := range alerts {
        switch alert.Severity {
        case "critical":
            summary.Critical++
        case "warning":
            summary.Warning++
        case "info":
            summary.Info++
        }
    }

    // Sort by severity and timestamp for topAlerts
    sortedAlerts := make([]Alert, len(alerts))
    copy(sortedAlerts, alerts)
    sort.Slice(sortedAlerts, func(i, j int) bool {
        // Priority: critical > warning > info
        severityPriority := map[string]int{"critical": 3, "warning": 2, "info": 1}
        if severityPriority[sortedAlerts[i].Severity] != severityPriority[sortedAlerts[j].Severity] {
            return severityPriority[sortedAlerts[i].Severity] > severityPriority[sortedAlerts[j].Severity]
        }
        return sortedAlerts[i].Timestamp.After(sortedAlerts[j].Timestamp)
    })

    // Take top 10
    topCount := 10
    if len(sortedAlerts) < topCount {
        topCount = len(sortedAlerts)
    }
    summary.TopAlerts = sortedAlerts[:topCount]

    return summary, nil
}

func getHealthAlerts(conn *rados.Conn) ([]Alert, error) {
    alerts := []Alert{}

    cmd, _ := json.Marshal(map[string]interface{}{
        "prefix": "health",
        "detail": "detail",
        "format": "json",
    })

    buf, _, err := conn.MonCommand(cmd)
    if err != nil {
        return nil, err
    }

    var health map[string]interface{}
    json.Unmarshal(buf, &health)

    if checks, ok := health["checks"].(map[string]interface{}); ok {
        for checkName, checkData := range checks {
            check := checkData.(map[string]interface{})
            severity := check["severity"].(string)
            summary := check["summary"].(map[string]interface{})
            message := summary["message"].(string)

            alert := Alert{
                ID:           fmt.Sprintf("health-%s", checkName),
                Severity:     mapHealthSeverityToAlertSeverity(severity),
                Title:        formatCheckName(checkName),
                Message:      message,
                Component:    "Cluster",
                Timestamp:    time.Now(),
                Acknowledged: false,
                ResolveAction: generateResolveAction(checkName, check),
            }
            alerts = append(alerts, alert)
        }
    }

    return alerts, nil
}

func getOSDAlerts(conn *rados.Conn) ([]Alert, error) {
    alerts := []Alert{}

    // Get OSD df to check utilization
    cmd, _ := json.Marshal(map[string]interface{}{
        "prefix": "osd df",
        "format": "json",
    })

    buf, _, err := conn.MonCommand(cmd)
    if err != nil {
        return nil, err
    }

    var osdDf map[string]interface{}
    json.Unmarshal(buf, &osdDf)

    if nodes, ok := osdDf["nodes"].([]interface{}); ok {
        for _, node := range nodes {
            n := node.(map[string]interface{})
            osdID := int(n["id"].(float64))
            utilization := n["utilization"].(float64)

            var severity string
            var title string
            var resolveAction string

            if utilization >= 90 {
                severity = "critical"
                title = "OSD Nearly Full"
                resolveAction = "URGENT: OSD is nearly full. Immediately rebalance data or add capacity to prevent cluster from becoming read-only."
            } else if utilization >= 80 {
                severity = "warning"
                title = "OSD Utilization High"
                resolveAction = "Consider rebalancing data or adding capacity to prevent OSD from becoming full."
            } else {
                continue // No alert needed
            }

            alert := Alert{
                ID:           fmt.Sprintf("osd-util-%d", osdID),
                Severity:     severity,
                Title:        title,
                Message:      fmt.Sprintf("OSD.%d utilization is %.1f%%", osdID, utilization),
                Component:    fmt.Sprintf("OSD.%d", osdID),
                Timestamp:    time.Now(),
                Acknowledged: false,
                ResolveAction: resolveAction,
            }
            alerts = append(alerts, alert)
        }
    }

    // Check for down OSDs
    cmd2, _ := json.Marshal(map[string]interface{}{
        "prefix": "osd tree",
        "format": "json",
    })

    buf2, _, err := conn.MonCommand(cmd2)
    if err != nil {
        return alerts, err
    }

    var osdTree map[string]interface{}
    json.Unmarshal(buf2, &osdTree)

    if nodes, ok := osdTree["nodes"].([]interface{}); ok {
        for _, node := range nodes {
            n := node.(map[string]interface{})
            if n["type"].(string) == "osd" {
                osdID := int(n["id"].(float64))
                status := n["status"].(string)

                if status == "down" {
                    alert := Alert{
                        ID:           fmt.Sprintf("osd-down-%d", osdID),
                        Severity:     "critical",
                        Title:        "OSD Down",
                        Message:      fmt.Sprintf("OSD.%d is down and needs immediate attention", osdID),
                        Component:    fmt.Sprintf("OSD.%d", osdID),
                        Timestamp:    time.Now(),
                        Acknowledged: false,
                        ResolveAction: "Check network connectivity and OSD daemon status. Restart OSD if necessary. Investigate logs for failure cause.",
                    }
                    alerts = append(alerts, alert)
                }
            }
        }
    }

    return alerts, nil
}

func getPGAlerts(conn *rados.Conn) ([]Alert, error) {
    alerts := []Alert{}

    cmd, _ := json.Marshal(map[string]interface{}{
        "prefix": "pg stat",
        "format": "json",
    })

    buf, _, err := conn.MonCommand(cmd)
    if err != nil {
        return nil, err
    }

    var pgStat map[string]interface{}
    json.Unmarshal(buf, &pgStat)

    // Count PGs by state
    degradedCount := 0
    inconsistentCount := 0

    if stats, ok := pgStat["pg_stats"].([]interface{}); ok {
        for _, stat := range stats {
            s := stat.(map[string]interface{})
            state := s["state"].(string)

            if strings.Contains(state, "degraded") {
                degradedCount++
            }
            if strings.Contains(state, "inconsistent") {
                inconsistentCount++
            }
        }
    }

    if degradedCount > 0 {
        severity := "warning"
        if degradedCount > 10 {
            severity = "critical"
        }

        alert := Alert{
            ID:           "pg-degraded",
            Severity:     severity,
            Title:        "Degraded PGs Detected",
            Message:      fmt.Sprintf("%d PGs are in degraded state", degradedCount),
            Component:    "PGs",
            Timestamp:    time.Now(),
            Acknowledged: false,
            ResolveAction: "Monitor recovery progress. Check for OSD failures or network issues causing degraded state.",
        }
        alerts = append(alerts, alert)
    }

    if inconsistentCount > 0 {
        alert := Alert{
            ID:           "pg-inconsistent",
            Severity:     "critical",
            Title:        "Inconsistent PGs Detected",
            Message:      fmt.Sprintf("%d PGs have inconsistent data", inconsistentCount),
            Component:    "PGs",
            Timestamp:    time.Now(),
            Acknowledged: false,
            ResolveAction: "Run 'ceph pg repair <pgid>' for each inconsistent PG. Investigate scrub errors and potential disk issues.",
        }
        alerts = append(alerts, alert)
    }

    return alerts, nil
}

func getPrometheusAlerts() ([]Alert, error) {
    // Query Prometheus alerts API
    // This is optional if Prometheus alertmanager is configured
    alerts := []Alert{}

    // Example implementation:
    // resp, err := http.Get("http://prometheus:9090/api/v1/alerts")
    // Parse and convert to Alert format

    return alerts, nil
}

func mapHealthSeverityToAlertSeverity(healthSeverity string) string {
    switch healthSeverity {
    case "HEALTH_ERR":
        return "critical"
    case "HEALTH_WARN":
        return "warning"
    default:
        return "info"
    }
}

func formatCheckName(checkName string) string {
    // Convert "OSD_NEARFULL" to "OSD Near Full"
    words := strings.Split(checkName, "_")
    for i, word := range words {
        words[i] = strings.Title(strings.ToLower(word))
    }
    return strings.Join(words, " ")
}

func generateResolveAction(checkName string, checkData map[string]interface{}) string {
    // Generate specific resolve actions based on check type
    actions := map[string]string{
        "OSD_NEARFULL": "Add storage capacity or rebalance data across OSDs to reduce utilization.",
        "OSD_FULL": "URGENT: Cluster is full. Delete unnecessary data or add capacity immediately.",
        "OSD_DOWN": "Check OSD daemon status and restart if necessary. Investigate network and hardware issues.",
        "MON_DOWN": "Check monitor daemon status. Ensure quorum can be maintained.",
        "PG_DEGRADED": "Monitor recovery progress. Ensure all OSDs are up and functioning.",
        "PG_DAMAGED": "Run repair on affected PGs: ceph pg repair <pgid>",
    }

    if action, ok := actions[checkName]; ok {
        return action
    }

    return "Review cluster health details and follow Ceph documentation for resolution."
}
```

---

## 5. 통합 - 핸들러 수정

### 5.1 기존 핸들러 확장
```go
// File: internal/handlers/report.go

func (h *Handler) ReportOverviewHandler(w http.ResponseWriter, r *http.Request) {
    // ========== 기존 코드 (유지) ==========
    metadata := h.collectClusterMetadata()
    clusterHealth := h.collectClusterHealth()
    keyMetrics := h.collectKeyMetrics()
    poolsSummary := h.collectPoolsSummary()
    hostsSummary := h.collectHostsSummary()

    // ========== 추가: 새 데이터 수집 ==========
    trends, err := h.collectTrends()
    if err != nil {
        log.Error("Failed to collect trends:", err)
        // Continue with partial data
    }

    events, err := h.collectEvents()
    if err != nil {
        log.Error("Failed to collect events:", err)
    }

    alerts, err := h.collectAlerts()
    if err != nil {
        log.Error("Failed to collect alerts:", err)
    }

    // ========== 응답 생성 ==========
    response := ReportOverviewResponse{
        Success:   true,
        Timestamp: time.Now().UTC().Format(time.RFC3339),
        Data: ReportOverviewData{
            Metadata:      metadata,
            ClusterHealth: clusterHealth,
            KeyMetrics:    keyMetrics,
            PoolsSummary:  poolsSummary,
            HostsSummary:  hostsSummary,

            // 추가 데이터
            Trends: trends,
            Events: events,
            Alerts: alerts,
        },
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}

// ========== 새 메서드들 ==========

func (h *Handler) collectTrends() ([]TrendData, error) {
    trends := []TrendData{}

    // IOPS Trend
    iopsTrend, err := h.collectIOPSTrend()
    if err != nil {
        log.Warn("Failed to collect IOPS trend:", err)
    } else {
        trends = append(trends, iopsTrend)
    }

    // Latency Trend
    latencyTrend, err := h.collectLatencyTrend()
    if err != nil {
        log.Warn("Failed to collect latency trend:", err)
    } else {
        trends = append(trends, latencyTrend)
    }

    // Throughput Trend
    throughputTrend, err := h.collectThroughputTrend()
    if err != nil {
        log.Warn("Failed to collect throughput trend:", err)
    } else {
        trends = append(trends, throughputTrend)
    }

    // Capacity Trend
    capacityTrend, err := h.collectCapacityTrend()
    if err != nil {
        log.Warn("Failed to collect capacity trend:", err)
    } else {
        trends = append(trends, capacityTrend)
    }

    return trends, nil
}

func (h *Handler) collectIOPSTrend() (TrendData, error) {
    // Query Prometheus for read/write IOPS over last 24 hours
    readQuery := `sum(rate(ceph_pool_rd_ops[5m]))`
    writeQuery := `sum(rate(ceph_pool_wr_ops[5m]))`

    start := time.Now().Add(-24 * time.Hour)
    end := time.Now()
    step := time.Hour

    readData, err := h.prometheusClient.QueryRange(readQuery, start, end, step)
    if err != nil {
        return TrendData{}, err
    }

    writeData, err := h.prometheusClient.QueryRange(writeQuery, start, end, step)
    if err != nil {
        return TrendData{}, err
    }

    // Combine read + write IOPS
    trendPoints := []TrendPoint{}
    for i, readPoint := range readData {
        totalIOPS := readPoint.Value + writeData[i].Value
        trendPoints = append(trendPoints, TrendPoint{
            Timestamp: readPoint.Timestamp,
            Value:     totalIOPS,
            Label:     readPoint.Timestamp.Format("15:04"),
        })
    }

    insights := generateInsights(trendPoints, "IOPS")
    prediction := generatePrediction(trendPoints, "IOPS")

    return TrendData{
        Category:   "IOPS",
        Data:       trendPoints,
        Insights:   insights,
        Prediction: prediction,
    }, nil
}

func (h *Handler) collectLatencyTrend() (TrendData, error) {
    query := `avg(ceph_osd_commit_latency_ms)`

    start := time.Now().Add(-24 * time.Hour)
    end := time.Now()
    step := time.Hour

    data, err := h.prometheusClient.QueryRange(query, start, end, step)
    if err != nil {
        return TrendData{}, err
    }

    trendPoints := convertToTrendPoints(data)
    insights := generateInsights(trendPoints, "Latency")
    prediction := generatePrediction(trendPoints, "Latency")

    return TrendData{
        Category:   "Latency",
        Data:       trendPoints,
        Insights:   insights,
        Prediction: prediction,
    }, nil
}

func (h *Handler) collectThroughputTrend() (TrendData, error) {
    readQuery := `sum(rate(ceph_pool_rd_bytes[5m])) / 1024 / 1024`
    writeQuery := `sum(rate(ceph_pool_wr_bytes[5m])) / 1024 / 1024`

    start := time.Now().Add(-24 * time.Hour)
    end := time.Now()
    step := time.Hour

    readData, err := h.prometheusClient.QueryRange(readQuery, start, end, step)
    if err != nil {
        return TrendData{}, err
    }

    writeData, err := h.prometheusClient.QueryRange(writeQuery, start, end, step)
    if err != nil {
        return TrendData{}, err
    }

    // Combine read + write throughput
    trendPoints := []TrendPoint{}
    for i, readPoint := range readData {
        totalMBps := readPoint.Value + writeData[i].Value
        trendPoints = append(trendPoints, TrendPoint{
            Timestamp: readPoint.Timestamp,
            Value:     totalMBps,
            Label:     readPoint.Timestamp.Format("15:04"),
        })
    }

    insights := generateInsights(trendPoints, "Throughput")
    prediction := generatePrediction(trendPoints, "Throughput")

    return TrendData{
        Category:   "Throughput",
        Data:       trendPoints,
        Insights:   insights,
        Prediction: prediction,
    }, nil
}

func (h *Handler) collectCapacityTrend() (TrendData, error) {
    query := `(ceph_cluster_total_used_bytes / ceph_cluster_total_bytes) * 100`

    start := time.Now().Add(-24 * time.Hour)
    end := time.Now()
    step := time.Hour

    data, err := h.prometheusClient.QueryRange(query, start, end, step)
    if err != nil {
        return TrendData{}, err
    }

    trendPoints := convertToTrendPoints(data)
    insights := generateInsights(trendPoints, "Capacity")
    prediction := generatePrediction(trendPoints, "Capacity")

    return TrendData{
        Category:   "Capacity",
        Data:       trendPoints,
        Insights:   insights,
        Prediction: prediction,
    }, nil
}

func (h *Handler) collectEvents() ([]TimelineEvent, error) {
    return collectEvents(h.cephConn)
}

func (h *Handler) collectAlerts() (*AlertsSummary, error) {
    return collectAlerts(h.cephConn)
}

func convertToTrendPoints(promData []PrometheusDataPoint) []TrendPoint {
    points := make([]TrendPoint, len(promData))
    for i, p := range promData {
        points[i] = TrendPoint{
            Timestamp: p.Timestamp,
            Value:     p.Value,
            Label:     p.Timestamp.Format("15:04"),
        }
    }
    return points
}
```

---

## 6. 데이터 타입 정의

### 6.1 추가 타입 정의
```go
// File: internal/types/report.go

type ReportOverviewData struct {
    Metadata      ClusterMetadata      `json:"metadata"`
    ClusterHealth ClusterHealthSummary `json:"clusterHealth"`
    KeyMetrics    KeyMetrics           `json:"keyMetrics"`
    PoolsSummary  []PoolSummary        `json:"poolsSummary"`
    HostsSummary  []HostSummary        `json:"hostsSummary"`

    // 추가
    Trends []TrendData      `json:"trends"`
    Events []TimelineEvent  `json:"events"`
    Alerts *AlertsSummary   `json:"alerts"`
}

type TrendData struct {
    Category   string         `json:"category"`
    Data       []TrendPoint   `json:"data"`
    Insights   []string       `json:"insights"`
    Prediction PredictionData `json:"prediction"`
}

type TrendPoint struct {
    Timestamp time.Time `json:"timestamp"`
    Value     float64   `json:"value"`
    Label     string    `json:"label"`
}

type PredictionData struct {
    Trend            string  `json:"trend"` // "stable", "increasing", "decreasing"
    ProjectedValue   float64 `json:"projectedValue"`
    Confidence       float64 `json:"confidence"`
    TimeToThreshold  int     `json:"timeToThreshold,omitempty"` // days
}

type TimelineEvent struct {
    ID        string    `json:"id"`
    Timestamp time.Time `json:"timestamp"`
    Type      string    `json:"type"` // "info", "warning", "error"
    Component string    `json:"component"`
    Message   string    `json:"message"`
    Details   string    `json:"details"`
    Resolved  bool      `json:"resolved"`
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
    ID            string    `json:"id"`
    Severity      string    `json:"severity"`
    Title         string    `json:"title"`
    Message       string    `json:"message"`
    Component     string    `json:"component"`
    Timestamp     time.Time `json:"timestamp"`
    Acknowledged  bool      `json:"acknowledged"`
    ResolveAction string    `json:"resolveAction"`
}
```

---

## 7. Prometheus 클라이언트 설정

### 7.1 Prometheus 클라이언트 추가
```go
// File: internal/prometheus/client.go

package prometheus

import (
    "context"
    "time"

    "github.com/prometheus/client_golang/api"
    v1 "github.com/prometheus/client_golang/api/prometheus/v1"
    "github.com/prometheus/common/model"
)

type Client struct {
    api v1.API
}

type DataPoint struct {
    Timestamp time.Time
    Value     float64
}

func NewClient(prometheusURL string) (*Client, error) {
    client, err := api.NewClient(api.Config{
        Address: prometheusURL,
    })
    if err != nil {
        return nil, err
    }

    return &Client{
        api: v1.NewAPI(client),
    }, nil
}

func (c *Client) QueryRange(query string, start, end time.Time, step time.Duration) ([]DataPoint, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    r := v1.Range{
        Start: start,
        End:   end,
        Step:  step,
    }

    result, warnings, err := c.api.QueryRange(ctx, query, r)
    if err != nil {
        return nil, err
    }

    if len(warnings) > 0 {
        log.Warn("Prometheus query warnings:", warnings)
    }

    // Convert Prometheus result to DataPoints
    matrix, ok := result.(model.Matrix)
    if !ok {
        return nil, fmt.Errorf("unexpected result type: %T", result)
    }

    if len(matrix) == 0 {
        return []DataPoint{}, nil
    }

    // Take first series
    series := matrix[0]
    dataPoints := make([]DataPoint, len(series.Values))

    for i, value := range series.Values {
        dataPoints[i] = DataPoint{
            Timestamp: value.Timestamp.Time(),
            Value:     float64(value.Value),
        }
    }

    return dataPoints, nil
}

func (c *Client) Query(query string) (float64, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    result, warnings, err := c.api.Query(ctx, query, time.Now())
    if err != nil {
        return 0, err
    }

    if len(warnings) > 0 {
        log.Warn("Prometheus query warnings:", warnings)
    }

    vector, ok := result.(model.Vector)
    if !ok || len(vector) == 0 {
        return 0, fmt.Errorf("no data returned")
    }

    return float64(vector[0].Value), nil
}
```

### 7.2 Handler에 Prometheus 클라이언트 추가
```go
// File: internal/handlers/handler.go

type Handler struct {
    cephConn         *rados.Conn
    prometheusClient *prometheus.Client
}

func NewHandler(cephConn *rados.Conn, prometheusURL string) (*Handler, error) {
    promClient, err := prometheus.NewClient(prometheusURL)
    if err != nil {
        return nil, fmt.Errorf("failed to create Prometheus client: %w", err)
    }

    return &Handler{
        cephConn:         cephConn,
        prometheusClient: promClient,
    }, nil
}
```

---

## 8. 테스트

### 8.1 API 테스트
```bash
# Test the upgraded API
curl -X GET http://localhost:8090/api/predict/report/overview | jq .

# Check trends data
curl -X GET http://localhost:8090/api/predict/report/overview | jq '.data.trends'

# Check events
curl -X GET http://localhost:8090/api/predict/report/overview | jq '.data.events'

# Check alerts
curl -X GET http://localhost:8090/api/predict/report/overview | jq '.data.alerts'
```

### 8.2 응답 크기 확인
```bash
# Check response size
curl -X GET http://localhost:8090/api/predict/report/overview -o /tmp/report.json
ls -lh /tmp/report.json

# If too large (>500KB), consider splitting into multiple APIs
```

---

## 9. 성능 최적화

### 9.1 캐싱
시계열 데이터는 자주 변하지 않으므로 캐싱 고려:
```go
type CachedTrends struct {
    data      []TrendData
    timestamp time.Time
    ttl       time.Duration
}

func (h *Handler) collectTrendsWithCache() ([]TrendData, error) {
    if h.trendsCache != nil && time.Since(h.trendsCache.timestamp) < h.trendsCache.ttl {
        return h.trendsCache.data, nil
    }

    trends, err := h.collectTrends()
    if err != nil {
        return nil, err
    }

    h.trendsCache = &CachedTrends{
        data:      trends,
        timestamp: time.Now(),
        ttl:       5 * time.Minute,
    }

    return trends, nil
}
```

### 9.2 병렬 처리
```go
func (h *Handler) collectTrends() ([]TrendData, error) {
    var wg sync.WaitGroup
    results := make([]TrendData, 4)
    errors := make([]error, 4)

    // Collect all trends in parallel
    wg.Add(4)

    go func() {
        defer wg.Done()
        results[0], errors[0] = h.collectIOPSTrend()
    }()

    go func() {
        defer wg.Done()
        results[1], errors[1] = h.collectLatencyTrend()
    }()

    go func() {
        defer wg.Done()
        results[2], errors[2] = h.collectThroughputTrend()
    }()

    go func() {
        defer wg.Done()
        results[3], errors[3] = h.collectCapacityTrend()
    }()

    wg.Wait()

    // Check for errors
    for i, err := range errors {
        if err != nil {
            log.Warnf("Failed to collect trend %d: %v", i, err)
        }
    }

    // Filter out failed results
    trends := []TrendData{}
    for _, result := range results {
        if result.Category != "" {
            trends = append(trends, result)
        }
    }

    return trends, nil
}
```

---

## 10. 배포 및 통합

### 10.1 백엔드 통합
anomaly-predictor-api의 ReportService에서 API 호출:
```java
@Service
public class CephDataService {
    private final WebClient webClient;

    public CephDataService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder
            .baseUrl("http://predictor:8090")
            .build();
    }

    public ReportOverviewResponse getReportOverview() {
        return webClient.get()
            .uri("/api/predict/report/overview")
            .retrieve()
            .bodyToMono(ReportOverviewResponse.class)
            .block();
    }
}
```

### 10.2 ReportService 수정
```java
private ReportResponse.ReportData generateReportData(GenerateReportRequest request) {
    // Get real data from predictor
    ReportOverviewResponse overview = cephDataService.getReportOverview();

    return ReportResponse.ReportData.builder()
        .clusterHealth(mapToClusterHealth(overview.getData().getClusterHealth()))
        .keyMetrics(mapToKeyMetrics(overview.getData().getKeyMetrics()))
        .trends(mapToTrends(overview.getData().getTrends()))
        .events(mapToEvents(overview.getData().getEvents()))
        .alerts(mapToAlerts(overview.getData().getAlerts()))
        .build();
}
```

---

## 11. 완료 체크리스트

- [ ] Prometheus 클라이언트 구현
- [ ] Trends 데이터 수집 (IOPS, Latency, Throughput, Capacity)
- [ ] Insights 생성 로직 구현
- [ ] Prediction 생성 로직 구현
- [ ] Events 수집 (health, OSD, PG, pool)
- [ ] Alerts 수집 및 분류 (critical, warning, info)
- [ ] ResolveAction 생성 로직
- [ ] 핸들러 통합
- [ ] 타입 정의 추가
- [ ] 테스트
- [ ] 백엔드 통합

---

## 12. 참고사항

### 12.1 응답 크기가 너무 클 경우
만약 응답이 500KB를 초과하면, 다음과 같이 분리 고려:
- `/api/predict/report/overview` - metadata, clusterHealth, keyMetrics, poolsSummary, hostsSummary, alerts
- `/api/predict/report/trends` - 시계열 트렌드 데이터
- `/api/predict/report/events` - 이벤트 타임라인

### 12.2 시계열 데이터 범위
기본값: 최근 24시간
쿼리 파라미터로 범위 조정 가능하게 확장 고려:
```
GET /api/predict/report/overview?range=7d
GET /api/predict/report/overview?range=30d
```
