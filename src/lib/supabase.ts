import { createClient } from '@supabase/supabase-js'

// Defensive environment variable access
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase configuration missing, using fallback')
    return {
      url: 'https://placeholder.supabase.co',
      key: 'placeholder-key'
    }
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

// Create service role client with better configuration
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Admin Supabase configuration missing, using fallback client')
    return createClient('https://placeholder.supabase.co', 'placeholder-key')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          // Add timeout and retry logic at the fetch level
          signal: AbortSignal.timeout(30000), // 30 second timeout
        })
      }
    }
  })
}

export const supabaseAdmin = createSupabaseAdmin()

// Database types for Air Niugini PMS
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager'
  created_at: string
}

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

export interface CheckType {
  id: string
  check_code: string
  check_description: string
  category?: string
  created_at: string
}

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

// Helper functions
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)
  return error.message || 'An unexpected error occurred'
}