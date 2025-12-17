/**
 * Predictions Report Page
 * Generate and view predictions reports
 */

'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useReportStore, getDateRangePresets } from '@/stores/report';
import { toast } from 'react-toastify';
import ReportLoading from '@/components/reports/ReportLoading';

export default function PredictionsReportPage() {
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
               type: 'PREDICTIONS',
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
            console.error('Failed to generate anomaly response report:', error);
            toast.error('Failed to generate anomaly response report');
            router.push('/reports');
         }
      };

      generate();
   }, [generateReport, router]);

   if (isGenerating) {
      return <ReportLoading title="Generating Anomaly Response Report..." desc="Running AI analysis on 12 anomaly categories" />;
   }

   return null;
}
