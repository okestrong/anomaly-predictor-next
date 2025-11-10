'use client';

import { motion } from 'framer-motion';

interface AIScanLoaderProps {
  height?: string;
  speed?: number;
}

/**
 * AI-style scanning loader animation
 * Creates a clean white scanning beam effect that looks like sophisticated AI analysis
 */
export default function AIScanLoader({
  height = 'h-full',
  speed = 2.0
}: AIScanLoaderProps) {
  return (
    <div className={`relative w-full ${height} overflow-hidden bg-black/20 rounded-lg`}>
      {/* Subtle grid background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Main white scanning beam */}
      <motion.div
        className="absolute top-0 bottom-0"
        style={{
          background: `linear-gradient(90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 20%,
            rgba(255, 255, 255, 0.15) 40%,
            rgba(255, 255, 255, 0.8) 50%,
            rgba(255, 255, 255, 0.15) 60%,
            rgba(255, 255, 255, 0.05) 80%,
            transparent 100%
          )`,
          boxShadow: `
            0 0 30px rgba(255, 255, 255, 0.4),
            0 0 60px rgba(255, 255, 255, 0.2),
            0 0 90px rgba(255, 255, 255, 0.1)
          `,
          width: '100px',
          left: '-100px'
        }}
        animate={{
          left: ['-100px', '100%']
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'easeInOut',
          repeatType: 'loop'
        }}
      />

      {/* Text overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="text-white/70 text-sm font-mono tracking-wide"
          animate={{
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <div className="flex items-center space-x-2">
            <span className="text-white/90">AI Analyzing</span>
            <motion.div
              className="flex space-x-0.5"
              animate={{
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                repeatDelay: 0.3
              }}
            >
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Elegant corner decorations */}
      <div className="absolute top-0 left-0 w-10 h-10 border-l border-t border-white/20" />
      <div className="absolute top-0 right-0 w-10 h-10 border-r border-t border-white/20" />
      <div className="absolute bottom-0 left-0 w-10 h-10 border-l border-b border-white/20" />
      <div className="absolute bottom-0 right-0 w-10 h-10 border-r border-b border-white/20" />
    </div>
  );
}
