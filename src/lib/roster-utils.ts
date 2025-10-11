import {
  differenceInDays,
  addDays,
  format,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  startOfDay,
} from 'date-fns';

// Constants for simple RP1-RP13 annual cycle
const ROSTER_DURATION = 28;
const PERIODS_PER_YEAR = 13; // 13 periods × 28 days = 364 days

// Known roster: RP12/2025 starts October 11, 2025
const KNOWN_ROSTER = {
  number: 12,
  year: 2025,
  startDate: new Date('2025-10-11'),
};

export interface RosterPeriod {
  code: string;
  number: number;
  year: number;
  startDate: Date;
  endDate: Date;
  daysRemaining: number;
}

/**
 * Calculate the current roster period based on RP12/2025 starting Oct 11, 2025
 * Simple annual cycle: RP1-RP13 (13 periods × 28 days = 364 days)
 * After RP13/YYYY, next period is RP1/(YYYY+1)
 */
export function getCurrentRosterPeriod(): RosterPeriod {
  // Normalize to midnight local time to avoid timezone issues
  const today = startOfDay(new Date());

  // Calculate days since known roster start
  const daysSinceKnown = differenceInDays(today, KNOWN_ROSTER.startDate);

  // Calculate how many complete periods have passed
  const periodsPassed = Math.floor(daysSinceKnown / ROSTER_DURATION);

  // Calculate roster number (wraps at 13)
  let rosterNumber = KNOWN_ROSTER.number + periodsPassed;
  let year = KNOWN_ROSTER.year;

  // Handle year rollover: after RP13, go to RP1 of next year
  while (rosterNumber > PERIODS_PER_YEAR) {
    rosterNumber -= PERIODS_PER_YEAR;
    year += 1;
  }

  // Handle past dates (before known roster)
  while (rosterNumber <= 0) {
    rosterNumber += PERIODS_PER_YEAR;
    year -= 1;
  }

  // Calculate start and end dates
  const startDate = addDays(KNOWN_ROSTER.startDate, periodsPassed * ROSTER_DURATION);
  const endDate = addDays(startDate, ROSTER_DURATION - 1);
  const daysRemaining = Math.max(0, differenceInDays(endDate, today));

  return {
    code: `RP${rosterNumber}/${year}`,
    number: rosterNumber,
    year,
    startDate,
    endDate,
    daysRemaining,
  };
}

/**
 * Get roster period from a specific date
 */
export function getRosterPeriodFromDate(date: Date): RosterPeriod {
  // Use date as-is without timezone normalization to avoid date shifting
  const targetDate = new Date(date);

  // Calculate days since known roster start (using normalized comparison)
  const daysSinceKnown = differenceInDays(targetDate, KNOWN_ROSTER.startDate);

  // Calculate how many complete periods have passed (can be negative for past dates)
  const periodsPassed = Math.floor(daysSinceKnown / ROSTER_DURATION);

  // Calculate roster number
  let rosterNumber = KNOWN_ROSTER.number + periodsPassed;
  let year = KNOWN_ROSTER.year;

  // Handle year rollover
  while (rosterNumber > PERIODS_PER_YEAR) {
    rosterNumber -= PERIODS_PER_YEAR;
    year += 1;
  }

  // Handle past dates
  while (rosterNumber <= 0) {
    rosterNumber += PERIODS_PER_YEAR;
    year -= 1;
  }

  // Calculate start and end dates
  const startDate = addDays(KNOWN_ROSTER.startDate, periodsPassed * ROSTER_DURATION);
  const endDate = addDays(startDate, ROSTER_DURATION - 1);
  const daysRemaining = Math.max(0, differenceInDays(endDate, new Date()));

  return {
    code: `RP${rosterNumber}/${year}`,
    number: rosterNumber,
    year,
    startDate,
    endDate,
    daysRemaining,
  };
}

/**
 * Get the next roster period
 */
export function getNextRosterPeriod(current: RosterPeriod): RosterPeriod {
  const nextStartDate = addDays(current.endDate, 1);
  return getRosterPeriodFromDate(nextStartDate);
}

/**
 * Get the previous roster period
 */
export function getPreviousRosterPeriod(current: RosterPeriod): RosterPeriod {
  const prevEndDate = addDays(current.startDate, -1);
  return getRosterPeriodFromDate(prevEndDate);
}

/**
 * Format roster period for display
 */
export function formatRosterPeriod(roster: RosterPeriod): string {
  const startFormatted = format(roster.startDate, 'MMM dd');
  const endFormatted = format(roster.endDate, 'MMM dd, yyyy');
  return `${roster.code}: ${startFormatted} - ${endFormatted}`;
}

/**
 * Check if a date falls within a roster period
 */
export function isDateInRoster(date: Date, roster: RosterPeriod): boolean {
  return date >= roster.startDate && date <= roster.endDate;
}

/**
 * Calculate days between two dates
 */
export function calculateDaysBetween(startDate: Date, endDate: Date): number {
  return Math.abs(differenceInDays(endDate, startDate)) + 1;
}

/**
 * Get all dates in a roster period
 */
export function getRosterDates(roster: RosterPeriod): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(roster.startDate);

  while (currentDate <= roster.endDate) {
    dates.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  return dates;
}

/**
 * Get roster periods affected by a date range (for multi-period requests)
 */
export function getAffectedRosterPeriods(startDate: Date, endDate: Date): RosterPeriod[] {
  const periods: RosterPeriod[] = [];
  const startPeriod = getRosterPeriodFromDate(startDate);
  const endPeriod = getRosterPeriodFromDate(endDate);

  // If same period, return just one
  if (startPeriod.code === endPeriod.code) {
    return [startPeriod];
  }

  // Get all periods between start and end dates
  let currentDate = new Date(startDate);
  const finalDate = new Date(endDate);

  while (currentDate <= finalDate) {
    const currentPeriod = getRosterPeriodFromDate(currentDate);

    // Add period if not already included
    if (!periods.some((p) => p.code === currentPeriod.code)) {
      periods.push(currentPeriod);
    }

    // Move to the next period's start date
    currentDate = addDays(currentPeriod.endDate, 1);
  }

  return periods;
}

/**
 * Get future roster periods (for dashboard scrolling display)
 */
export function getFutureRosterPeriods(monthsAhead: number = 12): RosterPeriod[] {
  const periods: RosterPeriod[] = [];
  const current = getCurrentRosterPeriod();
  let currentPeriod = current;

  // Calculate approximately how many periods we need for the given months
  // 13 periods per year × (months / 12)
  const periodsNeeded = Math.ceil((monthsAhead / 12) * PERIODS_PER_YEAR);

  for (let i = 0; i < periodsNeeded; i++) {
    periods.push(currentPeriod);
    currentPeriod = getNextRosterPeriod(currentPeriod);
  }

  return periods;
}

/**
 * Countdown interface for time remaining until next roster period
 */
export interface RosterCountdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  isNextRoster: boolean;
  nextRoster: RosterPeriod;
}

/**
 * Get countdown to the next roster period start
 */
export function getNextRosterCountdown(): RosterCountdown {
  const now = new Date();
  const current = getCurrentRosterPeriod();
  const next = getNextRosterPeriod(current);

  // Calculate time difference to next roster start
  const totalDays = differenceInDays(next.startDate, now);
  const totalHours = differenceInHours(next.startDate, now);
  const totalMinutes = differenceInMinutes(next.startDate, now);
  const totalSeconds = differenceInSeconds(next.startDate, now);

  // Calculate remaining time components
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;

  return {
    days: Math.max(0, days),
    hours: Math.max(0, hours),
    minutes: Math.max(0, minutes),
    seconds: Math.max(0, seconds),
    totalDays: Math.max(0, totalDays),
    isNextRoster: totalDays >= 0,
    nextRoster: next,
  };
}

/**
 * Format countdown for display
 */
export function formatCountdown(countdown: RosterCountdown): string {
  if (countdown.totalDays > 1) {
    return `${countdown.days} days, ${countdown.hours} hours`;
  } else if (countdown.days === 1) {
    return `1 day, ${countdown.hours} hours`;
  } else if (countdown.hours > 0) {
    return `${countdown.hours} hours, ${countdown.minutes} minutes`;
  } else if (countdown.minutes > 0) {
    return `${countdown.minutes} minutes`;
  } else {
    return `${countdown.seconds} seconds`;
  }
}

/**
 * Final review alert interface
 */
export interface FinalReviewAlert {
  isWithinReviewWindow: boolean;
  daysUntilRosterStarts: number;
  daysRemainingInWindow: number;
  nextRoster: RosterPeriod;
  currentRoster: RosterPeriod;
  reviewDeadlineDate: Date;
  severity: 'urgent' | 'warning' | 'info';
  message: string;
}

/**
 * Check if we're within 22 days before next roster period starts
 * This triggers a final review alert for pending leave requests
 *
 * IMPORTANT: Review deadline applies ONLY to NEXT roster period
 * - NOT for current roster period (already in progress)
 * - NOT for following rosters beyond next roster (reviewed later)
 * - Review window opens 22 days BEFORE the next roster period STARTS
 * - This allows administrators to finalize leave requests for next roster before it begins
 */
export function getFinalReviewAlert(): FinalReviewAlert {
  const REVIEW_WINDOW_DAYS = 22;
  const now = new Date();
  const current = getCurrentRosterPeriod();
  const next = getNextRosterPeriod(current);

  // Calculate days until NEXT roster starts (not current roster)
  const daysUntilRosterStarts = differenceInDays(next.startDate, now);
  const daysRemainingInWindow = Math.max(0, daysUntilRosterStarts);

  // Within review window = 22 days or less before NEXT roster starts
  const isWithinReviewWindow =
    daysUntilRosterStarts <= REVIEW_WINDOW_DAYS && daysUntilRosterStarts >= 0;

  // Calculate the review deadline (22 days before NEXT roster starts)
  const reviewDeadlineDate = addDays(next.startDate, -REVIEW_WINDOW_DAYS);

  let severity: 'urgent' | 'warning' | 'info';
  let message: string;

  if (daysUntilRosterStarts <= 3) {
    severity = 'urgent';
    message = `URGENT: Next roster ${next.code} starts in ${daysUntilRosterStarts} day(s)! All pending leave for ${next.code} must be reviewed immediately.`;
  } else if (daysUntilRosterStarts <= 7) {
    severity = 'urgent';
    message = `URGENT: Next roster ${next.code} starts in ${daysUntilRosterStarts} days. Final review window - approve or deny all pending leave requests for ${next.code}.`;
  } else if (isWithinReviewWindow) {
    severity = 'warning';
    message = `REVIEW REQUIRED: Next roster ${next.code} starts in ${daysUntilRosterStarts} days. Please review and finalize all pending leave requests for ${next.code}.`;
  } else {
    severity = 'info';
    message = `Next roster ${next.code} starts in ${daysUntilRosterStarts} days. Review window opens in ${daysUntilRosterStarts - REVIEW_WINDOW_DAYS} days.`;
  }

  return {
    isWithinReviewWindow,
    daysUntilRosterStarts,
    daysRemainingInWindow,
    nextRoster: next,
    currentRoster: current,
    reviewDeadlineDate,
    severity,
    message,
  };
}
