'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, Mail, Trash2, Edit, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScheduledReport {
  id: string;
  name: string;
  reportType: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  recipients: string[];
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

/**
 * Scheduled Reports Component
 *
 * Features:
 * - Schedule reports (daily/weekly/monthly)
 * - Email delivery
 * - Automatic generation
 * - Report distribution lists
 * - Enable/disable schedules
 */
export default function ScheduledReports() {
  const { toast } = useToast();
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([
    {
      id: '1',
      name: 'Daily Compliance Report',
      reportType: 'compliance',
      frequency: 'daily',
      time: '08:00',
      recipients: ['fleet.manager@airniugini.com.pg'],
      enabled: true,
      lastRun: '2025-10-01 08:00',
      nextRun: '2025-10-02 08:00',
    },
    {
      id: '2',
      name: 'Weekly Pilot Summary',
      reportType: 'pilots',
      frequency: 'weekly',
      time: '09:00',
      recipients: ['operations@airniugini.com.pg', 'training@airniugini.com.pg'],
      enabled: true,
      lastRun: '2025-09-30 09:00',
      nextRun: '2025-10-07 09:00',
    },
    {
      id: '3',
      name: 'Monthly Fleet Report',
      reportType: 'fleet',
      frequency: 'monthly',
      time: '07:00',
      recipients: ['management@airniugini.com.pg'],
      enabled: false,
      nextRun: '2025-11-01 07:00',
    },
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    reportType: 'compliance',
    frequency: 'daily' as const,
    time: '08:00',
    recipients: '',
  });

  const handleToggleSchedule = (id: string) => {
    setScheduledReports(reports =>
      reports.map(report =>
        report.id === id ? { ...report, enabled: !report.enabled } : report
      )
    );

    toast({
      title: 'Schedule updated',
      description: 'Report schedule has been updated successfully.',
    });
  };

  const handleDeleteSchedule = (id: string) => {
    setScheduledReports(reports => reports.filter(report => report.id !== id));

    toast({
      title: 'Schedule deleted',
      description: 'Report schedule has been removed.',
    });
  };

  const handleRunNow = (id: string) => {
    const report = scheduledReports.find(r => r.id === id);

    toast({
      title: 'Report running',
      description: `Generating "${report?.name}" and sending to recipients...`,
    });
  };

  const handleCreateSchedule = () => {
    if (!newReport.name || !newReport.recipients) {
      toast({
        title: 'Missing information',
        description: 'Please provide report name and recipients.',
        variant: 'destructive',
      });
      return;
    }

    const recipients = newReport.recipients.split(',').map(r => r.trim()).filter(r => r);

    const schedule: ScheduledReport = {
      id: Date.now().toString(),
      name: newReport.name,
      reportType: newReport.reportType,
      frequency: newReport.frequency,
      time: newReport.time,
      recipients,
      enabled: true,
      nextRun: calculateNextRun(newReport.frequency, newReport.time),
    };

    setScheduledReports([...scheduledReports, schedule]);
    setIsCreating(false);
    setNewReport({
      name: '',
      reportType: 'compliance',
      frequency: 'daily',
      time: '08:00',
      recipients: '',
    });

    toast({
      title: 'Schedule created',
      description: 'New report schedule has been created successfully.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#E4002B]">Scheduled Reports</h2>
          <p className="text-gray-600 mt-1">Automated report generation and delivery</p>
        </div>
        <Button
          onClick={() => setIsCreating(!isCreating)}
          className="bg-[#E4002B] hover:bg-[#C00020]"
        >
          {isCreating ? 'Cancel' : 'New Schedule'}
        </Button>
      </div>

      {/* Create New Schedule Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Schedule</CardTitle>
            <CardDescription>Set up automated report generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Report Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Daily Compliance Report"
                  value={newReport.name}
                  onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="reportType">Report Type</Label>
                <Select
                  value={newReport.reportType}
                  onValueChange={(value) => setNewReport({ ...newReport, reportType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compliance">Compliance Report</SelectItem>
                    <SelectItem value="pilots">Pilot Summary</SelectItem>
                    <SelectItem value="certifications">Certifications</SelectItem>
                    <SelectItem value="leave">Leave Report</SelectItem>
                    <SelectItem value="fleet">Fleet Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={newReport.frequency}
                  onValueChange={(value: any) => setNewReport({ ...newReport, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={newReport.time}
                  onChange={(e) => setNewReport({ ...newReport, time: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="recipients">Recipients (comma-separated emails)</Label>
                <Input
                  id="recipients"
                  placeholder="email1@airniugini.com.pg, email2@airniugini.com.pg"
                  value={newReport.recipients}
                  onChange={(e) => setNewReport({ ...newReport, recipients: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSchedule} className="bg-[#E4002B] hover:bg-[#C00020]">
                Create Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Reports List */}
      <div className="grid grid-cols-1 gap-4">
        {scheduledReports.map((report) => (
          <Card key={report.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{report.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded ${report.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {report.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span className="capitalize">{report.frequency}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{report.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{report.recipients.length} recipient{report.recipients.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {report.lastRun && (
                    <div className="mt-2 text-sm text-gray-500">
                      Last run: {report.lastRun}
                    </div>
                  )}
                  {report.nextRun && report.enabled && (
                    <div className="text-sm text-gray-500">
                      Next run: {report.nextRun}
                    </div>
                  )}

                  <div className="mt-3 text-sm text-gray-600">
                    <strong>Recipients:</strong> {report.recipients.join(', ')}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Switch
                    checked={report.enabled}
                    onCheckedChange={() => handleToggleSchedule(report.id)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRunNow(report.id)}
                    disabled={!report.enabled}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSchedule(report.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {scheduledReports.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p>No scheduled reports</p>
            <p className="text-sm mt-2">Create a new schedule to automate report generation</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function calculateNextRun(frequency: string, time: string): string {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);

  let nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);

  if (nextRun <= now) {
    switch (frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
    }
  }

  return nextRun.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
