# Prediction Final Guide - 실제 구현 데이터 수집 명세

## 1. 장애 예측 시스템 개요

AI/ML 기반 장애 예측 시스템은 RAG(Retrieval-Augmented Generation) 시스템과 Prometheus 메트릭을 결합하여 12가지 카테고리의 장애를 예측합니다. 이 문서는 `PredictionService.java`에서 **실제로 수집하고 있는 데이터**를 정리한 것입니다.

### 데이터 수집 시간 범위
- **METRIC_WINDOW**: 1시간 (최근 메트릭 수집)
- **HISTORY_WINDOW**: 24시간 (추세 분석용)

### 2단계 분석 구조
1. **1단계: 문서 검색** - RAG 시스템을 통해 관련 Ceph 문서 검색
2. **2단계: 분석 생성** - 검색된 문서 + 현재 메트릭으로 LLM 분석 수행

---

## 2. 12개 장애 예측 카테고리 상세

### 2.1 OSD 장애 (OSD Failure)

**수집 데이터:**
- OSD 목록 및 상태 정보
- OSD 레이턴시 메트릭
- 레이턴시 백분위수 (p50, p95, p99)
- 스크럽 오류 수
- 하트비트 실패 횟수
- BlueFS 느린 장치 사용량

**데이터 출처:**

| 데이터 | 출처 | API/PromQL |
|--------|------|------------|
| OSD 목록 | Ceph Manager Service | `cephManagerService.getAllOsds()` |
| 레이턴시 | Prometheus Service | `prometheusService.getLatency(METRIC_WINDOW)` |
| 레이턴시 p50 | Prometheus | `histogram_quantile(0.5, sum(rate(predict_osd_op_r_latency_seconds_bucket[5m])) by (le))` |
| 레이턴시 p95 | Prometheus | `histogram_quantile(0.95, sum(rate(predict_osd_op_r_latency_seconds_bucket[5m])) by (le))` |
| 레이턴시 p99 | Prometheus | `histogram_quantile(0.99, sum(rate(predict_osd_op_r_latency_seconds_bucket[5m])) by (le))` |
| 스크럽 오류 | Prometheus | `sum(predict_pg_scrub_errors)` |
| 하트비트 실패 | Ceph REST API | `/api/health/full` → `checks.OSD_SLOW_PING_TIME.count` |
| BlueFS 느린 장치 사용량 | Prometheus | `sum(ceph_bluefs_slow_used_bytes)` |

**프롬프트에 포함되는 메트릭:**
```
현재 메트릭:
- 위험도 점수: {riskScore} (0.0 ~ 1.0)
- 전체 OSD 개수: {totalOsds}개
- Down OSD: {downOsds}
- Out OSD: {outOsds}
- 평균 레이턴시: {avgLatency} ms
- 최대 레이턴시: {maxLatency} ms
- 레이턴시 임계값: 50 ms (기준치)

추가 수집 메트릭:
- 레이턴시 p50: {latencyP50} ms
- 레이턴시 p95: {latencyP95} ms
- 레이턴시 p99: {latencyP99} ms
- 스크럽 오류 수: {scrubErrors}
- 하트비트 실패 횟수: {heartbeatFailures}
- BlueFS 느린 장치 사용량: {bluefsSlow} bytes
```

**위험도 계산 로직:**
- Down OSD 비율 (40%)
- Out OSD 비율 (20%)
- 평균 레이턴시 (50ms 기준, 20%)
- 최대 레이턴시 (100ms 기준, 20%)

---

### 2.2 용량 고갈 (Capacity Exhaustion)

**수집 데이터:**
- Pool 목록 및 사용량 정보
- OSD 목록
- 클러스터 전체 사용률 히스토리
- PG당 스크럽 오류
- 캐시 히트율
- Full/Nearfull Ratio 설정값

**데이터 출처:**

| 데이터 | 출처 | API/PromQL |
|--------|------|------------|
| Pool 목록 | Ceph Manager Service | `cephManagerService.getAllPools()` |
| OSD 목록 | Ceph Manager Service | `cephManagerService.getAllOsds()` |
| 사용률 히스토리 | Prometheus Service | `prometheusService.getCephClusterUsage(METRIC_WINDOW)` |
| PG당 스크럽 오류 | Prometheus | `avg(max(predict_pg_scrub_errors) / max(predict_pg_total))` |
| 스냅샷 개수 | ❌ 미구현 | TODO: REST API `/api/pool` |
| 캐시 히트율 | Prometheus | `avg(max by (osd) (predict_bluestore_cache_hit_ratio))` |
| 쿼터 사용률 | ❌ 미구현 | TODO: REST API `/api/pool/{pool_name}` |
| Full/Nearfull Ratio | Ceph REST API | `/api/cluster_conf` → `mon_osd_full_ratio`, `mon_osd_nearfull_ratio` |

**프롬프트에 포함되는 메트릭:**
```
현재 메트릭:
- 위험도 점수: {riskScore}
- 전체 풀 개수: {totalPools}개
- 평균 사용률: {avgUsage}%
- 최고 사용률: {maxUsage}%
- Full Ratio 임계값: {fullRatio}%
- Nearfull Ratio 임계값: {nearfullRatio}%

추가 수집 메트릭:
- PG당 스크럽 오류: {scrubErrorsPerPg}
- 스냅샷 개수: {snapCount} (TODO: 미구현)
- 캐시 히트율: {cacheHitRatio}
- 쿼터 사용률: {quotaUsage}% (TODO: 미구현)

풀별 사용률:
- {poolName}: {usage}% (전체: {totalBytes}, 사용: {usedBytes})
```

**위험도 계산 로직:**
- 현재 사용률 (70%)
- 증가 추세 (30%)
- 85% 이상 사용률 시 high risk

---

### 2.3 성능 저하 (Performance Degradation)

**수집 데이터:**
- IOPS (Input/Output Operations Per Second)
- 레이턴시 (읽기/쓰기 평균)
- 처리량 (Throughput, bytes/sec)
- 느린 작업 횟수
- 차단된 작업 횟수
- 클라이언트 I/O 대기 시간
- 복구 I/O 속도

**데이터 출처:**

| 데이터 | 출처 | PromQL |
|--------|------|--------|
| IOPS | Prometheus Service | `prometheusService.getIOPS(METRIC_WINDOW)` |
| 레이턴시 | Prometheus Service | `prometheusService.getLatency(METRIC_WINDOW)` |
| 처리량 | Prometheus Service | `prometheusService.getThroughput(METRIC_WINDOW)` |
| 느린 작업 횟수 | Prometheus | `sum(ceph_osd_slow_ops_total)` |
| 차단된 작업 횟수 | Prometheus | `sum(ceph_osd_blocked_ops_total)` |
| 클라이언트 I/O 대기 시간 | Prometheus | `avg(ceph_client_io_wait_seconds)` |
| 복구 I/O 속도 | Prometheus | `sum(rate(ceph_recovery_io_bytes[5m]))` |

**프롬프트에 포함되는 메트릭:**
```
현재 메트릭:
- 위험도 점수: {riskScore}
- 평균 레이턴시: {avgLatency} ms (기준: 50ms 이하)
- 평균 IOPS: {avgIops} (기준: 100 이상)
- 평균 처리량: {avgThroughput} MB/s
- 성능 기준: 레이턴시 < 50ms, IOPS > 100

추가 수집 메트릭:
- 느린 작업 횟수: {slowOpsCount}
- 차단된 작업 횟수: {blockedOpsCount}
- 클라이언트 I/O 대기 시간: {clientIoWaitTime} seconds
- 복구 I/O 속도: {recoveryIoRate} bytes/sec
```

**위험도 계산 로직:**
- 레이턴시 (50ms 기준, 50%)
- IOPS (100 기준, 30%)
- 처리량 (20%)

---

### 2.4 PG 불균형 (PG Imbalance)

**수집 데이터:**
- OSD 목록 및 상태
- 클러스터 Health 상태
- OSD당 PG 분산 (표준편차)
- Backfill Toofull 횟수
- Balancer 점수

**데이터 출처:**

| 데이터 | 출처 | API/PromQL |
|--------|------|------------|
| OSD 목록 | Ceph Manager Service | `cephManagerService.getAllOsds()` |
| 클러스터 Health | Ceph Manager Service | `cephManagerService.getClusterHealth()` |
| OSD당 PG 분산 | Prometheus | `stddev(ceph_osd_pgs)` |
| Backfill Toofull 횟수 | Prometheus | `sum(ceph_pg_backfill_toofull)` |
| PG 상태 분포 | ❌ 미구현 | TODO: REST API `/api/pg/stats` |
| Balancer 점수 | Prometheus | `ceph_mgr_balancer_score` |

**프롬프트에 포함되는 메트릭:**
```
현재 메트릭:
- 위험도 점수: {riskScore}
- OSD 개수: {osdCount}
- 클러스터 상태: {clusterStatus}

추가 수집 메트릭:
- OSD당 PG 분산 (stddev): {pgPerOsdVariance}
- Backfill Toofull 횟수: {backfillToofullCount}
- Balancer 점수: {balancerScore}
```

**위험도 계산 로직:**
- Down OSD 비율 (30%)
- Out OSD 비율 (20%)
- UP 비율 (25%)
- IN 비율 (25%)

---

### 2.5 네트워크 병목 (Network Bottleneck)

**수집 데이터:**
- 네트워크 레이턴시
- 네트워크 처리량
- 소켓 버퍼 오류
- 네트워크 재전송률
- TCP 혼잡 윈도우 크기 (추정)
- 네트워크 사용률 비율 (추정)

**데이터 출처:**

| 데이터 | 출처 | PromQL/Method |
|--------|------|---------------|
| 레이턴시 | Prometheus Service | `prometheusService.getLatency(METRIC_WINDOW)` |
| 처리량 | Prometheus Service | `prometheusService.getThroughput(METRIC_WINDOW)` |
| 소켓 버퍼 오류 | Prometheus | `sum(node_netstat_tcp_in_errs + node_netstat_tcp_out_rsts)` |
| 네트워크 재전송률 | Prometheus | `sum(rate(node_netstat_tcp_retrans_segs[5m]))` |
| TCP 혼잡 윈도우 | 내부 추정 | `estimateNetworkCongestionWindow()` - 레이턴시 기반 추정 |
| 네트워크 사용률 비율 | 내부 계산 | `calculateNetworkUtilization()` - 처리량 기반 계산 |

**프롬프트에 포함되는 메트릭:**
```
현재 메트릭:
- 위험도 점수: {riskScore}
- 평균 레이턴시: {avgLatency} ms
- 평균 처리량: {avgThroughput} MB/s

추가 수집 메트릭:
- 소켓 버퍼 오류: {socketBufferErrors}
- 네트워크 재전송률: {networkRetransmitRate}
- TCP 혼잡 윈도우 (추정): {congestionWindow}
- 네트워크 사용률 비율 (추정): {networkUtilizationRatio}
```

**위험도 계산 로직:**
- 평균 레이턴시 (30ms 기준, 60%)
- 처리량 (50MB/s 기준, 40%)

---

### 2.6 메모리 부족 (Memory Shortage)

**수집 데이터:**
- OSD 목록
- 클러스터 사용률 히스토리
- OSD 메모리 사용량
- Monitor 메모리 사용량
- MDS 캐시 메모리 사용량
- 시스템 메모리 압박도

**데이터 출처:**

| 데이터 | 출처 | PromQL |
|--------|------|--------|
| OSD 목록 | Ceph Manager Service | `cephManagerService.getAllOsds()` |
| 사용률 히스토리 | Prometheus Service | `prometheusService.getCephClusterUsage(METRIC_WINDOW)` |
| OSD 메모리 사용량 | Prometheus | `sum(ceph_osd_memory_usage_bytes)` |
| Monitor 메모리 사용량 | Prometheus | `sum(ceph_mon_memory_usage_bytes)` |
| MDS 캐시 메모리 사용량 | Prometheus | `sum(ceph_mds_mem_cache_bytes)` |
| 시스템 메모리 압박도 | Prometheus (node_exporter) | `avg((1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100)` |

**프롬프트에 포함되는 메트릭:**
```
현재 메트릭:
- 위험도 점수: {riskScore}
- OSD 개수: {osdCount}개
- 메모리 사용 추세: 증가 경향 감지

추가 수집 메트릭:
- OSD 메모리 사용량: {osdMemoryUsage} bytes
- Monitor 메모리 사용량: {monMemoryUsage} bytes
- MDS 캐시 메모리 사용량: {mdsCacheMemoryUsage} bytes
- 시스템 메모리 압박도: {systemMemoryPressure}%
```

**위험도 계산 로직:**
- Down OSD 비율 기반 간접 추정 (70%)
- 사용률 증가 추세 (30%)

---

### 2.7 리밸런싱 필요 (Rebalancing Needed)

**수집 데이터:**
- OSD 목록
- Pool 목록
- 잘못 배치된 객체 비율
- 저하된 객체 비율
- 복구 속도
- 재매핑된 PG 수

**데이터 출처:**

| 데이터 | 출처 | PromQL |
|--------|------|--------|
| OSD 목록 | Ceph Manager Service | `cephManagerService.getAllOsds()` |
| Pool 목록 | Ceph Manager Service | `cephManagerService.getAllPools()` |
| 잘못 배치된 객체 비율 | Prometheus | `(ceph_cluster_objects_misplaced / ceph_cluster_objects_total) * 100` |
| 저하된 객체 비율 | Prometheus | `(ceph_cluster_objects_degraded / ceph_cluster_objects_total) * 100` |
| 복구 속도 | Prometheus | `sum(rate(ceph_recovery_bytes[5m]))` |
| 재매핑된 PG 수 | Prometheus | `sum(ceph_pg_remapped)` |

**프롬프트에 포함되는 메트릭:**
```
현재 메트릭:
- 위험도 점수: {riskScore}
- OSD 개수: {osdCount}
- 풀 개수: {poolCount}

추가 수집 메트릭:
- 잘못 배치된 객체 비율: {misplacedObjectsRatio}%
- 저하된 객체 비율: {degradedObjectsRatio}%
- 복구 속도: {recoveryRate} bytes/sec
- 재매핑된 PG 수: {pgRemappedCount}
```

**위험도 계산 로직:**
- Down/Out OSD 비율 (40%)
- Pool 사용률 분산도 (60%)

---

### 2.8 핫스팟 OSD (Hotspot OSD)

**수집 데이터:**
- OSD 목록
- IOPS
- 레이턴시
- 평균 작업 큐 길이
- OSD 사용률 분산
- OSD별 IOPS
- OSD별 처리량

**데이터 출처:**

| 데이터 | 출처 | PromQL |
|--------|------|--------|
| OSD 목록 | Ceph Manager Service | `cephManagerService.getAllOsds()` |
| IOPS | Prometheus Service | `prometheusService.getIOPS(METRIC_WINDOW)` |
| 레이턴시 | Prometheus Service | `prometheusService.getLatency(METRIC_WINDOW)` |
| 평균 작업 큐 길이 | Prometheus | `avg(ceph_osd_op_queue_length)` |
| OSD 사용률 분산 | Prometheus | `stddev(ceph_osd_utilization)` |
| OSD별 IOPS | Prometheus | `avg(rate(ceph_osd_op_r_latency_count[5m]) + rate(ceph_osd_op_w_latency_count[5m]))` |
| OSD별 처리량 | Prometheus | `avg(rate(ceph_osd_op_r_out_bytes[5m]) + rate(ceph_osd_op_w_in_bytes[5m]))` |

**프롬프트에 포함되는 메트릭:**
```
현재 메트릭:
- 위험도 점수: {riskScore}
- 의심 OSD: {hotspotOsds}
- 평균 IOPS: {avgIops}

추가 수집 메트릭:
- 평균 작업 큐 길이: {avgOpQueueLength}
- OSD 사용률 분산 (stddev): {osdUtilizationVariance}
- OSD별 평균 IOPS: {perOsdIops}
- OSD별 평균 처리량: {perOsdThroughput} bytes/sec
```

**위험도 계산 로직:**
- IOPS (1000 기준, 50%)
- 레이턴시 (50ms 기준, 50%)

---

### 2.9 클러스터 확장 (Cluster Expansion)

**수집 데이터:**
- Pool 목록
- 사용률 히스토리 (24시간)
- 일일 증가율
- Near Full OSD 개수
- Pool별 증가율
- 가득 찰 때까지 남은 일수

**데이터 출처:**

| 데이터 | 출처 | PromQL/API |
|--------|------|------------|
| Pool 목록 | Ceph Manager Service | `cephManagerService.getAllPools()` |
| 사용률 히스토리 | Prometheus Service | `prometheusService.getCephClusterUsage(HISTORY_WINDOW)` (24시간) |
| 일일 증가율 | Prometheus | `delta(ceph_cluster_total_used_bytes[24h])` |
| Near Full OSD 개수 | Prometheus | `count(ceph_osd_near_full == 1)` |
| Pool별 증가율 | Prometheus | `sum(rate(ceph_pool_bytes_used[24h]))` |
| 가득 찰 때까지 남은 일수 | Ceph REST API | `/api/predict/failure/cluster/days-until-full` |

**프롬프트에 포함되는 메트릭:**
```
현재 메트릭:
- 위험도 점수: {riskScore}
- 현재 사용률: {currentUsage}%
- 풀 개수: {poolCount}

추가 수집 메트릭:
- 일일 증가율: {dailyGrowthRate} bytes/day
- Near Full OSD 개수: {nearFullOsdCount}
- Pool별 증가율: {poolGrowthRate} bytes/day
- 가득 찰 때까지 남은 일수: {daysUntilFull} days
```

**위험도 계산 로직:**
- 현재 사용률 (60%)
- 증가 추세 (40%)

---

### 2.10 SMART 디스크 장애 (SMART Disk Failure)

**수집 데이터:**
- OSD 목록
- SMART 메트릭들 (온도, 재할당 섹터, 대기 중 섹터, 수정불가 오류, SSD 마모도, 가동 시간, 전원 사이클)

**데이터 출처:**

| 데이터 | 출처 | PromQL |
|--------|------|--------|
| OSD 목록 | Ceph Manager Service | `cephManagerService.getAllOsds()` |
| 평균 디스크 온도 | Prometheus (predictor 메트릭) | `avg(predict_osd_smart_temperature_celsius)` |
| 총 재할당 섹터 수 | Prometheus (predictor 메트릭) | `sum(predict_osd_smart_reallocated_sectors)` |
| SSD 평균 마모도 | Prometheus (predictor 메트릭) | `avg(predict_osd_smart_wear_leveling_count)` |
| 총 수정불가 오류 수 | Prometheus (predictor 메트릭) | `sum(predict_osd_smart_uncorrectable_sectors)` |
| 총 대기 중 섹터 수 | Prometheus (predictor 메트릭) | `sum(predict_osd_smart_pending_sectors)` |
| 평균 가동 시간 | Prometheus (predictor 메트릭) | `avg(predict_osd_smart_power_on_hours)` |
| 총 전원 사이클 횟수 | Prometheus (predictor 메트릭) | `sum(predict_osd_smart_power_cycles)` |

**프롬프트에 포함되는 메트릭:**
```
=== SMART 기반 디스크 장애 예측 ===
위험도: {riskScore}, 의심 OSD: {riskyOsds}

SMART 메트릭:
- 평균 디스크 온도: {smartTemperature}°C (50°C 이상 경고, 60°C 이상 위험)
- 재할당 섹터: {smartReallocatedSectors}개 (불량 섹터, 1개 이상 주의)
- 대기 중 섹터: {smartPendingSectors}개 (곧 불량 예정 섹터)
- 수정불가 오류: {smartUncorrectableErrors}개 (치명적 데이터 오류)
- SSD 마모도: {smartWearLevelingCount}% (남은 수명, 20% 이하 주의)
- 평균 가동 시간: {smartPowerOnHours}시간 (약 {years}년)
- 총 전원 사이클: {smartPowerCycles}회
```

**✅ 구현 상태:**
Prometheus predictor 메트릭을 통해 모든 SMART 데이터가 수집됩니다.
(Go predictor 프로젝트에서 `smartctl` 또는 Ceph OSD metadata를 통해 수집하여 Prometheus로 노출)

**위험도 계산 로직 (`calculateSmartDiskRiskWithMetrics`):**
- OSD 상태 (Down/Out) (30%)
- 온도 (15%) - 50°C 경고, 60°C 위험
- 재할당 섹터 (20%) - 1개 경고, 10개 이상 위험
- SSD 마모도 (15%) - 20% 이하 경고, 10% 이하 위험
- 수정불가 오류 (15%) - 1개 이상 위험
- 대기 중 섹터 (5%) - 1개 경고, 10개 이상 위험

---

### 2.11 메트릭 디스크 장애 (Metric-based Disk Failure)

**수집 데이터:**
- OSD 목록
- 레이턴시
- IOPS
- 디스크 I/O 오류
- 디스크 읽기/쓰기 레이턴시
- 디스크 큐 크기

**데이터 출처:**

| 데이터 | 출처 | PromQL |
|--------|------|--------|
| OSD 목록 | Ceph Manager Service | `cephManagerService.getAllOsds()` |
| 레이턴시 | Prometheus Service | `prometheusService.getLatency(METRIC_WINDOW)` |
| IOPS | Prometheus Service | `prometheusService.getIOPS(METRIC_WINDOW)` |
| 디스크 I/O 오류 | Prometheus (node_exporter) | `sum(rate(node_disk_io_errors_total[5m]))` |
| 디스크 읽기 레이턴시 | Prometheus (node_exporter) | `avg((rate(node_disk_read_time_seconds_total[5m]) / rate(node_disk_reads_completed_total[5m])) and rate(node_disk_reads_completed_total[5m]) > 0)` |
| 디스크 쓰기 레이턴시 | Prometheus (node_exporter) | `avg((rate(node_disk_write_time_seconds_total[5m]) / rate(node_disk_writes_completed_total[5m])) and rate(node_disk_writes_completed_total[5m]) > 0)` |
| 디스크 큐 크기 | Prometheus (node_exporter) | `avg(node_disk_io_now)` |

**프롬프트에 포함되는 메트릭:**
```
현재 메트릭:
- 위험도 점수: {riskScore}
- 성능 저하 OSD: {degradedOsds}
- 평균 레이턴시: {avgLatency} ms

추가 수집 메트릭:
- 디스크 I/O 오류: {diskIoErrors}
- 디스크 읽기 레이턴시: {diskReadLatency} seconds
- 디스크 쓰기 레이턴시: {diskWriteLatency} seconds
- 디스크 큐 크기: {diskQueueSize}
```

**위험도 계산 로직:**
- Down OSD 비율 (40%)
- 레이턴시 (100ms 기준, 40%)
- IOPS (50 기준, 20%)

---

### 2.12 종합 분석 (Comprehensive Analysis)

**수집 데이터:**
- 전체 11개 카테고리 예측 결과 집계
- 클러스터 Health 상태
- 활성 경고 수
- MGR 모듈 실패 수
- Monitor 쿼럼 상태

**데이터 출처:**

| 데이터 | 출처 | API/PromQL |
|--------|------|------------|
| 11개 예측 결과 | 내부 집계 | 각 카테고리 예측 메서드 호출 |
| 클러스터 Health | Ceph Manager Service | `cephManagerService.getClusterHealth()` |
| 활성 경고 수 | Prometheus | `count(ALERTS{alertstate="firing"})` |
| MGR 모듈 실패 수 | ❌ 미구현 (hardcoded: 0) | TODO: REST API `/api/mgr/module` |
| Monitor 쿼럼 상태 | ❌ 미구현 (hardcoded: "healthy") | TODO: REST API `/api/monitor` |

**프롬프트에 포함되는 메트릭:**
```
현재 메트릭:
- 전체 위험도: {avgRisk}
- 클러스터 상태: {clusterStatus}
- High Risk 항목: {highRiskCount}
- Medium Risk 항목: {mediumRiskCount}

추가 수집 메트릭:
- 활성 경고 수: {activeAlertsCount}
- MGR 모듈 실패 수: {mgrModuleFailures} (TODO: 미구현)
- Monitor 쿼럼 상태: {monQuorumStatus} (TODO: 미구현)

카테고리별 예측 결과:
[11개 카테고리 결과 포함]
```

**위험도 계산 로직:**
- 11개 카테고리 평균 위험도 계산

---

## 3. 구현 상태 요약

### ✅ 완전히 구현된 카테고리

| 카테고리 | 기본 메트릭 | 추가 메트릭 | 구현 상태 |
|----------|------------|------------|----------|
| 2.1 OSD 장애 | ✅ | ✅ | 완료 |
| 2.3 성능 저하 | ✅ | ✅ | 완료 |
| 2.6 메모리 부족 | ✅ | ✅ | 완료 |
| 2.7 리밸런싱 필요 | ✅ | ✅ | 완료 |
| 2.8 핫스팟 OSD | ✅ | ✅ | 완료 |
| 2.10 SMART 디스크 장애 | ✅ | ✅ | 완료 |
| 2.11 메트릭 디스크 장애 | ✅ | ✅ | 완료 |

### ⚠️ 부분적으로 구현된 카테고리

| 카테고리 | 미구현 항목 |
|----------|------------|
| 2.2 용량 고갈 | `snap_count`, `quota_usage_percentage` (REST API 연동 필요) |
| 2.4 PG 불균형 | `pg_states_distribution` (REST API 연동 필요) |
| 2.5 네트워크 병목 | `congestion_window`, `network_utilization_ratio` (내부 추정 사용) |
| 2.9 클러스터 확장 | `days_until_full` (REST API 연동 필요) |
| 2.12 종합 분석 | `mgr_module_failures`, `mon_quorum_status` (REST API 연동 필요) |

---

## 4. 데이터 수집 방법별 통계

| 수집 방법 | 항목 수 | 구현 비율 |
|----------|---------|----------|
| Prometheus (Ceph 메트릭) | 32 | 100% |
| Prometheus (predictor 메트릭) | 7 | 100% |
| Prometheus (node_exporter) | 8 | 100% |
| Ceph Manager Service | 6 | 100% |
| Ceph REST API | 9 | 44% (4/9) |
| 내부 계산/추정 | 3 | 100% |

---

## 5. 향후 구현 필요 사항

### ~~우선순위 1: SMART 데이터 연동~~ ✅ 완료
```
Prometheus predictor 메트릭으로 구현 완료:
- predict_osd_smart_temperature_celsius
- predict_osd_smart_reallocated_sectors
- predict_osd_smart_wear_leveling_count
- predict_osd_smart_uncorrectable_sectors
- predict_osd_smart_pending_sectors
- predict_osd_smart_power_on_hours
- predict_osd_smart_power_cycles
```

### 우선순위 1: Pool 상세 정보
```
REST API: /api/pool, /api/pool/{pool_name}
수집 대상: snap_count, quota_usage_percentage
```

### 우선순위 2: 클러스터 관리 정보
```
REST API: /api/mgr/module, /api/monitor, /api/pg/stats
수집 대상: mgr_module_failures, mon_quorum_status, pg_states_distribution
```

### 우선순위 3: 클러스터 용량 예측
```
REST API: /api/predict/failure/cluster/days-until-full
수집 대상: days_until_full
```

---

## 6. LLM 응답 처리

### 2단계 분석 방식

**1단계: 문서 검색 (RAG Query)**
```java
String searchQuery = "Ceph " + category + " 관련 문서";
AskResponse searchResponse = ragService.ask(searchQuery, "squid");
String relevantDocs = searchResponse.getSummary();
```

**2단계: 분석 생성 (Analysis Query)**
```java
String analysisPrompt = buildAnalysisPrompt(metrics, relevantDocs);
AskResponse analysisResponse = ragService.ask(analysisPrompt, "squid");
String aiAnalysis = analysisResponse.getSummary();
```

### Time to Impact 파싱

LLM 응답에서 "4."로 시작하는 라인을 찾아 숫자를 추출합니다:

```java
private String parseTimeToImpactFromLLM(String llmResponse, double fallbackRiskScore) {
    // "4." 또는 "4)" 로 시작하는 라인에서 숫자 추출
    // 추출된 시간(hours)을 사람이 읽기 쉬운 형태로 변환:
    // - <= 24h: "{n} hours"
    // - <= 7d: "{n} days"
    // - <= 30d: "{n} weeks"
    // - > 30d: "{n} months"

    // 파싱 실패 시 기존 generateTimeToFailure(riskScore) 사용:
    // - riskScore >= 0.8: "1-3 days"
    // - riskScore >= 0.6: "1-2 weeks"
    // - riskScore >= 0.4: "1-2 months"
    // - riskScore >= 0.2: "3-6 months"
    // - else: "6+ months"
}
```

---

## 7. Prometheus 쿼리 최적화

### 안전한 나누기
```promql
clamp_min(..., 0.001)  // division by zero 방지
```

### 5분 Rate 계산
```promql
rate(...[5m])  // 5분 평균 계산
```

### 조건부 쿼리
```promql
(...) and rate(...) > 0  // 0으로 나누기 방지
```

### 대체 쿼리
메트릭이 없을 경우 alternative query 자동 시도 패턴 사용

---

## 8. 문서 버전 정보

- **작성일**: 2025-12-10
- **최종 수정일**: 2025-12-10
- **Ceph 버전**: Squid (19.x)
- **기준 소스**: `PredictionService.java`
- **참조 문서**: `Predictor.md`, `Prediction-Update.md`

### 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2025-12-10 | SMART 디스크 장애 예측 구현 완료 - Prometheus predictor 메트릭 연동 |
