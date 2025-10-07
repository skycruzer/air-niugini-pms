-- =====================================================
-- PHASE 1 & 2 COMPLETE DEPLOYMENT
-- Disciplinary Matters & Task Management Modules
-- Air Niugini B767 Pilot Management System
-- =====================================================
-- Date: 2025-10-07
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- SECTION 1: DISCIPLINARY MATTERS MODULE
-- =====================================================

-- Main disciplinary incidents table
CREATE TABLE IF NOT EXISTS disciplinary_incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_number VARCHAR(50) UNIQUE NOT NULL, -- Format: DM-2025-001
    pilot_id INTEGER REFERENCES pilots(id) ON DELETE RESTRICT,

    -- Incident Details
    incident_date DATE NOT NULL,
    incident_type VARCHAR(50) NOT NULL, -- violation, misconduct, performance, safety
    severity VARCHAR(20) NOT NULL, -- minor, moderate, serious, critical
    category VARCHAR(50) NOT NULL, -- operational, administrative, behavioral, regulatory

    -- Description and Evidence
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(100),
    flight_number VARCHAR(20),
    aircraft_registration VARCHAR(20),

    -- Workflow Status
    status VARCHAR(50) NOT NULL DEFAULT 'reported', -- reported, investigating, review, disciplinary_action, appealing, closed, dismissed
    current_stage VARCHAR(50) NOT NULL DEFAULT 'initial_report',
    assigned_investigator_id INTEGER REFERENCES an_users(id),
    assigned_reviewer_id INTEGER REFERENCES an_users(id),

    -- Outcomes
    investigation_findings TEXT,
    disciplinary_action VARCHAR(100), -- warning, suspension, training, termination
    action_details TEXT,
    appeal_status VARCHAR(50), -- not_appealed, pending, upheld, overturned
    appeal_notes TEXT,

    -- Important Dates
    investigation_started_at TIMESTAMP,
    investigation_completed_at TIMESTAMP,
    review_started_at TIMESTAMP,
    review_completed_at TIMESTAMP,
    action_taken_at TIMESTAMP,
    appeal_filed_at TIMESTAMP,
    appeal_decided_at TIMESTAMP,
    closed_at TIMESTAMP,

    -- Metadata
    created_by INTEGER REFERENCES an_users(id),
    updated_by INTEGER REFERENCES an_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Optimistic UI Support
    version INTEGER DEFAULT 1,
    locked_by INTEGER REFERENCES an_users(id),
    locked_at TIMESTAMP,

    -- Soft Delete
    deleted_at TIMESTAMP,
    deleted_by INTEGER REFERENCES an_users(id)
);

-- Workflow stages tracking
CREATE TABLE IF NOT EXISTS disciplinary_workflow_stages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id UUID REFERENCES disciplinary_incidents(id) ON DELETE CASCADE,
    stage_name VARCHAR(50) NOT NULL,
    stage_status VARCHAR(20) NOT NULL, -- pending, in_progress, completed, skipped
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    completed_by INTEGER REFERENCES an_users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Documents and attachments
CREATE TABLE IF NOT EXISTS disciplinary_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id UUID REFERENCES disciplinary_incidents(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- evidence, report, statement, decision, appeal
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES an_users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    is_confidential BOOLEAN DEFAULT TRUE,
    description TEXT
);

-- Comments and notes
CREATE TABLE IF NOT EXISTS disciplinary_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id UUID REFERENCES disciplinary_incidents(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Internal notes not visible to pilot
    created_by INTEGER REFERENCES an_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    parent_comment_id UUID REFERENCES disciplinary_comments(id), -- For threading
    mentioned_users INTEGER[] -- Array of user IDs mentioned
);

-- Audit log for compliance
CREATE TABLE IF NOT EXISTS disciplinary_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id UUID REFERENCES disciplinary_incidents(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    performed_by INTEGER REFERENCES an_users(id),
    performed_at TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_disciplinary_pilot ON disciplinary_incidents(pilot_id);
CREATE INDEX IF NOT EXISTS idx_disciplinary_status ON disciplinary_incidents(status);
CREATE INDEX IF NOT EXISTS idx_disciplinary_date ON disciplinary_incidents(incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_disciplinary_severity ON disciplinary_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_workflow_incident ON disciplinary_workflow_stages(incident_id);
CREATE INDEX IF NOT EXISTS idx_comments_incident ON disciplinary_comments(incident_id);
CREATE INDEX IF NOT EXISTS idx_audit_incident ON disciplinary_audit_log(incident_id);

-- =====================================================
-- SECTION 2: TASK MANAGEMENT MODULE
-- =====================================================

-- Task lists/boards
CREATE TABLE IF NOT EXISTS task_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#E4002B', -- Hex color for UI
    icon VARCHAR(50) DEFAULT 'clipboard', -- Lucide icon name
    list_type VARCHAR(20) DEFAULT 'standard', -- standard, smart, shared

    -- Smart list criteria (for filtered views)
    smart_criteria JSONB, -- {"assignee": 1, "priority": "high", "due": "this_week"}

    -- Permissions
    owner_id INTEGER REFERENCES an_users(id),
    is_shared BOOLEAN DEFAULT FALSE,
    shared_with INTEGER[], -- Array of user IDs

    -- UI State
    sort_order INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Main tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id UUID REFERENCES task_lists(id) ON DELETE CASCADE,

    -- Task Details
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, cancelled

    -- Assignment
    assignee_id INTEGER REFERENCES an_users(id),
    created_by INTEGER REFERENCES an_users(id),

    -- Dates
    due_date DATE,
    due_time TIME,
    reminder_date TIMESTAMP,
    completed_at TIMESTAMP,

    -- Related Entities
    pilot_id INTEGER REFERENCES pilots(id), -- Optional link to pilot
    incident_id UUID REFERENCES disciplinary_incidents(id), -- Optional link to incident
    check_id INTEGER REFERENCES pilot_checks(id), -- Optional link to certification

    -- Categorization
    tags TEXT[], -- Array of tags
    category VARCHAR(50), -- operations, safety, training, administrative

    -- Progress Tracking
    progress INTEGER DEFAULT 0, -- 0-100 percentage
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),

    -- UI State
    sort_order INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,

    -- Collaboration
    watchers INTEGER[], -- Array of user IDs watching this task
    last_activity_at TIMESTAMP DEFAULT NOW(),
    last_activity_by INTEGER REFERENCES an_users(id),

    -- Optimistic UI
    version INTEGER DEFAULT 1,
    client_id VARCHAR(100), -- For optimistic update tracking

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Subtasks
CREATE TABLE IF NOT EXISTS task_subtasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    completed_by INTEGER REFERENCES an_users(id),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Task comments
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_by INTEGER REFERENCES an_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    mentioned_users INTEGER[],
    attachments JSONB -- Array of attachment objects
);

-- Task attachments
CREATE TABLE IF NOT EXISTS task_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES an_users(id),
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Activity log for tasks
CREATE TABLE IF NOT EXISTS task_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- created, updated, completed, assigned, commented
    description TEXT,
    performed_by INTEGER REFERENCES an_users(id),
    performed_at TIMESTAMP DEFAULT NOW(),
    details JSONB -- Additional activity details
);

-- Real-time presence tracking
CREATE TABLE IF NOT EXISTS user_presence (
    user_id INTEGER REFERENCES an_users(id) PRIMARY KEY,
    current_page VARCHAR(100),
    current_entity_type VARCHAR(50), -- task, incident, pilot
    current_entity_id VARCHAR(100),
    cursor_position JSONB, -- {x: 100, y: 200} for collaborative cursors
    is_typing BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_list ON tasks(list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_subtasks_task ON task_subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_task ON task_activity_log(task_id);
CREATE INDEX IF NOT EXISTS idx_presence_entity ON user_presence(current_entity_type, current_entity_id);

-- =====================================================
-- SECTION 3: DATABASE VIEWS
-- =====================================================

-- Task summary view for optimized queries
CREATE OR REPLACE VIEW task_summary_view AS
SELECT
    t.*,
    tl.name as list_name,
    tl.color as list_color,
    u1.first_name || ' ' || u1.last_name as assignee_name,
    u2.first_name || ' ' || u2.last_name as creator_name,
    COUNT(DISTINCT ts.id) as subtask_count,
    COUNT(DISTINCT ts.id) FILTER (WHERE ts.is_completed) as completed_subtask_count,
    COUNT(DISTINCT tc.id) as comment_count,
    COUNT(DISTINCT ta.id) as attachment_count
FROM tasks t
LEFT JOIN task_lists tl ON t.list_id = tl.id
LEFT JOIN an_users u1 ON t.assignee_id = u1.id
LEFT JOIN an_users u2 ON t.created_by = u2.id
LEFT JOIN task_subtasks ts ON t.id = ts.task_id
LEFT JOIN task_comments tc ON t.id = tc.task_id
LEFT JOIN task_attachments ta ON t.id = ta.task_id
GROUP BY t.id, tl.name, tl.color, u1.first_name, u1.last_name, u2.first_name, u2.last_name;

-- Disciplinary incidents summary view
CREATE OR REPLACE VIEW disciplinary_summary_view AS
SELECT
    di.*,
    p.first_name || ' ' || p.last_name as pilot_name,
    p.employee_id as pilot_employee_id,
    u1.first_name || ' ' || u1.last_name as investigator_name,
    u2.first_name || ' ' || u2.last_name as reviewer_name,
    COUNT(DISTINCT dd.id) as document_count,
    COUNT(DISTINCT dc.id) as comment_count,
    COUNT(DISTINCT dws.id) as stage_count
FROM disciplinary_incidents di
LEFT JOIN pilots p ON di.pilot_id = p.id
LEFT JOIN an_users u1 ON di.assigned_investigator_id = u1.id
LEFT JOIN an_users u2 ON di.assigned_reviewer_id = u2.id
LEFT JOIN disciplinary_documents dd ON di.id = dd.incident_id
LEFT JOIN disciplinary_comments dc ON di.id = dc.incident_id
LEFT JOIN disciplinary_workflow_stages dws ON di.id = dws.incident_id
WHERE di.deleted_at IS NULL
GROUP BY di.id, p.first_name, p.last_name, p.employee_id, u1.first_name, u1.last_name, u2.first_name, u2.last_name;

-- =====================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE disciplinary_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Disciplinary Incidents Policies
DROP POLICY IF EXISTS "admin_all_incidents" ON disciplinary_incidents;
CREATE POLICY "admin_all_incidents" ON disciplinary_incidents
    FOR ALL USING (
        EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid()::INTEGER AND role = 'admin')
    );

DROP POLICY IF EXISTS "manager_read_incidents" ON disciplinary_incidents;
CREATE POLICY "manager_read_incidents" ON disciplinary_incidents
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid()::INTEGER AND role = 'manager')
    );

DROP POLICY IF EXISTS "manager_write_assigned" ON disciplinary_incidents;
CREATE POLICY "manager_write_assigned" ON disciplinary_incidents
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id = auth.uid()::INTEGER
            AND role = 'manager'
            AND (disciplinary_incidents.assigned_investigator_id = id
                 OR disciplinary_incidents.assigned_reviewer_id = id)
        )
    );

-- Task Policies
DROP POLICY IF EXISTS "admin_all_tasks" ON tasks;
CREATE POLICY "admin_all_tasks" ON tasks
    FOR ALL USING (
        EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid()::INTEGER AND role = 'admin')
    );

DROP POLICY IF EXISTS "manager_all_tasks" ON tasks;
CREATE POLICY "manager_all_tasks" ON tasks
    FOR ALL USING (
        EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid()::INTEGER AND role = 'manager')
    );

DROP POLICY IF EXISTS "user_own_tasks" ON tasks;
CREATE POLICY "user_own_tasks" ON tasks
    FOR ALL USING (
        assignee_id = auth.uid()::INTEGER OR created_by = auth.uid()::INTEGER
    );

-- Task Lists Policies
DROP POLICY IF EXISTS "admin_all_lists" ON task_lists;
CREATE POLICY "admin_all_lists" ON task_lists
    FOR ALL USING (
        EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid()::INTEGER AND role = 'admin')
    );

DROP POLICY IF EXISTS "manager_all_lists" ON task_lists;
CREATE POLICY "manager_all_lists" ON task_lists
    FOR ALL USING (
        EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid()::INTEGER AND role = 'manager')
    );

DROP POLICY IF EXISTS "user_own_shared_lists" ON task_lists;
CREATE POLICY "user_own_shared_lists" ON task_lists
    FOR ALL USING (
        owner_id = auth.uid()::INTEGER OR auth.uid()::INTEGER = ANY(shared_with)
    );

-- User Presence Policies (Read all for collaboration)
DROP POLICY IF EXISTS "presence_read_all" ON user_presence;
CREATE POLICY "presence_read_all" ON user_presence
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "presence_write_own" ON user_presence;
CREATE POLICY "presence_write_own" ON user_presence
    FOR ALL USING (user_id = auth.uid()::INTEGER);

-- =====================================================
-- SECTION 5: FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to auto-generate incident numbers
CREATE OR REPLACE FUNCTION generate_incident_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    sequence_num INTEGER;
    new_number VARCHAR(50);
BEGIN
    year_part := TO_CHAR(NEW.incident_date, 'YYYY');

    SELECT COALESCE(MAX(CAST(SUBSTRING(incident_number FROM 9) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM disciplinary_incidents
    WHERE incident_number LIKE 'DM-' || year_part || '-%';

    new_number := 'DM-' || year_part || '-' || LPAD(sequence_num::TEXT, 3, '0');
    NEW.incident_number := new_number;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_generate_incident_number ON disciplinary_incidents;
CREATE TRIGGER auto_generate_incident_number
    BEFORE INSERT ON disciplinary_incidents
    FOR EACH ROW
    WHEN (NEW.incident_number IS NULL)
    EXECUTE FUNCTION generate_incident_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_incidents_updated_at ON disciplinary_incidents;
CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON disciplinary_incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SECTION 6: SAMPLE DATA (For Testing)
-- =====================================================

-- Insert default task lists
INSERT INTO task_lists (name, description, color, icon, owner_id, list_type)
SELECT
    'Fleet Operations', 'Daily operational tasks', '#E4002B', 'plane', 1, 'standard'
WHERE NOT EXISTS (SELECT 1 FROM task_lists WHERE name = 'Fleet Operations');

INSERT INTO task_lists (name, description, color, icon, owner_id, list_type)
SELECT
    'Safety & Compliance', 'Safety-related tasks and compliance', '#DC2626', 'shield-check', 1, 'standard'
WHERE NOT EXISTS (SELECT 1 FROM task_lists WHERE name = 'Safety & Compliance');

INSERT INTO task_lists (name, description, color, icon, owner_id, list_type)
SELECT
    'Training & Development', 'Pilot training and certification tasks', '#2563EB', 'graduation-cap', 1, 'standard'
WHERE NOT EXISTS (SELECT 1 FROM task_lists WHERE name = 'Training & Development');

-- =====================================================
-- DEPLOYMENT COMPLETE
-- =====================================================

-- Verify tables created
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'disciplinary_incidents',
        'disciplinary_workflow_stages',
        'disciplinary_documents',
        'disciplinary_comments',
        'disciplinary_audit_log',
        'task_lists',
        'tasks',
        'task_subtasks',
        'task_comments',
        'task_attachments',
        'task_activity_log',
        'user_presence'
    );

    RAISE NOTICE '✅ Phase 1 & 2 Deployment Complete: % tables created', table_count;
END $$;
