# shadcn/ui MCP Server Setup

## Overview

The shadcn MCP (Model Context Protocol) server has been successfully configured for the Air Niugini B767 Pilot Management System. This allows Claude Code to add, manage, and interact with shadcn/ui components directly.

---

## Configuration

### MCP Server Configuration

**File**: `.mcp.json`

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-shadcn"]
    }
  }
}
```

### shadcn/ui Project Configuration

**File**: `components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

---

## Currently Installed Components

### Core UI Components

- ✅ **avatar** - User avatar display
- ✅ **badge** - Status badges and labels
- ✅ **button** - Primary action buttons
- ✅ **card** - Content containers
- ✅ **checkbox** - Form checkboxes
- ✅ **dialog** - Modal dialogs
- ✅ **dropdown-menu** - Dropdown menus
- ✅ **input** - Text inputs
- ✅ **label** - Form labels
- ✅ **popover** - Popover containers
- ✅ **progress** - Progress bars
- ✅ **radio-group** - Radio button groups
- ✅ **scroll-area** - Scrollable areas
- ✅ **select** - Select dropdowns
- ✅ **separator** - Visual separators
- ✅ **sheet** - Side sheets/panels
- ✅ **skeleton** - Loading skeletons
- ✅ **switch** - Toggle switches
- ✅ **table** - Data tables
- ✅ **tabs** - Tab navigation
- ✅ **textarea** - Multi-line text inputs
- ✅ **toast** - Toast notifications

### Custom Components (Project-Specific)

- ✅ **DataTable** - Advanced data tables
- ✅ **EmptyState** - Empty state placeholders
- ✅ **LazyLoader** - Lazy loading wrapper
- ✅ **LoadingButton** - Buttons with loading states
- ✅ **ModalSheet** - Modal sheets
- ✅ **StatCard** - Statistics cards
- ✅ **StatusBadge** - Custom status badges
- ✅ **ViewToggle** - View mode toggles
- ✅ **animated/** - Animated components
- ✅ **skeletons/** - Loading skeletons

---

## How to Use shadcn MCP

### Adding New Components

You can now use Claude Code to add shadcn/ui components directly:

**Example Commands**:

```
"Add the calendar component from shadcn/ui"
"Install the accordion component"
"Add shadcn tooltip component"
```

Claude Code will:

1. Use the MCP server to fetch the component
2. Install it in `src/components/ui/`
3. Update dependencies if needed
4. Configure the component for your project

### Manual Installation (Alternative)

If you prefer manual installation:

```bash
cd "/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms"
npx shadcn@latest add [component-name]
```

**Examples**:

```bash
npx shadcn@latest add calendar
npx shadcn@latest add accordion
npx shadcn@latest add tooltip
npx shadcn@latest add command
npx shadcn@latest add context-menu
```

---

## Available Components to Add

### Navigation

- [ ] accordion
- [ ] breadcrumb
- [ ] command
- [ ] context-menu
- [ ] menubar
- [ ] navigation-menu
- [ ] pagination

### Data Display

- [ ] calendar
- [ ] carousel
- [ ] chart
- [ ] collapsible
- [ ] hover-card
- [ ] tooltip

### Forms & Input

- [ ] combobox
- [ ] datepicker
- [ ] form
- [ ] slider

### Feedback

- [ ] alert
- [ ] alert-dialog
- [ ] aspect-ratio
- [ ] sonner (toast alternative)

### Layout

- [ ] resizable
- [ ] toggle
- [ ] toggle-group

---

## Project Configuration Details

### Style Configuration

- **Design System**: New York style
- **Base Color**: Slate
- **CSS Variables**: Enabled
- **TypeScript**: TSX format
- **React Server Components**: Disabled (client-side app)

### Path Aliases

```typescript
@/components → src/components
@/lib → src/lib
@/ui → src/components/ui
@/hooks → src/hooks
```

### TailwindCSS Integration

- **Config File**: `tailwind.config.js`
- **Global CSS**: `src/app/globals.css`
- **Prefix**: None (no prefix for shadcn classes)

---

## Using Components in Your Code

### Import Pattern

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
```

### Example Usage

```typescript
export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <h2>Pilot Information</h2>
      </CardHeader>
      <CardContent>
        <Input placeholder="Enter employee ID" />
        <Button className="bg-[#E4002B]">Submit</Button>
      </CardContent>
    </Card>
  );
}
```

---

## Air Niugini Branding with shadcn

### Applying Brand Colors

shadcn/ui components can be customized with Air Niugini brand colors:

```typescript
// Primary Button (Air Niugini Red)
<Button className="bg-[#E4002B] hover:bg-[#C00020] text-white">
  Submit
</Button>

// Secondary Button (Air Niugini Gold)
<Button className="bg-[#FFC72C] hover:bg-[#FFB800] text-gray-900">
  Cancel
</Button>

// Status Badges
<Badge className="bg-green-100 text-green-800">Current</Badge>
<Badge className="bg-yellow-100 text-yellow-800">Expiring</Badge>
<Badge className="bg-red-100 text-red-800">Expired</Badge>
```

### Theme Variables

You can add Air Niugini colors to your CSS variables in `src/app/globals.css`:

```css
@layer base {
  :root {
    --air-niugini-red: 228 0 43; /* #E4002B */
    --air-niugini-gold: 255 199 44; /* #FFC72C */
    --air-niugini-black: 0 0 0; /* #000000 */
  }
}
```

Then use in components:

```typescript
<Button className="bg-[rgb(var(--air-niugini-red))]">
  Submit
</Button>
```

---

## Testing shadcn Components

### Component Testing

The project includes tests for UI components in `src/components/ui/__tests__/`

Example test structure:

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '../button';

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

---

## MCP Server Features

The shadcn MCP server provides:

1. **Component Installation**: Add components via natural language
2. **Component Discovery**: Search available components
3. **Configuration Management**: Update `components.json`
4. **Dependency Resolution**: Auto-install required packages
5. **Code Generation**: Generate component usage examples

---

## Troubleshooting

### Component Not Found

```bash
# Verify shadcn CLI is working
npx shadcn@latest --version

# List available components
npx shadcn@latest add --help
```

### MCP Server Not Working

```bash
# Restart Claude Code to reload MCP configuration
# Or manually test the MCP server
npx -y @modelcontextprotocol/server-shadcn
```

### Component Import Errors

```typescript
// Make sure path aliases are correct in tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## Best Practices

### 1. Component Consistency

- Always use shadcn/ui components for UI elements
- Maintain Air Niugini branding with custom classes
- Keep component styles in the component files

### 2. Accessibility

- shadcn/ui components are built with accessibility in mind
- Always provide proper labels and aria attributes
- Test with screen readers

### 3. Performance

- Use lazy loading for heavy components
- Implement code splitting for large component libraries
- Leverage the existing `LazyLoader` component

### 4. Customization

- Extend components in separate files (e.g., `StatCard.tsx`)
- Use TailwindCSS for styling customization
- Maintain the `new-york` style consistency

---

## Resources

- **shadcn/ui Documentation**: https://ui.shadcn.com
- **Component Library**: https://ui.shadcn.com/docs/components
- **TailwindCSS Docs**: https://tailwindcss.com
- **Radix UI Primitives**: https://www.radix-ui.com
- **Model Context Protocol**: https://modelcontextprotocol.io

---

## Project-Specific Notes

### Current Component Usage

The Air Niugini PMS uses shadcn/ui components extensively:

- **Dashboard**: `Card`, `StatCard`, `Badge`
- **Forms**: `Input`, `Select`, `Checkbox`, `RadioGroup`, `Textarea`
- **Navigation**: `Tabs`, `DropdownMenu`, `Sheet`
- **Data Display**: `Table`, `DataTable`, `StatusBadge`
- **Feedback**: `Toast`, `Dialog`, `Skeleton`
- **Actions**: `Button`, `LoadingButton`

### Custom Extensions

The project extends shadcn/ui with:

- `StatCard` - Aviation-specific statistics display
- `StatusBadge` - FAA color-coded status indicators
- `DataTable` - Advanced table with sorting/filtering
- `EmptyState` - Branded empty states
- `ModalSheet` - Custom modal implementation

---

## Next Steps

1. **Explore Components**: Browse the shadcn/ui component library
2. **Test MCP**: Try adding a new component via Claude Code
3. **Customize**: Apply Air Niugini branding to new components
4. **Document**: Update this file as you add more components

---

**shadcn/ui MCP Server**
_Successfully Configured for Air Niugini B767 PMS_
_Version 1.0 - October 6, 2025_
