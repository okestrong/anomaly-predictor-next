/**
 * Reports Dashboard Page
 * Main dashboard for report generation and management
 */

'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ReportHeader, QuickReportCards, RecentReports } from '@/components/reports';
import { useReportStore } from '@/stores/report';
import { LoadingSpinner } from '@/components/common';
import { toast } from 'react-toastify';
import { downloadBlob, generateExportFilename } from '@/lib/api/reportApi';
import { AppHeader } from '@/components/layout';

export default function ReportsPage() {
   const router = useRouter();
   const [stats, setStats] = useState<any>(null);
   const backgroundVideoRef = useRef<HTMLVideoElement>(null);
   const hasFetchedRef = useRef(false);
   const hasCleanedRef = useRef(false);

   const { reports, loadingReports, error, fetchReports, deleteReport, exportReport, clearError } = useReportStore();

   // Clean up localStorage once on mount (중복 데이터 제거용)
   useEffect(() => {
      if (hasCleanedRef.current) return;
      hasCleanedRef.current = true;

      try {
         const stored = localStorage.getItem('report-store');
         if (stored) {
            const data = JSON.parse(stored);
            // reports 필드 제거
            if (data.state && data.state.reports) {
               delete data.state.reports;
               delete data.state.currentReport;
               localStorage.setItem('report-store', JSON.stringify(data));
               console.log('Cleaned up duplicate reports from localStorage');
            }
         }
      } catch (err) {
         console.error('Failed to clean localStorage:', err);
      }
   }, []);

   // Video background setup
   useEffect(() => {
      const video = backgroundVideoRef.current;
      if (video) {
         video.playbackRate = 1;
      }
   }, []);

   // Fetch initial data
   useEffect(() => {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;

      const loadData = async () => {
         try {
            await fetchReports(1, 10);

            // Fetch stats
            const { ReportAPI } = await import('@/lib/api/reportApi');
            const statsData = await ReportAPI.getReportStats();
            setStats(statsData);
         } catch (err) {
            console.error('Failed to load reports:', err);
            toast.error('Failed to load reports');
         }
      };

      loadData();
   }, [fetchReports]);

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
      // TODO: Implement email dialog
      router.push(`/reports/email/${reportId}`);
   };

   const handleDeleteReport = async (reportId: string) => {
      if (!confirm('Are you sure you want to delete this report?')) {
         return;
      }

      try {
         await deleteReport(reportId);
         toast.success('Report deleted successfully');
      } catch (err) {
         console.error('Failed to delete report:', err);
         toast.error('Failed to delete report');
      }
   };

   if (loadingReports && reports.length === 0) {
      return (
         <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-secondary-900 via-ai-neural to-secondary-800">
            <LoadingSpinner size="lg" />
         </div>
      );
   }

   return (
      <div className="min-h-screen relative">
         <AppHeader />
         {/* 배경 비디오 */}
         <div className="fixed inset-0 w-full h-full overflow-hidden z-0">
            <video ref={backgroundVideoRef} className="w-full h-full object-cover" autoPlay muted loop playsInline>
               <source src="/videos/digital_notebook.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-900/90 via-ai-neural/90 to-secondary-800/90"></div>
         </div>

         {/* 메인 컨텐츠 */}
         <div className="container mx-auto px-4 py-6 max-w-7xl relative z-10">
            {/* Header with stats */}
            <ReportHeader stats={stats} />

            {/* Quick Report Cards */}
            <QuickReportCards />

            {/* Recent Reports */}
            <RecentReports
               reports={reports}
               onView={handleViewReport}
               onDownload={handleDownloadReport}
               onEmail={handleEmailReport}
               onDelete={handleDeleteReport}
            />

            {/* Scheduled Reports Section */}
            {/* TODO: Implement ScheduledReports component */}

            {/* Templates Section */}
            {/* TODO: Implement ReportTemplates component */}
         </div>
      </div>
   );
}
