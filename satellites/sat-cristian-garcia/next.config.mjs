/** @type {import('next').NextConfig} */
const nextConfig = {
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
