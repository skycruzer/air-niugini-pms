'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, MessageSquare, Sparkles, Tag } from 'lucide-react';
import type { Database } from '@/types/supabase';

type FeedbackCategory = Database['public']['Tables']['feedback_categories']['Row'];

const postSchema = z.object({
  category_id: z.string().uuid('Please select a category'),
  title: z.string().min(10, 'Title must be at least 10 characters').max(200, 'Title too long'),
  content: z
    .string()
    .min(20, 'Content must be at least 20 characters')
    .max(5000, 'Content too long'),
  is_anonymous: z.boolean().default(false),
  tags: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePostModal({ isOpen, onClose, onSuccess }: CreatePostModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [categories, setCategories] = useState<FeedbackCategory[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      is_anonymous: false,
    },
  });

  const isAnonymous = watch('is_anonymous');

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/pilot/feedback/categories');
      const result = await response.json();

      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const onSubmit = async (data: PostFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Parse tags from comma-separated string
      const tags = data.tags
        ? data.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const response = await fetch('/api/pilot/feedback/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category_id: data.category_id,
          title: data.title,
          content: data.content,
          is_anonymous: data.is_anonymous,
          tags,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setSubmitError(result.error || 'Failed to create post');
        return;
      }

      // Success
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <MessageSquare className="w-6 h-6 mr-2 text-[#E4002B]" />
              Create New Post
            </h3>
            <p className="text-sm text-gray-600 mt-1">Share your feedback or suggestion</p>
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

          {/* Anonymous Toggle */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                {...register('is_anonymous')}
                className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <div className="ml-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-900">Post Anonymously</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Your name will be hidden from other pilots, but admins can see your identity for
                  moderation purposes
                </p>
              </div>
            </label>
          </div>

          {/* Category Selection */}
          <div>
            <label htmlFor="category_id" className="block text-sm font-semibold text-gray-900 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category_id"
              {...register('category_id')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
            >
              <option value="">Select a category...</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="text-sm text-red-600 mt-1">{errors.category_id.message}</p>
            )}
          </div>

          {/* Post Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              placeholder="Brief summary of your feedback or suggestion"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
            />
            {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
            <p className="text-xs text-gray-500 mt-1">Min 10 characters, max 200</p>
          </div>

          {/* Post Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-semibold text-gray-900 mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              {...register('content')}
              rows={8}
              placeholder="Describe your feedback or suggestion in detail..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-transparent resize-none"
            />
            {errors.content && (
              <p className="text-sm text-red-600 mt-1">{errors.content.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Min 20 characters, max 5000</p>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-semibold text-gray-900 mb-2">
              Tags (Optional)
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="tags"
                type="text"
                {...register('tags')}
                placeholder="safety, training, scheduling (comma-separated)"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Add up to 5 tags, separated by commas
            </p>
          </div>

          {/* Preview */}
          {isAnonymous && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">Preview</p>
              <p className="text-sm text-gray-600">
                This post will appear as <strong>Anonymous Pilot</strong> to other users
              </p>
            </div>
          )}

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
              {isSubmitting ? 'Posting...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
