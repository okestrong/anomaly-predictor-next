문제의 “10초 간격 끊김”은 **리액트 리렌더** 문제가 아니라, **매 프레임 발생하는 메모리 할당과 DOM 접근** 때문에 생기는 **GC(가비지 컬렉션) 스파이크** 성격이 강합니다. 올려주신 코드 안에 그 원인이 여러 군데 숨어 있어요. 핵심 지점과 수리법을 짚어드립니다.

---

# 원인 진단 (핵심 5가지)

1. **매 프레임 새 배열 생성**

* `useFrame` 안에서 매 프레임마다 전개 연산자로 새 배열을 만듭니다:

  ```ts
  [...poolNodesRef.current, ...pgNodesRef.current, ...osdNodesRef.current].forEach(...)
  ```

  이게 프레임당 수백~수천 개의 객체를 스캔 + 새 배열 생성 → **주기적 GC** 유발.

2. **매 프레임 DOM 쿼리**

* R3F 루프에서 `document.querySelector`를 호출합니다:

  ```ts
  const ing = (document.querySelector('.search-panel') as HTMLElement)?.getAttribute('ing') === '1';
  ```

  렌더 루프에서 DOM을 매번 건드리면 **메인 스레드 잠식** + 레이아웃 계산이 섞여서 잔털끊김을 만듭니다.
  (검색/클리어에서도 다수의 DOM 접근이 반복 호출됩니다. )

3. **매 프레임 난수/객체 생성**

* 회전 속도를 프레임마다 `Math.random()`으로 결정:

  ```ts
  const randomRotationSpeed = Math.random() * (1.0 - 0.1) + 0.1;
  ring.rotation.x += delta * randomRotationSpeed;
  ```

  → 매 프레임 분기/난수/객체 탐색(`children.find`) → **불필요한 할당 + 캐시 미스**.
* 색을 바꿀 때 `new THREE.Color()`를 반복 생성하는 경향(동일 파일 내 여러 위치)도 GC 압력을 올립니다.

4. **지오메트리 법선 재계산**

* 버블/PG 생성 로직 등에서 `geometry.computeVertexNormals()`가 등장합니다. 이 호출은 **무겁기 때문에 프레임 루프에서 절대 돌리면 안 됩니다**. 초기화 타이밍으로 고정해야 합니다.

5. **과도한 씬 작업량(별, 라이트 등)**

* `Stars`를 두 번(1000개 + 500개) 렌더링하고, `rectAreaLight`(면광원, 연산 비쌈)를 사용 중. 프레임 예산이 빠듯한 상황에서 **작은 GC 스파이크가 눈에 띄는 끊김**으로 체감됩니다.

> 참고: 올려주신 파일은 길어서 여기 발췌한 위치 외에도 비슷한 패턴들이 있습니다. (예: 검색 처리에서 여러 Node 배열을 전개한 뒤 GSAP 처리 등)

---

# 바로 적용하는 해결책 (누적 효과 큼)

## A. 프레임 루프에서 “할당” 없애기

**나쁜 예 (현재):**

```ts
// ❌ 매 프레임 새 배열 생성 + find()
[...poolNodesRef.current, ...pgNodesRef.current, ...osdNodesRef.current].forEach(node => {
  const ring = node.children.find(child => child.name === 'health-ring') as THREE.Mesh;
  ...
});
```

**개선 예:**

```ts
// 1) 시작 시 한 번만 합쳐 둔 목록을 유지
const allNodesRef = useRef<THREE.Object3D[]>([]);
useEffect(() => {
  allNodesRef.current = [
    ...poolNodesRef.current,
    ...pgNodesRef.current,
    ...osdNodesRef.current,
  ];
  // 노드 추가/삭제 되는 시점에만 이 배열을 갱신
}, [/* 노드 구성이 변하는 트리거들 */]);

// 2) node.children 탐색도 미리 캐싱
// 생성(onCreated) 시에 ring/hud 등 참조를 userData로 심어둠
// node.userData.ring = ringMesh; node.userData.hud = hudGroup;

// 3) useFrame에서는 순수 수치 업데이트만
useFrame((state, delta) => {
  const t = state.clock.elapsedTime;
  for (const node of allNodesRef.current) {
    const ring = node.userData.ring as THREE.Mesh | undefined;
    if (ring) {
      ring.rotation.x += delta * (ring.userData.rx ?? 0.2); // 사전 고정 난수
      ring.rotation.y += delta * (ring.userData.ry ?? 0.7);
      // uniforms.time 등 수치만 업데이트
    }
  }
});
```

* **포인트**: “배열 만들기/탐색/객체 생성”은 **초기화** 때 한 번, **프레임 루프**에서는 **숫자만 바꾼다**.

## B. 난수·색상·재질은 “사전 고정 & 재사용”

* 회전 속도는 생성 시 한 번 정해서 `node.userData`에 저장:

  ```ts
  ring.userData.rx = 0.1 + Math.random() * 0.9;
  ring.userData.ry = 0.5 + Math.random();
  ```

  이후 프레임에서는 **그 값만** 참조.
* 색상은 `const tmpColor = new THREE.Color()` 하나 만들어 재사용하거나, 가능한 한 **초기화 시 고정**(emissive pulsing만 값 스칼라 변경).
* `new THREE.Color().setHSL(...)` 같은 **객체 생성 + 메서드 체이닝**을 프레임 루프에서 금지.

## C. DOM 접근은 R3F 루프 밖으로

**나쁜 예 (현재):**

```ts
const ing = (document.querySelector('.search-panel') as HTMLElement)?.getAttribute('ing') === '1';
```

**개선 예:**

```ts
// ref 상태로 보관
const searchIngRef = useRef(false);

// 패널 토글 함수에서만 DOM 읽고 ref를 갱신
const toggleSearchPanel = () => {
  searchIngRef.current = !searchIngRef.current;
  // DOM 애니메이션은 gsap으로 하되, useFrame에서는 searchIngRef만 조회
};

// useFrame에서는 오직 searchIngRef.current만 읽음
useFrame(() => {
  if (searchIngRef.current) {
    // 애니메이션 수치만
  }
});
```

* 즉, **DOM → ref 동기화는 이벤트 시 1회**, 렌더 루프에서는 **ref만 읽기**.

## D. `computeVertexNormals()`는 초기화에서만

* 노이즈 변형 후 **초기 생성 시** 한 번 계산하고, 프레임에서 다시 호출하지 마세요. 현재처럼 자주 재계산하면 **큰 스톨**을 유발합니다.

## E. 씬 경량화 (빠른 체감)

* `Stars` 하나로 줄이고 `count`를 절반 이하로 조정.
* `rectAreaLight`를 **pointLight 2~3개**로 대체하거나 강도 줄이기.
* `OrbitControls`는 이미 수많은 애니메이션이 있으니 `autoRotate` 끄는 것도 GPU/CPU 예산에 도움.

---

# 코드 레벨 패치 포인트 (핵심 스니펫)

### 1. 합쳐진 노드 배열 캐시 & 참조 캐시

```ts
// onCreated / 생성 시:
group.userData.ring = healthRingRef.current;     // 참조 캐시
group.userData.hud  = hudGroup;                  // 참조 캐시
group.userData.rx   = 0.1 + Math.random() * 0.9; // 고정 난수
group.userData.ry   = 0.5 + Math.random();       // 고정 난수
```

```ts
// useEffect로 allNodes 갱신(노드 증감 시에만)
useEffect(() => {
  allNodesRef.current = [
    ...poolNodesRef.current,
    ...pgNodesRef.current,
    ...osdNodesRef.current,
  ];
}, [/* 노드가 변할 때 트리거를 명시 */]);
```

```ts
// useFrame: 숫자만 업데이트
useFrame((s, dt) => {
  const t = s.clock.elapsedTime;
  for (const n of allNodesRef.current) {
    const ring = n.userData.ring as THREE.Mesh | undefined;
    if (ring) {
      ring.rotation.x += dt * (ring.userData.rx ?? 0.2);
      ring.rotation.y += dt * (ring.userData.ry ?? 0.7);
      const mat = ring.userData.material as THREE.ShaderMaterial | undefined;
      if (mat?.uniforms?.time) mat.uniforms.time.value = t;
    }
  }
});
```

(현재의 전개 연산 + `children.find()` 패턴을 위처럼 치환)

### 2. DOM 접근 제거

```ts
const searchIngRef = useRef(false);

// 패널 열고닫는 기존 함수들 내부에서만 DOM 접근 → ref 갱신
// useFrame에서는 searchIngRef.current만 사용
```

(지금은 `useFrame`에서 직접 `querySelector`를 호출)

### 3. 색/머터리얼 재사용

* 머터리얼/컬러는 `useMemo`(혹은 생성 시)로 만들고, 프레임마다 **속성 스칼라 값만** 바꾸세요.
* `new THREE.Color()`는 루프 밖에서 1회 생성 후 **재사용 버퍼**로 둡니다.

### 4. 법선 재계산 제거

* 지오메트리 변형이 **정적**이라면 `computeVertexNormals()`는 **생성 직후 1회**로 끝. 프레임 루프에서 호출 금지.

### 5. 렌더링 예산 확보

* `Stars`를 1개로 줄이고 `count`도 낮춰 CPU/GPU 여유를 만듭니다.
* `rectAreaLight` 대신 `pointLight`/`directionalLight` 위주로 구성.

---

# 점검 체크리스트 (적용 후 확인)

* **Chrome Performance**로 15초 녹화 → “Major GC” 스파이크가 사라졌는지.
* **R3F PerformanceMonitor**(이미 쓰신 듯)에서 FPS 드랍이 **주기적**(10초 간격)으로 반복되는지 여부.
* 프레임 루프에서 **배열 생성/DOM 접근/객체 생성**이 남아있는 로그가 없는지.

---

# 메모

* 파일 내에 검색·패널 토글 로직 전반이 **DOM 중심**으로 작성되어 있습니다. 이 부분은 **ref(or jotai/zustand)**로 브릿지 한 다음, **GSAP는 DOM만, R3F는 수치만** 다루는 식으로 **관심사를 분리**해 주면 전체가 훨씬 부드러워집니다.
* 동일 파일의 해당 위치들을 참고해 적용해 주세요: 전개 배열/탐색(`children.find`)과 DOM 접근(검색/클리어)은 아래 인용을 참조.

    * 배열 전개 + 탐색:
    * DOM 접근(검색/클리어/패널):
    * Stars/조명 과다:
    * 프레임 루프 내 난수:
    * 법선 재계산 위치:

---

**요약**

* 끊김은 **프레임 루프에서의 메모리 할당 + DOM 접근**이 누적되어 **주기적 GC/스톨**을 만든 결과입니다.
* “초기화 때 준비(캐시/고정)” vs “루프에서는 숫자만 업데이트” 원칙으로 바꾸면 **10초 간격 끊김이 사라지고** 전체가 매끈해집니다.
