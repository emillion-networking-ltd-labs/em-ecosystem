import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import Providers from "./providers";

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`;

export const metadata: Metadata = {
  title: "EM NexaCore",
  description: "EM Ecosystem Core Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = headers().get("x-nonce") ?? "";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* SECURITY-ALLOW: theme-flash prevention. Static, build-time-known
            script content (THEME_INIT_SCRIPT constant) — never user-controlled.
            CSP nonce-protected. Required to run before React hydration to set
            data-theme on <html> and avoid the FOUC. Reviewed 2026-05-07. */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
