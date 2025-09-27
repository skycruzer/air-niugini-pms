'use client'

import { useState, useEffect } from 'react'
import { ModalSheet } from '@/components/ui/ModalSheet'
import { formatRetirementDate, getRetirementStatusColor, type PilotWithRetirement } from '@/lib/retirement-utils'
import { Printer, Download, Eye, Calendar, User, Clock } from 'lucide-react'

interface RetirementReportModalProps {
  isOpen: boolean
  onClose: () => void
}

interface RetirementData {
  nearingRetirement: number
  dueSoon: number
  overdue: number
  pilots: PilotWithRetirement[]
}

export function RetirementReportModal({ isOpen, onClose }: RetirementReportModalProps) {
  const [data, setData] = useState<RetirementData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchRetirementData()
    }
  }, [isOpen])

  const fetchRetirementData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/retirement')
      if (!response.ok) {
        throw new Error('Failed to fetch retirement data')
      }

      const result = await response.json()
      setData(result.data)
    } catch (error) {
      console.error('Error fetching retirement data:', error)
      setError('Failed to load retirement data')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = () => {
    // For now, use browser print to PDF functionality
    // In the future, this could be enhanced with a dedicated PDF library
    window.print()
  }

  const sortedPilots = data?.pilots?.sort((a, b) => {
    const aYears = a.retirement?.yearsToRetirement ?? Infinity
    const bYears = b.retirement?.yearsToRetirement ?? Infinity
    return aYears - bYears
  }) || []

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose} title="Retirement Planning Report" size="xl">
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Pilot Retirement Report</h2>
            <p className="text-gray-600 mt-1">
              Generated on {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-[#E4002B] hover:bg-[#C00020] text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4002B]"></div>
            <span className="ml-3 text-gray-600">Loading retirement data...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="ml-3 text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Report Content */}
        {!isLoading && !error && data && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-2xl font-bold text-yellow-900">{data.nearingRetirement}</p>
                    <p className="text-yellow-700">Nearing Retirement</p>
                    <p className="text-sm text-yellow-600">Within 5 years</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-2xl font-bold text-orange-900">{data.dueSoon}</p>
                    <p className="text-orange-700">Due Soon</p>
                    <p className="text-sm text-orange-600">Within 1 year</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <User className="w-6 h-6 text-red-600" />
                  <div className="ml-3">
                    <p className="text-2xl font-bold text-red-900">{data.overdue}</p>
                    <p className="text-red-700">Overdue</p>
                    <p className="text-sm text-red-600">Past retirement</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pilots List */}
            {sortedPilots.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Pilots Nearing Retirement</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Sorted by retirement date (closest first)
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pilot
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Retirement Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time Remaining
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedPilots.map((pilot) => {
                        const statusColor = pilot.retirement ? getRetirementStatusColor(pilot.retirement.retirementStatus) : null

                        return (
                          <tr key={pilot.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {pilot.first_name} {pilot.last_name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {pilot.retirement ? formatRetirementDate(pilot.retirement.retirementDate) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {pilot.retirement?.displayText || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {statusColor && (
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor.badgeClass}`}>
                                  {pilot.retirement?.retirementStatus.replace('_', ' ').toUpperCase()}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No pilots currently nearing retirement</p>
                <p className="text-sm text-gray-500 mt-1">All pilots have more than 5 years until retirement</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 pt-6">
              <div className="text-sm text-gray-500 space-y-2">
                <p><strong>Note:</strong> This report includes pilots within 5 years of retirement age (65).</p>
                <p><strong>Succession Planning:</strong> Consider training and development plans for pilots nearing retirement.</p>
                <p><strong>Generated by:</strong> Air Niugini B767 Pilot Management System</p>
              </div>
            </div>
          </>
        )}
      </div>
    </ModalSheet>
  )
}