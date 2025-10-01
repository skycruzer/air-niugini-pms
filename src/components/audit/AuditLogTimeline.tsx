/**
 * AUDIT LOG TIMELINE COMPONENT
 *
 * Visual timeline display of audit log entries with chronological ordering.
 * Shows activity flow and change progression over time.
 *
 * Features:
 * - Chronological timeline view
 * - Color-coded action badges
 * - Expandable entries
 * - Date grouping
 * - Air Niugini branding
 *
 * Part of Phase 4.2: Comprehensive Audit Logging UI
 */

'use client';

import { useState } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { AuditLog } from '@/lib/audit-log-service';

interface AuditLogTimelineProps {
  logs: AuditLog[];
  onLogClick?: (log: AuditLog) => void;
}

export function AuditLogTimeline({ logs, onLogClick }: AuditLogTimelineProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-800' };
      case 'UPDATE':
        return { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-800' };
      case 'DELETE':
        return { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-800' };
      case 'RESTORE':
        return { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-800' };
      case 'SOFT_DELETE':
        return { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-800' };
      default:
        return { bg: 'bg-gray-500', border: 'border-gray-500', text: 'text-gray-800' };
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

  // Group logs by date
  const groupedLogs = logs.reduce(
    (groups, log) => {
      const date = format(parseISO(log.created_at), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(log);
      return groups;
    },
    {} as Record<string, AuditLog[]>
  );

  const sortedDates = Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a));

  if (logs.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-6xl mb-4">📜</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Timeline Data</h3>
        <p className="text-gray-600">No audit log entries to display in timeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sortedDates.map((date) => {
        const logsForDate = groupedLogs[date];
        const dateObj = parseISO(date);

        return (
          <div key={date} className="relative">
            {/* Date Header */}
            <div className="sticky top-0 z-10 bg-white border-b-2 border-[#E4002B] pb-2 mb-6">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📅</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {format(dateObj, 'EEEE, MMMM dd, yyyy')}
                  </h3>
                  <p className="text-sm text-gray-600">{logsForDate.length} events</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative pl-8 space-y-6">
              {/* Vertical Line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>

              {logsForDate.map((log, index) => {
                const colors = getActionColor(log.action);
                const isExpanded = expandedLogs.has(log.id);
                const isLast = index === logsForDate.length - 1;

                return (
                  <div key={log.id} className="relative">
                    {/* Timeline Node */}
                    <div
                      className={`absolute left-[-24px] w-8 h-8 rounded-full ${colors.bg} border-4 border-white shadow-lg flex items-center justify-center z-10`}
                    >
                      <span className="text-sm">{getActionIcon(log.action)}</span>
                    </div>

                    {/* Timeline Card */}
                    <div
                      className={`ml-6 card cursor-pointer hover:shadow-lg transition-all ${
                        isExpanded ? 'ring-2 ring-[#E4002B]' : ''
                      }`}
                      onClick={() => onLogClick?.(log)}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${colors.border} bg-white ${colors.text}`}
                            >
                              {log.action}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(parseISO(log.created_at), 'HH:mm:ss')}
                            </span>
                          </div>

                          <h4 className="text-sm font-semibold text-gray-900 mb-1">
                            {log.description || 'No description'}
                          </h4>

                          <div className="flex items-center text-xs text-gray-600 space-x-3">
                            <span>
                              <span className="mr-1">👤</span>
                              {log.user_email || 'System'}
                            </span>
                            <span>
                              <span className="mr-1">📊</span>
                              {log.table_name}
                            </span>
                            {log.changed_fields && log.changed_fields.length > 0 && (
                              <span>
                                <span className="mr-1">✏️</span>
                                {log.changed_fields.length} field(s)
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(log.id);
                          }}
                          className="text-[#E4002B] hover:text-[#C00020] font-medium text-sm ml-4"
                        >
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-gray-200 space-y-3">
                          {/* Changed Fields */}
                          {log.changed_fields && log.changed_fields.length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-gray-500 mb-2">
                                Changed Fields:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {log.changed_fields.map((field, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-[#FFC72C]/20 text-gray-800 rounded text-xs font-medium border border-[#FFC72C]/40"
                                  >
                                    {field}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <div className="font-medium text-gray-500 mb-1">Record ID</div>
                              <div className="text-gray-900 font-mono">
                                {log.record_id.substring(0, 16)}...
                              </div>
                            </div>

                            {log.ip_address && (
                              <div>
                                <div className="font-medium text-gray-500 mb-1">IP Address</div>
                                <div className="text-gray-900">{log.ip_address}</div>
                              </div>
                            )}
                          </div>

                          {/* Data Changes */}
                          {log.action === 'UPDATE' &&
                            log.changed_fields &&
                            log.changed_fields.length > 0 && (
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs font-medium text-gray-700 mb-2">
                                  Recent Changes:
                                </div>
                                <div className="space-y-2">
                                  {log.changed_fields.slice(0, 3).map((field) => (
                                    <div key={field} className="text-xs">
                                      <span className="font-medium text-gray-600">{field}:</span>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <span className="text-red-600">
                                          {JSON.stringify(log.old_data?.[field])?.substring(
                                            0,
                                            30
                                          ) || 'null'}
                                          {JSON.stringify(log.old_data?.[field])?.length > 30 &&
                                            '...'}
                                        </span>
                                        <span>→</span>
                                        <span className="text-green-600">
                                          {JSON.stringify(log.new_data?.[field])?.substring(
                                            0,
                                            30
                                          ) || 'null'}
                                          {JSON.stringify(log.new_data?.[field])?.length > 30 &&
                                            '...'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                  {log.changed_fields.length > 3 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      + {log.changed_fields.length - 3} more field(s)
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </div>

                    {/* Connector Line (except for last item) */}
                    {!isLast && (
                      <div className="absolute left-[-16px] top-8 w-0.5 h-full bg-gray-300"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Timeline End Marker */}
      <div className="relative pl-8">
        <div className="absolute left-[-20px] w-6 h-6 rounded-full bg-gray-300 border-4 border-white flex items-center justify-center">
          <span className="text-xs">🏁</span>
        </div>
        <div className="ml-6 text-center py-4 text-gray-500">
          <p className="text-sm font-medium">End of Timeline</p>
          <p className="text-xs">{logs.length} total events</p>
        </div>
      </div>
    </div>
  );
}
