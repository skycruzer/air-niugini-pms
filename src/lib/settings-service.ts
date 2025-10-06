export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertThresholds {
  critical_days: number;
  urgent_days: number;
  warning_30_days: number;
  warning_60_days: number;
  early_warning_90_days: number;
}

export interface PilotRequirements {
  pilot_retirement_age: number;
  number_of_aircraft: number;
  captains_per_hull: number;
  first_officers_per_hull: number;
  minimum_captains_per_hull: number;
  minimum_first_officers_per_hull: number;
  training_captains_per_pilots: number;
  examiners_per_pilots: number;
}

export interface SettingsData {
  app_title: string;
  alert_thresholds: AlertThresholds;
  pilot_requirements: PilotRequirements;
}

/**
 * Settings service for managing system configuration
 * Uses direct database calls (service layer pattern) instead of inter-API HTTP calls
 */
export const settingsService = {
  /**
   * Get all system settings
   * Direct database access - no HTTP calls
   */
  async getSettings(): Promise<SettingsData> {
    try {
      // SERVER-SIDE: Direct database access
      if (typeof window === 'undefined') {
        const { getSupabaseAdmin } = await import('@/lib/supabase-admin');
        const supabase = getSupabaseAdmin();

        console.log('🔧 Settings Service: Fetching settings from database...');

        const { data, error } = await supabase.from('settings').select('*').order('key');

        if (error) {
          console.error('❌ Settings Service: Database error:', error);
          throw new Error(error.message);
        }

        console.log('✅ Settings Service: Found', data?.length || 0, 'settings');

        // Transform flat settings array into structured data
        const settingsMap =
          data?.reduce(
            (acc: Record<string, any>, setting: any) => {
              acc[setting.key] = setting.value;
              return acc;
            },
            {} as Record<string, any>
          ) || {};

        return {
          app_title: settingsMap.app_title || 'Air Niugini Pilot Management System',
          alert_thresholds: settingsMap.alert_thresholds || {
            critical_days: 7,
            urgent_days: 14,
            warning_30_days: 30,
            warning_60_days: 60,
            early_warning_90_days: 90,
          },
          pilot_requirements: settingsMap.pilot_requirements || {
            pilot_retirement_age: 65,
            number_of_aircraft: 2,
            captains_per_hull: 7,
            first_officers_per_hull: 7,
            minimum_captains_per_hull: 10,
            minimum_first_officers_per_hull: 10,
            training_captains_per_pilots: 11,
            examiners_per_pilots: 11,
          },
        };
      }

      // CLIENT-SIDE: Call API route (this is fine for browser)
      const response = await fetch('/api/settings', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings from API');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch settings');
      }

      return result.data;
    } catch (error) {
      console.error('Error in getSettings:', error);
      throw error;
    }
  },

  /**
   * Update a specific setting
   */
  async updateSetting(key: string, value: any, description?: string): Promise<void> {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value,
          description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update setting');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update setting');
      }
    } catch (error) {
      console.error('Error in updateSetting:', error);
      throw error;
    }
  },

  /**
   * Update app title
   */
  async updateAppTitle(title: string): Promise<void> {
    return this.updateSetting(
      'app_title',
      title,
      'Customizable application title displayed throughout the system'
    );
  },

  /**
   * Update alert thresholds
   */
  async updateAlertThresholds(thresholds: AlertThresholds): Promise<void> {
    return this.updateSetting(
      'alert_thresholds',
      thresholds,
      'Multi-level alert threshold configuration for certification expiry notifications'
    );
  },

  /**
   * Update pilot requirements
   */
  async updatePilotRequirements(requirements: PilotRequirements): Promise<void> {
    return this.updateSetting(
      'pilot_requirements',
      requirements,
      'Pilot staffing requirements and ratios'
    );
  },

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(): Promise<void> {
    try {
      const defaultSettings = [
        {
          key: 'app_title',
          value: 'Air Niugini Pilot Management System',
          description: 'Customizable application title displayed throughout the system',
        },
        {
          key: 'alert_thresholds',
          value: {
            critical_days: 7,
            urgent_days: 14,
            warning_30_days: 30,
            warning_60_days: 60,
            early_warning_90_days: 90,
          },
          description:
            'Multi-level alert threshold configuration for certification expiry notifications',
        },
        {
          key: 'pilot_requirements',
          value: {
            pilot_retirement_age: 65,
            number_of_aircraft: 2,
            captains_per_hull: 7,
            first_officers_per_hull: 7,
            minimum_captains_per_hull: 10,
            minimum_first_officers_per_hull: 10,
            training_captains_per_pilots: 11,
            examiners_per_pilots: 11,
          },
          description: 'Pilot staffing requirements and ratios',
        },
      ];

      for (const setting of defaultSettings) {
        await this.updateSetting(setting.key, setting.value, setting.description);
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  },
};
