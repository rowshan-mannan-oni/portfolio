import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { MediaLibrary, type LibraryFile } from "@/components/admin/media-library";
import { adminDb } from "@/lib/admin/page-data";
import { MEDIA_BUCKET } from "@/lib/storage";

export const metadata: Metadata = { title: "Media library" };

export default async function MediaPage() {
  const db = await adminDb();
  const { data, error } = await db.storage
    .from(MEDIA_BUCKET)
    .list("library", { limit: 200, sortBy: { column: "created_at", order: "desc" } });
  if (error) throw error;

  const files: LibraryFile[] = (data ?? [])
    .filter((f) => f.id && f.name !== ".emptyFolderPlaceholder")
    .map((f) => ({
      path: `library/${f.name}`,
      name: f.name,
      size: typeof f.metadata?.size === "number" ? f.metadata.size : null,
      createdAt: f.created_at ?? null,
    }));

  return (
    <>
      <PageHeader
        title="Media library"
        description="Shared images for blog posts and descriptions. Images attached to projects, posts and your profile are managed on their own pages and cleaned up automatically."
      />
      <MediaLibrary files={files} />
    </>
  );
}
