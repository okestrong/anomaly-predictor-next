import { Metadata } from 'next';
import AppHeader from '@/components/layout/AppHeader';
import CommandCenterDashboard from '@/components/command-center/CommandCenterDashboard';

export const metadata: Metadata = {
  title: 'Neural Command Center - AI-Powered Cluster Intelligence',
  description: 'Advanced real-time monitoring, AI predictions, and cluster management command center',
};

export default function CommandCenterPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <AppHeader />
      <CommandCenterDashboard />
    </div>
  );
}