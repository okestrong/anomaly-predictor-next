import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// 12 prediction categories from PRD
export type PredictionCategory =
  | 'osd-failure'
  | 'capacity-exhaustion'
  | 'performance-degradation'
  | 'pg-imbalance'
  | 'network-bottleneck'
  | 'memory-shortage'
  | 'rebalancing-needed'
  | 'hotspot-osd'
  | 'cluster-expansion'
  | 'smart-disk-failure'
  | 'metric-disk-failure'
  | 'comprehensive'

export interface Prediction {
  id: string
  category: PredictionCategory
  name: string
  description: string
  probability: number // 0-1
  severity: 'low' | 'medium' | 'high' | 'critical'
  timeToImpact: number // hours
  confidence: number // 0-1
  affectedComponents: string[]
  rootCauses: string[]
  recommendedActions: string[]
  mlModel: string
  lastUpdated: Date
  trend: 'improving' | 'stable' | 'worsening'
  historicalAccuracy: number
}

export interface PredictionTimeline {
  category: PredictionCategory
  predictions: {
    timestamp: Date
    probability: number
    confidence: number
  }[]
}

interface PredictionStore {
  // State
  predictions: Record<PredictionCategory, Prediction>
  timelines: Record<PredictionCategory, PredictionTimeline>
  isUpdating: boolean
  lastModelRun: Date | null
  modelVersion: string

  // Actions
  updatePrediction: (category: PredictionCategory, prediction: Partial<Prediction>) => void
  updateAllPredictions: () => Promise<void>
  addTimelinePoint: (category: PredictionCategory, point: { probability: number; confidence: number }) => void

  // Computed
  getHighRiskPredictions: () => Prediction[]
  getImminentFailures: () => Prediction[]
  getOverallRiskScore: () => number
  getPredictionsByComponent: (component: string) => Prediction[]
}

// Prediction category configurations
const predictionConfigs: Record<PredictionCategory, {
  name: string
  description: string
  mlModel: string
  baseAccuracy: number
}> = {
  'osd-failure': {
    name: 'OSD Failure',
    description: 'Predicts potential OSD failures based on performance metrics and SMART data',
    mlModel: 'LSTM-OSD-v3.2',
    baseAccuracy: 0.92
  },
  'capacity-exhaustion': {
    name: 'Capacity Exhaustion',
    description: 'Forecasts when storage capacity will be exhausted',
    mlModel: 'TimeSeries-Capacity-v2.8',
    baseAccuracy: 0.95
  },
  'performance-degradation': {
    name: 'Performance Degradation',
    description: 'Detects gradual performance degradation patterns',
    mlModel: 'RandomForest-Perf-v4.1',
    baseAccuracy: 0.88
  },
  'pg-imbalance': {
    name: 'PG Imbalance',
    description: 'Identifies placement group distribution issues',
    mlModel: 'XGBoost-PG-v2.5',
    baseAccuracy: 0.90
  },
  'network-bottleneck': {
    name: 'Network Bottleneck',
    description: 'Predicts network congestion and bottlenecks',
    mlModel: 'CNN-Network-v3.0',
    baseAccuracy: 0.87
  },
  'memory-shortage': {
    name: 'Memory Shortage',
    description: 'Forecasts memory pressure and OOM conditions',
    mlModel: 'GRU-Memory-v2.2',
    baseAccuracy: 0.91
  },
  'rebalancing-needed': {
    name: 'Rebalancing Needed',
    description: 'Determines when cluster rebalancing is required',
    mlModel: 'DecisionTree-Balance-v3.4',
    baseAccuracy: 0.89
  },
  'hotspot-osd': {
    name: 'Hotspot OSD',
    description: 'Identifies OSDs with excessive load',
    mlModel: 'Isolation-Forest-v2.9',
    baseAccuracy: 0.93
  },
  'cluster-expansion': {
    name: 'Cluster Expansion',
    description: 'Recommends when cluster expansion is needed',
    mlModel: 'Prophet-Growth-v3.1',
    baseAccuracy: 0.86
  },
  'smart-disk-failure': {
    name: 'SMART Disk Failure',
    description: 'Predicts disk failures from SMART attributes',
    mlModel: 'DeepLearning-SMART-v4.2',
    baseAccuracy: 0.94
  },
  'metric-disk-failure': {
    name: 'Metric-based Disk Failure',
    description: 'Predicts disk failures from performance metrics',
    mlModel: 'Ensemble-Disk-v3.3',
    baseAccuracy: 0.91
  },
  'comprehensive': {
    name: 'Comprehensive Analysis',
    description: 'Combined analysis of all prediction models',
    mlModel: 'Meta-Ensemble-v5.0',
    baseAccuracy: 0.96
  }
}

// Generate initial predictions
function generateInitialPredictions(): Record<PredictionCategory, Prediction> {
  const predictions = {} as Record<PredictionCategory, Prediction>

  Object.keys(predictionConfigs).forEach((key) => {
    const category = key as PredictionCategory
    const config = predictionConfigs[category]

    // Generate realistic prediction values
    const probability = Math.random() * 0.8 // 0-80%
    const confidence = 0.7 + Math.random() * 0.3 // 70-100%

    predictions[category] = {
      id: `pred-${category}-${Date.now()}`,
      category,
      name: config.name,
      description: config.description,
      probability,
      severity:
        probability > 0.7 ? 'critical' :
        probability > 0.5 ? 'high' :
        probability > 0.3 ? 'medium' : 'low',
      timeToImpact: Math.floor((1 - probability) * 168), // 0-168 hours (1 week)
      confidence,
      affectedComponents: generateAffectedComponents(category),
      rootCauses: generateRootCauses(category),
      recommendedActions: generateRecommendations(category),
      mlModel: config.mlModel,
      lastUpdated: new Date(),
      trend: Math.random() > 0.5 ? 'stable' : Math.random() > 0.5 ? 'improving' : 'worsening',
      historicalAccuracy: config.baseAccuracy + (Math.random() - 0.5) * 0.05
    }
  })

  return predictions
}

function generateAffectedComponents(category: PredictionCategory): string[] {
  const componentPools: Partial<Record<PredictionCategory, string[]>> = {
    'osd-failure': ['osd.12', 'osd.15', 'osd.23', 'osd.31'],
    'capacity-exhaustion': ['pool.rbd', 'pool.cephfs_data', 'pool.rgw.buckets.data'],
    'performance-degradation': ['mon.a', 'mon.b', 'osd.8', 'osd.16'],
    'pg-imbalance': ['pg 3.1f', 'pg 3.2a', 'pg 4.5c'],
    'network-bottleneck': ['node-01', 'node-02', 'switch-core-01'],
    'memory-shortage': ['osd.5', 'osd.9', 'mon.c'],
    'rebalancing-needed': ['pool.rbd', 'rack-A', 'rack-B'],
    'hotspot-osd': ['osd.7', 'osd.14', 'osd.28'],
    'cluster-expansion': ['cluster', 'all-pools'],
    'smart-disk-failure': ['disk-sda@node-03', 'disk-sdb@node-05'],
    'metric-disk-failure': ['osd.11', 'osd.19', 'osd.27'],
    'comprehensive': ['cluster-wide']
  }

  const components = componentPools[category] || []
  return components.slice(0, Math.floor(Math.random() * components.length) + 1)
}

function generateRootCauses(category: PredictionCategory): string[] {
  const causePools: Partial<Record<PredictionCategory, string[]>> = {
    'osd-failure': [
      'High number of slow operations detected',
      'Increasing read/write errors',
      'SMART attribute degradation',
      'Temperature threshold exceeded'
    ],
    'capacity-exhaustion': [
      'Current growth rate: 12GB/hour',
      'Snapshot retention policy too long',
      'Unexpected data ingestion spike'
    ],
    'performance-degradation': [
      'Network packet loss increasing',
      'CPU throttling detected',
      'Memory pressure causing swapping'
    ],
    'pg-imbalance': [
      'Uneven data distribution',
      'OSD weight misconfiguration',
      'Recent node addition/removal'
    ],
    'network-bottleneck': [
      'Interface saturation detected',
      'Packet retransmission rate high',
      'Switch buffer overflow'
    ],
    'memory-shortage': [
      'Memory utilization > 90%',
      'OOM killer invocations',
      'Cache miss rate increasing'
    ],
    'rebalancing-needed': [
      'Data distribution variance > 15%',
      'New OSDs detected',
      'Manual intervention recommended'
    ],
    'hotspot-osd': [
      'Single OSD handling 3x average load',
      'Unbalanced client connections',
      'Popular objects concentrated'
    ],
    'cluster-expansion': [
      'Capacity utilization > 80%',
      'Growth rate exceeding projections',
      'Performance degradation from load'
    ],
    'smart-disk-failure': [
      'SMART health check failed',
      'Bad sectors detected',
      'Reallocated sectors increasing'
    ],
    'metric-disk-failure': [
      'Latency spikes detected',
      'Throughput degradation',
      'Error rate threshold exceeded'
    ],
    'comprehensive': [
      'Multiple indicators triggered',
      'Cross-system correlation detected',
      'AI confidence threshold exceeded'
    ]
  }

  const defaultCauses = [
    'Historical pattern analysis',
    'Anomaly detection trigger',
    'Threshold breach detected'
  ]

  const causes = causePools[category] || defaultCauses
  return causes.slice(0, Math.floor(Math.random() * 2) + 1)
}

function generateRecommendations(category: PredictionCategory): string[] {
  const actionPools: Partial<Record<PredictionCategory, string[]>> = {
    'osd-failure': [
      'Schedule disk replacement',
      'Migrate data from affected OSDs',
      'Increase scrub frequency',
      'Check hardware diagnostics'
    ],
    'capacity-exhaustion': [
      'Add storage nodes',
      'Review retention policies',
      'Enable compression',
      'Archive old data'
    ],
    'performance-degradation': [
      'Investigate network issues',
      'Review QoS settings',
      'Check for noisy neighbors',
      'Optimize placement groups'
    ]
  }

  const defaultActions = [
    'Monitor closely',
    'Review system logs',
    'Prepare contingency plan'
  ]

  const actions = actionPools[category] || defaultActions
  return actions.slice(0, Math.floor(Math.random() * 3) + 1)
}

export const usePredictionStore = create<PredictionStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      predictions: generateInitialPredictions(),
      timelines: {} as Record<PredictionCategory, PredictionTimeline>,
      isUpdating: false,
      lastModelRun: new Date(),
      modelVersion: 'v5.0.0-reef',

      // Actions
      updatePrediction: (category, prediction) => {
        set((state) => {
          if (state.predictions[category]) {
            Object.assign(state.predictions[category], prediction)
            state.predictions[category].lastUpdated = new Date()
          }
        })
      },

      updateAllPredictions: async () => {
        set((state) => { state.isUpdating = true })

        try {
          // Simulate ML model inference
          await new Promise(resolve => setTimeout(resolve, 1500))

          set((state) => {
            Object.keys(state.predictions).forEach((key) => {
              const category = key as PredictionCategory
              const pred = state.predictions[category]

              // Update with some randomness to simulate real predictions
              const delta = (Math.random() - 0.5) * 0.1
              pred.probability = Math.max(0, Math.min(1, pred.probability + delta))
              pred.confidence = 0.7 + Math.random() * 0.3
              pred.timeToImpact = Math.floor((1 - pred.probability) * 168)
              pred.severity =
                pred.probability > 0.7 ? 'critical' :
                pred.probability > 0.5 ? 'high' :
                pred.probability > 0.3 ? 'medium' : 'low'

              // Update trend
              const trendRandom = Math.random()
              pred.trend = trendRandom > 0.7 ? 'worsening' : trendRandom > 0.3 ? 'stable' : 'improving'

              pred.lastUpdated = new Date()
            })

            state.lastModelRun = new Date()
          })
        } finally {
          set((state) => { state.isUpdating = false })
        }
      },

      addTimelinePoint: (category, point) => {
        set((state) => {
          if (!state.timelines[category]) {
            state.timelines[category] = {
              category,
              predictions: []
            }
          }

          state.timelines[category].predictions.push({
            timestamp: new Date(),
            probability: point.probability,
            confidence: point.confidence
          })

          // Keep only last 100 points
          state.timelines[category].predictions =
            state.timelines[category].predictions.slice(-100)
        })
      },

      // Computed values
      getHighRiskPredictions: () => {
        const predictions = Object.values(get().predictions)
        return predictions
          .filter(p => p.probability > 0.5)
          .sort((a, b) => b.probability - a.probability)
      },

      getImminentFailures: () => {
        const predictions = Object.values(get().predictions)
        return predictions
          .filter(p => p.timeToImpact <= 24 && p.probability > 0.3)
          .sort((a, b) => a.timeToImpact - b.timeToImpact)
      },

      getOverallRiskScore: () => {
        const predictions = Object.values(get().predictions)
        const weightedSum = predictions.reduce((sum, p) => {
          const weight = p.severity === 'critical' ? 4 :
                        p.severity === 'high' ? 3 :
                        p.severity === 'medium' ? 2 : 1
          return sum + (p.probability * p.confidence * weight)
        }, 0)

        const maxPossible = predictions.length * 4 // All critical with 100% prob and confidence
        return (weightedSum / maxPossible) * 100
      },

      getPredictionsByComponent: (component) => {
        const predictions = Object.values(get().predictions)
        return predictions.filter(p =>
          p.affectedComponents.includes(component)
        )
      }
    })),
    { name: 'prediction-store' }
  )
)

// Auto-update predictions in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    usePredictionStore.getState().updateAllPredictions()
  }, 30000) // Every 30 seconds
}