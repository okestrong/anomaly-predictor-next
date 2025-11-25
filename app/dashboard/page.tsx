'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/common';
import { AppHeader } from '@/components/layout';
import {
   IopsChart,
   LatencyChart,
   NetworkErrorChart,
   OsdPerformanceChart,
   PgInconsistencyChart,
   PoolUsageChart,
   ScrubErrorChart,
   ThroughputChart,
} from '@/components/dashboard/chart';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import CapacityStatus from '@/components/dashboard/CapacityStatus';
import ClusterStatus from '@/components/dashboard/ClusterStatus';
import RiskPanel from '@/components/dashboard/RiskPanel';
import AlertCenter from '@/components/dashboard/AlertCenter';
import { useAnomalyStore } from '@/stores/anomaly';
import { useDashboardStore } from '@/stores/dashboard';
import { useShallow } from 'zustand/react/shallow';
import Footer from '@/components/common/Footer';
import { AnimatePresence, motion } from 'framer-motion';
// import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import dynamic from 'next/dynamic';

// Lazy load 3D visualization component for better performance
// ssr: false prevents Three.js from running on server
// Note: ISR (revalidate) cannot be used in client components
// This dashboard uses real-time WebSocket updates instead of ISR
const CephDashboard = dynamic(() => import('@/components/dashboard/visualization/CephDashboard'), {
   ssr: false,
   loading: () => <DashboardLoading />,
});

interface AIInsight {
   id: number;
   title: string;
   description: string;
   timestamp: string;
   severityColor: string;
}

export default function DashboardPage() {
   const router = useRouter();
   // const { isConnected: legacyWsConnected, connectionStatus: legacyConnectionStatus } = useWebSocket();
   const { recentAnomalies: alerts } = useAnomalyStore();

   // Dashboard store
   const {
      dashboardData,
      aiInsights: backendAiInsights,
      isLoading,
      isConnected: dashboardWsConnected,
      connectionError,
      initializeDashboard,
      refreshDashboard,
      connectWebSocket,
      disconnectWebSocket,
      clearError,
   } = useDashboardStore(
      useShallow(state => ({
         dashboardData: state.dashboardData,
         aiInsights: state.aiInsights,
         isLoading: state.isLoading,
         isConnected: state.isConnected,
         connectionError: state.connectionError,
         initializeDashboard: state.initializeDashboard,
         refreshDashboard: state.refreshDashboard,
         connectWebSocket: state.connectWebSocket,
         disconnectWebSocket: state.disconnectWebSocket,
         clearError: state.clearError,
      })),
   );

   // State for AI insights (fallback)
   const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);

   // State for card visibility
   const [cardsVisible, setCardsVisible] = useState(false);

   // Use ref to prevent double initialization in React 18 Strict Mode
   const isInitializedRef = useRef(false);

   useEffect(() => {
      // Prevent double initialization in Strict Mode (React 18)
      if (isInitializedRef.current) {
         return;
      }
      isInitializedRef.current = true;

      // Initialize dashboard data and WebSocket connection
      initializeDashboard();

      // Show cards after 6 seconds
      setTimeout(() => {
         setCardsVisible(true);
      }, 7000);

      // Cleanup on unmount
      return () => {
         disconnectWebSocket();
      };
   }, [initializeDashboard, disconnectWebSocket]);

   // Keyboard event handler for F1/Ctrl+F1
   useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
         if (event.key === 'F1' || event.keyCode === 112) {
            event.preventDefault();
            setCardsVisible(prev => !prev);
         }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, []);

   // Convert backend AI insights or use fallback
   useEffect(() => {
      if (backendAiInsights && backendAiInsights.length > 0) {
         // Use backend AI insights
         const insights = backendAiInsights
            .slice(0, 4) // Show only the 4 most recent insights
            .map((insight, index) => ({
               id: index + 1,
               title: insight.title,
               description: insight.description,
               timestamp: getRelativeTime(new Date(insight.timestamp)),
               severityColor: getSeverityColor(insight.severity),
            }));
         setAiInsights(insights);
      } else if (alerts && Array.isArray(alerts)) {
         // Fallback to anomaly store alerts
         const insights = alerts
            .filter(alert => alert.type === 'ai_insight' || alert.type === 'risk')
            .slice(0, 4)
            .map((alert, index) => ({
               id: index + 1,
               title: alert.message,
               description: `Detected via ${alert.component} analysis`,
               timestamp: getRelativeTime(alert.timestamp),
               severityColor: getSeverityColor(alert.severity),
            }));

         if (insights.length === 0) {
            setAiInsights([
               {
                  id: 1,
                  title: dashboardWsConnected ? 'No insights available' : 'Waiting for dashboard connection...',
                  description: dashboardWsConnected ? 'System is running normally' : 'Connecting to dashboard API for real-time insights',
                  timestamp: 'now',
                  severityColor: dashboardWsConnected ? 'bg-success-500' : 'bg-warning-500',
               },
            ]);
         } else {
            setAiInsights(insights);
         }
      } else {
         // Default fallback
         setAiInsights([
            {
               id: 1,
               title: 'Initializing AI insights...',
               description: 'Loading AI-powered insights from backend',
               timestamp: 'now',
               severityColor: 'bg-info-500',
            },
         ]);
      }
   }, [backendAiInsights, alerts, dashboardWsConnected]);

   const getSeverityColor = (severity: string) => {
      switch (severity) {
         case 'critical':
            return 'bg-danger-500';
         case 'warning':
            return 'bg-warning-500';
         case 'info':
            return 'bg-info-500';
         default:
            return 'bg-ai-circuit';
      }
   };

   const getRelativeTime = (timestamp: Date) => {
      const now = new Date();
      const diff = now.getTime() - timestamp.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);

      if (minutes < 1) return 'just now';
      if (minutes < 60) return `${minutes} minutes ago`;
      if (hours < 24) return `${hours} hours ago`;
      return timestamp.toLocaleDateString();
   };

   const navigateToPage = (routeName: string) => {
      console.log(`Navigate to ${routeName}`);
      router.push(`/${routeName}`);
   };

   return (
      <div className="min-h-screen relative">
         {/* Header */}
         <AppHeader />
         {/*<div className="fixed inset-0 w-full h-full overflow-hidden -z-[1]">
            <video className="w-full h-full object-cover" autoPlay muted loop playsInline>
               <source src="/videos/digital_greenhole.webm" type="video/webm" />
               <source src="/videos/digital_greenhole.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-900/95 via-ai-neural/95 to-secondary-800/95"></div>
         </div>*/}

         {/* Sophisticated Dark Background */}
         <div
            className="fixed inset-0 w-full h-full -z-[1]"
            style={{
               background:
                  'radial-gradient(ellipse at top left, rgba(6, 182, 212, 0.08) 0%, transparent 50%), radial-gradient(ellipse at top right, rgba(59, 130, 246, 0.06) 0%, transparent 50%), radial-gradient(ellipse at bottom left, rgba(99, 102, 241, 0.05) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(168, 85, 247, 0.04) 0%, transparent 50%), linear-gradient(135deg, #0a0f1a 0%, #0d1420 25%, #0a1a2e 50%, #0d1420 75%, #0a0f1a 100%)',
               backgroundAttachment: 'fixed',
            }}
         >
            <div
               className="absolute inset-0 opacity-[0.04]"
               style={{
                  backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(99, 179, 237, 0.03) 2px, rgba(99, 179, 237, 0.03) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(99, 179, 237, 0.03) 2px, rgba(99, 179, 237, 0.03) 4px)`,
                  backgroundSize: '60px 60px',
               }}
            />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-radial from-cyan-500/10 to-transparent" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-blue-500/10 to-transparent" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-radial from-indigo-500/8 to-transparent" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-radial from-purple-500/8 to-transparent" />
         </div>

         {/* 메인 컨텐츠 */}
         <main className="w-full relative z-10">
            {/* Fullscreen CephDashboard - Lazy loaded with loading animation */}
            <div style={{ width: '100vw', height: 'calc(100vh - 65px)', position: 'relative' }}>
               <Suspense fallback={<DashboardLoading />}>
                  <CephDashboard cardVisible={cardsVisible} />
               </Suspense>
               {/*<ErrorBoundary
                  fallback={
                     <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DashboardLoading />
                     </div>
                  }
               >
                  <CephDashboard cardVisible={cardsVisible} />
               </ErrorBoundary>*/}

               {/* Animated Cards Overlay */}
               <AnimatePresence>
                  {cardsVisible && (
                     <>
                        {/* Storage Capacity - Slide from left */}
                        <motion.div
                           initial={{ x: '-100%', opacity: 0 }}
                           animate={{ x: 0, opacity: 1 }}
                           exit={{ x: '-100%', opacity: 0 }}
                           transition={{ duration: 0.8, ease: 'easeOut' }}
                           style={{
                              position: 'absolute',
                              top: '20px',
                              left: '20px',
                              width: '440px',
                              zIndex: 100,
                           }}
                        >
                           <CapacityStatus />
                        </motion.div>

                        {/* Risk Assessment - Slide from right */}
                        <motion.div
                           initial={{ x: '100%', opacity: 0 }}
                           animate={{ x: 0, opacity: 1 }}
                           exit={{ x: '100%', opacity: 0 }}
                           transition={{ duration: 0.8, ease: 'easeOut' }}
                           style={{
                              position: 'absolute',
                              top: '20px',
                              right: '20px',
                              width: '440px',
                              zIndex: 100,
                           }}
                        >
                           <RiskPanel />
                        </motion.div>

                        {/* Cluster Health - Slide from top */}
                        <motion.div
                           initial={{ y: '-100%', opacity: 0 }}
                           animate={{ y: 0, opacity: 1 }}
                           exit={{ y: '-100%', opacity: 0 }}
                           transition={{ duration: 0.8, ease: 'easeOut' }}
                           style={{
                              position: 'absolute',
                              top: '20px',
                              left: '50%',
                              width: 'calc(100vw - 960px)',
                              zIndex: 100,
                           }}
                           className="-translate-x-1/2"
                        >
                           <ClusterStatus />
                        </motion.div>
                     </>
                  )}
               </AnimatePresence>
            </div>

            {/* Scrollable Charts Section */}
            <div className="p-4 md:p-6">
               {/* 실시간 차트 그리드 - 반응형 개선 */}
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
                  {/* Row 1: Core Performance Charts */}
                  <PoolUsageChart className="w-full" />
                  <IopsChart className="w-full" />
                  <LatencyChart className="w-full" />
                  <ThroughputChart className="w-full" />

                  {/* Row 2: System Health Charts */}
                  <OsdPerformanceChart className="w-full" />
                  <NetworkErrorChart className="w-full" />
                  <ScrubErrorChart className="w-full" />
                  <PgInconsistencyChart className="w-full" />
               </div>

               {/* 하단 섹션 (AlertCenter + AI Insights) */}
               <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Alert Center */}
                  <div className="xl:col-span-2">
                     <AlertCenter />
                  </div>

                  {/* AI Insights */}
                  <div className="xl:col-span-1">
                     <Card
                        variant="cyber"
                        header={
                           <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                 <h3 className="text-lg font-semibold text-white">AI Insights</h3>
                                 {/* Dashboard WebSocket Connection Status Indicator */}
                                 <div
                                    className={`w-2 h-2 rounded-full ${
                                       dashboardWsConnected
                                          ? 'bg-success-500'
                                          : isLoading
                                            ? 'bg-warning-500'
                                            : connectionError
                                              ? 'bg-danger-500'
                                              : 'bg-secondary-500'
                                    }`}
                                    title={`Dashboard connection: ${
                                       dashboardWsConnected ? 'connected' : isLoading ? 'connecting' : connectionError ? 'error' : 'disconnected'
                                    }`}
                                 ></div>
                                 {/* Refresh button */}
                                 <button
                                    onClick={refreshDashboard}
                                    disabled={isLoading}
                                    className="p-1 text-xs text-secondary-400 hover:text-white transition-colors"
                                    title="Refresh dashboard data"
                                    aria-label="Refresh dashboard data"
                                 >
                                    🔄
                                 </button>
                              </div>
                              <Button variant="ai" size="xs" onClick={() => navigateToPage('prediction')} ariaLabel="view all">
                                 View All
                              </Button>
                           </div>
                        }
                        footer={
                           <div className="text-center">
                              <Button variant="ai" size="sm" onClick={() => navigateToPage('prediction')} ariaLabel="view prediction dashboard">
                                 View Prediction Dashboard
                              </Button>
                           </div>
                        }
                     >
                        <div className="space-y-3 px-4">
                           {aiInsights.map(insight => (
                              <div key={insight.id} className="flex items-start space-x-3 p-3 bg-secondary-800/30 rounded-lg">
                                 <div className={`w-2 h-2 rounded-full mt-2 ${insight.severityColor}`}></div>
                                 <div className="flex-1">
                                    <p className="text-sm font-medium text-white mb-1">{insight.title}</p>
                                    <p className="text-xs text-secondary-400 mb-1">{insight.description}</p>
                                    <p className="text-xs text-secondary-500">{insight.timestamp}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </Card>
                  </div>
               </div>
            </div>
         </main>
         <Footer />
      </div>
   );
}
