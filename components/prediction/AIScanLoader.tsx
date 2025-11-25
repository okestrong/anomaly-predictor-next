'use client';

import { motion } from 'framer-motion';

interface AIScanLoaderProps {
  height?: string;
  speed?: number;
  severity?: 'critical' | 'high' | 'medium' | 'low';
}

// Sophisticated cyberpunk-style colors with reduced glare
// Muted tones with lower opacity to prevent eye strain
const scanColors = {
  critical: {
    primary: 'rgba(190, 60, 85, 0.5)',       // Deep rose with purple undertone (reduced opacity)
    secondary: 'rgba(139, 92, 246, 0.35)',   // Violet accent (reduced)
    glow: 'rgba(190, 60, 85, 0.5)',          // Reduced glow intensity
    light: 'rgba(244, 114, 182, 0.25)',      // Soft pink highlight (reduced)
  },
  high: {
    primary: 'rgba(217, 119, 6, 0.5)',       // Deep amber/gold (reduced opacity)
    secondary: 'rgba(234, 179, 8, 0.35)',    // Muted yellow accent (reduced)
    glow: 'rgba(217, 119, 6, 0.5)',          // Reduced glow intensity
    light: 'rgba(251, 191, 36, 0.2)',        // Soft gold highlight (reduced)
  },
  medium: {
    primary: 'rgba(14, 165, 233, 0.5)',      // Deep sky blue (reduced opacity)
    secondary: 'rgba(99, 102, 241, 0.35)',   // Indigo accent (reduced)
    glow: 'rgba(14, 165, 233, 0.5)',         // Reduced glow intensity
    light: 'rgba(125, 211, 252, 0.2)',       // Soft cyan highlight (reduced)
  },
  low: {
    primary: 'rgba(5, 150, 105, 0.5)',       // Deep emerald (reduced opacity)
    secondary: 'rgba(6, 182, 212, 0.35)',    // Cyan-teal accent (reduced)
    glow: 'rgba(5, 150, 105, 0.5)',          // Reduced glow intensity
    light: 'rgba(52, 211, 153, 0.2)',        // Soft emerald highlight (reduced)
  },
};

/**
 * Cyberpunk-style AI scanning loader animation
 * Creates an electrifying neon scanning beam effect with glowing particles
 */
export default function AIScanLoader({
  height = 'h-full',
  speed = 2.0,
  severity = 'medium'
}: AIScanLoaderProps) {
  const colors = scanColors[severity];

  return (
    <div className={`relative w-full ${height} overflow-hidden bg-black/40 rounded-lg backdrop-blur-sm`}>
      {/* Cyberpunk circuit grid background */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="circuit-grid" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
              <circle cx="25" cy="25" r="1.5" fill={colors.primary} />
              <path
                d="M 0 25 L 25 25 M 25 0 L 25 25 M 25 25 L 25 50 M 25 25 L 50 25"
                stroke={colors.primary}
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit-grid)" />
        </svg>
      </div>

      {/* Horizontal scan lines for retro effect */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            ${colors.primary} 2px,
            ${colors.primary} 4px
          )`,
        }}
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Main scanning beam with reduced glow */}
      <motion.div
        className="absolute top-0 bottom-0"
        style={{
          background: `linear-gradient(90deg,
            transparent 0%,
            ${colors.light} 20%,
            ${colors.secondary} 40%,
            ${colors.primary} 50%,
            ${colors.secondary} 60%,
            ${colors.light} 80%,
            transparent 100%
          )`,
          boxShadow: `
            0 0 20px ${colors.glow},
            0 0 40px ${colors.primary},
            0 0 60px ${colors.secondary}
          `,
          width: '150px',
          left: '-150px',
          filter: 'blur(2px)',
        }}
        animate={{
          left: ['-150px', '100%']
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop'
        }}
      />

      {/* Secondary scan beam for depth */}
      <motion.div
        className="absolute top-0 bottom-0"
        style={{
          background: `linear-gradient(90deg,
            transparent 0%,
            ${colors.light} 40%,
            ${colors.primary} 50%,
            ${colors.light} 60%,
            transparent 100%
          )`,
          boxShadow: `0 0 15px ${colors.primary}`,
          width: '80px',
          left: '-80px',
          opacity: 0.4,
        }}
        animate={{
          left: ['-80px', '100%']
        }}
        transition={{
          duration: speed * 0.7,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
          delay: 0.3,
        }}
      />

      {/* Glowing particles trail */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: '4px',
            height: '4px',
            background: colors.primary,
            boxShadow: `0 0 5px ${colors.glow}, 0 0 10px ${colors.primary}`,
            top: `${20 + i * 15}%`,
            left: '-10px',
          }}
          animate={{
            left: ['-10px', '100%'],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: speed * 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.15,
          }}
        />
      ))}

      {/* Pulsing corner indicators */}
      <motion.div
        className="absolute top-0 left-0 w-3 h-3 rounded-full"
        style={{
          background: colors.primary,
          boxShadow: `0 0 8px ${colors.glow}`,
        }}
        animate={{
          opacity: [0.2, 0.6, 0.2],
          scale: [0.8, 1.1, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute top-0 right-0 w-3 h-3 rounded-full"
        style={{
          background: colors.primary,
          boxShadow: `0 0 8px ${colors.glow}`,
        }}
        animate={{
          opacity: [0.2, 0.6, 0.2],
          scale: [0.8, 1.1, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-3 h-3 rounded-full"
        style={{
          background: colors.primary,
          boxShadow: `0 0 8px ${colors.glow}`,
        }}
        animate={{
          opacity: [0.2, 0.6, 0.2],
          scale: [0.8, 1.1, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.0,
        }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-3 h-3 rounded-full"
        style={{
          background: colors.primary,
          boxShadow: `0 0 8px ${colors.glow}`,
        }}
        animate={{
          opacity: [0.2, 0.6, 0.2],
          scale: [0.8, 1.1, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.5,
        }}
      />

      {/* Glowing corner brackets */}
      <div
        className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2"
        style={{
          borderColor: colors.primary,
          boxShadow: `0 0 5px ${colors.glow}`,
        }}
      />
      <div
        className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2"
        style={{
          borderColor: colors.primary,
          boxShadow: `0 0 5px ${colors.glow}`,
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2"
        style={{
          borderColor: colors.primary,
          boxShadow: `0 0 5px ${colors.glow}`,
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2"
        style={{
          borderColor: colors.primary,
          boxShadow: `0 0 5px ${colors.glow}`,
        }}
      />

      {/* Text overlay with glitch effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="text-white font-mono tracking-widest text-sm relative"
          animate={{
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <div className="flex items-center space-x-2">
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{
                background: colors.primary,
                boxShadow: `0 0 5px ${colors.glow}`,
              }}
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scale: [0.8, 1.1, 0.8],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            />
            <span
              className="font-semibold"
              style={{
                textShadow: `0 0 5px ${colors.glow}, 0 0 10px ${colors.primary}`,
                color: colors.light,
              }}
            >
              AI ANALYZING
            </span>
            <motion.div
              className="flex space-x-1"
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
    </div>
  );
}
