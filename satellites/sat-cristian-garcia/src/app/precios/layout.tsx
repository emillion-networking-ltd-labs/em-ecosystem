import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Precios",
  description:
    "Planes de entrenamiento personalizado: prueba gratis, plan Pro y Elite. Sin permanencia. Cambia tu vida con un método contrastado.",
  alternates: { canonical: "/precios" },
  openGraph: {
    title: "Precios | Cristian García Espadas",
    description:
      "Planes Pro y Elite + llamada gratuita inicial. Sin permanencia.",
  },
};

export default function PreciosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
