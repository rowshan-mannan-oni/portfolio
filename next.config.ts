import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : null;
const isDev = process.env.NODE_ENV !== "production";

/*
 * Content Security Policy.
 * - Scripts: self + inline (Next.js bootstraps with inline scripts and the
 *   theme script must run before paint; a nonce-based policy would force every
 *   page to render dynamically and lose static caching).
 * - Images: self, data/blob (previews) and https (Supabase + Markdown embeds).
 * - Connections: self and Supabase (auth + direct admin uploads).
 * - No plugins, no framing, no foreign form targets.
 */
const supabaseSources = supabaseOrigin
  ? `${supabaseOrigin} ${supabaseOrigin.replace(/^http/, "ws")}`
  : "https://*.supabase.co wss://*.supabase.co";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // Any https image is allowed so Markdown posts can embed external figures.
  `img-src 'self' data: blob: https:${isDev ? " http:" : ""}`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseSources}`,
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // Lets a local Supabase stack (http://127.0.0.1:54321) serve images in development.
    dangerouslyAllowLocalIP: isDev,
    remotePatterns: [
      ...(supabaseOrigin ? [new URL(`${supabaseOrigin}/storage/v1/object/public/**`)] : []),
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  experimental: {
    // Room for blog posts with long Markdown bodies.
    serverActions: { bodySizeLimit: "2mb" },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/oni_the_boss/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
