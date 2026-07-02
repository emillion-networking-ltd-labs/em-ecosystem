import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom no implementa matchMedia; Tooltip lo consulta para detectar dispositivos táctiles.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}
