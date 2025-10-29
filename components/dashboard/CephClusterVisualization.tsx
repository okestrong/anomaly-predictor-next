'use client';

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Circle, Dodecahedron, Environment, OrbitControls, Ring, Sphere, Text, useTexture } from '@react-three/drei';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import * as THREE from 'three';
import { ClusterTopologyAPI, ClusterTopologyData } from '@/lib/api/dashboardApi';
import { formatBytes } from '@/lib/formatUtils';
import Colors from '@/utils/color';

// Types
interface OSDData {
   id: string;
   health: 'up' | 'warning' | 'down';
   capacity: number;
   usage: number;
   host: string;
   position: [number, number, number];
}

interface MonitorData {
   id: string;
   position: [number, number, number];
   health: 'up' | 'warning' | 'down';
}

interface HostData {
   id: string;
   name: string;
   osds: OSDData[];
   position: [number, number, number];
}

interface ClusterData {
   hosts: HostData[];
   monitors: MonitorData[];
   pgMap: any[];
}

interface SelectedNode {
   id: string;
   type: 'OSD' | 'Monitor';
   status: string;
   capacity?: number;
   usage?: number;
   aiPrediction: string;
}

// Utility functions
const getHealthColor = (health: string): number => {
   switch (health) {
      case 'up':
         return 0x4ade80;
      case 'warning':
         return 0xf59e0b;
      case 'down':
         return 0xff3333;
      default:
         return 0x888888;
   }
};

const getUsageColor = (usage: number): number => {
   if (usage < 60) return 0x2563eb;
   if (usage < 80) return 0xea580c;
   return 0xef4444;
};

/**
 * Convert backend API data to frontend ClusterData format
 * Adds 3D position calculation to backend data
 */
const convertBackendToClusterData = (backendData: ClusterTopologyData): { hosts: HostData[]; monitors: MonitorData[] } => {
   // Convert hosts and OSDs
   const hosts: HostData[] = backendData.hosts.map(apiHost => ({
      id: apiHost.id,
      name: apiHost.name,
      osds: apiHost.osds.map(apiOsd => ({
         id: apiOsd.id,
         health: apiOsd.health,
         capacity: apiOsd.capacity,
         usage: apiOsd.usage,
         host: apiOsd.host,
         position: [0, 0, 0] as [number, number, number], // Will be calculated by layout manager
      })),
      position: [0, 0, 0] as [number, number, number], // Will be calculated by spiral layout
   }));

   // Convert monitors - assign static positions
   const monitors: MonitorData[] = backendData.monitors.map((apiMon, index) => {
      // Position monitors in a line at bottom
      const spacing = 37;
      const xPosition = (index - (backendData.monitors.length - 1) / 2) * spacing;

      return {
         id: apiMon.id,
         health: apiMon.health,
         position: [xPosition, -30, 0] as [number, number, number],
      };
   });

   return { hosts, monitors };
};

/**
 * Fetch cluster topology data from backend
 */
const fetchClusterTopology = async (): Promise<{ hosts: HostData[]; monitors: MonitorData[] }> => {
   try {
      const backendData = await ClusterTopologyAPI.getClusterTopology();
      return convertBackendToClusterData(backendData);
   } catch (error) {
      console.error('Error fetching cluster topology:', error);
      // Return empty data on error
      return {
         hosts: [],
         monitors: [],
      };
   }
};

// Spiral Layout 3D Class
class SpiralLayout3D {
   nodes: any[];
   options: any;

   constructor(nodes: any[], options: any = {}) {
      this.nodes = nodes;
      this.options = {
         radiusStep: options.radiusStep || 4.5,
         angleStep: options.angleStep || 0.8,
         heightStep: options.heightStep || 3,
         baseRadius: options.baseRadius || 12,
         ...options,
      };
   }

   calculate() {
      const positions: any[] = [];

      this.nodes.forEach((node, index) => {
         const angle = index * this.options.angleStep;
         const radius = this.options.baseRadius + index * this.options.radiusStep;
         const height = Math.sin(index * 0.5) * this.options.heightStep;

         positions.push({
            ...node,
            position: [Math.cos(angle) * radius, height, Math.sin(angle) * radius],
         });
      });

      return positions;
   }
}

// Hierarchical Layout Class
class HierarchicalLayout {
   nodes: any[];
   options: any;

   constructor(nodes: any[], options: any = {}) {
      this.nodes = nodes;
      this.options = {
         levels: options.levels || 3,
         spacing: options.spacing || 5,
         verticalSpacing: options.verticalSpacing || 6,
         baseRadius: options.baseRadius || 8,
         ...options,
      };
   }

   calculate() {
      const positions: any[] = [];
      const nodeCount = this.nodes.length;

      if (nodeCount === 1) {
         positions.push({
            ...this.nodes[0],
            position: new THREE.Vector3(0, 0, 0),
         });
      } else if (nodeCount <= 3) {
         this.nodes.forEach((node, index) => {
            const x = (index - (nodeCount - 1) / 2) * this.options.spacing;
            positions.push({
               ...node,
               position: new THREE.Vector3(x, 0, 0),
            });
         });
      } else {
         let currentIndex = 0;
         let currentLevel = 0;

         while (currentIndex < nodeCount) {
            const nodesInLevel = Math.min(Math.ceil((nodeCount - currentIndex) / (this.options.levels - currentLevel)), 6);
            const levelRadius = this.options.baseRadius * (1 + currentLevel * 0.3);
            const levelY = currentLevel * this.options.verticalSpacing - ((this.options.levels - 1) * this.options.verticalSpacing) / 2;

            for (let i = 0; i < nodesInLevel && currentIndex < nodeCount; i++) {
               const angle = (i / nodesInLevel) * Math.PI * 2;
               const x = Math.cos(angle) * levelRadius;
               const z = Math.sin(angle) * levelRadius;

               positions.push({
                  ...this.nodes[currentIndex],
                  position: new THREE.Vector3(x, levelY, z),
               });

               currentIndex++;
            }
            currentLevel++;
         }
      }

      return positions;
   }
}

// Adaptive Layout Manager
class AdaptiveLayoutManager {
   selectBestLayout(_osds: any[]) {
      return 'hierarchical'; // Use hierarchical layout for all cases
   }

   applyLayout(hostData: any, _containerSize: number = 16) {
      const osds = hostData.osds;
      const layoutType = this.selectBestLayout(osds);

      let positions: any[];

      if (layoutType === 'hierarchical') {
         const hierarchicalLayout = new HierarchicalLayout(osds, {
            levels: 3,
            spacing: 5,
            verticalSpacing: 6,
            baseRadius: 6,
         });
         positions = hierarchicalLayout.calculate();
      } else {
         positions = osds.map((osd: any, i: number) => ({
            ...osd,
            position: new THREE.Vector3((i - 0.5) * 4, 0, 0),
         }));
      }

      return positions.map(node => ({
         ...node,
         position: [hostData.position[0] + node.position.x, hostData.position[1] + node.position.y, hostData.position[2] + node.position.z],
      }));
   }
}

const layoutManager = new AdaptiveLayoutManager();

// Position hosts in spiral
const positionHosts = (hosts: HostData[]) => {
   const spiralLayout = new SpiralLayout3D(hosts, {
      baseRadius: 25,
      radiusStep: 8,
      heightStep: 15,
      angleStep: 1.2,
   });
   return spiralLayout.calculate();
};

// Position OSDs in host using adaptive layout
const positionOSDsInHost = (hostData: HostData): OSDData[] => {
   return layoutManager.applyLayout(hostData, 16);
};

// Data Flow Particles Component
const DataFlowParticles: React.FC = () => {
   const meshRef = useRef<THREE.Points>(null);
   const particleCount = 100;
   const { invalidate } = useThree();

   const [positions, colors, sizes, opacities] = useMemo(() => {
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      const opacities = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
         positions[i * 3] = (Math.random() - 0.5) * 200;
         positions[i * 3 + 1] = (Math.random() - 0.5) * 120;
         positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

         // Silver color variations
         const silverType = Math.random();
         if (silverType < 0.33) {
            colors[i * 3] = 0.95;
            colors[i * 3 + 1] = 0.95;
            colors[i * 3 + 2] = 1.0;
         } else if (silverType < 0.66) {
            colors[i * 3] = 0.85;
            colors[i * 3 + 1] = 0.85;
            colors[i * 3 + 2] = 0.9;
         } else {
            colors[i * 3] = 0.75;
            colors[i * 3 + 1] = 0.75;
            colors[i * 3 + 2] = 0.8;
         }

         sizes[i] = Math.random() * 3 + 1;
         opacities[i] = Math.random() * 0.8 + 0.2;
      }

      return [positions, colors, sizes, opacities];
   }, []);

   const shaderMaterial = useMemo(() => {
      return new THREE.ShaderMaterial({
         uniforms: {
            time: { value: 0 },
         },
         vertexShader: `
        attribute float size;
        attribute float opacity;
        varying vec3 vColor;
        varying float vOpacity;
        uniform float time;

        void main() {
          vColor = color;
          float twinkle = sin(time * 1.5 + position.x * 0.01) * 0.5 + 0.5;
          vOpacity = opacity * (0.6 + twinkle * 0.4);

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
         fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;

        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          if (dist > 0.5) discard;

          float alpha = smoothstep(0.5, 0.2, dist) * vOpacity;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
         transparent: true,
         vertexColors: true,
         blending: THREE.AdditiveBlending,
      });
   }, []);

   useFrame(({ clock }) => {
      if (meshRef.current) {
         const time = clock.getElapsedTime();
         shaderMaterial.uniforms.time.value = time;

         const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
         for (let i = 0; i < positions.length; i += 3) {
            positions[i] += Math.sin(time + i) * 0.02;
            positions[i + 1] += Math.cos(time * 0.8 + i) * 0.01;
            positions[i + 2] += Math.sin(time * 0.6 + i) * 0.015;

            // Boundary check and循环
            if (positions[i] > 100) positions[i] = -100;
            if (positions[i] < -100) positions[i] = 100;
            if (positions[i + 1] > 60) positions[i + 1] = -60;
            if (positions[i + 1] < -60) positions[i + 1] = 60;
            if (positions[i + 2] > 100) positions[i + 2] = -100;
            if (positions[i + 2] < -100) positions[i + 2] = 100;
         }
         meshRef.current.geometry.attributes.position.needsUpdate = true;
         meshRef.current.rotation.y += 0.0008;

         // 다음 프레임도 렌더링하도록 invalidate 호출
         invalidate();
      }
   });

   return (
      <points ref={meshRef} material={shaderMaterial}>
         <bufferGeometry>
            <bufferAttribute args={[positions, 3]} attach="attributes-position" count={particleCount} />
            <bufferAttribute args={[colors, 3]} attach="attributes-color" count={particleCount} />
            <bufferAttribute args={[sizes, 1]} attach="attributes-size" count={particleCount} />
            <bufferAttribute args={[opacities, 1]} attach="attributes-opacity" count={particleCount} />
         </bufferGeometry>
      </points>
   );
};

// OSD Node Component
const OSDNode: React.FC<{ data: OSDData; selected: boolean; onSelect: () => void }> = ({ data, selected, onSelect }) => {
   const meshRef = useRef<THREE.Group>(null);
   const highlightRef = useRef<THREE.Mesh>(null);
   const usageRingRef = useRef<THREE.Mesh>(null);
   const { invalidate } = useThree();

   const healthColor = useMemo(() => getHealthColor(data.health), [data.health]);
   const usageColor = useMemo(() => getUsageColor(data.usage), [data.usage]);
   const ringRadius = 2.3;
   // const ringRadius = useMemo(() => (4 + data.capacity * 0.3) * 0.67 * 0.67, [data.capacity]);

   useFrame(() => {
      if (meshRef.current && data.health === 'up') {
         meshRef.current.rotation.y += 0.005;
         invalidate();
      }
      // 정상이 아닌 OSD의 Usage Ring 회전 (수평 링이므로 Y축 회전)
      if (usageRingRef.current && data.health !== 'up') {
         usageRingRef.current.rotation.y += 0.02;
         invalidate();
      }
      if (selected && highlightRef.current) {
         highlightRef.current!.rotation.y += 0.02;
         invalidate();
      }
   });

   useGSAP(() => {
      if (selected && meshRef.current) {
         // Pink color animation for selected node
         gsap.to(meshRef.current.scale, {
            x: 1.3,
            y: 1.3,
            z: 1.3,
            duration: 1,
            repeat: -1,
            yoyo: true,
            ease: 'power2.inOut',
         });
      } else if (!selected && meshRef.current) {
         gsap.killTweensOf(meshRef.current.scale);
         gsap.set(meshRef.current.scale, { x: 1, y: 1, z: 1 });
      }
   }, [selected]);

   return (
      <group ref={meshRef} position={data.position} onClick={onSelect}>
         {/* Main sphere */}
         <Sphere args={[2, 32, 32]} castShadow>
            {data.health === 'up' ? (
               // 거울 재질 - 환경 반사
               <meshStandardMaterial color={0xffffff} metalness={1.0} roughness={0.0} envMapIntensity={1.5} />
            ) : (
               // 기존 재질 (warning, down)
               <meshPhongMaterial color={healthColor} shininess={150} />
            )}
         </Sphere>

         {/* Usage ring */}
         <Ring ref={usageRingRef} args={[ringRadius, ringRadius + 0.5, 32]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color={usageColor} side={THREE.DoubleSide} transparent opacity={0.7} />
         </Ring>

         {/* Label */}
         <Text position={[0, 5, 0]} fontSize={0.8} color="white" anchorX="center" anchorY="middle">
            {data.id}
         </Text>

         {/* Highlight ring when selected */}
         {selected && (
            <Ring ref={highlightRef} args={[4, 4.3, 32]} rotation={[-Math.PI / 2, 0, 0]}>
               <meshBasicMaterial color={0xffff00} side={THREE.DoubleSide} transparent opacity={0.8} />
            </Ring>
         )}
      </group>
   );
};

// Monitor Node Component
const MonitorNode: React.FC<{ data: MonitorData; selected: boolean; onSelect: () => void }> = ({ data, selected, onSelect }) => {
   const meshRef = useRef<THREE.Group>(null);
   const { invalidate } = useThree();

   useFrame(() => {
      if (meshRef.current) {
         meshRef.current.rotation.z += 0.003;
         invalidate();
      }
   });

   return (
      <group ref={meshRef} position={data.position} onClick={onSelect}>
         {/* Dodecahedron */}
         <Dodecahedron args={[4 * 0.67]}>
            <meshPhongMaterial color={0xa78bfa} shininess={120} />
         </Dodecahedron>

         {/* Label */}
         <Text position={[0, 5, 0]} fontSize={0.6} color="white" anchorX="center" anchorY="middle">
            {data.id}
         </Text>

         {/* Highlight ring when selected */}
         {selected && (
            <Ring args={[4, 4.3, 32]} rotation={[-Math.PI / 2, 0, 0]}>
               <meshBasicMaterial color={0xffff00} side={THREE.DoubleSide} transparent opacity={0.8} />
            </Ring>
         )}
      </group>
   );
};

// Host Container Component
const HostContainer: React.FC<{ data: HostData }> = ({ data }) => {
   // Load the aluminum foil texture
   const aluminiumTexture = useTexture('/3d/textures/planet/silver-metal-pattern-steel.webp');

   // Configure texture properties for better appearance
   React.useEffect(() => {
      if (aluminiumTexture) {
         aluminiumTexture.wrapS = THREE.RepeatWrapping;
         aluminiumTexture.wrapT = THREE.RepeatWrapping;
         aluminiumTexture.repeat.set(1, 1); // Repeat the texture for better detail
      }
   }, [aluminiumTexture]);

   return (
      <group position={data.position}>
         {/* Bottom surface with aluminum foil texture */}
         <Circle args={[10, 32]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]} receiveShadow>
            <meshStandardMaterial map={aluminiumTexture} opacity={1} side={THREE.DoubleSide} metalness={0.8} roughness={0.2} />
         </Circle>
         <pointLight args={['#ffffff', 10, 50, -0.1]} position={[0, 5, 0]} intensity={4} />
         {/* Host label */}
         <Text position={[0, 13, 0]} fontSize={1.2} color="white" anchorX="center" anchorY="middle">
            {data.name}
         </Text>
      </group>
   );
};

// Camera Controller for custom zoom
const CameraController: React.FC = () => {
   const { camera } = useThree();

   useEffect(() => {
      const handleWheel = (event: WheelEvent) => {
         if (event.shiftKey || event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const delta = event.deltaY < 0 ? 0.95 : 1.05;
            const distance = camera.position.length();
            const newDistance = distance * delta;

            if (newDistance >= 5 && newDistance <= 300) {
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

// Main Scene Component
const ClusterScene: React.FC<{
   clusterData: ClusterData;
   selectedNode: SelectedNode | null;
   onNodeSelect: (node: SelectedNode | null) => void;
}> = ({ clusterData, selectedNode, onNodeSelect }) => {
   const { invalidate } = useThree();

   // OrbitControls의 autoRotate를 위한 invalidate
   useFrame(() => {
      invalidate();
   });

   return (
      <>
         {/* Lighting */}
         <ambientLight intensity={0.5} />
         <directionalLight position={[50, 50, 50]} intensity={1.2} />
         <directionalLight position={[-50, -50, -50]} intensity={0.8} />

         {/* Controls */}
         <OrbitControls
            enableDamping
            dampingFactor={0.05}
            enablePan={false}
            maxDistance={300}
            minDistance={5}
            autoRotate
            autoRotateSpeed={0.5}
            enableZoom={false}
         />

         <CameraController />

         {/* Host Containers */}
         {clusterData.hosts.map(host => (
            <HostContainer key={host.id} data={host} />
         ))}

         {/* OSD Nodes */}
         {clusterData.hosts.flatMap(host =>
            positionOSDsInHost(host).map(osd => (
               <OSDNode
                  key={osd.id}
                  data={osd}
                  selected={selectedNode?.id === osd.id}
                  onSelect={() =>
                     onNodeSelect({
                        id: osd.id,
                        type: 'OSD',
                        status: osd.health,
                        capacity: osd.capacity,
                        usage: +(osd.usage || 0).toFixed(1),
                        aiPrediction: 'Normal - No issues detected',
                     })
                  }
               />
            )),
         )}

         {/* Monitor Nodes */}
         {clusterData.monitors.map(monitor => (
            <MonitorNode
               key={monitor.id}
               data={monitor}
               selected={selectedNode?.id === monitor.id}
               onSelect={() =>
                  onNodeSelect({
                     id: monitor.id,
                     type: 'Monitor',
                     status: monitor.health,
                     aiPrediction: 'Normal - No issues detected',
                  })
               }
            />
         ))}

         {/* Data Flow Particles */}
         <DataFlowParticles />
      </>
   );
};

// Main Component
const CephClusterVisualization: React.FC = () => {
   const [clusterData, setClusterData] = useState<ClusterData>({
      hosts: [],
      monitors: [],
      pgMap: [],
   });

   const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [canvasReady, setCanvasReady] = useState(false);

   // Use ref to prevent double initialization in React 18 Strict Mode
   const isInitializedRef = useRef(false);

   // Initialize cluster data from backend
   useEffect(() => {
      // Prevent double initialization in Strict Mode (React 18)
      if (isInitializedRef.current) {
         return;
      }
      isInitializedRef.current = true;

      const loadClusterData = async () => {
         try {
            const { hosts, monitors } = await fetchClusterTopology();
            const positionedHosts = positionHosts(hosts);

            setClusterData({
               hosts: positionedHosts,
               monitors: monitors,
               pgMap: [],
            });

            // Show loading animation for at least 0.5 seconds
            await new Promise(resolve => setTimeout(resolve, 500));
         } catch (error) {
            console.error('Failed to load cluster data:', error);
         } finally {
            setIsLoading(false);
            // Delay canvas mounting to avoid flicker
            setTimeout(() => setCanvasReady(true), 100);
         }
      };

      loadClusterData();
   }, []);

   // Periodic cluster updates from backend
   useEffect(() => {
      const hostUpdateInterval = setInterval(async () => {
         const { hosts, monitors } = await fetchClusterTopology();
         const positionedHosts = positionHosts(hosts);
         setClusterData({
            hosts: positionedHosts,
            monitors: monitors,
            pgMap: [],
         });
      }, 300000); // 5 minutes

      return () => clearInterval(hostUpdateInterval);
   }, []);

   const handleNodeSelect = useCallback((node: SelectedNode | null) => {
      setSelectedNode(node);
   }, []);

   const closeNodeDetail = useCallback(() => {
      setSelectedNode(null);
   }, []);

   return (
      <div
         className="cluster-container flex-1 relative w-full h-full rounded-xl overflow-hidden"
         style={{ background: 'transparent', backgroundColor: 'transparent' }}
      >
         {/* 2D Loading Spinner */}
         {isLoading ? (
            <div className="loading-spinner-container">
               <div className="loading-spinner">
                  <div className="spinner-ring"></div>
                  <div className="spinner-ring"></div>
                  <div className="spinner-ring"></div>
                  <div className="spinner-text">Loading Cluster Data...</div>
               </div>
            </div>
         ) : (
            /* Three.js Canvas - Only mount after loading and delay */
            canvasReady && (
               <Canvas
                  frameloop="demand"
                  camera={{ position: [0, 45, 80], fov: 75 }}
                  gl={{
                     antialias: true,
                     alpha: true,
                  }}
                  onCreated={({ gl, scene, invalidate }) => {
                     gl.setClearColor(0x000000, 0);
                     scene.background = null;
                     invalidate(); // Force initial render
                  }}
                  style={{ background: 'transparent', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  shadows
               >
                  <ClusterScene clusterData={clusterData} selectedNode={selectedNode} onNodeSelect={handleNodeSelect} />
                  <Environment files={'/3d/background/darkcenter.jpg'} />
               </Canvas>
            )
         )}

         {/* Node Detail Panel - only show when not loading */}
         {!isLoading && selectedNode && (
            <div className="node-detail-panel absolute right-5 top-1/2 transform -translate-y-1/2 w-70 bg-black/85 border border-cyan-500/50 rounded-lg p-5 backdrop-blur-sm z-20">
               <h3 className="text-cyan-400 mb-4 text-lg">
                  {selectedNode.type} Node: {selectedNode.id}
               </h3>
               <div className="detail-content">
                  <p className="text-gray-100 my-2 text-sm">
                     Status:{' '}
                     <span className={selectedNode.status === 'up' ? 'text-green-400' : selectedNode.status === 'warning' ? 'text-yellow-400' : 'text-red-400'}>
                        {selectedNode.status}
                     </span>
                  </p>
                  {selectedNode.capacity && <p className="text-gray-100 my-2 text-sm">Capacity: {formatBytes(selectedNode.capacity)}</p>}
                  {selectedNode.usage && <p className="text-gray-100 my-2 text-sm">Usage: {selectedNode.usage}%</p>}
                  {/*<p className="text-gray-100 my-2 text-sm">AI Prediction: {selectedNode.aiPrediction}</p>*/}
               </div>
               <button
                  onClick={closeNodeDetail}
                  className="absolute top-2 right-4 bg-none border-none text-gray-500 text-2xl cursor-pointer hover:text-gray-100 transition-colors"
               >
                  ×
               </button>
            </div>
         )}
      </div>
   );
};

// 전체 컴포넌트도 메모이제이션으로 export
export default memo(CephClusterVisualization);
