import { differenceInDays, addDays, format, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns'

// Constants based on the current roster information
const ROSTER_DURATION = 28
const KNOWN_ROSTER = {
  number: 11,
  year: 2025,
  endDate: new Date('2025-10-10')
}

// Special year transition logic - RP14/2025 ends on 2/1/26, then RP1/2026 starts 3/1/26
const YEAR_2025_LAST_ROSTER_END = new Date('2026-01-02') // 2/1/26 (end of RP14/2025)
const YEAR_2026_FIRST_ROSTER_START = new Date('2026-01-03') // 3/1/26 (start of RP1/2026)
const LAST_ROSTER_NUMBER_2025 = 14 // RP14/2025 is the last roster of 2025

export interface RosterPeriod {
  code: string
  number: number
  year: number
  startDate: Date
  endDate: Date
  daysRemaining: number
}

/**
 * Get the roster number of the last roster of 2025 (RP14/2025 ends 2/1/26)
 */
function getLastRosterOf2025(): number {
  return LAST_ROSTER_NUMBER_2025
}

/**
 * Calculate the current roster period based on the known roster RP11/2025
 */
export function getCurrentRosterPeriod(): RosterPeriod {
  const today = new Date()

  // Check if we're still in the known roster period
  if (today <= KNOWN_ROSTER.endDate) {
    const knownStartDate = addDays(KNOWN_ROSTER.endDate, -ROSTER_DURATION + 1)
    const daysRemaining = Math.max(0, differenceInDays(KNOWN_ROSTER.endDate, today))

    return {
      code: `RP${KNOWN_ROSTER.number}/${KNOWN_ROSTER.year}`,
      number: KNOWN_ROSTER.number,
      year: KNOWN_ROSTER.year,
      startDate: knownStartDate,
      endDate: KNOWN_ROSTER.endDate,
      daysRemaining
    }
  }

  // Get the last roster number of 2025
  const lastRosterOf2025 = getLastRosterOf2025()

  // Calculate for periods after the known roster
  const daysSinceKnown = differenceInDays(today, KNOWN_ROSTER.endDate)
  const periodsPassed = Math.floor(daysSinceKnown / ROSTER_DURATION)
  let rosterNumber = KNOWN_ROSTER.number + periodsPassed + 1
  let year = KNOWN_ROSTER.year

  // Handle the special year transition
  if (rosterNumber > lastRosterOf2025) {
    // We're past the last roster of 2025, calculate for 2026
    year = 2026

    // Special handling for the gap between 2/1/26 and 3/1/26
    if (today > YEAR_2025_LAST_ROSTER_END && today < YEAR_2026_FIRST_ROSTER_START) {
      // We're in the gap between years - use the first roster of 2026
      rosterNumber = 1
      const startDate = YEAR_2026_FIRST_ROSTER_START
      const endDate = addDays(startDate, ROSTER_DURATION - 1)
      const daysRemaining = Math.max(0, differenceInDays(endDate, today))

      return {
        code: `RP${rosterNumber}/${year}`,
        number: rosterNumber,
        year: year,
        startDate,
        endDate,
        daysRemaining
      }
    }

    // Calculate which roster of 2026 we're in
    if (today >= YEAR_2026_FIRST_ROSTER_START) {
      const daysSince2026Start = differenceInDays(today, YEAR_2026_FIRST_ROSTER_START)
      const periodsSince2026 = Math.floor(daysSince2026Start / ROSTER_DURATION)
      rosterNumber = 1 + periodsSince2026
    } else {
      rosterNumber = 1
    }
  }

  // Calculate dates based on the roster number and year
  let startDate: Date
  let endDate: Date

  if (year === 2025) {
    // Regular calculation for 2025 rosters
    startDate = addDays(KNOWN_ROSTER.endDate, periodsPassed * ROSTER_DURATION + 1)
    endDate = addDays(KNOWN_ROSTER.endDate, (periodsPassed + 1) * ROSTER_DURATION)
  } else {
    // 2026 rosters start from the special date
    const periodsFrom2026Start = rosterNumber - 1
    startDate = addDays(YEAR_2026_FIRST_ROSTER_START, periodsFrom2026Start * ROSTER_DURATION)
    endDate = addDays(startDate, ROSTER_DURATION - 1)
  }

  const daysRemaining = Math.max(0, differenceInDays(endDate, today))

  return {
    code: `RP${rosterNumber}/${year}`,
    number: rosterNumber,
    year: year,
    startDate,
    endDate,
    daysRemaining
  }
}

/**
 * Get roster period from a specific date
 */
export function getRosterPeriodFromDate(date: Date): RosterPeriod {
  const targetDate = new Date(date)

  // Check if the date is within the known roster period
  const knownStartDate = addDays(KNOWN_ROSTER.endDate, -ROSTER_DURATION + 1)
  if (targetDate >= knownStartDate && targetDate <= KNOWN_ROSTER.endDate) {
    return {
      code: `RP${KNOWN_ROSTER.number}/${KNOWN_ROSTER.year}`,
      number: KNOWN_ROSTER.number,
      year: KNOWN_ROSTER.year,
      startDate: knownStartDate,
      endDate: KNOWN_ROSTER.endDate,
      daysRemaining: Math.max(0, differenceInDays(KNOWN_ROSTER.endDate, new Date()))
    }
  }

  // Get the last roster number of 2025
  const lastRosterOf2025 = getLastRosterOf2025()

  // Handle dates before the known roster (past dates)
  if (targetDate < knownStartDate) {
    const daysBefore = differenceInDays(knownStartDate, targetDate)
    const periodsBefore = Math.ceil(daysBefore / ROSTER_DURATION)
    let rosterNumber = KNOWN_ROSTER.number - periodsBefore
    let year = KNOWN_ROSTER.year

    // Handle year transitions for past dates
    while (rosterNumber <= 0) {
      year -= 1
      rosterNumber += 13 // Assuming 13 periods per year for past years
    }

    const startDate = addDays(knownStartDate, -periodsBefore * ROSTER_DURATION)
    const endDate = addDays(startDate, ROSTER_DURATION - 1)

    return {
      code: `RP${rosterNumber}/${year}`,
      number: rosterNumber,
      year: year,
      startDate,
      endDate,
      daysRemaining: Math.max(0, differenceInDays(endDate, new Date()))
    }
  }

  // Handle future dates
  const daysSinceKnown = differenceInDays(targetDate, KNOWN_ROSTER.endDate)
  const periodsPassed = Math.floor(daysSinceKnown / ROSTER_DURATION)
  let rosterNumber = KNOWN_ROSTER.number + periodsPassed + 1
  let year = KNOWN_ROSTER.year

  // Check if we're dealing with 2026 or later
  if (rosterNumber > lastRosterOf2025 || targetDate > YEAR_2025_LAST_ROSTER_END) {
    year = 2026

    // Special case: dates in the gap between 2/1/26 and 3/1/26
    if (targetDate > YEAR_2025_LAST_ROSTER_END && targetDate < YEAR_2026_FIRST_ROSTER_START) {
      // Return the first roster of 2026 (starts 3/1/26)
      return {
        code: 'RP1/2026',
        number: 1,
        year: 2026,
        startDate: YEAR_2026_FIRST_ROSTER_START,
        endDate: addDays(YEAR_2026_FIRST_ROSTER_START, ROSTER_DURATION - 1),
        daysRemaining: Math.max(0, differenceInDays(addDays(YEAR_2026_FIRST_ROSTER_START, ROSTER_DURATION - 1), new Date()))
      }
    }

    // Calculate which roster of 2026 this date falls in
    if (targetDate >= YEAR_2026_FIRST_ROSTER_START) {
      const daysSince2026Start = differenceInDays(targetDate, YEAR_2026_FIRST_ROSTER_START)
      const periodsSince2026 = Math.floor(daysSince2026Start / ROSTER_DURATION)
      rosterNumber = 1 + periodsSince2026
    } else {
      rosterNumber = 1
    }
  }

  // Calculate dates based on the roster number and year
  let startDate: Date
  let endDate: Date

  if (year === 2025) {
    // Regular calculation for 2025 rosters
    startDate = addDays(KNOWN_ROSTER.endDate, periodsPassed * ROSTER_DURATION + 1)
    endDate = addDays(KNOWN_ROSTER.endDate, (periodsPassed + 1) * ROSTER_DURATION)
  } else {
    // 2026 rosters start from the special date
    const periodsFrom2026Start = rosterNumber - 1
    startDate = addDays(YEAR_2026_FIRST_ROSTER_START, periodsFrom2026Start * ROSTER_DURATION)
    endDate = addDays(startDate, ROSTER_DURATION - 1)
  }

  return {
    code: `RP${rosterNumber}/${year}`,
    number: rosterNumber,
    year: year,
    startDate,
    endDate,
    daysRemaining: Math.max(0, differenceInDays(endDate, new Date()))
  }
}

/**
 * Get the next roster period
 */
export function getNextRosterPeriod(current: RosterPeriod): RosterPeriod {
  const nextStartDate = addDays(current.endDate, 1)
  return getRosterPeriodFromDate(nextStartDate)
}

/**
 * Get the previous roster period
 */
export function getPreviousRosterPeriod(current: RosterPeriod): RosterPeriod {
  const prevEndDate = addDays(current.startDate, -1)
  return getRosterPeriodFromDate(prevEndDate)
}

/**
 * Format roster period for display
 */
export function formatRosterPeriod(roster: RosterPeriod): string {
  const startFormatted = format(roster.startDate, 'MMM dd')
  const endFormatted = format(roster.endDate, 'MMM dd, yyyy')
  return `${roster.code}: ${startFormatted} - ${endFormatted}`
}

/**
 * Check if a date falls within a roster period
 */
export function isDateInRoster(date: Date, roster: RosterPeriod): boolean {
  return date >= roster.startDate && date <= roster.endDate
}

/**
 * Calculate days between two dates
 */
export function calculateDaysBetween(startDate: Date, endDate: Date): number {
  return Math.abs(differenceInDays(endDate, startDate)) + 1
}

/**
 * Get all dates in a roster period
 */
export function getRosterDates(roster: RosterPeriod): Date[] {
  const dates: Date[] = []
  let currentDate = new Date(roster.startDate)

  while (currentDate <= roster.endDate) {
    dates.push(new Date(currentDate))
    currentDate = addDays(currentDate, 1)
  }

  return dates
}

/**
 * Get roster periods affected by a date range (for multi-period requests)
 */
export function getAffectedRosterPeriods(startDate: Date, endDate: Date): RosterPeriod[] {
  const periods: RosterPeriod[] = []
  const startPeriod = getRosterPeriodFromDate(startDate)
  const endPeriod = getRosterPeriodFromDate(endDate)

  // If same period, return just one
  if (startPeriod.code === endPeriod.code) {
    return [startPeriod]
  }

  // Get all periods between start and end dates
  let currentDate = new Date(startDate)
  const finalDate = new Date(endDate)

  while (currentDate <= finalDate) {
    const currentPeriod = getRosterPeriodFromDate(currentDate)

    // Add period if not already included
    if (!periods.some(p => p.code === currentPeriod.code)) {
      periods.push(currentPeriod)
    }

    // Move to the next period's start date
    currentDate = addDays(currentPeriod.endDate, 1)
  }

  return periods
}

/**
 * Get future roster periods (for dashboard scrolling display)
 */
export function getFutureRosterPeriods(monthsAhead: number = 12): RosterPeriod[] {
  const periods: RosterPeriod[] = []
  const current = getCurrentRosterPeriod()
  let currentPeriod = current

  // Calculate approximately how many periods we need for the given months
  // Roughly 365 days / 28 days per period = ~13 periods per year
  const periodsNeeded = Math.ceil((monthsAhead * 30) / ROSTER_DURATION)

  for (let i = 0; i < periodsNeeded; i++) {
    periods.push(currentPeriod)
    currentPeriod = getNextRosterPeriod(currentPeriod)
  }

  return periods
}

/**
 * Countdown interface for time remaining until next roster period
 */
export interface RosterCountdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalDays: number
  isNextRoster: boolean
  nextRoster: RosterPeriod
}

/**
 * Get countdown to the next roster period start
 */
export function getNextRosterCountdown(): RosterCountdown {
  const now = new Date()
  const current = getCurrentRosterPeriod()
  const next = getNextRosterPeriod(current)

  // Calculate time difference to next roster start
  const totalDays = differenceInDays(next.startDate, now)
  const totalHours = differenceInHours(next.startDate, now)
  const totalMinutes = differenceInMinutes(next.startDate, now)
  const totalSeconds = differenceInSeconds(next.startDate, now)

  // Calculate remaining time components
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  const minutes = totalMinutes % 60
  const seconds = totalSeconds % 60

  return {
    days: Math.max(0, days),
    hours: Math.max(0, hours),
    minutes: Math.max(0, minutes),
    seconds: Math.max(0, seconds),
    totalDays: Math.max(0, totalDays),
    isNextRoster: totalDays >= 0,
    nextRoster: next
  }
}

/**
 * Format countdown for display
 */
export function formatCountdown(countdown: RosterCountdown): string {
  if (countdown.totalDays > 1) {
    return `${countdown.days} days, ${countdown.hours} hours`
  } else if (countdown.days === 1) {
    return `1 day, ${countdown.hours} hours`
  } else if (countdown.hours > 0) {
    return `${countdown.hours} hours, ${countdown.minutes} minutes`
  } else if (countdown.minutes > 0) {
    return `${countdown.minutes} minutes`
  } else {
    return `${countdown.seconds} seconds`
  }
}