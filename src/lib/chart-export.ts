/**
 * @fileoverview Chart Export Utilities for Air Niugini B767 PMS
 * Comprehensive chart export functionality with multiple format support
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-27
 */

import type { ExportOptions } from '@/types/analytics';

/**
 * Export a chart as an image
 * @param chartRef - Reference to the Chart.js chart instance
 * @param options - Export configuration options
 */
export async function exportChart(chartRef: any, options: ExportOptions): Promise<void> {
  if (!chartRef?.current) {
    throw new Error('Chart reference is not available');
  }

  const chart = chartRef.current;
  const canvas = chart.canvas;

  try {
    // Create a new canvas for export with higher quality
    const exportCanvas = document.createElement('canvas');
    const context = exportCanvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    // Set dimensions based on resolution
    const scaleFactor = getScaleFactor(options.resolution);
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;

    exportCanvas.width = originalWidth * scaleFactor;
    exportCanvas.height = originalHeight * scaleFactor;

    // Scale context for high resolution
    context.scale(scaleFactor, scaleFactor);

    // Set background color
    if (options.backgroundColor && options.backgroundColor !== 'transparent') {
      context.fillStyle = options.backgroundColor;
      context.fillRect(0, 0, originalWidth, originalHeight);
    }

    // Draw the chart
    context.drawImage(canvas, 0, 0, originalWidth, originalHeight);

    // Add title and subtitle if requested
    if (options.includeTitle || options.includeSubtitle) {
      addTitleToCanvas(context, options, originalWidth);
    }

    // Convert to desired format and download
    const dataURL = exportCanvas.toDataURL(
      `image/${options.format}`,
      getQuality(options.resolution)
    );
    await downloadImage(dataURL, options);
  } catch (error) {
    console.error('Error exporting chart:', error);
    throw new Error('Failed to export chart');
  }
}

/**
 * Export multiple charts as a PDF report
 * @param chartRefs - Array of chart references
 * @param reportTitle - Title for the PDF report
 * @param options - Export configuration options
 */
export async function exportChartsAsPDF(
  chartRefs: any[],
  reportTitle: string,
  options: Partial<ExportOptions> = {}
): Promise<void> {
  // This would require a PDF library like jsPDF
  // For now, we'll implement a basic version that exports individual images
  console.log('PDF export functionality - would require jsPDF integration');

  // Export each chart individually as a fallback
  for (let i = 0; i < chartRefs.length; i++) {
    if (chartRefs[i]?.current) {
      const chartOptions: ExportOptions = {
        format: 'png',
        resolution: 'high',
        includeTitle: true,
        includeSubtitle: true,
        backgroundColor: '#ffffff',
        filename: `${reportTitle}-chart-${i + 1}.png`,
        ...options,
      };

      await exportChart(chartRefs[i], chartOptions);
    }
  }
}

/**
 * Export chart data as CSV
 * @param chartData - Chart.js data object
 * @param filename - Output filename
 */
export function exportChartDataAsCSV(chartData: any, filename: string): void {
  try {
    const csvContent = convertChartDataToCSV(chartData);
    downloadCSV(csvContent, filename);
  } catch (error) {
    console.error('Error exporting chart data as CSV:', error);
    throw new Error('Failed to export chart data');
  }
}

/**
 * Export chart data as JSON
 * @param chartData - Chart.js data object
 * @param filename - Output filename
 */
export function exportChartDataAsJSON(chartData: any, filename: string): void {
  try {
    const jsonContent = JSON.stringify(chartData, null, 2);
    downloadJSON(jsonContent, filename);
  } catch (error) {
    console.error('Error exporting chart data as JSON:', error);
    throw new Error('Failed to export chart data');
  }
}

/**
 * Bulk export multiple charts with different formats
 * @param charts - Array of chart configurations
 * @param baseFilename - Base filename for exports
 */
export async function bulkExportCharts(
  charts: Array<{
    ref: any;
    title: string;
    subtitle?: string;
  }>,
  baseFilename: string
): Promise<void> {
  const timestamp = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < charts.length; i++) {
    const chart = charts[i];

    if (!chart || !chart.ref?.current) continue;

    const options: ExportOptions = {
      format: 'png',
      resolution: 'high',
      includeTitle: true,
      includeSubtitle: !!chart.subtitle,
      backgroundColor: '#ffffff',
      filename: `${baseFilename}-${chart.title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.png`,
    };

    try {
      await exportChart(chart.ref, options);
      // Add small delay to prevent browser blocking
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to export chart: ${chart.title}`, error);
    }
  }
}

/**
 * Copy chart to clipboard as image
 * @param chartRef - Reference to the Chart.js chart instance
 */
export async function copyChartToClipboard(chartRef: any): Promise<void> {
  if (!chartRef?.current) {
    throw new Error('Chart reference is not available');
  }

  try {
    const canvas = chartRef.current.canvas;
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(resolve, 'image/png', 1.0);
    });

    if (!blob) {
      throw new Error('Failed to create image blob');
    }

    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);

    console.log('Chart copied to clipboard successfully');
  } catch (error) {
    console.error('Error copying chart to clipboard:', error);
    throw new Error('Failed to copy chart to clipboard');
  }
}

// Helper functions

function getScaleFactor(resolution: 'low' | 'medium' | 'high'): number {
  switch (resolution) {
    case 'low':
      return 1;
    case 'medium':
      return 2;
    case 'high':
      return 3;
    default:
      return 2;
  }
}

function getQuality(resolution: 'low' | 'medium' | 'high'): number {
  switch (resolution) {
    case 'low':
      return 0.6;
    case 'medium':
      return 0.8;
    case 'high':
      return 1.0;
    default:
      return 0.8;
  }
}

function addTitleToCanvas(
  context: CanvasRenderingContext2D,
  options: ExportOptions,
  canvasWidth: number
): void {
  const titleText = options.filename?.replace(/\.(png|jpg|jpeg|svg)$/i, '') || 'Chart Export';
  const padding = 20;
  let yPosition = padding;

  context.save();

  if (options.includeTitle) {
    context.font = 'bold 24px system-ui, -apple-system, sans-serif';
    context.fillStyle = '#1f2937';
    context.textAlign = 'center';
    context.fillText(titleText, canvasWidth / 2, yPosition + 24);
    yPosition += 40;
  }

  if (options.includeSubtitle) {
    const subtitle = `Generated on ${new Date().toLocaleDateString()}`;
    context.font = '16px system-ui, -apple-system, sans-serif';
    context.fillStyle = '#6b7280';
    context.textAlign = 'center';
    context.fillText(subtitle, canvasWidth / 2, yPosition + 16);
  }

  context.restore();
}

async function downloadImage(dataURL: string, options: ExportOptions): Promise<void> {
  const link = document.createElement('a');
  link.download = options.filename || `chart-${Date.now()}.${options.format}`;
  link.href = dataURL;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Small delay to ensure download starts
  await new Promise((resolve) => setTimeout(resolve, 100));
}

function convertChartDataToCSV(chartData: any): string {
  const lines: string[] = [];

  // Header row
  const headers = ['Label', ...chartData.datasets.map((dataset: any) => dataset.label)];
  lines.push(headers.join(','));

  // Data rows
  chartData.labels.forEach((label: string, index: number) => {
    const row = [
      `"${label}"`,
      ...chartData.datasets.map((dataset: any) => dataset.data[index] || 0),
    ];
    lines.push(row.join(','));
  });

  return lines.join('\n');
}

function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function downloadJSON(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.json') ? filename : `${filename}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Print chart with custom styling
 * @param chartRef - Reference to the Chart.js chart instance
 * @param title - Title for the printed chart
 */
export function printChart(chartRef: any, title: string): void {
  if (!chartRef?.current) {
    console.error('Chart reference is not available');
    return;
  }

  const canvas = chartRef.current.canvas;
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title} - Air Niugini B767 PMS</title>
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #E4002B;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #E4002B;
          margin: 0 0 10px 0;
        }
        .header p {
          color: #6b7280;
          margin: 0;
        }
        .chart-container {
          text-align: center;
          margin: 20px 0;
        }
        .chart-container img {
          max-width: 100%;
          height: auto;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
        }
        @media print {
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>Air Niugini B767 Pilot Management System</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
      <div class="chart-container">
        <img src="${canvas.toDataURL('image/png', 1.0)}" alt="${title}" />
      </div>
      <div class="footer">
        <p>Confidential - Air Niugini Internal Use Only</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();

  // Wait for image to load before printing
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 1000);
}

/**
 * Share chart via Web Share API (if supported)
 * @param chartRef - Reference to the Chart.js chart instance
 * @param title - Title for sharing
 */
export async function shareChart(chartRef: any, title: string): Promise<void> {
  if (!navigator.share) {
    throw new Error('Web Share API is not supported in this browser');
  }

  if (!chartRef?.current) {
    throw new Error('Chart reference is not available');
  }

  try {
    const canvas = chartRef.current.canvas;
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(resolve, 'image/png', 1.0);
    });

    if (!blob) {
      throw new Error('Failed to create image blob');
    }

    const file = new File([blob], `${title}.png`, { type: 'image/png' });

    await navigator.share({
      title: `${title} - Air Niugini B767 PMS`,
      text: 'Analytics chart from Air Niugini B767 Pilot Management System',
      files: [file],
    });

    console.log('Chart shared successfully');
  } catch (error) {
    console.error('Error sharing chart:', error);
    throw new Error('Failed to share chart');
  }
}
