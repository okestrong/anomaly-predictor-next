'use client';

import { Card } from '@/components/common';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import parse from 'html-react-parser';

interface PredictionData {
   id: string;
   category: string;
   name: string;
   severity: 'low' | 'medium' | 'high' | 'critical';
   probability: number;
   confidence: number;
   timeToImpact: string;
   aiAnalysis?: string;
   affectedComponents: string[];
   recommendedActions: string[];
   trend: 'improving' | 'stable' | 'worsening';
}

interface PredictionSectionProps {
   predictions: PredictionData[];
}

const getSeverityColor = (severity: string) => {
   switch (severity) {
      case 'critical':
         return { bg: 'bg-red-100 print:bg-red-50', text: 'text-red-800 print:text-red-900', badge: 'bg-red-500 print:bg-red-600' };
      case 'high':
         return { bg: 'bg-orange-100 print:bg-orange-50', text: 'text-orange-800 print:text-orange-900', badge: 'bg-orange-500 print:bg-orange-600' };
      case 'medium':
         return { bg: 'bg-blue-100 print:bg-blue-50', text: 'text-blue-800 print:text-blue-900', badge: 'bg-blue-500 print:bg-blue-600' };
      case 'low':
         return { bg: 'bg-green-100 print:bg-green-50', text: 'text-green-800 print:text-green-900', badge: 'bg-green-500 print:bg-green-600' };
      default:
         return { bg: 'bg-gray-100 print:bg-gray-50', text: 'text-gray-800 print:text-gray-900', badge: 'bg-gray-500 print:bg-gray-600' };
   }
};

const getTrendIcon = (trend: string) => {
   switch (trend) {
      case 'worsening':
         return '↑';
      case 'improving':
         return '↓';
      default:
         return '→';
   }
};

const getTrendColor = (trend: string) => {
   switch (trend) {
      case 'worsening':
         return 'text-red-600 print:text-red-700';
      case 'improving':
         return 'text-green-600 print:text-green-700';
      default:
         return 'text-gray-600 print:text-gray-700';
   }
};

export default function PredictionSection({ predictions }: PredictionSectionProps) {
   return (
      <div className="space-y-8 print:text-black">
         <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-black">Cluster Health Forecast</h1>
            <p className="text-sm text-gray-800 print:text-gray-700">
               Machine learning-powered predictive analytics for proactive cluster management and failure prevention
            </p>
         </div>

         {/* Predictions Grid */}
         <div className="grid grid-cols-1 gap-6">
            {predictions
               .sort((a, b) => {
                  // Sort by severity (critical > high > medium > low)
                  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                  const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
                  if (severityDiff !== 0) return severityDiff;
                  // Then by probability
                  return b.probability - a.probability;
               })
               .map((prediction, index) => {
                  const colors = getSeverityColor(prediction.severity);
                  return (
                     <Card
                        key={prediction.id}
                        variant="glass"
                        className={`p-6 print:border print:border-gray-300 print:bg-white page-break-inside-avoid ${
                           index > 0 && index % 3 === 0 ? 'page-break-before' : ''
                        }`}
                     >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                           <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                 <h3 className="text-xl font-semibold text-gray-100 print:text-black">{prediction.name}</h3>
                                 <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${colors.badge} uppercase`}>
                                    {prediction.severity}
                                 </span>
                              </div>
                           </div>
                           <div className={`flex items-center space-x-1 text-sm font-medium ${getTrendColor(prediction.trend)}`}>
                              <span>{getTrendIcon(prediction.trend)}</span>
                              <span className="capitalize">{prediction.trend}</span>
                           </div>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                           <div className={`p-3 rounded-lg ${colors.bg}`}>
                              <div className="text-xs text-gray-600 mb-1 print:text-gray-700">Probability</div>
                              <div className={`text-2xl font-bold ${colors.text}`}>{(prediction.probability * 100).toFixed(1)}%</div>
                              <div className="w-full h-2 bg-white/50 rounded-full mt-2 overflow-hidden print:bg-gray-200">
                                 <div className={`h-full ${colors.badge}`} style={{ width: `${prediction.probability * 100}%` }} />
                              </div>
                           </div>
                           <div className="p-3 bg-blue-50 rounded-lg print:bg-blue-50">
                              <div className="text-xs text-blue-600 mb-1 print:text-blue-800">Confidence</div>
                              <div className="text-2xl font-bold text-blue-800 print:text-black">{(prediction.confidence * 100).toFixed(0)}%</div>
                           </div>
                           <div className="p-3 bg-orange-50 rounded-lg print:bg-orange-50">
                              <div className="text-xs text-orange-600 mb-1 print:text-orange-800">Time to Impact</div>
                              <div className="text-2xl font-bold text-orange-800 print:text-black">{prediction.timeToImpact}</div>
                           </div>
                        </div>

                        {/* Affected Components */}
                        {prediction.affectedComponents.length > 0 && (
                           <div className="mb-4">
                              <div className="text-sm font-medium text-gray-300 mb-2 print:text-black">Affected Components:</div>
                              <div className="flex flex-wrap gap-2">
                                 {prediction.affectedComponents.map((comp, idx) => (
                                    <span
                                       key={idx}
                                       className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border border-gray-300 print:bg-gray-100 print:text-black"
                                    >
                                       {comp}
                                    </span>
                                 ))}
                              </div>
                           </div>
                        )}

                        {/* AI Analysis */}
                        {prediction.aiAnalysis && (
                           <div className="mb-4 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200 print:bg-cyan-50 print:border-cyan-300">
                              <div className="text-sm font-semibold text-cyan-800 mb-2 print:text-black">AI Analysis</div>
                              <div className="prose prose-sm max-w-none text-gray-800 print:text-black">
                                 <Markdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                       h1: props => <h1 className="text-lg font-bold" {...props} />,
                                       h2: props => <h2 className="text-base font-bold" {...props} />,
                                       h3: props => <h3 className="text-sm font-semibold" {...props} />,
                                       p: props => <p className="text-sm leading-relaxed" {...props} />,
                                       ul: props => <ul className="text-sm list-disc pl-4" {...props} />,
                                       ol: props => <ol className="text-sm list-decimal pl-4" {...props} />,
                                       li: props => <li className="text-sm" {...props} />,
                                       table: props => <table className="w-full border-collapse border border-gray-300 text-sm" {...props} />,
                                       thead: props => <thead className="bg-gray-100" {...props} />,
                                       th: props => <th className="border border-gray-300 px-2 py-1 text-left bg-gray-200 text-black" {...props} />,
                                       td: props => <td className="border border-gray-300 px-2 py-1 align-top text-black" {...props} />,
                                    }}
                                 >
                                    {prediction.aiAnalysis}
                                 </Markdown>
                              </div>
                           </div>
                        )}

                        {/* Recommended Actions */}
                        {prediction.recommendedActions.length > 0 && (
                           <div>
                              <div className="text-sm font-medium text-gray-300 mb-2 print:text-black">Recommended Actions:</div>
                              <ul className="space-y-1">
                                 {prediction.recommendedActions.map((action, idx) => (
                                    <li key={idx} className="text-sm text-gray-100 flex items-start print:text-black">
                                       <span className="text-cyan-600 mr-2 print:text-black">•</span>
                                       <span className="whitespace-pre-wrap break-words">{parse(action.replaceAll('\\n', '<br/>'))}</span>
                                    </li>
                                 ))}
                              </ul>
                           </div>
                        )}
                     </Card>
                  );
               })}
         </div>
      </div>
   );
}
