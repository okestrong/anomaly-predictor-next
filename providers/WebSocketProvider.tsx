'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRealtimeStore } from '@/stores/realtimeData';
import { useClusterStore } from '@/stores/cluster';
import { useAnomalyStore } from '@/stores/anomaly';

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastMessage: any;
  sendMessage: (message: any) => void;
  connect: (url?: string) => void;
  disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function WebSocketProvider({
  children,
  url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws',
  autoConnect = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 10
}: WebSocketProviderProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<WebSocketContextType['connectionStatus']>('disconnected');
  const [lastMessage, setLastMessage] = useState<any>(null);

  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Store actions
  const { setConnectionStatus: setRealtimeStatus, setChartMetrics, updateSingleMetric } = useRealtimeStore();
  const { setStatus: updateClusterStatus, setOSDs: updateNodes, setPools: updatePools } = useClusterStore();
  const { addAnomalyAlert: addAnomaly, setAnomalyScore: updateAnomalyScore } = useAnomalyStore();

  const connect = (wsUrl: string = url) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      setConnectionStatus('connecting');
      setRealtimeStatus('connecting');

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = (event) => {
        console.log('🔗 WebSocket connected:', event);
        setSocket(ws);
        setIsConnected(true);
        setConnectionStatus('connected');
        setRealtimeStatus('connected');
        reconnectAttempts.current = 0;

        // Send initial connection message and subscribe to dashboard topics
        ws.send(JSON.stringify({
          type: 'connection',
          client: 'anomaly-predictor-dashboard',
          timestamp: Date.now()
        }));

        // Subscribe to dashboard data topics from predictor-api backend
        const subscribeMessage = {
          type: 'subscribe',
          topics: [
            '/topic/dashboard/cluster-status',
            '/topic/dashboard/capacity',
            '/topic/dashboard/metrics',
            '/topic/dashboard/risks',
            '/topic/dashboard/insights'
          ],
          client: 'anomaly-predictor-dashboard',
          timestamp: Date.now()
        };

        // Send subscription request after a brief delay to ensure connection is established
        setTimeout(() => {
          ws.send(JSON.stringify(subscribeMessage));
        }, 500);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setSocket(null);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        setRealtimeStatus('disconnected');
        socketRef.current = null;

        // Attempt reconnection if not manually closed
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.warn('⚠️ WebSocket connection failed - Backend may not be running:', {
          url: wsUrl,
          readyState: ws.readyState,
          error: error
        });
        setConnectionStatus('error');
        setRealtimeStatus('error');
        scheduleReconnect();
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
      setRealtimeStatus('error');
    }
  };

  const disconnect = () => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close(1000, 'Manual disconnect');
      socketRef.current = null;
    }

    setSocket(null);
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setRealtimeStatus('disconnected');
    reconnectAttempts.current = 0;
  };

  const scheduleReconnect = () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      setConnectionStatus('error');
      return;
    }

    reconnectAttempts.current++;
    console.log(`Scheduling reconnection attempt ${reconnectAttempts.current}/${maxReconnectAttempts} in ${reconnectInterval}ms`);

    reconnectTimer.current = setTimeout(() => {
      connect();
    }, reconnectInterval);
  };

  const sendMessage = (message: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  };

  const handleMessage = (data: any) => {
    const { type, payload, timestamp } = data;

    switch (type) {
      // Dashboard data types from predictor-api backend
      case 'CLUSTER_STATUS':
        handleDashboardClusterStatus(payload);
        break;

      case 'CAPACITY_STATUS':
        handleDashboardCapacity(payload);
        break;

      case 'CHART_METRICS':
        handleDashboardMetrics(payload);
        break;

      case 'RISK_STATUS':
        handleDashboardRisks(payload);
        break;

      case 'AI_INSIGHTS':
        handleDashboardInsights(payload);
        break;

      // Legacy message types
      case 'metrics':
        handleMetricsUpdate(payload);
        break;

      case 'cluster_status':
        updateClusterStatus(payload);
        break;

      case 'node_update':
        updateNodes(payload.nodes || []);
        break;

      case 'pool_update':
        updatePools(payload.pools || []);
        break;

      case 'anomaly':
        handleAnomalyUpdate(payload);
        break;

      case 'realtime_data':
        handleRealtimeData(payload);
        break;

      case 'heartbeat':
        // Send heartbeat response
        sendMessage({
          type: 'heartbeat_response',
          timestamp: Date.now()
        });
        break;

      default:
        console.log('Unknown message type:', type, payload);
    }
  };

  const handleMetricsUpdate = (metrics: any) => {
    // Convert server metrics to chart format
    const chartMetrics: any = {};

    if (metrics.pool_usage) {
      chartMetrics.poolUsage = metrics.pool_usage.map((point: any) => ({
        timestamp: point.timestamp || Date.now(),
        value: point.usage_percent || 0,
        label: new Date(point.timestamp || Date.now()).toLocaleTimeString()
      }));
    }

    if (metrics.iops) {
      chartMetrics.iops = metrics.iops.map((point: any) => ({
        timestamp: point.timestamp || Date.now(),
        value: point.read_ops + point.write_ops || 0,
        label: new Date(point.timestamp || Date.now()).toLocaleTimeString()
      }));
    }

    if (metrics.latency) {
      chartMetrics.latency = metrics.latency.map((point: any) => ({
        timestamp: point.timestamp || Date.now(),
        value: point.avg_latency || 0,
        label: new Date(point.timestamp || Date.now()).toLocaleTimeString()
      }));
    }

    if (metrics.throughput) {
      chartMetrics.throughput = metrics.throughput.map((point: any) => ({
        timestamp: point.timestamp || Date.now(),
        value: (point.read_bytes + point.write_bytes) / 1024 / 1024 || 0, // Convert to MB/s
        label: new Date(point.timestamp || Date.now()).toLocaleTimeString()
      }));
    }

    setChartMetrics(chartMetrics);
  };

  const handleAnomalyUpdate = (anomaly: any) => {
    // Update anomaly score
    if (anomaly.score !== undefined) {
      updateAnomalyScore(anomaly.score);
    }

    // Add new anomaly if provided
    if (anomaly.details) {
      addAnomaly({
        id: anomaly.id || `anomaly-${Date.now()}`,
        timestamp: new Date(anomaly.timestamp || Date.now()),
        score: anomaly.score || 0,
        severity: anomaly.severity || 'medium',
        message: anomaly.message || 'Anomaly detected',
        type: anomaly.type || 'detection',
        component: anomaly.component || 'system',
        resolved: false
      });
    }
  };

  const handleRealtimeData = (data: any) => {
    // Handle real-time data stream for live feeds
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        updateSingleMetric(key as any, value);
      }
    });
  };

  // Dashboard data handlers for predictor-api backend
  const handleDashboardClusterStatus = (data: any) => {
    console.log('📊 Received cluster status from backend:', data);

    // Update cluster store with comprehensive status data
    updateClusterStatus({
      health: data.health || 'HEALTH_OK',
      version: data.version || '18.2.0',
      fsid: data.fsid || '',
      clusterName: data.clusterName || 'Ceph Cluster',
      timestamp: data.timestamp || Date.now(),
      osds: {
        up: data.osds?.up || 0,
        in: data.osds?.in || 0,
        down: data.osds?.down || 0,
        out: data.osds?.out || 0,
        total: data.osds?.total || 0
      },
      monitors: data.monitors || [],
      lastUpdated: new Date(data.timestamp || Date.now()).toISOString()
    });

    // Update OSDs data if available
    if (data.osds) {
      const osdNodes = Array.from({ length: data.osds.total }, (_, i) => ({
        id: i,
        name: `osd.${i}`,
        health: (i < data.osds.up ? 'healthy' : 'down') as 'healthy' | 'warning' | 'error' | 'down',
        in: i < data.osds.in,
        up: i < data.osds.up,
        weight: 1.0,
        primaryAffinity: 1.0,
        utilization: Math.floor(Math.random() * 80) + 10,
        variance: 1.0,
        pgCount: Math.floor(Math.random() * 100) + 50,
        host: `node-${Math.floor(i / 3) + 1}`,
        rack: `rack-${Math.floor(i / 9) + 1}`,
        root: 'default'
      }));
      updateNodes(osdNodes);
    }

    // Update performance metrics in realtime store
    if (data.performance) {
      updateSingleMetric('iops_read', [{
        timestamp: data.timestamp || Date.now(),
        value: data.performance.iops_read,
        label: new Date().toLocaleTimeString()
      }]);
      updateSingleMetric('iops_write', [{
        timestamp: data.timestamp || Date.now(),
        value: data.performance.iops_write,
        label: new Date().toLocaleTimeString()
      }]);
      updateSingleMetric('latency', [{
        timestamp: data.timestamp || Date.now(),
        value: data.performance.latency_ms,
        label: new Date().toLocaleTimeString()
      }]);
    }
  };

  const handleDashboardCapacity = (data: any) => {
    console.log('💾 Received capacity data from backend:', data);

    // Update pools data
    if (data.pools && Array.isArray(data.pools)) {
      const poolsData = data.pools.map((pool: any, index: number) => ({
        id: index + 1,
        name: pool.name,
        size: Math.floor(pool.used_gb * 1024 * 1024 * 1024), // Convert GB to bytes
        used: Math.floor(pool.used_gb * 0.8 * 1024 * 1024 * 1024), // Mock 80% usage
        available: Math.floor(pool.used_gb * 0.2 * 1024 * 1024 * 1024),
        objects: pool.objects || 0,
        pgCount: pool.pg_count || 128,
        status: 'active'
      }));
      updatePools(poolsData);
    }

    // Update capacity metrics in realtime store
    updateSingleMetric('capacity_total', [{
      timestamp: data.timestamp || Date.now(),
      value: data.total_tb || 0,
      label: new Date().toLocaleTimeString()
    }]);
    updateSingleMetric('capacity_used', [{
      timestamp: data.timestamp || Date.now(),
      value: data.used_tb || 0,
      label: new Date().toLocaleTimeString()
    }]);
    updateSingleMetric('capacity_usage_percent', [{
      timestamp: data.timestamp || Date.now(),
      value: data.usage_percent || 0,
      label: new Date().toLocaleTimeString()
    }]);
  };

  const handleDashboardMetrics = (data: any) => {
    console.log('📈 Received chart metrics from backend:', data);

    // Update chart metrics with real backend data
    const chartMetrics: any = {};

    // Map backend metric history to frontend chart format
    Object.entries(data).forEach(([metricName, history]) => {
      if (Array.isArray(history)) {
        chartMetrics[metricName] = history.map((point: any) => ({
          timestamp: point.timestamp,
          value: point.value,
          label: point.label || new Date(point.timestamp).toLocaleTimeString()
        }));
      }
    });

    setChartMetrics(chartMetrics);
  };

  const handleDashboardRisks = (data: any) => {
    console.log('⚠️ Received risk data from backend:', data);

    // Process risk data and convert to anomaly alerts
    if (data.risks && Array.isArray(data.risks)) {
      data.risks.forEach((risk: any) => {
        // Convert risk to anomaly alert format
        const severity = risk.level === 'high' ? 'critical' :
                        risk.level === 'medium' ? 'high' :
                        'medium';

        addAnomaly({
          id: `risk-${Date.now()}-${Math.random()}`,
          timestamp: new Date(data.timestamp || Date.now()),
          score: risk.level === 'high' ? 85 : risk.level === 'medium' ? 65 : 45,
          severity: severity as 'low' | 'medium' | 'high' | 'critical',
          message: risk.description || risk.title,
          type: 'risk',
          component: 'cluster',
          resolved: false
        });
      });
    }

    // Update anomaly score based on overall risk assessment
    const totalRisks = data.total_risks || 0;
    const highRisks = data.high_risks || 0;
    const riskScore = Math.min(100, (highRisks * 30) + ((totalRisks - highRisks) * 10));
    updateAnomalyScore(riskScore);
  };

  const handleDashboardInsights = (data: any) => {
    console.log('🤖 Received AI insights from backend:', data);

    // Process AI insights and convert to appropriate store updates
    if (Array.isArray(data)) {
      data.forEach((insight: any) => {
        // Convert insights to anomaly alerts with info severity
        if (insight.severity === 'warning' || insight.severity === 'error') {
          const severity = insight.severity === 'error' ? 'high' : 'medium';

          addAnomaly({
            id: `insight-${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            score: insight.severity === 'error' ? 75 : 50,
            severity: severity as 'low' | 'medium' | 'high' | 'critical',
            message: insight.description || insight.title,
            type: 'ai_insight',
            component: 'predictor',
            resolved: false
          });
        }
      });
    }
  };

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      disconnect();
    };
  }, []);

  const contextValue: WebSocketContextType = {
    socket: socketRef.current,
    isConnected,
    connectionStatus,
    lastMessage,
    sendMessage,
    connect,
    disconnect
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

// Hook for sending specific Ceph commands
export function useCephCommands() {
  const { sendMessage, isConnected } = useWebSocket();

  const executeCommand = (command: string) => {
    if (!isConnected) {
      console.warn('WebSocket not connected, cannot execute command:', command);
      return Promise.reject(new Error('WebSocket not connected'));
    }

    return new Promise((resolve, reject) => {
      const commandId = `cmd-${Date.now()}`;

      sendMessage({
        type: 'ceph_command',
        command_id: commandId,
        command,
        timestamp: Date.now()
      });

      // TODO: Implement command response handling
      // For now, just resolve after a timeout
      setTimeout(() => {
        resolve(`Command executed: ${command}`);
      }, 1000);
    });
  };

  return { executeCommand };
}

// Hook for requesting specific data
export function useDataRequests() {
  const { sendMessage, isConnected } = useWebSocket();

  const requestClusterStatus = () => {
    if (isConnected) {
      sendMessage({
        type: 'request',
        data_type: 'cluster_status',
        timestamp: Date.now()
      });
    }
  };

  const requestMetrics = (timeRange: string = '1h') => {
    if (isConnected) {
      sendMessage({
        type: 'request',
        data_type: 'metrics',
        time_range: timeRange,
        timestamp: Date.now()
      });
    }
  };

  const requestAnomalyAnalysis = () => {
    if (isConnected) {
      sendMessage({
        type: 'request',
        data_type: 'anomaly_analysis',
        timestamp: Date.now()
      });
    }
  };

  return {
    requestClusterStatus,
    requestMetrics,
    requestAnomalyAnalysis
  };
}