/**
 * Trend Report View
 * Displays 7-day trend data with charts and insights
 * Based on @rules/trend-report.md specification
 */

'use client';

import { Report } from '@/types/report';
import { TrendReportData } from '@/types/reportTypes';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatBytes, formatNumber } from '@/lib/formatUtils';
import dayjs from 'dayjs';

interface TrendReportViewProps {
   report: Report;
}

export default function TrendReportView({ report }: TrendReportViewProps) {
   const trendData = report.data as unknown as TrendReportData;

   console.log('##### trendData=', trendData);

   if (!trendData) {
      return <div className="text-center py-12 text-slate-500">No trend data available</div>;
   }

   return (
      <div className="space-y-8">
         {/* Report Title Page */}
         <section className="bg-white/80 backdrop-blur-sm rounded-lg p-8 shadow-lg print:shadow-none">
            <h1 className="text-4xl font-bold text-slate-800 mb-4">7-Day Trend Analysis Report</h1>
            <p className="text-xl text-slate-600 mb-6">{report.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
               <div>
                  <p className="text-slate-500">Report Type</p>
                  <p className="font-semibold text-slate-800">Trend Analysis</p>
               </div>
               <div>
                  <p className="text-slate-500">Time Period</p>
                  <p className="font-semibold text-slate-800">Last 7 Days</p>
               </div>
               <div>
                  <p className="text-slate-500">Generated At</p>
                  <p className="font-semibold text-slate-800">{dayjs(report.createdAt).format('YYYY-MM-DD HH:mm')}</p>
               </div>
               <div>
                  <p className="text-slate-500">Report ID</p>
                  <p className="font-semibold text-slate-800">{report.id}</p>
               </div>
            </div>
         </section>

         {/* 1. Capacity Metrics */}
         {trendData.capacity && (
            <section className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg print:shadow-none page-break-after">
               <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-8 bg-blue-500 rounded"></span>
                  1. Capacity Metrics
               </h2>

               {/* Cluster Capacity Trend */}
               {trendData.capacity.clusterCapacity && trendData.capacity.clusterCapacity.length > 0 && (
                  <div className="mb-6">
                     <h3 className="text-lg font-semibold text-slate-700 mb-3">Cluster Capacity Utilization</h3>
                     <div className="h-80 mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={trendData.capacity.clusterCapacity}>
                              <defs>
                                 <linearGradient id="capacityGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                              <XAxis dataKey="timestamp" tickFormatter={ts => dayjs(ts).format('MM-DD HH:mm')} stroke="#64748b" />
                              <YAxis tickFormatter={value => `${(value / 1024 / 1024 / 1024 / 1024).toFixed(1)}TB`} stroke="#64748b" />
                              <Tooltip
                                 labelFormatter={ts => dayjs(ts).format('YYYY-MM-DD HH:mm')}
                                 formatter={(value: any) => [formatBytes(value), 'Capacity']}
                                 contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px', border: '1px solid #e0e0e0' }}
                              />
                              <Legend />
                              <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#capacityGradient)" name="Used Capacity" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 rounded-lg p-4">
                        <div>
                           <p className="text-xs text-slate-500">Average</p>
                           <p className="text-lg font-semibold text-slate-800">{formatBytes(trendData.capacity.statistics.average)}</p>
                        </div>
                        <div>
                           <p className="text-xs text-slate-500">Min / Max</p>
                           <p className="text-lg font-semibold text-slate-800">
                              {formatBytes(trendData.capacity.statistics.min)} / {formatBytes(trendData.capacity.statistics.max)}
                           </p>
                        </div>
                        <div>
                           <p className="text-xs text-slate-500">Trend</p>
                           <p
                              className={`text-lg font-semibold ${trendData.capacity.statistics.trend === 'INCREASING' ? 'text-orange-600' : trendData.capacity.statistics.trend === 'DECREASING' ? 'text-green-600' : 'text-slate-600'}`}
                           >
                              {trendData.capacity.statistics.trend} ({trendData.capacity.statistics.changePercent.toFixed(2)}%)
                           </p>
                        </div>
                        <div>
                           <p className="text-xs text-slate-500">Std Dev</p>
                           <p className="text-lg font-semibold text-slate-800">{formatBytes(trendData.capacity.statistics.standardDeviation)}</p>
                        </div>
                     </div>
                     {trendData.capacity.insights && trendData.capacity.insights.length > 0 && (
                        <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                           {trendData.capacity.insights.map((insight, idx) => (
                              <p key={idx} className="text-sm text-slate-700 mb-2 last:mb-0">
                                 {insight}
                              </p>
                           ))}
                        </div>
                     )}
                  </div>
               )}

               {/* Pool Capacity Trends */}
               {trendData.capacity.poolUsage && Object.keys(trendData.capacity.poolUsage).length > 0 && (
                  <div>
                     <h3 className="text-lg font-semibold text-slate-700 mb-3">Pool Capacity Trends</h3>
                     <div className="grid gap-4">
                        {Object.entries(trendData.capacity.poolUsage).map(([poolName, poolData]) => (
                           <div key={poolName} className="bg-slate-50 rounded-lg p-4">
                              <h4 className="font-medium text-slate-700 mb-2">{poolName}</h4>
                              <div className="h-48">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={poolData}>
                                       <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                       <XAxis dataKey="timestamp" tickFormatter={ts => dayjs(ts).format('MM-DD')} stroke="#64748b" />
                                       <YAxis tickFormatter={value => formatBytes(value)} stroke="#64748b" />
                                       <Tooltip
                                          labelFormatter={ts => dayjs(ts).format('YYYY-MM-DD HH:mm')}
                                          formatter={(value: any) => [formatBytes(value), 'Usage']}
                                       />
                                       <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                                    </AreaChart>
                                 </ResponsiveContainer>
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
            <section className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg print:shadow-none page-break-after">
               <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-8 bg-green-500 rounded"></span>
                  2. Performance Metrics
               </h2>

               <div className="grid md:grid-cols-2 gap-6">
                  {/* Read Latency */}
                  {trendData.performance.readLatency && trendData.performance.readLatency.length > 0 && (
                     <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">Read Latency</h3>
                        <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={trendData.performance.readLatency}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                 <XAxis dataKey="timestamp" tickFormatter={ts => dayjs(ts).format('MM-DD HH:mm')} stroke="#64748b" />
                                 <YAxis tickFormatter={value => `${value.toFixed(2)}ms`} stroke="#64748b" />
                                 <Tooltip
                                    labelFormatter={ts => dayjs(ts).format('YYYY-MM-DD HH:mm')}
                                    formatter={(value: any) => [`${value.toFixed(2)}ms`, 'Read Latency']}
                                 />
                                 <Legend />
                                 <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} name="Read Latency" />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  )}

                  {/* Write Latency */}
                  {trendData.performance.writeLatency && trendData.performance.writeLatency.length > 0 && (
                     <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">Write Latency</h3>
                        <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={trendData.performance.writeLatency}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                 <XAxis dataKey="timestamp" tickFormatter={ts => dayjs(ts).format('MM-DD HH:mm')} stroke="#64748b" />
                                 <YAxis tickFormatter={value => `${value.toFixed(2)}ms`} stroke="#64748b" />
                                 <Tooltip
                                    labelFormatter={ts => dayjs(ts).format('YYYY-MM-DD HH:mm')}
                                    formatter={(value: any) => [`${value.toFixed(2)}ms`, 'Write Latency']}
                                 />
                                 <Legend />
                                 <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} name="Write Latency" />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  )}

                  {/* Total IOPS */}
                  {trendData.performance.totalIops && trendData.performance.totalIops.length > 0 && (
                     <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">Total IOPS</h3>
                        <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={trendData.performance.totalIops}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                 <XAxis dataKey="timestamp" tickFormatter={ts => dayjs(ts).format('MM-DD HH:mm')} stroke="#64748b" />
                                 <YAxis tickFormatter={value => formatNumber(value)} stroke="#64748b" />
                                 <Tooltip
                                    labelFormatter={ts => dayjs(ts).format('YYYY-MM-DD HH:mm')}
                                    formatter={(value: any) => [formatNumber(value), 'IOPS']}
                                 />
                                 <Legend />
                                 <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} name="IOPS" />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  )}

                  {/* Total Throughput */}
                  {trendData.performance.totalThroughput && trendData.performance.totalThroughput.length > 0 && (
                     <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">Total Throughput</h3>
                        <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={trendData.performance.totalThroughput}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                 <XAxis dataKey="timestamp" tickFormatter={ts => dayjs(ts).format('MM-DD HH:mm')} stroke="#64748b" />
                                 <YAxis tickFormatter={value => formatBytes(value) + '/s'} stroke="#64748b" />
                                 <Tooltip
                                    labelFormatter={ts => dayjs(ts).format('YYYY-MM-DD HH:mm')}
                                    formatter={(value: any) => [formatBytes(value) + '/s', 'Throughput']}
                                 />
                                 <Legend />
                                 <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} dot={false} name="Throughput" />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  )}
               </div>

               {/* Statistics */}
               <div className="grid grid-cols-4 gap-4 mt-6 bg-slate-50 rounded-lg p-4">
                  <div>
                     <p className="text-xs text-slate-500">Average</p>
                     <p className="font-semibold text-slate-800">{trendData.performance.statistics.average.toFixed(2)}</p>
                  </div>
                  <div>
                     <p className="text-xs text-slate-500">Min / Max</p>
                     <p className="font-semibold text-slate-800">
                        {trendData.performance.statistics.min.toFixed(2)} / {trendData.performance.statistics.max.toFixed(2)}
                     </p>
                  </div>
                  <div>
                     <p className="text-xs text-slate-500">Trend</p>
                     <p className="font-semibold text-slate-800">{trendData.performance.statistics.trend}</p>
                  </div>
                  <div>
                     <p className="text-xs text-slate-500">Change</p>
                     <p className="font-semibold text-slate-800">{trendData.performance.statistics.changePercent.toFixed(2)}%</p>
                  </div>
               </div>

               {trendData.performance.insights && trendData.performance.insights.length > 0 && (
                  <div className="mt-4 bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
                     {trendData.performance.insights.map((insight, idx) => (
                        <p key={idx} className="text-sm text-slate-700 mb-2 last:mb-0">
                           {insight}
                        </p>
                     ))}
                  </div>
               )}
            </section>
         )}

         {/* 3. Availability Metrics */}
         {trendData.availability && (
            <section className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg print:shadow-none page-break-after">
               <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-8 bg-purple-500 rounded"></span>
                  3. Availability & Reliability Metrics
               </h2>

               <div className="grid md:grid-cols-2 gap-6">
                  {/* Up OSDs */}
                  {trendData.availability.upOsds && trendData.availability.upOsds.length > 0 && (
                     <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">Up OSDs</h3>
                        <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={trendData.availability.upOsds}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                 <XAxis dataKey="timestamp" tickFormatter={ts => dayjs(ts).format('MM-DD')} stroke="#64748b" />
                                 <YAxis stroke="#64748b" />
                                 <Tooltip labelFormatter={ts => dayjs(ts).format('YYYY-MM-DD HH:mm')} />
                                 <Legend />
                                 <Bar dataKey="value" fill="#8b5cf6" name="Up OSDs" />
                              </BarChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  )}

                  {/* Active PGs */}
                  {trendData.availability.activePgs && trendData.availability.activePgs.length > 0 && (
                     <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">Active PGs</h3>
                        <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={trendData.availability.activePgs}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                 <XAxis dataKey="timestamp" tickFormatter={ts => dayjs(ts).format('MM-DD')} stroke="#64748b" />
                                 <YAxis stroke="#64748b" />
                                 <Tooltip labelFormatter={ts => dayjs(ts).format('YYYY-MM-DD HH:mm')} />
                                 <Legend />
                                 <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Active PGs" />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  )}
               </div>

               {trendData.availability.insights && trendData.availability.insights.length > 0 && (
                  <div className="mt-4 bg-purple-50 border-l-4 border-purple-500 rounded-lg p-4">
                     {trendData.availability.insights.map((insight, idx) => (
                        <p key={idx} className="text-sm text-slate-700 mb-2 last:mb-0">
                           {insight}
                        </p>
                     ))}
                  </div>
               )}
            </section>
         )}

         {/* 4. I/O Pattern Metrics */}
         {trendData.ioPattern && (
            <section className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg print:shadow-none">
               <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-8 bg-cyan-500 rounded"></span>
                  4. I/O Pattern Metrics
               </h2>

               <div className="grid md:grid-cols-2 gap-6">
                  {/* Read Ratio */}
                  {trendData.ioPattern.readRatio && trendData.ioPattern.readRatio.length > 0 && (
                     <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">Read Ratio</h3>
                        <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={trendData.ioPattern.readRatio}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                 <XAxis dataKey="timestamp" tickFormatter={ts => dayjs(ts).format('MM-DD')} stroke="#64748b" />
                                 <YAxis tickFormatter={value => `${value}%`} stroke="#64748b" />
                                 <Tooltip
                                    labelFormatter={ts => dayjs(ts).format('YYYY-MM-DD HH:mm')}
                                    formatter={(value: any) => [`${value.toFixed(2)}%`, 'Read Ratio']}
                                 />
                                 <Area type="monotone" dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  )}

                  {/* Queue Length */}
                  {trendData.ioPattern.queueLength && trendData.ioPattern.queueLength.length > 0 && (
                     <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">Operation Queue Length</h3>
                        <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={trendData.ioPattern.queueLength}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                 <XAxis dataKey="timestamp" tickFormatter={ts => dayjs(ts).format('MM-DD')} stroke="#64748b" />
                                 <YAxis stroke="#64748b" />
                                 <Tooltip labelFormatter={ts => dayjs(ts).format('YYYY-MM-DD HH:mm')} />
                                 <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} name="Queue Length" />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  )}
               </div>

               {trendData.ioPattern.insights && trendData.ioPattern.insights.length > 0 && (
                  <div className="mt-4 bg-cyan-50 border-l-4 border-cyan-500 rounded-lg p-4">
                     {trendData.ioPattern.insights.map((insight, idx) => (
                        <p key={idx} className="text-sm text-slate-700 mb-2 last:mb-0">
                           {insight}
                        </p>
                     ))}
                  </div>
               )}
            </section>
         )}

         {/* 5. Recovery & Rebalancing */}
         {trendData.recovery && (
            <section className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg print:shadow-none">
               <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-8 bg-orange-500 rounded"></span>
                  5. Recovery & Rebalancing Metrics
               </h2>

               <div className="grid md:grid-cols-2 gap-6">
                  {/* Recovery Speed */}
                  {trendData.recovery.recoverySpeed && trendData.recovery.recoverySpeed.length > 0 && (
                     <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">Recovery Speed (Bytes/sec)</h3>
                        <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={trendData.recovery.recoverySpeed}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                 <XAxis dataKey="timestamp" tickFormatter={ts => dayjs(ts).format('MM-DD')} stroke="#64748b" />
                                 <YAxis tickFormatter={value => formatBytes(value)} stroke="#64748b" />
                                 <Tooltip
                                    labelFormatter={ts => dayjs(ts).format('YYYY-MM-DD HH:mm')}
                                    formatter={(value: any) => [formatBytes(value) + '/s', 'Recovery Speed']}
                                 />
                                 <Bar dataKey="value" fill="#f97316" />
                              </BarChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  )}

                  {/* Misplaced Objects */}
                  {trendData.recovery.misplacedObjects && trendData.recovery.misplacedObjects.length > 0 && (
                     <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">Misplaced Objects</h3>
                        <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={trendData.recovery.misplacedObjects}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                 <XAxis dataKey="timestamp" tickFormatter={ts => dayjs(ts).format('MM-DD')} stroke="#64748b" />
                                 <YAxis stroke="#64748b" />
                                 <Tooltip labelFormatter={ts => dayjs(ts).format('YYYY-MM-DD HH:mm')} />
                                 <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} name="Misplaced" />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  )}
               </div>

               {trendData.recovery.insights && trendData.recovery.insights.length > 0 && (
                  <div className="mt-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4">
                     {trendData.recovery.insights.map((insight, idx) => (
                        <p key={idx} className="text-sm text-slate-700 mb-2 last:mb-0">
                           {insight}
                        </p>
                     ))}
                  </div>
               )}
            </section>
         )}

         {/* 6. Client Activity */}
         {trendData.clientActivity && (
            <section className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg print:shadow-none">
               <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-8 bg-pink-500 rounded"></span>
                  6. Client Activity Metrics
               </h2>

               {trendData.clientActivity.activeClients && trendData.clientActivity.activeClients.length > 0 && (
                  <div>
                     <h3 className="text-lg font-semibold text-slate-700 mb-3">Active Client Connections</h3>
                     <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={trendData.clientActivity.activeClients}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                              <XAxis dataKey="timestamp" tickFormatter={ts => dayjs(ts).format('MM-DD')} stroke="#64748b" />
                              <YAxis stroke="#64748b" />
                              <Tooltip labelFormatter={ts => dayjs(ts).format('YYYY-MM-DD HH:mm')} />
                              <Area type="monotone" dataKey="value" stroke="#ec4899" fill="#ec4899" fillOpacity={0.3} name="Clients" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               )}

               {trendData.clientActivity.insights && trendData.clientActivity.insights.length > 0 && (
                  <div className="mt-4 bg-pink-50 border-l-4 border-pink-500 rounded-lg p-4">
                     {trendData.clientActivity.insights.map((insight, idx) => (
                        <p key={idx} className="text-sm text-slate-700 mb-2 last:mb-0">
                           {insight}
                        </p>
                     ))}
                  </div>
               )}
            </section>
         )}

         {/* 7. Hardware Resources */}
         {trendData.resources && (
            <section className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg print:shadow-none">
               <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-8 bg-indigo-500 rounded"></span>
                  7. Hardware & Resource Metrics
               </h2>

               <div className="grid md:grid-cols-2 gap-6">
                  {/* CPU Usage */}
                  {trendData.resources.avgCpuUsage && trendData.resources.avgCpuUsage.length > 0 && (
                     <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">CPU Utilization (%)</h3>
                        <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={trendData.resources.avgCpuUsage}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                 <XAxis dataKey="timestamp" tickFormatter={ts => dayjs(ts).format('MM-DD')} stroke="#64748b" />
                                 <YAxis tickFormatter={value => `${value}%`} stroke="#64748b" />
                                 <Tooltip
                                    labelFormatter={ts => dayjs(ts).format('YYYY-MM-DD HH:mm')}
                                    formatter={(value: any) => [`${value.toFixed(2)}%`, 'CPU']}
                                 />
                                 <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={false} name="CPU" />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  )}

                  {/* Memory Usage */}
                  {trendData.resources.avgMemUsage && trendData.resources.avgMemUsage.length > 0 && (
                     <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">Memory Utilization (%)</h3>
                        <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={trendData.resources.avgMemUsage}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                 <XAxis dataKey="timestamp" tickFormatter={ts => dayjs(ts).format('MM-DD')} stroke="#64748b" />
                                 <YAxis tickFormatter={value => `${value}%`} stroke="#64748b" />
                                 <Tooltip
                                    labelFormatter={ts => dayjs(ts).format('YYYY-MM-DD HH:mm')}
                                    formatter={(value: any) => [`${value.toFixed(2)}%`, 'Memory']}
                                 />
                                 <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Memory" />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  )}
               </div>

               {trendData.resources.insights && trendData.resources.insights.length > 0 && (
                  <div className="mt-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg p-4">
                     {trendData.resources.insights.map((insight, idx) => (
                        <p key={idx} className="text-sm text-slate-700 mb-2 last:mb-0">
                           {insight}
                        </p>
                     ))}
                  </div>
               )}
            </section>
         )}

         {/* 8. Errors & Warnings */}
         {trendData.errors && (
            <section className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg print:shadow-none">
               <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-8 bg-red-500 rounded"></span>
                  8. Error & Warning Metrics
               </h2>

               <div className="grid md:grid-cols-2 gap-6">
                  {/* Scrub Errors */}
                  {trendData.errors.scrubErrors && trendData.errors.scrubErrors.length > 0 && (
                     <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">Scrub Errors</h3>
                        <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={trendData.errors.scrubErrors}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                 <XAxis dataKey="timestamp" tickFormatter={ts => dayjs(ts).format('MM-DD')} stroke="#64748b" />
                                 <YAxis stroke="#64748b" />
                                 <Tooltip labelFormatter={ts => dayjs(ts).format('YYYY-MM-DD HH:mm')} />
                                 <Bar dataKey="value" fill="#ef4444" name="Scrub Errors" />
                              </BarChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  )}

                  {/* Read/Write Errors */}
                  {trendData.errors.readErrors && trendData.errors.readErrors.length > 0 && (
                     <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">OSD Read Errors</h3>
                        <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={trendData.errors.readErrors}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                 <XAxis dataKey="timestamp" tickFormatter={ts => dayjs(ts).format('MM-DD')} stroke="#64748b" />
                                 <YAxis stroke="#64748b" />
                                 <Tooltip labelFormatter={ts => dayjs(ts).format('YYYY-MM-DD HH:mm')} />
                                 <Bar dataKey="value" fill="#dc2626" name="Read Errors" />
                              </BarChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  )}
               </div>

               {trendData.errors.insights && trendData.errors.insights.length > 0 && (
                  <div className="mt-4 bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                     {trendData.errors.insights.map((insight, idx) => (
                        <p key={idx} className="text-sm text-slate-700 mb-2 last:mb-0">
                           {insight}
                        </p>
                     ))}
                  </div>
               )}
            </section>
         )}

         {/* AI Insights Summary */}
         {trendData.trendSummary && (
            <section className="bg-gradient-to-br from-ai-primary/10 to-purple-500/10 backdrop-blur-sm rounded-lg p-6 shadow-lg print:shadow-none">
               <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-8 bg-ai-primary rounded"></span>
                  Trend Summary & Key Findings
               </h2>
               <div className="grid gap-4 mb-4">
                  <div>
                     <h3 className="text-sm font-medium text-slate-600 mb-1">Capacity Growth</h3>
                     <p className="text-slate-800">{trendData.trendSummary.capacityGrowth}</p>
                  </div>
                  <div>
                     <h3 className="text-sm font-medium text-slate-600 mb-1">Performance Trend</h3>
                     <p className="text-slate-800">{trendData.trendSummary.performanceTrend}</p>
                  </div>
                  <div>
                     <h3 className="text-sm font-medium text-slate-600 mb-1">Availability Trend</h3>
                     <p className="text-slate-800">{trendData.trendSummary.availabilityTrend}</p>
                  </div>
               </div>
               {trendData.trendSummary.keyFindings && trendData.trendSummary.keyFindings.length > 0 && (
                  <div>
                     <h3 className="text-lg font-semibold text-slate-700 mb-3">Key Findings</h3>
                     <ul className="list-disc list-inside space-y-2">
                        {trendData.trendSummary.keyFindings.map((finding, idx) => (
                           <li key={idx} className="text-slate-700">
                              {finding}
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
