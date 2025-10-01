# Phase 2.1 - Modern Design System Integration Guide

## Overview

This guide provides complete instructions for integrating the new modern design system into the Air Niugini B767 Pilot Management System. All components follow Air Niugini branding guidelines and include professional animations.

---

## ✅ Completed Implementation

### 1. **Dependencies Installed**

All required packages have been installed:

- `framer-motion` (v12.23.22) - Professional animations
- `class-variance-authority` (v0.7.1) - Component variants
- `clsx` (v2.1.1) - Conditional classes
- `tailwind-merge` (v3.3.1) - Class merging
- `tailwindcss-animate` (v1.0.7) - Animation utilities
- `@radix-ui/*` packages - Accessible UI primitives

### 2. **shadcn/ui Components**

Installed core components:

- **Form Elements**: Button, Input, Label, Select, Checkbox, Switch, Textarea, Radio Group
- **Layout**: Card, Dialog, Sheet, Tabs, Separator, Table
- **Feedback**: Toast, Skeleton, Badge, Avatar
- **Navigation**: Dropdown Menu, Command, Popover
- **Date**: Calendar (with react-day-picker)

### 3. **Design Token System**

Created comprehensive design tokens in `src/lib/design-tokens.ts`:

- Air Niugini color system (red #E4002B, gold #FFC72C)
- Aviation professional colors
- Typography scale (Display, Heading, Body, Caption)
- Spacing system (4px base grid)
- Border radius system
- Shadow system
- Animation tokens (durations, easings, transitions)
- Component-specific tokens

### 4. **Skeleton Loaders**

Created in `src/components/ui/skeletons/`:

- `PilotCardSkeleton` - Loading state for pilot cards
- `PilotListSkeleton` - Loading state for pilot list view
- `DashboardStatsSkeleton` - Loading state for dashboard stats
- `CertificationTableSkeleton` - Loading state for certification tables
- `CalendarSkeleton` - Loading state for calendar views

All with Air Niugini branding and smooth pulse animations.

### 5. **Animated Components**

Created in `src/components/ui/animated/`:

- `FadeIn` - Fade in with directional slide
- `SlideIn` - Smooth slide from any direction
- `StaggerChildren` - Staggered list/grid animations
- `ScaleOnHover` - Interactive hover effects

All with viewport detection and configurable timing.

### 6. **Modern UI Components**

Created in `src/components/ui/`:

- `StatusBadge` - Aviation certification status badges
- `StatCard` - Modern dashboard statistics cards
- `DataTable` - Full-featured sortable/filterable table
- `EmptyState` - Beautiful empty state displays
- `LoadingButton` - Buttons with integrated loading states

All components use Air Niugini colors and professional animations.

---

## 📋 Integration Instructions

### **Step 1: Import and Use Skeleton Loaders**

Replace loading states in your components:

```tsx
// Before
{
  isLoading && <div>Loading...</div>;
}

// After
import { PilotCardSkeleton } from '@/components/ui/skeletons';

{
  isLoading ? <PilotCardSkeleton /> : <PilotCard data={pilot} />;
}
```

**Examples:**

```tsx
// Pilot List Page
import { PilotListSkeleton } from '@/components/ui/skeletons';

{
  isLoading ? <PilotListSkeleton count={10} /> : <PilotList pilots={pilots} />;
}

// Dashboard Page
import { DashboardStatsGridSkeleton } from '@/components/ui/skeletons';

{
  isLoading ? <DashboardStatsGridSkeleton count={4} /> : <DashboardStats stats={stats} />;
}
```

### **Step 2: Add Animations**

Wrap components with animation wrappers:

```tsx
import { FadeIn, StaggerChildren } from '@/components/ui/animated'

// Simple fade in
<FadeIn direction="up" duration={0.4}>
  <Card>Content</Card>
</FadeIn>

// Staggered list
<StaggerChildren staggerDelay={0.1}>
  {pilots.map(pilot => (
    <PilotCard key={pilot.id} pilot={pilot} />
  ))}
</StaggerChildren>

// Hover effects
import { ScaleOnHoverCard } from '@/components/ui/animated'

<ScaleOnHoverCard>
  <Card>Interactive Card</Card>
</ScaleOnHoverCard>
```

### **Step 3: Replace Status Indicators**

Use the new StatusBadge component:

```tsx
// Before
<span className={`status-${status}`}>{status}</span>

// After
import { StatusBadge, getCertificationStatus } from '@/components/ui/StatusBadge'

const status = getCertificationStatus(daysUntilExpiry)
<StatusBadge status={status} showIcon />
```

**Variants:**

- `current` - Green (valid certification)
- `expiring` - Yellow (expiring within 30 days)
- `expired` - Red (past expiry date)
- `pending` - Blue (awaiting approval)
- `inactive` - Gray (no date/inactive)

### **Step 4: Use StatCard for Dashboard**

Replace dashboard statistics:

```tsx
import { StatCard, StatCardGrid } from '@/components/ui/StatCard'
import { Users, Award, AlertTriangle, Calendar } from 'lucide-react'

const stats = [
  {
    title: 'Total Pilots',
    value: 27,
    icon: Users,
    variant: 'primary',
    trend: { value: 8, label: 'vs last month', direction: 'up' }
  },
  {
    title: 'Active Certifications',
    value: 556,
    icon: Award,
    variant: 'success'
  },
  {
    title: 'Expiring Soon',
    value: 12,
    icon: AlertTriangle,
    variant: 'warning',
    trend: { value: -15, label: 'vs last week', direction: 'down' }
  }
]

<StatCardGrid stats={stats} columns={4} />
```

### **Step 5: Implement DataTable**

Replace custom table implementations:

```tsx
import { DataTable } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'

const columns = [
  {
    key: 'employee_id',
    label: 'Employee ID',
    sortable: true,
    width: '120px'
  },
  {
    key: 'name',
    label: 'Pilot Name',
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center space-x-3">
        <Avatar>{row.first_name[0]}</Avatar>
        <span className="font-medium">{value}</span>
      </div>
    )
  },
  {
    key: 'status',
    label: 'Status',
    render: (value) => <StatusBadge status={value} />
  }
]

<DataTable
  data={pilots}
  columns={columns}
  searchable
  searchPlaceholder="Search pilots..."
  pageSize={10}
  onRowClick={(pilot) => router.push(`/pilots/${pilot.id}`)}
/>
```

### **Step 6: Add Empty States**

Replace empty data messages:

```tsx
import { EmptyList, EmptySearchResult, ErrorState } from '@/components/ui/EmptyState';

// Empty list
{
  pilots.length === 0 && !searchQuery && (
    <EmptyList
      resourceName="Pilot"
      onCreateNew={() => setShowCreateModal(true)}
      description="Start by adding your first pilot to the system."
    />
  );
}

// No search results
{
  pilots.length === 0 && searchQuery && (
    <EmptySearchResult searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} />
  );
}

// Error state
{
  error && (
    <ErrorState
      title="Failed to load pilots"
      description={error.message}
      onRetry={() => refetch()}
    />
  );
}
```

### **Step 7: Use LoadingButton**

Replace buttons with loading states:

```tsx
import { LoadingButton } from '@/components/ui/LoadingButton';
import { Save } from 'lucide-react';

<LoadingButton
  loading={isSubmitting}
  loadingText="Saving..."
  icon={Save}
  onClick={handleSubmit}
  className="bg-[#E4002B] hover:bg-[#C00020]"
>
  Save Changes
</LoadingButton>;
```

---

## 🎨 Design Token Usage

### **Colors**

```tsx
import { colors } from '@/lib/design-tokens';

// Air Niugini Brand
colors.brand.red.DEFAULT; // #E4002B
colors.brand.gold.DEFAULT; // #FFC72C

// Aviation Professional
colors.aviation.navy.DEFAULT; // #1E3A8A
colors.aviation.blue.DEFAULT; // #0EA5E9

// Semantic
colors.semantic.success.DEFAULT; // #10B981
colors.semantic.warning.DEFAULT; // #F59E0B
colors.semantic.error.DEFAULT; // #EF4444
```

### **Typography**

```tsx
import { typography } from '@/lib/design-tokens'

<h1 className="text-display-lg">Large Display</h1>
<h2 className="text-heading-lg">Large Heading</h2>
<p className="text-body-md">Body Text</p>
<span className="text-caption">Caption Text</span>
```

### **Spacing**

Use the 4px base grid system:

```tsx
// Tailwind classes
className = 'p-6 space-y-4 gap-3';

// Or design tokens
import { spacing } from '@/lib/design-tokens';
spacing[6]; // 1.5rem (24px)
```

### **Shadows**

```tsx
import { shadows } from '@/lib/design-tokens'

// Tailwind classes
className="shadow-sm hover:shadow-lg"

// Or CSS
style={{ boxShadow: shadows.lg }}
```

---

## 🔄 Animation Guidelines

### **Durations**

- **Instant**: 0ms - No animation
- **Fast**: 150ms - Micro-interactions (hover, focus)
- **Normal**: 250ms - Default (most animations)
- **Slow**: 350ms - Complex animations
- **Slower**: 500ms - Page transitions
- **Slowest**: 700ms - Elaborate effects

### **Best Practices**

1. **Use FadeIn for page entries**: `<FadeIn direction="up">`
2. **Use StaggerChildren for lists**: Better UX than all at once
3. **Use ScaleOnHover for interactive elements**: Provides feedback
4. **Use skeleton loaders**: Never show blank screens
5. **Respect reduced motion**: Animations automatically respect `prefers-reduced-motion`

### **Performance Tips**

- Animate `transform` and `opacity` (GPU-accelerated)
- Avoid animating `width`, `height`, `margin` (causes reflow)
- Use `will-change` sparingly
- Keep animations under 500ms for most cases

---

## 📱 Responsive Design

All components are mobile-first and responsive:

```tsx
// Automatic responsive grids
<StatCardGrid stats={stats} columns={4} />
// Renders: 1 col mobile, 2 cols tablet, 4 cols desktop

// DataTable automatically becomes cards on mobile
<DataTable data={data} columns={columns} />
```

---

## ♿ Accessibility

All components follow WCAG 2.1 AA standards:

- **Keyboard navigation**: Full support
- **Screen readers**: ARIA labels included
- **Focus indicators**: Visible focus states
- **Color contrast**: Meets 4.5:1 minimum
- **Motion**: Respects `prefers-reduced-motion`

---

## 🧪 Testing Integration

Test your integration:

```bash
# Run development server
npm run dev

# Test components in isolation
# Visit: http://localhost:3000/dashboard

# Run E2E tests
npx playwright test
```

---

## 📦 Component API Reference

### **StatusBadge**

```tsx
<StatusBadge
  status="current" | "expiring" | "expired" | "pending" | "inactive"
  label="Custom Label" (optional)
  showIcon={true} (optional)
  size="sm" | "md" | "lg" (optional)
/>
```

### **StatCard**

```tsx
<StatCard
  title="Card Title"
  value={123}
  subtitle="Optional subtitle"
  icon={LucideIcon}
  variant="default" | "primary" | "secondary" | "success" | "warning" | "error"
  trend={{ value: 8, label: "vs last month", direction: "up" | "down" }}
/>
```

### **DataTable**

```tsx
<DataTable
  data={array}
  columns={columnDefinitions}
  searchable={true}
  searchPlaceholder="Search..."
  pageSize={10}
  onRowClick={(row) => {}}
/>
```

### **FadeIn**

```tsx
<FadeIn
  direction="up" | "down" | "left" | "right" | "none"
  duration={0.5}
  delay={0}
  distance={20}
/>
```

### **LoadingButton**

```tsx
<LoadingButton
  loading={boolean}
  loadingText="Processing..."
  icon={LucideIcon}
  iconPosition="left" | "right"
/>
```

---

## 🎯 Migration Checklist

Use this checklist to track your migration:

- [ ] Replace loading states with skeleton loaders
- [ ] Add FadeIn animations to page components
- [ ] Replace status badges with StatusBadge component
- [ ] Update dashboard with StatCard components
- [ ] Convert tables to DataTable component
- [ ] Add empty states with EmptyState component
- [ ] Replace buttons with LoadingButton
- [ ] Add hover animations to interactive elements
- [ ] Test mobile responsiveness
- [ ] Verify accessibility with keyboard navigation
- [ ] Run E2E tests to ensure no regressions

---

## 🚀 Next Steps

After completing Phase 2.1, proceed to:

1. **Phase 2.2**: Command Palette & Quick Actions
2. **Phase 2.3**: Real-time Updates & Notifications
3. **Phase 2.4**: Advanced Analytics Dashboard

---

## 📞 Support

For questions or issues:

1. Check component documentation in source files
2. Review Air Niugini branding guidelines
3. Test in development environment first
4. Verify with E2E tests before deployment

---

**Air Niugini B767 Pilot Management System**
_Phase 2.1 - Modern Design System Complete_
_Papua New Guinea's National Airline Fleet Operations Management_
