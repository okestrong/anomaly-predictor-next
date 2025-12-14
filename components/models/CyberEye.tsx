import React from 'react';
import { useGLTF } from '@react-three/drei';

export function CyberEye(props: any) {
   const { nodes, materials } = useGLTF('/3d/models/datacenter/cyber-eye.glb');
   return (
      <group {...props} dispose={null}>
         <mesh geometry={(nodes.geometry_0 as any).geometry} material={(nodes.geometry_0 as any).material} />
      </group>
   );
}

useGLTF.preload('/3d/models/datacenter/cyber-eye.glb');
