'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertInfo } from '@/types/trouble';
import { useDashboardStore } from '@/stores/dashboard';
import { AlertData } from '@/lib/api/dashboardApi';
import {
   AlertMeta,
   loadAllHistoryAlerts,
   hasSession,
   moveToHistory,
   cleanupOldHistory,
   getAlertTimestamp,
   loadAlertMeta,
   saveAlertMeta,
} from '@/lib/alertSessionStorage';

interface AlertListPanelProps {
   selectedAlert: AlertInfo | null;
   onAlertSelect: (alert: AlertInfo) => void;
   disabled?: boolean;
}

// Tab types
type TabType = 'active' | 'history';

// Convert AlertData from dashboard store to AlertInfo for trouble component
const convertAlertDataToAlertInfo = (alertData: AlertData): AlertInfo => ({
   alertId: alertData.id,
   title: alertData.message,
   severity: alertData.severity === 'error' ? 'critical' : alertData.severity,
   component: alertData.component,
   componentId: alertData.affectedComponents[0] || 'unknown',
   description: alertData.description,
   timestamp: new Date(alertData.timestamp).toISOString(),
   status: alertData.resolved ? 'resolved' : 'active',
   source: alertData.source,
   labels: {
      count: alertData.count.toString(),
      read: alertData.read.toString(),
      type: alertData.type,
   },
});

export default function AlertListPanel({ selectedAlert, onAlertSelect, disabled = false }: AlertListPanelProps) {
   const dashboardAlerts = useDashboardStore(state => state.alerts);
   const fetchAlerts = useDashboardStore(state => state.fetchAlerts);
   const [alerts, setAlerts] = useState<AlertInfo[]>([]);
   const [historyAlerts, setHistoryAlerts] = useState<AlertMeta[]>([]);
   const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
   const [searchQuery, setSearchQuery] = useState('');
   const [activeTab, setActiveTab] = useState<TabType>('active');
   const [hoveredAlert, setHoveredAlert] = useState<AlertInfo | null>(null);
   const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
   const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
   const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

   // 마운트 시 초기화 및 30초 주기 갱신 설정
   useEffect(() => {
      // 초기 데이터 로드
      fetchAlerts();
      const history = loadAllHistoryAlerts();
      setHistoryAlerts(history);
      cleanupOldHistory();

      // 30초 주기 갱신
      refreshIntervalRef.current = setInterval(() => {
         fetchAlerts();
         const updatedHistory = loadAllHistoryAlerts();
         setHistoryAlerts(updatedHistory);
      }, 30000);

      return () => {
         if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
         }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   // History alerts 로드
   const loadHistoryAlerts = useCallback(() => {
      const history = loadAllHistoryAlerts();
      setHistoryAlerts(history);
   }, []);

   // Update alerts when dashboard store changes
   useEffect(() => {
      const convertedAlerts = dashboardAlerts
         .filter(alert => !alert.resolved) // Only show active (unresolved) alerts
         .map(convertAlertDataToAlertInfo);
      setAlerts(convertedAlerts);

      // Resolved된 alert는 자동으로 history로 이동
      dashboardAlerts
         .filter(alert => alert.resolved)
         .forEach(alert => {
            const alertInfo = convertAlertDataToAlertInfo(alert);
            const timestamp = getAlertTimestamp(alertInfo);
            // 세션이 있는 경우에만 history로 이동
            if (hasSession(timestamp)) {
               moveToHistory(timestamp);
            }
         });

      // history alerts 로드 (loadHistoryAlerts 대신 직접 호출하여 의존성 제거)
      const history = loadAllHistoryAlerts();
      setHistoryAlerts(history);
   }, [dashboardAlerts]);

   // Active alerts 필터링
   const filteredAlerts = alerts.filter(alert => {
      const matchesFilter = filter === 'all' || alert.severity === filter;
      const matchesSearch =
         searchQuery === '' ||
         alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         alert.component.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
   });

   // History alerts 필터링
   const filteredHistoryAlerts = historyAlerts.filter(meta => {
      const alert = meta.alertInfo;
      const matchesFilter = filter === 'all' || alert.severity === filter;
      const matchesSearch =
         searchQuery === '' ||
         alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         alert.component.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
   });

   // 호버 시작 핸들러 (300ms 딜레이)
   const handleMouseEnter = useCallback((alert: AlertInfo, event: React.MouseEvent) => {
      if (hoverTimeoutRef.current) {
         clearTimeout(hoverTimeoutRef.current);
      }
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      hoverTimeoutRef.current = setTimeout(() => {
         setHoveredAlert(alert);
         setHoverPosition({ x: rect.right + 10, y: rect.top });
      }, 300);
   }, []);

   // 호버 종료 핸들러
   const handleMouseLeave = useCallback(() => {
      if (hoverTimeoutRef.current) {
         clearTimeout(hoverTimeoutRef.current);
      }
      setHoveredAlert(null);
      setHoverPosition(null);
   }, []);

   // read 상태 확인 (labels.read 사용)
   const isRead = useCallback((alert: AlertInfo) => {
      return alert.labels?.read === 'true';
   }, []);

   // 세션 존재 여부 확인
   const alertHasSession = useCallback((alert: AlertInfo) => {
      const timestamp = getAlertTimestamp(alert);
      return hasSession(timestamp);
   }, []);

   const getSeverityColor = (severity: string) => {
      switch (severity) {
         case 'critical':
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
         case 'warning':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
         case 'info':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
         default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      }
   };

   const getSeverityIcon = (severity: string) => {
      switch (severity) {
         case 'critical':
            return (
               <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                     fillRule="evenodd"
                     d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                     clipRule="evenodd"
                  />
               </svg>
            );
         case 'warning':
            return (
               <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                     fillRule="evenodd"
                     d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                     clipRule="evenodd"
                  />
               </svg>
            );
         default:
            return (
               <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                     fillRule="evenodd"
                     d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                     clipRule="evenodd"
                  />
               </svg>
            );
      }
   };

   const formatTimestamp = (timestamp: string) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 60) {
         return `${diffMins}분 전`;
      } else if (diffMins < 1440) {
         return `${Math.floor(diffMins / 60)}시간 전`;
      } else {
         return `${Math.floor(diffMins / 1440)}일 전`;
      }
   };

   return (
      <div className="h-full flex flex-col bg-gray-950">
         {/* Header */}
         <div className="p-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                     <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                     />
                  </svg>
               </div>
               <h2 className="text-lg font-semibold text-gray-100">Alerts</h2>
            </div>

            {/* Active/History Tabs */}
            <div className="flex gap-2 mb-4">
               <button
                  onClick={() => setActiveTab('active')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                     activeTab === 'active'
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
               >
                  Active
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                     activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-gray-700 text-gray-400'
                  }`}>
                     {alerts.length}
                  </span>
               </button>
               <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                     activeTab === 'history'
                        ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
               >
                  History
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                     activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-gray-700 text-gray-400'
                  }`}>
                     {historyAlerts.length}
                  </span>
               </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
               <input
                  type="text"
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-11 border border-gray-700 rounded-xl bg-gray-800/50 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
               />
               <svg className="absolute left-4 top-3 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
               </svg>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
               {(['all', 'critical', 'warning', 'info'] as const).map(tab => (
                  <button
                     key={tab}
                     onClick={() => setFilter(tab)}
                     className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        filter === tab
                           ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 scale-105'
                           : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white hover:scale-105 active:scale-95'
                     }`}
                  >
                     {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
               ))}
            </div>
         </div>

         {/* Alert List */}
         <div className="flex-1 overflow-y-auto p-3">
            {/* Active Tab Content */}
            {activeTab === 'active' && (
               <>
                  {filteredAlerts.length === 0 ? (
                     <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
                           <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2}
                                 d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                              />
                           </svg>
                        </div>
                        <p className="text-gray-500 font-medium">No active alerts</p>
                        <p className="text-sm text-gray-600 mt-1">Your cluster is running smoothly</p>
                     </div>
                  ) : (
                     <div className="space-y-3">
                        {filteredAlerts.map(alert => (
                           <button
                              key={alert.alertId}
                              onClick={() => !disabled && onAlertSelect(alert)}
                              onMouseEnter={(e) => handleMouseEnter(alert, e)}
                              onMouseLeave={handleMouseLeave}
                              disabled={disabled}
                              className={`group relative w-full p-4 text-left rounded-xl transition-all duration-300 overflow-hidden ${
                                 disabled
                                    ? 'bg-gray-900/30 border-2 border-gray-800/50 cursor-not-allowed opacity-50'
                                    : selectedAlert?.alertId === alert.alertId
                                      ? 'bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-2 border-blue-500 shadow-lg shadow-blue-500/20 scale-[1.02]'
                                      : 'bg-gray-900/50 border-2 border-gray-800 hover:border-gray-700 hover:bg-gray-900 hover:scale-[1.02] hover:shadow-xl hover:shadow-gray-900/50'
                              }`}
                           >
                              {/* Unread indicator */}
                              {!isRead(alert) && (
                                 <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                              )}

                              {/* Session indicator */}
                              {alertHasSession(alert) && (
                                 <div className="absolute top-3 right-8">
                                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                       <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                    </svg>
                                 </div>
                              )}

                              {/* Animated gradient border glow on hover */}
                              <div
                                 className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                                    alert.severity === 'critical'
                                       ? 'bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20'
                                       : alert.severity === 'warning'
                                         ? 'bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20'
                                         : 'bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20'
                                 } animate-pulse`}
                              />

                              {/* Content */}
                              <div className="relative flex items-start gap-4">
                                 <div
                                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                                       alert.severity === 'critical'
                                          ? 'bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/30'
                                          : alert.severity === 'warning'
                                            ? 'bg-gradient-to-br from-yellow-500 to-yellow-700 shadow-lg shadow-yellow-500/30'
                                            : 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30'
                                    }`}
                                 >
                                    {getSeverityIcon(alert.severity)}
                                 </div>

                                 <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                       <span
                                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all duration-300 group-hover:scale-105 ${
                                             alert.severity === 'critical'
                                                ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30'
                                                : alert.severity === 'warning'
                                                  ? 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/30'
                                                  : 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30'
                                          }`}
                                       >
                                          {alert.severity.toUpperCase()}
                                       </span>
                                       <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          <span>{formatTimestamp(alert.timestamp)}</span>
                                       </div>
                                    </div>

                                    <h3 className={`text-sm font-semibold mb-1.5 group-hover:text-white transition-colors duration-300 ${
                                       isRead(alert) ? 'text-gray-400' : 'text-gray-100'
                                    }`}>
                                       {alert.title}
                                    </h3>

                                    <p className="text-xs text-gray-400 line-clamp-2 mb-3 group-hover:text-gray-300 transition-colors duration-300">
                                       {alert.description}
                                    </p>

                                    <div className="flex items-center gap-2">
                                       <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-800/50 ring-1 ring-gray-700 group-hover:bg-gray-800 group-hover:ring-gray-600 transition-all duration-300">
                                          <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                             <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                                             <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                                             <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                                          </svg>
                                          <span className="text-xs text-gray-400 font-medium">{alert.component}</span>
                                       </div>
                                       <span className="text-xs text-gray-600">•</span>
                                       {/* read/unread 상태 표시 */}
                                       <span className={`text-xs px-1.5 py-0.5 rounded ${
                                          isRead(alert)
                                             ? 'bg-gray-700 text-gray-500'
                                             : 'bg-blue-500/20 text-blue-400'
                                       }`}>
                                          {isRead(alert) ? 'Read' : 'Unread'}
                                       </span>
                                    </div>
                                 </div>

                                 {/* Arrow indicator for selected/hover */}
                                 <div
                                    className={`flex-shrink-0 transition-all duration-300 ${
                                       selectedAlert?.alertId === alert.alertId
                                          ? 'opacity-100 translate-x-0'
                                          : 'opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0'
                                    }`}
                                 >
                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                 </div>
                              </div>
                           </button>
                        ))}
                     </div>
                  )}
               </>
            )}

            {/* History Tab Content */}
            {activeTab === 'history' && (
               <>
                  {filteredHistoryAlerts.length === 0 ? (
                     <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
                           <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                           </svg>
                        </div>
                        <p className="text-gray-500 font-medium">No history alerts</p>
                        <p className="text-sm text-gray-600 mt-1">Completed troubleshooting sessions will appear here</p>
                     </div>
                  ) : (
                     <div className="space-y-3">
                        {filteredHistoryAlerts.map(meta => {
                           const alert = meta.alertInfo;
                           return (
                              <button
                                 key={`history-${meta.timestamp}`}
                                 onClick={() => !disabled && onAlertSelect(alert)}
                                 onMouseEnter={(e) => handleMouseEnter(alert, e)}
                                 onMouseLeave={handleMouseLeave}
                                 disabled={disabled}
                                 className={`group relative w-full p-4 text-left rounded-xl transition-all duration-300 overflow-hidden ${
                                    disabled
                                       ? 'bg-gray-900/30 border-2 border-gray-800/50 cursor-not-allowed opacity-50'
                                       : selectedAlert?.alertId === alert.alertId
                                         ? 'bg-gradient-to-br from-purple-600/20 to-purple-700/20 border-2 border-purple-500 shadow-lg shadow-purple-500/20 scale-[1.02]'
                                         : 'bg-gray-900/50 border-2 border-gray-800 hover:border-gray-700 hover:bg-gray-900 hover:scale-[1.02] hover:shadow-xl hover:shadow-gray-900/50'
                                 }`}
                              >
                                 {/* History badge */}
                                 <div className="absolute top-3 right-3 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                    History
                                 </div>

                                 {/* Content */}
                                 <div className="relative flex items-start gap-4">
                                    <div
                                       className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center opacity-60 ${
                                          alert.severity === 'critical'
                                             ? 'bg-gradient-to-br from-red-500 to-red-700'
                                             : alert.severity === 'warning'
                                               ? 'bg-gradient-to-br from-yellow-500 to-yellow-700'
                                               : 'bg-gradient-to-br from-blue-500 to-blue-700'
                                       }`}
                                    >
                                       {getSeverityIcon(alert.severity)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                       <div className="flex items-center gap-2 mb-2">
                                          <span
                                             className={`px-2.5 py-1 text-xs font-semibold rounded-lg opacity-60 ${
                                                alert.severity === 'critical'
                                                   ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30'
                                                   : alert.severity === 'warning'
                                                     ? 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/30'
                                                     : 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30'
                                             }`}
                                          >
                                             {alert.severity.toUpperCase()}
                                          </span>
                                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                             </svg>
                                             <span>{formatTimestamp(alert.timestamp)}</span>
                                          </div>
                                          {meta.movedToHistoryAt && (
                                             <span className="text-xs text-gray-600">
                                                (resolved {formatTimestamp(meta.movedToHistoryAt)})
                                             </span>
                                          )}
                                       </div>

                                       <h3 className="text-sm font-semibold text-gray-400 mb-1.5 group-hover:text-gray-300 transition-colors duration-300">
                                          {alert.title}
                                       </h3>

                                       <p className="text-xs text-gray-500 line-clamp-2 mb-3 group-hover:text-gray-400 transition-colors duration-300">
                                          {alert.description}
                                       </p>

                                       <div className="flex items-center gap-2">
                                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-800/50 ring-1 ring-gray-700">
                                             <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                                                <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                                                <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                                             </svg>
                                             <span className="text-xs text-gray-400 font-medium">{alert.component}</span>
                                          </div>
                                          <span className="text-xs text-gray-600">•</span>
                                          <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                                             Completed
                                          </span>
                                       </div>
                                    </div>

                                    {/* Arrow indicator */}
                                    <div
                                       className={`flex-shrink-0 transition-all duration-300 ${
                                          selectedAlert?.alertId === alert.alertId
                                             ? 'opacity-100 translate-x-0'
                                             : 'opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0'
                                       }`}
                                    >
                                       <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                       </svg>
                                    </div>
                                 </div>
                              </button>
                           );
                        })}
                     </div>
                  )}
               </>
            )}
         </div>

         {/* Footer */}
         <div className="p-4 border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 text-sm">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
                  <span className="text-gray-400 font-medium">
                     {activeTab === 'active'
                        ? `${filteredAlerts.length} active alert${filteredAlerts.length !== 1 ? 's' : ''}`
                        : `${filteredHistoryAlerts.length} history alert${filteredHistoryAlerts.length !== 1 ? 's' : ''}`
                     }
                  </span>
               </div>
               <span className="text-gray-600">•</span>
               <span className="text-gray-500 text-xs">Updates every 30s</span>
            </div>
         </div>

         {/* Hover Popup */}
         {hoveredAlert && hoverPosition && (
            <div
               className="fixed z-50 w-80 p-4 bg-gray-800 rounded-lg shadow-xl border border-gray-700 animate-in fade-in zoom-in-95 duration-200"
               style={{
                  left: Math.min(hoverPosition.x, window.innerWidth - 340),
                  top: Math.min(hoverPosition.y, window.innerHeight - 300),
               }}
            >
               {/* Severity badge */}
               <div className="flex items-center gap-2 mb-3">
                  <span
                     className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                        hoveredAlert.severity === 'critical'
                           ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30'
                           : hoveredAlert.severity === 'warning'
                             ? 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/30'
                             : 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30'
                     }`}
                  >
                     {hoveredAlert.severity.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">{formatTimestamp(hoveredAlert.timestamp)}</span>
               </div>

               {/* Title */}
               <h4 className="text-sm font-semibold text-white mb-2">{hoveredAlert.title}</h4>

               {/* Full Description */}
               <p className="text-xs text-gray-300 mb-3 whitespace-pre-wrap">{hoveredAlert.description}</p>

               {/* Details */}
               <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                     <span className="text-gray-500">Component:</span>
                     <span className="text-gray-300">{hoveredAlert.component}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-gray-500">Source:</span>
                     <span className="text-gray-300">{hoveredAlert.source || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-gray-500">Status:</span>
                     <span className={`${hoveredAlert.status === 'active' ? 'text-red-400' : 'text-green-400'}`}>
                        {hoveredAlert.status}
                     </span>
                  </div>
                  {alertHasSession(hoveredAlert) && (
                     <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-700">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                           <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-400">Troubleshooting session available</span>
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
   );
}
