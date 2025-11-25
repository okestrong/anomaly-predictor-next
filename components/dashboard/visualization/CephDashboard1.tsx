'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Float, Html, Line, MeshReflectorMaterial, OrbitControls, Stars, Text, Trail } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { CephTopologyData, NetworkTraffic } from './cephTypes';
import styles from './CephDashboard.module.css';

// Node positions calculator
const calculateNodePositions = () => {
   const positions = {
      cluster: new THREE.Vector3(0, 0, 0),
      hosts: [] as THREE.Vector3[],
      osds: [] as THREE.Vector3[],
      daemons: [] as THREE.Vector3[],
   };

   // Hosts in triangle formation (y=3)
   for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
      positions.hosts.push(new THREE.Vector3(Math.cos(angle) * 5, 3, Math.sin(angle) * 5));
   }

   // OSDs around each host (y=0)
   for (let h = 0; h < 3; h++) {
      const hostPos = positions.hosts[h];
      for (let o = 0; o < 12; o++) {
         const angle = (o / 12) * Math.PI * 2;
         positions.osds.push(new THREE.Vector3(hostPos.x + Math.cos(angle) * 2, 0, hostPos.z + Math.sin(angle) * 2));
      }
   }

   // Daemons in outer ring (y=5)
   for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      positions.daemons.push(new THREE.Vector3(Math.cos(angle) * 12, 5, Math.sin(angle) * 12));
   }

   return positions;
};

// Traffic Particle Component - Fast moving spheres
function TrafficFlow({ flow, positions }: { flow: NetworkTraffic; positions: any }) {
   const meshRef = useRef<THREE.Mesh>(null);
   const trailRef = useRef<any>(null);
   const progress = useRef(0);

   const sourcePosIndex = flow.sourceOSD;
   const targetPosIndex = flow.targetOSD;
   const sourcePos = positions.osds[sourcePosIndex] || new THREE.Vector3(0, 0, 0);
   const targetPos = positions.osds[targetPosIndex] || new THREE.Vector3(0, 0, 0);

   useFrame((state, delta) => {
      if (!meshRef.current) return;

      // Speed based on traffic intensity
      progress.current += delta * flow.intensity * 0.5;

      if (progress.current > 1) {
         progress.current = 0;
      }

      // Calculate bezier curve for more interesting path
      const t = progress.current;
      const height = 3 + Math.sin(t * Math.PI) * 2;

      const x = sourcePos.x * (1 - t) + targetPos.x * t;
      const z = sourcePos.z * (1 - t) + targetPos.z * t;
      const y = sourcePos.y * (1 - t) + targetPos.y * t + height;

      meshRef.current.position.set(x, y, z);

      // Pulse effect
      const scale = 0.2 + Math.sin(state.clock.elapsedTime * 10) * 0.05;
      meshRef.current.scale.setScalar(scale * (flow.intensity / 5));
   });

   const color = flow.trafficType === 'recovery' ? '#ff6600' : flow.trafficType === 'client' ? '#00ff66' : '#0066ff';

   return (
      <Trail width={2} length={10} color={color} attenuation={t => t * t}>
         <mesh ref={meshRef}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshPhongMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.8} />
         </mesh>
      </Trail>
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
}: {
   position: THREE.Vector3;
   nodeData: any;
   type: 'cluster' | 'host' | 'osd' | 'pool';
   color: string;
   size?: number;
   onSelect: (data: any) => void;
}) {
   const meshRef = useRef<THREE.Mesh>(null);
   const [hovered, setHovered] = useState(false);

   useFrame(state => {
      if (!meshRef.current) return;

      // Floating animation
      if (type === 'cluster') {
         meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
         meshRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime) * 0.2;
      }

      // Hover effect
      if (hovered && meshRef.current.scale) {
         gsap.to(meshRef.current.scale, {
            x: size * 1.2,
            y: size * 1.2,
            z: size * 1.2,
            duration: 0.3,
         });
      } else if (!hovered && meshRef.current.scale) {
         gsap.to(meshRef.current.scale, {
            x: size,
            y: size,
            z: size,
            duration: 0.3,
         });
      }
   });

   const handleClick = (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSelect({ type, data: nodeData });
   };

   const geometry = type === 'cluster' || type === 'osd' ? <sphereGeometry args={[0.5, 16, 16]} /> : <boxGeometry args={[0.8, 0.8, 0.8]} />;

   return (
      <Float speed={type === 'cluster' ? 2 : 0} rotationIntensity={type === 'cluster' ? 0.5 : 0} floatIntensity={type === 'cluster' ? 0.5 : 0}>
         <mesh
            ref={meshRef}
            position={position}
            scale={size}
            onClick={handleClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            castShadow
            receiveShadow
         >
            {geometry}
            <meshPhysicalMaterial
               color={color}
               emissive={color}
               emissiveIntensity={hovered ? 0.5 : 0.2}
               metalness={0.5}
               roughness={0.2}
               clearcoat={1}
               clearcoatRoughness={0}
               transparent
               opacity={0.9}
            />
         </mesh>

         {/* Label */}
         <Text position={[position.x, position.y - size * 0.8, position.z]} fontSize={0.2} color="white" anchorX="center" anchorY="top">
            {nodeData.name || nodeData.hostname || `OSD ${nodeData.osdId}` || nodeData.poolName}
         </Text>

         {/* Hover indicator */}
         {hovered && (
            <mesh position={position} scale={size * 1.5}>
               <sphereGeometry args={[0.6, 16, 16]} />
               <meshBasicMaterial color={color} transparent opacity={0.2} wireframe />
            </mesh>
         )}
      </Float>
   );
}

// Connection Lines Component
function ConnectionLines({ positions, data }: { positions: any; data: CephTopologyData }) {
   const lines = useMemo(() => {
      const allLines = [];

      // Cluster to Hosts
      for (let i = 0; i < data.hosts.length; i++) {
         allLines.push({
            start: positions.cluster,
            end: positions.hosts[i],
            color: '#4488ff',
         });
      }

      // Hosts to their OSDs
      for (let h = 0; h < data.hosts.length; h++) {
         const hostPos = positions.hosts[h];
         const startOSD = h * 12;
         const endOSD = startOSD + 12;

         for (let o = startOSD; o < endOSD && o < positions.osds.length; o++) {
            allLines.push({
               start: hostPos,
               end: positions.osds[o],
               color: '#44ff88',
            });
         }
      }

      // Note: Daemon-to-OSD connections removed as daemons don't have actingOSDs property

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

   const formatBytes = (bytes: number) => {
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let unitIndex = 0;
      let value = bytes;
      while (value >= 1024 && unitIndex < units.length - 1) {
         value /= 1024;
         unitIndex++;
      }
      return `${value.toFixed(2)} ${units[unitIndex]}`;
   };

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
                  <p>PGs: {data.pgCount}</p>
                  <p>Read IOPS: {data.performanceMetrics.read_iops}</p>
                  <p>Write IOPS: {data.performanceMetrics.write_iops}</p>
               </>
            );

         case 'pool':
            return (
               <>
                  <h3>Pool: {data.poolName}</h3>
                  <p>Type: {data.type}</p>
                  <p>
                     Replication: {data.size}x (min: {data.minSize})
                  </p>
                  <p>Used: {formatBytes(data.bytesUsed)}</p>
                  <p>Max: {formatBytes(data.maxBytes)}</p>
                  <p>PGs: {data.pgNum}</p>
                  <p>I/O Rate: {data.ioRate.toFixed(1)} MB/s</p>
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

// Main 3D Scene Component
function CephTopology3D({ data, onNodeSelect }: { data: CephTopologyData; onNodeSelect: (node: any) => void }) {
   const positions = useMemo(() => calculateNodePositions(), []);

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'HEALTH_OK':
         case 'up':
            return '#00ff88';
         case 'HEALTH_WARN':
            return '#ffaa00';
         case 'HEALTH_ERR':
         case 'down':
            return '#ff3366';
         default:
            return '#666666';
      }
   };

   return (
      <group>
         {/* Connection Lines */}
         <ConnectionLines positions={positions} data={data} />

         {/* Cluster Node */}
         <InteractiveNode
            position={positions.cluster}
            nodeData={data.cluster}
            type="cluster"
            color={getStatusColor(data.cluster.status)}
            size={1.5}
            onSelect={onNodeSelect}
         />

         {/* Host Nodes */}
         {data.hosts.map((host, i) => (
            <InteractiveNode
               key={host.hostname}
               position={positions.hosts[i]}
               nodeData={host}
               type="host"
               color={host.role === 'control' ? '#4488ff' : host.role === 'compute' ? '#44ff88' : '#ff8844'}
               size={1}
               onSelect={onNodeSelect}
            />
         ))}

         {/* OSD Nodes */}
         {data.osds.map((osd, i) => (
            <InteractiveNode
               key={osd.osdId}
               position={positions.osds[i]}
               nodeData={osd}
               type="osd"
               color={getStatusColor(osd.status)}
               size={0.4 + (osd.utilizationPercent / 100) * 0.3}
               onSelect={onNodeSelect}
            />
         ))}

         {/* Daemon Nodes */}
         {data.daemons.map((daemon, i) => (
            <InteractiveNode
               key={daemon.daemonId}
               position={positions.daemons[i]}
               nodeData={daemon}
               type="pool"
               color="#8844ff"
               size={0.5}
               onSelect={onNodeSelect}
            />
         ))}

         {/* Traffic Flows */}
         {data.traffic.map(flow => (
            <TrafficFlow key={flow.flowId} flow={flow} positions={positions} />
         ))}
      </group>
   );
}

// Main Dashboard Component
export default function CephDashboard1() {
   const [topologyData, setTopologyData] = useState<CephTopologyData | null>(null);
   const [connected, setConnected] = useState(false);
   const [selectedNode, setSelectedNode] = useState<any>(null);
   const [trafficIntensity, setTrafficIntensity] = useState(5);
   const clientRef = useRef<Client | null>(null);

   useEffect(() => {
      // WebSocket connection
      const socket = new SockJS('http://localhost:8080/ws-ceph-dashboard');
      const stompClient = new Client({
         webSocketFactory: () => socket as any,
         onConnect: () => {
            console.log('Connected to WebSocket');
            setConnected(true);

            stompClient.subscribe('/topic/ceph-topology', message => {
               try {
                  const data = JSON.parse(message.body) as CephTopologyData;
                  setTopologyData(data);
               } catch (error) {
                  console.error('Failed to parse topology data:', error);
               }
            });
         },
         onDisconnect: () => {
            console.log('Disconnected from WebSocket');
            setConnected(false);
         },
         onStompError: frame => {
            console.error('STOMP error:', frame);
         },
      });

      stompClient.activate();
      clientRef.current = stompClient;

      // Load initial data
      fetch('http://localhost:8080/api/ceph/topology')
         .then(res => res.json())
         .then(data => setTopologyData(data))
         .catch(err => console.error('Failed to load initial data:', err));

      return () => {
         if (clientRef.current) {
            clientRef.current.deactivate();
         }
      };
   }, []);

   const handleIntensityChange = async (value: number) => {
      setTrafficIntensity(value);
      try {
         await fetch(`http://localhost:8080/api/ceph/traffic/intensity?intensity=${value}`, {
            method: 'POST',
         });
      } catch (error) {
         console.error('Failed to update traffic intensity:', error);
      }
   };

   const formatBytes = (bytes: number) => {
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let unitIndex = 0;
      let value = bytes;
      while (value >= 1024 && unitIndex < units.length - 1) {
         value /= 1024;
         unitIndex++;
      }
      return `${value.toFixed(2)} ${units[unitIndex]}`;
   };

   return (
      <div className={styles.dashboard}>
         {/* Header */}
         <div className={styles.header}>
            <h1 className={styles.title}>
               <span className={styles.titleGlow}>CEPH CLUSTER</span>
               <span className={styles.titleSub}>3D Topology & Real-time Traffic Flow</span>
            </h1>
            <div className={styles.connectionStatus}>
               <div className={`${styles.statusDot} ${connected ? styles.connected : styles.disconnected}`} />
               <span>{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
         </div>

         {/* Main Content */}
         <div className={styles.mainContent}>
            {/* Left Panel */}
            <div className={styles.leftPanel}>
               {topologyData && (
                  <>
                     <div className={styles.metricCard}>
                        <h3>Cluster Health</h3>
                        <div className={`${styles.healthStatus} ${styles[topologyData.cluster.status.toLowerCase().replace('_', '-')]}`}>
                           {topologyData.cluster.status}
                        </div>
                     </div>

                     <div className={styles.metricCard}>
                        <h3>Quick Stats</h3>
                        <div className={styles.metric}>
                           <span>Storage Used</span>
                           <span>{topologyData.cluster.utilizationPercent.toFixed(1)}%</span>
                        </div>
                        <div className={styles.metric}>
                           <span>OSDs Up</span>
                           <span className={styles.up}>
                              {topologyData.cluster.upOSDs}/{topologyData.cluster.totalOSDs}
                           </span>
                        </div>
                        <div className={styles.metric}>
                           <span>Active Flows</span>
                           <span>{topologyData.traffic.length}</span>
                        </div>
                     </div>

                     <div className={styles.metricCard}>
                        <h3>Traffic Types</h3>
                        <div className={styles.flowList}>
                           <div className={styles.flow}>
                              <span style={{ color: '#0066ff' }}>● Replication</span>
                              <span>{topologyData.traffic.filter(t => t.trafficType === 'replication').length}</span>
                           </div>
                           <div className={styles.flow}>
                              <span style={{ color: '#ff6600' }}>● Recovery</span>
                              <span>{topologyData.traffic.filter(t => t.trafficType === 'recovery').length}</span>
                           </div>
                           <div className={styles.flow}>
                              <span style={{ color: '#00ff66' }}>● Client</span>
                              <span>{topologyData.traffic.filter(t => t.trafficType === 'client').length}</span>
                           </div>
                        </div>
                     </div>
                  </>
               )}
            </div>

            {/* 3D Canvas */}
            <div className={styles.centerCanvas}>
               <Canvas
                  shadows
                  camera={{ position: [15, 15, 15], fov: 60 }}
                  gl={{
                     antialias: true,
                     toneMapping: THREE.ACESFilmicToneMapping,
                     toneMappingExposure: 1.0,
                  }}
               >
                  <Suspense fallback={null}>
                     {/* Environment and Lighting */}
                     <Environment preset="city" />
                     <ambientLight intensity={0.2} />
                     <directionalLight
                        position={[10, 20, 10]}
                        intensity={1}
                        castShadow
                        shadow-mapSize={[2048, 2048]}
                        shadow-camera-far={50}
                        shadow-camera-left={-20}
                        shadow-camera-right={20}
                        shadow-camera-top={20}
                        shadow-camera-bottom={-20}
                     />
                     <pointLight position={[-10, 10, -10]} intensity={0.5} color="#ff00ff" />
                     <pointLight position={[10, 10, 10]} intensity={0.5} color="#00ffff" />

                     {/* Stars Background */}
                     <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                     {/* Ground with reflection */}
                     <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
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
                           metalness={0.5}
                        />
                     </mesh>

                     {/* Contact Shadows */}
                     <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={30} blur={2} far={10} />

                     {/* Controls */}
                     <OrbitControls
                        enablePan={true}
                        enableZoom={true}
                        maxPolarAngle={Math.PI * 0.85}
                        minDistance={5}
                        maxDistance={50}
                        autoRotate
                        autoRotateSpeed={0.1}
                     />

                     {/* Main 3D Scene */}
                     {topologyData && <CephTopology3D data={topologyData} onNodeSelect={setSelectedNode} />}

                     {/* Info Popup */}
                     {selectedNode && <InfoPopup selectedNode={selectedNode} onClose={() => setSelectedNode(null)} />}
                  </Suspense>
               </Canvas>
            </div>

            {/* Right Panel */}
            <div className={styles.rightPanel}>
               {topologyData && (
                  <>
                     <div className={styles.metricCard}>
                        <h3>Active Daemons</h3>
                        {topologyData.daemons
                           .filter(d => d.status === 'up')
                           .slice(0, 5)
                           .map(daemon => (
                              <div key={daemon.daemonId} className={styles.poolCard}>
                                 <div className={styles.poolHeader}>
                                    <span>{daemon.daemonId}</span>
                                    <span className={styles.ioRate}>{daemon.status}</span>
                                 </div>
                              </div>
                           ))}
                     </div>

                     <div className={styles.metricCard}>
                        <h3>Host Performance</h3>
                        {topologyData.hosts.map(host => (
                           <div key={host.hostname} className={styles.hostMini}>
                              <span className={styles.hostnameMini}>{host.hostname}</span>
                              <div className={styles.perfBars}>
                                 <div className={styles.perfBar}>
                                    <span>CPU</span>
                                    <div className={styles.barBg}>
                                       <div
                                          className={styles.barFill}
                                          style={{
                                             width: `${host.cpuUsage}%`,
                                             backgroundColor: host.cpuUsage > 80 ? '#ff3366' : '#00ff88',
                                          }}
                                       />
                                    </div>
                                 </div>
                                 <div className={styles.perfBar}>
                                    <span>MEM</span>
                                    <div className={styles.barBg}>
                                       <div
                                          className={styles.barFill}
                                          style={{
                                             width: `${host.memoryUsage}%`,
                                             backgroundColor: host.memoryUsage > 80 ? '#ff3366' : '#00ff88',
                                          }}
                                       />
                                    </div>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </>
               )}
            </div>
         </div>

         {/* Controls */}
         <div className={styles.controls}>
            <div className={styles.intensityControl}>
               <label>Traffic Speed</label>
               <input
                  type="range"
                  min="1"
                  max="10"
                  value={trafficIntensity}
                  onChange={e => handleIntensityChange(parseInt(e.target.value))}
                  className={styles.slider}
               />
               <span className={styles.intensityValue}>{trafficIntensity}x</span>
            </div>

            <div className={styles.hint}>Click any node for details • Scroll to zoom • Drag to rotate</div>

            <div className={styles.timestamp}>{topologyData && <>Last Update: {new Date(topologyData.timestamp).toLocaleTimeString()}</>}</div>
         </div>
      </div>
   );
}
