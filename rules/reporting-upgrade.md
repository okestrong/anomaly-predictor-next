Ceph 클러스터 운영 리포트를 10장 이상의 충실한 내용으로 확장하기 위한 방안을 제시하겠습니다.

## 1. Ceph 클러스터 운영 전문가 관점: 10장 이상 리포트 구성 요소

### 📊 Executive Summary (1페이지)
- 클러스터 전체 Health Score
- 핵심 KPI 대시보드
- 주요 이슈 및 Action Items
- AI 기반 위험도 평가

### 🏗️ Section 1: 클러스터 인프라 현황 (2-3페이지)

**물리 인프라 정보**
- 호스트별 하드웨어 스펙 (CPU, RAM, Network)
- 디스크 인벤토리 (Type, Size, Health, SMART 상태)
- 네트워크 토폴로지 (Public/Cluster Network)
- 랙 배치도 및 전력 소비량

**논리 구조 정보**
- CRUSH Map 시각화 및 분석
- Pool 구성 현황 (Replication/EC 설정)
- PG 분포 맵
- Storage Class별 용량 할당

### 📈 Section 2: 성능 메트릭 상세 (2-3페이지)

**IOPS 분석**
- Pool별 Read/Write IOPS 트렌드
- OSD별 IOPS 분포 히트맵
- 시간대별 피크 패턴 분석
- Client별 IOPS 사용량 TOP 10

**Latency 분석**
- Commit/Apply Latency 분포도
- 백분위수별 레이턴시 (P50, P95, P99)
- Slow Request 분석
- Network Latency vs Storage Latency 비교

**Throughput 분석**
- 일별/주별 처리량 트렌드
- Pool별 대역폭 사용률
- Recovery/Backfill 트래픽 영향도

### 🔍 Section 3: 용량 관리 (2페이지)

**현재 사용 현황**
- Pool별 사용량 상세 (Objects, Bytes)
- Thin Provisioning 효율성
- Snapshot 및 Clone 사용량
- Trash 및 임시 데이터 점유율

**용량 예측 모델**
- Linear Regression 기반 성장률
- 계절성 패턴 분석
- Pool별 고갈 예상 시점
- 필요 증설 용량 계산

### 🤖 Section 4: AI 기반 인사이트 (2-3페이지)

**이상 탐지 결과**
- ML 기반 이상 패턴 감지
- 예측된 장애 시나리오
- Risk Score 매트릭스
- 상관관계 분석 결과

**최적화 권장사항**
- PG 수 최적화 제안
- CRUSH Weight 재조정 제안
- 캐시 티어 구성 제안
- 파라미터 튜닝 가이드

### 🛡️ Section 5: 가용성 및 복구 (1-2페이지)

**데이터 보호 현황**
- Replication/EC 정책 준수율
- Scrub/Deep-scrub 완료율
- PG 일관성 검증 결과
- 백업 정책 준수 현황

**장애 복구 준비도**
- MTBF/MTTR 통계
- 예상 복구 시간 (RTO/RPO)
- Disaster Recovery 시뮬레이션 결과

### 📋 Section 6: 운영 이력 (1페이지)

**주요 이벤트 타임라인**
- 설정 변경 이력
- 유지보수 작업 로그
- 장애 발생 및 조치 이력
- 성능 튜닝 이력

### 📑 부록: 상세 데이터 테이블 (2-3페이지)
- OSD 상세 정보 테이블
- Pool 설정 상세
- Client 연결 정보
- 설정 파라미터 일람

---

## 2. Ceph 클러스터 리포팅 모듈 고도화 개발 가이드

다음은 Claude Code가 리포팅 모듈을 구현할 수 있도록 작성한 상세 개발 가이드입니다.

# Ceph 클러스터 리포팅 모듈 - 프론트엔드 고도화 개발 가이드

## 프로젝트 정보
- Framework: Next.js 15 (App Router)
- UI Library: React 19
- Styling: Tailwind CSS v4
- Charts: ECharts (SSR 최적화)
- State Management: Zustand
- PDF Generation: Puppeteer Service

## 1. 리포트 페이지 구조

### 1.1 파일 구조
```
app/
├── reports/
│   ├── [id]/
│   │   ├── page.tsx                 # 리포트 상세 페이지
│   │   ├── loading.tsx              # 로딩 스켈레톤
│   │   └── error.tsx                # 에러 핸들링
│   ├── generate/
│   │   └── page.tsx                 # 리포트 생성 페이지
│   └── layout.tsx                   # 리포트 레이아웃
components/
├── reports/
│   ├── sections/
│   │   ├── ExecutiveSummary.tsx
│   │   ├── InfrastructureStatus.tsx
│   │   ├── PerformanceMetrics.tsx
│   │   ├── CapacityManagement.tsx
│   │   ├── AIInsights.tsx
│   │   ├── AvailabilityRecovery.tsx
│   │   ├── OperationalHistory.tsx
│   │   └── DetailedTables.tsx
│   ├── charts/
│   │   ├── IOPSChart.tsx
│   │   ├── LatencyHeatmap.tsx
│   │   ├── CapacityTrendChart.tsx
│   │   ├── CRUSHMapVisualization.tsx
│   │   └── NetworkTopology.tsx
│   └── ReportContent.tsx
```

### 1.2 메인 리포트 페이지
```tsx
// app/reports/[id]/page.tsx
import { Suspense } from 'react'
import ReportContent from '@/components/reports/ReportContent'
import { fetchReportData } from '@/lib/api/reports'

export default async function ReportPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const reportData = await fetchReportData(params.id)
  
  return (
    <div 
      className="min-h-screen bg-white print:bg-white"
      data-report-ready="false"
      id="report-container"
    >
      <Suspense fallback={<ReportSkeleton />}>
        <ReportContent 
          reportId={params.id} 
          initialData={reportData} 
        />
      </Suspense>
    </div>
  )
}
```

## 2. 리포트 컨텐츠 컴포넌트

### 2.1 메인 컨텐츠 컴포넌트
```tsx
// components/reports/ReportContent.tsx
'use client'

import { useEffect, useState } from 'react'
import { useReportStore } from '@/stores/reportStore'
import ExecutiveSummary from './sections/ExecutiveSummary'
import InfrastructureStatus from './sections/InfrastructureStatus'
import PerformanceMetrics from './sections/PerformanceMetrics'
import CapacityManagement from './sections/CapacityManagement'
import AIInsights from './sections/AIInsights'
import AvailabilityRecovery from './sections/AvailabilityRecovery'
import OperationalHistory from './sections/OperationalHistory'
import DetailedTables from './sections/DetailedTables'

interface ReportContentProps {
  reportId: string
  initialData: any
}

export default function ReportContent({ 
  reportId, 
  initialData 
}: ReportContentProps) {
  const [isReady, setIsReady] = useState(false)
  const { setReportData, reportData } = useReportStore()
  
  useEffect(() => {
    setReportData(initialData)
  }, [initialData])
  
  useEffect(() => {
    // 모든 차트가 렌더링 완료되면 ready 신호
    const checkChartsReady = () => {
      const charts = document.querySelectorAll('[data-chart-ready="true"]')
      const totalCharts = document.querySelectorAll('[data-chart]')
      
      if (charts.length === totalCharts.length && totalCharts.length > 0) {
        document.getElementById('report-container')
          ?.setAttribute('data-report-ready', 'true')
        setIsReady(true)
      }
    }
    
    const interval = setInterval(checkChartsReady, 100)
    const timeout = setTimeout(() => {
      document.getElementById('report-container')
        ?.setAttribute('data-report-ready', 'true')
      clearInterval(interval)
    }, 10000)
    
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])
  
  if (!reportData) return null
  
  return (
    <div className="max-w-[210mm] mx-auto p-8 print:p-0">
      {/* 표지 */}
      <div className="page-break-after">
        <ReportCover 
          title={reportData.title}
          period={reportData.period}
          generatedAt={reportData.generatedAt}
        />
      </div>
      
      {/* 목차 */}
      <div className="page-break-after">
        <TableOfContents />
      </div>
      
      {/* Executive Summary - 1페이지 */}
      <section className="page-break-after">
        <ExecutiveSummary data={reportData.summary} />
      </section>
      
      {/* 클러스터 인프라 현황 - 2-3페이지 */}
      <section className="page-break-after">
        <InfrastructureStatus data={reportData.infrastructure} />
      </section>
      
      {/* 성능 메트릭 상세 - 2-3페이지 */}
      <section className="page-break-after">
        <PerformanceMetrics data={reportData.performance} />
      </section>
      
      {/* 용량 관리 - 2페이지 */}
      <section className="page-break-after">
        <CapacityManagement data={reportData.capacity} />
      </section>
      
      {/* AI 기반 인사이트 - 2-3페이지 */}
      <section className="page-break-after">
        <AIInsights data={reportData.aiInsights} />
      </section>
      
      {/* 가용성 및 복구 - 1-2페이지 */}
      <section className="page-break-after">
        <AvailabilityRecovery data={reportData.availability} />
      </section>
      
      {/* 운영 이력 - 1페이지 */}
      <section className="page-break-after">
        <OperationalHistory data={reportData.history} />
      </section>
      
      {/* 부록: 상세 데이터 테이블 - 2-3페이지 */}
      <section>
        <DetailedTables data={reportData.details} />
      </section>
    </div>
  )
}
```

## 3. 섹션별 컴포넌트 구현

### 3.1 Executive Summary
```tsx
// components/reports/sections/ExecutiveSummary.tsx
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import HealthScoreGauge from '../charts/HealthScoreGauge'
import KPIDashboard from '../charts/KPIDashboard'

export default function ExecutiveSummary({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">
        Executive Summary
      </h1>
      
      {/* 전체 Health Score */}
      <Card className="p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Cluster Health Score
            </h2>
            <HealthScoreGauge score={data.healthScore} />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Risk Assessment
            </h2>
            <RiskMatrix risks={data.risks} />
          </div>
        </div>
      </Card>
      
      {/* KPI 대시보드 */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Key Performance Indicators</h2>
        <KPIDashboard kpis={data.kpis} />
      </Card>
      
      {/* 주요 이슈 및 Action Items */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Critical Issues & Actions</h2>
        <div className="space-y-3">
          {data.criticalIssues.map((issue: any, idx: number) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
              <Badge variant="destructive">{issue.severity}</Badge>
              <div className="flex-1">
                <p className="font-medium">{issue.title}</p>
                <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                <p className="text-sm font-medium text-blue-600 mt-2">
                  Action: {issue.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
```

### 3.2 Infrastructure Status (물리/논리 구조)
```tsx
// components/reports/sections/InfrastructureStatus.tsx
import CRUSHMapVisualization from '../charts/CRUSHMapVisualization'
import NetworkTopology from '../charts/NetworkTopology'
import DiskInventoryTable from '../tables/DiskInventoryTable'

export default function InfrastructureStatus({ data }: { data: any }) {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">
        클러스터 인프라 현황
      </h1>
      
      {/* 물리 인프라 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">물리 인프라</h2>
        
        {/* 호스트 정보 */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">호스트 구성</h3>
          <HostSpecTable hosts={data.hosts} />
        </div>
        
        {/* 디스크 인벤토리 */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">디스크 인벤토리</h3>
          <DiskInventoryTable disks={data.disks} />
        </div>
        
        {/* 네트워크 토폴로지 */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">네트워크 토폴로지</h3>
          <div className="h-[400px]" data-chart="network-topology">
            <NetworkTopology data={data.networkTopology} />
          </div>
        </div>
      </section>
      
      {/* 논리 구조 */}
      <section className="page-break-before">
        <h2 className="text-2xl font-semibold mb-4">논리 구조</h2>
        
        {/* CRUSH Map */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">CRUSH Map 구조</h3>
          <div className="h-[500px]" data-chart="crush-map">
            <CRUSHMapVisualization data={data.crushMap} />
          </div>
        </div>
        
        {/* Pool 구성 */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Pool 구성 현황</h3>
          <PoolConfigTable pools={data.pools} />
        </div>
        
        {/* PG 분포 */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">PG 분포 맵</h3>
          <PGDistributionHeatmap data={data.pgDistribution} />
        </div>
      </section>
    </div>
  )
}
```

### 3.3 Performance Metrics
```tsx
// components/reports/sections/PerformanceMetrics.tsx
import IOPSChart from '../charts/IOPSChart'
import LatencyHeatmap from '../charts/LatencyHeatmap'
import ThroughputChart from '../charts/ThroughputChart'

export default function PerformanceMetrics({ data }: { data: any }) {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">
        성능 메트릭 상세
      </h1>
      
      {/* IOPS 분석 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">IOPS 분석</h2>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div data-chart="iops-trend">
            <h3 className="text-lg font-medium mb-3">Pool별 IOPS 트렌드</h3>
            <IOPSChart data={data.iops.poolTrends} />
          </div>
          <div data-chart="iops-heatmap">
            <h3 className="text-lg font-medium mb-3">OSD별 IOPS 히트맵</h3>
            <IOPSHeatmap data={data.iops.osdHeatmap} />
          </div>
        </div>
        
        {/* 시간대별 피크 패턴 */}
        <div className="mb-6" data-chart="iops-pattern">
          <h3 className="text-lg font-medium mb-3">시간대별 피크 패턴</h3>
          <PeakPatternChart data={data.iops.peakPatterns} />
        </div>
        
        {/* Client별 TOP 10 */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Client별 IOPS TOP 10</h3>
          <ClientIOPSTable clients={data.iops.topClients} />
        </div>
      </section>
      
      {/* Latency 분석 */}
      <section className="page-break-before">
        <h2 className="text-2xl font-semibold mb-4">Latency 분석</h2>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div data-chart="latency-distribution">
            <h3 className="text-lg font-medium mb-3">Latency 분포도</h3>
            <LatencyDistribution data={data.latency.distribution} />
          </div>
          <div data-chart="latency-percentile">
            <h3 className="text-lg font-medium mb-3">백분위수 레이턴시</h3>
            <PercentileChart data={data.latency.percentiles} />
          </div>
        </div>
        
        {/* Slow Request 분석 */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Slow Request 분석</h3>
          <SlowRequestAnalysis data={data.latency.slowRequests} />
        </div>
      </section>
      
      {/* Throughput 분석 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Throughput 분석</h2>
        
        <div data-chart="throughput-trend">
          <h3 className="text-lg font-medium mb-3">일별/주별 처리량 트렌드</h3>
          <ThroughputChart data={data.throughput.trends} />
        </div>
        
        <div className="grid grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Pool별 대역폭 사용률</h3>
            <BandwidthUtilization data={data.throughput.poolBandwidth} />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3">Recovery 트래픽 영향도</h3>
            <RecoveryImpact data={data.throughput.recoveryImpact} />
          </div>
        </div>
      </section>
    </div>
  )
}
```

## 4. 차트 컴포넌트 구현

### 4.1 ECharts 기반 차트 컴포넌트
```tsx
// components/reports/charts/IOPSChart.tsx
'use client'

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

interface IOPSChartProps {
  data: {
    timestamps: string[]
    pools: {
      name: string
      readIOPS: number[]
      writeIOPS: number[]
    }[]
  }
}

export default function IOPSChart({ data }: IOPSChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts>()
  
  useEffect(() => {
    if (!chartRef.current) return
    
    // 차트 초기화
    chartInstance.current = echarts.init(chartRef.current)
    
    // 시리즈 데이터 생성
    const series: any[] = []
    data.pools.forEach(pool => {
      series.push({
        name: `${pool.name} Read`,
        type: 'line',
        data: pool.readIOPS,
        smooth: true,
        lineStyle: { width: 2 }
      })
      series.push({
        name: `${pool.name} Write`,
        type: 'line',
        data: pool.writeIOPS,
        smooth: true,
        lineStyle: { width: 2, type: 'dashed' }
      })
    })
    
    const option = {
      title: { text: 'IOPS Trends by Pool' },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      legend: {
        data: series.map(s => s.name),
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.timestamps,
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        name: 'IOPS',
        axisLabel: {
          formatter: (value: number) => {
            if (value >= 1000000) return `${(value/1000000).toFixed(1)}M`
            if (value >= 1000) return `${(value/1000).toFixed(1)}K`
            return value.toString()
          }
        }
      },
      series
    }
    
    chartInstance.current.setOption(option)
    
    // 렌더링 완료 신호
    chartInstance.current.on('finished', () => {
      chartRef.current?.setAttribute('data-chart-ready', 'true')
    })
    
    // 리사이즈 핸들러
    const handleResize = () => {
      chartInstance.current?.resize()
    }
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      chartInstance.current?.dispose()
    }
  }, [data])
  
  return (
    <div 
      ref={chartRef} 
      className="w-full h-[400px]"
      data-chart-ready="false"
    />
  )
}
```

### 4.2 CRUSH Map 시각화
```tsx
// components/reports/charts/CRUSHMapVisualization.tsx
'use client'

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

export default function CRUSHMapVisualization({ data }: { data: any }) {
  const chartRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!chartRef.current) return
    
    const chart = echarts.init(chartRef.current)
    
    // CRUSH Map을 트리 구조로 변환
    const treeData = convertCRUSHToTree(data)
    
    const option = {
      title: { text: 'CRUSH Map Hierarchy' },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `
            <strong>${params.data.name}</strong><br/>
            Type: ${params.data.type}<br/>
            Weight: ${params.data.weight}<br/>
            ${params.data.deviceClass ? `Class: ${params.data.deviceClass}<br/>` : ''}
            ${params.data.status ? `Status: ${params.data.status}` : ''}
          `
        }
      },
      series: [{
        type: 'tree',
        data: [treeData],
        top: '5%',
        bottom: '5%',
        layout: 'radial',
        symbol: 'circle',
        symbolSize: 12,
        initialTreeDepth: 3,
        animationDurationUpdate: 750,
        emphasis: {
          focus: 'descendant'
        },
        label: {
          position: 'left',
          verticalAlign: 'middle',
          align: 'right',
          fontSize: 10
        },
        leaves: {
          label: {
            position: 'right',
            verticalAlign: 'middle',
            align: 'left'
          }
        },
        expandAndCollapse: true
      }]
    }
    
    chart.setOption(option)
    chartRef.current.setAttribute('data-chart-ready', 'true')
    
    return () => chart.dispose()
  }, [data])
  
  return <div ref={chartRef} className="w-full h-[500px]" />
}

function convertCRUSHToTree(crushData: any) {
  // CRUSH Map 데이터를 ECharts tree 형식으로 변환
  return {
    name: 'root',
    type: 'root',
    weight: crushData.totalWeight,
    children: crushData.buckets.map((bucket: any) => ({
      name: bucket.name,
      type: bucket.type,
      weight: bucket.weight,
      deviceClass: bucket.deviceClass,
      children: bucket.items?.map((item: any) => ({
        name: item.name,
        type: item.type,
        weight: item.weight,
        status: item.status,
        value: item.weight
      }))
    }))
  }
}
```

## 5. AI 인사이트 섹션

### 5.1 AI Insights Component
```tsx
// components/reports/sections/AIInsights.tsx
import AnomalyDetectionResults from '../charts/AnomalyDetectionResults'
import RiskScoreMatrix from '../charts/RiskScoreMatrix'
import OptimizationRecommendations from '../charts/OptimizationRecommendations'

export default function AIInsights({ data }: { data: any }) {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">
        AI 기반 인사이트
      </h1>
      
      {/* 이상 탐지 결과 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">이상 탐지 결과</h2>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-blue-800">
            <strong>분석 모델:</strong> Isolation Forest + XGBoost<br/>
            <strong>분석 기간:</strong> {data.analysisWindow}<br/>
            <strong>신뢰도:</strong> {data.confidence}%
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div data-chart="anomaly-timeline">
            <h3 className="text-lg font-medium mb-3">이상 패턴 타임라인</h3>
            <AnomalyTimeline data={data.anomalies.timeline} />
          </div>
          <div data-chart="anomaly-heatmap">
            <h3 className="text-lg font-medium mb-3">컴포넌트별 이상 스코어</h3>
            <AnomalyHeatmap data={data.anomalies.componentScores} />
          </div>
        </div>
        
        {/* 감지된 이상 패턴 상세 */}
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">감지된 이상 패턴</h3>
          <AnomalyDetailTable anomalies={data.anomalies.detected} />
        </div>
      </section>
      
      {/* 예측된 장애 시나리오 */}
      <section className="page-break-before">
        <h2 className="text-2xl font-semibold mb-4">예측된 장애 시나리오</h2>
        
        <div className="space-y-4">
          {data.predictions.map((prediction: any, idx: number) => (
            <PredictionCard key={idx} prediction={prediction} />
          ))}
        </div>
      </section>
      
      {/* Risk Score Matrix */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Risk Assessment Matrix</h2>
        <div data-chart="risk-matrix">
          <RiskScoreMatrix data={data.riskMatrix} />
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">위험 요소별 상세 분석</h3>
          <RiskFactorAnalysis factors={data.riskFactors} />
        </div>
      </section>
      
      {/* 최적화 권장사항 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">최적화 권장사항</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">PG 최적화</h3>
            <PGOptimizationCard data={data.optimizations.pg} />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3">CRUSH Weight 재조정</h3>
            <CRUSHOptimizationCard data={data.optimizations.crush} />
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">파라미터 튜닝 가이드</h3>
          <ParameterTuningTable parameters={data.optimizations.parameters} />
        </div>
      </section>
    </div>
  )
}
```

## 6. 테이블 컴포넌트

### 6.1 OSD 상세 정보 테이블
```tsx
// components/reports/tables/OSDDetailTable.tsx
export default function OSDDetailTable({ osds }: { osds: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">ID</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Host</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Weight</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Used</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Avail</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Use%</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">PGs</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Device</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Class</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {osds.map((osd) => (
            <tr key={osd.id} className="text-xs">
              <td className="px-3 py-2 whitespace-nowrap">{osd.id}</td>
              <td className="px-3 py-2 whitespace-nowrap">{osd.host}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                <StatusBadge status={osd.status} />
              </td>
              <td className="px-3 py-2 whitespace-nowrap">{osd.weight.toFixed(2)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatBytes(osd.used)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatBytes(osd.avail)}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                <UsageBar percentage={osd.usePercent} />
              </td>
              <td className="px-3 py-2 whitespace-nowrap">{osd.pgCount}</td>
              <td className="px-3 py-2 whitespace-nowrap">{osd.device}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                <Badge variant={osd.class === 'ssd' ? 'success' : 'default'}>
                  {osd.class}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

## 7. API 통합

### 7.1 Report API Client
```typescript
// lib/api/reports.ts
import { apiClient } from './client'

export interface ReportGenerationRequest {
  type: 'daily' | 'weekly' | 'monthly' | 'custom'
  startDate: string
  endDate: string
  sections?: string[]
  includeAI?: boolean
  format?: 'pdf' | 'html'
}

export interface ReportData {
  id: string
  title: string
  period: {
    start: string
    end: string
  }
  generatedAt: string
  summary: any
  infrastructure: any
  performance: any
  capacity: any
  aiInsights: any
  availability: any
  history: any
  details: any
}

export async function generateReport(
  request: ReportGenerationRequest
): Promise<{ reportId: string }> {
  const response = await apiClient.post('/api/v1/reports/generate', request)
  return response.data
}

export async function fetchReportData(reportId: string): Promise<ReportData> {
  const response = await apiClient.get(`/api/v1/reports/${reportId}`)
  return response.data
}

export async function downloadReportPDF(reportId: string): Promise<Blob> {
  const response = await apiClient.get(
    `/api/v1/reports/${reportId}/download/pdf`,
    { responseType: 'blob' }
  )
  return response.data
}
```

## 8. 상태 관리

### 8.1 Report Store
```typescript
// stores/reportStore.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface ReportStore {
  reportData: any | null
  isGenerating: boolean
  generationProgress: number
  error: string | null
  
  setReportData: (data: any) => void
  generateReport: (params: any) => Promise<void>
  downloadPDF: (reportId: string) => Promise<void>
  reset: () => void
}

export const useReportStore = create<ReportStore>()(
  subscribeWithSelector((set, get) => ({
    reportData: null,
    isGenerating: false,
    generationProgress: 0,
    error: null,
    
    setReportData: (data) => set({ reportData: data }),
    
    generateReport: async (params) => {
      set({ isGenerating: true, generationProgress: 0, error: null })
      
      try {
        // Step 1: 데이터 수집 (30%)
        set({ generationProgress: 10 })
        const metricsData = await fetchMetricsData(params)
        
        set({ generationProgress: 30 })
        
        // Step 2: AI 분석 (50%)
        const aiAnalysis = await runAIAnalysis(metricsData)
        
        set({ generationProgress: 50 })
        
        // Step 3: 리포트 생성 (80%)
        const reportData = await createReport({
          metrics: metricsData,
          ai: aiAnalysis,
          ...params
        })
        
        set({ generationProgress: 80 })
        
        // Step 4: 최종 처리 (100%)
        set({ 
          reportData,
          generationProgress: 100,
          isGenerating: false
        })
        
      } catch (error) {
        set({ 
          error: error.message,
          isGenerating: false,
          generationProgress: 0
        })
      }
    },
    
    downloadPDF: async (reportId) => {
      const blob = await downloadReportPDF(reportId)
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${reportId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
    
    reset: () => set({
      reportData: null,
      isGenerating: false,
      generationProgress: 0,
      error: null
    })
  }))
)
```

## 9. 스타일 설정

### 9.1 Print CSS
```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@media print {
  @page {
    size: A4;
    margin: 20mm;
  }
  
  .page-break-after {
    page-break-after: always;
  }
  
  .page-break-before {
    page-break-before: always;
  }
  
  .no-print {
    display: none !important;
  }
  
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  /* 차트 크기 고정 */
  .echarts-container {
    width: 100% !important;
    height: auto !important;
  }
  
  /* 테이블 스타일 */
  table {
    font-size: 10px;
    page-break-inside: avoid;
  }
  
  /* 페이지 번호 */
  .page-number:after {
    content: counter(page);
  }
}

/* 차트 애니메이션 비활성화 (PDF 생성 시) */
[data-report-ready="true"] * {
  animation: none !important;
  transition: none !important;
}
```

## 10. 환경 변수

### 10.1 .env.local
```env
# API 엔드포인트
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws

# Puppeteer 서비스
PUPPETEER_SERVICE_URL=http://localhost:3001

# 리포트 설정
REPORT_CACHE_TTL=3600
REPORT_MAX_PAGES=50
REPORT_TIMEOUT=60000

# AI 서비스
AI_SERVICE_ENDPOINT=https://vllm.hotk.co.kr
AI_MODEL_NAME=gpt-oss-20b
```

이 가이드대로 구현하면 10페이지 이상의 상세한 Ceph 클러스터 리포트를 생성할 수 있습니다.
</content>
</create_file>

<create_file>
<path>/mnt/user-data/outputs/ceph-reporting-module-backend-dev-guide.md</path>
<content># Ceph 클러스터 리포팅 모듈 - 백엔드 고도화 개발 가이드

## 프로젝트 정보
- Language: Java 21
- Framework: Spring Boot 3.5.4
- Database: MariaDB
- Cache: Redis
- Ceph Integration: go-ceph
- AI/ML: vLLM, Qdrant, Smile, XGBoost4J

## 1. 프로젝트 구조

### 1.1 패키지 구조
```
src/main/java/com/ceph/dashboard/
├── controller/
│   └── ReportController.java
├── service/
│   ├── report/
│   │   ├── ReportGenerationService.java
│   │   ├── ReportDataCollectionService.java
│   │   ├── ReportSectionService.java
│   │   └── PDFExportService.java
│   ├── ceph/
│   │   ├── CephMetricsService.java
│   │   ├── CephInfrastructureService.java
│   │   ├── CephPerformanceService.java
│   │   └── GoCephIntegrationService.java
│   ├── ai/
│   │   ├── AIAnalysisService.java
│   │   ├── AnomalyDetectionService.java
│   │   ├── PredictionService.java
│   │   └── OptimizationService.java
│   └── cache/
│       └── ReportCacheService.java
├── model/
│   ├── report/
│   │   ├── Report.java
│   │   ├── ReportSection.java
│   │   └── ReportMetrics.java
│   └── ceph/
│       ├── ClusterInfo.java
│       ├── OSDInfo.java
│       ├── PoolInfo.java
│       └── CRUSHMap.java
├── repository/
│   └── ReportRepository.java
└── config/
    ├── CephConfig.java
    ├── AIConfig.java
    └── CacheConfig.java
```

## 2. 핵심 서비스 구현

### 2.1 Report Generation Service
```java
package com.ceph.dashboard.service.report;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ReportGenerationService {
    
    private final ReportDataCollectionService dataCollectionService;
    private final ReportSectionService sectionService;
    private final AIAnalysisService aiAnalysisService;
    private final ReportRepository reportRepository;
    private final ReportCacheService cacheService;
    
    // Virtual Thread Executor for parallel processing
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
    
    @Transactional
    public Report generateReport(ReportGenerationRequest request) {
        log.info("Starting report generation: {}", request);
        
        Report report = new Report();
        report.setId(UUID.randomUUID().toString());
        report.setType(request.getType());
        report.setStartDate(request.getStartDate());
        report.setEndDate(request.getEndDate());
        report.setGeneratedAt(LocalDateTime.now());
        report.setStatus(ReportStatus.GENERATING);
        
        // Save initial report
        report = reportRepository.save(report);
        
        try {
            // Step 1: Parallel data collection
            CompletableFuture<Map<String, Object>> dataFuture = 
                CompletableFuture.supplyAsync(
                    () -> collectAllData(request), 
                    executor
                );
            
            // Step 2: Wait for data and generate sections
            Map<String, Object> collectedData = dataFuture.get();
            
            // Step 3: Generate report sections in parallel
            List<CompletableFuture<ReportSection>> sectionFutures = Arrays.asList(
                generateExecutiveSummary(collectedData),
                generateInfrastructureSection(collectedData),
                generatePerformanceSection(collectedData),
                generateCapacitySection(collectedData),
                generateAIInsightsSection(collectedData),
                generateAvailabilitySection(collectedData),
                generateOperationalHistorySection(collectedData),
                generateDetailedTablesSection(collectedData)
            );
            
            // Wait for all sections to complete
            CompletableFuture.allOf(
                sectionFutures.toArray(new CompletableFuture[0])
            ).join();
            
            // Collect all sections
            List<ReportSection> sections = new ArrayList<>();
            for (CompletableFuture<ReportSection> future : sectionFutures) {
                sections.add(future.get());
            }
            
            report.setSections(sections);
            report.setStatus(ReportStatus.COMPLETED);
            report.setPageCount(calculatePageCount(sections));
            
            // Save completed report
            report = reportRepository.save(report);
            
            // Cache the report
            cacheService.cacheReport(report);
            
            log.info("Report generation completed: {} with {} pages", 
                report.getId(), report.getPageCount());
            
            return report;
            
        } catch (Exception e) {
            log.error("Report generation failed", e);
            report.setStatus(ReportStatus.FAILED);
            report.setError(e.getMessage());
            reportRepository.save(report);
            throw new ReportGenerationException("Failed to generate report", e);
        }
    }
    
    private Map<String, Object> collectAllData(ReportGenerationRequest request) {
        Map<String, Object> data = new HashMap<>();
        
        // Collect data from multiple sources in parallel
        List<CompletableFuture<Void>> collectors = Arrays.asList(
            CompletableFuture.runAsync(() -> 
                data.put("cluster", dataCollectionService.collectClusterData()), executor),
            CompletableFuture.runAsync(() -> 
                data.put("infrastructure", dataCollectionService.collectInfrastructureData()), executor),
            CompletableFuture.runAsync(() -> 
                data.put("performance", dataCollectionService.collectPerformanceData(
                    request.getStartDate(), request.getEndDate())), executor),
            CompletableFuture.runAsync(() -> 
                data.put("capacity", dataCollectionService.collectCapacityData()), executor),
            CompletableFuture.runAsync(() -> 
                data.put("history", dataCollectionService.collectOperationalHistory(
                    request.getStartDate(), request.getEndDate())), executor)
        );
        
        CompletableFuture.allOf(collectors.toArray(new CompletableFuture[0])).join();
        
        return data;
    }
    
    private CompletableFuture<ReportSection> generateExecutiveSummary(
            Map<String, Object> data) {
        return CompletableFuture.supplyAsync(() -> {
            ReportSection section = new ReportSection();
            section.setTitle("Executive Summary");
            section.setOrder(1);
            section.setPageCount(1);
            
            ExecutiveSummaryData summaryData = sectionService.generateExecutiveSummary(data);
            section.setContent(summaryData);
            
            return section;
        }, executor);
    }
    
    private CompletableFuture<ReportSection> generateAIInsightsSection(
            Map<String, Object> data) {
        return CompletableFuture.supplyAsync(() -> {
            ReportSection section = new ReportSection();
            section.setTitle("AI-Based Insights");
            section.setOrder(5);
            section.setPageCount(3);
            
            // Run AI analysis
            AIInsights insights = aiAnalysisService.analyzeClusterData(data);
            section.setContent(insights);
            
            return section;
        }, executor);
    }
    
    private int calculatePageCount(List<ReportSection> sections) {
        return sections.stream()
            .mapToInt(ReportSection::getPageCount)
            .sum();
    }
}
```

### 2.2 Ceph Data Collection Service
```java
package com.ceph.dashboard.service.report;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class ReportDataCollectionService {
    
    private final CephMetricsService cephMetricsService;
    private final CephInfrastructureService infrastructureService;
    private final CephPerformanceService performanceService;
    private final GoCephIntegrationService goCephService;
    
    /**
     * Collect comprehensive infrastructure data
     */
    public InfrastructureData collectInfrastructureData() {
        InfrastructureData data = new InfrastructureData();
        
        // Physical Infrastructure
        data.setHosts(collectHostInformation());
        data.setDisks(collectDiskInventory());
        data.setNetworkTopology(collectNetworkTopology());
        data.setPowerMetrics(collectPowerMetrics());
        
        // Logical Structure
        data.setCrushMap(collectCRUSHMap());
        data.setPools(collectPoolConfiguration());
        data.setPgDistribution(collectPGDistribution());
        data.setStorageClasses(collectStorageClasses());
        
        return data;
    }
    
    /**
     * Collect detailed host information
     */
    private List<HostInfo> collectHostInformation() {
        List<HostInfo> hosts = new ArrayList<>();
        
        // Get host list from Ceph
        List<String> hostNames = goCephService.getHostList();
        
        for (String hostname : hostNames) {
            HostInfo host = new HostInfo();
            host.setHostname(hostname);
            
            // Get hardware specs via go-ceph
            HardwareSpec spec = goCephService.getHostHardwareSpec(hostname);
            host.setCpuCores(spec.getCpuCores());
            host.setCpuModel(spec.getCpuModel());
            host.setMemoryGB(spec.getMemoryGB());
            host.setNetworkInterfaces(spec.getNetworkInterfaces());
            
            // Get OSDs on this host
            List<Integer> osdIds = goCephService.getOSDsByHost(hostname);
            host.setOsdCount(osdIds.size());
            host.setOsdIds(osdIds);
            
            // Get host metrics
            HostMetrics metrics = cephMetricsService.getHostMetrics(hostname);
            host.setCpuUsage(metrics.getCpuUsage());
            host.setMemoryUsage(metrics.getMemoryUsage());
            host.setNetworkUtilization(metrics.getNetworkUtilization());
            
            hosts.add(host);
        }
        
        return hosts;
    }
    
    /**
     * Collect comprehensive disk inventory with SMART data
     */
    private List<DiskInfo> collectDiskInventory() {
        List<DiskInfo> disks = new ArrayList<>();
        
        // Get all OSDs
        List<OSDInfo> osds = goCephService.getOSDList();
        
        for (OSDInfo osd : osds) {
            DiskInfo disk = new DiskInfo();
            disk.setOsdId(osd.getId());
            disk.setHostname(osd.getHostname());
            disk.setDevice(osd.getDevice());
            disk.setDeviceClass(osd.getDeviceClass());
            disk.setSizeBytes(osd.getSize());
            disk.setUsedBytes(osd.getUsed());
            disk.setAvailableBytes(osd.getAvailable());
            
            // Get SMART data
            SMARTData smart = goCephService.getSMARTData(osd.getDevice());
            disk.setSmartData(smart);
            disk.setHealthStatus(evaluateDiskHealth(smart));
            disk.setPredictedLifespan(predictDiskLifespan(smart));
            
            // Performance metrics
            DiskPerformance perf = performanceService.getDiskPerformance(osd.getId());
            disk.setAvgReadLatency(perf.getAvgReadLatency());
            disk.setAvgWriteLatency(perf.getAvgWriteLatency());
            disk.setReadIOPS(perf.getReadIOPS());
            disk.setWriteIOPS(perf.getWriteIOPS());
            
            disks.add(disk);
        }
        
        return disks;
    }
    
    /**
     * Collect CRUSH Map structure
     */
    private CRUSHMapData collectCRUSHMap() {
        CRUSHMapData crushData = new CRUSHMapData();
        
        // Get CRUSH map from Ceph
        String crushMapJson = goCephService.getCRUSHMapJson();
        CRUSHMap crushMap = parseCRUSHMap(crushMapJson);
        
        // Build hierarchical structure
        crushData.setRootBucket(crushMap.getRootBucket());
        crushData.setTotalWeight(calculateTotalWeight(crushMap));
        crushData.setBuckets(analyzeBuckets(crushMap));
        crushData.setRules(crushMap.getRules());
        crushData.setDeviceClasses(extractDeviceClasses(crushMap));
        
        // Analyze CRUSH distribution
        CRUSHAnalysis analysis = analyzeCRUSHDistribution(crushMap);
        crushData.setDistributionAnalysis(analysis);
        
        return crushData;
    }
    
    /**
     * Collect performance metrics
     */
    public PerformanceData collectPerformanceData(
            LocalDateTime startDate, 
            LocalDateTime endDate) {
        
        PerformanceData data = new PerformanceData();
        
        // IOPS Analysis
        IOPSAnalysis iopsAnalysis = new IOPSAnalysis();
        iopsAnalysis.setPoolTrends(collectPoolIOPSTrends(startDate, endDate));
        iopsAnalysis.setOsdHeatmap(generateOSDIOPSHeatmap());
        iopsAnalysis.setPeakPatterns(analyzePeakPatterns(startDate, endDate));
        iopsAnalysis.setTopClients(getTopClientsByIOPS());
        data.setIops(iopsAnalysis);
        
        // Latency Analysis
        LatencyAnalysis latencyAnalysis = new LatencyAnalysis();
        latencyAnalysis.setDistribution(collectLatencyDistribution());
        latencyAnalysis.setPercentiles(calculateLatencyPercentiles());
        latencyAnalysis.setSlowRequests(analyzeSlowRequests(startDate, endDate));
        data.setLatency(latencyAnalysis);
        
        // Throughput Analysis
        ThroughputAnalysis throughputAnalysis = new ThroughputAnalysis();
        throughputAnalysis.setTrends(collectThroughputTrends(startDate, endDate));
        throughputAnalysis.setPoolBandwidth(analyzePoolBandwidth());
        throughputAnalysis.setRecoveryImpact(analyzeRecoveryImpact());
        data.setThroughput(throughputAnalysis);
        
        return data;
    }
    
    /**
     * Collect Pool IOPS trends
     */
    private Map<String, PoolIOPSTrend> collectPoolIOPSTrends(
            LocalDateTime startDate,
            LocalDateTime endDate) {
        
        Map<String, PoolIOPSTrend> trends = new HashMap<>();
        
        List<PoolInfo> pools = goCephService.getPoolList();
        
        for (PoolInfo pool : pools) {
            PoolIOPSTrend trend = new PoolIOPSTrend();
            trend.setPoolName(pool.getName());
            
            // Get time series data
            TimeSeriesData readIOPS = performanceService.getPoolReadIOPS(
                pool.getId(), startDate, endDate);
            TimeSeriesData writeIOPS = performanceService.getPoolWriteIOPS(
                pool.getId(), startDate, endDate);
            
            trend.setTimestamps(readIOPS.getTimestamps());
            trend.setReadIOPS(readIOPS.getValues());
            trend.setWriteIOPS(writeIOPS.getValues());
            
            // Calculate statistics
            trend.setAvgReadIOPS(calculateAverage(readIOPS.getValues()));
            trend.setAvgWriteIOPS(calculateAverage(writeIOPS.getValues()));
            trend.setPeakReadIOPS(Collections.max(readIOPS.getValues()));
            trend.setPeakWriteIOPS(Collections.max(writeIOPS.getValues()));
            
            trends.put(pool.getName(), trend);
        }
        
        return trends;
    }
    
    /**
     * Generate OSD IOPS heatmap data
     */
    private HeatmapData generateOSDIOPSHeatmap() {
        HeatmapData heatmap = new HeatmapData();
        
        List<OSDInfo> osds = goCephService.getOSDList();
        List<String> hosts = osds.stream()
            .map(OSDInfo::getHostname)
            .distinct()
            .sorted()
            .toList();
        
        // Create matrix: hosts x osds
        double[][] matrix = new double[hosts.size()][];
        
        for (int i = 0; i < hosts.size(); i++) {
            String host = hosts.get(i);
            List<OSDInfo> hostOSDs = osds.stream()
                .filter(osd -> osd.getHostname().equals(host))
                .toList();
            
            matrix[i] = new double[hostOSDs.size()];
            
            for (int j = 0; j < hostOSDs.size(); j++) {
                OSDInfo osd = hostOSDs.get(j);
                // Get current IOPS for this OSD
                double iops = performanceService.getCurrentIOPS(osd.getId());
                matrix[i][j] = iops;
            }
        }
        
        heatmap.setRowLabels(hosts);
        heatmap.setData(matrix);
        heatmap.setColorScheme("heat");
        
        return heatmap;
    }
}
```

### 2.3 AI Analysis Service
```java
package com.ceph.dashboard.service.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class AIAnalysisService {
    
    private final AnomalyDetectionService anomalyDetectionService;
    private final PredictionService predictionService;
    private final OptimizationService optimizationService;
    private final WebClient.Builder webClientBuilder;
    
    @Value("${ai.llm.endpoint}")
    private String llmEndpoint;
    
    @Value("${ai.llm.model}")
    private String llmModel;
    
    /**
     * Comprehensive AI analysis of cluster data
     */
    public AIInsights analyzeClusterData(Map<String, Object> clusterData) {
        AIInsights insights = new AIInsights();
        
        try {
            // 1. Anomaly Detection
            AnomalyDetectionResult anomalies = detectAnomalies(clusterData);
            insights.setAnomalies(anomalies);
            
            // 2. Failure Prediction
            List<FailurePrediction> predictions = predictFailures(clusterData);
            insights.setPredictions(predictions);
            
            // 3. Risk Assessment
            RiskMatrix riskMatrix = assessRisks(clusterData, anomalies, predictions);
            insights.setRiskMatrix(riskMatrix);
            
            // 4. Optimization Recommendations
            List<OptimizationRecommendation> optimizations = 
                generateOptimizations(clusterData);
            insights.setOptimizations(optimizations);
            
            // 5. Generate natural language insights using LLM
            String llmAnalysis = generateLLMInsights(
                clusterData, anomalies, predictions, optimizations);
            insights.setSummary(llmAnalysis);
            
            // 6. Calculate confidence scores
            insights.setConfidenceScore(calculateConfidenceScore(anomalies, predictions));
            insights.setAnalysisWindow(getAnalysisWindow(clusterData));
            
        } catch (Exception e) {
            log.error("AI analysis failed", e);
            insights.setError("AI analysis partially failed: " + e.getMessage());
        }
        
        return insights;
    }
    
    /**
     * Detect anomalies using Isolation Forest
     */
    private AnomalyDetectionResult detectAnomalies(Map<String, Object> data) {
        AnomalyDetectionResult result = new AnomalyDetectionResult();
        
        // Extract time series metrics
        PerformanceData perfData = (PerformanceData) data.get("performance");
        
        // Prepare features for anomaly detection
        List<MetricTimeSeries> metricsList = extractMetrics(perfData);
        
        Map<String, AnomalyScore> anomalyScores = new HashMap<>();
        List<DetectedAnomaly> detectedAnomalies = new ArrayList<>();
        
        for (MetricTimeSeries metric : metricsList) {
            // Run Isolation Forest
            double[] scores = anomalyDetectionService.detectAnomalies(
                metric.getValues(),
                metric.getTimestamps()
            );
            
            // Find anomalous points
            for (int i = 0; i < scores.length; i++) {
                if (scores[i] > 0.7) { // Anomaly threshold
                    DetectedAnomaly anomaly = new DetectedAnomaly();
                    anomaly.setTimestamp(metric.getTimestamps().get(i));
                    anomaly.setComponent(metric.getComponent());
                    anomaly.setMetric(metric.getMetricName());
                    anomaly.setValue(metric.getValues()[i]);
                    anomaly.setAnomalyScore(scores[i]);
                    anomaly.setSeverity(calculateSeverity(scores[i]));
                    anomaly.setDescription(generateAnomalyDescription(metric, i, scores[i]));
                    
                    detectedAnomalies.add(anomaly);
                }
            }
            
            // Store component scores
            double avgScore = Arrays.stream(scores).average().orElse(0.0);
            anomalyScores.put(metric.getComponent(), 
                new AnomalyScore(metric.getComponent(), avgScore));
        }
        
        result.setDetected(detectedAnomalies);
        result.setComponentScores(anomalyScores);
        result.setTimeline(generateAnomalyTimeline(detectedAnomalies));
        
        return result;
    }
    
    /**
     * Predict failures using ML models
     */
    private List<FailurePrediction> predictFailures(Map<String, Object> data) {
        List<FailurePrediction> predictions = new ArrayList<>();
        
        // OSD Failure Prediction
        predictions.add(predictOSDFailures(data));
        
        // Capacity Exhaustion Prediction
        predictions.add(predictCapacityExhaustion(data));
        
        // Performance Degradation Prediction
        predictions.add(predictPerformanceDegradation(data));
        
        // Network Bottleneck Prediction
        predictions.add(predictNetworkBottleneck(data));
        
        // Sort by risk score
        predictions.sort((a, b) -> 
            Double.compare(b.getRiskScore(), a.getRiskScore()));
        
        return predictions;
    }
    
    /**
     * Predict OSD failures
     */
    private FailurePrediction predictOSDFailures(Map<String, Object> data) {
        FailurePrediction prediction = new FailurePrediction();
        prediction.setType("OSD_FAILURE");
        prediction.setTitle("OSD Failure Risk Assessment");
        
        InfrastructureData infra = (InfrastructureData) data.get("infrastructure");
        List<DiskInfo> disks = infra.getDisks();
        
        List<ComponentRisk> riskyOSDs = new ArrayList<>();
        
        for (DiskInfo disk : disks) {
            // Calculate failure probability using multiple factors
            double smartScore = analyzeSmartData(disk.getSmartData());
            double performanceScore = analyzePerformanceMetrics(disk);
            double ageScore = calculateAgeScore(disk.getSmartData());
            
            double failureProbability = predictionService.predictOSDFailure(
                smartScore, performanceScore, ageScore);
            
            if (failureProbability > 0.3) {
                ComponentRisk risk = new ComponentRisk();
                risk.setComponentId("osd." + disk.getOsdId());
                risk.setProbability(failureProbability);
                risk.setTimeToFailure(estimateTimeToFailure(failureProbability));
                risk.setImpact(calculateFailureImpact(disk));
                risk.setRecommendation(generateOSDRecommendation(disk, failureProbability));
                
                riskyOSDs.add(risk);
            }
        }
        
        prediction.setRiskyComponents(riskyOSDs);
        prediction.setRiskScore(calculateOverallRisk(riskyOSDs));
        prediction.setDescription(generatePredictionSummary(riskyOSDs));
        
        return prediction;
    }
    
    /**
     * Generate LLM-based insights
     */
    private String generateLLMInsights(
            Map<String, Object> data,
            AnomalyDetectionResult anomalies,
            List<FailurePrediction> predictions,
            List<OptimizationRecommendation> optimizations) {
        
        // Prepare prompt
        String prompt = buildAnalysisPrompt(data, anomalies, predictions, optimizations);
        
        // Call LLM service
        WebClient webClient = webClientBuilder
            .baseUrl(llmEndpoint)
            .build();
        
        LLMRequest request = LLMRequest.builder()
            .model(llmModel)
            .prompt(prompt)
            .temperature(0.1)
            .maxTokens(2000)
            .build();
        
        Mono<LLMResponse> responseMono = webClient.post()
            .uri("/v1/completions")
            .bodyValue(request)
            .retrieve()
            .bodyToMono(LLMResponse.class);
        
        LLMResponse response = responseMono.block();
        
        return response != null ? response.getCompletion() : 
            "AI analysis unavailable";
    }
    
    /**
     * Build analysis prompt for LLM
     */
    private String buildAnalysisPrompt(
            Map<String, Object> data,
            AnomalyDetectionResult anomalies,
            List<FailurePrediction> predictions,
            List<OptimizationRecommendation> optimizations) {
        
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("As a Ceph storage expert, analyze the following cluster data and provide insights:\n\n");
        
        // Cluster summary
        ClusterInfo cluster = (ClusterInfo) data.get("cluster");
        prompt.append("Cluster Status:\n");
        prompt.append("- Health: ").append(cluster.getHealth()).append("\n");
        prompt.append("- Total OSDs: ").append(cluster.getOsdCount()).append("\n");
        prompt.append("- Total Capacity: ").append(formatBytes(cluster.getTotalCapacity())).append("\n");
        prompt.append("- Used: ").append(formatBytes(cluster.getUsedCapacity())).append("\n\n");
        
        // Anomalies
        prompt.append("Detected Anomalies:\n");
        anomalies.getDetected().stream()
            .limit(5)
            .forEach(a -> prompt.append("- ")
                .append(a.getComponent()).append(": ")
                .append(a.getDescription()).append("\n"));
        prompt.append("\n");
        
        // Predictions
        prompt.append("Risk Predictions:\n");
        predictions.stream()
            .limit(3)
            .forEach(p -> prompt.append("- ")
                .append(p.getTitle()).append(": ")
                .append(String.format("%.1f%% risk", p.getRiskScore() * 100)).append("\n"));
        prompt.append("\n");
        
        prompt.append("Provide:\n");
        prompt.append("1. Executive summary of cluster health\n");
        prompt.append("2. Critical issues requiring immediate attention\n");
        prompt.append("3. Recommended actions with priority\n");
        prompt.append("4. Long-term optimization strategies\n");
        
        return prompt.toString();
    }
}
```

### 2.4 Go-Ceph Integration Service
```java
package com.ceph.dashboard.service.ceph;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class GoCephIntegrationService {
    
    private final RestTemplate restTemplate;
    
    @Value("${go.ceph.service.url}")
    private String goCephServiceUrl;
    
    /**
     * Get comprehensive OSD information
     */
    public List<OSDInfo> getOSDList() {
        String url = goCephServiceUrl + "/api/v1/osds";
        
        ResponseEntity<OSDListResponse> response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            null,
            OSDListResponse.class
        );
        
        return response.getBody().getOsds();
    }
    
    /**
     * Get SMART data for a disk
     */
    public SMARTData getSMARTData(String device) {
        String url = goCephServiceUrl + "/api/v1/smart/" + device;
        
        ResponseEntity<SMARTData> response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            null,
            SMARTData.class
        );
        
        SMARTData smart = response.getBody();
        
        // Parse critical SMART attributes
        smart.setReallocatedSectors(
            extractSmartAttribute(smart, 5));  // Reallocated Sectors Count
        smart.setPendingSectors(
            extractSmartAttribute(smart, 197)); // Current Pending Sector Count
        smart.setUncorrectableErrors(
            extractSmartAttribute(smart, 198)); // Offline Uncorrectable
        smart.setTemperature(
            extractSmartAttribute(smart, 194)); // Temperature
        smart.setPowerOnHours(
            extractSmartAttribute(smart, 9));   // Power-On Hours
        smart.setMediaWearout(
            extractSmartAttribute(smart, 233)); // Media Wearout Indicator (SSD)
        
        return smart;
    }
    
    /**
     * Get CRUSH map as JSON
     */
    public String getCRUSHMapJson() {
        String url = goCephServiceUrl + "/api/v1/crush/map";
        
        ResponseEntity<String> response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            null,
            String.class
        );
        
        return response.getBody();
    }
    
    /**
     * Get Pool statistics
     */
    public List<PoolStats> getPoolStats() {
        String url = goCephServiceUrl + "/api/v1/pools/stats";
        
        ResponseEntity<PoolStatsResponse> response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            null,
            PoolStatsResponse.class
        );
        
        return response.getBody().getPools();
    }
    
    /**
     * Get PG distribution
     */
    public PGDistribution getPGDistribution() {
        String url = goCephServiceUrl + "/api/v1/pg/distribution";
        
        ResponseEntity<PGDistribution> response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            null,
            PGDistribution.class
        );
        
        PGDistribution dist = response.getBody();
        
        // Calculate additional metrics
        dist.setAveragePerOSD(
            (double) dist.getTotalPGs() / dist.getOsdCount());
        dist.setStandardDeviation(
            calculatePGStandardDeviation(dist.getOsdPGCounts()));
        dist.setImbalanceScore(
            dist.getStandardDeviation() / dist.getAveragePerOSD());
        
        return dist;
    }
    
    /**
     * Get client connection information
     */
    public List<ClientConnection> getClientConnections() {
        String url = goCephServiceUrl + "/api/v1/clients";
        
        ResponseEntity<ClientConnectionsResponse> response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            null,
            ClientConnectionsResponse.class
        );
        
        return response.getBody().getClients();
    }
    
    /**
     * Get historical metrics for a specific period
     */
    public MetricsHistory getMetricsHistory(
            String metric, 
            LocalDateTime start, 
            LocalDateTime end) {
        
        String url = String.format(
            "%s/api/v1/metrics/history?metric=%s&start=%s&end=%s",
            goCephServiceUrl, metric, start, end);
        
        ResponseEntity<MetricsHistory> response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            null,
            MetricsHistory.class
        );
        
        return response.getBody();
    }
    
    /**
     * Execute Ceph command via go-ceph
     */
    public String executeCephCommand(String command) {
        String url = goCephServiceUrl + "/api/v1/command";
        
        Map<String, String> request = new HashMap<>();
        request.put("command", command);
        
        ResponseEntity<CommandResponse> response = restTemplate.exchange(
            url,
            HttpMethod.POST,
            new HttpEntity<>(request),
            CommandResponse.class
        );
        
        return response.getBody().getOutput();
    }
    
    /**
     * Get network topology information
     */
    public NetworkTopology getNetworkTopology() {
        String url = goCephServiceUrl + "/api/v1/network/topology";
        
        ResponseEntity<NetworkTopology> response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            null,
            NetworkTopology.class
        );
        
        NetworkTopology topology = response.getBody();
        
        // Analyze network segments
        topology.setPublicNetwork(analyzeNetworkSegment(topology.getPublicSubnet()));
        topology.setClusterNetwork(analyzeNetworkSegment(topology.getClusterSubnet()));
        
        // Calculate network utilization
        for (NetworkNode node : topology.getNodes()) {
            node.setPublicUtilization(
                calculateNetworkUtilization(node.getPublicInterface()));
            node.setClusterUtilization(
                calculateNetworkUtilization(node.getClusterInterface()));
        }
        
        return topology;
    }
    
    private int extractSmartAttribute(SMARTData smart, int attributeId) {
        return smart.getAttributes().stream()
            .filter(attr -> attr.getId() == attributeId)
            .findFirst()
            .map(SMARTAttribute::getRawValue)
            .orElse(0);
    }
    
    private double calculatePGStandardDeviation(Map<Integer, Integer> osdPGCounts) {
        double mean = osdPGCounts.values().stream()
            .mapToInt(Integer::intValue)
            .average()
            .orElse(0.0);
        
        double variance = osdPGCounts.values().stream()
            .mapToDouble(count -> Math.pow(count - mean, 2))
            .average()
            .orElse(0.0);
        
        return Math.sqrt(variance);
    }
}
```

### 2.5 Report Model Classes
```java
package com.ceph.dashboard.model.report;

import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "reports")
@Data
public class Report {
    @Id
    private String id;
    
    @Enumerated(EnumType.STRING)
    private ReportType type;
    
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime generatedAt;
    
    @Enumerated(EnumType.STRING)
    private ReportStatus status;
    
    private Integer pageCount;
    
    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id")
    private List<ReportSection> sections;
    
    @Column(columnDefinition = "TEXT")
    private String error;
    
    @Transient
    private Map<String, Object> metadata;
}

@Entity
@Table(name = "report_sections")
@Data
public class ReportSection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String reportId;
    private String title;
    private Integer order;
    private Integer pageCount;
    
    @Lob
    @Column(columnDefinition = "MEDIUMTEXT")
    private String contentJson;
    
    @Transient
    private Object content;
    
    @PostLoad
    private void deserializeContent() {
        // Deserialize JSON to content object
        if (contentJson != null) {
            content = JsonUtils.fromJson(contentJson, Object.class);
        }
    }
    
    @PrePersist
    @PreUpdate
    private void serializeContent() {
        // Serialize content object to JSON
        if (content != null) {
            contentJson = JsonUtils.toJson(content);
        }
    }
}

public enum ReportType {
    DAILY, WEEKLY, MONTHLY, QUARTERLY, ANNUAL, CUSTOM
}

public enum ReportStatus {
    PENDING, GENERATING, COMPLETED, FAILED, CANCELLED
}
```

### 2.6 Report Controller
```java
package com.ceph.dashboard.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {
    
    private final ReportGenerationService reportGenerationService;
    private final ReportRepository reportRepository;
    private final PDFExportService pdfExportService;
    
    private final ExecutorService executor = Executors.newCachedThreadPool();
    
    /**
     * Generate a new report
     */
    @PostMapping("/generate")
    public ResponseEntity<ReportGenerationResponse> generateReport(
            @RequestBody ReportGenerationRequest request) {
        
        log.info("Report generation requested: {}", request);
        
        // Start async generation
        String reportId = UUID.randomUUID().toString();
        
        executor.submit(() -> {
            try {
                Report report = reportGenerationService.generateReport(request);
                log.info("Report generated successfully: {}", report.getId());
            } catch (Exception e) {
                log.error("Report generation failed", e);
            }
        });
        
        return ResponseEntity.accepted()
            .body(new ReportGenerationResponse(reportId, "GENERATING"));
    }
    
    /**
     * Get report by ID
     */
    @GetMapping("/{reportId}")
    public ResponseEntity<ReportResponse> getReport(
            @PathVariable String reportId) {
        
        Report report = reportRepository.findById(reportId)
            .orElseThrow(() -> new ReportNotFoundException(reportId));
        
        ReportResponse response = convertToResponse(report);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Stream report generation progress
     */
    @GetMapping("/{reportId}/progress")
    public SseEmitter streamProgress(@PathVariable String reportId) {
        SseEmitter emitter = new SseEmitter(300000L); // 5 minutes timeout
        
        executor.submit(() -> {
            try {
                while (true) {
                    Report report = reportRepository.findById(reportId).orElse(null);
                    
                    if (report == null) {
                        emitter.send(SseEmitter.event()
                            .name("error")
                            .data("Report not found"));
                        break;
                    }
                    
                    emitter.send(SseEmitter.event()
                        .name("progress")
                        .data(new ProgressUpdate(
                            report.getStatus(),
                            calculateProgress(report)
                        )));
                    
                    if (report.getStatus() == ReportStatus.COMPLETED ||
                        report.getStatus() == ReportStatus.FAILED) {
                        emitter.complete();
                        break;
                    }
                    
                    Thread.sleep(1000); // Check every second
                }
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });
        
        return emitter;
    }
    
    /**
     * Download report as PDF
     */
    @GetMapping("/{reportId}/download/pdf")
    public ResponseEntity<byte[]> downloadPDF(
            @PathVariable String reportId) {
        
        Report report = reportRepository.findById(reportId)
            .orElseThrow(() -> new ReportNotFoundException(reportId));
        
        if (report.getStatus() != ReportStatus.COMPLETED) {
            return ResponseEntity.status(HttpStatus.PRECONDITION_FAILED)
                .body("Report is not ready".getBytes());
        }
        
        byte[] pdfData = pdfExportService.exportToPDF(report);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(
            ContentDisposition.attachment()
                .filename("ceph-report-" + reportId + ".pdf")
                .build()
        );
        
        return new ResponseEntity<>(pdfData, headers, HttpStatus.OK);
    }
    
    /**
     * List reports with pagination
     */
    @GetMapping
    public ResponseEntity<Page<ReportSummary>> listReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) ReportType type,
            @RequestParam(required = false) ReportStatus status) {
        
        Pageable pageable = PageRequest.of(page, size, 
            Sort.by(Sort.Direction.DESC, "generatedAt"));
        
        Specification<Report> spec = Specification.where(null);
        
        if (type != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("type"), type));
        }
        
        if (status != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("status"), status));
        }
        
        Page<Report> reports = reportRepository.findAll(spec, pageable);
        Page<ReportSummary> summaries = reports.map(this::toSummary);
        
        return ResponseEntity.ok(summaries);
    }
    
    /**
     * Delete a report
     */
    @DeleteMapping("/{reportId}")
    public ResponseEntity<Void> deleteReport(
            @PathVariable String reportId) {
        
        if (!reportRepository.existsById(reportId)) {
            return ResponseEntity.notFound().build();
        }
        
        reportRepository.deleteById(reportId);
        
        return ResponseEntity.noContent().build();
    }
    
    private ReportResponse convertToResponse(Report report) {
        ReportResponse response = new ReportResponse();
        response.setId(report.getId());
        response.setType(report.getType());
        response.setStatus(report.getStatus());
        response.setGeneratedAt(report.getGeneratedAt());
        response.setPageCount(report.getPageCount());
        
        // Convert sections
        if (report.getSections() != null) {
            Map<String, Object> sections = new HashMap<>();
            for (ReportSection section : report.getSections()) {
                sections.put(section.getTitle().toLowerCase()
                    .replace(" ", "_"), section.getContent());
            }
            response.setSections(sections);
        }
        
        return response;
    }
    
    private ReportSummary toSummary(Report report) {
        return ReportSummary.builder()
            .id(report.getId())
            .type(report.getType())
            .status(report.getStatus())
            .generatedAt(report.getGeneratedAt())
            .pageCount(report.getPageCount())
            .build();
    }
    
    private int calculateProgress(Report report) {
        if (report.getStatus() == ReportStatus.COMPLETED) return 100;
        if (report.getStatus() == ReportStatus.FAILED) return -1;
        if (report.getStatus() == ReportStatus.PENDING) return 0;
        
        // Calculate based on completed sections
        if (report.getSections() != null && !report.getSections().isEmpty()) {
            int totalSections = 8; // Expected sections
            int completedSections = report.getSections().size();
            return (completedSections * 100) / totalSections;
        }
        
        return 10; // Default progress for GENERATING status
    }
}
```

## 3. 설정 파일

### 3.1 application.yml
```yaml
spring:
  application:
    name: ceph-dashboard-api
  
  datasource:
    url: jdbc:mariadb://localhost:3306/ceph_dashboard
    username: ceph_user
    password: ${DB_PASSWORD}
    driver-class-name: org.mariadb.jdbc.Driver
  
  jpa:
    hibernate:
      ddl-auto: update
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MariaDBDialect
  
  redis:
    host: localhost
    port: 6379
    timeout: 2000ms
    
  cache:
    type: redis
    redis:
      time-to-live: 600000
      cache-null-values: false

# Go-Ceph Service
go:
  ceph:
    service:
      url: http://localhost:8081
      timeout: 30000

# AI Configuration  
ai:
  llm:
    endpoint: https://vllm.hotk.co.kr
    model: gpt-oss-20b
    temperature: 0.1
    max-tokens: 2000
    
  qdrant:
    url: http://localhost:6333
    collection: ceph_squid_ko
    
# Report Configuration
report:
  generation:
    timeout: 300000
    max-concurrent: 5
    cache-ttl: 3600000
    
  pdf:
    puppeteer-service: http://localhost:3001
    timeout: 60000

# Monitoring
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    export:
      prometheus:
        enabled: true
```

### 3.2 pom.xml Dependencies
```xml
<dependencies>
    <!-- Spring Boot -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
    
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-cache</artifactId>
    </dependency>
    
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webflux</artifactId>
    </dependency>
    
    <!-- Database -->
    <dependency>
        <groupId>org.mariadb.jdbc</groupId>
        <artifactId>mariadb-java-client</artifactId>
    </dependency>
    
    <!-- ML Libraries -->
    <dependency>
        <groupId>com.github.haifengl</groupId>
        <artifactId>smile-core</artifactId>
        <version>3.0.2</version>
    </dependency>
    
    <dependency>
        <groupId>ml.dmlc</groupId>
        <artifactId>xgboost4j</artifactId>
        <version>1.7.6</version>
    </dependency>
    
    <!-- Utilities -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <scope>provided</scope>
    </dependency>
    
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
    </dependency>
    
    <!-- Monitoring -->
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-registry-prometheus</artifactId>
    </dependency>
</dependencies>
```

## 4. 구현 체크리스트

Claude Code가 이 가이드를 따라 구현할 때 확인해야 할 사항:

1. **데이터 수집 완성도**
    - [ ] 모든 물리 인프라 정보 수집 (호스트, 디스크, 네트워크)
    - [ ] CRUSH Map 완전 파싱 및 분석
    - [ ] SMART 데이터 상세 수집
    - [ ] PG 분포 분석
    - [ ] 클라이언트 연결 정보

2. **AI/ML 통합**
    - [ ] Isolation Forest 이상감지 구현
    - [ ] XGBoost 예측 모델 (옵션)
    - [ ] vLLM 연동 및 프롬프트 최적화
    - [ ] Risk Matrix 계산

3. **성능 최적화**
    - [ ] Virtual Thread 사용
    - [ ] Redis 캐싱 적용
    - [ ] 병렬 데이터 수집

4. **리포트 품질**
    - [ ] 10페이지 이상 컨텐츠 생성
    - [ ] 차트 데이터 완성도
    - [ ] AI 인사이트 포함

이 가이드를 따라 구현하면 Ceph 클러스터의 모든 정보를 포함한 10페이지 이상의 상세한 리포트를 생성할 수 있습니다.
</content>
</create_file>

프론트엔드와 백엔드 고도화 개발 가이드를 작성 완료했습니다.

**주요 특징:**

1. **10페이지 이상 리포트 구성**
    - Executive Summary (1페이지)
    - 클러스터 인프라 현황 (2-3페이지)
    - 성능 메트릭 상세 (2-3페이지)
    - 용량 관리 (2페이지)
    - AI 기반 인사이트 (2-3페이지)
    - 가용성 및 복구 (1-2페이지)
    - 운영 이력 (1페이지)
    - 부록: 상세 테이블 (2-3페이지)

2. **go-ceph 통합 데이터**
    - 물리적 정보: 호스트, 디스크, SMART, 네트워크
    - 논리적 정보: CRUSH Map, Pool, PG, Client

3. **AI 기반 분석**
    - Isolation Forest 이상감지
    - 12가지 장애 예측 카테고리
    - vLLM 기반 자연어 인사이트
    - Risk Matrix 및 최적화 권장사항

Claude Code가 이 문서들을 참고하여 리포팅 모듈을 구현할 수 있을 것입니다.