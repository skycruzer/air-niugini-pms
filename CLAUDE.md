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
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint with Next.js rules
```

### Database Operations
```bash
# Core database management scripts
node test-connection.js       # Test Supabase connection
node deploy-schema.js         # Deploy complete database schema
node populate-data.js         # Populate with sample data
node create-users.js          # Create system users
node run-seniority-migration.js  # Update seniority calculations
node execute-migration.js    # Execute custom migrations
```

### Testing (Playwright E2E)
```bash
# Comprehensive testing suite
npx playwright test                    # Run all tests
npx playwright test test-login.spec.js # Run specific test
npx playwright test --headed           # Run with browser visible
npx playwright test --ui               # Run with Playwright UI
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
- `pilot_checks` (531+ records) - Certification tracking with expiry dates
- `check_types` (38 records) - Aviation certification types across 8 categories
- `users` (mapped to `an_users`) - System authentication (admin/manager roles)
- `leave_requests` - Leave management tied to 28-day roster periods
- `settings` - System configuration
- `contract_types` - Pilot contract classifications

**Legacy Development Tables** (Historical):
- `an_pilots`, `an_pilot_checks`, `an_check_types` - Legacy development data (limited records)

**CRITICAL**: Always use production tables (`pilots`, `pilot_checks`, `check_types`) for live operations, not the `an_*` prefixed legacy tables.

### Key Business Logic

#### 1. Roster Period System (28-Day Cycles)
```typescript
// Core roster calculation pattern
const ROSTER_DURATION = 28
const KNOWN_ROSTER = {
  number: 11,
  year: 2025,
  endDate: new Date('2025-10-10')
}

export function getCurrentRosterPeriod() {
  const today = new Date()
  const daysSinceKnown = differenceInDays(today, KNOWN_ROSTER.endDate)
  const periodsPassed = Math.floor(daysSinceKnown / ROSTER_DURATION)

  return {
    code: `RP${number}/${year}`,
    startDate: calculatedStart,
    endDate: calculatedEnd
  }
}
```

#### 2. Certification Status Color Coding
```typescript
// Aviation compliance color system
export function getCertificationStatus(expiryDate: Date | null) {
  if (!expiryDate) return { color: 'gray', label: 'No Date' }

  const daysUntilExpiry = differenceInDays(expiryDate, new Date())

  if (daysUntilExpiry < 0) {
    return { color: 'red', label: 'Expired', className: 'bg-red-100 text-red-800' }
  }
  if (daysUntilExpiry <= 30) {
    return { color: 'yellow', label: 'Expiring Soon', className: 'bg-yellow-100 text-yellow-800' }
  }
  return { color: 'green', label: 'Current', className: 'bg-green-100 text-green-800' }
}
```

#### 3. Seniority Calculations
```typescript
// Seniority based on commencement date (1 = most senior)
export function calculateSeniority(pilots: Pilot[]) {
  return pilots
    .filter(p => p.commencement_date)
    .sort((a, b) => new Date(a.commencement_date).getTime() - new Date(b.commencement_date).getTime())
    .map((pilot, index) => ({
      ...pilot,
      seniority_number: index + 1
    }))
}
```

#### 4. Permission System
```typescript
// Role-based access control pattern
export const permissions = {
  canCreate: (user: User) => user.role === 'admin',
  canEdit: (user: User) => ['admin', 'manager'].includes(user.role),
  canDelete: (user: User) => user.role === 'admin',
  canApprove: (user: User) => ['admin', 'manager'].includes(user.role)
}
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
│   ├── pilot-service.ts     # Pilot CRUD operations
│   ├── auth-utils.ts        # Permission & role management
│   ├── roster-utils.ts      # 28-day period calculations
│   └── certification-utils.ts # Status logic & validation
└── types/                   # TypeScript definitions
    ├── analytics.ts         # Analytics & reporting types
    └── pdf-reports.ts       # PDF generation types
```

### Data Service Layer Pattern

**Critical Pattern**: Always use production tables with consistent service layer:

```typescript
// ✅ Correct - Service layer using production tables
import { supabase } from '@/lib/supabase'

export class PilotService {
  async getAllPilots() {
    const { data, error } = await supabase
      .from('pilots')  // Production table with 27 records
      .select('*')
      .order('seniority_number')

    if (error) throw error
    return data
  }
}

// ❌ Incorrect - Direct use of legacy tables
const { data } = await supabase.from('an_pilots').select('*') // Only 5 legacy records
```

### Air Niugini Branding Standards

**Color Palette** (Strict Adherence Required):
```css
/* Primary Brand Colors */
--air-niugini-red: #E4002B;    /* Headers, buttons, alerts */
--air-niugini-gold: #FFC72C;   /* Accents, highlights */
--air-niugini-black: #000000;  /* Navigation, text */
--air-niugini-white: #FFFFFF;  /* Backgrounds */
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
  .select(`
    *,
    pilot_checks (
      *,
      check_types (*)
    )
  `)
  .eq('is_active', true)

// ✅ Use database views for complex queries
const expiringChecks = await supabase
  .from('expiring_checks')  // Pre-computed view
  .select('*')
  .lte('days_until_expiry', 30)
```

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
  password: 'mron2393'
}

// Always test against live production tables
await page.goto('http://localhost:3001/dashboard/pilots')
await expect(page.locator('[data-testid="pilot-count"]')).toContainText('27')
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
  const { data, isLoading } = useQuery()
  const [state, setState] = useState()

  // 2. Effects
  useEffect(() => {}, [])

  // 3. Handlers
  const handleSubmit = async () => {}

  // 4. Permission checks
  if (!permissions.canView(user)) return <Unauthorized />

  // 5. Loading states
  if (isLoading) return <Loading />

  // 6. Main render
  return (
    <div className="air-niugini-branded">
      {/* Component JSX */}
    </div>
  )
}
```

### Error Handling Pattern
```typescript
try {
  const result = await pilotService.updatePilot(id, data)
  // Success handling
} catch (error) {
  console.error('Operation failed:', error)
  setErrors({
    submit: 'Failed to update pilot. Please try again.'
  })
}
```

### Form Validation Pattern
```typescript
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const pilotSchema = z.object({
  employee_id: z.string().min(1, 'Employee ID required'),
  first_name: z.string().min(1, 'First name required'),
  role: z.enum(['Captain', 'First Officer'])
})

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(pilotSchema)
})
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
3. **Testing**: Run Playwright tests before deployment
4. **Code Quality**: Use ESLint and TypeScript strict mode
5. **Deployment**: Verify production build succeeds

## Current Feature Status

✅ **Production Ready**:
- Complete authentication system with role-based permissions
- Dashboard with real-time statistics (27 pilots, 531+ certifications)
- Pilot CRUD operations with comprehensive validation
- Certification tracking with expiration monitoring
- Seniority calculations and management
- Air Niugini branded UI with consistent design system
- Comprehensive E2E testing suite
- PDF report generation capabilities
- Analytics dashboard with charts and metrics

🚧 **Active Development**:
- Advanced leave request management
- Calendar integration for scheduling
- Enhanced reporting features

## Important Notes

- **Keep Focus**: This is a pilot certification and leave management tool, not a full ERP system
- **Data Integrity**: Always verify operations against live production data (27 pilots, 531+ certifications)
- **Air Niugini Standards**: Maintain consistent branding and aviation industry terminology
- **Performance**: System handles real production load with optimized queries and caching
- **Testing**: Comprehensive test coverage ensures reliability for critical aviation operations
- **Security**: Role-based access control and RLS policies protect sensitive pilot data

---

**Air Niugini B767 Pilot Management System**
*Papua New Guinea's National Airline Fleet Operations Management*
*Production System - Version 1.0*