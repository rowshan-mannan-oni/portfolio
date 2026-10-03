import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export const CONTENT_CACHE_TAG = "portfolio-content";

/**
 * Anonymous, cookie-less client for public pages.
 *
 * It never reads the visitor's session, so pages that use it can be statically
 * generated and cached. Requests are tagged so admin mutations can invalidate
 * them immediately (see lib/admin/revalidate.ts). RLS ensures it only ever
 * sees visible / published rows.
 */
export function createPublicClient() {
  const { url, publishableKey } = getSupabasePublicEnv();
  return createSupabaseClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          next: { revalidate: 3600, tags: [CONTENT_CACHE_TAG] },
        }),
    },
  });
}
