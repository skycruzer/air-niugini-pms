/**
 * @fileoverview Forms Management Page
 * View and manage digital form submissions (Incident Reports, Medical Declarations, etc.)
 * NOTE: Leave Request Forms are managed in /dashboard/leave
 *
 * @author AI Assistant
 * @version 2.0.0
 * @since 2025-10-07
 */

'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Download,
  Archive,
  Clock,
  Filter,
  Eye,
  Calendar,
  User,
  Search,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet } from '@/lib/api-client';
import { format } from 'date-fns';

export default function FormsManagementPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch form submissions
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['form-submissions', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      return apiGet(`/api/forms${params}`);
    },
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['form-stats'],
    queryFn: async () => {
      // Calculate stats from submissions
      const all = await apiGet('/api/forms');
      const active = all?.data?.filter((s: any) => s.status !== 'archived').length || 0;
      const archived = all?.data?.filter((s: any) => s.status === 'archived').length || 0;
      return { total: all?.data?.length || 0, active, archived };
    },
  });

  const handleArchive = async (submission: any) => {
    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          id: submission.id,
          status: 'archived',
          approved_by: user?.id,
        }),
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
        queryClient.invalidateQueries({ queryKey: ['form-stats'] });
      }
    } catch (error) {
      console.error('Failed to archive submission:', error);
    }
  };

  const handleDownload = (submission: any) => {
    // Convert form data to JSON and download
    const dataStr = JSON.stringify(
      {
        form: submission.digital_forms?.title,
        pilot: submission.pilots
          ? `${submission.pilots.first_name} ${submission.pilots.last_name}`
          : 'N/A',
        submitted: format(new Date(submission.created_at), 'MMM d, yyyy'),
        data: submission.form_data,
      },
      null,
      2
    );
    const dataUri = `data:application/json;charset=utf-8,${  encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = `form-${submission.id}-${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter submissions by search query
  const filteredSubmissions = submissions?.data?.filter((sub: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      sub.digital_forms?.title?.toLowerCase().includes(query) ||
      sub.pilots?.first_name?.toLowerCase().includes(query) ||
      sub.pilots?.last_name?.toLowerCase().includes(query)
    );
  });

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="w-8 h-8 mr-3 text-[#E4002B]" />
              Forms Management
            </h1>
            <p className="text-gray-600 mt-1">
              View and manage digital form submissions (Incident Reports, Medical Declarations,
              etc.)
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Note: Leave Request Forms are managed in Leave Management
            </p>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Total Submissions"
                value={stats.total}
                icon={FileText}
                color="blue"
              />
              <StatCard title="Active Forms" value={stats.active} icon={Clock} color="green" />
              <StatCard title="Archived" value={stats.archived} icon={Archive} color="gray" />
            </div>
          )}

          {/* Search & Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search forms by title or pilot name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    statusFilter === 'active'
                      ? 'bg-[#E4002B] text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatusFilter('archived')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    statusFilter === 'archived'
                      ? 'bg-[#E4002B] text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Archived
                </button>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-[#E4002B] text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  All
                </button>
              </div>
            </div>
          </div>

          {/* Submissions List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading submissions...</div>
            ) : filteredSubmissions?.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No submissions found</h3>
                <p className="text-gray-500">
                  {searchQuery
                    ? `No forms matching "${searchQuery}"`
                    : statusFilter === 'active'
                      ? 'No active submissions'
                      : `No ${statusFilter} submissions`}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredSubmissions?.map((submission: any) => {
                  const isArchived = submission.status === 'archived';
                  return (
                    <div key={submission.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {submission.digital_forms?.title || 'Form Submission'}
                            </h3>
                            {isArchived && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                <Archive className="w-3 h-3 mr-1" />
                                Archived
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2" />
                              {submission.pilots
                                ? `${submission.pilots.first_name} ${submission.pilots.last_name}`
                                : 'No pilot assigned'}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              Submitted {format(new Date(submission.created_at), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setShowDetailModal(true);
                            }}
                            className="px-3 py-1.5 bg-[#E4002B] text-white text-sm rounded-lg hover:bg-[#C00020] transition-colors flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleDownload(submission)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </button>
                          {!isArchived && (
                            <button
                              onClick={() => handleArchive(submission)}
                              className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                            >
                              <Archive className="w-4 h-4 mr-1" />
                              Archive
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail Modal */}
          {showDetailModal && selectedSubmission && (
            <DetailModal
              submission={selectedSubmission}
              onClose={() => {
                setShowDetailModal(false);
                setSelectedSubmission(null);
              }}
              onDownload={handleDownload}
              onArchive={handleArchive}
            />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function DetailModal({ submission, onClose, onDownload, onArchive }: any) {
  const isArchived = submission.status === 'archived';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {submission.digital_forms?.title}
              </h2>
              {isArchived && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  <Archive className="w-3 h-3 mr-1" />
                  Archived
                </span>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-700">Pilot</p>
                  <p className="text-gray-900">
                    {submission.pilots
                      ? `${submission.pilots.first_name} ${submission.pilots.last_name}`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Submitted Date</p>
                  <p className="text-gray-900">
                    {format(new Date(submission.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              {Object.entries(submission.form_data || {}).map(([key, value]: any) => (
                <div key={key}>
                  <p className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-gray-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onDownload(submission);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
              {!isArchived && (
                <button
                  onClick={() => {
                    onArchive(submission);
                    onClose();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
