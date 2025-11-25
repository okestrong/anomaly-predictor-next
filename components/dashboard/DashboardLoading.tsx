'use client';

import { useEffect, useState } from 'react';

export default function DashboardLoading() {
   const [dots, setDots] = useState('');

   useEffect(() => {
      const interval = setInterval(() => {
         setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);

      return () => clearInterval(interval);
   }, []);

   return (
      <div className="w-full h-full flex items-center justify-center bg-transparent">
         <div className="relative">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 w-32 h-32 rounded-full border-4 border-transparent border-t-cyan-400 border-r-cyan-400 animate-spin" style={{ animationDuration: '2s' }} />

            {/* Middle rotating ring - opposite direction */}
            <div
               className="absolute inset-0 w-32 h-32 rounded-full border-4 border-transparent border-b-blue-500 border-l-blue-500"
               style={{
                  animation: 'spin 3s linear infinite reverse',
               }}
            />

            {/* Inner rotating ring */}
            <div className="absolute inset-0 w-32 h-32 rounded-full border-2 border-transparent border-t-purple-400 animate-spin" style={{ animationDuration: '1.5s' }} />

            {/* Pulsing center glow */}
            <div
               className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-radial from-cyan-500/30 via-blue-500/20 to-transparent"
               style={{
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
               }}
            />

            {/* Inner pulsing core */}
            <div className="absolute inset-0 flex items-center justify-center">
               <div
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400/40 via-blue-500/30 to-purple-500/20"
                  style={{
                     animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
               />
            </div>

            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
               <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     strokeWidth={2}
                     d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
               </svg>
            </div>

            {/* Loading text below */}
            <div className="absolute top-full mt-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
               <p className="text-cyan-400 text-lg font-semibold tracking-wider animate-pulse">
                  Initializing Cluster Visualization{dots}
               </p>
               <p className="text-blue-400/70 text-sm text-center mt-2">Loading 3D topology</p>
            </div>

            {/* Particle effects */}
            <div className="absolute inset-0 w-32 h-32">
               {[...Array(8)].map((_, i) => (
                  <div
                     key={i}
                     className="absolute w-2 h-2 bg-cyan-400 rounded-full opacity-0"
                     style={{
                        top: '50%',
                        left: '50%',
                        animation: `particle-float 3s ease-in-out infinite`,
                        animationDelay: `${i * 0.4}s`,
                        transform: `rotate(${i * 45}deg) translateX(60px)`,
                     }}
                  />
               ))}
            </div>
         </div>

         <style jsx>{`
            @keyframes particle-float {
               0%,
               100% {
                  opacity: 0;
                  transform: rotate(var(--rotation)) translateX(0px) scale(0);
               }
               50% {
                  opacity: 0.6;
                  transform: rotate(var(--rotation)) translateX(60px) scale(1);
               }
            }

            @keyframes pulse {
               0%,
               100% {
                  opacity: 1;
               }
               50% {
                  opacity: 0.5;
               }
            }

            @keyframes spin {
               from {
                  transform: rotate(0deg);
               }
               to {
                  transform: rotate(360deg);
               }
            }
         `}</style>
      </div>
   );
}
