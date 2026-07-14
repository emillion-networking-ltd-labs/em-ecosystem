// AnimatedTestimonials — basado en Aceternity UI (MIT, © Manu Arora), RECONSTRUIDO sobre los primitivos del
// design-system (ECO-101, fase 1 / ADR-019). Estructura/animación de Aceternity; piezas nuestras: los
// controles son `IconButton` (variant boxed, shape circle, spinOnHover) en vez de <button> crudo, la
// tipografía como en el proyecto (nombre = heading `text-h1 font-semibold` como el dashboard, cargo
// `text-caption`, cita `text-body`) y el theming va por tokens (content/surface). Iconos de `lucide-react`
// (no `@tabler`). Carrusel de testimonios con foto + blur-in. Cero deps npm nuevas.
"use client";

// @ds-tier: decorative — efecto cosechado — carrusel de testimonios (marketing)
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import IconButton from "@/components/ui/IconButton";

type Testimonial = {
  quote: string;
  name: string;
  designation: string;
  src: string;
};

export const AnimatedTestimonials = ({
  testimonials,
  autoplay = false,
}: {
  testimonials: Testimonial[];
  autoplay?: boolean;
}) => {
  const [active, setActive] = useState(0);

  const handleNext = () => {
    setActive((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const isActive = (index: number) => {
    return index === active;
  };

  useEffect(() => {
    if (autoplay) {
      const interval = setInterval(handleNext, 5000);
      return () => clearInterval(interval);
    }
  }, [autoplay]);

  const randomRotateY = () => {
    return Math.floor(Math.random() * 21) - 10;
  };
  return (
    <div className="mx-auto max-w-sm px-4 py-20 antialiased md:max-w-4xl md:px-8 lg:px-12">
      <div className="relative grid grid-cols-1 gap-20 md:grid-cols-2">
        <div>
          <div className="relative h-80 w-full">
            <AnimatePresence>
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.src}
                  initial={{
                    opacity: 0,
                    scale: 0.9,
                    z: -100,
                    rotate: randomRotateY(),
                  }}
                  animate={{
                    opacity: isActive(index) ? 1 : 0.7,
                    scale: isActive(index) ? 1 : 0.95,
                    z: isActive(index) ? 0 : -100,
                    rotate: isActive(index) ? 0 : randomRotateY(),
                    zIndex: isActive(index)
                      ? 40
                      : testimonials.length + 2 - index,
                    y: isActive(index) ? [0, -80, 0] : 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.9,
                    z: 100,
                    rotate: randomRotateY(),
                  }}
                  transition={{
                    duration: 0.4,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 origin-bottom"
                >
                  <img
                    src={testimonial.src}
                    alt={testimonial.name}
                    width={500}
                    height={500}
                    draggable={false}
                    className="h-full w-full rounded-xl object-cover object-center"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex flex-col justify-between py-4">
          <motion.div
            key={active}
            initial={{
              y: 20,
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            exit={{
              y: -20,
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
          >
            <h3 className="text-h1 font-semibold text-content-primary">
              {testimonials[active].name}
            </h3>
            <p className="text-caption font-semibold text-content-secondary">
              {testimonials[active].designation}
            </p>
            <motion.p className="mt-8 text-body text-content-secondary">
              {testimonials[active].quote.split(" ").map((word, index) => (
                <motion.span
                  key={index}
                  initial={{
                    filter: "blur(10px)",
                    opacity: 0,
                    y: 5,
                  }}
                  animate={{
                    filter: "blur(0px)",
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.2,
                    ease: "easeInOut",
                    delay: 0.02 * index,
                  }}
                  className="inline-block"
                >
                  {word}&nbsp;
                </motion.span>
              ))}
            </motion.p>
          </motion.div>
          <div className="flex gap-4 pt-12 md:pt-0">
            <IconButton
              variant="boxed"
              shape="circle"
              size="sm"
              spinOnHover="cw"
              icon={ArrowLeft}
              onClick={handlePrev}
              aria-label="Previous testimonial"
            />
            <IconButton
              variant="boxed"
              shape="circle"
              size="sm"
              spinOnHover="ccw"
              icon={ArrowRight}
              onClick={handleNext}
              aria-label="Next testimonial"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedTestimonials;
