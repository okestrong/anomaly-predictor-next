// types/cephTypes.ts

export interface CephTopologyData {
  cluster: ClusterInfo;
  hosts: HostInfo[];
  osds: OSDInfo[];
  daemons: DaemonInfo[];
  traffic: NetworkTraffic[];
  timestamp: number;
}

export interface ClusterInfo {
  name: string;
  status: 'HEALTH_OK' | 'HEALTH_WARN' | 'HEALTH_ERR';
  totalBytes: number;
  usedBytes: number;
  utilizationPercent: number;
  totalOSDs: number;
  upOSDs: number;
  inOSDs: number;
}

export interface HostInfo {
  hostname: string;
  ip: string;
  role: 'control' | 'compute' | 'network';
  osdCount: number;
  status: 'up' | 'down';
  cpuUsage: number;
  memoryUsage: number;
  osdIds: number[];
}

export interface OSDInfo {
  osdId: number;
  hostname: string;
  status: 'up' | 'down' | 'inactive';
  isIn: boolean;
  totalBytes: number;
  usedBytes: number;
  utilizationPercent: number;
  weight: number;
  pgCount: number;
  performanceMetrics: {
    read_iops: number;
    write_iops: number;
    read_bandwidth_mb: number;
    write_bandwidth_mb: number;
  };
}

export interface DaemonInfo {
  daemonId: string;
  daemonType: string; // mon, mgr, mds, osd, rgw
  hostname: string;
  status: string; // up, down, standby
  version: string;
  startTime: number;
  cpuUsage: number;
  memoryUsage: number;
  addr: string;
}

export interface NetworkTraffic {
  flowId: string;
  sourceOSD: number;
  targetOSD: number;
  sourceHost: string;
  targetHost: string;
  bytesPerSec: number;
  opsPerSec: number;
  trafficType: 'replication' | 'recovery' | 'client';
  intensity: number;
}
