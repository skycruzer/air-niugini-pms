'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CertificationCalendar } from '@/components/calendar/CertificationCalendar';
import { CertificationTimeline } from '@/components/certifications/CertificationTimeline';
import { CertificationCalendarSkeleton } from '@/components/certifications/CertificationCalendarSkeleton';
import { Calendar, ArrowLeft, LayoutList } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface ExpiringCert {
  pilotName: string;
  employeeId: string;
  checkCode: string;
  checkDescription: string;
  category: string;
  expiryDate: Date | string;
}

interface CertificationEvent {
  id: string;
  pilotName: string;
  employeeId: string;
  checkCode: string;
  checkDescription: string;
  expiryDate: Date;
  status: 'expired' | 'expiring_soon' | 'due_soon';
}

export default function CertificationCalendarPage() {
  const router = useRouter();
  const [certifications, setCertifications] = useState<CertificationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');

  useEffect(() => {
    const fetchCertifications = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/expiring-certifications?daysAhead=90');
        if (!response.ok) {
          throw new Error('Failed to fetch expiring certifications');
        }
        const result = await response.json();
        const expiringCerts = result.success ? result.data : [];

        const transformedCerts: CertificationEvent[] = expiringCerts.map(
          (cert: ExpiringCert, index: number) => {
            const expiryDate =
              cert.expiryDate instanceof Date ? cert.expiryDate : new Date(cert.expiryDate);
            const daysUntilExpiry = Math.ceil(
              (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            let status: 'expired' | 'expiring_soon' | 'due_soon' = 'due_soon';
            if (daysUntilExpiry <= 0) {
              status = 'expired';
            } else if (daysUntilExpiry <= 7) {
              status = 'expiring_soon';
            }

            return {
              id: `${cert.pilotName}-${cert.checkCode}-${index}`,
              pilotName: cert.pilotName,
              employeeId: cert.employeeId,
              checkCode: cert.checkCode,
              checkDescription: cert.checkDescription,
              expiryDate,
              status,
            };
          }
        );

        setCertifications(transformedCerts);
      } catch (error) {
        console.error('Error fetching certifications:', error);
        setError('Failed to load certifications');
      } finally {
        setLoading(false);
      }
    };

    fetchCertifications();
  }, []);

  const handleDateSelect = (date: Date, events: CertificationEvent[]) => {
    console.log('Selected date:', format(date, 'yyyy-MM-dd'), 'Events:', events);
  };

  const handleCertificationClick = (cert: any) => {
    // Find the pilot ID from the certification
    const fullCert = certifications.find((c) => c.id === cert.id);
    if (fullCert && fullCert.employeeId) {
      // Navigate to pilot detail (you may need to fetch pilot by employee ID)
      console.log('Clicked certification for employee:', fullCert.employeeId);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6">
            <CertificationCalendarSkeleton viewMode={viewMode} />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6">
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/certifications"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Certifications
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Calendar className="w-7 h-7 text-[#4F46E5] mr-3" />
                  Certification Calendar & Timeline
                </h1>
                <p className="text-gray-600 mt-1">
                  View certification expiry dates in calendar or timeline format
                </p>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-[#4F46E5] text-white'
                    : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-[#4F46E5] text-white'
                    : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <LayoutList className="w-4 h-4 mr-2" />
                Timeline
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">⚠️</div>
              <p className="text-xl font-bold text-red-600">
                {certifications.filter((c) => c.status === 'expired').length}
              </p>
              <p className="text-sm text-red-600">Expired</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">🚨</div>
              <p className="text-xl font-bold text-yellow-600">
                {certifications.filter((c) => c.status === 'expiring_soon').length}
              </p>
              <p className="text-sm text-yellow-600">Expiring Soon</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">⏰</div>
              <p className="text-xl font-bold text-orange-600">
                {certifications.filter((c) => c.status === 'due_soon').length}
              </p>
              <p className="text-sm text-orange-600">Due Soon</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">📋</div>
              <p className="text-xl font-bold text-blue-600">{certifications.length}</p>
              <p className="text-sm text-blue-600">Total</p>
            </div>
          </div>

          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <CertificationCalendar
              certifications={certifications}
              onDateSelect={handleDateSelect}
            />
          )}

          {/* Timeline View */}
          {viewMode === 'timeline' && (
            <CertificationTimeline
              certifications={certifications.map((cert) => ({
                id: cert.id,
                checkCode: cert.checkCode,
                checkDescription: cert.checkDescription,
                category: 'All Categories', // You may want to add category to CertificationEvent
                expiryDate: cert.expiryDate,
                pilotName: cert.pilotName,
                employeeId: cert.employeeId,
              }))}
              onCertificationClick={handleCertificationClick}
              showPilotNames
            />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
