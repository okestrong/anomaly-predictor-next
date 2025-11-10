# Ceph 클러스터 7일 트렌드 차트 데이터 수집 가이드

## 📊 1. 용량 관련 메트릭 (Capacity Metrics)

### 1.1 클러스터 전체 용량
| 메트릭 | 설명 | 수집 방법 | PromQL/API |
|--------|------|----------|------------|
| **총 용량** | 클러스터 전체 용량 | Prometheus | `ceph_cluster_total_bytes` |
| **사용 용량** | 현재 사용 중인 용량 | Prometheus | `ceph_cluster_total_used_bytes` |
| **가용 용량** | 사용 가능한 용량 | Prometheus | `ceph_cluster_total_avail_bytes` |
| **사용률** | 용량 사용 백분율 | Prometheus | `(ceph_cluster_total_used_bytes / ceph_cluster_total_bytes) * 100` |
| **Raw 사용률** | Raw 용량 사용률 | Prometheus | `(ceph_cluster_total_used_raw_bytes / ceph_cluster_total_bytes) * 100` |

### 1.2 Pool별 용량
| 메트릭 | 설명 | 수집 방법 | PromQL/API |
|--------|------|----------|------------|
| **Pool 사용량** | 각 Pool의 사용량 | Prometheus | `ceph_pool_bytes_used{pool="..."}` |
| **Pool 객체 수** | Pool의 객체 개수 | Prometheus | `ceph_pool_objects{pool="..."}` |
| **Pool 증가율** | 일일 증가량 | Prometheus | `rate(ceph_pool_bytes_used[24h])` |
| **Pool 쿼터 사용률** | 쿼터 대비 사용률 | REST API | `GET /api/pool/{pool_name}` |
| **Pool 압축률** | 데이터 압축 비율 | Prometheus | `ceph_pool_compress_ratio{pool="..."}` |

### 1.3 OSD별 용량
| 메트릭 | 설명 | 수집 방법 | PromQL/API |
|--------|------|----------|------------|
| **OSD 사용률** | 각 OSD의 사용률 | Prometheus | `ceph_osd_utilization{osd="..."}` |
| **OSD 용량** | OSD별 총 용량 | Prometheus | `ceph_osd_stat_bytes{osd="..."}` |
| **Near Full OSD** | 거의 찬 OSD 수 | Prometheus | `count(ceph_osd_near_full == 1)` |
| **Full OSD** | 가득 찬 OSD 수 | Prometheus | `count(ceph_osd_full == 1)` |

---

## ⚡ 2. 성능 관련 메트릭 (Performance Metrics)

### 2.1 레이턴시
| 메트릭 | 설명 | 수집 방법 | PromQL/API |
|--------|------|----------|------------|
| **읽기 레이턴시** | 평균 읽기 지연시간 | Prometheus | `rate(ceph_osd_op_r_latency_sum[5m]) / rate(ceph_osd_op_r_latency_count[5m])` |
| **쓰기 레이턴시** | 평균 쓰기 지연시간 | Prometheus | `rate(ceph_osd_op_w_latency_sum[5m]) / rate(ceph_osd_op_w_latency_count[5m])` |
| **커밋 레이턴시** | 커밋 작업 지연시간 | Prometheus | `rate(ceph_osd_commit_latency_sum[5m]) / rate(ceph_osd_commit_latency_count[5m])` |
| **적용 레이턴시** | Apply 작업 지연시간 | Prometheus | `rate(ceph_osd_apply_latency_sum[5m]) / rate(ceph_osd_apply_latency_count[5m])` |
| **서브op 레이턴시** | 서브 작업 지연시간 | Prometheus | `rate(ceph_osd_subop_latency_sum[5m]) / rate(ceph_osd_subop_latency_count[5m])` |

### 2.2 IOPS
| 메트릭 | 설명 | 수집 방법 | PromQL/API |
|--------|------|----------|------------|
| **읽기 IOPS** | 초당 읽기 작업 수 | Prometheus | `sum(rate(ceph_osd_op_r[5m]))` |
| **쓰기 IOPS** | 초당 쓰기 작업 수 | Prometheus | `sum(rate(ceph_osd_op_w[5m]))` |
| **전체 IOPS** | 총 초당 작업 수 | Prometheus | `sum(rate(ceph_osd_op[5m]))` |
| **Pool별 IOPS** | Pool당 IOPS | Prometheus | `rate(ceph_pool_rd[5m]) + rate(ceph_pool_wr[5m])` |

### 2.3 처리량
| 메트릭 | 설명 | 수집 방법 | PromQL/API |
|--------|------|----------|------------|
| **읽기 처리량** | 읽기 대역폭 | Prometheus | `sum(rate(ceph_osd_op_r_out_bytes[5m]))` |
| **쓰기 처리량** | 쓰기 대역폭 | Prometheus | `sum(rate(ceph_osd_op_w_in_bytes[5m]))` |
| **전체 처리량** | 총 대역폭 | Prometheus | `sum(rate(ceph_osd_op_r_out_bytes[5m]) + rate(ceph_osd_op_w_in_bytes[5m]))` |
| **복구 처리량** | 복구 대역폭 | Prometheus | `sum(rate(ceph_osd_recovery_bytes[5m]))` |

---

## 🔒 3. 가용성/신뢰성 메트릭 (Availability & Reliability Metrics)

### 3.1 OSD 상태
| 메트릭 | 설명 | 수집 방법 | PromQL/API |
|--------|------|----------|------------|
| **UP OSD 수** | 활성 OSD 개수 | Prometheus | `count(ceph_osd_up == 1)` |
| **DOWN OSD 수** | 비활성 OSD 개수 | Prometheus | `count(ceph_osd_up == 0)` |
| **IN OSD 수** | 클러스터 참여 OSD | Prometheus | `count(ceph_osd_in == 1)` |
| **OUT OSD 수** | 클러스터 제외 OSD | Prometheus | `count(ceph_osd_in == 0)` |
| **OSD 가중치 합계** | 총 OSD 가중치 | Prometheus | `sum(ceph_osd_weight)` |

### 3.2 PG 상태
| 메트릭 | 설명 | 수집 방법 | PromQL/API |
|--------|------|----------|------------|
| **Active PG** | 활성 PG 수 | Prometheus | `ceph_pg_active` |
| **Clean PG** | 정상 PG 수 | Prometheus | `ceph_pg_clean` |
| **Degraded PG** | 저하된 PG 수 | Prometheus | `ceph_pg_degraded` |
| **Undersized PG** | 복제 부족 PG | Prometheus | `ceph_pg_undersized` |
| **Stuck PG** | 고착된 PG 수 | Prometheus | `ceph_pg_stale + ceph_pg_stuck_unclean + ceph_pg_stuck_degraded` |
| **Remapped PG** | 재매핑된 PG | Prometheus | `ceph_pg_remapped` |

### 3.3 Monitor 상태
| 메트릭 | 설명 | 수집 방법 | PromQL/API |
|--------|------|----------|------------|
| **Monitor 쿼럼** | 쿼럼 참여 Mon 수 | Prometheus | `ceph_mon_quorum_status` |
| **Monitor 레이턴시** | Mon 간 레이턴시 | Prometheus | `ceph_mon_latency_seconds` |
| **선출 횟수** | Leader 선출 횟수 | Prometheus | `rate(ceph_mon_elections_total[1h])` |
| **시계 스큐** | 시간 동기화 오차 | Prometheus | `ceph_mon_clock_skew_seconds` |

---

## 📈 4. I/O 패턴 메트릭 (I/O Pattern Metrics)

### 4.1 작업 타입별
| 메트릭 | 설명 | 수집 방법 | PromQL/API |
|--------|------|----------|------------|
| **읽기 비율** | 전체 I/O 중 읽기 비율 | Prometheus | `rate(ceph_osd_op_r[5m]) / (rate(ceph_osd_op_r[5m]) + rate(ceph_osd_op_w[5m])) * 100` |
| **쓰기 비율** | 전체 I/O 중 쓰기 비율 | Prometheus | `rate(ceph_osd_op_w[5m]) / (rate(ceph_osd_op_r[5m]) + rate(ceph_osd_op_w[5m])) * 100` |
| **삭제 작업** | 삭제 작업 수 | Prometheus | `rate(ceph_osd_op_delete[5m])` |
| **플러시 작업** | 플러시 작업 수 | Prometheus | `rate(ceph_osd_op_flush[5m])` |

### 4.2 작업 큐
| 메트릭 | 설명 | 수집 방법 | PromQL/API |
|--------|------|----------|------------|
| **대기 중 작업** | 큐에 대기 중인 작업 | Prometheus | `ceph_osd_op_queue_length` |
| **느린 작업** | Slow ops 수 | Prometheus | `ceph_osd_slow_ops` |
| **차단된 작업** | Blocked ops 수 | Prometheus | `ceph_osd_blocked_ops` |
| **작업 우선순위** | 우선순위별 작업 수 | REST API | `GET /api/osd/{id}/ops` |

---

## 🔄 5. 복구/리밸런싱 메트릭 (Recovery & Rebalancing Metrics)

### 5.1 복구 상태
| 메트릭 | 설명 | 수집 방법 | PromQL/API |
|--------|------|----------|------------|
| **복구 중 객체** | 복구 중인 객체 수 | Prometheus | `ceph_cluster_recovering_objects` |
| **복구 속도** | 초당 복구 바이트 | Prometheus | `rate(ceph_osd_recovery_bytes[5m])` |
| **복구 작업 수** | 활성 복구 작업 | Prometheus | `ceph_osd_recovery_ops` |
| **Backfill 객체** | Backfill 중인 객체 | Prometheus | `ceph_cluster_backfilling_objects` |
| **저하된 객체** | Degraded 객체 수 | Prometheus | `ceph_cluster_degraded_objects` |

### 5.2 리밸런싱
| 메트릭 | 설명 | 수집 방법 | PromQL/API |
|--------|------|----------|------------|
| **잘못 배치된 객체** | Misplaced 객체 수 | Prometheus | `ceph_cluster_misplaced_objects` |
| **잘못 배치 비율** | Misplaced 비율 | Prometheus | `ceph_cluster_misplaced_ratio * 100` |
| **리밸런서 점수** | Balancer 점수 | Prometheus | `ceph_mgr_balancer_score` |
| **PG 마이그레이션** | 이동 중인 PG | Prometheus | `ceph_pg_backfill + ceph_pg_wait_backfill` |

---

## 👥 6. 클라이언트 메트릭 (Client Metrics)

### 6.1 클라이언트 연결
| 메트릭 | 설명 | 수집 방법 | PromQL/API |
|--------|------|----------|------------|
| **활성 클라이언트** | 연결된 클라이언트 수 | REST API | `GET /api/perf_counters/client` |
| **클라이언트 I/O** | 클라이언트별 I/O | Prometheus | `ceph_client_io_ops` |
| **클라이언트 대역폭** | 클라이언트 처리량 | Prometheus | `ceph_client_io_read_bytes + ceph_client_io_write_bytes` |
| **세션 수** | MDS 세션 수 | Prometheus | `ceph_mds_sessions_total` |

### 6.2 프로토콜별
| 메트릭 | 설명 | 수집 방법 | PromQL/API |
|--------|------|----------|------------|
| **RBD 작업** | RBD 클라이언트 작업 | Prometheus | `ceph_rbd_io_ops` |
| **CephFS 작업** | CephFS 작업 수 | Prometheus | `ceph_mds_request` |
| **RGW 요청** | Object Gateway 요청 | Prometheus | `ceph_rgw_req_rate` |
| **S3 작업** | S3 API 요청 | Prometheus | `ceph_rgw_s3_ops` |

---

## 💻 7. 하드웨어/리소스 메트릭 (Hardware & Resource Metrics)

### 7.1 CPU 사용률
| 메트릭 | 설명 | 수집 방법 | PromQL/API |
|--------|------|----------|------------|
| **OSD CPU** | OSD 프로세스 CPU | Prometheus | `rate(ceph_osd_cpu_seconds_total[5m])` |
| **MON CPU** | Monitor CPU | Prometheus | `rate(ceph_mon_cpu_seconds_total[5m])` |
| **시스템 CPU** | 전체 시스템 CPU | Prometheus | `100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)` |
| **IOWait** | I/O 대기 CPU | Prometheus | `avg(rate(node_cpu_seconds_total{mode="iowait"}[5m])) * 100` |

### 7.2 메모리 사용률
| 메트릭 | 설명 | 수집 방법 | PromQL/API |
|--------|------|----------|------------|
| **OSD 메모리** | OSD 프로세스 메모리 | Prometheus | `ceph_osd_memory_bytes` |
| **MON 메모리** | Monitor 메모리 | Prometheus | `ceph_mon_memory_bytes` |
| **MDS 캐시** | MDS 캐시 메모리 | Prometheus | `ceph_mds_mem_cache` |
| **시스템 메모리** | 전체 메모리 사용률 | Prometheus | `(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100` |

### 7.3 디스크 메트릭
| 메트릭 | 설명 | 수집 방법 | PromQL/API |
|--------|------|----------|------------|
| **디스크 사용률** | 디스크 사용 백분율 | Prometheus | `(1 - node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100` |
| **디스크 IOPS** | 디스크 I/O 작업 | Prometheus | `rate(node_disk_reads_completed_total[5m]) + rate(node_disk_writes_completed_total[5m])` |
| **디스크 레이턴시** | 디스크 응답시간 | Prometheus | `rate(node_disk_io_time_seconds_total[5m])` |
| **SMART 온도** | 디스크 온도 | REST API | `GET /api/host/{hostname}/devices` |
| **SMART 에러** | 디스크 에러 수 | REST API | `GET /api/host/{hostname}/devices` |

### 7.4 네트워크 메트릭
| 메트릭 | 설명 | 수집 방법 | PromQL/API |
|--------|------|----------|------------|
| **네트워크 수신** | 수신 대역폭 | Prometheus | `rate(node_network_receive_bytes_total[5m])` |
| **네트워크 송신** | 송신 대역폭 | Prometheus | `rate(node_network_transmit_bytes_total[5m])` |
| **패킷 드롭** | 드롭된 패킷 | Prometheus | `rate(node_network_receive_drop_total[5m]) + rate(node_network_transmit_drop_total[5m])` |
| **네트워크 에러** | 네트워크 에러 | Prometheus | `rate(node_network_receive_errs_total[5m]) + rate(node_network_transmit_errs_total[5m])` |

---

## ⚠️ 8. 오류/경고 메트릭 (Error & Warning Metrics)

### 8.1 오류 카운트
| 메트릭 | 설명 | 수집 방법 | PromQL/API |
|--------|------|----------|------------|
| **스크럽 에러** | 데이터 검증 오류 | Prometheus | `sum(ceph_pg_scrub_errors)` |
| **딥스크럽 에러** | 심층 검증 오류 | Prometheus | `sum(ceph_pg_deep_scrub_errors)` |
| **읽기 에러** | 읽기 작업 오류 | Prometheus | `rate(ceph_osd_op_r_error[5m])` |
| **쓰기 에러** | 쓰기 작업 오류 | Prometheus | `rate(ceph_osd_op_w_error[5m])` |
| **체크섬 에러** | 체크섬 불일치 | Prometheus | `rate(ceph_osd_checksum_errors[5m])` |

### 8.2 경고/알림
| 메트릭 | 설명 | 수집 방법 | PromQL/API |
|--------|------|----------|------------|
| **Health Warnings** | 경고 상태 수 | REST API | `GET /api/health/full` |
| **Health Errors** | 오류 상태 수 | REST API | `GET /api/health/full` |
| **활성 알림** | Firing alerts | Prometheus | `count(ALERTS{alertstate="firing"})` |
| **로그 에러** | 로그의 에러 수 | REST API | `GET /api/logs` |

---

## 📐 9. 7일 트렌드 차트 구현 예시

### Prometheus 쿼리 (7일 범위)
```promql
# 7일간 용량 사용 추세
ceph_cluster_total_used_bytes[7d]

# 7일간 평균 레이턴시 (1시간 단위)
avg_over_time(
  (rate(ceph_osd_op_r_latency_sum[5m]) / 
   rate(ceph_osd_op_r_latency_count[5m]))[7d:1h]
)

# 7일간 IOPS 추세 (30분 단위)
sum(rate(ceph_osd_op[5m]))[7d:30m]

# 7일간 일일 증가량
increase(ceph_cluster_total_used_bytes[1d])[7d:1d]
```

### REST API 데이터 수집 (Go 예시)
```go
package trend

import (
    "encoding/json"
    "fmt"
    "net/http"
    "time"
)

type TrendData struct {
    Timestamp time.Time
    Value     float64
}

func Collect7DayTrend(apiURL, metric string) ([]TrendData, error) {
    var trends []TrendData
    
    // 7일간 1시간 간격으로 수집
    endTime := time.Now()
    startTime := endTime.AddDate(0, 0, -7)
    
    for t := startTime; t.Before(endTime); t = t.Add(time.Hour) {
        url := fmt.Sprintf("%s/api/metrics/%s?time=%d", 
            apiURL, metric, t.Unix())
        
        resp, err := http.Get(url)
        if err != nil {
            continue
        }
        
        var data map[string]interface{}
        json.NewDecoder(resp.Body).Decode(&data)
        resp.Body.Close()
        
        if val, ok := data["value"].(float64); ok {
            trends = append(trends, TrendData{
                Timestamp: t,
                Value:     val,
            })
        }
    }
    
    return trends, nil
}
```

### 차트 데이터 집계 함수
```go
func AggregateHourly(data []TrendData) []TrendData {
    // 시간별 평균 계산
    hourlyMap := make(map[int64][]float64)
    
    for _, d := range data {
        hour := d.Timestamp.Truncate(time.Hour).Unix()
        hourlyMap[hour] = append(hourlyMap[hour], d.Value)
    }
    
    var result []TrendData
    for hour, values := range hourlyMap {
        avg := 0.0
        for _, v := range values {
            avg += v
        }
        avg /= float64(len(values))
        
        result = append(result, TrendData{
            Timestamp: time.Unix(hour, 0),
            Value:     avg,
        })
    }
    
    return result
}
```

## 📊 권장 차트 타입

| 메트릭 카테고리 | 권장 차트 타입 | 집계 방법 |
|---------------|--------------|-----------|
| 용량 메트릭 | Area Chart | 1시간 평균 |
| 성능 메트릭 | Line Chart | 5분 평균 |
| 카운트 메트릭 | Bar Chart | 1시간 합계 |
| 비율 메트릭 | Percentage Chart | 1시간 평균 |
| 오류 메트릭 | Stacked Bar | 1시간 합계 |
| 상태 메트릭 | Status Timeline | 실시간 |

이러한 메트릭들을 조합하여 종합적인 Ceph 클러스터 7일 트렌드 대시보드를 구성할 수 있습니다.