import React from 'react';
import { useGLTF } from '@react-three/drei';

export function PortalLight(props: any) {
   const { nodes, materials } = useGLTF('/3d/models/portal/portal-light.glb');
   return (
      <group {...props} dispose={null}>
         <mesh geometry={(nodes.tripo_part_0 as any).geometry} material={materials['Material_tripo_part_0.001']} />
         <mesh geometry={(nodes.tripo_part_1 as any).geometry} material={materials['Material_tripo_part_1.001']} />
         <mesh geometry={(nodes.tripo_part_10 as any).geometry} material={materials['Material_tripo_part_10.001']} />
         <mesh geometry={(nodes.tripo_part_11 as any).geometry} material={materials['Material_tripo_part_11.001']} />
         <mesh geometry={(nodes.tripo_part_12 as any).geometry} material={materials['Material_tripo_part_12.001']} />
         <mesh geometry={(nodes.tripo_part_13 as any).geometry} material={materials['Material_tripo_part_13.001']} />
         <mesh geometry={(nodes.tripo_part_14 as any).geometry} material={materials['Material_tripo_part_14.001']} />
         <mesh geometry={(nodes.tripo_part_15 as any).geometry} material={materials['Material_tripo_part_15.001']} />
         <mesh geometry={(nodes.tripo_part_16 as any).geometry} material={materials['Material_tripo_part_16.001']} />
         <mesh geometry={(nodes.tripo_part_17 as any).geometry} material={materials['Material_tripo_part_17.001']} />
         <mesh geometry={(nodes.tripo_part_18 as any).geometry} material={materials['Material_tripo_part_18.001']} />
         <mesh geometry={(nodes.tripo_part_19 as any).geometry} material={materials['Material_tripo_part_19.001']} />
         <mesh geometry={(nodes.tripo_part_2 as any).geometry} material={materials['Material_tripo_part_2.001']} />
         <mesh geometry={(nodes.tripo_part_20 as any).geometry} material={materials['Material_tripo_part_20.001']} />
         <mesh geometry={(nodes.tripo_part_21 as any).geometry} material={materials['Material_tripo_part_21.001']} />
         <mesh geometry={(nodes.tripo_part_22 as any).geometry} material={materials['Material_tripo_part_22.001']} />
         <mesh geometry={(nodes.tripo_part_23 as any).geometry} material={materials['Material_tripo_part_23.001']} />
         <mesh geometry={(nodes.tripo_part_24 as any).geometry} material={materials['Material_tripo_part_24.001']} />
         <mesh geometry={(nodes.tripo_part_25 as any).geometry} material={materials['Material_tripo_part_25.001']} />
         <mesh geometry={(nodes.tripo_part_26 as any).geometry} material={materials['Material_tripo_part_26.001']} />
         <mesh geometry={(nodes.tripo_part_27 as any).geometry} material={materials['Material_tripo_part_27.001']} />
         <mesh geometry={(nodes.tripo_part_28 as any).geometry} material={materials['Material_tripo_part_28.001']} />
         <mesh geometry={(nodes.tripo_part_29 as any).geometry} material={materials['Material_tripo_part_29.001']} />
         <mesh geometry={(nodes.tripo_part_3 as any).geometry} material={materials['Material_tripo_part_3.001']} />
         <mesh geometry={(nodes.tripo_part_30 as any).geometry} material={materials['Material_tripo_part_30.001']} />
         <mesh geometry={(nodes.tripo_part_31 as any).geometry} material={materials['Material_tripo_part_31.001']} />
         <mesh geometry={(nodes.tripo_part_32 as any).geometry} material={materials['Material_tripo_part_32.001']} />
         <mesh geometry={(nodes.tripo_part_33 as any).geometry} material={materials['Material_tripo_part_33.001']} />
         <mesh geometry={(nodes.tripo_part_34 as any).geometry} material={materials['Material_tripo_part_34.001']} />
         <mesh geometry={(nodes.tripo_part_35 as any).geometry} material={materials['Material_tripo_part_35.001']} />
         <mesh geometry={(nodes.tripo_part_36 as any).geometry} material={materials['Material_tripo_part_36.001']} />
         <mesh geometry={(nodes.tripo_part_4 as any).geometry} material={materials['Material_tripo_part_4.001']} />
         <mesh geometry={(nodes.tripo_part_5 as any).geometry} material={materials['Material_tripo_part_5.001']} />
         <mesh geometry={(nodes.tripo_part_6 as any).geometry} material={materials['Material_tripo_part_6.001']} />
         <mesh geometry={(nodes.tripo_part_7 as any).geometry} material={materials['Material_tripo_part_7.001']} />
         <mesh geometry={(nodes.tripo_part_8 as any).geometry} material={materials['Material_tripo_part_8.001']} />
         <mesh geometry={(nodes.tripo_part_9 as any).geometry} material={materials['Material_tripo_part_9.001']} />
      </group>
   );
}

useGLTF.preload('/3d/models/portal/portal-light.glb');
