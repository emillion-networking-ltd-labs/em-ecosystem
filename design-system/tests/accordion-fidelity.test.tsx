import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { writeFileSync } from "node:fs";
import Accordion, { SingleAccordion } from "@/components/ui/Accordion";
import AccordionOld, { SingleAccordionOld } from "./fixtures/AccordionOld";

// ECO-198 — Accordion FIDELITY GUARD (tv contract vs. the previous map/concat version). Renders the real OLD
// Accordion (fixture from git 5186968^) and the NEW one (tv) for EVERY variation, extracts the CLASSES + tag of
// each structural element (container / item / trigger / panel / content) and requires them to be IDENTICAL.
// NOT an eyeball comparison. The ARIA attributes the new version adds (aria-expanded / role / id) are the
// deliberate a11y step, NOT a fidelity regression → this guard compares classes, not aria. Retired when the
// piece closes.

const items = [
  { title: "One", children: <p className="text-body">First answer.</p> },
  { title: "Two", children: <p className="text-body">Second answer.</p> },
];

const VARIANTS = ["default", "uppercase"] as const;
const SURFACES = ["grouped", "separated"] as const;
const INDICATORS = ["chevron", "plus"] as const;

const classSet = (el: Element | null | undefined) =>
  el ? (el.getAttribute("class") || "").split(/\s+/).filter(Boolean).sort() : null;

// The structural elements whose classes the tv migration must preserve.
function extract(container: HTMLElement) {
  const root = container.firstElementChild as Element; // container div
  const item = root?.children[0] as Element; // first item wrapper
  const trigger = item?.querySelector("button");
  const panel = trigger?.nextElementSibling ?? null; // grid transition wrapper
  const content = panel?.querySelector(".select-text") ?? null;
  return {
    triggerTag: trigger?.tagName.toLowerCase() ?? null,
    container: classSet(root),
    item: classSet(item),
    trigger: classSet(trigger),
    panel: classSet(panel),
    content: classSet(content),
  };
}

type Row = {
  name: string;
  ok: boolean;
  old: ReturnType<typeof extract>;
  neu: ReturnType<typeof extract>;
};
const rows: Row[] = [];

describe("Accordion — class fidelity (old map/concat vs new tv), per variation", () => {
  for (const variant of VARIANTS)
    for (const surface of SURFACES)
      for (const indicator of INDICATORS)
        for (const borderless of [false, true])
          for (const open of [false, true]) {
            const props = {
              items,
              variant,
              surface,
              indicator,
              borderless,
              defaultOpen: open ? 0 : undefined,
            };
            const name = `${variant} · ${surface} · ${indicator} · borderless=${borderless} · open=${open}`;
            it(name, () => {
              const oldR = render(<AccordionOld {...props} />);
              const old = extract(oldR.container);
              oldR.unmount();
              const newR = render(<Accordion {...props} />);
              const neu = extract(newR.container);
              newR.unmount();

              rows.push({ name, ok: JSON.stringify(old) === JSON.stringify(neu), old, neu });

              expect(neu.triggerTag).toBe(old.triggerTag);
              expect(neu.container).toEqual(old.container);
              expect(neu.item).toEqual(old.item);
              expect(neu.trigger).toEqual(old.trigger);
              expect(neu.panel).toEqual(old.panel);
              expect(neu.content).toEqual(old.content);
            });
          }
});

function extractSingle(container: HTMLElement) {
  const root = container.firstElementChild as Element; // card
  const trigger = root?.querySelector("button");
  const panel = trigger?.nextElementSibling ?? null;
  const content = panel?.querySelector(".select-text") ?? null;
  return {
    triggerTag: trigger?.tagName.toLowerCase() ?? null,
    root: classSet(root),
    trigger: classSet(trigger),
    panel: classSet(panel),
    content: classSet(content),
  };
}

describe("SingleAccordion — class fidelity (old vs new tv)", () => {
  for (const open of [false, true]) {
    it(`open=${open}`, () => {
      const oldR = render(
        <SingleAccordionOld title="T" defaultOpen={open}>
          <p className="text-body">X</p>
        </SingleAccordionOld>,
      );
      const old = extractSingle(oldR.container);
      oldR.unmount();
      const newR = render(
        <SingleAccordion title="T" defaultOpen={open}>
          <p className="text-body">X</p>
        </SingleAccordion>,
      );
      const neu = extractSingle(newR.container);
      newR.unmount();

      expect(neu.triggerTag).toBe(old.triggerTag);
      expect(neu.root).toEqual(old.root);
      expect(neu.trigger).toEqual(old.trigger);
      expect(neu.panel).toEqual(old.panel);
      expect(neu.content).toEqual(old.content);
    });
  }

  it("emits the old-vs-new table (JSON) for review", () => {
    const mism = rows.filter((r) => !r.ok);
    writeFileSync(
      "/tmp/accordion-fidelity.json",
      JSON.stringify({ total: rows.length, mismatches: mism.length, rows }, null, 2),
    );
    expect(mism.length).toBe(0);
  });
});
