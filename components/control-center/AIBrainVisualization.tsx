'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CpuChipIcon } from '@heroicons/react/24/outline';
import { useAnomalyStore } from '@/stores/anomaly';

export default function AIBrainVisualization() {
  const [isClient, setIsClient] = useState(false);
  const aiStatus = useAnomalyStore(state => isClient ? state.aiStatus : 'idle');

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="relative w-24 h-24 mx-auto mb-6">
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-purple-400/30"
        animate={{
          rotate: 360,
          scale: aiStatus === 'analyzing' ? [1, 1.1, 1] : 1
        }}
        transition={{
          rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
          scale: { duration: 2, repeat: Infinity }
        }}
      />

      <motion.div
        className="absolute inset-2 rounded-full border border-cyan-400/50"
        animate={{
          rotate: -360,
          opacity: [0.3, 0.8, 0.3]
        }}
        transition={{
          rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
          opacity: { duration: 3, repeat: Infinity }
        }}
      />

      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20
                     flex items-center justify-center">
        <CpuChipIcon className="w-6 h-6 text-white" />
      </div>

      {/* Neural pulses */}
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full"
          style={{
            left: '50%',
            top: '50%',
            transformOrigin: '0 0'
          }}
          animate={{
            x: [0, Math.cos(i * Math.PI / 4) * 40],
            y: [0, Math.sin(i * Math.PI / 4) * 40],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
    </div>
  );
}