# Vue 3 → Next.js 마이그레이션 계획

## 프로젝트 개요
- **현재 프로젝트**: anomaly-predictor-view (Vue 3 + Vite + TypeScript + Tailwind CSS)
- **타겟 프로젝트**: anomaly-predictor-next (Next.js 15 + React 19 + TypeScript + Tailwind CSS v4)
- **마이그레이션 범위**: Ceph 클러스터 AI 기반 이상 탐지 대시보드 전체

## 마이그레이션 가능성 평가: ✅ **가능**

### 긍정적 요소
1. **기본 구조 호환성**: TypeScript, Tailwind CSS 동일 사용
2. **의존성 매핑 가능**: Migration-to-Next.md에 따른 완벽한 패키지 매핑 가능
3. **컴포넌트 구조**: 잘 모듈화된 컴포넌트 구조로 개별 마이그레이션 가능
4. **데이터 페칭**: axios → fetch API 전환 용이
5. **상태 관리**: Pinia → Zustand 마이그레이션 가능

### 주의사항
1. **tsparticles 컴포넌트 제외**: BrainParticles 관련 3개 컴포넌트는 마이그레이션하지 않음
2. **Three.js 통합**: React Three Fiber로의 전환 필요
3. **실시간 애니메이션 로직**: Vue의 반응성 → React hooks로 변경 필요
4. **Tailwind CSS prefix 제거**: 현재 'ceph-' prefix 사용 → Next.js에서는 prefix 없이 사용

## Tailwind CSS 클래스 마이그레이션

### 현재 상태
- Vue 프로젝트: 모든 Tailwind 클래스에 'ceph-' prefix 사용
- 예: `ceph-flex`, `ceph-items-center`, `ceph-text-white` 등

### 마이그레이션 방향
- Next.js 프로젝트: prefix 없이 표준 Tailwind 클래스 사용
- 예: `flex`, `items-center`, `text-white` 등

### 전환 방법 (상세 가이드)

#### 자동 변환 스크립트
```bash
#!/bin/bash
# Tailwind prefix 제거 자동화 스크립트
# 사용법: ./remove_tailwind_prefix.sh [디렉토리]

TARGET_DIR=${1:-"components"}

# 1. className에서 ceph- prefix 제거
find $TARGET_DIR -name "*.tsx" -type f -exec sed -i '' 's/className="ceph-\([^"]*\)"/className="\1"/g' {} \;
find $TARGET_DIR -name "*.tsx" -type f -exec sed -i '' "s/className='ceph-\([^']*\)'/className='\1'/g" {} \;

# 2. 템플릿 리터럴에서 ceph- prefix 제거  
find $TARGET_DIR -name "*.tsx" -type f -exec sed -i '' 's/ceph-\([a-zA-Z0-9\-]*\)/\1/g' {} \;

# 3. @apply 구문에서 ceph- prefix 제거
find $TARGET_DIR -name "*.css" -type f -exec sed -i '' 's/@apply ceph-\([^;]*\);/@apply \1;/g' {} \;

echo "Tailwind prefix removal completed for $TARGET_DIR"
```

#### 수동 변환 패턴
```typescript
// Before (Vue with ceph- prefix)
className="ceph-flex ceph-items-center ceph-justify-between ceph-p-6"

// After (React without prefix)  
className="flex items-center justify-between p-6"

// Before (Computed classes with prefix)
const cardClasses = computed(() => {
  return [
    'ceph-bg-gradient-to-br ceph-from-ai-neural/80',
    'ceph-backdrop-blur-sm ceph-border ceph-border-ai-circuit/30'
  ]
})

// After (React without prefix)
const cardClasses = useMemo(() => {
  return [
    'bg-gradient-to-br from-ai-neural/80',
    'backdrop-blur-sm border border-ai-circuit/30'
  ].join(' ')
}, [])
```

#### 복합 클래스명 처리
```typescript
// Before (Vue template with complex classes)
:class="[
  'ceph-p-6',
  footerClasses,
  footerPadding !== 'none'
    ? 'ceph-border-t ceph-border-gray-200 dark:ceph-border-gray-700'
    : 'ceph-bg-transparent',
]"

// After (React with clsx/cn utility)
className={cn(
  'p-6',
  footerClasses,
  footerPadding !== 'none'
    ? 'border-t border-gray-200 dark:border-gray-700'
    : 'bg-transparent'
)}
```

#### CSS 파일에서 prefix 제거
```css
/* Before (Vue CSS with prefix) */
@layer base {
  body {
    @apply ceph-transition-colors ceph-duration-300;
    @apply ceph-antialiased ceph-min-h-screen ceph-overflow-x-hidden;
  }
}

/* After (Next.js CSS without prefix) */
@layer base {
  body {
    @apply transition-colors duration-300;
    @apply antialiased min-h-screen overflow-x-hidden;
  }
}
```

#### 정규식 패턴 (IDE 검색/치환용)
```regex
# className 속성에서 prefix 제거
찾기: className="ceph-([^"]*)"
바꾸기: className="$1"

# 템플릿 리터럴에서 prefix 제거
찾기: `([^`]*?)ceph-([a-zA-Z0-9\-]+)([^`]*?)`
바꾸기: `$1$2$3`

# CSS @apply에서 prefix 제거
찾기: @apply ceph-([^;]+);
바꾸기: @apply $1;
```

### 커스텀 클래스 처리
- `neural-pulse`, `matrix-rain` 같은 커스텀 애니메이션 클래스는 그대로 유지
- globals.css에서 커스텀 클래스 정의 그대로 이관

## 실전 컴포넌트 마이그레이션 예제

### Card 컴포넌트 완전 변환 예제

#### Before (Vue 3 + Composition API)
```vue
<template>
  <div class="ai-card neon-hover ceph-flex ceph-flex-col ceph-justify-between" :class="cardClasses">
    <div>
      <div v-if="$slots.header || title" class="ceph-p-6 ceph-border-b border-default" :class="headerClasses">
        <slot name="header">
          <h3 v-if="title" class="ceph-text-lg ceph-font-semibold text-primary">
            {{ title }}
          </h3>
        </slot>
      </div>
      <div class="ceph-p-6" :class="bodyClasses">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  variant?: 'default' | 'ai' | 'neural' | 'cyber'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md'
})

const cardClasses = computed(() => {
  const classes = []
  
  if (props.variant === 'ai') {
    classes.push('ceph-bg-gradient-to-br ceph-from-ai-neural/80')
  }
  
  return classes
})
</script>
```

#### After (React + TypeScript)
```tsx
import { ReactNode, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  title?: string
  variant?: 'default' | 'ai' | 'neural' | 'cyber'
  size?: 'sm' | 'md' | 'lg'
  children?: ReactNode
  header?: ReactNode
}

export function Card({
  title,
  variant = 'default',
  size = 'md',
  children,
  header,
  ...props
}: CardProps) {
  const cardClasses = useMemo(() => {
    const classes = ['ai-card neon-hover flex flex-col justify-between']
    
    if (variant === 'ai') {
      classes.push('bg-gradient-to-br from-ai-neural/80')
    }
    
    return classes.join(' ')
  }, [variant])

  return (
    <div className={cn(cardClasses)} {...props}>
      <div>
        {(header || title) && (
          <div className="p-6 border-b border-default">
            {header || (
              title && (
                <h3 className="text-lg font-semibold text-primary">
                  {title}
                </h3>
              )
            )}
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
```

### 주요 변환 패턴

#### 1. Vue Composition API → React Hooks
```typescript
// Vue: computed
const cardClasses = computed(() => {
  return calculateClasses()
})

// React: useMemo
const cardClasses = useMemo(() => {
  return calculateClasses()
}, [dependencies])

// Vue: reactive/ref
const data = ref([])
const isLoading = ref(false)

// React: useState
const [data, setData] = useState([])
const [isLoading, setIsLoading] = useState(false)

// Vue: watchEffect
watchEffect(() => {
  if (props.variant) {
    updateStyles()
  }
})

// React: useEffect
useEffect(() => {
  if (variant) {
    updateStyles()
  }
}, [variant])
```

#### 2. Template Syntax 변환
```vue
<!-- Vue Template -->
<div v-if="isVisible" :class="dynamicClass" @click="handleClick">
  <slot name="content">기본 내용</slot>
</div>

<!-- React JSX -->
{isVisible && (
  <div className={dynamicClass} onClick={handleClick}>
    {content || '기본 내용'}
  </div>
)}
```

#### 3. Props & Slots → Props & Children
```typescript
// Vue Props & Slots
interface Props {
  title?: string
}
// $slots.header, $slots.default 사용

// React Props & Children
interface ComponentProps {
  title?: string
  header?: ReactNode
  children?: ReactNode
}
```

## 의존성 마이그레이션 맵핑

### 완전 교체 필요
```bash
# Vue 생태계 → React 생태계
vue → react + react-dom
vue-router → Next.js App Router
pinia → zustand
@heroicons/vue → react-icons
vue-echarts → echarts (SSR-optimized with tree-shaking)
@headlessui/vue → 네이티브 React 컴포넌트로 재작성
@tanstack/vue-query → 제거 (Next.js 캐싱 사용)
@vueuse/core → 커스텀 React hooks로 재작성
simplebar-vue → simplebar-react
@vitejs/plugin-vue → 제거
```

### 완전 제거
```bash
tsparticles → 제거 (관련 컴포넌트 마이그레이션 안함)
@tsparticles/* → 제거
```

### 그대로 사용
```bash
@fontsource/orbitron → 동일 사용
@stomp/stompjs → 동일 사용  
dayjs → 동일 사용
three → 동일 사용
troika-three-text → 동일 사용
@types/three → 동일 사용
```

### 업그레이드
```bash
gsap → gsap + @gsap/react
three → three + @react-three/fiber + @react-three/drei
axios → Next.js fetch API
```

## 라우팅 구조 마이그레이션

### 현재 Vue Router 구조
```
/ → DashboardView.vue (main)
/monitoring → MonitoringView.vue (sub) 
/anomaly → AnomalyView.vue (sub)
/performance → PerformanceView.vue (sub)
/health → HealthView.vue (sub)
/storage → StorageView.vue (sub)
/network → NetworkView.vue (sub)
/prediction → PredictionView.vue (sub)
/alerts → AlertsView.vue (sub)
/topology → ClusterTopology.vue (sub)
```

### Next.js App Router 구조
```
app/
├── layout.tsx (루트 레이아웃)
├── page.tsx (대시보드 메인)
├── monitoring/page.tsx 
├── anomaly/page.tsx
├── performance/page.tsx
├── health/page.tsx
├── storage/page.tsx
├── network/page.tsx
├── prediction/page.tsx
├── alerts/page.tsx
└── topology/page.tsx
```

## 컴포넌트 마이그레이션 전략

### 단계 1: 기본 컴포넌트 (우선순위: 높음)
```
src/components/common/
├── Card.vue → components/common/Card.tsx
├── Button.vue → components/common/Button.tsx
├── LoadingSpinner.vue → components/common/LoadingSpinner.tsx
├── ErrorMessage.vue → components/common/ErrorMessage.tsx
├── ConfirmDialog.vue → components/common/ConfirmDialog.tsx
└── DataTable.vue → components/common/DataTable.tsx
```

### 단계 2: 차트 컴포넌트 (우선순위: 높음)
```
src/components/dashboard/charts/
├── PoolUsageChart.vue → components/dashboard/charts/PoolUsageChart.tsx
├── IopsChart.vue → components/dashboard/charts/IopsChart.tsx
├── LatencyChart.vue → components/dashboard/charts/LatencyChart.tsx
├── ThroughputChart.vue → components/dashboard/charts/ThroughputChart.tsx
├── OsdPerformanceChart.vue → components/dashboard/charts/OsdPerformanceChart.tsx
├── NetworkErrorChart.vue → components/dashboard/charts/NetworkErrorChart.tsx
├── ScrubErrorChart.vue → components/dashboard/charts/ScrubErrorChart.tsx
└── PgInconsistencyChart.vue → components/dashboard/charts/PgInconsistencyChart.tsx
```

**ECharts SSR 최적화 마이그레이션 전략:**

#### 아키텍처: SSR-First 3단계 렌더링
1. **서버에서 SVG 생성**: `echarts.init(null, null, { renderer: 'svg', ssr: true })` → `renderToSVGString()`
2. **서버 컴포넌트에서 SVG 인라인**: FCP 최적화, Tailwind 레이아웃 제어
3. **클라이언트 하이드레이션**: 경량 런타임(4KB) 또는 풀 ECharts(완전 상호작용)

#### 핵심 최적화 설정
- **Tree-shaking**: `echarts/core`, `echarts/charts`, `echarts/components`, `echarts/renderers` 개별 임포트
- **성능 튜닝**:
  - `sampling: 'lttb'` 또는 `'min-max'` (v5.5+): 픽셀 대비 과다 포인트 다운샘플링
  - `progressive`, `progressiveThreshold`: 프레임 분할 렌더링
  - `animationThreshold`: 대량 데이터 시 애니메이션 자동 제한
  - 1k+ 요소면 Canvas 렌더러, 그 외 SVG 권장
- **캐싱**: Next.js App Router `revalidate` + `tags`로 온디맨드 무효화

#### 필수 구현 파일
- `lib/echarts-ssr.ts`: 서버 SVG 렌더링 유틸리티 (server-only)
- `lib/echarts-types.ts`: Tree-shaking 친화적 타입 및 컴포넌트 등록
- `components/common/BaseChart.tsx`: 공통 차트 래퍼 (SSR SVG + 클라이언트 하이드레이션)

#### 렌더러 선택 원칙
- **SSR**: SVG 필수 (작고 선명, 초기 애니메이션 지원)
- **클라이언트**: Canvas (대량 데이터, 1k+ 요소) / SVG (저용량, 벡터 가치)
- **Node.js 런타임 강제**: SSR 컴포넌트는 `export const runtime = 'nodejs'`

### 단계 3: 대시보드 컴포넌트 (우선순위: 중간)
```
src/components/dashboard/
├── CapacityStatus.vue → components/dashboard/CapacityStatus.tsx
├── ClusterStatus.vue → components/dashboard/ClusterStatus.tsx
├── RiskPanel.vue → components/dashboard/RiskPanel.tsx
└── AlertCenter.vue → components/dashboard/AlertCenter.tsx
```

### 단계 4: 3D 시각화 컴포넌트 (우선순위: 중간)
```
src/components/topology/
└── ClusterTopologyVisualization.vue → components/topology/ClusterTopologyVisualization.tsx
```

**3D 컴포넌트 마이그레이션 주의사항:**
- React Three Fiber + @react-three/drei 사용
- useFrame, useThree 등 React Three Fiber hooks 활용
- GSAP 애니메이션 → @gsap/react 사용

### 단계 5: 레이아웃 컴포넌트 (우선순위: 중간)
```
src/components/layout/
├── AppHeader.vue → components/layout/AppHeader.tsx
└── MegaMenu.vue → components/layout/MegaMenu.tsx
```

### 제외할 컴포넌트 (마이그레이션 안함)
```
src/components/particles/ (tsparticles 사용 컴포넌트만 제외)
├── BrainParticles.vue (tsparticles 사용)
├── BrainParticlesOri.vue (tsparticles 사용)
└── SimpleBrainParticles.vue (tsparticles 사용)
```

### 중요 3D 컴포넌트 (마이그레이션 필수)
```
src/components/particles/
└── CephClusterVisualization.vue → components/particles/CephClusterVisualization.tsx
    - 메인 페이지 중앙의 핵심 3D 시각화 컴포넌트
    - Three.js 기반 (tsparticles 미사용)
    - React Three Fiber + @react-three/drei로 전환
```

## 서비스 레이어 마이그레이션

### API 서비스
```typescript
// 현재: src/services/api.ts (axios 기반)
// 마이그레이션: lib/api.ts (fetch 기반)

// 예시 변환
// Before (Vue + axios)
export async function fetchClusterStatus() {
  const response = await axios.get('/api/cluster/status');
  return response.data;
}

// After (Next.js + fetch)
export async function fetchClusterStatus() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/cluster/status`, {
    cache: 'force-cache',
    next: { revalidate: 30 }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch cluster status');
  }
  
  return response.json();
}
```

### WebSocket 서비스
```typescript
// src/services/websocket.service.ts → lib/websocket.ts
// STOMP.js 기반 WebSocket 서비스는 그대로 유지
// Vue의 reactive → React useState/useEffect로 변경
```

### 상태 관리 (Pinia → Zustand 상세 마이그레이션)

#### 현재 Pinia Store 구조 분석
```typescript
// src/stores/realtimeData.ts (Pinia)
export const useRealtimeDataStore = defineStore('realtimeData', () => {
  // 상태 (ref)
  const isActive = ref(false)
  const updateInterval = ref<NodeJS.Timeout | null>(null)
  const chartMetrics = ref<ChartMetrics>({
    poolUsage: [],
    iops: [],
    latency: []
    // ... 8개 차트 데이터
  })
  
  // 계산된 속성 (computed)
  const latestValues = computed(() => {
    // 최신 값들 반환
  })
  
  // 액션 (functions)
  const startRealTimeUpdates = () => { /* 5초마다 업데이트 */ }
  const stopRealTimeUpdates = () => { /* 정리 */ }
  const generateRealtimeData = () => { /* 데이터 생성 */ }
  
  return {
    // 상태
    isActive, updateInterval, chartMetrics, lastUpdate,
    // 계산된 속성  
    latestValues,
    // 액션
    startRealTimeUpdates, stopRealTimeUpdates, generateRealtimeData
  }
})
```

#### Zustand Store 완전 변환
```typescript
// stores/realtimeData.ts (Zustand)
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface ChartDataPoint {
  timestamp: number
  value: number
  label?: string
}

interface ChartMetrics {
  poolUsage: ChartDataPoint[]
  iops: ChartDataPoint[]
  latency: ChartDataPoint[]
  throughput: ChartDataPoint[]
  scrubErrors: ChartDataPoint[]
  pgInconsistency: ChartDataPoint[]
  networkErrors: ChartDataPoint[]
  osdPerformance: ChartDataPoint[]
}

interface RealtimeStore {
  // 상태
  isActive: boolean
  updateInterval: NodeJS.Timeout | null
  chartMetrics: ChartMetrics
  lastUpdate: Date | null
  
  // 계산된 속성 (별도 함수로 구현)
  getLatestValues: () => Partial<Record<keyof ChartMetrics, number>>
  
  // 액션
  startRealTimeUpdates: () => void
  stopRealTimeUpdates: () => void
  generateRealtimeData: () => void
  setChartMetrics: (metrics: Partial<ChartMetrics>) => void
  setIsActive: (active: boolean) => void
}

export const useRealtimeStore = create<RealtimeStore>()(
  subscribeWithSelector((set, get) => ({
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
    
    // 계산된 속성 함수
    getLatestValues: () => {
      const { chartMetrics } = get()
      const latest: Partial<Record<keyof ChartMetrics, number>> = {}
      
      Object.entries(chartMetrics).forEach(([key, data]) => {
        const chartKey = key as keyof ChartMetrics
        latest[chartKey] = data.length > 0 ? data[data.length - 1].value : 0
      })
      
      return latest
    },
    
    // 액션들
    startRealTimeUpdates: () => {
      const { isActive, updateInterval } = get()
      
      if (isActive || updateInterval) return
      
      const interval = setInterval(() => {
        get().generateRealtimeData()
      }, 5000)
      
      set({ 
        isActive: true, 
        updateInterval: interval,
        lastUpdate: new Date() 
      })
    },
    
    stopRealTimeUpdates: () => {
      const { updateInterval } = get()
      
      if (updateInterval) {
        clearInterval(updateInterval)
      }
      
      set({ 
        isActive: false, 
        updateInterval: null 
      })
    },
    
    generateRealtimeData: () => {
      const { chartMetrics } = get()
      const newMetrics: ChartMetrics = { ...chartMetrics }
      
      // 각 차트별 새로운 데이터 포인트 생성
      Object.keys(chartMetrics).forEach((key) => {
        const chartKey = key as keyof ChartMetrics
        const config = metricConfigs[chartKey]
        const currentData = chartMetrics[chartKey]
        const lastValue = currentData.length > 0 ? currentData[currentData.length - 1].value : config.min
        
        // 새 데이터 포인트 생성
        const newValue = generateNextValue(lastValue, config)
        const newDataPoint: ChartDataPoint = {
          timestamp: Date.now(),
          value: newValue
        }
        
        // 최근 60개 포인트만 유지
        const updatedData = [...currentData, newDataPoint].slice(-60)
        newMetrics[chartKey] = updatedData
      })
      
      set({ 
        chartMetrics: newMetrics,
        lastUpdate: new Date() 
      })
    },
    
    setChartMetrics: (metrics) =>
      set((state) => ({
        chartMetrics: { ...state.chartMetrics, ...metrics }
      })),
    
    setIsActive: (active) => set({ isActive: active })
  }))
)

// 선택적 구독 훅 (성능 최적화)
export const useChartMetric = (metricKey: keyof ChartMetrics) =>
  useRealtimeStore((state) => state.chartMetrics[metricKey])

export const useLatestValues = () =>
  useRealtimeStore((state) => state.getLatestValues())
```

#### 컴포넌트에서 사용법 비교

```typescript
// Before (Vue + Pinia)
<script setup lang="ts">
import { useRealtimeDataStore } from '@/stores/realtimeData'

const realtimeStore = useRealtimeDataStore()
const { startRealTimeUpdates, stopRealTimeUpdates } = realtimeStore
const { isActive, latestValues } = storeToRefs(realtimeStore)

onMounted(() => startRealTimeUpdates())
onUnmounted(() => stopRealTimeUpdates())
</script>

// After (React + Zustand)
import { useRealtimeStore, useLatestValues } from '@/stores/realtimeData'

function DashboardComponent() {
  const { 
    startRealTimeUpdates, 
    stopRealTimeUpdates, 
    isActive 
  } = useRealtimeStore()
  
  const latestValues = useLatestValues()
  
  useEffect(() => {
    startRealTimeUpdates()
    
    return () => {
      stopRealTimeUpdates()
    }
  }, [startRealTimeUpdates, stopRealTimeUpdates])
  
  return (
    <div>
      {isActive ? '실시간 업데이트 중' : '정지됨'}
      <pre>{JSON.stringify(latestValues, null, 2)}</pre>
    </div>
  )
}
```

#### 성능 최적화 패턴

```typescript
// 개별 차트 데이터만 구독 (불필요한 리렌더링 방지)
function PoolUsageChart() {
  const poolUsageData = useChartMetric('poolUsage')
  
  return <LineChart data={poolUsageData} />
}

// 여러 메트릭 동시 구독
function MultiMetricCard() {
  const { poolUsage, iops, latency } = useRealtimeStore(
    (state) => ({
      poolUsage: state.chartMetrics.poolUsage,
      iops: state.chartMetrics.iops,
      latency: state.chartMetrics.latency
    }),
    shallow // 얕은 비교로 성능 최적화
  )
  
  return (
    <div>
      <MetricCard title="Pool Usage" data={poolUsage} />
      <MetricCard title="IOPS" data={iops} />  
      <MetricCard title="Latency" data={latency} />
    </div>
  )
}
```

## ECharts 성능 최적화 체크리스트 (필수 가이드라인)

### 1. 렌더러 선택 전략
- **SSR(서버)**: SVG 필수 - 작고 선명하며 초기 애니메이션 지원
- **클라이언트**: 1k+ 요소면 Canvas, 그 외 SVG
- **하이브리드**: SSR SVG → 클라이언트 Canvas 전환 (완전 상호작용 필요 시)

### 2. Tree-shaking 최적화
```typescript
// 올바른 방식: 필요한 모듈만 개별 임포트
import * as echarts from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers'

echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, CanvasRenderer, SVGRenderer])
```

### 3. 대용량 데이터 최적화
- **다운샘플링**: `sampling: 'lttb'` 또는 `'min-max'` (v5.5+)
- **프로그레시브 렌더링**: `progressive: 2000, progressiveThreshold: 3000`
- **애니메이션 제어**: `animationThreshold: 2000` (대량 시 자동 제한)
- **대용량 모드**: bar/scatter는 `large: true` 활용

### 4. SSR 캐싱 전략
```typescript
// API 라우트에서 캐싱 설정
export const revalidate = 600 // 10분 TTL
const data = await fetch('/api/data', {
  next: { tags: ['chart:key'], revalidate: 600 }
})
```

### 5. 데이터 줌 최적화
```typescript
dataZoom: [
  { type: 'inside' },    // 마우스 휠 줌
  { type: 'slider' }     // 슬라이더 줌
]
// 실제 뷰포트 데이터 수를 줄여 인터랙션 부하 완화
```

### 6. 메모리 관리
```typescript
useEffect(() => {
  const chart = echarts.init(elementRef.current)
  const handleResize = () => chart.resize()
  
  window.addEventListener('resize', handleResize)
  return () => {
    window.removeEventListener('resize', handleResize)
    chart.dispose() // 필수: 메모리 누수 방지
  }
}, [])
```

### 7. 하이드레이션 최적화
- **경량 런타임** (~4KB): 간단한 인터랙션만 필요한 경우
- **풀 ECharts**: 툴팁, 드릴다운, 드래그 줌 등 완전한 상호작용 필요시

#### 구현 예시: BaseChart 컴포넌트
```typescript
'use client'
import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import type { ECOption } from '@/lib/echarts-types'

interface BaseChartProps {
  option: ECOption
  height?: number
  className?: string
}

export function BaseChart({ option, height = 240, className }: BaseChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!chartRef.current) return
    
    const chart = echarts.init(chartRef.current, undefined, { 
      renderer: 'canvas',
      height 
    })
    
    chart.setOption({
      ...option,
      animationThreshold: 2000,
      progressive: 2000,
      progressiveThreshold: 3000
    })
    
    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [option, height])
  
  return <div ref={chartRef} className={className} style={{ height }} />
}
```

## Next.js 최적화 전략

### 서버 컴포넌트 활용
- **대시보드 페이지**: 서버 컴포넌트로 구성
- **차트 컴포넌트**: ECharts SSR SVG + 클라이언트 하이드레이션 패턴
- **정적 컴포넌트**: 최대한 서버 컴포넌트 활용

### 캐싱 전략
```typescript
// 클러스터 상태 (30초 캐시)
const clusterStatus = await fetch('/api/cluster/status', {
  cache: 'force-cache',
  next: { revalidate: 30 }
});

// 실시간 메트릭 (캐시 비활성화)  
const metrics = await fetch('/api/metrics/realtime', {
  cache: 'no-store'
});
```

### 스트리밍 적용
```typescript
// 대시보드 페이지에서 Suspense 활용
export default async function DashboardPage() {
  return (
    <div>
      <Suspense fallback={<ChartSkeleton />}>
        <ChartsGrid />
      </Suspense>
      
      <Suspense fallback={<StatusSkeleton />}>
        <ClusterStatus />
      </Suspense>
    </div>
  );
}
```

## 마이그레이션 일정

### 1주차: 환경 설정 및 기본 컴포넌트 (상세 계획)

#### Day 1: 프로젝트 환경 설정
- [ ] Next.js 프로젝트 의존성 최종 확인 및 설정
- [ ] Tailwind CSS v4 설정 및 커스텀 색상 팔레트 이관
- [ ] 전역 CSS 파일 마이그레이션 (globals.css)
- [ ] 폰트 설정 확인 (@fontsource/orbitron)

#### Day 2: 기본 레이아웃 및 타입 정의
- [ ] 루트 레이아웃 (layout.tsx) 구조 설정
- [ ] 페이지 타입 및 인터페이스 정의 (types/index.ts)
- [ ] 메타데이터 관리 시스템 구축
- [ ] 기본 디렉토리 구조 생성

#### Day 3: 공통 컴포넌트 - 기본 요소
- [ ] Card.vue → Card.tsx 마이그레이션
  - Props 인터페이스 정의
  - Tailwind 'ceph-' prefix 제거
  - 변형별 스타일 로직 재구현
- [ ] Button.vue → Button.tsx 마이그레이션
- [ ] LoadingSpinner.vue → LoadingSpinner.tsx 마이그레이션

#### Day 4: 공통 컴포넌트 - 고급 요소
- [ ] ErrorMessage.vue → ErrorMessage.tsx 마이그레이션  
- [ ] ConfirmDialog.vue → ConfirmDialog.tsx 마이그레이션
  - @headlessui/vue → 네이티브 React 컴포넌트로 재작성
- [ ] DataTable.vue → DataTable.tsx 마이그레이션

#### Day 5: 레이아웃 컴포넌트 및 통합 테스트
- [ ] AppHeader.vue → AppHeader.tsx 마이그레이션
- [ ] MegaMenu.vue → MegaMenu.tsx 마이그레이션
  - 네비게이션 로직 React Router → Next.js Link로 전환
- [ ] 기본 컴포넌트 통합 테스트 및 스타일 검증
- [ ] 1주차 완료 상태 점검

#### 1주차 성공 기준
- [ ] 모든 공통 컴포넌트가 Next.js에서 정상 렌더링
- [ ] Tailwind 'ceph-' prefix 완전 제거 확인
- [ ] TypeScript 타입 에러 0개
- [ ] 기본 레이아웃 구조 완성
- [ ] 개발 서버 정상 구동 확인

### 2주차: 차트 컴포넌트 마이그레이션  
- [ ] echarts → @nivo 차트 라이브러리 전환
- [ ] 8개 차트 컴포넌트 순차 마이그레이션
- [ ] 실시간 애니메이션 로직 React hooks로 재작성

### 3주차: 페이지 및 라우팅
- [ ] 10개 페이지 컴포넌트 마이그레이션
- [ ] App Router 구조 완성
- [ ] 네비게이션 및 페이지 전환 애니메이션

### 4주차: 3D 및 고급 기능
- [ ] 3D 토폴로지 시각화 (React Three Fiber)
- [ ] WebSocket 실시간 데이터 연동
- [ ] 상태 관리 (Zustand) 완성

### 5주차: 최적화 및 테스트
- [ ] 서버 컴포넌트 최적화
- [ ] 캐싱 및 스트리밍 적용  
- [ ] 성능 테스트 및 최적화
- [ ] 배포 준비

## 위험 요소 및 대응책

### 1. 실시간 애니메이션 복잡도
**위험**: Vue의 반응성 → React hooks 전환시 복잡도 증가
**대응**: 단계별 마이그레이션, 충분한 테스트 시간 확보

### 2. 차트 라이브러리 변경
**위험**: echarts → @nivo 전환시 기능 차이
**대응**: 프로토타입 단계에서 주요 기능 호환성 확인

### 3. 3D 시각화 복잡도  
**위험**: Three.js → React Three Fiber 전환 복잡도
**대응**: 기존 3D 로직 최대한 재사용, 점진적 리팩토링

### 4. 성능 이슈
**위험**: 실시간 데이터 처리 성능 저하 가능성
**대응**: React 18 concurrent features 활용, 메모이제이션 적극 사용

## 성공 기준

### 기능적 요구사항
- [ ] 기존 모든 페이지 정상 작동
- [ ] 실시간 차트 애니메이션 유지
- [ ] 3D 토폴로지 시각화 정상 작동  
- [ ] WebSocket 실시간 데이터 연동 정상

### 성능적 요구사항
- [ ] 초기 로딩 시간 3초 이하
- [ ] 페이지 전환 시간 1초 이하
- [ ] 메모리 사용량 기존 대비 20% 이내
- [ ] Core Web Vitals 모든 항목 Good 등급

### 개발 경험
- [ ] TypeScript 타입 안정성 유지
- [ ] 코드 재사용성 향상
- [ ] 번들 크기 기존 대비 감소
- [ ] 개발 서버 시작 시간 단축

## 결론

현재 Vue 3 프로젝트는 **Next.js로 마이그레이션이 충분히 가능**합니다. 잘 구조화된 컴포넌트와 명확한 의존성 매핑, 그리고 Next.js의 강력한 기능들을 활용하면 성공적인 마이그레이션이 가능할 것으로 판단됩니다.

다만, 실시간 애니메이션과 3D 시각화 부분에서 충분한 검증과 테스트가 필요하며, tsparticles 컴포넌트는 제외하고 진행하는 것이 현실적입니다.