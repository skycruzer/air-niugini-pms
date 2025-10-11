'use client';

import { useState, useEffect } from 'react';
import { X, Download, FileText, Eye, BarChart3, Table } from 'lucide-react';
import { format } from 'date-fns';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: string;
  reportTitle: string;
  reportData: any;
  onDownloadPDF: () => void;
  onDownloadCSV?: () => void;
  onDownloadExcel?: () => void;
}

export function ReportPreviewModal({
  isOpen,
  onClose,
  reportType,
  reportTitle,
  reportData,
  onDownloadPDF,
  onDownloadCSV,
  onDownloadExcel,
}: ReportPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'data'>('preview');
  const [estimatedPages, setEstimatedPages] = useState(1);
  const [estimatedSize, setEstimatedSize] = useState('0 KB');

  useEffect(() => {
    if (reportData) {
      // Estimate pages based on data volume
      const dataSize = JSON.stringify(reportData).length;
      const pages = Math.ceil(dataSize / 5000); // Rough estimate: 5KB per page
      const sizeKB = Math.ceil(dataSize / 1024);

      setEstimatedPages(pages);
      setEstimatedSize(sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`);
    }
  }, [reportData]);

  if (!isOpen) return null;

  const renderPreview = () => {
    if (!reportData) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>No preview available</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Report Header Preview */}
        <div className="bg-gradient-to-br from-sky-600 to-sky-800 text-white p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-2">{reportTitle}</h2>
          <p className="text-sky-100 text-sm">
            Generated on {format(new Date(), 'MMMM dd, yyyy')} at {format(new Date(), 'HH:mm')}
          </p>
          <p className="text-sky-100 text-sm">
            Fleet Office Management System
          </p>
        </div>

        {/* Summary Statistics Preview */}
        {reportData.summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(reportData.summary).map(([key, value]) => (
              <div key={key} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 mb-1 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {typeof value === 'number' && key.includes('Rate')
                    ? `${value}%`
                    : value?.toString() || '0'}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Data Tables Preview (First 5 rows) */}
        {reportData.pilots && reportData.pilots.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Pilot Data Preview</h3>
              <p className="text-xs text-gray-600">
                Showing {Math.min(5, reportData.pilots.length)} of {reportData.pilots.length} records
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(reportData.pilots[0]).slice(0, 5).map((key) => (
                      <th
                        key={key}
                        className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                      >
                        {key.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.pilots.slice(0, 5).map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      {Object.values(row).slice(0, 5).map((value: any, i: number) => (
                        <td key={i} className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                          {value?.toString() || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Certifications Preview */}
        {reportData.expiringCertifications && reportData.expiringCertifications.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Expiring Certifications Preview</h3>
              <p className="text-xs text-gray-600">
                Showing {Math.min(5, reportData.expiringCertifications.length)} of {reportData.expiringCertifications.length} records
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Pilot</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Check Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Expiry Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.expiringCertifications.slice(0, 5).map((cert: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">{cert.pilot || cert.pilot_name}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{cert.checkType || cert.check_description}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {cert.expiry_date ? format(new Date(cert.expiry_date), 'MMM dd, yyyy') : '-'}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          cert.status === 'Expired' ? 'bg-red-100 text-red-800' :
                          cert.status === 'Expiring Soon' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {cert.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Full Data Preview (JSON) */}
        {activeTab === 'data' && (
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto max-h-96">
            <pre>{JSON.stringify(reportData, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Report Preview</h2>
              <p className="text-sm text-gray-600">{reportTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close preview"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Visual Preview
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'data'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Raw Data
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderPreview()}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              <p>Estimated PDF: <span className="font-semibold text-gray-900">{estimatedPages} page(s)</span></p>
              <p>Estimated Size: <span className="font-semibold text-gray-900">{estimatedSize}</span></p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onDownloadPDF}
              className="flex-1 bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Download PDF
            </button>

            {onDownloadExcel && (
              <button
                onClick={onDownloadExcel}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Table className="w-5 h-5" />
                Download Excel
              </button>
            )}

            {onDownloadCSV && (
              <button
                onClick={onDownloadCSV}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-5 h-5" />
                Download CSV
              </button>
            )}

            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
