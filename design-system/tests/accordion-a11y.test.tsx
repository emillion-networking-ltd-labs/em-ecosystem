import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import axe from "axe-core";
import Accordion, { SingleAccordion } from "@/components/ui/Accordion";

// ECO-198 — Accordion a11y (DoD step 9): axe (wcag2a/aa) + the disclosure ARIA contract. The native <button>
// gives keyboard + focus for free; this asserts the screen-reader wiring (expanded state + trigger↔panel link).
// color-contrast is disabled: it needs real layout, which jsdom does not render (that pair lives in check-contrast).

async function axeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations.map((v) => `${v.id}: ${v.help}`);
}

const byId = (root: ParentNode, id: string | null) =>
  id ? root.querySelector(`[id="${id}"]`) : null;

const items = [
  { title: "One", children: <p className="text-body">First answer.</p> },
  { title: "Two", children: <p className="text-body">Second answer.</p> },
];

describe("Accordion — a11y (axe + disclosure ARIA)", () => {
  it("no axe violations (wcag2a / wcag2aa)", async () => {
    const { container } = render(<Accordion items={items} defaultOpen={0} />);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("each trigger is a button that controls its labelled region", () => {
    const { container } = render(<Accordion items={items} defaultOpen={0} />);
    const buttons = [...container.querySelectorAll("button")];
    expect(buttons.length).toBe(items.length);
    for (const btn of buttons) {
      expect(btn).toHaveAttribute("type", "button");
      expect(btn).toHaveAttribute("aria-expanded");
      const panel = byId(container, btn.getAttribute("aria-controls"));
      expect(panel).not.toBeNull();
      expect(panel).toHaveAttribute("role", "region");
      expect(panel).toHaveAttribute("aria-labelledby", btn.id);
    }
  });

  it("aria-expanded reflects the open item", () => {
    const { container } = render(<Accordion items={items} defaultOpen={0} />);
    const buttons = [...container.querySelectorAll("button")];
    expect(buttons[0]).toHaveAttribute("aria-expanded", "true");
    expect(buttons[1]).toHaveAttribute("aria-expanded", "false");
  });
});

describe("SingleAccordion — a11y", () => {
  it("no axe violations + disclosure wiring", async () => {
    const { container } = render(
      <SingleAccordion title="T" defaultOpen>
        <p className="text-body">X</p>
      </SingleAccordion>,
    );
    expect(await axeViolations(container)).toEqual([]);
    const btn = container.querySelector("button")!;
    expect(btn).toHaveAttribute("type", "button");
    expect(btn).toHaveAttribute("aria-expanded", "true");
    const panel = byId(container, btn.getAttribute("aria-controls"));
    expect(panel).toHaveAttribute("role", "region");
    expect(panel).toHaveAttribute("aria-labelledby", btn.id);
  });
});
