/**
 * @fileoverview PDF Report Type Definitions for Air Niugini B767 PMS
 * Comprehensive type definitions for all PDF report generation components
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-27
 */

import { Pilot, PilotCheck, CheckType } from '@/lib/supabase';

// =============================================================================
// BASE PDF REPORT TYPES
// =============================================================================

/**
 * Base report metadata shared across all PDF reports
 */
export interface PDFReportMetadata {
  reportType: string;
  title: string;
  subtitle?: string;
  generatedAt: string;
  generatedBy: string;
  reportPeriod?: string;
  rosterPeriod?: string;
  companyName: string;
  fleetType: string;
  pageCount?: number;
}

/**
 * PDF report generation options
 */
export interface PDFReportOptions {
  includeCharts?: boolean;
  includeDetails?: boolean;
  includeRecommendations?: boolean;
  filterByRole?: 'Captain' | 'First Officer' | 'all';
  filterByStatus?: 'active' | 'inactive' | 'all';
  dateRange?: {
    from: string;
    to: string;
  };
}

// =============================================================================
// COMPLIANCE REPORT TYPES
// =============================================================================

/**
 * Fleet compliance overview statistics
 */
export interface ComplianceOverview {
  totalPilots: number;
  totalCertifications: number;
  currentCertifications: number;
  expiringCertifications: number;
  expiredCertifications: number;
  complianceRate: number;
  lastUpdated: string;
}

/**
 * Certification status by time periods
 */
export interface ExpirationBreakdown {
  next7Days: number;
  next14Days: number;
  next30Days: number;
  next60Days: number;
  next90Days: number;
  beyond90Days: number;
}

/**
 * Compliance percentage by check type category
 */
export interface ComplianceByCategory {
  category: string;
  totalChecks: number;
  currentChecks: number;
  expiringChecks: number;
  expiredChecks: number;
  compliancePercentage: number;
}

/**
 * Individual pilot compliance status
 */
export interface PilotComplianceStatus {
  pilot: Pilot;
  totalChecks: number;
  currentChecks: number;
  expiringChecks: number;
  expiredChecks: number;
  compliancePercentage: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priorityActions: string[];
}

/**
 * Compliance report data structure
 */
export interface ComplianceReportData {
  metadata: PDFReportMetadata;
  overview: ComplianceOverview;
  expirationBreakdown: ExpirationBreakdown;
  complianceByCategory: ComplianceByCategory[];
  pilotComplianceStatus: PilotComplianceStatus[];
  expiredCertifications: {
    pilot: string;
    employeeId: string;
    checkType: string;
    category: string;
    expiryDate: string;
    daysOverdue: number;
    riskLevel: string;
  }[];
  expiringCertifications: {
    pilot: string;
    employeeId: string;
    checkType: string;
    category: string;
    expiryDate: string;
    daysUntilExpiry: number;
    urgencyLevel: string;
  }[];
  recommendations: string[];
}

// =============================================================================
// PILOT REPORT TYPES
// =============================================================================

/**
 * Individual pilot summary for reports
 */
export interface PilotSummary {
  pilot: Pilot;
  totalYearsService: number;
  currentAge: number;
  retirementDate?: string;
  yearsToRetirement?: number;
  totalCertifications: number;
  currentCertifications: number;
  expiringCertifications: number;
  expiredCertifications: number;
  captainQualifications: string[];
  lastTrainingDate?: string;
  nextRequiredTraining?: string;
  complianceStatus: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT';
}

/**
 * Pilot training history entry
 */
export interface TrainingHistoryEntry {
  checkType: string;
  completedDate?: string;
  expiryDate?: string;
  status: 'CURRENT' | 'EXPIRING' | 'EXPIRED' | 'NOT_COMPLETED';
  daysUntilExpiry?: number;
  instructor?: string;
  location?: string;
  notes?: string;
}

/**
 * Complete pilot record for detailed reports
 */
export interface DetailedPilotRecord {
  pilot: Pilot;
  summary: PilotSummary;
  certificationHistory: TrainingHistoryEntry[];
  leaveHistory?: {
    requestType: string;
    startDate: string;
    endDate: string;
    daysCount: number;
    status: string;
    rosterPeriod: string;
  }[];
  performanceMetrics?: {
    onTimeComplianceRate: number;
    trainingCompletionRate: number;
    leaveUtilization: number;
  };
}

/**
 * Pilot report data structure
 */
export interface PilotReportData {
  metadata: PDFReportMetadata;
  reportScope: 'INDIVIDUAL' | 'MULTIPLE' | 'ALL';
  pilots: DetailedPilotRecord[];
  summary: {
    totalPilots: number;
    averageAge: number;
    averageServiceYears: number;
    complianceDistribution: {
      compliant: number;
      atRisk: number;
      nonCompliant: number;
    };
  };
  recommendations: string[];
}

// =============================================================================
// FLEET MANAGEMENT REPORT TYPES
// =============================================================================

/**
 * Fleet roster analysis
 */
export interface FleetRosterAnalysis {
  totalPilots: number;
  activePilots: number;
  inactivePilots: number;
  captains: number;
  firstOfficers: number;
  contractTypes: {
    fulltime: number;
    contract: number;
    casual: number;
  };
  seniorityDistribution: {
    range: string;
    count: number;
  }[];
  ageDistribution: {
    range: string;
    count: number;
  }[];
}

/**
 * Captain qualifications matrix
 */
export interface CaptainQualification {
  pilot: Pilot;
  lineCaptain: boolean;
  trainingCaptain: boolean;
  examiner: boolean;
  instructor: boolean;
  checkAirman: boolean;
  rhsCaptainExpiry?: string;
  qualificationNotes?: string;
  totalQualifications: number;
}

/**
 * Leave request analysis
 */
export interface LeaveAnalysis {
  rosterPeriod: string;
  totalRequests: number;
  approvedRequests: number;
  pendingRequests: number;
  rejectedRequests: number;
  totalLeaveDays: number;
  leaveByType: {
    type: string;
    count: number;
    totalDays: number;
  }[];
  availabilityImpact: {
    pilotsOnLeave: number;
    availabilityPercentage: number;
    criticalPeriods: string[];
  };
}

/**
 * Fleet operational readiness metrics
 */
export interface OperationalReadiness {
  overallAvailability: number;
  captainAvailability: number;
  firstOfficerAvailability: number;
  minimumCrewRequirement: {
    captains: number;
    firstOfficers: number;
  };
  currentCertifiedCrew: {
    captains: number;
    firstOfficers: number;
  };
  shortfall: {
    captains: number;
    firstOfficers: number;
  };
  riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mitigationActions: string[];
}

/**
 * Fleet management report data structure
 */
export interface FleetManagementReportData {
  metadata: PDFReportMetadata;
  rosterAnalysis: FleetRosterAnalysis;
  captainQualifications: CaptainQualification[];
  leaveAnalysis: LeaveAnalysis;
  operationalReadiness: OperationalReadiness;
  upcomingRetirements: {
    pilot: Pilot;
    retirementDate: string;
    yearsToRetirement: number;
    replacementPlan?: string;
  }[];
  recommendations: string[];
}

// =============================================================================
// STATISTICAL REPORT TYPES
// =============================================================================

/**
 * Fleet statistics overview
 */
export interface FleetStatistics {
  demographics: {
    averageAge: number;
    averageServiceYears: number;
    nationalityBreakdown: { nationality: string; count: number }[];
    contractTypeDistribution: { type: string; count: number }[];
  };
  certificationMetrics: {
    totalCertifications: number;
    averageCertificationsPerPilot: number;
    certificationsByCategory: { category: string; count: number }[];
    complianceRateByCategory: { category: string; rate: number }[];
  };
  operationalMetrics: {
    fleetUtilization: number;
    trainingEfficiency: number;
    complianceRate: number;
    avgDaysToExpiry: number;
  };
  trends: {
    period: string;
    complianceRate: number;
    newCertifications: number;
    expiredCertifications: number;
  }[];
}

// =============================================================================
// PDF DOCUMENT STYLE TYPES
// =============================================================================

/**
 * Air Niugini brand colors and styling
 */
export interface AirNiuginiStyles {
  colors: {
    primary: string; // #E4002B - Air Niugini Red
    secondary: string; // #FFC72C - Air Niugini Gold
    black: string; // #000000 - Brand Black
    white: string; // #FFFFFF - Background
    gray: {
      light: string; // #F5F5F5
      medium: string; // #666666
      dark: string; // #333333
    };
    status: {
      current: string; // #059669 - Green
      expiring: string; // #D97706 - Yellow/Orange
      expired: string; // #DC2626 - Red
      critical: string; // #991B1B - Dark Red
    };
  };
  fonts: {
    primary: string; // Helvetica
    sizes: {
      title: number; // 18
      heading: number; // 14
      subheading: number; // 12
      body: number; // 10
      caption: number; // 8
    };
  };
  spacing: {
    page: number; // 30
    section: number; // 15
    element: number; // 8
  };
}

/**
 * PDF table configuration
 */
export interface PDFTableConfig {
  headers: string[];
  widths: string[];
  data: (string | number)[][];
  sortable?: boolean;
  highlightCritical?: boolean;
  statusColumn?: number;
}

/**
 * PDF chart configuration
 */
export interface PDFChartConfig {
  type: 'donut' | 'bar' | 'line' | 'gauge';
  title: string;
  data: any;
  colors?: string[];
  showLegend?: boolean;
  showValues?: boolean;
}

// =============================================================================
// EXPORT TYPES
// =============================================================================

/**
 * Main PDF report types union
 */
export type PDFReportType =
  | 'fleet-compliance'
  | 'risk-assessment'
  | 'pilot-summary'
  | 'pilot-individual'
  | 'fleet-management'
  | 'captain-qualifications'
  | 'leave-analysis'
  | 'operational-readiness'
  | 'fleet-statistics'
  | 'certification-forecast';

/**
 * PDF report data union type
 */
export type PDFReportData = ComplianceReportData | PilotReportData | FleetManagementReportData;

/**
 * PDF generation request interface
 */
export interface PDFGenerationRequest {
  reportType: PDFReportType;
  reportData: PDFReportData;
  options?: PDFReportOptions;
}

/**
 * PDF generation response interface
 */
export interface PDFGenerationResponse {
  success: boolean;
  buffer?: Buffer;
  filename?: string;
  error?: string;
  metadata?: {
    pageCount: number;
    fileSize: number;
    generatedAt: string;
  };
}
