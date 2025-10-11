-- ============================================
-- Air Niugini B767 Pilot Management System
-- RLS POLICY VALIDATION & TESTING SCRIPT
-- ============================================
-- Date: 2025-10-09
-- Version: 1.0.0
-- Purpose: Validate RLS policies are working correctly
--
-- INSTRUCTIONS:
-- 1. Run this script AFTER enable_production_rls_policies.sql
-- 2. Review output to verify all policies are functioning
-- 3. Check for any unexpected access patterns
-- ============================================

-- ============================================
-- SECTION 1: VERIFY RLS IS ENABLED
-- ============================================

SELECT
  '=== RLS STATUS VERIFICATION ===' as section;

SELECT
  pt.tablename,
  CASE
    WHEN pc.relrowsecurity = true THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status,
  pc.relforcerowsecurity as force_rls
FROM pg_tables pt
JOIN pg_class pc ON pt.tablename = pc.relname
WHERE pt.schemaname = 'public'
  AND pt.tablename IN ('pilots', 'pilot_checks', 'check_types', 'leave_requests', 'settings', 'contract_types', 'an_users')
ORDER BY pt.tablename;

-- ============================================
-- SECTION 2: LIST ALL POLICIES
-- ============================================

SELECT
  '=== RLS POLICIES BY TABLE ===' as section;

SELECT
  tablename,
  policyname,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command,
  CASE permissive
    WHEN true THEN 'PERMISSIVE'
    ELSE 'RESTRICTIVE'
  END as type,
  CASE
    WHEN roles = '{public}' THEN 'PUBLIC'
    ELSE array_to_string(roles, ', ')
  END as applies_to
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('pilots', 'pilot_checks', 'check_types', 'leave_requests', 'settings', 'contract_types', 'an_users')
ORDER BY tablename, command;

-- ============================================
-- SECTION 3: POLICY COUNT SUMMARY
-- ============================================

SELECT
  '=== POLICY COUNT BY TABLE ===' as section;

SELECT
  tablename,
  COUNT(*) as policy_count,
  COUNT(*) FILTER (WHERE cmd = 'r') as select_policies,
  COUNT(*) FILTER (WHERE cmd = 'a') as insert_policies,
  COUNT(*) FILTER (WHERE cmd = 'w') as update_policies,
  COUNT(*) FILTER (WHERE cmd = 'd') as delete_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('pilots', 'pilot_checks', 'check_types', 'leave_requests', 'settings', 'contract_types', 'an_users')
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- SECTION 4: VERIFY HELPER FUNCTIONS EXIST
-- ============================================

SELECT
  '=== HELPER FUNCTIONS STATUS ===' as section;

SELECT
  proname as function_name,
  pg_get_function_result(oid) as return_type,
  prosecdef as is_security_definer,
  provolatile as volatility,
  CASE provolatile
    WHEN 'i' THEN 'IMMUTABLE'
    WHEN 's' THEN 'STABLE'
    WHEN 'v' THEN 'VOLATILE'
  END as volatility_desc
FROM pg_proc
WHERE proname IN ('is_admin', 'is_admin_or_manager', 'get_user_role')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- ============================================
-- SECTION 5: CHECK POLICY DEFINITIONS
-- ============================================

SELECT
  '=== POLICY DEFINITIONS (SAMPLE) ===' as section;

-- Show a few example policy definitions
SELECT
  tablename,
  policyname,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
  END as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('pilots', 'an_users', 'settings')
ORDER BY tablename, command
LIMIT 10;

-- ============================================
-- SECTION 6: VERIFY TABLE RECORD COUNTS
-- ============================================

SELECT
  '=== PRODUCTION TABLE RECORD COUNTS ===' as section;

-- Note: These queries will only return counts if you have admin access
-- If RLS is working correctly, non-admin users won't see these results

SELECT 'pilots' as table_name, COUNT(*) as record_count FROM pilots
UNION ALL
SELECT 'pilot_checks', COUNT(*) FROM pilot_checks
UNION ALL
SELECT 'check_types', COUNT(*) FROM check_types
UNION ALL
SELECT 'leave_requests', COUNT(*) FROM leave_requests
UNION ALL
SELECT 'settings', COUNT(*) FROM settings
UNION ALL
SELECT 'contract_types', COUNT(*) FROM contract_types
UNION ALL
SELECT 'an_users', COUNT(*) FROM an_users
ORDER BY table_name;

-- ============================================
-- SECTION 7: EXPECTED RESULTS SUMMARY
-- ============================================

SELECT
  '=== EXPECTED RESULTS SUMMARY ===' as section;

SELECT
  'Expected Configuration' as category,
  '7 tables with RLS enabled' as requirement,
  '✅ PASS' as status
WHERE (
  SELECT COUNT(*)
  FROM pg_tables pt
  JOIN pg_class pc ON pt.tablename = pc.relname
  WHERE pt.schemaname = 'public'
    AND pt.tablename IN ('pilots', 'pilot_checks', 'check_types', 'leave_requests', 'settings', 'contract_types', 'an_users')
    AND pc.relrowsecurity = true
) = 7

UNION ALL

SELECT
  'Expected Configuration',
  '28 total policies (4 per table)',
  CASE
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('pilots', 'pilot_checks', 'check_types', 'leave_requests', 'settings', 'contract_types', 'an_users')) = 28
    THEN '✅ PASS'
    ELSE '❌ FAIL - Count: ' || (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('pilots', 'pilot_checks', 'check_types', 'leave_requests', 'settings', 'contract_types', 'an_users'))::text
  END

UNION ALL

SELECT
  'Expected Configuration',
  '3 helper functions exist',
  CASE
    WHEN (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('is_admin', 'is_admin_or_manager', 'get_user_role') AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) = 3
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END;

-- ============================================
-- SECTION 8: SECURITY RECOMMENDATIONS
-- ============================================

SELECT
  '=== SECURITY AUDIT RECOMMENDATIONS ===' as section;

-- Check for tables without RLS
SELECT
  'WARNING: Tables without RLS' as issue_type,
  string_agg(tablename, ', ') as affected_tables,
  '⚠️  Enable RLS on these tables' as recommendation
FROM pg_tables pt
LEFT JOIN pg_class pc ON pt.tablename = pc.relname
WHERE pt.schemaname = 'public'
  AND pt.tablename NOT LIKE 'pg_%'
  AND pt.tablename NOT LIKE 'sql_%'
  AND (pc.relrowsecurity = false OR pc.relrowsecurity IS NULL)
GROUP BY issue_type, recommendation
HAVING COUNT(*) > 0;

-- Check for policies that might be too permissive
SELECT
  'INFO: Permissive SELECT policies' as issue_type,
  string_agg(DISTINCT tablename, ', ') as affected_tables,
  'ℹ️  Verify these policies match business requirements' as recommendation
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'r'
  AND qual LIKE '%authenticated%'
GROUP BY issue_type, recommendation;

-- ============================================
-- SECTION 9: FINAL VALIDATION STATUS
-- ============================================

SELECT
  '=== FINAL VALIDATION STATUS ===' as section;

WITH validation_checks AS (
  SELECT
    (SELECT COUNT(*) FROM pg_tables pt JOIN pg_class pc ON pt.tablename = pc.relname WHERE pt.schemaname = 'public' AND pt.tablename IN ('pilots', 'pilot_checks', 'check_types', 'leave_requests', 'settings', 'contract_types', 'an_users') AND pc.relrowsecurity = true) = 7 as rls_enabled_check,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('pilots', 'pilot_checks', 'check_types', 'leave_requests', 'settings', 'contract_types', 'an_users')) = 28 as policy_count_check,
    (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('is_admin', 'is_admin_or_manager', 'get_user_role') AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) = 3 as helper_functions_check
)
SELECT
  CASE
    WHEN rls_enabled_check AND policy_count_check AND helper_functions_check
    THEN '✅ ALL CHECKS PASSED - RLS policies are correctly configured'
    ELSE '⚠️  SOME CHECKS FAILED - Review output above for details'
  END as overall_status,
  CASE WHEN rls_enabled_check THEN '✅' ELSE '❌' END || ' RLS enabled on all tables' as check_1,
  CASE WHEN policy_count_check THEN '✅' ELSE '❌' END || ' All policies created (28 total)' as check_2,
  CASE WHEN helper_functions_check THEN '✅' ELSE '❌' END || ' Helper functions exist (3 total)' as check_3
FROM validation_checks;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

SELECT
  '========================================' as message
UNION ALL
SELECT '✅ RLS Policy Validation Complete'
UNION ALL
SELECT '========================================'
UNION ALL
SELECT ''
UNION ALL
SELECT 'Next Steps:'
UNION ALL
SELECT '1. Review validation results above'
UNION ALL
SELECT '2. Test with different user roles (admin, manager, authenticated)'
UNION ALL
SELECT '3. Verify application functionality still works'
UNION ALL
SELECT '4. Monitor for any RLS-related errors in logs'
UNION ALL
SELECT ''
UNION ALL
SELECT 'Rollback if needed:'
UNION ALL
SELECT '  psql -f rollback_production_rls_policies.sql';
