'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LazyLeaveRequestModal } from '@/components/lazy';
import { LazyLoader } from '@/components/ui/LazyLoader';
import { LeaveRequestsList } from '@/components/leave/LeaveRequestsList';
import { InteractiveRosterCalendar } from '@/components/leave/InteractiveRosterCalendar';
import { RosterPeriodNavigator } from '@/components/leave/RosterPeriodNavigator';
import { TeamAvailabilityView } from '@/components/leave/TeamAvailabilityView';
import { FinalReviewAlert } from '@/components/leave/FinalReviewAlert';
import { useAuth } from '@/contexts/AuthContext';
import { permissions } from '@/lib/auth-utils';
import { getCurrentRosterPeriod, RosterPeriod } from '@/lib/roster-utils';
import {
  getLeaveRequestStats,
  type LeaveRequestStats,
  getAllLeaveRequests,
  updateLeaveRequest,
} from '@/lib/leave-service';
import { format, parseISO } from 'date-fns';
import type { LeaveEvent } from '@/components/leave/InteractiveRosterCalendar';

export default function LeaveRequestsPage() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'calendar' | 'availability'>('requests');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState<LeaveRequestStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'denied'>(
    'all'
  );
  const [rosterFilter, setRosterFilter] = useState<'all' | 'next' | 'following'>('all');
  const [currentRoster, setCurrentRoster] = useState<RosterPeriod>(getCurrentRosterPeriod());
  const [leaveRequests, setLeaveRequests] = useState<LeaveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [statsData, requests] = await Promise.all([
          getLeaveRequestStats(),
          getAllLeaveRequests(),
        ]);

        setStats(statsData);

        // Transform leave requests to LeaveEvent format
        const transformedRequests: LeaveEvent[] = requests.map((request) => ({
          id: request.id,
          pilotName: request.pilot_name || 'Unknown Pilot',
          employeeId: request.employee_id || '',
          pilotId: request.pilot_id,
          requestType: request.request_type,
          startDate: parseISO(request.start_date),
          endDate: parseISO(request.end_date),
          status: request.status,
          daysCount: request.days_count,
        }));

        setLeaveRequests(transformedRequests);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [refreshTrigger]);

  // Calculate pending requests for NEXT ROSTER ONLY (review deadline is only for next roster)
  const getPendingCountForNextRoster = () => {
    if (!stats) return 0;

    // Get all pending leave requests (status is lowercase 'pending' in LeaveEvent type)
    const pendingRequests = leaveRequests.filter((req) => req.status.toLowerCase() === 'pending');

    // Get next roster period boundaries
    const currentRoster = getCurrentRosterPeriod();
    const nextRosterStartDate = new Date(currentRoster.endDate);
    nextRosterStartDate.setDate(nextRosterStartDate.getDate() + 1); // Day after current roster ends

    const nextRosterEndDate = new Date(nextRosterStartDate);
    nextRosterEndDate.setDate(nextRosterEndDate.getDate() + 27); // 28-day roster period (0-27 days)

    // Count only requests that START within the NEXT roster period (not following rosters)
    const nextRosterPendingCount = pendingRequests.filter((req) => {
      return req.startDate >= nextRosterStartDate && req.startDate <= nextRosterEndDate;
    }).length;

    return nextRosterPendingCount;
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleStatsUpdate = (updatedStats: LeaveRequestStats) => {
    setStats(updatedStats);
  };

  const handleDateChange = async (leaveId: string, newStartDate: Date, newEndDate: Date) => {
    try {
      await updateLeaveRequest(leaveId, {
        start_date: format(newStartDate, 'yyyy-MM-dd'),
        end_date: format(newEndDate, 'yyyy-MM-dd'),
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Error updating leave dates:', error);
      throw error;
    }
  };

  const handleConflictDetected = (conflicts: LeaveEvent[]) => {
    console.warn('Conflicts detected:', conflicts);
  };

  const handleRosterPeriodChange = (period: RosterPeriod) => {
    setCurrentRoster(period);
  };

  const handleViewPendingRequests = () => {
    // Switch to Requests tab
    setActiveTab('requests');
    // Filter to pending requests for NEXT ROSTER ONLY
    setFilterStatus('pending');
    setRosterFilter('next');
    // Scroll to requests list after a short delay to allow tab switch
    setTimeout(() => {
      const requestsSection = document.getElementById('requests-list');
      if (requestsSection) {
        requestsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

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
                  Manage RDO requests, WDO requests, and annual leave requests within 28-day roster
                  periods
                </p>
              </div>
              {permissions.canCreate(user) && (
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center px-4 py-2 bg-[#E4002B] text-white rounded-lg hover:bg-[#C00020] transition-colors shadow-lg hover:shadow-xl"
                >
                  <span className="mr-2">📝</span>
                  New Request
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

          {/* Final Review Alert - 22 days before next roster */}
          {stats && (
            <FinalReviewAlert
              pendingCount={getPendingCountForNextRoster()}
              onViewRequests={handleViewPendingRequests}
            />
          )}

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
                <p className="text-xs text-gray-600">RDO Request</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <span className="text-2xl block mb-2">🌴</span>
                <p className="font-bold text-lg">{stats.byType.SDO}</p>
                <p className="text-xs text-gray-600">WDO Request</p>
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

          {/* New Request Modal - Lazy Loaded */}
          {showModal && (
            <LazyLoader type="modal">
              <LazyLeaveRequestModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={handleModalSuccess}
              />
            </LazyLoader>
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
              Interactive Calendar
            </button>
            <button
              onClick={() => setActiveTab('availability')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'availability'
                  ? 'bg-white text-[#E4002B] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">👥</span>
              Team Availability
            </button>
          </div>

          {activeTab === 'requests' && (
            <>
              {/* Filters */}
              <div id="requests-list" className="space-y-4 mb-6">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Filter by status:</span>
                  {[
                    { value: 'all', label: 'All Requests', icon: '📋' },
                    { value: 'pending', label: 'Pending', icon: '⏳' },
                    { value: 'approved', label: 'Approved', icon: '✅' },
                    { value: 'denied', label: 'Denied', icon: '❌' },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => {
                        setFilterStatus(filter.value as typeof filterStatus);
                        setRosterFilter('all'); // Reset roster filter when user manually changes status
                      }}
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

                {/* Roster Period Filter (only show for pending status) */}
                {filterStatus === 'pending' && (
                  <div className="flex items-center space-x-4 pl-4 border-l-2 border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Roster period:</span>
                    <button
                      onClick={() => setRosterFilter('all')}
                      className={`flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
                        rosterFilter === 'all'
                          ? 'bg-[#E4002B] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="mr-1">📅</span>
                      All Rosters
                    </button>
                    <button
                      onClick={() => setRosterFilter('next')}
                      className={`flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
                        rosterFilter === 'next'
                          ? 'bg-[#E4002B] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="mr-1">🎯</span>
                      Next Roster Only
                    </button>
                    <button
                      onClick={() => setRosterFilter('following')}
                      className={`flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
                        rosterFilter === 'following'
                          ? 'bg-[#E4002B] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="mr-1">📆</span>
                      Following Rosters
                    </button>
                  </div>
                )}
              </div>

              {/* Requests List */}
              <LeaveRequestsList
                refreshTrigger={refreshTrigger}
                filterStatus={filterStatus}
                onStatsUpdate={handleStatsUpdate}
                rosterFilter={rosterFilter}
              />
            </>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-6">
              {/* Roster Period Navigator */}
              <RosterPeriodNavigator
                currentPeriod={currentRoster}
                onPeriodChange={handleRosterPeriodChange}
                showCountdown={true}
                showTimeline={true}
              />

              {/* Interactive Calendar with Drag-Drop */}
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E4002B]"></div>
                  <span className="ml-3 text-gray-600">Loading calendar...</span>
                </div>
              ) : (
                <InteractiveRosterCalendar
                  leaveRequests={leaveRequests}
                  onDateChange={handleDateChange}
                  onConflictDetected={handleConflictDetected}
                  readonly={!permissions.canEdit(user)}
                />
              )}
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="space-y-6">
              {/* Roster Period Navigator */}
              <RosterPeriodNavigator
                currentPeriod={currentRoster}
                onPeriodChange={handleRosterPeriodChange}
                showCountdown={true}
                showTimeline={false}
              />

              {/* Team Availability View */}
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E4002B]"></div>
                  <span className="ml-3 text-gray-600">Loading availability data...</span>
                </div>
              ) : (
                <TeamAvailabilityView
                  leaveRequests={leaveRequests}
                  rosterPeriod={currentRoster}
                  totalPilots={27}
                />
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
