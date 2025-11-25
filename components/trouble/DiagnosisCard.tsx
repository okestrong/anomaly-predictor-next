'use client';

import React from 'react';
import { DiagnosisResult } from '@/types/trouble';
import MarkdownRenderer from './MarkdownRenderer';

interface DiagnosisCardProps {
  diagnosis: DiagnosisResult;
}

export default function DiagnosisCard({ diagnosis }: DiagnosisCardProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return '높음';
    if (confidence >= 0.5) return '중간';
    return '낮음';
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 p-2 bg-blue-600 rounded-lg">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            진단 결과
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {diagnosis.problemSummary}
          </p>
        </div>
      </div>

      {/* Root Cause */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            근본 원인:
          </span>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <p className="text-gray-900 dark:text-gray-100 font-medium">
            {diagnosis.rootCause}
          </p>
        </div>
      </div>

      {/* Confidence & Impact Scope */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            신뢰도
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${getConfidenceColor(diagnosis.confidence)}`}>
              {Math.round(diagnosis.confidence * 100)}%
            </span>
            <span className={`text-sm ${getConfidenceColor(diagnosis.confidence)}`}>
              {getConfidenceLabel(diagnosis.confidence)}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            영향 범위
          </div>
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {diagnosis.impactScope}
          </div>
        </div>
      </div>

      {/* Affected Components */}
      {diagnosis.affectedComponents && diagnosis.affectedComponents.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            영향받는 컴포넌트:
          </div>
          <div className="flex flex-wrap gap-2">
            {diagnosis.affectedComponents.map((component, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-sm rounded-full"
              >
                {component}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Analysis */}
      {diagnosis.details && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            상세 분석:
          </div>
          <div className="text-sm">
            <MarkdownRenderer content={diagnosis.details} />
          </div>
        </div>
      )}

      {/* Sources */}
      {diagnosis.sources && diagnosis.sources.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            참고 문서:
          </div>
          <div className="space-y-1">
            {diagnosis.sources.map((source, index) => (
              <div key={index} className="text-xs text-blue-600 dark:text-blue-400">
                📄 {source}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
