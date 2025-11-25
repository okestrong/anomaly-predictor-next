'use client';

import React, { useState } from 'react';
import { Solution } from '@/types/trouble';
import MarkdownRenderer from './MarkdownRenderer';

interface SolutionCardProps {
  solution: Solution;
  index: number;
  onSelect: () => void;
}

export default function SolutionCard({ solution, index, onSelect }: SolutionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🟠';
      case 'critical':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-3 flex-1">
            <span className="flex-shrink-0 text-2xl font-bold text-blue-600 dark:text-blue-400">
              #{index + 1}
            </span>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {solution.title}
              </h4>
              <div className="flex items-center gap-3 text-sm">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskLevelColor(solution.riskLevel)}`}>
                  {getRiskLevelIcon(solution.riskLevel)} {solution.riskLevel.toUpperCase()}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  ⏱️ 약 {solution.estimatedMinutes}분 소요
                </span>
                {solution.readOnly && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-medium">
                    📖 Read-Only
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg
              className={`w-5 h-5 text-gray-500 dark:text-gray-400 transform transition-transform ${
                expanded ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Description */}
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              설명:
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <MarkdownRenderer content={solution.description} />
            </div>
          </div>

          {/* Steps */}
          {solution.steps && solution.steps.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                실행 단계:
              </div>
              <ol className="space-y-2">
                {solution.steps.map((step, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Commands */}
          {solution.commands && solution.commands.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                실행할 명령어:
              </div>
              <div className="bg-gray-900 dark:bg-black rounded-lg p-4 space-y-2">
                {solution.commands.map((cmd, idx) => (
                  <div key={idx}>
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono text-green-400">
                        $ {cmd.command} {cmd.args.join(' ')}
                      </code>
                      {cmd.requiresApproval && (
                        <span className="text-xs text-yellow-400">🔒 승인 필요</span>
                      )}
                    </div>
                    {cmd.description && (
                      <div className="text-xs text-gray-400 ml-3">
                        {cmd.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expected Impacts */}
          {solution.expectedImpacts && solution.expectedImpacts.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                예상 영향:
              </div>
              <ul className="space-y-1">
                {solution.expectedImpacts.map((impact, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>•</span>
                    <span>{impact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reference URLs */}
          {solution.referenceUrls && solution.referenceUrls.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                참고 문서:
              </div>
              <div className="space-y-1">
                {solution.referenceUrls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    🔗 {url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onSelect}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                solution.readOnly
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {solution.readOnly ? '이 해결책 확인' : '이 해결책 실행하기'}
            </button>
          </div>
        </div>
      )}

      {/* Collapsed Preview */}
      {!expanded && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={() => setExpanded(true)}
            className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            자세히 보기 →
          </button>
        </div>
      )}
    </div>
  );
}
