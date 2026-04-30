import Button from "@/components/ui/Button";

export default function HeroCTA() {
  return (
    <section className="bg-surface-primary py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-display text-content-primary">
          Aquí cambiarás tu vida.
        </h2>
        <div className="mt-8">
          <Button variant="primary" size="lg" href="/contacto">
            Empieza tu transformación
          </Button>
        </div>
      </div>
    </section>
  );
}
