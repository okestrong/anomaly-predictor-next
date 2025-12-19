'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { Edges, Environment, Float, Html, Line, OrbitControls, Stars, Text, Trail, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { CephTopologyData, NetworkTraffic } from './cephTypes';
import styles from './CephDashboard.module.css';
import Colors from '@/utils/color';
import gsap from 'gsap';
import { useCephTopology } from '@/hooks/useCephTopology';
import { Bloom, BrightnessContrast, EffectComposer } from '@react-three/postprocessing';
import { Hdd } from '@/components/models/Hdd';
import { FullRack } from '@/components/models/FullRack';
import { Ceph } from '@/components/models/Ceph';
import { SpaceShipTwo } from '@/components/models/SpaceShipTwo';
import { BluePortal } from '@/components/models/BluePortal';

// Utility functions
const formatBytes = (bytes: number): string => {
   const units = ['B', 'KB', 'MB', 'GB', 'TB'];
   let unitIndex = 0;
   let value = bytes;
   while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
   }
   return `${value.toFixed(2)} ${units[unitIndex]}`;
};

const getStatusColor = (status: string): string => {
   switch (status) {
      case 'HEALTH_OK':
      case 'up':
         return Colors.blue[500];
      case 'HEALTH_WARN':
         return Colors.amber[500];
      case 'HEALTH_ERR':
      case 'down':
         return Colors.red[500];
      case 'inactive':
         return '#222222'; // 비활성 OSD는 매우 어두운 회색
      default:
         return '#666666';
   }
};

const getTrafficColor = (trafficType: string): string => {
   switch (trafficType) {
      case 'recovery':
         return Colors.amber[500];
      case 'client':
         return Colors.green[500];
      default:
         return Colors.blue[500];
   }
};

// OSD Slot type for host-osd mapping
type OSDSlot = {
   hostIndex: number;
   slotIndex: number;
   osdId: number | null; // null means placeholder/inactive OSD
   position: THREE.Vector3;
};

// Node positions calculator - now uses actual topology data with minimum 12 OSDs per host
const calculateNodePositions = (data: CephTopologyData) => {
   const MIN_OSDS_PER_HOST = 12;

   const positions = {
      cluster: new THREE.Vector3(0, -1, 0),
      hosts: [] as THREE.Vector3[],
      osds: new Map<number, THREE.Vector3>(), // Map osdId to position (for backward compatibility)
      osdSlots: [] as OSDSlot[], // All OSD slots including placeholders
      daemons: [] as THREE.Vector3[],
   };

   const hostCount = data.hosts.length;
   const daemonCount = data.daemons.length;

   // Hosts in circular formation (y=6)
   for (let i = 0; i < hostCount; i++) {
      const angle = (i / hostCount) * Math.PI * 2 - Math.PI / 2;
      positions.hosts.push(new THREE.Vector3(Math.cos(angle) * 7, 6, Math.sin(angle) * 7));
   }

   // OSDs around each host - minimum 12 slots per host
   data.hosts.forEach((host, hostIndex) => {
      const hostPos = positions.hosts[hostIndex];
      const actualOsdCount = host.osdIds.length;
      const totalSlots = Math.max(MIN_OSDS_PER_HOST, actualOsdCount);

      for (let slotIndex = 0; slotIndex < totalSlots; slotIndex++) {
         // Calculate position for this slot
         const angle = (slotIndex / totalSlots) * Math.PI * 2;
         const osdPos = new THREE.Vector3(hostPos.x + Math.cos(angle) * 2, 3, hostPos.z + Math.sin(angle) * 2);

         // Check if this slot has an actual OSD
         const osdId = slotIndex < actualOsdCount ? host.osdIds[slotIndex] : null;

         // Add to osdSlots array
         positions.osdSlots.push({
            hostIndex,
            slotIndex,
            osdId,
            position: osdPos,
         });

         // If actual OSD, also add to osds map for backward compatibility
         if (osdId !== null) {
            positions.osds.set(osdId, osdPos);
         }
      }
   });

   // Daemons in outer ring (y=5)
   for (let i = 0; i < daemonCount; i++) {
      const angle = (i / daemonCount) * Math.PI * 2;
      positions.daemons.push(new THREE.Vector3(Math.cos(angle) * 10, 6.5, Math.sin(angle) * 10));
   }

   return positions;
};

// Camera Controller for Ctrl/Cmd + Scroll Zoom
const CameraController: React.FC = () => {
   const { camera } = useThree();

   useEffect(() => {
      const handleWheel = (event: WheelEvent) => {
         if (event.shiftKey || event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const delta = event.deltaY < 0 ? 0.95 : 1.05;
            const distance = camera.position.length();
            const newDistance = distance * delta;

            if (newDistance >= 5 && newDistance <= 50) {
               camera.position.multiplyScalar(delta);
               camera.updateProjectionMatrix();
            }
         }
      };

      document.addEventListener('wheel', handleWheel, { passive: false });
      return () => document.removeEventListener('wheel', handleWheel);
   }, [camera]);

   return null;
};

// 수직전선
// Cluster to Cloud Cable - Main power line
function ClusterToCloudCable({ clusterPos, cloudPos, speed }: { clusterPos: THREE.Vector3; cloudPos: THREE.Vector3; speed: number }) {
   const particleRefs = useRef<(THREE.Mesh | null)[]>([null, null, null, null]);
   const progress = useRef(0);

   // Straight line from cluster to cloud
   const linePoints = useMemo(() => {
      return [clusterPos, cloudPos];
   }, [clusterPos, cloudPos]);

   useFrame((_, delta) => {
      progress.current += delta * speed * 0.2;
      if (progress.current > 1) progress.current = 0;

      const offsets = [0, 0.25, 0.5, 0.75];
      particleRefs.current.forEach((particle, idx) => {
         if (!particle) return;

         const t = (progress.current + offsets[idx]) % 1;

         // Linear interpolation from cluster to cloud
         particle.position.set(
            clusterPos.x + (cloudPos.x - clusterPos.x) * t,
            clusterPos.y + (cloudPos.y - clusterPos.y) * t,
            clusterPos.z + (cloudPos.z - clusterPos.z) * t,
         );

         const scale = 0.3 + Math.sin(t * Math.PI * 2) * 0.05;
         particle.scale.setScalar(scale);

         const material = particle.material as THREE.MeshStandardMaterial;
         material.emissiveIntensity = 4 + Math.sin(t * Math.PI * 4) * 1.5;
      });
   });

   return (
      <group>
         {/* Thick main cable */}
         {/*<Line points={linePoints} color="#00ffff" lineWidth={1.5} transparent opacity={0.9} />*/}
         {/*<Line points={linePoints} color="#ffffff" lineWidth={4} transparent opacity={0.25} />*/}

         {/* Flowing electricity particles */}
         {[0, 1, 2].map(i => (
            <Trail key={i} width={1.5} length={8} color="#00ffff" attenuation={t => t / 50}>
               <mesh ref={el => (particleRefs.current[i] = el)}>
                  <sphereGeometry args={[0.25, 16, 16]} />
                  <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={4} />
                  {/*<pointLight color="#00ffff" intensity={15} distance={8} decay={2} />*/}
               </mesh>
            </Trail>
         ))}
      </group>
   );
}

// 전선
// PowerLine Component - Electricity flowing from edge to cluster (올챙이 효과)
function PowerLine({ index, clusterPos, speed }: { index: number; clusterPos: THREE.Vector3; speed: number }) {
   const particleRefs = useRef<(THREE.Mesh | null)[]>([null, null, null]);
   const tailRefs = useRef<(THREE.Mesh | null)[][]>([[], [], []]); // 각 particle의 꼬리들
   const arrowRef = useRef<THREE.Mesh>(null);
   const cubeRef = useRef<THREE.Mesh>(null);
   const bulbRef = useRef<THREE.PointLight>(null);
   const progress = useRef(Math.random()); // Random start offset
   const TAIL_COUNT = 10; // 꼬리 구체 개수 (더 촘촘한 잔상을 위해 증가)

   // Generate random start point at plane edge
   const { startPos, controlPoint, particleStartPos } = useMemo(() => {
      const angle = (index / 8) * Math.PI * 2;
      const edgeRadius = 23;

      const start = new THREE.Vector3(Math.cos(angle) * edgeRadius, -1.5, Math.sin(angle) * edgeRadius);
      const control = new THREE.Vector3((start.x + clusterPos.x) / 2, 3, (start.z + clusterPos.z) / 2);

      // Particle starts at cube top (0.2 below the very top)
      // Cube height is 3.5, so top is at start.y + 1.75
      // 0.2 below top: start.y + 1.75 - 0.2 = start.y + 1.55
      const particleStart = new THREE.Vector3(start.x, start.y + 1.55, start.z);

      return { startPos: start, controlPoint: control, particleStartPos: particleStart };
   }, [index, clusterPos]);

   // Static line geometry for the wire
   const linePoints = useMemo(() => {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 50; i++) {
         const t = i / 50;
         const tInv = 1 - t;
         const point = new THREE.Vector3(
            tInv * tInv * startPos.x + 2 * tInv * t * controlPoint.x + t * t * clusterPos.x,
            tInv * tInv * startPos.y + 2 * tInv * t * controlPoint.y + t * t * clusterPos.y,
            tInv * tInv * startPos.z + 2 * tInv * t * controlPoint.z + t * t * clusterPos.z,
         );
         points.push(point);
      }
      return points;
   }, [startPos, controlPoint, clusterPos]);

   // Arrow position and rotation
   const { arrowPosition, arrowRotation } = useMemo(() => {
      const t = 0.88; // 0 ~ 1 사이값. 클수록 cluster 에 가깝게 배치.
      const tInv = 1 - t;

      const pos = new THREE.Vector3(
         tInv * tInv * startPos.x + 2 * tInv * t * controlPoint.x + t * t * clusterPos.x,
         tInv * tInv * startPos.y + 2 * tInv * t * controlPoint.y + t * t * clusterPos.y,
         tInv * tInv * startPos.z + 2 * tInv * t * controlPoint.z + t * t * clusterPos.z,
      );

      // Calculate direction from arrow position to cluster
      const direction = new THREE.Vector3().subVectors(clusterPos, pos).normalize();

      // Calculate rotation to point cone towards cluster
      const phi = Math.atan2(direction.x, direction.z);
      const theta = Math.acos(direction.y);

      return {
         arrowPosition: pos,
         arrowRotation: new THREE.Euler(theta, phi, 0, 'YXZ'),
      };
   }, [startPos, controlPoint, clusterPos]);

   // 포물선 경로상의 위치를 계산하는 헬퍼 함수
   const calculatePosition = (t: number) => {
      const tInv = 1 - t;
      return new THREE.Vector3(
         tInv * tInv * particleStartPos.x + 2 * tInv * t * controlPoint.x + t * t * clusterPos.x,
         tInv * tInv * particleStartPos.y + 2 * tInv * t * controlPoint.y + t * t * clusterPos.y,
         tInv * tInv * particleStartPos.z + 2 * tInv * t * controlPoint.z + t * t * clusterPos.z,
      );
   };

   useFrame((_, delta) => {
      // Slow down particle speed by 4x (0.6 -> 0.3 -> 0.15)
      progress.current += delta * speed * 0.05;
      if (progress.current > 1) progress.current = 0;

      const offsets = [0, 0.33, 0.66];
      particleRefs.current.forEach((particle, idx) => {
         if (!particle) return;

         const t = (progress.current + offsets[idx]) % 1;

         // 메인 파티클 위치 업데이트
         const mainPos = calculatePosition(t);
         particle.position.copy(mainPos);

         const scale = 0.35 + Math.sin(t * Math.PI * 2) * 0.05; // 머리 크기
         particle.scale.setScalar(scale);

         const material = particle.material as THREE.MeshStandardMaterial;
         material.emissiveIntensity = 3 + Math.sin(t * Math.PI * 4);

         // 꼬리 구체들 업데이트
         const tailMeshes = tailRefs.current[idx];
         for (let i = 0; i < TAIL_COUNT; i++) {
            if (!tailMeshes[i]) continue;

            // 각 꼬리는 메인보다 점점 뒤쳐진 위치에 (간격을 더 촘촘하게)
            const tailOffset = (i + 1) * 0.004; // 간격을 0.015 → 0.008로 줄여서 더 촘촘하게
            const tailT = Math.max(0, t - tailOffset);
            const tailPos = calculatePosition(tailT);

            tailMeshes[i]?.position.copy(tailPos);

            // 뒤로 갈수록 작아지는 크기 (더 부드럽게 감소)
            const tailScale = scale * Math.pow(0.85, i + 1); // 지수적 감소로 더 자연스럽게
            tailMeshes[i]?.scale.setScalar(tailScale);

            // 뒤로 갈수록 투명해지는 효과
            const tailMaterial = tailMeshes[i]?.material as THREE.MeshStandardMaterial;
            tailMaterial.opacity = 0.95 - (i / TAIL_COUNT) * 0.7; // 시작 투명도를 높여서 더 잘 보이게
            tailMaterial.emissiveIntensity = (3.5 - i * 0.3) * (1 + Math.sin(t * Math.PI * 4) * 0.2);
         }
      });

      // Pulsing arrow
      /*if (arrowRef.current) {
         const pulseFactor = 0.8 + Math.sin(delta * 10) * 0.2;
         arrowRef.current.scale.setScalar(pulseFactor);
      }*/
   });

   return (
      <group>
         {/* Thick static wire with strong glow */}
         {/*<Line points={linePoints} color="#00e5ff" lineWidth={1} transparent opacity={0.7} />*/}
         {/*<Line points={linePoints} color="#00ffff" lineWidth={3} transparent opacity={0.25} />*/}

         {/* Moving electricity particles - 올챙이 효과 */}
         {[0, 1, 2, 3].map(particleIdx => (
            <group key={`power-${index}-${particleIdx}`}>
               {/* 메인 파티클 (머리) */}
               <mesh ref={el => (particleRefs.current[particleIdx] = el)} castShadow>
                  <sphereGeometry args={[0.2, 12, 12]} />
                  <meshStandardMaterial color={Colors.cyan[600]} emissive={Colors.cyan[600]} emissiveIntensity={3} transparent opacity={0.95} />
                  {particleIdx === 1 && <pointLight color={Colors.cyan[400]} intensity={0.5} distance={6} decay={2} />}
               </mesh>

               {/* 꼬리 구체들 */}
               {Array.from({ length: TAIL_COUNT }, (_, tailIdx) => (
                  <mesh
                     key={`tail-${tailIdx}`}
                     ref={el => {
                        if (!tailRefs.current[particleIdx]) tailRefs.current[particleIdx] = [];
                        tailRefs.current[particleIdx][tailIdx] = el;
                     }}
                  >
                     <sphereGeometry args={[0.28, 6, 6]} />
                     <meshStandardMaterial color={Colors.cyan[700]} emissive={Colors.cyan[700]} emissiveIntensity={2.5} transparent opacity={0.8} />
                  </mesh>
               ))}
            </group>
         ))}

         {/* Direction arrow pointing to cluster */}
         {/*<mesh ref={arrowRef} position={arrowPosition} rotation={arrowRotation}>
            <coneGeometry args={[0.4, 0.8, 8]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.05} transparent={false} opacity={0.9} />
            <pointLight color="#00ffff" intensity={8} distance={4} />
         </mesh>*/}

         {/* Start point: Transparent aqua cube with constant bulb inside */}
         <mesh ref={cubeRef} position={startPos}>
            <boxGeometry args={[0.8, 3.5, 0.8]} />
            <meshPhysicalMaterial
               color={Colors.cyan[300]}
               emissive={Colors.cyan[300]}
               emissiveIntensity={0.5}
               transparent
               opacity={0.3}
               transmission={0.9}
               thickness={0.5}
               roughness={0.1}
               metalness={0.1}
            />
            {/* Cube edges outline */}
            <Edges color="#00ffff" linewidth={1} />
            {/* Constant bulb inside cube */}
            <pointLight ref={bulbRef} color="#00ffff" intensity={3} distance={4} decay={2} position={[0, 2.5, 0]} />
            <Hdd position={[0, 1.9, 0]} sacle={1} />
         </mesh>
      </group>
   );
}

// Bumpy Ground Component with marble-like reflective surface
function BumpyGround({ isDark }: { isDark: boolean }) {
   const groundTexture = useTexture('/3d/textures/planet/lobby-ground.jpg');

   // Configure texture to repeat instead of stretch
   groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
   groundTexture.repeat.set(9, 9); // Repeat 9x9 times across the plane

   const geometry = useMemo(() => {
      const geo = new THREE.PlaneGeometry(50, 50, 150, 150);
      const positionAttribute = geo.attributes.position;

      // Hash function for pseudo-random values
      const hash = (x: number, y: number): number => {
         const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
         return h - Math.floor(h);
      };

      // 2D noise function with smooth interpolation
      const noise = (x: number, y: number): number => {
         const ix = Math.floor(x);
         const iy = Math.floor(y);
         const fx = x - ix;
         const fy = y - iy;

         const a = hash(ix, iy);
         const b = hash(ix + 1, iy);
         const c = hash(ix, iy + 1);
         const d = hash(ix + 1, iy + 1);

         // Smooth interpolation (smoothstep)
         const u = fx * fx * (3 - 2 * fx);
         const v = fy * fy * (3 - 2 * fy);

         return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
      };

      // Fractal Brownian Motion - multiple octaves of noise
      const fbm = (x: number, y: number, octaves: number): number => {
         let value = 0;
         let amplitude = 1;
         let frequency = 1;
         let maxValue = 0;

         for (let i = 0; i < octaves; i++) {
            value += noise(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
         }

         return value / maxValue; // Normalize
      };

      // Apply irregular noise to create bumpy surface
      for (let i = 0; i < positionAttribute.count; i++) {
         const x = positionAttribute.getX(i);
         const y = positionAttribute.getY(i);

         // Multiple octaves of noise for natural-looking terrain
         const height1 = fbm(x * 0.1, y * 0.1, 6) * 1.5; // Large features
         const height2 = fbm(x * 0.3, y * 0.3, 4) * 0.8; // Medium features
         const height3 = fbm(x * 0.8, y * 0.8, 3) * 0.4; // Small details

         // Combine different scales
         const totalHeight = height1 + height2 + height3;

         positionAttribute.setZ(i, totalHeight);
      }

      geo.computeVertexNormals();
      return geo;
   }, []);

   return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, isDark ? -2 : -7, 0]} receiveShadow geometry={geometry}>
         <meshStandardMaterial map={groundTexture} roughness={isDark ? 0.2 : 1} metalness={0.75} />
         {/*<meshStandardMaterial roughness={isDark ? 0.2 : 1} color={isDark ? Colors.neutral[400] : Colors.white} metalness={0.75} />*/}
         {/*<MeshReflectorMaterial
            blur={[300, 100]}
            resolution={2048}
            mixBlur={0.8}
            mixStrength={15}
            roughness={0.6}
            depthScale={1.0}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color={Colors.slate[500]}
            metalness={0.3}
         />*/}
      </mesh>
   );
}

// Traffic Particle Component - Data flowing from cluster to OSDs in straight lines
function TrafficFlow({ intensityRate, flow, positions }: { intensityRate: number; flow: NetworkTraffic; positions: any }) {
   const meshRefs = useRef<(THREE.Mesh | null)[]>([null, null, null]);
   const progress = useRef(0);

   const targetOsdId = flow.targetOSD;

   // Source position: cluster position
   const sourcePos = useMemo(() => {
      const clusterPos = positions.cluster || new THREE.Vector3(0, -1, 0);
      return new THREE.Vector3(clusterPos.x, clusterPos.y + 0.8, clusterPos.z);
   }, [positions.cluster]);

   // Target position: OSD position
   const targetPos = useMemo(() => {
      const pos = positions.osds.get(targetOsdId);
      return pos || new THREE.Vector3(NaN, NaN, NaN);
   }, [positions.osds, targetOsdId]);

   const color = useMemo(() => getTrafficColor(flow.trafficType), [flow.trafficType]);

   // Validate positions to prevent NaN errors
   const isValidPosition = (pos: THREE.Vector3) => {
      return !isNaN(pos.x) && !isNaN(pos.y) && !isNaN(pos.z) && isFinite(pos.x) && isFinite(pos.y) && isFinite(pos.z);
   };

   const hasValidPositions = isValidPosition(sourcePos) && isValidPosition(targetPos);

   useFrame((_, delta) => {
      // Skip animation if positions are invalid
      if (!hasValidPositions) return;

      progress.current += delta * flow.intensity * 0.01 * intensityRate;
      if (progress.current > 1) progress.current = 0;

      const offsets = [0, 0.33, 0.66];
      meshRefs.current.forEach((mesh, index) => {
         if (!mesh) return;

         const t = (progress.current + offsets[index]) % 1;

         // Linear interpolation (straight line)
         const newX = sourcePos.x + (targetPos.x - sourcePos.x) * t;
         const newY = sourcePos.y + (targetPos.y - sourcePos.y) * t;
         const newZ = sourcePos.z + (targetPos.z - sourcePos.z) * t;

         // Additional NaN check before setting position
         if (!isNaN(newX) && !isNaN(newY) && !isNaN(newZ)) {
            mesh.position.set(newX, newY, newZ);

            // Dynamic scale and opacity
            const scale = 0.1 + Math.sin(t * Math.PI) * 0.15;
            mesh.scale.setScalar(scale * (flow.intensity / 5));
            (mesh.material as THREE.MeshPhongMaterial).opacity = 0.3 + Math.sin(t * Math.PI) * 0.7;
         }
      });
   });

   // If positions are invalid, don't render
   if (!hasValidPositions) {
      return null;
   }

   return (
      <group>
         {/* Multiple traffic particles with trails */}
         {[0, 1, 2].map(i => {
            // Calculate initial position (straight line)
            const initialT = (i * 0.33) % 1;
            const initialPos = new THREE.Vector3(
               sourcePos.x + (targetPos.x - sourcePos.x) * initialT,
               sourcePos.y + (targetPos.y - sourcePos.y) * initialT,
               sourcePos.z + (targetPos.z - sourcePos.z) * initialT,
            );

            return (
               <Trail key={i} width={1.5} length={4} color={color} attenuation={t => t * t}>
                  <mesh ref={el => (meshRefs.current[i] = el)} position={initialPos}>
                     <sphereGeometry args={[0.25, 12, 12]} />
                     <meshPhongMaterial color={color} emissive={color} emissiveIntensity={1.2} transparent opacity={0.9} />
                     {/*<pointLight color={Colors.cyan[500]} intensity={1} distance={0} decay={2} />*/}
                  </mesh>
               </Trail>
            );
         })}
      </group>
   );
}

// Rotating elegant rings for Host nodes
function HostRotatingRings({ color, hostIndex }: { color: string; hostIndex: number }) {
   const ring1Ref = useRef<THREE.Mesh>(null);
   const ring2Ref = useRef<THREE.Mesh>(null);
   const ring3Ref = useRef<THREE.Mesh>(null);

   useFrame(state => {
      const elapsedTime = state.clock.elapsedTime;

      // Update shader time uniforms and rotate rings at different speeds
      if (ring1Ref.current) {
         const material = ring1Ref.current.material as THREE.ShaderMaterial;
         if (material.uniforms && material.uniforms.time) {
            material.uniforms.time.value = elapsedTime;
         }
         ring1Ref.current.rotation.z += 0.008;
         ring1Ref.current.rotation.x = Math.PI / 2;
      }

      if (ring2Ref.current) {
         const material = ring2Ref.current.material as THREE.ShaderMaterial;
         if (material.uniforms && material.uniforms.time) {
            material.uniforms.time.value = elapsedTime;
         }
         ring2Ref.current.rotation.y += 0.012;
         ring2Ref.current.rotation.x = Math.PI / 4;
      }

      if (ring3Ref.current) {
         const material = ring3Ref.current.material as THREE.ShaderMaterial;
         if (material.uniforms && material.uniforms.time) {
            material.uniforms.time.value = elapsedTime;
         }
         ring3Ref.current.rotation.z -= 0.006;
         ring3Ref.current.rotation.x = -Math.PI / 4;
      }
   });

   const ringShaderMaterial = useMemo(() => {
      return new THREE.ShaderMaterial({
         uniforms: {
            time: { value: 0 },
            color1: { value: new THREE.Color(color) },
            color2: { value: new THREE.Color(color).multiplyScalar(0.3) },
            opacity: { value: 0.9 },
         },
         vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            void main() {
               vUv = uv;
               vPosition = position;
               gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
         `,
         fragmentShader: `
            uniform float time;
            uniform vec3 color1;
            uniform vec3 color2;
            uniform float opacity;
            varying vec2 vUv;
            varying vec3 vPosition;

            void main() {
               // Smooth gradient along the ring
               float gradient = sin(vUv.x * 3.14159 * 4.0 + time * 2.0) * 0.5 + 0.5;

               // Flowing energy effect
               float flow = sin(vUv.y * 20.0 - time * 3.0) * 0.5 + 0.5;

               // Mix colors with gradient
               vec3 finalColor = mix(color2, color1, gradient);

               // Add brightness variation
               float brightness = 0.8 + flow * 0.4;
               finalColor *= brightness;

               // Fade at edges for elegance
               float edgeFade = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);

               float finalOpacity = opacity * edgeFade * (0.6 + gradient * 0.4);
               gl_FragColor = vec4(finalColor, finalOpacity);
            }
         `,
         transparent: true,
         side: THREE.DoubleSide,
         depthWrite: false,
         blending: THREE.AdditiveBlending,
      });
   }, [color]);

   const ringShaderMaterial2 = useMemo(() => {
      return new THREE.ShaderMaterial({
         uniforms: {
            time: { value: 0 },
            color1: { value: new THREE.Color(color).multiplyScalar(1.2) },
            color2: { value: new THREE.Color(color).multiplyScalar(0.5) },
            opacity: { value: 0.9 },
         },
         vertexShader: `
            varying vec2 vUv;
            void main() {
               vUv = uv;
               gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
         `,
         fragmentShader: `
            uniform float time;
            uniform vec3 color1;
            uniform vec3 color2;
            uniform float opacity;
            varying vec2 vUv;

            void main() {
               float gradient = cos(vUv.x * 3.14159 * 3.0 - time * 1.5) * 0.5 + 0.5;
               float pulse = sin(time * 4.0) * 0.2 + 0.8;

               vec3 finalColor = mix(color2, color1, gradient) * pulse;
               float edgeFade = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);

               gl_FragColor = vec4(finalColor, opacity * edgeFade * gradient);
            }
         `,
         transparent: true,
         side: THREE.DoubleSide,
         depthWrite: false,
         blending: THREE.AdditiveBlending,
      });
   }, [color]);

   const ringShaderMaterial3 = useMemo(() => {
      return new THREE.ShaderMaterial({
         uniforms: {
            time: { value: 0 },
            color1: { value: new THREE.Color(color) },
            color2: { value: new THREE.Color('#ffffff').lerp(new THREE.Color(color), 0.7) },
            opacity: { value: 0.8 },
         },
         vertexShader: `
            varying vec2 vUv;
            void main() {
               vUv = uv;
               gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
         `,
         fragmentShader: `
            uniform float time;
            uniform vec3 color1;
            uniform vec3 color2;
            uniform float opacity;
            varying vec2 vUv;

            void main() {
               // Sparkle effect
               float sparkle = sin(vUv.x * 50.0 + time * 5.0) * 0.3 + 0.7;
               float gradient = sin(vUv.x * 3.14159 * 2.0) * 0.5 + 0.5;

               vec3 finalColor = mix(color1, color2, gradient * sparkle);
               float edgeFade = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);

               gl_FragColor = vec4(finalColor, opacity * edgeFade);
            }
         `,
         transparent: true,
         side: THREE.DoubleSide,
         depthWrite: false,
         blending: THREE.AdditiveBlending,
      });
   }, [color]);

   return (
      <group>
         {/* First ring - horizontal, largest */}
         <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]} scale={0.7}>
            <torusGeometry args={[0.7, 0.03, 16, 64]} />
            <primitive object={ringShaderMaterial} attach="material" />
         </mesh>

         {/* Second ring - diagonal */}
         <mesh ref={ring2Ref} rotation={[Math.PI / 4, 0, 0]} scale={0.6}>
            <torusGeometry args={[0.7, 0.025, 16, 64]} />
            <primitive object={ringShaderMaterial2} attach="material" />
         </mesh>

         {/* Third ring - opposite diagonal */}
         <mesh ref={ring3Ref} rotation={[-Math.PI / 4, 0, 0]} scale={0.5}>
            <torusGeometry args={[0.8, 0.02, 16, 64]} />
            <primitive object={ringShaderMaterial3} attach="material" />
         </mesh>
      </group>
   );
}

// Holographic HUD for Daemon nodes
function DaemonHolographicHUD({ daemonData, color }: { daemonData: any; color: string }) {
   const hudGroupRef = useRef<THREE.Group>(null);
   const shaderMeshes = useRef<THREE.Mesh[]>([]);

   useFrame(state => {
      const elapsedTime = state.clock.elapsedTime;

      // Update shader uniforms
      shaderMeshes.current.forEach(mesh => {
         const material = mesh.material as THREE.ShaderMaterial;
         if (material.uniforms && material.uniforms.time) {
            material.uniforms.time.value = elapsedTime;
         }
      });

      // Rotate HUD ring
      if (hudGroupRef.current && hudGroupRef.current.children[0]) {
         hudGroupRef.current.children[0].rotation.z += 0.01;
      }
   });

   return (
      <group ref={hudGroupRef}>
         {/* Main rotating ring with holographic effect */}
         <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.8, 0]}
            ref={el => {
               if (el && !shaderMeshes.current.includes(el)) {
                  shaderMeshes.current.push(el);
               }
            }}
         >
            <ringGeometry args={[1.2, 1.4, 64]} />
            <shaderMaterial
               uniforms={{
                  time: { value: 0 },
                  color: { value: new THREE.Color(color) },
                  opacity: { value: 0.8 },
               }}
               vertexShader={`
                  varying vec2 vUv;
                  void main() {
                     vUv = uv;
                     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                  }
               `}
               fragmentShader={`
                  uniform float time;
                  uniform vec3 color;
                  uniform float opacity;
                  varying vec2 vUv;

                  void main() {
                     float dist = distance(vUv, vec2(0.5));
                     float ring = smoothstep(0.45, 0.48, dist) - smoothstep(0.52, 0.55, dist);

                     // Holographic scanlines
                     float scanline = sin(vUv.y * 30.0 + time * 4.0) * 0.5 + 0.5;

                     // Energy pulse
                     float pulse = sin(time * 3.0) * 0.3 + 0.7;

                     float alpha = ring * scanline * pulse * opacity;
                     gl_FragColor = vec4(color * (0.8 + scanline * 0.2), alpha);
                  }
               `}
               transparent
               side={THREE.DoubleSide}
               depthWrite={false}
            />
         </mesh>

         {/* Data panels around the pool */}
         {[0, 1, 2].map(i => {
            const angle = (i / 3) * Math.PI * 2;
            const radius = 1.2;
            return (
               <mesh
                  key={i}
                  position={[Math.cos(angle) * radius, 0.6, Math.sin(angle) * radius]}
                  rotation={[0, -angle, 0]}
                  ref={el => {
                     if (el && !shaderMeshes.current.includes(el)) {
                        shaderMeshes.current.push(el);
                     }
                  }}
               >
                  <planeGeometry args={[0.6, 0.2]} />
                  <shaderMaterial
                     uniforms={{
                        time: { value: 0 },
                        progress: { value: 0.5 + Math.random() * 0.5 },
                        color: { value: new THREE.Color(color) },
                     }}
                     vertexShader={`
                        varying vec2 vUv;
                        void main() {
                           vUv = uv;
                           gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                     `}
                     fragmentShader={`
                        uniform float time;
                        uniform float progress;
                        uniform vec3 color;
                        varying vec2 vUv;

                        void main() {
                           // Progress bar
                           float bar = step(vUv.x, progress);

                           // Scanline effect
                           float scanline = sin(vUv.x * 20.0 + time * 8.0) * 0.3 + 0.7;

                           float alpha = bar * scanline * 0.9;
                           gl_FragColor = vec4(color * scanline, alpha);
                        }
                     `}
                     transparent
                     side={THREE.DoubleSide}
                  />
               </mesh>
            );
         })}
      </group>
   );
}

// Interactive Node Component
function InteractiveNode({
   position,
   nodeData,
   type,
   color,
   size = 1,
   onSelect,
   daemonIndex,
   hostIndex,
   isDark,
   centerPosition,
}: {
   position: THREE.Vector3;
   nodeData: any;
   type: 'cluster' | 'host' | 'osd' | 'daemon';
   color: string;
   size?: number;
   onSelect: (data: any) => void;
   daemonIndex?: number;
   hostIndex?: number;
   isDark?: boolean;
   centerPosition?: THREE.Vector3;
}) {
   const meshRef = useRef<THREE.Mesh>(null);
   const groupRef = useRef<THREE.Group>(null);
   const [hovered, setHovered] = useState(false);
   const targetScale = useRef(size);
   const currentScale = useRef(size);

   useFrame((state, delta) => {
      if (!meshRef.current) return;

      // Floating animation for cluster
      /*if (type === 'cluster') {
         meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
         meshRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime) * 0.2;
      }*/

      // OSD rotation - cylinder bows towards center like people bowing in a circle
      /*if (type === 'osd' && centerPosition) {
         const directionXZ = new THREE.Vector3(centerPosition.x - position.x, 0, centerPosition.z - position.z).normalize();
         const angleToCenter = Math.atan2(directionXZ.x, directionXZ.z);
         const yQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angleToCenter);
         const xQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), state.clock.elapsedTime * 0.3);
         meshRef.current.quaternion.copy(yQuaternion).multiply(xQuaternion);
      }*/

      // Daemon orbital rotation and self-rotation
      if (type === 'daemon' && daemonIndex !== undefined && groupRef.current) {
         const angle = (daemonIndex / 7) * Math.PI * 2 + state.clock.elapsedTime * 0.035;
         const radius = 11;
         groupRef.current.position.x = Math.cos(angle) * radius;
         groupRef.current.position.z = Math.sin(angle) * radius;

         // Self rotation
         meshRef.current.rotation.x += delta * 0.3;
         meshRef.current.rotation.y += delta * 0.5;
      }

      // Smooth hover scale effect
      targetScale.current = hovered ? size * 1.2 : size;
      currentScale.current += (targetScale.current - currentScale.current) * delta * 10;
      meshRef.current.scale.setScalar(currentScale.current);
   });

   const handleClick = (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSelect({ type, data: nodeData });
   };

   const geometry = useMemo(() => {
      if (type === 'cluster') {
         return <sphereGeometry args={[0.5, 16, 16]} />;
      }
      if (type === 'osd') {
         return <sphereGeometry args={[0.7, 16, 16]} />;
         // return <cylinderGeometry args={[0.4, 0.7, 1.4, 12]} />;
         // return <torusKnotGeometry args={[0.5, 0.15, 256, 128]} />;
         // return <torusGeometry args={[0.5, 0.2]} />;
      }
      return <boxGeometry args={[0.8, 0.8, 0.8]} />;
   }, [type]);

   const hostGeometry = useMemo(() => {
      const geo = new THREE.SphereGeometry(1, 64, 64);
      const positionAttribute = geo.attributes.position;

      for (let i = 0; i < positionAttribute.count; i++) {
         const vertex = new THREE.Vector3(positionAttribute.getX(i), positionAttribute.getY(i), positionAttribute.getZ(i));

         // Apply noise to make surface rough
         const noise = Math.sin(vertex.x * 3) * Math.cos(vertex.y * 3) * Math.sin(vertex.z * 3);
         vertex.normalize().multiplyScalar(1 + noise * 0.15);

         positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }

      geo.computeVertexNormals();
      return geo;
   }, []);

   // Daemon uses a group for orbital motion
   if (type === 'daemon') {
      return (
         <group ref={groupRef} position={position}>
            {/* Core daemon sphere with fancy materials */}
            <mesh ref={meshRef} onClick={handleClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} castShadow receiveShadow>
               <octahedronGeometry args={[0.6, 2]} />
               <meshPhysicalMaterial
                  color={Colors.purple[400]}
                  emissive={Colors.purple[500]}
                  emissiveIntensity={hovered ? 1.2 : 0.8}
                  metalness={0.9}
                  roughness={0.1}
                  clearcoat={1}
                  clearcoatRoughness={0}
                  transparent
                  opacity={0.85}
                  envMapIntensity={2}
               />
            </mesh>

            {/* Outer wireframe for extra visual appeal */}
            <mesh scale={1.3}>
               <octahedronGeometry args={[0.5, 1]} />
               <meshBasicMaterial color={Colors.violet[400]} wireframe transparent opacity={0.8} />
            </mesh>

            {/* Holographic HUD */}
            <DaemonHolographicHUD daemonData={nodeData} color={Colors.fuchsia[500]} />

            {/* Label */}
            <Text position={[0, -size * 1, 0]} fontSize={0.15} color="white" outlineColor="black" outlineWidth={0.01} anchorX="center" anchorY="top">
               {nodeData.daemonId}
            </Text>

            {/* Hover indicator */}
            {hovered && (
               <mesh scale={size * 2}>
                  <sphereGeometry args={[0.8, 16, 16]} />
                  <meshBasicMaterial color={Colors.yellow[500]} transparent opacity={0.15} wireframe />
               </mesh>
            )}
         </group>
      );
   }

   return (
      // <Float speed={type === 'cluster' ? 2 : 0} rotationIntensity={type === 'cluster' ? 1 : 0} floatIntensity={type === 'cluster' ? 1 : 0}>
      <Float speed={0} rotationIntensity={0} floatIntensity={0}>
         {type === 'cluster' ? (
            <>
               {isDark && (
                  <>
                     <Ceph scale={1.6} position={[0, 1.6, -0.5]} rotation-y={Math.PI} />
                     <spotLight color={Colors.red[200]} position={[0, 4, -0.8]} angle={0.5} penumbra={1} intensity={7} />
                     <Text color={Colors.white} position={[0, 1.92, 0.02]} fontSize={0.25} rotation-x={-Math.PI / 2}>
                        CEPH
                     </Text>

                     <FullRack scale={3.5} position={[0.5, -0.4, 0]} castShadow />
                     <FullRack scale={3.5} position={[0.5, -0.4, -1]} castShadow rotation={[0, Math.PI, 0]} />
                     <FullRack scale={3.5} position={[-0.5, -0.4, 0]} castShadow />
                     <FullRack scale={3.5} position={[-0.5, -0.4, -1]} castShadow rotation={[0, Math.PI, 0]} />
                     <pointLight color={Colors.orange[400]} intensity={2} distance={6} decay={2} position={[0, 1.4, 0.2]} />
                     <pointLight color={Colors.cyan[400]} intensity={2} distance={6} decay={2} position={[0, 0, 0.5]} />
                     <pointLight color={Colors.cyan[400]} intensity={2} distance={6} decay={2} position={[0, 0.1, -1.5]} />
                     <pointLight color={Colors.cyan[400]} intensity={2} distance={6} decay={2} position={[0, 0.5, -1.5]} />
                     <spotLight
                        args={[Colors.blue[300], 20, 8, Math.PI / 2, 1, 0.3]} // -> MATH.PI/4 : 빛의 범위(45도) / 1: 빛 경게의 자연스러움 조절 / 0.5: 빛이 멀어질수론 희미해지는 정도 조절
                        position={[0, 1.5, 3]}
                        castShadow
                     />
                  </>
               )}
               {!isDark && (
                  <>
                     <BluePortal position={[0, 0, 0.5]} scale={6} />
                     <spotLight
                        position={[0, 0.5, 1.5]}
                        target-position={[0, 1, 0.5]}
                        angle={Math.PI / 3}
                        penumbra={0.5}
                        intensity={10}
                        color={Colors.cyan[300]}
                     />
                     {/*<Bubble position={[0, 0, 0]} scale={0.3} color={Colors.slate[50]} useBubble />*/}
                     {/*<TextSphere position={[0, 0, 0]} scale={0.4} text="OKESTRO  OKESTRO" bgColor={Colors.white} textColor={Colors.blue[600]} />*/}
                  </>
               )}
            </>
         ) : type === 'osd' ? (
            <group position={position}>
               <mesh
                  ref={meshRef}
                  position={[0, 0, 0]}
                  onClick={handleClick}
                  onPointerOver={() => setHovered(true)}
                  onPointerOut={() => setHovered(false)}
                  castShadow={nodeData.status !== 'placeholder'}
                  receiveShadow
               >
                  {geometry}
                  {/*<meshMatcapMaterial*/}
                  <meshPhysicalMaterial
                     // map={nodeData.status !== 'placeholder' ? aluminiumTexture : undefined}
                     // map={texture}
                     color={color}
                     emissive={color}
                     emissiveIntensity={
                        nodeData.status === 'placeholder'
                           ? 0.3 // Placeholder: very subtle glow
                           : nodeData.status === 'inactive'
                             ? 0 // Inactive: no glow
                             : isDark
                               ? 0.7
                               : 0.5
                     }
                     metalness={nodeData.status === 'placeholder' ? 0.3 : 0.5}
                     roughness={nodeData.status === 'placeholder' ? 0.3 : 0.2}
                     clearcoat={nodeData.status === 'placeholder' ? 0.5 : 1}
                     clearcoatRoughness={nodeData.status === 'placeholder' ? 0.8 : 0}
                     transparent
                     opacity={
                        nodeData.status === 'placeholder'
                           ? 0.7 // Placeholder: visible but clearly inactive
                           : nodeData.status === 'inactive'
                             ? 0.15 // Inactive: semi-transparent
                             : 0.9 // Active: mostly opaque
                     }
                  />
               </mesh>
               {nodeData.status === 'down' && <HostRotatingRings color={color} hostIndex={0} />}
            </group>
         ) : null}

         {/* Label - hide for placeholder OSDs */}
         {nodeData.status !== 'placeholder' && (
            <Text
               position={[position.x, position.y - size * 0.8, position.z]}
               fontSize={0.1}
               color="white"
               outlineColor="black"
               outlineWidth={0.02}
               anchorX="center"
               anchorY="top"
            >
               {nodeData.name || (type === 'host' ? nodeData.hostname : type === 'osd' ? `osd.${nodeData.osdId}` : nodeData.daemonId)}
            </Text>
         )}

         {/* Hover indicator - hide for placeholder OSDs */}
         {hovered && nodeData.status !== 'placeholder' && (
            <mesh position={position} scale={size * 1.5}>
               <sphereGeometry args={[1.2, 16, 16]} />
               <meshBasicMaterial color={Colors.yellow[400]} transparent opacity={0.2} wireframe />
            </mesh>
         )}
      </Float>
   );
}

// Host Node with Rotating Rings
function HostNode({
   position,
   nodeData,
   color,
   size = 1,
   onSelect,
   hostIndex,
}: {
   position: THREE.Vector3;
   nodeData: any;
   color: string;
   size?: number;
   onSelect: (data: any) => void;
   hostIndex: number;
}) {
   const meshRef = useRef<THREE.Mesh>(null);
   const [hovered, setHovered] = useState(false);
   const targetScale = useRef(size);
   const currentScale = useRef(size);

   const hostGeometry = useMemo(() => {
      const geo = new THREE.SphereGeometry(1, 64, 64);
      const positionAttribute = geo.attributes.position;

      for (let i = 0; i < positionAttribute.count; i++) {
         const vertex = new THREE.Vector3(positionAttribute.getX(i), positionAttribute.getY(i), positionAttribute.getZ(i));
         const noise = Math.sin(vertex.x * 3) * Math.cos(vertex.y * 3) * Math.sin(vertex.z * 3);
         vertex.normalize().multiplyScalar(1 + noise * 0.15);
         positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }

      geo.computeVertexNormals();
      return geo;
   }, []);

   useFrame((_, delta) => {
      if (!meshRef.current) return;

      targetScale.current = hovered ? size * 1.2 : size;
      currentScale.current += (targetScale.current - currentScale.current) * delta * 10;
      meshRef.current.scale.setScalar(currentScale.current);
   });

   const handleClick = (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSelect({ type: 'host', data: nodeData });
   };

   return (
      <group position={position}>
         {/* Host mesh */}
         <mesh
            ref={meshRef}
            geometry={hostGeometry}
            scale={0.08}
            onClick={handleClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
         >
            <meshStandardMaterial color={color} metalness={1.0} roughness={0.0} envMapIntensity={1.5} />
         </mesh>

         {/* Rotating elegant rings */}
         <HostRotatingRings color={Colors.amber[500]} hostIndex={hostIndex} />

         {/* Label */}
         <Text position={[0, -size * 0.8, 0]} fontSize={0.2} color="white" anchorX="center" anchorY="top">
            {nodeData.hostname}
         </Text>

         {/* Hover indicator */}
         {hovered && (
            <mesh scale={size * 1.5}>
               <sphereGeometry args={[0.6, 16, 16]} />
               <meshBasicMaterial color={color} transparent opacity={0.2} wireframe />
            </mesh>
         )}
      </group>
   );
}

// Connection Lines Component
function ConnectionLines({ positions, data }: { positions: any; data: CephTopologyData }) {
   const lines = useMemo(() => {
      const allLines: Array<{ start: THREE.Vector3; end: THREE.Vector3; color: string; opacity?: number }> = [];

      // Cluster to Hosts
      /*for (let i = 0; i < data.hosts.length; i++) {
         allLines.push({
            start: positions.cluster,
            end: positions.hosts[i],
            color: '#44ff88',
         });
      }*/

      // Hosts to their OSDs - using host.osdIds mapping
      data.hosts.forEach((host, hostIndex) => {
         const hostPos = positions.hosts[hostIndex];

         host.osdIds.forEach(osdId => {
            const osdPos = positions.osds.get(osdId);
            if (osdPos) {
               allLines.push({
                  start: hostPos,
                  end: osdPos,
                  color: Colors.blue[500],
               });
            }
         });
      });

      return allLines;
   }, [positions, data]);

   return (
      <>
         {lines.map((line, index) => (
            <Line
               key={index}
               points={[line.start, line.end]}
               color={line.color}
               lineWidth={1}
               transparent
               opacity={'opacity' in line ? ((line.opacity || 0.8) as number) : 0.5}
               dashed
               dashScale={5}
               dashSize={0.1}
               gapSize={0.1}
            />
         ))}
      </>
   );
}

// Info Popup Component
function InfoPopup({ selectedNode, onClose }: { selectedNode: any; onClose: () => void }) {
   if (!selectedNode) return null;

   const renderContent = () => {
      const { type, data } = selectedNode;

      switch (type) {
         case 'cluster':
            return (
               <>
                  <h3>Cluster: {data.name}</h3>
                  <p>
                     Status: <span className={styles[data.status.toLowerCase().replace('_', '-')]}>{data.status}</span>
                  </p>
                  <p>Total Storage: {formatBytes(data.totalBytes)}</p>
                  <p>
                     Used: {formatBytes(data.usedBytes)} ({data.utilizationPercent.toFixed(1)}%)
                  </p>
                  <p>
                     OSDs: {data.upOSDs}/{data.totalOSDs} up
                  </p>
               </>
            );

         case 'host':
            return (
               <>
                  <h3>Host: {data.hostname}</h3>
                  <p>
                     Role: <span className={styles[data.role]}>{data.role}</span>
                  </p>
                  <p>IP: {data.ip}</p>
                  <p>CPU Usage: {data.cpuUsage.toFixed(1)}%</p>
                  <p>Memory Usage: {data.memoryUsage.toFixed(1)}%</p>
                  <p>OSDs: {data.osdCount}</p>
               </>
            );

         case 'osd':
            return (
               <>
                  <h3>OSD #{data.osdId}</h3>
                  <p>Host: {data.hostname}</p>
                  <p>
                     Status: <span className={styles[data.status]}>{data.status}</span>
                  </p>
                  <p>Size: {formatBytes(data.totalBytes)}</p>
                  <p>
                     Used: {formatBytes(data.usedBytes)} ({data.utilizationPercent.toFixed(1)}%)
                  </p>
                  {/*<p>PGs: {data.pgCount}</p>*/}
                  <p>Read IOPS: {data.performanceMetrics.read_iops}</p>
                  <p>Write IOPS: {data.performanceMetrics.write_iops}</p>
               </>
            );

         case 'daemon':
            return (
               <>
                  <h3>Daemon: {data.daemonId}</h3>
                  <p>Type: {data.daemonType}</p>
                  <p>Hostname: {data.hostname}</p>
                  <p>
                     Status: <span className={styles[data.status]}>{data.status}</span>
                  </p>
                  <p>Version: {data.version}</p>
                  <p>Address: {data.addr}</p>
                  <p>CPU Usage: {data.cpuUsage.toFixed(1)}%</p>
                  <p>Memory: {data.memoryUsage.toFixed(0)} MB</p>
               </>
            );

         default:
            return <p>No data available</p>;
      }
   };

   return (
      <Html center>
         <div className={styles.infoPopup}>
            <button className={styles.closeBtn} onClick={onClose}>
               ×
            </button>
            {renderContent()}
         </div>
      </Html>
   );
}

// Safe EffectComposer wrapper with WebGL context check
function SafeEffectComposer({ isDark }: { isDark: boolean }) {
   const { gl } = useThree();

   // Only render EffectComposer if WebGL context is available and valid
   if (!gl || !gl.getContext || !gl.domElement) {
      console.warn('WebGL context not available for EffectComposer');
      return null;
   }

   try {
      return (
         <EffectComposer multisampling={0} resolutionScale={1}>
            {/*<Bloom mipmapBlur luminanceThreshold={0.1} intensity={isDark ? 0.8 : 0.7} radius={0.7} />*/}
            <BrightnessContrast brightness={isDark ? -0.15 : 0} contrast={0.25} />
         </EffectComposer>
      );
   } catch (error) {
      console.error('EffectComposer error:', error);
      return null;
   }
}

// Main 3D Scene Component
function CephTopology3D({
   intensity,
   data,
   onNodeSelect,
   isDark,
}: {
   intensity: number;
   data: CephTopologyData;
   onNodeSelect: (node: any) => void;
   isDark: boolean;
}) {
   const { camera } = useThree();
   const positions = useMemo(() => calculateNodePositions(data), [data.hosts.length, data.osds.length, data.daemons.length]);
   const cameraMoved = useRef(false);
   const loaded = useRef(false);
   // const osdTexture = useTexture('/images/gold-wave.jpg');

   useEffect(() => {
      if (loaded.current && !isDark) {
         setTimeout(() => {
            gsap.to(camera.position, {
               x: 20,
               y: 0,
               z: 15,
               duration: 2.5,
               ease: 'power2.inOut',
               onUpdate: () => {
                  camera.updateProjectionMatrix();
               },
            });
         }, 100);
      }
   }, [isDark, camera]);

   useEffect(() => {
      if (data && !cameraMoved.current) {
         cameraMoved.current = true;
         setTimeout(() => {
            gsap.to(camera.position, {
               x: 10,
               y: 15,
               z: 16,
               duration: 4,
               ease: 'power2.inOut',
               onUpdate: () => {
                  camera.updateProjectionMatrix();
               },
            });
         }, 100);
         setTimeout(() => (loaded.current = true), 4000);
      }
   }, [camera, data]);

   return (
      <>
         <SafeEffectComposer isDark={isDark} />
         <group>
            {/* Connection Lines */}
            {/*<ConnectionLines positions={positions} data={data} />*/}

            {/* Cluster Node */}
            <InteractiveNode
               isDark={isDark}
               position={positions.cluster}
               nodeData={data.cluster}
               type="cluster"
               color={getStatusColor(data.cluster.status)}
               size={1.5}
               onSelect={onNodeSelect}
            />

            {/* Host Nodes */}
            {/*{data.hosts.map((host, i) => (
               <HostNode
                  key={host.hostname}
                  position={positions.hosts[i]}
                  nodeData={host}
                  // color={host.role === 'control' ? '#4488ff' : host.role === 'compute' ? '#44ff88' : '#ff8844'}
                  color={Colors.blue[500]}
                  size={0.4}
                  onSelect={onNodeSelect}
                  hostIndex={i}
               />
            ))}*/}

            {/* OSD Nodes - includes actual OSDs and placeholder OSDs */}
            {positions.osdSlots.map((slot, index) => {
               // Find actual OSD data if this slot has an OSD
               const osdData = slot.osdId !== null ? data.osds.find(osd => osd.osdId === slot.osdId) : null;

               // Calculate center position (host position at OSD's y-level)
               const hostPos = positions.hosts[slot.hostIndex];
               const centerPos = new THREE.Vector3(hostPos.x, slot.position.y, hostPos.z);

               if (osdData) {
                  if (osdData.status !== 'up') {
                     console.log('##### osdData=', osdData);
                  }

                  // Render actual OSD
                  return (
                     <InteractiveNode
                        // texture={osdTexture}
                        isDark={isDark}
                        key={`osd-${slot.osdId}`}
                        position={slot.position}
                        nodeData={osdData}
                        type="osd"
                        color={getStatusColor(osdData.status)}
                        size={osdData.status === 'inactive' ? 0.3 : 0.4 + ((osdData.utilizationPercent ?? 0) / 100) * 0.3}
                        onSelect={onNodeSelect}
                        centerPosition={centerPos}
                     />
                  );
               } else {
                  // Render placeholder OSD (inactive slot)
                  const placeholderData = {
                     osdId: -1,
                     hostname: '',
                     status: 'placeholder',
                     totalBytes: 0,
                     usedBytes: 0,
                     utilizationPercent: 0,
                     pgCount: 0,
                     performanceMetrics: {},
                  };

                  return (
                     <InteractiveNode
                        isDark={isDark}
                        key={`placeholder-${slot.hostIndex}-${slot.slotIndex}`}
                        position={slot.position}
                        nodeData={placeholderData}
                        type="osd"
                        color="#444444" // Dark gray but visible
                        size={0.4} // Visible size
                        onSelect={() => {}} // No action on placeholder click
                        centerPosition={centerPos}
                     />
                  );
               }
            })}

            {/* Daemon Nodes */}
            {data.daemons.map((daemon, i) => (
               <InteractiveNode
                  isDark={isDark}
                  key={daemon.daemonId}
                  position={positions.daemons[i]}
                  nodeData={daemon}
                  type="daemon"
                  color={Colors.yellow[600]}
                  // color={daemon.daemonType === 'mon' ? '#4488ff' : daemon.daemonType === 'mgr' ? '#44ff88' : '#ff8844'}
                  size={0.5}
                  onSelect={onNodeSelect}
                  daemonIndex={i}
               />
            ))}

            {/* Cluster to Cloud Cable - Main power connection */}
            {/*<ClusterToCloudCable
               clusterPos={new THREE.Vector3(positions.cluster.x, positions.cluster.y + 1.8, positions.cluster.z)}
               cloudPos={new THREE.Vector3(0, 8, 0)}
               speed={intensity}
            />*/}

            {/* Traffic Flows */}
            {data.traffic
               .filter(flow => {
                  // Always check target OSD exists
                  if (!positions.osds.has(flow.targetOSD)) return false;
                  // If source is not cloud (-1), check source OSD exists too
                  if (flow.sourceOSD !== -1 && !positions.osds.has(flow.sourceOSD)) return false;
                  return true;
               })
               .map(flow => (
                  <TrafficFlow key={flow.flowId} flow={flow} positions={positions} intensityRate={intensity} />
               ))}

            {/* PowerLines - External data flowing into cluster */}
            {Array.from({ length: 8 }).map((_, i) => (
               <PowerLine
                  key={`powerline-${i}`}
                  index={i}
                  clusterPos={new THREE.Vector3(positions.cluster.x, positions.cluster.y + 0.2, positions.cluster.z)}
                  speed={intensity / 2}
               />
            ))}
         </group>
      </>
   );
}

const LoadingText = () => {
   const loadingRef = useRef<any>(null);

   useFrame(({ clock }) => {
      if (loadingRef.current) {
         const time = clock.getElapsedTime();
         const pulseScale = 1 + Math.sin(time * 3) * 0.08; // 3Hz frequency, 8% amplitude
         loadingRef.current.scale.setScalar(pulseScale);
         loadingRef.current.rotation.y -= 0.01;
      }
   });

   return (
      <>
         <Text
            ref={loadingRef}
            position={[0, 0, 0]}
            rotateY={Math.PI / 2}
            outlineColor={Colors.blue[800]}
            outlineWidth={0.01}
            fontSize={0.5}
            fontWeight={700}
            color={Colors.blue[500]}
            anchorX="center"
            anchorY="top"
         >
            🌞Loading Dataverse ..
         </Text>
         {/*<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <MeshReflectorMaterial
               blur={[300, 100]}
               resolution={2048}
               mixBlur={1}
               mixStrength={40}
               roughness={1}
               depthScale={1.2}
               minDepthThreshold={0.4}
               maxDepthThreshold={1.4}
               color="#101010"
               metalness={0.1}
            />
         </mesh>*/}
      </>
   );
};

// WebGL support check
function isWebGLAvailable(): boolean {
   try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
   } catch (e) {
      return false;
   }
}

// Main Dashboard Component
const CephDashboard = React.memo(
   function CephDashboard({ cardVisible }: { cardVisible: boolean }) {
      const { topologyData, connected, loading, error, trafficIntensity, updateTrafficIntensity } = useCephTopology();
      const [selectedNode, setSelectedNode] = useState<any>(null);
      const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

      // Check WebGL support on mount
      useEffect(() => {
         setWebglSupported(isWebGLAvailable());
      }, []);

      // Show loading while checking WebGL support
      if (webglSupported === null) {
         return (
            <div className={styles.dashboard}>
               <div className={styles.mainContent}>
                  <div className={styles.centerCanvas} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <p style={{ color: '#00ffff', fontSize: '1.5rem' }}>Initializing...</p>
                  </div>
               </div>
            </div>
         );
      }

      // Show error if WebGL is not supported
      if (!webglSupported) {
         return (
            <div className={styles.dashboard}>
               <div className={styles.mainContent}>
                  <div
                     className={styles.centerCanvas}
                     style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}
                  >
                     <h2 style={{ color: '#ff0000', fontSize: '1.5rem' }}>WebGL Not Supported</h2>
                     <p style={{ color: '#888' }}>Your browser does not support WebGL.</p>
                     <p style={{ color: '#666', fontSize: '0.875rem' }}>Please use a modern browser with WebGL enabled.</p>
                  </div>
               </div>
            </div>
         );
      }

      return (
         <div className={styles.dashboard}>
            {/* Header */}
            {/*<AppHeader />*/}

            {/* Main Content */}
            <div className={styles.mainContent}>
               {/* 3D Canvas */}
               <div className={styles.centerCanvas}>
                  <Canvas
                     shadows
                     camera={{ position: [15, 0, 20], fov: 70 }}
                     gl={{
                        antialias: true,
                        toneMapping: THREE.ACESFilmicToneMapping,
                        toneMappingExposure: 1.0,
                     }}
                     onCreated={({ gl }) => {
                        // Validate WebGL context on creation
                        if (!gl || !gl.getContext) {
                           console.error('WebGL context creation failed');
                           throw new Error('WebGL context is invalid');
                        }
                     }}
                  >
                     <Suspense fallback={<LoadingText />}>
                        {/* Environment and Lighting */}
                        <Environment files="/3d/background/hongkong.jpg" />
                        {cardVisible && <ambientLight intensity={1} />}
                        <directionalLight
                           position={[10, 20, 10]}
                           intensity={0.3}
                           castShadow
                           shadow-mapSize={[512, 512]}
                           shadow-camera-far={50}
                           shadow-camera-left={-20}
                           shadow-camera-right={20}
                           shadow-camera-top={20}
                           shadow-camera-bottom={-20}
                        />
                        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#ff00ff" />
                        <pointLight position={[10, 10, 10]} intensity={0.5} color="#00ffff" />

                        {/* Stars Background */}
                        <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
                        {/*<CyberDog position={[-2, -0.4, 1]} scale={2} castShadow />*/}
                        {!cardVisible && (
                           <>
                              <SpaceShipTwo position={[0, -3.5, 0]} scale={10} castShadow />
                              {/*<spotLight // 위에서 비추는 메인 조명
                                 position={[-15.5, 4, 1]}
                                 target-position={[15, 2, 1]}
                                 angle={Math.PI / 2}
                                 penumbra={0.5}
                                 intensity={10}
                                 color="#ffffff"
                              />*/}
                              {/*<spotLight // 아래에서 비추는 보조 조명 (림 라이트 효과)
                                 position={[0, -6, 0]}
                                 target-position={[0, -3.5, 0]} // 모델을 향해
                                 angle={Math.PI / 2} // 조명 범위 (90도)
                                 penumbra={0.8}
                                 intensity={20}
                                 color={Colors.white} // 살짝 푸른색으로 차별화
                              />*/}
                           </>
                        )}

                        {/*<spotLight
                           args={[Colors.blue[400], 20, 8, Math.PI / 2, 1, 0.3]} // -> MATH.PI/4 : 빛의 범위(45도) / 1: 빛 경게의 자연스러움 조절 / 0.5: 빛이 멀어질수론 희미해지는 정도 조절
                           position={[-2, 0, 4]}
                        />*/}
                        {/* Ground with reflection - bumpy marble-like surface */}
                        <BumpyGround isDark={cardVisible} />

                        {/* Contact Shadows */}
                        {/*<ContactShadows position={[0, -2, 0]} opacity={0.4} scale={30} blur={2} far={10} />*/}

                        {/* Controls */}
                        <OrbitControls
                           enablePan
                           enableZoom={false}
                           target={[0, 3, 0]}
                           maxPolarAngle={Math.PI}
                           minDistance={5}
                           maxDistance={50}
                           autoRotate
                           autoRotateSpeed={0.1}
                           mouseButtons={{
                              LEFT: THREE.MOUSE.ROTATE,
                              MIDDLE: THREE.MOUSE.PAN,
                              RIGHT: THREE.MOUSE.DOLLY,
                           }}
                        />

                        {/* Camera Controller for Ctrl/Cmd + Scroll Zoom */}
                        <CameraController />

                        {/* Main 3D Scene */}
                        {topologyData && (
                           <CephTopology3D data={topologyData} onNodeSelect={setSelectedNode} intensity={trafficIntensity} isDark={cardVisible} />
                        )}

                        {/* Info Popup */}
                        {selectedNode && <InfoPopup selectedNode={selectedNode} onClose={() => setSelectedNode(null)} />}
                        {/*<Cloud scale={0.5} position={[0, 8, 0]} />*/}
                     </Suspense>
                  </Canvas>

                  {/* Floating Traffic Speed Control */}
                  <div
                     style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '12px 24px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px',
                        border: '1px solid rgba(0, 255, 255, 0.3)',
                        boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)',
                        zIndex: 1000,
                     }}
                  >
                     {/*<label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255, 255, 255, 0.6)' }}>Traffic Speed</label>*/}
                     <input
                        type="range"
                        min="1"
                        max="10"
                        value={trafficIntensity}
                        onChange={e => updateTrafficIntensity(parseInt(e.target.value))}
                        className={styles.slider}
                     />
                     <span style={{ fontSize: '18px', fontWeight: '700', color: '#00ffff', minWidth: '30px', textAlign: 'center' }}>{trafficIntensity}x</span>
                  </div>
               </div>
            </div>
         </div>
      );
   },
   (prevProps, nextProps) => {
      // props가 같으면 true를 반환하여 리렌더링 방지
      // cardVisible이 변경될 때만 리렌더링
      return prevProps.cardVisible === nextProps.cardVisible;
   },
);

export default CephDashboard;
