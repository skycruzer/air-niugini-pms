# PWA Quick Reference Card

## Air Niugini B767 Pilot Management System

**Quick access guide for common PWA tasks**

---

## Installation & Setup

### Install Dependencies

```bash
# Already installed in package.json
npm install
```

### Generate Icons

```bash
node generate-pwa-icons.js
```

### Build & Run

```bash
# Development (service worker disabled)
npm run dev

# Production (service worker enabled)
npm run build
npm start

# Production with bundle analysis
npm run build:analyze
npm start
```

---

## Core Components

### 1. Initialize PWA in Providers

```typescript
// src/components/providers/Providers.tsx
import { usePWAInit } from '@/lib/pwa-init'
import { OfflineIndicator } from '@/components/offline/OfflineIndicator'
import { SyncIndicator } from '@/components/offline/SyncIndicator'

export function Providers({ children }) {
  const { isInstalled, canInstall, promptInstall } = usePWAInit()

  return (
    <>
      {children}
      <OfflineIndicator />
      <SyncIndicator />
    </>
  )
}
```

### 2. Use Optimistic Updates

```typescript
// In your mutation hook
import { optimisticPilotUpdate } from '@/lib/optimistic-updates';

const mutation = useMutation({
  mutationFn: (data) =>
    optimisticPilotUpdate(
      queryClient,
      pilotId,
      () => apiCall(data),
      data // optimistic data
    ),
});
```

### 3. Wrap Data Display

```typescript
// In your list component
import { OfflineDataView } from '@/components/offline/OfflineDataView'
import { getQueryLastUpdate } from '@/lib/pwa-cache'

<OfflineDataView
  data={pilots}
  lastUpdated={getQueryLastUpdate(queryClient, ['pilots'])}
  isLoading={isLoading}
  error={error}
  onRetry={refetch}
>
  <YourContent />
</OfflineDataView>
```

---

## Available Functions

### Optimistic Updates

```typescript
import {
  optimisticPilotCreate,
  optimisticPilotUpdate,
  optimisticPilotDelete,
  optimisticCertificationUpdate,
  addToSyncQueue,
  processSyncQueue,
  setupAutoSync,
} from '@/lib/optimistic-updates';

// Create
await optimisticPilotCreate(queryClient, createFn, data);

// Update
await optimisticPilotUpdate(queryClient, id, updateFn, data);

// Delete
await optimisticPilotDelete(queryClient, id, deleteFn);

// Manual sync
await processSyncQueue(queryClient);
```

### Cache Management

```typescript
import {
  initializeCacheManagement,
  warmCache,
  clearAllCaches,
  invalidateResource,
  getCacheStats,
  getQueryLastUpdate,
  hasQueryCache,
} from '@/lib/pwa-cache';

// Initialize on startup
await initializeCacheManagement(queryClient);

// Warm cache
await warmCache(queryClient);

// Clear all
await clearAllCaches(queryClient);

// Invalidate specific resource
await invalidateResource(queryClient, 'pilots');

// Get stats
const stats = await getCacheStats();

// Check cache
const hasCache = hasQueryCache(queryClient, ['pilots']);

// Get last update
const lastUpdate = getQueryLastUpdate(queryClient, ['pilots']);
```

### PWA Controls

```typescript
import {
  usePWAInit,
  isPWAInstalled,
  updateServiceWorker,
  unregisterServiceWorker,
  getInstallInstructions,
} from '@/lib/pwa-init';

// Use hook in component
const { isInstalled, canInstall, promptInstall } = usePWAInit();

// Check install status
const installed = isPWAInstalled();

// Force update
await updateServiceWorker();

// Get platform instructions
const instructions = getInstallInstructions();
```

---

## Testing Commands

### Chrome DevTools

```
F12 → Application → Service Workers
F12 → Application → Cache Storage
F12 → Network → Offline checkbox
F12 → Lighthouse → PWA audit
```

### Test Offline

```javascript
// In browser console
navigator.serviceWorker.controller;
navigator.onLine;
caches.keys();
```

### Clear Everything

```javascript
// In browser console
caches.keys().then((names) => {
  names.forEach((name) => caches.delete(name));
});
localStorage.clear();
```

---

## Configuration

### Cache Strategies (next.config.js)

```javascript
// Static assets
handler: 'StaleWhileRevalidate';
maxAgeSeconds: 24 * 60 * 60; // 24 hours

// API calls
handler: 'NetworkFirst';
networkTimeoutSeconds: 10;
maxAgeSeconds: 60; // 1 minute

// Fonts
handler: 'CacheFirst';
maxAgeSeconds: 365 * 24 * 60 * 60; // 1 year
```

### Update Cache Version

```typescript
// src/lib/pwa-cache.ts
export const CACHE_VERSION = 'v1.0.1'; // Increment this
```

### Critical Resources

```typescript
// src/lib/pwa-cache.ts
export const CRITICAL_ROUTES = ['/dashboard', '/dashboard/pilots', '/dashboard/certifications'];

export const CRITICAL_QUERIES = ['pilots', 'check-types', 'dashboard-stats'];
```

---

## Common Patterns

### Pattern 1: Create with Optimistic Update

```typescript
const createPilot = useMutation({
  mutationFn: async (data) => {
    return optimisticPilotCreate(
      queryClient,
      async () => {
        const res = await fetch('/api/pilots', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        return res.json();
      },
      data
    );
  },
});
```

### Pattern 2: Update with Offline Queue

```typescript
const updatePilot = useMutation({
  mutationFn: async ({ id, data }) => {
    return optimisticPilotUpdate(
      queryClient,
      id,
      async () => {
        if (!navigator.onLine) {
          throw new Error('Offline');
        }
        const res = await fetch(`/api/pilots/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
        return res.json();
      },
      data
    );
  },
});
```

### Pattern 3: List with Offline Indicator

```typescript
function PilotsList() {
  const { data, isLoading, error, refetch } = useQuery(['pilots'])
  const lastUpdated = getQueryLastUpdate(queryClient, ['pilots'])

  return (
    <OfflineDataView
      data={data || []}
      lastUpdated={lastUpdated}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
    >
      {data?.map(pilot => <PilotCard key={pilot.id} {...pilot} />)}
    </OfflineDataView>
  )
}
```

---

## Debugging

### Check Service Worker Status

```javascript
// In console
navigator.serviceWorker.getRegistration().then((reg) => {
  console.log('State:', reg.active?.state);
  console.log('Scope:', reg.scope);
});
```

### Check Cache Contents

```javascript
// In console
caches.open('api-cache').then((cache) => {
  cache.keys().then((keys) => {
    console.log(
      'Cached URLs:',
      keys.map((k) => k.url)
    );
  });
});
```

### Check Sync Queue

```javascript
// In console
JSON.parse(localStorage.getItem('an-pms-sync-queue') || '[]');
```

### Force Cache Refresh

```javascript
// In console
caches.keys().then((names) => {
  names.forEach((name) => caches.delete(name));
  window.location.reload();
});
```

---

## Troubleshooting

| Issue                          | Quick Fix                                          |
| ------------------------------ | -------------------------------------------------- |
| Service worker not registering | Build for production: `npm run build && npm start` |
| Offline page not showing       | Check `/src/app/offline.tsx` exists                |
| Icons not displaying           | Run `node generate-pwa-icons.js`                   |
| Optimistic updates not working | Verify query keys match exactly                    |
| Sync queue not processing      | Check `setupAutoSync()` is called                  |
| Stale cache data               | Increment `CACHE_VERSION`                          |

---

## File Locations

```
Configuration:
  /next.config.js                         - PWA config
  /public/manifest.json                   - App manifest

Core Libraries:
  /src/lib/optimistic-updates.ts          - Optimistic UI
  /src/lib/pwa-cache.ts                   - Cache management
  /src/lib/pwa-init.ts                    - PWA initialization

Components:
  /src/components/offline/OfflineIndicator.tsx
  /src/components/offline/SyncIndicator.tsx
  /src/components/offline/OfflineDataView.tsx

Icons:
  /public/icon-*.svg                      - PWA icons
  /public/favicon.svg                     - Favicon
  /generate-pwa-icons.js                  - Icon generator

Documentation:
  /PWA-IMPLEMENTATION-GUIDE.md            - Full guide
  /PWA-TESTING-CHECKLIST.md              - Testing checklist
  /PHASE-3.2-SUMMARY.md                  - Summary
  /PWA-QUICK-REFERENCE.md                - This file
```

---

## Key Metrics to Monitor

| Metric              | Target | Check With          |
| ------------------- | ------ | ------------------- |
| PWA Score           | 90+    | Lighthouse          |
| Install Rate        | 20%+   | Analytics           |
| Cache Hit Rate      | 80%+   | Service worker logs |
| Sync Success        | 95%+   | Sync queue logs     |
| Time to Interactive | <3s    | Lighthouse          |
| Offline Usage       | Track  | Analytics           |

---

## Emergency Commands

### Reset Everything

```bash
# Clear all caches and storage
rm -rf .next
rm -rf node_modules/.cache
npm run build
```

### Unregister Service Worker

```javascript
// In console
navigator.serviceWorker.getRegistrations().then((regs) => {
  regs.forEach((reg) => reg.unregister());
});
```

### Clear Sync Queue

```javascript
// In console
localStorage.removeItem('an-pms-sync-queue');
```

---

## Support Resources

- **Implementation Guide**: See `PWA-IMPLEMENTATION-GUIDE.md`
- **Testing Checklist**: See `PWA-TESTING-CHECKLIST.md`
- **Phase Summary**: See `PHASE-3.2-SUMMARY.md`
- **Icon Instructions**: See `public/PWA-ICONS-README.md`

---

**Quick Reference - Phase 3.2**
**Air Niugini B767 Pilot Management System**
