알겠습니다. 요청하신 수정사항을 반영하여 두 개의 PRD를 다시 작성하겠습니다.

## PRD 1: anomaly-predictor-view-prd.md

# Anomaly Predictor View - Product Requirements Document

# Project Overview

## 프로젝트 목표
Ceph 클러스터의 AI 기반 장애 예측 및 운영 최적화를 위한 직관적인 웹 대시보드 제공

## 제공 서비스
- 실시간 클러스터 모니터링 대시보드
- AI 기반 장애 예측 및 위험 분석
- PG 최적화 및 설정 관리
- 로그 분석 기반 트러블슈팅 가이드
- 자동화된 운영 리포트 생성

## 주요 특징
- Vue 3.4.27 + Tailwind CSS 기반 반응형 UI
- Light/Dark 테마 전환 지원
- 실시간 데이터 업데이트 (WebSocket STOMP)
- 모바일 최적화 인터페이스
- ECharts 기반 인터랙티브 시각화

# Core Functionality

## 1. 현황 대시보드 (메인 화면)

### 1.1 레이아웃 구성
- **상단 헤더**: 로고, 테마 전환 버튼, 사용자 정보
- **Mega Menu 네비게이션**: 각 메뉴에 대한 간단한 설명과 함께 표시
  - 현황 대시보드: "클러스터 실시간 상태 모니터링"
  - 장애 예측: "AI 기반 장애 예측 및 위험 분석"
  - 설정 최적화: "PG 최적화 및 구성 관리"
  - 트러블슈팅: "로그 분석 및 문제 해결 가이드"
  - 운영문서: "자동 리포트 생성 및 관리"

### 1.2 클러스터 상태 카드
- **Health Status 표시**
  - HEALTH_OK: 녹색 체크 아이콘
  - HEALTH_WARN: 노란색 경고 아이콘
  - HEALTH_ERR: 빨간색 에러 아이콘
- **OSD 상태 요약**: Up/Down/In/Out 개수
- **MON/MGR/MDS 상태**: 활성/비활성 개수
- **클러스터 버전 정보**

### 1.3 용량 현황 카드
- **전체 용량 게이지**: 사용량/전체 용량 표시
- **Pool별 사용률**: 도넛 차트로 각 Pool의 사용 비율 표시
- **증가 추세**: 최근 7일 용량 변화 스파크라인

### 1.4 실시간 메트릭 차트 (ECharts)

#### Pool 사용량 차트
- **차트 타입**: Stacked Area Chart
- **데이터**: 각 Pool별 사용량 시계열 데이터
- **표시 정보**: Pool 이름, 사용량(GB), 사용률(%)
- **업데이트 주기**: 30초

#### IOPS 메트릭 차트
- **차트 타입**: Line Chart (Read/Write 구분)
- **데이터**: 읽기/쓰기 IOPS 시계열 데이터
- **표시 정보**: 
  - Read IOPS (파란색 라인)
  - Write IOPS (녹색 라인)
  - 평균값 표시 라인
- **업데이트 주기**: 5초

#### Latency 모니터 차트
- **차트 타입**: Multi-axis Line Chart
- **데이터**: 
  - Commit Latency (ms)
  - Apply Latency (ms)
  - Read Latency (ms)
- **표시 정보**: 최소/최대/평균 레이턴시
- **업데이트 주기**: 5초

#### Scrub 오류 차트
- **차트 타입**: Bar Chart
- **데이터**: OSD별 Scrub/Deep-scrub 오류 개수
- **표시 정보**: 
  - Scrub 오류 (주황색)
  - Deep-scrub 오류 (빨간색)
  - 마지막 Scrub 시간
- **업데이트 주기**: 60초

#### PG 불일치 차트
- **차트 타입**: Gauge Chart + Table
- **데이터**: 
  - Active+Clean PG 비율 (게이지)
  - Degraded PG 수
  - Undersized PG 수
  - Inconsistent PG 수
- **표시 정보**: PG 상태별 개수 및 비율
- **업데이트 주기**: 30초

#### 네트워크 오류 차트
- **차트 타입**: Heatmap
- **데이터**: 노드 간 네트워크 오류율
- **표시 정보**: 
  - 패킷 손실률 (%)
  - 재전송 횟수
  - 대역폭 사용률
- **업데이트 주기**: 10초

#### OSD 성능 분포 차트
- **차트 타입**: Scatter Plot
- **데이터**: OSD별 IOPS vs Latency
- **표시 정보**: 
  - X축: IOPS
  - Y축: Latency
  - 버블 크기: 사용률
- **업데이트 주기**: 30초

#### 클러스터 처리량 차트
- **차트 타입**: Area Chart
- **데이터**: Read/Write 처리량 (MB/s)
- **표시 정보**: 
  - Read Throughput
  - Write Throughput
  - 피크 시간 하이라이트
- **업데이트 주기**: 5초

### 1.5 AI 예측 위험 요소 패널
- **위험도별 정렬**: Critical → High → Medium → Low
- **카드 구성**:
  - 위험 유형 아이콘
  - 위험도 배지 (색상 구분)
  - 예상 발생 시간
  - 영향 범위
  - "상세보기" 버튼

### 1.6 3D 클러스터 토폴로지 시각화 (Space Station Dashboard)
- **우주 공간 테마**: 별 배경의 3D 환경에서 Ceph 클러스터를 시각화
- **계층 구조 표현**:
  - **Pool 노드**: 지구 텍스처와 대기권 효과를 적용한 구형 노드 (y=30 레벨)
  - **PG 노드**: 십이면체 형태의 메탈릭 노드들 (y=-20 레벨)
  - **OSD 노드**: 호스트별로 그룹화된 실린더형 노드들 (y=-60 레벨)
  - **Host 노드**: OSD들을 포함하는 원형 플랫폼

- **인터랙션 기능**:
  - **검색 시스템**: 좌상단 패널에서 Pool/PG/OSD/Host 검색 가능
  - **풀스크린 모드**: 헤더 숨김/표시 토글
  - **패널 제어**: Ctrl+클릭으로 4개 패널 동시 토글
  - **노드 선택**: 클릭으로 상세 정보 표시

- **우주선 대시보드 UI**: 4개의 사이버펑크 스타일 패널
  - **상단 중앙**: Cluster Command Center (시스템 상태, 용량, 스위치)
  - **좌측 하단**: AI Threat Analysis (예측 분석, 성능 매트릭)
  - **중앙 하단**: Quick Status (지연시간, 처리량, 알림)
  - **우측 하단**: Performance Matrix (실시간 메트릭)

### 1.7 알림 센터
- **실시간 알림 리스트**: 최근 10개 알림
- **알림 레벨 아이콘**: Error/Warning/Info
- **타임스탬프**: 상대 시간 표시 (예: "5분 전")
- **Quick Action**: 알림별 빠른 조치 버튼

## 2. 장애 예측

### 2.1 예측 카테고리 그리드
- **12개 예측 카드를 그리드로 표시**
- **각 카드 구성**:
  - 카테고리 아이콘 및 이름
  - 위험도 게이지 (0-100%)
  - 현재 상태 요약
  - 예측 신뢰도
  - "분석 상세" 버튼

### 2.2 예측 상세 모달
- **시계열 예측 차트**: 24시간/7일/30일 전환
- **위험 요인 분석**: 주요 지표와 임계값
- **AI 분석 결과**: 텍스트 기반 설명
- **권장 조치사항**: 단계별 가이드
- **영향 범위**: 영향받는 컴포넌트 리스트

### 2.3 종합 위험도 대시보드
- **Overall Risk Score**: 반원 게이지 차트
- **Top 5 위험 요소**: 우선순위별 리스트
- **Risk Heatmap**: 시간대별 위험도 히트맵
- **Mitigation Plan**: AI 생성 완화 계획

## 3. 설정 최적화

### 3.1 PG 계산기
- **입력 필드**:
  - OSD 수 (number input)
  - 복제 수 (number input)
  - Pool 타입 (dropdown: Replicated/Erasure)
  - Target PGs per OSD (슬라이더)
- **실시간 계산 결과**:
  - 권장 PG 수
  - 최대 PG 수
  - PG per OSD 비율
  - 계산 근거 설명

### 3.2 Pool별 PG 분포
- **Treemap 차트**: Pool 크기와 PG 수 시각화
- **색상 코딩**: 
  - 녹색: 적정
  - 노란색: 경고
  - 빨간색: 재조정 필요
- **호버 정보**: Pool 상세 정보 툴팁

### 3.3 Host별 PG 분포
- **히트맵 차트**: Host x Pool 매트릭스
- **불균형 지표**: CRUSH weight 대비 실제 PG 수
- **리밸런싱 시뮬레이션**:
  - 변경 전/후 비교
  - 예상 데이터 이동량
  - 예상 소요 시간

### 3.4 PG 상태 모니터
- **상태별 PG 수 파이 차트**
- **문제 PG 리스트 테이블**:
  - PG ID
  - 현재 상태
  - Acting/Up Set
  - 마지막 변경 시간
  - 조치 버튼

## 4. 트러블슈팅 가이드

### 4.1 로그 분석 인터페이스
- **필터 섹션**:
  - 날짜/시간 범위 선택
  - 로그 소스 체크박스 (OSD/MON/MGR/MDS)
  - 심각도 필터 (ERROR/WARNING/INFO)
  - 키워드 검색
- **AI 분석 버튼**: 선택된 로그 AI 분석 시작

### 4.2 RCA 결과 표시
- **근본 원인 카드**:
  - 원인 요약
  - 신뢰도 표시 (%)
  - 관련 증거 리스트
- **이벤트 타임라인**: 
  - 시간순 이벤트 플로우
  - 인과관계 화살표
  - 중요 이벤트 하이라이트
- **해결 단계**:
  - 번호가 매겨진 단계별 가이드
  - 각 단계별 명령어
  - 예상 결과
  - 주의사항

### 4.3 알람 관리 대시보드
- **칸반 보드 UI**:
  - 긴급 레인 (빨간색)
  - 중요 레인 (주황색)
  - 일반 레인 (노란색)
  - 정보 레인 (파란색)
- **알람 카드**:
  - 알람 제목 및 설명
  - 발생 시간
  - 영향 컴포넌트
  - 그룹 ID (관련 알람 그룹)
  - 대응 가이드 링크

### 4.4 알람 상관관계 분석
- **네트워크 그래프**: 
  - 노드: 개별 알람
  - 엣지: 상관관계 (두께로 강도 표현)
  - 색상: 알람 심각도
- **Root Cause 하이라이트**: 근본 원인 노드 강조
- **클러스터링**: 관련 알람 자동 그룹화

## 5. 운영문서 자동 생성

### 5.1 변경작업 영향도 평가
- **변경 유형 선택**: 
  - OSD 추가/제거
  - Pool 설정 변경
  - CRUSH map 수정
  - 기타
- **영향도 분석 결과**:
  - 영향받는 컴포넌트 리스트
  - 성능 영향 예측 차트
  - 리밸런싱 예상 시간
  - 위험도 평가
  - 롤백 계획

### 5.2 인사이트 리포트
- **리포트 유형 선택**:
  - 일일 리포트
  - 주간 리포트
  - 월간 리포트
  - 커스텀 기간
- **리포트 섹션**:
  - Executive Summary
  - 성능 트렌드 차트
  - 주요 이벤트 요약
  - 용량 예측
  - AI 인사이트
  - 권장 조치사항

### 5.3 리포트 스케줄링
- **스케줄 설정**:
  - 실행 주기 (일간/주간/월간)
  - 실행 시간
  - 수신자 이메일 리스트
  - 포맷 선택 (PDF/HTML)
- **템플릿 관리**:
  - 사전 정의 템플릿 선택
  - 커스텀 템플릿 생성
  - 섹션 활성화/비활성화

### 5.4 리포트 히스토리
- **생성된 리포트 테이블**:
  - 리포트 ID
  - 생성 일시
  - 유형
  - 생성자
  - 다운로드 링크
  - 재생성 버튼

## 6. REST API Endpoints

### 클러스터 상태 API
```
GET /api/cluster/status - 클러스터 전체 상태
GET /api/cluster/metrics - 실시간 메트릭
GET /api/cluster/capacity - 용량 정보
GET /api/cluster/pools - Pool 목록 및 상태
GET /api/cluster/osds - OSD 목록 및 상태
GET /api/cluster/pgs - PG 상태 정보
GET /api/cluster/performance - 성능 메트릭
GET /api/cluster/network - 네트워크 상태
```

### 장애 예측 API
```
GET /api/prediction/osd-failure - OSD 장애 예측
GET /api/prediction/capacity-exhaustion - 용량 고갈 예측
GET /api/prediction/performance-degradation - 성능 저하 예측
GET /api/prediction/pg-imbalance - PG 불균형 예측
GET /api/prediction/network-bottleneck - 네트워크 병목 예측
GET /api/prediction/memory-shortage - 메모리 부족 예측
GET /api/prediction/rebalancing-needed - 리밸런싱 필요 예측
GET /api/prediction/hotspot-osd - 핫스팟 OSD 예측
GET /api/prediction/cluster-expansion - 클러스터 확장 예측
GET /api/prediction/smart-disk-failure - SMART 디스크 장애 예측
GET /api/prediction/metric-disk-failure - 메트릭 기반 디스크 장애 예측
GET /api/prediction/comprehensive - 종합 장애 예측
```

### RAG 조치 가이드 API
```
POST /api/rag/ask - 지능형 질의응답
GET /api/rag/search?query={query}&version={version} - 문서 검색
GET /api/rag/suggestions?component={component}&status={status} - 실시간 조치 제안
```

### ML 이상감지 API
```
GET /api/ml/anomaly/realtime - 실시간 이상감지
POST /api/ml/predict - ML 기반 예측
GET /api/ml/anomaly/history?hours={n} - 이상감지 이력
GET /api/ml/model/performance - ML 모델 성능 지표
```

### 최적화 API
```
GET /api/optimization/pg/recommendation?osdCount={n}&replicaSize={n}&poolType={type} - PG 수 추천
GET /api/optimization/pg/distribution - PG 분포 분석
POST /api/optimization/pg/rebalance-simulation - 리밸런싱 시뮬레이션
GET /api/optimization/pg/status - PG 상태 상세
GET /api/optimization/configuration/suggestions - 설정 최적화 제안
```

### 트러블슈팅 API
```
POST /api/troubleshooting/analyze-logs - 로그 분석 및 RCA
GET /api/troubleshooting/alarms/classify?timeRange={range} - 알람 분류
GET /api/troubleshooting/alarms/correlation?timeRange={range} - 알람 상관관계
POST /api/troubleshooting/generate-guide - 대응 가이드 생성
GET /api/troubleshooting/recent-logs?source={source}&severity={level} - 최근 로그 조회
```

### 리포트 API
```
POST /api/reports/generate - 리포트 생성
GET /api/reports/templates - 템플릿 목록
POST /api/reports/schedule - 스케줄 설정
POST /api/reports/send-email - 이메일 발송
GET /api/reports/history?days={n} - 리포트 히스토리
GET /api/reports/download/{reportId} - 리포트 다운로드
DELETE /api/reports/{reportId} - 리포트 삭제
```

### WebSocket Endpoints
```
ws://localhost:8080/ws - WebSocket 연결
/topic/metrics - 메트릭 구독 (이상감지 점수 포함)
/topic/alarms - 알람 구독 (RAG 조치제안 포함)
/topic/predictions - 예측 업데이트 구독 (ML 알고리즘 정보 포함)
/topic/rag-guidance - RAG 기반 조치 가이드 업데이트
/queue/critical-alarms - 개인 큐 (중요 알람)
```

# Doc

## 필수 라이브러리

### Core Dependencies
```json
{
  "dependencies": {
    "vue": "^3.4.27",
    "vue-router": "^4.2.5",
    "pinia": "^2.1.7",
    "axios": "^1.6.2",
    "@stomp/stompjs": "^7.0.0",
    "echarts": "^5.4.3",
    "vue-echarts": "^6.6.1",
    "dayjs": "^1.11.10",
    "@element-plus/icons-vue": "^2.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.5.0",
    "tailwindcss": "^3.3.6",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "vite": "^5.0.0"
  }
}
```

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#3B82F6',
          dark: '#60A5FA'
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#06B6D4'
      }
    }
  }
}
```

### useTheme Composable
```javascript
// composables/useTheme.js
import { ref, watchEffect } from 'vue'

export function useTheme() {
  const isDark = ref(localStorage.getItem('theme') === 'dark')
  
  const toggleTheme = () => {
    isDark.value = !isDark.value
  }
  
  watchEffect(() => {
    const root = document.documentElement
    if (isDark.value) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  })
  
  return { isDark, toggleTheme }
}
```

### ECharts 설정 예시
```javascript
// Pool 사용량 차트 설정
const poolUsageOption = {
  title: { text: 'Pool 사용량' },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' }
  },
  legend: { data: poolNames },
  xAxis: {
    type: 'time',
    boundaryGap: false
  },
  yAxis: {
    type: 'value',
    axisLabel: { formatter: '{value} GB' }
  },
  series: poolNames.map(name => ({
    name,
    type: 'line',
    stack: 'Total',
    areaStyle: {},
    emphasis: { focus: 'series' },
    data: poolData[name]
  }))
}

// IOPS 차트 설정
const iopsOption = {
  title: { text: 'IOPS 메트릭' },
  tooltip: { trigger: 'axis' },
  legend: { data: ['Read IOPS', 'Write IOPS'] },
  xAxis: { type: 'time' },
  yAxis: { 
    type: 'value',
    axisLabel: { formatter: '{value} ops/s' }
  },
  series: [
    {
      name: 'Read IOPS',
      type: 'line',
      smooth: true,
      itemStyle: { color: '#3B82F6' },
      data: readIopsData
    },
    {
      name: 'Write IOPS',
      type: 'line',
      smooth: true,
      itemStyle: { color: '#10B981' },
      data: writeIopsData
    }
  ]
}
```

### WebSocket STOMP 연결
```javascript
// composables/useWebSocket.js
import { Client } from '@stomp/stompjs'

export function useWebSocket() {
  const client = new Client({
    brokerURL: 'ws://localhost:8080/ws',
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: (frame) => {
      // 메트릭 구독
      client.subscribe('/topic/metrics', (message) => {
        const data = JSON.parse(message.body)
        updateMetrics(data)
      })
      
      // 알람 구독
      client.subscribe('/topic/alarms', (message) => {
        const alarm = JSON.parse(message.body)
        handleAlarm(alarm)
      })
    },
    onStompError: (frame) => {
      console.error('STOMP error:', frame)
    }
  })
  
  client.activate()
  
  return { client }
}
```

### API 요청 인터셉터
```javascript
// services/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  timeout: 30000
})

api.interceptors.request.use(
  config => {
    // 로딩 상태 시작
    return config
  },
  error => Promise.reject(error)
)

api.interceptors.response.use(
  response => response.data,
  error => {
    // 에러 처리
    if (error.response?.status === 503) {
      console.error('서비스 일시적 장애')
    }
    return Promise.reject(error)
  }
)

export default api
```

### 모바일 반응형 처리
```vue
<!-- 반응형 그리드 예시 -->
<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <div v-for="item in items" :key="item.id" 
         class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <!-- 카드 내용 -->
    </div>
  </div>
</template>

<style>
/* 모바일 최적화 스타일 */
@media (max-width: 640px) {
  .chart-container {
    height: 300px;
  }
  
  .mega-menu {
    position: fixed;
    bottom: 0;
    width: 100%;
  }
}
</style>
```

# File Structure

```
anomaly-predictor-view/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── main.js                    # Vue 앱 진입점
│   ├── App.vue                     # 루트 컴포넌트
│   ├── router/
│   │   └── index.js                # Vue Router 설정
│   ├── stores/
│   │   ├── cluster.js              # 클러스터 상태 스토어
│   │   ├── prediction.js           # 장애 예측 스토어
│   │   ├── optimization.js         # 최적화 설정 스토어
│   │   ├── troubleshooting.js      # 트러블슈팅 스토어
│   │   ├── reports.js              # 리포트 스토어
│   │   └── websocket.js            # WebSocket 연결 스토어
│   ├── views/
│   │   ├── DashboardView.vue       # 메인 대시보드
│   │   ├── PredictionView.vue      # 장애 예측 페이지
│   │   ├── OptimizationView.vue    # 설정 최적화 페이지
│   │   ├── TroubleshootingView.vue # 트러블슈팅 페이지
│   │   └── ReportsView.vue         # 운영문서 페이지
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppHeader.vue       # 헤더 컴포넌트
│   │   │   ├── MegaMenu.vue        # Mega Menu 네비게이션
│   │   │   ├── ThemeToggle.vue     # 테마 전환 버튼
│   │   │   └── UserProfile.vue     # 사용자 정보
│   │   ├── dashboard/
│   │   │   ├── ClusterStatus.vue   # 클러스터 상태 카드
│   │   │   ├── CapacityStatus.vue  # 용량 현황 카드
│   │   │   ├── AlertCenter.vue     # 알림 센터
│   │   │   ├── RiskPanel.vue       # AI 예측 위험 요소 패널
│   │   │   └── charts/
│   │   │       ├── PoolUsageChart.vue      # Pool 사용량 차트
│   │   │       ├── IopsChart.vue           # IOPS 메트릭 차트
│   │   │       ├── LatencyChart.vue        # Latency 모니터 차트
│   │   │       ├── ScrubErrorChart.vue     # Scrub 오류 차트
│   │   │       ├── PgInconsistencyChart.vue # PG 불일치 차트
│   │   │       ├── NetworkErrorChart.vue    # 네트워크 오류 차트
│   │   │       ├── OsdPerformanceChart.vue  # OSD 성능 분포 차트
│   │   │       └── ThroughputChart.vue      # 클러스터 처리량 차트
│   │   ├── prediction/
│   │   │   ├── PredictionGrid.vue          # 예측 카테고리 그리드
│   │   │   ├── PredictionCard.vue          # 개별 예측 카드
│   │   │   ├── PredictionModal.vue         # 예측 상세 모달
│   │   │   ├── RiskDashboard.vue           # 종합 위험도 대시보드
│   │   │   ├── RiskGauge.vue               # 위험도 게이지
│   │   │   └── MitigationPlan.vue          # AI 완화 계획
│   │   ├── optimization/
│   │   │   ├── PgCalculator.vue            # PG 계산기
│   │   │   ├── PgDistribution.vue          # Pool별 PG 분포
│   │   │   ├── HostPgHeatmap.vue           # Host별 PG 히트맵
│   │   │   ├── PgStatusMonitor.vue         # PG 상태 모니터
│   │   │   └── RebalanceSimulation.vue     # 리밸런싱 시뮬레이션
│   │   ├── troubleshooting/
│   │   │   ├── LogAnalyzer.vue             # 로그 분석 인터페이스
│   │   │   ├── LogFilter.vue               # 로그 필터 컴포넌트
│   │   │   ├── RcaResult.vue               # RCA 결과 표시
│   │   │   ├── EventTimeline.vue           # 이벤트 타임라인
│   │   │   ├── AlarmKanban.vue             # 알람 칸반 보드
│   │   │   └── AlarmCorrelation.vue        # 알람 상관관계 그래프
│   │   ├── reports/
│   │   │   ├── ImpactAssessment.vue        # 변경작업 영향도 평가
│   │   │   ├── InsightReport.vue           # 인사이트 리포트
│   │   │   ├── ReportScheduler.vue         # 리포트 스케줄러
│   │   │   ├── ReportHistory.vue           # 리포트 히스토리
│   │   │   └── ReportTemplate.vue          # 리포트 템플릿 관리
│   │   └── common/
│   │       ├── LoadingSpinner.vue          # 로딩 스피너
│   │       ├── ErrorMessage.vue            # 에러 메시지
│   │       ├── ConfirmDialog.vue           # 확인 다이얼로그
│   │       ├── DataTable.vue               # 데이터 테이블
│   │       └── Card.vue                    # 기본 카드 컴포넌트
│   ├── composables/
│   │   ├── useTheme.js              # 테마 관리
│   │   ├── useWebSocket.js          # WebSocket 연결
│   │   ├── useChart.js              # ECharts 공통 설정
│   │   ├── useNotification.js       # 알림 처리
│   │   ├── useApi.js                # API 호출 헬퍼
│   │   └── useResponsive.js         # 반응형 처리
│   ├── services/
│   │   ├── api.js                   # Axios 인스턴스
│   │   ├── cluster.service.js       # 클러스터 API
│   │   ├── prediction.service.js    # 예측 API
│   │   ├── optimization.service.js  # 최적화 API
│   │   ├── troubleshooting.service.js # 트러블슈팅 API
│   │   ├── reports.service.js       # 리포트 API
│   │   └── websocket.service.js     # WebSocket 서비스
│   ├── utils/
│   │   ├── constants.js             # 상수 정의
│   │   ├── formatters.js            # 데이터 포맷터
│   │   ├── validators.js            # 입력 검증
│   │   ├── chartOptions.js          # 차트 옵션 헬퍼
│   │   └── dateUtils.js             # 날짜 유틸리티
│   ├── assets/
│   │   ├── styles/
│   │   │   ├── main.css            # 메인 스타일
│   │   │   ├── tailwind.css        # Tailwind 진입점
│   │   │   └── variables.css       # CSS 변수
│   │   └── images/
│   │       ├── logo.svg            # 로고
│   │       └── icons/              # 아이콘 파일들
│   └── locales/
│       ├── ko.json                  # 한국어 번역
│       └── en.json                  # 영어 번역
├── tests/
│   ├── unit/
│   │   ├── components/             # 컴포넌트 테스트
│   │   ├── composables/            # Composable 테스트
│   │   └── services/               # 서비스 테스트
│   └── e2e/
│       └── specs/                   # E2E 테스트
├── .env.example                     # 환경변수 예시
├── .gitignore
├── package.json
├── vite.config.js                   # Vite 설정
├── tailwind.config.js               # Tailwind 설정
├── postcss.config.js                # PostCSS 설정
├── jsconfig.json                    # JS 설정
└── README.md                        # 프로젝트 문서
```

## 디렉토리 설명

### `/src/views/`
- 각 주요 기능별 페이지 컴포넌트
- 라우터와 직접 연결되는 최상위 뷰 컴포넌트

### `/src/components/`
- **layout/**: 레이아웃 관련 컴포넌트 (헤더, 메뉴, 테마)
- **dashboard/**: 대시보드 페이지 전용 컴포넌트
- **prediction/**: 장애 예측 페이지 컴포넌트
- **optimization/**: 설정 최적화 페이지 컴포넌트
- **troubleshooting/**: 트러블슈팅 페이지 컴포넌트
- **reports/**: 운영문서 페이지 컴포넌트
- **common/**: 공통으로 사용되는 재사용 컴포넌트

### `/src/stores/`
- Pinia 스토어 파일들
- 각 도메인별 상태 관리

### `/src/composables/`
- Vue 3 Composition API 재사용 로직
- 공통 기능을 추상화한 컴포저블

### `/src/services/`
- API 통신 레이어
- 백엔드와의 통신을 담당하는 서비스 모듈

### `/src/utils/`
- 유틸리티 함수들
- 포맷팅, 검증, 날짜 처리 등 헬퍼 함수

# 프로젝트 진행 상황 체크리스트

## Phase 1: 프로젝트 초기 설정
- [x] Vue 3 프로젝트 생성 및 설정
- [x] Tailwind CSS v3.4.17 with 'ceph-' prefix 설정
- [x] Pinia store 구조 설계
- [x] 라우터 설정 및 페이지 구조 정의
- [x] WebSocket STOMP 연결 설정
- [x] 개발 환경 변수 설정 (.env.development)

## Phase 2: 기본 레이아웃 및 공통 컴포넌트
- [x] AppHeader.vue 구현
- [x] MegaMenu.vue 네비게이션 구현
- [x] ThemeToggle.vue 다크/라이트 모드
- [x] 공통 컴포넌트 라이브러리 구축
  - [x] Card.vue
  - [x] Button.vue
  - [x] LoadingSpinner.vue
  - [x] ErrorMessage.vue
  - [x] DataTable.vue
  - [x] ConfirmDialog.vue

## Phase 3: 대시보드 핵심 기능
- [x] ClusterStatus.vue 구현
- [x] CapacityStatus.vue 구현
- [x] RiskPanel.vue (AI 예측 위험 요소 패널) 구현
- [x] AlertCenter.vue 구현
- [x] 8개 실시간 차트 컴포넌트 구현
  - [x] PoolUsageChart.vue
  - [x] IopsChart.vue
  - [x] LatencyChart.vue
  - [x] ScrubErrorChart.vue
  - [x] PgInconsistencyChart.vue
  - [x] NetworkErrorChart.vue
  - [x] OsdPerformanceChart.vue
  - [x] ThroughputChart.vue
- [x] 메인 대시보드 레이아웃 통합
- [x] ECharts 기반 차트 시스템 구축

## Phase 3.5: 3D 토폴로지 시각화 (완료)
- [x] Three.js 기반 3D 렌더링 시스템 구축
- [x] 우주 공간 테마 환경 구성 (별 배경, 조명 시스템)
- [x] 4계층 노드 시각화 구현
  - [x] Pool 노드: 지구 텍스처, 대기권 효과, 상태 기반 링 표시
  - [x] PG 노드: DodecahedronGeometry 기반 메탈릭 노드
  - [x] OSD 노드: 호스트별 그룹화, 상태 기반 색상
  - [x] Host 노드: 원형 플랫폼 (바닥면만 표시)
- [x] 인터랙션 시스템
  - [x] 검색 패널: Pool/PG/OSD/Host 타입별 검색 및 펄스 효과
  - [x] 풀스크린 모드: 헤더 토글, 캔버스 크기 자동 조정
  - [x] 패널 제어: Ctrl+클릭으로 4개 패널 동시 토글
  - [x] 노드 선택: 클릭으로 정보 패널 표시
- [x] 우주선 대시보드 UI (4개 패널)
  - [x] 상단 중앙: Cluster Command Center
  - [x] 좌측 하단: AI Threat Analysis  
  - [x] 중앙 하단: Quick Status
  - [x] 우측 하단: Performance Matrix
- [x] 애니메이션 및 시각 효과
  - [x] 자동 회전, 노드 회전, 펄스 애니메이션
  - [x] 상태 기반 링, 대기권 효과, 그림자 렌더링
  - [x] 페이지 전환 애니메이션 (slide-search, slide-top, slide-left 등)

## Phase 4: Backend API 및 WebSocket 연동
- [x] Backend API 서버 구현 (Spring Boot 3.5.4, Java 21)
- [x] H2 in-memory database 설정 (개발 환경)
- [x] REST API endpoints 구현
  - [x] /api/v1/cluster/status - 클러스터 상태
  - [x] /api/v1/metrics/* - 메트릭 엔드포인트들
  - [x] /api/v1/osds/* - OSD 관련 API
- [x] WebSocket STOMP 서버 설정
- [x] Virtual Thread 기반 비동기 처리 구현
- [x] 프론트엔드 API 서비스 연동
- [x] 실시간 데이터 업데이트 테스트

## Phase 5: AI/ML 기능 구현 (진행 예정)
- [ ] 장애 예측 UI 구현
  - [ ] PredictionGrid.vue
  - [ ] PredictionCard.vue
  - [ ] PredictionModal.vue
  - [ ] RiskDashboard.vue
- [ ] ML 이상감지 대시보드
  - [ ] AnomalyScoreGauge.vue
  - [ ] AnomalyHeatmap.vue
  - [ ] AnomalyAlert.vue
  - [ ] ModelPerformanceMetrics.vue
- [ ] ML API 서비스 연동
- [ ] 12개 예측 카테고리 구현

## Phase 6: RAG 기반 조치 가이드 (진행 예정)
- [ ] RAG 검색 인터페이스 구현
- [ ] AI 응답 표시 컴포넌트
- [ ] 컨텍스트 기반 제안 UI
- [ ] 명령어 자동 생성 뷰어
- [x] RAG API 서비스 연동 (ceph-doc-crawler 통합)
- [x] sentence-transformers 임베딩 모델 적용

## Phase 7: Ceph Squid 특화 기능 (진행 예정)
- [ ] NVMe/RoCE 모니터링 대시보드
- [ ] BlueStore 메트릭 시각화
- [ ] QoS 정책 관리 UI
- [ ] Stretch Cluster 상태 뷰
- [ ] Crimson OSD 모니터링

## Phase 8: 최적화 및 트러블슈팅 (진행 예정)
- [ ] PG 계산기 구현
- [ ] PG 분포 시각화 (Treemap, Heatmap)
- [ ] 로그 분석 인터페이스
- [ ] RCA 결과 표시
- [ ] 알람 칸반 보드
- [ ] 알람 상관관계 분석

## Phase 9: 리포트 및 문서화 (진행 예정)
- [ ] 리포트 생성 UI
- [ ] 리포트 스케줄러
- [ ] 템플릿 관리
- [ ] PDF/HTML 내보내기
- [ ] 변경작업 영향도 평가

## Phase 10: 테스트 및 최적화 (진행 예정)
- [ ] Unit 테스트 작성
- [ ] E2E 테스트 구현
- [ ] 성능 최적화
- [ ] 번들 사이즈 최적화
- [ ] 접근성 검증 (WCAG 2.1)
- [ ] 보안 취약점 스캔

## Phase 11: 배포 준비 (진행 예정)
- [ ] Production 빌드 설정
- [ ] Docker 이미지 생성
- [ ] CI/CD 파이프라인 설정
- [ ] 문서화 완료
- [ ] 운영 가이드 작성

## 현재 완료된 주요 기능

### ✅ 기술 스택 구성
- Vue 3.4.27 + Composition API
- Tailwind CSS v3.4.17 with 'ceph-' prefix
- Pinia 상태 관리
- Vue Router 4 with 페이지 전환 애니메이션
- ECharts 6.0.0 for 데이터 시각화
- WebSocket STOMP for 실시간 통신

### ✅ UI/UX 구현
- AI 테마 디자인 시스템 구축
- 다크/라이트 모드 지원
- 반응형 레이아웃 (모바일, 태블릿, 데스크톱)
- 페이지 전환 애니메이션 (slide-down, slide-up, page-flip)
- Mega Menu 네비게이션 시스템

### ✅ 대시보드 핵심 기능
- 실시간 클러스터 상태 모니터링
- 8개 인터랙티브 차트 컴포넌트
- 용량 현황 및 위험 요소 패널
- 알림 센터 시스템

### ✅ Backend 연동
- Spring Boot 3.5.4 기반 API 서버
- H2 in-memory database (개발환경)
- WebSocket 실시간 데이터 스트리밍
- Virtual Thread 기반 고성능 처리

## 다음 우선순위 작업

1. **3D 토폴로지 실시간 업데이트 시스템**
   - 노드 추가/수정/제거 동적 반영
   - 상태 변화 실시간 업데이트 (색상, 링, 애니메이션)
   - WebSocket 기반 토폴로지 데이터 스트리밍
   - 연관관계 상태 시각화 (PG-OSD 연결선, 상태 기반 색상)

2. **AI/ML 장애 예측 시스템 구현**
   - 12개 예측 카테고리 UI 개발
   - ML 모델 연동 및 이상감지 대시보드

3. **RAG 기반 지능형 조치 가이드**
   - ceph-doc-crawler API 완전 통합
   - sentence-transformers 기반 문서 검색 최적화
   - AI 기반 문제 해결 가이드 UI 개발

4. **Ceph Squid 특화 기능**
   - NVMe/RoCE 최적화 모니터링
   - BlueStore 고급 메트릭 시각화

5. **PG 최적화 도구**
   - 계산기 및 분포 분석 시각화
   - 리밸런싱 시뮬레이션 기능

## 마일스톤 현황

- **M1: MVP (Week 7)** ✅ **완료**
  - 기본 대시보드 기능 완성
  - 실시간 모니터링 구현
  - WebSocket 연동 완료

- **M2: AI/ML Integration (Week 12)** 🔄 **진행 예정**
  - 장애 예측 기능 개발
  - 이상감지 시스템 구현
  - RAG 조치 가이드 통합

- **M3: Ceph Squid Features (Week 16)** ⏳ **대기**
  - Squid 버전 특화 기능
  - 최적화 도구 구현
  - 트러블슈팅 시스템

- **M4: Production Ready (Week 21)** ⏳ **대기**
  - 전체 테스트 완료
  - 성능 최적화 완료
  - 배포 준비 완료
