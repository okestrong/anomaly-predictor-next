'use client';

import { Card } from '@/components/common';

interface AvailabilityRecoveryProps {
   data: {
      dataProtection?: {
         replicationCompliance?: number;
         scrubCompletionRate?: number;
         deepScrubCompletionRate?: number;
         pgConsistencyRate?: number;
         backupCompliance?: number;
      };
      recoveryReadiness?: {
         mtbf?: number;
         mttr?: number;
         rto?: number;
         rpo?: number;
         lastDisasterRecoveryTest?: string;
         drTestResult?: string;
      };
      replicationStatus?: Array<{
         pool: string;
         targetSize: number;
         currentSize: number;
         compliance: boolean;
      }>;
      scrubStatus?: Array<{
         pg: string;
         lastScrub: string;
         lastDeepScrub: string;
         status: string;
      }>;
   };
}

export default function AvailabilityRecovery({ data }: AvailabilityRecoveryProps) {
   const dataProtection = data?.dataProtection || {};
   const recoveryReadiness = data?.recoveryReadiness || {};
   const replicationStatus = data?.replicationStatus || [];
   const scrubStatus = data?.scrubStatus || [];

   const getComplianceColor = (rate: number) => {
      if (rate >= 95) return { bg: 'bg-success-500 print:bg-green-600', text: 'text-success-500 print:text-green-800' };
      if (rate >= 85) return { bg: 'bg-warning-500 print:bg-yellow-600', text: 'text-warning-500 print:text-yellow-800' };
      return { bg: 'bg-danger-500 print:bg-red-600', text: 'text-danger-500 print:text-red-800' };
   };

   const formatDuration = (hours?: number) => {
      if (!hours) return 'N/A';
      if (hours < 1) return `${(hours * 60).toFixed(0)} minutes`;
      if (hours < 24) return `${hours.toFixed(1)} hours`;
      return `${(hours / 24).toFixed(1)} days`;
   };

   return (
      <div className="space-y-8 print:text-black">
         <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-black">Availability & Recovery</h1>
            <p className="text-sm text-gray-800 print:text-gray-700">Data protection status, compliance rates, and disaster recovery readiness</p>
         </div>

         {/* Data Protection Status */}
         <section>
            <h2 className="text-2xl font-semibold mb-4 print:text-black">Data Protection Status</h2>
            <Card variant="glass" className="p-6 mb-6 print:border print:border-gray-300 print:bg-white">
               <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg print:bg-blue-50">
                     <p className="text-xs text-blue-600 mb-1 print:text-blue-800">Replication Compliance</p>
                     <p className="text-2xl font-bold text-blue-900 print:text-black">{dataProtection.replicationCompliance?.toFixed(1) || '0.0'}%</p>
                     <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden print:bg-gray-300">
                        <div
                           className={`h-full ${getComplianceColor(dataProtection.replicationCompliance || 0).bg}`}
                           style={{ width: `${dataProtection.replicationCompliance || 0}%` }}
                        />
                     </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg print:bg-green-50">
                     <p className="text-xs text-green-600 mb-1 print:text-green-800">Scrub Completion</p>
                     <p className="text-2xl font-bold text-green-900 print:text-black">{dataProtection.scrubCompletionRate?.toFixed(1) || '0.0'}%</p>
                     <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden print:bg-gray-300">
                        <div
                           className={`h-full ${getComplianceColor(dataProtection.scrubCompletionRate || 0).bg}`}
                           style={{ width: `${dataProtection.scrubCompletionRate || 0}%` }}
                        />
                     </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg print:bg-purple-50">
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
                     <thead className="bg-gray-50 print:bg-gray-100">
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
                              <tr key={idx} className="text-sm">
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

         {/* Recovery Readiness */}
         <section>
            <h2 className="text-2xl font-semibold mb-4 print:text-black">Disaster Recovery Readiness</h2>
            <Card variant="glass" className="p-6 mb-6 print:border print:border-gray-300 print:bg-white">
               <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                     <h3 className="text-lg font-medium mb-3 text-white print:text-black">Reliability Metrics</h3>
                     <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded-lg print:bg-blue-50">
                           <p className="text-xs text-blue-600 mb-1 print:text-blue-800">Mean Time Between Failures (MTBF)</p>
                           <p className="text-xl font-bold text-blue-900 print:text-black">{formatDuration(recoveryReadiness.mtbf)}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg print:bg-green-50">
                           <p className="text-xs text-green-600 mb-1 print:text-green-800">Mean Time To Recover (MTTR)</p>
                           <p className="text-xl font-bold text-green-900 print:text-black">{formatDuration(recoveryReadiness.mttr)}</p>
                        </div>
                     </div>
                  </div>
                  <div>
                     <h3 className="text-lg font-medium mb-3 text-white print:text-black">Recovery Objectives</h3>
                     <div className="space-y-3">
                        <div className="p-3 bg-amber-50 rounded-lg print:bg-amber-50">
                           <p className="text-xs text-amber-600 mb-1 print:text-amber-800">Recovery Time Objective (RTO)</p>
                           <p className="text-xl font-bold text-amber-900 print:text-black">{formatDuration(recoveryReadiness.rto)}</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg print:bg-purple-50">
                           <p className="text-xs text-purple-600 mb-1 print:text-purple-800">Recovery Point Objective (RPO)</p>
                           <p className="text-xl font-bold text-purple-900 print:text-black">{formatDuration(recoveryReadiness.rpo)}</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* DR Test Results */}
               <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg print:bg-gray-100">
                  <div className="flex items-start justify-between">
                     <div>
                        <p className="text-sm font-medium text-gray-900 mb-1 print:text-black">Last Disaster Recovery Test</p>
                        <p className="text-xs text-gray-600 print:text-gray-700">
                           {recoveryReadiness.lastDisasterRecoveryTest
                              ? new Date(recoveryReadiness.lastDisasterRecoveryTest).toLocaleDateString()
                              : 'No tests conducted'}
                        </p>
                     </div>
                     <div className="text-right">
                        <span
                           className={`px-3 py-1 text-sm font-semibold rounded ${
                              recoveryReadiness.drTestResult?.toLowerCase() === 'passed'
                                 ? 'bg-success-500 text-white print:bg-green-600'
                                 : recoveryReadiness.drTestResult?.toLowerCase() === 'failed'
                                   ? 'bg-danger-500 text-white print:bg-red-600'
                                   : 'bg-secondary-500 text-white print:bg-gray-600'
                           }`}
                        >
                           {recoveryReadiness.drTestResult || 'Pending'}
                        </span>
                     </div>
                  </div>
               </div>
            </Card>

            {/* Scrub Status */}
            <Card variant="glass" className="p-6 print:border print:border-gray-300 print:bg-white">
               <h3 className="text-lg font-medium mb-3 text-white print:text-black">Recent Scrub Activity (Sample)</h3>
               <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50 print:bg-gray-100">
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
                              <tr key={idx} className="text-sm">
                                 <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900 print:text-black">{scrub.pg}</td>
                                 <td className="px-3 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">
                                    {new Date(scrub.lastScrub).toLocaleDateString()}
                                 </td>
                                 <td className="px-3 py-2 whitespace-nowrap text-gray-700 print:text-gray-800">
                                    {new Date(scrub.lastDeepScrub).toLocaleDateString()}
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
