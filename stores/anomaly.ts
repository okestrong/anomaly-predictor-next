import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Types
export interface AnomalyAlert {
  id: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: string
  component: string
  message: string
  score: number
  details?: any
  resolved: boolean
  aiInsights?: string[]
  recommendedActions?: string[]
}

export interface AnomalyPattern {
  id: string
  name: string
  description: string
  frequency: number
  lastOccurrence: Date
  affectedComponents: string[]
  riskLevel: number
  pattern: number[][]
}

export interface ModelPerformance {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  falsePositiveRate: number
  lastTrainedAt: Date
  dataPoints: number
  modelVersion: string
}

interface AnomalyStore {
  // State
  anomalyScore: number
  anomalyThreshold: number
  anomalyPatterns: AnomalyPattern[]
  recentAnomalies: AnomalyAlert[]
  modelPerformance: ModelPerformance | null
  isAnalyzing: boolean
  aiStatus: 'idle' | 'analyzing' | 'learning' | 'predicting'

  // Heatmap data for visualization
  anomalyHeatmap: number[][]

  // Actions
  setAnomalyScore: (score: number) => void
  setAnomalyThreshold: (threshold: number) => void
  addAnomalyAlert: (alert: AnomalyAlert) => void
  resolveAnomaly: (id: string) => void
  updateAnomalyPatterns: (patterns: AnomalyPattern[]) => void
  setModelPerformance: (performance: ModelPerformance) => void
  setAIStatus: (status: AnomalyStore['aiStatus']) => void
  setAnomalyHeatmap: (data: number[][]) => void

  // AI Analysis
  analyzeClusterBehavior: () => Promise<void>
  predictAnomaly: (data: any) => Promise<AnomalyAlert | null>
  trainModel: () => Promise<void>

  // Computed
  getActiveAnomalies: () => AnomalyAlert[]
  getCriticalAnomalies: () => AnomalyAlert[]
  getAnomalyTrend: () => 'increasing' | 'stable' | 'decreasing'
}

// Generate mock heatmap data for visualization
function generateMockHeatmap(rows: number = 10, cols: number = 24): number[][] {
  const heatmap: number[][] = []
  for (let i = 0; i < rows; i++) {
    const row: number[] = []
    for (let j = 0; j < cols; j++) {
      // Create patterns in data (higher values during "peak" hours)
      const isPeakHour = j >= 8 && j <= 18
      const baseValue = isPeakHour ? 0.6 : 0.3
      const noise = Math.random() * 0.3
      row.push(Math.min(1, baseValue + noise))
    }
    heatmap.push(row)
  }
  return heatmap
}

// Generate mock anomaly patterns
function generateMockPatterns(): AnomalyPattern[] {
  return [
    {
      id: 'pattern-1',
      name: 'Periodic Spike Pattern',
      description: 'Regular spikes in latency every 4 hours',
      frequency: 6,
      lastOccurrence: new Date(),
      affectedComponents: ['OSD.12', 'OSD.15', 'OSD.18'],
      riskLevel: 0.65,
      pattern: [[0.2, 0.3], [0.5, 0.8], [0.3, 0.4], [0.9, 1.0]]
    },
    {
      id: 'pattern-2',
      name: 'Network Congestion Pattern',
      description: 'Gradual network throughput degradation',
      frequency: 3,
      lastOccurrence: new Date(Date.now() - 3600000),
      affectedComponents: ['mon.a', 'mon.b'],
      riskLevel: 0.45,
      pattern: [[0.3, 0.4], [0.4, 0.5], [0.5, 0.6], [0.6, 0.7]]
    },
    {
      id: 'pattern-3',
      name: 'Storage Saturation Trend',
      description: 'Increasing storage utilization with decreasing performance',
      frequency: 8,
      lastOccurrence: new Date(Date.now() - 7200000),
      affectedComponents: ['pool.rbd', 'pool.cephfs_data'],
      riskLevel: 0.75,
      pattern: [[0.6, 0.65], [0.65, 0.72], [0.72, 0.78], [0.78, 0.85]]
    }
  ]
}

export const useAnomalyStore = create<AnomalyStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      anomalyScore: 0.25,
      anomalyThreshold: 0.7,
      anomalyPatterns: generateMockPatterns(),
      recentAnomalies: [],
      modelPerformance: {
        accuracy: 0.945,
        precision: 0.923,
        recall: 0.912,
        f1Score: 0.917,
        falsePositiveRate: 0.078,
        lastTrainedAt: new Date(Date.now() - 86400000),
        dataPoints: 1250000,
        modelVersion: 'v2.3.1-reef'
      },
      isAnalyzing: false,
      aiStatus: 'idle',
      anomalyHeatmap: generateMockHeatmap(),

      // Actions
      setAnomalyScore: (score) => {
        set((state) => {
          state.anomalyScore = score

          // Auto-generate alert if score exceeds threshold
          if (score > state.anomalyThreshold) {
            const alert: AnomalyAlert = {
              id: `anomaly-${Date.now()}`,
              timestamp: new Date(),
              severity: score > 0.9 ? 'critical' : score > 0.8 ? 'high' : 'medium',
              type: 'threshold_exceeded',
              component: 'cluster',
              message: `Anomaly score ${(score * 100).toFixed(1)}% exceeds threshold`,
              score: score,
              resolved: false,
              aiInsights: [
                'Unusual pattern detected in cluster behavior',
                'Multiple components showing correlated anomalies',
                'Recommend immediate investigation'
              ],
              recommendedActions: [
                'Check OSD performance metrics',
                'Review recent configuration changes',
                'Analyze network traffic patterns'
              ]
            }
            state.recentAnomalies.unshift(alert)
            state.recentAnomalies = state.recentAnomalies.slice(0, 100)
          }
        })
      },

      setAnomalyThreshold: (threshold) => {
        set((state) => {
          state.anomalyThreshold = threshold
        })
      },

      addAnomalyAlert: (alert) => {
        set((state) => {
          state.recentAnomalies.unshift(alert)
          state.recentAnomalies = state.recentAnomalies.slice(0, 100)
        })
      },

      resolveAnomaly: (id) => {
        set((state) => {
          const anomaly = state.recentAnomalies.find(a => a.id === id)
          if (anomaly) {
            anomaly.resolved = true
          }
        })
      },

      updateAnomalyPatterns: (patterns) => {
        set((state) => {
          state.anomalyPatterns = patterns
        })
      },

      setModelPerformance: (performance) => {
        set((state) => {
          state.modelPerformance = performance
        })
      },

      setAIStatus: (status) => {
        set((state) => {
          state.aiStatus = status
        })
      },

      setAnomalyHeatmap: (data) => {
        set((state) => {
          state.anomalyHeatmap = data
        })
      },

      // AI Analysis methods
      analyzeClusterBehavior: async () => {
        const { setAIStatus, setAnomalyScore, setAnomalyHeatmap } = get()

        setAIStatus('analyzing')
        set((state) => { state.isAnalyzing = true })

        try {
          // Simulate AI analysis
          await new Promise(resolve => setTimeout(resolve, 2000))

          // Generate new anomaly score based on "analysis"
          const newScore = Math.random() * 0.4 + 0.3 // 0.3 to 0.7
          setAnomalyScore(newScore)

          // Update heatmap with new data
          setAnomalyHeatmap(generateMockHeatmap())

          // Generate insights
          if (newScore > 0.5) {
            const alert: AnomalyAlert = {
              id: `ai-insight-${Date.now()}`,
              timestamp: new Date(),
              severity: newScore > 0.6 ? 'high' : 'medium',
              type: 'ai_detection',
              component: 'cluster_analysis',
              message: 'AI detected unusual cluster behavior pattern',
              score: newScore,
              resolved: false,
              aiInsights: [
                `Detected ${Math.floor(newScore * 10)} anomalous patterns`,
                'Pattern matches historical incident profile',
                'Probability of issue escalation: ' + (newScore * 100).toFixed(0) + '%'
              ],
              recommendedActions: [
                'Review cluster topology for hotspots',
                'Check for failing disks or network issues',
                'Consider rebalancing if pattern persists'
              ]
            }
            get().addAnomalyAlert(alert)
          }
        } finally {
          setAIStatus('idle')
          set((state) => { state.isAnalyzing = false })
        }
      },

      predictAnomaly: async (data) => {
        const { setAIStatus } = get()

        setAIStatus('predicting')
        try {
          // Simulate ML prediction
          await new Promise(resolve => setTimeout(resolve, 500))

          const probability = Math.random()
          if (probability > 0.7) {
            const alert: AnomalyAlert = {
              id: `prediction-${Date.now()}`,
              timestamp: new Date(),
              severity: probability > 0.9 ? 'critical' : probability > 0.8 ? 'high' : 'medium',
              type: 'predictive',
              component: data.component || 'unknown',
              message: `ML model predicts potential issue with ${(probability * 100).toFixed(0)}% confidence`,
              score: probability,
              resolved: false,
              aiInsights: [
                'Based on historical patterns',
                'Similar conditions led to failures in 78% of cases',
                'Estimated time to impact: ' + Math.floor(Math.random() * 24 + 1) + ' hours'
              ],
              recommendedActions: [
                'Proactive maintenance recommended',
                'Increase monitoring frequency',
                'Prepare failover procedures'
              ]
            }
            return alert
          }
          return null
        } finally {
          setAIStatus('idle')
        }
      },

      trainModel: async () => {
        const { setAIStatus, setModelPerformance } = get()

        setAIStatus('learning')
        try {
          // Simulate model training
          await new Promise(resolve => setTimeout(resolve, 5000))

          // Update model performance with "improved" metrics
          const currentPerf = get().modelPerformance
          if (currentPerf) {
            setModelPerformance({
              ...currentPerf,
              accuracy: Math.min(0.99, currentPerf.accuracy + Math.random() * 0.01),
              precision: Math.min(0.99, currentPerf.precision + Math.random() * 0.01),
              recall: Math.min(0.99, currentPerf.recall + Math.random() * 0.01),
              f1Score: Math.min(0.99, currentPerf.f1Score + Math.random() * 0.01),
              falsePositiveRate: Math.max(0.01, currentPerf.falsePositiveRate - Math.random() * 0.005),
              lastTrainedAt: new Date(),
              dataPoints: currentPerf.dataPoints + Math.floor(Math.random() * 100000),
              modelVersion: 'v2.3.2-reef'
            })
          }
        } finally {
          setAIStatus('idle')
        }
      },

      // Computed values
      getActiveAnomalies: () => {
        return get().recentAnomalies.filter(a => !a.resolved)
      },

      getCriticalAnomalies: () => {
        return get().recentAnomalies.filter(a => a.severity === 'critical' && !a.resolved)
      },

      getAnomalyTrend: () => {
        const anomalies = get().recentAnomalies
        if (anomalies.length < 2) return 'stable'

        const recentCount = anomalies.slice(0, 10).filter(a => !a.resolved).length
        const previousCount = anomalies.slice(10, 20).filter(a => !a.resolved).length

        if (recentCount > previousCount * 1.2) return 'increasing'
        if (recentCount < previousCount * 0.8) return 'decreasing'
        return 'stable'
      }
    })),
    { name: 'anomaly-store' }
  )
)

// Auto-generate anomalies in development
// Temporarily disabled to fix 10-second animation freeze issue
// if (process.env.NODE_ENV === 'development') {
//   setInterval(() => {
//     const store = useAnomalyStore.getState()

//     // Randomly update anomaly score
//     const currentScore = store.anomalyScore
//     const delta = (Math.random() - 0.5) * 0.1
//     const newScore = Math.max(0, Math.min(1, currentScore + delta))
//     store.setAnomalyScore(newScore)

//     // Occasionally generate new patterns
//     if (Math.random() > 0.95) {
//       store.analyzeClusterBehavior()
//     }
//   }, 10000) // Every 10 seconds
// }