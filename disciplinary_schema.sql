### 2.1 Disciplinary Matters Schema

````sql
-- Main disciplinary incidents table
CREATE TABLE disciplinary_incidents (
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
CREATE TABLE disciplinary_workflow_stages (
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
CREATE TABLE disciplinary_documents (
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
CREATE TABLE disciplinary_comments (
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
CREATE TABLE disciplinary_audit_log (
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
CREATE INDEX idx_disciplinary_pilot ON disciplinary_incidents(pilot_id);
CREATE INDEX idx_disciplinary_status ON disciplinary_incidents(status);
CREATE INDEX idx_disciplinary_date ON disciplinary_incidents(incident_date DESC);
CREATE INDEX idx_disciplinary_severity ON disciplinary_incidents(severity);
CREATE INDEX idx_workflow_incident ON disciplinary_workflow_stages(incident_id);
CREATE INDEX idx_comments_incident ON disciplinary_comments(incident_id);
CREATE INDEX idx_audit_incident ON disciplinary_audit_log(incident_id);

### 2.2 Task Management Schema
