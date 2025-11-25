'use client';

import React, { useState, useEffect } from 'react';
import { AlertInfo } from '@/types/trouble';
import { useDashboardStore } from '@/stores/dashboard';
import { AlertData } from '@/lib/api/dashboardApi';

interface AlertListPanelProps {
  selectedAlert: AlertInfo | null;
  onAlertSelect: (alert: AlertInfo) => void;
}

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
    type: alertData.type
  }
});

export default function AlertListPanel({ selectedAlert, onAlertSelect }: AlertListPanelProps) {
  const dashboardAlerts = useDashboardStore((state) => state.alerts);
  const fetchAlerts = useDashboardStore((state) => state.fetchAlerts);
  const [alerts, setAlerts] = useState<AlertInfo[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch alerts on mount if not already loaded
  useEffect(() => {
    if (dashboardAlerts.length === 0) {
      fetchAlerts();
    }
  }, []);

  // Update alerts when dashboard store changes
  useEffect(() => {
    const convertedAlerts = dashboardAlerts
      .filter(alert => !alert.resolved) // Only show active (unresolved) alerts
      .map(convertAlertDataToAlertInfo);
    setAlerts(convertedAlerts);
  }, [dashboardAlerts]);

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'all' || alert.severity === filter;
    const matchesSearch = searchQuery === '' ||
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.component.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
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
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-100">
            Active Alerts
          </h2>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 pl-11 border border-gray-700 rounded-xl bg-gray-800/50 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
          />
          <svg
            className="absolute left-4 top-3 w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['all', 'critical', 'warning', 'info'] as const).map((tab) => (
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
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No alerts found</p>
            <p className="text-sm text-gray-600 mt-1">Your cluster is running smoothly</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <button
                key={alert.alertId}
                onClick={() => onAlertSelect(alert)}
                className={`group relative w-full p-4 text-left rounded-xl transition-all duration-300 overflow-hidden ${
                  selectedAlert?.alertId === alert.alertId
                    ? 'bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-2 border-blue-500 shadow-lg shadow-blue-500/20 scale-[1.02]'
                    : 'bg-gray-900/50 border-2 border-gray-800 hover:border-gray-700 hover:bg-gray-900 hover:scale-[1.02] hover:shadow-xl hover:shadow-gray-900/50'
                }`}
              >
                {/* Animated gradient border glow on hover */}
                <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                  alert.severity === 'critical' ? 'bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20' :
                  alert.severity === 'warning' ? 'bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20' :
                  'bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20'
                } animate-pulse`} />

                {/* Content */}
                <div className="relative flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                    alert.severity === 'critical' ? 'bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/30' :
                    alert.severity === 'warning' ? 'bg-gradient-to-br from-yellow-500 to-yellow-700 shadow-lg shadow-yellow-500/30' :
                    'bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30'
                  }`}>
                    {getSeverityIcon(alert.severity)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all duration-300 group-hover:scale-105 ${
                        alert.severity === 'critical' ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30' :
                        alert.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/30' :
                        'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30'
                      }`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatTimestamp(alert.timestamp)}</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-gray-100 mb-1.5 group-hover:text-white transition-colors duration-300">
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
                      <span className="text-xs text-gray-500 font-mono">{alert.componentId}</span>
                    </div>
                  </div>

                  {/* Arrow indicator for selected/hover */}
                  <div className={`flex-shrink-0 transition-all duration-300 ${
                    selectedAlert?.alertId === alert.alertId
                      ? 'opacity-100 translate-x-0'
                      : 'opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0'
                  }`}>
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
            <span className="text-gray-400 font-medium">
              {filteredAlerts.length} active alert{filteredAlerts.length !== 1 ? 's' : ''}
            </span>
          </div>
          <span className="text-gray-600">•</span>
          <span className="text-gray-500 text-xs">Updates automatically</span>
        </div>
      </div>
    </div>
  );
}
