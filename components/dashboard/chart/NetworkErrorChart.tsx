'use client';

import React from 'react';
import { WifiIcon } from '@heroicons/react/24/outline';
import { BaseChart, formatNumber, calculateStats } from './BaseChart';
import type { ECOption, MetricValue } from '@/lib/echarts-types';

interface NetworkErrorChartProps {
  timeRange?: string;
  autoRefresh?: boolean;
  className?: string;
}

// Persistent data state for smooth updates
let globalNetworkErrorState: { errors: MetricValue[], drops: MetricValue[] } | null = null;

const generateNetworkErrorMockData = (timeRange: string): { errors: MetricValue[], drops: MetricValue[] } => {
  const now = Date.now();
  const maxPoints = 20;
  
  if (!globalNetworkErrorState) {
    globalNetworkErrorState = { errors: [], drops: [] };
    
    for (let i = 0; i < maxPoints; i++) {
      const timestamp = now - (maxPoints - i) * 15000;
      
      const errorSpike = Math.random() < 0.1 ? Math.random() * 50 : 0;
      const baseErrors = Math.random() * 5 + errorSpike;
      
      const dropSpike = Math.random() < 0.05 ? Math.random() * 30 : 0;
      const baseDrops = Math.random() * 3 + dropSpike;

      globalNetworkErrorState.errors.push({ timestamp, value: Math.max(0, baseErrors) });
      globalNetworkErrorState.drops.push({ timestamp, value: Math.max(0, baseDrops) });
    }
  } else {
    const errorSpike = Math.random() < 0.1 ? Math.random() * 50 : 0;
    const newErrors = Math.random() * 5 + errorSpike;
    
    const dropSpike = Math.random() < 0.05 ? Math.random() * 30 : 0;
    const newDrops = Math.random() * 3 + dropSpike;

    globalNetworkErrorState.errors.push({ timestamp: now, value: Math.max(0, newErrors) });
    globalNetworkErrorState.drops.push({ timestamp: now, value: Math.max(0, newDrops) });
    
    if (globalNetworkErrorState.errors.length > maxPoints) {
      globalNetworkErrorState.errors.shift();
      globalNetworkErrorState.drops.shift();
    }
  }

  return {
    errors: [...globalNetworkErrorState.errors],
    drops: [...globalNetworkErrorState.drops]
  };
};

export const NetworkErrorChart: React.FC<NetworkErrorChartProps> = ({
  timeRange = '1h',
  autoRefresh = true,
  className
}) => {
  const loadData = async (): Promise<ECOption> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const { errors, drops } = generateNetworkErrorMockData(timeRange);
    
    // Create time labels for x-axis (show 5 time points)
    const timeLabels = errors.map((d, index) => {
      if (index % Math.ceil(errors.length / 5) === 0) {
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
            const color = param.seriesName === 'Network Errors' ? '#FF0080' : '#FFA500';
            html += `<div style="display: flex; align-items: center; margin: 2px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; background: ${color}; border-radius: 2px; margin-right: 8px;"></span>
              <span>${param.seriesName}: ${Math.round(param.value[1])}</span>
            </div>`;
          });
          if (params.length > 1 && (params[0].value[1] > 10 || params[1].value[1] > 10)) {
            html += `<div style="color: #EF4444; margin-top: 4px; font-size: 11px;">⚠ Network issues detected</div>`;
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
        data: ['Network Errors', 'Packet Drops']
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
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#9CA3AF',
          fontSize: 10
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#374151',
            type: 'dashed'
          }
        }
      },
      series: [
        {
          name: 'Network Errors',
          type: 'bar',
          data: errors.map((d, index) => [index, Math.round(d.value)]),
          color: '#FF0080',
          barGap: 0,
          barCategoryGap: '30%',
          itemStyle: {
            borderRadius: [2, 2, 0, 0]
          }
        },
        {
          name: 'Packet Drops',
          type: 'bar',
          data: drops.map((d, index) => [index, Math.round(d.value)]),
          color: '#FFA500',
          itemStyle: {
            borderRadius: [2, 2, 0, 0]
          }
        }
      ]
    };
  };

  const renderFooter = () => {
    const data = globalNetworkErrorState || { errors: [], drops: [] };
    const errorStats = calculateStats(data.errors);
    const dropStats = calculateStats(data.drops);
    
    return (
      <div className="flex items-center justify-between text-xs text-secondary-400">
        <div className="flex items-center space-x-4">
          <span>
            Avg Errors: <span className="text-danger-400">{formatNumber(errorStats.avg, 1)}/min</span>
          </span>
          <span>
            Total Errors: <span className="text-warning-400">{formatNumber(errorStats.total, 0)}</span>
          </span>
          <span>
            Total Drops: <span className="text-ai-glow">{formatNumber(dropStats.total, 0)}</span>
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
      title="Network Errors"
      icon={WifiIcon}
      option={{}}
      height={240}
      autoRefresh={autoRefresh}
      className={className}
      onDataLoad={loadData}
      renderFooter={renderFooter}
    />
  );
};