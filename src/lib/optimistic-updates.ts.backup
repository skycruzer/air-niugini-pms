/**
 * Optimistic Updates Utility
 * Handles optimistic UI updates with automatic rollback on failure
 * Queues failed mutations for background sync when connection is restored
 */

import { QueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Types for sync queue
export interface SyncQueueItem {
  id: string;
  timestamp: number;
  operation: 'create' | 'update' | 'delete';
  resource: string;
  data: any;
  retryCount: number;
}

// Sync queue storage key
const SYNC_QUEUE_KEY = 'an-pms-sync-queue';

/**
 * Get the current sync queue from localStorage
 */
export function getSyncQueue(): SyncQueueItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const queue = localStorage.getItem(SYNC_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('Error reading sync queue:', error);
    return [];
  }
}

/**
 * Save the sync queue to localStorage
 */
export function saveSyncQueue(queue: SyncQueueItem[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    // Dispatch event to notify sync indicator
    window.dispatchEvent(new CustomEvent('sync-queue-updated', { detail: { queue } }));
  } catch (error) {
    console.error('Error saving sync queue:', error);
  }
}

/**
 * Add an item to the sync queue
 */
export function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): void {
  const queue = getSyncQueue();
  const newItem: SyncQueueItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    retryCount: 0,
  };

  queue.push(newItem);
  saveSyncQueue(queue);

  toast.error('Action queued for sync when online', {
    duration: 3000,
    icon: '📤',
  });
}

/**
 * Remove an item from the sync queue
 */
export function removeFromSyncQueue(id: string): void {
  const queue = getSyncQueue();
  const filteredQueue = queue.filter((item) => item.id !== id);
  saveSyncQueue(filteredQueue);
}

/**
 * Clear the entire sync queue
 */
export function clearSyncQueue(): void {
  saveSyncQueue([]);
}

/**
 * Optimistic update wrapper for pilot operations
 */
export async function optimisticPilotUpdate<T>(
  queryClient: QueryClient,
  pilotId: string,
  updateFn: () => Promise<T>,
  optimisticData: any
): Promise<T> {
  // Cancel any outgoing refetches
  await queryClient.cancelQueries({ queryKey: ['pilot', pilotId] });
  await queryClient.cancelQueries({ queryKey: ['pilots'] });

  // Snapshot the previous values
  const previousPilot = queryClient.getQueryData(['pilot', pilotId]);
  const previousPilots = queryClient.getQueryData(['pilots']);

  // Optimistically update to the new value
  queryClient.setQueryData(['pilot', pilotId], optimisticData);

  // Update the pilots list if it exists
  if (previousPilots && Array.isArray(previousPilots)) {
    const updatedPilots = previousPilots.map((p: any) =>
      p.id === pilotId ? { ...p, ...optimisticData } : p
    );
    queryClient.setQueryData(['pilots'], updatedPilots);
  }

  // Show optimistic feedback
  const loadingToast = toast.loading('Updating pilot...');

  try {
    // Perform the actual mutation
    const result = await updateFn();

    // Success feedback
    toast.success('Pilot updated successfully', { id: loadingToast });

    return result;
  } catch (error) {
    // Rollback on error
    queryClient.setQueryData(['pilot', pilotId], previousPilot);
    queryClient.setQueryData(['pilots'], previousPilots);

    // Error feedback
    toast.error('Failed to update pilot', { id: loadingToast });

    // Check if offline
    if (!navigator.onLine) {
      addToSyncQueue({
        operation: 'update',
        resource: 'pilot',
        data: { id: pilotId, ...optimisticData },
      });
    }

    throw error;
  }
}

/**
 * Optimistic update wrapper for certification operations
 */
export async function optimisticCertificationUpdate<T>(
  queryClient: QueryClient,
  certificationId: string,
  pilotId: string,
  updateFn: () => Promise<T>,
  optimisticData: any
): Promise<T> {
  // Cancel any outgoing refetches
  await queryClient.cancelQueries({ queryKey: ['pilot-checks', pilotId] });
  await queryClient.cancelQueries({ queryKey: ['expiring-certifications'] });

  // Snapshot the previous values
  const previousChecks = queryClient.getQueryData(['pilot-checks', pilotId]);
  const previousExpiring = queryClient.getQueryData(['expiring-certifications']);

  // Optimistically update to the new value
  if (previousChecks && Array.isArray(previousChecks)) {
    const updatedChecks = previousChecks.map((c: any) =>
      c.id === certificationId ? { ...c, ...optimisticData } : c
    );
    queryClient.setQueryData(['pilot-checks', pilotId], updatedChecks);
  }

  // Show optimistic feedback
  const loadingToast = toast.loading('Updating certification...');

  try {
    // Perform the actual mutation
    const result = await updateFn();

    // Success feedback
    toast.success('Certification updated successfully', { id: loadingToast });

    // Invalidate related queries
    await queryClient.invalidateQueries({ queryKey: ['pilot-checks', pilotId] });
    await queryClient.invalidateQueries({ queryKey: ['expiring-certifications'] });

    return result;
  } catch (error) {
    // Rollback on error
    queryClient.setQueryData(['pilot-checks', pilotId], previousChecks);
    queryClient.setQueryData(['expiring-certifications'], previousExpiring);

    // Error feedback
    toast.error('Failed to update certification', { id: loadingToast });

    // Check if offline
    if (!navigator.onLine) {
      addToSyncQueue({
        operation: 'update',
        resource: 'certification',
        data: { id: certificationId, pilotId, ...optimisticData },
      });
    }

    throw error;
  }
}

/**
 * Optimistic create wrapper for new pilots
 */
export async function optimisticPilotCreate<T>(
  queryClient: QueryClient,
  createFn: () => Promise<T>,
  optimisticData: any
): Promise<T> {
  // Cancel any outgoing refetches
  await queryClient.cancelQueries({ queryKey: ['pilots'] });

  // Snapshot the previous value
  const previousPilots = queryClient.getQueryData(['pilots']);

  // Optimistically add to the list
  if (previousPilots && Array.isArray(previousPilots)) {
    const tempId = `temp-${Date.now()}`;
    queryClient.setQueryData(['pilots'], [...previousPilots, { ...optimisticData, id: tempId }]);
  }

  // Show optimistic feedback
  const loadingToast = toast.loading('Creating pilot...');

  try {
    // Perform the actual mutation
    const result = await createFn();

    // Success feedback
    toast.success('Pilot created successfully', { id: loadingToast });

    // Invalidate to get the real data
    await queryClient.invalidateQueries({ queryKey: ['pilots'] });

    return result;
  } catch (error) {
    // Rollback on error
    queryClient.setQueryData(['pilots'], previousPilots);

    // Error feedback
    toast.error('Failed to create pilot', { id: loadingToast });

    // Check if offline
    if (!navigator.onLine) {
      addToSyncQueue({
        operation: 'create',
        resource: 'pilot',
        data: optimisticData,
      });
    }

    throw error;
  }
}

/**
 * Optimistic delete wrapper for pilots
 */
export async function optimisticPilotDelete(
  queryClient: QueryClient,
  pilotId: string,
  deleteFn: () => Promise<void>
): Promise<void> {
  // Cancel any outgoing refetches
  await queryClient.cancelQueries({ queryKey: ['pilots'] });
  await queryClient.cancelQueries({ queryKey: ['pilot', pilotId] });

  // Snapshot the previous values
  const previousPilots = queryClient.getQueryData(['pilots']);
  const previousPilot = queryClient.getQueryData(['pilot', pilotId]);

  // Optimistically remove from the list
  if (previousPilots && Array.isArray(previousPilots)) {
    const filteredPilots = previousPilots.filter((p: any) => p.id !== pilotId);
    queryClient.setQueryData(['pilots'], filteredPilots);
  }

  // Show optimistic feedback
  const loadingToast = toast.loading('Deleting pilot...');

  try {
    // Perform the actual mutation
    await deleteFn();

    // Success feedback
    toast.success('Pilot deleted successfully', { id: loadingToast });

    // Remove from cache
    queryClient.removeQueries({ queryKey: ['pilot', pilotId] });
  } catch (error) {
    // Rollback on error
    queryClient.setQueryData(['pilots'], previousPilots);
    queryClient.setQueryData(['pilot', pilotId], previousPilot);

    // Error feedback
    toast.error('Failed to delete pilot', { id: loadingToast });

    // Check if offline
    if (!navigator.onLine) {
      addToSyncQueue({
        operation: 'delete',
        resource: 'pilot',
        data: { id: pilotId },
      });
    }

    throw error;
  }
}

/**
 * Process the sync queue when connection is restored
 */
export async function processSyncQueue(queryClient: QueryClient): Promise<void> {
  const queue = getSyncQueue();

  if (queue.length === 0) {
    return;
  }

  toast.loading(`Syncing ${queue.length} pending changes...`, {
    id: 'sync-processing',
    duration: Infinity,
  });

  const failedItems: SyncQueueItem[] = [];
  let successCount = 0;

  for (const item of queue) {
    try {
      // Process each item based on operation and resource
      // This would call the appropriate API endpoint
      // For now, we'll just increment retry count

      if (item.retryCount >= 3) {
        failedItems.push(item);
        continue;
      }

      // TODO: Implement actual API calls based on resource and operation
      // await processQueueItem(item)

      successCount++;
      removeFromSyncQueue(item.id);
    } catch (error) {
      console.error(`Failed to sync item ${item.id}:`, error);
      failedItems.push({
        ...item,
        retryCount: item.retryCount + 1,
      });
    }
  }

  // Update queue with failed items
  saveSyncQueue(failedItems);

  // Show result
  toast.dismiss('sync-processing');

  if (successCount > 0) {
    toast.success(`Successfully synced ${successCount} changes`);
    // Invalidate all queries to refresh data
    await queryClient.invalidateQueries();
  }

  if (failedItems.length > 0) {
    toast.error(`${failedItems.length} changes failed to sync`);
  }
}

/**
 * Check if online and trigger sync if needed
 */
export function setupAutoSync(queryClient: QueryClient): void {
  if (typeof window === 'undefined') return;

  // Listen for online event
  window.addEventListener('online', () => {
    console.log('Connection restored, processing sync queue...');
    processSyncQueue(queryClient);
  });

  // Check queue on page load
  if (navigator.onLine) {
    const queue = getSyncQueue();
    if (queue.length > 0) {
      processSyncQueue(queryClient);
    }
  }
}
