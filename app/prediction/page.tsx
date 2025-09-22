import { Metadata } from 'next';
import AppHeader from '@/components/layout/AppHeader';
import PredictionDashboard from '@/components/prediction/PredictionDashboard';

export const metadata: Metadata = {
  title: 'AI Failure Prediction - Ceph Cluster',
  description: 'ML-powered predictive analytics for proactive cluster management and failure prevention',
};

export default function PredictionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      <AppHeader />
      <PredictionDashboard />
    </div>
  );
}