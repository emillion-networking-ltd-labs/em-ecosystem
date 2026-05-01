import type { MetadataRoute } from "next";

/**
 * Generates /robots.txt automatically at build time via Next.js metadata file conventions.
 * Marketing site → all crawlers welcome on every public route. The sitemap pointer
 * accelerates indexing by supported search engines.
 *
 * If a non-public route is added later (admin, internal), list it under `disallow`.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sat-cristian-garcia.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
