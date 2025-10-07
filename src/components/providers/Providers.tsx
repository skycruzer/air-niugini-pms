'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { PresenceProvider } from '@/contexts/PresenceContext';
import { CollaborativeCursors } from '@/components/presence/CollaborativeCursors';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0, // Always treat data as stale
            gcTime: 1000 * 60 * 10, // Cache garbage collection after 10 minutes (formerly cacheTime)
            refetchOnWindowFocus: true, // Refetch when window regains focus
            refetchOnMount: true, // Always refetch when component mounts
            retry: 1, // Retry failed requests once
          },
          mutations: {
            retry: 0, // Don't retry failed mutations
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PresenceProvider>
          {children}
          <CollaborativeCursors />
        </PresenceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
