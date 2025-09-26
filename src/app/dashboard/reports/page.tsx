'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-display-small text-gray-900 mb-2">Fleet Reports</h1>
          <p className="text-body-medium text-gray-600">
            Generate comprehensive reports for B767 fleet operations, compliance, and performance analytics.
          </p>
        </div>

        {/* Coming Soon Section */}
        <div className="card-aviation text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-3xl">📊</span>
          </div>

          <h2 className="text-heading-large text-gray-900 mb-4">
            Advanced Reporting Coming Soon
          </h2>

          <p className="text-body-large text-gray-600 max-w-2xl mx-auto mb-8">
            This module will provide comprehensive reporting capabilities for fleet management:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <span className="mr-2">📈</span>
                Fleet Analytics
              </h3>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li>• Compliance rate tracking</li>
                <li>• Certification expiry forecasts</li>
                <li>• Fleet readiness metrics</li>
                <li>• Performance dashboards</li>
              </ul>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
              <h3 className="font-semibold text-indigo-900 mb-3 flex items-center">
                <span className="mr-2">📋</span>
                Export Options
              </h3>
              <ul className="space-y-2 text-indigo-800 text-sm">
                <li>• PDF regulatory reports</li>
                <li>• Excel data exports</li>
                <li>• Custom date ranges</li>
                <li>• Automated scheduling</li>
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