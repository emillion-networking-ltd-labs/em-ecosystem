import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, act, cleanup } from "@testing-library/react";
import CopyField from "../components/CopyField";

// jsdom no calcula layout → forzamos scrollWidth/clientWidth para simular que el texto trunca (o no).
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

// ECO-118/129: el valor largo TRUNCA (…) y el tooltip con el valor completo sale SOLO cuando no cabe.
describe("CopyField — tooltip con el valor completo solo cuando trunca (ECO-118/129)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    cleanup();
    delete (HTMLElement.prototype as Record<string, unknown>).scrollWidth;
    delete (HTMLElement.prototype as Record<string, unknown>).clientWidth;
  });

  const long = "sk-live-" + "x".repeat(60);

  it("cuando el valor NO cabe: muestra el valor completo en un tooltip al hover", () => {
    setTruncation(true);
    const { container } = render(<CopyField value={long} />);
    const code = container.querySelector("code")!;
    expect(code.className).toMatch(/\btruncate\b/);

    act(() => fireEvent.mouseEnter(code.parentElement!));
    act(() => vi.advanceTimersByTime(250));

    const tip = document.querySelector('[role="tooltip"]');
    expect(tip).toBeInTheDocument();
    expect(tip).toHaveTextContent(long);
  });

  it("cuando el valor CABE: NO muestra tooltip", () => {
    setTruncation(false);
    const { container } = render(<CopyField value="short" />);

    act(() =>
      fireEvent.mouseEnter(container.querySelector("code")!.parentElement!),
    );
    act(() => vi.advanceTimersByTime(250));

    expect(document.querySelector('[role="tooltip"]')).not.toBeInTheDocument();
  });
});
