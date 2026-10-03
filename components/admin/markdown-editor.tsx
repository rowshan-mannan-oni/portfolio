"use client";

import { useId, useState } from "react";
import { Markdown } from "@/components/markdown";
import { useAdminForm } from "@/components/admin/admin-form";
import { cn, readingTime } from "@/lib/utils";

type Props = {
  name: string;
  label: string;
  defaultValue?: string | null;
  rows?: number;
  hint?: string;
  required?: boolean;
  /** Render the preview with article typography. */
  article?: boolean;
};

/** Markdown textarea with Write / Preview tabs (side by side on wide screens). */
export function MarkdownEditor({ name, label, defaultValue, rows = 14, hint, required, article = false }: Props) {
  const id = `${useId()}-${name}`;
  const { errors } = useAdminForm();
  const [value, setValue] = useState(defaultValue ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const error = errors[name];

  return (
    <div className="sm:col-span-2">
      <div className="mb-1.5 flex flex-wrap items-end justify-between gap-2">
        <label htmlFor={id} className="field-label mb-0">
          {label}
          {required ? null : <span className="ml-1.5 text-xs font-normal text-subtle">optional</span>}
        </label>
        <div className="flex items-center gap-3">
          {article ? <span className="meta">{value.trim() ? `${readingTime(value)} min read` : ""}</span> : null}
          <div role="tablist" aria-label={`${label} mode`} className="flex rounded-lg border border-border p-0.5 xl:hidden">
            {(["write", "preview"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium capitalize",
                  tab === t ? "bg-soft text-soft-fg" : "text-muted hover:text-fg",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <textarea
          id={id}
          name={name}
          rows={rows}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={Boolean(error)}
          className={cn("input font-mono text-[0.85rem] leading-relaxed", tab === "preview" && "hidden xl:block")}
          spellCheck
        />
        <div
          className={cn(
            "min-h-40 overflow-auto rounded-[10px] border border-dashed border-border-strong bg-surface p-5",
            tab === "write" && "hidden xl:block",
          )}
          aria-label="Preview"
        >
          {value.trim() ? (
            <Markdown size={article ? "base" : "sm"}>{value}</Markdown>
          ) : (
            <p className="text-sm text-subtle">Nothing to preview yet.</p>
          )}
        </div>
      </div>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : (
        <p className="field-hint">
          {hint ?? "Markdown: **bold**, _italic_, [links](https://…), lists, `code`, tables. HTML is not rendered."}
        </p>
      )}
    </div>
  );
}
