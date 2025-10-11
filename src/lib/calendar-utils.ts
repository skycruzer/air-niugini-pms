/**
 * @fileoverview Calendar utilities for Air Niugini B767 Pilot Management System
 * Provides comprehensive calendar functionality for roster periods, leave requests,
 * and certification expiry tracking. All calculations are based on 28-day roster cycles.
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-27
 */

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isWithinInterval,
  addDays,
  differenceInDays,
  startOfWeek,
  endOfWeek,
} from 'date-fns';

/**
 * Represents a 28-day roster period in the Air Niugini scheduling system
 * Each roster period spans exactly 28 days and is identified by a sequential number and year
 *
 * @interface RosterPeriod
 * @property {string} code - Formatted roster code (e.g., "RP13/2025")
 * @property {number} number - Roster period number within the year (1-13)
 * @property {number} year - Calendar year of the roster period
 * @property {Date} startDate - First day of the roster period
 * @property {Date} endDate - Last day of the roster period
 */
export interface RosterPeriod {
  code: string;
  number: number;
  year: number;
  startDate: Date;
  endDate: Date;
}

/**
 * Represents a single day in the calendar view with associated metadata
 * Contains all information needed to render a calendar day with events and context
 *
 * @interface CalendarDay
 * @property {Date} date - The calendar date
 * @property {boolean} isInCurrentMonth - Whether this day belongs to the displayed month
 * @property {boolean} isToday - Whether this day is today's date
 * @property {RosterPeriod} [rosterPeriod] - Associated roster period information
 * @property {CalendarEvent[]} events - Array of events occurring on this day
 */
export interface CalendarDay {
  date: Date;
  isInCurrentMonth: boolean;
  isToday: boolean;
  rosterPeriod?: RosterPeriod;
  events: CalendarEvent[];
}

/**
 * Represents an event that can be displayed on the calendar
 * Used for leave requests, certification expiries, and roster boundaries
 *
 * @interface CalendarEvent
 * @property {string} id - Unique identifier for the event
 * @property {'leave' | 'certification' | 'roster-boundary'} type - Event type for styling and behavior
 * @property {string} title - Display title for the event
 * @property {string} [description] - Optional detailed description
 * @property {string} color - CSS color for event styling (e.g., "#4F46E5")
 * @property {any} [data] - Optional additional data payload
 */
export interface CalendarEvent {
  id: string;
  type: 'leave' | 'certification' | 'roster-boundary';
  title: string;
  description?: string;
  color: string;
  data?: any;
}

/**
 * Air Niugini roster period configuration constants
 * Based on the airline's 28-day operational cycle system
 */

/** Standard roster period duration in days */
const ROSTER_DURATION = 28;

/** Known reference roster period for calculations */
const KNOWN_ROSTER = {
  /** Reference roster period number */
  number: 11,
  /** Reference year */
  year: 2025,
  /** Known end date for calculation base */
  endDate: new Date('2025-10-10'),
};

/**
 * Calculate roster period for a given date
 */
export function getRosterPeriodForDate(date: Date): RosterPeriod {
  const daysSinceKnown = differenceInDays(date, KNOWN_ROSTER.endDate);
  const periodsPassed = Math.floor(daysSinceKnown / ROSTER_DURATION);

  const totalPeriods = KNOWN_ROSTER.number + periodsPassed;
  const year = KNOWN_ROSTER.year + Math.floor(totalPeriods / 13);
  const number = totalPeriods % 13 || 13;

  const startDate = addDays(KNOWN_ROSTER.endDate, periodsPassed * ROSTER_DURATION + 1);
  const endDate = addDays(KNOWN_ROSTER.endDate, (periodsPassed + 1) * ROSTER_DURATION);

  return {
    code: `RP${number}/${year}`,
    number,
    year,
    startDate,
    endDate,
  };
}

/**
 * Get all roster periods that overlap with a date range
 */
export function getRosterPeriodsInRange(startDate: Date, endDate: Date): RosterPeriod[] {
  const periods: RosterPeriod[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const rosterPeriod = getRosterPeriodForDate(currentDate);

    // Add if not already in array
    if (!periods.find((p) => p.code === rosterPeriod.code)) {
      periods.push(rosterPeriod);
    }

    currentDate = addDays(rosterPeriod.endDate, 1);
  }

  return periods;
}

/**
 * Generate calendar grid for a month with roster period information
 */
export function generateCalendarMonth(year: number, month: number): CalendarDay[] {
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const today = new Date();

  return days.map((date) => {
    const rosterPeriod = getRosterPeriodForDate(date);

    return {
      date,
      isInCurrentMonth: date.getMonth() === month,
      isToday: isSameDay(date, today),
      rosterPeriod,
      events: [],
    };
  });
}

/**
 * Add leave request events to calendar days
 */
export function addLeaveRequestsToCalendar(
  calendarDays: CalendarDay[],
  leaveRequests: any[]
): CalendarDay[] {
  return calendarDays.map((day) => {
    const dayEvents = leaveRequests
      .filter((request) => {
        const startDate = new Date(request.start_date);
        const endDate = new Date(request.end_date);
        return isWithinInterval(day.date, { start: startDate, end: endDate });
      })
      .map((request) => ({
        id: request.id,
        type: 'leave' as const,
        title: `${request.pilot_name} - ${request.request_type}`,
        description: request.reason,
        color: getLeaveTypeColor(request.request_type, request.status),
        data: request,
      }));

    return {
      ...day,
      events: [...day.events, ...dayEvents],
    };
  });
}

/**
 * Add certification expiry events to calendar days
 */
export function addCertificationExpiryToCalendar(
  calendarDays: CalendarDay[],
  certifications: any[]
): CalendarDay[] {
  return calendarDays.map((day) => {
    const dayEvents = certifications
      .filter((cert) => cert.expiry_date && isSameDay(new Date(cert.expiry_date), day.date))
      .map((cert) => ({
        id: `cert-${cert.pilot_name}-${cert.check_code}`,
        type: 'certification' as const,
        title: `${cert.pilot_name} - ${cert.check_code}`,
        description: cert.check_description,
        color: getCertificationStatusColor(cert.status),
        data: cert,
      }));

    return {
      ...day,
      events: [...day.events, ...dayEvents],
    };
  });
}

/**
 * Add roster boundary events to calendar days
 */
export function addRosterBoundariesToCalendar(calendarDays: CalendarDay[]): CalendarDay[] {
  return calendarDays.map((day) => {
    const rosterEvents = [];

    // Add roster start event
    if (isSameDay(day.date, day.rosterPeriod!.startDate)) {
      rosterEvents.push({
        id: `roster-start-${day.rosterPeriod!.code}`,
        type: 'roster-boundary' as const,
        title: `${day.rosterPeriod!.code} Starts`,
        color: '#4F46E5', // Air Niugini red
        data: day.rosterPeriod,
      });
    }

    // Add roster end event
    if (isSameDay(day.date, day.rosterPeriod!.endDate)) {
      rosterEvents.push({
        id: `roster-end-${day.rosterPeriod!.code}`,
        type: 'roster-boundary' as const,
        title: `${day.rosterPeriod!.code} Ends`,
        color: '#06B6D4', // Air Niugini gold
        data: day.rosterPeriod,
      });
    }

    return {
      ...day,
      events: [...day.events, ...rosterEvents],
    };
  });
}

/**
 * Get color for leave request type and status
 */
function getLeaveTypeColor(requestType: string, status: string): string {
  if (status === 'DENIED') return '#EF4444'; // Red
  if (status === 'PENDING') return '#F59E0B'; // Amber

  switch (requestType) {
    case 'RDO':
      return '#10B981'; // Green
    case 'WDO':
      return '#3B82F6'; // Blue
    case 'ANNUAL':
      return '#8B5CF6'; // Purple
    case 'SICK':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
}

/**
 * Get color for certification status
 */
function getCertificationStatusColor(status: any): string {
  if (!status) return '#6B7280';

  switch (status.color) {
    case 'green':
      return '#10B981';
    case 'yellow':
      return '#F59E0B';
    case 'red':
      return '#EF4444';
    default:
      return '#6B7280';
  }
}

/**
 * Format roster period for display
 */
export function formatRosterPeriod(rosterPeriod: RosterPeriod): string {
  return `${rosterPeriod.code} (${format(rosterPeriod.startDate, 'MMM d')} - ${format(rosterPeriod.endDate, 'MMM d, yyyy')})`;
}

/**
 * Check if a date is within a roster period
 */
export function isDateInRosterPeriod(date: Date, rosterPeriod: RosterPeriod): boolean {
  return isWithinInterval(date, {
    start: rosterPeriod.startDate,
    end: rosterPeriod.endDate,
  });
}
