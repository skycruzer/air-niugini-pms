/**
 * @fileoverview Service for fetching expiring certifications data
 * Provides reusable functions for both API routes and internal server calls
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-29
 */

import { getSupabaseAdmin } from '@/lib/supabase';
import { getCertificationStatus } from '@/lib/certification-utils';
import { getRosterPeriodFromDate } from '@/lib/roster-utils';
import { format } from 'date-fns';

/**
 * Core service function to fetch expiring certifications
 * This function can be used by both API routes and internal server calls
 *
 * @param daysAhead - Number of days ahead to look for expiring certifications
 * @returns Promise<Array> - Array of expiring certification objects
 */
export async function getExpiringCertifications(daysAhead: number = 60) {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    console.log('🔍 Service: Fetching certifications expiring in next', daysAhead, 'days');

    // Calculate date threshold - include expired certifications (30 days back)
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    // Look back 365 days to include all expired certifications for planning purposes
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - 365);

    // Get expiring certifications using a direct query
    console.log('📋 Database query filters:', {
      notNull: 'expiry_date IS NOT NULL',
      gte: `expiry_date >= '${pastDate.toISOString().split('T')[0]}'`,
      lte: `expiry_date <= '${futureDate.toISOString().split('T')[0]}'`,
    });

    const { data: expiringChecks, error } = await supabaseAdmin
      .from('pilot_checks')
      .select(
        `
        id,
        expiry_date,
        pilots!inner (
          id,
          first_name,
          middle_name,
          last_name,
          employee_id
        ),
        check_types!inner (
          id,
          check_code,
          check_description,
          category
        )
      `
      )
      .not('expiry_date', 'is', null)
      .gte('expiry_date', pastDate.toISOString().split('T')[0])
      .lte('expiry_date', futureDate.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('🚨 Service: Database error:', error);
      console.error('🚨 Service: Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw new Error(`Database error: ${error.message}`);
    }

    // Transform the data to match the expected format
    const result = (expiringChecks || [])
      .map((check: any) => {
        // First, validate that we have a proper expiry_date
        if (!check.expiry_date) {
          console.warn('⚠️ Missing expiry_date for check:', check.id);
          return null; // Skip this record
        }

        const expiryDate = new Date(check.expiry_date);

        // Validate the date is valid
        if (isNaN(expiryDate.getTime())) {
          console.warn('⚠️ Invalid expiry_date for check:', check.id, 'date:', check.expiry_date);
          return null; // Skip this record
        }

        // Calculate roster period for this expiry date with detailed logging
        let rosterPeriod, rosterDisplay;
        try {
          console.log(
            '🔍 Calculating roster period for date:',
            expiryDate.toISOString().split('T')[0]
          );
          const period = getRosterPeriodFromDate(expiryDate);
          console.log('📊 Roster period result:', period);

          // Check if roster number is valid (not NaN) or if any critical fields are invalid
          if (
            isNaN(period.number) ||
            !period.number ||
            period.number <= 0 ||
            period.code.includes('NaN')
          ) {
            console.warn('⚠️ Invalid roster calculation detected:', {
              number: period.number,
              code: period.code,
              year: period.year,
              isNumberNaN: isNaN(period.number),
            });
            throw new Error(
              `Invalid roster calculation: number=${period.number}, code=${period.code}`
            );
          }

          rosterPeriod = period.code;
          rosterDisplay = `${period.code} (${format(period.startDate, 'MMM dd')} - ${format(period.endDate, 'MMM dd, yyyy')})`;
          console.log('✅ Successfully calculated roster period:', rosterPeriod);
        } catch (error) {
          console.warn(
            '❌ Error calculating roster period for date',
            expiryDate.toISOString().split('T')[0],
            ':',
            error
          );

          // Robust fallback: determine roster period based on date with proper validation
          const year = expiryDate.getFullYear();
          const month = expiryDate.getMonth() + 1; // getMonth() returns 0-11

          // Simple heuristic: roughly 13.09 roster periods per year (365/28 ≈ 13.04)
          // But we'll use a conservative estimate
          let estimatedRoster = Math.ceil((month * 13) / 12);
          if (estimatedRoster > 13) estimatedRoster = 13;
          if (estimatedRoster < 1) estimatedRoster = 1;

          rosterPeriod = `RP${estimatedRoster}/${year}`;
          rosterDisplay = `${rosterPeriod} (Estimated)`;
          console.log('🔄 Using fallback roster period:', rosterPeriod);
        }

        return {
          pilotName:
            `${check.pilots?.first_name || ''} ${check.pilots?.middle_name ? check.pilots.middle_name + ' ' : ''}${check.pilots?.last_name || ''}`.trim(),
          employeeId: check.pilots?.employee_id || '',
          checkCode: check.check_types?.check_code || '',
          checkDescription: check.check_types?.check_description || '',
          category: check.check_types?.category || '',
          expiryDate: expiryDate,
          status: getCertificationStatus(expiryDate),
          expiry_roster_period: rosterPeriod,
          expiry_roster_display: rosterDisplay,
        };
      })
      .filter(Boolean); // Remove null entries from invalid dates

    console.log('🔍 Service: Found', result.length, 'expiring certifications');
    return result;
  } catch (error) {
    console.error('🚨 Service: Fatal error:', error);
    throw error;
  }
}
