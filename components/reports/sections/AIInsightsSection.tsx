'use client';

import { Card } from '@/components/common';
import { ReportChart } from '@/components/reports/ReportChart';

interface AIInsightsSectionProps {
   data: {
      anomalies?: Array<{
         id: string;
         component: string;
         description: string;
         anomalyScore: number;
         confidence: number;
         timestamp: string;
         severity: string;
      }>;
      predictions?: Array<{
         category: string;
         probability: number;
         impact: string;
         estimatedTime: string;
         description: string;
      }>;
      recommendations?: Array<{
         id: string;
         title: string;
         description: string;
         priority: string;
         estimatedImpact: string;
         implementation: string;
      }>;
      riskMatrix?: any;
      analysisWindow?: string;
      confidence?: number;
   };
}

export default function AIInsightsSection({ data }: AIInsightsSectionProps) {
   const anomalies = data?.anomalies || [];
   const predictions = data?.predictions || [];
   const recommendations = data?.recommendations || [];

   const getSeverityColor = (severity: string) => {
      const sev = severity.toLowerCase();
      if (sev === 'critical') return 'bg-danger-500 text-white print:bg-red-600';
      if (sev === 'warning') return 'bg-warning-500 text-white print:bg-yellow-600';
      if (sev === 'info') return 'bg-info-500 text-white print:bg-blue-600';
      return 'bg-secondary-500 text-white print:bg-gray-600';
   };

   const getPriorityColor = (priority: string) => {
      const pri = priority.toLowerCase();
      if (pri === 'high' || pri === 'critical') return 'text-danger-500 print:text-red-800';
      if (pri === 'medium') return 'text-warning-500 print:text-yellow-800';
      return 'text-info-500 print:text-blue-800';
   };

   return (
      <div className="space-y-8 print:text-black">
         <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-black">AI-Based Insights</h1>
            <p className="text-sm text-gray-800 print:text-gray-700">
               Machine learning-powered anomaly detection, predictions, and optimization recommendations
            </p>
         </div>

         {/* AI Analysis Metadata */}
         <Card variant="glass" className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 print:bg-blue-50">
            <div className="flex items-center justify-between">
               <div>
                  <p className="text-sm text-blue-400 print:text-blue-900">
                     <strong>Analysis Model:</strong> Isolation Forest + XGBoost
                  </p>
                  <p className="text-sm text-blue-400 print:text-blue-900">
                     <strong>Analysis Window:</strong> {data?.analysisWindow || 'Last 7 days'}
                  </p>
               </div>
               <div className="text-right">
                  <p className="text-sm text-blue-400 print:text-blue-900">
                     <strong>Confidence Level:</strong>
                  </p>
                  <p className="text-2xl font-bold text-blue-500 print:text-black">{data?.confidence?.toFixed(1) || '0.0'}%</p>
               </div>
            </div>
         </Card>

         {/* Anomaly Detection Results */}
         <section>
            <h2 className="text-2xl font-semibold mb-4 print:text-black">Anomaly Detection</h2>
            <Card variant="glass" className="p-6 mb-6 print:border print:border-gray-300 print:bg-white">
               <h3 className="text-lg font-medium mb-3 text-white print:text-black">Detected Anomalies</h3>
               <div className="space-y-3">
                  {anomalies.length > 0 ? (
                     anomalies.map(anomaly => (
                        <div key={anomaly.id} className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 print:bg-amber-50">
                           <div className="flex items-start justify-between mb-2">
                              <div>
                                 <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getSeverityColor(anomaly.severity)}`}>
                                    {anomaly.severity.toUpperCase()}
                                 </span>
                                 <span className="ml-2 text-sm font-medium text-gray-900 print:text-black">{anomaly.component}</span>
                              </div>
                              <span className="text-xs text-gray-500 print:text-gray-600">{new Date(anomaly.timestamp).toLocaleString()}</span>
                           </div>
                           <p className="text-sm text-gray-700 mb-2 print:text-gray-800">{anomaly.description}</p>
                           <div className="flex items-center gap-4 text-xs text-gray-600 print:text-gray-700">
                              <span>
                                 <strong className="print:text-black">Anomaly Score:</strong> {(anomaly.anomalyScore * 100).toFixed(1)}%
                              </span>
                              <span>
                                 <strong className="print:text-black">Confidence:</strong> {anomaly.confidence.toFixed(1)}%
                              </span>
                           </div>
                        </div>
                     ))
                  ) : (
                     <div className="p-4 bg-success-50 rounded-lg border border-success-200 print:bg-green-50 text-center">
                        <p className="text-sm text-success-700 print:text-green-800">No anomalies detected in the analysis window</p>
                     </div>
                  )}
               </div>
            </Card>
         </section>

         {/* Predictive Analytics */}
         <section className="page-break-before">
            <h2 className="text-2xl font-semibold mb-4 print:text-black">Predictive Analytics</h2>
            <Card variant="glass" className="p-6 mb-6 print:border print:border-gray-300 print:bg-white">
               <h3 className="text-lg font-medium mb-3 text-white print:text-black">Predicted Events</h3>
               <div className="space-y-3">
                  {predictions.length > 0 ? (
                     predictions.map((prediction, idx) => (
                        <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-200 print:bg-blue-50">
                           <div className="flex items-start justify-between mb-2">
                              <p className="text-sm font-medium text-gray-900 print:text-black">{prediction.category.replace(/_/g, ' ').toUpperCase()}</p>
                              <div className="text-right">
                                 <p className="text-lg font-bold text-blue-600 print:text-blue-900">{prediction.probability.toFixed(1)}%</p>
                                 <p className="text-xs text-gray-500 print:text-gray-600">probability</p>
                              </div>
                           </div>
                           <p className="text-sm text-gray-700 mb-2 print:text-gray-800">{prediction.description}</p>
                           <div className="flex items-center gap-4 text-xs text-gray-600 print:text-gray-700">
                              <span>
                                 <strong className="print:text-black">Impact:</strong> {prediction.impact}
                              </span>
                              <span>
                                 <strong className="print:text-black">Est. Time:</strong> {prediction.estimatedTime}
                              </span>
                           </div>
                        </div>
                     ))
                  ) : (
                     <div className="p-4 bg-success-50 rounded-lg border border-success-200 print:bg-green-50 text-center">
                        <p className="text-sm text-success-700 print:text-green-800">No high-probability events predicted</p>
                     </div>
                  )}
               </div>
            </Card>
         </section>

         {/* Optimization Recommendations */}
         <section>
            <h2 className="text-2xl font-semibold mb-4 print:text-black">Optimization Recommendations</h2>
            <Card variant="glass" className="p-6 print:border print:border-gray-300 print:bg-white">
               <h3 className="text-lg font-medium mb-3 text-white print:text-black">AI-Generated Recommendations</h3>
               <div className="space-y-4">
                  {recommendations.length > 0 ? (
                     recommendations.map(rec => (
                        <div key={rec.id} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 print:bg-purple-50">
                           <div className="flex items-start justify-between mb-2">
                              <h4 className="text-sm font-semibold text-gray-900 print:text-black">{rec.title}</h4>
                              <span className={`text-sm font-semibold ${getPriorityColor(rec.priority)}`}>{rec.priority.toUpperCase()}</span>
                           </div>
                           <p className="text-sm text-gray-700 mb-2 print:text-gray-800">{rec.description}</p>
                           <div className="mt-3 pt-3 border-t border-purple-200">
                              <p className="text-xs text-gray-600 mb-1 print:text-gray-700">
                                 <strong className="print:text-black">Estimated Impact:</strong> {rec.estimatedImpact}
                              </p>
                              <p className="text-xs text-gray-600 print:text-gray-700">
                                 <strong className="print:text-black">Implementation:</strong> {rec.implementation}
                              </p>
                           </div>
                        </div>
                     ))
                  ) : (
                     <div className="p-4 bg-success-50 rounded-lg border border-success-200 print:bg-green-50 text-center">
                        <p className="text-sm text-success-700 print:text-green-800">System is optimally configured. No recommendations at this time.</p>
                     </div>
                  )}
               </div>
            </Card>
         </section>
      </div>
   );
}
