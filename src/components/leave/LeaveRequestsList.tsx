'use client'

import { useState, useEffect } from 'react'
import { format, differenceInDays } from 'date-fns'
import { getAllLeaveRequests, getPendingLeaveRequests, deleteLeaveRequest, updateLeaveRequest, type LeaveRequest, type LeaveRequestStats } from '@/lib/leave-service'
import { LeaveApprovalWorkflow } from './LeaveApprovalWorkflow'
import { LeaveRequestForm } from './LeaveRequestForm'
import { useAuth } from '@/contexts/AuthContext'
import { permissions } from '@/lib/auth-utils'

interface LeaveRequestsListProps {
  refreshTrigger?: number
  filterStatus?: 'all' | 'pending' | 'approved' | 'denied'
  onStatsUpdate?: (stats: LeaveRequestStats) => void
}

export function LeaveRequestsList({ refreshTrigger, filterStatus = 'all', onStatsUpdate }: LeaveRequestsListProps) {
  const { user } = useAuth()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadRequests = async () => {
    try {
      setLoading(true)
      setError(null)

      let requestsData: LeaveRequest[]
      if (filterStatus === 'pending') {
        requestsData = await getPendingLeaveRequests()
      } else {
        requestsData = await getAllLeaveRequests()
      }

      // Apply client-side filtering for non-pending statuses
      if (filterStatus !== 'all' && filterStatus !== 'pending') {
        requestsData = requestsData.filter(req => req.status === filterStatus.toUpperCase())
      }

      setRequests(requestsData)

      // Calculate stats for parent component
      if (onStatsUpdate) {
        const stats = requestsData.reduce(
          (acc, request) => {
            acc.total++
            if (request.status === 'PENDING') acc.pending++
            else if (request.status === 'APPROVED') acc.approved++
            else if (request.status === 'DENIED') acc.denied++

            acc.byType[request.request_type as keyof typeof acc.byType]++
            return acc
          },
          {
            total: 0,
            pending: 0,
            approved: 0,
            denied: 0,
            byType: { RDO: 0, SDO: 0, ANNUAL: 0, SICK: 0, LSL: 0, LWOP: 0, MATERNITY: 0, COMPASSIONATE: 0 }
          }
        )
        onStatsUpdate(stats)
      }
    } catch (error) {
      console.error('Error loading leave requests:', error)
      setError(error instanceof Error ? error.message : 'Failed to load leave requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [refreshTrigger, filterStatus])

  const handleRequestUpdate = (updatedRequest: LeaveRequest) => {
    setRequests(prevRequests =>
      prevRequests.map(req => req.id === updatedRequest.id ? updatedRequest : req)
    )
    setSelectedRequest(null)
    // Reload to get fresh stats
    loadRequests()
  }

  const handleEditSuccess = () => {
    setEditingRequest(null)
    loadRequests() // Refresh the list and stats
  }

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this leave request?')) return

    try {
      setDeletingId(requestId)
      await deleteLeaveRequest(requestId)
      setRequests(prevRequests => prevRequests.filter(req => req.id !== requestId))
      loadRequests() // Refresh stats
    } catch (error) {
      console.error('Error deleting leave request:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete leave request')
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'DENIED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '⏳'
      case 'APPROVED':
        return '✅'
      case 'DENIED':
        return '❌'
      default:
        return '❓'
    }
  }

  const getLeaveTypeIcon = (type: string) => {
    switch (type) {
      case 'RDO':
        return '🏠'
      case 'SDO':
        return '🌴'
      case 'ANNUAL':
        return '🏖️'
      case 'SICK':
        return '🏥'
      case 'LSL':
        return '🎓'
      case 'LWOP':
        return '💼'
      case 'MATERNITY':
        return '👶'
      case 'COMPASSIONATE':
        return '💙'
      default:
        return '📋'
    }
  }

  const calculateDays = (startDate: string, endDate: string) => {
    return differenceInDays(new Date(endDate), new Date(startDate)) + 1
  }

  const canDeleteRequest = (request: LeaveRequest) => {
    return request.status === 'PENDING' && permissions.canDelete(user)
  }

  const canEditRequest = (request: LeaveRequest) => {
    return request.status === 'PENDING' && permissions.canEdit(user)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4002B] mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading leave requests...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <span className="text-red-400 mr-3">❌</span>
          <div>
            <h3 className="text-red-800 font-medium">Error Loading Requests</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={loadRequests}
              className="text-red-800 underline text-sm mt-2 hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl block mb-4">📋</span>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No leave requests found</h3>
        <p className="text-gray-600">
          {filterStatus === 'pending'
            ? 'No pending requests require review.'
            : 'No leave requests have been submitted yet.'
          }
        </p>
      </div>
    )
  }

  if (selectedRequest) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Review Leave Request</h3>
          <button
            onClick={() => setSelectedRequest(null)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>
        <LeaveApprovalWorkflow
          request={selectedRequest}
          onUpdate={handleRequestUpdate}
          onError={setError}
        />
      </div>
    )
  }

  if (editingRequest) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Edit Leave Request</h3>
          <button
            onClick={() => setEditingRequest(null)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>
        <LeaveRequestForm
          key={editingRequest?.id || 'edit-form'}
          editingRequest={editingRequest}
          onSuccess={handleEditSuccess}
          onCancel={() => setEditingRequest(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getLeaveTypeIcon(request.request_type)}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{request.pilot_name}</h3>
                  <p className="text-sm text-gray-600">
                    {request.employee_id} • {request.request_type} Request
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                  <span className="mr-1">{getStatusIcon(request.status)}</span>
                  {request.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Roster Period</p>
                <p className="font-medium text-[#E4002B]">{request.roster_period}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Dates</p>
                <p className="font-medium">
                  {format(new Date(request.start_date), 'dd MMM')} - {format(new Date(request.end_date), 'dd MMM yyyy')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Duration</p>
                <p className="font-medium">{calculateDays(request.start_date, request.end_date)} day{calculateDays(request.start_date, request.end_date) !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Requested</p>
                <p className="font-medium">{format(new Date(request.created_at), 'dd MMM yyyy')}</p>
              </div>
            </div>

            {request.reason && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Reason</p>
                <p className="text-sm bg-gray-50 rounded-lg p-2">{request.reason}</p>
              </div>
            )}

            {request.review_comments && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Review Comments</p>
                <p className="text-sm bg-gray-50 rounded-lg p-2">{request.review_comments}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                {request.reviewed_by && request.reviewed_at && (
                  <>
                    Reviewed by {request.reviewer_name || 'Unknown'} on {format(new Date(request.reviewed_at), 'dd MMM yyyy HH:mm')}
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {request.status === 'PENDING' && permissions.canApprove(user) && (
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Review
                  </button>
                )}
                {canEditRequest(request) && (
                  <button
                    onClick={() => setEditingRequest(request)}
                    className="px-3 py-1 text-sm bg-[#FFC72C] text-gray-900 rounded-md hover:bg-yellow-400 transition-colors font-medium"
                  >
                    Edit
                  </button>
                )}
                {canDeleteRequest(request) && (
                  <button
                    onClick={() => handleDeleteRequest(request.id)}
                    disabled={deletingId === request.id}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {deletingId === request.id ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    ) : (
                      'Delete'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}