/**
 * Trend Report View
 * Displays 7-day trend data with ECharts (Daily 리포트와 동일한 방식)
 * Professional A4 paper style matching Daily report
 */

'use client';

import { Report } from '@/types/report';
import { TrendReportData } from '@/types/reportTypes';
import { ReportChart } from '@/components/reports/ReportChart';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import ReportTitlePage from '@/components/reports/sections/ReportTitlePage';

dayjs.extend(utc);

interface TrendReportViewProps {
   report: Report;
}

export default function TrendReportView({ report }: TrendReportViewProps) {
   const trendData = report.data as unknown as TrendReportData;

   if (!trendData) {
      return <div className="text-center py-12 text-gray-500">No trend data available</div>;
   }

   return (
      <div className="space-y-6 print:space-y-0">
         {/* Report Title Section */}
         <section className="mb-6 bg-white shadow-sm p-12 print:shadow-none print:p-0 print:min-h-0">
            <div className="border-b-4 border-cyan-600 pb-4 mb-6">
               <h1 className="text-3xl font-bold text-gray-900 mb-2">{report.title || 'Trend Analysis Report'}</h1>
               <p className="text-sm text-gray-600">{report.description}</p>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
               <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Report Type</p>
                  <p className="font-semibold text-gray-900">Trend Analysis</p>
               </div>
               <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Time Period</p>
                  <p className="font-semibold text-gray-900">{report.timeRange?.label || 'N/A'}</p>
               </div>
               <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Generated At</p>
                  <p className="font-semibold text-gray-900">{dayjs.utc(report.createdAt).local().format('YYYY-MM-DD HH:mm')}</p>
               </div>
               <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Report ID</p>
                  <p className="font-semibold text-gray-900">{report.id}</p>
               </div>
            </div>
         </section>
         <div className="hidden print:block">
            <ReportTitlePage
               type={report.type}
               currentReport={report}
               reportTitle={report.title || 'Trend Analysis Report'}
               generatedAt={report.createdAt}
               timeRange={report.timeRange}
               clusterSummary={{
                  health: report.data?.clusterInfo?.health || 'UNKNOWN',
                  capacityUtilization: report.data?.clusterSummary?.capacityUtilization || 0,
                  activeAlerts: report.data?.clusterInfo?.activeAlerts || 0,
                  totalOsds: report.data?.clusterSummary?.totalOsds || 0,
                  upOsds: report.data?.clusterSummary?.upOsds || 0,
                  totalCapacity: report.data?.clusterSummary?.totalCapacity || 0,
                  usedCapacity: report.data?.clusterSummary?.usedCapacity || 0,
               }}
               clusterInfo={{
                  clusterId: report.data?.clusterInfo?.fsid,
                  cephVersion: report.data?.clusterInfo?.version,
                  hostCount: report.data?.clusterInfo?.hostCount,
                  monCount: report.data?.clusterInfo?.monCount,
                  osdCount: report.data?.clusterInfo?.osdCount,
                  mgrCount: report.data?.clusterInfo?.mgrCount,
                  poolCount: report.data?.clusterInfo?.poolCount,
                  uptime: report.data?.clusterInfo?.uptime,
                  publicNetwork: report.data?.clusterInfo?.publicNetwork,
                  clusterNetwork: report.data?.clusterInfo?.clusterNetwork,
               }}
            />
         </div>

         {/* 1. Capacity Metrics */}
         {trendData.capacity && (
            <section className="mb-6 bg-white shadow-sm min-h-[800px] p-12 page-break-before print:shadow-none print:p-0 print:min-h-0">
               <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-black">1. Capacity Metrics</h1>
                  <p className="text-sm text-gray-800 print:text-gray-700">Storage capacity utilization trends</p>
               </div>

               {/* Cluster Capacity Trend */}
               {trendData.capacity.clusterCapacity && trendData.capacity.clusterCapacity.length > 0 && (
                  <div className="mb-8">
                     <h2 className="text-2xl font-semibold mb-4 text-gray-900 print:text-black">Cluster Capacity Utilization</h2>
                     <div className="border border-gray-300 bg-white p-6 mb-4">
                        <div className="echarts-container" style={{ height: '320px' }}>
                           <ReportChart
                              trendData={{
                                 category: 'Capacity',
                                 data: trendData.capacity.clusterCapacity,
                              }}
                              height={320}
                           />
                        </div>
                        <div className="grid grid-cols-4 gap-4 bg-gray-50 p-4 border border-gray-200 mt-4">
                           <div>
                              <p className="text-xs text-gray-600 mb-1 font-semibold">Average Utilization</p>
                              <p className="text-lg font-bold text-gray-900">{trendData.capacity.statistics.average?.toFixed(2)}%</p>
                           </div>
                           <div>
                              <p className="text-xs text-gray-600 mb-1 font-semibold">Min / Max</p>
                              <p className="text-lg font-bold text-gray-900">
                                 {trendData.capacity.statistics.min?.toFixed(2)}% / {trendData.capacity.statistics.max?.toFixed(2)}%
                              </p>
                           </div>
                           <div>
                              <p className="text-xs text-gray-600 mb-1 font-semibold">Trend</p>
                              <p
                                 className={`text-lg font-bold ${
                                    trendData.capacity.statistics.trend === 'INCREASING'
                                       ? 'text-orange-700'
                                       : trendData.capacity.statistics.trend === 'DECREASING'
                                         ? 'text-green-700'
                                         : 'text-gray-700'
                                 }`}
                              >
                                 {trendData.capacity.statistics.trend} ({trendData.capacity.statistics.changePercent?.toFixed(2)}%)
                              </p>
                           </div>
                           <div>
                              <p className="text-xs text-gray-600 mb-1 font-semibold">Std Dev</p>
                              <p className="text-lg font-bold text-gray-900">{trendData.capacity.statistics.standardDeviation?.toFixed(2)}%</p>
                           </div>
                        </div>
                        {trendData.capacity.insights && trendData.capacity.insights.length > 0 && (
                           <div className="mt-4 bg-blue-50 border-l-4 border-cyan-600 p-4">
                              {trendData.capacity.insights.map((insight, idx) => (
                                 <p key={idx} className="text-sm text-gray-800 mb-2 last:mb-0">
                                    • {insight}
                                 </p>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {/* Pool Capacity Trends */}
               {trendData.capacity.poolUsage && Object.keys(trendData.capacity.poolUsage).length > 0 && (
                  <div>
                     <h2 className="text-2xl font-semibold mb-4 text-gray-900 print:text-black">Pool Capacity Trends</h2>
                     <div className="grid gap-4">
                        {Object.entries(trendData.capacity.poolUsage).map(([poolName, poolData]) => (
                           <div key={poolName} className="bg-gray-50 border border-gray-200 p-4">
                              <h3 className="font-semibold text-gray-900 mb-3 text-base">{poolName}</h3>
                              <div className="echarts-container" style={{ height: '200px' }}>
                                 <ReportChart
                                    trendData={{
                                       category: 'Capacity',
                                       data: poolData,
                                    }}
                                    height={200}
                                 />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </section>
         )}

         {/* 2. Performance Metrics */}
         {trendData.performance && (
            <section className="mb-6 bg-white shadow-sm min-h-[800px] p-12 page-break-before print:shadow-none print:p-0 print:min-h-0">
               <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-black">2. Performance Metrics</h1>
                  <p className="text-sm text-gray-800 print:text-gray-700">I/O latency, throughput, and IOPS trends</p>
               </div>

               <div className="grid md:grid-cols-2 print:grid-cols-2 gap-6">
                  {/* Read Latency */}
                  {trendData.performance.readLatency && trendData.performance.readLatency.length > 0 && (
                     <div className="border border-gray-300 bg-white p-4 print:overflow-hidden">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Read Latency</h3>
                        <div className="echarts-container" style={{ height: '250px' }}>
                           <ReportChart
                              trendData={{
                                 category: 'Latency',
                                 data: trendData.performance.readLatency,
                              }}
                              height={250}
                           />
                        </div>
                     </div>
                  )}

                  {/* Write Latency */}
                  {trendData.performance.writeLatency && trendData.performance.writeLatency.length > 0 && (
                     <div className="border border-gray-300 bg-white p-4 print:overflow-hidden">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Write Latency</h3>
                        <div className="echarts-container" style={{ height: '250px' }}>
                           <ReportChart
                              trendData={{
                                 category: 'Latency',
                                 data: trendData.performance.writeLatency,
                              }}
                              height={250}
                           />
                        </div>
                     </div>
                  )}

                  {/* Total IOPS */}
                  {trendData.performance.totalIops && trendData.performance.totalIops.length > 0 && (
                     <div className="border border-gray-300 bg-white p-4 print:overflow-hidden">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Total IOPS</h3>
                        <div className="echarts-container" style={{ height: '250px' }}>
                           <ReportChart
                              trendData={{
                                 category: 'IOPS',
                                 data: trendData.performance.totalIops,
                              }}
                              height={250}
                           />
                        </div>
                     </div>
                  )}

                  {/* Total Throughput */}
                  {trendData.performance.totalThroughput && trendData.performance.totalThroughput.length > 0 && (
                     <div className="border border-gray-300 bg-white p-4 print:overflow-hidden">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Total Throughput</h3>
                        <div className="echarts-container" style={{ height: '250px' }}>
                           <ReportChart
                              trendData={{
                                 category: 'Throughput',
                                 data: trendData.performance.totalThroughput,
                              }}
                              height={250}
                           />
                        </div>
                     </div>
                  )}
               </div>

               {/* Statistics */}
               <div className="grid grid-cols-4 gap-4 mt-6 bg-gray-50 p-4 border border-gray-200">
                  <div>
                     <p className="text-xs text-gray-600 mb-1 font-semibold">Average</p>
                     <p className="font-bold text-gray-900">{trendData.performance.statistics.average.toFixed(2)}</p>
                  </div>
                  <div>
                     <p className="text-xs text-gray-600 mb-1 font-semibold">Min / Max</p>
                     <p className="font-bold text-gray-900">
                        {trendData.performance.statistics.min.toFixed(2)} / {trendData.performance.statistics.max.toFixed(2)}
                     </p>
                  </div>
                  <div>
                     <p className="text-xs text-gray-600 mb-1 font-semibold">Trend</p>
                     <p className="font-bold text-gray-900">{trendData.performance.statistics.trend}</p>
                  </div>
                  <div>
                     <p className="text-xs text-gray-600 mb-1 font-semibold">Change</p>
                     <p className="font-bold text-gray-900">{trendData.performance.statistics.changePercent.toFixed(2)}%</p>
                  </div>
               </div>

               {trendData.performance.insights && trendData.performance.insights.length > 0 && (
                  <div className="mt-4 bg-green-50 border-l-4 border-green-600 p-4">
                     {trendData.performance.insights.map((insight, idx) => (
                        <p key={idx} className="text-sm text-gray-800 mb-2 last:mb-0">
                           • {insight}
                        </p>
                     ))}
                  </div>
               )}
            </section>
         )}

         {/* 3. Availability & Reliability Metrics */}
         {trendData.availability && (
            <section className="mb-6 bg-white shadow-sm min-h-[800px] p-12 page-break-before print:shadow-none print:p-0 print:min-h-0">
               <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-black">3. Availability & Reliability Metrics</h1>
                  <p className="text-sm text-gray-800 print:text-gray-700">OSD and placement group availability trends</p>
               </div>

               <div className="grid md:grid-cols-2 print:grid-cols-2 gap-6">
                  {trendData.availability.upOsds && trendData.availability.upOsds.length > 0 && (
                     <div className="border border-gray-300 bg-white p-4 print:overflow-hidden">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Up OSDs</h3>
                        <div className="echarts-container" style={{ height: '250px' }}>
                           <ReportChart trendData={{ category: 'Count', data: trendData.availability.upOsds }} height={250} />
                        </div>
                     </div>
                  )}

                  {trendData.availability.activePgs && trendData.availability.activePgs.length > 0 && (
                     <div className="border border-gray-300 bg-white p-4 print:overflow-hidden">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Active PGs</h3>
                        <div className="echarts-container" style={{ height: '250px' }}>
                           <ReportChart trendData={{ category: 'Count', data: trendData.availability.activePgs }} height={250} />
                        </div>
                     </div>
                  )}
               </div>

               {trendData.availability.insights && trendData.availability.insights.length > 0 && (
                  <div className="mt-4 bg-purple-50 border-l-4 border-purple-600 p-4">
                     {trendData.availability.insights.map((insight, idx) => (
                        <p key={idx} className="text-sm text-gray-800 mb-2 last:mb-0">
                           • {insight}
                        </p>
                     ))}
                  </div>
               )}
            </section>
         )}

         {/* 4. I/O Pattern Metrics */}
         {trendData.ioPattern && (
            <section className="mb-6 bg-white shadow-sm min-h-[800px] p-12 page-break-before print:shadow-none print:p-0 print:min-h-0">
               <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-black">4. I/O Pattern Metrics</h1>
                  <p className="text-sm text-gray-800 print:text-gray-700">Read/write ratios and operation queue analysis</p>
               </div>

               <div className="grid md:grid-cols-2 print:grid-cols-2 gap-6">
                  {trendData.ioPattern.readRatio && trendData.ioPattern.readRatio.length > 0 && (
                     <div className="border border-gray-300 bg-white p-4 print:overflow-hidden">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Read Ratio (%)</h3>
                        <div className="echarts-container" style={{ height: '250px' }}>
                           <ReportChart trendData={{ category: 'Percentage', data: trendData.ioPattern.readRatio }} height={250} />
                        </div>
                     </div>
                  )}

                  {trendData.ioPattern.queueLength && trendData.ioPattern.queueLength.length > 0 && (
                     <div className="border border-gray-300 bg-white p-4 print:overflow-hidden">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Operation Queue Length</h3>
                        <div className="echarts-container" style={{ height: '250px' }}>
                           <ReportChart trendData={{ category: 'Count', data: trendData.ioPattern.queueLength }} height={250} />
                        </div>
                     </div>
                  )}
               </div>

               {trendData.ioPattern.insights && trendData.ioPattern.insights.length > 0 && (
                  <div className="mt-4 bg-cyan-50 border-l-4 border-cyan-600 p-4">
                     {trendData.ioPattern.insights.map((insight, idx) => (
                        <p key={idx} className="text-sm text-gray-800 mb-2 last:mb-0">
                           • {insight}
                        </p>
                     ))}
                  </div>
               )}
            </section>
         )}

         {/* 5. Recovery & Rebalancing Metrics */}
         {trendData.recovery && (
            <section className="mb-6 bg-white shadow-sm min-h-[800px] p-12 page-break-before print:shadow-none print:p-0 print:min-h-0">
               <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-black">5. Recovery & Rebalancing Metrics</h1>
                  <p className="text-sm text-gray-800 print:text-gray-700">Data recovery speed and object rebalancing activity</p>
               </div>

               <div className="grid md:grid-cols-2 print:grid-cols-2 gap-6">
                  {trendData.recovery.recoverySpeed && trendData.recovery.recoverySpeed.length > 0 && (
                     <div className="border border-gray-300 bg-white p-4 print:overflow-hidden">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Recovery Speed (Bytes/sec)</h3>
                        <div className="echarts-container" style={{ height: '250px' }}>
                           <ReportChart trendData={{ category: 'Throughput', data: trendData.recovery.recoverySpeed }} height={250} />
                        </div>
                     </div>
                  )}

                  {trendData.recovery.misplacedObjects && trendData.recovery.misplacedObjects.length > 0 && (
                     <div className="border border-gray-300 bg-white p-4 print:overflow-hidden">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Misplaced Objects</h3>
                        <div className="echarts-container" style={{ height: '250px' }}>
                           <ReportChart trendData={{ category: 'Count', data: trendData.recovery.misplacedObjects }} height={250} />
                        </div>
                     </div>
                  )}
               </div>

               {trendData.recovery.insights && trendData.recovery.insights.length > 0 && (
                  <div className="mt-4 bg-orange-50 border-l-4 border-orange-600 p-4">
                     {trendData.recovery.insights.map((insight, idx) => (
                        <p key={idx} className="text-sm text-gray-800 mb-2 last:mb-0">
                           • {insight}
                        </p>
                     ))}
                  </div>
               )}
            </section>
         )}

         {/* 6. Client Activity Metrics */}
         {trendData.clientActivity && (
            <section className="mb-6 bg-white shadow-sm min-h-[800px] p-12 page-break-before print:shadow-none print:p-0 print:min-h-0">
               <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-black">6. Client Activity Metrics</h1>
                  <p className="text-sm text-gray-800 print:text-gray-700">Active client connection trends and patterns</p>
               </div>

               {trendData.clientActivity.activeClients && trendData.clientActivity.activeClients.length > 0 && (
                  <div className="border border-gray-300 bg-white p-4">
                     <h3 className="text-lg font-semibold text-gray-900 mb-3">Active Client Connections</h3>
                     <div className="echarts-container" style={{ height: '300px' }}>
                        <ReportChart trendData={{ category: 'Count', data: trendData.clientActivity.activeClients }} height={300} />
                     </div>
                  </div>
               )}

               {trendData.clientActivity.insights && trendData.clientActivity.insights.length > 0 && (
                  <div className="mt-4 bg-pink-50 border-l-4 border-pink-600 p-4">
                     {trendData.clientActivity.insights.map((insight, idx) => (
                        <p key={idx} className="text-sm text-gray-800 mb-2 last:mb-0">
                           • {insight}
                        </p>
                     ))}
                  </div>
               )}
            </section>
         )}

         {/* 7. Hardware & Resource Metrics */}
         {trendData.resources && (
            <section className="mb-6 bg-white shadow-sm min-h-[800px] p-12 page-break-before print:shadow-none print:p-0 print:min-h-0">
               <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-black">7. Hardware & Resource Metrics</h1>
                  <p className="text-sm text-gray-800 print:text-gray-700">CPU and memory utilization trends across cluster hosts</p>
               </div>

               <div className="grid md:grid-cols-2 print:grid-cols-2 gap-6">
                  {trendData.resources.avgCpuUsage && trendData.resources.avgCpuUsage.length > 0 && (
                     <div className="border border-gray-300 bg-white p-4 print:overflow-hidden">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">CPU Utilization (%)</h3>
                        <div className="echarts-container" style={{ height: '250px' }}>
                           <ReportChart trendData={{ category: 'Percentage', data: trendData.resources.avgCpuUsage }} height={250} />
                        </div>
                     </div>
                  )}

                  {trendData.resources.avgMemUsage && trendData.resources.avgMemUsage.length > 0 && (
                     <div className="border border-gray-300 bg-white p-4 print:overflow-hidden">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Memory Utilization (%)</h3>
                        <div className="echarts-container" style={{ height: '250px' }}>
                           <ReportChart trendData={{ category: 'Percentage', data: trendData.resources.avgMemUsage }} height={250} />
                        </div>
                     </div>
                  )}
               </div>

               {trendData.resources.insights && trendData.resources.insights.length > 0 && (
                  <div className="mt-4 bg-indigo-50 border-l-4 border-indigo-600 p-4">
                     {trendData.resources.insights.map((insight, idx) => (
                        <p key={idx} className="text-sm text-gray-800 mb-2 last:mb-0">
                           • {insight}
                        </p>
                     ))}
                  </div>
               )}
            </section>
         )}

         {/* 8. Error & Warning Metrics */}
         {trendData.errors && (
            <section className="mb-6 bg-white shadow-sm min-h-[800px] p-12 page-break-before print:shadow-none print:p-0 print:min-h-0">
               <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-black">8. Error & Warning Metrics</h1>
                  <p className="text-sm text-gray-800 print:text-gray-700">Scrub errors and OSD read/write error trends</p>
               </div>

               <div className="grid md:grid-cols-2 print:grid-cols-2 gap-6">
                  {trendData.errors.scrubErrors && trendData.errors.scrubErrors.length > 0 && (
                     <div className="border border-gray-300 bg-white p-4 print:overflow-hidden">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Scrub Errors</h3>
                        <div className="echarts-container" style={{ height: '250px' }}>
                           <ReportChart trendData={{ category: 'Count', data: trendData.errors.scrubErrors }} height={250} />
                        </div>
                     </div>
                  )}

                  {trendData.errors.readErrors && trendData.errors.readErrors.length > 0 && (
                     <div className="border border-gray-300 bg-white p-4 print:overflow-hidden">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">OSD Read Errors</h3>
                        <div className="echarts-container" style={{ height: '250px' }}>
                           <ReportChart trendData={{ category: 'Count', data: trendData.errors.readErrors }} height={250} />
                        </div>
                     </div>
                  )}
               </div>

               {trendData.errors.insights && trendData.errors.insights.length > 0 && (
                  <div className="mt-4 bg-red-50 border-l-4 border-red-600 p-4">
                     {trendData.errors.insights.map((insight, idx) => (
                        <p key={idx} className="text-sm text-gray-800 mb-2 last:mb-0">
                           • {insight}
                        </p>
                     ))}
                  </div>
               )}
            </section>
         )}

         {/* 9. Trend Summary & Key Findings */}
         {trendData.trendSummary && (
            <section className="mb-6 bg-white shadow-sm min-h-[800px] p-12 page-break-before print:shadow-none print:p-0 print:min-h-0">
               <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-black">9. Trend Summary & Key Findings</h1>
                  <p className="text-sm text-gray-800 print:text-gray-700">
                     Comprehensive analysis of {report.timeRange?.label?.toLowerCase() || 'trend'} patterns
                  </p>
               </div>
               <div className="grid gap-6 mb-6">
                  <div className="border border-gray-300 bg-white p-6">
                     <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Capacity Growth</h3>
                     <p className="text-gray-900">{trendData.trendSummary.capacityGrowth}</p>
                  </div>
                  <div className="border border-gray-300 bg-white p-6">
                     <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Performance Trend</h3>
                     <p className="text-gray-900">{trendData.trendSummary.performanceTrend}</p>
                  </div>
                  <div className="border border-gray-300 bg-white p-6">
                     <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Availability Trend</h3>
                     <p className="text-gray-900">{trendData.trendSummary.availabilityTrend}</p>
                  </div>
               </div>
               {trendData.trendSummary.keyFindings && trendData.trendSummary.keyFindings.length > 0 && (
                  <div className="border border-gray-300 bg-white p-6">
                     <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Findings</h3>
                     <ul className="space-y-3">
                        {trendData.trendSummary.keyFindings.map((finding, idx) => (
                           <li key={idx} className="text-gray-800 flex items-start gap-3">
                              <span className="w-6 h-6 bg-cyan-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                                 {idx + 1}
                              </span>
                              <span>{finding}</span>
                           </li>
                        ))}
                     </ul>
                  </div>
               )}
            </section>
         )}
      </div>
   );
}
