'use client';

import React from 'react';
import { PuzzlePieceIcon } from '@heroicons/react/24/outline';
import { BaseChart, formatNumber, calculateStats } from './BaseChart';
import type { ECOption, MetricValue } from '@/lib/echarts-types';

interface PgInconsistencyChartProps {
  timeRange?: string;
  autoRefresh?: boolean;
  className?: string;
}

interface PGInconsistencyData {
  inconsistent_pgs: MetricValue[];
  recovery_pgs: MetricValue[];
  backfill_pgs: MetricValue[];
  degraded_pgs: MetricValue[];
  misplaced_pgs: MetricValue[];
}

// Persistent data state for smooth updates
let globalPgInconsistencyState: PGInconsistencyData | null = null;

const generatePgInconsistencyMockData = (timeRange: string): PGInconsistencyData => {
  const now = Date.now();
  const maxPoints = 10;
  
  if (!globalPgInconsistencyState) {
    globalPgInconsistencyState = {
      inconsistent_pgs: [],
      recovery_pgs: [],
      backfill_pgs: [],
      degraded_pgs: [],
      misplaced_pgs: []
    };
    
    for (let i = 0; i < maxPoints; i++) {
      const timestamp = now - (maxPoints - i) * 30000;
      
      const inconsistentSpike = Math.random() < 0.2 ? Math.random() * 8 : 0;
      const inconsistentBase = Math.random() * 1.5;
      
      const recoveryBase = 2 + Math.random() * 6 + Math.sin(i / 3) * 3;
      const backfillBase = 1 + Math.random() * 4 + Math.cos(i / 2) * 2;
      
      const degradedSpike = Math.random() < 0.3 ? Math.random() * 10 : 0;
      const degradedBase = Math.random() * 3 + Math.sin(i / 2.5) * 2;
      
      const misplacedBase = Math.random() * 5 + Math.cos(i / 3.5) * 1.5;

      globalPgInconsistencyState.inconsistent_pgs.push({ timestamp, value: Math.max(0, inconsistentBase + inconsistentSpike) });
      globalPgInconsistencyState.recovery_pgs.push({ timestamp, value: Math.max(0, recoveryBase) });
      globalPgInconsistencyState.backfill_pgs.push({ timestamp, value: Math.max(0, backfillBase) });
      globalPgInconsistencyState.degraded_pgs.push({ timestamp, value: Math.max(0, degradedBase + degradedSpike) });
      globalPgInconsistencyState.misplaced_pgs.push({ timestamp, value: Math.max(0, misplacedBase) });
    }
  } else {
    const inconsistentSpike = Math.random() < 0.2 ? Math.random() * 8 : 0;
    const inconsistentBase = Math.random() * 1.5;
    
    const recoveryBase = 2 + Math.random() * 6 + Math.sin(Date.now() / 120000) * 3;
    const backfillBase = 1 + Math.random() * 4 + Math.cos(Date.now() / 80000) * 2;
    
    const degradedSpike = Math.random() < 0.3 ? Math.random() * 10 : 0;
    const degradedBase = Math.random() * 3 + Math.sin(Date.now() / 100000) * 2;
    
    const misplacedBase = Math.random() * 5 + Math.cos(Date.now() / 140000) * 1.5;

    globalPgInconsistencyState.inconsistent_pgs.push({ timestamp: now, value: Math.max(0, inconsistentBase + inconsistentSpike) });
    globalPgInconsistencyState.recovery_pgs.push({ timestamp: now, value: Math.max(0, recoveryBase) });
    globalPgInconsistencyState.backfill_pgs.push({ timestamp: now, value: Math.max(0, backfillBase) });
    globalPgInconsistencyState.degraded_pgs.push({ timestamp: now, value: Math.max(0, degradedBase + degradedSpike) });
    globalPgInconsistencyState.misplaced_pgs.push({ timestamp: now, value: Math.max(0, misplacedBase) });
    
    if (globalPgInconsistencyState.inconsistent_pgs.length > maxPoints) {
      globalPgInconsistencyState.inconsistent_pgs.shift();
      globalPgInconsistencyState.recovery_pgs.shift();
      globalPgInconsistencyState.backfill_pgs.shift();
      globalPgInconsistencyState.degraded_pgs.shift();
      globalPgInconsistencyState.misplaced_pgs.shift();
    }
  }

  return {
    inconsistent_pgs: [...globalPgInconsistencyState.inconsistent_pgs],
    recovery_pgs: [...globalPgInconsistencyState.recovery_pgs],
    backfill_pgs: [...globalPgInconsistencyState.backfill_pgs],
    degraded_pgs: [...globalPgInconsistencyState.degraded_pgs],
    misplaced_pgs: [...globalPgInconsistencyState.misplaced_pgs]
  };
};

export const PgInconsistencyChart: React.FC<PgInconsistencyChartProps> = ({
  timeRange = '1h',
  autoRefresh = true,
  className
}) => {
  const loadData = async (): Promise<ECOption> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const pgData = generatePgInconsistencyMockData(timeRange);
    const { inconsistent_pgs, recovery_pgs, backfill_pgs, degraded_pgs, misplaced_pgs } = pgData;
    
    if (!inconsistent_pgs.length) {
      return { series: [] };
    }

    // Create time labels for x-axis (show 5 time points) - use actual timestamps
    const timeLabels = inconsistent_pgs.map((d, index) => {
      if (index % Math.ceil(inconsistent_pgs.length / 5) === 0) {
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
          params.forEach((param: any) => {
            const colors: Record<string, string> = {
              'Inconsistent': '#EF4444',
              'Recovery': '#00FF41',
              'Backfill': '#FBBF24',
              'Degraded': '#F59E0B',
              'Misplaced': '#8B5CF6'
            };
            const color = colors[param.seriesName] || '#9CA3AF';
            const shape = param.seriesName === 'Degraded' ? '2px' : '50%';
            html += `<div style="display: flex; align-items: center; margin: 2px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; background: ${color}; border-radius: ${shape}; margin-right: 8px;"></span>
              <span>${param.seriesName}: <span style="color: #F3F4F6; font-weight: bold;">${Math.round(param.value[1])}</span></span>
            </div>`;
          });
          const inconsistentValue = params.find((p: any) => p.seriesName === 'Inconsistent')?.value[1] || 0;
          const recoveryValue = params.find((p: any) => p.seriesName === 'Recovery')?.value[1] || 0;
          if (inconsistentValue > 5) {
            html += `<div style="color: #EF4444; margin-top: 4px; font-size: 11px;">⚠ High inconsistency detected</div>`;
          }
          if (recoveryValue > 10) {
            html += `<div style="color: #00FF41; margin-top: 4px; font-size: 11px;">🔄 Active recovery in progress</div>`;
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
        data: ['Inconsistent', 'Recovery', 'Backfill', 'Degraded', 'Misplaced']
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
          data: inconsistent_pgs.map((d, index) => [index, Math.round(d.value)]),
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: '#EF4444',
            width: 2
          },
          sampling: 'lttb',
          progressive: 1000,
          progressiveThreshold: 2000
        },
        {
          name: 'Recovery',
          type: 'line',
          data: recovery_pgs.map((d, index) => [index, Math.round(d.value)]),
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: '#00FF41',
            width: 2
          },
          sampling: 'lttb',
          progressive: 1000,
          progressiveThreshold: 2000
        },
        {
          name: 'Backfill',
          type: 'line',
          data: backfill_pgs.map((d, index) => [index, Math.round(d.value)]),
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: '#FBBF24',
            width: 2
          },
          sampling: 'lttb',
          progressive: 1000,
          progressiveThreshold: 2000
        },
        {
          name: 'Degraded',
          type: 'bar',
          data: degraded_pgs.map((d, index) => [index, Math.round(d.value)]),
          color: '#F59E0B',
          itemStyle: {
            borderRadius: [2, 2, 0, 0]
          },
          barWidth: '30%'
        },
        {
          name: 'Misplaced',
          type: 'line',
          data: misplaced_pgs.map((d, index) => [index, Math.round(d.value)]),
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: '#8B5CF6',
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
    const data = globalPgInconsistencyState || {
      inconsistent_pgs: [],
      recovery_pgs: [],
      backfill_pgs: [],
      degraded_pgs: [],
      misplaced_pgs: []
    };
    
    const inconsistentStats = calculateStats(data.inconsistent_pgs);
    const recoveryStats = calculateStats(data.recovery_pgs);
    const backfillStats = calculateStats(data.backfill_pgs);
    const degradedStats = calculateStats(data.degraded_pgs);
    const totalIssues = inconsistentStats.total + degradedStats.total;
    
    return (
      <div className="flex items-center justify-between text-xs text-secondary-400">
        <div className="flex items-center space-x-4">
          <span>
            Inconsistent: <span className="text-danger-400">{formatNumber(inconsistentStats.total, 0)}</span>
          </span>
          <span>
            Recovery: <span className="text-ai-glow">{formatNumber(recoveryStats.total, 0)}</span>
          </span>
          <span>
            Backfill: <span className="text-warning-400">{formatNumber(backfillStats.total, 0)}</span>
          </span>
          <span>
            Total Issues: <span className="text-white">{formatNumber(totalIssues, 0)}</span>
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
    />
  );
};