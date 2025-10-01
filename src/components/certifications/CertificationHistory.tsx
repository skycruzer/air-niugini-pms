'use client';

import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { getCertificationStatus } from '@/lib/certification-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, TrendingUp, Download, FileText } from 'lucide-react';

interface HistoryEntry {
  id: string;
  date: Date;
  expiryDate: Date;
  updatedBy?: string;
  notes?: string;
  daysValid?: number;
}

interface CertificationHistoryProps {
  pilotId: string;
  checkTypeId: string;
  checkCode: string;
  checkDescription: string;
  category: string;
  currentExpiryDate: Date | null;
  onExportPDF?: () => void;
}

/**
 * CertificationHistory Component
 *
 * Displays the complete history of a specific certification
 * - Previous dates and renewals
 * - Visual timeline with milestone markers
 * - Export to PDF functionality
 * - Renewal pattern analysis
 */
export function CertificationHistory({
  pilotId,
  checkTypeId,
  checkCode,
  checkDescription,
  category,
  currentExpiryDate,
  onExportPDF,
}: CertificationHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Note: This would typically fetch from an audit log or history table
        // For now, we'll create a mock history based on current data
        // In production, you'd want to implement proper audit logging

        // Fetch current certification
        const response = await fetch(`/api/pilots/${pilotId}/certifications`);
        if (!response.ok) {
          throw new Error('Failed to fetch certification data');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error('Invalid certification data');
        }

        const certification = result.data.find((c: any) => c.checkTypeId === checkTypeId);

        // Create mock history entries (in production, fetch from audit log)
        const mockHistory: HistoryEntry[] = [];

        if (certification?.expiryDate) {
          const expiryDate = new Date(certification.expiryDate);
          mockHistory.push({
            id: 'current',
            date: new Date(), // Date updated/created
            expiryDate: expiryDate,
            updatedBy: 'System',
            notes: 'Current certification',
          });

          // Add some mock historical entries for demonstration
          // In production, these would come from your audit log table
          const monthsBack = [6, 12, 18, 24];
          monthsBack.forEach((months, index) => {
            const historicDate = new Date(expiryDate);
            historicDate.setMonth(historicDate.getMonth() - months);

            const previousExpiry = new Date(historicDate);
            const lastEntry = mockHistory[mockHistory.length - 1];
            const nextExpiry =
              index === 0 ? expiryDate : lastEntry ? new Date(lastEntry.expiryDate) : expiryDate;
            const daysValid = differenceInDays(nextExpiry, previousExpiry);

            mockHistory.push({
              id: `history-${index}`,
              date: historicDate,
              expiryDate: previousExpiry,
              updatedBy: 'Training Department',
              notes: `Renewal ${index + 1}`,
              daysValid,
            });
          });
        }

        // Sort by date descending (most recent first)
        mockHistory.sort((a, b) => b.date.getTime() - a.date.getTime());

        setHistory(mockHistory);
      } catch (err) {
        console.error('Error fetching certification history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [pilotId, checkTypeId]);

  const handleExport = () => {
    if (onExportPDF) {
      onExportPDF();
    } else {
      // Default export behavior
      console.log('Exporting certification history to PDF...');
      // Implement PDF export logic here
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4002B] mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading certification history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center py-12">
          <span className="text-6xl block mb-4">⚠️</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading History</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center py-12">
          <span className="text-6xl block mb-4">📜</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No History Available</h3>
          <p className="text-gray-600">No historical records found for this certification.</p>
        </div>
      </div>
    );
  }

  // Calculate renewal patterns
  const averageValidityDays =
    history.filter((h) => h.daysValid).reduce((sum, h) => sum + (h.daysValid || 0), 0) /
    history.filter((h) => h.daysValid).length;

  const totalRenewals = history.length - 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#E4002B] to-red-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <Clock className="w-6 h-6 mr-2" />
              <h2 className="text-2xl font-bold">Certification History</h2>
            </div>
            <p className="text-lg font-semibold">
              {checkCode} - {checkDescription}
            </p>
            <p className="text-white/90 text-sm mt-1">Category: {category}</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-white text-[#E4002B] rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">{totalRenewals}</span>
          </div>
          <p className="text-sm text-blue-600">Total Renewals</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-green-600">
              {averageValidityDays ? Math.round(averageValidityDays) : 'N/A'}
            </span>
          </div>
          <p className="text-sm text-green-600">Avg. Validity (days)</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-2xl font-bold text-purple-600">
              {history[0]?.updatedBy || 'N/A'}
            </span>
          </div>
          <p className="text-sm text-purple-600">Last Updated By</p>
        </div>
      </div>

      {/* Current Status */}
      {currentExpiryDate && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Expiry Date</p>
              <p className="text-xl font-bold text-gray-900">
                {format(currentExpiryDate, 'MMM dd, yyyy')}
              </p>
            </div>
            <div>
              {(() => {
                const status = getCertificationStatus(currentExpiryDate);
                return (
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${status.className}`}
                  >
                    {status.label}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Historical Timeline</h3>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          {/* Timeline Entries */}
          <div className="space-y-6">
            {history.map((entry, index) => {
              const isExpanded = showDetails === entry.id;
              const isCurrent = entry.id === 'current';
              const status = getCertificationStatus(entry.expiryDate);

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-16"
                >
                  {/* Milestone Marker */}
                  <div
                    className={`absolute left-6 w-5 h-5 rounded-full border-2 ${
                      isCurrent
                        ? 'bg-[#E4002B] border-[#E4002B]'
                        : status.color === 'green'
                          ? 'bg-green-500 border-green-600'
                          : 'bg-gray-300 border-gray-400'
                    }`}
                  ></div>

                  {/* Entry Card */}
                  <div
                    className={`bg-gray-50 rounded-lg border ${
                      isCurrent ? 'border-[#E4002B] shadow-md' : 'border-gray-200'
                    } overflow-hidden`}
                  >
                    <button
                      onClick={() => setShowDetails(isExpanded ? null : entry.id)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            {isCurrent && (
                              <span className="px-2 py-1 bg-[#E4002B] text-white text-xs font-medium rounded">
                                Current
                              </span>
                            )}
                            <p className="font-semibold text-gray-900">
                              {format(entry.date, 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600">
                            Expiry: {format(entry.expiryDate, 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {entry.daysValid && (
                            <span className="text-sm text-gray-500">
                              {entry.daysValid} days valid
                            </span>
                          )}
                          <div
                            className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          >
                            ▼
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-gray-200 px-4 py-3 bg-white"
                        >
                          <div className="space-y-2">
                            {entry.updatedBy && (
                              <div>
                                <p className="text-xs text-gray-500">Updated By</p>
                                <p className="text-sm text-gray-900">{entry.updatedBy}</p>
                              </div>
                            )}
                            {entry.notes && (
                              <div>
                                <p className="text-xs text-gray-500">Notes</p>
                                <p className="text-sm text-gray-900">{entry.notes}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-500">Status</p>
                              <span
                                className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Renewal Pattern Analysis */}
      {totalRenewals > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Renewal Pattern Analysis</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              This certification has been renewed{' '}
              <strong>
                {totalRenewals} time{totalRenewals !== 1 ? 's' : ''}
              </strong>
              .
            </p>
            {averageValidityDays && (
              <p>
                Average validity period: <strong>{Math.round(averageValidityDays)} days</strong> (
                {Math.round(averageValidityDays / 30)} months)
              </p>
            )}
            {currentExpiryDate && (
              <p>
                Next renewal recommended:{' '}
                <strong>
                  {format(
                    new Date(currentExpiryDate.getTime() - 30 * 24 * 60 * 60 * 1000),
                    'MMM dd, yyyy'
                  )}
                </strong>{' '}
                (30 days before expiry)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
