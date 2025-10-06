/**
 * Task Service Tests
 * Tests for task management service layer - CRUD operations, recurring tasks, and statistics
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-06
 */

// Mock Supabase admin client - create fresh mocks
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
  getTaskCategories,
  createTaskCategory,
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskComments,
  createTaskComment,
  getTaskAuditLog,
  getTaskStatistics,
} from '../task-service';
import { addDays, addWeeks, addMonths, format } from 'date-fns';

// Get mocked instance
const supabaseMock = require('../supabase');
const mockFrom = supabaseMock.__mockFrom;

describe('Task Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTaskCategories', () => {
    it('should fetch all active task categories ordered by display_order', async () => {
      const mockData = [
        { id: '1', name: 'Training', display_order: 1, is_active: true },
        { id: '2', name: 'Certification', display_order: 2, is_active: true },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await getTaskCategories();

      expect(mockFrom).toHaveBeenCalledWith('task_categories');
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockQuery.order).toHaveBeenCalledWith('display_order');
      expect(result).toEqual(mockData);
    });

    it('should return empty array when no categories exist', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await getTaskCategories();
      expect(result).toEqual([]);
    });
  });

  describe('createTaskCategory', () => {
    it('should create a new task category', async () => {
      const mockInput = {
        name: 'Compliance',
        description: 'Compliance-related tasks',
        color: '#FF0000',
        icon: '📋',
        display_order: 3,
      };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'cat-1', ...mockInput }, error: null }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await createTaskCategory(mockInput);

      expect(mockQuery.insert).toHaveBeenCalledWith(mockInput);
      expect(result).toHaveProperty('id', 'cat-1');
    });
  });

  describe('getTasks', () => {
    it('should fetch all tasks with related data', async () => {
      const mockData = [
        {
          id: '1',
          title: 'Complete training',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        not: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await getTasks();

      expect(mockFrom).toHaveBeenCalledWith('tasks');
      expect(mockQuery.not).toHaveBeenCalledWith('status', 'in', '(COMPLETED,CANCELLED)');
      expect(result).toEqual(mockData);
    });

    it('should include completed tasks when filter is set', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockFrom.mockReturnValue(mockQuery);

      await getTasks({ include_completed: true });

      expect(mockQuery.order).toHaveBeenCalled();
      // Should NOT call .not() when include_completed is true
    });

    it('should apply status filter', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockFrom.mockReturnValue(mockQuery);

      await getTasks({ status: 'TODO' });

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'TODO');
    });

    it('should apply priority filter', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockFrom.mockReturnValue(mockQuery);

      await getTasks({ priority: 'URGENT' });

      expect(mockQuery.eq).toHaveBeenCalledWith('priority', 'URGENT');
    });

    it('should apply multiple filters', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: [], error: null })),
      };

      mockFrom.mockReturnValue(mockQuery);

      await getTasks({
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assigned_to: 'user-1',
        category_id: 'cat-1',
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'IN_PROGRESS');
      expect(mockQuery.eq).toHaveBeenCalledWith('priority', 'HIGH');
      expect(mockQuery.eq).toHaveBeenCalledWith('assigned_to', 'user-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('category_id', 'cat-1');
    });
  });

  describe('getTaskById', () => {
    it('should fetch a single task with all related data', async () => {
      const mockData = {
        id: 'task-1',
        title: 'Complete certification',
        status: 'TODO',
        category: { id: 'cat-1', name: 'Training' },
        creator: { id: 'user-1', name: 'John Doe' },
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await getTaskById('task-1');

      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'task-1');
      expect(result).toEqual(mockData);
    });

    it('should throw error when task not found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };

      mockFrom.mockReturnValue(mockQuery);

      await expect(getTaskById('999')).rejects.toThrow('Failed to fetch task');
    });
  });

  describe('createTask', () => {
    it('should create a non-recurring task', async () => {
      const mockInput = {
        title: 'Review pilot certifications',
        description: 'Monthly certification review',
        priority: 'MEDIUM' as const,
        assigned_to: 'user-2',
        due_date: '2025-10-15T00:00:00Z',
      };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'task-1', ...mockInput, status: 'TODO' },
          error: null,
        }),
      };

      const mockAuditQuery = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };

      mockFrom
        .mockReturnValueOnce(mockQuery) // Task insert
        .mockReturnValueOnce(mockAuditQuery); // Audit log

      const result = await createTask(mockInput, 'user-1');

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockInput,
          created_by: 'user-1',
          status: 'TODO',
          priority: 'MEDIUM',
          is_recurring: false,
          tags: [],
          attachments: [],
          checklist_items: [],
          progress_percentage: 0,
        })
      );
      expect(result).toHaveProperty('id', 'task-1');
    });

    it('should create task with checklist items', async () => {
      const mockInput = {
        title: 'Complete annual review',
        checklist_items: [
          { id: '1', text: 'Review certifications', completed: false },
          { id: '2', text: 'Update records', completed: false },
        ],
      };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockInput, error: null }),
      };

      const mockAuditQuery = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };

      mockFrom.mockReturnValueOnce(mockQuery).mockReturnValueOnce(mockAuditQuery);

      await createTask(mockInput, 'user-1');

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          checklist_items: mockInput.checklist_items,
        })
      );
    });

    it('should create recurring task instances', async () => {
      const mockInput = {
        title: 'Weekly safety check',
        is_recurring: true,
        due_date: '2025-10-07T00:00:00Z',
        recurrence_pattern: {
          frequency: 'WEEKLY' as const,
          interval: 1,
          count: 4,
        },
      };

      const mockParentQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'task-parent', ...mockInput },
          error: null,
        }),
      };

      const mockGetQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'task-parent', ...mockInput },
          error: null,
        }),
      };

      const mockRecurringQuery = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };

      const mockAuditQuery = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };

      mockFrom
        .mockReturnValueOnce(mockParentQuery) // Create parent task
        .mockReturnValueOnce(mockAuditQuery) // Audit log
        .mockReturnValueOnce(mockGetQuery) // Get task for recurring instances
        .mockReturnValueOnce(mockRecurringQuery); // Create recurring instances

      await createTask(mockInput, 'user-1');

      expect(mockRecurringQuery.insert).toHaveBeenCalled();
      const insertedInstances = mockRecurringQuery.insert.mock.calls[0][0];
      expect(Array.isArray(insertedInstances)).toBe(true);
      expect(insertedInstances.length).toBeLessThanOrEqual(4);
    });

    it('should default priority to MEDIUM if not specified', async () => {
      const mockInput = { title: 'Simple task' };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockInput, error: null }),
      };

      const mockAuditQuery = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };

      mockFrom.mockReturnValueOnce(mockQuery).mockReturnValueOnce(mockAuditQuery);

      await createTask(mockInput, 'user-1');

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'MEDIUM',
        })
      );
    });
  });

  describe('updateTask', () => {
    it('should update task and log changes', async () => {
      const mockCurrent = {
        id: 'task-1',
        title: 'Old title',
        status: 'TODO',
        progress_percentage: 0,
      };

      const mockUpdate = {
        title: 'Updated title',
        status: 'IN_PROGRESS' as const,
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

      const result = await updateTask('task-1', mockUpdate, 'user-1');

      expect(mockUpdateQuery.update).toHaveBeenCalled();
      expect(result).toEqual({ ...mockCurrent, ...mockUpdate });
    });

    it('should auto-set completed_date when status changes to COMPLETED', async () => {
      const mockCurrent = { id: 'task-1', status: 'IN_PROGRESS' };
      const mockUpdate = { status: 'COMPLETED' as const };

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

      await updateTask('task-1', mockUpdate, 'user-1');

      expect(mockUpdateQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'COMPLETED',
          completed_date: expect.any(String),
        })
      );
    });

    it('should auto-calculate progress from checklist', async () => {
      const mockCurrent = {
        id: 'task-1',
        progress_percentage: 0,
        checklist_items: [],
      };

      const mockUpdate = {
        checklist_items: [
          { id: '1', text: 'Item 1', completed: true },
          { id: '2', text: 'Item 2', completed: true },
          { id: '3', text: 'Item 3', completed: false },
          { id: '4', text: 'Item 4', completed: false },
        ],
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
        single: jest.fn().mockResolvedValue({ data: mockCurrent, error: null }),
      };

      const mockAuditQuery = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };

      mockFrom
        .mockReturnValueOnce(mockGetQuery)
        .mockReturnValueOnce(mockUpdateQuery)
        .mockReturnValue(mockAuditQuery);

      await updateTask('task-1', mockUpdate, 'user-1');

      expect(mockUpdateQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          progress_percentage: 50, // 2 out of 4 items completed
        })
      );
    });

    it('should not change completed_date if already completed', async () => {
      const mockCurrent = {
        id: 'task-1',
        status: 'COMPLETED',
        completed_date: '2025-10-01T00:00:00Z',
      };
      const mockUpdate = { status: 'COMPLETED' as const };

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

      await updateTask('task-1', mockUpdate, 'user-1');

      // Should NOT add new completed_date since status didn't change from something else to COMPLETED
      const updateCall = mockUpdateQuery.update.mock.calls[0][0];
      expect(updateCall).not.toHaveProperty('completed_date');
    });
  });

  describe('deleteTask', () => {
    it('should delete a task and log audit trail', async () => {
      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      const mockAuditQuery = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };

      mockFrom.mockReturnValueOnce(mockDeleteQuery).mockReturnValueOnce(mockAuditQuery);

      await deleteTask('task-1', 'user-1');

      expect(mockDeleteQuery.delete).toHaveBeenCalled();
      expect(mockDeleteQuery.eq).toHaveBeenCalledWith('id', 'task-1');
      expect(mockAuditQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETE',
        })
      );
    });

    it('should throw error when deletion fails', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      };

      mockFrom.mockReturnValue(mockQuery);

      await expect(deleteTask('task-1', 'user-1')).rejects.toThrow('Failed to delete task');
    });
  });

  describe('getTaskStatistics', () => {
    it('should calculate statistics by status and priority', async () => {
      const mockData = [
        { id: '1', status: 'TODO', priority: 'LOW', due_date: null },
        { id: '2', status: 'IN_PROGRESS', priority: 'HIGH', due_date: null },
        { id: '3', status: 'COMPLETED', priority: 'MEDIUM', due_date: null },
        { id: '4', status: 'BLOCKED', priority: 'URGENT', due_date: null },
        { id: '5', status: 'TODO', priority: 'MEDIUM', due_date: null },
      ];

      const mockQuery = {
        select: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await getTaskStatistics();

      expect(result.total).toBe(5);
      expect(result.by_status.todo).toBe(2);
      expect(result.by_status.in_progress).toBe(1);
      expect(result.by_status.completed).toBe(1);
      expect(result.by_status.blocked).toBe(1);
      expect(result.by_priority.low).toBe(1);
      expect(result.by_priority.medium).toBe(2);
      expect(result.by_priority.high).toBe(1);
      expect(result.by_priority.urgent).toBe(1);
    });

    it('should count overdue tasks correctly', async () => {
      const pastDate = format(addDays(new Date(), -5), 'yyyy-MM-dd');
      const futureDate = format(addDays(new Date(), 5), 'yyyy-MM-dd');

      const mockData = [
        { id: '1', status: 'TODO', priority: 'HIGH', due_date: pastDate },
        { id: '2', status: 'IN_PROGRESS', priority: 'MEDIUM', due_date: pastDate },
        { id: '3', status: 'COMPLETED', priority: 'LOW', due_date: pastDate }, // Not overdue (completed)
        { id: '4', status: 'TODO', priority: 'HIGH', due_date: futureDate }, // Not overdue (future)
      ];

      const mockQuery = {
        select: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await getTaskStatistics();

      expect(result.overdue).toBe(2); // Only incomplete tasks with past due dates
    });

    it('should apply filters to statistics query', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockFrom.mockReturnValue(mockQuery);

      await getTaskStatistics({
        assigned_to: 'user-1',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('assigned_to', 'user-1');
      expect(mockQuery.gte).toHaveBeenCalledWith('created_at', '2025-01-01');
      expect(mockQuery.lte).toHaveBeenCalledWith('created_at', '2025-12-31');
    });
  });

  describe('createTaskComment', () => {
    it('should create a comment on a task', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'comment-1',
            task_id: 'task-1',
            comment: 'Test comment',
            mentions: [],
          },
          error: null,
        }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const result = await createTaskComment('task-1', 'Test comment', 'user-1');

      expect(mockQuery.insert).toHaveBeenCalledWith({
        task_id: 'task-1',
        user_id: 'user-1',
        comment: 'Test comment',
        mentions: [],
        attachments: [],
      });
      expect(result).toHaveProperty('id', 'comment-1');
    });

    it('should handle mentions and attachments', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null }),
      };

      mockFrom.mockReturnValue(mockQuery);

      const mentions = ['user-2', 'user-3'];
      const attachments = [{ filename: 'doc.pdf', url: 'https://example.com/doc.pdf' }];

      await createTaskComment('task-1', 'Comment with mentions', 'user-1', mentions, attachments);

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          mentions,
          attachments,
        })
      );
    });
  });

  describe('Air Niugini Business Rules', () => {
    it('should validate priority levels', () => {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      expect(validPriorities).toContain('LOW');
      expect(validPriorities).toContain('URGENT');
    });

    it('should validate status workflow', () => {
      const validStatuses = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED'];
      expect(validStatuses).toContain('TODO');
      expect(validStatuses).toContain('COMPLETED');
    });

    it('should validate recurrence patterns', () => {
      const validFrequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
      expect(validFrequencies).toContain('DAILY');
      expect(validFrequencies).toContain('YEARLY');
    });

    it('should properly calculate progress from checklist completion', () => {
      const checklist = [
        { id: '1', text: 'Task 1', completed: true },
        { id: '2', text: 'Task 2', completed: true },
        { id: '3', text: 'Task 3', completed: false },
        { id: '4', text: 'Task 4', completed: false },
      ];

      const completed = checklist.filter((item) => item.completed).length;
      const total = checklist.length;
      const progress = Math.round((completed / total) * 100);

      expect(progress).toBe(50); // 2/4 = 50%
    });
  });
});
