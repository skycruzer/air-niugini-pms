# RLS Deployment Checklist

**Air Niugini B767 Pilot Management System**
**Date**: October 9, 2025

Use this checklist to ensure safe and successful RLS deployment.

---

## Pre-Deployment Checklist

### 1. Documentation Review ✅

- [ ] Read `RLS_DEPLOYMENT_SUMMARY.md` (executive overview)
- [ ] Review `RLS_IMPLEMENTATION_GUIDE.md` (detailed guide)
- [ ] Familiarize with `RLS_QUICK_REFERENCE.md` (commands and troubleshooting)

### 2. File Verification ✅

Verify all 7 RLS files exist:

- [ ] `enable_production_rls_policies.sql` (553 lines, 17KB)
- [ ] `rollback_production_rls_policies.sql` (166 lines, 6.1KB)
- [ ] `test_rls_policies.sql` (282 lines, 9.2KB)
- [ ] `deploy-rls-policies.js` (278 lines, 8.5KB)
- [ ] `RLS_IMPLEMENTATION_GUIDE.md` (17KB)
- [ ] `RLS_QUICK_REFERENCE.md` (5KB)
- [ ] `RLS_DEPLOYMENT_SUMMARY.md` (13KB)

```bash
# Verify files exist
ls -lh enable_production_rls_policies.sql \
       rollback_production_rls_policies.sql \
       test_rls_policies.sql \
       deploy-rls-policies.js \
       RLS_*.md
```

### 3. Environment Verification ✅

- [ ] `.env.local` file exists and contains:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)
  - [ ] `SUPABASE_PROJECT_ID`

```bash
# Test environment variables loaded
node -e "require('dotenv').config({path:'.env.local'}); console.log('✅ URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL); console.log('✅ Service Key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);"
```

### 4. Database Connection Test ✅

- [ ] Test database connection:

```bash
node test-connection.js
```

Expected output:
```
✅ Connection successful
✅ Tables accessible: pilots, pilot_checks, check_types, etc.
```

### 5. Database Backup ✅

**CRITICAL**: Always backup before schema changes!

- [ ] Backup database via Supabase Dashboard
- [ ] Export current table structures
- [ ] Document current RLS status (if any)

```bash
# Verify current RLS status (should be DISABLED)
# Via Supabase SQL Editor:
SELECT tablename, relrowsecurity
FROM pg_tables pt
JOIN pg_class pc ON pt.tablename = pc.relname
WHERE schemaname = 'public'
  AND tablename IN ('pilots', 'pilot_checks', 'check_types', 'leave_requests', 'settings', 'contract_types', 'an_users');
```

### 6. User Credentials Ready ✅

- [ ] Admin credentials available: `admin@airniugini.com.pg`
- [ ] Manager credentials available: `manager@airniugini.com.pg`
- [ ] Test user credentials available (if applicable)

---

## Deployment Checklist

### Phase 1: Deploy RLS Policies

- [ ] Navigate to project directory:
```bash
cd "/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"
```

- [ ] Execute deployment script:
```bash
node deploy-rls-policies.js deploy
```

- [ ] Verify deployment output shows:
  - [ ] ✅ Row Level Security enabled on all 7 production tables
  - [ ] ✅ 28 policies created (4 per table)
  - [ ] ✅ 3 helper functions created
  - [ ] ✅ No critical errors

- [ ] Review any warnings (expected if policies already exist)

**Expected Duration**: 2-5 minutes

### Phase 2: Validate RLS Policies

- [ ] Run validation tests:
```bash
node deploy-rls-policies.js test
```

- [ ] Verify test results show:
  - [ ] ✅ RLS enabled: 7/7 tables
  - [ ] ✅ Policies created: 28/28
  - [ ] ✅ Helper functions: 3/3
  - [ ] ✅ All validation checks passed

**Expected Duration**: 1-2 minutes

### Phase 3: Application Testing - Admin Role

- [ ] Open application in browser: `http://localhost:3001`
- [ ] Login as admin: `admin@airniugini.com.pg`

Test each feature:
- [ ] Dashboard loads successfully
- [ ] Navigate to Pilots page - all pilots visible
- [ ] Create new pilot - operation succeeds
- [ ] Edit existing pilot - operation succeeds
- [ ] Navigate to Certifications page - all certifications visible
- [ ] Update certification expiry date - operation succeeds
- [ ] Navigate to Leave Management - all requests visible
- [ ] Approve/reject leave request - operation succeeds
- [ ] Navigate to Settings - page loads and data visible
- [ ] Update setting - operation succeeds
- [ ] Check browser console - no RLS errors

**Expected Duration**: 10-15 minutes

### Phase 4: Application Testing - Manager Role

- [ ] Logout from admin account
- [ ] Login as manager: `manager@airniugini.com.pg`

Test each feature:
- [ ] Dashboard loads successfully
- [ ] Navigate to Pilots page - all pilots visible
- [ ] Try to create new pilot - operation fails gracefully (expected)
- [ ] Edit existing pilot - operation succeeds
- [ ] Navigate to Certifications page - all certifications visible
- [ ] Update certification - operation succeeds
- [ ] Navigate to Leave Management - all requests visible
- [ ] Approve leave request - operation succeeds
- [ ] Try to navigate to Settings - access denied (expected)
- [ ] Check browser console - no unexpected RLS errors

**Expected Duration**: 10-15 minutes

### Phase 5: Performance Monitoring

- [ ] Monitor query performance in Supabase Dashboard
- [ ] Check for slow queries (threshold: >100ms)
- [ ] Verify dashboard load time is acceptable
- [ ] Test pagination and filtering still work

**Acceptable Performance**:
- Dashboard load: < 2 seconds
- Pilot list load: < 1 second
- Certification queries: < 500ms
- Individual queries: < 100ms

**Expected Duration**: 5 minutes

---

## Post-Deployment Checklist

### Immediate (First Hour)

- [ ] Monitor application logs for RLS errors
- [ ] Check Supabase logs for permission denied errors
- [ ] Test with different user accounts
- [ ] Verify no user complaints

### Short-Term (First 24 Hours)

- [ ] Collect user feedback
- [ ] Monitor query performance trends
- [ ] Log any issues encountered
- [ ] Document any workarounds needed

### Medium-Term (First Week)

- [ ] Review all logged issues
- [ ] Categorize issues by severity
- [ ] Plan fixes if needed
- [ ] Update documentation with findings

---

## Rollback Checklist (If Needed)

**Use only if critical issues occur!**

### When to Rollback

Rollback if:
- [ ] Application becomes unusable
- [ ] Critical features break
- [ ] Performance degradation > 50%
- [ ] Data access issues for legitimate users

### Rollback Procedure

1. [ ] Execute rollback script:
```bash
node deploy-rls-policies.js rollback
```

2. [ ] Confirm rollback when prompted (type "yes")

3. [ ] Verify rollback output shows:
   - [ ] ✅ RLS disabled on all 7 tables
   - [ ] ✅ All 28 policies removed
   - [ ] ✅ Verification passed

4. [ ] Test application functionality restored:
   - [ ] Login as admin
   - [ ] Navigate to key pages
   - [ ] Verify CRUD operations work
   - [ ] Check no errors in console

5. [ ] Document rollback reason:
   - [ ] What broke?
   - [ ] What error messages occurred?
   - [ ] What was the impact?

6. [ ] Plan remediation:
   - [ ] Review RLS policies
   - [ ] Identify problematic policies
   - [ ] Test fixes in development
   - [ ] Schedule re-deployment

**Expected Duration**: 5-10 minutes

---

## Success Criteria

### Technical Success ✅

- [ ] RLS enabled on all 7 tables
- [ ] 28 policies active and functional
- [ ] 3 helper functions operational
- [ ] No SQL errors during deployment
- [ ] Query performance acceptable (<10ms overhead)

### Functional Success ✅

- [ ] Admin can access all features
- [ ] Manager can edit pilots and certifications
- [ ] Manager cannot access settings (expected restriction)
- [ ] All users can view public data
- [ ] No unexpected permission errors
- [ ] Application remains responsive

### Security Success ✅

- [ ] PII data protected (pilots table)
- [ ] Settings access restricted to admin
- [ ] User profiles isolated
- [ ] No data leaks in error messages
- [ ] Permission checks working at database level

---

## Sign-Off

### Deployment Team

**Deployed by**: _______________________
**Date**: _______________________
**Time**: _______________________

### Validation

**Validated by**: _______________________
**Date**: _______________________
**Time**: _______________________

### Approval

**Approved by**: _______________________
**Date**: _______________________
**Time**: _______________________

---

## Notes & Issues

Use this section to document any issues, warnings, or observations during deployment:

```
Date/Time: __________
Issue: _______________________________________________
Severity: [ ] Low  [ ] Medium  [ ] High  [ ] Critical
Resolution: __________________________________________
```

```
Date/Time: __________
Issue: _______________________________________________
Severity: [ ] Low  [ ] Medium  [ ] High  [ ] Critical
Resolution: __________________________________________
```

```
Date/Time: __________
Issue: _______________________________________________
Severity: [ ] Low  [ ] Medium  [ ] High  [ ] Critical
Resolution: __________________________________________
```

---

## References

- **Deployment Summary**: `RLS_DEPLOYMENT_SUMMARY.md`
- **Implementation Guide**: `RLS_IMPLEMENTATION_GUIDE.md`
- **Quick Reference**: `RLS_QUICK_REFERENCE.md`
- **Main Deployment File**: `enable_production_rls_policies.sql`
- **Rollback File**: `rollback_production_rls_policies.sql`
- **Test File**: `test_rls_policies.sql`
- **Automation Script**: `deploy-rls-policies.js`

---

**Air Niugini B767 Pilot Management System**
*Row Level Security Deployment Checklist v1.0*
*October 9, 2025*
