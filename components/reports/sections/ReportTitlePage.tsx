'use client';

import { Card } from '@/components/common';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import ClusterInformation from '@/components/reports/sections/ClusterInformation';
import ExecutiveSummary from '@/components/reports/sections/ExecutiveSummary';
import type { Report } from '@/types/report';

dayjs.extend(utc);

interface HighRiskPrediction {
   name: string;
   severity: 'high' | 'critical';
   probability: number;
   timeToImpact: string;
}

interface ClusterInfo {
   clusterId?: string; // fsid from backend
   cephVersion?: string; // from backend
   hostCount?: number; // from backend
   monCount?: number; // from backend
   osdCount?: number; // from backend
   mgrCount?: number; // from backend
   poolCount?: number; // from backend
   uptime?: string; // from backend
   publicNetwork?: string; // from backend
   clusterNetwork?: string; // from backend
   deployment?: string;
}

interface ReportTitlePageProps {
   type: string;
   currentReport: Report;
   reportTitle: string;
   reportSubtitle?: string;
   generatedAt: string;
   timeRange: {
      start: string;
      end: string;
   };
   clusterSummary: {
      health: string;
      capacityUtilization: number;
      activeAlerts: number;
      totalOsds: number;
      upOsds: number;
      totalCapacity: number;
      usedCapacity: number;
   };
   clusterInfo?: ClusterInfo; // Optional cluster information from backend
   highRiskPredictions?: HighRiskPrediction[];
   highRiskSummary?: string; // LLM-generated summary
}

const getHealthColor = (health: string) => {
   const healthLower = health.toLowerCase();
   if (healthLower === 'healthy' || healthLower === 'health_ok') {
      return { bg: 'bg-green-100 print:bg-green-50', text: 'text-green-800 print:text-green-900', badge: 'bg-green-500' };
   } else if (healthLower === 'warning' || healthLower === 'health_warn') {
      return { bg: 'bg-yellow-100 print:bg-yellow-50', text: 'text-yellow-800 print:text-yellow-900', badge: 'bg-yellow-500' };
   } else {
      return { bg: 'bg-red-100 print:bg-red-50', text: 'text-red-800 print:text-red-900', badge: 'bg-red-500' };
   }
};

const getSeverityColor = (severity: string) => {
   if (severity === 'critical') {
      return 'bg-red-500 text-white print:bg-red-600';
   } else {
      return 'bg-orange-500 text-white print:bg-orange-600';
   }
};

const formatBytes = (bytes: number): string => {
   const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
   let size = bytes;
   let unitIndex = 0;

   while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
   }

   return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export default function ReportTitlePage({
   type,
   currentReport,
   reportTitle,
   reportSubtitle,
   generatedAt,
   timeRange,
   clusterSummary,
   clusterInfo,
   highRiskPredictions,
   highRiskSummary,
}: ReportTitlePageProps) {
   const healthColors = getHealthColor(clusterSummary.health);
   const predictions = (currentReport.data?.predictions || []).map(p => ({
      id: p.id,
      category: p.category,
      name: p.name,
      severity: p.severity as 'low' | 'medium' | 'high' | 'critical',
      probability: p.probability,
      confidence: p.confidence,
      timeToImpact: p.timeToImpact,
      aiAnalysis: p.aiAnalysis,
      affectedComponents: p.affectedComponents,
      recommendedActions: p.recommendedActions,
      trend: p.trend as 'improving' | 'stable' | 'worsening',
   }));

   return (
      <div className="min-h-screen flex flex-col justify-between p-4 print:text-black">
         {/* Header */}
         <div>
            <div className="mb-4 border-b-4 border-cyan-600 pb-4 print:border-cyan-700">
               <h1 className="text-3xl font-bold text-gray-900 mb-1.5 print:text-black">{reportTitle}</h1>
               <p className="text-sm text-gray-600 print:text-gray-700">{reportSubtitle}</p>
               {/*<p className="text-sm text-gray-600 print:text-gray-700">Ceph Cluster Analysis & Prediction Report</p>*/}
            </div>

            {/* Report Metadata - 4:6 ratio */}
            <div className="mb-4 grid grid-cols-[40%_60%] gap-4">
               <div>
                  <div className="text-xs font-medium text-gray-600 mb-1 print:text-gray-700">Generated At</div>
                  <div className="text-sm font-semibold text-gray-900 print:text-black">{dayjs.utc(generatedAt).local().format('YYYY-MM-DD HH:mm:ss')}</div>
               </div>
               <div>
                  <div className="text-xs font-medium text-gray-600 mb-1 print:text-gray-700">Analysis Period</div>
                  <div className="text-sm font-semibold text-gray-900 print:text-black">
                     {dayjs.utc(timeRange.start).local().format('YYYY-MM-DD HH:mm')} ~ {dayjs.utc(timeRange.end).local().format('YYYY-MM-DD HH:mm')}
                  </div>
               </div>
            </div>

            {/* Cluster Information */}
            <div className="mb-6">
               <ClusterInformation
                  data={{
                     clusterName: 'Cluster-Seoul',
                     site: 'Seoul DC1',
                     environment: 'Production',
                     clusterId: clusterInfo?.clusterId,
                     cephVersion: clusterInfo?.cephVersion,
                     deployment: clusterInfo?.deployment,
                     hostCount: clusterInfo?.hostCount,
                     monCount: clusterInfo?.monCount,
                     osdCount: clusterInfo?.osdCount,
                     mgrCount: clusterInfo?.mgrCount,
                     poolCount: clusterInfo?.poolCount,
                     uptime: clusterInfo?.uptime,
                     publicNetwork: clusterInfo?.publicNetwork,
                     clusterNetwork: clusterInfo?.clusterNetwork,
                  }}
               />
            </div>
            {type === 'DAILY' && (
               <ExecutiveSummary
                  data={{
                     healthScore: currentReport.data?.clusterHealth?.healthScore || 85,
                     kpis: {
                        totalCapacity: currentReport.data?.keyMetrics?.capacity?.totalCapacity,
                        usedCapacity: currentReport.data?.keyMetrics?.capacity?.usedCapacity,
                        utilizationPercent: currentReport.data?.keyMetrics?.capacity?.utilizationPercent,
                        totalOsds: currentReport.data?.keyMetrics?.osdStatus?.totalOsds,
                        healthyOsds: currentReport.data?.keyMetrics?.osdStatus?.healthyOsds,
                        avgLatency: currentReport.data?.keyMetrics?.performance?.avgLatency,
                        totalIOPS: (currentReport.data?.keyMetrics?.performance?.readOps || 0) + (currentReport.data?.keyMetrics?.performance?.writeOps || 0),
                        throughput:
                           (currentReport.data?.keyMetrics?.performance?.readThroughput || 0) +
                           (currentReport.data?.keyMetrics?.performance?.writeThroughput || 0),
                     },
                  }}
               />
            )}

            {/* Cluster Status Summary */}
            {type === 'PREDICTIONS' && (
               <div>
                  {/* Summary Statistics */}
                  <section className="border border-gray-300 bg-white mb-8 print:border print:border-gray-300">
                     <div className="bg-gray-100 px-6 py-3 border-b border-gray-300">
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Detection Overview</h2>
                     </div>
                     <div className="p-6">
                        <div className="grid grid-cols-4 gap-4">
                           <div className="text-center p-4 border border-gray-200 bg-gray-50">
                              <div className="text-xs text-gray-600 mb-1 uppercase font-semibold print:text-gray-700">Total Detections</div>
                              <div className="text-3xl font-bold text-gray-900 print:text-black">{predictions.length}</div>
                           </div>
                           <div className="text-center p-4 border border-red-200 bg-red-50">
                              <div className="text-xs text-red-600 mb-1 uppercase font-semibold print:text-red-800">Critical</div>
                              <div className="text-3xl font-bold text-red-900 print:text-black">
                                 {predictions.filter(p => p.severity === 'critical').length}
                              </div>
                           </div>
                           <div className="text-center p-4 border border-orange-200 bg-orange-50">
                              <div className="text-xs text-orange-600 mb-1 uppercase font-semibold print:text-orange-800">High</div>
                              <div className="text-3xl font-bold text-orange-900 print:text-black">{predictions.filter(p => p.severity === 'high').length}</div>
                           </div>
                           <div className="text-center p-4 border border-blue-200 bg-blue-50">
                              <div className="text-xs text-blue-600 mb-1 uppercase font-semibold print:text-blue-800">Medium/Low</div>
                              <div className="text-3xl font-bold text-blue-900 print:text-black">
                                 {predictions.filter(p => p.severity === 'medium' || p.severity === 'low').length}
                              </div>
                           </div>
                        </div>
                     </div>
                  </section>
                  {/*<Card variant="default" className="p-6 mb-8 print:border-2 print:border-gray-300 !bg-white">
                     <h2 className="text-2xl font-bold text-gray-900 mb-6 print:text-black">Cluster Status Summary</h2>
                     <div className="grid grid-cols-2 gap-6">
                        <div className={`p-4 ${healthColors.bg}`}>
                           <div className="text-sm text-gray-600 mb-2 print:text-gray-700">Health Status</div>
                           <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 rounded-full ${healthColors.badge}`} />
                              <div className={`text-2xl font-bold ${healthColors.text}`}>{clusterSummary.health.toUpperCase()}</div>
                           </div>
                        </div>
                        Capacity
                        <div className="p-4 bg-blue-50 print:bg-blue-50">
                           <div className="text-sm text-blue-600 mb-2 print:text-blue-800">Capacity Utilization</div>
                           <div className="text-2xl font-bold text-blue-900 print:text-black">{clusterSummary.capacityUtilization.toFixed(1)}%</div>
                           <div className="text-xs text-blue-700 mt-1 print:text-blue-800">
                              {formatBytes(clusterSummary.usedCapacity)} / {formatBytes(clusterSummary.totalCapacity)}
                           </div>
                        </div>
                        Active Alerts
                        <div className="p-4 bg-orange-50 print:bg-orange-50">
                           <div className="text-sm text-orange-600 mb-2 print:text-orange-800">Active Alerts</div>
                           <div className="text-2xl font-bold text-orange-900 print:text-black">{clusterSummary.activeAlerts}</div>
                        </div>
                        OSDs
                        <div className="p-4 bg-green-50 print:bg-green-50">
                           <div className="text-sm text-green-600 mb-2 print:text-green-800">OSDs Status</div>
                           <div className="text-2xl font-bold text-green-900 print:text-black">
                              {clusterSummary.upOsds} / {clusterSummary.totalOsds}
                           </div>
                           <div className="text-xs text-green-700 mt-1 print:text-green-800">
                              {((clusterSummary.upOsds / clusterSummary.totalOsds) * 100).toFixed(1)}% UP
                           </div>
                        </div>
                     </div>
                  </Card>*/}
               </div>
            )}

            {/* High Risk Predictions Summary */}
            {type === 'PREDICTIONS' && highRiskPredictions?.[0] && (
               <Card variant="default" className="p-6 print:border-2 print:border-red-300 !bg-red-50 print:break-inside-avoid">
                  <div className="flex items-center space-x-3 mb-6">
                     <div className="w-8 h-8 bg-red-500 flex items-center justify-center print:bg-red-600">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                           />
                        </svg>
                     </div>
                     <h2 className="text-2xl font-bold text-red-800 print:text-red-900">High Risk Predictions ({highRiskPredictions.length})</h2>
                  </div>

                  <div className="space-y-3">
                     {highRiskPredictions.map((prediction, index) => (
                        <div
                           key={`high-pred-${prediction.name}-${index}`}
                           className="flex items-center justify-between p-3 bg-white border border-red-200 print:bg-white print:border-red-300"
                        >
                           <div className="flex items-center space-x-4 flex-1">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getSeverityColor(prediction.severity)}`}>
                                 {prediction.severity}
                              </span>
                              <div className="flex-1">
                                 <div className="font-semibold text-gray-900 print:text-black">{prediction.name}</div>
                              </div>
                           </div>
                           <div className="flex items-center space-x-6 text-sm">
                              <div className="text-right">
                                 <div className="text-xs text-gray-500 print:text-gray-600">Probability</div>
                                 <div className="font-bold text-red-600 print:text-red-700">{(prediction.probability * 100).toFixed(1)}%</div>
                              </div>
                              <div className="text-right">
                                 <div className="text-xs text-gray-500 print:text-gray-600">Time to Impact</div>
                                 <div className="font-bold text-orange-600 print:text-orange-700">{prediction.timeToImpact}</div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* LLM-generated summary */}
                  {highRiskSummary && (
                     <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 print:bg-red-50 print:border-red-300">
                        <div className="flex items-start space-x-2 mb-2">
                           <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0 print:text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2}
                                 d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                              />
                           </svg>
                           <div className="flex-1">
                              <h3 className="text-sm font-bold text-red-800 mb-2 print:text-red-900">AI 분석 요약</h3>
                              <p className="text-sm text-gray-800 leading-relaxed print:text-black whitespace-pre-wrap">{highRiskSummary}</p>
                           </div>
                        </div>
                     </div>
                  )}

                  <div className="mt-4 p-3 bg-red-100 print:bg-red-100">
                     <p className="text-sm text-red-800 print:text-red-900">
                        <strong>⚠ Action Required:</strong> These high-risk predictions require immediate attention. Please review the detailed analysis and
                        recommended actions in the AI Failure Predictions section.
                     </p>
                  </div>
               </Card>
            )}
         </div>

         {/* Footer */}
         <div className="mt-12 pt-6 border-t border-gray-300 print:hidden">
            <div className="flex items-center justify-between text-sm text-gray-600">
               <div>
                  <div className="font-semibold text-gray-900">Ceph AI Anomaly Predictor</div>
                  <div>Generated by automated reporting system</div>
               </div>
               <div className="text-right">
                  <div>Page 1</div>
                  <div>{dayjs().format('YYYY-MM-DD')}</div>
               </div>
            </div>
         </div>
      </div>
   );
}
