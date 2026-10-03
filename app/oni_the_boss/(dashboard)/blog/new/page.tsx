import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { BlogForm } from "@/components/admin/forms/blog-form";
import { saveBlogPost } from "@/lib/admin/actions/blog";
import { adminDb } from "@/lib/admin/page-data";
import { adminPath } from "@/lib/admin/routes";

export const metadata: Metadata = { title: "New post" };

export default async function NewPostPage() {
  await adminDb();
  return (
    <>
      <PageHeader title="New post" back={{ href: adminPath("blog"), label: "Blog" }} />
      <BlogForm post={null} action={saveBlogPost.bind(null, null)} />
    </>
  );
}
