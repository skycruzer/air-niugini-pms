'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, FastForward, Rewind } from 'lucide-react';
import { format } from 'date-fns';
import {
  getCurrentRosterPeriod,
  getNextRosterPeriod,
  getPreviousRosterPeriod,
  getFutureRosterPeriods,
  getNextRosterCountdown,
  formatCountdown,
  RosterPeriod,
  RosterCountdown,
} from '@/lib/roster-utils';

interface RosterPeriodNavigatorProps {
  currentPeriod: RosterPeriod;
  onPeriodChange: (period: RosterPeriod) => void;
  showCountdown?: boolean;
  showTimeline?: boolean;
}

export function RosterPeriodNavigator({
  currentPeriod,
  onPeriodChange,
  showCountdown = true,
  showTimeline = true,
}: RosterPeriodNavigatorProps) {
  const [countdown, setCountdown] = useState<RosterCountdown>(getNextRosterCountdown());
  const [futurePeriods, setFuturePeriods] = useState<RosterPeriod[]>([]);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getNextRosterCountdown());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load future periods for timeline
  useEffect(() => {
    const periods = getFutureRosterPeriods(6); // 6 months ahead
    setFuturePeriods(periods);
  }, [currentPeriod]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input is focused
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToCurrent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPeriod]);

  const goToPrevious = useCallback(() => {
    const prevPeriod = getPreviousRosterPeriod(currentPeriod);
    onPeriodChange(prevPeriod);
  }, [currentPeriod, onPeriodChange]);

  const goToNext = useCallback(() => {
    const nextPeriod = getNextRosterPeriod(currentPeriod);
    onPeriodChange(nextPeriod);
  }, [currentPeriod, onPeriodChange]);

  const goToCurrent = useCallback(() => {
    const current = getCurrentRosterPeriod();
    onPeriodChange(current);
  }, [onPeriodChange]);

  const jumpToPeriod = useCallback(
    (period: RosterPeriod) => {
      onPeriodChange(period);
    },
    [onPeriodChange]
  );

  const isCurrentPeriod = currentPeriod.code === getCurrentRosterPeriod().code;

  return (
    <div className="space-y-4">
      {/* Main navigation bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {/* Previous button */}
          <button
            onClick={goToPrevious}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
            aria-label="Previous roster period (←)"
            title="← Previous Period"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700 group-hover:text-[#E4002B]" />
          </button>

          {/* Current period info */}
          <div className="flex-1 text-center px-4">
            <div className="flex items-center justify-center space-x-3">
              <Calendar className="h-5 w-5 text-[#E4002B]" />

              <div>
                <h3 className="text-lg font-bold text-gray-900">{currentPeriod.code}</h3>
                <p className="text-sm text-gray-600">
                  {format(currentPeriod.startDate, 'MMM dd')} -{' '}
                  {format(currentPeriod.endDate, 'MMM dd, yyyy')}
                </p>
              </div>

              {isCurrentPeriod && (
                <span className="px-2 py-1 bg-[#E4002B] text-white text-xs font-medium rounded-full">
                  Current
                </span>
              )}
            </div>

            {/* Days remaining */}
            {isCurrentPeriod && (
              <p className="text-xs text-gray-500 mt-1">
                {currentPeriod.daysRemaining} day{currentPeriod.daysRemaining !== 1 ? 's' : ''}{' '}
                remaining
              </p>
            )}
          </div>

          {/* Next button */}
          <button
            onClick={goToNext}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
            aria-label="Next roster period (→)"
            title="→ Next Period"
          >
            <ChevronRight className="h-5 w-5 text-gray-700 group-hover:text-[#E4002B]" />
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex items-center justify-center space-x-2 mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={goToCurrent}
            disabled={isCurrentPeriod}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${
                isCurrentPeriod
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#E4002B] text-white hover:bg-[#C00020]'
              }
            `}
            title="Home - Go to current period"
          >
            Go to Current Period
          </button>

          <div className="text-xs text-gray-500 px-2">
            Keyboard: ← → (navigate) | Home (current)
          </div>
        </div>
      </div>

      {/* Countdown to next roster period */}
      {showCountdown && isCurrentPeriod && (
        <div className="bg-gradient-to-r from-[#E4002B] to-[#C00020] rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6" />
              <div>
                <h4 className="font-bold text-lg">Next Roster Period</h4>
                <p className="text-sm opacity-90">{countdown.nextRoster.code}</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold">{formatCountdown(countdown)}</div>
              <p className="text-xs opacity-90">until next period</p>
            </div>
          </div>

          {/* Detailed countdown */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <div className="text-xl font-bold">{countdown.days}</div>
              <div className="text-xs opacity-80">Days</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <div className="text-xl font-bold">{countdown.hours}</div>
              <div className="text-xs opacity-80">Hours</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <div className="text-xl font-bold">{countdown.minutes}</div>
              <div className="text-xs opacity-80">Minutes</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <div className="text-xl font-bold">{countdown.seconds}</div>
              <div className="text-xs opacity-80">Seconds</div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline of future periods */}
      {showTimeline && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Upcoming Roster Periods</h4>
            <div className="text-xs text-gray-500">Click to jump to period</div>
          </div>

          <div className="space-y-2">
            {futurePeriods.slice(0, 6).map((period) => {
              const isCurrent = period.code === currentPeriod.code;
              const isActive = period.code === getCurrentRosterPeriod().code;

              return (
                <button
                  key={period.code}
                  onClick={() => jumpToPeriod(period)}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-lg transition-all
                    ${
                      isCurrent
                        ? 'bg-[#E4002B] text-white ring-2 ring-[#E4002B] ring-offset-2'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`
                      w-2 h-2 rounded-full
                      ${isActive ? 'bg-[#FFC72C]' : isCurrent ? 'bg-white' : 'bg-gray-400'}
                    `}
                    ></div>

                    <div className="text-left">
                      <div className="font-semibold">{period.code}</div>
                      <div className={`text-xs ${isCurrent ? 'text-white/80' : 'text-gray-600'}`}>
                        {format(period.startDate, 'MMM dd')} -{' '}
                        {format(period.endDate, 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isActive && (
                      <span
                        className={`
                        px-2 py-0.5 rounded-full text-xs font-medium
                        ${isCurrent ? 'bg-white text-[#E4002B]' : 'bg-[#E4002B] text-white'}
                      `}
                      >
                        Active
                      </span>
                    )}

                    {isCurrent && (
                      <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-xs font-medium">
                        Viewing
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick jump buttons */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
            <button
              onClick={() => {
                const periods = getFutureRosterPeriods(12);
                const firstPeriod = periods[0];
                if (firstPeriod) {
                  jumpToPeriod(firstPeriod);
                }
              }}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Rewind className="h-4 w-4" />
              <span>3 months back</span>
            </button>

            <button
              onClick={() => {
                const periods = getFutureRosterPeriods(12);
                const lastPeriod = periods[periods.length - 1];
                if (lastPeriod) {
                  jumpToPeriod(lastPeriod);
                }
              }}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span>1 year ahead</span>
              <FastForward className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Period statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{currentPeriod.number}</div>
          <div className="text-xs text-blue-600">Period Number</div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">28</div>
          <div className="text-xs text-green-600">Days in Period</div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">{currentPeriod.year}</div>
          <div className="text-xs text-purple-600">Year</div>
        </div>
      </div>
    </div>
  );
}
