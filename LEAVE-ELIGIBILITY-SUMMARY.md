# Leave Eligibility System - Implementation Summary

## ✅ Complete Implementation

A comprehensive leave eligibility system has been successfully implemented to ensure minimum crew requirements are maintained at all times while managing RDO and leave requests.

## 🎯 What Was Implemented

### 1. **Crew Availability Checking Service**

**File**: `src/lib/leave-eligibility-service.ts`

- **Real-time crew counting**: Calculates available Captains and First Officers for any date range
- **Minimum requirements validation**: Checks against settings (14 Captains, 14 First Officers for 2 aircraft)
- **Conflict detection**: Identifies dates that would violate minimum crew levels
- **Severity classification**:
  - `CRITICAL` - Below per-aircraft minimum (< 7 Captains or < 7 First Officers)
  - `WARNING` - At or just above fleet minimum
  - `INFO` - Adequate margin maintained

### 2. **Seniority-Based Recommendation Logic**

**Features**:

- Fetches all pilots of same role sorted by seniority number
- Shows current leave status for each alternative pilot
- Priority ranking based on seniority (1 = most senior)
- Provides reasoning for each recommendation

**Example Output**:

```
#1 - JOHN SMITH (Captain, Seniority #3) - Available for duty
#2 - CRAIG LILLEY (Captain, Seniority #5) - Currently on approved leave
#3 - DAVID JONES (Captain, Seniority #8) - Has pending leave request
```

### 3. **API Endpoints**

**File**: `src/app/api/leave-eligibility/route.ts`

#### Check Single Request

```bash
POST /api/leave-eligibility/check
{
  "pilotId": "uuid",
  "pilotRole": "Captain",
  "startDate": "2025-12-20",
  "endDate": "2025-12-30",
  "requestType": "ANNUAL"
}
```

#### Get Crew Availability

```bash
GET /api/leave-eligibility?action=availability&startDate=2025-12-20&endDate=2025-12-30
```

#### Bulk Check for Roster Period

```bash
GET /api/leave-eligibility?action=bulk&rosterPeriod=RP14/2025
```

#### Get Crew Requirements

```bash
GET /api/leave-eligibility?action=requirements
# Returns: {"minimumCaptains": 14, "minimumFirstOfficers": 14, ...}
```

### 4. **React UI Components**

#### LeaveEligibilityAlert Component

**File**: `src/components/leave/LeaveEligibilityAlert.tsx`

**Features**:

- Color-coded alerts (green = approve, yellow = review, red = deny)
- Expandable conflict details section
- Alternative pilots list with seniority rankings
- Crew impact projections
- Responsive design with Air Niugini branding

#### useLeaveEligibility Hook

**File**: `src/hooks/useLeaveEligibility.ts`

```tsx
const { eligibility, isLoading, checkEligibility } = useLeaveEligibility();

await checkEligibility({
  pilotId: '...',
  pilotRole: 'Captain',
  startDate: '2025-12-20',
  endDate: '2025-12-30',
});
```

### 5. **Enhanced Leave Review Modal**

**File**: `src/components/leave/LeaveRequestReviewModal.tsx`

**Updates**:

- Automatic eligibility checking when modal opens
- Fetches pilot role from database
- Displays real-time crew availability warnings
- Shows seniority-based alternative pilot recommendations
- Helps managers make informed approval decisions

## 📊 Business Rules Implemented

### Minimum Crew Requirements

- **Per Hull**: 7 Captains + 7 First Officers
- **Fleet Total** (2 aircraft): 14 Captains + 14 First Officers
- **Configuration**: Stored in `settings.pilot_requirements`

### Current Fleet Status

```sql
Captains: 19 (5 above minimum)
First Officers: 7 (7 BELOW minimum!) ⚠️
```

**CRITICAL NOTE**: The system currently has ZERO margin for First Officer leave. Any FO leave request will trigger warnings.

### Leave Request Evaluation

The system evaluates requests against:

1. **All APPROVED leave** - Already confirmed absences
2. **All PENDING leave** - Requests awaiting decision
3. **Minimum requirements** - Per settings configuration

### Recommendation Logic

```
if (no conflicts):
  recommendation = APPROVE
  reasons = ["✅ No conflicts with minimum crew requirements"]

elif (critical conflicts):
  recommendation = DENY
  reasons = ["❌ Critical crew shortage - fleet operations would be impacted"]

else:
  recommendation = REVIEW_REQUIRED
  reasons = ["⚠️ Potential crew shortage - management review recommended"]
```

## 🎨 User Interface Features

### Review Modal Enhancements

When a manager reviews a leave request, they now see:

1. **Eligibility Alert Box** (color-coded):
   - Green = Safe to approve
   - Yellow = Review required, potential concerns
   - Red = Recommend deny, critical shortage

2. **Detailed Reasons**:
   - Clear explanations of conflicts
   - Number of affected dates
   - Projected crew availability after approval

3. **Conflict Details** (expandable):
   - Date-by-date breakdown
   - Captain and First Officer counts
   - Shortfall calculations

4. **Alternative Pilots** (expandable):
   - Sorted by seniority number
   - Shows current leave status
   - Indicates availability

5. **Crew Impact Summary**:
   - Date range affected
   - Total days impacted
   - Projected availability numbers

## 📝 How It Works

### Workflow Example

1. **Manager opens leave request** for review (e.g., Captain CRAIG LILLEY, Dec 20-30)

2. **System automatically**:
   - Fetches pilot's role from database
   - Calculates crew availability for Dec 20-30
   - Checks against minimum requirements (14 Captains, 14 First Officers)
   - Counts existing approved/pending leave for same period
   - Identifies any conflicting dates

3. **Eligibility check results**:

   ```
   Available Captains: 18 → 17 (after approval)
   Available First Officers: 7 → 7 (unchanged)
   Minimum Required: 14 Captains, 14 First Officers

   Result: ✅ APPROVE
   Reason: "No conflicts with minimum crew requirements"
   ```

4. **Manager sees**:
   - Green alert box: "Approved - Crew Requirements Met"
   - Available crew after approval: 17 Captains, 7 First Officers
   - Alternative pilots (if needed): List of 18 other Captains by seniority

5. **Manager makes decision** with full context

### Conflict Scenario Example

If requesting First Officer during high-leave period:

```
Current Available FOs: 7
After Approval: 6
Minimum Required: 14

Result: ❌ DENY
Reason: "Critical crew shortage - fleet operations would be impacted"
Conflicts: 10 critical conflict(s) detected
Affected Dates: 2025-12-23, 2025-12-24, 2025-12-25, ... +7 more
```

## 🔧 Configuration

### Settings Table Structure

```sql
{
  "key": "pilot_requirements",
  "value": {
    "minimum_captains_per_hull": 7,
    "minimum_first_officers_per_hull": 7,
    "number_of_aircraft": 2,
    "captains_per_hull": 7,
    "first_officers_per_hull": 7
  }
}
```

### Seniority Numbers

All active pilots must have `seniority_number` assigned:

```sql
UPDATE pilots
SET seniority_number = [rank based on commencement_date]
WHERE is_active = true;
```

Run migration if needed:

```bash
node run-seniority-migration.js
```

## 🧪 Testing

### Test API Locally

```bash
# Get crew requirements
curl http://localhost:3000/api/leave-eligibility?action=requirements

# Check eligibility
curl -X POST http://localhost:3000/api/leave-eligibility/check \
  -H 'Content-Type: application/json' \
  -d '{
    "pilotId": "b6c7b1ee-1d3e-437d-8390-e8a403b07419",
    "pilotRole": "Captain",
    "startDate": "2025-10-20",
    "endDate": "2025-10-29"
  }'
```

### Test in UI

1. Navigate to **Leave Management** page
2. Select a **PENDING** leave request
3. Click **Review** button
4. Observe the **eligibility alert** appears automatically
5. Check:
   - Alert color matches recommendation
   - Conflicts are detailed
   - Alternative pilots are shown by seniority
   - Crew impact is calculated correctly

## 📚 Documentation

Complete implementation guide: **LEAVE_ELIGIBILITY_GUIDE.md**

Includes:

- Detailed API documentation
- Business rules and logic
- Configuration instructions
- Troubleshooting guide
- Testing procedures
- Future enhancement ideas

## ⚠️ Known Issues & Limitations

### Critical Issue: Insufficient First Officers

**Problem**: System requires 14 First Officers (7 per hull × 2 aircraft) but only has 7 total.

**Impact**: ANY First Officer leave request will trigger critical warnings because the fleet is already below minimum requirements.

**Solutions**:

1. **Immediate**: Adjust settings to reflect actual operational minimums
2. **Short-term**: Hire/promote more First Officers
3. **Alternative**: Reduce number_of_aircraft to 1 in settings (if only 1 aircraft operational)

### Recommended Settings Update

```sql
UPDATE settings
SET value = jsonb_set(value, '{minimum_first_officers_per_hull}', '3')
WHERE key = 'pilot_requirements';
-- This would set fleet minimum to 6 First Officers (3 per hull × 2 aircraft)
```

## 🚀 Future Enhancements

Potential improvements:

1. **Email Notifications**: Alert senior pilots when conflicts detected
2. **Automatic Approvals**: Auto-approve if seniority #1-5 and no conflicts
3. **Leave Forecasting**: Predict shortages 60-90 days ahead
4. **Training Captain Logic**: Different rules for training vs line captains
5. **Contract Type Consideration**: Commuting vs fulltime pilot availability
6. **Calendar Integration**: Visual calendar showing crew availability

## 📦 Files Changed

### New Files

- `src/lib/leave-eligibility-service.ts` - Core service
- `src/app/api/leave-eligibility/route.ts` - API endpoints
- `src/components/leave/LeaveEligibilityAlert.tsx` - UI alert
- `src/hooks/useLeaveEligibility.ts` - React hook
- `LEAVE_ELIGIBILITY_GUIDE.md` - Complete guide
- `LEAVE-ELIGIBILITY-SUMMARY.md` - This file

### Modified Files

- `src/components/leave/LeaveRequestReviewModal.tsx` - Added eligibility checking
- `src/lib/leave-service.ts` - Enhanced with eligibility types

## ✅ Deployment Status

**Status**: ✅ DEPLOYED TO PRODUCTION

**Deployed**: 2025-10-03
**Commit**: `95d4a9e` feat: implement leave eligibility system
**Branch**: `main`
**Vercel**: Automatic deployment triggered

## 🎓 Training Notes for Managers

When reviewing leave requests, you will now see:

1. **Color-coded alerts**:
   - 🟢 Green = Safe to approve (no conflicts)
   - 🟡 Yellow = Review carefully (potential shortage)
   - 🔴 Red = Consider denying (critical shortage)

2. **Key information to check**:
   - Number of conflicts detected
   - Affected dates list
   - Alternative pilots available (by seniority)
   - Projected crew availability after approval

3. **Decision guidelines**:
   - ✅ Green alerts → Usually safe to approve
   - ⚠️ Yellow alerts → Review alternative pilots, consider seniority
   - ❌ Red alerts → Strong recommendation to deny unless emergency

4. **Override capability**:
   - Managers can still approve RED-flagged requests
   - Use review comments to document override reason
   - System provides warnings but does not block approvals

## 📞 Support

For questions or issues:

- Check `LEAVE_ELIGIBILITY_GUIDE.md` for detailed documentation
- Review API endpoint examples in this summary
- Test locally using curl commands provided above
- Verify settings table has correct minimum requirements

---

**Air Niugini B767 Pilot Management System**
Leave Eligibility System v1.0
Implemented: 2025-10-03
Status: Production Ready ✅
