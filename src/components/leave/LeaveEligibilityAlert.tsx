/**
 * LEAVE ELIGIBILITY ALERT COMPONENT
 *
 * Displays seniority-based priority review when multiple pilots of THE SAME RANK request same dates.
 * Always shows all conflicting requests sorted by seniority, regardless of crew availability.
 *
 * Business Logic (Updated 2025-10-04):
 *
 * CRITICAL: EVALUATES PILOTS OF THE SAME RANK SEPARATELY
 * - Captains are compared ONLY with other Captains
 * - First Officers are compared ONLY with other First Officers
 * - Each rank maintains its own minimum requirement: 10 Captains AND 10 First Officers
 *
 * CREW CALCULATION (Per Rank):
 * - currentAvailable = pilots OF THIS RANK NOT on approved leave
 * - totalRequesting = pilots OF THIS RANK requesting leave for overlapping dates
 * - remainingAfterApproval = currentAvailable - totalRequesting
 * - If remainingAfterApproval >= 10: Can approve all ✅
 * - If remainingAfterApproval < 10: Can only approve (currentAvailable - 10) pilots ⚠️
 *
 * DISPLAY SCENARIOS:
 * - SCENARIO 1: No conflicts from SAME RANK → No alert shown
 * - SCENARIO 2a: Multiple requests from SAME RANK + remainingAfterApproval >= 10 → Green border (approve all)
 * - SCENARIO 2b: Multiple requests from SAME RANK + remainingAfterApproval < 10 → Yellow border (approve some by seniority)
 * - SCENARIO 2c: currentAvailable <= 10 → Red border (crew shortage, spread requests)
 *
 * Features:
 * - Always displays when 2+ pilots OF THE SAME RANK request same/overlapping dates
 * - Lists ALL pilots of the same rank sorted by:
 *   1. Seniority Number (lower = higher priority)
 *   2. Request Submission Date (earlier = higher priority as tie-breaker)
 * - Shows crew availability status and approval capacity FOR THAT SPECIFIC RANK
 * - Detailed conflict information with affected dates
 * - Color-coded border indicates crew status for the rank
 * - Consistent blue background for informational seniority comparison
 * - Alternative date suggestions for lower seniority pilots when needed
 * - Captains and First Officers managed independently with separate minimums
 * - Request order used for spreading recommendations when seniority is equal
 */

'use client';

import { useState } from 'react';
import type { LeaveEligibilityCheck } from '@/lib/leave-eligibility-service';

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
  const [showConflictingRequests, setShowConflictingRequests] = useState(true); // Show by default if present

  if (isLoading) {
    return (
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
          <p className="text-sm text-blue-800">Checking crew availability...</p>
        </div>
      </div>
    );
  }

  if (!eligibility) {
    console.log('📊 ALERT: No eligibility data');
    return null;
  }

  // Show ONLY if there are MULTIPLE conflicting requests (more than 1 pilot)
  const hasConflictingRequests = eligibility?.conflictingRequests && eligibility.conflictingRequests.length > 1;

  console.log('📊 ALERT: Eligibility data received:', {
    hasConflictingRequests: hasConflictingRequests,
    conflictingRequestsCount: eligibility.conflictingRequests?.length,
    recommendation: eligibility.recommendation
  });

  if (!hasConflictingRequests) {
    console.log('📊 ALERT: Not showing alert - No multiple conflicting requests (need 2+ pilots)');
    return null;
  }

  console.log('📊 ALERT: Showing comparison with', eligibility.conflictingRequests.length, 'pilots');

  // Determine if this is a crew shortage scenario or sufficient crew
  // When seniorityRecommendation is empty AND there are multiple conflicting requests, it means sufficient crew
  // When seniorityRecommendation contains "CREW SHORTAGE RISK", it means crew shortage
  const hasSufficientCrew = !eligibility.seniorityRecommendation ||
    !eligibility.seniorityRecommendation.includes('CREW SHORTAGE RISK');

  // Always use blue theme for seniority comparison (informational)
  const bgColor = 'bg-blue-50';
  const borderColor = hasSufficientCrew ? 'border-green-400' : 'border-yellow-400';
  const headerColor = 'text-blue-900';
  const headerIcon = '⚖️';

  return (
    <div className={`${bgColor} border-2 ${borderColor} rounded-lg p-5 mb-4`}>
      {/* Header */}
      <div className="mb-4">
        <h4 className={`font-bold ${headerColor} text-lg flex items-center`}>
          <span className="mr-2">{headerIcon}</span>
          Multiple Pilots Requesting Same Dates - Seniority Priority Review
        </h4>
        {pilotName && (
          <p className="text-sm text-blue-800 mt-1">
            Reviewing request for: <strong>{pilotName}</strong>
          </p>
        )}
        <p className="text-sm text-blue-700 mt-2">
          {hasSufficientCrew
            ? '✅ Crew Availability: Sufficient crew available - All requests can be approved'
            : '⚠️ Crew Availability: Crew shortage risk - Use seniority priority for approval decisions'}
        </p>
      </div>

      {/* Approval Decision Summary */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {hasSufficientCrew ? (
          <div className="text-sm bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-4">
            <div className="flex items-start mb-3">
              <span className="text-2xl mr-3">✅</span>
              <div className="flex-1">
                <h5 className="font-bold text-green-900 text-base mb-2">SUMMARY</h5>
                <p className="text-green-800 mb-2">
                  <strong>{pilotName}&apos;s</strong> leave request can be approved. Sufficient {eligibility.conflictingRequests?.[0]?.role === 'Captain' ? 'Captains' : 'First Officers'} available to maintain minimum crew requirements (≥10).
                </p>
                <div className="bg-white rounded p-3 text-green-900">
                  <p className="mb-2">
                    <strong>✅ RECOMMENDATION: APPROVE</strong>
                  </p>
                  <p className="text-sm mb-1">
                    Multiple pilots of the same rank are requesting overlapping dates, but crew levels allow all approvals without operational impact.
                  </p>
                  <p className="text-sm text-green-700">
                    No crew availability issues. All requests can be approved while maintaining minimum requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4 mb-4">
            <div className="flex items-start mb-3">
              <span className="text-2xl mr-3">⚠️</span>
              <div className="flex-1">
                <h5 className="font-bold text-yellow-900 text-base mb-2">SUMMARY</h5>
                <p className="text-yellow-800 mb-2">
                  <strong>{pilotName}&apos;s</strong> leave request requires review. Approving all conflicting requests may reduce {eligibility.conflictingRequests?.[0]?.role === 'Captain' ? 'Captains' : 'First Officers'} below minimum requirement (10).
                </p>

                <div className="bg-white rounded p-3 text-yellow-900 mb-3">
                  <p className="mb-2">
                    <strong>⚠️ RECOMMENDATION: REVIEW REQUIRED</strong>
                  </p>
                  <p className="text-sm mb-2">
                    Multiple pilots of the same rank are requesting overlapping dates, but approving all would cause crew shortage.
                  </p>
                  <p className="text-sm text-yellow-800 font-semibold">
                    Use seniority priority below to determine which requests to approve. Higher seniority pilots (lower seniority number) should be approved first.
                  </p>
                </div>

                {/* Display detailed spreading recommendations ONLY when crew shortage exists */}
                {eligibility.reasons && eligibility.reasons.length > 0 && eligibility.reasons.some(r => r.includes('CREW SHORTAGE RISK')) && (
                  <div className="bg-white rounded p-4 text-yellow-900 mb-3">
                    <p className="text-xs font-bold mb-2 text-yellow-800">📋 ALTERNATIVE DATE RECOMMENDATIONS:</p>
                    {eligibility.reasons.map((reason, idx) => {
                      // Only show spreading recommendations when there's an actual crew shortage
                      if (reason.includes('CREW SHORTAGE RISK') && reason.includes('SENIORITY-BASED SPREADING')) {
                        return (
                          <div key={idx} className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
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
                    <li><strong>1st:</strong> Seniority Number (Lower number = Higher priority)</li>
                    <li><strong>2nd:</strong> Request Submission Date (Earlier submission = Higher priority)</li>
                  </ul>
                  <p className="text-xs mt-2 text-yellow-700">
                    Note: Captains and First Officers are evaluated separately with independent minimums (10 each).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Priority Rules Section */}
        <div className="text-sm bg-blue-100 border-2 border-blue-300 rounded-lg p-4 mb-4">
          <div className="flex items-start mb-2">
            <span className="text-xl mr-2">⚖️</span>
            <div className="flex-1">
              <h5 className="font-bold text-blue-900 text-base mb-2">Seniority Priority Rules (Within Same Rank)</h5>
              <div className="bg-white rounded p-3 text-blue-900">
                <p className="mb-2">
                  <strong>Priority Determination:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                  <li><strong>1st:</strong> Seniority Number (Lower number = Higher priority)</li>
                  <li><strong>2nd:</strong> Request Submission Date (Earlier submission = Higher priority)</li>
                </ul>
                <p className="text-xs mt-3 text-blue-700">
                  Note: Captains and First Officers are evaluated separately with independent minimums (10 each). All requests below are sorted by seniority priority within their rank.
                </p>
              </div>
            </div>
          </div>
        </div>

        {eligibility.conflictingRequests && eligibility.conflictingRequests.length > 0 && (
          <div className="text-sm font-bold text-blue-900 bg-blue-100 rounded p-3 mb-3 border-2 border-blue-500">
            🏆 <strong>HIGHEST PRIORITY:</strong> {eligibility.conflictingRequests[0]?.role} - Seniority #{eligibility.conflictingRequests[0]?.seniorityNumber}: {eligibility.conflictingRequests[0]?.pilotName}
            {eligibility.conflictingRequests[0]?.pilotName === pilotName && <span className="ml-2">(Current Request)</span>}
          </div>
        )}

        {eligibility.conflictingRequests && eligibility.conflictingRequests
          .map((conflictReq, index) => {
            const isCurrentPilot = conflictReq.pilotName === pilotName;

            // Color based on overlap type
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
                    {index === 0 ? '🏆' : '📍'} {conflictReq.role} - Seniority #{conflictReq.seniorityNumber}: {conflictReq.pilotName}
                    {isCurrentPilot && <span className="ml-2 text-xs text-blue-700 font-bold">(Current Request)</span>}
                  </div>
                  <div className={`text-xs px-3 py-1.5 rounded-full font-bold ${badgeColor}`}>
                    {conflictReq.overlapType}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 mb-3 bg-white p-3 rounded">
                  <div><strong>Overall Priority:</strong> #{index + 1}</div>
                  <div><strong>Employee ID:</strong> {conflictReq.employeeId}</div>
                  <div><strong>Rank:</strong> {conflictReq.role}</div>
                  <div><strong>Seniority #:</strong> {conflictReq.seniorityNumber}</div>
                  <div><strong>Request Type:</strong> {conflictReq.requestType || 'N/A'}</div>
                  <div><strong>Duration:</strong> {conflictReq.overlappingDays} days</div>
                  <div className="col-span-2"><strong>Requested Dates:</strong> {new Date(conflictReq.startDate).toLocaleDateString('en-AU')} to {new Date(conflictReq.endDate).toLocaleDateString('en-AU')}</div>
                  <div className="col-span-2"><strong>Overlap:</strong> {conflictReq.overlapMessage}</div>
                  {conflictReq.reason && (
                    <div className="col-span-2">
                      <strong>Reason:</strong> {conflictReq.reason}
                    </div>
                  )}
                </div>

                <div className={`text-sm font-semibold p-3 rounded border ${
                  conflictReq.overlapType === 'EXACT'
                    ? 'bg-orange-100 text-orange-900 border-orange-300'
                    : conflictReq.overlapType === 'PARTIAL'
                    ? 'bg-yellow-100 text-yellow-900 border-yellow-300'
                    : 'bg-gray-100 text-gray-800 border-gray-300'
                }`}>
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
  );
}
