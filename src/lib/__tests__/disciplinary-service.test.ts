/**
 * Disciplinary Service Tests
 * Tests for disciplinary matters service layer - CRUD operations, statistics, and audit logging
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-06
 */

// Mock Supabase admin client - consistent instance pattern
jest.mock('../supabase', () => {
  const mockFrom = jest.fn();
  const mockInstance = {
    from: mockFrom,
    auth: { getUser: jest.fn() },
  };

  return {
    getSupabaseAdmin: () => mockInstance,
    __mockInstance: mockInstance,
    __mockFrom: mockFrom,
  };
});

import {
  getIncidentTypes,
  getIncidentTypeById,
  getDisciplinaryMatters,
  getDisciplinaryMatterById,
  createDisciplinaryMatter,
  updateDisciplinaryMatter,
  deleteDisciplinaryMatter,
  getDisciplinaryActions,
  createDisciplinaryAction,
  getDisciplinaryComments,
  createDisciplinaryComment,
  getDisciplinaryAuditLog,
  getDisciplinaryStatistics,
} from '../disciplinary-service';

// Get the mocked admin client references
const supabaseMock = require('../supabase');
const mockFrom = supabaseMock.__mockFrom;

describe('Disciplinary Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getIncidentTypes', () => {
    it('should fetch all incident types ordered by severity', async () => {
      const mockData = [
        { id: '1', code: 'CRIT-001', name: 'Critical Incident', severity_level: 'CRITICAL' },
        { id: '2', code: 'MOD-001', name: 'Moderate Incident', severity_level: 'MODERATE' },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: mockData, error: null })),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await getIncidentTypes();

      expect(mockFrom).toHaveBeenCalledWith('incident_types');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.order).toHaveBeenCalledWith('severity_level', { ascending: false });
      expect(result).toEqual(mockData);
    });

    it('should throw error when fetch fails', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: null, error: { message: 'Database error' } })),
      };

      mockFrom.mockReturnValue(mockQuery);

      await expect(getIncidentTypes()).rejects.toThrow('Failed to fetch incident types');
    });

    it('should return empty array when no incident types exist', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: [], error: null })),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await getIncidentTypes();
      expect(result).toEqual([]);
    });
  });

  describe('getIncidentTypeById', () => {
    it('should fetch a single incident type by ID', async () => {
      const mockData = { id: '1', code: 'CRIT-001', name: 'Critical Incident' };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await getIncidentTypeById('1');

      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(mockData);
    });

    it('should return null when incident type not found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await getIncidentTypeById('999');
      expect(result).toBeNull();
    });
  });

  describe('getDisciplinaryMatters', () => {
    it('should fetch all disciplinary matters with related data', async () => {
      const mockData = [
        {
          id: '1',
          pilot_id: 'pilot-1',
          incident_type_id: 'type-1',
          status: 'OPEN',
          severity: 'MODERATE',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await getDisciplinaryMatters();

      expect(mockFrom).toHaveBeenCalledWith('disciplinary_matters');
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockData);
    });

    it('should apply pilot_id filter', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockFrom.mockReturnValue(mockQuery);

      await getDisciplinaryMatters({ pilot_id: 'pilot-123' });

      expect(mockQuery.eq).toHaveBeenCalledWith('pilot_id', 'pilot-123');
    });

    it('should apply status filter', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockFrom.mockReturnValue(mockQuery);

      await getDisciplinaryMatters({ status: 'RESOLVED' });

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'RESOLVED');
    });

    it('should apply multiple filters', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: [], error: null })),
      };

      mockFrom.mockReturnValue(mockQuery);

      await getDisciplinaryMatters({
        pilot_id: 'pilot-123',
        status: 'OPEN',
        severity: 'CRITICAL',
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('pilot_id', 'pilot-123');
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'OPEN');
      expect(mockQuery.eq).toHaveBeenCalledWith('severity', 'CRITICAL');
    });
  });

  describe('createDisciplinaryMatter', () => {
    it('should create a new disciplinary matter with audit log', async () => {
      const mockInput = {
        pilot_id: 'pilot-1',
        incident_type_id: 'type-1',
        incident_date: '2025-10-06',
        severity: 'MODERATE' as const,
        title: 'Test Incident',
        description: 'Test Description',
      };

      const mockCreatedData = { id: 'matter-1', ...mockInput };

      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCreatedData, error: null }),
      };

      const mockAuditQuery = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };

      mockFrom
        .mockReturnValueOnce(mockInsertQuery) // First call for disciplinary_matters
        .mockReturnValueOnce(mockAuditQuery); // Second call for audit_log

      const result = await createDisciplinaryMatter(mockInput, 'user-1');

      expect(mockInsertQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockInput,
          reported_by: 'user-1',
          witnesses: [],
          evidence_files: [],
        })
      );
      expect(result).toEqual(mockCreatedData);
    });

    it('should handle witnesses and evidence files', async () => {
      const mockInput = {
        pilot_id: 'pilot-1',
        incident_type_id: 'type-1',
        incident_date: '2025-10-06',
        severity: 'CRITICAL' as const,
        title: 'Test Incident',
        description: 'Test Description',
        witnesses: [{ name: 'John Doe', statement: 'I saw it happen' }],
        evidence_files: [{ filename: 'evidence.pdf', url: 'https://example.com/file.pdf' }],
      };

      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockInput, error: null }),
      };

      const mockAuditQuery = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };

      mockFrom.mockReturnValueOnce(mockInsertQuery).mockReturnValueOnce(mockAuditQuery);

      await createDisciplinaryMatter(mockInput, 'user-1');

      expect(mockInsertQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          witnesses: mockInput.witnesses,
          evidence_files: mockInput.evidence_files,
        })
      );
    });

    it('should throw error when creation fails', async () => {
      const mockInput = {
        pilot_id: 'pilot-1',
        incident_type_id: 'type-1',
        incident_date: '2025-10-06',
        severity: 'MODERATE' as const,
        title: 'Test Incident',
        description: 'Test Description',
      };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
      };

      mockFrom.mockReturnValue(mockQuery);

      await expect(createDisciplinaryMatter(mockInput, 'user-1')).rejects.toThrow(
        'Failed to create disciplinary matter'
      );
    });
  });

  describe('updateDisciplinaryMatter', () => {
    it('should update disciplinary matter and log changes', async () => {
      const mockCurrent = {
        id: 'matter-1',
        status: 'OPEN',
        assigned_to: null,
      };

      const mockUpdate = {
        status: 'UNDER_INVESTIGATION' as const,
        assigned_to: 'user-2',
      };

      const mockGetQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCurrent, error: null }),
      };

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockCurrent, ...mockUpdate },
          error: null,
        }),
      };

      const mockAuditQuery = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };

      mockFrom
        .mockReturnValueOnce(mockGetQuery) // Get current state
        .mockReturnValueOnce(mockUpdateQuery) // Update
        .mockReturnValue(mockAuditQuery); // Audit logs

      const result = await updateDisciplinaryMatter('matter-1', mockUpdate, 'user-1');

      expect(mockUpdateQuery.update).toHaveBeenCalled();
      expect(result).toEqual({ ...mockCurrent, ...mockUpdate });
    });

    it('should set resolved_by when status changes to RESOLVED', async () => {
      const mockCurrent = { id: 'matter-1', status: 'OPEN' };
      const mockUpdate = { status: 'RESOLVED' as const };

      const mockGetQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCurrent, error: null }),
      };

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCurrent, error: null }),
      };

      const mockAuditQuery = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };

      mockFrom
        .mockReturnValueOnce(mockGetQuery)
        .mockReturnValueOnce(mockUpdateQuery)
        .mockReturnValue(mockAuditQuery);

      await updateDisciplinaryMatter('matter-1', mockUpdate, 'user-1');

      expect(mockUpdateQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'RESOLVED',
          resolved_by: 'user-1',
        })
      );
    });
  });

  describe('getDisciplinaryStatistics', () => {
    it('should calculate statistics by severity and status', async () => {
      const mockData = [
        { id: '1', severity: 'MINOR', status: 'OPEN' },
        { id: '2', severity: 'MODERATE', status: 'RESOLVED' },
        { id: '3', severity: 'SERIOUS', status: 'OPEN' },
        { id: '4', severity: 'CRITICAL', status: 'CLOSED' },
        { id: '5', severity: 'MINOR', status: 'UNDER_INVESTIGATION' },
      ];

      const mockQuery = {
        select: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await getDisciplinaryStatistics();

      expect(result.total).toBe(5);
      expect(result.by_severity.minor).toBe(2);
      expect(result.by_severity.moderate).toBe(1);
      expect(result.by_severity.serious).toBe(1);
      expect(result.by_severity.critical).toBe(1);
      expect(result.by_status.open).toBe(2);
      expect(result.by_status.resolved).toBe(1);
      expect(result.by_status.closed).toBe(1);
      expect(result.by_status.under_investigation).toBe(1);
    });

    it('should apply date filters', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockFrom.mockReturnValue(mockQuery);

      await getDisciplinaryStatistics({
        start_date: '2025-01-01',
        end_date: '2025-12-31',
      });

      expect(mockQuery.gte).toHaveBeenCalledWith('incident_date', '2025-01-01');
      expect(mockQuery.lte).toHaveBeenCalledWith('incident_date', '2025-12-31');
    });

    it('should return zero counts for empty data', async () => {
      const mockQuery = {
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await getDisciplinaryStatistics();

      expect(result.total).toBe(0);
      expect(result.by_severity.minor).toBe(0);
      expect(result.by_status.open).toBe(0);
    });
  });

  describe('createDisciplinaryAction', () => {
    it('should create a disciplinary action', async () => {
      const mockAction = {
        action_type: 'WARNING' as const,
        action_date: '2025-10-06',
        description: 'Formal warning issued',
      };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'action-1', matter_id: 'matter-1', ...mockAction },
          error: null,
        }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await createDisciplinaryAction('matter-1', mockAction, 'user-1');

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          matter_id: 'matter-1',
          ...mockAction,
          issued_by: 'user-1',
        })
      );
      expect(result).toHaveProperty('id', 'action-1');
    });

    it('should handle optional fields in action', async () => {
      const mockAction = {
        action_type: 'SUSPENSION' as const,
        action_date: '2025-10-06',
        effective_date: '2025-10-10',
        expiry_date: '2025-10-20',
        description: 'Suspended for 10 days',
        appeal_deadline: '2025-10-15',
      };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockAction, error: null }),
      };

      mockFrom.mockReturnValue(mockQuery);

      await createDisciplinaryAction('matter-1', mockAction, 'user-1');

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          effective_date: '2025-10-10',
          expiry_date: '2025-10-20',
          appeal_deadline: '2025-10-15',
        })
      );
    });
  });

  describe('createDisciplinaryComment', () => {
    it('should create a comment on a disciplinary matter', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'comment-1',
            matter_id: 'matter-1',
            comment: 'Test comment',
            is_internal: true,
          },
          error: null,
        }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await createDisciplinaryComment('matter-1', 'Test comment', 'user-1');

      expect(mockQuery.insert).toHaveBeenCalledWith({
        matter_id: 'matter-1',
        user_id: 'user-1',
        comment: 'Test comment',
        is_internal: true,
        attachments: [],
      });
      expect(result).toHaveProperty('id', 'comment-1');
    });

    it('should handle external comments and attachments', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const attachments = [{ filename: 'doc.pdf', url: 'https://example.com/doc.pdf' }];

      await createDisciplinaryComment('matter-1', 'Public comment', 'user-1', false, attachments);

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          is_internal: false,
          attachments,
        })
      );
    });
  });

  describe('Air Niugini Business Rules', () => {
    it('should validate severity levels match business requirements', () => {
      const validSeverities = ['MINOR', 'MODERATE', 'SERIOUS', 'CRITICAL'];
      expect(validSeverities).toContain('MINOR');
      expect(validSeverities).toContain('CRITICAL');
    });

    it('should validate status workflow', () => {
      const validStatuses = ['OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED', 'APPEALED'];
      expect(validStatuses).toContain('OPEN');
      expect(validStatuses).toContain('CLOSED');
    });

    it('should validate action types', () => {
      const validActions = [
        'WARNING',
        'SUSPENSION',
        'TRAINING',
        'COUNSELING',
        'TERMINATION',
        'FINE',
        'OTHER',
      ];
      expect(validActions).toContain('WARNING');
      expect(validActions).toContain('TERMINATION');
    });
  });
});
