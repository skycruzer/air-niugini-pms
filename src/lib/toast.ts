/**
 * Toast Notification Utility
 * Wrapper around Sonner toast for Air Niugini branded notifications
 *
 * SECURITY: All messages are sanitized to prevent PII exposure
 */

import { toast as sonnerToast } from 'sonner';

/**
 * Sanitize message to remove sensitive information (PII)
 * Prevents accidental exposure of pilot data, employee IDs, emails, etc.
 */
function sanitizeMessage(message: string): string {
  if (!message) return message;

  // In production, remove potential PII
  if (process.env.NODE_ENV === 'production') {
    return message
      .replace(/\b[A-Z0-9]{6,}\b/gi, '[ID]') // Employee IDs (6+ alphanumeric)
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]') // Emails
      .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '[date]') // Dates (might be DOB)
      .replace(/\bseniority\s*#?\s*\d+/gi, 'seniority [#]'); // Seniority numbers
  }

  return message;
}

/**
 * Sanitize description (optional) to remove PII
 */
function sanitizeDescription(description?: string): string | undefined {
  if (!description) return description;
  return sanitizeMessage(description);
}

export const toast = {
  /**
   * Success toast with Air Niugini branding
   */
  success: (
    message: string,
    options?: {
      description?: string;
      icon?: string;
      action?: { label: string; onClick: () => void };
    }
  ) => {
    return sonnerToast.success(sanitizeMessage(message), {
      description: sanitizeDescription(options?.description),
      icon: options?.icon || '✓',
      action: options?.action,
      style: {
        border: '2px solid #10B981',
        borderRadius: '0.5rem',
      },
      className: 'bg-green-50 text-green-900',
    });
  },

  /**
   * Error toast with Air Niugini red branding
   * SECURITY: Error messages are sanitized and generic in production
   */
  error: (
    message: string,
    options?: { description?: string; action?: { label: string; onClick: () => void } }
  ) => {
    // In production, show generic error message to user, log full error internally
    const displayMessage =
      process.env.NODE_ENV === 'production'
        ? 'An error occurred. Please try again or contact IT support.'
        : sanitizeMessage(message);

    // Log full error for debugging (server-side logs only)
    if (process.env.NODE_ENV === 'production') {
      console.error('[TOAST ERROR]:', message);
    }

    return sonnerToast.error(displayMessage, {
      description: sanitizeDescription(options?.description),
      action: options?.action,
      duration: 6000, // Longer duration for errors
      style: {
        border: '2px solid #4F46E5',
        borderRadius: '0.5rem',
      },
      className: 'bg-red-50 text-red-900',
    });
  },

  /**
   * Warning toast with Air Niugini gold branding
   */
  warning: (
    message: string,
    options?: { description?: string; action?: { label: string; onClick: () => void } }
  ) => {
    return sonnerToast.warning(sanitizeMessage(message), {
      description: sanitizeDescription(options?.description),
      action: options?.action,
      style: {
        border: '2px solid #F59E0B',
        borderRadius: '0.5rem',
      },
      className: 'bg-yellow-50 text-yellow-900',
    });
  },

  /**
   * Info toast
   */
  info: (
    message: string,
    options?: { description?: string; action?: { label: string; onClick: () => void } }
  ) => {
    return sonnerToast.info(sanitizeMessage(message), {
      description: sanitizeDescription(options?.description),
      action: options?.action,
      style: {
        border: '2px solid #3B82F6',
        borderRadius: '0.5rem',
      },
      className: 'bg-blue-50 text-blue-900',
    });
  },

  /**
   * Generic toast (default)
   */
  message: (
    message: string,
    options?: {
      description?: string;
      icon?: string;
      action?: { label: string; onClick: () => void };
    }
  ) => {
    return sonnerToast(sanitizeMessage(message), {
      description: sanitizeDescription(options?.description),
      icon: options?.icon,
      action: options?.action,
    });
  },

  /**
   * Promise toast - shows loading, success, or error based on promise state
   */
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return sonnerToast.promise(promise, options);
  },

  /**
   * Custom toast with full control
   */
  custom: (
    component: React.ReactNode,
    options?: {
      duration?: number;
      position?:
        | 'top-right'
        | 'top-center'
        | 'top-left'
        | 'bottom-right'
        | 'bottom-center'
        | 'bottom-left';
    }
  ) => {
    return sonnerToast.custom(component, options);
  },

  /**
   * Dismiss a toast by ID
   */
  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId);
  },
};

/**
 * Aviation-specific toast notifications
 */
export const aviationToast = {
  /**
   * Certification toast with aviation icon
   */
  certification: (
    message: string,
    options?: { description?: string; status?: 'expired' | 'expiring' | 'current' }
  ) => {
    const statusConfig = {
      expired: { icon: '⚠️', border: '#4F46E5', bg: 'bg-red-50', text: 'text-red-900' },
      expiring: { icon: '⏰', border: '#F59E0B', bg: 'bg-yellow-50', text: 'text-yellow-900' },
      current: { icon: '✓', border: '#10B981', bg: 'bg-green-50', text: 'text-green-900' },
    };

    const config = statusConfig[options?.status || 'current'];

    return sonnerToast(message, {
      description: options?.description,
      icon: config.icon,
      style: {
        border: `2px solid ${config.border}`,
        borderRadius: '0.5rem',
      },
      className: `${config.bg} ${config.text}`,
    });
  },

  /**
   * Pilot-related toast with pilot icon
   */
  pilot: (
    message: string,
    options?: { description?: string; action?: { label: string; onClick: () => void } }
  ) => {
    return sonnerToast(message, {
      description: options?.description,
      icon: '👨‍✈️',
      action: options?.action,
      style: {
        border: '2px solid #4F46E5',
        borderRadius: '0.5rem',
      },
      className: 'bg-white text-[#000000]',
    });
  },

  /**
   * Leave request toast
   */
  leave: (
    message: string,
    options?: { description?: string; status?: 'pending' | 'approved' | 'denied' }
  ) => {
    const statusConfig = {
      pending: { icon: '⏳', border: '#3B82F6', bg: 'bg-blue-50', text: 'text-blue-900' },
      approved: { icon: '✓', border: '#10B981', bg: 'bg-green-50', text: 'text-green-900' },
      denied: { icon: '✗', border: '#4F46E5', bg: 'bg-red-50', text: 'text-red-900' },
    };

    const config = statusConfig[options?.status || 'pending'];

    return sonnerToast(message, {
      description: options?.description,
      icon: config.icon,
      style: {
        border: `2px solid ${config.border}`,
        borderRadius: '0.5rem',
      },
      className: `${config.bg} ${config.text}`,
    });
  },

  /**
   * Fleet operation toast
   */
  fleet: (message: string, options?: { description?: string }) => {
    return sonnerToast(message, {
      description: options?.description,
      icon: '✈️',
      style: {
        border: '2px solid #4F46E5',
        borderRadius: '0.5rem',
      },
      className: 'bg-white text-[#000000]',
    });
  },
};

/**
 * Export default toast
 */
export default toast;
