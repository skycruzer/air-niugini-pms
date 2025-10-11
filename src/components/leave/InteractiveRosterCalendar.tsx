'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  closestCenter,
} from '@dnd-kit/core';
import {
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { LeaveRequest } from '@/lib/leave-service';
import { RosterPeriod, getRosterPeriodFromDate, getCurrentRosterPeriod } from '@/lib/roster-utils';

export interface LeaveEvent {
  id: string;
  pilotName: string;
  employeeId: string;
  pilotId: string;
  requestType: 'RDO' | 'SDO' | 'ANNUAL' | 'SICK' | 'LSL' | 'LWOP' | 'MATERNITY' | 'COMPASSIONATE';
  startDate: Date;
  endDate: Date;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  daysCount: number;
}

interface InteractiveRosterCalendarProps {
  leaveRequests: LeaveEvent[];
  onDateChange?: (leaveId: string, newStartDate: Date, newEndDate: Date) => Promise<void>;
  onConflictDetected?: (conflicts: LeaveEvent[]) => void;
  readonly?: boolean;
}

// Leave type color mapping (Air Niugini branded)
const LEAVE_TYPE_COLORS = {
  RDO: {
    bg: 'bg-blue-100',
    border: 'border-blue-400',
    text: 'text-blue-800',
    darkBg: 'bg-blue-500',
  },
  SDO: {
    bg: 'bg-purple-100',
    border: 'border-purple-400',
    text: 'text-purple-800',
    darkBg: 'bg-purple-500',
  },
  ANNUAL: {
    bg: 'bg-green-100',
    border: 'border-green-400',
    text: 'text-green-800',
    darkBg: 'bg-green-500',
  },
  SICK: { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800', darkBg: 'bg-red-500' },
  LSL: {
    bg: 'bg-[#06B6D4]/20',
    border: 'border-[#06B6D4]',
    text: 'text-yellow-900',
    darkBg: 'bg-[#06B6D4]',
  },
  LWOP: {
    bg: 'bg-gray-100',
    border: 'border-gray-400',
    text: 'text-gray-800',
    darkBg: 'bg-gray-500',
  },
  MATERNITY: {
    bg: 'bg-pink-100',
    border: 'border-pink-400',
    text: 'text-pink-800',
    darkBg: 'bg-pink-500',
  },
  COMPASSIONATE: {
    bg: 'bg-indigo-100',
    border: 'border-indigo-400',
    text: 'text-indigo-800',
    darkBg: 'bg-indigo-500',
  },
};

// Status color mapping
const STATUS_COLORS = {
  PENDING: 'border-yellow-500 bg-yellow-50',
  APPROVED: 'border-green-500 bg-green-50',
  DENIED: 'border-red-500 bg-red-50',
};

export function InteractiveRosterCalendar({
  leaveRequests,
  onDateChange,
  onConflictDetected,
  readonly = false,
}: InteractiveRosterCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedLeave, setDraggedLeave] = useState<LeaveEvent | null>(null);
  const [rosterPeriod, setRosterPeriod] = useState<RosterPeriod>(getCurrentRosterPeriod());
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<LeaveEvent | null>(null);

  // Update roster period when month changes
  useEffect(() => {
    const newRoster = getRosterPeriodFromDate(currentMonth);
    setRosterPeriod(newRoster);
  }, [currentMonth]);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms delay for touch
        tolerance: 5,
      },
    })
  );

  // Calculate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Group leave requests by date
  const leaveByDate = useMemo(() => {
    const grouped = new Map<string, LeaveEvent[]>();

    leaveRequests.forEach((leave) => {
      const days = eachDayOfInterval({ start: leave.startDate, end: leave.endDate });
      days.forEach((day) => {
        const key = format(day, 'yyyy-MM-dd');
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(leave);
      });
    });

    return grouped;
  }, [leaveRequests]);

  // Calculate pilot availability per day
  const availabilityByDate = useMemo(() => {
    const availability = new Map<string, number>();
    const totalPilots = 27; // Air Niugini B767 fleet

    calendarDays.forEach((day) => {
      const key = format(day, 'yyyy-MM-dd');
      const leaves = leaveByDate.get(key) || [];
      const onLeave = new Set(leaves.filter((l) => l.status === 'APPROVED').map((l) => l.pilotId))
        .size;
      availability.set(key, totalPilots - onLeave);
    });

    return availability;
  }, [calendarDays, leaveByDate]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    if (readonly) return;

    const leave = leaveRequests.find((l) => l.id === event.active.id);
    if (leave) {
      setActiveId(leave.id);
      setDraggedLeave(leave);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    if (readonly) return;

    const { active, over } = event;

    if (!over || !draggedLeave) {
      setActiveId(null);
      setDraggedLeave(null);
      return;
    }

    const newStartDate = parseISO(over.id as string);
    const duration = draggedLeave.daysCount;
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + duration - 1);

    // Check if the dates changed
    if (!isSameDay(draggedLeave.startDate, newStartDate)) {
      // Validate roster period boundary
      const newRoster = getRosterPeriodFromDate(newStartDate);
      if (newRoster.code !== getRosterPeriodFromDate(draggedLeave.startDate).code) {
        alert('Cannot move leave across roster periods');
        setActiveId(null);
        setDraggedLeave(null);
        return;
      }

      // Check for conflicts
      const conflicts = checkDateConflicts(
        draggedLeave.pilotId,
        newStartDate,
        newEndDate,
        draggedLeave.id
      );
      if (conflicts.length > 0) {
        onConflictDetected?.(conflicts);
        alert(`Conflict detected: Overlapping leave for this pilot`);
        setActiveId(null);
        setDraggedLeave(null);
        return;
      }

      // Update the leave request (async operation)
      if (onDateChange) {
        onDateChange(draggedLeave.id, newStartDate, newEndDate).catch((error) => {
          console.error('Failed to update leave dates:', error);
          alert('Failed to update leave dates');
        });
      }
    }

    setActiveId(null);
    setDraggedLeave(null);
  };

  // Check for date conflicts
  const checkDateConflicts = (
    pilotId: string,
    startDate: Date,
    endDate: Date,
    excludeId?: string
  ): LeaveEvent[] => {
    return leaveRequests.filter((leave) => {
      if (leave.id === excludeId) return false;
      if (leave.pilotId !== pilotId) return false;
      if (leave.status === 'DENIED') return false;

      const overlap =
        (startDate >= leave.startDate && startDate <= leave.endDate) ||
        (endDate >= leave.startDate && endDate <= leave.endDate) ||
        (startDate <= leave.startDate && endDate >= leave.endDate);

      return overlap;
    });
  };

  // Get availability color intensity
  const getAvailabilityColor = (available: number): string => {
    const percentage = (available / 27) * 100;
    if (percentage >= 80) return 'bg-green-50';
    if (percentage >= 60) return 'bg-yellow-50';
    if (percentage >= 40) return 'bg-orange-50';
    return 'bg-red-50';
  };

  // Navigate months
  const goToPreviousMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));
  const goToToday = () => setCurrentMonth(new Date());

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h2>
            <p className="text-sm text-gray-600">
              {rosterPeriod.code}: {format(rosterPeriod.startDate, 'MMM dd')} -{' '}
              {format(rosterPeriod.endDate, 'MMM dd')}
            </p>
          </div>

          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] transition-colors text-sm font-medium"
          >
            Today
          </button>

          <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
            <Users className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">27 Pilots</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-semibold text-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-200">
            {calendarDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayLeaves = leaveByDate.get(dateKey) || [];
              const available = availabilityByDate.get(dateKey) || 27;
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isToday = isSameDay(day, new Date());
              const isRosterPeriod = isWithinInterval(day, {
                start: rosterPeriod.startDate,
                end: rosterPeriod.endDate,
              });

              return (
                <div
                  key={dateKey}
                  id={dateKey}
                  className={`
                    min-h-[120px] p-2 relative transition-colors
                    ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                    ${isToday ? 'ring-2 ring-[#4F46E5] ring-inset' : ''}
                    ${isRosterPeriod ? 'bg-blue-50/30' : ''}
                    ${getAvailabilityColor(available)}
                    hover:bg-gray-50
                  `}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`
                      text-sm font-medium
                      ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                      ${isToday ? 'bg-[#4F46E5] text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}
                    `}
                    >
                      {format(day, 'd')}
                    </span>

                    {/* Availability indicator */}
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">{available}</span>
                      {available < 15 && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                    </div>
                  </div>

                  {/* Leave events */}
                  <div className="space-y-1">
                    {dayLeaves.slice(0, 3).map((leave) => {
                      const colors = LEAVE_TYPE_COLORS[leave.requestType];
                      const isStart = isSameDay(leave.startDate, day);
                      const isEnd = isSameDay(leave.endDate, day);

                      return (
                        <div
                          key={leave.id}
                          id={leave.id}
                          className={`
                            text-xs px-1 py-0.5 rounded border cursor-pointer
                            ${colors.bg} ${colors.border} ${colors.text}
                            ${STATUS_COLORS[leave.status]}
                            hover:opacity-80 transition-opacity
                            ${!readonly && leave.status === 'PENDING' ? 'cursor-move' : 'cursor-default'}
                          `}
                          onClick={() => setSelectedLeave(leave)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">
                              {isStart && leave.pilotName.split(' ')[0]}
                            </span>
                            <span className="text-[10px]">{leave.requestType}</span>
                          </div>
                        </div>
                      );
                    })}

                    {dayLeaves.length > 3 && (
                      <div className="text-xs text-gray-500 font-medium text-center">
                        +{dayLeaves.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {draggedLeave && (
            <div
              className={`
              px-3 py-2 rounded-lg border-2 shadow-lg
              ${LEAVE_TYPE_COLORS[draggedLeave.requestType].darkBg}
              text-white font-medium text-sm opacity-90
            `}
            >
              {draggedLeave.pilotName} - {draggedLeave.requestType}
              <div className="text-xs opacity-80">
                {draggedLeave.daysCount} day{draggedLeave.daysCount !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Selected leave details */}
      {selectedLeave && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Leave Details</h3>
            <button
              onClick={() => setSelectedLeave(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Pilot:</span>
              <p className="font-medium">{selectedLeave.pilotName}</p>
            </div>
            <div>
              <span className="text-gray-600">Employee ID:</span>
              <p className="font-medium">{selectedLeave.employeeId}</p>
            </div>
            <div>
              <span className="text-gray-600">Type:</span>
              <p className="font-medium">{selectedLeave.requestType}</p>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <p
                className={`font-medium ${
                  selectedLeave.status === 'APPROVED'
                    ? 'text-green-600'
                    : selectedLeave.status === 'PENDING'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {selectedLeave.status}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Start:</span>
              <p className="font-medium">{format(selectedLeave.startDate, 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <span className="text-gray-600">End:</span>
              <p className="font-medium">{format(selectedLeave.endDate, 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <span className="text-gray-600">Duration:</span>
              <p className="font-medium">{selectedLeave.daysCount} days</p>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-3">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {Object.entries(LEAVE_TYPE_COLORS).map(([type, colors]) => (
            <div key={type} className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded ${colors.darkBg}`} />
              <span>{type}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">Availability Indicators:</p>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-green-50 border border-gray-300 rounded" />
              <span>High (≥80%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-yellow-50 border border-gray-300 rounded" />
              <span>Medium (60-79%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-orange-50 border border-gray-300 rounded" />
              <span>Low (40-59%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-red-50 border border-gray-300 rounded" />
              <span>Critical (&lt;40%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
