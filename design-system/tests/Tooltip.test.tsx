import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import Tooltip from "../components/Tooltip";

// jsdom has no layout, so getBoundingClientRect returns zeros. We force the trigger's viewport rect to
// drive the tooltip's fixed coords deterministically — the real bug is about WHEN the component recomputes.
function mockRect(el: Element, rect: Partial<DOMRect>) {
  const full: DOMRect = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON() {},
    ...rect,
  };
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue(full);
}

// ECO-116 regression test: the Tooltip computed its coords once on open (position: fixed) and did NOT
// listen to scroll/resize, so scrolling with the tooltip open left it detached from the trigger. The fix
// re-anchors on 'scroll' (capture) + 'resize'. This test opens the tooltip, moves the trigger and fires a
// scroll, and asserts the tooltip's coords track the trigger. Fails pre-fix (stale coords); passes after.
describe("Tooltip — re-anchors on scroll (ECO-116)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    cleanup();
    vi.restoreAllMocks();
  });

  it("follows the trigger when a scroll fires while open", () => {
    render(
      <Tooltip content="Hi" position="bottom">
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole("button", { name: "Trigger" });
    // Trigger initially sits at bottom = 120 in the viewport.
    mockRect(trigger, {
      top: 100,
      bottom: 120,
      left: 0,
      right: 60,
      width: 60,
      height: 20,
    });

    // Open it: hover schedules showTooltip after the 200ms delay.
    act(() => fireEvent.mouseEnter(trigger));
    act(() => vi.advanceTimersByTime(250));

    const tip = screen.getByRole("tooltip");
    // position="bottom" → top = trigger.bottom + GAP(8) = 128.
    expect(tip.style.top).toBe("128px");

    // Scroll happens: the trigger moves up (bottom now 20). Fire the scroll the component must listen to.
    mockRect(trigger, {
      top: 0,
      bottom: 20,
      left: 0,
      right: 60,
      width: 60,
      height: 20,
    });
    act(() => window.dispatchEvent(new Event("scroll")));

    // Must re-anchor: top = 20 + 8 = 28. Pre-fix the coords stay at 128 (no scroll listener) → this fails.
    expect(tip.style.top).toBe("28px");
  });

  it("re-anchors on resize too", () => {
    render(
      <Tooltip content="Hi" position="bottom">
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole("button", { name: "Trigger" });
    mockRect(trigger, {
      top: 100,
      bottom: 120,
      left: 0,
      right: 60,
      width: 60,
      height: 20,
    });
    act(() => fireEvent.mouseEnter(trigger));
    act(() => vi.advanceTimersByTime(250));
    const tip = screen.getByRole("tooltip");
    expect(tip.style.top).toBe("128px");

    mockRect(trigger, {
      top: 40,
      bottom: 60,
      left: 0,
      right: 60,
      width: 60,
      height: 20,
    });
    act(() => window.dispatchEvent(new Event("resize")));
    expect(tip.style.top).toBe("68px");
  });
});
