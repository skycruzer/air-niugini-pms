import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { differenceInYears } from 'date-fns';

export async function GET() {
  try {
    console.log('📊 API /analytics/pilot: Getting pilot analytics...');

    const supabaseAdmin = getSupabaseAdmin();

    // Get base pilot data with additional calculations
    const { data: pilots, error } = await supabaseAdmin.from('pilots').select(`
        id,
        first_name,
        last_name,
        role,
        contract_type,
        commencement_date,
        date_of_birth,
        is_active,
        captain_qualifications,
        updated_at
      `);

    if (error) throw error;

    const activePilots = pilots?.filter((p: any) => p.is_active === true) || [];
    const today = new Date();

    // Calculate age distribution
    const ageDistribution = {
      under30: 0,
      age30to40: 0,
      age40to50: 0,
      age50to60: 0,
      over60: 0,
    };

    // Calculate seniority distribution
    const seniorityDistribution = {
      junior: 0, // 0-5 years
      mid: 0, // 5-15 years
      senior: 0, // 15+ years
    };

    // Calculate retirement planning
    const retirementPlanning = {
      retiringIn1Year: 0,
      retiringIn2Years: 0,
      retiringIn5Years: 0,
    };

    // Count role distribution
    let captains = 0;
    let firstOfficers = 0;
    let trainingCaptains = 0;
    let examiners = 0;
    let lineCaptains = 0;

    activePilots.forEach((pilot: any) => {
      // Age analysis
      if (pilot.date_of_birth) {
        const age = differenceInYears(today, new Date(pilot.date_of_birth));
        if (age < 30) ageDistribution.under30++;
        else if (age < 40) ageDistribution.age30to40++;
        else if (age < 50) ageDistribution.age40to50++;
        else if (age < 60) ageDistribution.age50to60++;
        else ageDistribution.over60++;

        // Retirement planning (assuming retirement at 65)
        const yearsToRetirement = 65 - age;
        if (yearsToRetirement <= 1) retirementPlanning.retiringIn1Year++;
        else if (yearsToRetirement <= 2) retirementPlanning.retiringIn2Years++;
        else if (yearsToRetirement <= 5) retirementPlanning.retiringIn5Years++;
      }

      // Seniority analysis
      if (pilot.commencement_date) {
        const yearsOfService = differenceInYears(today, new Date(pilot.commencement_date));
        if (yearsOfService < 5) seniorityDistribution.junior++;
        else if (yearsOfService < 15) seniorityDistribution.mid++;
        else seniorityDistribution.senior++;
      }

      // Role distribution
      if (pilot.role === 'Captain') {
        captains++;

        // Check for special qualifications
        const qualifications = pilot.captain_qualifications || {};
        if (qualifications.line_captain) lineCaptains++;
        if (qualifications.training_captain) trainingCaptains++;
        if (qualifications.examiner) examiners++;
      } else if (pilot.role === 'First Officer') {
        firstOfficers++;
      }
    });

    const result = {
      total: pilots?.length || 0,
      active: activePilots.length,
      inactive: (pilots?.length || 0) - activePilots.length,
      captains,
      firstOfficers,
      trainingCaptains,
      examiners,
      lineCaptains,
      ageDistribution,
      seniorityDistribution,
      retirementPlanning,
    };

    console.log('✅ API /analytics/pilot: Successfully retrieved pilot analytics');
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ API /analytics/pilot: Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get pilot analytics' },
      { status: 500 }
    );
  }
}
