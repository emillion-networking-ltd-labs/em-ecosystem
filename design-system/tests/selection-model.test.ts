import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import AlertBox from "../components/AlertBox";
import Toggle from "../components/Toggle";
import Checkbox from "../components/Checkbox";

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

  // ECO-141 — el caret se colaba sobre los WIDGETS de control: los `<input type="checkbox|radio|…">` nativos
  // heredaban `user-select: text` del selector `input` genérico, y la etiqueta del Toggle quedaba NO
  // seleccionable (`select-none`). Norma del operador: el TEXTO de la etiqueta SÍ se selecciona (es texto); el
  // WIDGET de control (la caja del checkbox/radio) NO.
  it("los inputs de control (checkbox/radio/…) NO son seleccionables — el caret no aparece sobre el widget (ECO-141)", () => {
    // (a) regla explícita: los inputs de control quedan en user-select:none.
    expect(tokensCss).toMatch(/input\[type="checkbox"\][^{}]*\{[^}]*user-select:\s*none/s);
    // (b) el opt-in de texto de `input` se estrecha para EXCLUIR el checkbox (sólo inputs de texto lo reciben).
    const inputTextOptIn = tokensCss.match(/(?:^|\n)\s*input(?![\w-])[^{}]*\{[^}]*user-select:\s*text/s);
    expect(inputTextOptIn?.[0] ?? "").toMatch(/:not\(\[type="checkbox"\]\)/);
  });

  it("la etiqueta <label> es TEXTO y SÍ se puede seleccionar (ECO-141)", () => {
    // `label` permanece en el opt-in de texto.
    expect(tokensCss).toMatch(/\blabel\b[^{}]*\{[^}]*user-select:\s*text/s);
    // Toggle: su etiqueta NO debe llevar `select-none` (la anularía — contra la norma "la etiqueta se selecciona").
    render(createElement(Toggle, { label: "Opción" }));
    const toggleLabel = screen.getByText("Opción");
    expect(toggleLabel.tagName).toBe("LABEL");
    expect(toggleLabel.className).not.toContain("select-none");
  });

  it("Checkbox: su etiqueta es seleccionable (referencia correcta) — ECO-141", () => {
    render(createElement(Checkbox, { label: "Acepto" }));
    const cbLabel = screen.getByText("Acepto");
    expect(cbLabel.tagName).toBe("LABEL");
    expect(cbLabel.className).not.toContain("select-none");
  });
});
