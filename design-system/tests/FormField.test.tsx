import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import FormField from "../components/FormField";

afterEach(cleanup);

// ECO-121 regression test: el error de FormField se renderizaba condicional (error && <InlineError/>) como
// hijo del flex → al aparecer/desaparecer empujaba lo de abajo (botón / siguiente campo) = salto de layout.
// El fix reserva el hueco: un slot con altura mínima SIEMPRE montado. Este test fija que el slot está
// presente con y sin error (pre-fix, sin error, no existía).
describe("FormField — el error reserva su espacio (ECO-121)", () => {
  const slot = (c: HTMLElement) => c.querySelector('[aria-live="polite"]');

  it("mantiene el slot del error montado SIN error (reservado → sin salto)", () => {
    const { container } = render(
      <FormField label="Name">
        <input />
      </FormField>,
    );
    expect(slot(container)).toBeInTheDocument();
    expect(slot(container)).toBeEmptyDOMElement();
  });

  it("muestra el error en el MISMO slot reservado", () => {
    const { container } = render(
      <FormField label="Name" error="Required">
        <input />
      </FormField>,
    );
    expect(slot(container)).toBeInTheDocument();
    expect(slot(container)).toHaveTextContent("Required");
  });
});
