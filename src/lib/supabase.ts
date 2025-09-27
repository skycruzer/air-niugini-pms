import { createClient } from '@supabase/supabase-js'

// Defensive environment variable access
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
    console.error('❌ Supabase configuration missing!')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing')

    // For now, let's use the known values directly since env vars aren't loading
    return {
      url: 'https://wgdmgvonqysflwdiiols.supabase.co',
      key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODIzMjAsImV4cCI6MjA3MTE1ODMyMH0.MJrbK8qtJLJXz_mSHF9Le_DebGCXfZ4eXFd7h5JCKyk'
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
      fetch: (url, options = {}) => {
        console.log('🌐 Supabase fetch:', {
          url: url.substring(0, 50) + '...',
          method: options?.method || 'GET',
          hasAuth: !!(options?.headers as any)?.Authorization
        })
        return fetch(url, {
          ...options,
          // Add timeout and retry logic at the fetch level
          signal: AbortSignal.timeout(15000), // 15 second timeout for production
        })
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