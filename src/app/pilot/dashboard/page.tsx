'use client';

import { useEffect, useState } from 'react';
import { pilotAuthService, type PilotAuthUser } from '@/lib/pilot-auth-utils';
import { Calendar, MessageSquare, Bell, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function PilotDashboardPage() {
  const [pilotUser, setPilotUser] = useState<PilotAuthUser | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const user = await pilotAuthService.getSession();
      setPilotUser(user);
    };
    loadUser();
  }, []);

  if (!pilotUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="loading-spinner-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {pilotUser.rank} {pilotUser.last_name}!
        </h1>
        <p className="text-blue-100 text-lg">
          Access your leave requests, share feedback, and manage your pilot profile.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">0</span>
          </div>
          <h3 className="text-gray-600 font-medium">Approved Leaves</h3>
          <p className="text-sm text-gray-500 mt-1">This year</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">0</span>
          </div>
          <h3 className="text-gray-600 font-medium">Pending Requests</h3>
          <p className="text-sm text-gray-500 mt-1">Awaiting approval</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">0</span>
          </div>
          <h3 className="text-gray-600 font-medium">My Feedback Posts</h3>
          <p className="text-sm text-gray-500 mt-1">Total posts</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">0</span>
          </div>
          <h3 className="text-gray-600 font-medium">Notifications</h3>
          <p className="text-sm text-gray-500 mt-1">Unread</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <TrendingUp className="w-6 h-6 mr-3 text-blue-600" />
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/pilot/leave"
            className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200 group"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Submit Leave Request</h3>
              <p className="text-sm text-gray-600">Request time off</p>
            </div>
          </Link>

          <Link
            href="/pilot/feedback"
            className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors border border-green-200 group"
          >
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Share Feedback</h3>
              <p className="text-sm text-gray-600">Post suggestions</p>
            </div>
          </Link>

          <Link
            href="/pilot/notifications"
            className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors border border-purple-200 group"
          >
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">View Notifications</h3>
              <p className="text-sm text-gray-600">Check updates</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity (Placeholder) */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium mb-2">No recent activity</p>
          <p className="text-sm text-gray-400">
            Your leave requests and feedback posts will appear here
          </p>
        </div>
      </div>
    </div>
  );
}
