import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Reserva tu llamada gratuita de 15 minutos con Cristian García. Email, WhatsApp, Instagram. Respuesta en menos de 24 horas.",
  alternates: { canonical: "/contacto" },
  openGraph: {
    title: "Contacto | Cristian García Espadas",
    description:
      "Reserva tu llamada gratuita de 15 minutos. Sin compromiso. Respuesta en menos de 24 horas.",
  },
};

export default function ContactoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
