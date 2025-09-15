import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Alert Management - Ceph AI Dashboard',
  description: '알림 관리 및 설정'
}

export default function AlertsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-900 to-secondary-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Alert Management</h1>
          <p className="text-secondary-400">알림 관리 및 설정</p>
        </div>
        
        <div className="bg-secondary-800/50 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-4">Alert Management Dashboard</h2>
          <p className="text-secondary-400">This page will be implemented in the next migration phase.</p>
        </div>
      </div>
    </div>
  )
}