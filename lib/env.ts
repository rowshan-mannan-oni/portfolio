/**
 * Environment access.
 *
 * Client-safe values use the NEXT_PUBLIC_ prefix and are inlined at build time.
 * The secret key is read only in server modules (see lib/supabase/admin.ts).
 */

// Accept both the current Supabase key names and the legacy ones.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function getSupabasePublicEnv(): { url: string; publishableKey: string } {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return { url: supabaseUrl, publishableKey: supabasePublishableKey };
}

/** Public Supabase URL or null — used to build storage URLs. */
export const SUPABASE_URL: string | null = supabaseUrl ? supabaseUrl.replace(/\/+$/, "") : null;

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  // Vercel provides these automatically.
  const vercel =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

/** Canonical origin of the site, without a trailing slash. */
export const SITE_URL = resolveSiteUrl();
