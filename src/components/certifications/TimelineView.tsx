'use client';

import { useState, useEffect } from 'react';
import { CertificationTimeline } from './CertificationTimeline';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface Certification {
  id: string;
  checkTypeId: string;
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

interface Pilot {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  employee_id: string;
}

interface TimelineViewProps {
  pilotId: string;
}

/**
 * TimelineView Component
 *
 * Displays a timeline view for a single pilot's certifications
 * - Shows all certifications on a horizontal timeline
 * - Allows filtering by category
 * - Click on certification to edit
 */
export function TimelineView({ pilotId }: TimelineViewProps) {
  const router = useRouter();
  const [pilot, setPilot] = useState<Pilot | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch pilot details
        const pilotResponse = await fetch(`/api/pilots/${pilotId}`);
        if (!pilotResponse.ok) {
          throw new Error('Failed to fetch pilot details');
        }
        const pilotResult = await pilotResponse.json();

        // Fetch pilot certifications
        const certsResponse = await fetch(`/api/pilots/${pilotId}/certifications`);
        if (!certsResponse.ok) {
          throw new Error('Failed to fetch certifications');
        }
        const certsResult = await certsResponse.json();

        if (pilotResult.success && pilotResult.data) {
          setPilot(pilotResult.data);
        }

        if (certsResult.success && certsResult.data) {
          // Filter only certifications with expiry dates
          const activeCerts = certsResult.data
            .filter((cert: Certification) => cert.expiryDate)
            .map((cert: Certification) => ({
              ...cert,
              expiryDate:
                typeof cert.expiryDate === 'string' ? new Date(cert.expiryDate) : cert.expiryDate,
            }));
          setCertifications(activeCerts);
        }
      } catch (err) {
        console.error('Error fetching timeline data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load timeline data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pilotId]);

  const handleCertificationClick = (cert: any) => {
    // Navigate to edit certifications page
    router.push(`/dashboard/pilots/${pilotId}/certifications`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4F46E5] mx-auto" />
          <p className="text-gray-600 mt-2">Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center py-12">
          <span className="text-6xl block mb-4">⚠️</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Timeline</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (certifications.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center py-12">
          <span className="text-6xl block mb-4">📅</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Certifications</h3>
          <p className="text-gray-600 mb-4">
            This pilot doesn&apos;t have any certifications with expiry dates yet.
          </p>
          <button
            onClick={() => router.push(`/dashboard/pilots/${pilotId}/certifications`)}
            className="inline-flex items-center px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Add Certifications
          </button>
        </div>
      </div>
    );
  }

  // Transform certifications for timeline component
  const timelineEvents = certifications.map((cert) => ({
    id: cert.id,
    checkCode: cert.checkCode,
    checkDescription: cert.checkDescription,
    category: cert.category,
    expiryDate: cert.expiryDate instanceof Date ? cert.expiryDate : new Date(cert.expiryDate),
  }));

  return (
    <div className="space-y-6">
      {/* Pilot Header */}
      {pilot && (
        <div className="bg-gradient-to-r from-[#4F46E5] to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {pilot.first_name} {pilot.middle_name && `${pilot.middle_name} `}
                {pilot.last_name}
              </h2>
              <p className="text-white/90">
                Employee ID: {pilot.employee_id} • {certifications.length} Active Certification
                {certifications.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => router.push(`/dashboard/pilots/${pilotId}/certifications`)}
              className="px-4 py-2 bg-white text-[#4F46E5] rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Edit Certifications
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <CertificationTimeline
        certifications={timelineEvents}
        onCertificationClick={handleCertificationClick}
        showPilotNames={false}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl mb-1">⚠️</div>
          <p className="text-xl font-bold text-red-600">
            {certifications.filter((c) => c.status.color === 'red').length}
          </p>
          <p className="text-sm text-red-600">Expired</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl mb-1">⏰</div>
          <p className="text-xl font-bold text-yellow-600">
            {certifications.filter((c) => c.status.color === 'yellow').length}
          </p>
          <p className="text-sm text-yellow-600">Expiring Soon</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl mb-1">✅</div>
          <p className="text-xl font-bold text-green-600">
            {certifications.filter((c) => c.status.color === 'green').length}
          </p>
          <p className="text-sm text-green-600">Current</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl mb-1">📊</div>
          <p className="text-xl font-bold text-blue-600">
            {Math.round(
              (certifications.filter((c) => c.status.color === 'green').length /
                certifications.length) *
                100
            )}
            %
          </p>
          <p className="text-sm text-blue-600">Compliance</p>
        </div>
      </div>
    </div>
  );
}
