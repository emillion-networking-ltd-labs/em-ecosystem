// Estándar profesional COMPLETO del núcleo común (FB5, ECO-65 / ADR-013). Vive en el NÚCLEO → lo hereda TODO
// builder. Templates: formulario de contacto/lead (Vercel Server Action + Resend + Turnstile), 404 de marca,
// web manifest, test de a11y (axe-core + Playwright). Generación de favicons vía sharp (require("sharp"),
// opcional: si no está instalado, las rutas de iconos quedan pendientes y el gate de launch-readiness lo reporta).
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

// --- Formulario de contacto/lead (Vercel Server Action + Resend + Turnstile) ---------------------------------

// Server Action: verifica Turnstile → envía email con Resend. Env vars: RESEND_API_KEY, LEAD_EMAIL,
// TURNSTILE_SECRET_KEY (opcional), RESEND_FROM_EMAIL (opcional).
export const CONTACT_ACTION = () => `"use server";
import { Resend } from "resend";

export async function sendLead(
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const token = String(formData.get("cf-turnstile-response") ?? "");

  if (!name || !email || !message) return { error: "All fields are required" };

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (secret) {
    const r = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: \`secret=\${encodeURIComponent(secret)}&response=\${encodeURIComponent(token)}\`,
      }
    );
    const d = (await r.json()) as { success: boolean };
    if (!d.success) return { error: "Captcha verification failed" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_EMAIL;
  if (!apiKey || !to) return { error: "Contact form not configured" };
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to,
    subject: \`New lead from \${name}\`,
    html: \`<p><b>Name:</b> \${name}</p><p><b>Email:</b> \${email}</p><p><b>Message:</b> \${message}</p>\`,
  });

  return { ok: true };
}
`;

// Contact page: client component con TurnstileWidget + form → Server Action. TurnstileWidget viene del
// em-ui registry (emui(['add','TurnstileWidget']) lo instala + su dep hooks/useTheme.ts).
export const CONTACT_PAGE = (siteName, t) => {
  const j = (v) => JSON.stringify(String(v ?? ""));
  const heading = `${siteName} — ${t?.contact ?? "Contact"}`;
  const subText = t?.contactDesc ?? "Send us a message and we'll be in touch.";
  return `"use client";

import { useState, useRef, useCallback } from "react";
import Button from "@/components/ui/Button";
import TurnstileWidget from "@/components/ui/TurnstileWidget";
import { sendLead } from "@/app/actions/send-lead";

export const metadata = {
  title: { absolute: ${j(heading)} },
  alternates: { canonical: "/contact" },
  openGraph: { type: "website", title: ${j(heading)}, url: "/contact" },
  twitter: { card: "summary_large_image" as const, title: ${j(heading)} },
};

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [resetKey, setResetKey] = useState(0);
  const [token, setToken] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleToken = useCallback((t: string) => setToken(t), []);
  const handleExpire = useCallback(() => setToken(""), []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setStatus("sending");
    const fd = new FormData(e.currentTarget);
    fd.append("cf-turnstile-response", token);
    const r = await sendLead(fd);
    if (r?.ok) {
      setStatus("ok");
      formRef.current?.reset();
      setToken("");
      setResetKey((k) => k + 1);
    } else {
      setStatus("error");
      setToken("");
      setResetKey((k) => k + 1);
    }
  }

  return (
    <main className="bg-surface-primary text-content-primary">
      <section className="mx-auto max-w-2xl px-6 py-20 sm:py-28">
        <h1 className="text-h1 font-bold text-content-primary">{${j(heading)}}</h1>
        <p className="mt-4 text-body text-content-secondary">{${j(subText)}}</p>
        {status === "ok" ? (
          <div className="mt-10 rounded-2xl border border-border-default bg-surface-secondary p-8 text-center">
            <p className="text-h3 font-semibold text-accent">{"Message sent!"}</p>
            <p className="mt-2 text-body text-content-secondary">
              {"Thank you, we\\u2019ll be in touch shortly."}
            </p>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
            {status === "error" && (
              <p className="rounded-lg bg-surface-secondary px-4 py-3 text-sm text-red-500">
                {"Something went wrong — please try again."}
              </p>
            )}
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-content-secondary">
                {"Name"}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                className="w-full rounded-lg border border-border-default bg-surface-secondary px-4 py-2.5 text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-content-secondary">
                {"Email"}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-border-default bg-surface-secondary px-4 py-2.5 text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="message" className="mb-1 block text-sm font-medium text-content-secondary">
                {"Message"}
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                className="w-full resize-none rounded-lg border border-border-default bg-surface-secondary px-4 py-2.5 text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <TurnstileWidget onToken={handleToken} onExpire={handleExpire} resetKey={resetKey} />
            <Button
              type="submit"
              variant="primary"
              disabled={!token || status === "sending"}
              aria-busy={status === "sending"}
            >
              {status === "sending" ? "Sending…" : "Send message"}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
`;
};

// --- 404 de marca -----------------------------------------------------------------------------------------

export const NOT_FOUND_PAGE = (siteName, t) => {
  const j = (v) => JSON.stringify(String(v ?? ""));
  const backLabel = t?.backHome ?? "Back to home";
  return `import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-primary px-6 text-center">
      <span className="text-6xl font-extrabold text-accent" aria-hidden="true">
        {"404"}
      </span>
      <h1 className="mt-4 text-h2 font-bold text-content-primary">{"Page not found"}</h1>
      <p className="mt-3 text-body text-content-secondary">
        {"The page you are looking for doesn\\u2019t exist or has been moved."}
      </p>
      <p className="mt-1 text-caption text-content-tertiary">{${j(siteName)}}</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
      >
        {${j(backLabel)}}
      </Link>
    </main>
  );
}
`;
};

// --- Web manifest (PWA-ready, brand color) ----------------------------------------------------------------

export const WEBMANIFEST = (siteName, brand) => JSON.stringify({
  name: siteName,
  short_name: siteName.split(/\s+/)[0],
  description: `${siteName} — professional website`,
  start_url: "/",
  display: "standalone",
  background_color: brand || "#ffffff",
  theme_color: brand || "#0076a9",
  icons: [
    { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
    { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
}, null, 2) + "\n";

// --- Test de a11y (axe-core + Playwright, WCAG AA) --------------------------------------------------------
// axe-core caza ~57% de los criterios automatizables; incomplete → revisión humana (honest, no finge AA total).

export const A11Y_TEST = (routes) => {
  const j = (v) => JSON.stringify(v);
  return `import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// axe-core (@axe-core/playwright, MPL-2.0) automatiza ~57% de los criterios WCAG AA.
// violations = fallos automatizados → el test falla.
// incomplete = requieren revisión humana → se listan como advertencia, NO bloquean.
const ROUTES = ${j(routes)};

for (const route of ROUTES) {
  test(\`a11y WCAG AA — \${route}\`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    if (results.incomplete.length > 0) {
      console.warn(
        \`  ⚠ \${results.incomplete.length} check(s) incompleto(s) en \${route} — revisión humana requerida:\`,
        results.incomplete.map((r) => r.id).join(", ")
      );
    }
    expect(
      results.violations,
      \`Violaciones a11y en \${route}: \` +
        results.violations.map((v) => \`\${v.id}: \${v.description}\`).join("; ")
    ).toHaveLength(0);
  });
}
`;
};

// --- Playwright config (necesario para que los tests de a11y corran) -------------------------------------

export const PLAYWRIGHT_CONFIG = (baseUrl) => `import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: ${JSON.stringify(baseUrl || "http://localhost:3100")},
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm run start",
    url: ${JSON.stringify(baseUrl || "http://localhost:3100")},
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
`;

// --- Generación de favicons desde el logo real (vía sharp) -----------------------------------------------
// Intenta generar todos los tamaños desde logoFile. Si sharp no está instalado → devuelve { ok:false }.
// La función es ASYNC; el emitter la llama con await.

export async function generateFavicons(logoFile, pubDir, brand) {
  let sharp;
  try {
    // Primero intenta el sharp local del skill, luego el global
    const paths = [
      new URL("../../../../node_modules/sharp/lib/index.js", import.meta.url).pathname,
      "sharp",
    ];
    for (const p of paths) {
      try { sharp = (await import(p)).default; break; } catch {}
    }
    if (!sharp) return { ok: false, reason: "sharp not installed (npm install sharp en el skill)" };
  } catch {
    return { ok: false, reason: "sharp not available" };
  }

  try {
    mkdirSync(pubDir, { recursive: true });
    const img = sharp(logoFile);
    const meta = await img.metadata();

    // SVG pass-through (navegadores modernos lo prefieren para favicon)
    const ext = extname(logoFile).toLowerCase();
    if (ext === ".svg") {
      copyFileSync(logoFile, join(pubDir, "favicon.svg"));
    }

    // PNG 32×32 como favicon PNG fallback
    await sharp(logoFile).resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png().toFile(join(pubDir, "favicon.png"));

    // apple-touch-icon 180×180
    await sharp(logoFile).resize(180, 180, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png().toFile(join(pubDir, "apple-touch-icon.png"));

    // android-chrome 192×192 y 512×512
    await sharp(logoFile).resize(192, 192, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png().toFile(join(pubDir, "android-chrome-192x192.png"));
    await sharp(logoFile).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png().toFile(join(pubDir, "android-chrome-512x512.png"));

    const generated = [
      ext === ".svg" ? "favicon.svg" : null,
      "favicon.png",
      "apple-touch-icon.png",
      "android-chrome-192x192.png",
      "android-chrome-512x512.png",
    ].filter(Boolean);

    return { ok: true, generated, size: `${meta.width ?? "?"}×${meta.height ?? "?"}` };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}
