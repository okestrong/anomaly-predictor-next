'use client';

import { motion } from 'framer-motion';

interface RiskMeterProps {
  score: number;
}

export default function RiskMeter({ score }: RiskMeterProps) {
  const angle = (score / 100) * 180 - 90;

  return (
    <div className="relative w-48 h-24">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
        {/* Background arc */}
        <path
          d="M 20 80 A 60 60 0 0 1 180 80"
          fill="none"
          stroke="rgba(59, 130, 246, 0.1)"
          strokeWidth="10"
        />
        {/* Animated risk arc */}
        <motion.path
          d="M 20 80 A 60 60 0 0 1 180 80"
          fill="none"
          stroke="url(#risk-gradient)"
          strokeWidth="10"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: score / 100 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
        {/* Needle */}
        <motion.line
          x1="100"
          y1="80"
          x2="100"
          y2="30"
          stroke="#00d4ff"
          strokeWidth="2"
          initial={{ rotate: -90 }}
          animate={{ rotate: angle }}
          style={{ transformOrigin: '100px 80px' }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
        <circle cx="100" cy="80" r="5" fill="#00d4ff" />

        <defs>
          <linearGradient id="risk-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute bottom-0 left-0 right-0 text-center">
        <div className="text-2xl font-bold text-ai-circuit">{score.toFixed(1)}%</div>
        <div className="text-xs text-gray-400">Overall Risk Score</div>
      </div>
    </div>
  );
}