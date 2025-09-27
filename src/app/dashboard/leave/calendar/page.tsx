'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LeaveCalendarView } from '@/components/leave/LeaveCalendarView'
import { Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LeaveCalendarPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/leave"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Leave Management
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Calendar className="w-7 h-7 text-[#E4002B] mr-3" />
                  Leave Calendar
                </h1>
                <p className="text-gray-600 mt-1">
                  View leave requests in calendar format
                </p>
              </div>
            </div>
          </div>

          {/* Calendar Component */}
          <LeaveCalendarView />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}