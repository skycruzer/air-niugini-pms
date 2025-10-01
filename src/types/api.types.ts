/**
 * @fileoverview API Request/Response Types for Air Niugini B767 PMS
 * Comprehensive TypeScript types for all API endpoints and data transfer objects
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-30
 */

/**
 * Standard API response wrapper
 * @template T - The type of data being returned
 */
export interface ApiResponse<T = unknown> {
  /** Whether the operation was successful */
  success: boolean;
  /** Response data */
  data: T | null;
  /** Error message if unsuccessful */
  error: string | null;
  /** Additional metadata */
  metadata?: {
    totalCount?: number;
    page?: number;
    pageSize?: number;
    executionTime?: number;
    timestamp?: string;
  };
}

/**
 * Error response details
 */
export interface ApiError {
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Detailed error information */
  details?: Record<string, unknown>;
  /** Stack trace (development only) */
  stack?: string;
}

/**
 * Pagination parameters for list endpoints
 */
export interface PaginationParams {
  /** Page number (0-indexed) */
  page?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter parameters for list endpoints
 */
export interface FilterParams {
  /** Search term */
  search?: string;
  /** Role filter */
  role?: string;
  /** Status filter */
  status?: 'active' | 'inactive' | 'all';
  /** Date range start */
  startDate?: string;
  /** Date range end */
  endDate?: string;
  /** Contract type filter */
  contractType?: string;
}

// ===== PILOT API TYPES =====

/**
 * Pilot data from database
 */
export interface PilotData {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  role: 'Captain' | 'First Officer';
  contract_type_id: string | null;
  commencement_date: string | null;
  date_of_birth: string | null;
  retirement_date: string | null;
  age: number | null;
  seniority_number: number | null;
  is_active: boolean;
  captain_qualifications: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Extended pilot data with related information
 */
export interface PilotWithRelations extends PilotData {
  contract_types?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  pilot_checks?: Array<{
    id: string;
    check_type_id: string;
    issue_date: string | null;
    expiry_date: string | null;
    notes: string | null;
    check_types?: {
      id: string;
      check_code: string;
      check_description: string;
      category: string;
    };
  }>;
  certification_summary?: {
    total: number;
    current: number;
    expiring: number;
    expired: number;
  };
}

/**
 * Request body for creating a pilot
 */
export interface CreatePilotRequest {
  employee_id: string;
  first_name: string;
  last_name: string;
  role: 'Captain' | 'First Officer';
  contract_type_id?: string;
  commencement_date?: string;
  date_of_birth?: string;
  captain_qualifications?: string[];
  notes?: string;
}

/**
 * Request body for updating a pilot
 */
export interface UpdatePilotRequest extends Partial<CreatePilotRequest> {
  is_active?: boolean;
}

/**
 * Response for pilot list endpoint
 */
export type PilotListResponse = ApiResponse<PilotWithRelations[]>;

/**
 * Response for single pilot endpoint
 */
export type PilotDetailResponse = ApiResponse<PilotWithRelations>;

// ===== CERTIFICATION API TYPES =====

/**
 * Certification data from database
 */
export interface CertificationData {
  id: string;
  pilot_id: string;
  check_type_id: string;
  issue_date: string | null;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Extended certification with pilot and check type info
 */
export interface CertificationWithRelations extends CertificationData {
  pilots?: {
    id: string;
    employee_id: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  check_types?: {
    id: string;
    check_code: string;
    check_description: string;
    category: string;
    validity_days: number | null;
  };
  status?: 'current' | 'expiring' | 'expired' | 'no_date';
  days_until_expiry?: number | null;
}

/**
 * Request body for creating/updating a certification
 */
export interface UpsertCertificationRequest {
  pilot_id: string;
  check_type_id: string;
  issue_date: string;
  expiry_date: string;
  notes?: string;
}

/**
 * Bulk certification update request
 */
export interface BulkCertificationRequest {
  pilot_ids: string[];
  certification_data: {
    check_type_id: string;
    issue_date: string;
    expiry_date: string;
    notes?: string;
  };
}

/**
 * Bulk certification update result
 */
export interface BulkCertificationResult {
  success: number;
  failed: number;
  errors: Array<{
    pilotId: string;
    pilotName: string;
    error: string;
  }>;
}

/**
 * Expiring certifications query params
 */
export interface ExpiringCertificationsParams {
  /** Number of days to look ahead */
  daysAhead?: number;
  /** Filter by pilot role */
  role?: string;
  /** Filter by certification category */
  category?: string;
}

/**
 * Response for certification list endpoint
 */
export type CertificationListResponse = ApiResponse<CertificationWithRelations[]>;

// ===== LEAVE REQUEST API TYPES =====

/**
 * Leave request data from database
 */
export interface LeaveRequestData {
  id: string;
  pilot_id: string;
  leave_type: 'RDO' | 'WDO' | 'Annual' | 'Sick' | 'Emergency';
  start_date: string;
  end_date: string;
  reason: string | null;
  comments: string | null;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comments: string | null;
  roster_period: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Extended leave request with pilot info
 */
export interface LeaveRequestWithRelations extends LeaveRequestData {
  pilots?: {
    id: string;
    employee_id: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  reviewers?: {
    id: string;
    email: string;
    full_name: string;
  } | null;
}

/**
 * Request body for creating a leave request
 */
export interface CreateLeaveRequest {
  pilot_id: string;
  leave_type: 'RDO' | 'WDO' | 'Annual' | 'Sick' | 'Emergency';
  start_date: string;
  end_date: string;
  reason?: string;
  comments?: string;
  roster_period?: string;
}

/**
 * Request body for updating leave request status
 */
export interface UpdateLeaveStatusRequest {
  status: 'APPROVED' | 'DENIED';
  review_comments?: string;
}

/**
 * Leave conflict check request
 */
export interface LeaveConflictCheckRequest {
  pilot_id: string;
  start_date: string;
  end_date: string;
  exclude_request_id?: string;
}

/**
 * Leave conflict information
 */
export interface LeaveConflict {
  type: 'leave_overlap' | 'certification_gap' | 'scheduling_conflict';
  severity: 'warning' | 'error';
  message: string;
  conflicting_dates: string[];
  conflicting_request?: LeaveRequestData;
}

/**
 * Response for leave conflict check
 */
export interface LeaveConflictCheckResponse extends ApiResponse<null> {
  has_conflicts: boolean;
  conflicts: LeaveConflict[];
}

/**
 * Response for leave request list endpoint
 */
export type LeaveRequestListResponse = ApiResponse<LeaveRequestWithRelations[]>;

// ===== CHECK TYPE API TYPES =====

/**
 * Check type data from database
 */
export interface CheckTypeData {
  id: string;
  check_code: string;
  check_description: string;
  category: string;
  validity_days: number | null;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Response for check types list
 */
export type CheckTypeListResponse = ApiResponse<CheckTypeData[]>;

// ===== CONTRACT TYPE API TYPES =====

/**
 * Contract type data from database
 */
export interface ContractTypeData {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Response for contract types list
 */
export type ContractTypeListResponse = ApiResponse<ContractTypeData[]>;

// ===== SETTINGS API TYPES =====

/**
 * Setting data from database
 */
export interface SettingData {
  id: string;
  key: string;
  value: string | number | boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Request to update a setting
 */
export interface UpdateSettingRequest {
  key: string;
  value: string | number | boolean;
  description?: string;
}

/**
 * Response for settings list
 */
export type SettingsListResponse = ApiResponse<SettingData[]>;

// ===== ANALYTICS API TYPES =====

/**
 * Dashboard statistics response
 */
export interface DashboardStatsResponse extends ApiResponse<null> {
  pilots: {
    total: number;
    active: number;
    inactive: number;
    captains: number;
    firstOfficers: number;
  };
  certifications: {
    total: number;
    current: number;
    expiring: number;
    expired: number;
    complianceRate: number;
  };
  leave: {
    totalRequests: number;
    pending: number;
    approved: number;
    denied: number;
    thisMonth: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'pilot' | 'certification' | 'leave';
    action: string;
    description: string;
    timestamp: string;
  }>;
}

/**
 * Pilot analytics request params
 */
export interface PilotAnalyticsParams {
  startDate?: string;
  endDate?: string;
  role?: string;
  contractType?: string;
}

/**
 * Certification analytics request params
 */
export interface CertificationAnalyticsParams {
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: 'current' | 'expiring' | 'expired';
}

/**
 * Leave analytics request params
 */
export interface LeaveAnalyticsParams {
  startDate?: string;
  endDate?: string;
  leaveType?: string;
  status?: string;
}

// ===== REPORT API TYPES =====

/**
 * PDF report generation request
 */
export interface GenerateReportRequest {
  reportType: 'certification_expiry' | 'pilot_summary' | 'fleet_management' | 'roster_leave';
  filters?: {
    pilotIds?: string[];
    startDate?: string;
    endDate?: string;
    includeCharts?: boolean;
    includeDetails?: boolean;
  };
  format?: 'pdf' | 'csv' | 'excel';
}

/**
 * Report generation response
 */
export interface GenerateReportResponse extends ApiResponse<null> {
  reportUrl?: string;
  reportId?: string;
  expiresAt?: string;
}

// ===== USER API TYPES =====

/**
 * User data from database
 */
export interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Login request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response
 */
export interface LoginResponse extends ApiResponse<null> {
  user?: UserData;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

/**
 * Current user response
 */
export type CurrentUserResponse = ApiResponse<UserData>;

// ===== CHART DATA TYPES =====

/**
 * Generic chart data structure
 */
export interface ChartData<T = number> {
  labels: string[];
  datasets: Array<{
    label: string;
    data: T[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

/**
 * Time series data point
 */
export interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

/**
 * Chart export request
 */
export interface ChartExportRequest {
  chartType: string;
  format: 'png' | 'jpg' | 'svg' | 'pdf';
  width?: number;
  height?: number;
  backgroundColor?: string;
}
