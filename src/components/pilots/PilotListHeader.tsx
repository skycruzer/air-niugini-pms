'use client';

export type SortField =
  | 'name'
  | 'employee_id'
  | 'role'
  | 'seniority_number'
  | 'is_active'
  | 'certificationStatus';
export type SortDirection = 'asc' | 'desc';

interface PilotListHeaderProps {
  sortField?: SortField;
  sortDirection?: SortDirection;
  onSort?: (field: SortField) => void;
}

export function PilotListHeader({ sortField, sortDirection, onSort }: PilotListHeaderProps) {
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <span className="text-gray-300 ml-1" aria-hidden="true">
          ⚪
        </span>
      );
    }
    return (
      <span className="text-[#E4002B] ml-1" aria-hidden="true">
        {sortDirection === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  const handleSort = (field: SortField) => {
    if (onSort) {
      onSort(field);
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="block md:hidden bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Sort Options</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => handleSort('name')}
              className={`px-2 py-1 text-xs rounded ${
                sortField === 'name'
                  ? 'bg-[#E4002B] text-white'
                  : 'bg-white text-gray-600 border border-gray-300'
              }`}
            >
              Name {getSortIcon('name')}
            </button>
            <button
              onClick={() => handleSort('role')}
              className={`px-2 py-1 text-xs rounded ${
                sortField === 'role'
                  ? 'bg-[#E4002B] text-white'
                  : 'bg-white text-gray-600 border border-gray-300'
              }`}
            >
              Role {getSortIcon('role')}
            </button>
            <button
              onClick={() => handleSort('seniority_number')}
              className={`px-2 py-1 text-xs rounded ${
                sortField === 'seniority_number'
                  ? 'bg-[#E4002B] text-white'
                  : 'bg-white text-gray-600 border border-gray-300'
              }`}
            >
              Seniority {getSortIcon('seniority_number')}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-gray-50 border border-gray-200 rounded-lg mb-4">
        <div className="grid grid-cols-8 gap-4 px-4 py-3 text-sm font-medium text-gray-700">
          {/* Photo */}
          <div className="flex items-center justify-center">
            <span>Photo</span>
          </div>

          {/* Name */}
          <div className="col-span-2">
            <button
              onClick={() => handleSort('name')}
              className="flex items-center hover:text-[#E4002B] transition-colors"
              aria-label={`Sort by name ${sortField === 'name' ? `(currently ${sortDirection})` : ''}`}
            >
              Name
              {getSortIcon('name')}
            </button>
          </div>

          {/* Role */}
          <div>
            <button
              onClick={() => handleSort('role')}
              className="flex items-center hover:text-[#E4002B] transition-colors"
              aria-label={`Sort by role ${sortField === 'role' ? `(currently ${sortDirection})` : ''}`}
            >
              Role
              {getSortIcon('role')}
            </button>
          </div>

          {/* Seniority */}
          <div className="text-center">
            <button
              onClick={() => handleSort('seniority_number')}
              className="flex items-center justify-center hover:text-[#E4002B] transition-colors"
              aria-label={`Sort by seniority ${sortField === 'seniority_number' ? `(currently ${sortDirection})` : ''}`}
            >
              Seniority
              {getSortIcon('seniority_number')}
            </button>
          </div>

          {/* Status */}
          <div className="text-center">
            <button
              onClick={() => handleSort('is_active')}
              className="flex items-center justify-center hover:text-[#E4002B] transition-colors"
              aria-label={`Sort by status ${sortField === 'is_active' ? `(currently ${sortDirection})` : ''}`}
            >
              Status
              {getSortIcon('is_active')}
            </button>
          </div>

          {/* Certification Status */}
          <div className="text-center">
            <button
              onClick={() => handleSort('certificationStatus')}
              className="flex items-center justify-center hover:text-[#E4002B] transition-colors"
              aria-label={`Sort by certification status ${sortField === 'certificationStatus' ? `(currently ${sortDirection})` : ''}`}
            >
              Certifications
              {getSortIcon('certificationStatus')}
            </button>
          </div>

          {/* Actions */}
          <div className="text-center">
            <span>Actions</span>
          </div>
        </div>
      </div>
    </>
  );
}
