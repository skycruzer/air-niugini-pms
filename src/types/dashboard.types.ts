/**
 * @fileoverview Dashboard-Specific Types for Air Niugini B767 PMS
 * Types for dashboard components, widgets, and real-time updates
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-30
 */

/**
 * Dashboard card/widget data
 */
export interface DashboardCard {
  /** Unique card identifier */
  id: string;
  /** Card title */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Subtitle or description */
  subtitle?: string;
  /** Icon name */
  icon?: string;
  /** Card color theme */
  color?: 'red' | 'gold' | 'green' | 'blue' | 'gray';
  /** Trend indicator */
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: number;
    label: string;
  };
  /** Click handler */
  onClick?: () => void;
  /** Whether card is loading */
  isLoading?: boolean;
}

/**
 * Pilot statistics for dashboard
 */
export interface PilotStatistics {
  /** Total number of pilots */
  total: number;
  /** Number of active pilots */
  active: number;
  /** Number of inactive pilots */
  inactive: number;
  /** Number of captains */
  captains: number;
  /** Number of first officers */
  firstOfficers: number;
  /** Number of training captains */
  trainingCaptains: number;
  /** Number of examiners */
  examiners: number;
  /** Number of line captains */
  lineCaptains: number;
  /** Average age */
  averageAge: number;
  /** Average seniority (years) */
  averageSeniority: number;
}

/**
 * Certification statistics for dashboard
 */
export interface CertificationStatistics {
  /** Total certifications */
  total: number;
  /** Current (valid) certifications */
  current: number;
  /** Expiring soon */
  expiring: number;
  /** Expired certifications */
  expired: number;
  /** Overall compliance rate (percentage) */
  complianceRate: number;
  /** Breakdown by expiry timeframe */
  expiryBreakdown: {
    next7Days: number;
    next14Days: number;
    next30Days: number;
    next60Days: number;
    next90Days: number;
  };
  /** Breakdown by category */
  categoryBreakdown: Array<{
    category: string;
    total: number;
    current: number;
    expiring: number;
    expired: number;
  }>;
}

/**
 * Leave statistics for dashboard
 */
export interface LeaveStatistics {
  /** Total leave requests */
  totalRequests: number;
  /** Pending approval */
  pending: number;
  /** Approved requests */
  approved: number;
  /** Denied requests */
  denied: number;
  /** Requests this month */
  thisMonth: number;
  /** Requests last month */
  lastMonth: number;
  /** Breakdown by leave type */
  typeBreakdown: {
    RDO: number;
    WDO: number;
    Annual: number;
    Sick: number;
    Emergency: number;
  };
  /** Current roster period */
  currentRosterPeriod: string;
}

/**
 * Recent activity item
 */
export interface ActivityItem {
  /** Unique activity ID */
  id: string;
  /** Activity type */
  type: 'pilot' | 'certification' | 'leave' | 'system';
  /** Action performed */
  action: 'created' | 'updated' | 'deleted' | 'approved' | 'denied';
  /** Activity title */
  title: string;
  /** Activity description */
  description: string;
  /** Related entity ID */
  entityId?: string;
  /** Related entity name */
  entityName?: string;
  /** User who performed action */
  performedBy?: string;
  /** Activity timestamp */
  timestamp: Date;
  /** Icon for activity */
  icon?: string;
  /** Color for activity badge */
  color?: string;
}

/**
 * Alert/notification for dashboard
 */
export interface DashboardAlert {
  /** Unique alert ID */
  id: string;
  /** Alert severity */
  severity: 'info' | 'warning' | 'error' | 'critical';
  /** Alert type */
  type:
    | 'certification_expiry'
    | 'pilot_retirement'
    | 'compliance_issue'
    | 'system'
    | 'leave_pending';
  /** Alert title */
  title: string;
  /** Alert message */
  message: string;
  /** Number of affected items */
  count: number;
  /** Related entity IDs */
  affectedIds?: string[];
  /** Alert timestamp */
  createdAt: Date;
  /** Whether alert has been acknowledged */
  isAcknowledged: boolean;
  /** Action buttons */
  actions?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
}

/**
 * Expiring certification summary for dashboard
 */
export interface ExpiringCertificationSummary {
  /** Certification ID */
  id: string;
  /** Pilot ID */
  pilotId: string;
  /** Pilot name */
  pilotName: string;
  /** Pilot employee ID */
  employeeId: string;
  /** Pilot role */
  pilotRole: string;
  /** Check type code */
  checkCode: string;
  /** Check type description */
  checkDescription: string;
  /** Check category */
  category: string;
  /** Expiry date */
  expiryDate: Date;
  /** Days until expiry */
  daysUntilExpiry: number;
  /** Status color */
  statusColor: 'red' | 'yellow' | 'green';
  /** Status label */
  statusLabel: 'Expired' | 'Expiring Soon' | 'Current';
}

/**
 * Pilot summary for dashboard
 */
export interface PilotSummary {
  /** Pilot ID */
  id: string;
  /** Employee ID */
  employeeId: string;
  /** Full name */
  fullName: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Role */
  role: 'Captain' | 'First Officer';
  /** Seniority number */
  seniorityNumber: number | null;
  /** Age */
  age: number | null;
  /** Years of service */
  yearsOfService: number | null;
  /** Active status */
  isActive: boolean;
  /** Certification compliance */
  certificationCompliance: {
    total: number;
    current: number;
    expiring: number;
    expired: number;
    complianceRate: number;
  };
  /** Upcoming retirement */
  upcomingRetirement?: {
    retirementDate: Date;
    daysUntilRetirement: number;
  };
}

/**
 * Fleet readiness overview
 */
export interface FleetReadiness {
  /** Overall readiness percentage */
  overallReadiness: number;
  /** Total pilots */
  totalPilots: number;
  /** Pilots available for duty */
  availablePilots: number;
  /** Pilots on leave */
  pilotsOnLeave: number;
  /** Pilots with certification issues */
  pilotsWithIssues: number;
  /** Current operational capacity */
  operationalCapacity: number;
  /** Minimum required capacity */
  minimumCapacity: number;
  /** Status */
  status: 'optimal' | 'adequate' | 'warning' | 'critical';
}

/**
 * Compliance overview for dashboard
 */
export interface ComplianceOverview {
  /** Overall compliance percentage */
  overallCompliance: number;
  /** Fully compliant pilots */
  fullyCompliant: number;
  /** Pilots with minor issues */
  minorIssues: number;
  /** Pilots with major issues */
  majorIssues: number;
  /** Non-compliant pilots */
  nonCompliant: number;
  /** Compliance status */
  status: 'excellent' | 'good' | 'fair' | 'poor';
  /** Issues by category */
  issuesByCategory: Array<{
    category: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
  }>;
}

/**
 * Chart data for dashboard widgets
 */
export interface DashboardChartData {
  /** Chart type */
  type: 'pie' | 'bar' | 'line' | 'doughnut';
  /** Chart labels */
  labels: string[];
  /** Chart datasets */
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }>;
  /** Chart options */
  options?: Record<string, unknown>;
}

/**
 * Quick action for dashboard
 */
export interface QuickAction {
  /** Action ID */
  id: string;
  /** Action label */
  label: string;
  /** Action description */
  description?: string;
  /** Icon name */
  icon: string;
  /** Link or onClick handler */
  href?: string;
  onClick?: () => void;
  /** Color theme */
  color?: 'red' | 'gold' | 'blue' | 'green';
  /** Whether user has permission */
  hasPermission?: boolean;
}

/**
 * Dashboard widget configuration
 */
export interface DashboardWidget {
  /** Widget ID */
  id: string;
  /** Widget type */
  type: 'stats' | 'chart' | 'list' | 'alerts' | 'activity';
  /** Widget title */
  title: string;
  /** Widget subtitle */
  subtitle?: string;
  /** Widget size */
  size: 'small' | 'medium' | 'large' | 'full';
  /** Widget position (grid order) */
  position: number;
  /** Whether widget is visible */
  isVisible: boolean;
  /** Whether widget is loading */
  isLoading: boolean;
  /** Refresh interval (ms) */
  refreshInterval?: number;
  /** Widget data */
  data: unknown;
}

/**
 * Dashboard layout configuration
 */
export interface DashboardLayout {
  /** Layout ID */
  id: string;
  /** Layout name */
  name: string;
  /** Layout description */
  description?: string;
  /** Widgets in this layout */
  widgets: DashboardWidget[];
  /** Grid configuration */
  grid: {
    columns: number;
    gap: number;
  };
  /** Whether this is the default layout */
  isDefault: boolean;
  /** User ID (for custom layouts) */
  userId?: string;
}

/**
 * Dashboard refresh status
 */
export interface DashboardRefreshStatus {
  /** Whether refresh is in progress */
  isRefreshing: boolean;
  /** Last refresh timestamp */
  lastRefresh: Date | null;
  /** Next scheduled refresh */
  nextRefresh: Date | null;
  /** Auto-refresh enabled */
  autoRefreshEnabled: boolean;
  /** Refresh interval (seconds) */
  refreshInterval: number;
}

/**
 * System status for dashboard
 */
export interface SystemStatus {
  /** Overall system health */
  health: 'healthy' | 'degraded' | 'down';
  /** Database connection status */
  database: 'connected' | 'disconnected' | 'slow';
  /** API status */
  api: 'operational' | 'degraded' | 'down';
  /** Authentication service status */
  auth: 'operational' | 'degraded' | 'down';
  /** Last check timestamp */
  lastCheck: Date;
  /** Response time (ms) */
  responseTime: number;
  /** Error count (last hour) */
  errorCount: number;
}

/**
 * Dashboard filter state
 */
export interface DashboardFilters {
  /** Date range filter */
  dateRange: {
    start: Date | null;
    end: Date | null;
    preset: '7d' | '30d' | '90d' | '1y' | 'custom' | null;
  };
  /** Pilot role filter */
  pilotRole: 'all' | 'Captain' | 'First Officer' | null;
  /** Status filter */
  status: 'all' | 'active' | 'inactive' | null;
  /** Contract type filter */
  contractType: string | null;
  /** Custom filters */
  customFilters: Record<string, string | number | boolean | null>;
}

/**
 * Dashboard data snapshot (for caching)
 */
export interface DashboardSnapshot {
  /** Snapshot timestamp */
  timestamp: Date;
  /** Pilot statistics */
  pilots: PilotStatistics;
  /** Certification statistics */
  certifications: CertificationStatistics;
  /** Leave statistics */
  leave: LeaveStatistics;
  /** Recent activity */
  recentActivity: ActivityItem[];
  /** Active alerts */
  alerts: DashboardAlert[];
  /** Expiring certifications */
  expiringCertifications: ExpiringCertificationSummary[];
  /** Fleet readiness */
  fleetReadiness: FleetReadiness;
  /** Compliance overview */
  compliance: ComplianceOverview;
}
