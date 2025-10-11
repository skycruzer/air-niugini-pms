-- ============================================
-- Air Niugini B767 Pilot Management System
-- ROLLBACK: Row Level Security (RLS) Policies
-- ============================================
-- Date: 2025-10-09
-- Version: 1.0.0
-- Purpose: Rollback RLS policies if issues occur
--
-- WARNING: This script DISABLES Row Level Security
-- Only use if RLS policies cause production issues
-- Data will be accessible without authentication checks
-- ============================================

BEGIN;

-- ============================================
-- SECTION 1: DISABLE RLS ON ALL TABLES
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  DISABLING ROW LEVEL SECURITY';
  RAISE NOTICE '⚠️  WARNING: Tables will be accessible without RLS protection';
  RAISE NOTICE '';
END $$;

-- Disable RLS on production tables
ALTER TABLE pilots DISABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_checks DISABLE ROW LEVEL SECURITY;
ALTER TABLE check_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE an_users DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE '✅ Row Level Security disabled on all 7 production tables';
END $$;

-- ============================================
-- SECTION 2: DROP ALL RLS POLICIES
-- ============================================

-- Drop policies for an_users
DROP POLICY IF EXISTS "an_users_select_own_profile" ON an_users;
DROP POLICY IF EXISTS "an_users_insert_admin_only" ON an_users;
DROP POLICY IF EXISTS "an_users_update_admin_only" ON an_users;
DROP POLICY IF EXISTS "an_users_delete_admin_only" ON an_users;

-- Drop policies for pilots
DROP POLICY IF EXISTS "pilots_select_all_authenticated" ON pilots;
DROP POLICY IF EXISTS "pilots_insert_admin_only" ON pilots;
DROP POLICY IF EXISTS "pilots_update_admin_or_manager" ON pilots;
DROP POLICY IF EXISTS "pilots_delete_admin_only" ON pilots;

-- Drop policies for pilot_checks
DROP POLICY IF EXISTS "pilot_checks_select_all_authenticated" ON pilot_checks;
DROP POLICY IF EXISTS "pilot_checks_insert_admin_or_manager" ON pilot_checks;
DROP POLICY IF EXISTS "pilot_checks_update_admin_or_manager" ON pilot_checks;
DROP POLICY IF EXISTS "pilot_checks_delete_admin_or_manager" ON pilot_checks;

-- Drop policies for check_types
DROP POLICY IF EXISTS "check_types_select_all_authenticated" ON check_types;
DROP POLICY IF EXISTS "check_types_insert_admin_only" ON check_types;
DROP POLICY IF EXISTS "check_types_update_admin_only" ON check_types;
DROP POLICY IF EXISTS "check_types_delete_admin_only" ON check_types;

-- Drop policies for leave_requests
DROP POLICY IF EXISTS "leave_requests_select_all_authenticated" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_insert_all_authenticated" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_update_admin_or_manager" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_delete_admin_only" ON leave_requests;

-- Drop policies for settings
DROP POLICY IF EXISTS "settings_select_admin_only" ON settings;
DROP POLICY IF EXISTS "settings_insert_admin_only" ON settings;
DROP POLICY IF EXISTS "settings_update_admin_only" ON settings;
DROP POLICY IF EXISTS "settings_delete_admin_only" ON settings;

-- Drop policies for contract_types
DROP POLICY IF EXISTS "contract_types_select_all_authenticated" ON contract_types;
DROP POLICY IF EXISTS "contract_types_insert_admin_only" ON contract_types;
DROP POLICY IF EXISTS "contract_types_update_admin_only" ON contract_types;
DROP POLICY IF EXISTS "contract_types_delete_admin_only" ON contract_types;

DO $$
BEGIN
  RAISE NOTICE '✅ All RLS policies dropped';
END $$;

-- ============================================
-- SECTION 3: DROP HELPER FUNCTIONS (OPTIONAL)
-- ============================================
-- Uncomment if you want to completely remove helper functions

-- DROP FUNCTION IF EXISTS is_admin();
-- DROP FUNCTION IF EXISTS is_admin_or_manager();
-- DROP FUNCTION IF EXISTS get_user_role();

DO $$
BEGIN
  RAISE NOTICE 'ℹ️  Helper functions retained (is_admin, is_admin_or_manager, get_user_role)';
  RAISE NOTICE 'ℹ️  Uncomment DROP FUNCTION statements to remove them';
END $$;

-- ============================================
-- SECTION 4: VERIFICATION
-- ============================================

-- Verify RLS is disabled
DO $$
DECLARE
  table_name TEXT;
  tables_with_rls INT := 0;
  tables_without_rls INT := 0;
BEGIN
  FOR table_name IN
    SELECT unnest(ARRAY['pilots', 'pilot_checks', 'check_types', 'leave_requests', 'settings', 'contract_types', 'an_users'])
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables pt
      JOIN pg_class pc ON pt.tablename = pc.relname
      WHERE pt.schemaname = 'public'
      AND pt.tablename = table_name
      AND pc.relrowsecurity = true
    ) THEN
      tables_with_rls := tables_with_rls + 1;
      RAISE WARNING '⚠️  RLS still enabled on: %', table_name;
    ELSE
      tables_without_rls := tables_without_rls + 1;
      RAISE NOTICE '✅ RLS disabled on: %', table_name;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Rollback Verification:';
  RAISE NOTICE '  ✅ Tables with RLS disabled: %', tables_without_rls;
  RAISE NOTICE '  ⚠️  Tables with RLS still enabled: %', tables_with_rls;
  RAISE NOTICE '========================================';
END $$;

-- Check for remaining policies
SELECT
  COUNT(*) as remaining_policies,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ All policies removed successfully'
    ELSE '⚠️  Some policies still exist'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('pilots', 'pilot_checks', 'check_types', 'leave_requests', 'settings', 'contract_types', 'an_users');

COMMIT;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

SELECT
  '✅ Row Level Security Rollback Complete!' as status,
  'All RLS policies have been removed' as details,
  '⚠️  WARNING: Tables are now accessible without RLS protection' as warning,
  'To re-enable RLS, run: enable_production_rls_policies.sql' as next_steps;
