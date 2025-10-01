'use client';

import { useState, useEffect } from 'react';
import { getFutureRosterPeriods, formatRosterPeriod, RosterPeriod } from '@/lib/roster-utils';

interface RosterPeriodSelectorProps {
  selectedPeriod: string | null;
  onPeriodChange: (period: string) => void;
  monthsAhead?: number;
  className?: string;
}

export function RosterPeriodSelector({
  selectedPeriod,
  onPeriodChange,
  monthsAhead = 12,
  className = '',
}: RosterPeriodSelectorProps) {
  const [futureRosters, setFutureRosters] = useState<RosterPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFutureRosters = async () => {
      try {
        setIsLoading(true);
        const rosters = getFutureRosterPeriods(monthsAhead);
        setFutureRosters(rosters);

        // Auto-select the next roster period if none selected
        if (!selectedPeriod && rosters.length > 1 && rosters[1]) {
          // Skip current roster (index 0), select next roster (index 1)
          onPeriodChange(rosters[1].code);
        }
      } catch (error) {
        console.error('Error loading future roster periods:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFutureRosters();
  }, [monthsAhead, selectedPeriod, onPeriodChange]);

  if (isLoading) {
    return (
      <div className={`relative ${className}`}>
        <div className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#E4002B]"></div>
            <span className="text-sm text-gray-600">Loading roster periods...</span>
          </div>
        </div>
      </div>
    );
  }

  if (futureRosters.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <div className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
          <span className="text-sm text-gray-600">No future roster periods available</span>
        </div>
      </div>
    );
  }

  const selectedRoster = futureRosters.find((r) => r.code === selectedPeriod);

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">Select Roster Period</label>

      <select
        value={selectedPeriod || ''}
        onChange={(e) => onPeriodChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent transition-colors"
      >
        <option value="">Choose a roster period...</option>
        {futureRosters.map((roster) => (
          <option key={roster.code} value={roster.code}>
            {formatRosterPeriod(roster)}
          </option>
        ))}
      </select>

      {/* Selected Roster Details */}
      {selectedRoster && (
        <div className="mt-3 p-3 bg-[#E4002B]/5 border border-[#E4002B]/20 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium text-gray-900">Selected Period:</span>
              <span className="ml-2 font-bold text-[#E4002B]">{selectedRoster.code}</span>
            </div>
            <div className="text-gray-600">
              {selectedRoster.daysRemaining > 0 ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  {selectedRoster.daysRemaining} days remaining
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                  Future period
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-600">
            Duration: {formatRosterPeriod(selectedRoster).split(': ')[1]}
          </div>
        </div>
      )}

      {/* Air Niugini Branding Info */}
      <div className="mt-2 text-xs text-gray-500 flex items-center">
        <span className="mr-1">✈️</span>
        Air Niugini operates on 28-day roster periods for B767 fleet planning
      </div>
    </div>
  );
}
