끊김은 “계속 늘어나는 연산/GC 압력 + 렌더링 부하(섀도/포스트)”가 겹친 결과다. 아래가 파일 기준의 **핫스팟**과 바로 적용 가능한 **수정안**이다.

---

## 어디서 병목이 생기는지 (파일 기준)

* **PhysicsSphere 매 프레임 객체 생성 → GC 스파이크**

    * `useFrame` 안에서 `new THREE.Vector3(...)`를 여러 번 생성한다. 프레임마다 구체(20개 내외) × 벡터(5\~7개) 만큼 객체가 할당되고, 몇 분 지나면 GC 스톨/스파이크로 ‘끊김’이 발생한다.&#x20;
* **고해상도 그림자**

    * 주광원 섀도 맵이 2048²다. 이 크기는 비용이 크고 포스트프로세싱과 겹치면 GPU가 바빠진다.&#x20;
* **포스트 프로세싱(블룸/BC)**

    * 블룸과 밝기/대비가 항상 켜져 있다. 저사양에서 지속적인 fill-rate 부담.&#x20;
* **높은 DPR 상한**

    * `dpr={[1, 1.5]}`로 상한이 1.5라서 고해상도 화면에서 픽셀 수가 크게 증가한다.&#x20;
* **GhostTrails 포인트 버짓**

    * 파티클당 최대 잔상 `maxPer=14`로 설정. 대상 수(드로어/호스트 총합) × 14 만큼 포인트 버퍼를 매 프레임 업데이트한다. 장면이 복잡한 상태에선 굳이 14까지 필요하지 않은 경우가 많다.&#x20;

---

## 바로 효과 나는 수정안 (상위 → 하위 임팩트 순)

### 1) PhysicsSphere: **벡터 재사용**으로 GC 제거

프레임마다 생성하지 말고, `useMemo/useRef`로 재사용 벡터를 잡아둔다. 또한 `clone()` 대신 `copy()`를 쓰면 추가 할당을 줄인다.

```tsx
// PhysicsSphere 내부
const centerV = useMemo(() => new THREE.Vector3(...centerPosition), [centerPosition]);
const posV = useRef(new THREE.Vector3());
const dirV = useRef(new THREE.Vector3());
const perpV = useRef(new THREE.Vector3());
const chaosV = useRef(new THREE.Vector3());
const totalForceV = useRef(new THREE.Vector3());
const impulseV = useRef(new THREE.Vector3());

useFrame((state) => {
  if (!ref.current) return;

  const pos = ref.current.position;
  posV.current.set(pos.x, pos.y, pos.z);

  const time = state.clock.elapsedTime;

  // 방향(센터 - 현재) = copy 로 할당 재사용
  dirV.current.copy(centerV).sub(posV.current).normalize();
  const distance = posV.current.distanceTo(centerV);

  frameCount.current++;
  if (frameCount.current % 3 === 0) {
    perpV.current.set(-dirV.current.z, 0, dirV.current.x).multiplyScalar(1.0);
    chaosV.current.set(Math.sin(time * 3) * 0.5, Math.sin(time * 2) * 0.4, Math.cos(time * 4) * 0.5);

    const gravityStrength = Math.min(distance * 0.04, 0.8);
    // dirV 를 그대로 스케일 (새 벡터 생성 금지)
    dirV.current.multiplyScalar(gravityStrength);

    totalForceV.current.set(0, 0.5, 0) // anti-gravity
      .add(perpV.current)
      .add(chaosV.current)
      .add(dirV.current);

    api.applyForce([totalForceV.current.x, totalForceV.current.y, totalForceV.current.z], [0, 0, 0]);
  }

  // 드문 임펄스도 재사용 벡터로
  if (Math.random() < 0.003) {
    impulseV.current.set((Math.random()-0.5)*2, (Math.random()-0.5)*1.5, (Math.random()-0.5)*2);
    api.applyImpulse([impulseV.current.x, impulseV.current.y, impulseV.current.z], [0, 0, 0]);
  }
});
```

> 원인과 맥락: 현재는 `useFrame` 안에서 `new THREE.Vector3(...)`가 여럿 생성되고 있다. 이 부분을 모두 재사용으로 바꾸면 장시간 구동 시 발생하던 GC 스파이크가 크게 줄어든다.&#x20;

### 2) **DPR/렌더러 옵션 하향** (상황에 따라 자동 디그레이드)

* 기본 DPR을 1로 고정하고(특히 데스크톱 고해상도), 저하 시 포스트를 끈다.

```tsx
// <Canvas ...> 교체
<Canvas
  camera={{ position: [-150, 120, 50], fov: 60, near: 0.1, far: 2000 }}
  dpr={[1, 1]}                        // ← 상한 1로 고정
  gl={{
    antialias: true,
    powerPreference: 'high-performance',
    precision: 'mediump',             // ← 픽셀 셰이더 정밀도 완화
    toneMapping: THREE.ACESFilmicToneMapping,
    outputColorSpace: THREE.SRGBColorSpace
  }}
  shadows
  style={{ background: Colors.neutral[900] }}
>
```

그리고 저 FPS 시 자동으로 효과를 줄이려면, `@react-three/drei`의 `PerformanceMonitor`를 써서 블룸/버짓을 낮춘다. (요지는 factor<0.9일 때 효과 OFF)

```tsx
const [fxOn, setFxOn] = useState(true);
const [trailBudget, setTrailBudget] = useState(12); // 시작값

<PerformanceMonitor onChange={({ factor }) => {
  setFxOn(factor > 0.9);
  setTrailBudget(factor > 0.9 ? 12 : 8);
}} />

{fxOn && (
  <EffectComposer multisampling={0}>
    <Bloom mipmapBlur={false} luminanceThreshold={0.6} intensity={0.6} radius={0.25} />
    {/* BrightnessContrast는 끄거나 강도 축소 */}
  </EffectComposer>
)}
```

> DPR과 포스트가 누적되면 fill-rate가 커진다. DPR 상한을 내리고 저하 시 효과를 끄면 안정적으로 유지된다.&#x20;

### 3) **섀도 비용 절감**

* 주광원 섀도 맵 2048² → 1024², 필요 없는 오브젝트의 `castShadow/receiveShadow` 끄기.

```tsx
<directionalLight
  args={['#ffffff', 2.2]}
  position={[150,150,150]}
  castShadow
  shadow-mapSize={[1024, 1024]}        // ← 1024로 하향
  shadow-camera-left={-300}
  shadow-camera-right={300}
  shadow-camera-top={300}
  shadow-camera-bottom={-300}
/>

// Cylinder/Plane 등은 시각적으로 꼭 필요하지 않으면 그림자 비활성화
<Cylinder /* ... */ /* castShadow 제거 또는 false */ receiveShadow={false} />
<Plane /* ... */ receiveShadow={false} />
```

> 현재 2048² 섀도맵은 비용이 크다. 특히 블룸과 병행 시 프레임 하강폭이 커진다.&#x20;

### 4) GhostTrails **버퍼 예산 줄이기 + 스폰 간격 보수적**

* `maxPer`를 14→8\~10으로, `spawnInterval`을 살짝 늘리면(예: 0.035→0.05) 버퍼 업데이트량이 줄어든다.

```tsx
<GhostTrails
  targetsRef={hostParticleRefs}
  color={Colors.orange[300]}
  maxPer={trailBudget}   // ← 위의 PerformanceMonitor와 연동
  life={0.6}
  spawnInterval={0.05}   // ← 스폰 간격 완화
  sizeStart={8}
  sizeEnd={0}
/>
```

> Trail 포인트 수(totalSlots=대상수×maxPer)가 클수록 매 프레임 업로드되는 버퍼가 커진다. 적당한 선에서 절감.&#x20;

### 5) **힘 적용 빈도/강도 튜닝**

이미 `frameCount%3===0`으로 줄였지만, 장면이 무거울 때는 `%4` 또는 `%5`로 늘리고, `chaoticForce` 등 계수도 약간 낮추면(예: 0.5→0.35) 물리 계산량과 Cannon 워커 통신량을 추가로 낮춘다. 관련 코드 위치는 동일한 `PhysicsSphere.useFrame` 블록.&#x20;

---

## 검증 순서 (5분 체크리스트)

1. **PhysicsSphere 리팩터링 적용** 후 단독 실행해 5\~10분 방치 → GC 스파이크가 사라지는지 확인. (Chrome 성능 탭, 할당 프로파일)&#x20;
2. **DPR=1 + 섀도 1024²**로 고정 → 평균 FPS 상승폭 확인. &#x20;
3. \*\*GhostTrails 예산( maxPer / spawnInterval )\*\*을 단계적으로 조정 → 체감상 가장 낮은 손실로 원하는 비주얼 확보.&#x20;
4. 마지막으로 **PerformanceMonitor** 자동 디그레이드로 ‘장시간 구동/부하 변화’ 상황에 대비.

---

## 추가 팁

* **환경맵/배경**은 유지하되, `backgroundBlurriness`·`backgroundIntensity`를 낮게 유지하면 포스트와의 중첩 비용을 줄인다.&#x20;
* **Auto-rotate**를 쓰는 경우(일부 버전) 카메라도 프레임당 행렬 갱신을 유발하므로, 필요 없으면 끄거나 속도를 더 낮춘다.&#x20;
* **Shadow를 꼭 써야 한다면** 섀도 카메라 범위를 실제 사용하는 영역에 더 촘촘히 맞추면 픽셀 당 연산이 줄어든다.

원인-대응이 명확한 ① 벡터 재사용과 ② DPR/섀도 하향만 반영해도 ‘시간이 지날수록 끊김’은 크게 완화된다. 이후 ③ 포스트/트레일 예산을 상황에 맞게 조절하면 안정적인 60FPS에 가까워질 것이다.