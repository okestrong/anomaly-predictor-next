/**
 * Report View Page
 * Display generated report with all sections and data
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useReportStore } from '@/stores/report';
import { usePredictionStore } from '@/stores/prediction';
import { toast } from 'react-toastify';
import { EmailDialog } from '@/components/reports/EmailDialog';
import { downloadBlob, ReportAPI } from '@/lib/api/reportApi';
import { DashboardAPI } from '@/lib/api/dashboardApi';
// Import new section components
import ReportTitlePage from '@/components/reports/sections/ReportTitlePage';
import ClusterInformation from '@/components/reports/sections/ClusterInformation';
import ExecutiveSummary from '@/components/reports/sections/ExecutiveSummary';
import InfrastructureStatus from '@/components/reports/sections/InfrastructureStatus';
import PerformanceMetrics from '@/components/reports/sections/PerformanceMetrics';
import CapacityManagement from '@/components/reports/sections/CapacityManagement';
import AvailabilityRecovery from '@/components/reports/sections/AvailabilityRecovery';
import OperationalHistory from '@/components/reports/sections/OperationalHistory';
import DetailedTables from '@/components/reports/sections/DetailedTables';
import PredictionSection from '@/components/reports/sections/PredictionSection';
import TrendReportView from '@/components/reports/views/TrendReportView';
import { AppHeader } from '@/components/layout';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import ExecutiveAlerts from '@/components/reports/sections/ExecutiveAlerts';

// Extend dayjs with UTC plugin
dayjs.extend(utc);

export default function ReportViewPage() {
   const params = useParams();
   const router = useRouter();
   const searchParams = useSearchParams();
   const reportId = params?.id as string;
   const reportType = searchParams.get('type') || undefined;

   const { currentReport, fetchReportById, error } = useReportStore();
   const { predictions, updateAllPredictions, getHighRiskPredictions } = usePredictionStore();
   const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
   const [isExporting, setIsExporting] = useState(false);
   const [isReportReady, setIsReportReady] = useState(false);
   const [capacityData, setCapacityData] = useState<any>(null);

   useEffect(() => {
      if (reportId) {
         // Check if report data was injected by Puppeteer (for PDF generation)
         const injectedData = (window as any).__INJECTED_REPORT_DATA__;

         if (injectedData) {
            console.log('✅ [INJECTED] Using injected report data, skipping API call');
            // Directly set the report data in the store
            useReportStore.setState({ currentReport: injectedData });
         } else {
            console.log(`📄 [PAGE] Loading report ${reportId} with type: ${reportType || 'unknown'}`);
            fetchReportById(reportId, reportType).catch(err => {
               console.error('Failed to fetch report:', err);
               toast.error('Failed to load report');
               router.push('/reports');
            });
         }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [reportId, reportType]);

   useEffect(() => {
      if (error) {
         toast.error(error);
      }
   }, [error]);

   // Load predictions data ONLY for PREDICTIONS report type
   useEffect(() => {
      if (currentReport?.type === 'PREDICTIONS') {
         updateAllPredictions();
      }
   }, [currentReport?.type, updateAllPredictions]);

   // Fetch capacity data from dashboard API (includes dailyGrowthBytes and timeToFullDays)
   useEffect(() => {
      (async () => {
         try {
            const data = await DashboardAPI.getCapacity();
            setCapacityData(data);
         } catch (err) {
            console.error('Failed to fetch capacity data:', err);
         }
      })();
   }, []);

   // Check if report and charts are ready for PDF generation
   useEffect(() => {
      if (currentReport) {
         // Wait for charts to render
         const checkInterval = setInterval(() => {
            // Both TREND and DAILY reports now use ECharts containers
            const chartContainers = document.querySelectorAll('.echarts-container');

            // Check if all charts are rendered (canvas elements exist)
            const renderedCharts = Array.from(chartContainers).filter(container => {
               const canvas = container.querySelector('canvas');
               return canvas !== null;
            });

            const totalRendered = renderedCharts.length;

            if (currentReport.type === 'TREND') {
               // TREND reports: Wait for at least 10 charts to render (out of ~17 total)
               console.log(`TREND report: ${totalRendered} ECharts rendered (waiting for >= 10)`);
               if (totalRendered >= 10) {
                  console.log(`✓ TREND report ready: ${totalRendered} charts rendered`);
                  setIsReportReady(true);
                  clearInterval(checkInterval);
               }
            } else {
               // DAILY reports: Wait for all charts based on trends data
               const totalCharts = Object.keys(currentReport.data?.trends || {}).length || 0;

               console.log(`DAILY report: ${totalRendered}/${totalCharts} ECharts rendered`);

               // If no charts expected, mark as ready immediately
               if (totalCharts === 0) {
                  setIsReportReady(true);
                  clearInterval(checkInterval);
                  return;
               }

               if (totalRendered === totalCharts && totalCharts > 0) {
                  console.log(`✓ DAILY report ready: ${totalRendered} charts rendered`);
                  setIsReportReady(true);
                  clearInterval(checkInterval);
               }
            }
         }, 100);

         // Timeout: 20 seconds for TREND reports (more charts), 10 seconds for others
         const timeoutDuration = currentReport.type === 'TREND' ? 20000 : 10000;
         const timeout = setTimeout(() => {
            console.log(`Report ready timeout reached (${timeoutDuration}ms), marking as ready`);
            setIsReportReady(true);
            clearInterval(checkInterval);
         }, timeoutDuration);

         return () => {
            clearInterval(checkInterval);
            clearTimeout(timeout);
         };
      }
   }, [currentReport]);

   const handleExportPDF = async () => {
      if (!reportId) return;

      setIsExporting(true);
      try {
         toast.info('Generating PDF with charts...');

         // Call Next.js API route which uses Puppeteer service
         const response = await fetch(`/api/reports/${reportId}/pdf`);

         if (!response.ok) {
            throw new Error('Failed to generate PDF');
         }

         const blob = await response.blob();
         const filename = `report-${reportId}.pdf`;

         downloadBlob(blob, filename);

         toast.success('Report exported successfully');
      } catch (err) {
         console.error('Failed to export report:', err);
         toast.error('Failed to export report');
      } finally {
         setIsExporting(false);
      }
   };

   const handleSendEmail = async (recipients: string[], subject: string, message: string) => {
      if (!reportId) return;

      try {
         toast.info('Sending email...');

         await ReportAPI.sendReportEmail(reportId, recipients, subject, message);

         toast.success(`Report sent to ${recipients.length} recipient(s)`);
         setIsEmailDialogOpen(false);
      } catch (err) {
         console.error('Failed to send email:', err);
         toast.error('Failed to send email');
      }
   };

   if (!currentReport) {
      return (
         <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-secondary-900 via-ai-neural to-secondary-800">
            <div className="w-16 h-16 border-4 border-ai-primary border-t-transparent rounded-full animate-spin" />
         </div>
      );
   }

   // Debug: Log report data for troubleshooting
   if (process.env.NODE_ENV === 'development') {
      console.log('📊 [REPORT DEBUG] Report type:', currentReport.type);
      console.log('📊 [REPORT DEBUG] Report data keys:', currentReport.data ? Object.keys(currentReport.data) : 'NO DATA');
      if (currentReport.type === 'DAILY') {
         console.log('📊 [DAILY DEBUG] hostsSummary:', currentReport.data?.hostsSummary?.length || 0, 'items');
         console.log('📊 [DAILY DEBUG] poolsSummary:', currentReport.data?.poolsSummary?.length || 0, 'items');
         console.log('📊 [DAILY DEBUG] trends:', currentReport.data?.trends ? Object.keys(currentReport.data.trends) : 'NO TRENDS');
      }
      if (currentReport.type === 'TREND') {
         console.log('📊 [TREND DEBUG] Full data:', JSON.stringify(currentReport.data, null, 2).substring(0, 1000));
      }
   }

   return (
      <>
         <style jsx>{`
            .print-bg-white {
               background:
                  radial-gradient(ellipse at top left, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
                  radial-gradient(ellipse at top right, rgba(59, 130, 246, 0.12) 0%, transparent 50%),
                  radial-gradient(ellipse at bottom left, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
                  radial-gradient(ellipse at bottom right, rgba(168, 85, 247, 0.08) 0%, transparent 50%),
                  linear-gradient(135deg, #1a1f2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a1f2e 100%);
               background-attachment: fixed;
            }
            @media print {
               .print-bg-white {
                  background: white !important;
                  background-attachment: unset !important;
                  min-height: auto !important;
               }
            }
         `}</style>
         <div
            className="min-h-screen relative bg-slate-600 print-bg-white"
            data-report-ready={isReportReady}
            /*style={{
               background:
                  'radial-gradient(ellipse at top left, rgba(6, 182, 212, 0.15) 0%, transparent 50%), radial-gradient(ellipse at top right, rgba(59, 130, 246, 0.12) 0%, transparent 50%), radial-gradient(ellipse at bottom left, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(168, 85, 247, 0.08) 0%, transparent 50%), linear-gradient(135deg, #1a1f2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a1f2e 100%)',
               backgroundAttachment: 'fixed',
            }}*/
         >
            {/* Sophisticated mesh pattern */}
            <div
               className="absolute inset-0 opacity-[0.04] print:hidden pointer-events-none"
               style={{
                  backgroundImage: `
                  repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(99, 179, 237, 0.03) 2px, rgba(99, 179, 237, 0.03) 4px),
                  repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(99, 179, 237, 0.03) 2px, rgba(99, 179, 237, 0.03) 4px)
               `,
                  backgroundSize: '60px 60px',
               }}
            />

            {/* Elegant glow accents */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent print:hidden" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent print:hidden" />

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-radial from-cyan-500/10 to-transparent print:hidden pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-blue-500/10 to-transparent print:hidden pointer-events-none" />

            <div className="print:hidden">
               <AppHeader />
            </div>

            {/* 메인 컨텐츠 - A4 Paper Style */}
            <div className="container mx-auto px-4 py-8 max-w-[850px] relative z-10 print:max-w-full print:px-0 print:py-0">
               {/* Report Header - Professional Light Theme */}
               <div className="mb-6 no-print bg-white shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-4">
                        {/* Back Button */}
                        <button
                           onClick={() => {
                              router.push('/reports');
                              router.refresh(); // Force refresh to get latest data
                           }}
                           className="h-10 aspect-square bg-gray-100 border border-gray-300 text-gray-700 flex items-center justify-center hover:bg-gray-200 hover:border-gray-400 transition-colors cursor-pointer group"
                           aria-label="Back to reports"
                        >
                           <svg className="w-5 h-5 group-hover:translate-x-[-2px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                           </svg>
                        </button>
                        <div>
                           <h1 className="text-2xl font-bold text-gray-900 mb-1">{currentReport.title}</h1>
                           <p className="text-xs text-gray-600">
                              {currentReport.description}
                              {/* PREDICTIONS 리포트는 미래 예측이므로 시간 범위 표시 안함 */}
                              {currentReport.type !== 'PREDICTIONS' && currentReport.timeRange && (
                                 <>
                                    <br />
                                    {' • '}
                                    {dayjs.utc(currentReport.timeRange.start).local().format('YYYY-MM-DD HH:mm')} to{' '}
                                    {dayjs.utc(currentReport.timeRange.end).local().format('YYYY-MM-DD HH:mm')}
                                 </>
                              )}
                           </p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button
                           onClick={handleExportPDF}
                           disabled={isExporting}
                           className="px-4 py-2 bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                        >
                           {isExporting && (
                              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                 <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                 ></path>
                              </svg>
                           )}
                           {isExporting ? 'Exporting...' : 'Export PDF'}
                        </button>
                        <button
                           onClick={() => setIsEmailDialogOpen(true)}
                           className="px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                           Email Report
                        </button>
                     </div>
                  </div>

                  {/* Report Metadata */}
                  <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                     <div>
                        <p className="text-xs text-gray-500 mb-1">Type</p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{currentReport.type.replace('-', ' ')}</p>
                     </div>
                     <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <p className="text-sm font-semibold text-green-600">{currentReport.status}</p>
                     </div>
                     <div>
                        <p className="text-xs text-gray-500 mb-1">Generated</p>
                        <p className="text-sm font-semibold text-gray-900">{dayjs.utc(currentReport.createdAt).local().format('YYYY-MM-DD HH:mm')}</p>
                     </div>
                     <div>
                        <p className="text-xs text-gray-500 mb-1">{currentReport.type === 'PREDICTIONS' ? 'Analysis Type' : 'Period'}</p>
                        <p className="text-sm font-semibold text-gray-900">
                           {currentReport.type === 'PREDICTIONS' ? 'Forward-Looking Forecast' : currentReport.timeRange?.label}
                        </p>
                     </div>
                  </div>
               </div>

               {/* Enhanced Report Content - Conditional rendering based on report type */}
               <div className="space-y-6 print:space-y-0">
                  {/* TREND Report View */}
                  {currentReport.type === 'TREND' && <TrendReportView report={currentReport} />}

                  {/* DAILY Report View - Legacy sections */}
                  {currentReport.type === 'DAILY' && (
                     <>
                        {/* Report Title Page */}
                        <div className="hidden print:block">
                           <ReportTitlePage
                              type={currentReport.type}
                              currentReport={currentReport}
                              reportTitle={currentReport.title}
                              reportSubtitle="Ceph Cluster Daily Trend & Health Report"
                              generatedAt={currentReport.createdAt}
                              timeRange={currentReport.timeRange}
                              clusterSummary={{
                                 health: currentReport.data?.clusterHealth?.health || 'UNKNOWN',
                                 capacityUtilization: currentReport.data?.keyMetrics?.capacity?.utilizationPercent || 0,
                                 activeAlerts: currentReport.data?.clusterHealth?.activeAlarms || 0,
                                 totalOsds: currentReport.data?.keyMetrics?.osdStatus?.totalOsds || 0,
                                 upOsds: currentReport.data?.keyMetrics?.osdStatus?.upOsds || 0,
                                 totalCapacity: currentReport.data?.keyMetrics?.capacity?.totalCapacity || 0,
                                 usedCapacity: currentReport.data?.keyMetrics?.capacity?.usedCapacity || 0,
                              }}
                              clusterInfo={{
                                 clusterId: currentReport.data?.clusterInfo?.fsid,
                                 cephVersion: currentReport.data?.clusterInfo?.version,
                                 hostCount: currentReport.data?.clusterInfo?.hostCount,
                                 monCount: currentReport.data?.clusterInfo?.monCount,
                                 osdCount: currentReport.data?.keyMetrics?.osdStatus?.totalOsds,
                                 mgrCount: currentReport.data?.clusterInfo?.mgrCount,
                                 poolCount: currentReport.data?.poolsSummary?.length,
                                 uptime: currentReport.data?.clusterInfo?.uptime,
                                 publicNetwork: currentReport.data?.clusterInfo?.publicNetwork,
                                 clusterNetwork: currentReport.data?.clusterInfo?.clusterNetwork,
                                 deployment: currentReport.data?.clusterInfo?.deployment,
                              }}
                              highRiskPredictions={getHighRiskPredictions().map(p => ({
                                 name: p.name,
                                 severity: p.severity as 'high' | 'critical',
                                 probability: p.probability,
                                 timeToImpact: p.timeToImpact,
                              }))}
                              highRiskSummary={currentReport.aiInsights?.highRiskSummary}
                           />
                        </div>

                        {/* Cluster Information - Web only (hidden in PDF) */}
                        <section className="mb-6 print:mb-4 bg-white shadow-sm p-12 print:p-0 print:shadow-none">
                           <div className="print:hidden">
                              <ClusterInformation
                                 data={{
                                    clusterName: 'Cluster-Seoul',
                                    site: 'Seoul DC1',
                                    environment: 'Production',
                                    clusterId: currentReport.data?.clusterInfo?.fsid,
                                    cephVersion: currentReport.data?.clusterInfo?.version,
                                    deployment: currentReport.data?.clusterInfo?.deployment,
                                    hostCount: currentReport.data?.clusterInfo?.hostCount,
                                    monCount: currentReport.data?.clusterInfo?.monCount,
                                    osdCount: currentReport.data?.keyMetrics?.osdStatus?.totalOsds,
                                    mgrCount: currentReport.data?.clusterInfo?.mgrCount,
                                    poolCount: currentReport.data?.poolsSummary?.length,
                                    uptime: currentReport.data?.clusterInfo?.uptime,
                                    publicNetwork: currentReport.data?.clusterInfo?.publicNetwork,
                                    clusterNetwork: currentReport.data?.clusterInfo?.clusterNetwork,
                                 }}
                              />
                           </div>
                        </section>

                        {/* Executive Summary - Page 1 */}
                        <section className="mb-6 bg-white shadow-sm p-12 print:shadow-none print:p-0 print:hidden">
                           <ExecutiveSummary
                              data={{
                                 healthScore: currentReport.data?.clusterHealth?.healthScore || 85,
                                 kpis: {
                                    totalCapacity: currentReport.data?.keyMetrics?.capacity?.totalCapacity,
                                    usedCapacity: currentReport.data?.keyMetrics?.capacity?.usedCapacity,
                                    utilizationPercent: currentReport.data?.keyMetrics?.capacity?.utilizationPercent,
                                    totalOsds: currentReport.data?.keyMetrics?.osdStatus?.totalOsds,
                                    healthyOsds: currentReport.data?.keyMetrics?.osdStatus?.healthyOsds,
                                    avgLatency: currentReport.data?.keyMetrics?.performance?.avgLatency,
                                    totalIOPS:
                                       (currentReport.data?.keyMetrics?.performance?.readOps || 0) +
                                       (currentReport.data?.keyMetrics?.performance?.writeOps || 0),
                                    throughput:
                                       (currentReport.data?.keyMetrics?.performance?.readThroughput || 0) +
                                       (currentReport.data?.keyMetrics?.performance?.writeThroughput || 0),
                                 },
                              }}
                           />
                           <div className="w-full h-6"></div>
                           {/* Critical Issues & Action Items */}
                           <ExecutiveAlerts currentReport={currentReport} />
                        </section>

                        {/*<section className="mb-6 bg-white shadow-sm p-12 page-break-after print:shadow-none print:p-0 print:min-h-0">
                        </section>*/}

                        {/* Infrastructure Status - Pages 2-3 */}
                        <section className="mb-6 bg-white shadow-sm min-h-[800px] p-12 page-break-before print:shadow-none print:p-0 print:min-h-0">
                           <InfrastructureStatus
                              data={{
                                 // Map hostsSummary to hosts format
                                 hosts:
                                    currentReport.data?.hostsSummary?.map(h => ({
                                       hostname: h.hostname,
                                       cpuCores: h.coreCount,
                                       cpuModel: h.cpuModel,
                                       memoryGB: Math.round(h.memory / 1024 / 1024 / 1024),
                                       cpuUsage: h.avgCpuUsage,
                                       memUsage: +(h.avgMemUsage || 0).toFixed(2),
                                       osdCount: h.osdCount,
                                       status: h.upOsds === h.totalOsds ? 'healthy' : 'degraded',
                                       networkRxMBps: h.networkRxMBps,
                                       networkTxMBps: h.networkTxMBps,
                                    })) || [],
                                 // Transform InventoryResponse[] to Disk[]
                                 disks:
                                    currentReport.data?.disks?.flatMap(
                                       host =>
                                          host.devices
                                             ?.filter(device => device.osd_ids && device.osd_ids.length > 0)
                                             .flatMap(device =>
                                                device.osd_ids.map(osdId => ({
                                                   osdId: osdId,
                                                   hostname: host.name,
                                                   device: device.path,
                                                   deviceClass: device.human_readable_type || 'unknown',
                                                   sizeBytes: device.sys_api?.size || 0,
                                                   usedBytes: 0, // Not available in current data structure
                                                   healthStatus: device.rejected_reasons && device.rejected_reasons.length > 0 ? 'degraded' : 'healthy',
                                                   degradedReason: device.rejected_reasons,
                                                })),
                                             ) || [],
                                    ) || [],
                                 // Map poolsSummary to pools format
                                 pools:
                                    currentReport.data?.poolsSummary?.map(p => ({
                                       name: p.poolName,
                                       type: 'replicated',
                                       size: p.size,
                                       minSize: p.minSize,
                                       pgNum: p.pgNum,
                                       used: p.usedBytes,
                                       available: p.maxBytes - p.usedBytes,
                                    })) || [],
                                 crushMap: undefined,
                                 networkTopology: undefined,
                                 pgDistribution: undefined,
                              }}
                           />
                        </section>

                        {/* Performance Metrics - Pages 4-6 */}
                        <section className="mb-6 bg-white shadow-sm min-h-[800px] p-12 page-break-after print:shadow-none print:p-0 print:min-h-0">
                           <PerformanceMetrics
                              data={{
                                 iops: {
                                    poolTrends: currentReport.data?.trends?.iops,
                                    topClients: [], // No client data in API response
                                 },
                                 latency: {
                                    distribution: currentReport.data?.trends?.latency,
                                    // Calculate percentiles from trend data
                                    percentiles: (() => {
                                       const latencyData = currentReport.data?.trends?.latency?.data || [];
                                       if (latencyData.length === 0) return { p50: 0, p95: 0, p99: 0 };
                                       const sorted = [...latencyData].map(d => d.value).sort((a, b) => a - b);
                                       return {
                                          p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
                                          p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
                                          p99: sorted[Math.floor(sorted.length * 0.99)] || 0,
                                       };
                                    })(),
                                    slowRequests: [], // No slow requests data in API response
                                 },
                                 throughput: {
                                    trends: currentReport.data?.trends?.throughput,
                                    recoveryImpact: undefined, // No recovery impact data in API response
                                 },
                              }}
                           />
                        </section>

                        {/* Capacity Management - Pages 7-8 */}
                        <section className="mb-6 bg-white shadow-sm min-h-[800px] p-12 page-break-after print:shadow-none print:p-0 print:min-h-0">
                           <CapacityManagement
                              data={{
                                 currentUsage: {
                                    totalCapacity: currentReport.data?.keyMetrics?.capacity?.totalCapacity,
                                    usedCapacity: currentReport.data?.keyMetrics?.capacity?.usedCapacity,
                                    availableCapacity: currentReport.data?.keyMetrics?.capacity?.availableCapacity,
                                    utilizationPercent: currentReport.data?.keyMetrics?.capacity?.utilizationPercent,
                                 },
                                 // Map poolsSummary to poolUsage format
                                 poolUsage:
                                    currentReport.data?.poolsSummary?.map(p => ({
                                       name: p.poolName, // Component expects 'name', not 'poolName'
                                       used: p.usedBytes,
                                       available: p.maxBytes - p.usedBytes,
                                       utilizationPercent: p.usagePercent,
                                       objects: p.objectCount,
                                    })) || [],
                                 // Use capacity data from dashboard API (same method as PredictionService.predictClusterExpansion)
                                 predictions: capacityData
                                    ? (() => {
                                         // Daily growth rate from Prometheus: delta(ceph_cluster_total_used_bytes[24h])
                                         const dailyGrowthRate = capacityData.dailyGrowthBytes || 0;

                                         // Days until full from Ceph API: /api/predict/failure/cluster/days-until-full
                                         const daysUntilFull = capacityData.timeToFullDays || -1;

                                         // Cap at reasonable maximum (10 years = 3650 days) to prevent Date overflow
                                         const MAX_DAYS = 3650;
                                         const cappedDays = daysUntilFull > MAX_DAYS ? -1 : daysUntilFull;

                                         // Recommended expansion: 6 months of growth + 20% buffer
                                         const sixMonthsGrowth = dailyGrowthRate * 180; // 6 months
                                         const recommendedExpansion = sixMonthsGrowth > 0 ? sixMonthsGrowth * 1.2 : undefined;

                                         return {
                                            growthRatePerDay: dailyGrowthRate,
                                            expectedFullDate:
                                               cappedDays > 0 && cappedDays <= MAX_DAYS
                                                  ? new Date(Date.now() + cappedDays * 24 * 60 * 60 * 1000).toISOString()
                                                  : undefined,
                                            daysUntilFull: cappedDays,
                                            recommendedExpansion: recommendedExpansion,
                                         };
                                      })()
                                    : undefined,
                                 trends: currentReport.data?.trends?.capacity,
                              }}
                           />
                        </section>

                        {/* Availability & Recovery - Pages 12-13 */}
                        <section className="mb-6 bg-white shadow-sm min-h-[800px] p-12 page-break-after print:shadow-none print:p-0 print:min-h-0">
                           <AvailabilityRecovery
                              data={{
                                 dataProtection: {
                                    // Use recovery metrics from backend
                                    replicationCompliance: currentReport.data?.recoveryMetrics?.replicationCompliance || 0,
                                    scrubCompletionRate: currentReport.data?.recoveryMetrics?.scrubCompletionRate || 0,
                                    deepScrubCompletionRate: currentReport.data?.recoveryMetrics?.deepScrubCompletionRate || 0,
                                    pgConsistencyRate: currentReport.data?.keyMetrics?.pgStatus?.activePgs
                                       ? ((currentReport.data.keyMetrics.pgStatus.activePgs - (currentReport.data.keyMetrics.pgStatus.inconsistentPgs || 0)) /
                                            currentReport.data.keyMetrics.pgStatus.activePgs) *
                                         100
                                       : 100,
                                 },
                                 replicationStatus:
                                    currentReport.data?.poolsSummary?.map(pool => ({
                                       pool: pool.poolName,
                                       targetSize: pool.size, // Desired replication factor
                                       currentSize: pool.size, // Assume meeting target (could be improved with per-pool PG status)
                                       compliance: (currentReport.data?.keyMetrics?.pgStatus?.degradedPgs || 0) === 0, // Compliant if no degraded PGs
                                    })) || [],
                                 scrubStatus:
                                    currentReport.data?.scrubStatus?.map(s => ({
                                       pg: s.pg,
                                       lastScrub: s.lastScrub,
                                       lastDeepScrub: s.lastDeepScrub,
                                       status: s.status,
                                       scrubDuration: s.scrubDuration,
                                    })) || [],
                              }}
                           />
                        </section>

                        {/* Operational History - Page 14 */}
                        <section className="mb-6 bg-white shadow-sm min-h-[800px] p-12 page-break-after print:shadow-none print:p-0 print:min-h-0">
                           <OperationalHistory
                              data={{
                                 // Map events to operational history
                                 configChanges: [],
                                 maintenanceLogs:
                                    currentReport.data?.events?.events
                                       ?.filter(e => e.type === 'info')
                                       .map(e => ({
                                          timestamp: e.timestamp,
                                          type: e.type,
                                          category: 'Maintenance',
                                          description: `${e.component}: ${e.message}`,
                                          user: 'system',
                                          severity: e.type,
                                       })) || [],
                                 incidents:
                                    currentReport.data?.events?.events
                                       ?.filter(e => e.type === 'warning' || e.type === 'error')
                                       .map(e => ({
                                          timestamp: e.timestamp,
                                          type: e.type,
                                          category: 'Incident',
                                          description: `${e.component}: ${e.message} - ${e.details || ''}`,
                                          user: 'system',
                                          severity: e.type,
                                       })) || [],
                                 performanceTuning: [],
                              }}
                           />
                        </section>

                        {/* Detailed Tables - Pages 15+ */}
                        <section className="mb-6 bg-white shadow-sm min-h-[800px] p-12 print:shadow-none print:p-0 print:min-h-0">
                           <DetailedTables
                              data={{
                                 // Map hostsSummary to OSD data
                                 osds:
                                    currentReport.data?.hostsSummary?.flatMap(h =>
                                       Array.from({ length: h.osdCount }, (_, i) => ({
                                          id: i,
                                          host: h.hostname,
                                          status: i < h.upOsds ? 'up' : 'down',
                                          weight: 1.0,
                                          used: 0,
                                          avail: 0,
                                          usePercent: 0,
                                          pgCount: 0,
                                          device: `osd.${i}`,
                                          deviceClass: 'hdd',
                                       })),
                                    ) || [],
                                 // Use poolsSummary directly with correct field names
                                 pools:
                                    currentReport.data?.poolsSummary?.map(p => ({
                                       name: p.poolName,
                                       id: p.poolId,
                                       type: p.type || 'replicated',
                                       size: p.size,
                                       minSize: p.minSize,
                                       pgNum: p.pgNum,
                                       pgpNum: p.pgpNum || p.pgNum,
                                       crushRule: p.crushRule || 'unknown',
                                       used: p.usedBytes,
                                       available: p.maxBytes - p.usedBytes,
                                    })) || [],
                                 clients: [], // No client data in API response
                                 configParams: [], // No config params in API response
                              }}
                           />
                        </section>
                     </>
                  )}

                  {/* PREDICTIONS Report View */}
                  {currentReport.type === 'PREDICTIONS' && (
                     <>
                        {/* Report Title Page */}
                        <div className="hidden print:block">
                           <ReportTitlePage
                              type={currentReport.type}
                              currentReport={currentReport}
                              reportTitle={currentReport.title}
                              reportSubtitle="Ceph Cluster Analysis & Prediction Report"
                              generatedAt={currentReport.createdAt}
                              timeRange={currentReport.timeRange}
                              clusterSummary={{
                                 health: currentReport.data?.clusterInfo?.health || 'UNKNOWN',
                                 capacityUtilization: currentReport.data?.clusterSummary?.capacityUtilization || 0,
                                 activeAlerts: currentReport.data?.clusterInfo?.activeAlerts || 0,
                                 totalOsds: currentReport.data?.clusterSummary?.totalOsds || 0,
                                 upOsds: currentReport.data?.clusterSummary?.upOsds || 0,
                                 totalCapacity: currentReport.data?.clusterSummary?.totalCapacity || 0,
                                 usedCapacity: currentReport.data?.clusterSummary?.usedCapacity || 0,
                              }}
                              clusterInfo={{
                                 clusterId: currentReport.data?.clusterInfo?.fsid,
                                 cephVersion: currentReport.data?.clusterInfo?.version,
                                 hostCount: currentReport.data?.clusterInfo?.hostCount,
                                 monCount: currentReport.data?.clusterInfo?.monCount,
                                 osdCount: currentReport.data?.clusterInfo?.osdCount,
                                 mgrCount: currentReport.data?.clusterInfo?.mgrCount,
                                 poolCount: currentReport.data?.clusterInfo?.poolCount,
                                 uptime: currentReport.data?.clusterInfo?.uptime,
                                 publicNetwork: currentReport.data?.clusterInfo?.publicNetwork,
                                 clusterNetwork: currentReport.data?.clusterInfo?.clusterNetwork,
                              }}
                              highRiskPredictions={
                                 currentReport.data?.predictionsSummary?.highRiskPredictions?.map(p => ({
                                    name: p.name,
                                    severity: p.severity as 'high' | 'critical',
                                    probability: p.probability,
                                    timeToImpact: p.timeToImpact,
                                 })) || []
                              }
                              highRiskSummary={currentReport.data?.predictionsSummary?.highRiskSummary}
                           />
                        </div>

                        {/* Predictions Section - 12 Cards */}
                        <section className="page-break-after print:bg-white print:text-black">
                           <PredictionSection
                              predictions={(currentReport.data?.predictions || []).map(p => ({
                                 id: p.id,
                                 category: p.category,
                                 name: p.name,
                                 severity: p.severity as 'low' | 'medium' | 'high' | 'critical',
                                 probability: p.probability,
                                 confidence: p.confidence,
                                 timeToImpact: p.timeToImpact,
                                 aiAnalysis: p.aiAnalysis,
                                 affectedComponents: p.affectedComponents,
                                 recommendedActions: p.recommendedActions,
                                 trend: p.trend as 'improving' | 'stable' | 'worsening',
                              }))}
                           />
                        </section>
                     </>
                  )}
               </div>

               {/* Back Button */}
               <div className="mt-8 no-print">
                  <button
                     onClick={() => {
                        router.push('/reports');
                        router.refresh(); // Force refresh to get latest data
                     }}
                     className="group px-8 py-3 bg-slate-800 border-2 border-slate-700 text-white font-medium hover:bg-slate-900 hover:border-slate-600 transition-all duration-200 cursor-pointer flex items-center gap-3"
                  >
                     <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                     </svg>
                     Back to Reports
                  </button>
               </div>

               {/* Email Dialog */}
               <EmailDialog
                  isOpen={isEmailDialogOpen}
                  onClose={() => setIsEmailDialogOpen(false)}
                  onSend={handleSendEmail}
                  reportTitle={currentReport?.title || 'Report'}
               />
            </div>
         </div>
      </>
   );
}
