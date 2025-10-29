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
      risks?: Array<{
         level: string;
         category: string;
         description: string;
         impact: string;
      }>;
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
   const risks = data?.risks || [];
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
      <div className="space-y-6 print:text-black">
         <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-black">Executive Summary</h1>
            <p className="text-sm text-gray-800 print:text-gray-700">Comprehensive overview of cluster health, performance, and critical metrics</p>
         </div>

         {/* Cluster Health Score */}
         <Card variant="glass" className="p-6 print:border print:border-gray-300 print:bg-white">
            <div className="grid grid-cols-2 gap-6">
               <div>
                  <h2 className="text-xl font-semibold mb-4 text-white print:text-black">Cluster Health Score</h2>
                  <div className="flex items-center justify-center h-48">
                     {/* Simple circular gauge */}
                     <div className="relative w-40 h-40">
                        <svg className="transform -rotate-90 w-40 h-40">
                           <circle cx="80" cy="80" r="70" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                           <circle
                              cx="80"
                              cy="80"
                              r="70"
                              stroke="currentColor"
                              strokeWidth="12"
                              fill="none"
                              strokeDasharray={`${(healthScore / 100) * 439.6} 439.6`}
                              className={healthStatus.color}
                           />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span className="text-3xl font-bold text-white print:text-black">{healthScore}</span>
                           <span className="text-sm text-gray-400 print:text-gray-700">{healthStatus.status}</span>
                        </div>
                     </div>
                  </div>
               </div>
               <div>
                  <h2 className="text-xl font-semibold mb-4 text-white print:text-black">Risk Assessment</h2>
                  <div className="space-y-3">
                     {risks.length > 0 ? (
                        risks.slice(0, 3).map((risk, idx) => (
                           <div key={idx} className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 print:bg-amber-50">
                              <div className="flex items-start justify-between">
                                 <span className="text-xs font-semibold text-amber-800 print:text-amber-900">{risk.level.toUpperCase()}</span>
                                 <span className="text-xs text-amber-600 print:text-amber-700">{risk.category}</span>
                              </div>
                              <p className="text-sm text-gray-700 mt-1 print:text-gray-800">{risk.description}</p>
                              <p className="text-xs text-gray-600 mt-1 print:text-gray-700">Impact: {risk.impact}</p>
                           </div>
                        ))
                     ) : (
                        <div className="p-3 bg-success-50 rounded-lg border border-success-200 print:bg-green-50">
                           <p className="text-sm text-success-700 print:text-green-800">No significant risks detected</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </Card>

         {/* KPI Dashboard */}
         <Card variant="glass" className="p-6 print:border print:border-gray-300 print:bg-white">
            <h2 className="text-xl font-semibold mb-4 text-white print:text-black">Key Performance Indicators</h2>
            <div className="grid grid-cols-4 gap-4">
               <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg print:bg-blue-50">
                  <p className="text-xs text-blue-600 mb-1 print:text-blue-800">Total Capacity</p>
                  <p className="text-2xl font-bold text-blue-900 print:text-black">{formatBytes(kpis.totalCapacity)}</p>
                  <p className="text-xs text-blue-700 mt-1 print:text-blue-800">
                     Used: {formatBytes(kpis.usedCapacity)} ({kpis.utilizationPercent?.toFixed(1)}%)
                  </p>
               </div>
               <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg print:bg-green-50">
                  <p className="text-xs text-green-600 mb-1 print:text-green-800">OSD Status</p>
                  <p className="text-2xl font-bold text-green-900 print:text-black">
                     {kpis.healthyOsds || 0}/{kpis.totalOsds || 0}
                  </p>
                  <p className="text-xs text-green-700 mt-1 print:text-green-800">
                     {kpis.healthyOsds && kpis.totalOsds ? ((kpis.healthyOsds / kpis.totalOsds) * 100).toFixed(1) : 0}% Healthy
                  </p>
               </div>
               <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg print:bg-purple-50">
                  <p className="text-xs text-purple-600 mb-1 print:text-purple-800">Average Latency</p>
                  <p className="text-2xl font-bold text-purple-900 print:text-black">{kpis.avgLatency?.toFixed(2) || 0} ms</p>
                  <p className="text-xs text-purple-700 mt-1 print:text-purple-800">Read + Write Combined</p>
               </div>
               <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg print:bg-orange-50">
                  <p className="text-xs text-orange-600 mb-1 print:text-orange-800">Total IOPS</p>
                  <p className="text-2xl font-bold text-orange-900 print:text-black">{formatNumber(kpis.totalIOPS)}</p>
                  <p className="text-xs text-orange-700 mt-1 print:text-orange-800">Operations per Second</p>
               </div>
            </div>
         </Card>

         {/* Critical Issues & Action Items */}
         <Card variant="glass" className="p-6 print:border print:border-gray-300 print:bg-white">
            <h2 className="text-xl font-semibold mb-4 text-white print:text-black">Critical Issues & Action Items</h2>
            <div className="space-y-3">
               {criticalIssues.length > 0 ? (
                  criticalIssues.map((issue, idx) => (
                     <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <span
                           className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                              issue.severity === 'critical'
                                 ? 'bg-danger-500 text-white print:bg-red-600'
                                 : issue.severity === 'warning'
                                   ? 'bg-warning-500 text-white print:bg-yellow-600'
                                   : 'bg-info-500 text-white print:bg-blue-600'
                           }`}
                        >
                           {issue.severity.toUpperCase()}
                        </span>
                        <div className="flex-1">
                           <p className="font-medium text-gray-900 print:text-black">{issue.title}</p>
                           <p className="text-sm text-gray-700 mt-1 print:text-gray-800">{issue.description}</p>
                           <p className="text-sm font-medium text-blue-600 mt-2 print:text-blue-800">Action: {issue.action}</p>
                        </div>
                     </div>
                  ))
               ) : (
                  <div className="p-4 bg-success-50 rounded-lg border border-success-200 print:bg-green-50 text-center">
                     <p className="text-sm text-success-700 print:text-green-800">No critical issues detected. System is operating normally.</p>
                  </div>
               )}
            </div>
         </Card>
      </div>
   );
}
