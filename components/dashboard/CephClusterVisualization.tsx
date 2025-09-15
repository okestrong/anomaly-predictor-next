'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Ring, Dodecahedron, Circle, useTexture } from '@react-three/drei';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import * as THREE from 'three';

// Types
interface ChartDataPoint {
   timestamp: number;
   value: number;
   label?: string;
}

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

interface AnimatedStats {
   iops: number;
   throughput: number;
   aiScore: number;
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
   if (usage < 60) return 0x00ff88;
   if (usage < 80) return 0xffaa00;
   return 0xff3333;
};

// Generate random hosts data
const generateRandomHosts = (): HostData[] => {
   const hostCount = Math.floor(Math.random() * 8) + 3; // 3-10 hosts
   const hosts: HostData[] = [];
   let osdId = 0;

   for (let h = 0; h < hostCount; h++) {
      const osdCount = Math.floor(Math.random() * 5) + 1; // 1-5 OSDs per host
      const osds: OSDData[] = [];

      for (let i = 0; i < osdCount; i++) {
         osds.push({
            id: `osd.${osdId++}`,
            health: Math.random() > 0.2 ? 'up' : 'warning',
            capacity: Math.random() > 0.5 ? 4 : 8,
            usage: Math.floor(Math.random() * 40 + 40),
            host: `host-${h}`,
            position: [0, 0, 0], // Will be calculated later
         });
      }

      hosts.push({
         id: `host-${h}`,
         name: `node-${h + 1}`,
         osds: osds,
         position: [0, 0, 0], // Will be calculated later
      });
   }

   return hosts;
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
   selectBestLayout(osds: any[]) {
      return 'hierarchical'; // Use hierarchical layout for all cases
   }

   applyLayout(hostData: any, containerSize: number = 16) {
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
   const particleCount = 300;

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

   const healthColor = useMemo(() => getHealthColor(data.health), [data.health]);
   const usageColor = useMemo(() => getUsageColor(data.usage), [data.usage]);
   const sphereRadius = useMemo(() => (3 + data.capacity * 0.3) * 0.67 * 0.67, [data.capacity]);
   const ringRadius = useMemo(() => (4 + data.capacity * 0.3) * 0.67 * 0.67, [data.capacity]);

   useFrame(() => {
      if (meshRef.current && data.health === 'up') {
         meshRef.current.rotation.y += 0.005;
      }
      if (selected && highlightRef.current) {
         highlightRef.current!.rotation.y += 0.02;
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
         <Sphere args={[sphereRadius, 32, 32]} castShadow receiveShadow>
            <meshPhongMaterial color={healthColor} shininess={150} />
         </Sphere>

         {/* Usage ring */}
         <Ring args={[ringRadius, ringRadius + 0.5, 32]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color={usageColor} side={THREE.DoubleSide} transparent opacity={0.6} />
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

   useFrame(() => {
      if (meshRef.current) {
         meshRef.current.rotation.z += 0.003;
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
         <Circle args={[10, 32]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]} castShadow receiveShadow>
            <meshStandardMaterial map={aluminiumTexture} transparent opacity={0.9} side={THREE.DoubleSide} metalness={0.8} roughness={0.2} />
         </Circle>

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
   return (
      <>
         {/* Lighting */}
         <ambientLight intensity={0.8} />
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
                        usage: osd.usage,
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
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const [clusterData, setClusterData] = useState<ClusterData>({
      hosts: [],
      monitors: [
         { id: 'mon.a', position: [0, -30, 0], health: 'up' },
         { id: 'mon.b', position: [-37, -30, 0], health: 'up' },
         { id: 'mon.c', position: [37, -30, 0], health: 'up' },
      ],
      pgMap: [],
   });

   const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
   const [animatedStats, setAnimatedStats] = useState<AnimatedStats>({
      iops: 0,
      throughput: 0,
      aiScore: 0,
   });

   // Initialize cluster data
   useEffect(() => {
      const hosts = generateRandomHosts();
      const positionedHosts = positionHosts(hosts);

      setClusterData(prev => ({
         ...prev,
         hosts: positionedHosts,
      }));
   }, []);

   // Update stats animation
   useEffect(() => {
      const updateStats = () => {
         setAnimatedStats({
            iops: Math.floor(Math.random() * 50 + 100),
            throughput: parseFloat((Math.random() * 2 + 1.5).toFixed(1)),
            aiScore: Math.floor(Math.random() * 10 + 90),
         });
      };

      updateStats();
      const interval = setInterval(updateStats, 5000);

      return () => clearInterval(interval);
   }, []);

   // Periodic cluster updates
   useEffect(() => {
      const hostUpdateInterval = setInterval(() => {
         const hosts = generateRandomHosts();
         const positionedHosts = positionHosts(hosts);
         setClusterData(prev => ({
            ...prev,
            hosts: positionedHosts,
         }));
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
      <div className="cluster-container flex-1 relative w-full h-full rounded-xl overflow-hidden bg-transparent">
         {/* Three.js Canvas */}
         <Canvas ref={canvasRef} camera={{ position: [0, 45, 120], fov: 75 }} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
            <ClusterScene clusterData={clusterData} selectedNode={selectedNode} onNodeSelect={handleNodeSelect} />
         </Canvas>

         {/* Node Detail Panel */}
         {selectedNode && (
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
                  {selectedNode.capacity && <p className="text-gray-100 my-2 text-sm">Capacity: {selectedNode.capacity}TB</p>}
                  {selectedNode.usage && <p className="text-gray-100 my-2 text-sm">Usage: {selectedNode.usage}%</p>}
                  <p className="text-gray-100 my-2 text-sm">AI Prediction: {selectedNode.aiPrediction}</p>
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

export default CephClusterVisualization;
