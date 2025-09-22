코드를 분석한 결과, 시간이 지날수록 성능이 떨어지는 주요 원인들을 발견했습니다:

## 주요 문제점들

### 1. **GhostTrails 메모리 누수**
`GhostTrails` 컴포넌트가 계속해서 trail 객체를 생성하지만 제대로 정리되지 않고 있습니다. 시간이 지날수록 누적됩니다.

### 2. **DataParticles의 State 업데이트 문제**
```tsx
// 문제: 매 사이클마다 setState 호출
setDrawerCycleIds(prev => {
   const newIds = [...prev];
   newIds[i] = drawerCycleId.current[i];
   return newIds;
});
```
이 부분이 매우 빈번하게 호출되어 불필요한 리렌더링을 유발합니다.

### 3. **useFrame 내 과도한 계산**
여러 `useFrame` 훅에서 매 프레임마다 불필요한 계산이 반복됩니다.

## 해결 방법

### 1. **GhostTrails 최적화**
```tsx
// GhostTrails 컴포넌트에 cleanup 추가
useEffect(() => {
   return () => {
      // trail 객체들을 명시적으로 정리
      trails.current.forEach(trail => {
         trail.geometry?.dispose();
         trail.material?.dispose();
      });
      trails.current = [];
   };
}, []);
```

### 2. **DataParticles 개선**
```tsx
const DataParticles = ({ ... }) => {
   // setState 제거하고 ref만 사용
   // const [drawerCycleIds, setDrawerCycleIds] = useState(...); // 제거
   
   const startDrawerCycle = (i: number, now: number) => {
      drawerCycleId.current[i]++;
      // ... 기존 코드 ...
      
      // setState 호출 제거
      // setDrawerCycleIds(...); // 제거
   };
   
   // useFrame 최적화
   const updateParticles = useCallback((state) => {
      const now = state.clock.elapsedTime;
      
      // 활성 파티클만 업데이트
      for (let i = 0; i < N_DRAWER; i++) {
         if (!drawerActive.current[i]) continue;
         // ... 업데이트 로직
      }
   }, [N_DRAWER, N_HOST]);
   
   useFrame(updateParticles);
};
```

### 3. **InstancedSpheres 최적화**
```tsx
// targetCount 변경 주기 완화
const debouncedTargetCount = useMemo(() => {
   return Math.min(40, Math.max(5, Math.floor((writeOps.drawer + writeOps.host) / 10)));
}, [Math.floor(writeOps.drawer / 50), Math.floor(writeOps.host / 50)]); // 변경 빈도 감소
```

### 4. **텍스처 로딩 개선**
```tsx
// 텍스처를 컴포넌트 외부에서 한 번만 로드
const textureLoader = new THREE.TextureLoader();
const textures = {
   albedoMap: textureLoader.load('/3d/textures/earth/Albedo.jpg'),
   // ... 다른 텍스처들
};

// 컴포넌트 내부에서는 참조만
const Table = ({ ... }) => {
   // useEffect 제거하고 props로 받거나 외부 참조
};
```

### 5. **메모리 관리 강화**
```tsx
// 각 컴포넌트에 cleanup 추가
useEffect(() => {
   return () => {
      // geometry, material, texture dispose
      meshRef.current?.geometry?.dispose();
      meshRef.current?.material?.dispose();
      // ...
   };
}, []);
```

### 6. **useFrame 최적화**
```tsx
// 불필요한 계산 캐싱
const poolAnimationData = useMemo(() => {
   return poolAnimationRefs.current.map((_, index) => ({
      isMiddleRing: index <= middleRingCount,
      baseAngle: calculateBaseAngle(index),
      orbitSpeed: calculateOrbitSpeed(index),
      radius: calculateRadius(index)
   }));
}, [poolAnimationRefs.current.length]);

useFrame(state => {
   const time = state.clock.elapsedTime;
   
   poolAnimationData.forEach((data, index) => {
      const poolRefs = poolAnimationRefs.current[index];
      if (!poolRefs.groupRef.current) return;
      
      // 미리 계산된 값 사용
      const angle = data.baseAngle + time * data.orbitSpeed;
      poolRefs.groupRef.current.position.x = Math.cos(angle) * data.radius;
      poolRefs.groupRef.current.position.z = Math.sin(angle) * data.radius;
   });
});
```

### 7. **즉시 적용 가능한 Quick Fix**
```tsx
// WorldTrafficView 컴포넌트에서
const WorldTrafficView: FC<Props> = () => {
   // writeOps 업데이트 주기 늘리기 (이미 30초로 되어 있음)
   
   // PerformanceMonitor 임계값 조정
   <PerformanceMonitor
      onChange={({ factor }) => {
         // 더 보수적인 임계값
         if (factor < 0.3) { // LOW를 0.5에서 0.3으로
            setFxOn(false);
            setTrailBudget(4); // 12에서 4로 감소
         } else if (factor > 0.7) { // HIGH를 0.8에서 0.7로
            setFxOn(true);
            setTrailBudget(8); // 12에서 8로 감소
         }
      }}
   />
};
```

이러한 수정사항들을 적용하면 메모리 누수가 줄어들고 시간이 지나도 성능이 안정적으로 유지될 것입니다.