/**
 * Report Header Component
 * Main header for the reports dashboard
 */

'use client';

import { useState } from 'react';
import { FileText, Clock, TrendingUp, FileDown, Mail } from 'lucide-react';
import { Button } from '@/components/common';
import EmailSettingsDialog from './EmailSettingsDialog';

interface ReportHeaderProps {
   stats?: {
      totalReports: number;
      reportsThisMonth: number;
      activeSchedules: number;
      totalTemplates: number;
   };
}

export function ReportHeader({ stats }: ReportHeaderProps) {
   const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

   return (
      <div className="mb-8">
         <div className="flex items-center justify-between mb-6">
            <div>
               <h1 className="text-3xl font-bold text-slate-200 dark:text-white mb-2">Reports Dashboard</h1>
               <p className="text-slate-400 dark:text-slate-400">
                  Generate, schedule, and manage cluster reports with AI-powered insights
               </p>
            </div>

            <div className="flex gap-3">
               <Button variant="secondary" size="md" onClick={() => setIsEmailDialogOpen(true)}>
                  <div className="flex items-center space-x-2">
                     <Mail className="w-4 h-4 mr-2" />
                     <span>Email Settings</span>
                  </div>
               </Button>
               <Button variant="secondary" size="md">
                  <div className="flex items-center space-x-2">
                     <Clock className="w-4 h-4 mr-2" />
                     <span>Scheduled Reports</span>
                  </div>
               </Button>
            </div>
         </div>

         {/* Email Settings Dialog */}
         <EmailSettingsDialog isOpen={isEmailDialogOpen} onClose={() => setIsEmailDialogOpen(false)} />


         {/* Statistics Cards */}
         {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <StatCard
                  icon={<FileText className="w-5 h-5" />}
                  label="Total Reports"
                  value={stats.totalReports}
                  iconColor="text-blue-500"
                  bgColor="bg-blue-50 dark:bg-blue-900/20"
               />
               <StatCard
                  icon={<TrendingUp className="w-5 h-5" />}
                  label="This Month"
                  value={stats.reportsThisMonth}
                  iconColor="text-green-500"
                  bgColor="bg-green-50 dark:bg-green-900/20"
               />
               <StatCard
                  icon={<Clock className="w-5 h-5" />}
                  label="Active Schedules"
                  value={stats.activeSchedules}
                  iconColor="text-purple-500"
                  bgColor="bg-purple-50 dark:bg-purple-900/20"
               />
               <StatCard
                  icon={<FileDown className="w-5 h-5" />}
                  label="Templates"
                  value={stats.totalTemplates}
                  iconColor="text-amber-500"
                  bgColor="bg-amber-50 dark:bg-amber-900/20"
               />
            </div>
         )}
      </div>
   );
}

interface StatCardProps {
   icon: React.ReactNode;
   label: string;
   value: number;
   iconColor: string;
   bgColor: string;
}

function StatCard({ icon, label, value, iconColor, bgColor }: StatCardProps) {
   return (
      <div className="bg-secondary-800/40 backdrop-blur-md rounded-lg p-4 border border-ai-primary/30 hover:border-ai-primary/60 transition-all duration-300 hover:shadow-lg hover:shadow-ai-primary/20">
         <div className="flex items-center justify-between">
            <div>
               <p className="text-sm text-slate-300 mb-1">{label}</p>
               <p className="text-2xl font-bold text-white">{value}</p>
            </div>
            <div className={`${bgColor} ${iconColor} p-3 rounded-lg`}>{icon}</div>
         </div>
      </div>
   );
}
