import type { MetadataRoute } from "next";

/**
 * Generates /sitemap.xml automatically at build time. All 9 public routes
 * with priority and changeFrequency tuned for a marketing landing:
 *   - Home: priority 1.0 (entry point)
 *   - Top-level marketing pages: priority 0.9
 *   - Legal: priority 0.3 (intentionally de-prioritised, change rarely)
 *
 * `lastModified` is the build time. Each deploy refreshes it, which is the
 * right semantic for an SSG site where "last build" = "last potential change".
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sat-cristian-garcia.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const marketing = [
    "",            // /
    "/sobre-mi",
    "/servicios",
    "/portfolio",
    "/testimonios",
    "/contacto",
    "/precios",
  ];

  const legal = ["/legal/privacidad", "/legal/terminos"];

  return [
    ...marketing.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1.0 : 0.9,
    })),
    ...legal.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
