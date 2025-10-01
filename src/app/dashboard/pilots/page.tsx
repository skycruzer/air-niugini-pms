'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { permissions } from '@/lib/auth-utils';
import { getAllPilots, PilotWithCertifications } from '@/lib/pilot-service-client';
import {
  exportPilotsToCSV,
  exportComplianceReport,
  calculateAge,
  calculateYearsOfService,
  PilotExportData,
} from '@/lib/export-utils';
import { calculateRetirementInfo } from '@/lib/retirement-utils';
import { LazyPilotAddModal, LazyPilotEditModal } from '@/components/lazy';
import { LazyLoader } from '@/components/ui/LazyLoader';
import { PilotCardView } from '@/components/pilots/PilotCardView';
import { PilotListView } from '@/components/pilots/PilotListView';
import { PilotTableView } from '@/components/pilots/PilotTableView';
import { PilotQuickView } from '@/components/pilots/PilotQuickView';
import { BulkActionsBar } from '@/components/pilots/BulkActionsBar';
import { pilotSearchService, SearchResult } from '@/lib/search-service';
import { usePilotSort } from '@/hooks/usePilotSort';
import { AnimatePresence, motion } from 'framer-motion';

type ViewMode = 'card' | 'list' | 'table';

export default function PilotsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [pilots, setPilots] = useState<PilotWithCertifications[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult<PilotWithCertifications>[]>([]);
  const [filterRole, setFilterRole] = useState<'all' | 'Captain' | 'First Officer'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterCertStatus, setFilterCertStatus] = useState<
    'all' | 'current' | 'expiring' | 'expired'
  >('all');
  const [filterContract, setFilterContract] = useState<'all' | 'Fulltime' | 'Contract' | 'Casual'>(
    'all'
  );
  const [filterSeniority, setFilterSeniority] = useState<'all' | 'senior' | 'mid' | 'junior'>(
    'all'
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPilotId, setEditingPilotId] = useState<string | null>(null);
  const [quickViewPilotId, setQuickViewPilotId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  // Initialize view mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pilot-view-mode');
    if (saved && ['card', 'list', 'table'].includes(saved)) {
      setViewMode(saved as ViewMode);
    }
  }, []);

  // Save view mode to localStorage
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('pilot-view-mode', mode);
  };

  // Fetch pilots from Supabase
  const fetchPilots = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPilots();
      setPilots(data);

      // Initialize search service
      pilotSearchService.initialize(data);
    } catch (err) {
      console.error('Error fetching pilots:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pilots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPilots();
  }, []);

  // Fuzzy search
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      const results = pilotSearchService.search(searchTerm);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  // Filtered pilots
  const filteredPilots = useMemo(() => {
    let result = pilots;

    // Apply fuzzy search if active
    if (searchResults.length > 0 && searchTerm.trim().length >= 2) {
      const searchResultIds = new Set(searchResults.map((r) => r.item.id));
      result = result.filter((p) => searchResultIds.has(p.id));
    } else if (searchTerm.trim().length >= 2) {
      // Fallback to basic search
      result = result.filter(
        (pilot) =>
          pilot.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pilot.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pilot.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filterRole !== 'all') {
      result = result.filter((p) => p.role === filterRole);
    }

    if (filterStatus !== 'all') {
      result = result.filter((p) => (filterStatus === 'active' ? p.is_active : !p.is_active));
    }

    if (filterCertStatus !== 'all') {
      result = result.filter((p) => {
        if (filterCertStatus === 'expired') return p.certificationStatus.expired > 0;
        if (filterCertStatus === 'expiring')
          return p.certificationStatus.expiring > 0 && p.certificationStatus.expired === 0;
        if (filterCertStatus === 'current')
          return p.certificationStatus.expired === 0 && p.certificationStatus.expiring === 0;
        return true;
      });
    }

    if (filterContract !== 'all') {
      result = result.filter((p) => p.contract_type === filterContract);
    }

    if (filterSeniority !== 'all') {
      result = result.filter((p) => {
        if (!p.seniority_number) return false;
        if (filterSeniority === 'senior') return p.seniority_number <= 9;
        if (filterSeniority === 'mid') return p.seniority_number >= 10 && p.seniority_number <= 18;
        if (filterSeniority === 'junior') return p.seniority_number >= 19;
        return true;
      });
    }

    return result;
  }, [
    pilots,
    searchResults,
    searchTerm,
    filterRole,
    filterStatus,
    filterCertStatus,
    filterContract,
    filterSeniority,
  ]);

  // Sorting functionality
  const { sortedPilots, sortField, sortDirection, handleSort } = usePilotSort(filteredPilots);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredPilots.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPilots.map((p) => p.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleViewPilot = (pilotId: string) => {
    router.push(`/dashboard/pilots/${pilotId}`);
  };

  const handleEditPilot = (pilotId: string) => {
    setEditingPilotId(pilotId);
    setShowEditModal(true);
  };

  const handleCreatePilot = () => {
    setShowAddModal(true);
  };

  const handleAddPilotSuccess = () => {
    fetchPilots();
  };

  const handleEditPilotSuccess = () => {
    fetchPilots();
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingPilotId(null);
  };

  const handleExportPilots = () => {
    const exportData = filteredPilots.map((pilot) => {
      const retirementInfo = pilot.date_of_birth
        ? calculateRetirementInfo(pilot.date_of_birth)
        : null;

      return {
        ...pilot,
        age: pilot.date_of_birth ? calculateAge(pilot.date_of_birth) : undefined,
        years_of_service: pilot.commencement_date
          ? calculateYearsOfService(pilot.commencement_date)
          : undefined,
        retirement:
          retirementInfo && retirementInfo.retirementDate
            ? {
                retirementDate: retirementInfo.retirementDate.toISOString().split('T')[0],
                timeToRetirement: retirementInfo.displayText,
                retirementStatus: retirementInfo.retirementStatus,
              }
            : undefined,
        certificationStatus: {
          ...pilot.certificationStatus,
          total:
            pilot.certificationStatus.current +
            pilot.certificationStatus.expiring +
            pilot.certificationStatus.expired,
        },
      };
    });

    exportPilotsToCSV(exportData as PilotExportData[], filteredPilots.length !== pilots.length);
  };

  const handleExportCompliance = () => {
    const exportData = pilots.map((pilot) => {
      const retirementInfo = pilot.date_of_birth
        ? calculateRetirementInfo(pilot.date_of_birth)
        : null;

      return {
        ...pilot,
        age: pilot.date_of_birth ? calculateAge(pilot.date_of_birth) : undefined,
        years_of_service: pilot.commencement_date
          ? calculateYearsOfService(pilot.commencement_date)
          : undefined,
        retirement:
          retirementInfo && retirementInfo.retirementDate
            ? {
                retirementDate: retirementInfo.retirementDate.toISOString().split('T')[0],
                timeToRetirement: retirementInfo.displayText,
                retirementStatus: retirementInfo.retirementStatus,
              }
            : undefined,
        certificationStatus: {
          ...pilot.certificationStatus,
          total:
            pilot.certificationStatus.current +
            pilot.certificationStatus.expiring +
            pilot.certificationStatus.expired,
        },
      };
    });

    exportComplianceReport(exportData as PilotExportData[]);
  };

  const handleBulkDelete = async (ids: string[]) => {
    // Placeholder - implement bulk delete logic
    console.log('Bulk delete:', ids);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    fetchPilots();
  };

  const handleBulkUpdateStatus = async (ids: string[], isActive: boolean) => {
    // Placeholder - implement bulk status update logic
    console.log('Bulk update status:', ids, isActive);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    fetchPilots();
  };

  // Search result map for highlighting
  const searchResultsMap = useMemo(() => {
    const map = new Map();
    searchResults.forEach((result) => {
      map.set(result.item.id, result.matches);
    });
    return map;
  }, [searchResults]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-4 md:p-6">
          {/* Header */}
          <header className="mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center">
                  <span className="text-2xl md:text-3xl mr-2 md:mr-3" aria-hidden="true">
                    👨‍✈️
                  </span>
                  Pilot Management
                </h1>
                <p className="text-sm md:text-base text-gray-600 mt-1">
                  Manage B767 fleet pilot information and certifications
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => handleViewModeChange('card')}
                    className={`px-3 py-2 rounded-md text-sm transition-colors ${
                      viewMode === 'card'
                        ? 'bg-white text-[#E4002B] shadow-sm font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Card view"
                  >
                    <span>🔲</span>
                  </button>
                  <button
                    onClick={() => handleViewModeChange('list')}
                    className={`px-3 py-2 rounded-md text-sm transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white text-[#E4002B] shadow-sm font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="List view"
                  >
                    <span>☰</span>
                  </button>
                  <button
                    onClick={() => handleViewModeChange('table')}
                    className={`px-3 py-2 rounded-md text-sm transition-colors ${
                      viewMode === 'table'
                        ? 'bg-white text-[#E4002B] shadow-sm font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Table view"
                  >
                    <span>▦</span>
                  </button>
                </div>

                {/* Export Options */}
                <div className="mobile-action-buttons sm:flex sm:flex-row sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={handleExportPilots}
                    className="mobile-button-secondary text-xs sm:text-sm"
                    title="Export current pilot list to CSV"
                    aria-label={`Export ${filteredPilots.length} pilots to CSV`}
                  >
                    <span className="mr-2" aria-hidden="true">
                      📊
                    </span>
                    Export ({filteredPilots.length})
                  </button>

                  <button
                    onClick={handleExportCompliance}
                    className="mobile-button text-amber-700 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-xs sm:text-sm"
                    title="Export compliance report (expired/expiring certifications)"
                    aria-label="Export compliance report"
                  >
                    <span className="mr-2" aria-hidden="true">
                      ⚠️
                    </span>
                    <span className="hidden sm:inline">Compliance Report</span>
                    <span className="sm:hidden">Compliance</span>
                  </button>
                </div>

                {permissions.canCreate(user) && (
                  <button
                    onClick={handleCreatePilot}
                    className="mobile-button-primary text-sm"
                    aria-label="Add new pilot to the system"
                  >
                    <span className="mr-2" aria-hidden="true">
                      ➕
                    </span>
                    Add New Pilot
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Search and Filters */}
          <section
            className="mb-4 md:mb-6 bg-white rounded-lg border border-gray-200 p-3 md:p-4"
            aria-label="Pilot search and filters"
          >
            <div className="space-y-3 md:space-y-4">
              {/* Basic Filters Row */}
              <div className="filter-form-mobile md:grid md:grid-cols-5 gap-3 md:gap-4">
                {/* Search */}
                <div className="relative">
                  <label htmlFor="pilot-search" className="sr-only">
                    Search pilots by name or employee ID
                  </label>
                  <span
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    aria-hidden="true"
                  >
                    🔍
                  </span>
                  <input
                    id="pilot-search"
                    type="text"
                    placeholder="Search pilots..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mobile-input md:w-full pl-10 pr-4 focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                    aria-describedby="search-help"
                  />
                  <div id="search-help" className="sr-only">
                    Search by pilot name or employee ID
                  </div>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Role Filter */}
                <div>
                  <label htmlFor="role-filter" className="sr-only">
                    Filter by pilot role
                  </label>
                  <select
                    id="role-filter"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value as any)}
                    className="mobile-select focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                    aria-label="Filter pilots by role"
                  >
                    <option value="all">All Roles</option>
                    <option value="Captain">Captain</option>
                    <option value="First Officer">First Officer</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Advanced Filters Toggle */}
                <div>
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>⚙️</span>
                    <span>{showAdvancedFilters ? 'Hide' : 'Show'} Advanced</span>
                  </button>
                </div>

                {/* Results Count */}
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-1">📊</span>
                  <span className="font-medium">{filteredPilots.length}</span> of {pilots.length}{' '}
                  pilots
                </div>
              </div>

              {/* Advanced Filters Row */}
              <AnimatePresence>
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 overflow-hidden"
                  >
                    {/* Certification Status Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Certification Status
                      </label>
                      <select
                        value={filterCertStatus}
                        onChange={(e) => setFilterCertStatus(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B] text-sm"
                      >
                        <option value="all">All Certifications</option>
                        <option value="current">✅ All Current</option>
                        <option value="expiring">⏰ Some Expiring</option>
                        <option value="expired">⚠️ Some Expired</option>
                      </select>
                    </div>

                    {/* Contract Type Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Contract Type
                      </label>
                      <select
                        value={filterContract}
                        onChange={(e) => setFilterContract(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B] text-sm"
                      >
                        <option value="all">All Contracts</option>
                        <option value="Fulltime">Fulltime</option>
                        <option value="Contract">Contract</option>
                        <option value="Casual">Casual</option>
                      </select>
                    </div>

                    {/* Seniority Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Seniority Level
                      </label>
                      <select
                        value={filterSeniority}
                        onChange={(e) => setFilterSeniority(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B] text-sm"
                      >
                        <option value="all">All Seniority</option>
                        <option value="senior">🥇 Senior (1-9)</option>
                        <option value="mid">🥈 Mid-level (10-18)</option>
                        <option value="junior">🥉 Junior (19+)</option>
                      </select>
                    </div>

                    {/* Clear Filters */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">&nbsp;</label>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setFilterRole('all');
                          setFilterStatus('all');
                          setFilterCertStatus('all');
                          setFilterContract('all');
                          setFilterSeniority('all');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <span>🔄</span>
                        Clear All Filters
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">Error: {error}</p>
              <button
                onClick={() => router.refresh()}
                className="mt-2 px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Pilots Display */}
          <main role="main" aria-label="Pilots listing">
            {loading ? (
              <div className="text-center py-8 md:py-12">
                <div className="loading-spinner-lg mx-auto"></div>
                <p
                  className="text-gray-600 mt-4 text-sm md:text-base"
                  role="status"
                  aria-live="polite"
                >
                  Loading pilots...
                </p>
                <div className="mt-4 space-y-2">
                  <div className="skeleton h-4 w-32 mx-auto"></div>
                  <div className="skeleton h-4 w-24 mx-auto"></div>
                </div>
              </div>
            ) : filteredPilots.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <span className="text-4xl md:text-6xl block mb-4" aria-hidden="true">
                  👨‍✈️
                </span>
                <h3 className="mobile-subheading md:text-lg font-medium text-gray-900 mb-2">
                  No pilots found
                </h3>
                <p className="text-sm md:text-base text-gray-600 mb-4 max-w-md mx-auto">
                  {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first pilot'}
                </p>
                {permissions.canCreate(user) && (
                  <button
                    onClick={handleCreatePilot}
                    className="mobile-button-primary"
                    aria-label="Add your first pilot"
                  >
                    Add New Pilot
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Card View */}
                {viewMode === 'card' && (
                  <PilotCardView
                    pilots={sortedPilots}
                    onView={handleViewPilot}
                    onEdit={handleEditPilot}
                    onQuickView={setQuickViewPilotId}
                    selectedIds={selectedIds}
                    onToggleSelect={handleToggleSelect}
                    searchResults={searchResultsMap}
                  />
                )}

                {/* List View */}
                {viewMode === 'list' && (
                  <PilotListView
                    pilots={sortedPilots}
                    onView={handleViewPilot}
                    onEdit={handleEditPilot}
                    onQuickView={setQuickViewPilotId}
                    selectedIds={selectedIds}
                    onToggleSelect={handleToggleSelect}
                    searchResults={searchResultsMap}
                  />
                )}

                {/* Table View */}
                {viewMode === 'table' && (
                  <PilotTableView
                    pilots={sortedPilots}
                    onView={handleViewPilot}
                    onEdit={handleEditPilot}
                    onQuickView={setQuickViewPilotId}
                    selectedIds={selectedIds}
                    onToggleSelect={handleToggleSelect}
                    onToggleSelectAll={handleToggleSelectAll}
                    searchResults={searchResultsMap}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                )}
              </>
            )}
          </main>

          {/* Summary Stats */}
          {pilots.length > 0 && (
            <aside
              className="mt-6 md:mt-8 bg-gray-50 rounded-lg p-4 md:p-6"
              aria-labelledby="fleet-summary"
            >
              <h3
                id="fleet-summary"
                className="mobile-subheading md:text-lg font-semibold text-gray-900 mb-3 md:mb-4"
              >
                Fleet Summary
              </h3>
              <div className="mobile-stats-grid md:grid-cols-4 gap-3 md:gap-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <p
                    className="text-xl md:text-2xl font-bold text-blue-600"
                    aria-describedby="active-pilots-desc"
                  >
                    {pilots.filter((p) => p.is_active).length}
                  </p>
                  <p id="active-pilots-desc" className="text-xs md:text-sm text-gray-600">
                    Active Pilots
                  </p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p
                    className="text-xl md:text-2xl font-bold text-purple-600"
                    aria-describedby="captains-desc"
                  >
                    {pilots.filter((p) => p.role === 'Captain').length}
                  </p>
                  <p id="captains-desc" className="text-xs md:text-sm text-gray-600">
                    Captains
                  </p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p
                    className="text-xl md:text-2xl font-bold text-green-600"
                    aria-describedby="first-officers-desc"
                  >
                    {pilots.filter((p) => p.role === 'First Officer').length}
                  </p>
                  <p id="first-officers-desc" className="text-xs md:text-sm text-gray-600">
                    First Officers
                  </p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p
                    className="text-xl md:text-2xl font-bold text-red-600"
                    aria-describedby="expired-certs-desc"
                  >
                    {pilots.reduce((sum, p) => sum + p.certificationStatus.expired, 0)}
                  </p>
                  <p id="expired-certs-desc" className="text-xs md:text-sm text-gray-600">
                    Expired Certifications
                  </p>
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Add Pilot Modal - Lazy Loaded */}
        {showAddModal && (
          <LazyLoader type="modal">
            <LazyPilotAddModal
              isOpen={showAddModal}
              onClose={() => setShowAddModal(false)}
              onSuccess={handleAddPilotSuccess}
            />
          </LazyLoader>
        )}

        {/* Edit Pilot Modal - Lazy Loaded */}
        {showEditModal && editingPilotId && (
          <LazyLoader type="modal">
            <LazyPilotEditModal
              isOpen={showEditModal}
              onClose={handleCloseEditModal}
              onSuccess={handleEditPilotSuccess}
              pilotId={editingPilotId}
            />
          </LazyLoader>
        )}

        {/* Quick View Drawer */}
        <PilotQuickView
          pilotId={quickViewPilotId}
          pilots={pilots}
          onClose={() => setQuickViewPilotId(null)}
          onEdit={handleEditPilot}
          onViewFull={handleViewPilot}
        />

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedIds={selectedIds}
          pilots={filteredPilots}
          onClearSelection={handleClearSelection}
          onDelete={handleBulkDelete}
          onUpdateStatus={handleBulkUpdateStatus}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
