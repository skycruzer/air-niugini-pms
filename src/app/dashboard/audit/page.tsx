/**
 * AUDIT LOGS PAGE
 *
 * Main audit log viewer with comprehensive filtering, sorting, and visualization.
 * Admin-only access with real-time updates via Supabase Realtime.
 *
 * Features:
 * - Advanced filtering (user, table, action, date range)
 * - Multiple view modes (table, timeline, charts)
 * - Export functionality (CSV)
 * - Real-time updates
 * - Pagination
 * - Admin-only access control
 *
 * Part of Phase 4.2: Comprehensive Audit Logging UI
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { permissions } from '@/lib/auth-utils';
import {
  getAuditLogs,
  getAuditStats,
  getAuditedUsers,
  getAuditedTables,
  AuditLog,
  AuditLogFilters,
  AuditStats,
} from '@/lib/audit-log-service';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { AuditLogFilters as Filters } from '@/components/audit/AuditLogFilters';
import { AuditLogDetail } from '@/components/audit/AuditLogDetail';
import { AuditLogExport } from '@/components/audit/AuditLogExport';
import { AuditLogTimeline } from '@/components/audit/AuditLogTimeline';
import { AuditLogCharts } from '@/components/audit/AuditLogCharts';
import { ComplianceReport } from '@/components/audit/ComplianceReport';

type ViewMode = 'table' | 'timeline' | 'charts';

export default function AuditLogsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [users, setUsers] = useState<{ email: string; role: string }[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<AuditLogFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showComplianceReport, setShowComplianceReport] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [error, setError] = useState<string | null>(null);

  // Check admin permission
  useEffect(() => {
    if (user && !permissions.canCreate(user)) {
      // Only admins can view audit logs
      router.push('/dashboard');
    }
  }, [user, router]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [usersData, tablesData, statsData] = await Promise.all([
        getAuditedUsers(),
        getAuditedTables(),
        getAuditStats(),
      ]);

      setUsers(usersData);
      setTables(tablesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading audit data:', error);
      setError('Failed to load audit data. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load logs based on filters
  const loadLogs = useCallback(async (filters: AuditLogFilters, page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getAuditLogs({
        ...filters,
        page,
        pageSize: 50,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      setLogs(result.logs);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      setError('Failed to load audit logs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (filters: AuditLogFilters) => {
      setCurrentFilters(filters);
      loadLogs(filters, 1);
    },
    [loadLogs]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      loadLogs(currentFilters, page);
    },
    [currentFilters, loadLogs]
  );

  // Handle log selection
  const handleLogClick = useCallback((log: AuditLog) => {
    setSelectedLog(log);
  }, []);

  // Render unauthorized state
  if (user && !permissions.canCreate(user)) {
    return null;
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="mb-6 animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2 flex items-center">
                  <span className="mr-3">🔍</span>
                  Audit Logs
                </h1>
                <p className="text-gray-600">
                  Complete audit trail of all system modifications and user activity
                </p>
              </div>

              <div className="flex items-center space-x-3 mt-4 lg:mt-0">
                <button
                  onClick={() => setShowComplianceReport(true)}
                  className="btn bg-[#FFC72C] text-gray-900 hover:bg-[#E0B020] font-semibold"
                >
                  <span className="mr-2">📋</span>
                  Compliance Report
                </button>

                <button
                  onClick={() => setShowExportModal(true)}
                  className="btn bg-[#E4002B] text-white hover:bg-[#C00020]"
                >
                  <span className="mr-2">📥</span>
                  Export
                </button>
              </div>
            </div>

            {/* Admin Badge */}
            <div className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold border-2 border-red-300">
              <span className="mr-2">🔒</span>
              Admin Only - Restricted Access
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <h3 className="text-sm font-semibold text-red-900 mb-1">Error</h3>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Summary */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Total Logs</p>
                    <p className="text-2xl font-black text-blue-900">
                      {stats.totalLogs.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-4xl">📊</span>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-green-600 uppercase mb-1">
                      Active Users
                    </p>
                    <p className="text-2xl font-black text-green-900">{stats.totalUsers}</p>
                  </div>
                  <span className="text-4xl">👥</span>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-purple-600 uppercase mb-1">Tables</p>
                    <p className="text-2xl font-black text-purple-900">{stats.totalTables}</p>
                  </div>
                  <span className="text-4xl">🗄️</span>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-amber-600 uppercase mb-1">
                      Filtered Results
                    </p>
                    <p className="text-2xl font-black text-amber-900">
                      {totalCount.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-4xl">🔎</span>
                </div>
              </div>
            </div>
          )}

          {/* View Mode Selector */}
          <div className="card mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    viewMode === 'table'
                      ? 'bg-[#E4002B] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">📋</span>
                  Table View
                </button>

                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    viewMode === 'timeline'
                      ? 'bg-[#E4002B] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">📜</span>
                  Timeline View
                </button>

                <button
                  onClick={() => setViewMode('charts')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    viewMode === 'charts'
                      ? 'bg-[#E4002B] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">📈</span>
                  Charts View
                </button>
              </div>

              <div className="text-sm text-gray-600">
                Viewing {logs.length} of {totalCount} entries
              </div>
            </div>
          </div>

          {/* Filters (only for table and timeline views) */}
          {(viewMode === 'table' || viewMode === 'timeline') && (
            <Filters
              users={users}
              tables={tables}
              onFiltersChange={handleFiltersChange}
              isLoading={isLoading}
            />
          )}

          {/* Main Content */}
          <div className="mt-6">
            {viewMode === 'table' && (
              <AuditLogTable
                logs={logs}
                isLoading={isLoading}
                onRowClick={handleLogClick}
                showPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}

            {viewMode === 'timeline' && (
              <AuditLogTimeline logs={logs} onLogClick={handleLogClick} />
            )}

            {viewMode === 'charts' && stats && <AuditLogCharts stats={stats} />}
          </div>
        </div>

        {/* Modals */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <AuditLogDetail log={selectedLog} onClose={() => setSelectedLog(null)} />
          </div>
        )}

        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <AuditLogExport
              logs={logs}
              filters={currentFilters}
              onClose={() => setShowExportModal(false)}
            />
          </div>
        )}

        {showComplianceReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <ComplianceReport onClose={() => setShowComplianceReport(false)} />
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
