# Phase 1.1 - Database Cleanup & Optimization Deployment Guide

**Air Niugini B767 Pilot Management System**
**Created:** 2025-09-30
**Phase:** 1.1 - Database Cleanup & Optimization
**Status:** Ready for Deployment

---

## Executive Summary

This deployment implements comprehensive database optimization and cleanup for the Air Niugini PMS. The migration includes:

- ✅ Removal of legacy development tables (33 records preserved in backups)
- ✅ Strategic performance indexes (20 indexes across 6 tables)
- ✅ Soft delete pattern implementation (5 tables with recovery capability)
- ✅ Comprehensive audit trail system (automatic logging of all changes)

**Estimated Downtime:** 5-10 minutes
**Rollback Available:** Yes, all migrations include rollback scripts
**Data Loss Risk:** None (all data backed up before removal)

---

## Pre-Deployment Checklist

### 1. Environment Verification

```bash
# Navigate to project directory
cd "/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"

# Verify Node.js version
node --version  # Should be >= 18.0.0

# Verify Supabase connection
node test-connection.js

# Check current database state
npm run db:validate
```

### 2. Backup Current Database

```bash
# Create a complete database backup (CRITICAL!)
# This backup is separate from the migration backups

# Using Supabase CLI (recommended)
supabase db dump -f backup-pre-phase-1-1-$(date +%Y%m%d).sql

# Or use your preferred backup method
# Verify backup file size > 0
ls -lh backup-pre-phase-1-1-*.sql
```

### 3. Code Deployment

```bash
# Ensure service layer updates are deployed
git status
git add src/lib/supabase-service.ts
git commit -m "Update service layer to use production tables"
git push origin main

# Wait for Vercel deployment to complete
# Verify at: https://vercel.com/your-project/deployments
```

### 4. Maintenance Mode (Optional but Recommended)

```bash
# Enable maintenance mode to prevent data changes during migration
# Option 1: Use Vercel environment variable
vercel env add MAINTENANCE_MODE true

# Option 2: Add maintenance banner in app
# This prevents users from making changes during migration
```

---

## Migration Execution Order

### Migration 0: Backup Legacy Tables (MANDATORY)

**File:** `000_backup_legacy_tables.sql`
**Purpose:** Create archive copies of legacy tables before removal
**Duration:** ~30 seconds
**Reversible:** N/A (creates backups)

```bash
# Execute backup script
node -e "
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const sql = fs.readFileSync('000_backup_legacy_tables.sql', 'utf8');
supabase.rpc('exec_sql', { sql_string: sql })
  .then(({ data, error }) => {
    if (error) throw error;
    console.log('Backup completed:', data);
  });
"
```

**Or use MCP Supabase tools:**

```bash
# Read backup script
cat 000_backup_legacy_tables.sql

# Execute via MCP apply_migration tool
# (Use Claude to execute this via MCP)
```

**Verification:**

```sql
-- Verify backups were created successfully
SELECT
  table_name,
  COUNT(*) as record_count
FROM archive.an_pilots_backup_2025_09_30
UNION ALL
SELECT 'an_pilot_checks', COUNT(*) FROM archive.an_pilot_checks_backup_2025_09_30
UNION ALL
SELECT 'an_check_types', COUNT(*) FROM archive.an_check_types_backup_2025_09_30
UNION ALL
SELECT 'an_leave_requests', COUNT(*) FROM archive.an_leave_requests_backup_2025_09_30;

-- Expected results: 5, 18, 10, 0 records
```

---

### Migration 1: Remove Legacy Tables

**File:** `001_remove_legacy_tables.sql`
**Purpose:** Drop legacy an\_\* tables after backup
**Duration:** ~1 minute
**Reversible:** Yes (restore from archive schema)

**Prerequisites:**

- ✅ Migration 0 (backup) completed successfully
- ✅ Service layer code updated and deployed
- ✅ No active queries against legacy tables

```bash
# Execute via Node.js
node execute-migration.js 001_remove_legacy_tables.sql

# Or execute SQL directly
# (Paste contents of 001_remove_legacy_tables.sql into Supabase SQL Editor)
```

**Verification:**

```sql
-- Check legacy tables are removed (except an_users which is kept)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'an_%'
  AND table_name NOT IN ('an_users');

-- Should return 0 rows

-- Verify production tables are intact
SELECT
  'pilots' as table_name, COUNT(*) as count FROM pilots
UNION ALL
SELECT 'pilot_checks', COUNT(*) FROM pilot_checks
UNION ALL
SELECT 'check_types', COUNT(*) FROM check_types
UNION ALL
SELECT 'leave_requests', COUNT(*) FROM leave_requests;

-- Expected: 27, 556+, 34+, 11+ records
```

**Rollback (If Needed):**

```sql
-- Restore from backup (emergency only)
CREATE TABLE public.an_pilots AS
SELECT * FROM archive.an_pilots_backup_2025_09_30;

CREATE TABLE public.an_pilot_checks AS
SELECT * FROM archive.an_pilot_checks_backup_2025_09_30;

CREATE TABLE public.an_check_types AS
SELECT * FROM archive.an_check_types_backup_2025_09_30;

CREATE TABLE public.an_leave_requests AS
SELECT * FROM archive.an_leave_requests_backup_2025_09_30;

-- Then redeploy previous application version
```

---

### Migration 2: Add Performance Indexes

**File:** `002_add_indexes.sql`
**Purpose:** Create strategic indexes for query optimization
**Duration:** ~2 minutes
**Reversible:** Yes (indexes can be dropped)

```bash
# Execute index creation
node execute-migration.js 002_add_indexes.sql
```

**Verification:**

```sql
-- Count new indexes created
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Should show 20 custom indexes

-- Check index usage monitoring view
SELECT * FROM index_usage_stats LIMIT 10;
```

**Performance Testing:**

```sql
-- Test query performance improvements

-- Before: ~200ms, After: ~20ms (expected)
EXPLAIN ANALYZE
SELECT * FROM pilots WHERE employee_id = 'PX007';

-- Before: ~500ms, After: ~50ms (expected)
EXPLAIN ANALYZE
SELECT * FROM pilot_checks
WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days';

-- Before: ~300ms, After: ~30ms (expected)
EXPLAIN ANALYZE
SELECT * FROM leave_requests
WHERE pilot_id = 'some-uuid' AND roster_period = 'RP11/2025';
```

**Rollback (If Needed):**

```sql
-- Drop all custom indexes (see rollback section in 002_add_indexes.sql)
-- Copy rollback script from migration file
```

---

### Migration 3: Implement Soft Delete

**File:** `003_soft_delete.sql`
**Purpose:** Add soft delete capability with recovery functions
**Duration:** ~2 minutes
**Reversible:** Yes (columns and functions can be removed)

```bash
# Execute soft delete implementation
node execute-migration.js 003_soft_delete.sql
```

**Verification:**

```sql
-- Verify deleted_at columns added
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'deleted_at'
  AND table_name IN ('pilots', 'pilot_checks', 'leave_requests', 'check_types', 'an_users')
ORDER BY table_name;

-- Should show 5 tables with deleted_at column

-- Test soft delete functions
SELECT soft_delete_pilot('test-uuid');  -- Should return false (uuid doesn't exist)
SELECT restore_pilot('test-uuid');      -- Should return false (uuid doesn't exist)

-- Verify views created
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('active_pilots', 'active_pilot_checks', 'active_leave_requests',
                      'recently_deleted_pilots', 'recently_deleted_pilot_checks',
                      'recently_deleted_leave_requests')
ORDER BY table_name;

-- Should show 6 views
```

**Testing Soft Delete:**

```sql
-- Test soft delete on a pilot (CAREFUL - use test data only!)
-- Don't run this on production until fully tested!

-- 1. Soft delete a test record
UPDATE pilots SET deleted_at = CURRENT_TIMESTAMP WHERE employee_id = 'TEST001';

-- 2. Verify it's filtered from active view
SELECT COUNT(*) FROM active_pilots WHERE employee_id = 'TEST001';  -- Should be 0

-- 3. Verify it appears in deleted view
SELECT * FROM recently_deleted_pilots WHERE employee_id = 'TEST001';  -- Should show record

-- 4. Restore the record
UPDATE pilots SET deleted_at = NULL WHERE employee_id = 'TEST001';

-- 5. Verify it's back in active view
SELECT COUNT(*) FROM active_pilots WHERE employee_id = 'TEST001';  -- Should be 1
```

**Rollback (If Needed):**

```sql
-- Remove soft delete functionality (see rollback section in 003_soft_delete.sql)
```

---

### Migration 4: Implement Audit Trail

**File:** `004_audit_trail.sql`
**Purpose:** Create comprehensive audit logging system
**Duration:** ~2 minutes
**Reversible:** Yes (triggers and table can be removed)

```bash
# Execute audit trail implementation
node execute-migration.js 004_audit_trail.sql
```

**Verification:**

```sql
-- Verify audit_logs table created
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'audit_logs') as column_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'audit_logs';

-- Should show 1 table with 15+ columns

-- Verify audit triggers installed
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'audit_%_trigger'
ORDER BY event_object_table;

-- Should show 5 triggers

-- Test audit logging (make a test change)
UPDATE pilots SET updated_at = CURRENT_TIMESTAMP WHERE employee_id = 'PX001';

-- Check if audit log was created
SELECT * FROM audit_logs
ORDER BY created_at DESC
LIMIT 5;

-- Should show recent audit entry

-- Verify audit views
SELECT * FROM recent_audit_activity LIMIT 10;
SELECT * FROM user_action_summary;
```

**Testing Audit Trail:**

```sql
-- Test various audit scenarios

-- 1. INSERT operation
INSERT INTO check_types (check_code, check_description, category)
VALUES ('TEST_CHECK', 'Test Check Type', 'Testing');

-- 2. UPDATE operation
UPDATE check_types
SET check_description = 'Updated Test Check Type'
WHERE check_code = 'TEST_CHECK';

-- 3. Verify audit logs captured both operations
SELECT
  action,
  table_name,
  description,
  new_data->>'check_code' as check_code,
  created_at_png
FROM audit_logs
WHERE table_name = 'check_types'
  AND (new_data->>'check_code') = 'TEST_CHECK'
ORDER BY created_at DESC;

-- Should show 2 entries (INSERT and UPDATE)

-- 4. Cleanup test data
DELETE FROM check_types WHERE check_code = 'TEST_CHECK';

-- 5. Verify DELETE was also audited
SELECT * FROM audit_logs
WHERE table_name = 'check_types'
  AND action = 'DELETE'
ORDER BY created_at DESC
LIMIT 1;
```

**Rollback (If Needed):**

```sql
-- Remove audit trail system (see rollback section in 004_audit_trail.sql)
```

---

## Post-Deployment Verification

### 1. Database Health Check

```sql
-- Run comprehensive health check
SELECT
  'pilots' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_records,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_records
FROM pilots
UNION ALL
SELECT 'pilot_checks', COUNT(*), COUNT(*) FILTER (WHERE deleted_at IS NULL), COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) FROM pilot_checks
UNION ALL
SELECT 'leave_requests', COUNT(*), COUNT(*) FILTER (WHERE deleted_at IS NULL), COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) FROM leave_requests
UNION ALL
SELECT 'check_types', COUNT(*), COUNT(*) FILTER (WHERE deleted_at IS NULL), COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) FROM check_types;

-- Expected: All deleted_records should be 0 (no deletions yet)
```

### 2. Index Performance Check

```sql
-- Monitor index usage after deployment
SELECT * FROM index_usage_stats
ORDER BY index_scans DESC
LIMIT 20;

-- Run ANALYZE to update statistics
ANALYZE pilots;
ANALYZE pilot_checks;
ANALYZE leave_requests;
ANALYZE check_types;
```

### 3. Application Testing

```bash
# Start development server
npm run dev

# Test critical user flows:
# 1. Login as admin/manager
# 2. View dashboard (verify statistics load quickly)
# 3. View pilot list (verify performance improvement)
# 4. View certification expiry page (should be faster)
# 5. Create/edit pilot (verify audit logs capture changes)
# 6. Test delete pilot (verify soft delete works)
```

### 4. Audit Log Verification

```sql
-- Check recent audit activity
SELECT * FROM recent_audit_activity LIMIT 20;

-- Check user action summary
SELECT * FROM user_action_summary;

-- Verify pilot audit trail
SELECT * FROM pilot_audit_trail LIMIT 10;

-- Verify certification audit trail
SELECT * FROM certification_audit_trail LIMIT 10;
```

### 5. Performance Benchmarks

```bash
# Run performance tests and compare with baseline

# Dashboard load time: Target < 2 seconds
# Pilot list page: Target < 1 second
# Certification expiry page: Target < 1.5 seconds
# Pilot detail page: Target < 800ms
```

---

## Service Layer Integration

### Update Required Services

The following files have been updated and should be deployed:

1. **src/lib/supabase-service.ts** - Updated to use production tables

### Code Changes Summary

```typescript
// BEFORE (using legacy tables)
.from('an_pilots')
.from('an_pilot_checks')
.from('an_check_types')
.from('an_pilot_checks_overview')
.from('an_expiring_checks')

// AFTER (using production tables)
.from('pilots')
.from('pilot_checks')
.from('check_types')
.from('pilot_checks_overview')
.from('expiring_checks')
```

### Soft Delete Integration

Update services to use soft delete functions:

```typescript
// DELETE operation (old way)
await supabase.from('pilots').delete().eq('id', pilotId);

// SOFT DELETE (new way - recommended)
await supabase.rpc('soft_delete_pilot', { pilot_uuid: pilotId });

// Or use direct update
await supabase.from('pilots').update({ deleted_at: new Date().toISOString() }).eq('id', pilotId);

// RESTORE deleted record
await supabase.rpc('restore_pilot', { pilot_uuid: pilotId });
```

### Audit Trail Integration

Set user context for audit logging:

```typescript
// In your API routes or server actions
import { getSupabaseAdmin } from '@/lib/supabase';

export async function updatePilot(pilotId: string, data: any) {
  const supabase = getSupabaseAdmin();

  // Set user context for audit trail
  const user = await getCurrentUser();
  await supabase.rpc('set_config', {
    setting: 'app.current_user_email',
    value: user.email,
    is_local: true,
  });

  // Perform update - audit trail will automatically log
  const result = await supabase.from('pilots').update(data).eq('id', pilotId);

  return result;
}
```

---

## Monitoring & Maintenance

### Daily Monitoring

```sql
-- Check audit log growth
SELECT
  COUNT(*) as total_logs,
  COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours') as logs_last_24h,
  pg_size_pretty(pg_total_relation_size('audit_logs')) as table_size
FROM audit_logs;

-- Check index usage
SELECT * FROM index_usage_stats
WHERE index_scans = 0
ORDER BY index_size DESC;

-- Check for deleted records
SELECT
  'pilots' as table_name,
  COUNT(*) as deleted_count
FROM pilots
WHERE deleted_at IS NOT NULL
UNION ALL
SELECT 'pilot_checks', COUNT(*) FROM pilot_checks WHERE deleted_at IS NOT NULL
UNION ALL
SELECT 'leave_requests', COUNT(*) FROM leave_requests WHERE deleted_at IS NOT NULL;
```

### Weekly Maintenance

```sql
-- Update table statistics
ANALYZE pilots;
ANALYZE pilot_checks;
ANALYZE leave_requests;
ANALYZE check_types;
ANALYZE audit_logs;

-- Review audit log retention
SELECT cleanup_old_audit_logs(365);  -- Keep 1 year of logs

-- Check database size
SELECT
  pg_size_pretty(pg_database_size(current_database())) as database_size,
  pg_size_pretty(pg_total_relation_size('audit_logs')) as audit_logs_size,
  pg_size_pretty(pg_total_relation_size('pilot_checks')) as pilot_checks_size;
```

### Monthly Maintenance

```bash
# Run comprehensive database backup
supabase db dump -f monthly-backup-$(date +%Y%m%d).sql

# Archive old audit logs (if needed)
# Export audit logs older than 90 days to file storage

# Review index effectiveness
# Check index_usage_stats and remove unused indexes
```

---

## Troubleshooting

### Issue: Migration fails with foreign key constraint error

**Solution:**

```sql
-- Check for active foreign key constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name LIKE 'an_%';

-- Drop foreign keys manually if needed, then retry migration
```

### Issue: Slow query performance after index creation

**Solution:**

```sql
-- Force statistics update
ANALYZE VERBOSE pilots;
ANALYZE VERBOSE pilot_checks;
ANALYZE VERBOSE leave_requests;

-- Check if indexes are being used
EXPLAIN ANALYZE SELECT * FROM pilots WHERE employee_id = 'PX001';

-- If index not used, rebuild it
REINDEX INDEX idx_pilots_employee_id;
```

### Issue: Audit logs table growing too large

**Solution:**

```sql
-- Check current size
SELECT pg_size_pretty(pg_total_relation_size('audit_logs'));

-- Clean up old logs
SELECT cleanup_old_audit_logs(180);  -- Keep 6 months instead of 1 year

-- Or manually archive
CREATE TABLE archive.audit_logs_archive_$(date +%Y%m) AS
SELECT * FROM audit_logs
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';

DELETE FROM audit_logs
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';

VACUUM FULL audit_logs;
```

### Issue: Service layer still references legacy tables

**Solution:**

```bash
# Search for any remaining references
grep -r "an_pilots\|an_pilot_checks\|an_check_types" src/

# Update and redeploy
git add .
git commit -m "Fix: Remove remaining legacy table references"
git push origin main
```

---

## Rollback Procedures

### Complete Rollback (Emergency)

If you need to completely rollback all Phase 1.1 changes:

```sql
-- Step 1: Drop audit trail system
-- (Copy from 004_audit_trail.sql rollback section)

-- Step 2: Remove soft delete functionality
-- (Copy from 003_soft_delete.sql rollback section)

-- Step 3: Drop performance indexes
-- (Copy from 002_add_indexes.sql rollback section)

-- Step 4: Restore legacy tables
-- (Copy from 001_remove_legacy_tables.sql rollback section)

-- Step 5: Redeploy previous application version
git checkout previous-commit-hash
git push origin main --force
```

### Partial Rollback

To rollback individual migrations, see the rollback sections in each migration file.

---

## Performance Metrics

### Expected Improvements

| Query Type         | Before | After    | Improvement |
| ------------------ | ------ | -------- | ----------- |
| Dashboard load     | 3-5s   | 0.8-1.2s | 70-75%      |
| Pilot lookup by ID | 200ms  | 20ms     | 90%         |
| Expiring checks    | 800ms  | 80ms     | 90%         |
| Leave requests     | 300ms  | 30ms     | 90%         |
| Certification list | 1.5s   | 200ms    | 87%         |

### Database Size Impact

- **Before Phase 1.1:** ~150 MB
- **After Phase 1.1:** ~155 MB (+5 MB for audit logs and indexes)
- **Monthly Growth:** +2-5 MB (audit logs)

---

## Success Criteria

Phase 1.1 is considered successful when:

- ✅ All 4 migrations executed without errors
- ✅ All verification queries pass
- ✅ Application loads and functions correctly
- ✅ Dashboard performance improved by >50%
- ✅ Audit logs capturing all changes
- ✅ Soft delete functions working
- ✅ No data loss (27 pilots, 556+ checks intact)
- ✅ All backups verified and accessible

---

## Next Steps

After successful Phase 1.1 deployment:

1. **Monitor Performance:** Track query performance for 7 days
2. **User Feedback:** Gather feedback on perceived speed improvements
3. **Audit Review:** Review audit logs weekly for unusual activity
4. **Phase 1.2 Planning:** Begin planning next optimization phase
5. **Documentation:** Update system documentation with new features

---

## Support & Contact

**Project Lead:** Sky Cruzer
**Database Admin:** [Contact Info]
**Deployment Date:** 2025-09-30
**Phase:** 1.1 - Database Cleanup & Optimization

For issues or questions:

- Review this deployment guide
- Check migration SQL files for detailed comments
- Review rollback procedures if problems occur
- Contact database administrator for assistance

---

## Appendix A: Migration File Summary

| File                         | Purpose                 | Duration | Rollback | Status   |
| ---------------------------- | ----------------------- | -------- | -------- | -------- |
| 000_backup_legacy_tables.sql | Backup legacy data      | 30s      | N/A      | ✅ Ready |
| 001_remove_legacy_tables.sql | Remove legacy tables    | 1m       | Yes      | ✅ Ready |
| 002_add_indexes.sql          | Add performance indexes | 2m       | Yes      | ✅ Ready |
| 003_soft_delete.sql          | Implement soft delete   | 2m       | Yes      | ✅ Ready |
| 004_audit_trail.sql          | Add audit logging       | 2m       | Yes      | ✅ Ready |

**Total Estimated Time:** 7.5 minutes
**Rollback Available:** Yes (all migrations)
**Data Loss Risk:** None (full backups created)

---

## Appendix B: Quick Reference Commands

```bash
# Navigate to project
cd "/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"

# Test database connection
node test-connection.js

# Execute migration (replace XX with migration number)
node execute-migration.js 00X_migration_name.sql

# Start development server
npm run dev

# Run production build
npm run build && npm start

# Check deployment status
vercel --prod

# Create backup
supabase db dump -f backup-$(date +%Y%m%d).sql
```

---

**End of Phase 1.1 Deployment Guide**

**Status:** ✅ Ready for Deployment
**Created:** 2025-09-30
**Version:** 1.0
