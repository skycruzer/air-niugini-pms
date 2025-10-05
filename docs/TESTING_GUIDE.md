# Testing Guide - Air Niugini B767 Pilot Management System

**Comprehensive testing setup for Jest & React Testing Library**

## Table of Contents

1. [Overview](#overview)
2. [Test Stack](#test-stack)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Utilities](#test-utilities)
6. [Best Practices](#best-practices)
7. [Coverage Requirements](#coverage-requirements)
8. [Examples](#examples)

---

## Overview

This project uses **Jest 29** and **React Testing Library 14** for unit and integration testing. The testing setup is configured for Next.js 14 with TypeScript and follows aviation industry best practices for critical safety systems.

### Testing Philosophy

- **Test behavior, not implementation**: Focus on what the user sees and experiences
- **AAA Pattern**: Arrange → Act → Assert for clear test structure
- **Mock external dependencies**: Supabase, API calls, and third-party libraries
- **Air Niugini standards**: Verify brand colors, aviation compliance, and certification logic

---

## Test Stack

| Package                        | Version | Purpose                                  |
|--------------------------------|---------|------------------------------------------|
| jest                           | ^29.7.0 | Test runner and framework                |
| @testing-library/react         | ^14.3.1 | React component testing utilities        |
| @testing-library/jest-dom      | ^6.9.0  | Custom Jest matchers for DOM assertions  |
| @testing-library/user-event    | ^14.6.1 | Simulate user interactions               |
| jest-environment-jsdom         | ^30.2.0 | Browser-like environment for Jest        |
| @types/jest                    | ^30.0.0 | TypeScript definitions for Jest          |

---

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# CI/CD optimized (with coverage)
npm run test:ci
```

### Test Output

```
PASS  src/components/ui/__tests__/StatusBadge.test.tsx
PASS  src/components/ui/__tests__/StatCard.test.tsx
PASS  src/lib/__tests__/certification-utils.test.ts

Test Suites: 3 passed, 3 total
Tests:       48 passed, 48 total
Snapshots:   0 total
Time:        3.456s
```

### Coverage Report

After running `npm run test:coverage`, open `coverage/lcov-report/index.html` in your browser to view detailed coverage statistics.

**Target Coverage**: 80%+ across all metrics (branches, functions, lines, statements)

---

## Writing Tests

### File Structure

Place test files adjacent to the code they test:

```
src/
├── components/
│   └── ui/
│       ├── StatusBadge.tsx
│       └── __tests__/
│           └── StatusBadge.test.tsx
├── lib/
│   ├── certification-utils.ts
│   └── __tests__/
│       └── certification-utils.test.ts
```

### Test File Naming

- Component tests: `ComponentName.test.tsx`
- Utility tests: `utilityName.test.ts`
- Integration tests: `feature.integration.test.tsx`

### Basic Test Structure

```typescript
/**
 * Component/Function Tests
 * Brief description of what is being tested
 */

import { render, screen } from '@testing-library/react'
import { ComponentName } from '../ComponentName'

describe('ComponentName', () => {
  describe('Feature Group', () => {
    it('should do something specific', () => {
      // Arrange
      const props = { value: 'test' }

      // Act
      render(<ComponentName {...props} />)

      // Assert
      expect(screen.getByText('test')).toBeInTheDocument()
    })
  })
})
```

---

## Test Utilities

### Custom Render Functions

Located in `src/test-utils/test-utils.tsx`:

#### `renderWithProviders()`

Wraps component with all necessary providers (React Query, Auth):

```typescript
import { renderWithProviders } from '@/test-utils/test-utils'

it('renders with providers', () => {
  renderWithProviders(<MyComponent />)
  // Component has access to QueryClient and AuthContext
})
```

#### `renderWithAuth()`

Wraps component with mock authentication:

```typescript
import { renderWithAuth } from '@/test-utils/test-utils'

it('renders for admin user', () => {
  renderWithAuth(
    <MyComponent />,
    {
      user: {
        id: 'admin-1',
        email: 'admin@airniugini.com.pg',
        role: 'admin',
        name: 'Test Admin'
      }
    }
  )
})
```

### Mock Data

Located in `src/test-utils/mock-data.ts`:

```typescript
import {
  mockPilots,
  mockCheckTypes,
  mockPilotChecks,
  createMockPilot,
  createMockCertification
} from '@/test-utils/mock-data'

it('displays pilot information', () => {
  const pilot = createMockPilot({
    first_name: 'John',
    last_name: 'Doe',
    employee_id: 'PX999'
  })

  render(<PilotCard pilot={pilot} />)
  expect(screen.getByText('John Doe')).toBeInTheDocument()
})
```

### Mock Supabase Client

Located in `src/test-utils/mock-supabase.ts`:

```typescript
import { createMockSupabaseClient } from '@/test-utils/mock-supabase'

jest.mock('@/lib/supabase', () => ({
  supabase: createMockSupabaseClient()
}))

it('fetches pilots from database', async () => {
  const { data } = await supabase.from('pilots').select('*')
  expect(data).toHaveLength(3) // Returns mock data
})
```

### Test Helpers

Located in `src/test-utils/test-helpers.ts`:

```typescript
import {
  waitForElementToBeRemoved,
  mockDate,
  mockLocalStorage,
  assertAirNiuginiBranding
} from '@/test-utils/test-helpers'

it('handles date-dependent logic', () => {
  const restoreDate = mockDate('2025-10-01T00:00:00Z')

  // Test with fixed date
  const period = getCurrentRosterPeriod()
  expect(period.code).toBe('RP11/2025')

  restoreDate() // Clean up
})
```

---

## Best Practices

### 1. Follow AAA Pattern

```typescript
it('calculates compliance percentage correctly', () => {
  // Arrange: Set up test data
  const certifications = [
    { expiry_date: '2026-01-01' }, // current
    { expiry_date: '2024-01-01' }  // expired
  ]

  // Act: Execute the function
  const percentage = calculateCompliancePercentage(certifications)

  // Assert: Verify the result
  expect(percentage).toBe(50)
})
```

### 2. Test User Behavior

```typescript
// ✅ Good - tests what the user sees
it('displays error when form is invalid', async () => {
  const user = userEvent.setup()
  render(<PilotForm />)

  await user.click(screen.getByRole('button', { name: /submit/i }))

  expect(screen.getByText('Employee ID required')).toBeInTheDocument()
})

// ❌ Bad - tests implementation details
it('sets error state', () => {
  const { result } = renderHook(() => useForm())
  result.current.setError('employee_id', { message: 'Required' })
  expect(result.current.errors.employee_id).toBeDefined()
})
```

### 3. Use Descriptive Test Names

```typescript
// ✅ Good - clear and specific
it('returns red status for certifications expired more than 1 day ago', () => {})

// ❌ Bad - vague
it('works correctly', () => {})
```

### 4. Mock External Dependencies

```typescript
// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/'
  })
}))

// Mock API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: [] })
  })
) as jest.Mock
```

### 5. Clean Up After Tests

```typescript
afterEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})
```

### 6. Test Error Scenarios

```typescript
it('displays error message when API call fails', async () => {
  global.fetch = jest.fn(() => Promise.reject(new Error('Network error')))

  render(<PilotList />)

  await waitFor(() => {
    expect(screen.getByText(/failed to load pilots/i)).toBeInTheDocument()
  })
})
```

---

## Coverage Requirements

### Thresholds (jest.config.js)

```javascript
coverageThresholds: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

### What to Test

**High Priority (80%+ coverage)**:
- Core business logic (`certification-utils.ts`, `roster-utils.ts`)
- Critical UI components (`StatusBadge`, `StatCard`)
- Service layer functions (`pilot-service.ts`)
- Form validation logic

**Medium Priority (60%+ coverage)**:
- UI components with complex interactions
- Hooks with state management
- API route handlers

**Lower Priority**:
- Simple presentational components
- Type definitions
- Configuration files
- Next.js app directory pages (tested via E2E)

---

## Examples

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '../StatusBadge'

describe('StatusBadge', () => {
  it('renders current status with green color', () => {
    render(<StatusBadge status="current" />)

    const badge = screen.getByText('Current')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('renders with custom label', () => {
    render(<StatusBadge status="current" label="All Good" />)

    expect(screen.getByText('All Good')).toBeInTheDocument()
    expect(screen.queryByText('Current')).not.toBeInTheDocument()
  })
})
```

### Utility Function Test Example

```typescript
import { getCertificationStatus } from '../certification-utils'
import { addDays, subDays } from 'date-fns'

describe('getCertificationStatus', () => {
  it('returns expired status for past dates', () => {
    const expiredDate = subDays(new Date(), 10)
    const status = getCertificationStatus(expiredDate)

    expect(status.color).toBe('red')
    expect(status.label).toBe('Expired')
    expect(status.daysUntilExpiry).toBeLessThan(0)
  })

  it('returns expiring status within 30 days', () => {
    const expiringDate = addDays(new Date(), 15)
    const status = getCertificationStatus(expiringDate)

    expect(status.color).toBe('yellow')
    expect(status.label).toBe('Expiring Soon')
    expect(status.daysUntilExpiry).toBe(15)
  })
})
```

### Async Test Example

```typescript
import { waitFor } from '@testing-library/react'

it('loads and displays pilots', async () => {
  render(<PilotList />)

  // Wait for loading to complete
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  // Verify data is displayed
  expect(screen.getByText('Michael Kaupa')).toBeInTheDocument()
  expect(screen.getByText('PX201')).toBeInTheDocument()
})
```

### User Interaction Test Example

```typescript
import userEvent from '@testing-library/user-event'

it('submits form with valid data', async () => {
  const user = userEvent.setup()
  const onSubmit = jest.fn()

  render(<PilotForm onSubmit={onSubmit} />)

  // Fill out form
  await user.type(screen.getByLabelText(/employee id/i), 'PX999')
  await user.type(screen.getByLabelText(/first name/i), 'John')
  await user.type(screen.getByLabelText(/last name/i), 'Doe')

  // Submit
  await user.click(screen.getByRole('button', { name: /submit/i }))

  // Verify submission
  expect(onSubmit).toHaveBeenCalledWith({
    employee_id: 'PX999',
    first_name: 'John',
    last_name: 'Doe'
  })
})
```

---

## Air Niugini Specific Testing

### Brand Color Verification

```typescript
it('uses Air Niugini primary red color', () => {
  const { container } = render(<Button variant="primary">Click Me</Button>)

  const button = container.firstChild
  expect(button).toHaveClass('bg-[#E4002B]')
})
```

### Aviation Compliance Testing

```typescript
it('follows FAA color coding for certification status', () => {
  const expired = getCertificationStatus(subDays(new Date(), 1))
  const expiring = getCertificationStatus(addDays(new Date(), 15))
  const current = getCertificationStatus(addDays(new Date(), 90))

  expect(expired.color).toBe('red')    // Critical - not safe to operate
  expect(expiring.color).toBe('yellow') // Warning - action required
  expect(current.color).toBe('green')   // Safe - compliant
})
```

### Roster Period Testing

```typescript
it('calculates 28-day roster periods correctly', () => {
  const period = getCurrentRosterPeriod()

  expect(period.code).toMatch(/^RP\d{1,2}\/\d{4}$/) // e.g., RP11/2025
  expect(differenceInDays(period.endDate, period.startDate)).toBe(27) // 28 days inclusive
})
```

---

## Troubleshooting

### Common Issues

**Issue**: `Cannot find module '@/lib/utils'`
**Solution**: Check `moduleNameMapper` in `jest.config.js` includes path aliases

**Issue**: `ReferenceError: window is not defined`
**Solution**: Ensure `testEnvironment: 'jsdom'` is set in Jest config

**Issue**: `TypeError: Cannot read property 'matchMedia' of undefined`
**Solution**: Mock `window.matchMedia` in `jest.setup.js`

**Issue**: Tests fail with `IntersectionObserver is not defined`
**Solution**: Mock `IntersectionObserver` in `jest.setup.js`

### Debug Mode

Run tests with `--verbose` flag for detailed output:

```bash
npm test -- --verbose
```

Use `screen.debug()` to print current DOM state:

```typescript
it('debugs component output', () => {
  render(<MyComponent />)
  screen.debug() // Prints entire DOM
  screen.debug(screen.getByRole('button')) // Prints specific element
})
```

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)

---

**Air Niugini B767 Pilot Management System**
*Testing Guide - Version 1.0*
*Last Updated: October 2025*
