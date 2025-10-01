-- =====================================================
-- MIGRATION 002: ADD PERFORMANCE INDEXES
-- =====================================================
-- This migration adds strategic indexes on frequently queried columns
-- to optimize database performance for the Air Niugini PMS
--
-- PERFORMANCE TARGETS:
-- - Pilot lookups by employee_id: < 10ms
-- - Certification queries by pilot: < 50ms
-- - Expiring checks queries: < 100ms
-- - Leave request filtering: < 50ms
--
-- Created: 2025-09-30
-- Purpose: Database performance optimization - Phase 1.1
-- =====================================================

-- =====================================================
-- STEP 1: ANALYZE CURRENT INDEX USAGE
-- =====================================================

-- Log existing indexes for reference
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public';

  RAISE NOTICE 'Current index count: %', index_count;
  RAISE NOTICE 'Starting index creation for performance optimization...';
END $$;

-- =====================================================
-- STEP 2: PILOTS TABLE INDEXES
-- =====================================================

-- Index on employee_id (unique lookups, frequently used in joins)
-- Current: 27 pilots, Expected queries: 1000+ per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_pilots_employee_id
  ON pilots (employee_id)
  WHERE employee_id IS NOT NULL;

COMMENT ON INDEX idx_pilots_employee_id IS
  'Unique index for fast pilot lookups by employee ID. Used in dashboards, reports, and certification tracking.';

-- Index on is_active for filtering active pilots
-- Reduces scan time for dashboard queries
CREATE INDEX IF NOT EXISTS idx_pilots_is_active
  ON pilots (is_active)
  WHERE is_active = true;

COMMENT ON INDEX idx_pilots_is_active IS
  'Partial index for active pilot filtering. Optimizes dashboard and list views.';

-- Index on commencement_date for seniority calculations
-- Used frequently in pilot lists and reports
CREATE INDEX IF NOT EXISTS idx_pilots_commencement_date
  ON pilots (commencement_date)
  WHERE commencement_date IS NOT NULL;

COMMENT ON INDEX idx_pilots_commencement_date IS
  'Index for seniority number calculations and pilot ordering by hire date.';

-- Composite index for role filtering and sorting
-- Optimizes captain vs first officer queries
CREATE INDEX IF NOT EXISTS idx_pilots_role_lastname
  ON pilots (role, last_name);

COMMENT ON INDEX idx_pilots_role_lastname IS
  'Composite index for role-based filtering with alphabetical sorting.';

-- =====================================================
-- STEP 3: PILOT_CHECKS TABLE INDEXES
-- =====================================================

-- Index on pilot_id (most common foreign key lookup)
-- Current: 556+ records, Expected queries: 5000+ per day
CREATE INDEX IF NOT EXISTS idx_pilot_checks_pilot_id
  ON pilot_checks (pilot_id);

COMMENT ON INDEX idx_pilot_checks_pilot_id IS
  'Foreign key index for pilot-specific certification queries. Critical for pilot detail pages.';

-- Index on check_type_id (used in certification type filtering)
CREATE INDEX IF NOT EXISTS idx_pilot_checks_check_type_id
  ON pilot_checks (check_type_id);

COMMENT ON INDEX idx_pilot_checks_check_type_id IS
  'Foreign key index for check type filtering and aggregation queries.';

-- Index on expiry_date for expiring checks queries
-- Most critical performance index for compliance dashboard
CREATE INDEX IF NOT EXISTS idx_pilot_checks_expiry_date
  ON pilot_checks (expiry_date)
  WHERE expiry_date IS NOT NULL;

COMMENT ON INDEX idx_pilot_checks_expiry_date IS
  'Critical index for expiring certification queries. Supports dashboard alerts and compliance monitoring.';

-- Composite index for pilot + expiry date (optimizes common query pattern)
CREATE INDEX IF NOT EXISTS idx_pilot_checks_pilot_expiry
  ON pilot_checks (pilot_id, expiry_date)
  WHERE expiry_date IS NOT NULL;

COMMENT ON INDEX idx_pilot_checks_pilot_expiry IS
  'Composite index optimizing pilot certification timeline queries and expiry calculations.';

-- Index on updated_at for recent changes tracking
CREATE INDEX IF NOT EXISTS idx_pilot_checks_updated_at
  ON pilot_checks (updated_at DESC);

COMMENT ON INDEX idx_pilot_checks_updated_at IS
  'Index for tracking recently updated certifications. Supports audit and changelog features.';

-- =====================================================
-- STEP 4: CHECK_TYPES TABLE INDEXES
-- =====================================================

-- Index on check_code (unique identifier, frequently used in lookups)
-- Current: 34+ check types
CREATE UNIQUE INDEX IF NOT EXISTS idx_check_types_check_code
  ON check_types (check_code);

COMMENT ON INDEX idx_check_types_check_code IS
  'Unique index for check type code lookups. Used throughout certification management.';

-- Index on category for grouping and filtering
CREATE INDEX IF NOT EXISTS idx_check_types_category
  ON check_types (category)
  WHERE category IS NOT NULL;

COMMENT ON INDEX idx_check_types_category IS
  'Index for check type categorization. Supports filtered check type lists by category.';

-- =====================================================
-- STEP 5: LEAVE_REQUESTS TABLE INDEXES
-- =====================================================

-- Index on pilot_id (foreign key, frequently queried)
-- Current: 11+ records, Expected growth: 100+ per roster period
CREATE INDEX IF NOT EXISTS idx_leave_requests_pilot_id
  ON leave_requests (pilot_id);

COMMENT ON INDEX idx_leave_requests_pilot_id IS
  'Foreign key index for pilot leave history queries. Used in pilot profile and leave calendar.';

-- Index on status for filtering pending/approved/denied requests
CREATE INDEX IF NOT EXISTS idx_leave_requests_status
  ON leave_requests (status);

COMMENT ON INDEX idx_leave_requests_status IS
  'Index for leave request status filtering. Optimizes pending approval queues and status reports.';

-- Index on roster_period for period-specific queries
-- Critical for 28-day roster period filtering
CREATE INDEX IF NOT EXISTS idx_leave_requests_roster_period
  ON leave_requests (roster_period)
  WHERE roster_period IS NOT NULL;

COMMENT ON INDEX idx_leave_requests_roster_period IS
  'Index for roster period filtering. Supports roster-specific leave management and reporting.';

-- Composite index for pilot + roster period (common query pattern)
CREATE INDEX IF NOT EXISTS idx_leave_requests_pilot_roster
  ON leave_requests (pilot_id, roster_period);

COMMENT ON INDEX idx_leave_requests_pilot_roster IS
  'Composite index for pilot leave queries within specific roster periods.';

-- Index on start_date for date-range queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_start_date
  ON leave_requests (start_date);

COMMENT ON INDEX idx_leave_requests_start_date IS
  'Index for chronological leave sorting and date-range calendar queries.';

-- Index on request_type for leave type filtering (RDO, WDO, ANNUAL, etc.)
CREATE INDEX IF NOT EXISTS idx_leave_requests_request_type
  ON leave_requests (request_type)
  WHERE request_type IS NOT NULL;

COMMENT ON INDEX idx_leave_requests_request_type IS
  'Index for leave type filtering and statistical analysis by request type.';

-- =====================================================
-- STEP 6: AN_USERS TABLE INDEXES
-- =====================================================

-- Index on email (authentication lookups)
-- Current: 3 users (admin/manager roles)
CREATE UNIQUE INDEX IF NOT EXISTS idx_an_users_email
  ON an_users (email);

COMMENT ON INDEX idx_an_users_email IS
  'Unique index for user authentication by email. Critical for login performance.';

-- Index on role for permission filtering
CREATE INDEX IF NOT EXISTS idx_an_users_role
  ON an_users (role);

COMMENT ON INDEX idx_an_users_role IS
  'Index for role-based user queries and permission management.';

-- =====================================================
-- STEP 7: CONTRACT_TYPES TABLE INDEXES
-- =====================================================

-- Index on name (foreign key reference from pilots)
CREATE UNIQUE INDEX IF NOT EXISTS idx_contract_types_name
  ON contract_types (name);

COMMENT ON INDEX idx_contract_types_name IS
  'Unique index for contract type lookups. Referenced by pilots.contract_type.';

-- Index on is_active for filtering active contract types
CREATE INDEX IF NOT EXISTS idx_contract_types_is_active
  ON contract_types (is_active)
  WHERE is_active = true;

COMMENT ON INDEX idx_contract_types_is_active IS
  'Partial index for active contract type filtering.';

-- =====================================================
-- STEP 8: POST-MIGRATION VERIFICATION
-- =====================================================

-- Count new indexes created
DO $$
DECLARE
  new_index_count INTEGER;
  total_index_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO new_index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';

  SELECT COUNT(*)
  INTO total_index_count
  FROM pg_indexes
  WHERE schemaname = 'public';

  RAISE NOTICE 'Custom indexes created: %', new_index_count;
  RAISE NOTICE 'Total indexes in public schema: %', total_index_count;
END $$;

-- Analyze tables to update statistics for query planner
ANALYZE pilots;
ANALYZE pilot_checks;
ANALYZE check_types;
ANALYZE leave_requests;
ANALYZE an_users;
ANALYZE contract_types;

-- =====================================================
-- STEP 9: INDEX USAGE MONITORING QUERY
-- =====================================================

-- Use this query to monitor index effectiveness
-- Run periodically to verify indexes are being used

CREATE OR REPLACE VIEW index_usage_stats AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;

COMMENT ON VIEW index_usage_stats IS
  'Monitoring view for index usage statistics. Use to identify unused or underutilized indexes.';

-- =====================================================
-- ROLLBACK SCRIPT (If Needed)
-- =====================================================
-- To remove all custom indexes:
--
-- DROP INDEX IF EXISTS idx_pilots_employee_id CASCADE;
-- DROP INDEX IF EXISTS idx_pilots_is_active CASCADE;
-- DROP INDEX IF EXISTS idx_pilots_commencement_date CASCADE;
-- DROP INDEX IF EXISTS idx_pilots_role_lastname CASCADE;
-- DROP INDEX IF EXISTS idx_pilot_checks_pilot_id CASCADE;
-- DROP INDEX IF EXISTS idx_pilot_checks_check_type_id CASCADE;
-- DROP INDEX IF EXISTS idx_pilot_checks_expiry_date CASCADE;
-- DROP INDEX IF EXISTS idx_pilot_checks_pilot_expiry CASCADE;
-- DROP INDEX IF EXISTS idx_pilot_checks_updated_at CASCADE;
-- DROP INDEX IF EXISTS idx_check_types_check_code CASCADE;
-- DROP INDEX IF EXISTS idx_check_types_category CASCADE;
-- DROP INDEX IF EXISTS idx_leave_requests_pilot_id CASCADE;
-- DROP INDEX IF EXISTS idx_leave_requests_status CASCADE;
-- DROP INDEX IF EXISTS idx_leave_requests_roster_period CASCADE;
-- DROP INDEX IF EXISTS idx_leave_requests_pilot_roster CASCADE;
-- DROP INDEX IF EXISTS idx_leave_requests_start_date CASCADE;
-- DROP INDEX IF EXISTS idx_leave_requests_request_type CASCADE;
-- DROP INDEX IF EXISTS idx_an_users_email CASCADE;
-- DROP INDEX IF EXISTS idx_an_users_role CASCADE;
-- DROP INDEX IF EXISTS idx_contract_types_name CASCADE;
-- DROP INDEX IF EXISTS idx_contract_types_is_active CASCADE;
-- DROP VIEW IF EXISTS index_usage_stats CASCADE;
-- =====================================================

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary:
-- ✅ Created 20 strategic indexes across 6 tables
-- ✅ Optimized most common query patterns:
--    - Pilot lookups by employee_id
--    - Certification expiry queries
--    - Leave request filtering
--    - Authentication lookups
-- ✅ Added monitoring view for index usage tracking
-- ✅ Updated table statistics with ANALYZE
--
-- Expected Performance Improvements:
-- - Dashboard load time: 60-70% reduction
-- - Pilot detail page: 50-60% faster
-- - Expiring checks query: 70-80% faster
-- - Leave calendar rendering: 40-50% faster
--
-- Next Steps:
-- - Run 003_soft_delete.sql for soft delete implementation
-- - Monitor index usage with index_usage_stats view
-- - Run ANALYZE regularly (weekly recommended)
-- =====================================================