# URGENT FIX INSTRUCTIONS - Pilot & Certification Edit Not Saving

## Root Cause

The `auth_get_user_role()` function reads role from JWT `user_metadata` which has `"role": "user"`, but the actual admin role is stored in the `an_users` table as `"role": "admin"`. This causes RLS policies to fail for admin users.

**Evidence:**

- auth.users.raw_user_meta_data.role = **"user"** (wrong)
- an_users.role = **"admin"** (correct)
- RLS policy checks: `auth_get_user_role() = 'admin'` (fails because function returns "user")

## Solution: Fix the auth_get_user_role() Function

### Option 1: Supabase Dashboard (RECOMMENDED)

1. Go to: https://supabase.com/dashboard/project/wgdmgvonqysflwdiiols/sql

2. Click "New Query"

3. Paste this SQL:

\`\`\`sql
-- Fix auth_get_user_role() to use an_users table instead of JWT metadata
CREATE OR REPLACE FUNCTION public.auth_get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
-- Check if user is authenticated
IF auth.uid() IS NULL THEN
RETURN 'anonymous';
END IF;

-- Get role from an_users table based on auth.uid()
-- This is the source of truth for user roles
RETURN COALESCE(
(
SELECT role
FROM public.an_users
WHERE id::text = auth.uid()::text
LIMIT 1
),
'user'
);
END;
$function$;

-- Verify
SELECT 'auth_get_user_role() function updated successfully!' as status;
\`\`\`

4. Click "Run" (or press Cmd/Ctrl + Enter)

5. You should see: `auth_get_user_role() function updated successfully!`

### Option 2: Alternative Fix File

The SQL is also saved in: \`fix-auth-role-function.sql\`

You can copy-paste that file's contents into Supabase SQL Editor.

## Verification

After applying the fix:

1. The pilot edit should save successfully
2. The certification edit should save successfully
3. No RLS policy errors should occur

## Testing

1. Test pilot edit: Edit a pilot's name and click Save
2. Test certification edit: Edit a certification expiry date and click Save
3. Both should now persist the changes to the database

## Technical Details

**Before Fix:**

- Function reads: `auth.jwt() -> 'user_metadata' ->> 'role'`
- Returns: `"user"` (from JWT)
- RLS check fails: `"user" ≠ "admin"`

**After Fix:**

- Function reads: `SELECT role FROM an_users WHERE id = auth.uid()`
- Returns: `"admin"` (from database)
- RLS check passes: `"admin" = "admin"` ✅

## Files Created

- \`fix-auth-role-function.sql\` - SQL to fix the function
- \`apply-auth-fix.js\` - Automated script (failed due to API limitations)
- \`URGENT-FIX-INSTRUCTIONS.md\` - This file
