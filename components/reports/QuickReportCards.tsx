/**
 * Quick Report Cards Component
 * Cards for quick access to different report types
 */

'use client';

import { Activity, Brain, Calendar, CalendarDays, CalendarRange, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ReportType } from '@/types/report';
import { ReactNode } from 'react';

interface ReportTypeCard {
   id: ReportType;
   title: string;
   description: string;
   icon: ReactNode;
   color: string;
   borderColor: string;
   bgColor: string;
   badge?: string;
   route: string;
}

const reportTypes: ReportTypeCard[] = [
   {
      id: 'DAILY',
      title: 'Daily Report',
      description: '24-hour cluster status summary',
      icon: <Calendar className="w-6 h-6" />,
      color: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      route: '/reports/daily',
   },
   {
      id: 'WEEKLY',
      title: 'Weekly Report',
      description: '7-day trend analysis',
      icon: <CalendarDays className="w-6 h-6" />,
      color: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      route: '/reports/weekly',
   },
   {
      id: 'MONTHLY',
      title: 'Monthly Report',
      description: 'Comprehensive monthly analysis',
      icon: <CalendarRange className="w-6 h-6" />,
      color: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-800',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      route: '/reports/monthly',
   },
   {
      id: 'AI_INSIGHTS',
      title: 'AI Insights',
      description: 'AI-based analysis and recommendations',
      icon: <Brain className="w-6 h-6" />,
      color: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-800',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      badge: 'AI',
      route: '/reports/ai-insights',
   },
   {
      id: 'PREDICTIONS',
      title: 'Predictions',
      description: 'Failure prediction and risk analysis',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'text-cyan-600 dark:text-cyan-400',
      borderColor: 'border-cyan-200 dark:border-cyan-800',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
      route: '/reports/predictions',
   },
   {
      id: 'PERFORMANCE',
      title: 'Performance',
      description: 'Performance metrics and optimization',
      icon: <Activity className="w-6 h-6" />,
      color: 'text-rose-600 dark:text-rose-400',
      borderColor: 'border-rose-200 dark:border-rose-800',
      bgColor: 'bg-rose-50 dark:bg-rose-900/20',
      route: '/reports/performance',
   },
];

export function QuickReportCards() {
   const router = useRouter();

   const handleCardClick = (route: string) => {
      router.push(route);
   };

   return (
      <div className="mb-8">
         <h2 className="text-xl font-semibold text-slate-200 dark:text-white mb-4">Quick Report Generation</h2>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map(reportType => (
               <QuickReportCard key={reportType.id} {...reportType} onClick={() => handleCardClick(reportType.route)} />
            ))}
         </div>
      </div>
   );
}

interface QuickReportCardProps extends ReportTypeCard {
   onClick: () => void;
}

function QuickReportCard({ title, description, icon, color, borderColor, bgColor, badge, onClick }: QuickReportCardProps) {
   return (
      <div
         onClick={onClick}
         className={`
            relative bg-secondary-800/40 backdrop-blur-md rounded-lg p-6 border border-ai-primary/90
            cursor-pointer transition-all duration-300
            hover:scale-105 hover:shadow-xl hover:shadow-ai-primary/20 hover:border-ai-primary/60
            group
         `}
      >
         {/* Badge */}
         {badge && (
            <div className="absolute top-3 right-3">
               <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold">{badge}</span>
            </div>
         )}

         {/* Icon */}
         <div
            className={`${bgColor} ${color} w-12 h-12 rounded-lg flex items-center justify-center mb-4
            group-hover:scale-110 transition-transform duration-300`}
         >
            {icon}
         </div>

         {/* Title */}
         <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>

         {/* Description */}
         <p className="text-sm text-slate-300">{description}</p>

         {/* Hover Arrow */}
         <div className="mt-4 flex items-center text-sm font-medium text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Generate Report
            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
         </div>
      </div>
   );
}
