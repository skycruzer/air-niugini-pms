-- =====================================================
-- Document Management & Digital Forms System
-- Migration: 20251007_document_management_system
-- Author: AI Assistant
-- Date: 2025-10-07
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. DOCUMENT CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS document_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20) DEFAULT '#2563EB',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES document_categories(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT, -- in bytes
    file_type VARCHAR(100),
    mime_type VARCHAR(100),

    -- Metadata
    uploaded_by UUID REFERENCES an_users(id) ON DELETE SET NULL,
    pilot_id UUID REFERENCES pilots(id) ON DELETE CASCADE,

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, archived, deleted
    version INTEGER DEFAULT 1,

    -- Access control
    is_public BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. DIGITAL FORMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS digital_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_type VARCHAR(100) NOT NULL, -- leave_request, incident_report, etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Form schema (JSONB for flexible form fields)
    form_schema JSONB NOT NULL,

    -- Status and settings
    is_active BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT true,
    allowed_roles TEXT[], -- array of roles that can submit

    -- Metadata
    created_by UUID REFERENCES an_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. FORM SUBMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES digital_forms(id) ON DELETE CASCADE,

    -- Submission data
    form_data JSONB NOT NULL,

    -- Submitter info
    submitted_by UUID REFERENCES an_users(id) ON DELETE SET NULL,
    pilot_id UUID REFERENCES pilots(id) ON DELETE CASCADE,

    -- Workflow
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, completed
    approved_by UUID REFERENCES an_users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,

    -- Attachments
    attachments JSONB, -- array of document references

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. DOCUMENT ACCESS LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS document_access_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES an_users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- view, download, update, delete
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_pilot ON documents(pilot_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- Form submissions indexes
CREATE INDEX IF NOT EXISTS idx_form_submissions_form ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_by ON form_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_form_submissions_pilot ON form_submissions(pilot_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at DESC);

-- Access log index
CREATE INDEX IF NOT EXISTS idx_access_log_document ON document_access_log(document_id);
CREATE INDEX IF NOT EXISTS idx_access_log_user ON document_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_access_log_created_at ON document_access_log(created_at DESC);

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_log ENABLE ROW LEVEL SECURITY;

-- Document Categories - Public read, admin write
CREATE POLICY "Anyone can view active document categories"
    ON document_categories FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage document categories"
    ON document_categories FOR ALL
    USING (EXISTS (
        SELECT 1 FROM an_users
        WHERE an_users.id = auth.uid()
        AND an_users.role = 'admin'
    ));

-- Documents - User can view their own or public, admin can view all
CREATE POLICY "Users can view their own documents"
    ON documents FOR SELECT
    USING (
        uploaded_by = auth.uid()
        OR is_public = true
        OR EXISTS (
            SELECT 1 FROM an_users
            WHERE an_users.id = auth.uid()
            AND an_users.role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Users can upload documents"
    ON documents FOR INSERT
    WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update their own documents"
    ON documents FOR UPDATE
    USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can manage all documents"
    ON documents FOR ALL
    USING (EXISTS (
        SELECT 1 FROM an_users
        WHERE an_users.id = auth.uid()
        AND an_users.role = 'admin'
    ));

-- Digital Forms - Anyone can view active forms
CREATE POLICY "Anyone can view active forms"
    ON digital_forms FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage forms"
    ON digital_forms FOR ALL
    USING (EXISTS (
        SELECT 1 FROM an_users
        WHERE an_users.id = auth.uid()
        AND an_users.role = 'admin'
    ));

-- Form Submissions
CREATE POLICY "Users can view their own submissions"
    ON form_submissions FOR SELECT
    USING (
        submitted_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM an_users
            WHERE an_users.id = auth.uid()
            AND an_users.role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Users can create submissions"
    ON form_submissions FOR INSERT
    WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Managers can approve submissions"
    ON form_submissions FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM an_users
        WHERE an_users.id = auth.uid()
        AND an_users.role IN ('admin', 'manager')
    ));

-- =====================================================
-- 8. SEED DATA - DEFAULT CATEGORIES
-- =====================================================

INSERT INTO document_categories (name, description, icon, color, display_order) VALUES
    ('Certifications', 'Pilot certification documents', 'certificate', '#2563EB', 1),
    ('Medical Records', 'Medical examination documents', 'heart-pulse', '#DC2626', 2),
    ('Training Records', 'Training completion certificates', 'graduation-cap', '#059669', 3),
    ('Licenses', 'Pilot licenses and permits', 'badge-check', '#7C3AED', 4),
    ('Incident Reports', 'Incident and safety reports', 'alert-triangle', '#EA580C', 5),
    ('Leave Documents', 'Leave request documentation', 'calendar', '#0891B2', 6),
    ('Personnel Files', 'Personal and employment documents', 'user', '#4B5563', 7),
    ('Compliance Documents', 'Regulatory compliance files', 'shield-check', '#0D9488', 8),
    ('Other', 'Miscellaneous documents', 'file', '#6B7280', 99)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. SEED DATA - DEFAULT DIGITAL FORMS
-- =====================================================

INSERT INTO digital_forms (form_type, title, description, form_schema, requires_approval, allowed_roles) VALUES
    (
        'leave_request',
        'Leave Request Form',
        'Submit a leave request for RDO, WDO, or special leave',
        '{
            "fields": [
                {"name": "leave_type", "type": "select", "label": "Leave Type", "required": true, "options": ["RDO", "WDO", "Annual Leave", "Sick Leave", "Compassionate Leave", "Training Leave"]},
                {"name": "start_date", "type": "date", "label": "Start Date", "required": true},
                {"name": "end_date", "type": "date", "label": "End Date", "required": true},
                {"name": "roster_period", "type": "text", "label": "Roster Period", "required": true},
                {"name": "reason", "type": "textarea", "label": "Reason", "required": true},
                {"name": "emergency_contact", "type": "text", "label": "Emergency Contact", "required": false}
            ]
        }'::jsonb,
        true,
        ARRAY['admin', 'manager', 'user']
    ),
    (
        'incident_report',
        'Incident Report Form',
        'Report safety incidents or operational irregularities',
        '{
            "fields": [
                {"name": "incident_date", "type": "datetime", "label": "Incident Date & Time", "required": true},
                {"name": "incident_type", "type": "select", "label": "Incident Type", "required": true, "options": ["Safety", "Operational", "Security", "Other"]},
                {"name": "location", "type": "text", "label": "Location", "required": true},
                {"name": "description", "type": "textarea", "label": "Detailed Description", "required": true},
                {"name": "witnesses", "type": "textarea", "label": "Witnesses", "required": false},
                {"name": "immediate_action", "type": "textarea", "label": "Immediate Action Taken", "required": true}
            ]
        }'::jsonb,
        true,
        ARRAY['admin', 'manager', 'user']
    ),
    (
        'medical_declaration',
        'Medical Fitness Declaration',
        'Declare medical fitness for flight duties',
        '{
            "fields": [
                {"name": "declaration_date", "type": "date", "label": "Declaration Date", "required": true},
                {"name": "fit_for_duty", "type": "radio", "label": "Fit for Duty", "required": true, "options": ["Yes", "No"]},
                {"name": "medications", "type": "textarea", "label": "Current Medications", "required": false},
                {"name": "medical_conditions", "type": "textarea", "label": "Recent Medical Conditions", "required": false},
                {"name": "last_medical_exam", "type": "date", "label": "Last Medical Examination", "required": true}
            ]
        }'::jsonb,
        true,
        ARRAY['admin', 'manager', 'user']
    )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. FUNCTIONS & TRIGGERS
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
CREATE TRIGGER update_document_categories_updated_at BEFORE UPDATE ON document_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_digital_forms_updated_at BEFORE UPDATE ON digital_forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_submissions_updated_at BEFORE UPDATE ON form_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE document_categories IS 'Categories for organizing documents';
COMMENT ON TABLE documents IS 'Main documents storage with metadata';
COMMENT ON TABLE digital_forms IS 'Digital form templates';
COMMENT ON TABLE form_submissions IS 'Submitted digital forms';
COMMENT ON TABLE document_access_log IS 'Audit log for document access';
