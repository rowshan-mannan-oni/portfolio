"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Scissors, Trash2, Upload, Wand2 } from "lucide-react";
import { useAdminForm } from "@/components/admin/admin-form";
import { discardUpload } from "@/lib/admin/actions/settings";
import { removeBackground, type RemovalStage } from "@/lib/admin/remove-background";
import { buildPath, uploadFile, validateImage } from "@/lib/admin/upload";
import { MEDIA_BUCKET, storageUrl } from "@/lib/storage";

type Props = {
  name: string;
  defaultValue: string | null;
  /** The saved profile photo, offered as the default source. */
  photoPath: string | null;
};

function describe(stage: RemovalStage | { stage: "uploading"; percent: number }): string {
  switch (stage.stage) {
    case "loading-model":
      return stage.percent === null
        ? "Loading the background-removal model…"
        : `Downloading model (first time only) — ${stage.percent}%`;
    case "processing":
      return "Removing the background…";
    case "encoding":
      return "Preparing the cutout…";
    case "uploading":
      return `Uploading — ${stage.percent}%`;
  }
}

/**
 * Transparent cutout for the hero. Either generate it automatically from the
 * profile photo (or any other photo) in the browser, or upload a ready-made
 * transparent PNG/WebP.
 */
export function CutoutField({ name, defaultValue, photoPath }: Props) {
  const { errors } = useAdminForm();
  const [path, setPath] = useState<string | null>(defaultValue);
  const [sessionUpload, setSessionUpload] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const autoInput = useRef<HTMLInputElement>(null);
  const directInput = useRef<HTMLInputElement>(null);
  const busy = status !== null;
  const preview = storageUrl(path);
  const photoUrl = storageUrl(photoPath);

  async function store(file: File) {
    const { path: newPath } = await uploadFile(MEDIA_BUCKET, buildPath("profile", file, "cutout"), file, (percent) =>
      setStatus(describe({ stage: "uploading", percent })),
    );
    if (sessionUpload) void discardUpload(sessionUpload);
    setSessionUpload(newPath);
    setPath(newPath);
  }

  async function autoCut(source: Blob) {
    try {
      const cutout = await removeBackground(source, (s) => setStatus(describe(s)));
      if (cutout.size > 5 * 1024 * 1024) throw new Error("The cutout is larger than 5 MB. Try a smaller photo.");
      await store(cutout);
      toast.success("Background removed. Save the form to apply it.");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Background removal failed.");
    } finally {
      setStatus(null);
    }
  }

  async function fromProfilePhoto() {
    if (!photoUrl) return;
    setStatus("Fetching your profile photo…");
    try {
      const res = await fetch(photoUrl);
      if (!res.ok) throw new Error("Could not load the profile photo.");
      await autoCut(await res.blob());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load the profile photo.");
      setStatus(null);
    }
  }

  async function onAutoFile(file: File) {
    const problem = validateImage(file);
    if (problem) return toast.error(problem);
    setStatus("Starting…");
    await autoCut(file);
  }

  async function onDirectFile(file: File) {
    if (!["image/png", "image/webp"].includes(file.type)) {
      return toast.error("A cutout needs transparency: upload a PNG or WebP.");
    }
    const problem = validateImage(file);
    if (problem) return toast.error(problem);
    try {
      setStatus("Uploading…");
      await store(file);
      toast.success("Uploaded. Save the form to apply it.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setStatus(null);
    }
  }

  function remove() {
    if (sessionUpload && sessionUpload === path) {
      void discardUpload(sessionUpload);
      setSessionUpload(null);
    }
    setPath(null);
  }

  return (
    <div className="sm:col-span-2">
      <p className="field-label">
        Cutout image
        <span className="ml-1.5 text-xs font-normal text-subtle">used by the “cutout with text” style</span>
      </p>
      <input type="hidden" name={name} value={path ?? ""} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Checkerboard shows transparency */}
        <div
          className="relative aspect-[4/5] w-32 shrink-0 overflow-hidden rounded-lg border border-border"
          style={{
            backgroundColor: "#fff",
            backgroundImage:
              "linear-gradient(45deg,#e8e8e8 25%,transparent 25%),linear-gradient(-45deg,#e8e8e8 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e8e8e8 75%),linear-gradient(-45deg,transparent 75%,#e8e8e8 75%)",
            backgroundSize: "14px 14px",
            backgroundPosition: "0 0,0 7px,7px -7px,-7px 0",
          }}
        >
          {preview ? (
            <Image src={preview} alt="" fill sizes="128px" className="object-contain object-bottom" />
          ) : (
            <div className="grid size-full place-items-center text-subtle">
              <Scissors className="size-6" aria-hidden="true" />
            </div>
          )}
          {busy ? (
            <div className="absolute inset-0 grid place-items-center bg-surface/80">
              <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={fromProfilePhoto}
              disabled={busy || !photoUrl}
              title={photoUrl ? undefined : "Upload and save a profile photo first"}
            >
              <Wand2 className="size-3.5" aria-hidden="true" />
              Remove background from profile photo
            </button>
            <input
              ref={autoInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onAutoFile(f);
                e.target.value = "";
              }}
            />
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => autoInput.current?.click()} disabled={busy}>
              <Wand2 className="size-3.5" aria-hidden="true" />
              Choose another photo…
            </button>
            <input
              ref={directInput}
              type="file"
              accept="image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onDirectFile(f);
                e.target.value = "";
              }}
            />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => directInput.current?.click()} disabled={busy}>
              <Upload className="size-3.5" aria-hidden="true" />
              Upload transparent PNG
            </button>
            {path ? (
              <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={remove} disabled={busy}>
                <Trash2 className="size-3.5" aria-hidden="true" />
                Remove
              </button>
            ) : null}
          </div>
          {busy ? (
            <p className="text-sm text-primary" aria-live="polite">
              {status}
            </p>
          ) : errors[name] ? (
            <p className="field-error" role="alert">
              {errors[name]}
            </p>
          ) : (
            <p className="field-hint">
              Background removal runs in your browser — the photo isn&rsquo;t sent anywhere. The first run downloads a
              ~25&nbsp;MB model; later runs are instant. Portraits with a clear outline work best.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
