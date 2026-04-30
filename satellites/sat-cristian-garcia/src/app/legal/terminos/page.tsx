import type { Metadata } from "next";
import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";

export const metadata: Metadata = { title: "Términos y Condiciones" };

export default function TerminosPage() {
  return (
    <>
      <PublicNavbar />
      <main className="pt-16">
        <section className="bg-surface-secondary py-20">
          <div className="mx-auto max-w-3xl px-6">
            <h1 className="text-h1 font-semibold text-content-primary">Términos y Condiciones</h1>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-content-secondary">
              <p>Última actualización: Abril 2026</p>
              <h2 className="text-h2 font-semibold text-content-primary">1. Servicios</h2>
              <p>Entrenamiento personal y asesoramiento nutricional online. Programación, planificación nutricional y seguimiento según plan contratado.</p>
              <h2 className="text-h2 font-semibold text-content-primary">2. Pago</h2>
              <p>Pagos mensuales por adelantado. No hay permanencia mínima.</p>
              <h2 className="text-h2 font-semibold text-content-primary">3. Cancelación</h2>
              <p>Cancelación con 7 días de preaviso. No se reembolsa el período en curso.</p>
              <h2 className="text-h2 font-semibold text-content-primary">4. Responsabilidad</h2>
              <p>Los programas son orientativos y no sustituyen al consejo médico.</p>
              <h2 className="text-h2 font-semibold text-content-primary">5. Propiedad intelectual</h2>
              <p>Todo el material entregado es propiedad de Cristian García Espadas y no puede ser distribuido sin autorización.</p>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
