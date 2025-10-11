import * as XLSX from 'xlsx';
import { format } from 'date-fns';

/**
 * Excel Export Utilities
 * Professional Excel export with multiple sheets, formatting, and branding
 */

interface ExcelExportOptions {
  filename: string;
  sheets: ExcelSheet[];
  author?: string;
  company?: string;
}

interface ExcelSheet {
  name: string;
  data: any[];
  headers?: string[];
  columnWidths?: number[];
}

/**
 * Create and download a multi-sheet Excel workbook
 */
export function exportToExcel(options: ExcelExportOptions): void {
  const { filename, sheets, author = 'Fleet Office Management System', company = 'Fleet Office' } = options;

  // Create new workbook
  const workbook = XLSX.utils.book_new();

  // Set workbook properties
  workbook.Props = {
    Title: filename,
    Subject: 'Fleet Management Report',
    Author: author,
    Company: company,
    CreatedDate: new Date(),
  };

  // Add each sheet to the workbook
  sheets.forEach((sheet) => {
    const worksheet = createWorksheet(sheet);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });

  // Generate Excel file and trigger download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Create a worksheet from data
 */
function createWorksheet(sheet: ExcelSheet): XLSX.WorkSheet {
  const { data, headers, columnWidths } = sheet;

  // Create worksheet from data
  const worksheet = headers
    ? XLSX.utils.json_to_sheet(data, { header: headers })
    : XLSX.utils.json_to_sheet(data);

  // Set column widths if provided
  if (columnWidths) {
    worksheet['!cols'] = columnWidths.map((width) => ({ wch: width }));
  }

  return worksheet;
}

/**
 * Export pilots to Excel with multiple sheets
 */
export function exportPilotsToExcel(pilots: any[]): void {
  const sheets: ExcelSheet[] = [
    {
      name: 'Pilot Roster',
      data: pilots.map((pilot) => ({
        'Employee ID': pilot.employee_id,
        'Name': `${pilot.first_name} ${pilot.last_name}`,
        'Role': pilot.role,
        'Seniority': pilot.seniority_number,
        'Commencement': pilot.commencement_date ? format(new Date(pilot.commencement_date), 'yyyy-MM-dd') : '',
        'Age': pilot.age,
        'Years to Retirement': pilot.yearsToRetirement,
        'Status': pilot.status || 'Active',
      })),
      columnWidths: [12, 25, 15, 10, 15, 8, 18, 12],
    },
    {
      name: 'Captain Qualifications',
      data: pilots
        .filter((p) => p.role === 'Captain')
        .map((pilot) => ({
          'Employee ID': pilot.employee_id,
          'Name': `${pilot.first_name} ${pilot.last_name}`,
          'Line Captain': pilot.captain_qualifications?.line_captain ? 'Yes' : 'No',
          'Training Captain': pilot.captain_qualifications?.training_captain ? 'Yes' : 'No',
          'Examiner': pilot.captain_qualifications?.examiner ? 'Yes' : 'No',
        })),
      columnWidths: [12, 25, 15, 18, 12],
    },
  ];

  exportToExcel({
    filename: 'Pilot_Roster',
    sheets,
  });
}

/**
 * Export certifications to Excel
 */
export function exportCertificationsToExcel(certifications: any[]): void {
  const sheets: ExcelSheet[] = [
    {
      name: 'All Certifications',
      data: certifications.map((cert) => ({
        'Pilot': cert.pilot_name || cert.pilot,
        'Employee ID': cert.employee_id || cert.employeeId,
        'Check Type': cert.check_description || cert.checkType,
        'Category': cert.category,
        'Expiry Date': cert.expiry_date ? format(new Date(cert.expiry_date), 'yyyy-MM-dd') : '',
        'Days Until Expiry': cert.daysUntilExpiry,
        'Status': cert.status,
      })),
      columnWidths: [25, 12, 30, 15, 15, 18, 12],
    },
    {
      name: 'By Category',
      data: certifications.map((cert) => ({
        'Category': cert.category,
        'Check Type': cert.check_description || cert.checkType,
        'Pilot': cert.pilot_name || cert.pilot,
        'Expiry Date': cert.expiry_date ? format(new Date(cert.expiry_date), 'yyyy-MM-dd') : '',
        'Status': cert.status,
      })),
      columnWidths: [15, 30, 25, 15, 12],
    },
  ];

  exportToExcel({
    filename: 'Certifications',
    sheets,
  });
}

/**
 * Export leave requests to Excel
 */
export function exportLeaveRequestsToExcel(leaveRequests: any[]): void {
  const sheets: ExcelSheet[] = [
    {
      name: 'Leave Requests',
      data: leaveRequests.map((leave) => ({
        'Pilot': leave.pilot_name,
        'Employee ID': leave.employee_id,
        'Role': leave.role,
        'Roster Period': leave.roster_code,
        'Start Date': leave.start_date ? format(new Date(leave.start_date), 'yyyy-MM-dd') : '',
        'End Date': leave.end_date ? format(new Date(leave.end_date), 'yyyy-MM-dd') : '',
        'Days': leave.days_count,
        'Status': leave.status,
        'Reason': leave.reason || '',
      })),
      columnWidths: [25, 12, 12, 12, 15, 15, 8, 12, 30],
    },
  ];

  exportToExcel({
    filename: 'Leave_Requests',
    sheets,
  });
}

/**
 * Export compliance report to Excel with multiple analysis sheets
 */
export function exportComplianceToExcel(data: {
  summary: any;
  pilots: any[];
  expiredCerts: any[];
  expiringCerts: any[];
}): void {
  const sheets: ExcelSheet[] = [
    {
      name: 'Summary',
      data: [
        { 'Metric': 'Total Pilots', 'Value': data.summary.totalPilots },
        { 'Metric': 'Total Certifications', 'Value': data.summary.totalCertifications },
        { 'Metric': 'Current Certifications', 'Value': data.summary.currentCertifications },
        { 'Metric': 'Expiring Soon (30 days)', 'Value': data.summary.expiringCertifications },
        { 'Metric': 'Expired Certifications', 'Value': data.summary.expiredCertifications },
        { 'Metric': 'Compliance Rate', 'Value': `${data.summary.complianceRate}%` },
      ],
      columnWidths: [30, 20],
    },
    {
      name: 'Pilot Status',
      data: data.pilots.map((pilot) => ({
        'Employee ID': pilot.employee_id,
        'Name': `${pilot.first_name} ${pilot.last_name}`,
        'Role': pilot.role,
        'Total Checks': pilot.total_checks || 0,
        'Current': pilot.current_checks || 0,
        'Expiring': pilot.expiring_checks || 0,
        'Expired': pilot.expired_checks || 0,
        'Compliance': pilot.compliance_rate ? `${pilot.compliance_rate}%` : 'N/A',
      })),
      columnWidths: [12, 25, 15, 12, 10, 10, 10, 12],
    },
    {
      name: 'Expired Certifications',
      data: data.expiredCerts.map((cert) => ({
        'Pilot': cert.pilot_name,
        'Employee ID': cert.employee_id,
        'Check Type': cert.check_description,
        'Category': cert.category,
        'Expiry Date': cert.expiry_date ? format(new Date(cert.expiry_date), 'yyyy-MM-dd') : '',
        'Days Overdue': Math.abs(cert.daysUntilExpiry || 0),
      })),
      columnWidths: [25, 12, 30, 15, 15, 15],
    },
    {
      name: 'Expiring Soon',
      data: data.expiringCerts.map((cert) => ({
        'Pilot': cert.pilot_name,
        'Employee ID': cert.employee_id,
        'Check Type': cert.check_description,
        'Category': cert.category,
        'Expiry Date': cert.expiry_date ? format(new Date(cert.expiry_date), 'yyyy-MM-dd') : '',
        'Days Remaining': cert.daysUntilExpiry,
      })),
      columnWidths: [25, 12, 30, 15, 15, 15],
    },
  ];

  exportToExcel({
    filename: 'Compliance_Report',
    sheets,
  });
}
