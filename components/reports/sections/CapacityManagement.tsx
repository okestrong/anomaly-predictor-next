'use client';

import { Card } from '@/components/common';
import { ReportChart } from '@/components/reports/ReportChart';

interface CapacityManagementProps {
   data: {
      currentUsage?: {
         totalCapacity?: number;
         usedCapacity?: number;
         availableCapacity?: number;
         utilizationPercent?: number;
      };
      poolUsage?: Array<{
         name: string;
         used: number;
         available: number;
         utilizationPercent: number;
         objects: number;
      }>;
      predictions?: {
         growthRatePerDay?: number;
         expectedFullDate?: string;
         daysUntilFull?: number;
         recommendedExpansion?: number;
      };
      trends?: any;
   };
}

export default function CapacityManagement({ data }: CapacityManagementProps) {
   const currentUsage = data?.currentUsage || {};
   const poolUsage = data?.poolUsage || [];
   const predictions = data?.predictions || {};

   const formatBytes = (bytes?: number) => {
      if (!bytes) return '0 B';

      let byte = bytes;
      let isMinus = false;
      if (bytes < 0) {
         byte = Math.abs(bytes);
         isMinus = true;
      }

      const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
      let size = byte;
      let unitIndex = 0;
      while (size >= 1024 && unitIndex < units.length - 1) {
         size /= 1024;
         unitIndex++;
      }
      return `${isMinus ? '-' : ''}${size.toFixed(2)} ${units[unitIndex]}`;
   };

   const getUtilizationColor = (percent: number) => {
      if (percent >= 85) return { bg: 'bg-danger-500 print:bg-red-600', text: 'text-danger-500 print:text-red-800' };
      if (percent >= 70) return { bg: 'bg-warning-500 print:bg-yellow-600', text: 'text-warning-500 print:text-yellow-800' };
      return { bg: 'bg-success-500 print:bg-green-600', text: 'text-success-500 print:text-green-800' };
   };

   const utilizationColor = getUtilizationColor(currentUsage.utilizationPercent || 0);

   return (
      <div className="space-y-8 print:text-black">
         <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-black">Capacity Management</h1>
            <p className="text-sm text-gray-800 print:text-gray-700">Current usage, pool analysis, and capacity predictions</p>
         </div>

         {/* Current Usage Overview */}
         <section>
            <h2 className="text-2xl font-semibold mb-4 print:text-black">Current Usage Status</h2>
            <Card variant="default" className="p-6 mb-6 print:border print:border-gray-300 print:bg-white">
               <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg print:bg-blue-50">
                     <p className="text-xs text-blue-600 mb-1 print:text-blue-800">Total Capacity</p>
                     <p className="text-2xl font-bold text-blue-900 print:text-black">{formatBytes(currentUsage.totalCapacity)}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-lg print:bg-green-50">
                     <p className="text-xs text-green-600 mb-1 print:text-green-800">Available</p>
                     <p className="text-2xl font-bold text-green-900 print:text-black">{formatBytes(currentUsage.availableCapacity)}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg print:bg-orange-50">
                     <p className="text-xs text-orange-600 mb-1 print:text-orange-800">Used</p>
                     <p className="text-2xl font-bold text-orange-900 print:text-black">{formatBytes(currentUsage.usedCapacity)}</p>
                  </div>
                  <div className={`p-4 bg-gradient-to-br from-${utilizationColor.bg.split('-')[1]}-100 to-${utilizationColor.bg.split('-')[1]}-200 rounded-lg`}>
                     <p className={`text-xs ${utilizationColor.text} mb-1`}>Utilization</p>
                     <p className={`text-2xl font-bold ${utilizationColor.text}`}>{currentUsage.utilizationPercent?.toFixed(1) || '0.0'}%</p>
                  </div>
               </div>

               {/* Capacity Bar */}
               <div className="w-full">
                  <div className="h-8 bg-gray-200 rounded-lg overflow-hidden print:bg-gray-300">
                     <div
                        className={`h-full ${utilizationColor.bg} transition-all duration-500 flex items-center justify-center text-white text-sm font-semibold`}
                        style={{ width: `${currentUsage.utilizationPercent || 0}%` }}
                     >
                        {currentUsage.utilizationPercent && currentUsage.utilizationPercent > 10 && `${currentUsage.utilizationPercent.toFixed(1)}%`}
                     </div>
                  </div>
               </div>
            </Card>
         </section>

         {/* Pool Usage Details */}
         <section>
            <h2 className="text-2xl font-semibold mb-4 print:text-black">Pool Usage Analysis</h2>
            <Card variant="default" className="p-6 mb-6 print:border print:border-gray-300 print:bg-white">
               <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50 print:bg-gray-50">
                        <tr>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Pool Name</th>
                           <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Used</th>
                           <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Available</th>
                           <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Objects</th>
                           <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-700">Utilization</th>
                        </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200 print:bg-white">
                        {poolUsage.length > 0 ? (
                           poolUsage.map((pool, idx) => {
                              const poolColor = getUtilizationColor(pool.utilizationPercent);
                              return (
                                 <tr key={`capacity-pool-${pool.name}-${idx}`} className="text-sm">
                                    <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900 print:text-black">{pool.name}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-right text-gray-700 print:text-gray-800">{formatBytes(pool.used)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-right text-gray-700 print:text-gray-800">{formatBytes(pool.available)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-right text-gray-700 print:text-gray-800">
                                       {pool.objects.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-right">
                                       <div className="flex items-center justify-end gap-2">
                                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden print:bg-gray-300">
                                             <div className={`h-full ${poolColor.bg}`} style={{ width: `${pool.utilizationPercent}%` }} />
                                          </div>
                                          <span className={`font-semibold ${poolColor.text}`}>{pool.utilizationPercent.toFixed(1)}%</span>
                                       </div>
                                    </td>
                                 </tr>
                              );
                           })
                        ) : (
                           <tr>
                              <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500 print:text-gray-600">
                                 No pool usage data available
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </Card>
         </section>

         {/* Capacity Predictions */}
         <section className="page-break-before">
            <h2 className="text-2xl font-semibold mb-4 print:text-black">Capacity Forecasting</h2>

            {/* Growth Trends */}
            {data?.trends && (
               <div className="mb-6">
                  <h3 className="text-base font-semibold mb-3 text-gray-900 print:text-black">Capacity Growth Trends</h3>
                  <div data-chart="capacity-trend" className="w-full overflow-hidden border border-gray-300 p-4 bg-white">
                     <ReportChart trendData={data.trends} height={260} />
                  </div>
               </div>
            )}

            {/* Predictions */}
            <Card variant="default" className="p-6 print:border print:border-gray-300 print:bg-white">
               <h3 className="text-lg font-medium mb-3 text-white print:text-black">Capacity Predictions</h3>
               <div className="grid grid-cols-2 gap-6">
                  <div>
                     <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 mb-4">
                        <p className="text-sm text-blue-600 mb-1 print:text-blue-800">Growth Rate</p>
                        <p className="text-xl font-bold text-blue-900 print:text-black">{formatBytes(Math.floor(predictions.growthRatePerDay || 0))} / day</p>
                     </div>
                     <div
                        className={`bg-gradient-to-br p-4 ${
                           predictions.daysUntilFull && predictions.daysUntilFull > 0 ? 'from-amber-100 to-amber-200' : 'from-green-100 to-green-200'
                        }`}
                     >
                        <p
                           className={`text-sm mb-1 ${
                              predictions.daysUntilFull && predictions.daysUntilFull > 0
                                 ? 'text-amber-600 print:text-amber-800'
                                 : 'text-green-600 print:text-green-800'
                           }`}
                        >
                           Days Until Full
                        </p>
                        <p
                           className={`text-xl font-bold ${
                              predictions.daysUntilFull && predictions.daysUntilFull > 0 ? 'text-amber-900 print:text-black' : 'text-green-900 print:text-black'
                           }`}
                        >
                           {predictions.daysUntilFull && predictions.daysUntilFull > 0 ? `${predictions.daysUntilFull.toFixed(2)} days` : 'N/A'}
                        </p>
                        {predictions.daysUntilFull && predictions.daysUntilFull > 0 && predictions.expectedFullDate ? (
                           <p className="text-xs text-amber-700 mt-1 print:text-amber-800">
                              Expected: {new Date(predictions.expectedFullDate).toLocaleDateString()}
                           </p>
                        ) : (
                           <p className="text-xs text-green-700 mt-1 print:text-green-800">Capacity usage is stable or decreasing</p>
                        )}
                     </div>
                  </div>
                  <div>
                     <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-6">
                        <p className="text-sm text-purple-600 mb-2 print:text-purple-800">Recommended Expansion</p>
                        <p className="text-2xl font-bold text-purple-900 mb-2 print:text-black">{formatBytes(predictions.recommendedExpansion)}</p>
                        <p className="text-xs text-purple-700 print:text-purple-800">Based on 6-month growth projection with 20% buffer</p>
                     </div>
                  </div>
               </div>

               {/* Prediction Notes */}
               <div className="mt-6 p-4 bg-gray-50 rounded-lg print:bg-gray-100">
                  <p className="text-sm text-gray-700 print:text-gray-800">
                     <strong className="print:text-black">Note:</strong> Predictions are based on linear regression analysis of the past 30 days. Actual growth
                     may vary based on workload patterns and seasonal trends.
                  </p>
               </div>
            </Card>
         </section>
      </div>
   );
}
