'use client';

import React, { useMemo } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { BaseChart, formatNumber, calculateStats } from './BaseChart';
import type { ECOption, MetricValue } from '@/lib/echarts-types';

interface LatencyChartProps {
  timeRange?: string;
  autoRefresh?: boolean;
  className?: string;
}

// Persistent data state for smooth updates
let globalLatencyState: MetricValue[] | null = null;

// Mock data generator with data continuity
const generateLatencyMockData = (timeRange: string): MetricValue[] => {
  const now = Date.now();
  const maxPoints = 20;
  
  if (!globalLatencyState) {
    globalLatencyState = [];
    
    for (let i = 0; i < maxPoints; i++) {
      const timestamp = now - (maxPoints - i) * 15000;
      const value = 5 + Math.random() * 15 + Math.sin(i / 3) * 3;
      globalLatencyState.push({ timestamp, value });
    }
  } else {
    const newValue = 5 + Math.random() * 15 + Math.sin(Date.now() / 50000) * 3;
    globalLatencyState.push({ timestamp: now, value: newValue });
    
    if (globalLatencyState.length > maxPoints) {
      globalLatencyState.shift();
    }
  }

  return [...globalLatencyState];
};

export const LatencyChart: React.FC<LatencyChartProps> = ({
  timeRange = '1h',
  autoRefresh = true,
  className
}) => {
  const loadData = async (): Promise<ECOption> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const data = generateLatencyMockData(timeRange);
    
    // Create time labels for x-axis (show 5 time points)
    const timeLabels = data.map((d, index) => {
      if (index % Math.ceil(data.length / 5) === 0) {
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
          const value = params[0].value[1];
          return `Latency: ${value.toFixed(1)}ms`;
        }
      },
      grid: {
        left: 50,
        right: 30,
        top: 20,
        bottom: 40,
        containLabel: false
      },
      xAxis: {
        type: 'category',
        data: timeLabels,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#9CA3AF',
          fontSize: 10,
          interval: 0
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#9CA3AF',
          fontSize: 10,
          formatter: (value: number) => `${value}ms`
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#374151',
            type: 'dashed'
          }
        }
      },
      series: [{
        type: 'line',
        data: data.map((d, index) => [index, d.value]),
        smooth: true,
        smoothMonotone: 'x',
        symbol: 'none',
        lineStyle: {
          color: '#FF0080',
          width: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(255, 0, 128, 0.3)'
            }, {
              offset: 1, color: 'rgba(255, 0, 128, 0.05)'
            }]
          }
        },
        // Performance optimization for large datasets
        sampling: 'lttb',
        progressive: 1000,
        progressiveThreshold: 2000,
        animationThreshold: 2000
      }]
    };
  };

  const renderFooter = () => {
    const data = globalLatencyState || [];
    const stats = calculateStats(data);
    
    return (
      <div className="flex items-center justify-between text-xs text-secondary-400">
        <div className="flex items-center space-x-4">
          <span>
            Avg: <span className="text-white">{formatNumber(stats.avg, 1)}ms</span>
          </span>
          <span>
            Min: <span className="text-success-400">{formatNumber(stats.min, 1)}ms</span>
          </span>
          <span>
            Max: <span className="text-danger-400">{formatNumber(stats.max, 1)}ms</span>
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
      title="Latency"
      icon={ClockIcon}
      option={{}}
      height={240}
      autoRefresh={autoRefresh}
      className={className}
      onDataLoad={loadData}
      renderFooter={renderFooter}
    />
  );
};