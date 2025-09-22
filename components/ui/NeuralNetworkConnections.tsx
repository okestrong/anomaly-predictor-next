'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface Node {
  id: string
  x: number
  y: number
  radius: number
  color: string
  pulse: boolean
  connections: string[]
  activity: number // 0-1
  type: 'cluster' | 'ai' | 'prediction' | 'anomaly' | 'storage'
}

interface Connection {
  from: string
  to: string
  activity: number // 0-1
  type: 'data' | 'analysis' | 'prediction' | 'alert'
}

interface NeuralNetworkConnectionsProps {
  width?: number
  height?: number
  nodeData?: Partial<Node>[]
  className?: string
  interactive?: boolean
}

export default function NeuralNetworkConnections({
  width = 800,
  height = 600,
  nodeData = [],
  className = '',
  interactive = true
}: NeuralNetworkConnectionsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const nodesRef = useRef<Node[]>([])
  const connectionsRef = useRef<Connection[]>([])
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  // Initialize nodes and connections
  useEffect(() => {
    const defaultNodes: Node[] = [
      {
        id: 'cluster-core',
        x: width * 0.5,
        y: height * 0.5,
        radius: 25,
        color: '#22d3ee',
        pulse: true,
        connections: ['ai-brain', 'storage-pool', 'prediction-engine'],
        activity: 0.8,
        type: 'cluster'
      },
      {
        id: 'ai-brain',
        x: width * 0.3,
        y: height * 0.3,
        radius: 20,
        color: '#7c3aed',
        pulse: true,
        connections: ['prediction-engine', 'anomaly-detector'],
        activity: 0.9,
        type: 'ai'
      },
      {
        id: 'prediction-engine',
        x: width * 0.7,
        y: height * 0.3,
        radius: 18,
        color: '#f59e0b',
        pulse: false,
        connections: ['anomaly-detector', 'storage-pool'],
        activity: 0.6,
        type: 'prediction'
      },
      {
        id: 'anomaly-detector',
        x: width * 0.7,
        y: height * 0.7,
        radius: 18,
        color: '#ef4444',
        pulse: true,
        connections: ['cluster-core'],
        activity: 0.4,
        type: 'anomaly'
      },
      {
        id: 'storage-pool',
        x: width * 0.3,
        y: height * 0.7,
        radius: 16,
        color: '#10b981',
        pulse: false,
        connections: ['cluster-core'],
        activity: 0.7,
        type: 'storage'
      },
      // Additional peripheral nodes
      {
        id: 'osd-monitor-1',
        x: width * 0.15,
        y: height * 0.5,
        radius: 12,
        color: '#06b6d4',
        pulse: false,
        connections: ['cluster-core'],
        activity: 0.5,
        type: 'storage'
      },
      {
        id: 'osd-monitor-2',
        x: width * 0.85,
        y: height * 0.5,
        radius: 12,
        color: '#06b6d4',
        pulse: false,
        connections: ['cluster-core'],
        activity: 0.6,
        type: 'storage'
      },
      {
        id: 'ml-model-1',
        x: width * 0.2,
        y: height * 0.2,
        radius: 14,
        color: '#8b5cf6',
        pulse: true,
        connections: ['ai-brain'],
        activity: 0.8,
        type: 'ai'
      },
      {
        id: 'ml-model-2',
        x: width * 0.8,
        y: height * 0.8,
        radius: 14,
        color: '#8b5cf6',
        pulse: true,
        connections: ['prediction-engine'],
        activity: 0.7,
        type: 'prediction'
      }
    ]

    // Merge with custom node data
    nodesRef.current = defaultNodes.map(node => {
      const customData = nodeData.find(custom => custom.id === node.id)
      return customData ? { ...node, ...customData } : node
    })

    // Generate connections based on node relationships
    const newConnections: Connection[] = []
    nodesRef.current.forEach(node => {
      node.connections.forEach(targetId => {
        const target = nodesRef.current.find(n => n.id === targetId)
        if (target) {
          newConnections.push({
            from: node.id,
            to: targetId,
            activity: Math.random() * 0.5 + 0.3,
            type: getConnectionType(node.type, target.type)
          })
        }
      })
    })

    connectionsRef.current = newConnections
  }, [width, height, nodeData])

  const getConnectionType = (fromType: Node['type'], toType: Node['type']): Connection['type'] => {
    if (fromType === 'ai' || toType === 'ai') return 'analysis'
    if (fromType === 'prediction' || toType === 'prediction') return 'prediction'
    if (fromType === 'anomaly' || toType === 'anomaly') return 'alert'
    return 'data'
  }

  const getConnectionColor = (type: Connection['type'], activity: number) => {
    const alpha = 0.3 + activity * 0.7
    switch (type) {
      case 'analysis':
        return `rgba(124, 58, 237, ${alpha})`
      case 'prediction':
        return `rgba(245, 158, 11, ${alpha})`
      case 'alert':
        return `rgba(239, 68, 68, ${alpha})`
      default:
        return `rgba(34, 211, 238, ${alpha})`
    }
  }

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = width
    canvas.height = height

    let time = 0

    const animate = () => {
      time += 0.02
      ctx.clearRect(0, 0, width, height)

      // Draw connections
      connectionsRef.current.forEach((connection, i) => {
        const fromNode = nodesRef.current.find(n => n.id === connection.from)
        const toNode = nodesRef.current.find(n => n.id === connection.to)

        if (!fromNode || !toNode) return

        const dx = toNode.x - fromNode.x
        const dy = toNode.y - fromNode.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Animated activity along the connection
        const pulseOffset = Math.sin(time * 2 + i * 0.5) * 0.3 + 0.7
        const activity = connection.activity * pulseOffset

        // Draw connection line
        ctx.beginPath()
        ctx.moveTo(fromNode.x, fromNode.y)
        ctx.lineTo(toNode.x, toNode.y)
        ctx.strokeStyle = getConnectionColor(connection.type, activity)
        ctx.lineWidth = 2 + activity * 3
        ctx.stroke()

        // Draw data packets traveling along connections
        const packetProgress = (time * 0.5 + i * 0.3) % 1
        const packetX = fromNode.x + dx * packetProgress
        const packetY = fromNode.y + dy * packetProgress

        ctx.beginPath()
        ctx.arc(packetX, packetY, 3 + activity * 2, 0, Math.PI * 2)
        ctx.fillStyle = getConnectionColor(connection.type, 1)
        ctx.fill()

        // Glow effect for packets
        ctx.beginPath()
        ctx.arc(packetX, packetY, 6 + activity * 4, 0, Math.PI * 2)
        ctx.fillStyle = getConnectionColor(connection.type, 0.3)
        ctx.fill()
      })

      // Draw nodes
      nodesRef.current.forEach((node, i) => {
        const pulseScale = node.pulse ?
          1 + Math.sin(time * 3 + i * 0.5) * 0.2 : 1
        const currentRadius = node.radius * pulseScale

        // Node highlight if selected or hovered
        const isHighlighted = node.id === selectedNode || node.id === hoveredNode

        // Outer glow
        ctx.beginPath()
        ctx.arc(node.x, node.y, currentRadius * 2, 0, Math.PI * 2)
        ctx.fillStyle = `${node.color}20`
        ctx.fill()

        // Main node
        ctx.beginPath()
        ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2)
        ctx.fillStyle = node.color
        ctx.fill()

        // Inner core
        ctx.beginPath()
        ctx.arc(node.x, node.y, currentRadius * 0.6, 0, Math.PI * 2)
        ctx.fillStyle = `${node.color}80`
        ctx.fill()

        // Activity indicator
        const activityAngle = node.activity * Math.PI * 2
        ctx.beginPath()
        ctx.arc(node.x, node.y, currentRadius + 5, 0, activityAngle)
        ctx.strokeStyle = node.color
        ctx.lineWidth = 3
        ctx.stroke()

        // Highlight ring
        if (isHighlighted) {
          ctx.beginPath()
          ctx.arc(node.x, node.y, currentRadius + 8, 0, Math.PI * 2)
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          ctx.stroke()
        }

        // Node type indicator
        ctx.fillStyle = '#ffffff'
        ctx.font = '12px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(
          node.type.charAt(0).toUpperCase(),
          node.x,
          node.y + 4
        )
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [width, height, selectedNode, hoveredNode])

  // Mouse interaction
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Find clicked node
    const clickedNode = nodesRef.current.find(node => {
      const dx = x - node.x
      const dy = y - node.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      return distance <= node.radius
    })

    setSelectedNode(clickedNode ? clickedNode.id : null)
  }

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Find hovered node
    const hoveredNode = nodesRef.current.find(node => {
      const dx = x - node.x
      const dy = y - node.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      return distance <= node.radius
    })

    setHoveredNode(hoveredNode ? hoveredNode.id : null)
    canvas.style.cursor = hoveredNode ? 'pointer' : 'default'
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      />

      {/* Node information overlay */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-4 right-4 p-4 bg-slate-900/90 backdrop-blur-md
                     border border-cyan-400/30 rounded-lg text-cyan-300"
        >
          <h3 className="font-semibold mb-2">{selectedNode.replace('-', ' ').toUpperCase()}</h3>
          <div className="text-sm space-y-1">
            <div>Type: {nodesRef.current.find(n => n.id === selectedNode)?.type}</div>
            <div>Activity: {((nodesRef.current.find(n => n.id === selectedNode)?.activity || 0) * 100).toFixed(0)}%</div>
            <div>Connections: {nodesRef.current.find(n => n.id === selectedNode)?.connections.length || 0}</div>
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 p-4 bg-slate-900/90 backdrop-blur-md
                     border border-purple-400/30 rounded-lg">
        <h4 className="text-purple-300 font-semibold mb-2">Network Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-cyan-400"></div>
            <span className="text-slate-300">Data Flow</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-purple-400"></div>
            <span className="text-slate-300">AI Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-amber-400"></div>
            <span className="text-slate-300">Predictions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-red-400"></div>
            <span className="text-slate-300">Alerts</span>
          </div>
        </div>
      </div>
    </div>
  )
}