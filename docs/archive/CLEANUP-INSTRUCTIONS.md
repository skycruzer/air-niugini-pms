# Legacy Table Cleanup - Execution Instructions

## ⚠️ IMPORTANT: Read Before Proceeding

This cleanup will **permanently delete** 4 legacy tables that are no longer used:

- `an_leave_requests` (0 rows - empty)
- `an_pilot_checks` (18 rows - legacy dev data)
- `an_pilots` (5 rows - legacy dev data)
- `an_check_types` (10 rows - legacy dev data)

**✅ SAFE TO DELETE:** No application code uses these tables.

**✅ KEEPING:** `an_users` (3 rows) - This is the ACTIVE authentication table, NOT legacy!

---

## Step 1: Execute SQL in Supabase Dashboard

1. **Open Supabase SQL Editor:**

   👉 https://supabase.com/dashboard/project/wgdmgvonqysflwdiiols/sql/new

2. **Copy and paste this SQL:**

```sql
-- Air Niugini PMS - Legacy Table Cleanup
-- Execution Date: 2025-10-03
-- Remove unused an_* prefixed legacy development tables

DROP TABLE IF EXISTS an_leave_requests CASCADE;
DROP TABLE IF EXISTS an_pilot_checks CASCADE;
DROP TABLE IF EXISTS an_pilots CASCADE;
DROP TABLE IF EXISTS an_check_types CASCADE;
```

3. **Click "Run"** (or press Ctrl/Cmd + Enter)

4. **You should see:**
   ```
   Success. No rows returned
   ```

---

## Step 2: Verify the Cleanup

Run the verification script to confirm everything worked:

```bash
cd "/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"
node verify-cleanup.js
```

**Expected output:**

```
✅ CLEANUP SUCCESSFUL!

All legacy tables removed:
  • an_leave_requests ❌
  • an_pilot_checks ❌
  • an_pilots ❌
  • an_check_types ❌

All production tables intact:
  • pilots (27 records) ✅
  • pilot_checks (571 records) ✅
  • check_types (34 records) ✅
  • an_users (3 records) ✅
  • leave_requests (12 records) ✅
  • settings (3 records) ✅
  • contract_types (3 records) ✅

🎉 Database cleanup complete and verified!
```

---

## Step 3: Test the Application

Start the development server and verify everything works:

```bash
npm run dev
```

Then test:

- ✅ Login works (uses `an_users`)
- ✅ Dashboard loads with correct stats (27 pilots, 571 certifications)
- ✅ Pilot management works (uses `pilots` table)
- ✅ Certifications work (uses `pilot_checks`, `check_types`)
- ✅ Leave requests work (uses `leave_requests` table)

---

## Backup Information

**Legacy data was backed up before deletion:**

The following data was exported and saved:

### an_pilots (5 rows)

- PNG001 - Joseph Kila Wambi (Captain)
- PNG002 - Maria Temu Kaupa (First Officer)
- PNG003 - Peter Namaliu Sori (Captain)
- PNG004 - Grace Kila Mendi (First Officer)
- PNG005 - John Bani Vanimo (Captain)

### an_check_types (10 rows)

- LINE_CHECK, SIM_CHECK, MEDICAL, LICENSE, DG_CERT
- CRM, ETOPS, CAT2, CAT3, RVSM

### an_pilot_checks (18 rows)

- Various certification records for the 3 pilots above

### an_leave_requests (0 rows)

- Table was empty

---

## Rollback Plan (If Needed)

If something goes wrong, you can restore from Supabase's point-in-time recovery:

1. Go to: https://supabase.com/dashboard/project/wgdmgvonqysflwdiiols/database/backups
2. Select a backup from before the cleanup
3. Restore the database

**Note:** This is unlikely to be needed since no production code uses the legacy tables.

---

## Files Created During This Process

- `cleanup-legacy-tables-final.sql` - Main cleanup SQL
- `supabase/migrations/20251003_cleanup_legacy_tables.sql` - Migration file
- `verify-cleanup.js` - Verification script
- `CLEANUP-INSTRUCTIONS.md` - This file
- `.mcp.json` - Project-specific MCP configuration
- `.mcp.json.example` - Template for other developers
- `MCP-SETUP.md` - MCP configuration documentation

---

## Post-Cleanup Tasks

After successful cleanup:

1. ✅ Verify application functionality
2. ✅ Update project documentation (CLAUDE.md)
3. ✅ Commit changes to git (excluding `.mcp.json`)
4. ✅ Inform team members about the cleanup

---

**Air Niugini B767 Pilot Management System**
_Database Cleanup - Version 1.0_
_Execution Date: 2025-10-03_
