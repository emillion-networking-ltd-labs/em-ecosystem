import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "./providers";
import IntroLoader from "@/components/layout/IntroLoader";
import "./globals.css";

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'){document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})()`;

// Synchronous splash skip — adds `intro-skip` to <html> if the user already
// saw the splash this session. CSS then hides the overlay before first paint,
// preventing the flash of page content that would otherwise occur while
// React waits to hydrate. Mirror logic in IntroLoader.tsx.
const INTRO_INIT_SCRIPT = `(function(){try{if(sessionStorage.getItem('intro_seen')){document.documentElement.classList.add('intro-skip')}}catch(e){}})()`;

// Site URL is sourced from env so we can flip from the Vercel default to the
// custom domain (cristiangarcia.com) without a code change. Mirror in robots.ts
// and sitemap.ts.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sat-cristian-garcia.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Cristian García Espadas | Entrenador Personal",
    template: "%s | Cristian García Espadas",
  },
  description:
    "Entrenamiento personalizado y asesoramiento nutricional con Cristian García Espadas. Campeón de España Sub 23. Finalista Míster Universo.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Cristian García Espadas | Aquí cambiarás tu vida",
    description: "Entrenamiento personalizado y nutrición científica. +500 clientes transformados.",
    images: ["/images/hero-spread-bw.jpeg"],
    type: "website",
    locale: "es_ES",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: INTRO_INIT_SCRIPT }} />
      </head>
      <body>
        <IntroLoader />
        <Providers>{children}</Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
