'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-display-small text-gray-900 mb-2">System Settings</h1>
          <p className="text-body-medium text-gray-600">
            Configure system preferences, user management, and B767 fleet operational parameters.
          </p>
        </div>

        {/* Coming Soon Section */}
        <div className="card-aviation text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-500 to-gray-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-3xl">⚙️</span>
          </div>

          <h2 className="text-heading-large text-gray-900 mb-4">
            System Configuration Coming Soon
          </h2>

          <p className="text-body-large text-gray-600 max-w-2xl mx-auto mb-8">
            This module will provide comprehensive system administration capabilities:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">👥</span>
                User Management
              </h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Role-based access control</li>
                <li>• User account management</li>
                <li>• Permission configuration</li>
                <li>• Authentication settings</li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="font-semibold text-red-900 mb-3 flex items-center">
                <span className="mr-2">🛠️</span>
                System Configuration
              </h3>
              <ul className="space-y-2 text-red-800 text-sm">
                <li>• Roster period settings</li>
                <li>• Check type management</li>
                <li>• Notification preferences</li>
                <li>• Data backup & restore</li>
              </ul>
            </div>
          </div>

          <div className="mt-12">
            <div className="inline-flex items-center bg-air-niugini-red/10 text-air-niugini-red px-4 py-2 rounded-full text-sm font-medium">
              <span className="mr-2">🚧</span>
              Under Development - Air Niugini B767 Fleet Management
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}