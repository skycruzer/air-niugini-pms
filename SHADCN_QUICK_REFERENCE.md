# shadcn/ui Quick Reference

## Quick Commands

### Add Components (via Claude Code)
```
"Add the calendar component"
"Install shadcn accordion"
"Add tooltip component"
```

### Add Components (Manual CLI)
```bash
cd "/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"

# Single component
npx shadcn@latest add calendar

# Multiple components
npx shadcn@latest add calendar accordion tooltip

# List all available components
npx shadcn@latest add
```

---

## Currently Installed (24 Components)

✅ avatar, badge, button, card, checkbox, dialog, dropdown-menu, input, label, popover, progress, radio-group, scroll-area, select, separator, sheet, skeleton, switch, table, tabs, textarea, toast, toaster

---

## Available to Add

### High Priority for Air Niugini PMS

**Forms & Input**
- [ ] `calendar` - Date picker for leave requests
- [ ] `form` - Form wrapper with validation
- [ ] `combobox` - Searchable select for pilots
- [ ] `slider` - Range inputs

**Data Display**
- [ ] `tooltip` - Helpful hints and info
- [ ] `hover-card` - Pilot info on hover
- [ ] `accordion` - Collapsible sections
- [ ] `carousel` - Image/cert galleries

**Navigation**
- [ ] `command` - Quick command palette (⌘K)
- [ ] `context-menu` - Right-click menus
- [ ] `breadcrumb` - Navigation breadcrumbs
- [ ] `pagination` - Table pagination

**Feedback**
- [ ] `alert` - Important notifications
- [ ] `alert-dialog` - Confirmation dialogs
- [ ] `sonner` - Advanced toast notifications

---

## Common Usage Patterns

### Import
```typescript
import { ComponentName } from '@/components/ui/component-name';
```

### Air Niugini Branded Button
```typescript
<Button className="bg-[#E4002B] hover:bg-[#C00020] text-white">
  Submit
</Button>
```

### Status Badge (FAA Colors)
```typescript
import { Badge } from '@/components/ui/badge';

// Current (Green)
<Badge className="bg-green-100 text-green-800">Current</Badge>

// Expiring (Yellow)
<Badge className="bg-yellow-100 text-yellow-800">Expiring</Badge>

// Expired (Red)
<Badge className="bg-red-100 text-red-800">Expired</Badge>
```

### Card Layout
```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Pilot Details</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content here */}
  </CardContent>
</Card>
```

### Form Input
```typescript
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div>
  <Label htmlFor="employee-id">Employee ID</Label>
  <Input id="employee-id" placeholder="Enter employee ID" />
</div>
```

### Dialog (Modal)
```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Pilot</DialogTitle>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

---

## MCP Server Tools Available

The shadcn MCP provides these capabilities:

1. **add-component** - Install a new shadcn/ui component
2. **list-components** - Show all available components
3. **get-component-info** - Get details about a component
4. **update-config** - Modify components.json

---

## Air Niugini Color Palette

```typescript
// Primary Colors
const colors = {
  red: '#E4002B',      // Primary brand color
  gold: '#FFC72C',     // Secondary/accent
  black: '#000000',    // Text/navigation
  white: '#FFFFFF',    // Backgrounds
};

// Status Colors (FAA Standard)
const statusColors = {
  current: 'bg-green-100 text-green-800',   // Valid certifications
  expiring: 'bg-yellow-100 text-yellow-800', // Expiring soon (≤30 days)
  expired: 'bg-red-100 text-red-800',        // Expired certifications
};
```

---

## Component File Locations

```
src/
├── components/
│   └── ui/                           # shadcn/ui components
│       ├── button.tsx                # Base components
│       ├── card.tsx
│       ├── input.tsx
│       ├── ...
│       ├── StatCard.tsx              # Custom extensions
│       ├── StatusBadge.tsx
│       ├── DataTable.tsx
│       └── __tests__/                # Component tests
```

---

## Testing Pattern

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with Air Niugini styling', () => {
    render(
      <Button className="bg-[#E4002B]">Submit</Button>
    );
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });
});
```

---

## Recommended Components to Add Next

### Priority 1 (Essential)
- `calendar` - For leave request date selection
- `tooltip` - For inline help and certification details
- `command` - Quick navigation and search (⌘K)

### Priority 2 (Helpful)
- `accordion` - Collapsible certification lists
- `hover-card` - Pilot info popups
- `alert` - Important system notifications

### Priority 3 (Nice to Have)
- `breadcrumb` - Better navigation
- `context-menu` - Right-click actions
- `pagination` - Better table navigation

---

## Quick Tips

1. **Always use path alias**: `@/components/ui/...` not relative paths
2. **Brand colors**: Use Air Niugini colors for primary actions
3. **Accessibility**: shadcn components are accessible by default
4. **Customization**: Use className for styling, don't modify component files
5. **Testing**: Write tests for any custom extensions

---

**Last Updated**: October 6, 2025
**Project**: Air Niugini B767 Pilot Management System
**shadcn Version**: Latest (New York style)
