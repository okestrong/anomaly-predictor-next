'use client';

import { Card } from '@/components/common';
import { ReportChart } from '@/components/reports/ReportChart';

interface PerformanceMetricsProps {
   data: {
      iops?: {
         poolTrends?: any;
         peakPatterns?: any;
         topClients?: Array<{
            client: string;
            readIOPS: number;
            writeIOPS: number;
            totalIOPS: number;
         }>;
      };
      latency?: {
         distribution?: any;
         percentiles?: {
            p50?: number;
            p95?: number;
            p99?: number;
         };
         slowRequests?: Array<{
            timestamp: string;
            osd: number;
            latency: number;
            operation: string;
         }>;
      };
      throughput?: {
         trends?: any;
         poolBandwidth?: any;
         recoveryImpact?: {
            normalThroughput?: number;
            recoveryThroughput?: number;
            impactPercent?: number;
         };
      };
   };
}

export default function PerformanceMetrics({ data }: PerformanceMetricsProps) {
   const iops = data?.iops || {};
   const latency = data?.latency || {};
   const throughput = data?.throughput || {};

   const formatNumber = (num?: number) => {
      if (!num) return '0';
      if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
      return num.toLocaleString();
   };

   return (
      <div className="space-y-8 print:text-black">
         <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-black">Performance Metrics</h1>
            <p className="text-sm text-gray-800 print:text-gray-700">Detailed analysis of IOPS, latency, and throughput performance</p>
         </div>

         {/* IOPS Analysis */}
         <section>
            <h2 className="text-2xl font-semibold mb-4 print:text-black">IOPS Analysis</h2>

            {/* IOPS Charts */}
            {iops.poolTrends && (
               <div className="mb-6">
                  <h3 className="text-base font-semibold mb-3 text-gray-900 print:text-black">Pool IOPS Trends</h3>
                  <div data-chart="iops-trend" className="w-full overflow-hidden border border-gray-300 p-4 bg-white">
                     <ReportChart trendData={iops.poolTrends} height={260} />
                  </div>
               </div>
            )}

            {/* Top Clients by IOPS */}
            {iops.topClients && iops.topClients.length > 0 && (
               <Card variant="default" className="p-6 mb-6 print:border print:border-gray-300 print:bg-white">
                  <h3 className="text-lg font-medium mb-3 text-white print:text-black">Top Clients by IOPS</h3>
                  <div className="overflow-x-auto">
                     <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 print:bg-gray-50">
                           <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Rank</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Client</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Read IOPS</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">
                                 Write IOPS
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">
                                 Total IOPS
                              </th>
                           </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 print:bg-white">
                           {iops.topClients.slice(0, 10).map((client, idx) => (
                              <tr key={`perf-client-${client.client}-${idx}`} className="text-sm">
                                 <td className="px-4 py-2 whitespace-nowrap text-gray-900 print:text-black">#{idx + 1}</td>
                                 <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900 print:text-black">{client.client}</td>
                                 <td className="px-4 py-2 whitespace-nowrap text-right text-gray-700 print:text-gray-800">{formatNumber(client.readIOPS)}</td>
                                 <td className="px-4 py-2 whitespace-nowrap text-right text-gray-700 print:text-gray-800">{formatNumber(client.writeIOPS)}</td>
                                 <td className="px-4 py-2 whitespace-nowrap text-right font-semibold text-gray-900 print:text-black">
                                    {formatNumber(client.totalIOPS)}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </Card>
            )}
         </section>

         {/* Latency Analysis */}
         <section className="page-break-before">
            <h2 className="text-2xl font-semibold mb-4 print:text-black">Latency Analysis</h2>

            {/* Latency Percentiles */}
            <Card variant="default" className="p-6 mb-6 print:border print:border-gray-300 print:bg-white">
               <h3 className="text-lg font-medium mb-3 text-white print:text-black">Latency Percentiles</h3>
               <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 print:bg-blue-100">
                     <p className="text-xs text-blue-600 mb-1 print:text-blue-800">P50 (Median)</p>
                     <p className="text-2xl font-bold text-blue-900 print:text-black">{latency.percentiles?.p50?.toFixed(2) || '0.00'} ms</p>
                     <p className="text-xs text-blue-700 mt-1 print:text-blue-800">50% of requests</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-amber-100 to-amber-200 print:bg-amber-100">
                     <p className="text-xs text-amber-600 mb-1 print:text-amber-800">P95</p>
                     <p className="text-2xl font-bold text-amber-900 print:text-black">{latency.percentiles?.p95?.toFixed(2) || '0.00'} ms</p>
                     <p className="text-xs text-amber-700 mt-1 print:text-amber-800">95% of requests</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-red-100 to-red-200 print:bg-red-100">
                     <p className="text-xs text-red-600 mb-1 print:text-red-800">P99</p>
                     <p className="text-2xl font-bold text-red-900 print:text-black">{latency.percentiles?.p99?.toFixed(2) || '0.00'} ms</p>
                     <p className="text-xs text-red-700 mt-1 print:text-red-800">99% of requests</p>
                  </div>
               </div>
            </Card>

            {/* Latency Distribution Chart */}
            {latency.distribution && (
               <div className="mb-6">
                  <h3 className="text-base font-semibold mb-3 text-gray-900 print:text-black">Latency Distribution</h3>
                  <div data-chart="latency-distribution" className="w-full overflow-hidden border border-gray-300 p-4 bg-white">
                     <ReportChart trendData={latency.distribution} height={260} />
                  </div>
               </div>
            )}

            {/* Slow Requests */}
            {latency.slowRequests && latency.slowRequests.length > 0 && (
               <Card variant="default" className="p-6 mb-6 print:border print:border-gray-300 print:bg-white">
                  <h3 className="text-lg font-medium mb-3 text-white print:text-black">Slow Request Analysis</h3>
                  <div className="overflow-x-auto">
                     <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 print:bg-gray-50">
                           <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Timestamp</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">OSD</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Operation</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Latency</th>
                           </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 print:bg-white">
                           {latency.slowRequests.slice(0, 10).map((req, idx) => (
                              <tr key={`slow-req-${req.timestamp}-${idx}`} className="text-sm">
                                 <td className="px-3 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">{new Date(req.timestamp).toLocaleString()}</td>
                                 <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900 print:text-black">OSD.{req.osd}</td>
                                 <td className="px-3 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">{req.operation}</td>
                                 <td className="px-3 py-2 whitespace-nowrap text-right font-semibold text-red-600 print:text-red-800">
                                    {req.latency.toFixed(2)} ms
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </Card>
            )}
         </section>

         {/* Throughput Analysis */}
         <section>
            <h2 className="text-2xl font-semibold mb-4 print:text-black">Throughput Analysis</h2>

            {/* Throughput Trends */}
            {throughput.trends && (
               <div className="mb-6">
                  <h3 className="text-base font-semibold mb-3 text-gray-900 print:text-black">Throughput Trends</h3>
                  <div data-chart="throughput-trend" className="w-full overflow-hidden border border-gray-300 p-4 bg-white">
                     <ReportChart trendData={throughput.trends} height={260} />
                  </div>
               </div>
            )}

            {/* Recovery Impact */}
            {throughput.recoveryImpact && (
               <Card variant="default" className="p-6 print:border print:border-gray-300 print:bg-white">
                  <h3 className="text-lg font-medium mb-3 text-white print:text-black">Recovery Traffic Impact</h3>
                  <div className="grid grid-cols-3 gap-4">
                     <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg print:bg-green-50">
                        <p className="text-xs text-green-600 mb-1 print:text-green-800">Normal Throughput</p>
                        <p className="text-2xl font-bold text-green-900 print:text-black">{formatNumber(throughput.recoveryImpact.normalThroughput)} MB/s</p>
                     </div>
                     <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg print:bg-amber-50">
                        <p className="text-xs text-amber-600 mb-1 print:text-amber-800">During Recovery</p>
                        <p className="text-2xl font-bold text-amber-900 print:text-black">{formatNumber(throughput.recoveryImpact.recoveryThroughput)} MB/s</p>
                     </div>
                     <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg print:bg-red-50">
                        <p className="text-xs text-red-600 mb-1 print:text-red-800">Impact</p>
                        <p className="text-2xl font-bold text-red-900 print:text-black">{throughput.recoveryImpact.impactPercent?.toFixed(1) || '0.0'}%</p>
                        <p className="text-xs text-red-700 mt-1 print:text-red-800">Performance degradation</p>
                     </div>
                  </div>
               </Card>
            )}
         </section>
      </div>
   );
}
