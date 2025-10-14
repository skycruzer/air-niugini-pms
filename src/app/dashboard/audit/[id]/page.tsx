/**
 * AUDIT LOG DETAIL PAGE
 *
 * Detailed view of a single audit log entry with complete metadata,
 * change history, and related audit entries.
 *
 * Features:
 * - Complete audit log details
 * - JSON diff viewer
 * - Related audit entries timeline
 * - Admin-only access control
 * - Air Niugini branding
 *
 * Part of Phase 4.2: Comprehensive Audit Logging UI
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { permissions } from '@/lib/auth-utils';
import { getAuditLogById, AuditLog } from '@/lib/audit-log-service';
import { AuditLogDetail } from '@/components/audit/AuditLogDetail';

export default function AuditLogDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const logId = params.id as string;

  const [log, setLog] = useState<AuditLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check admin permission
  useEffect(() => {
    if (user && !permissions.canCreate(user)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Load audit log
  useEffect(() => {
    const loadLog = async () => {
      if (!logId) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await getAuditLogById(logId);
        if (data) {
          setLog(data);
        } else {
          setError('Audit log not found');
        }
      } catch (error) {
        console.error('Error loading audit log:', error);
        setError('Failed to load audit log details');
      } finally {
        setIsLoading(false);
      }
    };

    loadLog();
  }, [logId]);

  const handleClose = () => {
    router.push('/dashboard/audit');
  };

  // Render unauthorized state
  if (user && !permissions.canCreate(user)) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={handleClose}
              className="flex items-center text-[#4F46E5] hover:text-[#4338CA] font-medium transition-colors"
            >
              <span className="mr-2">←</span>
              Back to Audit Logs
            </button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="card text-center py-12">
              <div className="animate-spin text-6xl mb-4">⏳</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Audit Log...</h3>
              <p className="text-gray-600">Please wait while we fetch the details.</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">❌</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Audit Log</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleClose}
                className="btn bg-[#4F46E5] text-white hover:bg-[#4338CA]"
              >
                Return to Audit Logs
              </button>
            </div>
          )}

          {/* Audit Log Detail */}
          {log && !isLoading && !error && <AuditLogDetail log={log} onClose={handleClose} />}
        </div>
    </ProtectedRoute>
  );
}
