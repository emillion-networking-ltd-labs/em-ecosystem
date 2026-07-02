import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import AlertBox from "../components/AlertBox";

afterEach(cleanup);

const tokensCss = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "..", "tokens", "tokens.css"),
  "utf8",
);

const CONTROL_SELECTORS = [
  "button",
  '[role="button"]',
  "summary",
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="radio"]',
  '[role="tab"]',
  '[role="option"]',
  '[role="menuitem"]',
  '[role="menuitemradio"]',
];

// ECO-115 — norma definitiva de selección de texto. El texto es seleccionable POR DEFECTO (modelo del
// dashboard); sólo los controles llevan user-select:none. El bug: el modelo viejo (body select-none global +
// opt-in por selector) dejaba SIN seleccionar el texto puesto en un <div> (p.ej. AlertBox). Estos tests
// FALLABAN con el modelo viejo y son el guardián de regresión permanente.
describe("Modelo de selección (ECO-115)", () => {
  it("tokens.css NO reintroduce el select-none global (el texto es seleccionable por defecto)", () => {
    // El anti-patrón que rompía AlertBox: nada seleccionable salvo lo del opt-in.
    expect(tokensCss).not.toMatch(/body\s*\{[^}]*user-select:\s*none/);
    expect(tokensCss).not.toMatch(/user-select:\s*text/);
  });

  it("tokens.css marca los controles user-select:none (sin caret al pulsarlos)", () => {
    expect(tokensCss).toMatch(
      /button\s*,[\s\S]*?\[role="button"\][\s\S]*?\{[^}]*user-select:\s*none/,
    );
  });

  it("AlertBox pone su texto en un elemento NO-control → seleccionable por defecto", () => {
    render(createElement(AlertBox, { variant: "info" }, "Texto copiable"));
    const text = screen.getByText("Texto copiable");
    // El texto no debe vivir en un control ni descender de uno (heredaría user-select:none).
    for (const sel of CONTROL_SELECTORS) {
      expect(text.matches(sel)).toBe(false);
      expect(text.closest(sel)).toBeNull();
    }
  });
});
