'use client';

import { forwardRef, ReactNode, RefObject, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { makeSphereTexture } from '@/utils/utils';
import * as THREE from 'three';
import Colors from '@/utils/color';

const TextSphere = forwardRef<
   any,
   {
      scale: number;
      rotation?: [number, number, number];
      position: [number, number, number];
      text: string;
      bgColor: string;
      textColor: string;
      children?: ReactNode | ReactNode[];
      rest?: { [key: string]: any };
   }
>(({ scale, rotation, position, text, bgColor, textColor, children, rest }, ref) => {
   const meshRef = useRef<THREE.Mesh>(null);
   const { gl } = useThree();
   const map = useMemo(() => makeSphereTexture(gl, text, bgColor, textColor), [gl]);

   useFrame(() => {
      const myRef = (ref as RefObject<any>)?.current || meshRef.current;
      myRef!.rotation.y -= 0.005;
   });

   return (
      <mesh ref={ref ?? meshRef} scale={scale} position={position} rotation={rotation ?? [0, Math.PI, 0 /* seam(경도 0) 뒤로 */]} {...rest}>
         <sphereGeometry args={[2, 128, 128]} />
         <meshStandardMaterial map={map} metalness={0.2} roughness={0.8} color={bgColor} />
         {!!children && children}
      </mesh>
   );
});

export default TextSphere;
