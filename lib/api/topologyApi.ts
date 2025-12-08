import { apiClient } from './client';
import type {
   TopologyResponse,
   TopologyStatusResponse,
   TopologyRefreshResponse,
   PGOSDMappingResponse,
} from '@/types/topology';

/**
 * Topology API Client
 * Handles all topology-related API calls for 3D visualization
 */
export class TopologyAPI {
   /**
    * Get topology data (with 5-minute cache)
    * Returns comprehensive cluster topology data including pools, PGs, OSDs, and hosts
    * Uses 120-second timeout for stability (may take longer depending on cluster size)
    */
   static async getTopology(): Promise<TopologyResponse> {
      return await apiClient.get<TopologyResponse>(
         '/api/topology',
         { timeout: 120000 } // 120 seconds timeout
      );
   }

   /**
    * Force refresh topology data (bypass cache)
    * Fetches fresh data from the API, bypassing the 5-minute cache
    */
   static async refreshTopology(): Promise<TopologyRefreshResponse> {
      return await apiClient.post<TopologyRefreshResponse>(
         '/api/topology/refresh',
         {},
         { timeout: 120000 } // 120 seconds timeout
      );
   }

   /**
    * Get topology service status
    * Returns health status, cache info, and basic statistics
    */
   static async getStatus(): Promise<TopologyStatusResponse> {
      return await apiClient.get<TopologyStatusResponse>(
         '/api/topology/status',
         { timeout: 60000 }
      );
   }

   /**
    * Clear topology cache (for testing/debugging)
    * Forces the next request to fetch fresh data
    */
   static async clearCache(): Promise<{
      status: string;
      message: string;
      timestamp: number;
   }> {
      return await apiClient.post(
         '/api/topology/cache/clear',
         {},
         { timeout: 60000 }
      );
   }

   /**
    * Get OSDs mapped to a specific PG
    * Returns the list of OSDs that belong to the specified Placement Group
    * @param pgId - The PG identifier (e.g., "1.0", "2.3f")
    */
   static async getPGOSDs(pgId: string): Promise<PGOSDMappingResponse> {
      return await apiClient.get<PGOSDMappingResponse>(
         `/api/topology/pgs/${encodeURIComponent(pgId)}/osds`,
         { timeout: 60000 }
      );
   }
}

export default TopologyAPI;
