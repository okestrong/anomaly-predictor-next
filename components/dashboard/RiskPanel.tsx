'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ExclamationTriangleIcon, SparklesIcon, CheckCircleIcon, CpuChipIcon, CircleStackIcon, WifiIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Button, Card } from '@/components/common';

interface RiskFactor {
   id: number;
   title: string;
   description: string;
   severity: 'critical' | 'high' | 'medium' | 'low';
   impact: number;
   eta: string;
   icon: React.ComponentType<{ className?: string }>;
}

interface Recommendation {
   id: number;
   action: string;
   priority: 'High' | 'Medium' | 'Low';
}

export default function RiskPanel() {
   const [activeTab, setActiveTab] = useState<'risks' | 'recommendations'>('risks');
   const [overallRiskScore] = useState(73);
   const [lastAnalysis, setLastAnalysis] = useState('2 minutes ago');
   const [isHovered, setIsHovered] = useState(false);

   const [riskFactors] = useState<RiskFactor[]>([
      {
         id: 1,
         title: 'OSD Failure Prediction',
         description: 'High probability of OSD.12 failure within 48 hours',
         severity: 'critical',
         impact: 85,
         eta: '2 days',
         icon: CircleStackIcon,
      },
      {
         id: 2,
         title: 'Memory Usage Spike',
         description: 'Abnormal memory usage pattern on MON nodes',
         severity: 'high',
         impact: 65,
         eta: '6 hours',
         icon: CpuChipIcon,
      },
      {
         id: 3,
         title: 'Network Latency',
         description: 'Increasing network latency between nodes',
         severity: 'medium',
         impact: 45,
         eta: '12 hours',
         icon: WifiIcon,
      },
      {
         id: 4,
         title: 'Scrub Performance',
         description: 'Deep scrub operations taking longer than usual',
         severity: 'low',
         impact: 25,
         eta: '1 week',
         icon: ClockIcon,
      },
   ]);

   const [recommendations] = useState<Recommendation[]>([
      {
         id: 1,
         action: 'Replace OSD.12 before predicted failure',
         priority: 'High',
      },
      {
         id: 2,
         action: 'Increase memory allocation for MON services',
         priority: 'Medium',
      },
      {
         id: 3,
         action: 'Optimize network configuration between racks',
         priority: 'Medium',
      },
      {
         id: 4,
         action: 'Schedule scrub operations during off-peak hours',
         priority: 'Low',
      },
   ]);

   // Auto tab switching
   useEffect(() => {
      const interval = setInterval(() => {
         if (!isHovered) {
            setActiveTab(current => (current === 'risks' ? 'recommendations' : 'risks'));
         }
      }, 30000);

      return () => clearInterval(interval);
   }, [isHovered]);

   // Computed properties
   const overallRiskLevel = useMemo(() => {
      if (overallRiskScore >= 80) return 'Critical';
      if (overallRiskScore >= 60) return 'High';
      if (overallRiskScore >= 40) return 'Medium';
      return 'Low';
   }, [overallRiskScore]);

   const overallRiskBg = useMemo(() => {
      if (overallRiskScore >= 80) return 'bg-danger-500/20';
      if (overallRiskScore >= 60) return 'bg-warning-500/20';
      if (overallRiskScore >= 40) return 'bg-info-500/20';
      return 'bg-success-500/20';
   }, [overallRiskScore]);

   const overallRiskBorder = useMemo(() => {
      if (overallRiskScore >= 80) return 'border-danger-500';
      if (overallRiskScore >= 60) return 'border-warning-500';
      if (overallRiskScore >= 40) return 'border-info-500';
      return 'border-success-500';
   }, [overallRiskScore]);

   const overallRiskTextColor = useMemo(() => {
      if (overallRiskScore >= 80) return 'text-danger-400';
      if (overallRiskScore >= 60) return 'text-warning-400';
      if (overallRiskScore >= 40) return 'text-info-400';
      return 'text-success-400';
   }, [overallRiskScore]);

   // Helper methods
   const getRiskBorderColor = (severity: string) => {
      switch (severity) {
         case 'critical':
            return 'border-danger-500';
         case 'high':
            return 'border-warning-500';
         case 'medium':
            return 'border-info-500';
         case 'low':
            return 'border-success-500';
         default:
            return 'border-secondary-500';
      }
   };

   const getRiskIconColor = (severity: string) => {
      switch (severity) {
         case 'critical':
            return 'text-danger-400';
         case 'high':
            return 'text-warning-400';
         case 'medium':
            return 'text-info-400';
         case 'low':
            return 'text-success-400';
         default:
            return 'text-secondary-400';
      }
   };

   const getRiskBadgeColor = (severity: string) => {
      switch (severity) {
         case 'critical':
            return 'bg-danger-500/20 text-danger-400';
         case 'high':
            return 'bg-warning-500/20 text-warning-400';
         case 'medium':
            return 'bg-info-500/20 text-info-400';
         case 'low':
            return 'bg-success-500/20 text-success-400';
         default:
            return 'bg-secondary-500/20 text-secondary-400';
      }
   };

   const getRiskProgressColor = (severity: string) => {
      switch (severity) {
         case 'critical':
            return 'bg-danger-500';
         case 'high':
            return 'bg-warning-500';
         case 'medium':
            return 'bg-info-500';
         case 'low':
            return 'bg-success-500';
         default:
            return 'bg-secondary-500';
      }
   };

   const getPriorityColor = (priority: string) => {
      switch (priority.toLowerCase()) {
         case 'high':
            return 'bg-danger-500/20 text-danger-400';
         case 'medium':
            return 'bg-warning-500/20 text-warning-400';
         case 'low':
            return 'bg-success-500/20 text-success-400';
         default:
            return 'bg-secondary-500/20 text-secondary-400';
      }
   };

   const getConfidence = (priority: string) => {
      switch (priority.toLowerCase()) {
         case 'high':
            return 95;
         case 'medium':
            return 87;
         case 'low':
            return 72;
         default:
            return 50;
      }
   };

   // Event handlers
   const runRiskAnalysis = () => {
      console.log('Running AI risk analysis...');
      setLastAnalysis('Just now');
   };

   const viewRiskDetails = (risk: RiskFactor) => {
      console.log('View risk details:', risk.title);
   };

   const implementRecommendation = (recommendation: Recommendation) => {
      console.log('Implementing recommendation:', recommendation.action);
   };

   const viewRiskHistory = () => {
      console.log('View risk history');
   };

   const exportRiskReport = () => {
      console.log('Export risk report');
   };

   return (
      <div className="col-span-2" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
         <Card
            variant="cyber"
            className="h-full"
            header={
               <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                     <ExclamationTriangleIcon className="w-5 h-5 text-warning-400" />
                     <h3 className="text-lg font-semibold text-white">Risk Assessment</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                     <div className="flex items-center space-x-1">
                        <SparklesIcon className="w-4 h-4 text-ai-neon neural-pulse" />
                        <span className="text-xs text-ai-neon">AI Powered</span>
                     </div>
                     <Button size="xs" variant="ai" onClick={runRiskAnalysis}>
                        Analyze
                     </Button>
                  </div>
               </div>
            }
            footer={
               <div className="flex items-center justify-between text-xs text-secondary-400">
                  <span>Last analysis: {lastAnalysis}</span>
                  <div className="flex space-x-2">
                     <Button size="xs" variant="secondary" onClick={viewRiskHistory}>
                        History
                     </Button>
                     <Button size="xs" variant="ai" onClick={exportRiskReport}>
                        Export
                     </Button>
                  </div>
               </div>
            }
         >
            {/* Overall risk score */}
            <div className="text-center mb-6 pt-4">
               <div className="relative inline-flex items-center justify-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl relative ${overallRiskBg}`}>
                     {overallRiskScore}
                     <div className={`absolute inset-0 rounded-full border-4 border-dashed neural-pulse ${overallRiskBorder}`} />
                  </div>
               </div>
               <p className={`mt-3 text-sm font-medium ${overallRiskTextColor}`}>{overallRiskLevel} Risk</p>
               <p className="text-xs text-secondary-400 mt-1">Based on {riskFactors.length} factors</p>
            </div>

            {/* AI-powered tab navigation */}
            <div className="mb-4 px-2">
               <div className="relative flex rounded-lg bg-secondary-800/30 p-1 border border-secondary-700">
                  {/* Active tab background (Sliding indicator) */}
                  <div
                     className={`absolute inset-y-1 bg-gradient-to-r rounded-md border transition-all duration-500 ease-out neural-pulse ${
                        activeTab === 'risks'
                           ? 'from-ai-circuit/20 to-ai-circuit/10 border-ai-circuit/30'
                           : 'from-ai-cyber/20 to-ai-cyber/10 border-ai-cyber/30'
                     }`}
                     style={{
                        width: 'calc(50% - 4px)',
                        left: activeTab === 'risks' ? '4px' : '50%',
                     }}
                  />

                  {/* Tab buttons */}
                  <button
                     onClick={() => setActiveTab('risks')}
                     className={`relative flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-300 z-10 h-10 ${
                        activeTab === 'risks' ? 'text-ai-circuit' : 'text-secondary-400 hover:text-white'
                     }`}
                  >
                     <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                     Risk Factors
                     <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs bg-ai-circuit/20 text-ai-circuit rounded-full border border-ai-circuit/30">
                        {riskFactors.length}
                     </span>
                  </button>

                  <button
                     onClick={() => setActiveTab('recommendations')}
                     className={`relative flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-300 z-10 h-10 ${
                        activeTab === 'recommendations' ? 'text-violet-100' : 'text-secondary-400 hover:text-white'
                     }`}
                  >
                     <SparklesIcon className="w-4 h-4 mr-2" />
                     AI Recommendations
                     <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs bg-ai-cyber/20 text-ai-cyber rounded-full border border-ai-cyber/30">
                        {recommendations.length}
                     </span>
                  </button>
               </div>
            </div>

            {/* Tab content - Fixed height container with sliding transitions */}
            <div className="relative h-[590px] overflow-hidden">
               {/* Risk Factors tab */}
               <div
                  className={`absolute inset-0 transition-transform duration-500 ease-out overflow-y-auto px-4 ${
                     activeTab === 'risks' ? 'translate-x-0' : '-translate-x-full'
                  }`}
               >
                  <div className="space-y-3 pb-2">
                     {riskFactors.map(risk => (
                        <div
                           key={risk.id}
                           className={`group flex items-start space-x-3 p-3 bg-secondary-800/30 rounded-lg border-l-2 transition-all duration-300 hover:bg-secondary-800/50 hover:scale-[1.01] hover:shadow-lg hover:shadow-ai-circuit/10 ${getRiskBorderColor(risk.severity)}`}
                        >
                           <div className="flex-shrink-0 mt-1">
                              <risk.icon className={`w-4 h-4 transition-colors duration-300 ${getRiskIconColor(risk.severity)}`} />
                           </div>

                           <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                 <p className="text-sm font-medium text-white truncate">{risk.title}</p>
                                 <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full transition-all duration-300 group-hover:scale-105 ${getRiskBadgeColor(risk.severity)}`}
                                 >
                                    {risk.severity}
                                 </span>
                              </div>
                              <p className="text-xs text-secondary-400 mt-1">{risk.description}</p>

                              {/* Risk progress */}
                              <div className="mt-2">
                                 <div className="flex items-center justify-between text-xs text-secondary-400 mb-1">
                                    <span>Impact Level</span>
                                    <span>{risk.impact}%</span>
                                 </div>
                                 <div className="w-full bg-secondary-700 rounded-full h-1">
                                    <div
                                       className={`h-1 rounded-full transition-all duration-500 ${getRiskProgressColor(risk.severity)}`}
                                       style={{ width: `${risk.impact}%` }}
                                    />
                                 </div>
                              </div>

                              {/* ETA */}
                              <div className="flex items-center justify-between mt-2 text-xs">
                                 <span className="text-secondary-400">ETA: {risk.eta}</span>
                                 <Button
                                    size="xs"
                                    variant="secondary"
                                    onClick={() => viewRiskDetails(risk)}
                                    className="opacity-80 group-hover:opacity-100 transition-opacity"
                                 >
                                    Details
                                 </Button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* AI Recommendations tab */}
               <div
                  className={`absolute inset-0 transition-transform duration-500 ease-out overflow-y-auto px-4 ${
                     activeTab === 'recommendations' ? 'translate-x-0' : 'translate-x-full'
                  }`}
               >
                  <div className="space-y-3 pb-2">
                     {recommendations.map((recommendation, index) => (
                        <div
                           key={recommendation.id}
                           className="group flex items-start space-x-3 p-3 bg-gradient-to-r from-ai-glow/5 to-ai-cyber/5 rounded-lg border border-ai-glow/20 transition-all duration-300 hover:from-ai-glow/10 hover:to-ai-cyber/10 hover:border-ai-glow/30 hover:scale-[1.01] hover:shadow-lg hover:shadow-ai-glow/10"
                           style={{ animationDelay: `${index * 100}ms` }}
                        >
                           <div className="flex-shrink-0 mt-1">
                              <CheckCircleIcon className="w-4 h-4 text-ai-neon neural-pulse transition-transform duration-300 group-hover:scale-110" />
                           </div>

                           <div className="flex-1">
                              <div className="flex items-start justify-between">
                                 <p className="text-sm text-white font-medium leading-relaxed">{recommendation.action}</p>
                                 <span
                                    className={`ml-3 px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-all duration-300 group-hover:scale-105 ${getPriorityColor(recommendation.priority)}`}
                                 >
                                    {recommendation.priority}
                                 </span>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                 <p className="text-xs text-ai-circuit">AI Confidence: {getConfidence(recommendation.priority)}%</p>
                                 <Button
                                    size="xs"
                                    variant="ai"
                                    onClick={() => implementRecommendation(recommendation)}
                                    className="opacity-80 group-hover:opacity-100 transition-all duration-300"
                                 >
                                    Apply
                                 </Button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </Card>
      </div>
   );
}
