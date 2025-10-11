'use client';

import { useState, useMemo, useEffect } from 'react';
import { format, eachDayOfInterval, addDays, subDays } from 'date-fns';
import { AlertTriangle, CheckCircle, XCircle, Calendar, Users, Info, Shield } from 'lucide-react';
import { LeaveEvent } from './InteractiveRosterCalendar';
import { getRosterPeriodFromDate } from '@/lib/roster-utils';

interface LeaveConflictDetectorProps {
  leaveRequests: LeaveEvent[];
  currentLeave?: LeaveEvent;
  minimumCrew?: number;
  onOverride?: (leaveId: string, reason: string) => void;
  allowOverride?: boolean;
}

interface Conflict {
  type: 'OVERLAP' | 'MINIMUM_CREW' | 'ROSTER_BOUNDARY' | 'DUPLICATE';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  affectedDates: Date[];
  affectedLeaves: LeaveEvent[];
  suggestions?: string[];
}

export function LeaveConflictDetector({
  leaveRequests,
  currentLeave,
  minimumCrew = 18, // Minimum 18 pilots available for B767 operations
  onOverride,
  allowOverride = false,
}: LeaveConflictDetectorProps) {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);

  // Detect all conflicts
  useEffect(() => {
    if (!currentLeave) {
      setConflicts([]);
      return;
    }

    const detectedConflicts: Conflict[] = [];

    // 1. Check for overlapping leave (same pilot)
    const overlappingLeaves = leaveRequests.filter((leave) => {
      if (leave.id === currentLeave.id) return false;
      if (leave.pilotId !== currentLeave.pilotId) return false;
      if (leave.status === 'DENIED') return false;

      const overlap =
        (currentLeave.startDate >= leave.startDate && currentLeave.startDate <= leave.endDate) ||
        (currentLeave.endDate >= leave.startDate && currentLeave.endDate <= leave.endDate) ||
        (currentLeave.startDate <= leave.startDate && currentLeave.endDate >= leave.endDate);

      return overlap;
    });

    if (overlappingLeaves.length > 0) {
      detectedConflicts.push({
        type: 'OVERLAP',
        severity: 'CRITICAL',
        message: `This pilot already has ${overlappingLeaves.length} approved/pending leave(s) during this period`,
        affectedDates: eachDayOfInterval({
          start: currentLeave.startDate,
          end: currentLeave.endDate,
        }),
        affectedLeaves: overlappingLeaves,
        suggestions: [
          'Choose different dates that do not overlap',
          'Cancel or modify the existing leave request first',
          'Contact the pilot to confirm their intended leave dates',
        ],
      });
    }

    // 2. Check minimum crew availability for each day
    const daysWithLowCrew: Date[] = [];
    const leaveDays = eachDayOfInterval({
      start: currentLeave.startDate,
      end: currentLeave.endDate,
    });

    const TOTAL_PILOTS = 27;

    leaveDays.forEach((day) => {
      // Count how many pilots are on leave on this day
      const pilotsOnLeave = new Set(
        leaveRequests
          .filter((leave) => {
            if (leave.status === 'DENIED') return false;
            return day >= leave.startDate && day <= leave.endDate;
          })
          .map((leave) => leave.pilotId)
      );

      // Add current leave pilot to the count
      pilotsOnLeave.add(currentLeave.pilotId);

      const available = TOTAL_PILOTS - pilotsOnLeave.size;

      if (available < minimumCrew) {
        daysWithLowCrew.push(day);
      }
    });

    if (daysWithLowCrew.length > 0) {
      detectedConflicts.push({
        type: 'MINIMUM_CREW',
        severity: daysWithLowCrew.length > 3 ? 'CRITICAL' : 'WARNING',
        message: `Crew availability falls below minimum (${minimumCrew}) on ${daysWithLowCrew.length} day(s)`,
        affectedDates: daysWithLowCrew,
        affectedLeaves: leaveRequests.filter((leave) =>
          daysWithLowCrew.some((day) => day >= leave.startDate && day <= leave.endDate)
        ),
        suggestions: [
          `Consider adjusting dates to maintain minimum ${minimumCrew} crew`,
          'Review and potentially deny some pending leave requests',
          'Contact crew to see if anyone can modify their leave',
          allowOverride ? 'Management can override with justification' : undefined,
        ].filter(Boolean) as string[],
      });
    }

    // 3. Check roster period boundaries
    const startRoster = getRosterPeriodFromDate(currentLeave.startDate);
    const endRoster = getRosterPeriodFromDate(currentLeave.endDate);

    if (startRoster.code !== endRoster.code) {
      detectedConflicts.push({
        type: 'ROSTER_BOUNDARY',
        severity: 'WARNING',
        message: `Leave spans across roster periods: ${startRoster.code} to ${endRoster.code}`,
        affectedDates: leaveDays,
        affectedLeaves: [currentLeave],
        suggestions: [
          'Split the leave into separate requests for each roster period',
          'Adjust dates to stay within a single roster period',
          'If intentional, ensure both periods are properly recorded',
        ],
      });
    }

    // 4. Check for duplicate requests (same pilot, same dates, different ID)
    const duplicates = leaveRequests.filter((leave) => {
      if (leave.id === currentLeave.id) return false;
      if (leave.pilotId !== currentLeave.pilotId) return false;
      if (leave.status === 'DENIED') return false;

      return (
        format(leave.startDate, 'yyyy-MM-dd') === format(currentLeave.startDate, 'yyyy-MM-dd') &&
        format(leave.endDate, 'yyyy-MM-dd') === format(currentLeave.endDate, 'yyyy-MM-dd') &&
        leave.requestType === currentLeave.requestType
      );
    });

    if (duplicates.length > 0) {
      detectedConflicts.push({
        type: 'DUPLICATE',
        severity: 'INFO',
        message: `Possible duplicate request detected`,
        affectedDates: leaveDays,
        affectedLeaves: duplicates,
        suggestions: [
          'Check if this leave was already submitted',
          'Delete the duplicate request if confirmed',
          'Verify with the pilot if both requests are needed',
        ],
      });
    }

    setConflicts(detectedConflicts);
  }, [leaveRequests, currentLeave, minimumCrew, allowOverride]);

  // Get alternative date suggestions
  const getAlternativeDates = useMemo(() => {
    if (!currentLeave) return [];

    const alternatives: Array<{ start: Date; end: Date; reason: string }> = [];
    const duration = currentLeave.daysCount;

    // Try before the current dates
    const earlierStart = subDays(currentLeave.startDate, 7);
    const earlierEnd = addDays(earlierStart, duration - 1);
    alternatives.push({
      start: earlierStart,
      end: earlierEnd,
      reason: 'One week earlier',
    });

    // Try after the current dates
    const laterStart = addDays(currentLeave.endDate, 1);
    const laterEnd = addDays(laterStart, duration - 1);
    alternatives.push({
      start: laterStart,
      end: laterEnd,
      reason: 'Immediately after current period',
    });

    // Try two weeks later
    const twoWeeksLater = addDays(currentLeave.startDate, 14);
    const twoWeeksLaterEnd = addDays(twoWeeksLater, duration - 1);
    alternatives.push({
      start: twoWeeksLater,
      end: twoWeeksLaterEnd,
      reason: 'Two weeks later',
    });

    return alternatives;
  }, [currentLeave]);

  // Handle override
  const handleOverride = () => {
    if (!currentLeave || !overrideReason.trim()) return;

    onOverride?.(currentLeave.id, overrideReason);
    setShowOverrideDialog(false);
    setOverrideReason('');
  };

  // Severity icon and color
  const getSeverityIcon = (severity: Conflict['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'INFO':
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: Conflict['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-50 border-red-200';
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200';
      case 'INFO':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getSeverityTextColor = (severity: Conflict['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-800';
      case 'WARNING':
        return 'text-yellow-800';
      case 'INFO':
        return 'text-blue-800';
    }
  };

  if (!currentLeave) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">Select or create a leave request to check for conflicts</p>
      </div>
    );
  }

  if (conflicts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-green-800">No Conflicts Detected</h3>
            <p className="text-sm text-green-700 mt-1">
              This leave request is clear for approval. All validations passed.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-green-200 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-green-600">Pilot:</span>
            <p className="font-medium text-green-800">{currentLeave.pilotName}</p>
          </div>
          <div>
            <span className="text-green-600">Duration:</span>
            <p className="font-medium text-green-800">{currentLeave.daysCount} days</p>
          </div>
          <div>
            <span className="text-green-600">Dates:</span>
            <p className="font-medium text-green-800">
              {format(currentLeave.startDate, 'MMM dd')} -{' '}
              {format(currentLeave.endDate, 'MMM dd, yyyy')}
            </p>
          </div>
          <div>
            <span className="text-green-600">Type:</span>
            <p className="font-medium text-green-800">{currentLeave.requestType}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-[#4F46E5]" />
            <div>
              <h3 className="font-bold text-gray-900">Conflict Detection</h3>
              <p className="text-sm text-gray-600">
                {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} detected
              </p>
            </div>
          </div>

          {allowOverride && (
            <button
              onClick={() => setShowOverrideDialog(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] transition-colors text-sm font-medium"
            >
              <Shield className="h-4 w-4" />
              <span>Override</span>
            </button>
          )}
        </div>
      </div>

      {/* Conflicts list */}
      {conflicts.map((conflict, index) => (
        <div key={index} className={`border rounded-lg p-4 ${getSeverityColor(conflict.severity)}`}>
          <div className="flex items-start space-x-3">
            {getSeverityIcon(conflict.severity)}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-bold ${getSeverityTextColor(conflict.severity)}`}>
                  {conflict.type.replace('_', ' ')}
                </h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityTextColor(conflict.severity)}`}
                >
                  {conflict.severity}
                </span>
              </div>

              <p className={`text-sm ${getSeverityTextColor(conflict.severity)} mb-3`}>
                {conflict.message}
              </p>

              {/* Affected dates */}
              {conflict.affectedDates.length > 0 && (
                <div className="mb-3">
                  <span
                    className={`text-xs font-medium ${getSeverityTextColor(conflict.severity)}`}
                  >
                    Affected Dates:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {conflict.affectedDates.slice(0, 7).map((date) => (
                      <span
                        key={date.toISOString()}
                        className="px-2 py-0.5 bg-white rounded text-xs font-medium"
                      >
                        {format(date, 'MMM dd')}
                      </span>
                    ))}
                    {conflict.affectedDates.length > 7 && (
                      <span className="px-2 py-0.5 bg-white rounded text-xs font-medium">
                        +{conflict.affectedDates.length - 7} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {showSuggestions && conflict.suggestions && conflict.suggestions.length > 0 && (
                <div className="bg-white rounded-lg p-3">
                  <span className="text-xs font-medium text-gray-900 mb-2 block">
                    Suggested Actions:
                  </span>
                  <ul className="space-y-1">
                    {conflict.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-xs text-gray-700 flex items-start space-x-2">
                        <span className="text-[#4F46E5] font-bold">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Alternative dates suggestions */}
      {conflicts.some((c) => c.type === 'OVERLAP' || c.type === 'MINIMUM_CREW') && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Alternative Date Suggestions</h4>
          <div className="space-y-2">
            {getAlternativeDates.map((alt, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {format(alt.start, 'MMM dd')} - {format(alt.end, 'MMM dd, yyyy')}
                  </div>
                  <div className="text-xs text-gray-600">{alt.reason}</div>
                </div>
                <button className="px-3 py-1.5 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] transition-colors text-sm font-medium">
                  Use This
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Override dialog */}
      {showOverrideDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="h-6 w-6 text-[#4F46E5]" />
              <h3 className="text-lg font-bold text-gray-900">Override Conflicts</h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              As a manager/admin, you can override these conflicts. Please provide a justification:
            </p>

            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Enter justification for override..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent resize-none"
              rows={4}
            />

            <div className="flex items-center justify-end space-x-2 mt-4">
              <button
                onClick={() => {
                  setShowOverrideDialog(false);
                  setOverrideReason('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                disabled={!overrideReason.trim()}
                className={`
                  px-4 py-2 rounded-lg transition-colors font-medium
                  ${
                    overrideReason.trim()
                      ? 'bg-[#4F46E5] text-white hover:bg-[#4338CA]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                Confirm Override
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowSuggestions(!showSuggestions)}
        className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        {showSuggestions ? 'Hide' : 'Show'} suggestions
      </button>
    </div>
  );
}
