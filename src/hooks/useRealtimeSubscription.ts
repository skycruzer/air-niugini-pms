/**
 * @fileoverview Real-time Subscription Hook
 * Provides real-time updates for tasks and disciplinary matters using Supabase subscriptions
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-07
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface RealtimeSubscriptionOptions {
  table: string;
  queryKey: unknown[];
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
  showNotifications?: boolean;
}

export function useRealtimeSubscription(options: RealtimeSubscriptionOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to real-time changes
    const channel = supabase
      .channel(`realtime:${options.table}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: options.table,
        },
        (payload) => {
          console.log(`[Real-time] INSERT on ${options.table}:`, payload);

          // Invalidate and refetch queries
          queryClient.invalidateQueries({ queryKey: options.queryKey });

          // Show notification
          if (options.showNotifications) {
            toast.info(`New ${options.table.replace('_', ' ')} created`);
          }

          // Custom handler
          options.onInsert?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: options.table,
        },
        (payload) => {
          console.log(`[Real-time] UPDATE on ${options.table}:`, payload);

          // Update the specific item in cache
          queryClient.setQueryData(options.queryKey, (old: any) => {
            if (!old || !old.data) return old;

            return {
              ...old,
              data: old.data.map((item: any) =>
                item.id === payload.new.id ? { ...item, ...payload.new } : item
              ),
            };
          });

          // Show notification
          if (options.showNotifications) {
            toast.info(`${options.table.replace('_', ' ')} updated`);
          }

          // Custom handler
          options.onUpdate?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: options.table,
        },
        (payload) => {
          console.log(`[Real-time] DELETE on ${options.table}:`, payload);

          // Remove the item from cache
          queryClient.setQueryData(options.queryKey, (old: any) => {
            if (!old || !old.data) return old;

            return {
              ...old,
              data: old.data.filter((item: any) => item.id !== payload.old.id),
            };
          });

          // Show notification
          if (options.showNotifications) {
            toast.info(`${options.table.replace('_', ' ')} deleted`);
          }

          // Custom handler
          options.onDelete?.(payload);
        }
      )
      .subscribe((status) => {
        console.log(`[Real-time] Subscription status for ${options.table}:`, status);
      });

    // Cleanup subscription
    return () => {
      channel.unsubscribe();
    };
  }, [options.table, options.queryKey, options.showNotifications]);
}

/**
 * Real-time subscription for tasks
 */
export function useRealtimeTasks(showNotifications = true) {
  useRealtimeSubscription({
    table: 'tasks',
    queryKey: ['tasks'],
    showNotifications,
  });
}

/**
 * Real-time subscription for disciplinary matters
 */
export function useRealtimeDisciplinaryMatters(showNotifications = true) {
  useRealtimeSubscription({
    table: 'disciplinary_matters',
    queryKey: ['disciplinary-matters'],
    showNotifications,
  });
}

/**
 * Real-time subscription for task comments
 */
export function useRealtimeTaskComments(taskId: string, showNotifications = false) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!taskId) return;

    const channel = supabase
      .channel(`task-comments:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          console.log('[Real-time] Task comment change:', payload);

          // Invalidate comments query
          queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });

          if (showNotifications && payload.eventType === 'INSERT') {
            toast.info('New comment added');
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [taskId, showNotifications, queryClient]);
}

/**
 * Real-time subscription for disciplinary comments
 */
export function useRealtimeDisciplinaryComments(matterId: string, showNotifications = false) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!matterId) return;

    const channel = supabase
      .channel(`disciplinary-comments:${matterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'disciplinary_comments',
          filter: `incident_id=eq.${matterId}`,
        },
        (payload) => {
          console.log('[Real-time] Disciplinary comment change:', payload);

          // Invalidate comments query
          queryClient.invalidateQueries({ queryKey: ['disciplinary-comments', matterId] });

          if (showNotifications && payload.eventType === 'INSERT') {
            toast.info('New comment added');
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [matterId, showNotifications, queryClient]);
}
