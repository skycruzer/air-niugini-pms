/**
 * @fileoverview Component State Types for Air Niugini B767 PMS
 * Provides comprehensive TypeScript types for React component state management
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-30
 */

/**
 * Generic loading state for async operations
 * @template T - The type of data being loaded
 */
export interface LoadingState<T = unknown> {
  /** Whether data is currently being fetched */
  isLoading: boolean;
  /** Whether data has been successfully loaded */
  isLoaded: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** The loaded data, if successful */
  data: T | null;
}

/**
 * Form submission state
 */
export interface SubmissionState {
  /** Whether form is currently submitting */
  isSubmitting: boolean;
  /** Whether submission was successful */
  isSuccess: boolean;
  /** Error message if submission failed */
  error: string | null;
  /** Form field errors */
  fieldErrors: Record<string, string>;
}

/**
 * Pagination state for list views
 */
export interface PaginationState {
  /** Current page number (0-indexed) */
  currentPage: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there's a next page */
  hasNext: boolean;
  /** Whether there's a previous page */
  hasPrevious: boolean;
}

/**
 * Filter state for data tables
 */
export interface FilterState {
  /** Search term for text filtering */
  searchTerm: string;
  /** Role filter (Captain, First Officer, etc.) */
  roleFilter: string | null;
  /** Status filter (active, inactive, etc.) */
  statusFilter: string | null;
  /** Date range filter */
  dateRange: {
    start: Date | null;
    end: Date | null;
  } | null;
  /** Contract type filter */
  contractTypeFilter: string | null;
  /** Custom filters */
  customFilters: Record<string, string | number | boolean | null>;
}

/**
 * Sort state for data tables
 */
export interface SortState {
  /** Field to sort by */
  field: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Modal state for dialogs and overlays
 */
export interface ModalState {
  /** Whether modal is open */
  isOpen: boolean;
  /** Modal type identifier */
  type: 'add' | 'edit' | 'delete' | 'view' | 'custom' | null;
  /** Data associated with the modal */
  data: unknown;
  /** Title of the modal */
  title: string | null;
}

/**
 * Pilot form state
 */
export interface PilotFormState {
  employee_id: string;
  first_name: string;
  last_name: string;
  role: 'Captain' | 'First Officer';
  contract_type_id: string;
  commencement_date: string;
  date_of_birth: string;
  is_active: boolean;
  captain_qualifications: string[];
  notes: string;
}

/**
 * Certification form state
 */
export interface CertificationFormState {
  pilot_id: string;
  check_type_id: string;
  issue_date: string;
  expiry_date: string;
  notes: string;
}

/**
 * Leave request form state
 */
export interface LeaveRequestFormState {
  pilot_id: string;
  leave_type: 'RDO' | 'WDO' | 'Annual' | 'Sick' | 'Emergency';
  start_date: string;
  end_date: string;
  reason: string;
  comments: string;
  roster_period: string;
}

/**
 * Bulk certification update state
 */
export interface BulkCertificationState {
  /** Selected pilot IDs */
  selectedPilots: string[];
  /** Whether all pilots are selected */
  selectAll: boolean;
  /** Certification data to update */
  certificationData: {
    check_type_id: string;
    issue_date: string;
    expiry_date: string;
  };
  /** Update results */
  results: {
    success: number;
    failed: number;
    errors: Array<{
      pilotId: string;
      pilotName: string;
      error: string;
    }>;
  } | null;
}

/**
 * Dashboard statistics state
 */
export interface DashboardStatsState {
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
  };
  lastUpdated: Date | null;
}

/**
 * Calendar state
 */
export interface CalendarState {
  /** Currently displayed date */
  currentDate: Date;
  /** Selected date */
  selectedDate: Date | null;
  /** View mode */
  viewMode: 'month' | 'week' | 'day';
  /** Events to display */
  events: Array<{
    id: string;
    title: string;
    date: Date;
    type: 'leave' | 'certification' | 'event';
    color: string;
    data: unknown;
  }>;
}

/**
 * Settings page state
 */
export interface SettingsState {
  /** General settings */
  general: {
    retirement_age: number;
    certification_reminder_days: number;
    leave_approval_required: boolean;
  };
  /** Notification settings */
  notifications: {
    email_enabled: boolean;
    email_address: string;
    reminder_frequency: 'daily' | 'weekly' | 'monthly';
  };
  /** Has unsaved changes */
  hasUnsavedChanges: boolean;
}

/**
 * Analytics dashboard state
 */
export interface AnalyticsDashboardState {
  /** Selected time range */
  timeRange: {
    start: Date;
    end: Date;
    preset: '7d' | '30d' | '90d' | '1y' | 'custom';
  };
  /** Active filters */
  filters: FilterState;
  /** Whether data is being refreshed */
  isRefreshing: boolean;
  /** Last refresh timestamp */
  lastRefresh: Date | null;
}

/**
 * Leave approval workflow state
 */
export interface LeaveApprovalState {
  /** Whether review form is visible */
  showReviewForm: boolean;
  /** Review comments */
  reviewComments: string;
  /** Selected action */
  action: 'approve' | 'deny' | null;
  /** Processing state */
  isProcessing: boolean;
}

/**
 * Sidebar state
 */
export interface SidebarState {
  /** Whether sidebar is open on mobile */
  isOpen: boolean;
  /** Whether sidebar is collapsed on desktop */
  isCollapsed: boolean;
  /** Active menu item */
  activeItem: string | null;
}

/**
 * Conflict checking state
 */
export interface ConflictCheckState {
  /** Whether conflict check is in progress */
  isChecking: boolean;
  /** Whether conflicts were found */
  hasConflicts: boolean;
  /** List of conflicts */
  conflicts: Array<{
    type: 'leave_overlap' | 'certification_gap' | 'scheduling_conflict';
    severity: 'warning' | 'error';
    message: string;
    affectedDates: Date[];
  }>;
}

/**
 * Export state for reports
 */
export interface ExportState {
  /** Whether export is in progress */
  isExporting: boolean;
  /** Export format */
  format: 'pdf' | 'csv' | 'excel' | null;
  /** Export progress (0-100) */
  progress: number;
  /** Download URL when ready */
  downloadUrl: string | null;
}

/**
 * Notification toast state
 */
export interface ToastState {
  /** Whether toast is visible */
  isVisible: boolean;
  /** Toast message */
  message: string;
  /** Toast type */
  type: 'success' | 'error' | 'warning' | 'info';
  /** Auto-hide duration in ms */
  duration: number;
}

/**
 * Search/Filter panel state
 */
export interface SearchPanelState {
  /** Whether advanced filters are shown */
  showAdvancedFilters: boolean;
  /** Current search query */
  query: string;
  /** Active filters */
  activeFilters: FilterState;
  /** Number of results */
  resultCount: number;
}

/**
 * View toggle state (list vs grid vs calendar)
 */
export interface ViewToggleState {
  /** Current view mode */
  viewMode: 'list' | 'grid' | 'calendar' | 'timeline';
  /** View preferences */
  preferences: {
    showImages: boolean;
    compactMode: boolean;
    groupBy: string | null;
  };
}
