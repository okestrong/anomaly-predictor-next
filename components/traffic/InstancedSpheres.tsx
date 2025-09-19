// InstancedSpheres.tsx - High performance sphere rendering with instanced mesh
import * as THREE from 'three';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, InstancedMesh, Matrix4, Vector3 } from 'three';

type Props = {
   center: [number, number, number];
   radius: number;
   halfHeight: number;
   targetCount: number;
   maxCap?: number;
   sphereRadius?: number;
   color?: string;
   stiffness?: number; // shell 복원력(낮게)
   swirl?: number; // 원주 회전
   noise?: number; // 난류 세기
   drag?: number; // 감쇠(1에 가까울수록 관성 큼)
};

export default function InstancedSpheres({
   center,
   radius,
   halfHeight,
   targetCount,
   maxCap = 200,
   sphereRadius = 1,
   color = '#3b82f6',
   stiffness = 0.06,
   swirl = 0.45,
   noise = 1.1,
   drag = 0.995,
}: Props) {
   const meshRef = useRef<InstancedMesh>(null!);
   const cap = Math.min(maxCap, Math.max(0, targetCount));

   const seeds = useMemo(() => {
      const arr = Array.from({ length: maxCap }, () => {
         const p = new Vector3((Math.random() * 2 - 1) * radius * 0.85, (Math.random() * 2 - 1) * halfHeight * 0.85, (Math.random() * 2 - 1) * radius * 0.85);
         return {
            pos: p,
            vel: new Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5),
            phase: Math.random() * Math.PI * 2,
            sign: Math.random() < 0.5 ? -1 : 1,
            speed: 0.6 + Math.random() * 0.7,
         };
      });
      return arr;
   }, [maxCap, radius, halfHeight]);

   const m = useMemo(() => new Matrix4(), []);
   const ctr = useMemo(() => new Vector3(center[0], center[1], center[2]), [center]);

   useFrame((_, dt) => {
      const R = radius,
         H = halfHeight;
      for (let i = 0; i < cap; i++) {
         const s = seeds[i];
         const p = s.pos,
            v = s.vel;

         // curl-ish 난류장
         const curl = new Vector3(-Math.sin((p.z + s.phase) * 0.35), Math.sin((p.x - p.z + s.phase) * 0.25), Math.cos((p.x + s.phase) * 0.35)).multiplyScalar(
            noise * 0.9,
         );

         // Y축 소용돌이(원주 방향)
         const tangential = new Vector3(-p.z, 0, p.x).normalize().multiplyScalar(swirl * s.sign);

         // 목표 쉘 유지(너무 세지 않게)
         const radialErr = p.length() - R * 0.7;
         const shell = p
            .clone()
            .normalize()
            .multiplyScalar(-radialErr * stiffness);

         // 합력/적분
         v.add(curl.multiplyScalar(0.6));
         v.add(tangential);
         v.add(shell);
         v.multiplyScalar(drag);

         p.addScaledVector(v, dt * s.speed);

         // 경계 처리
         const r = Math.hypot(p.x, p.z);
         if (r > R) {
            p.multiplyScalar((R * 0.98) / r);
            v.reflect(new Vector3(p.x, 0, p.z).normalize()).multiplyScalar(0.6);
         }
         if (p.y > H) {
            p.y = H;
            v.y *= -0.5;
         }
         if (p.y < -H) {
            p.y = -H;
            v.y *= -0.5;
         }

         m.setPosition(ctr.x + p.x, ctr.y + p.y, ctr.z + p.z);
         meshRef.current.setMatrixAt(i, m);
      }
      meshRef.current.count = cap;
      meshRef.current.instanceMatrix.needsUpdate = true;
   });

   return (
      <instancedMesh ref={meshRef} args={[undefined, undefined, maxCap]} frustumCulled={false} castShadow>
         <sphereGeometry args={[sphereRadius, 12, 12]} />
         <meshStandardMaterial color={new Color(color)} emissive={new Color(color)} emissiveIntensity={0.5} metalness={0.3} roughness={0.45} />
      </instancedMesh>
   );
}
