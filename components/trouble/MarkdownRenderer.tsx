'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
   content: string;
   role?: string;
   className?: string;
}

export default function MarkdownRenderer({ content, role, className = '' }: MarkdownRendererProps) {
   return (
      <div className={`markdown-content ${className}${role === 'user' ? 'whitespace-pre-wrap break-words' : ''}`}>
         <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
               // Headings
               h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900" {...props} />,
               h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900" {...props} />,
               h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900" {...props} />,
               h4: ({ node, ...props }) => <h4 className="text-base font-semibold mt-3 mb-2 text-gray-900" {...props} />,

               // Paragraphs
               p: ({ node, ...props }) => <p className="mb-4 text-gray-700 leading-relaxed" {...props} />,

               // Lists
               ul: ({ node, ...props }) => <ul className="mb-4 ml-6 list-disc space-y-1 text-gray-700" {...props} />,
               ol: ({ node, ...props }) => <ol className="mb-4 ml-6 list-decimal space-y-1 text-gray-700" {...props} />,
               li: ({ node, ...props }) => <li className="text-gray-700" {...props} />,

               // Links
               a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,

               // Pre tag (code block container)
               pre: ({ node, children, ...props }) => (
                  <pre className="my-4 rounded-lg overflow-hidden max-w-full" style={{ margin: 0 }} {...props}>
                     {children}
                  </pre>
               ),

               // Code blocks
               code: ({ node, inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : null;
                  const isBlock = !inline && match;
                  const isLongCode = !inline && !match && String(children).includes('\n');

                  // markdown 코드블록은 마크다운으로 재파싱 (LLM이 markdown으로 감싸서 응답하는 경우 처리)
                  if (language === 'markdown' || language === 'md') {
                     const markdownContent = String(children).replace(/\n$/, '');
                     // 재귀 호출 대신 ReactMarkdown 직접 사용
                     return (
                        <ReactMarkdown
                           remarkPlugins={[remarkGfm]}
                           components={{
                              h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900" {...props} />,
                              h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900" {...props} />,
                              h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900" {...props} />,
                              h4: ({ node, ...props }) => <h4 className="text-base font-semibold mt-3 mb-2 text-gray-900" {...props} />,
                              p: ({ node, ...props }) => <p className="mb-4 text-gray-700 leading-relaxed" {...props} />,
                              ul: ({ node, ...props }) => <ul className="mb-4 ml-6 list-disc space-y-1 text-gray-700" {...props} />,
                              ol: ({ node, ...props }) => <ol className="mb-4 ml-6 list-decimal space-y-1 text-gray-700" {...props} />,
                              li: ({ node, ...props }) => <li className="text-gray-700" {...props} />,
                              a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                              strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
                              em: ({ node, ...props }) => <em className="italic" {...props} />,
                              code: ({ node, inline, ...codeProps }: any) => (
                                 <code
                                    className={inline ? "px-1.5 py-0.5 mx-0.5 bg-gray-100 text-red-600 rounded text-sm font-mono" : "block bg-gray-800 text-gray-100 p-4 rounded-lg text-sm font-mono"}
                                    {...codeProps}
                                 />
                              ),
                              blockquote: ({ node, ...props }) => <blockquote className="pl-4 border-l-4 border-gray-300 italic text-gray-600 my-4" {...props} />,
                              hr: ({ node, ...props }) => <hr className="my-6 border-gray-200" {...props} />,
                           }}
                        >
                           {markdownContent}
                        </ReactMarkdown>
                     );
                  }

                  if (isBlock) {
                     // 언어가 지정된 코드 블록 (syntax highlighting)
                     return (
                        <div className="rounded-lg overflow-hidden max-w-full">
                           <SyntaxHighlighter
                              style={oneDark}
                              language={language}
                              PreTag="div"
                              customStyle={{
                                 margin: 0,
                                 borderRadius: '0.5rem',
                                 fontSize: '0.875rem',
                                 whiteSpace: 'pre-wrap',
                                 wordBreak: 'break-word',
                                 overflowWrap: 'break-word',
                                 maxWidth: '100%',
                                 overflow: 'auto',
                              }}
                              wrapLongLines={true}
                              {...props}
                           >
                              {String(children).replace(/\n$/, '')}
                           </SyntaxHighlighter>
                        </div>
                     );
                  } else if (isLongCode) {
                     // 언어가 없는 긴 코드 블록 (멀티라인)
                     return (
                        <code
                           className="block bg-gray-800 text-gray-100 p-4 rounded-lg text-sm font-mono max-w-full overflow-auto"
                           style={{
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                           }}
                           {...props}
                        >
                           {children}
                        </code>
                     );
                  } else {
                     // 인라인 코드
                     return (
                        <code
                           className="px-1.5 py-0.5 mx-0.5 bg-gray-100 text-red-600 rounded text-sm font-mono"
                           style={{
                              wordBreak: 'break-all',
                              overflowWrap: 'break-word',
                           }}
                           {...props}
                        >
                           {children}
                        </code>
                     );
                  }
               },

               // Blockquotes
               blockquote: ({ node, ...props }) => <blockquote className="pl-4 border-l-4 border-gray-300 italic text-gray-600 my-4" {...props} />,

               // Tables
               table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-4">
                     <table className="min-w-full divide-y divide-gray-200" {...props} />
                  </div>
               ),
               thead: ({ node, ...props }) => <thead className="bg-gray-50" {...props} />,
               tbody: ({ node, ...props }) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
               tr: ({ node, ...props }) => <tr {...props} />,
               th: ({ node, ...props }) => <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props} />,
               td: ({ node, ...props }) => <td className="px-4 py-2 text-sm text-gray-700" {...props} />,

               // Horizontal rule
               hr: ({ node, ...props }) => <hr className="my-6 border-gray-200" {...props} />,

               // Strong/Bold
               strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,

               // Emphasis/Italic
               em: ({ node, ...props }) => <em className="italic" {...props} />,
            }}
         >
            {content}
         </ReactMarkdown>
      </div>
   );
}
