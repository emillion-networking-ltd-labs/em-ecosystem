import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { testimonials } from "@/lib/data";

export default function TestimonialsPreview() {
  return (
    <section className="bg-surface-secondary py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="text-h1 font-semibold tracking-wide text-accent">Testimonios »»</span>
          <h2 className="text-h1 font-bold text-content-primary">Lo dicen ellos</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.slice(0, 3).map((t) => (
            <div key={t.name} className="card-flat flex flex-col">
              <div className="flex items-center gap-3">
                <Avatar name={t.name} size="sm" />
                <div>
                  <p className="text-body font-semibold text-content-primary">{t.name}</p>
                  <Badge variant="success" size="sm">{t.result}</Badge>
                </div>
              </div>
              <p className="mt-4 flex-1 text-body italic leading-relaxed text-content-secondary">&ldquo;{t.quote}&rdquo;</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button variant="link-underline" href="/testimonios">Ver todos los testimonios</Button>
        </div>
      </div>
    </section>
  );
}
