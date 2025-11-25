'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
   content: string;
   className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
   return (
      <div className={`markdown-content ${className}`}>
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
               a: ({ node, ...props }) => (
                  <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
               ),

               // Code blocks
               code: ({ node, inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                     <div className="my-4 rounded-lg overflow-hidden">
                        <SyntaxHighlighter
                           style={oneDark}
                           language={match[1]}
                           PreTag="div"
                           customStyle={{
                              margin: 0,
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem',
                           }}
                           {...props}
                        >
                           {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                     </div>
                  ) : (
                     <code className="px-1.5 py-0.5 mx-0.5 bg-gray-100 text-red-600 rounded text-sm font-mono" {...props}>
                        {children}
                     </code>
                  );
               },

               // Blockquotes
               blockquote: ({ node, ...props }) => (
                  <blockquote className="pl-4 border-l-4 border-gray-300 italic text-gray-600 my-4" {...props} />
               ),

               // Tables
               table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-4">
                     <table className="min-w-full divide-y divide-gray-200" {...props} />
                  </div>
               ),
               thead: ({ node, ...props }) => <thead className="bg-gray-50" {...props} />,
               tbody: ({ node, ...props }) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
               tr: ({ node, ...props }) => <tr {...props} />,
               th: ({ node, ...props }) => (
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props} />
               ),
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
