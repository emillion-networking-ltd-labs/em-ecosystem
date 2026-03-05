import { render, type RenderOptions } from '@testing-library/react';
import { type ReactElement } from 'react';

/**
 * Minimal provider wrapper for unit tests.
 * Most UI components don't need context providers.
 * For components that do, mock the specific hook (useAuth, useTheme, etc.)
 * in the individual test file.
 */
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
