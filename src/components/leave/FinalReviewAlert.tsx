/**
 * FINAL REVIEW ALERT COMPONENT (shadcn/ui Upgraded)
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
 *
 * Upgraded with shadcn/ui Alert component for:
 * - WCAG 2.1 AA compliance (proper ARIA roles)
 * - Consistent Air Niugini branding
 * - Better accessibility (screen reader support)
 */

'use client';

import { useEffect, useState } from 'react';
import { getFinalReviewAlert, type FinalReviewAlert as AlertData } from '@/lib/roster-utils';
import { AlertTriangle, Clock, Info, AlertOctagon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
    const interval = setInterval(
      () => {
        setAlert(getFinalReviewAlert());
      },
      60 * 60 * 1000
    ); // 1 hour

    return () => clearInterval(interval);
  }, []);

  if (!alert) return null;

  // Only show alert if there are pending requests for next roster
  // No pending requests = no alert (even if within review window)
  if (pendingCount === 0) {
    return null;
  }

  // Determine styling and icon based on severity
  const getAlertConfig = () => {
    switch (alert.severity) {
      case 'urgent':
        return {
          variant: 'destructive' as const,
          className: 'border-[#E4002B] bg-red-50',
          icon: AlertOctagon,
          iconClassName: 'h-5 w-5 text-[#E4002B]',
          titleClassName: 'text-[#E4002B] font-bold',
          descriptionClassName: 'text-[#000000]',
          badgeClassName: 'bg-[#E4002B] text-white',
          actionClassName: 'bg-[#E4002B] hover:bg-[#C00020] text-white',
          detailsClassName: 'bg-red-100 border-2 border-red-300',
        };
      case 'warning':
        return {
          variant: 'default' as const,
          className: 'border-[#FFC72C] bg-yellow-50',
          icon: AlertTriangle,
          iconClassName: 'h-5 w-5 text-[#FFC72C]',
          titleClassName: 'text-[#000000] font-semibold',
          descriptionClassName: 'text-[#000000]/80',
          badgeClassName: 'bg-[#FFC72C] text-[#000000]',
          actionClassName: 'bg-[#FFC72C] hover:bg-[#F5A623] text-[#000000]',
          detailsClassName: 'bg-yellow-100 border-2 border-yellow-300',
        };
      default:
        return {
          variant: 'default' as const,
          className: 'border-[#E4002B]/30 bg-white',
          icon: Info,
          iconClassName: 'h-5 w-5 text-[#E4002B]',
          titleClassName: 'text-[#000000] font-medium',
          descriptionClassName: 'text-[#000000]/70',
          badgeClassName: 'bg-[#E4002B]/10 text-[#E4002B]',
          actionClassName: 'bg-[#E4002B] hover:bg-[#C00020] text-white',
          detailsClassName: 'bg-blue-100 border-2 border-blue-300',
        };
    }
  };

  const config = getAlertConfig();
  const IconComponent = config.icon;

  return (
    <Alert variant={config.variant} className={`${config.className} mb-6 shadow-md`}>
      <div className="flex items-start">
        <IconComponent className={config.iconClassName} />

        <div className="flex-1 ml-4">
          {/* Header with countdown badge */}
          <div className="flex items-center justify-between mb-2">
            <AlertTitle className={config.titleClassName}>
              {alert.severity === 'urgent' ? '🚨 ' : ''}
              Final Review Deadline
            </AlertTitle>
            {alert.isWithinReviewWindow && (
              <span className={`px-4 py-2 rounded-full font-bold text-sm ${config.badgeClassName}`}>
                {alert.daysUntilRosterStarts} {alert.daysUntilRosterStarts === 1 ? 'DAY' : 'DAYS'}{' '}
                LEFT
              </span>
            )}
          </div>

          {/* Message */}
          <AlertDescription className={`mb-4 ${config.descriptionClassName}`}>
            <p className="font-medium">{alert.message}</p>
          </AlertDescription>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
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
              <p
                className={`font-bold text-2xl ${pendingCount > 0 ? 'text-[#E4002B]' : 'text-green-600'}`}
              >
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
              <p className="text-xs text-gray-500">(22 days before {alert.nextRoster.code})</p>
            </div>
          </div>

          {/* Action Required (only if pending requests within review window) */}
          {pendingCount > 0 && alert.isWithinReviewWindow && (
            <div className={`mt-4 p-4 rounded-lg ${config.detailsClassName}`}>
              <div className="flex items-start justify-between mb-3">
                <p className="font-bold text-[#000000]">⚠️ ACTION REQUIRED:</p>
                {onViewRequests && (
                  <button
                    onClick={onViewRequests}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm ${config.actionClassName}`}
                    aria-label="View pending leave requests"
                  >
                    📋 View Pending Requests
                  </button>
                )}
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-[#000000]/80">
                <li>
                  Review all {pendingCount} pending leave request(s) for {alert.nextRoster.code}
                </li>
                <li>Check crew availability and seniority priorities</li>
                <li>Approve or deny requests before {alert.nextRoster.code} begins</li>
                <li>Ensure minimum 10 Captains and 10 First Officers maintained</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}
