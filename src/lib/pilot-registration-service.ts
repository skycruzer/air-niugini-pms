/**
 * Pilot Registration Service
 * Handles pilot self-service registration and approval workflow
 */

import { getSupabaseAdmin } from './supabase';
import type { Database } from '@/types/supabase';

type PilotUserInsert = Database['public']['Tables']['pilot_users']['Insert'];

export interface PilotRegistrationData {
  employee_id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  rank: 'Captain' | 'First Officer';
}

export interface RegistrationValidationResult {
  valid: boolean;
  error?: string;
  employeeExists?: boolean;
  emailExists?: boolean;
  pilotData?: {
    employee_id: string;
    first_name: string;
    last_name: string;
    role: string;
    seniority_number: number | null;
  };
}

/**
 * Validate employee ID exists in pilots table and return pilot data
 */
export async function validateEmployeeId(
  employeeId: string
): Promise<RegistrationValidationResult> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Check if pilot exists in pilots table
    const { data: pilot, error: pilotError } = await supabaseAdmin
      .from('pilots')
      .select('employee_id, first_name, last_name, role, seniority_number')
      .eq('employee_id', employeeId)
      .single();

    if (pilotError || !pilot) {
      return {
        valid: false,
        error: 'Employee ID not found. Please contact your administrator.',
        employeeExists: false,
      };
    }

    // Check if employee already registered
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('pilot_users')
      .select('id, email, registration_approved')
      .eq('employee_id', employeeId)
      .maybeSingle();

    if (userError) {
      console.error('Error checking existing user:', userError);
      throw new Error('Error validating employee ID');
    }

    if (existingUser) {
      if (existingUser.registration_approved) {
        return {
          valid: false,
          error: 'This employee ID is already registered and approved. Please login instead.',
          employeeExists: true,
        };
      } else {
        return {
          valid: false,
          error:
            'A registration request for this employee ID is pending approval. Please wait for admin approval.',
          employeeExists: true,
        };
      }
    }

    return {
      valid: true,
      employeeExists: true,
      pilotData: pilot,
    };
  } catch (error) {
    console.error('Error validating employee ID:', error);
    return {
      valid: false,
      error: 'Error validating employee ID. Please try again.',
    };
  }
}

/**
 * Register a new pilot user (pending approval)
 */
export async function registerPilot(
  registrationData: PilotRegistrationData
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Step 1: Validate employee ID
    const validation = await validateEmployeeId(registrationData.employee_id);

    if (!validation.valid || !validation.pilotData) {
      return {
        success: false,
        error: validation.error || 'Invalid employee ID',
      };
    }

    // Step 2: Check if email already exists in auth.users
    const { data: existingAuthUser, error: authCheckError } = await supabaseAdmin.auth.admin.listUsers();

    if (authCheckError) {
      console.error('Error checking existing auth users:', authCheckError);
      throw new Error('Error validating email address');
    }

    const emailExists = existingAuthUser.users.some(
      (user) => user.email?.toLowerCase() === registrationData.email.toLowerCase()
    );

    if (emailExists) {
      return {
        success: false,
        error: 'This email address is already registered. Please use a different email or login.',
      };
    }

    // Step 3: Create Supabase Auth user (with email confirmation required)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: registrationData.email,
      password: registrationData.password,
      email_confirm: false, // Requires email verification
      user_metadata: {
        employee_id: registrationData.employee_id,
        first_name: registrationData.first_name,
        last_name: registrationData.last_name,
        rank: registrationData.rank,
        registration_pending: true,
      },
    });

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError);
      return {
        success: false,
        error: authError?.message || 'Failed to create user account',
      };
    }

    // Step 4: Create pilot_users record (pending approval)
    const pilotUserData: PilotUserInsert = {
      id: authData.user.id,
      employee_id: registrationData.employee_id,
      email: registrationData.email,
      first_name: registrationData.first_name,
      last_name: registrationData.last_name,
      rank: registrationData.rank,
      seniority_number: validation.pilotData.seniority_number,
      registration_approved: false,
      registration_date: new Date().toISOString(),
    };

    const { error: insertError } = await supabaseAdmin.from('pilot_users').insert(pilotUserData);

    if (insertError) {
      console.error('Error creating pilot_users record:', insertError);

      // Rollback: Delete auth user if pilot_users insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      return {
        success: false,
        error: 'Failed to create pilot profile. Please try again.',
      };
    }

    // Step 5: Send email verification link
    // Supabase Auth will automatically send verification email

    console.log('✅ Pilot registration successful:', {
      userId: authData.user.id,
      employee_id: registrationData.employee_id,
      email: registrationData.email,
    });

    return {
      success: true,
      userId: authData.user.id,
    };
  } catch (error) {
    console.error('Error registering pilot:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during registration. Please try again.',
    };
  }
}

/**
 * Get all pending pilot registrations (for admin approval)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPendingRegistrations(): Promise<any[]> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // DEBUG: Check if we're using service role
    console.log('[DEBUG] Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('[DEBUG] Service role key first 20 chars:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20));

    // Get pending pilot_users records using RPC function to bypass RLS
    const { data: pilotUsers, error } = await supabaseAdmin
      .rpc('get_pending_pilot_registrations');

    console.log('[DEBUG] pilot_users query result:', { count: pilotUsers?.length, error });
    console.log('[DEBUG] pilot_users data:', JSON.stringify(pilotUsers, null, 2));

    if (error) {
      console.error('Error fetching pending registrations:', error);
      throw error;
    }

    if (!pilotUsers || pilotUsers.length === 0) {
      return [];
    }

    // Get auth users to check email confirmation status
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    console.log('[DEBUG] auth.admin.listUsers result:', { count: authData?.users?.length, error: authError });

    if (authError) {
      console.error('Error fetching auth users:', authError);
      // Return pilot users without email confirmation status
      return pilotUsers.map((user) => ({
        ...user,
        email_confirmed: false,
        created_at: user.registration_date,
      }));
    }

    // Map pilot users with email confirmation status from auth.users
    // BUG FIX: Match by email instead of id
    const registrationsWithEmailStatus = pilotUsers.map((pilotUser) => {
      const authUser = authData.users.find((u) => u.email === pilotUser.email);
      console.log('[DEBUG] Matching pilot:', pilotUser.email, 'Found auth user:', !!authUser);
      return {
        ...pilotUser,
        email_confirmed: authUser?.email_confirmed_at !== null && authUser?.email_confirmed_at !== undefined,
        created_at: pilotUser.registration_date,
      };
    });

    console.log('[DEBUG] Returning registrations:', registrationsWithEmailStatus.length);
    return registrationsWithEmailStatus;
  } catch (error) {
    console.error('Error in getPendingRegistrations:', error);
    throw error;
  }
}

/**
 * Approve a pilot registration (admin only)
 */
export async function approvePilotRegistration(
  pilotUserId: string,
  adminUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Update pilot_users record
    const { error: updateError } = await supabaseAdmin
      .from('pilot_users')
      .update({
        registration_approved: true,
        approved_by: adminUserId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', pilotUserId);

    if (updateError) {
      console.error('Error approving registration:', updateError);
      return {
        success: false,
        error: 'Failed to approve registration',
      };
    }

    // Confirm email in auth.users (allow login)
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(pilotUserId, {
      email_confirm: true,
      user_metadata: {
        registration_approved: true,
        approved_at: new Date().toISOString(),
      },
    });

    if (confirmError) {
      console.error('Error confirming user email:', confirmError);
      // Continue anyway - pilot_users record is updated
    }

    console.log('✅ Pilot registration approved:', pilotUserId);

    return { success: true };
  } catch (error) {
    console.error('Error in approvePilotRegistration:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Reject a pilot registration (admin only)
 */
export async function rejectPilotRegistration(
  pilotUserId: string,
  rejectionReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Delete pilot_users record
    const { error: deleteError } = await supabaseAdmin
      .from('pilot_users')
      .delete()
      .eq('id', pilotUserId);

    if (deleteError) {
      console.error('Error deleting pilot_users record:', deleteError);
      return {
        success: false,
        error: 'Failed to reject registration',
      };
    }

    // Delete auth user
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(pilotUserId);

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      // Continue anyway - pilot_users record is deleted
    }

    console.log('✅ Pilot registration rejected:', pilotUserId, rejectionReason);

    return { success: true };
  } catch (error) {
    console.error('Error in rejectPilotRegistration:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
