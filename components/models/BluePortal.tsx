import React, { useRef } from 'react';
import { useGLTF, useHelper } from '@react-three/drei';
// import * as THREE from 'three';
// import { PointLight } from 'three';
import Colors from '@/utils/color';

export function BluePortal(props: any) {
   const { nodes } = useGLTF('/3d/models/datacenter/blue-portal.glb');
   // const lightRef = useRef(new PointLight());
   // useHelper(lightRef, THREE.PointLightHelper, 0.1, 'red');

   return (
      <group {...props} dispose={null}>
         <mesh geometry={(nodes.geometry_0 as any).geometry} material={(nodes.geometry_0 as any).material} castShadow={!!props.castShadow} />
         <pointLight position={[0, -0.23, 0.2]} intensity={5} color={Colors.purple[400]} />
         <pointLight position={[0, 0, -0.23]} intensity={5} color={Colors.cyan[400]} />
      </group>
   );
}

useGLTF.preload('/3d/models/datacenter/blue-portal.glb');
