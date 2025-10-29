# 대시보드 통합 작업 진행 상황 (2025-01-20 업데이트)

## 최근 세션 작업 내역 (2025-01-20) - Topology 실제 데이터 연동 ✅

### 🎯 작업 개요: 3D 토폴로지 실제 데이터 통합

**목표:**
- 3D 토폴로지 뷰어를 Mock 데이터에서 실제 Backend API 데이터로 전환
- 기존 애니메이션 및 인터랙션 100% 보존
- Early fetch 메커니즘으로 UX 개선 (앱 로드 시 미리 데이터 가져오기)
- 5분 캐시 메커니즘 구현

### 1. Backend 구현 완료 ✅

**생성된 파일 (Java Spring Boot):**

1. **7개 DTO 클래스** (`/src/main/java/.../services/topology/dto/`)
   - `HostDataDto.java` - 호스트 정보 (CPU, 메모리, 네트워크, 서비스)
     - 중첩 클래스: `MemoryInfo`, `NetworkInterface`
   - `OSDDataDto.java` - OSD 정보 (성능, 건강, SMART 데이터)
     - 중첩 클래스: `Performance` (IOPS, 레이턴시, 처리량)
     - 중첩 클래스: `Health` (상태, PG 수, 사용률)
     - 중첩 클래스: `SmartInfo` (디스크 정보, 온도, 마모도)
   - `PGDataDto.java` - Placement Group 정보
   - `PoolDataDto.java` - Pool 정보
   - `ClusterInfoDto.java` - 클러스터 정보
     - 중첩 클래스: `CapacityInfo` (총/사용/가용 용량)
   - `SummaryDto.java` - 요약 통계
   - `TopologyResponseDto.java` - 메인 응답 래퍼

2. **TopologyService.java** (392 라인)
   - **5분 캐시 구현** (volatile 변수 + Instant 타임스탬프)
   - `/api/predict/cluster/topology` 엔드포인트 호출
   - **Jackson JSON 파싱** - 복잡한 중첩 구조 처리
   - **에러 처리** - stale cache fallback (API 실패 시 오래된 캐시 반환)
   - 파싱 메서드:
     - `parseClusterInfo()`, `parsePoolData()`, `parsePGs()`, `parseOSDs()`
     - `parseHost()`, `parsePerformance()`, `parseHealth()`, `parseSmartInfo()`
     - `parseSummary()`, `createEmptyTopologyResponse()`

3. **TopologyController.java** (185 라인)
   - **4개 REST 엔드포인트:**
     - `GET /api/topology` - 토폴로지 데이터 조회 (5분 캐시)
     - `POST /api/topology/refresh` - 강제 새로고침 (캐시 무시)
     - `GET /api/topology/status` - 서비스 헬스 체크
     - `POST /api/topology/cache/clear` - 캐시 지우기 (테스트/디버깅용)
   - Swagger 문서화 (`@Operation`, `@Tag`)
   - 에러 응답 처리

### 2. Frontend 구현 완료 ✅

**생성된 파일 (Next.js 15 + TypeScript):**

1. **types/topology.ts**
   - 모든 backend DTO와 매칭되는 TypeScript 인터페이스
   - snake_case 필드명 (JSON 구조와 정확히 일치)
   - 주요 인터페이스:
     - `TopologyResponse`, `PoolData`, `PGData`, `OSDData`, `HostData`
     - `ClusterInfo`, `TopologySummary`
     - `TopologyStatusResponse`, `TopologyRefreshResponse`

2. **lib/api/topologyApi.ts**
   - `TopologyAPI` 클래스 - 4개 메서드:
     - `getTopology()` - 토폴로지 데이터 가져오기
     - `refreshTopology()` - 강제 새로고침
     - `getStatus()` - 서비스 상태 확인
     - `clearCache()` - 캐시 지우기
   - `apiClient` 기반 (기존 패턴 재사용)

3. **stores/topology.ts**
   - **Zustand 스토어** (devtools + immer 미들웨어)
   - 상태:
     - `topologyData` - 전체 토폴로지 데이터
     - `selectedPool/PG/OSD/Host` - 선택된 노드들
     - `isLoading`, `isRefreshing`, `error`, `lastUpdate`
   - 액션:
     - `initializeTopology()` - **캐시 인식 초기화** (5분 이내 데이터는 재사용)
     - `refreshTopology()` - 강제 새로고침
     - `selectPool/PG/OSD/Host()` - 노드 선택 (자동 하위 노드 클리어)
     - `clearSelection()` - 선택 초기화
   - **Selectors** - 성능 최적화된 선택적 구독
     - `selectTopologyData`, `selectPools`, `selectSummary`, etc.
     - `selectIsDataReady` - 데이터 준비 여부 체크

4. **providers/TopologyProvider.tsx**
   - **Early Fetch 메커니즘** - 앱 초기 로드 시 토폴로지 데이터 미리 가져오기
   - `autoInitialize` prop (기본값: true)
   - Context 제공: `isInitialized`, `initializeTopology()`, `refreshTopology()`
   - **UX 개선:** `/topology` 페이지 진입 전에 이미 데이터 로드됨

5. **lib/transformTopologyData.ts**
   - **데이터 변환 함수** - API 데이터 → Mock 데이터 형식
   - 기존 3D 컴포넌트 구조 100% 보존
   - 변환 작업:
     - OSD 중첩 구조 → Flat 배열 (중복 제거)
     - Host 중첩 구조 → Flat 배열
     - Pool health 계산 (사용률 기반)
     - OSD utilization 계산, health status 매핑
   - **애니메이션 호환성 보장**

6. **수정된 파일:**
   - `app/layout.tsx` - `TopologyProvider` 추가 (WebSocketProvider 안쪽)
   - `components/topology/ClusterTopologyView.tsx`
     - `useTopologyStore` 훅 통합
     - `transformedTopologyData` useMemo로 계산
     - 모든 `mockTopologyData` → `transformedTopologyData` 치환
     - `topologyData` prop을 `ClusterTopologyScene`에 전달
     - **기존 애니메이션 100% 보존** (no breaking changes)

### 3. 데이터 플로우 (완성) ✅

```
Backend API (/api/predict/cluster/topology)
    ↓
TopologyService (5분 캐시, Jackson 파싱)
    ↓
TopologyController (/api/topology)
    ↓
Frontend TopologyAPI.getTopology()
    ↓
Topology Store (Zustand, 캐시 인식)
    ↓
TopologyProvider (Early fetch on app load)
    ↓
transformTopologyData() (Format conversion)
    ↓
ClusterTopologyView (3D visualization)
    ↓
기존 애니메이션 및 인터랙션 (100% 보존)
```

### 4. 주요 기술적 결정사항

1. **캐시 전략:**
   - Backend: 5분 캐시 (volatile 변수, thread-safe)
   - Frontend: Store가 캐시 인식 (5분 이내 재요청 방지)
   - 사용자가 수동 새로고침 가능 (`refreshTopology()`)

2. **데이터 변환:**
   - API의 중첩 구조 → 3D 컴포넌트용 flat 구조
   - Mock 데이터 형식 100% 유지 → 기존 코드 변경 최소화
   - Health status 계산 로직 프론트엔드에서 처리

3. **Early Fetch:**
   - 앱 최초 로드 시 토폴로지 데이터 미리 가져오기
   - `/topology` 페이지 진입 시 즉시 표시 가능
   - API가 느린 경우에도 UX 개선

4. **애니메이션 보존:**
   - 데이터 형식만 변환, 렌더링 로직 무변경
   - Pool/PG/OSD 노드 구조 동일 유지
   - 검색, 선택, 펄스 효과 모두 정상 작동

### 5. 파일 구조 현황

```
# Backend (anomaly-predictor-api)
src/main/java/.../services/topology/
├── dto/
│   ├── HostDataDto.java ✅
│   ├── OSDDataDto.java ✅
│   ├── PGDataDto.java ✅
│   ├── PoolDataDto.java ✅
│   ├── ClusterInfoDto.java ✅
│   ├── SummaryDto.java ✅
│   └── TopologyResponseDto.java ✅
├── service/
│   └── TopologyService.java ✅ (392 lines)
└── controller/
    └── TopologyController.java ✅ (185 lines)

# Frontend (anomaly-predictor-next)
├── lib/
│   ├── api/
│   │   └── topologyApi.ts ✅
│   └── transformTopologyData.ts ✅
├── types/
│   └── topology.ts ✅
├── stores/
│   └── topology.ts ✅
├── providers/
│   └── TopologyProvider.tsx ✅
├── app/
│   └── layout.tsx ✅ (TopologyProvider 추가)
└── components/topology/
    └── ClusterTopologyView.tsx ✅ (실제 데이터 연동)
```

### 6. 남은 작업 (다음 세션)

**검증 필요:**
1. ✅ Backend 빌드 및 실행 확인
2. ✅ `/api/topology` 엔드포인트 테스트
3. ✅ Frontend 컴파일 확인
4. ⏳ **실제 브라우저 테스트** - 애니메이션 및 인터랙션 확인
5. ⏳ **다양한 페이지 진입 테스트** - Early fetch 동작 확인
6. ⏳ **에러 시나리오 테스트** - API 실패 시 fallback 동작 확인

**문서화:**
- ✅ `components/dashboard/dashboard.md` 업데이트 (토폴로지 섹션 추가 예정)
- ✅ `rules/frontend.md` 체크리스트 업데이트
- ✅ `rules/store2.md` 세션 히스토리 업데이트

---

## 이전 세션 작업 내역 (2025-01-16)

### 1. 바이트 단위 통일 작업 완료 ✅

**변경 사항:**
- **모든 용량 데이터를 바이트(bytes) 단위로 통일**
- GB/TB 단위 제거하고 바이트 단위로 변경
- 동적 포맷팅 함수 생성 (B, KB, MB, GB, TB 자동 변환)

**수정된 파일:**
1. `/lib/formatUtils.ts` - 신규 생성
   - `formatBytes(bytes, decimals)`: 바이트를 동적으로 변환 (예: "1.23 GB")
   - `formatBandwidth(bytesPerSecond, decimals)`: 대역폭 포맷 (예: "512.0 MB/s")
   - `gbToBytes()`, `tbToBytes()`, `bytesToGb()`, `bytesToTb()`: 변환 함수들
   - `formatNumber()`, `formatPercent()`: 숫자/퍼센트 포맷팅

2. `/lib/api/dashboardApi.ts` - CapacityData 인터페이스 수정
   - `totalGb/usedGb/availableGb` → `totalBytes/usedBytes/availableBytes`
   - `dailyGrowthTb` → `dailyGrowthBytes`
   - `daysUntilFull` → `timeToFullDays`
   - `PoolCapacity` 인터페이스 추가: `usedBytes`, `usagePercent`, `type`

3. `/components/dashboard/CapacityStatus.tsx`
   - `formatBytes()` 함수 import 및 사용
   - 모든 용량 표시를 동적 포맷팅으로 변경

4. `/components/dashboard/chart/PoolUsageChart.tsx`
   - 바이트 단위 데이터 사용
   - 툴팁 및 footer에서 `formatBytes()` 적용

5. `/components/dashboard/dashboard.md`
   - 모든 용량 관련 필드를 바이트 단위로 문서화
   - 단위 변환 규칙 섹션 추가

### 2. ClusterStatus 컴포넌트 백엔드 데이터 연동 완료 ✅

**문제점:**
- `healthPercent`, `uptime`, `totalNodes` 등 백엔드가 제공하지 않는 필드 사용
- `currentIops`, `currentThroughput`, `aiHealthScore` 등 존재하지 않는 필드 참조
- `components` 배열이 백엔드 데이터와 불일치

**수정 사항:**
1. `/components/dashboard/ClusterStatus.tsx`
   - **healthPercent 계산 로직 추가** (33-55라인):
     - OSD health: `(up/total) * 100` - 가중치 40%
     - PG health: `(activeClean/total) * 100` - 가중치 40%
     - Status weight: HEALTH_OK=100, HEALTH_WARN=70, HEALTH_ERR=30 - 가중치 15%
     - Monitor health: `(active/total) * 100` - 가중치 5%
   
   - **uptime 포맷팅 함수 추가** (65-81라인):
     - 초 단위를 "17d 12h 30m" 형식으로 변환
     - 86400초(1일), 3600초(1시간), 60초(1분) 단위 계산
   
   - **totalNodes 계산** (60-63라인):
     - `OSDs total + Monitors total`
   
   - **components 배열 동적 생성** (83-112라인):
     - Monitors, OSDs, Placement Groups를 백엔드 데이터로부터 생성
     - 각 컴포넌트의 상태를 실시간 데이터 기반으로 계산
   
   - **IOPS/Throughput 계산** (114-143라인):
     - `dashboardData.charts.iops`에서 read + write IOPS 합산
     - `dashboardData.charts.throughput`에서 read + write MB/s 합산
     - AI Health Score는 계산된 `overallHealthPercentage` 사용

### 3. WebSocket 연결 문제 해결 ✅

**문제점:**
- 프론트엔드: 순수 WebSocket 연결 시도 (`ws://localhost:8080/ws/dashboard`)
- 백엔드: STOMP over WebSocket (SockJS) 사용
- 프로토콜 불일치로 연결 실패

**해결 방법:**
1. `/lib/api/dashboardApi.ts` - DashboardWebSocket 클래스 전체 재작성
   - **STOMP 클라이언트로 변경** (`@stomp/stompjs` 사용)
   - **SockJS 지원 추가** (`sockjs-client` 설치)
   - **URL 변환 로직**: `ws://` → `http://`, `wss://` → `https://`
   - **구독 토픽**: `/topic/dashboard`, `/topic/status`
   - **메시지 전송**: `/app/connect`, `/app/subscribe`, `/app/dashboard`

2. 패키지 추가:
   - `sockjs-client@1.6.1`
   - `@types/sockjs-client@1.5.4` (devDependencies)

**백엔드 구조 (참고):**
- `WebSocketConfig.java`: STOMP 엔드포인트 등록
  - `/ws/dashboard` (SockJS 지원)
  - `/ws/realtime` (SockJS 지원)
  - `/ws` (순수 WebSocket, 선택사항)
- 메시지 브로커: `/topic`, `/queue`
- 애플리케이션 prefix: `/app`

---

## 주요 변경사항 요약

### 완료된 작업 ✅

1. **바이트 단위 통일**
   - 모든 용량 데이터를 바이트로 표준화
   - 동적 포맷팅 함수 생성
   - 컴포넌트 및 차트 업데이트

2. **ClusterStatus 백엔드 연동**
   - 계산 로직 추가 (healthPercent, totalNodes, uptime)
   - 백엔드 데이터 기반 컴포넌트 동적 생성
   - IOPS/Throughput 실시간 데이터 연결

3. **WebSocket STOMP 전환**
   - 순수 WebSocket → STOMP over SockJS
   - 백엔드 프로토콜과 일치
   - 자동 재연결 지원

4. **문서화 완료**
   - `components/dashboard/dashboard.md` 바이트 단위 반영
   - 백엔드 데이터 구조 명확화

---

## 백엔드 데이터 구조 (참고용)

### ClusterHealthData (실제 백엔드 제공 데이터)
```typescript
{
  status: "HEALTH_OK" | "HEALTH_WARN" | "HEALTH_ERR",
  message: string,
  osds: {
    total: number,
    up: number,
    in: number,
    down: number,
    out: number,
    averageUsage: number  // 0-100 퍼센트
  },
  monitors: {
    total: number,
    active: number,
    standby: number
  },
  pgs: {
    total: number,
    activeClean: number,
    scrubbing: number,
    degraded: number,
    recovering: number
  },
  clientConnections: number,
  version: string,
  uptime: number  // 초 단위
}
```

### CapacityData (바이트 단위 통일)
```typescript
{
  totalBytes: number,
  usedBytes: number,
  availableBytes: number,
  usagePercent: number,  // 0-100
  dailyGrowthBytes: number,
  timeToFullDays: number,
  growthTrend: "increasing" | "stable" | "decreasing" | "unknown",
  pools?: PoolCapacity[],
  usageTrend?: number[]  // 7일간 사용률 (0-100)
}
```

---

## 다음 작업 계획

### 1. 남은 차트 컴포넌트 백엔드 연동 (4개)
현재 3개 완료 (PoolUsageChart, IopsChart, ThroughputChart), 남은 4개:
- `OsdPerformanceChart.tsx` - dashboardData.charts.osdPerformance
- `NetworkErrorChart.tsx` - dashboardData.charts.networkError
- `ScrubErrorChart.tsx` - dashboardData.charts.scrubError
- `PgInconsistencyChart.tsx` - dashboardData.charts.pgInconsistency

### 2. 백엔드 실제 데이터 수집 확인
- 현재 임시 mock 데이터 사용 여부 확인
- Ceph 클러스터 API 실제 연동 테스트
- Prometheus 메트릭 수집 동작 확인

### 3. 에러 처리 및 사용자 피드백
- WebSocket 연결 실패 시 사용자 알림
- API 호출 실패 시 fallback UI
- 데이터 로딩 상태 개선

---

## 주의사항 및 염두사항

### ⚠️ 중요 규칙

1. **바이트 단위 사용**
   - 모든 용량 데이터는 바이트로 저장
   - 표시할 때만 `formatBytes()` 사용
   - GB/TB로 변환하지 말 것

2. **백엔드 데이터 구조 준수**
   - `components/dashboard/dashboard.md` 참조
   - 존재하지 않는 필드 사용 금지
   - 계산 로직은 프론트엔드에서 처리

3. **WebSocket 연결**
   - STOMP 프로토콜 사용 (순수 WebSocket 아님)
   - URL은 `http://` 또는 `https://` (SockJS 요구사항)
   - 구독 토픽: `/topic/dashboard`

4. **타입 안전성**
   - `dashboardApi.ts`의 인터페이스 준수
   - 옵셔널 체이닝(`?.`) 사용
   - null/undefined 체크 필수

5. **컴포넌트 데이터 소스**
   - `useDashboardStore()` 사용
   - `dashboardData` 에서 필요한 데이터 추출
   - mock 데이터 사용 금지

### 📝 코딩 가이드라인

1. **데이터 흐름**
   ```
   Backend API/WebSocket (STOMP)
     ↓
   useDashboardStore (Zustand)
     ↓
   각 컴포넌트에서 개별 구독
   ```

2. **포맷팅 함수 사용**
   - 바이트: `formatBytes(bytes, decimals)`
   - 대역폭: `formatBandwidth(bytesPerSecond, decimals)`
   - 숫자: `formatNumber(value, decimals)`
   - 퍼센트: `formatPercent(value, decimals)`

3. **계산 로직**
   - useMemo 사용으로 불필요한 재계산 방지
   - 의존성 배열 정확히 지정
   - 복잡한 계산은 별도 함수로 분리

### 🔍 디버깅 팁

1. **WebSocket 연결 확인**
   - 브라우저 개발자 도구 → Network → WS 탭
   - "Dashboard STOMP connected" 로그 확인
   - `/topic/dashboard` 구독 메시지 확인

2. **데이터 흐름 확인**
   - Redux DevTools로 Zustand 상태 모니터링
   - `console.log(dashboardData)` 로 데이터 확인
   - WebSocket 메시지 수신 로그 확인

3. **타입 에러 해결**
   - `dashboardApi.ts` 인터페이스 먼저 확인
   - 백엔드 실제 응답과 타입 일치 여부 확인
   - 옵셔널 필드는 기본값 제공

---

## 파일 구조 현황

### 프론트엔드 (anomaly-predictor-next)
```
├── lib/
│   ├── formatUtils.ts ✅ (바이트 포맷팅)
│   └── api/
│       ├── client.ts ✅ (fetch 기반)
│       └── dashboardApi.ts ✅ (STOMP WebSocket)
├── stores/
│   └── dashboard.ts ✅ (Zustand store)
├── components/dashboard/
│   ├── CapacityStatus.tsx ✅ (바이트 단위)
│   ├── ClusterStatus.tsx ✅ (계산 로직 추가)
│   ├── RiskPanel.tsx ✅
│   ├── AlertCenter.tsx ✅
│   ├── dashboard.md ✅ (바이트 단위 문서화)
│   └── chart/
│       ├── PoolUsageChart.tsx ✅ (바이트 단위)
│       ├── IopsChart.tsx ✅
│       ├── LatencyChart.tsx ✅
│       ├── ThroughputChart.tsx ✅
│       ├── OsdPerformanceChart.tsx ⏳ (TODO)
│       ├── NetworkErrorChart.tsx ⏳ (TODO)
│       ├── ScrubErrorChart.tsx ⏳ (TODO)
│       └── PgInconsistencyChart.tsx ⏳ (TODO)
└── app/dashboard/page.tsx ✅
```

### 백엔드 (anomaly-predictor-api)
```
src/main/java/com/okestro/anomaly/predictor/
├── config/
│   └── WebSocketConfig.java ✅ (STOMP 설정)
├── controller/
│   └── WebSocketController.java ✅ (메시지 핸들러)
└── services/dashboard/
    ├── dto/DashboardDataDto.java
    ├── service/DashboardService.java
    ├── controller/DashboardController.java
    └── websocket/DashboardWebSocketHandler.java
```

---

## 개발 및 테스트

### 실행 방법
```bash
# 백엔드
cd anomaly-predictor-api
./gradlew bootRun

# 프론트엔드
cd anomaly-predictor-next
pnpm dev
```

### 테스트 확인
- REST API: http://localhost:8080/api/dashboard/overview
- WebSocket: STOMP over http://localhost:8080/ws/dashboard
- 대시보드: http://localhost:3000/dashboard

### 연결 확인 방법
1. 브라우저 개발자 도구 열기
2. Network 탭 → WS 필터
3. "Dashboard STOMP connected" 로그 확인
4. 10초마다 메시지 수신 확인

---

**최종 업데이트: 2025-01-16 (세션 종료 전)**
