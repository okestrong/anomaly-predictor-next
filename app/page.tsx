import { Metadata } from 'next'
import DashboardPage from './dashboard/page'

export const metadata: Metadata = {
  title: 'AI Ceph Dashboard - Ceph AI Dashboard',
  description: 'Ceph 클러스터 AI 기반 이상 탐지 대시보드'
}

export default function HomePage() {
  return <DashboardPage />
}
