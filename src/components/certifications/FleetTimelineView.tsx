'use client';

import { useState, useEffect } from 'react';
import { CertificationTimeline } from './CertificationTimeline';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Users, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';

interface PilotCertification {
  id: string;
  pilotId: string;
  pilotName: string;
  employeeId: string;
  checkCode: string;
  checkDescription: string;
  category: string;
  expiryDate: Date | string;
  status: {
    color: string;
    label: string;
    className: string;
  };
}

interface FleetSummary {
  totalPilots: number;
  totalCertifications: number;
  expiredCount: number;
  expiringSoonCount: number;
  currentCount: number;
  complianceRate: number;
}

/**
 * FleetTimelineView Component
 *
 * Displays a comprehensive timeline view for all pilots in the fleet
 * - Shows all certifications across all pilots
 * - Color-coded by status
 * - Filterable by category
 * - Click to view pilot details
 */
export function FleetTimelineView() {
  const router = useRouter();
  const [certifications, setCertifications] = useState<PilotCertification[]>([]);
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'pilot' | 'status'>('date');

  useEffect(() => {
    const fetchFleetData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all pilots
        const pilotsResponse = await fetch('/api/pilots');
        if (!pilotsResponse.ok) {
          throw new Error('Failed to fetch pilots');
        }
        const pilotsResult = await pilotsResponse.json();

        if (!pilotsResult.success || !pilotsResult.data) {
          throw new Error('Invalid pilots data');
        }

        const pilots = pilotsResult.data;

        // Fetch certifications for all pilots
        const certPromises = pilots.map((pilot: any) =>
          fetch(`/api/pilots/${pilot.id}/certifications`)
            .then((res) => res.json())
            .then((result) => ({
              pilotId: pilot.id,
              pilotName: `${pilot.first_name} ${pilot.last_name}`,
              employeeId: pilot.employee_id,
              certifications: result.success ? result.data : [],
            }))
        );

        const allPilotCerts = await Promise.all(certPromises);

        // Flatten and transform certifications
        const allCerts: PilotCertification[] = [];
        allPilotCerts.forEach((pilotData) => {
          pilotData.certifications
            .filter((cert: any) => cert.expiryDate) // Only include certs with expiry dates
            .forEach((cert: any) => {
              allCerts.push({
                id: `${pilotData.pilotId}-${cert.checkTypeId}`,
                pilotId: pilotData.pilotId,
                pilotName: pilotData.pilotName,
                employeeId: pilotData.employeeId,
                checkCode: cert.checkCode,
                checkDescription: cert.checkDescription,
                category: cert.category,
                expiryDate:
                  typeof cert.expiryDate === 'string' ? new Date(cert.expiryDate) : cert.expiryDate,
                status: cert.status,
              });
            });
        });

        setCertifications(allCerts);

        // Calculate summary statistics
        const expired = allCerts.filter((c) => c.status.color === 'red').length;
        const expiringSoon = allCerts.filter((c) => c.status.color === 'yellow').length;
        const current = allCerts.filter((c) => c.status.color === 'green').length;
        const complianceRate =
          allCerts.length > 0 ? Math.round((current / allCerts.length) * 100) : 0;

        setSummary({
          totalPilots: pilots.length,
          totalCertifications: allCerts.length,
          expiredCount: expired,
          expiringSoonCount: expiringSoon,
          currentCount: current,
          complianceRate,
        });
      } catch (err) {
        console.error('Error fetching fleet timeline data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load fleet timeline data');
      } finally {
        setLoading(false);
      }
    };

    fetchFleetData();
  }, []);

  const handleCertificationClick = (cert: any) => {
    // Navigate to pilot's certification page
    const pilotCert = certifications.find((c) => c.id === cert.id);
    if (pilotCert) {
      router.push(`/dashboard/pilots/${pilotCert.pilotId}/certifications`);
    }
  };

  // Sort certifications
  const sortedCertifications = [...certifications].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      case 'pilot':
        return a.pilotName.localeCompare(b.pilotName);
      case 'status':
        const statusOrder = { red: 0, yellow: 1, green: 2, gray: 3 };
        return (
          statusOrder[a.status.color as keyof typeof statusOrder] -
          statusOrder[b.status.color as keyof typeof statusOrder]
        );
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4002B] mx-auto" />
          <p className="text-gray-600 mt-2">Loading fleet timeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center py-12">
          <span className="text-6xl block mb-4">⚠️</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Fleet Timeline</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (certifications.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center py-12">
          <span className="text-6xl block mb-4">📊</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Fleet Data</h3>
          <p className="text-gray-600">No certifications found across the fleet.</p>
        </div>
      </div>
    );
  }

  // Transform certifications for timeline component
  const timelineEvents = sortedCertifications.map((cert) => ({
    id: cert.id,
    checkCode: cert.checkCode,
    checkDescription: cert.checkDescription,
    category: cert.category,
    expiryDate: cert.expiryDate instanceof Date ? cert.expiryDate : new Date(cert.expiryDate),
    pilotName: cert.pilotName,
    employeeId: cert.employeeId,
  }));

  return (
    <div className="space-y-6">
      {/* Fleet Header */}
      <div className="bg-gradient-to-r from-[#E4002B] to-red-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">Fleet Certification Timeline</h2>
              <p className="text-white/90 mt-1">Complete overview of all pilot certifications</p>
            </div>
          </div>
          {summary && (
            <div className="text-right">
              <p className="text-3xl font-bold">{summary.complianceRate}%</p>
              <p className="text-white/90 text-sm">Fleet Compliance</p>
            </div>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-white/80">Sort by:</span>
          <button
            onClick={() => setSortBy('date')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              sortBy === 'date'
                ? 'bg-white text-[#E4002B] font-medium'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            Expiry Date
          </button>
          <button
            onClick={() => setSortBy('pilot')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              sortBy === 'pilot'
                ? 'bg-white text-[#E4002B] font-medium'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            Pilot Name
          </button>
          <button
            onClick={() => setSortBy('status')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              sortBy === 'status'
                ? 'bg-white text-[#E4002B] font-medium'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            Status
          </button>
        </div>
      </div>

      {/* Fleet Statistics */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{summary.totalPilots}</span>
            </div>
            <p className="text-sm text-blue-600">Total Pilots</p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-5 h-5 text-gray-600" />
              <span className="text-2xl font-bold text-gray-600">
                {summary.totalCertifications}
              </span>
            </div>
            <p className="text-sm text-gray-600">Total Certifications</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{summary.expiredCount}</span>
            </div>
            <p className="text-sm text-red-600">Expired</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-600">
                {summary.expiringSoonCount}
              </span>
            </div>
            <p className="text-sm text-yellow-600">Expiring Soon</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{summary.currentCount}</span>
            </div>
            <p className="text-sm text-green-600">Current</p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <CertificationTimeline
        certifications={timelineEvents}
        onCertificationClick={handleCertificationClick}
        showPilotNames
      />

      {/* Critical Attention Section */}
      {summary && summary.expiredCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-red-600 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Critical Attention Required
              </h3>
              <p className="text-red-700 mb-4">
                {summary.expiredCount} certification{summary.expiredCount !== 1 ? 's' : ''} across
                the fleet {summary.expiredCount === 1 ? 'has' : 'have'} expired and require
                immediate renewal.
              </p>
              <button
                onClick={() => router.push('/dashboard/certifications/expiry-planning')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                View Expiry Planning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
