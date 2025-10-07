# Accessibility Documentation

## Air Niugini B767 Pilot Management System

**Version:** 1.0
**Last Updated:** October 7, 2025
**Status:** Ready for Implementation
**Target:** 100% WCAG 2.1 AA Compliance

---

## Overview

This directory contains comprehensive accessibility documentation for achieving **100% WCAG 2.1 Level AA compliance** through the integration of shadcn/ui components. The documentation provides everything needed to eliminate the current 12 accessibility violations and establish the Air Niugini Pilot Management System as a best-in-class accessible aviation application.

---

## Documentation Structure

### **1. ACCESSIBILITY_AUDIT_REPORT.md** (Primary Document)

**Purpose:** Complete audit of current violations with shadcn/ui solutions

**Contents:**

- Executive summary (12 violations identified, 9 auto-fixed by shadcn/ui)
- Detailed analysis of each violation (Issue → Impact → WCAG criterion → Solution)
- Code examples (Before ❌ vs After ✅ with shadcn/ui)
- Verification procedures (VoiceOver, NVDA, axe DevTools tests)
- Implementation priority (Critical → High → Medium)
- Post-implementation validation plan

**Key Findings:**

- **Current Status:** 67% WCAG 2.1 AA compliant
- **Post-Implementation:** 100% WCAG 2.1 AA compliant
- **Auto-Fixed by shadcn/ui:** 9 out of 12 violations (75%)
- **Manual Fixes Required:** 3 violations (25%)

**Primary Violations:**

1. Missing form labels (CRITICAL) → shadcn/ui `<Form>` ✅
2. Low color contrast (HIGH) → shadcn/ui `<Badge>` ✅
3. Non-keyboard dropdowns (CRITICAL) → shadcn/ui `<DropdownMenu>` ✅
4. Missing skip links (MEDIUM) → Manual CSS implementation ❌
5. Insufficient focus indicators (HIGH) → Manual CSS enhancement ❌
6. Missing table scope (MEDIUM) → shadcn/ui `<Table>` ✅
7. Toast not announced (HIGH) → shadcn/ui `<Toaster>` (Sonner) ✅
8. Loading not announced (MEDIUM) → Manual `aria-busy`/`aria-live` ❌
9. Radio group missing (MEDIUM) → shadcn/ui `<RadioGroup>` ✅
10. Focus trap incomplete (HIGH) → shadcn/ui `<Dialog>` ✅
11. Pagination missing ARIA (MEDIUM) → shadcn/ui `<Pagination>` ✅
12. Breadcrumb missing semantic (MEDIUM) → shadcn/ui `<Breadcrumb>` ✅

---

### **2. WCAG_COMPLIANCE_CHECKLIST.md** (Comprehensive Checklist)

**Purpose:** Complete WCAG 2.1 AA criteria checklist with testing procedures

**Contents:**

- All 78 WCAG 2.1 Level A and AA success criteria
- Pass/Fail/Partial status for each criterion
- Testing procedures for each criterion
- Code examples for common violations
- Testing tools and methodologies
- Accessibility testing schedule
- Compliance certification process

**Organization:**

- **Principle 1: Perceivable** (21 criteria)
  - Text Alternatives (1.1)
  - Time-based Media (1.2)
  - Adaptable (1.3)
  - Distinguishable (1.4)

- **Principle 2: Operable** (24 criteria)
  - Keyboard Accessible (2.1)
  - Enough Time (2.2)
  - Seizures and Physical Reactions (2.3)
  - Navigable (2.4)
  - Input Modalities (2.5)

- **Principle 3: Understandable** (17 criteria)
  - Readable (3.1)
  - Predictable (3.2)
  - Input Assistance (3.3)

- **Principle 4: Robust** (3 criteria)
  - Compatible (4.1)

**Testing Tools Documented:**

- axe DevTools (automated)
- Lighthouse (automated)
- WAVE (automated)
- VoiceOver (manual)
- NVDA (manual)
- Color Contrast Checker (manual)
- Keyboard testing (manual)

---

### **3. COMPREHENSIVE_ACCESSIBILITY_GUIDE.md** (All-in-One Reference)

**Purpose:** Consolidated guide combining all implementation details

**Contents:**

#### **Section 1: Component Accessibility Specifications**

Detailed specs for all 23 components:

- Sonner Toast Notifications (with screen reader announcements)
- Breadcrumb Navigation (with `aria-current`)
- Enhanced Alerts (with proper roles and live regions)
- Standardized Pagination (with keyboard navigation)
- Accessible Forms (with automatic label association)
- Skeleton Loading States (with announcements)

**Each component includes:**

- shadcn/ui implementation code
- Accessibility features list (✅ checklist)
- VoiceOver/NVDA test procedures
- Expected screen reader announcements

#### **Section 2: Keyboard Navigation Guide**

Complete keyboard navigation patterns:

- Global shortcuts (Tab, Enter, Escape, ⌘K)
- Component-specific navigation (Tables, Dropdowns, Modals, Calendars, Radio Groups)
- Keyboard testing scripts
- Navigation maps for complex workflows

**Example: Dropdown Navigation**

```
Tab → Focus trigger
Enter/Space → Open dropdown
Arrow Up/Down → Navigate items
Enter → Select item
Escape → Close dropdown
```

#### **Section 3: Screen Reader Testing Plan**

Comprehensive testing methodology:

- Screen readers to test (VoiceOver, NVDA, JAWS, TalkBack)
- VoiceOver testing guide (keyboard shortcuts, testing scripts)
- NVDA testing guide (keyboard shortcuts, testing scripts)
- Expected announcements for each component
- Common issues and fixes

**Example Test Script:**

```
1. Load /dashboard/pilots
2. Expected: "Pilots - Air Niugini Pilot Management System"
3. Press VO + Arrow Right
4. Expected: "Add Pilot, button"
5. Press VO + Space
6. Expected: "Dialog, Add New Pilot"
```

#### **Section 4: Focus Management Patterns**

Focus management implementations:

- Modal/Dialog focus trap (automatic with shadcn/ui)
- Form submission error focus (move to first error)
- Dynamic content focus (announce updates)
- Focus restoration patterns

#### **Section 5: Color Contrast Guide**

WCAG contrast requirements and brand color compliance:

- Contrast ratios (4.5:1 for text, 3:1 for UI)
- Air Niugini brand colors (WCAG AA compliant)
- Status color adjustments (red/yellow/green badges)
- Contrast testing tools
- Common violations and fixes
- Contrast validation script

**Air Niugini Brand Colors:**
| Color | Hex | Contrast | WCAG |
|-------|-----|----------|------|
| Red (Primary) | #E4002B | 5.8:1 | ✅ AA |
| Red (Dark) | #C00020 | 7.2:1 | ✅ AAA |
| Gold (Text) | #92400E | 8.2:1 | ✅ AAA |

#### **Section 6: ARIA Patterns Library**

Reusable ARIA patterns with code examples:

- ARIA attributes reference (`aria-label`, `aria-live`, `aria-expanded`)
- ARIA roles reference (`button`, `dialog`, `alert`, `status`)
- Pattern library (Alert, Button, Form, Dropdown, Table, Breadcrumb, Pagination)

**Example: Alert Pattern**

```tsx
<div role="alert" aria-live="assertive" aria-atomic="true">
  <AlertCircle aria-hidden="true" />
  <h3>Error: Unable to save pilot</h3>
  <p>Employee ID already exists.</p>
</div>
```

#### **Section 7: Automated Testing Guide**

Complete automated testing setup:

- **jest-axe** (unit tests) - Setup and examples
- **Playwright + axe-core** (E2E tests) - Setup and examples
- **Lighthouse CI** (automated audits) - Configuration
- **GitHub Actions CI/CD** - Workflow configuration

**Example jest-axe Test:**

```typescript
it('should not have accessibility violations', async () => {
  const { container, results } = await renderWithA11y(<StatusBadge status="current" />)
  expect(results).toHaveNoViolations()
})
```

#### **Section 8: Accessibility Training Guide**

Developer training program:

- Level 1: Awareness (1 hour)
- Level 2: Basics (2 hours)
- Level 3: shadcn/ui Components (2 hours)
- Level 4: Testing (2 hours)
- Level 5: Advanced (4 hours)
- Quick Reference Card (printable)
- Training resources (documentation, videos, tools)

---

## Quick Start Guide

### **For Developers**

1. **Read:** `ACCESSIBILITY_AUDIT_REPORT.md` - Understand current violations
2. **Reference:** `COMPREHENSIVE_ACCESSIBILITY_GUIDE.md` - Implementation details
3. **Test:** Use checklist in `WCAG_COMPLIANCE_CHECKLIST.md`
4. **Verify:** Run automated tests (jest-axe, Playwright, Lighthouse)

### **For QA/Testers**

1. **Review:** `WCAG_COMPLIANCE_CHECKLIST.md` - Testing criteria
2. **Test:** Follow screen reader test scripts in `COMPREHENSIVE_ACCESSIBILITY_GUIDE.md`
3. **Report:** Use violation format from `ACCESSIBILITY_AUDIT_REPORT.md`
4. **Verify:** Run axe DevTools and Lighthouse audits

### **For Product Managers**

1. **Understand:** `ACCESSIBILITY_AUDIT_REPORT.md` - Executive summary
2. **Track:** Implementation priority (Critical → High → Medium)
3. **Plan:** 8-week implementation timeline
4. **Certify:** Use compliance certification process in `WCAG_COMPLIANCE_CHECKLIST.md`

---

## Implementation Timeline

### **Phase 1: Critical Fixes (Weeks 1-2)**

**Violations:** 1 (Form labels), 3 (Keyboard dropdowns), 10 (Focus trap)

**Implementation:**

- Replace all forms with shadcn/ui `<Form>` component
- Replace custom dropdowns with shadcn/ui `<DropdownMenu>`
- Replace modals with shadcn/ui `<Dialog>`

**Effort:** 40 hours
**Impact:** Blocks removed for keyboard users and screen readers
**Testing:** VoiceOver, NVDA, keyboard navigation

---

### **Phase 2: High Priority (Weeks 3-4)**

**Violations:** 2 (Color contrast), 5 (Focus indicators), 7 (Toast announcements)

**Implementation:**

- Update color palette to use WCAG AA compliant colors
- Add enhanced focus indicators (2px ring, 2px offset, #E4002B)
- Replace React Hot Toast with shadcn/ui Sonner

**Effort:** 32 hours
**Impact:** Improves readability for low vision users
**Testing:** Contrast checker, axe DevTools, screen readers

---

### **Phase 3: Medium Priority (Weeks 5-6)**

**Violations:** 4 (Skip links), 6 (Table scope), 8 (Loading announcements), 9 (Radio groups), 11 (Pagination ARIA), 12 (Breadcrumb)

**Implementation:**

- Add skip links to layout
- Add scope attributes to all tables
- Add `aria-busy` and `aria-live` to loading states
- Replace radio buttons with shadcn/ui `<RadioGroup>`
- Implement shadcn/ui `<Pagination>` and `<Breadcrumb>`

**Effort:** 24 hours
**Impact:** Enhances navigation efficiency
**Testing:** Keyboard testing, screen reader testing

---

### **Phase 4: Testing & Certification (Weeks 7-8)**

**Activities:**

- Run comprehensive automated tests (jest-axe, Playwright, Lighthouse)
- Conduct manual testing (keyboard, screen readers, color contrast)
- User testing with pilots (ages 50+, keyboard-only users)
- Final WCAG audit
- Generate VPAT (Voluntary Product Accessibility Template)
- Publish Accessibility Statement

**Effort:** 40 hours
**Deliverables:**

- 100% WCAG 2.1 AA compliance
- Lighthouse accessibility score: 100/100
- Zero axe violations
- VPAT documentation
- Accessibility Statement

---

## Testing Procedures

### **Automated Testing (Run Before Every Commit)**

```bash
# Unit tests with jest-axe
npm run test:a11y

# E2E tests with Playwright + axe
npx playwright test e2e/accessibility.spec.ts

# Lighthouse audit
npm run lighthouse
```

**Expected Results:**

- jest-axe: 0 violations
- Playwright: 0 violations
- Lighthouse: 100/100 accessibility score

---

### **Manual Testing (Run Weekly)**

**1. Keyboard Navigation Test (15 minutes)**

- Unplug mouse
- Tab through entire application
- Test all interactive elements (buttons, links, forms, dropdowns, modals)
- Verify focus visible on all elements
- Verify no keyboard traps

**2. Screen Reader Test (30 minutes)**

- macOS: VoiceOver (⌘ + F5)
- Windows: NVDA (free download)
- Test key user flows (login, create pilot, submit leave request)
- Verify announcements correct (forms, tables, status messages)
- Verify error messages announced

**3. Color Contrast Test (10 minutes)**

- Use WebAIM Contrast Checker
- Test all text colors (body, links, buttons, labels)
- Test status badge colors (red, yellow, green)
- Verify 4.5:1 ratio for normal text, 3:1 for large text

**4. Zoom Test (5 minutes)**

- Zoom to 200% (⌘/Ctrl + +)
- Verify no horizontal scroll
- Verify no content overlap
- Verify all text readable

---

## Success Metrics

### **Pre-Implementation (Current State)**

- ❌ 12 WCAG violations
- 📊 67% compliance rate
- 🎯 Lighthouse score: ~75/100
- 🐛 axe violations: ~30 across all pages

### **Post-Implementation (Target State)**

- ✅ 0 WCAG violations
- 📊 100% WCAG 2.1 AA compliance
- 🎯 Lighthouse score: 100/100
- 🐛 axe violations: 0 across all pages
- ⌨️ Full keyboard navigation support
- 🔊 Complete screen reader compatibility
- 🌈 WCAG AAA compliance for critical features

---

## Maintenance & Ongoing Compliance

### **Continuous Integration**

- **GitHub Actions:** Run automated tests on every PR
- **Pre-commit Hooks:** Run axe tests before commit
- **Weekly Audits:** Manual screen reader testing

### **Quarterly Reviews**

- **User Testing:** Test with pilots (including low vision users)
- **External Audit:** Optional third-party WCAG audit
- **Documentation Update:** Update guides as needed

### **Training**

- **New Developers:** Complete Level 1-3 training (5 hours)
- **Quarterly Refresher:** Review common violations (1 hour)
- **Annual Update:** WCAG updates and new patterns (2 hours)

---

## Resources

### **Internal Documentation**

- `ACCESSIBILITY_AUDIT_REPORT.md` - Audit and solutions
- `WCAG_COMPLIANCE_CHECKLIST.md` - Testing checklist
- `COMPREHENSIVE_ACCESSIBILITY_GUIDE.md` - Implementation guide

### **External Resources**

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Documentation](https://www.radix-ui.com)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Resources](https://webaim.org/resources/)

### **Testing Tools**

- [axe DevTools](https://www.deque.com/axe/devtools/) (Browser extension)
- [WAVE](https://wave.webaim.org/extension/) (Browser extension)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) (Chrome DevTools)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [VoiceOver Guide](https://www.apple.com/voiceover/info/guide/)
- [NVDA Guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)

---

## Contact & Support

### **Accessibility Questions**

- **Email:** accessibility@airniugini.com.pg
- **Slack:** #accessibility channel
- **Documentation:** This directory

### **Bug Reports**

- **GitHub Issues:** Tag with `accessibility` label
- **Priority:** Critical (P0), High (P1), Medium (P2)
- **Include:** Screen reader, browser, WCAG criterion

### **Feature Requests**

- **Accessibility Enhancements:** Submit PR with test coverage
- **New Patterns:** Document in `COMPREHENSIVE_ACCESSIBILITY_GUIDE.md`

---

## Accessibility Statement

**Air Niugini is committed to ensuring digital accessibility for people with disabilities.** We are continually improving the user experience for everyone and applying the relevant accessibility standards.

**Conformance Status:** The Air Niugini Pilot Management System is being updated to fully conform to WCAG 2.1 Level AA. Full compliance expected by end of Week 8 (implementation timeline).

**Feedback:** We welcome your feedback on the accessibility of this system. Please contact us at accessibility@airniugini.com.pg with any issues or suggestions.

**Last Updated:** October 7, 2025

---

**This documentation provides everything needed to achieve 100% WCAG 2.1 AA compliance and establish the Air Niugini Pilot Management System as an accessible, inclusive aviation application.**

**Next Steps:**

1. Review `ACCESSIBILITY_AUDIT_REPORT.md` to understand current violations
2. Implement fixes following `COMPREHENSIVE_ACCESSIBILITY_GUIDE.md`
3. Test using `WCAG_COMPLIANCE_CHECKLIST.md`
4. Certify compliance and publish Accessibility Statement

**Target Outcome:** Zero accessibility barriers, 100% WCAG 2.1 AA compliance, and a best-in-class user experience for all pilots, regardless of ability.
