'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PilotWithCertifications } from '@/lib/pilot-service-client';
import { useAuth } from '@/contexts/AuthContext';
import { permissions } from '@/lib/auth-utils';
import { exportPilotsToCSV, PilotExportData } from '@/lib/export-utils';

interface BulkActionsBarProps {
  selectedIds: Set<string>;
  pilots: PilotWithCertifications[];
  onClearSelection: () => void;
  onDelete?: (ids: string[]) => Promise<void>;
  onUpdateStatus?: (ids: string[], isActive: boolean) => Promise<void>;
  onExport?: (pilots: PilotWithCertifications[]) => void;
}

export function BulkActionsBar({
  selectedIds,
  pilots,
  onClearSelection,
  onDelete,
  onUpdateStatus,
  onExport,
}: BulkActionsBarProps) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPilots = pilots.filter((p) => selectedIds.has(p.id));
  const selectedCount = selectedIds.size;

  if (selectedCount === 0) return null;

  const handleExportCSV = () => {
    try {
      const exportData = selectedPilots.map((pilot) => ({
        ...pilot,
        certificationStatus: {
          ...pilot.certificationStatus,
          total:
            pilot.certificationStatus.current +
            pilot.certificationStatus.expiring +
            pilot.certificationStatus.expired,
        },
      }));

      exportPilotsToCSV(exportData as PilotExportData[], true);
      onClearSelection();
    } catch (err) {
      setError('Failed to export pilots');
      console.error('Export error:', err);
    }
  };

  const handleExportExcel = () => {
    // Placeholder for Excel export
    alert('Excel export feature coming soon!');
  };

  const handleExportPDF = () => {
    // Placeholder for PDF export
    alert('PDF export feature coming soon!');
  };

  const handleActivate = async () => {
    if (!onUpdateStatus) return;

    try {
      setIsProcessing(true);
      setError(null);
      await onUpdateStatus(Array.from(selectedIds), true);
      onClearSelection();
    } catch (err) {
      setError('Failed to activate pilots');
      console.error('Activate error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeactivate = async () => {
    if (!onUpdateStatus) return;

    try {
      setIsProcessing(true);
      setError(null);
      await onUpdateStatus(Array.from(selectedIds), false);
      onClearSelection();
    } catch (err) {
      setError('Failed to deactivate pilots');
      console.error('Deactivate error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    try {
      setIsProcessing(true);
      setError(null);
      await onDelete(Array.from(selectedIds));
      setShowDeleteConfirm(false);
      onClearSelection();
    } catch (err) {
      setError('Failed to delete pilots');
      console.error('Delete error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-4xl px-4"
        >
          <div className="bg-white rounded-lg shadow-2xl border-2 border-[#E4002B] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#E4002B] to-[#C00020] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-bold">
                  {selectedCount}
                </div>
                <span className="font-semibold">
                  {selectedCount} {selectedCount === 1 ? 'pilot' : 'pilots'} selected
                </span>
              </div>
              <button
                onClick={onClearSelection}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                aria-label="Clear selection"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {/* Export Actions */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 font-medium">Export:</span>
                  <button
                    onClick={handleExportCSV}
                    disabled={isProcessing}
                    className="px-3 py-2 text-sm bg-green-50 text-green-700 border border-green-300 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    <span>📊</span>
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={handleExportExcel}
                    disabled={isProcessing}
                    className="px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    <span>📈</span>
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    disabled={isProcessing}
                    className="px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    <span>📄</span>
                    <span>PDF</span>
                  </button>
                </div>

                {/* Status Actions */}
                {permissions.canEdit(user) && onUpdateStatus && (
                  <div className="flex items-center space-x-2 border-l border-gray-300 pl-4">
                    <span className="text-sm text-gray-600 font-medium">Status:</span>
                    <button
                      onClick={handleActivate}
                      disabled={isProcessing}
                      className="px-3 py-2 text-sm bg-green-50 text-green-700 border border-green-300 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      <span>✓</span>
                      <span>Activate</span>
                    </button>
                    <button
                      onClick={handleDeactivate}
                      disabled={isProcessing}
                      className="px-3 py-2 text-sm bg-gray-50 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      <span>⏸</span>
                      <span>Deactivate</span>
                    </button>
                  </div>
                )}

                {/* Delete Action */}
                {permissions.canDelete(user) && onDelete && (
                  <div className="flex items-center border-l border-gray-300 pl-4 ml-auto">
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isProcessing}
                      className="px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      <span>🗑️</span>
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Selected Pilots Preview */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="font-medium">Selected:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedPilots.slice(0, 5).map((pilot) => (
                      <span
                        key={pilot.id}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {pilot.first_name} {pilot.last_name}
                      </span>
                    ))}
                    {selectedPilots.length > 5 && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-semibold">
                        +{selectedPilots.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Processing Indicator */}
              {isProcessing && (
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <div className="w-4 h-4 border-2 border-[#E4002B] border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">⚠️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Delete {selectedCount} {selectedCount === 1 ? 'Pilot' : 'Pilots'}?
                </h3>
                <p className="text-gray-600 mb-6">
                  This action cannot be undone. All pilot data including certifications and records
                  will be permanently deleted.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <span>🗑️</span>
                        <span>Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
