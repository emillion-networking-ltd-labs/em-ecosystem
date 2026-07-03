// Escala de spacing/gap COMPARTIDA por las primitivas de layout (ECO-131). Fuente ÚNICA: el mismo mapeo
// clave→px lo usan Grid, Stack, Split y Cluster — así `gap="md"` significa lo MISMO en todas (antes cada una
// tenía su escala y `md` valía 24/16/32 según la primitiva: un footgun de DX). Rejilla 8pt (4 como medio paso),
// derivada de la base `--spacing` de Tailwind. Lo que difiere por ROL es el DEFAULT de cada primitiva (Stack
// apretado, Split aireado), NO la definición de la clave. Cambiar la escala aquí reajusta todas a la vez.
export const GAP = {
  none: "gap-0",
  xs: "gap-2", // 8
  sm: "gap-4", // 16
  md: "gap-6", // 24
  lg: "gap-8", // 32
  xl: "gap-12", // 48
  "2xl": "gap-16", // 64
} as const;

export type Gap = keyof typeof GAP;
