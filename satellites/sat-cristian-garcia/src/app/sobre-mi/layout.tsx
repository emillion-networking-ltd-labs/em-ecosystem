import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre Mí",
  description:
    "Conoce a Cristian García Espadas: campeón de España Sub 23, finalista Míster Universo. Formación, filosofía y trayectoria como entrenador personal.",
  alternates: { canonical: "/sobre-mi" },
  openGraph: {
    title: "Sobre Mí | Cristian García Espadas",
    description:
      "Campeón de España Sub 23, finalista Míster Universo. Mi trayectoria, formación y método.",
  },
};

export default function SobreMiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
