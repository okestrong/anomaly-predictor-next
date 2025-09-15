import React, { useMemo, useRef } from 'react';
import { Float, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ThreeElements, useFrame } from '@react-three/fiber';

type GlassBallProps = {
   useOrbit?: boolean;
   orbitCenterPosition?: number[];
   orbitRadius?: number;
   y?: number;
   angularSpeed?: number;
   initialAngle?: number;
   showPath?: boolean;
} & ThreeElements['group'];

export default function BangingGlassBall({
   useOrbit,
   orbitCenterPosition,
   orbitRadius,
   y = 5,
   angularSpeed = 0.6, // 음수로 주면 반시계 방향으로 공전
   initialAngle = -Math.PI / 2,
   showPath,
   ...rest
}: GlassBallProps) {
   const { nodes, materials } = useGLTF('/3d/models/glassball/sphere-transformed.glb');
   const meshRef = useRef<THREE.Mesh>(null!);
   const angleRef = useRef(initialAngle);

   const centerVec = useMemo(
      () =>
         useOrbit && !!orbitCenterPosition
            ? new THREE.Vector3(orbitCenterPosition[0], orbitCenterPosition[1], orbitCenterPosition[2])
            : new THREE.Vector3(0, 0, 0),
      [orbitCenterPosition],
   );

   useFrame((_, delta) => {
      if (useOrbit && !!orbitRadius) {
         angleRef.current += angularSpeed * delta; // θ += ω dt
         const a = angleRef.current;
         const x = centerVec.x + orbitRadius * Math.cos(a);
         const z = centerVec.z + orbitRadius * Math.sin(a);
         meshRef.current.position.set(x, y, z);
         // 회전 방향으로 고개 돌리고 싶다면(구는 의미 없지만):
         // meshRef.current.lookAt(centerVec);
      }
   });

   (materials.glass as any).iridescence = 1.0;
   // materials.glass.iridescenceThicknessRange = [100, 1000]
   (materials.glass as any).iridescenceIOR = 1.96;
   (materials.glass as any).thickness = 0.05;
   (materials.glass as any).ior = 1.4;
   (materials.glass as any).side = THREE.DoubleSide;
   (materials.glass as any).roughness = 0.2;
   (materials.glass as any).clearcoat = 1.9;
   (materials.glass as any).metalness = 0.5;

   return (
      <Float rotationIntensity={10} floatIntensity={10}>
         <group {...rest} dispose={null} ref={meshRef}>
            <mesh geometry={(nodes.glass as any).geometry} material={materials.glass} scale={3.79} />
            <mesh geometry={(nodes.metal as any).geometry} material={materials['Material.001']} scale={3.79} />
         </group>
      </Float>
   );
}

useGLTF.preload('/3d/models/glassball/sphere-transformed.glb');
