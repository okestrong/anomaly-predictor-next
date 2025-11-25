'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CircleStackIcon, EyeIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline';
import gsap from 'gsap';
import { useDashboardStore } from '@/stores/dashboard';
import { useShallow } from 'zustand/react/shallow';

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
   const { iops, throughput, clusterHealth, isLoading } = useDashboardStore(
      useShallow(state => ({
         iops: state.iops,
         throughput: state.throughput,
         clusterHealth: state.clusterHealth,
         isLoading: state.isLoading,
      })),
   );
   const [animatedStats, setAnimatedStats] = useState<AnimatedStats>({
      iops: 0,
      throughput: 0,
      aiScore: 0,
   });

   // Calculate health percentage based on backend data
   const overallHealthPercentage = useMemo(() => {
      if (!clusterHealth) return 0;

      // OSD health: (up / total) * 100
      const osdHealth = clusterHealth.osds?.total ? (clusterHealth.osds.up / clusterHealth.osds.total) * 100 : 0;

      // PG health: (activeClean / total) * 100
      const pgHealth = clusterHealth.pgs?.total ? (clusterHealth.pgs.activeClean / clusterHealth.pgs.total) * 100 : 0;

      // Monitor health: (active / total) * 100
      const monHealth = clusterHealth.monitors?.total ? (clusterHealth.monitors.active / clusterHealth.monitors.total) * 100 : 0;

      // Status-based weight
      let statusWeight = 100;
      if (clusterHealth.status === 'HEALTH_WARN') statusWeight = 70;
      if (clusterHealth.status === 'HEALTH_ERR') statusWeight = 30;

      // Weighted average: OSD 40%, PG 40%, Status 15%, Monitor 5%
      const healthPercent = osdHealth * 0.4 + pgHealth * 0.4 + statusWeight * 0.15 + monHealth * 0.05;

      return Math.round(Math.max(0, Math.min(100, healthPercent)));
   }, [clusterHealth]);

   const version = clusterHealth?.version || 'N/A';

   // Calculate total nodes: OSDs + Monitors
   const totalNodes = useMemo(() => {
      if (!clusterHealth) return 0;
      return (clusterHealth.osds?.total || 0) + (clusterHealth.monitors?.total || 0);
   }, [clusterHealth]);

   // Format uptime from seconds to human-readable string (e.g., "17d 12h 30m")
   const formatUptime = (seconds: number): string => {
      if (!seconds || seconds <= 0) return 'N/A';

      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);

      return parts.length > 0 ? parts.join(' ') : '0m';
   };

   const uptime = formatUptime(clusterHealth?.uptime || 0);

   // Build components array from backend data
   const components: Component[] = useMemo(() => {
      if (!clusterHealth) return [];

      const comps: Component[] = [];

      // Monitors
      if (clusterHealth.monitors) {
         comps.push({
            name: 'Monitors',
            description: 'Cluster monitors',
            count: `${clusterHealth.monitors.active}/${clusterHealth.monitors.total} active`,
            status: clusterHealth.monitors.active === clusterHealth.monitors.total ? 'healthy' : 'warning',
            icon: EyeIcon,
         });
      }

      // OSDs
      if (clusterHealth.osds) {
         comps.push({
            name: 'OSDs',
            description: 'Object Storage Daemons',
            count: `${clusterHealth.osds.up}/${clusterHealth.osds.total} up`,
            status: clusterHealth.osds.up === clusterHealth.osds.total ? 'healthy' : clusterHealth.osds.down > 0 ? 'error' : 'warning',
            icon: CircleStackIcon,
         });
      }

      // PGs
      if (clusterHealth.pgs) {
         const pgHealthy = clusterHealth.pgs.activeClean === clusterHealth.pgs.total;
         comps.push({
            name: 'Placement Groups',
            description: 'PG distribution',
            count: `${clusterHealth.pgs.activeClean}/${clusterHealth.pgs.total} clean`,
            status: pgHealthy ? 'healthy' : clusterHealth.pgs.degraded > 0 ? 'warning' : 'healthy',
            icon: PresentationChartLineIcon,
         });
      }

      return comps;
   }, [clusterHealth]);

   // Update stats with animation
   const updateStats = () => {
      // Get IOPS from dashboardData.charts.iops
      const currentReadIops = iops?.currentReadIops || 0;
      const currentWriteIops = iops?.currentWriteIops || 0;
      const totalIops = currentReadIops + currentWriteIops;

      // Get throughput from dashboardData.charts.throughput (in MB/s)
      const currentReadMb = throughput?.currentReadMb || 0;
      const currentWriteMb = throughput?.currentWriteMb || 0;
      const totalThroughput = currentReadMb + currentWriteMb;

      const newStats = {
         iops: totalIops,
         throughput: totalThroughput,
         aiScore: overallHealthPercentage,
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
      // Update stats when cluster health data changes
      if (clusterHealth) {
         updateStats();
      }
   }, [clusterHealth]);

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
         <div className="overlay-stats bg-secondary-800/80 shadow-cyber -translate-y-20">
            <div className="stat-item">
               <span className="label">IOPS</span>
               <span className="value">{Math.round(animatedStats.iops)}</span>
            </div>
            <div className="stat-item">
               <span className="label">Throughput</span>
               <span className="value">{animatedStats.throughput.toFixed(1)}</span>
            </div>
            <div className="stat-item">
               <span className="label">AI Health Score</span>
               <span className="value">{Math.round(animatedStats.aiScore)}/100</span>
            </div>
         </div>

         <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 pb-0 bg-secondary-800/50 p-8">
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
                        <span className="z-20">{overallHealthPercentage}%</span>
                        <div
                           className={`z-10 absolute inset-0 w-24 h-24 rounded-full border-4 ${overallHealthBorder}`}
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
                     <p className="text-xs text-secondary-400">Version</p>
                     <p className="text-sm font-bold text-white">{version}</p>
                  </div>
                  <div className="text-center">
                     <p className="text-xs text-secondary-400">Total Nodes</p>
                     <p className="text-sm font-bold text-white">{totalNodes}</p>
                  </div>
                  <div className="text-center">
                     <p className="text-xs text-secondary-400">Uptime</p>
                     <p className="text-sm font-bold text-white">{uptime}</p>
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
            <svg width="100%" height="100%" viewBox="0 250 1440 150" xmlns="http://www.w3.org/2000/svg" className="w-full fill-secondary-800/50">
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
