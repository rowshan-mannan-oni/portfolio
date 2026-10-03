"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImageIcon, RefreshCw, Trash2, Upload } from "lucide-react";
import { useAdminForm } from "@/components/admin/admin-form";
import { discardUpload } from "@/lib/admin/actions/settings";
import { buildPath, uploadFile, validateImage } from "@/lib/admin/upload";
import { MEDIA_BUCKET, storageUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  label: string;
  /** Storage folder, e.g. "projects/<id>" or "profile". */
  folder: string;
  defaultValue?: string | null;
  hint?: string;
  aspect?: "square" | "portrait" | "landscape";
  /** Optional companion alt-text input. */
  altName?: string;
  altDefaultValue?: string | null;
  wide?: boolean;
};

/**
 * Image upload with preview, progress, replace and remove. The selected
 * storage path is submitted with the form; the server deletes the previous
 * file after a successful save. Files uploaded but replaced before saving are
 * discarded right away so storage doesn't fill with orphans.
 */
export function ImageField({
  name,
  label,
  folder,
  defaultValue,
  hint,
  aspect = "landscape",
  altName,
  altDefaultValue,
  wide = true,
}: Props) {
  const { errors } = useAdminForm();
  const inputRef = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState<string | null>(defaultValue ?? null);
  const [uploadedThisSession, setUploadedThisSession] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const preview = storageUrl(path);
  const error = errors[name];

  async function handleFile(file: File) {
    const problem = validateImage(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setProgress(0);
    try {
      const { path: newPath } = await uploadFile(MEDIA_BUCKET, buildPath(folder, file, file.name.replace(/\.[^.]+$/, "")), file, setProgress);
      if (uploadedThisSession) void discardUpload(uploadedThisSession);
      setUploadedThisSession(newPath);
      setPath(newPath);
      toast.success("Uploaded. Save the form to apply it.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove() {
    if (uploadedThisSession && uploadedThisSession === path) {
      void discardUpload(uploadedThisSession);
      setUploadedThisSession(null);
    }
    setPath(null);
  }

  const aspectClass = aspect === "square" ? "aspect-square w-32" : aspect === "portrait" ? "aspect-[4/5] w-32" : "aspect-[16/10] w-48";

  return (
    <div className={cn(wide && "sm:col-span-2")}>
      <p className="field-label">
        {label}
        <span className="ml-1.5 text-xs font-normal text-subtle">optional</span>
      </p>
      <input type="hidden" name={name} value={path ?? ""} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className={cn(
            "relative shrink-0 overflow-hidden rounded-lg border border-border bg-surface-muted",
            aspectClass,
          )}
        >
          {preview ? (
            <Image src={preview} alt="" fill sizes="200px" className="object-cover" />
          ) : (
            <div className="texture-dots flex size-full items-center justify-center text-subtle">
              <ImageIcon className="size-6" aria-hidden="true" />
            </div>
          )}
          {progress !== null ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/85">
              <div className="h-1.5 w-3/4 overflow-hidden rounded-full bg-border">
                <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
              </div>
              <span className="meta" aria-live="polite">
                {progress}%
              </span>
            </div>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              className="sr-only"
              id={`${name}-file`}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => inputRef.current?.click()}
              disabled={progress !== null}
            >
              {path ? <RefreshCw className="size-3.5" aria-hidden="true" /> : <Upload className="size-3.5" aria-hidden="true" />}
              {path ? "Replace" : "Upload image"}
            </button>
            {path ? (
              <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={remove} disabled={progress !== null}>
                <Trash2 className="size-3.5" aria-hidden="true" />
                Remove
              </button>
            ) : null}
          </div>
          {altName ? (
            <div>
              <label htmlFor={`${name}-alt`} className="field-label text-xs">
                Alt text
              </label>
              <input
                id={`${name}-alt`}
                name={altName}
                defaultValue={altDefaultValue ?? ""}
                maxLength={300}
                className="input"
                placeholder="Describe the image for screen readers"
              />
            </div>
          ) : null}
          {error ? (
            <p className="field-error" role="alert">
              {error}
            </p>
          ) : (
            <p className="field-hint">{hint ?? "JPEG, PNG, WebP, AVIF or GIF, up to 5 MB."}</p>
          )}
        </div>
      </div>
    </div>
  );
}
