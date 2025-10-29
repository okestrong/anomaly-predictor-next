'use client';

import { motion } from 'framer-motion';

interface AIScanLoaderProps {
  height?: string;
  scanColor?: string;
  glowColor?: string;
  speed?: number;
}

/**
 * AI-style scanning loader animation
 * Creates a left-to-right scanning effect that looks like AI analysis
 */
export default function AIScanLoader({
  height = 'h-full',
  scanColor = 'rgba(59, 130, 246, 0.6)', // Blue
  glowColor = 'rgba(59, 130, 246, 0.3)',
  speed = 1.34 // 1.5x faster than original (original was 2 seconds)
}: AIScanLoaderProps) {
  return (
    <div className={`relative w-full ${height} overflow-hidden bg-black/20 rounded-lg`}>
      {/* Grid background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Scanning line with glow effect */}
      <motion.div
        className="absolute top-0 bottom-0"
        style={{
          background: `linear-gradient(90deg,
            transparent,
            ${glowColor} 0%,
            ${scanColor} 50%,
            ${glowColor} 100%,
            transparent
          )`,
          boxShadow: `0 0 20px ${scanColor}, 0 0 40px ${glowColor}`,
          filter: 'blur(0.5px)',
          width: '60px',
          left: '-60px'
        }}
        animate={{
          left: ['-60px', '100%']
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop'
        }}
      />

      {/* Secondary scanning line (delayed) */}
      <motion.div
        className="absolute top-0 bottom-0"
        style={{
          background: `linear-gradient(90deg,
            transparent,
            rgba(34, 211, 238, 0.2) 0%,
            rgba(34, 211, 238, 0.4) 50%,
            rgba(34, 211, 238, 0.2) 100%,
            transparent
          )`,
          boxShadow: '0 0 15px rgba(34, 211, 238, 0.4)',
          filter: 'blur(1px)',
          width: '40px',
          left: '-40px'
        }}
        animate={{
          left: ['-40px', '100%']
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
          delay: speed * 0.3
        }}
      />

      {/* Pulsing data points */}
      <div className="absolute inset-0 flex items-center justify-around">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-1 bg-cyan-400/30 rounded-full"
            style={{
              height: '20%',
              boxShadow: '0 0 8px rgba(34, 211, 238, 0.4)'
            }}
            animate={{
              height: ['20%', '60%', '20%'],
              opacity: [0.3, 0.7, 0.3]
            }}
            transition={{
              duration: 1.0, // Slower
              repeat: Infinity,
              delay: i * 0.14, // Slower
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      {/* Text overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="text-ai-circuit text-sm font-mono"
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.34, // Slower
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <div className="flex items-center space-x-2">
            <motion.div
              className="flex space-x-1"
              animate={{
                opacity: [1, 0.5, 1]
              }}
              transition={{
                duration: 1.0, // Slower
                repeat: Infinity
              }}
            >
              <span>AI</span>
              <span>Analyzing</span>
            </motion.div>
            <motion.div
              className="flex space-x-0.5"
              animate={{
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 1.0, // Slower
                repeat: Infinity,
                repeatDelay: 0.34 // Slower
              }}
            >
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-ai-circuit/30" />
      <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-ai-circuit/30" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-ai-circuit/30" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-ai-circuit/30" />

      {/* Horizontal scan lines effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '100% 4px'
        }}
        animate={{
          y: ['0%', '100%']
        }}
        transition={{
          duration: 2.66, // Slower (original was 4 seconds)
          repeat: Infinity,
          ease: 'linear'
        }}
      />
    </div>
  );
}
