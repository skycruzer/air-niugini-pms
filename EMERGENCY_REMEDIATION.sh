#!/bin/bash
# ==========================================
# EMERGENCY SECURITY REMEDIATION SCRIPT
# Air Niugini B767 Pilot Management System
# ==========================================

set -e

echo "=========================================="
echo "EMERGENCY SECURITY REMEDIATION"
echo "Air Niugini B767 PMS"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

PROJECT_DIR="/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"
cd "$PROJECT_DIR"

echo -e "${RED}WARNING: This script will:${NC}"
echo "1. Delete sensitive .env files from working directory"
echo "2. Update .gitignore to prevent future .env commits"
echo "3. Create .env.example template"
echo ""
echo -e "${YELLOW}MANUAL STEPS REQUIRED:${NC}"
echo "- Rotate Supabase service role key: https://supabase.com/dashboard/project/wgdmgvonqysflwdiiols/settings/api"
echo "- Update Vercel environment variables"
echo "- Clean git history (see SECURITY_ASSESSMENT_REPORT.md)"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

# Step 1: Backup existing .env files before deletion
echo ""
echo -e "${GREEN}Step 1: Creating backup of .env files...${NC}"
mkdir -p .env-backup-$(date +%Y%m%d-%H%M%S)
BACKUP_DIR=".env-backup-$(date +%Y%m%d-%H%M%S)"

if [ -f ".env.production" ]; then
    cp .env.production "$BACKUP_DIR/"
    echo "  ✓ Backed up .env.production"
fi

if [ -f ".env.vercel-production" ]; then
    cp .env.vercel-production "$BACKUP_DIR/"
    echo "  ✓ Backed up .env.vercel-production"
fi

if [ -f ".env.vercel-production-clean" ]; then
    cp .env.vercel-production-clean "$BACKUP_DIR/"
    echo "  ✓ Backed up .env.vercel-production-clean"
fi

if [ -f ".env.local" ]; then
    cp .env.local "$BACKUP_DIR/"
    echo "  ✓ Backed up .env.local"
fi

# Step 2: Delete sensitive files from working directory
echo ""
echo -e "${GREEN}Step 2: Deleting sensitive files from working directory...${NC}"

if [ -f ".env.production" ]; then
    rm -f .env.production
    echo "  ✓ Deleted .env.production"
fi

if [ -f ".env.vercel-production" ]; then
    rm -f .env.vercel-production
    echo "  ✓ Deleted .env.vercel-production"
fi

if [ -f ".env.vercel-production-clean" ]; then
    rm -f .env.vercel-production-clean
    echo "  ✓ Deleted .env.vercel-production-clean"
fi

# Keep .env.local (it's gitignored)
echo "  ✓ Kept .env.local (already gitignored)"

# Step 3: Update .gitignore
echo ""
echo -e "${GREEN}Step 3: Updating .gitignore...${NC}"

if ! grep -q "# Environment files (STRICT" .gitignore; then
    cat >> .gitignore << 'EOF'

# Environment files (STRICT - never commit these)
.env
.env.*
!.env.example
EOF
    echo "  ✓ Added strict .env exclusions to .gitignore"
else
    echo "  ✓ .gitignore already has strict .env exclusions"
fi

# Step 4: Create .env.example
echo ""
echo -e "${GREEN}Step 4: Creating .env.example template...${NC}"

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

echo "  ✓ Created .env.example"

# Step 5: Git status check
echo ""
echo -e "${GREEN}Step 5: Checking git status...${NC}"
git status --short

echo ""
echo -e "${GREEN}=========================================="
echo "LOCAL CLEANUP COMPLETE"
echo "==========================================${NC}"
echo ""
echo -e "${YELLOW}NEXT STEPS (MANUAL):${NC}"
echo ""
echo "1. ROTATE SUPABASE SERVICE ROLE KEY (CRITICAL)"
echo "   → https://supabase.com/dashboard/project/wgdmgvonqysflwdiiols/settings/api"
echo "   → Click 'Rotate' on service_role key"
echo "   → Copy new key and update:"
echo "     - Vercel: https://vercel.com/settings/environment-variables"
echo "     - Local .env.local"
echo ""
echo "2. COMMIT CHANGES"
echo "   git add .gitignore .env.example"
echo "   git commit -m 'security: Add strict .env exclusions and template'"
echo "   git push"
echo ""
echo "3. CLEAN GIT HISTORY (see SECURITY_ASSESSMENT_REPORT.md for details)"
echo "   brew install git-filter-repo"
echo "   git filter-repo --invert-paths --path .env.vercel-production --path .env.vercel-production-clean --path .env.production --force"
echo ""
echo "4. ENABLE RLS ON PRODUCTION TABLES"
echo "   → Run enable_production_rls.sql in Supabase SQL Editor"
echo "   → https://supabase.com/dashboard/project/wgdmgvonqysflwdiiols/sql/new"
echo ""
echo "5. MAKE REPOSITORY PRIVATE"
echo "   → https://github.com/skycruzer/air-niugini-pms/settings"
echo ""
echo -e "${GREEN}Backup saved in: $BACKUP_DIR${NC}"
echo ""
