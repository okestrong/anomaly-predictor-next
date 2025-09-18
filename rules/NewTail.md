좋다. **`<Trail>` 완전 배제**하고, **유성(혜성)처럼 보이는 꼬리**를 3가지 방식으로 구현해 줄게.
핵심은 “프레임 간 점을 **연결하지 않고**(= 텔레포트/리마운트 이슈 무효화)”, **한 오브젝트만**으로 꼬리를 그려서 깜빡임 원인을 제거하는 거다.

---

# A) 속도-스트레치 빌보드(권장, 가장 안정적)

공(스피어)의 **이동 벡터 방향으로 늘어나는 한 장의 메쉬**를 붙여 “혜성 꼬리”처럼 보이게 한다.
프레임 연결이 없어서 텔레포트/리마운트/좌표계 불일치로 인한 수직선이 **절대** 안 생긴다.

## 1) CometTail 컴포넌트

```tsx
// CometTail.tsx
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import React, { useMemo, useRef } from 'react'

type Props = {
  target: React.RefObject<THREE.Object3D>        // 따라갈 공
  color?: string | number
  width?: number                                  // 꼬리 두께
  maxLength?: number                              // 꼬리 최대 길이(월드 단위)
  speedToLength?: number                          // 속도→길이 변환 계수
  teleportDist?: number                           // 텔레포트 판정 임계값
}

export default function CometTail({
  target,
  color = '#00f0ff',
  width = 0.35,
  maxLength = 6,
  speedToLength = 0.025,
  teleportDist = 5,
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const prev = useRef(new THREE.Vector3())
  const ready = useRef(false)
  const tmp = useMemo(() => ({
    curr: new THREE.Vector3(),
    vel:  new THREE.Vector3(),
    dir:  new THREE.Vector3(),
    quat: new THREE.Quaternion(),
    zAxis: new THREE.Vector3(0, 0, 1),
  }), [])

  // 단순 그라디언트 쉐이더 (머리=불투명, 꼬리=투명)
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform vec3 uColor;
          void main() {
            // vUv.y: 꼬리 방향(0=꼬리 끝, 1=머리)
            float head = smoothstep(0.6, 1.0, vUv.y);
            float alpha = head * 0.9 + (1.0 - head) * 0.4; // 머리 쪽 더 진하게
            // 측면 소실
            float side = smoothstep(0.0, 0.15, vUv.x) * (1.0 - smoothstep(0.85, 1.0, vUv.x));
            alpha *= side;
            gl_FragColor = vec4(uColor, alpha);
          }
        `,
      }),
    [color]
  )

  // 길이가 +Z 축인 1x1x1 상자(박스)를 스케일로 늘린다 → 방향 회전은 +Z→velocity
  const geom = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])

  useFrame((_, dt) => {
    const t = target.current
    const m = meshRef.current
    if (!t || !m) return

    t.getWorldPosition(tmp.curr)

    if (!ready.current) {
      prev.current.copy(tmp.curr)
      m.visible = false
      ready.current = true
      return
    }

    tmp.vel.copy(tmp.curr).sub(prev.current)
    const dist = tmp.vel.length()

    // 텔레포트/리셋 감지 → 꼬리 없이 재시작
    if (dist > teleportDist) {
      prev.current.copy(tmp.curr)
      m.visible = false
      return
    }

    // 속도 기반 길이
    const speed = dist / Math.max(dt, 1e-4) // units/sec
    const length = Math.min(maxLength, speedToLength * speed)

    if (length < 0.01) {
      m.visible = false
      prev.current.copy(tmp.curr)
      return
    }

    // 방향 정규화
    tmp.dir.copy(tmp.vel).normalize()
    // +Z → dir 회전
    tmp.quat.setFromUnitVectors(tmp.zAxis, tmp.dir)
    m.quaternion.copy(tmp.quat)

    // 꼬리 메쉬: 공의 뒤쪽에 절반만큼 오프셋
    m.position.copy(tmp.curr).addScaledVector(tmp.dir, -length * 0.5)
    m.scale.set(width, width, length)
    m.visible = true

    // 다음 프레임 대비
    prev.current.copy(tmp.curr)
  }, -1) // 다른 업데이트보다 먼저 실행해도 OK

  return <mesh ref={meshRef} geometry={geom} material={material} frustumCulled={false} />
}
```

## 2) 사용법

공을 만드는 곳(예: `DataParticles`)에서 각 공의 ref를 `CometTail`에 전달:

```tsx
// 공(스피어) ref가 있다 가정: drawerParticleRefs.current[i]
<Sphere ref={(r) => (drawerParticleRefs.current[i] = r!)} args={[0.6]} /* ... */>
  {/* 공의 머리 재질 */}
</Sphere>

{/* 꼬리 붙이기 */}
<CometTail
  target={ { current: drawerParticleRefs.current[i] } }
  color="#00e8ff"
  width={0.3}
  maxLength={6}
  speedToLength={0.03}
/>
```

> **장점**:
>
> * Trail 같은 프레임 기록/버퍼가 **없다** → 텔레포트/리마운트/좌표계 불일치에 **완전 면역**
> * 한 메쉬만 움직이므로 **성능 안정적**
> * Bloom 켜져 있으면 자동으로 **‘유성처럼’** 보임

> **텔레포트 시 주의**: 공을 새 시작점으로 순간이동할 때는 `CometTail`이 자동으로 감지(거리 `teleportDist`)해서 꼬리를 끄고 다시 시작한다. 필요하면 값 조정.

---

# B) 리본(리스트립) 방식 — 최근 N프레임만 이어 그리기

Trail 대신 **내가 관리하는 포인트 deque**로 짧은 리본만 그린다. 텔레포트 시 **deque를 즉시 클리어**하면 “총쏘는 선”이 절대 못 생긴다.

```tsx
import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import React, { useMemo, useRef } from 'react'

function RibbonTail({ target, maxPoints = 16, width = 6, color = '#00e8ff', teleportDist = 5 }) {
  const points = useRef<THREE.Vector3[]>([])
  const lineRef = useRef<any>(null)
  const prev = useRef(new THREE.Vector3())
  const ready = useRef(false)
  const tmp = useMemo(() => ({ curr: new THREE.Vector3() }), [])

  useFrame(() => {
    const t = target.current
    if (!t) return
    t.getWorldPosition(tmp.curr)

    if (!ready.current) {
      prev.current.copy(tmp.curr)
      points.current = [tmp.curr.clone()]
      ready.current = true
      return
    }

    // 텔레포트 감지
    if (tmp.curr.distanceTo(prev.current) > teleportDist) {
      points.current = [tmp.curr.clone()]
      prev.current.copy(tmp.curr)
      return
    }

    // 새 포인트 push
    points.current.push(tmp.curr.clone())
    if (points.current.length > maxPoints) points.current.shift()

    // Line 업데이트
    lineRef.current?.setPoints(points.current)

    prev.current.copy(tmp.curr)
  }, -1)

  return (
    <Line
      ref={lineRef}
      points={points.current}
      color={color}
      linewidth={width}           // 화면 픽셀 기준(three-fiber/drei의 Line)
      transparent
      depthWrite={false}
      opacity={0.9}
    />
  )
}
```

* 텔레포트 시 `points = [curr]`로 **즉시 리셋** → 수직 연결선 **불가**
* `maxPoints`를 8\~20 사이에서 조절하면 길이 조절
* Bloom과 같이 쓰면 충분히 유성 느낌

---

# C) 고스트(잔상) 인스턴스 방식 — 아주 가볍고 예쁘다

공의 과거 위치를 **작은 점/스피어 N개**로 남겨서 알파/스케일이 시간에 따라 줄어들게 한다. Trail/Line 없음.

아이디어:

* `InstancedMesh`로 N개의 “고스트” 생성
* 매 프레임 `spawnIndex`에 현재 위치 기록, 각 고스트에 `age` 증가
* `age`→알파/스케일로 페이드아웃
* 텔레포트 시 `age=1`로 초기화(즉시 사라짐)

장점: **그 어떤 연결선도 없음**. 텔레포트/토글/좌표계 논쟁에서 자유.

---

## 어떤 방식을 쓰면 좋나?

* **가장 안정/간단**: **A) 속도-스트레치 빌보드**

    * 코드량 적고, 텔레포트에도 강함
    * “유성 꼬리” 핵심 이미지를 정확히 전달

* “길이 있는 실제 궤적” 느낌: **B) 리본**

    * 내 deque를 내가 지워서 **절대 수직선이 안 생김**

* “반짝이는 잔상” 컨셉: **C) 고스트 인스턴스**

    * 성능 최고, 시각적으로 세련됨

원하는 연출/성능 타깃에 맞춰 섞어도 된다. 예를 들어 **A + 약한 Bloom**이면 지금 장면에서도 바로 “혜성”처럼 보인다.

---

## 통합 팁

* Bloom이 강하면 꼬리 길이가 더 길게 느껴진다 → 빌보드 `maxLength`를 4~6 사이로 조절
* 순간이동 직후 첫 1~2프레임은 꼬리 `visible=false`로 둘 수 있다(위 A/C는 자동으로 처리)
* 빌보드/리본/고스트 메쉬 재질은 `transparent=true`, `depthWrite=false`, `AdditiveBlending` 추천
