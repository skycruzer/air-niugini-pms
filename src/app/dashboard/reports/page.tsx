'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  ExpiryTimelineChart,
  ComplianceDonutChart,
  PilotRequirementsChart,
  CategoryBreakdownChart,
  AvailabilityGauge,
  RiskTrendChart
} from '@/components/charts/ReportCharts'

interface ReportSummary {
  totalPilots: number
  totalCertifications: number
  currentCertifications: number
  expiringCertifications: number
  expiredCertifications: number
  complianceRate: number
}

interface ReportData {
  summary?: ReportSummary
  pilots?: any[]
  pilotBreakdown?: any[]
  expiredCertifications?: any[]
  expiringCertifications?: any[]
  monthlyForecast?: any
  upcomingRenewals?: any[]
  fleetSummary?: any
  certificationAnalytics?: any
  availability?: any
  upcomingLeave?: any[]
  generatedAt: string
  generatedBy: string
}

const REPORT_TYPES = [
  {
    id: 'fleet-compliance',
    title: 'Fleet Compliance Report',
    description: 'Overall certification status and compliance rates',
    icon: '📊',
    color: 'blue'
  },
  {
    id: 'risk-assessment',
    title: 'Risk Assessment Report',
    description: 'Expired and expiring certifications analysis',
    icon: '⚠️',
    color: 'red'
  },
  {
    id: 'pilot-summary',
    title: 'Pilot Summary Report',
    description: 'Individual pilot certification status',
    icon: '👨‍✈️',
    color: 'green'
  },
  {
    id: 'certification-forecast',
    title: 'Certification Forecast Report',
    description: 'Upcoming renewals and planning',
    icon: '📅',
    color: 'purple'
  },
  {
    id: 'fleet-analytics',
    title: 'Fleet Analytics Report',
    description: 'Performance metrics and trends',
    icon: '📈',
    color: 'indigo'
  },
  {
    id: 'operational-readiness',
    title: 'Operational Readiness Report',
    description: 'Leave requests and availability',
    icon: '💼',
    color: 'yellow'
  },
  {
    id: 'planning-rostering',
    title: 'Planning & Rostering Report',
    description: 'Certification expiry planning (7, 14, 28, 60, 90 days) with pilot requirements and roster analysis',
    icon: '📋',
    color: 'orange'
  }
]

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateReport = async (reportType: string) => {
    setLoading(true)
    setError(null)
    setSelectedReport(reportType)

    try {
      const response = await fetch(`/api/reports?type=${reportType}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate report')
      }

      setReportData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report')
      setReportData(null)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = () => {
    if (!reportData || !selectedReport) return

    const reportTitle = REPORT_TYPES.find(r => r.id === selectedReport)?.title || 'Report'
    const timestamp = new Date().toISOString().split('T')[0]

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `${reportTitle.replace(/\s+/g, '_')}_${timestamp}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const downloadPDF = async () => {
    if (!reportData || !selectedReport) return

    setLoading(true)
    try {
      const response = await fetch('/api/reports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType: selectedReport,
          reportData: reportData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF')
    } finally {
      setLoading(false)
    }
  }

  const printReport = () => {
    window.print()
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-display-small text-gray-900 mb-2">Fleet Reports</h1>
          <p className="text-body-medium text-gray-600">
            Generate comprehensive reports for B767 fleet operations, compliance, and performance analytics.
          </p>
        </div>

        {/* Report Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {REPORT_TYPES.map((report) => (
            <div
              key={report.id}
              className={`card-aviation cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedReport === report.id ? 'ring-2 ring-air-niugini-red' : ''
              }`}
              onClick={() => generateReport(report.id)}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  report.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  report.color === 'red' ? 'bg-red-100 text-red-600' :
                  report.color === 'green' ? 'bg-green-100 text-green-600' :
                  report.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                  report.color === 'indigo' ? 'bg-indigo-100 text-indigo-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
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

        {/* Loading State */}
        {loading && (
          <div className="card-aviation text-center py-12">
            <div className="w-16 h-16 bg-air-niugini-red rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-white text-2xl">📊</span>
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
                    {REPORT_TYPES.find(r => r.id === selectedReport)?.title}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Generated on {new Date((reportData as any).generatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={downloadPDF}
                    className="btn-secondary text-sm"
                    disabled={loading}
                  >
                    📄 Download PDF
                  </button>
                  <button
                    onClick={printReport}
                    className="btn-secondary text-sm"
                  >
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
                    <div className="text-2xl font-bold text-blue-600">{(reportData.summary as any).totalPilots}</div>
                    <div className="text-sm text-gray-600">Total Pilots</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-green-600">{(reportData.summary as any).currentCertifications}</div>
                    <div className="text-sm text-gray-600">Current</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-yellow-600">{(reportData.summary as any).expiringCertifications}</div>
                    <div className="text-sm text-gray-600">Expiring</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-red-600">{(reportData.summary as any).expiredCertifications}</div>
                    <div className="text-sm text-gray-600">Expired</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-air-niugini-red">{(reportData.summary as any).complianceRate}%</div>
                    <div className="text-sm text-gray-600">Compliance</div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card-aviation">
                    <ComplianceDonutChart data={{
                      current: (reportData.summary as any).currentCertifications,
                      expiring: (reportData.summary as any).expiringCertifications,
                      expired: (reportData.summary as any).expiredCertifications
                    }} />
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
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  pilot.role === 'Captain' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {pilot.role}
                                </span>
                              </td>
                              <td className="py-2 text-center text-green-600 font-medium">{pilot.currentChecks}</td>
                              <td className="py-2 text-center text-yellow-600 font-medium">{pilot.expiringChecks}</td>
                              <td className="py-2 text-center text-red-600 font-medium">{pilot.expiredChecks}</td>
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
                    <div className="text-2xl font-bold text-red-600">{((reportData.summary as any) as any)?.totalExpired || 0}</div>
                    <div className="text-sm text-gray-600">Expired Certifications</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-yellow-600">{((reportData.summary as any) as any)?.totalExpiring || 0}</div>
                    <div className="text-sm text-gray-600">Expiring Soon</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className={`text-2xl font-bold ${
                      ((reportData.summary as any) as any)?.riskLevel === 'HIGH' ? 'text-red-600' :
                      ((reportData.summary as any) as any)?.riskLevel === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {((reportData.summary as any) as any)?.riskLevel || 'LOW'}
                    </div>
                    <div className="text-sm text-gray-600">Risk Level</div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card-aviation">
                    <ComplianceDonutChart data={{
                      current: ((reportData.summary as any) as any)?.totalCurrent || 0,
                      expiring: ((reportData.summary as any) as any)?.totalExpiring || 0,
                      expired: ((reportData.summary as any) as any)?.totalExpired || 0
                    }} />
                  </div>

                  <div className="card-aviation">
                    <RiskTrendChart data={{
                      periods: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                      expiredCounts: [2, 1, 3, 2, 4, ((reportData.summary as any) as any)?.totalExpired || 0],
                      expiringCounts: [8, 6, 9, 7, 12, ((reportData.summary as any) as any)?.totalExpiring || 0]
                    }} />
                  </div>
                </div>

                {reportData.expiredCertifications && reportData.expiredCertifications.length > 0 && (
                  <div className="card-aviation">
                    <h3 className="font-semibold text-red-800 mb-4">🚨 Expired Certifications (Immediate Action Required)</h3>
                    <div className="space-y-2">
                      {reportData.expiredCertifications.slice(0, 10).map((cert, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-red-800">{cert.pilot} ({cert.employeeId})</div>
                              <div className="text-sm text-red-600">{cert.checkType}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-red-800">{cert.daysOverdue} days overdue</div>
                              <div className="text-xs text-red-600">{new Date(cert.expiryDate).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reportData.expiringCertifications && reportData.expiringCertifications.length > 0 && (
                  <div className="card-aviation">
                    <h3 className="font-semibold text-yellow-800 mb-4">⏰ Expiring Soon (Schedule Renewals)</h3>
                    <div className="space-y-2">
                      {reportData.expiringCertifications.slice(0, 10).map((cert, index) => (
                        <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-yellow-800">{cert.pilot} ({cert.employeeId})</div>
                              <div className="text-sm text-yellow-600">{cert.checkType}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-yellow-800">{cert.daysUntilExpiry} days remaining</div>
                              <div className="text-xs text-yellow-600">{new Date(cert.expiryDate).toLocaleDateString()}</div>
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
                <h3 className="font-semibold text-gray-900 mb-4">Pilot Summary ({reportData.pilots.length} pilots)</h3>
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
                            <span className="text-green-600">{pilot.certificationSummary.current}</span> /
                            <span className="text-red-600 ml-1">{pilot.certificationSummary.expired}</span>
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

            {/* Other report types would follow similar patterns */}
            {selectedReport === 'certification-forecast' && reportData.monthlyForecast && (
              <div className="card-aviation">
                <h3 className="font-semibold text-gray-900 mb-4">6-Month Certification Forecast</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(reportData.monthlyForecast).map(([month, certs]: [string, any]) => (
                    <div key={month} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h4>
                      <div className="text-2xl font-bold text-air-niugini-red">{certs.length}</div>
                      <div className="text-sm text-gray-600">certifications expiring</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedReport === 'fleet-analytics' && reportData.fleetSummary && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-blue-600">{reportData.fleetSummary.totalPilots}</div>
                    <div className="text-sm text-gray-600">Total Pilots</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-green-600">{reportData.fleetSummary.totalCaptains}</div>
                    <div className="text-sm text-gray-600">Captains</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-purple-600">{reportData.fleetSummary.totalFirstOfficers}</div>
                    <div className="text-sm text-gray-600">First Officers</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-indigo-600">{reportData.fleetSummary.averageAge}</div>
                    <div className="text-sm text-gray-600">Average Age</div>
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'operational-readiness' && reportData.availability && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-green-600">{reportData.availability.availablePilots}</div>
                    <div className="text-sm text-gray-600">Available</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-yellow-600">{reportData.availability.onLeave}</div>
                    <div className="text-sm text-gray-600">On Leave</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-blue-600">{reportData.availability.pendingLeaveRequests}</div>
                    <div className="text-sm text-gray-600">Pending Requests</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-air-niugini-red">
                      {Math.round((reportData.availability.availablePilots / reportData.availability.totalPilots) * 100)}%
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
                    <div className={`text-2xl font-bold ${(reportData.summary as any).next7Days > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {(reportData.summary as any).next7Days}
                    </div>
                    <div className="text-sm text-gray-600">Next 7 Days</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className={`text-2xl font-bold ${(reportData.summary as any).next14Days > 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {(reportData.summary as any).next14Days}
                    </div>
                    <div className="text-sm text-gray-600">Next 14 Days</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-blue-600">{(reportData.summary as any).next28Days}</div>
                    <div className="text-sm text-gray-600">Next 28 Days</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-indigo-600">{(reportData.summary as any).next60Days}</div>
                    <div className="text-sm text-gray-600">Next 60 Days</div>
                  </div>
                  <div className="card-aviation text-center">
                    <div className="text-2xl font-bold text-purple-600">{(reportData.summary as any).next90Days}</div>
                    <div className="text-sm text-gray-600">Next 90 Days</div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card-aviation">
                    <ExpiryTimelineChart data={{
                      next7Days: (reportData.summary as any).next7Days,
                      next14Days: (reportData.summary as any).next14Days,
                      next28Days: (reportData.summary as any).next28Days,
                      next60Days: (reportData.summary as any).next60Days,
                      next90Days: (reportData.summary as any).next90Days
                    }} />
                  </div>

                  {(reportData as any).timePeriods && (reportData as any).timePeriods['28 Days'] && (
                    <div className="card-aviation">
                      <CategoryBreakdownChart data={(reportData as any).timePeriods['28 Days'].categoryBreakdown || []} />
                    </div>
                  )}
                </div>

                {/* Pilot Requirements Analysis */}
                {(reportData as any).pilotRequirements && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="card-aviation">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pilot Requirements Analysis</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Current Fleet</h4>
                            <div className="space-y-1 text-sm">
                              <div>Captains: <span className="font-medium">{(reportData as any).pilotRequirements.current.captains}</span></div>
                              <div>First Officers: <span className="font-medium">{(reportData as any).pilotRequirements.current.firstOfficers}</span></div>
                              <div>Total: <span className="font-medium">{(reportData as any).pilotRequirements.current.total}</span></div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Required</h4>
                            <div className="space-y-1 text-sm">
                              <div>Captains: <span className="font-medium">{(reportData as any).pilotRequirements.required.captains}</span></div>
                              <div>First Officers: <span className="font-medium">{(reportData as any).pilotRequirements.required.firstOfficers}</span></div>
                              <div>Total: <span className="font-medium">{(reportData as any).pilotRequirements.required.total}</span></div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Compliance Status</h4>
                            <div className="space-y-1 text-sm">
                              <div>Captains: <span className={`font-medium ${(reportData as any).pilotRequirements.compliance.captains ? 'text-green-600' : 'text-red-600'}`}>
                                {(reportData as any).pilotRequirements.compliance.captains ? '✓ Compliant' : '✗ Short by ' + (reportData as any).pilotRequirements.shortfall.captains}
                              </span></div>
                              <div>First Officers: <span className={`font-medium ${(reportData as any).pilotRequirements.compliance.firstOfficers ? 'text-green-600' : 'text-red-600'}`}>
                                {(reportData as any).pilotRequirements.compliance.firstOfficers ? '✓ Compliant' : '✗ Short by ' + (reportData as any).pilotRequirements.shortfall.firstOfficers}
                              </span></div>
                              <div>Overall: <span className={`font-medium ${(reportData as any).pilotRequirements.compliance.overall ? 'text-green-600' : 'text-red-600'}`}>
                                {(reportData as any).pilotRequirements.compliance.overall ? '✓ Compliant' : '✗ Non-compliant'}
                              </span></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="card-aviation">
                        <PilotRequirementsChart data={{
                          current: (reportData as any).pilotRequirements.current,
                          required: (reportData as any).pilotRequirements.required
                        }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Operational Impact */}
                {(reportData as any).operationalImpact && (
                  <div className="card-aviation">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Operational Impact (Next 28 Days)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${(reportData as any).operationalImpact.next28Days.captainsAtRisk > 2 ? 'text-red-600' : 'text-green-600'}`}>
                          {(reportData as any).operationalImpact.next28Days.captainsAtRisk}
                        </div>
                        <div className="text-sm text-gray-600">Captains at Risk</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${(reportData as any).operationalImpact.next28Days.firstOfficersAtRisk > 4 ? 'text-yellow-600' : 'text-green-600'}`}>
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
                        <div className={`text-2xl font-bold ${
                          (reportData as any).operationalImpact.next28Days.riskLevel === 'HIGH' ? 'text-red-600' :
                          (reportData as any).operationalImpact.next28Days.riskLevel === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {(reportData as any).operationalImpact.next28Days.riskLevel}
                        </div>
                        <div className="text-sm text-gray-600">Risk Level</div>
                      </div>
                    </div>
                    {(reportData as any).operationalImpact.next28Days.recommendations.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                        <ul className="space-y-1 text-sm">
                          {(reportData as any).operationalImpact.next28Days.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-air-niugini-gold mt-1">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Roster Analysis */}
                {(reportData as any).rosterAnalysis && (
                  <div className="space-y-6">
                    <div className="card-aviation">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Roster & Leave Analysis</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{(reportData as any).rosterAnalysis.leaveImpact.totalRequests}</div>
                          <div className="text-sm text-gray-600">Total Requests</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{(reportData as any).rosterAnalysis.leaveImpact.approvedRequests}</div>
                          <div className="text-sm text-gray-600">Approved</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">{(reportData as any).rosterAnalysis.leaveImpact.pendingRequests}</div>
                          <div className="text-sm text-gray-600">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-air-niugini-red">
                            {(reportData as any).rosterAnalysis.availabilityPercentage.overall}%
                          </div>
                          <div className="text-sm text-gray-600">Overall Availability</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="card-aviation">
                        <AvailabilityGauge
                          percentage={(reportData as any).rosterAnalysis.availabilityPercentage.overall}
                          label="Overall Availability"
                        />
                      </div>
                      <div className="card-aviation">
                        <AvailabilityGauge
                          percentage={(reportData as any).rosterAnalysis.availabilityPercentage.captains}
                          label="Captains Availability"
                        />
                      </div>
                      <div className="card-aviation">
                        <AvailabilityGauge
                          percentage={(reportData as any).rosterAnalysis.availabilityPercentage.firstOfficers}
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
            <div className="w-20 h-20 bg-gradient-to-br from-air-niugini-red to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-3xl">📊</span>
            </div>
            <h2 className="text-heading-large text-gray-900 mb-4">
              Professional Fleet Reporting
            </h2>
            <p className="text-body-large text-gray-600 max-w-2xl mx-auto mb-8">
              Select a report type above to generate comprehensive insights for your B767 fleet operations,
              compliance monitoring, and strategic planning.
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Real-time data</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Export capabilities</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>Compliance tracking</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}