import type { Metadata } from "next";
import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";

export const metadata: Metadata = { title: "Política de Privacidad" };

export default function PrivacidadPage() {
  return (
    <>
      <PublicNavbar />
      <main className="pt-16">
        <section className="bg-surface-secondary py-20">
          <div className="mx-auto max-w-3xl px-6">
            <h1 className="text-h1 font-semibold text-content-primary">Política de Privacidad</h1>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-content-secondary">
              <p>Última actualización: Abril 2026</p>
              <h2 className="text-h2 font-semibold text-content-primary">1. Responsable</h2>
              <p>Cristian García Espadas, Granada, España. Email: info@cristiangarcia.com</p>
              <h2 className="text-h2 font-semibold text-content-primary">2. Datos recopilados</h2>
              <p>Nombre, email y mensaje proporcionados vía formulario de contacto. No usamos cookies de rastreo.</p>
              <h2 className="text-h2 font-semibold text-content-primary">3. Finalidad</h2>
              <p>Responder consultas y gestionar servicios de entrenamiento personal y asesoramiento nutricional.</p>
              <h2 className="text-h2 font-semibold text-content-primary">4. Base legal</h2>
              <p>Consentimiento explícito al enviar el formulario (RGPD, Reglamento UE 2016/679).</p>
              <h2 className="text-h2 font-semibold text-content-primary">5. Derechos</h2>
              <p>Acceso, rectificación, supresión, portabilidad y oposición vía info@cristiangarcia.com.</p>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
