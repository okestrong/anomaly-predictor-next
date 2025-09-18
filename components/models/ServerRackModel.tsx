import React from 'react';
import { useGLTF } from '@react-three/drei';

export default function ServerRackModel(props: any) {
   const { nodes, materials } = useGLTF('/3d/models/rack/ServerRack.glb');
   return (
      <group {...props} dispose={null}>
         <mesh geometry={(nodes.mesh_0 as any).geometry} material={(nodes.mesh_0 as any).material} castShadow />
      </group>
   );
}

useGLTF.preload('/3d/models/rack/ServerRack.glb');
