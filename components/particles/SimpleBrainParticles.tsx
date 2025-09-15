'use client';

import React, { useEffect, useMemo } from 'react';

interface SimpleBrainParticlesProps {
  className?: string;
}

export default function SimpleBrainParticles({ className = '' }: SimpleBrainParticlesProps) {
  
  useEffect(() => {
    console.log('🧠 SimpleBrainParticles mounted successfully!');
  }, []);

  const particles = useMemo(() => {
    const colors = ['#00D2FF', '#FF0080', '#00FF41', '#8B5CF6'];
    
    return Array.from({ length: 30 }, (_, index) => {
      const color = colors[index % colors.length];
      
      return {
        id: `particle-${index}`,
        style: {
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${3 + Math.random() * 4}s`,
          backgroundColor: color,
          boxShadow: `0 0 6px ${color}80`,
        },
      };
    });
  }, []);

  const neuralLines = useMemo(() => {
    return Array.from({ length: 8 }, (_, index) => ({
      id: `line-${index}`,
      style: {
        left: `${10 + Math.random() * 80}%`,
        top: `${10 + Math.random() * 80}%`,
        transform: `rotate(${Math.random() * 360}deg)`,
        animationDelay: `${Math.random() * 2}s`,
        animationDuration: `${4 + Math.random() * 2}s`,
      },
    }));
  }, []);

  return (
    <div className={`simple-brain-particles relative inset-0 w-full h-full pointer-events-none overflow-hidden ${className}`}>
      {/* Brain silhouette overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-15">
        <img 
          src="/images/blue-brain.png" 
          alt="Brain" 
          className="w-48 h-48 object-contain brain-glow" 
        />
      </div>

      {/* Simple CSS Particles */}
      <div className="particle-container absolute w-full h-full">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle absolute w-[3px] h-[3px] rounded-full opacity-70"
            style={particle.style}
          />
        ))}
      </div>

      {/* Neural network lines */}
      <div className="neural-lines absolute w-full h-full">
        {neuralLines.map((line) => (
          <div
            key={line.id}
            className="neural-line absolute w-[60px] h-[1px] origin-center"
            style={line.style}
          />
        ))}
      </div>

      <style jsx>{`
        .brain-glow {
          filter: drop-shadow(0 0 20px rgba(0, 210, 255, 0.3));
          animation: brain-pulse 4s ease-in-out infinite;
        }

        @keyframes brain-pulse {
          0%, 100% {
            filter: drop-shadow(0 0 20px rgba(0, 210, 255, 0.3));
            opacity: 0.15;
          }
          50% {
            filter: drop-shadow(0 0 30px rgba(0, 210, 255, 0.5));
            opacity: 0.25;
          }
        }

        .particle {
          animation: float infinite ease-in-out;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.7;
          }
          25% {
            transform: translateY(-20px) scale(1.2);
            opacity: 1;
          }
          50% {
            transform: translateY(-10px) scale(0.8);
            opacity: 0.5;
          }
          75% {
            transform: translateY(-15px) scale(1.1);
            opacity: 0.8;
          }
        }

        .neural-line {
          background: linear-gradient(90deg, transparent 0%, rgba(0, 210, 255, 0.6) 50%, transparent 100%);
          animation: neural-pulse infinite ease-in-out;
        }

        @keyframes neural-pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.2);
          }
        }

        /* Hover effects */
        .simple-brain-particles:hover .particle {
          animation-duration: 1s;
        }

        .simple-brain-particles:hover .neural-line {
          animation-duration: 2s;
        }
      `}</style>
    </div>
  );
}