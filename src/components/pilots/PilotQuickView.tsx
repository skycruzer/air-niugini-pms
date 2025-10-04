'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PilotWithCertifications } from '@/lib/pilot-service-client';
import { useAuth } from '@/contexts/AuthContext';
import { permissions } from '@/lib/auth-utils';
import { differenceInDays, format } from 'date-fns';

interface PilotQuickViewProps {
  pilotId: string | null;
  pilots: PilotWithCertifications[];
  onClose: () => void;
  onEdit: (id: string) => void;
  onViewFull: (id: string) => void;
}

export function PilotQuickView({
  pilotId,
  pilots,
  onClose,
  onEdit,
  onViewFull,
}: PilotQuickViewProps) {
  const { user } = useAuth();
  const [pilot, setPilot] = useState<PilotWithCertifications | null>(null);

  useEffect(() => {
    if (pilotId) {
      const foundPilot = pilots.find((p) => p.id === pilotId);
      setPilot(foundPilot || null);
    } else {
      setPilot(null);
    }
  }, [pilotId, pilots]);

  // Keyboard navigation
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pilotId) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [pilotId, onClose]);

  if (!pilot) return null;

  const statusColor =
    pilot.certificationStatus.expired > 0
      ? 'text-red-600'
      : pilot.certificationStatus.expiring > 0
        ? 'text-yellow-600'
        : 'text-green-600';

  const statusIcon =
    pilot.certificationStatus.expired > 0
      ? '⚠️'
      : pilot.certificationStatus.expiring > 0
        ? '⏰'
        : '✅';

  // Note: Detailed check information will be fetched separately
  // For now, we'll use the certification status summary
  const hasUpcomingExpirations =
    pilot.certificationStatus.expiring > 0 || pilot.certificationStatus.expired > 0;

  return (
    <AnimatePresence>
      {pilotId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] lg:w-[560px] bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-view-title"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#E4002B] to-[#C00020] text-white p-4 md:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl font-bold">
                    {pilot.first_name[0]}
                    {pilot.last_name[0]}
                  </div>
                  <div>
                    <h2 id="quick-view-title" className="text-xl md:text-2xl font-bold">
                      {pilot.first_name} {pilot.last_name}
                    </h2>
                    <p className="text-white text-opacity-90 text-sm">
                      {pilot.employee_id} • {pilot.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  aria-label="Close quick view"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>

              {/* Status Badge */}
              <div className="flex items-center space-x-2">
                {pilot.is_active ? (
                  <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full">
                    ✓ Active
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-500 text-white text-sm rounded-full">
                    Inactive
                  </span>
                )}
                {pilot.seniority_number && (
                  <span className="px-3 py-1 bg-[#FFC72C] text-gray-900 text-sm rounded-full font-semibold">
                    🏆 Seniority #{pilot.seniority_number}
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {/* Basic Information */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">📋</span>
                  Basic Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {pilot.email && (
                    <div className="flex items-center">
                      <span className="text-gray-500 w-32">Email:</span>
                      <span className="text-gray-900">{pilot.email}</span>
                    </div>
                  )}
                  {pilot.contract_type && (
                    <div className="flex items-center">
                      <span className="text-gray-500 w-32">Contract Type:</span>
                      <span className="text-gray-900">{pilot.contract_type}</span>
                    </div>
                  )}
                  {pilot.nationality && (
                    <div className="flex items-center">
                      <span className="text-gray-500 w-32">Nationality:</span>
                      <span className="text-gray-900">{pilot.nationality}</span>
                    </div>
                  )}
                  {pilot.commencement_date && (
                    <div className="flex items-center">
                      <span className="text-gray-500 w-32">Commenced:</span>
                      <span className="text-gray-900">
                        {format(new Date(pilot.commencement_date), 'dd MMM yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* Certification Status */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">{statusIcon}</span>
                  Certification Status
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {pilot.certificationStatus.current}
                    </div>
                    <div className="text-xs text-green-700 mt-1">Current</div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {pilot.certificationStatus.expiring}
                    </div>
                    <div className="text-xs text-yellow-700 mt-1">Expiring Soon</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {pilot.certificationStatus.expired}
                    </div>
                    <div className="text-xs text-red-700 mt-1">Expired</div>
                  </div>
                </div>
              </section>

              {/* Certification Alerts */}
              {hasUpcomingExpirations && (
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">⚠️</span>
                    Certification Alerts
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">⏰</div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">Action Required</p>
                        <p className="text-sm text-gray-700">
                          This pilot has {pilot.certificationStatus.expiring} certification(s)
                          expiring soon
                          {pilot.certificationStatus.expired > 0 &&
                            ` and ${pilot.certificationStatus.expired} expired certification(s)`}
                          .
                        </p>
                        <button
                          onClick={() => {
                            onViewFull(`${pilot.id}/certifications`);
                            onClose();
                          }}
                          className="mt-3 text-sm text-[#E4002B] hover:text-[#C00020] font-medium"
                        >
                          View All Certifications →
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 p-4 md:p-6 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    onViewFull(pilot.id);
                    onClose();
                  }}
                  className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>👁️</span>
                  <span>View Full Profile</span>
                </button>

                {permissions.canEdit(user) && (
                  <button
                    onClick={() => {
                      onEdit(pilot.id);
                      onClose();
                    }}
                    className="flex-1 px-4 py-3 bg-[#E4002B] text-white rounded-lg hover:bg-[#C00020] transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>✏️</span>
                    <span>Edit Pilot</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  onViewFull(`${pilot.id}/certifications`);
                  onClose();
                }}
                className="w-full mt-3 px-4 py-2 bg-[#FFC72C] text-gray-900 rounded-lg hover:bg-[#E6B329] transition-colors flex items-center justify-center space-x-2"
              >
                <span>📋</span>
                <span>Manage Certifications</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
