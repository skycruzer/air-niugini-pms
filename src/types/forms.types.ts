/**
 * @fileoverview Form Data Types for Air Niugini B767 PMS
 * TypeScript types for all form inputs, validation, and submission
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-09-30
 */

/**
 * Generic form field error
 */
export interface FormFieldError {
  /** Field name */
  field: string;
  /** Error message */
  message: string;
  /** Error type */
  type?: 'required' | 'pattern' | 'min' | 'max' | 'custom';
}

/**
 * Form validation result
 */
export interface FormValidationResult {
  /** Whether form is valid */
  isValid: boolean;
  /** Field errors */
  errors: Record<string, string>;
  /** Global form error */
  formError?: string;
}

// ===== PILOT FORMS =====

/**
 * Pilot add form data
 */
export interface PilotAddFormData {
  employee_id: string;
  first_name: string;
  last_name: string;
  role: 'Captain' | 'First Officer';
  contract_type_id: string;
  commencement_date: string;
  date_of_birth: string;
  captain_qualifications: string[];
  notes: string;
}

/**
 * Pilot edit form data (all fields optional except ID)
 */
export interface PilotEditFormData extends Partial<PilotAddFormData> {
  id: string;
  is_active?: boolean;
}

/**
 * Pilot filter form data
 */
export interface PilotFilterFormData {
  searchTerm: string;
  roleFilter: '' | 'Captain' | 'First Officer';
  statusFilter: '' | 'active' | 'inactive';
  contractTypeFilter: string;
  seniorityMin: string;
  seniorityMax: string;
  ageMin: string;
  ageMax: string;
}

/**
 * Pilot bulk action form data
 */
export interface PilotBulkActionFormData {
  selectedPilotIds: string[];
  action: 'activate' | 'deactivate' | 'export' | 'delete';
  confirmAction: boolean;
}

// ===== CERTIFICATION FORMS =====

/**
 * Certification add/edit form data
 */
export interface CertificationFormData {
  pilot_id: string;
  check_type_id: string;
  issue_date: string;
  expiry_date: string;
  notes: string;
}

/**
 * Bulk certification update form data
 */
export interface BulkCertificationFormData {
  pilot_ids: string[];
  check_type_id: string;
  issue_date: string;
  expiry_date: string;
  notes: string;
  applyToAll: boolean;
}

/**
 * Certification filter form data
 */
export interface CertificationFilterFormData {
  pilotSearch: string;
  checkTypeFilter: string;
  categoryFilter: string;
  statusFilter: '' | 'current' | 'expiring' | 'expired';
  expiryDateFrom: string;
  expiryDateTo: string;
}

// ===== LEAVE REQUEST FORMS =====

/**
 * Leave request form data
 */
export interface LeaveRequestFormData {
  pilot_id: string;
  leave_type: 'RDO' | 'WDO' | 'Annual' | 'Sick' | 'Emergency';
  start_date: string;
  end_date: string;
  reason: string;
  comments: string;
  roster_period: string;
}

/**
 * Leave request edit form data
 */
export interface LeaveRequestEditFormData extends LeaveRequestFormData {
  id: string;
}

/**
 * Leave approval form data
 */
export interface LeaveApprovalFormData {
  request_id: string;
  action: 'approve' | 'deny';
  review_comments: string;
}

/**
 * Leave filter form data
 */
export interface LeaveFilterFormData {
  pilotSearch: string;
  leaveTypeFilter: '' | 'RDO' | 'WDO' | 'Annual' | 'Sick' | 'Emergency';
  statusFilter: '' | 'PENDING' | 'APPROVED' | 'DENIED';
  rosterPeriodFilter: string;
  dateFrom: string;
  dateTo: string;
}

// ===== SETTINGS FORMS =====

/**
 * General settings form data
 */
export interface GeneralSettingsFormData {
  retirement_age: number;
  certification_reminder_days: number;
  leave_approval_required: boolean;
  roster_period_days: number;
  auto_calculate_seniority: boolean;
}

/**
 * Notification settings form data
 */
export interface NotificationSettingsFormData {
  email_enabled: boolean;
  email_address: string;
  reminder_frequency: 'daily' | 'weekly' | 'monthly';
  notify_expiring_certs: boolean;
  notify_leave_requests: boolean;
  notify_pilot_changes: boolean;
  cert_expiry_threshold_days: number;
}

/**
 * User settings form data
 */
export interface UserSettingsFormData {
  full_name: string;
  email: string;
  current_password: string;
  new_password: string;
  confirm_password: string;
  notification_preferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

// ===== REPORT FORMS =====

/**
 * Report generation form data
 */
export interface ReportGenerationFormData {
  report_type: 'certification_expiry' | 'pilot_summary' | 'fleet_management' | 'roster_leave';
  date_from: string;
  date_to: string;
  pilot_ids: string[];
  include_charts: boolean;
  include_details: boolean;
  format: 'pdf' | 'csv' | 'excel';
  grouping: 'pilot' | 'category' | 'date';
}

/**
 * Report filter form data
 */
export interface ReportFilterFormData {
  dateRange: {
    start: string;
    end: string;
    preset: '7d' | '30d' | '90d' | '1y' | 'custom';
  };
  pilotRole: '' | 'Captain' | 'First Officer';
  certificationStatus: '' | 'current' | 'expiring' | 'expired';
  includeInactive: boolean;
}

// ===== SEARCH FORMS =====

/**
 * Global search form data
 */
export interface GlobalSearchFormData {
  query: string;
  searchIn: 'all' | 'pilots' | 'certifications' | 'leave';
  filters: {
    status: string;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

/**
 * Advanced search form data
 */
export interface AdvancedSearchFormData {
  keywords: string;
  category: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  includeArchived: boolean;
}

// ===== LOGIN/AUTH FORMS =====

/**
 * Login form data
 */
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

/**
 * Password reset form data
 */
export interface PasswordResetFormData {
  email: string;
}

/**
 * Password change form data
 */
export interface PasswordChangeFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ===== FORM STATE =====

/**
 * Generic form state wrapper
 * @template T - The type of form data
 */
export interface FormState<T> {
  /** Form data */
  data: T;
  /** Form errors */
  errors: Record<keyof T, string>;
  /** Form submission state */
  isSubmitting: boolean;
  /** Form submission success */
  isSuccess: boolean;
  /** Form touched fields */
  touched: Record<keyof T, boolean>;
  /** Form dirty state */
  isDirty: boolean;
  /** Form valid state */
  isValid: boolean;
}

/**
 * Form field props helper
 * @template T - The type of form data
 * @template K - The key of the field
 */
export interface FormFieldProps<T, K extends keyof T> {
  /** Field name */
  name: K;
  /** Field value */
  value: T[K];
  /** Field error message */
  error?: string;
  /** Field touched state */
  touched?: boolean;
  /** Field change handler */
  onChange: (value: T[K]) => void;
  /** Field blur handler */
  onBlur?: () => void;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Whether field is required */
  required?: boolean;
}

/**
 * Select/dropdown option
 */
export interface SelectOption {
  /** Option value */
  value: string;
  /** Option label */
  label: string;
  /** Whether option is disabled */
  disabled?: boolean;
  /** Optional icon */
  icon?: string;
  /** Optional description */
  description?: string;
}

/**
 * Date range input value
 */
export interface DateRangeValue {
  /** Start date */
  start: string | null;
  /** End date */
  end: string | null;
}

/**
 * File upload input value
 */
export interface FileUploadValue {
  /** File object */
  file: File | null;
  /** File preview URL */
  preview: string | null;
  /** Upload progress (0-100) */
  progress: number;
  /** Upload status */
  status: 'idle' | 'uploading' | 'success' | 'error';
  /** Error message */
  error: string | null;
}

/**
 * Multi-select value
 */
export interface MultiSelectValue {
  /** Selected values */
  selected: string[];
  /** Available options */
  options: SelectOption[];
}

/**
 * Checkbox group value
 */
export interface CheckboxGroupValue {
  /** Checked items */
  checked: string[];
  /** All available items */
  items: Array<{
    value: string;
    label: string;
  }>;
}

/**
 * Form submission handler result
 */
export interface FormSubmitResult {
  /** Whether submission was successful */
  success: boolean;
  /** Error message if unsuccessful */
  error?: string;
  /** Response data */
  data?: unknown;
  /** Redirect URL after success */
  redirectTo?: string;
}
