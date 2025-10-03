'use client';

import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { updateLeaveRequestStatus, type LeaveRequest } from '@/lib/leave-service';
import { useAuth } from '@/contexts/AuthContext';
import { permissions } from '@/lib/auth-utils';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { CheckCircle, XCircle, User, Calendar, Clock, FileText, AlertTriangle } from 'lucide-react';
import { LeaveEligibilityAlert } from './LeaveEligibilityAlert';
import { useLeaveEligibility } from '@/hooks/useLeaveEligibility';

interface LeaveRequestReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedRequest: LeaveRequest) => void;
  request: LeaveRequest;
}

export function LeaveRequestReviewModal({
  isOpen,
  onClose,
  onSuccess,
  request,
}: LeaveRequestReviewModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reviewComments, setReviewComments] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Eligibility checking hook
  const { eligibility, isLoading: checkingEligibility, checkEligibility } = useLeaveEligibility();

  // Check eligibility when modal opens (using pilot_role from request object)
  useEffect(() => {
    async function checkRequestEligibility() {
      if (isOpen && request.pilot_role) {
        try {
          console.log('🔍 Checking eligibility for:', {
            pilotName: request.pilot_name,
            pilotRole: request.pilot_role,
            dates: `${request.start_date} to ${request.end_date}`,
          });

          await checkEligibility({
            pilotId: request.pilot_id,
            pilotRole: request.pilot_role,
            startDate: request.start_date,
            endDate: request.end_date,
            requestType: request.request_type,
            requestId: request.id,
          });
        } catch (err) {
          console.error('❌ Error checking eligibility:', err);
        }
      } else if (isOpen && !request.pilot_role) {
        console.warn('⚠️ Cannot check eligibility - pilot_role not available in request object');
      }
    }
    checkRequestEligibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, request.id, request.pilot_role]);

  if (!user || !permissions.canApprove(user)) {
    return null;
  }

  const handleStatusUpdate = async (status: 'APPROVED' | 'DENIED') => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const updatedRequest = await updateLeaveRequestStatus(
        request.id,
        status,
        user.id,
        reviewComments || undefined
      );

      onSuccess(updatedRequest);
      onClose();
      setReviewComments('');
    } catch (error) {
      console.error('Error updating leave request:', error);
      setError(error instanceof Error ? error.message : 'Failed to update leave request');
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

  const getLeaveDuration = () => {
    const startDate = new Date(request.start_date);
    const endDate = new Date(request.end_date);
    const days = differenceInDays(endDate, startDate) + 1;
    return days;
  };

  const isUrgent = () => {
    const startDate = new Date(request.start_date);
    const today = new Date();
    const daysUntilStart = differenceInDays(startDate, today);
    return daysUntilStart <= 7 && daysUntilStart >= 0;
  };

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose} title="Review Leave Request" size="lg">
      <div className="p-6 space-y-6">
        {/* Header with status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-[#E4002B]" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {request.pilot_name || 'Unknown Pilot'}
              </h2>
              <p className="text-gray-600 text-sm">Employee ID: {request.employee_id || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(request.status)}`}
            >
              {request.status}
            </span>
            {isUrgent() && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-800 bg-orange-100 rounded-full">
                <Clock className="w-3 h-3 mr-1" />
                Urgent
              </span>
            )}
          </div>
        </div>

        {/* Request Details */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
              <div className="flex items-center space-x-2">
                <span className="inline-flex px-2 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded">
                  {request.request_type}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <p className="text-sm text-gray-900">
                {getLeaveDuration()} day{getLeaveDuration() !== 1 ? 's' : ''}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <p className="text-sm text-gray-900">
                  {format(new Date(request.start_date), 'PPP')}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <p className="text-sm text-gray-900">{format(new Date(request.end_date), 'PPP')}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Request Date</label>
              <p className="text-sm text-gray-900">
                {request.request_date
                  ? format(new Date(request.request_date), 'PPP')
                  : 'Not specified'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Request Method</label>
              <p className="text-sm text-gray-900">{request.request_method}</p>
            </div>
          </div>

          {request.reason && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <p className="text-sm text-gray-900 p-3 bg-white rounded border">{request.reason}</p>
            </div>
          )}

          {request.is_late_request && (
            <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-800 font-medium">This is a late request</span>
            </div>
          )}
        </div>

        {/* Eligibility Check */}
        <LeaveEligibilityAlert
          eligibility={eligibility}
          isLoading={checkingEligibility}
          pilotName={request.pilot_name}
        />

        {/* Review Comments */}
        <div>
          <label htmlFor="reviewComments" className="block text-sm font-medium text-gray-700 mb-2">
            Review Comments
          </label>
          <textarea
            id="reviewComments"
            value={reviewComments}
            onChange={(e) => setReviewComments(e.target.value)}
            placeholder="Add comments about this leave request decision..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B] min-h-[100px]"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={() => handleStatusUpdate('DENIED')}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <XCircle className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Processing...' : 'Deny'}
          </button>

          <button
            onClick={() => handleStatusUpdate('APPROVED')}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Processing...' : 'Approve'}
          </button>
        </div>
      </div>
    </ModalSheet>
  );
}
