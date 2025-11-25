# Lighthouse 성능 개선 분석 보고서

## 📊 현재 점수 현황

| 카테고리 | 현재 점수 | 목표 점수 | 상태 |
|---------|----------|----------|------|
| **Performance** | 84점 | 90+점 | 🔴 개선 필요 |
| **Accessibility** | 88점 | 90+점 | 🟡 개선 필요 |
| **Best Practices** | **81점** | 90+점 | 🔴 **긴급 개선** |
| **SEO** | 100점 | 90+점 | ✅ 통과 |
| **평균** | **88.25점** | **90+점** | 🔴 개선 필요 |

---

## 🎯 개선 전략 우선순위

### 1️⃣ 최우선 (Best Practices: 81점 → 90+점)
Best Practices가 가장 낮은 점수(81점)이므로 최우선 개선 대상입니다.

### 2️⃣ 고우선 (Accessibility: 88점 → 90+점)
접근성 이슈는 빠르게 해결 가능하며 사용자 경험에 직접적 영향을 미칩니다.

### 3️⃣ 중우선 (Performance: 84점 → 90+점)
성능 최적화는 장기적으로 진행하되, 즉시 적용 가능한 개선사항부터 시작합니다.

---

## 🔴 Best Practices (81점) - 긴급 개선 필요

### ❌ 문제 1: Deprecated APIs 사용 (Score: 0)

**문제 상세:**
- **경고:** `Unload event listeners are deprecated and will be removed.`
- **위치:** `/_next/static/chunks/296543ed922c127c.js` (line 0, column 21321)
- **영향:** 브라우저에서 곧 제거될 예정인 API를 사용 중

**원인 분석:**
Next.js가 생성한 번들에 `unload` 이벤트 리스너가 포함되어 있습니다. 이는 다음과 같은 코드에서 발생할 수 있습니다:
```javascript
window.addEventListener('unload', handler);
// 또는
window.onunload = handler;
```

**해결 방법:**

#### 즉시 적용 가능한 해결책:
1. **코드베이스에서 unload 이벤트 제거**
   ```bash
   # 프로젝트 전체에서 unload 사용 검색
   grep -r "unload" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
   ```

2. **대체 API 사용**
   - `unload` → `pagehide` 또는 `visibilitychange` 이벤트로 대체

   **변경 전:**
   ```typescript
   window.addEventListener('unload', () => {
     // cleanup code
   });
   ```

   **변경 후:**
   ```typescript
   // 방법 1: pagehide 사용
   window.addEventListener('pagehide', (event) => {
     if (event.persisted) {
       // 페이지가 bfcache에 저장됨
     }
     // cleanup code
   });

   // 방법 2: visibilitychange 사용
   document.addEventListener('visibilitychange', () => {
     if (document.visibilityState === 'hidden') {
       // cleanup code
     }
   });
   ```

3. **Next.js 컴포넌트에서 확인할 위치**
   - `useEffect` cleanup 함수에서 unload 사용 여부 확인
   - WebSocket 연결 해제 코드 확인
   - Three.js/React Three Fiber cleanup 코드 확인

**예상 효과:**
- Best Practices 점수: **81점 → 86점** (약 5점 상승)

---

## 🟡 Accessibility (88점) - 빠른 개선 가능

### ❌ 문제 1: 버튼에 접근 가능한 이름 없음 (Score: 0)

**문제 상세:**
- **경고:** `Buttons do not have an accessible name`
- **영향:** 스크린 리더 사용자가 버튼의 용도를 알 수 없어 "버튼"이라고만 읽힘
- **실패한 요소:** 최소 4개 이상의 버튼

**실패한 버튼 위치:**
1. **AppHeader의 버튼** (2494px, 19px)
   - Selector: `div.jsx-7f8bc05b1222a3c7 > button.inline-flex`

2. **Dashboard 카드의 버튼** (409px, 115px)
   - Selector: `div > div.p-6 > div.flex > button.inline-flex`

3. **AI Insights 카드의 새로고침 버튼** (585px, 1365px)
   - Selector: `div.p-0 > div.px-4 > div.flex > button.inline-flex`

**해결 방법:**

#### 1. 아이콘 전용 버튼에 aria-label 추가

**위치:** `/app/dashboard/page.tsx` (line 368-375)

**변경 전:**
```typescript
<button
   onClick={refreshDashboard}
   disabled={isLoading}
   className="p-1 text-xs text-secondary-400 hover:text-white transition-colors"
   title="Refresh dashboard data"
>
   🔄
</button>
```

**변경 후:**
```typescript
<button
   onClick={refreshDashboard}
   disabled={isLoading}
   className="p-1 text-xs text-secondary-400 hover:text-white transition-colors"
   title="Refresh dashboard data"
   aria-label="Refresh dashboard data"
>
   🔄
</button>
```

#### 2. AppHeader의 버튼에 aria-label 추가

**위치:** `/components/layout/AppHeader.tsx`

모든 아이콘 전용 버튼에 `aria-label` 속성 추가:
```typescript
// 예시: 알림 버튼
<button
   aria-label="View notifications"
   className="..."
>
   <BellIcon />
</button>

// 예시: 설정 버튼
<button
   aria-label="Open settings"
   className="..."
>
   <SettingsIcon />
</button>
```

#### 3. 공통 Button 컴포넌트 개선

**위치:** `/components/common/Button.tsx`

```typescript
interface ButtonProps {
  children: React.ReactNode;
  'aria-label'?: string;
  // ... 기타 props
}

export const Button: React.FC<ButtonProps> = ({
  children,
  'aria-label': ariaLabel,
  ...props
}) => {
  // 아이콘만 있고 텍스트가 없는 경우 경고
  if (process.env.NODE_ENV === 'development' && !ariaLabel) {
    const hasOnlyIcon = React.Children.toArray(children).every(
      child => typeof child !== 'string'
    );
    if (hasOnlyIcon) {
      console.warn('Button: Icon-only buttons should have aria-label');
    }
  }

  return (
    <button aria-label={ariaLabel} {...props}>
      {children}
    </button>
  );
};
```

**예상 효과:**
- Accessibility 점수: **88점 → 92점** (약 4점 상승)

---

## ⚡ Performance (84점) - 단계별 개선

### 🔴 문제 1: Speed Index 느림 (Score: 0.15)

**현재 상태:**
- Speed Index: **3.6초** (목표: 1.3초 이하)
- 페이지 콘텐츠가 시각적으로 표시되는 속도가 느림

**해결 방법:**

#### 1. 3D 시각화 초기 로딩 최적화

**위치:** `/app/dashboard/page.tsx` (line 35-38)

**현재:**
```typescript
const CephDashboard = dynamic(() => import('@/components/dashboard/visualization/CephDashboard'), {
   ssr: false,
   loading: () => <DashboardLoading />,
});
```

**개선:**
```typescript
const CephDashboard = dynamic(
   () => import('@/components/dashboard/visualization/CephDashboard'),
   {
      ssr: false,
      loading: () => <DashboardLoading />,
   }
);

// 추가: 중요 차트를 먼저 로딩하고 3D는 나중에
const [show3D, setShow3D] = useState(false);

useEffect(() => {
   // 차트가 먼저 렌더링된 후 3D 활성화
   const timer = setTimeout(() => setShow3D(true), 1000);
   return () => clearTimeout(timer);
}, []);
```

#### 2. CSS 렌더 블로킹 제거

**문제:** 5개의 CSS 파일이 초기 렌더링을 차단 (150ms 손실)

**파일 목록:**
- `a3197e158645fb7b.css` (29KB, 166ms)
- `f602b04bd7ed9e37.css` (1.2KB, 85ms)
- `78fe560024bc27e8.css` (3KB, 85ms)
- `971d6cc82abaa751.css` (1.4KB)
- `a76165f866b368e3.css` (753B, 85ms)

**해결 방법:**

**위치:** `/app/layout.tsx` 또는 `/next.config.js`

```typescript
// next.config.js에 추가
module.exports = {
  // ... 기존 설정
  experimental: {
    optimizeCss: true, // CSS 최적화 활성화
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // 프로덕션에서 console 제거
  },
};
```

또는 중요 CSS를 인라인으로 삽입:
```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `/* 중요 CSS만 인라인 */
            body { margin: 0; background: #0a0f1a; }
            /* ... */
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**예상 효과:**
- FCP 개선: 150ms 단축
- Speed Index 개선: 약 10-15% 향상

---

### 🔴 문제 2: Main-thread 작업 과다 (Score: 0)

**현재 상태:**
- Main-thread 작업 시간: **20.4초**
- JavaScript 실행 시간: **16.4초**

**원인:**
1. Three.js/React Three Fiber의 무거운 3D 렌더링
2. 대량의 JavaScript 번들
3. 실시간 WebSocket 업데이트 처리

**해결 방법:**

#### 1. Web Worker로 무거운 작업 이동

**새 파일 생성:** `/workers/topology.worker.ts`

```typescript
// topology.worker.ts
self.addEventListener('message', (e) => {
  const { type, data } = e.data;

  switch (type) {
    case 'CALCULATE_POSITIONS':
      const positions = calculateNodePositions(data);
      self.postMessage({ type: 'POSITIONS_CALCULATED', positions });
      break;

    case 'PROCESS_METRICS':
      const processed = processMetrics(data);
      self.postMessage({ type: 'METRICS_PROCESSED', data: processed });
      break;
  }
});

function calculateNodePositions(nodes) {
  // 무거운 계산 로직
  return positions;
}
```

**사용:**
```typescript
// CephDashboard.tsx
const worker = useMemo(() => new Worker(new URL('@/workers/topology.worker', import.meta.url)), []);

useEffect(() => {
  worker.postMessage({ type: 'CALCULATE_POSITIONS', data: nodes });

  worker.onmessage = (e) => {
    if (e.data.type === 'POSITIONS_CALCULATED') {
      setNodePositions(e.data.positions);
    }
  };

  return () => worker.terminate();
}, [nodes]);
```

#### 2. React 렌더링 최적화

**위치:** `/components/dashboard/visualization/CephDashboard.tsx`

```typescript
// memo로 불필요한 리렌더링 방지
const MemoizedNode = memo(({ node, position }) => {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color={node.color} />
    </mesh>
  );
}, (prev, next) => {
  // 위치와 색상이 같으면 리렌더링 방지
  return prev.position === next.position && prev.node.color === next.node.color;
});

// 차트 컴포넌트도 최적화
const MemoizedChart = memo(ChartComponent, (prev, next) => {
  return prev.data === next.data;
});
```

#### 3. requestIdleCallback으로 우선순위 낮은 작업 지연

```typescript
// 낮은 우선순위 작업은 브라우저 유휴 시간에 실행
useEffect(() => {
  const idleCallback = requestIdleCallback(() => {
    // 낮은 우선순위 작업
    updateStatistics();
    calculateTrends();
  }, { timeout: 2000 });

  return () => cancelIdleCallback(idleCallback);
}, [data]);
```

**예상 효과:**
- Main-thread 작업: **20.4초 → 12초** (약 40% 감소)
- JavaScript 실행 시간: **16.4초 → 10초** (약 40% 감소)

---

### 🟡 문제 3: 페이지 크기 과다 (Score: 0.5)

**현재 상태:**
- 총 페이지 크기: **3,025 KiB (약 3MB)**
- 권장 크기: 1,600 KiB 이하

**해결 방법:**

#### 1. Dynamic Import로 코드 분할

**위치:** `/app/dashboard/page.tsx`

```typescript
// 차트도 lazy loading
const IopsChart = dynamic(() => import('@/components/dashboard/chart/IopsChart'));
const LatencyChart = dynamic(() => import('@/components/dashboard/chart/LatencyChart'));
const ThroughputChart = dynamic(() => import('@/components/dashboard/chart/ThroughputChart'));

// viewport에 보이는 것만 로드
import { useInView } from 'react-intersection-observer';

function DashboardCharts() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div ref={ref}>
      {inView && (
        <>
          <IopsChart />
          <LatencyChart />
          <ThroughputChart />
        </>
      )}
    </div>
  );
}
```

#### 2. Three.js 트리 쉐이킹

**위치:** `/components/dashboard/visualization/CephDashboard.tsx`

**변경 전:**
```typescript
import * as THREE from 'three';
```

**변경 후:**
```typescript
// 필요한 것만 import
import { Vector3, Mesh, SphereGeometry, MeshStandardMaterial } from 'three';
```

#### 3. 번들 분석 및 최적화

```bash
# 번들 분석기 설치
pnpm add -D @next/bundle-analyzer

# next.config.js에 추가
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... 기존 설정
});

# 분석 실행
ANALYZE=true pnpm build
```

**예상 효과:**
- 페이지 크기: **3,025 KiB → 2,000 KiB** (약 34% 감소)
- 초기 로딩 시간 개선

---

### 🟡 문제 4: Legacy JavaScript (Score: 0.5)

**문제:**
불필요한 폴리필과 트랜스파일된 코드를 모던 브라우저에 제공

**해결 방법:**

**위치:** `next.config.js`

```javascript
module.exports = {
  // ... 기존 설정

  // 최신 브라우저 타겟팅
  swcMinify: true,
  compiler: {
    // 모던 브라우저 최적화
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // browserslist 설정
  // package.json에 추가:
  // "browserslist": [
  //   "last 2 Chrome versions",
  //   "last 2 Firefox versions",
  //   "last 2 Safari versions",
  //   "last 2 Edge versions"
  // ]
};
```

**위치:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "esnext"
  }
}
```

**예상 효과:**
- JavaScript 번들 크기: 약 10-15% 감소
- 실행 속도 향상

---

## 📋 종합 실행 계획

### Phase 1: 빠른 승리 (1-2일) - 예상 점수 상승: +10점

1. **Accessibility 개선** (예상: +4점)
   - [ ] 모든 아이콘 버튼에 `aria-label` 추가
   - [ ] AppHeader 버튼 접근성 개선
   - [ ] Dashboard 카드 버튼 접근성 개선

2. **Best Practices 개선** (예상: +5점)
   - [ ] `unload` 이벤트 리스너 검색 및 제거
   - [ ] `pagehide` 또는 `visibilitychange`로 대체
   - [ ] WebSocket cleanup 코드 확인
   - [ ] Three.js cleanup 코드 확인

**예상 결과:** Performance(84) + Accessibility(92) + Best Practices(86) + SEO(100) = **평균 90.5점 달성** ✅

### Phase 2: 성능 최적화 기초 (3-5일) - 예상 점수 상승: +3점

3. **CSS 렌더 블로킹 제거**
   - [ ] `next.config.js`에 CSS 최적화 옵션 추가
   - [ ] 중요 CSS 인라인 삽입 검토

4. **Legacy JavaScript 제거**
   - [ ] `tsconfig.json` target을 ES2020으로 업그레이드
   - [ ] `next.config.js` 최적화 설정 추가
   - [ ] 번들 분석기 설치 및 실행

**예상 결과:** Performance(87) → **평균 91.25점**

### Phase 3: 고급 성능 최적화 (1-2주) - 예상 점수 상승: +6점

5. **Main-thread 작업 최적화**
   - [ ] Web Worker 구현
   - [ ] React 컴포넌트 memo 최적화
   - [ ] requestIdleCallback 적용

6. **코드 분할 및 Lazy Loading**
   - [ ] 차트 컴포넌트 dynamic import
   - [ ] Intersection Observer로 viewport 내 컴포넌트만 로드
   - [ ] Three.js 트리 쉐이킹

**최종 예상 결과:** Performance(90+) + Accessibility(92+) + Best Practices(86+) + SEO(100) = **평균 92점 달성** ✅

---

## 🎯 핵심 권장사항

### 즉시 시작해야 할 작업 (Priority 1)

1. **Unload 이벤트 제거** (Best Practices)
   ```bash
   # 검색 명령어
   grep -r "addEventListener.*unload" . --include="*.{ts,tsx,js,jsx}"
   grep -r "onunload" . --include="*.{ts,tsx,js,jsx}"
   ```

2. **버튼 접근성 개선** (Accessibility)
   - 모든 아이콘 전용 버튼에 `aria-label` 추가
   - 특히 다음 파일 우선 수정:
     - `/app/dashboard/page.tsx` (line 368)
     - `/components/layout/AppHeader.tsx`

### 중기 목표 (Priority 2)

3. **CSS 최적화**
   - `next.config.js`에 `experimental.optimizeCss: true` 추가

4. **번들 분석**
   ```bash
   pnpm add -D @next/bundle-analyzer
   ANALYZE=true pnpm build
   ```

### 장기 목표 (Priority 3)

5. **Web Worker 도입**
   - 3D 계산을 별도 스레드로 이동
   - 메트릭 처리 로직 분리

6. **Progressive Loading**
   - 중요 콘텐츠 우선 로딩
   - 3D 시각화는 마지막에 로드

---

## 📈 예상 점수 변화

| Phase | Performance | Accessibility | Best Practices | SEO | 평균 |
|-------|------------|---------------|----------------|-----|------|
| **현재** | 84 | 88 | 81 | 100 | **88.25** |
| Phase 1 완료 | 84 | 92 (+4) | 86 (+5) | 100 | **90.5** ✅ |
| Phase 2 완료 | 87 (+3) | 92 | 86 | 100 | **91.25** ✅ |
| Phase 3 완료 | 93 (+6) | 92 | 86 | 100 | **92.75** ✅ |

**Phase 1만 완료해도 90점 목표 달성!** 🎉

---

## 🔍 추가 모니터링 항목

### 성능 메트릭 지속 관찰
- **FCP (First Contentful Paint):** 현재 330ms (우수) ✅
- **LCP (Largest Contentful Paint):** 현재 745ms (우수) ✅
- **TBT (Total Blocking Time):** 현재 205ms (개선 필요) 🟡
- **CLS (Cumulative Layout Shift):** 현재 0.00025 (우수) ✅

### 주기적 체크리스트
- [ ] 매주 Lighthouse 테스트 실행
- [ ] 새로운 기능 추가 시 번들 크기 확인
- [ ] 프로덕션 배포 전 성능 회귀 테스트
- [ ] 주요 메트릭 대시보드 구축

---

## 📚 참고 자료

- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/pages/building-your-application/optimizing)
- [React Three Fiber Performance](https://docs.pmnd.rs/react-three-fiber/advanced/pitfalls)
- [Accessibility ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

---

**작성일:** 2025-11-21
**대상 페이지:** `/dashboard`
**테스트 환경:** localhost:3000
**Lighthouse 버전:** Chrome DevTools Lighthouse
