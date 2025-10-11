'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api-client';
import { ModalSheet } from '@/components/ui/ModalSheet';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface TaskFormData {
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  due_date?: string;
  estimated_hours?: number;
  tags?: string;
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
  step,
  min,
  helpText,
}: {
  label: string;
  name: string;
  type?: string;
  value: string | number | undefined;
  onChange: (value: string | number | undefined) => void;
  required?: boolean;
  options?: { value: string; label: string }[];
  error?: string;
  placeholder?: string;
  rows?: number;
  step?: string;
  min?: string;
  helpText?: string;
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
        value={value ?? ''}
        onChange={(e) => {
          if (type === 'number') {
            const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
            onChange(val);
          } else {
            onChange(e.target.value || undefined);
          }
        }}
        placeholder={placeholder}
        step={step}
        min={min}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5] ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
        required={required}
      />
      {helpText && <p className="mt-1 text-sm text-gray-500">{helpText}</p>}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <span className="mr-1">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}

export function TaskModal({ isOpen, onClose, onSuccess }: TaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    due_date: '',
    estimated_hours: undefined,
    tags: '',
  });

  const updateFormData = (field: keyof TaskFormData, value: string | number | undefined) => {
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
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.priority) newErrors.priority = 'Priority is required';

    // Validate estimated hours
    if (formData.estimated_hours !== undefined && formData.estimated_hours < 0) {
      newErrors.estimated_hours = 'Estimated hours must be 0 or greater';
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
      // Convert tags string to array if provided
      const taskData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : [],
        estimated_hours: formData.estimated_hours ? Number(formData.estimated_hours) : undefined,
        due_date: formData.due_date ? formData.due_date : undefined,
      };

      await apiPost('/api/tasks', taskData);

      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        due_date: '',
        estimated_hours: undefined,
        tags: '',
      });

      // Close modal and call success callback
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create task. Please try again.';
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose} title="Create New Task" size="lg">
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

        {/* Task Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Information</h3>

          <div className="space-y-4">
            <FormField
              label="Title"
              name="title"
              value={formData.title}
              onChange={(value) => updateFormData('title', value)}
              required
              placeholder="Enter task title"
              error={errors.title}
            />

            <FormField
              label="Description"
              name="description"
              type="textarea"
              value={formData.description}
              onChange={(value) => updateFormData('description', value)}
              placeholder="Enter task description"
              rows={4}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Priority"
                name="priority"
                type="select"
                value={formData.priority}
                onChange={(value) => updateFormData('priority', value)}
                required
                options={[
                  { value: 'LOW', label: 'Low' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HIGH', label: 'High' },
                  { value: 'URGENT', label: 'Urgent' },
                ]}
                error={errors.priority}
              />

              <FormField
                label="Estimated Hours"
                name="estimated_hours"
                type="number"
                value={formData.estimated_hours}
                onChange={(value) => updateFormData('estimated_hours', value)}
                placeholder="0"
                step="0.5"
                min="0"
                error={errors.estimated_hours}
              />
            </div>

            <FormField
              label="Due Date"
              name="due_date"
              type="datetime-local"
              value={formData.due_date}
              onChange={(value) => updateFormData('due_date', value)}
            />

            <FormField
              label="Tags"
              name="tags"
              value={formData.tags}
              onChange={(value) => updateFormData('tags', value)}
              placeholder="Enter tags separated by commas"
              helpText="Separate tags with commas (e.g., urgent, pilot-related, compliance)"
            />
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
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </ModalSheet>
  );
}
