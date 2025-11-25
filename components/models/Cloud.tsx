import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Cloud(props: any) {
   const { nodes, materials } = useGLTF('/3d/models/moon.glb');
   const groupRef = useRef<THREE.Group>(null);

   // Pulse animation using sine wave for smooth breathing effect
   useFrame(state => {
      if (groupRef.current) {
         const time = state.clock.getElapsedTime();
         // Gentle pulse between 0.95 and 1.05 scale
         const pulseScale = 0.5 + Math.sin(time * 0.8) * 0.05;
         groupRef.current.scale.setScalar(pulseScale);
      }
   });

   return (
      <group ref={groupRef} {...props} dispose={null}>
         <mesh
            geometry={(nodes.Mball002 as any).geometry}
            material={(nodes.Mball002 as any).material}
            position={[2.777, 2.131, 0]}
            scale={[0.066, 0.341, 0.161]}
         />
      </group>
   );
}

useGLTF.preload('/3d/models/moon.glb');
