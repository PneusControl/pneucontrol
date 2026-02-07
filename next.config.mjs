import { withSentryConfig } from "@sentry/nextjs";
/** @type {import("next").NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  typescript: { ignoreBuildErrors: true }
};
export default withSentryConfig(nextConfig, {
  org: "traxx",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,

  // Disabled for static export (mobile build)
  // tunnelRoute: "/monitoring",
  // automaticVercelMonitors: true,
});

