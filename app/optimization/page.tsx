'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowPathIcon,
  BoltIcon,
  CalculatorIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon,
  ArrowsRightLeftIcon,
  ServerStackIcon,
  ArrowTrendingUpIcon,
  Square3Stack3DIcon,
  BeakerIcon,
  PlayIcon,
  PauseIcon,
  ForwardIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import AppHeader from '@/components/layout/AppHeader';

// Mock data
interface Pool {
  id: string;
  name: string;
  currentPGs: number;
  recommendedPGs: number;
  maxPGs: number;
  osdCount: number;
  replicaSize: number;
  utilization: number;
  dataSize: string;
  imbalanceScore: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface OptimizationImpact {
  dataMovement: string;
  estimatedTime: string;
  performanceImpact: string;
  networkBandwidth: string;
  iopsImpact: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface SimulationResult {
  step: number;
  action: string;
  pgsMoved: number;
  dataTransferred: string;
  progress: number;
  status: 'pending' | 'running' | 'completed';
}

const mockPools: Pool[] = [
  {
    id: 'pool-1',
    name: 'rbd',
    currentPGs: 128,
    recommendedPGs: 256,
    maxPGs: 512,
    osdCount: 24,
    replicaSize: 3,
    utilization: 72,
    dataSize: '1.2 TB',
    imbalanceScore: 35,
    status: 'warning',
  },
  {
    id: 'pool-2',
    name: 'cephfs_data',
    currentPGs: 64,
    recommendedPGs: 128,
    maxPGs: 256,
    osdCount: 24,
    replicaSize: 3,
    utilization: 45,
    dataSize: '800 GB',
    imbalanceScore: 15,
    status: 'healthy',
  },
  {
    id: 'pool-3',
    name: 'vm_images',
    currentPGs: 256,
    recommendedPGs: 128,
    maxPGs: 512,
    osdCount: 24,
    replicaSize: 2,
    utilization: 88,
    dataSize: '2.5 TB',
    imbalanceScore: 65,
    status: 'critical',
  },
];

const PGOptimizationPage = () => {
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [currentSimulationStep, setCurrentSimulationStep] = useState(0);
  const [hoveredPool, setHoveredPool] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Simulation data
  const simulationSteps: SimulationResult[] = [
    { step: 1, action: 'Analyzing current PG distribution', pgsMoved: 0, dataTransferred: '0 GB', progress: 0, status: 'pending' },
    { step: 2, action: 'Calculating optimal placement', pgsMoved: 0, dataTransferred: '0 GB', progress: 20, status: 'pending' },
    { step: 3, action: 'Moving PGs to new OSDs', pgsMoved: 32, dataTransferred: '120 GB', progress: 40, status: 'pending' },
    { step: 4, action: 'Rebalancing data across cluster', pgsMoved: 64, dataTransferred: '280 GB', progress: 60, status: 'pending' },
    { step: 5, action: 'Verifying data integrity', pgsMoved: 96, dataTransferred: '450 GB', progress: 80, status: 'pending' },
    { step: 6, action: 'Optimization complete', pgsMoved: 128, dataTransferred: '500 GB', progress: 100, status: 'pending' },
  ];

  const impact: OptimizationImpact = useMemo(() => {
    if (!selectedPool) {
      return {
        dataMovement: '0 GB',
        estimatedTime: '0 min',
        performanceImpact: '0%',
        networkBandwidth: '0 MB/s',
        iopsImpact: 0,
        riskLevel: 'low',
      };
    }

    const pgDiff = Math.abs(selectedPool.recommendedPGs - selectedPool.currentPGs);
    const dataPerPG = parseFloat(selectedPool.dataSize) / selectedPool.currentPGs;
    const totalDataMovement = (pgDiff * dataPerPG * 0.3).toFixed(1);
    const estimatedMinutes = Math.round(pgDiff * 2);
    const perfImpact = Math.min(50, pgDiff / 10);
    const bandwidth = Math.round(pgDiff * 15);
    const iopsImpact = Math.round(pgDiff * 100);

    return {
      dataMovement: `${totalDataMovement} GB`,
      estimatedTime: estimatedMinutes < 60 ? `${estimatedMinutes} min` : `${(estimatedMinutes / 60).toFixed(1)} hours`,
      performanceImpact: `${perfImpact}%`,
      networkBandwidth: `${bandwidth} MB/s`,
      iopsImpact,
      riskLevel: pgDiff > 100 ? 'high' : pgDiff > 50 ? 'medium' : 'low',
    };
  }, [selectedPool]);

  const handleAnalyze = (pool: Pool) => {
    setSelectedPool(pool);
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  };

  const startSimulation = () => {
    setShowSimulation(true);
    setCurrentSimulationStep(0);
    runSimulation();
  };

  const runSimulation = () => {
    const speedMultiplier = simulationSpeed === 'fast' ? 0.5 : simulationSpeed === 'slow' ? 2 : 1;
    let step = 0;

    const interval = setInterval(() => {
      if (step < simulationSteps.length) {
        setCurrentSimulationStep(step);
        step++;
      } else {
        clearInterval(interval);
      }
    }, 1000 * speedMultiplier);
  };

  const executeOptimization = () => {
    setIsOptimizing(true);
    // Simulate optimization execution
    setTimeout(() => {
      setIsOptimizing(false);
      alert('PG Optimization executed successfully!');
    }, 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'from-green-500 to-emerald-600';
      case 'warning':
        return 'from-yellow-500 to-amber-600';
      case 'critical':
        return 'from-red-500 to-rose-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'high':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
        {/* Animated background particles */}
        {mounted && (
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                }}
                animate={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                }}
                transition={{
                  duration: Math.random() * 20 + 10,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            ))}
          </div>
        )}

        <div className="relative z-10 container mx-auto px-6 py-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl">
                  <BoltIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                    PG Optimization Center
                  </h1>
                  <p className="text-gray-400 mt-1">Intelligent placement group distribution and rebalancing</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:shadow-cyan-500/25 transition-shadow"
                onClick={() => window.location.reload()}
              >
                <ArrowPathIcon className="w-5 h-5" />
                Refresh Data
              </motion.button>
            </div>

            {/* Cluster Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-cyan-500/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <Square3Stack3DIcon className="w-6 h-6 text-cyan-400" />
                  <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-full">Live</span>
                </div>
                <div className="text-3xl font-bold text-white">3</div>
                <div className="text-sm text-gray-400">Active Pools</div>
                <div className="mt-3 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-400"
                    initial={{ width: 0 }}
                    animate={{ width: '75%' }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <CpuChipIcon className="w-6 h-6 text-purple-400" />
                  <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full">OSDs</span>
                </div>
                <div className="text-3xl font-bold text-white">24</div>
                <div className="text-sm text-gray-400">Total OSDs</div>
                <div className="mt-3 flex gap-1">
                  {[...Array(24)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-4 rounded-sm ${i < 22 ? 'bg-green-500' : 'bg-yellow-500'}`}
                    />
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-yellow-500/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400" />
                  <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full">Alert</span>
                </div>
                <div className="text-3xl font-bold text-white">2</div>
                <div className="text-sm text-gray-400">Pools Need Optimization</div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  <span className="text-xs text-yellow-400">Action Required</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-green-500/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <ArrowTrendingUpIcon className="w-6 h-6 text-green-400" />
                  <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">Health</span>
                </div>
                <div className="text-3xl font-bold text-white">85%</div>
                <div className="text-sm text-gray-400">Optimization Score</div>
                <div className="mt-3 flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400">Good Performance</span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Pool Selection Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <ServerStackIcon className="w-6 h-6 text-cyan-400" />
              Storage Pools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mockPools.map((pool) => (
                <motion.div
                  key={pool.id}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onHoverStart={() => setHoveredPool(pool.id)}
                  onHoverEnd={() => setHoveredPool(null)}
                  onClick={() => handleAnalyze(pool)}
                  className={`relative bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border cursor-pointer transition-all ${
                    selectedPool?.id === pool.id
                      ? 'border-cyan-400 shadow-lg shadow-cyan-400/25'
                      : 'border-gray-700 hover:border-cyan-500/50'
                  }`}
                >
                  {/* Glow effect on hover */}
                  <AnimatePresence>
                    {hoveredPool === pool.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl"
                      />
                    )}
                  </AnimatePresence>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">{pool.name}</h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${getStatusColor(pool.status)} text-white`}>
                        {pool.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Current PGs</span>
                        <span className="text-white font-semibold">{pool.currentPGs}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Recommended</span>
                        <span className="text-cyan-400 font-semibold">{pool.recommendedPGs}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Utilization</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full bg-gradient-to-r ${
                                pool.utilization > 80 ? 'from-red-500 to-red-600' :
                                pool.utilization > 60 ? 'from-yellow-500 to-yellow-600' :
                                'from-green-500 to-green-600'
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${pool.utilization}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                            />
                          </div>
                          <span className="text-white text-sm font-semibold">{pool.utilization}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Data Size</span>
                        <span className="text-white font-semibold">{pool.dataSize}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Imbalance Score</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            pool.imbalanceScore > 50 ? 'bg-red-500' :
                            pool.imbalanceScore > 25 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`} />
                          <span className="text-white font-semibold">{pool.imbalanceScore}%</span>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="mt-4 w-full py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 rounded-lg font-semibold hover:from-cyan-500/30 hover:to-purple-500/30 transition-all border border-cyan-500/30"
                    >
                      Analyze Pool
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Analysis & Optimization Section */}
          <AnimatePresence>
            {selectedPool && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Analysis Results */}
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-8 border border-cyan-500/20">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <CalculatorIcon className="w-6 h-6 text-cyan-400" />
                    Optimization Analysis for {selectedPool.name}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* PG Calculation */}
                    <div className="bg-gray-900/50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-cyan-400 mb-4">PG Calculation</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Formula</span>
                          <span className="text-white font-mono text-sm">(OSDs × 100) / Replica Size</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Calculation</span>
                          <span className="text-white font-mono text-sm">
                            ({selectedPool.osdCount} × 100) / {selectedPool.replicaSize} = {selectedPool.recommendedPGs}
                          </span>
                        </div>
                        <div className="h-px bg-gray-700 my-3" />
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Current PGs</span>
                          <span className="text-white font-bold text-xl">{selectedPool.currentPGs}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Recommended</span>
                          <span className="text-cyan-400 font-bold text-xl">{selectedPool.recommendedPGs}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Difference</span>
                          <span className={`font-bold text-xl ${
                            selectedPool.currentPGs < selectedPool.recommendedPGs ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {selectedPool.currentPGs < selectedPool.recommendedPGs ? '+' : ''}
                            {selectedPool.recommendedPGs - selectedPool.currentPGs}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Impact Analysis */}
                    <div className="bg-gray-900/50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-purple-400 mb-4">Optimization Impact</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Data Movement</span>
                          <span className="text-white font-semibold">{impact.dataMovement}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Estimated Time</span>
                          <span className="text-white font-semibold">{impact.estimatedTime}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Performance Impact</span>
                          <span className="text-yellow-400 font-semibold">{impact.performanceImpact}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Network Bandwidth</span>
                          <span className="text-white font-semibold">{impact.networkBandwidth}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">IOPS Impact</span>
                          <span className="text-white font-semibold">~{impact.iopsImpact.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Risk Level</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRiskColor(impact.riskLevel)}`}>
                            {impact.riskLevel.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visual Distribution */}
                  <div className="mt-6 bg-gray-900/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">PG Distribution Visualization</h3>
                    <div className="grid grid-cols-2 gap-6">
                      {/* Current Distribution */}
                      <div>
                        <h4 className="text-sm text-gray-400 mb-2">Current Distribution</h4>
                        <div className="grid grid-cols-12 gap-1">
                          {[...Array(24)].map((_, i) => (
                            <motion.div
                              key={`current-${i}`}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: i * 0.02 }}
                              className={`aspect-square rounded-sm ${
                                i % 3 === 0 ? 'bg-red-500' :
                                i % 3 === 1 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{
                                opacity: 0.3 + (Math.random() * 0.7)
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Optimized Distribution */}
                      <div>
                        <h4 className="text-sm text-gray-400 mb-2">After Optimization</h4>
                        <div className="grid grid-cols-12 gap-1">
                          {[...Array(24)].map((_, i) => (
                            <motion.div
                              key={`optimized-${i}`}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: i * 0.02 }}
                              className="aspect-square rounded-sm bg-gradient-to-br from-cyan-500 to-purple-500"
                              style={{
                                opacity: 0.7 + (Math.sin(i) * 0.3)
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startSimulation}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-purple-600 hover:to-purple-700 transition-all"
                    >
                      <BeakerIcon className="w-5 h-5" />
                      Run Simulation
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={executeOptimization}
                      disabled={isOptimizing}
                      className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isOptimizing ? (
                        <>
                          <ArrowPathIcon className="w-5 h-5 animate-spin" />
                          Optimizing...
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="w-5 h-5" />
                          Execute Optimization
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Simulation Section */}
                <AnimatePresence>
                  {showSimulation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-8 border border-purple-500/20"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                          <BeakerIcon className="w-6 h-6 text-purple-400" />
                          Optimization Simulation
                        </h2>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg px-3 py-1">
                            <span className="text-gray-400 text-sm">Speed:</span>
                            <div className="flex gap-1">
                              {(['slow', 'normal', 'fast'] as const).map((speed) => (
                                <button
                                  key={speed}
                                  onClick={() => setSimulationSpeed(speed)}
                                  className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                                    simulationSpeed === speed
                                      ? 'bg-purple-500 text-white'
                                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                  }`}
                                >
                                  {speed === 'slow' ? '0.5x' : speed === 'normal' ? '1x' : '2x'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Simulation Steps */}
                      <div className="space-y-4">
                        {simulationSteps.map((step, index) => (
                          <motion.div
                            key={step.step}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative flex items-center gap-4 p-4 rounded-lg ${
                              currentSimulationStep >= index
                                ? 'bg-gray-900/50 border border-purple-500/30'
                                : 'bg-gray-900/20 border border-gray-700/50'
                            }`}
                          >
                            {/* Step Number */}
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                              currentSimulationStep > index
                                ? 'bg-green-500 text-white'
                                : currentSimulationStep === index
                                ? 'bg-purple-500 text-white animate-pulse'
                                : 'bg-gray-700 text-gray-400'
                            }`}>
                              {currentSimulationStep > index ? (
                                <CheckIcon className="w-5 h-5" />
                              ) : (
                                step.step
                              )}
                            </div>

                            {/* Step Details */}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className={`font-semibold ${
                                  currentSimulationStep >= index ? 'text-white' : 'text-gray-500'
                                }`}>
                                  {step.action}
                                </span>
                                {currentSimulationStep === index && (
                                  <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full animate-pulse">
                                    Processing...
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">PGs Moved:</span>
                                  <span className={`ml-2 font-semibold ${
                                    currentSimulationStep >= index ? 'text-cyan-400' : 'text-gray-600'
                                  }`}>
                                    {currentSimulationStep >= index ? step.pgsMoved : '-'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Data Transferred:</span>
                                  <span className={`ml-2 font-semibold ${
                                    currentSimulationStep >= index ? 'text-purple-400' : 'text-gray-600'
                                  }`}>
                                    {currentSimulationStep >= index ? step.dataTransferred : '-'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Progress:</span>
                                  <span className={`ml-2 font-semibold ${
                                    currentSimulationStep >= index ? 'text-green-400' : 'text-gray-600'
                                  }`}>
                                    {currentSimulationStep >= index ? `${step.progress}%` : '-'}
                                  </span>
                                </div>
                              </div>
                              {currentSimulationStep >= index && (
                                <motion.div
                                  className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                >
                                  <motion.div
                                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-400"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${step.progress}%` }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                  />
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Simulation Results */}
                      {currentSimulationStep >= simulationSteps.length - 1 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-6 p-6 bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg border border-green-500/30"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <CheckCircleIcon className="w-8 h-8 text-green-400" />
                            <h3 className="text-xl font-bold text-white">Simulation Complete!</h3>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Total PGs Optimized:</span>
                              <span className="block text-2xl font-bold text-white mt-1">128</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Data Rebalanced:</span>
                              <span className="block text-2xl font-bold text-cyan-400 mt-1">500 GB</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Time Required:</span>
                              <span className="block text-2xl font-bold text-purple-400 mt-1">2.5 hrs</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Success Rate:</span>
                              <span className="block text-2xl font-bold text-green-400 mt-1">100%</span>
                            </div>
                          </div>
                          <p className="mt-4 text-gray-400">
                            The simulation shows optimal redistribution of placement groups with minimal impact on cluster performance.
                            It is safe to proceed with the actual optimization.
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default PGOptimizationPage;