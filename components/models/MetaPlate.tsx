import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeElements, useFrame } from '@react-three/fiber';

type MetaPlateProps = {
   animate?: boolean;
} & ThreeElements['mesh'];

export function MetaPlate({ animate, ...rest }: MetaPlateProps) {
   const metaRef = useRef(null);
   const { nodes, materials } = useGLTF('/3d/models/metaplate/metaplate.glb');

   useFrame(() => {
      if (animate) {
         (metaRef.current! as any).rotation.y += 0.01;
         (metaRef.current! as any).rotation.x += 0.003;
      }
   });

   return (
      <mesh
         ref={metaRef}
         {...rest}
         dispose={null}
         geometry={(nodes['tripo_node_00077f79-aae9-4c4a-a99b-283bd1ecf0c2'] as any).geometry}
         material={materials['tripo_mat_00077f79-aae9-4c4a-a99b-283bd1ecf0c2']}
      />
   );
}

useGLTF.preload('/3d/models/metaplate/metaplate.glb');
