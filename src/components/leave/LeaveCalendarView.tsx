'use client';

import { useState, useEffect } from 'react';
import { LeaveCalendar } from '@/components/calendar/LeaveCalendar';
import { getAllLeaveRequests, type LeaveRequest } from '@/lib/leave-service';
import { format, parseISO } from 'date-fns';

interface LeaveEvent {
  id: string;
  pilotName: string;
  employeeId: string;
  requestType: 'RDO' | 'SDO' | 'ANNUAL' | 'SICK' | 'LSL' | 'LWOP' | 'MATERNITY' | 'COMPASSIONATE';
  startDate: Date;
  endDate: Date;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  daysCount: number;
}

export function LeaveCalendarView() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLeaveRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use API route in development mode to bypass RLS
        if (process.env.NODE_ENV === 'development') {
          const response = await fetch('/api/leave-requests');
          const result = await response.json();

          if (result.success) {
            const transformedRequests: LeaveEvent[] = result.data.map((request: LeaveRequest) => ({
              id: request.id,
              pilotName: request.pilot_name || 'Unknown Pilot',
              employeeId: request.employee_id || '',
              requestType: request.request_type,
              startDate: parseISO(request.start_date),
              endDate: parseISO(request.end_date),
              status: request.status,
              daysCount: request.days_count,
            }));
            setLeaveRequests(transformedRequests);
          } else {
            setError('Failed to load leave requests: ' + result.error);
          }
        } else {
          // Production mode - use service function directly
          const requests = await getAllLeaveRequests();
          if (requests) {
            const transformedRequests: LeaveEvent[] = requests.map((request) => ({
              id: request.id,
              pilotName: request.pilot_name || 'Unknown Pilot',
              employeeId: request.employee_id || '',
              requestType: request.request_type,
              startDate: parseISO(request.start_date),
              endDate: parseISO(request.end_date),
              status: request.status,
              daysCount: request.days_count,
            }));
            setLeaveRequests(transformedRequests);
          }
        }
      } catch (error) {
        console.error('Error loading leave requests:', error);
        setError('Failed to load leave requests. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadLeaveRequests();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4002B]"></div>
        <span className="ml-2 text-gray-600">Loading leave calendar...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-500 mr-2">⚠️</div>
          <div>
            <h3 className="text-red-800 font-medium">Error Loading Calendar</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl mb-1">📅</div>
          <p className="text-xl font-bold text-blue-600">{leaveRequests.length}</p>
          <p className="text-sm text-blue-600">Total Requests</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl mb-1">✅</div>
          <p className="text-xl font-bold text-green-600">
            {leaveRequests.filter((r) => r.status === 'APPROVED').length}
          </p>
          <p className="text-sm text-green-600">Approved</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl mb-1">⏳</div>
          <p className="text-xl font-bold text-yellow-600">
            {leaveRequests.filter((r) => r.status === 'PENDING').length}
          </p>
          <p className="text-sm text-yellow-600">Pending</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl mb-1">❌</div>
          <p className="text-xl font-bold text-red-600">
            {leaveRequests.filter((r) => r.status === 'DENIED').length}
          </p>
          <p className="text-sm text-red-600">Denied</p>
        </div>
      </div>

      {/* Calendar Component */}
      <LeaveCalendar
        leaveRequests={leaveRequests}
        onDateSelect={(date, events) => {
          console.log('Selected date:', format(date, 'yyyy-MM-dd'), 'Events:', events);
        }}
      />

      {/* Legend for Leave Types */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-3">Leave Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            { type: 'RDO', label: 'Rostered Day Off', icon: '🏠' },
            { type: 'SDO', label: 'Special Day Off', icon: '🌴' },
            { type: 'ANNUAL', label: 'Annual Leave', icon: '🏖️' },
            { type: 'SICK', label: 'Sick Leave', icon: '🏥' },
            { type: 'LSL', label: 'Long Service Leave', icon: '🎓' },
            { type: 'LWOP', label: 'Leave Without Pay', icon: '💼' },
            { type: 'MATERNITY', label: 'Maternity Leave', icon: '👶' },
            { type: 'COMPASSIONATE', label: 'Compassionate Leave', icon: '💙' },
          ].map(({ type, label, icon }) => (
            <div key={type} className="flex items-center space-x-2">
              <span className="text-lg">{icon}</span>
              <div>
                <span className="font-medium">{type}</span>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
