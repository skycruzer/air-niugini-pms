'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleDisplayName, getRoleColor, permissions } from '@/lib/auth-utils';
import { getCurrentRosterPeriod, formatRosterPeriod } from '@/lib/roster-utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentRoster, setCurrentRoster] = useState<any>(null);

  useEffect(() => {
    const roster = getCurrentRosterPeriod();
    setCurrentRoster(roster);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠', description: 'Overview and analytics' },
    { name: 'Pilots', href: '/dashboard/pilots', icon: '👥', description: 'Manage pilot records' },
    {
      name: 'Certifications',
      href: '/dashboard/certifications',
      icon: '📄',
      description: 'Track certifications',
      submenu: [
        {
          name: 'Certification List',
          href: '/dashboard/certifications',
          description: 'Manage certifications',
        },
        {
          name: 'Bulk Updates',
          href: '/dashboard/certifications/bulk',
          description: 'Mass certification updates',
        },
        {
          name: 'Expiry Calendar',
          href: '/dashboard/certifications/calendar',
          description: 'Visual expiry timeline',
        },
        {
          name: 'Expiry Planning',
          href: '/dashboard/certifications/expiry-planning',
          description: 'Plan certification renewals',
        },
      ],
    },
    {
      name: 'Leave Requests',
      href: '/dashboard/leave',
      icon: '📅',
      description: 'Manage leave requests',
      submenu: [
        { name: 'Leave Requests', href: '/dashboard/leave', description: 'Manage requests' },
        {
          name: 'Leave Calendar',
          href: '/dashboard/leave/calendar',
          description: 'Visual leave timeline',
        },
        {
          name: 'Roster Planning',
          href: '/dashboard/leave/roster-planning',
          description: 'Future roster leave planning',
        },
      ],
    },
    {
      name: 'Reports',
      href: '/dashboard/reports',
      icon: '📊',
      description: 'Fleet reports',
      requiresPermission: 'reports',
    },
    {
      name: 'Audit Logs',
      href: '/dashboard/audit',
      icon: '🔍',
      description: 'System audit trail',
      requiresPermission: 'audit',
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: '⚙️',
      description: 'System configuration',
      requiresPermission: 'settings',
    },
  ];

  const filteredNavigation = navigation.filter((item) => {
    if (!item.requiresPermission) return true;

    if (item.requiresPermission === 'reports') {
      return permissions.canViewReports(user);
    }
    if (item.requiresPermission === 'audit') {
      // Only admins can view audit logs
      return permissions.canCreate(user);
    }
    if (item.requiresPermission === 'settings') {
      return permissions.canManageSettings ? permissions.canManageSettings(user) : false;
    }
    return true;
  });

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Notifications would come from real data in a complete implementation
  const notifications: any[] = [];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-air-niugini-red text-white px-4 py-2 rounded-lg z-50 focus:z-50"
      >
        Skip to main content
      </a>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
          />
          <nav
            className="relative flex w-full max-w-xs flex-col bg-white shadow-2xl"
            aria-label="Main navigation"
          >
            <div className="absolute top-0 right-0 -mr-14 p-1">
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white touch-target"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close navigation menu"
              >
                <span className="h-6 w-6 text-white text-2xl" aria-hidden="true">
                  ✖️
                </span>
              </button>
            </div>

            {/* Mobile Sidebar Content */}
            <div className="h-0 flex-1 overflow-y-auto">
              {/* Mobile Header */}
              <div className="aviation-header p-6">
                <div className="flex items-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-air-niugini-gold rounded-lg blur-md opacity-30"></div>
                    <div className="relative bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                      <img
                        src="/images/air-niugini-logo.jpg"
                        alt="Air Niugini Logo"
                        className="h-6 w-6 rounded object-cover"
                      />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h1 className="text-lg font-bold text-white">Air Niugini</h1>
                    <p className="text-xs text-blue-100">B767 Fleet Management</p>
                  </div>
                </div>
              </div>

              {/* Mobile Roster */}
              {currentRoster && (
                <div className="mx-4 mb-4 -mt-3 relative z-10">
                  <div className="roster-banner p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{currentRoster.code}</p>
                        <p className="text-red-100 text-xs">
                          {currentRoster.daysRemaining} days remaining
                        </p>
                      </div>
                      <span className="w-4 h-4 text-red-200">🕐</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Navigation */}
              <nav className="px-4 space-y-2" role="navigation" aria-label="Main navigation">
                {filteredNavigation.map((item) => {
                  const isMainActive = pathname === item.href;
                  const hasSubmenuActive = item.submenu?.some((sub) => pathname === sub.href);
                  const isActive = isMainActive || hasSubmenuActive;

                  return (
                    <div key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <span className="h-5 w-5 mr-3 text-lg" aria-hidden="true">
                          {item.icon}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs opacity-75">{item.description}</p>
                        </div>
                      </Link>

                      {/* Mobile Submenu */}
                      {item.submenu && hasSubmenuActive && (
                        <div className="ml-8 mt-2 space-y-1">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              onClick={() => setSidebarOpen(false)}
                              className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                                pathname === subItem.href
                                  ? 'bg-[#E4002B] text-white'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                              }`}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* Mobile User Section */}
              <div className="mt-auto border-t border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="relative">
                    <div className="h-10 w-10 bg-gradient-to-br from-air-niugini-red to-red-600 rounded-xl flex items-center justify-center">
                      <span className="h-5 w-5 text-white text-lg">👤</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p
                      className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getRoleColor(user?.role || 'manager')}`}
                    >
                      {getRoleDisplayName(user?.role || 'manager')}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-target"
                    title="Sign Out"
                    aria-label="Sign out of your account"
                  >
                    <span className="h-5 w-5 text-lg" aria-hidden="true">
                      🚪
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
        }`}
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full bg-white shadow-lg">
          {/* Desktop Header */}
          <div className="aviation-header p-6">
            <div className="flex items-center justify-between">
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
                <div className="relative">
                  <div className="absolute inset-0 bg-air-niugini-gold rounded-lg blur-md opacity-30"></div>
                  <div className="relative bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                    <img
                      src="/images/air-niugini-logo.jpg"
                      alt="Air Niugini Logo"
                      className="h-6 w-6 rounded object-cover"
                    />
                  </div>
                </div>
                {!sidebarCollapsed && (
                  <div className="ml-3">
                    <h1 className="text-lg font-bold text-white">Air Niugini</h1>
                    <p className="text-xs text-blue-100">B767 Fleet Management</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors touch-target"
                aria-label={
                  sidebarCollapsed ? 'Expand navigation menu' : 'Collapse navigation menu'
                }
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <span
                  className={`h-4 w-4 transform transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                >
                  ▶️
                </span>
              </button>
            </div>
          </div>

          {/* Desktop Roster Banner */}
          {currentRoster && !sidebarCollapsed && (
            <div className="mx-4 mb-6 -mt-3 relative z-10">
              <div className="roster-banner p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="w-4 h-4 mr-2 text-red-200">🕐</span>
                    <span className="text-sm font-medium text-white">Current Period</span>
                  </div>
                  <span className="w-4 h-4 text-red-200">📈</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{currentRoster.code}</p>
                  <p className="text-red-100 text-sm">
                    {currentRoster.daysRemaining} days remaining
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Collapsed Roster Indicator */}
          {currentRoster && sidebarCollapsed && (
            <div className="mx-2 mb-4 -mt-2">
              <div className="bg-air-niugini-red rounded-lg p-2 flex flex-col items-center">
                <span className="w-4 h-4 text-red-200 mb-1">🕐</span>
                <span className="text-xs text-white font-bold">{currentRoster.daysRemaining}</span>
                <span className="text-xs text-red-200">days</span>
              </div>
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className={`flex-1 space-y-1 ${sidebarCollapsed ? 'px-2' : 'px-4'}`}>
            {filteredNavigation.map((item) => {
              const isMainActive = pathname === item.href;
              const hasSubmenuActive = item.submenu?.some((sub) => pathname === sub.href);
              const isActive = isMainActive || hasSubmenuActive;

              return (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    className={`nav-link group relative ${
                      isActive ? 'nav-link-active' : 'nav-link-inactive'
                    } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    title={sidebarCollapsed ? `${item.name} - ${item.description}` : undefined}
                  >
                    <span className={`h-5 w-5 ${sidebarCollapsed ? '' : 'mr-3'} text-lg`}>
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && (
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs opacity-75 group-hover:opacity-100 transition-opacity">
                          {item.description}
                        </p>
                      </div>
                    )}

                    {/* Active indicator for collapsed state */}
                    {sidebarCollapsed && isActive && (
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-air-niugini-gold rounded-l-full"></div>
                    )}
                  </Link>

                  {/* Desktop Submenu */}
                  {item.submenu && !sidebarCollapsed && hasSubmenuActive && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                            pathname === subItem.href
                              ? 'bg-[#E4002B] text-white'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <span className="font-medium">{subItem.name}</span>
                          <p className="text-xs opacity-75 mt-0.5">{subItem.description}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* System Status Indicators */}
          {!sidebarCollapsed && (
            <div className="px-4 mb-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-xs font-medium text-gray-600 mb-3 uppercase tracking-wider">
                  System Status
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse-slow"></div>
                    <span className="text-gray-700">Database Online</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse-slow"></div>
                    <span className="text-gray-700">Roster Sync Active</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse-slow"></div>
                    <span className="text-gray-700">Dev Mode</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* About Section */}
          {!sidebarCollapsed && (
            <div className="px-4 mb-4">
              <div className="bg-gradient-to-br from-[#E4002B] to-[#C00020] rounded-xl p-4 text-white">
                <h4 className="text-xs font-medium mb-3 uppercase tracking-wider opacity-90">
                  About
                </h4>
                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-semibold mb-1 flex items-center">
                      <span className="mr-2">✈️</span>
                      Air Niugini B767 PMS
                    </h5>
                    <p className="text-xs opacity-80 leading-relaxed">
                      Professional pilot management system for Papua New Guinea's national airline
                      fleet operations.
                    </p>
                  </div>

                  <div className="border-t border-white/20 pt-3">
                    <h6 className="text-xs font-medium mb-2 flex items-center">
                      <span className="mr-2">🏢</span>
                      Developed by PIN PNG LTD
                    </h6>
                    <div className="space-y-1 text-xs opacity-80">
                      <p className="flex items-center">
                        <span className="mr-2">👨‍💻</span>
                        Developer: Maurice Rondeau
                      </p>
                      <p className="flex items-center">
                        <span className="mr-2">📅</span>
                        Version 1.0 • 2025
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop User Section */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="relative">
                <div className="h-10 w-10 bg-gradient-to-br from-air-niugini-red to-red-600 rounded-xl flex items-center justify-center">
                  <span className="h-5 w-5 text-white text-lg">👤</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>

              {!sidebarCollapsed && (
                <>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                    <p
                      className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getRoleColor(user?.role || 'manager')}`}
                    >
                      {getRoleDisplayName(user?.role || 'manager')}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Sign Out"
                  >
                    <span className="h-4 w-4 text-lg">🚪</span>
                  </button>
                </>
              )}

              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                    {user?.name}
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 -translate-x-full border-4 border-transparent border-r-gray-900"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        {/* Top Bar for Mobile */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-target"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
              aria-controls="mobile-sidebar"
            >
              <span className="h-5 w-5 text-lg" aria-hidden="true">
                ☰
              </span>
            </button>

            <div className="flex items-center">
              <span className="h-5 w-5 text-air-niugini-red mr-2">✈️</span>
              <span className="font-semibold text-gray-900">Air Niugini</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-target"
                aria-label={`Notifications${notifications.length > 0 ? ` (${notifications.length} new)` : ''}`}
                title="View notifications"
              >
                <span className="h-5 w-5" aria-hidden="true">
                  🔔
                </span>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    <span className="sr-only">{notifications.length} new notifications</span>
                    {notifications.length}
                  </span>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-target"
                aria-label="Sign out of your account"
                title="Sign out"
              >
                <span className="h-5 w-5" aria-hidden="true">
                  🚪
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1" id="main-content" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
