import React from "react";
import type { Preview, Decorator } from "@storybook/nextjs-vite";
// ECO-119: useGlobals da acceso REACTIVO al toolbar + un updater → ThemeToggle puede alternar el tema.
import { useGlobals } from "storybook/preview-api";
// Tokens del design-system (ADR-020): la MISMA capa que em-ui distribuye y que el
// dashboard/satélites consumen. Importarla aquí hace que las clases Tailwind v4 de
// los componentes resuelvan contra los tokens reales (no un tema de Storybook aparte).
import "../tokens/tokens.css";
// Mismo ThemeContext mock que consume @/hooks/useTheme (alias @/context → este fichero). Proveerlo
// con el tema del toolbar hace que useTheme() siga al toolbar → los componentes con tema en JS
// (charts recharts, ThemeToggle, …) adaptan su color SIN stories "Dark" aparte.
import { ThemeContext } from "./mocks/context/ThemeContext";
// Conmutador de PRESET de marca (ECO-95): un preset reescribe SOLO los tokens de marca (accent/-2 +
// familia tipográfica) sobre el ancestro de la story — igual que `.dark` reescribe los de tema — sin
// tocar los semánticos. Demuestra el lienzo neutro tematizable (satellite-design, pilar B).
import { PRESETS, DEFAULT_PRESET } from "./presets";

// Dark mode REAL (ECO-90): el design-system conmuta por CLASE (`@custom-variant dark (&:is(.dark *))`
// + bloque `.dark { --color-* }`). El fondo de Storybook solo pintaba el canvas; los componentes no
// cambiaban. Este decorator pone la clase `.dark`/`.light` en un ANCESTOR de la story — igual que el
// ThemeProvider del dashboard/satélite — así los componentes resuelven sus tokens dark de verdad.
// El fondo/color del lienzo siguen al TOKEN (no hex) para reflejar el tema fielmente.
const withTheme: Decorator = (Story, context) => {
  // ECO-119: el toolbar de tema es reactivo y con updater → ThemeToggle alterna el tema DE VERDAD
  // (antes el mock tenía toggleTheme no-op). Al alternar, cambia el global → el decorator re-renderiza
  // con el tema nuevo (clase .dark aplicada) y queda SINCRONIZADO con el toolbar de Storybook.
  const [globals, updateGlobals] = useGlobals();
  const theme = globals.theme === "dark" ? "dark" : "light";
  const toggleTheme = () =>
    updateGlobals({ theme: theme === "dark" ? "light" : "dark" });
  // Preset de marca activo (default = NexaCore). Sus `vars` (accent/-2 + familia tipográfica) se
  // inyectan en el MISMO wrapper; los componentes y las Foundations re-resuelven `--color-accent`,
  // `--gradient-brand`, `--font-display` etc. desde aquí. Los tokens semánticos NO se tocan.
  const preset = PRESETS.find((p) => p.id === globals.preset) ?? PRESETS[0];
  // Full-bleed for page-level compositions (Sections/* and Showcase/*, e.g. FullPageAlert): they render edge-to-edge
  // (layout:fullscreen), so the wrapper's 2rem padding would box them in a grey band. Drop it for those; keep
  // it everywhere else (primitives sit in a DemoCard; the foundations docs rely on this breathing room).
  const fullBleed =
    context.parameters?.layout === "fullscreen" &&
    /^(Sections|Showcase)\//.test(context.title ?? "");
  // Los gradientes de marca se DECLARAN en :root del core con var(--color-accent/-2) → se computan UNA
  // vez en :root (con el accent base) y se heredan CONGELADOS; redefinir solo --color-accent en el preset
  // NO los cambiaría. Re-declararlos aquí (mismas fórmulas que tokens.css) fuerza que se re-resuelvan en
  // este wrapper con el accent/-2 del preset activo. Mantener en sync con tokens/tokens.css.
  const brandGradients: Record<string, string> = {
    "--gradient-brand":
      "linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-2) 100%)",
    "--gradient-brand-radial":
      "radial-gradient(120% 120% at 50% 0%, var(--color-accent-2) 0%, var(--color-accent) 55%, transparent 100%)",
  };
  // Replica el BASELINE del `body` de producción (dashboard/satélite): el fondo de PÁGINA es
  // `surface-secondary` (un tono DISTINTO al `surface-primary` de los componentes → contraste, se
  // separan en dark), y la base tipográfica es `--text-body` (14px) + `--font-sans` + letter-spacing.
  // Sin esto, el texto que HEREDA (p.ej. el contenido del Accordion) caía al 16px del navegador y se
  // veía más grande que en el dashboard. A pantalla completa (100vh) para que el tema cubra el canvas.
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div
        className={theme}
        style={{
          minHeight: "100vh",
          boxSizing: "border-box",
          padding: fullBleed ? 0 : "2rem",
          background: "var(--color-surface-secondary)",
          color: "var(--color-content-primary)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-body)",
          letterSpacing: "0.01em",
          ...preset.vars,
          ...brandGradients,
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
      description: "Theme (light/dark) — toggles the class like the dashboard",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "contrast",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
    // Conmutador de PRESET de marca (ECO-95): cambia accent/-2 + familia tipográfica en TODO el
    // catálogo; los tokens semánticos (texto/fondos/bordes/escala) no cambian → lienzo neutro.
    preset: {
      description:
        "Brand preset — theming by family/sector (accent + typography only)",
      defaultValue: DEFAULT_PRESET,
      toolbar: {
        title: "Preset",
        icon: "paintbrush",
        items: PRESETS.map((p) => ({ value: p.id, title: p.name })),
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
        mobile: {
          name: "Mobile (375)",
          styles: { width: "375px", height: "720px" },
        },
        tablet: {
          name: "Tablet (768)",
          styles: { width: "768px", height: "1024px" },
        },
        laptop: {
          name: "Laptop (1280)",
          styles: { width: "1280px", height: "800px" },
        },
        desktop: {
          name: "Desktop (1536)",
          styles: { width: "1536px", height: "900px" },
        },
      },
    },
  },
};

export default preview;
