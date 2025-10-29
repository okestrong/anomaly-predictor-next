'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Ring, Text, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface ClusterLoaderProps {
  message?: string;
  className?: string;
}

// Central Core Component
const CentralCore: React.FC = () => {
  const meshRef = useRef<THREE.Group>(null);
  const innerSphereRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    if (meshRef.current) {
      meshRef.current.rotation.y = time * 0.3;
      meshRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
    }

    if (innerSphereRef.current) {
      innerSphereRef.current.rotation.y = -time * 0.5;
      innerSphereRef.current.rotation.z = time * 0.3;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Outer glass sphere */}
      <Sphere args={[3, 64, 64]}>
        <meshPhysicalMaterial
          color={0x00d4ff}
          metalness={0.9}
          roughness={0.1}
          transmission={0.9}
          thickness={0.5}
          envMapIntensity={1.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </Sphere>

      {/* Inner rotating sphere */}
      <Sphere ref={innerSphereRef} args={[2, 32, 32]}>
        <meshStandardMaterial
          color={0x00d4ff}
          metalness={1.0}
          roughness={0.0}
          emissive={0x00d4ff}
          emissiveIntensity={0.5}
        />
      </Sphere>

      {/* Core glow */}
      <Sphere args={[1.5, 16, 16]}>
        <meshBasicMaterial color={0xffffff} transparent opacity={0.6} />
      </Sphere>

      {/* Point light inside */}
      <pointLight color={0x00d4ff} intensity={2} distance={20} />
    </group>
  );
};

// Orbiting Nodes Component
const OrbitingNodes: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const nodeRefs = useRef<THREE.Mesh[]>([]);

  const nodeCount = 8;
  const orbitRadius = 8;

  const nodes = useMemo(() => {
    return Array.from({ length: nodeCount }, (_, i) => {
      const angle = (i / nodeCount) * Math.PI * 2;
      return {
        angle,
        offsetY: Math.random() * 2 - 1,
        speed: 0.8 + Math.random() * 0.4,
        color: i % 2 === 0 ? 0x00d4ff : 0x00ff88,
      };
    });
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.2;
    }

    nodeRefs.current.forEach((node, i) => {
      if (node) {
        const nodeData = nodes[i];
        const t = time * nodeData.speed;
        const angle = nodeData.angle + t;

        node.position.x = Math.cos(angle) * orbitRadius;
        node.position.z = Math.sin(angle) * orbitRadius;
        node.position.y = Math.sin(t * 2) * 1.5 + nodeData.offsetY;

        // Pulse effect
        const scale = 1 + Math.sin(t * 3) * 0.2;
        node.scale.set(scale, scale, scale);

        // Rotate node
        node.rotation.x = t;
        node.rotation.y = t * 1.5;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) nodeRefs.current[i] = el;
          }}
        >
          <dodecahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial
            color={node.color}
            metalness={0.8}
            roughness={0.2}
            emissive={node.color}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
};

// Rotating Rings Component
const RotatingRings: React.FC = () => {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = time * 0.5;
      ring1Ref.current.rotation.y = time * 0.3;
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = -time * 0.4;
      ring2Ref.current.rotation.z = time * 0.6;
    }

    if (ring3Ref.current) {
      ring3Ref.current.rotation.y = time * 0.7;
      ring3Ref.current.rotation.z = -time * 0.2;
    }
  });

  return (
    <>
      {/* Ring 1 */}
      <Ring ref={ring1Ref} args={[5, 5.2, 64]}>
        <meshStandardMaterial
          color={0x00d4ff}
          metalness={1.0}
          roughness={0.1}
          emissive={0x00d4ff}
          emissiveIntensity={0.4}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </Ring>

      {/* Ring 2 */}
      <Ring ref={ring2Ref} args={[6.5, 6.7, 64]}>
        <meshStandardMaterial
          color={0x00ff88}
          metalness={1.0}
          roughness={0.1}
          emissive={0x00ff88}
          emissiveIntensity={0.4}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </Ring>

      {/* Ring 3 */}
      <Ring ref={ring3Ref} args={[8, 8.2, 64]}>
        <meshStandardMaterial
          color={0x8b5cf6}
          metalness={1.0}
          roughness={0.1}
          emissive={0x8b5cf6}
          emissiveIntensity={0.4}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </Ring>
    </>
  );
};

// Energy Particles Component
const EnergyParticles: React.FC = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 200;

  const [positions, colors, sizes] = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Random spherical distribution
      const radius = 5 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Color variation (cyan to green)
      const colorChoice = Math.random();
      if (colorChoice < 0.5) {
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0.831;
        colors[i * 3 + 2] = 1;
      } else {
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 0.533;
      }

      sizes[i] = Math.random() * 2 + 1;
    }

    return [positions, colors, sizes];
  }, []);

  useFrame(({ clock }) => {
    if (particlesRef.current) {
      const time = clock.getElapsedTime();
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const x = positions[i3];
        const y = positions[i3 + 1];
        const z = positions[i3 + 2];

        // Spiral motion
        positions[i3] = x * Math.cos(time * 0.1) - z * Math.sin(time * 0.1);
        positions[i3 + 2] = x * Math.sin(time * 0.1) + z * Math.cos(time * 0.1);
        positions[i3 + 1] = y + Math.sin(time + i) * 0.05;
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      particlesRef.current.rotation.y = time * 0.05;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" count={particleCount} />
        <bufferAttribute args={[colors, 3]} attach="attributes-color" count={particleCount} />
        <bufferAttribute args={[sizes, 1]} attach="attributes-size" count={particleCount} />
      </bufferGeometry>
      <pointsMaterial size={0.15} vertexColors transparent opacity={0.8} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  );
};

// Loading Scene Component
const LoadingScene: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.3} />

      {/* Directional lights */}
      <directionalLight position={[10, 10, 10]} intensity={0.8} />
      <directionalLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Point lights for glow effect */}
      <pointLight position={[0, 0, 0]} color={0x00d4ff} intensity={1.5} distance={30} />

      {/* Main components */}
      <CentralCore />
      <OrbitingNodes />
      <RotatingRings />
      <EnergyParticles />

      {/* Loading text */}
      {message && (
        <Text position={[0, -12, 0]} fontSize={1.2} color="#00d4ff" anchorX="center" anchorY="middle" font="/fonts/Orbitron-Bold.ttf">
          {message}
        </Text>
      )}

      {/* Camera controls */}
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </>
  );
};

// Main ClusterLoader Component
const ClusterLoader: React.FC<ClusterLoaderProps> = ({ message = 'Loading Cluster Data...', className = '' }) => {
  return (
    <div className={`cluster-loader w-full h-full flex items-center justify-center ${className}`}>
      <div className="w-full h-full min-h-[400px] relative">
        {/* 3D Canvas */}
        <Canvas camera={{ position: [0, 0, 25], fov: 60 }} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
          <LoadingScene message={message} />
        </Canvas>

        {/* Overlay glow effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        </div>

        {/* Loading dots animation */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
};

export default ClusterLoader;
