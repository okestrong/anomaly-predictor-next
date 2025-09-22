import { Metadata } from 'next';
import AppHeader from '@/components/layout/AppHeader';
import ControlCenterDashboard from '@/components/control-center/ControlCenterDashboard';

export const metadata: Metadata = {
  title: 'AI Command Center - Ceph Cluster',
  description: 'Advanced cluster intelligence and predictive analytics command center',
};

export default function ControlCenterPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <AppHeader />
      <ControlCenterDashboard />
    </div>
  );
}