import React from 'react';
import { useGLTF } from '@react-three/drei';

export function ControlBox(props: any) {
   const { nodes, materials } = useGLTF('/3d/models/controlbox/base_basic_shaded.glb');
   return (
      <group {...props} dispose={null}>
         <mesh geometry={(nodes.model as any).geometry} material={materials.model} />
      </group>
   );
}

useGLTF.preload('/3d/models/controlbox/base_basic_shaded.glb');
