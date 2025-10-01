'use client';

import { PilotWithCertifications } from '@/lib/pilot-service-client';
import { useAuth } from '@/contexts/AuthContext';
import { permissions } from '@/lib/auth-utils';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface PilotTableViewProps {
  pilots: PilotWithCertifications[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onQuickView?: (id: string) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  searchResults?: Map<string, any>;
  sortField?: any;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: any) => void;
}

export function PilotTableView({
  pilots,
  onView,
  onEdit,
  onQuickView,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  searchResults,
  sortField,
  sortDirection,
  onSort,
}: PilotTableViewProps) {
  const { user } = useAuth();

  const allSelected = pilots.length > 0 && pilots.every((p) => selectedIds?.has(p.id));
  const someSelected = pilots.some((p) => selectedIds?.has(p.id)) && !allSelected;

  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <span className="text-gray-400">⇅</span>;
    }
    return sortDirection === 'asc' ? (
      <span className="text-[#E4002B]">↑</span>
    ) : (
      <span className="text-[#E4002B]">↓</span>
    );
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02,
      },
    },
  };

  const row = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {onToggleSelectAll && (
                <th scope="col" className="w-12 px-4 py-3">
                  <label className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = someSelected;
                      }}
                      onChange={onToggleSelectAll}
                      className="w-5 h-5 text-[#E4002B] border-gray-300 rounded focus:ring-[#E4002B] cursor-pointer"
                      aria-label="Select all pilots"
                    />
                  </label>
                </th>
              )}
              <th scope="col" className="px-4 py-3 text-left">
                <button
                  onClick={() => onSort?.('first_name')}
                  className="flex items-center space-x-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-[#E4002B] transition-colors"
                >
                  <span>Name</span>
                  {renderSortIcon('first_name')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <button
                  onClick={() => onSort?.('employee_id')}
                  className="flex items-center space-x-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-[#E4002B] transition-colors"
                >
                  <span>Employee ID</span>
                  {renderSortIcon('employee_id')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <button
                  onClick={() => onSort?.('role')}
                  className="flex items-center space-x-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-[#E4002B] transition-colors"
                >
                  <span>Role</span>
                  {renderSortIcon('role')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                <button
                  onClick={() => onSort?.('seniority_number')}
                  className="flex items-center justify-center space-x-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-[#E4002B] transition-colors w-full"
                >
                  <span>Seniority</span>
                  {renderSortIcon('seniority_number')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Contract
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Certifications
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <motion.tbody
            variants={container}
            initial="hidden"
            animate="show"
            className="bg-white divide-y divide-gray-200"
          >
            {pilots.map((pilot) => (
              <PilotTableRow
                key={pilot.id}
                pilot={pilot}
                onView={onView}
                onEdit={onEdit}
                onQuickView={onQuickView}
                isSelected={selectedIds?.has(pilot.id)}
                onToggleSelect={onToggleSelect}
                searchMatches={searchResults?.get(pilot.id)}
                variants={row}
              />
            ))}
          </motion.tbody>
        </table>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden divide-y divide-gray-200">
        <motion.div variants={container} initial="hidden" animate="show">
          {pilots.map((pilot) => (
            <PilotTableRowMobile
              key={pilot.id}
              pilot={pilot}
              onView={onView}
              onEdit={onEdit}
              onQuickView={onQuickView}
              isSelected={selectedIds?.has(pilot.id)}
              onToggleSelect={onToggleSelect}
              searchMatches={searchResults?.get(pilot.id)}
              variants={row}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

interface PilotTableRowProps {
  pilot: PilotWithCertifications;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onQuickView?: (id: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  searchMatches?: any;
  variants?: any;
}

function PilotTableRow({
  pilot,
  onView,
  onEdit,
  onQuickView,
  isSelected,
  onToggleSelect,
  searchMatches,
  variants,
}: PilotTableRowProps) {
  const { user } = useAuth();

  const statusIcon =
    pilot.certificationStatus.expired > 0 ? (
      <span className="text-red-600">⚠️</span>
    ) : pilot.certificationStatus.expiring > 0 ? (
      <span className="text-yellow-600">⏰</span>
    ) : (
      <span className="text-green-600">✅</span>
    );

  const rowClasses = `
    hover:bg-gray-50 cursor-pointer transition-colors
    ${isSelected ? 'bg-red-50' : ''}
  `.trim();

  return (
    <motion.tr variants={variants} className={rowClasses} onClick={() => onQuickView?.(pilot.id)}>
      {onToggleSelect && (
        <td className="px-4 py-4">
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
        </td>
      )}
      <td className="px-4 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#E4002B] to-[#C00020] rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {pilot.first_name[0]}
            {pilot.last_name[0]}
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {pilot.first_name} {pilot.middle_name && `${pilot.middle_name} `}
              {pilot.last_name}
            </div>
            {pilot.email && <div className="text-sm text-gray-500">{pilot.email}</div>}
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-gray-900">{pilot.employee_id}</td>
      <td className="px-4 py-4 text-sm text-gray-900">{pilot.role}</td>
      <td className="px-4 py-4 text-center">
        <span className="text-sm font-medium text-gray-900">
          {pilot.seniority_number ? `#${pilot.seniority_number}` : '-'}
        </span>
      </td>
      <td className="px-4 py-4 text-sm text-gray-600">{pilot.contract_type || '-'}</td>
      <td className="px-4 py-4 text-center">
        {pilot.is_active ? (
          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Active</span>
        ) : (
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Inactive</span>
        )}
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center justify-center space-x-2">
          {statusIcon}
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-green-600 font-medium">{pilot.certificationStatus.current}</span>
            {pilot.certificationStatus.expiring > 0 && (
              <span className="text-yellow-600 font-medium">
                {pilot.certificationStatus.expiring}
              </span>
            )}
            {pilot.certificationStatus.expired > 0 && (
              <span className="text-red-600 font-medium">{pilot.certificationStatus.expired}</span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex items-center justify-end space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(pilot.id);
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="View full details"
            aria-label={`View details for ${pilot.first_name} ${pilot.last_name}`}
          >
            <span>👁️</span>
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
              <span>✏️</span>
            </button>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

function PilotTableRowMobile({
  pilot,
  onView,
  onEdit,
  onQuickView,
  isSelected,
  onToggleSelect,
  searchMatches,
  variants,
}: PilotTableRowProps) {
  const { user } = useAuth();

  const statusIcon =
    pilot.certificationStatus.expired > 0 ? (
      <span className="text-red-600">⚠️</span>
    ) : pilot.certificationStatus.expiring > 0 ? (
      <span className="text-yellow-600">⏰</span>
    ) : (
      <span className="text-green-600">✅</span>
    );

  return (
    <motion.div
      variants={variants}
      className={`p-4 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-red-50' : ''}`}
      onClick={() => onQuickView?.(pilot.id)}
    >
      <div className="flex items-start space-x-3">
        {onToggleSelect && (
          <label className="cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect(pilot.id);
              }}
              className="w-5 h-5 text-[#E4002B] border-gray-300 rounded focus:ring-[#E4002B]"
            />
          </label>
        )}

        <div className="w-10 h-10 bg-gradient-to-br from-[#E4002B] to-[#C00020] rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          {pilot.first_name[0]}
          {pilot.last_name[0]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-semibold text-gray-900 truncate">
                {pilot.first_name} {pilot.last_name}
              </h4>
              <p className="text-sm text-gray-600">{pilot.employee_id}</p>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView(pilot.id);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                👁️
              </button>
              {permissions.canEdit(user) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(pilot.id);
                  }}
                  className="p-2 text-blue-400 hover:text-blue-600 rounded-lg"
                >
                  ✏️
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Role:</span>
              <span className="ml-1 text-gray-900">{pilot.role}</span>
            </div>
            <div>
              <span className="text-gray-500">Seniority:</span>
              <span className="ml-1 text-gray-900">
                {pilot.seniority_number ? `#${pilot.seniority_number}` : '-'}
              </span>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {statusIcon}
              <span className="text-sm">
                <span className="text-green-600 font-medium">
                  {pilot.certificationStatus.current}
                </span>
                {pilot.certificationStatus.expiring > 0 && (
                  <span className="text-yellow-600 font-medium ml-1">
                    {pilot.certificationStatus.expiring}
                  </span>
                )}
                {pilot.certificationStatus.expired > 0 && (
                  <span className="text-red-600 font-medium ml-1">
                    {pilot.certificationStatus.expired}
                  </span>
                )}
              </span>
            </div>
            {pilot.is_active ? (
              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                Active
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                Inactive
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
