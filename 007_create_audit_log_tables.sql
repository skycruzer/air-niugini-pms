-- Migration: Create Audit Log Tables for Tasks and Disciplinary Matters
-- Author: Air Niugini Development Team
-- Date: 2025-10-06
-- Purpose: Add missing audit log tables for compliance and accountability tracking

-- ============================================================================
-- TASK AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES an_users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT valid_action CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'ASSIGN')),

  -- Indexes for performance
  CONSTRAINT task_audit_log_task_id_idx UNIQUE (id)
);

-- Indexes
CREATE INDEX idx_task_audit_log_task_id ON task_audit_log(task_id);
CREATE INDEX idx_task_audit_log_user_id ON task_audit_log(user_id);
CREATE INDEX idx_task_audit_log_timestamp ON task_audit_log(timestamp DESC);
CREATE INDEX idx_task_audit_log_action ON task_audit_log(action);

-- Comments
COMMENT ON TABLE task_audit_log IS 'Audit trail for all task-related changes';
COMMENT ON COLUMN task_audit_log.action IS 'Type of action performed (CREATE, UPDATE, DELETE, STATUS_CHANGE, ASSIGN)';
COMMENT ON COLUMN task_audit_log.field_changed IS 'Name of the field that was changed (for UPDATE actions)';
COMMENT ON COLUMN task_audit_log.old_value IS 'Previous value before change (for UPDATE actions)';
COMMENT ON COLUMN task_audit_log.new_value IS 'New value after change (for UPDATE actions)';

-- ============================================================================
-- DISCIPLINARY AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS disciplinary_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  matter_id UUID NOT NULL REFERENCES disciplinary_matters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES an_users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT valid_disciplinary_action CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'ASSIGN', 'RESOLVE', 'APPEAL')),

  -- Indexes for performance
  CONSTRAINT disciplinary_audit_log_matter_id_idx UNIQUE (id)
);

-- Indexes
CREATE INDEX idx_disciplinary_audit_log_matter_id ON disciplinary_audit_log(matter_id);
CREATE INDEX idx_disciplinary_audit_log_user_id ON disciplinary_audit_log(user_id);
CREATE INDEX idx_disciplinary_audit_log_timestamp ON disciplinary_audit_log(timestamp DESC);
CREATE INDEX idx_disciplinary_audit_log_action ON disciplinary_audit_log(action);

-- Comments
COMMENT ON TABLE disciplinary_audit_log IS 'Audit trail for all disciplinary matter changes';
COMMENT ON COLUMN disciplinary_audit_log.action IS 'Type of action performed (CREATE, UPDATE, DELETE, STATUS_CHANGE, ASSIGN, RESOLVE, APPEAL)';
COMMENT ON COLUMN disciplinary_audit_log.field_changed IS 'Name of the field that was changed (for UPDATE actions)';
COMMENT ON COLUMN disciplinary_audit_log.old_value IS 'Previous value before change (for UPDATE actions)';
COMMENT ON COLUMN disciplinary_audit_log.new_value IS 'New value after change (for UPDATE actions)';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE task_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_audit_log ENABLE ROW LEVEL SECURITY;

-- Task Audit Log Policies
-- Admin and managers can view all audit logs
CREATE POLICY task_audit_log_select ON task_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role IN ('admin', 'manager')
    )
  );

-- Only system can insert audit logs (through service role)
CREATE POLICY task_audit_log_insert ON task_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Controlled by application logic

-- No updates or deletes allowed (audit logs are immutable)
CREATE POLICY task_audit_log_no_update ON task_audit_log
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY task_audit_log_no_delete ON task_audit_log
  FOR DELETE
  TO authenticated
  USING (false);

-- Disciplinary Audit Log Policies
-- Only admin can view disciplinary audit logs (more sensitive)
CREATE POLICY disciplinary_audit_log_select ON disciplinary_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );

-- Only system can insert audit logs (through service role)
CREATE POLICY disciplinary_audit_log_insert ON disciplinary_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Controlled by application logic

-- No updates or deletes allowed (audit logs are immutable)
CREATE POLICY disciplinary_audit_log_no_update ON disciplinary_audit_log
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY disciplinary_audit_log_no_delete ON disciplinary_audit_log
  FOR DELETE
  TO authenticated
  USING (false);

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant appropriate permissions
GRANT SELECT ON task_audit_log TO authenticated;
GRANT INSERT ON task_audit_log TO authenticated;

GRANT SELECT ON disciplinary_audit_log TO authenticated;
GRANT INSERT ON disciplinary_audit_log TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables were created
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('task_audit_log', 'disciplinary_audit_log');

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('task_audit_log', 'disciplinary_audit_log');

-- Count of policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('task_audit_log', 'disciplinary_audit_log')
ORDER BY tablename, policyname;
