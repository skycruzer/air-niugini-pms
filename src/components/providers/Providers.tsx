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
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
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
