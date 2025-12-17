import { Metadata } from 'next';
import AppHeader from '@/components/layout/AppHeader';
import PredictionDashboard from '@/components/prediction/PredictionDashboard';

export const metadata: Metadata = {
   title: 'Proactive Anomalies Response - Ceph Cluster',
   description: 'AI-powered proactive anomaly detection and response for stable cluster management and failure prevention',
};

export default function PredictionPage() {
   return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
         <AppHeader />
         <PredictionDashboard />
      </div>
   );
}
