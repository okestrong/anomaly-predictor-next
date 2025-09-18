import React, { RefObject, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

type GhostTrailsProps = {
   /** 공(스피어) 메쉬들의 ref 배열을 그대로 넘긴다 */
   targetsRef: RefObject<THREE.Group[]>;
   /** 고스트(점) 색 */
   color: string | number;
   /** 파티클 하나당 찍어둘 최대 잔상 개수 */
   maxPer?: number;
   /** 잔상 생명주기(초) */
   life?: number;
   /** 잔상 생성 간격(초) */
   spawnInterval?: number;
   /** 시작/끝 크기(픽셀). Bloom과 함께 쓰면 8~14 권장 */
   sizeStart?: number;
   sizeEnd?: number;
   /** 텔레포트로 판단할 거리(월드 단위). 순간이동이면 deque 리셋 */
   teleportDist?: number;
   /** 모든 잔상의 y를 통째로 올리거나 내림(기본: 0) */
   yOffset?: number;
   /** 잔상의 y 하한/상한(기본: 제한 없음) */
   yMin?: number;
   yMax?: number;
   /** 잔상의 y를 ‘고정’하고 싶을 때(값 주면 고정) */
   lockY?: number;
   /** 중력처럼 잔상이 서서히 아래로 이동하게(단위: 유닛/초, 음수면 아래로) */
   gravity?: number;
};

export default function GhostTrails({
   targetsRef,
   color = '#00e8ff',
   maxPer = 14,
   life = 0.7,
   spawnInterval = 0.035,
   sizeStart = 12,
   sizeEnd = 0,
   teleportDist = 6,
   yOffset = 0,
   yMin = -Infinity,
   yMax = Infinity,
   lockY,
   gravity = 0,
}: GhostTrailsProps) {
   const tmpV = useMemo(() => new THREE.Vector3(), []);
   const pointsRef = useRef<THREE.Points>(null);

   // 대상 개수
   const getCount = () => targetsRef.current.length;
   const totalSlots = getCount() * maxPer;

   // 버퍼 준비
   const { geom, material, positions, alphas, sizes, heads, timers } = useMemo(() => {
      const g = new THREE.BufferGeometry();
      const pos = new Float32Array(totalSlots * 3);
      const alp = new Float32Array(totalSlots);
      const siz = new Float32Array(totalSlots);

      // 초기에는 화면 밖으로
      for (let i = 0; i < totalSlots; i++) {
         pos[i * 3 + 0] = 99999;
         pos[i * 3 + 1] = 99999;
         pos[i * 3 + 2] = 99999;
         alp[i] = 0;
         siz[i] = sizeEnd;
      }

      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('aAlpha', new THREE.BufferAttribute(alp, 1));
      g.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));

      const mat = new THREE.ShaderMaterial({
         transparent: true,
         depthWrite: false,
         blending: THREE.AdditiveBlending,
         uniforms: {
            uColor: { value: new THREE.Color(color as any) },
         },
         vertexShader: `
        attribute float aAlpha;
        attribute float aSize;
        varying float vAlpha;
        void main() {
          vAlpha = aAlpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float dist = -mvPosition.z;
          // 간단한 원근 감쇠
          float size = aSize * (300.0 / max(1.0, dist));
          gl_PointSize = size;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
         fragmentShader: `
        varying float vAlpha;
        uniform vec3 uColor;
        void main() {
          // 원 형태의 빌보드
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float soft = 1.0 - smoothstep(0.3, 0.5, d);
          gl_FragColor = vec4(uColor, vAlpha * soft);
        }
      `,
      });

      // 파티클별 ring-buffer head와 타이머
      const hd = new Int32Array(getCount());
      const tm = new Float32Array(getCount());

      return { geom: g, material: mat, positions: pos, alphas: alp, sizes: siz, heads: hd, timers: tm };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [totalSlots, color, sizeEnd]);

   useFrame((_, dt) => {
      const targets = targetsRef.current;
      const count = targets.length;
      if (!pointsRef.current || count * maxPer !== totalSlots) return;

      // 1) 잔상 생성(파티클마다 주기적으로 1개)
      for (let i = 0; i < count; i++) {
         const t = targets[i];
         if (!t || !t.visible) continue;

         timers[i] += dt;
         if (timers[i] >= spawnInterval) {
            timers[i] -= spawnInterval;

            // 현재 위치
            t.getWorldPosition(tmpV);
            // 텔레포트 판단: 마지막으로 찍은 위치와 너무 멀면 그 파티클 deque 리셋
            let base = i * maxPer;
            const lastIdx = (heads[i] + maxPer - 1) % maxPer;
            const li = base + lastIdx;
            const lx = positions[li * 3 + 0];
            const ly = positions[li * 3 + 1];
            const lz = positions[li * 3 + 2];
            if (isFinite(lx)) {
               const dx = tmpV.x - lx,
                  dy = tmpV.y - ly,
                  dz = tmpV.z - lz;
               if (Math.hypot(dx, dy, dz) > teleportDist) {
                  // deque 클리어
                  for (let k = 0; k < maxPer; k++) {
                     const idx = base + k;
                     positions[idx * 3 + 0] = 99999;
                     positions[idx * 3 + 1] = 99999;
                     positions[idx * 3 + 2] = 99999;
                     alphas[idx] = 0;
                     sizes[idx] = sizeEnd;
                  }
                  heads[i] = 0;
               }
            }

            // 새 포인트 push
            base = i * maxPer;
            const head = heads[i];
            const idx = base + head;
            heads[i] = (head + 1) % maxPer;

            positions[idx * 3 + 0] = tmpV.x;
            // ★ y 조정: lockY가 우선, 없으면 offset+clamp
            const ySpawn = lockY ?? THREE.MathUtils.clamp(tmpV.y + yOffset, yMin, yMax);
            positions[idx * 3 + 1] = ySpawn;
            positions[idx * 3 + 2] = tmpV.z;
            // positions[idx * 3 + 0] = tmpV.x;
            // positions[idx * 3 + 1] = tmpV.y;
            // positions[idx * 3 + 2] = tmpV.z;
            alphas[idx] = 1.0;
            sizes[idx] = sizeStart;
         }
      }

      // 2) 모든 잔상 페이드/스케일 다운
      const decay = dt / life;
      for (let j = 0; j < totalSlots; j++) {
         if (alphas[j] <= 0) continue;
         alphas[j] = Math.max(0, alphas[j] - decay);
         // 사이즈도 함께 줄이기
         const t = 1.0 - alphas[j]; // 0→1
         sizes[j] = THREE.MathUtils.lerp(sizeStart, sizeEnd, t);

         // ★ 중력/보정: lockY가 있으면 고정, 없으면 gravity와 클램프 적용
         if (alphas[j] > 0) {
            if (lockY !== undefined) {
               positions[j * 3 + 1] = lockY;
            } else {
               if (gravity !== 0) {
                  positions[j * 3 + 1] += gravity * dt;
               }
               positions[j * 3 + 1] = THREE.MathUtils.clamp(positions[j * 3 + 1], yMin, yMax);
            }
         }

         // 완전히 사라지면 화면 밖으로 이동(프러스텀 비용 절감)
         if (alphas[j] === 0) {
            positions[j * 3 + 0] = 99999;
            positions[j * 3 + 1] = 99999;
            positions[j * 3 + 2] = 99999;
         }
      }

      (geom.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      (geom.getAttribute('aAlpha') as THREE.BufferAttribute).needsUpdate = true;
      (geom.getAttribute('aSize') as THREE.BufferAttribute).needsUpdate = true;
   }, -1);

   return <points ref={pointsRef} geometry={geom} material={material} frustumCulled={false} />;
}
