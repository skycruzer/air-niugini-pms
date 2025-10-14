/**
 * @fileoverview Disciplinary Matters Dashboard Page
 * Main page for viewing and managing pilot disciplinary matters
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-06
 */

'use client';

import { useState, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Plus, Filter, FileText, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { apiGet } from '@/lib/api-client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LazyLoader } from '@/components/ui/LazyLoader';

// Lazy load the modal
const DisciplinaryMatterModal = lazy(() =>
  import('@/components/disciplinary/DisciplinaryMatterModal').then((mod) => ({
    default: mod.DisciplinaryMatterModal,
  }))
);

export default function DisciplinaryMattersPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    pilot_id: '',
  });

  // Fetch disciplinary matters
  const { data: matters, isLoading, refetch } = useQuery({
    queryKey: ['disciplinary-matters', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.set('status', filters.status);
      if (filters.severity !== 'all') params.set('severity', filters.severity);
      if (filters.pilot_id) params.set('pilot_id', filters.pilot_id);

      return apiGet(`/api/disciplinary-matters?${params}`);
    },
  });

  // Fetch statistics
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['disciplinary-stats'],
    queryFn: async () => {
      return apiGet('/api/disciplinary-matters?action=statistics');
    },
  });

  const handleAddSuccess = () => {
    refetch();
    refetchStats();
  };

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Disciplinary Matters</h1>
              <p className="text-gray-600 mt-1">Track and manage pilot disciplinary cases</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Case
            </button>
          </div>

          {/* Statistics Cards */}
          {stats?.data && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Cases" value={stats.data.total} icon={FileText} color="blue" />
              <StatCard
                title="Critical"
                value={stats.data.by_severity.critical}
                icon={AlertTriangle}
                color="red"
              />
              <StatCard
                title="Serious"
                value={stats.data.by_severity.serious}
                icon={AlertTriangle}
                color="orange"
              />
              <StatCard
                title="Open"
                value={stats.data.by_status.open}
                icon={TrendingUp}
                color="yellow"
              />
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="all">All Status</option>
                  <option value="OPEN">Open</option>
                  <option value="UNDER_INVESTIGATION">Under Investigation</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                  <option value="APPEALED">Appealed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
                  value={filters.severity}
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                >
                  <option value="all">All Severity</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="SERIOUS">Serious</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="MINOR">Minor</option>
                </select>
              </div>
            </div>
          </div>

          {/* Matters List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : matters?.data?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No disciplinary matters found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Pilot
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Incident Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Severity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {matters?.data?.map((matter: any) => (
                      <tr key={matter.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{matter.title}</div>
                          <div className="text-sm text-gray-500">{matter.incident_type?.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {matter.pilot?.first_name} {matter.pilot?.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{matter.pilot?.employee_id}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(matter.incident_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <SeverityBadge severity={matter.severity} />
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={matter.status} />
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/dashboard/disciplinary/${matter.id}`}
                            className="text-[#4F46E5] hover:text-[#4338CA] font-medium"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <LazyLoader type="modal">
            <DisciplinaryMatterModal
              isOpen={showAddModal}
              onClose={() => setShowAddModal(false)}
              onSuccess={handleAddSuccess}
            />
          </LazyLoader>
        )}
    </ProtectedRoute>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    red: 'bg-red-100 text-red-800',
    orange: 'bg-orange-100 text-orange-800',
    yellow: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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

function SeverityBadge({ severity }: { severity: string }) {
  const styles = {
    CRITICAL: 'bg-red-100 text-red-800',
    SERIOUS: 'bg-orange-100 text-orange-800',
    MODERATE: 'bg-yellow-100 text-yellow-800',
    MINOR: 'bg-blue-100 text-blue-800',
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${styles[severity as keyof typeof styles]}`}
    >
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    OPEN: 'bg-yellow-100 text-yellow-800',
    UNDER_INVESTIGATION: 'bg-blue-100 text-blue-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
    APPEALED: 'bg-purple-100 text-purple-800',
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
