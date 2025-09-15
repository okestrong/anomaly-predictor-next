'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';
import * as echarts from 'echarts/core';
import { chartTheme, type ECOption } from '@/lib/echarts-types';

export interface BaseChartProps {
   title: string;
   icon: React.ComponentType<{ className?: string }>;
   option: ECOption;
   height?: number;
   autoRefresh?: boolean;
   refreshInterval?: number;
   className?: string;
   onDataLoad?: () => Promise<ECOption>;
   renderFooter?: () => React.ReactNode;
}

export const BaseChart: React.FC<BaseChartProps> = ({
   title,
   icon: Icon,
   option,
   height = 300,
   autoRefresh = false,
   refreshInterval = 5000,
   className,
   onDataLoad,
   renderFooter,
}) => {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [currentOption, setCurrentOption] = useState<ECOption>(option);
   const chartRef = useRef<HTMLDivElement>(null);
   const chartInstance = useRef<echarts.ECharts | null>(null);
   const loadingRef = useRef(false);

   // Initialize chart
   useEffect(() => {
      if (!chartRef.current) return;

      // Initialize ECharts instance
      chartInstance.current = echarts.init(chartRef.current, undefined, {
         renderer: 'canvas',
         width: 'auto',
         height,
      });

      // Set theme colors
      chartInstance.current.setOption({
         color: chartTheme.colors,
         backgroundColor: chartTheme.backgroundColor,
         textStyle: chartTheme.textStyle,
         ...currentOption,
      });

      // Handle resize
      const handleResize = () => {
         chartInstance.current?.resize();
      };
      window.addEventListener('resize', handleResize);

      return () => {
         window.removeEventListener('resize', handleResize);
         chartInstance.current?.dispose();
      };
   }, []);

   // Update chart when option changes
   useEffect(() => {
      if (chartInstance.current) {
         chartInstance.current.setOption(
            {
               color: chartTheme.colors,
               backgroundColor: chartTheme.backgroundColor,
               textStyle: chartTheme.textStyle,
               ...currentOption,
            },
            {
               notMerge: false,
               lazyUpdate: true,
            },
         );
      }
   }, [currentOption]);

   // Load data
   const loadData = useCallback(async () => {
      if (!onDataLoad || loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
         const newOption = await onDataLoad();
         setCurrentOption(newOption);
      } catch (err: any) {
         setError(err.message || 'Failed to load chart data');
         console.error('Chart data loading error:', err);
      } finally {
         setLoading(false);
         loadingRef.current = false;
      }
   }, [onDataLoad]);

   // Auto refresh
   useEffect(() => {
      if (autoRefresh && refreshInterval > 0 && onDataLoad) {
         const interval = setInterval(() => {
            loadData();
         }, refreshInterval);

         return () => clearInterval(interval);
      }
   }, [autoRefresh, refreshInterval, loadData, onDataLoad]);

   // Initial data load
   useEffect(() => {
      if (onDataLoad) {
         loadData();
      }
   }, []);

   const handleRefresh = useCallback(async () => {
      await loadData();
   }, [loadData]);

   return (
      <Card variant="cyber" className={cn('flex flex-col', className)}>
         {/* Header */}
         <div className="px-4 py-3 border-b border-secondary-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
               <Icon className="w-5 h-5 text-ai-circuit" />
               <h3 className="text-sm font-medium text-white">{title}</h3>
            </div>
            <div className="flex items-center space-x-2">
               {autoRefresh && (
                  <div className="flex items-center space-x-1">
                     <div className="w-2 h-2 rounded-full bg-ai-glow animate-pulse" />
                     <span className="text-xs text-secondary-400">Live</span>
                  </div>
               )}
               {onDataLoad && (
                  <Button variant="ghost" size="xs" onClick={handleRefresh} disabled={loading} className="text-secondary-400 hover:text-white">
                     <ArrowPathIcon className={cn('w-4 h-4', loading && 'animate-spin')} />
                  </Button>
               )}
            </div>
         </div>

         {/* Chart Container */}
         <div className="flex-1 relative px-4 pt-2 pb-1">
            {error ? (
               <div className="flex flex-col items-center justify-center h-full text-danger-400">
                  <ExclamationTriangleIcon className="w-8 h-8 mb-2" />
                  <p className="text-sm">{error}</p>
               </div>
            ) : (
               <div ref={chartRef} style={{ width: '100%', height: height - 16 }} />
            )}
            {/*{loading && (
          <div className="absolute inset-0 bg-secondary-800/50 flex items-center justify-center z-10">
            <LoadingSpinner size="lg" />
          </div>
        )}*/}
         </div>

         {/* Footer */}
         {renderFooter && <div className="p-4 border-t border-secondary-700 mt-auto">{renderFooter()}</div>}
      </Card>
   );
};

// Utility functions for formatting
export const formatNumber = (value: number, decimals = 1): string => {
   if (isNaN(value) || !isFinite(value)) return '0';
   if (value >= 1e9) return `${(value / 1e9).toFixed(decimals)}B`;
   if (value >= 1e6) return `${(value / 1e6).toFixed(decimals)}M`;
   if (value >= 1e3) return `${(value / 1e3).toFixed(decimals)}K`;
   return value.toFixed(decimals);
};

export const formatBytes = (bytes: number): string => {
   if (isNaN(bytes) || !isFinite(bytes)) return '0 B';
   const units = ['B', 'KB', 'MB', 'GB', 'TB'];
   let unitIndex = 0;
   let value = bytes;

   while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
   }

   return `${value.toFixed(1)} ${units[unitIndex]}`;
};

export const formatPercent = (value: number): string => {
   if (isNaN(value) || !isFinite(value)) return '0%';
   return `${(value * 100).toFixed(1)}%`;
};

// Calculate statistics
export const calculateStats = (data: { value: number }[]) => {
   const validValues = data.map(d => d.value).filter(val => !isNaN(val) && isFinite(val));

   if (validValues.length === 0) {
      return { min: 0, max: 0, avg: 0, total: 0, p95: 0 };
   }

   const total = validValues.reduce((sum, val) => sum + val, 0);
   const avg = total / validValues.length;
   const min = Math.min(...validValues);
   const max = Math.max(...validValues);

   // Calculate 95th percentile
   const sorted = validValues.sort((a, b) => a - b);
   const p95Index = Math.ceil(sorted.length * 0.95) - 1;
   const p95 = sorted[Math.max(0, p95Index)];

   return { min, max, avg, total, p95 };
};
