'use client';

import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { TimelineView } from '@/components/certifications/TimelineView';
import { ArrowLeft } from 'lucide-react';

export default function PilotCertificationTimelinePage() {
  const params = useParams();
  const router = useRouter();
  const pilotId = params.id as string;

  return (
    <ProtectedRoute>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.push(`/dashboard/pilots/${pilotId}`)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pilot Certification Timeline</h1>
              <p className="text-gray-600 mt-1">
                Visual timeline of all certifications for this pilot
              </p>
            </div>
          </div>
        </div>

        {/* Timeline View */}
        <TimelineView pilotId={pilotId} />
      </div>
    </ProtectedRoute>
  );
}
