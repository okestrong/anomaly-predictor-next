'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CircleStackIcon, CpuChipIcon, EyeIcon, PresentationChartLineIcon, ServerIcon, ArrowDownOnSquareStackIcon } from '@heroicons/react/24/outline';
import gsap from 'gsap';

interface Component {
   name: string;
   description: string;
   count: string;
   status: 'healthy' | 'warning' | 'error';
   icon: React.ComponentType<{ className?: string }>;
}

interface AnimatedStats {
   iops: number;
   throughput: number;
   aiScore: number;
}

export default function ClusterStatus() {
   // State data
   const [overallHealthPercentage, setOverallHealthPercentage] = useState(88);
   const [uptime] = useState('45d 12h');
   const [version] = useState('19.2.0');
   const [totalNodes] = useState(12);
   const [isLoading] = useState(false);
   const [animatedStats, setAnimatedStats] = useState<AnimatedStats>({
      iops: 0,
      throughput: 0,
      aiScore: 0,
   });

   const [components] = useState<Component[]>([
      {
         name: 'MON Monitors',
         description: 'Monitor daemons',
         count: '3/3',
         status: 'healthy',
         icon: EyeIcon,
      },
      {
         name: 'OSD Nodes',
         description: 'Object storage daemons',
         count: '24/24',
         status: 'healthy',
         icon: CircleStackIcon,
      },
      {
         name: 'MGR Managers',
         description: 'Manager daemons',
         count: '2/2',
         status: 'healthy',
         icon: CpuChipIcon,
      },
      {
         name: 'MDS Servers',
         description: 'Metadata servers',
         count: '2/2',
         status: 'warning',
         icon: ServerIcon,
      },
      {
         name: 'RGW Gateways',
         description: 'RADOS gateways',
         count: '3/3',
         status: 'healthy',
         icon: ArrowDownOnSquareStackIcon,
      },
   ]);

   // Update stats with animation
   const updateStats = () => {
      const newStats = {
         iops: Math.floor(Math.random() * 50 + 100),
         throughput: parseFloat((Math.random() * 2 + 1.5).toFixed(1)),
         aiScore: Math.floor(Math.random() * 10 + 90),
      };

      gsap.to(animatedStats, {
         ...newStats,
         duration: 1,
         ease: 'power2.out',
         onUpdate: () => {
            setAnimatedStats({ ...animatedStats });
         },
      });
   };

   useEffect(() => {
      // Initial stats animation
      updateStats();

      // Periodic updates
      const interval = setInterval(updateStats, 15000);

      return () => clearInterval(interval);
   }, []);

   // Computed properties
   const overallHealthStatus = useMemo(() => {
      if (overallHealthPercentage >= 95) return 'Excellent';
      if (overallHealthPercentage >= 80) return 'Good';
      if (overallHealthPercentage >= 60) return 'Warning';
      return 'Critical';
   }, [overallHealthPercentage]);

   const overallHealthBg = useMemo(() => {
      if (overallHealthPercentage >= 95) return 'bg-success-500/20';
      if (overallHealthPercentage >= 80) return 'bg-info-500/20';
      if (overallHealthPercentage >= 60) return 'bg-warning-500/20';
      return 'bg-danger-500/20';
   }, [overallHealthPercentage]);

   const overallHealthBorder = useMemo(() => {
      if (overallHealthPercentage >= 95) return 'border-success-500';
      if (overallHealthPercentage >= 80) return 'border-info-500';
      if (overallHealthPercentage >= 60) return 'border-warning-500';
      return 'border-danger-500';
   }, [overallHealthPercentage]);

   const overallHealthColor = useMemo(() => {
      if (overallHealthPercentage >= 95) return '#10b981';
      if (overallHealthPercentage >= 80) return '#06b6d4';
      if (overallHealthPercentage >= 60) return '#f59e0b';
      return '#ef4444';
   }, [overallHealthPercentage]);

   const overallHealthText = useMemo(() => {
      if (overallHealthPercentage >= 95) return 'text-success-400';
      if (overallHealthPercentage >= 80) return 'text-info-400';
      if (overallHealthPercentage >= 60) return 'text-warning-400';
      return 'text-danger-400';
   }, [overallHealthPercentage]);

   // Methods
   const getComponentIconColor = (status: string) => {
      switch (status) {
         case 'healthy':
            return 'text-[#00ff41]';
         case 'warning':
            return 'text-amber-500';
         case 'error':
            return 'text-red-500';
         default:
            return 'text-secondary-400';
      }
   };

   return (
      <div className="bg-transparent rounded-b-2xl relative wrapper">
         {/* Overlay stats */}
         <div className="overlay-stats bg-secondary-800/80 shadow-cyber">
            <div className="stat-item">
               <span className="label">IOPS</span>
               <span className="value">{Math.round(animatedStats.iops)}K</span>
            </div>
            <div className="stat-item">
               <span className="label">Throughput</span>
               <span className="value">{animatedStats.throughput.toFixed(1)}GB/s</span>
            </div>
            <div className="stat-item">
               <span className="label">AI Health Score</span>
               <span className="value">{Math.round(animatedStats.aiScore)}/100</span>
            </div>
         </div>

         <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 pb-0 bg-secondary-800/80 p-8">
            <div className="absolute left-8 top-[180px] flex items-center justify-between">
               <div className="flex items-center space-x-2">
                  <PresentationChartLineIcon className="w-5 h-5 text-ai-circuit" />
                  <h3 className="text-lg font-semibold text-white">Cluster Health</h3>
               </div>
            </div>

            <div className="lg:col-span-3 flex justify-center space-x-8">
               <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                     <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-lg neural-pulse ${overallHealthBg}`}>
                        {overallHealthPercentage}%
                        <div
                           className={`absolute inset-0 w-24 h-24 rounded-full border-4 ${overallHealthBorder}`}
                           style={{
                              background: `conic-gradient(${overallHealthColor} ${overallHealthPercentage * 3.6}deg, transparent 0deg)`,
                           }}
                        />
                     </div>
                  </div>
                  <p className={`mt-3 text-sm font-medium ${overallHealthText}`}>{overallHealthStatus}</p>
               </div>

               {/* Quick Stats */}
               <div className="space-y-2">
                  <div className="text-center">
                     <p className="text-xs text-secondary-400">Uptime</p>
                     <p className="text-sm font-bold text-white">{uptime}</p>
                  </div>
                  <div className="text-center">
                     <p className="text-xs text-secondary-400">Version</p>
                     <p className="text-sm font-bold text-white">{version}</p>
                  </div>
                  <div className="text-center">
                     <p className="text-xs text-secondary-400">Nodes</p>
                     <p className="text-sm font-bold text-white">{totalNodes}</p>
                  </div>
               </div>
            </div>

            <div className="lg:col-span-9 lg:-mt-3">
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {components.map(component => (
                     <div key={component.name} className="flex items-center justify-between p-4 bg-secondary-800/30 rounded-2xl">
                        <div className="flex items-center space-x-3">
                           <component.icon className={`w-5 h-5 icon-pulse ${getComponentIconColor(component.status)}`} />
                           <div>
                              <p className="text-sm font-medium text-white">{component.name}</p>
                              <p className="text-xs text-secondary-400">{component.count}</p>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="flex items-center justify-between text-xs text-secondary-400 rounded-b-lg">
            <svg width="100%" height="100%" viewBox="0 250 1440 150" xmlns="http://www.w3.org/2000/svg" className="w-full fill-secondary-800/80">
               <path
                  d="M 0,400 L 0,0 C 278,59.5 556,119 796,119 C 1036,119 1238,59.5 1440,0 L 1440,400 L 0,400 Z"
                  stroke="none"
                  strokeWidth="0"
                  fillOpacity="1"
                  className="transition-all duration-300 ease-in-out delay-150 path-0"
                  transform="rotate(-180 720 200)"
               />
            </svg>
         </div>

         <style jsx>{`
            .wrapper {
               box-shadow:
                  2px -3px 3px rgba(0, 210, 255, 0.3),
                  -2px -3px 3px rgba(0, 210, 255, 0.3);
            }
            .overlay-stats {
               position: absolute;
               border-radius: 4px;
               top: unset !important;
               bottom: 0;
               left: 50%;
               transform: translateX(-50%);
               display: flex;
               gap: 30px;
               padding: 10px 30px;
               backdrop-filter: blur(10px);
               border: 1px solid rgba(0, 210, 255, 0.3);
               z-index: 10;
            }
            .stat-item {
               display: flex;
               flex-direction: column;
               align-items: center;
            }
            .stat-item .label {
               font-size: 12px;
               color: #9ca3af;
               text-transform: uppercase;
               letter-spacing: 1px;
            }
            .stat-item .value {
               font-size: 20px;
               font-weight: bold;
               color: #00d2ff;
               margin-top: 5px;
            }
         `}</style>
      </div>
   );
}
