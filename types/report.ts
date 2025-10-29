/**
 * Reporting Module Type Definitions
 * Based on rules/reporting.md requirements
 */

// ==================== Report Types ====================

export type ReportType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'AI_INSIGHTS' | 'PREDICTIONS' | 'PERFORMANCE' | 'CAPACITY' | 'CUSTOM';

export type ReportStatus = 'generating' | 'completed' | 'failed' | 'scheduled';

export type ExportFormat = 'pdf' | 'html' | 'excel' | 'json';

export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'custom';

// ==================== Report Data ====================

export interface Report {
   id: string;
   type: ReportType;
   title: string;
   description?: string;
   status: ReportStatus;
   createdAt: string;
   updatedAt: string;
   generatedBy: string;
   timeRange: TimeRange;
   data: ReportData;
   aiInsights?: AIInsights;
   sections: ReportSection[];
   metadata?: ReportMetadata;
}

export interface TimeRange {
   start: string; // ISO date string
   end: string; // ISO date string
   label?: string; // e.g., "Last 24 Hours", "This Week"
}

export interface ReportMetadata {
   clusterName: string;
   clusterHealth: string;
   totalOsds: number;
   totalHosts: number;
   totalPools: number;
   cephVersion?: string;
   uptimeSeconds?: number;
   generationTime: number; // milliseconds
}

// ==================== Report Sections ====================

export interface ReportSection {
   id: string;
   type: SectionType;
   title: string;
   order: number;
   visible: boolean;
   data: any; // Section-specific data
}

export type SectionType =
   | 'cluster-health'
   | 'key-metrics'
   | 'performance-charts'
   | 'event-timeline'
   | 'alerts-summary'
   | 'trend-analysis'
   | 'capacity-planning'
   | 'kpi-section'
   | 'ai-analysis'
   | 'predictions'
   | 'recommendations';

// ==================== Cluster Health Summary ====================

export interface ClusterHealthSummary {
   health: 'HEALTH_OK' | 'HEALTH_WARN' | 'HEALTH_ERR';
   uptime: number; // percentage
   availability: number; // percentage
   activeAlarms: number;
   healthTrend: 'improving' | 'stable' | 'degrading';
   healthScore?: number; // 0-100 overall health score
   aiInsight?: string;
   healthDetails?: Record<string, string>; // e.g., { "mons": "3 monitors", "osds": "12 osds: 12 up, 12 in" }
}

// ==================== Key Metrics ====================

export interface KeyMetrics {
   capacity: CapacityMetrics;
   performance: PerformanceMetricsSummary;
   pgStatus: PgStatusMetrics;
   osdStatus: OsdStatusMetrics;
}

export interface CapacityMetrics {
   totalCapacity: number; // bytes
   usedCapacity: number; // bytes
   availableCapacity: number; // bytes
   utilizationPercent: number;
}

export interface PerformanceMetricsSummary {
   readOps: number;
   writeOps: number;
   readThroughput: number; // MB/s
   writeThroughput: number; // MB/s
   avgLatency: number; // ms
   peakLatency: number; // ms
}

export interface PgStatusMetrics {
   activePgs: number;
   degradedPgs: number;
   inconsistentPgs: number;
   recoveringPgs: number;
   backfillingPgs: number;
}

export interface OsdStatusMetrics {
   totalOsds: number;
   upOsds: number;
   inOsds: number;
   healthyOsds: number;
   nearFullOsds: number;
   fullOsds: number;
}

// ==================== Trend Analysis ====================

export interface TrendData {
   category: string;
   data: TrendPoint[];
   statistics?: Record<string, any>; // e.g., { min: 3000, max: 8500, avg: 5200, stdDev: 1200 }
   insights: string[];
   prediction?: PredictionData;
}

export interface TrendPoint {
   timestamp: string;
   value: number;
   label?: string;
}

export interface PredictionData {
   trend: 'increasing' | 'decreasing' | 'stable';
   projectedValue: number;
   confidence: number; // 0-100
   timeToThreshold?: number; // days
}

// ==================== KPI Data ====================

export interface KPI {
   metric: string;
   value: string | number;
   target: string | number;
   status: 'success' | 'warning' | 'danger';
   trend: string;
   unit?: string;
}

export interface KPISection {
   title: string;
   period: string;
   kpis: KPI[];
}

// ==================== AI Insights ====================

export interface AIInsights {
   modelInfo: AIModelInfo;
   anomalies: AnomalyDetection[];
   patterns: PatternRecognition[];
   predictions: PredictiveAnalytics[];
   recommendations: OptimizationRecommendation[];
   ragGuidance?: RAGGuidance;
}

export interface AIModelInfo {
   model: string;
   embedding: string;
   vectorDB: string;
   version?: string;
   lastTraining?: string;
}

export interface AnomalyDetection {
   id: string;
   timestamp: string;
   component: string;
   metric: string;
   anomalyScore: number; // 0-1
   severity: 'low' | 'medium' | 'high' | 'critical';
   description: string;
   confidence: number; // 0-100
}

export interface PatternRecognition {
   id: string;
   pattern: string;
   occurrences: number;
   firstSeen: string;
   lastSeen: string;
   impact: 'low' | 'medium' | 'high';
   description: string;
}

export interface PredictiveAnalytics {
   category: string;
   probability: number; // 0-100
   impact: 'low' | 'medium' | 'high' | 'critical';
   estimatedTime: string; // e.g., "7 days"
   evidenceMetrics: string[];
   anomalyScores: number[];
   riskFactors: RiskFactor[];
   confidence: number; // 0-100
   modelUsed: string;
   recommendations: string[];
}

export interface RiskFactor {
   factor: string;
   contribution: number; // percentage
   severity: 'low' | 'medium' | 'high';
}

export interface OptimizationRecommendation {
   id: string;
   category: string;
   title: string;
   description: string;
   priority: 'low' | 'medium' | 'high' | 'critical';
   estimatedImpact: string;
   effort: 'low' | 'medium' | 'high';
   commands?: string[];
   ragContext?: string;
}

export interface RAGGuidance {
   context: string;
   commands: string[];
   sources: DocumentReference[];
   confidence: number;
}

export interface DocumentReference {
   title: string;
   url: string;
   relevance: number;
}

// ==================== Event Timeline ====================

export interface EventTimeline {
   events: TimelineEvent[];
   totalEvents: number;
   criticalEvents: number;
   warningEvents: number;
   infoEvents: number;
}

export interface TimelineEvent {
   id: string;
   timestamp: string;
   type: 'info' | 'warning' | 'error' | 'critical';
   component: string;
   message: string;
   details?: string;
   resolved?: boolean;
   resolvedAt?: string;
}

// ==================== Alerts Summary ====================

export interface AlertsSummary {
   total: number;
   critical: number;
   warning: number;
   info: number;
   recentAlerts: Alert[];
   topAlerts: Alert[];
}

export interface Alert {
   id: string;
   severity: 'info' | 'warning' | 'error' | 'critical';
   title: string;
   message: string;
   component: string;
   timestamp: string;
   acknowledged: boolean;
   resolveAction?: string;
}

// ==================== Template Management ====================

export interface ReportTemplate {
   id: string;
   name: string;
   description: string;
   type: ReportType;
   sections: TemplateSectionConfig[];
   createdAt: string;
   updatedAt: string;
   createdBy: string;
   isDefault: boolean;
   thumbnail?: string;
}

export interface TemplateSectionConfig {
   type: SectionType;
   enabled: boolean;
   order: number;
   config?: Record<string, any>;
}

// ==================== Schedule Configuration ====================

export interface ReportSchedule {
   id: string;
   reportType: ReportType;
   templateId?: string;
   frequency: FrequencyType;
   time: string; // HH:mm format
   timezone: string;
   recipients: string[]; // email addresses
   format: ExportFormat;
   includeAI: boolean;
   enabled: boolean;
   nextRun?: string; // ISO date string
   lastRun?: string; // ISO date string
   createdAt: string;
   updatedAt: string;
}

// ==================== Export Configuration ====================

export interface ExportOptions {
   format: ExportFormat;
   includeAI: boolean;
   includeCharts: boolean;
   orientation?: 'portrait' | 'landscape'; // PDF only
   pageSize?: 'A4' | 'Letter'; // PDF only
   compression?: boolean; // PDF/Excel
}

// ==================== Email Configuration ====================

export interface EmailParams {
   to: string[];
   cc?: string[];
   bcc?: string[];
   subject: string;
   message?: string;
   attachFormat: ExportFormat;
   scheduleId?: string;
}

// ==================== Report Generation ====================

export interface GenerateReportParams {
   type: ReportType;
   timeRange: TimeRange;
   templateId?: string;
   options: ReportOptions;
}

export interface ReportOptions {
   includeAI: boolean;
   includePredictions: boolean;
   includeRecommendations: boolean;
   sections?: SectionType[];
   customConfig?: Record<string, any>;
}

export interface ReportData {
   clusterHealth?: ClusterHealthSummary;
   keyMetrics?: KeyMetrics;
   trends?: Record<string, TrendData>; // Changed from TrendData[] to match backend Map<String, TrendData>
   poolsSummary?: PoolSummary[]; // Added
   hostsSummary?: HostSummary[]; // Added
   disks?: InventoryResponse[]; // Added - disk inventory from hosts
   kpis?: KPISection;
   events?: EventTimeline;
   alerts?: AlertsSummary;

   // Section-specific data for report pages
   risks?: Array<{
      level: string;
      category: string;
      description: string;
      impact: string;
   }>;
   criticalIssues?: Array<{
      severity: string;
      title: string;
      description: string;
      action: string;
   }>;
   infrastructure?: {
      hosts?: Array<{
         hostname: string;
         cpuCores?: number;
         cpuModel?: string;
         memoryGB?: number;
         osdCount?: number;
         status?: string;
      }>;
      disks?: Array<{
         osdId: number;
         hostname: string;
         device: string;
         deviceClass: string;
         sizeBytes: number;
         usedBytes: number;
         healthStatus?: string;
      }>;
      pools?: Array<{
         name: string;
         type: string;
         size: number;
         minSize: number;
         pgNum: number;
         used: number;
         available: number;
      }>;
      crushMap?: any;
      networkTopology?: any;
      pgDistribution?: any;
   };
   performance?: {
      iops?: {
         topClients?: any[];
      };
      latency?: {
         percentiles?: {
            p50: number;
            p95: number;
            p99: number;
         };
         slowRequests?: any[];
      };
      throughput?: {
         recoveryImpact?: any;
      };
   };
   capacity?: {
      total?: number;
      used?: number;
      available?: number;
      poolUsage?: any[];
      predictions?: any;
   };
   aiAnalysisConfidence?: number;
   availability?: {
      dataProtection?: any;
      recoveryReadiness?: any;
      replicationStatus?: any[];
      scrubStatus?: any[];
   };
   history?: {
      configChanges?: any[];
      maintenanceLogs?: any[];
      incidents?: any[];
      performanceTuning?: any[];
   };
   details?: {
      osds?: any[];
      pools?: any[];
      clients?: any[];
      configParams?: any[];
   };

   performanceMetrics?: PerformanceMetrics;
   capacityPlanning?: CapacityPlanning;
   customSections?: CustomSection[];
}

// ==================== Pool Summary ====================

export interface PoolSummary {
   poolName: string;
   poolId: number;
   size: number;
   minSize: number;
   pgNum: number;
   maxBytes: number;
   usedBytes: number;
   usagePercent: number;
   objectCount: number;
   readOps: number;
   writeOps: number;
   readMBps: number;
   writeMBps: number;
}

// ==================== Host Summary ====================

export interface HostSummary {
   hostname: string;
   osdCount: number;
   totalOsds: number;
   upOsds: number;
   avgCpuUsage: number;
   avgMemUsage: number;
   networkRxMBps: number;
   networkTxMBps: number;
}

// ==================== Performance Metrics ====================

export interface PerformanceMetrics {
   iops: MetricSeries;
   latency: MetricSeries;
   throughput: MetricSeries;
   bottlenecks: Bottleneck[];
   optimizations: PerformanceOptimization[];
}

export interface MetricSeries {
   name: string;
   unit: string;
   data: MetricDataPoint[];
   avg: number;
   min: number;
   max: number;
   p95: number;
   p99: number;
}

export interface MetricDataPoint {
   timestamp: string;
   value: number;
   label?: string;
}

export interface Bottleneck {
   id: string;
   component: string;
   type: 'cpu' | 'memory' | 'disk' | 'network';
   severity: 'low' | 'medium' | 'high';
   description: string;
   impact: string;
   solution?: string;
}

export interface PerformanceOptimization {
   id: string;
   title: string;
   description: string;
   category: string;
   estimatedImprovement: string;
   complexity: 'low' | 'medium' | 'high';
   steps: string[];
}

// ==================== Capacity Planning ====================

export interface CapacityPlanning {
   currentUtilization: ReportPoolUtilization[];
   forecast: CapacityForecast;
   exhaustionPrediction: ExhaustionPrediction[];
   expansionPlan?: ExpansionPlan;
}

export interface ReportPoolUtilization {
   poolId: number;
   poolName: string;
   used: number;
   available: number;
   total: number;
   utilizationPercent: number;
   trend: TrendPoint[];
}

export interface CapacityForecast {
   predictions: ForecastPrediction[];
   scenarios: Scenario[];
   timeRange: number; // months
   confidence: number;
}

export interface ForecastPrediction {
   timestamp: string;
   conservative: number;
   normal: number;
   aggressive: number;
}

export interface Scenario {
   name: 'conservative' | 'normal' | 'aggressive';
   growthRate: number; // percentage per month
   exhaustionDate?: string;
}

export interface ExhaustionPrediction {
   poolId: number;
   poolName: string;
   currentUsage: number;
   estimatedExhaustionDate: string;
   daysRemaining: number;
   confidence: number;
   recommendation: string;
}

export interface ExpansionPlan {
   recommendedOsds: number;
   estimatedCapacityIncrease: number;
   costEstimate?: CostEstimate;
   timeline: string;
   phases: ExpansionPhase[];
}

export interface CostEstimate {
   hardware: number;
   labor: number;
   total: number;
   currency: string;
}

export interface ExpansionPhase {
   phase: number;
   description: string;
   osdsToAdd: number;
   duration: string;
   dependencies?: string[];
}

// ==================== Custom Report Builder ====================

export interface CustomReport {
   id: string;
   name: string;
   components: ReportComponent[];
   layout: LayoutConfig;
   createdAt: string;
   updatedAt: string;
}

export interface ReportComponent {
   id: string;
   type: ComponentType;
   position: Position;
   size: Size;
   config: ComponentConfig;
}

export type ComponentType =
   | 'line-chart'
   | 'bar-chart'
   | 'pie-chart'
   | 'heatmap'
   | 'metric-card'
   | 'gauge'
   | 'progress'
   | 'ai-insights'
   | 'predictions'
   | 'anomalies'
   | 'table'
   | 'text';

export interface Position {
   x: number;
   y: number;
}

export interface Size {
   width: number;
   height: number;
}

export interface ComponentConfig {
   title?: string;
   dataSource?: string;
   refreshInterval?: number;
   customOptions?: Record<string, any>;
}

export interface LayoutConfig {
   type: 'grid' | 'flex' | 'absolute';
   columns?: number;
   gap?: number;
   padding?: number;
}

// ==================== Custom Sections ====================

export interface CustomSection {
   id: string;
   title: string;
   type: string;
   content: any;
   order: number;
}

// ==================== API Responses ====================

export interface ReportListResponse {
   reports: Report[];
   total: number;
   page: number;
   pageSize: number;
}

export interface TemplateListResponse {
   templates: ReportTemplate[];
   total: number;
}

export interface ScheduleListResponse {
   schedules: ReportSchedule[];
   total: number;
}

export interface GenerateReportResponse {
   report: Report;
   status: 'success' | 'error';
   message?: string;
}

export interface ExportResponse {
   url: string;
   format: ExportFormat;
   size: number; // bytes
   expiresAt: string;
}

export interface SendEmailResponse {
   status: 'success' | 'error';
   message: string;
   sentTo: string[];
   timestamp: string;
}

// ==================== Utility Types ====================

export interface DateRangePreset {
   label: string;
   value: string;
   getTimeRange: () => TimeRange;
}

export interface ChartConfig {
   type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap' | 'gauge';
   data: any[];
   options: Record<string, any>;
}

export interface ReportHistory {
   reportId: string;
   timestamp: string;
   type: ReportType;
   status: ReportStatus;
   duration: number; // milliseconds
   size: number; // bytes
}

// ==================== Inventory Response ====================
// Note: All fields use snake_case due to @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class) on backend

export interface InventoryResponse {
   name: string; // hostname
   addr: string; // host address
   devices: InventoryDevice[];
   labels: string[];
}

export interface InventoryDevice {
   ceph_device: boolean | null;
   rejected_reasons: string[];
   available: boolean;
   path: string; // e.g., "/dev/sdb"
   sys_api: DeviceSysApi;
   created: string;
   lvs: DeviceLv[];
   human_readable_type: string; // "ssd" or "hdd"
   device_id: string;
   lsm_data: Record<string, any>;
   crush_device_class: string | null;
   being_replaced?: boolean;
   osd_ids: number[];
}

export interface DeviceSysApi {
   actuators: any | null;
   device_nodes: string[];
   devname: string;
   human_readable_size: string; // "10.00 GB"
   id_bus: string;
   model: string;
   nr_requests: string;
   parent: string;
   partitions: Record<string, any>;
   path: string;
   removable: string;
   rev: string;
   ro: string;
   rotational: string;
   sas_address: string;
   sas_device_handle: string;
   scheduler_mode: string;
   sectors: number;
   sectorsize: string;
   size: number; // bytes
   support_discard: string;
   type: string;
   vendor: string;
}

export interface DeviceLv {
   block_uuid: string;
   cluster_fsid: string;
   cluster_name: string;
   name: string;
   osd_fsid: string;
   osd_id: string;
   osdspec_affinity: string;
   type: string;
}
