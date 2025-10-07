# Accessibility Quick Reference

## Air Niugini B767 Pilot Management System

**For:** Developers
**Purpose:** Quick fixes and common patterns
**Print:** This document for desk reference

---

## ✅ Pre-Commit Checklist

Before committing code, verify:

- [ ] All forms use shadcn/ui `<Form>` component (not custom labels)
- [ ] All icon buttons have `aria-label="Action description"`
- [ ] All status badges use color + icon + text (not color alone)
- [ ] All dropdowns use shadcn/ui `<DropdownMenu>` (keyboard accessible)
- [ ] All modals use shadcn/ui `<Dialog>` (focus trap automatic)
- [ ] All toasts use Sonner (screen reader announcements automatic)
- [ ] All tables have `scope="col"` on headers
- [ ] Focus indicators visible (red ring on all interactive elements)
- [ ] Color contrast ≥ 4.5:1 for text (use approved color palette)
- [ ] Run `npm run test:a11y` (zero jest-axe violations)

---

## 🚀 Quick Fixes for Common Violations

### **1. Missing Form Label**

```tsx
// ❌ WRONG
<label>Employee ID</label>
<input type="text" />

// ✅ CORRECT (shadcn/ui)
<FormField
  control={form.control}
  name="employee_id"
  render={({ field }) => (
    <FormItem>
      <FormLabel htmlFor="employee_id">
        Employee ID <span aria-label="required">*</span>
      </FormLabel>
      <FormControl>
        <Input id="employee_id" aria-required="true" {...field} />
      </FormControl>
      <FormMessage role="alert" />
    </FormItem>
  )}
/>
```

---

### **2. Icon Button Missing Label**

```tsx
// ❌ WRONG
<Button size="icon">
  <Trash2 />
</Button>

// ✅ CORRECT
<Button size="icon" aria-label="Delete pilot John Smith">
  <Trash2 aria-hidden="true" />
</Button>
```

---

### **3. Low Color Contrast**

```tsx
// ❌ WRONG - Yellow #FFC72C on white = 2.1:1 (fails WCAG AA)
<span className="text-[#FFC72C]">Expiring Soon</span>

// ✅ CORRECT - Use approved status colors
<Badge variant="warning">
  <AlertTriangle className="mr-1 h-3 w-3" aria-hidden="true" />
  Expiring Soon
</Badge>

// Badge uses amber-900 (#92400E) on amber-100 (#FEF3C7) = 8.2:1 ✅ AAA
```

---

### **4. Dropdown Not Keyboard Accessible**

```tsx
// ❌ WRONG
<div onClick={toggleMenu}>
  Actions
  {isOpen && (
    <div>
      <div onClick={handleEdit}>Edit</div>
      <div onClick={handleDelete}>Delete</div>
    </div>
  )}
</div>

// ✅ CORRECT (shadcn/ui)
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button aria-label="Pilot actions menu">Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onSelect={handleEdit}>
      <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
      Edit pilot
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={handleDelete}>
      <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
      Delete pilot
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// Keyboard support: Tab → Enter → Arrow Up/Down → Enter → Escape
```

---

### **5. Modal Focus Trap**

```tsx
// ❌ WRONG - Custom modal without focus trap
<div className="modal">
  <input />
  <button onClick={onClose}>Close</button>
</div>

// ✅ CORRECT (shadcn/ui Dialog)
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger>Open Modal</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add New Pilot</DialogTitle>
    </DialogHeader>
    <Input autoFocus /> {/* First focusable - gets focus on open */}
    <DialogFooter>
      <Button onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button type="submit">Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Focus trap automatic: Tab cycles inside, Escape closes, focus returns to trigger
```

---

### **6. Toast Not Announced**

```tsx
// ❌ WRONG - react-hot-toast (no screen reader announcement)
toast.success('Pilot created');

// ✅ CORRECT - Sonner (automatic screen reader announcement)
import { toast } from 'sonner';

toast.success('Pilot created successfully', {
  description: 'Employee ID: AB001',
  action: {
    label: 'View',
    onClick: () => router.push('/dashboard/pilots/AB001'),
  },
});

// Screen reader announces: "Pilot created successfully, Employee ID AB001, status"
```

---

### **7. Table Missing Scope**

```tsx
// ❌ WRONG
<table>
  <thead>
    <tr>
      <th>Employee ID</th>
      <th>Name</th>
    </tr>
  </thead>
</table>

// ✅ CORRECT
<Table>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Employee ID</TableHead>
      <TableHead scope="col">Name</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell scope="row">AB001</TableCell>
      <TableCell>John Smith</TableCell>
    </TableRow>
  </TableBody>
</Table>

// Screen reader announces: "Table with 27 rows and 6 columns, Employee ID column header"
```

---

### **8. Loading State Not Announced**

```tsx
// ❌ WRONG
{
  isLoading && <div className="spinner" />;
}

// ✅ CORRECT
<div aria-busy={isLoading} aria-label="Pilot list">
  {isLoading ? (
    <div role="status" className="sr-only">
      Loading pilot information...
    </div>
  ) : (
    <div role="status" className="sr-only">
      Pilot list loaded. {pilots.length} pilots found.
    </div>
  )}

  {isLoading ? <Skeleton count={5} /> : <PilotTable data={pilots} />}
</div>;

// Screen reader announces: "Loading pilot information..." then "Pilot list loaded. 27 pilots found."
```

---

### **9. Radio Group Missing**

```tsx
// ❌ WRONG
<div>
  <label><input type="radio" name="role" value="Captain" /> Captain</label>
  <label><input type="radio" name="role" value="First Officer" /> First Officer</label>
</div>

// ✅ CORRECT (shadcn/ui)
<FormField
  control={form.control}
  name="role"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Role</FormLabel>
      <FormControl>
        <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
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
    </FormItem>
  )}
/>

// Keyboard: Tab → Arrow Up/Down → Space to select
```

---

### **10. Pagination Missing ARIA**

```tsx
// ❌ WRONG
<div>
  <button onClick={() => setPage(page - 1)}>Previous</button>
  <button onClick={() => setPage(1)}>1</button>
  <button onClick={() => setPage(2)}>2</button>
  <button onClick={() => setPage(page + 1)}>Next</button>
</div>

// ✅ CORRECT (shadcn/ui)
<nav aria-label="Pagination navigation">
  <div className="sr-only" aria-live="polite">
    Page {currentPage} of {totalPages}. Showing {startItem} to {endItem} of {totalItems} results.
  </div>

  <Pagination>
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious
          onClick={() => onPageChange(currentPage - 1)}
          aria-label={`Go to previous page, page ${currentPage - 1}`}
          aria-disabled={currentPage === 1}
        />
      </PaginationItem>

      <PaginationItem>
        <PaginationLink
          onClick={() => onPageChange(1)}
          isActive={currentPage === 1}
          aria-current={currentPage === 1 ? 'page' : undefined}
          aria-label="Current page, page 1"
        >
          1
        </PaginationLink>
      </PaginationItem>

      <PaginationItem>
        <PaginationNext
          onClick={() => onPageChange(currentPage + 1)}
          aria-label={`Go to next page, page ${currentPage + 1}`}
          aria-disabled={currentPage === totalPages}
        />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
</nav>

// Screen reader announces: "Page 2 of 5. Showing 11 to 20 of 50 results."
```

---

## 🎨 Air Niugini Brand Colors (WCAG AA Compliant)

```typescript
// ALWAYS use these approved colors for text on white backgrounds

export const colors = {
  // Primary (Buttons, Links)
  primary: '#E4002B',      // 5.8:1 contrast ✅ AA
  primaryDark: '#C00020',  // 7.2:1 contrast ✅ AAA

  // Status Badge Colors
  expired: {
    bg: '#FEE2E2',    // red-100
    text: '#991B1B',  // red-900 (9.7:1 ✅ AAA)
  },
  expiring: {
    bg: '#FEF3C7',    // amber-100
    text: '#92400E',  // amber-900 (8.2:1 ✅ AAA)
  },
  current: {
    bg: '#D1FAE5',    // green-100
    text: '#065F46',  // green-900 (8.9:1 ✅ AAA)
  },

  // Text Colors
  body: '#000000',         // Black (21:1 ✅ AAA)
  secondary: '#4A5568',    // Gray-600 (8.9:1 ✅ AAA)
  helper: '#6B7280',       // Gray-500 (4.6:1 ✅ AA)

  // DO NOT USE for text on white:
  // ❌ #FFC72C (2.1:1 - fails WCAG AA)
  // ❌ #9CA3AF (3.3:1 - fails WCAG AA)
};

// Usage
<p className="text-gray-600">Body text (8.9:1 ✅)</p>
<a className="text-[#E4002B]">Link (5.8:1 ✅)</a>
```

---

## 🔍 Testing Commands

```bash
# Before committing
npm run test:a11y                  # jest-axe unit tests (must pass)
npm run lint                       # ESLint (must pass)
npm run type-check                 # TypeScript (must pass)

# Before PR
npx playwright test e2e/accessibility.spec.ts  # E2E tests
npm run lighthouse                  # Accessibility audit (target: 100/100)

# Manual testing
# 1. Unplug mouse, Tab through page (all elements reachable?)
# 2. Press ⌘+F5 (VoiceOver), navigate page (all announced correctly?)
# 3. Zoom to 200% (no horizontal scroll, all text readable?)
```

---

## 🧪 Testing Tools

### **Browser Extensions (Install All)**

1. **axe DevTools** - [Chrome](https://chrome.google.com/webstore/detail/axe-devtools/lhdoppojpmngadmnindnejefpokejbdd) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/axe-devtools/)
   - Run on every page before committing
   - Fix all "Violations" (must be 0)

2. **WAVE** - [Extension](https://wave.webaim.org/extension/)
   - Quick visual check for errors
   - Fix all red icons

3. **Lighthouse** - Chrome DevTools (built-in)
   - Open DevTools → Lighthouse tab
   - Select "Accessibility" only
   - Target: 100/100 score

### **Screen Readers**

- **macOS:** VoiceOver (⌘+F5) - Free, built-in
- **Windows:** NVDA - [Download](https://www.nvaccess.org/download/) - Free

### **Color Contrast**

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Input: Foreground #E4002B, Background #FFFFFF
- Required: Normal text ≥ 4.5:1, Large text ≥ 3:1

---

## 📋 Component Cheat Sheet

| Component  | shadcn/ui Import                                               | Accessibility Features                     |
| ---------- | -------------------------------------------------------------- | ------------------------------------------ |
| Form       | `import { Form, FormField } from '@/components/ui/form'`       | Auto label association, error linking      |
| Button     | `import { Button } from '@/components/ui/button'`              | Focus ring, keyboard support (Enter/Space) |
| Dropdown   | `import { DropdownMenu } from '@/components/ui/dropdown-menu'` | Keyboard nav (Arrow keys), ARIA roles      |
| Dialog     | `import { Dialog } from '@/components/ui/dialog'`              | Focus trap, Escape to close, ARIA modal    |
| Toast      | `import { toast } from 'sonner'`                               | Screen reader announcement, pausable       |
| Table      | `import { Table } from '@/components/ui/table'`                | Scope attributes, sortable headers         |
| Badge      | `import { Badge } from '@/components/ui/badge'`                | WCAG AA colors, icon + text                |
| Pagination | `import { Pagination } from '@/components/ui/pagination'`      | ARIA navigation, current page              |
| Breadcrumb | `import { Breadcrumb } from '@/components/ui/breadcrumb'`      | ARIA current, navigation landmark          |
| RadioGroup | `import { RadioGroup } from '@/components/ui/radio-group'`     | Arrow key nav, group label                 |
| Alert      | `import { Alert } from '@/components/ui/alert'`                | ARIA live regions, proper roles            |

---

## 🚨 Common Mistakes to Avoid

| Mistake                                     | Fix                                                                   |
| ------------------------------------------- | --------------------------------------------------------------------- |
| Using `<div onClick>` instead of `<button>` | Always use semantic HTML (`<button>`, `<a>`, `<nav>`, `<main>`)       |
| Icon button without label                   | Add `aria-label="Action description"` to all icon-only buttons        |
| Color-only status indicators                | Always use color + icon + text (never color alone)                    |
| Form input without label                    | Use shadcn/ui `<FormLabel>` with automatic `htmlFor`/`id` association |
| Custom dropdown without keyboard support    | Use shadcn/ui `<DropdownMenu>` (keyboard support built-in)            |
| Modal without focus trap                    | Use shadcn/ui `<Dialog>` (focus trap automatic)                       |
| Toast without announcement                  | Use Sonner `toast()` (screen reader announcement automatic)           |
| Low contrast text                           | Use approved color palette (all colors ≥ 4.5:1 contrast)              |
| Loading state not announced                 | Add `aria-busy`, `aria-live`, `role="status"`                         |
| Table without scope                         | Add `scope="col"` to all `<th>`, `scope="row"` to first `<td>`        |

---

## 🎯 Accessibility Goals

**Target:** 100% WCAG 2.1 AA compliance

**Current Status:**

- ❌ 12 violations
- 📊 67% compliance
- 🎯 Lighthouse: ~75/100

**Post-Implementation:**

- ✅ 0 violations
- 📊 100% compliance
- 🎯 Lighthouse: 100/100

---

## 📚 Documentation Links

- **Full Audit:** `docs/accessibility/ACCESSIBILITY_AUDIT_REPORT.md`
- **WCAG Checklist:** `docs/accessibility/WCAG_COMPLIANCE_CHECKLIST.md`
- **Complete Guide:** `docs/accessibility/COMPREHENSIVE_ACCESSIBILITY_GUIDE.md`
- **README:** `docs/accessibility/README.md`

---

## 🆘 Need Help?

**Common Questions:**

- "How do I test with VoiceOver?" → See `COMPREHENSIVE_ACCESSIBILITY_GUIDE.md` Section 3
- "What colors can I use?" → See "Air Niugini Brand Colors" above (all ≥ 4.5:1 contrast)
- "How do I fix form labels?" → Use shadcn/ui `<FormField>` (auto-association)
- "How do I make dropdown keyboard accessible?" → Use shadcn/ui `<DropdownMenu>`

**Contact:**

- **Slack:** #accessibility channel
- **Email:** accessibility@airniugini.com.pg
- **GitHub:** Tag issues with `accessibility` label

---

**Print this document and keep at your desk for quick accessibility fixes during development!**

**Remember:** Accessibility is not an afterthought - integrate these patterns from the start, and testing will be effortless.
