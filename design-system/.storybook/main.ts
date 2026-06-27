import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/nextjs-vite";

const root = dirname(fileURLToPath(import.meta.url)); // .storybook/
const ds = resolve(root, ".."); // design-system/

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y"],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  // Tailwind v4 = wiring MANUAL (no recipe oficial v4 — ADR-020). Se añade el plugin
  // @tailwindcss/vite al viteFinal, y los aliases que la fuente asume del CONSUMIDOR
  // (@/ -> <consumer>/src, em-ui) se mapean contra el árbol FUENTE del design-system.
  viteFinal: async (cfg) => {
    const { default: tailwindcss } = await import("@tailwindcss/vite");
    cfg.plugins = [...(cfg.plugins ?? []), tailwindcss()];
    cfg.resolve ??= {};
    cfg.resolve.alias = {
      ...(cfg.resolve.alias as Record<string, string> | undefined),
      "@/components/sections": resolve(ds, "sections"),
      "@/components/ui": resolve(ds, "components"),
      "@/lib": resolve(ds, "lib"),
      "@/hooks": resolve(ds, "hooks"),
      // El contexto de app (Theme/Toast) NO vive en la fuente del DS; se mockea para
      // catalogar los componentes app-coupled (ThemeToggle/TurnstileWidget/ToastContainer). ECO-89.
      "@/context": resolve(root, "mocks/context"),
    };
    return cfg;
  },
};

export default config;
