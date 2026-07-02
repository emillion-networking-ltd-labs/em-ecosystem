import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import EmailSelector from "../components/EmailSelector";

// jsdom no calcula layout → forzamos scrollWidth/clientWidth para simular que el email trunca (o no).
function setTruncation(truncated: boolean) {
  Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
    configurable: true,
    get: () => (truncated ? 300 : 100),
  });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => 100,
  });
}

// ECO-118/129: el email largo TRUNCA (max-w + …) y el tooltip con el email completo sale SOLO cuando no cabe.
describe("EmailSelector — tooltip con el email completo solo cuando trunca (ECO-118/129)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    cleanup();
    delete (HTMLElement.prototype as Record<string, unknown>).scrollWidth;
    delete (HTMLElement.prototype as Record<string, unknown>).clientWidth;
  });

  const long = "a-very-long-email-address@long-company-example.com";

  it("cuando el email NO cabe: trunca + tooltip con el email completo al hover", () => {
    setTruncation(true);
    render(<EmailSelector email={long} onChangeEmail={() => {}} />);
    const span = screen.getByText(long); // cerrado → solo está en el trigger
    expect(span.className).toMatch(/\btruncate\b/);
    expect(span.className).toMatch(/max-w/);

    // El tooltip está sobre TODO el trigger → el hover se dispara en el botón.
    act(() => fireEvent.mouseEnter(screen.getByRole("button")));
    act(() => vi.advanceTimersByTime(250));

    const tip = document.querySelector('[role="tooltip"]');
    expect(tip).toBeInTheDocument();
    expect(tip).toHaveTextContent(long);
  });

  it("cuando el email CABE: NO muestra tooltip", () => {
    setTruncation(false);
    render(<EmailSelector email="a@b.com" onChangeEmail={() => {}} />);

    act(() => fireEvent.mouseEnter(screen.getByRole("button")));
    act(() => vi.advanceTimersByTime(250));

    expect(document.querySelector('[role="tooltip"]')).not.toBeInTheDocument();
  });
});
