'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { InteractiveRosterCalendar } from '@/components/leave/InteractiveRosterCalendar';
import { RosterPeriodNavigator } from '@/components/leave/RosterPeriodNavigator';
import { LeaveConflictDetector } from '@/components/leave/LeaveConflictDetector';
import { useAuth } from '@/contexts/AuthContext';
import { permissions } from '@/lib/auth-utils';
import { getCurrentRosterPeriod, RosterPeriod } from '@/lib/roster-utils';
import { getAllLeaveRequests, updateLeaveRequest } from '@/lib/leave-service';
import { Calendar, ArrowLeft } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import type { LeaveEvent } from '@/components/leave/InteractiveRosterCalendar';

export default function LeaveCalendarPage() {
  const { user } = useAuth();
  const [currentRoster, setCurrentRoster] = useState<RosterPeriod>(getCurrentRosterPeriod());
  const [leaveRequests, setLeaveRequests] = useState<LeaveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState<LeaveEvent | null>(null);
  const [conflictedLeaves, setConflictedLeaves] = useState<LeaveEvent[]>([]);

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      const requests = await getAllLeaveRequests();

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
      console.error('Error loading leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = async (leaveId: string, newStartDate: Date, newEndDate: Date) => {
    try {
      await updateLeaveRequest(leaveId, {
        start_date: format(newStartDate, 'yyyy-MM-dd'),
        end_date: format(newEndDate, 'yyyy-MM-dd'),
      });
      await loadLeaveRequests();
    } catch (error) {
      console.error('Error updating leave dates:', error);
      throw error;
    }
  };

  const handleConflictDetected = (conflicts: LeaveEvent[]) => {
    setConflictedLeaves(conflicts);
  };

  const handleRosterPeriodChange = (period: RosterPeriod) => {
    setCurrentRoster(period);
  };

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
                  Interactive Leave Calendar
                </h1>
                <p className="text-gray-600 mt-1">Drag and drop to reschedule leave requests</p>
              </div>
            </div>
          </div>

          {/* Roster Period Navigator */}
          <RosterPeriodNavigator
            currentPeriod={currentRoster}
            onPeriodChange={handleRosterPeriodChange}
            showCountdown={true}
            showTimeline={true}
          />

          {/* Calendar Component */}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E4002B]"></div>
              <span className="ml-3 text-gray-600">Loading calendar...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <InteractiveRosterCalendar
                  leaveRequests={leaveRequests}
                  onDateChange={handleDateChange}
                  onConflictDetected={handleConflictDetected}
                  readonly={!permissions.canEdit(user)}
                />
              </div>

              <div className="lg:col-span-1">
                <LeaveConflictDetector
                  leaveRequests={leaveRequests}
                  currentLeave={selectedLeave || undefined}
                  minimumCrew={18}
                  allowOverride={permissions.canEdit(user)}
                />
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
