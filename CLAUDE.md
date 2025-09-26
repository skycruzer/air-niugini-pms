# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Air Niugini B767 Pilot Management System - A comprehensive pilot certification tracking and leave management system for Papua New Guinea's national airline fleet operations.

**Current Status**: Fully operational with authentication, pilot CRUD operations, certification tracking, and dashboard functionality.

## Commands

### Development
```bash
# Start development server
npm run dev          # Starts on http://localhost:3001 (or 3000)

# Build and production
npm run build        # Build for production
npm start           # Start production server
npm run lint        # Run ESLint with Next.js rules
```

### Database Operations (MCP Available)
```bash
# Node.js scripts for database management
node test-connection.js     # Test Supabase connection
node deploy-schema.js       # Deploy database schema
node populate-data.js       # Populate with sample data
node create-users.js        # Create system users
```

### Testing
```bash
# Playwright E2E testing available
npx playwright test         # Run all tests
npx playwright test --headed  # Run with browser visible
```

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 14 with App Router and TypeScript
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth with role-based permissions (admin/manager)
- **State Management**: React Context + TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Styling**: TailwindCSS with Air Niugini brand colors (#E4002B red, #FFC72C gold)
- **Date Handling**: date-fns for roster calculations

### Database Architecture

**Active Tables** (using main tables, not `an_*` prefixed):
- `pilots` (27 records) - Main pilot information
- `pilot_checks` (531 records) - Certification tracking
- `check_types` (38 records) - Aviation certification types
- `users` - System authentication (admin/manager roles)
- `leave_requests` - Leave management tied to 28-day roster periods

**Key Views**:
- `expiring_checks` - Certifications expiring in specified timeframe
- `pilot_checks_overview` - Comprehensive pilot-certification data

### Core Business Logic

#### Roster Period System
Central to leave management - 28-day operational periods:
```typescript
// Current known roster: RP11/2025 ends October 10, 2025
const ROSTER_DURATION = 28
const KNOWN_ROSTER = { number: 11, year: 2025, endDate: new Date('2025-10-10') }
```

#### Authentication & Permissions
Role-based access control with two user types:
- **Admin**: Full CRUD permissions, settings management
- **Manager**: Edit/approve permissions, no delete/settings

#### Certification Status Logic
Color-coded system for certification compliance:
- **Green**: Current (valid)
- **Yellow**: Expiring within 30 days
- **Red**: Expired (requires immediate attention)

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Protected pages
│   │   ├── pilots/       # Pilot CRUD with [id] detail/edit
│   │   ├── certifications/ # Cert tracking
│   │   ├── leave/        # Leave management
│   │   ├── reports/      # Analytics
│   │   └── settings/     # Admin settings
│   ├── login/            # Authentication
│   └── api/              # API routes
├── components/           # Reusable UI components
│   ├── auth/            # AuthProvider, ProtectedRoute
│   ├── layout/          # DashboardLayout
│   └── providers/       # Context providers
├── contexts/            # AuthContext for state
├── lib/                 # Core business logic
│   ├── supabase.ts      # Database client & types
│   ├── pilot-service.ts # Pilot CRUD operations
│   ├── auth-utils.ts    # Permissions & role management
│   ├── roster-utils.ts  # 28-day period calculations
│   └── certification-utils.ts # Status logic
└── types/               # TypeScript definitions
```

### Data Service Layer

**Key Service Pattern**:
- `pilot-service.ts` - Main service using live database
- `pilot-service-client.ts` - Client interface (re-exports main service)
- All services use main tables (`pilots`, `pilot_checks`, `check_types`) not `an_*` tables

### Authentication Flow

1. Supabase Auth handles login/sessions
2. User profile fetched from `an_users` table
3. Role-based permissions applied via `permissions` object
4. AuthContext manages state across app
5. ProtectedRoute guards dashboard pages

### Air Niugini Branding

Consistent brand implementation:
```css
/* Primary colors */
--red: #E4002B;     /* Primary - headers, buttons */
--gold: #FFC72C;    /* Secondary - accents */
--black: #000000;   /* Navigation, text */
```

## Key Implementation Patterns

### Database Queries
Always use the main tables, not `an_*` prefixed versions:
```typescript
// ✅ Correct - uses main tables with full dataset
const { data } = await supabase.from('pilots').select('*')

// ❌ Incorrect - uses limited an_ tables
const { data } = await supabase.from('an_pilots').select('*')
```

### Roster Calculations
Critical for leave management - all dates must align with 28-day periods:
```typescript
import { getCurrentRosterPeriod, isDateInRoster } from '@/lib/roster-utils'

const currentRoster = getCurrentRosterPeriod() // Always current period
// Validates leave requests fall within roster boundaries
```

### Permission Checking
Consistent pattern across components:
```typescript
import { permissions } from '@/lib/auth-utils'

// Always check permissions before showing UI
if (permissions.canEdit(user)) {
  return <EditButton />
}
```

### Error Handling
Standardized error handling with user-friendly messages:
```typescript
try {
  const result = await pilotService.updatePilot(id, data)
} catch (error) {
  setErrors({ submit: 'Failed to update pilot. Please try again.' })
}
```

## Environment Configuration

Required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://wgdmgvonqysflwdiiols.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_PROJECT_ID=wgdmgvonqysflwdiiols
NEXT_PUBLIC_APP_NAME=Air Niugini Pilot Management System
NEXT_PUBLIC_CURRENT_ROSTER=RP11/2025
NEXT_PUBLIC_ROSTER_END_DATE=2025-10-10
```

## Database Schema Notes

**Important**: The system has evolved from using `an_*` prefixed tables to main tables:
- **Current**: Uses `pilots` (27 records), `pilot_checks` (531), `check_types` (38)
- **Legacy**: `an_pilots` (5 records) - no longer used in active code
- All services updated to query main tables for full dataset

**MCP Integration**: Full Supabase MCP server available for database operations.

## Critical Business Rules

1. **Roster Periods**: All leave must fall within 28-day roster boundaries
2. **Certification Compliance**: Color-coded status system drives all UI
3. **Role-Based Access**: Admin-only for create/delete, Manager+ for edit/approve
4. **Data Integrity**: Employee IDs must be unique across pilots table
5. **Real-Time Data**: All statistics calculated from live database, no cached/mock data

## Current Feature Status

✅ **Complete**:
- Authentication with Supabase
- Dashboard with real statistics (27 pilots, 531 certifications)
- Pilot CRUD (view, edit, create with validation)
- Certification tracking and status
- Air Niugini branded UI

🚧 **In Development**:
- Leave request management system
- Reports and analytics
- Settings management

## Development Notes

- Port typically runs on 3001 (3000 if available)
- Fast refresh enabled for rapid development
- All database operations use Supabase client with error handling
- TypeScript strict mode enabled
- ESLint configured with Next.js rules
- Playwright available for E2E testing