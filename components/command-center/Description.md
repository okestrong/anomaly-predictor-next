# Command Center Dashboard 시각화 요소 설명

## 1. Enhanced Cluster Network Topology - Pulse 효과

### Pulse 효과의 의미
노드의 **pulse**는 해당 노드가 주요 역할을 수행하고 있는지를 나타냅니다.

```javascript
// 코드 위치: 라인 827, 841, 855
pulse: true,   // 주요 역할 노드 (Primary/Leader/Active)
pulse: false,  // 대기 상태 노드 (Standby/Follower/Backup)
pulse: Math.random() > 0.7,  // 특정 OSD: 70% 확률로 활성 상태
```

### 노드별 Pulse 상태
- **MON (Monitor) 노드**: 모두 `pulse: true` - 클러스터 상태 모니터링
- **MDS (Metadata Server)**:
  - `mds-1`: `pulse: true` (Active)
  - `mds-2`: `pulse: false` (Standby)
- **RGW (RADOS Gateway)**:
  - `rgw-1`: `pulse: true` (Active)
  - `rgw-2`: `pulse: false` (Standby)
- **MGR (Manager)**: `pulse: true` - 클러스터 관리
- **OSD (Object Storage Daemon)**: 랜덤 설정 - 실제 클러스터에선 디스크 활성 상태, 디스크 비활성

---

## 2. OSD 노드 하단 프로그레스바

### 의미
OSD 노드 하단의 프로그레스바는 **스토리지 사용량**을 나타냅니다.

```javascript
// 코드 위치: 라인 1162-1176
const loadWidth = (node.load / 100) * barWidth;
ctx.fillStyle = node.load > 80 ? COLORS.danger    // 위험: 80% 이상 빨강
              : node.load > 60 ? COLORS.warning   // 경고: 60-80% 노랑
              : COLORS.success;                   // 정상: 60% 이하 초록
```

### 색상별 의미
- 정상 **안전** (0-60%): 초록색
- 경고 **주의** (60-80%): 노란색
- 위험 **포화** (80-100%): 빨간색

실제 환경에서는 OSD의 디스크 사용량이 80%를 넘으면 리밸런싱이나 용량 확장을 고려해야 합니다.

---

## 3. 노드간 데이터 흐름 시각화

### 연결선 데이터 흐름
노드 사이를 이동하는 점들은 실시간 네트워크 트래픽을 시각화합니다.

```javascript
// 코드 위치: 라인 1070-1115
// 연결선: 그라디언트로 방향성 표현
const gradient = ctx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y);

// 데이터 패킷: 애니메이션 점으로 표현
const packetCount = Math.floor(activity * 3) + 1;  // 활동량에 따른 패킷 개수
const packetProgress = (time * 0.8 + i * 0.4 + p * 0.3) % 1;  // 이동 진행도
```

### 연결 유형별 색상 구분
- 보라색 **관리** (`management`): MON ↔ MGR 관리 통신
- 파란색 **스토리지** (`storage`): OSD ↔ MON/MGR 스토리지 데이터
- 초록색 **메타데이터** (`metadata`): MDS ↔ MON/OSD 메타데이터 전송
- 주황색 **게이트웨이** (`gateway`): RGW ↔ MON/OSD 클라이언트 요청
- 노란색 **클러스터** (`cluster`): MON ↔ MON 클러스터 상태 동기화

### 패킷 애니메이션 특성
- **패킷 개수**: 네트워크 활동량에 따라 패킷수 증가 (최대 4개)
- **패킷 속도**: 그라디언트 상에서 진행
- **패킷 크기**: 데이터 전송량에 따른 크기 변화

---

## 4. Live Data Stream Badge 애니메이션

### 실시간 이벤트 스트림
우측에서 좌측으로 흐르는 배지들은 **클러스터에서 발생하는 실시간 이벤트**를 나타냅니다.

```javascript
// 코드 위치: 라인 1446-1517
const generateDataPoint = () => ({
   value: Math.random() * 100,           // 이벤트 중요도 (0-100)
   type: ['success', 'warning', 'info', 'danger'][...], // 이벤트 유형
   speed: 5 + Math.random() * 10,        // 이동 속도 (5-15초)
});
```

### 배지 색상별 의미
- **초록 (성공)** `success`: 정상 이벤트
  - 정상 작업, 복제 완료, 백업 성공 등
- **노랑 (경고)** `warning`: 경고 이벤트
  - 성능 저하, 임계치 초과, 재시도 필요 등
- **빨강 (위험)** `danger`: 위험 이벤트
  - 디스크 오류, 네트워크 단절, 서비스 장애 등
- **파랑 (정보)** `info`: 일반 이벤트
  - 설정 업데이트, 재시작, 동기화 완료 등

### 애니메이션 동작 특성
- **연속적인 흐름**: 이벤트 흐름을 통해 실시간 시스템 활동도 표현
- **그라데이션**: 이벤트의 중요도나 긴급도 표현
- **이동 속도**: 이벤트의 우선순위 반영

---

## 실제 운영 환경 적용

모든 시각화 요소는 **실시간 데이터**로 연동되며, 실제 운영 환경에서는:

1. **WebSocket 연결**을 통한 실시간 클러스터 데이터 수신
2. **Prometheus 메트릭**에서 실제 OSD 사용량, 네트워크 트래픽 수신
3. **Ceph 이벤트 로그**에서 실제 이벤트 스트림 통합
4. **클러스터 상태 변화**에 따른 실시간 pulse와 색상 업데이트

이를 통해 관리자는 클러스터의 **전체적인 건강 상태와 데이터 흐름을 직관적으로 모니터링**할 수 있습니다.