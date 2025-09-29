'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/common';
import { AppHeader } from '@/components/layout';
import {
   LatencyChart,
   PoolUsageChart,
   IopsChart,
   ThroughputChart,
   OsdPerformanceChart,
   NetworkErrorChart,
   ScrubErrorChart,
   PgInconsistencyChart,
} from '@/components/dashboard/chart';
import CephClusterVisualization from '@/components/dashboard/CephClusterVisualization';
import CapacityStatus from '@/components/dashboard/CapacityStatus';
import ClusterStatus from '@/components/dashboard/ClusterStatus';
import RiskPanel from '@/components/dashboard/RiskPanel';
import AlertCenter from '@/components/dashboard/AlertCenter';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { useAnomalyStore } from '@/stores/anomaly';

interface AIInsight {
   id: number;
   title: string;
   description: string;
   timestamp: string;
   severityColor: string;
}

export default function DashboardPage() {
   const backgroundVideoRef = useRef<HTMLVideoElement>(null);
   const router = useRouter();
   const { isConnected, connectionStatus } = useWebSocket();
   const { recentAnomalies: alerts } = useAnomalyStore();

   // State for AI insights from backend
   const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);

   useEffect(() => {
      if (backgroundVideoRef.current) {
         backgroundVideoRef.current.playbackRate = 0.5;
      }
   }, []);

   // Convert anomaly alerts to AI insights for display
   useEffect(() => {
      // Guard against undefined alerts
      if (!alerts || !Array.isArray(alerts)) {
         setAiInsights([
            {
               id: 1,
               title: 'Waiting for backend connection...',
               description: 'Connecting to predictor-api for real-time insights',
               timestamp: 'now',
               severityColor: connectionStatus === 'connected' ? 'bg-success-500' : 'bg-warning-500',
            }
         ]);
         return;
      }

      const insights = alerts
         .filter(alert => alert.type === 'ai_insight' || alert.type === 'risk')
         .slice(0, 4) // Show only the 4 most recent insights
         .map((alert, index) => ({
            id: index + 1,
            title: alert.message,
            description: `Detected via ${alert.component} analysis`,
            timestamp: getRelativeTime(alert.timestamp),
            severityColor: getSeverityColor(alert.severity)
         }));

      // If no real insights available, use fallback data
      if (insights.length === 0) {
         setAiInsights([
            {
               id: 1,
               title: connectionStatus === 'connected' ? 'No insights available' : 'Waiting for backend connection...',
               description: connectionStatus === 'connected' ? 'System is running normally' : 'Connecting to predictor-api for real-time insights',
               timestamp: 'now',
               severityColor: connectionStatus === 'connected' ? 'bg-success-500' : 'bg-warning-500',
            }
         ]);
      } else {
         setAiInsights(insights);
      }
   }, [alerts, connectionStatus]);

   const getSeverityColor = (severity: string) => {
      switch (severity) {
         case 'critical': return 'bg-danger-500';
         case 'warning': return 'bg-warning-500';
         case 'info': return 'bg-info-500';
         default: return 'bg-ai-circuit';
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

         {/* 배경 비디오 */}
         <div className="fixed inset-0 w-full h-full overflow-hidden z-0">
            <video
               ref={backgroundVideoRef}
               className="absolute top-1/2 left-1/2 w-full h-full object-cover -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full"
               autoPlay
               muted
               loop
               playsInline
            >
               <source src="/videos/digital_purplehole.mp4" type="video/mp4" />
            </video>
            {/* 비디오 위에 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-900/90 via-ai-neural/70 to-secondary-800/90"></div>
         </div>

         {/* 메인 컨텐츠 */}
         <main className="w-full p-4 md:p-6 relative z-10">
            {/* Full-width Cluster Health 카드 - 반응형 개선 */}
            <div className="mb-6 grid grid-cols-1 lg:grid-cols-9 gap-6 lg:gap-8">
               <div className="lg:col-span-2">
                  <CapacityStatus />
               </div>
               <div className="lg:col-span-5">
                  <div className="flex flex-col h-full gap-4">
                     <div className="h-[300px]">
                        <ClusterStatus />
                     </div>
                     <div className="flex-1 flex flex-col">
                        <div className="flex flex-col flex-1">
                           <CephClusterVisualization />
                        </div>
                     </div>
                  </div>
               </div>
               <div className="lg:col-span-2">
                  <RiskPanel />
               </div>
            </div>

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
                              {/* WebSocket Connection Status Indicator */}
                              <div className={`w-2 h-2 rounded-full ${
                                 connectionStatus === 'connected' ? 'bg-success-500' :
                                 connectionStatus === 'connecting' ? 'bg-warning-500' :
                                 connectionStatus === 'error' ? 'bg-danger-500' : 'bg-secondary-500'
                              }`} title={`Backend connection: ${connectionStatus}`}></div>
                           </div>
                           <Button variant="ai" size="xs" onClick={() => navigateToPage('prediction')}>
                              View All
                           </Button>
                        </div>
                     }
                     footer={
                        <div className="text-center">
                           <Button variant="ai" size="sm" onClick={() => navigateToPage('prediction')}>
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
         </main>
      </div>
   );
}
