'use client';

/**
 * Reports Page Client Component
 * Handles interactive features and client-side logic
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuickReportCards, RecentReports, ReportHeader } from '@/components/reports';
import { getDateRangePresets, useReportStore } from '@/stores/report';
import { toast } from 'react-toastify';
import { downloadBlob, generateExportFilename } from '@/lib/api/reportApi';
import type { Report, ReportType } from '@/types/report';
import RotateSquareLoading from '@/components/reports/RotateSquareLoading';

interface ReportsPageClientProps {
   initialReports: Report[];
   initialStats: any;
}

export default function ReportsPageClient({ initialReports, initialStats }: ReportsPageClientProps) {
   const router = useRouter();
   const [stats, setStats] = useState(initialStats);
   const backgroundVideoRef = useRef<HTMLVideoElement>(null);
   const [currentReportType, setCurrentReportType] = useState<ReportType | null>(null);

   const { reports, isGenerating, error, setReports, deleteReport, exportReport, generateReport, clearError } = useReportStore();

   // Initialize reports from server-side data
   useEffect(() => {
      if (initialReports.length > 0) {
         setReports(initialReports);
      }
   }, [initialReports, setReports]);

   // Video background setup
   useEffect(() => {
      const video = backgroundVideoRef.current;
      if (video) {
         video.playbackRate = 1;
      }
   }, []);

   // Handle errors
   useEffect(() => {
      if (error) {
         toast.error(error);
         clearError();
      }
   }, [error, clearError]);

   // Handler functions
   const handleViewReport = (reportId: string) => {
      router.push(`/reports/view/${reportId}`);
   };

   const handleDownloadReport = async (reportId: string) => {
      try {
         const report = reports.find(r => r.id === reportId);
         if (!report) {
            toast.error('Report not found');
            return;
         }

         toast.info('Generating export...');

         const blob = await exportReport(reportId, {
            format: 'pdf',
            includeAI: true,
            includeCharts: true,
            orientation: 'portrait',
            pageSize: 'A4',
         });

         const filename = generateExportFilename(report.type, 'pdf');
         downloadBlob(blob, filename);

         toast.success('Report downloaded successfully');
      } catch (err) {
         console.error('Failed to download report:', err);
         toast.error('Failed to download report');
      }
   };

   const handleEmailReport = (reportId: string) => {
      router.push(`/reports/email/${reportId}`);
   };

   const handleDeleteReport = async (reportId: string) => {
      if (!confirm('Are you sure you want to delete this report?')) {
         return;
      }

      try {
         await deleteReport(reportId);
         toast.success('Report deleted successfully');

         // Trigger revalidation after deletion
         await triggerRevalidation();

         // Refresh the page to show updated list
         router.refresh();
      } catch (err) {
         console.error('Failed to delete report:', err);
         toast.error('Failed to delete report');
      }
   };

   const handleGenerateReport = async (reportType: ReportType) => {
      try {
         setCurrentReportType(reportType);
         const presets = getDateRangePresets();

         let timeRange;
         switch (reportType) {
            case 'DAILY':
               timeRange = presets.today.getTimeRange();
               break;
            case 'TREND':
               timeRange = presets.last7Days.getTimeRange();
               break;
            case 'PREDICTIONS':
               timeRange = presets.last7Days.getTimeRange();
               break;
            default:
               timeRange = presets.today.getTimeRange();
         }

         const report = await generateReport({
            type: reportType,
            timeRange,
            options: {
               includeAI: true,
               includePredictions: true,
               includeRecommendations: true,
            },
         });

         // Trigger revalidation after generation
         await triggerRevalidation();

         // Redirect to view the generated report with type parameter
         // This helps when navigating back to /reports to ensure fresh data
         router.push(`/reports/view/${report.id}?type=${reportType}`);
      } catch (error) {
         console.error('Failed to generate report:', error);
         toast.error(`Failed to generate ${reportType.toLowerCase()} report`);
      } finally {
         setCurrentReportType(null);
      }
   };

   /**
    * Trigger on-demand revalidation for /reports page
    */
   const triggerRevalidation = async () => {
      try {
         const secret = process.env.NEXT_PUBLIC_REVALIDATION_SECRET || 'dev-secret-key';

         await fetch('/api/revalidate', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({
               secret,
               path: '/reports',
            }),
         });

         console.log('[Revalidate] Cache updated for /reports');
      } catch (error) {
         console.error('[Revalidate] Failed to trigger revalidation:', error);
      }
   };

   return (
      <>
         {/* 배경 비디오 */}
         <div className="fixed inset-0 w-full h-full overflow-hidden -z-1">
            <video ref={backgroundVideoRef} className="w-full h-full object-cover" autoPlay muted loop playsInline>
               <source src="/videos/digital_notebook.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-900/95 via-ai-neural/90 to-secondary-800/95"></div>
         </div>

         {/* 메인 컨텐츠 */}
         <div className="container mx-auto px-4 py-6 max-w-7xl relative z-10">
            {/* Header with stats */}
            <ReportHeader stats={stats} />

            {/* Recent Reports */}
            <RecentReports
               reports={reports}
               onView={handleViewReport}
               onDownload={handleDownloadReport}
               onEmail={handleEmailReport}
               onDelete={handleDeleteReport}
            />

            {/* Quick Report Cards */}
            <QuickReportCards onGenerate={handleGenerateReport} />
         </div>

         {/* Loading Overlay */}
         <RotateSquareLoading
            isVisible={isGenerating}
            title={`Generating ${currentReportType ? currentReportType.charAt(0) + currentReportType.slice(1).toLowerCase() : ''} Report...`}
            desc={
               currentReportType === 'PREDICTIONS'
                  ? 'Running AI analysis on 12 prediction categories'
                  : currentReportType === 'TREND'
                    ? 'Analyzing 7-day trend data with charts'
                    : 'This may take a few moments'
            }
         />
      </>
   );
}
