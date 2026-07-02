import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Resuelve el alias `@/` del design-system contra el árbol FUENTE (igual que tsconfig paths y .storybook/main),
// para poder testear componentes que COMPONEN otros primitivos (p.ej. sections/Contact importa @/components/ui/*).
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Runner unitario del design-system (ECO-116). Complementa Storybook/VRT: para LÓGICA de componente
// (listeners, cálculo de posición, estado) que el catálogo visual no puede aseverar de forma determinista.
// jsdom (sin navegador) → inmune a los quirks de layout de Storybook y a worktrees de agentes en paralelo.
export default defineConfig({
  resolve: {
    alias: {
      "@/components/ui": r("./components"),
      "@/components/sections": r("./sections"),
      "@/lib": r("./lib"),
      "@/hooks": r("./hooks"),
    },
  },
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
