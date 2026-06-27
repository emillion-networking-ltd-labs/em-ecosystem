import type { Preview } from "@storybook/nextjs-vite";
// Tokens del design-system (ADR-020): la MISMA capa que em-ui distribuye y que el
// dashboard/satélites consumen. Importarla aquí hace que las clases Tailwind v4 de
// los componentes resuelvan contra los tokens reales (no un tema de Storybook aparte).
import "../tokens/tokens.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    a11y: {
      // El estándar a11y del pilar A: reportar, no silenciar.
      test: "todo",
    },
    backgrounds: {
      options: {
        light: { name: "light", value: "#ffffff" },
        dark: { name: "dark", value: "#0a0a0a" },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: "light" },
  },
};

export default preview;
