# Timeline Component Quick Reference Guide

**Air Niugini B767 Pilot Management System**

---

## Component Imports

```typescript
// Core Timeline Component
import { CertificationTimeline } from '@/components/certifications/CertificationTimeline';

// View Components
import { TimelineView } from '@/components/certifications/TimelineView';
import { FleetTimelineView } from '@/components/certifications/FleetTimelineView';
import { CategoryTimelineView } from '@/components/certifications/CategoryTimelineView';

// History Component
import { CertificationHistory } from '@/components/certifications/CertificationHistory';
```

---

## 1. CertificationTimeline (Core Component)

### Basic Usage

```tsx
<CertificationTimeline
  certifications={events}
  onCertificationClick={(cert) => console.log(cert)}
  showPilotNames={false}
/>
```

### Props

| Prop                   | Type                   | Required | Default | Description                        |
| ---------------------- | ---------------------- | -------- | ------- | ---------------------------------- |
| `certifications`       | `CertificationEvent[]` | ✅       | -       | Array of certification events      |
| `onCertificationClick` | `(cert) => void`       | ❌       | -       | Click handler for certifications   |
| `showPilotNames`       | `boolean`              | ❌       | `false` | Display pilot names in hover cards |
| `categories`           | `string[]`             | ❌       | `[]`    | Category filter options            |

### CertificationEvent Interface

```typescript
interface CertificationEvent {
  id: string;
  checkCode: string;
  checkDescription: string;
  category: string;
  expiryDate: Date;
  pilotName?: string;
  employeeId?: string;
}
```

### Features

- ✅ Horizontal scrollable timeline
- ✅ Zoom: 50% to 300%
- ✅ Category filtering
- ✅ Keyboard navigation (arrows, +/-)
- ✅ Hover cards with details
- ✅ Today marker (red line)
- ✅ Status color coding

---

## 2. TimelineView (Single Pilot)

### Basic Usage

```tsx
<TimelineView pilotId="pilot-123" />
```

### Props

| Prop      | Type     | Required | Description                      |
| --------- | -------- | -------- | -------------------------------- |
| `pilotId` | `string` | ✅       | Pilot ID to display timeline for |

### Features

- ✅ Pilot header with stats
- ✅ Integrated CertificationTimeline
- ✅ Summary cards (Expired, Expiring, Current, Compliance %)
- ✅ Click to edit certifications
- ✅ Loading/error states

### Use Cases

- Individual pilot certification overview
- Training manager quick assessment
- Pilot detail page integration

---

## 3. FleetTimelineView (All Pilots)

### Basic Usage

```tsx
<FleetTimelineView />
```

### Props

None (self-contained)

### Features

- ✅ Fleet-wide timeline
- ✅ Sort by: date, pilot name, status
- ✅ Fleet compliance percentage
- ✅ Critical attention alerts
- ✅ Comprehensive statistics

### Statistics

- Total Pilots
- Total Certifications
- Expired Count
- Expiring Soon Count
- Current Count

### Use Cases

- Fleet compliance monitoring
- Risk assessment
- Management dashboards

---

## 4. CategoryTimelineView (By Category)

### Basic Usage

```tsx
<CategoryTimelineView />
```

### Props

None (self-contained)

### Features

- ✅ Expandable category sections
- ✅ Category compliance rates
- ✅ Expand All / Collapse All
- ✅ Auto-expand top 3 categories
- ✅ High compliance indicators

### Categories

- Flight Checks 🎯
- Pilot Medical 🏥
- Simulator Checks 📚
- ID Cards 🔒
- Travel Visa 🦺
- Ground Courses Refresher 👨‍🏫
- Foreign Pilot Work Permit 📜
- Non-renewal 📋

### Use Cases

- Compliance analysis by type
- Category-focused training planning
- Regulatory reporting

---

## 5. CertificationHistory (Historical Timeline)

### Basic Usage

```tsx
<CertificationHistory
  pilotId="pilot-123"
  checkTypeId="check-456"
  checkCode="PC"
  checkDescription="Proficiency Check"
  category="Flight Checks"
  currentExpiryDate={new Date('2025-12-31')}
  onExportPDF={() => console.log('Export')}
/>
```

### Props

| Prop                | Type           | Required | Description             |
| ------------------- | -------------- | -------- | ----------------------- |
| `pilotId`           | `string`       | ✅       | Pilot ID                |
| `checkTypeId`       | `string`       | ✅       | Check type ID           |
| `checkCode`         | `string`       | ✅       | Check code (e.g., "PC") |
| `checkDescription`  | `string`       | ✅       | Check description       |
| `category`          | `string`       | ✅       | Category name           |
| `currentExpiryDate` | `Date \| null` | ✅       | Current expiry date     |
| `onExportPDF`       | `() => void`   | ❌       | PDF export handler      |

### Features

- ✅ Historical timeline with milestones
- ✅ Expandable entries
- ✅ Renewal pattern analysis
- ✅ Average validity calculation
- ✅ Export to PDF placeholder

### Use Cases

- Audit trail viewing
- Renewal pattern analysis
- Compliance officer reviews

---

## Page Integration Examples

### Certifications Page

```tsx
// src/app/dashboard/certifications/page.tsx
const [currentView, setCurrentView] = useState<
  'list' | 'calendar' | 'timeline' | 'category-timeline'
>('list');

{
  currentView === 'timeline' && <FleetTimelineView />;
}
{
  currentView === 'category-timeline' && <CategoryTimelineView />;
}
```

### Calendar Page

```tsx
// src/app/dashboard/certifications/calendar/page.tsx
const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');

{
  viewMode === 'timeline' && (
    <CertificationTimeline
      certifications={events}
      onCertificationClick={handleClick}
      showPilotNames={true}
    />
  );
}
```

### Pilot Detail Page

```tsx
// src/app/dashboard/pilots/[id]/certifications/timeline/page.tsx
<TimelineView pilotId={pilotId} />
```

---

## Styling & Branding

### Air Niugini Colors

```tsx
// Primary
className = 'bg-[#E4002B]'; // Air Niugini Red
className = 'bg-[#FFC72C]'; // Air Niugini Gold

// Status Colors
className = 'bg-red-500'; // Expired
className = 'bg-yellow-500'; // Expiring Soon
className = 'bg-green-500'; // Current
```

### Hover Effects

```tsx
className = 'hover:bg-gray-50 transition-colors';
```

### Animations (Framer Motion)

```tsx
<motion.div
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ delay: index * 0.02 }}
>
```

---

## Keyboard Shortcuts

| Key           | Action                |
| ------------- | --------------------- |
| `←`           | Scroll timeline left  |
| `→`           | Scroll timeline right |
| `+` or `=`    | Zoom in               |
| `-` or `_`    | Zoom out              |
| `Tab`         | Navigate controls     |
| `Enter/Space` | Activate buttons      |

---

## Performance Tips

### Optimization

- Use `useMemo` for computed values
- Implement staggered animations (0.02s delay)
- Virtual scrolling for 500+ items
- Efficient date calculations

### Bundle Size

- Total timeline components: ~25KB gzipped
- Framer Motion: Already in project
- date-fns: Tree-shakeable, only needed functions imported

---

## Responsive Design

### Breakpoints

- Mobile: Horizontal scroll, touch-friendly
- Tablet: Optimized layout with larger touch targets
- Desktop: Full feature set with keyboard shortcuts

### Mobile Considerations

```tsx
// Enable horizontal scroll
className="overflow-x-auto"
style={{ WebkitOverflowScrolling: 'touch' }}

// Minimum width for usability
style={{ minWidth: '800px' }}
```

---

## Error Handling

### Loading States

```tsx
if (loading) {
  return <LoadingSpinner />;
}
```

### Error States

```tsx
if (error) {
  return <ErrorMessage message={error} />;
}
```

### Empty States

```tsx
if (certifications.length === 0) {
  return <EmptyState />;
}
```

---

## Testing

### Unit Tests

```typescript
// Test certification timeline rendering
test('renders certifications on timeline', () => {
  render(<CertificationTimeline certifications={mockData} />)
  expect(screen.getByText('Certification Timeline')).toBeInTheDocument()
})
```

### Integration Tests

```typescript
// Test view switching
test('switches between timeline views', async () => {
  render(<CertificationsPage />)
  fireEvent.click(screen.getByText('Timeline'))
  expect(screen.getByText('Fleet Certification Timeline')).toBeInTheDocument()
})
```

---

## API Integration

### Fetch Certifications

```typescript
// Fleet-wide
const response = await fetch('/api/pilots');
const pilots = await response.json();

// Single pilot
const response = await fetch(`/api/pilots/${pilotId}/certifications`);
const certs = await response.json();
```

### Transform Data

```typescript
const timelineEvents = certifications.map((cert) => ({
  id: cert.id,
  checkCode: cert.checkCode,
  checkDescription: cert.checkDescription,
  category: cert.category,
  expiryDate: new Date(cert.expiryDate),
  pilotName: cert.pilotName,
  employeeId: cert.employeeId,
}));
```

---

## Common Patterns

### Full Page Implementation

```tsx
export default function TimelinePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <PageHeader />
          <FleetTimelineView />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
```

### With State Management

```tsx
const [selectedCert, setSelectedCert] = useState<string | null>(null)

<CertificationTimeline
  certifications={certs}
  onCertificationClick={(cert) => setSelectedCert(cert.id)}
/>

{selectedCert && <CertificationDetails certId={selectedCert} />}
```

---

## Troubleshooting

### Common Issues

**1. Timeline not scrolling**

- Ensure container has `overflow-x-auto`
- Check minimum width is set
- Verify zoom calculations are correct

**2. Dates not displaying correctly**

- Confirm dates are Date objects, not strings
- Use `new Date(dateString)` for conversion
- Check timezone handling with date-fns

**3. Hover cards not appearing**

- Verify z-index is sufficient (z-20)
- Check AnimatePresence wrapper
- Ensure hover state is updating

**4. Performance issues**

- Implement pagination for >1000 items
- Use React.memo for expensive components
- Optimize animation delays

---

## Best Practices

### Do's ✅

- Always provide unique IDs for certifications
- Handle loading and error states
- Use Air Niugini brand colors consistently
- Implement keyboard navigation
- Test with production data volumes

### Don'ts ❌

- Don't mutate date objects directly
- Don't forget to handle empty states
- Don't use inline styles (use Tailwind classes)
- Don't skip accessibility features
- Don't over-animate (keep delays minimal)

---

## Resources

### Documentation

- [Framer Motion Docs](https://www.framer.com/motion/)
- [date-fns Docs](https://date-fns.org/)
- [Tailwind CSS](https://tailwindcss.com/)

### Project Files

- Timeline components: `src/components/certifications/`
- Pages: `src/app/dashboard/certifications/`
- Utilities: `src/lib/certification-utils.ts`

---

**Last Updated**: 2025-09-30
**Version**: 1.0.0
**Maintained By**: Air Niugini Development Team
