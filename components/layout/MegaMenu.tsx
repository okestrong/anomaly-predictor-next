'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
  HeartIcon,
  CircleStackIcon,
  WifiIcon,
  SparklesIcon,
  BellIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  MapIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Button } from '@/components/common/Button'

interface QuickAction {
  id: string
  name: string
}

interface SubMenuItem {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  route: string
}

interface MenuItem {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  route: string
  submenu?: SubMenuItem[]
  quickActions?: QuickAction[]
}

interface SearchResult {
  id: number
  title: string
  category: string
  route: string
}

export default function MegaMenu() {
  const pathname = usePathname()
  
  // State
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Menu configuration
  const mainMenus: MenuItem[] = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: ChartBarIcon,
      route: '/',
      submenu: [],
    },
    {
      id: 'monitoring',
      name: 'Monitoring',
      icon: ChartBarIcon,
      route: '/monitoring',
      submenu: [
        {
          id: 'realtime',
          name: 'Real-time Metrics',
          description: 'Live performance monitoring',
          icon: ChartBarIcon,
          route: '/monitoring',
        },
        {
          id: 'performance',
          name: 'Performance Analytics',
          description: 'Detailed performance analysis',
          icon: CpuChipIcon,
          route: '/performance',
        },
        {
          id: 'health',
          name: 'Cluster Health',
          description: 'Overall system health status',
          icon: HeartIcon,
          route: '/health',
        },
        {
          id: 'topology',
          name: 'Cluster Topology',
          description: 'Pool, PG, OSD relationship visualization',
          icon: MapIcon,
          route: '/topology',
        },
      ],
      quickActions: [
        { id: 'refresh', name: 'Refresh' },
        { id: 'export', name: 'Export' },
      ],
    },
    {
      id: 'ai',
      name: 'Analytics',
      icon: SparklesIcon,
      route: '/prediction',
      submenu: [
        {
          id: 'anomaly',
          name: 'Anomaly Detection',
          description: 'AI-powered anomaly detection',
          icon: ExclamationTriangleIcon,
          route: '/anomaly',
        },
        {
          id: 'prediction',
          name: 'Predictive Analytics',
          description: 'Failure prediction and forecasting',
          icon: SparklesIcon,
          route: '/prediction',
        },
      ],
      quickActions: [
        { id: 'retrain', name: 'Retrain' },
        { id: 'analyze', name: 'Analyze' },
      ],
    },
    {
      id: 'storage',
      name: 'Storage',
      icon: CircleStackIcon,
      route: '/storage',
      submenu: [
        {
          id: 'capacity',
          name: 'Capacity Management',
          description: 'Storage capacity and usage',
          icon: CircleStackIcon,
          route: '/storage',
        },
        {
          id: 'network',
          name: 'Network Status',
          description: 'Network performance and topology',
          icon: WifiIcon,
          route: '/network',
        },
      ],
    },
    {
      id: 'alerts',
      name: 'Alerts',
      icon: BellIcon,
      route: '/alerts',
      submenu: [
        {
          id: 'active',
          name: 'Active Alerts',
          description: 'Current system alerts',
          icon: BellIcon,
          route: '/alerts',
        },
      ],
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: Cog6ToothIcon,
      route: '/settings',
      submenu: [
        {
          id: 'general',
          name: 'General Settings',
          description: 'System configuration',
          icon: Cog6ToothIcon,
          route: '/settings',
        },
        {
          id: 'reports',
          name: 'Reports',
          description: 'Generate and view reports',
          icon: DocumentTextIcon,
          route: '/reports',
        },
      ],
    },
  ]

  // Search results (mock data)
  const searchResults = useMemo(() => {
    if (!searchQuery) return []

    const query = searchQuery.toLowerCase()
    const results: SearchResult[] = [
      { id: 1, title: 'OSD Performance', category: 'Monitoring', route: '/monitoring' },
      { id: 2, title: 'Storage Pools', category: 'Storage', route: '/storage' },
      { id: 3, title: 'Alert Settings', category: 'Settings', route: '/alerts' },
      { id: 4, title: 'Anomaly Detection', category: 'AI', route: '/anomaly' },
    ]

    return results.filter(result => 
      result.title.toLowerCase().includes(query) || 
      result.category.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // Event handlers
  const handleMenuHover = useCallback((menuId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }

    const menu = mainMenus.find(m => m.id === menuId)
    if (menu && menu.submenu && menu.submenu.length > 0) {
      setActiveMenu(menuId)
    }
  }, [mainMenus])

  const handleMenuLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null)
      hoverTimeoutRef.current = null
    }, 300)
  }, [])

  const keepMenuOpen = useCallback((menuId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setActiveMenu(menuId)
  }, [])

  const closeMenu = useCallback(() => {
    setActiveMenu(null)
  }, [])

  const navigateToMenu = useCallback((menu: MenuItem) => {
    if (menu.submenu && menu.submenu.length > 0) {
      // Navigate to first submenu item
      window.location.href = menu.submenu[0].route
    } else {
      window.location.href = menu.route
    }
    closeMenu()
  }, [closeMenu])

  const navigateToResult = useCallback((result: SearchResult) => {
    window.location.href = result.route
    setShowSearchResults(false)
    setSearchQuery('')
  }, [])

  const handleQuickAction = useCallback((action: QuickAction) => {
    console.log('Quick action:', action.name)
    closeMenu()
  }, [closeMenu])

  const hideSearchResults = useCallback(() => {
    setTimeout(() => {
      setShowSearchResults(false)
    }, 200)
  }, [])

  const isActiveRoute = useCallback((routePath: string) => {
    return pathname === routePath
  }, [pathname])

  // Effects
  useEffect(() => {
    if (searchQuery) {
      setShowSearchResults(true)
    }
  }, [searchQuery])

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  return (
    <nav className="bg-secondary-800/95 backdrop-blur-lg border-b border-secondary-700/30 sticky top-16 z-30">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Main menu */}
          <div className="flex space-x-1">
            {mainMenus.map((menu) => (
              <div
                key={menu.id}
                className="relative"
                onMouseEnter={() => handleMenuHover(menu.id)}
                onMouseLeave={handleMenuLeave}
              >
                <button
                  className={cn(
                    'flex items-center space-x-2 px-4 py-3 text-sm font-medium text-secondary-300 hover:text-white transition-all duration-200 rounded-lg hover:bg-secondary-700/50',
                    {
                      'text-ai-circuit bg-secondary-700/50': activeMenu === menu.id,
                      'text-white': isActiveRoute(menu.route),
                    }
                  )}
                  onClick={() => navigateToMenu(menu)}
                >
                  <menu.icon className="w-4 h-4" />
                  <span>{menu.name}</span>
                  {menu.submenu && menu.submenu.length > 0 && (
                    <ChevronDownIcon
                      className={cn(
                        'w-3 h-3 transition-transform duration-200',
                        { 'rotate-180': activeMenu === menu.id }
                      )}
                    />
                  )}
                </button>

                {/* Submenu dropdown */}
                <AnimatePresence>
                  {activeMenu === menu.id && menu.submenu && menu.submenu.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-1 w-80 bg-secondary-900/95 backdrop-blur-lg border border-secondary-700 rounded-lg shadow-xl py-2 z-50"
                      onMouseEnter={() => keepMenuOpen(menu.id)}
                      onMouseLeave={handleMenuLeave}
                    >
                      <div className="grid grid-cols-1 gap-1">
                        {menu.submenu.map((submenu) => (
                          <Link
                            key={submenu.id}
                            href={submenu.route}
                            className={cn(
                              'flex items-start space-x-3 px-4 py-3 text-sm hover:bg-secondary-800/50 transition-colors rounded-md mx-2',
                              { 'bg-ai-circuit/20 text-ai-circuit': isActiveRoute(submenu.route) }
                            )}
                            onClick={closeMenu}
                          >
                            <submenu.icon className="w-4 h-4 mt-0.5 text-ai-circuit" />
                            <div className="flex-1">
                              <div className="font-medium text-white">{submenu.name}</div>
                              <div className="text-xs text-secondary-400 mt-1">{submenu.description}</div>
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* Quick actions */}
                      {menu.quickActions && menu.quickActions.length > 0 && (
                        <div className="border-t border-secondary-700 mt-2 pt-2 px-4 pb-2">
                          <p className="text-xs font-medium text-secondary-400 mb-2">Quick Actions</p>
                          <div className="flex space-x-2">
                            {menu.quickActions.map((action) => (
                              <Button
                                key={action.id}
                                size="xs"
                                variant="ai"
                                onClick={() => handleQuickAction(action)}
                              >
                                {action.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Right menu */}
          <div className="flex items-center space-x-4">
            {/* AI Status */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-ai-circuit/10 rounded-full">
              <div className="w-2 h-2 bg-ai-circuit rounded-full neural-pulse" />
              <span className="text-xs font-medium text-ai-circuit">AI Active</span>
            </div>

            {/* Quick search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-64 px-4 py-2 bg-secondary-700/50 border border-secondary-600 rounded-lg text-sm text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-ai-circuit focus:border-ai-circuit"
                onFocus={() => setShowSearchResults(true)}
                onBlur={hideSearchResults}
              />
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />

              {/* Search results */}
              <AnimatePresence>
                {showSearchResults && searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 w-80 bg-secondary-900/95 backdrop-blur-lg border border-secondary-700 rounded-lg shadow-xl py-2 z-50"
                  >
                    {searchResults.length > 0 ? (
                      <div className="space-y-1">
                        {searchResults.map((result) => (
                          <div
                            key={result.id}
                            className="px-4 py-2 hover:bg-secondary-800/50 cursor-pointer"
                            onClick={() => navigateToResult(result)}
                          >
                            <div className="text-sm font-medium text-white">{result.title}</div>
                            <div className="text-xs text-secondary-400">{result.category}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center text-secondary-400">
                        No results found
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}