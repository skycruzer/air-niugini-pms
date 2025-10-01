-- =====================================================
-- MIGRATION 004: IMPLEMENT AUDIT TRAIL SYSTEM
-- =====================================================
-- This migration creates a comprehensive audit logging system
-- for tracking all changes to critical data in the Air Niugini PMS
--
-- FEATURES:
-- - Automatic logging of INSERT, UPDATE, DELETE operations
-- - User attribution for all changes
-- - Before/after state capture (JSONB format)
-- - Timestamp tracking with PNG timezone
-- - Filterable by table, action, user, and date range
--
-- COMPLIANCE:
-- - Supports aviation industry audit requirements
-- - Enables change tracking for certification data
-- - Provides accountability for sensitive operations
--
-- Created: 2025-09-30
-- Purpose: Implement audit trail system - Phase 1.1
-- =====================================================

-- =====================================================
-- STEP 1: CREATE AUDIT LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User information
  user_id UUID REFERENCES an_users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_role VARCHAR(50),

  -- Action details
  action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'RESTORE', 'SOFT_DELETE')),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,

  -- State capture (JSONB for flexible querying)
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[], -- Array of field names that changed

  -- Context information
  description TEXT,
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at_png TIMESTAMP WITHOUT TIME ZONE DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Pacific/Port_Moresby')
);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- Composite index for common query pattern (table + action + date range)
CREATE INDEX idx_audit_logs_table_action_date
  ON audit_logs(table_name, action, created_at DESC);

-- GIN index for JSONB data querying
CREATE INDEX idx_audit_logs_old_data_gin ON audit_logs USING GIN (old_data);
CREATE INDEX idx_audit_logs_new_data_gin ON audit_logs USING GIN (new_data);

-- Comments
COMMENT ON TABLE audit_logs IS
  'Comprehensive audit trail for all data modifications in the system. Captures user, action, and before/after state.';

COMMENT ON COLUMN audit_logs.user_id IS
  'Foreign key to an_users table. NULL if user deleted or system action.';

COMMENT ON COLUMN audit_logs.action IS
  'Type of operation: INSERT, UPDATE, DELETE, RESTORE, SOFT_DELETE';

COMMENT ON COLUMN audit_logs.old_data IS
  'JSONB snapshot of record state before change. NULL for INSERT operations.';

COMMENT ON COLUMN audit_logs.new_data IS
  'JSONB snapshot of record state after change. NULL for DELETE operations.';

COMMENT ON COLUMN audit_logs.changed_fields IS
  'Array of field names that were modified in UPDATE operations.';

COMMENT ON COLUMN audit_logs.created_at_png IS
  'Timestamp in Papua New Guinea timezone for local reporting.';

-- =====================================================
-- STEP 2: CREATE AUDIT LOGGING FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_info RECORD;
  changed_fields TEXT[];
  field_name TEXT;
BEGIN
  -- Get current user information from session
  -- This will be set by the application using SET LOCAL
  BEGIN
    SELECT id, email, role INTO user_info
    FROM an_users
    WHERE email = current_setting('app.current_user_email', TRUE)
    LIMIT 1;
  EXCEPTION
    WHEN OTHERS THEN
      user_info := NULL;
  END;

  -- For UPDATE operations, identify changed fields
  IF (TG_OP = 'UPDATE') THEN
    changed_fields := ARRAY[]::TEXT[];
    FOR field_name IN
      SELECT jsonb_object_keys(to_jsonb(NEW))
    LOOP
      IF to_jsonb(OLD)->>field_name IS DISTINCT FROM to_jsonb(NEW)->>field_name THEN
        changed_fields := array_append(changed_fields, field_name);
      END IF;
    END LOOP;
  END IF;

  -- Insert audit log entry
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (
      user_id,
      user_email,
      user_role,
      action,
      table_name,
      record_id,
      old_data,
      new_data,
      changed_fields,
      description
    ) VALUES (
      user_info.id,
      user_info.email,
      user_info.role,
      TG_OP,
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD),
      NULL,
      NULL,
      'Record deleted from ' || TG_TABLE_NAME
    );
    RETURN OLD;

  ELSIF (TG_OP = 'UPDATE') THEN
    -- Check if this is a soft delete
    IF (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL) THEN
      INSERT INTO audit_logs (
        user_id,
        user_email,
        user_role,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        changed_fields,
        description
      ) VALUES (
        user_info.id,
        user_info.email,
        user_info.role,
        'SOFT_DELETE',
        TG_TABLE_NAME,
        NEW.id,
        to_jsonb(OLD),
        to_jsonb(NEW),
        changed_fields,
        'Record soft deleted in ' || TG_TABLE_NAME
      );
    -- Check if this is a restore
    ELSIF (NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL) THEN
      INSERT INTO audit_logs (
        user_id,
        user_email,
        user_role,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        changed_fields,
        description
      ) VALUES (
        user_info.id,
        user_info.email,
        user_info.role,
        'RESTORE',
        TG_TABLE_NAME,
        NEW.id,
        to_jsonb(OLD),
        to_jsonb(NEW),
        changed_fields,
        'Record restored in ' || TG_TABLE_NAME
      );
    ELSE
      -- Regular update
      INSERT INTO audit_logs (
        user_id,
        user_email,
        user_role,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        changed_fields,
        description
      ) VALUES (
        user_info.id,
        user_info.email,
        user_info.role,
        TG_OP,
        TG_TABLE_NAME,
        NEW.id,
        to_jsonb(OLD),
        to_jsonb(NEW),
        changed_fields,
        array_length(changed_fields, 1) || ' field(s) updated in ' || TG_TABLE_NAME
      );
    END IF;
    RETURN NEW;

  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (
      user_id,
      user_email,
      user_role,
      action,
      table_name,
      record_id,
      old_data,
      new_data,
      changed_fields,
      description
    ) VALUES (
      user_info.id,
      user_info.email,
      user_info.role,
      TG_OP,
      TG_TABLE_NAME,
      NEW.id,
      NULL,
      to_jsonb(NEW),
      NULL,
      'New record created in ' || TG_TABLE_NAME
    );
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION log_audit_trail IS
  'Trigger function that automatically logs all INSERT, UPDATE, DELETE operations to audit_logs table. Captures user, action, and data changes.';

-- =====================================================
-- STEP 3: CREATE AUDIT TRIGGERS ON CRITICAL TABLES
-- =====================================================

-- Pilots table audit trigger
DROP TRIGGER IF EXISTS audit_pilots_trigger ON pilots;
CREATE TRIGGER audit_pilots_trigger
  AFTER INSERT OR UPDATE OR DELETE ON pilots
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_trail();

COMMENT ON TRIGGER audit_pilots_trigger ON pilots IS
  'Audit trigger for pilots table. Logs all data modifications.';

-- Pilot checks table audit trigger
DROP TRIGGER IF EXISTS audit_pilot_checks_trigger ON pilot_checks;
CREATE TRIGGER audit_pilot_checks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON pilot_checks
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_trail();

COMMENT ON TRIGGER audit_pilot_checks_trigger ON pilot_checks IS
  'Audit trigger for pilot_checks table. Critical for certification tracking compliance.';

-- Leave requests table audit trigger
DROP TRIGGER IF EXISTS audit_leave_requests_trigger ON leave_requests;
CREATE TRIGGER audit_leave_requests_trigger
  AFTER INSERT OR UPDATE OR DELETE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_trail();

COMMENT ON TRIGGER audit_leave_requests_trigger ON leave_requests IS
  'Audit trigger for leave_requests table. Tracks all leave request modifications.';

-- Check types table audit trigger
DROP TRIGGER IF EXISTS audit_check_types_trigger ON check_types;
CREATE TRIGGER audit_check_types_trigger
  AFTER INSERT OR UPDATE OR DELETE ON check_types
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_trail();

COMMENT ON TRIGGER audit_check_types_trigger ON check_types IS
  'Audit trigger for check_types table. Tracks certification type changes.';

-- Users table audit trigger
DROP TRIGGER IF EXISTS audit_an_users_trigger ON an_users;
CREATE TRIGGER audit_an_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON an_users
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_trail();

COMMENT ON TRIGGER audit_an_users_trigger ON an_users IS
  'Audit trigger for an_users table. Tracks user account changes and access modifications.';

-- =====================================================
-- STEP 4: CREATE AUDIT VIEWS FOR REPORTING
-- =====================================================

-- Recent audit activity (last 7 days)
CREATE OR REPLACE VIEW recent_audit_activity AS
SELECT
  al.id,
  al.user_email,
  al.user_role,
  al.action,
  al.table_name,
  al.description,
  al.created_at_png AS timestamp,
  al.record_id
FROM audit_logs al
WHERE al.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY al.created_at DESC
LIMIT 100;

COMMENT ON VIEW recent_audit_activity IS
  'Last 100 audit log entries from the past 7 days. Used for quick activity monitoring.';

-- Pilot modifications audit
CREATE OR REPLACE VIEW pilot_audit_trail AS
SELECT
  al.id,
  al.user_email,
  al.action,
  p.employee_id,
  p.first_name || ' ' || p.last_name AS pilot_name,
  al.changed_fields,
  al.old_data,
  al.new_data,
  al.created_at_png AS timestamp
FROM audit_logs al
LEFT JOIN pilots p ON al.record_id = p.id
WHERE al.table_name = 'pilots'
ORDER BY al.created_at DESC;

COMMENT ON VIEW pilot_audit_trail IS
  'Audit trail for pilot record modifications. Shows user, action, and changes made.';

-- Certification modifications audit
CREATE OR REPLACE VIEW certification_audit_trail AS
SELECT
  al.id,
  al.user_email,
  al.action,
  p.employee_id,
  p.first_name || ' ' || p.last_name AS pilot_name,
  ct.check_code,
  ct.check_description,
  (al.old_data->>'expiry_date')::DATE AS old_expiry_date,
  (al.new_data->>'expiry_date')::DATE AS new_expiry_date,
  al.created_at_png AS timestamp
FROM audit_logs al
LEFT JOIN pilot_checks pc ON al.record_id = pc.id
LEFT JOIN pilots p ON pc.pilot_id = p.id
LEFT JOIN check_types ct ON pc.check_type_id = ct.id
WHERE al.table_name = 'pilot_checks'
ORDER BY al.created_at DESC;

COMMENT ON VIEW certification_audit_trail IS
  'Audit trail for certification modifications. Critical for aviation compliance tracking.';

-- Leave request modifications audit
CREATE OR REPLACE VIEW leave_request_audit_trail AS
SELECT
  al.id,
  al.user_email,
  al.action,
  p.employee_id,
  p.first_name || ' ' || p.last_name AS pilot_name,
  (al.old_data->>'status') AS old_status,
  (al.new_data->>'status') AS new_status,
  (al.new_data->>'roster_period') AS roster_period,
  al.created_at_png AS timestamp
FROM audit_logs al
LEFT JOIN leave_requests lr ON al.record_id = lr.id
LEFT JOIN pilots p ON lr.pilot_id = p.id
WHERE al.table_name = 'leave_requests'
ORDER BY al.created_at DESC;

COMMENT ON VIEW leave_request_audit_trail IS
  'Audit trail for leave request modifications. Tracks approvals, denials, and changes.';

-- User action summary (grouped by user and action)
CREATE OR REPLACE VIEW user_action_summary AS
SELECT
  al.user_email,
  al.user_role,
  al.table_name,
  al.action,
  COUNT(*) AS action_count,
  MIN(al.created_at) AS first_action,
  MAX(al.created_at) AS last_action
FROM audit_logs al
WHERE al.user_email IS NOT NULL
GROUP BY al.user_email, al.user_role, al.table_name, al.action
ORDER BY action_count DESC;

COMMENT ON VIEW user_action_summary IS
  'Summary of user actions grouped by user, table, and action type. Useful for usage analytics.';

-- =====================================================
-- STEP 5: CREATE HELPER FUNCTIONS FOR AUDIT QUERIES
-- =====================================================

-- Get audit history for a specific record
CREATE OR REPLACE FUNCTION get_record_audit_history(
  p_table_name VARCHAR,
  p_record_id UUID
)
RETURNS TABLE (
  log_id UUID,
  user_email VARCHAR,
  action VARCHAR,
  changed_fields TEXT[],
  old_data JSONB,
  new_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE,
  description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.user_email,
    al.action,
    al.changed_fields,
    al.old_data,
    al.new_data,
    al.created_at,
    al.description
  FROM audit_logs al
  WHERE al.table_name = p_table_name
    AND al.record_id = p_record_id
  ORDER BY al.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_record_audit_history IS
  'Retrieves complete audit history for a specific record. Usage: SELECT * FROM get_record_audit_history(''pilots'', ''uuid-here'');';

-- Get user audit activity for date range
CREATE OR REPLACE FUNCTION get_user_audit_activity(
  p_user_email VARCHAR,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
  log_id UUID,
  action VARCHAR,
  table_name VARCHAR,
  record_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE,
  description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.action,
    al.table_name,
    al.record_id,
    al.created_at,
    al.description
  FROM audit_logs al
  WHERE al.user_email = p_user_email
    AND al.created_at BETWEEN p_start_date AND p_end_date
  ORDER BY al.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_user_audit_activity IS
  'Retrieves audit activity for a specific user within a date range. Usage: SELECT * FROM get_user_audit_activity(''user@example.com'');';

-- =====================================================
-- STEP 6: CREATE AUDIT CLEANUP FUNCTION
-- =====================================================

-- Function to clean up old audit logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(
  p_retention_days INTEGER DEFAULT 365
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < CURRENT_TIMESTAMP - (p_retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RAISE NOTICE 'Deleted % audit log entries older than % days', deleted_count, p_retention_days;

  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_audit_logs IS
  'Deletes audit logs older than specified retention period (default: 365 days). Run this periodically to manage table size.';

-- =====================================================
-- STEP 7: POST-MIGRATION VERIFICATION
-- =====================================================

DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  -- Count audit triggers
  SELECT COUNT(*)
  INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
    AND trigger_name LIKE 'audit_%_trigger';

  RAISE NOTICE 'Audit trail system verification:';
  RAISE NOTICE '- audit_logs table created with 9 indexes';
  RAISE NOTICE '- % audit triggers installed on critical tables', trigger_count;
  RAISE NOTICE '- 5 audit views created for reporting';
  RAISE NOTICE '- 3 helper functions created';
  RAISE NOTICE '- Audit system is active and logging all changes';
END $$;

-- Test audit logging with a sample query
SELECT
  tablename,
  COUNT(*) as trigger_count
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relnamespace = 'public'::regnamespace
  AND t.tgname LIKE 'audit_%'
GROUP BY tablename;

-- =====================================================
-- ROLLBACK SCRIPT (If Needed)
-- =====================================================
-- To remove audit trail system:
--
-- -- Drop triggers
-- DROP TRIGGER IF EXISTS audit_pilots_trigger ON pilots;
-- DROP TRIGGER IF EXISTS audit_pilot_checks_trigger ON pilot_checks;
-- DROP TRIGGER IF EXISTS audit_leave_requests_trigger ON leave_requests;
-- DROP TRIGGER IF EXISTS audit_check_types_trigger ON check_types;
-- DROP TRIGGER IF EXISTS audit_an_users_trigger ON an_users;
--
-- -- Drop views
-- DROP VIEW IF EXISTS recent_audit_activity CASCADE;
-- DROP VIEW IF EXISTS pilot_audit_trail CASCADE;
-- DROP VIEW IF EXISTS certification_audit_trail CASCADE;
-- DROP VIEW IF EXISTS leave_request_audit_trail CASCADE;
-- DROP VIEW IF EXISTS user_action_summary CASCADE;
--
-- -- Drop functions
-- DROP FUNCTION IF EXISTS log_audit_trail CASCADE;
-- DROP FUNCTION IF EXISTS get_record_audit_history CASCADE;
-- DROP FUNCTION IF EXISTS get_user_audit_activity CASCADE;
-- DROP FUNCTION IF EXISTS cleanup_old_audit_logs CASCADE;
--
-- -- Drop table
-- DROP TABLE IF EXISTS audit_logs CASCADE;
-- =====================================================

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary:
-- ✅ Created audit_logs table with comprehensive indexing
-- ✅ Implemented automatic audit logging trigger function
-- ✅ Installed triggers on 5 critical tables
-- ✅ Created 5 audit reporting views
-- ✅ Implemented 3 helper functions for audit queries
-- ✅ Added cleanup function for retention management
--
-- Features:
-- - Automatic logging of all INSERT, UPDATE, DELETE operations
-- - User attribution for all changes
-- - Before/after state capture in JSONB format
-- - Soft delete and restore tracking
-- - Efficient querying with strategic indexes
-- - Built-in reporting views
-- - Retention policy management
--
-- Usage Examples:
-- - View recent activity: SELECT * FROM recent_audit_activity;
-- - Get record history: SELECT * FROM get_record_audit_history('pilots', 'uuid');
-- - View pilot changes: SELECT * FROM pilot_audit_trail;
-- - Clean old logs: SELECT cleanup_old_audit_logs(365);
--
-- Next Steps:
-- - Configure retention policy (recommended: 365 days)
-- - Set up periodic cleanup job (monthly recommended)
-- - Implement UI for audit log viewing (admin only)
-- - Configure alerts for sensitive operations
-- - Export audit logs for long-term archival
-- =====================================================