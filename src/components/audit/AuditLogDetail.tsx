/**
 * AUDIT LOG DETAIL COMPONENT
 *
 * Displays detailed information about a single audit log entry.
 * Shows complete before/after state, metadata, and change timeline.
 *
 * Features:
 * - Complete audit log details
 * - JSON diff viewer for data changes
 * - User and system metadata
 * - Related audit entries
 * - Air Niugini branding
 *
 * Part of Phase 4.2: Comprehensive Audit Logging UI
 */

'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { AuditLog, getRecordAuditHistory } from '@/lib/audit-log-service';

interface AuditLogDetailProps {
  log: AuditLog;
  onClose?: () => void;
}

export function AuditLogDetail({ log, onClose }: AuditLogDetailProps) {
  const [relatedLogs, setRelatedLogs] = useState<AuditLog[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'changes' | 'history'>('details');

  useEffect(() => {
    const loadRelatedLogs = async () => {
      setIsLoadingRelated(true);
      try {
        const history = await getRecordAuditHistory(log.table_name, log.record_id);
        setRelatedLogs(history.filter((l) => l.id !== log.id));
      } catch (error) {
        console.error('Error loading related logs:', error);
      } finally {
        setIsLoadingRelated(false);
      }
    };

    loadRelatedLogs();
  }, [log]);

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
      return format(new Date(timestamp), 'MMMM dd, yyyy at HH:mm:ss');
    } catch {
      return timestamp;
    }
  };

  const renderJSONDiff = () => {
    if (!log.changed_fields || log.changed_fields.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl block mb-2">📝</span>
          <p>No field changes to display</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {log.changed_fields.map((field) => {
          const oldValue = log.old_data?.[field];
          const newValue = log.new_data?.[field];

          return (
            <div key={field} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h5 className="text-sm font-semibold text-gray-900">{field}</h5>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                {/* Old Value */}
                <div className="p-4 bg-red-50/30">
                  <div className="flex items-center mb-2">
                    <span className="text-xs font-semibold text-red-600 uppercase">Old Value</span>
                  </div>
                  <pre className="text-xs text-gray-800 font-mono bg-white rounded p-3 overflow-auto max-h-48 border border-red-200">
                    {JSON.stringify(oldValue, null, 2)}
                  </pre>
                </div>

                {/* New Value */}
                <div className="p-4 bg-green-50/30">
                  <div className="flex items-center mb-2">
                    <span className="text-xs font-semibold text-green-600 uppercase">
                      New Value
                    </span>
                  </div>
                  <pre className="text-xs text-gray-800 font-mono bg-white rounded p-3 overflow-auto max-h-48 border border-green-200">
                    {JSON.stringify(newValue, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderHistory = () => {
    if (isLoadingRelated) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin text-4xl mb-2">⏳</div>
          <p className="text-gray-500">Loading history...</p>
        </div>
      );
    }

    if (relatedLogs.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl block mb-2">📜</span>
          <p>No related audit entries found</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {relatedLogs.map((relatedLog, index) => (
          <div
            key={relatedLog.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getActionBadgeColor(relatedLog.action)}`}
                >
                  <span className="mr-1">{getActionIcon(relatedLog.action)}</span>
                  {relatedLog.action}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(relatedLog.created_at)}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-2">{relatedLog.description}</p>

            <div className="flex items-center text-xs text-gray-500">
              <span className="mr-1">👤</span>
              {relatedLog.user_email || 'System'}
              {relatedLog.changed_fields && relatedLog.changed_fields.length > 0 && (
                <>
                  <span className="mx-2">•</span>
                  <span>{relatedLog.changed_fields.length} field(s) changed</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#E4002B] to-[#C00020] text-white px-6 py-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">Audit Log Details</h2>
            <p className="text-sm text-red-100">Complete audit trail information</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <span className="text-2xl">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-[#E4002B] text-[#E4002B]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 Details
          </button>
          <button
            onClick={() => setActiveTab('changes')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'changes'
                ? 'border-[#E4002B] text-[#E4002B]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🔄 Changes
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-[#E4002B] text-[#E4002B]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📜 History ({relatedLogs.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Action Badge */}
            <div className="flex items-center space-x-3">
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getActionBadgeColor(log.action)}`}
              >
                <span className="mr-2 text-lg">{getActionIcon(log.action)}</span>
                {log.action}
              </span>
              <span className="text-sm text-gray-600">
                on <span className="font-medium">{log.table_name}</span>
              </span>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatTimestamp(log.created_at_png || log.created_at)}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {log.user_email || 'System'}
                    {log.user_role && (
                      <span className="ml-2 text-xs text-gray-600">({log.user_role})</span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table
                  </label>
                  <p className="text-sm text-gray-900 mt-1">{log.table_name}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Record ID
                  </label>
                  <p className="text-xs text-gray-900 mt-1 font-mono bg-gray-100 rounded px-2 py-1 inline-block">
                    {log.record_id}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {log.description || 'No description'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </label>
                  <p className="text-sm text-gray-900 mt-1">{log.ip_address || 'Not recorded'}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Agent
                  </label>
                  <p className="text-xs text-gray-900 mt-1 bg-gray-100 rounded px-2 py-1">
                    {log.user_agent || 'Not recorded'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Changed Fields
                  </label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {log.changed_fields && log.changed_fields.length > 0 ? (
                      log.changed_fields.map((field, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-[#FFC72C]/20 text-gray-800 rounded text-xs font-medium border border-[#FFC72C]/40"
                        >
                          {field}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">No fields changed</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Changes Tab */}
        {activeTab === 'changes' && renderJSONDiff()}

        {/* History Tab */}
        {activeTab === 'history' && renderHistory()}
      </div>
    </div>
  );
}
