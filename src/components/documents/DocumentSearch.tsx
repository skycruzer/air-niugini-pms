/**
 * @fileoverview DocumentSearch Component - Search and filter documents
 * Advanced search with multiple filters and sorting options
 *
 * Features:
 * - Full-text search by filename, document type, pilot
 * - Multiple filter options (type, status, expiry)
 * - Sort by date, name, expiry
 * - Export and bulk actions
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-01
 */

'use client';

import { useState } from 'react';
import { Search, Filter, X, SortAsc, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface SearchFilters {
  query: string;
  documentType: string;
  status: string;
  verificationStatus: string;
  expiryFilter: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface DocumentSearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  onClearFilters: () => void;
  resultCount?: number;
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DOCUMENT_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'LICENSE', label: 'License' },
  { value: 'MEDICAL', label: 'Medical Certificate' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'TRAINING', label: 'Training Certificate' },
  { value: 'EMERGENCY_CONTACT', label: 'Emergency Contact' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'VISA', label: 'Visa' },
  { value: 'ID_CARD', label: 'ID Card' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'OTHER', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'expired', label: 'Expired' },
];

const VERIFICATION_OPTIONS = [
  { value: 'all', label: 'All Verification' },
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
];

const EXPIRY_OPTIONS = [
  { value: 'all', label: 'All Documents' },
  { value: 'expiring_7', label: 'Expiring in 7 days' },
  { value: 'expiring_30', label: 'Expiring in 30 days' },
  { value: 'expiring_90', label: 'Expiring in 90 days' },
  { value: 'expired', label: 'Expired' },
];

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Upload Date' },
  { value: 'document_name', label: 'Name' },
  { value: 'expiry_date', label: 'Expiry Date' },
  { value: 'document_type', label: 'Type' },
];

// =============================================================================
// DOCUMENT SEARCH COMPONENT
// =============================================================================

export function DocumentSearch({
  filters,
  onFiltersChange,
  onSearch,
  onClearFilters,
  resultCount,
  className,
}: DocumentSearchProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Count active filters
  const activeFiltersCount = [
    filters.documentType !== 'all',
    filters.status !== 'all',
    filters.verificationStatus !== 'all',
    filters.expiryFilter !== 'all',
  ].filter(Boolean).length;

  // Handle filter change
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  // Handle clear all filters
  const handleClearAll = () => {
    onClearFilters();
    setIsFilterOpen(false);
  };

  // Handle search on Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by pilot name, document name, or number..."
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 pr-4 h-12 text-base"
          />
        </div>

        <Button
          onClick={onSearch}
          className="h-12 px-6 bg-[#E4002B] hover:bg-[#C00020] text-white"
        >
          <Search className="w-5 h-5 mr-2" />
          Search
        </Button>

        {/* Advanced Filters Button */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'h-12 px-6 border-2',
                activeFiltersCount > 0 && 'border-[#E4002B] text-[#E4002B]'
              )}
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-[#E4002B] text-white">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b">
                <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
                {activeFiltersCount > 0 && (
                  <Button
                    onClick={handleClearAll}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Document Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Document Type
                </label>
                <Select
                  value={filters.documentType}
                  onValueChange={(value) => handleFilterChange('documentType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Verification Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Verification
                </label>
                <Select
                  value={filters.verificationStatus}
                  onValueChange={(value) =>
                    handleFilterChange('verificationStatus', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Expiry Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Expiry Status
                </label>
                <Select
                  value={filters.expiryFilter}
                  onValueChange={(value) => handleFilterChange('expiryFilter', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Apply Filters Button */}
              <Button
                onClick={() => {
                  onSearch();
                  setIsFilterOpen(false);
                }}
                className="w-full bg-[#E4002B] hover:bg-[#C00020] text-white"
              >
                Apply Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Sort and Results Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <SortAsc className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Sort by:</span>
            <Select
              value={filters.sortBy}
              onValueChange={(value) => handleFilterChange('sortBy', value)}
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() =>
                handleFilterChange(
                  'sortOrder',
                  filters.sortOrder === 'asc' ? 'desc' : 'asc'
                )
              }
              variant="outline"
              size="sm"
              className="h-9"
            >
              {filters.sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        {/* Results Count */}
        {resultCount !== undefined && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span>
              {resultCount} {resultCount === 1 ? 'document' : 'documents'} found
            </span>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          {filters.documentType !== 'all' && (
            <Badge
              variant="outline"
              className="gap-1 cursor-pointer hover:bg-gray-100"
              onClick={() => handleFilterChange('documentType', 'all')}
            >
              Type: {DOCUMENT_TYPES.find((t) => t.value === filters.documentType)?.label}
              <X className="w-3 h-3" />
            </Badge>
          )}
          {filters.status !== 'all' && (
            <Badge
              variant="outline"
              className="gap-1 cursor-pointer hover:bg-gray-100"
              onClick={() => handleFilterChange('status', 'all')}
            >
              Status: {STATUS_OPTIONS.find((s) => s.value === filters.status)?.label}
              <X className="w-3 h-3" />
            </Badge>
          )}
          {filters.verificationStatus !== 'all' && (
            <Badge
              variant="outline"
              className="gap-1 cursor-pointer hover:bg-gray-100"
              onClick={() => handleFilterChange('verificationStatus', 'all')}
            >
              Verification:{' '}
              {
                VERIFICATION_OPTIONS.find((v) => v.value === filters.verificationStatus)
                  ?.label
              }
              <X className="w-3 h-3" />
            </Badge>
          )}
          {filters.expiryFilter !== 'all' && (
            <Badge
              variant="outline"
              className="gap-1 cursor-pointer hover:bg-gray-100"
              onClick={() => handleFilterChange('expiryFilter', 'all')}
            >
              Expiry: {EXPIRY_OPTIONS.find((e) => e.value === filters.expiryFilter)?.label}
              <X className="w-3 h-3" />
            </Badge>
          )}
          <Button
            onClick={handleClearAll}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
