// 페이지 관련 타입 정의
export type PageType = 'main' | 'sub'

export interface PageMeta {
  pageType: PageType
  title: string
  description?: string
  requiresAuth?: boolean
}

// 라우트 정보 타입
export interface RouteInfo {
  path: string
  name: string
  title: string
  description: string
  pageType: PageType
}

// 앱의 모든 라우트 정의
export const routes: Record<string, RouteInfo> = {
  dashboard: {
    path: '/',
    name: 'Dashboard',
    title: 'AI Ceph Dashboard',
    description: 'Ceph 클러스터 AI 기반 이상 탐지 대시보드',
    pageType: 'main'
  },
  monitoring: {
    path: '/monitoring',
    name: 'Monitoring',
    title: 'Real-time Monitoring',
    description: 'Ceph 클러스터 실시간 모니터링',
    pageType: 'sub'
  },
  anomaly: {
    path: '/anomaly',
    name: 'Anomaly',
    title: 'Anomaly Detection',
    description: 'AI 기반 이상 상황 탐지 및 예측',
    pageType: 'sub'
  },
  performance: {
    path: '/performance',
    name: 'Performance',
    title: 'Performance Analytics',
    description: '성능 분석 및 최적화 제안',
    pageType: 'sub'
  },
  health: {
    path: '/health',
    name: 'Health',
    title: 'Cluster Health',
    description: '클러스터 상태 및 건강도 모니터링',
    pageType: 'sub'
  },
  storage: {
    path: '/storage',
    name: 'Storage',
    title: 'Storage Management',
    description: '스토리지 용량 및 관리',
    pageType: 'sub'
  },
  network: {
    path: '/network',
    name: 'Network',
    title: 'Network Status',
    description: '네트워크 상태 및 트래픽 분석',
    pageType: 'sub'
  },
  prediction: {
    path: '/prediction',
    name: 'Prediction',
    title: 'AI Prediction',
    description: 'RAG 기반 예측 및 컨설팅',
    pageType: 'sub'
  },
  alerts: {
    path: '/alerts',
    name: 'Alerts',
    title: 'Alert Management',
    description: '알림 관리 및 설정',
    pageType: 'sub'
  },
  topology: {
    path: '/topology',
    name: 'ClusterTopology',
    title: 'Cluster Topology',
    description: 'Pool, PG, OSD 관계 3D 시각화',
    pageType: 'sub'
  }
}

// 페이지 전환 애니메이션 결정 함수
export function getTransitionName(fromPageType?: PageType, toPageType?: PageType): string {
  // 초기 로드이거나 from이 없는 경우
  if (!fromPageType) {
    return 'page-slide-down'
  }

  // main → sub: slide-down (drill down 효과)
  if (fromPageType === 'main' && toPageType === 'sub') {
    return 'page-slide-down'
  }
  
  // sub → main: slide-up 
  if (fromPageType === 'sub' && toPageType === 'main') {
    return 'page-slide-up'
  }
  
  // sub → sub: page-flip (종이 넘기는 효과)
  if (fromPageType === 'sub' && toPageType === 'sub') {
    return 'page-flip'
  }
  
  // 기본값: slide-down
  return 'page-slide-down'
}

// 차트 데이터 관련 타입들
export interface ChartDataPoint {
  timestamp: number
  value: number
  label?: string
}

export interface ChartMetrics {
  poolUsage: ChartDataPoint[]
  iops: ChartDataPoint[]
  latency: ChartDataPoint[]
  throughput: ChartDataPoint[]
  scrubErrors: ChartDataPoint[]
  pgInconsistency: ChartDataPoint[]
  networkErrors: ChartDataPoint[]
  osdPerformance: ChartDataPoint[]
}

// 컴포넌트 props 관련 타입들
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export type ButtonVariant = 'default' | 'primary' | 'secondary' | 'danger' | 'ghost' | 'ai' | 'cyber'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

export interface ButtonProps extends BaseComponentProps {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export type CardVariant = 'default' | 'ai' | 'neural' | 'cyber'
export type CardSize = 'sm' | 'md' | 'lg'

export interface CardProps extends BaseComponentProps {
  title?: string
  variant?: CardVariant
  size?: CardSize
  padding?: 'none' | 'sm' | 'md' | 'lg'
  footerPadding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  clickable?: boolean
  header?: React.ReactNode
  footer?: React.ReactNode
  backgroundColor?: string
}

// API 관련 타입들
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ClusterStatus {
  status: 'healthy' | 'warning' | 'error'
  osdCount: number
  poolCount: number
  pgCount: number
  capacity: {
    total: number
    used: number
    available: number
    usagePercentage: number
  }
  health: {
    status: string
    checks: any[]
  }
}

export interface MetricConfig {
  min: number
  max: number
  variance: number // 변동 폭 (0.1 = 10%)
  trend: number // 트렌드 (-0.01 = 하락, 0.01 = 상승)
  spikeProbability: number // 스파이크 발생 확률 (0-1)
  spikeMultiplier: number // 스파이크 시 곱셈값
}

// 환경 설정 타입
export interface AppConfig {
  API_SERVER?: string
  USE_MOCK_DATA?: boolean
  ENVIRONMENT?: 'development' | 'production' | 'test'
}

// 테마 관련 타입들
export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeConfig {
  mode: ThemeMode
  primaryColor: string
  accentColor: string
}