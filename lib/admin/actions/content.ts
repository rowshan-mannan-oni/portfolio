"use server";

import type { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import type { ActionResult } from "@/lib/admin/action-result";
import {
  ENTITY_CONFIG,
  isEntityKey,
  isRoutedEntity,
  type EntityKey,
  type Flag,
  type RoutedEntityKey,
} from "@/lib/admin/entity-config";
import { adminPath } from "@/lib/admin/routes";
import { failure, generic, isUuid, removeOwnedMedia, revalidateContent } from "@/lib/admin/server-utils";
import {
  awardSchema,
  educationSchema,
  experienceSchema,
  projectSchema,
  publicationSchema,
  researchSchema,
  skillCategorySchema,
  skillSchema,
  socialLinkSchema,
} from "@/lib/validation/entities";
import { formDataToObject, zodFieldErrors } from "@/lib/validation/fields";

/*
 * Generic CRUD for portfolio entities.
 *
 * Server Actions are reachable as public HTTP endpoints, so every function:
 *   1. authenticates and authorizes (requireAdmin),
 *   2. validates every argument (entity key whitelist, UUIDs, flags),
 *   3. validates the payload with Zod,
 * and the database enforces the same rules again through RLS.
 */

const SCHEMAS: Record<EntityKey, z.ZodType<Record<string, unknown>>> = {
  projects: projectSchema,
  research: researchSchema,
  publications: publicationSchema,
  experience: experienceSchema,
  education: educationSchema,
  awards: awardSchema,
  social: socialLinkSchema,
  skill_categories: skillCategorySchema,
  skills: skillSchema,
};

export async function saveEntity(
  entity: RoutedEntityKey | "skill_categories" | "skills",
  id: string | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    if (!isEntityKey(entity) || (id !== null && !isUuid(id))) {
      return { ok: false, message: "Invalid request." };
    }
    const { supabase } = await requireAdmin();
    const db = generic(supabase);
    const config = ENTITY_CONFIG[entity];

    const parsed = SCHEMAS[entity].safeParse(formDataToObject(formData, config.listFields));
    if (!parsed.success) {
      return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
    }
    const values = parsed.data;

    // Unique slug for projects, with a friendly message.
    if (entity === "projects") {
      let query = db.from("projects").select("id").eq("slug", values.slug as string);
      if (id) query = query.neq("id", id);
      const { data: clash } = await query.maybeSingle();
      if (clash) {
        return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: { slug: "Another project already uses this slug." } };
      }
    }

    if (id) {
      // Load current media paths so replaced files can be cleaned up.
      const { data: before, error: loadError } = await db
        .from(config.table)
        .select(config.mediaColumns.length > 0 ? config.mediaColumns.join(",") : "id")
        .eq("id", id)
        .maybeSingle();
      if (loadError) return failure(loadError, `load ${entity}`);
      if (!before) return { ok: false, message: "This item no longer exists." };

      const { error } = await db.from(config.table).update(values).eq("id", id);
      if (error) return failure(error, `update ${entity}`);

      const previous = before as unknown as Record<string, string | null>;
      const replaced = config.mediaColumns
        .map((col) => previous[col])
        .filter((path, i) => path && path !== values[config.mediaColumns[i]]);
      await removeOwnedMedia(db, replaced);

      revalidateContent();
      return { ok: true, message: "Saved.", id };
    }

    // New rows go to the end of their list.
    let orderQuery = db.from(config.table).select("display_order").order("display_order", { ascending: false }).limit(1);
    if ("orderScope" in config && config.orderScope) {
      orderQuery = orderQuery.eq(config.orderScope, values[config.orderScope] as string);
    }
    const { data: last } = await orderQuery.maybeSingle();
    const display_order = ((last as { display_order?: number } | null)?.display_order ?? 0) + 1;

    const { data: created, error } = await db
      .from(config.table)
      .insert({ ...values, display_order })
      .select("id")
      .single();
    if (error) return failure(error, `create ${entity}`);

    revalidateContent();
    const newId = (created as { id: string }).id;
    return {
      ok: true,
      message: "Created.",
      id: newId,
      redirectTo: isRoutedEntity(entity) ? adminPath(entity, newId) : undefined,
    };
  } catch (error) {
    return failure(error, `save ${entity}`);
  }
}

export async function deleteEntity(entity: EntityKey, id: string): Promise<ActionResult> {
  try {
    if (!isEntityKey(entity) || !isUuid(id)) return { ok: false, message: "Invalid request." };
    const { supabase } = await requireAdmin();
    const db = generic(supabase);
    const config = ENTITY_CONFIG[entity];

    const mediaPaths: Array<string | null> = [];
    if (config.mediaColumns.length > 0) {
      const { data } = await db.from(config.table).select(config.mediaColumns.join(",")).eq("id", id).maybeSingle();
      const row = (data ?? {}) as unknown as Record<string, string | null>;
      config.mediaColumns.forEach((col) => mediaPaths.push(row[col] ?? null));
    }
    if (entity === "projects") {
      const { data: images } = await db.from("project_images").select("path").eq("project_id", id);
      (images as Array<{ path: string }> | null)?.forEach((img) => mediaPaths.push(img.path));
    }

    const { error } = await db.from(config.table).delete().eq("id", id);
    if (error) return failure(error, `delete ${entity}`);

    await removeOwnedMedia(db, mediaPaths);
    revalidateContent();
    return { ok: true, message: "Deleted." };
  } catch (error) {
    return failure(error, `delete ${entity}`);
  }
}

export async function toggleEntityFlag(entity: EntityKey, id: string, flag: Flag): Promise<ActionResult> {
  try {
    if (!isEntityKey(entity) || !isUuid(id)) return { ok: false, message: "Invalid request." };
    const config = ENTITY_CONFIG[entity];
    if (!(config.flags as readonly string[]).includes(flag)) return { ok: false, message: "Invalid request." };

    const { supabase } = await requireAdmin();
    const db = generic(supabase);
    const { data, error: loadError } = await db.from(config.table).select(flag).eq("id", id).maybeSingle();
    if (loadError) return failure(loadError, `toggle ${entity}`);
    if (!data) return { ok: false, message: "This item no longer exists." };

    const next = !(data as unknown as Record<string, boolean>)[flag];
    const { error } = await db.from(config.table).update({ [flag]: next }).eq("id", id);
    if (error) return failure(error, `toggle ${entity}`);

    revalidateContent();
    const label =
      flag === "visible" ? (next ? "Now visible." : "Hidden from the site.") : next ? "Marked as featured." : "No longer featured.";
    return { ok: true, message: label };
  } catch (error) {
    return failure(error, `toggle ${entity}`);
  }
}

/**
 * Moves a row one step up or down. Orders within the scope are renumbered
 * 1..n so gaps or duplicates from older edits heal automatically.
 */
export async function moveEntity(entity: EntityKey, id: string, direction: "up" | "down"): Promise<ActionResult> {
  try {
    if (!isEntityKey(entity) || !isUuid(id) || (direction !== "up" && direction !== "down")) {
      return { ok: false, message: "Invalid request." };
    }
    const { supabase } = await requireAdmin();
    const db = generic(supabase);
    const config = ENTITY_CONFIG[entity];
    const scope = "orderScope" in config ? config.orderScope : undefined;

    let scopeValue: string | null = null;
    if (scope) {
      const { data } = await db.from(config.table).select(scope).eq("id", id).maybeSingle();
      scopeValue = (data as unknown as Record<string, string> | null)?.[scope] ?? null;
      if (!scopeValue) return { ok: false, message: "This item no longer exists." };
    }

    let query = db.from(config.table).select("id, display_order").order("display_order").order("created_at");
    if (scope && scopeValue) query = query.eq(scope, scopeValue);
    const { data: rows, error } = await query;
    if (error) return failure(error, `move ${entity}`);

    const ids = (rows as Array<{ id: string; display_order: number }>).map((r) => r.id);
    const index = ids.indexOf(id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || target < 0 || target >= ids.length) return { ok: true, message: "Already at the edge." };
    [ids[index], ids[target]] = [ids[target], ids[index]];

    const current = new Map((rows as Array<{ id: string; display_order: number }>).map((r) => [r.id, r.display_order]));
    const updates = ids
      .map((rowId, i) => ({ id: rowId, display_order: i + 1 }))
      .filter((u) => current.get(u.id) !== u.display_order);
    const results = await Promise.all(
      updates.map((u) => db.from(config.table).update({ display_order: u.display_order }).eq("id", u.id)),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) return failure(failed.error, `move ${entity}`);

    revalidateContent();
    return { ok: true, message: "Order updated." };
  } catch (error) {
    return failure(error, `move ${entity}`);
  }
}
