'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiPost, apiGet } from '@/lib/api-client';
import { ModalSheet } from '@/components/ui/ModalSheet';

interface DisciplinaryMatterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface DisciplinaryFormData {
  pilot_id: string;
  incident_type_id: string;
  incident_date: string;
  severity: 'MINOR' | 'MODERATE' | 'SERIOUS' | 'CRITICAL';
  title: string;
  description: string;
  location?: string;
  flight_number?: string;
  aircraft_registration?: string;
  regulatory_notification_required: boolean;
  regulatory_body?: string;
}

function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required = false,
  options,
  error,
  placeholder,
  rows,
}: {
  label: string;
  name: string;
  type?: string;
  value: string | boolean;
  onChange: (value: string | boolean) => void;
  required?: boolean;
  options?: { value: string; label: string }[];
  error?: string;
  placeholder?: string;
  rows?: number;
}) {
  if (type === 'select' && options) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5] ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
          required={required}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <span className="mr-1">⚠️</span>
            {error}
          </p>
        )}
      </div>
    );
  }

  if (type === 'checkbox') {
    return (
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={value as boolean}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 text-[#4F46E5] focus:ring-[#4F46E5] border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-700">{label}</label>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          rows={rows || 4}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5] ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
          required={required}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <span className="mr-1">⚠️</span>
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5] ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
        required={required}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <span className="mr-1">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}

export function DisciplinaryMatterModal({
  isOpen,
  onClose,
  onSuccess,
}: DisciplinaryMatterModalProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<DisciplinaryFormData>({
    pilot_id: '',
    incident_type_id: '',
    incident_date: '',
    severity: 'MODERATE',
    title: '',
    description: '',
    location: '',
    flight_number: '',
    aircraft_registration: '',
    regulatory_notification_required: false,
    regulatory_body: '',
  });

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

  const updateFormData = (field: keyof DisciplinaryFormData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.pilot_id) newErrors.pilot_id = 'Pilot is required';
    if (!formData.incident_type_id) newErrors.incident_type_id = 'Incident type is required';
    if (!formData.incident_date) newErrors.incident_date = 'Incident date is required';
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.severity) newErrors.severity = 'Severity is required';

    // Date validation
    if (formData.incident_date && new Date(formData.incident_date) > new Date()) {
      newErrors.incident_date = 'Incident date cannot be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await apiPost('/api/disciplinary-matters', formData);

      // Reset form
      setFormData({
        pilot_id: '',
        incident_type_id: '',
        incident_date: '',
        severity: 'MODERATE',
        title: '',
        description: '',
        location: '',
        flight_number: '',
        aircraft_registration: '',
        regulatory_notification_required: false,
        regulatory_body: '',
      });

      // Close modal and call success callback
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating disciplinary matter:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to create disciplinary case. Please try again.';
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose} title="Create New Disciplinary Case" size="xl">
      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <span className="text-red-400">⚠️</span>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{errors.general}</p>
              </div>
            </div>
          </div>
        )}

        {/* Case Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Pilot"
              name="pilot_id"
              type="select"
              value={formData.pilot_id}
              onChange={(value) => updateFormData('pilot_id', value)}
              required
              options={
                pilotsData?.data?.map((pilot: any) => ({
                  value: pilot.id,
                  label: `${pilot.first_name} ${pilot.last_name} - ${pilot.employee_id}`,
                })) || []
              }
              error={errors.pilot_id}
            />

            <FormField
              label="Incident Type"
              name="incident_type_id"
              type="select"
              value={formData.incident_type_id}
              onChange={(value) => updateFormData('incident_type_id', value)}
              required
              options={
                incidentTypesData?.data?.map((type: any) => ({
                  value: type.id,
                  label: `${type.name} (${type.code})${type.severity_level ? ` - ${type.severity_level}` : ''}`,
                })) || []
              }
              error={errors.incident_type_id}
            />
          </div>

          <div className="mt-4">
            <FormField
              label="Title"
              name="title"
              value={formData.title}
              onChange={(value) => updateFormData('title', value)}
              required
              placeholder="Enter case title"
              error={errors.title}
            />
          </div>

          <div className="mt-4">
            <FormField
              label="Description"
              name="description"
              type="textarea"
              value={formData.description}
              onChange={(value) => updateFormData('description', value)}
              required
              placeholder="Enter detailed description of the incident"
              rows={4}
              error={errors.description}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              label="Incident Date"
              name="incident_date"
              type="date"
              value={formData.incident_date}
              onChange={(value) => updateFormData('incident_date', value)}
              required
              error={errors.incident_date}
            />

            <FormField
              label="Severity"
              name="severity"
              type="select"
              value={formData.severity}
              onChange={(value) => updateFormData('severity', value)}
              required
              options={[
                { value: 'MINOR', label: 'Minor' },
                { value: 'MODERATE', label: 'Moderate' },
                { value: 'SERIOUS', label: 'Serious' },
                { value: 'CRITICAL', label: 'Critical' },
              ]}
              error={errors.severity}
            />
          </div>
        </div>

        {/* Flight Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Flight Details (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="Location"
              name="location"
              value={formData.location || ''}
              onChange={(value) => updateFormData('location', value)}
              placeholder="e.g., Port Moresby"
            />

            <FormField
              label="Flight Number"
              name="flight_number"
              value={formData.flight_number || ''}
              onChange={(value) => updateFormData('flight_number', value)}
              placeholder="e.g., PX101"
            />

            <FormField
              label="Aircraft Registration"
              name="aircraft_registration"
              value={formData.aircraft_registration || ''}
              onChange={(value) => updateFormData('aircraft_registration', value)}
              placeholder="e.g., P2-PXA"
            />
          </div>
        </div>

        {/* Regulatory Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Regulatory Information</h3>
          <div className="space-y-4">
            <FormField
              label="Regulatory notification required"
              name="regulatory_notification_required"
              type="checkbox"
              value={formData.regulatory_notification_required}
              onChange={(value) => updateFormData('regulatory_notification_required', value)}
            />

            {formData.regulatory_notification_required && (
              <FormField
                label="Regulatory Body"
                name="regulatory_body"
                value={formData.regulatory_body || ''}
                onChange={(value) => updateFormData('regulatory_body', value)}
                placeholder="e.g., PNG Civil Aviation Safety Authority"
              />
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <span className="mr-2">💾</span>
            )}
            {loading ? 'Creating...' : 'Create Case'}
          </button>
        </div>
      </form>
    </ModalSheet>
  );
}
