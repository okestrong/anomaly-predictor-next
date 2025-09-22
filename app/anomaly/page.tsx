import { Metadata } from 'next';
import AppHeader from '@/components/layout/AppHeader';
import AnomalyDashboard from '@/components/anomaly/AnomalyDashboard';

export const metadata: Metadata = {
  title: 'AI Anomaly Detection - Ceph Cluster',
  description: 'Real-time ML-powered anomaly detection and behavioral analysis for Ceph cluster monitoring',
};

export default function AnomalyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <AppHeader />
      <AnomalyDashboard />
    </div>
  );
}
