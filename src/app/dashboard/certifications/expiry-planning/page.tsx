'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { permissions } from '@/lib/auth-utils';
import { format } from 'date-fns';
import { getRosterPeriodFromDate } from '@/lib/roster-utils';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface ExpiringCertification {
  id: string;
  pilotName: string;
  employeeId: string;
  checkCode: string;
  checkDescription: string;
  category: string;
  expiryDate: Date;
  status: {
    color: string;
    label: string;
    className: string;
    daysUntilExpiry: number;
  };
  expiry_roster_period: string;
  expiry_roster_display: string;
}

interface ExpiryStats {
  totalExpiring: number;
  byTimeframe: Record<string, number>;
  byCategory: Record<string, number>;
  byStatus: {
    expired: number;
    expiring_soon: number;
    upcoming: number;
  };
  byRosterPeriod: Record<string, number>;
}

interface ExpiryPlanningPageState {
  selectedTimeframe: number;
  expiringCertifications: ExpiringCertification[];
  stats: ExpiryStats | null;
  isLoading: boolean;
  error: string | null;
}

const timeframeOptions = [
  { value: 30, label: 'Next 30 Days', description: 'Immediate attention required' },
  { value: 60, label: 'Next 60 Days', description: 'Training planning window' },
  { value: 90, label: 'Next 90 Days', description: 'Strategic planning window' },
  { value: 120, label: 'Next 120 Days', description: 'Long-term planning' },
  { value: 180, label: 'Next 6 Months', description: 'Annual planning view' },
];

export default function CertificationExpiryPlanningPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<ExpiryPlanningPageState>({
    selectedTimeframe: 60, // Default to 60 days
    expiringCertifications: [],
    stats: null,
    isLoading: false,
    error: null,
  });

  const loadExpiringCertifications = async (timeframeDays: number) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/expiring-certifications?daysAhead=${timeframeDays}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch expiring certifications');
      }

      const certifications = (result.data || []).map((cert: any) => {
        // API already provides correct roster period calculations, so we just use the data directly
        return {
          ...cert,
          expiryDate: new Date(cert.expiryDate),
        };
      });

      // Calculate statistics
      const stats: ExpiryStats = {
        totalExpiring: certifications.length,
        byTimeframe: {},
        byCategory: {},
        byStatus: { expired: 0, expiring_soon: 0, upcoming: 0 },
        byRosterPeriod: {},
      };

      certifications.forEach((cert: ExpiringCertification) => {
        // Count by timeframe
        if (cert.status.daysUntilExpiry < 0) {
          stats.byTimeframe['expired'] = (stats.byTimeframe['expired'] || 0) + 1;
          stats.byStatus.expired++;
        } else if (cert.status.daysUntilExpiry <= 30) {
          stats.byTimeframe['0-30 days'] = (stats.byTimeframe['0-30 days'] || 0) + 1;
          stats.byStatus.expiring_soon++;
        } else if (cert.status.daysUntilExpiry <= 60) {
          stats.byTimeframe['31-60 days'] = (stats.byTimeframe['31-60 days'] || 0) + 1;
          stats.byStatus.upcoming++;
        } else {
          stats.byTimeframe['61+ days'] = (stats.byTimeframe['61+ days'] || 0) + 1;
          stats.byStatus.upcoming++;
        }

        // Count by category
        stats.byCategory[cert.category] = (stats.byCategory[cert.category] || 0) + 1;

        // Count by roster period
        stats.byRosterPeriod[cert.expiry_roster_period] =
          (stats.byRosterPeriod[cert.expiry_roster_period] || 0) + 1;
      });

      setState((prev) => ({
        ...prev,
        expiringCertifications: certifications,
        stats,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error loading expiring certifications:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to load expiring certifications for the selected timeframe',
        isLoading: false,
      }));
    }
  };

  const handleTimeframeChange = (timeframeDays: number) => {
    setState((prev) => ({ ...prev, selectedTimeframe: timeframeDays }));
    loadExpiringCertifications(timeframeDays);
  };

  const handleGeneratePDF = async () => {
    if (!state.selectedTimeframe || !user?.name) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      console.log('🎯 Starting certification expiry PDF generation...');

      const response = await fetch('/api/reports/certification-expiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeframeDays: state.selectedTimeframe,
          generatedBy: user.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF report');
      }

      // Get the PDF blob and ensure it's treated as PDF
      const pdfBlob = await response.blob();

      // Verify we got a PDF blob
      if (pdfBlob.type !== 'application/pdf') {
        console.warn('⚠️ Response is not a PDF:', pdfBlob.type);
      }

      // Extract filename from response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = contentDisposition
        ? (contentDisposition.split('filename=')[1]?.replace(/"/g, '') ??
          `Air_Niugini_Certification_Expiry_${state.selectedTimeframe}days_${new Date().toISOString().slice(0, 10)}.pdf`)
        : `Air_Niugini_Certification_Expiry_${state.selectedTimeframe}days_${new Date().toISOString().slice(0, 10)}.pdf`;

      // Ensure .pdf extension
      if (!filename.toLowerCase().endsWith('.pdf')) {
        filename = `${filename  }.pdf`;
      }

      console.log('📋 PDF Details:', {
        size: pdfBlob.size,
        type: pdfBlob.type,
        filename,
      });

      // Create a properly typed PDF blob to ensure browser recognition
      const typedPdfBlob = new Blob([pdfBlob], { type: 'application/pdf' });

      // Create download link with enhanced attributes
      const url = window.URL.createObjectURL(typedPdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.type = 'application/pdf';
      link.style.display = 'none';

      document.body.appendChild(link);

      // Add a small delay to ensure the link is ready
      setTimeout(() => {
        link.click();

        // Cleanup after a delay
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 1000);
      }, 100);

      console.log('✅ Certification expiry PDF generated and downloaded successfully');
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate PDF report',
      }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleEmailToTraining = async () => {
    if (!state.selectedTimeframe || !user?.name) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      console.log('📧 Preparing email for certification expiry planning...');

      // Generate the PDF first
      const response = await fetch('/api/reports/certification-expiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeframeDays: state.selectedTimeframe,
          generatedBy: user.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF report');
      }

      const pdfBlob = await response.blob();

      // Create a properly typed PDF blob to ensure browser recognition
      const typedPdfBlob = new Blob([pdfBlob], { type: 'application/pdf' });
      const pdfUrl = window.URL.createObjectURL(typedPdfBlob);

      // Prepare email content
      const timeframeLabel =
        timeframeOptions.find((t) => t.value === state.selectedTimeframe)?.label ||
        `${state.selectedTimeframe} days`;
      const subject = encodeURIComponent(
        `Air Niugini B767 Certification Expiry Planning - ${timeframeLabel}`
      );
      const body = encodeURIComponent(`Dear Training Department,

Please find attached the certification expiry planning report for the ${timeframeLabel.toLowerCase()}.

SUMMARY:
- Total certifications expiring: ${state.stats?.totalExpiring || 0}
- Already expired: ${state.stats?.byStatus.expired || 0}
- Expiring soon (≤30 days): ${state.stats?.byStatus.expiring_soon || 0}
- Upcoming (31+ days): ${state.stats?.byStatus.upcoming || 0}

BREAKDOWN BY CATEGORY:
${Object.entries(state.stats?.byCategory || {})
  .map(([category, count]) => `- ${category}: ${count} certifications`)
  .join('\n')}

The detailed report includes:
✈️ Complete certification listings by type and expiry date
✈️ Roster period assignments for training scheduling
✈️ Pilot information and contact details
✈️ Priority scheduling recommendations based on roster periods
✈️ Training department coordination notes
✈️ Statistical breakdown for resource planning

This report was generated automatically by the Air Niugini Pilot Management System.

Generated by: ${user.name}
Generated on: ${new Date().toLocaleString()}

Best regards,
Air Niugini B767 Fleet Operations`);

      // Recipients - you can customize these email addresses
      const recipients = [
        'training.department@airniugini.com.pg',
        'pilot.training@airniugini.com.pg',
        'fleet.operations@airniugini.com.pg',
        'check.airman@airniugini.com.pg',
      ].join(',');

      // Create mailto link
      const mailtoLink = `mailto:${recipients}?subject=${subject}&body=${body}`;

      // Open email client - use window.location.href for better compatibility
      window.location.href = mailtoLink;

      // Note: The PDF can't be automatically attached via mailto
      // Instead, we'll also trigger a download so they can manually attach it
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `Air_Niugini_Certification_Expiry_${state.selectedTimeframe}days_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show user instruction
      alert(`Email template opened in your default email client.

The PDF report has also been downloaded to your computer.
Please manually attach the downloaded PDF file to your email before sending.

Recipients: ${recipients.split(',').join(', ')}`);

      window.URL.revokeObjectURL(pdfUrl);

      console.log('✅ Email prepared and PDF downloaded for manual attachment');
    } catch (error) {
      console.error('❌ Error preparing email:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to prepare email',
      }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const getStatusBadgeClass = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) {
      return 'bg-red-100 text-red-800'; // Expired
    } else if (daysUntilExpiry <= 30) {
      return 'bg-yellow-100 text-yellow-800'; // Expiring soon
    } else {
      return 'bg-blue-100 text-blue-800'; // Upcoming
    }
  };

  const getStatusLabel = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) {
      return 'EXPIRED';
    } else if (daysUntilExpiry <= 30) {
      return 'EXPIRING SOON';
    } else {
      return 'UPCOMING';
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Recurrent':
        return 'bg-purple-100 text-purple-800';
      case 'Line':
        return 'bg-green-100 text-green-800';
      case 'Simulator':
        return 'bg-blue-100 text-blue-800';
      case 'Medical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadExpiringCertifications(state.selectedTimeframe);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Group certifications by category
  const groupedCertifications = state.expiringCertifications.reduce(
    (groups, cert) => {
      const category = cert.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(cert);
      return groups;
    },
    {} as Record<string, ExpiringCertification[]>
  );

  // Show loading while authentication is initializing
  if (authLoading) {
    return (
      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#4F46E5]" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Loading...</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Checking authentication and permissions...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check permissions after authentication is complete
  if (!user || !permissions.canViewReports(user)) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>You don&apos;t have permission to access certification expiry planning features.</p>
                {user && (
                  <p className="mt-1">Current role: {user.role}. Required: admin or manager.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div key="certification-expiry-planning" className="p-6 space-y-6">
          {/* Page Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#4F46E5] rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">📜</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Certification Expiry Planning
                  </h1>
                  <p className="text-gray-600">
                    Monitor and plan for upcoming certification expirations
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleEmailToTraining}
                  disabled={!state.selectedTimeframe || state.expiringCertifications.length === 0}
                  className="px-4 py-2 bg-[#06B6D4] text-gray-900 rounded-lg hover:bg-[#FFB800] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <span>📧</span>
                  <span>Email to Training</span>
                </button>

                <button
                  onClick={handleGeneratePDF}
                  disabled={!state.selectedTimeframe || state.expiringCertifications.length === 0}
                  className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <span>📄</span>
                  <span>Generate PDF Report</span>
                </button>
              </div>
            </div>
          </div>

          {/* Timeframe Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Planning Timeframe</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {timeframeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleTimeframeChange(option.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    state.selectedTimeframe === option.value
                      ? 'border-[#4F46E5] bg-[#4F46E5]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Statistics Overview */}
          {state.stats && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Certification Expiry Overview
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-[#4F46E5]">
                    {state.stats.totalExpiring}
                  </div>
                  <div className="text-sm text-gray-600">Total Expiring</div>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {state.stats.byStatus.expired || 0}
                  </div>
                  <div className="text-sm text-gray-600">Already Expired</div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-600">
                    {state.stats.byStatus.expiring_soon || 0}
                  </div>
                  <div className="text-sm text-gray-600">Expiring Soon (≤30 days)</div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {state.stats.byStatus.upcoming || 0}
                  </div>
                  <div className="text-sm text-gray-600">Upcoming (31+ days)</div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Expiring by Category</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                  {Object.entries(state.stats.byCategory).map(([category, count]) => (
                    <div key={category} className="bg-gray-50 rounded p-2 text-center">
                      <div className="text-lg font-bold text-gray-900">{count}</div>
                      <div className="text-xs text-gray-600">{category}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roster Period Breakdown */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">
                  Expiring by Roster Period
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {Object.entries(state.stats.byRosterPeriod)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([rosterPeriod, count]) => (
                      <div
                        key={rosterPeriod}
                        className="bg-[#4F46E5]/5 border border-[#4F46E5]/20 rounded p-2 text-center"
                      >
                        <div className="text-lg font-bold text-[#4F46E5]">{count}</div>
                        <div className="text-xs text-gray-700 font-medium">{rosterPeriod}</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {state.isLoading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4F46E5]" />
                <span className="ml-3 text-gray-600">Loading certification data...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400 text-xl">❌</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{state.error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Certifications Display */}
          {state.selectedTimeframe && !state.isLoading && !state.error && (
            <>
              {state.expiringCertifications.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                  <div className="text-center">
                    <span className="text-6xl text-gray-300">📜</span>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      No Expiring Certifications
                    </h3>
                    <p className="mt-2 text-gray-600">
                      No certifications are expiring in the selected timeframe
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedCertifications).map(([category, certifications]) => (
                    <div
                      key={category}
                      className="bg-white rounded-lg shadow-sm border border-gray-200"
                    >
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-3 ${getCategoryBadgeClass(category)}`}
                            >
                              {category}
                            </span>
                            {certifications.length} Certification
                            {certifications.length !== 1 ? 's' : ''}
                          </h3>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Pilot
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Check Type
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Expiry Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Roster Period
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Days Until Expiry
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {certifications
                              .sort((a, b) => a.status.daysUntilExpiry - b.status.daysUntilExpiry)
                              .map((cert) => (
                                <tr key={cert.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {cert.pilotName}
                                      </div>
                                      <div className="text-sm text-gray-500">{cert.employeeId}</div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {cert.checkDescription}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {(() => {
                                      try {
                                        const date = new Date(cert.expiryDate);
                                        if (isNaN(date.getTime())) {
                                          return 'Invalid Date';
                                        }
                                        return format(date, 'dd MMM yyyy');
                                      } catch (error) {
                                        return 'Invalid Date';
                                      }
                                    })()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                      <div className="text-sm font-medium text-[#4F46E5]">
                                        {cert.expiry_roster_period}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {cert.expiry_roster_display.split('(')[1]?.replace(')', '')}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {cert.status.daysUntilExpiry < 0
                                      ? `${Math.abs(cert.status.daysUntilExpiry)} days overdue`
                                      : `${cert.status.daysUntilExpiry} days`}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cert.status.className}`}
                                    >
                                      {cert.status.label}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Air Niugini Footer */}
          <div className="text-center text-sm text-gray-500 mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2">
              <span>✈️</span>
              <span>Air Niugini B767 Pilot Management System</span>
              <span>•</span>
              <span>Certification Expiry Planning Module</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
