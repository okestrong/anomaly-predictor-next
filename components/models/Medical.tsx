import React from 'react';
import { useGLTF } from '@react-three/drei';

export function Medical(props: any) {
   const { nodes, materials } = useGLTF('/3d/models/medical/base_basic_shaded.glb');
   return (
      <group {...props} dispose={null}>
         <mesh geometry={(nodes.model as any).geometry} material={materials.model} />
      </group>
   );
}

useGLTF.preload('/3d/models/medical/base_basic_shaded.glb');
