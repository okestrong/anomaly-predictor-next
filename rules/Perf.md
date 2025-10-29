코드를 분석한 결과, 10초 간격 끊김의 주요 원인들을 발견했습니다:

## 주요 문제점

### 1. **animate() 함수와 R3F useFrame의 충돌**
가장 심각한 문제입니다. 현재 코드에서:
- R3F 내부에서 `useFrame` 훅으로 애니메이션 실행
- 동시에 외부 `animate()` 함수가 `requestAnimationFrame`으로 별도 루프 실행
- 동일한 객체들을 두 곳에서 조작하여 충돌 발생

### 2. **Clock 렌더링의 메모리 누수**
```javascript
setInterval(renderTime, 40);  // cleanup 없이 계속 실행
```

### 3. **중복된 렌더링 시도**
```javascript
if (rendererRef.current && sceneRef.current && cameraRef.current) {
    rendererRef.current.render(sceneRef.current, cameraRef.current);
}
```
R3F가 이미 렌더링을 처리하는데 수동으로 또 렌더링을 시도합니다.

## 해결 방법

### 1. animate() 함수 제거 및 useFrame로 통합

```javascript
// ClusterTopologyScene 컴포넌트 내부에 추가
const AnimationLoop = () => {
    const clockRef = useRef(new THREE.Clock());
    
    useFrame((state, delta) => {
        const elapsedTime = clockRef.current.getElapsedTime();
        
        // 기존 animate() 함수의 로직을 여기로 이동
        [...poolNodesRef.current, ...pgNodesRef.current, ...osdNodesRef.current].forEach(node => {
            const ring = node.children.find(child => child.name === 'health-ring') as THREE.Mesh;
            if (ring && ring.userData.material) {
                const shaderMaterial = ring.userData.material as THREE.ShaderMaterial;
                if (shaderMaterial.uniforms?.time) {
                    shaderMaterial.uniforms.time.value = elapsedTime;
                }
                const randomRotationSpeed = Math.random() * (1.0 - 0.1) + 0.1;
                ring.rotation.x += delta * randomRotationSpeed;
                const rotationSpeed = 0.5 + Math.random();
                ring.rotation.y += delta * rotationSpeed;
            }
            
            // 나머지 애니메이션 로직...
        });
        
        // 트래픽 파티클 애니메이션
        trafficParticlesRef.current.forEach(particleGroup => {
            particleGroup.children.forEach((particle, index) => {
                const scale = 1 + Math.sin(elapsedTime * 3 + index) * 0.2;
                particle.scale.set(scale, scale, scale);
            });
        });
    });
    
    return null;
};
```

### 2. Clock cleanup 추가

```javascript
useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const loadClock = () => {
        const canvas = document.getElementById('clock') as HTMLCanvasElement;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d')!;
        // ... 기존 설정 코드 ...
        
        intervalId = setInterval(renderTime, 40);
    };
    
    loadClock();
    
    // Cleanup 추가
    return () => {
        if (intervalId) {
            clearInterval(intervalId);
        }
    };
}, []);
```

### 3. initialAnimate 제거

```javascript
// ClusterTopologyView 컴포넌트에서
// 이 부분 제거:
// initialAnimate={animate}

// ClusterTopologyScene에서도 제거:
// initialAnimate();
```

### 4. 수동 렌더링 제거

```javascript
// animate 함수에서 이 부분 완전 제거:
// if (rendererRef.current && sceneRef.current && cameraRef.current) {
//     rendererRef.current.render(sceneRef.current, cameraRef.current);
// }
```

### 5. GSAP 애니메이션 최적화

```javascript
// 컴포넌트 unmount 시 cleanup
useEffect(() => {
    return () => {
        // 모든 GSAP 애니메이션 정리
        gsap.killTweensOf("*");
        
        // Three.js 객체 dispose
        [...poolNodesRef.current, ...pgNodesRef.current, ...osdNodesRef.current].forEach(node => {
            node.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.geometry?.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material?.dispose();
                    }
                }
            });
        });
    };
}, []);
```

### 6. Environment 최적화

```javascript
// Environment 컴포넌트를 메모이제이션
const MemoizedEnvironment = React.memo(() => (
    <Environment files={'/3d/background/datacenter.jpg'} />
));

// Canvas 내부에서 사용
<MemoizedEnvironment />
```

이러한 수정으로 10초 간격 끊김 문제가 해결될 것입니다. 핵심은 **R3F의 렌더링 루프와 수동 렌더링 루프의 충돌을 제거**하는 것입니다.