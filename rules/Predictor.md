# Predictor Guide

## 1. 장애 예측

### 개요
AI/ML 기반 장애 예측 시스템은 RAG(Retrieval-Augmented Generation) 시스템과 Prometheus 메트릭을 결합하여 12가지 카테고리의 장애를 예측합니다. 각 예측 카테고리별로 실시간 메트릭을 수집하고, LLM을 통해 지능형 분석 및 Time to Impact를 계산합니다.

### 데이터 수집 시간 범위
- **METRIC_WINDOW**: 1시간 (최근 메트릭 수집)
- **HISTORY_WINDOW**: 24시간 (추세 분석용)

---

## 2. 12개 장애 예측 카테고리 상세

### 2.1 OSD 장애 (OSD Failure)

**수집 데이터:**
- OSD 목록 및 상태 정보
- OSD 레이턴시 메트릭

**데이터 출처:**

| 데이터 | 출처 | API/PromQL |
|--------|------|------------|
| OSD 목록 | Prometheus (Predictor 메트릭) | `predict_osd_status{host,id,state}` |
| OSD 상태 (UP/IN) | Prometheus (Predictor 메트릭) | state label에서 파싱 ("up", "in" 포함 여부) |
| 레이턴시 | Prometheus (Ceph 메트릭) | `(sum(rate(ceph_osd_op_r_latency_sum[5m])) + sum(rate(ceph_osd_op_w_latency_sum[5m]))) / clamp_min(sum(rate(ceph_osd_op_r_latency_count[5m])) + sum(rate(ceph_osd_op_w_latency_count[5m])), 0.001)` |

**프롬프트 구조:**
```
=== OSD 장애 예측 ===

현재 메트릭:
- 위험도 점수: {riskScore} (0.0 ~ 1.0)
- 전체 OSD 개수: {totalOsds}개
- Down OSD: {downOsds}
- Out OSD: {outOsds}
- 평균 레이턴시: {avgLatency} ms
- 최대 레이턴시: {maxLatency} ms
- 레이턴시 임계값: 50 ms (기준치)

분석 요청:
현재 메트릭 값을 분석하여 다음만 간단명료하게 응답하세요:
1. 지금 이 위험도와 레이턴시가 의미하는 것 (2-3문장)
2. 현재 상태에서 주의해야 할 구체적인 사항 (1-2문장)
3. 당장 확인이 필요한 경우 체크 명령어 1-2개 (간단히)
4. 예상 장애 발생 시점 (현재 추세가 지속될 경우 몇 시간 후에 장애가 발생할지 숫자만 응답, 예: 72)

제외사항: OSD가 무엇인지, 일반적인 장애 원인, 이론적 설명, 모니터링 필요성 등 일반론은 생략
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
- 클러스터 전체 사용률 히스토리

**데이터 출처:**

| 데이터 | 출처 | API/PromQL |
|--------|------|------------|
| Pool 목록 | Ceph Manager API | `/api/pool` |
| Pool 오브젝트 카운트 | Prometheus (Predictor 메트릭) | `predict_pools_object_count{pool_name="..."}` |
| Pool 전체 용량 | Prometheus (Predictor 메트릭) | `predict_pools_usage_total_bytes{pool_name="..."}` |
| Pool 사용 용량 | Prometheus (Predictor 메트릭) | `predict_pools_usage_used_bytes{pool_name="..."}` |
| 클러스터 사용률 히스토리 | Prometheus (Ceph 메트릭) | `ceph_cluster_total_used_bytes / ceph_cluster_total_bytes * 100` (1시간) |

**프롬프트 구조:**
```
=== 용량 고갈 예측 ===

현재 메트릭:
- 위험도 점수: {riskScore}
- 전체 풀 개수: {totalPools}개
- 평균 사용률: {avgUsage}%
- 최고 사용률: {maxUsage}%
- Full Ratio 임계값: 85%

풀별 사용률:
- {poolName}: {usage}% (전체: {totalBytes}, 사용: {usedBytes})
[... 반복 ...]

분석 요청:
현재 용량 메트릭을 분석하여 다음만 간단명료하게 응답하세요:
1. 지금 이 사용률과 위험도가 의미하는 것 (2-3문장)
2. 용량 고갈 시점 예측 및 주의사항 (1-2문장)
3. 당장 확인이 필요한 경우 체크 명령어 1-2개 (간단히)
4. 예상 용량 고갈 시점 (현재 증가 추세가 지속될 경우 몇 시간 후에 용량이 부족할지 숫자만 응답, 예: 168)

제외사항: 용량 관리의 중요성, Full Ratio 개념 설명, 일반적인 용량 확장 방법 등 이론은 생략
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

**데이터 출처:**

| 데이터 | 출처 | PromQL |
|--------|------|--------|
| IOPS | Prometheus (Ceph 메트릭) | `sum(rate(ceph_osd_op_r_latency_count[5m])) + sum(rate(ceph_osd_op_w_latency_count[5m]))` |
| 레이턴시 | Prometheus (Ceph 메트릭) | `(sum(rate(ceph_osd_op_r_latency_sum[5m])) + sum(rate(ceph_osd_op_w_latency_sum[5m]))) / clamp_min(sum(rate(ceph_osd_op_r_latency_count[5m])) + sum(rate(ceph_osd_op_w_latency_count[5m])), 0.001)` |
| 처리량 | Prometheus (Ceph 메트릭) | `sum(rate(ceph_osd_op_r_out_bytes[5m])) + sum(rate(ceph_osd_op_w_in_bytes[5m]))` |

**프롬프트 구조:**
```
=== 성능 저하 예측 ===

현재 메트릭:
- 위험도 점수: {riskScore}
- 평균 레이턴시: {avgLatency} ms (기준: 50ms 이하)
- 평균 IOPS: {avgIops} (기준: 100 이상)
- 평균 처리량: {avgThroughput} MB/s
- 성능 기준: 레이턴시 < 50ms, IOPS > 100

분석 요청:
현재 성능 메트릭을 분석하여 다음만 간단명료하게 응답하세요:
1. 지금 이 레이턴시/IOPS/처리량이 의미하는 것 (2-3문장)
2. 성능 저하가 의심되는 경우 가능한 원인 (1-2문장)
3. 당장 확인이 필요한 경우 체크 명령어 1-2개 (간단히)
4. 예상 성능 장애 시점 (현재 추세가 지속될 경우 몇 시간 후에 심각한 성능 저하가 발생할지 숫자만 응답, 예: 48)

제외사항: 성능 지표란 무엇인지, 일반적인 최적화 방법, 튜닝 이론 등은 생략
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

**데이터 출처:**

| 데이터 | 출처 | API/PromQL |
|--------|------|------------|
| OSD 목록 | Prometheus (Predictor 메트릭) | `predict_osd_status{host,id,state}` |
| 클러스터 Health | Ceph Manager API | `/api/health/full` |

**프롬프트 구조:**
```
=== PG 불균형 예측 ===
위험도: {riskScore}, OSD 개수: {osdCount}, 클러스터 상태: {clusterStatus}

분석 요청: 현재 메트릭 기반으로 다음만 간단하게 응답
1. 지금 이 위험도가 의미하는 것 (2-3문장)
2. PG 분산 상태 확인이 필요한 이유 (1-2문장)
3. 체크 명령어 1-2개
4. 예상 문제 발생 시점 (현재 불균형이 지속될 경우 몇 시간 후에 심각한 문제가 발생할지 숫자만 응답, 예: 120)

제외사항: PG 개념 설명, 일반적인 rebalancing 방법 등 이론 생략
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

**데이터 출처:**

| 데이터 | 출처 | PromQL |
|--------|------|--------|
| 레이턴시 | Prometheus (Ceph 메트릭) | 동일 (OSD 레이턴시 재사용) |
| 처리량 | Prometheus (Ceph 메트릭) | 동일 (OSD 처리량 재사용) |

**프롬프트 구조:**
```
=== 네트워크 병목 예측 ===
위험도: {riskScore}, 평균 레이턴시: {avgLatency}ms, 평균 처리량: {avgThroughput}MB/s

분석 요청: 현재 네트워크 상태를 분석하여 다음만 간단하게 응답
1. 지금 이 레이턴시/처리량이 의미하는 것 (2-3문장)
2. 네트워크 병목이 의심되는 경우 체크 포인트 (1-2문장)
3. 확인 명령어 1-2개
4. 예상 네트워크 장애 시점 (현재 추세가 지속될 경우 몇 시간 후에 심각한 병목이 발생할지 숫자만 응답, 예: 24)

제외사항: 네트워크 기본 개념, 일반적인 최적화 이론 등 생략
```

**위험도 계산 로직:**
- 평균 레이턴시 (30ms 기준, 60%)
- 처리량 (50MB/s 기준, 40%)

---

### 2.6 메모리 부족 (Memory Shortage)

**수집 데이터:**
- OSD 목록
- 메모리 사용률 히스토리 (추정)

**데이터 출처:**

| 데이터 | 출처 | API/PromQL |
|--------|------|------------|
| OSD 목록 | Prometheus (Predictor 메트릭) | `predict_osd_status{host,id,state}` |

**프롬프트 구조:**
```
=== Ceph 클러스터 메모리 부족 예측 ===

현재 메트릭 분석:
- 위험도 점수: {riskScore} (0.0 ~ 1.0 범위)
- OSD 개수: {osdCount}개
- 메모리 사용 추세: 증가 경향 감지
- 예측 기준: OSD 및 MON 프로세스 메모리 부족 위험

분석 요청:
현재 메모리 상태를 분석하여 다음만 간단명료하게 응답하세요:
1. 지금 이 위험도가 의미하는 메모리 상태 (2-3문장)
2. 메모리 부족이 의심되는 경우 주의사항 (1-2문장)
3. 확인 명령어 1-2개
4. 예상 OOM 발생 시점 (현재 추세가 지속될 경우 몇 시간 후에 메모리 부족이 발생할지 숫자만 응답, 예: 36)

제외사항: 메모리 관리 개념, 일반적인 최적화 전략 등 이론 생략
```

**위험도 계산 로직:**
- Down OSD 비율 기반 간접 추정 (70%)
- 사용률 증가 추세 (30%)

---

### 2.7 리밸런싱 필요 (Rebalancing Needed)

**수집 데이터:**
- OSD 목록
- Pool 목록

**데이터 출처:**

| 데이터 | 출처 | API/PromQL |
|--------|------|------------|
| OSD 목록 | Prometheus (Predictor 메트릭) | `predict_osd_status{host,id,state}` |
| Pool 목록 | Ceph Manager API + Prometheus | `/api/pool` + `predict_pools_usage_*` |

**프롬프트 구조:**
```
=== 데이터 리밸런싱 필요 예측 ===
위험도: {riskScore}, OSD 개수: {osdCount}, 풀 개수: {poolCount}

분석 요청: 현재 상태를 분석하여 다음만 간단하게 응답
1. 지금 이 위험도가 의미하는 데이터 분산 상태 (2-3문장)
2. 리밸런싱이 필요한 경우 주의사항 (1-2문장)
3. 확인 명령어 1-2개
4. 예상 리밸런싱 시점 (현재 불균형이 지속될 경우 몇 시간 후에 리밸런싱이 필요할지 숫자만 응답, 예: 96)

제외사항: 리밸런싱 개념, 일반적인 전략 등 이론 생략
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

**데이터 출처:**

| 데이터 | 출처 | PromQL |
|--------|------|--------|
| OSD 목록 | Prometheus (Predictor 메트릭) | `predict_osd_status{host,id,state}` |
| IOPS | Prometheus (Ceph 메트릭) | `sum(rate(ceph_osd_op_r_latency_count[5m])) + sum(rate(ceph_osd_op_w_latency_count[5m]))` |
| 레이턴시 | Prometheus (Ceph 메트릭) | 동일 (OSD 레이턴시 재사용) |

**프롬프트 구조:**
```
=== OSD 핫스팟 예측 ===
위험도: {riskScore}, 의심 OSD: {hotspotOsds}, 평균 IOPS: {avgIops}

분석 요청: 현재 부하 상태를 분석하여 다음만 간단하게 응답
1. 지금 이 IOPS와 위험도가 의미하는 것 (2-3문장)
2. 핫스팟이 의심되는 경우 주의사항 (1-2문장)
3. 확인 명령어 1-2개
4. 예상 성능 저하 시점 (현재 부하가 지속될 경우 몇 시간 후에 심각한 성능 저하가 발생할지 숫자만 응답, 예: 12)

제외사항: 핫스팟 개념, 일반적인 부하분산 이론 등 생략
```

**위험도 계산 로직:**
- IOPS (1000 기준, 50%)
- 레이턴시 (50ms 기준, 50%)

---

### 2.9 클러스터 확장 (Cluster Expansion)

**수집 데이터:**
- Pool 목록
- 사용률 히스토리

**데이터 출처:**

| 데이터 | 출처 | API/PromQL |
|--------|------|------------|
| Pool 목록 | Ceph Manager API + Prometheus | `/api/pool` + `predict_pools_usage_*` |
| 사용률 히스토리 | Prometheus (Ceph 메트릭) | `ceph_cluster_total_used_bytes / ceph_cluster_total_bytes * 100` (24시간) |

**프롬프트 구조:**
```
=== 클러스터 확장 필요 예측 ===
위험도: {riskScore}, 현재 사용률: {currentUsage}%, 풀 개수: {poolCount}

분석 요청: 현재 용량 상태를 분석하여 다음만 간단하게 응답
1. 지금 이 사용률과 위험도가 의미하는 것 (2-3문장)
2. 확장이 필요한 경우 시점 예측 (1-2문장)
3. 확인 명령어 1-2개
4. 예상 확장 필요 시점 (현재 증가 추세가 지속될 경우 몇 시간 후에 확장이 필요할지 숫자만 응답, 예: 240)

제외사항: 확장 개념, 일반적인 용량 계획 이론 등 생략
```

**위험도 계산 로직:**
- 현재 사용률 (60%)
- 증가 추세 (40%)

---

### 2.10 SMART 디스크 장애 (SMART Disk Failure)

**수집 데이터:**
- OSD 목록

**데이터 출처:**

| 데이터 | 출처 | API/PromQL |
|--------|------|------------|
| OSD 목록 | Prometheus (Predictor 메트릭) | `predict_osd_status{host,id,state}` |

**프롬프트 구조:**
```
=== SMART 기반 디스크 장애 예측 ===
위험도: {riskScore}, 의심 OSD: {riskyOsds}

분석 요청: 현재 디스크 상태를 분석하여 다음만 간단하게 응답
1. 지금 이 위험도가 의미하는 디스크 상태 (2-3문장)
2. SMART 체크가 필요한 경우 주의사항 (1-2문장)
3. 확인 명령어 1-2개
4. 예상 디스크 장애 시점 (현재 추세가 지속될 경우 몇 시간 후에 디스크 장애가 발생할지 숫자만 응답, 예: 48)

제외사항: SMART 개념, 일반적인 장애 예방 이론 등 생략
```

**위험도 계산 로직:**
- Down OSD 비율 (50%)
- Out OSD 비율 (30%)

---

### 2.11 메트릭 디스크 장애 (Metric-based Disk Failure)

**수집 데이터:**
- OSD 목록
- 레이턴시
- IOPS

**데이터 출처:**

| 데이터 | 출처 | PromQL |
|--------|------|--------|
| OSD 목록 | Prometheus (Predictor 메트릭) | `predict_osd_status{host,id,state}` |
| 레이턴시 | Prometheus (Ceph 메트릭) | 동일 (OSD 레이턴시 재사용) |
| IOPS | Prometheus (Ceph 메트릭) | 동일 (IOPS 재사용) |

**프롬프트 구조:**
```
현재 메트릭: 위험도 {riskScore}, 성능 저하 OSD: {degradedOsds}, 평균 레이턴시: {avgLatency}ms

분석 요청:
현재 성능 메트릭을 분석하여 다음만 간단명료하게 응답하세요:
1. 지금 이 위험도와 레이턴시/성능이 의미하는 것 (2-3문장)
2. 현재 상태에서 주의해야 할 구체적인 사항 (1-2문장)
3. 당장 확인이 필요한 경우 디스크 I/O 성능 체크 명령어 1-2개 (간단히)
4. 예상 디스크 장애 시점 (현재 추세가 지속될 경우 몇 시간 후에 디스크 장애가 발생할지 숫자만 응답, 예: 60)

제외사항: 성능 메트릭이란 무엇인지, 일반적인 디스크 장애 진단 방법, 대응 전략 이론 등은 생략
```

**위험도 계산 로직:**
- Down OSD 비율 (40%)
- 레이턴시 (100ms 기준, 40%)
- IOPS (50 기준, 20%)

---

### 2.12 종합 분석 (Comprehensive Analysis)

**수집 데이터:**
- 전체 위험도 종합 (모든 카테고리 평균)

**데이터 출처:**
- 내부 계산 (다른 예측 결과 종합)

**프롬프트 구조:**
```
현재 메트릭: 전체 위험도 {avgRisk}, 클러스터 상태: {clusterStatus}, High Risk 항목: {highRiskCount}, Medium Risk 항목: {mediumRiskCount}

분석 요청:
현재 클러스터의 종합 상태를 분석하여 다음만 간단명료하게 응답하세요:
1. 지금 이 위험도와 상태가 의미하는 것 (2-3문장)
2. 현재 가장 주의해야 할 구체적인 영역 (1-2문장)
3. 당장 확인이 필요한 경우 체크 명령어 1-2개 (간단히)

제외사항: Ceph 클러스터란 무엇인지, 일반적인 모니터링 방법, 이론적 설명 등은 생략
```

**위험도 계산 로직:**
- 랜덤 생성 (0.45 ~ 0.75 범위)

---

## 3. LLM 응답 처리

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

## 4. RAG 시스템 연동

모든 예측 카테고리는 RAG Service를 통해 Squid 문서를 참조합니다:

```java
AskResponse ragResponse = ragService.ask(ragQuery, "squid");
```

- **RAG 모델**: Squid 버전 문서 기반
- **응답 활용**:
  - `ragResponse.getSummary()`: AI Analysis 텍스트
  - Time to Impact 파싱
  - 근본 원인 추출
  - 권장 조치사항 생성

---

## 5. 메트릭 수집 최적화

### Prometheus 쿼리 특징

1. **안전한 나누기**: `clamp_min(..., 0.001)` 사용으로 division by zero 방지
2. **5분 rate**: `rate(...[5m])` 사용으로 5분 평균 계산
3. **대체 쿼리**: 메트릭이 없을 경우 alternative query 자동 시도

### Ceph Manager API 캐싱

- `@Cacheable` 어노테이션으로 자주 조회되는 데이터 캐싱
- OSD 목록, Pool 목록, Cluster Health 등

---

## 6. 프롬프트 개선 원칙

모든 프롬프트는 다음 원칙을 따릅니다:

1. **현재 메트릭 값 명시**: 구체적인 숫자 포함
2. **3가지 핵심 요청**:
   - 현재 상태의 의미
   - 주의사항
   - 체크 명령어
3. **Time to Impact 판단**: LLM이 시간(hours) 숫자로 응답
4. **이론 배제**: 일반적/이론적 내용 명시적 제외
5. **간결함**: 2-3문장 제한

이를 통해 AI Analysis가 현재 상태에 집중한 실용적인 내용을 제공합니다.
