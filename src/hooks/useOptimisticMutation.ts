/**
 * @fileoverview Optimistic Mutation Hook
 * Provides optimistic updates for mutations with automatic rollback on failure
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-07
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

interface OptimisticMutationOptions<TData, TError, TVariables, TContext> {
  // Query key to update optimistically
  queryKey: unknown[];

  // Mutation function
  mutationFn: (variables: TVariables) => Promise<TData>;

  // Optimistic updater function - returns the new data
  onMutate?: (variables: TVariables) => TContext;

  // Success callback
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void;

  // Error callback
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void;

  // Success message
  successMessage?: string;

  // Error message
  errorMessage?: string;

  // Whether to show toast notifications
  showToast?: boolean;
}

export function useOptimisticMutation<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  options: OptimisticMutationOptions<TData, TError, TVariables, TContext>
) {
  const queryClient = useQueryClient();

  const mutation = useMutation<TData, TError, TVariables, TContext>({
    mutationFn: options.mutationFn,

    // Optimistic update before mutation
    onMutate: async (variables) => {
      // Cancel outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: options.queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(options.queryKey);

      // Call custom onMutate if provided
      const context = options.onMutate?.(variables);

      // Return context object with snapshotted value
      return { previousData, ...context } as TContext;
    },

    // On success, invalidate and refetch
    onSuccess: (data, variables, context) => {
      // Invalidate queries to refetch with real data
      queryClient.invalidateQueries({ queryKey: options.queryKey });

      // Show success toast
      if (options.showToast !== false && options.successMessage) {
        toast.success(options.successMessage);
      }

      // Call custom onSuccess
      options.onSuccess?.(data, variables, context);
    },

    // On error, rollback to snapshot
    onError: (error, variables, context) => {
      // Rollback to previous data
      if (context && 'previousData' in context) {
        queryClient.setQueryData(options.queryKey, (context as any).previousData);
      }

      // Show error toast
      if (options.showToast !== false) {
        const errorMessage = options.errorMessage || 'An error occurred. Changes have been reverted.';
        toast.error(errorMessage);
      }

      // Call custom onError
      options.onError?.(error, variables, context);
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: options.queryKey });
    },
  });

  return mutation;
}

/**
 * Optimistic update for task status changes
 */
export function useOptimisticTaskUpdate() {
  return useOptimisticMutation({
    queryKey: ['tasks'],
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<any> }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      return response.json();
    },
    onMutate: ({ taskId, updates }) => {
      // Optimistically update the task in the cache
      const queryClient = useQueryClient();
      queryClient.setQueryData(['tasks'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data?.map((task: any) =>
            task.id === taskId ? { ...task, ...updates, updated_at: new Date().toISOString() } : task
          ),
        };
      });
    },
    successMessage: 'Task updated successfully',
    errorMessage: 'Failed to update task',
  });
}

/**
 * Optimistic update for disciplinary matter status changes
 */
export function useOptimisticDisciplinaryUpdate() {
  return useOptimisticMutation({
    queryKey: ['disciplinary-matters'],
    mutationFn: async ({ matterId, updates }: { matterId: string; updates: Partial<any> }) => {
      const response = await fetch(`/api/disciplinary/${matterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update disciplinary matter');
      }

      return response.json();
    },
    onMutate: ({ matterId, updates }) => {
      // Optimistically update the matter in the cache
      const queryClient = useQueryClient();
      queryClient.setQueryData(['disciplinary-matters'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data?.map((matter: any) =>
            matter.id === matterId ? { ...matter, ...updates, updated_at: new Date().toISOString() } : matter
          ),
        };
      });
    },
    successMessage: 'Disciplinary matter updated successfully',
    errorMessage: 'Failed to update disciplinary matter',
  });
}
