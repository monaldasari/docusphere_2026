/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Required for Vercel deployments using Node.js runtime features (cookies, headers, etc.)
  // All API routes that use cookies MUST export: export const dynamic = "force-dynamic"
  output: "standalone",

  webpack: (config) => {
    // Fixes 'Yjs was already imported' error by enforcing a single instance
    config.resolve.alias.yjs = require.resolve('yjs');
    return config;
  },
};

module.exports = nextConfig;
