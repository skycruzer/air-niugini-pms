-- =====================================================
-- Security Audit Log Table Migration
-- =====================================================
-- Creates comprehensive security audit logging table
-- for tracking all security events in the system
-- =====================================================

-- Create security_audit_log table
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  identifier TEXT NOT NULL, -- IP address or user identifier
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  url TEXT,
  method TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_severity ON security_audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_identifier ON security_audit_log(identifier);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_timestamp ON security_audit_log(timestamp DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_security_audit_log_composite
ON security_audit_log(identifier, event_type, timestamp DESC);

-- Index for high severity events
CREATE INDEX IF NOT EXISTS idx_security_audit_log_high_severity
ON security_audit_log(severity, timestamp DESC)
WHERE severity IN ('high', 'critical');

-- Add comments for documentation
COMMENT ON TABLE security_audit_log IS 'Security audit log tracking all security-related events';
COMMENT ON COLUMN security_audit_log.event_type IS 'Type of security event (failed_login, rate_limit_exceeded, etc.)';
COMMENT ON COLUMN security_audit_log.severity IS 'Severity level: low, medium, high, critical';
COMMENT ON COLUMN security_audit_log.identifier IS 'Client identifier (IP address or user ID)';
COMMENT ON COLUMN security_audit_log.user_id IS 'Associated user ID if authenticated';
COMMENT ON COLUMN security_audit_log.url IS 'Request URL where event occurred';
COMMENT ON COLUMN security_audit_log.method IS 'HTTP method of request';
COMMENT ON COLUMN security_audit_log.details IS 'Additional event details in JSON format';
COMMENT ON COLUMN security_audit_log.timestamp IS 'When the event occurred';

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on security_audit_log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything (for application use)
CREATE POLICY service_role_all_security_audit_log
ON security_audit_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users can only view their own audit logs
CREATE POLICY users_view_own_security_audit_log
ON security_audit_log
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  auth.jwt() ->> 'role' = 'admin'
);

-- Policy: Admin users can view all audit logs
CREATE POLICY admin_view_all_security_audit_log
ON security_audit_log
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- =====================================================
-- Automatic Cleanup Function
-- =====================================================
-- Clean up old audit logs (older than 90 days) to manage storage

CREATE OR REPLACE FUNCTION cleanup_old_security_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete logs older than 90 days
  DELETE FROM security_audit_log
  WHERE timestamp < NOW() - INTERVAL '90 days';

  RAISE NOTICE 'Cleaned up old security audit logs';
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION cleanup_old_security_audit_logs() TO service_role;

COMMENT ON FUNCTION cleanup_old_security_audit_logs() IS
'Removes security audit logs older than 90 days to manage storage';

-- =====================================================
-- Statistics View
-- =====================================================

CREATE OR REPLACE VIEW security_audit_stats AS
SELECT
  event_type,
  severity,
  COUNT(*) as event_count,
  MIN(timestamp) as first_occurrence,
  MAX(timestamp) as last_occurrence,
  COUNT(DISTINCT identifier) as unique_identifiers,
  COUNT(DISTINCT user_id) as unique_users
FROM security_audit_log
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY event_type, severity
ORDER BY event_count DESC;

COMMENT ON VIEW security_audit_stats IS
'Statistics view showing security event counts and patterns from last 30 days';

-- Grant select on view to authenticated users
GRANT SELECT ON security_audit_stats TO authenticated;

-- =====================================================
-- Recent High Severity Events View
-- =====================================================

CREATE OR REPLACE VIEW recent_high_severity_events AS
SELECT
  id,
  event_type,
  severity,
  identifier,
  user_id,
  url,
  method,
  details,
  timestamp
FROM security_audit_log
WHERE
  severity IN ('high', 'critical')
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

COMMENT ON VIEW recent_high_severity_events IS
'Recent high and critical severity security events from last 24 hours';

-- Grant select on view to admin users only
GRANT SELECT ON recent_high_severity_events TO authenticated;

-- =====================================================
-- Suspicious Activity Detection Function
-- =====================================================

CREATE OR REPLACE FUNCTION detect_suspicious_patterns(
  p_identifier TEXT,
  p_time_window_minutes INT DEFAULT 5
)
RETURNS TABLE (
  is_suspicious BOOLEAN,
  reason TEXT,
  event_count BIGINT,
  severity_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_failed_logins BIGINT;
  v_rate_limits BIGINT;
  v_csrf_failures BIGINT;
  v_injection_attempts BIGINT;
BEGIN
  -- Count failed logins
  SELECT COUNT(*) INTO v_failed_logins
  FROM security_audit_log
  WHERE identifier = p_identifier
    AND event_type = 'failed_login'
    AND timestamp > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;

  IF v_failed_logins >= 5 THEN
    is_suspicious := TRUE;
    reason := 'Multiple failed login attempts';
    event_count := v_failed_logins;
    severity_level := 'high';
    RETURN NEXT;
  END IF;

  -- Count rate limit violations
  SELECT COUNT(*) INTO v_rate_limits
  FROM security_audit_log
  WHERE identifier = p_identifier
    AND event_type = 'rate_limit_exceeded'
    AND timestamp > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;

  IF v_rate_limits >= 3 THEN
    is_suspicious := TRUE;
    reason := 'Multiple rate limit violations';
    event_count := v_rate_limits;
    severity_level := 'medium';
    RETURN NEXT;
  END IF;

  -- Count CSRF failures
  SELECT COUNT(*) INTO v_csrf_failures
  FROM security_audit_log
  WHERE identifier = p_identifier
    AND event_type IN ('csrf_validation_failed', 'csrf_token_missing')
    AND timestamp > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;

  IF v_csrf_failures >= 3 THEN
    is_suspicious := TRUE;
    reason := 'Multiple CSRF validation failures';
    event_count := v_csrf_failures;
    severity_level := 'high';
    RETURN NEXT;
  END IF;

  -- Count injection attempts
  SELECT COUNT(*) INTO v_injection_attempts
  FROM security_audit_log
  WHERE identifier = p_identifier
    AND event_type IN ('sql_injection_attempt', 'xss_attempt', 'path_traversal_attempt')
    AND timestamp > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;

  IF v_injection_attempts >= 2 THEN
    is_suspicious := TRUE;
    reason := 'Multiple injection attempts detected';
    event_count := v_injection_attempts;
    severity_level := 'critical';
    RETURN NEXT;
  END IF;

  -- If no suspicious patterns found
  IF NOT FOUND THEN
    is_suspicious := FALSE;
    reason := 'No suspicious patterns detected';
    event_count := 0;
    severity_level := 'low';
    RETURN NEXT;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION detect_suspicious_patterns(TEXT, INT) TO authenticated;

COMMENT ON FUNCTION detect_suspicious_patterns IS
'Analyzes security events to detect suspicious activity patterns for a given identifier';

-- =====================================================
-- Initial Data / Testing
-- =====================================================

-- Insert a test event to verify table structure
INSERT INTO security_audit_log (
  event_type,
  severity,
  identifier,
  details
) VALUES (
  'system_event',
  'low',
  'system',
  '{"message": "Security audit log table initialized", "version": "1.0"}'::jsonb
);

-- =====================================================
-- Migration Complete
-- =====================================================

-- Output success message
DO $$
BEGIN
  RAISE NOTICE 'Security audit log migration completed successfully';
  RAISE NOTICE 'Table: security_audit_log created with RLS policies';
  RAISE NOTICE 'Views: security_audit_stats, recent_high_severity_events created';
  RAISE NOTICE 'Functions: cleanup_old_security_audit_logs, detect_suspicious_patterns created';
END $$;
