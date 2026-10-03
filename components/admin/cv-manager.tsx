"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, FileText, Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { removeCv, setCv, setCvVisible } from "@/lib/admin/actions/settings";
import { uploadFile, validatePdf } from "@/lib/admin/upload";
import { DOCUMENTS_BUCKET, storageUrl } from "@/lib/storage";
import { formatDateTime } from "@/lib/format/date";
import { StatusPill } from "@/components/admin/row-actions";

type Props = {
  path: string | null;
  fileName: string | null;
  updatedAt: string | null;
  visible: boolean;
};

export function CvManager({ path, fileName, updatedAt, visible }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const url = storageUrl(path, DOCUMENTS_BUCKET);

  async function handleFile(file: File) {
    const problem = await validatePdf(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setProgress(0);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      const random = crypto.randomUUID().slice(0, 8);
      const { path: newPath } = await uploadFile(DOCUMENTS_BUCKET, `cv/${stamp}-${random}.pdf`, file, setProgress);
      const result = await setCv(newPath, file.name);
      if (result.ok) {
        toast.success(path ? "CV replaced. The previous file was removed." : "CV uploaded.");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <section className="card p-5 sm:p-6">
        <h2 className="text-[0.95rem] font-semibold">Current CV</h2>
        {path && url ? (
          <div className="mt-4 flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-soft text-soft-fg">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{fileName ?? "CV.pdf"}</p>
              <p className="text-sm text-muted">Updated {formatDateTime(updatedAt) ?? "—"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {visible ? <StatusPill tone="primary">Download button shown</StatusPill> : <StatusPill tone="muted">Hidden</StatusPill>}
              <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                Open
              </a>
            </div>
          </div>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-border-strong p-5 text-sm text-muted">
            No CV uploaded. The “Download CV” buttons are hidden until you upload one.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            id="cv-upload"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => inputRef.current?.click()}
            disabled={progress !== null}
          >
            {progress !== null ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                <span aria-live="polite">Uploading {progress}%</span>
              </>
            ) : path ? (
              <>
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Replace PDF
              </>
            ) : (
              <>
                <Upload className="size-3.5" aria-hidden="true" />
                Upload PDF
              </>
            )}
          </button>
          {path ? (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const r = await setCvVisible(!visible);
                    if (r.ok) {
                      toast.success(r.message);
                      router.refresh();
                    } else toast.error(r.message);
                  })
                }
              >
                {visible ? <EyeOff className="size-3.5" aria-hidden="true" /> : <Eye className="size-3.5" aria-hidden="true" />}
                {visible ? "Hide download button" : "Show download button"}
              </button>
              <ConfirmAction
                action={removeCv}
                className="btn btn-ghost btn-sm text-danger"
                confirmTitle="Remove the CV?"
                confirmBody="The PDF is deleted from storage and all download buttons disappear."
                confirmLabel="Remove"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Remove
              </ConfirmAction>
            </>
          ) : null}
        </div>
        <p className="field-hint mt-3">PDF only, up to 10 MB. Replacing deletes the previous file automatically.</p>
      </section>
    </div>
  );
}
