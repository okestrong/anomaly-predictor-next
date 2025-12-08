'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CommandToExecute } from '@/types/trouble';

interface CommandParameter {
   commandIndex: number;
   command: string;
   args: string[];
   parameterName: string;
   parameterIndex: number;
   argIndex: number;
}

interface CommandParameterDialogProps {
   isOpen: boolean;
   onClose: () => void;
   onConfirm: (updatedCommands: CommandToExecute[]) => void;
   commands: CommandToExecute[];
   solutionTitle: string;
}

// 명령어에서 <param> 형태의 파라미터 추출
const extractParameters = (commands: CommandToExecute[]): CommandParameter[] => {
   const parameters: CommandParameter[] = [];
   const paramRegex = /<([^>]+)>/g;

   commands.forEach((cmd, cmdIndex) => {
      cmd.args.forEach((arg, argIndex) => {
         let match;
         while ((match = paramRegex.exec(arg)) !== null) {
            parameters.push({
               commandIndex: cmdIndex,
               command: cmd.command,
               args: cmd.args,
               parameterName: match[1],
               parameterIndex: parameters.length,
               argIndex,
            });
         }
      });
   });

   return parameters;
};

export default function CommandParameterDialog({
   isOpen,
   onClose,
   onConfirm,
   commands,
   solutionTitle,
}: CommandParameterDialogProps) {
   const [parameters, setParameters] = useState<CommandParameter[]>([]);
   const [parameterValues, setParameterValues] = useState<Record<string, string>>({});
   const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
   const dialogRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      if (isOpen) {
         const extractedParams = extractParameters(commands);
         setParameters(extractedParams);
         setParameterValues({});
         setFocusedIndex(null);
         setIsSubmitting(false);

         // 첫 번째 입력 필드에 포커스
         setTimeout(() => {
            if (inputRefs.current[0]) {
               inputRefs.current[0].focus();
            }
         }, 100);
      }
   }, [isOpen, commands]);

   const handleValueChange = (paramName: string, value: string) => {
      setParameterValues(prev => ({
         ...prev,
         [paramName]: value,
      }));
   };

   const handleSubmit = () => {
      // 모든 파라미터가 입력되었는지 확인
      const allFilled = parameters.every(param => parameterValues[param.parameterName]?.trim());
      if (!allFilled) {
         // 빈 필드 찾아서 포커스
         const emptyIndex = parameters.findIndex(param => !parameterValues[param.parameterName]?.trim());
         if (emptyIndex >= 0 && inputRefs.current[emptyIndex]) {
            inputRefs.current[emptyIndex]?.focus();
            setFocusedIndex(emptyIndex);
         }
         return;
      }

      setIsSubmitting(true);

      // 명령어에 파라미터 값 대입
      const updatedCommands = commands.map((cmd, cmdIndex) => ({
         ...cmd,
         args: cmd.args.map(arg => {
            let updatedArg = arg;
            parameters
               .filter(p => p.commandIndex === cmdIndex)
               .forEach(param => {
                  const regex = new RegExp(`<${param.parameterName}>`, 'g');
                  updatedArg = updatedArg.replace(regex, parameterValues[param.parameterName] || '');
               });
            return updatedArg;
         }),
      }));

      setTimeout(() => {
         onConfirm(updatedCommands);
         setIsSubmitting(false);
      }, 300);
   };

   const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
      if (e.key === 'Enter') {
         e.preventDefault();
         if (index < parameters.length - 1) {
            inputRefs.current[index + 1]?.focus();
         } else {
            handleSubmit();
         }
      } else if (e.key === 'Escape') {
         onClose();
      }
   };

   // 고유한 파라미터 이름만 추출 (중복 제거)
   const uniqueParameters = parameters.filter(
      (param, index, self) => index === self.findIndex(p => p.parameterName === param.parameterName)
   );

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
         {/* Backdrop */}
         <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
         />

         {/* Dialog */}
         <div
            ref={dialogRef}
            className="relative z-10 w-full max-w-2xl mx-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden animate-in zoom-in-95 fade-in duration-300"
         >
            {/* Animated gradient border */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 opacity-20 blur-xl animate-pulse" />

            {/* Header */}
            <div className="relative p-6 border-b border-gray-700/50 bg-gray-900/50">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-in zoom-in duration-500">
                     <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                     </svg>
                  </div>
                  <div>
                     <h2 className="text-xl font-bold text-gray-100 animate-in slide-in-from-left duration-300">
                        명령어 파라미터 입력
                     </h2>
                     <p className="text-sm text-gray-400 mt-1 animate-in slide-in-from-left duration-300 delay-100">
                        {solutionTitle}
                     </p>
                  </div>
               </div>

               {/* Close button */}
               <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200 hover:rotate-90"
               >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
               </button>
            </div>

            {/* Content */}
            <div className="relative p-6 max-h-[60vh] overflow-y-auto">
               {/* Info message */}
               <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl animate-in slide-in-from-bottom duration-300">
                  <div className="flex items-start gap-3">
                     <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                           />
                        </svg>
                     </div>
                     <div>
                        <p className="text-sm text-blue-300 font-medium">입력이 필요한 파라미터가 있습니다</p>
                        <p className="text-xs text-blue-400/70 mt-1">
                           아래 명령어에서 &lt;...&gt; 부분에 실제 값을 입력해주세요.
                        </p>
                     </div>
                  </div>
               </div>

               {/* Commands preview */}
               <div className="mb-6 space-y-3">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">실행할 명령어:</h3>
                  {commands.map((cmd, idx) => {
                     const hasParam = cmd.args.some(arg => /<[^>]+>/.test(arg));
                     return (
                        <div
                           key={idx}
                           className={`p-3 rounded-lg border transition-all duration-300 animate-in slide-in-from-left ${
                              hasParam
                                 ? 'bg-yellow-500/10 border-yellow-500/30'
                                 : 'bg-gray-800/50 border-gray-700/50'
                           }`}
                           style={{ animationDelay: `${idx * 50}ms` }}
                        >
                           <code className="text-sm font-mono">
                              <span className="text-green-400">$</span>{' '}
                              <span className="text-gray-300">{cmd.command}</span>{' '}
                              {cmd.args.map((arg, argIdx) => {
                                 // <param> 부분을 하이라이트
                                 const parts = arg.split(/(<[^>]+>)/g);
                                 return (
                                    <span key={argIdx}>
                                       {parts.map((part, partIdx) =>
                                          /<[^>]+>/.test(part) ? (
                                             <span
                                                key={partIdx}
                                                className="px-1.5 py-0.5 mx-0.5 bg-yellow-500/20 text-yellow-300 rounded border border-yellow-500/30 animate-pulse"
                                             >
                                                {part}
                                             </span>
                                          ) : (
                                             <span key={partIdx} className="text-gray-400">
                                                {part}
                                             </span>
                                          )
                                       )}{' '}
                                    </span>
                                 );
                              })}
                           </code>
                        </div>
                     );
                  })}
               </div>

               {/* Parameter inputs */}
               <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-300">파라미터 값 입력:</h3>
                  {uniqueParameters.map((param, index) => (
                     <div
                        key={param.parameterName}
                        className={`group relative animate-in slide-in-from-bottom duration-300`}
                        style={{ animationDelay: `${index * 100}ms` }}
                     >
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                           <span className="text-purple-400">&lt;</span>
                           {param.parameterName}
                           <span className="text-purple-400">&gt;</span>
                        </label>
                        <div className="relative">
                           <input
                              ref={el => {
                                 inputRefs.current[index] = el;
                              }}
                              type="text"
                              value={parameterValues[param.parameterName] || ''}
                              onChange={e => handleValueChange(param.parameterName, e.target.value)}
                              onFocus={() => setFocusedIndex(index)}
                              onBlur={() => setFocusedIndex(null)}
                              onKeyDown={e => handleKeyDown(e, index)}
                              placeholder={`${param.parameterName} 값을 입력하세요...`}
                              className={`w-full px-4 py-3 bg-gray-800/50 border-2 rounded-xl text-gray-100 placeholder-gray-500 transition-all duration-300 outline-none ${
                                 focusedIndex === index
                                    ? 'border-blue-500 shadow-lg shadow-blue-500/20 scale-[1.02]'
                                    : 'border-gray-700 hover:border-gray-600'
                              }`}
                           />
                           {/* Animated focus indicator */}
                           {focusedIndex === index && (
                              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 pointer-events-none animate-pulse" />
                           )}
                           {/* Check mark when filled */}
                           {parameterValues[param.parameterName]?.trim() && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center animate-in zoom-in duration-200">
                                 <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                 </svg>
                              </div>
                           )}
                        </div>
                        {/* Helper text */}
                        <p className="mt-1.5 text-xs text-gray-500">
                           명령어:{' '}
                           <code className="text-gray-400">
                              {param.command} {param.args.join(' ')}
                           </code>
                        </p>
                     </div>
                  ))}
               </div>
            </div>

            {/* Footer */}
            <div className="relative p-6 border-t border-gray-700/50 bg-gray-900/50">
               <div className="flex items-center justify-between">
                  {/* Progress indicator */}
                  <div className="flex items-center gap-2">
                     <div className="flex gap-1">
                        {uniqueParameters.map((param, idx) => (
                           <div
                              key={idx}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                 parameterValues[param.parameterName]?.trim()
                                    ? 'bg-green-500 shadow-lg shadow-green-500/50'
                                    : 'bg-gray-600'
                              }`}
                           />
                        ))}
                     </div>
                     <span className="text-xs text-gray-500">
                        {Object.values(parameterValues).filter(v => v?.trim()).length} / {uniqueParameters.length} 입력됨
                     </span>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                     <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                     >
                        취소
                     </button>
                     <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !uniqueParameters.every(p => parameterValues[p.parameterName]?.trim())}
                        className={`relative px-6 py-2.5 text-sm font-medium text-white rounded-xl transition-all duration-200 overflow-hidden ${
                           isSubmitting || !uniqueParameters.every(p => parameterValues[p.parameterName]?.trim())
                              ? 'bg-gray-700 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95'
                        }`}
                     >
                        {isSubmitting ? (
                           <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                 <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                 />
                                 <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                 />
                              </svg>
                              <span>실행 중...</span>
                           </div>
                        ) : (
                           <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                 />
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                 />
                              </svg>
                              <span>명령어 실행</span>
                           </div>
                        )}
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
