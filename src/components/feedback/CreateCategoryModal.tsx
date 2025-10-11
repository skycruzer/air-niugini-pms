'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Sparkles } from 'lucide-react';

const categorySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  icon: z.string().max(10, 'Icon too long').optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const commonIcons = ['💬', '💡', '🚀', '⚙️', '📋', '🎯', '✨', '🔧', '📝', '👥', '🌟', '🔔'];

export function CreateCategoryModal({ isOpen, onClose, onSuccess }: CreateCategoryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState('💬');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      icon: '💬',
    },
  });

  const onSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/pilot/feedback/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          icon: selectedIcon,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setSubmitError(result.error || 'Failed to create category');
        return;
      }

      // Success
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating category:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-[#E4002B]" />
              Create New Category
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Start a new discussion topic for the team
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Error Alert */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{submitError}</p>
            </div>
          )}

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Category Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {commonIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`text-2xl p-3 rounded-lg border-2 transition-all ${
                    selectedIcon === icon
                      ? 'border-[#E4002B] bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Or type a custom emoji in the field below
            </p>
            <input
              type="text"
              {...register('icon')}
              value={selectedIcon}
              onChange={(e) => setSelectedIcon(e.target.value)}
              placeholder="💬"
              maxLength={10}
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-transparent text-center text-2xl"
            />
          </div>

          {/* Category Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              placeholder="e.g., Flight Operations, Safety, Crew Facilities"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              placeholder="Brief description of what topics belong in this category..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-transparent resize-none"
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Max 500 characters</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-[#E4002B] rounded-lg hover:bg-[#C00020] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
