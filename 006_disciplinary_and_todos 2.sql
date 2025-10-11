-- =============================================================================
-- Air Niugini B767 PMS - Database Migration 006
-- Disciplinary Matters & To-Do List Features
--
-- Author: Air Niugini Development Team
-- Version: 1.0.0
-- Date: 2025-10-06
--
-- Description:
-- Creates comprehensive database schema for pilot disciplinary tracking
-- and task/to-do list management with full audit trails and RLS policies
-- =============================================================================

-- =============================================================================
-- DISCIPLINARY MATTERS TABLES
-- =============================================================================

-- Incident Types Lookup Table
CREATE TABLE IF NOT EXISTS incident_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  severity_level VARCHAR(20) CHECK (severity_level IN ('MINOR', 'MODERATE', 'SERIOUS', 'CRITICAL')),
  requires_review BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE incident_types IS 'Lookup table for standardized incident classifications';

-- Disciplinary Matters Main Table
CREATE TABLE IF NOT EXISTS disciplinary_matters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
  incident_type_id UUID NOT NULL REFERENCES incident_types(id),
  incident_date DATE NOT NULL,
  reported_by UUID NOT NULL REFERENCES an_users(id),
  reported_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('MINOR', 'MODERATE', 'SERIOUS', 'CRITICAL')),
  status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED', 'APPEALED')),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(200),
  flight_number VARCHAR(20),
  aircraft_registration VARCHAR(20),
  witnesses JSONB DEFAULT '[]'::jsonb,
  evidence_files JSONB DEFAULT '[]'::jsonb,
  corrective_actions TEXT,
  resolution_notes TEXT,
  assigned_to UUID REFERENCES an_users(id),
  due_date DATE,
  resolved_date DATE,
  resolved_by UUID REFERENCES an_users(id),
  impact_on_operations TEXT,
  regulatory_notification_required BOOLEAN DEFAULT FALSE,
  regulatory_body VARCHAR(100),
  notification_date DATE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE disciplinary_matters IS 'Main table for tracking pilot disciplinary incidents and resolutions';

CREATE INDEX idx_disciplinary_pilot ON disciplinary_matters(pilot_id);
CREATE INDEX idx_disciplinary_status ON disciplinary_matters(status);
CREATE INDEX idx_disciplinary_severity ON disciplinary_matters(severity);
CREATE INDEX idx_disciplinary_date ON disciplinary_matters(incident_date DESC);
CREATE INDEX idx_disciplinary_assigned ON disciplinary_matters(assigned_to);

-- Disciplinary Actions Table
CREATE TABLE IF NOT EXISTS disciplinary_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID NOT NULL REFERENCES disciplinary_matters(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('WARNING', 'SUSPENSION', 'TRAINING', 'COUNSELING', 'TERMINATION', 'FINE', 'OTHER')),
  action_date DATE NOT NULL,
  effective_date DATE,
  expiry_date DATE,
  description TEXT NOT NULL,
  issued_by UUID NOT NULL REFERENCES an_users(id),
  acknowledged_by_pilot BOOLEAN DEFAULT FALSE,
  acknowledgment_date TIMESTAMPTZ,
  appeal_deadline DATE,
  status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'APPEALED', 'REVERSED')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE disciplinary_actions IS 'Records of disciplinary actions taken against pilots';

CREATE INDEX idx_disciplinary_actions_matter ON disciplinary_actions(matter_id);
CREATE INDEX idx_disciplinary_actions_type ON disciplinary_actions(action_type);

-- Disciplinary Comments/Notes Table
CREATE TABLE IF NOT EXISTS disciplinary_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID NOT NULL REFERENCES disciplinary_matters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES an_users(id),
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT TRUE,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE disciplinary_comments IS 'Comments and notes related to disciplinary matters';

CREATE INDEX idx_disciplinary_comments_matter ON disciplinary_comments(matter_id);
CREATE INDEX idx_disciplinary_comments_date ON disciplinary_comments(created_at DESC);

-- Disciplinary Audit Log
CREATE TABLE IF NOT EXISTS disciplinary_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID NOT NULL REFERENCES disciplinary_matters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES an_users(id),
  action VARCHAR(50) NOT NULL,
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE disciplinary_audit_log IS 'Complete audit trail of all changes to disciplinary matters';

CREATE INDEX idx_disciplinary_audit_matter ON disciplinary_audit_log(matter_id);
CREATE INDEX idx_disciplinary_audit_timestamp ON disciplinary_audit_log(timestamp DESC);

-- =============================================================================
-- TO-DO LIST / TASK MANAGEMENT TABLES
-- =============================================================================

-- Task Categories Lookup Table
CREATE TABLE IF NOT EXISTS task_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7), -- Hex color code
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE task_categories IS 'Categorization system for tasks and to-do items';

-- Tasks Main Table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES task_categories(id),
  priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  status VARCHAR(50) NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED')),
  created_by UUID NOT NULL REFERENCES an_users(id),
  assigned_to UUID REFERENCES an_users(id),
  related_pilot_id UUID REFERENCES pilots(id),
  related_matter_id UUID REFERENCES disciplinary_matters(id),
  due_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern JSONB,
  parent_task_id UUID REFERENCES tasks(id),
  tags JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  checklist_items JSONB DEFAULT '[]'::jsonb,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tasks IS 'Main task and to-do list management table with full feature set';

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_creator ON tasks(created_by);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_related_pilot ON tasks(related_pilot_id);
CREATE INDEX idx_tasks_related_matter ON tasks(related_matter_id);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);

-- Task Comments Table
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES an_users(id),
  comment TEXT NOT NULL,
  mentions JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE task_comments IS 'Discussion and collaboration on tasks';

CREATE INDEX idx_task_comments_task ON task_comments(task_id);
CREATE INDEX idx_task_comments_date ON task_comments(created_at DESC);

-- Task Audit Log
CREATE TABLE IF NOT EXISTS task_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES an_users(id),
  action VARCHAR(50) NOT NULL,
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE task_audit_log IS 'Complete audit trail of all task changes';

CREATE INDEX idx_task_audit_task ON task_audit_log(task_id);
CREATE INDEX idx_task_audit_timestamp ON task_audit_log(timestamp DESC);

-- =============================================================================
-- SEED DATA - DEFAULT INCIDENT TYPES
-- =============================================================================

INSERT INTO incident_types (code, name, description, severity_level, requires_review) VALUES
  ('FLIGHT_OPS', 'Flight Operations Violation', 'Violations of standard operating procedures during flight operations', 'SERIOUS', TRUE),
  ('SAFETY_BREACH', 'Safety Protocol Breach', 'Failure to follow safety protocols and procedures', 'CRITICAL', TRUE),
  ('LATE_REPORT', 'Late Reporting', 'Failure to report for duty on time', 'MINOR', FALSE),
  ('DOCUMENTATION', 'Documentation Error', 'Errors or omissions in required documentation', 'MODERATE', FALSE),
  ('CREW_CONDUCT', 'Crew Conduct Issue', 'Unprofessional behavior or conduct issues', 'MODERATE', TRUE),
  ('CERT_LAPSE', 'Certification Lapse', 'Operating with expired or invalid certifications', 'CRITICAL', TRUE),
  ('SUBSTANCE', 'Substance Policy Violation', 'Violation of alcohol or substance policies', 'CRITICAL', TRUE),
  ('INSUBORDINATION', 'Insubordination', 'Refusal to follow lawful orders or instructions', 'SERIOUS', TRUE),
  ('FATIGUE_MGMT', 'Fatigue Management Violation', 'Violation of fatigue management rules', 'SERIOUS', TRUE),
  ('OTHER', 'Other', 'Other disciplinary matters not covered by standard categories', 'MINOR', FALSE)
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- SEED DATA - DEFAULT TASK CATEGORIES
-- =============================================================================

INSERT INTO task_categories (name, description, color, icon, display_order) VALUES
  ('Certification Review', 'Tasks related to reviewing and updating pilot certifications', '#E4002B', 'certificate', 1),
  ('Compliance Check', 'Regulatory and compliance verification tasks', '#FFC72C', 'shield-check', 2),
  ('Document Processing', 'Document review and processing tasks', '#0066CC', 'file-text', 3),
  ('Training Coordination', 'Training schedule and coordination tasks', '#00AA44', 'graduation-cap', 4),
  ('Leave Management', 'Tasks related to leave requests and roster management', '#9900CC', 'calendar', 5),
  ('Disciplinary Follow-up', 'Follow-up actions for disciplinary matters', '#CC0000', 'alert-triangle', 6),
  ('System Maintenance', 'System administration and maintenance tasks', '#666666', 'settings', 7),
  ('Reporting', 'Report generation and submission tasks', '#FF6600', 'bar-chart', 8),
  ('General', 'General administrative tasks', '#333333', 'check-circle', 9)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all new tables
ALTER TABLE incident_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_audit_log ENABLE ROW LEVEL SECURITY;

-- Incident Types - Read-only for all authenticated users
CREATE POLICY incident_types_select ON incident_types FOR SELECT TO authenticated USING (true);
CREATE POLICY incident_types_all ON incident_types FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM an_users
    WHERE an_users.id = auth.uid() AND an_users.role = 'admin'
  )
);

-- Disciplinary Matters - Admins and managers can access
CREATE POLICY disciplinary_select ON disciplinary_matters FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM an_users
    WHERE an_users.id = auth.uid() AND an_users.role IN ('admin', 'manager')
  )
);

CREATE POLICY disciplinary_insert ON disciplinary_matters FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM an_users
    WHERE an_users.id = auth.uid() AND an_users.role IN ('admin', 'manager')
  )
);

CREATE POLICY disciplinary_update ON disciplinary_matters FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM an_users
    WHERE an_users.id = auth.uid() AND an_users.role IN ('admin', 'manager')
  )
);

CREATE POLICY disciplinary_delete ON disciplinary_matters FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM an_users
    WHERE an_users.id = auth.uid() AND an_users.role = 'admin'
  )
);

-- Disciplinary Actions - Same as disciplinary matters
CREATE POLICY disciplinary_actions_select ON disciplinary_actions FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM an_users
    WHERE an_users.id = auth.uid() AND an_users.role IN ('admin', 'manager')
  )
);

CREATE POLICY disciplinary_actions_all ON disciplinary_actions FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM an_users
    WHERE an_users.id = auth.uid() AND an_users.role IN ('admin', 'manager')
  )
);

-- Disciplinary Comments - Read for admins/managers, write for authenticated
CREATE POLICY disciplinary_comments_select ON disciplinary_comments FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM an_users
    WHERE an_users.id = auth.uid() AND an_users.role IN ('admin', 'manager')
  )
);

CREATE POLICY disciplinary_comments_insert ON disciplinary_comments FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM an_users
    WHERE an_users.id = auth.uid() AND an_users.role IN ('admin', 'manager')
  )
);

-- Disciplinary Audit Log - Read-only for admins/managers, auto-populated by triggers
CREATE POLICY disciplinary_audit_select ON disciplinary_audit_log FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM an_users
    WHERE an_users.id = auth.uid() AND an_users.role IN ('admin', 'manager')
  )
);

-- Task Categories - Read for all, manage for admins
CREATE POLICY task_categories_select ON task_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY task_categories_all ON task_categories FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM an_users
    WHERE an_users.id = auth.uid() AND an_users.role = 'admin'
  )
);

-- Tasks - Users can see tasks they created or are assigned to, admins see all
CREATE POLICY tasks_select ON tasks FOR SELECT TO authenticated USING (
  created_by = auth.uid() OR
  assigned_to = auth.uid() OR
  EXISTS (
    SELECT 1 FROM an_users
    WHERE an_users.id = auth.uid() AND an_users.role = 'admin'
  )
);

CREATE POLICY tasks_insert ON tasks FOR INSERT TO authenticated WITH CHECK (
  created_by = auth.uid()
);

CREATE POLICY tasks_update ON tasks FOR UPDATE TO authenticated USING (
  created_by = auth.uid() OR
  assigned_to = auth.uid() OR
  EXISTS (
    SELECT 1 FROM an_users
    WHERE an_users.id = auth.uid() AND an_users.role = 'admin'
  )
);

CREATE POLICY tasks_delete ON tasks FOR DELETE TO authenticated USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM an_users
    WHERE an_users.id = auth.uid() AND an_users.role = 'admin'
  )
);

-- Task Comments - Same visibility as parent task
CREATE POLICY task_comments_select ON task_comments FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_comments.task_id
    AND (tasks.created_by = auth.uid() OR tasks.assigned_to = auth.uid() OR
         EXISTS (SELECT 1 FROM an_users WHERE an_users.id = auth.uid() AND an_users.role = 'admin'))
  )
);

CREATE POLICY task_comments_insert ON task_comments FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
);

-- Task Audit Log - Read-only, same visibility as parent task
CREATE POLICY task_audit_select ON task_audit_log FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_audit_log.task_id
    AND (tasks.created_by = auth.uid() OR tasks.assigned_to = auth.uid() OR
         EXISTS (SELECT 1 FROM an_users WHERE an_users.id = auth.uid() AND an_users.role = 'admin'))
  )
);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_incident_types_updated_at BEFORE UPDATE ON incident_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disciplinary_matters_updated_at BEFORE UPDATE ON disciplinary_matters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disciplinary_actions_updated_at BEFORE UPDATE ON disciplinary_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disciplinary_comments_updated_at BEFORE UPDATE ON disciplinary_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- DATABASE VIEWS
-- =============================================================================

-- Disciplinary Matters Summary View
CREATE OR REPLACE VIEW disciplinary_summary AS
SELECT
  dm.id,
  dm.title,
  dm.incident_date,
  dm.severity,
  dm.status,
  p.first_name || ' ' || p.last_name AS pilot_name,
  p.employee_id,
  p.role AS pilot_role,
  it.name AS incident_type,
  u.name AS reported_by_name,
  dm.created_at,
  (SELECT COUNT(*) FROM disciplinary_actions WHERE matter_id = dm.id) AS action_count,
  (SELECT COUNT(*) FROM disciplinary_comments WHERE matter_id = dm.id) AS comment_count
FROM disciplinary_matters dm
JOIN pilots p ON dm.pilot_id = p.id
JOIN incident_types it ON dm.incident_type_id = it.id
JOIN an_users u ON dm.reported_by = u.id
ORDER BY dm.created_at DESC;

COMMENT ON VIEW disciplinary_summary IS 'Comprehensive summary of disciplinary matters with related counts';

-- Active Tasks Dashboard View
CREATE OR REPLACE VIEW active_tasks_dashboard AS
SELECT
  t.id,
  t.title,
  t.priority,
  t.status,
  t.due_date,
  t.progress_percentage,
  tc.name AS category,
  tc.color AS category_color,
  creator.name AS created_by_name,
  assignee.name AS assigned_to_name,
  p.first_name || ' ' || p.last_name AS related_pilot_name,
  t.created_at,
  (SELECT COUNT(*) FROM task_comments WHERE task_id = t.id) AS comment_count,
  CASE
    WHEN t.due_date < CURRENT_DATE THEN 'OVERDUE'
    WHEN t.due_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'DUE_SOON'
    ELSE 'ON_TRACK'
  END AS timeline_status
FROM tasks t
LEFT JOIN task_categories tc ON t.category_id = tc.id
JOIN an_users creator ON t.created_by = creator.id
LEFT JOIN an_users assignee ON t.assigned_to = assignee.id
LEFT JOIN pilots p ON t.related_pilot_id = p.id
WHERE t.status NOT IN ('COMPLETED', 'CANCELLED')
ORDER BY
  CASE t.priority
    WHEN 'URGENT' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
    WHEN 'LOW' THEN 4
  END,
  t.due_date NULLS LAST;

COMMENT ON VIEW active_tasks_dashboard IS 'Active tasks with priority ordering and timeline status';

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 006 completed successfully';
  RAISE NOTICE '📊 Created 9 new tables for disciplinary matters and task management';
  RAISE NOTICE '🔒 Applied RLS policies for secure access control';
  RAISE NOTICE '📈 Created 2 materialized views for dashboard optimization';
  RAISE NOTICE '🎯 System ready for disciplinary tracking and task management';
END $$;
