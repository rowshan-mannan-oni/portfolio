"use client";

import { useId, useState } from "react";
import { X } from "lucide-react";
import { useAdminForm } from "@/components/admin/admin-form";
import { cn } from "@/lib/utils";

type BaseProps = {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  /** Span both columns of a FormSection grid. */
  wide?: boolean;
};

export function FieldShell({
  name,
  label,
  hint,
  required,
  wide,
  htmlFor,
  children,
}: BaseProps & { htmlFor: string; children: React.ReactNode }) {
  const { errors } = useAdminForm();
  const error = errors[name];
  return (
    <div className={cn(wide && "sm:col-span-2")}>
      <label htmlFor={htmlFor} className="field-label">
        {label}
        {required ? (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1.5 text-xs font-normal text-subtle">optional</span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function useFieldIds(name: string) {
  const id = `${useId()}-${name}`;
  const { errors } = useAdminForm();
  const invalid = Boolean(errors[name]);
  return { id, invalid, describedBy: invalid ? `${id}-error` : `${id}-hint` };
}

export function TextField({
  defaultValue,
  type = "text",
  placeholder,
  maxLength,
  inputMode,
  ...props
}: BaseProps & {
  defaultValue?: string | number | null;
  type?: "text" | "url" | "email" | "number";
  placeholder?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const { id, invalid, describedBy } = useFieldIds(props.name);
  return (
    <FieldShell {...props} htmlFor={id}>
      <input
        id={id}
        name={props.name}
        type={type === "url" ? "text" : type}
        inputMode={type === "url" ? "url" : inputMode}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder ?? (type === "url" ? "https://" : undefined)}
        maxLength={maxLength}
        required={props.required}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="input"
        autoComplete="off"
      />
    </FieldShell>
  );
}

export function TextAreaField({
  defaultValue,
  rows = 4,
  placeholder,
  maxLength,
  ...props
}: BaseProps & { defaultValue?: string | null; rows?: number; placeholder?: string; maxLength?: number }) {
  const { id, invalid, describedBy } = useFieldIds(props.name);
  return (
    <FieldShell {...props} htmlFor={id} wide={props.wide ?? true}>
      <textarea
        id={id}
        name={props.name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="input"
      />
    </FieldShell>
  );
}

/** One item per line — for sentences such as achievements or authors. */
export function ListField({
  defaultValue,
  rows = 4,
  placeholder,
  ...props
}: BaseProps & { defaultValue?: string[] | null; rows?: number; placeholder?: string }) {
  return (
    <TextAreaField
      {...props}
      rows={rows}
      placeholder={placeholder}
      defaultValue={(defaultValue ?? []).join("\n")}
      hint={props.hint ?? "One item per line. Empty lines are ignored."}
    />
  );
}

export function SelectField({
  defaultValue,
  options,
  placeholder = "—",
  ...props
}: BaseProps & {
  defaultValue?: string | null;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
}) {
  const { id, invalid, describedBy } = useFieldIds(props.name);
  return (
    <FieldShell {...props} htmlFor={id}>
      <select
        id={id}
        name={props.name}
        defaultValue={defaultValue ?? ""}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="input"
      >
        {!props.required ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  const id = `${useId()}-${name}`;
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      <div>
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {hint ? (
          <p id={`${id}-hint`} className="text-xs text-subtle">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Chip input for short tokens (technologies, keywords, tags). Enter or comma
 * adds; pasting "a, b, c" adds several. Values are submitted as `name[]`.
 */
export function TagsField({
  defaultValue,
  placeholder = "Type and press Enter",
  ...props
}: BaseProps & { defaultValue?: string[] | null; placeholder?: string }) {
  const { id, invalid, describedBy } = useFieldIds(props.name);
  const [tags, setTags] = useState<string[]>(defaultValue ?? []);
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const incoming = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (incoming.length === 0) return;
    setTags((current) => {
      const lower = new Set(current.map((t) => t.toLowerCase()));
      const next = [...current];
      for (const t of incoming) {
        if (!lower.has(t.toLowerCase())) {
          next.push(t);
          lower.add(t.toLowerCase());
        }
      }
      return next;
    });
    setDraft("");
  };

  return (
    <FieldShell {...props} htmlFor={id} hint={props.hint ?? "Press Enter or comma to add. Backspace removes the last one."}>
      {tags.map((tag) => (
        <input key={tag} type="hidden" name={`${props.name}[]`} value={tag} />
      ))}
      <div
        className={cn(
          "input flex min-h-[2.6rem] flex-wrap items-center gap-1.5 py-1.5",
          invalid && "border-danger",
        )}
        data-field={props.name}
      >
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-soft px-2 py-0.5 text-[0.8rem] text-soft-fg">
            {tag}
            <button
              type="button"
              onClick={() => setTags((t) => t.filter((x) => x !== tag))}
              className="rounded text-soft-fg/70 hover:text-danger"
              aria-label={`Remove ${tag}`}
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
              setTags((t) => t.slice(0, -1));
            }
          }}
          onBlur={() => add(draft)}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (text.includes(",") || text.includes("\n")) {
              e.preventDefault();
              add(text.replace(/\n/g, ","));
            }
          }}
          placeholder={tags.length === 0 ? placeholder : ""}
          aria-describedby={describedBy}
          className="min-w-[8rem] flex-1 bg-transparent py-0.5 outline-none placeholder:text-subtle"
        />
      </div>
    </FieldShell>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Year (+ optional month) picker producing "YYYY" or "YYYY-MM". */
export function PartialDateField({ defaultValue, ...props }: BaseProps & { defaultValue?: string | null }) {
  const { id, invalid, describedBy } = useFieldIds(props.name);
  const [initialYear, initialMonth] = (defaultValue ?? "").split("-");
  const [year, setYear] = useState(initialYear ?? "");
  const [month, setMonth] = useState(initialMonth ?? "");
  const value = /^\d{4}$/.test(year) ? (month ? `${year}-${month}` : year) : year ? year : "";

  return (
    <FieldShell {...props} htmlFor={id} hint={props.hint ?? "Year only is fine when the month is unknown."}>
      <input type="hidden" name={props.name} value={value} />
      <div className="flex gap-2" data-field={props.name}>
        <select
          aria-label={`${props.label} month`}
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="input w-28"
          disabled={!year}
        >
          <option value="">Month</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={String(i + 1).padStart(2, "0")}>
              {m}
            </option>
          ))}
        </select>
        <input
          id={id}
          value={year}
          onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="Year"
          inputMode="numeric"
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className="input w-28"
        />
      </div>
    </FieldShell>
  );
}
