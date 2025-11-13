'use client';

import React from 'react';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { BaseChart, formatNumber, calculateStats } from './BaseChart';
import type { ECOption, MetricValue } from '@/lib/echarts-types';
import { useDashboardStore } from '@/stores/dashboard';
import { useShallow } from 'zustand/react/shallow';
import type { DataPoint } from '@/lib/api/dashboardApi';

interface ScrubErrorChartProps {
  timeRange?: string;
  autoRefresh?: boolean;
  className?: string;
}

export const ScrubErrorChart: React.FC<ScrubErrorChartProps> = ({
  timeRange = '1h',
  autoRefresh = true,
  className
}) => {
  const scrubErr = useDashboardStore(useShallow(state => state.scrubErr));

  const loadData = async (): Promise<ECOption> => {
    // Use backend복합 데이터 from dashboardStore
    const lightScrubErrors: MetricValue[] = (scrubErr as any)?.lightScrubErrors?.map((d: DataPoint) => ({
      timestamp: d.timestamp,
      value: d.value,
    })) || [];

    const deepScrubErrors: MetricValue[] = (scrubErr as any)?.deepScrubErrors?.map((d: DataPoint) => ({
      timestamp: d.timestamp,
      value: d.value,
    })) || [];

    const repairOperations: MetricValue[] = (scrubErr as any)?.repairOperations?.map((d: DataPoint) => ({
      timestamp: d.timestamp,
      value: d.value,
    })) || [];

    const inconsistentPgs: MetricValue[] = (scrubErr as any)?.inconsistentPgs?.map((d: DataPoint) => ({
      timestamp: d.timestamp,
      value: d.value,
    })) || [];

    // Use the longest dataset for time labels
    const allData = [lightScrubErrors, deepScrubErrors, repairOperations, inconsistentPgs];
    const longestData = allData.reduce((prev, current) => prev.length > current.length ? prev : current, []);

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
          params.forEach((param: any, index: number) => {
            const colors = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6'];
            html += `<div style="display: flex; align-items: center; margin: 2px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; background: ${colors[index]}; border-radius: 50%; margin-right: 8px;"></span>
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
        scale: false,
        min: 0,
        minInterval: 1,
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
          name: 'Light Scrub',
          type: 'line',
          data: lightScrubErrors.map((d, index) => [index, Math.round(d.value)]),
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#F59E0B', width: 2 }
        },
        {
          name: 'Deep Scrub',
          type: 'line',
          data: deepScrubErrors.map((d, index) => [index, Math.round(d.value)]),
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#EF4444', width: 2 }
        },
        {
          name: 'Repair Ops',
          type: 'bar',
          data: repairOperations.map((d, index) => [index, Math.round(d.value)]),
          itemStyle: { color: '#10B981' },
          barWidth: '30%'
        },
        {
          name: 'Inconsistent',
          type: 'line',
          data: inconsistentPgs.map((d, index) => [index, Math.round(d.value)]),
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#3B82F6', width: 2 }
        }
      ]
    };
  };

  const renderFooter = () => {
    const chartData = scrubErr;
    const data: MetricValue[] = chartData?.data?.map(d => ({
      timestamp: d.timestamp,
      value: d.value,
    })) || [];
    const stats = calculateStats(data);
    const totalErrors = chartData?.totalErrors || 0;
    const lastScrubTime = chartData?.lastScrubTime || 0;
    const lastScrub = lastScrubTime > 0 ? new Date(lastScrubTime).toLocaleTimeString() : 'N/A';

    return (
      <div className="flex items-center justify-between text-xs text-secondary-400">
        <div className="flex items-center space-x-4">
          <span>
            Total: <span className="text-danger-400">{formatNumber(totalErrors, 0)}</span>
          </span>
          <span>
            Avg: <span className="text-warning-400">{formatNumber(stats.avg, 1)}</span>
          </span>
          <span>
            Last Scrub: <span className="text-ai-glow">{lastScrub}</span>
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
      title="PG Scrub Activities"
      icon={ShieldExclamationIcon}
      option={{}}
      height={240}
      autoRefresh={autoRefresh}
      className={className}
      onDataLoad={loadData}
      renderFooter={renderFooter}
      refreshTrigger={scrubErr}
    />
  );
};