'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AlertInfo, Message, TroubleResponse, DiagnosisResult, Solution, WorkflowStatus, ResponseType } from '@/types/trouble';
import { useTroubleWebSocket } from '@/hooks/useTroubleWebSocket';
import MarkdownRenderer from './MarkdownRenderer';
import SolutionCard from './SolutionCard';
import DiagnosisCard from './DiagnosisCard';

interface ChatInterfaceProps {
   alert: AlertInfo;
   threadId: string;
   onApprovalRequired: (approvalData: any) => void;
}

export default function ChatInterface({ alert, threadId, onApprovalRequired }: ChatInterfaceProps) {
   const [messages, setMessages] = useState<Message[]>([]);
   const [inputMessage, setInputMessage] = useState('');
   const [currentStatus, setCurrentStatus] = useState<WorkflowStatus | null>(null);
   const [currentNode, setCurrentNode] = useState<string | null>(null);
   const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
   const [solutions, setSolutions] = useState<Solution[]>([]);
   const [executionResults, setExecutionResults] = useState<Record<string, any>>({});
   const [isProcessing, setIsProcessing] = useState(false);

   const messagesEndRef = useRef<HTMLDivElement>(null);
   const inputRef = useRef<HTMLTextAreaElement>(null);
   const hasStartedRef = useRef(false);

   // WebSocket 연결
   const { connected, connecting, startTroubleshooting, sendMessage, selectSolution } = useTroubleWebSocket({
      threadId,
      onMessage: handleWebSocketMessage,
   });

   // threadId 변경 시 초기화
   useEffect(() => {
      hasStartedRef.current = false;
      setMessages([]);
      setDiagnosis(null);
      setSolutions([]);
      setExecutionResults({});
   }, [threadId]);

   // 초기 실행 (한 번만)
   useEffect(() => {
      if (connected && alert && !hasStartedRef.current) {
         hasStartedRef.current = true;
         startTroubleshooting({
            threadId,
            alertInfo: alert,
            message: `Alert "${alert.title}"에 대해 분석하고 해결 방법을 제안해주세요.`,
         });

         setIsProcessing(true);
      }
   }, [connected, alert, threadId, startTroubleshooting]);

   // WebSocket 메시지 처리
   function handleWebSocketMessage(response: TroubleResponse) {
      console.log('Processing response:', response.type);

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
               setMessages(prev => [...prev, response.message!]);
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
            }
            break;

         case ResponseType.SOLUTIONS:
            if (response.solutions) {
               setSolutions(response.solutions);
               setMessages(prev => [
                  ...prev,
                  {
                     role: 'assistant',
                     content: `${response.solutions!.length}개의 해결책을 생성했습니다.`,
                     timestamp: new Date().toISOString(),
                  },
               ]);
            }
            break;

         case ResponseType.EXECUTION_RESULT:
            if (response.executionResults) {
               setExecutionResults(response.executionResults);
            }
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
   }, [messages]);

   // 메시지 전송
   const handleSendMessage = () => {
      if (!inputMessage.trim() || !connected) return;

      const userMessage: Message = {
         role: 'user',
         content: inputMessage,
         timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);
      sendMessage(inputMessage);
      setInputMessage('');
      setIsProcessing(true);
   };

   // 해결책 선택
   const handleSelectSolution = (index: number) => {
      selectSolution(index);
      setMessages(prev => [
         ...prev,
         {
            role: 'system',
            content: `해결책 #${index + 1}을 선택했습니다. 실행을 시작합니다...`,
            timestamp: new Date().toISOString(),
         },
      ]);
      setIsProcessing(true);
   };

   // Enter 키 처리
   const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
         e.preventDefault();
         handleSendMessage();
      }
   };

   const getStatusBadge = () => {
      if (!currentStatus) return null;

      const statusConfig = {
         [WorkflowStatus.INITIALIZED]: { color: 'bg-blue-100 text-blue-800', label: '초기화됨' },
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

               {messages.map((message, index) => (
                  <div
                     key={index}
                     className={`group flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
                  >
                     <div
                        className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-md ${
                           message.role === 'user'
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-300/30'
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
                        <MarkdownRenderer content={message.content} />
                        {message.timestamp && (
                           <div className="text-xs opacity-50 mt-2 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {new Date(message.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                           </div>
                        )}
                     </div>
                  </div>
               ))}

               {/* Diagnosis Result */}
               {diagnosis && <DiagnosisCard diagnosis={diagnosis} />}

               {/* Solutions */}
               {solutions.length > 0 && (
                  <div className="space-y-3">
                     <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">제안된 해결책</h3>
                     {solutions.map((solution, index) => (
                        <SolutionCard key={solution.id} solution={solution} index={index} onSelect={() => handleSelectSolution(index)} />
                     ))}
                  </div>
               )}

               {/* Execution Results */}
               {Object.keys(executionResults).length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                     <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">실행 결과</h3>
                     {Object.entries(executionResults).map(([cmd, result]: [string, any]) => (
                        <div key={cmd} className="mb-3 last:mb-0">
                           <div className="flex items-center gap-2 mb-1">
                              <code className="text-sm font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{cmd}</code>
                              {result.isSuccess !== undefined && (
                                 <span className={`text-sm ${result.isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                                    {result.isSuccess ? '✓ Success' : '✗ Failed'}
                                 </span>
                              )}
                           </div>
                           {result.stdout && <pre className="text-xs bg-black text-green-400 p-2 rounded mt-1 overflow-x-auto">{result.stdout}</pre>}
                           {result.stderr && <pre className="text-xs bg-black text-red-400 p-2 rounded mt-1 overflow-x-auto">{result.stderr}</pre>}
                        </div>
                     ))}
                  </div>
               )}

               {isProcessing && (
                  <div className="flex items-center gap-3 text-gray-400 animate-in fade-in duration-300">
                     <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
               <div className="flex gap-3 items-end">
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
                  <button
                     onClick={handleSendMessage}
                     disabled={!connected || !inputMessage.trim() || isProcessing}
                     className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95"
                  >
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                     </svg>
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
}
