'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export default function NeuralNetwork() {
  const [lines, setLines] = useState<Line[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Generate random lines only on client side after mount
    setLines(
      Array.from({ length: 20 }, () => ({
        x1: Math.random() * 100,
        y1: Math.random() * 100,
        x2: Math.random() * 100,
        y2: Math.random() * 100,
      }))
    );
    setMounted(true);
  }, []);

  // Don't render lines until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <svg className="w-full h-full">
          <defs>
            <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity="0" />
              <stop offset="50%" stopColor="#00d4ff" stopOpacity="1" />
              <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden opacity-20">
      <svg className="w-full h-full">
        {/* Animated neural connections */}
        {lines.map((line, i) => (
          <motion.line
            key={i}
            x1={`${line.x1}%`}
            y1={`${line.y1}%`}
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            stroke="url(#neural-gradient)"
            strokeWidth="0.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: 1,
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "linear"
            }}
          />
        ))}
        <defs>
          <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0" />
            <stop offset="50%" stopColor="#00d4ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}