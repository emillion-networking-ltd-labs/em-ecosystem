import Badge from "@/components/ui/Badge";

// Sección FAQ del design system (ECO-55, nivel 2 — NUEVA, sin equivalente en SAT01). Preguntas frecuentes
// del cliente (del brief — nunca inventadas; sin FAQs, se omite). Usa <details>/<summary> NATIVO: accesible
// por defecto, sin JS (server component, mejor LCP/TBT) y con el contenido en el DOM (bueno para SEO). El
// acento de marca (accent) marca el indicador. Token-safe, responsive.
export interface FAQItem {
  question: string;
  answer: string;
}
export interface FAQProps {
  eyebrow?: string;
  title: string;
  items: FAQItem[];
  variant?: "list" | "boxed";
}

export default function FAQ({ eyebrow, title, items, variant = "list" }: FAQProps) {
  const boxed = variant === "boxed";
  return (
    <section className="bg-surface-secondary">
      <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
        <div className="flex flex-col items-center gap-2 text-center">
          {eyebrow ? (
            <Badge variant="default" size="sm" className="text-accent">
              {eyebrow}
            </Badge>
          ) : null}
          <h2 className="text-3xl font-bold text-content-primary sm:text-4xl">{title}</h2>
        </div>
        <dl className="mt-12 space-y-3">
          {items.map((item, i) => (
            <details
              key={i}
              className={`group ${boxed ? "rounded-2xl border border-border-default bg-surface-primary p-5" : "border-b border-border-default pb-3"}`}
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-body font-semibold text-content-primary marker:content-none [&::-webkit-details-marker]:hidden">
                <dt>{item.question}</dt>
                <span aria-hidden="true" className="text-accent transition-transform group-open:rotate-45">+</span>
              </summary>
              <dd className="mt-3 text-body leading-relaxed text-content-secondary">{item.answer}</dd>
            </details>
          ))}
        </dl>
      </div>
    </section>
  );
}
