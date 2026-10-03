"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2, Upload } from "lucide-react";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { CopyButton } from "@/components/public/copy-button";
import { deleteLibraryFile } from "@/lib/admin/actions/media";
import { buildPath, uploadFile, validateImage } from "@/lib/admin/upload";
import { MEDIA_BUCKET, storageUrl } from "@/lib/storage";

export type LibraryFile = { path: string; name: string; size: number | null; createdAt: string | null };

/** Shared images for use inside blog posts and long descriptions. */
export function MediaLibrary({ files }: { files: LibraryFile[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleFiles(list: FileList) {
    const valid = Array.from(list)
      .slice(0, 10)
      .filter((f) => {
        const problem = validateImage(f);
        if (problem) toast.error(`${f.name}: ${problem}`);
        return !problem;
      });
    let done = 0;
    for (const [i, file] of valid.entries()) {
      try {
        await uploadFile(MEDIA_BUCKET, buildPath("library", file, file.name.replace(/\.[^.]+$/, "")), file, (p) =>
          setStatus(`Uploading ${i + 1} of ${valid.length} — ${p}%`),
        );
        done++;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed.");
      }
    }
    if (done > 0) toast.success(done === 1 ? "Image uploaded." : `${done} images uploaded.`);
    setStatus(null);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="sr-only"
          id="library-upload"
          onChange={(e) => e.target.files && void handleFiles(e.target.files)}
        />
        <button type="button" className="btn btn-primary btn-sm" onClick={() => inputRef.current?.click()} disabled={status !== null}>
          {status ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Upload className="size-3.5" aria-hidden="true" />}
          <span aria-live="polite">{status ?? "Upload images"}</span>
        </button>
        <p className="text-sm text-muted">Copy the Markdown snippet and paste it into a blog post.</p>
      </div>

      {files.length === 0 ? (
        <p className="card p-8 text-center text-sm text-muted">No shared images yet.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => {
            const url = storageUrl(file.path);
            if (!url) return null;
            return (
              <li key={file.path} className="card overflow-hidden">
                <div className="relative aspect-[16/10] bg-surface-muted">
                  <Image src={url} alt="" fill sizes="(min-width: 1024px) 320px, 50vw" className="object-contain" />
                </div>
                <div className="space-y-2 p-3">
                  <p className="truncate font-mono text-xs text-muted" title={file.name}>
                    {file.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4">
                    <CopyButton text={`![Describe the image](${url})`} label="Copy Markdown" />
                    <CopyButton text={url} label="Copy URL" />
                    <span className="flex-1" />
                    <ConfirmAction
                      action={deleteLibraryFile.bind(null, file.path)}
                      label={`Delete ${file.name}`}
                      className="btn btn-ghost btn-icon size-8 min-h-8 hover:text-danger"
                      confirmTitle="Delete this image?"
                      confirmBody="Any post that embeds it will show its alt text instead."
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </ConfirmAction>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
