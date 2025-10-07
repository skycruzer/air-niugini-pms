/**
 * AUDIT LOG FILTERS COMPONENT
 *
 * Advanced filtering interface for audit logs with Air Niugini branding.
 * Supports filtering by user, table, action, date range, and search.
 *
 * Features:
 * - Multi-select filters
 * - Date range picker
 * - Quick filter presets (last 7/30/90 days)
 * - Search functionality
 * - Clear all filters
 * - Real-time filter updates
 *
 * Part of Phase 4.2: Comprehensive Audit Logging UI
 */

'use client';

import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { AuditLogFilters as Filters } from '@/lib/audit-log-service';

interface AuditLogFiltersProps {
  users: { email: string; role: string }[];
  tables: string[];
  onFiltersChange: (filters: Filters) => void;
  isLoading?: boolean;
}

const ACTIONS = ['INSERT', 'UPDATE', 'DELETE', 'RESTORE', 'SOFT_DELETE'];

const DATE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'All time', days: null },
];

export function AuditLogFilters({
  users,
  tables,
  onFiltersChange,
  isLoading,
}: AuditLogFiltersProps) {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(7);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Apply filters whenever any filter changes
  useEffect(() => {
    const filters: Filters = {};

    if (selectedUser) {
      filters.userEmail = selectedUser;
    }

    if (selectedTable) {
      filters.tableName = selectedTable;
    }

    if (selectedAction) {
      filters.action = selectedAction;
    }

    if (searchQuery) {
      filters.searchQuery = searchQuery;
    }

    // Date range logic
    if (selectedPreset !== null) {
      filters.startDate = subDays(new Date(), selectedPreset);
      filters.endDate = new Date();
    } else if (customStartDate || customEndDate) {
      if (customStartDate) {
        filters.startDate = new Date(customStartDate);
      }
      if (customEndDate) {
        filters.endDate = new Date(customEndDate);
      }
    }

    onFiltersChange(filters);
  }, [
    selectedUser,
    selectedTable,
    selectedAction,
    searchQuery,
    selectedPreset,
    customStartDate,
    customEndDate,
    onFiltersChange,
  ]);

  const handleClearFilters = () => {
    setSelectedUser('');
    setSelectedTable('');
    setSelectedAction('');
    setSearchQuery('');
    setSelectedPreset(7);
    setCustomStartDate('');
    setCustomEndDate('');
    setShowAdvanced(false);
  };

  const handlePresetChange = (days: number | null) => {
    setSelectedPreset(days);
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const hasActiveFilters = !!(
    selectedUser ||
    selectedTable ||
    selectedAction ||
    searchQuery ||
    customStartDate ||
    customEndDate
  );

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="mr-2">🔍</span>
            Filter Audit Logs
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Apply filters to narrow down audit log results
          </p>
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm font-medium text-[#E4002B] hover:text-[#C00020] transition-colors flex items-center"
          >
            <span className="mr-1">✖️</span>
            Clear All
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div>
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
          Search Description
        </label>
        <input
          type="text"
          id="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search in description..."
          className="input w-full"
          disabled={isLoading}
        />
      </div>

      {/* Date Range Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePresetChange(preset.days)}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                selectedPreset === preset.days
                  ? 'bg-[#E4002B] text-white border-[#E4002B] shadow-md'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* User Filter */}
        <div>
          <label htmlFor="user-filter" className="block text-sm font-medium text-gray-700 mb-2">
            User
          </label>
          <select
            id="user-filter"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="input w-full"
            disabled={isLoading}
          >
            <option value="">All Users</option>
            {users.map((user) => (
              <option key={user.email} value={user.email}>
                {user.email} ({user.role})
              </option>
            ))}
          </select>
        </div>

        {/* Table Filter */}
        <div>
          <label htmlFor="table-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Table
          </label>
          <select
            id="table-filter"
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="input w-full"
            disabled={isLoading}
          >
            <option value="">All Tables</option>
            {tables.map((table) => (
              <option key={table} value={table}>
                {table}
              </option>
            ))}
          </select>
        </div>

        {/* Action Filter */}
        <div>
          <label htmlFor="action-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Action
          </label>
          <select
            id="action-filter"
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="input w-full"
            disabled={isLoading}
          >
            <option value="">All Actions</option>
            {ACTIONS.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-sm font-medium text-[#E4002B] hover:text-[#C00020] transition-colors"
        >
          <span className="mr-2">{showAdvanced ? '▲' : '▼'}</span>
          {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="pt-4 border-t border-gray-200 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">Custom Date Range</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="start-date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setSelectedPreset(null);
                }}
                max={customEndDate || format(new Date(), 'yyyy-MM-dd')}
                className="input w-full"
                disabled={isLoading}
              />
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="end-date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setSelectedPreset(null);
                }}
                min={customStartDate}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="input w-full"
                disabled={isLoading}
              />
            </div>
          </div>

          {(customStartDate || customEndDate) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Custom range active:</span>{' '}
                {customStartDate && format(new Date(customStartDate), 'MMM dd, yyyy')}
                {customStartDate && customEndDate && ' - '}
                {customEndDate && format(new Date(customEndDate), 'MMM dd, yyyy')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900">Active Filters</h4>
            <span className="text-xs font-medium text-gray-500">
              {
                [
                  selectedUser,
                  selectedTable,
                  selectedAction,
                  searchQuery,
                  customStartDate,
                  customEndDate,
                ].filter(Boolean).length
              }{' '}
              active
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedUser && (
              <span className="inline-flex items-center px-3 py-1 bg-[#E4002B]/10 text-[#E4002B] rounded-full text-xs font-medium border border-[#E4002B]/30">
                User: {selectedUser}
                <button
                  onClick={() => setSelectedUser('')}
                  className="ml-2 text-[#E4002B] hover:text-[#C00020]"
                >
                  ✕
                </button>
              </span>
            )}

            {selectedTable && (
              <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium border border-blue-300">
                Table: {selectedTable}
                <button
                  onClick={() => setSelectedTable('')}
                  className="ml-2 text-blue-800 hover:text-blue-900"
                >
                  ✕
                </button>
              </span>
            )}

            {selectedAction && (
              <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium border border-green-300">
                Action: {selectedAction}
                <button
                  onClick={() => setSelectedAction('')}
                  className="ml-2 text-green-800 hover:text-green-900"
                >
                  ✕
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium border border-purple-300">
                Search: &quot;{searchQuery}&quot;
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-2 text-purple-800 hover:text-purple-900"
                >
                  ✕
                </button>
              </span>
            )}

            {(customStartDate || customEndDate) && (
              <span className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium border border-amber-300">
                Custom Date Range
                <button
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                    setSelectedPreset(7);
                  }}
                  className="ml-2 text-amber-800 hover:text-amber-900"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
