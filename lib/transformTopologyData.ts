import type { TopologyResponse, OSDDetail } from '@/types/topology';

/**
 * Transform real topology data from API to match the mock data structure
 * expected by ClusterTopologyView component
 *
 * This preserves all existing animations and interactions while using real data
 */
export function transformTopologyData(apiData: TopologyResponse) {
   // Use total_osds from API response (includes all OSDs, not just up+in)
   // This ensures down/out OSDs are also displayed
   const osdMap = new Map<number, OSDDetail>();

   // Use total_osds if available, otherwise fallback to collecting from PGs
   if (apiData.total_osds && apiData.total_osds.length > 0) {
      apiData.total_osds.forEach(osdDetail => {
         osdMap.set(osdDetail.osd_id, osdDetail);
      });
   } else {
      // Fallback: collect from PGs (will only include up+in OSDs)
      apiData.data.forEach(pool => {
         pool.pgs.forEach(pg => {
            pg.osds.forEach(osdDetail => {
               if (!osdMap.has(osdDetail.osd_id)) {
                  osdMap.set(osdDetail.osd_id, osdDetail);
               }
            });
         });
      });
   }

   // Transform OSD detailed information to visualization format
   const flatOSDs = Array.from(osdMap.values()).map(osd => {
      // Determine health based on utilization and status
      let health: 'healthy' | 'warning' | 'error' = 'healthy';
      if (!osd.status.up || !osd.status.in) {
         health = 'error';
      } else if (osd.capacity.utilization_percent > 80) {
         health = 'warning';
      }

      // Simplify status to 'up' or 'down' for visualization
      // ClusterTopologyView checks for status === 'up'
      const simplifiedStatus = osd.status.up ? 'up' : 'down';

      return {
         id: osd.osd_id,
         host: osd.hostname, // Use actual hostname from API
         status: simplifiedStatus, // 'up' or 'down' for visualization compatibility
         utilization: Math.round(osd.capacity.utilization_percent), // Round to integer
         health,
         // Store full detail for info panel (includes original status.state: 'up+in', etc.)
         detail: osd,
      };
   });

   // Build host list from API hosts data (if available) or fallback to extracting from OSDs
   let flatHosts;
   if (apiData.hosts && apiData.hosts.length > 0) {
      // Use detailed host information from API
      flatHosts = apiData.hosts.map(host => ({
         id: host.hostname,
         name: host.hostname,
         // Store full host detail for info panel
         detail: host,
      }));
   } else {
      // Fallback: extract unique hostnames from OSDs
      const hostNames = new Set<string>();
      osdMap.forEach(osd => hostNames.add(osd.hostname));
      flatHosts = Array.from(hostNames).map((hostname, index) => ({
         id: hostname,
         name: hostname,
      }));
   }

   // Transform pools with PGs
   const transformedPools = apiData.data.map(pool => {
      // Map pool health based on utilization percentage
      const percentUsed = pool.pool_info?.utilization?.usage_percent || 0;
      const poolHealth =
         percentUsed > 90
            ? 'critical'
            : percentUsed > 80
              ? 'warning'
              : 'healthy';

      // Transform PGs for this pool - include all fields from API
      const transformedPGs = pool.pgs.map(pg => ({
         id: pg.pgid,
         poolId: pool.pool_id,
         state: pg.state,
         objects: pg.num_objects,
         bytes: pg.num_bytes,
         primary: pg.primary,
         poolName: pool.pool_name,
         acting: pg.osds.map(osd => osd.osd_id), // Extract OSD IDs from detailed OSD array
         // Store full PG data for info panel
         detail: pg,
      }));

      return {
         id: pool.pool_id,
         name: pool.pool_name,
         size: (pool.pool_info?.utilization?.used_bytes || 0) + (pool.pool_info?.utilization?.max_available || 0),
         used: pool.pool_info?.utilization?.used_bytes || 0,
         health: poolHealth,
         pgs: transformedPGs,
         // Store full pool data for info panel
         detail: pool,
      };
   });

   return {
      pools: transformedPools,
      hosts: flatHosts,
      osds: flatOSDs,
   };
}
