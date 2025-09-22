'use client';

import { motion } from 'framer-motion';

interface AnomalyHeatmapProps {
  data: number[][];
}

export default function AnomalyHeatmap({ data }: AnomalyHeatmapProps) {
  const cellSize = 20;
  const padding = 2;

  return (
    <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Anomaly Heat Map</h3>
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <span>Low</span>
          <div className="w-16 h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full" />
          <span>High</span>
        </div>
      </div>

      <svg width={data[0]?.length * (cellSize + padding) || 0} height={data.length * (cellSize + padding)} className="mx-auto">
        {data.map((row, i) =>
          row.map((value, j) => (
            <motion.rect
              key={`${i}-${j}`}
              x={j * (cellSize + padding)}
              y={i * (cellSize + padding)}
              width={cellSize}
              height={cellSize}
              fill={`hsl(${(1 - value) * 120}, 70%, 50%)`}
              opacity={0.8}
              rx={2}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: (i + j) * 0.01 }}
              whileHover={{ scale: 1.1 }}
            />
          )),
        )}
      </svg>

      <div className="mt-4 grid grid-cols-6 gap-2 text-xs text-gray-400">
        {['OSD', 'MON', 'MGR', 'MDS', 'RGW', 'NET'].map(label => (
          <div key={label} className="text-center">
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}