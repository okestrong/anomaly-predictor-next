'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CpuChipIcon,
  CommandLineIcon,
  BoltIcon,
  EyeIcon,
  ServerStackIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useClusterStore } from '@/stores/cluster';
import { useAnomalyStore } from '@/stores/anomaly';
import { usePredictionStore } from '@/stores/prediction';
import HolographicDataGrid from '@/components/ui/HolographicDataGrid';
import NeuralNetworkConnections from '@/components/ui/NeuralNetworkConnections';

// Terminal-style command interface
function CommandTerminal() {
  const [commands, setCommands] = useState<Array<{
    id: string;
    command: string;
    output: string;
    timestamp: Date;
    status: 'success' | 'error' | 'warning';
  }>>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  const addCommand = (command: string, output: string, status: 'success' | 'error' | 'warning' = 'success') => {
    const newCommand = {
      id: Date.now().toString(),
      command,
      output,
      timestamp: new Date(),
      status
    };
    setCommands(prev => [...prev, newCommand]);
  };

  const executeCommand = async (command: string) => {
    setIsRunning(true);

    // Simulate command execution
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const lowerCommand = command.toLowerCase().trim();

    if (lowerCommand.includes('ceph status') || lowerCommand.includes('ceph -s')) {
      addCommand(command, `cluster:
  id:     a7f64266-0894-4f1e-a635-d0aeaca0e993
  health: HEALTH_OK

services:
  mon: 3 daemons, quorum node1,node2,node3 (age 2d)
  mgr: node1(active, since 2d), standbys: node2
  osd: 12 osds: 12 up (since 2d), 12 in (since 2d)

data:
  pools:   4 pools, 128 pgs
  objects: 1.24M objects, 512 GiB
  usage:   768 GiB used, 11.2 TiB / 12 TiB avail
  pgs:     128 active+clean`, 'success');
    } else if (lowerCommand.includes('ceph health')) {
      addCommand(command, 'HEALTH_OK', 'success');
    } else if (lowerCommand.includes('ceph osd tree')) {
      addCommand(command, `ID  CLASS  WEIGHT   TYPE NAME       STATUS  REWEIGHT  PRI-AFF
-1         11.09698  root default
-3          3.69899      host node1
 0    hdd   1.23300          osd.0   up   1.00000  1.00000
 1    hdd   1.23300          osd.1   up   1.00000  1.00000
 2    hdd   1.23300          osd.2   up   1.00000  1.00000
-5          3.69899      host node2
 3    hdd   1.23300          osd.3   up   1.00000  1.00000
 4    hdd   1.23300          osd.4   up   1.00000  1.00000
 5    hdd   1.23300          osd.5   up   1.00000  1.00000`, 'success');
    } else if (lowerCommand.includes('help')) {
      addCommand(command, `Available commands:
• ceph status        - Show cluster status
• ceph health       - Show health status
• ceph osd tree     - Show OSD tree
• ceph df           - Show data usage
• clear             - Clear terminal
• analyze           - Run AI analysis
• predict           - Generate predictions`, 'success');
    } else if (lowerCommand.includes('clear')) {
      setCommands([]);
    } else if (lowerCommand.includes('analyze')) {
      addCommand(command, `🔍 AI Analysis initiated...
✓ Collecting cluster metrics
✓ Processing behavioral patterns
✓ Running anomaly detection algorithms
✓ Analysis complete

Results:
• Anomaly Score: 15.2% (Normal)
• Detected 3 behavioral patterns
• No critical anomalies found
• Cluster performance: Optimal`, 'success');
    } else if (lowerCommand.includes('predict')) {
      addCommand(command, `🔮 ML Prediction Engine activated...
✓ Loading prediction models
✓ Analyzing historical data
✓ Generating forecasts

Predictions (Next 24h):
• OSD Failure Risk: 2.1% (Low)
• Storage Utilization: +12 GB
• Performance Impact: Minimal
• Recommended Actions: None`, 'success');
    } else if (lowerCommand.includes('ceph df')) {
      addCommand(command, `RAW STORAGE:
  CLASS     SIZE    AVAIL     USED  RAW USED  %RAW USED
  hdd    12.0 TiB  11.2 TiB  768 GiB   768 GiB       6.25
  TOTAL  12.0 TiB  11.2 TiB  768 GiB   768 GiB       6.25

POOLS:
  POOL                   ID  PGS   STORED  OBJECTS     USED  %USED  MAX AVAIL
  rbd                     1   32  128 GiB   32.8k  384 GiB   3.42    3.6 TiB
  cephfs_metadata         2   16   24 MiB      22   72 MiB      0    3.6 TiB
  cephfs_data             3   64  384 GiB   98.4k  1.1 TiB   9.84    3.6 TiB`, 'success');
    } else {
      addCommand(command, `Command not found: ${command}
Type 'help' for available commands.`, 'error');
    }

    setIsRunning(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCommand.trim() && !isRunning) {
      executeCommand(currentCommand.trim());
      setCurrentCommand('');
    }
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commands]);

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 font-mono text-green-400">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CommandLineIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Ceph Command Terminal</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
          <span className="text-xs">{isRunning ? 'Running' : 'Ready'}</span>
        </div>
      </div>

      <div
        ref={terminalRef}
        className="h-64 overflow-y-auto mb-4 p-2 bg-black/20 rounded border scrollbar-thin scrollbar-thumb-green-500/30"
      >
        <AnimatePresence>
          {commands.map((cmd) => (
            <motion.div
              key={cmd.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-green-400">$</span>
                <span className="text-white">{cmd.command}</span>
                <span className="text-xs text-gray-500">[{cmd.timestamp.toLocaleTimeString()}]</span>
              </div>
              <pre className={`text-sm whitespace-pre-wrap pl-4 ${
                cmd.status === 'error' ? 'text-red-400' :
                cmd.status === 'warning' ? 'text-yellow-400' :
                'text-green-300'
              }`}>
                {cmd.output}
              </pre>
            </motion.div>
          ))}
        </AnimatePresence>

        {commands.length === 0 && (
          <div className="text-gray-500 text-sm">
            Welcome to Ceph AI Command Center
            <br />Type 'help' to see available commands
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <div className="flex-1 flex items-center space-x-2">
          <span className="text-green-400">$</span>
          <input
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            disabled={isRunning}
            placeholder="Enter command..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={isRunning || !currentCommand.trim()}
          className="px-3 py-1 bg-green-600/20 border border-green-500/30 rounded text-green-400
                   hover:bg-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running...' : 'Execute'}
        </button>
      </form>
    </div>
  );
}

export default function CommandInterface() {
  const [isClient, setIsClient] = useState(false);
  const [activeMode, setActiveMode] = useState<'overview' | 'neural' | 'data' | 'terminal'>('overview');

  // Store data state
  const [storeData, setStoreData] = useState({
    clusterStatus: null as any,
    anomalyScore: 0,
    predictions: {} as any,
    aiStatus: 'idle' as any
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const updateStoreData = () => {
      const clusterStore = useClusterStore.getState();
      const anomalyStore = useAnomalyStore.getState();
      const predictionStore = usePredictionStore.getState();

      setStoreData({
        clusterStatus: clusterStore.status,
        anomalyScore: anomalyStore.anomalyScore,
        predictions: predictionStore.predictions,
        aiStatus: anomalyStore.aiStatus
      });
    };

    updateStoreData();

    const unsubscribeCluster = useClusterStore.subscribe(updateStoreData);
    const unsubscribeAnomaly = useAnomalyStore.subscribe(updateStoreData);
    const unsubscribePrediction = usePredictionStore.subscribe(updateStoreData);

    return () => {
      unsubscribeCluster();
      unsubscribeAnomaly();
      unsubscribePrediction();
    };
  }, [isClient]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Command Interface...</p>
        </div>
      </div>
    );
  }

  const activeAnomalies = Object.values(storeData.predictions).filter((p: any) => p.probability > 0.6).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 p-6 relative overflow-hidden">
      {/* Neural network background */}
      <NeuralNetworkConnections />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-cyan-400 to-purple-400
                         bg-clip-text text-transparent mb-4">
            Cyberpunk Command Interface
          </h1>
          <p className="text-slate-400 text-lg">
            Advanced AI-powered cluster management and monitoring
          </p>
        </motion.div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { key: 'overview', icon: ChartBarIcon, label: 'Overview', desc: 'System metrics' },
            { key: 'neural', icon: CpuChipIcon, label: 'Neural Network', desc: 'AI visualization' },
            { key: 'data', icon: ServerStackIcon, label: 'Data Grid', desc: 'Live metrics' },
            { key: 'terminal', icon: CommandLineIcon, label: 'Terminal', desc: 'Command interface' }
          ].map((mode) => (
            <motion.button
              key={mode.key}
              onClick={() => setActiveMode(mode.key as any)}
              className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                activeMode === mode.key
                  ? 'border-cyan-400/50 bg-cyan-400/10 shadow-cyan-400/20'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <mode.icon className={`w-8 h-8 mx-auto mb-2 ${
                activeMode === mode.key ? 'text-cyan-400' : 'text-gray-400'
              }`} />
              <h3 className="text-white font-medium mb-1">{mode.label}</h3>
              <p className="text-gray-400 text-xs">{mode.desc}</p>
            </motion.button>
          ))}
        </div>

        {/* Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Cluster Health</p>
                <p className="text-xl font-bold text-green-400">
                  {storeData.clusterStatus?.health?.replace('HEALTH_', '') || 'OK'}
                </p>
              </div>
              <ServerStackIcon className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">OSDs Online</p>
                <p className="text-xl font-bold text-cyan-400">
                  {storeData.clusterStatus?.osds?.up || 0}/{storeData.clusterStatus?.osds?.total || 0}
                </p>
              </div>
              <ChartBarIcon className="w-8 h-8 text-cyan-400" />
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Anomaly Score</p>
                <p className="text-xl font-bold text-purple-400">
                  {(storeData.anomalyScore * 100).toFixed(1)}%
                </p>
              </div>
              <EyeIcon className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Alerts</p>
                <p className="text-xl font-bold text-orange-400">{activeAnomalies}</p>
              </div>
              <ExclamationTriangleIcon className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div
          key={activeMode}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
        >
          {activeMode === 'overview' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">System Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                    <h3 className="text-emerald-400 font-medium mb-2">Performance</h3>
                    <p className="text-white text-2xl font-bold">98.7%</p>
                    <p className="text-emerald-300 text-sm">Cluster efficiency</p>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <h3 className="text-blue-400 font-medium mb-2">Storage Used</h3>
                    <p className="text-white text-2xl font-bold">6.25%</p>
                    <p className="text-blue-300 text-sm">768 GiB / 12 TiB</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                    <h3 className="text-purple-400 font-medium mb-2">AI Status</h3>
                    <p className="text-white text-lg font-bold capitalize">{storeData.aiStatus}</p>
                    <p className="text-purple-300 text-sm">Model learning active</p>
                  </div>
                  <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                    <h3 className="text-orange-400 font-medium mb-2">Predictions</h3>
                    <p className="text-white text-2xl font-bold">{Object.keys(storeData.predictions).length}</p>
                    <p className="text-orange-300 text-sm">Active forecasts</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border border-cyan-500/30 rounded-lg p-4">
                  <h3 className="text-cyan-400 font-medium mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full p-2 bg-cyan-600/20 border border-cyan-500/30 rounded text-cyan-400 hover:bg-cyan-600/30 transition-colors">
                      Run Health Check
                    </button>
                    <button className="w-full p-2 bg-purple-600/20 border border-purple-500/30 rounded text-purple-400 hover:bg-purple-600/30 transition-colors">
                      AI Analysis
                    </button>
                    <button className="w-full p-2 bg-green-600/20 border border-green-500/30 rounded text-green-400 hover:bg-green-600/30 transition-colors">
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMode === 'neural' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Neural Network Visualization</h2>
              <div className="h-96 bg-black/20 rounded-lg relative overflow-hidden">
                <NeuralNetworkConnections />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <CpuChipIcon className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                    <p className="text-white text-lg font-semibold">AI Neural Network</p>
                    <p className="text-gray-400">Processing cluster behavior patterns</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMode === 'data' && (
            <HolographicDataGrid title="Real-time Cluster Metrics" />
          )}

          {activeMode === 'terminal' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Command Terminal</h2>
              <CommandTerminal />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}