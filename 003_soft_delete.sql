-- =====================================================
-- MIGRATION 003: IMPLEMENT SOFT DELETE PATTERN
-- =====================================================
-- This migration adds soft delete functionality to critical tables
-- by adding deleted_at timestamp columns and updating queries to filter them
--
-- BENEFITS:
-- - Data recovery capability for accidental deletions
-- - Audit trail preservation
-- - Referential integrity maintained
-- - Historical data retention for compliance
--
-- PATTERN:
-- - deleted_at IS NULL: Active record
-- - deleted_at IS NOT NULL: Soft deleted record
--
-- Created: 2025-09-30
-- Purpose: Implement soft delete pattern - Phase 1.1
-- =====================================================

-- =====================================================
-- STEP 1: ADD DELETED_AT COLUMNS
-- =====================================================

-- Add deleted_at to pilots table
ALTER TABLE pilots
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

COMMENT ON COLUMN pilots.deleted_at IS
  'Timestamp when pilot was soft deleted. NULL = active, NOT NULL = deleted. Enables data recovery and audit trail.';

-- Add deleted_at to pilot_checks table
ALTER TABLE pilot_checks
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

COMMENT ON COLUMN pilot_checks.deleted_at IS
  'Timestamp when certification was soft deleted. NULL = active, NOT NULL = deleted. Preserves historical data.';

-- Add deleted_at to leave_requests table
ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

COMMENT ON COLUMN leave_requests.deleted_at IS
  'Timestamp when leave request was soft deleted. NULL = active, NOT NULL = deleted. Maintains request history.';

-- Add deleted_at to check_types table
ALTER TABLE check_types
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

COMMENT ON COLUMN check_types.deleted_at IS
  'Timestamp when check type was soft deleted. NULL = active, NOT NULL = deleted. Preserves certification type history.';

-- Add deleted_at to an_users table
ALTER TABLE an_users
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

COMMENT ON COLUMN an_users.deleted_at IS
  'Timestamp when user account was soft deleted. NULL = active, NOT NULL = deleted. Enables account recovery.';

-- =====================================================
-- STEP 2: CREATE INDEXES FOR SOFT DELETE FILTERING
-- =====================================================

-- Partial indexes for active records only (WHERE deleted_at IS NULL)
-- These improve performance of queries that filter out deleted records

CREATE INDEX IF NOT EXISTS idx_pilots_not_deleted
  ON pilots (id)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_pilots_not_deleted IS
  'Partial index for active (non-deleted) pilots. Optimizes default queries.';

CREATE INDEX IF NOT EXISTS idx_pilot_checks_not_deleted
  ON pilot_checks (id)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_pilot_checks_not_deleted IS
  'Partial index for active (non-deleted) certifications. Optimizes certification queries.';

CREATE INDEX IF NOT EXISTS idx_leave_requests_not_deleted
  ON leave_requests (id)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_leave_requests_not_deleted IS
  'Partial index for active (non-deleted) leave requests. Optimizes leave management queries.';

CREATE INDEX IF NOT EXISTS idx_check_types_not_deleted
  ON check_types (id)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_check_types_not_deleted IS
  'Partial index for active (non-deleted) check types. Optimizes check type lookups.';

CREATE INDEX IF NOT EXISTS idx_an_users_not_deleted
  ON an_users (id)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_an_users_not_deleted IS
  'Partial index for active (non-deleted) users. Optimizes authentication queries.';

-- Indexes for deleted records (for recovery and audit queries)
CREATE INDEX IF NOT EXISTS idx_pilots_deleted_at
  ON pilots (deleted_at)
  WHERE deleted_at IS NOT NULL;

COMMENT ON INDEX idx_pilots_deleted_at IS
  'Index for soft-deleted pilots. Supports recovery and audit queries.';

CREATE INDEX IF NOT EXISTS idx_pilot_checks_deleted_at
  ON pilot_checks (deleted_at)
  WHERE deleted_at IS NOT NULL;

COMMENT ON INDEX idx_pilot_checks_deleted_at IS
  'Index for soft-deleted certifications. Supports recovery and audit queries.';

CREATE INDEX IF NOT EXISTS idx_leave_requests_deleted_at
  ON leave_requests (deleted_at)
  WHERE deleted_at IS NOT NULL;

COMMENT ON INDEX idx_leave_requests_deleted_at IS
  'Index for soft-deleted leave requests. Supports recovery and audit queries.';

-- =====================================================
-- STEP 3: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to soft delete a pilot
CREATE OR REPLACE FUNCTION soft_delete_pilot(pilot_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE pilots
  SET deleted_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP,
      is_active = false
  WHERE id = pilot_uuid
    AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION soft_delete_pilot IS
  'Soft deletes a pilot by setting deleted_at timestamp and is_active=false. Returns true if successful.';

-- Function to restore a soft-deleted pilot
CREATE OR REPLACE FUNCTION restore_pilot(pilot_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE pilots
  SET deleted_at = NULL,
      updated_at = CURRENT_TIMESTAMP,
      is_active = true
  WHERE id = pilot_uuid
    AND deleted_at IS NOT NULL;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION restore_pilot IS
  'Restores a soft-deleted pilot by clearing deleted_at timestamp and setting is_active=true.';

-- Function to soft delete a certification
CREATE OR REPLACE FUNCTION soft_delete_pilot_check(check_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE pilot_checks
  SET deleted_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = check_uuid
    AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION soft_delete_pilot_check IS
  'Soft deletes a pilot certification by setting deleted_at timestamp.';

-- Function to restore a soft-deleted certification
CREATE OR REPLACE FUNCTION restore_pilot_check(check_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE pilot_checks
  SET deleted_at = NULL,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = check_uuid
    AND deleted_at IS NOT NULL;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION restore_pilot_check IS
  'Restores a soft-deleted pilot certification by clearing deleted_at timestamp.';

-- Function to soft delete a leave request
CREATE OR REPLACE FUNCTION soft_delete_leave_request(request_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE leave_requests
  SET deleted_at = CURRENT_TIMESTAMP
  WHERE id = request_uuid
    AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION soft_delete_leave_request IS
  'Soft deletes a leave request by setting deleted_at timestamp.';

-- Function to restore a soft-deleted leave request
CREATE OR REPLACE FUNCTION restore_leave_request(request_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE leave_requests
  SET deleted_at = NULL
  WHERE id = request_uuid
    AND deleted_at IS NOT NULL;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION restore_leave_request IS
  'Restores a soft-deleted leave request by clearing deleted_at timestamp.';

-- =====================================================
-- STEP 4: CREATE VIEWS FOR ACTIVE RECORDS
-- =====================================================

-- View for active pilots only
CREATE OR REPLACE VIEW active_pilots AS
SELECT *
FROM pilots
WHERE deleted_at IS NULL;

COMMENT ON VIEW active_pilots IS
  'View containing only active (non-deleted) pilots. Use this view for standard queries.';

-- View for active certifications only
CREATE OR REPLACE VIEW active_pilot_checks AS
SELECT pc.*
FROM pilot_checks pc
WHERE pc.deleted_at IS NULL;

COMMENT ON VIEW active_pilot_checks IS
  'View containing only active (non-deleted) certifications. Use this view for standard queries.';

-- View for active leave requests only
CREATE OR REPLACE VIEW active_leave_requests AS
SELECT *
FROM leave_requests
WHERE deleted_at IS NULL;

COMMENT ON VIEW active_leave_requests IS
  'View containing only active (non-deleted) leave requests. Use this view for standard queries.';

-- =====================================================
-- STEP 5: CREATE RECOVERY VIEWS
-- =====================================================

-- View for recently deleted pilots (last 30 days)
CREATE OR REPLACE VIEW recently_deleted_pilots AS
SELECT
  id,
  employee_id,
  first_name,
  last_name,
  deleted_at,
  deleted_at AT TIME ZONE 'Pacific/Port_Moresby' AS deleted_at_local
FROM pilots
WHERE deleted_at IS NOT NULL
  AND deleted_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
ORDER BY deleted_at DESC;

COMMENT ON VIEW recently_deleted_pilots IS
  'View of pilots deleted within the last 30 days. Used for recovery and audit purposes.';

-- View for recently deleted certifications (last 30 days)
CREATE OR REPLACE VIEW recently_deleted_pilot_checks AS
SELECT
  pc.id,
  p.employee_id,
  p.first_name || ' ' || p.last_name AS pilot_name,
  ct.check_code,
  ct.check_description,
  pc.expiry_date,
  pc.deleted_at,
  pc.deleted_at AT TIME ZONE 'Pacific/Port_Moresby' AS deleted_at_local
FROM pilot_checks pc
JOIN pilots p ON pc.pilot_id = p.id
JOIN check_types ct ON pc.check_type_id = ct.id
WHERE pc.deleted_at IS NOT NULL
  AND pc.deleted_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
ORDER BY pc.deleted_at DESC;

COMMENT ON VIEW recently_deleted_pilot_checks IS
  'View of certifications deleted within the last 30 days. Used for recovery and audit purposes.';

-- View for recently deleted leave requests (last 30 days)
CREATE OR REPLACE VIEW recently_deleted_leave_requests AS
SELECT
  lr.id,
  p.employee_id,
  p.first_name || ' ' || p.last_name AS pilot_name,
  lr.request_type,
  lr.roster_period,
  lr.start_date,
  lr.end_date,
  lr.deleted_at,
  lr.deleted_at AT TIME ZONE 'Pacific/Port_Moresby' AS deleted_at_local
FROM leave_requests lr
JOIN pilots p ON lr.pilot_id = p.id
WHERE lr.deleted_at IS NOT NULL
  AND lr.deleted_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
ORDER BY lr.deleted_at DESC;

COMMENT ON VIEW recently_deleted_leave_requests IS
  'View of leave requests deleted within the last 30 days. Used for recovery and audit purposes.';

-- =====================================================
-- STEP 6: UPDATE EXISTING VIEWS TO FILTER DELETED RECORDS
-- =====================================================

-- Recreate pilot_checks_overview to exclude deleted records
CREATE OR REPLACE VIEW pilot_checks_overview AS
SELECT
  p.id AS pilot_id,
  p.first_name || ' ' || p.last_name AS pilot_name,
  p.employee_id,
  ct.check_code,
  ct.check_description,
  ct.category,
  pc.expiry_date,
  pc.id AS check_id
FROM pilots p
JOIN pilot_checks pc ON p.id = pc.pilot_id
JOIN check_types ct ON pc.check_type_id = ct.id
WHERE p.deleted_at IS NULL
  AND pc.deleted_at IS NULL
  AND ct.deleted_at IS NULL;

COMMENT ON VIEW pilot_checks_overview IS
  'Overview of all active pilot certifications with pilot and check type details. Excludes soft-deleted records.';

-- Recreate expiring_checks view to exclude deleted records
CREATE OR REPLACE VIEW expiring_checks AS
SELECT
  p.id AS pilot_id,
  p.first_name || ' ' || p.last_name AS pilot_name,
  p.employee_id,
  ct.check_code,
  ct.check_description,
  ct.category,
  pc.expiry_date,
  pc.id AS check_id,
  EXTRACT(DAY FROM (pc.expiry_date - CURRENT_DATE)) AS days_until_expiry
FROM pilots p
JOIN pilot_checks pc ON p.id = pc.pilot_id
JOIN check_types ct ON pc.check_type_id = ct.id
WHERE pc.expiry_date IS NOT NULL
  AND p.deleted_at IS NULL
  AND pc.deleted_at IS NULL
  AND ct.deleted_at IS NULL
ORDER BY pc.expiry_date ASC;

COMMENT ON VIEW expiring_checks IS
  'View of certifications with expiry dates, showing days until expiry. Excludes soft-deleted records.';

-- =====================================================
-- STEP 7: POST-MIGRATION VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Soft delete migration verification:';
  RAISE NOTICE '- deleted_at columns added to 5 tables';
  RAISE NOTICE '- 8 partial indexes created for performance';
  RAISE NOTICE '- 6 helper functions created for soft delete operations';
  RAISE NOTICE '- 6 views created (3 active, 3 recovery)';
  RAISE NOTICE '- 2 existing views updated to filter deleted records';
END $$;

-- Verify all tables have deleted_at column
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'deleted_at'
  AND table_name IN ('pilots', 'pilot_checks', 'leave_requests', 'check_types', 'an_users')
ORDER BY table_name;

-- =====================================================
-- ROLLBACK SCRIPT (If Needed)
-- =====================================================
-- To remove soft delete functionality:
--
-- -- Drop helper functions
-- DROP FUNCTION IF EXISTS soft_delete_pilot CASCADE;
-- DROP FUNCTION IF EXISTS restore_pilot CASCADE;
-- DROP FUNCTION IF EXISTS soft_delete_pilot_check CASCADE;
-- DROP FUNCTION IF EXISTS restore_pilot_check CASCADE;
-- DROP FUNCTION IF EXISTS soft_delete_leave_request CASCADE;
-- DROP FUNCTION IF EXISTS restore_leave_request CASCADE;
--
-- -- Drop views
-- DROP VIEW IF EXISTS active_pilots CASCADE;
-- DROP VIEW IF EXISTS active_pilot_checks CASCADE;
-- DROP VIEW IF EXISTS active_leave_requests CASCADE;
-- DROP VIEW IF EXISTS recently_deleted_pilots CASCADE;
-- DROP VIEW IF EXISTS recently_deleted_pilot_checks CASCADE;
-- DROP VIEW IF EXISTS recently_deleted_leave_requests CASCADE;
--
-- -- Drop indexes
-- DROP INDEX IF EXISTS idx_pilots_not_deleted CASCADE;
-- DROP INDEX IF EXISTS idx_pilot_checks_not_deleted CASCADE;
-- DROP INDEX IF EXISTS idx_leave_requests_not_deleted CASCADE;
-- DROP INDEX IF EXISTS idx_check_types_not_deleted CASCADE;
-- DROP INDEX IF EXISTS idx_an_users_not_deleted CASCADE;
-- DROP INDEX IF EXISTS idx_pilots_deleted_at CASCADE;
-- DROP INDEX IF EXISTS idx_pilot_checks_deleted_at CASCADE;
-- DROP INDEX IF EXISTS idx_leave_requests_deleted_at CASCADE;
--
-- -- Remove columns
-- ALTER TABLE pilots DROP COLUMN IF EXISTS deleted_at CASCADE;
-- ALTER TABLE pilot_checks DROP COLUMN IF EXISTS deleted_at CASCADE;
-- ALTER TABLE leave_requests DROP COLUMN IF EXISTS deleted_at CASCADE;
-- ALTER TABLE check_types DROP COLUMN IF EXISTS deleted_at CASCADE;
-- ALTER TABLE an_users DROP COLUMN IF EXISTS deleted_at CASCADE;
-- =====================================================

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary:
-- ✅ Added deleted_at columns to 5 critical tables
-- ✅ Created 8 partial indexes for optimal query performance
-- ✅ Implemented 6 helper functions for soft delete operations
-- ✅ Created 3 active record views for standard queries
-- ✅ Created 3 recovery views for deleted record management
-- ✅ Updated 2 existing views to filter deleted records
--
-- Usage Examples:
-- - Soft delete: SELECT soft_delete_pilot('uuid-here');
-- - Restore: SELECT restore_pilot('uuid-here');
-- - Query active: SELECT * FROM active_pilots;
-- - Query deleted: SELECT * FROM recently_deleted_pilots;
--
-- Next Steps:
-- - Run 004_audit_trail.sql for audit logging
-- - Update application service layer to use soft delete functions
-- - Implement UI for record recovery (admin only)
-- - Schedule cleanup job for deleted records older than 90 days
-- =====================================================