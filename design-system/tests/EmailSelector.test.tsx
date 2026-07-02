import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import EmailSelector from "../components/EmailSelector";

// ECO-118: el email largo del trigger TRUNCA (max-w + …) en vez de agrandar el control; el completo se ve
// en un tooltip al hover.
describe("EmailSelector — trigger trunca + tooltip con el email completo (ECO-118)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    cleanup();
  });

  const long = "a-very-long-email-address@long-company-example.com";

  it("trunca el email del trigger y lo muestra completo en un tooltip al hover", () => {
    render(<EmailSelector email={long} onChangeEmail={() => {}} />);
    const span = screen.getByText(long); // cerrado → solo está en el trigger
    expect(span.className).toMatch(/\btruncate\b/);
    expect(span.className).toMatch(/max-w/);

    // El tooltip está sobre TODO el trigger (no el span) → el hover se dispara en el botón.
    const trigger = screen.getByRole("button");
    act(() => fireEvent.mouseEnter(trigger));
    act(() => vi.advanceTimersByTime(250));

    const tip = document.querySelector('[role="tooltip"]');
    expect(tip).toBeInTheDocument();
    expect(tip).toHaveTextContent(long);
  });
});
