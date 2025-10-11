/**
 * Toast Service for Air Niugini Pilot Management System
 *
 * Centralized toast notification management with Air Niugini branding.
 * Uses react-hot-toast for consistent user feedback across the application.
 */

import toast, { Toast, Renderable, ValueOrFunction } from 'react-hot-toast';

// Air Niugini brand colors for consistent styling
const BRAND_COLORS = {
  red: '#4F46E5',
  gold: '#06B6D4',
  black: '#000000',
  white: '#FFFFFF',
};

// Default toast options with Air Niugini styling
const defaultOptions = {
  duration: 4000,
  position: 'top-right' as const,
  style: {
    background: BRAND_COLORS.white,
    color: BRAND_COLORS.black,
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    maxWidth: '500px',
  },
};

/**
 * Success toast notification
 * Green checkmark with success message
 */
export function toastSuccess(message: string, options?: Partial<Toast>) {
  return toast.success(message, {
    ...defaultOptions,
    ...options,
    style: {
      ...defaultOptions.style,
      ...options?.style,
    },
    iconTheme: {
      primary: '#10B981', // Green
      secondary: BRAND_COLORS.white,
    },
  });
}

/**
 * Error toast notification
 * Red error icon with Air Niugini red color
 */
export function toastError(message: string, options?: Partial<Toast>) {
  return toast.error(message, {
    ...defaultOptions,
    duration: 6000, // Longer duration for errors
    ...options,
    style: {
      ...defaultOptions.style,
      borderLeftWidth: '4px',
      borderLeftColor: BRAND_COLORS.red,
      ...options?.style,
    },
    iconTheme: {
      primary: BRAND_COLORS.red,
      secondary: BRAND_COLORS.white,
    },
  });
}

/**
 * Warning toast notification
 * Air Niugini gold color for warnings
 */
export function toastWarning(message: string, options?: Partial<Toast>) {
  return toast(message, {
    ...defaultOptions,
    duration: 5000,
    icon: '⚠️',
    ...options,
    style: {
      ...defaultOptions.style,
      borderLeftWidth: '4px',
      borderLeftColor: BRAND_COLORS.gold,
      ...options?.style,
    },
  });
}

/**
 * Info toast notification
 * Blue info icon for informational messages
 */
export function toastInfo(message: string, options?: Partial<Toast>) {
  return toast(message, {
    ...defaultOptions,
    icon: 'ℹ️',
    ...options,
    style: {
      ...defaultOptions.style,
      borderLeftWidth: '4px',
      borderLeftColor: '#3B82F6', // Blue
      ...options?.style,
    },
  });
}

/**
 * Loading toast notification
 * Shows a loading spinner with message
 */
export function toastLoading(message: string) {
  return toast.loading(message, {
    ...defaultOptions,
    duration: Infinity, // Loading toasts don't auto-dismiss
  });
}

/**
 * Promise toast - automatically shows loading, success, or error based on promise resolution
 * Perfect for async operations like API calls
 *
 * @example
 * toastPromise(
 *   updatePilot(id, data),
 *   {
 *     loading: 'Updating pilot...',
 *     success: 'Pilot updated successfully',
 *     error: 'Failed to update pilot'
 *   }
 * )
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: Renderable;
    success: ValueOrFunction<Renderable, T>;
    error: ValueOrFunction<Renderable, any>;
  },
  options?: Partial<Toast>
) {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    {
      ...defaultOptions,
      ...options,
      success: {
        ...defaultOptions,
        iconTheme: {
          primary: '#10B981',
          secondary: BRAND_COLORS.white,
        },
        ...options,
      },
      error: {
        ...defaultOptions,
        duration: 6000,
        style: {
          ...defaultOptions.style,
          borderLeftWidth: '4px',
          borderLeftColor: BRAND_COLORS.red,
        },
        iconTheme: {
          primary: BRAND_COLORS.red,
          secondary: BRAND_COLORS.white,
        },
        ...options,
      },
      loading: {
        ...defaultOptions,
        ...options,
      },
    }
  );
}

/**
 * Custom toast with full control over appearance
 */
export function toastCustom(message: string, options?: Partial<Toast>) {
  return toast(message, {
    ...defaultOptions,
    ...options,
  });
}

/**
 * Dismiss a specific toast by ID
 */
export function dismissToast(toastId?: string) {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss();
  }
}

/**
 * Remove a specific toast by ID (completely removes from DOM)
 */
export function removeToast(toastId: string) {
  toast.remove(toastId);
}

/**
 * Remove all toasts
 */
export function removeAllToasts() {
  toast.remove();
}

/**
 * Pre-configured toast messages for common operations
 */
export const toastMessages = {
  // Authentication
  auth: {
    loginSuccess: () => toastSuccess('Welcome back to Air Niugini PMS'),
    loginError: () => toastError('Login failed. Please check your credentials.'),
    logoutSuccess: () => toastSuccess('Successfully logged out'),
    sessionExpired: () => toastWarning('Your session has expired. Please log in again.'),
    unauthorized: () => toastError('You do not have permission to perform this action.'),
  },

  // Pilot operations
  pilot: {
    createSuccess: (name: string) => toastSuccess(`Pilot ${name} created successfully`),
    createError: () => toastError('Failed to create pilot. Please try again.'),
    updateSuccess: (name: string) => toastSuccess(`Pilot ${name} updated successfully`),
    updateError: () => toastError('Failed to update pilot. Please try again.'),
    deleteSuccess: (name: string) => toastSuccess(`Pilot ${name} deleted successfully`),
    deleteError: () => toastError('Failed to delete pilot. Please try again.'),
  },

  // Certification operations
  certification: {
    addSuccess: (checkType: string) => toastSuccess(`${checkType} added successfully`),
    addError: () => toastError('Failed to add certification. Please try again.'),
    updateSuccess: (checkType: string) => toastSuccess(`${checkType} updated successfully`),
    updateError: () => toastError('Failed to update certification. Please try again.'),
    deleteSuccess: (checkType: string) => toastSuccess(`${checkType} deleted successfully`),
    deleteError: () => toastError('Failed to delete certification. Please try again.'),
    bulkUpdateSuccess: (count: number) =>
      toastSuccess(`${count} certifications updated successfully`),
    bulkUpdateError: () => toastError('Failed to update certifications. Please try again.'),
    expiringSoon: (count: number) =>
      toastWarning(`${count} certifications expiring within 30 days`),
    expired: (count: number) => toastError(`${count} certifications have expired`),
  },

  // Leave operations
  leave: {
    requestSuccess: () => toastSuccess('Leave request submitted successfully'),
    requestError: () => toastError('Failed to submit leave request. Please try again.'),
    approveSuccess: () => toastSuccess('Leave request approved'),
    approveError: () => toastError('Failed to approve leave request.'),
    rejectSuccess: () => toastSuccess('Leave request rejected'),
    rejectError: () => toastError('Failed to reject leave request.'),
    deleteSuccess: () => toastSuccess('Leave request deleted successfully'),
    deleteError: () => toastError('Failed to delete leave request.'),
  },

  // General operations
  general: {
    saveSuccess: () => toastSuccess('Changes saved successfully'),
    saveError: () => toastError('Failed to save changes. Please try again.'),
    loadError: () => toastError('Failed to load data. Please refresh the page.'),
    networkError: () => toastError('Network error. Please check your connection.'),
    validationError: (message: string) => toastError(message),
    copiedToClipboard: () => toastSuccess('Copied to clipboard'),
    exportSuccess: (type: string) => toastSuccess(`${type} exported successfully`),
    exportError: () => toastError('Failed to export. Please try again.'),
  },

  // Settings
  settings: {
    updateSuccess: () => toastSuccess('Settings updated successfully'),
    updateError: () => toastError('Failed to update settings. Please try again.'),
  },
};

/**
 * Export the base toast for advanced usage
 */
export { toast };

/**
 * Default export - comprehensive toast service
 */
export default {
  success: toastSuccess,
  error: toastError,
  warning: toastWarning,
  info: toastInfo,
  loading: toastLoading,
  promise: toastPromise,
  custom: toastCustom,
  dismiss: dismissToast,
  remove: removeToast,
  removeAll: removeAllToasts,
  messages: toastMessages,
};
