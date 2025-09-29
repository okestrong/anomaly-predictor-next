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

## 참고사항
현재 백엔드 코드는 위 두 가지 사항을 모두 올바르게 적용하여 수정이 완료된 상태입니다.

---
*마지막 업데이트: 2025-09-26*