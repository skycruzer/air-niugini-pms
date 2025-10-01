-- =====================================================
-- MIGRATION 001: REMOVE LEGACY TABLES
-- =====================================================
-- This migration safely removes legacy an_* prefixed tables
-- after backing them up to the archive schema
--
-- PREREQUISITES:
-- 1. Run 000_backup_legacy_tables.sql FIRST
-- 2. Verify backup was successful
-- 3. Update all application code to use production tables
--
-- AFFECTED TABLES:
-- - an_pilots (5 records) -> Use: pilots (27 records)
-- - an_pilot_checks (18 records) -> Use: pilot_checks (556+ records)
-- - an_check_types (10 records) -> Use: check_types (34+ records)
-- - an_leave_requests (0 records) -> Use: leave_requests (11+ records)
--
-- Created: 2025-09-30
-- Purpose: Database cleanup and optimization - Phase 1.1
-- =====================================================

-- =====================================================
-- STEP 1: PRE-MIGRATION SAFETY CHECKS
-- =====================================================

-- Verify backups exist in archive schema
DO $$
DECLARE
  backup_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO backup_count
  FROM information_schema.tables
  WHERE table_schema = 'archive'
    AND table_name LIKE '%_backup_2025_09_30';

  IF backup_count < 4 THEN
    RAISE EXCEPTION 'ERROR: Backup tables not found in archive schema. Run 000_backup_legacy_tables.sql first!';
  END IF;

  RAISE NOTICE 'Pre-migration check passed: % backup tables found', backup_count;
END $$;

-- =====================================================
-- STEP 2: CHECK FOR ACTIVE REFERENCES
-- =====================================================

-- Log current record counts for verification
DO $$
BEGIN
  RAISE NOTICE 'Current legacy table record counts:';
  RAISE NOTICE '- an_pilots: % records', (SELECT COUNT(*) FROM an_pilots);
  RAISE NOTICE '- an_pilot_checks: % records', (SELECT COUNT(*) FROM an_pilot_checks);
  RAISE NOTICE '- an_check_types: % records', (SELECT COUNT(*) FROM an_check_types);
  RAISE NOTICE '- an_leave_requests: % records', (SELECT COUNT(*) FROM an_leave_requests);
END $$;

-- =====================================================
-- STEP 3: DROP LEGACY VIEWS (If Any Exist)
-- =====================================================

DROP VIEW IF EXISTS an_pilot_checks_overview CASCADE;
DROP VIEW IF EXISTS an_expiring_checks CASCADE;
DROP VIEW IF EXISTS an_fleet_compliance_summary CASCADE;

-- =====================================================
-- STEP 4: DROP LEGACY TABLES
-- =====================================================
-- Note: Using CASCADE to drop dependent objects
-- All production code has been updated to use non-prefixed tables

-- Drop an_leave_requests (no records, but has foreign keys)
DROP TABLE IF EXISTS public.an_leave_requests CASCADE;
COMMENT ON SCHEMA public IS 'Dropped an_leave_requests table (legacy development table)';

-- Drop an_pilot_checks (18 records backed up)
DROP TABLE IF EXISTS public.an_pilot_checks CASCADE;
COMMENT ON SCHEMA public IS 'Dropped an_pilot_checks table (legacy development table)';

-- Drop an_check_types (10 records backed up)
DROP TABLE IF EXISTS public.an_check_types CASCADE;
COMMENT ON SCHEMA public IS 'Dropped an_check_types table (legacy development table)';

-- Drop an_pilots (5 records backed up)
DROP TABLE IF EXISTS public.an_pilots CASCADE;
COMMENT ON SCHEMA public IS 'Dropped an_pilots table (legacy development table)';

-- =====================================================
-- STEP 5: CLEAN UP ORPHANED SEQUENCES
-- =====================================================

-- Drop any sequences that were associated with legacy tables
DROP SEQUENCE IF EXISTS an_pilots_id_seq CASCADE;
DROP SEQUENCE IF EXISTS an_pilot_checks_id_seq CASCADE;
DROP SEQUENCE IF EXISTS an_check_types_id_seq CASCADE;
DROP SEQUENCE IF EXISTS an_leave_requests_id_seq CASCADE;

-- =====================================================
-- STEP 6: POST-MIGRATION VERIFICATION
-- =====================================================

-- Verify legacy tables are removed
DO $$
DECLARE
  legacy_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO legacy_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name LIKE 'an_%'
    AND table_name NOT IN ('an_users'); -- Keep an_users as it's actively used

  IF legacy_count > 0 THEN
    RAISE WARNING 'Some an_* tables still exist: % tables found', legacy_count;
  ELSE
    RAISE NOTICE 'All legacy tables successfully removed!';
  END IF;
END $$;

-- Verify production tables are intact
DO $$
BEGIN
  RAISE NOTICE 'Production table verification:';
  RAISE NOTICE '- pilots: % records', (SELECT COUNT(*) FROM pilots);
  RAISE NOTICE '- pilot_checks: % records', (SELECT COUNT(*) FROM pilot_checks);
  RAISE NOTICE '- check_types: % records', (SELECT COUNT(*) FROM check_types);
  RAISE NOTICE '- leave_requests: % records', (SELECT COUNT(*) FROM leave_requests);
  RAISE NOTICE '- an_users: % records (kept for authentication)', (SELECT COUNT(*) FROM an_users);
END $$;

-- =====================================================
-- ROLLBACK SCRIPT (Emergency Only)
-- =====================================================
-- If you need to restore legacy tables from backup:
--
-- RESTORE LEGACY TABLES FROM BACKUP:
--
-- CREATE TABLE public.an_pilots AS
-- SELECT * FROM archive.an_pilots_backup_2025_09_30;
--
-- CREATE TABLE public.an_pilot_checks AS
-- SELECT * FROM archive.an_pilot_checks_backup_2025_09_30;
--
-- CREATE TABLE public.an_check_types AS
-- SELECT * FROM archive.an_check_types_backup_2025_09_30;
--
-- CREATE TABLE public.an_leave_requests AS
-- SELECT * FROM archive.an_leave_requests_backup_2025_09_30;
--
-- Then re-create foreign keys and constraints as needed
-- =====================================================

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary:
-- ✅ Removed 4 legacy tables (an_pilots, an_pilot_checks, an_check_types, an_leave_requests)
-- ✅ All data backed up to archive schema
-- ✅ Production tables remain intact (pilots, pilot_checks, check_types, leave_requests)
-- ✅ Application code updated to use production tables only
-- ✅ Database cleanup reduces maintenance overhead
--
-- Next Steps:
-- - Run 002_add_indexes.sql for performance optimization
-- - Monitor application logs for any legacy table references
-- - Keep backups in archive schema for 90 days minimum
-- =====================================================