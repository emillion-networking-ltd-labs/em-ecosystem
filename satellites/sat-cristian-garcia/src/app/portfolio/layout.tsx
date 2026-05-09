import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Galería profesional, palmarés y menciones en prensa. Trayectoria competitiva: Top 15 mundial Míster Universo.",
  alternates: { canonical: "/portfolio" },
  openGraph: {
    title: "Portfolio | Cristian García Espadas",
    description:
      "Galería, palmarés competitivo y prensa. De Granada al Top 15 mundial.",
  },
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
