// MOBILE BUILD CONFIG - Use apenas para builds Capacitor (Android/iOS)
// Para usar: copie este arquivo para next.config.mjs antes de npm run build

/** @type {import("next").NextConfig} */
const nextConfig = {
    output: 'export',
    images: { unoptimized: true },
    trailingSlash: true,
    typescript: { ignoreBuildErrors: true }
};

// Sentry com features SSR desabilitadas para export estático
import { withSentryConfig } from "@sentry/nextjs";
export default withSentryConfig(nextConfig, {
    org: "traxx",
    project: "javascript-nextjs",
    silent: true,
    widenClientFileUpload: true,
    // Desabilitado para static export
    // tunnelRoute: "/monitoring",
    // automaticVercelMonitors: true,
});
