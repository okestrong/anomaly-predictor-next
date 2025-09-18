좋아. 첨부 코드 기준으로 아래 패치 적용하면 요구사항 전부 들어간다 — 랙 사이즈 ×2, 문 열림은 **GSAP 회전 애니메이션**, 서버 높이 슬림화, 서버 클릭 후 **크리스탈 큐브가 위로 “떠오르며” VM 공전**, 그리고 랙 뒷면 내부 **2/3 높이 라이트 글로우**까지.&#x20;

---

## 1) GSAP 추가 + 랙 사이즈 2배 & 도어 애니메이션

### (1) 상단 import

```diff
+ import { gsap } from 'gsap'
```

### (2) `ServerRack` 기본 크기 2배

```diff
- const ServerRack = ({ servers = 3, tex, size = [12, 28, 12], doorHinge='left' as 'left'|'right' }) => {
+ const ServerRack = ({ servers = 3, tex, size = [24, 56, 24], doorHinge='left' as 'left'|'right' }) => {
```

### (3) 서버 높이 슬림화(너무 두꺼웠던 부분 줄이기)

```diff
- const srvH = (innerH / (servers + 1)) * 0.8
+ const srvH = (innerH / (servers + 1)) * 0.55   // 높이 축소
  const srvW = innerW * 0.92
  const srvD = innerD * 0.9
```

### (4) 도어 회전은 damp → **GSAP**로, 도어가 사라지는 문제 방지(더블사이드)

```diff
   const doorPivot = useRef<THREE.Group>(null)
+  const serversGroupRef = useRef<THREE.Group>(null)
+  const doorMeshRef = useRef<THREE.Mesh>(null)

- // 도어 회전 애니메이션(damp)
- useFrame((_s,dt)=>{
-   const target = open ? (doorHinge==='left' ? Math.PI/1.8 : -Math.PI/1.8) : 0
-   angleRef.current = THREE.MathUtils.damp(angleRef.current, target, 6, dt)
-   if (doorPivot.current) doorPivot.current.rotation.y = angleRef.current
- })
+ // 도어 회전은 GSAP으로 부드럽게
+ useEffect(()=>{
+   const y = open ? (doorHinge==='left' ? Math.PI/1.8 : -Math.PI/1.8) : 0
+   if (doorPivot.current) {
+     gsap.to(doorPivot.current.rotation, { y, duration: 0.6, ease: 'power3.out' })
+   }
+   // 문 열릴 때 내부 서버 보이기 / 닫히면 숨김
+   if (serversGroupRef.current) {
+     serversGroupRef.current.visible = open
+   }
+ }, [open, doorHinge])
```

문 클릭 핸들러는 그대로 `setOpen(v=>!v)` 유지.

```diff
- <group
+ <group
    ref={doorPivot}
    position={[ (doorHinge==='left' ? -w/2 : w/2), 0, d/2 + 0.2 ]}
  >
-   <mesh position={[ (doorHinge==='left' ? w/2 : -w/2), 0, 0 ]} onClick={onFrontClick}>
+   <mesh ref={doorMeshRef} position={[ (doorHinge==='left' ? w/2 : -w/2), 0, 0 ]} onClick={onFrontClick}>
      <planeGeometry args={[w, h]}/>
-     {tex?.rackFront ? (
-       <meshStandardMaterial map={tex.rackFront} metalness={0.6} roughness={0.55} />
+     {tex?.rackFront ? (
+       <meshStandardMaterial map={tex.rackFront} metalness={0.6} roughness={0.55} side={THREE.DoubleSide}/>
      ) : (
-       <meshStandardMaterial color={0x1f2937} metalness={0.7} roughness={0.5} emissive={0x0ea5e9} emissiveIntensity={0.2} />
+       <meshStandardMaterial color={0x1f2937} metalness={0.7} roughness={0.5} emissive={0x0ea5e9} emissiveIntensity={0.2} side={THREE.DoubleSide}/>
      )}
    </mesh>
  </group>
```

### (5) 내부 서버는 문 열릴 때만 보이도록(간단/확실)

```diff
- {/* 서버들 (아래에서 위로) */}
- <group position={[0, -innerH/2 + srvH*0.6, 0]}>
+ {/* 서버들 (아래에서 위로) — 도어가 열릴 때만 표시 */}
+ <group ref={serversGroupRef} visible={false} position={[0, -innerH/2 + srvH*0.6, 0]}>
   { /* ...ServerUnit 반복... */ }
  </group>
```

---

## 2) 서버 클릭 후 “크리스탈 큐브가 위로 떠올라” + VM 공전

`ServerUnit` 안의 **큐브/VM 그룹**에 부양 애니메이션을 추가한다.

```diff
 const ServerUnit = ({ size=[8,2.4,10], ... }) => {
   const meshRef = useRef<THREE.Mesh>(null)
   const slide = useRef(0) // 0~1
+  const rise = useRef(0)  // 0~1. 선택 시 큐브가 위로 부양
+  const vmGroupRef = useRef<THREE.Group>(null)

   useFrame((_s, dt) => {
     const target = selected ? 1 : 0
     slide.current = THREE.MathUtils.damp(slide.current, target, 6, dt)
+    rise.current  = THREE.MathUtils.damp(rise.current,  target, 2.5, dt)

     if (meshRef.current) {
       meshRef.current.position.z = THREE.MathUtils.lerp(0, size[2]*0.75, slide.current)
     }
+    // VM 그룹: 위로 천천히 상승 + 회전
+    if (vmGroupRef.current) {
+      const up = THREE.MathUtils.lerp(0, 1.2, rise.current)       // 최대 1.2 상승
+      vmGroupRef.current.position.set(0, size[1]*0.9 + up, 0)
+      vmGroupRef.current.rotation.y += 0.02 * rise.current         // 선택 시에만 점차 회전 가속
+    }
   })
...
- {selected && (
-   <group position={[0, size[1]*0.9, 0]}>
+ {selected && (
+   <group ref={vmGroupRef} position={[0, size[1]*0.9, 0]}>
      <Box args={[2.2, 1.4, 2.2]}>
        <meshPhysicalMaterial
          color={0x67e8f9}
          transparent opacity={0.12}
          metalness={0.0} roughness={0.1}
          transmission={0.8} thickness={0.3}
        />
      </Box>
      <VMParticles/>
   </group>
 )}
```

> 슬라이드가 끝나갈수록 큐브가 **부드럽게 상승**하고, VM 입자군도 **천천히 자전**이 붙는다.

---

## 3) 랙 뒷면 내부 **2/3 높이 글로우** (뒤→앞으로 비쳐오는 느낌)

랙 내부 뒤쪽에 얇은 **라이트 카드(발광 평면)** + **스포트라이트**를 심는다.

```diff
   // 랙 외장/내부 섀시 아래에 추가
+  // --- Back inner glow (height 2/3) ---
+  const glowY = h * (2/3) - h/2          // 로컬 원점 기준
+  const backZ = -innerD/2 + 0.3          // 뒤판 바로 앞
+  // 라이트 카드(투명/가산 블렌딩)
+  <mesh position={[0, glowY, backZ]} rotation={[0,0,0]}>
+    <planeGeometry args={[innerW*0.85, innerH*0.25]}/>
+    <meshBasicMaterial
+      color={0x38bdf8}
+      transparent opacity={0.25}
+      blending={THREE.AdditiveBlending}
+      depthWrite={false}
+    />
+  </mesh>
+  {/* 뒤→앞으로 쏘는 스포트 라이트(미세) */}
+  <spotLight
+    color={0x60a5fa}
+    intensity={0.6}
+    distance={innerD*2.0}
+    angle={Math.PI/6}
+    penumbra={0.6}
+    position={[0, glowY, backZ - 0.2]}
+    target-position={[0, glowY, innerD/2]}
+  />
```

> 라이트 카드는 **가산 블렌딩**으로 내부 재질 위에 은은한 하이라이트가 “비쳐 들어오는” 느낌을 준다. 스포트는 살짝만.

---

## 4) 3개 랙의 **위치 y** 재계산(크기 2배에 맞춰 바닥에 딱)

현재 `Table` 그룹이 `position={[0,10,0]}`라 **로컬 중심 y=10**.
높이 H=**56** 이므로 **센터 y = H/2 − 10 = 18**이 바닥(y=0) 착지 조건.

```diff
- const rackPos = [
-   [base[0] - tangent.x*gap, 4,  base[2] - tangent.z*gap] as [number,number,number],
-   [base[0],                 4,  base[2]                 ] as [number,number,number],
-   [base[0] + tangent.x*gap, 4,  base[2] + tangent.z*gap] as [number,number,number],
- ]
+ const rackPos = [
+   [base[0] - tangent.x*gap, 18, base[2] - tangent.z*gap] as [number,number,number],
+   [base[0],                 18, base[2]                 ] as [number,number,number],
+   [base[0] + tangent.x*gap, 18, base[2] + tangent.z*gap] as [number,number,number],
+ ]
```

> 이렇게 하면 랙 하단이 **정확히 y=0**(바닥) 에 닿는다.

---

## 5) 자잘한 마감

* 도어 평면이 특정 각도에서 안 보이는 문제 → `side={THREE.DoubleSide}`로 해결(위 반영됨).
* 서버 클릭 영역이 문과 겹칠 수 있으니 **문 열림 상태에서만 서버 클릭**을 쓰고 싶다면 `open && onClick` 형태로 제한해도 된다.
* 랙 텍스처는 이미 `/3d/textures/rack/...` 경로로 로드 중(첨부 코드 기준). 필요 시 정상 경로 확인.

---

## 결과

* 랙은 **기존 대비 2배**.
* 정면 클릭 시 **GSAP** 애니메이션으로 도어가 열린다(사라지지 않음), 열리면 랙당 **3/4/4** 서버가 보임.
* 서버는 더 **슬림**하게.
* 서버 클릭 → 앞으로 **슬라이드** + **크리스탈 큐브가 위로 떠오르며**, 사이버 컬러 VM들이 **뱅글뱅글 공전**.
* 랙 내부 뒤쪽 **2/3 높이**에서 **빛이 비쳐오는 글로우**가 추가.

필요하면 도어 여닫이 각도(현재 ±\~100°), 큐브 상승량(현재 1.2), 글로우 밝기/색상 한 번에 맞춰준다.
