import React, { useRef } from 'react';
import { useGLTF, useHelper } from '@react-three/drei';
import { PointLight } from 'three';
// import * as THREE from 'three';
import Colors from '@/utils/color';

export function CyberDog(props: any) {
   const { nodes, materials } = useGLTF('/3d/models/cyber-dog.glb');
   const lightRef = useRef(new PointLight());
   // useHelper(lightRef, THREE.PointLightHelper, 0.1, 'red');

   return (
      <group {...props} dispose={null}>
         <mesh geometry={(nodes.geometry_0 as any).geometry} material={(nodes.geometry_0 as any).material} />
         <pointLight ref={lightRef} position={[0.1, 0.25, 0.35]} intensity={0.5} color={Colors.cyan[400]} />
      </group>
   );
}

useGLTF.preload('/3d/models/cyber-dog.glb');
