/**
 * Performance Report Page
 * Generate and view performance reports
 */

'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getDateRangePresets, useReportStore } from '@/stores/report';
import { toast } from 'react-toastify';
import ReportLoading from '@/components/reports/ReportLoading';

export default function PerformanceReportPage() {
   const router = useRouter();
   const { generateReport, isGenerating } = useReportStore();
   const hasGeneratedRef = useRef(false);

   useEffect(() => {
      if (hasGeneratedRef.current) return;
      hasGeneratedRef.current = true;

      const generate = async () => {
         try {
            const presets = getDateRangePresets();
            const timeRange = presets.last7Days.getTimeRange();

            const report = await generateReport({
               type: 'PERFORMANCE',
               timeRange,
               options: {
                  includeAI: true,
                  includePredictions: false,
                  includeRecommendations: true,
               },
            });

            // Redirect to view the generated report
            router.push(`/reports/view/${report.id}`);
         } catch (error) {
            console.error('Failed to generate performance report:', error);
            toast.error('Failed to generate performance report');
            router.push('/reports');
         }
      };

      generate();
   }, [generateReport, router]);

   if (isGenerating) {
      return <ReportLoading title="Generating Performance Report..." desc="Analyzing cluster performance" />;
   }

   return null;
}
