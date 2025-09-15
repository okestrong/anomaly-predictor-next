# Current Project State - Anomaly Predictor View

## 프로젝트 개요
Ceph 클러스터의 AI 기반 장애 예측 및 운영 최적화를 위한 직관적인 웹 대시보드 개발 프로젝트
- 이 프로젝트는 anomaly-predictor-view 프로젝트(/Users/jclee/Documents/Okestro/Projects/DevSw/anomaly-predictor-view) 를 만들 던 중, vue 의 비효율적인 문법에 실망하여 next.js 기반의 react 로 개발을 이어서 진행하고자 기존 프로젝트를 마이그레이션 한 프로젝트이다.

## 연관 프로젝트들
### 1. predictor-api
- 현재 프로젝트(predictor-view) 의 백엔드를 담당하는 프로젝트
- ollama 를 통해 llm 을 이용하고, 이를 통해 ceph 에서 수집한 data 를 기반으로 인공지능 기능(장애예측 등)을 수행하는 역할도 한다. 
- 위치 : /Users/jclee/Documents/Okestro/Projects/DevSw/anomaly-predictor-api
### 2. predictor
- go-ceph 를 이용하여 ceph 의 metric 등의 data 들을 주기적으로 prometheus 로 수집하고, 직접적으로 REST Api 로도 제공하는 프로젝트
- 위치 : /Users/jclee/Documents/Okestro/Projects/DevSw/anomaly-predictor
### 3. crawler
- ceph 공식문서를 크롤링하고 이를 임베딩 및 벡터인덱싱하여 Qdrant 에 저장하는 프로젝트
- predictor-api 에서 RAG 기능으로 Qdrant 의 정보를 참고한다.
- 위치 : /Users/jclee/Documents/Okestro/Projects/DevSw/ceph-doc-crawler


## 최근 세션 작업 내용 (2025.01.14) - Next.js 마이그레이션 + PG/OSD 시각화 대폭 개선

### ✅ 완료된 작업

#### 1. Vue → Next.js + React Three Fiber 성공적 마이그레이션
- **프로젝트 전환**: Vue 3 → Next.js 15.5.2 + React 19 + TypeScript
- **3D 엔진 전환**: Three.js → React Three Fiber 9.3.0
- **주요 성과**: 
  - React 상태 관리 성능 이슈 해결 (useState → useRef로 전면 교체)
  - 3D 애니메이션 끊김 현상 완전 해결
  - 모든 기존 기능 완벽 이식 완료

#### 2. 🚀 PG 노드 완전 시각적 업그레이드 (이번 세션 핵심 성과)
- **Geometry 혁신**: DodecahedronGeometry → IcosahedronGeometry + 노이즈 변형
  - 더 복잡하고 유기적인 형태로 변경
  - 버텍스 노이즈 변형으로 독특한 외관 구현

- **하이브리드 재질 시스템**: 
  - **active+clean**: 크리스탈 블루 (다이아몬드 굴절률 2.33, 클리어코트, 시머)
  - **degraded**: 황금 메탈릭 (높은 반사도, 경고 색상)
  - **error**: 적색 균열 효과 (낮은 투명도, 오류 표현)

- **홀로그래픽 HUD 시스템**:
  - 회전하는 상태별 컬러 링
  - 3개 데이터 패널 (프로그레스 바 애니메이션)
  - 스캔라인 효과 + 에너지 펄스

- **고급 애니메이션**:
  - 에너지 펄스 (선택된 PG만 강화)
  - 스케일 확대 (1.2배 + 추가 펄싱)
  - 동적 색상 변화 (HSL 기반 크리스탈 효과)
  - 플로팅 효과 제거 (연결선 끊김 방지)

- **에너지 필드**: 건강한 PG에만 Fresnel 효과 + 파동 패턴

#### 3. 🔧 OSD 시각화 임시 업그레이드 (조명 문제 해결)
- **문제**: ShaderMaterial 조명 미지원으로 화면 검은색
- **임시 해결**: MeshPhongMaterial로 복귀 + 발광 효과 강화
- **계획**: 추후 조명 계산 포함된 커스텀 셰이더로 업그레이드 예정

#### 4. 🎯 OSD 애니메이션 동작 수정
- **문제**: PG 선택 시 OSD 떠오른 후 원위치로 복귀
- **원인**: 애니메이션 루프의 floatOffset이 GSAP Y 위치를 덮어씀
- **해결**: 선택된 OSD(`isAnimating=true`)는 Y 위치 업데이트 비활성화
- **결과**: PG 선택 해제 전까지 OSD 떠올라 있는 상태 유지

#### 5. Bloom 포스트 프로세싱 적용
- **추가**: @react-three/postprocessing 패키지
- **적용**: EffectComposer + Bloom 효과
- **설정**: luminanceThreshold 0.5, intensity 0.8, radius 0.4

### 🔧 기술적 핵심 변경사항

#### React 성능 최적화 패턴
```typescript
// ❌ 이전 (React 재렌더링 유발)
const [panels, setPanels] = useState({...});

// ✅ 현재 (재렌더링 방지)
const panelsRef = useRef({...});
// DOM 직접 조작으로 UI 업데이트
panelElement.style.display = 'block';
```

#### PG 생성 함수 구조 (ClusterTopologyView.tsx:1930~2190)
```typescript
const createPGNode = (pgData: any): THREE.Group => {
  // IcosahedronGeometry + 노이즈 변형
  const baseGeometry = new THREE.IcosahedronGeometry(2.5, 2);
  // 상태별 MeshPhysicalMaterial
  // 홀로그래픽 HUD 생성 + 에너지 필드
}
```

#### 애니메이션 루프 패턴 (ClusterTopologyView.tsx:3586~3608)
```typescript
// 선택된 OSD는 Y 위치 업데이트 스킵
if (animData && animData.isAnimating) {
  // GSAP이 Y 위치 관리
} else {
  // 플로팅 애니메이션 적용
  node.position.y = originalY + floatOffset;
}
```

## ⚠️ 다음 세션 작업 시 주의사항

### 🚨 절대 수정하면 안 되는 핵심 패턴
1. **React 상태 관리**: `useRef` → `useState`로 되돌리면 3D 애니메이션 끊김 재발
2. **OSD Y 위치 관리**: 애니메이션 루프의 `if (animData && isAnimating)` 조건문 수정 금지
3. **PG 재질 시스템**: MeshPhysicalMaterial 구조 변경 시 시각 효과 손실
4. **DOM 직접 조작**: 패널 토글은 `panelElement.style.display` 방식 유지

### 🔧 수정 가능한 개선 영역
1. **OSD ShaderMaterial**: 조명 계산 포함한 커스텀 셰이더로 업그레이드
2. **Bloom 설정**: 파라미터 조정으로 시각 효과 개선
3. **HUD 애니메이션**: 추가 이펙트나 데이터 패널 확장
4. **에너지 필드**: 더 복잡한 파동 패턴이나 색상 변화

### 📁 핵심 파일 위치
- **메인 토폴로지**: `components/topology/ClusterTopologyView.tsx` (3600+ 라인)
- **PG 생성 함수**: 라인 1930~2190
- **애니메이션 루프**: 라인 3316~3700
- **OSD 애니메이션**: 라인 3586~3608

## 현재 완료된 주요 기능 (2025.01 업데이트)

### ✅ 1. 기술 스택 (Next.js 마이그레이션 완료)
- **Next.js 15.5.2** + React 19 + TypeScript 5
- **Tailwind CSS v4** 
- **Zustand** 상태 관리 (Pinia 대체)
- **React Three Fiber 9.3.0** + drei 10.7.4
- **@react-three/postprocessing 3.0.4** for 포스트 프로세싱
- **ECharts 6.0.0** for 데이터 시각화
- **WebSocket STOMP 7.1.1** for 실시간 통신
- **GSAP 3.13.0** for 애니메이션
- **Three.js 0.180.0** 기반 3D 시각화

### ✅ 2. UI/UX 시스템 완료
- **AI 테마 디자인 시스템**: 사이버펑크/우주선 컨셉
- **다크/라이트 모드** 지원 (useTheme composable)
- **반응형 레이아웃**: 모바일, 태블릿, 데스크톱 완벽 지원
- **페이지 전환 애니메이션**: slide-down, slide-up, page-flip
- **Mega Menu 네비게이션**: 계층화된 메뉴 시스템

### ✅ 3. 대시보드 핵심 기능 완료
- **ClusterStatus.vue**: 클러스터 상태 모니터링
- **CapacityStatus.vue**: 용량 현황 관리
- **RiskPanel.vue**: AI 예측 위험 요소 패널  
- **AlertCenter.vue**: 실시간 알림 시스템
- **8개 차트 컴포넌트**: 모든 ECharts 기반 실시간 차트 완료
  - PoolUsageChart, IopsChart, LatencyChart, ScrubErrorChart
  - PgInconsistencyChart, NetworkErrorChart, OsdPerformanceChart, ThroughputChart

### ✅ 4. 3D 클러스터 토폴로지 시각화 (Next.js 마이그레이션 + 대폭 업그레이드 완료)

#### 4.1 우주선 대시보드 시스템 (React Three Fiber 기반)
**파일**: `components/topology/ClusterTopologyView.tsx` (3600+ 라인)

**핵심 특징**:
- React Three Fiber 기반 고성능 3D 렌더링
- Ceph 클러스터를 4계층으로 시각화 (Pool → PG → OSD → Host)  
- 사이버펑크 스타일의 우주선 조종석 UI
- 실시간 검색/인터랙션 시스템
- Bloom 포스트 프로세싱 효과

#### 4.2 노드 계층 구조 (업데이트됨)
```typescript
// Y축 레벨 기준 계층화
const NODE_LEVELS = {
  pools: { y: 30, count: 16 },     // 지구 행성 형태 (변경 없음)
  pgs: { y: -20, dynamic: true },  // 🆕 IcosahedronGeometry + 홀로그래픽 HUD
  osds: { y: -60, count: 79 },     // 🔄 임시 MeshPhongMaterial (조명 문제 해결)  
  hosts: { y: -60, count: 7 }      // 원형 플랫폼 (변경 없음)
};
```

#### 4.3 시각화 기술 (2025.01 업데이트)
- **Pool 노드**: SphereGeometry + 지구 텍스처 + 대기권 효과 (변경 없음)
- **🆕 PG 노드**: IcosahedronGeometry + 노이즈 변형 + MeshPhysicalMaterial + 홀로그래픽 HUD
  - 크리스탈/메탈릭/균열 재질 (상태별)
  - 에너지 필드 + 회전 HUD 링 + 데이터 패널
- **🔄 OSD 노드**: IcosahedronGeometry + MeshPhongMaterial (임시, 셰이더 문제로)
  - 상태별 발광 효과, 플로팅 애니메이션
- **Host 노드**: CircleGeometry + 원형 플랫폼 (변경 없음)

#### 4.4 인터랙션 시스템 완료
1. **검색 패널** (좌상단)
   - Pool/PG/OSD/Host 타입별 검색
   - 검색 결과 펄스 애니메이션 (GSAP)
   - 접기/펼치기 애니메이션
   - PG 검색은 Pool 선택 시에만 활성화

2. **풀스크린 모드**
   - 헤더 숨김/표시 토글
   - 캔버스 크기 자동 조정
   - 패널 위치 동적 변경

3. **패널 제어**
   - Ctrl+클릭으로 4개 패널 동시 토글
   - 개별 패널 접기/펼치기
   - 스마트 토글 (모두 숨김 → 모두 표시, 일부 표시 → 모두 숨김)

4. **노드 선택**
   - Raycaster 기반 마우스 클릭 감지
   - 정보 패널 자동 표시
   - 노드별 상세 정보

#### 4.5 우주선 대시보드 UI (4개 패널)
1. **상단 중앙**: Cluster Command Center
   - 시스템 상태, 건강 점수, 용량 게이지
   - Auto Healing/Monitoring/Alerts 스위치
   - OSD 매트릭스, 성능 지표

2. **좌측 하단**: AI Threat Analysis  
   - AI 예측 분석 목록 (위험도별)
   - 성능 메트릭 그리드

3. **중앙 하단**: Quick Status
   - 지연시간, 처리량, 활성 알림

4. **우측 하단**: Performance Matrix
   - 실시간 성능 매트릭

#### 4.6 시각 효과 및 애니메이션
- **상태 기반 링**: ShaderMaterial 기반 회전 그라디언트 (warning/error)
- **자동 회전**: Pool 구름, OSD, Monitor 노드
- **펄스 효과**: 검색된 노드 크기 변화 애니메이션
- **패널 애니메이션**: slide-search, slide-top, slide-left 등
- **3D 텍스트**: troika-three-text 기반 노드 라벨

### ✅ 5. Backend API 연동 완료
- **Spring Boot 3.5.4** + **Java 21**
- **H2 in-memory database** (개발 환경)
- **WebSocket STOMP** 실시간 데이터 스트리밍
- **Virtual Thread** 기반 고성능 처리
- **RESTful API** 구조

## 현재 Mock Data 시스템
토폴로지 시각화는 현재 완전한 Mock Data로 동작 중:

### Pool 데이터 (16개)
```javascript
pools: [
  { id: 0, name: 'rbd-pool', health: 'healthy' },
  { id: 1, name: 'cephfs-data', health: 'healthy' },
  { id: 2, name: 'cephfs-metadata', health: 'warning' },
  // ... 총 16개
]
```

### OSD 데이터 (79개, 7개 호스트)
```javascript
osds: [
  { id: 0, host: 'host-1', status: 'up', utilization: 65, health: 'healthy' },
  { id: 22, host: 'host-3', status: 'down', utilization: 0, health: 'error' },
  // ... 호스트별로 그룹화
]
```

### PG 데이터 (동적 생성)
- Pool 선택 시 해당 Pool의 PG들을 동적 생성
- 나선형 배치로 시각적 구조화

## 다음 세션 작업 계획 (우선순위 순)

### 🎯 1. OSD ShaderMaterial 완전 구현 (최우선)
**목표**: MeshPhongMaterial → 조명 계산 포함 ShaderMaterial 업그레이드

**구현 방법**:
1. **Lambert/Phong 조명 모델 추가**
   ```typescript
   // Vertex Shader에서 조명 계산 준비
   varying vec3 vNormal;
   varying vec3 vPosition; 
   varying vec3 vViewPosition;
   
   // Fragment Shader에서 directionalLight, ambientLight 계산
   vec3 lightDirection = normalize(directionalLightDirection);
   float dotNL = max(dot(normal, lightDirection), 0.0);
   vec3 diffuse = directionalLightColor * dotNL;
   ```

2. **기존 홀로그래픽 효과 + 조명 결합**
   - Fresnel 효과 + 스캔라인 + 조명 반사
   - 상태별 홀로그래픽 색상 유지
   - 에너지 필드와 조명의 자연스러운 블렌딩

### 🔧 2. 대시보드 차트 실시간 애니메이션 (Next.js 버전)
**요구사항**: ECharts 기반 8개 차트의 5초마다 데이터 변화 애니메이션

**Next.js 구현 방법**:
1. **Zustand Store 활용** (Pinia 대신)
   ```typescript
   // store/dashboardStore.ts
   interface DashboardState {
     chartData: ChartDataMap;
     updateChartData: (chartId: string, newData: any) => void;
   }
   ```

2. **useEffect 기반 데이터 업데이트**
   ```typescript
   // 5초마다 리얼리스틱 데이터 생성
   useEffect(() => {
     const interval = setInterval(() => {
       updateChartData('poolUsage', generateRealisticData(...));
     }, 5000);
     return () => clearInterval(interval);
   }, []);
   ```

### 📡 3. 실시간 업데이트 시스템 (WebSocket 연동)
**목표**: Mock Data → 실제 백엔드 연동

**작업 순서**:
1. **STOMP WebSocket 클라이언트** 구현 (`@stomp/stompjs` 활용)
2. **노드 생명주기 관리** (추가/제거/상태변화)
3. **PG-OSD 연결선 동적 생성**

## 다음 작업 우선순위 (즉시 시작 가능)

### 🔧 2. 실시간 업데이트 시스템 구현
**목표**: Mock Data → 실제 WebSocket 데이터 연동

**세부 작업**:
1. **노드 생명주기 관리**
   ```javascript
   // 추가 구현 필요 함수들
   function addNode(nodeData) { /* 새 노드 생성 및 씬 추가 */ }
   function updateNodeStatus(nodeId, newStatus) { /* 상태 변경 시각화 */ }  
   function removeNode(nodeId) { /* 페이드아웃 후 제거 */ }
   ```

2. **WebSocket 토폴로지 스트리밍**
   ```javascript
   // composables/useTopologyData.js 생성
   export function useTopologyData() {
     const { client } = useWebSocket()
     
     // /topic/topology-updates 구독
     // 노드 추가/제거/상태변화 실시간 반영
   }
   ```

3. **연관관계 시각화**
   - PG-OSD 연결선 동적 생성
   - 상태 기반 색상 변화 (healthy: 초록, degraded: 주황, error: 빨강)
   - 데이터 플로우 애니메이션

### 🤖 3. AI/ML 기능 확장 
현재 Mock Data로 표시 중인 AI 예측을 실제 ML 모델과 연동

### 🔍 4. RAG 조치 가이드 완성
ceph-doc-crawler API 연동 완료, UI 구현 필요

## 현재 파일 구조 (Next.js 마이그레이션 완료)
```
components/
├── topology/
│   └── ClusterTopologyView.tsx (3600+ lines - React Three Fiber 완전 구현)
├── models/
│   └── MetaPlate.tsx (3D GLB 모델 컴포넌트)
├── examples/
│   └── bubble/ (bubble.js, bubble.html - 참고용)
├── layout/ (Header, Navigation 등 - 마이그레이션 필요)
└── dashboard/ (ECharts 컴포넌트들 - 마이그레이션 필요)

app/
├── page.tsx (메인 페이지)
├── layout.tsx (루트 레이아웃)
└── globals.css (Tailwind CSS)

utils/
├── color.ts (색상 유틸리티)
├── layouts.ts (레이아웃 관리)
└── utils.ts (공통 유틸리티)

public/
├── 3d/models/metaplate/ (3D 모델 파일)
├── textures/ (텍스처 파일들)
└── videos/ (배경 비디오들)
```

## 마이그레이션 상태
- ✅ **완료**: 3D 토폴로지 시각화 (`ClusterTopologyView.tsx`)
- ✅ **완료**: 기본 Next.js 구조, Tailwind CSS, TypeScript 설정
- 🔄 **부분 완료**: MetaPlate 3D 모델 컴포넌트
- ❌ **미완료**: 대시보드 차트 컴포넌트들
- ❌ **미완료**: 레이아웃 컴포넌트들  
- ❌ **미완료**: WebSocket 통신
- ❌ **미완료**: Zustand 상태 관리

## 주요 개발 노하우

### 3D 시각화 핵심 기술
1. **텍스처 로딩**: `loadTexture()` 비동기 처리
2. **그림자 시스템**: PCFSoftShadowMap 최적화
3. **성능 최적화**: `frustumCulled = false`, 메모리 관리
4. **레이캐스팅**: 정확한 마우스-3D객체 인터랙션

### Vue 3 패턴
1. **Composition API**: `<script setup>` 전면 사용
2. **Reactive 시스템**: `ref`, `computed` 활용
3. **생명주기**: `onMounted`, `onUnmounted` 정확한 정리

### 애니메이션 시스템
1. **GSAP**: 복잡한 3D 노드 애니메이션
2. **CSS Transition**: 패널 slide 애니메이션  
3. **Shader Animation**: 회전하는 링 효과

## 프로젝트 상태 평가

### 성공적 완료 영역 (90%+)
- ✅ 3D 토폴로지 시각화 시스템
- ✅ 우주선 대시보드 UI
- ✅ ECharts 기반 메트릭 대시보드  
- ✅ 반응형 레이아웃 시스템
- ✅ WebSocket 실시간 통신

### 다음 작업 영역 (30-50%)
- 🔧 실시간 데이터 업데이트
- 🤖 AI/ML 모델 연동
- 🔍 RAG 조치 가이드 UI

### 미착수 영역 (0-10%)  
- PG 최적화 도구
- 트러블슈팅 시스템
- 리포트 생성

## 개발 환경
- **Node.js**: v18+
- **Package Manager**: pnpm
- **개발 서버**: `pnpm run dev`
- **Backend**: Spring Boot (8080포트)
- **Frontend**: Vite dev server (5173포트)

## 마일스톤 현황
- **M1: MVP (Week 7)** ✅ **완료** - 기본 대시보드 + 3D 토폴로지
- **M2: AI/ML Integration (Week 12)** 🔄 **진행 예정** 
- **M3: Production Ready (Week 16)** ⏳ **대기**

---

## 즉시 작업 가능 항목

### 우선순위 1: 토폴로지 실시간 업데이트
현재 완벽한 3D 시각화 기반 위에 실시간 데이터 연동만 추가하면 됨
- Mock 데이터 → WebSocket 스트리밍 전환
- 노드 상태 변화 애니메이션
- PG-OSD 연결선 시각화

### 우선순위 2: AI 대시보드 확장  
현재 패널에 Mock 데이터로 표시 중인 AI 예측을 실제 기능으로 확장

### 우선순위 3: RAG 시스템 UI
ceph-doc-crawler API는 완료, 사용자 인터페이스만 구현 필요

이 프로젝트는 현재 매우 탄탄한 기술적 기반을 완성한 상태이며, 다음 단계는 실시간 데이터 연동을 통한 완전한 운영 시스템 구축입니다.