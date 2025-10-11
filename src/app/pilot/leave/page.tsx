'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  X,
} from 'lucide-react';
import { format } from 'date-fns';

// Form validation schema
const leaveRequestSchema = z.object({
  request_type: z.enum(['RDO', 'SDO', 'ANNUAL', 'SICK', 'LSL', 'LWOP', 'MATERNITY', 'COMPASSIONATE'], {
    errorMap: () => ({ message: 'Please select a leave type' }),
  }),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
});

type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;

interface LeaveRequest {
  id: string;
  request_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  roster_period: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  reason?: string;
  is_late_request?: boolean;
  created_at: string;
  reviewer_name?: string;
  reviewed_at?: string;
  review_comments?: string;
}

const leaveTypeLabels: Record<string, string> = {
  RDO: 'Rostered Day Off',
  SDO: 'Scheduled Day Off',
  ANNUAL: 'Annual Leave',
  SICK: 'Sick Leave',
  LSL: 'Long Service Leave',
  LWOP: 'Leave Without Pay',
  MATERNITY: 'Maternity Leave',
  COMPASSIONATE: 'Compassionate Leave',
};

const statusStyles: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2 },
  DENIED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
};

export default function PilotLeavePage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
  });

  // Fetch leave requests
  const fetchLeaveRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/pilot/leave');
      const result = await response.json();

      if (result.success) {
        setLeaveRequests(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  // Submit leave request
  const onSubmit = async (data: LeaveRequestFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/pilot/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError('root', {
          type: 'manual',
          message: result.error || 'Failed to submit leave request',
        });
        setIsSubmitting(false);
        return;
      }

      // Success
      reset();
      setIsFormOpen(false);
      fetchLeaveRequests(); // Refresh list
    } catch (error) {
      console.error('Error submitting leave request:', error);
      setError('root', {
        type: 'manual',
        message: 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel leave request
  const handleCancel = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    setCancelingId(requestId);

    try {
      const response = await fetch(`/api/pilot/leave/${requestId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        fetchLeaveRequests(); // Refresh list
      } else {
        alert(result.error || 'Failed to cancel leave request');
      }
    } catch (error) {
      console.error('Error canceling leave request:', error);
      alert('An unexpected error occurred');
    } finally {
      setCancelingId(null);
    }
  };

  // Statistics
  const stats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter((r) => r.status === 'PENDING').length,
    approved: leaveRequests.filter((r) => r.status === 'APPROVED').length,
    denied: leaveRequests.filter((r) => r.status === 'DENIED').length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Calendar className="w-8 h-8 mr-3 text-blue-600" />
            Leave Requests
          </h1>
          <p className="text-gray-600 mt-2">
            Submit and manage your leave requests for roster periods
          </p>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="btn btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          New Leave Request
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.approved}</p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Denied</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.denied}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
        </div>
      </div>

      {/* Leave Requests List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Your Leave Requests</h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="loading-spinner-lg mx-auto mb-4" />
            <p className="text-gray-500">Loading leave requests...</p>
          </div>
        ) : leaveRequests.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium mb-2">No leave requests yet</p>
            <p className="text-sm text-gray-400 mb-6">
              Click "New Leave Request" to submit your first request
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Roster
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaveRequests.map((request) => {
                  const StatusIcon = statusStyles[request.status].icon;
                  return (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{request.request_type}</p>
                          <p className="text-sm text-gray-500">
                            {leaveTypeLabels[request.request_type]}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900">
                            {format(new Date(request.start_date), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-gray-500">
                            to {format(new Date(request.end_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {request.roster_period}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-sm font-semibold text-gray-900">
                            {request.days_count}
                          </span>
                          {request.is_late_request && (
                            <AlertTriangle
                              className="w-4 h-4 text-yellow-500 ml-2"
                              title="Late request (less than 21 days notice)"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusStyles[request.status].bg} ${statusStyles[request.status].text}`}
                        >
                          <StatusIcon className="w-4 h-4 mr-1" />
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">
                          {format(new Date(request.created_at), 'MMM dd, yyyy')}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {request.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancel(request.id)}
                            disabled={cancelingId === request.id}
                            className="btn btn-ghost text-red-600 hover:bg-red-50 text-sm"
                            title="Cancel request"
                          >
                            {cancelingId === request.id ? (
                              <div className="loading-spinner mr-2" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-1" />
                            )}
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Leave Request Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">New Leave Request</h2>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  reset();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Error Message */}
              {errors.root && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
                  <AlertTriangle className="text-red-500 w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800">Submission Error</p>
                    <p className="text-red-700 text-sm mt-1">{errors.root.message}</p>
                  </div>
                </div>
              )}

              {/* Leave Type */}
              <div>
                <label className="form-label">
                  Leave Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('request_type')}
                  className={`form-input ${errors.request_type ? 'border-red-300' : ''}`}
                >
                  <option value="">Select leave type</option>
                  {Object.entries(leaveTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {errors.request_type && (
                  <p className="text-red-600 text-sm mt-1">{errors.request_type.message}</p>
                )}
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('start_date')}
                    type="date"
                    className={`form-input ${errors.start_date ? 'border-red-300' : ''}`}
                  />
                  {errors.start_date && (
                    <p className="text-red-600 text-sm mt-1">{errors.start_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('end_date')}
                    type="date"
                    className={`form-input ${errors.end_date ? 'border-red-300' : ''}`}
                  />
                  {errors.end_date && (
                    <p className="text-red-600 text-sm mt-1">{errors.end_date.message}</p>
                  )}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="form-label">Reason (Optional)</label>
                <textarea
                  {...register('reason')}
                  rows={4}
                  className={`form-input ${errors.reason ? 'border-red-300' : ''}`}
                  placeholder="Enter reason for leave request..."
                />
                {errors.reason && (
                  <p className="text-red-600 text-sm mt-1">{errors.reason.message}</p>
                )}
              </div>

              {/* Info Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800 flex items-start">
                  <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    Leave requests with less than 21 days advance notice will be flagged as late
                    requests. Your request will be reviewed by administrators based on seniority and
                    crew availability.
                  </span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    reset();
                  }}
                  className="btn btn-ghost"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="loading-spinner-lg mr-3" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
