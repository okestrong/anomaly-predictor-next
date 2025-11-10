'use client';

import React from 'react';
import { PuzzlePieceIcon } from '@heroicons/react/24/outline';
import { BaseChart, formatNumber, calculateStats } from './BaseChart';
import type { ECOption, MetricValue } from '@/lib/echarts-types';
import { useDashboardStore } from '@/stores/dashboard';
import { useShallow } from 'zustand/react/shallow';
import type { DataPoint } from '@/lib/api/dashboardApi';

interface PgInconsistencyChartProps {
  timeRange?: string;
  autoRefresh?: boolean;
  className?: string;
}

export const PgInconsistencyChart: React.FC<PgInconsistencyChartProps> = ({
  timeRange = '1h',
  autoRefresh = true,
  className
}) => {
  const pgInconsis = useDashboardStore(useShallow(state => state.pgInconsis));

  const loadData = async (): Promise<ECOption> => {
    // Use backend 복합 데이터 from dashboardStore
    const inconsistent: MetricValue[] = (pgInconsis as any)?.inconsistent?.map((d: DataPoint) => ({
      timestamp: d.timestamp,
      value: d.value,
    })) || [];

    const recovery: MetricValue[] = (pgInconsis as any)?.recovery?.map((d: DataPoint) => ({
      timestamp: d.timestamp,
      value: d.value,
    })) || [];

    const backfill: MetricValue[] = (pgInconsis as any)?.backfill?.map((d: DataPoint) => ({
      timestamp: d.timestamp,
      value: d.value,
    })) || [];

    const degraded: MetricValue[] = (pgInconsis as any)?.degraded?.map((d: DataPoint) => ({
      timestamp: d.timestamp,
      value: d.value,
    })) || [];

    const misplaced: MetricValue[] = (pgInconsis as any)?.misplaced?.map((d: DataPoint) => ({
      timestamp: d.timestamp,
      value: d.value,
    })) || [];

    // Use the longest dataset for time labels
    const allData = [inconsistent, recovery, backfill, degraded, misplaced];
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
            const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
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
        name: 'PG Count',
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
          name: 'Inconsistent',
          type: 'line',
          data: inconsistent.map((d, index) => [index, Math.round(d.value)]),
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#EF4444', width: 2 }
        },
        {
          name: 'Recovery',
          type: 'line',
          data: recovery.map((d, index) => [index, Math.round(d.value)]),
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#3B82F6', width: 2 }
        },
        {
          name: 'Backfill',
          type: 'line',
          data: backfill.map((d, index) => [index, Math.round(d.value)]),
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#10B981', width: 2 }
        },
        {
          name: 'Degraded',
          type: 'bar',
          data: degraded.map((d, index) => [index, Math.round(d.value)]),
          itemStyle: { color: '#F59E0B' },
          barWidth: '30%'
        },
        {
          name: 'Misplaced',
          type: 'line',
          data: misplaced.map((d, index) => [index, Math.round(d.value)]),
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#8B5CF6', width: 2 }
        }
      ]
    };
  };

  const renderFooter = () => {
    const chartData = pgInconsis;
    const data: MetricValue[] = chartData?.data?.map(d => ({
      timestamp: d.timestamp,
      value: d.value,
    })) || [];
    const stats = calculateStats(data);
    const inconsistentPgs = chartData?.inconsistentPgs || 0;
    const inconsistencyRate = chartData?.inconsistencyRate || 0;

    return (
      <div className="flex items-center justify-between text-xs text-secondary-400">
        <div className="flex items-center space-x-4">
          <span>
            Current: <span className="text-danger-400">{formatNumber(inconsistentPgs, 0)}</span>
          </span>
          <span>
            Avg: <span className="text-white">{formatNumber(stats.avg, 1)}</span>
          </span>
          <span>
            Rate: <span className="text-warning-400">{formatNumber(inconsistencyRate, 2)}%</span>
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
      title="PG Inconsistency"
      icon={PuzzlePieceIcon}
      option={{}}
      height={240}
      autoRefresh={autoRefresh}
      className={className}
      onDataLoad={loadData}
      renderFooter={renderFooter}
      refreshTrigger={pgInconsis}
    />
  );
};