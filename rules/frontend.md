# Frontend Development Guide - Anomaly Predictor Next

## 프로젝트 개요 (Project Overview)

### 프로젝트 정보
- **프로젝트명**: Anomaly Predictor Next
- **목적**: Ceph 클러스터의 AI 기반 장애 예측 및 운영 최적화 대시보드 (Vue 3 → Next.js 15 마이그레이션)
- **기술 스택**: Next.js 15, React 19, TypeScript, Tailwind CSS v4, Zustand, React Three Fiber
- **빌드 도구**: Next.js 15 App Router
- **스타일링**: Tailwind CSS v4 (prefix 제거)
- **상태 관리**: Zustand + React Context
- **3D 시각화**: React Three Fiber + @react-three/drei

### 마이그레이션 베이스
Vue 3 원본 프로젝트의 완성된 기능들:
- ✅ 4141라인의 3D 토폴로지 시각화 (ClusterTopologyVisualization.vue)
- ✅ 8개 ECharts 실시간 차트 컴포넌트
- ✅ 우주선 대시보드 UI (4개 패널)
- ✅ WebSocket STOMP 실시간 통신
- ✅ Tailwind CSS 'ceph-' prefix 시스템
- ✅ Pinia 상태 관리 및 실시간 데이터 업데이트

### 핵심 기능
1. **실시간 클러스터 모니터링**: 8개 차트 + 3D 토폴로지
2. **AI 기반 장애 예측**: 12개 예측 카테고리
3. **RAG 기반 조치 가이드**: ceph-doc-crawler + sentence-transformers
4. **ML 실시간 이상감지**: 이상 점수 + 히트맵 + 모델 성능
5. **PG 최적화 도구**: 계산기 + 분포 분석 + 시뮬레이션
6. **3D 클러스터 토폴로지**: 우주 환경 + 4계층 노드 + 인터랙션

## 기능 요구사항 (Feature Requirements)

### 1. Next.js 15 App Router 구조

#### 1.1 디렉토리 구조
```
app/
├── layout.tsx              # 루트 레이아웃 (헤더, 테마, 폰트)
├── page.tsx                # 대시보드 메인 (서버 컴포넌트)
├── globals.css             # Tailwind CSS v4 + 커스텀 스타일
├── favicon.ico             # 파비콘
├── dashboard/page.tsx      # 대시보드 페이지
├── prediction/page.tsx     # 장애 예측 메인
├── topology/page.tsx       # 3D 토폴로지 뷰
├── anomaly/page.tsx        # ML 이상감지 대시보드
├── alerts/page.tsx         # 알림 센터 페이지
├── health/page.tsx         # 헬스 체크 페이지
├── monitoring/page.tsx     # 모니터링 페이지
├── performance/page.tsx    # 성능 분석 페이지
├── network/page.tsx        # 네트워크 페이지
└── storage/page.tsx        # 스토리지 페이지
```

#### 1.2 루트 레이아웃 구현
```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Orbitron } from 'next/font/google'
import { ThemeProvider } from '@/providers/theme-provider'
import { ZustandProvider } from '@/providers/zustand-provider'
import { WebSocketProvider } from '@/providers/websocket-provider'
import AppHeader from '@/components/layout/AppHeader'
import './globals.css'

const orbitron = Orbitron({ 
  subsets: ['latin'],
  variable: '--font-orbitron'
})

export const metadata: Metadata = {
  title: 'Ceph Anomaly Predictor',
  description: 'AI 기반 Ceph 클러스터 장애 예측 및 운영 최적화 대시보드'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${orbitron.variable} font-sans antialiased`}>
        <ThemeProvider>
          <ZustandProvider>
            <WebSocketProvider>
              <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
                <AppHeader />
                <main className="container mx-auto px-4 py-6">
                  {children}
                </main>
              </div>
            </WebSocketProvider>
          </ZustandProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 2. Tailwind CSS v4 설정 (prefix 제거)

#### 2.1 Tailwind 설정 파일
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // AI 테마 색상 팔레트 (Vue 프로젝트에서 이관)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          900: '#1e3a8a'
        },
        'ai-neural': '#00d4ff',
        'ai-circuit': '#00ff88',
        'ai-energy': '#ff6b00',
        'ai-quantum': '#8b5cf6',
        'matrix-green': '#00ff41',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444'
      },
      fontFamily: {
        'orbitron': ['var(--font-orbitron)', 'monospace']
      },
      animation: {
        'neural-pulse': 'neural-pulse 2s ease-in-out infinite',
        'matrix-rain': 'matrix-rain 20s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite'
      },
      keyframes: {
        'neural-pulse': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' }
        },
        'matrix-rain': {
          '0%': { transform: 'translateY(-100vh)' },
          '100%': { transform: 'translateY(100vh)' }
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ],
}
```

#### 2.2 글로벌 CSS 파일
```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* AI 테마 커스텀 스타일 (Vue 프로젝트에서 이관) */
@layer base {
  :root {
    --bg-primary: 255 255 255;
    --bg-secondary: 248 250 252;
    --text-primary: 15 23 42;
    --border-default: 226 232 240;
  }
  
  .dark {
    --bg-primary: 15 23 42;
    --bg-secondary: 30 41 59;
    --text-primary: 248 250 252;
    --border-default: 51 65 85;
  }
  
  body {
    @apply transition-colors duration-300;
    @apply antialiased min-h-screen overflow-x-hidden;
    background: rgb(var(--bg-primary));
    color: rgb(var(--text-primary));
  }
}

@layer components {
  /* AI 카드 컴포넌트 (기존 'ceph-' prefix 제거) */
  .ai-card {
    @apply bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm;
    @apply border border-slate-200/50 dark:border-slate-700/50;
    @apply rounded-xl shadow-lg transition-all duration-300;
  }
  
  .ai-card:hover {
    @apply shadow-xl scale-[1.02] border-primary-500/50;
    @apply ring-2 ring-primary-500/20;
  }
  
  /* 네온 호버 효과 */
  .neon-hover {
    @apply transition-all duration-300;
  }
  
  .neon-hover:hover {
    @apply shadow-[0_0_20px_rgba(59,130,246,0.3)];
    @apply border-primary-500/50;
  }
  
  /* 매트릭스 애니메이션 배경 */
  .matrix-bg::before {
    content: '';
    @apply absolute inset-0 opacity-5;
    background: linear-gradient(90deg, transparent 98%, #00ff41 100%);
    background-size: 3px 3px;
    animation: matrix-rain 20s linear infinite;
  }
  
  /* 우주선 패널 스타일 */
  .spaceship-panel {
    @apply bg-slate-900/90 backdrop-blur-md border border-cyan-500/30;
    @apply rounded-lg shadow-[0_0_30px_rgba(6,182,212,0.3)];
    background: linear-gradient(135deg, 
                rgba(15, 23, 42, 0.95) 0%, 
                rgba(30, 41, 59, 0.9) 100%);
  }
  
  /* 3D 토폴로지 검색 패널 */
  .topology-search-panel {
    @apply absolute top-4 left-4 z-10;
    @apply bg-black/70 backdrop-blur-sm rounded-lg p-4;
    @apply border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)];
  }
}

@layer utilities {
  .text-glow {
    text-shadow: 0 0 10px currentColor;
  }
  
  .border-glow {
    box-shadow: 0 0 5px currentColor;
  }
  
  /* 스크롤바 커스터마이징 */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    @apply bg-slate-100 dark:bg-slate-800 rounded-full;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    @apply bg-primary-500 rounded-full;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    @apply bg-primary-600;
  }
}
```

### 3. 컴포넌트 마이그레이션 패턴

#### 3.1 Vue → React 변환 패턴

##### 기본 Card 컴포넌트
```tsx
// components/common/Card.tsx
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  title?: string
  variant?: 'default' | 'ai' | 'neural' | 'cyber'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: ReactNode
  header?: ReactNode
  footer?: ReactNode
}

export function Card({
  title,
  variant = 'default',
  size = 'md',
  className,
  children,
  header,
  footer,
  ...props
}: CardProps) {
  const cardClasses = cn(
    // 기본 스타일 (ceph- prefix 제거)
    'ai-card flex flex-col justify-between',
    
    // 변형별 스타일
    {
      'bg-gradient-to-br from-ai-neural/20 to-ai-circuit/20 border-ai-neural/30': variant === 'ai',
      'bg-gradient-to-br from-ai-quantum/20 to-purple-500/20 border-ai-quantum/30': variant === 'neural',
      'bg-gradient-to-br from-slate-800/80 to-cyan-900/80 border-cyan-500/30': variant === 'cyber'
    },
    
    // 크기별 패딩
    {
      'p-3': size === 'sm',
      'p-6': size === 'md', 
      'p-8': size === 'lg'
    },
    
    className
  )

  return (
    <div className={cardClasses} {...props}>
      {(header || title) && (
        <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
          {header || (
            title && (
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
            )
          )}
        </div>
      )}
      
      <div className="flex-1">
        {children}
      </div>
      
      {footer && (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
          {footer}
        </div>
      )}
    </div>
  )
}
```

##### Button 컴포넌트
```tsx
// components/common/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    disabled,
    children, 
    ...props 
  }, ref) => {
    const buttonClasses = cn(
      // 기본 스타일
      'inline-flex items-center justify-center font-medium rounded-lg',
      'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      
      // 변형별 스타일
      {
        'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500': variant === 'primary',
        'bg-slate-200 text-slate-900 hover:bg-slate-300 focus:ring-slate-500': variant === 'secondary',
        'bg-danger text-white hover:bg-red-700 focus:ring-red-500': variant === 'danger',
        'bg-success text-white hover:bg-green-700 focus:ring-green-500': variant === 'success',
        'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-500': variant === 'ghost'
      },
      
      // 크기별 스타일
      {
        'px-3 py-1.5 text-sm': size === 'sm',
        'px-4 py-2 text-base': size === 'md',
        'px-6 py-3 text-lg': size === 'lg'
      },
      
      className
    )

    return (
      <button
        className={buttonClasses}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"
```

### 4. ECharts SSR 최적화 시스템

#### 4.1 서버 컴포넌트용 차트 렌더러
```typescript
// lib/echarts-ssr.ts (server-only)
import 'server-only'
import * as echarts from 'echarts/core'
import { LineChart, BarChart, PieChart, GaugeChart, ScatterChart } from 'echarts/charts'
import { 
  GridComponent, 
  TooltipComponent, 
  LegendComponent,
  TitleComponent 
} from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'

// Tree-shaking을 위한 컴포넌트 등록
echarts.use([
  LineChart, 
  BarChart, 
  PieChart, 
  GaugeChart, 
  ScatterChart,
  GridComponent, 
  TooltipComponent, 
  LegendComponent,
  TitleComponent,
  SVGRenderer
])

export interface ChartSSROptions {
  width: number
  height: number
  option: echarts.EChartsOption
  theme?: 'light' | 'dark'
}

export async function renderChartToSVG({
  width,
  height,
  option,
  theme = 'light'
}: ChartSSROptions): Promise<string> {
  // 서버에서 차트 인스턴스 생성
  const chart = echarts.init(null, theme, {
    renderer: 'svg',
    ssr: true,
    width,
    height
  })

  // 성능 최적화 설정
  const optimizedOption: echarts.EChartsOption = {
    ...option,
    animation: false, // SSR에서는 애니메이션 비활성화
    animationThreshold: 2000,
    progressive: 2000,
    progressiveThreshold: 3000
  }

  chart.setOption(optimizedOption)
  
  const svgString = chart.renderToSVGString()
  chart.dispose() // 메모리 정리
  
  return svgString
}
```

#### 4.2 클라이언트 하이드레이션 컴포넌트
```tsx
// components/charts/BaseChart.tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/providers/theme-provider'
import type { EChartsOption } from 'echarts'
import { cn } from '@/lib/utils'

interface BaseChartProps {
  option: EChartsOption
  width?: number
  height?: number
  className?: string
  enableInteraction?: boolean
  ssrSvg?: string // 서버에서 렌더링된 SVG
}

export function BaseChart({
  option,
  width = 400,
  height = 300,
  className,
  enableInteraction = true,
  ssrSvg
}: BaseChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    if (!chartRef.current || !enableInteraction) return

    // 동적 import로 클라이언트에서만 ECharts 로드
    import('echarts').then((echarts) => {
      if (!chartRef.current) return

      const chart = echarts.init(chartRef.current, theme, {
        renderer: 'canvas', // 클라이언트에서는 Canvas 사용
        width,
        height
      })

      chart.setOption({
        ...option,
        animation: true, // 클라이언트에서는 애니메이션 활성화
        animationDuration: 1000,
        animationEasing: 'cubicOut'
      })

      // 반응형 처리
      const handleResize = () => chart.resize()
      window.addEventListener('resize', handleResize)

      setIsHydrated(true)

      return () => {
        window.removeEventListener('resize', handleResize)
        chart.dispose()
      }
    })
  }, [option, theme, width, height, enableInteraction])

  return (
    <div className={cn("relative", className)}>
      {/* SSR SVG (초기 렌더링) */}
      {ssrSvg && !isHydrated && (
        <div 
          dangerouslySetInnerHTML={{ __html: ssrSvg }}
          style={{ width, height }}
        />
      )}
      
      {/* 클라이언트 차트 (하이드레이션 후) */}
      <div
        ref={chartRef}
        style={{ width, height }}
        className={isHydrated ? 'block' : 'hidden'}
      />
      
      {/* 로딩 오버레이 */}
      {!isHydrated && !ssrSvg && (
        <div 
          className="flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg"
          style={{ width, height }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}
    </div>
  )
}
```

#### 4.3 서버 컴포넌트용 차트 래퍼
```tsx
// components/charts/PoolUsageChart.tsx
import { renderChartToSVG } from '@/lib/echarts-ssr'
import { BaseChart } from './BaseChart'
import type { PoolUsageData } from '@/types/cluster'

interface PoolUsageChartProps {
  data: PoolUsageData[]
  width?: number
  height?: number
}

export async function PoolUsageChart({ 
  data, 
  width = 400, 
  height = 300 
}: PoolUsageChartProps) {
  const option = {
    title: { text: 'Pool 사용량', left: 'center' },
    tooltip: { 
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: { 
      data: data.map(pool => pool.name),
      bottom: 0
    },
    xAxis: {
      type: 'time',
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value} GB' }
    },
    series: data.map(pool => ({
      name: pool.name,
      type: 'line',
      stack: 'Total',
      areaStyle: {},
      emphasis: { focus: 'series' },
      data: pool.usage.map(point => [point.timestamp, point.value]),
      sampling: 'lttb' // 성능 최적화
    }))
  }

  // 서버에서 SVG 생성
  const svgString = await renderChartToSVG({
    width,
    height,
    option
  })

  return (
    <BaseChart
      option={option}
      width={width}
      height={height}
      ssrSvg={svgString}
      className="pool-usage-chart"
    />
  )
}
```

### 5. Zustand 상태 관리 시스템

#### 5.1 실시간 데이터 스토어
```typescript
// stores/realtimeData.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { ChartMetrics, MetricConfig } from '@/types/metrics'

interface RealtimeStore {
  // 상태
  isActive: boolean
  updateInterval: NodeJS.Timeout | null
  chartMetrics: ChartMetrics
  lastUpdate: Date | null
  
  // 액션
  startRealTimeUpdates: () => void
  stopRealTimeUpdates: () => void
  generateRealtimeData: () => void
  setChartMetrics: (metrics: Partial<ChartMetrics>) => void
  updateSingleMetric: (key: keyof ChartMetrics, data: any[]) => void
}

const metricConfigs: Record<keyof ChartMetrics, MetricConfig> = {
  poolUsage: { min: 0, max: 100, variance: 0.05, trend: 0.01 },
  iops: { min: 1000, max: 50000, variance: 0.15, trend: 0 },
  latency: { min: 0.5, max: 50, variance: 0.2, trend: 0 },
  throughput: { min: 100, max: 10000, variance: 0.1, trend: 0.02 },
  scrubErrors: { min: 0, max: 10, variance: 0.3, trend: -0.01 },
  pgInconsistency: { min: 0, max: 5, variance: 0.4, trend: -0.02 },
  networkErrors: { min: 0, max: 100, variance: 0.2, trend: 0 },
  osdPerformance: { min: 0, max: 100, variance: 0.1, trend: 0.005 }
}

function generateNextValue(prevValue: number, config: MetricConfig): number {
  const { min, max, variance, trend } = config
  const change = prevValue * variance * (Math.random() - 0.5 + trend)
  return Math.max(min, Math.min(max, prevValue + change))
}

function generateInitialData(config: MetricConfig, points: number = 60) {
  const data = []
  let value = (config.max - config.min) / 2 + config.min
  
  for (let i = 0; i < points; i++) {
    data.push({
      timestamp: Date.now() - (points - i) * 5000,
      value: value
    })
    value = generateNextValue(value, config)
  }
  
  return data
}

export const useRealtimeStore = create<RealtimeStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // 초기 상태
      isActive: false,
      updateInterval: null,
      chartMetrics: {
        poolUsage: generateInitialData(metricConfigs.poolUsage),
        iops: generateInitialData(metricConfigs.iops),
        latency: generateInitialData(metricConfigs.latency),
        throughput: generateInitialData(metricConfigs.throughput),
        scrubErrors: generateInitialData(metricConfigs.scrubErrors),
        pgInconsistency: generateInitialData(metricConfigs.pgInconsistency),
        networkErrors: generateInitialData(metricConfigs.networkErrors),
        osdPerformance: generateInitialData(metricConfigs.osdPerformance)
      },
      lastUpdate: null,

      // 실시간 업데이트 시작
      startRealTimeUpdates: () => {
        const { isActive, updateInterval } = get()
        if (isActive || updateInterval) return

        const interval = setInterval(() => {
          get().generateRealtimeData()
        }, 5000)

        set((state) => {
          state.isActive = true
          state.updateInterval = interval
          state.lastUpdate = new Date()
        })
      },

      // 실시간 업데이트 중지
      stopRealTimeUpdates: () => {
        const { updateInterval } = get()
        
        if (updateInterval) {
          clearInterval(updateInterval)
        }

        set((state) => {
          state.isActive = false
          state.updateInterval = null
        })
      },

      // 실시간 데이터 생성
      generateRealtimeData: () => {
        set((state) => {
          const now = Date.now()
          
          Object.keys(state.chartMetrics).forEach((key) => {
            const metricKey = key as keyof ChartMetrics
            const config = metricConfigs[metricKey]
            const currentData = state.chartMetrics[metricKey]
            const lastValue = currentData.length > 0 
              ? currentData[currentData.length - 1].value 
              : config.min
            
            const newValue = generateNextValue(lastValue, config)
            const newDataPoint = {
              timestamp: now,
              value: newValue
            }
            
            // 최근 60개 포인트만 유지
            state.chartMetrics[metricKey] = [...currentData, newDataPoint].slice(-60)
          })
          
          state.lastUpdate = new Date()
        })
      },

      // 차트 메트릭 설정
      setChartMetrics: (metrics) => {
        set((state) => {
          Object.assign(state.chartMetrics, metrics)
        })
      },

      // 단일 메트릭 업데이트
      updateSingleMetric: (key, data) => {
        set((state) => {
          state.chartMetrics[key] = data
        })
      }
    }))
  )
)

// 선택적 구독 훅 (성능 최적화)
export const useChartMetric = (metricKey: keyof ChartMetrics) =>
  useRealtimeStore((state) => state.chartMetrics[metricKey])

export const useLatestValues = () =>
  useRealtimeStore((state) => {
    const latest: Partial<Record<keyof ChartMetrics, number>> = {}
    
    Object.entries(state.chartMetrics).forEach(([key, data]) => {
      const metricKey = key as keyof ChartMetrics
      latest[metricKey] = data.length > 0 ? data[data.length - 1].value : 0
    })
    
    return latest
  })
```

#### 5.2 클러스터 상태 스토어
```typescript
// stores/cluster.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { ClusterStatus, OSDStatus, PoolStatus } from '@/types/cluster'

interface ClusterStore {
  // 상태
  status: ClusterStatus | null
  osds: OSDStatus[]
  pools: PoolStatus[]
  loading: boolean
  error: string | null
  
  // 액션
  setStatus: (status: ClusterStatus) => void
  setOSDs: (osds: OSDStatus[]) => void
  setPools: (pools: PoolStatus[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // 계산된 값
  getHealthyOSDCount: () => number
  getWarningPools: () => PoolStatus[]
  getTotalCapacity: () => { used: number; total: number; percentage: number }
}

export const useClusterStore = create<ClusterStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // 초기 상태
        status: null,
        osds: [],
        pools: [],
        loading: false,
        error: null,

        // 액션들
        setStatus: (status) => {
          set((state) => {
            state.status = status
            state.error = null
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

        // 계산된 값들
        getHealthyOSDCount: () => {
          return get().osds.filter(osd => osd.health === 'healthy').length
        },

        getWarningPools: () => {
          return get().pools.filter(pool => pool.health === 'warning')
        },

        getTotalCapacity: () => {
          const pools = get().pools
          const totalUsed = pools.reduce((sum, pool) => sum + pool.used, 0)
          const totalCapacity = pools.reduce((sum, pool) => sum + pool.total, 0)
          
          return {
            used: totalUsed,
            total: totalCapacity,
            percentage: totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0
          }
        }
      })),
      {
        name: 'cluster-store',
        partialize: (state) => ({ 
          status: state.status,
          osds: state.osds,
          pools: state.pools
        })
      }
    ),
    { name: 'cluster-store' }
  )
)
```

### 6. React Three Fiber 3D 토폴로지

#### 6.1 메인 토폴로지 컴포넌트
```tsx
// components/topology/ClusterTopologyVisualization.tsx
'use client'
import { Canvas } from '@react-three/fiber'
import { 
  OrbitControls, 
  Stars, 
  Text,
  Environment,
  Sphere,
  Box
} from '@react-three/drei'
import { Suspense, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useTopologyStore } from '@/stores/topology'
import { SpaceshipPanels } from './SpaceshipPanels'
import { SearchPanel } from './SearchPanel'
import { NodeLayers } from './NodeLayers'

export function ClusterTopologyVisualization() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : 'h-[800px]'} w-full bg-black`}>
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 0, 100], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        {/* 환경 설정 */}
        <Environment preset="night" />
        
        {/* 조명 시스템 */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <pointLight position={[0, -20, 0]} intensity={0.8} distance={150} />
        
        {/* 별 배경 */}
        <Suspense fallback={null}>
          <Stars count={1000} depth={50} radius={100} factor={4} saturation={0} />
        </Suspense>
        
        {/* 클러스터 노드들 */}
        <Suspense fallback={null}>
          <NodeLayers />
        </Suspense>
        
        {/* 컨트롤 */}
        <OrbitControls 
          enablePan 
          enableZoom 
          enableRotate
          minDistance={50}
          maxDistance={200}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
      
      {/* UI 오버레이 */}
      <SearchPanel />
      <SpaceshipPanels />
      
      {/* 풀스크린 토글 버튼 */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-20 bg-black/70 text-white p-2 rounded-lg
                   hover:bg-black/90 transition-colors"
      >
        {isFullscreen ? '축소' : '전체화면'}
      </button>
    </div>
  )
}
```

#### 6.2 노드 계층 컴포넌트
```tsx
// components/topology/NodeLayers.tsx
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { PoolNodes } from './PoolNodes'
import { PGNodes } from './PGNodes'
import { OSDNodes } from './OSDNodes'
import { HostNodes } from './HostNodes'
import { useTopologyStore } from '@/stores/topology'

export function NodeLayers() {
  const groupRef = useRef<THREE.Group>(null)
  const { searchResults, selectedNode } = useTopologyStore()
  
  // 자동 회전
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002
    }
  })

  return (
    <group ref={groupRef}>
      {/* Pool 노드 레이어 (Y=30) */}
      <group position={[0, 30, 0]}>
        <PoolNodes />
      </group>
      
      {/* PG 노드 레이어 (Y=-20) */}
      <group position={[0, -20, 0]}>
        <PGNodes />
      </group>
      
      {/* OSD 노드 레이어 (Y=-60) */}
      <group position={[0, -60, 0]}>
        <OSDNodes />
      </group>
      
      {/* Host 노드 레이어 (Y=-60, 플랫폼) */}
      <group position={[0, -60, 0]}>
        <HostNodes />
      </group>
      
      {/* 레이어 라벨 */}
      <Text
        position={[-40, 30, 0]}
        fontSize={3}
        color="#00d4ff"
        anchorX="center"
        anchorY="middle"
      >
        POOLS
      </Text>
      
      <Text
        position={[-40, -20, 0]}
        fontSize={3}
        color="#00ff88"
        anchorX="center"
        anchorY="middle"
      >
        PGs
      </Text>
      
      <Text
        position={[-40, -60, 0]}
        fontSize={3}
        color="#ff6b00"
        anchorX="center"
        anchorY="middle"
      >
        OSDs
      </Text>
    </group>
  )
}
```

#### 6.3 Pool 노드 컴포넌트 (지구 텍스처)
```tsx
// components/topology/PoolNodes.tsx
import { useRef, useEffect, useState } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'
import { Sphere } from '@react-three/drei'
import { useTopologyStore } from '@/stores/topology'
import { HealthRing } from './HealthRing'
import * as THREE from 'three'

export function PoolNodes() {
  const { pools, selectedNode, searchResults } = useTopologyStore()
  
  // 지구 텍스처 로드
  const [albedoMap, bumpMap, lightsMap] = useLoader(TextureLoader, [
    '/textures/earth-albedo.jpg',
    '/textures/earth-bump.jpg',
    '/textures/earth-lights.jpg'
  ])

  return (
    <group>
      {pools.map((pool, index) => (
        <PoolNode
          key={pool.id}
          pool={pool}
          position={[
            (index % 4) * 25 - 37.5,
            0,
            Math.floor(index / 4) * 25 - 37.5
          ]}
          albedoMap={albedoMap}
          bumpMap={bumpMap}
          lightsMap={lightsMap}
        />
      ))}
    </group>
  )
}

function PoolNode({ pool, position, albedoMap, bumpMap, lightsMap }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { selectNode, selectedNode, searchResults } = useTopologyStore()
  const [hovered, setHovered] = useState(false)
  
  const isSelected = selectedNode?.id === pool.id
  const isSearchResult = searchResults.some(result => result.id === pool.id)

  // 자동 회전
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01
    }
  })

  // 검색 결과 펄스 애니메이션
  useFrame((state) => {
    if (meshRef.current && isSearchResult) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1
      meshRef.current.scale.setScalar(scale)
    }
  })

  const handleClick = () => {
    selectNode({ ...pool, type: 'pool' })
  }

  return (
    <group position={position}>
      {/* Pool 노드 (지구) */}
      <Sphere
        ref={meshRef}
        args={[5, 32, 32]}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          map={albedoMap}
          bumpMap={bumpMap}
          emissiveMap={lightsMap}
          emissive={new THREE.Color(0x444444)}
          metalness={0.1}
          roughness={0.8}
        />
      </Sphere>
      
      {/* 대기권 효과 */}
      <Sphere args={[5.2, 32, 32]}>
        <meshBasicMaterial
          color={0x88ccff}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* 건강 상태 링 */}
      {pool.health !== 'healthy' && (
        <HealthRing 
          health={pool.health}
          radius={6}
        />
      )}
      
      {/* Pool 이름 라벨 */}
      <Text
        position={[0, -7, 0]}
        fontSize={1.5}
        color={hovered || isSelected ? "#00d4ff" : "#ffffff"}
        anchorX="center"
        anchorY="middle"
        castShadow
      >
        {pool.name}
      </Text>
    </group>
  )
}
```

### 7. WebSocket 실시간 통신 Provider

#### 7.1 WebSocket Provider
```tsx
// providers/websocket-provider.tsx
'use client'
import { createContext, useContext, useEffect, useRef, ReactNode } from 'react'
import { Client } from '@stomp/stompjs'
import { useRealtimeStore } from '@/stores/realtimeData'
import { useClusterStore } from '@/stores/cluster'
import { useAnomalyStore } from '@/stores/anomaly'

interface WebSocketContextType {
  client: Client | null
  isConnected: boolean
  connect: () => void
  disconnect: () => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const clientRef = useRef<Client | null>(null)
  const isConnectedRef = useRef(false)
  
  const { setChartMetrics } = useRealtimeStore()
  const { setStatus, setOSDs, setPools } = useClusterStore()
  const { setAnomalyScore, addAnomalyAlert } = useAnomalyStore()

  const connect = () => {
    if (clientRef.current?.active) return

    const client = new Client({
      brokerURL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws',
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: (frame) => {
        console.log('WebSocket connected:', frame)
        isConnectedRef.current = true
        
        // 메트릭 구독
        client.subscribe('/topic/metrics', (message) => {
          try {
            const data = JSON.parse(message.body)
            setChartMetrics(data)
          } catch (error) {
            console.error('Failed to parse metrics:', error)
          }
        })
        
        // 클러스터 상태 구독
        client.subscribe('/topic/cluster-status', (message) => {
          try {
            const data = JSON.parse(message.body)
            setStatus(data.status)
            setOSDs(data.osds)
            setPools(data.pools)
          } catch (error) {
            console.error('Failed to parse cluster status:', error)
          }
        })
        
        // 이상감지 구독
        client.subscribe('/topic/anomaly', (message) => {
          try {
            const data = JSON.parse(message.body)
            if (data.type === 'score') {
              setAnomalyScore(data.score)
            } else if (data.type === 'alert') {
              addAnomalyAlert(data.alert)
            }
          } catch (error) {
            console.error('Failed to parse anomaly data:', error)
          }
        })
        
        // 예측 업데이트 구독
        client.subscribe('/topic/predictions', (message) => {
          try {
            const data = JSON.parse(message.body)
            // 예측 데이터 처리
          } catch (error) {
            console.error('Failed to parse prediction data:', error)
          }
        })
      },
      
      onStompError: (frame) => {
        console.error('STOMP error:', frame)
        isConnectedRef.current = false
      },
      
      onDisconnect: () => {
        console.log('WebSocket disconnected')
        isConnectedRef.current = false
      }
    })
    
    clientRef.current = client
    client.activate()
  }

  const disconnect = () => {
    if (clientRef.current?.active) {
      clientRef.current.deactivate()
      isConnectedRef.current = false
    }
  }

  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [])

  const contextValue: WebSocketContextType = {
    client: clientRef.current,
    isConnected: isConnectedRef.current,
    connect,
    disconnect
  }

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}
```

### 8. 파일 구조 (Next.js 15 기준)

```
anomaly-predictor-next/
├── app/
│   ├── layout.tsx              # 루트 레이아웃
│   ├── page.tsx                # 대시보드 메인
│   ├── globals.css             # Tailwind + 커스텀 스타일
│   ├── favicon.ico             # 파비콘
│   ├── dashboard/page.tsx      # 대시보드 페이지
│   ├── prediction/page.tsx     # 장애 예측 페이지
│   ├── topology/page.tsx       # 3D 토폴로지 페이지
│   ├── anomaly/page.tsx        # ML 이상감지 페이지
│   ├── alerts/page.tsx         # 알림 센터 페이지
│   ├── health/page.tsx         # 헬스 체크 페이지
│   ├── monitoring/page.tsx     # 모니터링 페이지
│   ├── performance/page.tsx    # 성능 분석 페이지
│   ├── network/page.tsx        # 네트워크 페이지
│   └── storage/page.tsx        # 스토리지 페이지
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx
│   │   ├── MegaMenu.tsx
│   │   └── index.ts
│   ├── topology/
│   │   ├── ClusterTopologyView.tsx
│   │   ├── ClusterTopologyViewOri.tsx.bak.bak
│   │   ├── ClusterTopologyViewStyles.tsx
│   │   └── index.ts
│   ├── dashboard/
│   │   ├── chart/
│   │   │   ├── BaseChart.tsx
│   │   │   ├── PoolUsageChart.tsx
│   │   │   ├── IopsChart.tsx
│   │   │   ├── LatencyChart.tsx
│   │   │   ├── ScrubErrorChart.tsx
│   │   │   ├── PgInconsistencyChart.tsx
│   │   │   ├── NetworkErrorChart.tsx
│   │   │   ├── OsdPerformanceChart.tsx
│   │   │   ├── ThroughputChart.tsx
│   │   │   └── index.ts
│   │   ├── AlertCenter.tsx
│   │   ├── CapacityStatus.tsx
│   │   ├── CephClusterVisualization.tsx
│   │   ├── ClusterStatus.tsx
│   │   ├── RiskPanel.tsx
│   │   └── index.ts
│   ├── particles/
│   │   ├── SimpleBrainParticles.tsx
│   │   └── index.ts
│   └── common/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── ConfirmDialog.tsx
│       ├── DataTable.tsx
│       ├── ErrorMessage.tsx
│       ├── LoadingSpinner.tsx
│       └── index.ts
├── stores/
│   └── index.ts                # Zustand 스토어들
├── hooks/
│   └── index.ts                # 커스텀 훅들
├── lib/
│   ├── echarts-ssr.ts          # ECharts SSR 유틸
│   ├── echarts-types.ts        # ECharts 타입 정의
│   ├── metadata.ts             # 메타데이터 유틸
│   ├── three-utils.ts          # Three.js 유틸리티
│   └── utils.ts                # 공통 유틸리티
├── types/
│   ├── index.ts                # 타입 정의들
│   └── troika-three-text.d.ts  # troika-three-text 모듈 선언
├── utils/
│   ├── chartAnimations.ts      # 차트 애니메이션
│   ├── color.ts                # 컬러 유틸리티
│   ├── layouts.ts              # 레이아웃 매니저
│   └── utils.ts                # 기타 유틸리티
├── public/
│   ├── 3d/
│   │   ├── data/               # 3D 데이터 파일
│   │   └── textures/           # 3D 텍스처 파일
│   │       ├── cube/           # 큐브 텍스처
│   │       ├── earth/          # 지구 텍스처
│   │       ├── planet/         # 행성 텍스처
│   │       └── wood/           # 나무 텍스처
│   ├── videos/                 # 배경 비디오들
│   │   ├── digital_greenhole.mp4
│   │   ├── digital_particle.mp4
│   │   ├── digital_purplehole.mp4
│   │   ├── digital_ribbon.mp4
│   │   ├── digital_rocket.mp4
│   │   └── digital_thunder.mp4
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── rules/                      # 프로젝트 문서들
│   ├── Migration.md
│   ├── PRD.md
│   ├── frontend.md
│   └── store.md
├── next.config.ts              # Next.js 설정
├── tsconfig.json               # TypeScript 설정
├── tsconfig.tsbuildinfo        # TypeScript 빌드 정보
├── tailwind.config.js          # Tailwind CSS 설정
├── postcss.config.mjs          # PostCSS 설정
├── package.json                # 패키지 의존성
├── pnpm-lock.yaml              # pnpm 락 파일
├── next-env.d.ts               # Next.js 타입 정의
└── README.md                   # 프로젝트 README
```

## 개발 규칙 (Development Rules)

### 1. Next.js 15 최적화 규칙

#### 1.1 서버/클라이언트 컴포넌트 구분
```tsx
// 서버 컴포넌트 (기본)
export default async function DashboardPage() {
  const data = await fetch('/api/data')
  return <ServerComponent data={data} />
}

// 클라이언트 컴포넌트
'use client'
export function InteractiveChart() {
  const [state, setState] = useState()
  return <canvas />
}
```

#### 1.2 Suspense와 스트리밍 활용
```tsx
// 로딩 경계 설정
export default function Layout({ children }) {
  return (
    <div>
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>
      <Suspense fallback={<ContentSkeleton />}>
        {children}
      </Suspense>
    </div>
  )
}
```

### 2. 성능 최적화 규칙

#### 2.1 동적 import 활용
```tsx
// Heavy 컴포넌트 동적 로딩
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false
})
```

#### 2.2 Zustand 선택적 구독
```tsx
// 특정 데이터만 구독 (리렌더링 최소화)
const poolData = useRealtimeStore(state => state.chartMetrics.poolUsage)
const isActive = useRealtimeStore(state => state.isActive)
```

### 3. 타입 안전성 규칙

#### 3.1 엄격한 TypeScript 설정
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

#### 3.2 타입 정의 예시
```typescript
// types/cluster.ts
export interface ClusterStatus {
  health: 'HEALTH_OK' | 'HEALTH_WARN' | 'HEALTH_ERR'
  osds: {
    up: number
    in: number
    down: number
    out: number
  }
  monitors: Monitor[]
  version: string
  lastUpdated: string
}
```

## 마이그레이션 체크리스트

### Phase 1: 기본 환경 (완료)
- [x] Next.js 15 + React 19 프로젝트 생성
- [x] Tailwind CSS v4 설정 (prefix 제거)
- [x] TypeScript 엄격 모드 설정
- [x] 기본 레이아웃 및 App Router 구조

### Phase 2: 핵심 컴포넌트 (진행 중)
- [ ] 공통 컴포넌트 마이그레이션 (Card, Button 등)
- [ ] ECharts SSR 최적화 시스템 구축
- [ ] 8개 차트 컴포넌트 React 변환
- [ ] 대시보드 상태 컴포넌트 변환

### Phase 3: 3D 토폴로지 (예정)
- [ ] React Three Fiber 기반 3D 시각화 구현
- [ ] 4141라인 Vue 컴포넌트 → React 변환
- [ ] 우주선 대시보드 UI 4개 패널
- [ ] 인터랙션 시스템 (검색, 선택, 애니메이션)

### Phase 4: 상태 관리 (예정)
- [ ] Pinia → Zustand 완전 변환
- [ ] WebSocket 실시간 통신 시스템
- [ ] 데이터 플로우 최적화

### Phase 5: AI/ML 기능 (예정)
- [ ] 장애 예측 12개 카테고리 UI
- [ ] ML 이상감지 대시보드
- [ ] RAG 조치 가이드 인터페이스

## 성공 기준

### 기능적 완성도
- [ ] Vue 원본 대비 100% 기능 동등성
- [ ] 3D 토폴로지 완전 재구현
- [ ] 실시간 데이터 업데이트 유지
- [ ] WebSocket 연결 안정성

### 성능 개선
- [ ] 초기 로딩 시간 50% 단축
- [ ] Core Web Vitals 전 항목 Good
- [ ] 번들 크기 최적화
- [ ] SEO 점수 90+ 달성

### 개발 경험
- [ ] TypeScript 100% 지원
- [ ] Next.js 15 최신 기능 활용
- [ ] 테스트 커버리지 80%+
- [ ] 문서화 완성도

이 문서는 Vue 3에서 완성된 기능들을 Next.js 15에서 더욱 최적화하여 구현하기 위한 완전한 가이드입니다.