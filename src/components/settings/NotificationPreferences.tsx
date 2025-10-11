/**
 * Air Niugini B767 Pilot Management System
 * Notification Preferences Component
 *
 * User interface for managing email notification settings
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { Bell, Mail, AlertCircle, Calendar, Info, Save, Loader2 } from 'lucide-react';

interface NotificationPreferencesData {
  email_enabled: boolean;
  email_address: string;
  certification_expiry_alerts: boolean;
  certification_expiry_days: number;
  leave_request_alerts: boolean;
  leave_approval_alerts: boolean;
  system_notifications: boolean;
  daily_digest: boolean;
  digest_time: string;
}

export default function NotificationPreferences() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferencesData>({
    email_enabled: true,
    email_address: user?.email || '',
    certification_expiry_alerts: true,
    certification_expiry_days: 30,
    leave_request_alerts: true,
    leave_approval_alerts: true,
    system_notifications: true,
    daily_digest: false,
    digest_time: '08:00',
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/notifications/preferences', {
        headers: {
          Authorization: `Bearer ${user?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load preferences');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setPreferences({
          email_enabled: result.data.email_enabled,
          email_address: result.data.email_address || user?.email || '',
          certification_expiry_alerts: result.data.certification_expiry_alerts,
          certification_expiry_days: result.data.certification_expiry_days,
          leave_request_alerts: result.data.leave_request_alerts,
          leave_approval_alerts: result.data.leave_approval_alerts,
          system_notifications: result.data.system_notifications,
          daily_digest: result.data.daily_digest,
          digest_time: result.data.digest_time?.substring(0, 5) || '08:00',
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({
          ...preferences,
          digest_time: `${preferences.digest_time  }:00`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Notification preferences saved successfully');
      } else {
        throw new Error(result.error || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: preferences.email_address,
          name: user?.name || 'User',
          type: 'system',
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Test notification sent to ${preferences.email_address}`);
      } else {
        throw new Error(result.error || 'Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send test notification');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
        <p className="text-gray-600 mt-1">
          Manage your email notification settings for certification alerts and system updates
        </p>
      </div>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#4F46E5]" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Configure your email address and enable/disable email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-enabled" className="text-base font-medium">
                Enable Email Notifications
              </Label>
              <p className="text-sm text-gray-600">Receive notifications via email</p>
            </div>
            <Switch
              id="email-enabled"
              checked={preferences.email_enabled}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, email_enabled: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-address">Email Address</Label>
            <Input
              id="email-address"
              type="email"
              value={preferences.email_address}
              onChange={(e) =>
                setPreferences((prev) => ({ ...prev, email_address: e.target.value }))
              }
              disabled={!preferences.email_enabled}
              placeholder="your.email@airniugini.com.pg"
            />
          </div>

          <Button variant="outline" onClick={handleTestNotification} className="w-full">
            <Bell className="h-4 w-4 mr-2" />
            Send Test Notification
          </Button>
        </CardContent>
      </Card>

      {/* Certification Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-[#4F46E5]" />
            Certification Expiry Alerts
          </CardTitle>
          <CardDescription>
            Get notified when pilot certifications are approaching expiry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="cert-alerts" className="text-base font-medium">
                Certification Alerts
              </Label>
              <p className="text-sm text-gray-600">Receive alerts for expiring certifications</p>
            </div>
            <Switch
              id="cert-alerts"
              checked={preferences.certification_expiry_alerts}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, certification_expiry_alerts: checked }))
              }
              disabled={!preferences.email_enabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cert-days">Alert Threshold (days before expiry)</Label>
            <Select
              value={preferences.certification_expiry_days.toString()}
              onValueChange={(value) =>
                setPreferences((prev) => ({
                  ...prev,
                  certification_expiry_days: parseInt(value),
                }))
              }
              disabled={!preferences.email_enabled || !preferences.certification_expiry_alerts}
            >
              <SelectTrigger id="cert-days">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              You'll receive alerts at 30, 14, 7, 3, and 1 days before expiry
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Leave Request Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#4F46E5]" />
            Leave Request Alerts
          </CardTitle>
          <CardDescription>Get notified about leave requests and approvals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="leave-request" className="text-base font-medium">
                New Leave Requests
              </Label>
              <p className="text-sm text-gray-600">
                Notify when new leave requests are submitted (Managers/Admins)
              </p>
            </div>
            <Switch
              id="leave-request"
              checked={preferences.leave_request_alerts}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, leave_request_alerts: checked }))
              }
              disabled={!preferences.email_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="leave-approval" className="text-base font-medium">
                Leave Request Status
              </Label>
              <p className="text-sm text-gray-600">
                Notify when your leave requests are approved or rejected
              </p>
            </div>
            <Switch
              id="leave-approval"
              checked={preferences.leave_approval_alerts}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, leave_approval_alerts: checked }))
              }
              disabled={!preferences.email_enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-[#4F46E5]" />
            System Notifications
          </CardTitle>
          <CardDescription>Receive important system updates and announcements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="system-notifs" className="text-base font-medium">
                System Notifications
              </Label>
              <p className="text-sm text-gray-600">
                Important updates, maintenance alerts, and system announcements
              </p>
            </div>
            <Switch
              id="system-notifs"
              checked={preferences.system_notifications}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, system_notifications: checked }))
              }
              disabled={!preferences.email_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="daily-digest" className="text-base font-medium">
                Daily Digest Email
              </Label>
              <p className="text-sm text-gray-600">
                Receive a daily summary of certifications and leave requests
              </p>
            </div>
            <Switch
              id="daily-digest"
              checked={preferences.daily_digest}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, daily_digest: checked }))
              }
              disabled={!preferences.email_enabled}
            />
          </div>

          {preferences.daily_digest && (
            <div className="space-y-2 pl-4 border-l-2 border-[#06B6D4]">
              <Label htmlFor="digest-time">Daily Digest Time</Label>
              <Input
                id="digest-time"
                type="time"
                value={preferences.digest_time}
                onChange={(e) =>
                  setPreferences((prev) => ({ ...prev, digest_time: e.target.value }))
                }
                disabled={!preferences.email_enabled}
              />
              <p className="text-xs text-gray-500">
                Time when you'd like to receive the daily digest
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={loadPreferences} disabled={saving}>
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !preferences.email_enabled}
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
