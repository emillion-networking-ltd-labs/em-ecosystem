import { defineConfig } from "vitest/config";

// Runner unitario del design-system (ECO-116). Complementa Storybook/VRT: para LÓGICA de componente
// (listeners, cálculo de posición, estado) que el catálogo visual no puede aseverar de forma determinista.
// jsdom (sin navegador) → inmune a los quirks de layout de Storybook y a worktrees de agentes en paralelo.
export default defineConfig({
  // tsconfig usa jsx: react-jsx → transpila con el runtime automático de React sin plugin extra.
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    // Nunca escanear node_modules ni los worktrees de agentes (evita el doble-React que rompe el runner).
    exclude: ["node_modules/**", ".claude/**"],
  },
});
