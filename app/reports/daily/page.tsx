/**
 * Daily Report Page
 * Generate and view daily reports
 */

'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useReportStore, getDateRangePresets } from '@/stores/report';
import { toast } from 'react-toastify';
import ReportLoading from '@/components/reports/ReportLoading';

export default function DailyReportPage() {
   const router = useRouter();
   const { generateReport, isGenerating } = useReportStore();
   const hasGeneratedRef = useRef(false);

   useEffect(() => {
      if (hasGeneratedRef.current) return;
      hasGeneratedRef.current = true;

      const generate = async () => {
         try {
            const presets = getDateRangePresets();
            const timeRange = presets.today.getTimeRange();

            const report = await generateReport({
               type: 'DAILY',
               timeRange,
               options: {
                  includeAI: true,
                  includePredictions: true,
                  includeRecommendations: true,
               },
            });

            // Redirect to view the generated report
            router.push(`/reports/view/${report.id}`);
         } catch (error) {
            console.error('Failed to generate daily report:', error);
            toast.error('Failed to generate daily report');
            router.push('/reports');
         }
      };

      generate();
   }, [generateReport, router]);

   if (isGenerating) {
      return <ReportLoading title="Generating Daily Report..." desc="This may take a few moments" />;
   }

   return null;
}
