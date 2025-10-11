'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { pilotAuthService, type PilotAuthUser } from '@/lib/pilot-auth-utils';
import {
  Home,
  Calendar,
  MessageSquare,
  Bell,
  User,
  LogOut,
  Plane,
  Menu,
  X,
} from 'lucide-react';

export default function PilotDashboardLayout({ children }: { children: React.ReactNode }) {
  const [pilotUser, setPilotUser] = useState<PilotAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const user = await pilotAuthService.getSession();

      if (!user) {
        router.push('/pilot/login');
        return;
      }

      setPilotUser(user);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await pilotAuthService.logout();
    router.push('/pilot/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner-lg mx-auto mb-4" />
          <p className="text-gray-600">Loading pilot dashboard...</p>
        </div>
      </div>
    );
  }

  if (!pilotUser) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/pilot/dashboard', icon: Home },
    { name: 'Leave Requests', href: '/pilot/leave', icon: Calendar },
    { name: 'Feedback', href: '/pilot/feedback', icon: MessageSquare },
    { name: 'Notifications', href: '/pilot/notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <button
                type="button"
                className="lg:hidden mr-4 p-2 text-gray-600 hover:text-gray-900"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <Plane className="text-white w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Air Niugini</h1>
                  <p className="text-xs text-gray-500">Pilot Portal</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {pilotUser.rank} {pilotUser.first_name} {pilotUser.last_name}
                </p>
                <p className="text-xs text-gray-500">
                  {pilotUser.employee_id}
                  {pilotUser.seniority_number && ` • Seniority #${pilotUser.seniority_number}`}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-ghost text-gray-700 hover:text-red-600 hover:bg-red-50"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
                <span className="ml-2 hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">{children}</main>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-200 bg-white py-6">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Air Niugini. B767 Fleet Operations
            </p>
            <p className="text-xs text-gray-400 mt-2 sm:mt-0">
              Powered by PIN Modern Technology
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
