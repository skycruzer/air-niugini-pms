/**
 * @fileoverview Retirement calculation utilities for Air Niugini B767 PMS
 * Provides retirement tracking based on pilot date of birth and configurable retirement age
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-27
 */

import { settingsService } from './settings-service';

export interface RetirementInfo {
  retirementDate: Date;
  yearsToRetirement: number;
  monthsToRetirement: number;
  daysToRetirement: number;
  isNearingRetirement: boolean; // < 5 years
  retirementStatus: 'active' | 'nearing' | 'due_soon' | 'overdue';
  displayText: string;
}

export interface PilotWithRetirement {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  retirement: RetirementInfo | null;
}

/**
 * Calculate retirement information for a pilot based on their date of birth
 * @param dateOfBirth - Pilot's date of birth (ISO string or Date)
 * @param retirementAge - Retirement age (defaults to 65 if not provided)
 * @returns RetirementInfo object with calculated retirement details
 */
export function calculateRetirementInfo(
  dateOfBirth: string | Date | null,
  retirementAge: number = 65
): RetirementInfo | null {
  if (!dateOfBirth) {
    return null;
  }

  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  // Calculate retirement date (birthday on retirement year)
  const retirementDate = new Date(birthDate);
  retirementDate.setFullYear(birthDate.getFullYear() + retirementAge);

  // Calculate time remaining
  const timeDiff = retirementDate.getTime() - today.getTime();
  const daysToRetirement = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  // More accurate years calculation using actual age vs retirement age
  const currentAge = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  const actualAge = hasHadBirthdayThisYear ? currentAge : currentAge - 1;
  const yearsToRetirement = retirementAge - actualAge;

  // Convert remaining days to months and days
  const remainingDaysAfterYears = daysToRetirement - yearsToRetirement * 365.25;
  const monthsToRetirement = Math.floor(remainingDaysAfterYears / 30.44);
  const finalDaysToRetirement = Math.floor(remainingDaysAfterYears - monthsToRetirement * 30.44);

  // Determine status
  const isNearingRetirement = yearsToRetirement < 5;
  let retirementStatus: RetirementInfo['retirementStatus'] = 'active';

  if (daysToRetirement < 0) {
    retirementStatus = 'overdue';
  } else if (daysToRetirement <= 365) {
    retirementStatus = 'due_soon';
  } else if (isNearingRetirement) {
    retirementStatus = 'nearing';
  }

  // Generate display text based on user requirements:
  // >2 years: "x years to retirement"
  // >1 year but ≤2 years: "x years and x months to retirement"
  // ≤1 year: "x months and x days to retirement"
  let displayText = '';
  if (daysToRetirement < 0) {
    displayText = `Retired ${Math.abs(Math.floor(daysToRetirement / 365.25))} year${Math.abs(Math.floor(daysToRetirement / 365.25)) !== 1 ? 's' : ''} ago`;
  } else if (yearsToRetirement > 2) {
    displayText = `${yearsToRetirement} year${yearsToRetirement !== 1 ? 's' : ''} to retirement`;
  } else if (yearsToRetirement > 1) {
    // Show years and months for >1 year but ≤2 years
    displayText = `${yearsToRetirement} year${yearsToRetirement !== 1 ? 's' : ''} and ${monthsToRetirement} month${monthsToRetirement !== 1 ? 's' : ''} to retirement`;
  } else {
    // Show months and days for ≤1 year
    displayText = `${monthsToRetirement} month${monthsToRetirement !== 1 ? 's' : ''} and ${finalDaysToRetirement} day${finalDaysToRetirement !== 1 ? 's' : ''} to retirement`;
  }

  return {
    retirementDate,
    yearsToRetirement,
    monthsToRetirement,
    daysToRetirement: finalDaysToRetirement,
    isNearingRetirement,
    retirementStatus,
    displayText,
  };
}

/**
 * Get retirement age from system settings
 * @returns Promise<number> - Retirement age from settings or default 65
 */
export async function getRetirementAge(): Promise<number> {
  try {
    const settings = await settingsService.getSettings();
    return settings.pilot_requirements.pilot_retirement_age || 65;
  } catch (error) {
    console.error('Error fetching retirement age from settings:', error);
    return 65; // Default fallback
  }
}

/**
 * Calculate retirement information for multiple pilots
 * @param pilots - Array of pilots with date_of_birth
 * @param retirementAge - Retirement age (optional, will fetch from settings if not provided)
 * @returns Promise<PilotWithRetirement[]> - Pilots with retirement calculations
 */
export async function calculatePilotsRetirement(
  pilots: Array<{
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string | null;
  }>,
  retirementAge?: number
): Promise<PilotWithRetirement[]> {
  const effectiveRetirementAge = retirementAge || (await getRetirementAge());

  return pilots.map((pilot) => ({
    ...pilot,
    retirement: calculateRetirementInfo(pilot.date_of_birth, effectiveRetirementAge),
  }));
}

/**
 * Filter pilots who are nearing retirement (< 5 years)
 * @param pilotsWithRetirement - Array of pilots with retirement calculations
 * @returns PilotWithRetirement[] - Pilots nearing retirement
 */
export function getPilotsNearingRetirement(
  pilotsWithRetirement: PilotWithRetirement[]
): PilotWithRetirement[] {
  return pilotsWithRetirement.filter((pilot) => pilot.retirement?.isNearingRetirement === true);
}

/**
 * Get retirement status color for UI display
 * @param retirementStatus - Retirement status
 * @returns Object with color classes for different UI frameworks
 */
export function getRetirementStatusColor(retirementStatus: RetirementInfo['retirementStatus']) {
  switch (retirementStatus) {
    case 'overdue':
      return {
        color: 'red',
        bgClass: 'bg-red-100',
        textClass: 'text-red-800',
        badgeClass: 'bg-red-100 text-red-800',
        iconClass: 'text-red-600',
      };
    case 'due_soon':
      return {
        color: 'orange',
        bgClass: 'bg-orange-100',
        textClass: 'text-orange-800',
        badgeClass: 'bg-orange-100 text-orange-800',
        iconClass: 'text-orange-600',
      };
    case 'nearing':
      return {
        color: 'yellow',
        bgClass: 'bg-yellow-100',
        textClass: 'text-yellow-800',
        badgeClass: 'bg-yellow-100 text-yellow-800',
        iconClass: 'text-yellow-600',
      };
    case 'active':
    default:
      return {
        color: 'green',
        bgClass: 'bg-green-100',
        textClass: 'text-green-800',
        badgeClass: 'bg-green-100 text-green-800',
        iconClass: 'text-green-600',
      };
  }
}

/**
 * Get retirement status icon
 * @param retirementStatus - Retirement status
 * @returns String emoji icon for the status
 */
export function getRetirementStatusIcon(
  retirementStatus: RetirementInfo['retirementStatus']
): string {
  switch (retirementStatus) {
    case 'overdue':
      return '🚫';
    case 'due_soon':
      return '⚠️';
    case 'nearing':
      return '⏰';
    case 'active':
    default:
      return '✅';
  }
}

/**
 * Format retirement date for display
 * @param retirementDate - Date of retirement
 * @returns Formatted date string
 */
export function formatRetirementDate(retirementDate: Date): string {
  return retirementDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date of birth
 * @returns Number representing current age
 */
export function calculateAge(dateOfBirth: string | Date): number {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}
