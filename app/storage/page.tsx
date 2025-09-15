import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Storage Management - Ceph AI Dashboard',
  description: '스토리지 용량 및 관리'
}

export default function StoragePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-900 to-secondary-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Storage Management</h1>
          <p className="text-secondary-400">스토리지 용량 및 관리</p>
        </div>
        
        <div className="bg-secondary-800/50 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-4">Storage Management Dashboard</h2>
          <p className="text-secondary-400">This page will be implemented in the next migration phase.</p>
        </div>
      </div>
    </div>
  )
}