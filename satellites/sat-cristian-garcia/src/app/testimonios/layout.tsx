import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Testimonios",
  description:
    "Testimonios reales de clientes transformados con el método de Cristian García. +500 personas, transformaciones documentadas.",
  alternates: { canonical: "/testimonios" },
  openGraph: {
    title: "Testimonios | Cristian García Espadas",
    description:
      "Más de 500 transformaciones reales documentadas. Reseñas y casos de éxito.",
  },
};

export default function TestimoniosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
