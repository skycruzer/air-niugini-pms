/**
 * Input Sanitization Utilities
 *
 * Provides comprehensive input validation and sanitization to prevent:
 * - SQL injection attacks
 * - XSS (Cross-Site Scripting) attacks
 * - Path traversal attacks
 * - Command injection
 * - Invalid data formats
 */

/**
 * SQL injection patterns to detect and block
 */
const SQL_INJECTION_PATTERNS = [
  /(\bor\b|\band\b).*?[=<>]/i, // OR/AND with comparison operators
  /union.*?select/i, // UNION SELECT queries
  /insert\s+into/i, // INSERT statements
  /delete\s+from/i, // DELETE statements
  /drop\s+(table|database)/i, // DROP statements
  /update\s+\w+\s+set/i, // UPDATE statements
  /exec(\s|\()/i, // EXEC commands
  /script.*?src/i, // Script tags with src
  /<script/i, // Script tags
  /javascript:/i, // JavaScript protocol
  /on\w+\s*=/i, // Event handlers (onclick, onerror, etc.)
  /'\s*(or|and)\s*'?\d/i, // Classic SQL injection pattern
  /--/, // SQL comments
  /\/\*/, // SQL block comments
  /xp_/i, // SQL Server extended procedures
  /sp_/i, // SQL Server stored procedures
  /0x[0-9a-f]+/i, // Hexadecimal literals
];

/**
 * XSS patterns to detect and sanitize
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*>/gi,
  /<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi,
  /on\w+\s*=\s*["'].*?["']/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
];

/**
 * Path traversal patterns to block
 */
const PATH_TRAVERSAL_PATTERNS = [
  /\.\./, // Directory traversal
  /~\//, // Home directory reference
  /\0/, // Null byte
  /%00/, // URL-encoded null byte
  /%2e%2e/i, // URL-encoded ..
  /%252e%252e/i, // Double URL-encoded ..
];

/**
 * Sanitize string input by escaping HTML and removing dangerous characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Remove all HTML tags from input
 */
export function stripHtml(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

/**
 * Check if input contains SQL injection patterns
 */
export function containsSqlInjection(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  const normalizedInput = input.toLowerCase().trim();
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(normalizedInput));
}

/**
 * Check if input contains XSS patterns
 */
export function containsXss(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  return XSS_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Check if input contains path traversal patterns
 */
export function containsPathTraversal(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  return PATH_TRAVERSAL_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') {
    return null;
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

  if (!emailRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Validate and sanitize employee ID (Air Niugini format)
 * Expected format: Letters and numbers only, up to 20 characters
 */
export function sanitizeEmployeeId(employeeId: string): string | null {
  if (typeof employeeId !== 'string') {
    return null;
  }

  const trimmed = employeeId.trim().toUpperCase();
  const employeeIdRegex = /^[A-Z0-9-]{1,20}$/;

  if (!employeeIdRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Validate and sanitize date string (ISO 8601 format)
 */
export function sanitizeDate(dateString: string): string | null {
  if (typeof dateString !== 'string') {
    return null;
  }

  const trimmed = dateString.trim();
  const date = new Date(trimmed);

  // Check if valid date
  if (isNaN(date.getTime())) {
    return null;
  }

  // Check if reasonable date range (1900-2100)
  const year = date.getFullYear();
  if (year < 1900 || year > 2100) {
    return null;
  }

  // Return ISO format date
  return date.toISOString().split('T')[0];
}

/**
 * Validate and sanitize UUID
 */
export function sanitizeUuid(uuid: string): string | null {
  if (typeof uuid !== 'string') {
    return null;
  }

  const trimmed = uuid.trim().toLowerCase();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

  if (!uuidRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Validate and sanitize phone number
 * Allows international formats with +, -, spaces, and parentheses
 */
export function sanitizePhone(phone: string): string | null {
  if (typeof phone !== 'string') {
    return null;
  }

  const trimmed = phone.trim();
  const phoneRegex = /^[+]?[\d\s\-()]{7,20}$/;

  if (!phoneRegex.test(trimmed)) {
    return null;
  }

  // Remove formatting for storage (keep only digits and +)
  return trimmed.replace(/[\s\-()]/g, '');
}

/**
 * Sanitize object recursively by applying string sanitization to all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Check for dangerous patterns
      if (containsSqlInjection(value)) {
        throw new Error(`Potentially dangerous SQL pattern detected in field: ${key}`);
      }
      if (containsXss(value)) {
        throw new Error(`Potentially dangerous XSS pattern detected in field: ${key}`);
      }
      if (containsPathTraversal(value)) {
        throw new Error(`Path traversal pattern detected in field: ${key}`);
      }

      // Apply sanitization based on field name
      if (key.toLowerCase().includes('email')) {
        sanitized[key] = sanitizeEmail(value);
      } else if (
        key.toLowerCase().includes('employee_id') ||
        key.toLowerCase().includes('employeeid')
      ) {
        sanitized[key] = sanitizeEmployeeId(value);
      } else if (key.toLowerCase().includes('date')) {
        // Don't sanitize date fields as they're handled separately
        sanitized[key] = value;
      } else if (key.toLowerCase() === 'id' || key.toLowerCase().endsWith('_id')) {
        // Don't sanitize ID fields as they might be UUIDs
        sanitized[key] = value;
      } else {
        // General string sanitization (preserve original for names, descriptions, etc.)
        sanitized[key] = stripHtml(value);
      }
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      // Sanitize array elements
      sanitized[key] = value.map((item) =>
        typeof item === 'string'
          ? stripHtml(item)
          : typeof item === 'object'
            ? sanitizeObject(item)
            : item
      );
    } else {
      // Keep non-string values as-is
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Validate request content type
 */
export function validateContentType(contentType: string | null, expected: string[]): boolean {
  if (!contentType) {
    return false;
  }

  return expected.some((type) => contentType.toLowerCase().includes(type.toLowerCase()));
}

/**
 * Sanitize filename for safe file operations
 */
export function sanitizeFilename(filename: string): string | null {
  if (typeof filename !== 'string') {
    return null;
  }

  // Remove path components
  let safe = filename.split(/[/\\]/).pop() || '';

  // Remove dangerous characters
  safe = safe.replace(/[^a-zA-Z0-9._-]/g, '');

  // Check for empty result
  if (!safe || safe === '.' || safe === '..') {
    return null;
  }

  // Limit length
  if (safe.length > 255) {
    const ext = safe.split('.').pop();
    const name = safe.substring(0, 200);
    safe = ext ? `${name}.${ext}` : name;
  }

  return safe;
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();

  // Block javascript: and data: protocols
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validate integer input within range
 */
export function sanitizeInteger(value: any, min?: number, max?: number): number | null {
  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);

  if (isNaN(num) || !Number.isInteger(num)) {
    return null;
  }

  if (min !== undefined && num < min) {
    return null;
  }

  if (max !== undefined && num > max) {
    return null;
  }

  return num;
}

/**
 * Validate float input within range
 */
export function sanitizeFloat(value: any, min?: number, max?: number): number | null {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  if (min !== undefined && num < min) {
    return null;
  }

  if (max !== undefined && num > max) {
    return null;
  }

  return num;
}

/**
 * Validate boolean input
 */
export function sanitizeBoolean(value: any): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (lower === 'true' || lower === '1' || lower === 'yes') {
      return true;
    }
    if (lower === 'false' || lower === '0' || lower === 'no') {
      return false;
    }
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return null;
}
