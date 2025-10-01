'use client';

import { ViewMode } from '@/hooks/useViewToggle';

interface ViewToggleProps {
  viewMode: ViewMode;
  onToggle: () => void;
  isLoading?: boolean;
  className?: string;
}

export function ViewToggle({
  viewMode,
  onToggle,
  isLoading = false,
  className = '',
}: ViewToggleProps) {
  return (
    <div
      className={`flex items-center border border-gray-300 rounded-lg p-1 bg-white ${className}`}
    >
      {/* Grid View Button */}
      <button
        onClick={() => viewMode !== 'grid' && onToggle()}
        disabled={isLoading}
        className={`
          flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
          ${
            viewMode === 'grid'
              ? 'bg-[#E4002B] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          min-w-[80px]
        `}
        title="Grid view"
        aria-label={`Grid view${viewMode === 'grid' ? ' (currently selected)' : ''}`}
        aria-pressed={viewMode === 'grid'}
      >
        <span className="mr-2" aria-hidden="true">
          ⚏
        </span>
        <span className="hidden sm:inline">Grid</span>
      </button>

      {/* List View Button */}
      <button
        onClick={() => viewMode !== 'list' && onToggle()}
        disabled={isLoading}
        className={`
          flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
          ${
            viewMode === 'list'
              ? 'bg-[#E4002B] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          min-w-[80px]
        `}
        title="List view"
        aria-label={`List view${viewMode === 'list' ? ' (currently selected)' : ''}`}
        aria-pressed={viewMode === 'list'}
      >
        <span className="mr-2" aria-hidden="true">
          ☰
        </span>
        <span className="hidden sm:inline">List</span>
      </button>
    </div>
  );
}
