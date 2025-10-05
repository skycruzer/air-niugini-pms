'use client';

import { StatCard } from '@/components/ui/StatCard';
import { Users, Star, Plane, AlertTriangle } from 'lucide-react';

interface PilotStats {
  total: number;
  captains: number;
  firstOfficers: number;
  trainingCaptains?: number;
  examiners?: number;
  active?: number;
  expiredCertifications?: number;
}

interface PilotStatsGridProps {
  stats: PilotStats;
  variant?: 'detailed' | 'summary';
  showTrends?: boolean;
  trends?: {
    pilots?: number;
    certifications?: number;
  };
}

/**
 * Shared component for displaying pilot statistics
 * Consolidates duplicate pilot stats displays across dashboard and pilots page
 *
 * @param stats - Pilot statistics object
 * @param variant - 'detailed' shows all metrics including TRI/TRE, 'summary' shows core metrics only
 * @param showTrends - Whether to display trend indicators (dashboard only)
 * @param trends - Optional trend data for dashboard display
 */
export function PilotStatsGrid({
  stats,
  variant = 'summary',
  showTrends = false,
  trends
}: PilotStatsGridProps) {

  if (variant === 'detailed') {
    // Detailed view for pilots page with full breakdown
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Pilots"
          value={stats.total}
          subtitle={`${stats.active || stats.total} active`}
          icon={Users}
          variant="primary"
          animated
        />

        <StatCard
          title="Captains"
          value={stats.captains}
          subtitle={
            stats.trainingCaptains ? (
              <div className="space-y-1">
                <div>• {stats.trainingCaptains} Training (TRI)</div>
                {stats.examiners && <div>• {stats.examiners} Examiners (TRE)</div>}
              </div>
            ) : 'Command crew'
          }
          icon={Star}
          variant="secondary"
          animated
        />

        <StatCard
          title="First Officers"
          value={stats.firstOfficers}
          subtitle="Co-pilot crew"
          icon={Plane}
          variant="success"
          animated
        />

        {stats.expiredCertifications !== undefined && (
          <StatCard
            title="Expired Certs"
            value={stats.expiredCertifications}
            subtitle="Requires attention"
            icon={AlertTriangle}
            variant="error"
            animated
          />
        )}
      </div>
    );
  }

  // Summary view for dashboard or compact displays
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        title="Total Pilots"
        value={stats.total}
        subtitle={`${stats.captains} Captains • ${stats.firstOfficers} First Officers`}
        icon={Users}
        variant="primary"
        trend={showTrends && trends?.pilots ? {
          value: Math.abs(trends.pilots),
          direction: trends.pilots >= 0 ? 'up' : 'down',
          label: 'vs last period'
        } : undefined}
        animated
      />

      <StatCard
        title="Captains"
        value={stats.captains}
        subtitle={stats.trainingCaptains ? `${stats.trainingCaptains} TRI certified` : 'Command crew'}
        icon={Star}
        variant="secondary"
        animated
      />

      <StatCard
        title="First Officers"
        value={stats.firstOfficers}
        subtitle="Co-pilot crew"
        icon={Plane}
        variant="success"
        animated
      />
    </div>
  );
}
