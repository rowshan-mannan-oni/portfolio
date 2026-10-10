import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Privileged client using the SECRET key (bypasses RLS).
 *
 * Used by visitor heartbeats and the public contact form to insert messages and count recent
 * submissions for rate limiting. Never import this from a Client Component —
 * the "server-only" import above makes the build fail if that happens.
 *
 * Returns null when the key is not configured so callers can fail gracefully.
 */
export function createSecretClient() {
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !secretKey) return null;

  return createSupabaseClient<Database>(SUPABASE_URL, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
