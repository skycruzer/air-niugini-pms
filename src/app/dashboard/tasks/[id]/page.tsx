/**
 * @fileoverview Task Detail Page
 * Displays detailed information about a specific task
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-15
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Edit,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { apiGet, apiPatch, apiDelete } from '@/lib/api-client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { permissions } from '@/lib/auth-utils';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const taskId = params.id as string;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch task details
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      return apiGet(`/api/tasks/${taskId}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiDelete(`/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      router.push('/dashboard/tasks');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      return apiPatch(`/api/tasks/${taskId}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleDelete = () => {
    if (showDeleteConfirm) {
      deleteMutation.mutate();
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="text-gray-600 mt-2">Loading task details...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!task?.data) {
    return (
      <ProtectedRoute>
        <div className="p-6">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Task not found</h3>
            <p className="text-gray-600 mb-4">The task you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/dashboard/tasks')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tasks
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const taskData = task.data;

  return (
    <ProtectedRoute>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard/tasks')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {permissions.canEdit(user) && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/dashboard/tasks/${taskId}/edit`)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              {permissions.canDelete(user) && (
                <button
                  onClick={handleDelete}
                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                    showDeleteConfirm
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {showDeleteConfirm ? 'Click again to confirm' : 'Delete'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Task Header */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{taskData.title}</h1>
              {taskData.category && (
                <span
                  className="inline-block px-3 py-1 text-sm font-medium rounded-full"
                  style={{
                    backgroundColor: `${taskData.category.color}20`,
                    color: taskData.category.color,
                  }}
                >
                  {taskData.category.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={taskData.priority} />
              <StatusBadge status={taskData.status} />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-medium text-gray-900">
                {taskData.progress_percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${taskData.progress_percentage}%` }}
              />
            </div>
          </div>

          {/* Quick Actions */}
          {taskData.status !== 'COMPLETED' && taskData.status !== 'CANCELLED' && (
            <div className="flex gap-2 mt-4">
              {taskData.status === 'TODO' && (
                <button
                  onClick={() => updateStatusMutation.mutate('IN_PROGRESS')}
                  disabled={updateStatusMutation.isPending}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                >
                  Start Task
                </button>
              )}
              {taskData.status === 'IN_PROGRESS' && (
                <>
                  <button
                    onClick={() => updateStatusMutation.mutate('COMPLETED')}
                    disabled={updateStatusMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Mark Complete
                  </button>
                  <button
                    onClick={() => updateStatusMutation.mutate('BLOCKED')}
                    disabled={updateStatusMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Mark Blocked
                  </button>
                </>
              )}
              {taskData.status === 'BLOCKED' && (
                <button
                  onClick={() => updateStatusMutation.mutate('IN_PROGRESS')}
                  disabled={updateStatusMutation.isPending}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                >
                  Unblock & Resume
                </button>
              )}
            </div>
          )}
        </div>

        {/* Task Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {taskData.description || 'No description provided'}
              </p>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
              <div className="space-y-3">
                <InfoRow
                  icon={User}
                  label="Assigned To"
                  value={taskData.assignee?.name || 'Unassigned'}
                />
                <InfoRow icon={User} label="Created By" value={taskData.creator?.name || '-'} />
                <InfoRow
                  icon={Calendar}
                  label="Created"
                  value={format(new Date(taskData.created_at), 'MMM d, yyyy h:mm a')}
                />
                {taskData.due_date && (
                  <InfoRow
                    icon={Clock}
                    label="Due Date"
                    value={format(new Date(taskData.due_date), 'MMM d, yyyy')}
                  />
                )}
                {taskData.completed_at && (
                  <InfoRow
                    icon={CheckCircle2}
                    label="Completed"
                    value={format(new Date(taskData.completed_at), 'MMM d, yyyy h:mm a')}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Related Information */}
            {taskData.related_pilot_id && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Pilot</h2>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{taskData.pilot?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">
                      {taskData.pilot?.employee_id || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Notes */}
            {taskData.notes && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Notes
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{taskData.notes}</p>
              </div>
            )}

            {/* Task History */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity History</h2>
              <div className="space-y-3">
                {taskData.updated_at !== taskData.created_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last updated</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(taskData.updated_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Task created</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(taskData.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles = {
    URGENT: 'bg-red-100 text-red-800',
    HIGH: 'bg-orange-100 text-orange-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    LOW: 'bg-blue-100 text-blue-800',
  };

  return (
    <span
      className={`px-3 py-1 text-sm font-medium rounded-full ${styles[priority as keyof typeof styles]}`}
    >
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    TODO: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    BLOCKED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-600',
  };

  return (
    <span
      className={`px-3 py-1 text-sm font-medium rounded-full ${styles[status as keyof typeof styles]}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
