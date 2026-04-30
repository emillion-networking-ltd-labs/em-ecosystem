import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sobre Mí" };

export default function SobreMiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
