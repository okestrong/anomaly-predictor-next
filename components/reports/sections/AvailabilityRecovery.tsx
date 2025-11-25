'use client';

import { Card } from '@/components/common';

interface AvailabilityRecoveryProps {
   data: {
      dataProtection?: {
         replicationCompliance?: number;
         scrubCompletionRate?: number;
         deepScrubCompletionRate?: number;
         pgConsistencyRate?: number;
      };
      replicationStatus?: Array<{
         pool: string;
         targetSize: number;
         currentSize: number;
         compliance: boolean;
      }>;
      scrubStatus?: Array<{
         pg: string;
         lastScrub?: string;
         lastDeepScrub?: string;
         status: string;
         scrubDuration?: number;
      }>;
   };
}

export default function AvailabilityRecovery({ data }: AvailabilityRecoveryProps) {
   const dataProtection = data?.dataProtection || {};
   const replicationStatus = data?.replicationStatus || [];
   const scrubStatus = data?.scrubStatus || [];

   const getComplianceColor = (rate: number) => {
      if (rate >= 95) return { bg: 'bg-success-500 print:bg-green-600', text: 'text-success-500 print:text-green-800' };
      if (rate >= 85) return { bg: 'bg-warning-500 print:bg-yellow-600', text: 'text-warning-500 print:text-yellow-800' };
      return { bg: 'bg-danger-500 print:bg-red-600', text: 'text-danger-500 print:text-red-800' };
   };

   return (
      <div className="space-y-8 print:text-black">
         <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-black">Availability & Recovery</h1>
            <p className="text-sm text-gray-800 print:text-gray-700">Data protection status and compliance rates</p>
         </div>

         {/* Data Protection Status */}
         <section>
            <h2 className="text-2xl font-semibold mb-4 print:text-black">Data Protection Status</h2>
            <Card variant="default" className="p-6 mb-6 print:border print:border-gray-300 print:bg-white">
               <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200">
                     <p className="text-xs text-blue-600 mb-1 print:text-blue-800">Replication Compliance</p>
                     <p className="text-2xl font-bold text-blue-900 print:text-black">{dataProtection.replicationCompliance?.toFixed(1) || '0.0'}%</p>
                     <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden print:bg-gray-300">
                        <div
                           className={`h-full ${getComplianceColor(dataProtection.replicationCompliance || 0).bg}`}
                           style={{ width: `${dataProtection.replicationCompliance || 0}%` }}
                        />
                     </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 flex flex-col justify-between">
                     <div>
                        <p className="text-xs text-green-600 mb-1 print:text-green-800">Scrub Completion</p>
                        <p className="text-2xl font-bold text-green-900 print:text-black">{dataProtection.scrubCompletionRate?.toFixed(1) || '0.0'}%</p>
                     </div>
                     <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden print:bg-gray-300">
                        <div
                           className={`h-full ${getComplianceColor(dataProtection.scrubCompletionRate || 0).bg}`}
                           style={{ width: `${dataProtection.scrubCompletionRate || 0}%` }}
                        />
                     </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 flex flex-col justify-between">
                     <p className="text-xs text-purple-600 mb-1 print:text-purple-800">PG Consistency</p>
                     <p className="text-2xl font-bold text-purple-900 print:text-black">{dataProtection.pgConsistencyRate?.toFixed(1) || '0.0'}%</p>
                     <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden print:bg-gray-300">
                        <div
                           className={`h-full ${getComplianceColor(dataProtection.pgConsistencyRate || 0).bg}`}
                           style={{ width: `${dataProtection.pgConsistencyRate || 0}%` }}
                        />
                     </div>
                  </div>
               </div>

               {/* Replication Status Table */}
               <h3 className="text-lg font-medium mb-3 text-white print:text-black">Replication Status by Pool</h3>
               <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50 print:bg-gray-50">
                        <tr>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Pool</th>
                           <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Target Size</th>
                           <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">
                              Current Size
                           </th>
                           <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Compliance</th>
                        </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200 print:bg-white">
                        {replicationStatus.length > 0 ? (
                           replicationStatus.map((rep, idx) => (
                              <tr key={`replication-${rep.pool || idx}`} className="text-sm">
                                 <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900 print:text-black">{rep.pool}</td>
                                 <td className="px-4 py-2 whitespace-nowrap text-center text-gray-700 print:text-gray-800">{rep.targetSize}</td>
                                 <td className="px-4 py-2 whitespace-nowrap text-center text-gray-700 print:text-gray-800">{rep.currentSize}</td>
                                 <td className="px-4 py-2 whitespace-nowrap text-center">
                                    <span
                                       className={`px-2 py-1 text-xs font-semibold rounded ${
                                          rep.compliance ? 'bg-success-500 text-white print:bg-green-600' : 'bg-danger-500 text-white print:bg-red-600'
                                       }`}
                                    >
                                       {rep.compliance ? 'Compliant' : 'Non-Compliant'}
                                    </span>
                                 </td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500 print:text-gray-600">
                                 No replication status data available
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </Card>
         </section>

         {/* Recent Scrub Activity */}
         <section>
            <h2 className="text-2xl font-semibold mb-4 print:text-black">Recent Scrub Activity</h2>
            <Card variant="default" className="p-6 print:border print:border-gray-300 print:bg-white">
               <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50 print:bg-gray-50">
                        <tr>
                           <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">PG</th>
                           <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Last Scrub</th>
                           <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">
                              Last Deep Scrub
                           </th>
                           <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Status</th>
                        </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200 print:bg-white">
                        {scrubStatus.length > 0 ? (
                           scrubStatus.slice(0, 5).map((scrub, idx) => (
                              <tr key={`scrub-${scrub.pg || idx}`} className="text-sm">
                                 <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900 print:text-black">{scrub.pg}</td>
                                 <td className="px-3 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">
                                    {scrub.lastScrub ? new Date(scrub.lastScrub).toLocaleDateString() : 'N/A'}
                                 </td>
                                 <td className="px-3 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">
                                    {scrub.lastDeepScrub ? new Date(scrub.lastDeepScrub).toLocaleDateString() : 'N/A'}
                                 </td>
                                 <td className="px-3 py-2 whitespace-nowrap text-center">
                                    <span
                                       className={`px-2 py-1 text-xs font-semibold rounded ${
                                          scrub.status.toLowerCase() === 'active' || scrub.status.toLowerCase() === 'clean'
                                             ? 'bg-success-500 text-white print:bg-green-600'
                                             : 'bg-warning-500 text-white print:bg-yellow-600'
                                       }`}
                                    >
                                       {scrub.status}
                                    </span>
                                 </td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan={4} className="px-3 py-4 text-center text-sm text-gray-500 print:text-gray-600">
                                 No scrub status data available
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
                  {scrubStatus.length > 5 && (
                     <p className="text-xs text-gray-500 mt-2 text-center print:text-gray-600">
                        Showing 5 of {scrubStatus.length} PGs. See Detailed Tables section for complete list.
                     </p>
                  )}
               </div>
            </Card>
         </section>
      </div>
   );
}
