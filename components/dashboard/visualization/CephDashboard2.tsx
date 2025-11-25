'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, MeshDistortMaterial, OrbitControls, Sphere, Text } from '@react-three/drei';
import * as THREE from 'three';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { CephTopologyData, NetworkTraffic } from './cephTypes';
import styles from './CephDashboard.module.css';

// Particle system for network traffic
function TrafficParticles({ traffic }: { traffic: NetworkTraffic[] }) {
   const particlesRef = useRef<THREE.Points>(null);
   const [positions, setPositions] = useState<Float32Array>(new Float32Array(0));
   const [colors, setColors] = useState<Float32Array>(new Float32Array(0));

   useEffect(() => {
      const particleCount = traffic.length * 50;
      const newPositions = new Float32Array(particleCount * 3);
      const newColors = new Float32Array(particleCount * 3);

      traffic.forEach((flow, i) => {
         const baseIndex = i * 50 * 3;
         for (let j = 0; j < 50; j++) {
            const index = baseIndex + j * 3;

            // Create particle path between source and target
            const angle = (flow.sourceOSD / 36) * Math.PI * 2;
            const targetAngle = (flow.targetOSD / 36) * Math.PI * 2;
            const progress = j / 50;

            const radius = 8 - Math.sin(progress * Math.PI) * 2;
            const x = Math.cos(angle) * radius * (1 - progress) + Math.cos(targetAngle) * radius * progress;
            const y = Math.sin(angle) * radius * (1 - progress) + Math.sin(targetAngle) * radius * progress;
            const z = Math.sin(progress * Math.PI * 4) * 0.5;

            newPositions[index] = x;
            newPositions[index + 1] = y;
            newPositions[index + 2] = z;

            // Color based on traffic type
            const color =
               flow.trafficType === 'recovery'
                  ? new THREE.Color(1, 0.5, 0)
                  : flow.trafficType === 'client'
                    ? new THREE.Color(0, 1, 0.5)
                    : new THREE.Color(0, 0.5, 1);

            newColors[index] = color.r;
            newColors[index + 1] = color.g;
            newColors[index + 2] = color.b;
         }
      });

      setPositions(newPositions);
      setColors(newColors);
   }, [traffic]);

   useFrame(state => {
      if (particlesRef.current) {
         particlesRef.current.rotation.z += 0.001;

         // Animate particles along paths
         const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
         for (let i = 0; i < positions.length; i += 3) {
            positions[i + 2] = Math.sin(state.clock.elapsedTime * 2 + i) * 0.5;
         }
         particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }
   });

   return (
      <points ref={particlesRef}>
         <bufferGeometry>
            <bufferAttribute args={[positions, 3]} attach="attributes-position" count={positions.length / 3} />
            <bufferAttribute args={[colors, 3]} attach="attributes-color" count={colors.length / 3} />
         </bufferGeometry>
         <pointsMaterial size={0.05} vertexColors transparent opacity={0.8} />
      </points>
   );
}

// 3D Topology Visualization
function Topology3D({ data }: { data: CephTopologyData | null }) {
   const groupRef = useRef<THREE.Group>(null);

   useFrame(state => {
      if (groupRef.current) {
         groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
      }
   });

   if (!data) return null;

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
      <group ref={groupRef}>
         {/* Cluster Center */}
         <Sphere args={[1, 32, 32]} position={[0, 0, 0]}>
            <MeshDistortMaterial
               color={getStatusColor(data.cluster.status)}
               emissive={getStatusColor(data.cluster.status)}
               emissiveIntensity={0.2}
               roughness={0.3}
               metalness={0.8}
               distort={0.2}
               speed={2}
            />
         </Sphere>

         <Text position={[0, -1.5, 0]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">
            {data.cluster.name}
         </Text>

         {/* Hosts Ring */}
         {data.hosts.map((host, i) => {
            const angle = (i / data.hosts.length) * Math.PI * 2;
            const x = Math.cos(angle) * 4;
            const y = Math.sin(angle) * 4;

            return (
               <group key={host.hostname} position={[x, y, 0]}>
                  <Box args={[0.8, 0.8, 0.8]}>
                     <meshPhongMaterial
                        color={host.role === 'control' ? '#4488ff' : host.role === 'compute' ? '#44ff88' : '#ff8844'}
                        emissive={host.role === 'control' ? '#2244aa' : host.role === 'compute' ? '#224444' : '#aa4422'}
                        emissiveIntensity={0.3}
                     />
                  </Box>
                  <Text position={[0, -0.6, 0]} fontSize={0.2} color="white" anchorX="center">
                     {host.hostname}
                  </Text>
               </group>
            );
         })}

         {/* OSDs Ring */}
         {data.osds.map(osd => {
            const angle = (osd.osdId / data.osds.length) * Math.PI * 2;
            const x = Math.cos(angle) * 8;
            const y = Math.sin(angle) * 8;
            const size = 0.3 + (osd.utilizationPercent / 100) * 0.3;

            return (
               <Sphere key={osd.osdId} args={[size, 16, 16]} position={[x, y, 0]}>
                  <meshPhongMaterial
                     color={getStatusColor(osd.status)}
                     emissive={getStatusColor(osd.status)}
                     emissiveIntensity={0.2}
                     transparent
                     opacity={0.8}
                  />
               </Sphere>
            );
         })}

         {/* Daemons Outer Ring */}
         {data.daemons.map((daemon, i) => {
            const angle = (i / data.daemons.length) * Math.PI * 2;
            const x = Math.cos(angle) * 12;
            const y = Math.sin(angle) * 12;
            const size = 0.5;

            return (
               <group key={daemon.daemonId} position={[x, y, 0]}>
                  <Box args={[size, size * 0.6, size * 0.6]}>
                     <meshPhongMaterial color="#8844ff" emissive="#4422aa" emissiveIntensity={0.3} transparent opacity={0.7} />
                  </Box>
                  <Text position={[0, -0.5, 0]} fontSize={0.15} color="white" anchorX="center">
                     {daemon.daemonId}
                  </Text>
               </group>
            );
         })}

         {/* Network Traffic */}
         {data.traffic && <TrafficParticles traffic={data.traffic} />}
      </group>
   );
}

// Main Dashboard Component
export default function CephDashboard2() {
   const [topologyData, setTopologyData] = useState<CephTopologyData | null>(null);
   const [connected, setConnected] = useState(false);
   const [trafficIntensity, setTrafficIntensity] = useState(5);
   const clientRef = useRef<Client | null>(null);

   useEffect(() => {
      // WebSocket connection
      const socket = new SockJS('http://localhost:8080/ws/dashboard');
      const stompClient = new Client({
         webSocketFactory: () => socket as any,
         onConnect: () => {
            console.log('Connected to WebSocket');
            setConnected(true);

            stompClient.subscribe('/topic/ceph-topology', message => {
               const data = JSON.parse(message.body) as CephTopologyData;
               setTopologyData(data);
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
      const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
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
               <span className={styles.titleSub}>Real-time Topology & Traffic Monitor</span>
            </h1>
            <div className={styles.connectionStatus}>
               <div className={`${styles.statusDot} ${connected ? styles.connected : styles.disconnected}`} />
               <span>{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
         </div>

         {/* Main Content */}
         <div className={styles.mainContent}>
            {/* Left Panel - Metrics */}
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
                        <h3>Storage</h3>
                        <div className={styles.metric}>
                           <span>Total</span>
                           <span>{formatBytes(topologyData.cluster.totalBytes)}</span>
                        </div>
                        <div className={styles.metric}>
                           <span>Used</span>
                           <span>{formatBytes(topologyData.cluster.usedBytes)}</span>
                        </div>
                        <div className={styles.metric}>
                           <span>Utilization</span>
                           <span>{topologyData.cluster.utilizationPercent.toFixed(1)}%</span>
                        </div>
                     </div>

                     <div className={styles.metricCard}>
                        <h3>OSDs</h3>
                        <div className={styles.metric}>
                           <span>Total</span>
                           <span>{topologyData.cluster.totalOSDs}</span>
                        </div>
                        <div className={styles.metric}>
                           <span>Up</span>
                           <span className={styles.up}>{topologyData.cluster.upOSDs}</span>
                        </div>
                        <div className={styles.metric}>
                           <span>In</span>
                           <span>{topologyData.cluster.inOSDs}</span>
                        </div>
                     </div>

                     <div className={styles.metricCard}>
                        <h3>Active Flows</h3>
                        <div className={styles.flowList}>
                           {topologyData.traffic.slice(0, 5).map(flow => (
                              <div key={flow.flowId} className={styles.flow}>
                                 <span className={styles[flow.trafficType]}>{flow.trafficType}</span>
                                 <span>{formatBytes(flow.bytesPerSec)}/s</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  </>
               )}
            </div>

            {/* Center - 3D Topology */}
            <div className={styles.centerCanvas}>
               <Canvas
                  camera={{ position: [0, 0, 25], fov: 60 }}
                  style={{
                     width: '100%',
                     height: '100%',
                     background: 'radial-gradient(ellipse at center, #0a0a1a 0%, #000000 100%)',
                  }}
               >
                  <ambientLight intensity={0.3} />
                  <pointLight position={[10, 10, 10]} intensity={1} />
                  <pointLight position={[-10, -10, -10]} intensity={0.5} />
                  <OrbitControls enablePan={false} enableZoom={true} maxDistance={40} minDistance={10} autoRotate autoRotateSpeed={0.01} />
                  <Topology3D data={topologyData} />

                  {/* Grid */}
                  <gridHelper args={[30, 30, '#222244', '#111122']} />
               </Canvas>
            </div>

            {/* Right Panel - Hosts & Pools */}
            <div className={styles.rightPanel}>
               {topologyData && (
                  <>
                     <div className={styles.metricCard}>
                        <h3>Hosts</h3>
                        {topologyData.hosts.map(host => (
                           <div key={host.hostname} className={styles.hostCard}>
                              <div className={styles.hostHeader}>
                                 <span className={styles.hostname}>{host.hostname}</span>
                                 <span className={`${styles.role} ${styles[host.role]}`}>{host.role}</span>
                              </div>
                              <div className={styles.hostMetrics}>
                                 <div>CPU: {host.cpuUsage.toFixed(1)}%</div>
                                 <div>MEM: {host.memoryUsage.toFixed(1)}%</div>
                                 <div>OSDs: {host.osdCount}</div>
                              </div>
                           </div>
                        ))}
                     </div>

                     <div className={styles.metricCard}>
                        <h3>Active Daemons</h3>
                        {topologyData.daemons.map(daemon => (
                           <div key={daemon.daemonId} className={styles.poolCard}>
                              <div className={styles.poolHeader}>
                                 <span>{daemon.daemonId}</span>
                                 <span className={styles.poolType}>{daemon.daemonType}</span>
                              </div>
                              <div className={styles.poolMetrics}>
                                 <div>Host: {daemon.hostname}</div>
                                 <div>Status: {daemon.status}</div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </>
               )}
            </div>
         </div>

         {/* Bottom Controls */}
         <div className={styles.controls}>
            <div className={styles.intensityControl}>
               <label>Traffic Intensity</label>
               <input
                  type="range"
                  min="1"
                  max="10"
                  value={trafficIntensity}
                  onChange={e => handleIntensityChange(parseInt(e.target.value))}
                  className={styles.slider}
               />
               <span className={styles.intensityValue}>{trafficIntensity}</span>
            </div>

            <div className={styles.timestamp}>{topologyData && <>Last Update: {new Date(topologyData.timestamp).toLocaleTimeString()}</>}</div>
         </div>
      </div>
   );
}
