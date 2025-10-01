-- =====================================================================================
-- Air Niugini B767 PMS - Document Management System Migration
-- =====================================================================================
-- Migration: 010_documents.sql
-- Description: Comprehensive document management system with secure storage,
--              versioning, expiry tracking, and audit logging
-- Author: Air Niugini Development Team
-- Version: 1.0.0
-- Date: 2025-10-01
-- =====================================================================================

-- =====================================================================================
-- PART 1: CREATE DOCUMENT TYPES ENUM
-- =====================================================================================

DO $$ BEGIN
    CREATE TYPE document_type AS ENUM (
        'LICENSE',           -- Pilot licenses
        'MEDICAL',          -- Medical certificates
        'PASSPORT',         -- Passport copies
        'TRAINING',         -- Training certificates
        'EMERGENCY_CONTACT', -- Emergency contact forms
        'CONTRACT',         -- Employment contracts
        'VISA',            -- Visa documents
        'ID_CARD',         -- Identification cards
        'INSURANCE',       -- Insurance documents
        'OTHER'            -- Miscellaneous documents
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================================================
-- PART 2: CREATE PILOT_DOCUMENTS TABLE
-- =====================================================================================

CREATE TABLE IF NOT EXISTS pilot_documents (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign key to pilots
    pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,

    -- Document metadata
    document_type document_type NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL, -- File size in bytes
    file_type VARCHAR(100) NOT NULL, -- MIME type (application/pdf, image/jpeg, etc.)

    -- Document details
    document_number VARCHAR(100), -- License number, passport number, etc.
    expiry_date DATE, -- Expiration date for time-sensitive documents
    issue_date DATE, -- Date document was issued
    issuing_authority VARCHAR(255), -- Authority that issued the document

    -- Versioning
    version_number INTEGER NOT NULL DEFAULT 1,
    is_current_version BOOLEAN NOT NULL DEFAULT true,
    replaces_document_id UUID REFERENCES pilot_documents(id) ON DELETE SET NULL,

    -- Security and access
    is_encrypted BOOLEAN NOT NULL DEFAULT false,
    access_level VARCHAR(20) NOT NULL DEFAULT 'restricted' CHECK (access_level IN ('public', 'restricted', 'confidential')),

    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted', 'expired')),
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verified_by UUID REFERENCES an_users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,

    -- Audit fields
    uploaded_by UUID NOT NULL REFERENCES an_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp

    -- Additional metadata
    notes TEXT,
    tags TEXT[], -- Array of tags for search and categorization

    -- Constraints
    CONSTRAINT valid_expiry_date CHECK (expiry_date IS NULL OR expiry_date > issue_date),
    CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 10485760) -- Max 10MB
);

-- =====================================================================================
-- PART 3: CREATE INDEXES FOR PERFORMANCE
-- =====================================================================================

-- Index for pilot lookup
CREATE INDEX IF NOT EXISTS idx_pilot_documents_pilot_id
    ON pilot_documents(pilot_id)
    WHERE status = 'active';

-- Index for document type filtering
CREATE INDEX IF NOT EXISTS idx_pilot_documents_type
    ON pilot_documents(document_type);

-- Index for expiry date tracking
CREATE INDEX IF NOT EXISTS idx_pilot_documents_expiry
    ON pilot_documents(expiry_date)
    WHERE expiry_date IS NOT NULL AND status = 'active';

-- Index for current version lookup
CREATE INDEX IF NOT EXISTS idx_pilot_documents_current
    ON pilot_documents(pilot_id, document_type, is_current_version)
    WHERE is_current_version = true AND status = 'active';

-- Index for upload tracking
CREATE INDEX IF NOT EXISTS idx_pilot_documents_uploaded_by
    ON pilot_documents(uploaded_by, created_at DESC);

-- Index for verification status
CREATE INDEX IF NOT EXISTS idx_pilot_documents_verification
    ON pilot_documents(verification_status)
    WHERE status = 'active';

-- GIN index for tag search
CREATE INDEX IF NOT EXISTS idx_pilot_documents_tags
    ON pilot_documents USING GIN(tags);

-- =====================================================================================
-- PART 4: CREATE DOCUMENT_ACCESS_LOG TABLE
-- =====================================================================================

CREATE TABLE IF NOT EXISTS document_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES pilot_documents(id) ON DELETE CASCADE,
    accessed_by UUID NOT NULL REFERENCES an_users(id) ON DELETE CASCADE,
    access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('view', 'download', 'upload', 'delete', 'verify', 'share')),
    access_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(45), -- Supports both IPv4 and IPv6
    user_agent TEXT,
    notes TEXT
);

-- Index for audit trail queries
CREATE INDEX IF NOT EXISTS idx_document_access_log_document
    ON document_access_log(document_id, access_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_document_access_log_user
    ON document_access_log(accessed_by, access_timestamp DESC);

-- =====================================================================================
-- PART 5: CREATE DOCUMENT NOTIFICATIONS TABLE
-- =====================================================================================

CREATE TABLE IF NOT EXISTS document_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES pilot_documents(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('expiry_warning', 'expired', 'verification_required', 'new_upload', 'version_update')),
    notification_date DATE NOT NULL,
    is_sent BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    recipient_id UUID REFERENCES an_users(id) ON DELETE CASCADE,
    email_subject VARCHAR(255),
    email_body TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for notification processing
CREATE INDEX IF NOT EXISTS idx_document_notifications_pending
    ON document_notifications(notification_date)
    WHERE is_sent = false;

CREATE INDEX IF NOT EXISTS idx_document_notifications_document
    ON document_notifications(document_id, notification_date DESC);

-- =====================================================================================
-- PART 6: CREATE DATABASE VIEWS
-- =====================================================================================

-- View: Expiring Documents (30 days ahead)
CREATE OR REPLACE VIEW expiring_documents AS
SELECT
    pd.id,
    pd.pilot_id,
    p.first_name,
    p.last_name,
    p.employee_id,
    pd.document_type,
    pd.document_name,
    pd.document_number,
    pd.expiry_date,
    pd.issue_date,
    pd.issuing_authority,
    pd.verification_status,
    CASE
        WHEN pd.expiry_date < CURRENT_DATE THEN 'expired'
        WHEN pd.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'critical'
        WHEN pd.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'warning'
        ELSE 'ok'
    END AS expiry_status,
    CURRENT_DATE - pd.expiry_date AS days_until_expiry
FROM pilot_documents pd
INNER JOIN pilots p ON pd.pilot_id = p.id
WHERE pd.status = 'active'
    AND pd.is_current_version = true
    AND pd.expiry_date IS NOT NULL
    AND pd.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY pd.expiry_date ASC;

-- View: Pilot Document Summary
CREATE OR REPLACE VIEW pilot_document_summary AS
SELECT
    p.id AS pilot_id,
    p.first_name,
    p.last_name,
    p.employee_id,
    COUNT(DISTINCT pd.id) AS total_documents,
    COUNT(DISTINCT CASE WHEN pd.document_type = 'LICENSE' THEN pd.id END) AS license_count,
    COUNT(DISTINCT CASE WHEN pd.document_type = 'MEDICAL' THEN pd.id END) AS medical_count,
    COUNT(DISTINCT CASE WHEN pd.document_type = 'PASSPORT' THEN pd.id END) AS passport_count,
    COUNT(DISTINCT CASE WHEN pd.document_type = 'TRAINING' THEN pd.id END) AS training_count,
    COUNT(DISTINCT CASE WHEN pd.expiry_date < CURRENT_DATE THEN pd.id END) AS expired_documents,
    COUNT(DISTINCT CASE WHEN pd.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN pd.id END) AS expiring_soon,
    MAX(pd.created_at) AS last_upload_date
FROM pilots p
LEFT JOIN pilot_documents pd ON p.id = pd.pilot_id
    AND pd.status = 'active'
    AND pd.is_current_version = true
WHERE p.is_active = true
GROUP BY p.id, p.first_name, p.last_name, p.employee_id
ORDER BY p.last_name, p.first_name;

-- View: Document Verification Queue
CREATE OR REPLACE VIEW document_verification_queue AS
SELECT
    pd.id,
    pd.pilot_id,
    p.first_name,
    p.last_name,
    p.employee_id,
    pd.document_type,
    pd.document_name,
    pd.verification_status,
    pd.created_at AS uploaded_at,
    u.name AS uploaded_by_name,
    CURRENT_DATE - pd.created_at::DATE AS days_pending
FROM pilot_documents pd
INNER JOIN pilots p ON pd.pilot_id = p.id
INNER JOIN an_users u ON pd.uploaded_by = u.id
WHERE pd.verification_status = 'pending'
    AND pd.status = 'active'
ORDER BY pd.created_at ASC;

-- =====================================================================================
-- PART 7: CREATE TRIGGERS
-- =====================================================================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_document_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_document_timestamp ON pilot_documents;
CREATE TRIGGER trigger_update_document_timestamp
    BEFORE UPDATE ON pilot_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_document_timestamp();

-- Trigger: Log document access on download
CREATE OR REPLACE FUNCTION log_document_access()
RETURNS TRIGGER AS $$
BEGIN
    -- This is a placeholder - actual implementation would be in application code
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Mark old versions as not current when new version is uploaded
CREATE OR REPLACE FUNCTION handle_document_versioning()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_current_version = true THEN
        UPDATE pilot_documents
        SET is_current_version = false
        WHERE pilot_id = NEW.pilot_id
            AND document_type = NEW.document_type
            AND id != NEW.id
            AND is_current_version = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_document_versioning ON pilot_documents;
CREATE TRIGGER trigger_document_versioning
    BEFORE INSERT OR UPDATE ON pilot_documents
    FOR EACH ROW
    WHEN (NEW.is_current_version = true)
    EXECUTE FUNCTION handle_document_versioning();

-- Trigger: Create expiry notifications for new documents
CREATE OR REPLACE FUNCTION create_expiry_notifications()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expiry_date IS NOT NULL THEN
        -- Notification 30 days before expiry
        INSERT INTO document_notifications (
            document_id, notification_type, notification_date, email_subject
        ) VALUES (
            NEW.id, 'expiry_warning', NEW.expiry_date - INTERVAL '30 days',
            'Document Expiry Warning: ' || NEW.document_name
        );

        -- Notification 7 days before expiry
        INSERT INTO document_notifications (
            document_id, notification_type, notification_date, email_subject
        ) VALUES (
            NEW.id, 'expiry_warning', NEW.expiry_date - INTERVAL '7 days',
            'Document Expiry Critical: ' || NEW.document_name
        );

        -- Notification on expiry date
        INSERT INTO document_notifications (
            document_id, notification_type, notification_date, email_subject
        ) VALUES (
            NEW.id, 'expired', NEW.expiry_date,
            'Document Expired: ' || NEW.document_name
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_expiry_notifications ON pilot_documents;
CREATE TRIGGER trigger_create_expiry_notifications
    AFTER INSERT ON pilot_documents
    FOR EACH ROW
    WHEN (NEW.expiry_date IS NOT NULL)
    EXECUTE FUNCTION create_expiry_notifications();

-- =====================================================================================
-- PART 8: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================================

-- Enable RLS on tables
ALTER TABLE pilot_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Admin users can see all documents
CREATE POLICY "Admin users can view all documents"
    ON pilot_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE an_users.id = auth.uid()
            AND an_users.role = 'admin'
        )
    );

-- Policy: Manager users can see active documents
CREATE POLICY "Manager users can view active documents"
    ON pilot_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE an_users.id = auth.uid()
            AND an_users.role IN ('admin', 'manager')
        )
        AND status = 'active'
    );

-- Policy: Admin users can insert documents
CREATE POLICY "Admin users can upload documents"
    ON pilot_documents FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE an_users.id = auth.uid()
            AND an_users.role = 'admin'
        )
    );

-- Policy: Admin users can update documents
CREATE POLICY "Admin users can update documents"
    ON pilot_documents FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE an_users.id = auth.uid()
            AND an_users.role = 'admin'
        )
    );

-- Policy: Admin users can delete documents
CREATE POLICY "Admin users can delete documents"
    ON pilot_documents FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE an_users.id = auth.uid()
            AND an_users.role = 'admin'
        )
    );

-- Policy: Authenticated users can view access logs
CREATE POLICY "Authenticated users can view access logs"
    ON document_access_log FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Authenticated users can insert access logs
CREATE POLICY "Authenticated users can create access logs"
    ON document_access_log FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================================================
-- PART 9: GRANT PERMISSIONS
-- =====================================================================================

-- Grant table permissions
GRANT ALL ON pilot_documents TO authenticated;
GRANT ALL ON document_access_log TO authenticated;
GRANT ALL ON document_notifications TO authenticated;

-- Grant view permissions
GRANT SELECT ON expiring_documents TO authenticated;
GRANT SELECT ON pilot_document_summary TO authenticated;
GRANT SELECT ON document_verification_queue TO authenticated;

-- =====================================================================================
-- PART 10: HELPER FUNCTIONS
-- =====================================================================================

-- Function: Get documents by pilot ID
CREATE OR REPLACE FUNCTION get_pilot_documents(p_pilot_id UUID)
RETURNS TABLE (
    id UUID,
    document_type document_type,
    document_name VARCHAR,
    file_path TEXT,
    expiry_date DATE,
    verification_status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pd.id,
        pd.document_type,
        pd.document_name,
        pd.file_path,
        pd.expiry_date,
        pd.verification_status,
        pd.created_at
    FROM pilot_documents pd
    WHERE pd.pilot_id = p_pilot_id
        AND pd.status = 'active'
        AND pd.is_current_version = true
    ORDER BY pd.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get expiring documents count
CREATE OR REPLACE FUNCTION get_expiring_documents_count()
RETURNS TABLE (
    critical_count BIGINT,
    warning_count BIGINT,
    expired_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE expiry_date <= CURRENT_DATE + INTERVAL '7 days' AND expiry_date >= CURRENT_DATE) AS critical_count,
        COUNT(*) FILTER (WHERE expiry_date > CURRENT_DATE + INTERVAL '7 days' AND expiry_date <= CURRENT_DATE + INTERVAL '30 days') AS warning_count,
        COUNT(*) FILTER (WHERE expiry_date < CURRENT_DATE) AS expired_count
    FROM pilot_documents
    WHERE status = 'active'
        AND is_current_version = true
        AND expiry_date IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- MIGRATION COMPLETE
-- =====================================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 010_documents.sql completed successfully';
    RAISE NOTICE 'Created tables: pilot_documents, document_access_log, document_notifications';
    RAISE NOTICE 'Created views: expiring_documents, pilot_document_summary, document_verification_queue';
    RAISE NOTICE 'Created triggers: versioning, expiry notifications, timestamp updates';
    RAISE NOTICE 'Applied Row Level Security policies';
    RAISE NOTICE 'Document management system ready for use';
END $$;
