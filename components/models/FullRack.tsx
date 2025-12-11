import React from 'react';
import { useGLTF } from '@react-three/drei';

export function FullRack(props: any) {
   const { nodes } = useGLTF('/3d/models/datacenter/full-rack.glb');
   return (
      <group {...props} dispose={null}>
         <mesh geometry={(nodes.geometry_0 as any).geometry} material={(nodes.geometry_0 as any).material} castShadow={!!props.castShadow} />
      </group>
   );
}

useGLTF.preload('/3d/models/datacenter/full-rack.glb');
