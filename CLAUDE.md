# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**B767 Pilot Management System** - Production-ready pilot certification tracking and leave management system for fleet operations.

**Status**: ✅ Production (v1.0) | 27 pilots | 571 certifications | 34 check types

## Commands

### Development
```bash
npm run dev                    # Dev server (http://localhost:3001)
npm run build                  # Production build
npm run build:analyze          # Bundle analysis
npm start                      # Production server
npm run lint                   # ESLint
npm run lint:fix               # Auto-fix ESLint
npm run format                 # Prettier format
npm run type-check             # TypeScript validation
npm run validate               # Full validation (format, lint, type-check, test, build)
```

### Testing
```bash
# Jest unit tests
npm test                       # All tests
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report
npm run test:unit              # Unit tests only
npm run test:integration       # Integration tests

# Playwright E2E
npx playwright test            # All E2E tests
npx playwright test test-login.spec.js  # Specific test
npx playwright test --headed   # Visible browser
npx playwright test --ui       # Playwright UI
npx playwright test --debug    # Debug mode
```

### Database
```bash
node test-connection.js        # Test Supabase connection
node deploy-schema.js          # Deploy schema
node populate-data.js          # Populate sample data
node create-users.js           # Create system users
node run-seniority-migration.js  # Update seniority
```

## Technology Stack

- **Framework**: Next.js 14.2.33 (App Router), React 18.3.1, TypeScript 5.9.2 (strict)
- **Database**: Supabase PostgreSQL (Project: wgdmgvonqysflwdiiols)
- **Auth**: Supabase Auth (admin/manager roles, RLS policies)
- **State**: React Context API (AuthContext) + TanStack Query 5.90.2
- **Forms**: React Hook Form 7.63.0 + Zod 4.1.11
- **Styling**: TailwindCSS 3.4.17 with custom design system
- **PWA**: next-pwa 5.6.0 (offline support, service worker)
- **PDF**: @react-pdf/renderer 4.3.1
- **Charts**: Chart.js 4.5.0 + react-chartjs-2 5.3.0
- **Testing**: Playwright 1.55.1 (E2E) + Jest 29.7.0 (unit)

## Critical Architecture Patterns

### 1. Service Layer (MOST CRITICAL)

**Always use service functions** - never make direct database calls in API routes. This prevents production inter-API call failures.

```typescript
// ✅ CORRECT - Service layer pattern
// src/lib/expiring-certifications-service.ts
export async function getExpiringCertifications(daysAhead: number = 60) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data } = await supabaseAdmin
    .from('pilot_checks')
    .select(`
      id, expiry_date,
      pilots!inner (id, first_name, last_name),
      check_types!inner (check_code, check_description)
    `)
    .order('expiry_date', { ascending: true });
  return processedData;
}

// API routes call service functions
// src/app/api/expiring-certifications/route.ts
import { getExpiringCertifications } from '@/lib/expiring-certifications-service';

export async function GET(request: NextRequest) {
  const result = await getExpiringCertifications(daysAhead);
  return NextResponse.json({ success: true, data: result });
}

// ❌ WRONG - Direct database calls in API routes
const { data } = await supabase.from('pilot_checks').select('*');

// ❌ WRONG - Inter-API HTTP calls fail in production
const response = await fetch(`${process.env.VERCEL_URL}/api/certifications`);
```

**Why This Matters**: Vercel's production environment doesn't support inter-API HTTP calls. Service layer ensures reusability and production stability.

**Key Services**:
- `pilot-service.ts` - Pilot CRUD
- `leave-service.ts` - Leave requests
- `leave-eligibility-service.ts` - Seniority & crew availability (complex)
- `expiring-certifications-service.ts` - Certification expiry logic
- `dashboard-service.ts` - Dashboard stats
- `analytics-service.ts` - Analytics processing
- `pdf-data-service.ts` - PDF report data
- `cache-service.ts` - Performance caching

### 2. 28-Day Roster Period System

**Core Business Logic** (`src/lib/roster-utils.ts`):

```typescript
const ROSTER_DURATION = 28;
const KNOWN_ROSTER = {
  number: 12,
  year: 2025,
  startDate: new Date('2025-10-11'),
};

export function getCurrentRosterPeriod() {
  const today = startOfDay(new Date());
  const daysSinceKnown = differenceInDays(today, KNOWN_ROSTER.startDate);
  const periodsPassed = Math.floor(daysSinceKnown / ROSTER_DURATION);

  // RP1-RP13 annual cycle (13 periods × 28 days = 364 days)
  // After RP13/YYYY → RP1/(YYYY+1)

  return {
    code: `RP${number}/${year}`,
    startDate: calculatedStart,
    endDate: calculatedEnd,
    daysRemaining: differenceInDays(endDate, today)
  };
}
```

**Critical**: All leave requests must fall within roster period boundaries. Use `getRosterPeriodFromDate()` to validate dates.

### 3. Leave Eligibility Rules (Complex)

**Rank-Separated Logic** (`src/lib/leave-eligibility-service.ts`):

**CRITICAL PRINCIPLE**: Captains and First Officers evaluated **SEPARATELY**. Each rank has independent minimum requirements.

**Minimum Crew**: 10 Captains AND 10 First Officers (per rank, not combined)

**Approval Logic**:

```typescript
// SCENARIO 1: No conflicts (solo request)
if (currentAvailable - 1 >= 10) {
  return 'APPROVE'; // Sufficient crew remains
}

// SCENARIO 2: Multiple pilots OF SAME RANK requesting
const remainingAfterAll = currentAvailable - totalRequesting;

if (remainingAfterAll >= 10) {
  return 'APPROVE_ALL'; // Green border - approve everyone
} else if (remainingAfterAll < 10 && currentAvailable > 10) {
  return 'APPROVE_PARTIAL'; // Yellow border - approve highest seniority
} else {
  return 'REVIEW_REQUIRED'; // Red border - below minimum already
}
```

**Priority Order (Within Same Rank)**:
1. Seniority Number (lower = higher priority, 1 = most senior)
2. Request Submission Date (tiebreaker)

**Key Components**:
- `FinalReviewAlert.tsx` - 22 days before next roster (ONLY shows when pendingCount > 0)
- `LeaveEligibilityAlert.tsx` - ALWAYS displays when 2+ pilots of same rank request same dates
- Border colors: green (sufficient), yellow (shortage), red (below minimum)

### 4. PWA Architecture

**next-pwa Configuration** (`next.config.js`):

```javascript
// Caching Strategies
const cacheStrategies = {
  fonts: 'CacheFirst',           // 1 year
  images: 'StaleWhileRevalidate', // 24h
  api: 'NetworkFirst',            // 1 min
  dashboard: 'NetworkFirst'       // 5 min
};
```

**Offline Support**:
- Fallback page: `/offline` (`src/app/offline.tsx`)
- Service worker: `public/service-worker.js` (auto-generated)
- Offline indicator: `src/components/offline/OfflineIndicator.tsx`

**Features**:
- Auto-registration on production
- Skip waiting enabled (instant updates)
- Runtime caching for static assets
- API response caching with network timeout

### 5. Webpack Optimization

**Critical for Performance** (`next.config.js`):

```javascript
webpack: (config, { dev, isServer }) => {
  config.optimization.splitChunks = {
    chunks: 'all',
    cacheGroups: {
      vendor: { test: /[\\/]node_modules[\\/]/, priority: 10 },
      react: { test: /react|react-dom/, priority: 20 },
      radixui: { test: /@radix-ui/, chunks: 'async', priority: 15 },
      charts: { test: /chart\.js|recharts/, chunks: 'async', priority: 15 },
      heavy: { test: /framer-motion|@react-pdf/, chunks: 'async', priority: 15 }
    }
  };
};
```

**Lazy Loading Pattern**:

```typescript
// src/components/lazy/LazyChart.tsx
export const LazyLineChart = dynamic(
  () => import('../charts/LineChart').then(mod => ({ default: mod.LineChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
);
```

Used for: Charts, PDF viewers, calendar views, analytics dashboards

## Database Architecture

### Production Tables (Active)
- `pilots` (27 records) - Pilot info with seniority tracking
- `pilot_checks` (571 records) - Certifications with expiry dates
- `check_types` (34 records) - Certification types (8 categories)
- `an_users` (3 records) - System authentication (admin/manager)
- `leave_requests` (12 records) - Leave tied to roster periods
- `settings` (3 records) - System config
- `contract_types` (3 records) - Pilot contracts

### Database Views (Optimized)
- `compliance_dashboard` - Fleet compliance metrics
- `pilot_report_summary` - Comprehensive pilot summaries
- `detailed_expiring_checks` - Expiring certs with details
- `expiring_checks` - Simplified expiring certs
- `captain_qualifications_summary` - Captain qualifications

**IMPORTANT**: Legacy `an_*` tables (except `an_users`) removed 2025-10-03. Always use production tables.

## Certification Status Logic

**FAA Color Coding** (`src/lib/certification-utils.ts`):

```typescript
export function getCertificationStatus(expiryDate: Date | null) {
  if (!expiryDate) return { color: 'gray', label: 'No Date' };

  const daysUntilExpiry = differenceInDays(expiryDate, new Date());

  if (daysUntilExpiry < 0) {
    return { color: 'red', label: 'Expired' };
  }
  if (daysUntilExpiry <= 30) {
    return { color: 'yellow', label: 'Expiring Soon' };
  }
  return { color: 'green', label: 'Current' };
}
```

## Permission System

**Role-Based Access** (`src/lib/auth-utils.ts`):

```typescript
export const permissions = {
  canCreate: (user: User) => user.role === 'admin',
  canEdit: (user: User) => ['admin', 'manager'].includes(user.role),
  canDelete: (user: User) => user.role === 'admin',
  canApprove: (user: User) => ['admin', 'manager'].includes(user.role),
};
```

## Environment Configuration

```env
NEXT_PUBLIC_SUPABASE_URL=https://wgdmgvonqysflwdiiols.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_PROJECT_ID=wgdmgvonqysflwdiiols
NEXT_PUBLIC_APP_NAME=B767 Pilot Management System
NEXT_PUBLIC_CURRENT_ROSTER=RP12/2025
NEXT_PUBLIC_ROSTER_END_DATE=2025-11-07
```

**CRITICAL**: No trailing newlines/spaces in production env vars.

## Common Pitfalls

### 1. Production API Calls
```typescript
// ❌ WRONG - Inter-API HTTP calls fail
const res = await fetch(`${process.env.VERCEL_URL}/api/certifications`);

// ✅ CORRECT - Direct service calls
import { getExpiringCertifications } from '@/lib/expiring-certifications-service';
const certs = await getExpiringCertifications(60);
```

### 2. Table Selection
```typescript
// ❌ WRONG - Legacy tables (except an_users)
await supabase.from('an_pilots').select('*');

// ✅ CORRECT - Production tables
await supabase.from('pilots').select('*');
```

### 3. Date Handling
```typescript
// ❌ WRONG - String comparison
if (expiryDate < today) { }

// ✅ CORRECT - Use date-fns
import { isBefore } from 'date-fns';
if (isBefore(expiryDate, today)) { }
```

### 4. Service Worker
```typescript
// ❌ WRONG - Manual registration
import '/service-worker.js';

// ✅ CORRECT - Auto-registered by next-pwa
// No manual registration needed
```

## Component Organization

Feature-based structure:
```
src/components/
├── analytics/          # Analytics dashboards
├── audit/              # Audit log viewers
├── auth/               # AuthProvider, ProtectedRoute
├── calendar/           # Leave calendars
├── certifications/     # Cert tracking UI
├── charts/             # Chart.js wrappers (lazy loaded)
├── command/            # Command palette (Cmd+K)
├── dashboard/          # Dashboard widgets
├── documents/          # Document management
├── error/              # Error boundaries
├── layout/             # DashboardLayout, Navigation
├── lazy/               # Lazy-loaded heavy components
├── leave/              # Leave management UI
├── notifications/      # Toast notifications
├── offline/            # Offline indicators
├── pilots/             # Pilot management UI
├── providers/          # React Query, Context
├── reports/            # PDF reports
├── settings/           # Settings UI
└── ui/                 # Generic Radix UI components
```

## Critical Business Rules

1. **Roster Periods**: All leave requests within 28-day boundaries
2. **Certification Compliance**: Color-coded (red/yellow/green) drives all UI
3. **Role-Based Access**: Admin (full CRUD), Manager (edit/approve)
4. **Data Integrity**: Unique employee IDs across pilots table
5. **Seniority System**: Based on commencement_date (1 = most senior)
6. **Production Tables**: Use `pilots`, `pilot_checks`, `check_types` (NOT `an_*` legacy)
7. **Rank Separation**: Captains/First Officers evaluated independently (10 minimum each)

## Performance Optimization

### Database
- Use single queries with joins (not multiple round trips)
- Leverage database views for complex aggregations
- Index frequently filtered columns
- RLS policies for security without performance impact

### Frontend
- Lazy load heavy components (charts, PDFs)
- TanStack Query caching (2-30 min stale times)
- Dynamic imports for large libraries
- Service layer prevents inter-API HTTP calls

### PWA Caching
- Static assets: StaleWhileRevalidate (24h)
- API calls: NetworkFirst (1 min cache)
- Dashboard: NetworkFirst (5 min cache)
- Offline fallback: `/offline` page

## Development Workflow

### Starting Session
1. `cd "/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"`
2. `node test-connection.js` (verify database)
3. `npm run dev`
4. `npx playwright test` (if modifying critical features)

### Database Changes
1. Create migration SQL file in project root
2. Test locally: `node deploy-schema.js`
3. Verify application functions
4. Update TypeScript types (use Supabase MCP)
5. Run tests: `npm test && npx playwright test`

### Code Quality
```bash
# Pre-commit (auto via Husky)
npm run format
npm run lint:fix
npm run type-check

# Full validation
npm run validate
```

## Documentation Files

**Root Level**:
- `CLAUDE.md` - This file
- `README.md` - Project overview
- `PLAN.md` - Implementation plan
- `SPEC.md` - Technical specification
- `IMPLEMENTATION_COMPLETE.md` - Completed features
- `IMPROVEMENTS_CHANGELOG.md` - Enhancement history

**Key Docs**:
- `docs/LEAVE_ELIGIBILITY_GUIDE.md` - Complete leave rules
- `UX_DESIGN_SPECIFICATIONS.md` - UI/UX standards

---

**B767 Pilot Management System**
*Fleet Operations Management*
*Production System - Version 1.0*
