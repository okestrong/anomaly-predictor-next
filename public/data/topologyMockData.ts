// Helper function to generate random OSD set
const generateRandomOSDSet = (): number[] => {
   // Group OSDs by host
   const osdsByHost: { [hostId: string]: number[] } = {};
   const osds = [
      // Host-1: OSDs 0-11
      ...Array.from({ length: 12 }, (_, i) => ({ id: i, host: 'host-1' })),
      // Host-2: OSDs 12-21
      ...Array.from({ length: 10 }, (_, i) => ({ id: i + 12, host: 'host-2' })),
      // Host-3: OSDs 22-35
      ...Array.from({ length: 14 }, (_, i) => ({ id: i + 22, host: 'host-3' })),
      // Host-4: OSDs 36-51
      ...Array.from({ length: 16 }, (_, i) => ({ id: i + 36, host: 'host-4' })),
      // Host-5: OSDs 52-59
      ...Array.from({ length: 8 }, (_, i) => ({ id: i + 52, host: 'host-5' })),
      // Host-6: OSDs 60-70
      ...Array.from({ length: 11 }, (_, i) => ({ id: i + 60, host: 'host-6' })),
      // Host-7: OSDs 71-79
      ...Array.from({ length: 9 }, (_, i) => ({ id: i + 71, host: 'host-7' })),
   ];

   osds.forEach(osd => {
      if (!osdsByHost[osd.host]) {
         osdsByHost[osd.host] = [];
      }
      osdsByHost[osd.host].push(osd.id);
   });

   // Select 1 random OSD from each host (3-5 hosts = 3-5 OSDs)
   const selectedOSDs: number[] = [];
   const hosts = Object.keys(osdsByHost);
   const numHostsToSelect = Math.min(Math.max(3, Math.floor(Math.random() * 3) + 3), hosts.length);

   // Shuffle hosts and select random number of them
   const shuffledHosts = hosts.sort(() => 0.5 - Math.random());
   const selectedHosts = shuffledHosts.slice(0, numHostsToSelect);

   selectedHosts.forEach(hostId => {
      const hostOsds = osdsByHost[hostId];
      const randomOsdId = hostOsds[Math.floor(Math.random() * hostOsds.length)];
      selectedOSDs.push(randomOsdId);
   });

   return selectedOSDs;
};

// Helper function to generate PGs for a pool
const generatePGsForPool = (poolId: number, poolName: string, count: number) => {
   const pgs = [];
   for (let i = 0; i < count; i++) {
      pgs.push({
         id: `${poolId}.${i}`,
         poolId: poolId,
         state: Math.random() > 0.1 ? 'active+clean' : Math.random() > 0.5 ? 'degraded' : 'inconsistent',
         objects: Math.floor(Math.random() * 1000),
         poolName: poolName,
         acting: generateRandomOSDSet(),
      });
   }
   return pgs;
};

export const mockTopologyData = {
   pools: [
      {
         id: 1,
         name: 'rbd',
         size: 1024 * 1024 * 1024 * 500,
         used: 1024 * 1024 * 1024 * 300,
         health: 'healthy',
         pgs: generatePGsForPool(1, 'rbd', Math.floor(Math.random() * (256 - 64 + 1)) + 64)
      },
      {
         id: 2,
         name: 'cephfs_data',
         size: 1024 * 1024 * 1024 * 800,
         used: 1024 * 1024 * 1024 * 200,
         health: 'healthy',
         pgs: generatePGsForPool(2, 'cephfs_data', Math.floor(Math.random() * (256 - 64 + 1)) + 64)
      },
      {
         id: 3,
         name: 'cephfs_metadata',
         size: 1024 * 1024 * 1024 * 100,
         used: 1024 * 1024 * 1024 * 10,
         health: 'warning',
         pgs: generatePGsForPool(3, 'cephfs_metadata', Math.floor(Math.random() * (256 - 64 + 1)) + 64)
      },
      {
         id: 4,
         name: 'rgw_data',
         size: 1024 * 1024 * 1024 * 600,
         used: 1024 * 1024 * 1024 * 250,
         health: 'healthy',
         pgs: generatePGsForPool(4, 'rgw_data', Math.floor(Math.random() * (256 - 64 + 1)) + 64)
      },
      {
         id: 5,
         name: 'backups',
         size: 1024 * 1024 * 1024 * 400,
         used: 1024 * 1024 * 1024 * 180,
         health: 'healthy',
         pgs: generatePGsForPool(5, 'backups', Math.floor(Math.random() * (256 - 64 + 1)) + 64)
      },
      {
         id: 6,
         name: 'vm_images',
         size: 1024 * 1024 * 1024 * 700,
         used: 1024 * 1024 * 1024 * 420,
         health: 'warning',
         pgs: generatePGsForPool(6, 'vm_images', Math.floor(Math.random() * (256 - 64 + 1)) + 64)
      },
      {
         id: 7,
         name: 'analytics',
         size: 1024 * 1024 * 1024 * 300,
         used: 1024 * 1024 * 1024 * 120,
         health: 'healthy',
         pgs: generatePGsForPool(7, 'analytics', Math.floor(Math.random() * (256 - 64 + 1)) + 64)
      },
      {
         id: 8,
         name: 'cache',
         size: 1024 * 1024 * 1024 * 200,
         used: 1024 * 1024 * 1024 * 80,
         health: 'error',
         pgs: generatePGsForPool(8, 'cache', Math.floor(Math.random() * (256 - 64 + 1)) + 64)
      },
      {
         id: 9,
         name: 'kubernetes',
         size: 1024 * 1024 * 1024 * 450,
         used: 1024 * 1024 * 1024 * 280,
         health: 'healthy',
         pgs: generatePGsForPool(9, 'kubernetes', Math.floor(Math.random() * (256 - 64 + 1)) + 64)
      },
      {
         id: 10,
         name: 'ml_datasets',
         size: 1024 * 1024 * 1024 * 900,
         used: 1024 * 1024 * 1024 * 720,
         health: 'warning',
         pgs: generatePGsForPool(10, 'ml_datasets', Math.floor(Math.random() * (256 - 64 + 1)) + 64)
      },
      {
         id: 11,
         name: 'logs',
         size: 1024 * 1024 * 1024 * 350,
         used: 1024 * 1024 * 1024 * 150,
         health: 'healthy',
         pgs: generatePGsForPool(11, 'logs', Math.floor(Math.random() * (256 - 64 + 1)) + 64)
      },
      {
         id: 12,
         name: 'monitoring',
         size: 1024 * 1024 * 1024 * 150,
         used: 1024 * 1024 * 1024 * 60,
         health: 'healthy',
         pgs: generatePGsForPool(12, 'monitoring', Math.floor(Math.random() * (256 - 64 + 1)) + 64)
      },
      {
         id: 13,
         name: 'snapshots',
         size: 1024 * 1024 * 1024 * 600,
         used: 1024 * 1024 * 1024 * 380,
         health: 'healthy',
         pgs: generatePGsForPool(13, 'snapshots', Math.floor(Math.random() * (256 - 64 + 1)) + 64)
      },
      {
         id: 14,
         name: 'temp_storage',
         size: 1024 * 1024 * 1024 * 250,
         used: 1024 * 1024 * 1024 * 90,
         health: 'warning',
         pgs: generatePGsForPool(14, 'temp_storage', Math.floor(Math.random() * (256 - 64 + 1)) + 64)
      },
      {
         id: 15,
         name: 'database',
         size: 1024 * 1024 * 1024 * 800,
         used: 1024 * 1024 * 1024 * 650,
         health: 'error',
         pgs: generatePGsForPool(15, 'database', Math.floor(Math.random() * (256 - 64 + 1)) + 64)
      },
      {
         id: 16,
         name: 'archive',
         size: 1024 * 1024 * 1024 * 1200,
         used: 1024 * 1024 * 1024 * 900,
         health: 'healthy',
         pgs: generatePGsForPool(16, 'archive', Math.floor(Math.random() * (256 - 64 + 1)) + 64)
      },
   ],
   hosts: [
      { id: 'host-1', name: 'ceph-node-01' },
      { id: 'host-2', name: 'ceph-node-02' },
      { id: 'host-3', name: 'ceph-node-03' },
      { id: 'host-4', name: 'ceph-node-04' },
      { id: 'host-5', name: 'ceph-node-05' },
      { id: 'host-6', name: 'ceph-node-06' },
      { id: 'host-7', name: 'ceph-node-07' },
   ],
   osds: [
      // Host-1: 12 OSDs
      { id: 0, host: 'host-1', status: 'up', utilization: 75, health: 'healthy' },
      { id: 1, host: 'host-1', status: 'up', utilization: 60, health: 'healthy' },
      { id: 2, host: 'host-1', status: 'up', utilization: 65, health: 'healthy' },
      { id: 3, host: 'host-1', status: 'up', utilization: 80, health: 'warning' },
      { id: 4, host: 'host-1', status: 'up', utilization: 55, health: 'healthy' },
      { id: 5, host: 'host-1', status: 'up', utilization: 70, health: 'healthy' },
      { id: 6, host: 'host-1', status: 'up', utilization: 88, health: 'warning' },
      { id: 7, host: 'host-1', status: 'up', utilization: 42, health: 'healthy' },
      { id: 8, host: 'host-1', status: 'up', utilization: 73, health: 'healthy' },
      { id: 9, host: 'host-1', status: 'up', utilization: 61, health: 'healthy' },
      { id: 10, host: 'host-1', status: 'up', utilization: 77, health: 'healthy' },
      { id: 11, host: 'host-1', status: 'up', utilization: 59, health: 'healthy' },
      // Host-2: 10 OSDs
      { id: 12, host: 'host-2', status: 'up', utilization: 85, health: 'warning' },
      { id: 13, host: 'host-2', status: 'up', utilization: 45, health: 'healthy' },
      { id: 14, host: 'host-2', status: 'up', utilization: 68, health: 'healthy' },
      { id: 15, host: 'host-2', status: 'up', utilization: 73, health: 'healthy' },
      { id: 16, host: 'host-2', status: 'up', utilization: 91, health: 'warning' },
      { id: 17, host: 'host-2', status: 'up', utilization: 52, health: 'healthy' },
      { id: 18, host: 'host-2', status: 'up', utilization: 64, health: 'healthy' },
      { id: 19, host: 'host-2', status: 'up', utilization: 78, health: 'healthy' },
      { id: 20, host: 'host-2', status: 'up', utilization: 49, health: 'healthy' },
      { id: 21, host: 'host-2', status: 'up', utilization: 83, health: 'healthy' },
      // Host-3: 14 OSDs
      { id: 22, host: 'host-3', status: 'down', utilization: 0, health: 'error' },
      { id: 23, host: 'host-3', status: 'up', utilization: 70, health: 'healthy' },
      { id: 24, host: 'host-3', status: 'up', utilization: 56, health: 'healthy' },
      { id: 25, host: 'host-3', status: 'up', utilization: 82, health: 'healthy' },
      { id: 26, host: 'host-3', status: 'up', utilization: 47, health: 'healthy' },
      { id: 27, host: 'host-3', status: 'up', utilization: 69, health: 'healthy' },
      { id: 28, host: 'host-3', status: 'up', utilization: 74, health: 'healthy' },
      { id: 29, host: 'host-3', status: 'up', utilization: 58, health: 'healthy' },
      { id: 30, host: 'host-3', status: 'up', utilization: 86, health: 'warning' },
      { id: 31, host: 'host-3', status: 'up', utilization: 63, health: 'healthy' },
      { id: 32, host: 'host-3', status: 'up', utilization: 75, health: 'healthy' },
      { id: 33, host: 'host-3', status: 'up', utilization: 51, health: 'healthy' },
      { id: 34, host: 'host-3', status: 'up', utilization: 67, health: 'healthy' },
      { id: 35, host: 'host-3', status: 'up', utilization: 79, health: 'healthy' },
      // Host-4: 16 OSDs
      { id: 36, host: 'host-4', status: 'up', utilization: 62, health: 'healthy' },
      { id: 37, host: 'host-4', status: 'up', utilization: 71, health: 'healthy' },
      { id: 38, host: 'host-4', status: 'up', utilization: 48, health: 'healthy' },
      { id: 39, host: 'host-4', status: 'up', utilization: 84, health: 'healthy' },
      { id: 40, host: 'host-4', status: 'up', utilization: 57, health: 'healthy' },
      { id: 41, host: 'host-4', status: 'up', utilization: 76, health: 'healthy' },
      { id: 42, host: 'host-4', status: 'up', utilization: 53, health: 'healthy' },
      { id: 43, host: 'host-4', status: 'up', utilization: 89, health: 'warning' },
      { id: 44, host: 'host-4', status: 'up', utilization: 46, health: 'healthy' },
      { id: 45, host: 'host-4', status: 'up', utilization: 72, health: 'healthy' },
      { id: 46, host: 'host-4', status: 'up', utilization: 66, health: 'healthy' },
      { id: 47, host: 'host-4', status: 'up', utilization: 81, health: 'healthy' },
      { id: 48, host: 'host-4', status: 'up', utilization: 54, health: 'healthy' },
      { id: 49, host: 'host-4', status: 'up', utilization: 77, health: 'healthy' },
      { id: 50, host: 'host-4', status: 'up', utilization: 43, health: 'healthy' },
      { id: 51, host: 'host-4', status: 'up', utilization: 85, health: 'healthy' },
      // Host-5: 8 OSDs
      { id: 52, host: 'host-5', status: 'up', utilization: 69, health: 'healthy' },
      { id: 53, host: 'host-5', status: 'up', utilization: 74, health: 'healthy' },
      { id: 54, host: 'host-5', status: 'up', utilization: 58, health: 'healthy' },
      { id: 55, host: 'host-5', status: 'up', utilization: 87, health: 'warning' },
      { id: 56, host: 'host-5', status: 'up', utilization: 45, health: 'healthy' },
      { id: 57, host: 'host-5', status: 'up', utilization: 76, health: 'healthy' },
      { id: 58, host: 'host-5', status: 'up', utilization: 63, health: 'healthy' },
      { id: 59, host: 'host-5', status: 'up', utilization: 80, health: 'healthy' },
      // Host-6: 11 OSDs
      { id: 60, host: 'host-6', status: 'up', utilization: 52, health: 'healthy' },
      { id: 61, host: 'host-6', status: 'up', utilization: 75, health: 'healthy' },
      { id: 62, host: 'host-6', status: 'up', utilization: 44, health: 'healthy' },
      { id: 63, host: 'host-6', status: 'up', utilization: 88, health: 'warning' },
      { id: 64, host: 'host-6', status: 'up', utilization: 61, health: 'healthy' },
      { id: 65, host: 'host-6', status: 'up', utilization: 73, health: 'healthy' },
      { id: 66, host: 'host-6', status: 'up', utilization: 56, health: 'healthy' },
      { id: 67, host: 'host-6', status: 'up', utilization: 82, health: 'healthy' },
      { id: 68, host: 'host-6', status: 'up', utilization: 49, health: 'healthy' },
      { id: 69, host: 'host-6', status: 'up', utilization: 77, health: 'healthy' },
      { id: 70, host: 'host-6', status: 'up', utilization: 64, health: 'healthy' },
      // Host-7: 9 OSDs
      { id: 71, host: 'host-7', status: 'up', utilization: 71, health: 'healthy' },
      { id: 72, host: 'host-7', status: 'up', utilization: 47, health: 'healthy' },
      { id: 73, host: 'host-7', status: 'up', utilization: 83, health: 'healthy' },
      { id: 74, host: 'host-7', status: 'up', utilization: 59, health: 'healthy' },
      { id: 75, host: 'host-7', status: 'up', utilization: 76, health: 'healthy' },
      { id: 76, host: 'host-7', status: 'up', utilization: 42, health: 'healthy' },
      { id: 77, host: 'host-7', status: 'down', utilization: 0, health: 'error' },
      { id: 78, host: 'host-7', status: 'up', utilization: 68, health: 'healthy' },
      { id: 79, host: 'host-7', status: 'up', utilization: 85, health: 'healthy' },
   ],
};
