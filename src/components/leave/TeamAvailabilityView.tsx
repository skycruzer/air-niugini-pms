'use client';

import { useState, useMemo } from 'react';
import { format, eachDayOfInterval, isSameDay } from 'date-fns';
import { Users, Download, Filter, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { RosterPeriod } from '@/lib/roster-utils';
import { LeaveEvent } from './InteractiveRosterCalendar';

interface TeamAvailabilityViewProps {
  leaveRequests: LeaveEvent[];
  rosterPeriod: RosterPeriod;
  totalPilots?: number;
  onExport?: () => void;
}

interface DayAvailability {
  date: Date;
  available: number;
  onLeave: number;
  percentage: number;
  captainsAvailable: number;
  firstOfficersAvailable: number;
  leaves: LeaveEvent[];
}

export function TeamAvailabilityView({
  leaveRequests,
  rosterPeriod,
  totalPilots = 27,
  onExport,
}: TeamAvailabilityViewProps) {
  const [filterRole, setFilterRole] = useState<'ALL' | 'CAPTAIN' | 'FIRST_OFFICER'>('ALL');
  const [showOnlyLowAvailability, setShowOnlyLowAvailability] = useState(false);

  // Calculate availability for each day
  const dailyAvailability = useMemo((): DayAvailability[] => {
    const days = eachDayOfInterval({
      start: rosterPeriod.startDate,
      end: rosterPeriod.endDate,
    });

    return days.map((day) => {
      // Get all approved leaves for this day
      const dayLeaves = leaveRequests.filter(
        (leave) => leave.status === 'APPROVED' && day >= leave.startDate && day <= leave.endDate
      );

      // Count unique pilots on leave (a pilot can only be counted once per day)
      const uniquePilotsOnLeave = new Set(dayLeaves.map((l) => l.pilotId)).size;
      const available = totalPilots - uniquePilotsOnLeave;
      const percentage = (available / totalPilots) * 100;

      // Mock captain/FO split (in production, this would come from pilot data)
      // Assuming roughly 50/50 split for B767 fleet
      const captainsTotal = Math.floor(totalPilots / 2);
      const fosTotal = totalPilots - captainsTotal;

      // Estimate captains/FOs on leave (simplified)
      const captainsOnLeave = Math.floor(uniquePilotsOnLeave / 2);
      const fosOnLeave = uniquePilotsOnLeave - captainsOnLeave;

      return {
        date: day,
        available,
        onLeave: uniquePilotsOnLeave,
        percentage,
        captainsAvailable: captainsTotal - captainsOnLeave,
        firstOfficersAvailable: fosTotal - fosOnLeave,
        leaves: dayLeaves,
      };
    });
  }, [leaveRequests, rosterPeriod, totalPilots]);

  // Filter by role if needed
  const filteredAvailability = useMemo(() => {
    if (filterRole === 'ALL') return dailyAvailability;

    // When filtering by role, adjust the calculations
    return dailyAvailability.map((day) => {
      if (filterRole === 'CAPTAIN') {
        const total = Math.floor(totalPilots / 2);
        return {
          ...day,
          available: day.captainsAvailable,
          onLeave: total - day.captainsAvailable,
          percentage: (day.captainsAvailable / total) * 100,
        };
      } else {
        const total = totalPilots - Math.floor(totalPilots / 2);
        return {
          ...day,
          available: day.firstOfficersAvailable,
          onLeave: total - day.firstOfficersAvailable,
          percentage: (day.firstOfficersAvailable / total) * 100,
        };
      }
    });
  }, [dailyAvailability, filterRole, totalPilots]);

  // Apply low availability filter
  const displayedAvailability = useMemo(() => {
    if (!showOnlyLowAvailability) return filteredAvailability;
    return filteredAvailability.filter((day) => day.percentage < 60);
  }, [filteredAvailability, showOnlyLowAvailability]);

  // Statistics
  const stats = useMemo(() => {
    const availabilities = filteredAvailability.map((d) => d.available);
    const percentages = filteredAvailability.map((d) => d.percentage);

    return {
      averageAvailable: Math.round(
        availabilities.reduce((sum, val) => sum + val, 0) / availabilities.length
      ),
      minAvailable: Math.min(...availabilities),
      maxAvailable: Math.max(...availabilities),
      averagePercentage: Math.round(
        percentages.reduce((sum, val) => sum + val, 0) / percentages.length
      ),
      criticalDays: filteredAvailability.filter((d) => d.percentage < 40).length,
      lowDays: filteredAvailability.filter((d) => d.percentage >= 40 && d.percentage < 60).length,
      mediumDays: filteredAvailability.filter((d) => d.percentage >= 60 && d.percentage < 80)
        .length,
      highDays: filteredAvailability.filter((d) => d.percentage >= 80).length,
    };
  }, [filteredAvailability]);

  // Get color intensity based on availability percentage
  const getHeatmapColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-green-600';
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 70) return 'bg-green-400';
    if (percentage >= 60) return 'bg-yellow-400';
    if (percentage >= 50) return 'bg-orange-400';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Get text color for contrast
  const getTextColor = (percentage: number): string => {
    return percentage >= 50 ? 'text-white' : 'text-gray-900';
  };

  // Handle export
  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }

    // Default CSV export
    const csv = [
      ['Date', 'Day', 'Available', 'On Leave', 'Percentage', 'Status'].join(','),
      ...filteredAvailability.map((day) =>
        [
          format(day.date, 'yyyy-MM-dd'),
          format(day.date, 'EEEE'),
          day.available,
          day.onLeave,
          `${day.percentage.toFixed(1)}%`,
          day.percentage >= 80
            ? 'High'
            : day.percentage >= 60
              ? 'Medium'
              : day.percentage >= 40
                ? 'Low'
                : 'Critical',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `availability-${rosterPeriod.code.replace('/', '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-[#E4002B]" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">Team Availability</h3>
              <p className="text-sm text-gray-600">{rosterPeriod.code}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-3 py-2 bg-[#E4002B] text-white rounded-lg hover:bg-[#C00020] transition-colors text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filter by Role:</span>
          </div>

          <div className="flex space-x-2">
            {(['ALL', 'CAPTAIN', 'FIRST_OFFICER'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${
                    filterRole === role
                      ? 'bg-[#E4002B] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {role === 'ALL' ? 'All Pilots' : role === 'CAPTAIN' ? 'Captains' : 'First Officers'}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 ml-auto">
            <input
              type="checkbox"
              id="lowAvailability"
              checked={showOnlyLowAvailability}
              onChange={(e) => setShowOnlyLowAvailability(e.target.checked)}
              className="rounded text-[#E4002B] focus:ring-[#E4002B]"
            />
            <label htmlFor="lowAvailability" className="text-sm text-gray-700">
              Show only low availability (&lt;60%)
            </label>
          </div>
        </div>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Average Available</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.averageAvailable}</div>
          <div className="text-xs text-gray-500">{stats.averagePercentage}% capacity</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Minimum</span>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.minAvailable}</div>
          <div className="text-xs text-gray-500">Lowest availability</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Maximum</span>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.maxAvailable}</div>
          <div className="text-xs text-gray-500">Highest availability</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Critical Days</span>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.criticalDays}</div>
          <div className="text-xs text-gray-500">&lt;40% availability</div>
        </div>
      </div>

      {/* Availability breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3">Availability Distribution</h4>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.highDays}</div>
            <div className="text-xs text-gray-600 mt-1">High (≥80%)</div>
            <div className="w-full bg-green-100 rounded-full h-2 mt-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${(stats.highDays / 28) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.mediumDays}</div>
            <div className="text-xs text-gray-600 mt-1">Medium (60-79%)</div>
            <div className="w-full bg-yellow-100 rounded-full h-2 mt-2">
              <div
                className="bg-yellow-600 h-2 rounded-full"
                style={{ width: `${(stats.mediumDays / 28) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.lowDays}</div>
            <div className="text-xs text-gray-600 mt-1">Low (40-59%)</div>
            <div className="w-full bg-orange-100 rounded-full h-2 mt-2">
              <div
                className="bg-orange-600 h-2 rounded-full"
                style={{ width: `${(stats.lowDays / 28) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.criticalDays}</div>
            <div className="text-xs text-gray-600 mt-1">Critical (&lt;40%)</div>
            <div className="w-full bg-red-100 rounded-full h-2 mt-2">
              <div
                className="bg-red-600 h-2 rounded-full"
                style={{ width: `${(stats.criticalDays / 28) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap calendar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3">Daily Availability Heatmap</h4>

        <div className="grid grid-cols-7 gap-2">
          {displayedAvailability.map((day) => (
            <div
              key={day.date.toISOString()}
              className={`
                aspect-square rounded-lg p-2 transition-all cursor-pointer
                ${getHeatmapColor(day.percentage)}
                ${getTextColor(day.percentage)}
                hover:ring-2 hover:ring-[#E4002B] hover:ring-offset-2
              `}
              title={`${format(day.date, 'MMM dd, yyyy')}: ${day.available} available (${day.percentage.toFixed(1)}%)`}
            >
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-xs font-medium mb-1">{format(day.date, 'EEE')}</div>
                <div className="text-lg font-bold">{format(day.date, 'd')}</div>
                <div className="text-xs font-medium">{day.available}</div>
              </div>
            </div>
          ))}
        </div>

        {showOnlyLowAvailability && displayedAvailability.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No days with low availability (&lt;60%)</p>
            <p className="text-sm mt-1">Excellent roster coverage!</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3">Color Legend</h4>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { range: '90-100%', color: 'bg-green-600', label: 'Excellent' },
            { range: '80-89%', color: 'bg-green-500', label: 'Very Good' },
            { range: '70-79%', color: 'bg-green-400', label: 'Good' },
            { range: '60-69%', color: 'bg-yellow-400', label: 'Fair' },
            { range: '50-59%', color: 'bg-orange-400', label: 'Low' },
            { range: '<50%', color: 'bg-red-500', label: 'Critical' },
          ].map(({ range, color, label }) => (
            <div key={range} className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded ${color}`}></div>
              <div>
                <div className="text-xs font-medium text-gray-900">{label}</div>
                <div className="text-xs text-gray-500">{range}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
