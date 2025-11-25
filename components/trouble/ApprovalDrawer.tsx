'use client';

import React, { useState } from 'react';
import { useTroubleWebSocket } from '@/hooks/useTroubleWebSocket';

interface ApprovalDrawerProps {
  open: boolean;
  onClose: () => void;
  approvalData: any;
  threadId: string | null;
  onDecision: (approved: boolean, comment?: string) => void;
}

export default function ApprovalDrawer({
  open,
  onClose,
  approvalData,
  threadId,
  onDecision
}: ApprovalDrawerProps) {
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  const { approveCommand } = useTroubleWebSocket({
    threadId,
    onMessage: () => {}
  });

  const handleApprove = async () => {
    if (!approvalData || !threadId) return;

    setProcessing(true);
    try {
      // Extract request ID from approval data
      const requestId = approvalData.requestId || Object.keys(approvalData)[0];

      approveCommand(requestId, true, comment);
      onDecision(true, comment);

      // Reset and close
      setComment('');
      onClose();
    } catch (error) {
      console.error('Error approving command:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = () => {
    if (!approvalData || !threadId) return;

    setProcessing(true);
    try {
      const requestId = approvalData.requestId || Object.keys(approvalData)[0];

      approveCommand(requestId, false, comment || '관리자가 실행을 거부했습니다.');
      onDecision(false, comment);

      // Reset and close
      setComment('');
      onClose();
    } catch (error) {
      console.error('Error rejecting command:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (!open) return null;

  const getCommandDetails = () => {
    if (!approvalData) return null;

    // Handle different approval data structures
    if (approvalData.command) {
      return [approvalData];
    }

    // If it's a map of command results
    return Object.entries(approvalData).map(([cmd, result]: [string, any]) => ({
      command: cmd,
      ...result
    }));
  };

  const commands = getCommandDetails();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity z-40 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-gray-800 shadow-2xl transform transition-transform z-50 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  명령어 실행 승인 필요
                </h2>
                <p className="text-sm text-red-600 dark:text-red-400">
                  위험한 명령어 실행을 승인해주세요
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                    주의사항
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    다음 명령어는 클러스터에 영향을 줄 수 있습니다.
                    실행 전에 명령어 내용을 신중히 검토해주세요.
                  </p>
                </div>
              </div>
            </div>

            {/* Commands to Approve */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                승인 대기 중인 명령어:
              </h3>
              <div className="space-y-3">
                {commands && commands.map((cmd: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-medium rounded">
                          {cmd.riskLevel || 'HIGH'}
                        </span>
                        {cmd.requiresApproval && (
                          <span className="text-xs text-yellow-600 dark:text-yellow-400">
                            🔒 승인 필요
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-black rounded-lg p-3 mb-3">
                      <code className="text-sm font-mono text-green-400">
                        $ {cmd.command}
                      </code>
                    </div>

                    {cmd.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {cmd.description}
                      </p>
                    )}

                    {cmd.potentialImpacts && cmd.potentialImpacts.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          예상 영향:
                        </div>
                        <ul className="space-y-1">
                          {cmd.potentialImpacts.map((impact: string, i: number) => (
                            <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex gap-2">
                              <span>•</span>
                              <span>{impact}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {cmd.stdout && (
                      <div className="mt-2">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          출력:
                        </div>
                        <pre className="text-xs bg-black text-green-400 p-2 rounded overflow-x-auto">
                          {cmd.stdout}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                승인/거부 사유 (선택사항):
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="승인 또는 거부 사유를 입력하세요..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 rounded">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-700 dark:text-blue-400">
                  <p className="font-medium mb-1">참고:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• 승인 시 즉시 명령어가 실행됩니다</li>
                    <li>• 거부 시 트러블슈팅이 중단됩니다</li>
                    <li>• 모든 승인/거부 내역은 로그에 기록됩니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? '처리 중...' : '❌ 거부'}
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? '처리 중...' : '✅ 승인 및 실행'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
