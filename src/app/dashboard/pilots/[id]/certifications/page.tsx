'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { permissions } from '@/lib/auth-utils';
import {
  getPilotById,
  getPilotCertificationsWithAllTypes,
  updatePilotCertifications,
} from '@/lib/pilot-service-client';
import { format } from 'date-fns';
import { getCategoryIcon } from '@/lib/certification-utils';

interface CertificationData {
  checkTypeId: string;
  checkCode: string;
  checkDescription: string;
  category: string;
  expiryDate: string | null;
  status: {
    color: string;
    label: string;
    className: string;
  };
  hasData: boolean;
}

interface FormData {
  [checkTypeId: string]: string; // date string or empty
}

interface FormErrors {
  [key: string]: string;
}

function CertificationRow({
  cert,
  value,
  onChange,
  error,
}: {
  cert: CertificationData;
  value: string;
  onChange: (checkTypeId: string, value: string) => void;
  error?: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-4 border-b border-gray-100 last:border-b-0">
      {/* Check Code */}
      <div className="md:col-span-2">
        <span className="font-semibold text-[#E4002B]">{cert.checkCode}</span>
      </div>

      {/* Description */}
      <div className="md:col-span-4">
        <p className="text-sm text-gray-900">{cert.checkDescription}</p>
        <p className="text-xs text-gray-500">{cert.category}</p>
      </div>

      {/* Current Status */}
      <div className="md:col-span-2">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cert.status.className}`}
        >
          {cert.status.color === 'red' && <span className="mr-1">⚠️</span>}
          {cert.status.color === 'yellow' && <span className="mr-1">⏰</span>}
          {cert.status.color === 'green' && <span className="mr-1">✅</span>}
          {cert.status.color === 'gray' && <span className="mr-1">➖</span>}
          {cert.status.label}
        </span>
        {cert.expiryDate && (
          <p className="text-xs text-gray-500 mt-1">
            {format(new Date(cert.expiryDate), 'dd MMM yyyy')}
          </p>
        )}
      </div>

      {/* New Expiry Date Input */}
      <div className="md:col-span-3">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(cert.checkTypeId, e.target.value)}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B] ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>

      {/* Clear Button */}
      <div className="md:col-span-1">
        {value && (
          <button
            type="button"
            onClick={() => onChange(cert.checkTypeId, '')}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Clear date"
          >
            ❌
          </button>
        )}
      </div>
    </div>
  );
}

export default function PilotCertificationsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [pilot, setPilot] = useState<any>(null);
  const [certifications, setCertifications] = useState<CertificationData[]>([]);
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const pilotId = params.id as string;

  useEffect(() => {
    console.log('🔍 Certification Page: Effect starting...', {
      pilotId,
      user: !!user,
      authLoading,
      canEdit: user ? permissions.canEdit(user) : 'checking...',
    });

    // Wait for auth to finish loading
    if (authLoading) {
      console.log('🔍 Certification Page: Auth still loading, waiting...');
      return;
    }

    if (!permissions.canEdit(user)) {
      console.log('🚨 Certification Page: User does not have edit permissions, redirecting...', {
        user,
      });
      router.push('/dashboard/pilots');
      return;
    }

    const fetchData = async () => {
      try {
        console.log('🔍 Certification Page: Starting data fetch...');
        setLoading(true);

        const [pilotData, certData] = await Promise.all([
          getPilotById(pilotId),
          getPilotCertificationsWithAllTypes(pilotId),
        ]);

        console.log('🔍 Certification Page: Data received:', {
          pilotData: !!pilotData,
          pilotName: pilotData ? `${pilotData.first_name} ${pilotData.last_name}` : 'null',
          certDataLength: certData?.length || 0,
        });

        if (!pilotData) {
          console.log('🚨 Certification Page: No pilot data received, redirecting...');
          router.push('/dashboard/pilots');
          return;
        }

        setPilot(pilotData);
        setCertifications(certData);

        // Initialize form data with existing expiry dates
        console.log('🔍 Certification Page: Initializing form data...');
        const initialFormData: FormData = {};
        certData.forEach((cert: CertificationData) => {
          try {
            initialFormData[cert.checkTypeId] = cert.expiryDate
              ? format(new Date(cert.expiryDate), 'yyyy-MM-dd')
              : '';
          } catch (dateError) {
            console.error(
              '🚨 Certification Page: Date format error for cert:',
              cert.checkCode,
              dateError
            );
            initialFormData[cert.checkTypeId] = '';
          }
        });
        setFormData(initialFormData);
        console.log(
          '🔍 Certification Page: Form data initialized with',
          Object.keys(initialFormData).length,
          'fields'
        );
      } catch (error) {
        console.error('🚨 Certification Page: Error fetching data:', error);
        router.push('/dashboard/pilots');
      } finally {
        console.log('🔍 Certification Page: Setting loading to false');
        setLoading(false);
      }
    };

    fetchData();
  }, [pilotId, user, router, authLoading]);

  const handleDateChange = (checkTypeId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [checkTypeId]: value,
    }));

    // Clear any existing error
    if (errors[checkTypeId]) {
      setErrors((prev) => ({ ...prev, [checkTypeId]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const today = new Date();

    Object.entries(formData).forEach(([checkTypeId, dateValue]) => {
      if (dateValue) {
        const date = new Date(dateValue);
        if (date < today) {
          const cert = certifications.find((c) => c.checkTypeId === checkTypeId);
          newErrors[checkTypeId] = `${cert?.checkCode} expiry date cannot be in the past`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🔧 DEBUG: handleSubmit called!', { saving, formData });
    e.preventDefault();

    if (saving) {
      console.log('🔧 DEBUG: Already saving, returning early');
      return;
    }

    const isValid = validateForm();
    if (!isValid) return;

    try {
      setSaving(true);
      setErrors({});

      // Convert form data to the format expected by the API
      const updates = Object.entries(formData).map(([checkTypeId, expiryDate]) => ({
        checkTypeId,
        expiryDate: expiryDate || null,
      }));

      console.log('🔍 Certification Page: Submitting updates:', updates.length, 'items');

      // Always use API route from client components (service role bypasses RLS)
      console.log('🔍 Certification Page: Calling API to update certifications...');
      const response = await fetch(`/api/certifications?pilotId=${pilotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certifications: updates,
        }),
      });

      console.log('🔍 Certification Page: API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🚨 Certification Page: API request failed:', errorText);
        throw new Error(`API request failed: ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        console.error('🚨 Certification Page: API returned error:', result.error);
        throw new Error(result.error || 'Failed to update certifications');
      }

      console.log('✅ Certification Page: Successfully updated certifications');

      // Redirect back to pilot detail page with refresh parameter to force data reload
      router.push(`/dashboard/pilots/${pilotId}?refresh=${Date.now()}`);
    } catch (error) {
      console.error('Error updating certifications:', error);
      setErrors({ submit: 'Failed to update certifications. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (!permissions.canEdit(user)) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6">
            <div className="text-center py-12">
              <span className="text-6xl block mb-4">🚫</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600 mb-4">
                You don&apos;t have permission to manage certifications.
              </p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4002B] mx-auto" />
              <p className="text-gray-600 mt-2">Loading certification data...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!pilot) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6">
            <div className="text-center py-12">
              <span className="text-6xl block mb-4">👨‍✈️</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Pilot not found</h3>
              <p className="text-gray-600 mb-4">
                The pilot you&apos;re looking for doesn&apos;t exist.
              </p>
              <button
                onClick={() => router.push('/dashboard/pilots')}
                className="inline-flex items-center px-4 py-2 bg-[#E4002B] text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <span className="mr-2">⬅️</span>
                Back to Pilots
              </button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const categorizedCertifications = certifications.reduce(
    (acc, cert) => {
      if (!acc[cert.category]) {
        acc[cert.category] = [];
      }
      acc[cert.category]!.push(cert);
      return acc;
    },
    {} as Record<string, CertificationData[]>
  );

  const categories = Object.keys(categorizedCertifications).sort();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => router.push(`/dashboard/pilots/${pilotId}`)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-xl">⬅️</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <span className="text-3xl mr-3">🛡️</span>
                  Manage Certifications
                </h1>
                <p className="text-gray-600 mt-1">
                  {pilot.first_name} {pilot.middle_name && `${pilot.middle_name} `}
                  {pilot.last_name}
                  <span className="ml-2 text-sm">({pilot.employee_id})</span>
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {errors.submit && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{errors.submit}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <span className="text-blue-500 mr-3">ℹ️</span>
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Certification Management</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Set expiry dates for each certification type. Leave blank to indicate no
                    certification recorded. Dates cannot be set in the past.
                  </p>
                </div>
              </div>
            </div>

            {/* Certifications by Category */}
            {categories.map((category) => (
              <div
                key={category}
                className="mb-8 bg-white rounded-lg border border-gray-200 shadow-sm"
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <span className="mr-2">{getCategoryIcon(category)}</span>
                    {category} Certifications
                    <span className="ml-2 text-sm text-gray-500">
                      ({categorizedCertifications[category]?.length ?? 0} items)
                    </span>
                  </h3>
                </div>

                <div className="p-6">
                  {/* Column Headers */}
                  <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-gray-200 text-sm font-medium text-gray-600">
                    <div className="col-span-2">Check Code</div>
                    <div className="col-span-4">Description</div>
                    <div className="col-span-2">Current Status</div>
                    <div className="col-span-3">New Expiry Date</div>
                    <div className="col-span-1">Clear</div>
                  </div>

                  {/* Certification Rows */}
                  <div>
                    {categorizedCertifications[category]?.map((cert) => (
                      <CertificationRow
                        key={cert.checkTypeId}
                        cert={cert}
                        value={formData[cert.checkTypeId] || ''}
                        onChange={handleDateChange}
                        error={errors[cert.checkTypeId]}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push(`/dashboard/pilots/${pilotId}`)}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center space-x-4">
                <button
                  type="submit"
                  disabled={saving}
                  onClick={() => console.log('🔧 DEBUG: Save button clicked!')}
                  className="flex items-center px-6 py-2 bg-[#E4002B] text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">💾</span>
                      Save Certifications
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
