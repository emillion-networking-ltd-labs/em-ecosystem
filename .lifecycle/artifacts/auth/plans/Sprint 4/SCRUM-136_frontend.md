# Frontend Implementation Plan: SCRUM-136 Configure Jest + RTL Test Infrastructure for nexacore-dashboard

## Overview

Configure Jest and React Testing Library (RTL) test infrastructure for the `nexacore-dashboard` Next.js 14 App Router project. Currently the project has zero test configuration — no `jest.config.ts`, no testing devDependencies, no test directories. All 6 Sprint 4 frontend tickets deferred tests citing this gap.

This ticket installs and configures the testing stack, creates reusable test utilities (provider wrapper, common mocks), and writes 1 smoke test per UI component category to validate the setup works end-to-end.

## Architecture Context

- **Framework**: Next.js 14.2.21 (App Router) + React 18.3.1 + TypeScript 5.4.5
- **Path aliases**: `@/*` → `./src/*` (tsconfig.json)
- **Provider hierarchy**: ThemeProvider → ToastProvider → AuthProvider → PermissionsProvider
- **Component categories**: `ui/` (17), `auth/` (10), `dashboard/` (8), `layout/` (4), `profile/` (11), `guards/` (5), `admin/` (5), `icons/` (1) = **61 total components**
- **Key mocking targets**: `next/navigation`, `next/image`, `@/lib/api` (ApiClient singleton), `@/context/AuthContext`, `@/lib/fingerprint`, `@/lib/csrf`, `lucide-react`, `recharts`
- **Test directory convention**: `tests/` (not `__tests__/`, per project conventions)
- **Test file pattern**: `*.test.tsx` (following frontend convention, vs backend's `*.spec.ts`)

### Files Referenced

| File | Relevance |
|------|-----------|
| `package.json` | Add devDependencies + test scripts |
| `tsconfig.json` | Path aliases (`@/*`) to map in Jest |
| `next.config.mjs` | No test-related config needed |
| `src/app/providers.tsx` | Provider hierarchy for test wrapper |
| `src/lib/api.ts` | ApiClient singleton to mock |
| `src/context/AuthContext.tsx` | AuthProvider + useAuth hook to mock |
| `src/components/ui/Button.tsx` | Smoke test target — uses Spinner, variants, loading state |
| `src/components/ui/Input.tsx` | Smoke test target — label, error, password toggle, aria |
| `src/components/ui/Spinner.tsx` | Smoke test target — role="status", sizes |
| `src/components/ui/ErrorAlert.tsx` | Smoke test target — error messages |
| `src/components/ui/Pagination.tsx` | Smoke test target — page navigation |

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to a new feature branch
- **Branch Naming**: `feature/SCRUM-136-frontend`
- **Implementation Steps**:
  1. `cd nexacore-dashboard`
  2. `git checkout main && git pull origin main`
  3. `git checkout -b feature/SCRUM-136-frontend`
  4. `git branch` — verify on the new branch

### Step 1: Install Testing Dependencies

- **File**: `package.json`
- **Action**: Install all required testing packages as devDependencies
- **Implementation Steps**:
  1. Install core testing packages:
     ```
     npm install -D jest @types/jest ts-jest jest-environment-jsdom
     ```
  2. Install React Testing Library:
     ```
     npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
     ```
  3. Install identity-obj-proxy for CSS module mocking (safety, though project uses Tailwind):
     ```
     npm install -D identity-obj-proxy
     ```
  4. Verify installation: check `package.json` devDependencies includes all 7 packages
- **Dependencies**: None (these are the first testing packages)
- **Implementation Notes**:
  - Use `ts-jest` (not `@swc/jest`) to match the backend's transform approach
  - `@testing-library/user-event` is preferred over `fireEvent` for realistic user interaction simulation
  - `identity-obj-proxy` handles any CSS/SCSS imports that might appear in components

### Step 2: Create Jest Configuration

- **File**: `jest.config.ts` (NEW — root of nexacore-dashboard)
- **Action**: Create Jest config for Next.js 14 App Router with TypeScript
- **Implementation Steps**:
  1. Create `jest.config.ts` with the following configuration:
     ```typescript
     import type { Config } from 'jest';

     const config: Config = {
       testEnvironment: 'jsdom',
       roots: ['<rootDir>/tests'],
       testMatch: ['**/*.test.ts', '**/*.test.tsx'],
       transform: {
         '^.+\\.tsx?$': ['ts-jest', {
           tsconfig: 'tsconfig.json',
           jsx: 'react-jsx',
         }],
       },
       moduleNameMapper: {
         '^@/(.*)$': '<rootDir>/src/$1',
         '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
         '\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$': '<rootDir>/tests/__mocks__/fileMock.ts',
       },
       setupFilesAfterSetup: ['<rootDir>/tests/setup.ts'],
       collectCoverageFrom: [
         'src/components/**/*.{ts,tsx}',
         'src/lib/**/*.{ts,tsx}',
         'src/hooks/**/*.{ts,tsx}',
         '!src/**/*.d.ts',
       ],
       coverageDirectory: 'coverage',
       workerIdleMemoryLimit: '512MB',
       maxWorkers: '50%',
     };

     export default config;
     ```
  2. **CRITICAL**: The `setupFilesAfterSetup` key must be `setupFilesAfterSetup` and point to `tests/setup.ts`
  3. **Path alias**: `'^@/(.*)$': '<rootDir>/src/$1'` maps the `@/` alias used throughout the project
- **Implementation Notes**:
  - `roots: ['<rootDir>/tests']` — tests live in a separate `tests/` directory, not co-located
  - `jsx: 'react-jsx'` in ts-jest config enables JSX transform without `React` import
  - No `testRegex` needed — `testMatch` is sufficient and more readable

### Step 3: Create Test Setup File

- **File**: `tests/setup.ts` (NEW)
- **Action**: Configure global test setup with jest-dom matchers and common mocks
- **Implementation Steps**:
  1. Create `tests/setup.ts`:
     ```typescript
     import '@testing-library/jest-dom';
     ```
  2. This file auto-extends Jest matchers with `.toBeInTheDocument()`, `.toHaveAttribute()`, etc.
- **Implementation Notes**:
  - Keep this file minimal — only global setup that applies to ALL tests
  - Component-specific mocks go in individual test files or `tests/__mocks__/` directory

### Step 4: Create Mock Files

- **File**: `tests/__mocks__/fileMock.ts` (NEW)
- **File**: `tests/__mocks__/next-navigation.ts` (NEW)
- **File**: `tests/__mocks__/next-image.ts` (NEW)
- **Action**: Create reusable mock modules for common Next.js dependencies
- **Implementation Steps**:
  1. Create `tests/__mocks__/fileMock.ts`:
     ```typescript
     export default 'test-file-stub';
     ```
  2. Create `tests/__mocks__/next-navigation.ts`:
     ```typescript
     export const useRouter = jest.fn(() => ({
       push: jest.fn(),
       replace: jest.fn(),
       back: jest.fn(),
       forward: jest.fn(),
       refresh: jest.fn(),
       prefetch: jest.fn(),
     }));

     export const usePathname = jest.fn(() => '/');
     export const useSearchParams = jest.fn(() => new URLSearchParams());
     export const useParams = jest.fn(() => ({}));
     export const redirect = jest.fn();
     ```
  3. Create `tests/__mocks__/next-image.ts`:
     ```typescript
     const MockImage = (props: Record<string, unknown>) => {
       // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
       return <img {...props} />;
     };
     MockImage.displayName = 'MockImage';
     export default MockImage;
     ```
- **Implementation Notes**:
  - `next/navigation` is used by AuthContext, guards, and multiple components — must be mocked globally
  - `next/image` renders as a regular `<img>` in tests for simplicity
  - These mocks are imported manually in test files (not auto-mocked) for explicit control

### Step 5: Create Test Utilities — Render Helper

- **File**: `tests/test-utils.tsx` (NEW)
- **Action**: Create a custom render function that wraps components in required providers
- **Implementation Steps**:
  1. Create `tests/test-utils.tsx`:
     ```typescript
     import { render, type RenderOptions } from '@testing-library/react';
     import { type ReactElement } from 'react';

     // Minimal provider wrapper for unit tests
     // Most UI components don't need context providers
     // For components that do, mock the specific hook (useAuth, useTheme, etc.)

     function AllProviders({ children }: { children: React.ReactNode }) {
       return <>{children}</>;
     }

     function customRender(
       ui: ReactElement,
       options?: Omit<RenderOptions, 'wrapper'>,
     ) {
       return render(ui, { wrapper: AllProviders, ...options });
     }

     // Re-export everything from RTL
     export * from '@testing-library/react';
     export { customRender as render };
     ```
  2. This custom render can be extended later to include ThemeProvider or other providers as needed
- **Implementation Notes**:
  - Start with a minimal wrapper — don't pre-add all 4 providers since most UI components don't need them
  - Components that need AuthContext should mock `useAuth` directly in their test file
  - Re-exports all RTL utilities so tests import from `tests/test-utils` instead of `@testing-library/react`

### Step 6: Add npm Scripts

- **File**: `package.json`
- **Action**: Add test-related scripts
- **Implementation Steps**:
  1. Add to `scripts` section:
     ```json
     "test": "jest",
     "test:watch": "jest --watch",
     "test:cov": "jest --coverage"
     ```
  2. These mirror the backend's script naming pattern
- **Implementation Notes**:
  - No `test:e2e` script yet — out of scope for this ticket
  - No `test:debug` — can be added when needed

### Step 7: Write Smoke Tests — UI Components

- **File**: `tests/components/ui/Button.test.tsx` (NEW)
- **File**: `tests/components/ui/Input.test.tsx` (NEW)
- **File**: `tests/components/ui/Spinner.test.tsx` (NEW)
- **File**: `tests/components/ui/ErrorAlert.test.tsx` (NEW)
- **File**: `tests/components/ui/Pagination.test.tsx` (NEW)
- **Action**: Write 1 smoke test per component to validate the test infrastructure works
- **Implementation Steps**:
  1. **Button.test.tsx** — Test render, variants, loading state, disabled state:
     ```typescript
     import { render, screen } from '../../test-utils';
     import Button from '@/components/ui/Button';

     describe('Button', () => {
       it('renders children text', () => {
         render(<Button>Click me</Button>);
         expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
       });

       it('shows spinner when loading', () => {
         render(<Button loading>Submit</Button>);
         expect(screen.getByRole('status')).toBeInTheDocument();
         expect(screen.queryByText('Submit')).not.toBeInTheDocument();
       });

       it('is disabled when disabled prop is set', () => {
         render(<Button disabled>Click</Button>);
         expect(screen.getByRole('button')).toBeDisabled();
       });

       it('is disabled when loading', () => {
         render(<Button loading>Click</Button>);
         expect(screen.getByRole('button')).toBeDisabled();
       });
     });
     ```
  2. **Input.test.tsx** — Test label, error state, password toggle:
     ```typescript
     import { render, screen } from '../../test-utils';
     import userEvent from '@testing-library/user-event';
     import Input from '@/components/ui/Input';

     describe('Input', () => {
       it('renders with label', () => {
         render(<Input label="Email" name="email" />);
         expect(screen.getByLabelText('Email')).toBeInTheDocument();
       });

       it('shows error message', () => {
         render(<Input label="Email" name="email" error="Invalid email" />);
         expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
       });

       it('toggles password visibility', async () => {
         const user = userEvent.setup();
         render(<Input label="Password" name="password" type="password" />);
         const toggleBtn = screen.getByLabelText('Show password');
         await user.click(toggleBtn);
         expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
       });
     });
     ```
  3. **Spinner.test.tsx** — Test render and accessibility:
     ```typescript
     import { render, screen } from '../../test-utils';
     import Spinner from '@/components/ui/Spinner';

     describe('Spinner', () => {
       it('renders with status role', () => {
         render(<Spinner />);
         expect(screen.getByRole('status')).toBeInTheDocument();
       });

       it('has loading aria-label', () => {
         render(<Spinner />);
         expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
       });
     });
     ```
  4. **ErrorAlert.test.tsx** — Read the component first, then test render + message display
  5. **Pagination.test.tsx** — Read the component first, then test page buttons + navigation callbacks
- **Implementation Notes**:
  - Each test file imports from `../../test-utils` (custom render) instead of `@testing-library/react`
  - Smoke tests validate: renders without crashing, key DOM elements present, basic interactions work
  - These are NOT comprehensive tests — they prove the infrastructure works. Comprehensive tests come later.
  - `lucide-react` icons render as SVG — no special mocking needed since jsdom supports SVG

### Step 8: Validate Infrastructure

- **Action**: Run all tests and verify everything works
- **Implementation Steps**:
  1. Run `npm test` — expect all smoke tests to pass (0 failures)
  2. Run `npm run test:cov` — verify coverage report generates
  3. Run `npm run build` — verify build still passes (jest config doesn't break Next.js)
  4. Fix any issues discovered during validation
- **Implementation Notes**:
  - Common issues: missing module mocks, TypeScript path resolution, JSX transform errors
  - If `ts-jest` has issues with `'use client'` directive, add `transformIgnorePatterns` for node_modules

### Step 9: Update Technical Documentation

- **Action**: Update frontend-standards.mdc with actual test configuration details
- **Implementation Steps**:
  1. **frontend-standards.mdc**: Update "Testing Framework" section to reflect actual installed versions and configuration
  2. **frontend-standards.mdc**: Update "Development Scripts" section to include test scripts
  3. **integration-state.md**: Add changelog entry for SCRUM-136
- **References**: Follow `ai-specs/specs/documentation-standards.mdc`

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Install testing dependencies
3. Step 2: Create Jest configuration (`jest.config.ts`)
4. Step 3: Create test setup file (`tests/setup.ts`)
5. Step 4: Create mock files (file, next/navigation, next/image)
6. Step 5: Create test utilities (`tests/test-utils.tsx`)
7. Step 6: Add npm scripts to `package.json`
8. Step 7: Write smoke tests (5 UI components)
9. Step 8: Validate infrastructure (run tests, coverage, build)
10. Step 9: Update technical documentation

## Testing Checklist

- [ ] `npm test` passes with 0 failures
- [ ] `npm run test:cov` generates coverage report
- [ ] `npm run build` still passes (no regression)
- [ ] Button smoke tests pass (render, loading, disabled)
- [ ] Input smoke tests pass (label, error, password toggle)
- [ ] Spinner smoke tests pass (role, aria-label)
- [ ] ErrorAlert smoke tests pass (render, message)
- [ ] Pagination smoke tests pass (render, navigation)
- [ ] Path alias `@/` resolves correctly in tests
- [ ] CSS imports don't crash tests (identity-obj-proxy)
- [ ] `lucide-react` icons render without errors

## Error Handling Patterns

Not directly applicable to this ticket (infrastructure setup), but the test utilities establish patterns for testing error handling:
- Use `screen.getByRole('alert')` to find error messages
- Mock `apiClient.request` to simulate API errors in component tests
- Use `jest.spyOn` on console.error to verify error logging without polluting test output

## UI/UX Considerations

Not applicable — this ticket is infrastructure-only, no UI changes.

## Dependencies

| Package | Purpose | Type |
|---------|---------|------|
| `jest` | Test runner | devDependency |
| `@types/jest` | TypeScript types for Jest | devDependency |
| `ts-jest` | TypeScript transform for Jest | devDependency |
| `jest-environment-jsdom` | Browser-like environment for DOM testing | devDependency |
| `@testing-library/react` | React component testing utilities | devDependency |
| `@testing-library/jest-dom` | Custom Jest matchers for DOM assertions | devDependency |
| `@testing-library/user-event` | Realistic user interaction simulation | devDependency |
| `identity-obj-proxy` | CSS module import mock | devDependency |

## Notes

- **No production code changes**: This ticket only adds test infrastructure and devDependencies
- **Backend reference**: `nexacore-api` uses `ts-jest` with similar config — maintaining consistency
- **Test directory**: `tests/` at project root (not `__tests__/`), per project convention
- **File naming**: `*.test.tsx` for frontend tests (vs `*.spec.ts` for backend) — this is a common Next.js convention
- **No snapshot tests**: Avoid snapshot testing — prefer explicit assertions on DOM elements and behavior
- **Future tickets**: After this infrastructure is in place, Sprint 4 tickets can be revisited to add proper tests

## Next Steps After Implementation

1. Run `/commit SCRUM-136` to create PR, merge to main, delete branch
2. Run `/update-docs SCRUM-136` to create implementation record
3. Optionally: create follow-up tickets to add tests to Sprint 4 components (SCRUM-128 through SCRUM-134)

## Implementation Verification

- [ ] **Code Quality**: Jest config follows project conventions, matches backend patterns
- [ ] **Functionality**: All 5 smoke tests pass, coverage report generates
- [ ] **Testing**: Meta-verification — the tests themselves ARE the verification
- [ ] **Integration**: `npm run build` still passes, no conflict with Next.js config
- [ ] **Documentation**: frontend-standards.mdc updated with actual test setup details
