/**
 * @fileoverview DocumentViewer Component - PDF and Image viewer with controls
 * Air Niugini branded document viewer with zoom, download, and print functionality
 *
 * Features:
 * - PDF document viewing
 * - Image viewing with zoom
 * - Download and print functionality
 * - Responsive design
 * - Air Niugini themed UI
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-01
 */

'use client';

import { useState, useEffect } from 'react';
import { Download, Printer, ZoomIn, ZoomOut, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface DocumentViewerProps {
  documentUrl: string;
  documentName: string;
  documentType: string; // MIME type
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

// =============================================================================
// DOCUMENT VIEWER COMPONENT
// =============================================================================

export function DocumentViewer({
  documentUrl,
  documentName,
  documentType,
  isOpen,
  onClose,
  className,
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPDF = documentType === 'application/pdf';
  const isImage = documentType.startsWith('image/');

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setZoom(100);
      setIsLoading(true);
      setError(null);
    }
  }, [isOpen]);

  // Handle zoom in
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  // Handle download
  const handleDownload = async () => {
    try {
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = documentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  // Handle print
  const handlePrint = () => {
    const printWindow = window.open(documentUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      toast.error('Failed to open print dialog');
    }
  };

  // Handle load error
  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load document');
  };

  // Handle load success
  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn('max-w-6xl h-[90vh] p-0', className)}>
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPDF ? (
                <FileText className="w-5 h-5 text-[#E4002B]" />
              ) : (
                <ImageIcon className="w-5 h-5 text-[#E4002B]" />
              )}
              <DialogTitle className="text-lg font-semibold truncate max-w-md">
                {documentName}
              </DialogTitle>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls (for images only) */}
              {isImage && (
                <>
                  <Button
                    onClick={handleZoomOut}
                    variant="ghost"
                    size="sm"
                    disabled={zoom <= 50}
                    className="hover:bg-gray-100"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                    {zoom}%
                  </span>
                  <Button
                    onClick={handleZoomIn}
                    variant="ghost"
                    size="sm"
                    disabled={zoom >= 200}
                    className="hover:bg-gray-100"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <div className="w-px h-6 bg-gray-300 mx-2" />
                </>
              )}

              {/* Download Button */}
              <Button
                onClick={handleDownload}
                variant="ghost"
                size="sm"
                className="hover:bg-gray-100"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>

              {/* Print Button */}
              <Button
                onClick={handlePrint}
                variant="ghost"
                size="sm"
                className="hover:bg-gray-100"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>

              <div className="w-px h-6 bg-gray-300 mx-2" />

              {/* Close Button */}
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {isLoading && !error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 border-4 border-[#E4002B] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-gray-600">Loading document...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-red-600 font-semibold">{error}</p>
                <Button
                  onClick={() => {
                    setIsLoading(true);
                    setError(null);
                  }}
                  variant="outline"
                  className="border-[#E4002B] text-[#E4002B] hover:bg-red-50"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* PDF Viewer */}
          {isPDF && !error && (
            <div className="flex justify-center">
              <iframe
                src={documentUrl}
                className="w-full h-[calc(90vh-8rem)] bg-white rounded-lg shadow-lg"
                onLoad={handleLoad}
                onError={handleError}
                title={documentName}
              />
            </div>
          )}

          {/* Image Viewer */}
          {isImage && !error && (
            <div className="flex justify-center items-center h-full">
              <img
                src={documentUrl}
                alt={documentName}
                className="max-w-full h-auto rounded-lg shadow-lg bg-white"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease-in-out',
                }}
                onLoad={handleLoad}
                onError={handleError}
              />
            </div>
          )}

          {/* Unsupported Document Type */}
          {!isPDF && !isImage && !error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <FileText className="w-16 h-16 text-gray-400 mx-auto" />
                <p className="text-gray-600">
                  Preview not available for this document type
                </p>
                <Button
                  onClick={handleDownload}
                  className="bg-[#E4002B] hover:bg-[#C00020] text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download to View
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
