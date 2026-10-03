"use server";

import { requireAdmin } from "@/lib/auth";
import type { ActionResult } from "@/lib/admin/action-result";
import {
  failure,
  isMediaReferenced,
  removeDocument,
  removeOwnedMedia,
  revalidateContent,
} from "@/lib/admin/server-utils";
import { sectionSchema, siteSettingsSchema } from "@/lib/validation/entities";
import { formDataToObject, zodFieldErrors } from "@/lib/validation/fields";
import { DOCUMENTS_BUCKET, MAX_PDF_BYTES, isSafeStoragePath } from "@/lib/storage";
import { SECTION_KEYS, type SectionKey } from "@/types/database";

const SETTINGS_LIST_FIELDS = ["research_interests", "author_names"] as const;

export async function saveSiteSettings(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const parsed = siteSettingsSchema.safeParse(formDataToObject(formData, SETTINGS_LIST_FIELDS));
    if (!parsed.success) {
      return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
    }

    const { data: before } = await supabase
      .from("site_settings")
      .select("profile_image_path, og_image_path")
      .eq("id", true)
      .maybeSingle();

    const { error } = await supabase.from("site_settings").upsert({ id: true, ...parsed.data });
    if (error) return failure(error, "save settings");

    await removeOwnedMedia(supabase, [
      before?.profile_image_path !== parsed.data.profile_image_path ? before?.profile_image_path : null,
      before?.og_image_path !== parsed.data.og_image_path ? before?.og_image_path : null,
    ]);

    revalidateContent();
    return { ok: true, message: "Settings saved." };
  } catch (error) {
    return failure(error, "save settings");
  }
}

export async function saveSection(key: SectionKey, formData: FormData): Promise<ActionResult> {
  try {
    if (!(SECTION_KEYS as readonly string[]).includes(key)) return { ok: false, message: "Invalid request." };
    const { supabase } = await requireAdmin();
    const parsed = sectionSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
    }
    const { data: existing } = await supabase.from("section_settings").select("display_order").eq("key", key).maybeSingle();
    const display_order = existing?.display_order ?? SECTION_KEYS.indexOf(key) + 1;
    const { error } = await supabase
      .from("section_settings")
      .upsert({ key, display_order, ...parsed.data });
    if (error) return failure(error, "save section");
    revalidateContent();
    return { ok: true, message: "Section saved." };
  } catch (error) {
    return failure(error, "save section");
  }
}

export async function moveSection(key: SectionKey, direction: "up" | "down"): Promise<ActionResult> {
  try {
    if (!(SECTION_KEYS as readonly string[]).includes(key) || (direction !== "up" && direction !== "down")) {
      return { ok: false, message: "Invalid request." };
    }
    const { supabase } = await requireAdmin();
    const { data: rows, error } = await supabase.from("section_settings").select("key, display_order").order("display_order");
    if (error) return failure(error, "move section");

    const keys = rows.map((r) => r.key);
    const index = keys.indexOf(key);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || target < 0 || target >= keys.length) return { ok: true, message: "Already at the edge." };
    [keys[index], keys[target]] = [keys[target], keys[index]];

    const results = await Promise.all(
      keys.map((k, i) => supabase.from("section_settings").update({ display_order: i + 1 }).eq("key", k)),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) return failure(failed.error, "move section");
    revalidateContent();
    return { ok: true, message: "Order updated." };
  } catch (error) {
    return failure(error, "move section");
  }
}

/* --------------------------------------------------------------------------
   CV management. The browser uploads the PDF directly to the "documents"
   bucket (RLS: admins only); this action verifies it and swaps the reference.
   -------------------------------------------------------------------------- */

export async function setCv(path: string, fileName: string): Promise<ActionResult> {
  try {
    if (!isSafeStoragePath(path) || !path.startsWith("cv/") || !path.endsWith(".pdf")) {
      return { ok: false, message: "Invalid file path." };
    }
    const safeName = fileName.replace(/[^\w.\- ]+/g, "").trim().slice(0, 120) || "CV.pdf";
    const { supabase } = await requireAdmin();

    // Verify the uploaded object really is a PDF (magic bytes), not just named one.
    const { data: blob, error: downloadError } = await supabase.storage.from(DOCUMENTS_BUCKET).download(path);
    if (downloadError || !blob) return failure(downloadError, "verify cv");
    const head = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
    const isPdf = String.fromCharCode(...head) === "%PDF-";
    if (!isPdf || blob.size > MAX_PDF_BYTES) {
      await removeDocument(supabase, path);
      return { ok: false, message: "That file is not a valid PDF (or is larger than 10 MB)." };
    }

    const { data: before } = await supabase.from("site_settings").select("cv_path").eq("id", true).maybeSingle();
    const { error } = await supabase.from("site_settings").upsert({
      id: true,
      cv_path: path,
      cv_file_name: safeName.toLowerCase().endsWith(".pdf") ? safeName : `${safeName}.pdf`,
      cv_updated_at: new Date().toISOString(),
    });
    if (error) return failure(error, "set cv");

    if (before?.cv_path && before.cv_path !== path) await removeDocument(supabase, before.cv_path);
    revalidateContent();
    return { ok: true, message: "CV updated." };
  } catch (error) {
    return failure(error, "set cv");
  }
}

export async function removeCv(): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { data: before } = await supabase.from("site_settings").select("cv_path").eq("id", true).maybeSingle();
    const { error } = await supabase
      .from("site_settings")
      .update({ cv_path: null, cv_file_name: null, cv_updated_at: null })
      .eq("id", true);
    if (error) return failure(error, "remove cv");
    await removeDocument(supabase, before?.cv_path);
    revalidateContent();
    return { ok: true, message: "CV removed." };
  } catch (error) {
    return failure(error, "remove cv");
  }
}

export async function setCvVisible(visible: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("site_settings").update({ cv_visible: Boolean(visible) }).eq("id", true);
    if (error) return failure(error, "cv visibility");
    revalidateContent();
    return { ok: true, message: visible ? "Download button shown." : "Download button hidden." };
  } catch (error) {
    return failure(error, "cv visibility");
  }
}

/** Removes an uploaded-but-unsaved file (e.g. the user replaced it before saving). */
export async function discardUpload(path: string): Promise<ActionResult> {
  try {
    if (!isSafeStoragePath(path)) return { ok: false, message: "Invalid file path." };
    const { supabase } = await requireAdmin();
    if (path.startsWith("cv/")) {
      // Never discard the CV currently in use.
      const { data } = await supabase.from("site_settings").select("cv_path").eq("id", true).maybeSingle();
      if (data?.cv_path === path) return { ok: true, message: "Kept." };
      await removeDocument(supabase, path);
    } else {
      if (await isMediaReferenced(supabase, path)) return { ok: true, message: "Kept." };
      await removeOwnedMedia(supabase, [path]);
    }
    return { ok: true, message: "Discarded." };
  } catch (error) {
    return failure(error, "discard upload");
  }
}
