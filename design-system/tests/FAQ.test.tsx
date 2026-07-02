import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import FAQ from "../sections/FAQ";

afterEach(cleanup);

const items = [
  { question: "Q1", answer: "A1" },
  { question: "Q2", answer: "A2" },
  { question: "Q3", answer: "A3" },
];

// ECO-122: en `separated` las tarjetas se revelan UNA A UNA (stagger: delay incremental por índice).
describe("FAQ — stagger en separated (ECO-122)", () => {
  it("separated: cada tarjeta tiene un delay incremental (0/90/180ms)", () => {
    const { container } = render(
      <FAQ title="FAQ" surface="separated" items={items} />,
    );
    const acc = container.querySelector(".gap-3")!; // contenedor separated del Accordion
    const cards = Array.from(acc.children) as HTMLElement[];
    expect(cards).toHaveLength(3);
    expect(cards[0].style.transition).toContain("ease 0ms");
    expect(cards[1].style.transition).toContain("ease 90ms");
    expect(cards[2].style.transition).toContain("ease 180ms");
  });

  it("grouped: reveal único del bloque, sin stagger por tarjeta", () => {
    const { container } = render(
      <FAQ title="FAQ" surface="grouped" items={items} />,
    );
    // grouped = caja única (divide-y), no el contenedor separated → no hay stagger por item.
    expect(container.querySelector(".gap-3")).toBeNull();
  });
});
