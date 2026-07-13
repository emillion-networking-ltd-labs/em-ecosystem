import { TriangleAlert, CircleX, CircleCheck, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// STATUS_ICONS — the SINGLE SOURCE of the status→icon mapping (ECO-199, ADR-032). Complements `ICON_SIZES`
// (Icon.tsx = the SIZE source); this is the SEMANTIC source — WHICH glyph each status uses, in one place.
// Lives in lib/ so it travels with the components that import it (em-ui copies `@/lib/*` in the closure).
// The TRIANGLE is reserved for `warning` (the universal caution shape); everything else is a CIRCLE with its
// own symbol (✗ error · ✓ success · ⓘ info) → distinct at a glance. No component maps status→icon by hand
// (the gate `check-status-icons` enforces it) — changing a glyph here propagates to every status surface.
export const STATUS_ICONS = {
  warning: TriangleAlert,
  error: CircleX,
  success: CircleCheck,
  info: Info,
} as const satisfies Record<string, LucideIcon>;

export type StatusKind = keyof typeof STATUS_ICONS;
