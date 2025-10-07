# User Flow Diagrams

## Air Niugini Pilot Management System - Key User Journeys

**Version**: 1.0
**Date**: October 7, 2025
**Author**: UX Design Team
**Purpose**: Visual and textual documentation of critical user flows for shadcn/ui implementation

---

## Table of Contents

1. [Pilot Creation Flow](#pilot-creation-flow)
2. [Leave Request Approval Flow](#leave-request-approval-flow)
3. [Certification Tracking Flow](#certification-tracking-flow)
4. [Analytics Dashboard Flow](#analytics-dashboard-flow)
5. [Settings Management Flow](#settings-management-flow)

---

## Flow Diagram Legend

```
┌────────┐
│ Screen │  = Page or view
└────────┘

( Action )  = User action or decision

[Component] = UI component (shadcn/ui)

→ = Next step
↓ = Conditional path
⚠ = Error/warning state
✓ = Success state
```

---

## Pilot Creation Flow

### Overview

**Goal**: Add new pilot to the system with complete information and automatic seniority calculation
**Primary User**: Admin role
**Entry Points**: Dashboard Quick Actions, Pilots page "Add Pilot" button
**Average Duration**: 2-3 minutes
**Success Criteria**: Pilot created with valid data, seniority calculated, toast confirmation shown

### Flow Diagram

```
┌─────────────────────────────────┐
│   Dashboard / Pilots Page       │
│                                 │
│   [Button: "Add Pilot"]         │
└─────────────┬───────────────────┘
              │ Click
              ↓
┌─────────────────────────────────┐
│   Pilot Creation Dialog         │
│   [Dialog - shadcn/ui]         │
│                                 │
│   Title: "Create New Pilot"     │
│   Size: 600px wide (desktop)    │
│   Position: Centered            │
└─────────────┬───────────────────┘
              │ Opens with animation
              ↓
┌─────────────────────────────────┐
│   Form Fields (Step 1/2)        │
│   [Form - shadcn/ui]           │
│                                 │
│   1. Employee ID * [Input]      │
│      [FormHelperText]:          │
│      "Unique ID (e.g., AB123)"  │
│                                 │
│   2. First Name * [Input]       │
│                                 │
│   3. Last Name * [Input]        │
│                                 │
│   4. Role * [Select]            │
│      Options:                   │
│      - Captain                  │
│      - First Officer            │
│                                 │
│   5. Commencement Date * [Date] │
│      [FormHelperText]:          │
│      "Used for seniority calc"  │
└─────────────┬───────────────────┘
              │
              ↓
        (User fills fields)
              │
              ├─→ (Validation Error) ⚠
              │   │
              │   ↓
              │   ┌─────────────────────────┐
              │   │   Inline Error Messages  │
              │   │   [FormErrorMessage]    │
              │   │                         │
              │   │   "Employee ID required"│
              │   │   "Invalid date format" │
              │   │   [AlertCircle icon]    │
              │   └──────────┬──────────────┘
              │              │
              │              └─→ (Fix errors) → Back to form
              │
              ↓
        (All required fields valid)
              │
              ↓
┌─────────────────────────────────┐
│   Optional Fields (Step 2/2)    │
│                                 │
│   6. Contract Type [Select]     │
│      - Full Time                │
│      - Part Time                │
│      - Casual                   │
│                                 │
│   7. Date of Birth [Date]       │
│      [FormHelperText]:          │
│      "For retirement calc"      │
│                                 │
│   8. Base Station [Select]      │
│      - Port Moresby             │
│      - Other locations          │
│                                 │
│   9. Line Training Captain      │
│      [Checkbox]                 │
│                                 │
│   10. Training Captain          │
│       [Checkbox]                │
│                                 │
│   11. Examiner [Checkbox]       │
└─────────────┬───────────────────┘
              │
              ↓
┌─────────────────────────────────┐
│   Form Actions                  │
│   [DialogFooter]                │
│                                 │
│   [Button variant="outline"]    │
│   "Cancel"                      │
│                                 │
│   [Button variant="default"]    │
│   "Create Pilot"                │
└─────────────┬───────────────────┘
              │
              ├─→ (Click Cancel)
              │   │
              │   ↓
              │   ┌─────────────────────────┐
              │   │   Confirm Dialog        │
              │   │   [AlertDialog]         │
              │   │                         │
              │   │   "Discard changes?"    │
              │   │   [Cancel] [Discard]    │
              │   └──────────┬──────────────┘
              │              │
              │              ├─→ (Cancel) → Back to form
              │              │
              │              └─→ (Discard) → Close dialog → Dashboard
              │
              ↓
        (Click "Create Pilot")
              │
              ↓
┌─────────────────────────────────┐
│   Submitting State              │
│   [LoadingButton]               │
│                                 │
│   [Loader2 icon spinning]       │
│   "Creating Pilot..."           │
│                                 │
│   Form disabled                 │
└─────────────┬───────────────────┘
              │
              ├─→ (Server Error) ⚠
              │   │
              │   ↓
              │   ┌─────────────────────────┐
              │   │   Error Toast           │
              │   │   [Sonner - Error]      │
              │   │                         │
              │   │   [AlertOctagon icon]   │
              │   │   "Failed to Create"    │
              │   │   "Employee ID exists"  │
              │   │                         │
              │   │   [Button: "Retry"]     │
              │   │   Auto-dismiss: Never   │
              │   └──────────┬──────────────┘
              │              │
              │              └─→ (Fix issue) → Back to form
              │
              ↓
        (Success) ✓
              │
              ↓
┌─────────────────────────────────┐
│   Seniority Calculation         │
│   [Background process]          │
│                                 │
│   - Fetch all pilots            │
│   - Sort by commencement date   │
│   - Assign seniority numbers    │
│   - Update database             │
└─────────────┬───────────────────┘
              │
              ↓
┌─────────────────────────────────┐
│   Success Toast                 │
│   [Sonner - Success]            │
│                                 │
│   [CheckCircle2 icon]           │
│   "Pilot Created Successfully"  │
│                                 │
│   Description:                  │
│   "John Smith (AB123) added     │
│    with seniority #15"          │
│                                 │
│   [Button: "View Pilot"]        │
│   Auto-dismiss: 5 seconds       │
└─────────────┬───────────────────┘
              │
              ├─→ (Auto-dismiss)
              │   │
              │   ↓
              │   ┌─────────────────────────┐
              │   │   Pilots Page (Updated) │
              │   │   [Table]               │
              │   │                         │
              │   │   New pilot visible     │
              │   │   Sorted by seniority   │
              │   └─────────────────────────┘
              │
              └─→ (Click "View Pilot")
                  │
                  ↓
              ┌─────────────────────────┐
              │   Pilot Details Page    │
              │   [Breadcrumb]          │
              │   Dashboard > Pilots >  │
              │   John Smith            │
              │                         │
              │   Full pilot profile    │
              └─────────────────────────┘
```

### Key UX Decisions

1. **Two-Step Form**: Required fields first, optional fields second (reduces cognitive load)
2. **Inline Validation**: Errors appear on blur (not overwhelming real-time validation)
3. **Async Employee ID Check**: Uniqueness validated on blur with loading indicator
4. **Confirmation Dialog**: Prevents accidental data loss on cancel
5. **Success Toast with Action**: Users can immediately view created pilot
6. **Automatic Seniority**: No manual input, calculated from commencement date

### Error Scenarios

**Validation Errors**:

- Empty required fields → Inline error messages
- Invalid date format → Calendar picker prevents this
- Duplicate Employee ID → Server error → Toast with retry action

**Network Errors**:

- Timeout → Toast: "Request timed out. Please try again."
- Offline → Toast: "No internet connection. Please check your connection."
- 500 Error → Toast: "Server error. Please contact support."

### Accessibility Notes

- Focus moves to first form field on dialog open
- Tab order: Form fields top-to-bottom → Cancel → Create Pilot
- Escape key closes dialog (with confirmation if changes exist)
- Screen reader announces dialog title and role
- All form fields have associated labels and error messages
- Success toast announced via ARIA live region

---

## Leave Request Approval Flow

### Overview

**Goal**: Review and approve/deny leave requests while checking seniority priority and crew availability
**Primary User**: Admin and Manager roles
**Entry Points**: Dashboard "Pending Requests" card, Leave Management page
**Average Duration**: 3-5 minutes per request
**Success Criteria**: Request approved/denied with proper validation, crew availability maintained

### Flow Diagram

```
┌─────────────────────────────────┐
│   Dashboard                     │
│                                 │
│   [Card: "Pending Requests"]    │
│   "5 requests need review"      │
│   [Button: "Review"]            │
└─────────────┬───────────────────┘
              │ Click
              ↓
┌─────────────────────────────────┐
│   Leave Management Page         │
│   [Breadcrumb]                  │
│   Dashboard > Leave             │
│                                 │
│   [Tabs] All | Pending |        │
│          Approved | Denied      │
└─────────────┬───────────────────┘
              │ "Pending" tab active
              ↓
┌─────────────────────────────────┐
│   Roster Period Filter          │
│   [Select - shadcn/ui]          │
│                                 │
│   Options:                      │
│   - All Rosters                 │
│   - Next Roster (RP12/2025)     │
│   - Following Rosters           │
└─────────────┬───────────────────┘
              │ Select "Next Roster"
              ↓
┌─────────────────────────────────┐
│   Final Review Alert            │
│   [Alert - Urgent variant]      │
│   ONLY shows if pending > 0     │
│   AND within 22 days of deadline│
│                                 │
│   [AlertOctagon icon]           │
│   "URGENT: 5 Days Until Deadline"│
│                                 │
│   "3 pending leave requests for │
│    RP12/2025 require immediate  │
│    action. Deadline: Oct 10."   │
│                                 │
│   [Button: "Review Now"]        │
└─────────────┬───────────────────┘
              │
              ↓
┌─────────────────────────────────┐
│   Pending Requests List         │
│   [Card] for each request       │
│                                 │
│   Request 1:                    │
│   ┌────────────────────────────┐│
│   │ [Icon] John Smith          ││
│   │ AB123 • Captain            ││
│   │                            ││
│   │ Roster: RP12/2025          ││
│   │ Dates: Oct 15-20           ││
│   │ Type: RDO                  ││
│   │ Status: [Badge "Pending"]  ││
│   │                            ││
│   │ [Button: "Review"]         ││
│   └────────────────────────────┘│
│                                 │
│   Request 2: [Similar card]     │
│   Request 3: [Similar card]     │
└─────────────┬───────────────────┘
              │ Click "Review" on Request 1
              ↓
┌─────────────────────────────────┐
│   Leave Request Details Sheet   │
│   [Sheet - shadcn/ui]           │
│   Slides in from right          │
│                                 │
│   [SheetHeader]                 │
│   "Review Leave Request"        │
│   [SheetDescription]            │
│   "John Smith (AB123)"          │
└─────────────┬───────────────────┘
              │
              ↓
┌─────────────────────────────────┐
│   Request Information           │
│                                 │
│   Roster Period: RP12/2025      │
│   Dates: Oct 15-20, 2025        │
│   Duration: 6 days              │
│   Type: RDO Request             │
│   Submitted: Sep 15, 2025       │
│   Submission Method: Email      │
│                                 │
│   Reason:                       │
│   "Family event in Australia"   │
└─────────────┬───────────────────┘
              │
              ↓
        (System checks conflicts)
              │
              ├─→ (No conflicts, crew OK) ✓
              │   │
              │   ↓
              │   ┌─────────────────────────┐
              │   │   No Alerts             │
              │   │   Direct to Actions     │
              │   └──────────┬──────────────┘
              │              │
              │              └─→ Skip to Review Actions
              │
              ├─→ (2+ Captains same dates)
              │   │
              │   ↓
              │   ┌─────────────────────────────────┐
              │   │   Seniority Priority Alert      │
              │   │   [Alert - Info/Warning]        │
              │   │   ALWAYS shows for 2+ pilots    │
              │   │   of same rank                  │
              │   │                                 │
              │   │   Border: Green (≥10 crew) OR   │
              │   │           Yellow (<10 crew)     │
              │   │                                 │
              │   │   [AlertTriangle icon]          │
              │   │   "Seniority Priority Review"   │
              │   │                                 │
              │   │   "3 Captains requesting same   │
              │   │    dates. Current: 12 Captains" │
              │   │                                 │
              │   │   Priority Order:               │
              │   │   1. John Smith (Sen #3, Sep 15)│
              │   │   2. Mike Johnson (Sen #8, Sep 16)│
              │   │   3. Chris Davis (Sen #12, Sep 17)│
              │   │                                 │
              │   │   [if crew < 10]:               │
              │   │   "💡 Consider spreading        │
              │   │    requests across rosters"     │
              │   └──────────┬──────────────────────┘
              │              │
              │              └─→ Continue to Review Actions
              │
              └─→ (Approval would drop below 10 crew) ⚠
                  │
                  ↓
                  ┌─────────────────────────────────┐
                  │   Crew Availability Alert       │
                  │   [Alert - Urgent variant]      │
                  │                                 │
                  │   [AlertOctagon icon]           │
                  │   "Crew Below Minimum"          │
                  │                                 │
                  │   "Approving this request will  │
                  │    reduce Captains to 8         │
                  │    (minimum 10 required)."      │
                  │                                 │
                  │   [Button: "Cannot Approve"]    │
                  │   (disabled)                    │
                  │                                 │
                  │   [Button: "Suggest Alternatives"]│
                  └──────────┬──────────────────────┘
                             │
                             └─→ Continue (approval disabled)
                                 │
                                 ↓
┌─────────────────────────────────┐
│   Review Actions                │
│   [SheetFooter]                 │
│                                 │
│   Comments (optional):          │
│   [Textarea]                    │
│   "Enter review comments..."    │
│                                 │
│   Action Buttons:               │
│   [Button variant="outline"]    │
│   "Deny Request"                │
│                                 │
│   [Button variant="default"]    │
│   "Approve Request"             │
│   (disabled if crew < min)      │
└─────────────┬───────────────────┘
              │
              ├─→ (Click "Deny")
              │   │
              │   ↓
              │   ┌─────────────────────────────────┐
              │   │   Deny Confirmation             │
              │   │   [AlertDialog]                 │
              │   │                                 │
              │   │   "Deny Leave Request?"         │
              │   │                                 │
              │   │   "This will notify John Smith  │
              │   │    via email. Please provide    │
              │   │    a reason in comments."       │
              │   │                                 │
              │   │   [Cancel] [Confirm Deny]       │
              │   └──────────┬──────────────────────┘
              │              │
              │              ├─→ (Cancel) → Back to sheet
              │              │
              │              └─→ (Confirm) → Process denial
              │                  │
              │                  ↓
              │              ┌─────────────────────────┐
              │              │   Denying State         │
              │              │   [LoadingButton]       │
              │              │   "Denying Request..."  │
              │              └──────────┬──────────────┘
              │                         │
              │                         ↓
              │                     (Success) ✓
              │                         │
              │                         ↓
              │              ┌─────────────────────────┐
              │              │   Success Toast         │
              │              │   [Sonner - Success]    │
              │              │                         │
              │              │   "Request Denied"      │
              │              │   Sheet closes          │
              │              │   List updates          │
              │              └─────────────────────────┘
              │
              └─→ (Click "Approve")
                  │
                  ↓
              ┌─────────────────────────────────┐
              │   Approve Confirmation          │
              │   [AlertDialog]                 │
              │                                 │
              │   "Approve Leave Request?"      │
              │                                 │
              │   Summary:                      │
              │   - Pilot: John Smith (Captain) │
              │   - Dates: Oct 15-20 (6 days)   │
              │   - Resulting crew: 11 Captains │
              │   - Status: ✓ Above minimum     │
              │                                 │
              │   [Cancel] [Confirm Approval]   │
              └──────────┬──────────────────────┘
                         │
                         ├─→ (Cancel) → Back to sheet
                         │
                         └─→ (Confirm) → Process approval
                             │
                             ↓
                  ┌─────────────────────────────┐
                  │   Approving State           │
                  │   [LoadingButton]           │
                  │   "Approving Request..."    │
                  │                             │
                  │   Background tasks:         │
                  │   - Update request status   │
                  │   - Send email notification │
                  │   - Update crew availability│
                  │   - Log audit trail         │
                  └──────────┬──────────────────┘
                             │
                             ├─→ (Error) ⚠
                             │   │
                             │   ↓
                             │   ┌─────────────────────────┐
                             │   │   Error Toast           │
                             │   │   [Sonner - Error]      │
                             │   │                         │
                             │   │   "Approval Failed"     │
                             │   │   "Database error"      │
                             │   │   [Button: "Retry"]     │
                             │   └─────────────────────────┘
                             │
                             ↓
                         (Success) ✓
                             │
                             ↓
                  ┌─────────────────────────────┐
                  │   Success Toast             │
                  │   [Sonner - Success]        │
                  │                             │
                  │   [CheckCircle2 icon]       │
                  │   "Leave Request Approved"  │
                  │                             │
                  │   "John Smith notified via  │
                  │    email. Crew: 11 Captains"│
                  │                             │
                  │   Auto-dismiss: 5 seconds   │
                  └──────────┬──────────────────┘
                             │
                             ├─→ Sheet closes
                             │
                             ↓
                  ┌─────────────────────────────┐
                  │   Updated Leave List        │
                  │                             │
                  │   Request removed from      │
                  │   "Pending" list            │
                  │                             │
                  │   Pending count: 4 → 2      │
                  │                             │
                  │   Next request auto-loaded  │
                  │   (if user clicked          │
                  │   "Review Next")            │
                  └─────────────────────────────┘
```

### Key UX Decisions

1. **Final Review Alert**: ONLY shows when pending count > 0 AND within 22 days
2. **Seniority Priority**: ALWAYS shows for 2+ pilots of same rank requesting same dates
3. **Crew Availability**: Real-time calculation, disables approval if below minimum
4. **Rank Separation**: Captains and First Officers evaluated independently
5. **Confirmation Dialogs**: Prevent accidental approvals/denials
6. **Success with Context**: Toast shows resulting crew count after approval

### Error Scenarios

**Crew Availability**:

- Below minimum → Approval button disabled + alert shown
- Exactly at minimum → Warning shown but approval allowed

**Seniority Conflicts**:

- 2+ pilots same rank → Alert with priority order (informational)
- Crew sufficient → Green border, approve all recommendation
- Crew shortage → Yellow border, spreading recommendation

**Network Errors**:

- Approval fails → Toast with retry button
- Email notification fails → Log error, show warning (approval still succeeds)

### Accessibility Notes

- Sheet slides from right with keyboard focus on first interactive element
- Tab order: Request details → Comments → Deny → Approve → Close
- Escape key closes sheet (no confirmation needed, read-only view)
- Alerts announced via ARIA live regions
- Approve button has descriptive label: "Approve leave request for John Smith"

---

## Certification Tracking Flow

### Overview

**Goal**: View expiring certifications and update expiry dates to maintain compliance
**Primary User**: Admin and Manager roles
**Entry Points**: Dashboard "Expiring Certifications" alert, Certifications page
**Average Duration**: 1-2 minutes per certification
**Success Criteria**: Expiry date updated, status badge reflects new state, toast confirmation

### Flow Diagram

```
┌─────────────────────────────────┐
│   Dashboard                     │
│                                 │
│   [Alert - Warning variant]     │
│   [AlertTriangle icon]          │
│   "5 Certifications Expiring"   │
│   "Next 30 days"                │
│                                 │
│   [Button: "View Details"]      │
└─────────────┬───────────────────┘
              │ Click
              ↓
┌─────────────────────────────────┐
│   Certifications Page           │
│   [Breadcrumb]                  │
│   Dashboard > Certifications    │
│                                 │
│   [Tabs] All | Proficiency |    │
│          Medical | Dangerous    │
│          Goods | Security |     │
│          CRM | Route | Other    │
└─────────────┬───────────────────┘
              │
              ↓
┌─────────────────────────────────┐
│   Filter Controls               │
│                                 │
│   [Select: "Status"]            │
│   - All                         │
│   - Expiring (30 days)          │
│   - Expired                     │
│   - Current                     │
│                                 │
│   [Select: "Pilot"]             │
│   - All Pilots                  │
│   - John Smith                  │
│   - Mike Johnson                │
│   - ...                         │
└─────────────┬───────────────────┘
              │ Select "Expiring"
              ↓
        (System loads expiring certs)
              │
              ├─→ (Loading)
              │   │
              │   ↓
              │   ┌─────────────────────────┐
              │   │   Table Skeleton        │
              │   │   [CertificationTable-  │
              │   │    Skeleton]            │
              │   │                         │
              │   │   Animated pulse        │
              │   │   Min display: 200ms    │
              │   └──────────┬──────────────┘
              │              │
              │              └─→ (Data loaded)
              │
              ↓
┌─────────────────────────────────┐
│   Certifications Table          │
│   [Table - shadcn/ui]           │
│                                 │
│   Showing 1-20 of 45            │
│                                 │
│   ┌────┬──────┬────────┬──────┐│
│   │Pilot│Check│Category│Status││
│   ├────┼──────┼────────┼──────┤│
│   │John│Line │Profic. │[Badge││
│   │Smith│Train│        │Expir.││
│   │    │     │        │12 day││
│   │    │     │        │Yellow││
│   ├────┼──────┼────────┼──────┤│
│   │Mike│Medical│Medical│[Badge││
│   │Johnson│Cert│      │Expir.││
│   │    │     │        │18 day││
│   ├────┼──────┼────────┼──────┤│
│   │... │     │        │      ││
│   └────┴──────┴────────┴──────┘│
│                                 │
│   [Pagination]                  │
│   [1] [2] [3] ... [5]           │
└─────────────┬───────────────────┘
              │ Click on row
              ↓
┌─────────────────────────────────┐
│   Certification Details Dialog  │
│   [Dialog - shadcn/ui]          │
│                                 │
│   [DialogHeader]                │
│   "Update Certification"        │
│                                 │
│   [DialogDescription]           │
│   "Line Training - John Smith"  │
└─────────────┬───────────────────┘
              │
              ↓
┌─────────────────────────────────┐
│   Current Information           │
│                                 │
│   Pilot: John Smith (AB123)     │
│   Check Type: Line Training     │
│   Category: Proficiency Checks  │
│   Current Expiry: Oct 22, 2025  │
│   Days Remaining: 12 days       │
│   Status: [Badge "Expiring Soon"││
│           Yellow]               │
└─────────────┬───────────────────┘
              │
              ↓
┌─────────────────────────────────┐
│   Update Form                   │
│   [Form - shadcn/ui]            │
│                                 │
│   New Expiry Date *             │
│   [DatePicker - Calendar]       │
│                                 │
│   [FormHelperText]              │
│   "Select new expiry date.      │
│    Must be future date."        │
│                                 │
│   Comments (optional)           │
│   [Textarea]                    │
│   "Renewal notes, training      │
│    completed, etc."             │
└─────────────┬───────────────────┘
              │
              ↓
        (User selects date)
              │
              ├─→ (Invalid date - past) ⚠
              │   │
              │   ↓
              │   ┌─────────────────────────┐
              │   │   Inline Error          │
              │   │   [FormErrorMessage]    │
              │   │                         │
              │   │   [AlertCircle icon]    │
              │   │   "Expiry date must be  │
              │   │    in the future"       │
              │   └──────────┬──────────────┘
              │              │
              │              └─→ (Fix date) → Back to form
              │
              ├─→ (Date too far - >2 years) ⚠
              │   │
              │   ↓
              │   ┌─────────────────────────┐
              │   │   Warning Alert         │
              │   │   [Alert - Warning]     │
              │   │                         │
              │   │   [AlertTriangle icon]  │
              │   │   "Unusual Expiry Date" │
              │   │                         │
              │   │   "Selected date is 3   │
              │   │    years in future.     │
              │   │    Please verify."      │
              │   │                         │
              │   │   [Checkbox]            │
              │   │   "I confirm this is    │
              │   │    correct"             │
              │   └──────────┬──────────────┘
              │              │
              │              └─→ (Confirm) → Continue
              │
              ↓
        (Valid date selected)
              │
              ↓
┌─────────────────────────────────┐
│   Preview Updated Status        │
│   [Card with border]            │
│                                 │
│   New Expiry: Dec 15, 2025      │
│   Days Until Expiry: 65 days    │
│   New Status: [Badge "Current"  │
│               Green]            │
└─────────────┬───────────────────┘
              │
              ↓
┌─────────────────────────────────┐
│   Dialog Actions                │
│   [DialogFooter]                │
│                                 │
│   [Button variant="outline"]    │
│   "Cancel"                      │
│                                 │
│   [Button variant="default"]    │
│   "Update Certification"        │
└─────────────┬───────────────────┘
              │
              ├─→ (Cancel) → Close dialog → Back to table
              │
              └─→ (Update)
                  │
                  ↓
              ┌─────────────────────────────┐
              │   Updating State            │
              │   [LoadingButton]           │
              │                             │
              │   [Loader2 icon spinning]   │
              │   "Updating..."             │
              │                             │
              │   Background:               │
              │   - Update pilot_checks     │
              │   - Recalculate status      │
              │   - Log audit trail         │
              │   - Invalidate cache        │
              └──────────┬──────────────────┘
                         │
                         ├─→ (Error) ⚠
                         │   │
                         │   ↓
                         │   ┌─────────────────────────┐
                         │   │   Error Toast           │
                         │   │   [Sonner - Error]      │
                         │   │                         │
                         │   │   [AlertOctagon icon]   │
                         │   │   "Update Failed"       │
                         │   │                         │
                         │   │   "Database connection  │
                         │   │    error. Try again."   │
                         │   │                         │
                         │   │   [Button: "Retry"]     │
                         │   └──────────┬──────────────┘
                         │              │
                         │              └─→ (Retry) → Back to update
                         │
                         ↓
                     (Success) ✓
                         │
                         ↓
              ┌─────────────────────────────┐
              │   Success Toast             │
              │   [Sonner - Success]        │
              │                             │
              │   [CheckCircle2 icon]       │
              │   "Certification Updated"   │
              │                             │
              │   "Line Training expiry     │
              │    updated to Dec 15, 2025" │
              │   "Status: Current"         │
              │                             │
              │   Auto-dismiss: 5 seconds   │
              └──────────┬──────────────────┘
                         │
                         ├─→ Dialog closes
                         │
                         ↓
              ┌─────────────────────────────┐
              │   Updated Table             │
              │   [Table with optimistic UI]│
              │                             │
              │   Row updates immediately:  │
              │   - Badge: Yellow → Green   │
              │   - Expiry: Oct 22 → Dec 15 │
              │   - Days: 12 → 65           │
              │                             │
              │   Row may move if sorted    │
              │   by expiry date            │
              │                             │
              │   Expiring count: 5 → 4     │
              └─────────────────────────────┘
```

### Key UX Decisions

1. **Inline Table Editing**: Click row to open dialog (simpler than inline edits)
2. **Visual Feedback**: Badge updates optimistically before server confirmation
3. **Date Validation**: Multiple levels (required, future date, reasonable range)
4. **Status Preview**: Show new status before submitting (builds confidence)
5. **Audit Trail**: Automatic logging (no manual fields required)

### Error Scenarios

**Date Validation**:

- Past date → Inline error, prevent submission
- Date too far (>2 years) → Warning alert, require confirmation
- Invalid format → Calendar picker prevents this

**Network Errors**:

- Update fails → Toast with retry action
- Timeout → Toast: "Request timed out. Please check your connection."

### Accessibility Notes

- Dialog auto-focus on date picker
- Tab order: Date picker → Comments → Cancel → Update
- Escape key closes dialog (no confirmation for read-only view)
- Calendar keyboard navigation: Arrow keys, Enter to select
- Status badge color has 4.5:1 contrast ratio
- Screen reader announces status change in success toast

---

## Analytics Dashboard Flow

### Overview

**Goal**: View fleet compliance metrics, charts, and export reports
**Primary User**: Admin and Manager roles
**Entry Points**: Dashboard navigation, "View Analytics" links
**Average Duration**: 3-5 minutes (exploration)
**Success Criteria**: Metrics loaded, charts interactive, export successful

### Flow Diagram

```
┌─────────────────────────────────┐
│   Main Dashboard                │
│                                 │
│   [Navigation]                  │
│   [NavItem: "Analytics"]        │
└─────────────┬───────────────────┘
              │ Click
              ↓
┌─────────────────────────────────┐
│   Analytics Page                │
│   [Breadcrumb]                  │
│   Dashboard > Analytics         │
└─────────────┬───────────────────┘
              │
              ↓
        (System loads analytics data)
              │
              ├─→ (Loading)
              │   │
              │   ↓
              │   ┌─────────────────────────────┐
              │   │   Dashboard Skeleton        │
              │   │   [DashboardStatsSkeleton]  │
              │   │                             │
              │   │   4 stat cards with pulse   │
              │   │   Min display: 200ms        │
              │   └──────────┬──────────────────┘
              │              │
              │              └─→ (Data loaded)
              │
              ↓
┌─────────────────────────────────┐
│   Analytics Stats Grid          │
│   [Grid: 4 columns]             │
│                                 │
│   [Card 1]        [Card 2]      │
│   Total Pilots    Certifications│
│   27              571           │
│   [Plane icon]    [Award icon]  │
│                                 │
│   [Card 3]        [Card 4]      │
│   Expiring        Compliance    │
│   5 (30 days)     94.2%         │
│   [AlertTri icon] [CheckCircle] │
└─────────────┬───────────────────┘
              │
              ↓
┌─────────────────────────────────┐
│   Date Range Filter             │
│   [Select - shadcn/ui]          │
│                                 │
│   Options:                      │
│   - Last 30 days                │
│   - Last 90 days (selected)     │
│   - Last 6 months               │
│   - Last year                   │
│   - Custom range                │
└─────────────┬───────────────────┘
              │
              ├─→ (Select "Custom range")
              │   │
              │   ↓
              │   ┌─────────────────────────────┐
              │   │   Custom Date Range         │
              │   │   [Popover - shadcn/ui]     │
              │   │                             │
              │   │   From: [DatePicker]        │
              │   │   To: [DatePicker]          │
              │   │                             │
              │   │   [Button: "Apply"]         │
              │   └──────────┬──────────────────┘
              │              │
              │              └─→ (Apply) → Reload charts
              │
              ↓
┌─────────────────────────────────┐
│   Certification Status Chart    │
│   [Card with Chart.js]          │
│                                 │
│   [TabsList] Pie | Bar | Line   │
│                                 │
│   Pie chart showing:            │
│   - Current: 520 (91.1%)        │
│   - Expiring: 45 (7.9%)         │
│   - Expired: 6 (1.0%)           │
│                                 │
│   Legend with clickable badges: │
│   [Badge Green] Current         │
│   [Badge Yellow] Expiring       │
│   [Badge Red] Expired           │
└─────────────┬───────────────────┘
              │
              ├─→ (Hover chart segment)
              │   │
              │   ↓
              │   ┌─────────────────────────────┐
              │   │   Tooltip                   │
              │   │   [Chart.js tooltip]        │
              │   │                             │
              │   │   Current: 520              │
              │   │   91.1% of total            │
              │   └─────────────────────────────┘
              │
              ├─→ (Click legend badge)
              │   │
              │   ↓
              │   ┌─────────────────────────────┐
              │   │   Toggle Dataset            │
              │   │                             │
              │   │   Hide/show segment         │
              │   │   Update percentages        │
              │   └─────────────────────────────┘
              │
              └─→ (Click "Bar" tab)
                  │
                  ↓
              ┌─────────────────────────────┐
              │   Bar Chart View            │
              │   [Animated transition]     │
              │                             │
              │   Y-axis: Count             │
              │   X-axis: Status            │
              │                             │
              │   Bars:                     │
              │   - Current: 520            │
              │   - Expiring: 45            │
              │   - Expired: 6              │
              └──────────┬──────────────────┘
                         │
                         ↓
┌─────────────────────────────────┐
│   Expiry Trend Chart            │
│   [Card with Chart.js]          │
│                                 │
│   Line chart showing:           │
│   - Next 6 months               │
│   - Expirations per month       │
│   - Trend line                  │
│                                 │
│   Peak: November (12 expirations)│
└─────────────┬───────────────────┘
              │
              ↓
┌─────────────────────────────────┐
│   Pilot Distribution Chart      │
│   [Card with Chart.js]          │
│                                 │
│   Doughnut chart:               │
│   - Captains: 15 (55.6%)        │
│   - First Officers: 12 (44.4%)  │
│                                 │
│   Breakdown by contract:        │
│   - Full Time: 22               │
│   - Part Time: 3                │
│   - Casual: 2                   │
└─────────────┬───────────────────┘
              │
              ↓
┌─────────────────────────────────┐
│   Export Options                │
│   [Card]                        │
│                                 │
│   [Button] Export Dashboard     │
│   [DropdownMenu]                │
│   - PDF Report                  │
│   - Excel (CSV)                 │
│   - PNG Image                   │
└─────────────┬───────────────────┘
              │ Click "PDF Report"
              ↓
┌─────────────────────────────────┐
│   Export Dialog                 │
│   [Dialog - shadcn/ui]          │
│                                 │
│   Report Type:                  │
│   [RadioGroup]                  │
│   ( ) Summary Report            │
│   (•) Detailed Report           │
│   ( ) Custom Report             │
│                                 │
│   Include:                      │
│   [Checkbox] Charts             │
│   [Checkbox] Data Tables        │
│   [Checkbox] Pilot Details      │
│                                 │
│   Date Range:                   │
│   [Display only, from filter]   │
│   Last 90 days                  │
└─────────────┬───────────────────┘
              │
              ↓
┌─────────────────────────────────┐
│   Dialog Actions                │
│   [DialogFooter]                │
│                                 │
│   [Button variant="outline"]    │
│   "Cancel"                      │
│                                 │
│   [Button variant="default"]    │
│   "Generate PDF"                │
└─────────────┬───────────────────┘
              │ Click "Generate PDF"
              ↓
┌─────────────────────────────────┐
│   Generating State              │
│   [LoadingButton]               │
│                                 │
│   [Loader2 icon spinning]       │
│   "Generating Report..."        │
│                                 │
│   Background:                   │
│   - Fetch data                  │
│   - Render charts               │
│   - Generate PDF                │
│   - Prepare download            │
└─────────────┬───────────────────┘
              │
              ├─→ (Error) ⚠
              │   │
              │   ↓
              │   ┌─────────────────────────────┐
              │   │   Error Toast               │
              │   │   [Sonner - Error]          │
              │   │                             │
              │   │   [AlertOctagon icon]       │
              │   │   "Export Failed"           │
              │   │                             │
              │   │   "PDF generation error.    │
              │   │    Try again or choose CSV."│
              │   │                             │
              │   │   [Button: "Retry"]         │
              │   └──────────┬──────────────────┘
              │              │
              │              └─→ (Retry or Cancel)
              │
              ↓
          (Success) ✓
              │
              ↓
┌─────────────────────────────────┐
│   Success Toast + Download      │
│   [Sonner - Success]            │
│                                 │
│   [CheckCircle2 icon]           │
│   "Report Generated"            │
│                                 │
│   "Analytics_Report_2025-10-07  │
│    .pdf downloading..."         │
│                                 │
│   Browser download initiated    │
│   Auto-dismiss: 5 seconds       │
└─────────────┬───────────────────┘
              │
              └─→ Dialog closes → Back to analytics
```

### Key UX Decisions

1. **Lazy Load Charts**: Charts load after stats (progressive enhancement)
2. **Interactive Charts**: Hover tooltips, clickable legends, tab switching
3. **Date Range Persistence**: Filter selection saved in localStorage
4. **Export Preview**: Show selected options before generating
5. **Download Feedback**: Toast confirms download initiated

### Error Scenarios

**Chart Loading**:

- Data fetch fails → Show error state in chart card with retry button
- Chart render fails → Fallback to data table view

**Export Errors**:

- PDF generation fails → Toast with retry or alternative format (CSV)
- Download blocked → Toast: "Download blocked. Check browser settings."

### Accessibility Notes

- Charts have accessible data tables (screen reader fallback)
- Chart colors meet WCAG 2.1 AA contrast requirements
- Keyboard navigation for chart tabs: Arrow keys
- Export dialog focus management
- ARIA labels on all chart elements

---

## Settings Management Flow

### Overview

**Goal**: Configure system settings including roster periods, retirement age, and notifications
**Primary User**: Admin role only
**Entry Points**: Dashboard navigation, Settings icon
**Average Duration**: 2-3 minutes
**Success Criteria**: Settings saved, confirmation shown, changes applied system-wide

### Flow Diagram

```
┌─────────────────────────────────┐
│   Dashboard                     │
│                                 │
│   [Navigation]                  │
│   [NavItem: "Settings"]         │
│   (Admin only)                  │
└─────────────┬───────────────────┘
              │ Click
              ↓
        (Check permission)
              │
              ├─→ (Not Admin) ⚠
              │   │
              │   ↓
              │   ┌─────────────────────────────┐
              │   │   Permission Denied         │
              │   │   [Alert - Error]           │
              │   │                             │
              │   │   [AlertOctagon icon]       │
              │   │   "Access Denied"           │
              │   │                             │
              │   │   "Settings require admin   │
              │   │    permissions."            │
              │   │                             │
              │   │   Redirect to Dashboard     │
              │   └─────────────────────────────┘
              │
              ↓
        (Admin confirmed) ✓
              │
              ↓
┌─────────────────────────────────┐
│   Settings Page                 │
│   [Breadcrumb]                  │
│   Dashboard > Settings          │
│                                 │
│   [Tabs] General | Roster |     │
│          Notifications | System │
└─────────────┬───────────────────┘
              │ "General" tab active
              ↓
┌─────────────────────────────────┐
│   General Settings Section      │
│   [Form - shadcn/ui]            │
│                                 │
│   Retirement Age                │
│   [Input type="number"]         │
│   Value: 60                     │
│   [FormHelperText]              │
│   "Default retirement age for   │
│    all pilots"                  │
│                                 │
│   Minimum Crew - Captains       │
│   [Input type="number"]         │
│   Value: 10                     │
│   [FormHelperText]              │
│   "Minimum Captains required    │
│    on roster"                   │
│                                 │
│   Minimum Crew - First Officers │
│   [Input type="number"]         │
│   Value: 10                     │
│   [FormHelperText]              │
│   "Minimum FOs required on      │
│    roster"                      │
└─────────────┬───────────────────┘
              │
              ├─→ (Change retirement age to 65)
              │   │
              │   ↓
              │   ┌─────────────────────────────┐
              │   │   Warning Alert             │
              │   │   [Alert - Warning]         │
              │   │                             │
              │   │   [AlertTriangle icon]      │
              │   │   "Retirement Age Change"   │
              │   │                             │
              │   │   "Changing retirement age  │
              │   │    will recalculate all     │
              │   │    pilot retirement dates." │
              │   │                             │
              │   │   Affected pilots: 3        │
              │   └──────────┬──────────────────┘
              │              │
              │              └─→ (Continue editing)
              │
              ↓
┌─────────────────────────────────┐
│   Roster Settings Tab           │
│   [Tab: "Roster"]               │
│                                 │
│   Current Roster Period         │
│   [Input disabled]              │
│   Value: RP11/2025              │
│   [FormHelperText]              │
│   "Auto-calculated from end date"│
│                                 │
│   Current Roster End Date       │
│   [DatePicker]                  │
│   Value: Oct 10, 2025           │
│   [FormHelperText]              │
│   "End date of current 28-day   │
│    roster period"               │
│                                 │
│   Roster Duration               │
│   [Input type="number" disabled]│
│   Value: 28 days                │
│   [FormHelperText]              │
│   "Fixed 28-day roster periods" │
└─────────────┬───────────────────┘
              │
              ↓
┌─────────────────────────────────┐
│   Notification Settings Tab     │
│   [Tab: "Notifications"]        │
│                                 │
│   Email Notifications           │
│   [Switch] Enabled              │
│                                 │
│   Leave Request Submitted       │
│   [Checkbox] Notify managers    │
│                                 │
│   Leave Request Approved        │
│   [Checkbox] Notify pilot       │
│                                 │
│   Certification Expiring        │
│   [Checkbox] Notify 30 days     │
│   [Checkbox] Notify 14 days     │
│   [Checkbox] Notify 7 days      │
│                                 │
│   Final Review Deadline         │
│   [Checkbox] Alert 22 days      │
│   [Checkbox] Alert 7 days       │
└─────────────┬───────────────────┘
              │
              ↓
┌─────────────────────────────────┐
│   Save Changes Section          │
│   [Card with actions]           │
│                                 │
│   [Alert - Info]                │
│   "You have unsaved changes"    │
│                                 │
│   [Button variant="outline"]    │
│   "Reset to Defaults"           │
│                                 │
│   [Button variant="default"]    │
│   "Save Settings"               │
└─────────────┬───────────────────┘
              │
              ├─→ (Click "Reset")
              │   │
              │   ↓
              │   ┌─────────────────────────────┐
              │   │   Reset Confirmation        │
              │   │   [AlertDialog]             │
              │   │                             │
              │   │   "Reset to Default         │
              │   │    Settings?"               │
              │   │                             │
              │   │   "This will restore all    │
              │   │    settings to original     │
              │   │    values. Unsaved changes  │
              │   │    will be lost."           │
              │   │                             │
              │   │   [Cancel] [Reset]          │
              │   └──────────┬──────────────────┘
              │              │
              │              ├─→ (Cancel) → Back
              │              │
              │              └─→ (Reset) → Reload defaults
              │
              └─→ (Click "Save Settings")
                  │
                  ↓
┌─────────────────────────────────┐
│   Validation                    │
│                                 │
│   Check:                        │
│   - Retirement age 50-70        │
│   - Min crew ≥ 8                │
│   - Roster end date valid       │
└─────────────┬───────────────────┘
              │
              ├─→ (Validation Error) ⚠
              │   │
              │   ↓
              │   ┌─────────────────────────────┐
              │   │   Error Alert               │
              │   │   [Alert - Error]           │
              │   │                             │
              │   │   [AlertOctagon icon]       │
              │   │   "Invalid Settings"        │
              │   │                             │
              │   │   Errors:                   │
              │   │   - Retirement age must be  │
              │   │     between 50-70           │
              │   │   - Min crew cannot be      │
              │   │     less than 8             │
              │   │                             │
              │   │   [Button: "Review"]        │
              │   └──────────┬──────────────────┘
              │              │
              │              └─→ (Fix errors) → Back
              │
              ↓
        (Validation passed) ✓
              │
              ↓
┌─────────────────────────────────┐
│   Save Confirmation             │
│   [AlertDialog]                 │
│                                 │
│   "Save Settings Changes?"      │
│                                 │
│   Summary of changes:           │
│   - Retirement age: 60 → 65     │
│   - Min Captains: 10 (no change)│
│                                 │
│   Impact:                       │
│   - 3 pilots affected           │
│   - Retirement dates updated    │
│                                 │
│   [Cancel] [Confirm Save]       │
└─────────────┬───────────────────┘
              │
              ├─→ (Cancel) → Back to form
              │
              └─→ (Confirm)
                  │
                  ↓
┌─────────────────────────────────┐
│   Saving State                  │
│   [LoadingButton]               │
│                                 │
│   [Loader2 icon spinning]       │
│   "Saving Settings..."          │
│                                 │
│   Background:                   │
│   - Update settings table       │
│   - Recalculate affected data   │
│   - Invalidate cache            │
│   - Log audit trail             │
└─────────────┬───────────────────┘
              │
              ├─→ (Error) ⚠
              │   │
              │   ↓
              │   ┌─────────────────────────────┐
              │   │   Error Toast               │
              │   │   [Sonner - Error]          │
              │   │                             │
              │   │   [AlertOctagon icon]       │
              │   │   "Save Failed"             │
              │   │                             │
              │   │   "Database error. Settings │
              │   │    not saved. Try again."   │
              │   │                             │
              │   │   [Button: "Retry"]         │
              │   └──────────┬──────────────────┘
              │              │
              │              └─→ (Retry or Cancel)
              │
              ↓
          (Success) ✓
              │
              ↓
┌─────────────────────────────────┐
│   Success Toast                 │
│   [Sonner - Success]            │
│                                 │
│   [CheckCircle2 icon]           │
│   "Settings Saved"              │
│                                 │
│   "System settings updated.     │
│    3 pilot records recalculated."│
│                                 │
│   Auto-dismiss: 5 seconds       │
└─────────────┬───────────────────┘
              │
              └─→ Remove "unsaved changes" alert
                  Form returns to clean state
```

### Key UX Decisions

1. **Permission Gate**: Non-admin users cannot access settings
2. **Unsaved Changes Alert**: Warns users before navigating away
3. **Impact Preview**: Shows what will be affected before saving
4. **Confirmation Dialog**: Prevents accidental changes to critical settings
5. **Background Recalculation**: Auto-updates affected records after save

### Error Scenarios

**Permission Errors**:

- Non-admin access → Redirect to dashboard with error alert

**Validation Errors**:

- Invalid values → Inline errors + summary alert at top
- Out of range → Specific error message with acceptable range

**Network Errors**:

- Save fails → Toast with retry button
- Partial save → Warning toast: "Some settings not saved. Please retry."

### Accessibility Notes

- Settings form has logical tab order
- All inputs have associated labels
- Switch controls keyboard accessible (Space to toggle)
- Validation errors announced via ARIA live regions
- Confirmation dialogs trap focus
- Success toast announced to screen readers

---

## Document Version History

| Version | Date        | Changes                                       |
| ------- | ----------- | --------------------------------------------- |
| 1.0     | Oct 7, 2025 | Initial user flow diagrams for 5 key journeys |

---

**Next Document**: RESPONSIVE_DESIGN_GUIDE.md
