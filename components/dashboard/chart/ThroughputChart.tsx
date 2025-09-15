'use client';

import React from 'react';
import { ArrowUpIcon } from '@heroicons/react/24/outline';
import { BaseChart, formatBytes } from './BaseChart';
import type { ECOption, MetricValue } from '@/lib/echarts-types';

interface ThroughputChartProps {
  timeRange?: string;
  autoRefresh?: boolean;
  className?: string;
}

// Persistent data state for smooth updates
let globalThroughputState: { read: MetricValue[], write: MetricValue[] } | null = null;

const generateThroughputMockData = (timeRange: string): { read: MetricValue[], write: MetricValue[] } => {
  const now = Date.now();
  const maxPoints = 20;
  
  if (!globalThroughputState) {
    globalThroughputState = { read: [], write: [] };
    
    for (let i = 0; i < maxPoints; i++) {
      const timestamp = now - (maxPoints - i) * 15000;
      const baseRead = 100 * 1024 * 1024 + Math.random() * 80 * 1024 * 1024 + Math.sin(i / 5) * 30 * 1024 * 1024;
      const baseWrite = 60 * 1024 * 1024 + Math.random() * 40 * 1024 * 1024 + Math.cos(i / 4) * 20 * 1024 * 1024;

      globalThroughputState.read.push({ timestamp, value: Math.max(0, baseRead) });
      globalThroughputState.write.push({ timestamp, value: Math.max(0, baseWrite) });
    }
  } else {
    const newRead = 100 * 1024 * 1024 + Math.random() * 80 * 1024 * 1024 + Math.sin(Date.now() / 100000) * 30 * 1024 * 1024;
    const newWrite = 60 * 1024 * 1024 + Math.random() * 40 * 1024 * 1024 + Math.cos(Date.now() / 100000) * 20 * 1024 * 1024;

    globalThroughputState.read.push({ timestamp: now, value: Math.max(0, newRead) });
    globalThroughputState.write.push({ timestamp: now, value: Math.max(0, newWrite) });
    
    if (globalThroughputState.read.length > maxPoints) {
      globalThroughputState.read.shift();
      globalThroughputState.write.shift();
    }
  }

  return {
    read: [...globalThroughputState.read],
    write: [...globalThroughputState.write]
  };
};

const formatBandwidth = (bytesPerSecond: number): string => {
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s'];
  let rate = bytesPerSecond;
  let unitIndex = 0;

  while (rate >= 1024 && unitIndex < units.length - 1) {
    rate /= 1024;
    unitIndex++;
  }

  return `${rate.toFixed(1)} ${units[unitIndex]}`;
};

export const ThroughputChart: React.FC<ThroughputChartProps> = ({
  timeRange = '1h',
  autoRefresh = true,
  className
}) => {
  const loadData = async (): Promise<ECOption> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const { read, write } = generateThroughputMockData(timeRange);
    
    // Create time labels for x-axis (show 5 time points)
    const timeLabels = read.map((d, index) => {
      if (index % Math.ceil(read.length / 5) === 0) {
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
          let result = `<div style="padding: 8px;"><div style="color: #FBBF24; font-weight: bold; margin-bottom: 4px;">${params[0].axisValue}</div>`;
          let total = 0;
          params.forEach((param: any) => {
            const color = param.seriesName === 'Read' ? '#10B981' : '#F59E0B';
            total += param.value[1];
            result += `<div style="color: ${color};">${param.marker} ${param.seriesName}: <span style="color: #FFF; font-weight: bold;">${formatBandwidth(param.value[1])}</span></div>`;
          });
          result += `<div style="border-top: 1px solid #4B5563; margin-top: 4px; padding-top: 4px; color: #00FFFF;">Total: <span style="color: #FFF; font-weight: bold;">${formatBandwidth(total)}</span></div>`;
          result += '</div>';
          return result;
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
        data: ['Read', 'Write']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: timeLabels,
        axisLine: {
          lineStyle: { color: '#374151' }
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
          formatter: (value: number) => formatBandwidth(value)
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
          name: 'Read',
          type: 'bar',
          stack: 'throughput',
          data: read.map((d, index) => [index, d.value]),
          itemStyle: {
            color: '#10B981'
          }
        },
        {
          name: 'Write',
          type: 'bar',
          stack: 'throughput',
          data: write.map((d, index) => [index, d.value]),
          itemStyle: {
            color: '#F59E0B'
          }
        }
      ]
    };
  };

  const renderFooter = () => {
    const data = globalThroughputState || { read: [], write: [] };
    const currentRead = data.read.length > 0 ? data.read[data.read.length - 1].value : 0;
    const currentWrite = data.write.length > 0 ? data.write[data.write.length - 1].value : 0;
    const allValues = data.read.concat(data.write).map(d => d.value).filter(v => !isNaN(v) && isFinite(v));
    const peakTotal = allValues.length > 0 ? Math.max(...allValues) : 0;
    
    return (
      <div className="flex items-center justify-between text-xs text-secondary-400">
        <div className="flex items-center space-x-4">
          <span>
            Read: <span className="text-success-400">{formatBandwidth(currentRead)}</span>
          </span>
          <span>
            Write: <span className="text-ai-glow">{formatBandwidth(currentWrite)}</span>
          </span>
          <span>
            Peak: <span className="text-white">{formatBandwidth(peakTotal)}</span>
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
      title="Throughput"
      icon={ArrowUpIcon}
      option={{}}
      height={240}
      autoRefresh={autoRefresh}
      className={className}
      onDataLoad={loadData}
      renderFooter={renderFooter}
    />
  );
};