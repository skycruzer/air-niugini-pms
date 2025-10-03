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
  const [showDetails, setShowDetails] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);

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
    return null;
  }

  // Determine alert color and icon based on recommendation
  const alertStyles = {
    APPROVE: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: '✅',
      title: 'Approved - Crew Requirements Met',
    },
    REVIEW_REQUIRED: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: '⚠️',
      title: 'Review Required - Potential Crew Shortage',
    },
    DENY: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: '❌',
      title: 'Recommend Deny - Critical Crew Shortage',
    },
  };

  const style = alertStyles[eligibility.recommendation];

  return (
    <div className={`${style.bg} border-2 ${style.border} rounded-lg p-4 mb-4`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start">
          <span className="text-2xl mr-3">{style.icon}</span>
          <div>
            <h4 className={`font-bold ${style.text} text-lg`}>{style.title}</h4>
            {pilotName && (
              <p className={`text-sm ${style.text} mt-1`}>
                Leave request for: <strong>{pilotName}</strong>
              </p>
            )}
          </div>
        </div>
        {eligibility.conflicts.length > 0 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`text-xs ${style.text} hover:underline font-medium`}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>

      {/* Reasons */}
      <div className="space-y-2 mb-3">
        {eligibility.reasons.map((reason, index) => (
          <p key={index} className={`text-sm ${style.text}`}>
            {reason}
          </p>
        ))}
      </div>

      {/* Conflicts Details (Expandable) */}
      {showDetails && eligibility.conflicts.length > 0 && (
        <div className="mt-4 border-t border-current/20 pt-4">
          <h5 className={`font-semibold ${style.text} mb-2 flex items-center`}>
            <span className="mr-2">📅</span>
            Conflict Details ({eligibility.conflicts.length} dates affected)
          </h5>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {eligibility.conflicts.map((conflict, index) => (
              <div
                key={index}
                className={`text-xs ${style.text} bg-white/50 rounded p-2 border ${style.border}`}
              >
                <div className="font-medium mb-1">{conflict.message}</div>
                <div className="flex items-center space-x-4 text-xs opacity-75">
                  <span>
                    Captains: {conflict.availableCaptains}/{conflict.requiredCaptains}
                  </span>
                  <span>
                    First Officers: {conflict.availableFirstOfficers}/
                    {conflict.requiredFirstOfficers}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-white rounded">
                    {conflict.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternative Pilots (Seniority-based) */}
      {eligibility.alternativePilots.length > 0 && (
        <div className="mt-4 border-t border-current/20 pt-4">
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className={`font-semibold ${style.text} mb-2 flex items-center hover:underline`}
          >
            <span className="mr-2">👥</span>
            Alternative Pilots Available ({eligibility.alternativePilots.filter(
              (p) => p.currentLeaveStatus === 'AVAILABLE'
            ).length} available by seniority)
            <span className="ml-2">{showAlternatives ? '▼' : '▶'}</span>
          </button>

          {showAlternatives && (
            <div className="space-y-2 max-h-60 overflow-y-auto mt-3">
              {eligibility.alternativePilots.slice(0, 10).map((pilot) => (
                <div
                  key={pilot.pilotId}
                  className={`text-xs bg-white/50 rounded p-3 border ${style.border} ${pilot.currentLeaveStatus === 'AVAILABLE' ? 'border-l-4 border-l-green-500' : 'opacity-60'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold">
                      #{pilot.seniorityNumber} - {pilot.pilotName}
                    </div>
                    <div
                      className={`text-xs px-2 py-0.5 rounded ${
                        pilot.currentLeaveStatus === 'AVAILABLE'
                          ? 'bg-green-100 text-green-800'
                          : pilot.currentLeaveStatus === 'PENDING_LEAVE'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {pilot.currentLeaveStatus.replace('_', ' ')}
                    </div>
                  </div>
                  <div className={`text-xs ${style.text}`}>
                    {pilot.employeeId} • {pilot.role} • Priority #{pilot.priority}
                  </div>
                  <div className={`text-xs ${style.text} mt-1 opacity-75`}>
                    {pilot.reason}
                  </div>
                </div>
              ))}
              {eligibility.alternativePilots.length > 10 && (
                <p className={`text-xs ${style.text} text-center py-2`}>
                  + {eligibility.alternativePilots.length - 10} more pilots not shown
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Crew Impact Summary */}
      {eligibility.crewImpact.length > 0 && showDetails && (
        <div className="mt-4 border-t border-current/20 pt-4">
          <h5 className={`font-semibold ${style.text} mb-2 flex items-center`}>
            <span className="mr-2">📊</span>
            Projected Crew Availability Impact
          </h5>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/50 rounded p-2 border ${style.border}">
              <div className={`text-xs ${style.text} opacity-75 mb-1`}>Date Range</div>
              <div className={`text-sm ${style.text} font-medium`}>
                {eligibility.crewImpact[0]?.date} to{' '}
                {eligibility.crewImpact[eligibility.crewImpact.length - 1]?.date}
              </div>
            </div>
            <div className="bg-white/50 rounded p-2 border ${style.border}">
              <div className={`text-xs ${style.text} opacity-75 mb-1`}>Days Affected</div>
              <div className={`text-sm ${style.text} font-medium`}>
                {eligibility.crewImpact.length} days
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
