# RLS Quick Reference Card

**Air Niugini B767 Pilot Management System**

---

## Quick Commands

```bash
# Deploy RLS policies
node deploy-rls-policies.js deploy

# Test RLS policies
node deploy-rls-policies.js test

# Rollback RLS policies (with confirmation)
node deploy-rls-policies.js rollback
```

---

## Protected Tables (7 Total)

| Table | Records | Sensitivity | Who Can Edit |
|-------|---------|-------------|--------------|
| `pilots` | 27 | HIGH (PII) | Admin, Manager |
| `pilot_checks` | 571 | MEDIUM | Admin, Manager |
| `check_types` | 34 | LOW | Admin only |
| `leave_requests` | 12 | MEDIUM | Admin, Manager |
| `settings` | 3 | HIGH | Admin only |
| `contract_types` | 3 | LOW | Admin only |
| `an_users` | 3 | CRITICAL | Admin only |

---

## Role Permissions

### Admin (`admin@airniugini.com.pg`)
- ✅ Full CRUD on all tables
- ✅ Manage settings
- ✅ Manage users

### Manager (`manager@airniugini.com.pg`, `ops@airniugini.com.pg`)
- ✅ Read all tables (except settings)
- ✅ Edit pilots, certifications, leave requests
- ❌ Cannot create/delete pilots
- ❌ Cannot manage settings

### Authenticated Users
- ✅ Read pilots, certifications, leave requests
- ❌ Cannot edit any data

---

## Helper Functions

```sql
-- Check if current user is admin
SELECT is_admin(); -- Returns true/false

-- Check if current user is admin or manager
SELECT is_admin_or_manager(); -- Returns true/false

-- Get current user role
SELECT get_user_role(); -- Returns 'admin', 'manager', or NULL
```

---

## Policy Naming Pattern

```
{table}_{operation}_{access_level}

Examples:
- pilots_select_all_authenticated
- pilots_insert_admin_only
- pilots_update_admin_or_manager
- pilots_delete_admin_only
```

---

## Testing RLS

### Test as Admin
```javascript
// Login as admin
const { data: { user } } = await supabase.auth.signInWithPassword({
  email: 'admin@airniugini.com.pg',
  password: '[password]'
});

// Should succeed
const { data: pilots } = await supabase.from('pilots').select('*');
const { data: settings } = await supabase.from('settings').select('*');
```

### Test as Manager
```javascript
// Login as manager
const { data: { user } } = await supabase.auth.signInWithPassword({
  email: 'manager@airniugini.com.pg',
  password: '[password]'
});

// Should succeed
const { data: pilots } = await supabase.from('pilots').select('*');

// Should fail (permission denied)
const { error } = await supabase.from('settings').select('*');
```

---

## Troubleshooting

### "permission denied for table pilots"
```sql
-- Check authentication
SELECT auth.uid(), auth.role();

-- Check user role
SELECT * FROM an_users WHERE id = auth.uid();

-- Verify policy exists
SELECT * FROM pg_policies WHERE tablename = 'pilots';
```

### "Could not find the function is_admin"
```bash
# Re-deploy RLS policies
node deploy-rls-policies.js deploy
```

### Application breaks after RLS deployment
```bash
# Immediate rollback
node deploy-rls-policies.js rollback

# Review logs
# Fix policies
# Re-deploy
```

---

## Verification Queries

```sql
-- Check RLS is enabled
SELECT tablename, relrowsecurity
FROM pg_tables pt
JOIN pg_class pc ON pt.tablename = pc.relname
WHERE schemaname = 'public'
  AND tablename IN ('pilots', 'pilot_checks', 'check_types', 'leave_requests', 'settings', 'contract_types', 'an_users');

-- Count policies (should be 28)
SELECT COUNT(*) FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('pilots', 'pilot_checks', 'check_types', 'leave_requests', 'settings', 'contract_types', 'an_users');

-- List all policies
SELECT tablename, policyname, cmd FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `enable_production_rls_policies.sql` | Deploy RLS (main file) |
| `rollback_production_rls_policies.sql` | Remove RLS |
| `test_rls_policies.sql` | Validation tests |
| `deploy-rls-policies.js` | Automation script |
| `RLS_IMPLEMENTATION_GUIDE.md` | Full documentation |

---

## Emergency Rollback

If production breaks:

```bash
# 1. Immediate rollback
node deploy-rls-policies.js rollback

# 2. Verify application works
# Test login and basic operations

# 3. Review error logs
# Check application logs for specific permission errors

# 4. Fix and re-deploy
# Modify policies if needed
# Test in development first
```

---

## Performance Monitoring

```sql
-- Check query performance
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE query LIKE '%pilots%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

Expected overhead:
- SELECT: +1-3ms
- INSERT/UPDATE/DELETE: +2-5ms
- Complex queries: +5-10ms

---

## Security Best Practices

1. ✅ Use service role key for admin operations in backend only
2. ✅ Never expose service role key to client
3. ✅ Test policies with all roles before deployment
4. ✅ Monitor RLS violations in logs
5. ✅ Review policies quarterly

---

**Last Updated**: October 9, 2025
**Total Policies**: 28 (4 per table × 7 tables)
**Helper Functions**: 3 (`is_admin`, `is_admin_or_manager`, `get_user_role`)
