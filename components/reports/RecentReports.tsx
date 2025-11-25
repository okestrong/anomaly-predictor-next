/**
 * Recent Reports Component
 * Displays list of recently generated reports
 */

'use client';

import { FileText, Download, Mail, Trash2, Eye, Calendar } from 'lucide-react';
import { Card, Button } from '@/components/common';
import { formatDistanceToNow } from 'date-fns';
import type { Report, ReportType } from '@/types/report';
import SimpleBar from 'simplebar-react';

interface RecentReportsProps {
   reports: Report[];
   onView: (reportId: string) => void;
   onDownload: (reportId: string) => void;
   onEmail: (reportId: string) => void;
   onDelete: (reportId: string) => void;
}

export function RecentReports({ reports, onView, onDownload, onEmail, onDelete }: RecentReportsProps) {
   // Remove duplicates based on report ID
   const uniqueReports = Array.from(new Map(reports.map(report => [report.id, report])).values());

   if (uniqueReports.length === 0) {
      return (
         <Card
            variant="none"
            title="Recent Reports"
            className="mb-8 bg-secondary-800/40 backdrop-blur-md rounded-lg border-ai-primary/30 hover:border-ai-primary/60 transition-all duration-300 hover:shadow-lg hover:shadow-ai-primary/20"
         >
            <div className="text-center py-12">
               <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
               <p className="text-slate-400 dark:text-slate-400">No reports generated yet. Create your first report to get started.</p>
            </div>
         </Card>
      );
   }

   return (
      <div className="mb-8">
         <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-300 dark:text-white">Recent Reports</h2>
            <button className="text-sm text-slate-400 dark:text-blue-400 hover:underline cursor-pointer">View All Reports →</button>
         </div>

         <SimpleBar style={{ width: '100%', maxHeight: 'calc(100vh - 685px)' }}>
            <div className="space-y-3">
               {uniqueReports.slice(0, 10).map(report => (
                  <ReportListItem key={report.id} report={report} onView={onView} onDownload={onDownload} onEmail={onEmail} onDelete={onDelete} />
               ))}
               {/*{Array.from({ length: 20 }).map(() => (
                  <ReportListItem
                     key={uniqueReports[0].id}
                     report={uniqueReports[0]}
                     onView={onView}
                     onDownload={onDownload}
                     onEmail={onEmail}
                     onDelete={onDelete}
                  />
               }*/}
            </div>
         </SimpleBar>
      </div>
   );
}

interface ReportListItemProps {
   report: Report;
   onView: (reportId: string) => void;
   onDownload: (reportId: string) => void;
   onEmail: (reportId: string) => void;
   onDelete: (reportId: string) => void;
}

function ReportListItem({ report, onView, onDownload, onEmail, onDelete }: ReportListItemProps) {
   const statusColors = {
      generating: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      scheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
   };

   const typeColors: Record<ReportType, string> = {
      DAILY: 'text-blue-600 dark:text-blue-400',
      TREND: 'text-green-600 dark:text-green-400',
      PREDICTIONS: 'text-purple-600 dark:text-purple-400',
   };

   return (
      <div className="bg-secondary-800/40 backdrop-blur-md rounded-lg p-4 border border-ai-primary/30 hover:border-ai-primary/60 transition-all duration-300 hover:shadow-lg hover:shadow-ai-primary/20">
         <div className="flex items-start justify-between">
            {/* Left side - Report info */}
            <div className="flex-1">
               <div className="flex items-center gap-3 mb-2">
                  <FileText className={`w-5 h-5 ${typeColors[report.type]}`} />
                  <h3 className="font-semibold text-white">{report.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[report.status]}`}>{report.status}</span>
                  {report.aiInsights && (
                     <span className="px-2 py-1 rounded text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white">AI</span>
                  )}
               </div>

               <div className="flex items-center gap-4 text-sm text-slate-300">
                  <span className="flex items-center gap-1">
                     <Calendar className="w-4 h-4" />
                     {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                  </span>
                  {report.description && <span className="line-clamp-1">{report.description}</span>}
                  <span className="capitalize">{report.type.replace('-', ' ')} Report</span>
               </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2 ml-4">
               <Button variant="ghost" size="sm" onClick={() => onView(report.id)}>
                  <Eye className="w-4 h-4" />
               </Button>
               <Button variant="ghost" size="sm" onClick={() => onDownload(report.id)} disabled={report.status !== 'completed'}>
                  <Download className="w-4 h-4" />
               </Button>
               <Button variant="ghost" size="sm" onClick={() => onEmail(report.id)} disabled={report.status !== 'completed'}>
                  <Mail className="w-4 h-4" />
               </Button>
               <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(report.id)}
                  className="text-red-400 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
               >
                  <Trash2 className="w-4 h-4" />
               </Button>
            </div>
         </div>
      </div>
   );
}
