import { supabase } from './supabase';

// Database types matching our Supabase schema
export interface Pilot {
  id: string;
  employee_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  role: 'Captain' | 'First Officer';
  contract_type?: string;
  nationality?: string;
  passport_number?: string;
  passport_expiry?: string;
  date_of_birth?: string;
  commencement_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface CheckType {
  id: string;
  check_code: string;
  check_description: string;
  category: string;
  created_at: string;
}

export interface PilotCheck {
  id: string;
  pilot_id: string;
  check_type_id: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
  pilot?: Pilot;
  check_type?: CheckType;
}

export interface PilotCheckOverview {
  pilotName: string;
  employeeId: string;
  checkCode: string;
  checkDescription: string;
  category: string;
  expiryDate: Date | null;
  status: {
    color: string;
    label: string;
    className: string;
  };
}

// Helper function to get certification status
function getCertificationStatus(expiryDate: Date | null) {
  if (!expiryDate)
    return { color: 'gray', label: 'No Date', className: 'bg-gray-100 text-gray-800' };

  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) {
    return { color: 'red', label: 'Expired', className: 'bg-red-100 text-red-800' };
  }
  if (daysUntilExpiry <= 30) {
    return { color: 'yellow', label: 'Expiring Soon', className: 'bg-yellow-100 text-yellow-800' };
  }
  return { color: 'green', label: 'Current', className: 'bg-green-100 text-green-800' };
}

// Pilot Services
export const pilotService = {
  // Get all active pilots
  async getAllPilots(): Promise<Pilot[]> {
    const { data, error } = await supabase
      .from('pilots')
      .select('*')
      .eq('is_active', true)
      .order('last_name', { ascending: true });

    if (error) {
      console.error('Error fetching pilots:', error);
      throw error;
    }

    return data || [];
  },

  // Get pilot by ID
  async getPilotById(id: string): Promise<Pilot | null> {
    const { data, error } = await supabase.from('pilots').select('*').eq('id', id).single();

    if (error) {
      console.error('Error fetching pilot:', error);
      return null;
    }

    return data;
  },

  // Create new pilot
  async createPilot(pilot: Omit<Pilot, 'id' | 'created_at'>): Promise<Pilot | null> {
    const { data, error } = await supabase.from('pilots').insert(pilot).select().single();

    if (error) {
      console.error('Error creating pilot:', error);
      throw error;
    }

    return data;
  },

  // Update pilot
  async updatePilot(id: string, updates: Partial<Pilot>): Promise<Pilot | null> {
    const { data, error } = await supabase
      .from('pilots')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating pilot:', error);
      throw error;
    }

    return data;
  },

  // Delete pilot (soft delete)
  async deletePilot(id: string): Promise<boolean> {
    const { error } = await supabase.from('pilots').update({ is_active: false }).eq('id', id);

    if (error) {
      console.error('Error deleting pilot:', error);
      return false;
    }

    return true;
  },
};

// Check Type Services
export const checkTypeService = {
  // Get all check types
  async getAllCheckTypes(): Promise<CheckType[]> {
    const { data, error } = await supabase
      .from('check_types')
      .select('*')
      .order('category', { ascending: true })
      .order('check_code', { ascending: true });

    if (error) {
      console.error('Error fetching check types:', error);
      throw error;
    }

    return data || [];
  },

  // Get check types by category
  async getCheckTypesByCategory(category: string): Promise<CheckType[]> {
    const { data, error } = await supabase
      .from('check_types')
      .select('*')
      .eq('category', category)
      .order('check_code', { ascending: true });

    if (error) {
      console.error('Error fetching check types by category:', error);
      throw error;
    }

    return data || [];
  },
};

// Pilot Check Services (Certifications)
export const certificationService = {
  // Get all pilot certifications with details
  async getAllCertifications(): Promise<PilotCheckOverview[]> {
    const { data, error } = await supabase
      .from('pilot_checks_overview')
      .select('*')
      .order('expiry_date', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error fetching certifications overview:', error);
      throw error;
    }

    return (data || []).map((cert: any) => ({
      pilotName: cert.pilot_name,
      employeeId: cert.employee_id,
      checkCode: cert.check_code,
      checkDescription: cert.check_description,
      category: cert.category,
      expiryDate: cert.expiry_date ? new Date(cert.expiry_date) : null,
      status: getCertificationStatus(cert.expiry_date ? new Date(cert.expiry_date) : null),
    }));
  },

  // Get expiring certifications (within specified days)
  async getExpiringCertifications(daysAhead: number = 60): Promise<PilotCheckOverview[]> {
    const { data, error } = await supabase
      .from('expiring_checks')
      .select('*')
      .gte('days_until_expiry', 0)
      .lte('days_until_expiry', daysAhead)
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('Error fetching expiring certifications:', error);
      throw error;
    }

    return (data || []).map((cert: any) => ({
      pilotName: cert.pilot_name,
      employeeId: cert.employee_id,
      checkCode: cert.check_code,
      checkDescription: cert.check_description,
      category: cert.category,
      expiryDate: new Date(cert.expiry_date),
      status: getCertificationStatus(new Date(cert.expiry_date)),
    }));
  },

  // Get certifications for a specific pilot
  async getPilotCertifications(pilotId: string): Promise<PilotCheck[]> {
    const { data, error } = await supabase
      .from('pilot_checks')
      .select(
        `
        *,
        pilot:pilots(*),
        check_type:check_types(*)
      `
      )
      .eq('pilot_id', pilotId)
      .order('expiry_date', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error fetching pilot certifications:', error);
      throw error;
    }

    return data || [];
  },

  // Update pilot certification expiry date
  async updateCertificationExpiry(pilotCheckId: string, expiryDate: string): Promise<boolean> {
    const { error } = await supabase
      .from('pilot_checks')
      .update({
        expiry_date: expiryDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pilotCheckId);

    if (error) {
      console.error('Error updating certification expiry:', error);
      return false;
    }

    return true;
  },
};

// Dashboard Services
export const dashboardService = {
  // Get fleet compliance summary
  async getFleetCompliance(): Promise<any> {
    const { data, error } = await supabase.from('fleet_compliance_summary').select('*').single();

    if (error) {
      console.error('Error fetching fleet compliance:', error);
      return {
        total_pilots: 0,
        total_certifications: 0,
        total_check_types: 0,
        expired_certifications: 0,
        expiring_soon: 0,
        current_certifications: 0,
        overall_compliance_rate: 0,
      };
    }

    return data;
  },

  // Get pilots with expired certifications
  async getPilotsWithExpiredCertifications(): Promise<any[]> {
    const { data, error } = await supabase
      .from('pilot_checks_overview')
      .select('*')
      .lt('expiry_date', new Date().toISOString())
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('Error fetching pilots with expired certifications:', error);
      return [];
    }

    // Group by pilot
    const pilotMap = new Map();
    data?.forEach((cert: any) => {
      const key = cert.employee_id;
      if (!pilotMap.has(key)) {
        pilotMap.set(key, {
          pilot_name: cert.pilot_name,
          employee_id: cert.employee_id,
          expired_count: 0,
          certifications: [],
        });
      }
      pilotMap.get(key).expired_count++;
      pilotMap.get(key).certifications.push({
        check_code: cert.check_code,
        check_description: cert.check_description,
        expiry_date: cert.expiry_date,
      });
    });

    return Array.from(pilotMap.values());
  },
};

// Authentication Service (for Supabase Auth integration)
export const authService = {
  // Get current authenticated user
  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Get user details from our users table
    const { data: userData, error: userError } = await supabase
      .from('an_users')
      .select('*')
      .eq('email', user.email)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return null;
    }

    return userData;
  },

  // Sign in with email/password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      return null;
    }

    return data.user;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
    }
    return !error;
  },
};

export default {
  pilot: pilotService,
  checkType: checkTypeService,
  certification: certificationService,
  dashboard: dashboardService,
  auth: authService,
};
