"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** Browser client (singleton). Used by the admin UI for direct storage uploads. */
export function createClient() {
  if (!client) {
    const { url, publishableKey } = getSupabasePublicEnv();
    client = createBrowserClient<Database>(url, publishableKey);
  }
  return client;
}
