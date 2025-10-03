/**
 * LEAVE ELIGIBILITY ALERT COMPONENT
 *
 * Displays eligibility warnings, conflicts, and seniority-based recommendations
 * for leave requests. Shows real-time crew availability impact.
 *
 * Features:
 * - Color-coded alerts (green/yellow/red) based on recommendation
 * - Detailed conflict information with affected dates
 * - Alternative pilot recommendations sorted by seniority
 * - Crew availability projections
 * - Expandable sections for detailed analysis
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
  const hasSufficientCrew = eligibility.recommendation === 'APPROVE' ||
    (eligibility.reasons && eligibility.reasons.some(r => r.includes('Sufficient')));

  const bgColor = hasSufficientCrew ? 'bg-green-50' : 'bg-blue-50';
  const borderColor = hasSufficientCrew ? 'border-green-300' : 'border-blue-300';
  const headerColor = hasSufficientCrew ? 'text-green-900' : 'text-blue-900';
  const headerIcon = hasSufficientCrew ? '✅' : '⚖️';

  return (
    <div className={`${bgColor} border-2 ${borderColor} rounded-lg p-5 mb-4`}>
      {/* Header */}
      <div className="mb-4">
        <h4 className={`font-bold ${headerColor} text-lg flex items-center`}>
          <span className="mr-2">{headerIcon}</span>
          {hasSufficientCrew
            ? 'Crew Availability: Sufficient - Multiple Pilots Requesting Same Dates'
            : 'Seniority Priority Review - Crew Shortage Risk'}
        </h4>
        {pilotName && (
          <p className={`text-sm ${hasSufficientCrew ? 'text-green-800' : 'text-blue-800'} mt-1`}>
            Reviewing request for: <strong>{pilotName}</strong>
          </p>
        )}
      </div>

      {/* Approval Decision Summary */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {hasSufficientCrew ? (
          <div className="text-sm bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-4">
            <div className="flex items-start mb-3">
              <span className="text-2xl mr-3">✅</span>
              <div className="flex-1">
                <h5 className="font-bold text-green-900 text-base mb-2">RECOMMENDATION: APPROVE</h5>
                <p className="text-green-800 mb-2">
                  <strong>{pilotName}</strong> can be approved. Sufficient crew members available to maintain minimum requirements.
                </p>
                <div className="bg-white rounded p-3 text-green-900">
                  <p className="mb-1">
                    <strong>Crew Status:</strong> {eligibility.conflictingRequests?.[0]?.role === 'Captain' ? 'Captains' : 'First Officers'} available after approval will remain above minimum requirements.
                  </p>
                  <p className="text-sm">
                    Multiple pilots requesting same dates, but crew levels allow all approvals without operational impact.
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
                <h5 className="font-bold text-yellow-900 text-base mb-2">RECOMMENDATION: REVIEW REQUIRED</h5>
                <p className="text-yellow-800 mb-2">
                  <strong>CAUTION:</strong> Approving all conflicting requests may result in crew shortage. Review seniority priority below.
                </p>

                {/* Display detailed spreading recommendations ONLY when crew shortage exists */}
                {eligibility.reasons && eligibility.reasons.length > 0 && eligibility.reasons.some(r => r.includes('CREW SHORTAGE RISK')) && (
                  <div className="bg-white rounded p-4 text-yellow-900 mb-3">
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
                    <strong>⚖️ Priority Determination Rules:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                    <li><strong>1st:</strong> Rank (Captain has priority over First Officer)</li>
                    <li><strong>2nd:</strong> Seniority Number (Lower number = Higher priority)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`text-sm ${hasSufficientCrew ? 'text-green-900 bg-green-100 border-green-200' : 'text-blue-900 bg-blue-100 border-blue-200'} rounded p-3 mb-3 border`}>
          <strong>📋 {hasSufficientCrew ? 'Multiple Requests Detected' : 'Seniority Comparison'}:</strong> Multiple pilots have requested overlapping or nearby dates. {hasSufficientCrew ? 'Review details below for complete information.' : 'Priority is determined by rank and seniority number (lower = higher priority).'}
        </div>

        {eligibility.conflictingRequests && eligibility.conflictingRequests.length > 0 && (
          <div className="text-sm font-bold text-green-900 bg-green-100 rounded p-3 mb-3 border-2 border-green-500">
            🏆 <strong>PRIORITY PILOT:</strong> {eligibility.conflictingRequests[0]?.role} - Seniority #{eligibility.conflictingRequests[0]?.seniorityNumber}: {eligibility.conflictingRequests[0]?.pilotName}
            {eligibility.conflictingRequests[0]?.pilotName === pilotName && <span className="ml-2">(Current Request - APPROVE)</span>}
            {eligibility.conflictingRequests[0]?.pilotName !== pilotName && <span className="ml-2">(Approve this pilot first)</span>}
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
