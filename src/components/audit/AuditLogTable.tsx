/**
 * AUDIT LOG TABLE COMPONENT
 *
 * Displays audit logs in a paginated, sortable table with Air Niugini branding.
 * Supports row expansion to view detailed change information.
 *
 * Features:
 * - Sortable columns
 * - Expandable rows for detailed view
 * - Action badges with color coding
 * - User and table filtering
 * - Pagination controls
 * - Air Niugini brand colors
 *
 * Part of Phase 4.2: Comprehensive Audit Logging UI
 */

'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { AuditLog } from '@/lib/audit-log-service';

interface AuditLogTableProps {
  logs: AuditLog[];
  isLoading?: boolean;
  onRowClick?: (log: AuditLog) => void;
  showPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function AuditLogTable({
  logs,
  isLoading = false,
  onRowClick,
  showPagination = true,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: AuditLogTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (logId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'RESTORE':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'SOFT_DELETE':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT':
        return '✨';
      case 'UPDATE':
        return '✏️';
      case 'DELETE':
        return '🗑️';
      case 'RESTORE':
        return '♻️';
      case 'SOFT_DELETE':
        return '📦';
      default:
        return '📝';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return timestamp;
    }
  };

  const renderChangedFields = (log: AuditLog) => {
    if (!log.changed_fields || log.changed_fields.length === 0) {
      return <span className="text-gray-500">No fields changed</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {log.changed_fields.map((field, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-[#FFC72C]/20 text-gray-800 rounded text-xs font-medium border border-[#FFC72C]/40"
          >
            {field}
          </span>
        ))}
      </div>
    );
  };

  const renderDataComparison = (log: AuditLog) => {
    if (!log.changed_fields || log.changed_fields.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 space-y-2">
        <h5 className="text-sm font-semibold text-gray-900">Changes:</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {log.changed_fields.map((field) => {
            const oldValue = log.old_data?.[field];
            const newValue = log.new_data?.[field];

            return (
              <div key={field} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-xs font-medium text-gray-600 mb-2">{field}</div>
                <div className="space-y-1">
                  <div className="flex items-start">
                    <span className="text-xs text-red-600 font-medium mr-2">Old:</span>
                    <span className="text-xs text-gray-700 break-all">
                      {oldValue !== undefined && oldValue !== null
                        ? JSON.stringify(oldValue)
                        : 'null'}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-xs text-green-600 font-medium mr-2">New:</span>
                    <span className="text-xs text-gray-700 break-all">
                      {newValue !== undefined && newValue !== null
                        ? JSON.stringify(newValue)
                        : 'null'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Audit Logs Found</h3>
        <p className="text-gray-600">No audit log entries match your current filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden lg:block card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#E4002B] to-[#C00020] text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Table
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => {
                const isExpanded = expandedRows.has(log.id);

                return (
                  <>
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => onRowClick?.(log)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {formatTimestamp(log.created_at_png || log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {log.user_email || 'System'}
                          </div>
                          {log.user_role && (
                            <div className="text-xs text-gray-500 capitalize">{log.user_role}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getActionBadgeColor(log.action)}`}
                        >
                          <span className="mr-1">{getActionIcon(log.action)}</span>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">{log.table_name}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {log.description || 'No description'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowExpansion(log.id);
                          }}
                          className="text-[#E4002B] hover:text-[#C00020] font-medium text-sm"
                        >
                          {isExpanded ? '▲ Hide' : '▼ Show'}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Row Details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 bg-gray-50">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <div className="text-xs font-medium text-gray-500 mb-1">
                                  Record ID
                                </div>
                                <div className="text-xs text-gray-900 font-mono">
                                  {log.record_id.substring(0, 8)}...
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-500 mb-1">
                                  IP Address
                                </div>
                                <div className="text-xs text-gray-900">
                                  {log.ip_address || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-500 mb-1">
                                  User Agent
                                </div>
                                <div
                                  className="text-xs text-gray-900 truncate"
                                  title={log.user_agent || undefined}
                                >
                                  {log.user_agent ? log.user_agent.substring(0, 30) + '...' : 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-500 mb-1">
                                  Changed Fields
                                </div>
                                <div className="text-xs">{renderChangedFields(log)}</div>
                              </div>
                            </div>

                            {/* Data Comparison */}
                            {renderDataComparison(log)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {logs.map((log) => {
          const isExpanded = expandedRows.has(log.id);

          return (
            <div
              key={log.id}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onRowClick?.(log)}
            >
              <div className="flex items-start justify-between mb-3">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getActionBadgeColor(log.action)}`}
                >
                  <span className="mr-1">{getActionIcon(log.action)}</span>
                  {log.action}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRowExpansion(log.id);
                  }}
                  className="text-[#E4002B] font-medium text-sm"
                >
                  {isExpanded ? '▲' : '▼'}
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500">User</div>
                  <div className="text-sm font-medium text-gray-900">
                    {log.user_email || 'System'}
                    {log.user_role && (
                      <span className="text-xs text-gray-500 ml-2">({log.user_role})</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Table</div>
                  <div className="text-sm font-medium text-gray-900">{log.table_name}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Description</div>
                  <div className="text-sm text-gray-700">{log.description || 'No description'}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Timestamp</div>
                  <div className="text-sm text-gray-900">
                    {formatTimestamp(log.created_at_png || log.created_at)}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Changed Fields</div>
                    {renderChangedFields(log)}
                  </div>

                  {renderDataComparison(log)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 rounded-lg">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange?.(pageNum)}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    currentPage === pageNum
                      ? 'bg-[#E4002B] text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
