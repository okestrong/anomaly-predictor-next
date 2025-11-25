'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
   ArrowRightStartOnRectangleIcon,
   BellIcon,
   BoltIcon,
   BugAntIcon,
   ChartBarIcon,
   ChevronDownIcon,
   ChevronRightIcon,
   Cog6ToothIcon,
   CpuChipIcon,
   CubeTransparentIcon,
   DocumentTextIcon,
   MagnifyingGlassIcon,
   MoonIcon,
   SparklesIcon,
   Square3Stack3DIcon,
   SquaresPlusIcon,
   SunIcon,
   UserCircleIcon,
   UserIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button';

interface MenuItem {
   id: string;
   name: string;
   icon: React.ComponentType<{ className?: string }>;
   route: string;
   submenu?: SubMenuItem[];
}

interface SubMenuItem {
   id: string;
   name: string;
   description: string;
   icon: React.ComponentType<{ className?: string }>;
   route: string;
}

interface Alert {
   id: number;
   title: string;
   severity: 'critical' | 'warning' | 'info';
   timestamp: string;
}

interface UserMenuItem {
   name: string;
   icon: React.ComponentType<{ className?: string }>;
   action: string;
}

export default function AppHeader() {
   const pathname = usePathname();
   const router = useRouter();

   // State
   const [currentTime, setCurrentTime] = useState('');
   const [showUserMenu, setShowUserMenu] = useState(false);
   const [showNotifications, setShowNotifications] = useState(false);
   const [activeMenu, setActiveMenu] = useState<string | null>(null);
   const [searchQuery, setSearchQuery] = useState('');
   const [showSearchResults, setShowSearchResults] = useState(false);
   const [isDark, setIsDark] = useState(true);
   const [isConnected, setIsConnected] = useState(true);

   const userMenuRef = useRef<HTMLDivElement>(null);
   const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

   // Menu configuration
   const mainMenus: MenuItem[] = [
      {
         id: 'dashboard',
         name: '🚀 Dashboard',
         icon: ChartBarIcon,
         route: '/dashboard',
      },
      {
         id: 'visualization',
         name: 'Visualization',
         icon: Square3Stack3DIcon,
         route: '/',
         submenu: [
            /*{
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
            },*/
            {
               id: 'topology',
               name: 'Cluster Topology',
               description: 'Pool, PG, OSD relationship visualization',
               icon: CubeTransparentIcon,
               route: '/topology',
            },
            /*{
               id: 'traffic',
               name: 'Cluster Traffic',
               description: 'Real-time data flow visualization',
               icon: CursorArrowRaysIcon,
               route: '/traffic',
            },*/
         ],
      },
      {
         id: 'ai',
         name: 'Analytics',
         icon: CpuChipIcon,
         route: '/',
         submenu: [
            /*{
               id: 'anomaly',
               name: 'Anomaly Detection',
               description: 'AI-powered anomaly detection',
               icon: ExclamationTriangleIcon,
               route: '/anomaly',
            },*/
            {
               id: 'prediction',
               name: 'Predictive Analytics',
               description: 'Failure prediction and forecasting',
               icon: SparklesIcon,
               route: '/prediction',
            },
            {
               id: 'reports',
               name: 'Reports',
               description: 'Generate and view system reports',
               icon: DocumentTextIcon,
               route: '/reports',
            },
            /* {
               id: 'command',
               name: 'Command Interface',
               description: 'Cyberpunk AI command terminal',
               icon: DocumentTextIcon,
               route: '/command',
            },*/
         ],
      },
      {
         id: 'resilience',
         name: 'Resilience',
         icon: SquaresPlusIcon,
         route: '/',
         submenu: [
            {
               id: 'trouble',
               name: 'Trouble Shooting Guide',
               description: 'Diagnostic guides and solutions for cluster issues',
               icon: BugAntIcon,
               route: '/trouble',
            },
            {
               id: 'optimize',
               name: 'Optimization',
               description: 'Identify PG imbalances and apply optimal distribution strategies',
               icon: BoltIcon,
               route: '/optimization',
            },
         ],
      },
      /*{
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
         ],
      },*/
   ];
   /*
   const mainMenus: MenuItem[] = [
      {
         id: 'command-center',
         name: '🚀 Command Center',
         icon: CpuChipIcon,
         route: '/command-center',
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
            {
               id: 'traffic',
               name: 'Cluster Traffic',
               description: 'Real-time data flow visualization',
               icon: WifiIcon,
               route: '/traffic',
            },
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
            {
               id: 'reports',
               name: 'Reports',
               description: 'Generate and view system reports',
               icon: DocumentTextIcon,
               route: '/reports',
            },
            {
               id: 'command',
               name: 'Command Interface',
               description: 'Cyberpunk AI command terminal',
               icon: DocumentTextIcon,
               route: '/command',
            },
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
         ],
      },
   ];
*/

   const userMenuItems: UserMenuItem[] = [
      { name: 'Profile', icon: UserIcon, action: 'profile' },
      { name: 'Settings', icon: Cog6ToothIcon, action: 'settings' },
      { name: 'Logout', icon: ArrowRightStartOnRectangleIcon, action: 'logout' },
   ];

   // Mock data
   const [alertCount, setAlertCount] = useState(3);
   const [recentAlerts, setRecentAlerts] = useState<Alert[]>([
      {
         id: 1,
         title: 'High CPU usage detected on OSD.12',
         severity: 'warning',
         timestamp: '2 minutes ago',
      },
      {
         id: 2,
         title: 'Storage pool reaching capacity limit',
         severity: 'critical',
         timestamp: '5 minutes ago',
      },
      {
         id: 3,
         title: 'Network latency spike detected',
         severity: 'info',
         timestamp: '8 minutes ago',
      },
   ]);

   // Computed values
   const connectionStatusColor = useMemo(() => (isConnected ? 'bg-[#00ff41]' : 'bg-warning-500'), [isConnected]);

   const themeIcon = useMemo(() => (isDark ? SunIcon : MoonIcon), [isDark]);

   const currentRoute = useMemo(() => {
      // Simple route name detection based on pathname
      if (pathname === '/') return 'Dashboard';
      const segments = pathname.split('/').filter(Boolean);
      return segments[0] ? segments[0].charAt(0).toUpperCase() + segments[0].slice(1) : 'Dashboard';
   }, [pathname]);

   // Menu handlers
   const handleMenuHover = useCallback(
      (menuId: string) => {
         if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
         }

         const menu = mainMenus.find(m => m.id === menuId);
         if (menu && menu.submenu && menu.submenu.length > 0) {
            setActiveMenu(menuId);
         } else {
            setActiveMenu(null);
         }
      },
      [mainMenus],
   );

   const handleMenuButtonHover = useCallback(
      (menuId: string) => {
         if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
         }

         const menu = mainMenus.find(m => m.id === menuId);
         if (menu && menu.submenu && menu.submenu.length > 0) {
            setActiveMenu(menuId);
         }
      },
      [mainMenus],
   );

   const handleMenuContainerLeave = useCallback(
      (menuId: string) => {
         hoverTimeoutRef.current = setTimeout(() => {
            if (activeMenu === menuId) {
               setActiveMenu(null);
            }
            hoverTimeoutRef.current = null;
         }, 100);
      },
      [activeMenu],
   );

   const navigateToMenu = useCallback((menu: MenuItem) => {
      if (menu.submenu && menu.submenu.length > 0) {
         // Navigate to first submenu item
         // window.location.href = menu.submenu[0].route;
      } else {
         router.push(menu.route);
         setActiveMenu(null);
         // window.location.href = menu.route;
      }
   }, []);

   const closeMenu = useCallback(() => {
      setActiveMenu(null);
   }, []);

   const isActiveRoute = useCallback(
      (routePath: string) => {
         return pathname === routePath;
      },
      [pathname],
   );

   const isMenuActive = useCallback(
      (menu: MenuItem) => {
         // Special handling for root path '/' - only match dashboard
         if (pathname === '/' || pathname === '/dashboard') {
            return menu.id === 'dashboard';
         }

         // Check if main route is active (but exclude '/' to prevent false matches)
         if (menu.route !== '/' && pathname === menu.route) {
            return true;
         }

         // Check if any submenu route is active
         if (menu.submenu && menu.submenu.length > 0) {
            return menu.submenu.some(submenu => pathname === submenu.route);
         }

         return false;
      },
      [pathname],
   );

   const handleSearchBlur = useCallback(() => {
      setTimeout(() => {
         setShowSearchResults(false);
      }, 200);
   }, []);

   // Other handlers
   const updateTime = useCallback(() => {
      const now = new Date();
      setCurrentTime(
         now.toLocaleString('ko-KR', {
            // year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
         }),
      );
   }, []);

   const toggleTheme = useCallback(() => {
      setIsDark(!isDark);
   }, [isDark]);

   const toggleNotifications = useCallback(() => {
      setShowNotifications(!showNotifications);
      setShowUserMenu(false);
   }, [showNotifications]);

   const toggleUserMenu = useCallback(() => {
      setShowUserMenu(!showUserMenu);
      setShowNotifications(false);
   }, [showUserMenu]);

   const handleUserMenuClick = useCallback((action: string) => {
      switch (action) {
         case 'profile':
            // Navigate to profile page
            break;
         case 'settings':
            // Navigate to settings page
            break;
         case 'logout':
            // Handle logout
            break;
      }
      setShowUserMenu(false);
   }, []);

   const clearAllAlerts = useCallback(() => {
      setRecentAlerts([]);
      setAlertCount(0);
   }, []);

   const getAlertColor = useCallback((severity: string) => {
      switch (severity) {
         case 'critical':
            return 'bg-danger-500';
         case 'warning':
            return 'bg-warning-500';
         case 'info':
            return 'bg-info-500';
         default:
            return 'bg-secondary-500';
      }
   }, []);

   const handleClickOutside = useCallback((event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
         setShowUserMenu(false);
      }
      if (!(event.target as Element)?.closest('.notification-panel')) {
         setShowNotifications(false);
      }
   }, []);

   // Effects
   useEffect(() => {
      updateTime();
      const timeInterval = setInterval(updateTime, 1000);
      document.addEventListener('click', handleClickOutside);

      return () => {
         clearInterval(timeInterval);
         document.removeEventListener('click', handleClickOutside);
         if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
         }
      };
   }, [updateTime, handleClickOutside]);

   return (
      <>
         <style jsx>{`
            .ceph-dashboard-title {
               font-size: 20px;
               font-weight: 800;
               background: linear-gradient(135deg, #00ffff, #ff00ff);
               -webkit-background-clip: text;
               -webkit-text-fill-color: transparent;
               background-clip: text;
               text-shadow: 0 0 40px rgba(0, 255, 255, 0.5);
               letter-spacing: 0;
               animation: glow 2s ease-in-out infinite;
            }

            @keyframes glow {
               0%,
               100% {
                  filter: brightness(1);
               }
               50% {
                  filter: brightness(1.2);
               }
            }
         `}</style>
         <header className="ai-header sticky top-0 z-[9998] w-full">
            <div className="w-full px-6 relative">
               <div className="flex items-center justify-between h-16">
                  {/* Left: Logo and title */}
                  <div className="flex items-center space-x-4">
                     <Link href="/" className="flex items-center space-x-3 transition-all duration-300 hover:scale-105">
                        {/* AI Logo */}
                        <div className="relative w-10 h-10 bg-gradient-to-br from-ai-circuit to-ai-cyber rounded-lg flex items-center justify-center shadow-ai-glow neon-always">
                           <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
                              <span className="text-ai-circuit font-bold text-sm">C</span>
                           </div>
                           <div className="absolute inset-0 bg-gradient-to-br from-ai-circuit/20 to-ai-cyber/20 rounded-lg neural-pulse" />
                        </div>

                        {/* Title */}
                        <div>
                           <h1 className="ceph-dashboard-title">Ceph AI Dashboard</h1>
                           <p className="text-xs text-muted">Intelligent Cluster Analytics</p>
                        </div>
                     </Link>

                     {/* Breadcrumb (non-dashboard pages) */}
                     {currentRoute !== 'Dashboard' && (
                        <div className="h-[44px] hidden 2xl:flex items-end">
                           <div className="flex items-center space-x-2">
                              <ChevronRightIcon className="w-4 h-4 text-secondary-400" />
                              <nav className="flex items-center space-x-2">
                                 <Link href="/" className="text-xs text-secondary-400 hover:text-white transition-colors">
                                    Dashboard
                                 </Link>
                                 <ChevronRightIcon className="w-3 h-3 text-secondary-500" />
                                 <span className="text-xs font-medium text-white">{currentRoute}</span>
                              </nav>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Center: Main navigation */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-6">
                     <div className="flex space-x-1">
                        {mainMenus.map(menu => (
                           <div
                              key={menu.id}
                              className="relative"
                              onMouseEnter={() => handleMenuHover(menu.id)}
                              onMouseLeave={() => handleMenuContainerLeave(menu.id)}
                           >
                              <button
                                 className={cn(
                                    'relative flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg cursor-pointer overflow-hidden',
                                    {
                                       // Dropdown open state
                                       'text-ai-circuit bg-secondary-700/50': activeMenu === menu.id && !isMenuActive(menu),
                                       // Active route state - sophisticated cyberpunk glow
                                       'text-white bg-gradient-to-r from-ai-circuit/20 via-ai-cyber/10 to-transparent': isMenuActive(menu),
                                       // Default state
                                       'text-secondary-300 hover:text-white hover:bg-secondary-700/50': !isMenuActive(menu) && activeMenu !== menu.id,
                                    },
                                 )}
                                 onClick={() => navigateToMenu(menu)}
                                 onMouseEnter={() => handleMenuButtonHover(menu.id)}
                                 aria-label={menu.name}
                              >
                                 {/* Animated background glow for active menu */}
                                 {isMenuActive(menu) && (
                                    <>
                                       <motion.div
                                          className="absolute inset-0 bg-gradient-to-r from-ai-circuit/10 via-ai-cyber/5 to-transparent"
                                          animate={{
                                             opacity: [0.3, 0.6, 0.3],
                                          }}
                                          transition={{
                                             duration: 2,
                                             repeat: Infinity,
                                             ease: 'easeInOut',
                                          }}
                                       />
                                       {/* Glowing animated underline */}
                                       <motion.div
                                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-ai-circuit to-transparent"
                                          initial={{ scaleX: 0 }}
                                          animate={{
                                             scaleX: 1,
                                             opacity: [0.5, 1, 0.5],
                                          }}
                                          transition={{
                                             scaleX: { duration: 0.3, ease: 'easeOut' },
                                             opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                                          }}
                                          style={{
                                             boxShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
                                          }}
                                       />
                                       {/* Side accent glow */}
                                       <motion.div
                                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-gradient-to-b from-transparent via-ai-circuit to-transparent rounded-r-full"
                                          animate={{
                                             opacity: [0.6, 1, 0.6],
                                          }}
                                          transition={{
                                             duration: 1.5,
                                             repeat: Infinity,
                                             ease: 'easeInOut',
                                          }}
                                          style={{
                                             boxShadow: '0 0 8px rgba(0, 255, 255, 0.6)',
                                          }}
                                       />
                                    </>
                                 )}

                                 <menu.icon className={cn('w-4 h-4 relative z-10', { 'text-ai-circuit': isMenuActive(menu) })} />
                                 <span className="relative z-10">{menu.name}</span>
                                 {menu.submenu && menu.submenu.length > 0 && (
                                    <ChevronDownIcon
                                       className={cn('w-3 h-3 transition-transform duration-200 relative z-10', { 'rotate-180': activeMenu === menu.id })}
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
                                       className="absolute top-full left-0 mt-1 w-80 bg-secondary-900/95 backdrop-blur-lg border border-secondary-700 rounded-lg shadow-xl py-2 z-[9999]"
                                    >
                                       <div className="grid grid-cols-1 gap-1">
                                          {menu.submenu.map(submenu => (
                                             <Link
                                                key={submenu.id}
                                                href={submenu.route}
                                                className={cn(
                                                   'flex items-start space-x-3 px-4 py-3 text-sm hover:bg-secondary-800/50 transition-colors rounded-md mx-2',
                                                   { 'bg-ai-circuit/20 text-ai-circuit': isActiveRoute(submenu.route) },
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
                                    </motion.div>
                                 )}
                              </AnimatePresence>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Right: User menu and settings */}
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
                           onChange={e => setSearchQuery(e.target.value)}
                           placeholder="Search..."
                           className="w-48 px-4 py-2 bg-secondary-700/50 border border-secondary-600 rounded-lg text-sm text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-ai-circuit focus:border-ai-circuit"
                           onFocus={() => setShowSearchResults(true)}
                           onBlur={handleSearchBlur}
                        />
                        <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
                     </div>

                     {/* Current time */}
                     <div className="hidden sm:block text-right w-[135px]">
                        <div className="text-sm font-medium text-secondary">{currentTime}</div>
                        <div className="text-xs text-blue-500 flex items-center justify-end space-x-2">
                           <div className={cn('w-2 h-2 rounded-full neural-pulse', connectionStatusColor)} />
                           <span>{isConnected ? 'Live' : 'Disconnected'}</span>
                        </div>
                     </div>

                     {/* Theme toggle */}
                     <button
                        onClick={toggleTheme}
                        className="theme-toggle hidden sm:inline-flex items-center justify-center w-8 h-8"
                        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        aria-label="Toggle Dark Mode"
                     >
                        {React.createElement(themeIcon, { className: 'w-4 h-4' })}
                     </button>

                     {/* Notification center */}
                     <div className="relative">
                        <Button variant="secondary" size="sm" onClick={toggleNotifications} className="relative" ariaLabel="notification center">
                           <BellIcon className="w-4 h-4" />
                           {alertCount > 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center neural-pulse">
                                 {alertCount > 9 ? '9+' : alertCount}
                              </div>
                           )}
                        </Button>
                     </div>

                     {/* User menu */}
                     <div className="relative" ref={userMenuRef}>
                        <Button variant="secondary" size="sm" onClick={toggleUserMenu} ariaLabel="user menu">
                           <UserCircleIcon className="w-4 h-4" />
                        </Button>

                        <AnimatePresence>
                           {showUserMenu && (
                              <motion.div
                                 initial={{ opacity: 0, scale: 0.95 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 exit={{ opacity: 0, scale: 0.95 }}
                                 transition={{ duration: 0.15 }}
                                 className="absolute right-0 mt-2 w-48 bg-secondary-800 rounded-lg shadow-lg border border-secondary-700 py-2 z-[9999]"
                              >
                                 <div className="px-4 py-2 border-b border-secondary-700">
                                    <p className="text-sm font-medium text-white">Admin User</p>
                                    <p className="text-xs text-secondary-400">admin@ceph.local</p>
                                 </div>

                                 {userMenuItems.map(item => (
                                    <button
                                       key={item.name}
                                       onClick={() => handleUserMenuClick(item.action)}
                                       className="flex items-center w-full px-4 py-2 text-sm text-secondary-200 hover:bg-secondary-700 hover:text-white transition-colors"
                                       aria-label={item.name}
                                    >
                                       <item.icon className="w-4 h-4 mr-3" />
                                       {item.name}
                                    </button>
                                 ))}
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                  </div>
               </div>
            </div>

            {/* Notification panel */}
            <AnimatePresence>
               {showNotifications && (
                  <motion.div
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     transition={{ duration: 0.2 }}
                     className="bg-secondary-800/95 backdrop-blur-lg border-b border-secondary-700 notification-panel"
                  >
                     <div className="container mx-auto px-6 py-4">
                        <div className="flex items-center justify-between mb-3">
                           <h3 className="text-lg font-semibold text-white">Recent Alerts</h3>
                           <Button variant="ai" size="xs" onClick={clearAllAlerts} ariaLabel="clear all">
                              Clear All
                           </Button>
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto">
                           {recentAlerts.map(alert => (
                              <div key={alert.id} className="flex items-start space-x-3 p-3 bg-secondary-900/50 rounded-lg">
                                 <div className={cn('w-2 h-2 rounded-full mt-2', getAlertColor(alert.severity))} />
                                 <div className="flex-1">
                                    <p className="text-sm font-medium text-white">{alert.title}</p>
                                    <p className="text-xs text-secondary-400 mt-1">{alert.timestamp}</p>
                                 </div>
                              </div>
                           ))}

                           {!recentAlerts.length && (
                              <div className="text-center py-8">
                                 <p className="text-secondary-400">No recent alerts</p>
                              </div>
                           )}
                        </div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
         </header>
      </>
   );
}
