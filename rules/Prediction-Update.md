# Ceph 장애 예측 시스템 - 카테고리별 추가 데이터 수집 가이드

## 📌 문서 개요
- **Ceph 버전**: Squid (19.x)
- **수집 우선순위**: Prometheus → Ceph REST API → go-ceph 모듈
- **REST API 엔드포인트**: `https://<ceph-dashboard>:8443/api`

---

## 2.1 **OSD 장애 (OSD Failure)** - 추가 권장 데이터

### `osd_op_latency_percentiles` - 레이턴시 백분위수 (p50, p95, p99)
**수집 방법: ✅ Prometheus**
```promql
ceph_osd_op_r_latency_seconds{quantile="0.5"}
ceph_osd_op_r_latency_seconds{quantile="0.95"}
ceph_osd_op_r_latency_seconds{quantile="0.99"}
```

### `osd_scrub_errors` - 스크럽 중 발견된 오류 수
**수집 방법: ✅ Prometheus**
```promql
ceph_pg_scrub_errors
```

### `osd_heartbeat_failures` - 하트비트 실패 횟수
**수집 방법: ✅ Ceph REST API**
```http
GET /api/health/full
```
```json
{
  "checks": {
    "OSD_SLOW_PING_TIME": {
      "count": 5,
      "detail": ["osd.1 heartbeat failures"]
    }
  }
}
```

### `bluefs_slow_used_bytes` - BlueFS 느린 장치 사용량
**수집 방법: ✅ Prometheus**
```promql
ceph_bluefs_slow_used_bytes
```

---

## 2.2 **용량 고갈 (Capacity Exhaustion)** - 추가 권장 데이터

### `pool_scrub_errors_per_pg` - PG당 스크럽 오류
**수집 방법: ✅ Prometheus**
```promql
ceph_pool_scrub_errors / ceph_pool_pg_num
```

### `pool_snap_count` - 스냅샷 개수
**수집 방법: ✅ Ceph REST API**
```http
GET /api/pool
```
```json
[{
  "pool_name": "rbd",
  "snap_seq": 10,
  "snap_count": 5
}]
```

### `pool_cache_hit_ratio` - 캐시 히트율 (캐시 티어 사용 시)
**수집 방법: ✅ Prometheus**
```promql
ceph_pool_cache_hit_ratio
```

### `pool_quota_usage_percentage` - 쿼터 사용률
**수집 방법: ✅ Ceph REST API**
```http
GET /api/pool/{pool_name}
```
```javascript
const pool_data = await fetch('/api/pool/rbd');
const usage_pct = (pool_data.stats.bytes_used / pool_data.quota_max_bytes) * 100;
```

---

## 2.3 **성능 저하 (Performance Degradation)** - 추가 권장 데이터

### `osd_slow_ops_count` - 느린 작업 횟수
**수집 방법: ✅ Prometheus**
```promql
ceph_osd_slow_ops_total
```

### `osd_blocked_ops_count` - 차단된 작업 횟수
**수집 방법: ✅ Prometheus**
```promql
ceph_osd_blocked_ops_total
```

### `client_io_wait_time` - 클라이언트 I/O 대기 시간
**수집 방법: ✅ Prometheus**
```promql
ceph_client_io_wait_seconds
```

### `recovery_io_rate` - 복구 I/O 속도
**수집 방법: ✅ Prometheus**
```promql
rate(ceph_recovery_io_bytes[5m])
```

---

## 2.4 **PG 불균형 (PG Imbalance)** - 추가 권장 데이터

### `pg_per_osd_variance` - OSD당 PG 분산
**수집 방법: ✅ Prometheus**
```promql
stddev(ceph_osd_pgs)
```

### `pg_backfill_toofull_count` - backfill 불가 횟수
**수집 방법: ✅ Prometheus**
```promql
ceph_pg_backfill_toofull
```

### `pg_states_distribution` - PG 상태 분포
**수집 방법: ✅ Ceph REST API**
```http
GET /api/pg/stats
```

### `balancer_score` - Balancer 점수
**수집 방법: ✅ Prometheus**
```promql
ceph_mgr_balancer_score
```

---

## 2.5 **네트워크 병목 (Network Bottleneck)** - 추가 권장 데이터

### `network_congestion_window` - TCP 혼잡 윈도우 크기
**수집 방법: ✅ Ceph REST API**
```http request
GET /api/predict/failure/network/congestion-window
```
**설명**: TCP 혼잡 윈도우 크기를 수집합니다 (2.10 Network Prediction).

**Query Parameters**:
- `port` (optional): 모니터링할 포트 번호 (기본값: `6789` - Ceph MON 기본 포트)

**Response** (200 OK):
```json
{
  "avg_congestion_window": 10,
  "connection_count": 15,
  "total_cwnd": 150,
  "port": "6789",
  "timestamp": "2025-11-03T10:30:00Z"
}
```

### `network_socket_buffer_errors` - 소켓 버퍼 오류
**수집 방법: ✅ Prometheus**
```promql
node_netstat_tcp_in_errs + node_netstat_tcp_out_rsts
```

### `cluster_network_utilization_ratio` - 클러스터/퍼블릭 네트워크 사용률 비율
**수집 방법: ✅ Ceph REST API**
```http
GET /api/perf_counters
```

### `network_retransmit_rate` - 네트워크 재전송률
**수집 방법: ✅ Prometheus**
```promql
rate(node_netstat_tcp_retrans_segs[5m])
```

---

## 2.6 **메모리 부족 (Memory Shortage)** - 추가 권장 데이터

### `osd_memory_usage` - OSD별 메모리 사용량
**수집 방법: ✅ Prometheus**
```promql
ceph_osd_memory_usage_bytes
```

### `mon_memory_usage` - Monitor 메모리 사용량
**수집 방법: ✅ Prometheus**
```promql
ceph_mon_memory_usage_bytes
```

### `mds_cache_memory_usage` - MDS 캐시 메모리 사용량
**수집 방법: ✅ Prometheus**
```promql
ceph_mds_mem_cache_bytes
```

### `system_memory_pressure` - 시스템 메모리 압박도
**수집 방법: ✅ Prometheus (node_exporter)**
```promql
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
```

---

## 2.7 **리밸런싱 필요 (Rebalancing Needed)** - 추가 권장 데이터

### `misplaced_objects_ratio` - 잘못 배치된 객체 비율
**수집 방법: ✅ Prometheus**
```promql
ceph_cluster_objects_misplaced / ceph_cluster_objects_total * 100
```

### `degraded_objects_ratio` - 저하된 객체 비율
**수집 방법: ✅ Prometheus**
```promql
ceph_cluster_objects_degraded / ceph_cluster_objects_total * 100
```

### `recovery_rate` - 복구 속도
**수집 방법: ✅ Prometheus**
```promql
rate(ceph_recovery_bytes[5m])
```

### `pg_remapped_count` - 재매핑된 PG 수
**수집 방법: ✅ Prometheus**
```promql
ceph_pg_remapped
```

---

## 2.8 **핫스팟 OSD (Hotspot OSD)** - 추가 권장 데이터

### `osd_op_queue_length` - OSD 작업 큐 길이
**수집 방법: ✅ Prometheus**
```promql
ceph_osd_op_queue_length
```

### `osd_utilization_variance` - OSD 사용률 분산
**수집 방법: ✅ Prometheus**
```promql
stddev(ceph_osd_utilization)
```

### `per_osd_iops` - OSD별 IOPS
**수집 방법: ✅ Prometheus**
```promql
rate(ceph_osd_op_r_latency_count[5m]) + rate(ceph_osd_op_w_latency_count[5m])
```

### `per_osd_throughput` - OSD별 처리량
**수집 방법: ✅ Prometheus**
```promql
rate(ceph_osd_op_r_out_bytes[5m]) + rate(ceph_osd_op_w_in_bytes[5m])
```

---

## 2.9 **클러스터 확장 (Cluster Expansion)** - 추가 권장 데이터

### `growth_rate_daily` - 일일 증가율
**수집 방법: ✅ Prometheus**
```promql
increase(ceph_cluster_total_used_bytes[24h])
```

### `days_until_full` - 가득 찰 때까지 남은 일수
**수집 방법: ✅ Ceph REST API**
```http request
GET /api/predict/failure/cluster/days-until-full
```
**설명**: 클러스터 용량이 고갈될 때까지 남은 일수를 예측합니다 (2.9 Cluster Expansion).

**Query Parameters**:
- `daily_growth_rate` (optional): 일일 증가율 (단위: bytes/day, 기본값: `107374182400` = 100GB)

**Response** (200 OK):
```json
{
  "days_until_full": 365.5,
  "total_bytes": 10995116277760,
  "used_bytes": 5497558138880,
  "avail_bytes": 5497558138880,
  "daily_growth_rate_bytes": 107374182400,
  "utilization_percent": 50.0,
  "timestamp": "2025-11-03T10:30:00Z"
}
```

### `nearfull_osd_count` - Near Full OSD 개수
**수집 방법: ✅ Prometheus**
```promql
count(ceph_osd_near_full == 1)
```

### `pool_growth_rate` - Pool별 증가율
**수집 방법: ✅ Prometheus**
```promql
rate(ceph_pool_bytes_used[24h])
```

---

## 2.10 **SMART 디스크 장애 (SMART Disk Failure)** - 추가 권장 데이터

### `smart_temperature` - 디스크 온도
**수집 방법: ✅ Ceph REST API**
```http
GET /api/host/{hostname}/devices
```

### `smart_reallocated_sectors` - 재할당 섹터
**수집 방법: ✅ Ceph REST API**
```http
GET /api/host/{hostname}/devices
```
```json
{
  "devices": [{
    "devid": "WDC_WD40EFZX",
    "smart_data": {
      "reallocated_sectors": 0,
      "pending_sectors": 0,
      "power_on_hours": 8760
    }
  }]
}
```

### `smart_wear_leveling_count` - SSD 마모도
**수집 방법: ✅ Ceph REST API**
```http
GET /api/host/{hostname}/devices
```

### `smart_uncorrectable_errors` - 수정불가 오류
**수집 방법: ✅ Ceph REST API**
```http
GET /api/host/{hostname}/devices
```

---

## 2.11 **메트릭 디스크 장애 (Metric-based Disk Failure)** - 추가 권장 데이터

### `disk_io_errors` - 디스크 I/O 오류
**수집 방법: ✅ Prometheus (node_exporter)**
```promql
rate(node_disk_io_errors_total[5m])
```

### `disk_read_latency` - 디스크 읽기 레이턴시
**수집 방법: ✅ Prometheus (node_exporter)**
```promql
rate(node_disk_read_time_seconds_total[5m]) / rate(node_disk_reads_completed_total[5m])
```

### `disk_write_latency` - 디스크 쓰기 레이턴시
**수집 방법: ✅ Prometheus (node_exporter)**
```promql
rate(node_disk_write_time_seconds_total[5m]) / rate(node_disk_writes_completed_total[5m])
```

### `disk_queue_size` - 디스크 큐 크기
**수집 방법: ✅ Prometheus (node_exporter)**
```promql
node_disk_io_now
```

---

## 2.12 **종합 분석 (Comprehensive Analysis)** - 추가 권장 데이터

### `cluster_health_status` - 클러스터 전체 상태
**수집 방법: ✅ Ceph REST API**
```http
GET /api/health/full
```

### `active_alerts_count` - 활성 경고 수
**수집 방법: ✅ Prometheus**
```promql
count(ALERTS{alertstate="firing"})
```

### `mgr_module_failures` - MGR 모듈 실패
**수집 방법: ✅ Ceph REST API**
```http
GET /api/mgr/module
```

### `mon_quorum_status` - Monitor 쿼럼 상태
**수집 방법: ✅ Ceph REST API**
```http
GET /api/monitor
```

---

## 📊 수집 방법 요약 통계

| 카테고리 | 총 항목 | Prometheus | REST API | go-ceph |
|---------|---------|------------|----------|---------|
| OSD 장애 | 4 | 3 (75%) | 1 (25%) | 0 (0%) |
| 용량 고갈 | 4 | 2 (50%) | 2 (50%) | 0 (0%) |
| 성능 저하 | 4 | 4 (100%) | 0 (0%) | 0 (0%) |
| PG 불균형 | 4 | 3 (75%) | 1 (25%) | 0 (0%) |
| 네트워크 병목 | 4 | 2 (50%) | 1 (25%) | 1 (25%) |
| 메모리 부족 | 4 | 4 (100%) | 0 (0%) | 0 (0%) |
| 리밸런싱 필요 | 4 | 4 (100%) | 0 (0%) | 0 (0%) |
| 핫스팟 OSD | 4 | 4 (100%) | 0 (0%) | 0 (0%) |
| 클러스터 확장 | 4 | 3 (75%) | 0 (0%) | 1 (25%) |
| SMART 디스크 장애 | 4 | 0 (0%) | 4 (100%) | 0 (0%) |
| 메트릭 디스크 장애 | 4 | 4 (100%) | 0 (0%) | 0 (0%) |
| 종합 분석 | 4 | 1 (25%) | 3 (75%) | 0 (0%) |
| **합계** | **48** | **34 (71%)** | **12 (25%)** | **2 (4%)** |

## 📝 구현 권장사항

1. **96%의 메트릭은 Prometheus와 REST API로 수집 가능**
2. **go-ceph 모듈 개발이 필요한 항목은 전체의 4%에 불과**
3. **대부분의 장애 예측에 필요한 데이터는 이미 Prometheus로 수집 가능**
4. **SMART 데이터는 모두 REST API로 수집 가능하므로 별도 개발 불필요**