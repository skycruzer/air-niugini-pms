# Leave Eligibility System - Implementation Guide

## Overview

The Leave Eligibility System ensures that minimum crew requirements are maintained at all times while managing leave requests. It provides **seniority-based recommendations** and **real-time conflict detection** for overlapping leave requests.

## Features

### ✅ Core Functionality

1. **Crew Availability Checking**
   - Real-time calculation of available Captains and First Officers
   - Checks against minimum requirements from settings
   - Considers both APPROVED and PENDING leave requests

2. **Conflict Detection**
   - Identifies dates that would violate minimum crew requirements
   - Severity levels: CRITICAL, WARNING, INFO
   - Detailed impact analysis for each affected date

3. **Seniority-Based Recommendations**
   - Suggests alternative pilots based on seniority number
   - Shows availability status for each recommendation
   - Priority ranking (1 = most senior available)

4. **Automatic Recommendations**
   - APPROVE: No conflicts, crew requirements met
   - REVIEW_REQUIRED: Potential shortage, needs management review
   - DENY: Critical shortage, would impact fleet operations

## System Configuration

### Minimum Crew Requirements

Stored in `settings` table under key `pilot_requirements`:

```json
{
  "minimum_captains_per_hull": 7,
  "minimum_first_officers_per_hull": 7,
  "number_of_aircraft": 2
}
```

**Current Fleet**:

- Total Captains: 19
- Total First Officers: 7
- Minimum Required: 14 Captains, 14 First Officers (7 per hull × 2 aircraft)

⚠️ **CRITICAL**: With only 7 First Officers total and 14 required minimum, the system is operating below minimum requirements!

## API Endpoints

### 1. Check Single Leave Request

**POST** `/api/leave-eligibility/check`

```json
{
  "pilotId": "uuid",
  "pilotRole": "Captain" | "First Officer",
  "startDate": "2025-12-20",
  "endDate": "2025-12-30",
  "requestType": "ANNUAL",
  "requestId": "uuid" (optional, for updates)
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "isEligible": false,
    "conflicts": [...],
    "affectedDates": ["2025-12-25", "2025-12-26"],
    "recommendation": "REVIEW_REQUIRED",
    "reasons": [
      "⚠️ Potential crew shortage - management review recommended",
      "2 warning(s) detected for minimum crew levels"
    ],
    "alternativePilots": [...],
    "crewImpact": [...]
  }
}
```

### 2. Get Crew Availability

**GET** `/api/leave-eligibility?action=availability&startDate=2025-12-20&endDate=2025-12-30`

Returns day-by-day crew availability breakdown.

### 3. Bulk Check for Roster Period

**GET** `/api/leave-eligibility?action=bulk&rosterPeriod=RP14/2025`

Checks all pending requests for a roster period.

## React Components

### `<LeaveEligibilityAlert />`

Displays eligibility warnings in leave review modals:

```tsx
import { LeaveEligibilityAlert } from '@/components/leave/LeaveEligibilityAlert';

<LeaveEligibilityAlert eligibility={eligibility} isLoading={isLoading} pilotName="John Smith" />;
```

**Features**:

- Color-coded alerts (green/yellow/red)
- Expandable conflict details
- Alternative pilot recommendations
- Crew impact projections

### `useLeaveEligibility` Hook

```tsx
import { useLeaveEligibility } from '@/hooks/useLeaveEligibility';

const { eligibility, isLoading, checkEligibility } = useLeaveEligibility();

await checkEligibility({
  pilotId: 'uuid',
  pilotRole: 'Captain',
  startDate: '2025-12-20',
  endDate: '2025-12-30',
});
```

## Business Rules

### Minimum Crew Requirements

- **Per Aircraft**: 7 Captains + 7 First Officers
- **Total Fleet** (2 aircraft): 14 Captains + 14 First Officers
- **Safety Margin**: System warns even if just at minimum

### Leave Request Priority

1. **Seniority Number**: Lower number = higher priority (1 = most senior)
2. **Request Date**: Earlier requests get preference
3. **Request Type**: Emergency > Annual > RDO

### Conflict Resolution

**CRITICAL Conflicts** (Immediate Deny):

- Falls below minimum per-aircraft requirement (< 7 Captains or < 7 First Officers)
- Multiple days with severe shortages

**WARNING Conflicts** (Review Required):

- At or just above minimum fleet requirement
- Single day concerns
- Junior pilot requesting during peak leave period

**APPROVED** (No Conflicts):

- Adequate crew margin maintained
- No overlapping critical roles

## Testing the System

### Test Scenario 1: Normal Approval

```bash
# Test with a Captain who won't create conflicts
curl -X POST http://localhost:3000/api/leave-eligibility/check \
  -H "Content-Type: application/json" \
  -d '{
    "pilotId": "[junior-captain-id]",
    "pilotRole": "Captain",
    "startDate": "2026-03-01",
    "endDate": "2026-03-07",
    "requestType": "ANNUAL"
  }'
```

**Expected**: `recommendation: "APPROVE"`

### Test Scenario 2: Critical Shortage

```bash
# Test with First Officer during high leave period
curl -X POST http://localhost:3000/api/leave-eligibility/check \
  -H "Content-Type: application/json" \
  -d '{
    "pilotId": "[first-officer-id]",
    "pilotRole": "First Officer",
    "startDate": "2025-12-23",
    "endDate": "2026-01-02",
    "requestType": "ANNUAL"
  }'
```

**Expected**: `recommendation: "DENY"` (only 7 FOs total, already 4 pending requests)

### Test Scenario 3: Seniority Recommendations

Check alternative pilots sorted by seniority:

```bash
curl 'http://localhost:3000/api/leave-eligibility?action=availability&startDate=2025-12-20&endDate=2025-12-30'
```

Returns crew availability day-by-day.

## Usage in UI

### Leave Review Modal

The `LeaveRequestReviewModal` component now automatically:

1. Fetches pilot role when modal opens
2. Checks leave eligibility against current crew status
3. Displays color-coded alerts
4. Shows alternative pilot recommendations
5. Provides detailed conflict analysis

### Approval Workflow

1. Manager opens leave request for review
2. System automatically checks eligibility
3. Alert appears with recommendation:
   - ✅ Green: Safe to approve
   - ⚠️ Yellow: Review recommended, shows concerns
   - ❌ Red: Deny recommended, critical shortage
4. Manager reviews alternative pilots by seniority
5. Manager makes informed decision with comments

## Database Queries

### Get Current Crew Count by Role

```sql
SELECT role, COUNT(*) as count
FROM pilots
WHERE is_active = true
GROUP BY role;
```

### Get Conflicting Leave Requests

```sql
SELECT lr.*, p.first_name, p.last_name, p.role, p.seniority_number
FROM leave_requests lr
JOIN pilots p ON lr.pilot_id = p.id
WHERE lr.status IN ('APPROVED', 'PENDING')
  AND lr.start_date <= '2025-12-30'
  AND lr.end_date >= '2025-12-20'
ORDER BY p.seniority_number ASC;
```

### Get Pilots by Seniority

```sql
SELECT id, first_name, last_name, employee_id, role, seniority_number
FROM pilots
WHERE is_active = true AND role = 'Captain'
ORDER BY seniority_number ASC NULLS LAST;
```

## Troubleshooting

### Issue: All requests showing as "DENY"

**Cause**: Minimum crew requirements may be incorrectly configured or total pilots below minimum.

**Solution**: Check `settings.pilot_requirements` and verify total active pilots meet requirements.

### Issue: Alternative pilots not showing

**Cause**: Pilots may not have seniority numbers assigned.

**Solution**: Run seniority migration:

```bash
node run-seniority-migration.js
```

### Issue: Eligibility not updating

**Cause**: React hook may not be re-fetching on prop changes.

**Solution**: Ensure `autoCheck` is enabled or call `checkEligibility()` manually.

## Future Enhancements

1. **Email Notifications**: Alert senior pilots when junior requests conflict
2. **Automatic Approval**: Auto-approve if seniority #1-5 and no conflicts
3. **Leave Forecasting**: Predict crew shortages 60-90 days ahead
4. **Training Integration**: Consider training captains vs line captains
5. **Contract Type Logic**: Different rules for commuting vs fulltime pilots

## Deployment Checklist

- [ ] Verify settings contain `pilot_requirements` with correct values
- [ ] Ensure all pilots have `seniority_number` assigned
- [ ] Test with real pending leave requests
- [ ] Verify minimum crew requirements match operational needs
- [ ] Train managers on new eligibility alerts
- [ ] Document approval override process for emergencies

## Support

For questions or issues:

- Check logs: `npm run dev` console output
- Test API endpoints directly using curl
- Verify database settings and pilot data
- Review `leave-eligibility-service.ts` business logic

---

**Air Niugini B767 Pilot Management System**
Leave Eligibility System v1.0
Implemented: 2025-10-03
