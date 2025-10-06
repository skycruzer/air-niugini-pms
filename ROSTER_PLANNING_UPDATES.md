# Roster Planning Terminology Updates

## Summary

Updated roster planning reports and terminology throughout the application as requested:

### Changes Made

1. **Report Title**: "Roster Leave Planning Report" → "Roster Planning Report"
2. **Leave Type Labels**:
   - "RDO Leave Requests" → "RDO Request"
   - "SDO" → "SDO Request"
   - Other leave types properly labeled (Annual Leave, Sick Leave, etc.)
3. **Added Request Date Column**: Now displays the date when each request was made

---

## Files Modified

### 1. PDF Report Generator
**File**: `src/lib/pdf-roster-leave-report.tsx`

**Changes**:
- ✅ Updated report title: "Roster Leave Planning Report" → "Roster Planning Report"
- ✅ Updated report type: `roster-leave-planning` → `roster-planning`
- ✅ Added "Requested" column to PDF tables showing `request_date`
- ✅ Updated column widths to accommodate new column
- ✅ Added leave type label formatting:
  - RDO → "RDO Request"
  - SDO → "SDO Request"
  - ANNUAL → "Annual Leave"
  - SICK → "Sick Leave"
  - LSL → "Long Service Leave"
  - LWOP → "Leave Without Pay"
  - MATERNITY → "Maternity Leave"
  - COMPASSIONATE → "Compassionate Leave"
- ✅ Updated PDF filename: `Air_Niugini_Leave_Planning_*` → `Air_Niugini_Roster_Planning_*`

### 2. Roster Planning Page
**File**: `src/app/dashboard/leave/roster-planning/page.tsx`

**Changes**:
- ✅ Updated page title: "Roster Leave Planning" → "Roster Planning"
- ✅ Added "Requested" column to table showing formatted `request_date`
- ✅ Updated email subject: "Leave Planning" → "Roster Planning"
- ✅ Updated email body text to use "roster planning report"
- ✅ Updated download filenames: `Leave_Planning` → `Roster_Planning`
- ✅ Added `formatLeaveTypeLabel()` function for consistent leave type display
- ✅ Updated leave type badges to show formatted labels (RDO Request, SDO Request, etc.)
- ✅ Updated footer text: "Roster Leave Planning Module" → "Roster Planning Module"

### 3. Navigation Menu
**File**: `src/components/layout/DashboardLayout.tsx`

**Changes**:
- ✅ Updated navigation description: "Future roster leave planning" → "Future roster planning"

### 4. API Route
**File**: `src/app/api/reports/roster-leave/route.ts`

**Changes**:
- ✅ Updated function comment: "Roster Leave Planning PDF Report" → "Roster Planning PDF Report"
- ✅ Updated console log messages to say "roster planning" instead of "roster leave"
- ✅ Updated error messages for consistency

---

## Visual Changes

### PDF Report Table Columns (Before → After)

**Before**:
| Pilot Name | Employee ID | Dates | Days | Status | Method | Reason |

**After**:
| Pilot Name | Employee ID | Dates | Days | Status | **Requested** | Method | Reason |

### Web Page Table Columns (Before → After)

**Before**:
| Pilot | Dates | Days | Status | Method | Reason |

**After**:
| Pilot | Dates | Days | Status | **Requested** | Method | Reason |

### Leave Type Section Headers (Before → After)

**Before**:
- RDO Leave Requests
- SDO Leave Requests
- ANNUAL Leave Requests
- SICK Leave Requests

**After**:
- RDO Request
- SDO Request
- Annual Leave
- Sick Leave
- Long Service Leave
- Leave Without Pay
- Maternity Leave
- Compassionate Leave

---

## Request Date Display

The `request_date` field is now displayed in both PDF and web views:

**Format**: `dd MMM yyyy` (e.g., "05 Oct 2025")
**Source**: `leave_requests.request_date` column from database
**Fallback**: "N/A" if no date is set

---

## Testing Checklist

Before deploying, test the following:

- [ ] Navigate to **Dashboard → Leave → Roster Planning**
- [ ] Verify page title shows "Roster Planning"
- [ ] Select a future roster period with leave requests
- [ ] Verify table displays "Requested" column with dates
- [ ] Verify leave type labels show correctly (e.g., "RDO Request", "SDO Request")
- [ ] Generate PDF report and verify:
  - [ ] Report title shows "Roster Planning Report"
  - [ ] PDF tables include "Requested" column
  - [ ] Leave type sections show formatted labels
  - [ ] Filename uses "Roster_Planning" prefix
- [ ] Test "Email to Planners" functionality:
  - [ ] Email subject line uses "Roster Planning"
  - [ ] Downloaded PDF uses correct filename

---

## Database Requirement

**IMPORTANT**: Ensure the `leave_requests` table has the `request_date` column populated with actual dates. If the column is NULL for existing records, they will display as "N/A" in reports.

To populate missing request dates (if needed):
```sql
-- Example: Set request_date to created_at for existing records
UPDATE leave_requests
SET request_date = created_at
WHERE request_date IS NULL;
```

---

## Migration Notes

No database migrations required. All changes are front-end only:
- PDF report generation
- Web UI display
- Navigation labels
- API logging

---

## Files Summary

| File | Purpose | Changes |
|------|---------|---------|
| `pdf-roster-leave-report.tsx` | PDF generation | Title, labels, request_date column |
| `roster-planning/page.tsx` | Web UI | Title, table, labels, request_date column |
| `DashboardLayout.tsx` | Navigation | Description text |
| `roster-leave/route.ts` | API endpoint | Comments and logging |

---

**Air Niugini B767 Pilot Management System**
_Roster Planning Module Updates_
_Version 1.0 - Updated 2025-10-06_
