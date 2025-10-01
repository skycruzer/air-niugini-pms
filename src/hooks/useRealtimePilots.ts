'use client';

import { useEffect, useState } from 'react';
import { supabase, Pilot } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeState {
  data: Pilot[];
  loading: boolean;
  error: string | null;
  connectionState: 'connecting' | 'connected' | 'disconnected';
}

/**
 * Hook for real-time pilot data updates
 * Subscribes to INSERT, UPDATE, DELETE events on the pilots table
 */
export function useRealtimePilots(initialData: Pilot[] = []) {
  const [state, setState] = useState<RealtimeState>({
    data: initialData,
    loading: true,
    error: null,
    connectionState: 'connecting',
  });

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = async () => {
      try {
        // Create channel for pilots table
        channel = supabase
          .channel('pilots-changes')
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'pilots',
            },
            (payload) => {
              console.log('🔄 Pilots real-time update:', payload);

              setState((prev) => {
                let newData = [...prev.data];

                switch (payload.eventType) {
                  case 'INSERT':
                    // Add new pilot
                    newData.push(payload.new as Pilot);
                    break;

                  case 'UPDATE':
                    // Update existing pilot
                    const updateIndex = newData.findIndex((p) => p.id === payload.new.id);
                    if (updateIndex !== -1) {
                      newData[updateIndex] = payload.new as Pilot;
                    }
                    break;

                  case 'DELETE':
                    // Remove deleted pilot
                    newData = newData.filter((p) => p.id !== payload.old.id);
                    break;
                }

                return {
                  ...prev,
                  data: newData,
                };
              });
            }
          )
          .subscribe((status) => {
            console.log('📡 Pilots subscription status:', status);

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
        console.log('🔌 Unsubscribing from pilots channel');
        supabase.removeChannel(channel);
      }
    };
  }, []); // Empty dependency array - only run once

  return state;
}
