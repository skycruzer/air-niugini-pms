/**
 * Data Table Component
 * Reusable data table with sorting, filtering, and pagination
 */

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { FadeIn } from '@/components/ui/animated';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  className?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = 'Search...',
  pageSize = 10,
  className,
  emptyMessage = 'No data available',
  onRowClick,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;

    return data.filter((row) =>
      columns.some((col) => {
        const value = row[col.key];
        return value?.toString().toLowerCase().includes(searchQuery.toLowerCase());
      })
    );
  }, [data, searchQuery, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Handle sort
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortKey, sortDirection]);

  const getSortIcon = (columnKey: string) => {
    if (sortKey !== columnKey) return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    if (sortDirection === 'asc') return <ChevronUp className="ml-2 h-4 w-4" />;
    return <ChevronDown className="ml-2 h-4 w-4" />;
  };

  return (
    <FadeIn direction="up" duration={0.4}>
      <div className={cn('space-y-4', className)}>
        {/* Search Bar */}
        {searchable && (
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    style={{ width: column.width }}
                    className={cn(
                      'font-semibold text-gray-700',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.sortable && 'cursor-pointer select-none',
                      column.className
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center">
                      {column.label}
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-12 text-gray-500">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <TableRow
                    key={rowIndex}
                    className={cn(
                      'transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-gray-50'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn(
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right',
                          column.className
                        )}
                      >
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <Button
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          currentPage === page && 'bg-[#4F46E5] hover:bg-[#4338CA] text-white'
                        )}
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </FadeIn>
  );
}

// Import React for useEffect
import React from 'react';
