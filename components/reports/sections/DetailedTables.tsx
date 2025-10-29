'use client';

import { Card } from '@/components/common';

interface DetailedTablesProps {
   data: {
      osds?: Array<{
         id: number;
         host: string;
         status: string;
         weight: number;
         used: number;
         avail: number;
         usePercent: number;
         pgCount: number;
         device: string;
         deviceClass: string;
      }>;
      pools?: Array<{
         name: string;
         id: number;
         type: string;
         size: number;
         minSize: number;
         pgNum: number;
         pgpNum: number;
         crushRule: string;
         used: number;
         available: number;
      }>;
      clients?: Array<{
         name: string;
         address: string;
         readOps: number;
         writeOps: number;
         readBytes: number;
         writeBytes: number;
      }>;
      configParams?: Array<{
         name: string;
         value: string;
         default: string;
         description: string;
      }>;
   };
}

export default function DetailedTables({ data }: DetailedTablesProps) {
   const osds = data?.osds || [];
   const pools = data?.pools || [];
   const clients = data?.clients || [];
   const configParams = data?.configParams || [];

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

   const getStatusBadge = (status: string) => {
      const statusLower = status.toLowerCase();
      if (statusLower === 'up' || statusLower === 'active') return 'bg-success-500 text-white print:bg-green-600';
      if (statusLower === 'down') return 'bg-danger-500 text-white print:bg-red-600';
      return 'bg-secondary-500 text-white print:bg-gray-600';
   };

   return (
      <div className="space-y-8 print:text-black">
         <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-black">Detailed Data Tables</h1>
            <p className="text-sm text-gray-800 print:text-gray-700">Comprehensive tables with detailed OSD, pool, client, and configuration information</p>
         </div>

         {/* OSD Details Table */}
         <section>
            <h2 className="text-2xl font-semibold mb-4 print:text-black">OSD Details</h2>
            <Card variant="glass" className="p-6 mb-6 print:border print:border-gray-300 print:bg-white">
               <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                     <thead className="bg-gray-50 print:bg-gray-100">
                        <tr>
                           <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase print:text-gray-700">ID</th>
                           <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase print:text-gray-700">Host</th>
                           <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase print:text-gray-700">Device</th>
                           <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase print:text-gray-700">Class</th>
                           <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase print:text-gray-700">Status</th>
                           <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase print:text-gray-700">Weight</th>
                           <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase print:text-gray-700">Used</th>
                           <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase print:text-gray-700">Avail</th>
                           <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase print:text-gray-700">Use%</th>
                           <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase print:text-gray-700">PGs</th>
                        </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200 print:bg-white">
                        {osds.length > 0 ? (
                           osds.map(osd => (
                              <tr key={osd.id}>
                                 <td className="px-2 py-2 whitespace-nowrap font-medium text-gray-900 print:text-black">{osd.id}</td>
                                 <td className="px-2 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">{osd.host}</td>
                                 <td className="px-2 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">{osd.device}</td>
                                 <td className="px-2 py-2 whitespace-nowrap text-center">
                                    <span
                                       className={`px-2 py-1 text-xs font-semibold rounded ${
                                          osd.deviceClass === 'ssd' ? 'bg-blue-500 text-white print:bg-blue-600' : 'bg-gray-500 text-white print:bg-gray-600'
                                       }`}
                                    >
                                       {osd.deviceClass.toUpperCase()}
                                    </span>
                                 </td>
                                 <td className="px-2 py-2 whitespace-nowrap text-center">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadge(osd.status)}`}>{osd.status}</span>
                                 </td>
                                 <td className="px-2 py-2 whitespace-nowrap text-right text-gray-700 print:text-gray-800">{osd.weight.toFixed(2)}</td>
                                 <td className="px-2 py-2 whitespace-nowrap text-right text-gray-700 print:text-gray-800">{formatBytes(osd.used)}</td>
                                 <td className="px-2 py-2 whitespace-nowrap text-right text-gray-700 print:text-gray-800">{formatBytes(osd.avail)}</td>
                                 <td className="px-2 py-2 whitespace-nowrap text-right font-semibold text-gray-900 print:text-black">
                                    {osd.usePercent.toFixed(1)}%
                                 </td>
                                 <td className="px-2 py-2 whitespace-nowrap text-right text-gray-700 print:text-gray-800">{osd.pgCount}</td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan={10} className="px-2 py-4 text-center text-sm text-gray-500 print:text-gray-600">
                                 No OSD data available
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </Card>
         </section>

         {/* Pool Configuration Table */}
         <section className="page-break-before">
            <h2 className="text-2xl font-semibold mb-4 print:text-black">Pool Configuration</h2>
            <Card variant="glass" className="p-6 mb-6 print:border print:border-gray-300 print:bg-white">
               <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                     <thead className="bg-gray-50 print:bg-gray-100">
                        <tr>
                           <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase print:text-gray-700">Name</th>
                           <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase print:text-gray-700">ID</th>
                           <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase print:text-gray-700">Type</th>
                           <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase print:text-gray-700">Size</th>
                           <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase print:text-gray-700">Min Size</th>
                           <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase print:text-gray-700">PG</th>
                           <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase print:text-gray-700">PGP</th>
                           <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase print:text-gray-700">CRUSH Rule</th>
                           <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase print:text-gray-700">Used</th>
                           <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase print:text-gray-700">Available</th>
                        </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200 print:bg-white">
                        {pools.length > 0 ? (
                           pools.map(pool => (
                              <tr key={pool.id}>
                                 <td className="px-2 py-2 whitespace-nowrap font-medium text-gray-900 print:text-black">{pool.name}</td>
                                 <td className="px-2 py-2 whitespace-nowrap text-center text-gray-700 print:text-gray-800">{pool.id}</td>
                                 <td className="px-2 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">{pool.type}</td>
                                 <td className="px-2 py-2 whitespace-nowrap text-center text-gray-700 print:text-gray-800">{pool.size}</td>
                                 <td className="px-2 py-2 whitespace-nowrap text-center text-gray-700 print:text-gray-800">{pool.minSize}</td>
                                 <td className="px-2 py-2 whitespace-nowrap text-right text-gray-700 print:text-gray-800">{pool.pgNum}</td>
                                 <td className="px-2 py-2 whitespace-nowrap text-right text-gray-700 print:text-gray-800">{pool.pgpNum}</td>
                                 <td className="px-2 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">{pool.crushRule}</td>
                                 <td className="px-2 py-2 whitespace-nowrap text-right text-gray-700 print:text-gray-800">{formatBytes(pool.used)}</td>
                                 <td className="px-2 py-2 whitespace-nowrap text-right text-gray-700 print:text-gray-800">{formatBytes(pool.available)}</td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan={10} className="px-2 py-4 text-center text-sm text-gray-500 print:text-gray-600">
                                 No pool data available
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </Card>
         </section>

         {/* Client Information Table */}
         <section>
            <h2 className="text-2xl font-semibold mb-4 print:text-black">Client Connections</h2>
            <Card variant="glass" className="p-6 mb-6 print:border print:border-gray-300 print:bg-white">
               <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                     <thead className="bg-gray-50 print:bg-gray-100">
                        <tr>
                           <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase print:text-gray-700">Client</th>
                           <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase print:text-gray-700">Address</th>
                           <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase print:text-gray-700">Read Ops</th>
                           <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase print:text-gray-700">Write Ops</th>
                           <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase print:text-gray-700">Read</th>
                           <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase print:text-gray-700">Write</th>
                        </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200 print:bg-white">
                        {clients.length > 0 ? (
                           clients.map((client, idx) => (
                              <tr key={idx}>
                                 <td className="px-2 py-2 whitespace-nowrap font-medium text-gray-900 print:text-black">{client.name}</td>
                                 <td className="px-2 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">{client.address}</td>
                                 <td className="px-2 py-2 whitespace-nowrap text-right text-gray-700 print:text-gray-800">{client.readOps.toLocaleString()}</td>
                                 <td className="px-2 py-2 whitespace-nowrap text-right text-gray-700 print:text-gray-800">
                                    {client.writeOps.toLocaleString()}
                                 </td>
                                 <td className="px-2 py-2 whitespace-nowrap text-right text-gray-700 print:text-gray-800">{formatBytes(client.readBytes)}</td>
                                 <td className="px-2 py-2 whitespace-nowrap text-right text-gray-700 print:text-gray-800">{formatBytes(client.writeBytes)}</td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan={6} className="px-2 py-4 text-center text-sm text-gray-500 print:text-gray-600">
                                 No client data available
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </Card>
         </section>

         {/* Configuration Parameters */}
         <section className="page-break-before">
            <h2 className="text-2xl font-semibold mb-4 print:text-black">Configuration Parameters</h2>
            <Card variant="glass" className="p-6 print:border print:border-gray-300 print:bg-white">
               <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                     <thead className="bg-gray-50 print:bg-gray-100">
                        <tr>
                           <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase print:text-gray-700">Parameter</th>
                           <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase print:text-gray-700">Current Value</th>
                           <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase print:text-gray-700">Default Value</th>
                           <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase print:text-gray-700">Description</th>
                        </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200 print:bg-white">
                        {configParams.length > 0 ? (
                           configParams.map((param, idx) => (
                              <tr key={idx}>
                                 <td className="px-2 py-2 whitespace-nowrap font-mono text-xs text-gray-900 print:text-black">{param.name}</td>
                                 <td className="px-2 py-2 whitespace-nowrap font-semibold text-gray-900 print:text-black">{param.value}</td>
                                 <td className="px-2 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">{param.default}</td>
                                 <td className="px-2 py-2 text-gray-700 print:text-gray-800">{param.description}</td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan={4} className="px-2 py-4 text-center text-sm text-gray-500 print:text-gray-600">
                                 No configuration parameters available
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
