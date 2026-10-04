import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { UnauthorizedError } from "@/lib/auth";
import { CONTENT_CACHE_TAG } from "@/lib/supabase/public";
import { DOCUMENTS_BUCKET, MEDIA_BUCKET, isOwnedMediaPath } from "@/lib/storage";
import type { ActionResult } from "@/lib/admin/action-result";

/** Makes edits visible on the public site immediately (no redeploy). */
export function revalidateContent() {
  revalidateTag(CONTENT_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
}

type PostgrestLikeError = { code?: string; message?: string } | null | undefined;

/** Maps errors to safe, user-facing messages. Details go to the server log only. */
export function failure(error: unknown, context: string): ActionResult {
  if (error instanceof UnauthorizedError) {
    return { ok: false, message: "Your session has expired or you are not authorized. Please sign in again." };
  }
  const pg = error as PostgrestLikeError;
  if (pg?.code === "23505") {
    return { ok: false, message: "That value is already in use. Please choose a different one." };
  }
  // Undefined column/table (Postgres) or not in PostgREST's schema cache.
  if (pg?.code === "42703" || pg?.code === "PGRST204" || pg?.code === "42P01" || pg?.code === "PGRST205") {
    console.error(`[admin] ${context}`, error);
    return {
      ok: false,
      message:
        "The database is missing a table or column. Run the newest SQL file in supabase/migrations (SQL Editor → paste → Run), then try again.",
    };
  }
  if (pg?.code === "42501") {
    return { ok: false, message: "Permission denied by the database. Check that your account is in admin_users." };
  }
  console.error(`[admin] ${context}`, error);
  return { ok: false, message: "Something went wrong. Please try again." };
}

/** Untyped view of the client for table-generic helpers. */
export function generic(client: unknown): SupabaseClient {
  return client as unknown as SupabaseClient;
}

/**
 * Removes storage objects that belong to an entity. Paths in the shared
 * "library" folder, or outside known folders, are never deleted.
 */
export async function removeOwnedMedia(client: unknown, paths: Array<string | null | undefined>) {
  const owned = Array.from(new Set(paths.filter(isOwnedMediaPath)));
  if (owned.length === 0) return;
  const { error } = await generic(client).storage.from(MEDIA_BUCKET).remove(owned);
  if (error) console.error("[admin] media cleanup failed", error);
}

export async function removeDocument(client: unknown, path: string | null | undefined) {
  if (!path || !path.startsWith("cv/")) return;
  const { error } = await generic(client).storage.from(DOCUMENTS_BUCKET).remove([path]);
  if (error) console.error("[admin] document cleanup failed", error);
}

const MEDIA_REFERENCES: Array<[table: string, column: string]> = [
  ["site_settings", "profile_image_path"],
  ["site_settings", "og_image_path"],
  ["site_settings", "cutout_image_path"],
  ["projects", "thumbnail"],
  ["project_images", "path"],
  ["research", "image"],
  ["publications", "image"],
  ["experiences", "organization_logo"],
  ["education", "logo"],
  ["awards", "image"],
  ["blog_posts", "cover_image"],
];

/** True when any row still points at this media path. */
export async function isMediaReferenced(client: unknown, path: string): Promise<boolean> {
  const db = generic(client);
  const counts = await Promise.all(
    MEDIA_REFERENCES.map(([table, column]) =>
      db.from(table).select(column, { count: "exact", head: true }).eq(column, path),
    ),
  );
  // Treat errors as "referenced" so we never delete on uncertainty.
  return counts.some((r) => r.error || (r.count ?? 0) > 0);
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
