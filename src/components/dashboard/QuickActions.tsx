'use client';

import { Plus, FileCheck, Calendar, FileText, UserPlus, ClipboardList } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { permissions } from '@/lib/auth-utils';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  color: 'red' | 'gold' | 'blue' | 'green' | 'purple';
  shortcut?: string;
  requiresPermission?: (user: any) => boolean;
}

interface QuickActionsProps {
  onAddPilot?: () => void;
  onAddCertification?: () => void;
  onCreateLeaveRequest?: () => void;
  onViewExpiring?: () => void;
  onGenerateReport?: () => void;
  onBulkUpdate?: () => void;
}

export function QuickActions({
  onAddPilot,
  onAddCertification,
  onCreateLeaveRequest,
  onViewExpiring,
  onGenerateReport,
  onBulkUpdate,
}: QuickActionsProps) {
  const { user } = useAuth();

  const actions: QuickAction[] = [
    {
      id: 'add-pilot',
      title: 'Add Pilot',
      description: 'Register new pilot to fleet',
      icon: UserPlus,
      action: () => onAddPilot?.(),
      color: 'red',
      shortcut: 'Ctrl+N',
      requiresPermission: (user) => permissions.canCreate(user),
    },
    {
      id: 'add-certification',
      title: 'Add Certification',
      description: 'Record new pilot certification',
      icon: FileCheck,
      action: () => onAddCertification?.(),
      color: 'green',
      shortcut: 'Ctrl+C',
    },
    {
      id: 'create-leave',
      title: 'Leave Request',
      description: 'Submit RDO/WDO request',
      icon: Calendar,
      action: () => onCreateLeaveRequest?.(),
      color: 'blue',
      shortcut: 'Ctrl+L',
    },
    {
      id: 'view-expiring',
      title: 'Expiring Certs',
      description: 'View expiring certifications',
      icon: ClipboardList,
      action: () => onViewExpiring?.(),
      color: 'gold',
      shortcut: 'Ctrl+E',
    },
    {
      id: 'generate-report',
      title: 'Generate Report',
      description: 'Create compliance report',
      icon: FileText,
      action: () => onGenerateReport?.(),
      color: 'purple',
      requiresPermission: (user) => permissions.canViewReports(user),
    },
    {
      id: 'bulk-update',
      title: 'Bulk Update',
      description: 'Update multiple certifications',
      icon: Plus,
      action: () => onBulkUpdate?.(),
      color: 'blue',
      requiresPermission: (user) => permissions.canEdit(user),
    },
  ];

  const getColorClasses = (color: QuickAction['color']) => {
    const classes = {
      red: {
        bg: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
        border: 'border-red-200 hover:border-red-300',
        text: 'text-red-600',
      },
      gold: {
        bg: 'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
        border: 'border-amber-200 hover:border-amber-300',
        text: 'text-amber-600',
      },
      blue: {
        bg: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
        border: 'border-blue-200 hover:border-blue-300',
        text: 'text-blue-600',
      },
      green: {
        bg: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
        border: 'border-green-200 hover:border-green-300',
        text: 'text-green-600',
      },
      purple: {
        bg: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
        border: 'border-purple-200 hover:border-purple-300',
        text: 'text-purple-600',
      },
    };
    return classes[color];
  };

  // Filter actions based on permissions
  const visibleActions = actions.filter((action) => {
    if (action.requiresPermission && user) {
      return action.requiresPermission(user);
    }
    return true;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {visibleActions.map((action) => {
        const Icon = action.icon;
        const colors = getColorClasses(action.color);

        return (
          <button
            key={action.id}
            onClick={action.action}
            className={`group relative p-5 bg-white rounded-xl border-2 ${colors.border} hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-left overflow-hidden`}
          >
            {/* Background gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative z-10 flex items-start">
              <div
                className={`w-12 h-12 bg-gradient-to-br ${colors.bg} rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-gray-800">
                    {action.title}
                  </h3>
                  {action.shortcut && (
                    <span className="text-xs text-gray-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                      {action.shortcut}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 group-hover:text-gray-700">
                  {action.description}
                </p>

                {/* Hover indicator */}
                <div className="mt-3 flex items-center text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className={colors.text}>Click to open</span>
                  <span className="ml-1">→</span>
                </div>
              </div>
            </div>

            {/* Animated border on hover */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-gray-200 rounded-xl transition-colors duration-300 pointer-events-none"></div>
          </button>
        );
      })}
    </div>
  );
}
