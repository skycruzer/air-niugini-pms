/**
 * Unified Export Service
 * Consolidates all export functionality for reports, pilots, certifications, and leave requests
 * Supports CSV, PDF, and Excel formats with consistent formatting
 */

import { format } from 'date-fns';
import type { PilotWithCertifications } from './pilot-service-client';
import type { LeaveRequest } from './leave-service';

// Export formats
export type ExportFormat = 'csv' | 'pdf' | 'excel';

// Export options
export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeTimestamp?: boolean;
  includeHeaders?: boolean;
  customFields?: string[];
}

/**
 * Base export class with common functionality
 */
class BaseExporter {
  protected generateFilename(basename: string, format: string, includeTimestamp: boolean): string {
    const timestamp = includeTimestamp ? `_${format(new Date(), 'yyyy-MM-dd_HHmmss')}` : '';
    return `${basename}${timestamp}.${format}`;
  }

  protected downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  protected escapeCSV(value: any): string {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }
}

/**
 * CSV Exporter
 */
class CSVExporter extends BaseExporter {
  export<T extends Record<string, any>>(
    data: T[],
    headers: { key: keyof T; label: string }[],
    options: ExportOptions
  ): void {
    const filename =
      options.filename || this.generateFilename('export', 'csv', options.includeTimestamp ?? true);

    let csv = '';

    // Add headers
    if (options.includeHeaders !== false) {
      csv += headers.map((h) => this.escapeCSV(h.label)).join(',') + '\n';
    }

    // Add data rows
    data.forEach((row) => {
      csv += headers.map((h) => this.escapeCSV(row[h.key])).join(',') + '\n';
    });

    this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  }
}

/**
 * Unified Export Service
 */
export class UnifiedExportService {
  private csvExporter = new CSVExporter();

  /**
   * Export pilots to CSV
   */
  exportPilots(pilots: PilotWithCertifications[], options: Partial<ExportOptions> = {}): void {
    const headers = [
      { key: 'employee_id' as const, label: 'Employee ID' },
      { key: 'first_name' as const, label: 'First Name' },
      { key: 'last_name' as const, label: 'Last Name' },
      { key: 'role' as const, label: 'Role' },
      { key: 'email' as const, label: 'Email' },
      { key: 'phone' as const, label: 'Phone' },
      { key: 'date_of_birth' as const, label: 'Date of Birth' },
      { key: 'commencement_date' as const, label: 'Commencement Date' },
      { key: 'seniority_number' as const, label: 'Seniority' },
      { key: 'is_active' as const, label: 'Status' },
    ];

    const formattedData = pilots.map((pilot) => ({
      ...pilot,
      is_active: pilot.is_active ? 'Active' : 'Inactive',
      date_of_birth: pilot.date_of_birth ? format(new Date(pilot.date_of_birth), 'yyyy-MM-dd') : '',
      commencement_date: pilot.commencement_date
        ? format(new Date(pilot.commencement_date), 'yyyy-MM-dd')
        : '',
    }));

    this.csvExporter.export(formattedData, headers, {
      format: 'csv',
      filename: options.filename || 'pilots_export',
      includeTimestamp: options.includeTimestamp ?? true,
      includeHeaders: options.includeHeaders ?? true,
    });
  }

  /**
   * Export certifications to CSV
   */
  exportCertifications(certifications: any[], options: Partial<ExportOptions> = {}): void {
    const headers = [
      { key: 'pilot_name' as const, label: 'Pilot Name' },
      { key: 'employee_id' as const, label: 'Employee ID' },
      { key: 'check_code' as const, label: 'Check Code' },
      { key: 'check_description' as const, label: 'Check Description' },
      { key: 'category' as const, label: 'Category' },
      { key: 'expiry_date' as const, label: 'Expiry Date' },
      { key: 'status' as const, label: 'Status' },
      { key: 'days_until_expiry' as const, label: 'Days Until Expiry' },
    ];

    const formattedData = certifications.map((cert) => ({
      ...cert,
      expiry_date: cert.expiry_date ? format(new Date(cert.expiry_date), 'yyyy-MM-dd') : 'N/A',
    }));

    this.csvExporter.export(formattedData, headers, {
      format: 'csv',
      filename: options.filename || 'certifications_export',
      includeTimestamp: options.includeTimestamp ?? true,
      includeHeaders: options.includeHeaders ?? true,
    });
  }

  /**
   * Export leave requests to CSV
   */
  exportLeaveRequests(leaveRequests: LeaveRequest[], options: Partial<ExportOptions> = {}): void {
    const headers = [
      { key: 'pilot_name' as const, label: 'Pilot Name' },
      { key: 'employee_id' as const, label: 'Employee ID' },
      { key: 'leave_type' as const, label: 'Leave Type' },
      { key: 'start_date' as const, label: 'Start Date' },
      { key: 'end_date' as const, label: 'End Date' },
      { key: 'roster_period' as const, label: 'Roster Period' },
      { key: 'status' as const, label: 'Status' },
      { key: 'reason' as const, label: 'Reason' },
    ];

    const formattedData = leaveRequests.map((leave) => ({
      pilot_name: `${leave.pilots?.first_name} ${leave.pilots?.last_name}`,
      employee_id: leave.pilots?.employee_id,
      leave_type: leave.leave_type,
      start_date: format(new Date(leave.start_date), 'yyyy-MM-dd'),
      end_date: format(new Date(leave.end_date), 'yyyy-MM-dd'),
      roster_period: leave.roster_period,
      status: leave.status,
      reason: leave.reason || '',
    }));

    this.csvExporter.export(formattedData, headers, {
      format: 'csv',
      filename: options.filename || 'leave_requests_export',
      includeTimestamp: options.includeTimestamp ?? true,
      includeHeaders: options.includeHeaders ?? true,
    });
  }

  /**
   * Export compliance report to CSV
   */
  exportComplianceReport(data: any, options: Partial<ExportOptions> = {}): void {
    const headers = [
      { key: 'category' as const, label: 'Category' },
      { key: 'total' as const, label: 'Total' },
      { key: 'current' as const, label: 'Current' },
      { key: 'expiring' as const, label: 'Expiring' },
      { key: 'expired' as const, label: 'Expired' },
      { key: 'compliance_rate' as const, label: 'Compliance Rate' },
    ];

    this.csvExporter.export(data, headers, {
      format: 'csv',
      filename: options.filename || 'compliance_report',
      includeTimestamp: options.includeTimestamp ?? true,
      includeHeaders: options.includeHeaders ?? true,
    });
  }

  /**
   * Export generic data to CSV
   */
  exportGeneric<T extends Record<string, any>>(
    data: T[],
    headers: { key: keyof T; label: string }[],
    filename: string,
    options: Partial<ExportOptions> = {}
  ): void {
    this.csvExporter.export(data, headers, {
      format: 'csv',
      filename: filename,
      includeTimestamp: options.includeTimestamp ?? true,
      includeHeaders: options.includeHeaders ?? true,
    });
  }
}

// Export singleton instance
export const unifiedExportService = new UnifiedExportService();

// Convenience exports for backwards compatibility
export const exportPilotsToCSV = (pilots: PilotWithCertifications[]) =>
  unifiedExportService.exportPilots(pilots);

export const exportCertificationsToCSV = (certifications: any[]) =>
  unifiedExportService.exportCertifications(certifications);

export const exportLeaveRequestsToCSV = (leaveRequests: LeaveRequest[]) =>
  unifiedExportService.exportLeaveRequests(leaveRequests);

export const exportComplianceReport = (data: any) =>
  unifiedExportService.exportComplianceReport(data);
