// CardHoverEffect — basado en Aceternity UI (MIT, © Manu Arora), RECONSTRUIDO sobre los primitivos del
// design-system (ECO-101, fase 1 / ADR-019). La estructura/animación (fondo que sigue al hover con layoutId)
// es de Aceternity; la tarjeta es nuestro primitivo `Card` (size md = radio 12px, el de cards del proyecto)
// y la tipografía sigue la card de servicio del proyecto (título text-h3 font-semibold, descripción
// text-body) — no bg-black/zinc/font-bold. Rejilla de tarjetas con efecto hover (servicios).
// Solo `motion` + `cn` (deps ya presentes).
"use client";

// @ds-tier: decorative — efecto cosechado — rejilla con hover-follow (Aceternity)
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";

export const CardHoverEffect = ({
  items,
  className,
}: {
  items: {
    title: string;
    description: string;
    link: string;
  }[];
  className?: string;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className={cn(
        "grid grid-cols-1 py-10 md:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {items.map((item, idx) => (
        <a
          href={item?.link}
          key={item?.link}
          className="group relative block h-full w-full p-2"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 block h-full w-full rounded-xl bg-surface-subtle"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.2 },
                }}
              />
            )}
          </AnimatePresence>
          <Card
            size="md"
            className="relative z-20 h-full transition-colors group-hover:border-line-strong"
          >
            <h4 className="text-h3 font-semibold text-content-primary">
              {item.title}
            </h4>
            <p className="mt-4 text-body text-content-secondary">
              {item.description}
            </p>
          </Card>
        </a>
      ))}
    </div>
  );
};

export default CardHoverEffect;
