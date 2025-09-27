import { supabase } from './supabase'

export interface SystemSetting {
  id: string
  key: string
  value: any
  description: string | null
  created_at: string
  updated_at: string
}

export interface AlertThresholds {
  critical_days: number
  urgent_days: number
  warning_30_days: number
  warning_60_days: number
  early_warning_90_days: number
}

export interface PilotRequirements {
  pilot_retirement_age: number
  number_of_aircraft: number
  captains_per_hull: number
  first_officers_per_hull: number
  minimum_captains_per_hull: number
  minimum_first_officers_per_hull: number
  training_captains_per_pilots: number
  examiners_per_pilots: number
}

export interface SettingsData {
  app_title: string
  alert_thresholds: AlertThresholds
  pilot_requirements: PilotRequirements
}

/**
 * Settings service for managing system configuration
 */
export const settingsService = {
  /**
   * Get all system settings
   */
  async getSettings(): Promise<SettingsData> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('key')

      if (error) {
        console.error('Error fetching settings:', error)
        throw error
      }

      // Transform array to object structure
      const settings: Partial<SettingsData> = {}

      data?.forEach((setting) => {
        if (setting.key === 'app_title') {
          settings.app_title = setting.value
        } else if (setting.key === 'alert_thresholds') {
          settings.alert_thresholds = setting.value
        } else if (setting.key === 'pilot_requirements') {
          settings.pilot_requirements = setting.value
        }
      })

      // Return with defaults if not found
      return {
        app_title: settings.app_title || 'Air Niugini Pilot Management System',
        alert_thresholds: settings.alert_thresholds || {
          critical_days: 7,
          urgent_days: 14,
          warning_30_days: 30,
          warning_60_days: 60,
          early_warning_90_days: 90
        },
        pilot_requirements: settings.pilot_requirements || {
          pilot_retirement_age: 65,
          number_of_aircraft: 2,
          captains_per_hull: 7,
          first_officers_per_hull: 7,
          minimum_captains_per_hull: 10,
          minimum_first_officers_per_hull: 10,
          training_captains_per_pilots: 11,
          examiners_per_pilots: 11
        }
      }
    } catch (error) {
      console.error('Error in getSettings:', error)
      throw error
    }
  },

  /**
   * Update a specific setting
   */
  async updateSetting(key: string, value: any, description?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key,
          value,
          description,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        })

      if (error) {
        console.error('Error updating setting:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in updateSetting:', error)
      throw error
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
    )
  },

  /**
   * Update alert thresholds
   */
  async updateAlertThresholds(thresholds: AlertThresholds): Promise<void> {
    return this.updateSetting(
      'alert_thresholds',
      thresholds,
      'Multi-level alert threshold configuration for certification expiry notifications'
    )
  },

  /**
   * Update pilot requirements
   */
  async updatePilotRequirements(requirements: PilotRequirements): Promise<void> {
    return this.updateSetting(
      'pilot_requirements',
      requirements,
      'Pilot staffing requirements and ratios'
    )
  },

  /**
   * Get a specific setting by key
   */
  async getSetting(key: string): Promise<SystemSetting | null> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', key)
        .single()

      if (error) {
        console.error('Error fetching setting:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getSetting:', error)
      return null
    }
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
          description: 'Customizable application title displayed throughout the system'
        },
        {
          key: 'alert_thresholds',
          value: {
            critical_days: 7,
            urgent_days: 14,
            warning_30_days: 30,
            warning_60_days: 60,
            early_warning_90_days: 90
          },
          description: 'Multi-level alert threshold configuration for certification expiry notifications'
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
            examiners_per_pilots: 11
          },
          description: 'Pilot staffing requirements and ratios'
        }
      ]

      for (const setting of defaultSettings) {
        await this.updateSetting(setting.key, setting.value, setting.description)
      }
    } catch (error) {
      console.error('Error resetting settings:', error)
      throw error
    }
  }
}