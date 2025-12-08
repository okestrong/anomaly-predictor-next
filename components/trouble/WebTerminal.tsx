'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CommandToExecute, ApprovalStatusChangedMetadata } from '@/types/trouble';
import { executeCommand, executeApprovedCommand, CommandResponse } from '@/lib/executorApi';
import { useApprovalStore, ApprovalStatus } from '@/stores/approvalStore';

interface WebTerminalProps {
   commands: CommandToExecute[];
   solutionTitle: string;
   sessionId: string;
   onComplete?: () => void;
   // 승인된 명령어 매핑 (command+args -> request_id)
   approvedCommands?: Map<string, string>;
   // 승인 상태 변경 콜백 (외부에서 WebSocket으로 받은 상태 변경을 전달)
   onApprovalStatusChanged?: (callback: (metadata: ApprovalStatusChangedMetadata) => void) => void;
}

interface TerminalLine {
   type: 'command' | 'output' | 'error' | 'info' | 'success' | 'pending';
   content: string;
   timestamp: Date;
   requestId?: string; // pending_approval 라인의 경우 request_id 저장
   commandStr?: string; // 원본 명령어 문자열 (실행 버튼용)
}

interface PendingCommand {
   requestId: string;
   command: string;
   args: string[];
   status: ApprovalStatus;
   lineIndex: number; // lines 배열에서의 인덱스
}

export default function WebTerminal({
   commands,
   solutionTitle,
   sessionId,
   onComplete,
   approvedCommands,
}: WebTerminalProps) {
   const [lines, setLines] = useState<TerminalLine[]>([]);
   const [inputValue, setInputValue] = useState('');
   const [isExecuting, setIsExecuting] = useState(false);
   const [commandHistory, setCommandHistory] = useState<string[]>([]);
   const [historyIndex, setHistoryIndex] = useState(-1);
   const [selectedCommandIndex, setSelectedCommandIndex] = useState<number | null>(null);
   const [pendingCommands, setPendingCommands] = useState<Map<string, PendingCommand>>(new Map());
   const terminalRef = useRef<HTMLDivElement>(null);
   const inputRef = useRef<HTMLInputElement>(null);
   const initializedRef = useRef(false);

   // Approval store 구독
   const approvals = useApprovalStore(state => state.approvals);

   // 승인 상태 변경 감지 및 UI 업데이트
   useEffect(() => {
      pendingCommands.forEach((pendingCmd, requestId) => {
         const approval = approvals.get(requestId);
         if (approval && approval.status !== pendingCmd.status) {
            // 상태가 변경됨
            setPendingCommands(prev => {
               const newMap = new Map(prev);
               newMap.set(requestId, { ...pendingCmd, status: approval.status });
               return newMap;
            });
         }
      });
   }, [approvals, pendingCommands]);

   // 초기 메시지 표시 (한 번만 실행)
   useEffect(() => {
      if (initializedRef.current) return;
      initializedRef.current = true;

      const initialLines: TerminalLine[] = [
         {
            type: 'info',
            content: `웹 터미널이 시작되었습니다. (${solutionTitle})`,
            timestamp: new Date(),
         },
      ];

      if (commands.length > 0) {
         // 솔루션 기반 터미널: 명령어 목록 표시
         initialLines.push({
            type: 'info',
            content: '아래 명령어들을 실행할 수 있습니다. <placeholder> 값은 실제 값으로 대체해주세요.',
            timestamp: new Date(),
         });
         initialLines.push({ type: 'info', content: '─'.repeat(60), timestamp: new Date() });

         // 실행할 명령어 목록 표시
         commands.forEach((cmd, idx) => {
            const fullCommand = `${cmd.command} ${cmd.args.join(' ')}`;
            const hasPlaceholder = /<[^>]+>/.test(fullCommand);
            initialLines.push({
               type: hasPlaceholder ? 'info' : 'info',
               content: `[${idx + 1}] ${fullCommand}${hasPlaceholder ? ' ⚠️ (placeholder 포함)' : ''}`,
               timestamp: new Date(),
            });
         });

         initialLines.push({ type: 'info', content: '─'.repeat(60), timestamp: new Date() });
         initialLines.push({
            type: 'info',
            content: '명령어를 직접 입력하거나, 위 명령어를 복사하여 placeholder를 수정 후 실행하세요.',
            timestamp: new Date(),
         });
      } else {
         // 수동 터미널: 자유 입력 안내
         initialLines.push({
            type: 'info',
            content: '명령어를 직접 입력하여 실행할 수 있습니다.',
            timestamp: new Date(),
         });
         initialLines.push({ type: 'info', content: '─'.repeat(60), timestamp: new Date() });
      }

      setLines(initialLines);

      // 입력 필드에 포커스
      setTimeout(() => inputRef.current?.focus(), 100);
   }, []); // 빈 의존성 배열 - 마운트 시 한 번만 실행

   // 자동 스크롤
   useEffect(() => {
      if (terminalRef.current) {
         terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
   }, [lines]);

   const addLine = (type: TerminalLine['type'], content: string, extra?: Partial<TerminalLine>) => {
      setLines(prev => [...prev, { type, content, timestamp: new Date(), ...extra }]);
   };

   // pending 라인 추가 (requestId와 commandStr 포함)
   const addPendingLine = (content: string, requestId: string, commandStr: string) => {
      setLines(prev => [...prev, {
         type: 'pending' as const,
         content,
         timestamp: new Date(),
         requestId,
         commandStr
      }]);
   };

   /**
    * 명령어 문자열을 파싱하여 command와 args 배열로 분리
    * 따옴표로 감싸진 부분은 하나의 인자로 처리
    * 예: ssh root@host "systemctl restart ceph-mgr" -> ["ssh", "root@host", "systemctl restart ceph-mgr"]
    */
   const parseCommand = (cmdStr: string): { command: string; args: string[] } => {
      const tokens: string[] = [];
      let current = '';
      let inQuotes = false;
      let quoteChar = '';

      for (let i = 0; i < cmdStr.length; i++) {
         const char = cmdStr[i];

         if ((char === '"' || char === "'") && !inQuotes) {
            inQuotes = true;
            quoteChar = char;
         } else if (char === quoteChar && inQuotes) {
            inQuotes = false;
            quoteChar = '';
         } else if (char === ' ' && !inQuotes) {
            if (current.trim()) {
               tokens.push(current.trim());
            }
            current = '';
         } else {
            current += char;
         }
      }

      if (current.trim()) {
         tokens.push(current.trim());
      }

      return {
         command: tokens[0] || '',
         args: tokens.slice(1)
      };
   };

   // 승인된 명령어 실행
   const executeApprovedCommandFromPending = async (requestId: string, commandStr: string) => {
      const { command, args } = parseCommand(commandStr.trim());

      setIsExecuting(true);
      addLine('command', `$ ${commandStr} (승인 후 실행)`);

      try {
         const response = await executeApprovedCommand(requestId, command, args);

         if (response.status === 'completed') {
            if (response.stdout) {
               response.stdout.split('\n').forEach(line => {
                  if (line.trim()) addLine('output', line);
               });
            }
            if (!response.stdout?.trim()) {
               addLine('success', '명령어가 성공적으로 실행되었습니다.');
            }

            // pendingCommands에서 제거
            setPendingCommands(prev => {
               const newMap = new Map(prev);
               newMap.delete(requestId);
               return newMap;
            });

            // approval store 상태 업데이트
            useApprovalStore.getState().updateApprovalStatus(requestId, 'executed');
         } else if (response.status === 'failed') {
            if (response.stderr) {
               response.stderr.split('\n').forEach(line => {
                  if (line.trim()) addLine('error', line);
               });
            } else {
               addLine('error', '명령어 실행에 실패했습니다.');
            }
         } else {
            addLine('info', `상태: ${response.status}`);
         }
      } catch (error: any) {
         addLine('error', `오류: ${error.message}`);
      } finally {
         setIsExecuting(false);
         inputRef.current?.focus();
      }
   };

   /**
    * 승인된 명령어의 request_id를 찾는 함수
    * 사용자가 placeholder를 치환했을 수 있으므로, 원본 명령어와 매칭
    * executor는 command가 일치하고, placeholder가 아닌 인자가 일치하면 허용
    */
   const findApprovedRequestId = (command: string, args: string[]): string | null => {
      if (!approvedCommands || approvedCommands.size === 0) return null;

      // 1. 먼저 정확히 일치하는 명령어 찾기
      const exactKey = `${command} ${args.join(' ')}`;
      if (approvedCommands.has(exactKey)) {
         return approvedCommands.get(exactKey)!;
      }

      // 2. placeholder가 있던 원본 명령어와 매칭 시도
      for (const [originalCmdKey, requestId] of approvedCommands.entries()) {
         const originalParts = originalCmdKey.split(' ');
         const originalCommand = originalParts[0];
         const originalArgs = originalParts.slice(1);

         // command가 다르면 스킵
         if (command !== originalCommand) continue;

         // args 개수가 다르면 스킵
         if (args.length !== originalArgs.length) continue;

         // 각 인자 비교: placeholder가 아닌 인자는 정확히 일치해야 함
         let isMatch = true;
         for (let i = 0; i < originalArgs.length; i++) {
            const originalArg = originalArgs[i];
            const userArg = args[i];

            // placeholder(<...>)가 아닌 인자는 정확히 일치해야 함
            if (!/<[^>]+>/.test(originalArg) && originalArg !== userArg) {
               isMatch = false;
               break;
            }
         }

         if (isMatch) {
            return requestId;
         }
      }

      return null;
   };

   const executeTerminalCommand = async (commandStr: string) => {
      if (!commandStr.trim()) return;

      // 명령어 히스토리에 추가
      setCommandHistory(prev => [...prev, commandStr]);
      setHistoryIndex(-1);

      // 명령어 라인 추가
      addLine('command', `$ ${commandStr}`);

      // placeholder 체크
      if (/<[^>]+>/.test(commandStr)) {
         addLine('error', '오류: 명령어에 placeholder(<...>)가 포함되어 있습니다. 실제 값으로 대체해주세요.');
         return;
      }

      setIsExecuting(true);

      try {
         // 명령어 파싱 (따옴표 처리 포함)
         const { command, args } = parseCommand(commandStr.trim());

         let response: CommandResponse;

         // 승인된 명령어인지 확인 (원본 명령어 기준으로 매칭)
         // 사용자가 placeholder를 치환했을 수 있으므로, 원본 명령어 목록에서 매칭되는 것을 찾음
         const matchedApprovedRequestId = findApprovedRequestId(command, args);

         if (matchedApprovedRequestId) {
            // 승인된 명령어는 executeApprovedCommand로 실행
            response = await executeApprovedCommand(matchedApprovedRequestId, command, args);
         } else {
            // 승인 불필요 명령어는 일반 executeCommand로 실행
            response = await executeCommand({
               command,
               args,
               timeout: 30,
               context: {
                  requester: 'web-terminal-user',
                  request_reason: `Web Terminal: ${solutionTitle}`,
                  session_id: sessionId,
               },
            });
         }

         if (response.status === 'completed') {
            if (response.stdout) {
               response.stdout.split('\n').forEach(line => {
                  if (line.trim()) addLine('output', line);
               });
            }
            if (!response.stdout?.trim()) {
               addLine('success', '명령어가 성공적으로 실행되었습니다.');
            }
         } else if (response.status === 'failed') {
            if (response.stderr) {
               response.stderr.split('\n').forEach(line => {
                  if (line.trim()) addLine('error', line);
               });
            } else {
               addLine('error', '명령어 실행에 실패했습니다.');
            }
         } else if (response.status === 'pending_approval') {
            // pending 상태로 라인 추가 (requestId와 commandStr 포함)
            const requestId = response.request_id || '';
            addPendingLine(`승인 대기 중: ${commandStr}`, requestId, commandStr);

            // pendingCommands에 추가
            setPendingCommands(prev => {
               const newMap = new Map(prev);
               newMap.set(requestId, {
                  requestId,
                  command,
                  args,
                  status: 'pending',
                  lineIndex: lines.length // 현재 라인 인덱스
               });
               return newMap;
            });

            // approval store에도 추가
            useApprovalStore.getState().addApproval({
               requestId,
               command,
               args,
               status: 'pending'
            });
         } else {
            addLine('info', `상태: ${response.status}`);
         }
      } catch (error: any) {
         addLine('error', `오류: ${error.message}`);
      } finally {
         setIsExecuting(false);
         inputRef.current?.focus();
      }
   };

   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !isExecuting) {
         executeTerminalCommand(inputValue);
         setInputValue('');
      } else if (e.key === 'ArrowUp') {
         e.preventDefault();
         if (commandHistory.length > 0) {
            const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
            setHistoryIndex(newIndex);
            setInputValue(commandHistory[commandHistory.length - 1 - newIndex] || '');
         }
      } else if (e.key === 'ArrowDown') {
         e.preventDefault();
         if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setInputValue(commandHistory[commandHistory.length - 1 - newIndex] || '');
         } else if (historyIndex === 0) {
            setHistoryIndex(-1);
            setInputValue('');
         }
      }
   };

   const handleCommandClick = (cmd: CommandToExecute, index: number) => {
      const fullCommand = `${cmd.command} ${cmd.args.join(' ')}`;
      setInputValue(fullCommand);
      setSelectedCommandIndex(index);
      inputRef.current?.focus();
   };

   // 입력값이 변경되면 선택된 버튼 상태 업데이트
   const handleInputChange = (value: string) => {
      setInputValue(value);

      // 입력값과 일치하는 명령어 버튼 찾기
      const matchingIndex = commands.findIndex(cmd => {
         const fullCommand = `${cmd.command} ${cmd.args.join(' ')}`;
         return fullCommand === value;
      });

      setSelectedCommandIndex(matchingIndex >= 0 ? matchingIndex : null);
   };

   const getLineColor = (type: TerminalLine['type']) => {
      switch (type) {
         case 'command':
            return 'text-green-400';
         case 'output':
            return 'text-gray-300';
         case 'error':
            return 'text-red-400';
         case 'info':
            return 'text-blue-400';
         case 'success':
            return 'text-green-300';
         case 'pending':
            return 'text-yellow-400';
         default:
            return 'text-gray-400';
      }
   };

   // pending 라인의 현재 상태 가져오기
   const getPendingStatus = (requestId: string): ApprovalStatus => {
      const pending = pendingCommands.get(requestId);
      return pending?.status || 'pending';
   };

   // pending 상태별 UI 렌더링
   const renderPendingLine = (line: TerminalLine) => {
      if (!line.requestId) return line.content;

      const status = getPendingStatus(line.requestId);
      const commandStr = line.commandStr || '';

      return (
         <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono">{commandStr}</span>
            {status === 'pending' && (
               <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-900/50 text-yellow-400 text-xs rounded border border-yellow-700/50">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
                  대기 중
               </span>
            )}
            {status === 'approved' && (
               <button
                  onClick={() => executeApprovedCommandFromPending(line.requestId!, commandStr)}
                  disabled={isExecuting}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs rounded transition-colors"
               >
                  실행
               </button>
            )}
            {status === 'rejected' && (
               <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-900/50 text-red-400 text-xs rounded border border-red-700/50">
                  거부됨
               </span>
            )}
            {status === 'executed' && (
               <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-900/50 text-green-400 text-xs rounded border border-green-700/50">
                  실행 완료
               </span>
            )}
         </div>
      );
   };

   return (
      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
         {/* Header */}
         <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
               <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
               </div>
               <span className="text-sm text-gray-400 ml-2">웹 터미널</span>
            </div>
            {onComplete && (
               <button
                  onClick={onComplete}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
               >
                  완료
               </button>
            )}
         </div>

         {/* Quick Commands - commands가 있을 때만 표시 */}
         {commands.length > 0 && (
            <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700 flex flex-wrap gap-2">
               <span className="text-xs text-gray-500">빠른 실행:</span>
               {commands.map((cmd, idx) => {
                  const fullCommand = `${cmd.command} ${cmd.args.join(' ')}`;
                  const hasPlaceholder = /<[^>]+>/.test(fullCommand);
                  const isSelected = selectedCommandIndex === idx;
                  return (
                     <button
                        key={idx}
                        onClick={() => handleCommandClick(cmd, idx)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                           isSelected
                              ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                              : hasPlaceholder
                                 ? 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50 border border-yellow-700/50'
                                 : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        title={fullCommand}
                     >
                        [{idx + 1}] {cmd.command}
                     </button>
                  );
               })}
            </div>
         )}

         {/* Terminal Output */}
         <div
            ref={terminalRef}
            className="h-64 overflow-y-auto p-4 font-mono text-sm select-text"
            onClick={() => {
               // 텍스트가 선택되어 있으면 포커스 이동하지 않음 (복사 가능하도록)
               const selection = window.getSelection();
               if (!selection || selection.isCollapsed) {
                  inputRef.current?.focus();
               }
            }}
         >
            {lines.map((line, idx) => (
               <div key={idx} className={`${getLineColor(line.type)} whitespace-pre-wrap break-all`}>
                  {line.type === 'pending' ? renderPendingLine(line) : line.content}
               </div>
            ))}
            {isExecuting && (
               <div className="text-gray-500 flex items-center gap-2">
                  <span className="animate-pulse">실행 중...</span>
                  <div className="flex gap-1">
                     <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                     <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                     <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
               </div>
            )}
         </div>

         {/* Input Line */}
         <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-t border-gray-700">
            <span className="text-green-400 font-mono">$</span>
            <input
               ref={inputRef}
               type="text"
               value={inputValue}
               onChange={e => handleInputChange(e.target.value)}
               onKeyDown={handleKeyDown}
               disabled={isExecuting}
               placeholder="명령어를 입력하세요..."
               className="flex-1 bg-transparent text-gray-100 font-mono text-sm outline-none placeholder-gray-600 disabled:opacity-50"
            />
            <button
               onClick={() => {
                  executeTerminalCommand(inputValue);
                  setInputValue('');
               }}
               disabled={isExecuting || !inputValue.trim()}
               className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
            >
               실행
            </button>
         </div>
      </div>
   );
}
