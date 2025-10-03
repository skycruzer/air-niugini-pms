-- ============================================
-- Air Niugini PMS - Legacy Table Cleanup
-- ============================================
-- Removes unused an_* prefixed legacy tables
-- Keeps: an_users (active auth table)
-- Removes: an_pilots, an_check_types, an_pilot_checks, an_leave_requests
-- ============================================

-- Step 1: Backup legacy data to JSON (optional - can be saved manually)
-- Uncomment to save before deletion:
-- COPY (SELECT json_agg(row_to_json(t)) FROM an_pilots t) TO '/tmp/an_pilots_backup.json';
-- COPY (SELECT json_agg(row_to_json(t)) FROM an_check_types t) TO '/tmp/an_check_types_backup.json';
-- COPY (SELECT json_agg(row_to_json(t)) FROM an_pilot_checks t) TO '/tmp/an_pilot_checks_backup.json';

-- Step 2: Drop legacy tables (CASCADE removes foreign keys)
-- Order matters: drop dependent tables first

BEGIN;

-- Drop an_leave_requests (empty table, depends on an_pilots and an_users)
DROP TABLE IF EXISTS an_leave_requests CASCADE;
RAISE NOTICE 'Dropped table: an_leave_requests';

-- Drop an_pilot_checks (depends on an_pilots and an_check_types)
DROP TABLE IF EXISTS an_pilot_checks CASCADE;
RAISE NOTICE 'Dropped table: an_pilot_checks';

-- Drop an_pilots (no dependencies remaining)
DROP TABLE IF EXISTS an_pilots CASCADE;
RAISE NOTICE 'Dropped table: an_pilots';

-- Drop an_check_types (no dependencies remaining)
DROP TABLE IF EXISTS an_check_types CASCADE;
RAISE NOTICE 'Dropped table: an_check_types';

COMMIT;

-- Step 3: Verify remaining tables
SELECT
  schemaname,
  tablename,
  CASE
    WHEN tablename LIKE 'an_%' THEN '⚠️ Legacy (should be removed)'
    ELSE '✅ Production'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY status DESC, tablename;

-- Final confirmation
SELECT
  'Cleanup complete! Removed 4 legacy tables: an_pilots, an_check_types, an_pilot_checks, an_leave_requests' as message,
  count(*) as remaining_tables
FROM pg_tables
WHERE schemaname = 'public';
