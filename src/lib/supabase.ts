/**
 * @fileoverview Supabase client configuration for Air Niugini B767 PMS
 * Handles database connections, authentication, and type definitions.
 * Includes both client-side and server-side (admin) configurations.
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-27
 */

import { createClient } from '@supabase/supabase-js'

/**
 * Safely retrieves and validates Supabase configuration from environment variables
 * Provides fallback values for development environments where env vars may not load properly
 *
 * @returns {Object} Configuration object with URL and anonymous key
 * @returns {string} returns.url - Supabase project URL
 * @returns {string} returns.key - Supabase anonymous public key
 */
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Add debugging to see what's happening
  console.log('Environment check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
    key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined'
  })

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Critical: Missing required Supabase environment variables!')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing')
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing')
    throw new Error('Supabase configuration missing. Please check your environment variables.')
  }

  return {
    url: supabaseUrl,
    key: supabaseAnonKey
  }
}

// Create Supabase client with error handling
const config = getSupabaseConfig()
export const supabase = createClient(config.url, config.key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

/**
 * Creates a Supabase admin client with service role privileges
 * Used for server-side operations that require elevated permissions
 *
 * @returns {SupabaseClient} Configured admin client with service role access
 * @throws {Error} If required environment variables are missing
 *
 * @security This client bypasses Row Level Security (RLS) - use carefully
 */
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('🔧 Admin client environment check:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
    serviceKeyLength: supabaseServiceKey ? supabaseServiceKey.length : 0,
    serviceKeyStart: supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'undefined'
  })

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Critical: Missing Supabase environment variables in production')
    console.error('❌ URL:', !!supabaseUrl, 'ServiceKey:', !!supabaseServiceKey)
    throw new Error('Supabase configuration missing - cannot perform admin operations')
  }

  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      fetch: async (url, options = {}) => {
        console.log('🌐 Supabase fetch:', {
          url: String(url).substring(0, 50) + '...',
          method: options?.method || 'GET',
          hasAuth: !!(options?.headers as any)?.Authorization
        })

        try {
          // Try with a longer timeout and better error handling
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

          const response = await fetch(url, {
            ...options,
            signal: controller.signal
          })

          clearTimeout(timeoutId)
          return response
        } catch (error) {
          console.error('🚨 Fetch error:', error)
          // Re-throw the error so Supabase can handle it
          throw error
        }
      }
    }
  })

  console.log('✅ Admin client created successfully')
  return client
}

// Lazy initialization of admin client to avoid build-time errors
let _supabaseAdmin: any = null
export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createSupabaseAdmin()
  }
  return _supabaseAdmin
}

// Legacy export for backward compatibility - deprecated, use getSupabaseAdmin() instead
export const supabaseAdmin = {
  get from() { return getSupabaseAdmin().from },
  get auth() { return getSupabaseAdmin().auth },
  get storage() { return getSupabaseAdmin().storage },
  get rpc() { return getSupabaseAdmin().rpc },
  get channel() { return getSupabaseAdmin().channel },
  get realtime() { return getSupabaseAdmin().realtime }
}

// =============================================================================
// DATABASE TYPE DEFINITIONS
// =============================================================================

/**
 * System user interface for authentication and authorization
 * Maps to the 'an_users' table in the database
 *
 * @interface User
 * @property {string} id - UUID primary key
 * @property {string} email - User's email address (must be unique)
 * @property {string} name - Display name for the user
 * @property {'admin' | 'manager'} role - User's permission level
 * @property {string} created_at - ISO timestamp of account creation
 */
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager'
  created_at: string
}

/**
 * Pilot record interface representing B767 fleet pilots
 * Maps to the 'pilots' table in the database
 *
 * @interface Pilot
 * @property {string} id - UUID primary key
 * @property {string} employee_id - Unique employee identifier (e.g., "2393")
 * @property {string} first_name - Pilot's first name
 * @property {string} [middle_name] - Optional middle name
 * @property {string} last_name - Pilot's last name
 * @property {'Captain' | 'First Officer'} role - Flight deck position
 * @property {string} [contract_type] - Employment type (Fulltime, Contract, Casual)
 * @property {string} [nationality] - Pilot's nationality
 * @property {string} [passport_number] - Passport identification
 * @property {string} [passport_expiry] - Passport expiry date (YYYY-MM-DD)
 * @property {string} [date_of_birth] - Birth date (YYYY-MM-DD)
 * @property {string} [commencement_date] - Employment start date (YYYY-MM-DD)
 * @property {number} [seniority_number] - Seniority ranking (1 = most senior)
 * @property {boolean} is_active - Whether pilot is currently active
 * @property {string} created_at - Record creation timestamp
 * @property {string} [updated_at] - Last modification timestamp
 * @property {any[]} [captain_qualifications] - Array of captain qualification types
 * @property {string} [qualification_notes] - Additional qualification notes
 * @property {string} [rhs_captain_expiry] - Right-hand seat captain authority expiry
 */
export interface Pilot {
  id: string
  employee_id: string
  first_name: string
  middle_name?: string
  last_name: string
  role: 'Captain' | 'First Officer'
  contract_type?: string
  nationality?: string
  passport_number?: string
  passport_expiry?: string
  date_of_birth?: string
  commencement_date?: string
  seniority_number?: number
  is_active: boolean
  created_at: string
  updated_at?: string
  captain_qualifications?: any[]
  qualification_notes?: string
  rhs_captain_expiry?: string
}

/**
 * Aviation certification type definition
 * Maps to the 'check_types' table in the database
 *
 * @interface CheckType
 * @property {string} id - UUID primary key
 * @property {string} check_code - Short code for the certification (e.g., "PC", "LPC")
 * @property {string} check_description - Full description of the certification
 * @property {string} [category] - Certification category for grouping
 * @property {string} created_at - Record creation timestamp
 */
export interface CheckType {
  id: string
  check_code: string
  check_description: string
  category?: string
  created_at: string
}

/**
 * Individual pilot certification record
 * Maps to the 'pilot_checks' table in the database
 *
 * @interface PilotCheck
 * @property {string} id - UUID primary key
 * @property {string} pilot_id - Foreign key reference to pilots table
 * @property {string} check_type_id - Foreign key reference to check_types table
 * @property {string} [expiry_date] - Certification expiry date (YYYY-MM-DD)
 * @property {string} created_at - Record creation timestamp
 * @property {string} updated_at - Last modification timestamp
 * @property {Pilot} [pilot] - Related pilot record (when joined)
 * @property {CheckType} [check_type] - Related check type record (when joined)
 */
export interface PilotCheck {
  id: string
  pilot_id: string
  check_type_id: string
  expiry_date?: string
  created_at: string
  updated_at: string
  // Relations
  pilot?: Pilot
  check_type?: CheckType
}

/**
 * Leave request record for pilot time off management
 * Maps to the 'leave_requests' table in the database
 *
 * @interface LeaveRequest
 * @property {string} id - UUID primary key
 * @property {string} pilot_id - Foreign key reference to pilots table
 * @property {'RDO' | 'WDO' | 'ANNUAL' | 'SICK'} request_type - Type of leave request
 * @property {string} roster_period - Associated roster period (e.g., "RP13/2025")
 * @property {string} start_date - Leave start date (YYYY-MM-DD)
 * @property {string} end_date - Leave end date (YYYY-MM-DD)
 * @property {number} days_count - Number of days requested
 * @property {'PENDING' | 'APPROVED' | 'DENIED'} status - Request approval status
 * @property {string} [reason] - Optional reason for the leave request
 * @property {string} created_at - Request submission timestamp
 * @property {string} [reviewed_by] - UUID of reviewing user
 * @property {string} [reviewed_at] - Review timestamp
 * @property {Pilot} [pilot] - Related pilot record (when joined)
 * @property {User} [reviewer] - Related reviewer record (when joined)
 */
export interface LeaveRequest {
  id: string
  pilot_id: string
  request_type: 'RDO' | 'WDO' | 'ANNUAL' | 'SICK'
  roster_period: string
  start_date: string
  end_date: string
  days_count: number
  status: 'PENDING' | 'APPROVED' | 'DENIED'
  reason?: string
  created_at: string
  reviewed_by?: string
  reviewed_at?: string
  // Relations
  pilot?: Pilot
  reviewer?: User
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Standardized error handler for Supabase operations
 * Provides consistent error logging and user-friendly error messages
 *
 * @param {any} error - Supabase error object
 * @returns {string} User-friendly error message
 *
 * @example
 * const { data, error } = await supabase.from('pilots').select('*');
 * if (error) {
 *   const message = handleSupabaseError(error);
 *   setErrorState(message);
 * }
 */
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)
  return error.message || 'An unexpected error occurred'
}