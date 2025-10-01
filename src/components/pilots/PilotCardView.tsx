'use client';

import { PilotWithCertifications } from '@/lib/pilot-service-client';
import { useAuth } from '@/contexts/AuthContext';
import { permissions } from '@/lib/auth-utils';
import { motion } from 'framer-motion';

interface PilotCardViewProps {
  pilots: PilotWithCertifications[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onQuickView?: (id: string) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  searchResults?: Map<string, any>;
}

export function PilotCardView({
  pilots,
  onView,
  onEdit,
  onQuickView,
  selectedIds,
  onToggleSelect,
  searchResults,
}: PilotCardViewProps) {
  const { user } = useAuth();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6"
    >
      {pilots.map((pilot) => (
        <PilotCard
          key={pilot.id}
          pilot={pilot}
          onView={onView}
          onEdit={onEdit}
          onQuickView={onQuickView}
          isSelected={selectedIds?.has(pilot.id)}
          onToggleSelect={onToggleSelect}
          searchMatches={searchResults?.get(pilot.id)}
          variants={item}
        />
      ))}
    </motion.div>
  );
}

interface PilotCardProps {
  pilot: PilotWithCertifications;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onQuickView?: (id: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  searchMatches?: any;
  variants?: any;
}

function PilotCard({
  pilot,
  onView,
  onEdit,
  onQuickView,
  isSelected,
  onToggleSelect,
  searchMatches,
  variants,
}: PilotCardProps) {
  const { user } = useAuth();

  const statusColor =
    pilot.certificationStatus.expired > 0
      ? 'text-red-600'
      : pilot.certificationStatus.expiring > 0
        ? 'text-yellow-600'
        : 'text-green-600';

  const statusIcon =
    pilot.certificationStatus.expired > 0 ? (
      <span className="text-red-600" aria-label="Has expired certifications">
        ⚠️
      </span>
    ) : pilot.certificationStatus.expiring > 0 ? (
      <span className="text-yellow-600" aria-label="Has expiring certifications">
        ⏰
      </span>
    ) : (
      <span className="text-green-600" aria-label="All certifications current">
        ✅
      </span>
    );

  const cardClasses = `
    mobile-card lg:p-6 hover:shadow-lg transition-all duration-200 cursor-pointer
    ${isSelected ? 'ring-2 ring-[#E4002B] bg-red-50' : ''}
  `.trim();

  return (
    <motion.article
      variants={variants}
      className={cardClasses}
      role="article"
      aria-labelledby={`pilot-${pilot.id}-name`}
      onClick={() => onQuickView?.(pilot.id)}
    >
      {/* Selection Checkbox */}
      {onToggleSelect && (
        <div className="flex items-start mb-3">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect(pilot.id);
              }}
              className="w-5 h-5 text-[#E4002B] border-gray-300 rounded focus:ring-[#E4002B] cursor-pointer"
              aria-label={`Select ${pilot.first_name} ${pilot.last_name}`}
            />
          </label>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Avatar */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#E4002B] to-[#C00020] rounded-full flex items-center justify-center text-white text-xl flex-shrink-0">
              {pilot.first_name[0]}
              {pilot.last_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                <h3
                  className="mobile-subheading lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-0 truncate"
                  id={`pilot-${pilot.id}-name`}
                >
                  {pilot.first_name} {pilot.middle_name && `${pilot.middle_name} `}
                  {pilot.last_name}
                </h3>
                {!pilot.is_active && (
                  <span
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full self-start"
                    aria-label="Pilot status: Inactive"
                  >
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-2">🆔</span>
              <span className="font-medium">ID:</span>
              <span className="ml-2">{pilot.employee_id}</span>
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-2">👤</span>
              <span className="font-medium">Role:</span>
              <span className="ml-2">{pilot.role}</span>
            </div>

            {pilot.contract_type && (
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">📄</span>
                <span className="font-medium">Contract:</span>
                <span className="ml-2">{pilot.contract_type}</span>
              </div>
            )}

            {pilot.seniority_number && (
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">🏆</span>
                <span className="font-medium">Seniority:</span>
                <span className="ml-2">#{pilot.seniority_number}</span>
              </div>
            )}
          </div>

          {/* Certification Status */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              {statusIcon}
              <span className="text-sm font-semibold text-gray-700">Certifications</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center space-x-1">
                <span className={`text-sm font-medium ${statusColor}`}>
                  {pilot.certificationStatus.current} Current
                </span>
              </div>
              {pilot.certificationStatus.expiring > 0 && (
                <span className="text-sm text-yellow-600 font-medium">
                  {pilot.certificationStatus.expiring} Expiring
                </span>
              )}
              {pilot.certificationStatus.expired > 0 && (
                <span className="text-sm text-red-600 font-medium">
                  {pilot.certificationStatus.expired} Expired
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(pilot.id);
          }}
          className="px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center space-x-1"
          title="View full details"
          aria-label={`View full details for ${pilot.first_name} ${pilot.last_name}`}
        >
          <span aria-hidden="true">👁️</span>
          <span>View</span>
        </button>

        {permissions.canEdit(user) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(pilot.id);
            }}
            className="px-3 py-2 text-sm text-white bg-[#E4002B] hover:bg-[#C00020] rounded-lg transition-colors flex items-center space-x-1"
            title="Edit pilot information"
            aria-label={`Edit ${pilot.first_name} ${pilot.last_name}`}
          >
            <span aria-hidden="true">✏️</span>
            <span>Edit</span>
          </button>
        )}
      </div>
    </motion.article>
  );
}
