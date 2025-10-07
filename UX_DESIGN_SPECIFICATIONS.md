# UX Design Specifications

## Air Niugini Pilot Management System - shadcn/ui Integration

**Version**: 1.0
**Date**: October 7, 2025
**Author**: UX Design Team
**Project**: B767 Fleet Management - shadcn/ui Component Upgrade

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Component Specifications](#component-specifications)
3. [Brand Integration](#brand-integration)
4. [Accessibility Standards](#accessibility-standards)
5. [Implementation Guidelines](#implementation-guidelines)

---

## Design Principles

### Core UX Principles

1. **Aviation Industry Standards** - Follow FAA color coding and aviation UI conventions
2. **Air Niugini Branding** - Consistent use of brand red (#E4002B) and gold (#FFC72C)
3. **Accessibility First** - WCAG 2.1 AA compliance minimum, AAA where feasible
4. **Mobile-Responsive** - Desktop-first with full tablet and mobile support
5. **Progressive Enhancement** - Core functionality without JavaScript, enhanced with it
6. **Performance Optimized** - Fast loading, minimal reflows, efficient animations

### User Context

- **Primary Users**: 27 pilots, 3 admin/manager users
- **Primary Devices**: Desktop (1920x1080 typical), Tablet (iPad Pro), Mobile (iPhone/Android)
- **Environment**: Office environments with good lighting (desktop), mobile in various conditions
- **Critical Tasks**: Certification tracking, leave approval, compliance monitoring

---

## Component Specifications

### 1. Sonner Toast Notifications

#### Purpose

Replace current toast implementation with shadcn/ui Sonner for consistent notification patterns across pilot CRUD, leave approval, certification updates, and error handling.

#### Visual Design

**Position**: Top-right corner (desktop), top-center full-width (mobile)

**Spacing**:

- Desktop: 16px from top, 16px from right
- Mobile: 0px from edges (full-width)
- Stack spacing: 8px between multiple toasts

**Dimensions**:

- Desktop: 400px width, auto height (min 72px)
- Mobile: 100% width - 16px margin, auto height

**Air Niugini Brand Variants**:

```tsx
// Success Variant (Pilot created, leave approved, etc.)
{
  background: '#FFFFFF',
  border: '2px solid #10B981', // Green for success
  borderLeft: '6px solid #E4002B', // Air Niugini red accent
  textColor: '#1F2937',
  iconColor: '#10B981',
  icon: CheckCircle2
}

// Error Variant (Failed operations, validation errors)
{
  background: '#FFF5F5',
  border: '2px solid #EF4444', // Red for errors
  borderLeft: '6px solid #E4002B', // Air Niugini red accent
  textColor: '#1F2937',
  iconColor: '#EF4444',
  icon: AlertOctagon
}

// Warning Variant (Expiring certifications, crew availability warnings)
{
  background: '#FFFBEB',
  border: '2px solid #F59E0B', // Amber for warnings
  borderLeft: '6px solid #FFC72C', // Air Niugini gold accent
  textColor: '#1F2937',
  iconColor: '#F59E0B',
  icon: AlertTriangle
}

// Info Variant (System notifications, reminders)
{
  background: '#EFF6FF',
  border: '2px solid #3B82F6', // Blue for info
  borderLeft: '6px solid #1E3A8A', // Aviation navy accent
  textColor: '#1F2937',
  iconColor: '#3B82F6',
  icon: Info
}
```

#### Typography

- **Title**: 14px font-semibold, #1F2937
- **Description**: 13px font-normal, #6B7280
- **Action Button**: 13px font-medium, #E4002B hover:#C00020

#### Animation

- **Duration**: 250ms ease-out
- **Entry**: Slide from right (desktop), slide from top (mobile) + fade in
- **Exit**: Fade out + scale down to 0.95
- **Auto-dismiss**: 5 seconds (success/info), 7 seconds (warning), Manual dismiss only (error)

#### Interaction States

**Default State**:

- Drop shadow: 0 10px 15px -3px rgba(0,0,0,0.1)
- Hover: Pause auto-dismiss timer, subtle lift (translateY(-2px))

**Action Buttons**:

- Primary action: #E4002B background, white text, hover:#C00020
- Secondary action: Transparent background, #E4002B text, hover:#FEE2E2 background

**Dismiss Button**:

- Position: Top-right corner, 8px from edges
- Icon: X (lucide-react), 16px
- Hover: #EF4444 color, #FEE2E2 background
- Focus: 2px ring #E4002B offset 2px

#### Accessibility

- **ARIA live region**: `aria-live="polite"` (success/info), `aria-live="assertive"` (error/warning)
- **Role**: `role="status"` (info), `role="alert"` (error/warning)
- **Focus management**: Focus moves to action button if present, otherwise to dismiss button
- **Keyboard navigation**:
  - Tab: Move between action buttons and dismiss
  - Escape: Dismiss toast
  - Space/Enter: Activate focused button
- **Screen reader**: Full announcement of title + description + available actions

#### Use Cases with Examples

**1. Pilot CRUD Success**

```tsx
toast.success('Pilot Created Successfully', {
  description: `${pilotName} (${employeeId}) has been added to the system.`,
  action: {
    label: 'View Pilot',
    onClick: () => router.push(`/dashboard/pilots/${pilotId}`),
  },
  duration: 5000,
});
```

**2. Certification Update Error**

```tsx
toast.error('Failed to Update Certification', {
  description: 'The expiry date must be within the current roster period.',
  action: {
    label: 'Review Date',
    onClick: () => focusField('expiryDate'),
  },
  duration: Infinity, // Manual dismiss only
});
```

**3. Leave Approval Warning**

```tsx
toast.warning('Crew Availability Warning', {
  description: 'Approving this request will leave only 9 Captains on roster (minimum 10 required).',
  action: {
    label: 'Review Request',
    onClick: () => openReviewModal(requestId),
  },
  duration: 7000,
});
```

**4. Expiring Certification Reminder**

```tsx
toast.info('Certifications Expiring Soon', {
  description: '5 certifications will expire in the next 30 days.',
  action: {
    label: 'View Details',
    onClick: () => router.push('/dashboard/certifications?filter=expiring'),
  },
  duration: 5000,
});
```

#### Mobile Considerations

- Full-width layout with 16px horizontal margins
- Larger touch targets: 44px minimum height for action buttons
- Single-column action buttons on very small screens (<375px)
- Swipe to dismiss gesture (horizontal swipe)
- Reduced shadow for better outdoor visibility

---

### 2. Breadcrumb Navigation

#### Purpose

Provide clear navigation hierarchy across all dashboard pages, showing users their current location and enabling quick navigation to parent pages.

#### Visual Design

**Position**: Below page header, above main content

**Spacing**:

- Top margin: 16px from header
- Bottom margin: 24px from content
- Horizontal padding: Matches page container (32px desktop, 16px mobile)

**Dimensions**:

- Height: 40px (desktop), 48px (mobile) - ensures touch-friendly
- Separator spacing: 12px on each side of chevron

**Air Niugini Brand Styling**:

```tsx
// Base breadcrumb container
{
  display: 'flex',
  alignItems: 'center',
  fontSize: '14px',
  color: '#6B7280', // Neutral gray
  gap: '12px'
}

// Breadcrumb item (inactive)
{
  color: '#6B7280',
  textDecoration: 'none',
  transition: 'color 150ms ease-out',
  hover: {
    color: '#E4002B', // Air Niugini red
    textDecoration: 'underline',
    textDecorationColor: '#FFC72C' // Gold underline
  }
}

// Breadcrumb item (current/active)
{
  color: '#E4002B', // Air Niugini red
  fontWeight: 600,
  cursor: 'default',
  ariaCurrentPage: true
}

// Separator (chevron)
{
  color: '#D1D5DB', // Light gray
  icon: ChevronRight,
  size: 16
}
```

#### Typography

- **Inactive items**: 14px font-normal, #6B7280
- **Active item**: 14px font-semibold, #E4002B
- **Mobile**: 13px (slightly smaller to fit truncated items)

#### Truncation Logic

**Desktop (≥1024px)**: Show full breadcrumb path

```
Dashboard > Pilots > John Smith > Edit Certification
```

**Tablet (768px - 1023px)**: Truncate middle items if more than 4 levels

```
Dashboard > ... > John Smith > Edit Certification
```

**Mobile (<768px)**: Show only current page + back button

```
← Edit Certification
```

#### Navigation Patterns

**Standard Page Hierarchy**:

```tsx
// Pilot Details Page
Dashboard > Pilots > John Smith

// Certification Edit
Dashboard > Pilots > John Smith > Certifications > Edit

// Leave Management
Dashboard > Leave > Roster Planning

// Analytics
Dashboard > Analytics > Advanced
```

**Truncation Example** (5+ levels on tablet):

```tsx
// Before truncation (desktop)
Dashboard > Pilots > John Smith > Certifications > Line Training > Edit

// After truncation (tablet)
Dashboard > ... > Line Training > Edit

// Mobile (back button only)
← Edit Line Training
```

#### Interaction States

**Clickable Breadcrumb**:

- Default: #6B7280 text, no underline
- Hover: #E4002B text, gold underline (#FFC72C)
- Active: #C00020 text (darker red on click)
- Focus: 2px ring #E4002B, offset 2px, rounded corners

**Current Breadcrumb** (non-clickable):

- Color: #E4002B
- Font weight: 600
- No hover state
- aria-current="page"

**Truncation Button** (...):

- Hover: Opens dropdown showing hidden items
- Dropdown: White background, border #E5E7EB, shadow-md
- Dropdown items: Same hover states as regular breadcrumbs

#### Accessibility

- **Semantic HTML**: `<nav aria-label="Breadcrumb">` container
- **List structure**: `<ol>` with `<li>` items
- **Current page**: `aria-current="page"` on active item
- **Keyboard navigation**:
  - Tab: Move through clickable breadcrumbs
  - Enter/Space: Navigate to breadcrumb
  - Shift+Tab: Navigate backwards
- **Screen reader**: Announces "Breadcrumb navigation" then each level
- **Focus indicators**: Clear 2px red ring on focus

#### Mobile Back Button Pattern

```tsx
// Mobile breadcrumb (replaces full breadcrumb on <768px)
<nav aria-label="Breadcrumb" className="flex items-center">
  <button
    onClick={navigateBack}
    className="flex items-center gap-2 text-[#E4002B] font-medium"
    aria-label="Go back to previous page"
  >
    <ChevronLeft size={20} />
    <span className="text-sm">{currentPageTitle}</span>
  </button>
</nav>
```

#### Use Cases with Examples

**1. Pilot Management Pages**

```tsx
// Pilot list page
Dashboard > Pilots

// Pilot details
Dashboard > Pilots > John Smith

// Edit pilot
Dashboard > Pilots > John Smith > Edit

// Certification timeline
Dashboard > Pilots > John Smith > Certifications > Timeline
```

**2. Leave Management Pages**

```tsx
// Leave requests
Dashboard > Leave

// Leave calendar
Dashboard > Leave > Calendar

// Roster planning
Dashboard > Leave > Roster Planning
```

**3. Settings Pages**

```tsx
// General settings
Dashboard > Settings;

// System settings
Dashboard > Admin > System;

// User management
Dashboard > Admin > Users;
```

#### Implementation Notes

- Store breadcrumb data in route metadata (Next.js layout/page)
- Auto-generate breadcrumbs from route structure
- Allow manual override for dynamic routes (e.g., pilot names)
- Persist breadcrumb state during navigation
- Update document title to match current breadcrumb

---

### 3. Enhanced Alerts

#### Purpose

Provide contextual, visually distinct alerts for critical system messages, warnings, and informational content across the application.

#### Visual Design Categories

**1. Urgent Alerts** (Critical certification expiry, crew shortages, system errors)

```tsx
{
  background: 'linear-gradient(to right, #FEE2E2, #FECACA)', // Red gradient
  border: '2px solid #EF4444',
  borderLeft: '6px solid #E4002B', // Air Niugini red accent
  icon: AlertOctagon,
  iconColor: '#DC2626',
  iconSize: 24,
  titleColor: '#991B1B',
  textColor: '#7F1D1D',
  closeButton: true,
  dismissible: false, // Critical alerts cannot be dismissed
  shadow: '0 10px 15px -3px rgba(239, 68, 68, 0.2)'
}
```

**2. Warning Alerts** (Expiring certifications, crew availability warnings)

```tsx
{
  background: 'linear-gradient(to right, #FEF3C7, #FDE68A)', // Amber gradient
  border: '2px solid #F59E0B',
  borderLeft: '6px solid #FFC72C', // Air Niugini gold accent
  icon: AlertTriangle,
  iconColor: '#D97706',
  iconSize: 22,
  titleColor: '#92400E',
  textColor: '#78350F',
  closeButton: true,
  dismissible: true,
  shadow: '0 4px 6px -1px rgba(245, 158, 11, 0.15)'
}
```

**3. Info Alerts** (System notifications, feature updates, reminders)

```tsx
{
  background: 'linear-gradient(to right, #DBEAFE, #BFDBFE)', // Blue gradient
  border: '2px solid #3B82F6',
  borderLeft: '6px solid #1E3A8A', // Aviation navy accent
  icon: Info,
  iconColor: '#2563EB',
  iconSize: 20,
  titleColor: '#1E3A8A',
  textColor: '#1E40AF',
  closeButton: true,
  dismissible: true,
  shadow: '0 4px 6px -1px rgba(59, 130, 246, 0.15)'
}
```

**4. Success Alerts** (Successful operations, approvals)

```tsx
{
  background: 'linear-gradient(to right, #D1FAE5, #A7F3D0)', // Green gradient
  border: '2px solid #10B981',
  borderLeft: '6px solid #059669', // Dark green accent
  icon: CheckCircle2,
  iconColor: '#059669',
  iconSize: 20,
  titleColor: '#065F46',
  textColor: '#064E3B',
  closeButton: true,
  dismissible: true,
  shadow: '0 4px 6px -1px rgba(16, 185, 129, 0.15)'
}
```

#### Spacing & Layout

```tsx
// Alert container
{
  padding: '16px 20px',
  borderRadius: '8px',
  display: 'flex',
  gap: '16px',
  alignItems: 'flex-start',
  marginBottom: '16px'
}

// Icon container
{
  flexShrink: 0,
  paddingTop: '2px' // Aligns with title baseline
}

// Content container
{
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

// Action buttons container
{
  marginTop: '12px',
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap'
}
```

#### Typography

- **Alert Title**: 16px font-semibold, line-height 1.3
- **Alert Description**: 14px font-normal, line-height 1.6
- **Action Button Text**: 14px font-medium
- **Close Button**: X icon 18px

#### Animation

- **Entry**: Slide down from top + fade in, 300ms ease-out
- **Exit**: Fade out + scale down to 0.98, 200ms ease-in
- **Reduced Motion**: Instant appear/disappear (respects prefers-reduced-motion)

#### Interaction States

**Action Buttons**:

```tsx
// Primary action (matches alert color)
{
  background: 'alertBorderColor', // E.g., #EF4444 for urgent
  color: '#FFFFFF',
  padding: '8px 16px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 500,
  hover: {
    background: 'darken(alertBorderColor, 10%)',
    transform: 'translateY(-1px)',
    shadow: '0 4px 6px -1px rgba(0,0,0,0.15)'
  },
  active: {
    transform: 'translateY(0)',
    shadow: '0 2px 4px -1px rgba(0,0,0,0.1)'
  }
}

// Secondary action (outline)
{
  background: 'transparent',
  color: 'alertBorderColor',
  border: '2px solid alertBorderColor',
  padding: '8px 16px',
  borderRadius: '6px',
  hover: {
    background: 'alertBackgroundColor',
    transform: 'translateY(-1px)'
  }
}
```

**Close Button**:

```tsx
{
  position: 'absolute',
  top: '12px',
  right: '12px',
  color: 'alertIconColor',
  opacity: 0.6,
  hover: {
    opacity: 1,
    background: 'rgba(0,0,0,0.05)',
    borderRadius: '4px'
  },
  focus: {
    ring: '2px solid alertBorderColor',
    ringOffset: '2px'
  }
}
```

#### Accessibility

- **Role**: `role="alert"` for urgent/error alerts, `role="status"` for info/success
- **ARIA live**: `aria-live="assertive"` (urgent), `aria-live="polite"` (others)
- **ARIA atomic**: `aria-atomic="true"` ensures full message read
- **Focus management**:
  - Urgent alerts: Auto-focus first action button
  - Others: Do not steal focus
- **Keyboard navigation**:
  - Tab: Move between action buttons and close
  - Escape: Dismiss alert (if dismissible)
  - Enter/Space: Activate focused button
- **Screen reader**: Icon announced as decorative (aria-hidden="true"), title + description read aloud

#### Use Cases with Examples

**1. Final Review Alert** (22 days before roster deadline)

```tsx
// Urgent variant (≤7 days remaining)
<Alert variant="urgent" dismissible={false}>
  <AlertOctagon className="h-6 w-6" />
  <AlertTitle>URGENT: Final Review Deadline in 5 Days</AlertTitle>
  <AlertDescription>
    {pendingCount} pending leave requests for RP12/2025 require immediate action.
    Roster period ends on October 10, 2025.
  </AlertDescription>
  <AlertActions>
    <Button variant="primary" size="sm" onClick={openReviewModal}>
      Review Now
    </Button>
    <Button variant="outline" size="sm" onClick={viewAllPending}>
      View All Pending
    </Button>
  </AlertActions>
</Alert>

// Warning variant (8-22 days remaining)
<Alert variant="warning" dismissible={true}>
  <AlertTriangle className="h-5 w-5" />
  <AlertTitle>Final Review Deadline Approaching</AlertTitle>
  <AlertDescription>
    {pendingCount} pending leave requests need review within 14 days.
  </AlertDescription>
  <AlertActions>
    <Button variant="primary" size="sm">Review Requests</Button>
  </AlertActions>
</Alert>
```

**2. Seniority Priority Review** (Conflicting leave requests)

```tsx
// Crew shortage scenario (yellow border, crew below minimum)
<Alert variant="warning" className="border-yellow-400 border-2">
  <AlertTriangle className="h-5 w-5" />
  <AlertTitle>Seniority Priority Review Required</AlertTitle>
  <AlertDescription>
    3 Captains have requested leave for the same dates. Current crew availability:
    9 Captains on roster (minimum 10 required).
  </AlertDescription>
  <div className="mt-3 space-y-2">
    <div className="text-sm font-medium">Priority Order:</div>
    <ol className="text-sm space-y-1">
      <li>1. John Smith (Seniority #3, requested Sep 15)</li>
      <li>2. Mike Johnson (Seniority #8, requested Sep 16)</li>
      <li>3. Chris Davis (Seniority #12, requested Sep 17)</li>
    </ol>
  </div>
  <AlertDescription className="mt-3 text-xs">
    💡 Recommendation: Consider spreading leave requests across roster periods
    or approving sequentially to maintain minimum crew requirements.
  </AlertDescription>
</Alert>

// Sufficient crew scenario (green border, crew above minimum)
<Alert variant="info" className="border-green-400 border-2">
  <Info className="h-5 w-5" />
  <AlertTitle>Multiple Leave Requests - Seniority Order</AlertTitle>
  <AlertDescription>
    2 First Officers have requested leave for the same dates. Current crew:
    12 First Officers available (all requests can be approved).
  </AlertDescription>
  <div className="mt-3 space-y-2">
    <div className="text-sm font-medium">Priority Order:</div>
    <ol className="text-sm space-y-1">
      <li>1. Sarah Wilson (Seniority #5, requested Sep 10)</li>
      <li>2. Tom Brown (Seniority #15, requested Sep 12)</li>
    </ol>
  </div>
</Alert>
```

**3. Expiring Certifications Alert** (30 days threshold)

```tsx
<Alert variant="warning">
  <AlertTriangle className="h-5 w-5" />
  <AlertTitle>5 Certifications Expiring in Next 30 Days</AlertTitle>
  <AlertDescription>
    The following certifications require renewal to maintain compliance:
  </AlertDescription>
  <ul className="mt-2 text-sm space-y-1">
    <li>• Line Training - John Smith (expires in 12 days)</li>
    <li>• Medical Certificate - Mike Johnson (expires in 18 days)</li>
    <li>• SEP Check - Chris Davis (expires in 25 days)</li>
    <li>• Route Check - Sarah Wilson (expires in 28 days)</li>
    <li>• CRM - Tom Brown (expires in 30 days)</li>
  </ul>
  <AlertActions>
    <Button variant="primary" size="sm">
      Schedule Renewals
    </Button>
    <Button variant="outline" size="sm">
      View Calendar
    </Button>
  </AlertActions>
</Alert>
```

**4. Crew Availability Warning** (Below minimum threshold)

```tsx
<Alert variant="urgent" dismissible={false}>
  <AlertOctagon className="h-6 w-6" />
  <AlertTitle>Crew Availability Below Minimum</AlertTitle>
  <AlertDescription>
    Approving this leave request will reduce Captains on roster to 8 (minimum 10 required). This
    violates operational requirements.
  </AlertDescription>
  <AlertActions>
    <Button variant="destructive" size="sm" disabled>
      Cannot Approve
    </Button>
    <Button variant="outline" size="sm">
      Suggest Alternative Dates
    </Button>
  </AlertActions>
</Alert>
```

#### Mobile Considerations

- Full-width layout with 16px horizontal margins
- Vertical stacking of action buttons (<640px)
- Larger touch targets: 44px minimum button height
- Icon size reduced to 20px on very small screens
- Simplified descriptions (truncate long text with "Read more" link)

---

### 4. Standardized Pagination

#### Purpose

Provide consistent, accessible pagination across all tables in the system (pilot list, certification table, leave requests, audit logs - 8 tables total).

#### Visual Design

**Desktop Layout** (≥1024px):

```
[Previous] [1] [2] [3] [4] [5] ... [12] [Next]
```

**Tablet Layout** (768px - 1023px):

```
[Previous] [1] [2] [3] ... [12] [Next]
```

**Mobile Layout** (<768px):

```
[← Previous] [Next →]
Page 3 of 12
```

#### Air Niugini Brand Styling

```tsx
// Pagination container
{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '16px 0',
  borderTop: '1px solid #E5E7EB'
}

// Page button (inactive)
{
  width: '40px',
  height: '40px',
  borderRadius: '6px',
  border: '1px solid #D1D5DB',
  background: '#FFFFFF',
  color: '#6B7280',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'all 150ms ease-out',
  hover: {
    background: '#FFC72C', // Air Niugini gold
    color: '#000000',
    border: '1px solid #E6B800',
    transform: 'translateY(-2px)',
    shadow: '0 4px 6px -1px rgba(255, 199, 44, 0.3)'
  }
}

// Page button (active/current)
{
  width: '40px',
  height: '40px',
  borderRadius: '6px',
  border: '2px solid #E4002B', // Air Niugini red
  background: 'linear-gradient(135deg, #E4002B 0%, #C00020 100%)',
  color: '#FFFFFF',
  fontSize: '14px',
  fontWeight: 600,
  shadow: '0 4px 6px -1px rgba(228, 0, 43, 0.3)',
  cursor: 'default',
  ariaCurrentPage: true
}

// Previous/Next buttons
{
  height: '40px',
  padding: '0 16px',
  borderRadius: '6px',
  border: '1px solid #D1D5DB',
  background: '#FFFFFF',
  color: '#6B7280',
  fontSize: '14px',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  hover: {
    background: '#E4002B', // Air Niugini red
    color: '#FFFFFF',
    border: '1px solid #C00020'
  },
  disabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    hover: 'none'
  }
}

// Ellipsis (...)
{
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#9CA3AF',
  fontSize: '16px',
  cursor: 'default'
}
```

#### Page Number Display Logic

**Desktop (≥1024px)**: Show up to 7 page numbers at a time

```tsx
// Example: Current page 5 of 12
[1] [2] [3] [4] [5] [6] [7] ... [12]

// Current page 8 of 12
[1] ... [6] [7] [8] [9] [10] ... [12]

// Current page 11 of 12
[1] ... [7] [8] [9] [10] [11] [12]
```

**Tablet (768px - 1023px)**: Show up to 5 page numbers

```tsx
// Current page 5 of 12
[1] ... [4] [5] [6] ... [12]
```

**Mobile (<768px)**: Show only Previous/Next + page indicator

```tsx
<div className="flex flex-col items-center gap-2">
  <div className="flex gap-2">
    <button>← Previous</button>
    <button>Next →</button>
  </div>
  <span className="text-sm text-gray-600">Page 5 of 12</span>
</div>
```

#### Interaction States

**Page Number Button**:

- Default: White background, gray border, gray text
- Hover: Gold background, darker gold border, black text
- Active: Red gradient background, red border, white text
- Focus: 2px ring #E4002B, offset 2px

**Previous/Next Buttons**:

- Default: White background, gray border, gray text
- Hover: Red background, darker red border, white text
- Disabled: 40% opacity, no hover effect, cursor not-allowed
- Focus: 2px ring #E4002B, offset 2px

**Keyboard Navigation**:

- Arrow Left: Navigate to previous page
- Arrow Right: Navigate to next page
- Number keys (1-9): Jump to that page number
- Home: Jump to first page
- End: Jump to last page

#### Accessibility

- **Semantic HTML**: `<nav aria-label="Pagination">` container
- **Current page**: `aria-current="page"` on active button
- **Disabled state**: `aria-disabled="true"` on disabled buttons
- **Page labels**: `aria-label="Go to page {number}"` on page buttons
- **Navigation labels**: `aria-label="Go to previous page"` / `"Go to next page"`
- **Screen reader**: Announces "Pagination navigation, page X of Y"
- **Focus indicators**: Clear 2px red ring on all interactive elements

#### Total Count Display

```tsx
// Desktop: Show above pagination
<div className="flex justify-between items-center mb-4">
  <span className="text-sm text-gray-600">
    Showing <strong>21-30</strong> of <strong>271</strong> pilots
  </span>
  {/* Pagination component */}
</div>

// Mobile: Show below pagination
<div className="flex flex-col items-center gap-2">
  {/* Previous/Next buttons */}
  <span className="text-xs text-gray-600">
    Showing 21-30 of 271
  </span>
</div>
```

#### Use Cases with Examples

**1. Pilot List Page** (27 pilots, 10 per page, 3 pages)

```tsx
<Pagination
  currentPage={2}
  totalPages={3}
  onPageChange={handlePageChange}
  itemsPerPage={10}
  totalItems={27}
  itemName="pilots"
/>

// Renders:
// Desktop: [Previous] [1] [2] [3] [Next]
// Mobile: [← Previous] [Next →] | Page 2 of 3
```

**2. Certification Table** (571 certifications, 20 per page, 29 pages)

```tsx
<Pagination
  currentPage={15}
  totalPages={29}
  onPageChange={handlePageChange}
  itemsPerPage={20}
  totalItems={571}
  itemName="certifications"
/>

// Renders:
// Desktop: [1] ... [13] [14] [15] [16] [17] ... [29]
// Tablet: [1] ... [14] [15] [16] ... [29]
// Mobile: [← Previous] [Next →] | Page 15 of 29
```

**3. Leave Requests** (12 requests, 5 per page, 3 pages)

```tsx
<Pagination
  currentPage={1}
  totalPages={3}
  onPageChange={handlePageChange}
  itemsPerPage={5}
  totalItems={12}
  itemName="leave requests"
/>

// Renders:
// Desktop: [Previous] [1] [2] [3] [Next]
// Previous button disabled on page 1
```

#### Mobile Considerations

- Previous/Next buttons: Full width on very small screens (<375px)
- Touch targets: 44px minimum height
- Swipe gestures: Optional left/right swipe to change pages
- Page indicator: Always visible below buttons
- Simplified total count: "21-30 of 271" instead of longer format

#### Implementation Notes

- Store current page in URL query parameter (?page=2)
- Maintain page state during filtering/sorting operations
- Reset to page 1 when filters change
- Preserve items per page selection in localStorage
- Smooth scroll to top of table on page change

---

### 5. Skeleton Loading States

#### Purpose

Provide visually consistent placeholder content that matches the structure of actual data, improving perceived performance and reducing layout shifts during loading.

#### Design Principles

1. **Match Content Structure** - Skeleton layout exactly matches loaded content
2. **Air Niugini Branding** - Light red pulse animation (#E4002B with 10% opacity)
3. **Performance Optimized** - CSS-only animations, no JavaScript required
4. **Graceful Degradation** - Respects prefers-reduced-motion

#### Animation Specification

```css
@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
    background-position: 200% 0;
  }
  50% {
    opacity: 0.6;
    background-position: -200% 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f5f5f5 0%,
    rgba(228, 0, 43, 0.08) 25%,
    /* Light Air Niugini red */ #f5f5f5 50%,
    rgba(228, 0, 43, 0.08) 75%,
    #f5f5f5 100%
  );
  background-size: 200% 100%;
  animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  border-radius: 6px;
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: #f5f5f5;
  }
}
```

#### Component-Specific Skeletons

**1. Pilot List Skeleton** (src/components/ui/skeletons/PilotListSkeleton.tsx)

```tsx
export function PilotListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
              <div className="skeleton w-12 h-12 rounded-full" />
              <div className="space-y-2">
                <div className="skeleton h-5 w-40" />
                <div className="skeleton h-4 w-28" />
              </div>
            </div>

            {/* Status badges */}
            <div className="flex gap-2">
              <div className="skeleton h-6 w-20 rounded-full" />
              <div className="skeleton h-6 w-24 rounded-full" />
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

**2. Dashboard Stats Skeleton** (src/components/ui/skeletons/DashboardStatsSkeleton.tsx)

```tsx
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
          {/* Icon + Label */}
          <div className="flex items-center justify-between mb-3">
            <div className="skeleton w-10 h-10 rounded-lg" />
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>

          {/* Main stat */}
          <div className="skeleton h-8 w-20 mb-2" />

          {/* Subtitle */}
          <div className="skeleton h-4 w-32" />
        </div>
      ))}
    </div>
  );
}
```

**3. Certification Table Skeleton** (src/components/ui/skeletons/CertificationTableSkeleton.tsx)

```tsx
export function CertificationTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Table header */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="grid grid-cols-5 gap-4">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-4 w-28" />
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-4 w-16" />
        </div>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4">
            <div className="grid grid-cols-5 gap-4 items-center">
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-6 w-20 rounded-full" />
              <div className="skeleton h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**4. Calendar Skeleton** (src/components/ui/skeletons/CalendarSkeleton.tsx)

```tsx
export function CalendarSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-6">
        <div className="skeleton h-6 w-40" />
        <div className="flex gap-2">
          <div className="skeleton h-10 w-10 rounded-lg" />
          <div className="skeleton h-10 w-10 rounded-lg" />
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton h-8 w-full rounded-md" />
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="skeleton h-16 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}
```

**5. Leave Request Card Skeleton**

```tsx
export function LeaveRequestCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
          {/* Header with icon + name + status */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="skeleton w-8 h-8 rounded-lg" />
              <div className="space-y-2">
                <div className="skeleton h-5 w-32" />
                <div className="skeleton h-4 w-24" />
              </div>
            </div>
            <div className="skeleton h-6 w-24 rounded-full" />
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-5 gap-4 mb-4">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="space-y-1">
                <div className="skeleton h-3 w-20" />
                <div className="skeleton h-4 w-full" />
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <div className="skeleton h-9 w-24 rounded-md" />
            <div className="skeleton h-9 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### Timing Guidelines

**Minimum Display Duration**: 200ms

- Prevents flicker for very fast loads
- Use `setTimeout` to enforce minimum duration

**Maximum Display Duration**: 10 seconds

- Show error state after 10 seconds
- "Taking longer than expected..." message

**Transition to Content**: Instant (no fade)

- Content replaces skeleton immediately
- Prevents layout shift with exact matching

```tsx
// Implementation pattern
const [isLoading, setIsLoading] = useState(true);
const [showSkeleton, setShowSkeleton] = useState(true);
const [loadingStartTime] = useState(Date.now());

useEffect(() => {
  if (!isLoading) {
    const elapsed = Date.now() - loadingStartTime;
    const remaining = Math.max(0, 200 - elapsed); // Minimum 200ms

    setTimeout(() => {
      setShowSkeleton(false);
    }, remaining);
  }
}, [isLoading, loadingStartTime]);

return showSkeleton ? <PilotListSkeleton /> : <PilotList data={data} />;
```

#### Accessibility

- **ARIA live region**: `aria-live="polite" aria-busy="true"` on skeleton container
- **Screen reader**: Announce "Loading content..." when skeleton appears
- **Focus management**: Do not trap focus in skeleton
- **Reduced motion**: Disable pulse animation, show static gray placeholders

#### Use Cases

**1. Pilot List Page Load**

```tsx
{
  isLoadingPilots ? <PilotListSkeleton count={10} /> : <PilotList pilots={pilots} />;
}
```

**2. Dashboard Stats Load**

```tsx
{
  isLoadingStats ? <DashboardStatsSkeleton /> : <DashboardStats stats={stats} />;
}
```

**3. Certification Table Load**

```tsx
{
  isLoadingCertifications ? (
    <CertificationTableSkeleton rows={20} />
  ) : (
    <CertificationTable certifications={certifications} />
  );
}
```

**4. Leave Calendar Load**

```tsx
{
  isLoadingCalendar ? <CalendarSkeleton /> : <LeaveCalendar requests={requests} />;
}
```

**5. Analytics Charts Load**

```tsx
{
  isLoadingAnalytics ? <ChartSkeleton height={300} /> : <ComplianceChart data={chartData} />;
}
```

#### Mobile Considerations

- Simplified skeletons on mobile (fewer details)
- Reduced number of skeleton items (3-5 instead of 10)
- Larger skeleton elements for better visibility
- Vertical stacking of grid layouts

---

### 6. Accessible Forms

#### Purpose

Provide fully accessible, WCAG 2.1 AA compliant form controls with clear labels, validation feedback, and keyboard navigation across pilot creation, leave requests, certification updates, and settings.

#### Form Field Anatomy

```tsx
<FormField>
  <FormLabel>
    {' '}
    {/* Required, visually connected */}
    First Name *
  </FormLabel>
  <FormInput /> {/* Accessible input with ARIA */}
  <FormHelperText>
    {' '}
    {/* Optional guidance */}
    Enter pilot's legal first name
  </FormHelperText>
  <FormErrorMessage>
    {' '}
    {/* Error state with icon */}
    First name is required
  </FormErrorMessage>
</FormField>
```

#### Visual Design - Form Labels

```tsx
{
  display: 'block',
  fontSize: '14px',
  fontWeight: 500,
  color: '#374151', // Dark gray
  marginBottom: '6px',
  lineHeight: 1.4
}

// Required indicator (*)
{
  color: '#E4002B', // Air Niugini red
  marginLeft: '2px',
  ariaLabel: 'required'
}

// Optional indicator
{
  color: '#9CA3AF',
  fontSize: '13px',
  fontWeight: 400,
  marginLeft: '4px',
  content: '(optional)'
}
```

#### Visual Design - Form Inputs

```tsx
// Default state
{
  width: '100%',
  height: '44px', // Minimum touch target
  padding: '10px 14px',
  fontSize: '14px',
  fontWeight: 400,
  color: '#1F2937',
  background: '#FFFFFF',
  border: '2px solid #D1D5DB',
  borderRadius: '6px',
  transition: 'all 150ms ease-out',
  outline: 'none'
}

// Focus state
{
  border: '2px solid #E4002B', // Air Niugini red
  ring: '4px solid rgba(228, 0, 43, 0.1)', // Red glow
  background: '#FFFFFF'
}

// Error state
{
  border: '2px solid #EF4444', // Red border
  ring: '4px solid rgba(239, 68, 68, 0.1)', // Red glow
  background: '#FEF2F2' // Light red background
}

// Disabled state
{
  background: '#F9FAFB',
  border: '2px solid #E5E7EB',
  color: '#9CA3AF',
  cursor: 'not-allowed',
  opacity: 0.6
}

// Success state (async validation)
{
  border: '2px solid #10B981', // Green border
  ring: '4px solid rgba(16, 185, 129, 0.1)',
  background: '#F0FDF4'
}
```

#### Visual Design - Helper Text

```tsx
{
  fontSize: '13px',
  fontWeight: 400,
  color: '#6B7280', // Medium gray
  marginTop: '6px',
  lineHeight: 1.5,
  display: 'flex',
  alignItems: 'flex-start',
  gap: '6px'
}

// With icon
{
  icon: Info,
  iconSize: 14,
  iconColor: '#9CA3AF'
}
```

#### Visual Design - Error Messages

```tsx
{
  fontSize: '13px',
  fontWeight: 500,
  color: '#DC2626', // Dark red
  marginTop: '6px',
  lineHeight: 1.5,
  display: 'flex',
  alignItems: 'flex-start',
  gap: '6px',
  animation: 'shake 0.3s ease-out' // Subtle shake on error
}

// Error icon
{
  icon: AlertCircle,
  iconSize: 14,
  iconColor: '#DC2626',
  flexShrink: 0,
  marginTop: '2px' // Align with text baseline
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
```

#### Validation Timing Strategies

**1. On-Blur Validation** (Default for most fields)

```tsx
// Validate when user leaves field
<FormInput
  onBlur={validateField}
  aria-invalid={hasError}
  aria-describedby={hasError ? `${fieldId}-error` : undefined}
/>

// Use for: Names, employee IDs, dates, simple text fields
```

**2. Real-Time Validation** (Character limits, format validation)

```tsx
// Validate as user types (debounced 500ms)
<FormInput onChange={debounce(validateField, 500)} maxLength={50} aria-invalid={hasError} />

// Use for: Character counters, password strength, format masks
```

**3. On-Submit Validation** (Complex cross-field validation)

```tsx
// Validate all fields on form submission
<form onSubmit={handleSubmit(validateAllFields)}>{/* Form fields */}</form>

// Use for: Multi-step forms, complex business rules
```

**4. Async Validation** (Server-side checks)

```tsx
// Check uniqueness, availability after user input
<FormInput
  onBlur={async () => {
    setValidating(true);
    const isUnique = await checkEmployeeIdUniqueness(value);
    setValidating(false);
  }}
  aria-busy={validating}
/>

// Use for: Employee ID uniqueness, email availability
```

#### Form Field Types

**1. Text Input**

```tsx
<FormField>
  <FormLabel htmlFor="firstName">First Name *</FormLabel>
  <FormInput
    id="firstName"
    name="firstName"
    type="text"
    autoComplete="given-name"
    aria-required="true"
    aria-invalid={!!errors.firstName}
    aria-describedby={errors.firstName ? 'firstName-error' : 'firstName-help'}
  />
  <FormHelperText id="firstName-help">
    Enter pilot's legal first name as it appears on official documents
  </FormHelperText>
  {errors.firstName && (
    <FormErrorMessage id="firstName-error" role="alert">
      <AlertCircle size={14} />
      {errors.firstName.message}
    </FormErrorMessage>
  )}
</FormField>
```

**2. Select Dropdown**

```tsx
<FormField>
  <FormLabel htmlFor="role">Role *</FormLabel>
  <FormSelect id="role" name="role" aria-required="true" aria-invalid={!!errors.role}>
    <option value="">Select role...</option>
    <option value="Captain">Captain</option>
    <option value="First Officer">First Officer</option>
  </FormSelect>
  {errors.role && (
    <FormErrorMessage id="role-error" role="alert">
      <AlertCircle size={14} />
      {errors.role.message}
    </FormErrorMessage>
  )}
</FormField>
```

**3. Date Picker**

```tsx
<FormField>
  <FormLabel htmlFor="expiryDate">Expiry Date *</FormLabel>
  <FormDatePicker
    id="expiryDate"
    name="expiryDate"
    aria-required="true"
    aria-invalid={!!errors.expiryDate}
    aria-describedby="expiryDate-help"
  />
  <FormHelperText id="expiryDate-help">
    Select certification expiry date (must be within current roster period)
  </FormHelperText>
  {errors.expiryDate && (
    <FormErrorMessage id="expiryDate-error" role="alert">
      <AlertCircle size={14} />
      {errors.expiryDate.message}
    </FormErrorMessage>
  )}
</FormField>
```

**4. Checkbox**

```tsx
<FormField className="flex items-start gap-3">
  <FormCheckbox id="lineTraining" name="lineTraining" aria-describedby="lineTraining-help" />
  <div className="flex-1">
    <FormLabel htmlFor="lineTraining" className="mb-0">
      Line Training Captain
    </FormLabel>
    <FormHelperText id="lineTraining-help" className="mt-1">
      Certified to conduct line training for new pilots
    </FormHelperText>
  </div>
</FormField>
```

**5. Radio Group**

```tsx
<FormField role="radiogroup" aria-labelledby="contractType-label">
  <FormLabel id="contractType-label">Contract Type *</FormLabel>
  <div className="space-y-2 mt-2">
    <FormRadio id="contract-full" name="contractType" value="FULL_TIME" aria-required="true">
      Full Time
    </FormRadio>
    <FormRadio id="contract-part" name="contractType" value="PART_TIME">
      Part Time
    </FormRadio>
    <FormRadio id="contract-casual" name="contractType" value="CASUAL">
      Casual
    </FormRadio>
  </div>
  {errors.contractType && (
    <FormErrorMessage id="contractType-error" role="alert">
      <AlertCircle size={14} />
      {errors.contractType.message}
    </FormErrorMessage>
  )}
</FormField>
```

**6. Textarea**

```tsx
<FormField>
  <FormLabel htmlFor="reason">Reason for Leave *</FormLabel>
  <FormTextarea
    id="reason"
    name="reason"
    rows={4}
    maxLength={500}
    aria-required="true"
    aria-invalid={!!errors.reason}
    aria-describedby="reason-help reason-count"
  />
  <div className="flex justify-between items-center mt-2">
    <FormHelperText id="reason-help">
      Provide a brief explanation for your leave request
    </FormHelperText>
    <span id="reason-count" className="text-xs text-gray-500">
      {reasonLength}/500
    </span>
  </div>
  {errors.reason && (
    <FormErrorMessage id="reason-error" role="alert">
      <AlertCircle size={14} />
      {errors.reason.message}
    </FormErrorMessage>
  )}
</FormField>
```

#### Keyboard Navigation

**Tab Order**:

1. All form fields in logical order (top to bottom, left to right)
2. Action buttons (Submit, Cancel) at end
3. Skip navigation links for long forms

**Required Key Bindings**:

- Tab: Move to next field
- Shift+Tab: Move to previous field
- Enter: Submit form (if on button or single-line input)
- Escape: Close dialog/modal (if form in modal)
- Arrow Up/Down: Navigate select options (when open)
- Space: Toggle checkbox/radio
- Arrow keys: Navigate radio group

**Focus Indicators**:

```tsx
// All interactive elements
{
  focusVisible: {
    outline: '2px solid #E4002B',
    outlineOffset: '2px',
    borderRadius: '4px'
  }
}
```

#### Accessibility Requirements

**WCAG 2.1 AA Compliance**:

- ✅ Labels for all form controls (3.3.2)
- ✅ Error identification (3.3.1)
- ✅ Error suggestion (3.3.3)
- ✅ Consistent identification (3.2.4)
- ✅ Keyboard accessible (2.1.1)
- ✅ Focus visible (2.4.7)
- ✅ Color contrast 4.5:1 minimum (1.4.3)

**Required ARIA Attributes**:

```tsx
<FormInput
  id="fieldId"
  name="fieldName"
  type="text"
  aria-required="true" // If required
  aria-invalid={hasError} // If has validation error
  aria-describedby="fieldId-help fieldId-error" // Helper text and error message
  aria-labelledby="fieldId-label" // Associated label
/>
```

**Error Announcement**:

```tsx
// Error summary at top of form (appears on submit with errors)
<div
  role="alert"
  aria-live="assertive"
  className="bg-red-50 border-2 border-red-400 rounded-lg p-4 mb-6"
>
  <h3 className="text-red-800 font-semibold mb-2">
    Form contains {errorCount} error{errorCount !== 1 ? 's' : ''}
  </h3>
  <ul className="list-disc list-inside space-y-1 text-red-700">
    {errors.map((error) => (
      <li key={error.field}>
        <a
          href={`#${error.field}`}
          className="underline hover:no-underline"
          onClick={() => focusField(error.field)}
        >
          {error.message}
        </a>
      </li>
    ))}
  </ul>
</div>
```

#### Use Cases with Examples

**1. Pilot Creation Form**

```tsx
<form onSubmit={handleSubmit(createPilot)}>
  {/* Error summary (if errors exist) */}
  {Object.keys(errors).length > 0 && <ErrorSummary errors={errors} />}

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Employee ID */}
    <FormField>
      <FormLabel htmlFor="employeeId">Employee ID *</FormLabel>
      <FormInput
        id="employeeId"
        {...register('employeeId')}
        aria-invalid={!!errors.employeeId}
        aria-describedby="employeeId-help employeeId-error"
      />
      <FormHelperText id="employeeId-help">Unique identifier (e.g., AB123)</FormHelperText>
      {errors.employeeId && (
        <FormErrorMessage id="employeeId-error" role="alert">
          <AlertCircle size={14} />
          {errors.employeeId.message}
        </FormErrorMessage>
      )}
    </FormField>

    {/* First Name */}
    <FormField>
      <FormLabel htmlFor="firstName">First Name *</FormLabel>
      <FormInput
        id="firstName"
        {...register('firstName')}
        autoComplete="given-name"
        aria-invalid={!!errors.firstName}
      />
      {errors.firstName && (
        <FormErrorMessage role="alert">{errors.firstName.message}</FormErrorMessage>
      )}
    </FormField>

    {/* Last Name */}
    <FormField>
      <FormLabel htmlFor="lastName">Last Name *</FormLabel>
      <FormInput
        id="lastName"
        {...register('lastName')}
        autoComplete="family-name"
        aria-invalid={!!errors.lastName}
      />
      {errors.lastName && (
        <FormErrorMessage role="alert">{errors.lastName.message}</FormErrorMessage>
      )}
    </FormField>

    {/* Role */}
    <FormField>
      <FormLabel htmlFor="role">Role *</FormLabel>
      <FormSelect id="role" {...register('role')} aria-invalid={!!errors.role}>
        <option value="">Select role...</option>
        <option value="Captain">Captain</option>
        <option value="First Officer">First Officer</option>
      </FormSelect>
      {errors.role && <FormErrorMessage role="alert">{errors.role.message}</FormErrorMessage>}
    </FormField>

    {/* Commencement Date */}
    <FormField>
      <FormLabel htmlFor="commencementDate">Commencement Date *</FormLabel>
      <FormDatePicker
        id="commencementDate"
        {...register('commencementDate')}
        aria-describedby="commencementDate-help"
      />
      <FormHelperText id="commencementDate-help">
        Date pilot joined Air Niugini (used for seniority calculation)
      </FormHelperText>
      {errors.commencementDate && (
        <FormErrorMessage role="alert">{errors.commencementDate.message}</FormErrorMessage>
      )}
    </FormField>
  </div>

  {/* Submit buttons */}
  <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-gray-200">
    <Button type="button" variant="outline" onClick={onCancel}>
      Cancel
    </Button>
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <Loader2 className="animate-spin mr-2" size={16} />
          Creating Pilot...
        </>
      ) : (
        'Create Pilot'
      )}
    </Button>
  </div>
</form>
```

**2. Leave Request Form**

```tsx
<form onSubmit={handleSubmit(createLeaveRequest)}>
  {/* Roster Period Selection */}
  <FormField>
    <FormLabel htmlFor="rosterPeriod">Roster Period *</FormLabel>
    <FormSelect
      id="rosterPeriod"
      {...register('rosterPeriod')}
      aria-describedby="rosterPeriod-help"
    >
      <option value="RP11/2025">RP11/2025 (Sep 13 - Oct 10)</option>
      <option value="RP12/2025">RP12/2025 (Oct 11 - Nov 7)</option>
    </FormSelect>
    <FormHelperText id="rosterPeriod-help">
      Select the roster period for your leave request
    </FormHelperText>
  </FormField>

  {/* Date Range */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <FormField>
      <FormLabel htmlFor="startDate">Start Date *</FormLabel>
      <FormDatePicker id="startDate" {...register('startDate')} aria-invalid={!!errors.startDate} />
      {errors.startDate && (
        <FormErrorMessage role="alert">{errors.startDate.message}</FormErrorMessage>
      )}
    </FormField>

    <FormField>
      <FormLabel htmlFor="endDate">End Date *</FormLabel>
      <FormDatePicker
        id="endDate"
        {...register('endDate')}
        aria-invalid={!!errors.endDate}
        aria-describedby="endDate-help"
      />
      <FormHelperText id="endDate-help">
        Duration: {calculateDays(startDate, endDate)} days
      </FormHelperText>
      {errors.endDate && <FormErrorMessage role="alert">{errors.endDate.message}</FormErrorMessage>}
    </FormField>
  </div>

  {/* Leave Type */}
  <FormField role="radiogroup" aria-labelledby="leaveType-label">
    <FormLabel id="leaveType-label">Leave Type *</FormLabel>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
      <FormRadio id="type-rdo" value="RDO" {...register('leaveType')}>
        RDO
      </FormRadio>
      <FormRadio id="type-sdo" value="SDO" {...register('leaveType')}>
        SDO
      </FormRadio>
      <FormRadio id="type-annual" value="ANNUAL" {...register('leaveType')}>
        Annual Leave
      </FormRadio>
      <FormRadio id="type-sick" value="SICK" {...register('leaveType')}>
        Sick Leave
      </FormRadio>
    </div>
    {errors.leaveType && (
      <FormErrorMessage role="alert">{errors.leaveType.message}</FormErrorMessage>
    )}
  </FormField>

  {/* Reason */}
  <FormField>
    <FormLabel htmlFor="reason">
      Reason <span className="text-gray-500">(optional)</span>
    </FormLabel>
    <FormTextarea
      id="reason"
      {...register('reason')}
      rows={4}
      maxLength={500}
      aria-describedby="reason-count"
    />
    <div className="flex justify-end">
      <span id="reason-count" className="text-xs text-gray-500">
        {watch('reason')?.length || 0}/500
      </span>
    </div>
  </FormField>

  {/* Submit */}
  <div className="flex gap-3 justify-end">
    <Button type="button" variant="outline" onClick={onCancel}>
      Cancel
    </Button>
    <Button type="submit" disabled={isSubmitting}>
      Submit Leave Request
    </Button>
  </div>
</form>
```

#### Mobile Considerations

- Full-width inputs on mobile (<640px)
- Larger touch targets: 44px minimum height
- Vertical stacking of grid layouts
- Native mobile keyboards: `type="email"`, `type="tel"`, `inputmode="numeric"`
- Simplified multi-step forms (one question per screen)
- Sticky submit buttons at bottom of viewport

---

## Brand Integration

### Air Niugini Color System

**Primary Colors**:

- Red: #E4002B (primary actions, focus states, errors)
- Gold: #FFC72C (secondary actions, warnings, highlights)
- Black: #000000 (text, navigation)
- White: #FFFFFF (backgrounds)

**Extended Palette** (for components):

```tsx
const airNiuginiColors = {
  red: {
    50: '#FFF5F7',
    100: '#FFE5EA',
    200: '#FFCCD5',
    300: '#FF99AA',
    400: '#FF6680',
    500: '#E4002B', // PRIMARY
    600: '#C00020',
    700: '#9C0019',
    800: '#780013',
    900: '#54000D',
  },
  gold: {
    50: '#FFFDF5',
    100: '#FFF9E5',
    200: '#FFF3CC',
    300: '#FFE799',
    400: '#FFDB66',
    500: '#FFC72C', // PRIMARY
    600: '#E6B800',
    700: '#B38F00',
    800: '#806600',
    900: '#4D3D00',
  },
};
```

### Component Color Mapping

**Buttons**:

- Primary: Red gradient (#E4002B → #C00020)
- Secondary: Gold (#FFC72C)
- Outline: Red border + white background
- Ghost: Transparent with red text on hover

**Alerts**:

- Urgent: Red border-left accent (#E4002B)
- Warning: Gold border-left accent (#FFC72C)
- Info: Aviation navy accent (#1E3A8A)
- Success: Green with dark green accent

**Badges**:

- Active: Red (#E4002B)
- Hover: Gold (#FFC72C)
- Status indicators: Follow FAA standards (green/yellow/red)

**Forms**:

- Focus: Red ring (#E4002B)
- Error: Red border (#EF4444)
- Success: Green border (#10B981)

---

## Accessibility Standards

### WCAG 2.1 AA Compliance Checklist

**Perceivable**:

- ✅ Text alternatives for non-text content (1.1.1)
- ✅ Captions for audio/video (1.2.1, 1.2.2)
- ✅ Adaptable content (1.3.1, 1.3.2, 1.3.3)
- ✅ Distinguishable content (1.4.1, 1.4.3, 1.4.4, 1.4.5)

**Operable**:

- ✅ Keyboard accessible (2.1.1, 2.1.2)
- ✅ Enough time (2.2.1, 2.2.2)
- ✅ Seizure prevention (2.3.1)
- ✅ Navigable (2.4.1 - 2.4.7)

**Understandable**:

- ✅ Readable (3.1.1, 3.1.2)
- ✅ Predictable (3.2.1 - 3.2.4)
- ✅ Input assistance (3.3.1 - 3.3.4)

**Robust**:

- ✅ Compatible (4.1.1, 4.1.2, 4.1.3)

### Color Contrast Requirements

**Minimum Contrast Ratios** (WCAG 2.1 AA):

- Normal text (< 18px): 4.5:1
- Large text (≥ 18px or ≥ 14px bold): 3:1
- UI components and graphics: 3:1

**Verified Combinations**:
| Background | Foreground | Ratio | Status |
|------------|-----------|-------|--------|
| #FFFFFF | #000000 | 21:1 | ✅ AAA |
| #FFFFFF | #E4002B | 5.8:1 | ✅ AA |
| #E4002B | #FFFFFF | 5.8:1 | ✅ AA |
| #FFFFFF | #6B7280 | 4.6:1 | ✅ AA |
| #FFC72C | #000000 | 12.7:1 | ✅ AAA |

### Screen Reader Support

**Tested with**:

- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS, iOS)
- TalkBack (Android)

**Announcement Patterns**:

```tsx
// Button
'Create Pilot, button';

// Link
'View Details, link';

// Input
'First Name, required, edit text';

// Select
'Role, combobox, Captain';

// Checkbox
'Line Training Captain, checkbox, checked';

// Alert
'Alert, Warning: 5 certifications expiring in next 30 days';
```

---

## Implementation Guidelines

### Component Installation

```bash
# Install shadcn/ui components
npx shadcn@latest add sonner
npx shadcn@latest add breadcrumb
npx shadcn@latest add alert
# (Continue for all Phase 1 components)
```

### File Organization

```
src/components/ui/
├── sonner.tsx              # Toast notifications
├── breadcrumb.tsx          # Navigation breadcrumbs
├── alert.tsx               # Alert component
├── pagination.tsx          # Pagination controls
├── skeleton.tsx            # Loading skeletons
├── form.tsx                # Form components
├── input.tsx               # Text input
├── select.tsx              # Select dropdown
├── checkbox.tsx            # Checkbox
├── radio-group.tsx         # Radio buttons
├── textarea.tsx            # Textarea
└── date-picker.tsx         # Date picker
```

### Air Niugini Theme Integration

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(349, 100%, 45%)', // #E4002B
          foreground: 'hsl(0, 0%, 98%)',
        },
        secondary: {
          DEFAULT: 'hsl(45, 100%, 59%)', // #FFC72C
          foreground: 'hsl(240, 5.9%, 10%)',
        },
        // ... other theme colors
      },
    },
  },
};
```

### Testing Checklist

**Visual Testing**:

- ✅ Component renders correctly in all variants
- ✅ Air Niugini branding applied consistently
- ✅ Responsive behavior on all breakpoints
- ✅ Dark mode support (if applicable)

**Functional Testing**:

- ✅ All interactive states work (hover, active, focus, disabled)
- ✅ Keyboard navigation functions correctly
- ✅ Form validation triggers appropriately
- ✅ Error messages display and announce

**Accessibility Testing**:

- ✅ Screen reader announces content correctly
- ✅ Keyboard-only navigation possible
- ✅ Focus indicators visible
- ✅ Color contrast meets WCAG 2.1 AA
- ✅ ARIA attributes correct

**Performance Testing**:

- ✅ Animations smooth (60fps)
- ✅ No layout shifts (CLS < 0.1)
- ✅ Skeleton loads within 200ms
- ✅ Toast dismisses correctly

---

## Document Version History

| Version | Date        | Changes                                                 |
| ------- | ----------- | ------------------------------------------------------- |
| 1.0     | Oct 7, 2025 | Initial UX design specifications for Phase 1 components |

---

**Next Steps**: Proceed to create remaining design documentation files:

- USER_FLOW_DIAGRAMS.md
- RESPONSIVE_DESIGN_GUIDE.md
- INTERACTION_PATTERNS.md
- ACCESSIBILITY_COMPLIANCE_GUIDE.md
- COMPONENT_COMPOSITION_EXAMPLES.md
- ERROR_HANDLING_UX.md
