'use client';

import { FC, RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Colors from '@/utils/color';
import { Box, Cylinder, Environment, Icosahedron, OrbitControls, Plane, Sphere, useTexture } from '@react-three/drei';
import RoundMirrorTextTable from '@/components/models/RoundMirrorTextTable';
import { AppHeader } from '@/components/layout';
import { mockTopologyData } from '@/public/data/topologyMockData';
import { Physics, useBox, useSphere } from '@react-three/cannon';
import { Bloom, BrightnessContrast, EffectComposer } from '@react-three/postprocessing';
import { AdaptiveLayoutManager } from '@/utils/layouts';
import Atmosphere from '@/components/models/Atmosphere';
import { Text as Text3D } from '@react-three/drei/core/Text';
import { loadTexture } from '@/utils/utils';
import GhostTrails from '@/components/traffic/GhostTrails';
import { gsap } from 'gsap';
import ServerRackModel from '@/components/models/ServerRackModel';

// ------ Server Racks (Door, Servers, HDD, VM Particles) ------

// 간단한 VM 파티클: 반투명 아쿠아 큐브 위에서 사이버 색상의 점들이 공전
const VMParticles = ({ count = 8, radius = 3.5, speed = 0.8, colors = [0x00e5ff, 0x7c3aed, 0x22d3ee] }) => {
   const grp = useRef<THREE.Group>(null);
   useFrame(state => {
      if (!grp.current) return;
      const t = state.clock.getElapsedTime() * speed;
      grp.current.children.forEach((m, i) => {
         const phase = (i / count) * Math.PI * 2 + t * 0.4;
         const r = radius * (0.75 + 0.25 * Math.sin(t * 0.9 + i));
         const y = 0.8 * Math.sin(t * 1.3 + i); // 높이 변화도 크게
         m.position.set(Math.cos(phase) * r, y, Math.sin(phase) * r);
         m.rotation.y += 0.03;
         m.rotation.x += 0.02; // x축 회전도 추가
      });
   });
   return (
      <group ref={grp}>
         {Array.from({ length: count }, (_, i) => (
            <Icosahedron key={i} args={[1.2, 0]}>
               <meshStandardMaterial
                  color={colors[i % colors.length]}
                  emissive={colors[i % colors.length]}
                  emissiveIntensity={1.2}
                  metalness={0.3}
                  roughness={0.4}
               />
            </Icosahedron>
         ))}
      </group>
   );
};

type TexSet = {
   rackFront?: THREE.Texture;
   rackSide?: THREE.Texture;
   rackTop?: THREE.Texture;
   serverFront?: THREE.Texture;
};

// 1U 서버 유닛(여기서는 3U 정도 크기로 보이게): 클릭 시 앞으로 슬라이드 + VM 파티클 표시
const ServerUnit = ({
   size = [8, 2.4, 10], // [w,h,d]
   hddCount = 3,
   frontTex,
   onClick,
   selected = false,
}: {
   size?: [number, number, number];
   hddCount?: number;
   frontTex?: THREE.Texture;
   onClick?: (e: any) => void;
   selected?: boolean;
}) => {
   const meshRef = useRef<THREE.Mesh>(null);
   // 슬라이드 애니메이션
   const slide = useRef(0); // 0~1 (서버 슬라이드)
   const rise = useRef(0); // 0~1 (VM 큐브 상승)
   const vmGroupRef = useRef<THREE.Group>(null);
   const [showVM, setShowVM] = useState(false);

   useFrame((_s, dt) => {
      const target = selected ? 1 : 0;
      slide.current = THREE.MathUtils.damp(slide.current, target, 6, dt);

      if (meshRef.current) {
         // 로컬 +Z 방향으로 튀어나오게
         meshRef.current.position.z = THREE.MathUtils.lerp(0, size[2] * 0.75, slide.current);
      }

      // 서버가 80% 이상 나왔을 때 VM 큐브 표시 시작
      if (selected && slide.current > 0.8 && !showVM) {
         setShowVM(true);
      }
      // 서버가 20% 이하로 들어갔을 때 VM 큐브 숨김
      else if (!selected && slide.current < 0.2 && showVM) {
         setShowVM(false);
      }

      // VM 큐브가 보일 때만 상승 애니메이션
      const riseTarget = showVM ? 1 : 0;
      rise.current = THREE.MathUtils.damp(rise.current, riseTarget, 2.5, dt);

      // VM 그룹: 서버 위치 따라가며 위로 천천히 상승 + 회전
      if (vmGroupRef.current && showVM) {
         const up = THREE.MathUtils.lerp(0, 3, rise.current); // 최대 3 상승
         const forwardZ = THREE.MathUtils.lerp(0, size[2] * 0.75, slide.current); // 서버와 같은 Z 위치
         vmGroupRef.current.position.set(0, size[1] * 0.9 + up, forwardZ);
         vmGroupRef.current.rotation.y += 0.01 * rise.current; // 천천히 회전
      }
   });

   // HDD 3개 (좌→우)
   const hddW = size[0] * 0.22,
      hddH = size[1] * 0.35,
      hddD = size[2] * 0.6;
   const hddY = 0;
   const hddZ = -size[2] * 0.15;

   return (
      <group>
         <mesh ref={meshRef} onClick={onClick} castShadow receiveShadow>
            <boxGeometry args={size} />
            {/* 각 면에 대한 material 설정 - 순서: +X, -X, +Y, -Y, +Z(앞면), -Z(뒷면) */}
            <meshStandardMaterial attach="material-0" color={0x111827} metalness={0.8} roughness={0.4} />
            <meshStandardMaterial attach="material-1" color={0x111827} metalness={0.8} roughness={0.4} />
            <meshStandardMaterial attach="material-2" color={0x111827} metalness={0.8} roughness={0.4} />
            <meshStandardMaterial attach="material-3" color={0x111827} metalness={0.8} roughness={0.4} />
            {/* +Z 면 (앞면) - 텍스처 적용 */}
            {frontTex ? (
               <meshStandardMaterial attach="material-4" map={frontTex} color={Colors.white} metalness={0.6} roughness={0.5} />
            ) : (
               <meshStandardMaterial attach="material-4" color={0x1f2937} metalness={0.6} roughness={0.5} emissive={0x0ea5e9} emissiveIntensity={0.15} />
            )}
            <meshStandardMaterial attach="material-5" color={0x111827} metalness={0.8} roughness={0.4} />
         </mesh>

         {/* HDD 3개 (서버 내부) */}
         {Array.from({ length: hddCount }, (_, i) => {
            const x = (i - (hddCount - 1) / 2) * (hddW * 1.15);
            return (
               <mesh key={i} position={[x, hddY, hddZ]} castShadow receiveShadow>
                  <boxGeometry args={[hddW, hddH, hddD]} />
                  <meshStandardMaterial color={0x1f2937} metalness={0.7} roughness={0.45} emissive={0x38bdf8} emissiveIntensity={0.1} />
               </mesh>
            );
         })}

         {/* VM 파티클 (서버가 튀어나온 후 지연 표시) + 크리스탈 큐브 */}
         {showVM && (
            <group ref={vmGroupRef} position={[0, size[1] * 0.9, 0]}>
               {/* 투명한 크리스탈 박스 */}
               <Box args={[8, 5, 8]}>
                  <meshPhysicalMaterial
                     color={0x00e5ff}
                     transparent
                     opacity={0.08}
                     metalness={0.1}
                     roughness={0.0}
                     transmission={0.95}
                     thickness={0.5}
                     ior={2.4}
                     clearcoat={1}
                     clearcoatRoughness={0}
                  />
               </Box>
               {/* 발광하는 엣지 라인 */}
               <lineSegments>
                  <edgesGeometry args={[new THREE.BoxGeometry(8, 5, 8)]} />
                  <lineBasicMaterial color={0x00ffff} linewidth={2} transparent opacity={0.9} />
               </lineSegments>
               {/* 코너 포인트 발광 효과 */}
               {[
                  [-4, -2.5, -4],
                  [4, -2.5, -4],
                  [-4, 2.5, -4],
                  [4, 2.5, -4],
                  [-4, -2.5, 4],
                  [4, -2.5, 4],
                  [-4, 2.5, 4],
                  [4, 2.5, 4],
               ].map((pos, i) => (
                  <mesh key={i} position={pos as [number, number, number]}>
                     <sphereGeometry args={[0.15, 8, 8]} />
                     <meshBasicMaterial color={0x00ffff} transparent opacity={0.8} />
                  </mesh>
               ))}
               <VMParticles />
            </group>
         )}
      </group>
   );
};

// 서버랙(문 여닫이, 내부에 서버들 배치). 정면 클릭: 도어 오픈/클로즈
const ServerRack = ({
   servers = 3,
   tex, // TexSet
   size = [24, 56, 24], // [w,h,d] - 2배 크기
   doorHinge = 'left' as 'left' | 'right',
}: {
   servers: number;
   tex: TexSet;
   size?: [number, number, number];
   doorHinge?: string;
}) => {
   const rackRef = useRef<THREE.Group>(null);
   const doorPivot = useRef<THREE.Group>(null);
   const serversGroupRef = useRef<THREE.Group>(null);
   const doorMeshRef = useRef<THREE.Mesh>(null);
   const glowMeshRef = useRef<THREE.Mesh>(null);
   const spotLightRef = useRef<THREE.SpotLight>(null);
   const pointLightRef = useRef<THREE.PointLight>(null);
   const [open, setOpen] = useState(false);
   const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

   // 도어 회전은 GSAP으로 부드럽게 (바깥쪽으로 열리도록)
   useEffect(() => {
      const y = open ? (doorHinge === 'left' ? -Math.PI / 1.8 : Math.PI / 1.8) : 0; // 부호 반대로
      if (doorPivot.current) {
         gsap.to(doorPivot.current.rotation, { y, duration: 0.6, ease: 'power3.out' });
      }
      // 문 열릴 때 내부 서버 보이기 / 닫히면 숨김
      if (serversGroupRef.current) {
         serversGroupRef.current.visible = open;
      }
   }, [open, doorHinge]);

   // 발광 효과 펄싱 애니메이션
   useFrame(state => {
      const time = state.clock.getElapsedTime();
      // 서로 다른 주기로 펄싱하는 효과
      const pulse1 = Math.sin(time * 2) * 0.3 + 0.7; // 0.4 ~ 1.0
      const pulse2 = Math.sin(time * 3 + Math.PI / 3) * 0.4 + 0.6; // 0.2 ~ 1.0

      if (glowMeshRef.current) {
         const material = glowMeshRef.current.material as THREE.MeshBasicMaterial;
         material.opacity = 0.4 * pulse1;
      }
      if (spotLightRef.current) {
         spotLightRef.current.intensity = 1.5 * pulse2;
      }
      if (pointLightRef.current) {
         pointLightRef.current.intensity = 0.8 * pulse1;
      }
   });

   // 랙 외장
   const [w, h, d] = size;
   const frameThick = 0.4;
   const innerW = w - frameThick * 2;
   const innerH = h - frameThick * 2;
   const innerD = d - frameThick * 2;

   // 서버 높이 간격 계산
   const srvH = (innerH / (servers + 1)) * 0.55; // 높이 축소
   const srvW = innerW * 0.92;
   const srvD = innerD * 0.9;

   // 클릭: 도어 토글
   const onFrontClick = (e: any) => {
      e.stopPropagation();
      setOpen(v => !v);
   };

   return (
      <group ref={rackRef}>
         <pointLight args={['#ffffff', 50, 50, 1]} position={[0, 15, 0]} />
         {/* 랙 프레임 - 개별 면으로 구성 (정면 제외) */}
         {/* 뒤면 */}
         <mesh castShadow receiveShadow position={[0, 0, -d / 2]}>
            <boxGeometry args={[w, h, frameThick]} />
            <meshStandardMaterial color={0x0b1220} metalness={0.9} roughness={0.25} />
         </mesh>
         {/* 좌측면 */}
         <mesh castShadow receiveShadow position={[-w / 2, 0, 0]}>
            <boxGeometry args={[frameThick, h, d]} />
            <meshStandardMaterial color={0x0b1220} metalness={0.9} roughness={0.25} />
         </mesh>
         {/* 우측면 */}
         <mesh castShadow receiveShadow position={[w / 2, 0, 0]}>
            <boxGeometry args={[frameThick, h, d]} />
            <meshStandardMaterial color={0x0b1220} metalness={0.9} roughness={0.25} />
         </mesh>
         {/* 상단면 */}
         <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
            <boxGeometry args={[w, frameThick, d]} />
            <meshStandardMaterial color={0x0b1220} metalness={0.9} roughness={0.25} />
         </mesh>
         {/* 하단면 */}
         <mesh castShadow receiveShadow position={[0, -h / 2, 0]}>
            <boxGeometry args={[w, frameThick, d]} />
            <meshStandardMaterial color={0x0b1220} metalness={0.9} roughness={0.25} />
         </mesh>

         {/* 상/하/좌/우 면 텍스처(있으면 적용) */}
         {tex?.rackTop && (
            <mesh position={[0, h / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
               <planeGeometry args={[w, d]} />
               <meshStandardMaterial map={tex.rackTop} metalness={0.6} roughness={0.5} />
            </mesh>
         )}
         {tex?.rackSide && (
            <>
               <mesh position={[-w / 2 - 0.01, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                  <planeGeometry args={[d, h]} />
                  <meshStandardMaterial map={tex.rackSide} metalness={0.6} roughness={0.5} />
               </mesh>
               <mesh position={[w / 2 + 0.01, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
                  <planeGeometry args={[d, h]} />
                  <meshStandardMaterial map={tex.rackSide} metalness={0.6} roughness={0.5} />
               </mesh>
            </>
         )}

         {/* 내부 섀시 - 뒤쪽에만 배치하여 서버가 잘 보이도록 */}
         <mesh position={[0, 0, -innerD / 2 + 0.1]}>
            <boxGeometry args={[innerW, innerH, 0.2]} />
            <meshStandardMaterial color={0x0f172a} metalness={0.8} roughness={0.45} />
         </mesh>

         {/* --- Back inner glow (height 2/3) --- */}
         {(() => {
            const glowY = h * 0.15; // 랙 중앙보다 약간 위
            const backZ = -innerD / 2 + 1; // 뒤판에서 약간 앞
            return (
               <>
                  {/* 라이트 카드(투명/가산 블렌딩) - 더 크고 밝게 */}
                  <mesh ref={glowMeshRef} position={[0, glowY, backZ]} rotation={[0, 0, 0]}>
                     <planeGeometry args={[innerW * 0.9, innerH * 0.6]} />
                     <meshBasicMaterial color={0x00e5ff} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
                  </mesh>
                  {/* 뒤→앞으로 쓰는 스포트 라이트 - 더 강하게 */}
                  <spotLight
                     ref={spotLightRef}
                     color={0x00d4ff}
                     intensity={1.5}
                     distance={innerD * 3.0}
                     angle={Math.PI / 4}
                     penumbra={0.8}
                     position={[0, glowY, backZ - 0.5]}
                     target-position={[0, glowY, innerD / 2]}
                  />
                  {/* 추가 포인트 라이트로 내부 전체 밝게 */}
                  <pointLight ref={pointLightRef} color={0x60a5fa} intensity={0.8} distance={innerD * 1.5} position={[0, glowY, backZ]} />
               </>
            );
         })()}

         {/* 서버들 (아래에서 위로) — 도어가 열릴 때만 표시 */}
         <group ref={serversGroupRef} visible={false} position={[0, -innerH / 2 + srvH * 0.6, 0]}>
            {Array.from({ length: servers }, (_, i) => {
               const y = i * (srvH * 1.1);
               return (
                  <group key={i} position={[0, y, innerD / 2 - srvD / 2 - 0.6]}>
                     <ServerUnit
                        size={[srvW, srvH, srvD]}
                        hddCount={3}
                        frontTex={tex?.serverFront}
                        selected={selectedIdx === i}
                        onClick={(e: any) => {
                           e?.stopPropagation?.();
                           setSelectedIdx(idx => (idx === i ? null : i));
                        }}
                     />
                  </group>
               );
            })}
         </group>

         {/* 도어(정면 패널) — 한쪽 힌지로 회전 */}
         <group
            ref={doorPivot}
            position={[doorHinge === 'left' ? -w / 2 : w / 2, 0, d / 2 + 0.2]}
            // 회전축: Y
         >
            <mesh ref={doorMeshRef} position={[doorHinge === 'left' ? w / 2 : -w / 2, 0, 0]} onClick={onFrontClick}>
               <planeGeometry args={[w, h]} />
               {tex?.rackFront ? (
                  <meshStandardMaterial map={tex.rackFront} metalness={0.6} roughness={0.55} side={THREE.DoubleSide} />
               ) : (
                  <meshStandardMaterial color={0x1f2937} metalness={0.7} roughness={0.5} emissive={0x0ea5e9} emissiveIntensity={0.2} side={THREE.DoubleSide} />
               )}
            </mesh>
         </group>
      </group>
   );
};

interface Props {}

const PoolNode = ({
   poolData,
   position,
   textures,
   animationRefs,
}: {
   poolData: any;
   position?: [number, number, number];
   textures: any;
   animationRefs?: {
      meshRef: RefObject<THREE.Mesh | null>;
      cloudsRef: RefObject<THREE.Mesh | null>;
   };
}) => {
   const meshRef = useRef<THREE.Mesh>(null);
   const cloudsRef = useRef<THREE.Mesh>(null);
   const groupRef = useRef<THREE.Group>(null);

   useEffect(() => {
      if (animationRefs) {
         animationRefs.meshRef.current = meshRef.current;
         animationRefs.cloudsRef.current = cloudsRef.current;
      }
   }, [animationRefs]);

   return (
      <group ref={groupRef} position={position} userData={{ type: 'Pool', id: poolData.id, poolData }}>
         <>
            <mesh ref={meshRef} castShadow>
               <sphereGeometry args={[4, 32, 32]} />
               {textures?.albedoMap ? (
                  <meshStandardMaterial map={textures.albedoMap} bumpMap={textures.bumpMap} bumpScale={0.03} metalness={0.1} metalnessMap={textures.oceanMap} />
               ) : (
                  <meshStandardMaterial color={0x4169e1} emissive={new THREE.Color(0xffff00)} emissiveIntensity={0.6} />
               )}
            </mesh>
            <mesh ref={cloudsRef} castShadow>
               <sphereGeometry args={[4.1, 32, 32]} />
               <meshStandardMaterial map={textures?.cloudsMap || undefined} transparent opacity={0.5} depthWrite={false} />
            </mesh>
            <Atmosphere radius={4} intensity={1.1} power={2.0} color={Colors.emerald[400]} />
         </>
         {/* Pool name text - positioned above the sphere */}
         {/*<Text3D position={[0, 10, 0]} fontSize={1.5} color={0xffffff} anchorX="center" anchorY="top" outlineColor={Colors.blue[600]} outlineWidth={0.1}>
            {poolData.name}
         </Text3D>*/}
      </group>
   );
};

// Drawer component for left side
const Drawer = ({ position, rotation, type }: { position: [number, number, number]; rotation: [number, number, number]; type: 'boxes' | 'icosahedrons' }) => {
   const drawerWidth = 40;
   const drawerHeight = 8;
   const drawerDepth = 25;
   const wallThickness = 0.5;
   const label = type === 'boxes' ? 'OpenStack VMs' : 'Kubernetes Containers';

   return (
      <group position={position} rotation={rotation}>
         {/* Drawer bottom */}
         <Box args={[drawerWidth, wallThickness, drawerDepth]} position={[0, -drawerHeight / 2 + wallThickness / 2, 0]}>
            <meshStandardMaterial color={Colors.neutral[800]} metalness={0.9} roughness={0.1} emissive={Colors.cyan[400]} emissiveIntensity={0.3} />
         </Box>

         {/* Drawer front wall */}
         <Box args={[drawerWidth, drawerHeight, wallThickness]} position={[0, 0, drawerDepth / 2 - wallThickness / 2]}>
            <meshStandardMaterial color={Colors.neutral[700]} metalness={0.8} roughness={0.2} emissive={Colors.blue[400]} emissiveIntensity={0.2} />
         </Box>

         {/* Drawer back wall */}
         <Box args={[drawerWidth, drawerHeight, wallThickness]} position={[0, 0, -drawerDepth / 2 + wallThickness / 2]}>
            <meshStandardMaterial color={Colors.neutral[700]} metalness={0.8} roughness={0.2} emissive={Colors.blue[400]} emissiveIntensity={0.2} />
         </Box>

         {/* Drawer left wall */}
         <Box args={[wallThickness, drawerHeight, drawerDepth]} position={[-drawerWidth / 2 + wallThickness / 2, 0, 0]}>
            <meshStandardMaterial color={Colors.neutral[700]} metalness={0.8} roughness={0.2} emissive={Colors.blue[400]} emissiveIntensity={0.25} />
         </Box>

         {/* Drawer right wall */}
         {/*<Box args={[wallThickness, drawerHeight, drawerDepth]} position={[drawerWidth / 2 - wallThickness / 2, 0, 0]}>
            <meshStandardMaterial color={Colors.neutral[700]} metalness={0.8} roughness={0.2} emissive={Colors.purple[400]} emissiveIntensity={0.25} />
         </Box>*/}

         {/* Inner glow light */}
         <pointLight position={[0, 0, 0]} intensity={0.5} color={type === 'boxes' ? Colors.cyan[300] : Colors.green[300]} distance={20} />

         {/* Drawer content */}
         <group position={[0, -drawerHeight / 2 + wallThickness + 2, 0]}>
            {type === 'boxes'
               ? // 16 boxes arranged in columns (current), max 60 (5x12)
                 Array.from({ length: 16 }, (_, i) => {
                    const col = Math.floor(i / 5); // 5 columns
                    const row = i % 5;
                    const x = (col - 1.5) * 4; // 4 columns currently, centered
                    const z = (row - 2) * 3; // 5 boxes per column, centered
                    return (
                       <Box key={i} args={[2.5, 2.5, 2.5]} position={[x, 0, z]}>
                          <meshStandardMaterial color={Colors.blue[400]} metalness={0.5} roughness={0.5} emissive={Colors.blue[300]} emissiveIntensity={0.1} />
                       </Box>
                    );
                 })
               : // 35 icosahedrons (current), max 100
                 Array.from({ length: 35 }, (_, i) => {
                    const col = Math.floor(i / 5); // 5 columns
                    const row = i % 5;
                    const x = (col - 3.5) * 4; // 7 columns currently, centered
                    const z = (row - 2) * 4; // 5 icosahedrons per column, centered with more spacing
                    return (
                       <Icosahedron key={i} args={[1.5]} position={[x, 0, z]}>
                          <meshStandardMaterial
                             color={Colors.green[400]}
                             metalness={0.3}
                             roughness={0.7}
                             emissive={Colors.green[300]}
                             emissiveIntensity={0.1}
                          />
                       </Icosahedron>
                    );
                 })}
         </group>

         {/* Label for drawer type */}
         <Text3D
            position={[0, drawerHeight + 2, drawerDepth / 2 + 2]}
            fontSize={2}
            color={type === 'boxes' ? Colors.cyan[400] : Colors.green[400]}
            anchorX="center"
            anchorY="bottom"
         >
            {label}
         </Text3D>
      </group>
   );
};

// OSD cube component
const OSDCube = ({ position }: { position: [number, number, number] }) => {
   return (
      <group position={position}>
         {/* 투명한 파란 정육면체 */}
         <Box args={[2, 2, 2]}>
            <meshPhysicalMaterial color={0x0088ff} transparent opacity={0.15} metalness={0.1} roughness={0.0} transmission={0.85} thickness={0.3} ior={1.8} />
         </Box>
         {/* 발광하는 엣지 라인 */}
         <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(2, 2, 2)]} />
            <lineBasicMaterial color={0x00aaff} linewidth={1.5} transparent opacity={0.8} />
         </lineSegments>
         {/* 정육면체 형태의 발광막 */}
         <Box args={[2.8, 2.8, 2.8]}>
            <meshBasicMaterial
               color={Colors.cyan[400]}
               transparent
               opacity={0.12}
               blending={THREE.AdditiveBlending}
               side={THREE.DoubleSide}
               depthWrite={false}
            />
         </Box>
      </group>
   );
};

// Server case component for right side
const ServerCase = ({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) => {
   // OSD 배치: 5개씩 3줄, 테이블 안쪽에서 바깥쪽으로
   const osdPositions: [number, number, number][] = [];
   const osdSize = 2;
   const spacing = 3;
   const rowSpacing = 4;

   for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
         const x = (col - 2) * spacing; // -6, -3, 0, 3, 6
         const z = -15 + row * rowSpacing; // 테이블 안쪽에서 바깥쪽으로
         const y = 3; // 서버케이스 위
         osdPositions.push([x, y, z]);
      }
   }

   return (
      <group position={position} rotation={rotation}>
         <Box args={[20, 4, 40]} position={[0, 0, 0]}>
            <meshPhysicalMaterial color={Colors.neutral[800]} metalness={0.9} roughness={0.1} />
         </Box>
         {/* OSD 큐브들 */}
         {osdPositions.map((pos, i) => (
            <OSDCube key={i} position={pos} />
         ))}
      </group>
   );
};

// Flying data particles with separate flows
const DataParticles = ({
   drawerPositions,
   hostPositions,
   cylinderPosition,
}: {
   drawerPositions: [number, number, number][];
   hostPositions: [number, number, number][];
   cylinderPosition: [number, number, number];
}) => {
   // Fixed capacity pool pattern
   const DRAWER_CAP = 24; // drawer 최대값
   const HOST_CAP = 36; // host 최대값

   // Dynamic particle counts based on write OPS
   const [drawerWriteOps, setDrawerWriteOps] = useState(100); // Pool write OPS
   const [hostWriteOps, setHostWriteOps] = useState(50); // OSD write OPS
   // Calculate particle counts based on write OPS (min: 4, max: 24)
   const N_DRAWER = Math.min(24, Math.max(4, Math.floor(drawerWriteOps / 10)));
   const N_HOST = Math.min(36, Math.max(8, Math.floor(hostWriteOps / 5)));

   // Speed multiplier based on write intensity
   const drawerSpeedMultiplier = Math.max(0.5, Math.min(2, drawerWriteOps / 100));
   const hostSpeedMultiplier = Math.max(0.5, Math.min(2, hostWriteOps / 50));

   // Simulation: Update write OPS every 10 seconds
   useEffect(() => {
      const interval = setInterval(() => {
         // Simulate varying write load
         const newDrawerOps = Math.floor(Math.random() * 200) + 50; // 50-250 OPS
         const newHostOps = Math.floor(Math.random() * 150) + 25; // 25-175 OPS

         setDrawerWriteOps(newDrawerOps);
         setHostWriteOps(newHostOps);

         console.log(`[Simulation] Pool Write OPS: ${newDrawerOps}, OSD Write OPS: ${newHostOps}`);
         console.log(
            `[Simulation] Drawer Particles: ${Math.min(24, Math.max(4, Math.floor(newDrawerOps / 10)))}, Host Particles: ${Math.min(36, Math.max(8, Math.floor(newHostOps / 5)))}`,
         );
      }, 10000); // Every 10 seconds

      return () => clearInterval(interval);
   }, []);

   // State machine refs
   const drawerActive = useRef<boolean[]>(Array(DRAWER_CAP).fill(false));
   const drawerNextStart = useRef<number[]>(Array(DRAWER_CAP).fill(0));
   const drawerWarmup = useRef<number[]>(Array(DRAWER_CAP).fill(0));
   const drawerCycleId = useRef<number[]>(Array(DRAWER_CAP).fill(0));
   const [drawerCycleIds, setDrawerCycleIds] = useState<number[]>(Array(DRAWER_CAP).fill(0));

   const hostActive = useRef<boolean[]>(Array(HOST_CAP).fill(false));
   const hostNextStart = useRef<number[]>(Array(HOST_CAP).fill(0));
   const hostWarmup = useRef<number[]>(Array(HOST_CAP).fill(0));
   const hostCycleId = useRef<number[]>(Array(HOST_CAP).fill(0));
   const [hostCycleIds, setHostCycleIds] = useState<number[]>(Array(HOST_CAP).fill(0));

   // Particle mesh refs
   const drawerParticleRefs = useRef<THREE.Group[]>([]);
   const hostParticleRefs = useRef<THREE.Group[]>([]);

   // Start times for each particle
   const drawerStartTime = useRef<number[]>(Array(DRAWER_CAP).fill(0));
   const hostStartTime = useRef<number[]>(Array(HOST_CAP).fill(0));

   const drawerParticleData = useRef<
      Array<{
         startTime: number;
         duration: number;
         startPos: [number, number, number];
      }>
   >([]);

   const hostParticleData = useRef<
      Array<{
         startTime: number;
         duration: number;
         startPos: [number, number, number];
         endPos: [number, number, number];
      }>
   >([]);

   // Function to get offset position within an object
   const getOffsetPosition = (basePos: [number, number, number], objectType: 'drawer' | 'host', offsetIndex: number): [number, number, number] => {
      const offsets = [
         [-0.4, 0, -0.3], // Left-back
         [0, 0, 0], // Center
         [0.4, 0, 0.3], // Right-front
      ];

      const offset = offsets[offsetIndex % 3];
      const scale = objectType === 'drawer' ? 8 : 6; // Different scales for drawer vs host

      return [basePos[0] + offset[0] * scale, basePos[1] + offset[1] * scale, basePos[2] + offset[2] * scale];
   };

   // Initialize particle data containers
   useMemo(() => {
      // Initialize empty containers (parameters will be calculated on start cycle)
      drawerParticleData.current = Array(DRAWER_CAP)
         .fill(null)
         .map(() => ({
            startTime: 0,
            duration: 0,
            startPos: [0, 0, 0] as [number, number, number],
         }));

      hostParticleData.current = Array(HOST_CAP)
         .fill(null)
         .map(() => ({
            startTime: 0,
            duration: 0,
            startPos: [0, 0, 0] as [number, number, number],
            endPos: [0, 0, 0] as [number, number, number],
         }));

      // Initialize spawn intervals for inactive particles only
      for (let i = 0; i < DRAWER_CAP; i++) {
         if (!drawerActive.current[i]) {
            drawerNextStart.current[i] = Math.random() * (8 / drawerSpeedMultiplier);
         }
      }
      for (let i = 0; i < HOST_CAP; i++) {
         if (!hostActive.current[i]) {
            hostNextStart.current[i] = Math.random() * (8 / hostSpeedMultiplier);
         }
      }
   }, [drawerSpeedMultiplier, hostSpeedMultiplier, drawerPositions, hostPositions, cylinderPosition]);

   const interpolatePosition = (startPos: [number, number, number], endPos: [number, number, number], progress: number): [number, number, number] => {
      const wobble = progress > 0.03 ? Math.sin(progress * Math.PI) * 3 : 0;
      return [
         THREE.MathUtils.lerp(startPos[0], endPos[0], progress),
         THREE.MathUtils.lerp(startPos[1], endPos[1], progress) + wobble,
         THREE.MathUtils.lerp(startPos[2], endPos[2], progress),
      ];
   };

   // Check if particle hits cylinder surface (radius 30, centered at cylinderPosition)
   const checkCylinderCollision = (particlePos: [number, number, number], cylinderPos: [number, number, number]): boolean => {
      const dx = particlePos[0] - cylinderPos[0];
      const dz = particlePos[2] - cylinderPos[2];
      const distance = Math.sqrt(dx * dx + dz * dz);
      const cylinderRadius = 30; // Exact cylinder radius to collide at surface
      return distance <= cylinderRadius;
   };

   // Utility functions for cycle management
   const startDrawerCycle = (i: number, now: number) => {
      drawerCycleId.current[i]++;
      drawerWarmup.current[i] = 2;
      drawerActive.current[i] = true;
      drawerStartTime.current[i] = now;

      // ★ 매 사이클 시작 시 파라미터 계산
      const drawerIndex = Math.floor(i / 3);
      const offsetIndex = i % 3;
      const baseDrawerPos = drawerPositions[drawerIndex % drawerPositions.length];
      const startPos = getOffsetPosition(baseDrawerPos, 'drawer', offsetIndex);
      const duration = (3 + Math.random() * 2) / drawerSpeedMultiplier; // 현재 속도 반영
      drawerParticleData.current[i] = { startTime: now, duration, startPos };

      const m = drawerParticleRefs.current[i];
      if (m) {
         m.position.set(...startPos);
         m.visible = true;
      }

      // Update state to trigger re-render
      setDrawerCycleIds(prev => {
         const newIds = [...prev];
         newIds[i] = drawerCycleId.current[i];
         return newIds;
      });
   };

   const endDrawerCycle = (i: number, now: number) => {
      drawerActive.current[i] = false;
      // Dynamic pause based on particle count to control density
      const pause = 0.8 * (12 / Math.max(N_DRAWER, 1));
      drawerNextStart.current[i] = now + pause;
      const m = drawerParticleRefs.current[i];
      if (m) {
         m.visible = false;
         m.position.set(99999, 99999, 99999);
      }
   };

   const startHostCycle = (i: number, now: number) => {
      hostCycleId.current[i]++;
      hostWarmup.current[i] = 2;
      hostActive.current[i] = true;
      hostStartTime.current[i] = now;

      // ★ 매 사이클 시작 시 파라미터 계산
      const hostIndex = Math.floor(i / 3);
      const offsetIndex = i % 3;
      const endPos = getOffsetPosition(hostPositions[hostIndex % hostPositions.length], 'host', offsetIndex);
      // 실린더에서 해당 host 쪽으로 시작점 계산
      const dx = endPos[0] - cylinderPosition[0],
         dz = endPos[2] - cylinderPosition[2];
      const angle = Math.atan2(dz, dx) + (Math.random() - 0.5) * 0.3;
      const R = 30;
      const startPos: [number, number, number] = [
         cylinderPosition[0] + Math.cos(angle) * R,
         cylinderPosition[1] + (Math.random() - 0.5) * 20,
         cylinderPosition[2] + Math.sin(angle) * R,
      ];
      const duration = (4 + Math.random() * 2) / hostSpeedMultiplier;
      hostParticleData.current[i] = { startTime: now, duration, startPos, endPos };

      const m = hostParticleRefs.current[i];
      if (m) {
         m.position.set(...startPos);
         m.visible = true;
      }

      // Update state to trigger re-render
      setHostCycleIds(prev => {
         const newIds = [...prev];
         newIds[i] = hostCycleId.current[i];
         return newIds;
      });
   };

   const endHostCycle = (i: number, now: number) => {
      hostActive.current[i] = false;
      // Dynamic pause based on particle count to control density
      const pause = 0.8 * (24 / Math.max(N_HOST, 1));
      hostNextStart.current[i] = now + pause;
      const m = hostParticleRefs.current[i];
      if (m) {
         m.visible = false;
         m.position.set(99999, 99999, 99999);
      }
   };

   useFrame(state => {
      const now = state.clock.elapsedTime;

      // 1) Drawer → Cylinder
      drawerParticleRefs.current.forEach((m, i) => {
         if (!m) return;
         const data = drawerParticleData.current[i];
         if (!data) return;

         // CAP 내에서만 돈다. 개수 제한은 "새 시작 금지"로만 처리.
         if (i >= N_DRAWER && !drawerActive.current[i]) {
            return; // 새로 시작하지 않음(하지만 이미 달리는 건 끝까지 달리게 둠)
         }

         // (a) Check if inactive and should start
         if (!drawerActive.current[i]) {
            if (now >= drawerNextStart.current[i]) {
               startDrawerCycle(i, now);
            } else {
               return; // Don't do anything
            }
         }

         // (b) Warmup frames: keep particle at start position, Trail won't render
         if (drawerWarmup.current[i] > 0) {
            drawerWarmup.current[i]--;
            // Keep particle at exact start position during warmup
            if (data.startPos) {
               m.position.set(...data.startPos);
               m.visible = true;
            }
            return;
         }

         // (c) Normal movement
         const elapsed = now - drawerStartTime.current[i];
         const progress = elapsed / data.duration;

         if (progress >= 1) {
            endDrawerCycle(i, now);
         } else {
            const [x, y, z] = interpolatePosition(data.startPos, cylinderPosition, progress);

            // Check cylinder collision
            if (checkCylinderCollision([x, y, z], cylinderPosition)) {
               endDrawerCycle(i, now);
               return;
            }

            m.position.set(x, y, z);

            // const material = m.material as THREE.MeshStandardMaterial;
            /*if (progress < 0.1) {
               material.opacity = progress / 0.1;
            } else if (progress > 0.9) {
               material.opacity = (1 - progress) / 0.1;
            } else {
               material.opacity = 1;
            }*/

            m.visible = true;
         }
      });

      // 2) Cylinder → Host
      hostParticleRefs.current.forEach((m, i) => {
         if (!m) return;
         const data = hostParticleData.current[i];
         if (!data) return;

         // CAP 내에서만 돈다. 개수 제한은 "새 시작 금지"로만 처리.
         if (i >= N_HOST && !hostActive.current[i]) {
            return; // 새로 시작하지 않음(하지만 이미 달리는 건 끝까지 달리게 둠)
         }

         if (!hostActive.current[i]) {
            if (now >= hostNextStart.current[i]) {
               startHostCycle(i, now);
            } else {
               return;
            }
         }

         if (hostWarmup.current[i] > 0) {
            hostWarmup.current[i]--;
            // Keep particle at exact start position during warmup
            if (data.startPos) {
               m.position.set(...data.startPos);
               m.visible = true;
            }
            return;
         }

         const elapsed = now - hostStartTime.current[i];
         const progress = elapsed / data.duration;

         if (progress >= 1) {
            endHostCycle(i, now);
         } else {
            const [x, y, z] = interpolatePosition(data.startPos, data.endPos, progress);

            m.position.set(x, y, z);

            // const material = m.material as THREE.MeshStandardMaterial;
            /*if (progress < 0.1) {
               material.opacity = progress / 0.1;
            } else if (progress > 0.9) {
               material.opacity = (1 - progress) / 0.1;
            } else {
               material.opacity = 1;
            }*/

            m.visible = true;
         }
      });
   });

   return (
      <group position={[0, -5, 0]}>
         {/* Drawer particles */}
         {Array.from({ length: DRAWER_CAP }, (_, i) => (
            <group
               key={`drawer-particle-${i}`}
               ref={ref => {
                  if (ref) drawerParticleRefs.current[i] = ref;
               }}
               visible={false}
            />
         ))}

         {/* Host particles */}
         {Array.from({ length: HOST_CAP }, (_, i) => (
            <group
               key={`host-particle-${i}`}
               ref={ref => {
                  if (ref) hostParticleRefs.current[i] = ref;
               }}
               visible={false}
            />
         ))}
         {/* Cyan: Drawer → Cylinder 꼬리(잔상) */}
         <GhostTrails targetsRef={drawerParticleRefs} color={Colors.cyan[300]} maxPer={14} life={0.2} spawnInterval={0.02} sizeStart={6} sizeEnd={0} />

         {/* Orange: Cylinder → Host 꼬리(잔상) */}
         <GhostTrails targetsRef={hostParticleRefs} color={Colors.orange[300]} maxPer={14} life={0.2} spawnInterval={0.02} sizeStart={6} sizeEnd={0} />
      </group>
   );
};

// Physics sphere component with central gravity and continuous energy
const PhysicsSphere = ({
   position,
   color,
   centerPosition,
}: {
   position: [number, number, number];
   color: string;
   centerPosition: [number, number, number];
}) => {
   const [ref, api] = useSphere(() => ({
      mass: 1,
      position,
      material: { restitution: 0.98, friction: 0.005 }, // Even higher restitution, lower friction for more energy retention
      args: [1.5], // radius
      velocity: [(Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 8], // Doubled initial velocity
   }));

   const velocityRef = useRef([0, 0, 0]);
   const frameCount = useRef(0);

   // Subscribe to velocity once to avoid memory leaks
   useEffect(() => {
      const unsubscribe = api.velocity.subscribe(v => {
         velocityRef.current = v;
      });
      return unsubscribe;
   }, [api]);

   // Apply continuous forces to keep spheres moving
   useFrame(state => {
      if (ref.current) {
         const pos = ref.current.position;
         const center = new THREE.Vector3(...centerPosition);
         const currentPos = new THREE.Vector3(pos.x, pos.y, pos.z);
         const time = state.clock.elapsedTime;

         // Check velocity more frequently for more active movement
         frameCount.current++;
         if (frameCount.current % 15 === 0) {
            // Reduced from 30 to 15
            const velocity = velocityRef.current;
            const speed = Math.sqrt(velocity[0] * velocity[0] + velocity[1] * velocity[1] + velocity[2] * velocity[2]);

            // If speed is too low, add stronger energy boost
            if (speed < 3) {
               // Increased threshold from 2 to 3
               const boostImpulse = new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 5);
               api.applyImpulse([boostImpulse.x, boostImpulse.y, boostImpulse.z], [0, 0, 0]);
            }
         }

         // Calculate direction towards center
         const direction = center.clone().sub(currentPos).normalize();
         const distance = currentPos.distanceTo(center);

         // Apply forces every frame for more active movement
         // Apply stronger orbital force (perpendicular to center direction)
         const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
         const orbitalForce = perpendicular.multiplyScalar(2.5); // Increased from 1.0 to 2.5

         // Apply stronger chaotic forces with more variation
         const chaoticForce = new THREE.Vector3(
            Math.sin(time * 5 + pos.x) * 1.2 + Math.cos(time * 7) * 0.8,
            Math.sin(time * 4 + pos.y) * 1.0 + Math.cos(time * 6) * 0.6,
            Math.cos(time * 6 + pos.z) * 1.2 + Math.sin(time * 8) * 0.8,
         );

         // Apply central gravity with more strength
         const gravityStrength = Math.min(distance * 0.08, 1.5); // Increased multiplier and max
         const centralForce = direction.multiplyScalar(gravityStrength);

         // Add stronger upward force with variation
         const antiGravity = new THREE.Vector3(0, 1.0 + Math.sin(time * 3) * 0.5, 0);

         // Add turbulence for more chaotic movement
         const turbulence = new THREE.Vector3(
            Math.sin(time * 4 + distance) * 0.8,
            Math.cos(time * 3.5 + distance) * 0.6,
            Math.sin(time * 5.5 + distance) * 0.8,
         );

         // Combine all forces
         const totalForce = orbitalForce.add(chaoticForce).add(centralForce).add(antiGravity).add(turbulence);

         api.applyForce([totalForce.x, totalForce.y, totalForce.z], [0, 0, 0]);

         // More frequent and stronger random impulses
         if (Math.random() < 0.008) {
            // Increased from 0.003 to 0.008
            const impulse = new THREE.Vector3(
               (Math.random() - 0.5) * 4, // Increased from 2 to 4
               (Math.random() - 0.5) * 3, // Increased from 1.5 to 3
               (Math.random() - 0.5) * 4, // Increased from 2 to 4
            );
            api.applyImpulse([impulse.x, impulse.y, impulse.z], [0, 0, 0]);
         }
      }
   });

   return (
      <Sphere ref={ref as any} args={[1.5]} castShadow>
         <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} metalness={0.6} roughness={0.4} />
      </Sphere>
   );
};

// Physics cylinder boundary using individual box walls
const CylinderBoundary = ({ position }: { position: [number, number, number] }) => {
   const cylinderRadius = 24; // Smaller radius to keep spheres well inside
   const cylinderHeight = 35; // Taller walls
   const wallThickness = 8; // Much thicker walls

   // Create 16 walls in a circle - each wall must be declared separately
   const angle0 = (0 / 16) * Math.PI * 2;
   useBox(() => ({
      mass: 0,
      position: [position[0] + Math.cos(angle0) * cylinderRadius, position[1], position[2] + Math.sin(angle0) * cylinderRadius],
      args: [wallThickness, cylinderHeight, wallThickness * 2],
      material: { restitution: 0.95, friction: 0.01 },
      type: 'Static',
      rotation: [0, angle0, 0],
   }));

   const angle1 = (1 / 16) * Math.PI * 2;
   useBox(() => ({
      mass: 0,
      position: [position[0] + Math.cos(angle1) * cylinderRadius, position[1], position[2] + Math.sin(angle1) * cylinderRadius],
      args: [wallThickness, cylinderHeight, wallThickness * 2],
      material: { restitution: 0.95, friction: 0.01 },
      type: 'Static',
      rotation: [0, angle1, 0],
   }));

   const angle2 = (2 / 16) * Math.PI * 2;
   useBox(() => ({
      mass: 0,
      position: [position[0] + Math.cos(angle2) * cylinderRadius, position[1], position[2] + Math.sin(angle2) * cylinderRadius],
      args: [wallThickness, cylinderHeight, wallThickness * 2],
      material: { restitution: 0.95, friction: 0.01 },
      type: 'Static',
      rotation: [0, angle2, 0],
   }));

   const angle3 = (3 / 16) * Math.PI * 2;
   useBox(() => ({
      mass: 0,
      position: [position[0] + Math.cos(angle3) * cylinderRadius, position[1], position[2] + Math.sin(angle3) * cylinderRadius],
      args: [wallThickness, cylinderHeight, wallThickness * 2],
      material: { restitution: 0.95, friction: 0.01 },
      type: 'Static',
      rotation: [0, angle3, 0],
   }));

   const angle4 = (4 / 16) * Math.PI * 2;
   useBox(() => ({
      mass: 0,
      position: [position[0] + Math.cos(angle4) * cylinderRadius, position[1], position[2] + Math.sin(angle4) * cylinderRadius],
      args: [wallThickness, cylinderHeight, wallThickness * 2],
      material: { restitution: 0.95, friction: 0.01 },
      type: 'Static',
      rotation: [0, angle4, 0],
   }));

   const angle5 = (5 / 16) * Math.PI * 2;
   useBox(() => ({
      mass: 0,
      position: [position[0] + Math.cos(angle5) * cylinderRadius, position[1], position[2] + Math.sin(angle5) * cylinderRadius],
      args: [wallThickness, cylinderHeight, wallThickness * 2],
      material: { restitution: 0.95, friction: 0.01 },
      type: 'Static',
      rotation: [0, angle5, 0],
   }));

   const angle6 = (6 / 16) * Math.PI * 2;
   useBox(() => ({
      mass: 0,
      position: [position[0] + Math.cos(angle6) * cylinderRadius, position[1], position[2] + Math.sin(angle6) * cylinderRadius],
      args: [wallThickness, cylinderHeight, wallThickness * 2],
      material: { restitution: 0.95, friction: 0.01 },
      type: 'Static',
      rotation: [0, angle6, 0],
   }));

   const angle7 = (7 / 16) * Math.PI * 2;
   useBox(() => ({
      mass: 0,
      position: [position[0] + Math.cos(angle7) * cylinderRadius, position[1], position[2] + Math.sin(angle7) * cylinderRadius],
      args: [wallThickness, cylinderHeight, wallThickness * 2],
      material: { restitution: 0.95, friction: 0.01 },
      type: 'Static',
      rotation: [0, angle7, 0],
   }));

   const angle8 = (8 / 16) * Math.PI * 2;
   useBox(() => ({
      mass: 0,
      position: [position[0] + Math.cos(angle8) * cylinderRadius, position[1], position[2] + Math.sin(angle8) * cylinderRadius],
      args: [wallThickness, cylinderHeight, wallThickness * 2],
      material: { restitution: 0.95, friction: 0.01 },
      type: 'Static',
      rotation: [0, angle8, 0],
   }));

   const angle9 = (9 / 16) * Math.PI * 2;
   useBox(() => ({
      mass: 0,
      position: [position[0] + Math.cos(angle9) * cylinderRadius, position[1], position[2] + Math.sin(angle9) * cylinderRadius],
      args: [wallThickness, cylinderHeight, wallThickness * 2],
      material: { restitution: 0.95, friction: 0.01 },
      type: 'Static',
      rotation: [0, angle9, 0],
   }));

   const angle10 = (10 / 16) * Math.PI * 2;
   useBox(() => ({
      mass: 0,
      position: [position[0] + Math.cos(angle10) * cylinderRadius, position[1], position[2] + Math.sin(angle10) * cylinderRadius],
      args: [wallThickness, cylinderHeight, wallThickness * 2],
      material: { restitution: 0.95, friction: 0.01 },
      type: 'Static',
      rotation: [0, angle10, 0],
   }));

   const angle11 = (11 / 16) * Math.PI * 2;
   useBox(() => ({
      mass: 0,
      position: [position[0] + Math.cos(angle11) * cylinderRadius, position[1], position[2] + Math.sin(angle11) * cylinderRadius],
      args: [wallThickness, cylinderHeight, wallThickness * 2],
      material: { restitution: 0.95, friction: 0.01 },
      type: 'Static',
      rotation: [0, angle11, 0],
   }));

   const angle12 = (12 / 16) * Math.PI * 2;
   useBox(() => ({
      mass: 0,
      position: [position[0] + Math.cos(angle12) * cylinderRadius, position[1], position[2] + Math.sin(angle12) * cylinderRadius],
      args: [wallThickness, cylinderHeight, wallThickness * 2],
      material: { restitution: 0.95, friction: 0.01 },
      type: 'Static',
      rotation: [0, angle12, 0],
   }));

   const angle13 = (13 / 16) * Math.PI * 2;
   useBox(() => ({
      mass: 0,
      position: [position[0] + Math.cos(angle13) * cylinderRadius, position[1], position[2] + Math.sin(angle13) * cylinderRadius],
      args: [wallThickness, cylinderHeight, wallThickness * 2],
      material: { restitution: 0.95, friction: 0.01 },
      type: 'Static',
      rotation: [0, angle13, 0],
   }));

   const angle14 = (14 / 16) * Math.PI * 2;
   useBox(() => ({
      mass: 0,
      position: [position[0] + Math.cos(angle14) * cylinderRadius, position[1], position[2] + Math.sin(angle14) * cylinderRadius],
      args: [wallThickness, cylinderHeight, wallThickness * 2],
      material: { restitution: 0.95, friction: 0.01 },
      type: 'Static',
      rotation: [0, angle14, 0],
   }));

   const angle15 = (15 / 16) * Math.PI * 2;
   useBox(() => ({
      mass: 0,
      position: [position[0] + Math.cos(angle15) * cylinderRadius, position[1], position[2] + Math.sin(angle15) * cylinderRadius],
      args: [wallThickness, cylinderHeight, wallThickness * 2],
      material: { restitution: 0.95, friction: 0.01 },
      type: 'Static',
      rotation: [0, angle15, 0],
   }));

   // Bottom floor
   useBox(() => ({
      mass: 0,
      position: [position[0], position[1] - cylinderHeight / 2 - 1 - 3, position[2]],
      args: [cylinderRadius * 2, 2, cylinderRadius * 2],
      material: { restitution: 0.95, friction: 0.01 },
      type: 'Static',
   }));

   // Top ceiling (lowered by 5 units)
   useBox(() => ({
      mass: 0,
      position: [position[0], position[1] + cylinderHeight / 2 + 1 - 5, position[2]],
      args: [cylinderRadius * 2, 2, cylinderRadius * 2],
      material: { restitution: 0.95, friction: 0.01 },
      type: 'Static',
   }));

   return null;
};

// Physics spheres container
const PhysicsSpheresContainer = ({ centerPosition }: { centerPosition: [number, number, number] }) => {
   const sphereColors = [
      Colors.red[400],
      Colors.blue[400],
      Colors.green[400],
      Colors.yellow[400],
      Colors.purple[400],
      Colors.cyan[400],
      Colors.orange[400],
      Colors.pink[400],
      Colors.teal[400],
      Colors.indigo[400],
      Colors.lime[400],
      Colors.amber[400],
      Colors.emerald[400],
      Colors.violet[400],
      Colors.sky[400],
      Colors.rose[400],
      Colors.fuchsia[400],
      Colors.slate[400],
      Colors.zinc[400],
      Colors.stone[400],
   ];

   return (
      <group>
         <CylinderBoundary position={centerPosition} />
         {Array.from({ length: 20 }, (_, i) => {
            // Random position safely inside cylinder boundary
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 20; // Well inside wall boundary (24)
            const height = (Math.random() - 0.5) * 25; // Reduced height range

            return (
               <PhysicsSphere
                  key={i}
                  position={[centerPosition[0] + Math.cos(angle) * radius, centerPosition[1] + height, centerPosition[2] + Math.sin(angle) * radius]}
                  color={Colors.blue[500]}
                  centerPosition={centerPosition}
               />
            );
         })}
      </group>
   );
};

const Table = ({ position, innerRadius, outerRadius }: { position: [number, number, number]; innerRadius: number; outerRadius: number }) => {
   // Calculate positions and rotations for drawers - similar to server cases layout
   const drawerWidth = 25; // This becomes the depth when rotated
   const drawerDepth = 15; // This becomes the width when rotated

   // Server positions and rotations - evenly spaced on right 1/2 of ring
   const drawerData: { position: [number, number, number]; rotation: [number, number, number] }[] = Array.from({ length: 6 }, (_, i) => {
      // Right 1/2 of circle: from -45° to 135° (180° total arc)
      const startAngle = -Math.PI / 4; // -45°
      const totalArc = -Math.PI * 0.6; // 180° arc (1/2 circle)
      const angle = startAngle + (i / 3) * totalArc; // Divide by 7 to get 8 evenly spaced points

      // Position at outer edge of ring
      const radius = innerRadius + drawerDepth / 0.77; // Position so back face touches ring

      // Y position: center of ring (ring height is 20, so center is at 10)
      const yPosition = 1.1; // Center between top and bottom of ring

      return {
         position: [Math.cos(angle) * radius, yPosition, Math.sin(angle) * radius],
         rotation: [0, -angle + Math.PI, 0], // Rotate to face center, with back touching ring
      };
   });

   const serverData: { position: [number, number, number]; rotation: [number, number, number] }[] = Array.from({ length: 10 }, (_, i) => {
      // Right 1/2 of circle: from -45° to 135° (180° total arc)
      const startAngle = -Math.PI / 4; // -45°
      const totalArc = Math.PI * 0.8; // host 장비 배치 기준(반지름 x 0.8)
      const angle = startAngle + (i / 7) * totalArc; // Divide by 7 to get 8 evenly spaced points

      // Position at outer edge of ring
      const serverDepth = 20; // depth of server case
      const radius = innerRadius + serverDepth / 1.03; // Position so back face touches ring

      // Y position: center of ring (ring height is 20, so center is at 10)
      const yPosition = 3.1; // Center between top and bottom of ring

      return {
         position: [Math.cos(angle) * radius, yPosition, Math.sin(angle) * radius],
         rotation: [0, -angle + Math.PI / 2, 0], // Rotate to face center, with back touching ring
      };
   });

   // Separate positions for different particle flows
   const drawerPositions: [number, number, number][] = drawerData.filter((d, i) => [2, 3].includes(i)).map(d => d.position);
   const hostPositions: [number, number, number][] = serverData.filter((_, i) => i > 0 && i < serverData.length - 1).map(s => s.position);
   const cylinderPosition: [number, number, number] = [0, 5, 0];
   const texturesRef = useRef<any>({});
   const [textureReady, setTextureReady] = useState(false);
   const poolAnimationRefs = useRef<
      Array<{
         meshRef: RefObject<THREE.Mesh | null>;
         cloudsRef: RefObject<THREE.Mesh | null>;
      }>
   >([]);

   useEffect(() => {
      (async () => {
         texturesRef.current.albedoMap = await loadTexture('/3d/textures/earth/Albedo.jpg');
         texturesRef.current.bumpMap = await loadTexture('/3d/textures/earth/Bump.jpg');
         texturesRef.current.oceanMap = await loadTexture('/3d/textures/earth/Ocean.png');
         // texturesRef.current.lightsMap = await loadTexture('/3d/textures/earth/night_lights_modified.png');
         texturesRef.current.cloudsMap = await loadTexture('/3d/textures/earth/Clouds.png');

         // Rack / Server 텍스처
         texturesRef.current.rackFront = await loadTexture('/3d/textures/rack/rack-front.png');
         texturesRef.current.rackSide = await loadTexture('/3d/textures/rack/rack-side.png');
         // texturesRef.current.rackTop = await loadTexture('/3d/textures/rack-top.jpg');
         texturesRef.current.serverFront = await loadTexture('/3d/textures/rack/server-front-half.png');
         setTextureReady(true);
      })();
   }, []);

   useFrame(() => {
      poolAnimationRefs.current.forEach(poolRefs => {
         if (poolRefs.meshRef.current) {
            poolRefs.meshRef.current.rotation.y += 0.002;
         }
         if (poolRefs.cloudsRef.current) {
            poolRefs.cloudsRef.current.rotation.y -= 0.004;
         }
      });
   });

   const allPools = useMemo(() => mockTopologyData.pools.map((_, i) => ({ index: i })), []);
   const poolPositions = useMemo(() => new AdaptiveLayoutManager().applyLayout(allPools, 'spiral', { spacing: 10 }), []);

   // 랙 배치를 위한 포지셔닝 헬퍼 함수들
   const outwardFromCenter = (p: [number, number, number]) => {
      const v = new THREE.Vector3(p[0], 0, p[2]).normalize();
      return [v.x, 0, v.z] as [number, number, number];
   };
   const placeBehind = (p: [number, number, number], dist: number) => {
      const n = outwardFromCenter(p);
      return [p[0] + n[0] * dist, 0, p[2] + n[2] * dist] as [number, number, number];
   };
   const faceTowardCenterY = (p: [number, number, number]) => {
      const ang = Math.atan2(p[2] - 0, p[0] - 0) + Math.PI; // 링 중심(0,0)에 정면
      return [0, ang, 0] as [number, number, number];
   };

   // 랙 배치 기준점(좌측 drawer 2개의 중간)
   const dL = drawerData[2].position;
   const dR = drawerData[3].position;
   const mid: [number, number, number] = [(dL[0] + dR[0]) / 2, 0, (dL[2] + dR[2]) / 2];
   const base = placeBehind(mid, 80); // 테이블로부터 50만큼 바깥
   const baseRot = faceTowardCenterY(base);

   // 가로 나열을 위한 접선 벡터(좌우로 벌리기)
   const center = new THREE.Vector3(0, 0, 0);
   const dir = new THREE.Vector3(base[0], 0, base[2]).sub(center).normalize();
   const tangent = new THREE.Vector3(-dir.z, 0, dir.x); // 좌우 방향
   const gap = 40; // 랙 간격

   const rackPos = [
      [base[0] - tangent.x * gap, 18, base[2] - tangent.z * gap] as [number, number, number],
      [base[0], 18, base[2]] as [number, number, number],
      [base[0] + tangent.x * gap, 18, base[2] + tangent.z * gap] as [number, number, number],
   ];

   return (
      <group position={position}>
         <RoundMirrorTextTable
            topCrystal
            sideCrystal
            position={[0, 0, 0]}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            rotation={[0, 0, 0]}
            height={10}
            castShadow
            bottomText="OKESTRO  *  CONTRABASS  SDS+"
            bottomTextColor={Colors.neutral[200]}
            segment={1024}
         />

         <Text3D
            scale={10}
            position={[-50, 1, -(innerRadius - 13.5)]}
            rotation={[0, Math.PI / 6, 0]}
            fontSize={0.7}
            font="/fonts/orbitron/Orbitron-Bold.ttf"
            fontWeight={700}
            color={Colors.neutral[400]}
            // @ts-ignore
            curveRadius={8.5}
            letterSpacing={0.02}
            anchorX="center"
            anchorY="middle"
         >
            {'     '}IaaS
         </Text3D>
         <Text3D
            scale={10}
            position={[-90, 1, -(innerRadius - 58)]}
            rotation={[0, Math.PI / 2.75, 0]}
            fontSize={0.7}
            font="/fonts/orbitron/Orbitron-Bold.ttf"
            fontWeight={700}
            color={Colors.neutral[400]}
            // @ts-ignore
            curveRadius={8.5}
            letterSpacing={0.02}
            anchorX="center"
            anchorY="middle"
         >
            {'    '}
            PaaS
         </Text3D>

         {/* Left side drawers */}
         <Drawer position={drawerData[2].position} rotation={drawerData[2].rotation} type="boxes" />
         <Drawer position={drawerData[3].position} rotation={drawerData[3].rotation} type="icosahedrons" />

         {/* Server Racks (3 racks behind drawers) */}
         {textureReady && (
            <group>
               {/* servers per rack: 3, 4, 4 */}
               <group position={rackPos[0]} rotation={baseRot}>
                  <ServerRack servers={3} tex={texturesRef.current} />
               </group>
               <group position={rackPos[1]} rotation={baseRot}>
                  <ServerRack servers={4} tex={texturesRef.current} />
               </group>
               <group position={rackPos[2]} rotation={baseRot}>
                  <ServerRack servers={4} tex={texturesRef.current} doorHinge="right" />
               </group>
            </group>
         )}

         <ServerRackModel scale={30} position={[-190, 18.5, -70]} rotation={[0, Math.PI / 4, 0]} castShadow />

         {/* Right side server cases */}
         {serverData
            .filter((_, i) => i > 0 && i < serverData.length - 1)
            .map((data, i) => (
               <ServerCase key={i} position={data.position} rotation={data.rotation} />
            ))}

         {textureReady &&
            mockTopologyData.pools.map((pool, index) => {
               if (!poolAnimationRefs.current[index]) {
                  poolAnimationRefs.current[index] = {
                     meshRef: { current: null },
                     cloudsRef: { current: null },
                  };
               }
               const pos = poolPositions[index].position;
               return (
                  <PoolNode
                     key={pool.id}
                     poolData={pool}
                     position={[pos[0], 30, pos[2]]}
                     textures={texturesRef.current}
                     animationRefs={poolAnimationRefs.current[index]}
                  />
               );
            })}

         {/* Physics spheres inside cylinder */}
         <Physics gravity={[0, 0, 0]} broadphase="SAP">
            <PhysicsSpheresContainer centerPosition={[0, 10, 0]} />
         </Physics>

         {/* Flying data particles */}
         <DataParticles drawerPositions={drawerPositions} hostPositions={hostPositions} cylinderPosition={cylinderPosition} />
      </group>
   );
};

const GroundPlane = () => {
   const groundTexture = useTexture('/3d/textures/planet/mars-ground.jpg');

   // Configure texture to repeat instead of stretch
   groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
   groundTexture.repeat.set(20, 20); // Repeat 20x20 times across the plane

   return (
      <Plane position={[0, 0, 0]} args={[500, 500]} rotation-x={-Math.PI / 2} receiveShadow>
         <meshStandardMaterial map={groundTexture} metalness={0.1} roughness={0.8} />
      </Plane>
   );
};

const WorldTrafficView: FC<Props> = () => {
   return (
      <>
         <AppHeader />
         <div className="w-screen h-screen overflow-hidden">
            <Canvas
               camera={{ position: [-150, 120, 50], fov: 60, near: 0.1, far: 2000 }}
               dpr={[1, 1.5]}
               gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
               shadows
               style={{ background: Colors.neutral[900] }}
            >
               <OrbitControls enableDamping dampingFactor={0.05} enablePan autoRotate autoRotateSpeed={-0.1} />
               <Environment files="/3d/background/datacenter-blue.jpg" background />
               <EffectComposer>
                  <Bloom mipmapBlur={false} luminanceThreshold={0.5} intensity={0.7} radius={0.3} />
                  <BrightnessContrast brightness={0.08} contrast={0.25} />
               </EffectComposer>

               {/* Ambient light for overall illumination */}
               <ambientLight intensity={0.3} color={Colors.blue[100]} />

               {/* Main directional light */}
               <directionalLight
                  args={['#ffffff', 3]}
                  position={[150, 150, 150]}
                  castShadow
                  shadow-mapSize={[2048, 2048]}
                  shadow-camera-left={-400}
                  shadow-camera-right={400}
                  shadow-camera-top={400}
                  shadow-camera-bottom={-400}
                  shadow-camera-near={0.1}
                  shadow-camera-far={1000}
               />

               {/* Additional point lights for atmosphere */}
               <pointLight args={[Colors.blue[300], 2, 100]} position={[0, 50, 0]} />
               <pointLight args={[Colors.cyan[300], 1, 80]} position={[-100, 30, -100]} />
               <pointLight args={[Colors.teal[300], 1, 80]} position={[100, 30, 100]} />

               {/* Main table and components */}
               <Table position={[0, 10, 0]} innerRadius={100} outerRadius={130} />

               {/* Central cylinder */}
               <Cylinder args={[30, 30, 35, 32]} position={[0, 15, 0]}>
                  <meshPhysicalMaterial
                     color={Colors.neutral[200]}
                     metalness={0.8}
                     roughness={0.2}
                     transparent
                     opacity={0.4}
                     transmission={0.6}
                     thickness={2}
                  />
               </Cylinder>
               <mesh position={[0, 32.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[30, 0.2, 8, 64]} />
                  <meshStandardMaterial color={0x06b6d4} emissive={0x06b6d4} emissiveIntensity={1.0} transparent={false} />
               </mesh>
               <mesh position={[0, 15, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[100, 0.2, 8, 64]} />
                  <meshStandardMaterial color={0x06b6d4} emissive={0x06b6d4} emissiveIntensity={1.0} transparent={false} />
               </mesh>

               {/* Ground plane */}
               <GroundPlane />
            </Canvas>
         </div>
      </>
   );
};

export default WorldTrafficView;
