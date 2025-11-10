'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { useRouter } from 'next/navigation';

const CONF = {
   color: 0xffffff, // White color to match original
   objectWidth: 12,
   objectThickness: 3,
   ambientColor: 0x808080, // Brighter ambient light to match original
   light1Color: 0xffffff, // White point light to match original
   perspective: 75,
   cameraZ: 75,
};

interface AnimatedBoxesProps {
   onAnimationStart: () => void;
}

function AnimatedBoxes({ onAnimationStart }: AnimatedBoxesProps) {
   const { size, camera } = useThree();
   const [boxes, setBoxes] = useState<THREE.Mesh[]>([]);
   const groupRef = useRef<THREE.Group>(null);
   const animationStartedRef = useRef(false);

   useEffect(() => {
      camera.position.z = CONF.cameraZ;
   }, [camera]);

   useEffect(() => {
      if (animationStartedRef.current) return;
      animationStartedRef.current = true;

      // Calculate renderer size
      const vFOV = (CONF.perspective * Math.PI) / 180;
      const height = 2 * Math.tan(vFOV / 2) * Math.abs(CONF.cameraZ);
      const width = height * (size.width / size.height);

      const nx = Math.round(width / CONF.objectWidth) + 1;
      const ny = Math.round(height / CONF.objectWidth) + 1;

      const newBoxes: THREE.Mesh[] = [];
      const geometry = new THREE.BoxGeometry(CONF.objectWidth, CONF.objectWidth, CONF.objectThickness);

      for (let i = 0; i < nx; i++) {
         for (let j = 0; j < ny; j++) {
            const material = new THREE.MeshBasicMaterial({
               color: CONF.color,
               transparent: true,
               opacity: 1,
            });
            const mesh = new THREE.Mesh(geometry, material);
            const x = -width / 2 + i * CONF.objectWidth;
            const y = -height / 2 + j * CONF.objectWidth;
            mesh.position.set(x, y, 0);
            newBoxes.push(mesh);
         }
      }

      setBoxes(newBoxes);

      // Make canvas visible immediately after boxes are created, just like the original
      onAnimationStart();

      // Start animations immediately like the original
      newBoxes.forEach(mesh => {
         mesh.rotation.set(0, 0, 0);
         // mesh.material.opacity = 1;
         mesh.position.z = 0;

         const delay = THREE.MathUtils.randFloat(1, 2);
         const rx = THREE.MathUtils.randFloatSpread(2 * Math.PI);
         const ry = THREE.MathUtils.randFloatSpread(2 * Math.PI);
         const rz = THREE.MathUtils.randFloatSpread(2 * Math.PI);

         gsap.to(mesh.rotation, {
            x: rx,
            y: ry,
            z: rz,
            duration: 2,
            delay: delay,
         });

         gsap.to(mesh.position, {
            z: 80,
            duration: 2,
            delay: delay + 0.5,
            ease: 'power1.out',
         });

         gsap.to(mesh.material, {
            opacity: 0,
            duration: 2,
            delay: delay + 0.5,
         });
      });

      return () => {
         geometry.dispose();
         /*newBoxes.forEach(mesh => {
            mesh.material.dispose();
         });*/
      };
   }, [size, onAnimationStart]);

   return (
      <group ref={groupRef}>
         <ambientLight color={CONF.ambientColor} intensity={1} />
         <pointLight color={CONF.light1Color} position={[0, 0, 100]} intensity={2} />
         {boxes.map((box, index) => (
            <primitive key={index} object={box} />
         ))}
      </group>
   );
}

export default function ClusterTopologyError({ error }: { error?: Error | null }) {
   const router = useRouter();
   const [isVisible, setIsVisible] = useState(false);
   const [isRevealed, setIsRevealed] = useState(false);
   const [showText, setShowText] = useState(false);

   const handleAnimationStart = () => {
      setIsVisible(true);
      setTimeout(() => {
         setIsRevealed(true);
         // Small delay to ensure transition works
         setTimeout(() => {
            setShowText(true);
         }, 50);
      }, 3500);
   };

   const handleHomeClick = () => {
      router.push('/');
   };

   return (
      <div className="relative w-full h-screen" style={{ backgroundColor: '#333333' }}>
         {/* Canvas for 3D effect */}
         <Canvas
            className={`fixed top-0 left-0 w-full h-full ${isVisible ? 'opacity-100' : 'opacity-0'} ${isRevealed ? 'hidden' : ''}`}
            camera={{ position: [0, 0, CONF.cameraZ], fov: CONF.perspective }}
            gl={{ antialias: true, alpha: true }}
         >
            <AnimatedBoxes onAnimationStart={handleAnimationStart} />
         </Canvas>

         {/* Content overlay */}
         {isRevealed && (
            <div
               className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 transition-all duration-1000"
               style={{
                  opacity: showText ? 1 : 0,
                  transform: showText ? 'scale(1)' : 'scale(0.5)',
               }}
            >
               <div className="max-w-2xl mx-auto">
                  <main className="mb-8">
                     <h1 className="text-6xl font-bold text-red-400 mb-6 drop-shadow-lg">Topology Loading Failed</h1>
                     <p className="text-xl text-gray-300 mb-4 drop-shadow-md">Failed to load cluster topology data from the API.</p>
                     {error && (
                        <p className="text-sm text-gray-400 mb-6 font-mono bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-red-900">{error.message}</p>
                     )}
                     <p className="text-lg text-gray-300 mb-8">Please check your network connection and try again.</p>
                     <button
                        onClick={handleHomeClick}
                        className="inline-block px-6 py-3 text-lg font-bold text-gray-900 bg-white hover:bg-gray-200 transition-colors duration-200 rounded-lg shadow-lg border-2 border-white cursor-pointer"
                     >
                        Go to Home
                     </button>
                  </main>

                  <footer className="text-gray-500 text-sm">
                     <p>Ceph AI Dashboard - Error Handler</p>
                  </footer>
               </div>
            </div>
         )}
      </div>
   );
}
