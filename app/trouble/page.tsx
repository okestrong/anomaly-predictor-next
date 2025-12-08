'use client';

import React, { useState, useEffect, useRef } from 'react';
import AlertListPanel from '@/components/trouble/AlertListPanel';
import ChatInterface from '@/components/trouble/ChatInterface';
import ApprovalDrawer from '@/components/trouble/ApprovalDrawer';
import { AlertInfo } from '@/types/trouble';
import { AppHeader } from '@/components/layout';
import { getPendingApprovals } from '@/lib/executorApi';

/**
 * Trouble Shooting Guide 메인 페이지
 * Alert 기반 AI 대화형 트러블슈팅
 */
export default function TroubleShootingPage() {
   const [selectedAlert, setSelectedAlert] = useState<AlertInfo | null>(null);
   const [threadId, setThreadId] = useState<string | null>(null);
   const [showApprovalDrawer, setShowApprovalDrawer] = useState(false);
   const [pendingCount, setPendingCount] = useState(0);
   const [isAiProcessing, setIsAiProcessing] = useState(false);

   // Alert별 threadId를 관리하는 Map
   const alertThreadMapRef = useRef<Map<string, string>>(new Map());

   // 승인 대기 개수 조회
   const fetchPendingCount = async () => {
      try {
         const data = await getPendingApprovals();
         setPendingCount(data.total_count);
      } catch (error) {
         console.error('Failed to fetch pending approvals:', error);
      }
   };

   // 승인 대기 개수 조회 (주기적으로)
   useEffect(() => {
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 10000); // 10초마다 갱신

      return () => clearInterval(interval);
   }, []);

   const handleAlertSelect = (alert: AlertInfo) => {
      // 같은 alert를 재클릭한 경우 무시
      if (selectedAlert?.alertId === alert.alertId) {
         return;
      }

      setSelectedAlert(alert);

      // 해당 alert에 대한 기존 threadId가 있으면 재사용, 없으면 새로 생성
      const alertKey = alert.alertId;
      let existingThreadId = alertThreadMapRef.current.get(alertKey);

      if (!existingThreadId) {
         existingThreadId = `thread-${alertKey}-${Date.now()}`;
         alertThreadMapRef.current.set(alertKey, existingThreadId);
      }

      setThreadId(existingThreadId);
   };

   const handleApprovalDecision = () => {
      // 승인/거부 후 pending count 갱신
      fetchPendingCount();
   };

   return (
      <div className="h-screen relative flex flex-col">
         <AppHeader />
         <div className="flex flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
            {/* Left Panel: Alert List */}
            <div className="w-[400px] border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full overflow-hidden">
               <AlertListPanel selectedAlert={selectedAlert} onAlertSelect={handleAlertSelect} disabled={isAiProcessing} />
            </div>

            {/* Main Content: Chat Interface */}
            <div className="flex-1 flex flex-col">
               {selectedAlert && threadId ? (
                  <ChatInterface alert={selectedAlert} threadId={threadId} onProcessingChange={setIsAiProcessing} />
               ) : (
                  <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
                     {/* Animated Background Effects */}
                     <div className="absolute inset-0 overflow-hidden">
                        {/* Gradient Orbs */}
                        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                        <div
                           className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
                           style={{ animationDelay: '1s' }}
                        ></div>
                        <div
                           className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"
                           style={{ animationDelay: '2s' }}
                        ></div>

                        {/* Grid Pattern */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)] opacity-20"></div>
                     </div>

                     {/* Content */}
                     <div className="relative z-10 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        {/* Icon with Glow Effect */}
                        <div className="relative mx-auto mb-8 w-32 h-32 animate-in zoom-in duration-1000 delay-200">
                           <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
                           <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-700/50 backdrop-blur-sm">
                              <svg className="w-20 h-20 text-transparent bg-clip-text" fill="none" viewBox="0 0 24 24" stroke="url(#iconGradient)">
                                 <defs>
                                    <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                       <stop offset="0%" stopColor="#3b82f6" />
                                       <stop offset="50%" stopColor="#a855f7" />
                                       <stop offset="100%" stopColor="#06b6d4" />
                                    </linearGradient>
                                 </defs>
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                 />
                              </svg>
                           </div>
                        </div>

                        {/* Text Content */}
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                           <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                              AI Troubleshooting Assistant
                           </h3>
                           <p className="text-lg text-gray-400 max-w-md mx-auto leading-relaxed">
                              왼쪽 목록에서 <span className="text-blue-400 font-semibold">Alert</span>를 선택하면
                              <br />
                              <span className="text-purple-400 font-semibold">AI 기반 트러블슈팅</span>이 시작됩니다
                           </p>
                        </div>

                        {/* Animated Arrow */}
                        <div className="mt-12 animate-in fade-in duration-1000 delay-500">
                           <div className="flex items-center justify-center gap-3 text-gray-500">
                              <svg className="w-6 h-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                              <span className="text-sm font-medium">시작하려면 Alert를 선택하세요</span>
                           </div>
                        </div>

                        {/* Feature Pills */}
                        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 animate-in fade-in duration-1000 delay-700">
                           <div className="group px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-full backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300 hover:scale-105">
                              <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 bg-blue-500 rounded-full group-hover:animate-ping"></div>
                                 <span className="text-sm text-gray-400 group-hover:text-blue-400 transition-colors">실시간 분석</span>
                              </div>
                           </div>
                           <div className="group px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-full backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
                              <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 bg-purple-500 rounded-full group-hover:animate-ping"></div>
                                 <span className="text-sm text-gray-400 group-hover:text-purple-400 transition-colors">자동 진단</span>
                              </div>
                           </div>
                           <div className="group px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-full backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300 hover:scale-105">
                              <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 bg-cyan-500 rounded-full group-hover:animate-ping"></div>
                                 <span className="text-sm text-gray-400 group-hover:text-cyan-400 transition-colors">해결책 제안</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               )}
            </div>

            {/* Floating Approval Button (관리자용) - Slides with drawer */}
            <button
               onClick={() => setShowApprovalDrawer(!showApprovalDrawer)}
               className={`fixed bottom-8 w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-2xl hover:shadow-red-500/80 transition-all duration-300 ease-in-out z-50 flex items-center justify-center group ${
                  showApprovalDrawer ? 'right-[42rem] rounded-l-2xl shadow-red-500/60' : 'right-8 rounded-full shadow-red-500/50 hover:scale-110'
               }`}
               style={{
                  animation: pendingCount > 0 && !showApprovalDrawer ? 'bounce-soft 2s infinite' : undefined,
               }}
            >
               {showApprovalDrawer ? (
                  <svg className="w-7 h-7 transition-transform duration-200 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
               ) : (
                  <div className="relative">
                     <svg className="w-7 h-7 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                     </svg>
                     {pendingCount > 0 && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 text-gray-900 rounded-full flex items-center justify-center text-xs font-bold shadow-lg shadow-yellow-400/50 animate-bounce-soft">
                           {pendingCount}
                        </div>
                     )}
                  </div>
               )}
            </button>

            {/* Add custom animation keyframes */}
            <style jsx>{`
               @keyframes bounce-soft {
                  0%,
                  100% {
                     transform: translateY(0);
                  }
                  50% {
                     transform: translateY(-10px);
                  }
               }
               @keyframes animate-bounce-soft {
                  0%,
                  100% {
                     transform: scale(1);
                  }
                  50% {
                     transform: scale(1.1);
                  }
               }
            `}</style>

            {/* Approval Drawer */}
            <ApprovalDrawer open={showApprovalDrawer} onClose={() => setShowApprovalDrawer(false)} onApprovalDecision={handleApprovalDecision} />
         </div>
      </div>
   );
}
