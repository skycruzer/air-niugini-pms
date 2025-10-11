'use client';

import Link from 'next/link';
import { Users, MessageSquare, Settings, Shield, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function AdminDashboardPage() {
  // Fetch pending registrations count
  const { data: registrations, isLoading } = useQuery({
    queryKey: ['admin', 'pilot-registrations'],
    queryFn: async () => {
      const response = await fetch('/api/admin/pilot-registrations');
      if (!response.ok) throw new Error('Failed to fetch registrations');
      const result = await response.json();
      return result.data || [];
    },
    staleTime: 1000 * 60, // 1 minute
  });

  const pendingCount = registrations?.length || 0;
  const adminSections = [
    {
      title: 'Pilot Registrations',
      description: 'Review and approve pending pilot account registrations',
      icon: Users,
      href: '/dashboard/admin/pilot-registrations',
      color: 'bg-blue-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Feedback Moderation',
      description: 'Manage pilot feedback posts and community discussions',
      icon: MessageSquare,
      href: '/dashboard/admin/feedback-moderation',
      color: 'bg-green-500',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: 'System Settings',
      description: 'Configure system parameters and application settings',
      icon: Settings,
      href: '/dashboard/admin/system',
      color: 'bg-purple-500',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-[#E4002B] rounded-lg flex items-center justify-center mr-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Administrative tools and system management
              </p>
            </div>
          </div>
        </div>

        {/* Admin Sections Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {adminSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 hover:border-gray-300"
              >
                <div className="p-6">
                  {/* Icon */}
                  <div className={`w-12 h-12 ${section.iconBg} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${section.iconColor}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#E4002B] transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">{section.description}</p>

                  {/* Arrow */}
                  <div className="flex items-center text-sm font-medium text-[#E4002B]">
                    <span>Access</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Accent Bar */}
                <div className={`h-1 ${section.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </Link>
            );
          })}
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Shield className="w-6 h-6 text-[#E4002B]" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Administrative Access
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                You have administrative privileges to access all system management features.
                Use these tools to manage pilot registrations, moderate community feedback,
                and configure system settings.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  User Management
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Content Moderation
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  System Configuration
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Registrations</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {isLoading ? (
                    <span className="animate-pulse">-</span>
                  ) : (
                    pendingCount
                  )}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Feedback Posts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
              </div>
              <MessageSquare className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <p className="text-2xl font-bold text-green-600 mt-1">Online</p>
              </div>
              <Settings className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
