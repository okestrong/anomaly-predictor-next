import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Colors from '@/utils/color';

export function BluePortal(props: any) {
   const { nodes } = useGLTF('/3d/models/datacenter/blue-portal.glb');
   const mainLightRef = useRef<THREE.PointLight>(null);

   /*useFrame(({ clock }) => {
      if (mainLightRef.current) {
         // 세기가 2 ~ 7 사이에서 부드럽게 변화 (기본값 4 기준)
         const pulseSpeed = 2; // 클수록 빨라짐
         const pulse = Math.sin(clock.elapsedTime * pulseSpeed) * 2 + 5;
         mainLightRef.current.intensity = pulse;
      }
   });*/

   return (
      <group {...props} dispose={null}>
         <mesh geometry={(nodes.geometry_0 as any).geometry} material={(nodes.geometry_0 as any).material} castShadow={!!props.castShadow} />
         <pointLight ref={mainLightRef} position={[0, -0.04, 0.01]} intensity={3} color={Colors.cyan[400]} />
         <pointLight position={[0, -0.23, 0.2]} intensity={5} color={Colors.purple[400]} />
         <pointLight position={[0, 0, -0.23]} intensity={5} color={Colors.cyan[400]} />
      </group>
   );
}

useGLTF.preload('/3d/models/datacenter/blue-portal.glb');
