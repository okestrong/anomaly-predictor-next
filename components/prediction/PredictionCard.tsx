'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// Cyberpunk-style gradient backgrounds for cards
const gradientStyles = {
  critical: 'bg-gradient-to-br from-red-900/20 via-red-800/10 to-orange-900/5 border-red-500/30',
  high: 'bg-gradient-to-br from-orange-900/20 via-amber-800/10 to-yellow-900/5 border-orange-500/30',
  medium: 'bg-gradient-to-br from-blue-900/20 via-cyan-800/10 to-teal-900/5 border-blue-500/30',
  low: 'bg-gradient-to-br from-green-900/20 via-emerald-800/10 to-lime-900/5 border-green-500/30',
};

const severityColors = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-blue-400',
  low: 'text-green-400',
};

interface PredictionCardProps {
  prediction: any;
}

export default function PredictionCard({ prediction }: PredictionCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={cn(
        "relative p-6 rounded-xl border backdrop-blur-sm transition-all duration-300",
        gradientStyles[prediction.severity as keyof typeof gradientStyles],
        "hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Holographic shimmer effect */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0"
        animate={{ opacity: isHovered ? 0.1 : 0 }}
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(0, 212, 255, 0.3) 50%, transparent 60%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "p-2 rounded-lg bg-black/20",
              severityColors[prediction.severity as keyof typeof severityColors]
            )}>
              <ExclamationTriangleIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{prediction.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{prediction.mlModel}</p>
            </div>
          </div>

          {/* Trend indicator */}
          <div className="flex items-center space-x-1">
            {prediction.trend === 'worsening' ? (
              <ArrowTrendingUpIcon className="w-4 h-4 text-red-400" />
            ) : prediction.trend === 'improving' ? (
              <ArrowTrendingDownIcon className="w-4 h-4 text-green-400" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-yellow-400/20" />
            )}
            <span className="text-xs text-gray-400">{prediction.trend}</span>
          </div>
        </div>

        {/* Probability bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Probability</span>
            <span className={severityColors[prediction.severity as keyof typeof severityColors]}>
              {(prediction.probability * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-black/30 rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", {
                'bg-gradient-to-r from-red-500 to-red-400': prediction.severity === 'critical',
                'bg-gradient-to-r from-orange-500 to-orange-400': prediction.severity === 'high',
                'bg-gradient-to-r from-blue-500 to-blue-400': prediction.severity === 'medium',
                'bg-gradient-to-r from-green-500 to-green-400': prediction.severity === 'low',
              })}
              initial={{ width: 0 }}
              animate={{ width: `${prediction.probability * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-black/20 rounded-lg p-2">
            <div className="text-xs text-gray-400">Confidence</div>
            <div className="text-sm font-semibold text-ai-circuit">
              {(prediction.confidence * 100).toFixed(0)}%
            </div>
          </div>
          <div className="bg-black/20 rounded-lg p-2">
            <div className="text-xs text-gray-400">Time to Impact</div>
            <div className="text-sm font-semibold text-orange-400">
              {prediction.timeToImpact}h
            </div>
          </div>
        </div>

        {/* Affected components */}
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-2">Affected Components</div>
          <div className="flex flex-wrap gap-1">
            {prediction.affectedComponents.map((comp: string, idx: number) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 bg-black/30 rounded-md text-cyan-400 border border-cyan-500/20"
              >
                {comp}
              </span>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/10"
          >
            <div className="text-xs text-gray-400 mb-2">AI Recommendations</div>
            <ul className="space-y-1">
              {prediction.recommendedActions.map((action: string, idx: number) => (
                <li key={idx} className="text-xs text-gray-300 flex items-start">
                  <span className="text-ai-circuit mr-1">•</span>
                  {action}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}