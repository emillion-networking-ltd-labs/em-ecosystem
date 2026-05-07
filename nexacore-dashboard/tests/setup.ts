import "@testing-library/jest-dom";

// Polyfill window.matchMedia for jsdom — required by Tooltip + ThemeToggle.
// jsdom does not provide matchMedia natively.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Polyfill ResizeObserver for jsdom — required by MfaDigitInput (and any
// component that observes element size changes). jsdom has no layout engine
// so this is a no-op stub; tests that need to assert observer behaviour
// should mock it per-test.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
  ResizeObserverStub;
