'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, RadarChart, Radar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, RadialBarChart, RadialBar
} from 'recharts';
import {
  CpuChipIcon, ServerStackIcon, CommandLineIcon, BoltIcon, ShieldCheckIcon,
  ExclamationTriangleIcon, ChartBarIcon, EyeIcon, SparklesIcon, GlobeAsiaAustraliaIcon,
  ArrowTrendingUpIcon, ArrowTrendingDownIcon, CircleStackIcon, CloudArrowUpIcon, BellIcon
} from '@heroicons/react/24/outline';
import { useClusterStore } from '@/stores/cluster';
import { useAnomalyStore } from '@/stores/anomaly';
import { usePredictionStore } from '@/stores/prediction';
import { useRealtimeStore } from '@/stores/realtimeData';

// Cyberpunk color palette
const COLORS = {
  primary: '#00D4FF',
  secondary: '#7C3AED',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  dark: '#0F172A',
  light: '#F1F5F9'
};

const CHART_COLORS = ['#00D4FF', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

// Animated background grid
function CyberpunkGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-20">
      <div className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${COLORS.primary}20 1px, transparent 1px),
                           linear-gradient(90deg, ${COLORS.primary}20 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          animation: 'grid-move 10s linear infinite'
        }}
      />
      <style jsx>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
      `}</style>
    </div>
  );
}

// 3D Card Component with holographic effect
function HoloCard({ children, title, icon: Icon, color = 'primary', className = '' }: any) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`relative group ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02, rotateY: 5 }}
      style={{ perspective: '1000px' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-cyan-600/20
                      rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />

      <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10
                      overflow-hidden">
        {/* Holographic shimmer */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                          -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%]
                          transition-transform duration-1000" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && <Icon className={`w-5 h-5 text-${color}-400`} />}
              <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
            <div className={`w-2 h-2 rounded-full bg-${color}-400 animate-pulse`} />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

// Advanced Terminal Component with AI Commands
function AdvancedTerminal() {
  const [commands, setCommands] = useState<any[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [autocomplete, setAutocomplete] = useState<string[]>([]);

  const availableCommands = [
    'status', 'health', 'predict', 'analyze', 'metrics', 'clear',
    'ai-train', 'ai-eval', 'scan', 'optimize', 'report', 'export',
    'monitor', 'benchmark', 'diagnose', 'recover'
  ];

  const handleCommand = async (cmd: string) => {
    setIsProcessing(true);
    const newCommand = {
      id: Date.now(),
      input: cmd,
      output: await processCommand(cmd),
      timestamp: new Date(),
      type: getCommandType(cmd)
    };
    setCommands(prev => [...prev.slice(-20), newCommand]);
    setCurrentCommand('');
    setIsProcessing(false);
  };

  const getCommandType = (cmd: string) => {
    if (cmd.startsWith('ai-')) return 'ai';
    if (['predict', 'analyze'].includes(cmd.toLowerCase())) return 'ml';
    if (['status', 'health', 'metrics'].includes(cmd.toLowerCase())) return 'monitor';
    return 'system';
  };

  const processCommand = async (cmd: string) => {
    const lower = cmd.toLowerCase();

    // Simulate processing delay for realistic effect
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));

    if (lower === 'help') return `🤖 Neural Terminal v2.0 - Available Commands:

📊 Monitoring Commands:
  status    - Show cluster status with real-time metrics
  health    - Check comprehensive health metrics
  metrics   - Display real-time performance metrics
  monitor   - Start continuous monitoring mode

🧠 AI/ML Commands:
  predict   - Run AI predictions for next 24h
  analyze   - Deep anomaly analysis with ML
  ai-train  - Retrain AI models with latest data
  ai-eval   - Evaluate model performance

🔧 Management Commands:
  scan      - Full system vulnerability scan
  optimize  - Run performance optimization
  benchmark - Execute performance benchmark
  diagnose  - Run diagnostic procedures
  recover   - Initiate recovery procedures

📁 Utility Commands:
  report    - Generate detailed report
  export    - Export data to JSON/CSV
  clear     - Clear terminal output`;

    if (lower === 'clear') {
      setCommands([]);
      return '';
    }

    if (lower === 'status') return `🟢 Cluster Status: HEALTHY
├─ OSDs: 12/12 UP (100% operational)
├─ MONs: 3/3 Active (Quorum established)
├─ MDSs: 2/2 Active (Metadata services running)
├─ PGs: 512 active+clean
├─ Usage: 35.2 TiB / 100 TiB (35.2%)
└─ Client connections: 42 active`;

    if (lower === 'health') return `🩺 Health Check Report:
✅ Overall Status: HEALTH_OK
├─ No critical issues detected
├─ 2 warnings (non-critical)
├─ Last scrub: 2 hours ago
├─ Recovery rate: 100 MB/s
└─ Rebalancing: Not required`;

    if (lower === 'predict') return `🔮 AI Prediction Analysis:
├─ Model: DeepCeph-v3.2 (accuracy: 96.5%)
├─ Processing 1.2M data points...
├─ Risk Score: 12.5% (Low)
├─ Next 24h forecast:
│  ├─ 08:00 - Normal operations expected
│  ├─ 14:00 - Slight load increase (15%)
│  └─ 20:00 - Maintenance window recommended
├─ Failure probability: 0.3%
└─ Confidence interval: 94.2%`;

    if (lower === 'analyze') return `🔍 Deep Anomaly Analysis:
├─ Scanning last 7 days of metrics...
├─ Patterns analyzed: 15,420
├─ Anomalies detected: 3
│  ├─ [WARNING] Unusual IOPS spike at 2024-01-15 03:42
│  ├─ [INFO] Temporary network latency at 2024-01-14 15:23
│  └─ [INFO] Cache miss rate elevated at 2024-01-13 09:15
├─ Root cause analysis: Complete
└─ Recommendations: Enable auto-scaling for peak hours`;

    if (lower === 'ai-train') return `🧠 AI Model Training:
├─ Loading dataset: 5.2 GB
├─ Training epochs: 100/100
├─ Loss: 0.0234 (converged)
├─ Validation accuracy: 97.2%
├─ Model saved: models/DeepCeph-v3.3
└─ Training time: 4m 23s`;

    if (lower === 'ai-eval') return `📊 Model Performance Evaluation:
├─ Test set size: 50,000 samples
├─ Accuracy: 96.5%
├─ Precision: 94.2%
├─ Recall: 97.8%
├─ F1 Score: 95.96%
├─ AUC-ROC: 0.982
└─ Performance: Excellent`;

    if (lower === 'scan') return `🔐 Security Scan:
├─ Scanning 12 nodes...
├─ Vulnerabilities: 0 critical, 1 medium, 3 low
├─ Configuration: Optimal
├─ Certificates: Valid (expires in 287 days)
└─ Compliance: 100% (ISO 27001, SOC 2)`;

    if (lower === 'optimize') return `⚡ Performance Optimization:
├─ Analyzing current configuration...
├─ Optimizations applied:
│  ├─ Cache size increased to 8 GB
│  ├─ Thread pool adjusted to 128
│  ├─ Network buffers optimized
│  └─ PG autoscaling enabled
├─ Performance gain: +23%
└─ Status: Optimization complete`;

    if (lower === 'monitor') return `📡 Continuous Monitoring Mode:
├─ Real-time metrics streaming enabled
├─ Alert threshold: Critical only
├─ Update interval: 1 second
├─ Dashboards: 4 active
└─ Press Ctrl+C to stop monitoring`;

    if (lower === 'benchmark') return `🏁 Performance Benchmark:
├─ Sequential Read: 3.2 GB/s
├─ Sequential Write: 2.8 GB/s
├─ Random Read IOPS: 125,000
├─ Random Write IOPS: 98,000
├─ Latency (avg): 0.8 ms
├─ Latency (p99): 2.1 ms
└─ Score: 9,542 (Excellent)`;

    if (lower === 'report') return `📄 Report Generation:
├─ Collecting metrics...
├─ Analyzing trends...
├─ Generating visualizations...
├─ Report created: reports/cluster_2024_01_15.pdf
└─ Size: 2.4 MB`;

    return `⚡ Command executed: ${cmd}\n└─ Processing complete in ${(Math.random() * 1000).toFixed(0)}ms`;
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commands]);

  useEffect(() => {
    if (currentCommand) {
      const matches = availableCommands.filter(cmd =>
        cmd.startsWith(currentCommand.toLowerCase())
      );
      setAutocomplete(matches);
    } else {
      setAutocomplete([]);
    }
  }, [currentCommand]);

  return (
    <div className="h-full flex flex-col bg-black/60 rounded-lg border border-cyan-500/30 font-mono text-sm">
      <div className="px-4 py-2 border-b border-cyan-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CommandLineIcon className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400">Neural Terminal v2.0</span>
        </div>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
      </div>

      <div ref={terminalRef} className="flex-1 p-4 overflow-y-auto space-y-2 max-h-96">
        <div className="space-y-1">
          <div className="text-cyan-400 font-bold">🤖 Neural Command Center Terminal</div>
          <div className="text-gray-500 text-xs">AI-Powered Cluster Management Interface</div>
          <div className="text-gray-600 text-xs">Type 'help' for available commands • Tab for autocomplete</div>
        </div>

        {commands.map(cmd => (
          <motion.div
            key={cmd.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-1"
          >
            <div className="flex items-center gap-2">
              <span className="text-green-400">❯</span>
              <span className={`font-mono ${
                cmd.type === 'ai' ? 'text-purple-400' :
                cmd.type === 'ml' ? 'text-blue-400' :
                cmd.type === 'monitor' ? 'text-green-400' :
                'text-white'
              }`}>{cmd.input}</span>
              <span className="text-gray-600 text-xs ml-auto">
                {cmd.timestamp.toLocaleTimeString()}
              </span>
            </div>
            {cmd.output && (
              <div className="pl-4 text-cyan-300 whitespace-pre-wrap font-mono text-sm">
                {cmd.output}
              </div>
            )}
          </motion.div>
        ))}

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-yellow-400"
          >
            <span className="text-green-400">❯</span>
            <span>Processing...</span>
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >_</motion.span>
          </motion.div>
        )}
      </div>

      <div className="relative">
        {autocomplete.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 bg-slate-900/95 border border-cyan-500/30 rounded-t-lg">
            {autocomplete.map((cmd, idx) => (
              <div
                key={idx}
                className="px-4 py-2 text-cyan-300 hover:bg-cyan-500/20 cursor-pointer"
                onClick={() => setCurrentCommand(cmd)}
              >
                {cmd}
              </div>
            ))}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); if (!isProcessing) handleCommand(currentCommand); }}
              className="px-4 py-3 border-t border-cyan-500/30 flex items-center gap-2">
          <span className="text-green-400">❯</span>
          <input
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Tab' && autocomplete.length > 0) {
                e.preventDefault();
                setCurrentCommand(autocomplete[0]);
              }
            }}
            className="flex-1 bg-transparent text-white outline-none placeholder-gray-500 font-mono"
            placeholder="Enter command..."
            autoComplete="off"
            disabled={isProcessing}
          />
          {currentCommand && (
            <motion.button
              type="submit"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="text-cyan-400 hover:text-cyan-300"
              disabled={isProcessing}
            >
              <CommandLineIcon className="w-5 h-5" />
            </motion.button>
          )}
        </form>
      </div>
    </div>
  );
}

// Real-time Alerts Feed Component
function AlertsFeed() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Generate initial alerts
    const initialAlerts = [
      { id: 1, type: 'info', message: 'System initialized successfully', time: new Date() },
      { id: 2, type: 'success', message: 'AI models loaded and operational', time: new Date() },
      { id: 3, type: 'warning', message: 'Cache usage at 75%', time: new Date(Date.now() - 300000) },
    ];
    setAlerts(initialAlerts);

    // Simulate real-time alerts
    const interval = setInterval(() => {
      const alertTypes = ['info', 'success', 'warning', 'error'];
      const messages = [
        'OSD performance metrics updated',
        'Prediction model accuracy improved to 97%',
        'Network latency spike detected',
        'Automatic rebalancing initiated',
        'Cache hit ratio optimized',
        'New anomaly pattern detected',
        'Health check completed successfully',
        'Backup verification passed'
      ];

      const newAlert = {
        id: Date.now(),
        type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        time: new Date()
      };

      setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
    }, 10000 + Math.random() * 20000);

    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return '🚨';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-400 border-red-500/30';
      case 'warning': return 'text-yellow-400 border-yellow-500/30';
      case 'success': return 'text-green-400 border-green-500/30';
      default: return 'text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20, height: 0 }}
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            className={`p-3 bg-black/30 border rounded-lg ${getAlertColor(alert.type)}`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">{getAlertIcon(alert.type)}</span>
              <div className="flex-1">
                <p className="text-sm text-white">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {alert.time.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Network Topology Visualizer
function NetworkTopology() {
  const [nodes, setNodes] = useState<any[]>([]);

  useEffect(() => {
    // Generate network nodes
    const generateNodes = () => {
      const nodeTypes = ['OSD', 'MON', 'MDS', 'RGW'];
      const nodeList: any[] = [];

      for (let i = 0; i < 12; i++) {
        nodeList.push({
          id: i,
          type: nodeTypes[Math.floor(Math.random() * nodeTypes.length)],
          status: Math.random() > 0.9 ? 'warning' : 'healthy',
          x: Math.random() * 300,
          y: Math.random() * 200,
          connections: [] as number[]
        });
      }

      // Add connections
      nodeList.forEach((node, idx) => {
        const connectionCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < connectionCount; i++) {
          const targetIdx = Math.floor(Math.random() * nodeList.length);
          if (targetIdx !== idx) {
            node.connections.push(targetIdx);
          }
        }
      });

      setNodes(nodeList);
    };

    generateNodes();
    const interval = setInterval(generateNodes, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-64 bg-black/30 rounded-lg overflow-hidden">
      <svg className="absolute inset-0 w-full h-full">
        {/* Draw connections */}
        {nodes.map((node) =>
          node.connections.map((targetId: number, idx: number) => {
            const target = nodes[targetId];
            if (!target) return null;
            return (
              <motion.line
                key={`${node.id}-${targetId}-${idx}`}
                x1={node.x}
                y1={node.y}
                x2={target.x}
                y2={target.y}
                stroke={COLORS.primary}
                strokeOpacity={0.2}
                strokeWidth={1}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1 }}
              />
            );
          })
        )}

        {/* Draw nodes */}
        {nodes.map((node) => (
          <motion.g key={node.id}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={8}
              fill={node.status === 'warning' ? COLORS.warning : COLORS.success}
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: Math.random() * 5 }}
            />
            <text
              x={node.x}
              y={node.y - 12}
              fill="white"
              fontSize="10"
              textAnchor="middle"
              className="font-mono"
            >
              {node.type}
            </text>
          </motion.g>
        ))}
      </svg>

      <div className="absolute top-2 left-2 text-xs text-gray-400">
        Network Topology Map
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function CommandCenterDashboard() {
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Store data
  const [storeData, setStoreData] = useState({
    clusterStatus: null as any,
    predictions: {} as any,
    anomalyScore: 0,
    modelPerformance: null as any,
    aiStatus: 'idle' as any,
    osds: [] as any[],
    pools: [] as any[],
    realtimeMetrics: {
      latency: [] as any[],
      throughput: [] as any[],
      iops: [] as any[],
      cpu: [] as any[],
      memory: [] as any[],
      network: [] as any[]
    }
  });

  useEffect(() => {
    // Start realtime updates
    const realtimeStore = useRealtimeStore.getState();
    realtimeStore.startRealTimeUpdates();

    return () => {
      realtimeStore.stopRealTimeUpdates();
    };
  }, []);

  useEffect(() => {

    const updateStoreData = () => {
      const cluster = useClusterStore.getState();
      const anomaly = useAnomalyStore.getState();
      const prediction = usePredictionStore.getState();
      const realtime = useRealtimeStore.getState();

      // Generate time-series data
      const generateTimeSeries = (data: any[], label: string) => {
        if (!data || data.length === 0) {
          // Generate mock data for demo
          return Array.from({ length: 20 }, (_, i) => ({
            time: `${i}:00`,
            value: Math.random() * 100,
            label
          }));
        }
        return data.slice(-20).map((d: any, i: number) => ({
          time: `${i}:00`,
          value: d.value || 0,
          label
        }));
      };

      setStoreData({
        clusterStatus: cluster.status || { health: 'HEALTH_OK', osds: { up: 12, total: 12 } },
        predictions: prediction.predictions || {},
        anomalyScore: anomaly.anomalyScore || 0,
        modelPerformance: anomaly.modelPerformance,
        aiStatus: anomaly.aiStatus || 'active',
        osds: cluster.osds || [],
        pools: cluster.pools || [],
        realtimeMetrics: {
          latency: generateTimeSeries(realtime.chartMetrics?.latency, 'Latency'),
          throughput: generateTimeSeries(realtime.chartMetrics?.throughput, 'Throughput'),
          iops: generateTimeSeries(realtime.chartMetrics?.iops, 'IOPS'),
          cpu: generateTimeSeries(realtime.chartMetrics?.osdPerformance, 'OSD Performance'),
          memory: generateTimeSeries(realtime.chartMetrics?.poolUsage, 'Pool Usage'),
          network: generateTimeSeries(realtime.chartMetrics?.networkErrors, 'Network Errors')
        }
      });
    };

    // Force initial update
    setTimeout(updateStoreData, 100);
    const interval = setInterval(updateStoreData, 5000);

    return () => clearInterval(interval);
  }, []);

  // Remove SSR loading screen - render directly


  // Prepare chart data
  const performanceData = [
    { name: 'Read', value: 92, fill: COLORS.primary },
    { name: 'Write', value: 87, fill: COLORS.secondary },
    { name: 'Latency', value: 95, fill: COLORS.success },
    { name: 'IOPS', value: 89, fill: COLORS.info }
  ];

  const storageData = [
    { name: 'Used', value: 35, fill: COLORS.warning },
    { name: 'Available', value: 65, fill: COLORS.success }
  ];

  const radarData = [
    { metric: 'CPU', value: 75, fullMark: 100 },
    { metric: 'Memory', value: 82, fullMark: 100 },
    { metric: 'Network', value: 68, fullMark: 100 },
    { metric: 'Disk I/O', value: 91, fullMark: 100 },
    { metric: 'Cache', value: 78, fullMark: 100 },
    { metric: 'Latency', value: 94, fullMark: 100 }
  ];

  const healthScore = storeData.clusterStatus?.health === 'HEALTH_OK' ? 100 :
                     storeData.clusterStatus?.health === 'HEALTH_WARN' ? 75 : 50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 relative">
      <CyberpunkGrid />

      <div className="relative z-10 p-6 space-y-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400
                         bg-clip-text text-transparent mb-2">
            Neural Command Center
          </h1>
          <p className="text-gray-400 text-lg">Advanced AI-Powered Cluster Intelligence System</p>
        </motion.div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Cluster Health', value: healthScore + '%', icon: ShieldCheckIcon, color: 'green' },
            { label: 'Active OSDs', value: `${storeData.clusterStatus?.osds?.up || 0}/${storeData.clusterStatus?.osds?.total || 0}`, icon: ServerStackIcon, color: 'cyan' },
            { label: 'AI Score', value: (storeData.anomalyScore * 100).toFixed(1) + '%', icon: SparklesIcon, color: 'purple' },
            { label: 'Predictions', value: Object.keys(storeData.predictions).length, icon: ChartBarIcon, color: 'blue' },
            { label: 'Risk Level', value: 'Low', icon: ExclamationTriangleIcon, color: 'yellow' }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-900/60 backdrop-blur-xl rounded-xl border border-white/10 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 text-${stat.color}-400 opacity-50`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Real-time Metrics */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Performance Charts */}
            <HoloCard title="Real-time Performance Metrics" icon={ChartBarIcon}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Area Chart - Throughput */}
                <div>
                  <h4 className="text-sm text-gray-400 mb-3">Network Throughput</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={storeData.realtimeMetrics.throughput}>
                      <defs>
                        <linearGradient id="throughputGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #00D4FF' }} />
                      <Area type="monotone" dataKey="value" stroke={COLORS.primary}
                            fill="url(#throughputGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Line Chart - Latency */}
                <div>
                  <h4 className="text-sm text-gray-400 mb-3">Latency Trends</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={storeData.realtimeMetrics.latency}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #7C3AED' }} />
                      <Line type="monotone" dataKey="value" stroke={COLORS.secondary}
                            strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </HoloCard>

            {/* Advanced Metrics */}
            <HoloCard title="System Resource Utilization" icon={CpuChipIcon}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Radial Bar Chart */}
                <div>
                  <h4 className="text-sm text-gray-400 mb-3 text-center">Performance Score</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="90%"
                                    data={performanceData}>
                      <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                      <Tooltip />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>

                {/* Radar Chart */}
                <div>
                  <h4 className="text-sm text-gray-400 mb-3 text-center">Resource Distribution</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="metric" stroke="#64748b" />
                      <PolarRadiusAxis stroke="#334155" />
                      <Radar dataKey="value" stroke={COLORS.info} fill={COLORS.info} fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div>
                  <h4 className="text-sm text-gray-400 mb-3 text-center">Storage Distribution</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={storageData} cx="50%" cy="50%" labelLine={false}
                           outerRadius={60} fill="#8884d8" dataKey="value">
                        {storageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </HoloCard>

            {/* Terminal Interface */}
            <HoloCard title="Command Terminal" icon={CommandLineIcon}>
              <AdvancedTerminal />
            </HoloCard>

            {/* Network Topology */}
            <HoloCard title="Network Topology" icon={GlobeAsiaAustraliaIcon}>
              <NetworkTopology />
            </HoloCard>
          </div>

          {/* Right Panel - AI & Predictions */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* AI Status */}
            <HoloCard title="AI Neural Engine" icon={SparklesIcon}>
              <div className="space-y-4">
                {/* AI Brain Visualization */}
                <div className="relative h-32 bg-black/30 rounded-lg overflow-hidden">
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="w-24 h-24 rounded-full border-2 border-cyan-400/30" />
                    <div className="absolute w-16 h-16 rounded-full border-2 border-purple-400/30" />
                    <div className="absolute w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400" />
                  </motion.div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-white font-bold">{storeData.aiStatus.toUpperCase()}</p>
                  </div>
                </div>

                {/* AI Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Accuracy', value: '96.5%' },
                    { label: 'Precision', value: '94.2%' },
                    { label: 'F1 Score', value: '95.3%' },
                    { label: 'Data Points', value: '1.2M' }
                  ].map((metric, idx) => (
                    <div key={idx} className="bg-black/30 rounded-lg p-3">
                      <p className="text-xs text-gray-400">{metric.label}</p>
                      <p className="text-lg font-bold text-cyan-400">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </HoloCard>

            {/* Predictions */}
            <HoloCard title="ML Predictions" icon={BoltIcon}>
              <div className="space-y-3">
                {Object.values(storeData.predictions).slice(0, 5).map((pred: any, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-3 bg-black/30 rounded-lg border border-white/5"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white">{pred.name || 'Prediction'}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        pred.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                        pred.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {pred.severity || 'low'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Probability</span>
                      <span className="text-sm text-cyan-400">
                        {((pred.probability || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </motion.div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <SparklesIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No predictions available</p>
                  </div>
                )}
              </div>
            </HoloCard>

            {/* Real-time Alerts */}
            <HoloCard title="Live Alerts Feed" icon={BellIcon}>
              <AlertsFeed />
            </HoloCard>

            {/* Quick Actions */}
            <HoloCard title="Quick Actions" icon={BoltIcon}>
              <div className="space-y-2">
                {[
                  { label: 'Run Full Analysis', icon: ChartBarIcon, color: 'cyan' },
                  { label: 'Generate Report', icon: CloudArrowUpIcon, color: 'purple' },
                  { label: 'System Health Check', icon: ShieldCheckIcon, color: 'green' },
                  { label: 'Update Models', icon: ArrowTrendingUpIcon, color: 'blue' }
                ].map((action, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-3 bg-${action.color}-500/10 border border-${action.color}-500/30
                               rounded-lg flex items-center justify-between text-${action.color}-400
                               hover:bg-${action.color}-500/20 transition-all`}
                  >
                    <span className="flex items-center gap-2">
                      <action.icon className="w-4 h-4" />
                      {action.label}
                    </span>
                    <ArrowTrendingUpIcon className="w-4 h-4" />
                  </motion.button>
                ))}
              </div>
            </HoloCard>
          </div>
        </div>
      </div>
    </div>
  );
}