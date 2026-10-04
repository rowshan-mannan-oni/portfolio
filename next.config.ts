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

function buildCsp({ admin }: { admin: boolean }) {
  // The dashboard's in-browser background remover (transformers.js) loads its
  // WebAssembly runtime from jsDelivr and the model from the Hugging Face Hub.
  // Only admin pages get these allowances; the public site stays strict.
  const ml = admin
    ? {
        script: " 'wasm-unsafe-eval' blob: https://cdn.jsdelivr.net",
        connect: " https://cdn.jsdelivr.net https://huggingface.co https://*.huggingface.co https://*.hf.co",
      }
    : { script: "", connect: "" };

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${ml.script}`,
    "style-src 'self' 'unsafe-inline'",
    // Any https image is allowed so Markdown posts can embed external figures.
    `img-src 'self' data: blob: https:${isDev ? " http:" : ""}`,
    "font-src 'self' data:",
    `connect-src 'self' ${supabaseSources}${ml.connect}`,
    ...(admin ? ["worker-src 'self' blob:"] : []),
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

const baseHeaders = [
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
      { source: "/:path*", headers: baseHeaders },
      // Public pages: strict CSP. (Two CSP headers would intersect, so the
      // admin area is excluded here and gets its own policy below.)
      {
        source: "/:path((?!oni_the_boss).*)",
        headers: [{ key: "Content-Security-Policy", value: buildCsp({ admin: false }) }],
      },
      {
        source: "/oni_the_boss/:path*",
        headers: [
          { key: "Content-Security-Policy", value: buildCsp({ admin: true }) },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
