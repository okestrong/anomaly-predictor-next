'use client';

import React from 'react';
import { CpuChipIcon } from '@heroicons/react/24/outline';
import { BaseChart, formatNumber, calculateStats } from './BaseChart';
import type { ECOption, MetricValue } from '@/lib/echarts-types';
import { useDashboardStore } from '@/stores/dashboard';
import { useShallow } from 'zustand/react/shallow';

interface OsdPerformanceChartProps {
  timeRange?: string;
  autoRefresh?: boolean;
  className?: string;
}

export const OsdPerformanceChart: React.FC<OsdPerformanceChartProps> = ({
  timeRange = '1h',
  autoRefresh = true,
  className
}) => {
  const osdPerf = useDashboardStore(useShallow(state => state.osdPerf));

  const loadData = async (): Promise<ECOption> => {
    // Use backend 복합 데이터 from dashboardStore
    const averageUtil: MetricValue[] = (osdPerf as any)?.averageUtilization?.map((d: { timestamp: number; value: number }) => ({
      timestamp: d.timestamp,
      value: d.value,
    })) || [];

    const maxUtil: MetricValue[] = (osdPerf as any)?.maxUtilization?.map((d: { timestamp: number; value: number }) => ({
      timestamp: d.timestamp,
      value: d.value,
    })) || [];

    const errorCnt: MetricValue[] = (osdPerf as any)?.errorCount?.map((d: { timestamp: number; value: number }) => ({
      timestamp: d.timestamp,
      value: d.value,
    })) || [];

    // Use the longest dataset for time labels
    const allData = [averageUtil, maxUtil, errorCnt];
    const longestData = allData.reduce((prev, current) => prev.length > current.length ? prev : current, []);

    if (!longestData.length) {
      return { series: [] };
    }

    // Create time labels for x-axis (show 5 time points)
    const timeLabels = longestData.map((d, index) => {
      if (index % Math.ceil(longestData.length / 5) === 0) {
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
      animationDuration: 600,
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
          params.forEach((param: any, index: number) => {
            const colors = ['#00FF7F', '#F59E0B', '#EF4444'];
            html += `<div style="display: flex; align-items: center; margin: 2px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; background: ${colors[index]}; border-radius: 50%; margin-right: 8px;"></span>
              <span>${param.seriesName}: ${Math.round(param.value[1])}${index < 2 ? '%' : ''}</span>
            </div>`;
          });
          return html;
        }
      },
      legend: {
        show: true,
        top: 0,
        textStyle: {
          color: '#9CA3AF',
          fontSize: 10
        },
        itemWidth: 12,
        itemHeight: 8
      },
      grid: {
        left: 60,
        right: 30,
        top: 40,
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
        scale: false,
        min: 0,
        minInterval: 1,
        name: 'Usage (%)',
        nameLocation: 'middle',
        nameGap: 45,
        nameTextStyle: {
          color: '#9CA3AF',
          fontSize: 11
        },
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
          name: 'Avg Utilization',
          type: 'line',
          data: averageUtil.map((d, index) => [index, Math.round(d.value)]),
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#00FF7F', width: 2 }
        },
        {
          name: 'Max Utilization',
          type: 'line',
          data: maxUtil.map((d, index) => [index, Math.round(d.value)]),
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#F59E0B', width: 2 }
        },
        {
          name: 'Error Count',
          type: 'line',
          data: errorCnt.map((d, index) => [index, Math.round(d.value)]),
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#EF4444', width: 2 }
        }
      ]
    };
  };

  const renderFooter = () => {
    const chartData = osdPerf;
    const data: MetricValue[] = chartData?.data?.map(d => ({
      timestamp: d.timestamp,
      value: d.value,
    })) || [];
    const stats = calculateStats(data);
    const avgPerf = chartData?.averagePerformance || 0;
    const slowOsds = chartData?.slowOsds || 0;

    return (
      <div className="flex items-center justify-between text-xs text-secondary-400">
        <div className="flex items-center space-x-4">
          <span>
            Avg: <span className="text-ai-glow">{formatNumber(avgPerf, 1)}%</span>
          </span>
          <span>
            Current: <span className="text-white">{formatNumber(stats.avg, 1)}%</span>
          </span>
          <span>
            Slow OSDs: <span className="text-danger-400">{formatNumber(slowOsds, 0)}</span>
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
      refreshTrigger={osdPerf}
    />
  );
};