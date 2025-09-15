'use client';

import React from 'react';
import { CpuChipIcon } from '@heroicons/react/24/outline';
import { BaseChart, formatNumber, calculateStats } from './BaseChart';
import type { ECOption, MetricValue } from '@/lib/echarts-types';

interface OsdPerformanceChartProps {
  timeRange?: string;
  autoRefresh?: boolean;
  className?: string;
}

interface OsdPerformanceData {
  avg_utilization: MetricValue[];
  max_utilization: MetricValue[];
  error_count: MetricValue[];
}

// Persistent data state for smooth updates  
let globalOsdPerformanceState: OsdPerformanceData | null = null;

const generateOsdPerformanceMockData = (timeRange: string): OsdPerformanceData => {
  const now = Date.now();
  const maxPoints = 20;
  
  if (!globalOsdPerformanceState) {
    globalOsdPerformanceState = {
      avg_utilization: [],
      max_utilization: [],
      error_count: []
    };
    
    for (let i = 0; i < maxPoints; i++) {
      const timestamp = now - (maxPoints - i) * 15000;
      
      const avgBase = 40 + Math.random() * 30 + Math.sin(i / 4) * 15;
      const maxSpike = Math.random() < 0.3 ? Math.random() * 25 : 0;
      const maxBase = avgBase + 15 + Math.random() * 20 + maxSpike;
      
      const errorSpike = Math.random() < 0.2 ? Math.random() * 3 : 0;
      const errorBase = Math.random() * 1.5 + errorSpike;

      globalOsdPerformanceState.avg_utilization.push({ 
        timestamp, 
        value: Math.max(0, Math.min(100, avgBase)) 
      });
      globalOsdPerformanceState.max_utilization.push({ 
        timestamp, 
        value: Math.max(avgBase, Math.min(100, maxBase)) 
      });
      globalOsdPerformanceState.error_count.push({ 
        timestamp, 
        value: Math.max(0, errorBase) 
      });
    }
  } else {
    const avgBase = 40 + Math.random() * 30 + Math.sin(Date.now() / 60000) * 15;
    const maxSpike = Math.random() < 0.3 ? Math.random() * 25 : 0;
    const maxBase = avgBase + 15 + Math.random() * 20 + maxSpike;
    
    const errorSpike = Math.random() < 0.2 ? Math.random() * 3 : 0;
    const errorBase = Math.random() * 1.5 + errorSpike;

    globalOsdPerformanceState.avg_utilization.push({ 
      timestamp: now, 
      value: Math.max(0, Math.min(100, avgBase)) 
    });
    globalOsdPerformanceState.max_utilization.push({ 
      timestamp: now, 
      value: Math.max(avgBase, Math.min(100, maxBase)) 
    });
    globalOsdPerformanceState.error_count.push({ 
      timestamp: now, 
      value: Math.max(0, errorBase) 
    });
    
    if (globalOsdPerformanceState.avg_utilization.length > maxPoints) {
      globalOsdPerformanceState.avg_utilization.shift();
      globalOsdPerformanceState.max_utilization.shift();
      globalOsdPerformanceState.error_count.shift();
    }
  }

  return {
    avg_utilization: [...globalOsdPerformanceState.avg_utilization],
    max_utilization: [...globalOsdPerformanceState.max_utilization],
    error_count: [...globalOsdPerformanceState.error_count]
  };
};

export const OsdPerformanceChart: React.FC<OsdPerformanceChartProps> = ({
  timeRange = '1h',
  autoRefresh = true,
  className
}) => {
  const loadData = async (): Promise<ECOption> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const osdData = generateOsdPerformanceMockData(timeRange);
    
    // Create time labels for x-axis (show 5 time points)
    const timeLabels = osdData.avg_utilization.map((d, index) => {
      if (index % Math.ceil(osdData.avg_utilization.length / 5) === 0) {
        return new Date(d.timestamp).toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
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
          fontSize: 12
        },
        formatter: (params: any) => {
          let html = '';
          params.forEach((param: any) => {
            const colors: Record<string, string> = {
              'Average Utilization': '#00FF7F',
              'Max Utilization': '#FFA500',
              'Error Count': '#FF0080'
            };
            const color = colors[param.seriesName] || '#9CA3AF';
            const unit = param.seriesName.includes('Utilization') ? '%' : '';
            html += `<div style="display: flex; align-items: center; margin: 2px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; background: ${color}; border-radius: 50%; margin-right: 8px;"></span>
              <span>${param.seriesName}: ${Math.round(param.value[1])}${unit}</span>
            </div>`;
          });
          const maxUtil = params.find((p: any) => p.seriesName === 'Max Utilization')?.value[1] || 0;
          if (maxUtil > 85) {
            html += `<div style="color: #EF4444; margin-top: 4px; font-size: 11px;">⚠ High OSD utilization detected</div>`;
          }
          return html;
        }
      },
      legend: {
        show: true,
        top: 0,
        right: 0,
        textStyle: {
          color: '#F3F4F6',
          fontSize: 11
        },
        data: ['Average Utilization', 'Max Utilization', 'Error Count']
      },
      grid: {
        left: 60,
        right: 30,
        top: 30,
        bottom: 40,
        containLabel: false
      },
      xAxis: {
        type: 'category',
        data: timeLabels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#9CA3AF',
          fontSize: 10,
          interval: 0
        },
        splitLine: { show: false }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Utilization %',
          position: 'left',
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            color: '#9CA3AF',
            fontSize: 10,
            formatter: (value: number) => `${value}%`
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: '#374151',
              type: 'dashed'
            }
          }
        },
        {
          type: 'value',
          name: 'Errors',
          position: 'right',
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            color: '#9CA3AF',
            fontSize: 10
          },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: 'Average Utilization',
          type: 'line',
          yAxisIndex: 0,
          data: osdData.avg_utilization.map((d, index) => [index, Math.round(d.value)]),
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: '#00FF7F',
            width: 2
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0, 255, 127, 0.3)' },
                { offset: 1, color: 'rgba(0, 255, 127, 0.1)' }
              ]
            }
          },
          sampling: 'lttb',
          progressive: 1000,
          progressiveThreshold: 2000
        },
        {
          name: 'Max Utilization',
          type: 'line',
          yAxisIndex: 0,
          data: osdData.max_utilization.map((d, index) => [index, Math.round(d.value)]),
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: '#FFA500',
            width: 2
          },
          sampling: 'lttb',
          progressive: 1000,
          progressiveThreshold: 2000
        },
        {
          name: 'Error Count',
          type: 'line',
          yAxisIndex: 1,
          data: osdData.error_count.map((d, index) => [index, Math.round(d.value)]),
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: '#FF0080',
            width: 2
          },
          sampling: 'lttb',
          progressive: 1000,
          progressiveThreshold: 2000
        }
      ]
    };
  };

  const renderFooter = () => {
    const data = globalOsdPerformanceState || {
      avg_utilization: [],
      max_utilization: [],
      error_count: []
    };
    
    const avgStats = calculateStats(data.avg_utilization);
    const maxStats = calculateStats(data.max_utilization);
    const errorStats = calculateStats(data.error_count);
    
    return (
      <div className="flex items-center justify-between text-xs text-secondary-400">
        <div className="flex items-center space-x-4">
          <span>
            Avg Util: <span className="text-ai-glow">{formatNumber(avgStats.avg, 1)}%</span>
          </span>
          <span>
            Peak Util: <span className="text-warning-400">{formatNumber(maxStats.max, 1)}%</span>
          </span>
          <span>
            Total Errors: <span className="text-danger-400">{formatNumber(errorStats.total, 0)}</span>
          </span>
          <span>
            Current Errors: <span className="text-white">{formatNumber(errorStats.avg, 1)}</span>
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
      title="OSD Performance"
      icon={CpuChipIcon}
      option={{}}
      height={240}
      autoRefresh={autoRefresh}
      className={className}
      onDataLoad={loadData}
      renderFooter={renderFooter}
    />
  );
};