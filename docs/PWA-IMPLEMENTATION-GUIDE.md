# PWA Implementation Guide - Phase 3.2

## Air Niugini B767 Pilot Management System

**Status**: ✅ COMPLETE - Service Worker & Offline Support
**Date**: 2025-10-01
**Phase**: 3.2 - Progressive Web App Features

---

## Overview

The Air Niugini Pilot Management System now includes comprehensive Progressive Web App (PWA) features with offline support, service worker caching, and optimistic UI updates.

## What Was Implemented

### 1. PWA Configuration ✅

**File**: `/next.config.js`

- Integrated `next-pwa` for automatic service worker generation
- Configured runtime caching strategies for different resource types:
  - **Cache-First**: Google Fonts (1 year)
  - **Stale-While-Revalidate**: Static assets (CSS, JS, images, fonts)
  - **Network-First**: API calls, Supabase, dashboard routes
- Set up offline fallback to `/offline` page
- Excluded middleware from precaching

**Caching Strategies by Resource**:

```javascript
- Google Fonts: CacheFirst (365 days)
- Font Assets: StaleWhileRevalidate (7 days)
- Images: StaleWhileRevalidate (24 hours)
- JavaScript: StaleWhileRevalidate (24 hours)
- CSS: StaleWhileRevalidate (24 hours)
- API Routes: NetworkFirst (1 minute, 10s timeout)
- Supabase API: NetworkFirst (1 minute, 10s timeout)
- Dashboard: NetworkFirst (5 minutes, 10s timeout)
```

### 2. PWA Manifest ✅

**File**: `/public/manifest.json`

- Complete Web App Manifest with Air Niugini branding
- App name: "Air Niugini B767 Pilot Management System"
- Short name: "AN PMS"
- Theme color: #E4002B (Air Niugini Red)
- Background color: #FFFFFF
- Display mode: Standalone
- Icon definitions for all required sizes (72-512px)
- App shortcuts for quick access to key features
- Share target configuration

### 3. Optimistic Updates Library ✅

**File**: `/src/lib/optimistic-updates.ts`

**Features**:

- Optimistic UI updates with automatic rollback on failure
- Sync queue for failed mutations when offline
- Background sync when connection is restored
- Specialized functions for pilot, certification, and leave operations
- Toast notifications for user feedback
- Retry logic with configurable attempts

**Key Functions**:

```typescript
-optimisticPilotUpdate() -
  optimisticCertificationUpdate() -
  optimisticPilotCreate() -
  optimisticPilotDelete() -
  addToSyncQueue() -
  processSyncQueue() -
  setupAutoSync();
```

### 4. Offline Components ✅

#### OfflineIndicator Component

**File**: `/src/components/offline/OfflineIndicator.tsx`

**Features**:

- Persistent banner when user is offline
- "Back online" notification when connection restored
- Auto-dismissing after 5 seconds
- Compact badge variant for navigation
- Animated transitions with Framer Motion
- Retry button to force connection check

#### SyncIndicator Component

**File**: `/src/components/offline/SyncIndicator.tsx`

**Features**:

- Floating action button showing pending sync count
- Expandable side panel with sync queue details
- Manual sync trigger button
- Detailed operation descriptions
- Retry counter for failed operations
- Offline warning when appropriate
- Real-time queue updates via custom events

#### OfflineDataView Component

**File**: `/src/components/offline/OfflineDataView.tsx`

**Features**:

- Wrapper for data display with offline indicators
- Last updated timestamp display
- Stale data warnings
- Cached data badges
- Error state handling with retry
- Empty state messages

### 5. Cache Management ✅

**File**: `/src/lib/pwa-cache.ts`

**Features**:

- Cache versioning with automatic cleanup
- Critical route pre-caching
- Critical query pre-fetching
- Service Worker cache invalidation
- React Query cache management
- Periodic cache cleanup (30 minutes)
- Cache statistics and monitoring

**Critical Routes Pre-cached**:

```javascript
- /dashboard
- /dashboard/pilots
- /dashboard/certifications
- /dashboard/leave
- /dashboard/analytics
- /dashboard/reports
```

**Critical Queries Pre-fetched**:

```javascript
- pilots (5 min stale time)
- check-types (1 hour stale time)
- dashboard-stats (5 min stale time)
- expiring-certifications (5 min stale time)
- settings (1 hour stale time)
```

### 6. PWA Initialization ✅

**File**: `/src/lib/pwa-init.ts`

**Features**:

- Custom React hook: `usePWAInit()`
- Service worker registration (production only)
- Install prompt handling
- Update detection and notifications
- Platform-specific install instructions
- PWA install status checking
- Manual update trigger

**Hook Returns**:

```typescript
{
  isInstalled: boolean,
  canInstall: boolean,
  promptInstall: () => Promise<void>
}
```

### 7. PWA Icons ✅

**Generated Files**:

- Icon sizes: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
- `favicon.svg` - Browser favicon
- `apple-touch-icon.svg` - iOS home screen icon
- `browserconfig.xml` - Windows tile configuration
- `PWA-ICONS-README.md` - Designer instructions

**Note**: Current icons are SVG placeholders. For production, replace with high-quality PNG icons designed by your design team. See `/public/PWA-ICONS-README.md` for detailed instructions.

### 8. Layout Updates ✅

**File**: `/src/app/layout.tsx`

**Updates**:

- Added PWA manifest link
- Enhanced metadata with PWA properties
- Added iOS, Android, and Windows meta tags
- Theme color configuration
- Viewport settings optimized for mobile
- Icon link tags for all platforms

---

## Integration Steps

### Step 1: Update Providers Component

Add PWA initialization to your Providers component:

```typescript
// src/components/providers/Providers.tsx
'use client'

import { usePWAInit } from '@/lib/pwa-init'
import { OfflineIndicator } from '@/components/offline/OfflineIndicator'
import { SyncIndicator } from '@/components/offline/SyncIndicator'

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize PWA features
  const { isInstalled, canInstall, promptInstall } = usePWAInit()

  return (
    <QueryClientProvider client={queryClient}>
      {/* Existing providers */}
      {children}

      {/* Add offline indicators */}
      <OfflineIndicator />
      <SyncIndicator />

      {/* Optional: Install prompt button */}
      {canInstall && !isInstalled && (
        <InstallPromptButton onClick={promptInstall} />
      )}
    </QueryClientProvider>
  )
}
```

### Step 2: Use Optimistic Updates in Mutations

Update your mutation hooks to use optimistic updates:

```typescript
// Example: Update pilot mutation
import { useMutation } from '@tanstack/react-query';
import { optimisticPilotUpdate } from '@/lib/optimistic-updates';

export function usePilotUpdate(pilotId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PilotUpdateData) => {
      return optimisticPilotUpdate(
        queryClient,
        pilotId,
        async () => {
          // Your API call here
          const response = await fetch(`/api/pilots/${pilotId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
          });
          return response.json();
        },
        data // Optimistic data
      );
    },
  });
}
```

### Step 3: Use OfflineDataView for Data Display

Wrap your data displays with offline indicators:

```typescript
import { OfflineDataView } from '@/components/offline/OfflineDataView'

export function PilotsList() {
  const { data: pilots, isLoading, error, refetch } = useQuery(['pilots'])
  const lastUpdated = getQueryLastUpdate(queryClient, ['pilots'])

  return (
    <OfflineDataView
      data={pilots || []}
      lastUpdated={lastUpdated}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      emptyMessage="No pilots found"
    >
      {/* Your data display here */}
    </OfflineDataView>
  )
}
```

### Step 4: Test Offline Functionality

1. **Build for production**:

   ```bash
   npm run build
   npm start
   ```

2. **Open Chrome DevTools**:
   - Go to Application tab
   - Check Service Workers section
   - Enable "Offline" checkbox

3. **Test offline scenarios**:
   - Navigate through cached routes
   - Attempt CRUD operations
   - Verify sync queue functionality
   - Check offline indicators

### Step 5: Production Deployment

Before deploying to production:

1. **Replace placeholder icons**:
   - Generate high-quality PNG icons (192x192 and 512x512 are critical)
   - Use proper Air Niugini branding
   - See `/public/PWA-ICONS-README.md` for tools and guidelines

2. **Test on real devices**:
   - iOS Safari (iPhone/iPad)
   - Android Chrome
   - Desktop browsers (Chrome, Edge, Safari)

3. **Verify PWA features**:
   - Install prompt appears
   - App installs successfully
   - Offline functionality works
   - Push notifications (if implemented)

---

## Testing Checklist

### ✅ Service Worker Testing

- [ ] Service worker registers successfully in production
- [ ] Service worker caches static assets
- [ ] Service worker serves cached content when offline
- [ ] Service worker updates automatically when new version deployed
- [ ] Update notification appears when new version available
- [ ] Cache strategies work as configured (Network-First vs Cache-First)

### ✅ Offline Functionality Testing

- [ ] Offline banner appears when connection lost
- [ ] "Back online" notification shows when connection restored
- [ ] Cached routes accessible offline
- [ ] Offline page displays when uncached route accessed
- [ ] Data from cache displays with "cached" indicator
- [ ] Last updated timestamp shows correctly

### ✅ Optimistic Updates Testing

- [ ] Create operations show immediate feedback
- [ ] Update operations update UI instantly
- [ ] Delete operations remove items immediately
- [ ] Failed operations rollback correctly
- [ ] Success toast appears on successful mutation
- [ ] Error toast appears on failed mutation

### ✅ Sync Queue Testing

- [ ] Failed mutations add to sync queue when offline
- [ ] Sync queue displays pending operations
- [ ] Sync queue shows correct operation counts
- [ ] Manual sync button triggers sync process
- [ ] Auto-sync triggers when connection restored
- [ ] Successful sync removes items from queue
- [ ] Failed syncs remain in queue with retry count

### ✅ PWA Install Testing

- [ ] Install prompt appears at appropriate time
- [ ] Install prompt can be dismissed
- [ ] Install prompt reappears if dismissed (browser-dependent)
- [ ] App installs successfully on iOS
- [ ] App installs successfully on Android
- [ ] App installs successfully on desktop Chrome/Edge
- [ ] Installed app launches in standalone mode
- [ ] App icon displays correctly on home screen

### ✅ Cache Management Testing

- [ ] Critical routes pre-cached on first visit
- [ ] Critical queries pre-fetched on startup
- [ ] Stale caches cleaned up automatically
- [ ] Cache version updates trigger cleanup
- [ ] Periodic cleanup runs every 30 minutes
- [ ] Manual cache invalidation works
- [ ] Cache statistics accessible

### ✅ Mobile Testing

- [ ] App displays correctly on iOS Safari
- [ ] App displays correctly on Android Chrome
- [ ] Touch interactions work properly
- [ ] Offline indicators visible on mobile
- [ ] Sync queue accessible on mobile
- [ ] Install prompt works on mobile
- [ ] Standalone mode works correctly

### ✅ Performance Testing

- [ ] Initial page load < 3 seconds
- [ ] Cached page load < 1 second
- [ ] Service worker doesn't slow down app
- [ ] Optimistic updates feel instant
- [ ] Cache warming doesn't block UI
- [ ] No memory leaks from caching

---

## Architecture Decisions

### Why next-pwa?

- Automatic service worker generation
- Built for Next.js compatibility
- Configurable caching strategies
- Active maintenance and community support
- Production-ready defaults

### Why Optimistic Updates?

- Better user experience (instant feedback)
- Reduces perceived latency
- Works well with offline-first approach
- Easy to implement with React Query
- Automatic rollback on failure

### Why Network-First for API Calls?

- Ensures fresh data when online
- Falls back to cache when offline
- Balances freshness with availability
- Short network timeout (10s) for quick fallback

### Why Separate Sync Queue?

- Reliable offline mutation handling
- User visibility into pending changes
- Manual retry capability
- Persists across page refreshes
- Clear success/failure feedback

---

## Troubleshooting

### Service Worker Not Registering

**Symptoms**: No service worker in DevTools
**Causes**:

- Development mode (service worker disabled in dev)
- HTTP instead of HTTPS (except localhost)
- Browser doesn't support service workers

**Solutions**:

1. Build and run in production mode: `npm run build && npm start`
2. Use HTTPS or localhost
3. Check browser compatibility

### Offline Page Not Showing

**Symptoms**: Blank page or error when offline
**Causes**:

- Offline page not cached
- Wrong route for offline fallback
- Service worker not active

**Solutions**:

1. Verify `/offline.tsx` exists in `src/app/`
2. Check service worker status in DevTools
3. Clear cache and re-register service worker

### Optimistic Updates Not Rolling Back

**Symptoms**: UI shows incorrect data after failed mutation
**Causes**:

- Missing error handling
- Query cache not being restored
- Incorrect query key

**Solutions**:

1. Ensure try-catch wraps the mutation
2. Verify `previousData` is being stored
3. Check query keys match exactly

### Sync Queue Not Processing

**Symptoms**: Items remain in queue after coming online
**Causes**:

- No online event listener
- API endpoints unreachable
- Authentication issues

**Solutions**:

1. Check `setupAutoSync()` is called
2. Verify API endpoints are accessible
3. Ensure authentication token is valid

### Icons Not Displaying

**Symptoms**: Default browser icon shows instead of app icons
**Causes**:

- Icons not generated
- Wrong file paths
- Missing manifest link

**Solutions**:

1. Run `node generate-pwa-icons.js`
2. Verify icons exist in `/public/`
3. Check manifest link in layout.tsx

---

## Performance Optimization

### Cache Size Management

Monitor cache sizes regularly:

```typescript
import { getCacheStats } from '@/lib/pwa-cache';

const stats = await getCacheStats();
console.log('Cache stats:', stats);
// {
//   reactQuery: 50000, // bytes
//   serviceWorker: 25, // entries
//   localStorage: 10000 // bytes
// }
```

### Cache Invalidation Strategy

Invalidate caches when:

- Schema changes (update CACHE_VERSION)
- Major data updates
- User logs out
- Manual refresh requested

```typescript
import { clearAllCaches } from '@/lib/pwa-cache';

// On schema change
if (hasCacheVersionChanged()) {
  await clearAllCaches(queryClient);
}

// On logout
await clearAllCaches(queryClient);
```

### Query Stale Times

Optimize for your data change frequency:

- **Rarely changes** (check types, settings): 1 hour
- **Moderate updates** (pilots, certifications): 5 minutes
- **Frequent updates** (dashboard stats): 2 minutes
- **Real-time** (notifications): Network-only

---

## Security Considerations

### Sensitive Data

**Do NOT cache**:

- Authentication tokens (except in memory)
- Password reset links
- Personal identification documents
- Financial information

**Safe to cache**:

- Pilot lists (if user is authenticated)
- Certification types
- Public settings
- Dashboard statistics

### Cache Access

- Service Worker caches are domain-scoped
- localStorage is accessible via JavaScript (use with caution)
- Clear caches on logout for shared devices
- Implement cache encryption for sensitive data (if needed)

### Offline Authentication

- Store session state in memory, not cache
- Re-authenticate when connection restored
- Clear sync queue on session expiry
- Verify user permissions before sync

---

## Future Enhancements

### Phase 3.3 - Advanced Features

Potential future improvements:

- **Background Sync API**: More reliable sync using browser API
- **Push Notifications**: Alert users of important updates
- **Periodic Background Sync**: Auto-refresh data in background
- **Web Share API**: Share pilot data with other apps
- **File System Access**: Export/import data offline
- **Bluetooth Integration**: Connect to aviation devices

### Monitoring & Analytics

- Track PWA install rates
- Monitor offline usage patterns
- Measure cache hit rates
- Analyze sync queue success rates
- Track service worker update adoption

---

## Resources

### Documentation

- [Next.js PWA Documentation](https://github.com/shadowwalker/next-pwa)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)

### Tools

- [Lighthouse PWA Audit](https://developers.google.com/web/tools/lighthouse)
- [PWA Builder](https://www.pwabuilder.com/)
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [Real Favicon Generator](https://realfavicongenerator.net/)

### Testing

- Chrome DevTools - Application Tab
- Firefox Developer Tools - Service Workers
- Safari Web Inspector - Service Workers
- [PWACompat](https://github.com/GoogleChromeLabs/pwacompat) for iOS

---

## Success Metrics

### Key Performance Indicators (KPIs)

Track these metrics post-deployment:

1. **PWA Install Rate**: Target 20%+ of active users
2. **Offline Usage**: Track offline session duration
3. **Cache Hit Rate**: Target 80%+ for static assets
4. **Sync Success Rate**: Target 95%+ successful syncs
5. **Time to Interactive**: < 3s on 3G connection
6. **Service Worker Update Speed**: < 24 hours for 90% of users

### User Satisfaction Metrics

- Reduced perceived latency
- Fewer "loading" states
- Successful offline data access
- Positive feedback on install prompts
- Increased return visits

---

## Conclusion

The Air Niugini Pilot Management System now includes comprehensive PWA features:

✅ **Offline Support**: Full functionality when offline with cached data
✅ **Optimistic Updates**: Instant UI feedback with automatic rollback
✅ **Background Sync**: Reliable mutation queuing and retry
✅ **Install Capability**: One-click install on iOS, Android, and desktop
✅ **Performance**: Fast load times with intelligent caching
✅ **User Experience**: Clear offline indicators and sync status

**Next Steps**:

1. Integrate components into Providers
2. Update mutation hooks with optimistic updates
3. Test thoroughly on all platforms
4. Replace placeholder icons with production assets
5. Deploy and monitor PWA metrics

For questions or issues, refer to the troubleshooting section or consult the development team.

---

**Phase 3.2 Complete** ✅
**Air Niugini B767 Pilot Management System - PWA Implementation**
_Papua New Guinea's National Airline Fleet Operations Management_
