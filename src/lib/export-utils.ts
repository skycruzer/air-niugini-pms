/**
 * @fileoverview Export utilities for Air Niugini B767 Pilot Management System
 * Provides comprehensive CSV export functionality for pilots, certifications, leave requests,
 * and compliance reporting. All exports include proper Air Niugini branding and timestamps.
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-27
 */

import { format } from 'date-fns';
import { calculateRetirementInfo } from './retirement-utils';

/**
 * Interface for pilot data used in CSV exports
 * Contains all pilot information including certification summary statistics
 *
 * @interface PilotExportData
 * @property {string} employee_id - Unique pilot employee identifier
 * @property {string} first_name - Pilot's first name
 * @property {string} [middle_name] - Optional middle name
 * @property {string} last_name - Pilot's last name
 * @property {string} role - Captain or First Officer
 * @property {string} [contract_type] - Fulltime, Contract, or Casual
 * @property {string} [nationality] - Pilot's nationality
 * @property {string} [passport_number] - Passport number
 * @property {string} [passport_expiry] - Passport expiry date (YYYY-MM-DD)
 * @property {string} [date_of_birth] - Birth date (YYYY-MM-DD)
 * @property {string} [commencement_date] - Employment start date (YYYY-MM-DD)
 * @property {number} [seniority_number] - Seniority ranking (1 = most senior)
 * @property {boolean} is_active - Whether pilot is currently active
 * @property {number} [age] - Calculated age in years
 * @property {number} [years_of_service] - Calculated years of service
 * @property {Object} [retirement] - Retirement information including date and time remaining
 * @property {Object} certificationStatus - Certification summary statistics
 * @property {number} certificationStatus.total - Total number of certifications
 * @property {number} certificationStatus.current - Number of current certifications
 * @property {number} certificationStatus.expiring - Number expiring within 30 days
 * @property {number} certificationStatus.expired - Number of expired certifications
 */
export interface PilotExportData {
  employee_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  role: string;
  contract_type?: string;
  nationality?: string;
  passport_number?: string;
  passport_expiry?: string;
  date_of_birth?: string;
  commencement_date?: string;
  seniority_number?: number;
  is_active: boolean;
  age?: number;
  years_of_service?: number;
  retirement?: {
    retirementDate: string;
    timeToRetirement: string;
    retirementStatus: 'active' | 'nearing' | 'due_soon' | 'overdue';
  };
  certificationStatus: {
    total: number;
    current: number;
    expiring: number;
    expired: number;
  };
}

/**
 * Interface for certification data used in CSV exports
 * Contains individual certification records with status information
 *
 * @interface CertificationExportData
 * @property {string} pilot_name - Full name of the pilot
 * @property {string} employee_id - Pilot's employee identifier
 * @property {string} check_code - Certification check code (e.g., "PC", "LPC")
 * @property {string} check_description - Full description of the certification
 * @property {string} category - Certification category for grouping
 * @property {string} [expiry_date] - Expiry date (YYYY-MM-DD) or "Not Set"
 * @property {string} status - Current status (Current, Expiring, Expired)
 * @property {number} [days_until_expiry] - Days until expiry (negative if expired)
 */
export interface CertificationExportData {
  pilot_name: string;
  employee_id: string;
  check_code: string;
  check_description: string;
  category: string;
  expiry_date?: string;
  status: string;
  days_until_expiry?: number;
}

/**
 * Converts an array of objects to a properly formatted CSV string
 * Handles special characters, commas, and quotes according to RFC 4180 CSV standard
 *
 * @param {any[]} data - Array of objects to convert to CSV
 * @param {string} [filename] - Optional filename (currently unused, kept for compatibility)
 * @returns {string} Formatted CSV string with headers and escaped values
 *
 * @example
 * const pilots = [
 *   { name: 'John Doe', role: 'Captain', active: true },
 *   { name: 'Jane Smith', role: 'First Officer', active: false }
 * ];
 * const csv = arrayToCSV(pilots);
 * // Returns: "name,role,active\nJohn Doe,Captain,true\nJane Smith,First Officer,false"
 */
export function arrayToCSV(data: any[], filename?: string): string {
  if (!data.length) return '';

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escape commas and quotes according to RFC 4180
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        })
        .join(',')
    ),
  ].join('\n');

  return csvContent;
}

/**
 * Triggers a browser download of CSV content as a file
 * Creates a temporary blob URL and automatically initiates the download
 *
 * @param {string} csvContent - The CSV content string to download
 * @param {string} filename - The filename for the downloaded file (should include .csv extension)
 * @returns {void}
 *
 * @example
 * const csvData = "name,role\nJohn Doe,Captain";
 * downloadCSV(csvData, "pilots-export-2025-09-27.csv");
 *
 * @security This function only works in browser environments with user interaction
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the object URL to prevent memory leaks
  URL.revokeObjectURL(url);
}

/**
 * Exports pilot data to a CSV file with comprehensive pilot information
 * Includes personal details, employment info, and certification status summary
 *
 * @param {PilotExportData[]} pilots - Array of pilot data to export
 * @param {boolean} [filtered=false] - Whether the data represents a filtered subset
 * @returns {void} - Initiates a file download
 *
 * @description
 * Creates a comprehensive pilot export including:
 * - Personal information (name, nationality, passport)
 * - Employment details (role, contract type, seniority)
 * - Service calculations (age, years of service)
 * - Certification status summary (current, expiring, expired counts)
 *
 * @example
 * const pilots = [
 *   {
 *     employee_id: "2393",
 *     first_name: "MAURICE",
 *     last_name: "RONDEAU",
 *     role: "Captain",
 *     is_active: true,
 *     certificationStatus: { total: 15, current: 12, expiring: 2, expired: 1 }
 *   }
 * ];
 * exportPilotsToCSV(pilots, false);
 * // Downloads: "Air-Niugini-Pilots-2025-09-27-1430.csv"
 */
export function exportPilotsToCSV(pilots: PilotExportData[], filtered = false): void {
  const exportData = pilots.map((pilot) => ({
    'Employee ID': pilot.employee_id,
    'First Name': pilot.first_name,
    'Middle Name': pilot.middle_name || '',
    'Last Name': pilot.last_name,
    'Full Name': `${pilot.first_name} ${pilot.middle_name ? pilot.middle_name + ' ' : ''}${pilot.last_name}`,
    Role: pilot.role,
    'Contract Type': pilot.contract_type || '',
    Nationality: pilot.nationality || '',
    'Passport Number': pilot.passport_number || '',
    'Passport Expiry': pilot.passport_expiry || '',
    'Date of Birth': pilot.date_of_birth || '',
    Age: pilot.age || '',
    'Commencement Date': pilot.commencement_date || '',
    'Years of Service': pilot.years_of_service || '',
    'Seniority Number': pilot.seniority_number || '',
    Status: pilot.is_active ? 'Active' : 'Inactive',
    'Retirement Date': pilot.retirement?.retirementDate || '',
    'Time to Retirement': pilot.retirement?.timeToRetirement || '',
    'Retirement Status': pilot.retirement?.retirementStatus || 'not_calculated',
    'Total Certifications': pilot.certificationStatus.total,
    'Current Certifications': pilot.certificationStatus.current,
    'Expiring Certifications': pilot.certificationStatus.expiring,
    'Expired Certifications': pilot.certificationStatus.expired,
    'Certification Status':
      pilot.certificationStatus.expired > 0
        ? 'Has Expired'
        : pilot.certificationStatus.expiring > 0
          ? 'Has Expiring'
          : 'All Current',
  }));

  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
  const prefix = filtered ? 'Filtered-' : '';
  const filename = `${prefix}Air-Niugini-Pilots-${timestamp}.csv`;

  const csvContent = arrayToCSV(exportData);
  downloadCSV(csvContent, filename);
}

/**
 * Exports certification data to a CSV file with individual certification records
 * Includes pilot information, certification details, and expiry status
 *
 * @param {CertificationExportData[]} certifications - Array of certification data to export
 * @param {boolean} [filtered=false] - Whether the data represents a filtered subset
 * @returns {void} - Initiates a file download
 *
 * @description
 * Creates a detailed certification export including:
 * - Pilot identification (name, employee ID)
 * - Certification details (code, description, category)
 * - Expiry information (date, days remaining, urgency level)
 * - Status classification (Current, Expiring, Expired)
 *
 * @example
 * const certifications = [
 *   {
 *     pilot_name: "MAURICE RONDEAU",
 *     employee_id: "2393",
 *     check_code: "PC",
 *     check_description: "Proficiency Check",
 *     category: "Flight",
 *     expiry_date: "2025-12-31",
 *     status: "Current",
 *     days_until_expiry: 95
 *   }
 * ];
 * exportCertificationsToCSV(certifications, true);
 * // Downloads: "Filtered-Air-Niugini-Certifications-2025-09-27-1430.csv"
 */
export function exportCertificationsToCSV(
  certifications: CertificationExportData[],
  filtered = false
): void {
  const exportData = certifications.map((cert) => ({
    'Pilot Name': cert.pilot_name,
    'Employee ID': cert.employee_id,
    'Check Code': cert.check_code,
    'Check Description': cert.check_description,
    Category: cert.category,
    'Expiry Date': cert.expiry_date || 'Not Set',
    Status: cert.status,
    'Days Until Expiry': cert.days_until_expiry !== undefined ? cert.days_until_expiry : 'N/A',
    'Urgency Level':
      cert.days_until_expiry !== undefined
        ? cert.days_until_expiry < 0
          ? 'Expired'
          : cert.days_until_expiry <= 30
            ? 'Urgent'
            : 'Current'
        : 'No Date Set',
  }));

  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
  const prefix = filtered ? 'Filtered-' : '';
  const filename = `${prefix}Air-Niugini-Certifications-${timestamp}.csv`;

  const csvContent = arrayToCSV(exportData);
  downloadCSV(csvContent, filename);
}

/**
 * Exports leave request data to a CSV file with comprehensive request information
 * Includes pilot details, request specifics, and approval workflow data
 *
 * @param {any[]} leaveRequests - Array of leave request data to export
 * @param {boolean} [filtered=false] - Whether the data represents a filtered subset
 * @returns {void} - Initiates a file download
 *
 * @description
 * Creates a complete leave request export including:
 * - Pilot identification and employee details
 * - Request specifics (type, dates, duration, roster period)
 * - Approval workflow (status, reviewer, comments)
 * - Request metadata (method, timing, late request flag)
 *
 * @example
 * const requests = [
 *   {
 *     pilot_name: "MAURICE RONDEAU",
 *     employee_id: "2393",
 *     request_type: "RDO",
 *     roster_period: "RP13/2025",
 *     start_date: "2025-11-21",
 *     end_date: "2025-11-24",
 *     status: "PENDING",
 *     days_count: 4
 *   }
 * ];
 * exportLeaveRequestsToCSV(requests, false);
 * // Downloads: "Air-Niugini-Leave-Requests-2025-09-27-1430.csv"
 */
export function exportLeaveRequestsToCSV(leaveRequests: any[], filtered = false): void {
  const exportData = leaveRequests.map((request) => ({
    'Pilot Name': request.pilot_name,
    'Employee ID': request.employee_id,
    'Request Type': request.request_type,
    'Roster Period': request.roster_period,
    'Start Date': request.start_date,
    'End Date': request.end_date,
    'Days Count': request.days_count,
    Status: request.status,
    Reason: request.reason || '',
    'Request Date': request.request_date,
    'Request Method': request.request_method,
    'Is Late Request': request.is_late_request ? 'Yes' : 'No',
    'Reviewed By': request.reviewer_name || 'Pending',
    'Reviewed At': request.reviewed_at || '',
    'Review Comments': request.review_comments || '',
  }));

  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
  const prefix = filtered ? 'Filtered-' : '';
  const filename = `${prefix}Air-Niugini-Leave-Requests-${timestamp}.csv`;

  const csvContent = arrayToCSV(exportData);
  downloadCSV(csvContent, filename);
}

/**
 * Calculates a pilot's current age in years from their date of birth
 * Uses precise date arithmetic to account for leap years and month/day differences
 *
 * @param {string} dateOfBirth - Date of birth in YYYY-MM-DD format
 * @returns {number} Age in completed years
 *
 * @example
 * const age = calculateAge("1980-05-15");
 * // Returns: 45 (as of 2025-09-27)
 *
 * @note This function accounts for whether the birthday has occurred this year
 */
export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Calculates a pilot's years of service from their commencement date
 * Uses precise date arithmetic and ensures non-negative results
 *
 * @param {string} commencementDate - Employment start date in YYYY-MM-DD format
 * @returns {number} Years of service (minimum 0)
 *
 * @example
 * const years = calculateYearsOfService("2010-03-15");
 * // Returns: 15 (as of 2025-09-27)
 *
 * @note This function accounts for whether the anniversary has occurred this year
 */
export function calculateYearsOfService(commencementDate: string): number {
  const today = new Date();
  const startDate = new Date(commencementDate);
  let years = today.getFullYear() - startDate.getFullYear();
  const monthDiff = today.getMonth() - startDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < startDate.getDate())) {
    years--;
  }

  return Math.max(0, years);
}

/**
 * Exports a specialized compliance report for pilots with certification issues
 * Focuses on non-compliant pilots with expired or expiring certifications
 *
 * @param {PilotExportData[]} pilots - Array of all pilot data
 * @returns {void} - Initiates a file download
 *
 * @description
 * Creates a focused compliance report including:
 * - Only pilots with expired or expiring certifications
 * - Compliance status classification (NON-COMPLIANT vs WARNING)
 * - Priority levels (HIGH for expired, MEDIUM for expiring)
 * - Summary statistics for management review
 *
 * @example
 * const allPilots = [
 *   {
 *     employee_id: "2393",
 *     first_name: "MAURICE",
 *     last_name: "RONDEAU",
 *     certificationStatus: { expired: 2, expiring: 1, current: 12, total: 15 }
 *   }
 * ];
 * exportComplianceReport(allPilots);
 * // Downloads: "Air-Niugini-Compliance-Report-2025-09-27-1430.csv"
 * // Contains only pilots with certification issues
 *
 * @regulatory Used for aviation compliance monitoring and audits
 */
export function exportComplianceReport(pilots: PilotExportData[]): void {
  const nonCompliantPilots = pilots.filter(
    (pilot) => pilot.certificationStatus.expired > 0 || pilot.certificationStatus.expiring > 0
  );

  const exportData = nonCompliantPilots.map((pilot) => ({
    'Employee ID': pilot.employee_id,
    'Pilot Name': `${pilot.first_name} ${pilot.middle_name ? pilot.middle_name + ' ' : ''}${pilot.last_name}`,
    Role: pilot.role,
    Status: pilot.is_active ? 'Active' : 'Inactive',
    'Expired Certifications': pilot.certificationStatus.expired,
    'Expiring Certifications': pilot.certificationStatus.expiring,
    'Current Certifications': pilot.certificationStatus.current,
    'Total Certifications': pilot.certificationStatus.total,
    'Retirement Date': pilot.retirement?.retirementDate || '',
    'Time to Retirement': pilot.retirement?.timeToRetirement || '',
    'Retirement Status': pilot.retirement?.retirementStatus || 'not_calculated',
    'Compliance Status':
      pilot.certificationStatus.expired > 0 ? 'NON-COMPLIANT (Expired)' : 'WARNING (Expiring Soon)',
    Priority: pilot.certificationStatus.expired > 0 ? 'HIGH' : 'MEDIUM',
  }));

  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
  const filename = `Air-Niugini-Compliance-Report-${timestamp}.csv`;

  const csvContent = arrayToCSV(exportData);
  downloadCSV(csvContent, filename);
}
