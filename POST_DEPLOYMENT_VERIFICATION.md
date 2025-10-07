# Post-Deployment Verification Plan

**Deployment Date**: October 6, 2025
**Production URL**: https://www.pxb767office.app
**Vercel URL**: https://air-niugini-forr00413-rondeaumaurice-5086s-projects.vercel.app

---

## Verification Checklist

### 1. Custom Domain & Redirect Configuration ✅

**Test 1.1: Custom Domain Access**

- [ ] Visit https://www.pxb767office.app
- [ ] Verify site loads correctly
- [ ] Check SSL certificate is valid (green padlock)

**Test 1.2: Vercel Domain Redirect**

- [ ] Visit https://air-niugini-forr00413-rondeaumaurice-5086s-projects.vercel.app
- [ ] Verify automatic redirect to https://www.pxb767office.app
- [ ] Confirm redirect is permanent (308 status)

**Expected Result**: All \*.vercel.app URLs automatically redirect to www.pxb767office.app

---

### 2. Roster Planning Module Verification ✅

**Test 2.1: Navigation**

- [ ] Log in with admin credentials
- [ ] Navigate: Dashboard → Leave → Roster Planning
- [ ] Verify menu description shows "Future roster planning"

**Test 2.2: Page Title**

- [ ] Confirm page header shows "Roster Planning" (NOT "Roster Leave Planning")
- [ ] Verify browser title is correct

**Test 2.3: Table Display**

- [ ] Select "Next Roster Period" from dropdown
- [ ] Verify table displays with all columns:
  - Pilot Name
  - Employee ID
  - Dates
  - Days
  - Leave Type (should show "RDO Request", "SDO Request", "Annual Leave", etc.)
  - Status
  - **Requested** (NEW - should show formatted date)
  - Method
  - Reason
- [ ] Verify "Requested" column shows dates in format "dd MMM yyyy" (e.g., "06 Oct 2025")
- [ ] Confirm leave types display user-friendly labels:
  - "RDO Request" (not just "RDO")
  - "SDO Request" (not just "SDO")
  - "Annual Leave" (not "ANNUAL")
  - "Sick Leave" (not "SICK")

**Test 2.4: PDF Generation**

- [ ] Click "Generate PDF Report" button
- [ ] Verify PDF generates successfully
- [ ] Open generated PDF and verify:
  - **Title**: "Roster Planning Report" (NOT "Roster Leave Planning Report")
  - **Leave Types**: Show "RDO Request", "SDO Request", etc.
  - **Requested Column**: Present and showing formatted dates
  - **Filename**: `Air_Niugini_Roster_Planning_[roster]_[date].pdf`
- [ ] Verify PDF content matches table data

---

### 3. Safari Download Alert Fix ✅

**Test 3.1: PDF Download in Safari**

- [ ] Use Safari browser on macOS
- [ ] Navigate to Roster Planning page
- [ ] Generate and download PDF report
- [ ] **CHECK DOWNLOAD PERMISSION DIALOG**:
  - [ ] Verify ONLY shows `www.pxb767office.app`
  - [ ] Confirm NO reference to "vercel.com" anywhere
  - [ ] Confirm NO reference to "vercel.app" anywhere

**Test 3.2: Other Safari Downloads**

- [ ] Test PDF download from Reports page
- [ ] Verify all download dialogs show only custom domain

**Expected Result**: Safari download permissions ONLY mention www.pxb767office.app (vercel.com removed)

---

### 4. General Functionality Testing ✅

**Test 4.1: Authentication**

- [ ] Test login with admin credentials
- [ ] Test login with manager credentials
- [ ] Verify logout functionality
- [ ] Test protected route access (should redirect to login)

**Test 4.2: Dashboard**

- [ ] Navigate to main dashboard
- [ ] Verify all stat cards display correctly:
  - Total Pilots
  - Active Certifications
  - Expiring Soon
  - Current Compliance
- [ ] Check charts render properly
- [ ] Verify recent activity feed loads

**Test 4.3: Pilot Management**

- [ ] Navigate to Pilots page
- [ ] Verify pilot list displays (27 pilots)
- [ ] Test search functionality
- [ ] Test filtering by rank
- [ ] Open a pilot detail page
- [ ] Verify all pilot information displays correctly

**Test 4.4: Certification Calendar**

- [ ] Navigate to Certifications → Calendar
- [ ] Verify calendar displays
- [ ] Check color coding:
  - Red: Expired
  - Yellow: Expiring Soon (≤30 days)
  - Green: Current
- [ ] Test month navigation
- [ ] Click on a certification to view details

**Test 4.5: Leave Management**

- [ ] Navigate to Leave Management page
- [ ] Verify leave requests display
- [ ] Test roster period filtering (All/Next/Following)
- [ ] Check Final Review Alert:
  - Should ONLY show when pendingCount > 0
  - Should show correct severity (urgent/warning/info)
- [ ] Check Seniority Priority Review:
  - Should show when 2+ pilots of same rank request overlapping dates
  - Verify border color (green/yellow/red)
  - Confirm seniority comparison displays
- [ ] Test leave request submission (if admin)

**Test 4.6: Reports**

- [ ] Navigate to Reports page
- [ ] Generate Certification Expiry Report
- [ ] Generate Roster Leave Report (from Roster Planning)
- [ ] Verify both PDFs download correctly
- [ ] Verify filenames are correct

---

### 5. Performance & PWA Testing ✅

**Test 5.1: Page Load Performance**

- [ ] Open Chrome DevTools → Network tab
- [ ] Navigate to Dashboard
- [ ] Check initial load time (should be <3 seconds)
- [ ] Verify JavaScript bundle sizes are optimized
- [ ] Check for any failed network requests

**Test 5.2: PWA Installation**

- [ ] Open in Chrome/Edge
- [ ] Look for "Install App" prompt in address bar
- [ ] Install PWA
- [ ] Launch from installed app
- [ ] Verify works as standalone app

**Test 5.3: Offline Functionality**

- [ ] Open application
- [ ] Open Chrome DevTools → Network tab
- [ ] Set throttling to "Offline"
- [ ] Navigate to different pages
- [ ] Verify offline page displays
- [ ] Verify cached pages still work
- [ ] Restore network connection
- [ ] Verify app reconnects properly

**Test 5.4: Service Worker**

- [ ] Open Chrome DevTools → Application tab
- [ ] Navigate to Service Workers section
- [ ] Verify service worker is registered and active
- [ ] Check Cache Storage shows cached assets

---

### 6. Cross-Browser Testing ✅

**Test 6.1: Safari (macOS)**

- [ ] Login functionality
- [ ] Dashboard displays correctly
- [ ] PDF downloads (critical - check download alerts)
- [ ] Leave calendar renders
- [ ] Charts display properly

**Test 6.2: Chrome**

- [ ] All functionality from Safari tests
- [ ] PWA installation prompt appears
- [ ] Service worker registers correctly

**Test 6.3: Firefox**

- [ ] Authentication works
- [ ] Dashboard and charts render
- [ ] PDF generation works
- [ ] No console errors

**Test 6.4: Mobile Safari (iOS)**

- [ ] Responsive layout works
- [ ] Navigation menu functions
- [ ] Touch interactions work
- [ ] PDF downloads work

**Test 6.5: Mobile Chrome (Android)**

- [ ] All mobile Safari tests
- [ ] PWA installation works
- [ ] Add to homescreen functionality

---

### 7. Database & API Testing ✅

**Test 7.1: Data Integrity**

- [ ] Verify pilot count (should be 27)
- [ ] Check certification count (should be 571)
- [ ] Verify check types (should be 34)
- [ ] Confirm leave requests display correctly

**Test 7.2: API Endpoints**

- [ ] Open Chrome DevTools → Network tab
- [ ] Navigate through application
- [ ] Verify API calls return 200 status
- [ ] Check for any 401 (unauthorized) errors during normal use
- [ ] Verify no 500 (server) errors

**Test 7.3: Real-time Updates**

- [ ] Open application in two browser windows
- [ ] Make a change in one window (e.g., approve leave request)
- [ ] Verify change appears in second window after refresh

---

### 8. Security Testing ✅

**Test 8.1: Authentication Protection**

- [ ] Open incognito/private window
- [ ] Try to access https://www.pxb767office.app/dashboard
- [ ] Verify redirect to login page
- [ ] Try to access API endpoints directly without token
- [ ] Verify 401 unauthorized response

**Test 8.2: Role-Based Access**

- [ ] Login as manager
- [ ] Verify cannot access admin-only features (create pilot, delete)
- [ ] Verify can access manager features (approve leave)
- [ ] Login as admin
- [ ] Verify full access to all features

**Test 8.3: RLS Policies**

- [ ] Check browser console for any RLS policy violations
- [ ] Verify users can only see appropriate data
- [ ] Confirm no sensitive data exposed in network responses

---

### 9. Error Handling ✅

**Test 9.1: Network Errors**

- [ ] Simulate network failure during form submission
- [ ] Verify appropriate error message displays
- [ ] Confirm form data preserved (not lost)
- [ ] Verify retry mechanism works

**Test 9.2: Form Validation**

- [ ] Test empty form submission
- [ ] Verify validation messages display
- [ ] Test invalid date formats
- [ ] Test duplicate employee ID
- [ ] Verify all validation rules enforced

**Test 9.3: 404 Handling**

- [ ] Navigate to non-existent page (e.g., /dashboard/fake-page)
- [ ] Verify custom 404 page displays
- [ ] Verify navigation back to valid pages works

---

### 10. Monitoring & Logging ✅

**Test 10.1: Vercel Logs**

- [ ] Open Vercel Dashboard
- [ ] Navigate to Logs section
- [ ] Verify no errors during normal operation
- [ ] Check for any warning messages
- [ ] Monitor function execution times

**Test 10.2: Console Errors**

- [ ] Open browser console on all major pages
- [ ] Verify no JavaScript errors
- [ ] Check for any React warnings
- [ ] Confirm no CORS errors

**Test 10.3: Performance Metrics**

- [ ] Open Vercel Analytics
- [ ] Check Core Web Vitals:
  - LCP (Largest Contentful Paint) - should be <2.5s
  - FID (First Input Delay) - should be <100ms
  - CLS (Cumulative Layout Shift) - should be <0.1
- [ ] Verify no performance regressions

---

## Critical Test Results

### ✅ PASSED

- [ ] Custom domain accessible
- [ ] Vercel redirect working
- [ ] Roster Planning title updated
- [ ] Leave type labels correct (RDO Request, SDO Request)
- [ ] Requested column present and functional
- [ ] PDF filename correct (Air*Niugini_Roster_Planning*\*)
- [ ] Safari download alerts show only custom domain (NO vercel.com)
- [ ] All core functionality working

### ⚠️ WARNINGS (Non-Critical)

- [ ] Note any warnings here
- [ ] 105 TypeScript errors (known, non-blocking)
- [ ] Build-time 401 errors for auth routes (expected)

### ❌ FAILURES (Must Fix)

- [ ] List any failures here
- [ ] None expected

---

## Automated Testing Script

You can run automated tests using Playwright:

```bash
# Run all E2E tests
npx playwright test

# Run specific verification tests
npx playwright test test-login.spec.js
npx playwright test test-roster-planning.spec.js

# Run with browser visible
npx playwright test --headed

# Generate HTML report
npx playwright test --reporter=html
npx playwright show-report
```

---

## Sign-Off

**Verified By**: **\*\*\*\***\_**\*\*\*\***
**Date**: **\*\*\*\***\_**\*\*\*\***
**Time**: **\*\*\*\***\_**\*\*\*\***

**Deployment Status**:

- [ ] ✅ All tests passed - Production approved
- [ ] ⚠️ Minor issues found - Production approved with notes
- [ ] ❌ Critical issues found - Rollback required

**Notes**:

---

---

---

---

**Air Niugini B767 Pilot Management System**
_Post-Deployment Verification Checklist_
_Deployment: October 6, 2025_
