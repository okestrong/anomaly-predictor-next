'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePredictionStore } from '@/stores/prediction';
import { useAnomalyStore } from '@/stores/anomaly';
import { ExclamationTriangleIcon, BoltIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import NeuralNetwork from './NeuralNetwork';
import RiskMeter from './RiskMeter';
import PredictionCard from './PredictionCard';

export default function PredictionDashboard() {
   const { predictions, isUpdating, updateAllPredictions, getHighRiskPredictions, getImminentFailures, getOverallRiskScore, getImminentFailuresCount } =
      usePredictionStore();

   const { aiStatus, anomalyScore } = useAnomalyStore();

   const [selectedCategory, setSelectedCategory] = useState<string>('all');
   const [autoRefresh, setAutoRefresh] = useState(true);
   const [mounted, setMounted] = useState(false);
   const isInitialMount = useRef(true);

   useEffect(() => {
      // Set mounted to avoid hydration mismatch
      setMounted(true);

      // Initial prediction update only on first mount
      if (isInitialMount.current) {
         updateAllPredictions();
         isInitialMount.current = false;
      }

      // Auto-refresh every 10 minutes if enabled
      const interval = autoRefresh
         ? setInterval(() => {
              updateAllPredictions();
           }, 600000)
         : null;

      return () => {
         if (interval) clearInterval(interval);
      };
   }, [autoRefresh, updateAllPredictions]);

   // Use empty data until mounted to avoid hydration mismatch
   const highRiskPredictions = mounted ? getHighRiskPredictions() : [];
   const imminentFailures = mounted ? getImminentFailures() : [];
   const imminentFailuresCount = mounted ? getImminentFailuresCount() : 0;
   const overallRisk = mounted ? getOverallRiskScore() : 0;

   const filteredPredictions = mounted
      ? selectedCategory === 'all'
         ? Object.values(predictions)
         : Object.values(predictions).filter(p => p.severity === selectedCategory)
      : [];

   return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 relative">
         <NeuralNetwork />

         {/* Header with AI status */}
         <div className="max-w-[1800px] mx-auto mb-8 relative z-10">
            <div className="flex items-center justify-between mb-6">
               <div>
                  <h1 className="text-3xl font-bold text-white mb-2 flex items-baseline">
                     Proactive Anomaly Response
                     <span className="text-xl text-slate-300 ml-2">
                        by <span className="text-white">RAG</span>
                     </span>
                  </h1>
                  <p className="text-gray-400">RAG-powered system anomalies detection for proactive anomaly response</p>
               </div>

               <div className="flex items-center space-x-4">
                  {/* Auto-refresh toggle */}
                  <button
                     onClick={() => setAutoRefresh(!autoRefresh)}
                     className={cn(
                        'px-4 py-2 rounded-lg transition-all',
                        autoRefresh ? 'bg-ai-circuit/20 text-ai-circuit border border-ai-circuit/30' : 'bg-black/20 text-gray-400 border border-gray-700',
                     )}
                  >
                     {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                  </button>
               </div>
            </div>

            {/* Risk Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
               {/* Overall Risk */}
               <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                     <SparklesIcon className="w-5 h-5 text-purple-400" />
                     <span className="text-xs text-gray-400">Live</span>
                  </div>
                  <RiskMeter score={overallRisk} />
               </div>

               {/* Anomaly Score */}
               <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                     <SparklesIcon className="w-5 h-5 text-purple-400" />
                     <span className="text-xs text-gray-400">Live</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-400 mb-1">{(anomalyScore * 100).toFixed(1)}%</div>
                  <div className="text-xs text-gray-400">Anomaly Score</div>
                  <div className="mt-3 h-1 bg-black/30 rounded-full overflow-hidden">
                     <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${anomalyScore * 100}%` }}
                     />
                  </div>
               </div>

               {/* High Risk Count */}
               <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                     <ExclamationTriangleIcon className="w-5 h-5 text-orange-400" />
                     <span className="text-xs text-gray-400">Active</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-400 mb-1">{highRiskPredictions.length}</div>
                  <div className="text-xs text-gray-400">High Risk Anomalies</div>
                  <div className="mt-3 flex space-x-1">
                     {Array.from({ length: 5 }, (_, i) => (
                        <div key={i} className={cn('flex-1 h-1 rounded-full', i < highRiskPredictions.length ? 'bg-orange-400' : 'bg-black/30')} />
                     ))}
                  </div>
               </div>

               {/* Imminent Failures */}
               <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                     <BoltIcon className="w-5 h-5 text-red-400" />
                     <span className="text-xs text-gray-400">24h</span>
                  </div>
                  <div className="text-2xl font-bold text-red-400 mb-1">{imminentFailuresCount}</div>
                  <div className="text-xs text-gray-400">Imminent Failures</div>
                  <div className="mt-3">
                     {imminentFailures.length > 0 && <div className="text-xs text-red-400">Next in {imminentFailures[0]?.timeToImpact}h</div>}
                  </div>
               </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2 mb-6">
               <span className="text-sm text-gray-400">Filter:</span>
               {['all', 'critical', 'high', 'medium', 'low'].map(cat => (
                  <button
                     key={cat}
                     onClick={() => setSelectedCategory(cat)}
                     className={cn(
                        'px-3 py-1 rounded-lg text-sm transition-all',
                        selectedCategory === cat
                           ? 'bg-ai-circuit/20 text-ai-circuit border border-ai-circuit/30'
                           : 'bg-black/20 text-gray-400 border border-gray-700 hover:border-gray-600',
                     )}
                  >
                     {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
               ))}
            </div>

            {/* Predictions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               <AnimatePresence mode="popLayout">
                  {filteredPredictions.map(prediction => (
                     <PredictionCard key={prediction.id} prediction={prediction} />
                  ))}
               </AnimatePresence>
            </div>

            {/* Update indicator */}
            {isUpdating && (
               <div className="fixed bottom-8 right-8 px-4 py-2 bg-black/80 backdrop-blur-sm rounded-lg border border-ai-circuit/30">
                  <div className="flex items-center space-x-2">
                     <div className="w-2 h-2 bg-ai-circuit rounded-full animate-pulse" />
                     <span className="text-sm text-ai-circuit">Updating predictions...</span>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}
