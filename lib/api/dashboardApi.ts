import { apiClient, ApiError } from './client';
import { Client, IMessage } from '@stomp/stompjs';

// Dashboard Data Types
export interface DashboardData {
   capacity: CapacityData;
   clusterHealth: ClusterHealthData;
   riskAssessment: RiskAssessmentData;
   charts: ChartData | null; // null when fetching fast data
   alerts: AlertData[];
   aiInsights: AIInsightData[];
   timestamp: number;
   dataSource: string;
}

export interface CapacityData {
   totalBytes: number; // Total capacity in bytes
   usedBytes: number; // Used capacity in bytes
   availableBytes: number; // Available capacity in bytes
   usagePercent: number; // Usage percentage (0-100)
   dailyGrowthBytes: number; // Daily growth in bytes
   timeToFullDays: number; // Days until full capacity
   growthTrend: 'increasing' | 'stable' | 'decreasing' | 'unknown';
   pools?: PoolCapacity[]; // Pool capacity list
   usageTrend?: number[]; // 7-day usage trend (0-100)
}

export interface PoolCapacity {
   name: string; // Pool name
   usedBytes: number; // Used capacity in bytes
   usagePercent: number; // Usage percentage (0-100)
   type: 'replicated' | 'erasure'; // Pool type
}

export interface ClusterHealthData {
   status: string; // HEALTH_OK, HEALTH_WARN, HEALTH_ERR
   message: string;
   osds: {
      total: number;
      up: number;
      in: number;
      down: number;
      out: number;
      averageUsage: number;
   };
   monitors: {
      total: number;
      active: number;
      standby: number;
   };
   pgs: {
      total: number;
      activeClean: number;
      scrubbing: number;
      degraded: number;
      recovering: number;
   };
   uptime: number;
   version: string;
}

export interface RiskAssessmentData {
   overallRisk: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
   riskScore: number; // 0-100
   risks: RiskItem[];
   riskFactors?: RiskFactor[]; // Optional for backward compatibility
   recommendations: Recommendation[];
   lastAnalysisTime?: string; // ISO date string or formatted time
}

export interface RiskItem {
   level: 'low' | 'medium' | 'high' | 'critical';
   category: string;
   title: string;
   description: string;
   timestamp: number;
}

export interface RiskFactor {
   type: string; // osd, storage, memory, cpu, network, scrub, performance
   title: string;
   description: string;
   severity: 'low' | 'medium' | 'high' | 'critical';
   impact: number; // 0-100
   eta: string; // e.g., "2 hours", "3 days"
}

export interface Recommendation {
   action: string;
   priority: 'High' | 'Medium' | 'Low';
}

export interface ChartData {
   poolUsage: PoolUsageChart;
   iops: IopsChart;
   latency: LatencyChart;
   throughput: ThroughputChart;
   osdPerformance: OsdPerformanceChart;
   networkError: NetworkErrorChart;
   scrubError: ScrubErrorChart;
   pgInconsistency: PgInconsistencyChart;
}

export interface DataPoint {
   timestamp: number;
   value: number;
   label?: string;
}

export interface PoolUsageChart {
   data: DataPoint[];
   currentUsage: number;
   trend: string;
}

export interface IopsChart {
   readIops: DataPoint[];
   writeIops: DataPoint[];
   currentReadIops: number;
   currentWriteIops: number;
}

export interface LatencyChart {
   data: DataPoint[];
   currentLatency: number;
   averageLatency: number;
}

export interface ThroughputChart {
   readThroughput: DataPoint[];
   writeThroughput: DataPoint[];
   currentReadMb: number;
   currentWriteMb: number;
}

export interface OsdPerformanceChart {
   data: DataPoint[]; // Deprecated: for backward compatibility
   averagePerformance: number;
   slowOsds: number;

   // 복합 차트 데이터
   averageUtilization?: DataPoint[]; // Average Utilization
   maxUtilization?: DataPoint[]; // Max Utilization
   errorCount?: DataPoint[]; // Error Count
}

export interface NetworkErrorChart {
   data: DataPoint[]; // Deprecated: for backward compatibility
   totalErrors: number;
   errorRate: number;

   // 복합 차트 데이터
   networkErrors?: DataPoint[]; // Network Errors
   packetDrops?: DataPoint[]; // Packet Drops
}

export interface ScrubErrorChart {
   data: DataPoint[]; // Deprecated: for backward compatibility
   totalErrors: number;
   lastScrubTime: number;

   // 복합 차트 데이터
   lightScrubErrors?: DataPoint[]; // Light scrub errors
   deepScrubErrors?: DataPoint[]; // Deep scrub errors
   repairOperations?: DataPoint[]; // Repair operations
   inconsistentPgs?: DataPoint[]; // Inconsistent PGs
}

export interface PgInconsistencyChart {
   data: DataPoint[]; // Deprecated: for backward compatibility
   inconsistentPgs: number;
   inconsistencyRate: number;

   // 복합 차트 데이터
   inconsistent?: DataPoint[]; // Inconsistent PGs
   recovery?: DataPoint[]; // Recovery PGs
   backfill?: DataPoint[]; // Backfill PGs
   degraded?: DataPoint[]; // Degraded PGs
   misplaced?: DataPoint[]; // Misplaced PGs
}

export interface AlertData {
   id: string;
   severity: 'info' | 'warning' | 'error' | 'critical';
   type: string;
   source: string; // Alert source (e.g., "Prometheus", "OSD Monitor")
   component: string;
   message: string;
   description: string;
   timestamp: number;
   resolved: boolean;
   read: boolean; // Whether the alert has been read by the user
   count: number; // Number of occurrences
   aiSuggestion?: string; // AI-generated suggestion for resolving the alert
   affectedComponents: string[];
}

export interface AIInsightData {
   id: string;
   title: string;
   description: string;
   severity: 'low' | 'medium' | 'high' | 'critical';
   category: string;
   confidence: number;
   recommendations: string[];
   timestamp: number;
   metadata: Record<string, any>;
}

// API Functions
export class DashboardAPI {
   /**
    * Get dashboard data (fast - without charts)
    * ⚠️ IMPORTANT: This endpoint excludes charts for faster loading.
    * Use getCharts() separately or getDashboardOverviewWithCharts() for complete data.
    */
   static async getDashboardOverview(): Promise<DashboardData> {
      return await apiClient.get<DashboardData>('/api/dashboard/overview');
   }

   static async getPoolUsage(): Promise<PoolUsageChart> {
      return await apiClient.get<PoolUsageChart>('/api/dashboard/pool-usage');
   }
   static async getIops(): Promise<IopsChart> {
      return await apiClient.get<IopsChart>('/api/dashboard/iops');
   }
   static async getLatency(): Promise<LatencyChart> {
      return await apiClient.get<LatencyChart>('/api/dashboard/latency');
   }
   static async getThroughput(): Promise<ThroughputChart> {
      return await apiClient.get<ThroughputChart>('/api/dashboard/throughput');
   }
   static async getOsdPerf(): Promise<OsdPerformanceChart> {
      return await apiClient.get<OsdPerformanceChart>('/api/dashboard/osd-perf');
   }
   static async getNetworkErr(): Promise<NetworkErrorChart> {
      return await apiClient.get<NetworkErrorChart>('/api/dashboard/network-error');
   }
   static async getScrubErr(): Promise<ScrubErrorChart> {
      return await apiClient.get<ScrubErrorChart>('/api/dashboard/scrub-error');
   }
   static async getPgInconsis(): Promise<PgInconsistencyChart> {
      return await apiClient.get<PgInconsistencyChart>('/api/dashboard/pg-inconsistency');
   }

   /**
    * Get storage capacity data
    */
   static async getCapacity(): Promise<CapacityData> {
      return await apiClient.get<CapacityData>('/api/dashboard/capacity');
   }

   /**
    * Get cluster health data
    */
   static async getClusterHealth(): Promise<ClusterHealthData> {
      return await apiClient.get<ClusterHealthData>('/api/dashboard/cluster-health');
   }

   /**
    * Get risk assessment data
    */
   static async getRiskAssessment(): Promise<RiskAssessmentData> {
      return await apiClient.get<RiskAssessmentData>('/api/dashboard/risk-assessment');
   }

   /**
    * Get all chart data
    */
   static async getCharts(): Promise<ChartData> {
      return await apiClient.get<ChartData>('/api/dashboard/charts');
   }

   /**
    * Get specific chart data
    */
   static async getSpecificChart(chartType: string): Promise<any> {
      return await apiClient.get(`/api/dashboard/charts/${chartType}`);
   }

   /**
    * Get alerts
    */
   static async getAlerts(): Promise<AlertData[]> {
      return await apiClient.get<AlertData[]>('/api/dashboard/alerts');
   }

   /**
    * Get AI insights
    */
   static async getAIInsights(): Promise<AIInsightData[]> {
      return await apiClient.get<AIInsightData[]>('/api/dashboard/ai-insights');
   }

   /**
    * Refresh dashboard data
    */
   static async refreshDashboard(): Promise<{ status: string; message: string; timestamp: number }> {
      return await apiClient.post('/api/dashboard/refresh');
   }

   /**
    * Get dashboard status
    */
   static async getDashboardStatus(): Promise<{
      status: string;
      service: string;
      timestamp: number;
      lastUpdate: number;
      dataSource: string;
   }> {
      return await apiClient.get('/api/dashboard/status');
   }

   /**
    * Mark an alert as read
    */
   static async markAlertAsRead(alertId: string): Promise<{ status: string; message: string; timestamp: number }> {
      return await apiClient.post(`/api/dashboard/alerts/${alertId}/mark-read`);
   }

   /**
    * Dismiss (remove) an alert
    */
   static async dismissAlert(alertId: string): Promise<{ status: string; message: string; timestamp: number }> {
      return await apiClient.post(`/api/dashboard/alerts/${alertId}/dismiss`);
   }

   /**
    * Mark all alerts as read
    */
   static async markAllAlertsAsRead(): Promise<{ status: string; message: string; timestamp: number }> {
      return await apiClient.post('/api/dashboard/alerts/mark-all-read');
   }
}

// WebSocket Types
export interface WebSocketMessage {
   type: string;
   timestamp: number;
   data: any;
}

export interface DashboardWebSocketData {
   type: 'dashboard_data' | 'dashboard_update' | 'DASHBOARD_UPDATE' | 'CHART_UPDATE' | 'error' | 'pong';
   timestamp: number;
   data: DashboardData | ChartData | string;
}

// WebSocket Connection Management using STOMP
export class DashboardWebSocket {
   private stompClient: Client | null = null;
   private reconnectAttempts = 0;
   private maxReconnectAttempts = 5;
   private reconnectDelay = 1000;
   private isConnecting = false;

   constructor(
      private onMessage: (data: DashboardWebSocketData) => void,
      private onConnectionChange: (connected: boolean) => void,
      private onError: (error: any) => void,
   ) {}

   connect(baseUrl: string = process.env.NEXT_PUBLIC_DASHBOARD_WS_URL || 'http://localhost:8080') {
      // SockJS requires http/https URL, not ws/wss
      // Convert ws:// to http:// and wss:// to https://
      let httpUrl = baseUrl;
      if (httpUrl.startsWith('ws://')) {
         httpUrl = httpUrl.replace('ws://', 'http://');
      } else if (httpUrl.startsWith('wss://')) {
         httpUrl = httpUrl.replace('wss://', 'https://');
      }

      const url = `${httpUrl}/ws/dashboard`;

      if (this.isConnecting || (this.stompClient && this.stompClient.connected)) {
         return;
      }

      this.isConnecting = true;

      try {
         // Create STOMP client with SockJS
         this.stompClient = new Client({
            brokerURL: undefined, // We'll use webSocketFactory instead
            webSocketFactory: () => {
               // Use SockJS for compatibility
               const SockJS = require('sockjs-client');
               return new SockJS(url);
            },
            reconnectDelay: this.reconnectDelay,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            connectionTimeout: 5000,

            onConnect: frame => {
               console.log('Dashboard STOMP connected:', frame);
               this.isConnecting = false;
               this.reconnectAttempts = 0;
               this.onConnectionChange(true);

               // Subscribe to dashboard topics
               this.stompClient?.subscribe('/topic/dashboard', (message: IMessage) => {
                  try {
                     const messageData = JSON.parse(message.body);
                     // Backend sends: { type: "DASHBOARD_UPDATE", data: {...}, timestamp: ... }
                     // Extract the nested data field
                     this.onMessage({
                        type: messageData.type || 'DASHBOARD_UPDATE',
                        timestamp: messageData.timestamp || Date.now(),
                        data: messageData.data,
                     });
                  } catch (error) {
                     console.error('Error parsing STOMP dashboard message:', error);
                  }
               });

               // Subscribe to chart updates
               this.stompClient?.subscribe('/topic/dashboard/charts', (message: IMessage) => {
                  try {
                     const messageData = JSON.parse(message.body);
                     // Backend sends: { type: "CHART_UPDATE", data: { poolUsage: {...}, iops: {...}, ... }, timestamp: ... }
                     this.onMessage({
                        type: messageData.type || 'CHART_UPDATE',
                        timestamp: messageData.timestamp || Date.now(),
                        data: messageData.data,
                     });
                  } catch (error) {
                     console.error('Error parsing STOMP chart message:', error);
                  }
               });

               // Subscribe to status updates
               this.stompClient?.subscribe('/topic/status', (message: IMessage) => {
                  try {
                     const data = JSON.parse(message.body);
                     console.log('Status update:', data);
                  } catch (error) {
                     console.error('Error parsing status message:', error);
                  }
               });

               // Send connection confirmation
               this.stompClient?.publish({
                  destination: '/app/connect',
                  body: JSON.stringify({ type: 'dashboard_connect' }),
               });
            },

            onDisconnect: frame => {
               console.log('Dashboard STOMP disconnected:', frame);
               this.isConnecting = false;
               this.onConnectionChange(false);

               // Attempt to reconnect
               if (this.reconnectAttempts < this.maxReconnectAttempts) {
                  this.reconnectAttempts++;
                  console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
               } else {
                  console.error('Max reconnection attempts reached');
               }
            },

            onStompError: frame => {
               console.error('STOMP error:', frame);
               this.isConnecting = false;
               this.onError(new Error(frame.headers['message'] || 'STOMP error'));
            },

            onWebSocketError: event => {
               console.error('WebSocket error:', event);
               this.isConnecting = false;
               this.onError(event);
            },

            debug: (str: string) => {
               // Uncomment for debugging
               // console.log('STOMP debug:', str);
            },
         });

         this.stompClient.activate();
      } catch (error) {
         console.error('Error creating STOMP connection:', error);
         this.isConnecting = false;
         this.onConnectionChange(false);
         this.onError(error);
      }
   }

   disconnect() {
      if (this.stompClient) {
         this.stompClient.deactivate();
         this.stompClient = null;
      }
      this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
   }

   send(message: { type: string; data?: any }) {
      if (this.stompClient && this.stompClient.connected) {
         this.stompClient.publish({
            destination: '/app/dashboard',
            body: JSON.stringify(message),
         });
      } else {
         console.warn('STOMP client is not connected');
      }
   }

   ping() {
      this.send({ type: 'ping' });
   }

   subscribe(dataType: string) {
      if (this.stompClient && this.stompClient.connected) {
         this.stompClient.publish({
            destination: '/app/subscribe',
            body: JSON.stringify({ type: 'subscribe', data: dataType }),
         });
      }
   }

   refresh() {
      this.send({ type: 'refresh' });
   }

   isConnected(): boolean {
      return this.stompClient !== null && this.stompClient.connected;
   }
}

// Cluster Topology Types for 3D Visualization
export interface ClusterTopologyData {
   hosts: HostData[];
   monitors: MonitorData[];
   timestamp: number;
}

export interface HostData {
   id: string;
   name: string;
   osds: OSDData[];
}

export interface OSDData {
   id: string; // e.g., "osd.0"
   health: 'up' | 'warning' | 'down';
   capacity: number; // Capacity in TB
   usage: number; // Usage percentage (0-100)
   host: string; // Host name
}

export interface MonitorData {
   id: string; // e.g., "mon.a"
   health: 'up' | 'warning' | 'down';
}

// Cluster Topology API
export class ClusterTopologyAPI {
   /**
    * Get cluster topology data for 3D visualization
    * Includes hosts, OSDs, and monitors with their health and capacity info
    */
   static async getClusterTopology(): Promise<ClusterTopologyData> {
      return await apiClient.get<ClusterTopologyData>('/api/dashboard/cluster-topology');
   }
}
