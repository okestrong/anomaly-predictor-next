/**
 * Extended Report Type Definitions for TREND and PREDICTIONS reports
 * These types match the backend DTO structures
 */

// ==================== Common Types ====================

export interface TimeRange {
   start: string; // LocalDateTime as ISO string
   end: string;
   label?: string;
   granularity?: string; // e.g., "1h", "1d"
}

export interface TrendPoint {
   timestamp: string; // LocalDateTime as ISO string
   value: number;
   label?: string;
}

export interface TrendStatistics {
   average: number;
   min: number;
   max: number;
   trend: string; // "increasing" | "decreasing" | "stable"
   changePercent: number;
   standardDeviation: number;
}

// ==================== TREND Report Types ====================

export interface TrendReportResponse {
   id: string;
   type: 'TREND';
   title: string;
   description: string;
   status: string;
   createdAt: string;
   updatedAt: string;
   generatedBy: string;
   timeRange: TimeRange;
   data: TrendReportData;
   metadata: TrendMetadata;
}

export interface TrendReportData {
   clusterSummary: ClusterSummary;
   trendSummary: TrendSummary;
   capacity: CapacityTrends;
   performance: PerformanceTrends;
   availability: AvailabilityTrends;
   ioPattern: IOPatternTrends;
   recovery: RecoveryTrends;
   clientActivity: ClientActivityTrends;
   resources: ResourceTrends;
   errors: ErrorTrends;
}

export interface ClusterSummary {
   health: string;
   capacityUtilization: number;
   activeAlerts: number;
   totalOsds: number;
   upOsds: number;
   totalCapacity: number;
   usedCapacity: number;
}

export interface TrendSummary {
   capacityGrowth: string;
   performanceTrend: string;
   availabilityTrend: string;
   keyFindings: string[];
}

export interface CapacityTrends {
   clusterCapacity: TrendPoint[];
   usedCapacity: TrendPoint[];
   availableCapacity: TrendPoint[];
   utilizationPercent: TrendPoint[];
   poolUsage: Record<string, TrendPoint[]>;
   osdUtilization: TrendPoint[];
   statistics: TrendStatistics;
   insights: string[];
}

export interface PerformanceTrends {
   readLatency: TrendPoint[];
   writeLatency: TrendPoint[];
   readIops: TrendPoint[];
   writeIops: TrendPoint[];
   totalIops: TrendPoint[];
   readThroughput: TrendPoint[];
   writeThroughput: TrendPoint[];
   totalThroughput: TrendPoint[];
   statistics: TrendStatistics;
   insights: string[];
}

export interface AvailabilityTrends {
   upOsds: TrendPoint[];
   downOsds: TrendPoint[];
   activePgs: TrendPoint[];
   degradedPgs: TrendPoint[];
   inconsistentPgs: TrendPoint[];
   monitorQuorum: TrendPoint[];
   healthScore: TrendPoint[];
   statistics: TrendStatistics;
   insights: string[];
}

export interface IOPatternTrends {
   readRatio: TrendPoint[];
   writeRatio: TrendPoint[];
   queueLength: TrendPoint[];
   slowOps: TrendPoint[];
   blockedOps: TrendPoint[];
   statistics: TrendStatistics;
   insights: string[];
}

export interface RecoveryTrends {
   recoveringObjects: TrendPoint[];
   recoverySpeed: TrendPoint[];
   misplacedObjects: TrendPoint[];
   degradedObjects: TrendPoint[];
   balancerScore: TrendPoint[];
   statistics: TrendStatistics;
   insights: string[];
}

export interface ClientActivityTrends {
   activeClients: TrendPoint[];
   clientIops: TrendPoint[];
   clientBandwidth: TrendPoint[];
   statistics: TrendStatistics;
   insights: string[];
}

export interface ResourceTrends {
   avgCpuUsage: TrendPoint[];
   avgMemUsage: TrendPoint[];
   diskIops: TrendPoint[];
   diskLatency: TrendPoint[];
   networkRx: TrendPoint[];
   networkTx: TrendPoint[];
   networkErrors: TrendPoint[];
   statistics: TrendStatistics;
   insights: string[];
}

export interface ErrorTrends {
   scrubErrors: TrendPoint[];
   deepScrubErrors: TrendPoint[];
   readErrors: TrendPoint[];
   writeErrors: TrendPoint[];
   healthWarnings: TrendPoint[];
   activeAlerts: TrendPoint[];
   statistics: TrendStatistics;
   insights: string[];
}

export interface TrendMetadata {
   clusterName: string;
   clusterHealth: string;
   totalOsds: number;
   totalHosts: number;
   totalPools: number;
   cephVersion: string;
   generationTime: number; // milliseconds
   dataPoints: number;
   granularity: string;
}

// ==================== PREDICTIONS Report Types ====================

export interface PredictionsReportResponse {
   id: string;
   type: 'PREDICTIONS';
   title: string;
   description: string;
   status: string;
   createdAt: string;
   updatedAt: string;
   generatedBy: string;
   timeRange: TimeRange;
   data: PredictionsReportData;
   metadata: PredictionsMetadata;
}

export interface PredictionsReportData {
   summary: PredictionsSummary;
   predictions: PredictionDetail[];
   recommendedActions: RecommendedAction[];
}

export interface PredictionsSummary {
   overallRiskScore: number; // 0-100
   riskDistribution: RiskDistribution;
   categoryBreakdown: CategoryBreakdown;
   timeDistribution: TimeToImpactDistribution;
   confidenceStats: ConfidenceStatistics;
   affectedComponents: AffectedComponentsSummary;
   riskTrendLast7Days: TrendPoint[];
   llmComprehensiveAnalysis: string;
   highRiskPredictions: HighRiskPrediction[];
   highRiskSummary: string;
}

export interface RiskDistribution {
   critical: number;
   high: number;
   medium: number;
   low: number;
}

export interface CategoryBreakdown {
   osdFailure: CategoryStats;
   capacityExhaustion: CategoryStats;
   performanceDegradation: CategoryStats;
   pgImbalance: CategoryStats;
   networkBottleneck: CategoryStats;
   memoryShortage: CategoryStats;
   rebalancingNeeded: CategoryStats;
   hotspotOsd: CategoryStats;
   clusterExpansion: CategoryStats;
   smartDiskFailure: CategoryStats;
   metricDiskFailure: CategoryStats;
   comprehensive: CategoryStats;
}

export interface CategoryStats {
   riskLevel: string;
   probability: number;
   confidence: number;
}

export interface TimeToImpactDistribution {
   immediate: number; // < 24h
   short: number; // 1-7 days
   medium: number; // 7-30 days
   long: number; // > 30 days
}

export interface ConfidenceStatistics {
   averageConfidence: number;
   minConfidence: number;
   maxConfidence: number;
   highConfidenceCount: number; // confidence > 80
}

export interface AffectedComponentsSummary {
   totalComponents: number;
   osds: string[];
   pools: string[];
   hosts: string[];
}

export interface HighRiskPrediction {
   category: string;
   name: string;
   severity: string;
   probability: number;
   timeToImpact: number; // hours
   affectedComponents: string[];
   shortSummary: string;
}

export interface PredictionDetail {
   id: string;
   category: string; // prediction category ID
   name: string; // human-readable name
   severity: string; // "critical" | "high" | "medium" | "low"
   probability: number; // 0-100
   confidence: number; // 0-100
   timeToImpact: number; // hours
   affectedComponents: string[];
   description: string;
   evidenceMetrics: string[];
   riskFactors: string[];
   recommendations: string[];
}

export interface RecommendedAction {
   priority: string; // "critical" | "high" | "medium" | "low"
   category: string;
   title: string;
   description: string;
   estimatedImpact: string;
   commands: string[];
}

export interface PredictionsMetadata {
   clusterName: string;
   clusterHealth: string;
   totalOsds: number;
   aiModelInfo: AIModelInfo;
   generationTime: number; // milliseconds
   categoriesAnalyzed: number;
}

export interface AIModelInfo {
   model: string;
   version: string;
   confidence: number;
}
