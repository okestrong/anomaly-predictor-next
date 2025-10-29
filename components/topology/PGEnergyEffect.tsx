/**
 * PG Energy Charging Effect
 *
 * Displays a futuristic energy charging animation on a PG node while loading OSD data.
 * Features:
 * - 3-4 rotating energy rings around the PG
 * - Pulsing cyan/purple glow in the center
 * - Converging particles flowing into the PG
 */

'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PGEnergyEffectProps {
   position: THREE.Vector3;
   radius?: number;
}

export function PGEnergyEffect({ position, radius = 3 }: PGEnergyEffectProps) {
   const groupRef = useRef<THREE.Group>(null);
   const ringRefs = useRef<THREE.Mesh[]>([]);
   const glowRef = useRef<THREE.PointLight>(null);
   const particlesRef = useRef<THREE.Points>(null);

   // Energy ring materials with cyan/purple gradient
   const ringMaterials = useMemo(() => [
      new THREE.MeshBasicMaterial({
         color: 0x00d4ff, // Cyan
         transparent: true,
         opacity: 0.6,
         side: THREE.DoubleSide,
      }),
      new THREE.MeshBasicMaterial({
         color: 0x8b5cf6, // Purple
         transparent: true,
         opacity: 0.5,
         side: THREE.DoubleSide,
      }),
      new THREE.MeshBasicMaterial({
         color: 0x06b6d4, // Light cyan
         transparent: true,
         opacity: 0.4,
         side: THREE.DoubleSide,
      }),
      new THREE.MeshBasicMaterial({
         color: 0xa855f7, // Light purple
         transparent: true,
         opacity: 0.3,
         side: THREE.DoubleSide,
      }),
   ], []);

   // Create converging particles
   const particleGeometry = useMemo(() => {
      const particleCount = 100;
      const positions = new Float32Array(particleCount * 3);
      const velocities: THREE.Vector3[] = [];

      for (let i = 0; i < particleCount; i++) {
         // Start particles in a sphere around the PG
         const theta = Math.random() * Math.PI * 2;
         const phi = Math.acos(2 * Math.random() - 1);
         const r = radius * 3 + Math.random() * radius * 2; // 3-5x radius distance

         positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
         positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
         positions[i * 3 + 2] = r * Math.cos(phi);

         // Store velocity towards center
         const velocity = new THREE.Vector3(
            -positions[i * 3],
            -positions[i * 3 + 1],
            -positions[i * 3 + 2],
         ).normalize().multiplyScalar(0.1);
         velocities.push(velocity);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      (geometry as any).velocities = velocities; // Store velocities as custom property

      return geometry;
   }, [radius]);

   const particleMaterial = useMemo(
      () =>
         new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 0.3,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
         }),
      [],
   );

   // Animation loop
   useFrame((state) => {
      if (!groupRef.current) return;

      const elapsed = state.clock.getElapsedTime();

      // Rotate energy rings at different speeds
      ringRefs.current.forEach((ring, index) => {
         if (ring) {
            ring.rotation.x = elapsed * (0.5 + index * 0.2);
            ring.rotation.y = elapsed * (0.3 + index * 0.15);
            ring.rotation.z = elapsed * (0.2 + index * 0.1);

            // Pulsing opacity
            const material = ring.material as THREE.MeshBasicMaterial;
            material.opacity = 0.3 + Math.sin(elapsed * 2 + index) * 0.2;
         }
      });

      // Pulsing glow effect
      if (glowRef.current) {
         glowRef.current.intensity = 2 + Math.sin(elapsed * 3) * 1;
      }

      // Animate converging particles
      if (particlesRef.current) {
         const positions = particlesRef.current.geometry.attributes.position;
         const velocities = (particlesRef.current.geometry as any).velocities as THREE.Vector3[];

         for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);

            const distance = Math.sqrt(x * x + y * y + z * z);

            // Reset particle if it gets too close to center
            if (distance < radius * 0.5) {
               const theta = Math.random() * Math.PI * 2;
               const phi = Math.acos(2 * Math.random() - 1);
               const r = radius * 3 + Math.random() * radius * 2;

               positions.setXYZ(
                  i,
                  r * Math.sin(phi) * Math.cos(theta),
                  r * Math.sin(phi) * Math.sin(theta),
                  r * Math.cos(phi),
               );

               // Recalculate velocity
               velocities[i].set(
                  -positions.getX(i),
                  -positions.getY(i),
                  -positions.getZ(i),
               ).normalize().multiplyScalar(0.1);
            } else {
               // Move particle towards center
               positions.setXYZ(
                  i,
                  x + velocities[i].x,
                  y + velocities[i].y,
                  z + velocities[i].z,
               );
            }
         }

         positions.needsUpdate = true;
      }
   });

   return (
      <group ref={groupRef} position={position}>
         {/* Central pulsing glow */}
         <pointLight
            ref={glowRef}
            color={0x00d4ff}
            intensity={2}
            distance={radius * 5}
            decay={2}
         />

         {/* Energy rings */}
         {ringMaterials.map((material, index) => (
            <mesh
               key={index}
               ref={(el) => {
                  if (el) ringRefs.current[index] = el;
               }}
               rotation={[
                  Math.random() * Math.PI,
                  Math.random() * Math.PI,
                  Math.random() * Math.PI,
               ]}
            >
               <torusGeometry
                  args={[
                     radius + index * 0.5, // Ring radius increases
                     0.1, // Tube thickness
                     16, // Radial segments
                     100, // Tubular segments
                  ]}
               />
               <primitive object={material} />
            </mesh>
         ))}

         {/* Converging particles */}
         <points ref={particlesRef} geometry={particleGeometry} material={particleMaterial} />

         {/* Additional sphere glow for center */}
         <mesh>
            <sphereGeometry args={[radius * 0.3, 16, 16]} />
            <meshBasicMaterial
               color={0x8b5cf6}
               transparent
               opacity={0.3}
               blending={THREE.AdditiveBlending}
            />
         </mesh>
      </group>
   );
}
