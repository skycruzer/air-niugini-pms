/**
 * FINAL REVIEW ALERT COMPONENT
 *
 * Displays a prominent alert 22 days before next roster period begins
 * Reminds administrators to review and finalize pending leave requests
 *
 * IMPORTANT: Review deadline applies ONLY to NEXT roster period
 * - Does NOT alert for current roster period
 * - Does NOT include following rosters beyond next roster
 * - pendingCount should be filtered to only include requests starting within NEXT roster period
 * - ONLY shows alert if there are pending requests (pendingCount > 0)
 *
 * Alert Severity Levels:
 * - URGENT (≤7 days): Red alert with immediate action required
 * - WARNING (8-22 days): Yellow alert for review window
 * - INFO (>22 days): Blue informational countdown
 */

'use client';

import { useEffect, useState } from 'react';
import { getFinalReviewAlert, type FinalReviewAlert as AlertData, formatRosterPeriod } from '@/lib/roster-utils';
import { AlertTriangle, Clock, Info } from 'lucide-react';

interface FinalReviewAlertProps {
  pendingCount: number; // Count of pending requests for NEXT roster period ONLY
  onViewRequests?: () => void; // Callback to scroll to and show pending requests
}

export function FinalReviewAlert({ pendingCount, onViewRequests }: FinalReviewAlertProps) {
  const [alert, setAlert] = useState<AlertData | null>(null);

  useEffect(() => {
    // Get initial alert data
    const alertData = getFinalReviewAlert();
    setAlert(alertData);

    // Update every hour to keep countdown fresh
    const interval = setInterval(() => {
      setAlert(getFinalReviewAlert());
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, []);

  if (!alert) return null;

  // Only show alert if there are pending requests for next roster
  // No pending requests = no alert (even if within review window)
  if (pendingCount === 0) {
    return null;
  }

  // Determine styling based on severity
  const getAlertStyles = () => {
    switch (alert.severity) {
      case 'urgent':
        return {
          container: 'bg-red-50 border-red-500',
          icon: 'text-red-600',
          title: 'text-red-900',
          text: 'text-red-800',
          badge: 'bg-red-100 text-red-900',
          IconComponent: AlertTriangle,
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-500',
          icon: 'text-yellow-600',
          title: 'text-yellow-900',
          text: 'text-yellow-800',
          badge: 'bg-yellow-100 text-yellow-900',
          IconComponent: Clock,
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-500',
          icon: 'text-blue-600',
          title: 'text-blue-900',
          text: 'text-blue-800',
          badge: 'bg-blue-100 text-blue-900',
          IconComponent: Info,
        };
    }
  };

  const styles = getAlertStyles();
  const IconComponent = styles.IconComponent;

  return (
    <div className={`border-l-4 ${styles.container} rounded-lg p-6 mb-6 shadow-md`}>
      <div className="flex items-start">
        <div className={`${styles.icon} mr-4 mt-1`}>
          <IconComponent className="w-8 h-8" />
        </div>

        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-xl font-bold ${styles.title}`}>
              {alert.severity === 'urgent' ? '🚨 ' : ''}
              Final Review Deadline
            </h3>
            {alert.isWithinReviewWindow && (
              <span className={`px-4 py-2 rounded-full font-bold text-lg ${styles.badge}`}>
                {alert.daysUntilRosterStarts} {alert.daysUntilRosterStarts === 1 ? 'DAY' : 'DAYS'} LEFT
              </span>
            )}
          </div>

          {/* Message */}
          <p className={`text-base mb-4 ${styles.text} font-medium`}>
            {alert.message}
          </p>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white rounded-lg p-4 shadow-sm">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Roster</p>
              <p className="font-bold text-gray-900">{alert.currentRoster.code}</p>
              <p className="text-xs text-gray-500">
                Ends {alert.currentRoster.endDate.toLocaleDateString('en-AU')}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Next Roster</p>
              <p className="font-bold text-gray-900">{alert.nextRoster.code}</p>
              <p className="text-xs text-gray-500">
                Starts {alert.nextRoster.startDate.toLocaleDateString('en-AU')}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Requests (Next Roster)</p>
              <p className={`font-bold text-2xl ${pendingCount > 0 ? 'text-[#E4002B]' : 'text-green-600'}`}>
                {pendingCount}
              </p>
              <p className="text-xs text-gray-500">
                {pendingCount === 0 ? 'All reviewed ✓' : `For ${alert.nextRoster.code}`}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Review Deadline</p>
              <p className="font-bold text-gray-900">
                {alert.reviewDeadlineDate.toLocaleDateString('en-AU')}
              </p>
              <p className="text-xs text-gray-500">
                (22 days before {alert.nextRoster.code})
              </p>
            </div>
          </div>

          {/* Action Required (only if pending requests) */}
          {pendingCount > 0 && alert.isWithinReviewWindow && (
            <div className={`mt-4 p-4 rounded-lg ${alert.severity === 'urgent' ? 'bg-red-100 border-2 border-red-300' : 'bg-yellow-100 border-2 border-yellow-300'}`}>
              <div className="flex items-start justify-between mb-3">
                <p className={`font-bold ${alert.severity === 'urgent' ? 'text-red-900' : 'text-yellow-900'}`}>
                  ⚠️ ACTION REQUIRED:
                </p>
                {onViewRequests && (
                  <button
                    onClick={onViewRequests}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm ${
                      alert.severity === 'urgent'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    }`}
                  >
                    📋 View Pending Requests
                  </button>
                )}
              </div>
              <ul className={`list-disc list-inside space-y-1 text-sm ${alert.severity === 'urgent' ? 'text-red-800' : 'text-yellow-800'}`}>
                <li>Review all {pendingCount} pending leave request(s) for {alert.nextRoster.code}</li>
                <li>Check crew availability and seniority priorities</li>
                <li>Approve or deny requests before {alert.nextRoster.code} begins</li>
                <li>Ensure minimum 10 Captains and 10 First Officers maintained</li>
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
