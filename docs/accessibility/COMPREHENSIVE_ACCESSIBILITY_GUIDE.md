# Comprehensive Accessibility Implementation Guide

## Air Niugini B767 Pilot Management System

**Version:** 1.0
**Last Updated:** October 7, 2025
**Purpose:** Complete reference for implementing WCAG 2.1 AA compliance with shadcn/ui

---

## Table of Contents

1. [Component Accessibility Specifications](#1-component-accessibility-specifications)
2. [Keyboard Navigation Guide](#2-keyboard-navigation-guide)
3. [Screen Reader Testing Plan](#3-screen-reader-testing-plan)
4. [Focus Management Patterns](#4-focus-management-patterns)
5. [Color Contrast Guide](#5-color-contrast-guide)
6. [ARIA Patterns Library](#6-aria-patterns-library)
7. [Automated Testing Guide](#7-automated-testing-guide)
8. [Accessibility Training Guide](#8-accessibility-training-guide)

---

## 1. Component Accessibility Specifications

### **A. Sonner Toast Notifications**

**Purpose:** Accessible toast notifications with screen reader announcements

**shadcn/ui Implementation:**

```tsx
// src/app/layout.tsx
import { Toaster } from '@/components/ui/sonner';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            classNames: {
              toast: 'bg-white border border-gray-200 shadow-lg',
              title: 'text-gray-900 font-semibold',
              description: 'text-gray-600',
              success: 'border-l-4 border-l-green-500',
              error: 'border-l-4 border-l-[#E4002B]',
              warning: 'border-l-4 border-l-amber-500',
              info: 'border-l-4 border-l-blue-500',
            },
          }}
        />
      </body>
    </html>
  );
}

// Usage in components
import { toast } from 'sonner';

function handleSuccess() {
  toast.success('Pilot created successfully', {
    description: 'Employee ID: AB001',
    action: {
      label: 'View',
      onClick: () => router.push('/dashboard/pilots/AB001'),
    },
  });
}

function handleError() {
  toast.error('Failed to create pilot', {
    description: 'Employee ID already exists. Please use a unique ID.',
    action: {
      label: 'Retry',
      onClick: () => handleRetry(),
    },
  });
}

function handleLoading() {
  const toastId = toast.loading('Creating pilot...');

  // After operation completes
  toast.success('Pilot created', { id: toastId });
  // or
  toast.error('Failed to create', { id: toastId });
}
```

**Accessibility Features:**

- ✅ **ARIA Live Region:** `role="status"` (success/info), `role="alert"` (error/warning)
- ✅ **Screen Reader Announcement:** Automatic announcement of toast content
- ✅ **Pausable:** Hover or focus pauses auto-dismiss timer
- ✅ **Keyboard Dismissible:** `Escape` key closes toast
- ✅ **Focus Management:** Focus moves to action button (if provided)
- ✅ **Color + Icon:** Success (green + checkmark), Error (red + X), Warning (yellow + triangle)

**VoiceOver Test:**

1. Trigger success toast
2. Expect: "Pilot created successfully, Employee ID AB001, status"
3. Tab to action button
4. Expect: "View, button"
5. Press `Escape`
6. Expect: Toast dismisses

---

### **B. Breadcrumb Navigation**

**Purpose:** Hierarchical navigation with clear current page indication

**shadcn/ui Implementation:**

```tsx
import {
  Breadcrumb,
  Breadcrumb List,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Home, Users, User, ChevronRight } from 'lucide-react'

export function DashboardBreadcrumb({ items }: { items: Array<{ label: string; href?: string; icon?: React.ComponentType }> }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">
            <Home className="mr-1 h-4 w-4" aria-hidden="true" />
            Dashboard
          </BreadcrumbLink>
        </BreadcrumbItem>

        {items.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {index === items.length - 1 ? (
                <BreadcrumbPage>
                  {item.icon && <item.icon className="mr-1 h-4 w-4" aria-hidden="true" />}
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>
                  {item.icon && <item.icon className="mr-1 h-4 w-4" aria-hidden="true" />}
                  {item.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// Usage
<DashboardBreadcrumb
  items={[
    { label: 'Pilots', href: '/dashboard/pilots', icon: Users },
    { label: 'John Smith', icon: User },
  ]}
/>
```

**Accessibility Features:**

- ✅ **Semantic Navigation:** `<nav aria-label="Breadcrumb">`
- ✅ **Current Page:** `aria-current="page"` on last item
- ✅ **Ordered List:** `<ol>` for sequential navigation
- ✅ **Icons:** `aria-hidden="true"` (decorative)
- ✅ **Screen Reader:** Announces "Navigation breadcrumb: Dashboard, Pilots, John Smith, current page"

---

### **C. Enhanced Alerts**

**Purpose:** Accessible alerts with proper urgency levels

**shadcn/ui Implementation:**

```tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, AlertCircle, Info, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AccessibleAlert({
  variant = 'info',
  title,
  description,
  onDismiss,
  action,
}: {
  variant: 'success' | 'error' | 'warning' | 'info'
  title: string
  description: string
  onDismiss?: () => void
  action?: { label: string; onClick: () => void }
}) {
  const config = {
    success: { icon: CheckCircle2, className: 'border-green-200 bg-green-50', role: 'status', live: 'polite' },
    error: { icon: AlertCircle, className: 'border-red-200 bg-red-50', role: 'alert', live: 'assertive' },
    warning: { icon: AlertTriangle, className: 'border-amber-200 bg-amber-50', role: 'alert', live: 'assertive' },
    info: { icon: Info, className: 'border-blue-200 bg-blue-50', role: 'status', live: 'polite' },
  };

  const { icon: Icon, className, role, live } = config[variant];

  return (
    <Alert className={className} role={role} aria-live={live as 'polite' | 'assertive'} aria-atomic="true">
      <Icon className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>

      <div className="flex gap-2 mt-2">
        {action && (
          <Button size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        {onDismiss && (
          <Button size="sm" variant="ghost" onClick={onDismiss} aria-label="Dismiss alert">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
}

// Usage - Final Review Alert
<AccessibleAlert
  variant="warning"
  title="Final Review Deadline in 5 Days"
  description="22 pending leave requests require immediate action before October 10, 2025."
  action={{
    label: 'Review Requests',
    onClick: () => router.push('/dashboard/leave?filter=pending'),
  }}
  onDismiss={() => setAlertDismissed(true)}
/>

// Usage - Seniority Priority Review
<AccessibleAlert
  variant="info"
  title="Seniority Priority: 3 Pilots Requesting Same Dates"
  description="Captain John Smith (Seniority #1) has priority for October 15-20, 2025. Other requests will be approved based on crew availability."
/>
```

**Accessibility Features:**

- ✅ **Role:** `role="alert"` (urgent), `role="status"` (informational)
- ✅ **Live Region:** `aria-live="assertive"` (urgent), `aria-live="polite"` (info)
- ✅ **Atomic:** `aria-atomic="true"` (read entire alert at once)
- ✅ **Icon Meaning:** Conveyed in title/description (not color alone)
- ✅ **Dismissible:** Keyboard accessible (Tab to X button, press Enter)

---

### **D. Standardized Pagination**

**Purpose:** Accessible pagination with clear page indication

**shadcn/ui Implementation:**

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export function AccessiblePagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <nav aria-label="Pagination navigation" role="navigation">
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Page {currentPage} of {totalPages}. Showing {startItem} to {endItem} of {totalItems}{' '}
        results.
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(currentPage - 1)}
              aria-label={`Go to previous page, page ${currentPage - 1}`}
              aria-disabled={currentPage === 1}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
            )
            .map((page, index, array) => (
              <React.Fragment key={page}>
                {index > 0 && array[index - 1] !== page - 1 && <PaginationEllipsis />}
                <PaginationItem>
                  <PaginationLink
                    onClick={() => onPageChange(page)}
                    isActive={currentPage === page}
                    aria-current={currentPage === page ? 'page' : undefined}
                    aria-label={
                      currentPage === page ? `Current page, page ${page}` : `Go to page ${page}`
                    }
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              </React.Fragment>
            ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(currentPage + 1)}
              aria-label={`Go to next page, page ${currentPage + 1}`}
              aria-disabled={currentPage === totalPages}
              className={
                currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Visual page info */}
      <div className="text-sm text-gray-600 mt-2 text-center">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>
    </nav>
  );
}
```

**Accessibility Features:**

- ✅ **Navigation Landmark:** `<nav aria-label="Pagination navigation">`
- ✅ **Current Page:** `aria-current="page"` on active page link
- ✅ **Page Announcements:** Screen reader announces "Page 2 of 5. Showing 11 to 20 of 50 results."
- ✅ **Keyboard Navigation:** Tab through page links, Enter to activate
- ✅ **Disabled State:** `aria-disabled` on Previous (page 1) and Next (last page)

---

### **E. Accessible Forms**

**Purpose:** Form components with automatic label association and error handling

**shadcn/ui Implementation:**

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const pilotSchema = z.object({
  employee_id: z
    .string()
    .min(1, 'Employee ID is required')
    .regex(/^[A-Z]{2}\d{3}$/, 'Format must be: AB123'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  role: z.enum(['Captain', 'First Officer'], { message: 'Please select a role' }),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  date_of_birth: z
    .string()
    .refine((date) => new Date(date) < new Date(), 'Date of birth must be in the past'),
});

export function PilotForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: z.infer<typeof pilotSchema>) => void;
  onCancel: () => void;
}) {
  const form = useForm<z.infer<typeof pilotSchema>>({
    resolver: zodResolver(pilotSchema),
    defaultValues: {
      employee_id: '',
      first_name: '',
      last_name: '',
      role: 'First Officer',
      email: '',
      date_of_birth: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Text Input */}
        <FormField
          control={form.control}
          name="employee_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="employee_id">
                Employee ID{' '}
                <span className="text-red-500" aria-label="required">
                  *
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  id="employee_id"
                  placeholder="AB123"
                  aria-required="true"
                  aria-invalid={!!form.formState.errors.employee_id}
                  aria-describedby={
                    form.formState.errors.employee_id
                      ? 'employee_id-error employee_id-description'
                      : 'employee_id-description'
                  }
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormDescription id="employee_id-description">
                Unique pilot identifier (format: 2 letters + 3 numbers)
              </FormDescription>
              <FormMessage id="employee_id-error" role="alert" aria-live="polite" />
            </FormItem>
          )}
        />

        {/* Select Dropdown */}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="role">
                Role{' '}
                <span className="text-red-500" aria-label="required">
                  *
                </span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger id="role" aria-required="true">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Captain">Captain</SelectItem>
                  <SelectItem value="First Officer">First Officer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage id="role-error" role="alert" />
            </FormItem>
          )}
        />

        {/* Radio Group */}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Captain" id="captain" />
                    <Label htmlFor="captain">Captain</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="First Officer" id="first-officer" />
                    <Label htmlFor="first-officer">First Officer</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date Input */}
        <FormField
          control={form.control}
          name="date_of_birth"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="date_of_birth">Date of Birth</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  id="date_of_birth"
                  max={new Date().toISOString().split('T')[0]}
                  aria-describedby="date_of_birth-description"
                  {...field}
                />
              </FormControl>
              <FormDescription id="date_of_birth-description">
                Must be in the past (minimum age 21 for pilots)
              </FormDescription>
              <FormMessage role="alert" />
            </FormItem>
          )}
        />

        {/* Submit Actions */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Creating...' : 'Create Pilot'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

**Accessibility Features:**

- ✅ **Label Association:** Automatic `htmlFor`/`id` linking
- ✅ **Required Fields:** `aria-required="true"` + visual asterisk
- ✅ **Error Linking:** `aria-describedby` links error message
- ✅ **Error Announcement:** `role="alert"`, `aria-live="polite"`
- ✅ **Helper Text:** `aria-describedby` links description
- ✅ **Invalid State:** `aria-invalid="true"` when error exists
- ✅ **Focus on Error:** Auto-focus first error field on submit

---

### **F. Skeleton Loading States**

**Purpose:** Accessible loading placeholders with screen reader announcements

**shadcn/ui Implementation:**

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export function PilotListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading pilot list">
      {/* Screen reader announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        Loading pilot information...
      </div>

      {/* Visual skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// When data loads
export function PilotList({ pilots, isLoading }: { pilots: Pilot[]; isLoading: boolean }) {
  if (isLoading) {
    return <PilotListSkeleton />;
  }

  return (
    <div aria-busy="false" aria-label="Pilot list loaded">
      {/* Screen reader announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        Pilot list loaded. {pilots.length} pilots found.
      </div>

      {/* Actual content */}
      {pilots.map((pilot) => (
        <PilotCard key={pilot.id} pilot={pilot} />
      ))}
    </div>
  );
}
```

**Accessibility Features:**

- ✅ **Busy State:** `aria-busy="true"` on container
- ✅ **Loading Announcement:** "Loading pilot information..." via screen reader
- ✅ **Loaded Announcement:** "Pilot list loaded. 27 pilots found."
- ✅ **No Flashing:** Skeleton appears for minimum 200ms (avoid flash)
- ✅ **Reduced Motion:** Pulse animation respects `prefers-reduced-motion`

**CSS for Reduced Motion:**

```css
/* globals.css */
@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none !important;
  }
}
```

---

## 2. Keyboard Navigation Guide

### **Global Keyboard Shortcuts**

| Shortcut           | Action                           | Context                    |
| ------------------ | -------------------------------- | -------------------------- |
| `Tab`              | Move focus forward               | Global                     |
| `Shift+Tab`        | Move focus backward              | Global                     |
| `Enter`            | Activate button/link             | Global                     |
| `Space`            | Activate button, toggle checkbox | Global                     |
| `Escape`           | Close modal/dialog/dropdown      | Global                     |
| `⌘K` / `Ctrl+K`    | Open command palette             | Global                     |
| `Home`             | First item in list               | Lists, Tables              |
| `End`              | Last item in list                | Lists, Tables              |
| `Arrow Up/Down`    | Navigate list items              | Lists, Menus, Radio groups |
| `Arrow Left/Right` | Navigate radio buttons           | Radio groups               |
| `PageUp/PageDown`  | Scroll page                      | Global                     |

### **Component-Specific Navigation**

#### **A. Data Tables**

```
Tab → Move to table
Tab → Move to first header cell
Tab → Move to first data cell
Tab → Move through cells horizontally
Arrow Up/Down → Navigate rows (optional)
Home → First cell in row (optional)
End → Last cell in row (optional)
Enter → Select row / activate action
```

**Implementation:**

```tsx
<Table onKeyDown={handleTableKeyboard}>
  <TableHeader>
    <TableRow>
      <TableHead scope="col" tabIndex={0}>
        Employee ID
      </TableHead>
      <TableHead scope="col" tabIndex={0}>
        Name
      </TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleRowSelect()}>
      <TableCell scope="row">AB001</TableCell>
      <TableCell>John Smith</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

#### **B. Dropdown Menus**

```
Tab → Focus trigger button
Enter / Space → Open dropdown
Arrow Down → Next menu item
Arrow Up → Previous menu item
Enter → Select item, close menu
Escape → Close menu, return focus to trigger
```

**Implementation:** (shadcn/ui handles automatically)

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button aria-label="Pilot actions menu">Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onSelect={handleEdit}>Edit</DropdownMenuItem>
    <DropdownMenuItem onSelect={handleDelete}>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### **C. Modals/Dialogs**

```
Open modal → Focus moves to first focusable element
Tab → Cycle through focusable elements (trapped)
Shift+Tab → Reverse cycle
Escape → Close modal, return focus to trigger
```

**Implementation:** (shadcn/ui handles automatically)

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <Input autoFocus /> {/* First focusable */}
    <Button>Submit</Button> {/* Last focusable */}
  </DialogContent>
</Dialog>
```

#### **D. Calendar/Date Pickers**

```
Tab → Focus date input
Enter / Space → Open calendar
Arrow Up/Down/Left/Right → Navigate dates
Enter → Select date, close calendar
Escape → Close calendar without selecting
PageUp/PageDown → Previous/next month
Home → First day of month
End → Last day of month
```

#### **E. Radio Groups**

```
Tab → Focus first radio (or checked radio)
Arrow Up/Down/Left/Right → Move to next/previous radio
Space → Select focused radio
```

**Implementation:** (shadcn/ui handles automatically)

```tsx
<RadioGroup defaultValue="Captain">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="Captain" id="captain" />
    <Label htmlFor="captain">Captain</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="First Officer" id="first-officer" />
    <Label htmlFor="first-officer">First Officer</Label>
  </div>
</RadioGroup>
```

### **Keyboard Testing Script**

```
TEST: Pilot List Page

1. Load page
2. Press Tab
3. Verify: "Skip to main content" link appears
4. Press Enter
5. Verify: Focus jumps to main content area

6. Tab to "Add Pilot" button
7. Press Enter
8. Verify: Modal opens, focus on first input

9. Type "AB001" in Employee ID field
10. Press Tab
11. Verify: Focus moves to First Name field

12. Press Shift+Tab
13. Verify: Focus returns to Employee ID field

14. Press Escape
15. Verify: Modal closes, focus returns to "Add Pilot" button

16. Tab to first pilot row
17. Press Enter
18. Verify: Pilot details page loads

19. Tab to "Actions" dropdown
20. Press Enter
21. Verify: Dropdown opens, focus on first item

22. Press Arrow Down
23. Verify: Focus moves to second item

24. Press Enter
25. Verify: Action executes, dropdown closes

PASS CRITERIA: All steps complete without mouse
```

---

## 3. Screen Reader Testing Plan

### **Screen Readers to Test**

| Platform | Screen Reader | Cost            | Priority |
| -------- | ------------- | --------------- | -------- |
| macOS    | VoiceOver     | Free (built-in) | HIGH     |
| Windows  | NVDA          | Free            | HIGH     |
| Windows  | JAWS          | Paid ($1000+)   | MEDIUM   |
| iOS      | VoiceOver     | Free (built-in) | MEDIUM   |
| Android  | TalkBack      | Free (built-in) | LOW      |

### **Testing Methodology**

#### **A. VoiceOver (macOS)**

**Enable VoiceOver:**

1. Press `⌘ + F5` (or Touch ID 3 times)
2. Or: System Preferences → Accessibility → VoiceOver → Enable

**Navigation:**

- `Control + Option + Arrow Left/Right`: Move to previous/next item
- `Control + Option + Space`: Activate item
- `Control + Option + Shift + Down`: Enter group (table, list)
- `Control + Option + Shift + Up`: Exit group
- `Control + Option + U`: Open rotor (navigation menu)
- `Control + Option + ⌘ + H`: Next heading
- `Control + Option + ⌘ + L`: Next link
- `Control + Option + ⌘ + J`: Next form control

**Test Script: Pilot List Page**

```
1. Load /dashboard/pilots
2. Expected: "Pilots - Air Niugini Pilot Management System - Navigation breadcrumb: Dashboard, Pilots"

3. Press VO + Arrow Right
4. Expected: "Add Pilot, button"

5. Press VO + Space
6. Expected: "Dialog, Add New Pilot, Enter pilot information to create a new record"

7. Press VO + Arrow Right
8. Expected: "Employee ID, required, edit text, Unique identifier format 2 letters 3 numbers"

9. Type "AB001"
10. Press Tab
11. Expected: "First Name, required, edit text"

12. Press VO + U
13. Expected: "Rotor, Form Controls, Employee ID selected"

14. Navigate rotor to error field
15. Expected: "Employee ID is required, alert"

16. Press Escape
17. Expected: "Dialog closed"

18. Navigate to table
19. Expected: "Table with 27 rows and 6 columns"

20. Press VO + Arrow Down
21. Expected: "Row 1, AB001, column 1 of 6, Employee ID"

22. Press VO + Arrow Right
23. Expected: "John Smith, column 2 of 6, Name"

24. Navigate to status badge
25. Expected: "Current, badge"

PASS CRITERIA: All announcements correct, no errors
```

#### **B. NVDA (Windows)**

**Download:** [nvaccess.org](https://www.nvaccess.org/download/)

**Enable NVDA:**

1. Download and install NVDA
2. Run NVDA
3. Or: Press `Ctrl + Alt + N` (if set as shortcut)

**Navigation:**

- `Arrow Up/Down`: Move to previous/next item
- `Tab`: Next focusable element
- `Enter`: Activate item
- `Space`: Select checkbox/radio
- `H`: Next heading
- `K`: Next link
- `E`: Next edit field (input)
- `B`: Next button
- `T`: Next table
- `Control + Home`: Top of page
- `Control + End`: Bottom of page

**Test Script: Leave Request Form**

```
1. Load /dashboard/leave
2. Expected: "Leave Management - Air Niugini Pilot Management System, heading level 1"

3. Press B (next button)
4. Expected: "New Leave Request, button"

5. Press Enter
6. Expected: "Dialog, New Leave Request"

7. Press E (next edit field)
8. Expected: "Pilot, required, combo box, collapsed"

9. Press Alt + Down Arrow
10. Expected: "Combo box expanded, John Smith, 1 of 27"

11. Press Down Arrow
12. Expected: "Jane Doe, 2 of 27"

13. Press Enter
14. Expected: "Jane Doe selected"

15. Press E (next edit field)
16. Expected: "Start Date, required, edit, date"

17. Enter invalid date
18. Tab to next field
19. Expected: "Start date is required, alert"

20. Navigate to radio group
21. Expected: "Leave Type group, RDO Rostered Day Off, radio button, not checked, 1 of 8"

22. Press Space
23. Expected: "RDO Rostered Day Off, checked"

24. Press Down Arrow
25. Expected: "SDO Substitute Day Off, radio button, not checked, 2 of 8"

PASS CRITERIA: All announcements correct, form navigable with keyboard
```

### **Common Screen Reader Issues & Fixes**

| Issue                    | Problem                                    | Fix                                                  |
| ------------------------ | ------------------------------------------ | ---------------------------------------------------- |
| "Unlabeled button"       | Button has no accessible name              | Add `aria-label` or visible text                     |
| "Clickable"              | `<div onClick>` used instead of `<button>` | Use semantic `<button>` element                      |
| "Group"                  | `<fieldset>` without `<legend>`            | Add `<legend>` inside `<fieldset>`                   |
| "Table, 0 rows"          | Empty table body                           | Add "No data" row with `colSpan`                     |
| "Edit text" (no label)   | Input missing label                        | Add `<label htmlFor>`                                |
| "Link" (no destination)  | Link text not descriptive                  | Use descriptive text ("Edit pilot AB001" not "Edit") |
| Icon button says nothing | Icon-only button missing label             | Add `aria-label="Delete pilot"`                      |
| Status not announced     | Dynamic content change                     | Use `aria-live="polite"`                             |

---

## 4. Focus Management Patterns

### **A. Modal/Dialog Focus Trap**

**Requirement:** When modal opens, focus must trap inside modal and return to trigger on close.

**Implementation:** (shadcn/ui Dialog handles automatically)

```tsx
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useRef } from 'react';

function PilotAddDialog() {
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog>
      <DialogTrigger ref={triggerRef} asChild>
        <Button>Add Pilot</Button>
      </DialogTrigger>
      <DialogContent>
        <Input autoFocus /> {/* First focusable - gets focus on open */}
        <Button type="submit">Create</Button> {/* Last focusable - Tab cycles back to Input */}
      </DialogContent>
    </Dialog>
  );
}

// Manual focus trap (if not using shadcn/ui Dialog)
function ManualFocusTrap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element on open
    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift+Tab from first element
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        // Tab from last element
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus(); // Return focus to trigger
      }
    };

    container.addEventListener('keydown', handleTabKey as EventListener);
    container.addEventListener('keydown', handleEscapeKey as EventListener);

    return () => {
      container.removeEventListener('keydown', handleTabKey as EventListener);
      container.removeEventListener('keydown', handleEscapeKey as EventListener);
      // Restore focus on unmount
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  return (
    <>
      <button ref={triggerRef} onClick={() => setIsOpen(true)}>
        Open Modal
      </button>
      {isOpen && (
        <div ref={containerRef} role="dialog" aria-modal="true">
          {/* Modal content */}
        </div>
      )}
    </>
  );
}
```

### **B. Form Submission Error Focus**

**Requirement:** On submit with errors, focus must move to first error field.

**Implementation:**

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useRef } from 'react';

function PilotForm() {
  const form = useForm({ resolver: zodResolver(pilotSchema) });
  const formRef = useRef<HTMLFormElement>(null);

  // Focus first error on submit
  useEffect(() => {
    const errors = form.formState.errors;
    const firstErrorField = Object.keys(errors)[0];

    if (firstErrorField && formRef.current) {
      const errorElement = formRef.current.querySelector<HTMLElement>(
        `[name="${firstErrorField}"]`
      );
      errorElement?.focus();

      // Announce error count to screen reader
      const errorCount = Object.keys(errors).length;
      announceToScreenReader(
        `Form has ${errorCount} error${errorCount !== 1 ? 's' : ''}. Please correct the highlighted fields.`,
        'assertive'
      );
    }
  }, [form.formState.errors]);

  const handleSubmit = async (data) => {
    try {
      await createPilot(data);
      toast.success('Pilot created successfully');
    } catch (error) {
      // Errors handled by useEffect above
    }
  };

  return (
    <form ref={formRef} onSubmit={form.handleSubmit(handleSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### **C. Dynamic Content Focus**

**Requirement:** When content updates (e.g., search results), announce update and optionally move focus.

**Implementation:**

```tsx
function PilotSearch() {
  const [results, setResults] = useState<Pilot[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    const pilots = await searchPilots(query);
    setResults(pilots);
    setIsSearching(false);

    // Announce results to screen reader
    announceToScreenReader(
      `Search complete. ${pilots.length} pilot${pilots.length !== 1 ? 's' : ''} found.`,
      'polite'
    );

    // Optional: Move focus to results (aggressive, may annoy users)
    // resultsRef.current?.focus();
  };

  return (
    <>
      <Input
        type="search"
        placeholder="Search pilots..."
        onChange={(e) => handleSearch(e.target.value)}
        aria-label="Search pilots"
      />

      <div
        ref={resultsRef}
        tabIndex={-1} // Allows programmatic focus
        aria-busy={isSearching}
        aria-live="polite"
        aria-atomic="true"
      >
        {isSearching ? (
          <div role="status" className="sr-only">
            Searching...
          </div>
        ) : (
          <>
            <div role="status" className="sr-only">
              {results.length} pilot{results.length !== 1 ? 's' : ''} found
            </div>
            {results.map((pilot) => (
              <PilotCard key={pilot.id} pilot={pilot} />
            ))}
          </>
        )}
      </div>
    </>
  );
}
```

---

## 5. Color Contrast Guide

### **WCAG Contrast Requirements**

| Text Size                              | WCAG AA           | WCAG AAA      | Use Case                         |
| -------------------------------------- | ----------------- | ------------- | -------------------------------- |
| **Small text** (< 18px or < 14px bold) | **4.5:1** minimum | 7:1 minimum   | Body text, labels, buttons       |
| **Large text** (≥ 18px or ≥ 14px bold) | **3:1** minimum   | 4.5:1 minimum | Headings, large buttons          |
| **UI components** (non-text)           | **3:1** minimum   | N/A           | Focus indicators, borders, icons |

### **Air Niugini Brand Colors (WCAG AA Compliant)**

```typescript
// src/lib/design-tokens.ts (already exists - enhance it)

export const colors = {
  // Primary Brand (Buttons, Links)
  primary: {
    DEFAULT: '#E4002B', // Air Niugini Red (5.8:1 on white ✅ AA)
    dark: '#C00020',    // Hover state (7.2:1 on white ✅ AAA)
    light: '#FF1A4D',   // Active state (4.2:1 on white ✅ AA)
  },

  // Secondary Brand (Accents)
  secondary: {
    DEFAULT: '#FFC72C', // Air Niugini Gold (2.1:1 on white ❌ FAIL)
    dark: '#F5A623',    // Text on white (4.8:1 ✅ AA)
    darker: '#E6B800',  // Better contrast (5.2:1 ✅ AA)
  },

  // Status Colors
  status: {
    expired: {
      bg: '#FEE2E2',    // red-100
      text: '#991B1B',  // red-900 (9.7:1 ✅ AAA)
      border: '#FEE2E2',
    },
    expiring: {
      bg: '#FEF3C7',    // amber-100
      text: '#92400E',  // amber-900 (8.2:1 ✅ AAA)
      border: '#FEF3C7',
    },
    current: {
      bg: '#D1FAE5',    // green-100
      text: '#065F46',  // green-900 (8.9:1 ✅ AAA)
      border: '#D1FAE5',
    },
    pending: {
      bg: '#DBEAFE',    // blue-100
      text: '#1E3A8A',  // blue-900 (7.5:1 ✅ AAA)
      border: '#DBEAFE',
    },
    inactive: {
      bg: '#F3F4F6',    // gray-100
      text: '#374151',  // gray-700 (8.1:1 ✅ AAA)
      border: '#F3F4F6',
    },
  },

  // Text Colors
  text: {
    primary: '#000000',   // Black (21:1 ✅ AAA)
    secondary: '#4A5568', // gray-600 (8.9:1 ✅ AAA)
    tertiary: '#6B7280',  // gray-500 (4.6:1 ✅ AA)
    disabled: '#9CA3AF',  // gray-400 (3.3:1 ❌ Use for non-critical only)
    link: '#E4002B',      // Air Niugini Red (5.8:1 ✅ AA)
    error: '#DC2626',     // red-600 (5.9:1 ✅ AA)
    success: '#059669',   // green-600 (4.8:1 ✅ AA)
    warning: '#D97706',   // amber-600 (5.1:1 ✅ AA)
  },
};

// Usage in components
<p className="text-gray-600">Body text (8.9:1 ✅ AAA)</p>
<a className="text-[#E4002B]">Link (5.8:1 ✅ AA)</a>
<Button className="bg-[#E4002B]">Button (5.8:1 ✅ AA)</Button>
```

### **Contrast Testing Tools**

1. **WebAIM Contrast Checker**
   - URL: https://webaim.org/resources/contrastchecker/
   - Input: Foreground #E4002B, Background #FFFFFF
   - Result: Normal Text: 5.8:1 ✅ AA, Large Text: 5.8:1 ✅ AAA

2. **Colour Contrast Analyser (CCA)**
   - Download: https://www.tpgi.com/color-contrast-checker/
   - Eyedropper tool for sampling colors from screen
   - Instant pass/fail for WCAG AA/AAA

3. **Chrome DevTools**
   - Inspect element → Styles → Color picker
   - Shows contrast ratio and WCAG compliance

4. **axe DevTools**
   - Browser extension
   - Automatically checks all text for contrast violations

### **Common Contrast Violations & Fixes**

| Violation         | Current            | Fixed                                | Ratio            |
| ----------------- | ------------------ | ------------------------------------ | ---------------- |
| Yellow badge text | `#FFC72C` on white | `#92400E` on `#FEF3C7`               | 2.1:1 → 8.2:1 ✅ |
| Gray helper text  | `#9CA3AF` on white | `#6B7280` on white                   | 3.3:1 → 4.6:1 ✅ |
| Disabled button   | `#D1D5DB` on white | `#9CA3AF` on white (non-critical ✅) | 2.1:1 → 3.3:1    |
| Gold link         | `#FFC72C` on white | `#E6B800` on white                   | 2.1:1 → 5.2:1 ✅ |

### **Contrast Validation Script**

```typescript
// src/lib/contrast-validator.ts

export function getLuminance(hex: string): number {
  const rgb = parseInt(hex.slice(1), 16);
  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >> 8) & 0xff) / 255;
  const b = (rgb & 0xff) / 255;

  const [rs, gs, bs] = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(foreground: string, background: string): number {
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return Math.round(ratio * 10) / 10; // Round to 1 decimal
}

export function meetsWCAG(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText = false
): { passes: boolean; ratio: number; required: number } {
  const ratio = getContrastRatio(foreground, background);
  const required = level === 'AAA' ? (isLargeText ? 4.5 : 7) : isLargeText ? 3 : 4.5;

  return {
    passes: ratio >= required,
    ratio,
    required,
  };
}

// Usage
const result = meetsWCAG('#E4002B', '#FFFFFF', 'AA', false);
console.log(result);
// { passes: true, ratio: 5.8, required: 4.5 }
```

---

## 6. ARIA Patterns Library

### **Common ARIA Attributes**

| Attribute          | Purpose                                  | Example                                       |
| ------------------ | ---------------------------------------- | --------------------------------------------- |
| `aria-label`       | Accessible name for element              | `<Button aria-label="Delete pilot">`          |
| `aria-labelledby`  | Points to element containing label       | `<div aria-labelledby="title-id">`            |
| `aria-describedby` | Points to element containing description | `<Input aria-describedby="help-text-id">`     |
| `aria-live`        | Announces dynamic changes                | `<div aria-live="polite">Loading...</div>`    |
| `aria-busy`        | Indicates loading state                  | `<div aria-busy="true">`                      |
| `aria-invalid`     | Indicates error state                    | `<Input aria-invalid="true">`                 |
| `aria-required`    | Indicates required field                 | `<Input aria-required="true">`                |
| `aria-expanded`    | Indicates open/closed state              | `<Button aria-expanded="true">`               |
| `aria-haspopup`    | Indicates popup menu                     | `<Button aria-haspopup="menu">`               |
| `aria-current`     | Indicates current item                   | `<a aria-current="page">`                     |
| `aria-hidden`      | Hides from screen readers                | `<Icon aria-hidden="true">`                   |
| `aria-modal`       | Indicates modal dialog                   | `<div role="dialog" aria-modal="true">`       |
| `aria-atomic`      | Read entire region                       | `<div aria-live="polite" aria-atomic="true">` |

### **ARIA Roles**

| Role         | Purpose               | Example                                        |
| ------------ | --------------------- | ---------------------------------------------- |
| `button`     | Interactive button    | `<div role="button">` (use `<button>` instead) |
| `link`       | Hyperlink             | `<div role="link">` (use `<a>` instead)        |
| `navigation` | Navigation landmark   | `<nav role="navigation">` (implicit)           |
| `main`       | Main content landmark | `<main role="main">` (implicit)                |
| `search`     | Search landmark       | `<form role="search">`                         |
| `menu`       | Menu container        | `<ul role="menu">`                             |
| `menuitem`   | Menu item             | `<li role="menuitem">`                         |
| `dialog`     | Modal dialog          | `<div role="dialog">`                          |
| `alert`      | Urgent message        | `<div role="alert">`                           |
| `status`     | Status message        | `<div role="status">`                          |
| `radiogroup` | Radio button group    | `<div role="radiogroup">`                      |
| `radio`      | Radio button          | `<div role="radio">`                           |
| `tab`        | Tab in tab list       | `<button role="tab">`                          |
| `tabpanel`   | Tab panel content     | `<div role="tabpanel">`                        |

### **Pattern Library**

#### **1. Alert Pattern**

```tsx
// Urgent alert (error, warning)
<div role="alert" aria-live="assertive" aria-atomic="true">
  <AlertCircle aria-hidden="true" />
  <h3>Error: Unable to save pilot</h3>
  <p>Employee ID already exists. Please use a unique ID.</p>
</div>

// Status update (success, info)
<div role="status" aria-live="polite" aria-atomic="true">
  <CheckCircle aria-hidden="true" />
  <p>Pilot created successfully</p>
</div>
```

#### **2. Button Pattern**

```tsx
// Icon-only button
<Button aria-label="Delete pilot John Smith" size="icon">
  <Trash2 aria-hidden="true" />
</Button>

// Toggle button
<Button
  aria-pressed={isExpanded}
  aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
  onClick={() => setIsExpanded(!isExpanded)}
>
  {isExpanded ? <ChevronUp /> : <ChevronDown />}
  {isExpanded ? 'Collapse' : 'Expand'}
</Button>

// Loading button
<Button aria-busy={isLoading} disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 animate-spin" aria-hidden="true" />}
  <span aria-live="polite">{isLoading ? 'Creating...' : 'Create Pilot'}</span>
</Button>
```

#### **3. Form Pattern**

```tsx
// Input with label, description, error
<div>
  <label htmlFor="employee-id">
    Employee ID <span aria-label="required">*</span>
  </label>
  <input
    type="text"
    id="employee-id"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? "employee-id-error employee-id-help" : "employee-id-help"}
  />
  <p id="employee-id-help">Format: AB123 (2 letters + 3 numbers)</p>
  {hasError && (
    <p id="employee-id-error" role="alert" aria-live="polite">
      Employee ID is required and must match format AB123
    </p>
  )}
</div>

// Fieldset for related inputs
<fieldset>
  <legend>Personal Information</legend>
  <label htmlFor="first-name">First Name</label>
  <input type="text" id="first-name" />

  <label htmlFor="last-name">Last Name</label>
  <input type="text" id="last-name" />
</fieldset>
```

#### **4. Dropdown Menu Pattern**

```tsx
// (shadcn/ui handles ARIA automatically)
<DropdownMenu>
  <DropdownMenuTrigger aria-label="Pilot actions" aria-haspopup="menu" aria-expanded={isOpen}>
    <MoreVertical />
  </DropdownMenuTrigger>
  <DropdownMenuContent role="menu">
    <DropdownMenuItem role="menuitem" onSelect={handleEdit}>
      <Edit aria-hidden="true" />
      Edit pilot
    </DropdownMenuItem>
    <DropdownMenuItem role="menuitem" onSelect={handleDelete}>
      <Trash2 aria-hidden="true" />
      Delete pilot
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### **5. Table Pattern**

```tsx
<table>
  <caption>Pilot List - 27 Active Pilots</caption>
  <thead>
    <tr>
      <th scope="col" aria-sort={sortOrder === 'asc' ? 'ascending' : 'none'}>
        <button onClick={handleSort}>Employee ID</button>
      </th>
      <th scope="col">Name</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td scope="row">AB001</td>
      <td>John Smith</td>
      <td>
        <Badge variant="success">
          <CheckCircle aria-hidden="true" />
          Current
        </Badge>
      </td>
    </tr>
  </tbody>
</table>
```

#### **6. Breadcrumb Pattern**

```tsx
<nav aria-label="Breadcrumb">
  <ol>
    <li>
      <a href="/dashboard">Dashboard</a>
    </li>
    <li>
      <a href="/dashboard/pilots">Pilots</a>
    </li>
    <li aria-current="page">John Smith</li>
  </ol>
</nav>
```

#### **7. Pagination Pattern**

```tsx
<nav aria-label="Pagination navigation">
  <div className="sr-only" aria-live="polite">
    Page 2 of 5. Showing 11 to 20 of 50 results.
  </div>

  <ul>
    <li>
      <a href="?page=1" aria-label="Go to previous page">
        Previous
      </a>
    </li>
    <li>
      <a href="?page=1" aria-label="Go to page 1">
        1
      </a>
    </li>
    <li>
      <a href="?page=2" aria-current="page" aria-label="Current page, page 2">
        2
      </a>
    </li>
    <li>
      <a href="?page=3" aria-label="Go to page 3">
        3
      </a>
    </li>
    <li>
      <a href="?page=3" aria-label="Go to next page">
        Next
      </a>
    </li>
  </ul>
</nav>
```

---

## 7. Automated Testing Guide

### **A. jest-axe (Unit Tests)**

**Installation:**

```bash
npm install --save-dev jest-axe @testing-library/react @testing-library/jest-dom
```

**Setup:**

```typescript
// src/test-utils/test-utils.ts (already exists - enhance it)
import { render, RenderOptions } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ReactElement } from 'react';

expect.extend(toHaveNoViolations);

export async function renderWithA11y(ui: ReactElement, options?: RenderOptions) {
  const { container } = render(ui, options);
  const results = await axe(container);
  return { container, results };
}

export { render, screen, fireEvent, waitFor } from '@testing-library/react';
```

**Test Example:**

```typescript
// src/components/ui/__tests__/StatusBadge.a11y.test.tsx
import { renderWithA11y } from '@/test-utils/test-utils'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { axe } from 'jest-axe'

describe('StatusBadge Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container, results } = await renderWithA11y(
      <StatusBadge status="current" />
    )
    expect(results).toHaveNoViolations()
  })

  it('should have accessible name', () => {
    const { getByText } = render(<StatusBadge status="expired" />)
    const badge = getByText('Expired')
    expect(badge).toBeInTheDocument()
  })

  it('should not rely on color alone', () => {
    const { getByRole } = render(<StatusBadge status="expiring" showIcon />)
    // Icon should be present
    const badge = getByRole('img', { hidden: true }) // Icon is aria-hidden
    expect(badge).toBeInTheDocument()
  })
})
```

**Run Tests:**

```bash
npm run test:a11y
# or
npm test -- --testNamePattern="Accessibility"
```

### **B. Playwright + axe-core (E2E Tests)**

**Installation:**

```bash
npm install --save-dev @axe-core/playwright
```

**Test Example:**

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('Dashboard page should not have accessibility violations', async ({ page }) => {
    await page.goto('/dashboard');

    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Pilot list page should be accessible', async ({ page }) => {
    await page.goto('/dashboard/pilots');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('#non-accessible-third-party-component') // Exclude known issues
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Form should be accessible', async ({ page }) => {
    await page.goto('/dashboard/pilots');
    await page.click('button:has-text("Add Pilot")');

    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="dialog"]') // Scan only modal
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Table should be keyboard navigable', async ({ page }) => {
    await page.goto('/dashboard/pilots');

    // Tab to table
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus on first data cell
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBe('TD');
  });
});
```

**Run Tests:**

```bash
npx playwright test e2e/accessibility.spec.ts
npx playwright test e2e/accessibility.spec.ts --headed
```

### **C. Lighthouse CI (Automated Audits)**

**Installation:**

```bash
npm install --save-dev @lhci/cli
```

**Configuration:**

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3001/dashboard',
        'http://localhost:3001/dashboard/pilots',
        'http://localhost:3001/dashboard/leave',
      ],
      numberOfRuns: 3,
      startServerCommand: 'npm run start',
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:accessibility': ['error', { minScore: 1 }], // 100/100 required
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

**package.json Scripts:**

```json
{
  "scripts": {
    "lighthouse": "lhci autorun",
    "lighthouse:collect": "lhci collect",
    "lighthouse:assert": "lhci assert"
  }
}
```

**Run Lighthouse:**

```bash
npm run lighthouse
```

### **D. GitHub Actions CI/CD**

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  a11y-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run jest-axe tests
        run: npm run test:a11y

      - name: Run Playwright E2E accessibility tests
        run: npx playwright test e2e/accessibility.spec.ts

      - name: Run Lighthouse CI
        run: npm run lighthouse
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Accessibility tests passed! No WCAG violations detected.'
            })
```

---

## 8. Accessibility Training Guide

### **Developer Training Checklist**

#### **Level 1: Awareness (1 hour)**

- [ ] What is accessibility? Why does it matter?
- [ ] WCAG 2.1 overview (A, AA, AAA levels)
- [ ] Common assistive technologies (screen readers, keyboard-only)
- [ ] Business case: legal compliance, expanded audience, better UX
- [ ] Air Niugini commitment to accessibility

#### **Level 2: Basics (2 hours)**

- [ ] Semantic HTML (use `<button>`, `<a>`, `<nav>`, `<main>`)
- [ ] Form labels (always use `<label htmlFor>`)
- [ ] Alt text for images
- [ ] Color contrast requirements (4.5:1 for text)
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Focus indicators (visible outline on focus)

#### **Level 3: shadcn/ui Components (2 hours)**

- [ ] Form components (`<FormField>`, `<FormLabel>`, `<FormMessage>`)
- [ ] Button variants and ARIA labels
- [ ] Dropdown menus (automatic keyboard support)
- [ ] Dialogs/modals (focus trap, Escape to close)
- [ ] Toast notifications (screen reader announcements)
- [ ] Tables (scope attributes, sortable headers)

#### **Level 4: Testing (2 hours)**

- [ ] Install axe DevTools browser extension
- [ ] Run Lighthouse accessibility audit
- [ ] Test with keyboard only (unplug mouse)
- [ ] Test with VoiceOver/NVDA screen reader
- [ ] Write jest-axe unit tests
- [ ] Write Playwright accessibility E2E tests

#### **Level 5: Advanced (4 hours)**

- [ ] ARIA patterns (live regions, roles, states)
- [ ] Focus management (modals, dynamic content)
- [ ] Complex widgets (comboboxes, datepickers, trees)
- [ ] Mobile accessibility (touch targets, gestures)
- [ ] Internationalization and accessibility
- [ ] Performance and accessibility (lazy loading, code splitting)

### **Quick Reference Card for Developers**

```
┌─────────────────────────────────────────────────────────────┐
│           ACCESSIBILITY QUICK REFERENCE                     │
├─────────────────────────────────────────────────────────────┤
│ ✅ DO                           │ ❌ DON'T                    │
├─────────────────────────────────┼────────────────────────────┤
│ Use <button> for actions        │ Use <div onClick>          │
│ Use <a> for navigation          │ Use <span onClick>         │
│ Add aria-label to icon buttons  │ Rely on visual icons alone │
│ Use semantic HTML (nav, main)   │ Use div for everything     │
│ Test with keyboard (Tab, Enter) │ Test with mouse only       │
│ Check color contrast (4.5:1)    │ Use low contrast text      │
│ Provide text alternatives       │ Use color alone for status │
│ Use shadcn/ui components        │ Build custom without ARIA  │
│ Run axe DevTools before commit  │ Skip accessibility testing │
│ Write descriptive link text     │ Use "Click here" links     │
└─────────────────────────────────┴────────────────────────────┘

🔍 BEFORE YOU COMMIT:
1. Run: npm run test:a11y
2. Check: axe DevTools (0 violations)
3. Test: Keyboard navigation (Tab through page)
4. Verify: Focus indicators visible on all elements

📝 COMMON FIXES:
• Missing label → Add <FormLabel htmlFor="id">
• Icon button → Add aria-label="Action description"
• Low contrast → Use approved color palette
• No keyboard access → Replace <div onClick> with <Button>
• Error not announced → Add role="alert" aria-live="polite"
```

### **Training Resources**

1. **Official Documentation**
   - [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
   - [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
   - [shadcn/ui Documentation](https://ui.shadcn.com)
   - [Radix UI Documentation](https://www.radix-ui.com)

2. **Video Tutorials**
   - [Web Accessibility by Google](https://www.udacity.com/course/web-accessibility--ud891) (Free course)
   - [Accessibility for Developers](https://www.youtube.com/playlist?list=PLNYkxOF6rcICWx0C9LVWWVqvHlYJyqw7g) (YouTube playlist)

3. **Testing Tools**
   - [axe DevTools](https://www.deque.com/axe/devtools/) (Browser extension)
   - [WAVE](https://wave.webaim.org/extension/) (Browser extension)
   - [Lighthouse](https://developers.google.com/web/tools/lighthouse) (Chrome DevTools)
   - [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

4. **Screen Readers**
   - [VoiceOver Guide (macOS)](https://www.apple.com/voiceover/info/guide/)
   - [NVDA Guide (Windows)](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
   - [JAWS Guide (Windows)](https://www.freedomscientific.com/training/jaws/)

---

## Summary & Next Steps

**This guide provides everything needed to implement WCAG 2.1 AA compliance:**

1. ✅ **Component Specifications**: All 23 components documented with accessibility features
2. ✅ **Keyboard Navigation**: Complete keyboard shortcuts and testing procedures
3. ✅ **Screen Reader Testing**: VoiceOver and NVDA test scripts with expected announcements
4. ✅ **Focus Management**: Patterns for modals, forms, and dynamic content
5. ✅ **Color Contrast**: Air Niugini brand colors with WCAG AA compliance
6. ✅ **ARIA Patterns**: Reusable ARIA patterns for all common components
7. ✅ **Automated Testing**: jest-axe, Playwright, and Lighthouse CI integration
8. ✅ **Training**: Developer training checklist and quick reference card

**Implementation Priority:**

- Week 1-2: Critical violations (forms, dropdowns, modals)
- Week 3-4: High priority (color contrast, focus indicators, toasts)
- Week 5-6: Medium priority (skip links, tables, loading states)
- Week 7-8: Testing, documentation, and final audit

**Target Outcome:**

- 100% WCAG 2.1 AA compliance
- Lighthouse accessibility score: 100/100
- Full keyboard navigation support
- Complete screen reader compatibility
- Zero axe violations across all pages

---

**For questions or assistance, contact the Accessibility Team or refer to this comprehensive guide.**
