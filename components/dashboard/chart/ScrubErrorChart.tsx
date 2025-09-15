'use client';

import React from 'react';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { BaseChart, formatNumber, calculateStats } from './BaseChart';
import type { ECOption, MetricValue } from '@/lib/echarts-types';

interface ScrubErrorChartProps {
  timeRange?: string;
  autoRefresh?: boolean;
  className?: string;
}

interface ScrubErrorData {
  light_scrub_errors: MetricValue[];
  deep_scrub_errors: MetricValue[];
  repair_operations: MetricValue[];
  inconsistent_pgs: MetricValue[];
}

// Persistent data state for smooth updates
let globalScrubErrorState: ScrubErrorData | null = null;

const generateScrubErrorMockData = (timeRange: string): ScrubErrorData => {
  const now = Date.now();
  const maxPoints = 20;
  
  if (!globalScrubErrorState) {
    globalScrubErrorState = {
      light_scrub_errors: [],
      deep_scrub_errors: [],
      repair_operations: [],
      inconsistent_pgs: []
    };
    
    for (let i = 0; i < maxPoints; i++) {
      const timestamp = now - (maxPoints - i) * 15000;
      
      const lightSpike = Math.random() < 0.15 ? Math.random() * 8 : 0;
      const lightBase = Math.random() * 2 + Math.sin(i / 4) * 1;
      
      const deepSpike = Math.random() < 0.1 ? Math.random() * 5 : 0;
      const deepBase = Math.random() * 1.5 + Math.cos(i / 3) * 0.8;
      
      const repairSpike = Math.random() < 0.08 ? Math.random() * 3 : 0;
      const repairBase = Math.random() * 0.8 + repairSpike;
      
      const inconsistentBase = Math.random() * 1.2 + Math.sin(i / 5) * 0.5;

      globalScrubErrorState.light_scrub_errors.push({ 
        timestamp, 
        value: Math.max(0, lightBase + lightSpike) 
      });
      globalScrubErrorState.deep_scrub_errors.push({ 
        timestamp, 
        value: Math.max(0, deepBase + deepSpike) 
      });
      globalScrubErrorState.repair_operations.push({ 
        timestamp, 
        value: Math.max(0, repairBase) 
      });
      globalScrubErrorState.inconsistent_pgs.push({ 
        timestamp, 
        value: Math.max(0, inconsistentBase) 
      });
    }
  } else {
    const lightSpike = Math.random() < 0.15 ? Math.random() * 8 : 0;
    const newLight = Math.random() * 2 + Math.sin(Date.now() / 60000) * 1 + lightSpike;
    
    const deepSpike = Math.random() < 0.1 ? Math.random() * 5 : 0;
    const newDeep = Math.random() * 1.5 + Math.cos(Date.now() / 45000) * 0.8 + deepSpike;
    
    const repairSpike = Math.random() < 0.08 ? Math.random() * 3 : 0;
    const newRepair = Math.random() * 0.8 + repairSpike;
    
    const newInconsistent = Math.random() * 1.2 + Math.sin(Date.now() / 75000) * 0.5;

    globalScrubErrorState.light_scrub_errors.push({ timestamp: now, value: Math.max(0, newLight) });
    globalScrubErrorState.deep_scrub_errors.push({ timestamp: now, value: Math.max(0, newDeep) });
    globalScrubErrorState.repair_operations.push({ timestamp: now, value: Math.max(0, newRepair) });
    globalScrubErrorState.inconsistent_pgs.push({ timestamp: now, value: Math.max(0, newInconsistent) });
    
    if (globalScrubErrorState.light_scrub_errors.length > maxPoints) {
      globalScrubErrorState.light_scrub_errors.shift();
      globalScrubErrorState.deep_scrub_errors.shift();
      globalScrubErrorState.repair_operations.shift();
      globalScrubErrorState.inconsistent_pgs.shift();
    }
  }

  return {
    light_scrub_errors: [...globalScrubErrorState.light_scrub_errors],
    deep_scrub_errors: [...globalScrubErrorState.deep_scrub_errors],
    repair_operations: [...globalScrubErrorState.repair_operations],
    inconsistent_pgs: [...globalScrubErrorState.inconsistent_pgs]
  };
};

export const ScrubErrorChart: React.FC<ScrubErrorChartProps> = ({
  timeRange = '1h',
  autoRefresh = true,
  className
}) => {
  const loadData = async (): Promise<ECOption> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const scrubData = generateScrubErrorMockData(timeRange);
    
    // Create time labels for x-axis (show 5 time points)
    const timeLabels = scrubData.light_scrub_errors.map((d, index) => {
      if (index % Math.ceil(scrubData.light_scrub_errors.length / 5) === 0) {
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
              'Light Scrub Errors': '#FBBF24',
              'Deep Scrub Errors': '#EF4444',
              'Repair Operations': '#00FF7F',
              'Inconsistent PGs': '#8B5CF6'
            };
            const color = colors[param.seriesName] || '#9CA3AF';
            const shape = param.seriesName === 'Repair Operations' ? '2px' : '50%';
            html += `<div style="display: flex; align-items: center; margin: 2px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; background: ${color}; border-radius: ${shape}; margin-right: 8px;"></span>
              <span>${param.seriesName}: ${Math.round(param.value[1])}</span>
            </div>`;
          });
          const hasErrors = params.some((p: any) => p.value[1] > 5);
          if (hasErrors) {
            html += `<div style="color: #EF4444; margin-top: 4px; font-size: 11px;">⚠ Scrub errors detected</div>`;
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
        data: ['Light Scrub Errors', 'Deep Scrub Errors', 'Repair Operations', 'Inconsistent PGs']
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
          name: 'Light Scrub Errors',
          type: 'line',
          data: scrubData.light_scrub_errors.map((d, index) => [index, Math.round(d.value)]),
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
          name: 'Deep Scrub Errors',
          type: 'line',
          data: scrubData.deep_scrub_errors.map((d, index) => [index, Math.round(d.value)]),
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
          name: 'Repair Operations',
          type: 'bar',
          data: scrubData.repair_operations.map((d, index) => [index, Math.round(d.value)]),
          color: '#00FF7F',
          itemStyle: {
            borderRadius: [2, 2, 0, 0]
          },
          barWidth: '40%'
        },
        {
          name: 'Inconsistent PGs',
          type: 'line',
          data: scrubData.inconsistent_pgs.map((d, index) => [index, Math.round(d.value)]),
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
    const data = globalScrubErrorState || {
      light_scrub_errors: [],
      deep_scrub_errors: [],
      repair_operations: [],
      inconsistent_pgs: []
    };
    const lightStats = calculateStats(data.light_scrub_errors);
    const deepStats = calculateStats(data.deep_scrub_errors);
    const repairStats = calculateStats(data.repair_operations);
    const totalErrors = lightStats.total + deepStats.total;
    
    return (
      <div className="flex items-center justify-between text-xs text-secondary-400">
        <div className="flex items-center space-x-4">
          <span>
            Light Errors: <span className="text-warning-400">{formatNumber(lightStats.total, 0)}</span>
          </span>
          <span>
            Deep Errors: <span className="text-danger-400">{formatNumber(deepStats.total, 0)}</span>
          </span>
          <span>
            Repairs: <span className="text-ai-glow">{formatNumber(repairStats.total, 0)}</span>
          </span>
          <span>
            Total: <span className="text-white">{formatNumber(totalErrors, 0)}</span>
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
      title="Scrub Errors"
      icon={ShieldExclamationIcon}
      option={{}}
      height={240}
      autoRefresh={autoRefresh}
      className={className}
      onDataLoad={loadData}
      renderFooter={renderFooter}
    />
  );
};