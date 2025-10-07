# PWA Testing Checklist

## Air Niugini B767 Pilot Management System - Phase 3.2

**Version**: 1.0.0
**Date**: 2025-10-01
**Tester**: **\*\***\_\_\_**\*\***
**Environment**: ☐ Production ☐ Staging ☐ Local

---

## Pre-Testing Setup

### Environment Preparation

- [ ] Build application for production: `npm run build`
- [ ] Start production server: `npm start`
- [ ] Open Chrome DevTools (F12)
- [ ] Navigate to Application tab
- [ ] Clear all existing caches and storage
- [ ] Verify service worker is unregistered

### Test Devices Required

- [ ] Desktop Chrome (latest)
- [ ] Desktop Edge (latest)
- [ ] Desktop Safari (latest)
- [ ] iPhone with Safari (iOS 14+)
- [ ] Android phone with Chrome (Android 10+)
- [ ] iPad with Safari

---

## 1. Service Worker Registration ✅

### Test: Service Worker Installation

**Steps**:

1. Navigate to `http://localhost:3000` (or production URL)
2. Open DevTools > Application > Service Workers
3. Wait 10 seconds

**Expected Results**:

- [ ] Service worker appears in list
- [ ] Status shows "activated and is running"
- [ ] Scope is correct (`/`)
- [ ] No console errors

**Screenshot**: **\*\***\_\_**\*\***

---

## 2. PWA Installation ✅

### Test: Install Prompt - Desktop Chrome

**Steps**:

1. Open app in Chrome
2. Wait for install prompt (or click address bar install button)
3. Click "Install"

**Expected Results**:

- [ ] Install button appears in address bar
- [ ] Toast notification suggests installation
- [ ] Install dialog shows correct app name and icon
- [ ] App installs successfully
- [ ] App launches in standalone window
- [ ] App icon shows in start menu/dock

**Screenshot**: **\*\***\_\_**\*\***

### Test: Install Prompt - iOS Safari

**Steps**:

1. Open app in Safari on iPhone
2. Tap Share button
3. Scroll to "Add to Home Screen"
4. Tap "Add"

**Expected Results**:

- [ ] "Add to Home Screen" option is available
- [ ] Correct app name shows ("Air Niugini PMS")
- [ ] Icon preview shows Air Niugini branding
- [ ] Icon appears on home screen
- [ ] Tapping icon launches in standalone mode
- [ ] Status bar color matches theme (#E4002B)

**Screenshot**: **\*\***\_\_**\*\***

### Test: Install Prompt - Android Chrome

**Steps**:

1. Open app in Chrome on Android
2. Wait for install banner or tap menu
3. Select "Install app" or "Add to Home Screen"
4. Confirm installation

**Expected Results**:

- [ ] Install option available in menu
- [ ] Install banner may appear automatically
- [ ] Correct app name shows
- [ ] Icon shows Air Niugini branding
- [ ] App installs successfully
- [ ] App launches in standalone mode
- [ ] Navigation bar color matches theme

**Screenshot**: **\*\***\_\_**\*\***

---

## 3. Offline Functionality ✅

### Test: Go Offline

**Steps**:

1. Load dashboard while online
2. Enable offline mode (DevTools > Network > Offline)
3. Refresh page

**Expected Results**:

- [ ] Red "You're Offline" banner appears at top
- [ ] Dashboard loads from cache
- [ ] Data displays with "cached" indicator
- [ ] Last updated timestamp shows
- [ ] No JavaScript errors in console

**Screenshot**: **\*\***\_\_**\*\***

### Test: Navigate While Offline

**Steps**:

1. Remain offline
2. Click "Pilots" in navigation
3. Click "Certifications" in navigation
4. Try to access uncached route

**Expected Results**:

- [ ] Cached routes load successfully
- [ ] Offline banner persists
- [ ] Data shows as cached
- [ ] Uncached routes redirect to `/offline` page
- [ ] Offline page displays correctly with branding

**Screenshot**: **\*\***\_\_**\*\***

### Test: Connection Restored

**Steps**:

1. Disable offline mode (DevTools > Network > Online)
2. Wait 2 seconds

**Expected Results**:

- [ ] Red offline banner disappears
- [ ] Green "Back Online" banner appears
- [ ] "Syncing pending changes..." message shows
- [ ] Sync indicator updates
- [ ] Green banner auto-dismisses after 5 seconds
- [ ] Fresh data loads automatically

**Screenshot**: **\*\***\_\_**\*\***

---

## 4. Optimistic Updates ✅

### Test: Create Pilot (Online)

**Steps**:

1. Ensure you're online
2. Navigate to Pilots page
3. Click "Add Pilot"
4. Fill in pilot details
5. Click "Save"

**Expected Results**:

- [ ] Loading toast appears immediately
- [ ] New pilot appears in list instantly
- [ ] Success toast shows after API confirmation
- [ ] Pilot persists after page refresh
- [ ] No visual flicker or rollback

**Screenshot**: **\*\***\_\_**\*\***

### Test: Create Pilot (Offline)

**Steps**:

1. Go offline (DevTools)
2. Navigate to Pilots page
3. Click "Add Pilot"
4. Fill in pilot details
5. Click "Save"
6. Observe behavior

**Expected Results**:

- [ ] Offline banner visible
- [ ] Operation queued for sync
- [ ] Toast shows "Action queued for sync"
- [ ] Sync indicator shows pending count
- [ ] Pilot appears optimistically in UI
- [ ] Sync queue shows the operation

**Screenshot**: **\*\***\_\_**\*\***

### Test: Update Pilot (Online)

**Steps**:

1. Ensure you're online
2. Click on a pilot to edit
3. Change pilot details
4. Click "Save"

**Expected Results**:

- [ ] Loading toast appears
- [ ] Changes appear immediately in UI
- [ ] Success toast after API confirmation
- [ ] Changes persist after refresh
- [ ] No rollback occurs

**Screenshot**: **\*\***\_\_**\*\***

### Test: Update Pilot (Offline → Online)

**Steps**:

1. Go offline
2. Edit a pilot
3. Save changes
4. Go back online
5. Observe sync behavior

**Expected Results**:

- [ ] Changes queue for sync when offline
- [ ] Sync indicator shows pending count
- [ ] Auto-sync triggers when online
- [ ] Success toast after sync completes
- [ ] Changes persist on server
- [ ] Sync queue clears

**Screenshot**: **\*\***\_\_**\*\***

### Test: Failed Update (Rollback)

**Steps**:

1. Enable offline mode
2. Make an edit that will fail (e.g., duplicate ID)
3. Attempt to save
4. Go online to trigger sync

**Expected Results**:

- [ ] Optimistic update shows initially
- [ ] Sync fails when online
- [ ] Error toast appears
- [ ] UI rolls back to previous state
- [ ] Item remains in sync queue with retry count
- [ ] User can retry manually

**Screenshot**: **\*\***\_\_**\*\***

---

## 5. Sync Queue ✅

### Test: View Sync Queue

**Steps**:

1. Go offline
2. Perform 3 different operations (create, update, delete)
3. Click floating sync button (bottom-right)

**Expected Results**:

- [ ] Floating button shows count badge (3)
- [ ] Side panel opens with queue details
- [ ] Each operation shows:
  - Operation type (create/update/delete)
  - Resource type (pilot/certification)
  - Description
  - Timestamp
- [ ] Manual sync button is disabled (offline)

**Screenshot**: **\*\***\_\_**\*\***

### Test: Manual Sync

**Steps**:

1. Go online
2. Open sync queue panel
3. Click "Sync Now" button

**Expected Results**:

- [ ] Button shows "Syncing..." with spinner
- [ ] Progress toast appears
- [ ] Operations process one by one
- [ ] Success toast shows count of synced items
- [ ] Queue empties
- [ ] Floating button disappears
- [ ] Data refreshes automatically

**Screenshot**: **\*\***\_\_**\*\***

### Test: Partial Sync Failure

**Steps**:

1. Create 3 queued operations (offline)
2. Go online
3. Trigger manual sync
4. One operation should fail (simulate with invalid data)

**Expected Results**:

- [ ] Successful operations sync
- [ ] Failed operation remains in queue
- [ ] Retry count increments
- [ ] Error toast shows failed count
- [ ] Success toast shows successful count
- [ ] User can retry failed operations

**Screenshot**: **\*\***\_\_**\*\***

---

## 6. Cache Management ✅

### Test: Cache Warming

**Steps**:

1. Clear all caches
2. Load application for first time
3. Check DevTools > Application > Cache Storage

**Expected Results**:

- [ ] Multiple cache entries created:
  - `api-cache`
  - `dashboard-cache`
  - `static-js-assets`
  - `static-style-assets`
  - `static-image-assets`
  - `static-font-assets`
- [ ] Critical routes pre-cached
- [ ] Console shows "Cache warming completed"

**Screenshot**: **\*\***\_\_**\*\***

### Test: Stale Cache Cleanup

**Steps**:

1. Load application
2. Wait 31 minutes (or modify cleanup interval for testing)
3. Check console logs

**Expected Results**:

- [ ] Console shows "Running periodic cache cleanup..."
- [ ] Old cache versions removed
- [ ] Current cache version retained
- [ ] No errors in console

**Screenshot**: **\*\***\_\_**\*\***

### Test: Cache Version Change

**Steps**:

1. Note current cache version in DevTools
2. Update `CACHE_VERSION` in `/src/lib/pwa-cache.ts`
3. Reload application

**Expected Results**:

- [ ] Console shows "Cache version changed"
- [ ] All old caches cleared
- [ ] New caches created with new version
- [ ] Application works correctly
- [ ] No stale data issues

**Screenshot**: **\*\***\_\_**\*\***

---

## 7. Offline Indicators ✅

### Test: OfflineIndicator Component

**Steps**:

1. Load application online
2. Toggle offline mode
3. Toggle back online

**Expected Results**:

- [ ] No indicator when online (initially)
- [ ] Red banner slides in when offline
- [ ] Banner shows "You're Offline" message
- [ ] "Retry" button is functional
- [ ] Green banner shows when back online
- [ ] Banner auto-dismisses after 5 seconds

**Screenshot**: **\*\***\_\_**\*\***

### Test: OfflineBadge in Navigation

**Steps**:

1. Navigate to dashboard
2. Go offline
3. Check navigation bar

**Expected Results**:

- [ ] Small red badge appears in navigation
- [ ] Badge shows "Offline" text
- [ ] Red dot animates/pulses
- [ ] Badge disappears when back online

**Screenshot**: **\*\***\_\_**\*\***

### Test: OfflineDataView Component

**Steps**:

1. Load pilots page while online
2. Go offline
3. View pilots page

**Expected Results**:

- [ ] Orange "Viewing Cached Data" banner shows
- [ ] Last updated timestamp displays
- [ ] Data displays normally
- [ ] Refresh button available
- [ ] No errors or missing data

**Screenshot**: **\*\***\_\_**\*\***

---

## 8. Mobile Responsiveness ✅

### Test: Mobile Layout - Portrait

**Device**: iPhone/Android
**Steps**:

1. Open app on mobile device (portrait)
2. Navigate through all pages
3. Test offline functionality

**Expected Results**:

- [ ] Layout adapts to mobile screen
- [ ] Offline banner displays correctly
- [ ] Sync button accessible
- [ ] Navigation works smoothly
- [ ] Touch interactions responsive
- [ ] No horizontal scrolling

**Screenshot**: **\*\***\_\_**\*\***

### Test: Mobile Layout - Landscape

**Device**: iPhone/Android
**Steps**:

1. Rotate device to landscape
2. Navigate through pages
3. Test UI components

**Expected Results**:

- [ ] Layout adapts to landscape
- [ ] Components remain accessible
- [ ] No UI elements cut off
- [ ] Sync panel opens correctly
- [ ] Offline indicators visible

**Screenshot**: **\*\***\_\_**\*\***

### Test: Tablet Layout

**Device**: iPad/Android Tablet
**Steps**:

1. Open app on tablet
2. Test both orientations
3. Verify component layouts

**Expected Results**:

- [ ] Desktop-like layout on tablet
- [ ] Components use available space
- [ ] Touch targets appropriately sized
- [ ] All features accessible
- [ ] No layout issues

**Screenshot**: **\*\***\_\_**\*\***

---

## 9. Performance Testing ✅

### Test: Initial Load Time

**Steps**:

1. Clear all caches
2. Open DevTools > Network
3. Enable "Disable cache"
4. Record page load

**Expected Results**:

- [ ] Time to Interactive < 3 seconds
- [ ] First Contentful Paint < 1.5 seconds
- [ ] Largest Contentful Paint < 2.5 seconds
- [ ] No render-blocking resources
- [ ] Lighthouse score > 90

**Metrics**:

- TTI: **\_\_\_** seconds
- FCP: **\_\_\_** seconds
- LCP: **\_\_\_** seconds
- Lighthouse Score: **\_\_\_**

### Test: Cached Load Time

**Steps**:

1. Load page once (warm cache)
2. Reload page
3. Measure load time

**Expected Results**:

- [ ] Page loads from cache < 1 second
- [ ] Service worker serves cached content
- [ ] No flash of unstyled content
- [ ] Smooth transition to content

**Metrics**:

- Cached Load Time: **\_\_\_** seconds

### Test: Memory Usage

**Steps**:

1. Open DevTools > Memory
2. Take heap snapshot
3. Navigate through app
4. Take another snapshot
5. Compare

**Expected Results**:

- [ ] No significant memory leaks
- [ ] Heap size stable
- [ ] Detached DOM nodes < 10
- [ ] Service worker memory reasonable

**Metrics**:

- Initial Heap: **\_\_\_** MB
- After Navigation: **\_\_\_** MB
- Memory Growth: **\_\_\_** MB

---

## 10. Edge Cases & Error Handling ✅

### Test: Rapid Online/Offline Switching

**Steps**:

1. Toggle offline mode rapidly (5+ times)
2. Observe UI behavior

**Expected Results**:

- [ ] No crashes or errors
- [ ] Indicators update correctly
- [ ] No duplicate sync attempts
- [ ] Queue remains consistent

**Screenshot**: **\*\***\_\_**\*\***

### Test: Large Sync Queue

**Steps**:

1. Go offline
2. Create 20+ operations in queue
3. Go online
4. Trigger sync

**Expected Results**:

- [ ] All operations sync successfully
- [ ] Progress updates shown
- [ ] No timeout errors
- [ ] Queue processes completely
- [ ] App remains responsive

**Screenshot**: **\*\***\_\_**\*\***

### Test: Service Worker Update

**Steps**:

1. Deploy new version with updated service worker
2. Open existing tab with old version
3. Wait for update detection

**Expected Results**:

- [ ] Update notification appears
- [ ] User can trigger update
- [ ] New service worker activates
- [ ] Page reloads with new version
- [ ] No data loss

**Screenshot**: **\*\***\_\_**\*\***

### Test: Quota Exceeded

**Steps**:

1. Fill cache to near-quota limit
2. Attempt to cache more data
3. Observe behavior

**Expected Results**:

- [ ] Graceful error handling
- [ ] User notification if needed
- [ ] Oldest caches cleaned up
- [ ] Application continues working

**Screenshot**: **\*\***\_\_**\*\***

---

## 11. Cross-Browser Testing ✅

### Chrome Desktop

- [ ] Service worker registers
- [ ] Install prompt works
- [ ] Offline functionality works
- [ ] Optimistic updates work
- [ ] Sync queue works
- [ ] No console errors

**Version**: **\_\_\_**
**Screenshot**: **\*\***\_\_**\*\***

### Edge Desktop

- [ ] Service worker registers
- [ ] Install prompt works
- [ ] Offline functionality works
- [ ] Optimistic updates work
- [ ] Sync queue works
- [ ] No console errors

**Version**: **\_\_\_**
**Screenshot**: **\*\***\_\_**\*\***

### Safari Desktop

- [ ] Service worker registers (limited support)
- [ ] Basic offline functionality
- [ ] Cache works
- [ ] Graceful degradation for unsupported features

**Version**: **\_\_\_**
**Screenshot**: **\*\***\_\_**\*\***

### Firefox Desktop

- [ ] Service worker registers
- [ ] Offline functionality works
- [ ] Cache works
- [ ] Install options available

**Version**: **\_\_\_**
**Screenshot**: **\*\***\_\_**\*\***

---

## 12. Security Testing ✅

### Test: Sensitive Data Caching

**Steps**:

1. Log in to application
2. Check cache storage in DevTools
3. Inspect cached data

**Expected Results**:

- [ ] No auth tokens in cache
- [ ] No passwords cached
- [ ] Session data not in localStorage
- [ ] Only appropriate data cached

**Screenshot**: **\*\***\_\_**\*\***

### Test: Cache Access After Logout

**Steps**:

1. Log in and use app
2. Log out
3. Check cache state
4. Try to access cached data

**Expected Results**:

- [ ] Sensitive caches cleared on logout
- [ ] Cannot access protected data
- [ ] Redirect to login when appropriate
- [ ] Session invalidated

**Screenshot**: **\*\***\_\_**\*\***

---

## 13. Lighthouse Audit ✅

### PWA Audit

**Steps**:

1. Open DevTools > Lighthouse
2. Select "Progressive Web App" category
3. Run audit

**Expected Results**:

- [ ] PWA score > 90
- [ ] Installable: YES
- [ ] Service worker: YES
- [ ] Offline ready: YES
- [ ] Manifest valid: YES
- [ ] All PWA criteria met

**Score**: **\_\_\_**
**Screenshot**: **\*\***\_\_**\*\***

### Performance Audit

**Expected Results**:

- [ ] Performance score > 90
- [ ] All Core Web Vitals pass
- [ ] No critical issues

**Score**: **\_\_\_**

### Accessibility Audit

**Expected Results**:

- [ ] Accessibility score > 90
- [ ] Offline indicators have proper ARIA
- [ ] Keyboard navigation works

**Score**: **\_\_\_**

---

## Test Results Summary

### Overall Status

**Total Tests**: 50+
**Passed**: **\_\_\_**
**Failed**: **\_\_\_**
**Blocked**: **\_\_\_**
**Pass Rate**: **\_\_\_**%

### Critical Issues Found

1. ***
2. ***
3. ***

### Non-Critical Issues Found

1. ***
2. ***
3. ***

### Recommendations

1. ***
2. ***
3. ***

---

## Sign-Off

**Tester Name**: \***\*\*\*\*\***\_\_\_\***\*\*\*\*\***
**Date**: \***\*\*\*\*\***\_\_\_\***\*\*\*\*\***
**Signature**: \***\*\*\*\*\***\_\_\_\***\*\*\*\*\***

**Approved By**: \***\*\*\*\*\***\_\_\_\***\*\*\*\*\***
**Date**: \***\*\*\*\*\***\_\_\_\***\*\*\*\*\***
**Signature**: \***\*\*\*\*\***\_\_\_\***\*\*\*\*\***

---

## Notes

Additional observations and comments:

---

---

---

---

---

---

**Air Niugini B767 Pilot Management System - Phase 3.2 Testing**
_Papua New Guinea's National Airline Fleet Operations Management_
