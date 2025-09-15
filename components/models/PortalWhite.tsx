import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

export function PortalWhite(props: any) {
   const { nodes, materials } = useGLTF('/3d/models/portal/result.gltf');
   const portalRef = useRef<any>(null);

   useFrame(() => {
      portalRef.current.rotation.y -= 0.01;
   });

   return (
      <group {...props} dispose={null} ref={portalRef}>
         <group position={[0, 2.5, 0]}>
            <group rotation={[0, Math.PI / 3, 0]}>
               <mesh geometry={(nodes.Componente1_node_16 as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
               <mesh geometry={(nodes.Componente1_node_17 as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
               <mesh geometry={(nodes.Componente1_node_18 as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
               <mesh geometry={(nodes.Componente1_node_19 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_20 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_21 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_22 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_23 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_24 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_25 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_26 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_27 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_28 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_29 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_30 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_31 as any).geometry} material={materials['Emissive Warm #1']} />
            </group>
            <group rotation={[Math.PI, Math.PI / 3, Math.PI]}>
               <mesh geometry={(nodes.Componente1_node_33 as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
               <mesh geometry={(nodes.Componente1_node_34 as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
               <mesh geometry={(nodes.Componente1_node_35 as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
               <mesh geometry={(nodes.Componente1_node_36 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_37 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_38 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_39 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_40 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_41 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_42 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_43 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_44 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_45 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_46 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_47 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_48 as any).geometry} material={materials['Emissive Warm #1']} />
            </group>
            <group rotation={[Math.PI, 0, Math.PI]}>
               <mesh geometry={(nodes.Componente1_node_50 as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
               <mesh geometry={(nodes.Componente1_node_51 as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
               <mesh geometry={(nodes.Componente1_node_52 as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
               <mesh geometry={(nodes.Componente1_node_53 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_54 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_55 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_56 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_57 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_58 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_59 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_60 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_61 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_62 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_63 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_64 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_65 as any).geometry} material={materials['Emissive Warm #1']} />
            </group>
            <group rotation={[Math.PI, -Math.PI / 3, Math.PI]}>
               <mesh geometry={(nodes.Componente1_node_67 as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
               <mesh geometry={(nodes.Componente1_node_68 as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
               <mesh geometry={(nodes.Componente1_node_69 as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
               <mesh geometry={(nodes.Componente1_node_70 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_71 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_72 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_73 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_74 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_75 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_76 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_77 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_78 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_79 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_80 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_81 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_82 as any).geometry} material={materials['Emissive Warm #1']} />
            </group>
            <group rotation={[0, -Math.PI / 3, 0]}>
               <mesh geometry={(nodes.Componente1_node_84 as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
               <mesh geometry={(nodes.Componente1_node_85 as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
               <mesh geometry={(nodes.Componente1_node_86 as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
               <mesh geometry={(nodes.Componente1_node_87 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_88 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_89 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_90 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_91 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_92 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_93 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_94 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_95 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_96 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes.Componente1_node_97 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_98 as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes.Componente1_node_99 as any).geometry} material={materials['Emissive Warm #1']} />
            </group>
            <group position={[0, 21, 0]} rotation={[0, 0, Math.PI]}>
               <mesh geometry={(nodes['Componente1(Simetría)_node'] as any).geometry} material={materials['Componente1(Simetría):color:251:250:245']} />
               <mesh geometry={(nodes['Componente1(Simetría)_node_0'] as any).geometry} material={materials['Componente1(Simetría):color:251:250:245']} />
               <mesh geometry={(nodes['Componente1(Simetría)_node_1'] as any).geometry} material={materials['Componente1(Simetría):color:251:250:245']} />
               <mesh geometry={(nodes['Componente1(Simetría)_node_2'] as any).geometry} material={materials['Componente1(Simetría):color:89:89:89']} />
               <mesh geometry={(nodes['Componente1(Simetría)_node_3'] as any).geometry} material={materials['Componente1(Simetría):color:89:89:89']} />
               <mesh geometry={(nodes['Componente1(Simetría)_node_4'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_node_5'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_node_6'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_node_7'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_node_8'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_node_9'] as any).geometry} material={materials['Componente1(Simetría):color:89:89:89']} />
               <mesh geometry={(nodes['Componente1(Simetría)_node_10'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_node_11'] as any).geometry} material={materials['Componente1(Simetría):color:89:89:89']} />
               <mesh geometry={(nodes['Componente1(Simetría)_node_12'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_node_13'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_node_14'] as any).geometry} material={materials['Emissive Warm #1']} />
            </group>
            <group position={[0, 21, 0]} rotation={[-Math.PI, 0, 0]}>
               <mesh geometry={(nodes['Componente1(Simetría)_(1)_node'] as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(1)_node_0'] as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(1)_node_1'] as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(1)_node_2'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(1)_node_3'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(1)_node_4'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(1)_node_5'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(1)_node_6'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(1)_node_7'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(1)_node_8'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(1)_node_9'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(1)_node_10'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(1)_node_11'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(1)_node_12'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(1)_node_13'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(1)_node_14'] as any).geometry} material={materials['Emissive Warm #1']} />
            </group>
            <group position={[0, 21, 0]} rotation={[-Math.PI, -Math.PI / 3, 0]}>
               <mesh geometry={(nodes['Componente1(Simetría)_(2)_node'] as any).geometry} material={materials['Componente1(Simetría) (2):color:251:250:245']} />
               <mesh
                  geometry={(nodes['Componente1(Simetría)_(2)_node_0'] as any).geometry}
                  material={materials['Componente1(Simetría) (2):color:251:250:245']}
               />
               <mesh
                  geometry={(nodes['Componente1(Simetría)_(2)_node_1'] as any).geometry}
                  material={materials['Componente1(Simetría) (2):color:251:250:245']}
               />
               <mesh geometry={(nodes['Componente1(Simetría)_(2)_node_2'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(2)_node_3'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(2)_node_4'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(2)_node_5'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(2)_node_6'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(2)_node_7'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(2)_node_8'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(2)_node_9'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(2)_node_10'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(2)_node_11'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(2)_node_12'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(2)_node_13'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(2)_node_14'] as any).geometry} material={materials['Emissive Warm #1']} />
            </group>
            <group position={[0, 21, 0]} rotation={[0, -Math.PI / 3, Math.PI]}>
               <mesh geometry={(nodes['Componente1(Simetría)_(3)_node'] as any).geometry} material={materials['Componente1(Simetría) (3):color:251:250:245']} />
               <mesh
                  geometry={(nodes['Componente1(Simetría)_(3)_node_0'] as any).geometry}
                  material={materials['Componente1(Simetría) (3):color:251:250:245']}
               />
               <mesh
                  geometry={(nodes['Componente1(Simetría)_(3)_node_1'] as any).geometry}
                  material={materials['Componente1(Simetría) (3):color:251:250:245']}
               />
               <mesh geometry={(nodes['Componente1(Simetría)_(3)_node_2'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(3)_node_3'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(3)_node_4'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(3)_node_5'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(3)_node_6'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(3)_node_7'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(3)_node_8'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(3)_node_9'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(3)_node_10'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(3)_node_11'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(3)_node_12'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(3)_node_13'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(3)_node_14'] as any).geometry} material={materials['Emissive Warm #1']} />
            </group>
            <group position={[0, 21, 0]} rotation={[0, Math.PI / 3, -Math.PI]}>
               <mesh geometry={(nodes['Componente1(Simetría)_(4)_node'] as any).geometry} material={materials['Componente1(Simetría) (4):color:251:250:245']} />
               <mesh
                  geometry={(nodes['Componente1(Simetría)_(4)_node_0'] as any).geometry}
                  material={materials['Componente1(Simetría) (4):color:251:250:245']}
               />
               <mesh
                  geometry={(nodes['Componente1(Simetría)_(4)_node_1'] as any).geometry}
                  material={materials['Componente1(Simetría) (4):color:251:250:245']}
               />
               <mesh geometry={(nodes['Componente1(Simetría)_(4)_node_2'] as any).geometry} material={materials['Componente1(Simetría) (4):color:89:89:89']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(4)_node_3'] as any).geometry} material={materials['Componente1(Simetría) (4):color:89:89:89']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(4)_node_4'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(4)_node_5'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(4)_node_6'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(4)_node_7'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(4)_node_8'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(4)_node_9'] as any).geometry} material={materials['Componente1(Simetría) (4):color:89:89:89']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(4)_node_10'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(4)_node_11'] as any).geometry} material={materials['Componente1(Simetría) (4):color:89:89:89']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(4)_node_12'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(4)_node_13'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(4)_node_14'] as any).geometry} material={materials['Emissive Warm #1']} />
            </group>
            <group position={[0, 21, 0]} rotation={[-Math.PI, Math.PI / 3, 0]}>
               <mesh geometry={(nodes['Componente1(Simetría)_(5)_node'] as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(5)_node_0'] as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(5)_node_1'] as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(5)_node_2'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(5)_node_3'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(5)_node_4'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(5)_node_5'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(5)_node_6'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(5)_node_7'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(5)_node_8'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(5)_node_9'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(5)_node_10'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(5)_node_11'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(5)_node_12'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(5)_node_13'] as any).geometry} material={materials['Chrome Polished']} />
               <mesh geometry={(nodes['Componente1(Simetría)_(5)_node_14'] as any).geometry} material={materials['Emissive Warm #1']} />
            </group>
            <group position={[0, 21, 0]} rotation={[-Math.PI, 0, 0]}>
               <mesh geometry={(nodes['centro(Simetría)_node'] as any).geometry} material={materials['Anodized Aluminum Rough Blue #1']} />
               <mesh geometry={(nodes['centro(Simetría)_node_0'] as any).geometry} material={materials['Emissive Warm #1']} />
               <mesh geometry={(nodes['centro(Simetría)_node_1'] as any).geometry} material={materials['Glass Basic White']} />
               <mesh geometry={(nodes['centro(Simetría)_node_2'] as any).geometry} material={materials['Emissive Warm #1']} />
               <mesh geometry={(nodes['centro(Simetría)_node_3'] as any).geometry} material={materials['Emissive Warm #1']} />
               <mesh geometry={(nodes['centro(Simetría)_node_4'] as any).geometry} material={materials['Emissive Warm #1']} />
               <mesh geometry={(nodes['centro(Simetría)_node_5'] as any).geometry} material={materials['Emissive Warm #1']} />
               <mesh geometry={(nodes['centro(Simetría)_node_6'] as any).geometry} material={materials['Emissive Warm #1']} />
               <mesh geometry={(nodes['centro(Simetría)_node_7'] as any).geometry} material={materials['Emissive Warm #1']} />
               <mesh geometry={(nodes['centro(Simetría)_node_8'] as any).geometry} material={materials['Glass Basic White']} />
               <mesh geometry={(nodes['centro(Simetría)_node_9'] as any).geometry} material={materials['Emissive Warm #1']} />
               <mesh geometry={(nodes['centro(Simetría)_node_10'] as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
            </group>
            <mesh geometry={(nodes.portal_node as any).geometry} material={materials['Paint Metallic Orange peel White #5']} />
            <mesh geometry={(nodes.portal_node_0 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
            <mesh geometry={(nodes.portal_node_1 as any).geometry} material={materials['Paint Metallic Candy Blue']} />
            <mesh geometry={(nodes.portal_node_2 as any).geometry} material={materials['Paint Metallic Candy Blue']} />
            <mesh geometry={(nodes.portal_node_3 as any).geometry} material={materials['Paint Metallic Candy Blue']} />
            <mesh geometry={(nodes.portal_node_4 as any).geometry} material={materials['Paint Metallic Candy Blue']} />
            <mesh geometry={(nodes.portal_node_5 as any).geometry} material={materials['Paint Metallic Candy Blue']} />
            <mesh geometry={(nodes.portal_node_6 as any).geometry} material={materials['Paint Metallic Candy Blue']} />
            <mesh geometry={(nodes.Componente1_node as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
            <mesh geometry={(nodes.Componente1_node_0 as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
            <mesh geometry={(nodes.Componente1_node_1 as any).geometry} material={materials['Paint Metallic Orange peel White #3']} />
            <mesh geometry={(nodes.Componente1_node_2 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
            <mesh geometry={(nodes.Componente1_node_3 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
            <mesh geometry={(nodes.Componente1_node_4 as any).geometry} material={materials['Chrome Polished']} />
            <mesh geometry={(nodes.Componente1_node_5 as any).geometry} material={materials['Chrome Polished']} />
            <mesh geometry={(nodes.Componente1_node_6 as any).geometry} material={materials['Chrome Polished']} />
            <mesh geometry={(nodes.Componente1_node_7 as any).geometry} material={materials['Chrome Polished']} />
            <mesh geometry={(nodes.Componente1_node_8 as any).geometry} material={materials['Chrome Polished']} />
            <mesh geometry={(nodes.Componente1_node_9 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
            <mesh geometry={(nodes.Componente1_node_10 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
            <mesh geometry={(nodes.Componente1_node_11 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
            <mesh geometry={(nodes.Componente1_node_12 as any).geometry} material={materials['Chrome Polished']} />
            <mesh geometry={(nodes.Componente1_node_13 as any).geometry} material={materials['Chrome Polished']} />
            <mesh geometry={(nodes.Componente1_node_14 as any).geometry} material={materials['Emissive Warm #1']} />
            <mesh geometry={(nodes.centro_node as any).geometry} material={materials['Anodized Aluminum Rough Blue #1']} />
            <mesh geometry={(nodes.centro_node_0 as any).geometry} material={materials['Emissive Warm #1']} />
            <mesh geometry={(nodes.centro_node_1 as any).geometry} material={materials['Glass Basic White']} />
            <mesh geometry={(nodes.centro_node_2 as any).geometry} material={materials['Emissive Warm #1']} />
            <mesh geometry={(nodes.centro_node_3 as any).geometry} material={materials['Emissive Warm #1']} />
            <mesh geometry={(nodes.centro_node_4 as any).geometry} material={materials['Emissive Warm #1']} />
            <mesh geometry={(nodes.centro_node_5 as any).geometry} material={materials['Emissive Warm #1']} />
            <mesh geometry={(nodes.centro_node_6 as any).geometry} material={materials['Emissive Warm #1']} />
            <mesh geometry={(nodes.centro_node_7 as any).geometry} material={materials['Emissive Warm #1']} />
            <mesh geometry={(nodes.centro_node_8 as any).geometry} material={materials['Glass Basic White']} />
            <mesh geometry={(nodes.centro_node_9 as any).geometry} material={materials['Emissive Warm #1']} />
            <mesh geometry={(nodes.centro_node_10 as any).geometry} material={materials['Anodized Aluminum Rough Black #2']} />
         </group>
      </group>
   );
}

useGLTF.preload('/3d/models/portal/result.gltf');
