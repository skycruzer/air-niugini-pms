# Database Optimization Deployment Guide

## ✅ Already Deployed via MCP (Completed)

The following optimizations have been successfully deployed to your Supabase database:

1. **Fixed SECURITY DEFINER views** - Removed security vulnerability from views
2. **Added RLS policies to document_access_log** - Fixed inaccessible table
3. **Fixed update_updated_at_column() function** - Added explicit search_path
4. **Database maintenance** - Ran VACUUM FULL on settings table (85% dead rows cleaned)
5. **Performance indexes** - Added 8 strategic indexes to digital_forms, document_categories, leave_requests

## 📋 Pending Deployments (Manual Execution Required)

The following 2 SQL files need to be executed manually in the Supabase SQL Editor:

### 1. pilot_checks_overview View
**File**: `create_pilot_checks_overview_view.sql`
**Purpose**: Optimized view for pilot certification queries
**Impact**: High - reduces join complexity for common queries

### 2. Dashboard Metrics Refresh Functions
**File**: `create_dashboard_metrics_refresh.sql`
**Purpose**: Automated dashboard statistics refresh
**Impact**: Medium - improves dashboard query performance over time

## 🚀 Deployment Instructions

### Option A: Supabase SQL Editor (Recommended)

1. **Navigate to Supabase SQL Editor**:
   - Open: https://supabase.com/dashboard/project/wgdmgvonqysflwdiiols/sql
   - Or: Supabase Dashboard → Project → SQL Editor

2. **Execute pilot_checks_overview view**:
   ```bash
   # Open the file and copy its contents:
   cat create_pilot_checks_overview_view.sql
   ```
   - Paste the entire SQL content into the SQL Editor
   - Click "Run" button
   - Verify success message

3. **Execute dashboard metrics refresh**:
   ```bash
   # Open the file and copy its contents:
   cat create_dashboard_metrics_refresh.sql
   ```
   - Paste the entire SQL content into the SQL Editor
   - Click "Run" button
   - Verify success message

### Option B: Using psql Command Line

If you have your Supabase database password:

```bash
# Navigate to project directory
cd "/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"

# Execute view creation
psql -h db.wgdmgvonqysflwdiiols.supabase.co \
     -U postgres \
     -d postgres \
     -p 5432 \
     -f create_pilot_checks_overview_view.sql

# Execute metrics refresh function
psql -h db.wgdmgvonqysflwdiiols.supabase.co \
     -U postgres \
     -d postgres \
     -p 5432 \
     -f create_dashboard_metrics_refresh.sql
```

**Note**: You'll need your Supabase database password. Find it in:
- Supabase Dashboard → Project Settings → Database → Connection string

## 🔍 Verification Steps

After deployment, verify the changes:

### 1. Verify pilot_checks_overview View

```sql
-- Check view exists and returns data
SELECT COUNT(*) as total_checks FROM pilot_checks_overview;

-- Sample query (should be fast)
SELECT * FROM pilot_checks_overview
WHERE certification_status = 'EXPIRING_SOON'
LIMIT 5;
```

### 2. Verify Dashboard Metrics Functions

```sql
-- Test the detailed metrics refresh function
SELECT * FROM refresh_dashboard_metrics();

-- Test the simple function
SELECT refresh_dashboard_metrics_simple();
```

## 📊 Expected Results

After deployment, you should see:

1. **Faster Certification Queries**:
   - Dashboard certification widgets load faster
   - Expiring certifications page more responsive
   - Pilot detail pages with certification status load quicker

2. **Dashboard Metrics Refresh**:
   - Can now manually refresh dashboard statistics
   - Can schedule automated refreshes via pg_cron
   - Query planner has up-to-date statistics for better performance

## 📈 Performance Improvements Summary

| Optimization | Status | Impact |
|--------------|--------|--------|
| Security Fixes (3 items) | ✅ Deployed | High - prevented vulnerabilities |
| Database Maintenance | ✅ Deployed | High - cleaned 85% dead rows |
| Performance Indexes (8 indexes) | ✅ Deployed | Medium-High - faster queries |
| pilot_checks_overview View | ⏳ Pending | Medium-High - simplified queries |
| Metrics Refresh Functions | ⏳ Pending | Medium - sustained performance |

## 🎯 Optional Next Steps

After deploying the pending optimizations, consider these additional improvements:

1. **Enable Leaked Password Protection**:
   - Navigate to: Authentication → Providers → Email → Password protection
   - Enable: "Check for leaked passwords"

2. **Enable Additional MFA Options**:
   - Navigate to: Authentication → Providers
   - Enable: Phone, TOTP, or WebAuthn

3. **Schedule Metrics Refresh** (if pg_cron enabled):
   ```sql
   -- Schedule daily refresh at 2 AM UTC
   SELECT cron.schedule(
       'refresh-dashboard-metrics',
       '0 2 * * *',
       'SELECT refresh_dashboard_metrics_simple();'
   );
   ```

4. **Monitor Index Usage**:
   ```sql
   -- Check if new indexes are being used
   SELECT
       schemaname,
       tablename,
       indexname,
       idx_scan,
       idx_tup_read,
       idx_tup_fetch
   FROM pg_stat_user_indexes
   WHERE indexname LIKE 'idx_%'
   ORDER BY idx_scan DESC;
   ```

## 🆘 Troubleshooting

### Issue: "Permission denied" error
**Solution**: Make sure you're using the database password, not the service role key

### Issue: "Relation already exists" error
**Solution**: The view/function already exists. You can safely ignore or use `DROP ... IF EXISTS` first

### Issue: View returns no data
**Solution**: Check that pilots table has records with `is_active = true`

## 📞 Support

If you encounter any issues:
1. Check the Supabase logs: Dashboard → Logs → Database
2. Verify environment variables in `.env.local`
3. Ensure you're using the correct project: wgdmgvonqysflwdiiols

---

**Performance Optimization Phase Complete**
*Next: Deploy pending SQL files to fully optimize your database*
