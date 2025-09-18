'use client';

import { FC, RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Colors from '@/utils/color';
import { Box, Cylinder, Environment, Icosahedron, OrbitControls, Plane, Sphere } from '@react-three/drei';
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
            <mesh ref={meshRef}>
               <sphereGeometry args={[4, 32, 32]} />
               {textures?.albedoMap ? (
                  <meshStandardMaterial map={textures.albedoMap} bumpMap={textures.bumpMap} bumpScale={0.03} metalness={0.1} metalnessMap={textures.oceanMap} />
               ) : (
                  <meshStandardMaterial color={0x4169e1} emissive={new THREE.Color(0xffff00)} emissiveIntensity={0.6} />
               )}
            </mesh>
            <mesh ref={cloudsRef}>
               <sphereGeometry args={[4.1, 32, 32]} />
               <meshStandardMaterial map={textures?.cloudsMap || undefined} transparent opacity={0.5} depthWrite={false} />
            </mesh>
            <Atmosphere radius={4} intensity={1.1} power={2.0} color={Colors.emerald[400]} />
         </>
         {/* Pool name text - positioned above the sphere */}
         <Text3D position={[0, 10, 0]} fontSize={1.5} color={0xffffff} anchorX="center" anchorY="top" outlineColor={Colors.blue[600]} outlineWidth={0.1}>
            {poolData.name}
         </Text3D>
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
            <meshStandardMaterial color={Colors.neutral[700]} metalness={0.8} roughness={0.2} emissive={Colors.purple[400]} emissiveIntensity={0.25} />
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

// Server case component for right side
const ServerCase = ({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) => {
   return (
      <group position={position} rotation={rotation}>
         <Box args={[20, 4, 40]} position={[0, 0, 0]}>
            <meshPhysicalMaterial color={Colors.neutral[800]} metalness={0.9} roughness={0.1} />
         </Box>
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
   const HOST_CAP   = 36; // host 최대값

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
      drawerParticleData.current = Array(DRAWER_CAP).fill(null).map(() => ({
         startTime: 0,
         duration: 0,
         startPos: [0, 0, 0] as [number, number, number],
      }));

      hostParticleData.current = Array(HOST_CAP).fill(null).map(() => ({
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
      const drawerIndex  = Math.floor(i / 3);
      const offsetIndex  = i % 3;
      const baseDrawerPos = drawerPositions[drawerIndex % drawerPositions.length];
      const startPos = getOffsetPosition(baseDrawerPos, 'drawer', offsetIndex);
      const duration = (3 + Math.random() * 2) / drawerSpeedMultiplier; // 현재 속도 반영
      drawerParticleData.current[i] = { startTime: now, duration, startPos };

      const m = drawerParticleRefs.current[i];
      if (m) { m.position.set(...startPos); m.visible = true; }

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
      if (m) { m.visible = false; m.position.set(99999, 99999, 99999); }
   };

   const startHostCycle = (i: number, now: number) => {
      hostCycleId.current[i]++; hostWarmup.current[i] = 2; hostActive.current[i]=true; hostStartTime.current[i]=now;

      // ★ 매 사이클 시작 시 파라미터 계산
      const hostIndex = Math.floor(i / 3);
      const offsetIndex = i % 3;
      const endPos = getOffsetPosition(hostPositions[hostIndex % hostPositions.length], 'host', offsetIndex);
      // 실린더에서 해당 host 쪽으로 시작점 계산
      const dx = endPos[0]-cylinderPosition[0], dz = endPos[2]-cylinderPosition[2];
      const angle = Math.atan2(dz, dx) + (Math.random()-0.5)*0.3;
      const R = 30;
      const startPos: [number, number, number] = [
        cylinderPosition[0] + Math.cos(angle)*R,
        cylinderPosition[1] + (Math.random()-0.5)*20,
        cylinderPosition[2] + Math.sin(angle)*R,
      ];
      const duration = (4 + Math.random()*2) / hostSpeedMultiplier;
      hostParticleData.current[i] = { startTime: now, duration, startPos, endPos };

      const m = hostParticleRefs.current[i];
      if (m) { m.position.set(...startPos); m.visible = true; }

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
      if (m) { m.visible = false; m.position.set(99999, 99999, 99999); }
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
            return;  // 새로 시작하지 않음(하지만 이미 달리는 건 끝까지 달리게 둠)
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
            return;  // 새로 시작하지 않음(하지만 이미 달리는 건 끝까지 달리게 둠)
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
      material: { restitution: 0.95, friction: 0.01 }, // High restitution, very low friction to maintain energy
      args: [1.5], // radius
      velocity: [(Math.random() - 0.5) * 4, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 4],
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

         // Check velocity every 30 frames to improve performance
         frameCount.current++;
         if (frameCount.current % 30 === 0) {
            const velocity = velocityRef.current;
            const speed = Math.sqrt(velocity[0] * velocity[0] + velocity[1] * velocity[1] + velocity[2] * velocity[2]);

            // If speed is too low, add energy
            if (speed < 2) {
               const boostImpulse = new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 3);
               api.applyImpulse([boostImpulse.x, boostImpulse.y, boostImpulse.z], [0, 0, 0]);
            }
         }

         // Calculate direction towards center
         const direction = center.clone().sub(currentPos).normalize();
         const distance = currentPos.distanceTo(center);

         // Apply forces less frequently to improve performance
         if (frameCount.current % 3 === 0) {
            // Apply orbital force (perpendicular to center direction)
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            const orbitalForce = perpendicular.multiplyScalar(1.0);

            // Apply random chaotic force to prevent settling
            const chaoticForce = new THREE.Vector3(Math.sin(time * 3) * 0.5, Math.sin(time * 2) * 0.4, Math.cos(time * 4) * 0.5);

            // Apply weak central gravity
            const gravityStrength = Math.min(distance * 0.04, 0.8);
            const centralForce = direction.multiplyScalar(gravityStrength);

            // Add upward force to counteract gravity settling
            const antiGravity = new THREE.Vector3(0, 0.5, 0);

            // Combine all forces
            const totalForce = orbitalForce.add(chaoticForce).add(centralForce).add(antiGravity);

            api.applyForce([totalForce.x, totalForce.y, totalForce.z], [0, 0, 0]);
         }

         // Less frequent random impulses to maintain energy
         if (Math.random() < 0.003) {
            // 0.3% chance each frame
            const impulse = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 2);
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
      position: [position[0], position[1] - cylinderHeight / 2 - 1, position[2]],
      args: [cylinderRadius * 2, 2, cylinderRadius * 2],
      material: { restitution: 0.95, friction: 0.01 },
      type: 'Static',
   }));

   // Top ceiling
   useBox(() => ({
      mass: 0,
      position: [position[0], position[1] + cylinderHeight / 2 + 1, position[2]],
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

   return (
      <group position={position}>
         <RoundMirrorTextTable
            topCrystal
            sideMirror
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

         {/* Right side server cases */}
         {serverData
            .filter((_, i) => i > 0 && i < serverData.length - 1)
            .map((data, i) => (
               <ServerCase key={i} position={data.position} rotation={data.rotation} />
            ))}

         {/* Central pool spheres */}
         {/*<PoolSpheres centerPosition={[0, 30, 0]} />*/}

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
                     position={[pos[0], 40, pos[2]]}
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
               <OrbitControls enableDamping dampingFactor={0.05} enablePan />
               <Environment preset="night" />
               <EffectComposer>
                  <Bloom mipmapBlur={false} luminanceThreshold={0.7} intensity={0.7} radius={0.5} />
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
               <Cylinder args={[30, 30, 35, 32]} position={[0, 20, 0]} castShadow receiveShadow>
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
               <mesh position={[0, 37.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[30, 0.2, 8, 64]} />
                  <meshStandardMaterial color={0x06b6d4} emissive={0x06b6d4} emissiveIntensity={1.0} transparent={false} />
               </mesh>
               <mesh position={[0, 15, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[100, 0.2, 8, 64]} />
                  <meshStandardMaterial color={0x06b6d4} emissive={0x06b6d4} emissiveIntensity={1.0} transparent={false} />
               </mesh>

               {/* Ground plane */}
               <Plane position={[0, 0, 0]} args={[600, 600]} rotation-x={-Math.PI / 2} receiveShadow>
                  <meshStandardMaterial color={Colors.neutral[800]} metalness={0.1} roughness={0.8} />
               </Plane>
            </Canvas>
         </div>
      </>
   );
};

export default WorldTrafficView;
