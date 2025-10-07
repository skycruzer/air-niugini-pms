# WCAG 2.1 Level AA Compliance Checklist

## Air Niugini B767 Pilot Management System

**Version:** 1.0
**Last Updated:** October 7, 2025
**Target:** 100% WCAG 2.1 AA Compliance
**Testing Methodology:** Manual + Automated (axe DevTools, Lighthouse, jest-axe)

---

## How to Use This Checklist

- ✅ **Pass**: Feature meets WCAG criterion
- ❌ **Fail**: Feature violates WCAG criterion (requires remediation)
- ⚠️ **Partial**: Feature partially meets criterion (needs improvement)
- N/A: Not applicable to this application

**Status Legend:**

- 🟢 **Green (Pass)**: No action required
- 🔴 **Red (Fail)**: Critical - must fix immediately
- 🟡 **Yellow (Partial)**: Warning - should improve
- ⚪ **White (N/A)**: Not applicable

---

## Principle 1: Perceivable

### Information and user interface components must be presentable to users in ways they can perceive.

### 1.1 Text Alternatives (Level A)

| Criterion | Description                               | Status | Notes                          | shadcn/ui Component                  |
| --------- | ----------------------------------------- | ------ | ------------------------------ | ------------------------------------ |
| **1.1.1** | All non-text content has text alternative | ⚠️     | Icon buttons need `aria-label` | `<Button aria-label="Delete pilot">` |

**Test Checklist:**

- [ ] All icon-only buttons have `aria-label` (e.g., "Delete pilot", "Edit certification")
- [ ] All images have alt text (pilot avatars, Air Niugini logo)
- [ ] Decorative icons use `aria-hidden="true"`
- [ ] Icon + text buttons: icon is `aria-hidden="true"`, text provides context
- [ ] Loading spinners have `aria-label="Loading"`

**Example Fix:**

```tsx
// ❌ Wrong
<Button size="icon"><Trash2 /></Button>

// ✅ Correct
<Button size="icon" aria-label="Delete pilot John Smith">
  <Trash2 aria-hidden="true" />
</Button>
```

---

### 1.2 Time-based Media (Level A)

| Criterion | Description                                               | Status | Notes                         |
| --------- | --------------------------------------------------------- | ------ | ----------------------------- |
| **1.2.1** | Audio-only and video-only (prerecorded) have alternatives | N/A    | No audio/video content in app |
| **1.2.2** | Captions (prerecorded)                                    | N/A    | No video content              |
| **1.2.3** | Audio description or media alternative (prerecorded)      | N/A    | No video content              |

---

### 1.3 Adaptable (Level A)

| Criterion | Description                       | Status | Notes                                            | Implementation                                |
| --------- | --------------------------------- | ------ | ------------------------------------------------ | --------------------------------------------- |
| **1.3.1** | Info and Relationships            | ❌     | Missing form labels, table scope, radio grouping | shadcn/ui `<Form>`, `<Table>`, `<RadioGroup>` |
| **1.3.2** | Meaningful Sequence               | ✅     | Tab order matches visual order                   |                                               |
| **1.3.3** | Sensory Characteristics           | ⚠️     | Status conveyed by color alone (needs icons)     | Add icons to all badges                       |
| **1.3.4** | Orientation (Level AA)            | ✅     | Works in portrait and landscape                  | Responsive design                             |
| **1.3.5** | Identify Input Purpose (Level AA) | ⚠️     | Missing autocomplete attributes                  | Add `autocomplete` to personal info fields    |

**Test Checklist for 1.3.1:**

- [ ] All form inputs have associated `<label>` with `htmlFor`
- [ ] Table headers use `scope="col"` and `scope="row"`
- [ ] Related form controls grouped in `<fieldset>` with `<legend>`
- [ ] Lists use semantic HTML (`<ul>`, `<ol>`, `<dl>`)
- [ ] Headings use hierarchical structure (H1 → H2 → H3, no skipping)

**Test Checklist for 1.3.3:**

- [ ] Status indicators include icon + text (not color alone)
- [ ] "Expired" = Red background + ❌ icon + "Expired" text
- [ ] "Expiring Soon" = Yellow background + ⚠️ icon + "Expiring Soon" text
- [ ] "Current" = Green background + ✅ icon + "Current" text

**Example Fix:**

```tsx
// ❌ Wrong - Color only
<span className="text-red-600">Expired</span>

// ✅ Correct - Color + icon + text
<Badge variant="destructive">
  <XCircle className="mr-1 h-3 w-3" aria-hidden="true" />
  Expired
</Badge>
```

---

### 1.4 Distinguishable (Level AA)

| Criterion  | Description                          | Status | Notes                               | Implementation        |
| ---------- | ------------------------------------ | ------ | ----------------------------------- | --------------------- |
| **1.4.1**  | Use of Color (Level A)               | ❌     | Status conveyed by color alone      | Add icons to badges   |
| **1.4.2**  | Audio Control (Level A)              | N/A    | No auto-playing audio               |                       |
| **1.4.3**  | Contrast (Minimum) (Level AA)        | ❌     | Yellow #FFC72C on white = 2.1:1     | Use #92400E for text  |
| **1.4.4**  | Resize Text (Level AA)               | ✅     | Text resizes to 200% without loss   | Responsive typography |
| **1.4.5**  | Images of Text (Level AA)            | ✅     | No images of text used              |                       |
| **1.4.10** | Reflow (Level AA)                    | ✅     | Content reflows at 320px width      | Responsive design     |
| **1.4.11** | Non-text Contrast (Level AA)         | ❌     | Focus indicators need 3:1 contrast  | Use #E4002B ring-2    |
| **1.4.12** | Text Spacing (Level AA)              | ✅     | Text spacing can be adjusted        |                       |
| **1.4.13** | Content on Hover or Focus (Level AA) | ✅     | Tooltips dismissible and persistent |                       |

**Color Contrast Requirements:**

| Text Size                          | Contrast Ratio    | Examples                         |
| ---------------------------------- | ----------------- | -------------------------------- |
| Normal text (< 18px)               | **4.5:1** minimum | Body text, labels, buttons       |
| Large text (≥ 18px or ≥ 14px bold) | **3:1** minimum   | Headings, large buttons          |
| UI components (non-text)           | **3:1** minimum   | Focus indicators, borders, icons |

**Test Checklist for 1.4.3:**

- [ ] Body text (#000000) on white (#FFFFFF) = 21:1 ✅
- [ ] Air Niugini Red (#E4002B) on white = 5.8:1 ✅
- [ ] Gray text (#4A5568) on white = 8.9:1 ✅
- [ ] Yellow text (#92400E) on amber-100 (#FEF3C7) = 8.2:1 ✅
- [ ] Helper text (#6B7280) on white = 4.6:1 ✅
- [ ] Disabled text (#9CA3AF) on white = 3.5:1 ❌ (use for non-critical only)

**Air Niugini Brand Colors (WCAG AA Compliant):**

```tsx
// Color system for badges
const statusColors = {
  expired: {
    bg: 'bg-red-50', // #FEF2F2
    text: 'text-red-900', // #7F1D1D (15.3:1 ratio ✅)
    border: 'border-red-200',
  },
  expiring: {
    bg: 'bg-amber-50', // #FFFBEB
    text: 'text-amber-900', // #78350F (10.4:1 ratio ✅)
    border: 'border-amber-200',
  },
  current: {
    bg: 'bg-green-50', // #F0FDF4
    text: 'text-green-900', // #14532D (12.8:1 ratio ✅)
    border: 'border-green-200',
  },
};
```

**Test Tools:**

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colour Contrast Analyser (CCA)](https://www.tpgi.com/color-contrast-checker/)
- Chrome DevTools (Inspect > Accessibility > Contrast)

**Test Checklist for 1.4.11:**

- [ ] Focus indicators have 2px width (exceeds 1px minimum ✅)
- [ ] Focus ring #E4002B on white = 5.8:1 (exceeds 3:1 ✅)
- [ ] Focus offset 2px creates clear separation
- [ ] All interactive elements have visible focus state

---

## Principle 2: Operable

### User interface components and navigation must be operable.

### 2.1 Keyboard Accessible (Level A)

| Criterion | Description                       | Status | Notes                                    | Implementation             |
| --------- | --------------------------------- | ------ | ---------------------------------------- | -------------------------- |
| **2.1.1** | Keyboard                          | ❌     | Custom dropdowns not keyboard accessible | shadcn/ui `<DropdownMenu>` |
| **2.1.2** | No Keyboard Trap                  | ⚠️     | Modal focus trap incomplete              | shadcn/ui `<Dialog>`       |
| **2.1.4** | Character Key Shortcuts (Level A) | ✅     | Cmd+K uses modifier key                  |                            |

**Keyboard Navigation Requirements:**

| Element        | Keyboard Access                            | Keys     |
| -------------- | ------------------------------------------ | -------- |
| Buttons        | `Tab`, `Enter`, `Space`                    | Required |
| Links          | `Tab`, `Enter`                             | Required |
| Dropdown Menus | `Tab`, `Enter`, `Arrow Up/Down`, `Escape`  | Required |
| Radio Buttons  | `Tab`, `Arrow Up/Down/Left/Right`, `Space` | Required |
| Checkboxes     | `Tab`, `Space`                             | Required |
| Tables         | `Tab` between cells                        | Required |
| Modals/Dialogs | `Tab` (trapped), `Escape` to close         | Required |
| Date Pickers   | `Tab`, `Arrow keys`, `Enter`, `Escape`     | Required |

**Test Checklist:**

- [ ] Unplug mouse completely
- [ ] Navigate entire application using only keyboard
- [ ] Tab to all interactive elements (buttons, links, inputs)
- [ ] Activate buttons with `Enter` or `Space`
- [ ] Open dropdowns with `Enter`, navigate with arrows, close with `Escape`
- [ ] Navigate forms with `Tab`, submit with `Enter`
- [ ] Close modals with `Escape`, focus returns to trigger
- [ ] Navigate tables with `Tab` between cells
- [ ] No keyboard traps (can enter and exit all components)

**Example Test Script:**

```
1. Load Dashboard page
2. Press Tab 5 times
3. Verify focus moves: Skip link → Navigation logo → "Dashboard" link → "Pilots" link → "Leave" link → "Add Pilot" button
4. Press Enter on "Add Pilot" button
5. Verify modal opens, focus on first input
6. Press Tab 10 times
7. Verify focus stays within modal (cycles back to first input after last button)
8. Press Escape
9. Verify modal closes, focus returns to "Add Pilot" button
```

---

### 2.2 Enough Time (Level A)

| Criterion | Description       | Status | Notes                          | Implementation                   |
| --------- | ----------------- | ------ | ------------------------------ | -------------------------------- |
| **2.2.1** | Timing Adjustable | ⚠️     | Session timeout needs warning  | Add 5-min warning before timeout |
| **2.2.2** | Pause, Stop, Hide | ⚠️     | Toast auto-dismiss needs pause | Sonner pauses on hover ✅        |

**Test Checklist:**

- [ ] Toast notifications pause auto-dismiss on hover
- [ ] Toast notifications pause auto-dismiss on focus
- [ ] Session timeout shows warning 5 minutes before expiry
- [ ] User can extend session from warning dialog
- [ ] No content updates more than once every 5 seconds (unless critical)

**Example Implementation:**

```tsx
// Toast pauses on hover/focus (Sonner handles automatically)
<Toaster position="top-right" pauseWhenPageIsHidden richColors closeButton />;

// Session timeout warning
function SessionTimeoutWarning() {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  return (
    <Dialog open={timeLeft > 0 && timeLeft <= 300}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session Expiring Soon</DialogTitle>
          <DialogDescription>
            Your session will expire in {Math.floor(timeLeft / 60)} minutes. Click "Stay Logged In"
            to continue.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleLogout}>
            Log Out
          </Button>
          <Button onClick={handleExtendSession}>Stay Logged In</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 2.3 Seizures and Physical Reactions (Level A)

| Criterion | Description                             | Status | Notes                            | Implementation  |
| --------- | --------------------------------------- | ------ | -------------------------------- | --------------- |
| **2.3.1** | Three Flashes or Below Threshold        | ✅     | No flashing content              |                 |
| **2.3.2** | Three Flashes (Level AAA)               | ✅     | No flashing content              |                 |
| **2.3.3** | Animation from Interactions (Level AAA) | ⚠️     | Respect `prefers-reduced-motion` | Add media query |

**Test Checklist:**

- [ ] No content flashes more than 3 times per second
- [ ] Animations respect `prefers-reduced-motion` preference
- [ ] Pulse animations slow and subtle (< 3Hz)
- [ ] Loading spinners rotate smoothly (no flashing)

**Example Implementation:**

```css
/* globals.css */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Exception: Allow focus indicators to animate */
  *:focus-visible {
    transition-duration: 150ms !important;
  }
}

/* Respect reduced motion in Framer Motion */
import { MotionConfig } from 'framer-motion'

<MotionConfig reducedMotion="user">
  {children}
</MotionConfig>
```

---

### 2.4 Navigable (Level AA)

| Criterion | Description                         | Status | Notes                             | Implementation             |
| --------- | ----------------------------------- | ------ | --------------------------------- | -------------------------- |
| **2.4.1** | Bypass Blocks (Level A)             | ❌     | Missing skip links                | Add "Skip to main content" |
| **2.4.2** | Page Titled (Level A)               | ✅     | All pages have descriptive titles |                            |
| **2.4.3** | Focus Order (Level A)               | ✅     | Focus order matches visual order  |                            |
| **2.4.4** | Link Purpose (In Context) (Level A) | ⚠️     | Some "Click here" links           | Use descriptive text       |
| **2.4.5** | Multiple Ways (Level AA)            | ✅     | Navigation + breadcrumbs + search |                            |
| **2.4.6** | Headings and Labels (Level AA)      | ✅     | Descriptive headings and labels   |                            |
| **2.4.7** | Focus Visible (Level AA)            | ❌     | Focus indicators need enhancement | Add ring-2 ring-[#E4002B]  |

**Test Checklist for 2.4.1:**

- [ ] "Skip to main content" link at top of page
- [ ] Skip link only visible when focused
- [ ] Skip link jumps to `id="main-content"`
- [ ] Main content has `tabindex="-1"` for focus

**Test Checklist for 2.4.4:**

- [ ] All links have descriptive text (not "Click here", "Read more")
- [ ] Link purpose clear from link text alone
- [ ] "Edit" button says "Edit pilot [name]"
- [ ] "Delete" button says "Delete pilot [name]"
- [ ] External links indicate "(opens in new tab)"

**Page Title Format:**

```
[Page Name] - [Parent] | Air Niugini Pilot Management System

Examples:
- "Pilots | Air Niugini Pilot Management System"
- "John Smith - Pilot Details | Air Niugini Pilot Management System"
- "Leave Requests | Air Niugini Pilot Management System"
```

---

### 2.5 Input Modalities (Level A)

| Criterion | Description          | Status | Notes                                 | Implementation |
| --------- | -------------------- | ------ | ------------------------------------- | -------------- |
| **2.5.1** | Pointer Gestures     | ✅     | No complex gestures required          |                |
| **2.5.2** | Pointer Cancellation | ✅     | Click actions on `mouseup`            |                |
| **2.5.3** | Label in Name        | ✅     | Visible labels match accessible names |                |
| **2.5.4** | Motion Actuation     | N/A    | No motion-triggered actions           |                |

**Touch Target Requirements:**

- Minimum size: **44×44px** (WCAG AA)
- Recommended size: **48×48px** (Material Design)
- Spacing: **8px** between targets (prevent mis-taps)

**Test Checklist:**

- [ ] All buttons ≥ 44×44px (measure with browser DevTools)
- [ ] Icon buttons use `size="icon"` (40×40px minimum)
- [ ] Table row actions have adequate spacing
- [ ] Mobile tap targets ≥ 48×48px
- [ ] No gestures require precise timing

**Example Implementation:**

```tsx
// Minimum touch target size
const buttonVariants = cva(/* ... */, {
  variants: {
    size: {
      icon: 'h-10 w-10', // 40px (meets 44px with border)
      sm: 'h-9 px-3',    // 36px height
      default: 'h-10 px-4 py-2', // 40px height
      lg: 'h-11 rounded-md px-8', // 44px height
    },
  },
});

// Ensure spacing between targets
<div className="flex gap-2">
  <Button size="icon">A</Button> {/* 8px gap (2 * 4px) */}
  <Button size="icon">B</Button>
</div>
```

---

## Principle 3: Understandable

### Information and the operation of the user interface must be understandable.

### 3.1 Readable (Level A)

| Criterion | Description       | Status | Notes                  | Implementation |
| --------- | ----------------- | ------ | ---------------------- | -------------- |
| **3.1.1** | Language of Page  | ✅     | `<html lang="en">`     |                |
| **3.1.2** | Language of Parts | N/A    | All content in English |                |

**Test Checklist:**

- [x] `<html lang="en">` in layout.tsx (line 40)
- [ ] Technical aviation terms explained (tooltips or glossary)
- [ ] Consistent terminology throughout app

---

### 3.2 Predictable (Level AA)

| Criterion | Description               | Status | Notes                                | Implementation |
| --------- | ------------------------- | ------ | ------------------------------------ | -------------- |
| **3.2.1** | On Focus                  | ✅     | No context changes on focus          |                |
| **3.2.2** | On Input                  | ✅     | No auto-submit on input change       |                |
| **3.2.3** | Consistent Navigation     | ✅     | Navigation consistent across pages   |                |
| **3.2.4** | Consistent Identification | ✅     | Same icons/labels for same functions |                |

**Test Checklist:**

- [ ] Navigation sidebar consistent on all dashboard pages
- [ ] Breadcrumb always in same location
- [ ] "Delete" always uses Trash2 icon + red color
- [ ] "Edit" always uses Edit icon + neutral color
- [ ] Form submits only on button click (not on select change)
- [ ] Focus never triggers unexpected actions

---

### 3.3 Input Assistance (Level AA)

| Criterion | Description                               | Status | Notes                           | Implementation           |
| --------- | ----------------------------------------- | ------ | ------------------------------- | ------------------------ |
| **3.3.1** | Error Identification                      | ⚠️     | Errors need better association  | Use `aria-describedby`   |
| **3.3.2** | Labels or Instructions                    | ❌     | Missing labels on some inputs   | shadcn/ui `<FormLabel>`  |
| **3.3.3** | Error Suggestion                          | ⚠️     | Generic error messages          | Add specific corrections |
| **3.3.4** | Error Prevention (Legal, Financial, Data) | ✅     | Confirmation dialogs for delete |                          |

**Test Checklist for 3.3.1:**

- [ ] Error messages identify which field has error
- [ ] Error messages linked via `aria-describedby`
- [ ] Error messages have `role="alert"` or `aria-live="polite"`
- [ ] Error messages appear near the input field
- [ ] Error icon + text (not color alone)

**Test Checklist for 3.3.3:**

- [ ] "Employee ID is required" → "Employee ID is required. Enter format: AB123"
- [ ] "Invalid date" → "Invalid date. Enter format: DD/MM/YYYY"
- [ ] "Passport expiry invalid" → "Passport expiry must be in the future. Current date selected: 01/01/2020"

**Example Implementation:**

```tsx
<FormField
  control={form.control}
  name="employee_id"
  render={({ field }) => (
    <FormItem>
      <FormLabel htmlFor="employee_id">
        Employee ID <span aria-label="required">*</span>
      </FormLabel>
      <FormControl>
        <Input
          id="employee_id"
          aria-required="true"
          aria-invalid={!!errors.employee_id}
          aria-describedby={
            errors.employee_id
              ? 'employee_id-error employee_id-description'
              : 'employee_id-description'
          }
          placeholder="AB123"
          {...field}
        />
      </FormControl>
      <FormDescription id="employee_id-description">
        Unique identifier (format: 2 letters + 3 numbers)
      </FormDescription>
      {errors.employee_id && (
        <FormMessage id="employee_id-error" role="alert">
          <AlertCircle className="mr-1 h-3 w-3" aria-hidden="true" />
          {errors.employee_id.message}
        </FormMessage>
      )}
    </FormItem>
  )}
/>
```

---

## Principle 4: Robust

### Content must be robust enough that it can be interpreted by a wide variety of user agents, including assistive technologies.

### 4.1 Compatible (Level AA)

| Criterion | Description                      | Status | Notes                       | Implementation          |
| --------- | -------------------------------- | ------ | --------------------------- | ----------------------- |
| **4.1.1** | Parsing (Deprecated in WCAG 2.2) | ✅     | Valid HTML5                 |                         |
| **4.1.2** | Name, Role, Value                | ⚠️     | Custom components need ARIA | shadcn/ui provides ARIA |
| **4.1.3** | Status Messages                  | ❌     | Toasts not announced        | Sonner with `aria-live` |

**Test Checklist for 4.1.2:**

- [ ] All buttons have `role="button"` (implicit from `<button>`)
- [ ] All links have `role="link"` (implicit from `<a>`)
- [ ] Custom dropdowns have `role="menu"`, `role="menuitem"`
- [ ] Modals have `role="dialog"`, `aria-modal="true"`
- [ ] Tables have `role="table"`, `role="row"`, `role="cell"` (implicit)
- [ ] Tabs have `role="tablist"`, `role="tab"`, `role="tabpanel"`
- [ ] All form inputs have accessible names (label, `aria-label`, or `aria-labelledby`)
- [ ] All interactive elements have correct states (`aria-expanded`, `aria-checked`, `aria-pressed`)

**Test Checklist for 4.1.3:**

- [ ] Success toast has `role="status"`, `aria-live="polite"`
- [ ] Error toast has `role="alert"`, `aria-live="assertive"`
- [ ] Loading states have `aria-busy="true"`, `aria-live="polite"`
- [ ] Dynamic content updates announced to screen readers

**ARIA Roles Reference:**

| Component     | Role                         | Additional ARIA                                     |
| ------------- | ---------------------------- | --------------------------------------------------- |
| Button        | `button` (implicit)          | `aria-label`, `aria-pressed`, `aria-disabled`       |
| Link          | `link` (implicit)            | `aria-label`, `aria-current`                        |
| Dropdown Menu | `menu`, `menuitem`           | `aria-haspopup`, `aria-expanded`                    |
| Dialog/Modal  | `dialog`                     | `aria-modal`, `aria-labelledby`, `aria-describedby` |
| Alert         | `alert`                      | `aria-live="assertive"`                             |
| Status        | `status`                     | `aria-live="polite"`, `aria-atomic`                 |
| Navigation    | `navigation`                 | `aria-label`                                        |
| Breadcrumb    | `navigation`                 | `aria-label="Breadcrumb"`, `aria-current="page"`    |
| Table         | `table` (implicit)           | `scope`, `aria-sort`                                |
| Tabs          | `tablist`, `tab`, `tabpanel` | `aria-selected`, `aria-controls`                    |
| Radio Group   | `radiogroup`, `radio`        | `aria-checked`                                      |

---

## Compliance Testing Tools

### Automated Tools

1. **axe DevTools** (Browser Extension)
   - Install: [Chrome](https://chrome.google.com/webstore/detail/axe-devtools/lhdoppojpmngadmnindnejefpokejbdd) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/axe-devtools/)
   - Run on every page
   - Fix all "Violations"
   - Address "Needs Review" items manually

2. **Lighthouse** (Chrome DevTools)
   - Open DevTools → Lighthouse tab
   - Select "Accessibility" only
   - Run audit
   - Target: 100/100 score

3. **WAVE** (Browser Extension)
   - Install: [WAVE Extension](https://wave.webaim.org/extension/)
   - Run on key pages
   - Address all errors and alerts

### Manual Testing Tools

1. **Keyboard Testing**
   - Unplug mouse
   - Navigate with Tab, Enter, Escape, Arrow keys

2. **Screen Reader Testing**
   - **macOS:** VoiceOver (Cmd+F5)
   - **Windows:** NVDA (free) or JAWS (paid)
   - **iOS:** VoiceOver (Settings → Accessibility)
   - **Android:** TalkBack (Settings → Accessibility)

3. **Color Contrast**
   - [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
   - [Colour Contrast Analyser (CCA)](https://www.tpgi.com/color-contrast-checker/)

4. **Zoom Testing**
   - Test at 200% zoom (Cmd/Ctrl + +)
   - Test at 400% zoom
   - Verify no horizontal scroll, no content overlap

---

## Accessibility Testing Schedule

### During Development (Ongoing)

- **Every PR:** Run `npm run test:a11y` (jest-axe unit tests)
- **Every feature:** Manual keyboard test
- **Every component:** Check with axe DevTools

### Weekly (Frivals)

- **Full app scan:** Lighthouse accessibility audit
- **Key user flows:** Screen reader test (VoiceOver/NVDA)
- **Color contrast:** Verify new components

### Pre-Release (Beta)

- **Comprehensive audit:** axe DevTools on all pages
- **User testing:** 5 pilots (including low vision, keyboard-only users)
- **External audit:** Optional third-party WCAG audit

---

## Compliance Certification

Once all criteria are ✅ Pass:

1. **Generate VPAT** (Voluntary Product Accessibility Template)
2. **Publish Accessibility Statement** on website
3. **Provide Contact** for accessibility feedback
4. **Commit to Ongoing Compliance** with regular testing

**Accessibility Statement Template:**

> Air Niugini is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
>
> **Conformance Status:** The Air Niugini Pilot Management System fully conforms to WCAG 2.1 Level AA.
>
> **Feedback:** We welcome your feedback on the accessibility of this system. Please contact [accessibility@airniugini.com.pg] with any issues.
>
> **Last Updated:** October 2025

---

**Next Steps:**

1. Review this checklist with development team
2. Assign remediation tasks by priority (Critical → High → Medium)
3. Integrate automated testing into CI/CD pipeline
4. Schedule quarterly accessibility audits

**Target Completion:** End of Week 8 (shadcn/ui migration complete)
**Compliance Goal:** 100% WCAG 2.1 AA + 80% WCAG 2.1 AAA
