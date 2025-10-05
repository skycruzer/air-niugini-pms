# Air Niugini PMS Code Standards

This document outlines the code quality standards, conventions, and best practices for the Air Niugini B767 Pilot Management System.

## Table of Contents

1. [Code Quality Tools](#code-quality-tools)
2. [Commit Message Format](#commit-message-format)
3. [Code Style Guidelines](#code-style-guidelines)
4. [Git Workflow](#git-workflow)
5. [Pull Request Checklist](#pull-request-checklist)
6. [Emergency Procedures](#emergency-procedures)

---

## Code Quality Tools

Our project uses automated tools to maintain consistent code quality:

### Prettier (Code Formatting)

Prettier automatically formats code to maintain consistency across the codebase.

**Configuration**: `.prettierrc.json`

- Semi-colons: ✅ Always
- Quotes: Single quotes (`'`)
- Tab width: 2 spaces
- Print width: 100 characters
- Trailing commas: ES5 compatible
- Line endings: LF (Unix-style)

**Commands**:

```bash
# Format all files
npm run format

# Check formatting without modifying files
npm run format:check
```

### ESLint (Code Linting)

ESLint catches potential bugs and enforces code quality rules.

**Configuration**: `.eslintrc.json`

**Key Rules**:

- No unused variables (warning)
- No `var`, use `const`/`let`
- React Hooks rules enforced
- Console logs allowed: `console.warn`, `console.error`, `console.info`
- Prefer arrow functions and template literals

**Commands**:

```bash
# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### TypeScript (Type Checking)

Strict TypeScript configuration ensures type safety.

**Commands**:

```bash
# Run type check
npm run type-check
```

### Comprehensive Validation

Run all quality checks before committing:

```bash
# Run format check, lint, type check, and build
npm run validate
```

---

## Commit Message Format

We use **Conventional Commits** specification for clear, semantic commit history.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type       | Description                     | Example                                          |
| ---------- | ------------------------------- | ------------------------------------------------ |
| `feat`     | New feature                     | `feat(pilots): add bulk certification update`    |
| `fix`      | Bug fix                         | `fix(dashboard): correct statistics calculation` |
| `docs`     | Documentation changes           | `docs(readme): update installation steps`        |
| `style`    | Code style changes (formatting) | `style(components): apply prettier formatting`   |
| `refactor` | Code refactoring                | `refactor(services): extract common API logic`   |
| `perf`     | Performance improvements        | `perf(queries): optimize pilot data fetching`    |
| `test`     | Adding/updating tests           | `test(auth): add login flow tests`               |
| `build`    | Build system changes            | `build(deps): upgrade next to 14.2.33`           |
| `ci`       | CI/CD changes                   | `ci(github): add playwright workflow`            |
| `chore`    | Maintenance tasks               | `chore(cleanup): remove unused dependencies`     |
| `revert`   | Revert previous commit          | `revert: revert feat(pilots): add bulk update`   |

### Rules

1. **Type**: Required, lowercase, from the list above
2. **Scope**: Optional, lowercase, in parentheses (e.g., `pilots`, `auth`, `dashboard`)
3. **Subject**: Required, sentence-case, no period at end, max 100 characters
4. **Body**: Optional, separate from subject with blank line, explain "what" and "why"
5. **Footer**: Optional, reference issues/PRs (e.g., `Closes #123`)

### Examples

**Good Commits**:

```bash
feat(certifications): add expiry notification system

Implement automated email notifications for certifications
expiring within 30 days. Notifications sent daily at 6 AM.

Closes #45

---

fix(dashboard): correct pilot count on statistics card

The pilot count was including inactive pilots. Updated query
to filter by is_active flag.

---

docs(api): document leave request endpoints

Added comprehensive API documentation for all leave request
endpoints including request/response examples.
```

**Bad Commits** (Will be rejected):

```bash
# ❌ No type
Added new feature

# ❌ Type in uppercase
FEAT: add feature

# ❌ Subject ends with period
feat: add feature.

# ❌ No subject
feat:

# ❌ Invalid type
update: change something
```

---

## Code Style Guidelines

### TypeScript Patterns

#### Component Structure

```typescript
interface ComponentProps {
  id: string;
  onUpdate?: (data: PilotData) => void;
}

export function PilotCard({ id, onUpdate }: ComponentProps) {
  // 1. Hooks first
  const { data, isLoading } = useQuery(['pilot', id], fetchPilot);

  // 2. State
  const [isEditing, setIsEditing] = useState(false);

  // 3. Effects
  useEffect(() => {
    // Effect logic
  }, [id]);

  // 4. Handlers
  const handleSubmit = async () => {
    // Handler logic
  };

  // 5. Early returns
  if (isLoading) return <LoadingSpinner />;
  if (!data) return <EmptyState />;

  // 6. Main render
  return (
    <div className="pilot-card">
      {/* Component JSX */}
    </div>
  );
}
```

#### Service Layer Pattern

```typescript
// Always use dedicated service functions
import { getSupabaseAdmin } from '@/lib/supabase';

export async function getPilots(filters?: PilotFilters) {
  const supabase = getSupabaseAdmin();

  let query = supabase.from('pilots').select('*').eq('is_active', true);

  if (filters?.role) {
    query = query.eq('role', filters.role);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch pilots:', error);
    throw new Error('Failed to fetch pilots');
  }

  return data;
}
```

#### Type Definitions

```typescript
// Prefer interfaces over types for objects
interface Pilot {
  id: string;
  first_name: string;
  last_name: string;
  employee_id: string;
}

// Use type for unions/primitives
type PilotRole = 'Captain' | 'First Officer';
type PilotStatus = 'active' | 'inactive' | 'on-leave';
```

### React Patterns

#### State Management

```typescript
// ✅ Good - Specific state
const [isLoading, setIsLoading] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});

// ❌ Bad - Generic object
const [state, setState] = useState({});
```

#### Event Handlers

```typescript
// ✅ Good - Type-safe handlers
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // Logic
};

// ✅ Good - Memoized callbacks
const handleDelete = useCallback(async (id: string) => {
  // Logic
}, []);
```

### Air Niugini Branding

Always use Air Niugini brand colors:

```typescript
// ✅ Good - Air Niugini colors
<button className="bg-[#E4002B] hover:bg-[#C00020] text-white">
  Submit
</button>

// ❌ Bad - Generic colors
<button className="bg-blue-500 text-white">
  Submit
</button>
```

**Brand Colors**:

- Primary Red: `#E4002B`
- Gold: `#FFC72C`
- Black: `#000000`
- White: `#FFFFFF`

### Naming Conventions

```typescript
// Components: PascalCase
export function PilotList() {}

// Functions/variables: camelCase
const getPilotData = () => {};
const pilotCount = 27;

// Constants: UPPER_SNAKE_CASE
const ROSTER_DURATION = 28;
const API_BASE_URL = 'https://api.example.com';

// Private variables: prefix with underscore
const _internalHelper = () => {};

// Types/Interfaces: PascalCase
interface PilotData {}
type PilotRole = string;

// File names: kebab-case
// pilot-service.ts
// certification-utils.ts
// dashboard-stats.tsx
```

---

## Git Workflow

### Branch Naming

```bash
# Feature branches
feature/pilot-bulk-update
feature/certification-calendar

# Bug fix branches
fix/dashboard-statistics
fix/login-redirect

# Hotfix branches
hotfix/security-patch
hotfix/critical-data-fix

# Chore/maintenance
chore/update-dependencies
chore/refactor-services
```

### Development Workflow

1. **Create feature branch**:

   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes and commit** (hooks will run automatically):

   ```bash
   git add .
   git commit -m "feat(pilots): add new feature"
   # Pre-commit hook: formats and lints staged files
   # Commit-msg hook: validates commit message format
   ```

3. **Push changes** (comprehensive validation runs):

   ```bash
   git push origin feature/my-feature
   # Pre-push hook: runs type-check, lint, and build
   ```

4. **Create Pull Request**:
   - Use descriptive title following commit convention
   - Fill out PR template
   - Link related issues
   - Request code review

### Git Hooks

Our project uses **Husky** to enforce quality checks:

#### Pre-commit Hook

Runs automatically before each commit:

- ✅ Formats staged files with Prettier
- ✅ Lints and fixes staged TypeScript/JavaScript files
- ✅ Runs type-check on TypeScript files

**Speed**: ~5-10 seconds (fast, only checks staged files)

#### Commit-msg Hook

Validates commit message format:

- ✅ Ensures conventional commit format
- ✅ Checks type, scope, and subject
- ✅ Enforces message length limits

#### Pre-push Hook

Runs before pushing to remote (comprehensive validation):

- ✅ Type checking (TypeScript)
- ✅ Linting (ESLint)
- ✅ Build verification (Next.js build)

**Speed**: ~30-60 seconds (thorough validation)

---

## Pull Request Checklist

Before creating a PR, ensure:

### Code Quality

- [ ] All files formatted with Prettier (`npm run format`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript type check passes (`npm run type-check`)
- [ ] Production build succeeds (`npm run build`)
- [ ] No console errors in browser

### Testing

- [ ] Manual testing completed
- [ ] Playwright E2E tests pass (if applicable)
- [ ] Edge cases tested
- [ ] Mobile responsiveness verified

### Documentation

- [ ] Code comments added for complex logic
- [ ] TypeScript types defined for new interfaces
- [ ] README updated (if needed)
- [ ] CLAUDE.md updated (if architecture changes)

### Air Niugini Standards

- [ ] Brand colors used consistently
- [ ] Aviation terminology accurate
- [ ] Certification status colors correct (red/yellow/green)
- [ ] UI matches Air Niugini style guide

### Database Changes

- [ ] Migration scripts created (if schema changes)
- [ ] Database types regenerated (`npm run db:types`)
- [ ] RLS policies updated (if needed)
- [ ] Indexes added for new queries

### Security

- [ ] No sensitive data in commits
- [ ] Environment variables used for secrets
- [ ] RLS policies enforce permissions
- [ ] Input validation implemented

### Performance

- [ ] Database queries optimized
- [ ] Images optimized/lazy-loaded
- [ ] No unnecessary re-renders
- [ ] Service layer used (no inter-API calls)

---

## Emergency Procedures

### Bypass Git Hooks

In emergency situations (production hotfixes, critical bugs), you can bypass hooks:

```bash
# Skip pre-commit hook
git commit --no-verify -m "hotfix: critical security patch"

# Skip pre-push hook
git push --no-verify
```

**⚠️ WARNING**: Only use `--no-verify` for critical hotfixes. Always fix formatting/linting issues afterward.

### Manual Validation

If hooks fail unexpectedly, run checks manually:

```bash
# Check what's wrong
npm run validate

# Fix issues step by step
npm run format          # Format all files
npm run lint:fix        # Fix linting issues
npm run type-check      # Check TypeScript
npm run build           # Verify build
```

### Fixing Commit Messages

If commit message is rejected:

```bash
# View last commit message
git log -1

# Amend commit message (if not pushed yet)
git commit --amend -m "feat(pilots): correct commit message"

# If already pushed, create new commit
git revert HEAD
git commit -m "revert: incorrect commit"
```

---

## VS Code Integration

Our `.vscode/settings.json` configures:

- ✅ Format on save (Prettier)
- ✅ Auto-fix on save (ESLint)
- ✅ Organize imports on save
- ✅ 100 character ruler
- ✅ Tailwind CSS IntelliSense

**Recommended Extensions** (`.vscode/extensions.json`):

- Prettier - Code formatter
- ESLint
- Tailwind CSS IntelliSense
- Playwright Test
- Supabase VS Code

---

## Additional Resources

- [Prettier Documentation](https://prettier.io/docs/en/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [React Best Practices](https://react.dev/learn)
- [Next.js Documentation](https://nextjs.org/docs)

---

## Questions?

For questions about code standards, contact:

- **Technical Lead**: Maurice Rondeau
- **Project Repository**: `/Users/skycruzer/Desktop/Fleet Office Management/air-niugini-pms`

---

**Air Niugini B767 Pilot Management System**
_Maintaining Code Excellence for Aviation Safety_
