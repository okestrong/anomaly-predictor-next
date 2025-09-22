'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HolographicCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ComponentType<any>;
  trend?: 'up' | 'down' | 'stable';
  color?: 'cyan' | 'purple' | 'amber' | 'emerald' | 'red';
  onClick?: () => void;
  children?: React.ReactNode;
}

export default function HolographicCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  color = 'cyan',
  onClick,
  children
}: HolographicCardProps) {
  const colorClasses = {
    cyan: 'border-cyan-400/30 bg-cyan-400/5 text-cyan-300',
    purple: 'border-purple-400/30 bg-purple-400/5 text-purple-300',
    amber: 'border-amber-400/30 bg-amber-400/5 text-amber-300',
    emerald: 'border-emerald-400/30 bg-emerald-400/5 text-emerald-300',
    red: 'border-red-400/30 bg-red-400/5 text-red-300'
  };

  const glowClasses = {
    cyan: 'shadow-cyan-400/20',
    purple: 'shadow-purple-400/20',
    amber: 'shadow-amber-400/20',
    emerald: 'shadow-emerald-400/20',
    red: 'shadow-red-400/20'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        scale: 1.02,
        boxShadow: `0 0 30px ${color === 'cyan' ? 'rgba(34, 211, 238, 0.3)' :
                                  color === 'purple' ? 'rgba(124, 58, 237, 0.3)' :
                                  color === 'amber' ? 'rgba(245, 158, 11, 0.3)' :
                                  color === 'emerald' ? 'rgba(16, 185, 129, 0.3)' :
                                  'rgba(239, 68, 68, 0.3)'}`
      }}
      onClick={onClick}
      className={`
        relative p-6 rounded-xl border backdrop-blur-md cursor-pointer
        ${colorClasses[color]} ${glowClasses[color]}
        transition-all duration-300
      `}
    >
      {/* Holographic shimmer effect */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                       skew-x-12 -translate-x-full animate-pulse duration-2000" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <Icon className="w-8 h-8" />
          {trend && (
            <div className={`text-sm ${
              trend === 'up' ? 'text-emerald-400' :
              trend === 'down' ? 'text-red-400' :
              'text-amber-400'
            }`}>
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
            </div>
          )}
        </div>

        <h3 className="text-sm font-medium opacity-80 mb-2">{title}</h3>

        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-2xl font-bold">{value}</span>
          {unit && <span className="text-sm opacity-60">{unit}</span>}
        </div>

        {children}
      </div>
    </motion.div>
  );
}