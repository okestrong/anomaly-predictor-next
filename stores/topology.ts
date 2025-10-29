import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import TopologyAPI from '@/lib/api/topologyApi';
import type {
   TopologyResponse,
   PoolData,
   PGData,
   OSDData,
   HostData,
} from '@/types/topology';

interface TopologyStore {
   // Data
   topologyData: TopologyResponse | null;
   selectedPool: PoolData | null;
   selectedPG: PGData | null;
   selectedOSD: OSDData | null;
   selectedHost: HostData | null;

   // Loading states
   isLoading: boolean;
   isRefreshing: boolean;
   lastUpdate: number | null;
   error: string | null;
   loadingPGIds: Set<string>; // PG IDs currently loading OSDs

   // Actions
   initializeTopology: () => Promise<void>;
   refreshTopology: () => Promise<void>;
   setError: (error: string | null) => void;
   clearError: () => void;

   // Selection actions
   selectPool: (pool: PoolData | null) => void;
   selectPG: (pg: PGData | null) => void;
   selectOSD: (osd: OSDData | null) => void;
   selectHost: (host: HostData | null) => void;
   clearSelection: () => void;

   // PG-OSD mapping actions
   fetchPGOSDs: (pgId: string) => Promise<OSDData[]>;
   isPGLoading: (pgId: string) => boolean;
}

export const useTopologyStore = create<TopologyStore>()(
   devtools(
      immer((set, get) => ({
         // Initial state
         topologyData: null,
         selectedPool: null,
         selectedPG: null,
         selectedOSD: null,
         selectedHost: null,
         isLoading: false,
         isRefreshing: false,
         lastUpdate: null,
         error: null,
         loadingPGIds: new Set<string>(),

         // Initialize topology - fetch initial data
         initializeTopology: async () => {
            // Don't re-fetch if we already have recent data (within 5 minutes)
            const { topologyData, lastUpdate } = get();
            const now = Date.now();
            if (topologyData && lastUpdate && (now - lastUpdate < 300000)) {
               console.log('Topology data is still fresh, skipping re-fetch');
               return;
            }

            set(state => {
               state.isLoading = true;
               state.error = null;
            });

            try {
               console.log('Fetching topology data...');
               const data = await TopologyAPI.getTopology();

               set(state => {
                  state.topologyData = data;
                  state.lastUpdate = Date.now();
                  state.isLoading = false;
               });

               console.log(
                  `Topology data loaded successfully. Pools: ${data.data.length}, ` +
                     `OSDs: ${data.summary.total_osds}, Hosts: ${data.summary.total_hosts}`,
               );
            } catch (error) {
               console.error('Error initializing topology:', error);
               set(state => {
                  state.error =
                     error instanceof Error
                        ? error.message
                        : 'Failed to initialize topology';
                  state.isLoading = false;
               });
            }
         },

         // Refresh topology data (force refresh)
         refreshTopology: async () => {
            set(state => {
               state.isRefreshing = true;
               state.error = null;
            });

            try {
               console.log('Force refreshing topology data...');
               const refreshResult = await TopologyAPI.refreshTopology();

               if (refreshResult.status === 'success') {
                  // Fetch the updated data
                  const data = await TopologyAPI.getTopology();

                  set(state => {
                     state.topologyData = data;
                     state.lastUpdate = Date.now();
                     state.isRefreshing = false;
                  });

                  console.log(
                     `Topology data refreshed successfully. Pools: ${data.data.length}, ` +
                        `OSDs: ${data.summary.total_osds}, Hosts: ${data.summary.total_hosts}`,
                  );
               } else {
                  throw new Error(refreshResult.message || 'Failed to refresh topology');
               }
            } catch (error) {
               console.error('Error refreshing topology:', error);
               set(state => {
                  state.error =
                     error instanceof Error
                        ? error.message
                        : 'Failed to refresh topology';
                  state.isRefreshing = false;
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
            });
         },

         // Selection actions
         selectPool: (pool: PoolData | null) => {
            set(state => {
               state.selectedPool = pool;
               // Clear child selections when pool changes
               if (pool === null || state.selectedPool?.pool_id !== pool.pool_id) {
                  state.selectedPG = null;
                  state.selectedOSD = null;
               }
            });
         },

         selectPG: (pg: PGData | null) => {
            set(state => {
               state.selectedPG = pg;
               // Clear child selections when PG changes
               if (pg === null || state.selectedPG?.pgid !== pg.pgid) {
                  state.selectedOSD = null;
               }
            });
         },

         selectOSD: (osd: OSDData | null) => {
            set(state => {
               state.selectedOSD = osd;
               // Also select the host when OSD is selected
               if (osd) {
                  state.selectedHost = osd.host;
               }
            });
         },

         selectHost: (host: HostData | null) => {
            set(state => {
               state.selectedHost = host;
            });
         },

         clearSelection: () => {
            set(state => {
               state.selectedPool = null;
               state.selectedPG = null;
               state.selectedOSD = null;
               state.selectedHost = null;
            });
         },

         // Fetch OSDs for a specific PG (lazy loading)
         // Loading effect will be shown for exactly 1 second, then removed
         // API call continues in background for logging/verification
         fetchPGOSDs: async (pgId: string): Promise<OSDData[]> => {
            // Add to loading set
            set(state => {
               state.loadingPGIds.add(pgId);
            });

            // Remove from loading set after 1 second (for visual feedback)
            setTimeout(() => {
               set(state => {
                  state.loadingPGIds.delete(pgId);
               });
            }, 1000);

            try {
               console.log(`Fetching OSDs for PG ${pgId}...`);
               const response = await TopologyAPI.getPGOSDs(pgId);

               console.log(
                  `Fetched ${response.osds.length} OSDs for PG ${pgId}`,
               );
               return response.osds;
            } catch (error) {
               console.error(`Error fetching OSDs for PG ${pgId}:`, error);
               throw error;
            }
         },

         // Check if a PG is currently loading its OSDs
         isPGLoading: (pgId: string): boolean => {
            return get().loadingPGIds.has(pgId);
         },
      })),
      { name: 'topology-store' },
   ),
);

// Selectors for specific data
export const selectTopologyData = (state: TopologyStore) => state.topologyData;
export const selectPools = (state: TopologyStore) => state.topologyData?.data || [];
export const selectSummary = (state: TopologyStore) => state.topologyData?.summary;
export const selectClusterInfo = (state: TopologyStore) =>
   state.topologyData?.cluster_info;
export const selectSelectedPool = (state: TopologyStore) => state.selectedPool;
export const selectSelectedPG = (state: TopologyStore) => state.selectedPG;
export const selectSelectedOSD = (state: TopologyStore) => state.selectedOSD;
export const selectSelectedHost = (state: TopologyStore) => state.selectedHost;
export const selectIsLoading = (state: TopologyStore) => state.isLoading;
export const selectIsRefreshing = (state: TopologyStore) => state.isRefreshing;
export const selectError = (state: TopologyStore) => state.error;
export const selectLastUpdate = (state: TopologyStore) => state.lastUpdate;

// Helper selector to check if data is ready
export const selectIsDataReady = (state: TopologyStore) =>
   state.topologyData !== null && !state.isLoading;

// PG loading selectors
export const selectLoadingPGIds = (state: TopologyStore) => state.loadingPGIds;
export const selectIsPGLoading = (pgId: string) => (state: TopologyStore) =>
   state.loadingPGIds.has(pgId);
