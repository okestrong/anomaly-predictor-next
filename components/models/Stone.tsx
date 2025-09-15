import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeElements, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type StoneProps = {
   orbitRadius?: number;
   orbitSpeed?: number;
   yPosition?: number;
} & ThreeElements['group'];

export function Stone({
   orbitRadius = 2.0,
   orbitSpeed = 0.01,
   yPosition = -30,
   ...props
}: StoneProps) {
   const {
      nodes: { model },
      materials,
   } = useGLTF('/3d/models/stone/base_basic_shaded.glb');
   const stoneRef = useRef<THREE.Object3D>(null);
   const orbitAngleRef = useRef(0);

   useFrame(() => {
      if (stoneRef.current) {
         // 공전 각도 업데이트
         orbitAngleRef.current += orbitSpeed;

         // 공전 위치 계산 (y축 고정)
         const x = Math.cos(orbitAngleRef.current) * orbitRadius;
         const z = Math.sin(orbitAngleRef.current) * orbitRadius;

         stoneRef.current.position.set(x, yPosition, z);

         // 자전 (기존 회전 효과 유지)
         stoneRef.current.rotation.y += 0.02;
         stoneRef.current.rotation.x += 0.01;
      }
   });

   return (
      <group {...props} dispose={null} ref={stoneRef}>
         <mesh geometry={(model as any).geometry} material={materials.model} />
      </group>
   );
}

useGLTF.preload('/3d/models/stone/base_basic_shaded.glb');
