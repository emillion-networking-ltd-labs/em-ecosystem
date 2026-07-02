import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, act, cleanup } from "@testing-library/react";
import CopyField from "../components/CopyField";

// ECO-118: el valor largo TRUNCA (…) y el completo se ve en un tooltip al hover (el botón lo copia).
describe("CopyField — trunca + tooltip con el valor completo (ECO-118)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    cleanup();
  });

  const long = "sk-live-" + "x".repeat(60);

  it("trunca el <code> y muestra el valor completo en un tooltip al hover", () => {
    const { container } = render(<CopyField value={long} />);
    const code = container.querySelector("code")!;
    expect(code.className).toMatch(/\btruncate\b/);

    act(() => fireEvent.mouseEnter(code));
    act(() => vi.advanceTimersByTime(250));

    const tip = document.querySelector('[role="tooltip"]');
    expect(tip).toBeInTheDocument();
    expect(tip).toHaveTextContent(long);
  });
});
