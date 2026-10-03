"use server";

import { requireAdmin } from "@/lib/auth";
import type { ActionResult } from "@/lib/admin/action-result";
import { failure, isUuid, removeOwnedMedia, revalidateContent } from "@/lib/admin/server-utils";
import { isSafeStoragePath } from "@/lib/storage";
import { clean } from "@/lib/utils";

export async function addProjectImages(projectId: string, paths: string[]): Promise<ActionResult> {
  try {
    if (!isUuid(projectId) || !Array.isArray(paths) || paths.length === 0 || paths.length > 20) {
      return { ok: false, message: "Invalid request." };
    }
    if (!paths.every((p) => typeof p === "string" && isSafeStoragePath(p) && p.startsWith(`projects/${projectId}/`))) {
      return { ok: false, message: "Invalid file path." };
    }
    const { supabase } = await requireAdmin();
    const { data: last } = await supabase
      .from("project_images")
      .select("display_order")
      .eq("project_id", projectId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const start = (last?.display_order ?? 0) + 1;
    const { error } = await supabase
      .from("project_images")
      .insert(paths.map((path, i) => ({ project_id: projectId, path, display_order: start + i })));
    if (error) return failure(error, "add images");
    revalidateContent();
    return { ok: true, message: paths.length === 1 ? "Image added." : `${paths.length} images added.` };
  } catch (error) {
    return failure(error, "add images");
  }
}

export async function updateProjectImage(id: string, altText: string, caption: string): Promise<ActionResult> {
  try {
    if (!isUuid(id)) return { ok: false, message: "Invalid request." };
    const alt = clean(String(altText ?? "").slice(0, 300));
    const cap = clean(String(caption ?? "").slice(0, 300));
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("project_images").update({ alt_text: alt, caption: cap }).eq("id", id);
    if (error) return failure(error, "update image");
    revalidateContent();
    return { ok: true, message: "Image details saved." };
  } catch (error) {
    return failure(error, "update image");
  }
}

export async function moveProjectImage(id: string, direction: "up" | "down"): Promise<ActionResult> {
  try {
    if (!isUuid(id) || (direction !== "up" && direction !== "down")) return { ok: false, message: "Invalid request." };
    const { supabase } = await requireAdmin();
    const { data: image } = await supabase.from("project_images").select("project_id").eq("id", id).maybeSingle();
    if (!image) return { ok: false, message: "This image no longer exists." };
    const { data: rows, error } = await supabase
      .from("project_images")
      .select("id")
      .eq("project_id", image.project_id)
      .order("display_order")
      .order("created_at");
    if (error) return failure(error, "move image");
    const ids = rows.map((r) => r.id);
    const index = ids.indexOf(id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= ids.length) return { ok: true, message: "Already at the edge." };
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await Promise.all(ids.map((rowId, i) => supabase.from("project_images").update({ display_order: i + 1 }).eq("id", rowId)));
    revalidateContent();
    return { ok: true, message: "Order updated." };
  } catch (error) {
    return failure(error, "move image");
  }
}

export async function deleteProjectImage(id: string): Promise<ActionResult> {
  try {
    if (!isUuid(id)) return { ok: false, message: "Invalid request." };
    const { supabase } = await requireAdmin();
    const { data: image } = await supabase.from("project_images").select("path").eq("id", id).maybeSingle();
    if (!image) return { ok: false, message: "This image no longer exists." };
    const { error } = await supabase.from("project_images").delete().eq("id", id);
    if (error) return failure(error, "delete image");
    await removeOwnedMedia(supabase, [image.path]);
    revalidateContent();
    return { ok: true, message: "Image deleted." };
  } catch (error) {
    return failure(error, "delete image");
  }
}
