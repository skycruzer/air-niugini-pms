/**
 * @fileoverview Virtual List Component
 * Implements virtual scrolling for large lists to improve performance
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-07
 */

'use client';

import { useRef, useState, useEffect, ReactNode } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number; // Number of items to render outside viewport
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = '',
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  // Total height of all items
  const totalHeight = items.length * itemHeight;

  // Offset for the visible items
  const offsetY = startIndex * itemHeight;

  // Handle scroll event
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Virtual Table Component
 * Specialized virtual list for table rows
 */
interface VirtualTableProps<T> {
  items: T[];
  rowHeight: number;
  containerHeight: number;
  columns: {
    header: string;
    accessor: (item: T) => ReactNode;
    width?: string;
  }[];
  onRowClick?: (item: T, index: number) => void;
  className?: string;
}

export function VirtualTable<T>({
  items,
  rowHeight,
  containerHeight,
  columns,
  onRowClick,
  className = '',
}: VirtualTableProps<T>) {
  return (
    <div className={className}>
      {/* Table Header */}
      <div className="flex border-b border-gray-200 bg-gray-50" style={{ height: rowHeight }}>
        {columns.map((column, index) => (
          <div
            key={index}
            className="px-4 py-2 text-left text-sm font-medium text-gray-700"
            style={{ width: column.width || 'auto', flex: column.width ? 'none' : 1 }}
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Virtual List for Rows */}
      <VirtualList
        items={items}
        itemHeight={rowHeight}
        containerHeight={containerHeight - rowHeight}
        renderItem={(item, index) => (
          <div
            className={`flex border-b border-gray-100 hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
            onClick={() => onRowClick?.(item, index)}
          >
            {columns.map((column, colIndex) => (
              <div
                key={colIndex}
                className="px-4 py-2 text-sm text-gray-900"
                style={{ width: column.width || 'auto', flex: column.width ? 'none' : 1 }}
              >
                {column.accessor(item)}
              </div>
            ))}
          </div>
        )}
      />
    </div>
  );
}
