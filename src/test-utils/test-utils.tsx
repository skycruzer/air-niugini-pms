/**
 * Test Utilities - Custom Render with Providers
 * Provides wrapped render function with all necessary providers for testing
 */

import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';

/**
 * Create a new QueryClient for each test to ensure isolation
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * All Providers Wrapper
 * Wraps component with all necessary context providers
 */
interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

export function AllProviders({ children, queryClient }: AllProvidersProps) {
  const client = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

/**
 * Custom render function that wraps component with providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: CustomRenderOptions
): RenderResult {
  const { queryClient, ...renderOptions } = options || {};

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllProviders queryClient={queryClient}>{children}</AllProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Mock AuthContext Provider for testing
 */
interface MockAuthProviderProps {
  children: React.ReactNode;
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'manager';
    name: string;
  } | null;
  loading?: boolean;
}

export function MockAuthProvider({
  children,
  user = {
    id: 'test-user-id',
    email: 'test@airniugini.com.pg',
    role: 'admin',
    name: 'Test Admin',
  },
  loading = false,
}: MockAuthProviderProps) {
  const mockAuthValue = {
    user,
    loading,
    signIn: jest.fn().mockResolvedValue({ success: true }),
    signOut: jest.fn().mockResolvedValue(undefined),
    updateUser: jest.fn().mockResolvedValue(undefined),
  };

  // Mock the AuthContext
  const AuthContext = React.createContext(mockAuthValue);

  return <AuthContext.Provider value={mockAuthValue}>{children}</AuthContext.Provider>;
}

/**
 * Render with mock authentication
 */
export function renderWithAuth(
  ui: React.ReactElement,
  authOptions?: Omit<MockAuthProviderProps, 'children'>,
  renderOptions?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
      <MockAuthProvider {...authOptions}>{children}</MockAuthProvider>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Wait for async operations to complete
 */
export async function waitForLoadingToFinish() {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(() => {
    expect(document.querySelector('[data-testid="loading"]')).not.toBeInTheDocument();
  });
}

/**
 * Fire event helpers
 */
export { fireEvent, screen, waitFor, within } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Re-export everything from React Testing Library
export * from '@testing-library/react';
