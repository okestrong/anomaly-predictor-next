import React from 'react';
import { useGLTF } from '@react-three/drei';

export function ServerFive(props: any) {
   const { nodes } = useGLTF('/3d/models/datacenter/server512.glb');
   return (
      <group {...props} dispose={null}>
         <mesh geometry={(nodes.geometry_0 as any).geometry} material={(nodes.geometry_0 as any).material} castShadow />
      </group>
   );
}

useGLTF.preload('/3d/models/datacenter/server512.glb');
