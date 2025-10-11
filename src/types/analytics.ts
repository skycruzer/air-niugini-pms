/**
 * @fileoverview Analytics Types for Air Niugini B767 Pilot Management System
 * Comprehensive TypeScript interfaces for dashboard analytics and charting data
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-27
 */

// Air Niugini Brand Colors
export const AIR_NIUGINI_COLORS = {
  primary: '#4F46E5', // Air Niugini Red
  secondary: '#06B6D4', // Air Niugini Gold
  success: '#059669', // Green for current certifications
  warning: '#D97706', // Amber for expiring soon
  danger: '#DC2626', // Red for expired
  info: '#0EA5E9', // Blue for information
  dark: '#1F2937', // Dark gray for text
  light: '#F3F4F6', // Light gray for backgrounds
  white: '#FFFFFF', // White
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
} as const;

// Chart Configuration Types
export interface ChartColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  [key: string]: string;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
      labels?: any;
    };
    title?: {
      display: boolean;
      text: string;
      font?: {
        size: number;
        weight: string;
      };
      color?: string;
    };
    tooltip?: any;
  };
  scales?: any;
  onClick?: (event: any, elements: any) => void;
  onHover?: (event: any, elements: any) => void;
}

// Dashboard Analytics Data Types
export interface PilotAnalytics {
  total: number;
  active: number;
  inactive: number;
  captains: number;
  firstOfficers: number;
  trainingCaptains: number;
  examiners: number;
  lineCaptains: number;
  ageDistribution: {
    under30: number;
    age30to40: number;
    age40to50: number;
    age50to60: number;
    over60: number;
  };
  seniorityDistribution: {
    junior: number; // 0-5 years
    mid: number; // 5-15 years
    senior: number; // 15+ years
  };
  retirementPlanning: {
    retiringIn1Year: number;
    retiringIn2Years: number;
    retiringIn5Years: number;
  };
}

export interface CertificationAnalytics {
  total: number;
  current: number;
  expiring: number;
  expired: number;
  complianceRate: number;
  expiryTimeline: {
    next7Days: number;
    next14Days: number;
    next30Days: number;
    next60Days: number;
    next90Days: number;
  };
  categoryBreakdown: Array<{
    category: string;
    total: number;
    current: number;
    expiring: number;
    expired: number;
  }>;
  checkTypeDistribution: Array<{
    checkType: string;
    count: number;
    pilotsAffected: number;
    averageDaysToExpiry: number;
  }>;
}

export interface LeaveAnalytics {
  totalRequests: number;
  pending: number;
  approved: number;
  denied: number;
  thisMonth: number;
  lastMonth: number;
  trends: {
    monthlyRequests: Array<{
      month: string;
      total: number;
      approved: number;
      denied: number;
    }>;
    seasonalPattern: Array<{
      quarter: string;
      averageRequests: number;
    }>;
  };
  typeBreakdown: {
    RDO: number;
    WDO: number;
    Annual: number;
    Sick: number;
    Emergency: number;
  };
}

export interface FleetAnalytics {
  utilization: number;
  availability: number;
  readiness: number;
  operationalMetrics: {
    totalFlightHours: number;
    averageUtilization: number;
    maintenanceHours: number;
    groundTime: number;
  };
  pilotAvailability: {
    available: number;
    onDuty: number;
    onLeave: number;
    training: number;
    medical: number;
  };
  complianceStatus: {
    fullyCompliant: number;
    minorIssues: number;
    majorIssues: number;
    grounded: number;
  };
}

export interface TrendAnalytics {
  periods: string[];
  pilots: {
    total: number[];
    captains: number[];
    firstOfficers: number[];
  };
  certifications: {
    total: number[];
    expired: number[];
    expiring: number[];
    complianceRate: number[];
  };
  leave: {
    requests: number[];
    approvalRate: number[];
  };
  performance: {
    responseTime: number[];
    systemUptime: number[];
  };
}

export interface RiskAnalytics {
  overallRiskScore: number;
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    impact: number;
    trend: 'improving' | 'stable' | 'worsening';
    description: string;
  }>;
  criticalAlerts: Array<{
    id: string;
    type: 'certification' | 'pilot' | 'compliance' | 'fleet';
    severity: 'high' | 'critical';
    title: string;
    description: string;
    affectedItems: number;
    createdAt: Date;
  }>;
  complianceGaps: Array<{
    category: string;
    missingCount: number;
    pilotsAffected: string[];
    priority: 'low' | 'medium' | 'high';
  }>;
}

// Chart Data Interfaces
export interface PieChartData {
  labels: string[];
  datasets: [
    {
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
      hoverOffset?: number;
    },
  ];
}

export interface BarChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor: string | string[];
    borderWidth: number;
    borderRadius?: number;
  }>;
}

export interface LineChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
    tension: number;
    pointRadius?: number;
    pointHoverRadius?: number;
  }>;
}

export interface DoughnutChartData {
  labels: string[];
  datasets: [
    {
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
      cutout: string;
      hoverOffset?: number;
    },
  ];
}

// Interactive Chart Props
export interface InteractiveChartProps {
  data: any;
  options?: ChartOptions;
  onClick?: (event: any, elements: any) => void;
  onHover?: (event: any, elements: any) => void;
  height?: number;
  width?: number;
  className?: string;
  exportable?: boolean;
  filterable?: boolean;
  title?: string;
  subtitle?: string;
}

// Filter and Export Types
export interface ChartFilter {
  dateRange?: {
    start: Date;
    end: Date;
  };
  pilotRole?: 'all' | 'captain' | 'first_officer' | 'training_captain' | 'examiner';
  certificationStatus?: 'all' | 'current' | 'expiring' | 'expired';
  contractType?: 'all' | 'permanent' | 'contract' | 'training';
  customFilters?: Record<string, any>;
}

export interface ExportOptions {
  format: 'png' | 'jpg' | 'pdf' | 'svg';
  resolution: 'low' | 'medium' | 'high';
  includeTitle: boolean;
  includeSubtitle: boolean;
  backgroundColor: string;
  filename?: string;
}

// Analytics Dashboard Layout
export interface DashboardLayout {
  sections: Array<{
    id: string;
    title: string;
    subtitle?: string;
    component: string;
    size: 'small' | 'medium' | 'large' | 'full';
    order: number;
    visible: boolean;
    refreshInterval?: number;
  }>;
  customization: {
    theme: 'light' | 'dark' | 'air-niugini';
    compactMode: boolean;
    showTrends: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
  };
}

// Real-time Update Types
export interface RealtimeUpdate {
  timestamp: Date;
  type: 'pilot' | 'certification' | 'leave' | 'system';
  action: 'create' | 'update' | 'delete';
  data: any;
  affected: {
    pilots?: string[];
    certifications?: string[];
    charts?: string[];
  };
}

// Performance Monitoring
export interface AnalyticsPerformance {
  chartRenderTime: Record<string, number>;
  dataFetchTime: Record<string, number>;
  cacheHitRate: number;
  errorRate: number;
  userInteractions: Record<string, number>;
  lastUpdated: Date;
}

// Complex Analytics Queries
export interface AnalyticsQuery {
  type: 'pilot' | 'certification' | 'leave' | 'fleet' | 'custom';
  filters: ChartFilter;
  groupBy?: string[];
  aggregations?: string[];
  timeframe: {
    start: Date;
    end: Date;
    granularity: 'day' | 'week' | 'month' | 'quarter' | 'year';
  };
  sortBy?: {
    field: string;
    order: 'asc' | 'desc';
  };
  limit?: number;
}

export interface AnalyticsResult {
  query: AnalyticsQuery;
  data: any[];
  metadata: {
    totalRecords: number;
    executionTime: number;
    cacheUsed: boolean;
    lastUpdated: Date;
  };
  charts?: {
    recommended: string[];
    available: string[];
  };
}

// Alert and Notification Types
export interface AnalyticsAlert {
  id: string;
  type: 'threshold' | 'trend' | 'anomaly' | 'compliance';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  affectedMetric: string;
  threshold?: {
    operator: '>' | '<' | '=' | '>=' | '<=';
    value: number;
    actual: number;
  };
  actions?: Array<{
    label: string;
    action: string;
    url?: string;
  }>;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

// Key Performance Indicators
export interface KPIMetric {
  id: string;
  name: string;
  category: 'pilot' | 'certification' | 'fleet' | 'compliance';
  value: number;
  unit: string;
  target?: number;
  threshold?: {
    warning: number;
    critical: number;
  };
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  lastUpdated: Date;
  historical?: Array<{
    date: Date;
    value: number;
  }>;
}

// All interfaces and types are already exported with 'export interface' declarations above
