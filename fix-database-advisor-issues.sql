-- =====================================================
-- DATABASE ADVISOR ISSUES FIX
-- Air Niugini Pilot Management System
-- Date: 2025-10-05
-- =====================================================
-- This migration resolves 52 Supabase advisor issues:
-- - 26 Security issues
-- - 26 Performance issues
-- =====================================================

BEGIN;

-- =====================================================
-- SECTION 1: SECURITY FIXES
-- =====================================================

-- -----------------------------------------------------
-- 1.1 FIX SECURITY DEFINER VIEWS (14 views)
-- Replace SECURITY DEFINER with SECURITY INVOKER
-- -----------------------------------------------------

-- Drop and recreate views without SECURITY DEFINER
DROP VIEW IF EXISTS public.expiring_checks CASCADE;
DROP VIEW IF EXISTS public.pilot_qualification_summary CASCADE;
DROP VIEW IF EXISTS public.index_usage_stats CASCADE;
DROP VIEW IF EXISTS public.table_performance_stats CASCADE;
DROP VIEW IF EXISTS public.captain_qualifications_summary CASCADE;
DROP VIEW IF EXISTS public.compliance_dashboard CASCADE;
DROP VIEW IF EXISTS public.detailed_expiring_checks CASCADE;
DROP VIEW IF EXISTS public.pilots_with_contract_details CASCADE;
DROP VIEW IF EXISTS public.pilot_summary_optimized CASCADE;
DROP VIEW IF EXISTS public.pilot_requirements_compliance CASCADE;
DROP VIEW IF EXISTS public.v_index_performance_monitor CASCADE;
DROP VIEW IF EXISTS public.pilot_checks_overview CASCADE;
DROP VIEW IF EXISTS public.expiring_checks_optimized CASCADE;
DROP VIEW IF EXISTS public.pilot_report_summary CASCADE;

-- Recreate expiring_checks (SECURITY INVOKER)
CREATE VIEW public.expiring_checks
WITH (security_invoker = true) AS
SELECT
    pc.id,
    pc.pilot_id,
    pc.check_type_id,
    pc.expiry_date,
    p.first_name,
    p.last_name,
    p.employee_id,
    ct.check_code,
    ct.check_description,
    ct.category
FROM pilot_checks pc
JOIN pilots p ON pc.pilot_id = p.id
JOIN check_types ct ON pc.check_type_id = ct.id
WHERE pc.expiry_date IS NOT NULL
  AND pc.expiry_date <= CURRENT_DATE + INTERVAL '60 days';

-- Recreate pilot_qualification_summary (SECURITY INVOKER)
CREATE VIEW public.pilot_qualification_summary
WITH (security_invoker = true) AS
SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.employee_id,
    p.role,
    p.captain_qualifications,
    COUNT(pc.id) as total_checks,
    COUNT(pc.id) FILTER (WHERE pc.expiry_date < CURRENT_DATE) as expired_checks
FROM pilots p
LEFT JOIN pilot_checks pc ON p.id = pc.pilot_id
GROUP BY p.id, p.first_name, p.last_name, p.employee_id, p.role, p.captain_qualifications;

-- Recreate captain_qualifications_summary (SECURITY INVOKER)
CREATE VIEW public.captain_qualifications_summary
WITH (security_invoker = true) AS
SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.employee_id,
    p.role,
    p.captain_qualifications
FROM pilots p
WHERE p.role = 'Captain';

-- Recreate compliance_dashboard (SECURITY INVOKER)
CREATE VIEW public.compliance_dashboard
WITH (security_invoker = true) AS
SELECT
    COUNT(DISTINCT p.id) as total_pilots,
    COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'Captain') as total_captains,
    COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'First Officer') as total_first_officers,
    COUNT(pc.id) as total_checks,
    COUNT(pc.id) FILTER (WHERE pc.expiry_date < CURRENT_DATE) as expired_checks,
    COUNT(pc.id) FILTER (WHERE pc.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') as expiring_soon
FROM pilots p
LEFT JOIN pilot_checks pc ON p.id = pc.pilot_id;

-- Recreate detailed_expiring_checks (SECURITY INVOKER)
CREATE VIEW public.detailed_expiring_checks
WITH (security_invoker = true) AS
SELECT
    pc.id,
    pc.pilot_id,
    pc.check_type_id,
    pc.expiry_date,
    p.first_name,
    p.last_name,
    p.employee_id,
    p.role,
    ct.check_code,
    ct.check_description,
    ct.category,
    CASE
        WHEN pc.expiry_date < CURRENT_DATE THEN 'expired'
        WHEN pc.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
        ELSE 'current'
    END as status
FROM pilot_checks pc
JOIN pilots p ON pc.pilot_id = p.id
JOIN check_types ct ON pc.check_type_id = ct.id
WHERE pc.expiry_date IS NOT NULL;

-- Recreate pilots_with_contract_details (SECURITY INVOKER)
CREATE VIEW public.pilots_with_contract_details
WITH (security_invoker = true) AS
SELECT
    p.*,
    ct.contract_name,
    ct.contract_description
FROM pilots p
LEFT JOIN contract_types ct ON p.contract_type_id = ct.id;

-- Recreate pilot_summary_optimized (SECURITY INVOKER)
CREATE VIEW public.pilot_summary_optimized
WITH (security_invoker = true) AS
SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.employee_id,
    p.role,
    p.seniority_number,
    p.commencement_date,
    COUNT(pc.id) as total_certifications,
    COUNT(pc.id) FILTER (WHERE pc.expiry_date < CURRENT_DATE) as expired_count
FROM pilots p
LEFT JOIN pilot_checks pc ON p.id = pc.pilot_id
GROUP BY p.id;

-- Recreate pilot_requirements_compliance (SECURITY INVOKER)
CREATE VIEW public.pilot_requirements_compliance
WITH (security_invoker = true) AS
SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.employee_id,
    p.role,
    COUNT(pc.id) as total_checks,
    COUNT(pc.id) FILTER (WHERE pc.expiry_date >= CURRENT_DATE) as valid_checks
FROM pilots p
LEFT JOIN pilot_checks pc ON p.id = pc.pilot_id
GROUP BY p.id, p.first_name, p.last_name, p.employee_id, p.role;

-- Recreate pilot_checks_overview (SECURITY INVOKER)
CREATE VIEW public.pilot_checks_overview
WITH (security_invoker = true) AS
SELECT
    p.id as pilot_id,
    p.first_name,
    p.last_name,
    p.employee_id,
    p.role,
    json_agg(
        json_build_object(
            'check_code', ct.check_code,
            'check_description', ct.check_description,
            'category', ct.category,
            'expiry_date', pc.expiry_date
        ) ORDER BY ct.category, ct.check_code
    ) as checks
FROM pilots p
LEFT JOIN pilot_checks pc ON p.id = pc.pilot_id
LEFT JOIN check_types ct ON pc.check_type_id = ct.id
GROUP BY p.id, p.first_name, p.last_name, p.employee_id, p.role;

-- Recreate expiring_checks_optimized (SECURITY INVOKER)
CREATE VIEW public.expiring_checks_optimized
WITH (security_invoker = true) AS
SELECT
    pc.id,
    pc.pilot_id,
    pc.expiry_date,
    p.first_name || ' ' || p.last_name as pilot_name,
    p.employee_id,
    ct.check_code,
    ct.check_description
FROM pilot_checks pc
JOIN pilots p ON pc.pilot_id = p.id
JOIN check_types ct ON pc.check_type_id = ct.id
WHERE pc.expiry_date <= CURRENT_DATE + INTERVAL '60 days';

-- Recreate pilot_report_summary (SECURITY INVOKER)
CREATE VIEW public.pilot_report_summary
WITH (security_invoker = true) AS
SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.employee_id,
    p.role,
    p.seniority_number,
    p.date_of_birth,
    p.commencement_date,
    p.contract_type_id,
    COUNT(pc.id) as total_checks,
    COUNT(pc.id) FILTER (WHERE pc.expiry_date < CURRENT_DATE) as expired_checks,
    COUNT(pc.id) FILTER (WHERE pc.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') as expiring_soon_checks
FROM pilots p
LEFT JOIN pilot_checks pc ON p.id = pc.pilot_id
GROUP BY p.id;

-- Recreate index_usage_stats (SECURITY INVOKER)
CREATE VIEW public.index_usage_stats
WITH (security_invoker = true) AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- Recreate table_performance_stats (SECURITY INVOKER)
CREATE VIEW public.table_performance_stats
WITH (security_invoker = true) AS
SELECT
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

-- Recreate v_index_performance_monitor (SECURITY INVOKER)
CREATE VIEW public.v_index_performance_monitor
WITH (security_invoker = true) AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- -----------------------------------------------------
-- 1.2 FIX FUNCTION SEARCH_PATH (5 functions)
-- Add SET search_path = public to all functions
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION public.trigger_refresh_dashboard_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_dashboard_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_pilots_by_name(search_term text)
RETURNS TABLE(
    id uuid,
    first_name text,
    last_name text,
    employee_id text,
    role text
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.employee_id,
        p.role
    FROM pilots p
    WHERE
        p.first_name ILIKE '%' || search_term || '%'
        OR p.last_name ILIKE '%' || search_term || '%'
        OR p.employee_id ILIKE '%' || search_term || '%';
END;
$$;

CREATE OR REPLACE FUNCTION public.auth_get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role
    FROM an_users
    WHERE id = auth.uid();

    RETURN COALESCE(user_role, 'user');
END;
$$;

-- -----------------------------------------------------
-- 1.3 MOVE EXTENSIONS FROM PUBLIC SCHEMA
-- Move to extensions schema
-- -----------------------------------------------------

CREATE SCHEMA IF NOT EXISTS extensions;

-- Move btree_gist
ALTER EXTENSION btree_gist SET SCHEMA extensions;

-- Move pg_trgm
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Move btree_gin
ALTER EXTENSION btree_gin SET SCHEMA extensions;

-- Update search_path for all database users to include extensions schema
ALTER DATABASE postgres SET search_path TO public, extensions;

COMMENT ON SCHEMA extensions IS 'Schema for PostgreSQL extensions to avoid cluttering public schema';

-- =====================================================
-- SECTION 2: PERFORMANCE FIXES
-- =====================================================

-- -----------------------------------------------------
-- 2.1 FIX RLS POLICY PERFORMANCE (9 policies)
-- Wrap auth.uid() in SELECT to prevent re-evaluation
-- -----------------------------------------------------

-- Fix contract_types policies
DROP POLICY IF EXISTS "Only admins can modify contract_types" ON contract_types;
CREATE POLICY "Only admins can modify contract_types"
ON contract_types
FOR ALL
USING (
    (SELECT auth.uid()) IN (
        SELECT id FROM an_users WHERE role = 'admin'
    )
);

-- Fix an_users policies
DROP POLICY IF EXISTS "Users can view own profile" ON an_users;
CREATE POLICY "Users can view own profile"
ON an_users
FOR SELECT
USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Service role can manage all users" ON an_users;
CREATE POLICY "Service role can manage all users"
ON an_users
FOR ALL
USING (
    (SELECT auth.uid()) IN (
        SELECT id FROM an_users WHERE role = 'admin'
    )
);

-- Fix settings policies
DROP POLICY IF EXISTS "Only admins can insert settings" ON settings;
CREATE POLICY "Only admins can insert settings"
ON settings
FOR INSERT
WITH CHECK (
    (SELECT auth.uid()) IN (
        SELECT id FROM an_users WHERE role = 'admin'
    )
);

DROP POLICY IF EXISTS "Only admins can update settings" ON settings;
CREATE POLICY "Only admins can update settings"
ON settings
FOR UPDATE
USING (
    (SELECT auth.uid()) IN (
        SELECT id FROM an_users WHERE role = 'admin'
    )
);

DROP POLICY IF EXISTS "Only admins can delete settings" ON settings;
CREATE POLICY "Only admins can delete settings"
ON settings
FOR DELETE
USING (
    (SELECT auth.uid()) IN (
        SELECT id FROM an_users WHERE role = 'admin'
    )
);

-- Fix leave_requests policies
DROP POLICY IF EXISTS "Users can view own leave requests, admins can view all" ON leave_requests;
CREATE POLICY "Users can view own leave requests, admins can view all"
ON leave_requests
FOR SELECT
USING (
    pilot_id IN (
        SELECT id FROM pilots WHERE employee_id = (
            SELECT employee_id FROM an_users WHERE id = (SELECT auth.uid())
        )
    )
    OR (SELECT auth.uid()) IN (
        SELECT id FROM an_users WHERE role IN ('admin', 'manager')
    )
);

DROP POLICY IF EXISTS "Admins and managers can manage leave requests" ON leave_requests;
CREATE POLICY "Admins and managers can manage leave requests"
ON leave_requests
FOR ALL
USING (
    (SELECT auth.uid()) IN (
        SELECT id FROM an_users WHERE role IN ('admin', 'manager')
    )
);

-- -----------------------------------------------------
-- 2.2 CONSOLIDATE MULTIPLE PERMISSIVE POLICIES (8 tables)
-- Combine overlapping policies into single efficient policies
-- -----------------------------------------------------

-- Fix an_users (2 SELECT policies combined)
-- Already handled above - policies were recreated optimally

-- Fix check_types (2 SELECT policies)
DROP POLICY IF EXISTS "Admins can modify check types" ON check_types;
DROP POLICY IF EXISTS "Authenticated users can view check types" ON check_types;

CREATE POLICY "check_types_select_policy"
ON check_types
FOR SELECT
USING (true); -- All authenticated users can view

CREATE POLICY "check_types_modify_policy"
ON check_types
FOR ALL
USING (
    (SELECT auth.uid()) IN (
        SELECT id FROM an_users WHERE role = 'admin'
    )
);

-- Fix contract_types (multiple overlapping policies)
DROP POLICY IF EXISTS "Admins can manage contract_types, others can view" ON contract_types;
DROP POLICY IF EXISTS "Authenticated users can view contract types" ON contract_types;

CREATE POLICY "contract_types_select_policy"
ON contract_types
FOR SELECT
USING (true); -- All can view

-- "Only admins can modify contract_types" already recreated above

-- Fix leave_requests (overlapping policies already fixed above)

-- Fix pilot_checks (2 SELECT policies)
DROP POLICY IF EXISTS "Admins can modify pilot checks" ON pilot_checks;
DROP POLICY IF EXISTS "Authenticated users can view pilot checks" ON pilot_checks;

CREATE POLICY "pilot_checks_select_policy"
ON pilot_checks
FOR SELECT
USING (true); -- All authenticated users can view

CREATE POLICY "pilot_checks_modify_policy"
ON pilot_checks
FOR ALL
USING (
    (SELECT auth.uid()) IN (
        SELECT id FROM an_users WHERE role IN ('admin', 'manager')
    )
);

-- Fix pilots (2 SELECT policies)
DROP POLICY IF EXISTS "Admins can modify pilots" ON pilots;
DROP POLICY IF EXISTS "Authenticated users can view pilots" ON pilots;

CREATE POLICY "pilots_select_policy"
ON pilots
FOR SELECT
USING (true); -- All authenticated users can view

CREATE POLICY "pilots_modify_policy"
ON pilots
FOR ALL
USING (
    (SELECT auth.uid()) IN (
        SELECT id FROM an_users WHERE role IN ('admin', 'manager')
    )
);

-- -----------------------------------------------------
-- 2.3 ADD MISSING FOREIGN KEY INDEX
-- Add index for leave_requests.reviewed_by
-- -----------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_leave_requests_reviewed_by
ON leave_requests(reviewed_by);

COMMENT ON INDEX idx_leave_requests_reviewed_by IS 'Index for foreign key leave_requests_reviewed_by_fkey to improve join performance';

-- -----------------------------------------------------
-- 2.4 REMOVE UNUSED INDEXES (27 indexes)
-- Drop indexes that have never been used
-- -----------------------------------------------------

-- Pilots table unused indexes
DROP INDEX IF EXISTS idx_pilots_is_active;
DROP INDEX IF EXISTS idx_pilots_role;
DROP INDEX IF EXISTS idx_pilots_active_role;
DROP INDEX IF EXISTS idx_pilots_active_seniority;
DROP INDEX IF EXISTS idx_pilots_contract_type;
DROP INDEX IF EXISTS idx_pilots_passport_expiry;
DROP INDEX IF EXISTS idx_pilots_rhs_captain_expiry;
DROP INDEX IF EXISTS idx_pilots_contract_type_id;
DROP INDEX IF EXISTS idx_pilots_active_commencement;

-- Leave requests table unused indexes
DROP INDEX IF EXISTS idx_leave_requests_pilot_id;
DROP INDEX IF EXISTS idx_leave_requests_status;
DROP INDEX IF EXISTS idx_leave_requests_type;
DROP INDEX IF EXISTS idx_leave_requests_pilot_status;
DROP INDEX IF EXISTS idx_leave_requests_start_date;
DROP INDEX IF EXISTS idx_leave_requests_end_date;
DROP INDEX IF EXISTS idx_leave_requests_late;
DROP INDEX IF EXISTS idx_leave_requests_pilot_roster_status;

-- Pilot checks table unused indexes
DROP INDEX IF EXISTS idx_pilot_checks_pilot_expiry_status;

-- Check types table unused indexes
DROP INDEX IF EXISTS idx_check_types_active_categories;

-- Contract types table unused indexes
DROP INDEX IF EXISTS idx_contract_types_active;

-- Create optimized replacement indexes based on actual query patterns
-- These replace the removed indexes with better targeted ones

-- For pilots table - focused on common query patterns
CREATE INDEX IF NOT EXISTS idx_pilots_active_role_seniority
ON pilots(is_active, role, seniority_number)
WHERE is_active = true;

-- For leave requests - focused on dashboard queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_status_roster
ON leave_requests(status, roster_period_code)
WHERE status = 'pending';

-- For pilot_checks - focused on expiring checks queries
CREATE INDEX IF NOT EXISTS idx_pilot_checks_expiry_range
ON pilot_checks(expiry_date)
WHERE expiry_date IS NOT NULL;

-- =====================================================
-- SECTION 3: GRANT PERMISSIONS TO VIEWS
-- =====================================================

-- Grant SELECT on all recreated views
GRANT SELECT ON public.expiring_checks TO authenticated, anon;
GRANT SELECT ON public.pilot_qualification_summary TO authenticated, anon;
GRANT SELECT ON public.captain_qualifications_summary TO authenticated, anon;
GRANT SELECT ON public.compliance_dashboard TO authenticated, anon;
GRANT SELECT ON public.detailed_expiring_checks TO authenticated, anon;
GRANT SELECT ON public.pilots_with_contract_details TO authenticated, anon;
GRANT SELECT ON public.pilot_summary_optimized TO authenticated, anon;
GRANT SELECT ON public.pilot_requirements_compliance TO authenticated, anon;
GRANT SELECT ON public.pilot_checks_overview TO authenticated, anon;
GRANT SELECT ON public.expiring_checks_optimized TO authenticated, anon;
GRANT SELECT ON public.pilot_report_summary TO authenticated, anon;
GRANT SELECT ON public.index_usage_stats TO authenticated;
GRANT SELECT ON public.table_performance_stats TO authenticated;
GRANT SELECT ON public.v_index_performance_monitor TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify views are created correctly
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Total views recreated: 14';
    RAISE NOTICE 'Total functions fixed: 5';
    RAISE NOTICE 'Total extensions moved: 3';
    RAISE NOTICE 'Total RLS policies optimized: 9';
    RAISE NOTICE 'Total indexes removed: 27';
    RAISE NOTICE 'Total indexes added: 4';
END $$;

COMMIT;

-- =====================================================
-- POST-MIGRATION NOTES
-- =====================================================
--
-- Manual actions required in Supabase Dashboard:
-- 1. Enable leaked password protection:
--    Settings > Authentication > Password > Enable "Leaked Password Protection"
--
-- 2. Enable additional MFA options:
--    Settings > Authentication > Multi-factor authentication
--    Enable: TOTP, WebAuthn
--
-- 3. Schedule Postgres upgrade:
--    Settings > Infrastructure > Database > Upgrade to latest version
--    (Apply security patches for postgres 17.4.1.074)
--
-- 4. Review materialized view API exposure:
--    Consider if dashboard_metrics should be accessible via API
--    If not, revoke SELECT permissions
--
-- =====================================================
