import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { writeFileSync } from "node:fs";
import Badge from "@/components/ui/Badge";
import BadgeOld from "./fixtures/BadgeOld";

// ECO-168 — Badge FIDELITY GUARD (tv contract vs. the previous map-based version). Renders the real OLD Badge
// (fixture from git) and the NEW one (tv) for EVERY case (7 variants × 3 sizes), extracts the DOM attributes
// (tag + classes as a set) and requires them to be IDENTICAL. NOT an eyeball comparison. Retired when the piece closes.

const VARIANTS = [
  "default",
  "success",
  "warning",
  "error",
  "info",
  "kbd",
  "overlay",
] as const;
const SIZES = ["sm", "md", "lg"] as const;

const classSet = (el: Element | null) =>
  el
    ? (el.getAttribute("class") || "").split(/\s+/).filter(Boolean).sort()
    : null;

function extract(container: HTMLElement) {
  const root = container.firstElementChild as Element;
  return { tag: root.tagName.toLowerCase(), root: classSet(root) };
}

const rows: {
  name: string;
  ok: boolean;
  old: ReturnType<typeof extract>;
  neu: ReturnType<typeof extract>;
}[] = [];

describe("Badge — attribute fidelity (old maps vs new tv), per case", () => {
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      it(`${variant} · ${size}`, () => {
        const oldR = render(
          <BadgeOld variant={variant} size={size}>
            X
          </BadgeOld>,
        );
        const old = extract(oldR.container);
        oldR.unmount();
        const newR = render(
          <Badge variant={variant} size={size}>
            X
          </Badge>,
        );
        const neu = extract(newR.container);
        newR.unmount();

        const ok =
          neu.tag === old.tag &&
          JSON.stringify(neu.root) === JSON.stringify(old.root);
        rows.push({ name: `${variant} · ${size}`, ok, old, neu });

        expect(neu.tag).toBe(old.tag);
        expect(neu.root).toEqual(old.root);
      });
    }
  }

  it("emits the old-vs-new table (JSON) for review", () => {
    const mism = rows.filter((r) => !r.ok);
    writeFileSync(
      "/tmp/badge-fidelity.json",
      JSON.stringify(
        { total: rows.length, mismatches: mism.length, rows },
        null,
        2,
      ),
    );
    expect(mism.length).toBe(0);
  });
});
