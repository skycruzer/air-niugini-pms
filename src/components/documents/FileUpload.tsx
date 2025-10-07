/**
 * @fileoverview File Upload Component
 * Drag-and-drop file upload with validation and progress tracking
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  multiple?: boolean;
}

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function FileUpload({
  onUpload,
  maxSize = 10,
  acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
  multiple = true,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return `File size exceeds ${maxSize}MB limit`;
    }

    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} not accepted`;
    }

    return null;
  };

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;

      const newFiles: UploadFile[] = [];
      Array.from(fileList).forEach((file) => {
        const error = validateFile(file);
        newFiles.push({
          file,
          progress: 0,
          status: error ? 'error' : 'pending',
          error: error || undefined,
        });
      });

      setFiles((prev) => [...prev, ...newFiles]);

      // Auto-upload valid files
      const validFiles = newFiles.filter((f) => f.status === 'pending').map((f) => f.file);
      if (validFiles.length > 0) {
        uploadFiles(validFiles);
      }
    },
    [maxSize, acceptedTypes]
  );

  const uploadFiles = async (filesToUpload: File[]) => {
    try {
      setFiles((prev) =>
        prev.map((f) =>
          filesToUpload.includes(f.file) ? { ...f, status: 'uploading', progress: 50 } : f
        )
      );

      await onUpload(filesToUpload);

      setFiles((prev) =>
        prev.map((f) =>
          filesToUpload.includes(f.file) ? { ...f, status: 'success', progress: 100 } : f
        )
      );
    } catch (error: any) {
      setFiles((prev) =>
        prev.map((f) =>
          filesToUpload.includes(f.file)
            ? { ...f, status: 'error', error: error.message || 'Upload failed' }
            : f
        )
      );
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragging
            ? 'border-blue-600 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-white'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-sm text-gray-600">
            <span className="font-semibold text-blue-600 hover:text-blue-700">
              Click to upload
            </span>{' '}
            or drag and drop
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {acceptedTypes.includes('application/pdf') && 'PDF, '}
            {acceptedTypes.includes('image/jpeg') && 'JPEG, '}
            {acceptedTypes.includes('image/png') && 'PNG '}
            up to {maxSize}MB
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">
              {files.length} {files.length === 1 ? 'file' : 'files'}
            </h3>
            <button
              onClick={clearAll}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>

          <div className="divide-y divide-gray-200">
            {files.map((uploadFile, index) => (
              <div key={index} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <File className="flex-shrink-0 h-5 w-5 text-gray-400" />
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadFile.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(uploadFile.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center ml-4">
                    {uploadFile.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {uploadFile.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    {uploadFile.status === 'uploading' && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {uploadFile.error && (
                  <p className="mt-1 text-xs text-red-600">{uploadFile.error}</p>
                )}

                {/* Progress Bar */}
                {uploadFile.status === 'uploading' && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${uploadFile.progress}%` }}
                     />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
