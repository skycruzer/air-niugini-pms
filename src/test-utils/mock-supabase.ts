/**
 * Mock Supabase Client for Testing
 * Provides mocked Supabase client functionality for unit tests
 */

import { mockPilots, mockCheckTypes, mockPilotChecks, mockLeaveRequests } from './mock-data';

/**
 * Mock Supabase response structure
 */
interface MockSupabaseResponse<T> {
  data: T | null;
  error: Error | null;
  count?: number | null;
}

/**
 * Create mock Supabase client
 */
export function createMockSupabaseClient() {
  const mockFrom = (table: string) => {
    let selectedData: any[] = [];
    const filters: any[] = [];
    let selectColumns = '*';
    let orderByField: string | null = null;
    let orderDirection: 'asc' | 'desc' = 'asc';
    let limitCount: number | null = null;
    let singleResult = false;

    // Get data based on table
    const getTableData = () => {
      switch (table) {
        case 'pilots':
          return mockPilots;
        case 'check_types':
          return mockCheckTypes;
        case 'pilot_checks':
          return mockPilotChecks;
        case 'leave_requests':
          return mockLeaveRequests;
        default:
          return [];
      }
    };

    const chainableMethods = {
      select: (columns: string = '*') => {
        selectColumns = columns;
        selectedData = getTableData();
        return chainableMethods;
      },

      eq: (column: string, value: any) => {
        filters.push({ column, operator: 'eq', value });
        selectedData = selectedData.filter((item) => item[column] === value);
        return chainableMethods;
      },

      neq: (column: string, value: any) => {
        filters.push({ column, operator: 'neq', value });
        selectedData = selectedData.filter((item) => item[column] !== value);
        return chainableMethods;
      },

      gt: (column: string, value: any) => {
        filters.push({ column, operator: 'gt', value });
        selectedData = selectedData.filter((item) => item[column] > value);
        return chainableMethods;
      },

      gte: (column: string, value: any) => {
        filters.push({ column, operator: 'gte', value });
        selectedData = selectedData.filter((item) => item[column] >= value);
        return chainableMethods;
      },

      lt: (column: string, value: any) => {
        filters.push({ column, operator: 'lt', value });
        selectedData = selectedData.filter((item) => item[column] < value);
        return chainableMethods;
      },

      lte: (column: string, value: any) => {
        filters.push({ column, operator: 'lte', value });
        selectedData = selectedData.filter((item) => item[column] <= value);
        return chainableMethods;
      },

      like: (column: string, pattern: string) => {
        filters.push({ column, operator: 'like', value: pattern });
        const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i');
        selectedData = selectedData.filter((item) => regex.test(item[column]));
        return chainableMethods;
      },

      ilike: (column: string, pattern: string) => {
        filters.push({ column, operator: 'ilike', value: pattern });
        const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i');
        selectedData = selectedData.filter((item) => regex.test(item[column]));
        return chainableMethods;
      },

      in: (column: string, values: any[]) => {
        filters.push({ column, operator: 'in', value: values });
        selectedData = selectedData.filter((item) => values.includes(item[column]));
        return chainableMethods;
      },

      is: (column: string, value: any) => {
        filters.push({ column, operator: 'is', value });
        selectedData = selectedData.filter((item) => item[column] === value);
        return chainableMethods;
      },

      not: (column: string, operator: string, value: any) => {
        filters.push({ column, operator: 'not', value });
        selectedData = selectedData.filter((item) => {
          if (operator === 'is') {
            return item[column] !== value;
          }
          return true;
        });
        return chainableMethods;
      },

      order: (column: string, options?: { ascending?: boolean }) => {
        orderByField = column;
        orderDirection = options?.ascending === false ? 'desc' : 'asc';
        return chainableMethods;
      },

      limit: (count: number) => {
        limitCount = count;
        return chainableMethods;
      },

      single: () => {
        singleResult = true;
        return chainableMethods;
      },

      range: (from: number, to: number) => {
        selectedData = selectedData.slice(from, to + 1);
        return chainableMethods;
      },

      // Execute the query and return the response
      then: async (resolve: any) => {
        // Apply ordering
        if (orderByField) {
          selectedData = [...selectedData].sort((a, b) => {
            const aVal = a[orderByField];
            const bVal = b[orderByField];
            if (orderDirection === 'asc') {
              return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            } else {
              return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
          });
        }

        // Apply limit
        if (limitCount !== null) {
          selectedData = selectedData.slice(0, limitCount);
        }

        // Return single or array
        const data = singleResult
          ? selectedData.length > 0
            ? selectedData[0]
            : null
          : selectedData;

        const response: MockSupabaseResponse<typeof data> = {
          data,
          error: null,
          count: selectedData.length,
        };

        return resolve(response);
      },
    };

    return chainableMethods;
  };

  return {
    from: mockFrom,
    auth: {
      signInWithPassword: jest
        .fn()
        .mockResolvedValue({ data: { user: { id: 'user-001' }, session: {} }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      getSession: jest
        .fn()
        .mockResolvedValue({ data: { session: { user: { id: 'user-001' } } }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null }),
        download: jest.fn().mockResolvedValue({ data: new Blob(), error: null }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    },
  };
}

/**
 * Mock Supabase Admin Client
 */
export function createMockSupabaseAdminClient() {
  return createMockSupabaseClient();
}

/**
 * Jest mock for Supabase client module
 */
export const mockSupabaseClient = createMockSupabaseClient();

// Export mock functions for easier mocking in tests
export const mockSupabaseFunctions = {
  from: jest.fn(),
  signInWithPassword: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  onAuthStateChange: jest.fn(),
};
