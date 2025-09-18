좋아. 서버랙을 “실제 랙처럼” 꽂히는 서버·HDD·도어 인터랙션까지 갖춘 컴포넌트로 추가하자. **기존 파일( WorldTrafficView\.tsx )에 바로 붙여 넣어서 동작**하도록, 랙/서버/VM 파티클까지 포함한 드롭인 코드를 준비했다. 그리고 **래크 위치는 테이블 좌측 drawer 두 개의 “바깥 방향”으로 20만큼 떨어져** 3랙을 일렬 배치한다.&#x20;

---

# 1) WorldTrafficView\.tsx — 컴포넌트 추가

아래 코드를 파일 상단 import들 아래(같은 파일) **그대로** 추가해.

```tsx
// ------ Server Racks (Door, Servers, HDD, VM Particles) ------
import { useTexture } from '@react-three/drei'

// 간단한 VM 파티클: 반투명 아쿠아 큐브 위에서 사이버 색상의 점들이 공전
const VMParticles = ({ count=12, radius=0.8, speed=1.2, colors=[0x00e5ff, 0x7c3aed, 0x22d3ee] }) => {
  const grp = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!grp.current) return
    const t = state.clock.getElapsedTime()*speed
    grp.current.children.forEach((m, i) => {
      const phase = (i / count) * Math.PI*2 + t * 0.6
      const r = radius * (0.75 + 0.25*Math.sin(t*0.9 + i))
      const y = 0.15*Math.sin(t*1.3 + i)
      m.position.set(Math.cos(phase)*r, y, Math.sin(phase)*r)
      m.rotation.y += 0.03
    })
  })
  return (
    <group ref={grp}>
      {Array.from({length: count}, (_,i)=>(
        <Icosahedron key={i} args={[0.06,0]}>
          <meshStandardMaterial color={colors[i%colors.length]} emissive={colors[i%colors.length]} emissiveIntensity={1.2} metalness={0.3} roughness={0.4}/>
        </Icosahedron>
      ))}
    </group>
  )
}

type TexSet = {
  rackFront?: THREE.Texture; rackSide?: THREE.Texture; rackTop?: THREE.Texture; serverFront?: THREE.Texture
}

// 1U 서버 유닛(여기서는 3U 정도 크기로 보이게): 클릭 시 앞으로 슬라이드 + VM 파티클 표시
const ServerUnit = ({
  size=[8,2.4,10],  // [w,h,d]
  hddCount=3,
  frontTex,
  onClick, selected=false
}: { size?:[number,number,number], hddCount?:number, frontTex?:THREE.Texture, onClick?:()=>void, selected?:boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  // 슬라이드 애니메이션
  const slide = useRef(0) // 0~1
  useFrame((_s, dt) => {
    const target = selected ? 1 : 0
    slide.current = THREE.MathUtils.damp(slide.current, target, 6, dt)
    if (meshRef.current) {
      // 로컬 +Z 방향으로 튀어나오게(랙 정면 클릭을 기준으로 우리가 서버를 +Z가 앞이라고 정의)
      meshRef.current.position.z = THREE.MathUtils.lerp(0, size[2]*0.75, slide.current)
    }
  })

  // HDD 3개 (좌→우)
  const hddW = size[0]*0.22, hddH=size[1]*0.35, hddD=size[2]*0.6
  const hddY = 0
  const hddZ = -size[2]*0.15

  return (
    <group>
      <mesh ref={meshRef} onClick={onClick} castShadow receiveShadow>
        <boxGeometry args={size}/>
        {frontTex ? (
          // 앞면에만 텍스처, 나머지는 어두운 금속
          <meshStandardMaterial attach="material-0" color={0x1f2937} metalness={0.8} roughness={0.35}/>
        ) : null}
        <meshStandardMaterial attach="material-1" color={0x111827} metalness={0.8} roughness={0.4}/>
        <meshStandardMaterial attach="material-2" color={0x111827} metalness={0.8} roughness={0.4}/>
        <meshStandardMaterial attach="material-3" color={0x111827} metalness={0.8} roughness={0.4}/>
        <meshStandardMaterial attach="material-4" color={0x111827} metalness={0.8} roughness={0.4}/>
        {/* 앞면 */}
        <meshStandardMaterial
          attach="material-5"
          map={frontTex}
          color={0xffffff}
          metalness={0.6}
          roughness={0.5}
          emissive={0x0ea5e9}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* HDD 3개 (서버 내부) */}
      {Array.from({length:hddCount},(_,i)=>{
        const x = ((i-(hddCount-1)/2))* (hddW*1.15)
        return (
          <mesh key={i} position={[x,hddY,hddZ]} castShadow receiveShadow>
            <boxGeometry args={[hddW, hddH, hddD]}/>
            <meshStandardMaterial color={0x1f2937} metalness={0.7} roughness={0.45} emissive={0x38bdf8} emissiveIntensity={0.1}/>
          </mesh>
        )
      })}

      {/* VM 파티클 (서버가 튀어나올 때만) + 아쿠아 큐브 */}
      {selected && (
        <group position={[0, size[1]*0.9, 0]}>
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
    </group>
  )
}

// 서버랙(문 여닫이, 내부에 서버들 배치). 정면 클릭: 도어 오픈/클로즈
const ServerRack = ({
  servers=3,
  tex,  // TexSet
  size=[12, 28, 12], // [w,h,d]
  doorHinge='left' as 'left'|'right'
}) => {
  const rackRef = useRef<THREE.Group>(null)
  const doorPivot = useRef<THREE.Group>(null)
  const [open, setOpen] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState<number|null>(null)

  // 도어 회전 애니메이션
  const angleRef = useRef(0)
  useFrame((_s,dt)=>{
    const target = open ? (doorHinge==='left' ? Math.PI/1.8 : -Math.PI/1.8) : 0
    angleRef.current = THREE.MathUtils.damp(angleRef.current, target, 6, dt)
    if (doorPivot.current) doorPivot.current.rotation.y = angleRef.current
  })

  // 랙 외장
  const [w,h,d] = size
  const frameThick = 0.4
  const innerW = w - frameThick*2
  const innerH = h - frameThick*2
  const innerD = d - frameThick*2

  // 서버 높이 간격 계산
  const srvH = innerH / (servers + 1) * 0.8
  const srvW = innerW * 0.92
  const srvD = innerD * 0.9

  // 클릭: 도어 토글
  const onFrontClick = (e:any) => { e.stopPropagation(); setOpen(v=>!v) }

  return (
    <group ref={rackRef}>
      {/* 랙 프레임 */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w,h,d]}/>
        <meshStandardMaterial color={0x0b1220} metalness={0.9} roughness={0.25}/>
      </mesh>

      {/* 상/하/좌/우 면 텍스처(있으면 적용) */}
      {tex?.rackTop && (
        <mesh position={[0, h/2+0.01, 0]} rotation={[-Math.PI/2,0,0]}>
          <planeGeometry args={[w, d]}/>
          <meshStandardMaterial map={tex.rackTop} metalness={0.6} roughness={0.5}/>
        </mesh>
      )}
      {tex?.rackSide && (
        <>
          <mesh position={[ -w/2-0.01, 0, 0]} rotation={[0, Math.PI/2, 0]}>
            <planeGeometry args={[d, h]}/>
            <meshStandardMaterial map={tex.rackSide} metalness={0.6} roughness={0.5}/>
          </mesh>
          <mesh position={[  w/2+0.01, 0, 0]} rotation={[0,-Math.PI/2, 0]}>
            <planeGeometry args={[d, h]}/>
            <meshStandardMaterial map={tex.rackSide} metalness={0.6} roughness={0.5}/>
          </mesh>
        </>
      )}

      {/* 내부 섀시(어두운 프레임) */}
      <mesh position={[0,0, -frameThick*0.2]}>
        <boxGeometry args={[innerW, innerH, innerD+0.2]}/>
        <meshStandardMaterial color={0x0f172a} metalness={0.8} roughness={0.45}/>
      </mesh>

      {/* 서버들 (아래에서 위로) */}
      <group position={[0, -innerH/2 + srvH*0.6, 0]}>
        {Array.from({length: servers}, (_,i)=>{
          const y = i * (srvH*1.1)
          return (
            <group key={i} position={[0, y, -innerD/2 + srvD/2 + 0.6]}>
              <ServerUnit
                size={[srvW, srvH, srvD]}
                hddCount={3}
                frontTex={tex?.serverFront}
                selected={selectedIdx===i}
                onClick={(e)=>{ e?.stopPropagation?.(); setSelectedIdx(idx=> idx===i ? null : i) }}
              />
            </group>
          )
        })}
      </group>

      {/* 도어(정면 패널) — 한쪽 힌지로 회전 */}
      <group
        ref={doorPivot}
        position={[ (doorHinge==='left' ? -w/2 : w/2), 0, d/2 + 0.01 ]}
        // 회전축: Y
      >
        <mesh position={[ (doorHinge==='left' ? w/2 : -w/2), 0, 0 ]} onClick={onFrontClick}>
          <planeGeometry args={[w, h]}/>
          {tex?.rackFront ? (
            <meshStandardMaterial map={tex.rackFront} metalness={0.6} roughness={0.55} />
          ) : (
            <meshStandardMaterial color={0x1f2937} metalness={0.7} roughness={0.5} emissive={0x0ea5e9} emissiveIntensity={0.2}/>
          )}
        </mesh>
      </group>
    </group>
  )
}
```

---

# 2) WorldTrafficView\.tsx — 랙 텍스처 로드 & 위치 배치

**Table 컴포넌트 내부**에 다음을 추가/수정한다.

### (a) 텍스처 로드

`useEffect(() => { (async () => { ... })(); }, [])` 아래쪽에 이어서:

```tsx
// Rack / Server 텍스처
texturesRef.current.rackFront = await loadTexture('/3d/textures/rack-front.jpg')
texturesRef.current.rackSide  = await loadTexture('/3d/textures/rack-side.jpg')
texturesRef.current.rackTop   = await loadTexture('/3d/textures/rack-top.jpg')
texturesRef.current.serverFront = await loadTexture('/3d/textures/server-front.jpg')
```

### (b) “drawer 뒤쪽, 테이블로부터 20만큼 바깥” 계산 유틸

`Table` 컴포넌트 안에 헬퍼 하나 추가:

```tsx
const outwardFromCenter = (p:[number,number,number]) => {
  const v = new THREE.Vector3(p[0], 0, p[2]).normalize()
  return [v.x, 0, v.z] as [number,number,number]
}
const placeBehind = (p:[number,number,number], dist:number) =>{
  const n = outwardFromCenter(p)
  return [p[0] + n[0]*dist, 0, p[2] + n[2]*dist] as [number,number,number]
}
const faceTowardCenterY = (p:[number,number,number]) => {
  const ang = Math.atan2(p[2]-0, p[0]-0) + Math.PI   // 링 중심(0,0)에 정면
  return [0, ang, 0] as [number,number,number]
}
```

### (c) 랙 3개 배치(각 랙 서버 수: 3, 4, 4)

드로어 두 개는 `drawerData[2]`, `drawerData[3]`에 이미 있음. 두 위치의 **중간 지점**을 기준으로 바깥 방향을 잡고, 그 선상에 3개 랙을 **가로로** 나란히 놓자.

```tsx
// 랙 배치 기준점(좌측 drawer 2개의 중간)
const dL = drawerData[2].position
const dR = drawerData[3].position
const mid: [number,number,number] = [ (dL[0]+dR[0])/2, 0, (dL[2]+dR[2])/2 ]
const base = placeBehind(mid, 20) // 테이블로부터 20만큼 바깥
const baseRot = faceTowardCenterY(base)

// 가로 나열을 위한 접선 벡터(좌우로 벌리기)
const center = new THREE.Vector3(0,0,0)
const dir = new THREE.Vector3(base[0],0,base[2]).sub(center).normalize()
const tangent = new THREE.Vector3(-dir.z, 0, dir.x) // 좌우 방향
const gap = 16 // 랙 간격

const rackPos = [
  [ base[0] - tangent.x*gap, 14, base[2] - tangent.z*gap ] as [number,number,number],
  [ base[0],                 14, base[2]                 ] as [number,number,number],
  [ base[0] + tangent.x*gap, 14, base[2] + tangent.z*gap ] as [number,number,number],
]
```

> `y=14`는 랙 높이 28의 절반(바닥 y=0에 놓이도록). 필요하면 살짝 올리거나 내리면 된다.

### (d) JSX에 랙 3개 추가 (Drawer 두 개 뒤쪽)

`<Drawer ... />` 두 줄 바로 아래에 추가:

```tsx
{/* Server Racks (3 racks behind drawers) */}
{textureReady && (
  <group>
    {/* servers per rack: 3, 4, 4 */}
    <group position={rackPos[0]} rotation={baseRot}>
      <ServerRack servers={3} tex={texturesRef.current} />
    </group>
    <group position={rackPos[1]} rotation={baseRot}>
      <ServerRack servers={4} tex={texturesRef.current} />
    </group>
    <group position={rackPos[2]} rotation={baseRot}>
      <ServerRack servers={4} tex={texturesRef.current} doorHinge="right"/>
    </group>
  </group>
)}
```

> 정면 클릭: 도어 열림(한쪽 힌지).
> 서버 전면 클릭: 해당 서버만 앞으로 슬라이드 + **아쿠아 큐브 + 사이버 컬러 VM 파티클 공전**.

---

# 3) 포인트

* **실제 랙처럼**: 프레임 + 도어(힌지 회전) + 내부 섀시 + 서버 유닛(전면 텍스처) + HDD 3개.
* **인터랙션**: 랙 정면 클릭→문 열기, 서버 클릭→슬라이드 아웃 + VM 이펙트.
* **위치**: 좌측 drawer들의 바깥 방향으로 “테이블에서 20” 떨어진 곳에 3랙 일렬 배치.
* **텍스처**: `rack-front.jpg`, `rack-side.jpg`, `rack-top.jpg`, `server-front.jpg` 사용. 파일 경로는 `/3d/textures/…` 로 넣었다. 경로가 다르면 `loadTexture` 경로만 바꿔주면 된다.
* **성능/안정성**: 애니메이션은 `useFrame + damp` 기반, 재마운트 없이 상태만 바뀜.

필요 시: 랙/서버 크기, 간격(`gap`), 도어 회전 각(`π/1.8`), 서버 슬라이드 거리(`size[2]*0.75`)를 취향에 맞게 조절하자.