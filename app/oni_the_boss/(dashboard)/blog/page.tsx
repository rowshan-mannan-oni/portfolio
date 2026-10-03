import type { Metadata } from "next";
import Link from "next/link";
import { Eye, EyeOff, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/admin/page-header";
import { StatusPill } from "@/components/admin/row-actions";
import { ActionButton, ConfirmAction } from "@/components/admin/confirm-action";
import { deleteBlogPost, setBlogStatus, toggleBlogFeatured } from "@/lib/admin/actions/blog";
import { adminDb } from "@/lib/admin/page-data";
import { adminPath } from "@/lib/admin/routes";
import { formatDateTime } from "@/lib/format/date";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Blog" };

/** Publication dates in the future mean the post is scheduled. */
function isFuture(iso: string | null): boolean {
  return iso !== null && Date.parse(iso) > Date.now();
}

type Props = { searchParams: Promise<{ status?: string; q?: string }> };

export default async function BlogAdminPage({ searchParams }: Props) {
  const { status = "all", q = "" } = await searchParams;
  const db = await adminDb();

  let query = db
    .from("blog_posts")
    .select("id, title, slug, status, featured, published_at, updated_at, tags")
    .order("updated_at", { ascending: false });
  if (status === "draft" || status === "published") query = query.eq("status", status);
  const search = q.trim().slice(0, 100);
  if (search) query = query.ilike("title", `%${search.replace(/[%_,()]/g, " ")}%`);
  const { data: posts, error } = await query;
  if (error) throw error;

  const tabs = [
    { key: "all", label: "All" },
    { key: "draft", label: "Drafts" },
    { key: "published", label: "Published" },
  ];
  const iconBtn = "btn btn-ghost btn-icon size-8 min-h-8";

  return (
    <>
      <PageHeader
        title="Blog"
        description="Write in Markdown, preview, then publish. Drafts are never visible publicly."
        actions={
          <Link href={adminPath("blog", "new")} className="btn btn-primary btn-sm">
            <Plus className="size-4" aria-hidden="true" />
            New post
          </Link>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Filter" className="flex gap-1">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`?status=${t.key}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
              aria-current={status === t.key ? "page" : undefined}
              className={cn("rounded-lg px-3 py-1.5 text-sm", status === t.key ? "bg-soft font-medium text-soft-fg" : "text-muted hover:bg-surface")}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <form role="search" className="relative sm:w-64">
          <input type="hidden" name="status" value={status} />
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
          <label htmlFor="blog-search" className="sr-only">
            Search posts
          </label>
          <input id="blog-search" name="q" defaultValue={search} placeholder="Search posts…" className="input pl-9" />
        </form>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          title={search || status !== "all" ? "No posts match this filter." : "No blog posts yet — write your first article."}
          action={
            <Link href={adminPath("blog", "new")} className="btn btn-primary btn-sm">
              <Plus className="size-4" aria-hidden="true" />
              New post
            </Link>
          }
        />
      ) : (
        <ul className="card divide-y divide-border overflow-hidden">
          {posts.map((post) => {
            const scheduled = post.status === "published" && isFuture(post.published_at);
            return (
              <li key={post.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={adminPath("blog", post.id)} className="font-medium hover:text-primary">
                      {post.title}
                    </Link>
                    {post.status === "draft" ? <StatusPill tone="muted">Draft</StatusPill> : null}
                    {scheduled ? <StatusPill tone="warning">Scheduled</StatusPill> : null}
                    {post.status === "published" && !scheduled ? <StatusPill tone="primary">Published</StatusPill> : null}
                    {post.featured ? <StatusPill tone="primary">Featured</StatusPill> : null}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted">
                    /blog/{post.slug} · updated {formatDateTime(post.updated_at)}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-0.5">
                  <ActionButton
                    action={toggleBlogFeatured.bind(null, post.id)}
                    label={post.featured ? "Unfeature post" : "Feature post"}
                    className={cn(iconBtn, post.featured && "text-warning")}
                  >
                    <Star className="size-4" aria-hidden="true" fill={post.featured ? "currentColor" : "none"} />
                  </ActionButton>
                  <ActionButton
                    action={setBlogStatus.bind(null, post.id, post.status === "published" ? "draft" : "published")}
                    label={post.status === "published" ? "Unpublish" : "Publish"}
                    className={iconBtn}
                  >
                    {post.status === "published" ? <Eye className="size-4" aria-hidden="true" /> : <EyeOff className="size-4 text-subtle" aria-hidden="true" />}
                  </ActionButton>
                  <Link href={adminPath("blog", post.id)} className={iconBtn} aria-label={`Edit “${post.title}”`} title="Edit">
                    <Pencil className="size-4" aria-hidden="true" />
                  </Link>
                  <ConfirmAction
                    action={deleteBlogPost.bind(null, post.id)}
                    label={`Delete “${post.title}”`}
                    className={cn(iconBtn, "hover:text-danger")}
                    confirmTitle="Delete this post?"
                    confirmBody={`“${post.title}” and its cover image will be permanently deleted.`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </ConfirmAction>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
