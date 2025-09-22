'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
   Area,
   AreaChart,
   CartesianGrid,
   Cell,
   Line,
   LineChart,
   Pie,
   PieChart,
   PolarAngleAxis,
   PolarGrid,
   PolarRadiusAxis,
   Radar,
   RadarChart,
   RadialBar,
   RadialBarChart,
   ResponsiveContainer,
   Tooltip,
   XAxis,
   YAxis,
} from 'recharts';
import {
   ArrowTrendingUpIcon,
   BellIcon,
   BoltIcon,
   ChartBarIcon,
   CloudArrowUpIcon,
   CommandLineIcon,
   CpuChipIcon,
   ExclamationTriangleIcon,
   EyeIcon,
   FireIcon,
   GlobeAsiaAustraliaIcon,
   RocketLaunchIcon,
   ServerStackIcon,
   ShieldCheckIcon,
   SignalIcon,
   SparklesIcon,
} from '@heroicons/react/24/outline';
import { useClusterStore } from '@/stores/cluster';
import { useAnomalyStore } from '@/stores/anomaly';
import { usePredictionStore } from '@/stores/prediction';
import { useRealtimeStore } from '@/stores/realtimeData';
import HolographicDataGrid from '@/components/ui/HolographicDataGrid';
import NeuralNetworkConnections from '@/components/ui/NeuralNetworkConnections';

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(168, 85, 247, 0.3);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(168, 85, 247, 0.5);
  }
`;

// Enhanced Cyberpunk color palette
const COLORS = {
   primary: '#00D4FF',
   secondary: '#7C3AED',
   success: '#10B981',
   warning: '#F59E0B',
   danger: '#EF4444',
   info: '#06B6D4',
   pink: '#EC4899',
   indigo: '#6366F1',
   teal: '#14B8A6',
   lime: '#84CC16',
   fuchsia: '#D946EF',
   cyan: '#22D3EE',
   emerald: '#10B981',
   violet: '#8B5CF6',
   amber: '#F59E0B',
   rose: '#F43F5E',
   dark: '#0F172A',
   light: '#F1F5F9',
};

const GRADIENT_COLORS = [
   ['#667eea', '#764ba2'],
   ['#f093fb', '#f5576c'],
   ['#4facfe', '#00f2fe'],
   ['#43e97b', '#38f9d7'],
   ['#fa709a', '#fee140'],
   ['#30cfd0', '#330867'],
   ['#a8edea', '#fed6e3'],
   ['#ff9a9e', '#fecfef'],
   ['#fbc2eb', '#a6c1ee'],
   ['#fdcbf1', '#e6dee9'],
];

// Enhanced Particles Background with more particles and connections
function ParticlesBackground() {
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const animationIdRef = useRef<number | null>(null);
   const particlesRef = useRef<any[]>([]);

   useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particleColors = [COLORS.primary, COLORS.cyan, COLORS.violet, COLORS.pink, COLORS.emerald];

      // Significantly increased particle count
      const PARTICLE_COUNT = 200; // Increased from 100

      // Create particles only once
      if (particlesRef.current.length === 0) {
         for (let i = 0; i < PARTICLE_COUNT; i++) {
            particlesRef.current.push({
               x: Math.random() * canvas.width,
               y: Math.random() * canvas.height,
               vx: (Math.random() - 0.5) * 0.8, // Slightly faster movement
               vy: (Math.random() - 0.5) * 0.8,
               size: Math.random() * 4 + 1, // Larger particles (1-5px)
               color: particleColors[Math.floor(Math.random() * particleColors.length)],
               opacity: Math.random() * 0.8 + 0.3, // More visible (0.3-1.1)
               pulseSpeed: Math.random() * 0.05 + 0.01, // Individual pulse speed
               pulsePhase: Math.random() * Math.PI * 2, // Random pulse phase
            });
         }
      }

      let frameCount = 0;
      let time = 0;

      function animate() {
         if (!ctx || !canvas) return;

         frameCount++;
         time += 0.016; // ~60fps

         // Clear canvas
         ctx.clearRect(0, 0, canvas.width, canvas.height);

         // Enhanced connection system - check more particles for connections
         particlesRef.current.forEach((particle, i) => {
            // Check connections for more particles, but with distance optimization
            if (i % 2 === 0) {
               // Every other particle for performance
               particlesRef.current.slice(i + 1).forEach(other => {
                  const dx = particle.x - other.x;
                  const dy = particle.y - other.y;
                  const distance = Math.sqrt(dx * dx + dy * dy);

                  // Increased connection distance and better visuals
                  if (distance < 120) {
                     const alpha = (1 - distance / 120) * 0.25;
                     const gradient = ctx.createLinearGradient(particle.x, particle.y, other.x, other.y);
                     gradient.addColorStop(
                        0,
                        particle.color +
                           Math.floor(alpha * 255)
                              .toString(16)
                              .padStart(2, '0'),
                     );
                     gradient.addColorStop(
                        1,
                        other.color +
                           Math.floor(alpha * 255)
                              .toString(16)
                              .padStart(2, '0'),
                     );

                     ctx.strokeStyle = gradient;
                     ctx.lineWidth = 0.8 + (1 - distance / 120) * 1.2; // Variable line width
                     ctx.globalAlpha = alpha;
                     ctx.beginPath();
                     ctx.moveTo(particle.x, particle.y);
                     ctx.lineTo(other.x, other.y);
                     ctx.stroke();
                  }
               });
            }
         });

         // Enhanced particle rendering with pulsing effects
         particlesRef.current.forEach((particle, i) => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Wrap around edges
            if (particle.x < 0) particle.x = canvas.width;
            if (particle.x > canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = canvas.height;
            if (particle.y > canvas.height) particle.y = 0;

            // Update pulse phase
            particle.pulsePhase += particle.pulseSpeed;
            const pulseMultiplier = 1 + Math.sin(particle.pulsePhase) * 0.3;

            // Enhanced glow effect with multiple layers
            const currentSize = particle.size * pulseMultiplier;
            const currentOpacity = particle.opacity * (0.8 + Math.sin(particle.pulsePhase) * 0.2);

            // Outer glow
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = currentOpacity * 0.1;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, currentSize * 4, 0, Math.PI * 2);
            ctx.fill();

            // Middle glow
            ctx.globalAlpha = currentOpacity * 0.3;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, currentSize * 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Inner glow
            ctx.globalAlpha = currentOpacity * 0.5;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, currentSize * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Core particle
            ctx.globalAlpha = currentOpacity;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
            ctx.fill();

            // Add sparkle effect for some particles
            if (i % 10 === 0 && Math.sin(particle.pulsePhase) > 0.8) {
               ctx.fillStyle = '#ffffff';
               ctx.globalAlpha = 0.8;
               ctx.beginPath();
               ctx.arc(particle.x, particle.y, currentSize * 0.5, 0, Math.PI * 2);
               ctx.fill();
            }
         });

         ctx.globalAlpha = 1;

         animationIdRef.current = requestAnimationFrame(animate);
      }

      animate();

      const handleResize = () => {
         canvas.width = window.innerWidth;
         canvas.height = window.innerHeight;
         // Redistribute particles on resize
         particlesRef.current.forEach(particle => {
            if (particle.x > canvas.width) particle.x = Math.random() * canvas.width;
            if (particle.y > canvas.height) particle.y = Math.random() * canvas.height;
         });
      };

      window.addEventListener('resize', handleResize);

      return () => {
         if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
         }
         window.removeEventListener('resize', handleResize);
         // Clear particles on unmount
         particlesRef.current = [];
      };
   }, []);

   return <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-85 pointer-events-none" style={{ background: 'transparent' }} />;
}

// Static background grid - removed animation for performance
function CyberpunkGrid() {
   return (
      <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none">
         <div
            className="absolute inset-0"
            style={{
               backgroundImage: `linear-gradient(${COLORS.primary}20 1px, transparent 1px),
                           linear-gradient(90deg, ${COLORS.primary}20 1px, transparent 1px)`,
               backgroundSize: '50px 50px',
            }}
         />
      </div>
   );
}

// 3D Card Component with glassmorphism and holographic effect
function HoloCard({ children, title, icon: Icon, color = 'primary', className = '', gradient = 0 }: any) {
   const gradientColors = GRADIENT_COLORS[gradient % GRADIENT_COLORS.length];

   return (
      <motion.div
         className={`relative group ${className}`}
         whileHover={{
            boxShadow: `0 20px 60px -15px ${gradientColors[0]}80, 0 10px 40px -10px ${gradientColors[1]}60`,
         }}
         transition={{ duration: 0.3 }}
         style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
      >
         {/* Dynamic gradient glow */}
         <div
            className="absolute inset-0 rounded-2xl opacity-50 group-hover:opacity-80 transition-all duration-500"
            style={{
               background: `linear-gradient(135deg, ${gradientColors[0]}40, ${gradientColors[1]}40)`,
               filter: 'blur(20px)',
            }}
         />

         {/* Enhanced Glassmorphism card with higher transparency */}
         <div
            className="relative rounded-2xl border overflow-hidden"
            style={{
               background: 'rgba(15, 23, 42, 0.15)', // Reduced from 0.4 to 0.15 for more transparency
               backdropFilter: 'blur(15px) saturate(180%)', // Slightly reduced blur
               borderColor: 'rgba(255, 255, 255, 0.2)', // Slightly more visible border
               boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)', // Reduced shadow opacity
            }}
         >
            {/* Holographic shimmer */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
               <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                          -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%]
                          transition-transform duration-1000 pointer-events-none"
               />
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
            <div className="p-6">{children}</div>
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
      'status',
      'health',
      'predict',
      'analyze',
      'metrics',
      'clear',
      'ai-train',
      'ai-eval',
      'scan',
      'optimize',
      'report',
      'export',
      'monitor',
      'benchmark',
      'diagnose',
      'recover',
   ];

   const handleCommand = async (cmd: string) => {
      setIsProcessing(true);
      const newCommand = {
         id: Date.now(),
         input: cmd,
         output: await processCommand(cmd),
         timestamp: new Date(),
         type: getCommandType(cmd),
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

      if (lower === 'help') {
         return `🤖 Neural Terminal v2.0 - Available Commands:

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
      }

      if (lower === 'clear') {
         setCommands([]);
         return '';
      }

      if (lower === 'status') {
         return `🟢 Cluster Status: HEALTHY
├─ OSDs: 12/12 UP (100% operational)
├─ MONs: 3/3 Active (Quorum established)
├─ MDSs: 2/2 Active (Metadata services running)
├─ PGs: 512 active+clean
├─ Usage: 35.2 TiB / 100 TiB (35.2%)
└─ Client connections: 42 active`;
      }

      if (lower === 'health') {
         return `🩺 Health Check Report:
✅ Overall Status: HEALTH_OK
├─ No critical issues detected
├─ 2 warnings (non-critical)
├─ Last scrub: 2 hours ago
├─ Recovery rate: 100 MB/s
└─ Rebalancing: Not required`;
      }

      if (lower === 'predict') {
         return `🔮 AI Prediction Analysis:
├─ Model: DeepCeph-v3.2 (accuracy: 96.5%)
├─ Processing 1.2M data points...
├─ Risk Score: 12.5% (Low)
├─ Next 24h forecast:
│  ├─ 08:00 - Normal operations expected
│  ├─ 14:00 - Slight load increase (15%)
│  └─ 20:00 - Maintenance window recommended
├─ Failure probability: 0.3%
└─ Confidence interval: 94.2%`;
      }

      if (lower === 'analyze') {
         return `🔍 Deep Anomaly Analysis:
├─ Scanning last 7 days of metrics...
├─ Patterns analyzed: 15,420
├─ Anomalies detected: 3
│  ├─ [WARNING] Unusual IOPS spike at 2024-01-15 03:42
│  ├─ [INFO] Temporary network latency at 2024-01-14 15:23
│  └─ [INFO] Cache miss rate elevated at 2024-01-13 09:15
├─ Root cause analysis: Complete
└─ Recommendations: Enable auto-scaling for peak hours`;
      }

      if (lower === 'ai-train') {
         return `🧠 AI Model Training:
├─ Loading dataset: 5.2 GB
├─ Training epochs: 100/100
├─ Loss: 0.0234 (converged)
├─ Validation accuracy: 97.2%
├─ Model saved: models/DeepCeph-v3.3
└─ Training time: 4m 23s`;
      }

      if (lower === 'ai-eval') {
         return `📊 Model Performance Evaluation:
├─ Test set size: 50,000 samples
├─ Accuracy: 96.5%
├─ Precision: 94.2%
├─ Recall: 97.8%
├─ F1 Score: 95.96%
├─ AUC-ROC: 0.982
└─ Performance: Excellent`;
      }

      if (lower === 'scan') {
         return `🔐 Security Scan:
├─ Scanning 12 nodes...
├─ Vulnerabilities: 0 critical, 1 medium, 3 low
├─ Configuration: Optimal
├─ Certificates: Valid (expires in 287 days)
└─ Compliance: 100% (ISO 27001, SOC 2)`;
      }

      if (lower === 'optimize') {
         return `⚡ Performance Optimization:
├─ Analyzing current configuration...
├─ Optimizations applied:
│  ├─ Cache size increased to 8 GB
│  ├─ Thread pool adjusted to 128
│  ├─ Network buffers optimized
│  └─ PG autoscaling enabled
├─ Performance gain: +23%
└─ Status: Optimization complete`;
      }

      if (lower === 'monitor') {
         return `📡 Continuous Monitoring Mode:
├─ Real-time metrics streaming enabled
├─ Alert threshold: Critical only
├─ Update interval: 1 second
├─ Dashboards: 4 active
└─ Press Ctrl+C to stop monitoring`;
      }

      if (lower === 'benchmark') {
         return `🏁 Performance Benchmark:
├─ Sequential Read: 3.2 GB/s
├─ Sequential Write: 2.8 GB/s
├─ Random Read IOPS: 125,000
├─ Random Write IOPS: 98,000
├─ Latency (avg): 0.8 ms
├─ Latency (p99): 2.1 ms
└─ Score: 9,542 (Excellent)`;
      }

      if (lower === 'report') {
         return `📄 Report Generation:
├─ Collecting metrics...
├─ Analyzing trends...
├─ Generating visualizations...
├─ Report created: reports/cluster_2024_01_15.pdf
└─ Size: 2.4 MB`;
      }

      return `⚡ Command executed: ${cmd}\n└─ Processing complete in ${(Math.random() * 1000).toFixed(0)}ms`;
   };

   useEffect(() => {
      if (terminalRef.current) {
         terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
   }, [commands]);

   useEffect(() => {
      if (currentCommand) {
         const matches = availableCommands.filter(cmd => cmd.startsWith(currentCommand.toLowerCase()));
         setAutocomplete(matches);
      } else {
         setAutocomplete([]);
      }
   }, [currentCommand]);

   return (
      <div className="min-h-[465px] h-full flex flex-col bg-black/60 rounded-lg border border-cyan-500/30 font-mono text-sm">
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
               <motion.div key={cmd.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
                  <div className="flex items-center gap-2">
                     <span className="text-green-400">❯</span>
                     <span
                        className={`font-mono ${
                           cmd.type === 'ai'
                              ? 'text-purple-400'
                              : cmd.type === 'ml'
                                ? 'text-blue-400'
                                : cmd.type === 'monitor'
                                  ? 'text-green-400'
                                  : 'text-white'
                        }`}
                     >
                        {cmd.input}
                     </span>
                     <span className="text-gray-600 text-xs ml-auto">{cmd.timestamp.toLocaleTimeString()}</span>
                  </div>
                  {cmd.output && <div className="pl-4 text-cyan-300 whitespace-pre-wrap font-mono text-sm">{cmd.output}</div>}
               </motion.div>
            ))}

            {isProcessing && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-yellow-400">
                  <span className="text-green-400">❯</span>
                  <span>Processing...</span>
                  <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                     _
                  </motion.span>
               </motion.div>
            )}
         </div>

         <div className="relative">
            {autocomplete.length > 0 && (
               <div className="absolute bottom-full left-0 right-0 bg-slate-900/95 border border-cyan-500/30 rounded-t-lg">
                  {autocomplete.map((cmd, idx) => (
                     <div key={idx} className="px-4 py-2 text-cyan-300 hover:bg-cyan-500/20 cursor-pointer" onClick={() => setCurrentCommand(cmd)}>
                        {cmd}
                     </div>
                  ))}
               </div>
            )}
            <form
               onSubmit={e => {
                  e.preventDefault();
                  if (!isProcessing) void handleCommand(currentCommand);
               }}
               className="px-4 py-3 border-t border-cyan-500/30 flex items-center gap-2"
            >
               <span className="text-green-400">❯</span>
               <input
                  type="text"
                  value={currentCommand}
                  onChange={e => setCurrentCommand(e.target.value)}
                  onKeyDown={e => {
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
      const interval = setInterval(
         () => {
            const alertTypes = ['info', 'success', 'warning', 'error'];
            const messages = [
               'OSD performance metrics updated',
               'Prediction model accuracy improved to 97%',
               'Network latency spike detected',
               'Automatic rebalancing initiated',
               'Cache hit ratio optimized',
               'New anomaly pattern detected',
               'Health check completed successfully',
               'Backup verification passed',
            ];

            const newAlert = {
               id: Date.now(),
               type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
               message: messages[Math.floor(Math.random() * messages.length)],
               time: new Date(),
            };

            setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
         },
         10000 + Math.random() * 20000,
      );

      return () => clearInterval(interval);
   }, []);

   const getAlertIcon = (type: string) => {
      switch (type) {
         case 'error':
            return '🚨';
         case 'warning':
            return '⚠️';
         case 'success':
            return '✅';
         default:
            return 'ℹ️';
      }
   };

   const getAlertColor = (type: string) => {
      switch (type) {
         case 'error':
            return 'text-red-400 border-red-500/30';
         case 'warning':
            return 'text-yellow-400 border-yellow-500/30';
         case 'success':
            return 'text-green-400 border-green-500/30';
         default:
            return 'text-blue-400 border-blue-500/30';
      }
   };

   return (
      <div
         className="space-y-2 h-[320px] overflow-y-auto custom-scrollbar pr-2"
         style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#a855f7 transparent',
         }}
      >
         <AnimatePresence>
            {alerts.map(alert => (
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
                        <p className="text-xs text-gray-500 mt-1">{alert.time.toLocaleTimeString()}</p>
                     </div>
                  </div>
               </motion.div>
            ))}
         </AnimatePresence>
      </div>
   );
}

// Enhanced Network Topology Visualizer with Canvas-based Animation
function NetworkTopology() {
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const animationIdRef = useRef<number | null>(null);
   const nodesRef = useRef<any[]>([]);
   const connectionsRef = useRef<any[]>([]);
   const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
   const [hoveredNode, setHoveredNode] = useState<string | null>(null);
   const [selectedNode, setSelectedNode] = useState<string | null>(null);

   useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const updateDimensions = () => {
         const container = canvas.parentElement;
         if (container) {
            const rect = container.getBoundingClientRect();
            setDimensions({ width: rect.width, height: Math.max(600, rect.height) });
         }
      };

      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
   }, []);

   useEffect(() => {
      // Generate enhanced network topology with more nodes and dynamic positioning
      const generateTopology = () => {
         const { width, height } = dimensions;
         const centerX = width / 2;
         const centerY = height / 2;

         // Core MON cluster in triangle formation (center)
         const monNodes = [
            {
               id: 'mon-1',
               type: 'MON',
               x: centerX,
               y: centerY - 60,
               status: 'healthy',
               tier: 'core',
               radius: 25,
               color: COLORS.violet,
               pulse: true,
               activity: 0.9,
               connections: [],
               load: Math.random() * 100,
            },
            {
               id: 'mon-2',
               type: 'MON',
               x: centerX - 52,
               y: centerY + 30,
               status: 'healthy',
               tier: 'core',
               radius: 25,
               color: COLORS.violet,
               pulse: true,
               activity: 0.85,
               connections: [],
               load: Math.random() * 100,
            },
            {
               id: 'mon-3',
               type: 'MON',
               x: centerX + 52,
               y: centerY + 30,
               status: 'healthy',
               tier: 'core',
               radius: 25,
               color: COLORS.violet,
               pulse: true,
               activity: 0.88,
               connections: [],
               load: Math.random() * 100,
            },
         ];

         // OSD nodes in multiple rings
         const osdNodes: any[] = [];
         const osdCount = 12;
         const innerRadius = 120;
         const outerRadius = 180;

         for (let i = 0; i < osdCount; i++) {
            const angle = (i / osdCount) * Math.PI * 2;
            const radius = i % 2 === 0 ? innerRadius : outerRadius;
            const nodeRadius = 18 + Math.random() * 8;
            osdNodes.push({
               id: `osd-${i}`,
               type: 'OSD',
               x: centerX + Math.cos(angle) * radius,
               y: centerY + Math.sin(angle) * radius,
               status: Math.random() > 0.9 ? 'warning' : Math.random() > 0.98 ? 'error' : 'healthy',
               tier: 'storage',
               radius: nodeRadius,
               color: COLORS.cyan,
               pulse: Math.random() > 0.7,
               activity: Math.random() * 0.8 + 0.2,
               connections: [],
               capacity: Math.floor(Math.random() * 100),
               load: Math.random() * 100,
               iops: Math.floor(Math.random() * 10000),
            });
         }

         // MDS nodes (metadata servers)
         const mdsNodes = [
            {
               id: 'mds-1',
               type: 'MDS',
               x: centerX - 200,
               y: centerY - 80,
               status: 'healthy',
               tier: 'service',
               radius: 20,
               color: COLORS.emerald,
               pulse: true,
               activity: 0.7,
               connections: [],
               load: Math.random() * 100,
            },
            {
               id: 'mds-2',
               type: 'MDS',
               x: centerX + 200,
               y: centerY - 80,
               status: 'healthy',
               tier: 'service',
               radius: 20,
               color: COLORS.emerald,
               pulse: false,
               activity: 0.6,
               connections: [],
               load: Math.random() * 100,
            },
         ];

         // RGW nodes (RADOS gateways)
         const rgwNodes = [
            {
               id: 'rgw-1',
               type: 'RGW',
               x: centerX - 200,
               y: centerY + 80,
               status: 'healthy',
               tier: 'gateway',
               radius: 20,
               color: COLORS.pink,
               pulse: true,
               activity: 0.8,
               connections: [],
               load: Math.random() * 100,
            },
            {
               id: 'rgw-2',
               type: 'RGW',
               x: centerX + 200,
               y: centerY + 80,
               status: 'healthy',
               tier: 'gateway',
               radius: 20,
               color: COLORS.pink,
               pulse: false,
               activity: 0.65,
               connections: [],
               load: Math.random() * 100,
            },
         ];

         // MGR nodes (managers)
         const mgrNodes = [
            {
               id: 'mgr-1',
               type: 'MGR',
               x: centerX,
               y: centerY - 140,
               status: 'healthy',
               tier: 'management',
               radius: 18,
               color: COLORS.amber,
               pulse: true,
               activity: 0.75,
               connections: [],
               load: Math.random() * 100,
            },
         ];

         const allNodes = [...monNodes, ...osdNodes, ...mdsNodes, ...rgwNodes, ...mgrNodes];

         // Create enhanced connection topology
         allNodes.forEach(node => {
            node.connections = [];

            if (node.type === 'OSD') {
               // OSDs connect to all MONs and MGR
               monNodes.forEach(mon => node.connections.push(mon.id));
               mgrNodes.forEach(mgr => node.connections.push(mgr.id));
            } else if (node.type === 'MDS') {
               // MDS connects to MONs and some OSDs
               monNodes.forEach(mon => node.connections.push(mon.id));
               osdNodes.slice(0, 3).forEach(osd => node.connections.push(osd.id));
            } else if (node.type === 'RGW') {
               // RGW connects to MONs and OSDs
               monNodes.forEach(mon => node.connections.push(mon.id));
               osdNodes.slice(0, 4).forEach(osd => node.connections.push(osd.id));
            } else if (node.type === 'MON') {
               // MONs connect to each other and MGR
               monNodes.forEach(mon => {
                  if (mon.id !== node.id) node.connections.push(mon.id);
               });
               mgrNodes.forEach(mgr => node.connections.push(mgr.id));
            } else if (node.type === 'MGR') {
               // MGR connects to MONs
               monNodes.forEach(mon => node.connections.push(mon.id));
            }
         });

         // Generate connection objects with enhanced data
         const newConnections: any[] = [];
         allNodes.forEach(node => {
            node.connections.forEach((targetId: string) => {
               const target = allNodes.find(n => n.id === targetId);
               if (target) {
                  newConnections.push({
                     from: node.id,
                     to: targetId,
                     activity: Math.random() * 0.6 + 0.3,
                     bandwidth: Math.random() * 1000 + 100,
                     latency: Math.random() * 10 + 1,
                     type: getConnectionType(node.type, target.type),
                  });
               }
            });
         });

         nodesRef.current = allNodes;
         connectionsRef.current = newConnections;
      };

      generateTopology();
      const interval = setInterval(generateTopology, 30000);
      return () => clearInterval(interval);
   }, [dimensions]);

   const getConnectionType = (fromType: string, toType: string) => {
      if (fromType === 'MGR' || toType === 'MGR') return 'management';
      if (fromType === 'MDS' || toType === 'MDS') return 'metadata';
      if (fromType === 'RGW' || toType === 'RGW') return 'gateway';
      if (fromType === 'MON' && toType === 'MON') return 'cluster';
      return 'storage';
   };

   const getConnectionColor = (type: string, activity: number) => {
      const alpha = 0.3 + activity * 0.7;
      switch (type) {
         case 'management':
            return `rgba(245, 158, 11, ${alpha})`;
         case 'metadata':
            return `rgba(16, 185, 129, ${alpha})`;
         case 'gateway':
            return `rgba(236, 72, 153, ${alpha})`;
         case 'cluster':
            return `rgba(124, 58, 237, ${alpha})`;
         default:
            return `rgba(34, 211, 238, ${alpha})`;
      }
   };

   // Enhanced canvas animation
   useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      let time = 0;

      const animate = () => {
         time += 0.015;
         ctx.clearRect(0, 0, dimensions.width, dimensions.height);

         // Draw enhanced connections with data flow animation
         connectionsRef.current.forEach((connection, i) => {
            const fromNode = nodesRef.current.find(n => n.id === connection.from);
            const toNode = nodesRef.current.find(n => n.id === connection.to);

            if (!fromNode || !toNode) return;

            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;

            // Dynamic activity with pulsing
            const pulseOffset = Math.sin(time * 3 + i * 0.8) * 0.4 + 0.6;
            const activity = connection.activity * pulseOffset;

            // Enhanced connection line with gradient
            const gradient = ctx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y);
            gradient.addColorStop(0, getConnectionColor(connection.type, activity));
            gradient.addColorStop(0.5, getConnectionColor(connection.type, activity * 0.5));
            gradient.addColorStop(1, getConnectionColor(connection.type, activity));

            ctx.beginPath();
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(toNode.x, toNode.y);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2 + activity * 4;
            ctx.stroke();

            // Multiple data packets for high activity connections
            const packetCount = Math.floor(activity * 3) + 1;
            for (let p = 0; p < packetCount; p++) {
               const packetProgress = (time * 0.8 + i * 0.4 + p * 0.3) % 1;
               const packetX = fromNode.x + dx * packetProgress;
               const packetY = fromNode.y + dy * packetProgress;

               // Data packet with enhanced visuals
               ctx.beginPath();
               ctx.arc(packetX, packetY, 4 + activity * 3, 0, Math.PI * 2);
               ctx.fillStyle = getConnectionColor(connection.type, 1);
               ctx.fill();

               // Packet glow effect
               ctx.beginPath();
               ctx.arc(packetX, packetY, 8 + activity * 6, 0, Math.PI * 2);
               ctx.fillStyle = getConnectionColor(connection.type, 0.2);
               ctx.fill();
            }
         });

         // Draw enhanced nodes with multiple visual layers
         nodesRef.current.forEach((node, i) => {
            const pulseScale = node.pulse ? 1 + Math.sin(time * 4 + i * 0.7) * 0.3 : 1;
            const currentRadius = node.radius * pulseScale;

            // Node status effects
            const isHighlighted = node.id === selectedNode || node.id === hoveredNode;
            const statusColor = node.status === 'error' ? COLORS.danger : node.status === 'warning' ? COLORS.warning : node.color;

            // Multiple glow layers for depth
            for (let layer = 3; layer >= 1; layer--) {
               ctx.beginPath();
               ctx.arc(node.x, node.y, currentRadius * (1 + layer * 0.8), 0, Math.PI * 2);
               ctx.fillStyle = `${statusColor}${Math.floor(30 / layer)
                  .toString(16)
                  .padStart(2, '0')}`;
               ctx.fill();
            }

            // Main node with gradient
            const nodeGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, currentRadius);
            nodeGradient.addColorStop(0, statusColor);
            nodeGradient.addColorStop(0.7, statusColor + '80');
            nodeGradient.addColorStop(1, statusColor + '20');

            ctx.beginPath();
            ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = nodeGradient;
            ctx.fill();

            // Inner core with activity indicator
            ctx.beginPath();
            ctx.arc(node.x, node.y, currentRadius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = statusColor + 'CC';
            ctx.fill();

            // Activity ring
            const activityAngle = node.activity * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(node.x, node.y, currentRadius + 8, -Math.PI / 2, -Math.PI / 2 + activityAngle);
            ctx.strokeStyle = statusColor;
            ctx.lineWidth = 4;
            ctx.stroke();

            // Load indicator bar for OSDs
            if (node.type === 'OSD') {
               const barWidth = 40;
               const barHeight = 6;
               const barX = node.x - barWidth / 2;
               const barY = node.y + currentRadius + 15;

               // Background bar
               ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
               ctx.fillRect(barX, barY, barWidth, barHeight);

               // Load bar
               const loadWidth = (node.load / 100) * barWidth;
               ctx.fillStyle = node.load > 80 ? COLORS.danger : node.load > 60 ? COLORS.warning : COLORS.success;
               ctx.fillRect(barX, barY, loadWidth, barHeight);
            }

            // Enhanced highlight for selected/hovered nodes
            if (isHighlighted) {
               ctx.beginPath();
               ctx.arc(node.x, node.y, currentRadius + 12, 0, Math.PI * 2);
               ctx.strokeStyle = '#ffffff';
               ctx.lineWidth = 3;
               ctx.stroke();

               // Rotating highlight ring
               ctx.beginPath();
               ctx.arc(node.x, node.y, currentRadius + 18, 0, Math.PI * 2);
               ctx.strokeStyle = '#ffffff40';
               ctx.lineWidth = 2;
               ctx.setLineDash([10, 10]);
               ctx.lineDashOffset = time * 50;
               ctx.stroke();
               ctx.setLineDash([]);
            }

            // Node type text with enhanced styling
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(node.type, node.x, node.y + 5);
            ctx.fillText(node.type, node.x, node.y + 5);

            // Node ID
            ctx.fillStyle = '#ffffffCC';
            ctx.font = '10px monospace';
            ctx.fillText(node.id.split('-')[1] || '', node.x, node.y + 20);
         });

         animationIdRef.current = requestAnimationFrame(animate);
      };

      animate();

      return () => {
         if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
         }
      };
   }, [dimensions, selectedNode, hoveredNode]);

   // Enhanced mouse interactions
   const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const clickedNode = nodesRef.current.find(node => {
         const dx = x - node.x;
         const dy = y - node.y;
         const distance = Math.sqrt(dx * dx + dy * dy);
         return distance <= node.radius;
      });

      setSelectedNode(clickedNode ? clickedNode.id : null);
   };

   const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const hoveredNode = nodesRef.current.find(node => {
         const dx = x - node.x;
         const dy = y - node.y;
         const distance = Math.sqrt(dx * dx + dy * dy);
         return distance <= node.radius;
      });

      setHoveredNode(hoveredNode ? hoveredNode.id : null);
      canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
   };

   const selectedNodeData = selectedNode ? nodesRef.current.find(n => n.id === selectedNode) : null;

   return (
      <div className="relative min-h-[600px] h-full bg-gradient-to-br from-black/60 via-purple-900/20 to-black/60 rounded-lg overflow-hidden">
         {/* Enhanced animated background */}
         <div className="absolute inset-0 opacity-40">
            <motion.div
               className="absolute inset-0"
               style={{
                  background: `conic-gradient(from 0deg, ${COLORS.violet}20, ${COLORS.cyan}20, ${COLORS.pink}20, ${COLORS.violet}20)`,
               }}
               animate={{ rotate: 360 }}
               transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />
         </div>

         <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            className="absolute inset-0 w-full h-full"
            style={{ background: 'transparent' }}
         />

         {/* Enhanced node information overlay */}
         {selectedNodeData && (
            <motion.div
               initial={{ opacity: 0, scale: 0.8, x: 20 }}
               animate={{ opacity: 1, scale: 1, x: 0 }}
               className="absolute top-4 right-4 p-4 bg-slate-900/95 backdrop-blur-md
                          border border-cyan-400/50 rounded-xl text-cyan-300 min-w-[200px]"
            >
               <h3 className="font-bold text-lg mb-3 text-white">{selectedNodeData.id.replace('-', ' ').toUpperCase()}</h3>
               <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                     <span className="text-gray-400">Type:</span>
                     <span className="font-mono">{selectedNodeData.type}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-gray-400">Status:</span>
                     <span
                        className={`font-mono ${
                           selectedNodeData.status === 'healthy' ? 'text-green-400' : selectedNodeData.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                        }`}
                     >
                        {selectedNodeData.status.toUpperCase()}
                     </span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-gray-400">Activity:</span>
                     <span className="font-mono">{(selectedNodeData.activity * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-gray-400">Load:</span>
                     <span className="font-mono">{selectedNodeData.load?.toFixed(1)}%</span>
                  </div>
                  {selectedNodeData.type === 'OSD' && (
                     <>
                        <div className="flex justify-between">
                           <span className="text-gray-400">Capacity:</span>
                           <span className="font-mono">{selectedNodeData.capacity}%</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-gray-400">IOPS:</span>
                           <span className="font-mono">{selectedNodeData.iops?.toLocaleString()}</span>
                        </div>
                     </>
                  )}
                  <div className="flex justify-between">
                     <span className="text-gray-400">Connections:</span>
                     <span className="font-mono">{selectedNodeData.connections?.length || 0}</span>
                  </div>
               </div>
            </motion.div>
         )}

         {/* Enhanced legend */}
         <div
            className="absolute bottom-4 left-4 p-4 bg-slate-900/95 backdrop-blur-md
                        border border-purple-400/50 rounded-xl"
         >
            <h4 className="text-purple-300 font-bold mb-3">Cluster Topology</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
               {[
                  { type: 'MON', color: COLORS.violet, desc: 'Monitor' },
                  { type: 'OSD', color: COLORS.cyan, desc: 'Storage' },
                  { type: 'MDS', color: COLORS.emerald, desc: 'Metadata' },
                  { type: 'RGW', color: COLORS.pink, desc: 'Gateway' },
                  { type: 'MGR', color: COLORS.amber, desc: 'Manager' },
               ].map(item => (
                  <div key={item.type} className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full" style={{ background: item.color }}></div>
                     <span className="text-slate-300">{item.type}</span>
                  </div>
               ))}
            </div>
         </div>

         {/* Enhanced status indicator */}
         <div className="absolute bottom-4 right-4 flex items-center gap-3">
            <div className="flex items-center gap-2">
               <motion.div
                  className="w-3 h-3 rounded-full bg-green-400"
                  animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
               />
               <span className="text-green-400 text-sm font-mono">LIVE TOPOLOGY</span>
            </div>
            <div className="text-xs text-gray-400 font-mono">
               {nodesRef.current.length} nodes • {connectionsRef.current.length} connections
            </div>
         </div>
      </div>
   );
}

// Removed FloatingOrbs for better performance
function FloatingOrbs() {
   // Disabled for performance
   return null;
}

// Animated Progress Ring
function ProgressRing({ value, max, color, size = 60, strokeWidth = 4 }: any) {
   const radius = (size - strokeWidth) / 2;
   const circumference = radius * 2 * Math.PI;
   const offset = circumference - (value / max) * circumference;

   return (
      <svg width={size} height={size} className="transform -rotate-90">
         <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} fill="none" />
         <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            strokeDasharray={circumference}
            strokeLinecap="round"
         />
      </svg>
   );
}

// Animated Counter
function AnimatedCounter({ value, suffix = '', prefix = '', color = COLORS.primary }: any) {
   const [displayValue, setDisplayValue] = useState(0);

   useEffect(() => {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
         current += increment;
         if (current >= value) {
            setDisplayValue(value);
            clearInterval(timer);
         } else {
            setDisplayValue(Math.floor(current));
         }
      }, duration / steps);

      return () => clearInterval(timer);
   }, [value]);

   return (
      <span style={{ color }} className="font-mono font-bold">
         {prefix}
         {displayValue}
         {suffix}
      </span>
   );
}

// Holographic Data Stream
function HolographicDataStream() {
   const [dataPoints, setDataPoints] = useState<any[]>([]);

   useEffect(() => {
      const generateDataPoint = () => ({
         id: Math.random(),
         value: Math.random() * 100,
         type: ['success', 'warning', 'info', 'danger'][Math.floor(Math.random() * 4)],
         speed: 5 + Math.random() * 10,
      });

      // Initialize with some data points
      setDataPoints(Array(8).fill(0).map(generateDataPoint));

      const interval = setInterval(() => {
         setDataPoints(prev => {
            const newPoints = [...prev];
            // Remove old points
            if (newPoints.length > 8) newPoints.shift();
            // Add new point
            newPoints.push(generateDataPoint());
            return newPoints;
         });
      }, 4000);

      return () => clearInterval(interval);
   }, []);

   return (
      <div className="relative h-32 overflow-hidden rounded-lg bg-gradient-to-r from-black/40 via-purple-900/10 to-black/40">
         <div className="absolute inset-0 flex items-center justify-center">
            {dataPoints.map(point => (
               <motion.div
                  key={point.id}
                  className="absolute w-full h-full flex items-center"
                  initial={{ x: '100%', opacity: 0 }}
                  animate={{ x: '-100%', opacity: [0, 1, 1, 0] }}
                  transition={{ duration: point.speed, ease: 'linear' }}
               >
                  <div
                     className="px-3 py-1 rounded-full text-xs font-mono whitespace-nowrap"
                     style={{
                        background:
                           point.type === 'success'
                              ? COLORS.emerald
                              : point.type === 'warning'
                                ? COLORS.amber
                                : point.type === 'danger'
                                  ? COLORS.rose
                                  : COLORS.info,
                        boxShadow: `0 0 20px ${
                           point.type === 'success'
                              ? COLORS.emerald
                              : point.type === 'warning'
                                ? COLORS.amber
                                : point.type === 'danger'
                                  ? COLORS.rose
                                  : COLORS.info
                        }`,
                     }}
                  >
                     <span className="text-white font-bold">
                        {point.value.toFixed(1)} {point.type === 'success' ? '✓' : point.type === 'warning' ? '⚠' : point.type === 'danger' ? '✗' : 'ℹ'}
                     </span>
                  </div>
               </motion.div>
            ))}
         </div>
         <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-950 to-transparent z-10" />
         <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-950 to-transparent z-10" />
      </div>
   );
}

// Main Dashboard Component
export default function CommandCenterDashboard() {
   const [activeMode, setActiveMode] = useState<'overview' | 'neural' | 'data' | 'terminal'>('overview');

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
         network: [] as any[],
      },
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
                  label,
               }));
            }
            return data.slice(-20).map((d: any, i: number) => ({
               time: `${i}:00`,
               value: d.value || 0,
               label,
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
               network: generateTimeSeries(realtime.chartMetrics?.networkErrors, 'Network Errors'),
            },
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
      { name: 'IOPS', value: 89, fill: COLORS.info },
   ];

   const storageData = [
      { name: 'Used', value: 35, fill: COLORS.warning },
      { name: 'Available', value: 65, fill: COLORS.success },
   ];

   const radarData = [
      { metric: 'CPU', value: 75, fullMark: 100 },
      { metric: 'Memory', value: 82, fullMark: 100 },
      { metric: 'Network', value: 68, fullMark: 100 },
      { metric: 'Disk I/O', value: 91, fullMark: 100 },
      { metric: 'Cache', value: 78, fullMark: 100 },
      { metric: 'Latency', value: 94, fullMark: 100 },
   ];

   const healthScore = storeData.clusterStatus?.health === 'HEALTH_OK' ? 100 : storeData.clusterStatus?.health === 'HEALTH_WARN' ? 75 : 50;

   return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 relative overflow-hidden">
         {/* Custom scrollbar styles */}
         <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />

         {/* Static gradient background - removed animations for performance */}
         <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-purple-900/10 to-pink-900/10" />
            <div className="absolute inset-0 bg-gradient-to-tl from-indigo-900/10 via-transparent to-emerald-900/10" />
         </div>

         {/* Particle background */}
         <ParticlesBackground />

         {/* Floating orbs */}
         <FloatingOrbs />

         {/* Cyberpunk grid */}
         <CyberpunkGrid />

         <div className="relative z-10 p-6 space-y-6">
            {/* Header Section */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
               <h1
                  className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400
                         bg-clip-text text-transparent mb-2"
               >
                  Neural Command Center
               </h1>
               <p className="text-gray-400 text-lg">Advanced AI-Powered Cluster Intelligence System</p>
            </motion.div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
               {[
                  { label: 'Cluster Health', value: healthScore + '%', icon: ShieldCheckIcon, color: 'green' },
                  {
                     label: 'Active OSDs',
                     value: `${storeData.clusterStatus?.osds?.up || 0}/${storeData.clusterStatus?.osds?.total || 0}`,
                     icon: ServerStackIcon,
                     color: 'cyan',
                  },
                  { label: 'AI Score', value: (storeData.anomalyScore * 100).toFixed(1) + '%', icon: SparklesIcon, color: 'purple' },
                  { label: 'Predictions', value: Object.keys(storeData.predictions).length, icon: ChartBarIcon, color: 'blue' },
                  { label: 'Risk Level', value: 'Low', icon: ExclamationTriangleIcon, color: 'yellow' },
               ].map((stat, idx) => (
                  <motion.div
                     key={idx}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.1 }}
                     className="relative rounded-xl border p-4 overflow-hidden group"
                     style={{
                        background: 'rgba(15, 23, 42, 0.12)', // Much more transparent
                        backdropFilter: 'blur(12px) saturate(180%)', // Reduced blur
                        borderColor: 'rgba(255, 255, 255, 0.15)', // Slightly more visible border
                     }}
                  >
                     <div className="flex items-center justify-between">
                        <div className="relative z-10">
                           <p className="text-gray-400 text-sm">{stat.label}</p>
                           <p
                              className={`text-2xl font-bold`}
                              style={{
                                 color:
                                    stat.color === 'green'
                                       ? COLORS.success
                                       : stat.color === 'cyan'
                                         ? COLORS.cyan
                                         : stat.color === 'purple'
                                           ? COLORS.violet
                                           : stat.color === 'blue'
                                             ? COLORS.info
                                             : COLORS.warning,
                              }}
                           >
                              {stat.value}
                           </p>
                        </div>
                        <stat.icon
                           className="w-8 h-8 opacity-50"
                           style={{
                              color:
                                 stat.color === 'green'
                                    ? COLORS.success
                                    : stat.color === 'cyan'
                                      ? COLORS.cyan
                                      : stat.color === 'purple'
                                        ? COLORS.violet
                                        : stat.color === 'blue'
                                          ? COLORS.info
                                          : COLORS.warning,
                           }}
                        />
                        {/* Animated gradient overlay */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                        </div>
                     </div>
                  </motion.div>
               ))}
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-12 gap-6">
               {/* Left Panel - Real-time Metrics */}
               <div className="col-span-12 lg:col-span-4 space-y-6">
                  {/* Network Topology - Enhanced Size */}
                  <HoloCard title="Enhanced Cluster Network Topology" icon={GlobeAsiaAustraliaIcon} gradient={3} className="min-h-[700px]">
                     <div className="h-[650px]">
                        <NetworkTopology />
                     </div>
                  </HoloCard>
                  {/* Performance Charts */}
                  <HoloCard title="Real-time Performance Metrics" icon={ChartBarIcon} gradient={0}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Area Chart - Throughput */}
                        <div>
                           <h4 className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                              <SignalIcon className="w-4 h-4 text-cyan-400" />
                              Network Throughput
                           </h4>
                           <ResponsiveContainer width="100%" height={200}>
                              <AreaChart data={storeData.realtimeMetrics.throughput}>
                                 <defs>
                                    <linearGradient id="throughputGradient" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.9} />
                                       <stop offset="50%" stopColor={COLORS.primary} stopOpacity={0.5} />
                                       <stop offset="95%" stopColor={COLORS.violet} stopOpacity={0.1} />
                                    </linearGradient>
                                    <filter id="glow">
                                       <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                       <feMerge>
                                          <feMergeNode in="coloredBlur" />
                                          <feMergeNode in="SourceGraphic" />
                                       </feMerge>
                                    </filter>
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                                 <XAxis dataKey="time" stroke="#64748b" />
                                 <YAxis stroke="#64748b" />
                                 <Tooltip
                                    contentStyle={{
                                       background: 'rgba(0, 0, 0, 0.95)',
                                       border: `2px solid ${COLORS.cyan}`,
                                       borderRadius: '8px',
                                       backdropFilter: 'blur(10px)',
                                       color: '#ffffff',
                                       boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
                                       fontSize: '14px',
                                       fontWeight: 'bold',
                                    }}
                                    labelStyle={{
                                       color: '#ffffff',
                                       fontWeight: 'bold',
                                    }}
                                    itemStyle={{
                                       color: '#ffffff',
                                    }}
                                 />
                                 <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={COLORS.cyan}
                                    fill="url(#throughputGradient)"
                                    strokeWidth={3}
                                    filter="url(#glow)"
                                 />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>

                        {/* Enhanced Line Chart - Latency */}
                        <div>
                           <h4 className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                              <BoltIcon className="w-4 h-4 text-violet-400" />
                              Latency Trends
                           </h4>
                           <ResponsiveContainer width="100%" height={200}>
                              <LineChart data={storeData.realtimeMetrics.latency}>
                                 <defs>
                                    <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor={COLORS.violet} stopOpacity={0.9} />
                                       <stop offset="95%" stopColor={COLORS.fuchsia} stopOpacity={0.3} />
                                    </linearGradient>
                                    <filter id="glowLine">
                                       <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                       <feMerge>
                                          <feMergeNode in="coloredBlur" />
                                          <feMergeNode in="SourceGraphic" />
                                       </feMerge>
                                    </filter>
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                                 <XAxis dataKey="time" stroke="#64748b" />
                                 <YAxis stroke="#64748b" />
                                 <Tooltip
                                    contentStyle={{
                                       background: 'rgba(0, 0, 0, 0.95)',
                                       border: `2px solid ${COLORS.violet}`,
                                       borderRadius: '8px',
                                       backdropFilter: 'blur(10px)',
                                       color: '#ffffff',
                                       boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
                                       fontSize: '14px',
                                       fontWeight: 'bold',
                                    }}
                                    labelStyle={{
                                       color: '#ffffff',
                                       fontWeight: 'bold',
                                    }}
                                    itemStyle={{
                                       color: '#ffffff',
                                    }}
                                 />
                                 <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="url(#latencyGradient)"
                                    strokeWidth={3}
                                    dot={{ fill: COLORS.violet, strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, fill: COLORS.fuchsia }}
                                    filter="url(#glowLine)"
                                 />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  </HoloCard>

                  {/* Advanced Metrics */}
                  <HoloCard title="System Resource Utilization" icon={CpuChipIcon} gradient={1}>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Radial Bar Chart */}
                        <div>
                           <h4 className="text-sm text-gray-400 mb-3 text-center">Performance Score</h4>
                           <ResponsiveContainer width="100%" height={180}>
                              <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="90%" data={performanceData}>
                                 <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                                 <Tooltip
                                    contentStyle={{
                                       background: 'rgba(0, 0, 0, 0.95)',
                                       border: `2px solid ${COLORS.primary}`,
                                       borderRadius: '8px',
                                       backdropFilter: 'blur(10px)',
                                       color: '#ffffff',
                                       boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
                                       fontSize: '14px',
                                       fontWeight: 'bold',
                                    }}
                                    labelStyle={{
                                       color: '#ffffff',
                                       fontWeight: 'bold',
                                    }}
                                    itemStyle={{
                                       color: '#ffffff',
                                    }}
                                 />
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
                                 <Tooltip
                                    contentStyle={{
                                       background: 'rgba(0, 0, 0, 0.95)',
                                       border: `2px solid ${COLORS.info}`,
                                       borderRadius: '8px',
                                       backdropFilter: 'blur(10px)',
                                       color: '#ffffff',
                                       boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
                                       fontSize: '14px',
                                       fontWeight: 'bold',
                                    }}
                                    labelStyle={{
                                       color: '#ffffff',
                                       fontWeight: 'bold',
                                    }}
                                    itemStyle={{
                                       color: '#ffffff',
                                    }}
                                 />
                              </RadarChart>
                           </ResponsiveContainer>
                        </div>

                        {/* Pie Chart */}
                        <div>
                           <h4 className="text-sm text-gray-400 mb-3 text-center">Storage Distribution</h4>
                           <ResponsiveContainer width="100%" height={180}>
                              <PieChart>
                                 <Pie data={storageData} cx="50%" cy="50%" labelLine={false} outerRadius={60} fill="#8884d8" dataKey="value">
                                    {storageData.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                 </Pie>
                                 <Tooltip
                                    contentStyle={{
                                       background: 'rgba(0, 0, 0, 0.95)',
                                       border: `2px solid ${COLORS.success}`,
                                       borderRadius: '8px',
                                       backdropFilter: 'blur(10px)',
                                       color: '#ffffff',
                                       boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
                                       fontSize: '14px',
                                       fontWeight: 'bold',
                                    }}
                                    labelStyle={{
                                       color: '#ffffff',
                                       fontWeight: 'bold',
                                    }}
                                    itemStyle={{
                                       color: '#ffffff',
                                    }}
                                 />
                              </PieChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  </HoloCard>
                  {/* Terminal Interface */}
                  <HoloCard title="Command Terminal" icon={CommandLineIcon} gradient={2}>
                     <AdvancedTerminal />
                  </HoloCard>
               </div>

               {/* Center Panel - Cyberpunk Command Interface */}
               <div className="col-span-12 lg:col-span-4 space-y-6">
                  {/* CommandInterface Integration - Full Component */}
                  <HoloCard title="Cyberpunk Command Interface" icon={CpuChipIcon} gradient={9} className="overflow-hidden">
                     <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 p-6 relative overflow-hidden min-h-[calc(100vh-83px)]">
                        {/* Neural network background */}
                        {/*<NeuralNetworkConnections />*/}

                        <div className="relative z-10 max-w-7xl mx-auto">
                           {/* Header */}
                           <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                              <h1
                                 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-cyan-400 to-purple-400
                                        bg-clip-text text-transparent mb-4"
                              >
                                 Cyberpunk Command Interface
                              </h1>
                              <p className="text-slate-400 text-lg">Advanced AI-powered cluster management and monitoring</p>
                           </motion.div>

                           {/* Mode Selector */}
                           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                              {[
                                 { key: 'overview', icon: ChartBarIcon, label: 'Overview', desc: 'System metrics' },
                                 { key: 'neural', icon: CpuChipIcon, label: 'Neural Network', desc: 'AI visualization' },
                                 { key: 'data', icon: ServerStackIcon, label: 'Data Grid', desc: 'Live metrics' },
                                 { key: 'terminal', icon: CommandLineIcon, label: 'Terminal', desc: 'Command interface' },
                              ].map(mode => (
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
                                    <mode.icon className={`w-8 h-8 mx-auto mb-2 ${activeMode === mode.key ? 'text-cyan-400' : 'text-gray-400'}`} />
                                    <h3 className="text-white font-medium mb-1">{mode.label}</h3>
                                    <p className="text-gray-400 text-xs">{mode.desc}</p>
                                 </motion.button>
                              ))}
                           </div>

                           {/* Status Bar */}
                           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                                 <div className="flex items-center justify-between">
                                    <div>
                                       <p className="text-gray-400 text-sm">Cluster Health</p>
                                       <p className="text-xl font-bold text-green-400">{storeData.clusterStatus?.health?.replace('HEALTH_', '') || 'OK'}</p>
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
                                       <p className="text-xl font-bold text-purple-400">{(storeData.anomalyScore * 100).toFixed(1)}%</p>
                                    </div>
                                    <EyeIcon className="w-8 h-8 text-purple-400" />
                                 </div>
                              </div>

                              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                                 <div className="flex items-center justify-between">
                                    <div>
                                       <p className="text-gray-400 text-sm">Active Alerts</p>
                                       <p className="text-xl font-bold text-orange-400">
                                          {Object.values(storeData.predictions).filter((p: any) => p.probability > 0.6).length}
                                       </p>
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
                                 <div>
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
                                    <div className="p-6">
                                       <h2 className="text-xl font-semibold text-white mb-4">Neural Network Visualization</h2>
                                       <div className="min-h-[600px] h-[840px] bg-black/20 rounded-lg relative overflow-hidden">
                                          <NeuralNetworkConnections width={800} height={600} className="w-full h-full" />
                                          <div className="absolute top-4 left-4 pointer-events-none">
                                             <div className="text-left">
                                                <div className="flex items-center gap-2 mb-2">
                                                   <CpuChipIcon className="w-6 h-6 text-cyan-400" />
                                                   <p className="text-white text-lg font-semibold">AI Neural Network</p>
                                                </div>
                                                <p className="text-gray-400 text-sm">Processing cluster behavior patterns</p>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              )}

                              {activeMode === 'neural' && (
                                 <div className="p-6">
                                    <h2 className="text-xl font-semibold text-white mb-4">Neural Network Visualization</h2>
                                    <div className="min-h-[600px] h-[840px] bg-black/20 rounded-lg relative overflow-hidden">
                                       <NeuralNetworkConnections width={800} height={600} className="w-full h-full" />
                                       <div className="absolute top-4 left-4 pointer-events-none">
                                          <div className="text-left">
                                             <div className="flex items-center gap-2 mb-2">
                                                <CpuChipIcon className="w-6 h-6 text-cyan-400" />
                                                <p className="text-white text-lg font-semibold">AI Neural Network</p>
                                             </div>
                                             <p className="text-gray-400 text-sm">Processing cluster behavior patterns</p>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              )}

                              {activeMode === 'data' && <HolographicDataGrid title="Real-time Cluster Metrics" />}

                              {activeMode === 'terminal' && (
                                 <div className="p-6">
                                    <h2 className="text-xl font-semibold text-white mb-4">Command Terminal</h2>
                                    <div className="bg-black/40 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 font-mono text-green-400">
                                       <div className="flex items-center justify-between mb-4">
                                          <div className="flex items-center space-x-2">
                                             <CommandLineIcon className="w-5 h-5" />
                                             <span className="text-sm font-medium">Ceph Command Terminal</span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                             <div className="w-2 h-2 rounded-full bg-green-400" />
                                             <span className="text-xs">Ready</span>
                                          </div>
                                       </div>

                                       <div className="h-64 overflow-y-auto mb-4 p-2 bg-black/20 rounded border scrollbar-thin scrollbar-thumb-green-500/30">
                                          <div className="text-gray-500 text-sm">
                                             Welcome to Ceph AI Command Center
                                             <br />
                                             Type 'help' to see available commands
                                          </div>
                                       </div>

                                       <form className="flex space-x-2">
                                          <div className="flex-1 flex items-center space-x-2">
                                             <span className="text-green-400">$</span>
                                             <input
                                                type="text"
                                                placeholder="Enter command..."
                                                className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500"
                                                autoComplete="off"
                                             />
                                          </div>
                                          <button
                                             type="submit"
                                             className="px-3 py-1 bg-green-600/20 border border-green-500/30 rounded text-green-400
                                                hover:bg-green-600/30"
                                          >
                                             Execute
                                          </button>
                                       </form>
                                    </div>
                                 </div>
                              )}
                           </motion.div>
                        </div>
                     </div>
                  </HoloCard>
               </div>

               {/* Right Panel - AI & Predictions */}
               <div className="col-span-12 lg:col-span-4 space-y-6">
                  {/* Holographic Data Stream */}
                  <HoloCard title="Live Data Stream" icon={FireIcon} gradient={8}>
                     <HolographicDataStream />
                  </HoloCard>

                  {/* AI Status */}
                  <HoloCard title="AI Neural Engine" icon={SparklesIcon} gradient={4}>
                     <div className="space-y-4">
                        {/* Enhanced AI Brain Visualization */}
                        <div className="relative h-40 bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20 rounded-lg overflow-hidden">
                           {/* Neural network background */}
                           <svg className="absolute inset-0 w-full h-full opacity-20">
                              <pattern id="neural-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                                 <circle cx="25" cy="25" r="2" fill={COLORS.cyan} opacity="0.5" />
                                 <line x1="0" y1="25" x2="50" y2="25" stroke={COLORS.cyan} strokeWidth="0.5" opacity="0.3" />
                                 <line x1="25" y1="0" x2="25" y2="50" stroke={COLORS.violet} strokeWidth="0.5" opacity="0.3" />
                              </pattern>
                              <rect width="100%" height="100%" fill="url(#neural-pattern)" />
                           </svg>

                           {/* Animated brain core */}
                           <motion.div
                              className="absolute inset-0 flex items-center justify-center"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                           >
                              <motion.div
                                 className="w-24 h-24 rounded-full"
                                 style={{
                                    background: `conic-gradient(from 0deg, ${COLORS.cyan}, ${COLORS.violet}, ${COLORS.pink}, ${COLORS.cyan})`,
                                    filter: 'blur(8px)',
                                 }}
                                 animate={{ scale: [1, 1.2, 1] }}
                                 transition={{ duration: 3, repeat: Infinity }}
                              />
                              <div className="absolute w-20 h-20 rounded-full border-2 border-white/20 backdrop-blur-sm" />
                              <motion.div
                                 className="absolute w-12 h-12 rounded-full"
                                 style={{
                                    background: `radial-gradient(circle, ${COLORS.cyan}, ${COLORS.violet})`,
                                    boxShadow: `0 0 40px ${COLORS.cyan}`,
                                 }}
                                 animate={{ scale: [1, 0.8, 1] }}
                                 transition={{ duration: 2, repeat: Infinity }}
                              />
                           </motion.div>

                           {/* Status overlay */}
                           <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                 <p className="text-white font-bold text-lg mb-1">{storeData.aiStatus.toUpperCase()}</p>
                                 <div className="flex items-center justify-center gap-2">
                                    <motion.div
                                       className="w-2 h-2 rounded-full bg-green-400"
                                       animate={{ opacity: [1, 0.3, 1] }}
                                       transition={{ duration: 1, repeat: Infinity }}
                                    />
                                    <span className="text-xs text-green-400">Neural Processing</span>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Enhanced AI Metrics with Progress Rings */}
                        <div className="grid grid-cols-2 gap-3">
                           {[
                              { label: 'Accuracy', value: 96.5, max: 100, color: COLORS.cyan },
                              { label: 'Precision', value: 94.2, max: 100, color: COLORS.violet },
                              { label: 'F1 Score', value: 95.3, max: 100, color: COLORS.pink },
                              { label: 'Data Points', value: 1.2, suffix: 'M', max: 2, color: COLORS.emerald },
                           ].map((metric, idx) => (
                              <motion.div
                                 key={idx}
                                 initial={{ opacity: 0, scale: 0.8 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 transition={{ delay: idx * 0.1 }}
                                 className="bg-gradient-to-br from-black/20 to-black/10 rounded-lg p-3 border border-white/10"
                              >
                                 <div className="flex items-center justify-between">
                                    <div>
                                       <p className="text-xs text-gray-400 mb-1">{metric.label}</p>
                                       <div className="text-lg font-bold">
                                          <AnimatedCounter value={metric.value} suffix={metric.suffix || '%'} color={metric.color} />
                                       </div>
                                    </div>
                                    <ProgressRing value={metric.value} max={metric.max} color={metric.color} size={40} strokeWidth={3} />
                                 </div>
                              </motion.div>
                           ))}
                        </div>
                     </div>
                  </HoloCard>

                  {/* Predictions */}
                  <HoloCard title="ML Predictions" icon={BoltIcon} gradient={5}>
                     <div className="space-y-3">
                        {Object.values(storeData.predictions)
                           .slice(0, 5)
                           .map((pred: any, idx) => (
                              <motion.div
                                 key={idx}
                                 initial={{ opacity: 0, x: 20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 transition={{ delay: idx * 0.1 }}
                                 className="p-3 bg-black/15 rounded-lg border border-white/10"
                              >
                                 <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-white">{pred.name || 'Prediction'}</span>
                                    <span
                                       className={`text-xs px-2 py-1 rounded ${
                                          pred.severity === 'critical'
                                             ? 'bg-red-500/20 text-red-400'
                                             : pred.severity === 'high'
                                               ? 'bg-orange-500/20 text-orange-400'
                                               : 'bg-green-500/20 text-green-400'
                                       }`}
                                    >
                                       {pred.severity || 'low'}
                                    </span>
                                 </div>
                                 <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">Probability</span>
                                    <span className="text-sm text-cyan-400">{((pred.probability || 0) * 100).toFixed(1)}%</span>
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
                  <HoloCard title="Live Alerts Feed" icon={BellIcon} gradient={6} className="flex flex-col">
                     <div className="flex-1 overflow-hidden">
                        <AlertsFeed />
                     </div>
                  </HoloCard>

                  {/* Quick Actions */}
                  <HoloCard title="Quick Actions" icon={RocketLaunchIcon} gradient={7}>
                     <div className="space-y-2">
                        {[
                           { label: 'Run Full Analysis', icon: ChartBarIcon, color: 'cyan' },
                           { label: 'Generate Report', icon: CloudArrowUpIcon, color: 'purple' },
                           { label: 'System Health Check', icon: ShieldCheckIcon, color: 'green' },
                           { label: 'Update Models', icon: ArrowTrendingUpIcon, color: 'blue' },
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
