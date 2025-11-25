import { FC } from 'react';
import type { Report } from '@/types/report';

interface Props {
   currentReport: Report;
}

const ExecutiveAlerts: FC<Props> = ({ currentReport }) => {
   return (
      <div className="border border-gray-300 bg-white">
         <div className="bg-gray-50 px-6 py-3 border-b border-gray-300">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Critical Issues & Action Items</h2>
         </div>
         <div className="p-6">
            <div className="space-y-2">
               {currentReport.data?.alerts?.topAlerts?.[0] ? (
                  (
                     currentReport.data?.alerts?.topAlerts?.map(a => ({
                        severity: a.severity,
                        title: a.title,
                        description: a.message,
                        action: a.resolveAction || 'Review and acknowledge',
                     })) || []
                  ).map((issue, idx) => (
                     <div key={`issue-${issue.title || idx}`} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200">
                        <span
                           className={`inline-block px-2 py-0.5 text-[10px] font-bold ${
                              issue.severity === 'critical'
                                 ? 'bg-red-600 text-white'
                                 : issue.severity === 'warning'
                                   ? 'bg-yellow-600 text-white'
                                   : 'bg-blue-600 text-white'
                           }`}
                        >
                           {issue.severity.toUpperCase()}
                        </span>
                        <div className="flex-1">
                           <p className="font-semibold text-sm text-gray-900">{issue.title}</p>
                           <p className="text-xs text-gray-700 mt-1">{issue.description}</p>
                           <p className="text-xs font-medium text-blue-700 mt-2">Action: {issue.action}</p>
                        </div>
                     </div>
                  ))
               ) : (
                  <div className="p-4 bg-green-50 border border-green-200 text-center">
                     <p className="text-xs text-green-800">No critical issues detected. System is operating normally.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default ExecutiveAlerts;
