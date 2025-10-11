#!/bin/bash

# Air Niugini PMS - Project Reorganization Script
# This script automates the reorganization of the project structure
# Run with: bash scripts/reorganize-project.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"

echo -e "${GREEN}Starting Air Niugini PMS Project Reorganization...${NC}"
echo "Project Root: $PROJECT_ROOT"
echo ""

# Function to create directory if it doesn't exist
create_dir() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        echo -e "${GREEN}✓${NC} Created directory: $1"
    else
        echo -e "${YELLOW}→${NC} Directory exists: $1"
    fi
}

# Function to move files with verification
move_files() {
    local pattern="$1"
    local destination="$2"
    local description="$3"

    echo -e "\n${YELLOW}Moving $description...${NC}"

    # Find files matching pattern
    files=$(find "$PROJECT_ROOT" -maxdepth 1 -name "$pattern" 2>/dev/null | head -20)

    if [ -z "$files" ]; then
        echo -e "${YELLOW}→${NC} No $description found to move"
        return
    fi

    # Move each file
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            basename_file=$(basename "$file")
            mv "$file" "$destination/$basename_file"
            echo -e "${GREEN}✓${NC} Moved: $basename_file → $destination/"
        fi
    done <<< "$files"
}

# ===========================================
# PHASE 1: Create Directory Structure
# ===========================================

echo -e "\n${GREEN}=== PHASE 1: Creating Directory Structure ===${NC}"

# Database directories
create_dir "$PROJECT_ROOT/database/migrations"
create_dir "$PROJECT_ROOT/database/schemas"
create_dir "$PROJECT_ROOT/database/seeds"
create_dir "$PROJECT_ROOT/database/views"
create_dir "$PROJECT_ROOT/database/scripts"

# Scripts directories
create_dir "$PROJECT_ROOT/scripts/database"
create_dir "$PROJECT_ROOT/scripts/deployment"
create_dir "$PROJECT_ROOT/scripts/development"
create_dir "$PROJECT_ROOT/scripts/testing"

# Tests directories
create_dir "$PROJECT_ROOT/tests/e2e"
create_dir "$PROJECT_ROOT/tests/unit"
create_dir "$PROJECT_ROOT/tests/integration"
create_dir "$PROJECT_ROOT/tests/fixtures"

# Docs directories (already exists, just organize subdirs)
create_dir "$PROJECT_ROOT/docs/api"
create_dir "$PROJECT_ROOT/docs/architecture"
create_dir "$PROJECT_ROOT/docs/deployment"
create_dir "$PROJECT_ROOT/docs/features"
create_dir "$PROJECT_ROOT/docs/testing"

# Config directories
create_dir "$PROJECT_ROOT/config/jest"
create_dir "$PROJECT_ROOT/config/playwright"
create_dir "$PROJECT_ROOT/config/build"

# Library subdirectories
create_dir "$PROJECT_ROOT/src/lib/services"
create_dir "$PROJECT_ROOT/src/lib/data"
create_dir "$PROJECT_ROOT/src/lib/utils"
create_dir "$PROJECT_ROOT/src/lib/pdf"
create_dir "$PROJECT_ROOT/src/lib/auth"
create_dir "$PROJECT_ROOT/src/lib/api"

# ===========================================
# PHASE 2: Move SQL Files
# ===========================================

echo -e "\n${GREEN}=== PHASE 2: Moving Database Files ===${NC}"

# Move numbered migration files
echo -e "\n${YELLOW}Moving migration files...${NC}"
for file in "$PROJECT_ROOT"/00*.sql; do
    if [ -f "$file" ]; then
        basename_file=$(basename "$file")
        mv "$file" "$PROJECT_ROOT/database/migrations/$basename_file"
        echo -e "${GREEN}✓${NC} Moved migration: $basename_file"
    fi
done

# Move schema files
echo -e "\n${YELLOW}Moving schema files...${NC}"
for file in "$PROJECT_ROOT"/*_schema.sql "$PROJECT_ROOT"/supabase-schema.sql; do
    if [ -f "$file" ]; then
        basename_file=$(basename "$file")
        mv "$file" "$PROJECT_ROOT/database/schemas/$basename_file"
        echo -e "${GREEN}✓${NC} Moved schema: $basename_file"
    fi
done

# Move other SQL files
echo -e "\n${YELLOW}Moving other SQL files...${NC}"
for file in "$PROJECT_ROOT"/*.sql; do
    if [ -f "$file" ]; then
        basename_file=$(basename "$file")
        if [[ "$basename_file" == *"sample-data"* ]] || [[ "$basename_file" == *"populate"* ]]; then
            mv "$file" "$PROJECT_ROOT/database/seeds/$basename_file"
            echo -e "${GREEN}✓${NC} Moved seed: $basename_file"
        elif [[ "$basename_file" == *"view"* ]]; then
            mv "$file" "$PROJECT_ROOT/database/views/$basename_file"
            echo -e "${GREEN}✓${NC} Moved view: $basename_file"
        else
            mv "$file" "$PROJECT_ROOT/database/scripts/$basename_file"
            echo -e "${GREEN}✓${NC} Moved to scripts: $basename_file"
        fi
    fi
done

# ===========================================
# PHASE 3: Move JavaScript/Node Scripts
# ===========================================

echo -e "\n${GREEN}=== PHASE 3: Moving Script Files ===${NC}"

# Database scripts
echo -e "\n${YELLOW}Moving database scripts...${NC}"
for script in test-connection.js deploy-schema.js populate-data.js create-users.js \
              run-seniority-migration.js execute-migration.js add-column-direct.js \
              add-seniority-column.js calculate-seniority.js check-schema.js \
              check-tables.js list-tables.js deploy-audit-table.js execute-cleanup*.js \
              execute-table-cleanup.js verify-cleanup.js apply-migration*.js; do
    if [ -f "$PROJECT_ROOT/$script" ]; then
        mv "$PROJECT_ROOT/$script" "$PROJECT_ROOT/scripts/database/$script"
        echo -e "${GREEN}✓${NC} Moved: $script → scripts/database/"
    fi
done

# Test scripts
echo -e "\n${YELLOW}Moving test scripts...${NC}"
for script in test-*.js; do
    if [ -f "$PROJECT_ROOT/$script" ] && [[ ! "$script" == test-*.spec.js ]]; then
        mv "$PROJECT_ROOT/$script" "$PROJECT_ROOT/scripts/testing/$script"
        echo -e "${GREEN}✓${NC} Moved: $script → scripts/testing/"
    fi
done

# Development scripts
echo -e "\n${YELLOW}Moving development scripts...${NC}"
for script in generate-pwa-icons.js performance-test.js apply-auth-fix.js \
              apply-fix-via-api.js; do
    if [ -f "$PROJECT_ROOT/$script" ]; then
        mv "$PROJECT_ROOT/$script" "$PROJECT_ROOT/scripts/development/$script"
        echo -e "${GREEN}✓${NC} Moved: $script → scripts/development/"
    fi
done

# ===========================================
# PHASE 4: Move Test Files
# ===========================================

echo -e "\n${GREEN}=== PHASE 4: Moving Test Files ===${NC}"

# E2E test files
echo -e "\n${YELLOW}Moving E2E test files...${NC}"
for test in "$PROJECT_ROOT"/*.spec.js; do
    if [ -f "$test" ]; then
        basename_test=$(basename "$test")
        mv "$test" "$PROJECT_ROOT/tests/e2e/$basename_test"
        echo -e "${GREEN}✓${NC} Moved E2E test: $basename_test"
    fi
done

# ===========================================
# PHASE 5: Move Documentation Files
# ===========================================

echo -e "\n${GREEN}=== PHASE 5: Moving Documentation Files ===${NC}"

# Architecture docs
echo -e "\n${YELLOW}Moving architecture documentation...${NC}"
for doc in DESIGN.md DATABASE_COMPATIBILITY_REPORT.md OPTIMIZATION_RECOMMENDATIONS.md \
          COMPREHENSIVE_IMPROVEMENT_REPORT.md CODE_QUALITY_IMPROVEMENTS.md; do
    if [ -f "$PROJECT_ROOT/$doc" ]; then
        mv "$PROJECT_ROOT/$doc" "$PROJECT_ROOT/docs/architecture/$doc"
        echo -e "${GREEN}✓${NC} Moved: $doc → docs/architecture/"
    fi
done

# Feature docs
echo -e "\n${YELLOW}Moving feature documentation...${NC}"
for doc in LEAVE_MANAGEMENT_SYSTEM.md NOTIFICATION_SYSTEM_SUMMARY.md \
          ANALYTICS_README.md PDF_REPORTING_DOCUMENTATION.md \
          PWA-TESTING-CHECKLIST.md API_DOCUMENTATION.md; do
    if [ -f "$PROJECT_ROOT/$doc" ]; then
        mv "$PROJECT_ROOT/$doc" "$PROJECT_ROOT/docs/features/$doc"
        echo -e "${GREEN}✓${NC} Moved: $doc → docs/features/"
    fi
done

# Deployment docs
echo -e "\n${YELLOW}Moving deployment documentation...${NC}"
for doc in DEPLOYMENT*.md VERCEL*.md PRODUCTION*.md PHASE*.md \
          MCP*.md FINAL*.md; do
    if [ -f "$PROJECT_ROOT/$doc" ]; then
        mv "$PROJECT_ROOT/$doc" "$PROJECT_ROOT/docs/deployment/$doc"
        echo -e "${GREEN}✓${NC} Moved: $doc → docs/deployment/"
    fi
done

# Testing docs
echo -e "\n${YELLOW}Moving testing documentation...${NC}"
for doc in TEST*.md TESTING*.md SHADCN_*.md UX*.md COMPLETE*.md; do
    if [ -f "$PROJECT_ROOT/$doc" ]; then
        mv "$PROJECT_ROOT/$doc" "$PROJECT_ROOT/docs/testing/$doc"
        echo -e "${GREEN}✓${NC} Moved: $doc → docs/testing/"
    fi
done

# Move remaining .md files (except README.md and CLAUDE.md)
echo -e "\n${YELLOW}Moving remaining documentation...${NC}"
for doc in "$PROJECT_ROOT"/*.md; do
    if [ -f "$doc" ]; then
        basename_doc=$(basename "$doc")
        if [[ "$basename_doc" != "README.md" ]] && [[ "$basename_doc" != "CLAUDE.md" ]]; then
            mv "$doc" "$PROJECT_ROOT/docs/$basename_doc"
            echo -e "${GREEN}✓${NC} Moved: $basename_doc → docs/"
        fi
    fi
done

# ===========================================
# PHASE 6: Move Configuration Files
# ===========================================

echo -e "\n${GREEN}=== PHASE 6: Moving Configuration Files ===${NC}"

# Jest configuration
if [ -f "$PROJECT_ROOT/jest.config.js" ]; then
    cp "$PROJECT_ROOT/jest.config.js" "$PROJECT_ROOT/config/jest/jest.config.js"
    echo -e "${GREEN}✓${NC} Copied jest.config.js to config/jest/"
fi

if [ -f "$PROJECT_ROOT/jest.setup.js" ]; then
    mv "$PROJECT_ROOT/jest.setup.js" "$PROJECT_ROOT/config/jest/jest.setup.js"
    echo -e "${GREEN}✓${NC} Moved jest.setup.js to config/jest/"
fi

# Playwright configuration
if [ -f "$PROJECT_ROOT/playwright.config.js" ]; then
    cp "$PROJECT_ROOT/playwright.config.js" "$PROJECT_ROOT/config/playwright/playwright.config.js"
    echo -e "${GREEN}✓${NC} Copied playwright.config.js to config/playwright/"
fi

# ===========================================
# PHASE 7: Clean Up Log Files
# ===========================================

echo -e "\n${GREEN}=== PHASE 7: Cleaning Up Log Files ===${NC}"

# Move log files to a logs directory or remove them
create_dir "$PROJECT_ROOT/logs"

for log in "$PROJECT_ROOT"/*.log; do
    if [ -f "$log" ]; then
        basename_log=$(basename "$log")
        mv "$log" "$PROJECT_ROOT/logs/$basename_log"
        echo -e "${GREEN}✓${NC} Moved log: $basename_log → logs/"
    fi
done

# ===========================================
# PHASE 8: Create README Files
# ===========================================

echo -e "\n${GREEN}=== PHASE 8: Creating README Files ===${NC}"

# Create README for database directory
cat > "$PROJECT_ROOT/database/README.md" << 'EOF'
# Database Directory

This directory contains all database-related files for the Air Niugini PMS.

## Structure

- `migrations/` - Numbered database migration files
- `schemas/` - Database schema definitions
- `seeds/` - Sample and seed data
- `views/` - Database view definitions
- `scripts/` - Database utility scripts

## Usage

Run migrations with:
```bash
npm run db:deploy
```

Test connection with:
```bash
npm run db:test
```
EOF
echo -e "${GREEN}✓${NC} Created database/README.md"

# Create README for scripts directory
cat > "$PROJECT_ROOT/scripts/README.md" << 'EOF'
# Scripts Directory

Utility scripts for development, deployment, and testing.

## Structure

- `database/` - Database operation scripts
- `deployment/` - Deployment and build scripts
- `development/` - Development utility scripts
- `testing/` - Test runner and utility scripts

## Common Commands

See package.json for script aliases.
EOF
echo -e "${GREEN}✓${NC} Created scripts/README.md"

# Create README for tests directory
cat > "$PROJECT_ROOT/tests/README.md" << 'EOF'
# Tests Directory

All test files for the Air Niugini PMS.

## Structure

- `e2e/` - End-to-end tests (Playwright)
- `unit/` - Unit tests (Jest)
- `integration/` - Integration tests
- `fixtures/` - Test data and fixtures

## Running Tests

```bash
# Unit tests
npm test

# E2E tests
npx playwright test

# All tests
npm run test:all
```
EOF
echo -e "${GREEN}✓${NC} Created tests/README.md"

# ===========================================
# PHASE 9: Update package.json Scripts
# ===========================================

echo -e "\n${GREEN}=== PHASE 9: Creating Updated package.json Scripts ===${NC}"

cat > "$PROJECT_ROOT/package.json.updated" << 'EOF'
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "db:test": "node scripts/database/test-connection.js",
    "db:deploy": "node scripts/database/deploy-schema.js",
    "db:seed": "node scripts/database/populate-data.js",
    "db:migrate": "node scripts/database/execute-migration.js",
    "validate": "npm run format:check && npm run lint && npm run type-check && npm run test",
    "prepare": "husky install"
  }
}
EOF

echo -e "${GREEN}✓${NC} Created package.json.updated with new script paths"
echo -e "${YELLOW}Note:${NC} Review package.json.updated and manually update your package.json"

# ===========================================
# SUMMARY
# ===========================================

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}    Reorganization Complete!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Summary of Changes:${NC}"
echo "• Created organized directory structure"
echo "• Moved SQL files to database/"
echo "• Moved scripts to scripts/"
echo "• Moved tests to tests/"
echo "• Moved documentation to docs/"
echo "• Created README files for new directories"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Review and update package.json with scripts from package.json.updated"
echo "2. Update jest.config.js to use config/jest/jest.setup.js"
echo "3. Update playwright.config.js test directory to tests/e2e"
echo "4. Run 'npm run build' to verify everything works"
echo "5. Run 'npm test' to verify tests still pass"
echo "6. Commit changes to version control"

echo -e "\n${GREEN}Project structure has been reorganized successfully!${NC}"