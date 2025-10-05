# Air Niugini B767 Pilot Management System

**Production-Ready** pilot certification tracking and leave management system for Papua New Guinea's national airline B767 fleet operations.

## 🚀 Quick Start

```bash
# Development server
npm run dev          # Starts on http://localhost:3001

# Production build
npm run build
npm start

# Run tests
npm test
npx playwright test  # E2E tests
```

## 📊 System Status

**Status**: ✅ Production Ready (v1.0)

**Live Fleet Data**:
- 👨‍✈️ **27 Active Pilots** (Captains & First Officers)
- 🛡️ **571 Certifications** tracked across the fleet
- 📋 **34 Check Types** across 8 certification categories
- 🗓️ **12 Leave Requests** in current roster period

**Current Roster**: RP11/2025 (ends October 10, 2025)

## ✨ Key Features

### ✅ Completed & Production Ready

- **Authentication** - Supabase Auth with Admin/Manager roles
- **Dashboard** - Real-time statistics, compliance tracking, alerts
- **Pilot Management** - Full CRUD with seniority tracking
- **Certification Tracking** - 571 certifications with expiry monitoring
- **Leave Management** - Seniority-based conflict resolution
- **Analytics** - Interactive charts, trends, performance metrics
- **Reports** - 5 consolidated reports with PDF/CSV export
- **PWA Support** - Offline capability with service worker
- **Testing** - Comprehensive E2E test suite with Playwright

## 🛢️ Database Structure

**Production Tables** (Active):
- `pilots` - 27 pilot records with seniority tracking
- `pilot_checks` - 571 certification records with expiry dates
- `check_types` - 34 certification types across 8 categories
- `an_users` - 3 system users (admin/manager authentication)
- `leave_requests` - 12 leave requests tied to roster periods
- `settings` - System configuration
- `contract_types` - Pilot contract classifications

**Database Views** (Optimized Queries):
- `compliance_dashboard` - Fleet compliance metrics
- `pilot_report_summary` - Comprehensive pilot summaries
- `detailed_expiring_checks` - Expiring certifications with details
- `expiring_checks` - Simplified expiring checks
- `captain_qualifications_summary` - Captain qualifications

## 📊 Current Roster

- **Current**: RP11/2025
- **End Date**: October 10, 2025
- **Duration**: 28-day periods
- **Next**: RP12/2025

## 🎨 Branding

- **Primary**: Air Niugini Red (#E4002B)
- **Secondary**: Gold (#FFC72C)
- **Typography**: Inter font family
- **Logo**: Bird of paradise (Papua New Guinea)

## 🔧 Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: TailwindCSS with custom Air Niugini theme
- **Database**: PostgreSQL
- **State**: React Query (planned)
- **Forms**: React Hook Form + Zod (planned)

## 📁 Project Structure

```
air-niugini-pms/
├── src/
│   ├── app/                # Next.js 14 App Router
│   │   ├── globals.css     # Air Niugini styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Landing page
│   ├── lib/                # Utilities
│   │   ├── supabase.ts     # Database client
│   │   ├── roster-utils.ts # Roster calculations
│   │   └── certification-utils.ts # Status logic
│   ├── components/         # React components (coming soon)
│   ├── hooks/              # Custom hooks (coming soon)
│   └── types/              # TypeScript types
├── .env.local              # Environment variables
├── tailwind.config.js      # Air Niugini theme
└── package.json            # Dependencies
```

## 🌐 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://wgdmgvonqysflwdiiols.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
SUPABASE_PROJECT_ID=wgdmgvonqysflwdiiols
NEXT_PUBLIC_APP_NAME=Air Niugini Pilot Management System
NEXT_PUBLIC_CURRENT_ROSTER=RP11/2025
NEXT_PUBLIC_ROSTER_END_DATE=2025-10-10
```

## 📋 Development Plan

### Phase 1: Foundation ✅ COMPLETE

- Project setup and branding
- Database tables and connections
- Core utilities and landing page

### Phase 2: Authentication (In Progress)

- Login system with Admin/Manager roles
- Session management
- Route protection

### Phase 3: Core Features (Planned)

- Pilot management CRUD
- Certification tracking with expiry alerts
- Leave request system

### Phase 4: Advanced Features (Planned)

- Reports and compliance dashboard
- Mobile optimization
- Testing and deployment

## 🚨 Important Notes

- **Database Safety**: Using existing Supabase project with prefixed tables
- **No Modifications**: Original fleet data remains untouched
- **Development Mode**: Authentication not yet implemented
- **Roster Calculations**: Based on RP11/2025 ending October 10, 2025

## 👨‍💻 Developer

**Maurice Rondeau** - [PIN PNG LTD](https://pinpng.com)
_Professional software development for Papua New Guinea_

---

**Air Niugini** - Papua New Guinea's National Airline
_B767 Fleet Operations Management System v1.0_
_Powered by PIN PNG LTD_
