'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface FuturisticSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

export const FuturisticSpinner: React.FC<FuturisticSpinnerProps> = ({
  size = 'md',
  className,
  label
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      {/* Multi-layer rotating spinner */}
      <div className={cn('relative', sizeClasses[size])}>
        {/* Outer ring - rotating clockwise */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-ai-circuit border-r-ai-glow animate-spin"
             style={{ animationDuration: '1.5s' }} />

        {/* Middle ring - rotating counter-clockwise */}
        <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-ai-cyber border-l-ai-neon animate-spin"
             style={{ animationDuration: '2s', animationDirection: 'reverse' }} />

        {/* Inner ring - rotating clockwise fast */}
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-violet-400 border-r-cyan-400 animate-spin"
             style={{ animationDuration: '1s' }} />

        {/* Center glow pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-ai-glow animate-pulse shadow-[0_0_10px_rgba(255,0,128,0.8)]"
               style={{ animationDuration: '1.5s' }} />
        </div>

        {/* Orbit particles */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 w-1 h-1 rounded-full bg-cyan-400 animate-ping"
               style={{ animationDuration: '2s' }} />
          <div className="absolute bottom-0 left-1/2 w-1 h-1 rounded-full bg-violet-400 animate-ping"
               style={{ animationDuration: '2s', animationDelay: '1s' }} />
        </div>
      </div>

      {/* Loading text with gradient animation */}
      {label && (
        <div className={cn('font-medium bg-gradient-to-r from-ai-circuit via-ai-glow to-ai-cyber bg-clip-text text-transparent animate-pulse', labelSizeClasses[size])}>
          {label}
        </div>
      )}
    </div>
  );
};

// Inline loading spinner for charts
export const ChartLoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-secondary-900/40 backdrop-blur-sm z-10">
      <div className="relative">
        {/* Hexagon loader */}
        <div className={cn('relative', sizeClasses[size])}>
          {/* Outer hexagon */}
          <svg className="absolute inset-0 animate-spin" viewBox="0 0 100 100" style={{ animationDuration: '3s' }}>
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#00d2ff', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#ff0080', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#7928ca', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <polygon
              points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
              fill="none"
              stroke="url(#grad1)"
              strokeWidth="2"
              className="drop-shadow-[0_0_8px_rgba(0,210,255,0.5)]"
            />
          </svg>

          {/* Inner hexagon */}
          <svg className="absolute inset-2 animate-spin" viewBox="0 0 100 100" style={{ animationDuration: '2s', animationDirection: 'reverse' }}>
            <polygon
              points="50,10 85,30 85,70 50,90 15,70 15,30"
              fill="none"
              stroke="#00ff7f"
              strokeWidth="2"
              className="drop-shadow-[0_0_6px_rgba(0,255,127,0.5)]"
            />
          </svg>

          {/* Center dot pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 animate-pulse shadow-[0_0_12px_rgba(0,210,255,0.8)]" />
          </div>
        </div>

        {/* Loading text */}
        <div className="mt-4 text-center">
          <div className="text-xs font-medium text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400 animate-pulse">
            Loading...
          </div>
        </div>
      </div>
    </div>
  );
};

// Card loading skeleton with shimmer effect
export const CardLoadingSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="relative overflow-hidden">
          <div
            className="h-12 bg-gradient-to-r from-secondary-800 via-secondary-700 to-secondary-800 rounded-lg"
            style={{
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite linear'
            }}
          />
        </div>
      ))}

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};
