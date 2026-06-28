// Card — superficie base del design-system (ECO-91). Envuelve las utilidades de card (distribuidas
// en tokens.css). Dos ejes: `elevated` (con sombra) y `size` ("md" radio 12 / "lg" radio 24 = contenedor).
// Por DEFECTO es PLANO (sin sombra) — la sombra se reserva para casos puntuales / ventanas externas
// (modales, popovers). El contenido entra por children.
//   elevated=false size=md → card-flat (default) · elevated=true size=md → card
//   elevated=false size=lg → card-container-flat · elevated=true size=lg → card-container
import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends ComponentPropsWithoutRef<"div"> {
  /** Con sombra (elevada). @default false (plano) */
  elevated?: boolean;
  /** Radio: "md" 12px · "lg" 24px (contenedor exterior). @default "md" */
  size?: "md" | "lg";
  /** Etiqueta a renderizar. @default "div" */
  as?: ElementType;
}

function cardUtility(elevated: boolean, size: "md" | "lg") {
  if (size === "lg") return elevated ? "card-container" : "card-container-flat";
  return elevated ? "card" : "card-flat";
}

export function Card({ elevated = false, size = "md", as, className, ...props }: CardProps) {
  const Comp = as ?? "div";
  return <Comp className={cn(cardUtility(elevated, size), className)} {...props} />;
}

export default Card;
