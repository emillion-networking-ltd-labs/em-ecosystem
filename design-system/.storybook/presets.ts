// Presets de MARCA para el conmutador del catálogo (ECO-95, satellite-design / pilar B, ADR-018).
//
// Un preset = un token-swap de MARCA (color de acento + familia tipográfica). NUNCA toca los tokens
// SEMÁNTICOS (content/surface/border/escala/spacing/motion), que son la gramática neutra del
// design-system. Conmutar de preset demuestra en vivo que el design-system es un LIENZO tematizable
// por cliente/sector — y que el verde `#1b5e20` de hoy es un placeholder, no marca a fuego.
// (Estrategia: "el sector se codifica como PRESET MULTI-EJE, no como tema de color".)
//
// Estos 3 son DEMO del mecanismo. Los presets de SECTOR reales y curados (clínica/gimnasio/restaurante…
// con sus fuentes vía next/font) llegan en el ticket de seguimiento, ya con el mecanismo probado.
// Viven aquí (catálogo), NO en el core `tokens/tokens.css`: el core sigue neutro; un preset es lo que
// inyecta el CONSUMIDOR (el satélite). Se cubren ambos nombres del acento — la utilidad Tailwind
// (`--color-accent*`, p.ej. `text-accent`) y el legacy `--accent*` que usan algunos componentes.

export type Preset = {
  id: string;
  name: string;
  /** Solo variables de MARCA. Vacío = usa los defaults del core (NexaCore). */
  vars: Record<string, string>;
};

export const PRESETS: Preset[] = [
  {
    // Marca EMILLION (real). Colores extraídos del logotipo (verde oscuro → teal del wordmark + negro).
    // Hex ESTIMADOS de la imagen — pendiente de confirmar con el brand kit/SVG. El gradiente de marca
    // (--gradient-brand) lo deriva el core de accent→accent-2 = verde→teal, igual que el logo.
    id: "emillion",
    name: "EMILLION (marca)",
    vars: {
      "--color-accent": "#0b4233", // verde oscuro EMILLION (principal)
      "--color-accent-2": "#1a9e8c", // teal (2º acento → gradiente)
      "--color-accent-light": "#1a9e8c",
      "--color-accent-dark": "#08382a",
      "--accent": "#0b4233",
      "--accent-light": "#1a9e8c",
    },
  },
  {
    // Demo de contraste — SOLO para ver el conmutador en acción (no es marca real). Se sustituye por
    // presets de SECTOR reales en el ticket de seguimiento (paso 2).
    id: "contraste",
    name: "Demo · contraste (placeholder)",
    vars: {
      "--color-accent": "#b45309",
      "--color-accent-2": "#f59e0b",
      "--color-accent-light": "#f59e0b",
      "--color-accent-dark": "#92400e",
      "--accent": "#b45309",
      "--accent-light": "#f59e0b",
      "--font-display-face": 'Georgia, "Times New Roman", serif',
    },
  },
];

export const DEFAULT_PRESET = PRESETS[0].id;
