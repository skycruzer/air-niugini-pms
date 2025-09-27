# Air Niugini B767 Pilot Management System

A streamlined web application for managing pilot certifications and leave requests within 28-day roster periods for Papua New Guinea's national airline B767 fleet operations.

## 🚀 Quick Start

```bash
# Development server
npm run dev

# Visit http://localhost:3001 (or http://localhost:3000)
```

## ✅ Phase 1 Complete (Foundation)

- ✅ Next.js 14 project with TypeScript
- ✅ Air Niugini branding (#E4002B red, #FFC72C gold)
- ✅ Supabase database connection (existing project)
- ✅ New database tables (prefixed with `an_`)
- ✅ Core utilities (roster calculations, certification status)
- ✅ Landing page with current roster display
- ✅ Development server running on port 3001

## 🏗️ Current Status

**Development Phase**: Phase 1 Complete → Starting Phase 2

**Next Steps**:
- Authentication system (Admin/Manager roles)
- Login page with Air Niugini branding
- Dashboard with pilot statistics
- Navigation structure

## 🛢️ Database Structure

All tables are prefixed with `an_` to avoid conflicts:
- `an_users` - System users (Admin/Manager)
- `an_pilots` - Pilot information
- `an_check_types` - Certification types (38 types)
- `an_pilot_checks` - Pilot certifications with expiry dates
- `an_leave_requests` - Leave/RDO/WDO requests

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
- **Database**: Supabase PostgreSQL
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
*Professional software development for Papua New Guinea*

---

**Air Niugini** - Papua New Guinea's National Airline
*B767 Fleet Operations Management System v1.0*
*Powered by PIN PNG LTD*