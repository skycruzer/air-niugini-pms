# Component Showcase - Quick Reference

## 🎨 Air Niugini Design System Components

Quick visual and code reference for all Phase 2.1 components.

---

## Color Palette

```tsx
// Primary Brand Colors
bg-[#E4002B]  // Air Niugini Red
bg-[#FFC72C]  // Air Niugini Gold

// Aviation Professional
bg-aviation-navy    // #1E3A8A
bg-aviation-blue    // #0EA5E9

// Semantic Colors
bg-green-100 text-green-800  // Success/Current
bg-amber-100 text-amber-800  // Warning/Expiring
bg-red-100 text-red-800      // Error/Expired
bg-blue-100 text-blue-800    // Info/Pending
bg-gray-100 text-gray-600    // Inactive
```

---

## Skeleton Loaders

### Pilot Card Skeleton

```tsx
import { PilotCardSkeleton, PilotCardSkeletonGrid } from '@/components/ui/skeletons'

// Single card
<PilotCardSkeleton />

// Grid of cards
<PilotCardSkeletonGrid count={6} />
```

### Pilot List Skeleton

```tsx
import { PilotListSkeleton } from '@/components/ui/skeletons';

<PilotListSkeleton count={10} />;
```

### Dashboard Stats Skeleton

```tsx
import {
  DashboardStatsGridSkeleton,
  DashboardChartSkeleton,
  DashboardFullPageSkeleton
} from '@/components/ui/skeletons'

// Stats grid
<DashboardStatsGridSkeleton count={4} />

// Chart skeleton
<DashboardChartSkeleton />

// Full dashboard
<DashboardFullPageSkeleton />
```

### Certification Table Skeleton

```tsx
import {
  CertificationTableSkeleton,
  CertificationCardGridSkeleton
} from '@/components/ui/skeletons'

// Table view
<CertificationTableSkeleton count={8} />

// Card grid view
<CertificationCardGridSkeleton count={6} />
```

### Calendar Skeleton

```tsx
import {
  CalendarSkeleton,
  LeaveCalendarSkeleton,
  CertificationCalendarSkeleton
} from '@/components/ui/skeletons'

// Simple calendar
<CalendarSkeleton />

// Leave calendar with events
<LeaveCalendarSkeleton />

// Certification calendar (multi-month)
<CertificationCalendarSkeleton />
```

---

## Animations

### FadeIn

```tsx
import { FadeIn, FadeInWhenVisible } from '@/components/ui/animated'

// Basic fade in
<FadeIn direction="up" duration={0.4}>
  <Card>Content</Card>
</FadeIn>

// Fade in when visible (scroll trigger)
<FadeInWhenVisible direction="up" once={true}>
  <Card>Content</Card>
</FadeInWhenVisible>

// Directions: "up" | "down" | "left" | "right" | "none"
```

### SlideIn

```tsx
import { SlideIn, SlideInWhenVisible, SlideInFromEdge } from '@/components/ui/animated'

// Basic slide in
<SlideIn direction="right" duration={0.4} distance={30}>
  <Dialog>Modal Content</Dialog>
</SlideIn>

// Slide from screen edge
<SlideInFromEdge direction="left">
  <Sidebar />
</SlideInFromEdge>
```

### StaggerChildren

```tsx
import {
  StaggerChildren,
  StaggerList,
  StaggerGrid,
  StaggerChildrenWhenVisible
} from '@/components/ui/animated'

// Stagger list items
<StaggerList staggerDelay={0.05}>
  {pilots.map(pilot => (
    <PilotCard key={pilot.id} pilot={pilot} />
  ))}
</StaggerList>

// Stagger grid items
<StaggerGrid staggerDelay={0.08}>
  {stats.map(stat => (
    <StatCard key={stat.title} {...stat} />
  ))}
</StaggerGrid>

// Custom stagger
<StaggerChildren
  staggerDelay={0.1}
  duration={0.4}
  direction="up"
  distance={20}
>
  {children}
</StaggerChildren>
```

### Scale & Hover Effects

```tsx
import {
  ScaleOnHover,
  ScaleOnHoverCard,
  ScaleOnHoverButton,
  PressEffect,
  PulseOnHover,
  LiftOnHover
} from '@/components/ui/animated'

// Card with hover effect
<ScaleOnHoverCard>
  <Card>Interactive Card</Card>
</ScaleOnHoverCard>

// Button with hover effect
<ScaleOnHoverButton>
  Click Me
</ScaleOnHoverButton>

// Lift effect (scale + translateY)
<LiftOnHover>
  <Card>Lifts on hover</Card>
</LiftOnHover>

// Press effect for interactive elements
<PressEffect>
  <div>Click feedback</div>
</PressEffect>

// Pulse animation on hover
<PulseOnHover>
  <Button>Attention grabbing</Button>
</PulseOnHover>
```

---

## Status Badges

### StatusBadge

```tsx
import { StatusBadge, getCertificationStatus } from '@/components/ui/StatusBadge'

// With auto status detection
const status = getCertificationStatus(daysUntilExpiry)
<StatusBadge status={status} showIcon />

// Manual status
<StatusBadge status="current" size="md" />
<StatusBadge status="expiring" showIcon={false} />
<StatusBadge status="expired" label="Overdue" />

// Statuses: "current" | "expiring" | "expired" | "pending" | "inactive"
// Sizes: "sm" | "md" | "lg"
```

### Status Indicators

```tsx
import { StatusIndicator, StatusDotWithLabel } from '@/components/ui/StatusBadge'

// Simple dot indicator
<StatusIndicator status="current" size="md" />

// Dot with label
<StatusDotWithLabel status="expiring" label="30 days" />
```

---

## Stat Cards

### StatCard

```tsx
import { StatCard, StatCardGrid, CompactStatCard } from '@/components/ui/StatCard'
import { Users, Award, AlertTriangle } from 'lucide-react'

// Full stat card
<StatCard
  title="Total Pilots"
  value={27}
  subtitle="Active in system"
  icon={Users}
  variant="primary"
  trend={{
    value: 8,
    label: "vs last month",
    direction: "up"
  }}
/>

// Variants: "default" | "primary" | "secondary" | "success" | "warning" | "error"

// Grid of stat cards
const stats = [
  { title: "Total Pilots", value: 27, icon: Users, variant: "primary" },
  { title: "Certifications", value: 556, icon: Award, variant: "success" },
  { title: "Expiring Soon", value: 12, icon: AlertTriangle, variant: "warning" }
]
<StatCardGrid stats={stats} columns={4} />

// Compact version
<CompactStatCard
  title="Active"
  value={27}
  icon={Users}
  variant="primary"
/>
```

---

## Data Table

### DataTable

```tsx
import { DataTable } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/badge'

const columns = [
  {
    key: 'employee_id',
    label: 'Employee ID',
    sortable: true,
    width: '120px'
  },
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    render: (value, row) => (
      <div className="font-medium">{value}</div>
    )
  },
  {
    key: 'role',
    label: 'Role',
    render: (value) => (
      <Badge variant="outline">{value}</Badge>
    )
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (value) => <StatusBadge status={value} />
  }
]

<DataTable
  data={pilots}
  columns={columns}
  searchable
  searchPlaceholder="Search pilots..."
  pageSize={10}
  emptyMessage="No pilots found"
  onRowClick={(pilot) => handleRowClick(pilot)}
/>
```

---

## Empty States

### EmptyState

```tsx
import {
  EmptyState,
  EmptyList,
  EmptySearchResult,
  ErrorState,
  NoDataCard
} from '@/components/ui/EmptyState'
import { Users } from 'lucide-react'

// Basic empty state
<EmptyState
  icon={Users}
  title="No data available"
  description="Get started by adding your first item."
  action={{
    label: "Add Item",
    onClick: () => handleAdd(),
    variant: "primary"
  }}
  variant="default"
/>

// Empty list with create action
<EmptyList
  resourceName="Pilot"
  onCreateNew={() => setShowModal(true)}
  createLabel="Add Pilot"
  description="Start building your pilot roster."
/>

// No search results
<EmptySearchResult
  searchQuery={query}
  onClearSearch={() => setQuery('')}
/>

// Error state
<ErrorState
  title="Failed to load data"
  description="An error occurred while fetching the data."
  onRetry={() => refetch()}
/>

// Compact no data card
<NoDataCard message="No certifications available" />
```

---

## Loading Buttons

### LoadingButton

```tsx
import { LoadingButton, LoadingIconButton, AsyncButton } from '@/components/ui/LoadingButton'
import { Save, Trash2 } from 'lucide-react'

// Button with loading state
<LoadingButton
  loading={isSubmitting}
  loadingText="Saving..."
  icon={Save}
  iconPosition="left"
  onClick={handleSubmit}
  className="bg-[#E4002B] hover:bg-[#C00020]"
>
  Save Changes
</LoadingButton>

// Icon-only button with loading
<LoadingIconButton
  loading={isDeleting}
  icon={Trash2}
  onClick={handleDelete}
  variant="destructive"
/>

// Async button (auto handles loading state)
<AsyncButton
  onClick={async () => {
    await saveData()
  }}
  onSuccess={() => toast.success('Saved!')}
  onError={(error) => toast.error(error.message)}
  loadingText="Saving..."
>
  Save
</AsyncButton>
```

---

## shadcn/ui Core Components

### Button

```tsx
import { Button } from '@/components/ui/button'

<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Ghost</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>

// Air Niugini branded
<Button className="bg-[#E4002B] hover:bg-[#C00020]">
  Primary Action
</Button>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>Card content goes here</CardContent>
</Card>;
```

### Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description text</DialogDescription>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>;
```

### Input & Forms

```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'

<div>
  <Label htmlFor="name">Name</Label>
  <Input id="name" placeholder="Enter name" />
</div>

<Textarea placeholder="Enter description" />

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>

<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms</Label>
</div>

<div className="flex items-center space-x-2">
  <Switch id="notifications" />
  <Label htmlFor="notifications">Enable notifications</Label>
</div>
```

### Toast

```tsx
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

toast({
  title: 'Success',
  description: 'Operation completed successfully.',
  variant: 'default',
});

toast({
  title: 'Error',
  description: 'Something went wrong.',
  variant: 'destructive',
});
```

### Table

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>;
```

### Tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Overview content</TabsContent>
  <TabsContent value="details">Details content</TabsContent>
</Tabs>;
```

### Badge

```tsx
import { Badge } from '@/components/ui/badge'

<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Destructive</Badge>

// Custom colors
<Badge className="bg-[#E4002B] text-white">Custom</Badge>
```

### Avatar

```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

<Avatar>
  <AvatarImage src="/avatar.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>;
```

### Dropdown Menu

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Options</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Duplicate</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>;
```

---

## Typography Classes

```tsx
// Display (Hero text)
<h1 className="text-display-lg">Display Large</h1>      // 3.5rem
<h1 className="text-display-md">Display Medium</h1>    // 2.875rem
<h1 className="text-display-sm">Display Small</h1>     // 2.25rem

// Headings
<h2 className="text-heading-lg">Heading Large</h2>     // 1.875rem
<h3 className="text-heading-md">Heading Medium</h3>    // 1.5rem
<h4 className="text-heading-sm">Heading Small</h4>     // 1.25rem

// Body text
<p className="text-body-lg">Body Large</p>             // 1.125rem
<p className="text-body-md">Body Medium</p>            // 1rem
<p className="text-body-sm">Body Small</p>             // 0.875rem

// Caption
<span className="text-caption">Caption Text</span>     // 0.75rem (uppercase)
```

---

## Utility Classes

```tsx
// Air Niugini Brand
<div className="bg-[#E4002B] text-white">Red Background</div>
<div className="bg-[#FFC72C] text-gray-900">Gold Background</div>
<div className="text-[#E4002B]">Red Text</div>

// Shadows
<Card className="shadow-sm">Small Shadow</Card>
<Card className="shadow-lg">Large Shadow</Card>
<Card className="shadow-xl hover:shadow-2xl">XL Shadow with Hover</Card>

// Borders
<div className="rounded-lg">Large Radius</div>
<div className="rounded-xl">XL Radius</div>
<div className="rounded-2xl">2XL Radius</div>

// Transitions
<Button className="transition-all duration-300">Smooth Transition</Button>
<Card className="hover:scale-105 transition-transform">Scale on Hover</Card>
```

---

**Air Niugini B767 Pilot Management System**
_Component Showcase - Phase 2.1_
_Quick Reference Guide_
