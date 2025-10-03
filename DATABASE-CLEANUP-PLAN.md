# Database Cleanup Plan

## Current Database Tables

### ✅ Production Tables (KEEP - In Active Use)
1. **pilots** (27 rows) - Main pilot data ✅
2. **check_types** (34 rows) - Certification types ✅
3. **pilot_checks** (571 rows) - Pilot certifications ✅
4. **settings** (3 rows) - System settings ✅
5. **contract_types** (3 rows) - Contract classifications ✅
6. **an_users** (3 rows) - User authentication (admin/manager) ✅
7. **leave_requests** (12 rows) - Leave management ✅

### ❌ Legacy Tables (REMOVE - Not Used in Application)
1. **an_pilots** (5 rows) - Legacy development data
2. **an_check_types** (10 rows) - Legacy development data
3. **an_pilot_checks** (18 rows) - Legacy development data
4. **an_leave_requests** (0 rows) - Legacy development data (empty)

## Analysis

**Production Tables:**
- `pilots`, `check_types`, `pilot_checks` - Core production data (27 pilots, 571 certifications)
- `an_users` - User authentication (required, not legacy)
- `leave_requests` - Production leave data (12 records)
- `settings`, `contract_types` - Configuration data

**Legacy Tables to Remove:**
- `an_pilots`, `an_check_types`, `an_pilot_checks` - Old development/testing data
- `an_leave_requests` - Empty legacy table
- These tables were used during initial development but are NOT referenced in current codebase

## Foreign Key Dependencies

**Tables with foreign keys TO legacy tables:**
- `an_leave_requests.pilot_id` → `an_pilots.id`
- `an_leave_requests.reviewed_by` → `an_users.id`
- `an_pilot_checks.pilot_id` → `an_pilots.id`
- `an_pilot_checks.check_type_id` → `an_check_types.id`

**Impact:** No impact on production since legacy tables are not used

## Cleanup Steps

1. **Backup Legacy Data** (just in case)
   ```sql
   -- Export to JSON before deletion
   SELECT json_agg(row_to_json(t)) FROM an_pilots t;
   SELECT json_agg(row_to_json(t)) FROM an_check_types t;
   SELECT json_agg(row_to_json(t)) FROM an_pilot_checks t;
   ```

2. **Drop Legacy Tables** (in correct order to avoid FK constraints)
   ```sql
   DROP TABLE IF EXISTS an_leave_requests CASCADE;
   DROP TABLE IF EXISTS an_pilot_checks CASCADE;
   DROP TABLE IF EXISTS an_pilots CASCADE;
   DROP TABLE IF EXISTS an_check_types CASCADE;
   ```

3. **Verify Application Still Works**
   - Test pilot CRUD operations
   - Test certification management
   - Test leave requests

## Expected Outcome

**Before:**
- 11 tables (7 production + 4 legacy)
- Confusion about which tables to use
- Duplicate/inconsistent data

**After:**
- 7 tables (production only)
- Clear data model
- No legacy confusion

## Risk Assessment

**Risk:** LOW
- Legacy tables have no data dependencies in production code
- Application uses `pilots`, `pilot_checks`, `check_types` (not `an_*` prefixed)
- `an_users` is NOT legacy - it's the active auth table (keeping it)

**Rollback Plan:**
- Backups created before deletion
- Can restore from backups if needed
- Supabase has point-in-time recovery
