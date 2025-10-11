/**
 * LEAVE ELIGIBILITY ALERT COMPONENT (shadcn/ui Upgraded)
 *
 * Displays seniority-based priority review when multiple pilots of THE SAME RANK request same dates.
 * Always shows all conflicting requests sorted by seniority, regardless of crew availability.
 *
 * Upgraded with shadcn/ui Alert component for:
 * - WCAG 2.1 AA compliance (proper ARIA roles, screen reader support)
 * - Consistent Air Niugini branding (#4F46E5 red, #06B6D4 gold)
 * - Better accessibility and visual hierarchy
 *
 * Business Logic (Updated 2025-10-04):
 * - Captains vs First Officers evaluated separately
 * - Each rank maintains minimum 10 pilots
 * - Seniority priority: Lower number = Higher priority
 * - Tiebreaker: Earlier submission date
 */

'use client';

import { useState } from 'react';
import type { LeaveEligibilityCheck } from '@/lib/leave-eligibility-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface LeaveEligibilityAlertProps {
  eligibility: LeaveEligibilityCheck | null;
  isLoading?: boolean;
  pilotName?: string;
}

export function LeaveEligibilityAlert({
  eligibility,
  isLoading,
  pilotName,
}: LeaveEligibilityAlertProps) {
  const [showConflictingRequests, setShowConflictingRequests] = useState(true);

  if (isLoading) {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-5 w-5 text-blue-600" />
        <AlertTitle className="text-blue-900">Checking crew availability...</AlertTitle>
      </Alert>
    );
  }

  if (!eligibility) return null;

  const hasConflictingRequests =
    eligibility?.conflictingRequests && eligibility.conflictingRequests.length > 1;

  if (!hasConflictingRequests) return null;

  const hasSufficientCrew =
    !eligibility.seniorityRecommendation ||
    !eligibility.seniorityRecommendation.includes('CREW SHORTAGE RISK');

  // Determine alert variant and styling based on crew availability
  const alertConfig = hasSufficientCrew
    ? {
        variant: 'default' as const,
        className: 'border-green-400 bg-blue-50',
        icon: CheckCircle,
        iconClassName: 'h-5 w-5 text-green-600',
        titleClassName: 'text-blue-900',
        summaryBg: 'bg-green-50',
        summaryBorder: 'border-green-500',
        summaryText: 'text-green-900',
      }
    : {
        variant: 'default' as const,
        className: 'border-yellow-400 bg-blue-50',
        icon: AlertTriangle,
        iconClassName: 'h-5 w-5 text-yellow-600',
        titleClassName: 'text-blue-900',
        summaryBg: 'bg-yellow-50',
        summaryBorder: 'border-yellow-500',
        summaryText: 'text-yellow-900',
      };

  const IconComponent = alertConfig.icon;

  return (
    <Alert variant={alertConfig.variant} className={`${alertConfig.className} mb-4`}>
      <IconComponent className={alertConfig.iconClassName} />
      <div className="ml-4">
        {/* Header */}
        <AlertTitle className={`${alertConfig.titleClassName} font-bold text-lg flex items-center`}>
          <span className="mr-2">⚖️</span>
          Multiple Pilots Requesting Same Dates - Seniority Priority Review
        </AlertTitle>

        {pilotName && (
          <AlertDescription className="text-blue-800 mt-1 mb-2">
            Reviewing request for: <strong>{pilotName}</strong>
          </AlertDescription>
        )}

        <AlertDescription className="text-blue-700 mb-4">
          {hasSufficientCrew
            ? '✅ Crew Availability: Sufficient crew available - All requests can be approved'
            : '⚠️ Crew Availability: Crew shortage risk - Use seniority priority for approval decisions'}
        </AlertDescription>

        {/* Approval Decision Summary */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {hasSufficientCrew ? (
            <div
              className={`${alertConfig.summaryBg} border-2 ${alertConfig.summaryBorder} rounded-lg p-4 mb-4`}
            >
              <div className="flex items-start mb-3">
                <span className="text-2xl mr-3">✅</span>
                <div className="flex-1">
                  <h5 className={`font-bold ${alertConfig.summaryText} text-base mb-2`}>SUMMARY</h5>
                  <p className="text-green-800 mb-2">
                    <strong>{pilotName}&apos;s</strong> leave request can be approved. Sufficient{' '}
                    {eligibility.conflictingRequests?.[0]?.role === 'Captain'
                      ? 'Captains'
                      : 'First Officers'}{' '}
                    available to maintain minimum crew requirements (≥10).
                  </p>
                  <div className="bg-white rounded p-3 text-green-900">
                    <p className="mb-2">
                      <strong>✅ RECOMMENDATION: APPROVE</strong>
                    </p>
                    <p className="text-sm mb-1">
                      Multiple pilots of the same rank are requesting overlapping dates, but crew
                      levels allow all approvals without operational impact.
                    </p>
                    <p className="text-sm text-green-700">
                      No crew availability issues. All requests can be approved while maintaining
                      minimum requirements.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`${alertConfig.summaryBg} border-2 ${alertConfig.summaryBorder} rounded-lg p-4 mb-4`}
            >
              <div className="flex items-start mb-3">
                <span className="text-2xl mr-3">⚠️</span>
                <div className="flex-1">
                  <h5 className={`font-bold ${alertConfig.summaryText} text-base mb-2`}>SUMMARY</h5>
                  <p className="text-yellow-800 mb-2">
                    <strong>{pilotName}&apos;s</strong> leave request requires review. Approving all
                    conflicting requests may reduce{' '}
                    {eligibility.conflictingRequests?.[0]?.role === 'Captain'
                      ? 'Captains'
                      : 'First Officers'}{' '}
                    below minimum requirement (10).
                  </p>

                  <div className="bg-white rounded p-3 text-yellow-900 mb-3">
                    <p className="mb-2">
                      <strong>⚠️ RECOMMENDATION: REVIEW REQUIRED</strong>
                    </p>
                    <p className="text-sm mb-2">
                      Multiple pilots of the same rank are requesting overlapping dates, but
                      approving all would cause crew shortage.
                    </p>
                    <p className="text-sm text-yellow-800 font-semibold">
                      Use seniority priority below to determine which requests to approve. Higher
                      seniority pilots (lower seniority number) should be approved first.
                    </p>
                  </div>

                  {/* Alternative date recommendations */}
                  {eligibility.reasons &&
                    eligibility.reasons.length > 0 &&
                    eligibility.reasons.some((r) => r.includes('CREW SHORTAGE RISK')) && (
                      <div className="bg-white rounded p-4 text-yellow-900 mb-3">
                        <p className="text-xs font-bold mb-2 text-yellow-800">
                          📋 ALTERNATIVE DATE RECOMMENDATIONS:
                        </p>
                        {eligibility.reasons.map((reason, idx) => {
                          if (
                            reason.includes('CREW SHORTAGE RISK') &&
                            reason.includes('SENIORITY-BASED SPREADING')
                          ) {
                            return (
                              <div
                                key={idx}
                                className="whitespace-pre-wrap font-mono text-xs leading-relaxed"
                              >
                                {reason}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}

                  <div className="bg-white rounded p-3 text-yellow-900">
                    <p className="mb-2">
                      <strong>⚖️ Priority Determination Rules (Within Same Rank):</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                      <li>
                        <strong>1st:</strong> Seniority Number (Lower number = Higher priority)
                      </li>
                      <li>
                        <strong>2nd:</strong> Request Submission Date (Earlier = Higher priority)
                      </li>
                    </ul>
                    <p className="text-xs mt-2 text-yellow-700">
                      Note: Captains and First Officers evaluated separately (10 each minimum).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Priority Rules Section */}
          <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 mb-4">
            <div className="flex items-start mb-2">
              <span className="text-xl mr-2">⚖️</span>
              <div className="flex-1">
                <h5 className="font-bold text-blue-900 text-base mb-2">
                  Seniority Priority Rules (Within Same Rank)
                </h5>
                <div className="bg-white rounded p-3 text-blue-900">
                  <p className="mb-2">
                    <strong>Priority Determination:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                    <li>
                      <strong>1st:</strong> Seniority Number (Lower = Higher priority)
                    </li>
                    <li>
                      <strong>2nd:</strong> Request Date (Earlier = Higher priority)
                    </li>
                  </ul>
                  <p className="text-xs mt-3 text-blue-700">
                    Captains and First Officers evaluated separately (10 each minimum).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Highest Priority Highlight */}
          {eligibility.conflictingRequests && eligibility.conflictingRequests.length > 0 && (
            <div className="bg-blue-100 rounded p-3 mb-3 border-2 border-blue-500">
              <p className="text-sm font-bold text-blue-900">
                🏆 <strong>HIGHEST PRIORITY:</strong> {eligibility.conflictingRequests[0]?.role} -
                Seniority #{eligibility.conflictingRequests[0]?.seniorityNumber}:{' '}
                {eligibility.conflictingRequests[0]?.pilotName}
                {eligibility.conflictingRequests[0]?.pilotName === pilotName && (
                  <span className="ml-2">(Current Request)</span>
                )}
              </p>
            </div>
          )}

          {/* Conflicting Requests List */}
          {eligibility.conflictingRequests &&
            eligibility.conflictingRequests.map((conflictReq, index) => {
              const isCurrentPilot = conflictReq.pilotName === pilotName;

              let bgColor = 'bg-gray-50';
              let borderColor = 'border-gray-300';
              let badgeColor = 'bg-gray-200 text-gray-900';

              if (isCurrentPilot) {
                bgColor = 'bg-blue-50';
                borderColor = 'border-blue-500';
              } else if (conflictReq.overlapType === 'EXACT') {
                bgColor = 'bg-orange-50';
                borderColor = 'border-orange-500';
                badgeColor = 'bg-orange-200 text-orange-900';
              } else if (conflictReq.overlapType === 'PARTIAL') {
                bgColor = 'bg-yellow-50';
                borderColor = 'border-yellow-500';
                badgeColor = 'bg-yellow-200 text-yellow-900';
              } else if (conflictReq.overlapType === 'ADJACENT') {
                bgColor = 'bg-amber-50';
                borderColor = 'border-amber-400';
                badgeColor = 'bg-amber-200 text-amber-900';
              }

              return (
                <div
                  key={conflictReq.requestId}
                  className={`rounded-lg p-4 border-2 ${bgColor} ${borderColor} ${isCurrentPilot ? 'ring-2 ring-blue-300' : ''}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-base text-gray-900">
                      {index === 0 ? '🏆' : '📍'} {conflictReq.role} - Seniority #
                      {conflictReq.seniorityNumber}: {conflictReq.pilotName}
                      {isCurrentPilot && (
                        <span className="ml-2 text-xs text-blue-700 font-bold">
                          (Current Request)
                        </span>
                      )}
                    </div>
                    <div className={`text-xs px-3 py-1.5 rounded-full font-bold ${badgeColor}`}>
                      {conflictReq.overlapType}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 mb-3 bg-white p-3 rounded">
                    <div>
                      <strong>Overall Priority:</strong> #{index + 1}
                    </div>
                    <div>
                      <strong>Employee ID:</strong> {conflictReq.employeeId}
                    </div>
                    <div>
                      <strong>Rank:</strong> {conflictReq.role}
                    </div>
                    <div>
                      <strong>Seniority #:</strong> {conflictReq.seniorityNumber}
                    </div>
                    <div>
                      <strong>Request Type:</strong> {conflictReq.requestType || 'N/A'}
                    </div>
                    <div>
                      <strong>Duration:</strong> {conflictReq.overlappingDays} days
                    </div>
                    <div className="col-span-2">
                      <strong>Requested Dates:</strong>{' '}
                      {new Date(conflictReq.startDate).toLocaleDateString('en-AU')} to{' '}
                      {new Date(conflictReq.endDate).toLocaleDateString('en-AU')}
                    </div>
                    <div className="col-span-2">
                      <strong>Overlap:</strong> {conflictReq.overlapMessage}
                    </div>
                    {conflictReq.reason && (
                      <div className="col-span-2">
                        <strong>Reason:</strong> {conflictReq.reason}
                      </div>
                    )}
                  </div>

                  <div
                    className={`text-sm font-semibold p-3 rounded border ${
                      conflictReq.overlapType === 'EXACT'
                        ? 'bg-orange-100 text-orange-900 border-orange-300'
                        : conflictReq.overlapType === 'PARTIAL'
                          ? 'bg-yellow-100 text-yellow-900 border-yellow-300'
                          : 'bg-gray-100 text-gray-800 border-gray-300'
                    }`}
                  >
                    {conflictReq.recommendation}
                  </div>

                  {conflictReq.spreadSuggestion && (
                    <div className="mt-2 text-sm p-3 bg-purple-50 text-purple-900 rounded border border-purple-200">
                      <strong>Spreading Recommendation:</strong> {conflictReq.spreadSuggestion}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </Alert>
  );
}
