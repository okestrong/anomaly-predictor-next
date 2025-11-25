/**
 * Report Chart Component
 * Renders ECharts for report trend data
 */

'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer]);

interface TrendPoint {
   timestamp: string;
   value: number;
   label?: string;
}

interface TrendData {
   category: string;
   data: TrendPoint[];
   insights?: string[];
   prediction?: {
      trend: string;
      projectedValue: number;
      confidence: number;
      timeToThreshold?: number;
   };
}

interface ReportChartProps {
   trendData: TrendData;
   height?: number;
}

export function ReportChart({ trendData, height = 300 }: ReportChartProps) {
   const chartRef = useRef<HTMLDivElement>(null);
   const chartInstance = useRef<echarts.ECharts | null>(null);

   useEffect(() => {
      if (!chartRef.current || !trendData.data || trendData.data.length === 0) return;

      // Initialize chart
      if (!chartInstance.current) {
         chartInstance.current = echarts.init(chartRef.current);
      }

      const chart = chartInstance.current;

      // Prepare data
      const times = trendData.data.map(point => {
         const date = new Date(point.timestamp);
         return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
         });
      });

      const values = trendData.data.map(point => point.value);

      // Get color based on category
      const getColor = (category: string) => {
         switch (category) {
            case 'IOPS':
               return '#00FF7F';
            case 'Latency':
               return '#FF0080';
            case 'Throughput':
               return '#FBBF24';
            case 'Capacity':
               return '#3B82F6';
            default:
               return '#8B5CF6';
         }
      };

      const color = getColor(trendData.category);

      // Format value based on category
      const formatValue = (value: number, category: string) => {
         switch (category) {
            case 'IOPS':
               return Math.round(value).toLocaleString();
            case 'Latency':
               return `${value.toFixed(2)} ms`;
            case 'Throughput':
               return `${value.toFixed(1)} MB/s`;
            case 'Capacity':
               return `${value.toFixed(1)}%`;
            default:
               return value.toFixed(1);
         }
      };

      // Chart option
      const option: any = {
         backgroundColor: 'transparent',
         grid: {
            left: '3%',
            right: '3%',
            bottom: '8%',
            top: '5%',
            containLabel: true,
         },
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
               const param = params[0];
               return `<div style="padding: 4px;">
                  <div style="font-weight: bold; margin-bottom: 4px;">${param.axisValue}</div>
                  <div>${trendData.category}: ${formatValue(param.value, trendData.category)}</div>
               </div>`;
            },
         },
         xAxis: {
            type: 'category',
            data: times,
            axisLine: {
               lineStyle: {
                  color: '#374151',
               },
            },
            axisTick: {
               show: false,
            },
            axisLabel: {
               color: '#9CA3AF',
               fontSize: 9,
               rotate: 30,
               interval: Math.floor(times.length / 6),
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
               fontSize: 9,
               formatter: (value: number) => formatValue(value, trendData.category),
            },
            splitLine: {
               lineStyle: {
                  color: '#374151',
                  type: 'dashed',
               },
            },
         },
         series: [
            {
               name: trendData.category,
               type: 'line',
               data: values,
               smooth: true,
               symbol: 'circle',
               symbolSize: 4,
               lineStyle: {
                  color: color,
                  width: 2,
               },
               itemStyle: {
                  color: color,
               },
               areaStyle: {
                  color: {
                     type: 'linear',
                     x: 0,
                     y: 0,
                     x2: 0,
                     y2: 1,
                     colorStops: [
                        {
                           offset: 0,
                           color: color.replace(')', ', 0.3)').replace('rgb', 'rgba'),
                        },
                        {
                           offset: 1,
                           color: color.replace(')', ', 0.05)').replace('rgb', 'rgba'),
                        },
                     ],
                  },
               },
            },
         ],
      };

      chart.setOption(option);

      // Force resize to ensure proper dimensions
      setTimeout(() => {
         chart.resize();
      }, 100);

      // Mark chart as ready after rendering
      chart.on('finished', () => {
         if (chartRef.current) {
            chartRef.current.setAttribute('data-chart-ready', 'true');
         }
      });

      // Handle resize
      const handleResize = () => {
         chart.resize();
      };
      window.addEventListener('resize', handleResize);

      return () => {
         window.removeEventListener('resize', handleResize);
      };
   }, [trendData]);

   // Cleanup on unmount
   useEffect(() => {
      return () => {
         if (chartInstance.current) {
            chartInstance.current.dispose();
            chartInstance.current = null;
         }
      };
   }, []);

   return (
      <div className="p-2 print:p-1">
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
            <h3 className="text-sm font-semibold text-gray-500 print:text-black">{trendData.category} Trend</h3>
            {trendData.prediction && (
               <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 print:text-gray-600">
                     Trend: <span className="font-medium text-slate-500 print:text-black capitalize">{trendData.prediction.trend}</span>
                  </span>
                  <span className="text-slate-400 print:text-gray-600">
                     Confidence: <span className="font-medium text-gray-500 print:text-black">{trendData.prediction.confidence?.toFixed(2)}%</span>
                  </span>
               </div>
            )}
         </div>

         <div className="w-full overflow-hidden print:overflow-visible print:w-full">
            <div
               ref={chartRef}
               style={{ width: '100%', height: `${height}px`, minHeight: `${height}px` }}
               className="echarts-container w-full max-w-full print:!w-full print:max-h-[250px]"
               data-chart-ready="false"
            />
         </div>

         {trendData.insights && trendData.insights.length > 0 && (
            <div className="mt-2 space-y-1 max-h-16 overflow-y-auto print:max-h-none print:overflow-visible">
               {trendData.insights.slice(0, 2).map((insight, index) => (
                  <div key={`insight-${insight}-${index}`} className="flex items-start gap-1 text-xs text-slate-400 print:text-gray-700">
                     <span className="text-ai-primary print:text-blue-600">•</span>
                     <span className="leading-tight">{insight}</span>
                  </div>
               ))}
            </div>
         )}
      </div>
   );
}
