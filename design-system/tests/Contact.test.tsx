import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import Contact from "../sections/Contact";

afterEach(cleanup);

// ECO-121 regression test: el error del consentimiento se renderizaba condicional (errors.consent ? <p> : null),
// así que al aparecer/desaparecer montaba/desmontaba y EMPUJABA el botón (salto de layout). El fix reserva el
// hueco: el <p> del error está SIEMPRE en el DOM (aria-live, vacío cuando no hay error) → marcar/enviar no
// reflowea. Este test fija que el slot está montado con y sin error (pre-fix falla: es null sin error).
describe("Contact — el error de consentimiento reserva su espacio (ECO-121)", () => {
  it("mantiene el slot del error de consent SIEMPRE montado (sin salto de layout)", () => {
    const { container } = render(<Contact title="Contact" />);
    const slot = () => container.querySelector('p[aria-live="polite"]');

    // Reservado incluso SIN error → pre-fix esto es null (render condicional) y FALLA.
    expect(slot()).toBeInTheDocument();
    expect(slot()).toHaveTextContent("");

    // Enviar el formulario vacío dispara el error de consent EN EL MISMO slot (no monta uno nuevo).
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(slot()).toBeInTheDocument();
    expect(slot()?.textContent ?? "").toMatch(/privacy policy/i);
  });
});
