'use client';

import React from 'react';
import { CircleStackIcon } from '@heroicons/react/24/outline';
import { BaseChart, formatBytes } from './BaseChart';
import type { ECOption } from '@/lib/echarts-types';
import { useDashboardStore } from '@/stores/dashboard';
import { useShallow } from 'zustand/react/shallow';

interface PoolUsageChartProps {
   timeRange?: string;
   autoRefresh?: boolean;
   className?: string;
}

interface PoolUsageData {
   used: number;
   available: number;
   reserved: number;
}

export const PoolUsageChart: React.FC<PoolUsageChartProps> = ({ timeRange = '1h', autoRefresh = true, className }) => {
   const dashboardData = useDashboardStore(useShallow(state => state.dashboardData));

   const loadData = async (): Promise<ECOption> => {
      // Use backend data from dashboardStore
      const capacityData = dashboardData?.capacity;
      const poolData: PoolUsageData = {
         used: capacityData?.usedBytes || 0,
         available: capacityData?.availableBytes || 0,
         reserved: Math.max(0, (capacityData?.totalBytes || 0) - (capacityData?.usedBytes || 0) - (capacityData?.availableBytes || 0)),
      };

      const total = poolData.used + poolData.available + poolData.reserved;

      return {
         animation: true,
         animationDuration: 800,
         animationEasing: 'cubicOut',
         tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            borderColor: '#4B5563',
            borderWidth: 1,
            textStyle: {
               color: '#F3F4F6',
               fontSize: 12,
            },
            formatter: (params: any) => {
               const percentage = ((params.value / total) * 100).toFixed(1);
               return `
            <div style="display: flex; align-items: center; margin: 2px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; background: ${params.color}; border-radius: 50%; margin-right: 8px;"></span>
              <span>${params.name}: ${formatBytes(params.value)} (${percentage}%)</span>
            </div>
            ${params.name === 'Used' && percentage > '75' ? '<div style="color: #EF4444; margin-top: 4px; font-size: 11px;">⚠ High usage detected</div>' : ''}
          `;
            },
         },
         legend: {
            show: true,
            bottom: 10,
            left: 'center',
            textStyle: {
               color: '#F3F4F6',
               fontSize: 11,
            },
            data: ['Used', 'Available', 'Reserved'],
         },
         series: [
            {
               name: 'Pool Usage',
               type: 'pie',
               radius: ['40%', '70%'],
               center: ['50%', '45%'],
               avoidLabelOverlap: false,
               itemStyle: {
                  borderRadius: 8,
                  borderColor: '#1F2937',
                  borderWidth: 2,
               },
               label: {
                  show: true,
                  position: 'outside',
                  fontSize: 10,
                  color: '#F3F4F6',
                  formatter: (params: any) => {
                     const percentage = ((params.value / total) * 100).toFixed(1);
                     return `{name|${params.name}}\n{value|${percentage}%}`;
                  },
                  rich: {
                     name: {
                        fontSize: 10,
                        color: '#9CA3AF',
                     },
                     value: {
                        fontSize: 12,
                        color: '#F3F4F6',
                        fontWeight: 'bold',
                     },
                  },
               },
               emphasis: {
                  itemStyle: {
                     shadowBlur: 10,
                     shadowOffsetX: 0,
                     shadowColor: 'rgba(0, 0, 0, 0.5)',
                  },
                  label: {
                     show: true,
                     fontSize: 12,
                     fontWeight: 'bold',
                  },
               },
               labelLine: {
                  show: true,
                  lineStyle: {
                     color: '#9CA3AF',
                  },
               },
               data: [
                  {
                     value: Math.round(poolData.used),
                     name: 'Used',
                     itemStyle: {
                        color: '#FF0080',
                     },
                  },
                  {
                     value: Math.round(poolData.available),
                     name: 'Available',
                     itemStyle: {
                        color: '#00FF7F',
                     },
                  },
                  {
                     value: Math.round(poolData.reserved),
                     name: 'Reserved',
                     itemStyle: {
                        color: '#FBBF24',
                     },
                  },
               ],
            },
         ],
      };
   };

   const renderFooter = () => {
      const capacityData = dashboardData?.capacity;
      const data = {
         used: capacityData?.usedBytes || 0,
         available: capacityData?.availableBytes || 0,
         reserved: Math.max(0, (capacityData?.totalBytes || 0) - (capacityData?.usedBytes || 0) - (capacityData?.availableBytes || 0)),
      };
      const total = data.used + data.available + data.reserved;
      const usagePercent = total > 0 ? (data.used / total) * 100 : 0;

      return (
         <div className="flex items-center justify-between text-xs text-secondary-400">
            <div className="flex items-center space-x-4">
               <span>
                  Used: <span className="text-danger-400">{formatBytes(data.used)}</span>
               </span>
               <span>
                  Available: <span className="text-ai-glow">{formatBytes(data.available)}</span>
               </span>
               <span>
                  Total: <span className="text-white">{formatBytes(total)}</span>
               </span>
               <span>
                  Usage: <span className={usagePercent > 75 ? 'text-warning-400' : 'text-secondary-300'}>{usagePercent.toFixed(1)}%</span>
               </span>
            </div>
            <div className="flex items-center space-x-2">
               <span>{timeRange}</span>
            </div>
         </div>
      );
   };

   return (
      <BaseChart
         title="Pool Usage"
         icon={CircleStackIcon}
         option={{}}
         height={240}
         autoRefresh={autoRefresh}
         className={className}
         onDataLoad={loadData}
         renderFooter={renderFooter}
         refreshTrigger={dashboardData?.capacity}
      />
   );
};
