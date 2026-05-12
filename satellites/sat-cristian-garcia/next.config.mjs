import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */

// Security baseline applied to every route. Sources:
// - https://vercel.com/docs/cdn-security/security-headers
// - https://nextjs.org/docs/app/guides/production-checklist
// CSP is intentionally NOT added in this iteration — a strict CSP requires a
// nonce/hash strategy compatible with Tailwind, which is a separate ticket.
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },

  // Next 16 defaults to Turbopack. Pin `root` to this package so Turbopack
  // doesn't walk up the directory tree and pick the monorepo-root lockfile
  // as workspace root (dashboard uses the same pattern). Silences the
  // multiple-lockfiles warning when the monorepo root has its own
  // `package-lock.json` (husky + lint-staged + jscpd devDeps).
  // The `webpack:` block below remains as a fallback for `next build --webpack`
  // and the OneDrive dev-polling workaround if Turbopack regresses on it.
  turbopack: {
    root: __dirname,
  },

  webpack: (config, { dev }) => {
    // Polling-based file watching: native FS events are unreliable inside
    // OneDrive-synced folders on Windows, so HMR misses changes. Polling adds
    // ~1s of latency but reliably picks up edits.
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/node_modules", "**/.next"],
      };
    }
    return config;
  },
};

export default nextConfig;
