import React from "react";
import type { Preview, Decorator } from "@storybook/nextjs-vite";
// Tokens del design-system (ADR-020): la MISMA capa que em-ui distribuye y que el
// dashboard/satélites consumen. Importarla aquí hace que las clases Tailwind v4 de
// los componentes resuelvan contra los tokens reales (no un tema de Storybook aparte).
import "../tokens/tokens.css";
// Mismo ThemeContext mock que consume @/hooks/useTheme (alias @/context → este fichero). Proveerlo
// con el tema del toolbar hace que useTheme() siga al toolbar → los componentes con tema en JS
// (charts recharts, ThemeToggle, …) adaptan su color SIN stories "Dark" aparte.
import { ThemeContext } from "./mocks/context/ThemeContext";

// Dark mode REAL (ECO-90): el design-system conmuta por CLASE (`@custom-variant dark (&:is(.dark *))`
// + bloque `.dark { --color-* }`). El fondo de Storybook solo pintaba el canvas; los componentes no
// cambiaban. Este decorator pone la clase `.dark`/`.light` en un ANCESTOR de la story — igual que el
// ThemeProvider del dashboard/satélite — así los componentes resuelven sus tokens dark de verdad.
// El fondo/color del lienzo siguen al TOKEN (no hex) para reflejar el tema fielmente.
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme === "dark" ? "dark" : "light";
  // Replica el BASELINE del `body` de producción (dashboard/satélite): el fondo de PÁGINA es
  // `surface-secondary` (un tono DISTINTO al `surface-primary` de los componentes → contraste, se
  // separan en dark), y la base tipográfica es `--text-body` (14px) + `--font-sans` + letter-spacing.
  // Sin esto, el texto que HEREDA (p.ej. el contenido del Accordion) caía al 16px del navegador y se
  // veía más grande que en el dashboard. A pantalla completa (100vh) para que el tema cubra el canvas.
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: () => {} }}>
      <div
        className={theme}
        style={{
          minHeight: "100vh",
          boxSizing: "border-box",
          padding: "2rem",
          background: "var(--color-surface-secondary)",
          color: "var(--color-content-primary)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-body)",
          letterSpacing: "0.01em",
        }}
      >
        <Story />
      </div>
    </ThemeContext.Provider>
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
    // Orden del sidebar: ALFABÉTICO por componente. `method: "alphabetical"` con `includeNames`
    // por defecto (false) ordena los grupos/componentes pero NO las stories hoja → dentro de cada
    // componente se conserva el orden de export (Default primero → AllVariants último).
    // Sin esto, Storybook usa el orden de carga del glob (no alfabético) y el listado sale revuelto
    // (los SpinnerCircle/Infinity/Ring caían al final en vez de en su sitio entre Slider y StickyCard).
    options: {
      storySort: { method: "alphabetical" },
    },
    // El decorator de tema pinta la página completa (100vh); fullscreen evita el centrado/padding
    // del canvas para que el fondo del tema cubra todo. Las stories controlan su propio layout interno.
    layout: "fullscreen",
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
