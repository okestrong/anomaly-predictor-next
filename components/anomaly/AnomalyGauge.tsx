'use client';

import { motion } from 'framer-motion';

interface AnomalyGaugeProps {
  score: number;
}

export default function AnomalyGauge({ score }: AnomalyGaugeProps) {
  const radius = 80;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - score * circumference;

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 animate-pulse" />

      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="anomaly-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="50%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle stroke="rgba(59, 130, 246, 0.1)" fill="transparent" strokeWidth={strokeWidth} r={normalizedRadius} cx={radius} cy={radius} />

        {/* Progress circle */}
        <motion.circle
          stroke="url(#anomaly-gradient)"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />

        {/* Pulse effect */}
        <motion.circle
          stroke="#00d4ff"
          fill="transparent"
          strokeWidth="2"
          r={normalizedRadius + 5}
          cx={radius}
          cy={radius}
          opacity={0}
          animate={{
            opacity: [0, 0.3, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      </svg>

      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <div className="text-2xl font-bold">{(score * 100).toFixed(1)}%</div>
        <div className="text-xs text-gray-400">Anomaly Score</div>
      </div>

      {/* Warning indicator for high scores */}
      {score > 0.7 && (
        <motion.div
          className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </div>
  );
}