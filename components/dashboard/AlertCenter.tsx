'use client';

import React, { useMemo, useState } from 'react';
import {
   BellIcon,
   CheckCircleIcon,
   CircleStackIcon,
   CpuChipIcon,
   ExclamationTriangleIcon,
   InformationCircleIcon,
   SparklesIcon,
   WifiIcon,
   XCircleIcon,
} from '@heroicons/react/24/outline';
import { Button, Card, FuturisticSpinner } from '@/components/common';
import { useDashboardStore } from '@/stores/dashboard';
import { DashboardAPI } from '@/lib/api/dashboardApi';
import dayjs from 'dayjs';
import { useShallow } from 'zustand/react/shallow';
import SimpleBar from 'simplebar-react';

interface Alert {
   id: string;
   title: string;
   message: string;
   severity: 'critical' | 'warning' | 'info';
   timestamp: string;
   source: string;
   count: number;
   read: boolean;
   icon: React.ComponentType<{ className?: string }>;
   aiSuggestion?: string;
}

interface AlertFilter {
   type: string;
   label: string;
   count: number;
}

export default function AlertCenter() {
   const { dashboardData, isLoading, refreshDashboard } = useDashboardStore(
      useShallow(state => ({
         dashboardData: state.dashboardData,
         isLoading: state.isLoading,
         refreshDashboard: state.refreshDashboard,
      })),
   );
   const [selectedFilter, setSelectedFilter] = useState('all');
   const [autoRefresh, setAutoRefresh] = useState(true);
   const [markingAsRead, setMarkingAsRead] = useState<Set<string>>(new Set());
   const [localReadStatus, setLocalReadStatus] = useState<Map<string, boolean>>(new Map());

   // Get icon for alert type
   const getAlertIcon = (type: string): React.ComponentType<{ className?: string }> => {
      switch (type.toLowerCase()) {
         case 'osd':
         case 'storage':
            return CircleStackIcon;
         case 'memory':
         case 'cpu':
            return CpuChipIcon;
         case 'network':
            return WifiIcon;
         case 'error':
         case 'failure':
            return XCircleIcon;
         case 'warning':
            return ExclamationTriangleIcon;
         case 'info':
         case 'success':
            return CheckCircleIcon;
         default:
            return InformationCircleIcon;
      }
   };

   // Extract alerts from dashboard store
   const backendAlerts = dashboardData?.alerts || [];
   const activeAlerts: Alert[] = backendAlerts.map((alert, index) => {
      const alertId = alert.id || `alert-${index + 1}`;
      return {
         id: alertId,
         title: alert.message,
         message: alert.description,
         severity: alert.severity as 'critical' | 'warning' | 'info',
         timestamp: dayjs(alert.timestamp).format('YYYY-MM-DD HH:mm:ss'),
         source: alert.source,
         count: alert.count || 1,
         // Use local read status if available (optimistic update), otherwise use backend status
         read: localReadStatus.has(alertId) ? localReadStatus.get(alertId)! : alert.read || false,
         icon: getAlertIcon(alert.type || 'info'),
         aiSuggestion: alert.aiSuggestion,
      };
   });

   // Fallback alerts for demo if no backend data
   const fallbackAlerts: Alert[] =
      activeAlerts.length === 0
         ? [
              {
                 id: 'fallback-1',
                 title: 'OSD Disk Failure Imminent',
                 message: 'SMART attributes indicate potential failure of OSD.12 within 24 hours',
                 severity: 'critical',
                 timestamp: '2 minutes ago',
                 source: 'OSD Monitor',
                 count: 1,
                 read: false,
                 icon: XCircleIcon,
                 aiSuggestion: 'Consider replacing OSD.12 immediately and redistributing data to prevent cluster degradation.',
              },
              {
                 id: 'fallback-2',
                 title: 'High Memory Usage',
                 message: 'MON.a memory usage has exceeded 85% threshold',
                 severity: 'warning',
                 timestamp: '5 minutes ago',
                 source: 'Resource Monitor',
                 count: 3,
                 read: false,
                 icon: CpuChipIcon,
                 aiSuggestion: 'Restart MON.a service during maintenance window or increase memory allocation.',
              },
              {
                 id: 'fallback-3',
                 title: 'Network Latency Spike',
                 message: 'Increased latency detected between rack-1 and rack-2',
                 severity: 'warning',
                 timestamp: '8 minutes ago',
                 source: 'Network Monitor',
                 count: 1,
                 read: true,
                 icon: WifiIcon,
                 aiSuggestion: 'Check network configuration and cables between affected racks.',
              },
              {
                 id: 'fallback-4',
                 title: 'Scrub Operation Completed',
                 message: 'Deep scrub completed successfully on pool rbd_pool',
                 severity: 'info',
                 timestamp: '15 minutes ago',
                 source: 'Scrub Monitor',
                 count: 1,
                 read: true,
                 icon: CheckCircleIcon,
              },
              {
                 id: 'fallback-5',
                 title: 'Storage Pool Near Capacity',
                 message: 'Pool cephfs_data is at 89% capacity',
                 severity: 'warning',
                 timestamp: '22 minutes ago',
                 source: 'Capacity Monitor',
                 count: 1,
                 read: false,
                 icon: CircleStackIcon,
                 aiSuggestion: 'Add new OSDs to the cluster or enable pool auto-scaling if available.',
              },
              {
                 id: 'fallback-6',
                 title: 'Authentication Success',
                 message: 'Admin user logged in successfully',
                 severity: 'info',
                 timestamp: '1 hour ago',
                 source: 'Auth Monitor',
                 count: 1,
                 read: true,
                 icon: InformationCircleIcon,
              },
              {
                 id: 'fallback-7',
                 title: 'Cluster Rebalancing Started',
                 message: 'Automatic rebalancing initiated after OSD addition',
                 severity: 'warning',
                 timestamp: '2 hours ago',
                 source: 'Rebalance Monitor',
                 count: 1,
                 read: false,
                 icon: CircleStackIcon,
                 aiSuggestion: 'Monitor rebalancing progress and ensure it completes during off-peak hours.',
              },
              {
                 id: 'fallback-8',
                 title: 'Critical: Multiple PG Degraded',
                 message: '45 placement groups are in degraded state',
                 severity: 'critical',
                 timestamp: '3 hours ago',
                 source: 'PG Monitor',
                 count: 1,
                 read: false,
                 icon: ExclamationTriangleIcon,
                 aiSuggestion: 'Check OSD status and network connectivity. Consider increasing replication factor.',
              },
           ]
         : [];

   // Use backend alerts if available, otherwise use fallback
   const displayAlerts = activeAlerts.length > 0 ? activeAlerts : fallbackAlerts;

   // Computed values
   const alertFilters: AlertFilter[] = useMemo(
      () => [
         { type: 'all', label: 'All', count: activeAlerts.length },
         { type: 'critical', label: 'Critical', count: activeAlerts.filter(a => a.severity === 'critical').length },
         { type: 'warning', label: 'Warning', count: activeAlerts.filter(a => a.severity === 'warning').length },
         { type: 'info', label: 'Info', count: activeAlerts.filter(a => a.severity === 'info').length },
      ],
      [activeAlerts],
   );

   const filteredAlerts = useMemo(() => {
      if (selectedFilter === 'all') {
         return activeAlerts;
      }
      return activeAlerts.filter(alert => alert.severity === selectedFilter);
   }, [selectedFilter, activeAlerts]);

   const alertStats = useMemo(
      () => [
         {
            label: 'Critical',
            value: activeAlerts.filter(a => a.severity === 'critical').length,
            color: 'text-danger-400',
         },
         {
            label: 'Warning',
            value: activeAlerts.filter(a => a.severity === 'warning').length,
            color: 'text-warning-400',
         },
         {
            label: 'Info',
            value: activeAlerts.filter(a => a.severity === 'info').length,
            color: 'text-info-400',
         },
         {
            label: 'Unread',
            value: activeAlerts.filter(a => !a.read).length,
            color: 'text-ai-circuit',
         },
      ],
      [activeAlerts],
   );

   // Helper methods
   const getAlertBgColor = (severity: string) => {
      return 'bg-secondary-500/20';
      /*switch (severity) {
         case 'critical':
            return 'bg-danger-500/20';
         case 'warning':
            return 'bg-warning-500/20';
         case 'info':
            return 'bg-info-500/5';
         default:
            return 'bg-secondary-800/30';
      }*/
   };

   const getAlertBorderColor = (severity: string) => {
      switch (severity) {
         case 'critical':
            return 'border-danger-500/20';
         case 'warning':
            return 'border-warning-500/20';
         case 'info':
            return 'border-info-500/20';
         default:
            return 'border-secondary-700';
      }
   };

   const getAlertIconColor = (severity: string) => {
      switch (severity) {
         case 'critical':
            return 'text-danger-500';
         case 'warning':
            return 'text-warning-500';
         case 'info':
            return 'text-info-500';
         default:
            return 'text-secondary-500';
      }
   };

   const getAlertBadgeColor = (severity: string) => {
      switch (severity) {
         case 'critical':
            return 'bg-danger-500/20 text-danger-400';
         case 'warning':
            return 'bg-warning-500/20 text-warning-400';
         case 'info':
            return 'bg-info-500/20 text-info-400';
         default:
            return 'bg-secondary-500/20 text-secondary-400';
      }
   };

   // Event handlers
   const markAsRead = async (alertId: string) => {
      // Add to loading set
      setMarkingAsRead(prev => new Set(prev).add(alertId));

      // Optimistically mark as read in local state
      setLocalReadStatus(prev => new Map(prev).set(alertId, true));

      try {
         console.log('Marking alert as read:', alertId);
         await DashboardAPI.markAlertAsRead(alertId);
         // No need to refresh entire dashboard - local state already updated
      } catch (error) {
         console.error('Failed to mark alert as read:', error);
         // Revert optimistic update on error
         setLocalReadStatus(prev => {
            const newMap = new Map(prev);
            newMap.delete(alertId);
            return newMap;
         });
      } finally {
         // Remove from loading set
         setMarkingAsRead(prev => {
            const newSet = new Set(prev);
            newSet.delete(alertId);
            return newSet;
         });
      }
   };

   const markAllAsRead = async () => {
      try {
         console.log('Marking all alerts as read');
         await DashboardAPI.markAllAlertsAsRead();
         // Refresh dashboard data to update read status
         await refreshDashboard();
      } catch (error) {
         console.error('Failed to mark all alerts as read:', error);
      }
   };

   const dismissAlert = async (alertId: string) => {
      try {
         console.log('Dismissing alert:', alertId);
         await DashboardAPI.dismissAlert(alertId);
         // Refresh dashboard data to remove dismissed alert
         await refreshDashboard();
      } catch (error) {
         console.error('Failed to dismiss alert:', error);
      }
   };

   const applyAiSuggestion = (alert: Alert) => {
      console.log('Applying AI suggestion for:', alert.title);
   };

   const learnMore = (alert: Alert) => {
      console.log('Learning more about:', alert.title);
   };

   const toggleAutoRefresh = () => {
      setAutoRefresh(!autoRefresh);
   };

   const viewAllAlerts = () => {
      console.log('Navigate to all alerts page');
   };

   return (
      <Card
         variant="ai"
         className="h-full"
         header={
            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2">
                  <BellIcon className="w-5 h-5 text-ai-glow" />
                  <h3 className="text-lg font-semibold text-white">Alert Center</h3>
               </div>
               <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 px-2 py-1 bg-warning-500/20 rounded-full">
                     <div className="w-2 h-2 bg-warning-500 rounded-full neural-pulse" />
                     <span className="text-xs text-warning-400">{activeAlerts.filter(a => !a.read).length} Active</span>
                  </div>
                  <Button size="xs" variant="secondary" onClick={markAllAsRead}>
                     Mark All Read
                  </Button>
               </div>
            </div>
         }
         footer={
            <div className="flex items-center justify-between text-xs text-secondary-400">
               <span>Auto-refresh: {autoRefresh ? 'On' : 'Off'}</span>
               <div className="flex space-x-2">
                  <Button size="xs" variant="secondary" onClick={toggleAutoRefresh}>
                     {autoRefresh ? 'Pause' : 'Resume'}
                  </Button>
                  <Button size="xs" variant="ai" onClick={viewAllAlerts}>
                     View All
                  </Button>
               </div>
            </div>
         }
      >
         {/* Alert filters */}
         <div className="flex items-center space-x-2 mb-4 pt-4 px-4">
            {alertFilters.map(filter => (
               <Button key={filter.type} size="xs" variant={selectedFilter === filter.type ? 'ai' : 'secondary'} onClick={() => setSelectedFilter(filter.type)}>
                  {filter.label} ({filter.count})
               </Button>
            ))}
         </div>

         {/* Alert list */}
         <div className="flex justify-between px-4">
            {isLoading ? (
               <div className="flex-1 flex items-center justify-center h-64">
                  <FuturisticSpinner size="md" label="Loading alerts..." />
               </div>
            ) : (
               <SimpleBar style={{ maxHeight: 295, width: '100%' }}>
                  <div className="flex-1 space-y-2 pb-4">
                     {filteredAlerts.map(alert => (
                        <div
                           key={alert.id}
                           className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${getAlertBgColor(alert.severity)} ${getAlertBorderColor(alert.severity)} ${alert.read ? 'opacity-60' : ''}`}
                        >
                           {/* Alert icon */}
                           <div className="flex-shrink-0 mt-1">
                              <alert.icon className={`w-4 h-4 ${getAlertIconColor(alert.severity)}`} />
                           </div>

                           {/* Alert content */}
                           <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                 <div className="flex-1">
                                    <p className="text-sm font-medium text-white mb-1">{alert.title}</p>
                                    <p className="text-xs text-secondary-400 mb-2">{alert.message}</p>

                                    {/* Metadata */}
                                    <div className="flex items-center space-x-4 text-xs text-secondary-400">
                                       <span>{alert.timestamp}</span>
                                       <span>{alert.source}</span>
                                       {alert.count > 1 && <span className="text-warning-400">{alert.count} occurrences</span>}
                                    </div>
                                 </div>

                                 {/* Alert badge and actions */}
                                 <div className="flex flex-col items-end space-y-2">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAlertBadgeColor(alert.severity)}`}>{alert.severity}</span>

                                    {/* Quick actions */}
                                    <div className="flex space-x-1">
                                       {!alert.read && (
                                          <Button
                                             size="xs"
                                             variant="secondary"
                                             onClick={() => markAsRead(alert.id)}
                                             disabled={markingAsRead.has(alert.id)}
                                             className="opacity-80 min-w-[24px]"
                                          >
                                             {markingAsRead.has(alert.id) ? (
                                                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                   <path
                                                      className="opacity-75"
                                                      fill="currentColor"
                                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                   ></path>
                                                </svg>
                                             ) : (
                                                '✓'
                                             )}
                                          </Button>
                                       )}
                                       <Button size="xs" variant="secondary" onClick={() => dismissAlert(alert.id)} className="opacity-80">
                                          ✕
                                       </Button>
                                    </div>
                                 </div>
                              </div>

                              {/* AI suggestion */}
                              {alert.aiSuggestion && (
                                 <div className="mt-2 p-2 bg-ai-circuit/10 rounded-md border border-ai-circuit/20">
                                    <div className="flex items-center space-x-1 mb-1">
                                       <SparklesIcon className="w-3 h-3 text-ai-neon" />
                                       <span className="text-xs font-medium text-ai-neon">AI Suggestion</span>
                                    </div>
                                    <p className="text-xs text-white">{alert.aiSuggestion}</p>
                                    <div className="flex space-x-1 mt-2">
                                       <Button size="xs" variant="ai" onClick={() => applyAiSuggestion(alert)}>
                                          Apply
                                       </Button>
                                       <Button size="xs" variant="secondary" onClick={() => learnMore(alert)}>
                                          Learn More
                                       </Button>
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               </SimpleBar>
            )}

            {/* Statistics sidebar */}
            {!isLoading && (
               <div className="border-t border-b w-28 border-secondary-700">
                  <div className="h-full flex flex-col justify-around items-center text-center">
                     {alertStats.map(stat => (
                        <div key={stat.label}>
                           <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                           <div className="text-xs text-secondary-400">{stat.label}</div>
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </div>
      </Card>
   );
}
