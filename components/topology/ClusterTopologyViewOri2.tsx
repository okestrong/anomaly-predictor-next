'use client';

import { createRef, forwardRef, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, Environment, OrbitControls, Plane, Stars, Text as Text3D } from '@react-three/drei';
import { Bloom, BrightnessContrast, EffectComposer } from '@react-three/postprocessing';
import gsap from 'gsap';
import { AdaptiveLayoutManager } from '@/utils/layouts';
import { calculatePgState, loadTexture } from '@/utils/utils';
import { AppHeader } from '@/components/layout';
import Bubble from '@/components/models/Bubble';
import Colors from '@/utils/color';
import { Medical } from '@/components/models/Medical';
import TextSphere from '@/components/models/TextSphere';
import { PortalLight } from '@/components/models/PortalLight';
import { Text } from 'troika-three-text';
import { MetaPlate } from '@/components/models/MetaPlate';
import RoundMirrorTable from '@/components/models/RoundMirrorTable';
import Atmosphere from '@/components/models/Atmosphere';
import RoundMirrorTextTable from '@/components/models/RoundMirrorTextTable';
import { Stone } from '@/components/models/Stone';
import GlassBall from '@/components/models/GlassBall';
import { TrashIcon } from '@heroicons/react/24/solid';
import { selectIsLoading, selectTopologyData, useTopologyStore } from '@/stores/topology';
import { transformTopologyData } from '@/lib/transformTopologyData';
import { PGEnergyEffect } from './PGEnergyEffect';
import { toast } from 'react-toastify';
import { formatBytes } from '@/lib/formatUtils';
import Image from 'next/image';

const transition = {
   duration: 0.4, // 0.8에서 0.4로 단축
   ease: 'easeOut' as const,
   type: 'tween' as const,
};

// GSAP 애니메이션을 위한 초기 위치 설정
const getInitialTransform = (position: string) => {
   switch (position) {
      case 'top':
         return { xPercent: 0, y: -200, opacity: 0 }; // xPercent로 중앙 정렬 유지
      case 'left':
         return { x: -400, y: 0, opacity: 0 }; // 왼쪽에서 오른쪽으로 슬라이드
      case 'bottom':
         return { xPercent: 0, y: 200, opacity: 0 }; // xPercent로 중앙 정렬 유지
      case 'right':
         return { x: 400, y: 0, opacity: 0 }; // 오른쪽에서 왼쪽으로 슬라이드
      default:
         return { x: 0, y: 0, opacity: 0 };
   }
};

// GSAP 애니메이션을 위한 종료 위치 설정
const getExitTransform = (position: string) => {
   return getInitialTransform(position);
};

// R3F Pool Node Component
const PoolNode = forwardRef<
   any,
   {
      poolData: any;
      position?: [number, number, number];
      textures: any;
      onPoolClick: (poolData: any) => void;
      selectedPoolIdRef: RefObject<number | null>;
      searchedPoolIdsRef?: RefObject<Set<number>>;
      animationRefs?: {
         meshRef: RefObject<THREE.Mesh | null>;
         cloudsRef: RefObject<THREE.Mesh | null>;
         healthRingRef: RefObject<THREE.Mesh | null>;
         poolData: any;
      };
   }
>(({ poolData, position = [0, 0, 0], textures, onPoolClick, selectedPoolIdRef, searchedPoolIdsRef, animationRefs }, ref) => {
   const meshRef = useRef<THREE.Mesh>(null);
   const cloudsRef = useRef<THREE.Mesh>(null);
   const groupRef = useRef<THREE.Group>(null);
   const healthRingRef = useRef<THREE.Mesh>(null);

   // Forward ref to parent component
   useEffect(() => {
      if (ref && typeof ref !== 'function') {
         ref.current = groupRef.current;
      }
   }, [ref]);

   // Register refs for centralized animation
   useEffect(() => {
      if (animationRefs) {
         animationRefs.meshRef.current = meshRef.current;
         animationRefs.cloudsRef.current = cloudsRef.current;
         animationRefs.healthRingRef.current = healthRingRef.current;
         animationRefs.poolData = poolData;
      }

      // Cache references in userData for performance optimization
      if (groupRef.current) {
         const group = groupRef.current;
         group.userData.earthSphere = meshRef.current;
         group.userData.clouds = cloudsRef.current;
         group.userData.ring = healthRingRef.current;

         // Pre-calculate random values for rotation speeds
         if (cloudsRef.current && cloudsRef.current.userData.rotationSpeed === undefined) {
            cloudsRef.current.userData.rotationSpeed = 0.2 + Math.random() * 0.3;
         }
         if (healthRingRef.current) {
            if (healthRingRef.current.userData.rx === undefined) {
               healthRingRef.current.userData.rx = 0.1 + Math.random() * 0.9;
            }
            if (healthRingRef.current.userData.ry === undefined) {
               healthRingRef.current.userData.ry = 0.5 + Math.random();
            }
         }
      }
   }, [animationRefs, poolData]);

   const handleClick = (event: any) => {
      event.stopPropagation();
      onPoolClick(poolData);
   };

   // Check selection state for materials (computed once per render)
   const isSelected = selectedPoolIdRef.current === poolData.id;

   // Pulse animation for selected pool
   useFrame(({ clock }) => {
      if (groupRef.current) {
         // Check if this pool is being searched (don't override gsap animation)
         const isBeingSearched = searchedPoolIdsRef?.current?.has(poolData.id) || false;
         if (isBeingSearched) {
            // Don't touch scale if being animated by search
            return;
         }

         // Check selection state every frame for animation
         const isCurrentlySelected = selectedPoolIdRef.current === poolData.id;
         if (isCurrentlySelected) {
            const time = clock.getElapsedTime();
            const pulseScale = 1 + Math.sin(time * 3) * 0.08; // 3Hz frequency, 8% amplitude
            groupRef.current.scale.setScalar(pulseScale);
         } else {
            groupRef.current.scale.setScalar(1);
         }
      }
   });

   const healthRingRotation = useMemo(() => [Math.PI / (Math.random() * (8 - 4) + 4), 0, 0] as [number, number, number], []);

   return (
      <group ref={groupRef} position={position} userData={{ type: 'Pool', id: poolData.id, poolData }}>
         {/* Main sphere */}
         {poolData.health !== 'healthy' ? (
            <MetaPlate animate scale={9.5} onClick={handleClick} />
         ) : (
            <>
               <mesh
                  ref={meshRef}
                  onClick={handleClick}
                  /*onPointerOver={e => {
                  e.stopPropagation();
                  document.body.style.cursor = 'pointer';
               }}
               onPointerOut={e => {
                  e.stopPropagation();
                  document.body.style.cursor = 'auto';
               }}*/
               >
                  <sphereGeometry args={[5, 32, 32]} />
                  {textures?.albedoMap ? (
                     <meshStandardMaterial
                        map={textures.albedoMap}
                        bumpMap={textures.bumpMap}
                        bumpScale={0.03}
                        metalness={0.1}
                        metalnessMap={textures.oceanMap}
                        // emissiveMap={textures.lightsMap}
                        // emissive={new THREE.Color(isSelected ? 0xffff00 : 0xffff88)}
                        // emissiveIntensity={isSelected ? 0.8 : 0.5}
                     />
                  ) : (
                     <meshStandardMaterial
                        color={0x4169e1}
                        emissive={new THREE.Color(isSelected ? 0xffff00 : 0x002244)}
                        emissiveIntensity={isSelected ? 0.6 : 0.3}
                     />
                  )}
               </mesh>
               <mesh ref={cloudsRef}>
                  <sphereGeometry args={[5.1, 32, 32]} />
                  <meshStandardMaterial map={textures?.cloudsMap || undefined} transparent opacity={0.5} depthWrite={false} />
               </mesh>
               <Atmosphere radius={5} intensity={1.1} power={2.0} color={Colors.white} />
            </>
         )}

         {/* Atmosphere effect for healthy pools */}
         {/*{poolData.health === 'healthy' && (
            <mesh>
               <sphereGeometry args={[6.1, 32, 32]} />
               <shaderMaterial
                  vertexShader={`
                     varying vec3 vNormal;
                     varying vec3 eyeVector;
                     void main() {
                        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
                        vNormal = normalize(normalMatrix * normal);
                        eyeVector = normalize(mvPos.xyz);
                        gl_Position = projectionMatrix * mvPos;
                     }
                  `}
                  fragmentShader={`
                     varying vec3 vNormal;
                     varying vec3 eyeVector;
                     uniform float atmOpacity;
                     uniform float atmPowFactor;
                     uniform float atmMultiplier;
                     void main() {
                        float dotP = dot(vNormal, eyeVector);
                        float factor = pow(dotP, atmPowFactor) * atmMultiplier;
                        vec3 atmColor = vec3(0.1 + dotP/8.0, 1.0, 0.2 + dotP/8.0);
                        gl_FragColor = vec4(atmColor, atmOpacity) * factor;
                     }
                  `}
                  uniforms={{
                     atmOpacity: { value: 0.5 },
                     atmPowFactor: { value: 4.1 },
                     atmMultiplier: { value: 9.5 },
                  }}
                  blending={THREE.AdditiveBlending}
                  transparent
                  side={THREE.BackSide}
                  depthWrite={true}
                  depthTest={true}
               />
            </mesh>
         )}*/}

         {/* Health status ring for unhealthy pools */}
         {poolData.health !== 'healthy' && (
            <mesh ref={healthRingRef} rotation={healthRingRotation}>
               <ringGeometry args={[5.5, 6.5, 64, 1, 0, Math.PI * 2]} />
               <meshStandardMaterial color={poolData.health === 'warning' ? 0xffaa00 : 0xdc2626} side={THREE.DoubleSide} depthTest depthWrite />
               {/*<shaderMaterial
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
                     varying vec2 vUv;
                     void main() {
                        vec2 center = vec2(0.5, 0.5);
                        float dist = distance(vUv, center);
                        float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
                        float pattern = sin(angle * 4.0 + time * 2.0) * 0.5 + 0.5;
                        float glow = 1.0 - smoothstep(0.0, 0.02, abs(dist - 0.5));
                        vec3 finalColor = color * (0.6 + pattern * 0.4);
                        float alpha = glow * (0.5 + pattern * 0.5);
                        gl_FragColor = vec4(finalColor, alpha);
                     }
                  `}
                  uniforms={{
                     time: { value: 0 },
                     color: { value: new THREE.Color(poolData.health === 'warning' ? 0xffaa00 : 0xdc2626) },
                  }}
                  transparent
                  opacity={0.9}
                  side={THREE.DoubleSide}
                  depthTest
                  depthWrite
               />*/}
            </mesh>
         )}

         {/* Pool name text - positioned above the sphere */}
         <Text3D position={[0, 10, 0]} fontSize={1.5} color={0xffffff} anchorX="center" anchorY="top" outlineColor={Colors.black} outlineWidth={0.1}>
            {poolData.name}
         </Text3D>
      </group>
   );
});

// Doughnut Table Component - 8-segment circular table with thickness
const DoughnutTable = ({ position = [0, -40, 0] }: { position?: [number, number, number] }) => {
   const innerRadius = 70;
   const outerRadius = 90; // Reduced from 100 to 90 (3/4 of original width)
   return (
      <group position={position} rotation={[0, 0, 0]}>
         <RoundMirrorTextTable
            topCrystal
            sideMirror
            // sideColor={Colors.amber[400]}
            position={[0, 0, 0]}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            rotation={[0, 0, 0]}
            height={7}
            bottomText="OKESTRO  *  CONTRABASS  SDS+"
            bottomTextColor={Colors.neutral[300]}
            segment={512}
         />
         {/*<BangingGlassBall scale={2.5} useOrbit orbitCenterPosition={[0, -100, 0]} orbitRadius={80} y={-50} angularSpeed={-0.3} />*/}
         <RoundMirrorTable
            topCrystal
            sideColor={Colors.neutral[700]}
            position={[0, 3, 0]}
            innerRadius={innerRadius - 15}
            outerRadius={innerRadius - 0.2}
            rotation={[0, 0, 0]}
            height={7}
            segment={256}
         />
         <Text3D
            scale={10}
            position={[0, 2.5, -(innerRadius - 15.1)]} // 탁자 윗면 위로 아주 살짝
            rotation={[0, 0, 0]} // XY 평면 텍스트를 상판에 눕힘
            fontSize={0.5}
            font="/fonts/orbitron/Orbitron-Bold.ttf"
            fontWeight={700}
            color={Colors.white}
            // @ts-ignore
            curveRadius={5.3} // 반지름에 맞춰 조정
            letterSpacing={0.02}
            anchorX="center"
            anchorY="middle"
         >
            {`OKESTRO * CONTRABASS SDS+`}
         </Text3D>
         <Text3D
            scale={10}
            position={[0, 2.5, innerRadius - 15.1]} // 탁자 윗면 위로 아주 살짝
            rotation={[0, Math.PI, 0]} // XY 평면 텍스트를 상판에 눕힘
            fontSize={0.5}
            font="/fonts/orbitron/Orbitron-Bold.ttf"
            fontWeight={700}
            color={Colors.white}
            // @ts-ignore
            curveRadius={5.3} // 반지름에 맞춰 조정
            letterSpacing={0.02}
            anchorX="center"
            anchorY="middle"
         >
            {`OKESTRO * CONTRABASS SDS+`}
         </Text3D>
         {/* Inner edge neon line */}
         <mesh position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[innerRadius, 0.2, 8, 64]} />
            <meshStandardMaterial color={0x06b6d4} emissive={0x06b6d4} emissiveIntensity={1.0} transparent={false} />
         </mesh>
      </group>
   );
};

// Spaceship Host Component - Control panel rectangle
const SpaceshipHost = forwardRef<
   THREE.Group,
   {
      hostData: any;
      segmentIndex: number;
      position: [number, number, number];
      animationRefs?: {
         meshRef: RefObject<THREE.Mesh | null>;
         tubeRefs: RefObject<THREE.Mesh[]>;
      };
      hostPlaneRefs?: RefObject<THREE.Mesh[]>;
      selectedHostIdRef?: RefObject<string | null>;
   }
>(({ hostData, segmentIndex, position, animationRefs, hostPlaneRefs, selectedHostIdRef }, ref) => {
   const meshRef = useRef<THREE.Mesh>(null);
   const tubeRefs = useRef<THREE.Mesh[]>([]);
   const planeRef = useRef<THREE.Mesh>(null);
   const pointLightRef = useRef<THREE.PointLight>(null);

   // Calculate position on segment
   const angle = (segmentIndex / 8) * Math.PI * 2 + Math.PI / 8; // Center of segment
   const radius = 86.5; // Moved slightly outward to avoid invading inner edge (70-90 range)
   const x = Math.cos(angle) * radius;
   const z = Math.sin(angle) * radius;

   // Register refs for centralized animation
   useEffect(() => {
      if (animationRefs) {
         animationRefs.meshRef.current = meshRef.current;
         animationRefs.tubeRefs.current = tubeRefs.current;
      }
   }, [animationRefs]);

   // Register planeRef to parent hostPlaneRefs array
   useEffect(() => {
      if (hostPlaneRefs && hostPlaneRefs.current && planeRef.current) {
         hostPlaneRefs.current[segmentIndex] = planeRef.current;
      }
   }, [hostPlaneRefs, segmentIndex]);

   useFrame(({ clock }, delta) => {
      const time = clock.getElapsedTime();
      const material = (planeRef.current! as any).material as THREE.MeshPhysicalMaterial;
      // 밝기 강도변화 조절 : Math.sin(..) * X 에서, 0 < X < 1 로 조정. 클수록 더 밝게 ~ 더 어둡게 변화함.
      material.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.3;

      // Update point light intensity based on selection
      if (pointLightRef.current) {
         pointLightRef.current.visible = selectedHostIdRef?.current === hostData.name;
      }
   });

   return (
      <>
         <group
            ref={ref}
            position={[x, position[1] + 2.2, z]}
            rotation={[0, -angle + Math.PI / 2, 0]}
            userData={{ type: 'Host', id: hostData.id, name: hostData.name, hostData, segmentIndex }}
         >
            {/* Main control panel */}
            <Box args={[22, 1.5, 36]}>
               {/*<meshPhysicalMaterial color={0x0f172a} metalness={0.3} roughness={0.7} emissive={0x1e293b} emissiveIntensity={0.2} transparent opacity={0.9} />*/}
               <meshPhysicalMaterial metalness={1} roughness={0} clearcoat={1} clearcoatRoughness={0} ior={1.5} envMapIntensity={1.2} />
            </Box>
            {/*<mesh ref={meshRef} castShadow receiveShadow>
               <boxGeometry args={[22, 1.5, 27]} />
               <meshPhysicalMaterial color={0x0f172a} metalness={0.3} roughness={0.7} emissive={0x1e293b} emissiveIntensity={0.2} transparent opacity={0.7} />
            </mesh>*/}
            <pointLight ref={pointLightRef} args={['#ffffff', 10, 50, -0.1]} position={[0, 30, 0]} intensity={10} />
            {/* Control panel frame */}
            {/*<mesh>
            <boxGeometry args={[24, 0.5, 30]} />
            <meshPhysicalMaterial color={0x0891b2} metalness={0.8} roughness={0.2} emissive={0x0891b2} emissiveIntensity={0.3} transparent opacity={0.8} />
         </mesh>*/}

            {/* Host label - moved outward by 20 units */}
            <Text3D
               position={[-7.5, 1.1, 5.5]}
               fontSize={1.4}
               color={Colors.white}
               anchorX="left"
               anchorY="middle"
               outlineWidth="8%"
               outlineColor={Colors.black}
               rotation={[-Math.PI / 2, 0, 0]}
            >
               CPU : {hostData.detail.cpuCount} cpu
            </Text3D>
            <Text3D
               position={[-7.5, 1.1, 7.5]}
               fontSize={1.4}
               color={Colors.white}
               anchorX="left"
               anchorY="middle"
               outlineWidth="8%"
               outlineColor={Colors.black}
               rotation={[-Math.PI / 2, 0, 0]}
            >
               Cores : {hostData.detail.coreCount} core
            </Text3D>
            <Text3D
               position={[-7.5, 1.1, 9.5]}
               fontSize={1.4}
               color={Colors.yellow[400]}
               anchorX="left"
               anchorY="middle"
               outlineWidth="8%"
               outlineColor={0x000000}
               rotation={[-Math.PI / 2, 0, 0]}
            >
               MEM : {formatBytes(hostData.detail.memory)?.replace(/^(.+)[bB]$/, '$1')}
            </Text3D>
            {/*<Text3D
               position={[-5.5, 1.1, 16.5]}
               fontSize={1.4}
               color={Colors.neutral[400]}
               anchorX="center"
               anchorY="middle"
               outlineWidth="8%"
               outlineColor={0x000000}
               rotation={[-Math.PI / 2, 0, 0]}
            >
               CPU: {hostData.detail.cpuCount} ({hostData.detail.coreCount} cores)
            </Text3D>*/}
            <Text3D
               position={[-5.5, 1.1, 16.5]}
               fontSize={1.4}
               color={Colors.neutral[400]}
               anchorX="center"
               anchorY="middle"
               outlineWidth="8%"
               outlineColor={0x000000}
               rotation={[-Math.PI / 2, 0, 0]}
            >
               {hostData.name}
            </Text3D>
            <Text3D
               position={[6, 0.15, 18.1]}
               fontSize={1.3}
               color={Colors.slate[400]}
               anchorX="center"
               anchorY="middle"
               outlineWidth="8%"
               outlineColor={0x000000}
            >
               {hostData.name}
            </Text3D>

            {/* Glowing tube lines on top surface */}
            {/* Horizontal lines */}
            <mesh ref={el => el && (tubeRefs.current[1] = el)} position={[0, 0.8, -8]}>
               <tubeGeometry args={[new THREE.CatmullRomCurve3([new THREE.Vector3(-10.7, 0, 5), new THREE.Vector3(10.7, 0, 5)]), 32, 0.15, 8, false]} />
               <meshPhysicalMaterial color={0x22d3ee} emissive={0x22d3ee} emissiveIntensity={0.5} transparent opacity={0.8} toneMapped={false} />
            </mesh>

            <mesh ref={el => el && (tubeRefs.current[0] = el)} position={[0, 0.8, 8]}>
               <tubeGeometry args={[new THREE.CatmullRomCurve3([new THREE.Vector3(-11, 0, 9.9), new THREE.Vector3(11, 0, 9.9)]), 32, 0.15, 8, false]} />
               <meshPhysicalMaterial color={0x22d3ee} emissive={0x22d3ee} emissiveIntensity={0.5} transparent opacity={0.8} toneMapped={false} />
            </mesh>
            {/*<mesh ref={el => el && (tubeRefs.current[1] = el)} position={[0, 0.8, 0]}>
               <tubeGeometry args={[new THREE.CatmullRomCurve3([new THREE.Vector3(-10.6, 0, 0), new THREE.Vector3(10.6, 0, 0)]), 32, 0.15, 8, false]} />
               <meshPhysicalMaterial color={0x22d3ee} emissive={0x22d3ee} emissiveIntensity={0.5} transparent opacity={0.4} toneMapped={false} />
            </mesh>*/}

            <Plane ref={planeRef} args={[21.5, 14]} position={[0, 0.9, -10]} rotation={[Math.PI / 2, 0, 0]}>
               <meshPhysicalMaterial
                  color={Colors.cyan[400]}
                  emissive={Colors.cyan[400]}
                  emissiveIntensity={0.5}
                  transparent
                  opacity={0.9}
                  toneMapped={false}
                  side={THREE.DoubleSide}
               />
            </Plane>

            {/* Vertical lines */}
            <mesh ref={el => el && (tubeRefs.current[3] = el)} position={[-7, 0.8, 0]}>
               <tubeGeometry args={[new THREE.CatmullRomCurve3([new THREE.Vector3(-3.9, 0, -18), new THREE.Vector3(-3.9, 0, 18)]), 32, 0.15, 8, false]} />
               <meshPhysicalMaterial color={0x22d3ee} emissive={0x22d3ee} emissiveIntensity={0.5} transparent opacity={0.8} toneMapped={false} />
            </mesh>

            <mesh ref={el => el && (tubeRefs.current[4] = el)} position={[7, 0.8, 0]}>
               <tubeGeometry args={[new THREE.CatmullRomCurve3([new THREE.Vector3(3.9, 0, -18), new THREE.Vector3(3.9, 0, 18)]), 32, 0.15, 8, false]} />
               <meshPhysicalMaterial color={0x22d3ee} emissive={0x22d3ee} emissiveIntensity={0.5} transparent opacity={0.8} toneMapped={false} />
            </mesh>
         </group>
      </>
   );
});

// Crystal OSD Component - Transparent glowing cube
const CrystalOSD = ({
   osdData,
   position,
   onCreated,
   animationRefs,
   labelRotation = 0,
}: {
   osdData: any;
   position: [number, number, number];
   onCreated?: (ref: THREE.Group) => void;
   animationRefs?: {
      meshRef: RefObject<THREE.Mesh | null>;
      osdData: any;
   };
   labelRotation?: number;
}) => {
   const meshRef = useRef<THREE.Mesh>(null);
   const groupRef = useRef<THREE.Group>(null);
   const labelRef = useRef<THREE.Mesh>(null);

   // Register refs for centralized animation
   useEffect(() => {
      if (animationRefs) {
         animationRefs.meshRef.current = meshRef.current;
         animationRefs.osdData = osdData;
      }
   }, [animationRefs, osdData]);

   const getColor = () => {
      if (osdData.status !== 'up') return 0xdc2626; // Red for down
      if (osdData.health !== 'healthy') return 0xfbbf24; // Orange for unhealthy
      return 0x4ade80; // Green for healthy
   };

   // Call onCreated when component mounts
   useEffect(() => {
      if (groupRef.current && onCreated) {
         onCreated(groupRef.current);
      }
   }, [onCreated]);

   // Continuous Y-axis rotation for label
   useFrame((state, delta) => {
      if (labelRef.current) {
         labelRef.current.rotation.y += delta * 0.5; // Rotate 0.5 radians per second
      }
   });

   return (
      <group ref={groupRef} position={position} userData={{ type: 'OSD', id: osdData.id, osdData }}>
         {/* Main crystal cube - highly transparent */}
         <mesh ref={meshRef} castShadow>
            <boxGeometry args={[2.5, 2.5, 2.5]} />
            <meshPhysicalMaterial
               color={getColor()}
               metalness={0.0}
               roughness={0.0}
               transmission={0.95}
               thickness={0.3}
               emissive={getColor()}
               emissiveIntensity={0.9}
               transparent
               opacity={osdData.status === 'up' && osdData.health === 'healthy' ? 0.5 : 0.8}
               ior={1.5}
            />
         </mesh>

         {/* Cyber neon wireframe edges */}
         <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(2.5, 2.5, 2.5)]} />
            <lineBasicMaterial color={getColor()} transparent opacity={0.9} linewidth={2} />
         </lineSegments>

         {/* Inner glow core */}
         <mesh>
            <boxGeometry args={[1.5, 1.5, 1.5]} />
            <meshBasicMaterial color={getColor()} transparent opacity={0.6} />
         </mesh>

         {/* Outer energy field */}
         <mesh>
            <boxGeometry args={[3.2, 3.2, 3.2]} />
            <meshBasicMaterial color={getColor()} transparent opacity={0.1} />
         </mesh>

         {/* OSD ID label - Rotate to face outward from circular table */}
         <Text3D
            ref={labelRef}
            position={[0, -3, 0]}
            rotation={[0, -labelRotation, 0]}
            fontSize={0.8}
            color={Colors.white}
            anchorX="center"
            anchorY="middle"
            outlineColor={Colors.black}
            outlineWidth="20%"
         >
            OSD.{osdData.id}
         </Text3D>
      </group>
   );
};

// R3F Scene Component
const ClusterTopologyScene = ({
   selectedObjectRef,
   selectedPoolIdRef,
   searchedPoolIdsRef,
   loadingRef,
   texturesRef,
   cameraRef,
   showPGsForPool,
   clearAllHighlights,
   sceneRef,
   poolRefs,
   hostRefs,
   hostPlaneRefs,
   selectedHostIdRef,
   osdNodesRef,
   poolNodesRef,
   pgNodesRef,
   trafficParticlesRef,
   selectedPGIdRef,
   osdAnimationDataRef,
   searchedOSDIdsRef,
   searchIngRef,
   updatePgSearchOption,
   highlightNode,
   toggleAllPanels,
   topologyData,
   loadingPGIds,
   isLoadingTopology,
}: {
   selectedObjectRef: RefObject<any>;
   selectedPoolIdRef: RefObject<number | null>;
   searchedPoolIdsRef: RefObject<Set<number>>;
   loadingRef: RefObject<boolean>;
   texturesRef: RefObject<any>;
   cameraRef: RefObject<THREE.Camera | null>;
   showPGsForPool: (poolId: number, poolRefs?: RefObject<any>[]) => void;
   clearAllHighlights: () => void;
   sceneRef: RefObject<THREE.Scene | null>;
   poolRefs: RefObject<any>[];
   hostRefs: RefObject<THREE.Group | null>[];
   hostPlaneRefs: RefObject<THREE.Mesh[]>;
   selectedHostIdRef: RefObject<string | null>;
   osdNodesRef: RefObject<THREE.Group[]>;
   poolNodesRef: RefObject<THREE.Group[]>;
   pgNodesRef: RefObject<THREE.Group[]>;
   trafficParticlesRef: RefObject<THREE.Group[]>;
   selectedPGIdRef: RefObject<string | null>;
   osdAnimationDataRef: RefObject<Map<number, any>>;
   searchedOSDIdsRef: RefObject<Set<number>>;
   searchIngRef: RefObject<boolean>;
   updatePgSearchOption: (enabled: boolean) => void;
   highlightNode: (node: any) => void;
   toggleAllPanels: () => void;
   topologyData: any;
   loadingPGIds: Set<string>;
   isLoadingTopology: boolean;
}) => {
   const { scene, camera, mouse, viewport } = useThree();

   // Cache all nodes to avoid array creation in useFrame
   const allNodesRef = useRef<THREE.Group[]>([]);

   // Update allNodes when node arrays change
   useEffect(() => {
      allNodesRef.current = [...poolNodesRef.current, ...pgNodesRef.current, ...osdNodesRef.current];
   }, [poolNodesRef.current.length, pgNodesRef.current.length, osdNodesRef.current.length]);

   // Animation loop integrated with R3F useFrame
   useFrame((state, delta) => {
      const elapsedTime = state.clock.elapsedTime;

      // Health ring shader material time updates and mesh rotation
      for (const node of allNodesRef.current) {
         // Use cached references instead of children.find()
         const ring = node.userData.ring as THREE.Mesh;
         if (ring && ring.userData.material) {
            const shaderMaterial = ring.userData.material as THREE.ShaderMaterial;
            if (shaderMaterial.uniforms && shaderMaterial.uniforms.time) {
               shaderMaterial.uniforms.time.value = elapsedTime;
            }

            // Use pre-calculated random values stored in userData
            const rx = ring.userData.rx ?? 0.2;
            const ry = ring.userData.ry ?? 0.7;
            ring.rotation.x += delta * rx;
            ring.rotation.y += delta * ry;
         }

         // Update Holographic HUD animations
         const hudGroup = node.userData.hud as THREE.Group;
         if (hudGroup) {
            hudGroup.traverse(child => {
               if (child instanceof THREE.Mesh && child.userData.material) {
                  const material = child.userData.material as THREE.ShaderMaterial;
                  if (material.uniforms && material.uniforms.time) {
                     material.uniforms.time.value = elapsedTime;
                  }
               }
            });

            // Rotate HUD ring slowly
            const hudRing = hudGroup.children[0];
            if (hudRing) {
               hudRing.rotation.z += delta * 0.5;
            }
         }

         // Enhanced OSD animations - pulse, float, rotation, and shader updates
         if (node.userData.type === 'OSD') {
            const animData = osdAnimationDataRef.current.get(node.userData.id);
            const mesh = node.children.find(child => child.type === 'Mesh') as THREE.Mesh;

            if (mesh && mesh.material) {
               const material = mesh.material as THREE.MeshPhongMaterial;
               const ing = searchIngRef.current;
               // Subtle rotation animation for all OSDs
               mesh.rotation.x += delta * 0.1;
               mesh.rotation.y += delta * 0.15;

               // Enhanced animations for selected OSDs
               if (animData && (animData as any).isAnimating) {
                  // Enhanced emissive glow for selected OSDs
                  material.emissiveIntensity = 0.8 + Math.sin(elapsedTime * 4.0) * 0.3;

                  // Scale pulsing for selected OSDs
                  const scalePulse = 1.0 + Math.sin(elapsedTime * 4.0) * 0.1;
                  node.scale.setScalar(scalePulse);
               } else if (ing) {
                  // Check if this OSD is being searched - if so, don't apply floating animation
                  const isBeingSearched = searchedOSDIdsRef?.current?.has(node.userData.id) || false;
                  const isCurrentlyFloating = node.position.y > 10;

                  if (!isBeingSearched && !isCurrentlyFloating) {
                     // Floating animation only for non-searched, non-floating OSDs at original position
                     const floatOffset = Math.sin(elapsedTime * 1.5 + node.userData.id * 0.1) * 0.2;
                     node.position.y = (node.userData.originalY || 0) + floatOffset;
                  }

                  // Reset to normal state for non-selected OSDs
                  if (node.userData.status === 'up' && node.userData.health === 'healthy') {
                     material.emissiveIntensity = 0.5;
                  } else {
                     material.emissiveIntensity = 0.3;
                  }
                  node.scale.setScalar(1.0);
               }
            }
         }

         // Enhanced PG animations
         if (node.userData.type === 'PG') {
            // Find main mesh
            const pgMesh = node.children.find(child => child instanceof THREE.Mesh && !(child as any).name) as THREE.Mesh;

            // Update HUD animations
            const hudGroup = node.children.find(child => child.name === 'pg-holographic-hud') as THREE.Group;
            if (hudGroup) {
               hudGroup.traverse(child => {
                  if (child instanceof THREE.Mesh && child.userData.material) {
                     const material = child.userData.material as THREE.ShaderMaterial;
                     if (material.uniforms && material.uniforms.time) {
                        material.uniforms.time.value = elapsedTime;
                     }
                  }
               });

               // Slow rotation for HUD ring
               const hudRing = hudGroup.children[0];
               if (hudRing) {
                  hudRing.rotation.z += delta * 0.3;
               }
            }

            // Update energy field animation
            const energyField = node.children.find(child => child.name === 'energy-field') as THREE.Mesh;
            if (energyField && energyField.userData.material) {
               const material = energyField.userData.material as THREE.ShaderMaterial;
               if (material.uniforms && material.uniforms.time) {
                  material.uniforms.time.value = elapsedTime;
               }
            }

            // Selected PG enhanced effects
            if (selectedPGIdRef.current === node.userData.id) {
               if (pgMesh && pgMesh.material) {
                  const material = pgMesh.material as THREE.MeshPhysicalMaterial;

                  // Enhanced emissive pulsing
                  material.emissiveIntensity = 0.5 + Math.sin(elapsedTime * 4) * 0.3;

                  // Dynamic color shift for crystalline effect
                  if (node.userData.state === 'active+clean') {
                     const hue = Math.sin(elapsedTime * 2) * 0.1 + 0.5;
                     // Reuse existing color object instead of creating new one
                     if (!material.userData.tempColor) {
                        material.userData.tempColor = new THREE.Color();
                     }
                     material.emissive = material.userData.tempColor.setHSL(hue, 1, 0.3);
                  }

                  // Scale pulsing
                  const scale = 1.2 + Math.sin(elapsedTime * 3) * 0.15;
                  node.scale.setScalar(scale);
               }
            } else {
               // Reset for non-selected PGs
               if (pgMesh && pgMesh.material) {
                  const material = pgMesh.material as THREE.MeshPhysicalMaterial;
                  material.emissiveIntensity = node.userData.state === 'active+clean' ? 0.3 : node.userData.state === 'degraded' ? 0.4 : 0.5;
               }
               node.scale.setScalar(1.0);
            }
         }

         // Pool rotation effects
         if (node.userData.type === 'Pool') {
            const earthSphere = node.userData.earthSphere as THREE.Mesh;
            if (earthSphere) {
               earthSphere.rotation.y += delta * 0.1;
            }

            const clouds = node.userData.clouds as THREE.Mesh;
            if (clouds) {
               // Use cached rotation speed
               const rotationSpeed = clouds.userData.rotationSpeed ?? 0.35;
               clouds.rotation.y += delta * rotationSpeed;
            }
         }
      }

      // Traffic particle animations
      for (const particleGroup of trafficParticlesRef.current) {
         for (let i = 0; i < particleGroup.children.length; i++) {
            const particle = particleGroup.children[i];
            const scale = 1 + Math.sin(elapsedTime * 3 + i) * 0.2;
            particle.scale.set(scale, scale, scale);
         }
      }
   });
   const [texturesLoaded, setTexturesLoaded] = useState(false);
   const textSphereRef = useRef<THREE.Object3D>(null);
   const allPools = useMemo(() => (topologyData?.pools || []).map((_: any, i: number) => ({ index: i })), [topologyData]);
   const poolPositions = useMemo(() => new AdaptiveLayoutManager().applyLayout(allPools, 'spiral', { spacing: 25 }), [allPools]);
   // Animation refs for centralized animation
   const poolAnimationRefs = useRef<
      Array<{
         meshRef: RefObject<THREE.Mesh | null>;
         cloudsRef: RefObject<THREE.Mesh | null>;
         healthRingRef: RefObject<THREE.Mesh | null>;
         poolData: any;
      }>
   >([]);

   const bubbleAnimationRefs = useRef<{
      meshRef: RefObject<THREE.Mesh | null>;
      geometryRef: RefObject<THREE.SphereGeometry | null>;
      originalVertices: RefObject<THREE.Vector3[]>;
      mousePos: RefObject<{ x: number; y: number }>;
      springScale: RefObject<number>;
      scale: number;
   } | null>(null);

   const hostAnimationRefs = useRef<
      Array<{
         meshRef: RefObject<THREE.Mesh | null>;
         tubeRefs: RefObject<THREE.Mesh[]>;
      }>
   >([]);

   const osdAnimationRefs = useRef<
      Array<{
         meshRef: RefObject<THREE.Mesh | null>;
         osdData: any;
      }>
   >([]);

   // Simple noise function for bubble
   const simplex3 = (x: number, y: number, z: number): number => {
      return Math.sin(x * 0.1 + Math.cos(y * 0.1)) * Math.cos(z * 0.1) * 0.5;
   };

   // Centralized animation loop
   useFrame(({ clock }, delta) => {
      const time = clock.getElapsedTime();

      // Animate pools
      poolAnimationRefs.current.forEach(poolRefs => {
         if (poolRefs.meshRef.current) {
            poolRefs.meshRef.current.rotation.y += 0.002;
         }
         if (poolRefs.cloudsRef.current) {
            poolRefs.cloudsRef.current.rotation.y -= 0.004;
         }
         if (poolRefs.healthRingRef.current) {
            poolRefs.healthRingRef.current.rotation.y += delta + Math.random() * 0.01 + 0.005;

            // Update health ring animation
            if (poolRefs.poolData.health !== 'healthy') {
               const material = poolRefs.healthRingRef.current.material as THREE.ShaderMaterial;
               if (material.uniforms?.time) {
                  material.uniforms.time.value = time;
               }
            }
         }
      });

      // Animate bubble
      if (bubbleAnimationRefs.current && bubbleAnimationRefs.current.meshRef.current) {
         const bubble = bubbleAnimationRefs.current;

         // Smooth mouse tracking
         const targetX = mouse.x * viewport.width * 0.3;
         const targetY = mouse.y * viewport.height * 0.3;

         bubble.mousePos.current.x += (targetX - bubble.mousePos.current.x) * 0.05;
         bubble.mousePos.current.y += (targetY - bubble.mousePos.current.y) * 0.05;

         // Calculate distance from center for intensity
         const centerDist = Math.sqrt(bubble.mousePos.current.x * bubble.mousePos.current.x + bubble.mousePos.current.y * bubble.mousePos.current.y);
         const maxDist = Math.sqrt(viewport.width * viewport.width + viewport.height * viewport.height) * 0.25;
         const distRatio = Math.min(centerDist / maxDist, 1);

         // Update vertices with noise
         if (bubble.geometryRef.current) {
            const geometry = bubble.geometryRef.current;
            const positions = geometry.attributes.position.array as Float32Array;

            for (let i = 0; i < bubble.originalVertices.current.length; i++) {
               const original = bubble.originalVertices.current[i];
               const index = i * 3;

               // Apply noise based on original position and time
               const perlin = simplex3(original.x * 0.008 + time * 0.0005, original.y * 0.008 + time * 0.0005, original.z * 0.008);

               // Intensity based on mouse distance
               const ratio = perlin * 0.3 * (distRatio * 0.5 + 0.2) + 0.9;

               positions[index] = original.x * ratio;
               positions[index + 1] = original.y * ratio;
               positions[index + 2] = original.z * ratio;
            }

            geometry.attributes.position.needsUpdate = true;
            geometry.computeVertexNormals();
         }

         // Rotation based on mouse
         if (bubble.meshRef.current) {
            bubble.meshRef.current.rotation.y = -0.3 + mouse.x * 0.3;
            bubble.meshRef.current.rotation.z = 0.3 + mouse.y * -0.3;

            // Apply spring scale
            bubble.meshRef.current.scale.setScalar(bubble.springScale.current * bubble.scale);
         }
      }

      // Animate hosts
      hostAnimationRefs.current.forEach(hostRefs => {
         if (hostRefs.meshRef.current) {
            // Subtle pulsing glow effect
            const material = hostRefs.meshRef.current.material as THREE.MeshPhysicalMaterial;
            material.emissiveIntensity = 0.2 + Math.sin(time * 2) * 0.1;
         }

         // Animate tube line glow effects
         hostRefs.tubeRefs.current.forEach((tube, index) => {
            if (tube && index == 0) {
               const material = tube.material as THREE.MeshPhysicalMaterial;
               // Different phases for each tube to create wave effect
               const phase = index * Math.PI * 0.4 + time * 3;
               material.emissiveIntensity = 0.3 + Math.sin(phase) * 0.4;
               material.opacity = 0.6 + Math.sin(phase) * 0.3;
            }
         });
      });

      // Animate OSDs
      /*osdAnimationRefs.current.forEach(osdRefs => {
         if (osdRefs.meshRef.current) {
            // Pulsing glow based on health status
            const material = osdRefs.meshRef.current.material as THREE.MeshPhysicalMaterial;
            const baseIntensity = osdRefs.osdData.status === 'up' && osdRefs.osdData.health === 'healthy' ? 0.6 : 0.3;
            material.emissiveIntensity = baseIntensity + Math.sin(time * 3) * 0.2;
         }
      });*/
   });

   // Set camera and scene refs for parent component
   useEffect(() => {
      cameraRef.current = camera;
      sceneRef.current = scene;
   }, [camera, scene, cameraRef, sceneRef]);

   // Pool click handler
   const handlePoolClick = (poolData: any) => {
      if (selectedPoolIdRef.current === poolData.id) {
         // Deselect if same pool is clicked again
         clearAllHighlights();
         selectedPoolIdRef.current = null;
         selectedObjectRef.current = null;
         updatePgSearchOption(false);

         // Close info-panel when pool is deselected
         const infoPanelElement = document.querySelector('.info-panel') as HTMLElement;
         if (infoPanelElement) {
            infoPanelElement.style.display = 'none';
         }
      } else {
         // Select new pool
         selectedPoolIdRef.current = poolData.id;
         selectedObjectRef.current = { type: 'Pool', ...poolData };
         updatePgSearchOption(true);

         // info-panel DOM 직접 업데이트 및 표시
         const infoPanelElement = document.querySelector('.info-panel') as HTMLElement;
         const infoTitle = document.querySelector('#info-title');
         const infoContent = document.querySelector('#info-content');

         // Get pool detail from poolData.detail
         const poolDetail = poolData.detail;
         const poolInfo = poolDetail?.pool_info;

         if (infoPanelElement && infoTitle && infoContent) {
            infoTitle.textContent = `Pool: ${poolData.name}`;
            infoContent.innerHTML = `
               <p>
                  <strong>Pool Name:</strong> ${poolData.name}<br/>
                  <strong>Pool ID:</strong> ${poolData.id}<br/>
                  <strong>Health:</strong> ${poolData.health || 'healthy'}<br/>
                  <strong>Type:</strong> ${poolInfo?.type || 'N/A'}<br/>
                  <strong>Size:</strong> ${poolInfo?.size || 'N/A'}<br/>
                  <strong>Min Size:</strong> ${poolInfo?.min_size || 'N/A'}<br/>
                  <br/>
                  <strong>Objects:</strong> ${poolInfo?.statistics?.objects?.toLocaleString() || 0}<br/>
                  <strong>Stored Bytes:</strong> ${poolInfo?.statistics?.stored_bytes ? formatBytes(poolInfo.statistics.stored_bytes) : 'N/A'}<br/>
                  <strong>Used Bytes:</strong> ${poolInfo?.utilization?.used_bytes ? formatBytes(poolInfo.utilization.used_bytes) : 'N/A'}<br/>
                  <strong>Usage Percent:</strong> ${poolInfo?.utilization?.usage_percent?.toFixed(2) || 0}%<br/>
                  <br/>
                  <strong>PG Count:</strong> ${poolInfo?.pg_num || 0}<br/>
                  <strong>PGP Count:</strong> ${poolInfo?.pgp_num || 0}<br/>
                  <br/>
                  <strong>Application:</strong> ${poolInfo?.application || 'N/A'}<br/>
                  <strong>Autoscale Mode:</strong> ${poolInfo?.autoscale_mode || 'N/A'}<br/>
                  <strong>Compression Mode:</strong> ${poolInfo?.compression_mode || 'N/A'}<br/>
                  <strong>Compression Algorithm:</strong> ${poolInfo?.compression_algorithm || 'N/A'}<br/>
                  <br/>
                  <strong>Read Ops:</strong> ${poolInfo?.statistics?.read_ops}<br/>
                  <strong>Write Ops:</strong> ${poolInfo?.statistics?.write_ops}<br/>
                  <strong>Read Bytes:</strong> ${poolInfo?.statistics?.read_bytes != null ? formatBytes(poolInfo.statistics.read_bytes) : 'N/A'}<br/>
                  <strong>Write Bytes:</strong> ${poolInfo?.statistics?.write_bytes != null ? formatBytes(poolInfo.statistics.write_bytes) : 'N/A'}
               </p>
            `;
            infoPanelElement.style.display = 'block';
         }

         // Call Three.js showPGsForPool function to create connection lines
         showPGsForPool(poolData.id, poolRefs);
      }
   };

   // Initialize scene elements
   useEffect(() => {
      // Load textures and create topology
      const initScene = async () => {
         // Load textures
         texturesRef.current.albedoMap = await loadTexture('/3d/textures/earth/Albedo.jpg');
         texturesRef.current.bumpMap = await loadTexture('/3d/textures/earth/Bump.jpg');
         texturesRef.current.oceanMap = await loadTexture('/3d/textures/earth/Ocean.png');
         // texturesRef.current.lightsMap = await loadTexture('/3d/textures/earth/night_lights_modified.png');
         texturesRef.current.cloudsMap = await loadTexture('/3d/textures/earth/Clouds.png');

         // const textureLoader = new THREE.TextureLoader();
         // texturesRef.current.metalPlanetMap = textureLoader.load('/3d/textures/planet/Various_AluminiumFoil01_header.jpg');
         // texturesRef.current.yellowMap = textureLoader.load('/3d/textures/planet/Metal_RedHotSteel_header.jpg');
         // texturesRef.current.redMap = textureLoader.load('/3d/textures/cube/Leather_Tufted_header_red.jpg');
         // texturesRef.current.hostMap = textureLoader.load('/3d/textures/planet/silver-metal-pattern-steel.webp');

         // Mark textures as loaded
         setTexturesLoaded(true);
         // Spinner will be hidden by the effect that checks both textures and topology API
      };

      initScene();
   }, []);

   // Hide spinner when both textures and topology API are loaded
   useEffect(() => {
      if (texturesLoaded && !isLoadingTopology && topologyData) {
         setTimeout(() => {
            loadingRef.current = false;
            // DOM 직접 조작으로 로딩 스피너 숨김
            const loadingElement = document.querySelector('.loading-spinner-container') as HTMLElement;
            if (loadingElement) {
               loadingElement.style.display = 'none';
            }
         }, 1000); // Short delay for smooth transition
      }
   }, [texturesLoaded, isLoadingTopology, topologyData]);

   const ref = useRef(false);

   useEffect(() => {
      if (texturesLoaded && !ref.current && topologyData) {
         ref.current = true;
         // Use a longer delay to ensure all components are mounted
         setTimeout(() => {
            /*const allPools = topologyData.pools.map((_, i) => ({ index: i }));
            const positions = new AdaptiveLayoutManager().applyLayout(allPools, 'spiral', {
               spacing: 25,
            });
            poolRefs.forEach((pool: RefObject<any>, idx) => {
               if (pool.current && pool.current.position) {
                  gsap.to(pool.current.position, {
                     x: positions[idx].position[0],
                     y: 50,
                     z: positions[idx].position[2],
                     duration: 1.5,
                     ease: 'power2.inOut',
                  });
               }
            });*/

            let clickPoolId = 0;
            let maxCount = 0;
            topologyData.pools.forEach((p: any) => {
               if (p.pgs.length > maxCount) {
                  maxCount = p.pgs.length;
                  clickPoolId = p.id;
               }
            });

            const pool = poolRefs.find(pool => pool.current && pool.current.userData.id === clickPoolId);
            if (!!pool) {
               highlightNode(pool.current);
            }

            if (cameraRef.current && cameraRef.current.position.y >= 0) {
               gsap.to(cameraRef.current.position, {
                  x: 0,
                  y: 33,
                  z: 270,
                  duration: 5,
                  ease: 'power2.inOut',
               });
            }
            setTimeout(() => {
               toggleAllPanels();
            }, 5100);

            // Animation loop moved to useFrame - removed initialAnimate()

            // Generate OSD nodes after hosts are positioned
            /*setTimeout(() => {
               generateOSDNodes();
            }, 100);*/
         }, 1); // Increased delay to ensure refs are ready
      }
   }, [texturesLoaded, topologyData]);

   // Wait for textures and topology API to load before rendering main content
   if (!texturesLoaded || isLoadingTopology || !topologyData) {
      const loadingMessage = !texturesLoaded ? 'Loading Textures...' : isLoadingTopology || !topologyData ? 'Loading Topology Data...' : 'Loading...';

      return (
         <>
            <Stars radius={300} depth={100} count={1000} factor={4} saturation={0} fade />
            <Text3D position={[0, 0, 0]} fontSize={8} color={0xffffff} anchorX="center" anchorY="middle">
               {loadingMessage}
            </Text3D>
         </>
      );
   }

   return (
      <>
         <Stars radius={30} depth={100} count={1000} factor={4} saturation={0} fade />
         <Stars radius={100} depth={100} count={500} factor={4} saturation={0} fade />
         {/*<ambientLight intensity={0.3} />*/}
         {/*<directionalLight position={[100, 80, 60]} intensity={3} castShadow shadow-mapSize={[1024, 1024]} />*/}
         {/*<directionalLight position={[-30, 30, -40]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]}>
            <orthographicCamera args={[-100, 100, -100, 100, 0.1, 200]} />
         </directionalLight>*/}
         <directionalLight position={[0, -50, 0]} intensity={3} shadow-mapSize={[256, 256]}>
            {/*<orthographicCamera args={[-100, 100, -100, 100, 0.1, 200]} />*/}
         </directionalLight>
         <rectAreaLight
            args={['#ffffff', 1.5, 100, 150]}
            position={[0, 80, 0]}
            rotation-x={-Math.PI / 2} // -> 조명이 밑에서 위로 (위에서 아래로 비추려면 : -Math.PI / 2)
         />
         {/*{textSphereRef.current && (
            <SpotLight
               color={0xffffff}
               intensity={10}
               position={[0, -30, 100]}
               angle={Math.PI / 4}
               anglePower={100}
               target={textSphereRef.current}
               distance={50}
               volumetric
            />
         )}*/}
         {/*<hemisphereLight args={['dodgerblue', 'hotpink', 5]} position={[0, 10, 0]} intensity={10} castShadow />*/}
         {/*<pointLight position={[0, -20, 0]} intensity={0.8} distance={150} />*/}
         {/*<directionalLight position={[0, -15, 30]} intensity={0.6} />*/}
         <OrbitControls
            enableDamping
            dampingFactor={0.05}
            enablePan
            autoRotate
            autoRotateSpeed={0.05}
            mouseButtons={{
               LEFT: THREE.MOUSE.ROTATE,
               MIDDLE: THREE.MOUSE.PAN,
               RIGHT: THREE.MOUSE.DOLLY,
            }}
         />

         {/* Shadow-receiving ground plane */}
         {/*<mesh receiveShadow position={[0, -60, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[800, 800]} />
            <shadowMaterial transparent opacity={0} />
         </mesh>*/}

         {/* Pool Nodes with Spiral Layout */}
         {topologyData.pools.map((pool: any, index: number) => {
            // const layoutManager = new AdaptiveLayoutManager();
            // const allPools = topologyData.pools.map((_, i) => ({ index: i }));
            // const positions = layoutManager.applyLayout(allPools, 'hierarchical', { spacing: 20 });
            const pos = poolPositions[index].position;

            // Create animation refs for this pool
            if (!poolAnimationRefs.current[index]) {
               poolAnimationRefs.current[index] = {
                  meshRef: { current: null },
                  cloudsRef: { current: null },
                  healthRingRef: { current: null },
                  poolData: pool,
               };
            }

            return (
               <PoolNode
                  ref={poolRefs[index]}
                  key={pool.id}
                  poolData={pool}
                  position={[pos[0], 70, pos[2]]}
                  textures={texturesRef.current}
                  onPoolClick={handlePoolClick}
                  selectedPoolIdRef={selectedPoolIdRef}
                  searchedPoolIdsRef={searchedPoolIdsRef}
                  animationRefs={poolAnimationRefs.current[index]}
               />
            );
         })}
         {/*pool 주변 조명*/}
         {/*<pointLight args={['#ffffff', 150, 40, -0.3]} position={[0, 60, 0]} intensity={10} castShadow />*/}

         {/* Spaceship-style Doughnut Table and Hosts */}
         <DoughnutTable position={[0, -41, 0]} />
         {/*<BangingGlassBall scale={2.5} useOrbit orbitCenterPosition={[0, -100, 0]} orbitRadius={80} y={-50} angularSpeed={-0.3} />*/}
         <Stone orbitRadius={90} orbitSpeed={0.002} yPosition={-100} scale={5} />

         <GlassBall scale={1.5} useOrbit orbitCenterPosition={[0, -60, 0]} orbitRadius={45} y={-39} angularSpeed={0.3} />
         {/*<Portal position={[0, -45, 0]} scale={90} />*/}
         {/*<MetaPlate position={[0, 0, 0]} />*/}

         {/*Bubble 주변 조명*/}
         <rectAreaLight
            args={['#ffffff', 3, 50, 50]}
            position={[0, -28, 0]}
            rotation-x={-Math.PI / 2} // -> 조명이 위에서 밑으로? (반대로 비추려면 : Math.PI / 2)
         />
         {/*<pointLight args={['#ffffff', 50, 50, 1]} position={[0, -33, 13]} />*/}
         {/*<pointLight args={['#ffffff', 50, 50, 1]} position={[0, -33, -13]} />*/}
         {/*<pointLight args={['#ffffff', 50, 50, 1]} position={[13, -33, 0]} />*/}
         {/*<pointLight args={['#ffffff', 50, 50, 1]} position={[-13, -33, 0]} />*/}
         <Bubble position={[0, -35, 0]} scale={3} color={Colors.slate[100]} useBubble />
         <TextSphere ref={textSphereRef} position={[0, -36, 0]} scale={4} text="OKESTRO  OKESTRO" bgColor={Colors.white} textColor={Colors.blue[600]} />
         {/*Portal 상단 조명*/}
         {/*<rectAreaLight args={['#ffffff', 3, 30, 20]} position={[0, -45, 0]} rotation-x={Math.PI / 2} />*/}
         {/*<pointLight args={['#ffffff', 40, 20, 0.5]} position={[0, -50, 0]} />*/}
         <PortalLight position={[0, -65, 0]} scale={60} />
         <Medical position={[0, -41, 71.2]} rotation={[0, 0, 0]} scale={4} />

         {/*<Stone position={[0, -45, 0]} scale={7} />*/}
         {/*<ControlBox position={[-61.5, -35.4, 0]} rotation={[0, -Math.PI / 2, 0]} scale={5} />*/}
         {/*<TabletModel position={[-83, -37, 0]} rotation={[0, 0, 0]} scale={5.5} />*/}
         {/* Spaceship Host Control Panels on Random Segments */}
         {topologyData.hosts.map((host: any, index: number) => {
            // Assign hosts to random segments (but consistent)
            const segmentIndex = index % 8; // Distribute across 8 segments

            // Create animation refs for this host
            if (!hostAnimationRefs.current[index]) {
               hostAnimationRefs.current[index] = {
                  meshRef: { current: null },
                  tubeRefs: { current: [] },
               };
            }

            return (
               <SpaceshipHost
                  ref={hostRefs[index]}
                  key={host.id}
                  hostData={host}
                  segmentIndex={segmentIndex}
                  position={[0, -40, 0]}
                  animationRefs={hostAnimationRefs.current[index]}
                  hostPlaneRefs={hostPlaneRefs}
                  selectedHostIdRef={selectedHostIdRef}
               />
            );
         })}

         {/* Crystal OSD Cubes on Host Control Panels */}
         {topologyData.hosts.map((host: any, hostIndex: number) => {
            const segmentIndex = hostIndex % 8;
            const angle = (segmentIndex / 8) * Math.PI * 2 + Math.PI / 8;

            const hostOsds = topologyData.osds.filter((osd: any) => osd.host === host.id);
            const cubeSize = 2.5;
            const spacing = cubeSize * 0.25; // 1/4 of cube size
            const totalSpacing = cubeSize + spacing;

            // 4 columns layout
            const cols = 4;
            // const rows = Math.ceil(hostOsds.length / cols);

            return hostOsds.map((osd: any, osdIndex: number) => {
               const row = Math.floor(osdIndex / cols);
               const col = osdIndex % cols;

               // Calculate formation facing toward center (rectangular, not rotated)
               const formationAngle = angle; // Face toward center

               // Start from inner radius + 1.5 and extend outward
               const innerDoughnutRadius = 70;
               const startRadius = innerDoughnutRadius + 1.5; // 71.5

               // Position in rectangular formation (4 columns wide)
               // Columns spread perpendicular to radius, rows extend outward from inner edge
               const perpAngle = angle + Math.PI / 2; // Perpendicular to radius

               // Column offset (side to side)
               const colOffset = (col - (cols - 1) / 2) * totalSpacing;
               const colX = Math.cos(perpAngle) * colOffset;
               const colZ = Math.sin(perpAngle) * colOffset;

               // Row positioning: start from inner edge and extend outward
               const rowRadius = startRadius + row * totalSpacing;
               const baseX = Math.cos(angle) * rowRadius;
               const baseZ = Math.sin(angle) * rowRadius;

               // Final position
               const finalX = baseX + colX;
               const finalZ = baseZ + colZ;
               const finalY = -36; // On top of doughnut surface

               // Create animation refs for this OSD
               const osdAnimationIndex = osdAnimationRefs.current.length;
               if (!osdAnimationRefs.current[osdAnimationIndex]) {
                  osdAnimationRefs.current[osdAnimationIndex] = {
                     meshRef: { current: null },
                     osdData: osd,
                  };
               }

               return (
                  <group key={osd.id} position={[finalX, finalY, finalZ]} rotation={[0, formationAngle + Math.PI / 4, 0]}>
                     <CrystalOSD
                        osdData={osd}
                        position={[0, 0, 0]}
                        labelRotation={formationAngle + Math.PI / 4}
                        animationRefs={osdAnimationRefs.current[osdAnimationIndex]}
                        onCreated={ref => {
                           if (ref && osdNodesRef.current) {
                              // Only initialize userData if it hasn't been set yet (prevent overwriting)
                              if (!ref.userData || !ref.userData.initialized) {
                                 // Add OSD node to ref for Three.js access
                                 ref.userData = {
                                    ...osd,
                                    type: 'OSD',
                                    initialized: true, // Mark as initialized to prevent re-initialization
                                 };

                                 // Use parent group position for originalY (the actual world position)
                                 const parentGroup = ref.parent;
                                 if (parentGroup) {
                                    ref.userData.worldY = parentGroup.position.y; // Store parent Y position
                                    ref.userData.originalY = 0; // Store original child Y position (relative to parent)
                                 }

                                 osdNodesRef.current.push(ref);
                              }
                           }
                        }}
                     />
                  </group>
               );
            });
         })}

         {/* Energy charging effects for loading PGs */}
         {Array.from(loadingPGIds).map(pgId => {
            const pgNode = pgNodesRef.current.find(pg => pg.userData.id === pgId);
            if (!pgNode) return null;

            const position = new THREE.Vector3();
            pgNode.getWorldPosition(position);

            return <PGEnergyEffect key={`energy-${pgId}`} position={position} radius={3} />;
         })}
      </>
   );
};

// Mock Data
const mockData = {
   cluster: {
      health: 'HEALTH_OK',
      healthScore: 95,
      osds: {
         up: 78,
         down: 2,
         in: 76,
         out: 4,
      },
      capacity: {
         used: '3.2 PB',
         total: '5.0 PB',
         usedPercent: 64,
      },
      iops: {
         read: '125.4K',
         write: '89.7K',
      },
      pgs: {
         activeClean: 4096,
         degraded: 12,
      },
   },
   switches: {
      autoHealing: true,
      monitoring: true,
      alerts: false,
   },
   predictions: [
      {
         id: 1,
         icon: '⚠️',
         title: 'OSD Failure Predicted',
         risk: 'high',
         probability: 78,
         eta: '2-3 hours',
      },
      {
         id: 2,
         icon: '📊',
         title: 'Capacity Exhaustion',
         risk: 'medium',
         probability: 45,
         eta: '7 days',
      },
      {
         id: 3,
         icon: '🔥',
         title: 'Hotspot Detection',
         risk: 'critical',
         probability: 92,
         eta: 'Immediate',
      },
      {
         id: 4,
         icon: '⚡',
         title: 'Performance Degradation',
         risk: 'low',
         probability: 23,
         eta: '2 weeks',
      },
   ],
   quickStats: {
      latency: 1.2,
      throughput: '2.4 GB/s',
      alerts: 7,
   },
   performance: [
      { name: 'CPU Usage', value: 68, status: 'normal' },
      { name: 'Memory', value: 82, status: 'warning' },
      { name: 'Network', value: 45, status: 'normal' },
      { name: 'Disk I/O', value: 91, status: 'critical' },
      { name: 'Cache Hit', value: 94, status: 'optimal' },
   ],
   topOsds: [
      { id: 'osd.15', iops: 4856, latency: 2.3, utilization: 89, temperature: 52, status: 'optimal' },
      { id: 'osd.7', iops: 4721, latency: 3.1, utilization: 91, temperature: 58, status: 'normal' },
      { id: 'osd.23', iops: 4683, latency: 2.8, utilization: 87, temperature: 49, status: 'optimal' },
      { id: 'osd.2', iops: 4542, latency: 4.2, utilization: 93, temperature: 61, status: 'warning' },
      { id: 'osd.11', iops: 4398, latency: 2.1, utilization: 85, temperature: 47, status: 'optimal' },
      { id: 'osd.31', iops: 4276, latency: 5.7, utilization: 96, temperature: 67, status: 'critical' },
      { id: 'osd.8', iops: 4124, latency: 3.4, utilization: 78, temperature: 53, status: 'normal' },
      { id: 'osd.19', iops: 3987, latency: 2.9, utilization: 82, temperature: 50, status: 'normal' },
      { id: 'osd.5', iops: 3856, latency: 6.1, utilization: 94, temperature: 64, status: 'warning' },
      { id: 'osd.27', iops: 3742, latency: 3.7, utilization: 88, temperature: 55, status: 'normal' },
   ],
};

export default function ClusterTopologyViewOri2() {
   // Topology store - fetch real data from API
   const topologyData = useTopologyStore(selectTopologyData);
   const isLoadingTopology = useTopologyStore(selectIsLoading);
   const fetchPGOSDs = useTopologyStore(state => state.fetchPGOSDs);
   const isPGLoading = useTopologyStore(state => state.isPGLoading);
   const loadingPGIds = useTopologyStore(state => state.loadingPGIds);

   // Check for empty data and show error toast
   useEffect(() => {
      if (!isLoadingTopology && topologyData) {
         // Check if data field is null or empty
         if (!topologyData.data || topologyData.data.length === 0) {
            toast.error('토폴로지 데이터가 비어있습니다. 클러스터 상태를 확인해주세요.');
         }
      }
   }, [isLoadingTopology, topologyData]);

   // Transform real data to match structure expected by visualization
   // Only transform when data is available
   const transformedTopologyData = useMemo(() => {
      if (topologyData && topologyData.data && topologyData.data.length > 0) {
         return transformTopologyData(topologyData);
      }
      return null;
   }, [topologyData]);

   // useRef로 모든 상태 관리 (리렌더링 방지)
   const selectedObjectRef = useRef<any>(null);
   const loadingRef = useRef(true);
   // const clock = useMemo(() => new THREE.Clock(), []);
   // useRef로 패널 상태 관리 (리렌더링 방지)
   const panelsRef = useRef({
      top: { collapsed: true },
      left: { collapsed: true },
      bottom: { collapsed: true },
      right: { collapsed: true },
   });

   // 초기화 시 모든 패널 숨기기 (React 리렌더링 없음)
   useEffect(() => {
      const targetPositions: Array<'top' | 'left' | 'bottom' | 'right'> = ['top', 'left', 'bottom', 'right'];
      targetPositions.forEach(position => {
         // 패널 상태를 collapsed로 설정
         panelsRef.current[position].collapsed = true;

         const panelElement = document.querySelector(`.panel-${position}`) as HTMLElement;
         if (panelElement) {
            panelElement.style.display = 'none';
            // 초기 위치를 숨김 상태로 설정
            gsap.set(panelElement, getInitialTransform(position));
         }
      });
   }, []);

   const isFullscreenRef = useRef(false);
   const searchPanelRef = useRef({ collapsed: true });
   const searchTypeRef = useRef('pool');
   const searchQueryRef = useRef('');
   const selectedPoolIdRef = useRef<number | null>(null);
   const selectedPGIdRef = useRef<string | null>(null);
   const selectedHostIdRef = useRef<string | null>(null);
   const selectedOSDIdRef = useRef<number | null>(null);
   const searchedPoolIdsRef = useRef<Set<number>>(new Set());
   const searchedOSDIdsRef = useRef<Set<number>>(new Set());
   const showPoolPGLinesRef = useRef(true); // Toggle for pool-pg connection lines visibility

   // Node refs - moved from ClusterTopologyScene to main component
   const poolNodesRef = useRef<THREE.Group[]>([]);
   const pgNodesRef = useRef<THREE.Group[]>([]);
   const osdNodesRef = useRef<THREE.Group[]>([]);

   // Store OSD animation data separately to prevent userData overwriting
   const osdAnimationDataRef = useRef<
      Map<
         number,
         {
            originalY?: number;
            originalRotationY?: number;
            originalOpacity?: number;
            rotationTween?: any;
            opacityTween?: any;
            label?: any;
         }
      >
   >(new Map());
   const hostNodesRef = useRef<THREE.Group[]>([]);
   const hostPlaneRefs = useRef<THREE.Mesh[]>([]);
   const texturesRef = useRef<any>({});
   // R3F Pool refs for getting actual world positions
   const poolRefs = useMemo(
      () => Array.from({ length: transformedTopologyData?.pools.length || 0 }, () => createRef()),
      [transformedTopologyData?.pools.length],
   );
   // R3F Host refs for search functionality
   const hostRefs = useMemo(
      () => Array.from({ length: transformedTopologyData?.hosts.length || 0 }, () => createRef<THREE.Group>()),
      [transformedTopologyData?.hosts.length],
   );

   // Three.js refs - some are deprecated in R3F but kept for compatibility
   const sceneRef = useRef<THREE.Scene | null>(null);
   const cameraRef = useRef<THREE.Camera | null>(null);
   const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
   const controlsRef = useRef<any>(null);
   const raycasterRef = useRef<THREE.Raycaster | null>(null);
   const mouseRef = useRef<THREE.Vector2 | null>(null);
   const canvasRef = useRef<HTMLCanvasElement | null>(null);
   const connectionLinesRef = useRef<(THREE.Line | THREE.Mesh)[]>([]);
   // const starFieldRef = useRef<THREE.Points | null>(null);
   const trafficParticlesRef = useRef<THREE.Group[]>([]);

   // Search state for performance optimization (avoids DOM queries in useFrame)
   const searchIngRef = useRef(false);

   // PG search enabled state - managed via DOM manipulation
   const updatePgSearchOption = (enabled: boolean) => {
      const pgOption = document.querySelector('.search-select option[value="pg"]') as HTMLOptionElement;
      if (pgOption) {
         pgOption.disabled = !enabled;
      }
   };

   const handleToggleFullscreen = () => {
      // useRef 사용 (React 리렌더링 없음)
      isFullscreenRef.current = !isFullscreenRef.current;
      const appHeader = document.querySelector('.ceph-header');
      const topologyContainer = document.querySelector('.topology-container');
      const topPanel = document.querySelector('.panel-top');
      const searchBtn = document.querySelector('.search-expand-btn');
      const searchPanel = document.querySelector('.search-panel');

      if (isFullscreenRef.current) {
         if (appHeader) (appHeader as HTMLElement).style.display = 'none';
         if (topPanel) (topPanel as HTMLElement).style.top = '10px';
         if (searchBtn) (searchBtn as HTMLElement).style.top = '10px';
         if (searchPanel) (searchPanel as HTMLElement).style.top = '10px';
         if (topologyContainer) topologyContainer.classList.add('fullscreen-mode');
      } else {
         if (appHeader) (appHeader as HTMLElement).style.display = 'block';
         if (topPanel) (topPanel as HTMLElement).style.top = '74px';
         if (searchBtn) (searchBtn as HTMLElement).style.top = '74px';
         if (searchPanel) (searchPanel as HTMLElement).style.top = '74px';
         if (topologyContainer) topologyContainer.classList.remove('fullscreen-mode');
      }

      // TODO: R3F handles canvas resizing automatically
   };

   const toggleSearchPanel = () => {
      // useRef 사용 (React 리렌더링 없음)
      searchPanelRef.current.collapsed = !searchPanelRef.current.collapsed;

      // DOM 직접 조작으로 패널 슬라이드 애니메이션
      const searchPanelElement = document.querySelector('.search-panel') as HTMLElement;
      const searchExpandBtnElement = document.querySelector('.search-expand-btn') as HTMLElement;

      if (searchPanelElement && searchExpandBtnElement) {
         if (searchPanelRef.current.collapsed) {
            // 패널 닫기: 패널은 슬라이드아웃, 버튼은 슬라이드인
            gsap.to(searchPanelElement, {
               x: -300, // 왼쪽으로 슬라이드아웃
               duration: 0.4,
               ease: 'power2.inOut',
               onComplete: () => {
                  searchPanelElement.style.display = 'none';
               },
            });

            // 버튼 슬라이드인
            gsap.to(searchExpandBtnElement, {
               x: 0,
               opacity: 1,
               duration: 0.4,
               delay: 0.1,
               ease: 'power2.out',
            });
         } else {
            // 패널 열기: 버튼은 슬라이드아웃, 패널은 슬라이드인
            searchPanelElement.style.display = 'block';

            // 버튼 슬라이드아웃
            gsap.to(searchExpandBtnElement, {
               x: -60,
               opacity: 0,
               duration: 0.3,
               ease: 'power2.in',
            });

            // 패널 슬라이드인
            gsap.fromTo(
               searchPanelElement,
               { x: -300 },
               {
                  x: 0,
                  duration: 0.4,
                  delay: 0.1,
                  ease: 'power2.out',
               },
            );
         }
      }
   };

   // 사용안함 - toggleAllPanels만 사용
   // const togglePanel = (position: 'top' | 'left' | 'bottom' | 'right') => {};

   const toggleAllPanels = useCallback(() => {
      const targetPositions: Array<'top' | 'left' | 'bottom' | 'right'> = ['top', 'left', 'bottom', 'right'];

      // useRef로 상태 확인 (리렌더링 없음)
      const allCollapsed = targetPositions.every(pos => panelsRef.current[pos].collapsed);
      if (allCollapsed) {
         // 패널 열기: useRef 상태만 변경 (리렌더링 없음)
         targetPositions.forEach(pos => {
            panelsRef.current[pos].collapsed = false;
         });

         // DOM 직접 조작으로 패널 표시
         targetPositions.forEach((position, index) => {
            const panelElement = document.querySelector(`.panel-${position}`) as HTMLElement;
            if (panelElement) {
               // 패널 표시
               panelElement.style.display = 'block';

               // 초기 위치 설정
               gsap.set(panelElement, getInitialTransform(position));

               // 목표 위치로 애니메이션
               const targetTransform =
                  position === 'top' || position === 'bottom'
                     ? { xPercent: 0, y: 0, opacity: 1 } // top/bottom 패널은 xPercent로 중앙 정렬
                     : { x: 0, y: 0, opacity: 1 }; // left/right 패널은 x: 0으로

               gsap.to(panelElement, {
                  ...targetTransform,
                  duration: 0.5, // 애니메이션 시간을 조금 늘림
                  // delay: index * 0.05,
                  ease: 'power2.out',
                  onComplete: () => {
                     // console.log(`패널 ${position} 애니메이션 완료`);
                  },
               });
            }
         });
      } else {
         // 패널 닫기: useRef 상태만 변경
         targetPositions.forEach(pos => {
            panelsRef.current[pos].collapsed = true;
         });

         // DOM 직접 조작으로 패널 숨기기
         targetPositions.forEach((position, index) => {
            const panelElement = document.querySelector(`.panel-${position}`) as HTMLElement;
            if (panelElement) {
               gsap.to(panelElement, {
                  ...getExitTransform(position),
                  duration: 0.3,
                  // delay: index * 0.05,
                  ease: 'power2.out',
                  onComplete: () => {
                     // 애니메이션 완료 후 패널 숨기기
                     panelElement.style.display = 'none';
                  },
               });
            }
         });
      }
   }, []); // 의존성 제거 (useRef는 리렌더링 트리거 안함)

   const getSearchPlaceholder = () => {
      switch (searchTypeRef.current) {
         case 'pool':
            return 'Enter pool name...';
         case 'pg':
            return 'Enter PG ID...';
         case 'osd':
            return 'Enter OSD ID (e.g., osd.1)...';
         case 'host':
            return 'Enter hostname...';
         default:
            return 'Enter search term...';
      }
   };

   const pulseNode = (node: THREE.Group | THREE.Object3D, poolId?: number) => {
      gsap.killTweensOf(node.scale);
      // Set initial scale to 0.8
      node.scale.set(0.8, 0.8, 0.8);

      gsap.to(node.scale, {
         x: 1.4,
         y: 1.4,
         z: 1.4,
         duration: 0.7,
         ease: 'power2.inOut',
         yoyo: true,
         repeat: 9, // 5 complete pulses (5 * 2 - 1)
         onComplete: () => {
            // Reset to original scale after pulsing
            node.scale.set(1, 1, 1);
            // Remove from searched pools when animation completes
            if (poolId !== undefined) {
               searchedPoolIdsRef.current.delete(poolId);
            }
         },
      });
   };

   const clearSearch = () => {
      searchQueryRef.current = '';
      searchIngRef.current = false;
      (document.querySelector('.search-panel') as HTMLElement).setAttribute('ing', '0');
      // Return any floating searched OSDs to their original positions
      // But skip OSDs that are selected by PG
      if (searchedOSDIdsRef.current.size > 0) {
         osdNodesRef.current.forEach(node => {
            const osdId = node.userData.id;
            const isSelectedByPG = node.userData.selected === true;

            // Only return to original position if it was searched AND not selected by PG
            if (searchedOSDIdsRef.current.has(osdId) && !isSelectedByPG) {
               // Animate child position.y directly (consistent with search approach)
               const currentY = node.position.y;
               const isCurrentlyFloating = currentY > 10;

               if (isCurrentlyFloating) {
                  // Move down by 15 units from current position (reverse of float up)
                  gsap.to(node.position, {
                     y: currentY - 15,
                     duration: 1.0,
                     ease: 'power2.out',
                  });
               }
            }
         });
      }

      searchedPoolIdsRef.current.clear(); // Clear searched pool IDs
      searchedOSDIdsRef.current.clear(); // Clear searched OSD IDs
      // Check if PG option is disabled and switch to pool if needed
      const pgOption = document.querySelector('.search-select option[value="pg"]') as HTMLOptionElement;
      if (searchTypeRef.current === 'pg' && pgOption && pgOption.disabled) {
         searchTypeRef.current = 'pool';
      }

      // DOM 직접 업데이트
      const searchInput = document.querySelector('.search-field') as HTMLInputElement;
      const searchSelect = document.querySelector('.search-select') as HTMLSelectElement;

      if (searchInput) {
         searchInput.value = '';
      }
      if (searchSelect) {
         searchSelect.value = searchTypeRef.current;
      }
   };

   const handleClearButton = () => {
      const currentSearchType = searchTypeRef.current;

      switch (currentSearchType) {
         case 'pool':
            // 현재 선택상태의 pool을 선택해제
            if (selectedPoolIdRef.current !== null) {
               selectedPoolIdRef.current = null;
               clearAllHighlights();
               updatePgSearchOption(false);
            }
            break;
         case 'pg':
         case 'osd':
            // 선택상태의 PG들을 모두 선택해제하고, 떠올라 있는 OSD들이 모두 제자리로 돌아감
            if (selectedPGIdRef.current !== null) {
               selectedPGIdRef.current = null;
               showOSDsForPG(null); // This will return OSDs to original position
            }
            clearSearch(); // Also clear any search results
            break;
         case 'host':
            // 현재 선택된 host를 선택해제
            if (selectedHostIdRef.current !== null) {
               selectedHostIdRef.current = null;
               clearAllHighlights();
            }
            break;
      }
   };

   const performSearch = () => {
      if (!searchQueryRef.current.trim()) {
         searchIngRef.current = false;
         (document.querySelector('.search-panel') as HTMLElement).setAttribute('ing', '0');
         return;
      }
      searchIngRef.current = true;
      (document.querySelector('.search-panel') as HTMLElement).setAttribute('ing', '1');
      const query = searchQueryRef.current.toLowerCase().trim();
      let matchCount = 0;

      // Clear existing animations and searched IDs
      searchedPoolIdsRef.current.clear();

      [...poolNodesRef.current, ...pgNodesRef.current, ...osdNodesRef.current, ...hostNodesRef.current].forEach(node => {
         gsap.killTweensOf(node.scale);
         node.scale.set(1, 1, 1);
      });

      // Also clear animations on R3F Pool components
      poolRefs.forEach(ref => {
         if (ref.current && typeof ref.current === 'object' && 'scale' in ref.current) {
            const poolObject = ref.current as THREE.Object3D;
            gsap.killTweensOf(poolObject.scale);
            poolObject.scale.set(1, 1, 1);
         }
      });

      // Clear animations on R3F Host components
      hostRefs.forEach(ref => {
         if (ref.current && typeof ref.current === 'object' && 'scale' in ref.current) {
            const hostObject = ref.current as THREE.Object3D;
            gsap.killTweensOf(hostObject.scale);
            hostObject.scale.set(1, 1, 1);
         }
      });

      switch (searchTypeRef.current) {
         case 'pool':
            // Search R3F Pool components using poolRefs
            if (transformedTopologyData) {
               poolRefs.forEach((ref, index) => {
                  if (ref.current) {
                     const poolData = transformedTopologyData.pools[index];
                     const poolName = poolData.name?.toLowerCase() || '';
                     if (poolName.includes(query)) {
                        const poolObject = ref.current as THREE.Object3D;
                        // Store searched pool ID
                        searchedPoolIdsRef.current.add(poolData.id);
                        pulseNode(poolObject, poolData.id);
                        matchCount++;
                     }
                  }
               });
            }
            break;
         case 'pg':
            if (selectedPoolIdRef.current !== null && pgNodesRef.current.length > 0) {
               pgNodesRef.current.forEach(node => {
                  const pgId = node.userData.id;
                  const pgIdStr = String(pgId).toLowerCase();
                  if (pgIdStr.includes(query)) {
                     pulseNode(node);
                     matchCount++;
                  }
               });
            }
            break;
         case 'osd':
            // Return any previously floating searched OSDs to original position before new search
            // But skip OSDs that are selected by PG
            if (searchedOSDIdsRef.current.size > 0) {
               osdNodesRef.current.forEach(node => {
                  const osdId = node.userData.id;
                  const isSelectedByPG = node.userData.selected === true;

                  // Only return to original position if it was searched AND not selected by PG
                  if (searchedOSDIdsRef.current.has(osdId) && !isSelectedByPG) {
                     const currentY = node.position.y;
                     if (currentY > 10) {
                        // Return to original position
                        gsap.to(node.position, {
                           y: 0, // Original child position
                           duration: 0.5,
                           ease: 'power2.out',
                        });
                     }
                  }
               });
            }

            // Clear any existing searched OSD IDs
            searchedOSDIdsRef.current.clear();

            // If PG is selected, deselect it first but DON'T wait - just mark as deselected
            if (selectedPGIdRef.current !== null) {
               selectedPGIdRef.current = null; // Just deselect, don't run showOSDsForPG(null)
            }

            // First, identify which OSDs match the search
            const matchingOSDIds = new Set<number>();
            osdNodesRef.current.forEach(node => {
               const osdId = node.userData.id;
               const osdIdStr = String(osdId);
               const osdFullName = `osd.${osdIdStr}`;

               // Check if query matches OSD ID exactly or as part of full name
               // For numeric query, match exact ID. For "osd.X" format, match exactly
               const isExactIdMatch = osdIdStr === query;
               const isFullNameMatch = osdFullName.toLowerCase() === query.toLowerCase();
               const isOsdPrefixMatch = query.toLowerCase().startsWith('osd.') && osdFullName.toLowerCase() === query.toLowerCase();

               if (isExactIdMatch || isFullNameMatch || isOsdPrefixMatch) {
                  matchingOSDIds.add(osdId);
                  searchedOSDIdsRef.current.add(osdId);
                  matchCount++;
               }
            });

            // Now handle ONLY the matching OSDs - float them up
            osdNodesRef.current.forEach(node => {
               const osdId = node.userData.id;
               const isMatching = matchingOSDIds.has(osdId);

               if (isMatching) {
                  // Pulse animation for all matching OSDs
                  pulseNode(node);

                  // Check if this OSD is selected by PG
                  const isSelectedByPG = node.userData.selected === true;

                  // Only float the OSD if it's not already selected by PG
                  if (!isSelectedByPG) {
                     // Float the OSD by animating its child Y position (same as useFrame does)
                     const currentY = node.position.y;
                     if (currentY < 10) {
                        const targetY = currentY + 15; // Move up by 15 units from current position
                        gsap.to(node.position, {
                           y: targetY,
                           duration: 1.0,
                           ease: 'power2.out',
                        });
                     }
                  }
               }
               // DON'T touch non-matching OSDs - leave them exactly where they are
            });
            break;
         case 'host':
            // Search R3F Host components using hostRefs
            if (transformedTopologyData) {
               hostRefs.forEach((ref, index) => {
                  if (ref.current && typeof ref.current === 'object' && 'scale' in ref.current) {
                     const hostData = transformedTopologyData.hosts[index];
                     const hostName = hostData.name?.toLowerCase() || '';
                     if (hostName.includes(query)) {
                        const hostObject = ref.current as THREE.Object3D;
                        pulseNode(hostObject);
                        matchCount++;
                     }
                  }
               });
            }
            break;
      }
   };

   // 3D 텍스트 생성 함수
   const createLabel = (text: string, parent: THREE.Group, offsetY: number = 5, borderWidth: string = '20%'): Text => {
      const label = new Text();
      label.text = text;
      label.fontSize = 2;
      label.color = 0xffffff;
      label.anchorX = 'center';
      label.anchorY = 'bottom';
      label.position.set(0, offsetY, 0);
      label.outlineWidth = borderWidth;
      label.outlineColor = 0x000000;
      label.depthWrite = false;
      label.renderOrder = 999;
      label.material.side = THREE.DoubleSide;
      parent.add(label);
      label.sync();
      return label;
   };

   const closeInfo = () => {
      const shouldClearPGs = selectedObjectRef.current?.type === 'Pool';
      const isHost = selectedObjectRef.current?.type === 'Host';
      const isOSD = selectedObjectRef.current?.type === 'OSD';

      // useRef 사용 (React 리렌더링 없음)
      selectedObjectRef.current = null;

      // Clear host selection if it was a host
      if (isHost) {
         selectedHostIdRef.current = null;
         // Reset all host planes to cyan
         hostPlaneRefs.current.forEach(plane => {
            if (plane) {
               const material = plane.material as THREE.MeshPhysicalMaterial;
               material.color.set(Colors.cyan[400]);
               material.emissive.set(Colors.cyan[400]);
            }
         });
      }

      // Clear OSD selection if it was an OSD
      if (isOSD) {
         const osdId = selectedOSDIdRef.current;
         selectedOSDIdRef.current = null;

         // Find the OSD node and remove highlight
         if (osdId !== null) {
            const osdNode = osdNodesRef.current.find(node => node.userData.id === osdId);
            if (osdNode) {
               // Remove yellow highlight sphere
               const existingHighlight = osdNode.getObjectByName('yellowHighlight');
               if (existingHighlight) {
                  osdNode.remove(existingHighlight);
               }
               // Stop pulse animation
               gsap.killTweensOf(osdNode.scale);
               osdNode.scale.set(1, 1, 1);
            }
         }
      }

      // info-panel DOM 직접 숨김
      const infoPanelElement = document.querySelector('.info-panel') as HTMLElement;
      if (infoPanelElement) {
         infoPanelElement.style.display = 'none';
      }

      if (shouldClearPGs) {
         selectedPoolIdRef.current = null;
         // clearAllHighlights()
      }
   };

   useEffect(() => {
      let clockIntervalId: NodeJS.Timeout;

      const loadClock = () => {
         const canvas = document.getElementById('clock') as HTMLCanvasElement;
         if (!canvas) return;

         const ctx = canvas.getContext('2d')!;
         ctx.strokeStyle = '#00ffff';
         ctx.lineWidth = 6;
         ctx.shadowBlur = 8;
         ctx.shadowColor = '#00ffff';

         function degToRad(degree: number) {
            const factor = Math.PI / 180;
            return degree * factor;
         }

         function renderTime() {
            const now = new Date();
            const today = now.toLocaleDateString();
            const time = now.toLocaleTimeString();
            const hrs = now.getHours();
            const min = now.getMinutes();
            const sec = now.getSeconds();
            const mil = now.getMilliseconds();
            const smoothsec = sec + mil / 1000;
            const smoothmin = min + smoothsec / 60;

            const gradient = ctx.createRadialGradient(80, 80, 5, 80, 80, 75);
            gradient.addColorStop(0, '#03303a');
            gradient.addColorStop(1, 'black');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 160, 160);

            ctx.beginPath();
            ctx.arc(80, 80, 64, degToRad(270), degToRad(hrs * 30 - 90));
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(80, 80, 54.4, degToRad(270), degToRad(smoothmin * 6 - 90));
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(80, 80, 44.8, degToRad(270), degToRad(smoothsec * 6 - 90));
            ctx.stroke();

            ctx.font = '9px Helvetica';
            ctx.fillStyle = 'rgba(00, 255, 255, 1)';
            ctx.fillText(today, 56, 80);

            ctx.font = '10px Helvetica Bold';
            ctx.fillStyle = 'rgba(00, 255, 255, 1)';
            ctx.fillText(time, 56, 89.6);
         }

         clockIntervalId = setInterval(renderTime, 40);
      };

      loadClock();
      // Initialize raycaster and mouse for click handling
      raycasterRef.current = new THREE.Raycaster();
      mouseRef.current = new THREE.Vector2();

      // Cleanup function
      return () => {
         if (clockIntervalId) {
            clearInterval(clockIntervalId);
         }
         // Cleanup GSAP animations
         gsap.killTweensOf('*');
      };
   }, []);

   // PG 노드 생성
   const createPGNode = (pgData: any): THREE.Group => {
      const group = new THREE.Group();

      // IcosahedronGeometry with noise-based deformation
      const baseGeometry = new THREE.IcosahedronGeometry(2.5, 2);
      const geometry = baseGeometry.clone();

      // Apply noise-based deformation to vertices
      const positionAttribute = geometry.getAttribute('position');
      for (let i = 0; i < positionAttribute.count; i++) {
         const vertex = new THREE.Vector3();
         vertex.fromBufferAttribute(positionAttribute, i);

         // Apply noise-based displacement for organic look
         const noise = Math.sin(vertex.x * 0.8) * Math.cos(vertex.y * 0.8) * Math.sin(vertex.z * 0.8);
         vertex.normalize().multiplyScalar(2.5 + noise * 0.4);

         positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
      geometry.computeVertexNormals();

      // Hybrid material: MeshPhysicalMaterial as base
      let material;

      if (calculatePgState(pgData.state).status === 'healthy') {
         // Crystalline blue material for healthy PGs
         material = new THREE.MeshPhysicalMaterial({
            // color: 0x00d2ff,
            color: Colors.blue[300],
            metalness: 0.8,
            roughness: 0.2,
            transmission: 0.3,
            thickness: 0.5,
            envMapIntensity: 1,
            clearcoat: 1,
            clearcoatRoughness: 0,
            sheen: 1,
            sheenColor: new THREE.Color(0x00ffff),
            ior: 2.33, // Diamond-like refraction
            specularIntensity: 1,
            specularColor: new THREE.Color(0x00ffff),
            transparent: true,
            opacity: 0.95,
            // emissive: 0x0066aa,
            emissive: Colors.blue[600],
            emissiveIntensity: 0.3,
         });
      } else if (calculatePgState(pgData.state).status === 'warning') {
         // Golden warning material
         material = new THREE.MeshPhysicalMaterial({
            // color: 0xffaa00,
            color: Colors.amber[400],
            metalness: 0.9,
            roughness: 0.3,
            transmission: 0.2,
            thickness: 0.3,
            envMapIntensity: 0.8,
            clearcoat: 0.8,
            clearcoatRoughness: 0.1,
            sheen: 0.8,
            sheenColor: new THREE.Color(0xffcc00),
            ior: 1.8,
            specularIntensity: 0.8,
            specularColor: new THREE.Color(0xffcc00),
            transparent: true,
            opacity: 0.9,
            // emissive: 0x664400,
            emissive: Colors.amber[700],
            emissiveIntensity: 0.4,
         });
      } else {
         // Red error material with cracks
         material = new THREE.MeshPhysicalMaterial({
            // color: 0xff3333,
            color: Colors.red[400],
            metalness: 0.6,
            roughness: 0.5,
            transmission: 0.1,
            thickness: 0.2,
            envMapIntensity: 0.5,
            clearcoat: 0.5,
            clearcoatRoughness: 0.3,
            sheen: 0.5,
            sheenColor: new THREE.Color(0xff6666),
            ior: 1.5,
            specularIntensity: 0.5,
            specularColor: new THREE.Color(0xff6666),
            transparent: true,
            opacity: 0.85,
            emissive: 0x660000,
            emissiveIntensity: 0.5,
         });
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.userData.material = material; // Store reference for animation
      group.add(mesh);

      // 홀로그래픽 HUD 디스플레이 추가
      const createHolographicHUD = () => {
         const hudGroup = new THREE.Group();
         hudGroup.name = 'pg-holographic-hud';

         // 상태별 색상 설정
         const hudColor = pgData.state === 'active+clean' ? 0x00d2ff : pgData.state === 'degraded' ? 0xffaa00 : 0xff3333;

         // 메인 링 - 회전 애니메이션용
         const ringGeometry = new THREE.RingGeometry(3.5, 4.0, 64);
         const ringMaterial = new THREE.ShaderMaterial({
            uniforms: {
               time: { value: 0 },
               color: { value: new THREE.Color(hudColor) },
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
               uniform vec3 color;
               uniform float opacity;
               varying vec2 vUv;
               
               void main() {
                  float dist = distance(vUv, vec2(0.5));
                  float ring = smoothstep(0.45, 0.48, dist) - smoothstep(0.52, 0.55, dist);
                  
                  // 홀로그래픽 스캔라인
                  float scanline = sin(vUv.y * 30.0 + time * 4.0) * 0.5 + 0.5;
                  
                  // 에너지 펄스
                  float pulse = sin(time * 3.0) * 0.3 + 0.7;
                  
                  float alpha = ring * scanline * pulse * opacity;
                  gl_FragColor = vec4(color * (0.8 + scanline * 0.2), alpha);
               }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
         });

         const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
         ringMesh.rotation.x = -Math.PI / 2;
         ringMesh.position.y = 4;
         ringMesh.userData.material = ringMaterial;
         hudGroup.add(ringMesh);

         // 데이터 표시 패널들
         const panelCount = 3;
         for (let i = 0; i < panelCount; i++) {
            const angle = (i / panelCount) * Math.PI * 2;
            const radius = 3.5;

            const panelGeometry = new THREE.PlaneGeometry(1.0, 0.3);
            const panelMaterial = new THREE.ShaderMaterial({
               uniforms: {
                  time: { value: 0 },
                  progress: { value: 0.7 + Math.random() * 0.3 },
                  color: { value: new THREE.Color(hudColor) },
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
                  uniform float progress;
                  uniform vec3 color;
                  varying vec2 vUv;
                  
                  void main() {
                     // 프로그레스 바
                     float bar = step(vUv.x, progress);
                     
                     // 스캔라인 효과
                     float scanline = sin(vUv.x * 20.0 + time * 8.0) * 0.3 + 0.7;
                     
                     float alpha = bar * scanline * 0.9;
                     gl_FragColor = vec4(color * scanline, alpha);
                  }
               `,
               transparent: true,
               side: THREE.DoubleSide,
            });

            const panelMesh = new THREE.Mesh(panelGeometry, panelMaterial);
            panelMesh.position.set(Math.cos(angle) * radius, 3.8, Math.sin(angle) * radius);
            panelMesh.lookAt(0, 3.8, 0);
            panelMesh.userData.material = panelMaterial;
            hudGroup.add(panelMesh);
         }

         return hudGroup;
      };

      const hud = createHolographicHUD();
      group.add(hud);

      createLabel(pgData.id, group, 4, '8%');

      // 추가 효과: 에너지 필드 (건강한 PG만)
      if (pgData.state === 'active+clean') {
         const energyFieldGeometry = new THREE.SphereGeometry(3.2, 32, 32);
         const energyFieldMaterial = new THREE.ShaderMaterial({
            uniforms: {
               time: { value: 0 },
               color: { value: new THREE.Color(0x00d2ff) },
            },
            vertexShader: `
               varying vec3 vNormal;
               varying vec3 vPosition;
               void main() {
                  vNormal = normalize(normalMatrix * normal);
                  vPosition = position;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
               }
            `,
            fragmentShader: `
               uniform float time;
               uniform vec3 color;
               varying vec3 vNormal;
               varying vec3 vPosition;
               
               void main() {
                  vec3 normal = normalize(vNormal);
                  
                  // Fresnel effect
                  vec3 viewDirection = normalize(cameraPosition - vPosition);
                  float fresnel = pow(1.0 - abs(dot(normal, viewDirection)), 3.0);
                  
                  // Energy waves
                  float wave = sin(vPosition.x * 5.0 + time * 3.0) * 
                              sin(vPosition.y * 5.0 + time * 2.0) * 
                              sin(vPosition.z * 5.0 + time * 4.0);
                  
                  float alpha = fresnel * (0.3 + wave * 0.2);
                  gl_FragColor = vec4(color, alpha);
               }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false,
         });

         const energyField = new THREE.Mesh(energyFieldGeometry, energyFieldMaterial);
         energyField.name = 'energy-field';
         energyField.userData.material = energyFieldMaterial;
         group.add(energyField);
      }

      // 건강하지 않은 PG에 경고 효과
      if (pgData.state !== 'active+clean') {
         const ringGeometry = new THREE.RingGeometry(3.1, 3.5, 64, 1, 0, Math.PI * 2);
         const ringMaterial = new THREE.ShaderMaterial({
            uniforms: {
               time: { value: 0 },
               color: { value: new THREE.Color(pgData.state === 'degraded' ? 0xffaa00 : 0xff3333) },
               innerRadius: { value: 0.59 },
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
          uniform vec3 color;
          uniform float innerRadius;
          varying vec2 vUv;
          void main() {
            vec2 center = vec2(0.5, 0.5);
            float dist = distance(vUv, center);
            float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
            float pattern = sin(angle * 6.0 + time * 3.0) * 0.5 + 0.5;
            float glow = 1.0 - smoothstep(0.0, 0.02, abs(dist - 0.5));
            vec3 finalColor = color * (0.6 + pattern * 0.4);
            float alpha = glow * (0.4 + pattern * 0.4);
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            depthWrite: true,
         });
         const ring = new THREE.Mesh(ringGeometry, ringMaterial);
         ring.name = 'health-ring';
         ring.position.set(0, 0, 0);
         ring.userData.material = ringMaterial;
         group.add(ring);
      }

      group.userData = { ...pgData, type: 'PG' };
      group.frustumCulled = false;
      return group;
   };

   // OSD 노드 생성
   const createOSDNode = (osdData: any): THREE.Group => {
      const group = new THREE.Group();

      // Use IcosahedronGeometry with noise-based deformation
      const baseGeometry = new THREE.IcosahedronGeometry(3, 2);
      const geometry = baseGeometry.clone();

      // Apply noise-based deformation to vertices
      const positionAttribute = geometry.getAttribute('position');
      for (let i = 0; i < positionAttribute.count; i++) {
         const vertex = new THREE.Vector3();
         vertex.fromBufferAttribute(positionAttribute, i);

         // Apply noise-based displacement
         const noise = Math.sin(vertex.x * 0.5) * Math.cos(vertex.y * 0.5) * Math.sin(vertex.z * 0.5);
         vertex.normalize().multiplyScalar(3 + noise * 0.3);

         positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
      geometry.computeVertexNormals();

      // 조명 문제 해결을 위해 임시로 기본 재질 사용
      let material2;
      if (osdData.status !== 'up' || osdData.health !== 'healthy') {
         if (osdData.status === 'down' || osdData.health === 'error') {
            material2 = new THREE.MeshPhongMaterial({
               color: 0xdc2626,
               shininess: 250,
               specular: 0xdc2626,
               transparent: true,
               opacity: 0.9,
               emissive: 0x441111,
               emissiveIntensity: 0.3,
            });
         } else {
            material2 = new THREE.MeshPhongMaterial({
               color: 0xfde047,
               shininess: 250,
               specular: 0xfde047,
               transparent: true,
               opacity: 0.9,
               emissive: 0x444411,
               emissiveIntensity: 0.3,
            });
         }
      } else {
         // 건강한 OSD - 발광 효과가 있는 재질
         material2 = new THREE.MeshPhongMaterial({
            color: 0x00d2ff,
            shininess: 250,
            specular: 0x00d2ff,
            transparent: true,
            opacity: 0.9,
            emissive: 0x003366,
            emissiveIntensity: 0.5,
         });
      }

      const box = new THREE.Mesh(geometry, material2);
      box.castShadow = false;
      box.receiveShadow = false;
      box.userData.material = material2; // Store reference for animation updates
      group.add(box);

      // 건강한 OSD에 사이버 글로우 효과 추가
      if (osdData.status === 'up' && osdData.health === 'healthy') {
         // 내부 글로우
         const innerGlowGeometry = new THREE.SphereGeometry(3.4, 16, 16);
         const innerGlowMaterial = new THREE.ShaderMaterial({
            uniforms: {
               time: { value: 0 },
               glowColor: { value: new THREE.Color(0x0080ff) },
               glowIntensity: { value: 3.0 },
               pulseSpeed: { value: 2.0 },
            },
            vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            vNormal = normalMatrix * normal;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
            fragmentShader: `
          uniform vec3 glowColor;
          uniform float glowIntensity;
          uniform float time;
          uniform float pulseSpeed;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);
            float intensity = pow(1.0 - abs(dot(normal, viewDir)), 3.0);
            float pulse = sin(time * pulseSpeed) * 0.15 + 0.85;
            vec3 glow = glowColor * intensity * glowIntensity * pulse;
            float alpha = intensity * 0.8 * pulse;
            gl_FragColor = vec4(glow, alpha);
          }
        `,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false,
         });
         const innerGlowMesh = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
         innerGlowMesh.name = 'inner-glow-effect';
         innerGlowMesh.userData.material = innerGlowMaterial;
         group.add(innerGlowMesh);

         // 외부 글로우
         const outerGlowGeometry = new THREE.SphereGeometry(4, 16, 16);
         const outerGlowMaterial = new THREE.ShaderMaterial({
            uniforms: {
               time: { value: 0 },
               glowColor: { value: new THREE.Color(0x60a5fa) },
               glowIntensity: { value: 1.5 },
               pulseSpeed: { value: 2.0 },
            },
            vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            vNormal = normalMatrix * normal;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
            fragmentShader: `
          uniform vec3 glowColor;
          uniform float glowIntensity;
          uniform float time;
          uniform float pulseSpeed;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);
            float intensity = pow(1.0 - abs(dot(normal, viewDir)), 2.0);
            float pulse = sin(time * pulseSpeed + 0.5) * 0.2 + 0.8;
            vec3 glow = glowColor * intensity * glowIntensity * pulse;
            float alpha = intensity * 0.4 * pulse;
            gl_FragColor = vec4(glow, alpha);
          }
        `,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false,
         });
         const outerGlowMesh = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
         outerGlowMesh.name = 'outer-glow-effect';
         outerGlowMesh.userData.material = outerGlowMaterial;
         group.add(outerGlowMesh);
      }

      // Holographic HUD display for all OSDs
      const createHolographicHUD = () => {
         const hudGroup = new THREE.Group();
         hudGroup.name = 'holographic-hud';

         // HUD Ring
         const ringGeometry = new THREE.RingGeometry(4.5, 5.5, 32);
         const ringMaterial = new THREE.ShaderMaterial({
            uniforms: {
               time: { value: 0 },
               color: {
                  value: new THREE.Color(
                     osdData.status === 'up' && osdData.health === 'healthy'
                        ? 0x00d2ff
                        : osdData.status === 'down' || osdData.health === 'error'
                          ? 0xdc2626
                          : 0xfde047,
                  ),
               },
               opacity: { value: 0.6 },
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
               uniform vec3 color;
               uniform float opacity;
               varying vec2 vUv;
               
               void main() {
                  float dist = distance(vUv, vec2(0.5));
                  float ring = smoothstep(0.4, 0.45, dist) - smoothstep(0.55, 0.6, dist);
                  
                  float scanline = sin(vUv.y * 20.0 + time * 3.0) * 0.5 + 0.5;
                  float pulse = sin(time * 2.0) * 0.3 + 0.7;
                  
                  float alpha = ring * scanline * pulse * opacity;
                  gl_FragColor = vec4(color, alpha);
               }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
         });

         const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
         ringMesh.rotation.x = -Math.PI / 2;
         ringMesh.position.y = 6;
         ringMesh.userData.material = ringMaterial;
         hudGroup.add(ringMesh);

         // Status indicator bars with state-based colors
         const statusColor =
            osdData.status === 'up' && osdData.health === 'healthy' ? 0x00ff88 : osdData.status === 'down' || osdData.health === 'error' ? 0xff4444 : 0xffaa00;

         for (let i = 0; i < 4; i++) {
            const barGeometry = new THREE.PlaneGeometry(0.8, 0.1);
            const barMaterial = new THREE.ShaderMaterial({
               uniforms: {
                  time: { value: 0 },
                  progress: { value: Math.random() * 0.6 + 0.4 }, // 40-100% progress
                  color: { value: new THREE.Color(statusColor) },
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
                  uniform float progress;
                  uniform vec3 color;
                  varying vec2 vUv;
                  
                  void main() {
                     float bar = step(vUv.x, progress);
                     float scanline = sin(vUv.x * 10.0 + time * 5.0) * 0.2 + 0.8;
                     float alpha = bar * scanline * 0.8;
                     gl_FragColor = vec4(color * scanline, alpha);
                  }
               `,
               transparent: true,
               side: THREE.DoubleSide,
            });

            const barMesh = new THREE.Mesh(barGeometry, barMaterial);
            barMesh.position.set(-2, 5.5 + i * 0.3, 0);
            barMesh.userData.material = barMaterial;
            hudGroup.add(barMesh);
         }

         return hudGroup;
      };

      const hud = createHolographicHUD();
      group.add(hud);

      // createLabel(`OSD.${osdData.id}`, group, 3, '4%');

      // 건강하지 않은 OSD에 테두리 추가
      if (osdData.status !== 'up' || osdData.health !== 'healthy') {
         const ringGeometry = new THREE.RingGeometry(3.5, 4.0, 48, 1, 0, Math.PI * 2);
         let borderColor = 0xffaa00;
         if (osdData.status === 'down' || osdData.health === 'error') {
            borderColor = 0xff3333;
         }
         const ringMaterial = new THREE.MeshBasicMaterial({
            color: borderColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
         });
         const ring = new THREE.Mesh(ringGeometry, ringMaterial);
         ring.name = 'health-ring';
         ring.position.set(0, 0, 0);
         ring.userData.material = ringMaterial;
         group.add(ring);
      }

      group.userData = { ...osdData, type: 'OSD' };
      group.frustumCulled = false;
      return group;
   };

   // Create shooting star effect from PG to OSD with particle trail
   const createShootingStar = (startPos: THREE.Vector3, endPos: THREE.Vector3, duration: number): THREE.Group => {
      const shootingStarGroup = new THREE.Group();

      // Create main sphere (shooting star body) - smaller size
      const sphereGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const sphereMaterial = new THREE.MeshBasicMaterial({
         color: 0x00ffff,
         transparent: true,
         opacity: 1.0,
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

      // Add glow effect around the main sphere
      const glowGeometry = new THREE.SphereGeometry(0.5, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
         color: 0x00ffff,
         transparent: true,
         opacity: 0.4,
         side: THREE.BackSide,
      });
      const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
      sphere.add(glowSphere);

      // Create enhanced particle trail system
      const trailCount = 40; // Longer trail with more particles
      const trailGeometry = new THREE.BufferGeometry();
      const trailPositions = new Float32Array(trailCount * 3);
      const trailAlphas = new Float32Array(trailCount);
      const trailSizes = new Float32Array(trailCount);

      // Initialize trail positions
      for (let i = 0; i < trailCount; i++) {
         trailPositions[i * 3] = startPos.x;
         trailPositions[i * 3 + 1] = startPos.y;
         trailPositions[i * 3 + 2] = startPos.z;
         trailAlphas[i] = 0;
         trailSizes[i] = 0;
      }

      trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      trailGeometry.setAttribute('alpha', new THREE.BufferAttribute(trailAlphas, 1));
      trailGeometry.setAttribute('size', new THREE.BufferAttribute(trailSizes, 1));

      // Custom shader material for trail particles - fixed size
      const trailMaterial = new THREE.ShaderMaterial({
         transparent: true,
         depthWrite: false,
         blending: THREE.AdditiveBlending,
         uniforms: {
            uColor: { value: new THREE.Color(0x00ffff) },
         },
         vertexShader: `
            attribute float alpha;
            attribute float size;
            varying float vAlpha;
            void main() {
               vAlpha = alpha;
               vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
               // Fixed size calculation for consistent trail appearance
               gl_PointSize = size;
               gl_Position = projectionMatrix * mvPosition;
            }
         `,
         fragmentShader: `
            varying float vAlpha;
            uniform vec3 uColor;
            void main() {
               float d = length(gl_PointCoord - vec2(0.5));
               if (d > 0.5) discard;
               // Softer gradient for more connected appearance
               float soft = 1.0 - smoothstep(0.1, 0.5, d);
               gl_FragColor = vec4(uColor, vAlpha * soft);
            }
         `,
      });

      const trail = new THREE.Points(trailGeometry, trailMaterial);

      // Add components to group - trail is child of group
      shootingStarGroup.add(sphere);
      shootingStarGroup.add(trail);

      // Set initial position
      shootingStarGroup.position.copy(startPos);

      // Trail history for smooth effect
      const trailHistory: THREE.Vector3[] = [];

      // Animate shooting star movement with enhanced trail
      gsap.to(shootingStarGroup.position, {
         x: endPos.x,
         y: endPos.y,
         z: endPos.z,
         duration: duration,
         ease: 'power2.out',
         onUpdate: function () {
            // Get current world position of the shooting star
            const currentWorldPos = new THREE.Vector3();
            sphere.getWorldPosition(currentWorldPos);

            // Add to trail history
            trailHistory.push(currentWorldPos.clone());
            if (trailHistory.length > trailCount) {
               trailHistory.shift();
            }

            // Update trail particles every frame
            const positions = trailGeometry.attributes.position.array as Float32Array;
            const alphas = trailGeometry.attributes.alpha.array as Float32Array;
            const sizes = trailGeometry.attributes.size.array as Float32Array;

            for (let i = 0; i < trailCount; i++) {
               if (i < trailHistory.length) {
                  const historyIndex = trailHistory.length - 1 - i;
                  const pos = trailHistory[historyIndex];

                  // Set positions relative to parent group (subtract group position)
                  positions[i * 3] = pos.x - shootingStarGroup.position.x;
                  positions[i * 3 + 1] = pos.y - shootingStarGroup.position.y;
                  positions[i * 3 + 2] = pos.z - shootingStarGroup.position.z;

                  // More gradual fade for connected appearance
                  const age = i / trailCount;
                  const fadeCurve = Math.pow(1.0 - age, 2.0); // Stronger fade
                  alphas[i] = fadeCurve * 0.7;

                  // Much smaller size for tail particles
                  sizes[i] = fadeCurve * 3 + 0.5; // Size from 3.5 to 0.5
               } else {
                  alphas[i] = 0;
                  sizes[i] = 0;
               }
            }

            trailGeometry.attributes.position.needsUpdate = true;
            trailGeometry.attributes.alpha.needsUpdate = true;
            trailGeometry.attributes.size.needsUpdate = true;
         },
         onComplete: () => {
            // Fade out effect before removal
            gsap.to([sphereMaterial, glowMaterial], {
               opacity: 0,
               duration: 0.3,
               onComplete: () => {
                  // Remove shooting star when animation completes
                  if (sceneRef.current) {
                     sceneRef.current.remove(shootingStarGroup);
                  }
                  // Dispose of geometries and materials
                  sphereGeometry.dispose();
                  sphereMaterial.dispose();
                  glowGeometry.dispose();
                  glowMaterial.dispose();
                  trailGeometry.dispose();
                  trailMaterial.dispose();
               },
            });
         },
      });

      // Pulsing glow effect
      gsap.to(glowMaterial, {
         opacity: 0.6,
         duration: 0.3,
         repeat: -1,
         yoyo: true,
         ease: 'power2.inOut',
      });

      return shootingStarGroup;
   };

   // Host 노드 생성
   /*const createHostNode = (hostData: any, material: any): THREE.Group => {
      const group = new THREE.Group();
      const geometry = new THREE.BoxGeometry(35, 5, 35);
      const box = new THREE.Mesh(geometry, material);
      box.castShadow = true;
      box.receiveShadow = true;
      group.add(box);
      createLabel(hostData.name, group, 5);
      group.userData = { ...hostData, type: 'Host' };
      group.frustumCulled = false;
      return group;
   };*/

   // 트래픽 파티클 생성
   const createTrafficParticles = (from: THREE.Vector3, to: THREE.Vector3, color: number = 0x00d2ff): THREE.Group => {
      const particleGroup = new THREE.Group();
      const particleCount = 6;

      for (let i = 0; i < particleCount; i++) {
         const geometry = new THREE.SphereGeometry(0.3, 6, 6);
         const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.7,
         });

         const particle = new THREE.Mesh(geometry, material);
         const startPos = from.clone();
         const direction = to.clone().sub(from).normalize();
         startPos.add(direction.multiplyScalar(i * 2));
         particle.position.copy(startPos);

         const delay = i * 0.3;
         gsap.to(particle.position, {
            x: to.x,
            y: to.y,
            z: to.z,
            duration: Math.random() * (3 - 1) + 1,
            delay: delay,
            repeat: -1,
            ease: 'linear',
            modifiers: {
               x: (value: number) => Math.max(-200, Math.min(200, value)),
               y: (value: number) => Math.max(-100, Math.min(100, value)),
               z: (value: number) => Math.max(-200, Math.min(200, value)),
            },
         });

         particleGroup.add(particle);
      }

      particleGroup.frustumCulled = false;
      return particleGroup;
   };

   // 데이터 플로우 연결선 생성
   /*const createFlowConnection = (from: THREE.Vector3, to: THREE.Vector3, color: number = 0x00d2ff): THREE.Line => {
      const points = [from.clone(), to.clone()];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
         color: color,
         transparent: true,
         opacity: 0.9,
      });
      return new THREE.Line(geometry, material);
   };*/

   // 애니메이션이 있는 데이터 플로우 연결선 생성 (TubeGeometry 사용)
   const createAnimatedFlowConnection = (from: THREE.Vector3, to: THREE.Vector3, color: number = 0xff6600, lineWidth: number = 1): THREE.Mesh => {
      // Create a curve from the two points
      const curve = new THREE.CatmullRomCurve3([from.clone(), to.clone()]);

      // Create tube geometry with specified radius (lineWidth affects the radius)
      const tubeRadius = lineWidth * 0.02; // Convert lineWidth to appropriate radius
      const geometry = new THREE.TubeGeometry(
         curve,
         20, // tubular segments
         tubeRadius, // radius
         8, // radial segments
         false, // closed
      );

      const material = new THREE.MeshBasicMaterial({
         color: color,
         transparent: true,
         opacity: 0.8,
      });

      const tube = new THREE.Mesh(geometry, material);

      gsap.to(material, {
         opacity: 0.45,
         duration: 1,
         repeat: -1,
         yoyo: true,
         ease: 'power2.inOut',
      });

      return tube;
   };

   // Force-Directed Layout으로 PG들을 Pool 주위에 배치
   const positionPGsAroundPool = (pool: THREE.Group, pgs: any[]): THREE.Group[] => {
      const pgNodes: THREE.Group[] = [];
      const poolPos = pool.position;
      const targetY = poolPos.y - 25;

      const nodes = pgs.map(pgData => {
         const angle = Math.random() * Math.PI * 2;
         const radius = 15 + Math.random() * 20;

         return {
            pgData,
            position: new THREE.Vector3(poolPos.x + Math.cos(angle) * radius, targetY, poolPos.z + Math.sin(angle) * radius),
            velocity: new THREE.Vector3(0, 0, 0),
            force: new THREE.Vector3(0, 0, 0),
         };
      });

      // Force-Directed 시뮬레이션
      for (let iteration = 0; iteration < 50; iteration++) {
         nodes.forEach(node => {
            node.force.set(0, 0, 0);

            const toPool = poolPos.clone().sub(node.position);
            toPool.y = 0;
            const poolDistance = toPool.length();
            if (poolDistance > 0) {
               toPool.normalize().multiplyScalar(0.1);
               node.force.add(toPool);
            }

            nodes.forEach(otherNode => {
               if (otherNode !== node) {
                  const diff = node.position.clone().sub(otherNode.position);
                  diff.y = 0;
                  const distance = diff.length();
                  if (distance > 0 && distance < 12) {
                     diff.normalize().multiplyScalar(200 / (distance * distance));
                     node.force.add(diff);
                  }
               }
            });
         });

         nodes.forEach(node => {
            node.velocity.add(node.force.multiplyScalar(0.1));
            node.velocity.multiplyScalar(0.9);
            node.position.add(node.velocity);
            node.position.y = targetY;

            // Apply boundary constraint to keep PGs within Stars radius
            const maxRadius = 200;
            const distanceFromCenter = Math.sqrt(node.position.x * node.position.x + node.position.z * node.position.z);
            if (distanceFromCenter > maxRadius) {
               const scale = maxRadius / distanceFromCenter;
               node.position.x *= scale;
               node.position.z *= scale;
            }
         });
      }

      nodes.forEach(node => {
         const pgNode = createPGNode(node.pgData);
         pgNode.userData.poolId = pool.userData.id; // Add poolId for data flow reference
         pgNode.position.copy(node.position);
         pgNodes.push(pgNode);
         sceneRef.current!.add(pgNode);

         // Use pgNode.position to ensure connection aligns with actual PG position
         // Get actual pool world position from R3F ref if available
         let poolWorldPos: THREE.Vector3;
         const poolIndex = transformedTopologyData!.pools.findIndex(p => p.id === pool.userData.id);

         if (poolRefs && poolRefs[poolIndex] && poolRefs[poolIndex].current) {
            // Get actual world position from R3F pool ref
            const poolRef = poolRefs[poolIndex].current as THREE.Object3D;
            poolWorldPos = new THREE.Vector3();
            poolRef.getWorldPosition(poolWorldPos);
         } else {
            // Fallback: Calculate the correct pool position (spiral layout)
            const layoutManager = new AdaptiveLayoutManager();
            const allPools = transformedTopologyData!.pools.map((_, i) => ({ index: i }));
            const positions = layoutManager.applyLayout(allPools, 'spiral', { spacing: 25 });
            const correctPoolPos = positions[poolIndex].position;
            poolWorldPos = new THREE.Vector3(correctPoolPos[0], 40, correctPoolPos[2]);
         }

         // Use calculated spiral position (this should be the actual final position)
         const finalPoolPos = poolWorldPos;
         const connection = createAnimatedFlowConnection(finalPoolPos, pgNode.position, 0x94a3b8, 2);
         connection.userData = { type: 'pool-pg', pgId: node.pgData.id }; // Store PG ID for highlighting
         connection.visible = showPoolPGLinesRef.current; // Set initial visibility based on toggle
         connectionLinesRef.current.push(connection);
         sceneRef.current!.add(connection);

         // Pool-PG data flow removed for performance - only shown when PG is selected
      });

      return pgNodes;
   };

   // 나머지 함수들...
   const highlightNode = (node: THREE.Group): void => {
      if (node.userData.type !== 'PG' && node.userData.type !== 'OSD' && node.userData.type !== 'Host') {
         clearAllHighlights();
      } else {
         const hostNodes = hostRefs.map(ref => ref.current).filter(Boolean) as THREE.Group[];
         [...poolNodesRef.current, ...pgNodesRef.current, ...osdNodesRef.current, ...hostNodes].forEach(n => {
            if (n !== node) {
               gsap.killTweensOf(n.scale);
               n.scale.set(1, 1, 1);
               // Remove existing yellow highlight
               const existingHighlight = n.getObjectByName('yellowHighlight');
               if (existingHighlight) {
                  n.remove(existingHighlight);
               }
            }
         });

         // Reset host selection when selecting non-Host nodes
         if (node.userData.type !== 'Host') {
            // Clear selected host ID to turn off point lights
            selectedHostIdRef.current = null;
            // Reset plane colors to original cyan
            hostPlaneRefs.current.forEach(plane => {
               if (plane) {
                  const material = plane.material as THREE.MeshPhysicalMaterial;
                  material.color.set(Colors.cyan[400]);
                  material.emissive.set(Colors.cyan[400]);
               }
            });
         }
      }

      // Add yellow highlight for OSD selection (only for floating OSDs)
      if (node.userData.type === 'OSD') {
         // Check if OSD is floating (connected to PG and animated)
         const osdId = node.userData.id;
         const animData = osdAnimationDataRef.current.get(osdId);
         const isFloating = animData && (animData as any).isAnimating;

         // Add yellow highlight for all OSDs
         // Remove existing highlight first
         const existingHighlight = node.getObjectByName('yellowHighlight');
         if (existingHighlight) {
            node.remove(existingHighlight);
         }

         // Create yellow highlight sphere
         const highlightGeometry = new THREE.SphereGeometry(4, 32, 32);
         const highlightMaterial = new THREE.MeshStandardMaterial({
            color: 0xeab308,
            transparent: true,
            opacity: 0.4,
            side: THREE.BackSide,
            metalness: 0.1,
            roughness: 0.9,
            emissive: new THREE.Color(0xeab308),
            emissiveIntensity: 0.8,
            depthWrite: false,
         });
         const highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial);
         highlightMesh.name = 'yellowHighlight';
         node.add(highlightMesh);
      }

      // Handle Host selection
      if (node.userData.type === 'Host') {
         // Update selected host ID
         selectedHostIdRef.current = node.userData.name;

         // Find all OSDs belonging to this host
         const hostOSDs = transformedTopologyData?.osds?.filter((osd: any) => osd.host === node.userData.name) || [];

         // Get host data from userData (already stored when mesh was created)
         // hostData has a detail field that contains the actual HostDetail object
         const hostData = node.userData.hostData;

         // Update selected object with host info, detail, and its OSDs
         selectedObjectRef.current = {
            type: 'Host',
            name: node.userData.name,
            id: node.userData.id || node.userData.name,
            osds: hostOSDs,
            detail: hostData?.detail, // hostData.detail contains the HostDetail object
         };

         // First reset all host planes to cyan
         hostPlaneRefs.current.forEach(plane => {
            if (plane) {
               const material = plane.material as THREE.MeshPhysicalMaterial;
               material.color.set(Colors.cyan[400]);
               material.emissive.set(Colors.cyan[400]);
            }
         });

         // Then set selected host plane to pink
         const segmentIndex = node.userData.segmentIndex;
         if (segmentIndex !== undefined && hostPlaneRefs.current[segmentIndex]) {
            const material = hostPlaneRefs.current[segmentIndex].material as THREE.MeshPhysicalMaterial;
            material.color.set(Colors.pink[400]);
            material.emissive.set(Colors.pink[400]);
         }

         // Show info panel for Host
         const infoPanelElement = document.querySelector('.info-panel') as HTMLElement;
         const infoTitle = document.querySelector('#info-title');

         if (infoPanelElement && infoTitle) {
            infoTitle.textContent = `Host: ${node.userData.name}`;
            infoPanelElement.style.display = 'block';
         }
      }

      // Handle OSD selection toggle
      if (node.userData.type === 'OSD') {
         if (selectedOSDIdRef.current === node.userData.id) {
            // Deselect if same OSD is clicked again
            selectedOSDIdRef.current = null;
            // Remove yellow highlight
            const existingHighlight = node.getObjectByName('yellowHighlight');
            if (existingHighlight) {
               node.remove(existingHighlight);
            }
            // Stop pulse animation
            gsap.killTweensOf(node.scale);
            node.scale.set(1, 1, 1);
            // Clear selected object
            selectedObjectRef.current = null;
            // Close info panel
            const infoPanelElement = document.querySelector('.info-panel') as HTMLElement;
            if (infoPanelElement) {
               infoPanelElement.style.display = 'none';
            }
            return;
         } else {
            // Select new OSD
            selectedOSDIdRef.current = node.userData.id;
         }
      }

      // Skip pulse animation for Host nodes
      if (node.userData.type !== 'Host') {
         node.scale.set(0.8, 0.8, 0.8);
         gsap.to(node.scale, {
            x: 1.2,
            y: 1.2,
            z: 1.2,
            duration: 1,
            repeat: -1,
            yoyo: true,
            ease: 'power2.inOut',
         });
      }

      if (node.userData.type === 'Pool') {
         selectedPoolIdRef.current = node.userData.id;
         showPGsForPool(node.userData.id);
      }

      if (node.userData.type === 'PG') {
         // Handle PG selection
         if (selectedPGIdRef.current === node.userData.id) {
            // Deselect if same PG is clicked again
            selectedPGIdRef.current = null;
            selectedPGIdRef.current = null;
            showOSDsForPG(null); // Reset OSDs when deselecting
            removePoolPGDataFlow(); // Remove Pool-PG data flow
            resetPoolPGConnections(); // Reset connection line colors
         } else {
            // Reset previous PG's OSDs first, then select new PG
            showOSDsForPG(null); // Reset existing OSDs
            removePoolPGDataFlow(); // Remove existing Pool-PG data flow

            setTimeout(() => {
               // Select new PG after reset animation has started
               selectedPGIdRef.current = node.userData.id;

               // NEW: Get OSD IDs from PG data (already available in userData.acting)
               const osdIds = node.userData.acting || [];

               // Convert OSD IDs to osd data format for showOSDsForPG
               const osdData = osdIds.map((osdId: number) => ({ osd_id: osdId }));

               // Immediately start shooting stars with existing OSD data
               showOSDsForPG(node.userData, osdData);
               addPoolPGDataFlow(node.userData.id); // Add Pool-PG data flow for selected PG
               highlightPoolPGConnection(node.userData.id); // Highlight connection line

               // Show 1-second loading effect for visual feedback
               // fetchPGOSDs will add to loadingPGIds, triggering PGEnergyEffect
               fetchPGOSDs(node.userData.id)
                  .then(() => {
                     // Loading effect automatically removed after 1 second (handled in PGEnergyEffect)
                     console.log(`PG ${node.userData.id} OSD mapping confirmed`);
                  })
                  .catch(error => {
                     console.warn('PG OSD fetch warning (non-blocking):', error);
                  });
            }, 100); // Small delay to ensure reset starts first
         }

         if (cameraRef.current && cameraRef.current.position.y >= 0) {
            gsap.to(cameraRef.current.position, {
               x: 0,
               y: -20,
               z: 150,
               duration: 1.5,
               ease: 'power2.inOut',
            });
         }
      }
   };

   // Add Pool-PG data flow for selected PG only
   const addPoolPGDataFlow = (pgId: string): void => {
      if (!sceneRef.current || !transformedTopologyData) return;

      // Find the selected PG node
      const pgNode = sceneRef.current.children.find(node => node.userData?.type === 'PG' && node.userData?.id === pgId);

      if (!pgNode) {
         return;
      }

      // Find the pool position using poolRefs (similar to positionPGsAroundPool logic)
      const poolId = pgNode.userData.poolId;
      const poolIndex = transformedTopologyData.pools.findIndex(p => p.id === poolId);

      if (poolIndex === -1) {
         return;
      }

      let poolWorldPos: THREE.Vector3;

      if (poolRefs && poolRefs[poolIndex] && poolRefs[poolIndex].current) {
         // Get actual world position from R3F pool ref
         const poolRef = poolRefs[poolIndex].current as THREE.Object3D;
         poolWorldPos = new THREE.Vector3();
         poolRef.getWorldPosition(poolWorldPos);
      } else {
         // Fallback: Calculate the correct pool position (spiral layout)
         const layoutManager = new AdaptiveLayoutManager();
         const allPools = transformedTopologyData.pools.map((_, i) => ({ index: i }));
         const positions = layoutManager.applyLayout(allPools, 'spiral', { spacing: 25 });
         const correctPoolPos = positions[poolIndex].position;
         poolWorldPos = new THREE.Vector3(correctPoolPos[0], 40, correctPoolPos[2]);
      }

      // Create data flow particles
      const particles = createTrafficParticles(poolWorldPos, pgNode.position, 0x00d2ff);
      particles.userData = { type: 'pool-pg-selected', pgId: pgId };
      trafficParticlesRef.current.push(particles);
      sceneRef.current.add(particles);
   };

   // Remove Pool-PG data flow for deselected PG
   const removePoolPGDataFlow = (): void => {
      if (!sceneRef.current) return;

      // Remove existing Pool-PG data flow particles
      const particlesToRemove = trafficParticlesRef.current.filter(particles => particles.userData?.type === 'pool-pg-selected');

      particlesToRemove.forEach((particles: any) => {
         sceneRef.current!.remove(particles);
         if (particles.geometry) particles.geometry.dispose();
         if (particles.material) {
            if (Array.isArray(particles.material)) {
               particles.material.forEach((mat: any) => mat.dispose());
            } else {
               particles.material.dispose();
            }
         }
      });

      // Update the ref array
      trafficParticlesRef.current = trafficParticlesRef.current.filter(particles => particles.userData?.type !== 'pool-pg-selected');
   };

   // Highlight Pool-PG connection line for selected PG
   const highlightPoolPGConnection = (pgId: string): void => {
      // Reset all Pool-PG connections to default color first
      resetPoolPGConnections();

      // Find and highlight the connection for the selected PG
      const targetConnection = connectionLinesRef.current.find(line => line.userData?.type === 'pool-pg' && line.userData?.pgId === pgId);

      console.log('Highlighting Pool-PG connection for PG:', pgId);
      console.log('Found connection:', targetConnection);
      console.log(
         'All pool-pg connections:',
         connectionLinesRef.current.filter(line => line.userData?.type === 'pool-pg'),
      );

      if (targetConnection && targetConnection.material) {
         const material = targetConnection.material as THREE.MeshBasicMaterial;
         material.color.setHex(0x00ffff); // Cyan color (same as PG-OSD connection)
         material.needsUpdate = true;
         targetConnection.visible = true; // Always show selected PG's connection line
         console.log('Pool-PG connection highlighted to cyan and set to visible');
      }
   };

   // Reset all Pool-PG connections to default color
   const resetPoolPGConnections = (): void => {
      connectionLinesRef.current
         .filter(line => line.userData?.type === 'pool-pg')
         .forEach(line => {
            if (line.material) {
               const material = line.material as THREE.MeshBasicMaterial;
               material.color.setHex(0xe879f9); // Default Pool-PG color
               material.needsUpdate = true;
               // Reset visibility based on toggle (selected PG handled separately)
               if (line.userData?.pgId !== selectedPGIdRef.current) {
                  line.visible = showPoolPGLinesRef.current;
               }
            }
         });
   };

   const clearAllHighlights = (): void => {
      const hostNodes = hostRefs.map(ref => ref.current).filter(Boolean) as THREE.Group[];
      [...poolNodesRef.current, ...pgNodesRef.current, ...osdNodesRef.current, ...hostNodes].forEach(n => {
         gsap.killTweensOf(n.scale);
         n.scale.set(1, 1, 1);
         // Remove yellow highlight from OSD nodes
         const existingHighlight = n.getObjectByName('yellowHighlight');
         if (existingHighlight) {
            n.remove(existingHighlight);
         }
      });

      // Reset plane color to original cyan and clear selected host
      selectedHostIdRef.current = null;
      hostPlaneRefs.current.forEach(plane => {
         if (plane) {
            const material = plane.material as THREE.MeshPhysicalMaterial;
            material.color.set(Colors.cyan[400]);
            material.emissive.set(Colors.cyan[400]);
         }
      });

      // Remove PG nodes completely instead of hiding
      pgNodesRef.current.forEach(pg => {
         if (sceneRef.current) {
            sceneRef.current.remove(pg);
         }
         // Dispose of geometry and materials
         pg.traverse(child => {
            if (child instanceof THREE.Mesh) {
               if (child.geometry) child.geometry.dispose();
               if (child.material) {
                  if (Array.isArray(child.material)) {
                     child.material.forEach(material => material.dispose());
                  } else {
                     child.material.dispose();
                  }
               }
            }
         });
      });
      // Clear the PG nodes array
      pgNodesRef.current = [];

      // Hide connection lines and particles instead of disposing
      connectionLinesRef.current.forEach(line => {
         line.visible = false;
      });

      trafficParticlesRef.current.forEach(particles => {
         particles.visible = false;
      });

      // Reset all animated OSDs to their original state
      osdNodesRef.current.forEach(osd => {
         const osdId = osd.userData.id;
         const animData = osdAnimationDataRef.current.get(osdId);

         if (animData) {
            // Reset position
            if (animData.originalY !== undefined) {
               gsap.to(osd.position, {
                  y: 0,
                  duration: 1.5,
                  ease: 'power2.inOut',
               });
            }

            // Reset rotation
            if (animData.originalRotationY !== undefined) {
               gsap.to(osd.rotation, {
                  y: animData.originalRotationY,
                  duration: 1.5,
                  ease: 'power2.inOut',
               });
            }

            // Stop animations
            if (animData.rotationTween) {
               animData.rotationTween.kill();
               animData.rotationTween = null;
            }
            if (animData.opacityTween) {
               animData.opacityTween.kill();
               animData.opacityTween = null;
            }

            // Remove labels
            if (animData.label) {
               osd.remove(animData.label);
               animData.label.geometry?.dispose();
               animData.label.material?.dispose();
               animData.label = null;
            }

            // Reset opacity
            const mesh = osd.children.find(child => child.type === 'Mesh') as THREE.Mesh;
            if (mesh && mesh.material && animData.originalOpacity !== undefined) {
               const material = mesh.material as any;
               gsap.to(material, {
                  opacity: animData.originalOpacity,
                  duration: 1.5,
                  ease: 'power2.inOut',
                  onUpdate: () => {
                     material.needsUpdate = true;
                  },
               });
            }

            // Clear animation data
            osdAnimationDataRef.current.delete(osdId);
         }
      });

      // Reset pool selection and disable PG search
      selectedPoolIdRef.current = null;
      selectedPGIdRef.current = null;
      updatePgSearchOption(false);
   };

   const showOSDsForPG = (pgData: any, osdData?: any[]): void => {
      // Get the list of OSDs for the new PG (if any)
      // Use osdData if provided (from API), otherwise use generateOSDsForPG (fallback)
      const newOSDIds = pgData ? (osdData ? new Set(osdData.map(osd => osd.osd_id)) : new Set(generateOSDsForPG(pgData))) : new Set<number>();

      // Clean up existing PG-OSD connections
      const pgOsdConnections = connectionLinesRef.current.filter(line => line.userData?.type === 'pg-osd');
      pgOsdConnections.forEach(line => {
         sceneRef.current!.remove(line);
         line.geometry.dispose();
         (line.material as any).dispose();
      });
      connectionLinesRef.current = connectionLinesRef.current.filter(line => line.userData?.type !== 'pg-osd');

      const pgOsdTraffic = trafficParticlesRef.current.filter(particles => particles.userData?.type === 'pg-osd');
      pgOsdTraffic.forEach(particles => {
         sceneRef.current!.remove(particles);
         particles.traverse(child => {
            if ((child as any).geometry) (child as any).geometry.dispose();
            if ((child as any).material) (child as any).material.dispose();
         });
      });
      trafficParticlesRef.current = trafficParticlesRef.current.filter(particles => particles.userData?.type !== 'pg-osd');

      // Reset OSDs that are not part of the new PG selection
      osdNodesRef.current.forEach(osd => {
         const osdId = osd.userData.id;
         const animData = osdAnimationDataRef.current.get(osdId);

         // Only reset if OSD has animation data and is NOT part of new PG
         if (animData && !newOSDIds.has(osdId)) {
            // Reset position animation to original relative position (0)
            if (animData.originalY !== undefined) {
               gsap.to(osd.position, {
                  y: 0, // Reset to original relative position within parent group
                  duration: 1.5, // 0.5 * 3 = 1.5 seconds (1/3 speed)
                  ease: 'power2.inOut',
               });
            }

            // Reset scale to original size (1x)
            gsap.to(osd.scale, {
               x: 1,
               y: 1,
               z: 1,
               duration: 1.5, // Same duration as position reset
               ease: 'power2.inOut',
            });

            // Reset rotation to original angle
            if (animData.originalRotationY !== undefined) {
               gsap.to(osd.rotation, {
                  y: animData.originalRotationY, // Reset to original rotation angle
                  duration: 1.5, // 0.5 * 3 = 1.5 seconds (1/3 speed)
                  ease: 'power2.inOut',
               });
            }

            // Stop rotation animation
            if (animData.rotationTween) {
               animData.rotationTween.kill();
               animData.rotationTween = null;
            }

            // Stop opacity animation
            if (animData.opacityTween) {
               animData.opacityTween.kill();
               animData.opacityTween = null;
            }

            // Remove label if exists
            if (animData.label) {
               osd.remove(animData.label);
               animData.label.geometry?.dispose();
               animData.label.material?.dispose();
               animData.label = null;
            }

            // Reset material opacity to original value
            const mesh = osd.children.find(child => child.type === 'Mesh') as THREE.Mesh;
            if (mesh && mesh.material && animData.originalOpacity !== undefined) {
               const material = mesh.material as any;
               gsap.to(material, {
                  opacity: animData.originalOpacity,
                  duration: 1.5, // 0.5 * 3 = 1.5 seconds (1/3 speed)
                  ease: 'power2.inOut',
                  onUpdate: () => {
                     material.needsUpdate = true;
                  },
               });
            } else if (mesh && mesh.material) {
               // Fallback to default opacity if original was not stored
               const material = mesh.material as any;
               gsap.to(material, {
                  opacity: 0.9,
                  duration: 1.5,
                  ease: 'power2.inOut',
                  onUpdate: () => {
                     material.needsUpdate = true;
                  },
               });
            }

            // Clear the animation data from Map
            osdAnimationDataRef.current.delete(osdId);
         }
      });

      // Exit early if no PG is selected
      if (!pgData) {
         return;
      }

      const relatedOSDs = generateOSDsForPG(pgData);
      // Debug: Check which OSDs will be animated
      relatedOSDs.forEach(osdId => {
         const osdNode = osdNodesRef.current.find(osd => osd.userData.id === osdId);
      });

      const pgNode = pgNodesRef.current.find(pg => pg.userData.id === pgData.id);

      if (pgNode) {
         // Determine shooting star duration based on camera Y position
         const cameraY = cameraRef.current?.position.y || 0;
         const shootingStarDuration = cameraY >= 0 ? 3.0 : 1.5; // 3s if Y≥0, 1.5s if Y<0

         relatedOSDs.forEach(osdId => {
            const osdNode = osdNodesRef.current.find(osd => osd.userData.id === osdId);
            if (osdNode) {
               // Get or create animation data entry in Map
               let animData = osdAnimationDataRef.current.get(osdId);
               if (!animData) {
                  animData = {};
                  osdAnimationDataRef.current.set(osdId, animData);
               }

               // Store original Y position and rotation if not stored yet
               // Use worldY (parent group position) as the original Y position
               if (animData.originalY === undefined) {
                  animData.originalY = osdNode.userData.worldY || osdNode.position.y;
               }
               // Store original rotation angle if not stored yet
               if (animData.originalRotationY === undefined) {
                  animData.originalRotationY = osdNode.rotation.y;
               }

               // Check if OSD is already elevated
               const isAlreadyElevated = (animData as any).isAnimating === true;

               // Set animation flag
               (animData as any).isAnimating = true;

               // Get accurate world positions for both PG and OSD
               const pgPosition = new THREE.Vector3();
               const osdPosition = new THREE.Vector3();

               // Ensure we get fresh world positions
               pgNode.getWorldPosition(pgPosition);
               osdNode.getWorldPosition(osdPosition);

               // Create shooting star effect
               const shootingStar = createShootingStar(pgPosition, osdPosition, shootingStarDuration);
               sceneRef.current!.add(shootingStar);

               // Delay OSD animation until shooting star arrives
               setTimeout(() => {
                  // Only animate if not already elevated
                  const currentY = osdNode.position.y;
                  const targetY = isAlreadyElevated ? currentY : currentY + 10; // Don't move if already elevated
                  gsap.to(osdNode.position, {
                     y: targetY,
                     duration: 2.4, // 0.8 * 3 = 2.4 seconds (1/3 speed)
                     ease: 'power2.out',
                     onComplete: () => {
                        // Get updated position after animation completion
                        const osdPosition = new THREE.Vector3();
                        osdNode.getWorldPosition(osdPosition);

                        // Get fresh PG position to ensure accuracy
                        const freshPgPosition = new THREE.Vector3();
                        if (pgNode) {
                           pgNode.getWorldPosition(freshPgPosition);
                        }

                        // Create connection line with elevated position
                        const connection = createAnimatedFlowConnection(freshPgPosition, osdPosition, 0x00d2ff, 5);
                        connection.userData = { type: 'pg-osd' };
                        connectionLinesRef.current.push(connection);
                        sceneRef.current!.add(connection);

                        // Add data flow particles
                        setTimeout(() => {
                           const particles = createTrafficParticles(freshPgPosition, osdPosition, 0x00d2ff);
                           particles.userData = { type: 'pg-osd' };
                           trafficParticlesRef.current.push(particles);
                           sceneRef.current!.add(particles);
                        }, 500);

                        // Start opacity pulsing animation AFTER OSD has lifted up
                        const mesh = osdNode.children.find(child => child.type === 'Mesh') as THREE.Mesh;

                        const material = mesh.material as any; // Use any to avoid type issues

                        // Ensure material is transparent
                        material.transparent = true;
                        // Get animData again to ensure we have the latest reference
                        let currentAnimData = osdAnimationDataRef.current.get(osdId);
                        if (!currentAnimData) {
                           currentAnimData = {};
                           osdAnimationDataRef.current.set(osdId, currentAnimData);
                        }

                        if (!currentAnimData.opacityTween) {
                           // Store original opacity before starting animation
                           if (currentAnimData.originalOpacity === undefined) {
                              currentAnimData.originalOpacity = material.opacity;
                           }

                           // Reset material opacity to a consistent starting point for animation
                           material.opacity = 0.9;

                           // Kill any existing tween first
                           if (currentAnimData.opacityTween) {
                              currentAnimData.opacityTween.kill();
                           }

                           currentAnimData.opacityTween = gsap.to(material, {
                              opacity: 0.3,
                              duration: 1,
                              repeat: -1,
                              yoyo: true,
                              ease: 'power2.inOut',
                              onUpdate: () => {
                                 // Force material to update
                                 material.needsUpdate = true;
                                 material.transparent = true;
                                 // Force renderer to update
                                 if (mesh) {
                                    mesh.material = material;
                                 }
                              },
                              /*onRepeat: () => {
                              console.log(`🔄 OSD ${osdId} opacity animation repeating, current opacity: ${material.opacity}`);
                           },*/
                           });
                        }
                     },
                  });

                  // Animate OSD scale to 1.5x when lifting up
                  gsap.to(osdNode.scale, {
                     x: 1.5,
                     y: 1.5,
                     z: 1.5,
                     duration: 2.4, // Same duration as position animation
                     ease: 'power2.out',
                  });

                  // Add OSD label above the OSD and store in Map
                  /*const label = new Text();
               label.text = `OSD.${osdId}`;
               label.fontSize = 1.4;
               label.color = 0xffffff;
               label.anchorX = 'center';
               label.anchorY = 'middle';
               label.position.set(0, 4, 0); // 2 units above OSD
               label.sync();
               osdNode.add(label);
               animData.label = label;*/

                  // Add rotation animation and store in Map
                  animData.rotationTween = gsap.to(osdNode.rotation, {
                     y: osdNode.rotation.y + Math.PI * 2,
                     duration: 4,
                     repeat: -1,
                     ease: 'none',
                  });

                  // Backup: Start opacity animation after a delay as fallback
                  setTimeout(() => {
                     // Get the latest animData reference, create if doesn't exist
                     let currentAnimData = osdAnimationDataRef.current.get(osdId);
                     if (!currentAnimData) {
                        currentAnimData = {};
                        osdAnimationDataRef.current.set(osdId, currentAnimData);
                     }

                     const mesh = osdNode.children.find(child => child.type === 'Mesh') as THREE.Mesh;
                     if (!mesh || !mesh.material) return;

                     const material = mesh.material as any;

                     // Ensure material is transparent
                     material.transparent = true;

                     // Store original opacity before starting animation
                     if (currentAnimData.originalOpacity === undefined) {
                        currentAnimData.originalOpacity = material.opacity;
                     }

                     // Reset material opacity to a consistent starting point for animation
                     material.opacity = 0.9;

                     // Kill any existing tween first
                     if (currentAnimData.opacityTween) {
                        currentAnimData.opacityTween.kill();
                     }

                     // Start the pulsing animation
                     currentAnimData.opacityTween = gsap.to(material, {
                        opacity: 0.3,
                        duration: 1,
                        repeat: -1,
                        yoyo: true,
                        ease: 'power2.inOut',
                        onUpdate: () => {
                           material.needsUpdate = true;
                           material.transparent = true;
                           // Force renderer to update
                           if (mesh) {
                              mesh.material = material;
                           }
                        },
                        /*onRepeat: () => {
                        console.log(`🔄 Fallback OSD ${osdId} opacity animation repeating, current opacity: ${material.opacity}`);
                     },*/
                     });
                  }, 3000); // Start after 3 seconds (after OSD should have lifted up)
               }, shootingStarDuration * 1000); // Delay based on shooting star duration
            }
         });
      }
   };
   const showPGsForPool = (poolId: number, poolRefs?: RefObject<any>[]): void => {
      // Early return if no topology data
      if (!transformedTopologyData) return;

      // Reset OSDs when switching pools or clearing PGs
      showOSDsForPG(null);

      // Remove existing PG nodes completely instead of hiding them
      pgNodesRef.current.forEach(pg => {
         if (sceneRef.current) {
            sceneRef.current.remove(pg);
         }
         // Dispose of geometry and materials
         pg.traverse(child => {
            if (child instanceof THREE.Mesh) {
               if (child.geometry) child.geometry.dispose();
               if (child.material) {
                  if (Array.isArray(child.material)) {
                     child.material.forEach(material => material.dispose());
                  } else {
                     child.material.dispose();
                  }
               }
            }
         });
      });
      // Clear the PG nodes array
      pgNodesRef.current = [];

      // Hide existing connection lines instead of disposing
      connectionLinesRef.current.forEach(line => {
         line.visible = false;
      });

      // Hide existing traffic particles instead of disposing
      trafficParticlesRef.current.forEach(particles => {
         particles.visible = false;
      });

      const poolPGs = generatePGsForPool(poolId);
      // Try to find pool from scene objects since poolNodesRef might be empty
      let pool = poolNodesRef.current.find(p => p.userData.id === poolId);

      // If not found in poolNodesRef, create a temporary pool object for positioning
      if (!pool) {
         const poolData = transformedTopologyData.pools.find(p => p.id === poolId);
         if (poolData) {
            // Calculate pool position using same logic as PoolNode rendering
            const layoutManager = new AdaptiveLayoutManager();
            const allPools = transformedTopologyData.pools.map((p, i) => ({ index: i }));
            const positions = layoutManager.applyLayout(allPools, 'hierarchical', { spacing: 20 });
            const poolIndex = transformedTopologyData.pools.findIndex(p => p.id === poolId);
            const pos = positions[poolIndex].position;

            // Create temporary pool object
            pool = new THREE.Group();
            pool.position.set(pos[0], 40, pos[2]);
            pool.userData = { id: poolId, type: 'Pool' };
         }
      }

      if (pool) {
         const newPGNodes = positionPGsAroundPool(pool, poolPGs);
         pgNodesRef.current.push(...newPGNodes);
      }

      // Update PG search enabled state
      updatePgSearchOption(poolId !== null);
   };

   const generatePGsForPool = (poolId: number): any[] => {
      // Early return if no topology data
      if (!transformedTopologyData) return [];

      const pool = transformedTopologyData.pools.find(p => p.id === poolId);
      if (!pool) return [];

      // Use pre-generated PG data from the pool
      return pool.pgs || [];
   };

   const generateOSDsForPG = (pgData: any): number[] => {
      return pgData.acting || generateRandomOSDSet();
   };

   const generateRandomOSDSet = (): number[] => {
      // Early return if no topology data
      if (!transformedTopologyData) return [];

      // Group OSDs by host
      const osdsByHost: { [hostId: string]: number[] } = {};
      transformedTopologyData.osds.forEach(osd => {
         if (!osdsByHost[osd.host]) {
            osdsByHost[osd.host] = [];
         }
         osdsByHost[osd.host].push(osd.id);
      });

      // Select 1 random OSD from each host (3-5 hosts = 3-5 OSDs)
      const selectedOSDs: number[] = [];
      const hosts = Object.keys(osdsByHost);
      const numHostsToSelect = Math.min(Math.max(3, Math.floor(Math.random() * 3) + 3), hosts.length); // 3-5 hosts

      // Shuffle hosts and select random number of them
      const shuffledHosts = hosts.sort(() => 0.5 - Math.random());
      const selectedHosts = shuffledHosts.slice(0, numHostsToSelect);

      selectedHosts.forEach(hostId => {
         const hostOsds = osdsByHost[hostId];
         const randomOsdId = hostOsds[Math.floor(Math.random() * hostOsds.length)];
         selectedOSDs.push(randomOsdId);
      });

      return selectedOSDs;
   };

   // Animation loop moved to R3F useFrame - removed conflicting animate() function

   // 마우스 클릭 이벤트 핸들러
   const onMouseClick = (event: MouseEvent) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      mouseRef.current!.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current!.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current!.setFromCamera(mouseRef.current!, cameraRef.current!);
      const hostNodes = hostRefs.map(ref => ref.current).filter(Boolean) as THREE.Group[];
      const intersects = raycasterRef.current!.intersectObjects([...poolNodesRef.current, ...pgNodesRef.current, ...osdNodesRef.current, ...hostNodes], true);

      // Ctrl + 클릭 또는 Cmd + 클릭으로 빈 공간 클릭 시 모든 패널 토글
      if ((event.ctrlKey || event.metaKey) && intersects.length === 0) {
         toggleAllPanels();
         return;
      }

      if (intersects.length > 0) {
         const clickedObject = intersects[0].object.parent as THREE.Group;
         if (clickedObject.userData) {
            // Pool clicks are handled by R3F component, skip here
            if (clickedObject.userData.type === 'Pool') {
               return;
            }

            selectedObjectRef.current = {
               type: clickedObject.userData.type,
               name: clickedObject.userData.name || `${clickedObject.userData.type}.${clickedObject.userData.id}`,
               ...clickedObject.userData,
            };

            // Update info-panel for all node types
            const infoPanelElement = document.querySelector('.info-panel') as HTMLElement;
            const infoTitle = document.querySelector('#info-title');
            const infoContent = document.querySelector('#info-content');

            if (infoPanelElement && infoTitle && infoContent) {
               const nodeType = clickedObject.userData.type;
               const nodeData = clickedObject.userData;

               if (nodeType === 'PG') {
                  infoTitle.textContent = `PG: ${nodeData.id}`;
                  infoContent.innerHTML = `
                     <p>
                        <strong>PG ID:</strong> ${nodeData.id}<br/>
                        <strong>State:</strong> ${nodeData.state || 'N/A'}<br/>
                        <strong>Pool ID:</strong> ${nodeData.poolId || 'N/A'}<br/>
                        <strong>Pool Name:</strong> ${nodeData.poolName || 'N/A'}<br/>
                        <strong>Primary OSD:</strong> ${nodeData.primary !== undefined ? 'osd.' + nodeData.primary : 'N/A'}<br/>
                        <strong>Acting OSDs:</strong> ${nodeData.acting?.map((id: number) => 'osd.' + id).join(', ') || 'N/A'}<br/>
                        <strong>Objects:</strong> ${nodeData.objects?.toLocaleString() || 0}<br/>
                        <strong>Bytes:</strong> ${nodeData.bytes ? formatBytes(nodeData.bytes) : 'N/A'}<br/>
                        <strong>OSDs Count:</strong> ${nodeData.acting?.length || 0}
                     </p>
                  `;
               } else if (nodeType === 'OSD') {
                  // Get detailed OSD data from nodeData.detail (stored by transformTopologyData)
                  const osdDetail = nodeData.detail;

                  infoTitle.textContent = `OSD: ${nodeData.id}`;
                  infoContent.innerHTML = `
                     <p>
                        <strong>OSD ID:</strong> ${nodeData.id}<br/>
                        <strong>Status:</strong> ${osdDetail?.status?.state || nodeData.status || 'up'}<br/>
                        <strong>Health:</strong> ${nodeData.health || 'healthy'}<br/>
                        <strong>Host:</strong> ${nodeData.host || 'N/A'}<br/>
                        <strong>PG Count:</strong> ${osdDetail?.num_pgs || 0}<br/>
                        <strong>Utilization:</strong> ${nodeData.utilization || 0}%<br/>
                        <strong>Weight:</strong> ${osdDetail?.status?.weight?.toFixed(2) || '1.00'}<br/>
                        <strong>Reweight:</strong> ${osdDetail?.status?.reweight?.toFixed(2) || '1.00'}<br/>
                        <strong>Capacity:</strong> ${osdDetail?.capacity?.total_bytes ? formatBytes(osdDetail.capacity.total_bytes) : 'N/A'}<br/>
                        <strong>Used:</strong> ${osdDetail?.capacity?.used_bytes ? formatBytes(osdDetail.capacity.used_bytes) : 'N/A'}<br/>
                        <strong>Available:</strong> ${osdDetail?.capacity?.available_bytes ? formatBytes(osdDetail.capacity.available_bytes) : 'N/A'}<br/>
                        <strong>Device:</strong> ${osdDetail?.device?.path || 'N/A'} (${osdDetail?.device?.type || 'N/A'})<br/>
                        <strong>SMART Status:</strong> ${osdDetail?.smart?.health_status || 'N/A'}<br/>
                        <strong>Temperature:</strong> ${osdDetail?.smart?.temperature_celsius ? osdDetail.smart.temperature_celsius + '°C' : 'N/A'}<br/>
                        <strong>Public IP:</strong> ${osdDetail?.host_info?.publicIp || 'N/A'}<br/>
                        <strong>Cluster IP:</strong> ${osdDetail?.host_info?.clusterIp || 'N/A'}<br/>
                        <strong>Host Name:</strong> ${osdDetail?.host_info?.name || 'N/A'}
                     </p>
                  `;
               } else if (nodeType === 'Host') {
                  // Get host detail from nodeData.hostData.detail
                  const hostDetail = nodeData.hostData?.detail;

                  infoTitle.textContent = `Host: ${hostDetail?.hostname || nodeData.name || nodeData.id}`;
                  infoContent.innerHTML = `
                     <p>
                        <strong>Hostname:</strong> ${hostDetail?.hostname || nodeData.name || nodeData.id}<br/>
                        <strong>Address:</strong> ${hostDetail?.address || 'N/A'}<br/>
                        <strong>Public IP:</strong> ${hostDetail?.publicAddr || 'N/A'}<br/>
                        <strong>Cluster IP:</strong> ${hostDetail?.clusterAddr || 'N/A'}<br/>
                        <strong>Status:</strong> ${hostDetail?.status || nodeData.status || 'online'}<br/>
                        <strong>Labels:</strong> ${hostDetail?.labels?.join(', ') || 'None'}<br/>
                        <br/>
                        <strong>OSD Count:</strong> ${hostDetail?.osdIds?.length || nodeData.osds?.length || 0}<br/>
                        <strong>OSD IDs:</strong> ${hostDetail?.osdIds?.map((id: number) => `osd.${id}`).join(', ') || nodeData.osds?.map((o: any) => `osd.${o.id}`).join(', ') || 'N/A'}<br/>
                        <br/>
                        <strong>Host Capacity:</strong> ${hostDetail?.hostCapacity ? formatBytes(hostDetail.hostCapacity) : 'N/A'}<br/>
                        <strong>OSD Capacity:</strong> ${hostDetail?.totalCapacity ? formatBytes(hostDetail.totalCapacity) : formatBytes(nodeData.osds?.reduce((sum: number, osd: any) => sum + (osd.detail?.capacity?.total_bytes || 0), 0) || 0)}<br/>
                        <strong>OSD Used:</strong> ${hostDetail?.usedCapacity ? formatBytes(hostDetail.usedCapacity) : formatBytes(nodeData.osds?.reduce((sum: number, osd: any) => sum + (osd.detail?.capacity?.used_bytes || 0), 0) || 0)}<br/>
                        <strong>OSD Available:</strong> ${hostDetail?.availableCapacity ? formatBytes(hostDetail.availableCapacity) : formatBytes(nodeData.osds?.reduce((sum: number, osd: any) => sum + (osd.detail?.capacity?.available_bytes || 0), 0) || 0)}<br/>
                        <strong>Utilization:</strong> ${hostDetail?.usedPercent ? hostDetail.usedPercent.toFixed(2) + '%' : 'N/A'}<br/>
                        <br/>
                        <strong>CPU:</strong> ${hostDetail?.cpuModel || 'N/A'}<br/>
                        <strong>CPU Count:</strong> ${hostDetail?.cpuCount || 'N/A'}<br/>
                        <strong>Core Count:</strong> ${hostDetail?.coreCount || 'N/A'}<br/>
                        <strong>Memory:</strong> ${hostDetail?.memory ? formatBytes(hostDetail.memory) : 'N/A'}<br/>
                        <strong>NIC Count:</strong> ${hostDetail?.nicCount || 'N/A'}<br/>
                        <br/>
                        <strong>Model:</strong> ${hostDetail?.model || 'N/A'}<br/>
                        <strong>OS:</strong> ${hostDetail?.os || 'N/A'}<br/>
                        <strong>Kernel:</strong> ${hostDetail?.kernel || 'N/A'}<br/>
                        <strong>Ceph Version:</strong> ${hostDetail?.version || 'N/A'}
                     </p>
                  `;
               }

               infoPanelElement.style.display = 'block';
            }

            highlightNode(clickedObject);
         }
      }
   };

   // Duplicate loadClock function removed - Clock implementation moved to useEffect

   // 패널 컴포넌트들의 JSX
   return (
      <>
         <AppHeader />
         <div className={`topology-container bg-neutral-900`}>
            <Canvas
               ref={canvasRef}
               camera={{ position: [0, 360, 0], fov: 60, near: 0.1, far: 2000 }}
               dpr={[1, 1.5]}
               gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
               shadows={false}
               style={{ background: Colors.neutral[900] }}
               className="topology-canvas"
               onPointerDown={event => {
                  // Convert R3F PointerEvent to native MouseEvent for existing handler
                  const nativeEvent = event.nativeEvent as MouseEvent;
                  onMouseClick(nativeEvent);
               }}
            >
               <ClusterTopologyScene
                  selectedObjectRef={selectedObjectRef}
                  selectedPoolIdRef={selectedPoolIdRef}
                  searchedPoolIdsRef={searchedPoolIdsRef}
                  loadingRef={loadingRef}
                  texturesRef={texturesRef}
                  cameraRef={cameraRef}
                  showPGsForPool={showPGsForPool}
                  clearAllHighlights={clearAllHighlights}
                  sceneRef={sceneRef}
                  poolRefs={poolRefs}
                  hostRefs={hostRefs}
                  hostPlaneRefs={hostPlaneRefs}
                  selectedHostIdRef={selectedHostIdRef}
                  osdNodesRef={osdNodesRef}
                  poolNodesRef={poolNodesRef}
                  pgNodesRef={pgNodesRef}
                  trafficParticlesRef={trafficParticlesRef}
                  selectedPGIdRef={selectedPGIdRef}
                  osdAnimationDataRef={osdAnimationDataRef}
                  searchedOSDIdsRef={searchedOSDIdsRef}
                  searchIngRef={searchIngRef}
                  updatePgSearchOption={updatePgSearchOption}
                  highlightNode={highlightNode}
                  toggleAllPanels={toggleAllPanels}
                  topologyData={transformedTopologyData}
                  loadingPGIds={loadingPGIds}
                  isLoadingTopology={isLoadingTopology}
               />
               <Environment files="/3d/background/darkcenter.jpg" />
               {/* EffectComposer -> 성능을 고려하여 체감 비용 줄이기 : multisampling={0} resolutionScale={0.8} (80% 스케일 렌더링) */}
               <EffectComposer multisampling={0} resolutionScale={0.8}>
                  {/* mipmapBlur 키면 화면 깜빡임 생겨서 false 로 함 */}
                  <Bloom mipmapBlur={false} luminanceThreshold={0.7} intensity={0.35} radius={0.4} />
                  <BrightnessContrast brightness={0} contrast={0.2} />
               </EffectComposer>
            </Canvas>

            {/* Search Panel with Slide Animation */}
            {/* 항상 렌더링, CSS display로 제어 */}
            <div className="search-panel top-[74px] -translate-x-full" style={{ display: 'none' }}>
               <div className={'search-header'}>
                  <button onClick={toggleSearchPanel} className={'search-collapse-btn'}>
                     <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 8L10 4L10 12L6 8Z" fill="currentColor" />
                     </svg>
                  </button>
                  <div className={'search-title'}>
                     <span className={'search-indicator'}></span>
                     <span>NODE SEARCH</span>
                  </div>
               </div>
               <div className={'search-content'}>
                  <div className={'search-controls'}>
                     <div className={'search-select-container'}>
                        <select
                           defaultValue={searchTypeRef.current}
                           className={'search-select'}
                           onChange={e => {
                              searchTypeRef.current = e.target.value as 'pool' | 'host' | 'pg';
                              clearSearch();
                           }}
                        >
                           <option value="pool">Pool</option>
                           <option value="pg" disabled={true}>
                              PG
                           </option>
                           <option value="osd">OSD</option>
                           <option value="host">Host</option>
                        </select>
                        <button onClick={handleClearButton} className={'search-clear-btn'} title="Clear selection">
                           <TrashIcon color={Colors.teal[500]} />
                        </button>
                     </div>
                     <div className={'search-field-container'}>
                        <input
                           defaultValue={searchQueryRef.current}
                           onChange={e => {
                              searchQueryRef.current = e.target.value;
                              searchIngRef.current = false;
                              (document.querySelector('.search-panel') as HTMLElement).setAttribute('ing', '0');
                           }}
                           onKeyUp={e => e.key === 'Enter' && performSearch()}
                           type="text"
                           className={'search-field'}
                           placeholder={getSearchPlaceholder()}
                        />
                        <button onClick={performSearch} className={'search-btn'}>
                           <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
                              <path d="m10 10 2 2" stroke="currentColor" strokeWidth="1.5" />
                           </svg>
                        </button>
                     </div>
                     {/* Pool-PG Connection Lines Toggle */}
                     <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                           type="checkbox"
                           id="pool-pg-lines-toggle"
                           defaultChecked={showPoolPGLinesRef.current}
                           onChange={e => {
                              showPoolPGLinesRef.current = e.target.checked;
                              // Update visibility of all pool-pg connection lines
                              connectionLinesRef.current
                                 .filter(line => line.userData?.type === 'pool-pg')
                                 .forEach(line => {
                                    // Always show selected PG's connection line
                                    if (line.userData?.pgId === selectedPGIdRef.current) {
                                       line.visible = true;
                                    } else {
                                       line.visible = showPoolPGLinesRef.current;
                                    }
                                 });
                           }}
                           style={{
                              width: '16px',
                              height: '16px',
                              cursor: 'pointer',
                              accentColor: '#00d2ff',
                           }}
                        />
                        <label
                           htmlFor="pool-pg-lines-toggle"
                           style={{
                              fontSize: '11px',
                              color: 'rgba(0, 210, 255, 0.8)',
                              cursor: 'pointer',
                              userSelect: 'none',
                           }}
                        >
                           Show Pool-PG Connections
                        </label>
                     </div>
                  </div>
               </div>
            </div>

            {/* Search expand button - DOM 직접 제어 */}
            <button onClick={toggleSearchPanel} className="search-expand-btn top-[74px]" style={{ transform: 'translateX(0px)', opacity: 1 }}>
               <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
                  <path d="m10 10 2 2" stroke="currentColor" strokeWidth="1.5" />
               </svg>
            </button>

            {/* Top Panel 구현 */}
            {/* 상단 중앙 패널 - Cluster Overview */}
            {/* 항상 렌더링, CSS display로 제어 */}
            <div className="spaceship-panel panel-top top-[74px]" style={{ display: 'none' }}>
               <div className="panel-header flex justify-between items-center">
                  <div className="panel-title">
                     <span className="title-indicator"></span>
                     <span>CLUSTER COMMAND CENTER</span>
                  </div>
                  <div>
                     <button onClick={handleToggleFullscreen} className="panel-fullscreen-btn">
                        {!isFullscreenRef.current ? (
                           <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M3 7V3h4M17 7V3h-4M3 13v4h4M17 13v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                           </svg>
                        ) : (
                           <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M7 3v4H3M13 3v4h4M7 17v-4H3M13 17v-4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                           </svg>
                        )}
                     </button>
                  </div>
               </div>
               <SimpleBar autoHide style={{ height: '164px' }}>
                  <div className="panel-content">
                     <div className="asymmetric-layout">
                        <div className="main-control-panel">
                           <div className="control-header">
                              <div className="status-icon">
                                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" />
                                 </svg>
                              </div>
                              <div className="control-info">
                                 <div className="control-title">SYSTEM HEALTH</div>
                                 <div className={`control-status status-${mockData.cluster.health}`}>{mockData.cluster.health}</div>
                              </div>
                           </div>
                           <div className="health-gauge">
                              <div className="gauge-container">
                                 <div className="gauge-fill" style={{ width: `${mockData.cluster.healthScore}%` }}></div>
                                 <div className="gauge-value">{mockData.cluster.healthScore}%</div>
                              </div>
                           </div>
                           <div className="capacity-display">
                              <div className="capacity-label">STORAGE</div>
                              <div className="capacity-bar">
                                 <div className="capacity-fill" style={{ width: `${mockData.cluster.capacity.usedPercent}%` }}></div>
                              </div>
                              <div className="capacity-text">
                                 {mockData.cluster.capacity.used} / {mockData.cluster.capacity.total}
                              </div>
                           </div>
                        </div>

                        <div className="toggle-section">
                           <div className="toggle-card">
                              <div className="toggle-label">AUTO HEALING</div>
                              <div className={`toggle-switch ${mockData.switches.autoHealing ? 'active' : ''}`}>
                                 <div className="toggle-slider"></div>
                              </div>
                           </div>
                           <div className="toggle-card">
                              <div className="toggle-label">MONITORING</div>
                              <div className={`toggle-switch ${mockData.switches.monitoring ? 'active' : ''}`}>
                                 <div className="toggle-slider"></div>
                              </div>
                           </div>
                           <div className="toggle-card">
                              <div className="toggle-label">ALERTS</div>
                              <div className={`toggle-switch ${mockData.switches.alerts ? 'active' : ''}`}>
                                 <div className="toggle-slider"></div>
                              </div>
                           </div>
                        </div>

                        <div className="osd-matrix">
                           <div className="matrix-label">OSD MATRIX</div>
                           <div className="osd-grid">
                              <div className="osd-item up">
                                 <span className="osd-count">{mockData.cluster.osds.up}</span>
                                 <span className="osd-label">UP</span>
                              </div>
                              <div className="osd-item down">
                                 <span className="osd-count">{mockData.cluster.osds.down}</span>
                                 <span className="osd-label">DOWN</span>
                              </div>
                              <div className="osd-item">
                                 <span className="osd-count">{mockData.cluster.osds.in}</span>
                                 <span className="osd-label">IN</span>
                              </div>
                              <div className="osd-item">
                                 <span className="osd-count">{mockData.cluster.osds.out}</span>
                                 <span className="osd-label">OUT</span>
                              </div>
                           </div>
                        </div>

                        <div className="performance-matrix">
                           <div className="perf-item">
                              <div className="perf-label">IOPS READ</div>
                              <div className="perf-progress">
                                 <div className="progress-bar" style={{ width: '75%' }}></div>
                              </div>
                              <div className="perf-value">{mockData.cluster.iops.read}</div>
                           </div>
                           <div className="perf-item">
                              <div className="perf-label">IOPS WRITE</div>
                              <div className="perf-progress">
                                 <div className="progress-bar" style={{ width: '60%' }}></div>
                              </div>
                              <div className="perf-value">{mockData.cluster.iops.write}</div>
                           </div>
                           <div className="perf-item">
                              <div className="perf-label">LATENCY</div>
                              <div className="perf-progress">
                                 <div className="progress-bar warning" style={{ width: '25%' }}></div>
                              </div>
                              <div className="perf-value">2.4ms</div>
                           </div>
                        </div>
                     </div>
                  </div>
               </SimpleBar>
            </div>

            {/* Info Panel */}
            {/* 항상 렌더링, CSS display로 제어 */}
            <div className={'info-panel'} style={{ display: 'none' }}>
               <h3 id="info-title">{/* 동적 업데이트 내용 */}</h3>
               <div id="info-content" className={'info-content'}>
                  {selectedObjectRef.current?.type === 'OSD' && selectedObjectRef.current.detail && (
                     <div className="space-y-2">
                        <div className="info-section">
                           <div className="font-semibold text-cyan-400">OSD {selectedObjectRef.current.detail.osd_id}</div>
                           <div className="text-sm">Hostname: {selectedObjectRef.current.detail.hostname}</div>
                        </div>

                        <div className="info-section">
                           <div className="font-semibold text-cyan-400">Status</div>
                           <div className="text-sm">
                              State:{' '}
                              <span className={selectedObjectRef.current.detail.status.up ? 'text-green-400' : 'text-red-400'}>
                                 {selectedObjectRef.current.detail.status.state}
                              </span>
                           </div>
                           <div className="text-sm">Up: {selectedObjectRef.current.detail.status.up ? '✓' : '✗'}</div>
                           <div className="text-sm">In: {selectedObjectRef.current.detail.status.in ? '✓' : '✗'}</div>
                           <div className="text-sm">Weight: {selectedObjectRef.current.detail.status.weight.toFixed(2)}</div>
                           <div className="text-sm">Reweight: {selectedObjectRef.current.detail.status.reweight.toFixed(2)}</div>
                        </div>

                        <div className="info-section">
                           <div className="font-semibold text-cyan-400">Placement Groups</div>
                           <div className="text-sm">PG Count: {selectedObjectRef.current.detail.num_pgs || 0}</div>
                        </div>

                        <div className="info-section">
                           <div className="font-semibold text-cyan-400">Device</div>
                           <div className="text-sm">Path: {selectedObjectRef.current.detail.device.path}</div>
                           <div className="text-sm">Type: {selectedObjectRef.current.detail.device.type.toUpperCase()}</div>
                        </div>

                        <div className="info-section">
                           <div className="font-semibold text-cyan-400">Capacity</div>
                           <div className="text-sm">Total: {(selectedObjectRef.current.detail.capacity.total_bytes / 1024 / 1024 / 1024).toFixed(2)} GB</div>
                           <div className="text-sm">Used: {(selectedObjectRef.current.detail.capacity.used_bytes / 1024 / 1024 / 1024).toFixed(2)} GB</div>
                           <div className="text-sm">
                              Available: {(selectedObjectRef.current.detail.capacity.available_bytes / 1024 / 1024 / 1024).toFixed(2)} GB
                           </div>
                           <div className="text-sm">
                              Utilization:{' '}
                              <span
                                 className={
                                    selectedObjectRef.current.detail.capacity.utilization_percent > 80
                                       ? 'text-red-400'
                                       : selectedObjectRef.current.detail.capacity.utilization_percent > 60
                                         ? 'text-yellow-400'
                                         : 'text-green-400'
                                 }
                              >
                                 {selectedObjectRef.current.detail.capacity.utilization_percent.toFixed(2)}%
                              </span>
                           </div>
                        </div>

                        <div className="info-section">
                           <div className="font-semibold text-cyan-400">SMART</div>
                           <div className="text-sm">Health: {selectedObjectRef.current.detail.smart.health_status}</div>
                           <div className="text-sm">Temperature: {selectedObjectRef.current.detail.smart.temperature_celsius}°C</div>
                        </div>

                        <div className="info-section">
                           <div className="font-semibold text-cyan-400">Host Info</div>
                           <div className="text-sm">Host Name: {selectedObjectRef.current.detail.host_info?.name || 'N/A'}</div>
                           <div className="text-sm">Public IP: {selectedObjectRef.current.detail.host_info?.publicIp || 'N/A'}</div>
                           <div className="text-sm">Cluster IP: {selectedObjectRef.current.detail.host_info?.clusterIp || 'N/A'}</div>
                           <div className="text-sm">
                              Host OSDs: {selectedObjectRef.current.detail.host_info?.osdIds?.map((id: number) => `osd.${id}`).join(', ') || 'N/A'}
                           </div>
                        </div>
                     </div>
                  )}

                  {selectedObjectRef.current?.type === 'Host' && (
                     <div className="space-y-2">
                        <div className="info-section">
                           <div className="font-semibold text-cyan-400">
                              Host: {selectedObjectRef.current.detail?.hostname || selectedObjectRef.current.name}
                           </div>
                        </div>

                        {selectedObjectRef.current.detail && (
                           <>
                              <div className="info-section">
                                 <div className="font-semibold text-cyan-400">Network Information</div>
                                 <div className="text-sm">Hostname: {selectedObjectRef.current.detail.hostname}</div>
                                 <div className="text-sm">Address: {selectedObjectRef.current.detail.address}</div>
                                 <div className="text-sm">Public IP: {selectedObjectRef.current.detail.publicAddr}</div>
                                 <div className="text-sm">Cluster IP: {selectedObjectRef.current.detail.clusterAddr}</div>
                                 <div className="text-sm">Status: {selectedObjectRef.current.detail.status || 'online'}</div>
                                 <div className="text-sm">Labels: {selectedObjectRef.current.detail.labels?.join(', ') || 'None'}</div>
                              </div>

                              <div className="info-section">
                                 <div className="font-semibold text-cyan-400">OSDs on this Host</div>
                                 <div className="text-sm">Count: {selectedObjectRef.current.detail.osdIds?.length || 0}</div>
                                 <div className="text-sm">
                                    OSD IDs: {selectedObjectRef.current.detail.osdIds?.map((id: number) => `osd.${id}`).join(', ') || 'N/A'}
                                 </div>
                              </div>

                              <div className="info-section">
                                 <div className="font-semibold text-cyan-400">Capacity</div>
                                 <div className="text-sm">
                                    Host Capacity: {(selectedObjectRef.current.detail.hostCapacity / 1024 / 1024 / 1024).toFixed(2)} GB
                                 </div>
                                 <div className="text-sm">
                                    Total Capacity: {(selectedObjectRef.current.detail.totalCapacity / 1024 / 1024 / 1024).toFixed(2)} GB
                                 </div>
                                 <div className="text-sm">Used: {(selectedObjectRef.current.detail.usedCapacity / 1024 / 1024 / 1024).toFixed(2)} GB</div>
                                 <div className="text-sm">
                                    Available: {(selectedObjectRef.current.detail.availableCapacity / 1024 / 1024 / 1024).toFixed(2)} GB
                                 </div>
                                 <div className="text-sm">
                                    Utilization:{' '}
                                    <span
                                       className={
                                          selectedObjectRef.current.detail.usedPercent > 80
                                             ? 'text-red-400'
                                             : selectedObjectRef.current.detail.usedPercent > 60
                                               ? 'text-yellow-400'
                                               : 'text-green-400'
                                       }
                                    >
                                       {selectedObjectRef.current.detail.usedPercent.toFixed(2)}%
                                    </span>
                                 </div>
                              </div>

                              <div className="info-section">
                                 <div className="font-semibold text-cyan-400">Hardware</div>
                                 <div className="text-sm">CPU: {selectedObjectRef.current.detail.cpuModel}</div>
                                 <div className="text-sm">CPU Count: {selectedObjectRef.current.detail.cpuCount}</div>
                                 <div className="text-sm">Core Count: {selectedObjectRef.current.detail.coreCount}</div>
                                 <div className="text-sm">
                                    Memory:{' '}
                                    {selectedObjectRef.current.detail.memory
                                       ? (selectedObjectRef.current.detail.memory / 1024 / 1024).toFixed(2) + ' GB'
                                       : 'N/A'}
                                 </div>
                                 <div className="text-sm">NIC Count: {selectedObjectRef.current.detail.nicCount}</div>
                                 <div className="text-sm">Model: {selectedObjectRef.current.detail.model}</div>
                              </div>

                              <div className="info-section">
                                 <div className="font-semibold text-cyan-400">System Information</div>
                                 <div className="text-sm">OS: {selectedObjectRef.current.detail.os}</div>
                                 <div className="text-sm">Kernel: {selectedObjectRef.current.detail.kernel}</div>
                                 <div className="text-sm">Ceph Version: {selectedObjectRef.current.detail.version}</div>
                              </div>
                           </>
                        )}
                     </div>
                  )}
               </div>
               <button onClick={closeInfo} className={'close-btn'}>
                  ×
               </button>
            </div>

            {/* Clock */}
            {/*<div className={'clock-container'}>
               <canvas id="clock" width="180" height="160"></canvas>
            </div>*/}

            {/* 하단 좌측 패널 - AI Predictions */}
            {/* 항상 렌더링, CSS display로 제어 */}
            <div className="spaceship-panel panel-left" style={{ display: 'none' }}>
               <div className="panel-header">
                  <div className="panel-title">
                     <span className="title-indicator ai"></span>
                     <span>AI THREAT ANALYSIS</span>
                  </div>
               </div>
               <div className="panel-content overflow-hidden">
                  <div className="flex justify-between space-x-1">
                     <div className="predictions-list flex-1 scrollable h-[198px]">
                        {mockData.predictions.map(pred => (
                           <div key={pred.id} className={`prediction-item risk-${pred.risk}`}>
                              <div className="pred-header">
                                 <span className="pred-icon">{pred.icon}</span>
                                 <span className="pred-title">{pred.title}</span>
                                 <span className="pred-risk">{pred.risk.toUpperCase()}</span>
                              </div>
                              <div className="pred-details">
                                 <div className="pred-probability">Probability: {pred.probability}%</div>
                                 <div className="pred-eta">ETA: {pred.eta}</div>
                              </div>
                              <div className="pred-progress">
                                 <div className="pred-progress-bar" style={{ width: `${pred.probability}%` }}></div>
                              </div>
                           </div>
                        ))}
                     </div>
                     <div className="performance-grid flex-1 scrollable h-[198px]">
                        {mockData.performance.map(metric => (
                           <div key={metric.name} className="perf-metric">
                              <div className="perf-name">{metric.name}</div>
                              <div className="perf-bar-container">
                                 <div className="perf-bar" style={{ width: `${metric.value}%` }}>
                                    <span className="perf-value">{metric.value}%</span>
                                 </div>
                              </div>
                              <div className={`perf-status ${metric.status}`}>{metric.status.toUpperCase()}</div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* 하단 중앙 패널 - Quick Status */}
            {/* 항상 렌더링, CSS display로 제어 */}
            <div className="spaceship-panel panel-bottom" style={{ display: 'none' }}>
               <div className="panel-header compact">
                  <div className="panel-title">
                     <span className="title-indicator"></span>
                     <span>QUICK STATUS</span>
                  </div>
               </div>
               <div className="panel-content overflow-hidden">
                  <div className="scrollable h-[128px] flex flex-1">
                     <table className="w-full">
                        <thead>
                           <tr>
                              <th>OSD</th>
                              <th>IOPS</th>
                              <th>LAT</th>
                              <th>UTIL</th>
                              <th>TEMP</th>
                              <th>STATUS</th>
                           </tr>
                        </thead>
                        <tbody>
                           {mockData.topOsds.map(osd => (
                              <tr key={osd.id} className={`status-${osd.status}`}>
                                 <td className="osd-id pl-2">{osd.id}</td>
                                 <td className="iops-cell">
                                    <span className="metric-value">{osd.iops}</span>
                                    <div className="mini-bar">
                                       <div className="bar-fill" style={{ width: `${(osd.iops / 5000) * 100}%` }}></div>
                                    </div>
                                 </td>
                                 <td className="latency-cell">
                                    <span className={`metric-value ${osd.latency > 10 ? 'high-latency' : ''}`}>{osd.latency}ms</span>
                                 </td>
                                 <td className="util-cell">
                                    <span className="metric-value">{osd.utilization}%</span>
                                    <div className="util-ring" style={{ '--progress': `${osd.utilization}%` } as React.CSSProperties}></div>
                                 </td>
                                 <td className="temp-cell">
                                    <span className={`metric-value ${osd.temperature > 60 ? 'hot-temp' : ''}`}>{osd.temperature}°C</span>
                                 </td>
                                 <td className="status-cell">
                                    <div className={`status-badge badge-${osd.status}`}>
                                       <div className="status-indicator"></div>
                                       <span>{osd.status.toUpperCase()}</span>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>

            {/* 하단 우측 패널 - Performance Metrics */}
            {/* 항상 렌더링, CSS display로 제어 */}
            <div className="spaceship-panel panel-right" style={{ display: 'none' }}>
               <div className="panel-header">
                  <div className="panel-title font-orbitron">
                     <span className="title-indicator perf"></span>
                     <span>PERFORMANCE MATRIX</span>
                  </div>
               </div>
               <div className="panel-content overflow-hidden">
                  <div className="table-container flex justify-between scrollable h-[184px] !p-0 bg-opacity-70">
                     <div className="flex-1 quick-stats">
                        <div className="quick-stat">
                           <span className="stat-label">Latency</span>
                           <span className="stat-value">{mockData.quickStats.latency}ms</span>
                        </div>
                        <div className="quick-stat">
                           <span className="stat-label">Throughput</span>
                           <span className="stat-value">{mockData.quickStats.throughput}</span>
                        </div>
                        <div className="quick-stat">
                           <span className="stat-label">Active Alerts</span>
                           <span className="stat-value alert">{mockData.quickStats.alerts}</span>
                        </div>
                     </div>
                     <div className="w-[180px] relative bg-black">
                        <canvas id="clock" className="absolute right-[-20px] bottom-8" width="180"></canvas>
                     </div>
                  </div>
               </div>
            </div>

            {/* Loading - DOM 직접 제어 */}
            <div className={'loading-spinner-container'}>
               <div className={'loading-spinner'}>
                  <div className={'spinner-ring'}></div>
                  <div className={'spinner-ring'}></div>
                  <div className={'spinner-ring'}></div>
                  <Image src={'/videos/loading_sphere.gif'} alt="loading" width={100} height={100} className="mx-auto mt-[64px]" />
                  <div className={'spinner-text'}>{isLoadingTopology || !topologyData ? 'Loading Topology Data...' : 'Loading Textures...'}</div>
               </div>
            </div>
         </div>
      </>
   );
}
