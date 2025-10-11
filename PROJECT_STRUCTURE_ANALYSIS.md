# Air Niugini PMS - Project Structure Analysis & Reorganization Plan

**Analysis Date**: October 9, 2025
**Project**: Air Niugini B767 Pilot Management System
**Current Location**: `/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms`

## 🔍 Current Structure Analysis

### 1. Root Directory Issues

#### **Critical Problem: Excessive Root Clutter**
The root directory contains **197 items**, with approximately:
- **50+ documentation files** (.md files)
- **30+ SQL migration files**
- **25+ JavaScript utility scripts**
- **20+ test spec files**
- **15+ log files**
- **10+ configuration files** (proper placement)

This creates several problems:
- Difficult navigation and file discovery
- Mixed concerns (docs, scripts, migrations, tests, configs)
- No clear separation between development and production assets
- Version control noise with numerous unorganized files

### 2. Directory Organization Assessment

#### **Well-Organized Areas** ✅
```
src/
├── app/               # Next.js App Router - properly structured
├── components/        # 25 component subdirectories - good categorization
├── lib/              # 88 service files - needs subcategorization
├── contexts/         # React contexts - appropriate
├── types/            # TypeScript definitions - good
└── middleware/       # Middleware functions - appropriate
```

#### **Problem Areas** ❌
1. **src/lib/** - 88 files in single directory (needs subcategorization)
2. **Root directory** - Mixed concerns with 100+ loose files
3. **Test files** - Scattered between root, src, and various subdirectories
4. **Database files** - SQL files scattered in root instead of organized
5. **Documentation** - 50+ markdown files cluttering root

### 3. Naming Convention Analysis

#### **Inconsistencies Found**:
- Snake_case files: `task_schema.sql`, `disciplinary_schema.sql`
- Kebab-case files: `test-connection.js`, `deploy-schema.js`
- Mixed conventions in same category (SQL files, JS scripts)
- Numbered migration files with inconsistent naming patterns

### 4. Import Pattern Analysis

#### **Good Practices** ✅:
- Minimal relative imports (only 5 occurrences of `../`)
- Most imports use `@/` alias for absolute paths
- Clean dependency tree with no circular dependencies detected

#### **Areas for Improvement**:
- Some test files still use relative imports
- MCP server tools using relative imports to shared utilities

## 📋 Reorganization Recommendations

### Phase 1: Create Logical Directory Structure

```
air-niugini-pms/
├── src/                          # Application source code (NO CHANGES)
│   ├── app/                     # Next.js App Router
│   ├── components/              # UI Components
│   ├── contexts/                # React Contexts
│   ├── lib/                     # REORGANIZE (see below)
│   ├── types/                   # TypeScript types
│   └── middleware/              # Middleware
│
├── database/                     # NEW - All database related files
│   ├── migrations/              # Numbered migration files
│   ├── schemas/                 # Schema definitions
│   ├── seeds/                   # Sample/seed data
│   ├── views/                   # Database views
│   └── scripts/                 # Database utility scripts
│
├── scripts/                      # NEW - Development & deployment scripts
│   ├── database/                # Database operation scripts
│   ├── deployment/              # Deployment scripts
│   ├── development/             # Dev utility scripts
│   └── testing/                 # Test runner scripts
│
├── tests/                        # NEW - Consolidated test suite
│   ├── e2e/                     # Playwright E2E tests
│   ├── unit/                    # Jest unit tests
│   ├── integration/             # Integration tests
│   └── fixtures/                # Test data & fixtures
│
├── docs/                         # EXISTING - Move all .md files here
│   ├── api/                     # API documentation
│   ├── architecture/            # Architecture decisions
│   ├── deployment/              # Deployment guides
│   ├── features/                # Feature documentation
│   └── testing/                 # Test reports & coverage
│
├── config/                       # NEW - Configuration files
│   ├── jest/                    # Jest configuration
│   ├── playwright/              # Playwright configuration
│   └── build/                   # Build configurations
│
├── public/                       # Static assets (NO CHANGES)
├── .husky/                       # Git hooks (NO CHANGES)
├── .vscode/                      # VS Code settings (NO CHANGES)
└── [root config files]           # Keep only essential root configs
```

### Phase 2: Reorganize src/lib Directory

The `src/lib` directory has 88 files and needs subcategorization:

```
src/lib/
├── services/                     # Business logic services
│   ├── pilot-service.ts
│   ├── leave-service.ts
│   ├── certification-service.ts
│   ├── analytics-service.ts
│   ├── dashboard-service.ts
│   ├── audit-log-service.ts
│   ├── document-service.ts
│   ├── disciplinary-service.ts
│   ├── notification-service.ts
│   └── ...
│
├── data/                         # Data access & transformations
│   ├── supabase.ts
│   ├── supabase-admin.ts
│   ├── database.types.ts
│   ├── cache-service.ts
│   ├── connection-pool.ts
│   └── ...
│
├── utils/                        # Utility functions
│   ├── date-utils.ts
│   ├── roster-utils.ts
│   ├── certification-utils.ts
│   ├── calendar-utils.ts
│   ├── validation-utils.ts
│   └── ...
│
├── pdf/                          # PDF generation
│   ├── pdf-data-service.ts
│   ├── pdf-templates.ts
│   └── pdf-utils.ts
│
├── auth/                         # Authentication utilities
│   ├── auth-utils.ts
│   ├── permissions.ts
│   └── session-utils.ts
│
├── api/                          # API utilities
│   ├── api-client.ts
│   ├── api-response.ts
│   ├── api-error.ts
│   └── csrf.ts
│
└── __tests__/                    # Keep lib tests close to source
```

## 📁 File Migration Plan

### Critical Moves (Immediate Impact)

1. **Database Files** (Root → database/)
   ```bash
   # Move all SQL files
   database/
   ├── migrations/
   │   ├── 001_remove_legacy_tables.sql
   │   ├── 002_add_indexes.sql
   │   ├── 003_soft_delete.sql
   │   └── ...
   ├── schemas/
   │   ├── supabase-schema.sql
   │   ├── task_schema.sql
   │   └── disciplinary_schema.sql
   └── seeds/
       └── supabase-sample-data.sql
   ```

2. **Scripts** (Root → scripts/)
   ```bash
   scripts/
   ├── database/
   │   ├── test-connection.js
   │   ├── deploy-schema.js
   │   ├── populate-data.js
   │   └── run-seniority-migration.js
   └── deployment/
       ├── set-vercel-env.sh
       └── apply-migration.js
   ```

3. **Test Files** (Root → tests/)
   ```bash
   tests/
   ├── e2e/
   │   ├── login.spec.js
   │   ├── pilot-management.spec.js
   │   ├── error-handling.spec.js
   │   └── ...
   └── integration/
       ├── auth-flow.test.js
       └── pdf-generation.test.js
   ```

4. **Documentation** (Root → docs/)
   ```bash
   docs/
   ├── README.md (keep copy in root)
   ├── architecture/
   │   ├── DESIGN.md
   │   ├── DATABASE_COMPATIBILITY_REPORT.md
   │   └── OPTIMIZATION_RECOMMENDATIONS.md
   ├── features/
   │   ├── LEAVE_MANAGEMENT_SYSTEM.md
   │   ├── NOTIFICATION_SYSTEM_SUMMARY.md
   │   └── ...
   └── deployment/
       ├── DEPLOYMENT_VERIFICATION_COMPLETE.md
       └── VERCEL_DOMAIN_FIX.md
   ```

## 🔧 Import Path Updates Required

### Files Requiring Import Updates After Migration:

1. **Package.json scripts** - Update paths for:
   ```json
   {
     "scripts": {
       "db:test": "node scripts/database/test-connection.js",
       "db:deploy": "node scripts/database/deploy-schema.js",
       "db:seed": "node scripts/database/populate-data.js"
     }
   }
   ```

2. **Test configurations** - Update paths in:
   - `jest.config.js` - test file patterns
   - `playwright.config.js` - test directory paths

3. **CI/CD workflows** - Update any GitHub Actions or deployment scripts

4. **Documentation references** - Update internal links in markdown files

## ⚠️ Risk Assessment & Mitigation

### Low Risk Changes ✅
- Moving documentation files (no code impact)
- Organizing SQL files (referenced by scripts, not imports)
- Creating new directories (additive changes)

### Medium Risk Changes ⚡
- Moving test files (requires config updates)
- Reorganizing scripts (requires package.json updates)
- Subcategorizing lib/ directory (requires import updates)

### High Risk Changes ❌
- None identified - all changes maintain functionality

## 🚀 Implementation Steps

### Step 1: Create Directory Structure (No Breaking Changes)
```bash
mkdir -p database/{migrations,schemas,seeds,views,scripts}
mkdir -p scripts/{database,deployment,development,testing}
mkdir -p tests/{e2e,unit,integration,fixtures}
mkdir -p docs/{api,architecture,deployment,features,testing}
mkdir -p config/{jest,playwright,build}
mkdir -p src/lib/{services,data,utils,pdf,auth,api}
```

### Step 2: Move Non-Code Files (Safe)
- Move all .md files to docs/ (except README.md - keep copy in root)
- Move all .sql files to database/
- Move all standalone .js scripts to scripts/

### Step 3: Reorganize src/lib (Requires Import Updates)
- Categorize and move files to appropriate subdirectories
- Update all import statements
- Run TypeScript compiler to verify

### Step 4: Move Test Files (Requires Config Updates)
- Move all .spec.js files to tests/e2e/
- Move all .test.js files to tests/unit/
- Update jest.config.js and playwright.config.js

### Step 5: Update Configurations
- Update package.json scripts
- Update test runner configurations
- Update .gitignore if needed

### Step 6: Validation
- Run `npm run build` to verify builds
- Run `npm test` to verify tests
- Run `npx playwright test` to verify E2E tests
- Test all database scripts

## 📊 Expected Outcomes

### Before Reorganization:
- Root directory: 197 items (cluttered)
- File discovery: Difficult
- Maintenance: Challenging
- Onboarding: Confusing

### After Reorganization:
- Root directory: ~25 items (clean)
- File discovery: Intuitive
- Maintenance: Straightforward
- Onboarding: Clear structure

## ✅ Success Metrics

1. **Root Directory**: Reduced from 197 to <30 files
2. **Clear Separation**: Database, scripts, tests, docs in dedicated folders
3. **No Broken Imports**: All imports updated and working
4. **Tests Pass**: All existing tests continue to pass
5. **Build Success**: Production build completes without errors

## 🎯 Priority Order

1. **Immediate** (Day 1):
   - Create new directory structure
   - Move documentation files
   - Move SQL files

2. **Short-term** (Day 2):
   - Move scripts and update package.json
   - Move test files and update configs

3. **Medium-term** (Day 3-4):
   - Reorganize src/lib into subcategories
   - Update all import statements
   - Comprehensive testing

## 📝 Tracking Checklist

### Phase 1: Structure Creation
- [ ] Create database/ directory structure
- [ ] Create scripts/ directory structure
- [ ] Create tests/ directory structure
- [ ] Create config/ directory structure
- [ ] Create src/lib/ subdirectories

### Phase 2: File Migration
- [ ] Move all .md files to docs/
- [ ] Move all .sql files to database/
- [ ] Move all script .js files to scripts/
- [ ] Move all test files to tests/
- [ ] Move jest/playwright configs to config/

### Phase 3: Library Reorganization
- [ ] Categorize lib/ files by function
- [ ] Move services to lib/services/
- [ ] Move utilities to lib/utils/
- [ ] Move data layer to lib/data/
- [ ] Update all import statements

### Phase 4: Configuration Updates
- [ ] Update package.json scripts
- [ ] Update jest.config.js paths
- [ ] Update playwright.config.js paths
- [ ] Update tsconfig.json paths if needed
- [ ] Update .gitignore if needed

### Phase 5: Validation
- [ ] Run TypeScript compiler
- [ ] Run all unit tests
- [ ] Run all E2E tests
- [ ] Test all database scripts
- [ ] Verify production build

## 🔄 Rollback Plan

If issues arise during reorganization:

1. **Git Reset**: All changes tracked in Git for easy rollback
2. **Incremental Approach**: Each phase can be completed independently
3. **Testing Gates**: No phase proceeds without passing tests
4. **Backup**: Create full backup before starting

## 💡 Additional Recommendations

1. **Add README files** in each major directory explaining its purpose
2. **Create index.ts barrels** in lib/ subdirectories for cleaner imports
3. **Implement naming conventions**:
   - kebab-case for all files
   - Numbered prefixes for migrations (001_, 002_, etc.)
4. **Add .gitkeep** files to maintain empty directory structure
5. **Document the new structure** in main README.md

## 🎉 Conclusion

This reorganization will transform the project from a cluttered, difficult-to-navigate codebase into a clean, professional, enterprise-grade structure. The new organization follows Next.js best practices, maintains clear separation of concerns, and significantly improves developer experience.

**Estimated Time**: 4-6 hours for complete reorganization
**Risk Level**: Low to Medium
**Impact**: High positive impact on maintainability

---

*This analysis provides a comprehensive roadmap for reorganizing the Air Niugini PMS project structure while maintaining system integrity and minimizing risk.*