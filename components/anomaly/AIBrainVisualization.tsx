'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function AIBrainVisualization() {
  const [connections, setConnections] = useState<Array<{x1: number, y1: number, x2: number, y2: number}>>([]);

  useEffect(() => {
    // Generate connections only on client side
    const newConnections = Array.from({ length: 30 }, (_, i) => ({
      x1: 50 + Math.random() * 300,
      y1: 40 + Math.random() * 120,
      x2: 50 + Math.random() * 300,
      y2: 40 + Math.random() * 120,
    }));
    setConnections(newConnections);
  }, []);

  return (
    <div className="relative w-full h-48 overflow-hidden rounded-xl bg-gradient-to-br from-purple-900/20 to-blue-900/20">
      <svg className="w-full h-full" viewBox="0 0 400 200">
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="brain-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Neural network nodes */}
        {Array.from({ length: 24 }, (_, i) => {
          const x = 50 + (i % 6) * 60;
          const y = 40 + Math.floor(i / 6) * 40;
          return (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill="#00d4ff"
              initial={{ opacity: 0.3 }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          );
        })}

        {/* Neural connections */}
        {connections.map((connection, i) => {
          return (
            <motion.line
              key={i}
              x1={connection.x1}
              y1={connection.y1}
              x2={connection.x2}
              y2={connection.y2}
              stroke="url(#brain-gradient)"
              strokeWidth="0.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1, 0],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          );
        })}
      </svg>

      {/* Central brain pulse */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-12 h-12 -translate-x-1/2 -translate-y-1/2
                   bg-gradient-to-r from-purple-500/30 to-cyan-500/30 rounded-full"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      />
    </div>
  );
}