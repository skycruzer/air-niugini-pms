import { createClient } from '@supabase/supabase-js'

// Create a service role client for dashboard data (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseService = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
})

// Use service client for dashboard data to bypass RLS restrictions
const supabase = supabaseService

// Dashboard statistics interface
export interface DashboardStats {
  totalPilots: number
  captains: number
  firstOfficers: number
  certifications: number
  checkTypes: number
  compliance: number
}

// Dashboard data service using the main production tables
export const dashboardDataService = {
  // Get real-time dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get pilot counts
      const { data: pilotData, error: pilotError } = await supabase
        .from('pilots')
        .select('role')
        .eq('is_active', true)

      if (pilotError) {
        console.error('Error fetching pilot data:', pilotError)
        throw pilotError
      }

      // Get certification count
      const { count: certificationCount, error: certError } = await supabase
        .from('pilot_checks')
        .select('*', { count: 'exact', head: true })

      if (certError) {
        console.error('Error fetching certification count:', certError)
        throw certError
      }

      // Get check types count
      const { count: checkTypesCount, error: checkTypesError } = await supabase
        .from('check_types')
        .select('*', { count: 'exact', head: true })

      if (checkTypesError) {
        console.error('Error fetching check types count:', checkTypesError)
        throw checkTypesError
      }

      // Calculate compliance percentage
      const { data: complianceData, error: complianceError } = await supabase
        .from('pilot_checks')
        .select('expiry_date')

      if (complianceError) {
        console.error('Error fetching compliance data:', complianceError)
        throw complianceError
      }

      // Calculate pilots by role
      const totalPilots = pilotData?.length || 0
      const captains = pilotData?.filter(p => p.role === 'Captain').length || 0
      const firstOfficers = pilotData?.filter(p => p.role === 'First Officer').length || 0

      // Calculate compliance (certifications that are current)
      const currentDate = new Date()
      const totalCerts = complianceData?.length || 0
      const currentCerts = complianceData?.filter(cert => {
        if (!cert.expiry_date) return false
        const expiryDate = new Date(cert.expiry_date)
        return expiryDate > currentDate
      }).length || 0

      const compliance = totalCerts > 0 ? Math.round((currentCerts / totalCerts) * 100) : 0

      return {
        totalPilots,
        captains,
        firstOfficers,
        certifications: certificationCount || 0,
        checkTypes: checkTypesCount || 0,
        compliance
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      // Return fallback data on error
      return {
        totalPilots: 0,
        captains: 0,
        firstOfficers: 0,
        certifications: 0,
        checkTypes: 0,
        compliance: 0
      }
    }
  },

  // Get expiring certifications for alerts
  async getExpiringCertifications(daysAhead: number = 30) {
    try {
      const currentDate = new Date()
      const futureDate = new Date()
      futureDate.setDate(currentDate.getDate() + daysAhead)

      const { data, error } = await supabase
        .from('pilot_checks')
        .select(`
          id,
          expiry_date,
          pilot:pilots(first_name, last_name, employee_id),
          check_type:check_types(check_code, check_description, category)
        `)
        .gte('expiry_date', currentDate.toISOString().split('T')[0])
        .lte('expiry_date', futureDate.toISOString().split('T')[0])
        .order('expiry_date', { ascending: true })

      if (error) {
        console.error('Error fetching expiring certifications:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getExpiringCertifications:', error)
      return []
    }
  },

  // Get expired certifications
  async getExpiredCertifications() {
    try {
      const currentDate = new Date()

      const { data, error } = await supabase
        .from('pilot_checks')
        .select(`
          id,
          expiry_date,
          pilot:pilots(first_name, last_name, employee_id),
          check_type:check_types(check_code, check_description, category)
        `)
        .lt('expiry_date', currentDate.toISOString().split('T')[0])
        .order('expiry_date', { ascending: false })

      if (error) {
        console.error('Error fetching expired certifications:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getExpiredCertifications:', error)
      return []
    }
  }
}

export default dashboardDataService