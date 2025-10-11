# Row Level Security (RLS) Implementation Guide

**Air Niugini B767 Pilot Management System**
**Date**: October 9, 2025
**Version**: 1.0.0

---

## Overview

This document describes the comprehensive Row Level Security (RLS) implementation for the Air Niugini B767 Pilot Management System. RLS provides database-level access control, ensuring that users can only access data according to their role permissions.

## Table of Contents

1. [Protected Tables](#protected-tables)
2. [Role Definitions](#role-definitions)
3. [Policy Structure](#policy-structure)
4. [Deployment](#deployment)
5. [Testing & Validation](#testing--validation)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)

---

## Protected Tables

RLS policies have been implemented on **7 production tables**:

### 1. **pilots** (27 records)
- **Contains**: Pilot PII data including personal information, employment details, seniority
- **Sensitivity**: HIGH - Contains passport numbers, dates of birth, personal details
- **Access**: All authenticated users can read, admin/manager can edit

### 2. **pilot_checks** (571 records)
- **Contains**: Aviation certifications and expiry dates
- **Sensitivity**: MEDIUM - Operational data critical for compliance
- **Access**: All authenticated users can read, admin/manager can manage

### 3. **check_types** (34 records)
- **Contains**: Aviation certification type definitions
- **Sensitivity**: LOW - Reference data
- **Access**: All authenticated users can read, admin only can edit

### 4. **leave_requests** (12 records)
- **Contains**: Leave requests with dates, status, approval workflow
- **Sensitivity**: MEDIUM - Crew scheduling data
- **Access**: All authenticated users can view (for scheduling), admin/manager can approve

### 5. **settings** (3 records)
- **Contains**: System configuration parameters
- **Sensitivity**: HIGH - System-level settings
- **Access**: Admin only

### 6. **contract_types** (3 records)
- **Contains**: Pilot contract classifications (Fulltime, Contract, Casual)
- **Sensitivity**: LOW - Reference data
- **Access**: All authenticated users can read, admin only can edit

### 7. **an_users** (3 records)
- **Contains**: User authentication and role information
- **Sensitivity**: CRITICAL - Security-sensitive user data
- **Access**: Users can view own profile, admin can manage all

---

## Role Definitions

The system implements **3 access levels**:

### 1. **Admin Role** (`role = 'admin'`)

**Full System Access**:
- ✅ Create, Read, Update, Delete on all tables
- ✅ Manage system settings
- ✅ Manage user accounts
- ✅ Manage certification types and contract types
- ✅ Approve/reject leave requests
- ✅ Access audit logs

**User Count**: 1 (admin@airniugini.com.pg)

### 2. **Manager Role** (`role = 'manager'`)

**Operational Management Access**:
- ✅ Read all tables
- ✅ Edit pilots and certifications
- ✅ Manage leave requests (approve/reject)
- ✅ Create pilot checks
- ❌ Cannot create/delete pilots
- ❌ Cannot manage settings
- ❌ Cannot manage users

**User Count**: 2 (manager@airniugini.com.pg, ops@airniugini.com.pg)

### 3. **Authenticated User** (any logged-in user)

**Read-Only Access**:
- ✅ View pilots
- ✅ View certifications
- ✅ View leave requests (for scheduling coordination)
- ✅ View certification types
- ✅ View contract types
- ❌ Cannot edit any data
- ❌ Cannot view settings
- ❌ Cannot view other user accounts

**User Count**: Variable (future expansion)

---

## Policy Structure

### Helper Functions

Three PostgreSQL functions support the RLS policies:

#### 1. `is_admin()`
```sql
RETURNS BOOLEAN
```
Returns `TRUE` if current user has admin role.

**Usage**: Admin-only operations (DELETE, system settings)

#### 2. `is_admin_or_manager()`
```sql
RETURNS BOOLEAN
```
Returns `TRUE` if current user has admin OR manager role.

**Usage**: Operational management (edit pilots, manage certifications)

#### 3. `get_user_role()`
```sql
RETURNS TEXT
```
Returns the role string ('admin', 'manager', or NULL).

**Usage**: Complex conditional logic in policies

### Policy Naming Convention

All policies follow this naming pattern:
```
{table}_{operation}_{access_level}
```

**Examples**:
- `pilots_select_all_authenticated` - All authenticated users can SELECT pilots
- `pilots_insert_admin_only` - Only admin can INSERT pilots
- `pilots_update_admin_or_manager` - Admin/manager can UPDATE pilots
- `pilots_delete_admin_only` - Only admin can DELETE pilots

### Policy Count

**Total Policies**: 28 (4 per table × 7 tables)

| Table | SELECT | INSERT | UPDATE | DELETE | Total |
|-------|--------|--------|--------|--------|-------|
| pilots | 1 | 1 | 1 | 1 | 4 |
| pilot_checks | 1 | 1 | 1 | 1 | 4 |
| check_types | 1 | 1 | 1 | 1 | 4 |
| leave_requests | 1 | 1 | 1 | 1 | 4 |
| settings | 1 | 1 | 1 | 1 | 4 |
| contract_types | 1 | 1 | 1 | 1 | 4 |
| an_users | 1 | 1 | 1 | 1 | 4 |

---

## Deployment

### Prerequisites

1. **Backup Database**: Always backup before applying RLS policies
2. **Admin Access**: Ensure you have service role key with admin privileges
3. **Environment Variables**: Verify `.env.local` is properly configured

### Deployment Methods

#### Method 1: Node.js Script (Recommended)

```bash
# Navigate to project directory
cd "/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"

# Deploy RLS policies
node deploy-rls-policies.js deploy

# Test RLS policies
node deploy-rls-policies.js test

# Rollback if needed
node deploy-rls-policies.js rollback
```

**Advantages**:
- Automated verification
- Error handling
- Progress reporting
- Interactive rollback confirmation

#### Method 2: Direct SQL Execution

```bash
# Via psql (if you have direct database access)
psql postgresql://[connection-string] -f enable_production_rls_policies.sql

# Or via Supabase SQL Editor (paste contents of SQL file)
```

**Advantages**:
- Direct database access
- Full SQL output visibility
- Manual control

### Deployment Checklist

- [ ] Backup current database state
- [ ] Review `enable_production_rls_policies.sql` for any customizations
- [ ] Deploy RLS policies using preferred method
- [ ] Run validation tests (`test_rls_policies.sql`)
- [ ] Test application with different user roles
- [ ] Verify all CRUD operations work correctly
- [ ] Check for any RLS-related errors in application logs
- [ ] Monitor performance impact (should be minimal)

---

## Testing & Validation

### Automated Validation

Run the validation script:

```bash
node deploy-rls-policies.js test
```

Or execute SQL directly:

```bash
psql postgresql://[connection-string] -f test_rls_policies.sql
```

### Validation Checks

The test script verifies:

1. ✅ **RLS Enabled**: All 7 tables have RLS enabled
2. ✅ **Policy Count**: 28 policies created (4 per table)
3. ✅ **Helper Functions**: 3 functions exist and are SECURITY DEFINER
4. ✅ **Policy Definitions**: Policies use correct expressions
5. ✅ **Table Access**: Record counts are visible (for admin users)

### Manual Testing

#### Test as Admin

```sql
-- Set session to admin user
SET LOCAL role = 'admin';
SET LOCAL "request.jwt.claims" = '{"sub": "[admin-user-id]"}';

-- Should succeed
SELECT * FROM pilots;
INSERT INTO pilots (employee_id, first_name, last_name, role) VALUES ('TEST', 'Test', 'Pilot', 'Captain');
UPDATE pilots SET first_name = 'Updated' WHERE employee_id = 'TEST';
DELETE FROM pilots WHERE employee_id = 'TEST';
```

#### Test as Manager

```sql
-- Set session to manager user
SET LOCAL role = 'manager';
SET LOCAL "request.jwt.claims" = '{"sub": "[manager-user-id]"}';

-- Should succeed
SELECT * FROM pilots;
UPDATE pilots SET first_name = 'Updated' WHERE employee_id = '2393';
UPDATE pilot_checks SET expiry_date = '2025-12-31' WHERE id = '[check-id]';

-- Should fail
INSERT INTO pilots (employee_id, first_name, last_name, role) VALUES ('TEST2', 'Test', 'Pilot', 'Captain');
DELETE FROM pilots WHERE employee_id = '2393';
SELECT * FROM settings;
```

#### Test as Authenticated User

```sql
-- Should succeed
SELECT * FROM pilots;
SELECT * FROM pilot_checks;
SELECT * FROM leave_requests;

-- Should fail
UPDATE pilots SET first_name = 'Hacker' WHERE employee_id = '2393';
DELETE FROM pilots WHERE employee_id = '2393';
INSERT INTO leave_requests (...) VALUES (...);
SELECT * FROM settings;
```

### Application-Level Testing

1. **Login as Admin** (`admin@airniugini.com.pg`)
   - Navigate to all pages (Dashboard, Pilots, Certifications, Leave, Settings)
   - Create a new pilot
   - Edit pilot information
   - Add certifications
   - Approve leave requests
   - Access settings

2. **Login as Manager** (`manager@airniugini.com.pg`)
   - View dashboard and reports
   - Edit existing pilots
   - Update certifications
   - Approve/reject leave requests
   - Verify cannot create new pilots
   - Verify cannot access settings

3. **Check Error Handling**
   - Verify graceful error messages if permission denied
   - Ensure no RLS policy leaks sensitive information in errors

---

## Rollback Procedures

### When to Rollback

Consider rollback if:
- Application functionality breaks after RLS deployment
- Users report permission errors that shouldn't occur
- Performance degradation beyond acceptable limits
- RLS policies conflict with application logic

### Rollback Execution

#### Method 1: Node.js Script (Recommended)

```bash
node deploy-rls-policies.js rollback
```

This will:
1. Prompt for confirmation
2. Disable RLS on all 7 tables
3. Drop all 28 policies
4. Verify RLS is disabled
5. Display summary

#### Method 2: Direct SQL Execution

```bash
psql postgresql://[connection-string] -f rollback_production_rls_policies.sql
```

### Post-Rollback Verification

After rollback:

1. ✅ Verify RLS is disabled on all tables
2. ✅ Confirm application functionality restored
3. ✅ Review rollback script output for any errors
4. ✅ Document reason for rollback
5. ✅ Plan fixes before re-deployment

### Re-deployment After Rollback

If rollback was necessary:

1. Analyze root cause of issues
2. Modify RLS policies if needed
3. Test modified policies in development environment
4. Re-deploy with updated policies
5. Monitor closely after re-deployment

---

## Troubleshooting

### Common Issues

#### Issue 1: "permission denied for table pilots"

**Cause**: RLS policy too restrictive or user not authenticated properly

**Solution**:
```sql
-- Check user authentication
SELECT auth.uid(), auth.role();

-- Check user role
SELECT * FROM an_users WHERE id = auth.uid();

-- Verify policy exists
SELECT * FROM pg_policies WHERE tablename = 'pilots';
```

#### Issue 2: "Could not find the function is_admin"

**Cause**: Helper functions not created or dropped

**Solution**:
```sql
-- Recreate helper functions (from enable_production_rls_policies.sql)
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$ ... $$;
```

#### Issue 3: Application works for admin but not manager

**Cause**: Policies incorrectly configured for manager role

**Solution**:
```sql
-- Check manager can be identified
SELECT is_admin_or_manager(); -- Should return TRUE for manager

-- Verify manager user exists
SELECT * FROM an_users WHERE role = 'manager';
```

#### Issue 4: RLS causes performance degradation

**Cause**: RLS policies add query overhead, especially with complex joins

**Solution**:
1. Add indexes on `an_users.id` for faster role lookups
2. Ensure helper functions are marked `STABLE` (not `VOLATILE`)
3. Consider using `SECURITY DEFINER` views for complex queries
4. Monitor query execution plans

```sql
-- Add index if not exists
CREATE INDEX IF NOT EXISTS idx_an_users_id ON an_users(id);
```

### Debugging RLS Policies

#### Check Policy Definitions

```sql
-- View policy definition
SELECT
  schemaname, tablename, policyname,
  cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'pilots';
```

#### Test Policy Logic

```sql
-- Test helper function
SELECT
  is_admin() as is_admin,
  is_admin_or_manager() as is_admin_or_manager,
  get_user_role() as user_role;

-- Test authentication
SELECT auth.uid(), auth.role(), auth.email();
```

#### Check RLS Status

```sql
-- Verify RLS is enabled
SELECT
  tablename,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as force_rls
FROM pg_tables pt
JOIN pg_class pc ON pt.tablename = pc.relname
WHERE schemaname = 'public'
  AND tablename IN ('pilots', 'pilot_checks', 'check_types', 'leave_requests', 'settings', 'contract_types', 'an_users');
```

### Getting Help

If issues persist:

1. Review Supabase logs in dashboard
2. Check application error logs
3. Verify environment variables are correct
4. Test with Supabase SQL Editor (bypasses some client-side issues)
5. Contact database administrator

---

## Security Considerations

### Best Practices

1. ✅ **Always use service role key for admin operations** in backend code
2. ✅ **Never expose service role key to client** - keep in server environment only
3. ✅ **Test policies thoroughly** before production deployment
4. ✅ **Monitor RLS policy violations** in logs
5. ✅ **Regular security audits** - review policies quarterly
6. ✅ **Document policy changes** in this guide

### Security Checklist

- [ ] Service role key stored securely in environment variables
- [ ] Anon key used for client-side authentication only
- [ ] RLS policies match application permission logic
- [ ] Helper functions use `SECURITY DEFINER` correctly
- [ ] No policy leaks sensitive data in error messages
- [ ] Audit logs capture RLS policy violations

### Compliance Notes

For **Air Niugini B767 Fleet Operations**:

- **ICAO Compliance**: RLS policies support audit trail requirements
- **Data Protection**: PII data (pilots table) has appropriate access controls
- **Operational Security**: Leave requests visible to all for crew scheduling (industry standard)
- **Role Separation**: Clear separation between admin, manager, and read-only access

---

## Performance Impact

### Expected Performance

RLS adds minimal overhead when properly implemented:

- **SELECT queries**: ~1-3ms additional latency (negligible)
- **INSERT/UPDATE/DELETE**: ~2-5ms additional latency (acceptable)
- **Complex queries with joins**: ~5-10ms additional latency (minimal)

### Monitoring Performance

```sql
-- Check slow queries with RLS
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE query LIKE '%pilots%' OR query LIKE '%pilot_checks%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Optimization Tips

1. **Use indexed columns in policies** - `auth.uid()` lookups are fast
2. **Mark helper functions STABLE** - allows query optimizer caching
3. **Avoid complex subqueries in policies** - keep policy logic simple
4. **Use database views for complex joins** - pre-compute expensive operations
5. **Cache user role in application session** - reduce repeated database lookups

---

## Maintenance

### Regular Tasks

**Monthly**:
- Review RLS policy violations in logs
- Check for any permission errors reported by users
- Verify all policies are still active

**Quarterly**:
- Review policy definitions for business logic changes
- Audit user role assignments
- Test policies with new user scenarios

**Annually**:
- Full security audit of RLS implementation
- Review helper function performance
- Update documentation with any changes

### Updating Policies

To modify existing policies:

1. Create new SQL file with updated policy definitions
2. Use `DROP POLICY IF EXISTS` before creating new policy
3. Test in development environment first
4. Deploy during maintenance window
5. Verify application functionality after update

---

## File Reference

### SQL Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `enable_production_rls_policies.sql` | Deploy RLS policies | Initial deployment |
| `rollback_production_rls_policies.sql` | Remove RLS policies | Rollback if issues |
| `test_rls_policies.sql` | Validate RLS configuration | After deployment |

### Node.js Scripts

| File | Purpose | Commands |
|------|---------|----------|
| `deploy-rls-policies.js` | Automated deployment tool | `deploy`, `test`, `rollback` |

### Documentation

| File | Purpose |
|------|---------|
| `RLS_IMPLEMENTATION_GUIDE.md` | This document |
| `CLAUDE.md` | Project-level guidance |

---

## Conclusion

Row Level Security provides **database-level access control** for the Air Niugini B767 Pilot Management System. This implementation:

✅ Protects **27 pilots' PII data**
✅ Secures **571 aviation certifications**
✅ Controls access to **system settings**
✅ Enforces **role-based permissions** (admin, manager, authenticated)
✅ Maintains **audit trail compliance**
✅ Supports **operational transparency** (leave scheduling)

**Next Steps**:
1. Deploy RLS policies: `node deploy-rls-policies.js deploy`
2. Run validation tests: `node deploy-rls-policies.js test`
3. Test application with different roles
4. Monitor for 24-48 hours
5. Document any issues or adjustments

**Contact**: Air Niugini Development Team
**Last Updated**: October 9, 2025
**Version**: 1.0.0

---

*This is a living document. Update as RLS policies evolve.*
