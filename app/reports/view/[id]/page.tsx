/**
 * Report View Page
 * Display generated report with all sections and data
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReportStore } from '@/stores/report';
import { usePredictionStore } from '@/stores/prediction';
import { toast } from 'react-toastify';
import { EmailDialog } from '@/components/reports/EmailDialog';
import { downloadBlob, ReportAPI } from '@/lib/api/reportApi';
// Import new section components
import ReportTitlePage from '@/components/reports/sections/ReportTitlePage';
import ExecutiveSummary from '@/components/reports/sections/ExecutiveSummary';
import InfrastructureStatus from '@/components/reports/sections/InfrastructureStatus';
import PerformanceMetrics from '@/components/reports/sections/PerformanceMetrics';
import CapacityManagement from '@/components/reports/sections/CapacityManagement';
import AIInsightsSection from '@/components/reports/sections/AIInsightsSection';
import AvailabilityRecovery from '@/components/reports/sections/AvailabilityRecovery';
import OperationalHistory from '@/components/reports/sections/OperationalHistory';
import DetailedTables from '@/components/reports/sections/DetailedTables';
import PredictionSection from '@/components/reports/sections/PredictionSection';
import TrendReportView from '@/components/reports/views/TrendReportView';
import { AppHeader } from '@/components/layout';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

// Extend dayjs with UTC plugin
dayjs.extend(utc);

// Particles Background with subtle gray particles
function ParticlesBackground() {
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const animationIdRef = useRef<number | null>(null);
   const particlesRef = useRef<any[]>([]);

   useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Subtle gray colors for particles (darker than white background)
      const particleColors = ['#d0d0d0', '#c5c5c5', '#b8b8b8', '#cacaca', '#bcbcbc'];

      // Reduced particle count to 1/10
      const PARTICLE_COUNT = 20;

      // Create particles only once
      if (particlesRef.current.length === 0) {
         for (let i = 0; i < PARTICLE_COUNT; i++) {
            particlesRef.current.push({
               x: Math.random() * canvas.width,
               y: Math.random() * canvas.height,
               vx: (Math.random() - 0.5) * 0.8,
               vy: (Math.random() - 0.5) * 0.8,
               size: Math.random() * 4 + 1,
               color: particleColors[Math.floor(Math.random() * particleColors.length)],
               opacity: Math.random() * 0.8 + 0.3,
               pulseSpeed: Math.random() * 0.05 + 0.01,
               pulsePhase: Math.random() * Math.PI * 2,
            });
         }
      }

      let frameCount = 0;
      let time = 0;

      function animate() {
         if (!ctx || !canvas) return;

         frameCount++;
         time += 0.016;

         // Clear canvas
         ctx.clearRect(0, 0, canvas.width, canvas.height);

         // Enhanced connection system - check more particles for connections
         particlesRef.current.forEach((particle, i) => {
            // Check connections for more particles, but with distance optimization
            if (i % 2 === 0) {
               particlesRef.current.slice(i + 1).forEach(other => {
                  const dx = particle.x - other.x;
                  const dy = particle.y - other.y;
                  const distance = Math.sqrt(dx * dx + dy * dy);

                  // Increased connection distance and better visuals
                  if (distance < 120) {
                     const alpha = (1 - distance / 120) * 0.25;
                     const gradient = ctx.createLinearGradient(particle.x, particle.y, other.x, other.y);
                     gradient.addColorStop(
                        0,
                        particle.color +
                           Math.floor(alpha * 255)
                              .toString(16)
                              .padStart(2, '0'),
                     );
                     gradient.addColorStop(
                        1,
                        other.color +
                           Math.floor(alpha * 255)
                              .toString(16)
                              .padStart(2, '0'),
                     );

                     ctx.strokeStyle = gradient;
                     ctx.lineWidth = 0.8 + (1 - distance / 120) * 1.2;
                     ctx.globalAlpha = alpha;
                     ctx.beginPath();
                     ctx.moveTo(particle.x, particle.y);
                     ctx.lineTo(other.x, other.y);
                     ctx.stroke();
                  }
               });
            }
         });

         // Enhanced particle rendering with pulsing effects
         particlesRef.current.forEach((particle, i) => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Wrap around edges
            if (particle.x < 0) particle.x = canvas.width;
            if (particle.x > canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = canvas.height;
            if (particle.y > canvas.height) particle.y = 0;

            // Update pulse phase
            particle.pulsePhase += particle.pulseSpeed;
            const pulseMultiplier = 1 + Math.sin(particle.pulsePhase) * 0.3;

            // Enhanced glow effect with multiple layers
            const currentSize = particle.size * pulseMultiplier;
            const currentOpacity = particle.opacity * (0.8 + Math.sin(particle.pulsePhase) * 0.2);

            // Outer glow
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = currentOpacity * 0.1;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, currentSize * 4, 0, Math.PI * 2);
            ctx.fill();

            // Middle glow
            ctx.globalAlpha = currentOpacity * 0.3;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, currentSize * 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Inner glow
            ctx.globalAlpha = currentOpacity * 0.5;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, currentSize * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Core particle
            ctx.globalAlpha = currentOpacity;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
            ctx.fill();

            // Add sparkle effect for some particles
            if (i % 10 === 0 && Math.sin(particle.pulsePhase) > 0.8) {
               ctx.fillStyle = '#ffffff';
               ctx.globalAlpha = 0.8;
               ctx.beginPath();
               ctx.arc(particle.x, particle.y, currentSize * 0.5, 0, Math.PI * 2);
               ctx.fill();
            }
         });

         ctx.globalAlpha = 1;

         animationIdRef.current = requestAnimationFrame(animate);
      }

      animate();

      const handleResize = () => {
         canvas.width = window.innerWidth;
         canvas.height = window.innerHeight;
         // Redistribute particles on resize
         particlesRef.current.forEach(particle => {
            if (particle.x > canvas.width) particle.x = Math.random() * canvas.width;
            if (particle.y > canvas.height) particle.y = Math.random() * canvas.height;
         });
      };

      window.addEventListener('resize', handleResize);

      return () => {
         if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
         }
         window.removeEventListener('resize', handleResize);
         // Clear particles on unmount
         particlesRef.current = [];
      };
   }, []);

   return (
      <canvas
         ref={canvasRef}
         className="absolute inset-0 z-0 opacity-70 pointer-events-none"
         style={{
            background: 'linear-gradient(150deg, #ffffff 0%, #ffffff 33%, #e7e5e4 33%, #e7e5e4 66%, #ffffff 66%, #ffffff 100%)',
         }}
      />
   );
}

export default function ReportViewPage() {
   const params = useParams();
   const router = useRouter();
   const reportId = params?.id as string;

   const { currentReport, fetchReportById, error } = useReportStore();
   const { predictions, updateAllPredictions, getHighRiskPredictions } = usePredictionStore();
   const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
   const [isExporting, setIsExporting] = useState(false);
   const [isReportReady, setIsReportReady] = useState(false);

   useEffect(() => {
      if (reportId) {
         fetchReportById(reportId).catch(err => {
            console.error('Failed to fetch report:', err);
            toast.error('Failed to load report');
            router.push('/reports');
         });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [reportId]);

   useEffect(() => {
      if (error) {
         toast.error(error);
      }
   }, [error]);

   // Load predictions data for report
   useEffect(() => {
      updateAllPredictions();
   }, [updateAllPredictions]);

   // Check if report and charts are ready for PDF generation
   useEffect(() => {
      if (currentReport) {
         // Wait for charts to render
         const checkInterval = setInterval(() => {
            const chartContainers = document.querySelectorAll('.echarts-container');
            const totalCharts = Object.keys(currentReport.data?.trends || {}).length || 0;

            // If no charts, mark as ready immediately
            if (totalCharts === 0) {
               setIsReportReady(true);
               clearInterval(checkInterval);
               return;
            }

            // Check if all charts are rendered (canvas elements exist)
            const renderedCharts = Array.from(chartContainers).filter(container => {
               const canvas = container.querySelector('canvas');
               return canvas !== null;
            });

            if (renderedCharts.length === totalCharts && totalCharts > 0) {
               setIsReportReady(true);
               clearInterval(checkInterval);
            }
         }, 100);

         // Timeout after 10 seconds
         const timeout = setTimeout(() => {
            setIsReportReady(true);
            clearInterval(checkInterval);
         }, 10000);

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

   return (
      <div className="min-h-screen relative print:bg-white" data-report-ready={isReportReady}>
         <div className="print:hidden">
            <AppHeader />
         </div>
         {/* 파티클 배경 */}
         <div className="fixed inset-0 w-full h-full overflow-hidden z-0 print:hidden">
            {/* Particles with diagonal gradient background */}
            <ParticlesBackground />
         </div>

         {/* 메인 컨텐츠 */}
         <div className="container mx-auto px-4 py-6 max-w-7xl relative z-10">
            {/* Report Header */}
            <div className="mb-8 no-print">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                     {/* Back Button */}
                     <button
                        onClick={() => router.push('/reports')}
                        className="w-10 h-10 rounded-full bg-secondary-800/60 backdrop-blur-md border border-ai-primary/30 text-white flex items-center justify-center hover:bg-orange-400 hover:border-orange-500 hover:scale-110 transition-all duration-200 cursor-pointer group"
                        aria-label="Back to reports"
                     >
                        <svg className="w-5 h-5 group-hover:translate-x-[-2px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                     </button>
                     <div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">{currentReport.title}</h1>
                        <p className="text-slate-500">
                           {currentReport.description}
                           <br />
                           {currentReport.timeRange && (
                              <>
                                 {' '}
                                 covering {dayjs(currentReport.timeRange.start).format('YYYY-MM-DD HH:mm')} to{' '}
                                 {dayjs(currentReport.timeRange.end).format('YYYY-MM-DD HH:mm')}
                              </>
                           )}
                        </p>
                     </div>
                  </div>
                  <div className="flex gap-3">
                     <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="px-4 py-2 bg-ai-primary text-white rounded-lg hover:bg-ai-primary/90 hover:shadow-xl hover:shadow-ai-primary/50 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-ai-primary/30 cursor-pointer flex items-center gap-2"
                     >
                        {isExporting && (
                           <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                        )}
                        {isExporting ? 'Exporting...' : 'Export PDF'}
                     </button>
                     <button
                        onClick={() => setIsEmailDialogOpen(true)}
                        className="px-4 py-2 bg-secondary-800/60 backdrop-blur-md border border-ai-primary/30 text-white rounded-lg hover:bg-secondary-800/80 hover:border-ai-primary/60 transition cursor-pointer"
                     >
                        Email Report
                     </button>
                  </div>
               </div>

               {/* Report Metadata */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-secondary-800/80 backdrop-blur-md rounded-lg p-4 border border-ai-primary/30">
                  <div>
                     <p className="text-sm text-slate-300">Type</p>
                     <p className="font-semibold text-white capitalize">{currentReport.type.replace('-', ' ')}</p>
                  </div>
                  <div>
                     <p className="text-sm text-slate-300">Status</p>
                     <p className="font-semibold text-green-400">{currentReport.status}</p>
                  </div>
                  <div>
                     <p className="text-sm text-slate-300">Generated</p>
                     <p className="font-semibold text-white">{dayjs(currentReport.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
                  </div>
                  <div>
                     <p className="text-sm text-slate-300">Period</p>
                     <p className="font-semibold text-white">{currentReport.timeRange?.label}</p>
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
                           reportTitle={currentReport.title}
                           generatedAt={currentReport.createdAt}
                           timeRange={currentReport.timeRange}
                           clusterSummary={{
                              health: currentReport.data?.clusterHealth?.health || 'HEALTH_WARN',
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
                              monCount: currentReport.data?.clusterInfo?.monCount,
                              osdCount: currentReport.data?.keyMetrics?.osdStatus?.totalOsds,
                              mgrCount: currentReport.data?.clusterInfo?.mgrCount,
                              poolCount: currentReport.data?.poolsSummary?.length,
                              uptime: currentReport.data?.clusterInfo?.uptime,
                              publicNetwork: currentReport.data?.clusterInfo?.publicNetwork,
                              clusterNetwork: currentReport.data?.clusterInfo?.clusterNetwork,
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

                     {/* Executive Summary - Page 1 */}
                     <section className="page-break-after print:bg-white print:text-black">
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
                                    (currentReport.data?.keyMetrics?.performance?.readOps || 0) + (currentReport.data?.keyMetrics?.performance?.writeOps || 0),
                                 throughput:
                                    (currentReport.data?.keyMetrics?.performance?.readThroughput || 0) +
                                    (currentReport.data?.keyMetrics?.performance?.writeThroughput || 0),
                              },
                              // Map AI predictions to risks
                              risks:
                                 currentReport.aiInsights?.predictions?.map(p => ({
                                    level: p.impact,
                                    category: p.category,
                                    description: `${p.probability}% probability in ${p.estimatedTime}`,
                                    impact: p.impact,
                                 })) || [],
                              // Map top alerts to critical issues
                              criticalIssues:
                                 currentReport.data?.alerts?.topAlerts?.map(a => ({
                                    severity: a.severity,
                                    title: a.title,
                                    description: a.message,
                                    action: a.resolveAction || 'Review and acknowledge',
                                 })) || [],
                           }}
                        />
                     </section>

                     {/* Infrastructure Status - Pages 2-3 */}
                     <section className="page-break-after print:bg-white print:text-black">
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
                     <section className="page-break-after print:bg-white print:text-black">
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
                     <section className="page-break-after print:bg-white print:text-black">
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
                              // Transform prediction data to match component expectations
                              predictions: currentReport.data?.trends?.capacity?.prediction
                                 ? {
                                      growthRatePerDay: 0, // Not available in API
                                      expectedFullDate: undefined, // Not available in API
                                      daysUntilFull: currentReport.data.trends.capacity.prediction.timeToThreshold,
                                      recommendedExpansion: undefined, // Not available in API
                                   }
                                 : undefined,
                              trends: currentReport.data?.trends?.capacity,
                           }}
                        />
                     </section>

                     {/* AI Insights - Pages 9-11 */}
                     <section className="page-break-after print:bg-white print:text-black">
                        <AIInsightsSection
                           data={{
                              anomalies: currentReport.aiInsights?.anomalies || [],
                              predictions:
                                 currentReport.aiInsights?.predictions?.map(p => ({
                                    category: p.category,
                                    probability: p.probability,
                                    impact: p.impact,
                                    estimatedTime: p.estimatedTime,
                                    description: `${p.category} prediction with ${p.confidence}% confidence. Risk factors: ${p.riskFactors?.length || 0}`,
                                 })) || [],
                              recommendations:
                                 currentReport.aiInsights?.recommendations?.map(r => ({
                                    id: r.id,
                                    title: r.title,
                                    description: r.description,
                                    priority: r.priority,
                                    estimatedImpact: r.estimatedImpact,
                                    implementation: r.commands?.join('; ') || 'No specific commands provided',
                                 })) || [],
                              analysisWindow: currentReport.timeRange?.label || 'Last 7 days',
                              confidence: currentReport.data?.aiAnalysisConfidence || 95.0,
                           }}
                        />
                     </section>

                     {/* Availability & Recovery - Pages 12-13 */}
                     <section className="page-break-after print:bg-white print:text-black">
                        <AvailabilityRecovery
                           data={{
                              dataProtection: {
                                 // Calculate compliance rates from PG status
                                 replicationCompliance: 100, // Assume full replication compliance
                                 scrubCompletionRate: 0, // Not available in API
                                 deepScrubCompletionRate: 0, // Not available in API
                                 pgConsistencyRate: currentReport.data?.keyMetrics?.pgStatus?.activePgs
                                    ? ((currentReport.data.keyMetrics.pgStatus.activePgs - (currentReport.data.keyMetrics.pgStatus.inconsistentPgs || 0)) /
                                         currentReport.data.keyMetrics.pgStatus.activePgs) *
                                      100
                                    : 100,
                                 backupCompliance: 0, // Not available in API
                              },
                              recoveryReadiness: {
                                 mtbf: undefined, // Not available in API
                                 mttr: undefined, // Not available in API
                                 rto: undefined, // Not available in API
                                 rpo: undefined, // Not available in API
                                 lastDisasterRecoveryTest: undefined, // Not available in API
                                 drTestResult: undefined, // Not available in API
                              },
                              replicationStatus:
                                 currentReport.data?.poolsSummary?.map(pool => ({
                                    pool: pool.poolName,
                                    targetSize: pool.size, // Desired replication factor
                                    currentSize: pool.size, // Assume meeting target (could be improved with per-pool PG status)
                                    compliance: (currentReport.data?.keyMetrics?.pgStatus?.degradedPgs || 0) === 0, // Compliant if no degraded PGs
                                 })) || [],
                              scrubStatus: [], // No scrub status data in API response
                           }}
                        />
                     </section>

                     {/* AI Failure Predictions */}
                     <section className="page-break-after print:bg-white print:text-black">
                        <PredictionSection
                           predictions={Object.values(predictions).map(p => ({
                              id: p.id,
                              category: p.category,
                              name: p.name,
                              severity: p.severity,
                              probability: p.probability,
                              confidence: p.confidence,
                              timeToImpact: p.timeToImpact,
                              aiAnalysis: p.aiAnalysis,
                              affectedComponents: p.affectedComponents,
                              recommendedActions: p.recommendedActions,
                              trend: p.trend,
                           }))}
                        />
                     </section>

                     {/* Operational History - Page 14 */}
                     <section className="page-break-after print:bg-white print:text-black">
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
                     <section className="print:bg-white print:text-black">
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
                                    type: 'replicated',
                                    size: p.size,
                                    minSize: p.minSize,
                                    pgNum: p.pgNum,
                                    pgpNum: p.pgNum, // Same as pgNum
                                    crushRule: 'replicated_rule',
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
                           reportTitle={currentReport.title}
                           generatedAt={currentReport.createdAt}
                           timeRange={currentReport.timeRange}
                           clusterSummary={{
                              health: currentReport.data?.clusterInfo?.health || 'HEALTH_WARN',
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
                  onClick={() => router.push('/reports')}
                  className="px-6 py-2 bg-secondary-800/60 backdrop-blur-md border border-ai-primary/30 text-white rounded-lg hover:bg-secondary-800/80 hover:border-ai-primary/60 transition cursor-pointer"
               >
                  ← Back to Reports
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
   );
}
