import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Servicios",
  description:
    "Servicios de entrenamiento personal: presencial, online, asesoramiento nutricional y seguimiento. Métodos basados en evidencia científica.",
  alternates: { canonical: "/servicios" },
  openGraph: {
    title: "Servicios | Cristian García Espadas",
    description:
      "Entrenamiento presencial, online, nutrición científica y seguimiento. Tu plan personalizado.",
  },
};

export default function ServiciosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
