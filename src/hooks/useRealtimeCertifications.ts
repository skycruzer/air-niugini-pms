'use client';

import { useEffect, useState } from 'react';
import { supabase, PilotCheck } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeState {
  data: PilotCheck[];
  loading: boolean;
  error: string | null;
  connectionState: 'connecting' | 'connected' | 'disconnected';
  lastUpdate: Date | null;
}

/**
 * Hook for real-time certification data updates
 * Subscribes to INSERT, UPDATE, DELETE events on the pilot_checks table
 */
export function useRealtimeCertifications(initialData: PilotCheck[] = []) {
  const [state, setState] = useState<RealtimeState>({
    data: initialData,
    loading: true,
    error: null,
    connectionState: 'connecting',
    lastUpdate: null,
  });

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = async () => {
      try {
        // Create channel for pilot_checks table
        channel = supabase
          .channel('certifications-changes')
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'pilot_checks',
            },
            async (payload) => {
              console.log('🔄 Certifications real-time update:', payload);

              // Fetch full data with joins for the affected record
              let fullRecord: PilotCheck | null = null;
              if (payload.eventType !== 'DELETE') {
                const { data } = await supabase
                  .from('pilot_checks')
                  .select(
                    `
                    *,
                    pilots (*),
                    check_types (*)
                  `
                  )
                  .eq('id', payload.new.id)
                  .single();

                fullRecord = data;
              }

              setState((prev) => {
                let newData = [...prev.data];

                switch (payload.eventType) {
                  case 'INSERT':
                    // Add new certification
                    if (fullRecord) {
                      newData.push(fullRecord);
                    }
                    break;

                  case 'UPDATE':
                    // Update existing certification
                    const updateIndex = newData.findIndex((c) => c.id === payload.new.id);
                    if (updateIndex !== -1 && fullRecord) {
                      newData[updateIndex] = fullRecord;
                    }
                    break;

                  case 'DELETE':
                    // Remove deleted certification
                    newData = newData.filter((c) => c.id !== payload.old.id);
                    break;
                }

                return {
                  ...prev,
                  data: newData,
                  lastUpdate: new Date(),
                };
              });
            }
          )
          .subscribe((status) => {
            console.log('📡 Certifications subscription status:', status);

            setState((prev) => ({
              ...prev,
              loading: false,
              connectionState:
                status === 'SUBSCRIBED'
                  ? 'connected'
                  : status === 'CHANNEL_ERROR'
                    ? 'disconnected'
                    : 'connecting',
            }));
          });
      } catch (error) {
        console.error('❌ Realtime subscription error:', error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Failed to establish real-time connection',
          connectionState: 'disconnected',
        }));
      }
    };

    setupRealtimeSubscription();

    // Cleanup on unmount
    return () => {
      if (channel) {
        console.log('🔌 Unsubscribing from certifications channel');
        supabase.removeChannel(channel);
      }
    };
  }, []); // Empty dependency array - only run once

  return state;
}
