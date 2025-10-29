import { apiClient } from './client';

// Prediction API Types (matching backend PredictionResponse.java)
export interface PredictionResponse {
  categoryId: string;
  categoryName: string;
  riskScore: number; // 0.0 ~ 1.0
  riskLevel: string; // LOW, MEDIUM, HIGH, CRITICAL, UNKNOWN
  confidence: number; // 0.0 ~ 1.0
  predictedTimeToFailure: string; // e.g. "3 days", "2 weeks", "N/A"
  aiAnalysis: string;
  affectedResources: string[];
  metrics: Record<string, any>;
  recommendedActions: string[];
  rootCauses: string[];
  trend: string; // improving, stable, worsening
  historicalData: HistoricalDataPoint[];
  timestamp: string; // ISO 8601
  modelInfo: ModelInfo;
}

export interface HistoricalDataPoint {
  timestamp: string; // ISO 8601
  riskScore: number;
  status: string;
}

export interface ModelInfo {
  modelName: string;
  modelVersion: string;
  accuracy: number;
  lastTrainedAt: string; // ISO 8601
}

export interface PredictionSummary {
  overall_risk: string;
  overall_risk_score: number; // 0.0 ~ 1.0
  critical_count: number;
  high_risk_categories: number;
  medium_risk_categories: number;
  low_risk_categories: number;
  imminent_failures: number; // 24시간 이내 장애 예측 수
  total_categories: number;
  last_updated: string;
  next_update: string;
  categories: Array<{
    id: string;
    name: string;
    risk: string;
    score: number;
  }>;
}

// 12 prediction categories from backend
export type PredictionCategory =
  | 'osd-failure'
  | 'capacity-exhaustion'
  | 'performance-degradation'
  | 'pg-imbalance'
  | 'network-bottleneck'
  | 'memory-shortage'
  | 'rebalancing-needed'
  | 'hotspot-osd'
  | 'cluster-expansion'
  | 'smart-disk-failure'
  | 'metric-disk-failure'
  | 'comprehensive';

/**
 * Prediction API Client
 * Connects to backend /api/v1/prediction endpoints
 */
export class PredictionAPI {
  /**
   * Get prediction for a specific category
   * Uses 90 seconds timeout (LLM calls take 10+ seconds, consistent with summary API)
   */
  static async getPrediction(category: PredictionCategory): Promise<PredictionResponse> {
    return await apiClient.get<PredictionResponse>(
      `/api/v1/prediction/${category}`,
      { timeout: 90000 } // 90 seconds timeout for LLM processing
    );
  }

  /**
   * Get all predictions for all categories
   * Fetches in parallel with 90 second timeout and graceful fallback
   */
  static async getAllPredictions(): Promise<Record<PredictionCategory, PredictionResponse>> {
    const categories: PredictionCategory[] = [
      'osd-failure',
      'capacity-exhaustion',
      'performance-degradation',
      'pg-imbalance',
      'network-bottleneck',
      'memory-shortage',
      'rebalancing-needed',
      'hotspot-osd',
      'cluster-expansion',
      'smart-disk-failure',
      'metric-disk-failure',
      'comprehensive'
    ];

    // Fetch all predictions in parallel with fast failure
    const predictions = await Promise.all(
      categories.map(cat =>
        PredictionAPI.getPrediction(cat)
          .catch(error => {
            // Use warn instead of error for less noise
            if (process.env.NODE_ENV === 'development') {
              console.warn(`⚠️ Prediction unavailable for ${cat} (using fallback)`);
            }
            // Return fallback prediction on error
            return PredictionAPI.createFallbackPrediction(cat);
          })
      )
    );

    // Convert array to record
    const result: Record<string, PredictionResponse> = {};
    categories.forEach((cat, index) => {
      result[cat] = predictions[index];
    });

    return result as Record<PredictionCategory, PredictionResponse>;
  }

  /**
   * Get prediction summary
   * Uses 90 seconds timeout (summary takes ~45 seconds due to 12 parallel predictions with LLM calls)
   */
  static async getPredictionSummary(): Promise<PredictionSummary> {
    return await apiClient.get<PredictionSummary>(
      '/api/v1/prediction/summary',
      { timeout: 90000 } // 90 seconds - summary executes 12 predictions in parallel with LLM calls
    );
  }

  /**
   * Get predictions for specific categories
   */
  static async getPredictions(categories: PredictionCategory[]): Promise<PredictionResponse[]> {
    return await Promise.all(
      categories.map(cat => PredictionAPI.getPrediction(cat))
    );
  }

  /**
   * Create a fallback prediction when API fails
   */
  private static createFallbackPrediction(category: PredictionCategory): PredictionResponse {
    const categoryNames: Record<PredictionCategory, string> = {
      'osd-failure': 'OSD Failure',
      'capacity-exhaustion': 'Capacity Exhaustion',
      'performance-degradation': 'Performance Degradation',
      'pg-imbalance': 'PG Imbalance',
      'network-bottleneck': 'Network Bottleneck',
      'memory-shortage': 'Memory Shortage',
      'rebalancing-needed': 'Rebalancing Needed',
      'hotspot-osd': 'Hotspot OSD',
      'cluster-expansion': 'Cluster Expansion',
      'smart-disk-failure': 'SMART Disk Failure',
      'metric-disk-failure': 'Metric Disk Failure',
      'comprehensive': 'Comprehensive Analysis'
    };

    return {
      categoryId: category,
      categoryName: categoryNames[category] || category,
      riskScore: 0.0,
      riskLevel: 'UNKNOWN',
      confidence: 0.0,
      predictedTimeToFailure: 'N/A',
      aiAnalysis: '현재 예측 데이터를 가져올 수 없습니다. 백엔드 연결을 확인해주세요.',
      affectedResources: [],
      metrics: {},
      recommendedActions: ['시스템 점검', '백엔드 연결 확인'],
      rootCauses: ['데이터 수집 오류'],
      trend: 'stable',
      historicalData: [],
      timestamp: new Date().toISOString(),
      modelInfo: {
        modelName: 'N/A',
        modelVersion: 'N/A',
        accuracy: 0.0,
        lastTrainedAt: new Date().toISOString()
      }
    };
  }
}
