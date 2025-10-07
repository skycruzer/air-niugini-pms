/**
 * @fileoverview Pagination Utilities for Air Niugini B767 PMS
 * Provides cursor-based and offset-based pagination with optimal performance
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-01
 */

/**
 * Pagination configuration constants
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
  SUPPORTED_PAGE_SIZES: [25, 50, 100] as const,
} as const;

/**
 * Interface for pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Interface for paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
    previousCursor?: string;
  };
}

/**
 * Interface for cursor-based pagination metadata
 */
export interface CursorPaginationMeta {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
  totalCount?: number;
}

/**
 * Parse and validate pagination parameters from request
 * @param searchParams - URL search parameters
 * @returns Validated pagination parameters
 */
export function parsePaginationParams(
  searchParams: URLSearchParams | Record<string, string>
): PaginationParams {
  const params =
    searchParams instanceof URLSearchParams
      ? Object.fromEntries(searchParams.entries())
      : searchParams;

  const page = Math.max(1, parseInt(params.page || '1', 10));
  const rawPageSize = parseInt(params.pageSize || String(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE), 10);
  const pageSize = Math.min(Math.max(1, rawPageSize), PAGINATION_CONFIG.MAX_PAGE_SIZE);

  return {
    page,
    pageSize,
    cursor: params.cursor,
    orderBy: params.orderBy,
    orderDirection: (params.orderDirection === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc',
  };
}

/**
 * Calculate pagination metadata for offset-based pagination
 * @param totalRecords - Total number of records
 * @param page - Current page number
 * @param pageSize - Number of records per page
 * @returns Pagination metadata
 */
export function calculatePaginationMeta(totalRecords: number, page: number, pageSize: number) {
  const totalPages = Math.ceil(totalRecords / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    page,
    pageSize,
    totalRecords,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };
}

/**
 * Build paginated response with metadata
 * @param data - Array of records
 * @param totalRecords - Total number of records
 * @param params - Pagination parameters
 * @returns Formatted paginated response
 */
export function buildPaginatedResponse<T>(
  data: T[],
  totalRecords: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const { page = 1, pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE } = params;
  const meta = calculatePaginationMeta(totalRecords, page, pageSize);

  return {
    data,
    pagination: meta,
  };
}

/**
 * Generate cursor from record (typically using ID or timestamp)
 * @param record - Database record
 * @param cursorField - Field to use for cursor (default: 'id')
 * @returns Base64 encoded cursor string
 */
export function generateCursor(record: any, cursorField: string = 'id'): string {
  const value = record[cursorField];
  if (!value) {
    throw new Error(`Cursor field "${cursorField}" not found in record`);
  }

  // Encode cursor as base64 for security and URL-safety
  return Buffer.from(JSON.stringify({ field: cursorField, value })).toString('base64');
}

/**
 * Parse cursor to extract field and value
 * @param cursor - Base64 encoded cursor string
 * @returns Parsed cursor with field and value
 */
export function parseCursor(cursor: string): { field: string; value: any } {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    throw new Error('Invalid cursor format');
  }
}

/**
 * Build Supabase query with offset-based pagination
 * @param query - Supabase query builder
 * @param params - Pagination parameters
 * @returns Query with pagination applied
 */
export function applyOffsetPagination<T>(query: any, params: PaginationParams): any {
  const { page = 1, pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE } = params;
  const offset = (page - 1) * pageSize;

  return query.range(offset, offset + pageSize - 1).limit(pageSize);
}

/**
 * Build Supabase query with cursor-based pagination
 * @param query - Supabase query builder
 * @param params - Pagination parameters
 * @returns Query with cursor pagination applied
 */
export function applyCursorPagination<T>(
  query: any,
  params: PaginationParams & { cursorField?: string }
): any {
  const {
    cursor,
    pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
    orderDirection = 'asc',
    cursorField = 'id',
  } = params;

  let paginatedQuery = query;

  // Apply cursor filter if provided
  if (cursor) {
    try {
      const { value } = parseCursor(cursor);
      if (orderDirection === 'asc') {
        paginatedQuery = paginatedQuery.gt(cursorField, value);
      } else {
        paginatedQuery = paginatedQuery.lt(cursorField, value);
      }
    } catch (error) {
      logger.error('Error parsing cursor', error instanceof Error ? error : new Error(String(error)));
      // Continue without cursor if invalid
    }
  }

  // Apply limit and ordering
  return paginatedQuery
    .limit(pageSize + 1) // Fetch one extra to check if there's a next page
    .order(cursorField, { ascending: orderDirection === 'asc' });
}

/**
 * Build cursor pagination metadata from results
 * @param data - Array of records (may include extra record for hasNextPage check)
 * @param pageSize - Page size
 * @param cursorField - Field used for cursor
 * @returns Cursor pagination metadata
 */
export function buildCursorPaginationMeta<T>(
  data: T[],
  pageSize: number,
  cursorField: string = 'id'
): { data: T[]; meta: CursorPaginationMeta } {
  const hasNextPage = data.length > pageSize;
  const paginatedData = hasNextPage ? data.slice(0, pageSize) : data;

  const meta: CursorPaginationMeta = {
    hasNextPage,
    hasPreviousPage: false, // Cursor-based pagination typically goes forward only
    startCursor:
      paginatedData.length > 0 ? generateCursor(paginatedData[0], cursorField) : undefined,
    endCursor:
      paginatedData.length > 0
        ? generateCursor(paginatedData[paginatedData.length - 1], cursorField)
        : undefined,
  };

  return { data: paginatedData, meta };
}

/**
 * Helper to get total count efficiently (uses Supabase head request)
 * @param query - Supabase query builder
 * @returns Total count of records
 */
export async function getTotalCount(query: any): Promise<number> {
  const { count, error } = await query.select('*', { count: 'exact', head: true });

  if (error) {
    logger.error('Error getting total count', error instanceof Error ? error : new Error(String(error)));
    return 0;
  }

  return count || 0;
}

/**
 * Build pagination links for API responses
 * @param baseUrl - Base URL for the API endpoint
 * @param params - Pagination parameters
 * @param totalPages - Total number of pages
 * @returns Object with next and previous page URLs
 */
export function buildPaginationLinks(
  baseUrl: string,
  params: PaginationParams,
  totalPages: number
): { next?: string; previous?: string; first?: string; last?: string } {
  const { page = 1, pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE } = params;
  const links: any = {};

  // Build URL helper
  const buildUrl = (targetPage: number) => {
    const url = new URL(baseUrl);
    url.searchParams.set('page', String(targetPage));
    url.searchParams.set('pageSize', String(pageSize));
    if (params.orderBy) url.searchParams.set('orderBy', params.orderBy);
    if (params.orderDirection) url.searchParams.set('orderDirection', params.orderDirection);
    return url.toString();
  };

  // Add links
  if (page < totalPages) {
    links.next = buildUrl(page + 1);
  }
  if (page > 1) {
    links.previous = buildUrl(page - 1);
  }
  if (page !== 1) {
    links.first = buildUrl(1);
  }
  if (page !== totalPages && totalPages > 0) {
    links.last = buildUrl(totalPages);
  }

  return links;
}

/**
 * Validate page size against supported values
 * @param pageSize - Requested page size
 * @returns Validated page size
 */
export function validatePageSize(pageSize: number): number {
  if (PAGINATION_CONFIG.SUPPORTED_PAGE_SIZES.includes(pageSize as any)) {
    return pageSize;
  }
  return PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;
}

/**
 * Create a pagination response builder for consistent API responses
 */
export class PaginationResponseBuilder<T> {
  constructor(
    private baseUrl: string,
    private params: PaginationParams
  ) {}

  /**
   * Build complete paginated response with metadata and links
   */
  build(data: T[], totalRecords: number): PaginatedResponse<T> & { links?: any } {
    const meta = calculatePaginationMeta(
      totalRecords,
      this.params.page || 1,
      this.params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE
    );

    const links = buildPaginationLinks(this.baseUrl, this.params, meta.totalPages);

    return {
      data,
      pagination: meta,
      ...(Object.keys(links).length > 0 ? { links } : {}),
    };
  }
}

/**
 * Performance optimization: Skip count query for large datasets
 * Use estimated count or cache for better performance
 */
export async function getEstimatedCount(tableName: string): Promise<number> {
  // This would typically use database statistics or cached counts
  // For now, return a conservative estimate
  logger.debug('Using estimated count for table: ${tableName}');
  return -1; // -1 indicates estimate not available
}
