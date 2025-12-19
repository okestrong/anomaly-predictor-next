'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
   AlertInfo,
   Message,
   TroubleResponse,
   DiagnosisResult,
   Solution,
   WorkflowStatus,
   ResponseType,
   CommandToExecute,
   ApprovalStatusChangedMetadata,
} from '@/types/trouble';
import { useTroubleWebSocket } from '@/hooks/useTroubleWebSocket';
import MarkdownRenderer from './MarkdownRenderer';
import SolutionCard from './SolutionCard';
import DiagnosisCard from './DiagnosisCard';
import { executeCommand, executeApprovedCommand, getCommandStatus, CommandResponse } from '@/lib/executorApi';
import CommandParameterDialog from './CommandParameterDialog';
import WebTerminal from './WebTerminal';
import { getCurrentLocale } from '@/lib/api/client';
import { useApprovalStore } from '@/stores/approvalStore';
import {
   ChatSession,
   TerminalLine,
   PendingCommand,
   getAlertTimestamp,
   saveSession,
   loadSession,
   hasSession as checkHasSession,
   saveAlertMeta,
   loadAlertMeta,
   migrateOldKeys,
   cleanupOldHistory,
} from '@/lib/alertSessionStorage';

interface ChatInterfaceProps {
   alert: AlertInfo;
   threadId: string;
   onProcessingChange?: (isProcessing: boolean) => void;
}

export default function ChatInterface({ alert, threadId, onProcessingChange }: ChatInterfaceProps) {
   const [messages, setMessages] = useState<Message[]>([]);
   const [inputMessage, setInputMessage] = useState('');
   const [currentStatus, setCurrentStatus] = useState<WorkflowStatus | null>(null);
   const [currentNode, setCurrentNode] = useState<string | null>(null);
   const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
   const [solutions, setSolutions] = useState<Solution[]>([]);
   const [isProcessing, setIsProcessing] = useState(false);

   // 스트리밍 메시지 상태 (타이핑 효과용)
   const [streamingMessage, setStreamingMessage] = useState<string>('');

   // 진단 타이핑 완료를 위한 상태
   const [pendingSolutions, setPendingSolutions] = useState<Solution[] | null>(null);
   const [pendingSolutionsMessage, setPendingSolutionsMessage] = useState<string | null>(null);
   const [showSolutions, setShowSolutions] = useState(false);

   // Executor API 관련 상태
   const [pendingApprovals, setPendingApprovals] = useState<Map<string, string[]>>(new Map()); // solutionId → request_ids[]
   const [commandStatuses, setCommandStatuses] = useState<Map<string, CommandResponse>>(new Map()); // request_id → status
   const [solutionsAwaitingApproval, setSolutionsAwaitingApproval] = useState<Map<string, { solution: Solution; index: number }>>(new Map()); // solutionId → solution info

   // 기존 세션 복원 여부
   const [sessionRestored, setSessionRestored] = useState(false);

   // 현재 분석이 시작된 alertId를 추적 (새 alert 클릭 시 재시작 보장)
   const startedAlertIdRef = useRef<string | null>(null);

   // 파라미터 입력 다이얼로그 상태
   const [parameterDialogOpen, setParameterDialogOpen] = useState(false);
   const [pendingExecutionSolution, setPendingExecutionSolution] = useState<{ solution: Solution; index: number } | null>(null);

   // 웹 터미널 상태 (placeholder + 승인필요 케이스)
   const [webTerminalSolution, setWebTerminalSolution] = useState<{
      solution: Solution;
      index: number;
      approvedCommands?: Map<string, string>;
   } | null>(null);

   // 수동 웹 터미널 상태 (사용자가 직접 여는 터미널)
   const [manualWebTerminalOpen, setManualWebTerminalOpen] = useState(false);

   // 웹 터미널 데이터 저장용 상태
   const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
   const [terminalPendingCommands, setTerminalPendingCommands] = useState<Record<string, PendingCommand>>({});

   // 터미널 데이터 변경 핸들러 (메모이제이션으로 무한 루프 방지)
   const handleTerminalDataChange = useCallback((lines: TerminalLine[], pendingCmds: Record<string, PendingCommand>) => {
      setTerminalLines(lines);
      setTerminalPendingCommands(pendingCmds);
   }, []);

   const messagesEndRef = useRef<HTMLDivElement>(null);
   const inputRef = useRef<HTMLTextAreaElement>(null);
   const hasStartedRef = useRef(false);
   const currentAlertTimestampRef = useRef<number>(0);

   // Approval store
   const { updateApprovalStatus, getGroupStatus } = useApprovalStore();

   // 승인 상태 변경 핸들러
   const handleApprovalStatusChanged = useCallback(
      (metadata: ApprovalStatusChangedMetadata) => {
         console.log('📡 Approval status changed:', metadata);

         // Store 업데이트
         const status = metadata.decision === 'approve' ? 'approved' : 'rejected';
         updateApprovalStatus(metadata.requestId, status);

         // commandStatuses도 업데이트
         setCommandStatuses(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(metadata.requestId);
            if (existing) {
               newMap.set(metadata.requestId, {
                  ...existing,
                  status: status,
               });
            }
            return newMap;
         });
      },
      [updateApprovalStatus],
   );

   // WebSocket 연결
   const { connected, connecting, startTroubleshooting, sendMessage, selectSolution } = useTroubleWebSocket({
      threadId,
      onMessage: handleWebSocketMessage,
      onApprovalStatusChanged: handleApprovalStatusChanged,
   });

   // 마이그레이션 및 클린업 (마운트 시 한 번만)
   useEffect(() => {
      migrateOldKeys();
      cleanupOldHistory();
   }, []);

   // alert 변경 시 세션 관리 (localStorage 연동)
   useEffect(() => {
      const alertTimestamp = getAlertTimestamp(alert);

      // 같은 alert인 경우 무시 (무한루프 방지)
      if (currentAlertTimestampRef.current === alertTimestamp) {
         return;
      }

      // 이전 세션 저장 (이전 alert가 있는 경우)
      if (currentAlertTimestampRef.current && messages.length > 0) {
         saveSession(currentAlertTimestampRef.current, {
            messages,
            diagnosis,
            solutions,
            isCompleted: !isProcessing,
            lastUpdated: new Date().toISOString(),
            terminalLines,
            pendingCommands: terminalPendingCommands,
         });
      }

      // 현재 alert timestamp 업데이트
      currentAlertTimestampRef.current = alertTimestamp;
      hasStartedRef.current = false;

      // 기존 세션 확인 (active와 history 모두에서 찾음)
      const existingSession = loadSession(alertTimestamp);

      if (existingSession && existingSession.messages.length > 0) {
         // 기존 세션 복원
         setMessages(existingSession.messages);
         setDiagnosis(existingSession.diagnosis);
         setSolutions(existingSession.solutions);
         setShowSolutions(existingSession.solutions.length > 0);
         setSessionRestored(true);
         setIsProcessing(false);
         hasStartedRef.current = true; // 이미 시작된 것으로 표시
         startedAlertIdRef.current = `${alert.alertId}-${alert.timestamp}`; // 복원된 alert 기록
         // 터미널 데이터 복원
         setTerminalLines(existingSession.terminalLines || []);
         setTerminalPendingCommands(existingSession.pendingCommands || {});
      } else {
         // 새 세션 초기화
         setMessages([]);
         setDiagnosis(null);
         setSolutions([]);
         setShowSolutions(false);
         setSessionRestored(false);
         setTerminalLines([]);
         setTerminalPendingCommands({});
         startedAlertIdRef.current = null; // 새 alert이므로 초기화
      }

      // Alert 메타 정보 저장 (세션 존재 여부 및 alertInfo 저장)
      saveAlertMeta(alertTimestamp, {
         alertInfo: alert,
         timestamp: alertTimestamp,
         hasSession: checkHasSession(alertTimestamp),
      });

      // 공통 초기화
      setStreamingMessage('');
      setPendingSolutions(null);
      setPendingSolutionsMessage(null);
      setPendingApprovals(new Map());
      setCommandStatuses(new Map());
      setSolutionsAwaitingApproval(new Map());
      setCurrentStatus(null); // 상태 배지 초기화
      setCurrentNode(null);
   }, [alert.alertId, alert.timestamp]); // alertId와 timestamp를 의존성으로 사용

   // 진단 타이핑 완료 후 해결책 표시
   useEffect(() => {
      if (showSolutions && pendingSolutions) {
         // 메시지 추가
         if (pendingSolutionsMessage) {
            setMessages(prev => [
               ...prev,
               {
                  role: 'assistant',
                  content: pendingSolutionsMessage,
                  timestamp: new Date().toISOString(),
               },
            ]);
            setPendingSolutionsMessage(null);
         }
         // 해결책 표시
         setSolutions(pendingSolutions);
         setPendingSolutions(null);
      }
   }, [showSolutions, pendingSolutions, pendingSolutionsMessage]);

   // isProcessing 상태 변경 시 부모에게 알림
   useEffect(() => {
      onProcessingChange?.(isProcessing);
   }, [isProcessing, onProcessingChange]);

   // 세션 자동 저장 (messages, diagnosis, solutions, 터미널 데이터 변경 시)
   useEffect(() => {
      const alertTimestamp = currentAlertTimestampRef.current;
      if (alertTimestamp && messages.length > 0) {
         saveSession(alertTimestamp, {
            messages,
            diagnosis,
            solutions,
            isCompleted: !isProcessing,
            lastUpdated: new Date().toISOString(),
            terminalLines,
            pendingCommands: terminalPendingCommands,
         });

         // 메타 정보도 업데이트 (hasSession = true)
         saveAlertMeta(alertTimestamp, {
            alertInfo: alert,
            timestamp: alertTimestamp,
            hasSession: true,
         });
      }
   }, [messages, diagnosis, solutions, isProcessing, terminalLines, terminalPendingCommands]);

   // 초기 실행 (한 번만, 세션이 복원되지 않은 경우에만)
   useEffect(() => {
      // 이미 이 alert에 대해 시작했거나, 세션이 복원된 경우 스킵
      const currentAlertId = `${alert.alertId}-${alert.timestamp}`;
      const alreadyStartedForThisAlert = startedAlertIdRef.current === currentAlertId;

      if (connected && alert && !alreadyStartedForThisAlert && !sessionRestored) {
         const success = startTroubleshooting({
            threadId,
            alertInfo: alert,
            message: `Alert "${alert.title}"에 대해 분석하고 해결 방법을 제안해주세요.`,
            targetLanguage: getCurrentLocale(), // 현재 locale 전달 (번역용)
         });

         if (success) {
            startedAlertIdRef.current = currentAlertId;
            hasStartedRef.current = true;
            setIsProcessing(true);
         } else {
            // WebSocket이 아직 준비되지 않음 - 다음 connected 변경 시 재시도됨
            console.log('Troubleshooting start failed - WebSocket not ready, will retry on next connected change');
         }
      }
   }, [connected, alert, threadId, startTroubleshooting, sessionRestored]);

   // WebSocket 메시지 처리
   function handleWebSocketMessage(response: TroubleResponse) {
      console.log('Processing response:', response.type);

      // 스트리밍이 끝나고 특정 메시지가 오면 스트리밍 메시지를 완료
      // SOLUTIONS 메시지가 오면 스트리밍이 완료된 것으로 간주
      const shouldCompleteStreaming = response.type === ResponseType.SOLUTIONS && streamingMessage && streamingMessage.trim().length > 0;

      if (shouldCompleteStreaming) {
         setMessages(prev => [
            ...prev,
            {
               role: 'assistant',
               content: streamingMessage,
               timestamp: new Date().toISOString(),
            },
         ]);
         setStreamingMessage('');
      }

      switch (response.type) {
         case ResponseType.INITIALIZED:
            setCurrentStatus(response.status || null);
            break;

         case ResponseType.NODE_START:
            setCurrentNode(response.currentNode || null);
            setCurrentStatus(response.status || null);
            break;

         case ResponseType.MESSAGE:
            if (response.message) {
               console.log('📨 Received MESSAGE:', {
                  role: response.message.role,
                  content: response.message.content.substring(0, 100),
               });
               setMessages(prev => [...prev, response.message!]);
            }
            break;

         case ResponseType.STREAMING_CHUNK:
            // LLM 스트리밍 토큰을 받아서 타이핑 효과 구현
            if (response.message?.content) {
               setStreamingMessage(prev => prev + response.message!.content);
            }
            break;

         case ResponseType.DIAGNOSIS:
            if (response.diagnosis) {
               setDiagnosis(response.diagnosis);
               setMessages(prev => [
                  ...prev,
                  {
                     role: 'assistant',
                     content: '진단을 완료했습니다.',
                     timestamp: new Date().toISOString(),
                  },
               ]);

               // 진단 타이핑 시간 계산 (3글자씩 15ms 간격)
               const typingDuration = response.diagnosis.details
                  ? (response.diagnosis.details.length / 3) * 15 + 500 // 500ms 여유
                  : 0;

               // 타이핑 완료 후 solutions 표시 가능하도록 설정
               setTimeout(() => {
                  setShowSolutions(true);
               }, typingDuration);
            }
            break;

         case ResponseType.SOLUTIONS:
            if (response.solutions) {
               // 진단 타이핑이 완료될 때까지 대기
               setPendingSolutions(response.solutions);
               setPendingSolutionsMessage(`${response.solutions!.length}개의 해결책을 생성했습니다.`);
            }
            break;

         case ResponseType.EXECUTION_RESULT:
            // 실행 결과는 이제 메시지로 처리됨 (CommandExecutionNode에서 처리)
            break;

         case ResponseType.APPROVAL_REQUIRED:
            if (response.executionResults) {
               onApprovalRequired(response.executionResults);
            }
            setIsProcessing(false);
            break;

         case ResponseType.COMPLETED:
            setCurrentStatus(response.status || null);
            setIsProcessing(false);
            break;

         case ResponseType.ERROR:
            if (response.error) {
               setMessages(prev => [
                  ...prev,
                  {
                     role: 'assistant',
                     content: `❌ Error: ${response.error!.message}`,
                     timestamp: new Date().toISOString(),
                  },
               ]);
            }
            setIsProcessing(false);
            break;

         case ResponseType.PROGRESS:
            // Progress update
            break;
      }
   }

   // 자동 스크롤
   useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
   }, [messages, streamingMessage]);

   // 진단 타이핑 중 주기적 스크롤 (100ms 간격)
   useEffect(() => {
      if (diagnosis && !showSolutions) {
         const scrollInterval = setInterval(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
         }, 100);
         return () => clearInterval(scrollInterval);
      }
   }, [diagnosis, showSolutions]);

   // 메시지 전송
   const handleSendMessage = () => {
      if (!inputMessage.trim() || !connected) return;

      const userMessage: Message = {
         role: 'user',
         content: inputMessage,
         timestamp: new Date().toISOString(),
      };

      console.log('📤 Sending USER message:', {
         role: userMessage.role,
         content: userMessage.content,
      });
      setMessages(prev => [...prev, userMessage]);
      sendMessage(inputMessage);
      setInputMessage('');
      setIsProcessing(true);

      // 새 대화 시작 시 이전 진단/해결책 상태 초기화하지 않음
      // (대화 컨텍스트 유지)
   };

   // 해결책 실행
   // 승인 필요 처리
   const onApprovalRequired = (executionResults: Record<string, any>) => {
      // executionResults에서 request_id를 추출하여 pendingApprovals에 저장
      Object.entries(executionResults).forEach(([key, result]) => {
         if (result.request_id) {
            // solutionId는 현재 선택된 solution의 id를 사용해야 하는데,
            // executionResults만으로는 알 수 없으므로 key를 사용
            setPendingApprovals(prev => new Map(prev).set(key, result.request_id));
            setCommandStatuses(prev => new Map(prev).set(result.request_id, result));
         }
      });

      setMessages(prev => [
         ...prev,
         {
            role: 'assistant',
            content: '⏳ **관리자 승인이 필요한 명령어가 있습니다.**\n\n관리자가 승인하면 명령어가 실행됩니다.',
            timestamp: new Date().toISOString(),
         },
      ]);
   };

   // 명령어에 placeholder가 있는지 확인
   const hasPlaceholder = (commands: CommandToExecute[]): boolean => {
      return commands.some(cmd => {
         const fullCommand = `${cmd.command} ${cmd.args.join(' ')}`;
         return /<[^>]+>/.test(fullCommand);
      });
   };

   const handleExecuteSolution = async (solution: Solution, index: number) => {
      try {
         const solutionId = solution.id;

         // Read-only solution인 경우 실행하지 않음
         if (solution.readOnly || !solution.commands || solution.commands.length === 0) {
            setMessages(prev => [
               ...prev,
               {
                  role: 'assistant',
                  content: '이 해결책은 정보 제공용입니다. 실행할 명령어가 없습니다.',
                  timestamp: new Date().toISOString(),
               },
            ]);
            return;
         }

         // 분기 조건 확인
         const hasPlaceholders = hasPlaceholder(solution.commands);
         const approvalRequiredCommands = solution.commands.filter(cmd => cmd.requiresApproval);
         const needsApproval = approvalRequiredCommands.length > 0;

         /*
          * 4가지 분기 로직:
          * 1. placeholder + 승인필요 → 승인요청 → 승인완료 → 웹 터미널
          * 2. placeholder + 승인불필요 → CommandParameterDialog → 순차 실행
          * 3. No placeholder + 승인필요 → 승인요청 → 승인완료 → 순차 실행
          * 4. No placeholder + 승인불필요 → 바로 순차 실행
          */

         if (hasPlaceholders && needsApproval) {
            // Case 1: placeholder + 승인필요 → 모든 승인필요 명령어 승인요청 → 승인완료 → 웹 터미널
            const approvalCommandsList = approvalRequiredCommands.map(cmd => `• \`${cmd.command} ${cmd.args.join(' ')}\``).join('\n');

            setMessages(prev => [
               ...prev,
               {
                  role: 'assistant',
                  content: `⚠️ **승인이 필요한 명령어가 있습니다**\n\n이 해결책에는 관리자 승인이 필요한 명령어와 사용자 입력이 필요한 placeholder가 포함되어 있습니다.\n\n**승인 필요 명령어:**\n${approvalCommandsList}\n\n승인 요청을 제출합니다...\n승인 완료 후 **웹 터미널**에서 placeholder 값을 입력하여 명령어를 실행할 수 있습니다.`,
                  timestamp: new Date().toISOString(),
               },
            ]);

            // 모든 승인필요 명령어에 대해 승인 요청 (placeholder 유무 관계없이)
            const requestIds: string[] = [];
            let approvalRequestFailed = false;

            for (const cmd of approvalRequiredCommands) {
               try {
                  const response = await executeCommand({
                     command: cmd.command,
                     args: cmd.args,
                     timeout: cmd.timeout || 30,
                     context: {
                        requester: 'trouble-guide-user',
                        request_reason: `Solution #${index + 1}: ${solution.title}`,
                        session_id: threadId,
                     },
                  });

                  setCommandStatuses(prev => new Map(prev).set(response.request_id, response));

                  if (response.status === 'pending_approval') {
                     requestIds.push(response.request_id);
                  } else if (response.status === 'failed') {
                     // whitelist에 없거나 실행 실패
                     setMessages(prev => [
                        ...prev,
                        {
                           role: 'assistant',
                           content: `❌ **승인 요청 실패**: 명령어 \`${cmd.command} ${cmd.args.join(' ')}\`가 명령어 관리 목록에 없어서 승인 요청을 할 수 없습니다.\n\n관리자에게 문의해주세요.`,
                           timestamp: new Date().toISOString(),
                        },
                     ]);
                     approvalRequestFailed = true;
                     break;
                  } else if (response.status === 'completed') {
                     // 승인 없이 바로 실행된 경우 (승인 불필요 명령어)
                     requestIds.push(response.request_id);
                  }
               } catch (error: any) {
                  setMessages(prev => [
                     ...prev,
                     {
                        role: 'assistant',
                        content: `❌ **승인 요청 실패**: \`${cmd.command}\` - ${error.message}\n\n관리자에게 문의해주세요.`,
                        timestamp: new Date().toISOString(),
                     },
                  ]);
                  approvalRequestFailed = true;
                  break;
               }
            }

            if (!approvalRequestFailed && requestIds.length > 0) {
               setPendingApprovals(prev => new Map(prev).set(solutionId, requestIds));
               setSolutionsAwaitingApproval(prev => new Map(prev).set(solutionId, { solution, index }));

               setMessages(prev => [
                  ...prev,
                  {
                     role: 'assistant',
                     content: `📋 **${requestIds.length}개의 승인 요청이 제출되었습니다**\n\n관리자가 모든 명령어를 승인하면, 아래 **"승인 확인"** 버튼을 클릭하세요.\n승인 완료 후 **웹 터미널**이 열리며, placeholder 값을 직접 입력하여 명령어를 실행할 수 있습니다.`,
                     timestamp: new Date().toISOString(),
                  },
               ]);
            }
         } else if (hasPlaceholders && !needsApproval) {
            // Case 2: placeholder + 승인불필요 → CommandParameterDialog → 순차 실행
            setMessages(prev => [
               ...prev,
               {
                  role: 'assistant',
                  content: `📝 **파라미터 입력이 필요합니다**\n\n명령어에 입력이 필요한 placeholder가 포함되어 있습니다.\n파라미터 입력 창이 열립니다.`,
                  timestamp: new Date().toISOString(),
               },
            ]);

            // CommandParameterDialog 열기
            setPendingExecutionSolution({ solution, index });
            setParameterDialogOpen(true);
         } else if (!hasPlaceholders && needsApproval) {
            // Case 3: No placeholder + 승인필요 → 승인요청 → 승인완료 → 순차 실행
            const approvalCommandsList = approvalRequiredCommands.map(cmd => `• \`${cmd.command} ${cmd.args.join(' ')}\``).join('\n');

            setMessages(prev => [
               ...prev,
               {
                  role: 'assistant',
                  content: `⚠️ **승인이 필요한 명령어가 있습니다**\n\n이 해결책에는 관리자 승인이 필요한 명령어가 포함되어 있습니다.\n명령어는 순서대로 실행되어야 하므로, 모든 승인이 완료된 후에 실행됩니다.\n\n**승인 필요 명령어:**\n${approvalCommandsList}\n\n승인 요청을 제출합니다...`,
                  timestamp: new Date().toISOString(),
               },
            ]);

            // 승인 요청 제출 (승인 필요 명령어만)
            const requestIds: string[] = [];
            let approvalRequestFailed = false;

            for (const cmd of approvalRequiredCommands) {
               try {
                  const response = await executeCommand({
                     command: cmd.command,
                     args: cmd.args,
                     timeout: cmd.timeout || 30,
                     context: {
                        requester: 'trouble-guide-user',
                        request_reason: `Solution #${index + 1}: ${solution.title}`,
                        session_id: threadId,
                     },
                  });

                  setCommandStatuses(prev => new Map(prev).set(response.request_id, response));

                  if (response.status === 'pending_approval') {
                     requestIds.push(response.request_id);
                  } else if (response.status === 'failed') {
                     // whitelist에 없거나 실행 실패
                     setMessages(prev => [
                        ...prev,
                        {
                           role: 'assistant',
                           content: `❌ **승인 요청 실패**: 명령어 \`${cmd.command} ${cmd.args.join(' ')}\`가 명령어 관리 목록에 없어서 승인 요청을 할 수 없습니다.\n\n관리자에게 문의해주세요.`,
                           timestamp: new Date().toISOString(),
                        },
                     ]);
                     approvalRequestFailed = true;
                     break;
                  } else if (response.status === 'completed') {
                     // 승인 없이 바로 실행된 경우 (승인 불필요 명령어)
                     requestIds.push(response.request_id);
                  }
               } catch (error: any) {
                  setMessages(prev => [
                     ...prev,
                     {
                        role: 'assistant',
                        content: `❌ **승인 요청 실패**: \`${cmd.command}\` - ${error.message}\n\n관리자에게 문의해주세요.`,
                        timestamp: new Date().toISOString(),
                     },
                  ]);
                  approvalRequestFailed = true;
                  break;
               }
            }

            if (!approvalRequestFailed && requestIds.length > 0) {
               setPendingApprovals(prev => new Map(prev).set(solutionId, requestIds));
               setSolutionsAwaitingApproval(prev => new Map(prev).set(solutionId, { solution, index }));

               setMessages(prev => [
                  ...prev,
                  {
                     role: 'assistant',
                     content: `📋 **${requestIds.length}개의 승인 요청이 제출되었습니다**\n\n관리자가 모든 명령어를 승인하면, 아래 **"승인 확인"** 버튼을 클릭하여 전체 명령어를 순서대로 실행할 수 있습니다.`,
                     timestamp: new Date().toISOString(),
                  },
               ]);
            }
         } else {
            // Case 4: No placeholder + 승인불필요 → 바로 순차 실행
            await executeAllCommandsInSequence(solution, index);
         }
      } catch (error: any) {
         setMessages(prev => [
            ...prev,
            {
               role: 'assistant',
               content: `❌ **오류**: ${error.message}`,
               timestamp: new Date().toISOString(),
            },
         ]);
      }
   };

   // 모든 명령어를 순서대로 실행하는 함수
   // approvedCommands: 승인된 명령어의 request_id 매핑 (command+args 문자열 -> request_id)
   const executeAllCommandsInSequence = async (solution: Solution, index: number, approvedCommands?: Map<string, string>) => {
      setMessages(prev => [
         ...prev,
         {
            role: 'assistant',
            content: `🚀 **명령어 실행을 시작합니다** (총 ${solution.commands.length}개)`,
            timestamp: new Date().toISOString(),
         },
      ]);

      for (let i = 0; i < solution.commands.length; i++) {
         const cmd = solution.commands[i];
         const cmdKey = `${cmd.command} ${cmd.args.join(' ')}`;

         try {
            let response: CommandResponse;

            // 승인된 명령어인지 확인
            const approvedRequestId = approvedCommands?.get(cmdKey);

            if (approvedRequestId) {
               // 승인된 명령어는 executeApprovedCommand로 실행
               response = await executeApprovedCommand(approvedRequestId, cmd.command, cmd.args);
            } else {
               // 승인 불필요 명령어는 일반 executeCommand로 실행
               response = await executeCommand({
                  command: cmd.command,
                  args: cmd.args,
                  timeout: cmd.timeout || 30,
                  context: {
                     requester: 'trouble-guide-user',
                     request_reason: `Solution #${index + 1}: ${solution.title}`,
                     session_id: threadId,
                  },
               });
            }

            setCommandStatuses(prev => new Map(prev).set(response.request_id, response));

            if (response.status === 'completed') {
               setMessages(prev => [
                  ...prev,
                  {
                     role: 'assistant',
                     content: `✅ **[${i + 1}/${solution.commands.length}] 명령어 실행 완료**\n\n\`\`\`bash\n$ ${response.command} ${response.args.join(' ')}\n\`\`\`\n\n**출력:**\n\`\`\`\n${response.stdout || '(출력 없음)'}\n\`\`\``,
                     timestamp: new Date().toISOString(),
                  },
               ]);
            } else if (response.status === 'failed') {
               setMessages(prev => [
                  ...prev,
                  {
                     role: 'assistant',
                     content: `❌ **[${i + 1}/${solution.commands.length}] 명령어 실행 실패**\n\n\`\`\`bash\n$ ${response.command} ${response.args.join(' ')}\n\`\`\`\n\n**오류:**\n\`\`\`\n${response.stderr || '알 수 없는 오류'}\n\`\`\`\n\n⚠️ 오류로 인해 이후 명령어 실행이 중단되었습니다.`,
                     timestamp: new Date().toISOString(),
                  },
               ]);
               // 실패 시 이후 명령어 실행 중단
               return;
            } else if (response.status === 'pending_approval') {
               // 승인 확인 후인데도 pending_approval이 반환된 경우
               setMessages(prev => [
                  ...prev,
                  {
                     role: 'assistant',
                     content: `⏳ **[${i + 1}/${solution.commands.length}] 승인 대기 중**\n\n\`\`\`bash\n$ ${response.command} ${response.args.join(' ')}\n\`\`\`\n\n이 명령어는 아직 승인이 필요합니다. 관리자에게 승인을 요청해주세요.`,
                     timestamp: new Date().toISOString(),
                  },
               ]);
               return;
            }
         } catch (error: any) {
            setMessages(prev => [
               ...prev,
               {
                  role: 'assistant',
                  content: `❌ **[${i + 1}/${solution.commands.length}] 명령어 전송 실패**: ${error.message}\n\n⚠️ 오류로 인해 이후 명령어 실행이 중단되었습니다.`,
                  timestamp: new Date().toISOString(),
               },
            ]);
            return;
         }
      }

      setMessages(prev => [
         ...prev,
         {
            role: 'assistant',
            content: `🎉 **모든 명령어 실행이 완료되었습니다!**`,
            timestamp: new Date().toISOString(),
         },
      ]);
   };

   // 승인 상태 확인 및 전체 명령어 실행
   const checkApprovalStatus = async (solutionId: string) => {
      const requestIds = pendingApprovals.get(solutionId);
      if (!requestIds || requestIds.length === 0) {
         setMessages(prev => [
            ...prev,
            {
               role: 'assistant',
               content: '승인 요청 ID를 찾을 수 없습니다.',
               timestamp: new Date().toISOString(),
            },
         ]);
         return;
      }

      try {
         // 모든 승인 요청의 상태 확인
         const statuses: CommandResponse[] = [];
         for (const requestId of requestIds) {
            const status = await getCommandStatus(requestId);
            setCommandStatuses(prev => new Map(prev).set(requestId, status));
            statuses.push(status);
         }

         // 상태별 분류
         const pending = statuses.filter(s => s.status === 'pending_approval');
         const approved = statuses.filter(s => s.status === 'approved' || s.status === 'completed');
         const rejected = statuses.filter(s => s.status === 'rejected');

         if (rejected.length > 0) {
            // 하나라도 반려되면 전체 실행 불가
            const rejectedCmds = rejected.map(s => `• \`${s.command} ${s.args.join(' ')}\``).join('\n');
            setMessages(prev => [
               ...prev,
               {
                  role: 'assistant',
                  content: `❌ **승인이 반려되었습니다**\n\n다음 명령어가 반려되어 해결책을 실행할 수 없습니다:\n${rejectedCmds}`,
                  timestamp: new Date().toISOString(),
               },
            ]);

            // 승인 대기 상태 초기화
            setPendingApprovals(prev => {
               const newMap = new Map(prev);
               newMap.delete(solutionId);
               return newMap;
            });
            setSolutionsAwaitingApproval(prev => {
               const newMap = new Map(prev);
               newMap.delete(solutionId);
               return newMap;
            });
            return;
         }

         if (pending.length > 0) {
            // 아직 승인 대기 중인 명령어가 있음
            const pendingCmds = pending.map(s => `• \`${s.command} ${s.args.join(' ')}\``).join('\n');
            setMessages(prev => [
               ...prev,
               {
                  role: 'assistant',
                  content: `⏳ **${pending.length}개의 명령어가 아직 승인 대기 중입니다**\n\n${pendingCmds}\n\n관리자가 승인을 완료하면 다시 "승인 확인" 버튼을 클릭해주세요.`,
                  timestamp: new Date().toISOString(),
               },
            ]);
            return;
         }

         // 모든 명령어가 승인됨 - 전체 명령어 순서대로 실행
         const solutionInfo = solutionsAwaitingApproval.get(solutionId);
         if (!solutionInfo) {
            setMessages(prev => [
               ...prev,
               {
                  role: 'assistant',
                  content: '해결책 정보를 찾을 수 없습니다.',
                  timestamp: new Date().toISOString(),
               },
            ]);
            return;
         }

         // 파라미터가 필요한 명령어가 있는지 확인 (<...> 패턴)
         const hasPlaceholders = hasPlaceholder(solutionInfo.solution.commands);

         if (hasPlaceholders) {
            // placeholder + 승인필요 케이스 → 웹 터미널 표시
            setMessages(prev => [
               ...prev,
               {
                  role: 'assistant',
                  content: `✅ **모든 명령어가 승인되었습니다!**\n\n명령어에 placeholder가 포함되어 있어 **웹 터미널**이 표시됩니다.\nplaceholder 값을 직접 수정하여 명령어를 실행해주세요.`,
                  timestamp: new Date().toISOString(),
               },
            ]);

            // 승인된 명령어 매핑 생성 (command+args -> request_id)
            const approvedCommandsMap = new Map<string, string>();
            for (const status of approved) {
               const cmdKey = `${status.command} ${status.args.join(' ')}`;
               approvedCommandsMap.set(cmdKey, status.request_id);
            }

            // 승인 대기 상태 초기화
            setPendingApprovals(prev => {
               const newMap = new Map(prev);
               newMap.delete(solutionId);
               return newMap;
            });
            setSolutionsAwaitingApproval(prev => {
               const newMap = new Map(prev);
               newMap.delete(solutionId);
               return newMap;
            });

            // 웹 터미널 표시 (승인된 명령어 매핑 전달)
            setWebTerminalSolution({
               ...solutionInfo,
               approvedCommands: approvedCommandsMap,
            });
            return;
         }

         setMessages(prev => [
            ...prev,
            {
               role: 'assistant',
               content: `✅ **모든 명령어가 승인되었습니다!**\n\n전체 명령어를 순서대로 실행합니다...`,
               timestamp: new Date().toISOString(),
            },
         ]);

         // 승인된 명령어 매핑 생성 (command+args -> request_id)
         const approvedCommandsMap = new Map<string, string>();
         for (const status of approved) {
            const cmdKey = `${status.command} ${status.args.join(' ')}`;
            approvedCommandsMap.set(cmdKey, status.request_id);
         }

         // 승인 대기 상태 초기화
         setPendingApprovals(prev => {
            const newMap = new Map(prev);
            newMap.delete(solutionId);
            return newMap;
         });
         setSolutionsAwaitingApproval(prev => {
            const newMap = new Map(prev);
            newMap.delete(solutionId);
            return newMap;
         });

         // 전체 명령어 순서대로 실행 (승인된 명령어 매핑 전달)
         await executeAllCommandsInSequence(solutionInfo.solution, solutionInfo.index, approvedCommandsMap);
      } catch (error: any) {
         setMessages(prev => [
            ...prev,
            {
               role: 'assistant',
               content: `❌ **상태 조회 실패**: ${error.message}`,
               timestamp: new Date().toISOString(),
            },
         ]);
      }
   };

   // Enter 키 처리
   const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
         e.preventDefault();
         handleSendMessage();
      }
   };

   // 파라미터 다이얼로그에서 확인 버튼 눌렀을 때 (파라미터가 치환된 명령어로 실행)
   const handleParameterDialogConfirm = async (updatedCommands: CommandToExecute[]) => {
      setParameterDialogOpen(false);

      if (!pendingExecutionSolution) return;

      const { solution, index } = pendingExecutionSolution;

      // 업데이트된 명령어로 솔루션 생성
      const updatedSolution: Solution = {
         ...solution,
         commands: updatedCommands,
      };

      setMessages(prev => [
         ...prev,
         {
            role: 'assistant',
            content: `📝 **파라미터가 입력되었습니다.**\n\n명령어를 실행합니다...`,
            timestamp: new Date().toISOString(),
         },
      ]);

      // 명령어 실행
      await executeAllCommandsInSequence(updatedSolution, index);

      setPendingExecutionSolution(null);
   };

   // 파라미터 다이얼로그 닫기
   const handleParameterDialogClose = () => {
      setParameterDialogOpen(false);
      setPendingExecutionSolution(null);

      setMessages(prev => [
         ...prev,
         {
            role: 'assistant',
            content: `⏹️ **명령어 실행이 취소되었습니다.**`,
            timestamp: new Date().toISOString(),
         },
      ]);
   };

   const getStatusBadge = () => {
      if (!currentStatus) return null;

      const statusConfig = {
         [WorkflowStatus.INITIALIZED]: { color: 'bg-blue-100 text-blue-800', label: '준비 중' },
         [WorkflowStatus.INITIALIZING]: { color: 'bg-blue-100 text-blue-800', label: '초기화 중' },
         [WorkflowStatus.ANALYZING]: { color: 'bg-purple-100 text-purple-800', label: '분석 중' },
         [WorkflowStatus.COLLECTING_DATA]: { color: 'bg-indigo-100 text-indigo-800', label: '데이터 수집 중' },
         [WorkflowStatus.DIAGNOSING]: { color: 'bg-yellow-100 text-yellow-800', label: '진단 중' },
         [WorkflowStatus.GENERATING_SOLUTION]: { color: 'bg-green-100 text-green-800', label: '해결책 생성 중' },
         [WorkflowStatus.EXECUTING_COMMANDS]: { color: 'bg-orange-100 text-orange-800', label: '명령어 실행 중' },
         [WorkflowStatus.PENDING_APPROVAL]: { color: 'bg-red-100 text-red-800', label: '승인 대기' },
         [WorkflowStatus.COMPLETED]: { color: 'bg-green-100 text-green-800', label: '완료' },
         [WorkflowStatus.FAILED]: { color: 'bg-red-100 text-red-800', label: '실패' },
         [WorkflowStatus.CANCELLED]: { color: 'bg-gray-100 text-gray-800', label: '취소됨' },
         [WorkflowStatus.ERROR]: { color: 'bg-red-100 text-red-800', label: '오류' },
      };

      const config = statusConfig[currentStatus];
      if (!config) {
         return <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">{currentStatus}</span>;
      }
      return <span className={`px-2 py-1 text-xs font-medium rounded ${config.color}`}>{config.label}</span>;
   };

   return (
      <div className="flex flex-col h-full bg-gray-950">
         {/* Header */}
         <div className="flex-shrink-0 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="max-w-4xl mx-auto px-6 py-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                           />
                        </svg>
                     </div>
                     <div>
                        <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                           AI Troubleshooting
                           <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full text-blue-400">
                              Beta
                           </span>
                        </h2>
                        <p className="text-sm text-gray-400">{alert.title}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-3">
                     {getStatusBadge()}
                     <div
                        className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'} transition-all duration-300`}
                     />
                  </div>
               </div>
            </div>
         </div>

         {/* Messages */}
         <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
               {connecting && (
                  <div className="flex items-center justify-center py-8">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                     <span className="ml-3 text-gray-600 dark:text-gray-400">연결 중...</span>
                  </div>
               )}

               {/* Messages in chronological order with diagnosis and solutions inserted at their respective positions */}
               {messages.map((message, index) => {
                  // Check if this message is a diagnosis marker
                  const isDiagnosisMarker = message.content === '진단을 완료했습니다.';
                  // Check if this message is a solutions marker
                  const isSolutionsMarker = message.content.includes('개의 해결책을 생성했습니다.');

                  return (
                     <React.Fragment key={index}>
                        {/* Regular message */}
                        <div
                           className={`group flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
                        >
                           <div
                              className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-md ${
                                 message.role === 'user'
                                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-blue-300/30'
                                    : message.role === 'system'
                                      ? 'bg-gray-100 text-gray-800 border border-gray-200 shadow-gray-200/50'
                                      : message.role === 'tool'
                                        ? 'bg-purple-50 text-purple-900 border border-purple-200 shadow-purple-200/50'
                                        : 'bg-white text-gray-900 border border-gray-200 shadow-gray-200/50'
                              }`}
                           >
                              {message.role === 'tool' && message.toolName && (
                                 <div className="text-xs font-medium mb-2 opacity-75 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                       <path
                                          fillRule="evenodd"
                                          d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                                          clipRule="evenodd"
                                       />
                                    </svg>
                                    {message.toolName}
                                 </div>
                              )}
                              <MarkdownRenderer content={message.content} role={message.role} />
                              {message.timestamp && (
                                 <div className="text-xs mt-2 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {new Date(message.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                 </div>
                              )}
                           </div>
                        </div>

                        {/* Show diagnosis card after diagnosis marker */}
                        {isDiagnosisMarker && diagnosis && <DiagnosisCard diagnosis={diagnosis} skipTypingEffect={sessionRestored} />}

                        {/* Show solutions after solutions marker */}
                        {isSolutionsMarker && solutions.length > 0 && (
                           <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">제안된 해결책</h3>
                              {solutions.map((solution, solutionIndex) => (
                                 <div key={solution.id} className="space-y-2">
                                    <SolutionCard
                                       solution={solution}
                                       index={solutionIndex}
                                       onExecute={() => handleExecuteSolution(solution, solutionIndex)}
                                       onExpanded={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                    />
                                    {/* 승인 상태 버튼 */}
                                    {pendingApprovals.has(solution.id) &&
                                       (() => {
                                          const requestIds = pendingApprovals.get(solution.id) || [];
                                          const statuses = requestIds.map(id => commandStatuses.get(id));
                                          const pendingCount = statuses.filter(s => !s || s.status === 'pending_approval').length;
                                          const approvedCount = statuses.filter(s => s?.status === 'approved').length;
                                          const rejectedCount = statuses.filter(s => s?.status === 'rejected').length;
                                          const allApproved = approvedCount === requestIds.length && requestIds.length > 0;
                                          const hasRejected = rejectedCount > 0;

                                          if (hasRejected) {
                                             return (
                                                <div className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 cursor-not-allowed">
                                                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                   </svg>
                                                   승인 거부됨 ({rejectedCount}개)
                                                </div>
                                             );
                                          } else if (allApproved) {
                                             return (
                                                <button
                                                   onClick={() => checkApprovalStatus(solution.id)}
                                                   className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                                >
                                                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                      <path
                                                         strokeLinecap="round"
                                                         strokeLinejoin="round"
                                                         strokeWidth={2}
                                                         d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                      />
                                                   </svg>
                                                   승인 완료됨 - 실행하기
                                                </button>
                                             );
                                          } else {
                                             return (
                                                <button
                                                   onClick={() => checkApprovalStatus(solution.id)}
                                                   className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                                >
                                                   <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                      <path
                                                         strokeLinecap="round"
                                                         strokeLinejoin="round"
                                                         strokeWidth={2}
                                                         d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                      />
                                                   </svg>
                                                   승인 대기중 ({approvedCount}/{requestIds.length})
                                                </button>
                                             );
                                          }
                                       })()}
                                 </div>
                              ))}
                           </div>
                        )}
                     </React.Fragment>
                  );
               })}

               {/* 스트리밍 메시지 (타이핑 효과) */}
               {streamingMessage && (
                  <div className="group flex justify-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="max-w-[85%] rounded-2xl px-5 py-3 shadow-md bg-white text-gray-900 border border-gray-200 shadow-gray-200/50">
                        <MarkdownRenderer content={streamingMessage} />
                        <div className="flex items-center gap-1 mt-2 text-blue-500">
                           <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                           <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                           <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                     </div>
                  </div>
               )}

               {/* Web Terminal (placeholder + 승인필요 케이스) */}
               {webTerminalSolution && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <WebTerminal
                        commands={webTerminalSolution.solution.commands}
                        solutionTitle={webTerminalSolution.solution.title}
                        sessionId={threadId}
                        approvedCommands={webTerminalSolution.approvedCommands}
                        onTerminalDataChange={handleTerminalDataChange}
                        initialLines={terminalLines}
                        initialPendingCommands={terminalPendingCommands}
                        onComplete={() => {
                           setWebTerminalSolution(null);
                           setMessages(prev => [
                              ...prev,
                              {
                                 role: 'assistant',
                                 content: '웹 터미널이 종료되었습니다.',
                                 timestamp: new Date().toISOString(),
                              },
                           ]);
                        }}
                     />
                  </div>
               )}

               {/* 수동 웹 터미널 (사용자가 직접 여는 터미널) */}
               {manualWebTerminalOpen && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <WebTerminal
                        commands={[]}
                        solutionTitle="수동 터미널"
                        sessionId={threadId}
                        onTerminalDataChange={handleTerminalDataChange}
                        initialLines={terminalLines}
                        initialPendingCommands={terminalPendingCommands}
                        onComplete={() => {
                           setManualWebTerminalOpen(false);
                        }}
                     />
                  </div>
               )}

               {isProcessing && (
                  <div className="flex items-center gap-3 text-gray-400 animate-in fade-in duration-300">
                     <div className="relative w-6 h-6">
                        <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full"></div>
                        <div className="absolute inset-0 border-2 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                        <div
                           className="absolute inset-1 border-2 border-transparent border-t-cyan-400 rounded-full animate-spin"
                           style={{ animationDirection: 'reverse', animationDuration: '0.6s' }}
                        ></div>
                     </div>
                     <span className="text-sm">AI가 분석 중입니다...</span>
                  </div>
               )}

               <div ref={messagesEndRef} />
            </div>
         </div>

         {/* Input */}
         <div className="flex-shrink-0 border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto px-6 py-4">
               <div className="flex gap-3 items-center">
                  <div className="flex-1 relative">
                     <textarea
                        ref={inputRef}
                        value={inputMessage}
                        onChange={e => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={connected ? '메시지를 입력하세요...' : '연결 대기 중...'}
                        disabled={!connected || isProcessing}
                        rows={3}
                        className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 rounded-2xl text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-gray-600"
                     />
                     <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                        <kbd className="px-1.5 py-0.5 bg-gray-700 border border-gray-600 rounded text-gray-400">Shift</kbd>
                        <span className="mx-1">+</span>
                        <kbd className="px-1.5 py-0.5 bg-gray-700 border border-gray-600 rounded text-gray-400">Enter</kbd>
                     </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                     {/* 웹 터미널 열기 버튼 */}
                     <button
                        onClick={() => setManualWebTerminalOpen(true)}
                        disabled={manualWebTerminalOpen || webTerminalSolution !== null}
                        className="p-3 bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-500 hover:to-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-gray-500/20 hover:shadow-gray-500/40 hover:scale-105 active:scale-95"
                        title="웹 터미널 열기"
                     >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                           />
                        </svg>
                     </button>
                     {/* 메시지 전송 버튼 */}
                     <button
                        onClick={handleSendMessage}
                        disabled={!connected || !inputMessage.trim() || isProcessing}
                        className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95"
                        title="메시지 전송"
                     >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                     </button>
                  </div>
               </div>
            </div>
         </div>

         {/* Parameter Input Dialog */}
         {pendingExecutionSolution && (
            <CommandParameterDialog
               isOpen={parameterDialogOpen}
               onClose={handleParameterDialogClose}
               onConfirm={handleParameterDialogConfirm}
               commands={pendingExecutionSolution.solution.commands}
               solutionTitle={pendingExecutionSolution.solution.title}
            />
         )}
      </div>
   );
}
