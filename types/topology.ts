/**
 * Cluster Topology Data Types
 * Matches the backend topology DTOs for 3D visualization
 */

// Host data
export interface HostMemoryInfo {
   total_kb: number;
   used_kb: number;
   available_kb: number;
}

export interface HostNetworkInterface {
   name: string;
   ip: string;
   mac: string;
   speed: string;
}

export interface HostData {
   hostname: string;
   ip_address: string;
   status: string;
   cpu_count: number;
   cpu_usage: number;
   memory: HostMemoryInfo;
   network_interfaces: HostNetworkInterface[];
   services: string[];
}

// OSD data
export interface OSDPerformance {
   commit_latency_ms: number;
   apply_latency_ms: number;
   read_ops: number;
   write_ops: number;
   read_bytes: number;
   write_bytes: number;
}

export interface OSDHealth {
   state: string;
   pg_count: number;
   used_bytes: number;
   available_bytes: number;
   utilization: number;
}

export interface OSDSmartInfo {
   device: string;
   model: string;
   serial_number: string;
   capacity_bytes: number;
   power_on_hours: number;
   temperature_celsius: number;
   wear_level: number;
}

export interface OSDData {
   osd_id: number;
   name: string;
   status: string;
   weight: number;
   reweight: number;
   host: HostData;
   performance: OSDPerformance;
   health: OSDHealth;
   smart_info: OSDSmartInfo;
}

// OSD detailed information
export interface OSDDetailStatus {
   up: boolean;
   in: boolean;
   state: string;
   weight: number;
   reweight: number;
}

export interface OSDDetailDevice {
   path: string;
   type: string;
}

export interface OSDDetailCapacity {
   total_bytes: number;
   used_bytes: number;
   available_bytes: number;
   utilization_percent: number;
}

export interface OSDDetailSmart {
   health_status: string;
   temperature_celsius: number;
}

export interface OSDDetailHostInfo {
   publicIp: string;
   clusterIp: string;
   name: string;
   osdIds: number[];
}

export interface OSDDetail {
   osd_id: number;
   hostname: string;
   num_pgs: number;
   status: OSDDetailStatus;
   device: OSDDetailDevice;
   capacity: OSDDetailCapacity;
   smart: OSDDetailSmart | null;
   host_info: OSDDetailHostInfo | null;
}

// PG data (with detailed OSD information)
export interface PGData {
   pgid: string;
   state: string;
   osds: OSDDetail[]; // OSD detailed information array
   primary: number;
   num_bytes: number;
   num_objects: number;
}

// Pool statistics (inside pool_info)
export interface PoolStatistics {
   stored_bytes: number;
   objects: number;
   clones: number;
   copies: number;
   missing_on_primary: number;
   unfound: number;
   degraded: number;
   misplaced: number;
   read_ops: number;
   read_bytes: number;
   write_ops: number;
   write_bytes: number;
   promote_ops: number;
   demote_ops: number;
   flush_ops: number;
   evict_ops: number;
   whiteouts: number;
}

// Pool utilization (inside pool_info)
export interface PoolUtilization {
   used_bytes: number;
   max_available: number;
   usage_percent: number;
   compression_ratio: number;
   raw_usage_percent: number;
}

// Pool IO stats (inside pool_info)
export interface PoolIOStats {
   bandwidth_read_mbps: number;
   bandwidth_write_mbps: number;
   iops_read: number;
   iops_write: number;
   latency_read_ms: number;
   latency_write_ms: number;
}

// Pool info (detailed information)
export interface PoolInfo {
   type: string;
   size: number;
   min_size: number;
   pg_num: number;
   pgp_num: number;
   crush_rule: string;
   application: string;
   autoscale_mode: string;
   target_size_ratio: number;
   quota_max_bytes: number;
   quota_max_objects: number;
   compression_mode: string;
   compression_algorithm: string;
   erasure_code_profile: string;
   created: string;
   last_modified: string;
   statistics: PoolStatistics;
   utilization: PoolUtilization;
   io_stats: PoolIOStats;
}

// Pool data (main structure from backend)
export interface PoolData {
   pool_id: number;
   pool_name: string;
   pool_info: PoolInfo;
   pgs: PGData[];
   total_pg_count: number;
}

// Cluster info
export interface ClusterInfo {
   cluster_name: string;
   fsid: string;
   health: string;
   mon_count: number;
   osd_count: number;
   host_count: number;
   total_capacity_gb: number;
   used_capacity_gb: number;
   available_capacity_gb: number;
}

// Summary data
export interface TopologySummary {
   total_pools: number;
   total_pgs: number;
   total_osds: number;
   total_hosts: number;
   healthy_osds: number;
   up_osds: number;
   in_osds: number;
}

// Host detail information
export interface HostDetail {
   hostname: string;
   address: string;
   publicAddr: string;
   clusterAddr: string;
   version: string;
   status: string;
   labels: string[];
   osdIds: number[];
   hostCapacity: number;
   totalCapacity: number;
   usedCapacity: number;
   availableCapacity: number;
   usedPercent: number;
   nicCount: number;
   memory: number | null;
   cpuCount: number;
   coreCount: number;
   cpuModel: string;
   model: string;
   os: string;
   kernel: string;
}

// Main topology response
export interface TopologyResponse {
   success: boolean;
   timestamp: string;
   cluster_info: ClusterInfo;
   data: PoolData[];
   total_osds: OSDDetail[];
   hosts: HostDetail[];
   summary: TopologySummary;
}

// Status response
export interface TopologyStatusResponse {
   status: 'healthy' | 'unhealthy';
   service: string;
   cacheDurationMs?: number;
   lastUpdate?: number;
   clusterHealth?: string;
   poolCount?: number;
   totalOsds?: number;
   totalHosts?: number;
   error?: string;
   timestamp: number;
}

// Refresh response
export interface TopologyRefreshResponse {
   status: 'success' | 'error';
   message: string;
   timestamp?: number;
   pools?: number;
   totalOsds?: number;
   totalHosts?: number;
   error?: string;
}

// PG-OSD mapping response
export interface PGOSDMappingResponse {
   pg_id: string;
   osds: OSDData[];
   timestamp: number;
}
