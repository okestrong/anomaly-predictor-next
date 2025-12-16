import React, { useRef } from 'react';
import { useGLTF, useHelper } from '@react-three/drei';
// import * as THREE from 'three';
// import { PointLight } from 'three';
import Colors from '@/utils/color';

export function SpaceShipTwo(props: any) {
   const { nodes } = useGLTF('/3d/models/spaceship-monkey.glb');
   // const lightRef = useRef(new PointLight());
   // useHelper(lightRef, THREE.PointLightHelper, 0.1, 'red');

   return (
      <group {...props} dispose={null}>
         <mesh geometry={(nodes.geometry_0 as any).geometry} material={(nodes.geometry_0 as any).material} />
         <pointLight position={[-0.12, 0.08, 0.36]} intensity={5} color={Colors.pink[300]} />
         <pointLight position={[0.12, 0.08, 0.35]} intensity={5} color={Colors.pink[300]} />
         <pointLight position={[-0.32, 0.12, 0.27]} intensity={2} color={Colors.yellow[300]} />
         <pointLight position={[0.32, 0.1, 0.28]} intensity={2} color={Colors.yellow[300]} />
         <pointLight position={[-0.25, 0.1, -0.495]} intensity={2} color={Colors.blue[400]} />
         <pointLight position={[0.25, 0.1, -0.495]} intensity={2} color={Colors.blue[400]} />
         <pointLight position={[0.074, 0.01, 0.4]} intensity={2} color={Colors.red[300]} />
         <pointLight position={[-0.075, 0.01, 0.4]} intensity={2} color={Colors.red[300]} />
         <pointLight position={[0, 0.085, 0.46]} intensity={2} color={Colors.cyan[300]} />
      </group>
   );
}

useGLTF.preload('/3d/models/spaceship-monkey.glb');
