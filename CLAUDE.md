# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Air Niugini B767 Pilot Management System - A comprehensive pilot certification tracking and leave request management system for Papua New Guinea's national airline fleet operations.

**Current Status**: Production-ready system with authentication, pilot CRUD operations, certification tracking, leave management, dashboard functionality, and comprehensive testing suite.

## Commands

### Development

```bash
npm run dev          # Start dev server on http://localhost:3001
npm run build        # Production build (SKIP_ENV_VALIDATION=true)
npm run build:analyze # Build with bundle analyzer
npm start            # Start production server
npm run lint         # ESLint with Next.js rules
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking
npm run validate     # Run all checks (format, lint, type-check, test, build)
```

### Testing

```bash
# Jest unit tests
npm test                  # Run all tests
npm run test:watch        # Jest watch mode
npm run test:coverage     # Coverage report
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:ci           # CI mode with coverage

# Playwright E2E tests
npx playwright test                    # Run all E2E tests
npx playwright test test-login.spec.js # Run specific test
npx playwright test --headed           # Run with browser visible
npx playwright test --ui               # Run with Playwright UI
```

### Database Operations

```bash
node test-connection.js           # Test Supabase connection
node deploy-schema.js             # Deploy complete database schema
node populate-data.js             # Populate with sample data
node create-users.js              # Create system users
node run-seniority-migration.js   # Update seniority calculations
```

## Technology Stack

- **Framework**: Next.js 14.2.33 with App Router
- **Runtime**: React 18.3.1, TypeScript 5.9.2 (strict mode)
- **Database**: Supabase PostgreSQL (Project ID: wgdmgvonqysflwdiiols)
- **Authentication**: Supabase Auth with role-based permissions (admin/manager)
- **State Management**: React Context API (AuthContext) + TanStack Query 5.90.2
- **Forms**: React Hook Form 7.63.0 with Zod 4.1.11 validation
- **Styling**: TailwindCSS 3.4.17 with Air Niugini brand colors (#E4002B red, #FFC72C gold)
- **Icons**: Lucide React 0.544.0
- **PDF**: @react-pdf/renderer 4.3.1
- **Charts**: Chart.js 4.5.0 with react-chartjs-2 5.3.0
- **Testing**: Playwright 1.55.1 (E2E) + Jest 29.7.0 (unit)
- **PWA**: next-pwa 5.6.0 with offline support

## Database Architecture

### Production Tables (Live Data)
- **pilots** (27 records) - Main pilot information with seniority tracking
- **pilot_checks** (571 records) - Certification tracking with expiry dates
- **check_types** (34 records) - Aviation certification types across 8 categories
- **an_users** (3 records) - System authentication (admin/manager roles)
- **leave_requests** (12 records) - Leave management tied to 28-day roster periods
- **settings** (3 records) - System configuration
- **contract_types** (3 records) - Pilot contract classifications

### Database Views (Optimized Queries)
- **compliance_dashboard** - Fleet compliance metrics
- **pilot_report_summary** - Comprehensive pilot summaries
- **detailed_expiring_checks** - Expiring certifications with details
- **expiring_checks** - Simplified expiring checks
- **captain_qualifications_summary** - Captain qualifications

**IMPORTANT**: Legacy `an_*` tables (except `an_users`) were removed 2025-10-03. Always use production tables (`pilots`, `pilot_checks`, `check_types`).

## Architecture Patterns

### 1. Service Layer (Critical Pattern)

**Always use dedicated service functions** - never make direct database calls in API routes or components. This ensures consistency and prevents production issues.

```typescript
// ✅ Correct - Service layer pattern
// src/lib/expiring-certifications-service.ts
export async function getExpiringCertifications(daysAhead: number = 60) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data } = await supabaseAdmin
    .from('pilot_checks')
    .select(`
      id, expiry_date,
      pilots!inner (id, first_name, last_name, employee_id),
      check_types!inner (id, check_code, check_description, category)
    `)
    .not('expiry_date', 'is', null)
    .order('expiry_date', { ascending: true });

  return processedData;
}

// API routes use service functions
// src/app/api/expiring-certifications/route.ts
import { getExpiringCertifications } from '@/lib/expiring-certifications-service';

export async function GET(request: NextRequest) {
  const result = await getExpiringCertifications(daysAhead);
  return NextResponse.json({ success: true, data: result });
}

// ❌ Wrong - Direct database calls in API routes
const { data } = await supabase.from('pilot_checks').select('*');
```

**Key Services**:
- `pilot-service.ts` - Pilot CRUD operations
- `leave-service.ts` - Leave request operations
- `leave-eligibility-service.ts` - Seniority & crew availability logic
- `expiring-certifications-service.ts` - Certification expiry logic
- `dashboard-service.ts` - Dashboard statistics
- `analytics-service.ts` - Analytics data processing
- `pdf-data-service.ts` - PDF report data preparation
- `cache-service.ts` - Performance caching layer
- `audit-log-service.ts` - Audit trail logging
- `email-service.ts` - Email notifications

### 2. Progressive Web App (PWA) Architecture

The system is a full PWA with offline support via `next-pwa`:

**Caching Strategies** (configured in `next.config.js`):
- **CacheFirst**: Google fonts (1 year)
- **StaleWhileRevalidate**: Images (24h), fonts (7 days), CSS/JS (24h)
- **NetworkFirst**: API calls (1 min), Supabase API (1 min), dashboard pages (5 min)

**Offline Handling**:
- Fallback page: `/offline` (src/app/offline.tsx)
- Service worker: `public/service-worker.js`
- Offline component: `src/components/offline/OfflineIndicator.tsx`

**PWA Features**:
- Auto-registration on production
- Skip waiting enabled for instant updates
- Runtime caching for all static assets
- API response caching with network timeout

### 3. Webpack Optimization & Code Splitting

**Critical optimization** in `next.config.js`:

```javascript
webpack: (config, { dev, isServer }) => {
  config.optimization.splitChunks = {
    chunks: 'all',
    cacheGroups: {
      vendor: { test: /[\\/]node_modules[\\/]/, name: 'vendors', priority: 10 },
      react: { test: /react|react-dom/, name: 'react-vendor', priority: 20 },
      radixui: { test: /@radix-ui/, name: 'radix-vendor', chunks: 'async', priority: 15 },
      charts: { test: /chart\.js|recharts/, name: 'chart-vendor', chunks: 'async', priority: 15 },
      heavy: { test: /framer-motion|@react-pdf/, name: 'heavy-vendor', chunks: 'async', priority: 15 },
      common: { minChunks: 2, priority: 5, reuseExistingChunk: true }
    }
  };
}
```

**Package Import Optimization**:
- Optimized imports for: lucide-react, @tanstack/react-query, date-fns, framer-motion, recharts, chart.js, @radix-ui components

### 4. Core Business Logic

**28-Day Roster Periods** (`src/lib/roster-utils.ts`):
```typescript
const ROSTER_DURATION = 28;
const KNOWN_ROSTER = {
  number: 11,
  year: 2025,
  endDate: new Date('2025-10-10')
};

export function getCurrentRosterPeriod() {
  const today = new Date();
  const daysSinceKnown = differenceInDays(today, KNOWN_ROSTER.endDate);
  const periodsPassed = Math.floor(daysSinceKnown / ROSTER_DURATION);

  return {
    code: `RP${number}/${year}`,
    startDate: calculatedStart,
    endDate: calculatedEnd
  };
}
```

**Certification Status (FAA Color Coding)** (`src/lib/certification-utils.ts`):
```typescript
export function getCertificationStatus(expiryDate: Date | null) {
  if (!expiryDate) return { color: 'gray', label: 'No Date' };

  const daysUntilExpiry = differenceInDays(expiryDate, new Date());

  if (daysUntilExpiry < 0) {
    return { color: 'red', label: 'Expired', className: 'bg-red-100 text-red-800' };
  }
  if (daysUntilExpiry <= 30) {
    return { color: 'yellow', label: 'Expiring Soon', className: 'bg-yellow-100 text-yellow-800' };
  }
  return { color: 'green', label: 'Current', className: 'bg-green-100 text-green-800' };
}
```

**Seniority Calculations** (`src/lib/roster-utils.ts`):
```typescript
// Seniority based on commencement date (1 = most senior)
export function calculateSeniority(pilots: Pilot[]) {
  return pilots
    .filter(p => p.commencement_date)
    .sort((a, b) => new Date(a.commencement_date).getTime() - new Date(b.commencement_date).getTime())
    .map((pilot, index) => ({ ...pilot, seniority_number: index + 1 }));
}
```

**Permission System** (`src/lib/auth-utils.ts`):
```typescript
export const permissions = {
  canCreate: (user: User) => user.role === 'admin',
  canEdit: (user: User) => ['admin', 'manager'].includes(user.role),
  canDelete: (user: User) => user.role === 'admin',
  canApprove: (user: User) => ['admin', 'manager'].includes(user.role)
};
```

## Leave Management System

### Approval Rules (Updated 2025-10-04)

**CRITICAL**: Captains and First Officers are evaluated **SEPARATELY**. Each rank has independent minimum requirements (10 Captains AND 10 First Officers).

**Scenario 1**: No other pilots of same rank requesting same dates + above minimum crew
→ **APPROVE** (no seniority comparison shown)

**Scenario 2**: Multiple pilots of same rank requesting same dates
→ **ALWAYS show seniority comparison** (informational display)

Sub-scenarios based on crew availability:
- **2a**: Can approve ALL pilots while staying above minimum (≥10) → Green border, approve all, NO spreading recommendations
- **2b**: Can approve SOME while maintaining minimum (≥10) → Yellow border, approve highest seniority, show spreading recommendations
- **2c**: Below minimum crew already → Red border, recommend spreading/sequential approval for all

**Priority Order (Within Same Rank Only)**:
1. Seniority Number (Lower = Higher priority, 1 = most senior)
2. Request Submission Date (Earlier = Higher priority, tiebreaker)

### Key Components

1. **Final Review Alert** (`src/components/leave/FinalReviewAlert.tsx`)
   - Displays 22 days before next roster period starts
   - **ONLY shows when `pendingCount > 0`** (hidden if no pending requests)
   - Applies ONLY to NEXT roster period (not current, not following)
   - Severity: urgent (≤7 days), warning (8-22 days), info (>22 days)

2. **Seniority Priority Review** (`src/components/leave/LeaveEligibilityAlert.tsx`)
   - **ALWAYS displays when 2+ pilots OF SAME RANK request same/overlapping dates**
   - Shows seniority comparison regardless of crew availability
   - Border color: green (sufficient ≥10) vs yellow (shortage <10)
   - Lists pilots sorted by: Seniority Number → Request Date

3. **Leave Eligibility Service** (`src/lib/leave-eligibility-service.ts`)
   - Checks crew availability: min 10 Captains AND 10 First Officers (independently)
   - Detects conflicting requests (exact, partial, adjacent overlaps)
   - Filters conflicts by rank - Captains ONLY compared with Captains
   - Generates spreading recommendations ONLY when crew shortage exists

**Complete documentation**: See `LEAVE_MANAGEMENT_SYSTEM.md` (645 lines)

## Component Organization

### Feature-Based Structure

Components are organized by domain:

```
src/components/
├── analytics/          # Analytics dashboard components
├── audit/              # Audit log viewers
├── auth/               # AuthProvider, ProtectedRoute
├── calendar/           # Leave calendar components
├── certifications/     # Certification tracking UI
├── charts/             # Chart.js wrappers
├── command/            # Command palette (Cmd+K)
├── dashboard/          # Dashboard widgets
├── documents/          # Document management
├── error/              # Error boundaries
├── layout/             # DashboardLayout, Navigation
├── lazy/               # Lazy-loaded components
├── leave/              # Leave management UI
├── notifications/      # Toast notifications
├── offline/            # Offline indicators
├── pilots/             # Pilot management UI
├── providers/          # React Query, Context providers
├── reports/            # PDF report components
├── settings/           # Settings UI
└── ui/                 # Generic Radix UI components
```

### Lazy Loading Pattern

Heavy components are lazy-loaded to improve initial page load:

```typescript
// src/components/lazy/LazyChart.tsx
import dynamic from 'next/dynamic';

export const LazyLineChart = dynamic(
  () => import('../charts/LineChart').then(mod => ({ default: mod.LineChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
);
```

Used for: Charts, PDF viewers, calendar views, analytics dashboards

## Air Niugini Branding

### Color Palette (Strict Adherence)

```css
--air-niugini-red: #e4002b;     /* Headers, buttons, alerts */
--air-niugini-gold: #ffc72c;    /* Accents, highlights */
--air-niugini-black: #000000;   /* Navigation, text */
--air-niugini-white: #ffffff;   /* Backgrounds */
```

### UI Standards

```tsx
// ✅ Correct - Air Niugini branded
<button className="bg-[#E4002B] hover:bg-[#C00020] text-white">Submit</button>

// Status indicators (FAA standards)
<span className="bg-red-100 text-red-800">Expired</span>
<span className="bg-yellow-100 text-yellow-800">Expiring Soon</span>
<span className="bg-green-100 text-green-800">Current</span>
```

## Environment Configuration

```env
# Required (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://wgdmgvonqysflwdiiols.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_PROJECT_ID=wgdmgvonqysflwdiiols
NEXT_PUBLIC_APP_NAME=Air Niugini Pilot Management System
NEXT_PUBLIC_CURRENT_ROSTER=RP11/2025
NEXT_PUBLIC_ROSTER_END_DATE=2025-10-10
```

**IMPORTANT**: Never include trailing newlines/spaces in production environment variables.

## Critical Business Rules

1. **Roster Periods**: All leave requests fall within 28-day roster boundaries
2. **Certification Compliance**: Color-coded status (red/yellow/green) drives all UI
3. **Role-Based Access**: Admin (full CRUD), Manager (edit/approve only)
4. **Data Integrity**: Employee IDs unique across pilots table
5. **Seniority System**: Based on commencement date (1 = most senior)
6. **Production Tables**: Always use `pilots`, `pilot_checks`, `check_types` (NOT `an_*` legacy tables)
7. **Air Niugini Branding**: Consistent colors (#E4002B red, #FFC72C gold)
8. **Rank Separation**: Captains and First Officers evaluated independently

## Common Pitfalls

### 1. Table Selection
```typescript
// ❌ Wrong - Don't use an_ legacy tables (except an_users)
await supabase.from('an_pilots').select('*')

// ✅ Correct - Use production tables
await supabase.from('pilots').select('*')
```

### 2. Production API Calls
```typescript
// ❌ Wrong - Inter-API HTTP calls fail in production
const response = await fetch(`${process.env.VERCEL_URL}/api/certifications`);

// ✅ Correct - Direct service calls
import { getExpiringCertifications } from '@/lib/expiring-certifications-service';
const certifications = await getExpiringCertifications(timeframeDays);
```

### 3. Date Handling
```typescript
// ❌ Wrong - String comparison
if (expiryDate < today) { }

// ✅ Correct - Use date-fns
import { isBefore } from 'date-fns';
if (isBefore(expiryDate, today)) { }
```

### 4. PWA Service Worker
```typescript
// ❌ Wrong - Importing service worker in components
import '/service-worker.js';

// ✅ Correct - Service worker auto-registered by next-pwa
// No manual registration needed
```

## Development Workflow

### Starting Fresh Session
1. Navigate: `cd "/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"`
2. Verify database: `node test-connection.js`
3. Start dev: `npm run dev`
4. Run tests if modifying critical features: `npx playwright test`

### Making Database Changes
1. Create migration SQL file in project root
2. Test locally: `node deploy-schema.js`
3. Verify application functions
4. Update TypeScript types if schema changed (use Supabase MCP)
5. Run test suites: `npm test && npx playwright test`

### Code Quality Workflow
```bash
# Pre-commit (runs automatically via Husky)
npm run format          # Format code
npm run lint:fix        # Fix linting issues
npm run type-check      # Verify TypeScript

# Full validation before deployment
npm run validate        # Runs: format:check, lint, type-check, test, build
```

## Performance Optimization

### Database
- Use single queries with joins (not multiple round trips)
- Leverage database views (`expiring_checks`, `pilot_checks_overview`)
- Index frequently filtered columns
- Use RLS policies for security without performance impact

### Frontend
- Lazy load heavy components (charts, PDF viewers)
- Use TanStack Query caching (2-30 min stale times)
- Dynamic imports for large libraries
- Service layer prevents inter-API HTTP calls

### PWA Caching
- Static assets: StaleWhileRevalidate (24h)
- API calls: NetworkFirst with 1-min cache
- Dashboard pages: NetworkFirst with 5-min cache
- Offline fallback: `/offline` page

## Production Features

✅ **Complete Authentication** - Admin/manager roles with Supabase Auth
✅ **Pilot CRUD Operations** - Full CRUD with validation
✅ **Certification Tracking** - 571 certifications, 34 types, automated monitoring
✅ **Leave Management** - Seniority-based conflict resolution, crew availability
✅ **Final Review Alert** - 22 days before roster (shows only when pending)
✅ **Seniority Priority Review** - Always shows for 2+ pilots requesting same dates
✅ **Crew Availability** - Min 10 Captains + 10 First Officers
✅ **Roster Period Filtering** - 28-day cycles (All/Next/Following)
✅ **PDF Reports** - Certification expiry and roster leave
✅ **Analytics Dashboard** - Charts, metrics, fleet statistics
✅ **E2E Test Suite** - Comprehensive Playwright tests
✅ **PWA Support** - Offline capability with service worker
✅ **Service Layer Architecture** - Production-stable communication

## Important Reminders

1. **Focus**: Pilot certification and leave management (NOT full ERP)
2. **Data Integrity**: Verify against live production data (27 pilots, 571 certifications)
3. **Air Niugini Standards**: Maintain consistent branding
4. **Performance**: Optimized queries and PWA caching
5. **Testing**: Comprehensive E2E coverage ensures reliability
6. **Security**: Role-based access control and RLS policies
7. **Production Stability**: Service layer prevents inter-API issues
8. **Environment**: Clean variables without trailing characters
9. **Leave Management**: Seniority ALWAYS shows for 2+ pilots, Final Review ONLY when pending

---

**Air Niugini B767 Pilot Management System**
_Papua New Guinea's National Airline Fleet Operations Management_
_Production System - Version 1.0_
