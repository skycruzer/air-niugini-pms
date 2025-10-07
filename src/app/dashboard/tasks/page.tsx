/**
 * @fileoverview Tasks Dashboard Page
 * Main page for viewing and managing tasks and to-do items
 *
 * @author Air Niugini Development Team
 * @version 1.0.1
 * @since 2025-10-06
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Filter,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  LayoutGrid,
  List as ListIcon,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { apiGet } from '@/lib/api-client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

type ViewMode = 'list' | 'kanban';

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState({
    status: 'active',
    priority: 'all',
    assigned_to: 'all',
    category_id: 'all',
  });

  // Fetch tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status !== 'all') {
        if (filters.status === 'active') {
          params.set('include_completed', 'false');
        } else {
          params.set('status', filters.status);
        }
      }
      if (filters.priority !== 'all') params.set('priority', filters.priority);
      if (filters.assigned_to !== 'all') params.set('assigned_to', filters.assigned_to);
      if (filters.category_id !== 'all') params.set('category_id', filters.category_id);

      return apiGet(`/api/tasks?${params}`);
    },
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['task-stats'],
    queryFn: async () => {
      return apiGet('/api/tasks?action=statistics');
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['task-categories'],
    queryFn: async () => {
      return apiGet('/api/tasks?action=categories');
    },
  });

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tasks & To-Do List</h1>
              <p className="text-gray-600 mt-1">Manage your tasks and track progress</p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} hover:bg-blue-700 hover:text-white transition-colors`}
                >
                  <ListIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-4 py-2 ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} hover:bg-blue-700 hover:text-white transition-colors`}
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
              </div>

              <Link
                href="/dashboard/tasks/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Task
              </Link>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats?.data && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard
                title="Total Tasks"
                value={stats.data.total}
                icon={CheckCircle2}
                color="blue"
              />
              <StatCard
                title="To Do"
                value={stats.data.by_status.todo}
                icon={Circle}
                color="gray"
              />
              <StatCard
                title="In Progress"
                value={stats.data.by_status.in_progress}
                icon={Clock}
                color="yellow"
              />
              <StatCard
                title="Completed"
                value={stats.data.by_status.completed}
                icon={CheckCircle2}
                color="green"
              />
              <StatCard title="Overdue" value={stats.data.overdue} icon={AlertCircle} color="red" />
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="active">Active Only</option>
                  <option value="all">All Tasks</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                >
                  <option value="all">All Priorities</option>
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  value={filters.category_id}
                  onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
                >
                  <option value="all">All Categories</option>
                  {categories?.data?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tasks Display */}
          {viewMode === 'list' ? (
            <TasksListView tasks={tasks?.data || []} isLoading={isLoading} />
          ) : (
            <TasksKanbanView tasks={tasks?.data || []} isLoading={isLoading} />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function TasksListView({ tasks, isLoading }: { tasks: any[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
        No tasks found
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Task
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{task.title}</div>
                  {task.description && (
                    <div className="text-sm text-gray-500 truncate max-w-md">
                      {task.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {task.category && (
                    <span
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{
                        backgroundColor: task.category.color + '20',
                        color: task.category.color,
                      }}
                    >
                      {task.category.name}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{task.assignee?.name || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : '-'}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${task.progress_percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{task.progress_percentage}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/dashboard/tasks/${task.id}`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TasksKanbanView({ tasks, isLoading }: { tasks: any[]; isLoading: boolean }) {
  const columns = [
    { id: 'TODO', title: 'To Do', color: 'border-gray-300' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-yellow-300' },
    { id: 'BLOCKED', title: 'Blocked', color: 'border-red-300' },
    { id: 'COMPLETED', title: 'Completed', color: 'border-green-300' },
  ];

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.id);

        return (
          <div key={column.id} className={`bg-gray-50 rounded-lg border-t-4 ${column.color} p-4`}>
            <h3 className="font-semibold text-gray-900 mb-4">
              {column.title} ({columnTasks.length})
            </h3>
            <div className="space-y-3">
              {columnTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/dashboard/tasks/${task.id}`}
                  className="block bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                    <PriorityBadge priority={task.priority} size="sm" />
                  </div>
                  {task.category && (
                    <span
                      className="inline-block px-2 py-1 text-xs font-medium rounded-full mb-2"
                      style={{
                        backgroundColor: task.category.color + '20',
                        color: task.category.color,
                      }}
                    >
                      {task.category.name}
                    </span>
                  )}
                  {task.due_date && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 mt-2">
                      <Clock className="w-3 h-3" />
                      {format(new Date(task.due_date), 'MMM d')}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${task.progress_percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{task.progress_percentage}%</span>
                  </div>
                </Link>
              ))}
              {columnTasks.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-4">No tasks</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PriorityBadge({
  priority,
  size = 'normal',
}: {
  priority: string;
  size?: 'sm' | 'normal';
}) {
  const styles = {
    URGENT: 'bg-red-100 text-red-800',
    HIGH: 'bg-orange-100 text-orange-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    LOW: 'bg-blue-100 text-blue-800',
  };

  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <span
      className={`${sizeClass} font-medium rounded-full ${styles[priority as keyof typeof styles]}`}
    >
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    TODO: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    BLOCKED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-600',
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
