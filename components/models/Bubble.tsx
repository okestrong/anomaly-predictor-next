import { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Displace, LayerMaterial } from 'lamina';
import * as THREE from 'three';

export default function Bubble({
   position,
   scale,
   color,
   text,
   useBubble,
}: {
   position: [number, number, number];
   scale: number;
   color: string;
   text?: string;
   useBubble?: boolean;
}) {
   // 노이즈 변위 레이어 참조
   const displaceRef = useRef<any>(null);
   // 메쉬 참조 (회전/스케일 업데이트용)
   const meshRef = useRef<THREE.Mesh>(null);
   // 캔버스 픽셀 크기/뷰포트, 마우스 좌표(-1..1)
   const { size, viewport /*, mouse*/ } = useThree();
   // 클릭 스프링 스케일: targetScale로 수렴하는 감쇠 보간
   const [targetScale, setTargetScale] = useState(scale);
   const currentScale = useRef(scale);
   // 호버 시 커서 변경(drei)
   const [hovered, setHovered] = useState(false);

   const texture = useMemo(() => {
      // 1. 캔버스 생성
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;

      // 2. 배경 투명/검정 설정
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 3. 텍스트 스타일
      ctx.font = 'bold 80px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 4. 텍스트 그리기
      ctx.fillText(text ?? 'OKESTRO', canvas.width / 2, canvas.height / 2);

      // 5. THREE.js 텍스처로 변환
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
   }, []);

   // useCursor(hovered);

   // 구 세그먼트 수: 화면 폭에 따라 원본처럼 해상도 분기
   const sphereArgs = useMemo<[number, number, number]>(() => {
      const vertex = size.width > 575 ? 80 : 40;
      // radius는 뷰포트 폭 기반으로 적정 비율 설정 (원본은 고정 120)
      const radius = 4; //Math.min(viewport.width, viewport.height) / 2.5;
      return [radius, vertex, vertex];
   }, [size.width, viewport.width, viewport.height]);

   useFrame((state, dt) => {
      if (!useBubble) return;

      // lamina Displace 애니메이션: 시간 경과에 따라 offset 이동
      if (displaceRef.current) {
         displaceRef.current.offset.x += 2 * dt; // 원본의 time * 0.0005 대비 상대적 속도값
      }

      // 마우스 중심으로부터의 거리 계산 및 맵핑 (0: 중심, 1: 모서리)
      // useThree.mouse는 -1..1 범위이므로 이를 0..1 거리로 정규화
      // const mx = mouse.x; // -1..1
      // const my = mouse.y; // -1..1
      // const distNorm = Math.min(Math.sqrt(mx * mx + my * my), 1); // 0..1

      // 원본 map(dist, 1->0, 0->1)과 유사한 효과: 중심에서 변형 약, 멀수록 강하게
      // lamina Displace의 strength를 0.8~3.0 사이에서 가변
      /*if (displaceRef.current) {
         const strength = 0.8 + distNorm * 2.2;
         displaceRef.current.strength = strength;
      }*/

      // 버블 회전: 화면 픽셀 기준이 아닌 마우스 -1..1 범위를 원본 비율로 맵핑
      // 원본: y축 -4..0, z축 4..-4 매핑. 여기서는 유사 범위 적용
      if (meshRef.current) {
         // -1..1 -> 0..1 -> 원본 범위로 스케일링
         const map = (v: number, inMin: number, inMax: number, outMin: number, outMax: number) => ((v - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
         meshRef.current.rotation.y = map(0, /*mx,*/ -1, 1, -4, 0);
         meshRef.current.rotation.z = map(0, /*my,*/ -1, 1, 4, -4);
      }

      // 클릭 스프링 스케일: 부드럽게 수렴 (감쇠 보간)
      if (meshRef.current) {
         const k = 8; // 감쇠 계수 (값이 클수록 빠르게 수렴)
         currentScale.current += (targetScale - currentScale.current) * Math.min(k * dt, 1);
         meshRef.current.scale.set(currentScale.current, currentScale.current, currentScale.current);
      }
   });

   return (
      // <group ref={meshRef} position={position} scale={scale} castShadow receiveShadow>
      <mesh
         ref={meshRef}
         position={position}
         // 초기 외부 scale과 내부 스프링 스케일을 곱연산으로 반영
         scale={scale}
         // 포인터 상호작용: 클릭 시 스프링 수축/이완
         // onPointerDown={() => setTargetScale(0.7)}
         // onPointerUp={() => setTargetScale(1)}
         // onPointerOver={() => setHovered(true)}
         // onPointerOut={() => {
         //    setTargetScale(1);
         //    setHovered(false);
         // }}
         castShadow
         receiveShadow
      >
         <sphereGeometry args={sphereArgs} />
         {/*
           원본은 MeshStandardMaterial + emissive/metalness/roughness 조합.
           여기서는 lamina LayerMaterial을 사용하여 물리 조명/전달감을 주고,
           Displace로 노이즈 기반 변형을 수행합니다.
         */}
         <LayerMaterial color={color} lighting={'physical'} transmission={1} roughness={0.15} thickness={2} metalness={0.21}>
            <Displace ref={displaceRef} strength={1.6} scale={0.25} />
         </LayerMaterial>
      </mesh>
      // </group>
   );
}
