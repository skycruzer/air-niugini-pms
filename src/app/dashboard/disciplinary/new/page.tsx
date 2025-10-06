/**
 * @fileoverview New Disciplinary Case Creation Page
 * Form for creating new disciplinary matters
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-06
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { apiPost, apiGet } from '@/lib/api-client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

const disciplinarySchema = z.object({
  pilot_id: z.string().min(1, 'Pilot is required'),
  incident_type_id: z.string().min(1, 'Incident type is required'),
  incident_date: z.string().min(1, 'Incident date is required'),
  severity: z.enum(['MINOR', 'MODERATE', 'SERIOUS', 'CRITICAL']),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required'),
  location: z.string().max(200).optional(),
  flight_number: z.string().max(20).optional(),
  aircraft_registration: z.string().max(20).optional(),
  regulatory_notification_required: z.boolean().optional(),
  regulatory_body: z.string().max(100).optional(),
});

type DisciplinaryFormData = z.infer<typeof disciplinarySchema>;

export default function NewDisciplinaryCasePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<DisciplinaryFormData>({
    resolver: zodResolver(disciplinarySchema),
    defaultValues: {
      severity: 'MODERATE',
      regulatory_notification_required: false,
    },
  });

  const regulatoryNotificationRequired = watch('regulatory_notification_required');

  // Fetch pilots
  const { data: pilotsData } = useQuery({
    queryKey: ['pilots'],
    queryFn: async () => apiGet('/api/pilots'),
  });

  // Fetch incident types
  const { data: incidentTypesData } = useQuery({
    queryKey: ['incident-types'],
    queryFn: async () => apiGet('/api/incident-types'),
  });

  const onSubmit = async (data: DisciplinaryFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await apiPost('/api/disciplinary-matters', data);
      router.push('/dashboard/disciplinary');
    } catch (err: any) {
      console.error('Error creating disciplinary matter:', err);
      setError(err.message || 'Failed to create disciplinary case');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Disciplinary Case</h1>
              <p className="text-gray-600 mt-1">Record a new pilot disciplinary matter</p>
            </div>
            <Link
              href="/dashboard/disciplinary"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Cases
            </Link>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pilot */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pilot <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('pilot_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                >
                  <option value="">Select a pilot</option>
                  {pilotsData?.data?.map((pilot: any) => (
                    <option key={pilot.id} value={pilot.id}>
                      {pilot.first_name} {pilot.last_name} - {pilot.employee_id}
                    </option>
                  ))}
                </select>
                {errors.pilot_id && (
                  <p className="text-red-600 text-sm mt-1">{errors.pilot_id.message}</p>
                )}
              </div>

              {/* Incident Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Incident Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('incident_type_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                >
                  <option value="">Select incident type</option>
                  {incidentTypesData?.data?.map((type: any) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.code}){type.severity_level && ` - ${type.severity_level}`}
                    </option>
                  ))}
                </select>
                {errors.incident_type_id && (
                  <p className="text-red-600 text-sm mt-1">{errors.incident_type_id.message}</p>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('title')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                placeholder="Enter case title"
              />
              {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                placeholder="Enter detailed description of the incident"
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Incident Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Incident Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('incident_date')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                />
                {errors.incident_date && (
                  <p className="text-red-600 text-sm mt-1">{errors.incident_date.message}</p>
                )}
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('severity')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                >
                  <option value="MINOR">Minor</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="SERIOUS">Serious</option>
                  <option value="CRITICAL">Critical</option>
                </select>
                {errors.severity && (
                  <p className="text-red-600 text-sm mt-1">{errors.severity.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  {...register('location')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                  placeholder="e.g., Port Moresby"
                />
              </div>

              {/* Flight Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flight Number
                </label>
                <input
                  type="text"
                  {...register('flight_number')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                  placeholder="e.g., PX101"
                />
              </div>

              {/* Aircraft Registration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aircraft Registration
                </label>
                <input
                  type="text"
                  {...register('aircraft_registration')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                  placeholder="e.g., P2-PXA"
                />
              </div>
            </div>

            {/* Regulatory Notification */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('regulatory_notification_required')}
                  className="w-4 h-4 text-[#E4002B] border-gray-300 rounded focus:ring-[#E4002B]"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Regulatory notification required
                </label>
              </div>

              {regulatoryNotificationRequired && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Regulatory Body
                  </label>
                  <input
                    type="text"
                    {...register('regulatory_body')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                    placeholder="e.g., PNG Civil Aviation Safety Authority"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
              <Link
                href="/dashboard/disciplinary"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 bg-[#E4002B] text-white rounded-lg hover:bg-[#C00020] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Case'}
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
