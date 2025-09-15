'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';

function makeTopCircularTextTexture(opts: {
   text: string;
   size?: number; // 캔버스 정사각 해상도
   font?: string; // CSS font
   innerRatio?: number; // 안쪽 반지름 비율 (0~1), 링 중심선 잡는 용도
   outerRatio?: number; // 바깥 반지름 비율 (0~1)
   clockwise?: boolean;
}) {
   const { text, size = 2048, font = '700 140px Inter, Pretendard, Arial, sans-serif', innerRatio = 0.55, outerRatio = 0.9, clockwise = true } = opts;

   const c = document.createElement('canvas');
   c.width = c.height = size;
   const ctx = c.getContext('2d')!;
   // 배경 투명 (윗면 재질 컬러 위에 얹힘)
   ctx.clearRect(0, 0, size, size);

   ctx.save();
   ctx.translate(size / 2, size / 2);
   ctx.font = font;
   ctx.fillStyle = '#ffffff';
   ctx.textAlign = 'center';
   ctx.textBaseline = 'middle';

   // 텍스트를 그릴 반지름(링의 중앙선 근처)
   const radius = ((innerRatio + outerRatio) / 2) * (size / 2);
   // 시작 각도: 12시 방향부터 시계방향
   let angle = -Math.PI / 2;
   // 글자 간격을 각도로 환산: θ ≈ width / r
   const widths = [...text].map(ch => ctx.measureText(ch).width);
   const totalArc = widths.reduce((s, w) => s + w / radius, 0);
   // 문장을 원 둘레에 고르게 배치
   angle -= totalArc / 2;

   for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const w = widths[i];
      // 현재 글자 중심 각도만큼 회전
      angle += (w / 2 / radius) * (clockwise ? 1 : -1);
      ctx.save();
      ctx.rotate(angle);
      ctx.translate(radius, 0);
      ctx.rotate((Math.PI / 2) * (clockwise ? 1 : -1)); // 글자 위쪽이 원의 외곽을 향하도록
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

/** 원형 탁자(구멍 뚫린 원판) + 윗면 원형 텍스트 */
type RoundTableProps = {
   outerRadius?: number;
   innerRadius?: number;
   height?: number;
   color: string;
   sideColor: string;
} & ThreeElements['mesh'];

export default function RoundTable({ color, sideColor, outerRadius = 2.0, innerRadius = 1.2, height = 0.4, ...rest }: RoundTableProps) {
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
         curveSegments: 128,
      });

      // z로 눕지 않게: 높이가 Y축이 되도록 회전/이동
      g.rotateX(Math.PI / 2);
      g.translate(0, height / 2, 0);
      g.computeVertexNormals();
      return g;
   }, [outerRadius, innerRadius, height]);

   // 2) 윗면 텍스처 (원형 문구)
   const topTex = useMemo(
      () =>
         makeTopCircularTextTexture({
            text: 'OKESTRO * CONTRABASS SDS+',
            // 링 폭 비율에 맞춰 글자 반지름대를 대략 보정
            innerRatio: innerRadius / outerRadius + 0.05,
            outerRatio: 0.95,
         }),
      [outerRadius, innerRadius],
   );

   // ExtrudeGeometry는 보통 material group이: 0=Side, 1=Top, 2=Bottom
   const sideMat = useMemo(
      () =>
         new THREE.MeshPhysicalMaterial({
            color: color,
            metalness: 0.2,
            roughness: 0.6,
         }),
      [],
   );

   const capMat = useMemo(
      () =>
         new THREE.MeshPhysicalMaterial({
            color: sideColor,
            // map: topTex, // 윗/아랫면에 동일 텍스처(아랫면은 거의 안 보임)
            metalness: 0.1,
            roughness: 0.7,
         }),
      [topTex],
   );

   return <mesh geometry={geom} castShadow receiveShadow material={[sideMat, capMat, capMat]} {...rest} />;
}
