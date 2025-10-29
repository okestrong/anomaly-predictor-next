'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';

interface RiskMeterProps {
   score: number;
}

export default function RiskMeter({ score }: RiskMeterProps) {
   const angle = (score / 100) * 180 - 90;
   const rotation = useMotionValue(-90);

   // 시침 끝점 좌표 계산 (중심: 100, 80 / 길이: 50)
   const x2 = useTransform(rotation, (r) => 100 + 50 * Math.sin((r * Math.PI) / 180));
   const y2 = useTransform(rotation, (r) => 80 - 50 * Math.cos((r * Math.PI) / 180));

   useEffect(() => {
      const controls = animate(rotation, angle, {
         duration: 2,
         ease: 'easeOut',
      });
      return controls.stop;
   }, [angle, rotation]);

   return (
      <div className="relative w-48 h-28">
         <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
            {/* Background arc */}
            <path d="M 20 80 A 60 60 0 0 1 180 80" fill="none" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="10" />
            {/* Animated risk arc */}
            <motion.path
               d="M 20 80 A 60 60 0 0 1 180 80"
               fill="none"
               stroke="url(#risk-gradient)"
               strokeWidth="10"
               strokeLinecap="round"
               initial={{ pathLength: 0 }}
               animate={{ pathLength: score / 100 }}
               transition={{ duration: 2, ease: 'easeOut' }}
            />
            {/* Needle */}
            <motion.line x1="100" y1="80" x2={x2} y2={y2} stroke="#00d4ff" strokeWidth="2" />
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
