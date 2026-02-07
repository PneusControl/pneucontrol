import { withSentryConfig } from "@sentry/nextjs";
/** @type {import("next").NextConfig} */
const nextConfig = {
  // Não usar output: 'export' - quebra middleware e SSR
  // Para build mobile, use: npm run build:mobile
  typescript: { ignoreBuildErrors: true }
};
export default withSentryConfig(nextConfig, {
  org: "traxx",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  automaticVercelMonitors: true,
});
