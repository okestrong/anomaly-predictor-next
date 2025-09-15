import { useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';
import Colors from '@/utils/color';

/** 아래면에 원형 텍스트를 그려서 Texture로 반환 */
function makeBottomCircularTextTexture(opts: {
   text: string;
   size?: number;
   font?: string;
   innerRatio?: number;
   outerRatio?: number;
   clockwise?: boolean;
   textColor?: string;
}) {
   const {
      text,
      size = 2048,
      font = '700 140px Inter, Pretendard, Arial, sans-serif',
      innerRatio = 0.55,
      outerRatio = 0.9,
      clockwise = true,
      textColor = '#ffffff',
   } = opts;

   const c = document.createElement('canvas');
   c.width = c.height = size;
   const ctx = c.getContext('2d')!;

   // 배경을 투명하게
   ctx.clearRect(0, 0, size, size);

   // 디버깅용: 배경색 추가 (선택사항)
   // ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
   // ctx.fillRect(0, 0, size, size);

   ctx.save();
   ctx.translate(size / 2, size / 2);

   // 좌우 반전 제거 (이 줄 삭제 또는 주석처리)
   // ctx.scale(-1, 1);

   ctx.font = font;
   ctx.fillStyle = textColor;
   ctx.textAlign = 'center';
   ctx.textBaseline = 'middle';

   const radius = ((innerRatio + outerRatio) / 2) * (size / 2);
   let angle = -Math.PI / 2;

   const widths = [...text].map(ch => ctx.measureText(ch).width);
   const totalArc = widths.reduce((s, w) => s + w / radius, 0);
   angle -= totalArc / 2;

   for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const w = widths[i];
      angle += (w / 2 / radius) * (clockwise ? 1 : -1);

      ctx.save();
      ctx.rotate(angle);
      ctx.translate(radius, 0);
      ctx.rotate((Math.PI / 2) * (clockwise ? 1 : -1));
      ctx.fillText(ch, 0, 0);
      ctx.restore();

      angle += (w / 2 / radius) * (clockwise ? 1 : -1);
   }

   ctx.restore();

   const tex = new THREE.CanvasTexture(c);
   tex.anisotropy = 8;
   tex.generateMipmaps = true;
   tex.minFilter = THREE.LinearMipmapLinearFilter;
   tex.magFilter = THREE.LinearFilter;
   tex.colorSpace = THREE.SRGBColorSpace;

   return tex;
}

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
   bottomText?: string;
   bottomTextColor?: string;
   segment?: number;
} & ThreeElements['group'];

export default function RoundMirrorTextTable({
   color,
   sideColor,
   outerRadius = 2.0,
   innerRadius = 1.2,
   height = 0.4,
   topCrystal,
   topMirror,
   sideMirror,
   sideCrystal,
   bottomText = 'OKESTRO',
   bottomTextColor = '#ffffff',
   segment,
   ...rest
}: RoundMirrorTableProps) {
   // 메인 테이블 geometry (옆면과 캡)
   const tableGeom = useMemo(() => {
      const shape = new THREE.Shape();
      shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
      shape.holes.push(hole);

      const g = new THREE.ExtrudeGeometry(shape, {
         depth: height,
         bevelEnabled: false,
         curveSegments: segment,
      });

      g.rotateX(Math.PI / 2);
      g.translate(0, height / 2, 0);
      g.computeVertexNormals();
      return g;
   }, [outerRadius, innerRadius, height]);

   // 아래면 전용 RingGeometry (정확한 UV를 위해)
   const bottomTextGeom = useMemo(() => {
      const g = new THREE.RingGeometry(
         innerRadius,
         outerRadius,
         128, // theta segments
         1, // phi segments
      );

      // 아래를 향하도록 회전
      g.rotateX(Math.PI / 2);
      // 아래면 위치 (약간 offset으로 Z-fighting 방지)
      g.translate(0, -height / 2 - 0.1, 0);

      return g;
   }, [outerRadius, innerRadius, height]);

   // 아래면 텍스처 생성
   const bottomTex = useMemo(() => {
      const ringWidth = outerRadius - innerRadius;
      const fontSize = Math.floor(((ringWidth * 2048) / (outerRadius * 2)) * 0.5);

      return makeBottomCircularTextTexture({
         text: bottomText,
         size: 2048,
         font: `800 ${fontSize}px Inter, Pretendard, Arial, sans-serif`,
         innerRatio: innerRadius / outerRadius,
         outerRatio: 1.0,
         clockwise: true,
         textColor: bottomTextColor,
      });
   }, [outerRadius, innerRadius, bottomText, bottomTextColor]);

   // 옆면 재질
   const sideMat = useMemo(
      () =>
         topMirror
            ? new THREE.MeshPhysicalMaterial({
                 color: '#ffffff',
                 metalness: 1.0,
                 roughness: 0.02,
                 clearcoat: 1.0,
                 clearcoatRoughness: 0.0,
                 envMapIntensity: 1.2,
              })
            : topCrystal
              ? new THREE.MeshPhysicalMaterial({
                   transmission: 1,
                   thickness: Math.max(0.04, height * 0.5),
                   ior: 1.5,
                   roughness: 0.02,
                   metalness: 0.0,
                   attenuationColor: new THREE.Color('#dff3ff'),
                   attenuationDistance: height * 2.0,
                   transparent: true,
                   envMapIntensity: 1.0,
                })
              : new THREE.MeshPhysicalMaterial({
                   color: color ?? Colors.black,
                   metalness: 0.1,
                   roughness: 0.7,
                }),
      [topMirror, topCrystal, color, height],
   );

   // 윗면/기본 아래면 재질
   const capMat = useMemo(
      () =>
         sideMirror
            ? new THREE.MeshPhysicalMaterial({
                 color: '#ffffff',
                 metalness: 1.0,
                 roughness: 0.02,
                 clearcoat: 1.0,
                 clearcoatRoughness: 0.0,
                 envMapIntensity: 1.2,
              })
            : sideCrystal
              ? new THREE.MeshPhysicalMaterial({
                   transmission: 1,
                   thickness: Math.max(0.04, height * 0.5),
                   ior: 1.5,
                   roughness: 0.02,
                   metalness: 0.0,
                   attenuationColor: new THREE.Color('#dff3ff'),
                   attenuationDistance: height * 2.0,
                   transparent: true,
                   envMapIntensity: 1.0,
                })
              : new THREE.MeshPhysicalMaterial({
                   color: sideColor ?? Colors.black,
                   metalness: 0.2,
                   roughness: 0.6,
                }),
      [sideMirror, sideCrystal, sideColor, height],
   );

   // 텍스처가 있는 아래면 재질
   const bottomTextMat = useMemo(
      () =>
         new THREE.MeshPhysicalMaterial({
            color: '#ffffff', // 흰색으로 텍스처가 잘 보이도록
            map: bottomTex,
            metalness: 0.0,
            roughness: 0.8,
            side: THREE.FrontSide, // 아래에서 볼 때 보이는 면
            transparent: true,
            opacity: 1.0,
            polygonOffset: true, // 미세한 z-fighting 방지
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
            toneMapped: false, // 톤매핑 영향 제거(텍스트 또렷)
            depthWrite: false, // 깊이 버퍼 기록 금지
            depthTest: true, // 가려질 땐 정상적으로 가려지게
         }),
      [bottomTex],
   );

   return (
      <group {...rest}>
         {/* 메인 테이블 */}
         <mesh geometry={tableGeom} castShadow receiveShadow>
            <primitive object={sideMat} attach="material-0" />
            <primitive object={capMat} attach="material-1" />
            <primitive object={capMat} attach="material-2" />
         </mesh>

         {/* 텍스처가 있는 아래면 (별도) */}
         <mesh geometry={bottomTextGeom} material={bottomTextMat} castShadow={false} receiveShadow={false} renderOrder={10} frustumCulled={false} />
      </group>
   );
}
