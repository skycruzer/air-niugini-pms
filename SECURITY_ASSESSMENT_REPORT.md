# EMERGENCY SECURITY ASSESSMENT REPORT
**Air Niugini B767 Pilot Management System**
**Date**: October 9, 2025
**Severity**: CRITICAL
**Project**: /Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms

---

## EXECUTIVE SUMMARY

**CRITICAL VULNERABILITY CONFIRMED**: Supabase Service Role Key has been committed to PUBLIC GitHub repository and is currently exposed.

**Immediate Action Required**: Service role key must be rotated within 24 hours.

---

## ISSUE 1: SERVICE ROLE KEY EXPOSURE (CRITICAL - P0)

### Current State
- **Status**: COMPROMISED
- **Exposure Level**: PUBLIC
- **Repository**: https://github.com/skycruzer/air-niugini-pms (PUBLIC REPO)
- **Exposure Duration**: Since September 29, 2025 (11 days)

### Evidence
1. **GitHub Repository Status**: PUBLIC (not private)
   ```
   "private": false,
   "visibility": "public"
   ```

2. **Compromised Files in Git History**:
   - `.env.vercel-production` (committed in f4b2710 on Sep 29, 2025)
   - `.env.vercel-production-clean` (committed in 7296a0b on Oct 6, 2025)

3. **Exposed Service Role Key**:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU4MjMyMCwiZXhwIjoyMDcxMTU4MzIwfQ.byfbMS__aOJzhhty54h7ap3XK19f9-3Wu7S-ZWWV2Cg
   ```
   - Project: wgdmgvonqysflwdiiols
   - Expires: 2071 (still valid)

4. **Git Commits with Exposure**:
   - `f4b2710757f3e442e934af2a1788529ed3583559` - Added .env.vercel-production
   - `7296a0b7e67691f2d4eebc61d3e1882ec689f276` - Modified .env.vercel-production-clean

### Risk Assessment
**Severity**: CRITICAL (P0)

**Impact**: 
- Full administrative access to Supabase database
- Ability to bypass ALL Row Level Security policies
- Read/write/delete access to ALL tables including:
  - `pilots` (27 pilot records with PII)
  - `pilot_checks` (571 certification records)
  - `an_users` (authentication data)
  - `leave_requests` (personal leave data)
- Ability to create/modify/delete users
- Potential data breach of pilot personal information
- Potential regulatory compliance violations (aviation data security)

**Likelihood**: HIGH
- Repository has been public for 11 days
- GitHub automated scanners may have already flagged this
- Malicious actors may have already extracted the key

### .gitignore Status
**POSITIVE**: `.env.local` is correctly excluded in `.gitignore`
```
# .gitignore (lines 12-16)
.env.local
.env.development.local
.env.test.local
.env.production.local
```

**ISSUE**: `.env.production` and `.env.vercel-production*` files are NOT in .gitignore and were committed.

---

## ISSUE 2: MISSING RLS POLICIES ON PRODUCTION TABLES (HIGH - P1)

### Current State
**Status**: VULNERABLE
**Affected Tables**: `pilots`, `pilot_checks`, `check_types`, `leave_requests`, `settings`, `contract_types`

### Evidence
1. **RLS Policies Only Exist for Legacy Tables**:
   - All RLS policies reference `an_*` tables (an_pilots, an_pilot_checks, etc.)
   - File: `supabase-rls-policies.sql` shows only legacy table policies
   - Search for production table policies: `grep "CREATE POLICY.*ON (pilots|pilot_checks)" *.sql` = NO MATCHES

2. **Legacy Tables Were Removed**:
   - Migration `20251003_cleanup_legacy_tables.sql` dropped:
     - `an_pilots`
     - `an_pilot_checks`
     - `an_check_types`
     - `an_leave_requests`
   - BUT `an_users` kept (ACTIVE authentication table)

3. **Production Tables Have NO RLS Policies**:
   - `pilots` - NO policies found
   - `pilot_checks` - NO policies found
   - `check_types` - NO policies found
   - `leave_requests` - NO policies found
   - `settings` - NO policies found
   - `contract_types` - NO policies found

### Risk Assessment
**Severity**: HIGH (P1)

**Impact**:
- If RLS is not enabled, ANYONE with anon key can access ALL data
- Database security depends entirely on application-level checks
- Service role key exposure (Issue 1) bypasses any application security
- Data accessible via direct Supabase client connections

**Mitigation**: Currently mitigated by:
- Application-level permission checks in API routes
- Service role key only used server-side (correct pattern)
- BUT compromised service role key removes all protection

---

## ISSUE 3: VERCEL OIDC TOKEN EXPOSURE (MEDIUM - P2)

### Current State
**Status**: EXPOSED IN GIT HISTORY

### Evidence
Files `.env.vercel-production` and `.env.production` contain:
```
VERCEL_OIDC_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Im1yay00MzAyZWMxYjY3MGY0OGE5OGFkNjFkYWRlNGEyM2JlNyJ9..."
```

### Risk Assessment
**Severity**: MEDIUM (P2)

**Impact**:
- Potential unauthorized Vercel deployment access
- Token appears to be time-limited (exp: 1759166271 = ~12 hours)
- Less severe than service role key but still sensitive

---

## REMEDIATION PLAN

### PHASE 1: IMMEDIATE (Execute Within 24 Hours)

#### Step 1: Rotate Supabase Service Role Key
```bash
# Go to Supabase Dashboard
# https://supabase.com/dashboard/project/wgdmgvonqysflwdiiols/settings/api

1. Log in to Supabase Dashboard
2. Navigate to Project Settings > API
3. Click "Rotate" on service_role key
4. Copy NEW service role key
5. Update environment variables:
   - Vercel production: https://vercel.com/settings/environment-variables
   - Local .env.local (NOT committed)
```

#### Step 2: Remove Sensitive Files from Git History
```bash
cd "/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"

# Install git-filter-repo if not installed
brew install git-filter-repo

# Create backup first
git clone . ../air-niugini-pms-backup

# Remove sensitive files from entire git history
git filter-repo --invert-paths --path .env.vercel-production --path .env.vercel-production-clean --path .env.production --force

# Force push to remote (THIS REWRITES HISTORY)
git remote add origin https://github.com/skycruzer/air-niugini-pms.git
git push origin --force --all
git push origin --force --tags
```

**WARNING**: This rewrites git history. All collaborators must re-clone the repository.

#### Step 3: Update .gitignore
```bash
cd "/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"

# Add to .gitignore
cat >> .gitignore << 'EOF'

# Environment files (STRICT - never commit these)
.env
.env.*
!.env.example
EOF

git add .gitignore
git commit -m "security: Add strict .env exclusions to .gitignore"
git push
```

#### Step 4: Delete Local Sensitive Files
```bash
cd "/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"

# Remove from working directory
rm -f .env.production
rm -f .env.vercel-production
rm -f .env.vercel-production-clean

# Keep only .env.local (already gitignored)
# Verify
ls -la | grep "\.env"
```

#### Step 5: Update Vercel Environment Variables
```bash
# Go to: https://vercel.com/rondeaumaurice-5086s-projects/air-niugini-pms/settings/environment-variables

1. Delete old SUPABASE_SERVICE_ROLE_KEY
2. Add NEW SUPABASE_SERVICE_ROLE_KEY (from Step 1)
3. Redeploy application
```

### PHASE 2: DATABASE SECURITY (Execute Within 48 Hours)

#### Step 6: Enable RLS on Production Tables
```bash
cd "/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"

# Create migration file
cat > enable_production_rls.sql << 'SQLEOF'
-- ==========================================
-- Enable RLS on Production Tables
-- Created: 2025-10-09
-- ==========================================

-- Enable Row Level Security
ALTER TABLE pilots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_types ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES FOR pilots
-- ==========================================

-- All authenticated users can view pilots
CREATE POLICY "Authenticated users can view pilots" ON pilots
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- Only admins can create pilots
CREATE POLICY "Admins can create pilots" ON pilots
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- Admins and managers can update pilots
CREATE POLICY "Admins and managers can update pilots" ON pilots
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'manager')
        )
    );

-- Only admins can delete pilots
CREATE POLICY "Admins can delete pilots" ON pilots
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- ==========================================
-- RLS POLICIES FOR pilot_checks
-- ==========================================

-- All authenticated users can view pilot checks
CREATE POLICY "Authenticated users can view pilot checks" ON pilot_checks
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- Admins and managers can create pilot checks
CREATE POLICY "Admins and managers can create pilot checks" ON pilot_checks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'manager')
        )
    );

-- Admins and managers can update pilot checks
CREATE POLICY "Admins and managers can update pilot checks" ON pilot_checks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'manager')
        )
    );

-- Admins and managers can delete pilot checks
CREATE POLICY "Admins and managers can delete pilot checks" ON pilot_checks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'manager')
        )
    );

-- ==========================================
-- RLS POLICIES FOR check_types
-- ==========================================

-- All authenticated users can view check types
CREATE POLICY "Authenticated users can view check types" ON check_types
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- Only admins can create check types
CREATE POLICY "Admins can create check types" ON check_types
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- Admins and managers can update check types
CREATE POLICY "Admins and managers can update check types" ON check_types
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'manager')
        )
    );

-- Only admins can delete check types
CREATE POLICY "Admins can delete check types" ON check_types
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- ==========================================
-- RLS POLICIES FOR leave_requests
-- ==========================================

-- All authenticated users can view leave requests
CREATE POLICY "Authenticated users can view leave requests" ON leave_requests
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- All authenticated users can create leave requests
CREATE POLICY "Authenticated users can create leave requests" ON leave_requests
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

-- Users can update their own requests, admins and managers can update all
CREATE POLICY "Users can update leave requests" ON leave_requests
    FOR UPDATE USING (
        pilot_id IN (
            SELECT id FROM pilots
            WHERE employee_id = auth.email()
        ) OR
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'manager')
        )
    );

-- Only admins can delete leave requests
CREATE POLICY "Admins can delete leave requests" ON leave_requests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- ==========================================
-- RLS POLICIES FOR settings
-- ==========================================

-- All authenticated users can view settings
CREATE POLICY "Authenticated users can view settings" ON settings
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- Only admins can modify settings
CREATE POLICY "Admins can modify settings" ON settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- ==========================================
-- RLS POLICIES FOR contract_types
-- ==========================================

-- All authenticated users can view contract types
CREATE POLICY "Authenticated users can view contract types" ON contract_types
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- Only admins can modify contract types
CREATE POLICY "Admins can modify contract types" ON contract_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM an_users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

COMMIT;
SQLEOF

# Execute migration
# Option 1: Via Supabase Dashboard SQL Editor
echo "Copy contents of enable_production_rls.sql to Supabase SQL Editor"
echo "https://supabase.com/dashboard/project/wgdmgvonqysflwdiiols/sql/new"

# Option 2: Via Supabase CLI (if linked)
npx supabase db push
```

### PHASE 3: PREVENTION (Execute Within 1 Week)

#### Step 7: Make Repository Private
```bash
# Go to: https://github.com/skycruzer/air-niugini-pms/settings

1. Scroll to "Danger Zone"
2. Click "Change repository visibility"
3. Select "Make private"
4. Confirm with repository name
```

**Rationale**: This is aviation data with PII. Repository should be private.

#### Step 8: Set Up Secret Scanning
```bash
# GitHub already scans public repos, but for private repos:
# Go to: https://github.com/skycruzer/air-niugini-pms/settings/security_analysis

1. Enable "Secret scanning"
2. Enable "Push protection"
3. Enable "Dependency graph"
4. Enable "Dependabot alerts"
```

#### Step 9: Add Pre-commit Hook
```bash
cd "/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"

# Create pre-commit hook
cat > .husky/pre-commit-secret-check << 'HOOKEOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check for potential secrets in staged files
if git diff --cached --name-only | grep -qE "\.env"; then
  echo "ERROR: Attempting to commit .env file!"
  echo "These files should NEVER be committed:"
  git diff --cached --name-only | grep "\.env"
  exit 1
fi

# Check for common secret patterns
if git diff --cached | grep -qE "(service_role|secret_key|api_key|password).*=.*[a-zA-Z0-9]{20,}"; then
  echo "WARNING: Potential secret detected in staged changes"
  echo "Please review your commit for exposed secrets"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
HOOKEOF

chmod +x .husky/pre-commit-secret-check
```

#### Step 10: Create .env.example Template
```bash
cd "/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"

cat > .env.example << 'EXAMPLEEOF'
# Air Niugini B767 Pilot Management System
# Environment Variables Template

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_PROJECT_ID=your_project_id

# App Configuration
NEXT_PUBLIC_APP_NAME=Air Niugini Pilot Management System
NEXT_PUBLIC_COMPANY=Air Niugini

# Current Roster Period
NEXT_PUBLIC_CURRENT_ROSTER=RP11/2025
NEXT_PUBLIC_ROSTER_END_DATE=2025-10-10
EXAMPLEEOF

git add .env.example
git commit -m "security: Add .env.example template"
git push
```

---

## VERIFICATION CHECKLIST

### After Phase 1 (Immediate - 24 hours):
- [ ] Service role key rotated in Supabase Dashboard
- [ ] Sensitive files removed from git history
- [ ] .gitignore updated with strict .env exclusions
- [ ] Vercel environment variables updated with new key
- [ ] Application redeployed and tested
- [ ] Old .env files deleted from local machine
- [ ] New service role key stored securely (password manager)

### After Phase 2 (Database Security - 48 hours):
- [ ] RLS enabled on all production tables
- [ ] RLS policies created and tested
- [ ] Application tested with RLS enabled
- [ ] Verify authenticated users can access data
- [ ] Verify unauthorized users CANNOT access data
- [ ] Test admin/manager role permissions

### After Phase 3 (Prevention - 1 week):
- [ ] Repository made private
- [ ] Secret scanning enabled on GitHub
- [ ] Pre-commit hook installed and tested
- [ ] .env.example created and committed
- [ ] Team educated on secret management best practices

---

## TESTING PROCEDURE

### Test RLS Policies After Implementation
```bash
# Test 1: Verify RLS is enabled
# Expected: All tables should show RLS enabled

# Test 2: Try accessing data with anon key only
# Expected: Should be blocked or limited based on policies

# Test 3: Try accessing data as authenticated admin
# Expected: Should have full access

# Test 4: Try accessing data as authenticated manager
# Expected: Should have edit access, no delete

# Test 5: Try modifying data without authentication
# Expected: Should be blocked
```

---

## INCIDENT TIMELINE

| Date | Event |
|------|-------|
| Sep 29, 2025 | Service role key committed in f4b2710 (.env.vercel-production) |
| Oct 6, 2025 | Service role key committed in 7296a0b (.env.vercel-production-clean) |
| Oct 9, 2025 | Security breach discovered during audit |
| Oct 9, 2025 | Security assessment report created |

**Exposure Duration**: 11 days

---

## BUSINESS IMPACT

### Potential Data Breach Scope
- **Pilots**: 27 records with personal information (names, DOB, passport, nationality)
- **Certifications**: 571 records with expiry dates and check types
- **Leave Requests**: 12 records with personal leave information
- **Users**: 3 admin/manager accounts with email addresses

### Regulatory Concerns
- Aviation industry data security requirements
- Papua New Guinea privacy regulations
- Potential audit/compliance issues if breach is exploited

### Reputational Risk
- Air Niugini's pilot data was potentially exposed
- Loss of trust if exploited
- Potential legal liability

---

## LESSONS LEARNED

### What Went Wrong
1. Vercel CLI generated .env files that were not gitignored
2. Files were committed without review (should have been caught)
3. Repository was public (should be private for aviation data)
4. No pre-commit hooks to prevent secret exposure
5. RLS policies were not migrated from legacy tables to production tables

### Best Practices for Future
1. NEVER commit ANY .env files (except .env.example)
2. Use strict .gitignore patterns for all environment files
3. Private repositories for production applications with PII
4. Enable GitHub secret scanning and push protection
5. Pre-commit hooks to catch potential secret leaks
6. Regular security audits
7. Rotate keys on a schedule (quarterly)
8. Use secret management tools (Vercel Secrets, AWS Secrets Manager)

---

## PRIORITY SUMMARY

| Priority | Issue | Action Required | Deadline |
|----------|-------|----------------|----------|
| P0 - CRITICAL | Service Role Key Exposed | Rotate key, clean git history | 24 hours |
| P1 - HIGH | Missing RLS on Production Tables | Create and deploy RLS policies | 48 hours |
| P2 - MEDIUM | Vercel OIDC Token Exposed | Clean git history (done with P0) | 48 hours |
| P3 - LOW | Repository Visibility | Make repository private | 1 week |

---

## CONTACT & ESCALATION

**Security Incident Owner**: Maurice (Skycruzer)
**GitHub**: @skycruzer
**Email**: 45035536+skycruzer@users.noreply.github.com

**Escalation Path**:
1. Immediate: Rotate keys (no approval needed)
2. Database changes: Test in local/staging first
3. Git history rewrite: Notify all collaborators
4. Repository visibility: Owner decision

---

## CONCLUSION

**CRITICAL ACTION REQUIRED**: The Supabase service role key has been exposed in a public GitHub repository for 11 days. This key provides full administrative access to the database, bypassing all security controls.

**Immediate Steps** (within 24 hours):
1. Rotate the service role key in Supabase Dashboard
2. Remove sensitive files from git history using git-filter-repo
3. Update Vercel environment variables
4. Delete local .env files

**Follow-up Steps** (within 48 hours):
1. Enable RLS on all production tables
2. Create comprehensive RLS policies
3. Test database access with new security model

**Prevention** (within 1 week):
1. Make repository private
2. Enable secret scanning
3. Add pre-commit hooks
4. Create .env.example template

**No evidence of exploitation has been detected, but the key should be considered compromised and must be rotated immediately.**

---

**Report Generated**: October 9, 2025
**Next Review**: After Phase 1 completion (24 hours)
