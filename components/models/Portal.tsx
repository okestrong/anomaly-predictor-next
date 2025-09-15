import React from 'react';
import { useGLTF } from '@react-three/drei';

export function Portal(props: any) {
   const { nodes, materials } = useGLTF('/3d/models/portal/portal.glb');
   return (
      <group {...props} dispose={null}>
         <mesh
            geometry={(nodes['tripo_node_0a755ab7-ef11-4110-bae7-40e4e23a6373'] as any).geometry}
            material={materials['tripo_mat_0a755ab7-ef11-4110-bae7-40e4e23a6373']}
         />
      </group>
   );
}

useGLTF.preload('/3d/models/portal/portal.glb');
