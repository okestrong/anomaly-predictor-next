'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CpuChipIcon,
  ServerStackIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  EyeIcon,
  BoltIcon,
  ShieldCheckIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { useClusterStore } from '@/stores/cluster';
import { useAnomalyStore } from '@/stores/anomaly';
import { usePredictionStore } from '@/stores/prediction';
import NeuralNetworkCanvas from './NeuralNetworkCanvas';
import HolographicCard from './HolographicCard';
import AIBrainVisualization from './AIBrainVisualization';
import DataStream from './DataStream';

export default function ControlCenterDashboard() {
  const [isClient, setIsClient] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'predictions' | 'anomalies' | 'topology'>('overview');

  // Store data state with proper types
  const [storeData, setStoreData] = useState<{
    clusterStatus: any;
    predictions: Record<string, any>;
    anomalyScore: number;
    modelPerformance: any;
    aiStatus: 'idle' | 'analyzing' | 'learning' | 'predicting';
    highRiskPredictions: any[];
    criticalAnomalies: any[];
    overallRiskScore: number;
    clusterHealthScore: number;
  }>({
    clusterStatus: null,
    predictions: {},
    anomalyScore: 0,
    modelPerformance: null,
    aiStatus: 'idle',
    highRiskPredictions: [],
    criticalAnomalies: [],
    overallRiskScore: 0,
    clusterHealthScore: 0
  });

  // Actions only (these are stable)
  const refreshAll = useClusterStore(state => state.refreshAll);
  const analyzeClusterBehavior = useAnomalyStore(state => state.analyzeClusterBehavior);
  const updateAllPredictions = usePredictionStore(state => state.updateAllPredictions);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Access stores only on client side and update local state
    const updateStoreData = () => {
      const clusterStore = useClusterStore.getState();
      const anomalyStore = useAnomalyStore.getState();
      const predictionStore = usePredictionStore.getState();

      const predictions = predictionStore.predictions;
      const highRiskPredictions = Object.values(predictions).filter(p => p.probability > 0.6);

      setStoreData({
        clusterStatus: clusterStore.status,
        predictions: predictions,
        anomalyScore: anomalyStore.anomalyScore,
        modelPerformance: anomalyStore.modelPerformance,
        aiStatus: anomalyStore.aiStatus,
        highRiskPredictions: highRiskPredictions,
        criticalAnomalies: anomalyStore.getCriticalAnomalies(),
        overallRiskScore: predictionStore.getOverallRiskScore(),
        clusterHealthScore: clusterStore.getClusterHealthScore()
      });
    };

    // Initial data load
    refreshAll();
    updateStoreData();

    // Subscribe to store changes
    const unsubscribeCluster = useClusterStore.subscribe(updateStoreData);
    const unsubscribeAnomaly = useAnomalyStore.subscribe(updateStoreData);
    const unsubscribePrediction = usePredictionStore.subscribe(updateStoreData);

    return () => {
      unsubscribeCluster();
      unsubscribeAnomaly();
      unsubscribePrediction();
    };
  }, [isClient, refreshAll]);

  if (!isClient) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-slate-950 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading AI Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 p-8">
      {/* Neural Network Background */}
      <NeuralNetworkCanvas />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400
                         bg-clip-text text-transparent mb-4">
            AI Command Center
          </h1>
          <p className="text-slate-400 text-lg">
            Advanced cluster intelligence and predictive analytics
          </p>
        </motion.div>

        {/* AI Status Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed top-8 right-8 z-50"
        >
          <div className="bg-slate-900/80 backdrop-blur-md rounded-xl p-4 border border-purple-400/30">
            <AIBrainVisualization />
            <div className="text-center">
              <div className="text-sm text-purple-300 mb-1">AI Status</div>
              <div className={`text-xs font-medium ${
                storeData.aiStatus === 'analyzing' ? 'text-cyan-400' :
                storeData.aiStatus === 'learning' ? 'text-purple-400' :
                storeData.aiStatus === 'predicting' ? 'text-amber-400' :
                'text-emerald-400'
              }`}>
                {storeData.aiStatus.toUpperCase()}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Cluster Health */}
          <HolographicCard
            title="Cluster Health"
            value={storeData.clusterHealthScore.toFixed(0)}
            unit="%"
            icon={ShieldCheckIcon}
            color={storeData.clusterHealthScore > 80 ? 'emerald' : storeData.clusterHealthScore > 60 ? 'amber' : 'red'}
            trend={storeData.clusterHealthScore > 80 ? 'stable' : 'down'}
            onClick={() => setSelectedView('topology')}
          >
            <div className="text-xs text-slate-400">
              {storeData.clusterStatus?.osds.up || 0}/{storeData.clusterStatus?.osds.total || 0} OSDs Online
            </div>
          </HolographicCard>

          {/* Risk Score */}
          <HolographicCard
            title="Risk Assessment"
            value={storeData.overallRiskScore.toFixed(1)}
            unit="/100"
            icon={ExclamationTriangleIcon}
            color={storeData.overallRiskScore < 30 ? 'emerald' : storeData.overallRiskScore < 60 ? 'amber' : 'red'}
            trend={storeData.overallRiskScore < 30 ? 'stable' : 'up'}
            onClick={() => setSelectedView('predictions')}
          >
            <div className="text-xs text-slate-400">
              {storeData.highRiskPredictions.length} High Risk Predictions
            </div>
          </HolographicCard>

          {/* Anomaly Score */}
          <HolographicCard
            title="Anomaly Detection"
            value={(storeData.anomalyScore * 100).toFixed(1)}
            unit="%"
            icon={EyeIcon}
            color={storeData.anomalyScore < 0.3 ? 'emerald' : storeData.anomalyScore < 0.6 ? 'amber' : 'red'}
            trend={storeData.anomalyScore < 0.3 ? 'stable' : 'up'}
            onClick={() => setSelectedView('anomalies')}
          >
            <div className="text-xs text-slate-400">
              Model Accuracy: {((storeData.modelPerformance?.accuracy || 0) * 100).toFixed(1)}%
            </div>
          </HolographicCard>

          {/* AI Performance */}
          <HolographicCard
            title="AI Performance"
            value={((storeData.modelPerformance?.f1Score || 0) * 100).toFixed(1)}
            unit="%"
            icon={CpuChipIcon}
            color="purple"
            trend="stable"
          >
            <div className="text-xs text-slate-400">
              {(storeData.modelPerformance?.dataPoints || 0).toLocaleString()} Data Points
            </div>
          </HolographicCard>
        </div>

        {/* Real-time Data Streams */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <HolographicCard
              title="Real-time Metrics"
              value=""
              icon={ChartBarIcon}
              color="cyan"
            >
              <DataStream />
            </HolographicCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <button
              onClick={analyzeClusterBehavior}
              disabled={storeData.aiStatus !== 'idle'}
              className="w-full p-4 bg-gradient-to-r from-purple-600/20 to-cyan-600/20
                       border border-purple-400/30 rounded-xl text-purple-300
                       hover:from-purple-600/30 hover:to-cyan-600/30 transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BoltIcon className="w-5 h-5 inline mr-2" />
              {storeData.aiStatus === 'analyzing' ? 'Analyzing...' : 'Analyze Cluster'}
            </button>

            <button
              onClick={updateAllPredictions}
              className="w-full p-4 bg-gradient-to-r from-cyan-600/20 to-purple-600/20
                       border border-cyan-400/30 rounded-xl text-cyan-300
                       hover:from-cyan-600/30 hover:to-purple-600/30 transition-all duration-300"
            >
              <CogIcon className="w-5 h-5 inline mr-2" />
              Update Predictions
            </button>
          </motion.div>
        </div>

        {/* Navigation Shortcuts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { title: 'Cluster Topology', href: '/topology', icon: ServerStackIcon, color: 'emerald' },
            { title: 'Traffic Analysis', href: '/traffic', icon: ChartBarIcon, color: 'cyan' },
            { title: 'Predictions', href: '/prediction', icon: BoltIcon, color: 'purple' },
            { title: 'Anomaly Detection', href: '/anomaly', icon: EyeIcon, color: 'amber' }
          ].map((item, index) => (
            <motion.a
              key={item.title}
              href={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                p-6 rounded-xl border backdrop-blur-md group cursor-pointer
                hover:scale-105 transition-all duration-300
                ${item.color === 'emerald' ? 'border-emerald-400/30 bg-emerald-400/5 hover:shadow-emerald-400/20' :
                  item.color === 'cyan' ? 'border-cyan-400/30 bg-cyan-400/5 hover:shadow-cyan-400/20' :
                  item.color === 'purple' ? 'border-purple-400/30 bg-purple-400/5 hover:shadow-purple-400/20' :
                  'border-amber-400/30 bg-amber-400/5 hover:shadow-amber-400/20'}
              `}
            >
              <item.icon className={`w-8 h-8 mb-4 ${
                item.color === 'emerald' ? 'text-emerald-400' :
                item.color === 'cyan' ? 'text-cyan-400' :
                item.color === 'purple' ? 'text-purple-400' :
                'text-amber-400'
              }`} />
              <h3 className="text-white font-semibold mb-2">{item.title}</h3>
              <p className="text-slate-400 text-sm">
                {item.title === 'Cluster Topology' ? 'Visualize cluster architecture' :
                 item.title === 'Traffic Analysis' ? 'Monitor data flow patterns' :
                 item.title === 'Predictions' ? 'AI-powered failure prediction' :
                 'Detect behavioral anomalies'}
              </p>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </div>
  );
}