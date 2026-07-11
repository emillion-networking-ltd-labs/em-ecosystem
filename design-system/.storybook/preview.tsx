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
import registry from "../registry.json";

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

// ECO-176: "Composed of" — un compuesto (grupo `Composite/`) muestra de qué primitivos se compone, leído
// del REGISTRY (`registryDependencies`), NO escrito a mano → nunca drifta. Refuerza el modelo de propagación:
// SegmentedControl → Button significa "sigue a Button". Solo aparece cuando hay dependencias (los `Simple/`
// son hojas, sin banner). El nombre del componente sale del último segmento del título (== nombre del registry).
const withComposedOf: Decorator = (Story, context) => {
  const title = context.title ?? "";
  const name = title.split("/").pop();
  const item = /^Composite\//.test(title)
    ? registry.items?.find((i) => i.name === name)
    : undefined;
  const deps: string[] = item?.registryDependencies ?? [];
  return (
    <>
      {deps.length > 0 && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            marginBottom: "0.9rem",
            padding: "0.25rem 0.6rem",
            borderRadius: "0.4rem",
            border: "1px solid var(--color-border-default)",
            background: "var(--color-surface-subtle)",
            color: "var(--color-content-secondary)",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "12px",
          }}
        >
          <span style={{ opacity: 0.7 }}>Composed of:</span>
          {deps.map((d) => (
            <span
              key={d}
              style={{ color: "var(--color-content-primary)", fontWeight: 600 }}
            >
              {d}
            </span>
          ))}
        </div>
      )}
      <Story />
    </>
  );
};

const preview: Preview = {
  decorators: [withTheme, withComposedOf],
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
    // Orden del sidebar: grupos top-level por `order` (progreso de la migración visible), ALFABÉTICO dentro.
    // `Simple`/`Composite` = piezas ya migradas por clase (ECO-175); `Primitives` = las pendientes (se vacía a
    // medida que migran). `"*"` = el resto (Layout/Marketing/Sections/Charts/Decoration/Showcase), alfabético.
    // `method: "alphabetical"` mantiene componentes alfabéticos y conserva el orden de export de las stories
    // hoja (Default primero → AllVariants último).
    options: {
      storySort: {
        method: "alphabetical",
        order: ["Foundations", "Simple", "Composite", "Primitives", "*"],
      },
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
