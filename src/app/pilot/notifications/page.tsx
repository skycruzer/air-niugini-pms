'use client';

import { Bell, Clock, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function PilotNotificationsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Bell className="w-8 h-8 mr-3 text-blue-600" />
          Notifications
        </h1>
        <p className="text-gray-600 mt-2">
          Stay updated with leave request approvals, feedback responses, and system updates
        </p>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-12 text-center">
        <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Bell className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Notification System Coming Soon
        </h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          A comprehensive notification system is being developed to keep you informed about leave
          request approvals, feedback responses, new comments, and important system updates in
          real-time.
        </p>
        <div className="inline-flex items-center bg-white px-6 py-3 rounded-lg shadow-md">
          <Clock className="w-5 h-5 text-yellow-500 mr-3" />
          <span className="text-sm font-semibold text-gray-700">In Development</span>
        </div>
      </div>

      {/* Features Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Leave Request Updates</h3>
          <p className="text-sm text-gray-600">
            Instant notifications when your leave requests are approved or require changes
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Bell className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Feedback Responses</h3>
          <p className="text-sm text-gray-600">
            Get notified when someone comments on your feedback posts
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Important Alerts</h3>
          <p className="text-sm text-gray-600">
            Priority notifications for time-sensitive updates and announcements
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
            <Info className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Real-time Updates</h3>
          <p className="text-sm text-gray-600">
            Live updates using Supabase real-time subscriptions
          </p>
        </div>
      </div>
    </div>
  );
}
