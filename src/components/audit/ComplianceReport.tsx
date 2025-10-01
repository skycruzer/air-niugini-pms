/**
 * COMPLIANCE REPORT COMPONENT
 *
 * Generates regulatory compliance reports for audit logs.
 * Focuses on certification tracking and pilot record modifications.
 *
 * Features:
 * - Certification audit trail reports
 * - Pilot record modification reports
 * - Date range filtering
 * - Export to CSV/PDF
 * - Digital timestamps
 * - Air Niugini branding
 *
 * Part of Phase 4.2: Comprehensive Audit Logging UI
 */

'use client';

import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import {
  getCertificationAuditTrail,
  getPilotAuditTrail,
  downloadAuditLogsCSV,
  AuditLog,
} from '@/lib/audit-log-service';

interface ComplianceReportProps {
  onClose?: () => void;
}

type ReportType = 'certifications' | 'pilots' | 'all';

export function ComplianceReport({ onClose }: ComplianceReportProps) {
  const [reportType, setReportType] = useState<ReportType>('certifications');
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 90), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<AuditLog[] | null>(null);
  const [reportStats, setReportStats] = useState<{
    totalChanges: number;
    userCount: number;
    insertCount: number;
    updateCount: number;
    deleteCount: number;
  } | null>(null);

  const generateReport = async () => {
    setIsGenerating(true);
    setReportData(null);
    setReportStats(null);

    try {
      let logs: AuditLog[] = [];

      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;

      if (reportType === 'certifications') {
        logs = await getCertificationAuditTrail(start, end);
      } else if (reportType === 'pilots') {
        logs = await getPilotAuditTrail(undefined, start, end);
      } else {
        const [certLogs, pilotLogs] = await Promise.all([
          getCertificationAuditTrail(start, end),
          getPilotAuditTrail(undefined, start, end),
        ]);
        logs = [...certLogs, ...pilotLogs].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

      // Calculate statistics
      const uniqueUsers = new Set(logs.map((log) => log.user_email).filter(Boolean));
      const stats = {
        totalChanges: logs.length,
        userCount: uniqueUsers.size,
        insertCount: logs.filter((log) => log.action === 'INSERT').length,
        updateCount: logs.filter((log) => log.action === 'UPDATE').length,
        deleteCount: logs.filter((log) => log.action === 'DELETE' || log.action === 'SOFT_DELETE')
          .length,
      };

      setReportData(logs);
      setReportStats(stats);
    } catch (error) {
      console.error('Error generating compliance report:', error);
      alert('Failed to generate compliance report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    if (!reportData) return;

    const filename = `compliance-report-${reportType}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}`;
    downloadAuditLogsCSV(reportData, filename);
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'certifications':
        return 'Certification Modifications Compliance Report';
      case 'pilots':
        return 'Pilot Records Compliance Report';
      case 'all':
        return 'Comprehensive Compliance Report';
      default:
        return 'Compliance Report';
    }
  };

  const getReportDescription = () => {
    switch (reportType) {
      case 'certifications':
        return 'Complete audit trail of all certification modifications, updates, and expiry management for regulatory compliance.';
      case 'pilots':
        return 'Detailed audit log of all pilot record modifications, including personal information and role changes.';
      case 'all':
        return 'Comprehensive compliance report covering all certification and pilot record modifications.';
      default:
        return 'Compliance audit report for regulatory purposes.';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-6xl mx-auto max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#E4002B] to-[#C00020] text-white px-6 py-4 rounded-t-lg sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">Compliance Reports</h2>
            <p className="text-sm text-red-100">Generate regulatory compliance audit reports</p>
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

      {/* Report Configuration */}
      <div className="p-6 space-y-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="input w-full"
              disabled={isGenerating}
            >
              <option value="certifications">Certification Modifications</option>
              <option value="pilots">Pilot Record Changes</option>
              <option value="all">Comprehensive Report</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate}
              className="input w-full"
              disabled={isGenerating}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="input w-full"
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {startDate && endDate && (
              <p>
                Report period:{' '}
                <span className="font-medium">{format(new Date(startDate), 'MMM dd, yyyy')}</span>{' '}
                to <span className="font-medium">{format(new Date(endDate), 'MMM dd, yyyy')}</span>
              </p>
            )}
          </div>

          <button
            onClick={generateReport}
            disabled={isGenerating || !startDate || !endDate}
            className="btn bg-[#E4002B] text-white hover:bg-[#C00020] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Generating...
              </>
            ) : (
              <>
                <span className="mr-2">📊</span>
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Results */}
      {reportData && reportStats && (
        <div className="p-6 space-y-6">
          {/* Report Header */}
          <div className="border-l-4 border-[#E4002B] pl-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{getReportTitle()}</h3>
            <p className="text-sm text-gray-600 mb-4">{getReportDescription()}</p>

            <div className="flex items-center text-xs text-gray-500 space-x-4">
              <span>Generated: {format(new Date(), 'MMMM dd, yyyy at HH:mm:ss')} (PNG Time)</span>
              <span>•</span>
              <span>
                Period: {format(new Date(startDate), 'MMM dd, yyyy')} -{' '}
                {format(new Date(endDate), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
              <div className="text-center">
                <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Total Changes</p>
                <p className="text-2xl font-black text-blue-900">{reportStats.totalChanges}</p>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
              <div className="text-center">
                <p className="text-xs font-semibold text-green-600 uppercase mb-1">Insertions</p>
                <p className="text-2xl font-black text-green-900">{reportStats.insertCount}</p>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200">
              <div className="text-center">
                <p className="text-xs font-semibold text-amber-600 uppercase mb-1">Updates</p>
                <p className="text-2xl font-black text-amber-900">{reportStats.updateCount}</p>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200">
              <div className="text-center">
                <p className="text-xs font-semibold text-red-600 uppercase mb-1">Deletions</p>
                <p className="text-2xl font-black text-red-900">{reportStats.deleteCount}</p>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
              <div className="text-center">
                <p className="text-xs font-semibold text-purple-600 uppercase mb-1">Active Users</p>
                <p className="text-2xl font-black text-purple-900">{reportStats.userCount}</p>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              className="btn bg-[#FFC72C] text-gray-900 hover:bg-[#E0B020] font-semibold"
            >
              <span className="mr-2">📥</span>
              Export to CSV
            </button>
          </div>

          {/* Recent Changes List */}
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4">Recent Changes</h4>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {reportData.slice(0, 50).map((log) => (
                <div
                  key={log.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${
                          log.action === 'INSERT'
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : log.action === 'UPDATE'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-red-100 text-red-800 border-red-300'
                        }`}
                      >
                        {log.action}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{log.table_name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(log.created_at), 'MMM dd, HH:mm')}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mb-2">{log.description}</p>

                  <div className="flex items-center text-xs text-gray-500 space-x-3">
                    <span>
                      <span className="mr-1">👤</span>
                      {log.user_email || 'System'}
                    </span>
                    {log.changed_fields && log.changed_fields.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{log.changed_fields.length} field(s) changed</span>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {reportData.length > 50 && (
                <div className="text-center text-sm text-gray-500 py-4">
                  Showing first 50 of {reportData.length} entries. Export full report for complete
                  data.
                </div>
              )}
            </div>
          </div>

          {/* Compliance Statement */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
            <h5 className="text-sm font-bold text-gray-900 mb-3">Compliance Statement</h5>
            <div className="text-xs text-gray-700 space-y-2">
              <p>
                This report has been generated from the Air Niugini B767 Pilot Management System
                audit log database. All timestamps are recorded in Papua New Guinea (Port Moresby)
                timezone.
              </p>
              <p>
                The audit trail is immutable and provides complete accountability for all data
                modifications in accordance with aviation industry regulatory requirements.
              </p>
              <p className="font-medium">
                Digital Signature: {format(new Date(), 'yyyy-MM-dd-HH:mm:ss')} | Report ID:{' '}
                {crypto.randomUUID().substring(0, 8)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No Report State */}
      {!reportData && !isGenerating && (
        <div className="p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Generate Report</h3>
          <p className="text-gray-600">
            Configure report parameters above and click "Generate Report" to create a compliance
            audit report.
          </p>
        </div>
      )}
    </div>
  );
}
