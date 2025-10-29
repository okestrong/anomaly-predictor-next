# Predictor-API 백엔드 수정시 주의사항

## 1. RestClient 사용 필수
- **predictor-api는 RestClient를 사용하도록 구성되어 있습니다**
- ❌ **RestTemplate 사용 금지** - 더 이상 사용하지 마세요
- ✅ **RestClient 사용 필수** - 모든 HTTP 요청은 RestClient를 통해 처리

```java
// ❌ 잘못된 예시 - RestTemplate 사용 금지
private final RestTemplate restTemplate;

// ✅ 올바른 예시 - RestClient 사용
private final RestClient cephRestClient;
```

## 2. Ceph API 인증 필수
- **Ceph API 호출시 반드시 auth token을 헤더에 포함해야 합니다**
- 직접 HTTP 요청을 보내지 말고, 인증 처리가 포함된 메서드를 사용하세요

### 참고할 인증 메서드
- `CephManagerService.executeWithAuth()` - 단일 객체 응답용
- `CephManagerService.executeWithAuthList()` - 리스트 응답용

```java
// ✅ 올바른 예시 - 인증이 포함된 메서드 사용
@SuppressWarnings("unchecked")
Map<String, Object> data = executeWithAuth("/api/cluster/status", Map.class, "cluster status");

@SuppressWarnings("unchecked")
List<Map<String, Object>> response = executeWithAuth("/api/pools", List.class, "pools list");
```

### 인증 처리 특징
- **자동 토큰 갱신**: 401 Unauthorized 발생시 자동으로 토큰 갱신 후 재시도
- **에러 처리**: 인증 실패시 적절한 로깅과 예외 처리
- **헤더 자동 설정**: Authorization 헤더가 자동으로 설정됨

## 3. Ceph Squid 버전 API 호출 필수
- **Ceph 버전은 Squid입니다**
- ✅ **올바른 API 엔드포인트 확인**: [Ceph Squid MGR API 문서](https://docs.ceph.com/en/squid/mgr/ceph_api/)를 참고하여 정확한 URL 사용
- ❌ **404 에러 방지**: 웹 검색을 통해 Squid 버전에서 지원하는 API 엔드포인트만 사용

```java
// ✅ Ceph Squid에서 지원하는 엔드포인트 예시
cephApiUtil.executeWithAuth("/api/health/minimal", String.class, "cluster health");
cephApiUtil.executeWithAuth("/api/osd/stat", String.class, "OSD stats");
cephApiUtil.executeWithAuth("/api/pg/stat", String.class, "PG stats");
cephApiUtil.executeWithAuth("/api/df", String.class, "cluster capacity");
cephApiUtil.executeWithAuth("/api/pool", String.class, "pool list");
```

## 4. CephApiUtil 사용 필수
- **모든 Ceph API 요청은 CephApiUtil을 통해 처리**
- 인증, 에러 처리, 로깅이 모두 포함되어 있음

```java
// ✅ 올바른 사용법
private final CephApiUtil cephApiUtil;

String response = cephApiUtil.executeWithAuth("/api/endpoint", String.class, "description");
```

## 5. Predictor 프로젝트 API 활용
- **Ceph 기본 API로 가져올 수 없는 정보는 predictor 프로젝트 API 사용**
- predictor 프로젝트는 Ceph에 custom 서비스로 등록됨
- predictor API도 CephApiUtil을 통해 호출 가능

### 참고 문서
- `predictor/rules/Guide.md`: predictor 프로젝트 가이드
- `predictor/rules/API.md`: predictor API 문서

```java
// ✅ predictor API 호출 예시
cephApiUtil.executeWithAuth("/api/predict/osd/latency", String.class, "OSD latency");
cephApiUtil.executeWithAuth("/api/predict/network/health", String.class, "network health");
cephApiUtil.executeWithAuth("/api/predict/smart-info", String.class, "SMART info");
```

## 6. PrometheusService 사용 필수
- **모든 Prometheus 메트릭 조회는 PrometheusService 사용**
- `predict_` 로 시작하는 커스텀 메트릭 활용 권장

```java
// ✅ 올바른 사용법
private final PrometheusService prometheusService;

// 기본 Ceph 메트릭
List<Double> values = prometheusService.extractTimeSeries("ceph_osd_op_r", Duration.ofHours(1), "1m");

// 커스텀 predictor 메트릭
List<Double> anomalies = prometheusService.extractTimeSeries("predict_anomaly_score", Duration.ofHours(1), "1m");
```

## 주요 API 패턴

### 데이터 조회 패턴
```java
// 1. Ceph 기본 API 사용
String response = cephApiUtil.executeWithAuth("/api/health/minimal", String.class, "health check");
JsonNode data = objectMapper.readTree(response);

// 2. Predictor API 사용 (고급 분석 데이터)
String predictorResponse = cephApiUtil.executeWithAuth("/api/predict/osd/latency", String.class, "latency analysis");

// 3. Prometheus 메트릭 사용 (시계열 데이터)
List<Double> metrics = prometheusService.extractTimeSeries("ceph_osd_utilization", Duration.ofHours(1), "5m");
```

## 참고사항
현재 백엔드 코드는 위 모든 사항을 올바르게 적용하여 수정이 완료된 상태입니다.

---
*마지막 업데이트: 2025-09-30*