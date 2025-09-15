import { Metadata } from 'next'
import { routes, RouteInfo } from '@/types'

// 기본 메타데이터 설정
const defaultMetadata: Metadata = {
  title: {
    template: '%s - Ceph AI Dashboard',
    default: 'Ceph AI Dashboard'
  },
  description: 'AI-powered anomaly detection dashboard for Ceph clusters',
  keywords: [
    'Ceph',
    'AI',
    'Dashboard',
    'Anomaly Detection',
    'Cluster Monitoring',
    'Storage',
    'Performance Analytics'
  ],
  authors: [{ name: 'Okestro' }],
  creator: 'Okestro',
  publisher: 'Okestro',
  robots: {
    index: false, // 내부 관리 도구이므로 인덱싱 비활성화
    follow: false
  },
  openGraph: {
    type: 'website',
    siteName: 'Ceph AI Dashboard',
    title: 'Ceph AI Dashboard',
    description: 'AI-powered anomaly detection dashboard for Ceph clusters',
    locale: 'ko_KR'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ceph AI Dashboard',
    description: 'AI-powered anomaly detection dashboard for Ceph clusters'
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ]
}

/**
 * 특정 라우트에 대한 메타데이터 생성
 */
export function generateMetadata(routeKey: keyof typeof routes): Metadata {
  const route = routes[routeKey]
  
  if (!route) {
    return defaultMetadata
  }

  return {
    ...defaultMetadata,
    title: route.title,
    description: route.description,
    openGraph: {
      ...defaultMetadata.openGraph,
      title: route.title,
      description: route.description,
      url: route.path
    },
    twitter: {
      ...defaultMetadata.twitter,
      title: route.title,
      description: route.description
    }
  }
}

/**
 * 동적 메타데이터 생성 (커스텀 타이틀/설명 지원)
 */
export function generateDynamicMetadata(
  title: string,
  description?: string,
  additionalMeta?: Partial<Metadata>
): Metadata {
  return {
    ...defaultMetadata,
    ...additionalMeta,
    title,
    description: description || defaultMetadata.description,
    openGraph: {
      ...defaultMetadata.openGraph,
      ...additionalMeta?.openGraph,
      title,
      description: description || defaultMetadata.description || ''
    },
    twitter: {
      ...defaultMetadata.twitter,
      ...additionalMeta?.twitter,
      title,
      description: description || defaultMetadata.description || ''
    }
  }
}

/**
 * 페이지별 메타데이터 매핑
 */
export const pageMetadata = {
  dashboard: () => generateMetadata('dashboard'),
  monitoring: () => generateMetadata('monitoring'),
  anomaly: () => generateMetadata('anomaly'),
  performance: () => generateMetadata('performance'),
  health: () => generateMetadata('health'),
  storage: () => generateMetadata('storage'),
  network: () => generateMetadata('network'),
  prediction: () => generateMetadata('prediction'),
  alerts: () => generateMetadata('alerts'),
  topology: () => generateMetadata('topology')
}

/**
 * 기본 메타데이터 export
 */
export { defaultMetadata }

/**
 * JSON-LD 구조화 데이터 생성
 */
export function generateJsonLd(route: RouteInfo) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: route.title,
    description: route.description,
    url: route.path,
    applicationCategory: 'Monitoring Software',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      category: 'Enterprise Software'
    }
  }
}

/**
 * 브레드크럼 JSON-LD 생성
 */
export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }
}