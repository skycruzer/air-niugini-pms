/**
 * AUDIT LOG EXPORT COMPONENT
 *
 * Provides export functionality for audit logs to CSV format.
 * Supports filtered exports with date range and customization.
 *
 * Features:
 * - Export to CSV
 * - Custom filename
 * - Progress indication
 * - Export filtered data only
 * - Air Niugini branding
 *
 * Part of Phase 4.2: Comprehensive Audit Logging UI
 */

'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  downloadAuditLogsCSV,
  AuditLog,
  AuditLogFilters,
  getAuditLogs,
} from '@/lib/audit-log-service';

interface AuditLogExportProps {
  logs?: AuditLog[];
  filters?: AuditLogFilters;
  onClose?: () => void;
}

export function AuditLogExport({ logs, filters, onClose }: AuditLogExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [filename, setFilename] = useState(`audit-logs-${format(new Date(), 'yyyy-MM-dd')}`);
  const [includeAllPages, setIncludeAllPages] = useState(true);
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus({ type: null, message: '' });

    try {
      let logsToExport = logs || [];

      // If includeAllPages is true and we have filters, fetch all matching logs
      if (includeAllPages && filters) {
        const result = await getAuditLogs({
          ...filters,
          pageSize: 10000, // Large page size to get all results
        });
        logsToExport = result.logs;
      }

      if (logsToExport.length === 0) {
        setExportStatus({
          type: 'error',
          message: 'No audit logs to export',
        });
        setIsExporting(false);
        return;
      }

      // Download CSV
      downloadAuditLogsCSV(logsToExport, `${filename}.csv`);

      setExportStatus({
        type: 'success',
        message: `Successfully exported ${logsToExport.length} audit log entries`,
      });

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose?.();
      }, 2000);
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({
        type: 'error',
        message: 'Failed to export audit logs. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4F46E5] to-[#4338CA] text-white px-6 py-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">Export Audit Logs</h2>
            <p className="text-sm text-red-100">Download audit data as CSV</p>
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

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Export Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-2xl mr-3">ℹ️</span>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">Export Information</h4>
              <p className="text-xs text-blue-800">
                {logs && !includeAllPages
                  ? `Exporting ${logs.length} audit log entries from the current page.`
                  : 'Exporting all audit log entries that match the current filters.'}
              </p>
            </div>
          </div>
        </div>

        {/* Filename Input */}
        <div>
          <label htmlFor="filename" className="block text-sm font-medium text-gray-700 mb-2">
            Filename
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="input flex-1"
              placeholder="audit-logs"
              disabled={isExporting}
            />
            <span className="text-sm text-gray-500 font-medium">.csv</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">File will be saved as: {filename}.csv</p>
        </div>

        {/* Export Options */}
        {logs && (
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAllPages}
                onChange={(e) => setIncludeAllPages(e.target.checked)}
                className="w-4 h-4 text-[#4F46E5] border-gray-300 rounded focus:ring-[#4F46E5]"
                disabled={isExporting}
              />
              <span className="text-sm text-gray-700">
                Export all pages (not just current page)
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              {includeAllPages
                ? 'Will fetch and export all matching audit logs'
                : `Will only export ${logs.length} entries from the current page`}
            </p>
          </div>
        )}

        {/* Status Messages */}
        {exportStatus.type && (
          <div
            className={`rounded-lg p-4 ${
              exportStatus.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-start">
              <span className="text-2xl mr-3">{exportStatus.type === 'success' ? '✅' : '❌'}</span>
              <div>
                <h4
                  className={`text-sm font-semibold mb-1 ${
                    exportStatus.type === 'success' ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {exportStatus.type === 'success' ? 'Export Successful' : 'Export Failed'}
                </h4>
                <p
                  className={`text-xs ${
                    exportStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {exportStatus.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Export Format Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Export Format</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <p>• Timestamp (PNG Time)</p>
            <p>• User Email & Role</p>
            <p>• Action & Table Name</p>
            <p>• Record ID</p>
            <p>• Description</p>
            <p>• Changed Fields</p>
            <p>• IP Address</p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex items-center justify-between border-t border-gray-200">
        <button onClick={onClose} className="btn btn-ghost" disabled={isExporting}>
          Cancel
        </button>

        <button
          onClick={handleExport}
          disabled={isExporting || !filename.trim()}
          className="btn bg-[#4F46E5] text-white hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Exporting...
            </>
          ) : (
            <>
              <span className="mr-2">📥</span>
              Export to CSV
            </>
          )}
        </button>
      </div>
    </div>
  );
}
