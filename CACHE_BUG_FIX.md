# Cache Bug Fix - Stale Certification Data Issue

## Issue Summary

**Problem**: After saving certification changes, the UI displayed old dates even though the database was correctly updated with new dates.

**Root Cause**: The pilot detail page was using `useState` and `useEffect` instead of TanStack Query, causing stale data to persist in component state.

---

## Root Cause Analysis

### The Problem

The pilot detail page (`/dashboard/pilots/[id]/page.tsx`) was fetching data using direct `useEffect` calls instead of TanStack Query:

```typescript
// OLD CODE - BROKEN
useEffect(() => {
  const fetchPilotData = async () => {
    const [pilotData, certData] = await Promise.all([
      getPilotById(pilotId),
      getPilotCertifications(pilotId),
    ]);
    
    setPilot(pilotData);  // Stored in local state
    setCertifications(certData);  // Stored in local state
  };

  const shouldRefresh = new URLSearchParams(window.location.search).get('refresh');
  if (shouldRefresh) {
    window.history.replaceState({}, '', window.location.pathname);
  }

  fetchPilotData();
}, [pilotId]);  // Only re-runs when pilotId changes
```

**Why This Failed**:
1. Data was stored in local component state (`useState`)
2. The `refresh` query parameter was checked but didn't trigger a refetch
3. `useEffect` only depended on `pilotId`, not the `refresh` param
4. No cache invalidation mechanism existed
5. TanStack Query cache configuration (5-minute stale time) was never used

### Evidence

1. **API returns correct data**: Database query confirmed `"expiry_date":"2027-01-20"`
2. **UI shows old data**: Component displays "15 Dec 2026"
3. **Redirect includes refresh param**: `router.push(\`/dashboard/pilots/\${pilotId}?refresh=\${Date.now()}\`)`
4. **useEffect ignores refresh param**: Not in dependency array, so no refetch occurs

---

## The Fix

### 1. Convert to TanStack Query (Pilot Detail Page)

**File**: `src/app/dashboard/pilots/[id]/page.tsx`

```typescript
// NEW CODE - FIXED
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

export default function PilotDetailPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const refreshParam = searchParams.get('refresh');
  
  // Use TanStack Query for pilot data
  const { data: pilotData, isLoading: pilotLoading } = useQuery({
    queryKey: ['pilot', pilotId, refreshParam],  // Include refreshParam in key
    queryFn: () => getPilotById(pilotId),
    staleTime: 0,  // Always fetch fresh data
    refetchOnMount: true,
  });
  
  // Use TanStack Query for certifications
  const { data: certData, isLoading: certLoading } = useQuery({
    queryKey: ['pilot-certifications', pilotId, refreshParam],  // Include refreshParam
    queryFn: () => getPilotCertifications(pilotId),
    staleTime: 0,  // Always fetch fresh data
    refetchOnMount: true,
  });
  
  // Clean up refresh param after data loads
  useEffect(() => {
    if (refreshParam && !pilotLoading && !certLoading) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refreshParam, pilotLoading, certLoading]);
}
```

**Key Changes**:
- Replaced `useState` + `useEffect` with `useQuery`
- Added `refreshParam` to query keys (forces new fetch when changed)
- Set `staleTime: 0` to always fetch fresh data
- Enabled `refetchOnMount` for reliability

### 2. Add Query Invalidation (Certification Management Page)

**File**: `src/app/dashboard/pilots/[id]/certifications/page.tsx`

```typescript
import { useQueryClient } from '@tanstack/react-query';

export default function PilotCertificationsPage() {
  const queryClient = useQueryClient();
  
  const handleSubmit = async (e: React.FormEvent) => {
    // ... save logic ...
    
    // Invalidate all related queries
    await queryClient.invalidateQueries({ queryKey: ['pilot', pilotId] });
    await queryClient.invalidateQueries({ queryKey: ['pilot-certifications', pilotId] });
    await queryClient.invalidateQueries({ queryKey: ['pilots'] });
    
    // Redirect with refresh parameter
    router.push(`/dashboard/pilots/${pilotId}?refresh=${Date.now()}`);
  };
}
```

**Key Changes**:
- Added `useQueryClient()` hook
- Invalidate all related queries before redirect
- Ensures cache is cleared before navigation

---

## How The Fix Works

### Data Flow (Before Fix)

```
1. User saves certification → API updates database ✅
2. API returns success ✅
3. Redirect to detail page with ?refresh=123 ✅
4. useEffect runs, checks refresh param ✅
5. useEffect fetches data... but wait! ❌
   - useEffect dependency: [pilotId]
   - refresh param NOT in dependencies
   - useEffect doesn't re-run!
6. Component shows old data from initial mount ❌
```

### Data Flow (After Fix)

```
1. User saves certification → API updates database ✅
2. API returns success ✅
3. Invalidate TanStack Query cache ✅
4. Redirect to detail page with ?refresh=123 ✅
5. useQuery detects new queryKey (includes refreshParam) ✅
6. useQuery automatically fetches fresh data ✅
7. Component shows new data ✅
8. Clean up refresh param from URL ✅
```

---

## Benefits of This Solution

### 1. **Proper Cache Management**
- TanStack Query handles cache invalidation
- Query keys include dynamic params
- Automatic refetch on mount

### 2. **No Stale Data**
- `staleTime: 0` ensures fresh data
- Query invalidation clears cache
- Refresh parameter forces new query key

### 3. **Better User Experience**
- Loading states handled by `isLoading`
- Automatic retry on errors
- Optimistic updates possible

### 4. **Follows Best Practices**
- Uses project's existing TanStack Query setup
- Consistent with Air Niugini architecture
- Service layer pattern preserved

---

## Testing Checklist

- [x] TypeScript compilation successful
- [x] Development server starts without errors
- [ ] Save certification → refresh → verify new date displays
- [ ] Check browser console for query logs
- [ ] Verify no 404 or API errors
- [ ] Test with multiple certification changes
- [ ] Verify delete pilot still works
- [ ] Check query cache in React DevTools

---

## Files Modified

1. **src/app/dashboard/pilots/[id]/page.tsx**
   - Added TanStack Query imports
   - Converted `useState`/`useEffect` to `useQuery`
   - Added query key with `refreshParam`
   - Fixed TypeScript type errors

2. **src/app/dashboard/pilots/[id]/certifications/page.tsx**
   - Added `useQueryClient` hook
   - Added query invalidation before redirect
   - Preserved existing save logic

---

## Related Context

### API Layer (No Changes Needed)

The API layer was working correctly:
- `GET /api/certifications?pilotId={id}` returns fresh data
- `PUT /api/certifications?pilotId={id}` saves correctly
- Cache-Control headers properly set
- Database persistence verified

### Service Layer (Already Optimal)

The service layer (`src/lib/pilot-service.ts`) already:
- Uses `cache: 'no-store'` on fetch calls
- Includes proper cache-control headers
- Works for both client and server environments

---

## Prevention

To prevent similar issues in the future:

1. **Always use TanStack Query** for server state in client components
2. **Include dynamic params** in query keys (e.g., `refresh`, timestamps)
3. **Invalidate queries** after mutations before navigation
4. **Set appropriate staleTime** based on data freshness requirements
5. **Use React DevTools** to inspect query cache during development

---

## Architecture Notes

This fix aligns with the Air Niugini Pilot Management System architecture:

- **TanStack Query**: Already configured in `src/components/providers/Providers.tsx`
- **Service Layer**: Preserves service function pattern from `pilot-service.ts`
- **API Routes**: No changes needed - already working correctly
- **Cache Strategy**: Follows project's caching standards

---

**Status**: Fixed and Ready for Testing
**Impact**: High - Resolves critical data staleness bug
**Risk**: Low - Uses existing infrastructure
**Testing Required**: Manual verification in browser
