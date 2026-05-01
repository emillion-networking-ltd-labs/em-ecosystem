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
