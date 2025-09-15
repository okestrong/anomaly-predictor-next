import * as THREE from 'three';
import { useMemo } from 'react';
import { useTrimesh } from '@react-three/cannon';
import RoundMirrorTextTable from '../RoundMirrorTextTable';
import { Material } from 'cannon-es';

export default function RoundTablePhysics({ outerRadius = 90, innerRadius = 60, height = 3 }: { outerRadius?: number; innerRadius?: number; height?: number }) {
   // 렌더 메시는 그대로 쓰되, 물리용은 동일 파라미터로 ExtrudeGeometry를 만들어 Trimesh에 넘긴다.
   const geom = useMemo(() => {
      const shape = new THREE.Shape();
      shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
      shape.holes.push(hole);

      const g = new THREE.ExtrudeGeometry(shape, {
         depth: height,
         bevelEnabled: false,
         curveSegments: 128,
      });
      g.rotateX(Math.PI / 2);
      g.translate(0, height / 2, 0);
      g.computeVertexNormals();
      return g;
   }, [outerRadius, innerRadius, height]);

   // Trimesh는 position/indices 버퍼를 필요로 한다
   const vertices = useMemo(() => geom.attributes.position.array as unknown as Float32Array, [geom]);
   const indices = useMemo(() => geom.index!.array as unknown as Uint16Array, [geom]);

   // 물리 재질: 'table'
   const tableMat = useMemo(() => new Material('table'), []);

   // 정적 Trimesh 본체(렌더는 안 함)
   const [ref] = useTrimesh(() => ({
      type: 'Static',
      args: [vertices, indices],
      material: tableMat,
      collisionResponse: true,
   }));

   return (
      <>
         {/* 물리 충돌체(보이지 않음) */}
         <mesh ref={ref} geometry={geom} visible={false} />
         {/* 화면 렌더용(네가 만든 거 그대로) */}
         <RoundMirrorTextTable
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            height={height}
            sideMirror // 예시: 옆면 거울
            position={[0, 0, 0]}
         />
      </>
   );
}
