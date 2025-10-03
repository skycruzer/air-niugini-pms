-- ============================================
-- Air Niugini PMS - Legacy Table Cleanup
-- ============================================
-- Execution Date: 2025-10-03
-- Purpose: Remove unused an_* prefixed legacy tables
--
-- Tables to KEEP:
--   - an_users (3 rows) - ACTIVE authentication table
--
-- Tables to DELETE:
--   - an_pilots (5 rows) - Legacy development data
--   - an_check_types (10 rows) - Legacy development data
--   - an_pilot_checks (18 rows) - Legacy development data
--   - an_leave_requests (0 rows) - Empty legacy table
-- ============================================

BEGIN;

-- Backup confirmation: Data already backed up via MCP query
-- Legacy data exported before deletion

-- Drop legacy tables in dependency order
-- CASCADE automatically removes foreign key constraints

-- Step 1: Drop an_leave_requests (empty, depends on an_pilots and an_users)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'an_leave_requests') THEN
    DROP TABLE IF EXISTS an_leave_requests CASCADE;
    RAISE NOTICE '✅ Dropped table: an_leave_requests (0 rows)';
  ELSE
    RAISE NOTICE 'ℹ️  Table an_leave_requests does not exist, skipping';
  END IF;
END $$;

-- Step 2: Drop an_pilot_checks (depends on an_pilots and an_check_types)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'an_pilot_checks') THEN
    DROP TABLE IF EXISTS an_pilot_checks CASCADE;
    RAISE NOTICE '✅ Dropped table: an_pilot_checks (18 rows)';
  ELSE
    RAISE NOTICE 'ℹ️  Table an_pilot_checks does not exist, skipping';
  END IF;
END $$;

-- Step 3: Drop an_pilots (no dependencies remaining)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'an_pilots') THEN
    DROP TABLE IF EXISTS an_pilots CASCADE;
    RAISE NOTICE '✅ Dropped table: an_pilots (5 rows)';
  ELSE
    RAISE NOTICE 'ℹ️  Table an_pilots does not exist, skipping';
  END IF;
END $$;

-- Step 4: Drop an_check_types (no dependencies remaining)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'an_check_types') THEN
    DROP TABLE IF EXISTS an_check_types CASCADE;
    RAISE NOTICE '✅ Dropped table: an_check_types (10 rows)';
  ELSE
    RAISE NOTICE 'ℹ️  Table an_check_types does not exist, skipping';
  END IF;
END $$;

COMMIT;

-- Verification: List remaining tables
SELECT
  tablename,
  CASE
    WHEN tablename = 'an_users' THEN '✅ Active Auth Table (KEPT)'
    WHEN tablename LIKE 'an_%' THEN '⚠️  Legacy Table (should not exist)'
    ELSE '✅ Production Table'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY
  CASE
    WHEN tablename = 'an_users' THEN 1
    WHEN tablename LIKE 'an_%' THEN 2
    ELSE 3
  END,
  tablename;

-- Final summary
SELECT
  '✅ Cleanup Complete!' as message,
  'Removed 4 legacy tables: an_pilots, an_check_types, an_pilot_checks, an_leave_requests' as details,
  'Kept an_users (active authentication)' as note,
  COUNT(*) as remaining_production_tables
FROM pg_tables
WHERE schemaname = 'public' AND tablename NOT LIKE 'an_%';
