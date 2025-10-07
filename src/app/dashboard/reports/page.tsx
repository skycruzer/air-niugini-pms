'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  ExpiryTimelineChart,
  ComplianceDonutChart,
  PilotRequirementsChart,
  CategoryBreakdownChart,
  AvailabilityGauge,
  RiskTrendChart,
} from '@/components/shared/charts/ReportCharts';
import {
  exportPilotsToCSV,
  exportCertificationsToCSV,
  exportLeaveRequestsToCSV,
  exportComplianceReport,
} from '@/lib/export-utils';
import { calculateRetirementInfo } from '@/lib/retirement-utils';
import { BarChart3, TrendingUp, FileText, Download } from 'lucide-react';

interface ReportSummary {
  totalPilots: number;
  totalCertifications: number;
  currentCertifications: number;
  expiringCertifications: number;
  expiredCertifications: number;
  complianceRate: number;
}

interface ReportData {
  summary?: ReportSummary;
  pilots?: any[];
  pilotBreakdown?: any[];
  expiredCertifications?: any[];
  expiringCertifications?: any[];
  monthlyForecast?: any;
  upcomingRenewals?: any[];
  fleetSummary?: any;
  certificationAnalytics?: any;
  availability?: any;
  upcomingLeave?: any[];
  generatedAt: string;
  generatedBy: string;
}

const REPORT_TYPES = [
  {
    id: 'compliance-dashboard',
    title: 'Compliance Dashboard',
    description:
      'Comprehensive compliance status, risk assessment, and operational readiness with detailed analytics and immediate action items',
    icon: '📊',
    color: 'blue',
    pdfSupported: true,
    features: [
      'Certification compliance rates',
      'Risk analysis',
      'Operational capacity',
      'Critical alerts',
    ],
  },
  {
    id: 'pilot-management',
    title: 'Pilot Management Report',
    description:
      'Complete pilot roster, qualifications, succession planning, and performance metrics for fleet management',
    icon: '👨‍✈️',
    color: 'green',
    pdfSupported: true,
    features: [
      'Pilot roster',
      'Qualifications tracking',
      'Succession planning',
      'Performance metrics',
    ],
  },
  {
    id: 'certification-planning',
    title: 'Certification Planning',
    description:
      'Certification expiry forecast (7, 14, 28, 60, 90 days), upcoming renewals, and pilot requirements planning',
    icon: '📅',
    color: 'purple',
    pdfSupported: true,
    features: ['Expiry forecast', 'Renewal planning', 'Pilot requirements', 'Roster analysis'],
  },
  {
    id: 'operational-status',
    title: 'Operational Status Report',
    description:
      'Real-time operational capacity, crew availability, readiness assessment, and fleet utilization metrics',
    icon: '✈️',
    color: 'indigo',
    pdfSupported: true,
    features: ['Crew availability', 'Readiness assessment', 'Fleet utilization', 'Leave status'],
  },
  {
    id: 'fleet-analytics',
    title: 'Fleet Analytics',
    description:
      'Advanced performance metrics, trends analysis, and data-driven insights for strategic decision making',
    icon: '📈',
    color: 'teal',
    pdfSupported: true,
    features: [
      'Performance trends',
      'Comparative analysis',
      'Predictive insights',
      'Strategic metrics',
    ],
  },
];

// Helper function to add retirement information to pilot data
const addRetirementInfoToPilot = (pilot: any) => {
  const retirementInfo = pilot.date_of_birth ? calculateRetirementInfo(pilot.date_of_birth) : null;

  return {
    ...pilot,
    retirement: retirementInfo
      ? {
          retirementDate: retirementInfo.retirementDate.toISOString().split('T')[0],
          timeToRetirement: retirementInfo.displayText,
          retirementStatus: retirementInfo.retirementStatus,
        }
      : undefined,
  };
};

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async (reportType: string) => {
    setLoading(true);
    setError(null);
    setSelectedReport(reportType);

    try {
      const response = await fetch(`/api/reports?type=${reportType}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate report');
      }

      setReportData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!reportData || !selectedReport) return;

    const reportTitle = REPORT_TYPES.find((r) => r.id === selectedReport)?.title || 'Report';
    const timestamp = new Date().toISOString().split('T')[0];

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportTitle.replace(/\s+/g, '_')}_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async (reportType?: string, pilotId?: string) => {
    const targetReportType = reportType || selectedReport;
    if (!targetReportType) return;

    setLoading(true);
    try {
      const requestBody: any = {
        reportType: targetReportType,
        generatedBy: 'Air Niugini User', // You might want to get this from auth context
      };

      // Add pilot ID for individual pilot reports
      if (pilotId) {
        requestBody.pilotId = pilotId;
      }

      const response = await fetch('/api/reports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? (contentDisposition.split('filename=')[1]?.replace(/"/g, '') ??
          `${targetReportType}-report-${new Date().toISOString().split('T')[0]}.pdf`)
        : `${targetReportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`✅ Successfully downloaded ${targetReportType} PDF report`);
    } catch (err) {
      console.error('❌ PDF download error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!reportData || !selectedReport) return;

    try {
      switch (selectedReport) {
        case 'fleet-compliance':
          if (reportData.pilots) {
            exportPilotsToCSV(
              reportData.pilots.map((pilot) => ({
                ...addRetirementInfoToPilot(pilot),
                certificationStatus: pilot.certificationSummary || {
                  total: 0,
                  current: 0,
                  expiring: 0,
                  expired: 0,
                },
              })),
              false
            );
          }
          break;

        case 'risk-assessment':
          if (reportData.expiredCertifications) {
            exportCertificationsToCSV(
              reportData.expiredCertifications.map((cert) => ({
                pilot_name: cert.pilot,
                employee_id: cert.employeeId,
                check_code: cert.checkType,
                check_description: cert.checkType,
                category: 'Risk Assessment',
                expiry_date: cert.expiryDate,
                status: 'Expired',
                days_until_expiry: cert.daysOverdue ? -cert.daysOverdue : undefined,
              })),
              true
            );
          }
          break;

        case 'pilot-summary':
          if (reportData.pilots) {
            exportPilotsToCSV(
              reportData.pilots.map((pilot) => ({
                ...addRetirementInfoToPilot(pilot),
                certificationStatus: pilot.certificationSummary || {
                  total: 0,
                  current: 0,
                  expiring: 0,
                  expired: 0,
                },
              })),
              false
            );
          }
          break;

        case 'operational-readiness':
          if (reportData.upcomingLeave) {
            exportLeaveRequestsToCSV(reportData.upcomingLeave, false);
          }
          break;

        default:
          // Generic JSON export for other report types
          downloadReport();
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export CSV');
    }
  };

  const printReport = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-display-small text-gray-900 mb-2">Fleet Reports</h1>
          <p className="text-body-medium text-gray-600">
            Generate comprehensive reports for B767 fleet operations, compliance, and performance
            analytics.
          </p>
        </div>

        {/* Report Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {REPORT_TYPES.map((report) => (
            <div
              key={report.id}
              className={`card-aviation cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedReport === report.id ? 'ring-2 ring-blue-600' : ''
              }`}
              onClick={() => generateReport(report.id)}
            >
              <div className="flex items-start space-x-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    report.color === 'blue'
                      ? 'bg-blue-100 text-blue-600'
                      : report.color === 'red'
                        ? 'bg-red-100 text-red-600'
                        : report.color === 'green'
                          ? 'bg-green-100 text-green-600'
                          : report.color === 'purple'
                            ? 'bg-purple-100 text-purple-600'
                            : report.color === 'indigo'
                              ? 'bg-indigo-100 text-indigo-600'
                              : report.color === 'teal'
                                ? 'bg-teal-100 text-teal-600'
                                : report.color === 'orange'
                                  ? 'bg-orange-100 text-orange-600'
                                  : 'bg-yellow-100 text-yellow-600'
                  }`}
                >
                  <span className="text-xl">{report.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Professional PDF Export Section */}
        <div className="card-aviation mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">📄</span>
            </span>
            Professional PDF Reports
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Generate high-quality PDF reports with Air Niugini branding for professional
            documentation and regulatory compliance.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {REPORT_TYPES.filter((report) => report.pdfSupported).map((report) => (
              <button
                key={report.id}
                onClick={() => downloadPDF(report.id)}
                className="btn-secondary text-sm justify-center flex items-center gap-2"
                disabled={loading}
                title={`Generate ${report.title} as PDF`}
              >
                <span>{report.icon}</span>
                <span>{report.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Data Export Section */}
        <div className="card-aviation mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Download className="text-white w-5 h-5" />
            </span>
            Quick Data Exports
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Export current pilot and certification data directly to CSV format without generating a
            full report.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => {
                // Export all pilots with current data
                fetch('/api/pilots')
                  .then((res) => res.json())
                  .then((result) => {
                    if (result.success) {
                      exportPilotsToCSV(
                        result.data.map((pilot: any) => ({
                          ...addRetirementInfoToPilot(pilot),
                          certificationStatus: {
                            total: pilot.total_checks || 0,
                            current: pilot.current_checks || 0,
                            expiring: pilot.expiring_checks || 0,
                            expired: pilot.expired_checks || 0,
                          },
                        })),
                        false
                      );
                    }
                  })
                  .catch(() => setError('Failed to export pilots data'));
              }}
              className="btn-secondary text-sm justify-center flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Export All Pilots
            </button>

            <button
              onClick={() => {
                // Export pilots with certification issues
                fetch('/api/pilots')
                  .then((res) => res.json())
                  .then((result) => {
                    if (result.success) {
                      const nonCompliantPilots = result.data.filter(
                        (pilot: any) =>
                          (pilot.expired_checks || 0) > 0 || (pilot.expiring_checks || 0) > 0
                      );
                      exportComplianceReport(
                        nonCompliantPilots.map((pilot: any) => ({
                          ...addRetirementInfoToPilot(pilot),
                          certificationStatus: {
                            total: pilot.total_checks || 0,
                            current: pilot.current_checks || 0,
                            expiring: pilot.expiring_checks || 0,
                            expired: pilot.expired_checks || 0,
                          },
                        }))
                      );
                    }
                  })
                  .catch(() => setError('Failed to export compliance report'));
              }}
              className="btn-secondary text-sm justify-center"
            >
              ⚠️ Compliance Report
            </button>

            <button
              onClick={() => {
                // Export all certifications
                fetch('/api/certifications')
                  .then((res) => res.json())
                  .then((result) => {
                    if (result.success) {
                      exportCertificationsToCSV(
                        result.data.map((cert: any) => ({
                          pilot_name: cert.pilot_name,
                          employee_id: cert.employee_id,
                          check_code: cert.check_code,
                          check_description: cert.check_description,
                          category: cert.category,
                          expiry_date: cert.expiry_date,
                          status: cert.status,
                          days_until_expiry: cert.days_until_expiry,
                        })),
                        false
                      );
                    }
                  })
                  .catch(() => setError('Failed to export certifications data'));
              }}
              className="btn-secondary text-sm justify-center"
            >
              🎯 All Certifications
            </button>

            <button
              onClick={() => {
                // Export leave requests
                fetch('/api/leave-requests')
                  .then((res) => res.json())
                  .then((result) => {
                    if (result.success) {
                      exportLeaveRequestsToCSV(result.data, false);
                    }
                  })
                  .catch(() => setError('Failed to export leave requests'));
              }}
              className="btn-secondary text-sm justify-center"
            >
              📅 Leave Requests
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="card-aviation text-center py-12">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <BarChart3 className="text-white w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Report...</h3>
            <p className="text-gray-600">Processing data and compiling results</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="card-aviation border-red-200 bg-red-50">
            <div className="flex items-center space-x-3">
              <span className="text-red-500 text-xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-red-800">Error Generating Report</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Report Display */}
        {reportData && selectedReport && !loading && (
          <div className="space-y-6">
            {/* Report Header */}
            <div className="card-aviation">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {REPORT_TYPES.find((r) => r.id === selectedReport)?.title}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Generated on{' '}
                    {new Date(
                      (reportData as any).metadata?.generatedAt ||
                        (reportData as any).generatedAt ||
                        new Date()
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={downloadCSV}
                    className="btn-secondary text-sm"
                    disabled={loading}
                    title="Export report data to CSV format"
                  >
                    <BarChart3 className="w-4 h-4 mr-2 inline" />
                    Export CSV
                  </button>
                  {REPORT_TYPES.find((r) => r.id === selectedReport)?.pdfSupported ? (
                    <button
                      onClick={() => downloadPDF()}
                      className="btn-secondary text-sm"
                      disabled={loading}
                      title="Download professional PDF report with Air Niugini branding"
                    >
                      📄 Professional PDF
                    </button>
                  ) : (
                    <button
                      onClick={downloadReport}
                      className="btn-secondary text-sm"
                      disabled={loading}
                      title="Download report data in JSON format"
                    >
                      📄 Download Data
                    </button>
                  )}
                  <button onClick={printReport} className="btn-secondary text-sm">
                    🖨️ Print
                  </button>
                </div>
              </div>
            </div>

            {/* Fleet Compliance Report */}
            {selectedReport === 'fleet-compliance' && (reportData.summary as any) && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {(reportData.summary as any).totalPilots}
                    </div>
                    <div className="text-sm text-gray-600">Total Pilots</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {(reportData.summary as any).currentCertifications}
                    </div>
                    <div className="text-sm text-gray-600">Current</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {(reportData.summary as any).expiringCertifications}
                    </div>
                    <div className="text-sm text-gray-600">Expiring</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {(reportData.summary as any).expiredCertifications}
                    </div>
                    <div className="text-sm text-gray-600">Expired</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {(reportData.summary as any).complianceRate}%
                    </div>
                    <div className="text-sm text-gray-600">Compliance</div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card-aviation">
                    <ComplianceDonutChart
                      data={{
                        current: (reportData.summary as any).currentCertifications,
                        expiring: (reportData.summary as any).expiringCertifications,
                        expired: (reportData.summary as any).expiredCertifications,
                      }}
                    />
                  </div>

                  <div className="card-aviation">
                    <AvailabilityGauge
                      percentage={(reportData.summary as any).complianceRate}
                      label="Fleet Compliance Rate"
                    />
                  </div>
                </div>

                {(reportData as any).pilotBreakdown && (
                  <div className="card-aviation">
                    <h3 className="font-semibold text-gray-900 mb-4">Pilot Breakdown</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2">Pilot</th>
                            <th className="text-left py-2">Employee ID</th>
                            <th className="text-left py-2">Role</th>
                            <th className="text-center py-2">Current</th>
                            <th className="text-center py-2">Expiring</th>
                            <th className="text-center py-2">Expired</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(reportData as any).pilotBreakdown.map((pilot: any, index: number) => (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="py-2 font-medium">{pilot.name}</td>
                              <td className="py-2 text-gray-600">{pilot.employeeId}</td>
                              <td className="py-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    pilot.role === 'Captain'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {pilot.role}
                                </span>
                              </td>
                              <td className="py-2 text-center text-green-600 font-medium">
                                {pilot.currentChecks}
                              </td>
                              <td className="py-2 text-center text-yellow-600 font-medium">
                                {pilot.expiringChecks}
                              </td>
                              <td className="py-2 text-center text-red-600 font-medium">
                                {pilot.expiredChecks}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Risk Assessment Report */}
            {selectedReport === 'risk-assessment' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {(reportData.summary as any as any)?.totalExpired || 0}
                    </div>
                    <div className="text-sm text-gray-600">Expired Certifications</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {(reportData.summary as any as any)?.totalExpiring || 0}
                    </div>
                    <div className="text-sm text-gray-600">Expiring Soon</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div
                      className={`text-2xl font-bold ${
                        (reportData.summary as any as any)?.riskLevel === 'HIGH'
                          ? 'text-red-600'
                          : (reportData.summary as any as any)?.riskLevel === 'MEDIUM'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                      }`}
                    >
                      {(reportData.summary as any as any)?.riskLevel || 'LOW'}
                    </div>
                    <div className="text-sm text-gray-600">Risk Level</div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card-aviation">
                    <ComplianceDonutChart
                      data={{
                        current: (reportData.summary as any as any)?.totalCurrent || 0,
                        expiring: (reportData.summary as any as any)?.totalExpiring || 0,
                        expired: (reportData.summary as any as any)?.totalExpired || 0,
                      }}
                    />
                  </div>

                  <div className="card-aviation">
                    <RiskTrendChart
                      data={{
                        periods: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        expiredCounts: [
                          2,
                          1,
                          3,
                          2,
                          4,
                          (reportData.summary as any as any)?.totalExpired || 0,
                        ],
                        expiringCounts: [
                          8,
                          6,
                          9,
                          7,
                          12,
                          (reportData.summary as any as any)?.totalExpiring || 0,
                        ],
                      }}
                    />
                  </div>
                </div>

                {reportData.expiredCertifications &&
                  reportData.expiredCertifications.length > 0 && (
                    <div className="card-aviation">
                      <h3 className="font-semibold text-red-800 mb-4">
                        🚨 Expired Certifications (Immediate Action Required)
                      </h3>
                      <div className="space-y-2">
                        {reportData.expiredCertifications.slice(0, 10).map((cert, index) => (
                          <div
                            key={index}
                            className="bg-red-50 border border-red-200 rounded-lg p-3"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-red-800">
                                  {cert.pilot} ({cert.employeeId})
                                </div>
                                <div className="text-sm text-red-600">{cert.checkType}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-red-800">
                                  {cert.daysOverdue} days overdue
                                </div>
                                <div className="text-xs text-red-600">
                                  {new Date(cert.expiryDate).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {reportData.expiringCertifications &&
                  reportData.expiringCertifications.length > 0 && (
                    <div className="card-aviation">
                      <h3 className="font-semibold text-yellow-800 mb-4">
                        ⏰ Expiring Soon (Schedule Renewals)
                      </h3>
                      <div className="space-y-2">
                        {reportData.expiringCertifications.slice(0, 10).map((cert, index) => (
                          <div
                            key={index}
                            className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-yellow-800">
                                  {cert.pilot} ({cert.employeeId})
                                </div>
                                <div className="text-sm text-yellow-600">{cert.checkType}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-yellow-800">
                                  {cert.daysUntilExpiry} days remaining
                                </div>
                                <div className="text-xs text-yellow-600">
                                  {new Date(cert.expiryDate).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Pilot Summary Report */}
            {selectedReport === 'pilot-summary' && reportData.pilots && (
              <div className="card-aviation">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Pilot Summary ({reportData.pilots.length} pilots)
                </h3>
                <div className="space-y-4">
                  {reportData.pilots.slice(0, 10).map((pilot, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{pilot.name}</h4>
                          <div className="text-sm text-gray-600">
                            {pilot.employeeId} • {pilot.role} • {pilot.contractType}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            <span className="text-green-600">
                              {pilot.certificationSummary.current}
                            </span>{' '}
                            /
                            <span className="text-red-600 ml-1">
                              {pilot.certificationSummary.expired}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">Current / Expired</div>
                        </div>
                      </div>
                      {pilot.captainQualifications && pilot.captainQualifications.length > 0 && (
                        <div className="text-xs text-blue-600">
                          Qualifications: {pilot.captainQualifications.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                  {reportData.pilots.length > 10 && (
                    <div className="text-center text-gray-600 text-sm">
                      Showing first 10 pilots. Download full report for complete data.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fleet Management Report */}
            {selectedReport === 'fleet-management' && (reportData as any).rosterAnalysis && (
              <div className="space-y-6">
                {/* Roster Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {(reportData as any).rosterAnalysis.totalPilots}
                    </div>
                    <div className="text-sm text-gray-600">Total Pilots</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {(reportData as any).rosterAnalysis.captains}
                    </div>
                    <div className="text-sm text-gray-600">Captains</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {(reportData as any).rosterAnalysis.firstOfficers}
                    </div>
                    <div className="text-sm text-gray-600">First Officers</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {(reportData as any).rosterAnalysis.averageAge &&
                      !isNaN((reportData as any).rosterAnalysis.averageAge)
                        ? Math.round((reportData as any).rosterAnalysis.averageAge)
                        : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Average Age</div>
                  </div>
                </div>

                {/* Captain Qualifications */}
                {(reportData as any).captainQualifications &&
                  (reportData as any).captainQualifications.length > 0 && (
                    <div className="card-aviation">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Captain Qualifications Summary
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(reportData as any).captainQualifications
                          .slice(0, 6)
                          .map((qual: any, index: number) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="font-medium text-gray-900">
                                {qual.pilot?.first_name} {qual.pilot?.last_name}
                              </div>
                              <div className="text-sm text-gray-600">
                                Employee ID: {qual.pilot?.employee_id}
                              </div>
                              <div className="text-xs text-blue-600 mt-1">
                                {qual.qualifications?.join(', ') || 'Standard Captain'}
                              </div>
                            </div>
                          ))}
                      </div>
                      {(reportData as any).captainQualifications.length > 6 && (
                        <div className="text-center text-gray-600 text-sm mt-4">
                          Showing first 6 captains. Download full report for complete data.
                        </div>
                      )}
                    </div>
                  )}

                {/* Operational Readiness */}
                {(reportData as any).operationalReadiness && (
                  <div className="card-aviation">
                    <h3 className="font-semibold text-gray-900 mb-4">Operational Readiness</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(reportData as any).operationalReadiness.totalPilots > 0
                            ? Math.round(
                                ((reportData as any).operationalReadiness.availablePilots /
                                  (reportData as any).operationalReadiness.totalPilots) *
                                  100
                              )
                            : 0}
                          %
                        </div>
                        <div className="text-sm text-gray-600">Availability Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {(reportData as any).operationalReadiness.pilotsOnLeave || 0}
                        </div>
                        <div className="text-sm text-gray-600">On Leave</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(reportData as any).operationalReadiness.pendingLeaveRequests || 0}
                        </div>
                        <div className="text-sm text-gray-600">Pending Requests</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upcoming Retirements */}
                {(reportData as any).upcomingRetirements &&
                  (reportData as any).upcomingRetirements.length > 0 && (
                    <div className="card-aviation">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Upcoming Retirements ({(reportData as any).upcomingRetirements.length})
                      </h3>
                      <div className="space-y-2">
                        {(reportData as any).upcomingRetirements
                          .slice(0, 5)
                          .map((retirement: any, index: number) => (
                            <div
                              key={index}
                              className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-yellow-800">
                                    {retirement.pilot?.first_name} {retirement.pilot?.last_name}
                                  </div>
                                  <div className="text-sm text-yellow-600">
                                    {retirement.pilot?.employee_id} • {retirement.pilot?.role}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-yellow-800">
                                    {retirement.yearsToRetirement} years remaining
                                  </div>
                                  <div className="text-xs text-yellow-600">
                                    Retirement: {new Date(retirement.retirementDate).getFullYear()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                      {(reportData as any).upcomingRetirements.length > 5 && (
                        <div className="text-center text-gray-600 text-sm mt-4">
                          Showing first 5 upcoming retirements. Download full report for complete
                          data.
                        </div>
                      )}
                    </div>
                  )}

                {/* Recommendations */}
                {(reportData as any).recommendations &&
                  (reportData as any).recommendations.length > 0 && (
                    <div className="card-aviation">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Strategic Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {(reportData as any).recommendations.map(
                          (recommendation: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-air-niugini-gold mt-1">•</span>
                              <span className="text-gray-700">{recommendation}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            {/* Other report types would follow similar patterns */}
            {selectedReport === 'certification-forecast' && reportData.monthlyForecast && (
              <div className="card-aviation">
                <h3 className="font-semibold text-gray-900 mb-4">6-Month Certification Forecast</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(reportData.monthlyForecast).map(
                    ([month, certs]: [string, any]) => (
                      <div key={month} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          {new Date(`${month  }-01`).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </h4>
                        <div className="text-2xl font-bold text-blue-600">
                          {certs.length}
                        </div>
                        <div className="text-sm text-gray-600">certifications expiring</div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {selectedReport === 'fleet-analytics' && reportData.fleetSummary && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.fleetSummary.totalPilots}
                    </div>
                    <div className="text-sm text-gray-600">Total Pilots</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {reportData.fleetSummary.totalCaptains}
                    </div>
                    <div className="text-sm text-gray-600">Captains</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {reportData.fleetSummary.totalFirstOfficers}
                    </div>
                    <div className="text-sm text-gray-600">First Officers</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {reportData.fleetSummary.averageAge}
                    </div>
                    <div className="text-sm text-gray-600">Average Age</div>
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'operational-readiness' && reportData.availability && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {reportData.availability.availablePilots}
                    </div>
                    <div className="text-sm text-gray-600">Available</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {reportData.availability.onLeave}
                    </div>
                    <div className="text-sm text-gray-600">On Leave</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.availability.pendingLeaveRequests}
                    </div>
                    <div className="text-sm text-gray-600">Pending Requests</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(
                        (reportData.availability.availablePilots /
                          reportData.availability.totalPilots) *
                          100
                      )}
                      %
                    </div>
                    <div className="text-sm text-gray-600">Availability Rate</div>
                  </div>
                </div>
              </div>
            )}

            {/* Planning & Rostering Report */}
            {selectedReport === 'planning-rostering' && (reportData.summary as any) && (
              <div className="space-y-6">
                {/* Summary Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="card-aviation text-center">
                    <div
                      className={`text-2xl font-bold ${(reportData.summary as any).next7Days > 0 ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {(reportData.summary as any).next7Days}
                    </div>
                    <div className="text-sm text-gray-600">Next 7 Days</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div
                      className={`text-2xl font-bold ${(reportData.summary as any).next14Days > 5 ? 'text-yellow-600' : 'text-green-600'}`}
                    >
                      {(reportData.summary as any).next14Days}
                    </div>
                    <div className="text-sm text-gray-600">Next 14 Days</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {(reportData.summary as any).next28Days}
                    </div>
                    <div className="text-sm text-gray-600">Next 28 Days</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {(reportData.summary as any).next60Days}
                    </div>
                    <div className="text-sm text-gray-600">Next 60 Days</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {(reportData.summary as any).next90Days}
                    </div>
                    <div className="text-sm text-gray-600">Next 90 Days</div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card-aviation">
                    <ExpiryTimelineChart
                      data={{
                        next7Days: (reportData.summary as any).next7Days,
                        next14Days: (reportData.summary as any).next14Days,
                        next28Days: (reportData.summary as any).next28Days,
                        next60Days: (reportData.summary as any).next60Days,
                        next90Days: (reportData.summary as any).next90Days,
                      }}
                    />
                  </div>

                  {(reportData as any).timePeriods &&
                    (reportData as any).timePeriods['28 Days'] && (
                      <div className="card-aviation">
                        <CategoryBreakdownChart
                          data={(reportData as any).timePeriods['28 Days'].categoryBreakdown || []}
                        />
                      </div>
                    )}
                </div>

                {/* Pilot Requirements Analysis */}
                {(reportData as any).pilotRequirements && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="card-aviation">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Pilot Requirements Analysis
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Current Fleet</h4>
                            <div className="space-y-1 text-sm">
                              <div>
                                Captains:{' '}
                                <span className="font-medium">
                                  {(reportData as any).pilotRequirements.current.captains}
                                </span>
                              </div>
                              <div>
                                First Officers:{' '}
                                <span className="font-medium">
                                  {(reportData as any).pilotRequirements.current.firstOfficers}
                                </span>
                              </div>
                              <div>
                                Total:{' '}
                                <span className="font-medium">
                                  {(reportData as any).pilotRequirements.current.total}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Required</h4>
                            <div className="space-y-1 text-sm">
                              <div>
                                Captains:{' '}
                                <span className="font-medium">
                                  {(reportData as any).pilotRequirements.required.captains}
                                </span>
                              </div>
                              <div>
                                First Officers:{' '}
                                <span className="font-medium">
                                  {(reportData as any).pilotRequirements.required.firstOfficers}
                                </span>
                              </div>
                              <div>
                                Total:{' '}
                                <span className="font-medium">
                                  {(reportData as any).pilotRequirements.required.total}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Compliance Status</h4>
                            <div className="space-y-1 text-sm">
                              <div>
                                Captains:{' '}
                                <span
                                  className={`font-medium ${(reportData as any).pilotRequirements.compliance.captains ? 'text-green-600' : 'text-red-600'}`}
                                >
                                  {(reportData as any).pilotRequirements.compliance.captains
                                    ? '✓ Compliant'
                                    : `✗ Short by ${ 
                                      (reportData as any).pilotRequirements.shortfall.captains}`}
                                </span>
                              </div>
                              <div>
                                First Officers:{' '}
                                <span
                                  className={`font-medium ${(reportData as any).pilotRequirements.compliance.firstOfficers ? 'text-green-600' : 'text-red-600'}`}
                                >
                                  {(reportData as any).pilotRequirements.compliance.firstOfficers
                                    ? '✓ Compliant'
                                    : `✗ Short by ${ 
                                      (reportData as any).pilotRequirements.shortfall.firstOfficers}`}
                                </span>
                              </div>
                              <div>
                                Overall:{' '}
                                <span
                                  className={`font-medium ${(reportData as any).pilotRequirements.compliance.overall ? 'text-green-600' : 'text-red-600'}`}
                                >
                                  {(reportData as any).pilotRequirements.compliance.overall
                                    ? '✓ Compliant'
                                    : '✗ Non-compliant'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="card-aviation">
                        <PilotRequirementsChart
                          data={{
                            current: (reportData as any).pilotRequirements.current,
                            required: (reportData as any).pilotRequirements.required,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Operational Impact */}
                {(reportData as any).operationalImpact && (
                  <div className="card-aviation">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Operational Impact (Next 28 Days)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${(reportData as any).operationalImpact.next28Days.captainsAtRisk > 2 ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {(reportData as any).operationalImpact.next28Days.captainsAtRisk}
                        </div>
                        <div className="text-sm text-gray-600">Captains at Risk</div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${(reportData as any).operationalImpact.next28Days.firstOfficersAtRisk > 4 ? 'text-yellow-600' : 'text-green-600'}`}
                        >
                          {(reportData as any).operationalImpact.next28Days.firstOfficersAtRisk}
                        </div>
                        <div className="text-sm text-gray-600">First Officers at Risk</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(reportData as any).operationalImpact.next28Days.totalPilotsAtRisk}
                        </div>
                        <div className="text-sm text-gray-600">Total at Risk</div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${
                            (reportData as any).operationalImpact.next28Days.riskLevel === 'HIGH'
                              ? 'text-red-600'
                              : (reportData as any).operationalImpact.next28Days.riskLevel ===
                                  'MEDIUM'
                                ? 'text-yellow-600'
                                : 'text-green-600'
                          }`}
                        >
                          {(reportData as any).operationalImpact.next28Days.riskLevel}
                        </div>
                        <div className="text-sm text-gray-600">Risk Level</div>
                      </div>
                    </div>
                    {(reportData as any).operationalImpact.next28Days.recommendations.length >
                      0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                        <ul className="space-y-1 text-sm">
                          {(reportData as any).operationalImpact.next28Days.recommendations.map(
                            (rec: string, index: number) => (
                              <li key={index} className="flex items-start space-x-2">
                                <span className="text-air-niugini-gold mt-1">•</span>
                                <span>{rec}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Roster Analysis */}
                {(reportData as any).rosterAnalysis && (
                  <div className="space-y-6">
                    <div className="card-aviation">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Roster & Leave Analysis
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {(reportData as any).rosterAnalysis.leaveImpact.totalRequests}
                          </div>
                          <div className="text-sm text-gray-600">Total Requests</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {(reportData as any).rosterAnalysis.leaveImpact.approvedRequests}
                          </div>
                          <div className="text-sm text-gray-600">Approved</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {(reportData as any).rosterAnalysis.leaveImpact.pendingRequests}
                          </div>
                          <div className="text-sm text-gray-600">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {(reportData as any).rosterAnalysis.availabilityPercentage.overall}%
                          </div>
                          <div className="text-sm text-gray-600">Overall Availability</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="card-aviation">
                        <AvailabilityGauge
                          percentage={
                            (reportData as any).rosterAnalysis.availabilityPercentage.overall
                          }
                          label="Overall Availability"
                        />
                      </div>
                      <div className="card-aviation">
                        <AvailabilityGauge
                          percentage={
                            (reportData as any).rosterAnalysis.availabilityPercentage.captains
                          }
                          label="Captains Availability"
                        />
                      </div>
                      <div className="card-aviation">
                        <AvailabilityGauge
                          percentage={
                            (reportData as any).rosterAnalysis.availabilityPercentage.firstOfficers
                          }
                          label="First Officers Availability"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Initial State */}
        {!selectedReport && !loading && (
          <div className="card-aviation text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="text-white w-10 h-10" />
            </div>
            <h2 className="text-heading-large text-gray-900 mb-4">Professional Fleet Reporting</h2>
            <p className="text-body-large text-gray-600 max-w-2xl mx-auto mb-8">
              Select a report type above to generate comprehensive insights for your B767 fleet
              operations, compliance monitoring, and strategic planning.
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Real-time data</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>Export capabilities</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>Compliance tracking</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
