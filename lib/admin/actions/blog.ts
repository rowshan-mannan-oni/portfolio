"use server";

import { requireAdmin } from "@/lib/auth";
import type { ActionResult } from "@/lib/admin/action-result";
import { adminPath } from "@/lib/admin/routes";
import { failure, isUuid, removeOwnedMedia, revalidateContent } from "@/lib/admin/server-utils";
import { blogPostSchema } from "@/lib/validation/entities";
import { formDataToObject, zodFieldErrors } from "@/lib/validation/fields";
import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

/** Finds a free slug: "my-post", "my-post-2", "my-post-3"… */
async function uniqueSlug(supabase: Client, base: string, excludeId: string | null): Promise<string> {
  let query = supabase.from("blog_posts").select("slug").like("slug", `${base}%`);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query;
  const taken = new Set((data ?? []).map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let n = 2; n < 500; n++) {
    const candidate = `${base}-${n}`.slice(0, 80);
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function saveBlogPost(id: string | null, formData: FormData): Promise<ActionResult> {
  try {
    if (id !== null && !isUuid(id)) return { ok: false, message: "Invalid request." };
    const { supabase } = await requireAdmin();
    const parsed = blogPostSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
    }
    const { intent, slug_manual, ...fields } = parsed.data;

    // Slugs: a manually edited slug that collides is an error; an automatic one
    // gets a numeric suffix.
    let slug = fields.slug;
    let clashQuery = supabase.from("blog_posts").select("id, title").eq("slug", slug);
    if (id) clashQuery = clashQuery.neq("id", id);
    const { data: clash } = await clashQuery.maybeSingle();
    if (clash) {
      if (slug_manual) {
        const suggestion = await uniqueSlug(supabase, slug, id);
        return {
          ok: false,
          message: "Please fix the highlighted fields.",
          fieldErrors: { slug: `“${clash.title}” already uses this slug. Try “${suggestion}”.` },
        };
      }
      slug = await uniqueSlug(supabase, slug, id);
    }

    const before = id
      ? (await supabase.from("blog_posts").select("status, published_at, cover_image").eq("id", id).maybeSingle()).data
      : null;
    if (id && !before) return { ok: false, message: "This post no longer exists." };

    let status = before?.status ?? "draft";
    if (intent === "publish") status = "published";
    if (intent === "unpublish") status = "draft";
    const published_at =
      fields.published_at ?? (status === "published" ? (before?.published_at ?? new Date().toISOString()) : null);

    const row = { ...fields, slug, status, published_at };

    if (id) {
      const { error } = await supabase.from("blog_posts").update(row).eq("id", id);
      if (error) return failure(error, "update post");
      if (before?.cover_image && before.cover_image !== row.cover_image) {
        await removeOwnedMedia(supabase, [before.cover_image]);
      }
      revalidateContent();
      return {
        ok: true,
        id,
        message: intent === "publish" ? "Published." : intent === "unpublish" ? "Moved back to drafts." : "Saved.",
      };
    }

    const { data: created, error } = await supabase.from("blog_posts").insert(row).select("id").single();
    if (error) return failure(error, "create post");
    revalidateContent();
    return {
      ok: true,
      id: created.id,
      message: intent === "publish" ? "Published." : "Draft saved.",
      redirectTo: adminPath("blog", created.id),
    };
  } catch (error) {
    return failure(error, "save post");
  }
}

export async function setBlogStatus(id: string, status: "draft" | "published"): Promise<ActionResult> {
  try {
    if (!isUuid(id) || (status !== "draft" && status !== "published")) return { ok: false, message: "Invalid request." };
    const { supabase } = await requireAdmin();
    const { data: post } = await supabase.from("blog_posts").select("published_at").eq("id", id).maybeSingle();
    if (!post) return { ok: false, message: "This post no longer exists." };
    const { error } = await supabase
      .from("blog_posts")
      .update({
        status,
        published_at: status === "published" ? (post.published_at ?? new Date().toISOString()) : post.published_at,
      })
      .eq("id", id);
    if (error) return failure(error, "post status");
    revalidateContent();
    return { ok: true, message: status === "published" ? "Published." : "Unpublished." };
  } catch (error) {
    return failure(error, "post status");
  }
}

export async function toggleBlogFeatured(id: string): Promise<ActionResult> {
  try {
    if (!isUuid(id)) return { ok: false, message: "Invalid request." };
    const { supabase } = await requireAdmin();
    const { data: post } = await supabase.from("blog_posts").select("featured").eq("id", id).maybeSingle();
    if (!post) return { ok: false, message: "This post no longer exists." };
    const { error } = await supabase.from("blog_posts").update({ featured: !post.featured }).eq("id", id);
    if (error) return failure(error, "post featured");
    revalidateContent();
    return { ok: true, message: post.featured ? "No longer featured." : "Marked as featured." };
  } catch (error) {
    return failure(error, "post featured");
  }
}

export async function deleteBlogPost(id: string): Promise<ActionResult> {
  try {
    if (!isUuid(id)) return { ok: false, message: "Invalid request." };
    const { supabase } = await requireAdmin();
    const { data: post } = await supabase.from("blog_posts").select("cover_image").eq("id", id).maybeSingle();
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) return failure(error, "delete post");
    await removeOwnedMedia(supabase, [post?.cover_image]);
    revalidateContent();
    return { ok: true, message: "Post deleted.", redirectTo: adminPath("blog") };
  } catch (error) {
    return failure(error, "delete post");
  }
}
