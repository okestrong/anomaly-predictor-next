'use client';

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

const getSeverityConfig = (severity: string) => {
   switch (severity) {
      case 'critical':
         return {
            label: 'CRITICAL',
            bgColor: 'bg-red-50 print:bg-red-50',
            borderColor: 'border-red-300',
            textColor: 'text-red-900 print:text-red-900',
            badgeBg: 'bg-red-600 print:bg-red-700',
            progressBg: 'bg-red-600',
         };
      case 'high':
         return {
            label: 'HIGH',
            bgColor: 'bg-orange-50 print:bg-orange-50',
            borderColor: 'border-orange-300',
            textColor: 'text-orange-900 print:text-orange-900',
            badgeBg: 'bg-orange-600 print:bg-orange-700',
            progressBg: 'bg-orange-600',
         };
      case 'medium':
         return {
            label: 'MEDIUM',
            bgColor: 'bg-blue-50 print:bg-blue-50',
            borderColor: 'border-blue-300',
            textColor: 'text-blue-900 print:text-blue-900',
            badgeBg: 'bg-blue-600 print:bg-blue-700',
            progressBg: 'bg-blue-600',
         };
      case 'low':
         return {
            label: 'LOW',
            bgColor: 'bg-green-50 print:bg-green-50',
            borderColor: 'border-green-300',
            textColor: 'text-green-900 print:text-green-900',
            badgeBg: 'bg-green-600 print:bg-green-700',
            progressBg: 'bg-green-600',
         };
      default:
         return {
            label: 'UNKNOWN',
            bgColor: 'bg-gray-50 print:bg-gray-50',
            borderColor: 'border-gray-300',
            textColor: 'text-gray-900 print:text-gray-900',
            badgeBg: 'bg-gray-600 print:bg-gray-700',
            progressBg: 'bg-gray-600',
         };
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

const getTrendConfig = (trend: string) => {
   switch (trend) {
      case 'worsening':
         return { color: 'text-red-700 print:text-red-800', label: 'Worsening' };
      case 'improving':
         return { color: 'text-green-700 print:text-green-800', label: 'Improving' };
      default:
         return { color: 'text-gray-700 print:text-gray-800', label: 'Stable' };
   }
};

export default function PredictionSection({ predictions }: PredictionSectionProps) {
   const sortedPredictions = [...predictions].sort((a, b) => {
      // Sort by severity (critical > high > medium > low)
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
      if (severityDiff !== 0) return severityDiff;
      // Then by probability
      return b.probability - a.probability;
   });

   return (
      <div className="space-y-8 print:text-black">
         {/* Section Header */}
         <div className="mb-8 print:hidden">
            <h1 className="text-2xl font-bold text-gray-100 mb-2 print:text-black">Cluster Health Forecast</h1>
            <p className="text-sm text-gray-300 print:text-gray-700">
               Machine learning-powered predictive analytics for proactive cluster management and failure prevention
            </p>
         </div>

         {/* Summary Statistics */}
         <section className="border border-gray-300 bg-white mb-8 print:border print:border-gray-300 print:hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-300">
               <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Prediction Overview</h2>
            </div>
            <div className="p-6">
               <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 border border-gray-200 bg-gray-50">
                     <div className="text-xs text-gray-600 mb-1 uppercase font-semibold print:text-gray-700">Total Predictions</div>
                     <div className="text-3xl font-bold text-gray-900 print:text-black">{predictions.length}</div>
                  </div>
                  <div className="text-center p-4 border border-red-200 bg-red-50">
                     <div className="text-xs text-red-600 mb-1 uppercase font-semibold print:text-red-800">Critical</div>
                     <div className="text-3xl font-bold text-red-900 print:text-black">{predictions.filter(p => p.severity === 'critical').length}</div>
                  </div>
                  <div className="text-center p-4 border border-orange-200 bg-orange-50">
                     <div className="text-xs text-orange-600 mb-1 uppercase font-semibold print:text-orange-800">High</div>
                     <div className="text-3xl font-bold text-orange-900 print:text-black">{predictions.filter(p => p.severity === 'high').length}</div>
                  </div>
                  <div className="text-center p-4 border border-blue-200 bg-blue-50">
                     <div className="text-xs text-blue-600 mb-1 uppercase font-semibold print:text-blue-800">Medium/Low</div>
                     <div className="text-3xl font-bold text-blue-900 print:text-black">
                        {predictions.filter(p => p.severity === 'medium' || p.severity === 'low').length}
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* Predictions List */}
         <div className="space-y-6">
            {sortedPredictions.map((prediction, index) => {
               const severityConfig = getSeverityConfig(prediction.severity);
               const trendConfig = getTrendConfig(prediction.trend);

               return (
                  <section
                     key={`pred-${prediction.id}-${index}`}
                     className={`border border-gray-300 bg-white page-break-inside-avoid ${index > 0 && index % 2 === 0 ? 'page-break-before' : ''}`}
                  >
                     {/* Prediction Header */}
                     <div className="bg-gray-50 px-6 py-4 border-b border-gray-300">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <h2 className="text-lg font-bold text-gray-900 print:text-black">{prediction.name}</h2>
                              <span className={`px-3 py-1 text-xs font-bold text-white uppercase tracking-wide ${severityConfig.badgeBg}`}>
                                 {severityConfig.label}
                              </span>
                           </div>
                           <div className={`flex items-center gap-1 text-sm font-semibold ${trendConfig.color}`}>
                              <span className="text-lg">{getTrendIcon(prediction.trend)}</span>
                              <span className="uppercase tracking-wide">{trendConfig.label}</span>
                           </div>
                        </div>
                     </div>

                     {/* Prediction Body */}
                     <div className="p-6">
                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-3 gap-6 mb-6">
                           {/* Probability */}
                           <div className={`border ${severityConfig.borderColor} ${severityConfig.bgColor} p-4`}>
                              <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide print:text-gray-800">Failure Probability</div>
                              <div className={`text-3xl font-bold mb-3 ${severityConfig.textColor}`}>{(prediction.probability * 100).toFixed(1)}%</div>
                              <div className="w-full h-3 bg-gray-200 overflow-hidden print:bg-gray-300">
                                 <div className={`h-full ${severityConfig.progressBg}`} style={{ width: `${prediction.probability * 100}%` }} />
                              </div>
                           </div>

                           {/* Confidence */}
                           <div className="border border-blue-200 bg-blue-50 p-4 print:bg-blue-50">
                              <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide print:text-gray-800">Model Confidence</div>
                              <div className="text-3xl font-bold text-blue-900 mb-3 print:text-black">{(prediction.confidence * 100).toFixed(0)}%</div>
                              <div className="w-full h-3 bg-gray-200 overflow-hidden print:bg-gray-300">
                                 <div className="h-full bg-blue-600" style={{ width: `${prediction.confidence * 100}%` }} />
                              </div>
                           </div>

                           {/* Time to Impact */}
                           <div className="border border-orange-200 bg-orange-50 p-4 print:bg-orange-50">
                              <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide print:text-gray-800">
                                 Estimated Time to Impact
                              </div>
                              <div className="text-3xl font-bold text-orange-900 print:text-black">{prediction.timeToImpact}</div>
                              <div className="text-xs text-orange-700 mt-2 print:text-orange-800">Based on current trend analysis</div>
                           </div>
                        </div>

                        {/* Affected Components */}
                        {prediction.affectedComponents.length > 0 && (
                           <div className="mb-6 p-4 border border-gray-200 bg-gray-50">
                              <div className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide print:text-black">
                                 Affected Components ({prediction.affectedComponents.length})
                              </div>
                              <div className="flex flex-wrap gap-2">
                                 {prediction.affectedComponents.map((comp, idx) => (
                                    <span
                                       key={`comp-${prediction.id}-${comp}-${idx}`}
                                       className="px-3 py-1 text-xs font-medium bg-white text-gray-800 border border-gray-300 print:bg-white print:text-black"
                                    >
                                       {comp}
                                    </span>
                                 ))}
                              </div>
                           </div>
                        )}

                        {/* AI Analysis */}
                        {prediction.aiAnalysis && (
                           <div className="mb-6 border border-cyan-200 bg-cyan-50 print:border-cyan-300">
                              <div className="bg-cyan-100 px-4 py-2 border-b border-cyan-200">
                                 <div className="text-sm font-bold text-cyan-900 uppercase tracking-wide print:text-black">AI-Powered Analysis</div>
                              </div>
                              <div className="p-4">
                                 <div className="prose prose-sm max-w-none text-gray-900 print:text-black">
                                    <Markdown
                                       remarkPlugins={[remarkGfm]}
                                       components={{
                                          h1: props => <h1 className="text-base font-bold text-gray-900 print:text-black mb-2" {...props} />,
                                          h2: props => <h2 className="text-sm font-bold text-gray-900 print:text-black mb-2" {...props} />,
                                          h3: props => <h3 className="text-sm font-semibold text-gray-900 print:text-black mb-1" {...props} />,
                                          p: props => <p className="text-sm leading-relaxed text-gray-800 print:text-black mb-2" {...props} />,
                                          ul: props => <ul className="text-sm list-disc pl-5 mb-2" {...props} />,
                                          ol: props => <ol className="text-sm list-decimal pl-5 mb-2" {...props} />,
                                          li: props => <li className="text-sm text-gray-800 print:text-black mb-1" {...props} />,
                                          code: props => (
                                             <code
                                                className="px-2 py-0.5 bg-gray-200 text-gray-900 print:bg-gray-300 print:text-black text-xs font-mono"
                                                {...props}
                                             />
                                          ),
                                          table: props => <table className="w-full border-collapse border border-gray-300 text-sm mb-2" {...props} />,
                                          thead: props => <thead className="bg-gray-100 print:bg-gray-200" {...props} />,
                                          th: props => (
                                             <th className="border border-gray-300 px-3 py-2 text-left font-bold text-gray-900 print:text-black" {...props} />
                                          ),
                                          td: props => <td className="border border-gray-300 px-3 py-2 text-gray-800 print:text-black" {...props} />,
                                       }}
                                    >
                                       {prediction.aiAnalysis}
                                    </Markdown>
                                 </div>
                              </div>
                           </div>
                        )}

                        {/* Recommended Actions */}
                        {prediction.recommendedActions.length > 0 && (
                           <div className="border border-green-200 bg-green-50 print:border-green-300">
                              <div className="bg-green-100 px-4 py-2 border-b border-green-200">
                                 <div className="text-sm font-bold text-green-900 uppercase tracking-wide print:text-black">Recommended Preventive Actions</div>
                              </div>
                              <div className="p-4">
                                 <ol className="space-y-2">
                                    {prediction.recommendedActions.map((action, idx) => (
                                       <li key={`action-${prediction.id}-${idx}`} className="flex items-start text-sm text-gray-900 print:text-black">
                                          <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 text-white font-bold text-xs mr-3 flex-shrink-0 mt-0.5 print:bg-green-700">
                                             {idx + 1}
                                          </span>
                                          <span className="whitespace-pre-wrap break-words leading-relaxed">{parse(action.replaceAll('\\n', '<br/>'))}</span>
                                       </li>
                                    ))}
                                 </ol>
                              </div>
                           </div>
                        )}
                     </div>

                     {/* Prediction Footer */}
                     <div className="bg-gray-50 px-6 py-3 border-t border-gray-300">
                        <div className="flex items-center justify-between text-xs text-gray-600 print:text-gray-700">
                           <span>
                              Category: <span className="font-semibold text-gray-900 print:text-black">{prediction.category}</span>
                           </span>
                           <span>
                              Prediction ID: <span className="font-mono text-gray-700 print:text-black">{prediction.id}</span>
                           </span>
                        </div>
                     </div>
                  </section>
               );
            })}
         </div>

         {/* Report Footer Note */}
         <div className="mt-8 p-6 border border-gray-300 bg-gray-50 print:border-gray-300 print:bg-gray-100">
            <p className="text-xs text-gray-700 leading-relaxed print:text-gray-800">
               <strong className="font-bold text-gray-900 print:text-black">Note:</strong> These predictions are generated using advanced machine learning
               algorithms trained on historical cluster performance data. Predictions should be used as a proactive monitoring tool and validated with current
               system metrics. The confidence score indicates the model's certainty based on available data patterns. Regular monitoring and timely action on
               high-severity predictions can prevent potential system failures and maintain optimal cluster health.
            </p>
         </div>
      </div>
   );
}
