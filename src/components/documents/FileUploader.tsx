/**
 * @fileoverview FileUploader Component - Drag-and-drop file upload with validation
 * Air Niugini branded file uploader with progress tracking and validation
 *
 * Features:
 * - Drag-and-drop file upload
 * - File type and size validation
 * - Upload progress indicator
 * - Multiple file upload support
 * - Air Niugini themed UI
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-01
 */

'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File as FileIcon, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface FileWithPreview extends File {
  preview?: string;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  uploadError?: string;
}

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
  autoUpload?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
];

const FILE_TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG',
  'image/jpg': 'JPG',
  'image/png': 'PNG',
  'image/gif': 'GIF',
};

// =============================================================================
// FILE UPLOADER COMPONENT
// =============================================================================

export function FileUploader({
  onFilesSelected,
  onUpload,
  maxFiles = 5,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  disabled = false,
  className,
  showPreview = true,
  autoUpload = false,
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100  } ${  sizes[i]}`;
  };

  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        console.error('Rejected files:', rejectedFiles);
        rejectedFiles.forEach((rejection) => {
          const errors = rejection.errors.map((e: any) => e.message).join(', ');
          console.error(`File ${rejection.file.name} rejected: ${errors}`);
        });
      }

      // Process accepted files
      const newFiles: FileWithPreview[] = acceptedFiles.map((file) => {
        const fileWithMeta = file as FileWithPreview;
        fileWithMeta.uploadStatus = 'pending';
        fileWithMeta.uploadProgress = 0;

        // Create preview for images
        if (file.type.startsWith('image/')) {
          fileWithMeta.preview = URL.createObjectURL(file);
        }

        return fileWithMeta;
      });

      // Update files state
      setFiles((prev) => {
        const combined = [...prev, ...newFiles];
        // Limit to maxFiles
        const limited = combined.slice(0, maxFiles);
        return limited;
      });

      // Notify parent
      onFilesSelected(newFiles);

      // Auto-upload if enabled
      if (autoUpload && onUpload) {
        handleUpload(newFiles);
      }
    },
    [maxFiles, onFilesSelected, onUpload, autoUpload]
  );

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    maxFiles,
    disabled: disabled || isUploading,
    multiple: maxFiles > 1,
  });

  // Remove file from list
  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const removed = newFiles.splice(index, 1)[0];
      // Revoke object URL if preview exists
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return newFiles;
    });
  };

  // Handle manual upload
  const handleUpload = async (filesToUpload?: FileWithPreview[]) => {
    const uploadFiles = filesToUpload || files;

    if (uploadFiles.length === 0 || !onUpload) return;

    setIsUploading(true);

    try {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          uploadStatus: 'uploading',
          uploadProgress: 0,
        }))
      );

      // Call upload handler
      await onUpload(uploadFiles);

      // Update status to success
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          uploadStatus: 'success',
          uploadProgress: 100,
        }))
      );

      // Clear files after successful upload
      setTimeout(() => {
        setFiles([]);
      }, 2000);
    } catch (error: any) {
      console.error('Upload error:', error);

      // Update status to error
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          uploadStatus: 'error',
          uploadError: error.message || 'Upload failed',
        }))
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Clear all files
  const clearFiles = () => {
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200',
          'hover:border-[#4F46E5] hover:bg-red-50/50 cursor-pointer',
          isDragActive && 'border-[#4F46E5] bg-red-50',
          isDragReject && 'border-red-500 bg-red-50',
          (disabled || isUploading) && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
      >
        <input {...getInputProps()} />

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={cn(
              'rounded-full p-4 transition-colors',
              isDragActive ? 'bg-[#4F46E5] text-white' : 'bg-gray-100 text-gray-600'
            )}
          >
            <Upload className="w-8 h-8" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <p className="text-lg font-semibold text-gray-900">
            {isDragActive ? 'Drop files here' : 'Drag and drop files here'}
          </p>
          <p className="text-sm text-gray-500">or click to browse your computer</p>
          <p className="text-xs text-gray-400 mt-4">
            Accepted: {acceptedFileTypes.map((type) => FILE_TYPE_LABELS[type] || type).join(', ')}
            <br />
            Max file size: {formatFileSize(maxSize)} | Max files: {maxFiles}
          </p>
        </div>
      </div>

      {/* File List */}
      {showPreview && files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Selected Files ({files.length}/{maxFiles})
            </h3>
            {!isUploading && (
              <Button
                onClick={clearFiles}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-red-600"
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                {/* File Icon/Preview */}
                <div className="flex-shrink-0">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                      <FileIcon className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {FILE_TYPE_LABELS[file.type] || file.type}
                  </p>

                  {/* Progress Bar */}
                  {file.uploadStatus === 'uploading' && (
                    <Progress value={file.uploadProgress || 0} className="h-1 mt-2" />
                  )}

                  {/* Error Message */}
                  {file.uploadStatus === 'error' && file.uploadError && (
                    <p className="text-xs text-red-600 mt-1">{file.uploadError}</p>
                  )}
                </div>

                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {file.uploadStatus === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {file.uploadStatus === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  {file.uploadStatus === 'pending' && !isUploading && (
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          {!autoUpload && onUpload && files.length > 0 && (
            <Button
              onClick={() => handleUpload()}
              disabled={isUploading || files.every((f) => f.uploadStatus === 'success')}
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              {isUploading
                ? 'Uploading...'
                : `Upload ${files.length} File${files.length > 1 ? 's' : ''}`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
