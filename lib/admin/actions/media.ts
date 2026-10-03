"use server";

import { requireAdmin } from "@/lib/auth";
import type { ActionResult } from "@/lib/admin/action-result";
import { failure } from "@/lib/admin/server-utils";
import { MEDIA_BUCKET, isSafeStoragePath } from "@/lib/storage";

/** Deletes a file from the shared media library ("library/" folder only). */
export async function deleteLibraryFile(path: string): Promise<ActionResult> {
  try {
    if (!isSafeStoragePath(path) || !path.startsWith("library/")) return { ok: false, message: "Invalid file path." };
    const { supabase } = await requireAdmin();
    const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    if (error) return failure(error, "delete library file");
    return { ok: true, message: "File deleted. Any article still linking to it will show alt text instead." };
  } catch (error) {
    return failure(error, "delete library file");
  }
}
