'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Users, AlertCircle } from 'lucide-react';

interface PendingRegistration {
  id: string;
  employee_id: string;
  email: string;
  first_name: string;
  last_name: string;
  rank: string;
  seniority_number: number | null;
  created_at: string;
  email_confirmed: boolean;
}

export default function PilotRegistrationsPage() {
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionModal, setRejectionModal] = useState<{
    isOpen: boolean;
    registrationId: string | null;
    reason: string;
  }>({
    isOpen: false,
    registrationId: null,
    reason: '',
  });

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/pilot-registrations');
      const result = await response.json();

      if (result.success) {
        setRegistrations(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (registrationId: string) => {
    if (!confirm('Approve this pilot registration?')) return;

    setProcessingId(registrationId);

    try {
      const response = await fetch(`/api/admin/pilot-registrations/${registrationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve' }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Registration approved successfully');
        fetchRegistrations();
      } else {
        alert(result.error || 'Failed to approve registration');
      }
    } catch (error) {
      console.error('Error approving registration:', error);
      alert('Failed to approve registration');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionModal.registrationId || !rejectionModal.reason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setProcessingId(rejectionModal.registrationId);

    try {
      const response = await fetch(`/api/admin/pilot-registrations/${rejectionModal.registrationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          rejection_reason: rejectionModal.reason,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Registration rejected successfully');
        setRejectionModal({ isOpen: false, registrationId: null, reason: '' });
        fetchRegistrations();
      } else {
        alert(result.error || 'Failed to reject registration');
      }
    } catch (error) {
      console.error('Error rejecting registration:', error);
      alert('Failed to reject registration');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectionModal = (registrationId: string) => {
    setRejectionModal({
      isOpen: true,
      registrationId,
      reason: '',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E4002B] mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Users className="w-8 h-8 mr-3 text-[#E4002B]" />
          Pilot Registration Approvals
        </h1>
        <p className="text-gray-600 mt-2">Review and approve pending pilot registrations</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Pending
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{registrations.length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Email Confirmed
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {registrations.filter((r) => r.email_confirmed).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Awaiting Confirmation
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {registrations.filter((r) => !r.email_confirmed).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Registrations List */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {registrations.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No pending registrations
            </h3>
            <p className="text-gray-600">All pilot registrations have been processed</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Pilot Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Seniority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Email Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrations.map((registration) => (
                  <tr key={registration.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {registration.first_name} {registration.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{registration.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900">
                        {registration.employee_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded-full">
                        {registration.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        #{registration.seniority_number || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {registration.email_confirmed ? (
                        <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" />
                          Confirmed
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-semibold text-orange-700 bg-orange-100 rounded-full flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(registration.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(registration.id)}
                          disabled={processingId === registration.id}
                          className="px-3 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectionModal(registration.id)}
                          disabled={processingId === registration.id}
                          className="px-3 py-1.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectionModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Registration</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejecting this registration. The pilot will receive this
                message via email.
              </p>
              <textarea
                value={rejectionModal.reason}
                onChange={(e) =>
                  setRejectionModal({ ...rejectionModal, reason: e.target.value })
                }
                rows={4}
                placeholder="Reason for rejection..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-transparent resize-none"
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() =>
                    setRejectionModal({ isOpen: false, registrationId: null, reason: '' })
                  }
                  className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={processingId !== null || !rejectionModal.reason.trim()}
                  className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId ? 'Rejecting...' : 'Reject Registration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
