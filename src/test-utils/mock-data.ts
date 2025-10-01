/**
 * Mock Data for Testing
 * Air Niugini B767 fleet test data with realistic pilot and certification information
 */

import { addDays, subDays, format } from 'date-fns';

/**
 * Mock Pilots
 */
export const mockPilots = [
  {
    id: 'pilot-001',
    employee_id: 'PX201',
    first_name: 'Michael',
    last_name: 'Kaupa',
    role: 'Captain',
    base: 'Port Moresby',
    commencement_date: '2010-03-15',
    date_of_birth: '1980-05-20',
    retirement_age: 65,
    is_active: true,
    contract_type: 'Full-Time',
    seniority_number: 1,
    captain_qualifications: {
      line_captain: true,
      training_captain: true,
      examiner: false,
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'pilot-002',
    employee_id: 'PX202',
    first_name: 'John',
    last_name: 'Wari',
    role: 'First Officer',
    base: 'Port Moresby',
    commencement_date: '2015-06-10',
    date_of_birth: '1985-08-12',
    retirement_age: 65,
    is_active: true,
    contract_type: 'Full-Time',
    seniority_number: 8,
    captain_qualifications: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'pilot-003',
    employee_id: 'PX203',
    first_name: 'Sarah',
    last_name: 'Kombua',
    role: 'Captain',
    base: 'Lae',
    commencement_date: '2012-09-01',
    date_of_birth: '1982-03-25',
    retirement_age: 65,
    is_active: true,
    contract_type: 'Full-Time',
    seniority_number: 3,
    captain_qualifications: {
      line_captain: true,
      training_captain: false,
      examiner: true,
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

/**
 * Mock Check Types
 */
export const mockCheckTypes = [
  {
    id: 'check-001',
    check_code: 'IPC',
    check_description: 'Instrument Proficiency Check',
    category: 'Flight Checks',
    validity_period: 180,
    is_active: true,
  },
  {
    id: 'check-002',
    check_code: 'LPC',
    check_description: 'License Proficiency Check',
    category: 'Flight Checks',
    validity_period: 365,
    is_active: true,
  },
  {
    id: 'check-003',
    check_code: 'CLASS1',
    check_description: 'Class 1 Medical',
    category: 'Pilot Medical',
    validity_period: 365,
    is_active: true,
  },
  {
    id: 'check-004',
    check_code: 'DG',
    check_description: 'Dangerous Goods',
    category: 'Ground Courses Refresher',
    validity_period: 730,
    is_active: true,
  },
];

/**
 * Mock Pilot Checks (Certifications)
 */
export const mockPilotChecks = [
  {
    id: 'pc-001',
    pilot_id: 'pilot-001',
    check_type_id: 'check-001',
    issue_date: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
    expiry_date: format(addDays(new Date(), 90), 'yyyy-MM-dd'), // Expiring soon
    status: 'Current',
    notes: 'Completed successfully',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'pc-002',
    pilot_id: 'pilot-001',
    check_type_id: 'check-002',
    issue_date: format(subDays(new Date(), 300), 'yyyy-MM-dd'),
    expiry_date: format(addDays(new Date(), 65), 'yyyy-MM-dd'), // Current
    status: 'Current',
    notes: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'pc-003',
    pilot_id: 'pilot-002',
    check_type_id: 'check-001',
    issue_date: format(subDays(new Date(), 200), 'yyyy-MM-dd'),
    expiry_date: format(subDays(new Date(), 20), 'yyyy-MM-dd'), // Expired
    status: 'Expired',
    notes: 'Renewal required',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'pc-004',
    pilot_id: 'pilot-002',
    check_type_id: 'check-003',
    issue_date: format(subDays(new Date(), 345), 'yyyy-MM-dd'),
    expiry_date: format(addDays(new Date(), 20), 'yyyy-MM-dd'), // Expiring soon (< 30 days)
    status: 'Expiring Soon',
    notes: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

/**
 * Mock Leave Requests
 */
export const mockLeaveRequests = [
  {
    id: 'leave-001',
    pilot_id: 'pilot-001',
    leave_type: 'Annual',
    start_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    end_date: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    days_count: 7,
    roster_period: 'RP11/2025',
    status: 'Approved',
    notes: 'Family vacation',
    approved_by: 'admin-user-id',
    approved_at: '2024-01-15T10:00:00Z',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'leave-002',
    pilot_id: 'pilot-002',
    leave_type: 'RDO',
    start_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    end_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    days_count: 1,
    roster_period: 'RP11/2025',
    status: 'Pending',
    notes: null,
    approved_by: null,
    approved_at: null,
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z',
  },
];

/**
 * Mock Users
 */
export const mockUsers = [
  {
    id: 'user-001',
    email: 'admin@airniugini.com.pg',
    name: 'Admin User',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-002',
    email: 'manager@airniugini.com.pg',
    name: 'Manager User',
    role: 'manager',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

/**
 * Mock Settings
 */
export const mockSettings = {
  retirement_age: 65,
  certification_alert_days: 30,
  roster_duration: 28,
};

/**
 * Mock Dashboard Statistics
 */
export const mockDashboardStats = {
  totalPilots: 27,
  activePilots: 25,
  totalCertifications: 568,
  expiringCertifications: 12,
  expiredCertifications: 3,
  pendingLeaveRequests: 5,
  approvedLeaveRequests: 15,
  complianceRate: 95.2,
};

/**
 * Helper function to create a pilot with custom data
 */
export function createMockPilot(overrides?: Partial<(typeof mockPilots)[0]>) {
  return {
    ...mockPilots[0],
    id: `pilot-${Date.now()}`,
    employee_id: `PX${Math.floor(Math.random() * 1000)}`,
    ...overrides,
  };
}

/**
 * Helper function to create a certification with custom data
 */
export function createMockCertification(overrides?: Partial<(typeof mockPilotChecks)[0]>) {
  return {
    ...mockPilotChecks[0],
    id: `pc-${Date.now()}`,
    ...overrides,
  };
}

/**
 * Helper function to create a leave request with custom data
 */
export function createMockLeaveRequest(overrides?: Partial<(typeof mockLeaveRequests)[0]>) {
  return {
    ...mockLeaveRequests[0],
    id: `leave-${Date.now()}`,
    ...overrides,
  };
}
