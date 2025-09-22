'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAnomalyStore } from '@/stores/anomaly';
import { useRealtimeStore } from '@/stores/realtimeData';
import { BoltIcon, ExclamationTriangleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { HiPlayCircle } from 'react-icons/hi2';
import { cn } from '@/lib/utils';
import MatrixRain from './MatrixRain';
import AIBrainVisualization from './AIBrainVisualization';
import AnomalyHeatmap from './AnomalyHeatmap';
import AnomalyGauge from './AnomalyGauge';

export default function AnomalyDashboard() {
   const {
      anomalyScore,
      anomalyPatterns,
      recentAnomalies,
      modelPerformance,
      isAnalyzing,
      aiStatus,
      anomalyHeatmap,
      analyzeClusterBehavior,
      trainModel,
      getActiveAnomalies,
      getCriticalAnomalies,
   } = useAnomalyStore();

   const { connectionStatus } = useRealtimeStore();
   const [autoAnalyze] = useState(true);
   const [isClient, setIsClient] = useState(false);

   useEffect(() => {
      setIsClient(true);
   }, []);

   useEffect(() => {
      if (!isClient) return;

      // Initial analysis
      analyzeClusterBehavior();

      // Auto-analyze every 60 seconds if enabled
      const interval = autoAnalyze
         ? setInterval(() => {
              analyzeClusterBehavior();
           }, 60000)
         : null;

      return () => {
         if (interval) clearInterval(interval);
      };
   }, [isClient, autoAnalyze, analyzeClusterBehavior]);

   const activeAnomalies = getActiveAnomalies();
   const criticalAnomalies = getCriticalAnomalies();

   if (!isClient) {
      return (
         <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6 flex items-center justify-center">
            <div className="text-center">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
               <p className="text-gray-400">Loading AI Anomaly Detection...</p>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6 relative">
         <MatrixRain />

         <div className="max-w-[1900px] mx-auto relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h1 className="text-3xl font-bold text-white mb-2">AI Anomaly Detection</h1>
                  <p className="text-gray-400">Real-time ML-powered anomaly detection and behavioral analysis</p>
               </div>

               <div className="flex items-center space-x-4">
                  {/* Connection Status */}
                  <div className="flex items-center space-x-2 px-3 py-2 bg-black/30 rounded-lg border border-white/10">
                     <div
                        className={cn('w-2 h-2 rounded-full', {
                           'bg-green-400 animate-pulse': connectionStatus === 'connected',
                           'bg-red-400': connectionStatus === 'disconnected',
                           'bg-yellow-400': connectionStatus === 'connecting',
                        })}
                     />
                     <span className="text-sm text-gray-300 capitalize">{connectionStatus || 'disconnected'}</span>
                  </div>

                  {/* AI Status */}
                  <div className="flex items-center space-x-2 px-3 py-2 bg-black/30 rounded-lg border border-white/10">
                     <HiPlayCircle
                        className={cn('w-4 h-4', {
                           'text-green-400': aiStatus === 'idle',
                           'text-blue-400 animate-spin': aiStatus === 'analyzing',
                           'text-purple-400 animate-pulse': aiStatus === 'learning',
                           'text-orange-400': aiStatus === 'predicting',
                        })}
                     />
                     <span className="text-sm text-gray-300 capitalize">{aiStatus}</span>
                  </div>
               </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
               {/* Left Panel - Anomaly Score */}
               <div className="xl:col-span-1">
                  <div className="bg-black/30 rounded-xl p-6 backdrop-blur-sm border border-white/10 h-full">
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white">Anomaly Score</h3>
                        <ExclamationTriangleIcon className="w-6 h-6 text-orange-400" />
                     </div>

                     <div className="flex justify-center mb-6">
                        <AnomalyGauge score={anomalyScore} />
                     </div>

                     {/* Control Buttons */}
                     <div className="space-y-3">
                        <motion.button
                           onClick={() => analyzeClusterBehavior()}
                           disabled={isAnalyzing}
                           className="w-full py-3 px-4 bg-gradient-to-r from-blue-600/80 to-purple-600/80
                           text-white rounded-lg border border-blue-500/50 hover:from-blue-500/80
                           hover:to-purple-500/80 transition-all duration-300 disabled:opacity-50
                           disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                        >
                           <BoltIcon className="w-5 h-5" />
                           <span>{isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}</span>
                        </motion.button>

                        <motion.button
                           onClick={() => trainModel()}
                           disabled={aiStatus === 'learning'}
                           className="w-full py-3 px-4 bg-gradient-to-r from-purple-600/80 to-pink-600/80
                           text-white rounded-lg border border-purple-500/50 hover:from-purple-500/80
                           hover:to-pink-500/80 transition-all duration-300 disabled:opacity-50
                           disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                        >
                           <SparklesIcon className="w-5 h-5" />
                           <span>{aiStatus === 'learning' ? 'Training...' : 'Retrain Model'}</span>
                        </motion.button>
                     </div>
                  </div>
               </div>

               {/* Center Panel - AI Brain Visualization */}
               <div className="xl:col-span-1">
                  <div className="bg-black/30 rounded-xl p-6 backdrop-blur-sm border border-white/10 h-full">
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white">AI Neural Network</h3>
                        <SparklesIcon className="w-6 h-6 text-purple-400" />
                     </div>

                     <AIBrainVisualization />

                     {/* AI Status Info */}
                     <div className="mt-6 space-y-3">
                        <div className="flex justify-between items-center">
                           <span className="text-gray-400">Model Status</span>
                           <span
                              className={cn('text-sm font-medium', {
                                 'text-green-400': aiStatus === 'idle',
                                 'text-blue-400': aiStatus === 'analyzing',
                                 'text-purple-400': aiStatus === 'learning',
                                 'text-orange-400': aiStatus === 'predicting',
                              })}
                           >
                              {aiStatus.toUpperCase()}
                           </span>
                        </div>

                        {modelPerformance && (
                           <>
                              <div className="flex justify-between items-center">
                                 <span className="text-gray-400">Accuracy</span>
                                 <span className="text-green-400 font-medium">{(modelPerformance.accuracy * 100).toFixed(1)}%</span>
                              </div>

                              <div className="flex justify-between items-center">
                                 <span className="text-gray-400">F1 Score</span>
                                 <span className="text-blue-400 font-medium">{(modelPerformance.f1Score * 100).toFixed(1)}%</span>
                              </div>

                              <div className="flex justify-between items-center">
                                 <span className="text-gray-400">Data Points</span>
                                 <span className="text-cyan-400 font-medium">{modelPerformance.dataPoints.toLocaleString()}</span>
                              </div>
                           </>
                        )}
                     </div>
                  </div>
               </div>

               {/* Right Panel - Anomaly Heatmap */}
               <div className="xl:col-span-1">
                  <AnomalyHeatmap data={anomalyHeatmap} />
               </div>
            </div>

            {/* Recent Anomalies */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {/* Active Anomalies */}
               <div className="bg-black/30 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-xl font-semibold text-white">Active Anomalies</h3>
                     <div className="bg-red-500/20 text-red-400 px-2 py-1 rounded-lg text-sm font-medium">{activeAnomalies.length}</div>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                     <AnimatePresence>
                        {activeAnomalies.slice(0, 5).map(anomaly => (
                           <motion.div
                              key={anomaly.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              className="p-3 bg-black/20 rounded-lg border border-red-500/30"
                           >
                              <div className="flex items-start justify-between">
                                 <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                       <span
                                          className={cn('text-sm font-medium', {
                                             'text-red-400': anomaly.severity === 'critical',
                                             'text-orange-400': anomaly.severity === 'high',
                                             'text-yellow-400': anomaly.severity === 'medium',
                                             'text-gray-400': anomaly.severity === 'low',
                                          })}
                                       >
                                          {anomaly.severity.toUpperCase()}
                                       </span>
                                       <span className="text-gray-500 text-xs">{anomaly.timestamp.toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-white text-sm">{anomaly.message}</p>
                                    <p className="text-gray-400 text-xs mt-1">{anomaly.component}</p>
                                 </div>
                                 <div className="text-right">
                                    <div className="text-lg font-bold text-red-400">{(anomaly.score * 100).toFixed(0)}%</div>
                                 </div>
                              </div>
                           </motion.div>
                        ))}
                     </AnimatePresence>

                     {activeAnomalies.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                           <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                           <p>No active anomalies detected</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* Anomaly Patterns */}
               <div className="bg-black/30 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-xl font-semibold text-white">Detected Patterns</h3>
                     <div className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-lg text-sm font-medium">{anomalyPatterns.length}</div>
                  </div>

                  <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar">
                     {anomalyPatterns.map(pattern => (
                        <motion.div
                           key={pattern.id}
                           initial={{ opacity: 0, scale: 0.95 }}
                           animate={{ opacity: 1, scale: 1 }}
                           className="p-4 bg-black/20 rounded-lg border border-purple-500/30"
                        >
                           <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-white">{pattern.name}</h4>
                              <div className="flex items-center space-x-2">
                                 <span className="text-xs text-gray-400">Risk:</span>
                                 <span
                                    className={cn('text-xs font-medium', {
                                       'text-red-400': pattern.riskLevel > 0.7,
                                       'text-yellow-400': pattern.riskLevel > 0.4,
                                       'text-green-400': pattern.riskLevel <= 0.4,
                                    })}
                                 >
                                    {(pattern.riskLevel * 100).toFixed(0)}%
                                 </span>
                              </div>
                           </div>

                           <p className="text-gray-400 text-sm mb-3">{pattern.description}</p>

                           <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Frequency: {pattern.frequency}x</span>
                              <span className="text-gray-500">Components: {pattern.affectedComponents.length}</span>
                           </div>
                        </motion.div>
                     ))}

                     {anomalyPatterns.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                           <SparklesIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                           <p>No patterns detected yet</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
