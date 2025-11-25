'use client';

import { Card } from '@/components/common';

interface Host {
   hostname: string;
   cpuCores?: number;
   cpuModel?: string;
   cpuUsage?: number;
   memoryGB?: number;
   memUsage?: number;
   osdCount?: number;
   status?: string;
   networkRxMBps?: number;
   networkTxMBps?: number;
}

interface Disk {
   osdId: number;
   hostname: string;
   device: string;
   deviceClass: string;
   sizeBytes: number;
   usedBytes: number;
   healthStatus?: string;
   degradedReason?: string[];
}

interface Pool {
   name: string;
   type: string;
   size: number;
   minSize: number;
   pgNum: number;
   used: number;
   available: number;
}

interface InfrastructureStatusProps {
   data: {
      hosts?: Host[];
      disks?: Disk[];
      pools?: Pool[];
      crushMap?: any;
      networkTopology?: any;
      pgDistribution?: any;
   };
}

export default function InfrastructureStatus({ data }: InfrastructureStatusProps) {
   const hosts = data?.hosts || [];
   const disks = data?.disks || [];
   const pools = data?.pools || [];

   const formatBytes = (bytes: number) => {
      const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
      let size = bytes;
      let unitIndex = 0;
      while (size >= 1024 && unitIndex < units.length - 1) {
         size /= 1024;
         unitIndex++;
      }
      return `${size.toFixed(2)} ${units[unitIndex]}`;
   };

   const getStatusBadge = (status?: string) => {
      const statusLower = status?.toLowerCase() || 'unknown';
      if (statusLower === 'up' || statusLower === 'healthy' || statusLower === 'active') return 'bg-success-500 text-white print:bg-green-600';
      if (statusLower === 'degraded') return 'bg-warning-500 text-white print:bg-yellow-600';
      if (statusLower === 'warning') return 'bg-warning-500 text-white print:bg-yellow-600';
      if (statusLower === 'down' || statusLower === 'unhealthy') return 'bg-danger-500 text-white print:bg-red-600';
      return 'bg-secondary-500 text-white print:bg-gray-600';
   };

   return (
      <div className="space-y-8 print:text-black">
         <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-black">Infrastructure Status</h1>
            <p className="text-sm text-gray-800 print:text-gray-700">Physical and logical infrastructure configuration and health</p>
         </div>

         {/* Physical Infrastructure */}
         <section>
            <h2 className="text-2xl font-semibold mb-4 print:text-black">Physical Infrastructure</h2>

            {/* Host Information */}
            <Card variant="default" className="p-6 mb-6 print:border print:border-gray-300 print:bg-white">
               <h3 className="text-lg font-medium mb-3 text-white print:text-black">Host Configuration</h3>
               <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50 print:bg-gray-50">
                        <tr>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Hostname</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">CPU</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Memory</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">OSDs</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Status</th>
                        </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200 print:bg-white">
                        {hosts.length > 0 ? (
                           hosts.map((host, idx) => (
                              <tr key={`host-${host.hostname || idx}`} className="text-sm">
                                 <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900 print:text-black">{host.hostname}</td>
                                 <td className="px-4 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">
                                    {host.cpuCores || 'N/A'} cores
                                    {host.cpuUsage && <div className="text-xs text-gray-500 print:text-gray-600">{host.cpuUsage}% loaded</div>}
                                    {host.cpuModel && <div className="ml-1 text-xs text-gray-500 print:text-gray-600">({host.cpuModel})</div>}
                                 </td>
                                 <td className="px-4 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">
                                    {host.memoryGB || 'N/A'} GB
                                    {host.memUsage && <div className="text-xs text-gray-500 print:text-gray-600">{host.memUsage}% used</div>}
                                 </td>
                                 <td className="px-4 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">{host.osdCount || 0}</td>
                                 <td className="px-4 py-2 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadge(host.status)}`}>{host.status || 'Unknown'}</span>
                                 </td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500 print:text-gray-600">
                                 No host information available
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>

               {/* Status Legend - Elegant design for report */}
               <div className="mt-6 pt-6 border-t border-gray-200 print:border-gray-300">
                  <h4 className="text-sm font-semibold text-gray-500 print:text-gray-800 mb-4 tracking-wide uppercase">Host Status Reference</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* Healthy Status */}
                     <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-emerald-50 to-green-50 print:bg-emerald-50 border border-emerald-200 print:border-emerald-300">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500 print:bg-emerald-600 flex items-center justify-center shadow-sm">
                           <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                           </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1.5">
                              <h5 className="text-sm font-bold text-emerald-900 print:text-emerald-900">Healthy</h5>
                              <span className="text-xs text-emerald-600 print:text-emerald-700 font-medium">정상</span>
                           </div>
                           <ul className="space-y-1 text-xs text-emerald-800 print:text-emerald-900 leading-relaxed">
                              <li className="flex items-start">
                                 <span className="mr-1.5 mt-0.5 text-emerald-500">•</span>
                                 <span>All OSDs operational</span>
                              </li>
                              <li className="flex items-start">
                                 <span className="mr-1.5 mt-0.5 text-emerald-500">•</span>
                                 <span>CPU/Memory usage &lt; 70%</span>
                              </li>
                              <li className="flex items-start">
                                 <span className="mr-1.5 mt-0.5 text-emerald-500">•</span>
                                 <span>Network communication normal</span>
                              </li>
                           </ul>
                        </div>
                     </div>

                     {/* Degraded Status */}
                     <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-amber-50 to-yellow-50 print:bg-amber-50 border border-amber-200 print:border-amber-300">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500 print:bg-amber-600 flex items-center justify-center shadow-sm">
                           <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2.5}
                                 d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                           </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1.5">
                              <h5 className="text-sm font-bold text-amber-900 print:text-amber-900">Degraded</h5>
                              <span className="text-xs text-amber-600 print:text-amber-700 font-medium">성능 저하</span>
                           </div>
                           <ul className="space-y-1 text-xs text-amber-800 print:text-amber-900 leading-relaxed">
                              <li className="flex items-start">
                                 <span className="mr-1.5 mt-0.5 text-amber-500">•</span>
                                 <span>Some OSDs offline</span>
                              </li>
                              <li className="flex items-start">
                                 <span className="mr-1.5 mt-0.5 text-amber-500">•</span>
                                 <span>High resource usage (70-90%)</span>
                              </li>
                              <li className="flex items-start">
                                 <span className="mr-1.5 mt-0.5 text-amber-500">•</span>
                                 <span>Network latency detected</span>
                              </li>
                           </ul>
                        </div>
                     </div>

                     {/* Warning Status */}
                     <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-orange-50 to-red-50 print:bg-orange-50 border border-orange-200 print:border-orange-300">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500 print:bg-orange-600 flex items-center justify-center shadow-sm">
                           <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                           </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1.5">
                              <h5 className="text-sm font-bold text-orange-900 print:text-orange-900">Warning</h5>
                              <span className="text-xs text-orange-600 print:text-orange-700 font-medium">경고</span>
                           </div>
                           <ul className="space-y-1 text-xs text-orange-800 print:text-orange-900 leading-relaxed">
                              <li className="flex items-start">
                                 <span className="mr-1.5 mt-0.5 text-orange-500">•</span>
                                 <span>Threshold exceeded (&gt; 90%)</span>
                              </li>
                              <li className="flex items-start">
                                 <span className="mr-1.5 mt-0.5 text-orange-500">•</span>
                                 <span>OSD errors occurring</span>
                              </li>
                              <li className="flex items-start">
                                 <span className="mr-1.5 mt-0.5 text-orange-500">•</span>
                                 <span>Severe network issues</span>
                              </li>
                           </ul>
                        </div>
                     </div>

                     {/* Down Status */}
                     <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-red-50 to-rose-50 print:bg-red-50 border border-red-200 print:border-red-300">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500 print:bg-red-600 flex items-center justify-center shadow-sm">
                           <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                           </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1.5">
                              <h5 className="text-sm font-bold text-red-900 print:text-red-900">Down</h5>
                              <span className="text-xs text-red-600 print:text-red-700 font-medium">중단</span>
                           </div>
                           <ul className="space-y-1 text-xs text-red-800 print:text-red-900 leading-relaxed">
                              <li className="flex items-start">
                                 <span className="mr-1.5 mt-0.5 text-red-500">•</span>
                                 <span>Host not responding</span>
                              </li>
                              <li className="flex items-start">
                                 <span className="mr-1.5 mt-0.5 text-red-500">•</span>
                                 <span>All OSDs offline</span>
                              </li>
                              <li className="flex items-start">
                                 <span className="mr-1.5 mt-0.5 text-red-500">•</span>
                                 <span>Immediate attention required</span>
                              </li>
                           </ul>
                        </div>
                     </div>
                  </div>
               </div>
            </Card>

            {/* Disk Inventory */}
            <Card variant="default" className="p-6 mb-6 print:border print:border-gray-300 print:bg-white">
               <h3 className="text-lg font-medium mb-3 text-white print:text-black">Disk Inventory</h3>
               <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50 print:bg-gray-50">
                        <tr>
                           <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">OSD ID</th>
                           <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Host</th>
                           <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Device</th>
                           <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Class</th>
                           <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Size</th>
                           <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Health</th>
                           <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Reason</th>
                        </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200 print:bg-white">
                        {disks.length > 0 ? (
                           disks.map((disk, idx) => (
                              <tr key={`disk-${disk.osdId || idx}`} className="text-xs">
                                 <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900 print:text-black">{disk.osdId}</td>
                                 <td className="px-3 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">{disk.hostname}</td>
                                 <td className="px-3 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">{disk.device}</td>
                                 <td className="px-3 py-2 whitespace-nowrap">
                                    <span
                                       className={`px-2 py-1 text-xs font-semibold rounded ${
                                          disk.deviceClass === 'ssd' ? 'bg-blue-500 text-white print:bg-blue-600' : 'bg-gray-500 text-white print:bg-gray-600'
                                       }`}
                                    >
                                       {disk.deviceClass.toUpperCase()}
                                    </span>
                                 </td>
                                 <td className="px-3 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">{formatBytes(disk.sizeBytes)}</td>
                                 <td className="px-3 py-2 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadge(disk.healthStatus)}`}>
                                       {disk.healthStatus || 'Unknown'}
                                    </span>
                                 </td>
                                 <td className="px-3 py-2 text-gray-700 print:text-gray-800 flex flex-col items-start">
                                    <span className="whitespace-pre-wrap break-words">{disk.degradedReason?.join(', ')}</span>
                                 </td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-500 print:text-gray-600">
                                 No disk information available
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </Card>
         </section>

         {/* Logical Structure */}
         <section className="page-break-before">
            <h2 className="text-2xl font-semibold mb-4 print:text-black">Logical Structure</h2>

            {/* Pool Configuration */}
            <Card variant="default" className="p-6 mb-6 print:border print:border-gray-300 print:bg-white">
               <h3 className="text-lg font-medium mb-3 text-white print:text-black">Pool Configuration</h3>
               <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50 print:bg-gray-50">
                        <tr>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Pool Name</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Type</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Size</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">PG Count</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Used</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Available</th>
                        </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200 print:bg-white">
                        {pools.length > 0 ? (
                           pools.map((pool, idx) => (
                              <tr key={`pool-${pool.name || idx}`} className="text-sm">
                                 <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900 print:text-black">{pool.name}</td>
                                 <td className="px-4 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">
                                    {pool.type}
                                    <div className="text-xs text-gray-500 print:text-gray-600">
                                       Size: {pool.size} / Min: {pool.minSize}
                                    </div>
                                 </td>
                                 <td className="px-4 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">{pool.size}</td>
                                 <td className="px-4 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">{pool.pgNum}</td>
                                 <td className="px-4 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">{formatBytes(pool.used)}</td>
                                 <td className="px-4 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">{formatBytes(pool.available)}</td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500 print:text-gray-600">
                                 No pool information available
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </Card>
         </section>
      </div>
   );
}
