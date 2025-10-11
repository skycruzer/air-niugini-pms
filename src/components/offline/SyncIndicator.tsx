'use client';

/**
 * SyncIndicator Component
 * Shows background sync status and pending changes queue
 * Allows manual sync trigger
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { getSyncQueue, processSyncQueue, type SyncQueueItem } from '@/lib/optimistic-updates';
import { useQueryClient } from '@tanstack/react-query';

export function SyncIndicator() {
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Load initial queue
    setQueue(getSyncQueue());

    // Listen for queue updates
    const handleQueueUpdate = (event: CustomEvent) => {
      setQueue(event.detail.queue);
    };

    window.addEventListener('sync-queue-updated', handleQueueUpdate as EventListener);

    return () => {
      window.removeEventListener('sync-queue-updated', handleQueueUpdate as EventListener);
    };
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await processSyncQueue(queryClient);
      setQueue(getSyncQueue()); // Refresh queue
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Don't show if queue is empty
  if (queue.length === 0) return null;

  return (
    <>
      {/* Compact Indicator */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed bottom-6 right-6 z-40 bg-[#4F46E5] text-white p-4 rounded-full shadow-lg hover:bg-[#4338CA] transition-colors"
        aria-label={`${queue.length} pending changes`}
      >
        <div className="relative">
          <Upload className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 bg-[#06B6D4] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {queue.length}
          </span>
        </div>
      </motion.button>

      {/* Expanded View */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-[#4F46E5] text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5" />
                  <div>
                    <h3 className="font-semibold">Pending Sync</h3>
                    <p className="text-xs text-white/90">{queue.length} changes waiting</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Queue List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                            {item.operation}
                          </span>
                          <span className="text-xs text-neutral-500">{item.resource}</span>
                        </div>
                        <p className="text-sm text-neutral-700">{getOperationDescription(item)}</p>
                      </div>
                      {item.retryCount > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Retry {item.retryCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="border-t border-neutral-200 p-4 space-y-3">
                {!navigator.onLine && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800">
                      You're offline. Changes will sync automatically when connection is restored.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSync}
                  disabled={isSyncing || !navigator.onLine}
                  className="w-full flex items-center justify-center gap-2 bg-[#4F46E5] text-white px-4 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4338CA] transition-colors"
                >
                  <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>

                <p className="text-xs text-center text-neutral-500">
                  {navigator.onLine
                    ? 'Click to manually sync pending changes'
                    : 'Connect to internet to sync'}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Get a human-readable description of the operation
 */
function getOperationDescription(item: SyncQueueItem): string {
  const { operation, resource, data } = item;

  switch (resource) {
    case 'pilot':
      if (operation === 'create') {
        return `Create new pilot: ${data.first_name} ${data.last_name}`;
      } else if (operation === 'update') {
        return `Update pilot ${data.first_name || data.id}`;
      } else if (operation === 'delete') {
        return `Delete pilot ${data.id}`;
      }
      break;

    case 'certification':
      if (operation === 'update') {
        return `Update certification for pilot`;
      }
      break;

    case 'leave':
      if (operation === 'create') {
        return `Create leave request`;
      } else if (operation === 'update') {
        return `Update leave request`;
      }
      break;
  }

  return `${operation} ${resource}`;
}

/**
 * Compact Sync Badge
 * Shows sync status in navigation
 */
export function SyncBadge() {
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Initial count
    setQueueCount(getSyncQueue().length);

    // Listen for queue updates
    const handleQueueUpdate = (event: CustomEvent) => {
      setQueueCount(event.detail.queue.length);
    };

    // Listen for sync start
    const handleSyncStart = () => setIsSyncing(true);
    const handleSyncEnd = () => setIsSyncing(false);

    window.addEventListener('sync-queue-updated', handleQueueUpdate as EventListener);
    window.addEventListener('sync-started', handleSyncStart);
    window.addEventListener('sync-completed', handleSyncEnd);

    return () => {
      window.removeEventListener('sync-queue-updated', handleQueueUpdate as EventListener);
      window.removeEventListener('sync-started', handleSyncStart);
      window.removeEventListener('sync-completed', handleSyncEnd);
    };
  }, []);

  if (queueCount === 0 && !isSyncing) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-xs font-medium"
    >
      {isSyncing ? (
        <>
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Syncing...</span>
        </>
      ) : (
        <>
          <Upload className="w-3 h-3" />
          <span>{queueCount} pending</span>
        </>
      )}
    </motion.div>
  );
}
