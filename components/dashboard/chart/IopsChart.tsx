'use client';

import React from 'react';
import { CpuChipIcon } from '@heroicons/react/24/outline';
import { BaseChart, formatNumber, calculateStats } from './BaseChart';
import type { ECOption, MetricValue } from '@/lib/echarts-types';
import { useDashboardStore } from '@/stores/dashboard';
import { useShallow } from 'zustand/react/shallow';

interface IopsChartProps {
   timeRange?: string;
   autoRefresh?: boolean;
   className?: string;
}

export const IopsChart: React.FC<IopsChartProps> = ({ timeRange = '1h', autoRefresh = true, className }) => {
   const iops = useDashboardStore(useShallow(state => state.iops));

   const loadData = async (): Promise<ECOption> => {
      // Use backend data from dashboardStore
      const iopsData = iops;
      const read: MetricValue[] = iopsData?.readIops || [];
      const write: MetricValue[] = iopsData?.writeIops || [];

      // Create time labels for x-axis (show 5 time points)
      const timeLabels = read.map((d, index) => {
         if (index % Math.ceil(read.length / 5) === 0) {
            return new Date(d.timestamp).toLocaleTimeString('en-US', {
               hour12: false,
               hour: '2-digit',
               minute: '2-digit',
            });
         }
         return '';
      });

      return {
         animation: true,
         animationDuration: 500,
         animationEasing: 'cubicOut',
         tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            borderColor: '#4B5563',
            borderWidth: 1,
            textStyle: {
               color: '#F3F4F6',
               fontSize: 12,
            },
            formatter: (params: any) => {
               let html = '';
               params.forEach((param: any) => {
                  const color = param.seriesName === 'Read IOPS' ? '#00FF7F' : '#FF0080';
                  html += `<div style="display: flex; align-items: center; margin: 2px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; background: ${color}; border-radius: 50%; margin-right: 8px;"></span>
              <span>${param.seriesName}: ${Math.round(param.value[1])}</span>
            </div>`;
               });
               return html;
            },
         },
         legend: {
            show: true,
            top: 0,
            right: 0,
            textStyle: {
               color: '#F3F4F6',
               fontSize: 11,
            },
            data: ['Read IOPS', 'Write IOPS'],
         },
         grid: {
            left: 60,
            right: 30,
            top: 30,
            bottom: 40,
            containLabel: false,
         },
         xAxis: {
            type: 'category',
            data: timeLabels,
            axisLine: {
               show: false,
            },
            axisTick: {
               show: false,
            },
            axisLabel: {
               color: '#9CA3AF',
               fontSize: 10,
               interval: 0,
            },
            splitLine: {
               show: false,
            },
         },
         yAxis: {
            type: 'value',
            axisLine: {
               show: false,
            },
            axisTick: {
               show: false,
            },
            axisLabel: {
               color: '#9CA3AF',
               fontSize: 10,
               formatter: (value: number) => formatNumber(value, 0),
            },
            splitLine: {
               show: true,
               lineStyle: {
                  color: '#374151',
                  type: 'dashed',
               },
            },
         },
         series: [
            {
               name: 'Read IOPS',
               type: 'line',
               data: read.map((d, index) => [index, Math.round(d.value)]),
               smooth: true,
               symbol: 'none',
               lineStyle: {
                  color: '#00FF7F',
                  width: 2,
               },
               // Performance optimization
               sampling: 'lttb',
               progressive: 1000,
               progressiveThreshold: 2000,
            },
            {
               name: 'Write IOPS',
               type: 'line',
               data: write.map((d, index) => [index, Math.round(d.value)]),
               smooth: true,
               symbol: 'none',
               lineStyle: {
                  color: '#FF0080',
                  width: 2,
               },
               // Performance optimization
               sampling: 'lttb',
               progressive: 1000,
               progressiveThreshold: 2000,
            },
         ],
      };
   };

   const renderFooter = () => {
      const iopsData = iops;
      const read = iopsData?.readIops || [];
      const write = iopsData?.writeIops || [];
      const readStats = calculateStats(read);
      const writeStats = calculateStats(write);
      const totalAvg = readStats.avg + writeStats.avg;

      return (
         <div className="flex items-center justify-between text-xs text-secondary-400">
            <div className="flex items-center space-x-4">
               <span>
                  Read Avg: <span className="text-success-400">{formatNumber(readStats.avg, 0)}</span>
               </span>
               <span>
                  Write Avg: <span className="text-ai-glow">{formatNumber(writeStats.avg, 0)}</span>
               </span>
               <span>
                  Total Avg: <span className="text-white">{formatNumber(totalAvg, 0)}</span>
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
         title="IOPS Performance"
         icon={CpuChipIcon}
         option={{}}
         height={240}
         autoRefresh={autoRefresh}
         className={className}
         onDataLoad={loadData}
         renderFooter={renderFooter}
         refreshTrigger={iops}
      />
   );
};
