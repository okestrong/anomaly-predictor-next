import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export interface MetricDataPoint {
  timestamp: number
  value: number
  label?: string
}

export interface ChartMetrics {
  poolUsage: MetricDataPoint[]
  iops: MetricDataPoint[]
  latency: MetricDataPoint[]
  throughput: MetricDataPoint[]
  scrubErrors: MetricDataPoint[]
  pgInconsistency: MetricDataPoint[]
  networkErrors: MetricDataPoint[]
  osdPerformance: MetricDataPoint[]
}

export interface MetricConfig {
  min: number
  max: number
  variance: number
  trend: number
  unit?: string
  criticalThreshold?: number
  warningThreshold?: number
}

interface RealtimeStore {
  // State
  isActive: boolean
  updateInterval: NodeJS.Timeout | null
  chartMetrics: ChartMetrics
  lastUpdate: Date | null
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error'

  // Actions
  startRealTimeUpdates: () => void
  stopRealTimeUpdates: () => void
  generateRealtimeData: () => void
  setChartMetrics: (metrics: Partial<ChartMetrics>) => void
  updateSingleMetric: (key: keyof ChartMetrics, data: MetricDataPoint[]) => void
  setConnectionStatus: (status: RealtimeStore['connectionStatus']) => void

  // Computed
  getLatestValues: () => Partial<Record<keyof ChartMetrics, number>>
  getMetricStatus: (key: keyof ChartMetrics) => 'normal' | 'warning' | 'critical'
}

const metricConfigs: Record<keyof ChartMetrics, MetricConfig> = {
  poolUsage: {
    min: 0,
    max: 100,
    variance: 0.05,
    trend: 0.01,
    unit: '%',
    warningThreshold: 70,
    criticalThreshold: 85
  },
  iops: {
    min: 1000,
    max: 50000,
    variance: 0.15,
    trend: 0,
    unit: 'ops',
    warningThreshold: 40000,
    criticalThreshold: 45000
  },
  latency: {
    min: 0.5,
    max: 50,
    variance: 0.2,
    trend: 0,
    unit: 'ms',
    warningThreshold: 20,
    criticalThreshold: 35
  },
  throughput: {
    min: 100,
    max: 10000,
    variance: 0.1,
    trend: 0.02,
    unit: 'MB/s',
    warningThreshold: 8000,
    criticalThreshold: 9000
  },
  scrubErrors: {
    min: 0,
    max: 10,
    variance: 0.3,
    trend: -0.01,
    unit: 'errors',
    warningThreshold: 3,
    criticalThreshold: 5
  },
  pgInconsistency: {
    min: 0,
    max: 5,
    variance: 0.4,
    trend: -0.02,
    unit: 'count',
    warningThreshold: 2,
    criticalThreshold: 3
  },
  networkErrors: {
    min: 0,
    max: 100,
    variance: 0.2,
    trend: 0,
    unit: 'errors',
    warningThreshold: 30,
    criticalThreshold: 50
  },
  osdPerformance: {
    min: 0,
    max: 100,
    variance: 0.1,
    trend: 0.005,
    unit: '%',
    warningThreshold: 80,
    criticalThreshold: 90
  }
}

function generateNextValue(prevValue: number, config: MetricConfig): number {
  const { min, max, variance, trend } = config
  // Add some randomness with sinusoidal patterns for more realistic data
  const time = Date.now() / 1000
  const sineWave = Math.sin(time * 0.001) * 0.1
  const change = prevValue * variance * (Math.random() - 0.5 + trend + sineWave)
  return Math.max(min, Math.min(max, prevValue + change))
}

function generateInitialData(config: MetricConfig, points: number = 60): MetricDataPoint[] {
  const data: MetricDataPoint[] = []
  let value = (config.max - config.min) / 2 + config.min
  const now = Date.now()

  for (let i = 0; i < points; i++) {
    data.push({
      timestamp: now - (points - i) * 5000,
      value: value,
      label: new Date(now - (points - i) * 5000).toLocaleTimeString()
    })
    value = generateNextValue(value, config)
  }

  return data
}

export const useRealtimeStore = create<RealtimeStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      isActive: false,
      updateInterval: null,
      chartMetrics: {
        poolUsage: generateInitialData(metricConfigs.poolUsage),
        iops: generateInitialData(metricConfigs.iops),
        latency: generateInitialData(metricConfigs.latency),
        throughput: generateInitialData(metricConfigs.throughput),
        scrubErrors: generateInitialData(metricConfigs.scrubErrors),
        pgInconsistency: generateInitialData(metricConfigs.pgInconsistency),
        networkErrors: generateInitialData(metricConfigs.networkErrors),
        osdPerformance: generateInitialData(metricConfigs.osdPerformance)
      },
      lastUpdate: new Date(),
      connectionStatus: 'disconnected',

      // Start realtime updates
      startRealTimeUpdates: () => {
        const { isActive, updateInterval } = get()
        if (isActive || updateInterval) return

        const interval = setInterval(() => {
          get().generateRealtimeData()
        }, 5000) // Update every 5 seconds

        set((state) => {
          state.isActive = true
          state.updateInterval = interval
          state.lastUpdate = new Date()
          state.connectionStatus = 'connected'
        })

        console.log('🚀 Realtime data updates started')
      },

      // Stop realtime updates
      stopRealTimeUpdates: () => {
        const { updateInterval } = get()

        if (updateInterval) {
          clearInterval(updateInterval)
        }

        set((state) => {
          state.isActive = false
          state.updateInterval = null
          state.connectionStatus = 'disconnected'
        })

        console.log('🛑 Realtime data updates stopped')
      },

      // Generate realtime data with AI-like patterns
      generateRealtimeData: () => {
        set((state) => {
          const now = Date.now()
          const timeLabel = new Date(now).toLocaleTimeString()

          // Generate correlated data for more realistic patterns
          const loadFactor = Math.random() // Overall system load

          Object.keys(state.chartMetrics).forEach((key) => {
            const metricKey = key as keyof ChartMetrics
            const config = metricConfigs[metricKey]
            const currentData = state.chartMetrics[metricKey]
            const lastValue = currentData.length > 0
              ? currentData[currentData.length - 1].value
              : config.min

            // Apply load factor to certain metrics for correlation
            let newValue = generateNextValue(lastValue, config)
            if (['iops', 'throughput', 'osdPerformance'].includes(metricKey)) {
              newValue = newValue * (0.5 + loadFactor * 0.5)
            }

            const newDataPoint: MetricDataPoint = {
              timestamp: now,
              value: newValue,
              label: timeLabel
            }

            // Keep last 60 points (5 minutes of data)
            state.chartMetrics[metricKey] = [...currentData, newDataPoint].slice(-60)
          })

          state.lastUpdate = new Date()
        })
      },

      // Set chart metrics
      setChartMetrics: (metrics) => {
        set((state) => {
          Object.assign(state.chartMetrics, metrics)
          state.lastUpdate = new Date()
        })
      },

      // Update single metric
      updateSingleMetric: (key, data) => {
        set((state) => {
          state.chartMetrics[key] = data
          state.lastUpdate = new Date()
        })
      },

      // Set connection status
      setConnectionStatus: (status) => {
        set((state) => {
          state.connectionStatus = status
        })
      },

      // Get latest values
      getLatestValues: () => {
        const state = get()
        const latest: Partial<Record<keyof ChartMetrics, number>> = {}

        Object.entries(state.chartMetrics).forEach(([key, data]) => {
          const metricKey = key as keyof ChartMetrics
          latest[metricKey] = data.length > 0 ? data[data.length - 1].value : 0
        })

        return latest
      },

      // Get metric status based on thresholds
      getMetricStatus: (key) => {
        const state = get()
        const data = state.chartMetrics[key]
        if (data.length === 0) return 'normal'

        const latestValue = data[data.length - 1].value
        const config = metricConfigs[key]

        if (config.criticalThreshold && latestValue >= config.criticalThreshold) {
          return 'critical'
        }
        if (config.warningThreshold && latestValue >= config.warningThreshold) {
          return 'warning'
        }
        return 'normal'
      }
    }))
  )
)

// Selective subscription hooks for performance
export const useChartMetric = (metricKey: keyof ChartMetrics) =>
  useRealtimeStore((state) => state.chartMetrics[metricKey])

export const useMetricStatus = (metricKey: keyof ChartMetrics) =>
  useRealtimeStore((state) => state.getMetricStatus(metricKey))

export const useConnectionStatus = () =>
  useRealtimeStore((state) => state.connectionStatus)

export const useLatestValues = () =>
  useRealtimeStore((state) => state.getLatestValues())

// Export configs for use in components
export { metricConfigs }