'use client';

/**
 * OfflineDataView Component
 * Shows cached data when offline with clear indicators
 * Displays last updated timestamp and sync status
 */

import { useState, useEffect } from 'react';
import { WifiOff, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface OfflineDataViewProps {
  /** Data to display */
  data: any[];
  /** Last updated timestamp */
  lastUpdated?: Date | null;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Whether to show offline indicator */
  showOfflineIndicator?: boolean;
}

export function OfflineDataView({
  data,
  lastUpdated,
  isLoading = false,
  error = null,
  onRetry,
  emptyMessage = 'No data available',
  showOfflineIndicator = true,
}: OfflineDataViewProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show offline banner if offline and showing indicator
  const showBanner = !isOnline && showOfflineIndicator;

  return (
    <div className="space-y-4">
      {/* Offline/Cached Data Banner */}
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg"
        >
          <div className="flex items-start gap-3">
            <WifiOff className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-900 mb-1">Viewing Cached Data</h4>
              <p className="text-sm text-amber-800 mb-2">
                You're currently offline. The data shown may not be up to date.
              </p>
              {lastUpdated && (
                <div className="flex items-center gap-2 text-xs text-amber-700">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}</span>
                </div>
              )}
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                aria-label="Retry loading"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Last Updated Info (when online) */}
      {isOnline && lastUpdated && !isLoading && (
        <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-[#4F46E5] hover:text-[#4338CA] font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-900 mb-1">Error Loading Data</h4>
              <p className="text-sm text-red-800 mb-2">
                {error.message || 'Failed to load data. Please try again.'}
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && !error && data.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-600 text-sm">{emptyMessage}</p>
          {!isOnline && (
            <p className="text-neutral-500 text-xs mt-2">Connect to internet to load data</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Cached Data Badge
 * Shows when data is from cache
 */
export function CachedDataBadge({ lastUpdated }: { lastUpdated: Date }) {
  return (
    <div className="inline-flex items-center gap-2 bg-neutral-100 text-neutral-700 px-3 py-1.5 rounded-full text-xs font-medium">
      <div className="w-2 h-2 bg-neutral-400 rounded-full" />
      <span>Cached</span>
      <span className="text-neutral-500">•</span>
      <span>{formatDistanceToNow(lastUpdated, { addSuffix: true })}</span>
    </div>
  );
}

/**
 * Stale Data Warning
 * Shows when data hasn't been updated in a while
 */
export function StaleDataWarning({
  lastUpdated,
  staleAfterMinutes = 5,
  onRefresh,
}: {
  lastUpdated: Date;
  staleAfterMinutes?: number;
  onRefresh?: () => void;
}) {
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    const checkStale = () => {
      const minutesAgo = (Date.now() - lastUpdated.getTime()) / 1000 / 60;
      setIsStale(minutesAgo > staleAfterMinutes);
    };

    // Initial check
    checkStale();

    // Check every minute
    const interval = setInterval(checkStale, 60000);

    return () => clearInterval(interval);
  }, [lastUpdated, staleAfterMinutes]);

  if (!isStale) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="bg-blue-50 border border-blue-200 rounded-lg p-3"
    >
      <div className="flex items-start gap-3">
        <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-blue-800">
            This data may be outdated. Last updated{' '}
            {formatDistanceToNow(lastUpdated, { addSuffix: true })}.
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        )}
      </div>
    </motion.div>
  );
}
