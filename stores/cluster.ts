import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Types
export interface ClusterStatus {
  health: 'HEALTH_OK' | 'HEALTH_WARN' | 'HEALTH_ERR'
  osds: {
    up: number
    in: number
    down: number
    out: number
    total: number
  }
  monitors: Monitor[]
  version: string
  lastUpdated: string
  fsid?: string
  epoch?: number
  clusterName?: string
  timestamp?: number
}

export interface Monitor {
  name: string
  rank: number
  state: 'leader' | 'peon' | 'unknown'
  addr: string
  health: 'healthy' | 'warning' | 'error'
}

export interface OSDStatus {
  id: number
  name: string
  health: 'healthy' | 'warning' | 'error' | 'down'
  in: boolean
  up: boolean
  weight: number
  primaryAffinity: number
  utilization: number
  variance: number
  pgCount: number
  host: string
  rack?: string
  root?: string
}

export interface PoolStatus {
  id: number
  name: string
  health: 'healthy' | 'warning' | 'error'
  used: number // GB
  total: number // GB
  available: number // GB
  utilization: number // percentage
  pgCount: number
  pgpNum: number
  minSize: number
  size: number
  type: 'replicated' | 'erasure'
  profile?: string
  targetMaxBytes?: number
  targetMaxObjects?: number
  quota?: {
    maxBytes?: number
    maxObjects?: number
  }
}

export interface PGStatus {
  pgid: string
  state: string[]
  actingSet: number[]
  upSet: number[]
  mappingEpoch: number
  lastScrub: string
  lastDeepScrub: string
  statSum: {
    numObjects: number
    numBytes: number
  }
}

interface ClusterStore {
  // State
  status: ClusterStatus | null
  osds: OSDStatus[]
  pools: PoolStatus[]
  pgs: PGStatus[]
  loading: boolean
  error: string | null
  lastFetch: Date | null

  // Actions
  setStatus: (status: ClusterStatus) => void
  setOSDs: (osds: OSDStatus[]) => void
  setPools: (pools: PoolStatus[]) => void
  setPGs: (pgs: PGStatus[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  refreshAll: () => Promise<void>

  // Computed values
  getHealthyOSDCount: () => number
  getWarningPools: () => PoolStatus[]
  getDegradedPGs: () => PGStatus[]
  getTotalCapacity: () => { used: number; total: number; available: number; percentage: number }
  getClusterHealthScore: () => number
  getOSDsByHost: () => Map<string, OSDStatus[]>
}

// Mock data generator for development
function generateMockData() {
  const hosts = ['node-01', 'node-02', 'node-03', 'node-04', 'node-05']
  const racks = ['rack-A', 'rack-B', 'rack-C']

  const osds: OSDStatus[] = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    name: `osd.${i}`,
    health: Math.random() > 0.9 ? 'warning' : Math.random() > 0.95 ? 'error' : 'healthy',
    in: Math.random() > 0.05,
    up: Math.random() > 0.05,
    weight: 1.0,
    primaryAffinity: 1.0,
    utilization: Math.random() * 100,
    variance: Math.random() * 2 - 1,
    pgCount: Math.floor(Math.random() * 200) + 100,
    host: hosts[Math.floor(i / 7)],
    rack: racks[Math.floor(i / 12)],
    root: 'default'
  }))

  const pools: PoolStatus[] = [
    {
      id: 1,
      name: 'rbd',
      health: 'healthy',
      used: 1024 * 45,
      total: 1024 * 100,
      available: 1024 * 55,
      utilization: 45,
      pgCount: 256,
      pgpNum: 256,
      minSize: 2,
      size: 3,
      type: 'replicated'
    },
    {
      id: 2,
      name: 'cephfs_data',
      health: 'healthy',
      used: 1024 * 30,
      total: 1024 * 80,
      available: 1024 * 50,
      utilization: 37.5,
      pgCount: 128,
      pgpNum: 128,
      minSize: 2,
      size: 3,
      type: 'replicated'
    },
    {
      id: 3,
      name: 'cephfs_metadata',
      health: 'warning',
      used: 1024 * 2,
      total: 1024 * 10,
      available: 1024 * 8,
      utilization: 20,
      pgCount: 64,
      pgpNum: 64,
      minSize: 2,
      size: 3,
      type: 'replicated'
    },
    {
      id: 4,
      name: '.rgw.root',
      health: 'healthy',
      used: 512,
      total: 1024 * 5,
      available: 1024 * 5 - 512,
      utilization: 10,
      pgCount: 32,
      pgpNum: 32,
      minSize: 2,
      size: 3,
      type: 'replicated'
    }
  ]

  const status: ClusterStatus = {
    health: osds.some(o => o.health === 'error') ? 'HEALTH_ERR' :
            osds.some(o => o.health === 'warning') ? 'HEALTH_WARN' : 'HEALTH_OK',
    osds: {
      up: osds.filter(o => o.up).length,
      in: osds.filter(o => o.in).length,
      down: osds.filter(o => !o.up).length,
      out: osds.filter(o => !o.in).length,
      total: osds.length
    },
    monitors: [
      { name: 'mon.a', rank: 0, state: 'leader', addr: '10.0.0.1:6789', health: 'healthy' },
      { name: 'mon.b', rank: 1, state: 'peon', addr: '10.0.0.2:6789', health: 'healthy' },
      { name: 'mon.c', rank: 2, state: 'peon', addr: '10.0.0.3:6789', health: 'healthy' }
    ],
    version: 'ceph version 18.2.0 (reef)',
    lastUpdated: new Date().toISOString(),
    fsid: 'a7f64266-0894-4f1e-a635-d0aeaca0e993',
    epoch: 42
  }

  return { status, osds, pools, pgs: [] }
}

export const useClusterStore = create<ClusterStore>()(
  devtools(
    immer((set, get) => ({
        // Initial state
        status: null,
        osds: [],
        pools: [],
        pgs: [],
        loading: false,
        error: null,
        lastFetch: null,

        // Actions
        setStatus: (status) => {
          set((state) => {
            state.status = status
            state.error = null
            state.lastFetch = new Date()
          })
        },

        setOSDs: (osds) => {
          set((state) => {
            state.osds = osds
          })
        },

        setPools: (pools) => {
          set((state) => {
            state.pools = pools
          })
        },

        setPGs: (pgs) => {
          set((state) => {
            state.pgs = pgs
          })
        },

        setLoading: (loading) => {
          set((state) => {
            state.loading = loading
          })
        },

        setError: (error) => {
          set((state) => {
            state.error = error
            state.loading = false
          })
        },

        // Refresh all cluster data
        refreshAll: async () => {
          const { setLoading, setStatus, setOSDs, setPools, setError } = get()

          setLoading(true)
          try {
            // In production, replace with actual API calls
            // const [status, osds, pools] = await Promise.all([
            //   fetchClusterStatus(),
            //   fetchOSDs(),
            //   fetchPools()
            // ])

            // For development, use mock data
            await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay
            const { status, osds, pools } = generateMockData()

            setStatus(status)
            setOSDs(osds)
            setPools(pools)
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to fetch cluster data')
          } finally {
            setLoading(false)
          }
        },

        // Computed values
        getHealthyOSDCount: () => {
          return get().osds.filter(osd => osd.health === 'healthy' && osd.up && osd.in).length
        },

        getWarningPools: () => {
          return get().pools.filter(pool => pool.health === 'warning' || pool.health === 'error')
        },

        getDegradedPGs: () => {
          return get().pgs.filter(pg =>
            pg.state.includes('degraded') ||
            pg.state.includes('undersized') ||
            pg.state.includes('incomplete')
          )
        },

        getTotalCapacity: () => {
          const pools = get().pools
          const totalUsed = pools.reduce((sum, pool) => sum + pool.used, 0)
          const totalCapacity = pools.reduce((sum, pool) => sum + pool.total, 0)
          const totalAvailable = pools.reduce((sum, pool) => sum + pool.available, 0)

          return {
            used: totalUsed,
            total: totalCapacity,
            available: totalAvailable,
            percentage: totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0
          }
        },

        getClusterHealthScore: () => {
          const state = get()
          let score = 100

          // Health status impact
          if (state.status?.health === 'HEALTH_WARN') score -= 20
          if (state.status?.health === 'HEALTH_ERR') score -= 40

          // OSD health impact
          const unhealthyOSDs = state.osds.filter(o => o.health !== 'healthy').length
          score -= (unhealthyOSDs / Math.max(state.osds.length, 1)) * 30

          // Pool health impact
          const unhealthyPools = state.pools.filter(p => p.health !== 'healthy').length
          score -= (unhealthyPools / Math.max(state.pools.length, 1)) * 20

          // Capacity impact
          const capacity = state.getTotalCapacity()
          if (capacity.percentage > 80) score -= 10
          if (capacity.percentage > 90) score -= 10

          return Math.max(0, Math.min(100, score))
        },

        getOSDsByHost: () => {
          const osds = get().osds
          const hostMap = new Map<string, OSDStatus[]>()

          osds.forEach(osd => {
            if (!hostMap.has(osd.host)) {
              hostMap.set(osd.host, [])
            }
            hostMap.get(osd.host)!.push(osd)
          })

          return hostMap
        }
      })),
    { name: 'cluster-store' }
  )
)

// Initialize with mock data in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    const { status, osds, pools } = generateMockData()
    useClusterStore.getState().setStatus(status)
    useClusterStore.getState().setOSDs(osds)
    useClusterStore.getState().setPools(pools)
  }, 100)
}