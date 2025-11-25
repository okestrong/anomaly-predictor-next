'use client';

import React, { useState } from 'react';
import AlertListPanel from '@/components/trouble/AlertListPanel';
import ChatInterface from '@/components/trouble/ChatInterface';
import ApprovalDrawer from '@/components/trouble/ApprovalDrawer';
import { AlertInfo } from '@/types/trouble';
import { AppHeader } from '@/components/layout';

/**
 * Trouble Shooting Guide 메인 페이지
 * Alert 기반 AI 대화형 트러블슈팅
 */
export default function TroubleShootingPage() {
   const [selectedAlert, setSelectedAlert] = useState<AlertInfo | null>(null);
   const [threadId, setThreadId] = useState<string | null>(null);
   const [showApprovalDrawer, setShowApprovalDrawer] = useState(false);
   const [pendingApproval, setPendingApproval] = useState<any>(null);

   const handleAlertSelect = (alert: AlertInfo) => {
      setSelectedAlert(alert);
      // 새로운 스레드 ID 생성
      const newThreadId = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setThreadId(newThreadId);
   };

   const handleApprovalRequired = (approvalData: any) => {
      setPendingApproval(approvalData);
      setShowApprovalDrawer(true);
   };

   const handleApprovalDecision = (approved: boolean, comment?: string) => {
      setShowApprovalDrawer(false);
      // 승인 결과는 ChatInterface에서 처리
   };

   return (
      <div className="min-h-screen relative flex flex-col">
         <AppHeader />
         <div className="flex flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Left Panel: Alert List */}
            <div className="w-[400px] border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
               <AlertListPanel selectedAlert={selectedAlert} onAlertSelect={handleAlertSelect} />
            </div>

            {/* Main Content: Chat Interface */}
            <div className="flex-1 flex flex-col">
               {selectedAlert && threadId ? (
                  <ChatInterface alert={selectedAlert} threadId={threadId} onApprovalRequired={handleApprovalRequired} />
               ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                     <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                           />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Alert를 선택하세요</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">왼쪽 목록에서 분석할 Alert를 선택하면 AI 트러블슈팅이 시작됩니다.</p>
                     </div>
                  </div>
               )}
            </div>

            {/* Approval Drawer */}
            <ApprovalDrawer
               open={showApprovalDrawer}
               onClose={() => setShowApprovalDrawer(false)}
               approvalData={pendingApproval}
               threadId={threadId}
               onDecision={handleApprovalDecision}
            />
         </div>
      </div>
   );
}
