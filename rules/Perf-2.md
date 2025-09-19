문제의 원인은 “30초마다 iops 합으로 목표 개수(`targetCount`)가 바뀔 때, 기존 구슬 전부를 일괄적으로 `fadeOut` 처리하면서 동시에 새 구슬을 **목표 개수만큼 다시 전부 생성**”하기 때문이야. 이 순간 몇 초간은 “기존(페이드아웃 중) + 신규”가 **중복**으로 돌아서 물리 바디/렌더 수가 급증 → FPS가 뚝 떨어졌다가, 페이드가 끝나면 다시 회복되는 패턴이 생긴다. 지금 컨테이너의 업데이트 로직이 정확히 그렇게 짜여 있어. 기존 코드가 `prevSpheres`에서 아직 안 지워진 것들까지 다 유지한 채, 신규를 `targetCount`개 한 번에 더하며 반환하고 있어(전체 교체).&#x20;

여기에 더해, `PhysicsSphere`가 프레임마다 `new THREE.Vector3()`를 만드는 버전이 섞여 있어서(버전에 따라 다름), GC 스파이크를 일으킬 수 있다. 이건 벡터를 `useRef`로 재사용하는 최적화 버전으로 바꾸면 바로 잡힌다(재사용 패턴 예시). &#x20;

아래 단계대로 고치면 “30초 변동”에도 프레임이 안정된다. 우선 **A(필수) → B(권장) → C(선택)** 순서로 적용해.

---

# A. “전부 갈아치우기”를 “차등 증감”으로 바꾸기 (필수)

현재는 `targetCount`가 바뀌면, 모든 기존을 `fadeOut`시키고 **신규를 `targetCount`개 한 번에** 만든다. 이걸 **차이만큼만** 추가/감소하도록 바꿔.

### 패치 포인트 (PhysicsSpheresContainer)

아래처럼 `setSpheres` 갱신 부분을 교체해. 핵심은

1. `active`(아직 안 지는 것)와 `fading`을 분리,
2. `diff = targetCount - active.length`만큼만 **추가 또는 부분 페이드**,
3. 한 번에 많이 줄여도 “필요한 개수만” `fadeOut`.

```ts
// 기존: 모든 active를 fadeOut + targetCount 전량 신규 생성  ❌
// 교체: 차등 증감 방식  ✅
useEffect(() => {
  setSpheres(prev => {
    const active = prev.filter(s => !s.fadeOut);
    const fading = prev.filter(s => s.fadeOut);

    const diff = targetCount - active.length;

    if (diff > 0) {
      // 필요한 만큼만 추가
      const adds = Array.from({ length: diff }, (_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 15;
        const height = (Math.random() - 0.5) * 15;
        return {
          id: `sphere-${Date.now()}-${i}`,
          position: [
            centerPosition[0] + Math.cos(angle) * radius,
            centerPosition[1] + height,
            centerPosition[2] + Math.sin(angle) * radius,
          ] as [number, number, number],
          fadeOut: false,
        };
      });
      return [...fading, ...active, ...adds];
    } else if (diff < 0) {
      // 필요한 개수만 fadeOut
      const toFade = active.slice(0, -diff).map(s => ({ ...s, fadeOut: true }));
      const keepActive = active.slice(-diff);
      return [...fading, ...toFade, ...keepActive];
    }
    return prev; // 동일하면 그대로
  });
}, [targetCount, centerPosition]);
```

위와 정반대인 기존 로직(모두 페이드아웃 + 전량 재생성)이 성능 출렁임의 직접 원인이다.&#x20;

또한, `onFadeComplete`에서 **리스트를 필터로 줄이는 건 유지**해도 되고(실제 제거), 혹은 “풀” 방식(C에서 설명)으로 갈 거면 제거 대신 비활성만 표시하도록 바꾸면 된다. 현재 제거 방식 자체는 문제가 없어.&#x20;

---

# B. 증감을 “점진적 스텝”으로 다듬기 (권장)

30초에 한 번 값이 크게 변하면, **A만으로도** 급락은 크게 줄어든다. 여기에 “한 번에 diff만큼”을 또 쪼개서 **50\~80ms 간격으로 1개씩**만 증감하면, 체감 프레임이 훨씬 매끈해진다.

```ts
const [current, setCurrent] = useState(0);

useEffect(() => {
  let raf: number | null = null;
  let last = performance.now();

  const step = (now: number) => {
    if (now - last >= 70) {          // 70ms마다 1개씩
      setCurrent(n => n + Math.sign(targetCount - n));
      last = now;
    }
    if (current !== targetCount) raf = requestAnimationFrame(step);
  };

  if (current !== targetCount) raf = requestAnimationFrame(step);
  return () => { if (raf) cancelAnimationFrame(raf); };
}, [targetCount, current]);
```

그 다음 `setSpheres`에서는 `current`를 기준으로 차등 증감(A 로직)을 수행해. 이렇게 하면 어떤 iops 급변도 자연스럽게 녹아든다.

---

# C. 최상위 성능 대책 2종 (선택)

## C-1) **풀(POOL) 고정**: 생성/제거 자체를 없애기

최대 개수 `MAX_CAP`만큼 **한 번만** 생성해두고, 활성 개수만 늘리고 줄인다(나머지는 `visible=false` or `fadeOut`→완료 시 `visible=false`로 전환). 이렇게 하면 “React 트리/물리 바디 마운트/언마운트” 비용이 사라진다.

핵심만 적으면:

```ts
const MAX_CAP = 60;
const pool = useMemo(() => Array.from({length: MAX_CAP}, (_,i)=>({
  id: `pool-${i}`,
  position: randInside(centerPosition),
  fadeOut: false,
})), [centerPosition]);

// activeN만 상태로 들고 가면 setSpheres 자체가 필요없음
const [activeN, setActiveN] = useState(10);

// 렌더
{pool.map((s, i) => (
  <ShrinkingSphere
    key={s.id}
    id={s.id}
    position={s.position}
    centerPosition={centerPosition}
    fadeOut={i >= activeN}     // 초과분만 천천히 줄이기
    onFadeComplete={() => {/* 풀에서는 제거 대신 숨김 처리 */}}
  />
))}
```

## C-2) 물리 제거 + InstancedMesh로 전환

### 언제 쓰나

* 실린더 내부 구슬이 **서로 충돌할 필요가 없고**, 벽(경계)만 대충 지키면 됨
* “시각 효과 + 대량 동체”가 목적 (수십\~수천 개)
  → Cannon을 빼고 **InstancedMesh** 하나로 **행렬만 업데이트**하면 프레임 안정도가 급상승한다.

### 핵심 아이디어

* 구슬 N개를 `instancedMesh` 1개로 렌더
* 각 인스턴스에 `pos`, `vel`, `seed`만 CPU에서 유지
* 매 프레임: 단순 힘장(중심 흡인 + 원주 스월 + 약한 난류)을 적분 → `setMatrixAt(i, matrix)` → `instanceMatrix.needsUpdate = true`
* 경계(원기둥) 밖이면 **랩/리셋** (혹은 튕김)
* 증감은 **풀(capacity) 고정** + `activeCount`만 조절 (생성/파괴 없음)

## 드롭인 컴포넌트 (가볍고 빠름)

```tsx
// InstancedSpheres.tsx
import * as THREE from 'three'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'

type Props = {
  center?: [number, number, number]     // 실린더 중심
  radius?: number                       // 실린더 반지름
  halfHeight?: number                   // 실린더 높이/2
  maxCap?: number                       // 풀 최대 개수
  targetCount: number                   // 화면에 보일(활성) 개수
  sphereRadius?: number                 // 구슬 반지름(시각)
  color?: string | number
  stiffness?: number                    // 중심 흡인 계수
  swirl?: number                        // 원주 흐름 계수
  noise?: number                        // 난류 계수
  drag?: number                         // 감쇠(0~1), 1에 가까울수록 잘 멈춤
}

export default function InstancedSpheres({
  center = [0, 20, 0],
  radius = 15,
  halfHeight = 12,
  maxCap = 200,
  targetCount,
  sphereRadius = 0.6,
  color = '#60a5fa',
  stiffness = 0.25,
  swirl = 0.8,
  noise = 0.4,
  drag = 0.98,
}: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const mat4 = useMemo(() => new THREE.Matrix4(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const v = useMemo(() => new THREE.Vector3(), [])
  const tmp = useMemo(() => ({
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    toC: new THREE.Vector3(),
    tang: new THREE.Vector3(),
    n: new THREE.Vector3(),
    center: new THREE.Vector3(...center),
  }), [center])

  // 풀 상태
  const active = useRef<boolean[]>(new Array(maxCap).fill(false))
  const posArr = useRef<Float32Array>(new Float32Array(maxCap * 3))
  const velArr = useRef<Float32Array>(new Float32Array(maxCap * 3))
  const seedArr = useRef<Float32Array>(new Float32Array(maxCap))

  // 초기화
  useEffect(() => {
    for (let i = 0; i < maxCap; i++) {
      const a = Math.random() * Math.PI * 2
      const r = Math.random() * radius * 0.9
      const y = (Math.random() * 2 - 1) * (halfHeight * 0.9)
      posArr.current[i * 3 + 0] = tmp.center.x + Math.cos(a) * r
      posArr.current[i * 3 + 1] = tmp.center.y + y
      posArr.current[i * 3 + 2] = tmp.center.z + Math.sin(a) * r
      velArr.current[i * 3 + 0] = (Math.random() - 0.5) * 0.2
      velArr.current[i * 3 + 1] = (Math.random() - 0.5) * 0.2
      velArr.current[i * 3 + 2] = (Math.random() - 0.5) * 0.2
      seedArr.current[i] = Math.random() * 1000
      active.current[i] = i < Math.min(maxCap, targetCount) // 초기 활성
    }
    meshRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  }, [maxCap, radius, halfHeight, targetCount, tmp.center])

  // 활성 개수 점진 조절(출렁임 방지)
  const [visibleN, setVisibleN] = useState(() => Math.min(maxCap, targetCount))
  useEffect(() => {
    let raf: number | null = null
    const step = () => {
      setVisibleN(n => {
        if (n === Math.min(maxCap, targetCount)) return n
        return n + Math.sign(Math.min(maxCap, targetCount) - n)
      })
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => { if (raf) cancelAnimationFrame(raf) }
  }, [targetCount, maxCap])

  // active 플래그를 visibleN에 맞춤
  useEffect(() => {
    let count = 0
    for (let i = 0; i < maxCap; i++) {
      const want = count < visibleN
      active.current[i] = want
      count += want ? 1 : 0
    }
  }, [visibleN, maxCap])

  // 업데이트 루프
  useFrame((state, dt) => {
    const t = state.clock.getElapsedTime()
    const m = meshRef.current
    if (!m) return

    for (let i = 0; i < maxCap; i++) {
      const ax = active.current[i]
      const I = i * 3
      tmp.pos.set(posArr.current[I + 0], posArr.current[I + 1], posArr.current[I + 2])
      tmp.vel.set(velArr.current[I + 0], velArr.current[I + 1], velArr.current[I + 2])

      if (ax) {
        // 힘장 계산
        tmp.toC.copy(tmp.center).sub(tmp.pos)                       // 중심으로 끌림
        const dstXZ = Math.hypot(tmp.toC.x, tmp.toC.z)
        // 원주(스월): +Y축 기준 접선
        tmp.tang.set(-tmp.toC.z, 0, tmp.toC.x).multiplyScalar(swirl / Math.max(1, dstXZ))
        // 난류(저주파)
        const s = seedArr.current[i]
        tmp.n.set(
          Math.sin(t * 0.9 + s) * noise,
          Math.cos(t * 1.3 + s * 1.3) * noise * 0.6,
          Math.sin(t * 1.1 + s * 2.1) * noise
        )
        // 합력
        tmp.vel
          .addScaledVector(tmp.toC, stiffness * dt) // 흡인
          .addScaledVector(tmp.tang, dt)            // 스월
          .addScaledVector(tmp.n, dt * 0.7)         // 난류
        tmp.vel.multiplyScalar(drag)                 // 감쇠
        tmp.pos.addScaledVector(tmp.vel, dt)         // 적분

        // 경계(원기둥) 유지: y 클램프 + XZ 랩
        if (tmp.pos.y > tmp.center.y + halfHeight) tmp.pos.y = tmp.center.y - halfHeight
        if (tmp.pos.y < tmp.center.y - halfHeight) tmp.pos.y = tmp.center.y + halfHeight
        const dx = tmp.pos.x - tmp.center.x
        const dz = tmp.pos.z - tmp.center.z
        const r2 = dx * dx + dz * dz
        if (r2 > radius * radius) {
          // 바깥으로 나가면 원주 가장자리로 랩
          const a = Math.atan2(dz, dx)
          tmp.pos.x = tmp.center.x + Math.cos(a) * radius * 0.98
          tmp.pos.z = tmp.center.z + Math.sin(a) * radius * 0.98
          // 바깥쪽 속도 제거
          const out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a))
          const vOut = tmp.vel.dot(out)
          tmp.vel.addScaledVector(out, -vOut)
        }
      } else {
        // 비활성: 화면 밖으로 치워두고(행렬만), 속도 서서히 감쇠
        tmp.vel.multiplyScalar(0.95)
        tmp.pos.y = -9999
      }

      // 저장
      posArr.current[I + 0] = tmp.pos.x
      posArr.current[I + 1] = tmp.pos.y
      posArr.current[I + 2] = tmp.pos.z
      velArr.current[I + 0] = tmp.vel.x
      velArr.current[I + 1] = tmp.vel.y
      velArr.current[I + 2] = tmp.vel.z

      // 행렬 쓰기(회전은 진행방향 대략)
      v.copy(tmp.vel).normalize()
      if (v.lengthSq() < 1e-6) v.set(0, 1, 0)
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v)
      mat4.compose(tmp.pos, q, ax ? new THREE.Vector3(1, 1, 1) : new THREE.Vector3(0, 0, 0))
      m.setMatrixAt(i, mat4)
    }
    m.instanceMatrix.needsUpdate = true
  }, 0)

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, maxCap]} frustumCulled={false}>
      <sphereGeometry args={[sphereRadius, 12, 12]} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} />
    </instancedMesh>
  )
}
```

### 붙이는 법

```tsx
// 기존 PhysicsSphere n개 → InstancedSpheres 하나로 대체
<InstancedSpheres
  center={[0, 20, 0]}
  radius={15}
  halfHeight={12}
  maxCap={160}          // 안전 여유치
  targetCount={computedFromIOPS}   // 30초마다 바뀌는 목표 개수
  sphereRadius={0.55}
/>
```

### 팁

* 목표 개수 급변 시에도 내부에서 **1개씩 점진 조정** → 프레임 출렁임 방지
* 더 큰 스케일(수백\~수천) 필요하면: 지오메트리를 더 낮은 분할(8×8), 머티리얼은 공유 하나만 유지
* 꼬리는 GhostTrails 그대로 유지 가능(타겟을 InstancedMesh 말고 **더미 Object3D 풀**에 매핑해서 찍고 싶다면 별도 헬퍼 필요)
---

# D. `PhysicsSphere` 마이크로 최적화

* 벡터 **재사용**: `new Vector3()`를 매 프레임 만들지 말고 `useRef` 캐싱(현재 파일에 재사용 버전도 존재. 이 패턴을 표준으로 통일).&#x20;
* 힘 적용 빈도 낮추기: 지금은 3프레임마다(`% 3 === 0`) 적용하는 버전도 있고(괜찮음), 더 줄여도 좋다(예: `% 5 === 0`).&#x20;
* 초기 속도/반발계수 다이어트: 반발이 높으면 충돌 계산이 잦아지고 오래 튄다. 현재 재질 세팅은 `restitution ~0.95` 근처인 버전이 많다. 필요 시 0.8 정도로 낮춰 충돌 후 잔진동을 줄이면 물리 스텝 안정적.&#x20;
* 머티리얼/지오메트리 **공유**: 같은 머티리얼을 여러 메시에 새로 만들지 말고 `useMemo`로 1개를 공유. (지금은 `<Sphere>` 내부 머티리얼을 각 인스턴스가 갖는 형태가 보인다. 공유 전환 권장.)&#x20;

---

# E. GhostTrails/주변 요소도 살짝 다이어트

Cylinder 내부 프레임이 출렁일 때, 동시에 바깥쪽 잔상(드로어/호스트)도 비용이 누적될 수 있어. `maxPer`, `life`, `spawnInterval`을 약간만 완화해도 체감이 좋아진다. 지금은 예시에 따라 `maxPer=14`, `spawnInterval≈0.02~0.035`로 꽤 빠르게 찍고 있어. 20\~30%만 낮춰도 효과가 크다.&#x20;

---

# F. (선택) 물리 월드 세팅

Cannon을 계속 쓸 거면, 루트의 `<Physics>`에 `broadphase="SAP"`, `allowSleep`, `iterations`/`tolerance` 보정을 주면 물리 step이 유리하다. (코드 상단에 `<Physics>`가 보이는 스니펫은 여기선 못 찾았지만, 씬 루트에서 설정 가능해.)

---

## 요약 적용 순서

1. **A 적용**: 전량 재생성 → **차등 증감**으로 변경. (핵심!)&#x20;
2. **B 적용**: 70ms 단위로 1개씩 증감하는 **스텝러** 추가.
3. 필요하면 **C-1 풀 고정**으로 마운트/언마운트 제거.
4. **D 최적화**로 GC/물리 스텝 부하 낮추기.
5. **E**로 GhostTrails 살짝 다이어트.

이렇게만 해도 “30초마다의 개수 변화”에 따른 프레임 급락-회복 싸이클은 눈에 띄게 줄어든다.