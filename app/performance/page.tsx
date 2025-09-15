import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Performance Analytics - Ceph AI Dashboard',
  description: '성능 분석 및 최적화 제안'
}

export default function PerformancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-900 to-secondary-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Performance Analytics</h1>
          <p className="text-secondary-400">성능 분석 및 최적화 제안</p>
        </div>
        
        <div className="bg-secondary-800/50 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-4">Performance Analytics Dashboard</h2>
          <p className="text-secondary-400">This page will be implemented in the next migration phase.</p>
        </div>
      </div>
    </div>
  )
}