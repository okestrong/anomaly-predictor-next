'use client';

import { Card } from '@/components/common';

interface Event {
   timestamp: string;
   type: string;
   category: string;
   description: string;
   user?: string;
   severity?: string;
}

interface OperationalHistoryProps {
   data: {
      configChanges?: Event[];
      maintenanceLogs?: Event[];
      incidents?: Event[];
      performanceTuning?: Event[];
   };
}

export default function OperationalHistory({ data }: OperationalHistoryProps) {
   const configChanges = data?.configChanges || [];
   const maintenanceLogs = data?.maintenanceLogs || [];
   const incidents = data?.incidents || [];
   const performanceTuning = data?.performanceTuning || [];

   // Combine and sort all events by timestamp
   const allEvents = [
      ...configChanges.map(e => ({ ...e, category: 'Configuration' })),
      ...maintenanceLogs.map(e => ({ ...e, category: 'Maintenance' })),
      ...incidents.map(e => ({ ...e, category: 'Incident' })),
      ...performanceTuning.map(e => ({ ...e, category: 'Performance Tuning' })),
   ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

   const getCategoryColor = (category: string) => {
      switch (category.toLowerCase()) {
         case 'configuration':
            return 'bg-blue-500 text-white print:bg-blue-600';
         case 'maintenance':
            return 'bg-green-500 text-white print:bg-green-600';
         case 'incident':
            return 'bg-danger-500 text-white print:bg-red-600';
         case 'performance tuning':
            return 'bg-purple-500 text-white print:bg-purple-600';
         default:
            return 'bg-secondary-500 text-white print:bg-gray-600';
      }
   };

   const getSeverityIcon = (severity?: string) => {
      if (!severity) return '📝';
      switch (severity.toLowerCase()) {
         case 'critical':
            return '🔴';
         case 'warning':
            return '⚠️';
         case 'info':
            return 'ℹ️';
         default:
            return '📝';
      }
   };

   const formatEventDate = (timestamp: string) => {
      const date = new Date(timestamp);
      return {
         date: date.toLocaleDateString(),
         time: date.toLocaleTimeString(),
      };
   };

   return (
      <div className="space-y-8 print:text-black">
         <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-black">Operational History</h1>
            <p className="text-sm text-gray-800 print:text-gray-700">Recent configuration changes, maintenance activities, and operational events</p>
         </div>

         {/* Summary Cards */}
         <div className="grid grid-cols-4 gap-4 mb-6">
            <Card variant="glass" className="p-4 print:border print:border-gray-300 print:bg-white">
               <p className="text-xs text-blue-400 mb-1 print:text-blue-700">Config Changes</p>
               <p className="text-2xl font-bold text-blue-600 print:text-black">{configChanges.length}</p>
            </Card>
            <Card variant="glass" className="p-4 print:border print:border-gray-300 print:bg-white">
               <p className="text-xs text-green-400 mb-1 print:text-green-800">Maintenance Events</p>
               <p className="text-2xl font-bold text-green-600 print:text-black">{maintenanceLogs.length}</p>
            </Card>
            <Card variant="glass" className="p-4 print:border print:border-gray-300 print:bg-white">
               <p className="text-xs text-red-400 mb-1 print:text-red-700">Incidents</p>
               <p className="text-2xl font-bold text-red-600 print:text-black">{incidents.length}</p>
            </Card>
            <Card variant="glass" className="p-4 print:border print:border-gray-300 print:bg-white">
               <p className="text-xs text-purple-400 mb-1 print:text-purple-700">Performance Tuning</p>
               <p className="text-2xl font-bold text-purple-600 print:text-black">{performanceTuning.length}</p>
            </Card>
         </div>

         {/* Event Timeline */}
         <section>
            <h2 className="text-2xl font-semibold mb-4 print:text-black">Event Timeline</h2>
            <Card variant="glass" className="p-6 print:border print:border-gray-300 print:bg-white">
               {allEvents.length > 0 ? (
                  <div className="space-y-4">
                     {allEvents.slice(0, 20).map((event, idx) => {
                        const { date, time } = formatEventDate(event.timestamp);
                        return (
                           <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-lg border-l-4 border-ai-primary print:bg-gray-100">
                              <div className="flex-shrink-0 w-32">
                                 <p className="text-sm font-medium text-gray-900 print:text-black">{date}</p>
                                 <p className="text-xs text-gray-600 print:text-gray-700">{time}</p>
                                 <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${getCategoryColor(event.category)}`}>
                                    {event.category}
                                 </span>
                              </div>
                              <div className="flex-1">
                                 <div className="flex items-start gap-2 mb-1">
                                    <span className="text-lg">{getSeverityIcon(event.severity)}</span>
                                    <p className="text-sm font-semibold text-gray-900 print:text-black">{event.type}</p>
                                 </div>
                                 <p className="text-sm text-gray-700 mb-2 print:text-gray-800">{event.description}</p>
                                 {event.user && (
                                    <p className="text-xs text-gray-500 print:text-gray-600">
                                       <strong className="print:text-black">User:</strong> {event.user}
                                    </p>
                                 )}
                              </div>
                           </div>
                        );
                     })}
                     {allEvents.length > 20 && (
                        <p className="text-sm text-gray-500 text-center mt-4 print:text-gray-600">
                           Showing 20 of {allEvents.length} events. Complete history available in system logs.
                        </p>
                     )}
                  </div>
               ) : (
                  <div className="p-8 bg-gray-50 rounded-lg text-center print:bg-gray-100">
                     <p className="text-sm text-gray-500 print:text-gray-600">No operational events recorded in this period</p>
                  </div>
               )}
            </Card>
         </section>

         {/* Detailed Breakdown by Category */}
         <section className="grid grid-cols-2 gap-6">
            {/* Configuration Changes */}
            <Card variant="glass" className="p-6 print:border print:border-gray-300 print:bg-white">
               <h3 className="text-lg font-medium mb-3 text-white print:text-black">Recent Configuration Changes</h3>
               {configChanges.length > 0 ? (
                  <div className="space-y-2">
                     {configChanges.slice(0, 5).map((event, idx) => (
                        <div key={idx} className="p-2 bg-blue-50 rounded text-sm print:bg-blue-50">
                           <p className="font-medium text-gray-900 print:text-black">{event.type}</p>
                           <p className="text-xs text-gray-200 print:text-gray-700">{formatEventDate(event.timestamp).date}</p>
                        </div>
                     ))}
                  </div>
               ) : (
                  <p className="text-sm text-gray-300 print:text-gray-600">No configuration changes</p>
               )}
            </Card>

            {/* Incidents */}
            <Card variant="glass" className="p-6 print:border print:border-gray-300 print:bg-white">
               <h3 className="text-lg font-medium mb-3 text-white print:text-black">Recent Incidents</h3>
               {incidents.length > 0 ? (
                  <div className="space-y-2">
                     {incidents.slice(0, 5).map((event, idx) => (
                        <div key={idx} className="p-2 bg-red-50 rounded text-sm print:bg-red-50">
                           <p className="font-medium text-gray-900 print:text-black">{event.type}</p>
                           <p className="text-xs text-gray-600 print:text-gray-700">{formatEventDate(event.timestamp).date}</p>
                        </div>
                     ))}
                  </div>
               ) : (
                  <p className="text-sm text-success-700 print:text-green-800">No incidents reported</p>
               )}
            </Card>
         </section>
      </div>
   );
}
