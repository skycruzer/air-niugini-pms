'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Users, Upload, CheckCircle, AlertTriangle } from 'lucide-react';

const bulkUpdateSchema = z.object({
  checkTypeId: z.string().min(1, 'Check type is required'),
  newExpiryDate: z.string().min(1, 'Expiry date is required'),
  selectedPilots: z.array(z.string()).min(1, 'At least one pilot must be selected'),
});

type BulkUpdateData = z.infer<typeof bulkUpdateSchema>;

interface Pilot {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

interface CheckType {
  id: string;
  check_code: string;
  check_description: string;
  category: string;
}

interface BulkCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BulkCertificationModal({
  isOpen,
  onClose,
  onSuccess,
}: BulkCertificationModalProps) {
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [checkTypes, setCheckTypes] = useState<CheckType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPilots, setSelectedPilots] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [updateResults, setUpdateResults] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BulkUpdateData>({
    resolver: zodResolver(bulkUpdateSchema),
    defaultValues: {
      selectedPilots: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    } else {
      // Reset form and state when modal closes
      reset();
      setSelectedPilots([]);
      setSelectAll(false);
      setUpdateResults(null);
      setError(null);
    }
  }, [isOpen, reset]);

  useEffect(() => {
    setValue('selectedPilots', selectedPilots);
  }, [selectedPilots, setValue]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch pilots and check types in parallel
      const [pilotsResponse, checkTypesResponse] = await Promise.all([
        fetch('/api/pilots'),
        fetch('/api/check-types'),
      ]);

      if (!pilotsResponse.ok) {
        throw new Error('Failed to fetch pilots');
      }
      if (!checkTypesResponse.ok) {
        throw new Error('Failed to fetch check types');
      }

      const [pilotsResult, checkTypesResult] = await Promise.all([
        pilotsResponse.json(),
        checkTypesResponse.json(),
      ]);

      if (pilotsResult.success) {
        const activePilots = pilotsResult.data.filter((pilot: Pilot) => pilot.is_active);
        setPilots(activePilots);
      }

      if (checkTypesResult.success) {
        setCheckTypes(checkTypesResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPilots([]);
    } else {
      setSelectedPilots(pilots.map((p) => p.id));
    }
    setSelectAll(!selectAll);
  };

  const handlePilotSelect = (pilotId: string) => {
    setSelectedPilots((prev) => {
      if (prev.includes(pilotId)) {
        return prev.filter((id) => id !== pilotId);
      } else {
        return [...prev, pilotId];
      }
    });
  };

  const onSubmit = async (data: BulkUpdateData) => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/certifications/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          selectedPilots,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update certifications');
      }

      const result = await response.json();
      setUpdateResults(result);

      // Reset form and selections
      setSelectedPilots([]);
      setSelectAll(false);
      reset();

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating certifications:', error);
      setError('Failed to update certifications');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose} title="Bulk Certification Update" size="xl">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Users className="w-7 h-7 text-[#4F46E5]" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bulk Certification Update</h2>
            <p className="text-gray-600 text-sm">
              Update certification expiry dates for multiple pilots at once
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4F46E5] mx-auto" />
            <p className="text-gray-600 mt-2">Loading data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Success Results */}
        {updateResults && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <h3 className="text-green-800 font-medium">Update Successful</h3>
                <p className="text-green-700 text-sm mt-1">
                  Successfully updated certifications for {updateResults.updatedCount} pilots.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {!loading && !error && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Check Type and Date Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certification Type
                </label>
                <select
                  {...register('checkTypeId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
                >
                  <option value="">Select a certification type</option>
                  {checkTypes.map((checkType) => (
                    <option key={checkType.id} value={checkType.id}>
                      {checkType.check_code} - {checkType.check_description}
                    </option>
                  ))}
                </select>
                {errors.checkTypeId && (
                  <p className="text-sm text-red-600 mt-1">{errors.checkTypeId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Expiry Date
                </label>
                <input
                  type="date"
                  {...register('newExpiryDate')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
                />
                {errors.newExpiryDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.newExpiryDate.message}</p>
                )}
              </div>
            </div>

            {/* Pilot Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Select Pilots ({selectedPilots.length} selected)
                </label>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-[#4F46E5] hover:text-[#4338CA]"
                >
                  {selectAll ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                {pilots.map((pilot) => (
                  <div
                    key={pilot.id}
                    className="flex items-center p-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPilots.includes(pilot.id)}
                      onChange={() => handlePilotSelect(pilot.id)}
                      className="w-4 h-4 text-[#4F46E5] border-gray-300 rounded focus:ring-[#4F46E5]"
                    />
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {pilot.first_name} {pilot.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        ID: {pilot.employee_id} • Role: {pilot.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {errors.selectedPilots && (
                <p className="text-sm text-red-600 mt-1">{errors.selectedPilots.message}</p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || selectedPilots.length === 0}
                className="flex items-center px-6 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {submitting ? 'Updating...' : 'Update Certifications'}
              </button>
            </div>
          </form>
        )}
      </div>
    </ModalSheet>
  );
}
