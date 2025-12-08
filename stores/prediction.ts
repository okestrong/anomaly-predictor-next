import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { PredictionAPI, type PredictionResponse as APIPredictionResponse, type PredictionSummary } from '@/lib/api/predictionApi'

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
  aiAnalysis?: string // AI-generated analysis summary from backend
  probability: number // 0-1
  severity: 'low' | 'medium' | 'high' | 'critical'
  timeToImpact: string // formatted string like "3일", "2주", "6개월 이상"
  confidence: number // 0-1
  affectedComponents: string[]
  rootCauses: string[]
  recommendedActions: string[]
  mlModel: string
  lastUpdated: Date
  trend: 'improving' | 'stable' | 'worsening'
  historicalAccuracy: number
  isLoading?: boolean // Loading state for individual predictions
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
  summary: PredictionSummary | null
  isUpdating: boolean
  lastModelRun: Date | null
  modelVersion: string

  // Actions
  updatePrediction: (category: PredictionCategory, prediction: Partial<Prediction>) => void
  updateAllPredictions: () => Promise<void>
  updateSummary: () => Promise<void>
  addTimelinePoint: (category: PredictionCategory, point: { probability: number; confidence: number }) => void

  // Computed
  getHighRiskPredictions: () => Prediction[]
  getImminentFailures: () => Prediction[]
  getOverallRiskScore: () => number
  getImminentFailuresCount: () => number
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

// Helper function to format hours to Korean time format
function formatTimeToImpact(hours: number): string {
  if (hours <= 0) return 'Immediate';
  if (hours < 24) return `${hours}시간`;
  if (hours < 168) {
    const days = Math.floor(hours / 24);
    return `${days}일`;
  }
  if (hours < 720) {
    const weeks = Math.floor(hours / 168);
    return `${weeks}주`;
  }
  const months = Math.floor(hours / 720);
  return `${months}개월`;
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
      timeToImpact: formatTimeToImpact(Math.floor((1 - probability) * 168)), // Convert hours to Korean format
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
      summary: null,
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
        set((state) => {
          state.isUpdating = true
          // Set all predictions to loading state
          Object.keys(state.predictions).forEach((key) => {
            state.predictions[key as PredictionCategory].isLoading = true
          })
        })

        // 11개 카테고리 (comprehensive 제외)
        const individualCategories: PredictionCategory[] = [
          'osd-failure',
          'capacity-exhaustion',
          'performance-degradation',
          'pg-imbalance',
          'network-bottleneck',
          'memory-shortage',
          'rebalancing-needed',
          'hotspot-osd',
          'cluster-expansion',
          'smart-disk-failure',
          'metric-disk-failure'
        ]

        // Helper function to update a single prediction in store
        const updatePredictionInStore = (category: PredictionCategory, apiPred: APIPredictionResponse) => {
          set((state) => {
            const existingPred = state.predictions[category]
            if (existingPred) {
              existingPred.category = category
              existingPred.name = apiPred.categoryName
              existingPred.description = predictionConfigs[category].description
              existingPred.aiAnalysis = apiPred.aiAnalysis
              existingPred.probability = apiPred.riskScore
              existingPred.severity = convertRiskLevelToSeverity(apiPred.riskLevel)
              existingPred.timeToImpact = parseTimeToFailure(apiPred.predictedTimeToFailure)
              existingPred.confidence = apiPred.confidence
              existingPred.affectedComponents = apiPred.affectedResources
              existingPred.rootCauses = apiPred.rootCauses
              existingPred.recommendedActions = apiPred.recommendedActions
              existingPred.mlModel = apiPred.modelInfo.modelName
              existingPred.lastUpdated = new Date(apiPred.timestamp)
              existingPred.trend = apiPred.trend as 'improving' | 'stable' | 'worsening'
              existingPred.historicalAccuracy = apiPred.modelInfo.accuracy
              existingPred.isLoading = false
            }
          })
        }

        // 개별 카드가 완료되면 즉시 로딩 해제되도록 각각 병렬 호출
        // 11개 예측을 각각 병렬로 가져오면서 완료 즉시 업데이트
        const individualPromises = individualCategories.map(async (category) => {
          try {
            const apiPred = await PredictionAPI.getPrediction(category)
            updatePredictionInStore(category, apiPred)
            return apiPred
          } catch (error) {
            console.warn(`⚠️ Prediction failed for ${category}, using fallback`)
            set((state) => {
              if (state.predictions[category]) {
                state.predictions[category].isLoading = false
              }
            })
            return null
          }
        })

        try {
          // 11개 결과를 기다림
          const individualResults = await Promise.all(individualPromises)

          // 성공한 결과만 필터링하여 comprehensive에 전달
          const successfulPredictions = individualResults.filter((p): p is APIPredictionResponse => p !== null)

          // comprehensive를 POST로 호출 (11개 결과 전달)
          if (successfulPredictions.length > 0) {
            try {
              const comprehensivePred = await PredictionAPI.postComprehensive(successfulPredictions)
              updatePredictionInStore('comprehensive', comprehensivePred)
            } catch (error) {
              console.warn('⚠️ Comprehensive prediction failed, using fallback')
              set((state) => {
                if (state.predictions['comprehensive']) {
                  state.predictions['comprehensive'].isLoading = false
                }
              })
            }
          } else {
            // 모든 개별 예측이 실패한 경우
            set((state) => {
              if (state.predictions['comprehensive']) {
                state.predictions['comprehensive'].isLoading = false
              }
            })
          }

          set((state) => {
            state.lastModelRun = new Date()
          })
        } finally {
          set((state) => {
            state.isUpdating = false
          })
        }
      },

      updateSummary: async () => {
        try {
          const apiSummary = await PredictionAPI.getPredictionSummary()
          set((state) => {
            state.summary = apiSummary
          })
        } catch (error) {
          console.error('Failed to fetch prediction summary:', error)
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
        const { summary } = get()
        // Prefer summary data if available
        if (summary && summary.high_risk_categories !== undefined) {
          const predictions = Object.values(get().predictions)
          return predictions
            .filter(p => p.severity === 'high' || p.severity === 'critical')
            .sort((a, b) => b.probability - a.probability)
        }

        // Fallback to client-side calculation
        const predictions = Object.values(get().predictions)
        return predictions
          .filter(p => p.probability > 0.5)
          .sort((a, b) => b.probability - a.probability)
      },

      getImminentFailures: () => {
        const predictions = Object.values(get().predictions)
        // Filter for imminent failures (within hours or immediate)
        return predictions
          .filter(p =>
            (p.timeToImpact.includes('시간') || p.timeToImpact === 'Immediate') &&
            p.probability > 0.3
          )
          .sort((a, b) => b.probability - a.probability) // Sort by probability since timeToImpact is now a string
      },

      getOverallRiskScore: () => {
        const { summary } = get()
        // Prefer backend summary data (with validation)
        if (summary && typeof summary.overall_risk_score === 'number' && !isNaN(summary.overall_risk_score)) {
          return summary.overall_risk_score * 100 // Convert to percentage
        }

        // Fallback to client-side calculation
        const predictions = Object.values(get().predictions)

        // Filter out predictions with invalid probability or confidence
        const validPredictions = predictions.filter(p =>
          typeof p.probability === 'number' &&
          typeof p.confidence === 'number' &&
          !isNaN(p.probability) &&
          !isNaN(p.confidence)
        )

        // If no valid predictions, return 0
        if (validPredictions.length === 0) {
          return 0
        }

        const weightedSum = validPredictions.reduce((sum, p) => {
          const weight = p.severity === 'critical' ? 4 :
                        p.severity === 'high' ? 3 :
                        p.severity === 'medium' ? 2 : 1
          return sum + (p.probability * p.confidence * weight)
        }, 0)

        const maxPossible = validPredictions.length * 4 // All critical with 100% prob and confidence
        return (weightedSum / maxPossible) * 100
      },

      getImminentFailuresCount: () => {
        const { summary } = get()
        // Prefer backend summary data
        if (summary && summary.imminent_failures !== undefined) {
          return summary.imminent_failures
        }

        // Fallback to client-side calculation
        return get().getImminentFailures().length
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

// Helper functions for converting backend data to frontend format

/**
 * Convert backend risk level to frontend severity
 */
function convertRiskLevelToSeverity(riskLevel: string): 'low' | 'medium' | 'high' | 'critical' {
  const normalized = riskLevel.toUpperCase()
  switch (normalized) {
    case 'CRITICAL':
      return 'critical'
    case 'HIGH':
      return 'high'
    case 'MEDIUM':
      return 'medium'
    case 'LOW':
    case 'MINIMAL':
      return 'low'
    default:
      return 'medium'
  }
}

/**
 * Parse backend predictedTimeToFailure string to hours
 * Examples: "3 days" -> 72, "2 weeks" -> 336, "1-2 months" -> 1080, "N/A" -> 168
 */
// Parse time to failure - now returns formatted string from backend
function parseTimeToFailure(timeString: string): string {
  // Backend already returns formatted Korean strings like "3일", "2주", "6개월 이상"
  // Just return as-is, with fallback for empty/null
  if (!timeString || timeString.trim() === '') {
    return '알 수 없음'
  }
  return timeString
}

// Auto-update predictions disabled to prevent card re-mounting animation
// Use the Auto-refresh button in the UI instead
// if (process.env.NODE_ENV === 'development') {
//   setInterval(() => {
//     usePredictionStore.getState().updateAllPredictions()
//   }, 30000) // Every 30 seconds
// }