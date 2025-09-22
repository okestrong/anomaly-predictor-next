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
  const { updateClusterStatus, updateNodes, updatePools } = useClusterStore();
  const { addAnomaly, updateAnomalyScore } = useAnomalyStore();

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

        // Send initial connection message
        ws.send(JSON.stringify({
          type: 'connection',
          client: 'anomaly-predictor-dashboard',
          timestamp: Date.now()
        }));
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
        console.error('❌ WebSocket error:', error);
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
        component: anomaly.component || 'system',
        status: 'active'
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