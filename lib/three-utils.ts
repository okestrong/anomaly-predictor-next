import * as THREE from 'three';

/**
 * Texture loading utility for Three.js
 */
export const loadTexture = (url: string): Promise<THREE.Texture> => {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        resolve(texture);
      },
      undefined,
      (error) => {
        console.error(`Failed to load texture: ${url}`, error);
        reject(error);
      }
    );
  });
};

/**
 * Adaptive Layout Manager for 3D space positioning
 */
export class AdaptiveLayoutManager {
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  updateSize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /**
   * Calculate adaptive positions for cluster nodes
   */
  calculateClusterLayout(nodeCount: number): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const radius = Math.min(this.width, this.height) * 0.003; // Adaptive radius based on viewport size
    
    if (nodeCount === 1) {
      positions.push(new THREE.Vector3(0, 0, 0));
      return positions;
    }

    // Circular layout for multiple nodes
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * radius * 0.3; // Small random Y variation
      
      positions.push(new THREE.Vector3(x, y, z));
    }

    return positions;
  }

  /**
   * Calculate hierarchical layout (Pool -> PG -> OSD)
   */
  calculateHierarchicalLayout(pools: number, pgsPerPool: number, osdsPerPg: number): {
    pools: THREE.Vector3[];
    pgs: THREE.Vector3[][];
    osds: THREE.Vector3[][][];
  } {
    const layout = {
      pools: [] as THREE.Vector3[],
      pgs: [] as THREE.Vector3[][],
      osds: [] as THREE.Vector3[][][]
    };

    const poolRadius = Math.min(this.width, this.height) * 0.008;
    const pgRadius = poolRadius * 0.3;
    const osdRadius = pgRadius * 0.3;

    // Position pools in a circular layout
    for (let p = 0; p < pools; p++) {
      const poolAngle = (p / pools) * Math.PI * 2;
      const poolPos = new THREE.Vector3(
        Math.cos(poolAngle) * poolRadius,
        0,
        Math.sin(poolAngle) * poolRadius
      );
      layout.pools.push(poolPos);

      // Position PGs around each pool
      layout.pgs[p] = [];
      layout.osds[p] = [];
      
      for (let pg = 0; pg < pgsPerPool; pg++) {
        const pgAngle = (pg / pgsPerPool) * Math.PI * 2;
        const pgPos = new THREE.Vector3(
          poolPos.x + Math.cos(pgAngle) * pgRadius,
          poolPos.y + (Math.random() - 0.5) * pgRadius * 0.2,
          poolPos.z + Math.sin(pgAngle) * pgRadius
        );
        layout.pgs[p].push(pgPos);

        // Position OSDs around each PG
        layout.osds[p][pg] = [];
        for (let osd = 0; osd < osdsPerPg; osd++) {
          const osdAngle = (osd / osdsPerPg) * Math.PI * 2;
          const osdPos = new THREE.Vector3(
            pgPos.x + Math.cos(osdAngle) * osdRadius,
            pgPos.y + (Math.random() - 0.5) * osdRadius * 0.3,
            pgPos.z + Math.sin(osdAngle) * osdRadius
          );
          layout.osds[p][pg].push(osdPos);
        }
      }
    }

    return layout;
  }
}

/**
 * Mock data generator for topology visualization
 */
export const generateMockTopologyData = () => {
  return {
    cluster: {
      health: 'healthy' as 'healthy' | 'warning' | 'error',
      pools: 3,
      pgs: 24,
      osds: 12,
      hosts: 4,
      totalCapacity: '48 TB',
      usedCapacity: '12.4 TB',
      availableCapacity: '35.6 TB'
    },
    pools: [
      { id: 'pool-1', name: 'data', size: 3, pgNum: 8, status: 'active' },
      { id: 'pool-2', name: 'metadata', size: 2, pgNum: 8, status: 'active' },
      { id: 'pool-3', name: 'rbd', size: 3, pgNum: 8, status: 'active' }
    ],
    hosts: [
      { id: 'host-1', name: 'ceph-node-01', osds: [0, 1, 2], status: 'up' },
      { id: 'host-2', name: 'ceph-node-02', osds: [3, 4, 5], status: 'up' },
      { id: 'host-3', name: 'ceph-node-03', osds: [6, 7, 8], status: 'up' },
      { id: 'host-4', name: 'ceph-node-04', osds: [9, 10, 11], status: 'up' }
    ],
    osds: Array.from({ length: 12 }, (_, i) => ({
      id: i,
      name: `osd.${i}`,
      status: Math.random() > 0.1 ? 'up' : 'down',
      weight: 1.0,
      capacity: '4TB'
    }))
  };
};