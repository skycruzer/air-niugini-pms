'use client';

import { PilotWithCertifications } from '@/lib/pilot-service-client';
import { useAuth } from '@/contexts/AuthContext';
import { permissions } from '@/lib/auth-utils';
import { motion } from 'framer-motion';

interface PilotListViewProps {
  pilots: PilotWithCertifications[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onQuickView?: (id: string) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  searchResults?: Map<string, any>;
}

export function PilotListView({
  pilots,
  onView,
  onEdit,
  onQuickView,
  selectedIds,
  onToggleSelect,
  searchResults,
}: PilotListViewProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
      {pilots.map((pilot) => (
        <PilotListItem
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

interface PilotListItemProps {
  pilot: PilotWithCertifications;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onQuickView?: (id: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  searchMatches?: any;
  variants?: any;
}

function PilotListItem({
  pilot,
  onView,
  onEdit,
  onQuickView,
  isSelected,
  onToggleSelect,
  searchMatches,
  variants,
}: PilotListItemProps) {
  const { user } = useAuth();

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

  const itemClasses = `
    bg-white border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-all duration-200 cursor-pointer
    ${isSelected ? 'ring-2 ring-[#E4002B] bg-red-50' : ''}
  `.trim();

  return (
    <motion.div
      variants={variants}
      className={itemClasses}
      role="article"
      aria-labelledby={`pilot-${pilot.id}-name`}
      onClick={() => onQuickView?.(pilot.id)}
    >
      <div className="flex items-center space-x-3 md:space-x-4">
        {/* Selection Checkbox */}
        {onToggleSelect && (
          <div className="flex items-center">
            <label className="cursor-pointer">
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

        {/* Avatar */}
        <div className="w-10 h-10 bg-gradient-to-br from-[#E4002B] to-[#C00020] rounded-full flex items-center justify-center text-white flex-shrink-0">
          <span className="text-sm font-semibold">
            {pilot.first_name[0]}
            {pilot.last_name[0]}
          </span>
        </div>

        {/* Pilot Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate" id={`pilot-${pilot.id}-name`}>
              {pilot.first_name} {pilot.middle_name && `${pilot.middle_name} `}
              {pilot.last_name}
            </h3>
            {!pilot.is_active && (
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                Inactive
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center space-x-1">
              <span>🆔</span>
              <span>{pilot.employee_id}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>👤</span>
              <span>{pilot.role}</span>
            </span>
            {pilot.seniority_number && (
              <span className="flex items-center space-x-1">
                <span>🏆</span>
                <span>#{pilot.seniority_number}</span>
              </span>
            )}
          </div>
        </div>

        {/* Certification Status */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {statusIcon}
            <div className="flex flex-col text-right">
              <span className="text-xs text-gray-500">Certifications</span>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-green-600 font-medium">
                  {pilot.certificationStatus.current}
                </span>
                {pilot.certificationStatus.expiring > 0 && (
                  <span className="text-yellow-600 font-medium">
                    {pilot.certificationStatus.expiring}
                  </span>
                )}
                {pilot.certificationStatus.expired > 0 && (
                  <span className="text-red-600 font-medium">
                    {pilot.certificationStatus.expired}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(pilot.id);
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="View full details"
            aria-label={`View details for ${pilot.first_name} ${pilot.last_name}`}
          >
            <span aria-hidden="true">👁️</span>
          </button>

          {permissions.canEdit(user) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(pilot.id);
              }}
              className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit pilot information"
              aria-label={`Edit ${pilot.first_name} ${pilot.last_name}`}
            >
              <span aria-hidden="true">✏️</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Certification Status */}
      <div className="md:hidden mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 flex items-center space-x-1">
            {statusIcon}
            <span>Certifications</span>
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-green-600 font-medium">
              {pilot.certificationStatus.current} Current
            </span>
            {pilot.certificationStatus.expiring > 0 && (
              <span className="text-yellow-600 font-medium">
                {pilot.certificationStatus.expiring} Expiring
              </span>
            )}
            {pilot.certificationStatus.expired > 0 && (
              <span className="text-red-600 font-medium">
                {pilot.certificationStatus.expired} Expired
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
