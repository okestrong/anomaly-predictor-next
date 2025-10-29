# Ceph 클러스터 AI 대시보드 - 리포팅 프론트엔드 개발 가이드

## 1. 프로젝트 개요

### 1.1 기술 스택
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Charts**: ECharts (SSR 최적화) + Recharts
- **3D Visualization**: React Three Fiber
- **PDF Generation**: jsPDF + html2canvas
- **Email Preview**: react-email

### 1.2 리포팅 모듈 구조
```
app/
├── reports/
│   ├── layout.tsx                 # 리포트 레이아웃
│   ├── page.tsx                   # 리포트 대시보드
│   ├── daily/page.tsx             # 일일 리포트
│   ├── weekly/page.tsx            # 주간 리포트
│   ├── monthly/page.tsx           # 월간 리포트
│   ├── ai-insights/page.tsx       # AI 인사이트
│   ├── predictions/page.tsx       # 예측 리포트
│   ├── performance/page.tsx       # 성능 분석
│   ├── capacity/page.tsx          # 용량 계획
│   ├── custom/page.tsx            # 커스텀 리포트
│   └── templates/page.tsx         # 템플릿 관리
```

## 2. 리포트 대시보드 (Main Dashboard)

### 2.1 메인 화면 구성
```tsx
// app/reports/page.tsx
export default async function ReportsPage() {
  const recentReports = await fetchRecentReports()
  const scheduledReports = await fetchScheduledReports()
  const templates = await fetchTemplates()
  
  return (
    <div className="p-6 space-y-6">
      {/* 헤더 섹션 */}
      <ReportHeader />
      
      {/* 빠른 생성 카드 */}
      <QuickReportCards />
      
      {/* 최근 생성 리포트 */}
      <RecentReports data={recentReports} />
      
      {/* 예정된 리포트 */}
      <ScheduledReports data={scheduledReports} />
      
      {/* 리포트 템플릿 */}
      <ReportTemplates data={templates} />
    </div>
  )
}
```

### 2.2 빠른 생성 카드
```tsx
// components/reports/QuickReportCards.tsx
const reportTypes = [
  {
    id: 'daily',
    title: '일일 리포트',
    description: '24시간 클러스터 상태 요약',
    icon: CalendarDailyIcon,
    color: 'blue',
    lastGenerated: '2시간 전'
  },
  {
    id: 'weekly',
    title: '주간 리포트',
    description: '7일간 트렌드 분석',
    icon: CalendarWeekIcon,
    color: 'green',
    lastGenerated: '3일 전'
  },
  {
    id: 'monthly',
    title: '월간 리포트',
    description: '월간 종합 분석',
    icon: CalendarMonthIcon,
    color: 'purple',
    lastGenerated: '1주일 전'
  },
  {
    id: 'ai-insights',
    title: 'AI 인사이트',
    description: 'AI 기반 분석 및 추천',
    icon: BrainIcon,
    color: 'yellow',
    badge: 'AI 활용'
  }
]

export function QuickReportCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {reportTypes.map(report => (
        <ReportCard key={report.id} {...report} />
      ))}
    </div>
  )
}
```

## 3. 일일 리포트 (Daily Report)

### 3.1 화면 구성
```tsx
// app/reports/daily/page.tsx
export default function DailyReportPage() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 리포트 헤더 */}
      <DailyReportHeader />
      
      {/* 리포트 설정 패널 */}
      <ReportConfigPanel>
        <DateRangePicker defaultValue="today" />
        <ComponentSelector />
        <MetricSelector />
        <AIInsightToggle />
      </ReportConfigPanel>
      
      {/* 리포트 미리보기 */}
      <ReportPreview>
        {/* 클러스터 상태 요약 */}
        <ClusterHealthSummary />
        
        {/* 주요 메트릭 카드 */}
        <KeyMetricsGrid />
        
        {/* 성능 차트 */}
        <PerformanceCharts />
        
        {/* 이벤트 타임라인 */}
        <EventTimeline />
        
        {/* AI 분석 결과 */}
        <AIAnalysisSection />
        
        {/* 알람 및 경고 */}
        <AlertsSummary />
        
        {/* 예측 및 권장사항 */}
        <PredictionsAndRecommendations />
      </ReportPreview>
      
      {/* 액션 버튼 */}
      <ReportActions>
        <SaveTemplateButton />
        <DownloadButton formats={['PDF', 'HTML', 'JSON']} />
        <EmailButton />
        <ScheduleButton />
      </ReportActions>
    </div>
  )
}
```

### 3.2 클러스터 상태 요약 컴포넌트
```tsx
// components/reports/daily/ClusterHealthSummary.tsx
export function ClusterHealthSummary() {
  const { health, uptime, availability } = useClusterHealth()
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <StatusIcon status={health} className="mr-2" />
        클러스터 상태 요약
      </h3>
      
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Health Status"
          value={health}
          color={getHealthColor(health)}
          trend={getHealthTrend()}
        />
        <MetricCard
          label="Uptime"
          value={`${uptime}%`}
          subtitle="최근 24시간"
        />
        <MetricCard
          label="가용성"
          value={`${availability}%`}
          target="99.9%"
        />
        <MetricCard
          label="활성 알람"
          value={activeAlarms}
          severity={getAlarmSeverity()}
        />
      </div>
      
      {/* AI 인사이트 */}
      <AIInsightBox>
        클러스터 상태가 양호합니다. 지난 24시간 동안 중요 이벤트는 없었으며, 
        모든 서비스가 정상 운영 중입니다.
      </AIInsightBox>
    </div>
  )
}
```

## 4. 주간 리포트 (Weekly Report)

### 4.1 트렌드 분석 섹션
```tsx
// components/reports/weekly/TrendAnalysis.tsx
export function TrendAnalysis() {
  const trends = useWeeklyTrends()
  
  return (
    <div className="space-y-6">
      {/* 용량 증가 트렌드 */}
      <TrendCard
        title="용량 사용 트렌드"
        icon={StorageIcon}
        chart={
          <AreaChart
            data={trends.capacity}
            categories={['Used', 'Available']}
            index="date"
          />
        }
        insights={[
          "주간 용량 증가율: 2.3%",
          "예상 고갈 시점: 120일 후",
          "권장: Pool 확장 검토"
        ]}
      />
      
      {/* IOPS 패턴 분석 */}
      <TrendCard
        title="IOPS 패턴"
        icon={PerformanceIcon}
        chart={
          <LineChart
            data={trends.iops}
            categories={['Read', 'Write']}
            showPeakAnnotations
          />
        }
        insights={[
          "피크 시간: 평일 14:00-16:00",
          "평균 IOPS: 15,000",
          "주말 대비 평일 3.2배 높음"
        ]}
      />
      
      {/* 장애 예측 트렌드 */}
      <TrendCard
        title="장애 위험도 변화"
        icon={AlertIcon}
        chart={
          <HeatmapChart
            data={trends.risks}
            categories={predictionCategories}
          />
        }
        aiAnalysis={true}
      />
    </div>
  )
}
```

## 5. 월간 리포트 (Monthly Report)

### 5.1 종합 대시보드
```tsx
// components/reports/monthly/ExecutiveDashboard.tsx
export function ExecutiveDashboard() {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* KPI 섹션 */}
      <div className="col-span-12">
        <KPISection />
      </div>
      
      {/* 가용성 차트 */}
      <div className="col-span-6">
        <AvailabilityChart />
      </div>
      
      {/* 성능 메트릭 */}
      <div className="col-span-6">
        <PerformanceMetrics />
      </div>
      
      {/* 용량 계획 */}
      <div className="col-span-8">
        <CapacityPlanning />
      </div>
      
      {/* 비용 분석 */}
      <div className="col-span-4">
        <CostAnalysis />
      </div>
      
      {/* 장애 통계 */}
      <div className="col-span-12">
        <IncidentStatistics />
      </div>
    </div>
  )
}
```

### 5.2 KPI 섹션
```tsx
// components/reports/monthly/KPISection.tsx
export function KPISection() {
  const kpis = [
    {
      metric: 'SLA 달성률',
      value: '99.95%',
      target: '99.9%',
      status: 'success',
      trend: '+0.05%'
    },
    {
      metric: 'MTBF',
      value: '720시간',
      target: '500시간',
      status: 'success',
      trend: '+120시간'
    },
    {
      metric: 'MTTR',
      value: '15분',
      target: '30분',
      status: 'success',
      trend: '-5분'
    },
    {
      metric: '용량 효율성',
      value: '82%',
      target: '80%',
      status: 'warning',
      trend: '-3%'
    }
  ]
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
      <h3 className="text-xl font-bold mb-6">월간 핵심 성과 지표</h3>
      <div className="grid grid-cols-4 gap-6">
        {kpis.map(kpi => (
          <KPICard key={kpi.metric} {...kpi} />
        ))}
      </div>
    </div>
  )
}
```

## 6. AI 인사이트 리포트

### 6.1 AI 분석 대시보드
```tsx
// app/reports/ai-insights/page.tsx
export default function AIInsightsPage() {
  return (
    <div className="space-y-6">
      {/* AI 모델 정보 */}
      <AIModelInfo 
        model="gpt-oss-20b"
        embedding="nomic-embed-text:v1.5"
        vectorDB="Qdrant"
      />
      
      {/* 실시간 이상감지 */}
      <AnomalyDetectionPanel />
      
      {/* 패턴 인식 */}
      <PatternRecognition />
      
      {/* 예측 분석 */}
      <PredictiveAnalytics />
      
      {/* 최적화 추천 */}
      <OptimizationRecommendations />
      
      {/* RAG 기반 조치 가이드 */}
      <RAGGuidancePanel />
    </div>
  )
}
```

### 6.2 실시간 이상감지 패널
```tsx
// components/reports/ai/AnomalyDetectionPanel.tsx
export function AnomalyDetectionPanel() {
  const { anomalies, scores, patterns } = useAnomalyDetection()
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center">
          <BrainIcon className="mr-2 text-purple-500" />
          ML 기반 이상감지 (Smile IsolationForest)
        </h3>
        <Badge variant="success">실시간 분석 중</Badge>
      </div>
      
      {/* 이상 점수 게이지 */}
      <div className="grid grid-cols-3 gap-6">
        <AnomalyScoreGauge 
          score={scores.overall}
          threshold={0.7}
          label="전체 이상 점수"
        />
        
        {/* 히트맵 */}
        <div className="col-span-2">
          <AnomalyHeatmap 
            data={patterns}
            dimensions={['Component', 'Metric', 'Time']}
          />
        </div>
      </div>
      
      {/* 감지된 이상 패턴 */}
      <AnomalyList 
        items={anomalies}
        showConfidence={true}
        showActions={true}
      />
    </div>
  )
}
```

## 7. 예측 리포트

### 7.1 12개 카테고리 예측 대시보드
```tsx
// components/reports/predictions/PredictionGrid.tsx
export function PredictionGrid() {
  const predictions = usePredictions()
  
  const categories = [
    { id: 'osd-failure', name: 'OSD 장애', icon: DiskIcon },
    { id: 'capacity-exhaustion', name: '용량 고갈', icon: StorageIcon },
    { id: 'performance-degradation', name: '성능 저하', icon: SpeedIcon },
    { id: 'pg-imbalance', name: 'PG 불균형', icon: BalanceIcon },
    { id: 'network-bottleneck', name: '네트워크 병목', icon: NetworkIcon },
    { id: 'memory-shortage', name: '메모리 부족', icon: MemoryIcon },
    { id: 'rebalancing-needed', name: '리밸런싱 필요', icon: RefreshIcon },
    { id: 'hotspot-osd', name: '핫스팟 OSD', icon: FireIcon },
    { id: 'cluster-expansion', name: '클러스터 확장', icon: ExpandIcon },
    { id: 'smart-disk-failure', name: 'SMART 디스크 장애', icon: WarningIcon },
    { id: 'metric-disk-failure', name: '메트릭 기반 장애', icon: ChartIcon },
    { id: 'comprehensive', name: '종합 예측', icon: DashboardIcon }
  ]
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {categories.map(category => (
        <PredictionCard
          key={category.id}
          category={category}
          prediction={predictions[category.id]}
          showTimeline={true}
          showConfidence={true}
        />
      ))}
    </div>
  )
}
```

### 7.2 예측 상세 모달
```tsx
// components/reports/predictions/PredictionDetailModal.tsx
export function PredictionDetailModal({ prediction, isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader>
        <h2 className="text-xl font-bold">
          {prediction.category} 예측 상세
        </h2>
      </ModalHeader>
      
      <ModalBody>
        {/* 위험도 평가 */}
        <RiskAssessment 
          probability={prediction.probability}
          impact={prediction.impact}
          timeToEvent={prediction.estimatedTime}
        />
        
        {/* 근거 데이터 차트 */}
        <EvidenceCharts 
          metrics={prediction.evidenceMetrics}
          anomalies={prediction.anomalyScores}
        />
        
        {/* AI 분석 설명 */}
        <AIExplanation 
          factors={prediction.riskFactors}
          confidence={prediction.confidence}
          model={prediction.modelUsed}
        />
        
        {/* 권장 조치 사항 */}
        <RecommendedActions 
          actions={prediction.recommendations}
          priority={prediction.priority}
        />
        
        {/* RAG 기반 가이드 */}
        <RAGGuide 
          context={prediction.context}
          commands={prediction.suggestedCommands}
        />
      </ModalBody>
      
      <ModalFooter>
        <Button onClick={() => exportPrediction(prediction)}>
          리포트 내보내기
        </Button>
        <Button onClick={() => createTicket(prediction)}>
          티켓 생성
        </Button>
        <Button onClick={onClose}>닫기</Button>
      </ModalFooter>
    </Modal>
  )
}
```

## 8. 성능 분석 리포트

### 8.1 성능 메트릭 대시보드
```tsx
// components/reports/performance/PerformanceDashboard.tsx
export function PerformanceDashboard() {
  return (
    <div className="space-y-6">
      {/* 실시간 성능 지표 */}
      <RealtimeMetrics />
      
      {/* IOPS 분석 */}
      <IOPSAnalysis />
      
      {/* 레이턴시 분석 */}
      <LatencyAnalysis />
      
      {/* 처리량 분석 */}
      <ThroughputAnalysis />
      
      {/* 병목 구간 식별 */}
      <BottleneckIdentification />
      
      {/* 성능 최적화 제안 */}
      <PerformanceOptimizations />
    </div>
  )
}
```

### 8.2 병목 구간 식별
```tsx
// components/reports/performance/BottleneckIdentification.tsx
export function BottleneckIdentification() {
  const bottlenecks = useBottlenecks()
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">병목 구간 자동 식별</h3>
      
      {/* 3D 토폴로지 시각화 */}
      <div className="h-96 mb-6">
        <Canvas>
          <BottleneckTopology 
            nodes={bottlenecks.nodes}
            flows={bottlenecks.flows}
            hotspots={bottlenecks.hotspots}
          />
        </Canvas>
      </div>
      
      {/* 병목 구간 리스트 */}
      <BottleneckList 
        items={bottlenecks.identified}
        showImpact={true}
        showSolution={true}
      />
      
      {/* AI 기반 원인 분석 */}
      <AIRootCauseAnalysis 
        bottlenecks={bottlenecks}
        showConfidence={true}
      />
    </div>
  )
}
```

## 9. 용량 계획 리포트

### 9.1 용량 예측 모델
```tsx
// components/reports/capacity/CapacityForecast.tsx
export function CapacityForecast() {
  const forecast = useCapacityForecast()
  
  return (
    <div className="space-y-6">
      {/* 현재 사용률 */}
      <CurrentUtilization 
        pools={forecast.pools}
        showTrend={true}
      />
      
      {/* 예측 차트 */}
      <ForecastChart 
        data={forecast.predictions}
        scenarios={['conservative', 'normal', 'aggressive']}
        timeRange="12months"
      />
      
      {/* 고갈 예측 */}
      <ExhaustionPrediction 
        pools={forecast.pools}
        showTimeline={true}
      />
      
      {/* 확장 계획 */}
      <ExpansionPlanning 
        recommendations={forecast.expansionPlan}
        costEstimate={forecast.costEstimate}
      />
    </div>
  )
}
```

## 10. 커스텀 리포트 빌더

### 10.1 드래그 앤 드롭 빌더
```tsx
// app/reports/custom/page.tsx
export default function CustomReportBuilder() {
  const [components, setComponents] = useState([])
  const [layout, setLayout] = useState('grid')
  
  return (
    <div className="flex h-screen">
      {/* 컴포넌트 팔레트 */}
      <ComponentPalette className="w-64 border-r">
        <ComponentCategory title="차트">
          <DraggableComponent type="line-chart" />
          <DraggableComponent type="bar-chart" />
          <DraggableComponent type="pie-chart" />
          <DraggableComponent type="heatmap" />
        </ComponentCategory>
        
        <ComponentCategory title="메트릭">
          <DraggableComponent type="metric-card" />
          <DraggableComponent type="gauge" />
          <DraggableComponent type="progress" />
        </ComponentCategory>
        
        <ComponentCategory title="AI 분석">
          <DraggableComponent type="ai-insights" />
          <DraggableComponent type="predictions" />
          <DraggableComponent type="anomalies" />
        </ComponentCategory>
      </ComponentPalette>
      
      {/* 캔버스 영역 */}
      <ReportCanvas 
        components={components}
        layout={layout}
        onDrop={handleComponentDrop}
        onResize={handleComponentResize}
        onDelete={handleComponentDelete}
      />
      
      {/* 속성 패널 */}
      <PropertiesPanel 
        selectedComponent={selectedComponent}
        onUpdate={handlePropertyUpdate}
      />
    </div>
  )
}
```

## 11. 리포트 템플릿 관리

### 11.1 템플릿 갤러리
```tsx
// components/reports/templates/TemplateGallery.tsx
export function TemplateGallery() {
  const templates = useTemplates()
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map(template => (
        <TemplateCard
          key={template.id}
          template={template}
          onPreview={() => previewTemplate(template)}
          onUse={() => useTemplate(template)}
          onEdit={() => editTemplate(template)}
          onDelete={() => deleteTemplate(template)}
        />
      ))}
      
      {/* 새 템플릿 추가 */}
      <CreateTemplateCard />
    </div>
  )
}
```

## 12. 리포트 스케줄링

### 12.1 스케줄 설정 UI
```tsx
// components/reports/scheduling/ScheduleSettings.tsx
export function ScheduleSettings() {
  const [schedule, setSchedule] = useState({
    frequency: 'daily',
    time: '09:00',
    timezone: 'Asia/Seoul',
    recipients: [],
    format: 'pdf',
    includeAI: true
  })
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">리포트 발송 스케줄</h3>
      
      {/* 빈도 설정 */}
      <FrequencySelector 
        value={schedule.frequency}
        onChange={(f) => setSchedule({...schedule, frequency: f})}
      />
      
      {/* 시간 설정 */}
      <TimeSelector 
        value={schedule.time}
        timezone={schedule.timezone}
        onChange={(t) => setSchedule({...schedule, time: t})}
      />
      
      {/* 수신자 관리 */}
      <RecipientManager 
        recipients={schedule.recipients}
        onAdd={addRecipient}
        onRemove={removeRecipient}
      />
      
      {/* 포맷 선택 */}
      <FormatSelector 
        value={schedule.format}
        options={['pdf', 'html', 'excel', 'json']}
        onChange={(f) => setSchedule({...schedule, format: f})}
      />
      
      {/* AI 인사이트 포함 */}
      <AIInsightToggle 
        enabled={schedule.includeAI}
        onChange={(e) => setSchedule({...schedule, includeAI: e})}
      />
      
      {/* 미리보기 및 저장 */}
      <div className="flex justify-end gap-4 mt-6">
        <Button variant="outline" onClick={previewSchedule}>
          미리보기
        </Button>
        <Button onClick={saveSchedule}>
          스케줄 저장
        </Button>
      </div>
    </div>
  )
}
```

## 13. 리포트 미리보기 및 내보내기

### 13.1 미리보기 컴포넌트
```tsx
// components/reports/preview/ReportPreview.tsx
export function ReportPreview({ report }) {
  const [viewMode, setViewMode] = useState('desktop')
  const [zoom, setZoom] = useState(100)
  
  return (
    <div className="bg-gray-100 p-4">
      {/* 툴바 */}
      <PreviewToolbar 
        viewMode={viewMode}
        zoom={zoom}
        onViewModeChange={setViewMode}
        onZoomChange={setZoom}
      />
      
      {/* 미리보기 영역 */}
      <div className="bg-white shadow-lg mx-auto" 
           style={{ 
             maxWidth: viewMode === 'mobile' ? '375px' : '100%',
             transform: `scale(${zoom/100})`
           }}>
        <ReportRenderer report={report} />
      </div>
    </div>
  )
}
```

### 13.2 내보내기 기능
```tsx
// components/reports/export/ExportManager.tsx
export function ExportManager({ report }) {
  const [exporting, setExporting] = useState(false)
  const [format, setFormat] = useState('pdf')
  
  const handleExport = async () => {
    setExporting(true)
    
    try {
      switch(format) {
        case 'pdf':
          await exportToPDF(report)
          break
        case 'html':
          await exportToHTML(report)
          break
        case 'excel':
          await exportToExcel(report)
          break
        case 'json':
          await exportToJSON(report)
          break
      }
      
      toast.success(`리포트가 ${format} 형식으로 내보내졌습니다`)
    } catch (error) {
      toast.error('내보내기 실패: ' + error.message)
    } finally {
      setExporting(false)
    }
  }
  
  return (
    <div className="flex items-center gap-4">
      <Select value={format} onChange={setFormat}>
        <option value="pdf">PDF</option>
        <option value="html">HTML</option>
        <option value="excel">Excel</option>
        <option value="json">JSON</option>
      </Select>
      
      <Button 
        onClick={handleExport}
        disabled={exporting}
        loading={exporting}
      >
        <DownloadIcon className="mr-2" />
        내보내기
      </Button>
    </div>
  )
}
```

## 14. 이메일 발송 관리

### 14.1 이메일 프리뷰
```tsx
// components/reports/email/EmailPreview.tsx
export function EmailPreview({ report }) {
  const [recipients, setRecipients] = useState([])
  const [subject, setSubject] = useState(`Ceph 클러스터 ${report.type} 리포트`)
  const [message, setMessage] = useState('')
  
  return (
    <div className="space-y-6">
      {/* 수신자 입력 */}
      <RecipientsInput 
        value={recipients}
        onChange={setRecipients}
        suggestions={getSuggestedRecipients()}
      />
      
      {/* 제목 입력 */}
      <Input 
        label="제목"
        value={subject}
        onChange={setSubject}
      />
      
      {/* 메시지 입력 */}
      <Textarea 
        label="추가 메시지"
        value={message}
        onChange={setMessage}
        placeholder="리포트와 함께 전달할 메시지를 입력하세요"
      />
      
      {/* 이메일 미리보기 */}
      <EmailTemplate 
        subject={subject}
        message={message}
        report={report}
      />
      
      {/* 발송 버튼 */}
      <Button onClick={sendEmail} size="lg" className="w-full">
        <EmailIcon className="mr-2" />
        이메일 발송
      </Button>
    </div>
  )
}
```

## 15. 상태 관리 (Zustand)

### 15.1 리포트 스토어
```typescript
// stores/reportStore.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface ReportStore {
  // 상태
  currentReport: Report | null
  reports: Report[]
  templates: Template[]
  schedules: Schedule[]
  isGenerating: boolean
  
  // 액션
  generateReport: (type: ReportType, options: ReportOptions) => Promise<Report>
  saveTemplate: (template: Template) => Promise<void>
  scheduleReport: (schedule: Schedule) => Promise<void>
  exportReport: (report: Report, format: ExportFormat) => Promise<Blob>
  sendEmail: (report: Report, recipients: string[]) => Promise<void>
  
  // AI 기능
  generateAIInsights: (data: MetricData) => Promise<AIInsights>
  predictTrends: (historical: TimeSeriesData) => Promise<Predictions>
  detectAnomalies: (metrics: MetricData) => Promise<Anomalies>
}

export const useReportStore = create<ReportStore>()(
  subscribeWithSelector((set, get) => ({
    currentReport: null,
    reports: [],
    templates: [],
    schedules: [],
    isGenerating: false,
    
    generateReport: async (type, options) => {
      set({ isGenerating: true })
      
      try {
        // 데이터 수집
        const data = await fetchReportData(type, options)
        
        // AI 분석 실행
        const aiInsights = await get().generateAIInsights(data)
        
        // 리포트 생성
        const report = await createReport({
          type,
          data,
          aiInsights,
          options
        })
        
        set({ 
          currentReport: report,
          reports: [...get().reports, report]
        })
        
        return report
      } finally {
        set({ isGenerating: false })
      }
    },
    
    generateAIInsights: async (data) => {
      const response = await fetch('/api/v1/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({ data })
      })
      
      return response.json()
    },
    
    // ... 기타 액션 구현
  }))
)
```

## 16. API 연동

### 16.1 리포트 API 클라이언트
```typescript
// lib/api/reportApi.ts
export class ReportAPI {
  private baseURL = process.env.NEXT_PUBLIC_API_URL
  
  // 리포트 생성
  async generate(params: GenerateReportParams): Promise<Report> {
    const response = await fetch(`${this.baseURL}/api/v1/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
    
    return response.json()
  }
  
  // 템플릿 관리
  async getTemplates(): Promise<Template[]> {
    const response = await fetch(`${this.baseURL}/api/v1/reports/templates`)
    return response.json()
  }
  
  async saveTemplate(template: Template): Promise<void> {
    await fetch(`${this.baseURL}/api/v1/reports/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template)
    })
  }
  
  // 스케줄 관리
  async getSchedules(): Promise<Schedule[]> {
    const response = await fetch(`${this.baseURL}/api/v1/reports/schedules`)
    return response.json()
  }
  
  async createSchedule(schedule: Schedule): Promise<void> {
    await fetch(`${this.baseURL}/api/v1/reports/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule)
    })
  }
  
  // AI 분석
  async getAIInsights(reportId: string): Promise<AIInsights> {
    const response = await fetch(`${this.baseURL}/api/v1/reports/${reportId}/ai-insights`)
    return response.json()
  }
  
  // 내보내기
  async export(reportId: string, format: ExportFormat): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/api/v1/reports/${reportId}/export?format=${format}`)
    return response.blob()
  }
  
  // 이메일 발송
  async sendEmail(reportId: string, params: EmailParams): Promise<void> {
    await fetch(`${this.baseURL}/api/v1/reports/${reportId}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
  }
}

export const reportAPI = new ReportAPI()
```

## 17. WebSocket 실시간 업데이트

### 17.1 실시간 리포트 업데이트
```typescript
// hooks/useRealtimeReports.ts
import { useEffect } from 'react'
import { useReportStore } from '@/stores/reportStore'
import { stompClient } from '@/lib/websocket'

export function useRealtimeReports() {
  const updateReport = useReportStore(state => state.updateReport)
  
  useEffect(() => {
    // 실시간 메트릭 구독
    const metricsSubscription = stompClient.subscribe('/topic/metrics', (message) => {
      const metrics = JSON.parse(message.body)
      updateReport({ metrics })
    })
    
    // AI 인사이트 업데이트 구독
    const aiSubscription = stompClient.subscribe('/topic/ai-insights', (message) => {
      const insights = JSON.parse(message.body)
      updateReport({ aiInsights: insights })
    })
    
    // 알람 업데이트 구독
    const alarmSubscription = stompClient.subscribe('/topic/alarms', (message) => {
      const alarm = JSON.parse(message.body)
      updateReport({ newAlarm: alarm })
    })
    
    return () => {
      metricsSubscription.unsubscribe()
      aiSubscription.unsubscribe()
      alarmSubscription.unsubscribe()
    }
  }, [updateReport])
}
```

## 18. 성능 최적화

### 18.1 서버 컴포넌트 최적화
```tsx
// app/reports/page.tsx
import { Suspense } from 'react'

// 서버 컴포넌트로 초기 데이터 로드
export default async function ReportsPage() {
  // 병렬 데이터 fetching
  const [reports, templates, schedules] = await Promise.all([
    fetchRecentReports(),
    fetchTemplates(),
    fetchScheduledReports()
  ])
  
  return (
    <div>
      {/* 정적 컨텐츠는 즉시 렌더링 */}
      <ReportHeader />
      
      {/* 동적 컨텐츠는 Suspense로 감싸기 */}
      <Suspense fallback={<ReportsSkeleton />}>
        <ReportsContent 
          initialReports={reports}
          templates={templates}
          schedules={schedules}
        />
      </Suspense>
    </div>
  )
}
```

### 18.2 차트 최적화 (ECharts SSR)
```typescript
// lib/charts/serverChart.ts
import 'server-only'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { SVGRenderer } from 'echarts/renderers'

echarts.use([LineChart, SVGRenderer])

export async function renderChartToSVG(option: ECOption): Promise<string> {
  const chart = echarts.init(null, null, { 
    renderer: 'svg', 
    ssr: true,
    width: 600,
    height: 400
  })
  
  chart.setOption(option)
  const svg = chart.renderToSVGString()
  chart.dispose()
  
  return svg
}
```

## 19. 테스트 전략

### 19.1 컴포넌트 테스트
```typescript
// __tests__/reports/DailyReport.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DailyReportPage } from '@/app/reports/daily/page'

describe('DailyReport', () => {
  it('should generate daily report with AI insights', async () => {
    render(<DailyReportPage />)
    
    // AI 인사이트 토글 활성화
    const aiToggle = screen.getByLabelText('AI 인사이트 포함')
    await userEvent.click(aiToggle)
    
    // 리포트 생성 버튼 클릭
    const generateButton = screen.getByText('리포트 생성')
    await userEvent.click(generateButton)
    
    // AI 분석 결과 표시 확인
    await waitFor(() => {
      expect(screen.getByText(/AI 분석 완료/)).toBeInTheDocument()
    })
  })
})
```

## 20. 배포 및 빌드 설정

### 20.1 Next.js 빌드 설정
```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
    serverActions: true
  },
  
  images: {
    formats: ['image/avif', 'image/webp']
  },
  
  async headers() {
    return [
      {
        source: '/api/reports/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, max-age=3600'
          }
        ]
      }
    ]
  }
}
```

## 21. 모바일 반응형 디자인

### 21.1 반응형 리포트 레이아웃
```tsx
// components/reports/ResponsiveLayout.tsx
export function ResponsiveReportLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 모바일 헤더 */}
      <div className="lg:hidden">
        <MobileHeader />
      </div>
      
      {/* 데스크톱 사이드바 */}
      <div className="hidden lg:flex">
        <ReportSidebar />
      </div>
      
      {/* 메인 컨텐츠 */}
      <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto">
        {children}
      </main>
      
      {/* 모바일 하단 네비게이션 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0">
        <MobileBottomNav />
      </div>
    </div>
  )
}
```

## 결론

이 프론트엔드 개발 가이드는 Ceph 클러스터 AI 대시보드의 리포팅 기능을 구현하기 위한 상세한 설계를 포함하고 있습니다. Next.js 15의 최신 기능을 활용하여 서버 컴포넌트, 스트리밍, 캐싱 등을 통해 최적화된 성능을 제공하며, AI 기반 분석과 예측 기능을 통합하여 스마트한 리포팅 시스템을 구현합니다.
