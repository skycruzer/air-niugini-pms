'use client';

import { toast } from 'sonner';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Professional Toast Notification Utilities
 * Using Sonner with Air Niugini branding and enhanced features
 */

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  description?: string;
  action?: ToastAction;
  duration?: number;
  dismissible?: boolean;
}

/**
 * Success toast with green checkmark animation
 */
export function showSuccessToast(message: string, options?: ToastOptions) {
  return toast.success(message, {
    description: options?.description,
    duration: options?.duration || 4000,
    dismissible: options?.dismissible ?? true,
    icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    action: options?.action
      ? {
          label: options.action.label,
          onClick: options.action.onClick,
        }
      : undefined,
    className:
      'bg-white border-l-4 border-green-500 shadow-lg rounded-lg backdrop-blur-sm',
    style: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
    },
  });
}

/**
 * Error toast with red X icon
 */
export function showErrorToast(message: string, options?: ToastOptions) {
  return toast.error(message, {
    description: options?.description,
    duration: options?.duration || 5000,
    dismissible: options?.dismissible ?? true,
    icon: <XCircle className="w-5 h-5 text-red-600" />,
    action: options?.action
      ? {
          label: options.action.label,
          onClick: options.action.onClick,
        }
      : undefined,
    className:
      'bg-white border-l-4 border-red-500 shadow-lg rounded-lg backdrop-blur-sm',
    style: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
    },
  });
}

/**
 * Warning toast with amber alert icon
 */
export function showWarningToast(message: string, options?: ToastOptions) {
  return toast.warning(message, {
    description: options?.description,
    duration: options?.duration || 4500,
    dismissible: options?.dismissible ?? true,
    icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    action: options?.action
      ? {
          label: options.action.label,
          onClick: options.action.onClick,
        }
      : undefined,
    className:
      'bg-white border-l-4 border-amber-500 shadow-lg rounded-lg backdrop-blur-sm',
    style: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
    },
  });
}

/**
 * Info toast with blue info icon
 */
export function showInfoToast(message: string, options?: ToastOptions) {
  return toast.info(message, {
    description: options?.description,
    duration: options?.duration || 4000,
    dismissible: options?.dismissible ?? true,
    icon: <Info className="w-5 h-5 text-blue-600" />,
    action: options?.action
      ? {
          label: options.action.label,
          onClick: options.action.onClick,
        }
      : undefined,
    className:
      'bg-white border-l-4 border-blue-500 shadow-lg rounded-lg backdrop-blur-sm',
    style: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
    },
  });
}

/**
 * Loading toast with spinner
 */
export function showLoadingToast(message: string, options?: Omit<ToastOptions, 'action'>) {
  return toast.loading(message, {
    description: options?.description,
    duration: options?.duration || Infinity,
    dismissible: options?.dismissible ?? false,
    className:
      'bg-white border-l-4 border-blue-500 shadow-lg rounded-lg backdrop-blur-sm',
    style: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
    },
  });
}

/**
 * Promise toast - automatically shows loading, success, and error states
 */
export function showPromiseToast<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  },
  options?: ToastOptions
) {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
    duration: options?.duration,
    action: options?.action
      ? {
          label: options.action.label,
          onClick: options.action.onClick,
        }
      : undefined,
    className: 'bg-white shadow-lg rounded-lg backdrop-blur-sm',
    style: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
    },
  });
}

/**
 * Custom toast with full control
 */
export function showCustomToast(
  message: string,
  options?: ToastOptions & {
    icon?: React.ReactNode;
    className?: string;
  }
) {
  return toast(message, {
    description: options?.description,
    duration: options?.duration || 4000,
    dismissible: options?.dismissible ?? true,
    icon: options?.icon,
    action: options?.action
      ? {
          label: options.action.label,
          onClick: options.action.onClick,
        }
      : undefined,
    className: options?.className || 'bg-white shadow-lg rounded-lg backdrop-blur-sm',
    style: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
    },
  });
}

/**
 * Dismiss a specific toast
 */
export function dismissToast(toastId: string | number) {
  toast.dismiss(toastId);
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts() {
  toast.dismiss();
}

/**
 * Common toast patterns for Air Niugini PMS
 */
export const commonToasts = {
  /**
   * Pilot-related toasts
   */
  pilot: {
    created: () => showSuccessToast('Pilot created successfully', {
      description: 'The new pilot has been added to the system',
    }),
    updated: () => showSuccessToast('Pilot updated successfully', {
      description: 'Changes have been saved',
    }),
    deleted: () => showSuccessToast('Pilot removed', {
      description: 'The pilot has been removed from the system',
    }),
    error: () => showErrorToast('Failed to save pilot', {
      description: 'Please check the information and try again',
    }),
  },

  /**
   * Certification-related toasts
   */
  certification: {
    updated: () => showSuccessToast('Certification updated', {
      description: 'Certification status has been updated',
    }),
    expiring: (count: number) => showWarningToast(`${count} certifications expiring soon`, {
      description: 'Review and schedule renewals',
    }),
    expired: (count: number) => showErrorToast(`${count} certifications expired`, {
      description: 'Immediate attention required',
      action: {
        label: 'View',
        onClick: () => window.location.href = '/dashboard/certifications',
      },
    }),
  },

  /**
   * Leave request toasts
   */
  leave: {
    submitted: () => showSuccessToast('Leave request submitted', {
      description: 'Your request is pending approval',
    }),
    approved: () => showSuccessToast('Leave request approved', {
      description: 'The leave request has been approved',
    }),
    denied: () => showInfoToast('Leave request denied', {
      description: 'The leave request was not approved',
    }),
  },

  /**
   * System toasts
   */
  system: {
    saved: () => showSuccessToast('Changes saved', {
      duration: 2000,
    }),
    loading: (message: string) => showLoadingToast(message),
    error: (message: string) => showErrorToast('An error occurred', {
      description: message,
    }),
    offline: () => showWarningToast('Connection lost', {
      description: 'Check your internet connection',
      duration: Infinity,
    }),
    online: () => showSuccessToast('Connection restored', {
      description: 'You are back online',
      duration: 2000,
    }),
  },

  /**
   * Export toasts
   */
  export: {
    starting: () => showLoadingToast('Preparing export...'),
    success: (filename: string) => showSuccessToast('Export completed', {
      description: `Downloaded ${filename}`,
      duration: 3000,
    }),
    error: () => showErrorToast('Export failed', {
      description: 'Unable to export data. Please try again',
    }),
  },
};
