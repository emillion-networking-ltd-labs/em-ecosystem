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

// ECO-115 (refina ECO-99/107) — norma definitiva: el caret sólo sobre TEXTO (nada seleccionable por defecto,
// opt-in del texto) y TODO el texto seleccionable, incluido el puesto en un <div> (AlertBox) vía `select-text`.
// El bug: AlertBox ponía su mensaje en un <div> sin select-text → no era copiable. Estos tests son el guardián.
describe("Modelo de selección (ECO-115)", () => {
  it("tokens.css mantiene el modelo: nada seleccionable por defecto + opt-in del texto", () => {
    // body no seleccionable → sin caret sobre cajas/layout/no-texto.
    expect(tokensCss).toMatch(/body\s*\{[^}]*user-select:\s*none/s);
    // opt-in de selección para el texto.
    expect(tokensCss).toMatch(/user-select:\s*text/);
    // los descendientes de un control no reactivan el caret.
    expect(tokensCss).toMatch(/button\s*\*[^{]*\{[^}]*user-select:\s*none/s);
  });

  it("AlertBox marca su contenedor de texto select-text → el mensaje es seleccionable", () => {
    render(createElement(AlertBox, { variant: "info" }, "Texto copiable"));
    const text = screen.getByText("Texto copiable");
    // El texto vive en un <div> (fuera del opt-in de tags); debe reabrir la selección con select-text.
    expect(text.className).toContain("select-text");
  });
});
