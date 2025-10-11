/**
 * Lazy-loaded components index
 *
 * Centralizes all lazy-loaded components for better code splitting
 * Each component is loaded on-demand, reducing initial bundle size
 *
 * Usage:
 * import { LazyPilotAddModal } from '@/components/lazy'
 * <LazyLoader type="modal"><LazyPilotAddModal /></LazyLoader>
 */

import { lazy } from 'react';

// ============================================================================
// MODAL COMPONENTS - Heavy components loaded on user action
// ============================================================================

export const LazyPilotAddModal = lazy(() =>
  import('@/components/pilots/PilotAddModal').then((mod) => ({ default: mod.PilotAddModal }))
);

export const LazyPilotEditModal = lazy(() =>
  import('@/components/pilots/PilotEditModal').then((mod) => ({ default: mod.PilotEditModal }))
);

export const LazyBulkCertificationModal = lazy(() =>
  import('@/components/certifications/BulkCertificationModal').then((mod) => ({
    default: mod.BulkCertificationModal,
  }))
);

export const LazyLeaveRequestModal = lazy(() =>
  import('@/components/leave/LeaveRequestModal').then((mod) => ({ default: mod.LeaveRequestModal }))
);

export const LazyLeaveRequestEditModal = lazy(() =>
  import('@/components/leave/LeaveRequestEditModal').then((mod) => ({
    default: mod.LeaveRequestEditModal,
  }))
);

export const LazyLeaveRequestReviewModal = lazy(() =>
  import('@/components/leave/LeaveRequestReviewModal').then((mod) => ({
    default: mod.LeaveRequestReviewModal,
  }))
);

export const LazyLeaveBidModal = lazy(() =>
  import('@/components/leave/LeaveBidModal').then((mod) => ({
    default: mod.LeaveBidModal,
  }))
);

export const LazyRetirementReportModal = lazy(() =>
  import('@/components/reports/RetirementReportModal').then((mod) => ({
    default: mod.RetirementReportModal,
  }))
);

// ============================================================================
// CHART COMPONENTS - Heavy visualization libraries
// ============================================================================

export const LazyExpiryTrendChart = lazy(() =>
  import('@/components/charts/ExpiryTrendChart').then((mod) => ({ default: mod.ExpiryTrendChart }))
);

export const LazyPilotDistributionChart = lazy(() =>
  import('@/components/charts/PilotDistributionChart').then((mod) => ({
    default: mod.PilotDistributionChart,
  }))
);

export const LazyCertificationStatusChart = lazy(() =>
  import('@/components/charts/CertificationStatusChart').then((mod) => ({
    default: mod.CertificationStatusChart,
  }))
);

export const LazyComplianceGaugeChart = lazy(() =>
  import('@/components/shared/charts/ComplianceGaugeChart').then((mod) => ({
    default: mod.ComplianceGaugeChart,
  }))
);

// ============================================================================
// COMMAND PALETTE - Only loaded when user triggers keyboard shortcut
// ============================================================================

export const LazyCommandPalette = lazy(() =>
  import('@/components/command/CommandPalette').then((mod) => ({ default: mod.CommandPalette }))
);

// ============================================================================
// ANALYTICS DASHBOARD - Heavy data visualization page
// ============================================================================

export const LazyAnalyticsDashboard = lazy(() =>
  import('@/components/analytics/AnalyticsDashboard').then((mod) => ({
    default: mod.AnalyticsDashboard,
  }))
);

// ============================================================================
// CALENDAR COMPONENTS - Heavy interactive components
// ============================================================================

export const LazyCertificationCalendar = lazy(() =>
  import('@/components/calendar/CertificationCalendar').then((mod) => ({
    default: mod.CertificationCalendar,
  }))
);

export const LazyLeaveCalendar = lazy(() =>
  import('@/components/calendar/LeaveCalendar').then((mod) => ({ default: mod.LeaveCalendar }))
);

export const LazyInteractiveRosterCalendar = lazy(() =>
  import('@/components/leave/InteractiveRosterCalendar').then((mod) => ({
    default: mod.InteractiveRosterCalendar,
  }))
);

// ============================================================================
// TIMELINE COMPONENTS - Complex visualization components
// ============================================================================

export const LazyTimelineView = lazy(() =>
  import('@/components/certifications/TimelineView').then((mod) => ({ default: mod.TimelineView }))
);

export const LazyFleetTimelineView = lazy(() =>
  import('@/components/certifications/FleetTimelineView').then((mod) => ({
    default: mod.FleetTimelineView,
  }))
);

export const LazyCategoryTimelineView = lazy(() =>
  import('@/components/certifications/CategoryTimelineView').then((mod) => ({
    default: mod.CategoryTimelineView,
  }))
);

// ============================================================================
// APPROVAL WORKFLOW - Complex interactive components
// ============================================================================

export const LazyLeaveApprovalWorkflow = lazy(() =>
  import('@/components/leave/LeaveApprovalWorkflow').then((mod) => ({
    default: mod.LeaveApprovalWorkflow,
  }))
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Preload a lazy component to improve perceived performance
 * Call this on hover or user intent signals
 */
export function preloadComponent(component: ReturnType<typeof lazy>): void {
  // TypeScript trick to access the preload method
  const componentWithPreload = component as any;
  if (componentWithPreload._payload) {
    componentWithPreload._payload._result?.();
  }
}

/**
 * Preload multiple components at once
 */
export function preloadComponents(components: Array<ReturnType<typeof lazy>>): void {
  components.forEach(preloadComponent);
}
