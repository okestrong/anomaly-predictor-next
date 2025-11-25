'use client';

import { Card } from '@/components/common';

interface ExecutiveSummaryProps {
   data: {
      healthScore?: number;
      kpis?: {
         totalCapacity?: number;
         usedCapacity?: number;
         utilizationPercent?: number;
         totalOsds?: number;
         healthyOsds?: number;
         avgLatency?: number;
         totalIOPS?: number;
         throughput?: number;
      };
      criticalIssues?: Array<{
         severity: string;
         title: string;
         description: string;
         action: string;
      }>;
   };
}

export default function ExecutiveSummary({ data }: ExecutiveSummaryProps) {
   const healthScore = data?.healthScore ?? 0;
   const kpis = data?.kpis || {};
   const criticalIssues = data?.criticalIssues || [];

   // Calculate health status and color
   const getHealthStatus = (score: number) => {
      if (score >= 90) return { status: 'Excellent', color: 'text-success-500', bgColor: 'bg-success-500' };
      if (score >= 75) return { status: 'Good', color: 'text-success-400', bgColor: 'bg-success-400' };
      if (score >= 60) return { status: 'Fair', color: 'text-warning-500', bgColor: 'bg-warning-500' };
      return { status: 'Critical', color: 'text-danger-500', bgColor: 'bg-danger-500' };
   };

   const healthStatus = getHealthStatus(healthScore);

   const formatBytes = (bytes?: number) => {
      if (!bytes) return '0 B';
      const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
      let size = bytes;
      let unitIndex = 0;
      while (size >= 1024 && unitIndex < units.length - 1) {
         size /= 1024;
         unitIndex++;
      }
      return `${size.toFixed(2)} ${units[unitIndex]}`;
   };

   const formatNumber = (num?: number) => {
      if (!num) return '0';
      return num.toLocaleString();
   };

   return (
      <div className="space-y-6 print:space-y-0">
         <div className="mb-6 print:mb-2">
            <h1 className="text-2xl print:text-xl font-bold text-gray-900 mb-1 print:mb-0 border-b-2 border-cyan-600 pb-2">Executive Summary</h1>
            <p className="text-xs print:text-[9px] text-gray-600 mt-1">Comprehensive overview of cluster health, performance, and critical metrics</p>
         </div>

         {/* Cluster Health Score */}
         <div className="border border-gray-300 bg-white">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-300">
               <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide print:hidden">Health Assessment</h2>
               <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide hidden print:block">Health Assessment / Key Performance Indicators</h2>
            </div>
            <div className="grid grid-cols-2 divide-x divide-gray-300">
               <div className="p-6">
                  <h3 className="text-xs font-semibold text-gray-700 mb-4 uppercase tracking-wide">Cluster Health Score</h3>
                  <div className="flex items-center justify-center h-40">
                     {/* Simple circular gauge */}
                     <div className="relative w-64 h-64">
                        <svg className="transform -rotate-90 w-64 h-64">
                           <circle cx="90" cy="126" r="78" stroke="#e5e7eb" strokeWidth="14" fill="none" />
                           <circle
                              cx="90"
                              cy="126"
                              r="78"
                              stroke="currentColor"
                              strokeWidth="14"
                              fill="none"
                              strokeDasharray={`${(healthScore / 100) * 492} 492`}
                              className={healthStatus.color}
                           />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center translate-y-[40px]">
                           <span className="text-3xl font-bold text-gray-900">{healthScore}</span>
                           <span className="text-xs text-gray-600">{healthStatus.status}</span>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="p-6 bg-gray-50 print:p-4">
                  <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Score Methodology</h3>
                  <div className="space-y-2 text-[10px]">
                     {/* Base Health Status */}
                     <div className="bg-white p-2 border border-gray-200">
                        <div className="flex items-start gap-2">
                           <div className="w-4 h-4 bg-cyan-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-white text-[8px] font-bold">1</span>
                           </div>
                           <div className="flex-1">
                              <p className="font-semibold text-gray-900 mb-0.5">Base Health Status</p>
                              <p className="text-gray-600">HEALTH_OK: 95 | HEALTH_WARN: 75 | HEALTH_ERR: 50</p>
                           </div>
                        </div>
                     </div>

                     {/* Uptime Impact */}
                     <div className="bg-white p-2 border border-gray-200">
                        <div className="flex items-start gap-2">
                           <div className="w-4 h-4 bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-white text-[8px] font-bold">2</span>
                           </div>
                           <div className="flex-1">
                              <p className="font-semibold text-gray-900 mb-0.5">Uptime Adjustment</p>
                              <p className="text-gray-600">≥99.9%: +5 | ≥99%: +2 | &lt;98%: -5 | &lt;95%: -10</p>
                           </div>
                        </div>
                     </div>

                     {/* Availability Impact */}
                     <div className="bg-white p-2 border border-gray-200">
                        <div className="flex items-start gap-2">
                           <div className="w-4 h-4 bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-white text-[8px] font-bold">3</span>
                           </div>
                           <div className="flex-1">
                              <p className="font-semibold text-gray-900 mb-0.5">Availability Penalty</p>
                              <p className="text-gray-600">&lt;99.9%: -2 | &lt;99%: -5</p>
                           </div>
                        </div>
                     </div>

                     {/* Active Alarms */}
                     <div className="bg-white p-2 border border-gray-200">
                        <div className="flex items-start gap-2">
                           <div className="w-4 h-4 bg-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-white text-[8px] font-bold">4</span>
                           </div>
                           <div className="flex-1">
                              <p className="font-semibold text-gray-900 mb-0.5">Active Alarms Impact</p>
                              <p className="text-gray-600">&gt;10: -15 | &gt;5: -10 | &gt;0: -5</p>
                           </div>
                        </div>
                     </div>

                     <div className="pt-2 print:pt-1 border-t border-gray-300">
                        <p className="text-[9px] text-gray-500 italic">Final score: combined factors, capped 0-100</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* KPI Dashboard */}
         <div className="border print:border-t-0 border-gray-300 bg-white">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-300 print:hidden">
               <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Key Performance Indicators</h2>
            </div>
            <div className="grid grid-cols-4 divide-x divide-gray-200">
               <div className="p-4 print:p-2 bg-blue-100">
                  <p className="text-[10px] text-blue-700 mb-1 uppercase tracking-wide font-semibold">Total Capacity</p>
                  <p className="text-xl print:text-lg font-bold text-blue-900">{formatBytes(kpis.totalCapacity)}</p>
                  <p className="text-[10px] text-blue-700 mt-1">
                     Used: {formatBytes(kpis.usedCapacity)} ({kpis.utilizationPercent?.toFixed(1)}%)
                  </p>
               </div>
               <div className="p-4 print:p-2 bg-green-100">
                  <p className="text-[10px] text-green-700 mb-1 uppercase tracking-wide font-semibold">OSD Status</p>
                  <p className="text-xl print:text-lg font-bold text-green-900">
                     {kpis.healthyOsds || 0}/{kpis.totalOsds || 0}
                  </p>
                  <p className="text-[10px] text-green-700 mt-1">
                     {kpis.healthyOsds && kpis.totalOsds ? ((kpis.healthyOsds / kpis.totalOsds) * 100).toFixed(1) : 0}% Healthy
                  </p>
               </div>
               <div className="p-4 print:p-2 bg-purple-100">
                  <p className="text-[10px] text-purple-700 mb-1 uppercase tracking-wide font-semibold">Average Latency</p>
                  <p className="text-xl print:text-lg font-bold text-purple-900">{kpis.avgLatency?.toFixed(2) || 0} ms</p>
                  <p className="text-[10px] text-purple-700 mt-1">Read + Write Combined</p>
               </div>
               <div className="p-4 print:p-2 bg-orange-100">
                  <p className="text-[10px] text-orange-700 mb-1 uppercase tracking-wide font-semibold">Total IOPS</p>
                  <p className="text-xl print:text-lg font-bold text-orange-900">{formatNumber(kpis.totalIOPS)}</p>
                  <p className="text-[10px] text-orange-700 mt-1">Operations per Second</p>
               </div>
            </div>
         </div>
      </div>
   );
}
