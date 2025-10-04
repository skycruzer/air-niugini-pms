# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Air Niugini B767 Pilot Management System - A comprehensive pilot certification tracking and leave management system for Papua New Guinea's national airline fleet operations.

**Current Status**: Production-ready system with authentication, pilot CRUD operations, certification tracking, dashboard functionality, and comprehensive testing suite.

## Commands

### Development

```bash
# Start development server
npm run dev          # Starts on http://localhost:3001 (or 3000)

# Build and production
npm run build        # Build for production (SKIP_ENV_VALIDATION=true)
npm run build:analyze # Build with bundle analyzer
npm start            # Start production server
npm run lint         # Run ESLint with Next.js rules
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run type-check   # TypeScript type checking
npm run validate     # Run all checks (format, lint, type-check, test, build)
```

### Testing

```bash
# Jest unit tests
npm test                  # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage report
npm run test:unit         # Run unit tests only
npm run test:integration  # Run integration tests only
npm run test:ci           # Run tests in CI mode

# Playwright E2E tests
npx playwright test                    # Run all E2E tests
npx playwright test test-login.spec.js # Run specific test
npx playwright test --headed           # Run with browser visible
npx playwright test --ui               # Run with Playwright UI
```

### Database Operations

```bash
# Core database management scripts
node test-connection.js             # Test Supabase connection
node deploy-schema.js               # Deploy complete database schema
node populate-data.js               # Populate with sample data
node create-users.js                # Create system users
node run-seniority-migration.js     # Update seniority calculations
node execute-migration.js           # Execute custom migrations
```

## Architecture Overview

### Technology Stack

- **Framework**: Next.js 14.2.33 with App Router and TypeScript 5.9.2
- **Database**: Supabase PostgreSQL (Project ID: wgdmgvonqysflwdiiols) with Row Level Security
- **Authentication**: Supabase Auth with role-based permissions (admin/manager)
- **State Management**: React Context (AuthContext) + TanStack Query 5.90.2
- **Forms**: React Hook Form 7.63.0 with Zod 4.1.11 validation
- **Styling**: TailwindCSS 3.4.17 with Air Niugini brand colors
- **Icons**: Lucide React 0.544.0
- **Date Handling**: date-fns 4.1.0 for roster calculations
- **PDF Generation**: @react-pdf/renderer 4.3.1
- **Charts**: Chart.js 4.5.0 with react-chartjs-2 5.3.0
- **Testing**: Playwright 1.55.1 with comprehensive E2E test suite

### Database Architecture

**Production Tables** (Active Live Data):

- `pilots` (27 records) - Main pilot information with seniority tracking
- `pilot_checks` (571 records) - Certification tracking with expiry dates
- `check_types` (34 records) - Aviation certification types across 8 categories
- `an_users` (3 records) - System authentication (admin/manager roles)
- `leave_requests` (12 records) - Leave management tied to 28-day roster periods
- `settings` (3 records) - System configuration
- `contract_types` (3 records) - Pilot contract classifications

**Database Cleanup (2025-10-03)**:
- ✅ Removed legacy development tables: `an_pilots`, `an_pilot_checks`, `an_check_types`, `an_leave_requests`
- ✅ Kept `an_users` - This is the ACTIVE authentication table (not legacy)
- ✅ All production data intact and verified
- ✅ Application tested and working correctly

### Key Business Logic

#### 1. Roster Period System (28-Day Cycles)

```typescript
// Core roster calculation pattern
const ROSTER_DURATION = 28;
const KNOWN_ROSTER = {
  number: 11,
  year: 2025,
  endDate: new Date('2025-10-10'),
};

export function getCurrentRosterPeriod() {
  const today = new Date();
  const daysSinceKnown = differenceInDays(today, KNOWN_ROSTER.endDate);
  const periodsPassed = Math.floor(daysSinceKnown / ROSTER_DURATION);

  return {
    code: `RP${number}/${year}`,
    startDate: calculatedStart,
    endDate: calculatedEnd,
  };
}
```

#### 2. Certification Status Color Coding

```typescript
// Aviation compliance color system
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

#### 3. Seniority Calculations

```typescript
// Seniority based on commencement date (1 = most senior)
export function calculateSeniority(pilots: Pilot[]) {
  return pilots
    .filter((p) => p.commencement_date)
    .sort(
      (a, b) => new Date(a.commencement_date).getTime() - new Date(b.commencement_date).getTime()
    )
    .map((pilot, index) => ({
      ...pilot,
      seniority_number: index + 1,
    }));
}
```

#### 4. Permission System

```typescript
// Role-based access control pattern
export const permissions = {
  canCreate: (user: User) => user.role === 'admin',
  canEdit: (user: User) => ['admin', 'manager'].includes(user.role),
  canDelete: (user: User) => user.role === 'admin',
  canApprove: (user: User) => ['admin', 'manager'].includes(user.role),
};
```

### Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── dashboard/             # Protected dashboard pages
│   │   ├── pilots/           # Pilot management with [id] routes
│   │   ├── certifications/   # Certification tracking & calendar
│   │   ├── leave/            # Leave management & calendar
│   │   ├── analytics/        # Analytics dashboard
│   │   ├── reports/          # Report generation
│   │   └── settings/         # Admin settings
│   ├── login/                # Authentication pages
│   ├── api/                  # API routes for data operations
│   ├── layout.tsx            # Root layout with providers
│   └── globals.css           # Air Niugini branded styles
├── components/               # Reusable UI components
│   ├── auth/                # AuthProvider, ProtectedRoute
│   ├── layout/              # DashboardLayout, Navigation
│   ├── providers/           # React Query, Context providers
│   └── ui/                  # Generic UI components
├── contexts/                # React Context providers
│   └── AuthContext.tsx      # Authentication state management
├── lib/                     # Core business logic & services
│   ├── supabase.ts          # Database client & type definitions
│   ├── supabase-admin.ts    # Admin client wrapper for service operations
│   ├── pilot-service.ts     # Pilot CRUD operations
│   ├── pilot-service-client.ts # Client-side pilot operations
│   ├── expiring-certifications-service.ts # Certification expiry logic
│   ├── analytics-service.ts # Analytics data processing
│   ├── dashboard-service.ts # Dashboard statistics
│   ├── leave-service.ts     # Leave request operations
│   ├── settings-service.ts  # System settings management
│   ├── cache-service.ts     # Performance caching layer
│   ├── pdf-data-service.ts  # PDF report data preparation
│   ├── auth-utils.ts        # Permission & role management
│   ├── roster-utils.ts      # 28-day period calculations
│   └── certification-utils.ts # Status logic & validation
└── types/                   # TypeScript definitions
    ├── analytics.ts         # Analytics & reporting types
    └── pdf-reports.ts       # PDF generation types
```

### Service Layer Architecture

**Critical Pattern**: Use dedicated service functions for all data operations to ensure consistency and reusability between API routes and internal calls:

```typescript
// ✅ Correct - Service layer pattern with reusable functions
// src/lib/expiring-certifications-service.ts
import { getSupabaseAdmin } from '@/lib/supabase';

export async function getExpiringCertifications(daysAhead: number = 60) {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from('pilot_checks')
    .select(
      `
      id, expiry_date,
      pilots!inner (id, first_name, last_name, employee_id),
      check_types!inner (id, check_code, check_description, category)
    `
    )
    .not('expiry_date', 'is', null)
    .gte('expiry_date', today.toISOString().split('T')[0])
    .lte('expiry_date', futureDate.toISOString().split('T')[0])
    .order('expiry_date', { ascending: true });

  // Transform and return processed data with status calculations
  return processedData;
}

// API routes use service functions
// src/app/api/expiring-certifications/route.ts
import { getExpiringCertifications } from '@/lib/expiring-certifications-service';

export async function GET(request: NextRequest) {
  const result = await getExpiringCertifications(daysAhead);
  return NextResponse.json({ success: true, data: result });
}

// ❌ Incorrect - Direct database calls in API routes
const { data } = await supabase.from('pilot_checks').select('*');
```

**Service Layer Benefits**:

- Reusable between API routes and server-side operations
- Avoids inter-API HTTP calls in production
- Centralized business logic and data transformations
- Consistent error handling and logging

### Air Niugini Branding Standards

**Color Palette** (Strict Adherence Required):

```css
/* Primary Brand Colors */
--air-niugini-red: #e4002b; /* Headers, buttons, alerts */
--air-niugini-gold: #ffc72c; /* Accents, highlights */
--air-niugini-black: #000000; /* Navigation, text */
--air-niugini-white: #ffffff; /* Backgrounds */
```

**UI Component Standards**:

```tsx
// ✅ Correct - Air Niugini branded components
<button className="bg-[#E4002B] hover:bg-[#C00020] text-white">
  Submit
</button>

// Status indicators follow aviation standards
<span className="bg-red-100 text-red-800">Expired</span>
<span className="bg-yellow-100 text-yellow-800">Expiring Soon</span>
<span className="bg-green-100 text-green-800">Current</span>
```

### Authentication Flow

1. **Supabase Auth Integration**: Email/password authentication
2. **User Profile Mapping**: Fetch from `an_users` table for role assignment
3. **Context State Management**: AuthContext provides user state throughout app
4. **Route Protection**: ProtectedRoute component guards dashboard pages
5. **Permission Enforcement**: Role-based UI rendering and API access

### Database Query Optimization Patterns

```typescript
// ✅ Efficient - Single query with joins
const pilotsWithChecks = await supabase
  .from('pilots')
  .select(
    `
    *,
    pilot_checks (
      *,
      check_types (*)
    )
  `
  )
  .eq('is_active', true);

// ✅ Use database views for complex queries
const expiringChecks = await supabase
  .from('expiring_checks') // Pre-computed view
  .select('*')
  .lte('days_until_expiry', 30);
```

### Leave Management System Architecture

**Critical Business Logic** (Completed 2025-10-03, Updated 2025-10-04):

**APPROVAL RULES** (Updated 2025-10-04):

**CRITICAL**: Captains and First Officers are evaluated **SEPARATELY**. Each rank has independent minimum requirements (10 Captains AND 10 First Officers). Never compare priority across ranks.

**SCENARIO 1**: No other pilots of same rank requesting same dates + above minimum crew
→ **APPROVE** (no seniority comparison shown)

**SCENARIO 2**: Multiple pilots of same rank requesting same dates
→ **ALWAYS show seniority comparison** (informational display)
→ Sub-scenarios based on crew availability:
- **2a**: Can approve ALL pilots of this rank while staying above minimum (≥10) → Green border, approve all, NO spreading recommendations
- **2b**: Can approve SOME pilots while maintaining minimum (≥10) → Yellow border, approve highest seniority, show spreading recommendations for lower seniority
- **2c**: Below minimum crew already → Red border, recommend spreading/sequential approval for all

**Priority Order (Within Same Rank Only)**:
1. **Seniority Number** (Lower number = Higher priority, 1 = most senior)
2. **Request Submission Date** (Earlier submission = Higher priority, used as tiebreaker)

#### 1. Final Review Alert Component
**Location**: `src/components/leave/FinalReviewAlert.tsx`

**Key Behavior**:
- Displays 22 days before next roster period starts
- **ONLY shows when `pendingCount > 0`** (hidden if no pending requests)
- Applies ONLY to NEXT roster period (not current, not following)
- Severity levels: urgent (≤7 days), warning (8-22 days), info (>22 days)

```typescript
// Critical visibility logic
if (pendingCount === 0) {
  return null; // No alert if no pending requests
}
```

#### 2. Seniority Priority Review Component
**Location**: `src/components/leave/LeaveEligibilityAlert.tsx`

**Key Behavior**:
- **ALWAYS displays when 2+ pilots OF THE SAME RANK request same/overlapping dates**
- Shows complete seniority comparison regardless of crew availability
- Blue informational background (consistent for all scenarios)
- Border color indicates crew status: green (sufficient crew ≥10) vs yellow (crew shortage <10)
- Lists pilots of same rank sorted by: Seniority Number (lower = higher) → Request Date (earlier = higher)
- **Captains and First Officers are NEVER compared against each other** - evaluated separately with independent minimums

```typescript
// Always show seniority comparison for multiple pilots OF SAME RANK
const hasConflictingRequests = eligibility?.conflictingRequests &&
                               eligibility.conflictingRequests.length > 1;

// Detect sufficient crew based on seniorityRecommendation
// Empty or no "CREW SHORTAGE RISK" = sufficient crew
const hasSufficientCrew = !eligibility.seniorityRecommendation ||
  !eligibility.seniorityRecommendation.includes('CREW SHORTAGE RISK');

// Border color based on crew availability
const bgColor = 'bg-blue-50';
const borderColor = hasSufficientCrew ? 'border-green-400' : 'border-yellow-400';
```

#### 3. Leave Eligibility Service
**Location**: `src/lib/leave-eligibility-service.ts`

**Core Logic**:
- Checks crew availability: minimum 10 Captains AND 10 First Officers (independently)
- Detects conflicting requests (exact, partial, adjacent overlaps)
- Filters conflicts by rank - Captains ONLY compared with Captains, First Officers ONLY with First Officers
- Calculates seniority priority for conflict resolution within same rank
- Generates spreading recommendations ONLY when crew shortage exists
- Sorting priority: Seniority Number (lower = higher) → Request Date (earlier = higher)

```typescript
// Crew availability check (per rank)
const MIN_CAPTAINS_REQUIRED = 10;
const MIN_FIRST_OFFICERS_REQUIRED = 10;

// Filter by rank - critical for separate evaluation
const allConflictingRequests = conflictingPendingRequests
  .filter((req: any) => req.pilots?.role === request.pilotRole); // Same rank only!

// Crew calculation for this specific rank
const currentAvailable = requestingRole === 'Captain' ? availableCaptains : availableFirstOfficers;
const remainingAfterAllApprovals = currentAvailable - totalRequesting;
const canApproveAll = remainingAfterAllApprovals >= minimumRequired;

// NO spreading recommendations when sufficient crew
if (canApproveAll) {
  seniorityRecommendation = ''; // Empty = sufficient crew
}
```

#### 4. Roster Period Filtering
**Locations**: `src/app/dashboard/leave/page.tsx`, `src/components/leave/LeaveRequestsList.tsx`

**Filter Options**:
- **All Rosters**: Show all leave requests (current, next, following)
- **Next Roster Only**: Show requests starting in RP12/2025 (next 28-day period)
- **Following Rosters**: Show requests starting after next roster

```typescript
// Next roster boundary calculation
const currentRoster = getCurrentRosterPeriod();
const nextRosterStartDate = new Date(currentRoster.endDate);
nextRosterStartDate.setDate(nextRosterStartDate.getDate() + 1);
const nextRosterEndDate = new Date(nextRosterStartDate);
nextRosterEndDate.setDate(nextRosterEndDate.getDate() + 27); // 28-day period
```

**IMPORTANT**: For complete leave management documentation, see `LEAVE_MANAGEMENT_SYSTEM.md` (645 lines)

### Testing Architecture

**Playwright E2E Test Suite**:

- `test-login.spec.js` - Authentication flow testing
- `test-comprehensive.spec.js` - Full application workflow
- `test-error-handling.spec.js` - Error boundary testing
- `test-deployment.spec.js` - Production deployment validation

**Test Data Management**:

```javascript
// Production test pattern
const testCredentials = {
  email: 'skycruzer@icloud.com',
  password: 'mron2393',
};

// Always test against live production tables
await page.goto('http://localhost:3001/dashboard/pilots');
await expect(page.locator('[data-testid="pilot-count"]')).toContainText('27');
```

## Environment Configuration

```env
# Required environment variables
NEXT_PUBLIC_SUPABASE_URL=https://wgdmgvonqysflwdiiols.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_PROJECT_ID=wgdmgvonqysflwdiiols
NEXT_PUBLIC_APP_NAME=Air Niugini Pilot Management System
NEXT_PUBLIC_CURRENT_ROSTER=RP11/2025
NEXT_PUBLIC_ROSTER_END_DATE=2025-10-10
```

## Performance Configuration

### Next.js Optimizations (next.config.js)

- **React Strict Mode**: Disabled for production performance
- **SWC Minification**: Enabled for faster builds
- **Package Import Optimization**: Lucide React, TanStack Query
- **Bundle Splitting**: Vendor chunks separated
- **Compression**: Enabled
- **Security Headers**: X-Frame-Options, CSP, HSTS

### Database Performance

- **Indexes**: Comprehensive indexing on frequently queried columns
- **Views**: Pre-computed views for complex queries (`expiring_checks`, `pilot_checks_overview`)
- **RLS Policies**: Row Level Security for data protection
- **Connection Pooling**: Managed by Supabase

## Critical Business Rules

1. **Roster Periods**: All leave requests must fall within 28-day roster boundaries
2. **Certification Compliance**: Color-coded status system (red/yellow/green) drives all UI
3. **Role-Based Access**: Admin (full CRUD), Manager (edit/approve only)
4. **Data Integrity**: Employee IDs must be unique across pilots table
5. **Seniority System**: Based on commencement date with automatic calculation
6. **Production Data**: Always use main tables (`pilots`, `pilot_checks`, `check_types`)
7. **Air Niugini Branding**: Consistent use of brand colors and terminology

## Common Development Patterns

### Component Structure

```tsx
interface ComponentProps {
  // Define props with TypeScript
}

export function ComponentName({ props }: ComponentProps) {
  // 1. Hooks (React Query, state)
  const { data, isLoading } = useQuery();
  const [state, setState] = useState();

  // 2. Effects
  useEffect(() => {}, []);

  // 3. Handlers
  const handleSubmit = async () => {};

  // 4. Permission checks
  if (!permissions.canView(user)) return <Unauthorized />;

  // 5. Loading states
  if (isLoading) return <Loading />;

  // 6. Main render
  return <div className="air-niugini-branded">{/* Component JSX */}</div>;
}
```

### Error Handling Pattern

```typescript
try {
  const result = await pilotService.updatePilot(id, data);
  // Success handling
} catch (error) {
  console.error('Operation failed:', error);
  setErrors({
    submit: 'Failed to update pilot. Please try again.',
  });
}
```

### Form Validation Pattern

```typescript
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const pilotSchema = z.object({
  employee_id: z.string().min(1, 'Employee ID required'),
  first_name: z.string().min(1, 'First name required'),
  role: z.enum(['Captain', 'First Officer']),
});

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm({
  resolver: zodResolver(pilotSchema),
});
```

## Performance Guidelines

### Database Best Practices

- Use single queries with joins instead of multiple round trips
- Leverage database views for complex aggregations
- Apply proper indexing on frequently filtered columns
- Use RLS policies for security without performance impact

### Frontend Optimization

- Implement proper loading states for all async operations
- Use React Query for server state management and caching
- Optimize bundle size with dynamic imports for large components
- Implement proper error boundaries for graceful failure handling

## Development Workflow

1. **Database Changes**: Use migration scripts in root directory
2. **Feature Development**: Follow component → service → integration pattern
3. **Local Testing**: Always test functionality locally before deployment
4. **Build Verification**: Run `npm run build` to ensure production build succeeds
5. **Testing**: Run Playwright tests before deployment
6. **Code Quality**: Use ESLint and TypeScript strict mode
7. **Deployment**: Git push triggers automatic Vercel deployment

## Production Deployment & Troubleshooting

### Critical Production Patterns

**Service Layer for Production Stability**:

```typescript
// ✅ Correct - Direct service calls avoid production HTTP issues
import { getExpiringCertifications } from '@/lib/expiring-certifications-service';

export async function POST(request: NextRequest) {
  // Direct service call - works in all environments
  const certifications = await getExpiringCertifications(timeframeDays);
  return processData(certifications);
}

// ❌ Incorrect - Inter-API HTTP calls fail in production
const response = await fetch(`${process.env.VERCEL_URL}/api/expiring-certifications`);
```

**Common Production Issues & Solutions**:

1. **401 Unauthorized**: Usually environment variable corruption - check for trailing newlines
2. **ECONNREFUSED**: Avoid localhost/inter-API calls - use service layer instead
3. **Build Failures**: Run local testing and build verification before deployment
4. **PDF Generation**: Use service layer for data fetching, not HTTP requests

**Environment Variable Management**:

- Never include trailing newlines or spaces in production environment variables
- Use `getSupabaseAdmin()` for server-side operations requiring elevated privileges
- Test both local and production environments before considering deployment complete

## Current Feature Status

✅ **Production Ready**:

- Complete authentication system with role-based permissions
- Dashboard with real-time statistics (27 pilots, 556+ certifications)
- Pilot CRUD operations with comprehensive validation
- Certification tracking with expiration monitoring and bulk updates
- Seniority calculations and management
- Air Niugini branded UI with consistent design system
- Comprehensive E2E testing suite
- PDF report generation for certification expiry and roster leave
- Analytics dashboard with charts and metrics
- Service layer architecture for production stability
- Email notifications and automated reporting

✅ **Leave Management System** (Completed 2025-10-03):

- Complete leave request workflow with seniority-based conflict resolution
- Final Review Alert (22 days before next roster, shows only when pending requests exist)
- Seniority Priority Review (always displays when 2+ pilots request same dates)
- Crew availability checking with minimum requirements (10 Captains + 10 First Officers)
- Roster period filtering (All/Next/Following rosters)
- Interactive calendar and team availability views
- Spreading recommendations for crew shortage scenarios

🚧 **Active Development**:

- Enhanced analytics and metrics
- Advanced reporting features
- Calendar integration improvements

## Code Quality Tools

### Husky Git Hooks
- **Pre-commit**: Runs lint-staged to format and lint staged files
- **Commit-msg**: Validates commit messages using commitlint (conventional commits)

### Commitlint Configuration
Enforces conventional commit format:
```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code restructuring
test: adding tests
chore: maintenance tasks
```

### Lint-Staged
Automatically formats and lints files before commit:
- Prettier for code formatting
- ESLint for JavaScript/TypeScript linting
- Type checking for TypeScript files

## Key File Locations

### Documentation Files
- `CLAUDE.md` - AI assistant guidance (this file)
- `LEAVE_MANAGEMENT_SYSTEM.md` - Complete leave management documentation (645 lines)
- `README.md` - Project overview and quick start
- `PLAN.md` - Implementation plan
- `SPEC.md` - Technical specification
- `PROMPT.md` - Development prompt reference

### Database Management Scripts
All located in project root:
- `test-connection.js` - Test Supabase connection
- `deploy-schema.js` - Deploy complete schema
- `populate-data.js` - Sample data population
- `create-users.js` - User creation
- `run-seniority-migration.js` - Seniority calculations
- `execute-migration.js` - Custom migrations

### Core Service Files
Located in `src/lib/`:
- `leave-eligibility-service.ts` - Seniority and crew availability logic
- `leave-service.ts` - Leave request CRUD operations
- `roster-utils.ts` - 28-day roster period calculations
- `pilot-service.ts` - Pilot management operations
- `expiring-certifications-service.ts` - Certification expiry logic
- `auth-utils.ts` - Permission and role management

### Key Components
- `src/components/leave/FinalReviewAlert.tsx` - 22-day deadline alert
- `src/components/leave/LeaveEligibilityAlert.tsx` - Seniority priority review
- `src/components/leave/LeaveRequestsList.tsx` - Leave requests with filtering
- `src/app/dashboard/leave/page.tsx` - Main leave management page

## Important Notes

- **Keep Focus**: This is a pilot certification and leave management tool, not a full ERP system
- **Data Integrity**: Always verify operations against live production data (27 pilots, 556+ certifications)
- **Air Niugini Standards**: Maintain consistent branding and aviation industry terminology
- **Performance**: System handles real production load with optimized queries and caching
- **Testing**: Comprehensive test coverage ensures reliability for critical aviation operations
- **Security**: Role-based access control and RLS policies protect sensitive pilot data
- **Production Stability**: Service layer architecture prevents inter-API call issues in production
- **Environment Management**: Critical to maintain clean environment variables without trailing characters
- **Leave Management**: Seniority priority review ALWAYS shows for 2+ pilots, Final Review Alert ONLY shows when pending requests exist

---

**Air Niugini B767 Pilot Management System**
_Papua New Guinea's National Airline Fleet Operations Management_
_Production System - Version 1.0_
