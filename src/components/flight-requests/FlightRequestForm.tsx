/**
 * @fileoverview Flight Request Form Component
 * Modal form for creating and editing flight requests
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-15
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Plane } from 'lucide-react';
import { apiPost, apiGet } from '@/lib/api-client';

const flightRequestSchema = z.object({
  pilot_id: z.string().min(1, 'Pilot is required'),
  request_type: z.enum([
    'FLIGHT_ASSIGNMENT',
    'ROUTE_QUALIFICATION',
    'TYPE_RATING',
    'LINE_CHECK',
    'SIM_TRAINING',
    'STANDBY',
    'POSITION_CHANGE',
    'BASE_CHANGE',
    'OTHER',
  ]),
  flight_number: z.string().max(20).optional(),
  route: z.string().max(100).optional(),
  departure_airport: z.string().max(10).optional(),
  arrival_airport: z.string().max(10).optional(),
  departure_date: z.string().optional(),
  return_date: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

type FlightRequestFormData = z.infer<typeof flightRequestSchema>;

interface FlightRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Partial<FlightRequestFormData>;
}

interface Pilot {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  role: string;
}

const REQUEST_TYPES = [
  { value: 'FLIGHT_ASSIGNMENT', label: 'Flight Assignment' },
  { value: 'ROUTE_QUALIFICATION', label: 'Route Qualification' },
  { value: 'TYPE_RATING', label: 'Type Rating Training' },
  { value: 'LINE_CHECK', label: 'Line Check' },
  { value: 'SIM_TRAINING', label: 'Simulator Training' },
  { value: 'STANDBY', label: 'Standby Duty' },
  { value: 'POSITION_CHANGE', label: 'Position Change (FO to Captain)' },
  { value: 'BASE_CHANGE', label: 'Base Change' },
  { value: 'OTHER', label: 'Other' },
];

export function FlightRequestForm({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: FlightRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [loadingPilots, setLoadingPilots] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FlightRequestFormData>({
    resolver: zodResolver(flightRequestSchema),
    defaultValues: {
      priority: 'NORMAL',
      request_type: 'FLIGHT_ASSIGNMENT',
      ...initialData,
    },
  });

  const requestType = watch('request_type');

  // Fetch pilots on mount
  useEffect(() => {
    const fetchPilots = async () => {
      try {
        const response = await apiGet('/api/pilots');
        if (response?.data) {
          setPilots(response.data);
        }
      } catch (err) {
        console.error('Error fetching pilots:', err);
      } finally {
        setLoadingPilots(false);
      }
    };

    if (isOpen) {
      fetchPilots();
    }
  }, [isOpen]);

  const onSubmit = async (data: FlightRequestFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await apiPost('/api/flight-requests', data);
      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating flight request:', err);
      setError(err.message || 'Failed to create flight request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const showFlightDetails =
    requestType === 'FLIGHT_ASSIGNMENT' || requestType === 'STANDBY';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#4F46E5] rounded-lg flex items-center justify-center">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">New Flight Request</h2>
              <p className="text-sm text-gray-600">Submit a new flight-related request</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Pilot Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pilot <span className="text-red-500">*</span>
            </label>
            <select
              {...register('pilot_id')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
              disabled={loadingPilots}
            >
              <option value="">Select pilot...</option>
              {pilots.map((pilot) => (
                <option key={pilot.id} value={pilot.id}>
                  {pilot.employee_id} - {pilot.first_name} {pilot.last_name} ({pilot.role})
                </option>
              ))}
            </select>
            {errors.pilot_id && (
              <p className="text-red-600 text-sm mt-1">{errors.pilot_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Request Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Request Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register('request_type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
              >
                {REQUEST_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.request_type && (
                <p className="text-red-600 text-sm mt-1">{errors.request_type.message}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
              {errors.priority && (
                <p className="text-red-600 text-sm mt-1">{errors.priority.message}</p>
              )}
            </div>
          </div>

          {/* Flight Details (conditional) */}
          {showFlightDetails && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Flight Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Flight Number
                  </label>
                  <input
                    type="text"
                    {...register('flight_number')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
                    placeholder="e.g., PX141"
                  />
                </div>

                {/* Route */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                  <input
                    type="text"
                    {...register('route')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
                    placeholder="e.g., POM-LAE"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Departure Airport */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departure Airport
                  </label>
                  <input
                    type="text"
                    {...register('departure_airport')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
                    placeholder="e.g., POM"
                    maxLength={10}
                  />
                </div>

                {/* Arrival Airport */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arrival Airport
                  </label>
                  <input
                    type="text"
                    {...register('arrival_airport')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
                    placeholder="e.g., LAE"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Departure Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    {...register('departure_date')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
                  />
                </div>

                {/* Return Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Return Date
                  </label>
                  <input
                    type="date"
                    {...register('return_date')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
                  />
                </div>
              </div>
            </>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              {...register('reason')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
              placeholder="Explain the reason for this request..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
              placeholder="Any additional information..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5 mr-2" />
              {isSubmitting ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
