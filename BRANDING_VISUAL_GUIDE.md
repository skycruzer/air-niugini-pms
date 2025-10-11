# Air Niugini Brand Visual Style Guide

**Air Niugini B767 Pilot Management System**
**Branding Implementation Guide**

---

## 🎨 Official Brand Colors

### Primary Brand Color

**Air Niugini Red**
```
Hex: #E4002B
RGB: rgb(228, 0, 43)
HSL: hsl(349, 100%, 45%)
```

**Usage**:
- Primary buttons
- Navigation header
- Active navigation links
- Roster period banner
- Form input focus borders
- Loading spinners
- Scrollbar thumbs
- Link text
- Focus rings

**Hover State**:
```
Hex: #C00020
RGB: rgb(192, 0, 32)
```

### Secondary Brand Color

**Air Niugini Gold**
```
Hex: #FFC72C
RGB: rgb(255, 199, 44)
HSL: hsl(45, 100%, 58%)
```

**Usage**:
- Secondary buttons
- Accent highlights
- Secondary badges
- Call-to-action elements

**Hover State**:
```
Hex: #E6B027
RGB: rgb(230, 176, 39)
```

### Supporting Colors

**Air Niugini Black**
```
Hex: #000000
```
Used for: Navigation, primary text, headers

**Air Niugini White**
```
Hex: #FFFFFF
```
Used for: Backgrounds, text on dark backgrounds

---

## 🔴 Button Styles

### Primary Button (Default)

```tsx
<Button>Submit</Button>
<Button variant="default">Submit</Button>
```

**Visual Appearance**:
- Background: Air Niugini Red (#E4002B)
- Text: White
- Hover: Dark Red (#C00020)
- Shadow: Soft shadow
- Focus: Red ring (#E4002B)

**Use For**:
- Primary actions (Submit, Save, Create)
- Main call-to-action buttons
- Confirmation buttons

### Secondary Button

```tsx
<Button variant="secondary">Cancel</Button>
```

**Visual Appearance**:
- Background: Air Niugini Gold (#FFC72C)
- Text: Black
- Hover: Dark Gold (#E6B027)
- Shadow: Soft shadow
- Focus: Gold ring (#FFC72C)

**Use For**:
- Secondary actions
- Alternative options
- Less critical actions

### Outline Button

```tsx
<Button variant="outline">Edit</Button>
```

**Visual Appearance**:
- Background: Transparent
- Border: 2px Red (#E4002B)
- Text: Red (#E4002B)
- Hover: Red background, white text
- Focus: Red ring

**Use For**:
- Edit actions
- Optional actions
- Actions that need less visual weight

### Aviation Button (Gradient)

```tsx
<Button variant="aviation">Fleet Report</Button>
```

**Visual Appearance**:
- Background: Red gradient (dark red to red)
- Text: White
- Hover: Enhanced shadow
- Focus: Red ring

**Use For**:
- Aviation-specific actions
- Fleet operations
- Special administrative actions

### Ghost Button

```tsx
<Button variant="ghost">View</Button>
```

**Visual Appearance**:
- Background: Transparent
- Text: Gray
- Hover: Light gray background
- Focus: Gray ring

**Use For**:
- Low-priority actions
- Table row actions
- Inline actions

### Link Button

```tsx
<Button variant="link">Learn More</Button>
```

**Visual Appearance**:
- Background: None
- Text: Red (#E4002B) with underline on hover
- Focus: Red ring

**Use For**:
- Navigation links
- Inline text links
- Documentation links

### Destructive Button

```tsx
<Button variant="destructive">Delete</Button>
```

**Visual Appearance**:
- Background: Red (#DC2626)
- Text: White
- Hover: Darker red
- Focus: Red ring

**Use For**:
- Delete actions
- Dangerous operations
- Irreversible actions

---

## 🏷️ Badge Styles

### Default Badge

```tsx
<Badge>Active</Badge>
<Badge variant="default">Active</Badge>
```

**Visual Appearance**:
- Background: Air Niugini Red (#E4002B)
- Text: White
- Hover: Dark Red (#C00020)

**Use For**:
- Active status
- Primary labels
- Important tags

### Secondary Badge

```tsx
<Badge variant="secondary">Info</Badge>
```

**Visual Appearance**:
- Background: Air Niugini Gold (#FFC72C)
- Text: Black
- Hover: Dark Gold (#E6B027)

**Use For**:
- Secondary information
- Optional labels
- Less critical tags

### Outline Badge

```tsx
<Badge variant="outline">Captain</Badge>
```

**Visual Appearance**:
- Background: Transparent
- Border: Red (#E4002B)
- Text: Red (#E4002B)

**Use For**:
- Role indicators
- Category labels
- Non-status tags

### Aviation Status Badges (UNCHANGED)

**Success Badge** (Green)
```tsx
<Badge variant="success">Current</Badge>
```
- Background: Light green (#D1FAE5)
- Text: Dark green (#065F46)
- **Use**: Current certifications

**Warning Badge** (Yellow)
```tsx
<Badge variant="warning">Expiring Soon</Badge>
```
- Background: Light amber (#FEF3C7)
- Text: Dark amber (#92400E)
- **Use**: Expiring certifications (≤30 days)

**Error Badge** (Red)
```tsx
<Badge variant="error">Expired</Badge>
```
- Background: Light red (#FEE2E2)
- Text: Dark red (#991B1B)
- **Use**: Expired certifications

**Info Badge** (Blue)
```tsx
<Badge variant="info">Pending</Badge>
```
- Background: Light blue (#DBEAFE)
- Text: Dark blue (#1E3A8A)
- **Use**: Pending status, information

**WHY UNCHANGED**: These colors follow FAA aviation standards for certification status and must remain consistent for regulatory compliance.

---

## 🧭 Navigation Styles

### Desktop Sidebar Header

```css
.aviation-header {
  background: linear-gradient(135deg, #E4002B 0%, #B80020 100%);
  color: white;
}
```

**Visual Elements**:
- Air Niugini logo on white backdrop
- White text
- Red gradient background
- Collapse/expand toggle

### Active Navigation Link

```css
.nav-link-active {
  background: linear-gradient(135deg, #E4002B 0%, #C00020 100%);
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

**Visual Appearance**:
- Red gradient background
- White text and icon
- Soft shadow for depth
- Smooth transition

### Inactive Navigation Link

```css
.nav-link-inactive {
  color: #4B5563;
  background: transparent;
}

.nav-link-inactive:hover {
  color: #1F2937;
  background: #F9FAFB;
}
```

**Visual Appearance**:
- Gray text
- Transparent background
- Light gray on hover
- Subtle transition

### Roster Period Banner

```css
.roster-banner {
  background: linear-gradient(135deg, #E4002B 0%, #C00020 100%);
  color: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

**Visual Elements**:
- Current roster period (e.g., "RP11/2025")
- Days remaining countdown
- White text on red gradient
- Rounded corners with shadow

---

## 📝 Form Elements

### Text Input Focus State

```css
.form-input:focus {
  border-color: #E4002B;
  outline: none;
  box-shadow: 0 0 0 3px rgba(228, 0, 43, 0.1);
}
```

**Visual Appearance**:
- Red border on focus
- Light red glow
- Smooth transition
- No default browser outline

### Select Dropdown Focus

Same as text input - red border and glow on focus.

### Checkbox/Radio Focus

Red focus ring matching brand color.

---

## 🎯 Interactive Elements

### Loading Spinner

```css
.loading-spinner {
  border: 2px solid #E5E7EB;
  border-top-color: #E4002B;
  animation: spin 0.6s linear infinite;
}
```

**Visual Appearance**:
- Gray circle with red spinning top
- Smooth rotation animation
- Available in small (20px) and large (40px)

### Scrollbar

```css
.scrollbar-branded::-webkit-scrollbar-thumb {
  background: #E4002B;
  border-radius: 4px;
}

.scrollbar-branded::-webkit-scrollbar-thumb:hover {
  background: #C00020;
}
```

**Visual Appearance**:
- Red thumb
- Gray track
- Dark red on hover
- Rounded edges

### Focus Rings

```css
.focus-visible:focus {
  outline: 2px solid #E4002B;
  outline-offset: 2px;
}
```

**Visual Appearance**:
- 2px red outline
- 2px offset for clarity
- Applied to all interactive elements

---

## 📊 Dashboard Elements

### Stat Cards

**Header with Brand Accent**:
```tsx
<div className="border-l-4 border-[#E4002B] bg-white rounded-lg p-6">
  <h3 className="text-[#E4002B] font-semibold">Total Pilots</h3>
  <p className="text-3xl font-bold">27</p>
</div>
```

**Visual Features**:
- Left border: Air Niugini Red
- Header text: Air Niugini Red
- White background
- Soft shadow

### Charts

**Keep neutral colors** for chart data points:
- Use gray/blue scales for data visualization
- Use brand red for highlights or selected items
- Use aviation status colors (green/yellow/red) for compliance charts

---

## 🎨 Color Palette Reference

### Air Niugini Red Shades

```css
--an-red-50:  #FFF5F7   /* Lightest tint */
--an-red-100: #FFE5EA
--an-red-200: #FFCCD5
--an-red-300: #FF99AA
--an-red-400: #FF6680
--an-red-500: #E4002B   /* Primary brand color */
--an-red-600: #C00020   /* Hover state */
--an-red-700: #9C0019
--an-red-800: #780013
--an-red-900: #54000D   /* Darkest shade */
```

### Air Niugini Gold Shades

```css
--an-gold-50:  #FFFDF5  /* Lightest tint */
--an-gold-100: #FFF9E5
--an-gold-200: #FFF3CC
--an-gold-300: #FFE799
--an-gold-400: #FFDB66
--an-gold-500: #FFC72C  /* Primary gold */
--an-gold-600: #E6B800  /* Hover state */
--an-gold-700: #B38F00
--an-gold-800: #806600
--an-gold-900: #4D3D00  /* Darkest shade */
```

### Neutral Gray Scale

```css
--slate-50:  #F8FAFC   /* Lightest gray */
--slate-100: #F1F5F9
--slate-200: #E2E8F0
--slate-300: #CBD5E1
--slate-400: #94A3B8
--slate-500: #64748B   /* Mid gray */
--slate-600: #475569
--slate-700: #334155
--slate-800: #1E293B
--slate-900: #0F172A   /* Darkest gray */
```

---

## ✅ Brand Application Checklist

### When Creating New Components

- [ ] Use Air Niugini Red (#E4002B) for primary actions
- [ ] Use Air Niugini Gold (#FFC72C) for secondary actions
- [ ] Apply red focus rings to interactive elements
- [ ] Keep aviation status colors unchanged (green/yellow/red)
- [ ] Test color contrast (WCAG AA minimum)
- [ ] Use brand gradients for headers/banners
- [ ] Apply consistent hover states

### When Designing Pages

- [ ] Navigation uses Air Niugini Red
- [ ] Primary CTAs use Air Niugini Red buttons
- [ ] Secondary actions use Gold or Ghost buttons
- [ ] Page headers can use red accents
- [ ] Maintain white space for readability
- [ ] Use gray text for body content
- [ ] Keep backgrounds light (white/light gray)

### When Adding Forms

- [ ] Focus states use Air Niugini Red
- [ ] Error states use semantic red (not brand red)
- [ ] Success states use semantic green
- [ ] Labels use dark gray text
- [ ] Input borders use light gray (default)
- [ ] Submit buttons use Air Niugini Red

---

## 🚀 Quick Copy-Paste Snippets

### Primary Button (Red)
```tsx
<Button className="bg-[#E4002B] hover:bg-[#C00020] text-white">
  Action
</Button>
```

### Secondary Button (Gold)
```tsx
<Button className="bg-[#FFC72C] hover:bg-[#E6B027] text-black">
  Secondary
</Button>
```

### Outline Button (Red Border)
```tsx
<Button className="border-2 border-[#E4002B] text-[#E4002B] hover:bg-[#E4002B] hover:text-white">
  Edit
</Button>
```

### Card with Red Accent
```tsx
<div className="border-l-4 border-[#E4002B] bg-white rounded-lg p-6">
  <h3 className="text-[#E4002B] font-semibold">Title</h3>
  <p className="text-gray-700">Content</p>
</div>
```

### Link with Red Text
```tsx
<a href="#" className="text-[#E4002B] hover:text-[#C00020] underline">
  Learn More
</a>
```

### Badge (Red)
```tsx
<span className="bg-[#E4002B] text-white px-3 py-1 rounded-full text-sm">
  Active
</span>
```

### Input with Red Focus
```tsx
<input
  className="border border-gray-300 rounded-lg p-3 focus:border-[#E4002B] focus:ring-2 focus:ring-[#E4002B]/20 outline-none"
  type="text"
/>
```

---

## 🎯 Do's and Don'ts

### ✅ Do

- Use Air Niugini Red for primary actions and navigation
- Use Air Niugini Gold for secondary actions and accents
- Maintain high contrast for accessibility (WCAG AA)
- Keep aviation status colors unchanged (green/yellow/red)
- Use brand gradients for headers and banners
- Apply consistent hover and focus states

### ❌ Don't

- Don't use blue as a primary color (old theme)
- Don't change aviation status badge colors
- Don't use brand red for error states (use semantic red)
- Don't apply red to all text (use sparingly)
- Don't create low-contrast combinations
- Don't mix brand colors with old blue theme

---

## 📚 Resources

### Color Tools

- **Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Color Palette Generator**: https://coolors.co/
- **Accessibility Checker**: https://www.a11yproject.com/

### Brand Assets

- Air Niugini Logo: `/public/images/air-niugini-logo.jpg`
- Brand Colors: Defined in `tailwind.config.js`
- CSS Variables: Defined in `src/app/globals.css`

### Documentation

- Main Documentation: `BRANDING_UPDATE.md`
- Project Guidelines: `CLAUDE.md`
- TailwindCSS Config: `tailwind.config.js`

---

**Last Updated**: October 9, 2025
**Maintained By**: Development Team
**Questions**: Refer to BRANDING_UPDATE.md or contact project lead
