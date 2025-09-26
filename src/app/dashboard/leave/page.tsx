'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LeaveRequestForm } from '@/components/leave/LeaveRequestForm'
import { LeaveRequestsList } from '@/components/leave/LeaveRequestsList'
import { LeaveCalendarView } from '@/components/leave/LeaveCalendarView'
import { useAuth } from '@/contexts/AuthContext'
import { permissions } from '@/lib/auth-utils'
import { getCurrentRosterPeriod } from '@/lib/roster-utils'
import { getLeaveRequestStats, type LeaveRequestStats } from '@/lib/leave-service'
import { format } from 'date-fns'

export default function LeaveRequestsPage() {
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'requests' | 'calendar'>('requests')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [stats, setStats] = useState<LeaveRequestStats | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'denied'>('all')
  const currentRoster = getCurrentRosterPeriod()

  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await getLeaveRequestStats()
        setStats(statsData)
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    }
    loadStats()
  }, [refreshTrigger])

  const handleFormSuccess = () => {
    setShowForm(false)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleStatsUpdate = (updatedStats: LeaveRequestStats) => {
    setStats(updatedStats)
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <span className="text-3xl mr-3">📅</span>
                  Leave Request Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage RDO, SDO, and annual leave requests within 28-day roster periods
                </p>
              </div>
              {permissions.canCreate(user) && (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="flex items-center px-4 py-2 bg-[#E4002B] text-white rounded-lg hover:bg-[#C00020] transition-colors"
                >
                  <span className="mr-2">{showForm ? '✕' : '📝'}</span>
                  {showForm ? 'Cancel' : 'New Request'}
                </button>
              )}
            </div>

            {/* Current Roster Info */}
            <div className="bg-[#E4002B]/5 border border-[#E4002B]/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[#E4002B] flex items-center">
                    <span className="mr-2">🗓️</span>
                    Current Roster Period
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">
                    {currentRoster.code} • Ends {format(currentRoster.endDate, 'dd MMM yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Duration</p>
                  <p className="font-medium text-gray-900">28 days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
                <span className="text-4xl block mb-2">📋</span>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Requests</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
                <span className="text-4xl block mb-2 text-yellow-600">⏳</span>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending Review</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
                <span className="text-4xl block mb-2 text-green-600">✅</span>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
                <span className="text-4xl block mb-2 text-red-600">❌</span>
                <p className="text-2xl font-bold text-red-600">{stats.denied}</p>
                <p className="text-sm text-gray-600">Denied</p>
              </div>
            </div>
          )}

          {/* Leave Type Breakdown */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <span className="text-2xl block mb-2">🏠</span>
                <p className="font-bold text-lg">{stats.byType.RDO}</p>
                <p className="text-xs text-gray-600">RDO Requests</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <span className="text-2xl block mb-2">🌴</span>
                <p className="font-bold text-lg">{stats.byType.SDO}</p>
                <p className="text-xs text-gray-600">SDO Requests</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <span className="text-2xl block mb-2">🏖️</span>
                <p className="font-bold text-lg">{stats.byType.ANNUAL}</p>
                <p className="text-xs text-gray-600">Annual Leave</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <span className="text-2xl block mb-2">🏥</span>
                <p className="font-bold text-lg">{stats.byType.SICK}</p>
                <p className="text-xs text-gray-600">Sick Leave</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <span className="text-2xl block mb-2">🎓</span>
                <p className="font-bold text-lg">{stats.byType.LSL}</p>
                <p className="text-xs text-gray-600">LSL</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <span className="text-2xl block mb-2">💼</span>
                <p className="font-bold text-lg">{stats.byType.LWOP}</p>
                <p className="text-xs text-gray-600">LWOP</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <span className="text-2xl block mb-2">👶</span>
                <p className="font-bold text-lg">{stats.byType.MATERNITY}</p>
                <p className="text-xs text-gray-600">Maternity</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <span className="text-2xl block mb-2">💙</span>
                <p className="font-bold text-lg">{stats.byType.COMPASSIONATE}</p>
                <p className="text-xs text-gray-600">Compassionate</p>
              </div>
            </div>
          )}

          {/* New Request Form */}
          {showForm && (
            <div className="mb-8">
              <LeaveRequestForm
                onSuccess={handleFormSuccess}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'requests'
                  ? 'bg-white text-[#E4002B] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">📋</span>
              Requests
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-white text-[#E4002B] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">📅</span>
              Calendar
            </button>
          </div>

          {activeTab === 'requests' && (
            <>
              {/* Filters */}
              <div className="flex items-center space-x-4 mb-6">
                <span className="text-sm font-medium text-gray-700">Filter by status:</span>
                {[
                  { value: 'all', label: 'All Requests', icon: '📋' },
                  { value: 'pending', label: 'Pending', icon: '⏳' },
                  { value: 'approved', label: 'Approved', icon: '✅' },
                  { value: 'denied', label: 'Denied', icon: '❌' }
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setFilterStatus(filter.value as typeof filterStatus)}
                    className={`flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
                      filterStatus === filter.value
                        ? 'bg-[#E4002B] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-1">{filter.icon}</span>
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Requests List */}
              <LeaveRequestsList
                refreshTrigger={refreshTrigger}
                filterStatus={filterStatus}
                onStatsUpdate={handleStatsUpdate}
              />
            </>
          )}

          {activeTab === 'calendar' && (
            <LeaveCalendarView />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}