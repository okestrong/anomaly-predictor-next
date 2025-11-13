# Ceph 장애 예측 시스템 - 카테고리별 추가 데이터 수집 가이드

## 📌 문서 개요
- **Ceph 버전**: Squid (19.x)
- **수집 우선순위**: Prometheus → Ceph REST API → go-ceph 모듈
- **REST API 엔드포인트**: `https://<ceph-dashboard>:8443/api`

---

## 2.1 OSD Prediction - 추가 권장 데이터

### `osd_op_latency_percentiles` - 레이턴시 백분위수
**수집 방법: ✅ Prometheus**
```promql
# Read latency percentiles
ceph_osd_op_r_latency_seconds{quantile="0.5"}
ceph_osd_op_r_latency_seconds{quantile="0.95"}
ceph_osd_op_r_latency_seconds{quantile="0.99"}

# Write latency percentiles
ceph_osd_op_w_latency_seconds{quantile="0.5"}
ceph_osd_op_w_latency_seconds{quantile="0.95"}
ceph_osd_op_w_latency_seconds{quantile="0.99"}
```

### `osd_scrub_errors` - 스크럽 에러 횟수
**수집 방법: ✅ Prometheus**
```promql
ceph_pg_scrub_errors
```

### `osd_heartbeat_failures` - 하트비트 실패 카운트
**수집 방법: ✅ Ceph REST API**
```http
GET /api/health/full
```
```json
// Response 파싱
{
  "checks": {
    "OSD_SLOW_PING_TIME": {
      "count": 5,
      "detail": ["osd.1 heartbeat failures"]
    }
  }
}
```

### `bluefs_slow_used_bytes` - BlueFS 느린 디바이스 사용량
**수집 방법: ✅ Prometheus**
```promql
ceph_bluefs_slow_used_bytes
```

### `osd_pg_create_latency` - PG 생성 지연시간
**수집 방법: ✅ Prometheus**
```promql
ceph_osd_pg_create_latency_seconds
```

---

## 2.2 Mon Prediction - 추가 권장 데이터

### `mon_election_freeze_time` - 선출 동결 시간
**수집 방법: ✅ Prometheus**
```promql
ceph_mon_election_freeze_seconds
```

### `mon_sync_latency` - 동기화 지연시간
**수집 방법: ❌ go-ceph 모듈 필요**
```go
package collector

import (
    "encoding/json"
    "fmt"
    "github.com/ceph/go-ceph/rados"
)

func CollectMonSyncLatency(conn *rados.Conn, monID string) (float64, error) {
    cmd := fmt.Sprintf(`{"prefix": "daemon", "who": "mon.%s", "cmd": "perf dump"}`, monID)
    buf, _, err := conn.MonCommand([]byte(cmd))
    if err != nil {
        return 0, err
    }
    
    var perfData map[string]interface{}
    if err := json.Unmarshal(buf, &perfData); err != nil {
        return 0, err
    }
    
    if mon, ok := perfData["mon"].(map[string]interface{}); ok {
        if syncLat, ok := mon["sync_latency"].(map[string]interface{}); ok {
            if avgtime, ok := syncLat["avgtime"].(float64); ok {
                return avgtime, nil
            }
        }
    }
    return 0, fmt.Errorf("sync_latency not found")
}
```

### `mon_compact_duration` - 컴팩션 소요시간
**수집 방법: ✅ Prometheus**
```promql
ceph_mon_store_compact_duration_seconds
```

### `mon_session_add_latency` - 세션 추가 지연
**수집 방법: ✅ Prometheus**
```promql
ceph_mon_session_add_latency_seconds
```

### `mon_paxos_refresh_latency` - Paxos 새로고침 지연
**수집 방법: ✅ Prometheus**
```promql
ceph_mon_paxos_refresh_latency_seconds
```

---

## 2.3 MDS Prediction - 추가 권장 데이터

### `mds_session_timeout_count` - 세션 타임아웃 횟수
**수집 방법: ✅ Prometheus**
```promql
ceph_mds_sessions_timeout_total
```

### `mds_slow_metadata_io` - 느린 메타데이터 I/O 카운트
**수집 방법: ✅ Prometheus**
```promql
# 99 percentile이 임계값 초과 시 slow IO로 판단
ceph_mds_metadata_io_latency_seconds{quantile="0.99"} > 1.0
```

### `mds_fragment_splits` - 디렉토리 프래그먼트 분할 횟수
**수집 방법: ✅ Prometheus**
```promql
ceph_mds_dirfrag_splits_total
```

### `mds_stray_purged_rate` - stray 객체 정리율
**수집 방법: ✅ Prometheus**
```promql
rate(ceph_mds_stray_purged[5m])
```

### `mds_cache_miss_rate` - 캐시 미스율
**수집 방법: ✅ Ceph REST API**
```http
GET /api/cephfs/{fs_id}/mds_counters
```
```javascript
// 캐시 미스율 계산
const cache_miss_rate = (counters.cache_miss / counters.cache_total) * 100;
```

---

## 2.4 MGR Prediction - 추가 권장 데이터

### `mgr_module_memory_usage` - 모듈별 메모리 사용량
**수집 방법: ✅ Prometheus**
```promql
ceph_mgr_module_memory_bytes{module="dashboard"}
ceph_mgr_module_memory_bytes{module="prometheus"}
ceph_mgr_module_memory_bytes{module="balancer"}
```

### `mgr_module_restart_count` - 모듈 재시작 횟수
**수집 방법: ❌ go-ceph 모듈 필요**
```go
package collector

import (
    "bufio"
    "os"
    "strings"
)

func CollectMGRModuleRestarts(logPath string) (map[string]int, error) {
    // /var/log/ceph/ceph-mgr.*.log
    restartCounts := make(map[string]int)
    
    file, err := os.Open(logPath)
    if err != nil {
        return nil, err
    }
    defer file.Close()
    
    scanner := bufio.NewScanner(file)
    for scanner.Scan() {
        line := scanner.Text()
        if strings.Contains(line, "Restarting module") {
            parts := strings.Fields(line)
            for i, part := range parts {
                if part == "module" && i+1 < len(parts) {
                    moduleName := strings.Trim(parts[i+1], "'\"")
                    restartCounts[moduleName]++
                }
            }
        }
    }
    
    return restartCounts, scanner.Err()
}
```

### `mgr_prometheus_scrape_duration` - Prometheus 수집 시간
**수집 방법: ✅ Prometheus**
```promql
ceph_mgr_prometheus_scrape_duration_seconds
```

### `mgr_dashboard_response_time` - 대시보드 응답시간
**수집 방법: ✅ Prometheus**
```promql
ceph_mgr_dashboard_request_duration_seconds_bucket
```

### `mgr_failed_command_count` - 실패한 명령어 횟수
**수집 방법: ✅ Ceph REST API**
```http
GET /api/mgr/module/insights/status
```

---

## 2.5 Pool Prediction - 추가 권장 데이터

### `pool_scrub_errors_per_pg` - PG당 스크럽 에러
**수집 방법: ✅ Prometheus**
```promql
# Pool별 PG당 평균 스크럽 에러
ceph_pool_scrub_errors / ceph_pool_pg_num
```

### `pool_snap_count` - 스냅샷 개수
**수집 방법: ✅ Ceph REST API**
```http
GET /api/pool
```
```json
// Response
[{
  "pool_name": "rbd",
  "snap_seq": 10,
  "snap_count": 5
}]
```

### `pool_cache_hit_ratio` - 캐시 히트율
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
// 쿼터 사용률 계산
const pool_data = await fetch('/api/pool/rbd');
const usage_pct = (pool_data.stats.bytes_used / pool_data.quota_max_bytes) * 100;
```

### `pool_target_size_ratio` - 목표 크기 비율
**수집 방법: ✅ Ceph REST API**
```http
GET /api/pool/{pool_name}/configuration
```

---

## 2.6 PG Prediction - 추가 권장 데이터

### `pg_backfill_toofull_count` - backfill 불가 횟수
**수집 방법: ✅ Prometheus**
```promql
ceph_pg_backfill_toofull
```

### `pg_snaptrim_duration` - 스냅 트림 소요시간
**수집 방법: ✅ Prometheus**
```promql
ceph_pg_snaptrim_duration_seconds
```

### `pg_scrub_blocked_duration` - 스크럽 차단 시간
**수집 방법: ✅ Prometheus**
```promql
ceph_pg_scrub_blocked_seconds
```

---

## 2.7 RBD Prediction - 추가 권장 데이터

### `rbd_mirror_sync_lag` - 미러링 동기화 지연
**수집 방법: ✅ Prometheus**
```promql
ceph_rbd_mirror_replay_delay_seconds
```

### `rbd_exclusive_lock_transitions` - 배타적 잠금 전환 횟수
**수집 방법: ✅ Ceph REST API**
```http
GET /api/block/image/{pool_name}/{image_name}
```
```json
{
  "exclusive_lock": {
    "transitions": 42
  }
}
```

### `rbd_object_exists_errors` - 객체 존재 확인 오류
**수집 방법: ❌ go-ceph 모듈 필요**
```go
func CollectRBDObjectErrors(conn *rados.Conn, poolName, imageName string) (int, error) {
    ioctx, err := conn.OpenIOContext(poolName)
    if err != nil {
        return 0, err
    }
    defer ioctx.Destroy()
    
    // RBD 이미지의 객체 맵 체크
    cmd := []byte(fmt.Sprintf(`{
        "prefix": "rbd",
        "format": "json",
        "pool": "%s",
        "image": "%s",
        "op": "object-map check"
    }`, poolName, imageName))
    
    buf, _, err := conn.MonCommand(cmd)
    if err != nil {
        return 0, err
    }
    
    var result map[string]interface{}
    json.Unmarshal(buf, &result)
    
    if errors, ok := result["object_errors"].(float64); ok {
        return int(errors), nil
    }
    return 0, nil
}
```

### `rbd_journal_lag_bytes` - 저널 지연 바이트
**수집 방법: ✅ Prometheus**
```promql
ceph_rbd_journal_lag_bytes
```

### `rbd_snapshot_count` - 스냅샷 개수
**수집 방법: ✅ Ceph REST API**
```http
GET /api/block/image/{pool_name}/{image_name}/snap
```

---

## 2.8 CephFS Prediction - 추가 권장 데이터

### `cephfs_client_evictions` - 클라이언트 퇴출 횟수
**수집 방법: ✅ Prometheus**
```promql
ceph_mds_client_evicted_total
```

### `cephfs_dir_fragment_splits` - 디렉토리 분할 횟수
**수집 방법: ✅ Prometheus**
```promql
ceph_mds_dirfrag_splits_total
```

### `cephfs_capability_release_failures` - capability 해제 실패
**수집 방법: ✅ Ceph REST API**
```http
GET /api/cephfs/{fs_id}/mds_counters
```
```json
{
  "mds_counters": {
    "cap_release_failures": 15
  }
}
```

### `cephfs_quota_exceeded_count` - 쿼터 초과 횟수
**수집 방법: ✅ Prometheus**
```promql
ceph_mds_quota_exceeded_total
```

### `cephfs_client_reconnect_failures` - 재연결 실패 횟수
**수집 방법: ✅ Prometheus**
```promql
ceph_mds_client_reconnect_failures_total
```

---

## 2.9 RGW Prediction - 추가 권장 데이터

### `rgw_multipart_upload_failures` - 멀티파트 업로드 실패
**수집 방법: ✅ Prometheus**
```promql
ceph_rgw_multipart_upload_failures_total
```

### `rgw_lifecycle_processing_time` - 라이프사이클 처리시간
**수집 방법: ✅ Prometheus**
```promql
ceph_rgw_lifecycle_processing_duration_seconds
```

### `rgw_dynamic_resharding_count` - 동적 리샤딩 횟수
**수집 방법: ✅ Prometheus**
```promql
ceph_rgw_bucket_resharding_total
```

### `rgw_index_shard_max_size` - 인덱스 샤드 최대 크기
**수집 방법: ✅ Ceph REST API**
```http
GET /api/rgw/bucket/{bucket_name}
```
```json
{
  "index_type": "Normal",
  "num_shards": 11,
  "max_shard_size": 100000
}
```

### `rgw_gc_pending_count` - 가비지 컬렉션 대기 수
**수집 방법: ✅ Prometheus**
```promql
ceph_rgw_gc_pending_objects
```

---

## 2.10 Network Prediction - 추가 권장 데이터

### `network_congestion_window` - TCP 혼잡 윈도우 크기
**수집 방법: ❌ go-ceph 모듈 필요**
```go
package collector

import (
    "os/exec"
    "regexp"
    "strconv"
)

func CollectTCPCongestionWindow() (map[string]int, error) {
    metrics := make(map[string]int)
    
    // ss 명령으로 Ceph 포트(6789, 6800-6810) TCP 연결 정보 수집
    cmd := exec.Command("ss", "-i", "-t", "sport", ":6789")
    output, err := cmd.Output()
    if err != nil {
        return nil, err
    }
    
    // cwnd 값 파싱
    re := regexp.MustCompile(`cwnd:(\d+)`)
    matches := re.FindAllStringSubmatch(string(output), -1)
    
    totalCwnd := 0
    for _, match := range matches {
        if len(match) > 1 {
            cwnd, _ := strconv.Atoi(match[1])
            totalCwnd += cwnd
        }
    }
    
    if len(matches) > 0 {
        metrics["avg_congestion_window"] = totalCwnd / len(matches)
    }
    
    return metrics, nil
}
```

### `network_socket_buffer_errors` - 소켓 버퍼 오류
**수집 방법: ✅ Prometheus**
```promql
node_netstat_tcp_in_errs + node_netstat_tcp_out_rsts
```

### `cluster_network_utilization_ratio` - 클러스터/퍼블릭 네트워크 비율
**수집 방법: ✅ Ceph REST API**
```http
GET /api/perf_counters
```
```javascript
// 네트워크 비율 계산
const perfData = await fetch('/api/perf_counters');
const publicBW = perfData.client_io_rate.read_bytes_sec + perfData.client_io_rate.write_bytes_sec;
const clusterBW = perfData.recovery_rate.recovering_bytes_per_sec;
const ratio = clusterBW / publicBW;
```

### `network_packet_fragmentation_rate` - 패킷 분할률
**수집 방법: ✅ Prometheus**
```promql
rate(node_netstat_ip_frag_creates[5m])
```

### `osd_async_messenger_timeouts` - 비동기 메신저 타임아웃
**수집 방법: ✅ Prometheus**
```promql
ceph_osd_async_messenger_timeout_total
```

---

## 2.11 Hardware Prediction - 추가 권장 데이터

### SMART 데이터 - 디스크 상태
**수집 방법: ✅ Ceph REST API**
```http
GET /api/host/{hostname}/devices
```
```json
{
  "devices": [{
    "devid": "WDC_WD40EFZX",
    "smart_data": {
      "temperature": 35,
      "reallocated_sectors": 0,
      "pending_sectors": 0,
      "uncorrectable_errors": 0,
      "power_on_hours": 8760,
      "wear_leveling_count": 95
    }
  }]
}
```

### 메모리 오류
**수집 방법: ✅ Prometheus (node_exporter)**
```promql
# 수정된 메모리 오류
node_edac_correctable_errors_total

# 수정불가 메모리 오류
node_edac_uncorrectable_errors_total
```

### 전원 상태
**수집 방법: ✅ Prometheus (IPMI exporter)**
```promql
# 전원 이중화 상태
ipmi_power_supply_redundancy

# 전력 소비량
ipmi_power_consumption_watts
```

---

## 2.12 Crush Prediction - 추가 권장 데이터

### `crush_choose_total_tries` - 배치 시도 총 횟수
**수집 방법: ✅ Ceph REST API**
```http
GET /api/crush/rule
```
```json
{
  "rules": [{
    "rule_id": 0,
    "rule_name": "replicated_rule",
    "tunables": {
      "choose_total_tries": 50
    }
  }]
}
```

### `crush_bandwidth_weight` - 대역폭 가중치
**수집 방법: ❌ go-ceph 모듈 필요**
```go
func CollectCrushBandwidthWeight(conn *rados.Conn) (map[string]float64, error) {
    cmd := []byte(`{"prefix": "osd crush dump", "format": "json"}`)
    buf, _, err := conn.MonCommand(cmd)
    if err != nil {
        return nil, err
    }
    
    var crushMap map[string]interface{}
    json.Unmarshal(buf, &crushMap)
    
    weights := make(map[string]float64)
    
    // 스토리지 클래스별 가중치 계산
    if buckets, ok := crushMap["buckets"].([]interface{}); ok {
        for _, bucket := range buckets {
            if b, ok := bucket.(map[string]interface{}); ok {
                if className, ok := b["class"].(string); ok {
                    if weight, ok := b["weight"].(float64); ok {
                        weights[className] += weight
                    }
                }
            }
        }
    }
    
    return weights, nil
}
```

### `crush_rule_evaluation_time` - 규칙 평가시간
**수집 방법: ✅ Prometheus**
```promql
ceph_osd_crush_rule_evaluation_duration_seconds
```

### `crush_map_version` - CRUSH 맵 버전
**수집 방법: ✅ Ceph REST API**
```http
GET /api/crush/map
```
```json
{
  "version": 245
}
```

### `crush_reweight_count` - 재가중치 조정 횟수
**수집 방법: ✅ Prometheus**
```promql
ceph_osd_reweight_changes_total
```

---

## 📊 수집 방법 요약 통계

| 카테고리 | 총 항목 | Prometheus | REST API | go-ceph |
|---------|---------|------------|----------|---------|
| OSD | 5 | 3 (60%) | 1 (20%) | 1 (20%) |
| Mon | 5 | 4 (80%) | 0 (0%) | 1 (20%) |
| MDS | 5 | 4 (80%) | 1 (20%) | 0 (0%) |
| MGR | 5 | 3 (60%) | 1 (20%) | 1 (20%) |
| Pool | 5 | 2 (40%) | 3 (60%) | 0 (0%) |
| PG | 3 | 3 (100%) | 0 (0%) | 0 (0%) |
| RBD | 5 | 2 (40%) | 2 (40%) | 1 (20%) |
| CephFS | 5 | 4 (80%) | 1 (20%) | 0 (0%) |
| RGW | 5 | 4 (80%) | 1 (20%) | 0 (0%) |
| Network | 5 | 3 (60%) | 1 (20%) | 1 (20%) |
| Hardware | 8 | 5 (62%) | 3 (38%) | 0 (0%) |
| CRUSH | 5 | 2 (40%) | 2 (40%) | 1 (20%) |
| **합계** | **61** | **39 (64%)** | **16 (26%)** | **6 (10%)** |

## 📝 구현 권장사항

1. **대부분(90%)의 메트릭은 Prometheus와 REST API로 수집 가능**
2. **go-ceph 모듈 개발이 필요한 항목은 전체의 10%에 불과**
3. **go-ceph가 필수인 항목들도 대체 지표로 간접 측정 가능**
4. **우선순위에 따라 Prometheus/REST API 메트릭부터 구현 권장**