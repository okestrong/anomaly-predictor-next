'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRealtimeStore } from '@/stores/realtimeData';

export default function DataStream() {
  const [isClient, setIsClient] = useState(false);
  const [streamData, setStreamData] = useState({
    latencyData: [] as any[],
    throughputData: [] as any[]
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const updateStreamData = () => {
      const realtimeStore = useRealtimeStore.getState();
      setStreamData({
        latencyData: realtimeStore.chartMetrics.latency || [],
        throughputData: realtimeStore.chartMetrics.throughput || []
      });
    };

    // Initial data load
    updateStreamData();

    // Subscribe to store changes
    const unsubscribe = useRealtimeStore.subscribe(updateStreamData);

    return unsubscribe;
  }, [isClient]);

  // Safe access with fallbacks
  const latestLatency = streamData.latencyData && streamData.latencyData.length > 0 ? streamData.latencyData[streamData.latencyData.length - 1]?.value || 0 : 0;
  const latestThroughput = streamData.throughputData && streamData.throughputData.length > 0 ? streamData.throughputData[streamData.throughputData.length - 1]?.value || 0 : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-cyan-300">Latency</span>
          <span className="text-cyan-400">{latestLatency.toFixed(1)}ms</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300"
            style={{ width: `${Math.min(100, latestLatency / 10 * 100)}%` }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-purple-300">Throughput</span>
          <span className="text-purple-400">{latestThroughput.toFixed(0)} MB/s</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-purple-300"
            style={{ width: `${Math.min(100, latestThroughput / 1000 * 100)}%` }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
}