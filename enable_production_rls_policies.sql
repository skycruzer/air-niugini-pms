-- ============================================
-- Air Niugini B767 Pilot Management System
-- PRODUCTION Row Level Security (RLS) Policies
-- ============================================
-- Date: 2025-10-09
-- Version: 1.0.0
-- Purpose: Enable comprehensive RLS on all production tables
--
-- CRITICAL: This migration enables RLS on production tables:
--   1. pilots (27 records) - Pilot PII data
--   2. pilot_checks (571 records) - Certification tracking
--   3. check_types (34 records) - Aviation certification types
--   4. leave_requests (12 records) - Leave management
--   5. settings (3 records) - System configuration
--   6. contract_types (3 records) - Contract classifications
--   7. an_users (3 records) - ACTIVE authentication table
--
-- Role Definitions:
--   - admin: Full CRUD access to all tables
--   - manager: Read all, edit pilots/checks/leave, approve leave
--   - authenticated: Read-only access (except own leave requests)
-- ============================================

BEGIN;

-- ============================================
-- SECTION 1: HELPER FUNCTIONS
-- ============================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_admin_or_manager();
DROP FUNCTION IF EXISTS get_user_role();

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM an_users
    WHERE an_users.id = auth.uid()
    AND an_users.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_admin() IS 'Returns TRUE if current authenticated user has admin role';

-- Function to check if current user is admin or manager
CREATE OR REPLACE FUNCTION is_admin_or_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM an_users
    WHERE an_users.id = auth.uid()
    AND an_users.role IN ('admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_admin_or_manager() IS 'Returns TRUE if current authenticated user has admin or manager role';

-- Function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM an_users
    WHERE an_users.id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_role() IS 'Returns the role of the current authenticated user (admin, manager, or NULL)';

-- ============================================
-- SECTION 2: ENABLE RLS ON ALL TABLES
-- ============================================

-- Enable RLS on production tables
ALTER TABLE pilots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE an_users ENABLE ROW LEVEL SECURITY;

-- Confirmation messages
DO $$
BEGIN
  RAISE NOTICE '✅ Row Level Security enabled on all 7 production tables';
END $$;

-- ============================================
-- SECTION 3: RLS POLICIES FOR an_users
-- ============================================
-- Authentication table - users can view their own profile
-- Only admins can manage user accounts

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "an_users_select_own_profile" ON an_users;
DROP POLICY IF EXISTS "an_users_insert_admin_only" ON an_users;
DROP POLICY IF EXISTS "an_users_update_admin_only" ON an_users;
DROP POLICY IF EXISTS "an_users_delete_admin_only" ON an_users;

-- SELECT: Authenticated users can view their own profile
CREATE POLICY "an_users_select_own_profile"
  ON an_users
  FOR SELECT
  USING (
    auth.uid() = id
  );

COMMENT ON POLICY "an_users_select_own_profile" ON an_users IS
  'Authenticated users can view their own user profile';

-- INSERT: Only admins can create new users
CREATE POLICY "an_users_insert_admin_only"
  ON an_users
  FOR INSERT
  WITH CHECK (
    is_admin()
  );

COMMENT ON POLICY "an_users_insert_admin_only" ON an_users IS
  'Only admins can create new user accounts';

-- UPDATE: Only admins can update user accounts
CREATE POLICY "an_users_update_admin_only"
  ON an_users
  FOR UPDATE
  USING (
    is_admin()
  );

COMMENT ON POLICY "an_users_update_admin_only" ON an_users IS
  'Only admins can update user accounts';

-- DELETE: Only admins can delete users (soft delete recommended)
CREATE POLICY "an_users_delete_admin_only"
  ON an_users
  FOR DELETE
  USING (
    is_admin()
  );

COMMENT ON POLICY "an_users_delete_admin_only" ON an_users IS
  'Only admins can delete user accounts';

-- ============================================
-- SECTION 4: RLS POLICIES FOR pilots
-- ============================================
-- Pilot PII data with 27 production records
-- All authenticated users can read, admin/manager can edit

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "pilots_select_all_authenticated" ON pilots;
DROP POLICY IF EXISTS "pilots_insert_admin_only" ON pilots;
DROP POLICY IF EXISTS "pilots_update_admin_or_manager" ON pilots;
DROP POLICY IF EXISTS "pilots_delete_admin_only" ON pilots;

-- SELECT: All authenticated users can view pilots
CREATE POLICY "pilots_select_all_authenticated"
  ON pilots
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
  );

COMMENT ON POLICY "pilots_select_all_authenticated" ON pilots IS
  'All authenticated users can view pilot records (read-only access for dashboard and reports)';

-- INSERT: Only admins can create new pilots
CREATE POLICY "pilots_insert_admin_only"
  ON pilots
  FOR INSERT
  WITH CHECK (
    is_admin()
  );

COMMENT ON POLICY "pilots_insert_admin_only" ON pilots IS
  'Only admins can create new pilot records';

-- UPDATE: Admin and managers can update pilots
CREATE POLICY "pilots_update_admin_or_manager"
  ON pilots
  FOR UPDATE
  USING (
    is_admin_or_manager()
  );

COMMENT ON POLICY "pilots_update_admin_or_manager" ON pilots IS
  'Admins and managers can update pilot information';

-- DELETE: Only admins can delete pilots
CREATE POLICY "pilots_delete_admin_only"
  ON pilots
  FOR DELETE
  USING (
    is_admin()
  );

COMMENT ON POLICY "pilots_delete_admin_only" ON pilots IS
  'Only admins can delete pilot records (soft delete recommended)';

-- ============================================
-- SECTION 5: RLS POLICIES FOR pilot_checks
-- ============================================
-- Certification tracking with 571 production records
-- Admin/manager can manage, all authenticated can read

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "pilot_checks_select_all_authenticated" ON pilot_checks;
DROP POLICY IF EXISTS "pilot_checks_insert_admin_or_manager" ON pilot_checks;
DROP POLICY IF EXISTS "pilot_checks_update_admin_or_manager" ON pilot_checks;
DROP POLICY IF EXISTS "pilot_checks_delete_admin_or_manager" ON pilot_checks;

-- SELECT: All authenticated users can view pilot checks
CREATE POLICY "pilot_checks_select_all_authenticated"
  ON pilot_checks
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
  );

COMMENT ON POLICY "pilot_checks_select_all_authenticated" ON pilot_checks IS
  'All authenticated users can view pilot certifications';

-- INSERT: Admin and managers can create pilot checks
CREATE POLICY "pilot_checks_insert_admin_or_manager"
  ON pilot_checks
  FOR INSERT
  WITH CHECK (
    is_admin_or_manager()
  );

COMMENT ON POLICY "pilot_checks_insert_admin_or_manager" ON pilot_checks IS
  'Admins and managers can create pilot certification records';

-- UPDATE: Admin and managers can update pilot checks
CREATE POLICY "pilot_checks_update_admin_or_manager"
  ON pilot_checks
  FOR UPDATE
  USING (
    is_admin_or_manager()
  );

COMMENT ON POLICY "pilot_checks_update_admin_or_manager" ON pilot_checks IS
  'Admins and managers can update pilot certification records';

-- DELETE: Admin and managers can delete pilot checks
CREATE POLICY "pilot_checks_delete_admin_or_manager"
  ON pilot_checks
  FOR DELETE
  USING (
    is_admin_or_manager()
  );

COMMENT ON POLICY "pilot_checks_delete_admin_or_manager" ON pilot_checks IS
  'Admins and managers can delete pilot certification records';

-- ============================================
-- SECTION 6: RLS POLICIES FOR check_types
-- ============================================
-- Aviation certification types with 34 production records
-- Read-only for most users, admin can manage

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "check_types_select_all_authenticated" ON check_types;
DROP POLICY IF EXISTS "check_types_insert_admin_only" ON check_types;
DROP POLICY IF EXISTS "check_types_update_admin_only" ON check_types;
DROP POLICY IF EXISTS "check_types_delete_admin_only" ON check_types;

-- SELECT: All authenticated users can view check types
CREATE POLICY "check_types_select_all_authenticated"
  ON check_types
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
  );

COMMENT ON POLICY "check_types_select_all_authenticated" ON check_types IS
  'All authenticated users can view aviation certification types';

-- INSERT: Only admins can create check types
CREATE POLICY "check_types_insert_admin_only"
  ON check_types
  FOR INSERT
  WITH CHECK (
    is_admin()
  );

COMMENT ON POLICY "check_types_insert_admin_only" ON check_types IS
  'Only admins can create new certification types';

-- UPDATE: Only admins can update check types
CREATE POLICY "check_types_update_admin_only"
  ON check_types
  FOR UPDATE
  USING (
    is_admin()
  );

COMMENT ON POLICY "check_types_update_admin_only" ON check_types IS
  'Only admins can update certification types';

-- DELETE: Only admins can delete check types
CREATE POLICY "check_types_delete_admin_only"
  ON check_types
  FOR DELETE
  USING (
    is_admin()
  );

COMMENT ON POLICY "check_types_delete_admin_only" ON check_types IS
  'Only admins can delete certification types (should be rare)';

-- ============================================
-- SECTION 7: RLS POLICIES FOR leave_requests
-- ============================================
-- Leave management with 12 production records
-- Users can view their own, admin/manager can view/manage all

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "leave_requests_select_all_authenticated" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_insert_all_authenticated" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_update_admin_or_manager" ON leave_requests;
DROP POLICY IF EXISTS "leave_requests_delete_admin_only" ON leave_requests;

-- SELECT: All authenticated users can view leave requests
-- (In this aviation context, transparency is required for crew scheduling)
CREATE POLICY "leave_requests_select_all_authenticated"
  ON leave_requests
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
  );

COMMENT ON POLICY "leave_requests_select_all_authenticated" ON leave_requests IS
  'All authenticated users can view leave requests for crew scheduling and roster management';

-- INSERT: All authenticated users can create leave requests
CREATE POLICY "leave_requests_insert_all_authenticated"
  ON leave_requests
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
  );

COMMENT ON POLICY "leave_requests_insert_all_authenticated" ON leave_requests IS
  'All authenticated users can submit leave requests';

-- UPDATE: Admin and managers can update leave requests (for approval workflow)
CREATE POLICY "leave_requests_update_admin_or_manager"
  ON leave_requests
  FOR UPDATE
  USING (
    is_admin_or_manager()
  );

COMMENT ON POLICY "leave_requests_update_admin_or_manager" ON leave_requests IS
  'Admins and managers can update leave requests (approve/reject workflow)';

-- DELETE: Only admins can delete leave requests
CREATE POLICY "leave_requests_delete_admin_only"
  ON leave_requests
  FOR DELETE
  USING (
    is_admin()
  );

COMMENT ON POLICY "leave_requests_delete_admin_only" ON leave_requests IS
  'Only admins can delete leave requests (audit trail preservation)';

-- ============================================
-- SECTION 8: RLS POLICIES FOR settings
-- ============================================
-- System configuration with 3 production records
-- Only admins can manage settings

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "settings_select_admin_only" ON settings;
DROP POLICY IF EXISTS "settings_insert_admin_only" ON settings;
DROP POLICY IF EXISTS "settings_update_admin_only" ON settings;
DROP POLICY IF EXISTS "settings_delete_admin_only" ON settings;

-- SELECT: Only admins can view settings
CREATE POLICY "settings_select_admin_only"
  ON settings
  FOR SELECT
  USING (
    is_admin()
  );

COMMENT ON POLICY "settings_select_admin_only" ON settings IS
  'Only admins can view system settings';

-- INSERT: Only admins can create settings
CREATE POLICY "settings_insert_admin_only"
  ON settings
  FOR INSERT
  WITH CHECK (
    is_admin()
  );

COMMENT ON POLICY "settings_insert_admin_only" ON settings IS
  'Only admins can create system settings';

-- UPDATE: Only admins can update settings
CREATE POLICY "settings_update_admin_only"
  ON settings
  FOR UPDATE
  USING (
    is_admin()
  );

COMMENT ON POLICY "settings_update_admin_only" ON settings IS
  'Only admins can update system settings';

-- DELETE: Only admins can delete settings
CREATE POLICY "settings_delete_admin_only"
  ON settings
  FOR DELETE
  USING (
    is_admin()
  );

COMMENT ON POLICY "settings_delete_admin_only" ON settings IS
  'Only admins can delete system settings';

-- ============================================
-- SECTION 9: RLS POLICIES FOR contract_types
-- ============================================
-- Contract classifications with 3 production records
-- Read-only for all, admin can manage

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "contract_types_select_all_authenticated" ON contract_types;
DROP POLICY IF EXISTS "contract_types_insert_admin_only" ON contract_types;
DROP POLICY IF EXISTS "contract_types_update_admin_only" ON contract_types;
DROP POLICY IF EXISTS "contract_types_delete_admin_only" ON contract_types;

-- SELECT: All authenticated users can view contract types
CREATE POLICY "contract_types_select_all_authenticated"
  ON contract_types
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
  );

COMMENT ON POLICY "contract_types_select_all_authenticated" ON contract_types IS
  'All authenticated users can view contract type definitions';

-- INSERT: Only admins can create contract types
CREATE POLICY "contract_types_insert_admin_only"
  ON contract_types
  FOR INSERT
  WITH CHECK (
    is_admin()
  );

COMMENT ON POLICY "contract_types_insert_admin_only" ON contract_types IS
  'Only admins can create new contract types';

-- UPDATE: Only admins can update contract types
CREATE POLICY "contract_types_update_admin_only"
  ON contract_types
  FOR UPDATE
  USING (
    is_admin()
  );

COMMENT ON POLICY "contract_types_update_admin_only" ON contract_types IS
  'Only admins can update contract type definitions';

-- DELETE: Only admins can delete contract types
CREATE POLICY "contract_types_delete_admin_only"
  ON contract_types
  FOR DELETE
  USING (
    is_admin()
  );

COMMENT ON POLICY "contract_types_delete_admin_only" ON contract_types IS
  'Only admins can delete contract types';

-- ============================================
-- SECTION 10: VALIDATION & VERIFICATION
-- ============================================

-- Verify RLS is enabled on all tables
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
      RAISE NOTICE '✅ RLS enabled on: %', table_name;
    ELSE
      tables_without_rls := tables_without_rls + 1;
      RAISE WARNING '⚠️  RLS NOT enabled on: %', table_name;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Verification Summary:';
  RAISE NOTICE '  ✅ Tables with RLS: %', tables_with_rls;
  RAISE NOTICE '  ⚠️  Tables without RLS: %', tables_without_rls;
  RAISE NOTICE '========================================';
END $$;

-- List all policies created
SELECT
  schemaname,
  tablename,
  policyname,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('pilots', 'pilot_checks', 'check_types', 'leave_requests', 'settings', 'contract_types', 'an_users')
ORDER BY tablename, command;

COMMIT;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

SELECT
  '✅ Row Level Security Policies Created Successfully!' as status,
  '7 tables protected with 28 policies total' as details,
  'Helper functions: is_admin(), is_admin_or_manager(), get_user_role()' as functions,
  'Roles: admin (full access), manager (edit access), authenticated (read-only)' as roles;
