import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
   DashboardAPI,
   DashboardData,
   CapacityData,
   ClusterHealthData,
   RiskAssessmentData,
   ChartData,
   AlertData,
   AIInsightData,
   DashboardWebSocket,
   DashboardWebSocketData,
   PoolUsageChart,
   IopsChart,
   LatencyChart,
   ThroughputChart,
   OsdPerformanceChart,
   NetworkErrorChart,
   ScrubErrorChart,
   PgInconsistencyChart,
} from '@/lib/api/dashboardApi';

interface DashboardStore {
   // Data
   dashboardData: DashboardData | null;
   capacity: CapacityData | null;
   clusterHealth: ClusterHealthData | null;
   riskAssessment: RiskAssessmentData | null;
   poolUsage: PoolUsageChart | null;
   iops: IopsChart | null;
   latency: LatencyChart | null;
   throughput: ThroughputChart | null;
   osdPerf: OsdPerformanceChart | null;
   networkErr: NetworkErrorChart | null;
   scrubErr: ScrubErrorChart | null;
   pgInconsis: PgInconsistencyChart | null;
   alerts: AlertData[];
   aiInsights: AIInsightData[];

   // Loading states
   isLoading: boolean;
   isRefreshing: boolean;
   lastUpdate: number | null;
   error: string | null;

   // WebSocket
   webSocket: DashboardWebSocket | null;
   isConnected: boolean;
   connectionError: string | null;

   // Actions
   initializeDashboard: () => Promise<void>;
   refreshDashboard: () => Promise<void>;
   connectWebSocket: () => void;
   disconnectWebSocket: () => void;
   setError: (error: string | null) => void;
   clearError: () => void;

   // Individual data fetchers
   fetchCapacity: () => Promise<void>;
   fetchClusterHealth: () => Promise<void>;
   fetchRiskAssessment: () => Promise<void>;
   fetchChartPoolUsage: () => Promise<void>;
   fetchChartIops: () => Promise<void>;
   fetchChartLatency: () => Promise<void>;
   fetchChartThroughput: () => Promise<void>;
   fetchChartOsdPerf: () => Promise<void>;
   fetchChartNetworkErr: () => Promise<void>;
   fetchChartScrubErr: () => Promise<void>;
   fetchChartPgInconsis: () => Promise<void>;
   fetchAlerts: () => Promise<void>;
   fetchAIInsights: () => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>()(
   devtools(
      immer((set, get) => ({
         // Initial state
         dashboardData: null,
         capacity: null,
         clusterHealth: null,
         riskAssessment: null,
         poolUsage: null,
         iops: null,
         latency: null,
         throughput: null,
         osdPerf: null,
         networkErr: null,
         scrubErr: null,
         pgInconsis: null,
         alerts: [],
         aiInsights: [],
         isLoading: false,
         isRefreshing: false,
         lastUpdate: null,
         error: null,
         webSocket: null,
         isConnected: false,
         connectionError: null,

         // Initialize dashboard - fetch initial data and connect WebSocket
         initializeDashboard: async () => {
            set(state => {
               state.isLoading = true;
               state.error = null;
            });

            try {
               // Fetch initial dashboard data (fast - without charts)
               const data = await DashboardAPI.getDashboardOverview();
               set(state => {
                  state.dashboardData = data;
                  state.capacity = data.capacity;
                  state.clusterHealth = data.clusterHealth;
                  state.riskAssessment = data.riskAssessment;
                  state.alerts = data.alerts;
                  state.aiInsights = data.aiInsights;
                  state.lastUpdate = data.timestamp;
                  state.isLoading = false;
               });

               // Connect WebSocket for real-time updates
               get().connectWebSocket();

               // Fetch all charts in parallel (non-blocking)
               Promise.all([
                  get().fetchChartPoolUsage(),
                  get().fetchChartIops(),
                  get().fetchChartLatency(),
                  get().fetchChartThroughput(),
                  get().fetchChartOsdPerf(),
                  get().fetchChartNetworkErr(),
                  get().fetchChartScrubErr(),
                  get().fetchChartPgInconsis(),
               ]).catch(error => {
                  console.error('Error fetching charts in background:', error);
                  // Don't set error state - this is a non-critical background operation
               });
            } catch (error) {
               console.error('Error initializing dashboard:', error);
               set(state => {
                  state.error = error instanceof Error ? error.message : 'Failed to initialize dashboard';
                  state.isLoading = false;
               });
            }
         },

         // Refresh dashboard data
         refreshDashboard: async () => {
            set(state => {
               state.isRefreshing = true;
               state.error = null;
            });

            try {
               // Fetch dashboard data (fast - without charts)
               const data = await DashboardAPI.getDashboardOverview();

               set(state => {
                  state.dashboardData = data;
                  state.capacity = data.capacity;
                  state.clusterHealth = data.clusterHealth;
                  state.riskAssessment = data.riskAssessment;
                  state.alerts = data.alerts;
                  state.aiInsights = data.aiInsights;
                  state.lastUpdate = data.timestamp;
                  state.isRefreshing = false;
               });

               // Fetch all charts in parallel (non-blocking)
               Promise.all([
                  get().fetchChartPoolUsage(),
                  get().fetchChartIops(),
                  get().fetchChartLatency(),
                  get().fetchChartThroughput(),
                  get().fetchChartOsdPerf(),
                  get().fetchChartNetworkErr(),
                  get().fetchChartScrubErr(),
                  get().fetchChartPgInconsis(),
               ]).catch(error => {
                  console.error('Error fetching charts in background:', error);
                  // Don't set error state - this is a non-critical background operation
               });
            } catch (error) {
               console.error('Error refreshing dashboard:', error);
               set(state => {
                  state.error = error instanceof Error ? error.message : 'Failed to refresh dashboard';
                  state.isRefreshing = false;
               });
            }
         },

         // Connect WebSocket
         connectWebSocket: () => {
            const { webSocket } = get();

            // Disconnect existing connection if any
            if (webSocket) {
               webSocket.disconnect();
            }

            const newWebSocket = new DashboardWebSocket(
               // onMessage handler
               (data: DashboardWebSocketData) => {
                  console.log('WebSocket message received:', data.type, 'at', new Date(data.timestamp).toLocaleTimeString());

                  if (data.type === 'dashboard_data' || data.type === 'dashboard_update' || data.type === 'DASHBOARD_UPDATE') {
                     const dashboardData = data.data as DashboardData;

                     set(state => {
                        state.dashboardData = dashboardData;
                        state.capacity = dashboardData.capacity;
                        state.clusterHealth = dashboardData.clusterHealth;
                        state.riskAssessment = dashboardData.riskAssessment;
                        state.alerts = dashboardData.alerts;
                        state.aiInsights = dashboardData.aiInsights;
                        state.lastUpdate = dashboardData.timestamp;
                     });
                  } else if (data.type === 'CHART_UPDATE') {
                     // Handle chart updates separately
                     const chartData = data.data as any;
                     console.log('Chart update received:', Object.keys(chartData));

                     set(state => {
                        if (chartData.poolUsage) state.poolUsage = chartData.poolUsage;
                        if (chartData.iops) state.iops = chartData.iops;
                        if (chartData.latency) state.latency = chartData.latency;
                        if (chartData.throughput) state.throughput = chartData.throughput;
                        if (chartData.osdPerformance) state.osdPerf = chartData.osdPerformance;
                        if (chartData.networkError) state.networkErr = chartData.networkError;
                        if (chartData.scrubError) state.scrubErr = chartData.scrubError;
                        if (chartData.pgInconsistency) state.pgInconsis = chartData.pgInconsistency;
                     });
                  } else if (data.type === 'error') {
                     console.error('WebSocket error:', data.data);
                     set(state => {
                        state.connectionError = data.data as string;
                     });
                  }
               },
               // onConnectionChange handler
               (connected: boolean) => {
                  console.log('WebSocket connection status:', connected);
                  set(state => {
                     state.isConnected = connected;
                     if (connected) {
                        state.connectionError = null;
                     }
                  });
               },
               // onError handler
               (error: Event) => {
                  console.error('WebSocket error:', error);
                  set(state => {
                     state.connectionError = 'WebSocket connection error';
                     state.isConnected = false;
                  });
               },
            );

            set(state => {
               state.webSocket = newWebSocket;
            });

            newWebSocket.connect();
         },

         // Disconnect WebSocket
         disconnectWebSocket: () => {
            const { webSocket } = get();
            if (webSocket) {
               webSocket.disconnect();
               set(state => {
                  state.webSocket = null;
                  state.isConnected = false;
                  state.connectionError = null;
               });
            }
         },

         // Set error
         setError: (error: string | null) => {
            set(state => {
               state.error = error;
            });
         },

         // Clear error
         clearError: () => {
            set(state => {
               state.error = null;
               state.connectionError = null;
            });
         },

         // Individual data fetchers
         fetchCapacity: async () => {
            try {
               const capacity = await DashboardAPI.getCapacity();
               set(state => {
                  state.capacity = capacity;
               });
            } catch (error) {
               console.error('Error fetching capacity:', error);
            }
         },

         fetchClusterHealth: async () => {
            try {
               const health = await DashboardAPI.getClusterHealth();
               set(state => {
                  state.clusterHealth = health;
               });
            } catch (error) {
               console.error('Error fetching cluster health:', error);
            }
         },

         fetchRiskAssessment: async () => {
            try {
               const risk = await DashboardAPI.getRiskAssessment();
               set(state => {
                  state.riskAssessment = risk;
               });
            } catch (error) {
               console.error('Error fetching risk assessment:', error);
            }
         },

         fetchChartPoolUsage: async () => {
            try {
               const poolUsage = await DashboardAPI.getPoolUsage();
               set(state => {
                  state.poolUsage = poolUsage;
               });
            } catch (error) {
               console.error('Error fetching charts:', error);
            }
         },
         fetchChartIops: async () => {
            try {
               const iops = await DashboardAPI.getIops();
               set(state => {
                  state.iops = iops;
               });
            } catch (error) {
               console.error('Error fetching charts:', error);
            }
         },
         fetchChartLatency: async () => {
            try {
               const latency = await DashboardAPI.getLatency();
               set(state => {
                  state.latency = latency;
               });
            } catch (error) {
               console.error('Error fetching charts:', error);
            }
         },
         fetchChartThroughput: async () => {
            try {
               const throughput = await DashboardAPI.getThroughput();
               set(state => {
                  state.throughput = throughput;
               });
            } catch (error) {
               console.error('Error fetching charts:', error);
            }
         },
         fetchChartOsdPerf: async () => {
            try {
               const osd = await DashboardAPI.getOsdPerf();
               set(state => {
                  state.osdPerf = osd;
               });
            } catch (error) {
               console.error('Error fetching charts:', error);
            }
         },
         fetchChartNetworkErr: async () => {
            try {
               const networkErr = await DashboardAPI.getNetworkErr();
               set(state => {
                  state.networkErr = networkErr;
               });
            } catch (error) {
               console.error('Error fetching charts:', error);
            }
         },
         fetchChartScrubErr: async () => {
            try {
               const scrubErr = await DashboardAPI.getScrubErr();
               set(state => {
                  state.scrubErr = scrubErr;
               });
            } catch (error) {
               console.error('Error fetching charts:', error);
            }
         },
         fetchChartPgInconsis: async () => {
            try {
               const pg = await DashboardAPI.getPgInconsis();
               set(state => {
                  state.pgInconsis = pg;
               });
            } catch (error) {
               console.error('Error fetching charts:', error);
            }
         },
         fetchAlerts: async () => {
            try {
               const alerts = await DashboardAPI.getAlerts();
               set(state => {
                  state.alerts = alerts;
               });
            } catch (error) {
               console.error('Error fetching alerts:', error);
            }
         },

         fetchAIInsights: async () => {
            try {
               const insights = await DashboardAPI.getAIInsights();
               set(state => {
                  state.aiInsights = insights;
               });
            } catch (error) {
               console.error('Error fetching AI insights:', error);
            }
         },
      })),
      { name: 'dashboard-store' },
   ),
);

// Selectors for specific data
export const selectCapacity = (state: DashboardStore) => state.capacity;
export const selectClusterHealth = (state: DashboardStore) => state.clusterHealth;
export const selectRiskAssessment = (state: DashboardStore) => state.riskAssessment;
export const selectAlerts = (state: DashboardStore) => state.alerts;
export const selectAIInsights = (state: DashboardStore) => state.aiInsights;
export const selectIsLoading = (state: DashboardStore) => state.isLoading;
export const selectIsConnected = (state: DashboardStore) => state.isConnected;
export const selectError = (state: DashboardStore) => state.error;
export const selectLastUpdate = (state: DashboardStore) => state.lastUpdate;
