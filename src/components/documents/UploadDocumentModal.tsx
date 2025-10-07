/**
 * @fileoverview Upload Document Modal
 * Modal for uploading documents with metadata
 */

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { useAuth } from '@/contexts/AuthContext';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: any[];
  pilots: any[];
}

export function UploadDocumentModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
  pilots,
}: UploadDocumentModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    pilot_id: '',
    is_public: false,
    expires_at: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    if (!formData.title) {
      setError('Please enter a document title');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Upload each file
      for (const file of selectedFiles) {
        const formDataToSend = new FormData();
        formDataToSend.append('file', file);
        formDataToSend.append('title', formData.title);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('category_id', formData.category_id);
        formDataToSend.append('pilot_id', formData.pilot_id);
        formDataToSend.append('is_public', formData.is_public.toString());
        formDataToSend.append('expires_at', formData.expires_at);
        formDataToSend.append('uploaded_by', user?.id || '');

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formDataToSend,
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category_id: '',
      pilot_id: '',
      is_public: false,
      expires_at: '',
    });
    setSelectedFiles([]);
    setError(null);
  };

  const handleClose = () => {
    if (!isUploading) {
      resetForm();
      onClose();
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
            <h2 className="text-xl font-semibold text-gray-900">Upload Document</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isUploading}
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

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Files
              </label>
              <FileUpload onUpload={handleFileUpload} multiple />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                placeholder="Enter document title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                placeholder="Enter document description"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Pilot */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Associated Pilot (Optional)
              </label>
              <select
                value={formData.pilot_id}
                onChange={(e) => setFormData({ ...formData, pilot_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              >
                <option value="">Select a pilot</option>
                {pilots.map((pilot) => (
                  <option key={pilot.id} value={pilot.id}>
                    {pilot.first_name} {pilot.last_name} ({pilot.employee_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            {/* Public Access */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_public"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
                Make this document publicly accessible
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUploading || selectedFiles.length === 0}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
