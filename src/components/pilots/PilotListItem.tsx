'use client'

import { PilotWithCertifications } from '@/lib/pilot-service-client'
import { useAuth } from '@/contexts/AuthContext'
import { permissions } from '@/lib/auth-utils'

interface PilotListItemProps {
  pilot: PilotWithCertifications
  onView: (id: string) => void
  onEdit: (id: string) => void
}

export function PilotListItem({ pilot, onView, onEdit }: PilotListItemProps) {
  const { user } = useAuth()

  const statusColor = pilot.certificationStatus.expired > 0
    ? 'text-red-600'
    : pilot.certificationStatus.expiring > 0
    ? 'text-yellow-600'
    : 'text-green-600'

  const statusIcon = pilot.certificationStatus.expired > 0
    ? <span className="text-red-600" aria-label="Has expired certifications">⚠️</span>
    : pilot.certificationStatus.expiring > 0
    ? <span className="text-yellow-600" aria-label="Has expiring certifications">⏰</span>
    : <span className="text-green-600" aria-label="All certifications current">✅</span>

  const statusBadge = pilot.certificationStatus.expired > 0
    ? <span className="status-expired">Expired</span>
    : pilot.certificationStatus.expiring > 0
    ? <span className="status-expiring">Expiring</span>
    : <span className="status-current">Current</span>

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      role="article"
      aria-labelledby={`pilot-${pilot.id}-name`}
    >
      {/* Mobile/Tablet Stack Layout */}
      <div className="block md:hidden space-y-3">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              {/* Avatar Placeholder */}
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 flex-shrink-0">
                <span className="text-lg" aria-hidden="true">👨‍✈️</span>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="mobile-subheading text-gray-900 truncate" id={`pilot-${pilot.id}-name`}>
                  {pilot.first_name} {pilot.middle_name && `${pilot.middle_name} `}{pilot.last_name}
                </h3>
                <p className="text-sm text-gray-500">{pilot.employee_id}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 ml-3">
            <button
              onClick={() => onView(pilot.id)}
              className="touch-target p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="View pilot details"
              aria-label={`View details for ${pilot.first_name} ${pilot.last_name}`}
            >
              <span aria-hidden="true">👁️</span>
            </button>

            {permissions.canEdit(user) && (
              <button
                onClick={() => onEdit(pilot.id)}
                className="touch-target p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit pilot information"
                aria-label={`Edit ${pilot.first_name} ${pilot.last_name}`}
              >
                <span aria-hidden="true">✏️</span>
              </button>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Role:</span>
            <div className="text-gray-900">{pilot.role}</div>
          </div>

          <div>
            <span className="font-medium text-gray-700">Seniority:</span>
            <div className="text-gray-900">
              {pilot.seniority_number ? `#${pilot.seniority_number}` : 'N/A'}
            </div>
          </div>

          <div>
            <span className="font-medium text-gray-700">Status:</span>
            <div className="flex items-center space-x-2">
              {!pilot.is_active && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  Inactive
                </span>
              )}
              {pilot.is_active && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">
                  Active
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="font-medium text-gray-700">Certifications:</span>
            <div className="flex items-center space-x-2">
              {statusIcon}
              {statusBadge}
            </div>
          </div>
        </div>

        {/* Certification Details */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex flex-wrap gap-2 text-sm">
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

      {/* Desktop Table Layout */}
      <div className="hidden md:grid md:grid-cols-8 md:gap-4 md:items-center">
        {/* Photo */}
        <div className="flex items-center justify-center">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
            <span className="text-lg" aria-hidden="true">👨‍✈️</span>
          </div>
        </div>

        {/* Name */}
        <div className="col-span-2">
          <h3 className="font-semibold text-gray-900 truncate" id={`pilot-${pilot.id}-name`}>
            {pilot.first_name} {pilot.middle_name && `${pilot.middle_name} `}{pilot.last_name}
          </h3>
          <p className="text-sm text-gray-500">{pilot.employee_id}</p>
        </div>

        {/* Role */}
        <div>
          <span className="text-sm text-gray-900">{pilot.role}</span>
          {pilot.contract_type && (
            <p className="text-xs text-gray-500">{pilot.contract_type}</p>
          )}
        </div>

        {/* Seniority */}
        <div className="text-center">
          <span className="text-sm font-medium text-gray-900">
            {pilot.seniority_number ? `#${pilot.seniority_number}` : 'N/A'}
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-center">
          {!pilot.is_active ? (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              Inactive
            </span>
          ) : (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">
              Active
            </span>
          )}
        </div>

        {/* Certification Status */}
        <div className="flex items-center justify-center space-x-2">
          {statusIcon}
          {statusBadge}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => onView(pilot.id)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="View pilot details"
            aria-label={`View details for ${pilot.first_name} ${pilot.last_name}`}
          >
            <span aria-hidden="true">👁️</span>
          </button>

          {permissions.canEdit(user) && (
            <button
              onClick={() => onEdit(pilot.id)}
              className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit pilot information"
              aria-label={`Edit ${pilot.first_name} ${pilot.last_name}`}
            >
              <span aria-hidden="true">✏️</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}