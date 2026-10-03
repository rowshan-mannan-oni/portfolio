import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { BlogForm } from "@/components/admin/forms/blog-form";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { deleteBlogPost, saveBlogPost } from "@/lib/admin/actions/blog";
import { adminDb } from "@/lib/admin/page-data";
import { adminPath } from "@/lib/admin/routes";
import { isUuid } from "@/lib/admin/server-utils";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const db = await adminDb();
  const { data: post, error } = await db.from("blog_posts").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!post) notFound();

  return (
    <>
      <PageHeader
        title={post.title}
        back={{ href: adminPath("blog"), label: "Blog" }}
        actions={
          <ConfirmAction
            action={deleteBlogPost.bind(null, post.id)}
            className="btn btn-ghost btn-sm text-danger"
            confirmTitle="Delete this post?"
            confirmBody="The post and its cover image will be permanently deleted."
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete
          </ConfirmAction>
        }
      />
      {/* key: remount after save so uncontrolled fields reflect stored values */}
      <BlogForm key={post.updated_at} post={post} action={saveBlogPost.bind(null, post.id)} />
    </>
  );
}
