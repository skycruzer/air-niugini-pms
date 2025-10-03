# Leave Management System - Complete Documentation

**Air Niugini B767 Pilot Management System**
*Last Updated: 2025-10-03*

---

## Overview

The leave management system provides comprehensive tracking and approval workflows for pilot leave requests tied to 28-day roster periods. The system includes seniority-based conflict resolution, crew availability checking, and automated alerts for final review deadlines.

---

## System Architecture

### Core Components

#### 1. **Main Leave Management Page**
**Location**: `src/app/dashboard/leave/page.tsx`

**Key Features:**
- Statistics dashboard showing all leave types (RDO, WDO, ANNUAL, SICK, LSL, LWOP, MATERNITY, COMPASSIONATE)
- Status filtering (All, Pending, Approved, Denied)
- Roster period filtering (All Rosters, Next Roster Only, Following Rosters)
- Final Review Alert integration
- Tab-based navigation (Requests, Interactive Calendar, Team Availability)

**State Management:**
```typescript
const [activeTab, setActiveTab] = useState<'requests' | 'calendar' | 'availability'>('requests');
const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');
const [rosterFilter, setRosterFilter] = useState<'all' | 'next' | 'following'>('all');
```

**Pending Count Calculation:**
```typescript
const getPendingCountForNextRoster = () => {
  const pendingRequests = leaveRequests.filter(req => req.status.toLowerCase() === 'pending');
  const currentRoster = getCurrentRosterPeriod();
  const nextRosterStartDate = new Date(currentRoster.endDate);
  nextRosterStartDate.setDate(nextRosterStartDate.getDate() + 1);
  const nextRosterEndDate = new Date(nextRosterStartDate);
  nextRosterEndDate.setDate(nextRosterEndDate.getDate() + 27); // 28-day period

  return pendingRequests.filter(req => {
    return req.startDate >= nextRosterStartDate && req.startDate <= nextRosterEndDate;
  }).length;
};
```

#### 2. **Final Review Alert Component**
**Location**: `src/components/leave/FinalReviewAlert.tsx`

**Purpose**: Displays prominent alert 22 days before next roster period begins

**Alert Behavior:**
- **ONLY shows when `pendingCount > 0`** (no pending requests = no alert)
- Applies ONLY to NEXT roster period (not current, not following)
- Severity levels: urgent (≤7 days), warning (8-22 days), info (>22 days)

**Key Props:**
```typescript
interface FinalReviewAlertProps {
  pendingCount: number; // Count of pending requests for NEXT roster period ONLY
  onViewRequests?: () => void; // Callback to scroll to and show pending requests
}
```

**Interactive Button:**
```typescript
const handleViewPendingRequests = () => {
  setActiveTab('requests');
  setFilterStatus('pending');
  setRosterFilter('next'); // Show only next roster
  setTimeout(() => {
    document.getElementById('requests-list')?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
};
```

#### 3. **Leave Requests List Component**
**Location**: `src/components/leave/LeaveRequestsList.tsx`

**Filtering Logic:**
```typescript
interface LeaveRequestsListProps {
  refreshTrigger?: number;
  filterStatus?: 'all' | 'pending' | 'approved' | 'denied';
  onStatsUpdate?: (stats: LeaveRequestStats) => void;
  rosterFilter?: 'all' | 'next' | 'following'; // Filter by roster period
}
```

**Roster Period Filtering:**
```typescript
if (rosterFilter === 'next') {
  // Next roster only (28 days)
  const nextRosterEndDate = new Date(nextRosterStartDate);
  nextRosterEndDate.setDate(nextRosterEndDate.getDate() + 27);

  requestsData = requestsData.filter((req) => {
    const startDate = parseISO(req.start_date);
    return startDate >= nextRosterStartDate && startDate <= nextRosterEndDate;
  });
} else if (rosterFilter === 'following') {
  // Following rosters (after next roster)
  const nextRosterEndDate = new Date(nextRosterStartDate);
  nextRosterEndDate.setDate(nextRosterEndDate.getDate() + 27);
  const followingRostersStartDate = new Date(nextRosterEndDate);
  followingRostersStartDate.setDate(followingRostersStartDate.getDate() + 1);

  requestsData = requestsData.filter((req) => {
    const startDate = parseISO(req.start_date);
    return startDate >= followingRostersStartDate;
  });
}
```

#### 4. **Leave Eligibility Alert Component**
**Location**: `src/components/leave/LeaveEligibilityAlert.tsx`

**Purpose**: Shows seniority comparison when multiple pilots request same dates

**Display Logic:**
```typescript
// Show ONLY if there are MULTIPLE conflicting requests (more than 1 pilot)
const hasConflictingRequests = eligibility?.conflictingRequests &&
                                eligibility.conflictingRequests.length > 1;

if (!hasConflictingRequests) {
  return null; // Single pilot = straight approve/deny based on crew availability
}
```

**Visual Indicators:**
- Green alert: Sufficient crew available, all can be approved
- Yellow/Blue alert: Crew shortage risk, seniority priority review required

#### 5. **Leave Eligibility Service**
**Location**: `src/lib/leave-eligibility-service.ts`

**Single vs Multiple Pilot Logic:**
```typescript
// ONLY show seniority comparison when MULTIPLE pilots are requesting same dates
if (allConflictingRequests.length > 1) {
  console.log('👥 MULTIPLE PILOTS detected:', allConflictingRequests.length);
  conflictingRequests = allConflictingRequests;

  if (!hasMinimumCrewForRole) {
    // Generate spreading recommendations when crew shortage exists
    seniorityRecommendation = generateSpreadingRecommendations(/*...*/);
  } else {
    seniorityRecommendation = `✅ Sufficient ${request.pilotRole} crew available...`;
  }
} else {
  // Only ONE pilot requesting - straight approve based on crew availability only
  console.log('✅ SINGLE PILOT - Straight approve based on crew availability');
  conflictingRequests = [];
  needsSeniorityReview = false;
  seniorityRecommendation = '';
}
```

**Crew Requirements:**
- Minimum 10 Captains
- Minimum 10 First Officers

**Seniority Priority:**
1. Rank (Captain > First Officer)
2. Seniority Number (lower = higher priority)

#### 6. **Roster Utilities**
**Location**: `src/lib/roster-utils.ts`

**Core Roster Calculation:**
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

  const totalPeriods = KNOWN_ROSTER.number + periodsPassed;
  const year = KNOWN_ROSTER.year + Math.floor(totalPeriods / 13);
  const number = (totalPeriods % 13) || 13;

  return {
    code: `RP${number}/${year}`,
    number,
    year,
    startDate: addDays(KNOWN_ROSTER.endDate, periodsPassed * ROSTER_DURATION + 1),
    endDate: addDays(KNOWN_ROSTER.endDate, (periodsPassed + 1) * ROSTER_DURATION)
  };
}
```

**Final Review Alert Logic:**
```typescript
export function getFinalReviewAlert(): FinalReviewAlert {
  const REVIEW_WINDOW_DAYS = 22;
  const now = new Date();
  const current = getCurrentRosterPeriod();
  const next = getNextRosterPeriod(current);

  const daysUntilRosterStarts = differenceInDays(next.startDate, now);
  const isWithinReviewWindow = daysUntilRosterStarts <= REVIEW_WINDOW_DAYS &&
                                daysUntilRosterStarts >= 0;

  // Severity determination
  let severity: 'urgent' | 'warning' | 'info';
  if (daysUntilRosterStarts <= 7) {
    severity = 'urgent';
  } else if (isWithinReviewWindow) {
    severity = 'warning';
  } else {
    severity = 'info';
  }

  return {
    isWithinReviewWindow,
    daysUntilRosterStarts,
    nextRoster: next,
    currentRoster: current,
    reviewDeadlineDate: addDays(next.startDate, -REVIEW_WINDOW_DAYS),
    severity,
    message: /* ... */
  };
}
```

---

## API Endpoints

### 1. **GET /api/leave-requests**
**Purpose**: Fetch all leave requests with pilot information

**Implementation**: `src/app/api/leave-requests/route.ts`

**Response:**
```typescript
{
  success: true,
  data: LeaveRequest[]
}
```

**Optimizations:**
- Single JOIN query eliminates N+1 pattern
- Includes pilot name, employee_id, role in response

### 2. **POST /api/leave-requests**
**Purpose**: Create new leave request

**Validation:**
- Calculates days_count automatically
- Determines roster_period from start_date
- Sets initial status as 'PENDING'

### 3. **PATCH /api/leave-requests**
**Purpose**: Update existing leave request

**Allowed for:**
- Admin/Manager to update status (APPROVED/DENIED)
- Pilot to update their own pending requests

### 4. **DELETE /api/leave-requests**
**Purpose**: Delete leave request

**Permissions:**
- Only PENDING requests can be deleted
- User must have delete permissions

### 5. **POST /api/leave-eligibility/check**
**Purpose**: Check crew availability and conflicts

**Response:**
```typescript
{
  isEligible: boolean,
  recommendation: 'APPROVE' | 'REVIEW' | 'DENY',
  reasons: string[],
  conflictingRequests: ConflictingRequest[],
  crewAvailability: CrewAvailability[],
  needsSeniorityReview: boolean
}
```

---

## Database Schema

### Production Table: `leave_requests`

**Note**: The application uses `leave_requests` table (not `an_leave_requests` which is legacy).

**Schema:**
```sql
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN (
    'RDO', 'SDO', 'ANNUAL', 'SICK', 'LSL', 'LWOP', 'MATERNITY', 'COMPASSIONATE'
  )),
  roster_period TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'DENIED')),
  reason TEXT,
  request_date DATE,
  request_method TEXT CHECK (request_method IN ('EMAIL', 'ORACLE', 'LEAVE_BIDS', 'SYSTEM')),
  is_late_request BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES an_users(id),
  reviewed_at TIMESTAMPTZ,
  review_comments TEXT
);
```

**Indexes:**
```sql
CREATE INDEX idx_leave_requests_pilot_id ON leave_requests(pilot_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_roster_period ON leave_requests(roster_period);
CREATE INDEX idx_leave_requests_start_date ON leave_requests(start_date);
```

---

## Leave Types

### 1. **RDO (Roster Day Off)**
- Regular scheduled days off within roster period
- Icon: 🏠
- Color coding based on approval status

### 2. **WDO (Weekly Day Off)**
- Weekly scheduled days off
- Icon: 🌴

### 3. **ANNUAL (Annual Leave)**
- Paid vacation time
- Icon: 🏖️

### 4. **SICK (Sick Leave)**
- Medical leave
- Icon: 🏥

### 5. **LSL (Long Service Leave)**
- Extended service recognition leave
- Icon: 🎓

### 6. **LWOP (Leave Without Pay)**
- Unpaid leave period
- Icon: 💼

### 7. **MATERNITY (Maternity Leave)**
- Parental leave
- Icon: 👶

### 8. **COMPASSIONATE (Compassionate Leave)**
- Emergency family leave
- Icon: 💙

---

## User Workflows

### Administrator Workflow

1. **Dashboard View**
   - See total requests by type
   - View pending count with Final Review Alert (if applicable)
   - Filter by status and roster period

2. **Review Pending Requests**
   - Click "View Pending Requests" button in alert
   - Auto-navigates to filtered list of next roster pending requests
   - Review each request individually

3. **Eligibility Check**
   - System automatically shows crew availability impact
   - If multiple pilots requesting same dates: seniority comparison displayed
   - If single pilot: straight approve/deny based on crew availability

4. **Approve/Deny**
   - Click "Review" button on request card
   - Modal shows full details + eligibility alert
   - Add optional review comments
   - Submit decision

### Pilot Workflow

1. **Submit Leave Request**
   - Click "New Request" button
   - Select leave type
   - Choose roster period (auto-calculates from dates)
   - Enter start/end dates
   - Select submission method (ORACLE/EMAIL/LEAVE_BIDS/SYSTEM)
   - Add optional reason
   - Submit

2. **View Own Requests**
   - See all personal requests in list
   - Filter by status
   - Edit pending requests before review
   - Delete pending requests if needed

3. **Edit Pending Request**
   - Click "Edit" on pending request card
   - Modal loads with current values
   - Make changes
   - Save updates

---

## Business Rules

### 1. **Roster Period Alignment**
- All leave requests must align with 28-day roster periods
- Current roster: RP11/2025 (ends 2025-10-10)
- Next roster: RP12/2025 (starts 2025-10-11)
- Following roster: RP13/2025 (starts 2025-11-08)

### 2. **Final Review Deadline**
- Alert appears 22 days before NEXT roster starts
- Only counts pending requests for NEXT roster
- Does NOT include current or following rosters
- Alert hidden if no pending requests exist

### 3. **Crew Availability**
- Minimum 10 Captains required at all times
- Minimum 10 First Officers required at all times
- System checks availability for each day of requested leave
- Projects impact on crew levels

### 4. **Seniority Priority**
- Only applies when 2+ pilots request same/overlapping dates
- Priority determined by:
  1. Rank (Captain > First Officer)
  2. Seniority Number (lower = higher)
- Single pilot requests bypass seniority comparison

### 5. **Conflict Detection**
- **EXACT**: Same start and end dates
- **PARTIAL**: Overlapping date ranges
- **ADJACENT**: Back-to-back requests (no gap)
- **NEARBY**: Requests within 7 days

### 6. **Late Request Flagging**
- Requests with less than 21 days advance notice flagged
- `is_late_request = true` set automatically

### 7. **Permissions**
- **Admin**: Full CRUD permissions
- **Manager**: Edit/Approve permissions (no delete)
- **Pilot**: Create, edit own pending requests, delete own pending requests

---

## UI Components & Patterns

### Status Color Coding
```typescript
const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800';
    case 'APPROVED': return 'bg-green-100 text-green-800';
    case 'DENIED': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};
```

### Status Icons
- PENDING: ⏳
- APPROVED: ✅
- DENIED: ❌

### Air Niugini Branding
- Primary Red: `#E4002B`
- Secondary Gold: `#FFC72C`
- Consistent use throughout leave management interface

---

## Testing Checklist

### Functional Tests
- [ ] Create leave request with all leave types
- [ ] Edit pending request
- [ ] Delete pending request
- [ ] Approve request (admin/manager)
- [ ] Deny request (admin/manager)
- [ ] Filter by status (All, Pending, Approved, Denied)
- [ ] Filter by roster period (All, Next, Following)
- [ ] Final Review Alert appears when pending requests exist
- [ ] Final Review Alert hidden when no pending requests
- [ ] "View Pending Requests" button navigates correctly
- [ ] Eligibility alert shows for 2+ pilots (same dates)
- [ ] Eligibility alert hidden for single pilot
- [ ] Crew availability calculations accurate
- [ ] Seniority priority ordering correct

### Edge Cases
- [ ] Requests spanning roster period boundaries
- [ ] Back-to-back requests from same pilot
- [ ] Maximum crew on leave simultaneously
- [ ] Requests for past dates (should be rejected)
- [ ] Requests beyond 12 months ahead
- [ ] Late request flagging (<21 days)

### Permission Tests
- [ ] Admin can create/edit/delete all requests
- [ ] Manager can edit/approve but not delete
- [ ] Pilot can only edit/delete own pending requests
- [ ] Pilot cannot approve own requests

---

## Performance Optimizations

### Database Query Patterns
- Single JOIN query for leave requests + pilot info
- Indexed columns: pilot_id, status, roster_period, start_date
- Filter operations done in database, not in client

### Component Rendering
- React Query caching for leave requests list
- Debounced search/filter inputs
- Lazy loading for calendar views
- Memoized calculations for crew availability

### API Response Times
- Target: <500ms for leave requests list
- Target: <200ms for eligibility check
- Target: <100ms for CRUD operations

---

## Future Enhancements

### Planned Features
1. **Bulk Approval/Denial**
   - Select multiple pending requests
   - Apply same decision to all

2. **Email Notifications**
   - Auto-notify pilot when request reviewed
   - Remind administrators of pending reviews
   - Daily digest of expiring review deadlines

3. **Calendar Integration**
   - Visual calendar view of all approved leave
   - Drag-and-drop to adjust dates
   - Color-coded by leave type

4. **Leave Balance Tracking**
   - Track remaining leave days by type
   - Annual leave accrual calculations
   - LSL eligibility based on service years

5. **Reporting & Analytics**
   - Leave utilization by type and period
   - Crew availability forecasting
   - Seniority-based approval patterns

6. **Mobile App**
   - Native iOS/Android apps for pilots
   - Push notifications for request status
   - Quick submit from mobile

---

## Troubleshooting

### Common Issues

**Issue**: Final Review Alert not showing
- **Solution**: Check if there are pending requests for next roster period
- **Note**: Alert is intentionally hidden when pendingCount = 0

**Issue**: Eligibility alert showing for single pilot
- **Solution**: This should not happen; check conflictingRequests.length logic
- **Expected**: Alert only shows when 2+ pilots request same dates

**Issue**: Roster period calculations incorrect
- **Solution**: Verify KNOWN_ROSTER constant in roster-utils.ts
- **Current**: RP11/2025 ends 2025-10-10

**Issue**: Crew availability showing incorrect numbers
- **Solution**: Check minimum requirements (10 Captains, 10 First Officers)
- **Note**: System counts available crew AFTER approving current request

**Issue**: Filtering not working
- **Solution**: Ensure rosterFilter prop passed to LeaveRequestsList
- **Values**: 'all' | 'next' | 'following'

---

## File Locations Reference

### Core Files
- Main page: `src/app/dashboard/leave/page.tsx`
- Requests list: `src/components/leave/LeaveRequestsList.tsx`
- Final alert: `src/components/leave/FinalReviewAlert.tsx`
- Eligibility alert: `src/components/leave/LeaveEligibilityAlert.tsx`
- Request form: `src/components/leave/LeaveRequestForm.tsx`
- Edit modal: `src/components/leave/LeaveRequestEditModal.tsx`
- Review modal: `src/components/leave/LeaveRequestReviewModal.tsx`

### Services & Utilities
- Leave service: `src/lib/leave-service.ts`
- Eligibility service: `src/lib/leave-eligibility-service.ts`
- Roster utils: `src/lib/roster-utils.ts`

### API Routes
- Main endpoint: `src/app/api/leave-requests/route.ts`
- Eligibility check: `src/app/api/leave-eligibility/check/route.ts`
- Roster period: `src/app/api/leave-requests/roster-period/route.ts`

### Database
- Schema: `supabase-complete-migration.sql`
- RLS policies: `supabase-rls-policies.sql`

---

## Contact & Support

**System Administrator**: Air Niugini IT Department
**Project Repository**: GitHub (see CLAUDE.md for URL)
**Documentation**: This file + inline component documentation

---

**Air Niugini B767 Pilot Management System**
*Papua New Guinea's National Airline Fleet Operations Management*
*Production System - Version 1.0*
