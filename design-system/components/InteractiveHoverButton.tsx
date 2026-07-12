// InteractiveHoverButton — Magic UI (MIT, © Magic UI), adoptado (ECO-106, fase 1 / ADR-019). CTA cuyo
// punto crece en hover hasta cubrir el botón y revela el texto + flecha deslizándose. Estructura/animación
// VERBATIM; únicos cambios: colores crudos → tokens (bg-background→surface-primary, border→border-strong,
// bg-primary→surface-inverse, text-primary-foreground→content-inverse, texto base→content-primary), la
// flecha lucide acotada a `size-4`, y la forma `rounded-full` → `rounded-md` (la redondez del Button del
// sistema; no introducimos una redondez huérfana — ECO-106). `lucide-react` ya presente.
import { ArrowRight } from "lucide-react";
import Icon from "./Icon";

import { cn } from "@/lib/utils";

export function InteractiveHoverButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "group relative w-auto cursor-pointer overflow-hidden rounded-md border border-border-strong bg-surface-primary p-2 px-6 text-center text-body font-normal text-content-primary",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        <div className="h-2 w-2 rounded-full bg-surface-inverse transition-all duration-300 group-hover:scale-[100.8]"></div>
        <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {children}
        </span>
      </div>
      <div className="absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 text-content-inverse opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100">
        <span>{children}</span>
        <Icon icon={ArrowRight} size="md" />
      </div>
    </button>
  );
}

export default InteractiveHoverButton;
