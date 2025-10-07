/**
 * Environment-aware logging utility
 *
 * In production:
 * - console.log statements are suppressed
 * - Only errors and warnings are logged
 * - Sensitive data is filtered
 *
 * In development:
 * - All logging levels are enabled
 * - Verbose debugging information is shown
 *
 * Usage:
 * import { logger } from '@/lib/logger';
 *
 * logger.info('User logged in', { userId: user.id });
 * logger.error('Failed to fetch data', error);
 * logger.debug('Processing request', { params });
 */

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Suppress all logging in test environment
const shouldLog = (level: 'debug' | 'info' | 'warn' | 'error'): boolean => {
  if (isTest) return false;
  if (isProduction) {
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error';
  }
  return true; // Log everything in development
};

/**
 * Sanitize sensitive data from logs
 */
function sanitizeData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data };
  const sensitiveKeys = [
    'password',
    'token',
    'access_token',
    'refresh_token',
    'api_key',
    'apiKey',
    'secret',
    'ssn',
    'credit_card',
    'passport_number',
  ];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
}

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args.map(sanitizeData));
    }
  },

  info: (message: string, ...args: any[]) => {
    if (shouldLog('info')) {
      console.log(`[INFO] ${message}`, ...args.map(sanitizeData));
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args.map(sanitizeData));
    }
  },

  error: (message: string, error?: Error | unknown, ...args: any[]) => {
    if (shouldLog('error')) {
      if (error instanceof Error) {
        console.error(`[ERROR] ${message}`, {
          message: error.message,
          stack: isProduction ? undefined : error.stack,
          ...args.map(sanitizeData),
        });
      } else {
        console.error(`[ERROR] ${message}`, error, ...args.map(sanitizeData));
      }
    }

    // TODO: In production, send to error tracking service (Sentry, LogRocket, etc.)
    if (isProduction && error instanceof Error) {
      // Example: Sentry.captureException(error);
    }
  },
};
