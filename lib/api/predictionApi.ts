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
   * Uses 300 seconds timeout (LLM + RAG with multiple tool calls can take very long)
   */
  static async getPrediction(category: PredictionCategory): Promise<PredictionResponse> {
    return await apiClient.get<PredictionResponse>(
      `/api/v1/prediction/${category}`,
      { timeout: 300000 } // 300 seconds (5분) timeout for LLM + RAG processing
    );
  }

  /**
   * Get all predictions for all categories (Optimized)
   *
   * 1단계: 11개 예측을 병렬로 가져옴 (comprehensive 제외)
   * 2단계: 수집된 11개 결과를 POST로 전달하여 comprehensive 분석 수행
   *
   * 이 방식은 백엔드에서 11개 예측을 중복 호출하지 않아 API 호출 수를 절반으로 줄입니다.
   * 기존: 프론트 11개 + 백엔드 comprehensive 내부 11개 = 22개 호출
   * 최적화: 프론트 11개 + POST comprehensive = 12개 호출
   */
  static async getAllPredictions(): Promise<Record<PredictionCategory, PredictionResponse>> {
    // 11개 카테고리 (comprehensive 제외)
    const individualCategories: PredictionCategory[] = [
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
      'metric-disk-failure'
    ];

    // 1단계: 11개 예측 병렬 호출
    const individualPredictions = await Promise.all(
      individualCategories.map(cat =>
        PredictionAPI.getPrediction(cat)
          .catch(error => {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`⚠️ Prediction unavailable for ${cat} (using fallback)`);
            }
            return PredictionAPI.createFallbackPrediction(cat);
          })
      )
    );

    // 2단계: 수집된 11개 결과를 POST로 전달하여 comprehensive 분석
    let comprehensivePrediction: PredictionResponse;
    try {
      comprehensivePrediction = await PredictionAPI.postComprehensive(individualPredictions);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ Comprehensive prediction unavailable (using fallback)`);
      }
      comprehensivePrediction = PredictionAPI.createFallbackPrediction('comprehensive');
    }

    // Convert array to record
    const result: Record<string, PredictionResponse> = {};
    individualCategories.forEach((cat, index) => {
      result[cat] = individualPredictions[index];
    });
    result['comprehensive'] = comprehensivePrediction;

    return result as Record<PredictionCategory, PredictionResponse>;
  }

  /**
   * Get prediction summary
   * Uses 300 seconds timeout (summary executes 12 parallel predictions with LLM + RAG calls)
   */
  static async getPredictionSummary(): Promise<PredictionSummary> {
    return await apiClient.get<PredictionSummary>(
      '/api/v1/prediction/summary',
      { timeout: 300000 } // 300 seconds (5분) - summary executes 12 predictions in parallel with LLM calls
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
   * Get comprehensive prediction using POST (optimized)
   *
   * 프론트엔드에서 이미 수집한 11개 예측 결과를 전달하여
   * 백엔드에서 중복 호출 없이 종합 분석을 수행합니다.
   *
   * @param predictions 11개 예측 결과 (comprehensive 제외)
   * @returns 종합 분석 결과
   */
  static async postComprehensive(predictions: PredictionResponse[]): Promise<PredictionResponse> {
    return await apiClient.post<PredictionResponse>(
      '/api/v1/prediction/comprehensive',
      { predictions },
      { timeout: 300000 } // 300 seconds (5분) timeout for LLM + RAG processing
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
