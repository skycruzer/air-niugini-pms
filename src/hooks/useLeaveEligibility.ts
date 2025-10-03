/**
 * LEAVE ELIGIBILITY HOOK
 *
 * React hook for checking leave request eligibility with automatic
 * re-checking when dates or pilot changes.
 *
 * Usage:
 * const { eligibility, isLoading, checkEligibility, reset } = useLeaveEligibility();
 */

'use client';

import { useState, useEffect } from 'react';
import type { LeaveEligibilityCheck } from '@/lib/leave-eligibility-service';

interface UseLeaveEligibilityProps {
  pilotId?: string;
  pilotRole?: 'Captain' | 'First Officer';
  startDate?: string;
  endDate?: string;
  requestId?: string;
  autoCheck?: boolean; // Automatically check when dependencies change
}

export function useLeaveEligibility(props?: UseLeaveEligibilityProps) {
  const [eligibility, setEligibility] = useState<LeaveEligibilityCheck | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkEligibility = async (params?: {
    pilotId: string;
    pilotRole: 'Captain' | 'First Officer';
    startDate: string;
    endDate: string;
    requestType?: string;
    requestId?: string;
  }) => {
    const checkParams = params || {
      pilotId: props?.pilotId!,
      pilotRole: props?.pilotRole!,
      startDate: props?.startDate!,
      endDate: props?.endDate!,
      requestId: props?.requestId,
    };

    if (
      !checkParams.pilotId ||
      !checkParams.pilotRole ||
      !checkParams.startDate ||
      !checkParams.endDate
    ) {
      setEligibility(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/leave-eligibility/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkParams),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to check eligibility');
      }

      setEligibility(result.data);
      return result.data as LeaveEligibilityCheck;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check eligibility';
      setError(message);
      console.error('Error checking leave eligibility:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setEligibility(null);
    setError(null);
  };

  // Auto-check when dependencies change
  useEffect(() => {
    if (props?.autoCheck && props.pilotId && props.pilotRole && props.startDate && props.endDate) {
      checkEligibility();
    }
  }, [
    props?.autoCheck,
    props?.pilotId,
    props?.pilotRole,
    props?.startDate,
    props?.endDate,
    props?.requestId,
  ]);

  return {
    eligibility,
    isLoading,
    error,
    checkEligibility,
    reset,
  };
}
