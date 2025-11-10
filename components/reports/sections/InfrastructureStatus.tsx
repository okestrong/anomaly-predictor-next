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
            <Card variant="glass" className="p-6 mb-6 print:border print:border-gray-300 print:bg-white">
               <h3 className="text-lg font-medium mb-3 text-white print:text-black">Host Configuration</h3>
               <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50 print:bg-gray-100">
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
                              <tr key={idx} className="text-sm">
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
            </Card>

            {/* Disk Inventory */}
            <Card variant="glass" className="p-6 mb-6 print:border print:border-gray-300 print:bg-white">
               <h3 className="text-lg font-medium mb-3 text-white print:text-black">Disk Inventory</h3>
               <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50 print:bg-gray-100">
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
                              <tr key={idx} className="text-xs">
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
                                    {disk.degradedReason?.map(r => <span>- {r}</span>)}
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
            <Card variant="glass" className="p-6 mb-6 print:border print:border-gray-300 print:bg-white">
               <h3 className="text-lg font-medium mb-3 text-white print:text-black">Pool Configuration</h3>
               <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50 print:bg-gray-100">
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
                              <tr key={idx} className="text-sm">
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

            {/* CRUSH Map Summary */}
            <Card variant="glass" className="p-6 print:border print:border-gray-300 print:bg-white">
               <h3 className="text-lg font-medium mb-3 text-white print:text-black">CRUSH Map Structure</h3>
               <div className="bg-gray-50 p-4 rounded-lg print:bg-gray-100">
                  <p className="text-sm text-gray-700 mb-2 print:text-gray-800">
                     <strong className="print:text-black">Total Buckets:</strong> {data?.crushMap?.buckets?.length || 0}
                  </p>
                  <p className="text-sm text-gray-700 mb-2 print:text-gray-800">
                     <strong className="print:text-black">Total Weight:</strong> {data?.crushMap?.totalWeight?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-sm text-gray-700 mb-2 print:text-gray-800">
                     <strong className="print:text-black">Device Classes:</strong> {data?.crushMap?.deviceClasses?.join(', ') || 'None'}
                  </p>
                  <p className="text-xs text-gray-500 mt-3 print:text-gray-600">Detailed CRUSH Map visualization available in web view</p>
               </div>
            </Card>
         </section>
      </div>
   );
}
