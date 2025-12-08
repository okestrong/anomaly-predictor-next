'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getPendingApprovals, decideApproval, PendingApproval } from '@/lib/executorApi';

interface ApprovalDrawerProps {
  open: boolean;
  onClose: () => void;
  onApprovalDecision?: () => void; // 승인/거부 후 호출되어 pending count 갱신
}

export default function ApprovalDrawer({
  open,
  onClose,
  onApprovalDecision
}: ApprovalDrawerProps) {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set()); // 처리 중인 request_id들
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [comments, setComments] = useState<Map<string, string>>(new Map()); // request_id → comment
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);

  const ADMIN_PASSWORD = 'okestro';
  const FETCH_DEBOUNCE_MS = 1000; // 최소 1초 간격으로 fetch

  // placeholder 패턴 검사 (<...> 형태)
  const hasPlaceholder = (approval: PendingApproval): boolean => {
    const fullCommand = `${approval.command} ${approval.args.join(' ')}`;
    return /<[^>]+>/.test(fullCommand);
  };

  // 슬라이드 애니메이션 완료 후 비밀번호 필드에 focus
  useEffect(() => {
    if (open && !isAuthenticated) {
      // CSS transition duration (300ms) 후에 focus
      const timer = setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [open, isAuthenticated]);

  // Fetch pending approvals when drawer opens and user is authenticated
  useEffect(() => {
    if (open && isAuthenticated) {
      fetchPendingApprovals();
    }
  }, [open, isAuthenticated]);

  // Reset authentication when drawer closes
  useEffect(() => {
    if (!open) {
      setIsAuthenticated(false);
      setPassword('');
      setAuthError('');
      setComments(new Map());
      setPendingApprovals([]);
      setProcessingIds(new Set());
      // 예약된 fetch 취소
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    }
  }, [open]);

  // Debounced fetch - rate limit 방지
  const fetchPendingApprovals = useCallback(async (immediate = false) => {
    // 이전 예약된 fetch 취소
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;

    // immediate가 아니고 최근에 fetch했으면 debounce
    if (!immediate && timeSinceLastFetch < FETCH_DEBOUNCE_MS) {
      fetchTimeoutRef.current = setTimeout(() => {
        fetchPendingApprovals(true);
      }, FETCH_DEBOUNCE_MS - timeSinceLastFetch);
      return;
    }

    setLoading(true);
    lastFetchRef.current = now;

    try {
      const data = await getPendingApprovals();
      setPendingApprovals(data.pending_approvals);
    } catch (error) {
      console.error('Failed to fetch pending approvals:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError('');
      setPassword('');
    } else {
      setAuthError('비밀번호가 올바르지 않습니다.');
      setPassword('');
    }
  };

  const handleApprove = async (requestId: string) => {
    // 이미 처리 중이면 무시
    if (processingIds.has(requestId)) return;

    // 처리 중 상태 추가
    setProcessingIds(prev => new Set(prev).add(requestId));

    try {
      const comment = comments.get(requestId) || '';

      await decideApproval(requestId, {
        decision: 'approve',
        approver: 'admin',
        comment: comment || '승인됨',
      });

      // UI에서 즉시 제거 (optimistic update)
      setPendingApprovals(prev => prev.filter(a => a.request_id !== requestId));

      // Notify parent to refresh pending count
      if (onApprovalDecision) {
        onApprovalDecision();
      }

      // 백그라운드에서 목록 동기화 (debounced)
      fetchPendingApprovals();

    } catch (error: any) {
      console.error('Error approving command:', error);
      alert(`승인 실패: ${error.message}`);
      // 실패 시 목록 다시 로드
      fetchPendingApprovals(true);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleReject = async (requestId: string) => {
    // 이미 처리 중이면 무시
    if (processingIds.has(requestId)) return;

    // 처리 중 상태 추가
    setProcessingIds(prev => new Set(prev).add(requestId));

    try {
      const comment = comments.get(requestId) || '';

      await decideApproval(requestId, {
        decision: 'reject',
        approver: 'admin',
        comment: comment || '관리자가 실행을 거부했습니다.',
      });

      // UI에서 즉시 제거 (optimistic update)
      setPendingApprovals(prev => prev.filter(a => a.request_id !== requestId));

      // Notify parent to refresh pending count
      if (onApprovalDecision) {
        onApprovalDecision();
      }

      // 백그라운드에서 목록 동기화 (debounced)
      fetchPendingApprovals();

    } catch (error: any) {
      console.error('Error rejecting command:', error);
      alert(`거부 실패: ${error.message}`);
      // 실패 시 목록 다시 로드
      fetchPendingApprovals(true);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const updateComment = (requestId: string, comment: string) => {
    setComments(prev => new Map(prev).set(requestId, comment));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 z-40 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
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
            {/* Password Authentication Screen */}
            {!isAuthenticated ? (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="w-full max-w-md">
                  {/* Lock Icon */}
                  <div className="flex justify-center mb-8">
                    <div className="p-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full">
                      <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      관리자 인증 필요
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      위험한 명령어 실행 승인을 위해 관리자 비밀번호를 입력하세요
                    </p>
                  </div>

                  {/* Password Form */}
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        비밀번호
                      </label>
                      <input
                        ref={passwordInputRef}
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="관리자 비밀번호 입력"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                      {authError && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          {authError}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!password}
                      className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      인증하기
                    </button>
                  </form>

                  {/* Info */}
                  <div className="mt-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">ℹ️ 참고:</span> 관리자만 위험한 명령어의 실행을 승인하거나 거부할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Approval Screen - List of all pending approvals
              <>
            {/* Info Header */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 rounded">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-700 dark:text-blue-400">
                  <p className="font-medium mb-1">승인 관리</p>
                  <p className="text-xs">
                    승인 대기 중인 명령어를 검토하고 승인 또는 거부하세요. 모든 결정은 로그에 기록됩니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">승인 목록 불러오는 중...</span>
              </div>
            )}

            {/* Empty State */}
            {!loading && pendingApprovals.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  승인 대기 중인 명령어가 없습니다
                </p>
              </div>
            )}

            {/* Pending Approvals List */}
            {!loading && pendingApprovals.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    승인 대기 중인 명령어 ({pendingApprovals.length}건)
                  </h3>
                  <button
                    onClick={() => fetchPendingApprovals(true)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    🔄 새로고침
                  </button>
                </div>

                <div className="space-y-4">
                  {pendingApprovals.map((approval) => (
                    <div
                      key={approval.request_id}
                      className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            approval.risk_level === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                            approval.risk_level === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' :
                            approval.risk_level === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                            'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          }`}>
                            {approval.risk_level.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            요청 ID: {approval.request_id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>

                      {/* Command */}
                      <div className="bg-black rounded-lg p-3 mb-3">
                        <code className="text-sm font-mono text-green-400">
                          $ {approval.command} {approval.args.join(' ')}
                        </code>
                      </div>

                      {/* Placeholder Warning */}
                      {hasPlaceholder(approval) && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-600 rounded-lg p-3 mb-3">
                          <div className="flex gap-2 items-start">
                            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div className="text-sm text-amber-800 dark:text-amber-300">
                              <p className="font-medium mb-1">⚠️ Placeholder 값이 포함되어 있습니다</p>
                              <p className="text-xs text-amber-700 dark:text-amber-400">
                                명령어에 <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">&lt;...&gt;</code> 형태의 placeholder가 있습니다.
                                실제 값으로 대체한 후 다시 요청해주세요.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Risk Description */}
                      {approval.risk_description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span className="font-medium">위험도 설명:</span> {approval.risk_description}
                        </p>
                      )}

                      {/* Potential Impacts */}
                      {approval.potential_impacts && approval.potential_impacts.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            예상 영향:
                          </div>
                          <ul className="space-y-1">
                            {approval.potential_impacts.map((impact, i) => (
                              <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex gap-2">
                                <span>•</span>
                                <span>{impact}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Request Info */}
                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">요청자:</span>
                          <span className="ml-1 text-gray-700 dark:text-gray-300">{approval.requester}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">요청 시각:</span>
                          <span className="ml-1 text-gray-700 dark:text-gray-300">
                            {new Date(approval.requested_at).toLocaleString('ko-KR')}
                          </span>
                        </div>
                        {approval.request_reason && (
                          <div className="col-span-2">
                            <span className="text-gray-500 dark:text-gray-400">요청 사유:</span>
                            <span className="ml-1 text-gray-700 dark:text-gray-300">{approval.request_reason}</span>
                          </div>
                        )}
                      </div>

                      {/* Comment Input */}
                      <div className="mb-3">
                        <textarea
                          value={comments.get(approval.request_id) || ''}
                          onChange={(e) => updateComment(approval.request_id, e.target.value)}
                          rows={2}
                          placeholder="승인/거부 사유 (선택사항)..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(approval.request_id)}
                          disabled={processingIds.has(approval.request_id)}
                          className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {processingIds.has(approval.request_id) ? '처리 중...' : '❌ 거부'}
                        </button>
                        <button
                          onClick={() => handleApprove(approval.request_id)}
                          disabled={processingIds.has(approval.request_id)}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 text-white hover:bg-green-700"
                        >
                          {processingIds.has(approval.request_id) ? '처리 중...' : '✅ 승인'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
