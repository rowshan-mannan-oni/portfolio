"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { BlogPostRow } from "@/types/database";
import type { ActionResult } from "@/lib/admin/action-result";
import { AdminForm, FormSection } from "@/components/admin/admin-form";
import { CheckboxField, FieldShell, TagsField, TextAreaField, TextField } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/image-field";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { StatusPill } from "@/components/admin/row-actions";
import { slugify } from "@/lib/utils";

type Props = { post: BlogPostRow | null; action: (fd: FormData) => Promise<ActionResult> };

/** datetime-local wants "YYYY-MM-DDTHH:mm" in local time. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function BlogForm({ post, action }: Props) {
  const [slug, setSlug] = useState(post?.slug ?? "");
  // Existing posts keep their slug unless it is edited explicitly.
  const [slugManual, setSlugManual] = useState(Boolean(post));
  const [publishedLocal, setPublishedLocal] = useState(toLocalInput(post?.published_at));
  const publishedIso = publishedLocal ? new Date(publishedLocal).toISOString() : "";
  const isPublished = post?.status === "published";

  return (
    <AdminForm
      action={action}
      submitLabel={isPublished ? "Update" : "Save draft"}
      stickyFooter
      secondaryActions={
        <>
          {post && isPublished ? (
            <Link href={`/blog/${post.slug}`} target="_blank" className="btn btn-ghost btn-sm">
              View live <ExternalLink className="size-3.5" aria-hidden="true" />
            </Link>
          ) : null}
          {isPublished ? (
            <button type="submit" name="intent" value="unpublish" className="btn btn-secondary">
              Unpublish
            </button>
          ) : (
            <button type="submit" name="intent" value="publish" className="btn btn-secondary">
              Publish
            </button>
          )}
        </>
      }
    >
      <input type="hidden" name="slug_manual" value={slugManual ? "true" : "false"} />
      <input type="hidden" name="published_at" value={publishedIso} />

      <FormSection title="Article">
        <FieldShell name="title" label="Title" required htmlFor="post-title" wide>
          <input
            id="post-title"
            name="title"
            defaultValue={post?.title ?? ""}
            maxLength={200}
            required
            className="input text-lg"
            onChange={(e) => {
              if (!slugManual) setSlug(slugify(e.target.value));
            }}
          />
        </FieldShell>
        <FieldShell
          name="slug"
          label="URL slug"
          required
          htmlFor="post-slug"
          wide
          hint={`/blog/${slug || "…"}${post ? " — changing it breaks existing links." : ""}`}
        >
          <input
            id="post-slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlugManual(true);
              setSlug(e.target.value);
            }}
            maxLength={80}
            required
            className="input font-mono text-sm"
          />
        </FieldShell>
        <TextAreaField name="excerpt" label="Excerpt" defaultValue={post?.excerpt} rows={2} maxLength={500} hint="Shown on cards and used as the default description." />
        <MarkdownEditor name="content" label="Content" defaultValue={post?.content} rows={22} article required />
      </FormSection>

      <FormSection title="Cover & tags">
        <ImageField
          name="cover_image"
          label="Cover image"
          folder={`blog/${post?.id ?? "drafts"}`}
          defaultValue={post?.cover_image}
          altName="cover_image_alt"
          altDefaultValue={post?.cover_image_alt}
          hint="Optional. Posts without a cover look intentional too."
        />
        <TagsField name="tags" label="Tags" defaultValue={post?.tags} wide hint="Lowercase, up to 12." />
      </FormSection>

      <FormSection title="Publishing">
        <div className="flex items-center gap-2 sm:col-span-2">
          <span className="text-sm text-muted">Status:</span>
          {isPublished ? <StatusPill tone="primary">Published</StatusPill> : <StatusPill tone="muted">Draft</StatusPill>}
        </div>
        <FieldShell
          name="published_at"
          label="Publication date"
          htmlFor="post-date"
          hint="Leave empty to use the moment you publish. A future date schedules the post."
        >
          <input
            id="post-date"
            type="datetime-local"
            value={publishedLocal}
            onChange={(e) => setPublishedLocal(e.target.value)}
            className="input"
          />
        </FieldShell>
        <div className="flex items-end pb-2">
          <CheckboxField name="featured" label="Feature this post" defaultChecked={post?.featured ?? false} />
        </div>
      </FormSection>

      <FormSection title="SEO" description="Optional overrides for search engines and link previews.">
        <TextField name="seo_title" label="SEO title" defaultValue={post?.seo_title} maxLength={70} wide />
        <TextAreaField name="seo_description" label="SEO description" defaultValue={post?.seo_description} rows={2} maxLength={200} />
      </FormSection>
    </AdminForm>
  );
}
