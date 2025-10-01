'use client';

import { useEffect, useState } from 'react';
import { supabase, LeaveRequest } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeState {
  data: LeaveRequest[];
  loading: boolean;
  error: string | null;
  connectionState: 'connecting' | 'connected' | 'disconnected';
  lastUpdate: Date | null;
  presenceState: Record<string, any>;
}

/**
 * Hook for real-time leave request data updates
 * Subscribes to INSERT, UPDATE, DELETE events on the leave_requests table
 * Also includes presence tracking to see who's viewing
 */
export function useRealtimeLeave(initialData: LeaveRequest[] = [], userId?: string) {
  const [state, setState] = useState<RealtimeState>({
    data: initialData,
    loading: true,
    error: null,
    connectionState: 'connecting',
    lastUpdate: null,
    presenceState: {},
  });

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = async () => {
      try {
        // Create channel for leave_requests table with presence
        channel = supabase
          .channel('leave-requests-changes')
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'leave_requests',
            },
            async (payload) => {
              console.log('🔄 Leave requests real-time update:', payload);

              // Fetch full data with joins for the affected record
              let fullRecord: LeaveRequest | null = null;
              if (payload.eventType !== 'DELETE') {
                const { data } = await supabase
                  .from('leave_requests')
                  .select(
                    `
                    *,
                    pilots (*)
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
                    // Add new leave request
                    if (fullRecord) {
                      newData.push(fullRecord);
                    }
                    break;

                  case 'UPDATE':
                    // Update existing leave request
                    const updateIndex = newData.findIndex((lr) => lr.id === payload.new.id);
                    if (updateIndex !== -1 && fullRecord) {
                      newData[updateIndex] = fullRecord;
                    }
                    break;

                  case 'DELETE':
                    // Remove deleted leave request
                    newData = newData.filter((lr) => lr.id !== payload.old.id);
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
          .on('presence', { event: 'sync' }, () => {
            // Get current presence state
            const presenceState = channel?.presenceState();
            console.log('👥 Presence sync:', presenceState);

            setState((prev) => ({
              ...prev,
              presenceState: presenceState || {},
            }));
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log('👋 User joined:', key, newPresences);
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log('👋 User left:', key, leftPresences);
          })
          .subscribe(async (status) => {
            console.log('📡 Leave requests subscription status:', status);

            if (status === 'SUBSCRIBED' && userId) {
              // Track user presence
              await channel?.track({
                user_id: userId,
                online_at: new Date().toISOString(),
              });
            }

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
        console.log('🔌 Unsubscribing from leave requests channel');
        supabase.removeChannel(channel);
      }
    };
  }, [userId]); // Re-run if userId changes

  return state;
}
