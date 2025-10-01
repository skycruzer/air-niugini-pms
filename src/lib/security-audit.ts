/**
 * Security Audit Logging System
 *
 * Tracks and logs all security-related events for monitoring and compliance:
 * - Failed authentication attempts
 * - Rate limit violations
 * - Invalid CSRF tokens
 * - Suspicious input patterns
 * - Unauthorized access attempts
 * - System security errors
 */

import { getSupabaseAdmin } from './supabase';

/**
 * Security event types
 */
export enum SecurityEventType {
  // Authentication events
  FAILED_LOGIN = 'failed_login',
  SUCCESSFUL_LOGIN = 'successful_login',
  LOGOUT = 'logout',
  SESSION_EXPIRED = 'session_expired',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',

  // Rate limiting events
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  RATE_LIMIT_WARNING = 'rate_limit_warning',

  // CSRF protection events
  CSRF_VALIDATION_FAILED = 'csrf_validation_failed',
  CSRF_TOKEN_MISSING = 'csrf_token_missing',
  CSRF_TOKEN_EXPIRED = 'csrf_token_expired',

  // Input validation events
  SUSPICIOUS_INPUT = 'suspicious_input',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  PATH_TRAVERSAL_ATTEMPT = 'path_traversal_attempt',

  // Request validation events
  INVALID_REQUEST = 'invalid_request',
  INVALID_API_KEY = 'invalid_api_key',
  INVALID_CONTENT_TYPE = 'invalid_content_type',

  // System events
  SYSTEM_ERROR = 'system_error',
  SECURITY_SCAN = 'security_scan',
  CONFIGURATION_CHANGE = 'configuration_change',
}

/**
 * Security event severity levels
 */
export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Security event interface
 */
export interface SecurityEvent {
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  identifier: string; // IP address or user ID
  userId?: string;
  url?: string;
  method?: string;
  details?: Record<string, any>;
  timestamp?: Date;
}

/**
 * In-memory buffer for security events (fallback if database write fails)
 */
const eventBuffer: SecurityEvent[] = [];
const MAX_BUFFER_SIZE = 1000;

/**
 * Log security event to database
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  const timestamp = event.timestamp || new Date();

  const eventData = {
    event_type: event.eventType,
    severity: event.severity,
    identifier: event.identifier,
    user_id: event.userId || null,
    url: event.url || null,
    method: event.method || null,
    details: event.details || {},
    timestamp: timestamp.toISOString(),
  };

  console.log('🔐 Security event:', {
    type: event.eventType,
    severity: event.severity,
    identifier: event.identifier,
  });

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Try to write to database
    const { error } = await supabaseAdmin.from('security_audit_log').insert([eventData]);

    if (error) {
      console.error('🚨 Failed to log security event to database:', error);

      // Add to in-memory buffer as fallback
      addToBuffer(event);
    }
  } catch (error) {
    console.error('🚨 Error logging security event:', error);

    // Add to in-memory buffer as fallback
    addToBuffer(event);
  }
}

/**
 * Add event to in-memory buffer
 */
function addToBuffer(event: SecurityEvent): void {
  eventBuffer.push(event);

  // Limit buffer size
  if (eventBuffer.length > MAX_BUFFER_SIZE) {
    eventBuffer.shift();
  }

  console.warn('⚠️ Security event buffered (database write failed)', {
    bufferSize: eventBuffer.length,
  });
}

/**
 * Flush buffered events to database
 */
export async function flushSecurityEventBuffer(): Promise<void> {
  if (eventBuffer.length === 0) {
    return;
  }

  console.log(`📤 Flushing ${eventBuffer.length} buffered security events...`);

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const eventsToInsert = eventBuffer.map((event) => ({
      event_type: event.eventType,
      severity: event.severity,
      identifier: event.identifier,
      user_id: event.userId || null,
      url: event.url || null,
      method: event.method || null,
      details: event.details || {},
      timestamp: (event.timestamp || new Date()).toISOString(),
    }));

    const { error } = await supabaseAdmin.from('security_audit_log').insert(eventsToInsert);

    if (error) {
      console.error('🚨 Failed to flush security event buffer:', error);
    } else {
      // Clear buffer on success
      eventBuffer.length = 0;
      console.log('✅ Security event buffer flushed successfully');
    }
  } catch (error) {
    console.error('🚨 Error flushing security event buffer:', error);
  }
}

/**
 * Get buffered events (for debugging)
 */
export function getBufferedEvents(): SecurityEvent[] {
  return [...eventBuffer];
}

/**
 * Query security events from database
 */
export async function getSecurityEvents(filters?: {
  eventType?: SecurityEventType;
  severity?: SecurityEventSeverity;
  identifier?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<SecurityEvent[]> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    let query = supabaseAdmin
      .from('security_audit_log')
      .select('*')
      .order('timestamp', { ascending: false });

    // Apply filters
    if (filters?.eventType) {
      query = query.eq('event_type', filters.eventType);
    }

    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }

    if (filters?.identifier) {
      query = query.eq('identifier', filters.identifier);
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.startDate) {
      query = query.gte('timestamp', filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte('timestamp', filters.endDate.toISOString());
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    } else {
      query = query.limit(100); // Default limit
    }

    const { data, error } = await query;

    if (error) {
      console.error('🚨 Failed to query security events:', error);
      return [];
    }

    return (data || []).map((row) => ({
      eventType: row.event_type as SecurityEventType,
      severity: row.severity as SecurityEventSeverity,
      identifier: row.identifier,
      userId: row.user_id,
      url: row.url,
      method: row.method,
      details: row.details,
      timestamp: new Date(row.timestamp),
    }));
  } catch (error) {
    console.error('🚨 Error querying security events:', error);
    return [];
  }
}

/**
 * Get security event statistics
 */
export async function getSecurityEventStats(
  startDate?: Date,
  endDate?: Date
): Promise<{
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<SecurityEventSeverity, number>;
  recentHighSeverity: number;
}> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    let query = supabaseAdmin.from('security_audit_log').select('event_type, severity, timestamp');

    if (startDate) {
      query = query.gte('timestamp', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('timestamp', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('🚨 Failed to get security event stats:', error);
      return {
        total: 0,
        byType: {},
        bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
        recentHighSeverity: 0,
      };
    }

    const events = data || [];
    const byType: Record<string, number> = {};
    const bySeverity: Record<SecurityEventSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    // Count events by type and severity
    for (const event of events) {
      // Count by type
      byType[event.event_type] = (byType[event.event_type] || 0) + 1;

      // Count by severity
      bySeverity[event.severity as SecurityEventSeverity]++;
    }

    // Count recent high severity events (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentHighSeverity = events.filter((event) => {
      const timestamp = new Date(event.timestamp);
      const severity = event.severity as SecurityEventSeverity;
      return timestamp >= oneDayAgo && (severity === 'high' || severity === 'critical');
    }).length;

    return {
      total: events.length,
      byType,
      bySeverity,
      recentHighSeverity,
    };
  } catch (error) {
    console.error('🚨 Error getting security event stats:', error);
    return {
      total: 0,
      byType: {},
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      recentHighSeverity: 0,
    };
  }
}

/**
 * Check for suspicious activity patterns
 */
export async function detectSuspiciousActivity(
  identifier: string,
  timeWindowMinutes: number = 5
): Promise<{
  isSuspicious: boolean;
  reasons: string[];
  events: SecurityEvent[];
}> {
  const startDate = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

  const events = await getSecurityEvents({
    identifier,
    startDate,
    limit: 100,
  });

  const reasons: string[] = [];
  let isSuspicious = false;

  // Pattern 1: Multiple failed login attempts
  const failedLogins = events.filter((e) => e.eventType === SecurityEventType.FAILED_LOGIN);
  if (failedLogins.length >= 5) {
    isSuspicious = true;
    reasons.push(`${failedLogins.length} failed login attempts in ${timeWindowMinutes} minutes`);
  }

  // Pattern 2: Multiple rate limit violations
  const rateLimitExceeded = events.filter(
    (e) => e.eventType === SecurityEventType.RATE_LIMIT_EXCEEDED
  );
  if (rateLimitExceeded.length >= 3) {
    isSuspicious = true;
    reasons.push(
      `${rateLimitExceeded.length} rate limit violations in ${timeWindowMinutes} minutes`
    );
  }

  // Pattern 3: Multiple CSRF validation failures
  const csrfFailures = events.filter(
    (e) => e.eventType === SecurityEventType.CSRF_VALIDATION_FAILED
  );
  if (csrfFailures.length >= 3) {
    isSuspicious = true;
    reasons.push(`${csrfFailures.length} CSRF validation failures in ${timeWindowMinutes} minutes`);
  }

  // Pattern 4: Multiple injection attempts
  const injectionAttempts = events.filter(
    (e) =>
      e.eventType === SecurityEventType.SQL_INJECTION_ATTEMPT ||
      e.eventType === SecurityEventType.XSS_ATTEMPT ||
      e.eventType === SecurityEventType.PATH_TRAVERSAL_ATTEMPT
  );
  if (injectionAttempts.length >= 2) {
    isSuspicious = true;
    reasons.push(
      `${injectionAttempts.length} injection attempts detected in ${timeWindowMinutes} minutes`
    );
  }

  // Pattern 5: High severity events
  const highSeverityEvents = events.filter(
    (e) => e.severity === 'critical' || e.severity === 'high'
  );
  if (highSeverityEvents.length >= 5) {
    isSuspicious = true;
    reasons.push(
      `${highSeverityEvents.length} high severity events in ${timeWindowMinutes} minutes`
    );
  }

  if (isSuspicious) {
    console.warn('⚠️ Suspicious activity detected:', {
      identifier,
      reasons,
      eventCount: events.length,
    });

    // Log detection as security event
    await logSecurityEvent({
      eventType: SecurityEventType.SECURITY_SCAN,
      severity: 'high',
      identifier,
      details: {
        reasons,
        eventCount: events.length,
        timeWindowMinutes,
      },
    });
  }

  return {
    isSuspicious,
    reasons,
    events,
  };
}

/**
 * Auto-flush buffer periodically
 */
const FLUSH_INTERVAL = 5 * 60 * 1000; // 5 minutes
let flushTimer: NodeJS.Timeout | null = null;

function startAutoFlush() {
  if (flushTimer) return;

  flushTimer = setInterval(() => {
    if (eventBuffer.length > 0) {
      flushSecurityEventBuffer();
    }
  }, FLUSH_INTERVAL);
}

// Start auto-flush on module load
startAutoFlush();
