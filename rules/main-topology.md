# Ceph Cluster 3D Dashboard - Frontend Development Guide

## 📋 프로젝트 개요

실시간 Ceph 클러스터 토폴로지와 네트워크 트래픽을 3D로 시각화하는 React 대시보드입니다.

### 핵심 특징
- **3D 토폴로지 시각화**: React Three Fiber 기반 인터랙티브 3D 뷰
- **실시간 트래픽 플로우**: OSD 간 데이터 흐름을 파티클 애니메이션으로 표현
- **WebSocket 통신**: Spring Boot 백엔드와 STOMP 프로토콜로 실시간 데이터 스트리밍
- **사이버펑크 UI**: 네온 효과와 그라디언트를 활용한 미래적 디자인

## 🎨 컴포넌트 구조

### 1. Main Component: `CephDashboard`

```typescript
export default function CephDashboard() {
  // State 관리
  const [topologyData, setTopologyData] = useState<CephTopologyData | null>(null);
  const [connected, setConnected] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [trafficIntensity, setTrafficIntensity] = useState(5);
  
  // WebSocket 연결
  // Canvas 렌더링
  // 좌/우 패널 UI
}
```

#### State 설명
- `topologyData`: 백엔드에서 받은 클러스터 전체 데이터
- `connected`: WebSocket 연결 상태
- `selectedNode`: 클릭한 노드 정보 (팝업 표시용)
- `trafficIntensity`: 트래픽 속도 조절 (1-10)

### 2. 3D Scene Component: `CephTopology3D`

```typescript
function CephTopology3D({ data, onNodeSelect }) {
  const positions = useMemo(() => calculateNodePositions(), []);
  
  return (
    <group>
      <ConnectionLines />    // 계층 간 연결선
      <InteractiveNode />   // 클릭 가능한 노드들
      <TrafficFlow />       // 트래픽 애니메이션
    </group>
  );
}
```

#### 계층 구조와 위치
```
Cluster (y=0)     - 중앙, 최상위
  ↓
Hosts (y=3)       - 삼각형 배치, 반경 5
  ↓
OSDs (y=0)        - 각 호스트 주변 원형 배치, 반경 2
  ↓
Pools (y=5)       - 외곽 원형 배치, 반경 12
```

### 3. Traffic Component: `TrafficFlow`

현재 구현된 트래픽 시각화:
- **출발/도착**: OSD → OSD (y=0 레벨)
- **경로**: Quadratic Bezier Curve (낮은 아치형)
- **파티클**: 3개가 33% 간격으로 연속 이동
- **효과**: Trail 효과 + 발광(emissive) 효과

```typescript
function TrafficFlow({ flow, positions }) {
  // 3개의 파티클 ref
  const meshRef = useRef<THREE.Mesh>(null);
  const meshRef2 = useRef<THREE.Mesh>(null);
  const meshRef3 = useRef<THREE.Mesh>(null);
  
  // Bezier 곡선 계산
  const midPoint = useMemo(() => {
    // 아치 높이: 최대 1.5
    mid.y = Math.min(distance * 0.2, 1.5);
  }, [sourcePos, targetPos]);
  
  // 애니메이션 (useFrame)
  // - 속도: flow.intensity * 0.4
  // - 크기 변화: 0.1 ~ 0.25 (중간에서 최대)
  // - 투명도: 0.3 ~ 1.0 (중간에서 최대)
}
```

### 4. Interactive Node: `InteractiveNode`

노드 타입별 특성:
- **Cluster**: Float 애니메이션, 회전
- **Host**: Box 형태, 역할별 색상
- **OSD**: Sphere 형태, 사용률에 따른 크기 변화
- **Pool**: Box 형태, I/O rate에 따른 크기 변화

```typescript
function InteractiveNode({ position, nodeData, type, color, size, onSelect }) {
  // 호버 효과
  const [hovered, setHovered] = useState(false);
  
  // 클릭 핸들러
  const handleClick = (e) => {
    onSelect({ type, data: nodeData });
    // GSAP 애니메이션 트리거
  };
  
  // Float 컴포넌트로 감싸기 (Cluster만)
  // 호버 시 스케일 업
  // 클릭 시 팝업 데이터 전달
}
```

### 5. Connection Lines: `ConnectionLines`

계층 간 연결 관계 시각화:
- Cluster → Hosts (파란색)
- Hosts → OSDs (초록색)
- OSDs → Pools (보라색, opacity 0.3)

```typescript
function ConnectionLines({ positions, data }) {
  // 점선 스타일
  // dashed, dashScale={5}, dashSize={0.1}, gapSize={0.1}
}
```

## 📊 데이터 구조

### WebSocket 데이터 포맷

```typescript
interface CephTopologyData {
  cluster: ClusterInfo;      // 클러스터 전체 정보
  hosts: HostInfo[];          // 3개 호스트
  osds: OSDInfo[];           // 36개 OSD (호스트당 12개)
  pools: PoolInfo[];         // 5개 풀
  traffic: NetworkTraffic[]; // 실시간 트래픽 플로우
  timestamp: number;
}

interface NetworkTraffic {
  flowId: string;
  sourceOSD: number;      // OSD 인덱스 (0-35)
  targetOSD: number;      // OSD 인덱스 (0-35)
  sourceHost: string;
  targetHost: string;
  bytesPerSec: number;
  opsPerSec: number;
  trafficType: 'replication' | 'recovery' | 'client';
  intensity: number;      // 1-10
}
```

## 🎯 주요 수정 포인트

### 트래픽 수정 시
1. `TrafficFlow` 컴포넌트의 `useFrame` 내부 로직 수정
2. `midPoint.y` 값 조정으로 아치 높이 변경
3. `progress.current` 증가율로 속도 조절
4. 파티클 개수는 `meshRef` 추가로 증가

### 노드 위치 수정 시
1. `calculateNodePositions` 함수 수정
2. Y축 값으로 높이 조정
3. 반경 값으로 분산도 조정

### 새로운 시각화 추가 시
1. `CephTopology3D`에 새 컴포넌트 추가
2. `positions` prop 전달
3. `useFrame`으로 애니메이션 구현

### 성능 최적화
1. `useMemo`로 계산 캐싱
2. 트래픽 개수 제한 (`.slice(0, 10)`)
3. OSD 표시 개수 조절 가능

## 🚀 개발 환경 설정

```bash
# 프로젝트 설치
npm install

# 개발 서버 실행
npm run dev

# 백엔드 연결 설정
# CephDashboard.tsx 내 WebSocket URL 수정
const socket = new SockJS('http://localhost:8080/ws-ceph-dashboard');
```

## 🛠️ 자주 사용하는 수정 작업

### 1. 트래픽 색상 변경
```typescript
// TrafficFlow 컴포넌트 내
const color = flow.trafficType === 'recovery' ? '#ff6600' : 
              flow.trafficType === 'client' ? '#00ff66' : 
              '#0066ff';
```

### 2. 노드 크기 조정
```typescript
// InteractiveNode 생성 시
size={0.4 + (osd.utilizationPercent / 100) * 0.3}  // OSD
size={0.8 + pool.ioRate / 500}                      // Pool
```

### 3. 카메라 위치 변경
```typescript
// Canvas props
camera={{ position: [20, 10, 20], fov: 50 }}
```

### 4. 애니메이션 속도
```typescript
// OrbitControls
autoRotateSpeed={0.1}

// TrafficFlow
progress.current += delta * flow.intensity * 0.01 * intensityRate;
```

## 🎨 스타일 커스터마이징

### CSS Module Classes
- `.dashboard` - 메인 컨테이너
- `.titleGlow` - 네온 효과 타이틀
- `.metricCard` - 메트릭 카드
- `.healthStatus` - 상태 표시
- `.flow` - 트래픽 타입 표시
- `.infoPopup` - 노드 정보 팝업

### 색상 팔레트
```css
/* 상태 색상 */
--health-ok: #00ff88
--health-warn: #ffaa00
--health-err: #ff3366

/* 트래픽 색상 */
--traffic-replication: #0066ff
--traffic-recovery: #ff6600
--traffic-client: #00ff66

/* 노드 색상 */
--host-control: #4488ff
--host-compute: #44ff88
--host-network: #ff8844
--pool: #8844ff
```

## 📝 확장 가능한 기능

### 추가 가능한 시각화
1. **Heat Map**: OSD 사용률 히트맵
2. **Flow Direction Lines**: 트래픽 방향 화살표
3. **Cluster Health Indicator**: 3D 상태 표시기
4. **Performance Graphs**: 실시간 성능 그래프

### 인터랙션 개선
1. **Drag & Drop**: 노드 재배치
2. **Filter**: 트래픽 타입별 필터링
3. **Zoom to Node**: 특정 노드 포커스
4. **History Playback**: 시간대별 재생

## 🐛 트러블슈팅

### 일반적인 문제 해결

1. **WebSocket 연결 실패**
    - CORS 설정 확인
    - 백엔드 서버 실행 확인
    - 포트 번호 확인

2. **3D 렌더링 문제**
    - WebGL 지원 브라우저 확인
    - GPU 가속 활성화 확인
    - Three.js 버전 호환성 확인

3. **성능 이슈**
    - 트래픽 개수 제한
    - 파티클 수 감소
    - LOD (Level of Detail) 적용

## 📚 참고 자료

- [React Three Fiber 문서](https://docs.pmnd.rs/react-three-fiber)
- [Drei 컴포넌트](https://github.com/pmndrs/drei)
- [Three.js 문서](https://threejs.org/docs)
- [STOMP.js](https://stomp.github.io/stompjs/)

## 💡 개발 팁

1. **Chrome DevTools의 Rendering 탭 활용**
    - FPS 모니터링
    - Paint flashing 확인
    - Layer borders 확인

2. **React DevTools Profiler**
    - 컴포넌트 렌더링 최적화
    - 불필요한 리렌더링 방지

3. **Three.js Inspector**
    - Scene graph 확인
    - Material/Geometry 디버깅

---

*이 문서는 Claude Code가 프로젝트를 이해하고 즉시 수정 작업을 시작할 수 있도록 작성되었습니다.*