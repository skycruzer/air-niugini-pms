'use client';

import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { updateLeaveRequestStatus, type LeaveRequest } from '@/lib/leave-service';
import { useAuth } from '@/contexts/AuthContext';
import { permissions } from '@/lib/auth-utils';

interface LeaveApprovalWorkflowProps {
  request: LeaveRequest;
  onUpdate: (updatedRequest: LeaveRequest) => void;
  onError: (error: string) => void;
}

export function LeaveApprovalWorkflow({ request, onUpdate, onError }: LeaveApprovalWorkflowProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewComments, setReviewComments] = useState('');

  if (!user || !permissions.canApprove(user)) {
    return null;
  }

  const handleStatusUpdate = async (status: 'APPROVED' | 'DENIED') => {
    if (!user) return;

    try {
      setLoading(true);
      const updatedRequest = await updateLeaveRequestStatus(
        request.id,
        status,
        user.id,
        reviewComments || undefined
      );
      onUpdate(updatedRequest);
      setShowReviewForm(false);
      setReviewComments('');
    } catch (error) {
      console.error('Error updating leave request:', error);
      onError(error instanceof Error ? error.message : 'Failed to update leave request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'DENIED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '⏳';
      case 'APPROVED':
        return '✅';
      case 'DENIED':
        return '❌';
      default:
        return '❓';
    }
  };

  const getLeaveTypeIcon = (type: string) => {
    switch (type) {
      case 'RDO':
        return '🏠';
      case 'SDO':
        return '🌴';
      case 'ANNUAL':
        return '🏖️';
      case 'SICK':
        return '🏥';
      default:
        return '📋';
    }
  };

  const calculateDays = () => {
    return differenceInDays(new Date(request.end_date), new Date(request.start_date)) + 1;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getLeaveTypeIcon(request.request_type)}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{request.pilot_name}</h3>
              <p className="text-sm text-gray-600">
                {request.employee_id} • {request.request_type} Request
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}
          >
            <span className="mr-1">{getStatusIcon(request.status)}</span>
            {request.status}
          </span>
        </div>
      </div>

      {/* Request Details */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Leave Details */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Leave Details</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Roster Period:</span>
                <span className="text-sm font-medium text-[#E4002B]">{request.roster_period}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Start Date:</span>
                <span className="text-sm font-medium">
                  {format(new Date(request.start_date), 'dd MMM yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">End Date:</span>
                <span className="text-sm font-medium">
                  {format(new Date(request.end_date), 'dd MMM yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Duration:</span>
                <span className="text-sm font-medium">
                  {calculateDays()} day{calculateDays() !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Requested:</span>
                <span className="text-sm font-medium">
                  {format(new Date(request.created_at), 'dd MMM yyyy HH:mm')}
                </span>
              </div>
            </div>
          </div>

          {/* Review Information */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Review Information</h4>
            <div className="space-y-3">
              {request.reviewed_by && request.reviewed_at ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Reviewed By:</span>
                    <span className="text-sm font-medium">
                      {request.reviewer_name || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Reviewed At:</span>
                    <span className="text-sm font-medium">
                      {format(new Date(request.reviewed_at), 'dd MMM yyyy HH:mm')}
                    </span>
                  </div>
                  {request.review_comments && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">Comments:</span>
                      <p className="text-sm bg-gray-50 rounded-lg p-2">{request.review_comments}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 italic">Pending review</p>
              )}
            </div>
          </div>
        </div>

        {/* Reason */}
        {request.reason && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-2">Request Reason</h4>
            <p className="text-sm bg-gray-50 rounded-lg p-3">{request.reason}</p>
          </div>
        )}

        {/* Actions */}
        {request.status === 'PENDING' && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            {!showReviewForm ? (
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Review Request
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Comments (Optional)
                  </label>
                  <textarea
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent resize-none"
                    placeholder="Add comments about your decision..."
                  />
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowReviewForm(false);
                      setReviewComments('');
                    }}
                    disabled={loading}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('DENIED')}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <span className="mr-1">❌</span>
                    )}
                    Deny
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('APPROVED')}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <span className="mr-1">✅</span>
                    )}
                    Approve
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
