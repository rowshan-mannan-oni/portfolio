"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Trash2, Upload } from "lucide-react";
import type { ProjectImageRow } from "@/types/database";
import { ActionButton, ConfirmAction } from "@/components/admin/confirm-action";
import {
  addProjectImages,
  deleteProjectImage,
  moveProjectImage,
  updateProjectImage,
} from "@/lib/admin/actions/project-images";
import { buildPath, uploadFile, validateImage } from "@/lib/admin/upload";
import { MEDIA_BUCKET, storageUrl } from "@/lib/storage";

/** Screenshot gallery: upload several, edit alt/caption, reorder, delete. */
export function ProjectImagesManager({ projectId, images }: { projectId: string; images: ProjectImageRow[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    const list = Array.from(files).slice(0, 10);
    const valid = list.filter((f) => {
      const problem = validateImage(f);
      if (problem) toast.error(`${f.name}: ${problem}`);
      return !problem;
    });
    if (valid.length === 0) return;
    const uploaded: string[] = [];
    try {
      for (const [i, file] of valid.entries()) {
        setProgress(`Uploading ${i + 1} of ${valid.length}…`);
        const { path } = await uploadFile(
          MEDIA_BUCKET,
          buildPath(`projects/${projectId}`, file, file.name.replace(/\.[^.]+$/, "")),
          file,
          (p) => setProgress(`Uploading ${i + 1} of ${valid.length} — ${p}%`),
        );
        uploaded.push(path);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    }
    if (uploaded.length > 0) {
      const result = await addProjectImages(projectId, uploaded);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    }
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="gallery-heading">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="gallery-heading" className="text-[0.95rem] font-semibold">
            Screenshots
          </h2>
          <p className="mt-1 text-sm text-muted">Shown inside “Project details” with a lightbox. Changes save immediately.</p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            className="sr-only"
            id="gallery-upload"
            onChange={(e) => e.target.files && void handleFiles(e.target.files)}
          />
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => inputRef.current?.click()} disabled={progress !== null}>
            {progress ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Upload className="size-3.5" aria-hidden="true" />}
            {progress ?? "Add screenshots"}
          </button>
        </div>
      </div>

      {images.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-strong p-6 text-center text-sm text-muted">
          No screenshots yet — the project still looks complete without them.
        </p>
      ) : (
        <ul className="space-y-3">
          {images.map((img, i) => (
            <ImageRow key={img.id} image={img} isFirst={i === 0} isLast={i === images.length - 1} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ImageRow({ image, isFirst, isLast }: { image: ProjectImageRow; isFirst: boolean; isLast: boolean }) {
  const router = useRouter();
  const [alt, setAlt] = useState(image.alt_text ?? "");
  const [caption, setCaption] = useState(image.caption ?? "");
  const [pending, startTransition] = useTransition();
  const dirty = alt !== (image.alt_text ?? "") || caption !== (image.caption ?? "");
  const url = storageUrl(image.path);

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center">
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-md bg-surface-muted sm:w-32">
        {url ? <Image src={url} alt="" fill sizes="128px" className="object-cover" /> : null}
      </div>
      <div className="grid flex-1 gap-2 sm:grid-cols-2">
        <label className="text-xs text-muted">
          Alt text
          <input value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} className="input mt-1" placeholder="What the screenshot shows" />
        </label>
        <label className="text-xs text-muted">
          Caption
          <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={300} className="input mt-1" />
        </label>
      </div>
      <div className="flex items-center gap-0.5 self-end sm:self-center">
        {dirty ? (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const r = await updateProjectImage(image.id, alt, caption);
                if (r.ok) {
                  toast.success(r.message);
                  router.refresh();
                } else toast.error(r.message);
              })
            }
          >
            Save
          </button>
        ) : null}
        <ActionButton action={moveProjectImage.bind(null, image.id, "up")} label="Move image up" className="btn btn-ghost btn-icon size-8 min-h-8" disabled={isFirst}>
          <ArrowUp className="size-4" aria-hidden="true" />
        </ActionButton>
        <ActionButton action={moveProjectImage.bind(null, image.id, "down")} label="Move image down" className="btn btn-ghost btn-icon size-8 min-h-8" disabled={isLast}>
          <ArrowDown className="size-4" aria-hidden="true" />
        </ActionButton>
        <ConfirmAction
          action={deleteProjectImage.bind(null, image.id)}
          label="Delete image"
          className="btn btn-ghost btn-icon size-8 min-h-8 hover:text-danger"
          confirmTitle="Delete this screenshot?"
          confirmBody="The image file is removed from storage."
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </ConfirmAction>
      </div>
    </li>
  );
}
