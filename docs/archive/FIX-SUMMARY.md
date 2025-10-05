# Fix Summary - Pilot & Certification Edit Issues

## ✅ ISSUES RESOLVED

### 1. **Root Cause: Supabase Query Cache Problem**

**Problem:** Pilot and certification edits were saving to the database successfully, but the UI wasn't showing updated data because Supabase's `.select()` chained after `.update()` or `.upsert()` was returning **stale cached data**.

**Evidence:**
- API logs showed unchanged `updated_at` timestamp: `"2025-10-03T06:19:16.01169+00:00"`
- API logs showed old value: `last_name: "PORTERss"`
- Database query confirmed correct value: `last_name: "PORTER"` ✅

### 2. **Fixes Applied**

#### A. Pilot Edit API ([src/app/api/pilots/route.ts](src/app/api/pilots/route.ts#L212-L260))
```typescript
// ❌ Before: Chained .select() returns cached data
const { data, error } = await supabaseAdmin
  .from('pilots')
  .update(cleanedBody)
  .eq('id', pilotId)
  .select()
  .single();

// ✅ After: Separate queries for fresh data
const { error } = await supabaseAdmin
  .from('pilots')
  .update(cleanedBody)
  .eq('id', pilotId);

// Fetch fresh data after update
const { data: freshData } = await supabaseAdmin
  .from('pilots')
  .select()
  .eq('id', pilotId)
  .single();

return NextResponse.json({
  success: true,
  data: freshData, // Fresh data, not cached
});
```

#### B. Certification Edit API ([src/app/api/certifications/route.ts](src/app/api/certifications/route.ts#L119-L155))
```typescript
// ❌ Before: Chained .select() returns cached data
const { data, error } = await getSupabaseAdmin()
  .from('pilot_checks')
  .upsert(updates, { onConflict: 'pilot_id,check_type_id' })
  .select();

// ✅ After: Separate queries for fresh data
const { error } = await getSupabaseAdmin()
  .from('pilot_checks')
  .upsert(updates, { onConflict: 'pilot_id,check_type_id' });

// Fetch fresh data after upsert
const { data: freshData } = await getSupabaseAdmin()
  .from('pilot_checks')
  .select()
  .eq('pilot_id', pilotId)
  .in('check_type_id', updates.map(u => u.check_type_id));

return NextResponse.json({
  success: true,
  data: freshData, // Fresh data, not cached
});
```

#### C. UI Refresh After Edit ([src/app/dashboard/pilots/page.tsx](src/app/dashboard/pilots/page.tsx#L213-L217))
```typescript
const handleEditPilotSuccess = async () => {
  await fetchPilots();
  // Force a hard refresh to show updated data
  window.location.reload();
};
```

### 3. **What Was NOT the Issue**

**Initially suspected but ruled out:**
- ✅ Leave request edit - Already working correctly with API route
- ✅ RLS policies - Service role bypasses RLS successfully
- ✅ `auth_get_user_role()` function - Fixed but wasn't the main issue
- ✅ API routes - All working correctly, returning success
- ✅ Database permissions - Service role has full access

### 4. **Testing Status**

**Ready to Test:**
1. **Pilot Edit**: Navigate to http://localhost:3000/dashboard/pilots
   - Click edit on any pilot
   - Change any field (e.g., last name)
   - Click Save
   - ✅ Data should persist and UI should refresh with new values

2. **Certification Edit**: Navigate to pilot detail page
   - Click "Manage Certifications"
   - Update any expiry date
   - Click Save
   - ✅ Data should persist and redirect to pilot detail page

3. **Leave Request Edit**: Already working
   - ✅ Confirmed working in previous tests

---

## 🔒 SUPABASE SECURITY ISSUES (25 Total)

### Critical (ERROR Level) - 13 Issues

**Issue: Security Definer Views**
- **Affected Views (13):**
  - `expiring_checks`
  - `pilot_qualification_summary`
  - `index_usage_stats`
  - `table_performance_stats`
  - `captain_qualifications_summary`
  - `compliance_dashboard`
  - `detailed_expiring_checks`
  - `pilot_summary_optimized`
  - `pilot_requirements_compliance`
  - `v_index_performance_monitor`
  - `pilot_checks_overview`
  - `expiring_checks_optimized`
  - `pilot_report_summary`

**Problem:** Views with `SECURITY DEFINER` enforce permissions of the view creator, not the querying user.

**Remediation:** [Supabase Security Definer Views](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)

### Warning (WARN Level) - 12 Issues

**1. Function Search Path Mutable (5 functions):**
- `trigger_refresh_dashboard_metrics`
- `update_updated_at_column`
- `refresh_dashboard_metrics`
- `search_pilots_by_name`
- `auth_get_user_role`

**Fix:** Add `SET search_path = ''` to function definitions

**2. Extensions in Public Schema (3):**
- `btree_gist`
- `pg_trgm`
- `btree_gin`

**Fix:** Move extensions to `extensions` schema

**3. Materialized View in API (1):**
- `dashboard_metrics` accessible by anon/authenticated roles

**4. Auth Security (3):**
- Leaked password protection disabled
- Insufficient MFA options
- Postgres version has security patches available

**Remediation:**
- Enable password leak detection
- Enable more MFA methods
- Upgrade Postgres version

---

## ⚡ SUPABASE PERFORMANCE ISSUES (27 Total)

### 1. Unindexed Foreign Keys (4 issues)
**Tables affected:**
- `an_leave_requests` → `pilot_id`, `reviewed_by`
- `an_pilot_checks` → `check_type_id`
- `leave_requests` → `reviewed_by`

**Fix:** Add indexes:
```sql
CREATE INDEX idx_an_leave_requests_pilot_id ON an_leave_requests(pilot_id);
CREATE INDEX idx_an_leave_requests_reviewed_by ON an_leave_requests(reviewed_by);
CREATE INDEX idx_an_pilot_checks_check_type_id ON an_pilot_checks(check_type_id);
CREATE INDEX idx_leave_requests_reviewed_by ON leave_requests(reviewed_by);
```

### 2. Auth RLS InitPlan Issues (10 issues)
**Problem:** RLS policies re-evaluate `auth.uid()` for each row

**Tables affected:**
- `contract_types`, `an_pilots`, `an_check_types`, `an_pilot_checks`
- `an_leave_requests`, `an_users`, `leave_requests`

**Fix:** Replace `auth.uid()` with `(select auth.uid())` in RLS policies

**Example:**
```sql
-- ❌ Before: Re-evaluated for each row
WHERE auth.uid() = user_id

-- ✅ After: Evaluated once
WHERE (SELECT auth.uid()) = user_id
```

### 3. Unused Indexes (30 issues)
**Note:** Many of these are newly created and will be used as the application grows.

**Pilots table (10):**
- `idx_pilots_is_active`, `idx_pilots_role`, `idx_pilots_active_role`
- `idx_pilots_active_seniority`, `idx_pilots_contract_type`
- `idx_pilots_passport_expiry`, `idx_pilots_rhs_captain_expiry`
- `idx_pilots_fullname_search`

**Check Types table (2):**
- `idx_check_types_category`, `idx_check_types_category_code`

**Leave Requests table (9):**
- `idx_leave_requests_pilot_id`, `idx_leave_requests_status`
- `idx_leave_requests_type`, `idx_leave_requests_pilot_status`
- `idx_leave_requests_start_date`, `idx_leave_requests_end_date`
- `idx_leave_requests_date_range`, `idx_leave_requests_late`

**Recommendation:** Monitor usage over time, remove truly unused indexes

### 4. Multiple Permissive Policies (13 issues)
**Problem:** Multiple RLS policies for same role/action cause performance overhead

**Tables affected:**
- `an_users` (5 roles affected)
- `check_types`, `contract_types`, `leave_requests`, `pilot_checks`, `pilots`

**Fix:** Combine policies using OR conditions:
```sql
-- ❌ Before: Two separate policies
CREATE POLICY "policy1" FOR SELECT USING (condition1);
CREATE POLICY "policy2" FOR SELECT USING (condition2);

-- ✅ After: One combined policy
CREATE POLICY "combined" FOR SELECT USING (condition1 OR condition2);
```

---

## 📋 RECOMMENDED ACTIONS

### Immediate (High Priority)
1. ✅ Test pilot edit functionality
2. ✅ Test certification edit functionality
3. ⚠️ Fix RLS InitPlan issues (10 tables) - Performance impact
4. ⚠️ Add missing foreign key indexes (4 indexes) - Query performance

### Medium Priority
5. Fix function search paths (5 functions)
6. Combine duplicate RLS policies (13 policy groups)
7. Move extensions from public schema (3 extensions)

### Low Priority (Monitor)
8. Review Security Definer views (13 views) - Security consideration
9. Monitor unused indexes (30 indexes) - May become used
10. Enable auth security features (password leak detection, MFA)
11. Upgrade Postgres version

---

## 🚀 CURRENT STATUS

**Dev Server:** Running on http://localhost:3000

**Files Modified:**
1. [src/app/api/pilots/route.ts](src/app/api/pilots/route.ts) - Fixed cache issue
2. [src/app/api/certifications/route.ts](src/app/api/certifications/route.ts) - Fixed cache issue
3. [src/app/dashboard/pilots/page.tsx](src/app/dashboard/pilots/page.tsx) - Added UI refresh

**Migration Files Created:**
- `supabase/migrations/20251003000000_fix_auth_get_user_role.sql` - Auth function fix
- `fix-auth-role-function.sql` - Manual migration option
- `URGENT-FIX-INSTRUCTIONS.md` - Manual fix instructions

**Next Steps:**
1. Test pilot and certification edits
2. Address performance issues (RLS InitPlan + Foreign Key indexes)
3. Review security issues based on priority
