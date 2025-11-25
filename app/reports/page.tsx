/**
 * 리포트 대시보드 페이지 (서버 컴포넌트)
 * ISR을 사용한 리포트 생성 및 관리 메인 대시보드
 */

import { Suspense } from 'react';
import { AppHeader } from '@/components/layout';
import { LoadingSpinner } from '@/components/common';
import ReportsPageClient from '@/components/reports/ReportsPageClient';
import { ReportAPI } from '@/lib/api/reportApi';
import type { Report } from '@/types/report';

// ==================== ISR 설정 ====================
// 60초마다 자동으로 재검증 (백그라운드 자동 갱신)
export const revalidate = 60;

// 선택사항: 특정 경우 동적 렌더링 강제
// export const dynamic = 'force-dynamic';

// 선택사항: 더 세밀한 재검증 제어를 위한 태그 사용
// export const tags = ['reports'];

/**
 * 서버에서 리포트 데이터 가져오기 (캐싱 포함)
 */
async function getReportsData() {
   try {
      // ISR 캐싱과 함께 API에서 리포트 가져오기
      const reportsResponse = await ReportAPI.getReports(1, 10);
      const reports: Report[] = reportsResponse.reports || [];

      // 통계 데이터 가져오기
      const stats = await ReportAPI.getReportStats();

      return {
         reports,
         stats,
      };
   } catch (error) {
      console.error('[Reports Page] Failed to fetch data:', error);

      // 오류 시 빈 데이터 반환 (우아한 성능 저하)
      return {
         reports: [],
         stats: null,
      };
   }
}

/**
 * 리포트 페이지 - 서버 컴포넌트
 *
 * 이 페이지는 ISR (Incremental Static Regeneration)을 사용하여
 * 리포트 데이터를 캐싱하고 60초마다 자동으로 재검증합니다.
 *
 * On-Demand 재검증:
 * - 새로운 리포트가 생성되면 클라이언트가 /api/revalidate를 호출
 * - 60초 간격을 기다리지 않고 즉시 캐시를 업데이트
 *
 * 장점:
 * - 빠른 페이지 로드 (캐시에서 제공)
 * - 최신 데이터 (60초마다 + 온디맨드 재검증)
 * - 서버 부하 감소 (캐시된 응답)
 */
export default async function ReportsPage() {
   // 서버에서 데이터 가져오기 (ISR 캐싱 적용)
   const { reports, stats } = await getReportsData();

   return (
      <div className="min-h-screen relative">
         <AppHeader />

         <Suspense
            fallback={
               <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-secondary-900 via-ai-neural to-secondary-800">
                  <LoadingSpinner size="lg" />
               </div>
            }
         >
            <ReportsPageClient initialReports={reports} initialStats={stats} />
         </Suspense>
      </div>
   );
}
