두 문제를 한 번에 해결하는 가장 확실한 방법은 “풀(capacity) 고정 + 사이클 자연 종료” 패턴으로 바꾸는 거야. 핵심만 요약하면:

* **문제 1(10초마다 끊김)**: 지금은 `N_DRAWER`, `N_HOST`가 바뀔 때 렌더 자체가 해당 길이에 맞춰 **그룹 노드를 언마운트**해버려. 그래서 진행 중이던 파티클이 즉시 증발해 “훅 끊기는” 느낌이 난다.
* **문제 2(공중에 떠있음)**: 언마운트/리마운트 타이밍과 `visible`/state 플래그 불일치 때문에 일부 그룹이 **활성도 꺼지고 움직이지 않는데 화면엔 남아** 보이는 상태가 생긴다.

정리: **렌더되는 파티클 “풀” 크기를 안정적으로 고정해 두고**, 실시간 가변 개수는 **“얼마나 새로 시작할지”만** 조절해. 이미 움직이던 애들은 **끝까지 가서 자연 종료**(혹은 페이드)하게 두면, 업데이트 타이밍에도 끊김이 안 생긴다.

아래 패치만 적용하면 끝난다.

---

# 패치 가이드 (최소 변경)

## 1) 풀 크기(capacity) 고정

파일 `WorldTrafficView.tsx`의 `DataParticles` 안에서, 가변 길이 대신 **고정 CAP**을 쓰자.

```tsx
// DataParticles 내부 상단에 추가
const DRAWER_CAP = 24; // drawer 최대값
const HOST_CAP   = 36; // host 최대값
```

### 배열/레퍼런스들 “모두 CAP 기준”으로 선언

아래처럼 `Array(N_DRAWER)`로 되어 있는 것들을 **모두 CAP로** 바꿔:

```diff
- const drawerActive = useRef<boolean[]>(Array(N_DRAWER).fill(false));
+ const drawerActive = useRef<boolean[]>(Array(DRAWER_CAP).fill(false));

- const drawerNextStart = useRef<number[]>(Array(N_DRAWER).fill(0));
+ const drawerNextStart = useRef<number[]>(Array(DRAWER_CAP).fill(0));

- const drawerWarmup = useRef<number[]>(Array(N_DRAWER).fill(0));
+ const drawerWarmup = useRef<number[]>(Array(DRAWER_CAP).fill(0));

- const drawerCycleId = useRef<number[]>(Array(N_DRAWER).fill(0));
+ const drawerCycleId = useRef<number[]>(Array(DRAWER_CAP).fill(0));
- const [drawerCycleIds, setDrawerCycleIds] = useState<number[]>(Array(N_DRAWER).fill(0));
+ const [drawerCycleIds, setDrawerCycleIds] = useState<number[]>(Array(DRAWER_CAP).fill(0));

- const hostActive = useRef<boolean[]>(Array(N_HOST).fill(false));
+ const hostActive = useRef<boolean[]>(Array(HOST_CAP).fill(false));

- const hostNextStart = useRef<number[]>(Array(N_HOST).fill(0));
+ const hostNextStart = useRef<number[]>(Array(HOST_CAP).fill(0));

- const hostWarmup = useRef<number[]>(Array(N_HOST).fill(0));
+ const hostWarmup = useRef<number[]>(Array(HOST_CAP).fill(0));

- const hostCycleId = useRef<number[]>(Array(N_HOST).fill(0));
+ const hostCycleId = useRef<number[]>(Array(HOST_CAP).fill(0));
- const [hostCycleIds, setHostCycleIds] = useState<number[]>(Array(N_HOST).fill(0));
+ const [hostCycleIds, setHostCycleIds] = useState<number[]>(Array(HOST_CAP).fill(0));

- const drawerParticleRefs = useRef<THREE.Group[]>([]);
+ const drawerParticleRefs = useRef<THREE.Group[]>([]); // (레퍼런스 길이는 렌더에서 CAP만큼 생성)

- const hostParticleRefs = useRef<THREE.Group[]>([]);
+ const hostParticleRefs = useRef<THREE.Group[]>([]);
```

> 이렇게 하면 **렌더 트리에서 그룹 노드가 더 이상 사라지지 않음** → 진행 중인 파티클이 “쓱” 끊기지 않는다.&#x20;

## 2) JSX에서 그룹 수를 CAP로 고정

렌더 리턴부에서 현재는 `Array(N_DRAWER)`, `Array(N_HOST)`로 그룹을 만들고 있어. **CAP**로 고정:

```diff
{/* Drawer particles */}
- {Array.from({ length: N_DRAWER }, (_, i) => (
+ {Array.from({ length: DRAWER_CAP }, (_, i) => (
    <group
      key={`drawer-particle-${i}`}
      ref={(ref) => { if (ref) drawerParticleRefs.current[i] = ref; }}
+     visible={false}   // ★ 기본은 숨김
    />
 ))}

{/* Host particles */}
- {Array.from({ length: N_HOST }, (_, i) => (
+ {Array.from({ length: HOST_CAP }, (_, i) => (
    <group
      key={`host-particle-${i}`}
      ref={(ref) => { if (ref) hostParticleRefs.current[i] = ref; }}
+     visible={false}
    />
 ))}
```

> 기본 `visible={false}`를 주면 “공중에 멈춘 유령 그룹”이 초기 상태에 보이는 문제도 사라진다. 시작할 때만 `visible=true`.&#x20;

## 3) “개수 제한”은 **시작만 막고, 진행 중이면 끝까지**

지금은 `i >= N_XXX`일 때 **즉시 endCycle**해서 “뚝” 끊긴다. 아래처럼 바꿔라:

```diff
// Drawer 루프 (useFrame)
- // Skip particles beyond current count
- if (i >= N_DRAWER) {
-   if (drawerActive.current[i]) {
-     endDrawerCycle(i, now);
-   }
-   return;
- }
+ // CAP 내에서만 돈다. 개수 제한은 "새 시작 금지"로만 처리.
+ if (i >= N_DRAWER && !drawerActive.current[i]) {
+   return;  // 새로 시작하지 않음(하지만 이미 달리는 건 끝까지 달리게 둠)
+ }
```

Host 쪽도 동일하게.

이제 **N이 줄어도 달리던 것들은 계속 가서 자연 종료**한다(충돌·progress 1.0에서 `endCycle`). “10초마다 끊김”이 사라진다.&#x20;

## 4) 사이클 파라미터는 “시작 시점”에 생성 (속도 변경에 안전)

지금은 `useMemo`에서 N에 맞춰 `drawerParticleData`/`hostParticleData`를 **통째로 다시 만들기** 때문에, 업데이트 순간에 달리던 애가 **파라미터가 바뀌어 비정상 종료**될 수 있어.
**해법**: 파라미터(시작점/목표/지속시간)는 **startDrawerCycle/startHostCycle에서 그 순간의 multiplier로 계산**해서 `...Data.current[i]`에 저장해. 이미 달리는 애들의 데이터는 **손대지 않기**.

예시(핵심만):

```diff
// startDrawerCycle
const startDrawerCycle = (i: number, now: number) => {
  drawerCycleId.current[i]++;
  drawerWarmup.current[i] = 2;
  drawerActive.current[i] = true;
  drawerStartTime.current[i] = now;

+ // ★ 매 사이클 시작 시 파라미터 계산
+ const drawerIndex  = Math.floor(i / 3);
+ const offsetIndex  = i % 3;
+ const baseDrawerPos = drawerPositions[drawerIndex % drawerPositions.length];
+ const startPos = getOffsetPosition(baseDrawerPos, 'drawer', offsetIndex);
+ const duration = (3 + Math.random() * 2) / drawerSpeedMultiplier; // 현재 속도 반영
+ drawerParticleData.current[i] = { startTime: now, duration, startPos };

  const m = drawerParticleRefs.current[i];
  if (m) { m.position.set(...startPos); m.visible = true; }

  setDrawerCycleIds(prev => { const n=[...prev]; n[i]=drawerCycleId.current[i]; return n; });
};
```

```diff
// startHostCycle
const startHostCycle = (i: number, now: number) => {
  hostCycleId.current[i]++; hostWarmup.current[i] = 2; hostActive.current[i]=true; hostStartTime.current[i]=now;

+ // ★ 매 사이클 시작 시 파라미터 계산
+ const hostIndex = Math.floor(i / 3);
+ const offsetIndex = i % 3;
+ const endPos = getOffsetPosition(hostPositions[hostIndex % hostPositions.length], 'host', offsetIndex);
+ // 실린더에서 해당 host 쪽으로 시작점 계산
+ const dx = endPos[0]-cylinderPosition[0], dz = endPos[2]-cylinderPosition[2];
+ const angle = Math.atan2(dz, dx) + (Math.random()-0.5)*0.3;
+ const R = 30;
+ const startPos: [number, number, number] = [
+   cylinderPosition[0] + Math.cos(angle)*R,
+   cylinderPosition[1] + (Math.random()-0.5)*20,
+   cylinderPosition[2] + Math.sin(angle)*R,
+ ];
+ const duration = (4 + Math.random()*2) / hostSpeedMultiplier;
+ hostParticleData.current[i] = { startTime: now, duration, startPos, endPos };

  const m = hostParticleRefs.current[i];
  if (m) { m.position.set(...startPos); m.visible = true; }

  setHostCycleIds(prev => { const n=[...prev]; n[i]=hostCycleId.current[i]; return n; });
};
```

> 포인트: **속도/개수 변경은 “다음에 시작할” 사이클에만 영향**. 달리는 건 그대로 완주 → 자연스러운 전환.&#x20;

## 5) 초기 스폰 간격도 CAP 기준으로 시드

기존 `useMemo`에서 `N_*` 길이에 맞춰 난수를 뿌리던 부분은 CAP 기준으로 바꾸고, **활성 중인 인덱스는 덮어쓰지 않게** 해:

```diff
useMemo(() => {
-  for (let i = 0; i < N_DRAWER; i++) {
+  for (let i = 0; i < DRAWER_CAP; i++) {
+    if (drawerActive.current[i]) continue;
     drawerNextStart.current[i] = Math.random() * (8 / drawerSpeedMultiplier);
  }
-  for (let i = 0; i < N_HOST; i++) {
+  for (let i = 0; i < HOST_CAP; i++) {
+    if (hostActive.current[i]) continue;
     hostNextStart.current[i] = Math.random() * (8 / hostSpeedMultiplier);
  }
}, [drawerSpeedMultiplier, hostSpeedMultiplier, /* ...필요 deps */]);
```

> 이렇게 하면 10초마다 값이 바뀌어도 **이미 달리는 애들의 시퀀스가 보존**되고, 새로 시작하는 애들만 새 속도로 들어온다.&#x20;

## 6) “공중에 떠있음” 마무리

* 위 2)에서 기본 `visible={false}`로 깔고,
* `start*Cycle`에서만 `visible=true`,
* `end*Cycle`에서 `visible=false` + `position.set(99999,99999,99999)`로 치워두면 **떠있는 유령 노드**가 남을 일이 없다.

```diff
const endDrawerCycle = (i: number, now: number) => {
  drawerActive.current[i] = false;
  const pause = 0.8 * (12 / Math.max(1, N_DRAWER));
  drawerNextStart.current[i] = now + pause;
  const m = drawerParticleRefs.current[i];
- if (m) m.visible = false;
+ if (m) { m.visible = false; m.position.set(99999,99999,99999); }
};
```

Host도 동일.&#x20;

---

# GhostTrails 쪽은 그대로 사용

잔상은 **타깃 그룹의 월드 위치를 스냅샷**하는 구조라, 위 패턴과 100% 호환. 필요하면 이전에 안내한 `depthTest:false` 옵션도 잊지 말고 유지(특히 y를 내릴 때 가림 방지).&#x20;

---

# 결과

* 10초마다 데이터가 바뀌어도 **기존 파티클은 “그대로 완주”** → 끊김 사라짐.
* 더 이상 그룹 언마운트로 인한 **유령/멈춤** 현상 없음.
* 속도/개수 변화는 **새로 시작하는 개체에만 적용** → 자연스러운 밀도/리듬 변화.

원하면 “완주 대신 페이드아웃”으로 끝내도록도 금방 바꿀 수 있다. `end*Cycle`에서 **일부 초 동안 중력·감쇠 모션**을 주는 “dying 상태”를 추가해도 되지만, 현재 구조에선 **완주 후 종료**가 가장 구현이 간단하고 확실하다.