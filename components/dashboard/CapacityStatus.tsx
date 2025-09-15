'use client';

import React, { useState, useMemo } from 'react';
import { CircleStackIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Card, Button } from '@/components/common';

interface Pool {
   name: string;
   used: string;
   percentage: number;
   type: 'Replicated' | 'Erasure';
   color: string;
}

export default function CapacityStatus() {
   // State data
   const [totalCapacity] = useState('1.2 PB');
   const [usedCapacity] = useState('847 TB');
   const [availableCapacity] = useState('353 TB');
   const [usagePercentage] = useState(67.8);
   const [dailyGrowth] = useState('12 TB');
   const [timeToFull] = useState('45 days');

   const [pools] = useState<Pool[]>([
      {
         name: 'rbd_pool',
         used: '324 TB',
         percentage: 45,
         type: 'Replicated',
         color: '#00d2ff',
      },
      {
         name: 'cephfs_data',
         used: '198 TB',
         percentage: 28,
         type: 'Erasure',
         color: '#ff0080',
      },
      {
         name: 'rgw_data',
         used: '156 TB',
         percentage: 22,
         type: 'Replicated',
         color: '#00ff41',
      },
      {
         name: 'backup_pool',
         used: '89 TB',
         percentage: 12,
         type: 'Erasure',
         color: '#8b5cf6',
      },
      {
         name: '.mgr',
         used: '2.1 GB',
         percentage: 0.1,
         type: 'Replicated',
         color: '#fbbf24',
      },
   ]);

   const [trendData] = useState([45, 48, 52, 58, 61, 65, 68]);

   // Computed properties
   const capacityWarningClass = useMemo(() => {
      const days = parseInt(timeToFull);
      if (days < 30) return 'text-danger-400';
      if (days < 60) return 'text-warning-400';
      return 'text-success-400';
   }, [timeToFull]);

   // Methods
   const refreshCapacity = () => {
      console.log('Refreshing capacity data...');
   };

   const viewStorageDetails = () => {
      console.log('Navigate to storage details');
   };

   return (
      <Card
         variant="ai"
         className="h-full relative overflow-hidden col-span-2"
         header={
            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2">
                  <CircleStackIcon className="w-5 h-5 text-ai-circuit" />
                  <h3 className="text-lg font-semibold text-white">Storage Capacity</h3>
               </div>
               <Button size="xs" variant="cyber" onClick={refreshCapacity}>
                  <ArrowPathIcon className="w-3 h-3" />
               </Button>
            </div>
         }
         footer={
            <div className="flex items-center justify-between text-xs text-secondary-400">
               <div className="flex items-center space-x-4">
                  <span>Growth: +{dailyGrowth} / day</span>
                  <span className={capacityWarningClass}>{timeToFull}</span>
               </div>
               <Button size="xs" variant="secondary" onClick={viewStorageDetails}>
                  View Details
               </Button>
            </div>
         }
      >
         {/* Total capacity gauge */}
         <div className="text-center mb-6 relative z-10 pt-4">
            <div className="relative inline-block">
               {/* Background circle */}
               <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                  <path
                     className="stroke-secondary-700"
                     strokeWidth="3"
                     fill="none"
                     d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                     className="stroke-ai-circuit"
                     strokeWidth="3"
                     fill="none"
                     strokeLinecap="round"
                     strokeDasharray={`${usagePercentage}, 100`}
                     d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                     style={{ filter: 'drop-shadow(0 0 8px rgba(0, 210, 255, 0.5))' }}
                  />
               </svg>

               {/* Center text */}
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{usagePercentage}%</span>
                  <span className="text-xs text-secondary-400">Used</span>
               </div>
            </div>

            <div className="mt-3 text-sm">
               <p className="text-white font-medium">
                  {usedCapacity} / {totalCapacity}
               </p>
               <p className="text-xs text-secondary-400 mt-1">{availableCapacity} available</p>
            </div>
         </div>

         {/* Pool usage */}
         <div className="space-y-3 mb-6 relative z-10 px-4">
            <h4 className="text-sm font-medium text-white border-b border-secondary-700 pb-2">Pool Usage</h4>

            {pools.map(pool => (
               <div key={pool.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pool.color }} />
                        <span className="text-sm text-white">{pool.name}</span>
                     </div>
                     <span className="text-sm font-medium text-white">{pool.used}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-secondary-700 rounded-full h-2">
                     <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                           width: `${pool.percentage}%`,
                           backgroundColor: pool.color,
                           boxShadow: `0 0 8px ${pool.color}50`,
                        }}
                     />
                  </div>

                  <div className="flex items-center justify-between text-xs text-secondary-400">
                     <span>{pool.percentage}% used</span>
                     <span>{pool.type}</span>
                  </div>
               </div>
            ))}
         </div>

         {/* 7-day trend */}
         <div className="space-y-3 relative z-10 px-4">
            <h4 className="text-sm font-medium text-white border-b border-secondary-700 pb-2">7-Day Trend</h4>

            {/* Simple sparkline */}
            <div className="flex items-end space-x-1 h-12">
               {trendData.map((value, index) => (
                  <div
                     key={index}
                     className="bg-ai-glow rounded-t-sm transition-all duration-300 hover:bg-ai-circuit"
                     style={{
                        height: `${value}%`,
                        width: 'calc(100% / 7)',
                        boxShadow: '0 0 4px rgba(255, 0, 128, 0.3)',
                     }}
                     title={`Day ${index + 1}: ${value}%`}
                  />
               ))}
            </div>

            <div className="flex justify-between text-xs text-secondary-400">
               <span>7 days ago</span>
               <span>Today</span>
            </div>
         </div>
      </Card>
   );
}
