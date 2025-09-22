import { Metadata } from 'next';
import AppHeader from '@/components/layout/AppHeader';
import CommandInterface from '@/components/command/CommandInterface';

export const metadata: Metadata = {
  title: 'Cyberpunk Command Interface - Ceph Cluster',
  description: 'Advanced AI-powered cluster management and monitoring command interface',
};

export default function CommandPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950">
      <AppHeader />
      <CommandInterface />
    </div>
  );
}