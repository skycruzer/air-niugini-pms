/**
 * Advanced Export Functionality
 *
 * Features:
 * - Export to Excel with formatting
 * - Export to PDF with charts
 * - Export to CSV with custom columns
 * - Export to JSON for integrations
 * - Bulk export multiple reports
 */

export interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv' | 'json';
  filename?: string;
  includeCharts?: boolean;
  includeMetadata?: boolean;
  dateFormat?: string;
}

export interface ExportData {
  headers: string[];
  rows: any[][];
  metadata?: Record<string, any>;
  charts?: any[];
}

/**
 * Export data to Excel format
 */
export async function exportToExcel(data: ExportData, options: ExportOptions): Promise<Blob> {
  const { filename = 'report', includeCharts = false, includeMetadata = true } = options;

  // In production, use a library like exceljs or xlsx
  // For now, create a simple CSV that Excel can open
  let csvContent = '';

  // Add metadata if included
  if (includeMetadata && data.metadata) {
    csvContent += 'Report Metadata\n';
    Object.entries(data.metadata).forEach(([key, value]) => {
      csvContent += `${key},${value}\n`;
    });
    csvContent += '\n';
  }

  // Add headers
  csvContent += `${data.headers.join(',')  }\n`;

  // Add rows
  data.rows.forEach((row) => {
    csvContent +=
      `${row
        .map((cell) => {
          // Escape cells containing commas or quotes
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(',')  }\n`;
  });

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Export data to CSV format
 */
export async function exportToCSV(data: ExportData, options: ExportOptions): Promise<Blob> {
  const { filename = 'report' } = options;

  let csvContent = '';

  // Add headers
  csvContent += `${data.headers.join(',')  }\n`;

  // Add rows
  data.rows.forEach((row) => {
    csvContent +=
      `${row
        .map((cell) => {
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(',')  }\n`;
  });

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Export data to JSON format
 */
export async function exportToJSON(data: ExportData, options: ExportOptions): Promise<Blob> {
  const { includeMetadata = true } = options;

  // Convert rows to objects using headers
  const jsonData = data.rows.map((row) => {
    const obj: Record<string, any> = {};
    data.headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });

  const output = {
    ...(includeMetadata && data.metadata ? { metadata: data.metadata } : {}),
    data: jsonData,
  };

  return new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
}

/**
 * Export data to PDF format
 */
export async function exportToPDF(data: ExportData, options: ExportOptions): Promise<Blob> {
  // This would use a PDF library like jsPDF or pdfmake in production
  // For now, return a simple text representation
  const pdfContent = `
Air Niugini B767 Pilot Management System
Generated Report

${
  data.metadata
    ? Object.entries(data.metadata)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')
    : ''
}

${data.headers.join(' | ')}
${'-'.repeat(data.headers.join(' | ').length)}
${data.rows.map((row) => row.join(' | ')).join('\n')}
  `.trim();

  return new Blob([pdfContent], { type: 'text/plain' });
}

/**
 * Main export function
 */
export async function exportReport(data: ExportData, options: ExportOptions): Promise<void> {
  let blob: Blob;

  switch (options.format) {
    case 'excel':
      blob = await exportToExcel(data, options);
      break;
    case 'csv':
      blob = await exportToCSV(data, options);
      break;
    case 'json':
      blob = await exportToJSON(data, options);
      break;
    case 'pdf':
      blob = await exportToPDF(data, options);
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }

  // Download the file
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${options.filename || 'report'}.${options.format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Bulk export multiple reports
 */
export async function bulkExport(
  reports: Array<{ data: ExportData; options: ExportOptions }>
): Promise<void> {
  for (const report of reports) {
    await exportReport(report.data, report.options);
    // Add a small delay between downloads
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

/**
 * Format data for export
 */
export function formatExportData(
  rows: any[],
  fields: Array<{ key: string; label: string }>,
  metadata?: Record<string, any>
): ExportData {
  const headers = fields.map((f) => f.label);
  const exportRows = rows.map((row) =>
    fields.map((field) => {
      const value = row[field.key];
      // Format dates, numbers, etc.
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      return value ?? '';
    })
  );

  return {
    headers,
    rows: exportRows,
    metadata,
  };
}
