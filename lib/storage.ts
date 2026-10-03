import { SUPABASE_URL } from "@/lib/env";

export const MEDIA_BUCKET = "media";
export const DOCUMENTS_BUCKET = "documents";
export type Bucket = typeof MEDIA_BUCKET | typeof DOCUMENTS_BUCKET;

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PDF_BYTES = 10 * 1024 * 1024;

/**
 * Folders inside the media bucket. Files in an entity folder belong to that
 * entity and are removed with it; files in "library" are shared and are never
 * deleted automatically.
 */
export const MEDIA_FOLDERS = [
  "profile",
  "site",
  "projects",
  "research",
  "publications",
  "experience",
  "education",
  "awards",
  "blog",
  "library",
] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

/** Public URL for a stored object, or null when the path is empty. */
export function storageUrl(path: string | null | undefined, bucket: Bucket = MEDIA_BUCKET): string | null {
  if (!path || !SUPABASE_URL) return null;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encoded}`;
}

/** Storage paths created by this app: folder/sub/name.ext, no traversal. */
export function isSafeStoragePath(path: string): boolean {
  return (
    path.length > 0 &&
    path.length <= 512 &&
    /^[a-z0-9][a-z0-9/_\-.]*$/i.test(path) &&
    !path.includes("..") &&
    !path.includes("//")
  );
}

/** Whether a path is owned by an entity folder (and may be cleaned up). */
export function isOwnedMediaPath(path: string | null | undefined): path is string {
  if (!path || !isSafeStoragePath(path)) return false;
  const folder = path.split("/")[0];
  return folder !== "library" && (MEDIA_FOLDERS as readonly string[]).includes(folder);
}
