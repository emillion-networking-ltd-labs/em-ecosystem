// Stack — layout primitive del design-system (ECO-86, fase 1 de satellite-design).
// Flujo vertical con gap y alineación GOBERNADOS. El primitivo de composición más usado: agrupa
// eyebrow + titular + claim + CTA con ritmo consistente, sin que cada sección reinvente spacing.
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

const gaps = {
  xs: "gap-2",
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
} as const;

const aligns = {
  start: "items-start text-left",
  center: "items-center text-center",
  end: "items-end text-right",
} as const;

export interface StackProps extends ComponentPropsWithoutRef<"div"> {
  /** Separación vertical desde la escala. @default "md" */
  gap?: keyof typeof gaps;
  /** Alineación transversal (+ alineación de texto coherente). @default "start" */
  align?: keyof typeof aligns;
}

export function Stack({ gap = "md", align = "start", className, ...props }: StackProps) {
  return <div className={cn("flex flex-col", gaps[gap], aligns[align], className)} {...props} />;
}

export default Stack;
