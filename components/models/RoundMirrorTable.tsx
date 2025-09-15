import { useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';
import Colors from '@/utils/color';

type RoundMirrorTableProps = {
   outerRadius?: number;
   innerRadius?: number;
   height?: number;
   color?: string;
   sideColor?: string;
   topCrystal?: boolean;
   topMirror?: boolean;
   sideMirror?: boolean;
   sideCrystal?: boolean;
   segment?: number;
} & ThreeElements['mesh'];

export default function RoundMirrorTable({
   color,
   sideColor,
   outerRadius = 2.0,
   innerRadius = 1.2,
   height = 0.4,
   topCrystal,
   topMirror,
   sideMirror,
   sideCrystal,
   segment,
   ...rest
}: RoundMirrorTableProps) {
   // 1) Shape + Hole → Extrude로 옆면 생성
   const geom = useMemo(() => {
      const shape = new THREE.Shape();
      // 외곽 원
      shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
      // 내부 구멍
      const hole = new THREE.Path();
      hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
      shape.holes.push(hole);

      const g = new THREE.ExtrudeGeometry(shape, {
         depth: height, // z+ 방향으로 두께
         bevelEnabled: false,
         curveSegments: segment ?? 128,
      });

      // z로 눕지 않게: 높이가 Y축이 되도록 회전/이동
      g.rotateX(Math.PI / 2);
      g.translate(0, height / 2, 0);
      g.computeVertexNormals();
      return g;
   }, [outerRadius, innerRadius, height]);

   const topMat = useMemo(
      () =>
         topMirror
            ? new THREE.MeshPhysicalMaterial({
                 // 거울은 색 틴팅을 줄이기 위해 흰색 권장
                 color: '#ffffff',
                 metalness: 1.0,
                 roughness: 0.02, // 0에 가깝게. 0.00~0.05 사이에서 취향 조정
                 clearcoat: 1.0,
                 clearcoatRoughness: 0.0,
                 envMapIntensity: 1.2, // 씬 환경맵 강도 보정
              })
            : topCrystal
              ? new THREE.MeshPhysicalMaterial({
                   transmission: 1, // 유리 통과
                   thickness: Math.max(0.04, height * 0.5), // 두께(볼륨감)
                   ior: 1.5, // 굴절률 (유리 ~1.5)
                   roughness: 0.02, // 거의 거울처럼
                   metalness: 0.0,
                   attenuationColor: new THREE.Color('#dff3ff'), // 약한 청색감
                   attenuationDistance: height * 2.0,
                   transparent: true,
                   envMapIntensity: 1.0,
                })
              : new THREE.MeshPhysicalMaterial({
                   color: color ?? Colors.black,
                   metalness: 0.2,
                   roughness: 0.6,
                }),
      [topMirror, topCrystal],
   );

   const sideMat = useMemo(
      () =>
         sideMirror
            ? new THREE.MeshPhysicalMaterial({
                 // 거울은 색 틴팅을 줄이기 위해 흰색 권장
                 color: '#ffffff',
                 metalness: 1.0,
                 roughness: 0.02, // 0에 가깝게. 0.00~0.05 사이에서 취향 조정
                 clearcoat: 1.0,
                 clearcoatRoughness: 0.0,
                 envMapIntensity: 1.2, // 씬 환경맵 강도 보정
              })
            : sideCrystal
              ? new THREE.MeshPhysicalMaterial({
                   transmission: 1, // 유리 통과
                   thickness: Math.max(0.04, height * 0.5), // 두께(볼륨감)
                   ior: 1.5, // 굴절률 (유리 ~1.5)
                   roughness: 0.02, // 거의 거울처럼
                   metalness: 0.0,
                   attenuationColor: new THREE.Color('#dff3ff'), // 약한 청색감
                   attenuationDistance: height * 2.0,
                   transparent: true,
                   envMapIntensity: 1.0,
                })
              : new THREE.MeshPhysicalMaterial({
                   color: sideColor,
                   metalness: 0.1,
                   roughness: 0.7,
                }),
      [sideMirror, sideCrystal],
   );

   return <mesh geometry={geom} castShadow receiveShadow material={[topMat, sideMat, sideMat]} {...rest} />;
}
