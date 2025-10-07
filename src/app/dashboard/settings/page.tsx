'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { permissions } from '@/lib/auth-utils';
import {
  settingsService,
  type SettingsData,
  type AlertThresholds,
  type PilotRequirements,
} from '@/lib/settings-service';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings, RefreshCw, CheckCircle, Sliders, Save, Bell, Users } from 'lucide-react';

const alertThresholdsSchema = z.object({
  critical_days: z.number().min(1).max(30),
  urgent_days: z.number().min(1).max(60),
  warning_30_days: z.number().min(1).max(90),
  warning_60_days: z.number().min(1).max(120),
  early_warning_90_days: z.number().min(1).max(180),
});

const pilotRequirementsSchema = z.object({
  pilot_retirement_age: z.number().min(60).max(70),
  number_of_aircraft: z.number().min(1).max(10),
  captains_per_hull: z.number().min(1).max(20),
  first_officers_per_hull: z.number().min(1).max(20),
  minimum_captains_per_hull: z.number().min(1).max(30),
  minimum_first_officers_per_hull: z.number().min(1).max(30),
  training_captains_per_pilots: z.number().min(1).max(50),
  examiners_per_pilots: z.number().min(1).max(50),
});

const appTitleSchema = z.object({
  app_title: z.string().min(1).max(100),
});

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'alerts' | 'requirements'>('general');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form for app title
  const appTitleForm = useForm({
    resolver: zodResolver(appTitleSchema),
    defaultValues: { app_title: '' },
  });

  // Form for alert thresholds
  const alertsForm = useForm({
    resolver: zodResolver(alertThresholdsSchema),
    defaultValues: {
      critical_days: 7,
      urgent_days: 14,
      warning_30_days: 30,
      warning_60_days: 60,
      early_warning_90_days: 90,
    },
  });

  // Form for pilot requirements
  const requirementsForm = useForm({
    resolver: zodResolver(pilotRequirementsSchema),
    defaultValues: {
      pilot_retirement_age: 65,
      number_of_aircraft: 2,
      captains_per_hull: 7,
      first_officers_per_hull: 7,
      minimum_captains_per_hull: 10,
      minimum_first_officers_per_hull: 10,
      training_captains_per_pilots: 11,
      examiners_per_pilots: 11,
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      setSettings(data);

      // Update forms with loaded data
      appTitleForm.reset({ app_title: data.app_title });
      alertsForm.reset(data.alert_thresholds);
      requirementsForm.reset(data.pilot_requirements);
    } catch (error) {
      console.error('Error loading settings:', error);
      setErrorMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (message: string, isError = false) => {
    if (isError) {
      setErrorMessage(message);
      setSuccessMessage(null);
    } else {
      setSuccessMessage(message);
      setErrorMessage(null);
    }
    setTimeout(() => {
      setSuccessMessage(null);
      setErrorMessage(null);
    }, 3000);
  };

  const onSubmitAppTitle = async (data: { app_title: string }) => {
    try {
      setSaving('app_title');
      await settingsService.updateAppTitle(data.app_title);
      setSettings((prev) => (prev ? { ...prev, app_title: data.app_title } : null));
      showMessage('App title updated successfully');
    } catch (error) {
      console.error('Error updating app title:', error);
      showMessage('Failed to update app title', true);
    } finally {
      setSaving(null);
    }
  };

  const onSubmitAlerts = async (data: AlertThresholds) => {
    try {
      setSaving('alerts');
      await settingsService.updateAlertThresholds(data);
      setSettings((prev) => (prev ? { ...prev, alert_thresholds: data } : null));
      showMessage('Alert thresholds updated successfully');
    } catch (error) {
      console.error('Error updating alert thresholds:', error);
      showMessage('Failed to update alert thresholds', true);
    } finally {
      setSaving(null);
    }
  };

  const onSubmitRequirements = async (data: PilotRequirements) => {
    try {
      setSaving('requirements');
      await settingsService.updatePilotRequirements(data);
      setSettings((prev) => (prev ? { ...prev, pilot_requirements: data } : null));
      showMessage('Pilot requirements updated successfully');
    } catch (error) {
      console.error('Error updating pilot requirements:', error);
      showMessage('Failed to update pilot requirements', true);
    } finally {
      setSaving(null);
    }
  };

  const resetToDefaults = async () => {
    if (
      !confirm(
        'Are you sure you want to reset all settings to default values? This cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setSaving('reset');
      await settingsService.resetToDefaults();
      await loadSettings();
      showMessage('Settings reset to defaults successfully');
    } catch (error) {
      console.error('Error resetting settings:', error);
      showMessage('Failed to reset settings', true);
    } finally {
      setSaving(null);
    }
  };

  if (!permissions.canManageSettings(user)) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6">
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-red-600 text-3xl">🚫</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Denied</h2>
              <p className="text-gray-600">
                You don&apos;t have permission to access system settings. Only administrators can modify
                system configuration.
              </p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Settings className="w-8 h-8 mr-3" />
                  System Settings
                </h1>
                <p className="text-gray-600 mt-1">
                  Configure system preferences and B767 fleet operational parameters
                </p>
              </div>
              <button
                onClick={resetToDefaults}
                disabled={saving === 'reset'}
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {saving === 'reset' ? 'Resetting...' : 'Reset to Defaults'}
              </button>
            </div>

            {/* Messages */}
            {successMessage && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                ❌ {errorMessage}
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading settings...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex items-center space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'general'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Sliders className="w-4 h-4 mr-2" />
                  General
                </button>
                <button
                  onClick={() => setActiveTab('alerts')}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'alerts'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Alert Thresholds
                </button>
                <button
                  onClick={() => setActiveTab('requirements')}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'requirements'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Pilot Requirements
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'general' && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Sliders className="w-5 h-5 mr-2" />
                      General Settings
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Configure basic application settings
                    </p>
                  </div>

                  <form onSubmit={appTitleForm.handleSubmit(onSubmitAppTitle)} className="p-6">
                    <div className="space-y-6">
                      <div>
                        <label
                          htmlFor="app_title"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Application Title
                        </label>
                        <input
                          {...appTitleForm.register('app_title')}
                          type="text"
                          id="app_title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-600 focus:border-blue-600"
                          placeholder="Enter application title"
                        />
                        {appTitleForm.formState.errors.app_title && (
                          <p className="text-red-600 text-sm mt-1">
                            {appTitleForm.formState.errors.app_title.message}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          This title appears in the browser tab and throughout the application
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={saving === 'app_title'}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {saving === 'app_title' ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'alerts' && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <span className="mr-2">🚨</span>
                      Alert Thresholds
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Configure certification expiry alert thresholds
                    </p>
                  </div>

                  <form onSubmit={alertsForm.handleSubmit(onSubmitAlerts)} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="critical_days"
                          className="block text-sm font-medium text-red-700 mb-2"
                        >
                          Critical Alert (Red)
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            {...alertsForm.register('critical_days', { valueAsNumber: true })}
                            type="number"
                            id="critical_days"
                            min="1"
                            max="30"
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                          />
                          <span className="text-sm text-gray-600">days before expiry</span>
                        </div>
                        {alertsForm.formState.errors.critical_days && (
                          <p className="text-red-600 text-sm mt-1">
                            {alertsForm.formState.errors.critical_days.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="urgent_days"
                          className="block text-sm font-medium text-orange-700 mb-2"
                        >
                          Urgent Alert (Orange)
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            {...alertsForm.register('urgent_days', { valueAsNumber: true })}
                            type="number"
                            id="urgent_days"
                            min="1"
                            max="60"
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                          />
                          <span className="text-sm text-gray-600">days before expiry</span>
                        </div>
                        {alertsForm.formState.errors.urgent_days && (
                          <p className="text-red-600 text-sm mt-1">
                            {alertsForm.formState.errors.urgent_days.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="warning_30_days"
                          className="block text-sm font-medium text-yellow-700 mb-2"
                        >
                          30-Day Warning (Yellow)
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            {...alertsForm.register('warning_30_days', { valueAsNumber: true })}
                            type="number"
                            id="warning_30_days"
                            min="1"
                            max="90"
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                          />
                          <span className="text-sm text-gray-600">days before expiry</span>
                        </div>
                        {alertsForm.formState.errors.warning_30_days && (
                          <p className="text-red-600 text-sm mt-1">
                            {alertsForm.formState.errors.warning_30_days.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="warning_60_days"
                          className="block text-sm font-medium text-blue-700 mb-2"
                        >
                          60-Day Warning (Blue)
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            {...alertsForm.register('warning_60_days', { valueAsNumber: true })}
                            type="number"
                            id="warning_60_days"
                            min="1"
                            max="120"
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                          <span className="text-sm text-gray-600">days before expiry</span>
                        </div>
                        {alertsForm.formState.errors.warning_60_days && (
                          <p className="text-red-600 text-sm mt-1">
                            {alertsForm.formState.errors.warning_60_days.message}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label
                          htmlFor="early_warning_90_days"
                          className="block text-sm font-medium text-green-700 mb-2"
                        >
                          90-Day Early Warning (Green)
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            {...alertsForm.register('early_warning_90_days', {
                              valueAsNumber: true,
                            })}
                            type="number"
                            id="early_warning_90_days"
                            min="1"
                            max="180"
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                          />
                          <span className="text-sm text-gray-600">days before expiry</span>
                        </div>
                        {alertsForm.formState.errors.early_warning_90_days && (
                          <p className="text-red-600 text-sm mt-1">
                            {alertsForm.formState.errors.early_warning_90_days.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end mt-6">
                      <button
                        type="submit"
                        disabled={saving === 'alerts'}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {saving === 'alerts' ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Alert Thresholds
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'requirements' && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <span className="mr-2">👥</span>
                      Pilot Requirements
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Configure pilot staffing requirements and operational parameters
                    </p>
                  </div>

                  <form
                    onSubmit={requirementsForm.handleSubmit(onSubmitRequirements)}
                    className="p-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="pilot_retirement_age"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Pilot Retirement Age
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            {...requirementsForm.register('pilot_retirement_age', {
                              valueAsNumber: true,
                            })}
                            type="number"
                            id="pilot_retirement_age"
                            min="60"
                            max="70"
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-600 focus:border-blue-600"
                          />
                          <span className="text-sm text-gray-600">years</span>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="number_of_aircraft"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Number of Aircraft
                        </label>
                        <input
                          {...requirementsForm.register('number_of_aircraft', {
                            valueAsNumber: true,
                          })}
                          type="number"
                          id="number_of_aircraft"
                          min="1"
                          max="10"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-600 focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="captains_per_hull"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Captains per Hull
                        </label>
                        <input
                          {...requirementsForm.register('captains_per_hull', {
                            valueAsNumber: true,
                          })}
                          type="number"
                          id="captains_per_hull"
                          min="1"
                          max="20"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-600 focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="first_officers_per_hull"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          First Officers per Hull
                        </label>
                        <input
                          {...requirementsForm.register('first_officers_per_hull', {
                            valueAsNumber: true,
                          })}
                          type="number"
                          id="first_officers_per_hull"
                          min="1"
                          max="20"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-600 focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="minimum_captains_per_hull"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Minimum Captains per Hull
                        </label>
                        <input
                          {...requirementsForm.register('minimum_captains_per_hull', {
                            valueAsNumber: true,
                          })}
                          type="number"
                          id="minimum_captains_per_hull"
                          min="1"
                          max="30"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-600 focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="minimum_first_officers_per_hull"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Minimum First Officers per Hull
                        </label>
                        <input
                          {...requirementsForm.register('minimum_first_officers_per_hull', {
                            valueAsNumber: true,
                          })}
                          type="number"
                          id="minimum_first_officers_per_hull"
                          min="1"
                          max="30"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-600 focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="training_captains_per_pilots"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Training Captains per Pilots
                        </label>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">1 per</span>
                          <input
                            {...requirementsForm.register('training_captains_per_pilots', {
                              valueAsNumber: true,
                            })}
                            type="number"
                            id="training_captains_per_pilots"
                            min="1"
                            max="50"
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-600 focus:border-blue-600"
                          />
                          <span className="text-sm text-gray-600">pilots</span>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="examiners_per_pilots"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Examiners per Pilots
                        </label>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">1 per</span>
                          <input
                            {...requirementsForm.register('examiners_per_pilots', {
                              valueAsNumber: true,
                            })}
                            type="number"
                            id="examiners_per_pilots"
                            min="1"
                            max="50"
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-600 focus:border-blue-600"
                          />
                          <span className="text-sm text-gray-600">pilots</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-6">
                      <button
                        type="submit"
                        disabled={saving === 'requirements'}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {saving === 'requirements' ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Requirements
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
