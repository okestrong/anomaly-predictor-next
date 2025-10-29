'use client';

import React from 'react';
import { WifiIcon } from '@heroicons/react/24/outline';
import { BaseChart, formatNumber, calculateStats } from './BaseChart';
import type { ECOption, MetricValue } from '@/lib/echarts-types';
import { useDashboardStore } from '@/stores/dashboard';
import { useShallow } from 'zustand/react/shallow';
import type { DataPoint } from '@/lib/api/dashboardApi';

interface NetworkErrorChartProps {
  timeRange?: string;
  autoRefresh?: boolean;
  className?: string;
}

export const NetworkErrorChart: React.FC<NetworkErrorChartProps> = ({
  timeRange = '1h',
  autoRefresh = true,
  className
}) => {
  const networkErr = useDashboardStore(useShallow(state => state.networkErr));

  const loadData = async (): Promise<ECOption> => {
    // Use backend 복합 데이터 from dashboardStore
    const networkErrors: MetricValue[] = (networkErr as any)?.networkErrors?.map((d: DataPoint) => ({
      timestamp: d.timestamp,
      value: d.value,
    })) || [];

    const packetDrops: MetricValue[] = (networkErr as any)?.packetDrops?.map((d: DataPoint) => ({
      timestamp: d.timestamp,
      value: d.value,
    })) || [];

    // Use the longest dataset for time labels
    const allData = [networkErrors, packetDrops];
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
            const colors = ['#FF0080', '#F59E0B'];
            html += `<div style="display: flex; align-items: center; margin: 2px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; background: ${colors[index]}; border-radius: 2px; margin-right: 8px;"></span>
              <span>${param.seriesName}: ${Math.round(param.value[1])}</span>
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
        name: 'Count',
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
          name: 'Network Errors',
          type: 'bar',
          data: networkErrors.map((d, index) => [index, Math.round(d.value)]),
          itemStyle: {
            color: '#FF0080',
            borderRadius: [2, 2, 0, 0]
          },
          barWidth: '30%'
        },
        {
          name: 'Packet Drops',
          type: 'bar',
          data: packetDrops.map((d, index) => [index, Math.round(d.value)]),
          itemStyle: {
            color: '#F59E0B',
            borderRadius: [2, 2, 0, 0]
          },
          barWidth: '30%'
        }
      ]
    };
  };

  const renderFooter = () => {
    const chartData = networkErr;
    const data: MetricValue[] = chartData?.data?.map(d => ({
      timestamp: d.timestamp,
      value: d.value,
    })) || [];
    const stats = calculateStats(data);
    const totalErrors = chartData?.totalErrors || 0;
    const errorRate = chartData?.errorRate || 0;

    return (
      <div className="flex items-center justify-between text-xs text-secondary-400">
        <div className="flex items-center space-x-4">
          <span>
            Avg: <span className="text-danger-400">{formatNumber(stats.avg, 1)}</span>
          </span>
          <span>
            Total: <span className="text-warning-400">{formatNumber(totalErrors, 0)}</span>
          </span>
          <span>
            Rate: <span className="text-ai-glow">{formatNumber(errorRate, 2)}/min</span>
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
      refreshTrigger={networkErr}
    />
  );
};