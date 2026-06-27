import React from "react";
import type { Preview, Decorator } from "@storybook/nextjs-vite";
// Tokens del design-system (ADR-020): la MISMA capa que em-ui distribuye y que el
// dashboard/satélites consumen. Importarla aquí hace que las clases Tailwind v4 de
// los componentes resuelvan contra los tokens reales (no un tema de Storybook aparte).
import "../tokens/tokens.css";

// Dark mode REAL (ECO-90): el design-system conmuta por CLASE (`@custom-variant dark (&:is(.dark *))`
// + bloque `.dark { --color-* }`). El fondo de Storybook solo pintaba el canvas; los componentes no
// cambiaban. Este decorator pone la clase `.dark`/`.light` en un ANCESTOR de la story — igual que el
// ThemeProvider del dashboard/satélite — así los componentes resuelven sus tokens dark de verdad.
// El fondo/color del lienzo siguen al TOKEN (no hex) para reflejar el tema fielmente.
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme === "dark" ? "dark" : "light";
  return (
    <div
      className={theme}
      style={{
        minHeight: "100%",
        background: "var(--color-surface-primary)",
        color: "var(--color-content-primary)",
      }}
    >
      <Story />
    </div>
  );
};

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: "Tema (light/dark) — conmuta la clase como en el dashboard",
      defaultValue: "light",
      toolbar: {
        title: "Tema",
        icon: "contrast",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: "centered",
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    a11y: {
      // El estándar a11y del pilar A: reportar, no silenciar.
      test: "todo",
    },
    // Viewport responsive: ver móvil/tablet/desktop desde la toolbar (los componentes ya son
    // responsive con Tailwind; faltaba poder verlo en el catálogo).
    viewport: {
      options: {
        mobile: { name: "Móvil (375)", styles: { width: "375px", height: "720px" } },
        tablet: { name: "Tablet (768)", styles: { width: "768px", height: "1024px" } },
        laptop: { name: "Laptop (1280)", styles: { width: "1280px", height: "800px" } },
        desktop: { name: "Desktop (1536)", styles: { width: "1536px", height: "900px" } },
      },
    },
  },
};

export default preview;
