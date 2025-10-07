/**
 * @fileoverview New Form Submission Modal
 * Modal for creating digital form submissions
 */

'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAffectedRosterPeriods } from '@/lib/roster-utils';

interface NewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  forms: any[];
  pilots: any[];
}

export function NewFormModal({
  isOpen,
  onClose,
  onSuccess,
  forms,
  pilots,
}: NewFormModalProps) {
  const { user } = useAuth();
  const [selectedFormId, setSelectedFormId] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [pilotId, setPilotId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-calculate roster period when dates change (Leave Request Form only)
  useEffect(() => {
    const selectedForm = forms.find((f) => f.id === selectedFormId);

    // Only auto-calculate for Leave Request Form
    if (selectedForm?.form_type === 'leave_request' && formData.start_date && formData.end_date) {
      try {
        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);

        // Get affected roster periods
        const periods = getAffectedRosterPeriods(startDate, endDate);

        // Format roster period string
        let rosterPeriodString = '';
        if (periods.length === 1) {
          rosterPeriodString = periods[0].code;
        } else {
          // Multiple periods - show range
          rosterPeriodString = `${periods[0].code} - ${periods[periods.length - 1].code}`;
        }

        // Auto-populate roster_period field
        setFormData((prev: any) => ({
          ...prev,
          roster_period: rosterPeriodString,
        }));
      } catch (error) {
        console.error('Error calculating roster period:', error);
      }
    }
  }, [formData.start_date, formData.end_date, selectedFormId, forms]);

  if (!isOpen) return null;

  const selectedForm = forms.find((f) => f.id === selectedFormId);
  const formSchema = selectedForm?.form_schema || { fields: [] };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFormId) {
      setError('Please select a form type');
      return;
    }

    if (!pilotId) {
      setError('Please select an associated pilot');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_id: selectedFormId,
          form_data: formData,
          submitted_by: user?.id,
          pilot_id: pilotId || null,
          status: 'pending',
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Form submission failed');
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedFormId('');
    setFormData({});
    setPilotId('');
    setError(null);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const renderField = (field: any) => {
    const { name, type, label, required, options } = field;

    // Special handling for roster_period field in Leave Request Form
    const isRosterPeriodField = name === 'roster_period' && selectedForm?.form_type === 'leave_request';
    const isReadOnly = isRosterPeriodField;

    switch (type) {
      case 'text':
        return (
          <input
            type="text"
            value={formData[name] || ''}
            onChange={(e) => handleFieldChange(name, e.target.value)}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            placeholder={isRosterPeriodField ? 'Auto-calculated from dates' : `Enter ${label.toLowerCase()}`}
            required={required}
            readOnly={isReadOnly}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={formData[name] || ''}
            onChange={(e) => handleFieldChange(name, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            required={required}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={formData[name] || ''}
            onChange={(e) => handleFieldChange(name, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            required={required}
          />
        );

      case 'select':
        return (
          <select
            value={formData[name] || ''}
            onChange={(e) => handleFieldChange(name, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            required={required}
          >
            <option value="">Select an option</option>
            {options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="flex gap-4">
            {options?.map((option: string) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name={name}
                  value={option}
                  checked={formData[name] === option}
                  onChange={(e) => handleFieldChange(name, e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300"
                  required={required}
                />
                <span className="ml-2 text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'textarea':
        return (
          <textarea
            value={formData[name] || ''}
            onChange={(e) => handleFieldChange(name, e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            placeholder={`Enter ${label.toLowerCase()}`}
            required={required}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">New Form Submission</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Form Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form Type *
              </label>
              <select
                value={selectedFormId}
                onChange={(e) => {
                  setSelectedFormId(e.target.value);
                  setFormData({});
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                required
              >
                <option value="">Select a form type</option>
                {forms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.title}
                  </option>
                ))}
              </select>
              {selectedForm && (
                <p className="mt-1 text-xs text-gray-500">{selectedForm.description}</p>
              )}
            </div>

            {/* Pilot Selection */}
            {selectedFormId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Associated Pilot *
                </label>
                <select
                  value={pilotId}
                  onChange={(e) => setPilotId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  required
                >
                  <option value="">Select a pilot</option>
                  {pilots.map((pilot) => (
                    <option key={pilot.id} value={pilot.id}>
                      {pilot.first_name} {pilot.last_name} ({pilot.employee_id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Dynamic Form Fields */}
            {selectedFormId &&
              formSchema.fields?.map((field: any) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label} {field.required && '*'}
                  </label>
                  {renderField(field)}
                </div>
              ))}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !selectedFormId || !pilotId}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Form'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
