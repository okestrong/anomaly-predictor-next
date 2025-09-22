'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRealtimeStore } from '@/stores/realtimeData'
import { useClusterStore } from '@/stores/cluster'

interface DataGridCell {
  id: string
  value: number | string
  type: 'metric' | 'status' | 'alert' | 'normal'
  label?: string
  unit?: string
  trend?: 'up' | 'down' | 'stable'
}

interface HolographicDataGridProps {
  title?: string
  refreshInterval?: number
  maxRows?: number
  className?: string
}

// Particle effect for background
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const particlesRef = useRef<Array<{
    x: number
    y: number
    vx: number
    vy: number
    opacity: number
    size: number
  }>>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Initialize particles
    const particleCount = 50
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      size: Math.random() * 2 + 0.5
    }))

    let time = 0

    const animate = () => {
      time += 0.01
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx
        particle.y += particle.vy

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        // Update opacity with sine wave
        particle.opacity = 0.1 + 0.4 * Math.sin(time + i * 0.1)

        // Draw particle
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(34, 211, 238, ${particle.opacity})`
        ctx.fill()

        // Draw connections to nearby particles
        particlesRef.current.forEach((otherParticle, j) => {
          if (i >= j) return

          const dx = particle.x - otherParticle.x
          const dy = particle.y - otherParticle.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 80) {
            const opacity = (1 - distance / 80) * 0.2
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            ctx.strokeStyle = `rgba(124, 58, 237, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
    />
  )
}

// Data cell component
function DataCell({ cell, index }: { cell: DataGridCell; index: number }) {
  const getCellColor = (type: DataGridCell['type']) => {
    switch (type) {
      case 'alert':
        return 'border-red-400/40 bg-red-400/10 text-red-300'
      case 'metric':
        return 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
      case 'status':
        return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
      default:
        return 'border-purple-400/40 bg-purple-400/10 text-purple-300'
    }
  }

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return '↗'
      case 'down':
        return '↘'
      case 'stable':
        return '→'
      default:
        return ''
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.05, y: -2 }}
      className={`
        relative p-4 rounded-lg border backdrop-blur-sm
        ${getCellColor(cell.type)}
        hover:shadow-lg transition-all duration-300
        min-h-[100px] flex flex-col justify-between
      `}
    >
      {/* Holographic shimmer effect */}
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                     skew-x-12 w-full h-full"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        />
      </div>

      <div className="relative z-10">
        {/* Label */}
        {cell.label && (
          <div className="text-xs font-medium opacity-70 mb-2">
            {cell.label}
          </div>
        )}

        {/* Value */}
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold">{cell.value}</span>
          {cell.unit && (
            <span className="text-sm opacity-60">{cell.unit}</span>
          )}
          {cell.trend && (
            <span className="text-sm ml-auto">
              {getTrendIcon(cell.trend)}
            </span>
          )}
        </div>

        {/* Pulse indicator for alerts */}
        {cell.type === 'alert' && (
          <motion.div
            className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  )
}

export default function HolographicDataGrid({
  title = 'System Metrics',
  refreshInterval = 5000,
  maxRows = 12,
  className = ''
}: HolographicDataGridProps) {
  const [gridData, setGridData] = useState<DataGridCell[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Store data state
  const [storeData, setStoreData] = useState({
    latencyData: [] as any[],
    throughputData: [] as any[],
    cpuData: [] as any[],
    memoryData: [] as any[],
    diskIOData: [] as any[],
    networkData: [] as any[],
    clusterStatus: null as any,
    osds: [] as any[]
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const updateStoreData = () => {
      const realtimeStore = useRealtimeStore.getState()
      const clusterStore = useClusterStore.getState()

      setStoreData({
        latencyData: realtimeStore.chartMetrics.latency || [],
        throughputData: realtimeStore.chartMetrics.throughput || [],
        cpuData: realtimeStore.chartMetrics.osdPerformance || [],
        memoryData: realtimeStore.chartMetrics.poolUsage || [],
        diskIOData: realtimeStore.chartMetrics.iops || [],
        networkData: realtimeStore.chartMetrics.networkErrors || [],
        clusterStatus: clusterStore.status,
        osds: clusterStore.osds
      })
    }

    // Initial data load
    updateStoreData()

    // Subscribe to store changes
    const unsubscribeRealtime = useRealtimeStore.subscribe(updateStoreData)
    const unsubscribeCluster = useClusterStore.subscribe(updateStoreData)

    return () => {
      unsubscribeRealtime()
      unsubscribeCluster()
    }
  }, [isClient])

  useEffect(() => {
    if (!isClient) return

    const updateGridData = () => {
      setIsRefreshing(true)

      const newData: DataGridCell[] = []

      // Real-time metrics
      if (storeData.latencyData.length > 0) {
        const latency = storeData.latencyData[storeData.latencyData.length - 1]?.value || 0
        newData.push({
          id: 'latency',
          label: 'Latency',
          value: latency.toFixed(1),
          unit: 'ms',
          type: latency > 10 ? 'alert' : latency > 5 ? 'status' : 'metric',
          trend: latency > 8 ? 'up' : latency < 3 ? 'down' : 'stable'
        })
      }

      if (storeData.throughputData.length > 0) {
        const throughput = storeData.throughputData[storeData.throughputData.length - 1]?.value || 0
        newData.push({
          id: 'throughput',
          label: 'Throughput',
          value: throughput.toFixed(0),
          unit: 'MB/s',
          type: 'metric',
          trend: throughput > 800 ? 'up' : throughput < 400 ? 'down' : 'stable'
        })
      }

      if (storeData.cpuData.length > 0) {
        const cpu = storeData.cpuData[storeData.cpuData.length - 1]?.value || 0
        newData.push({
          id: 'cpu',
          label: 'CPU Usage',
          value: cpu.toFixed(1),
          unit: '%',
          type: cpu > 80 ? 'alert' : cpu > 60 ? 'status' : 'metric',
          trend: cpu > 70 ? 'up' : cpu < 30 ? 'down' : 'stable'
        })
      }

      if (storeData.memoryData.length > 0) {
        const memory = storeData.memoryData[storeData.memoryData.length - 1]?.value || 0
        newData.push({
          id: 'memory',
          label: 'Memory Usage',
          value: memory.toFixed(1),
          unit: '%',
          type: memory > 85 ? 'alert' : memory > 70 ? 'status' : 'metric',
          trend: memory > 75 ? 'up' : memory < 40 ? 'down' : 'stable'
        })
      }

      if (storeData.diskIOData.length > 0) {
        const diskIO = storeData.diskIOData[storeData.diskIOData.length - 1]?.value || 0
        newData.push({
          id: 'diskIO',
          label: 'Disk I/O',
          value: diskIO.toFixed(0),
          unit: 'IOPS',
          type: 'metric',
          trend: diskIO > 5000 ? 'up' : diskIO < 2000 ? 'down' : 'stable'
        })
      }

      if (storeData.networkData.length > 0) {
        const network = storeData.networkData[storeData.networkData.length - 1]?.value || 0
        newData.push({
          id: 'network',
          label: 'Network I/O',
          value: network.toFixed(0),
          unit: 'MB/s',
          type: 'metric',
          trend: network > 300 ? 'up' : network < 100 ? 'down' : 'stable'
        })
      }

      // Cluster status
      if (storeData.clusterStatus) {
        newData.push({
          id: 'health',
          label: 'Cluster Health',
          value: storeData.clusterStatus.health.replace('HEALTH_', ''),
          type: storeData.clusterStatus.health === 'HEALTH_ERR' ? 'alert' :
                storeData.clusterStatus.health === 'HEALTH_WARN' ? 'status' : 'normal'
        })

        newData.push({
          id: 'osds-up',
          label: 'OSDs Online',
          value: `${storeData.clusterStatus.osds.up}/${storeData.clusterStatus.osds.total}`,
          type: storeData.clusterStatus.osds.up < storeData.clusterStatus.osds.total ? 'alert' : 'status'
        })
      }

      // OSD health summary
      if (storeData.osds.length > 0) {
        const healthyOSDs = storeData.osds.filter(osd => osd.health === 'healthy').length
        const warningOSDs = storeData.osds.filter(osd => osd.health === 'warning').length
        const errorOSDs = storeData.osds.filter(osd => osd.health === 'error').length

        if (errorOSDs > 0) {
          newData.push({
            id: 'osd-errors',
            label: 'Critical OSDs',
            value: errorOSDs,
            type: 'alert'
          })
        }

        if (warningOSDs > 0) {
          newData.push({
            id: 'osd-warnings',
            label: 'Warning OSDs',
            value: warningOSDs,
            type: 'status'
          })
        }

        // Average utilization
        const avgUtil = storeData.osds.reduce((sum, osd) => sum + osd.utilization, 0) / storeData.osds.length
        newData.push({
          id: 'avg-util',
          label: 'Avg OSD Utilization',
          value: avgUtil.toFixed(1),
          unit: '%',
          type: avgUtil > 85 ? 'alert' : avgUtil > 70 ? 'status' : 'metric',
          trend: avgUtil > 75 ? 'up' : avgUtil < 50 ? 'down' : 'stable'
        })
      }

      // Limit to maxRows
      setGridData(newData.slice(0, maxRows))

      setTimeout(() => setIsRefreshing(false), 500)
    }

    updateGridData()
    const interval = setInterval(updateGridData, refreshInterval)

    return () => clearInterval(interval)
  }, [isClient, storeData, refreshInterval, maxRows])

  return (
    <div className={`relative p-6 ${className}`}>
      {/* Background particle field */}
      <ParticleField />

      {/* Header */}
      <div className="relative z-10 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400
                         bg-clip-text text-transparent">
            {title}
          </h2>

          <motion.div
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ duration: 0.5 }}
            className={`w-3 h-3 rounded-full ${
              isRefreshing ? 'bg-cyan-400' : 'bg-emerald-400'
            }`}
          />
        </div>

        <p className="text-slate-400 text-sm mt-2">
          Real-time cluster metrics and system status
        </p>
      </div>

      {/* Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {gridData.map((cell, index) => (
            <DataCell key={cell.id} cell={cell} index={index} />
          ))}
        </AnimatePresence>
      </div>

      {/* Loading overlay */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm
                       flex items-center justify-center z-20"
          >
            <div className="text-cyan-400 text-sm">Refreshing data...</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}