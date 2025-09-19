# C-2. 물리 제거 + InstancedMesh로 전환

## 언제 쓰나

* 실린더 내부 구슬이 **서로 충돌할 필요가 없고**, 벽(경계)만 대충 지키면 됨
* “시각 효과 + 대량 동체”가 목적 (수십\~수천 개)
  → Cannon을 빼고 **InstancedMesh** 하나로 **행렬만 업데이트**하면 프레임 안정도가 급상승한다.

## 핵심 아이디어

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