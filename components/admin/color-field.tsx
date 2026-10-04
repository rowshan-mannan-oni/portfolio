"use client";

import { useId, useState } from "react";
import { FieldShell } from "@/components/admin/fields";
import { adaptColor, DARK_BG, LIGHT_BG } from "@/lib/color";

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Optional colour: a native picker plus a hex box. Empty means "use the
 * theme colour", which adapts to light and dark mode automatically.
 */
export function ColorField({
  name,
  label,
  defaultValue,
  hint,
  themeLabel = "theme colour",
}: {
  name: string;
  label: string;
  defaultValue: string | null;
  hint?: string;
  themeLabel?: string;
}) {
  const id = `${useId()}-${name}`;
  const [value, setValue] = useState(defaultValue ?? "");
  const [draft, setDraft] = useState(defaultValue ?? "");
  const valid = HEX.test(value);
  const themed = valid ? adaptColor(value) : null;

  return (
    <FieldShell name={name} label={label} htmlFor={id} hint={hint}>
      <input type="hidden" name={name} value={valid ? value.toLowerCase() : ""} />
      <div className="flex flex-wrap items-center gap-2" data-field={name}>
        <input
          type="color"
          aria-label={`${label} picker`}
          value={valid ? value : "#0f766e"}
          onChange={(e) => {
            setValue(e.target.value);
            setDraft(e.target.value);
          }}
          className="h-10 w-12 cursor-pointer rounded-md border border-border-strong bg-surface p-1"
        />
        <input
          id={id}
          value={draft}
          onChange={(e) => {
            const next = e.target.value.trim();
            setDraft(next);
            const withHash = next.startsWith("#") ? next : `#${next}`;
            if (HEX.test(withHash)) setValue(withHash);
            else if (next === "") setValue("");
          }}
          placeholder={`Empty = ${themeLabel}`}
          maxLength={7}
          className="input w-36 font-mono text-sm"
          aria-invalid={draft !== "" && !HEX.test(draft.startsWith("#") ? draft : `#${draft}`)}
        />
        {value ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setValue("");
              setDraft("");
            }}
          >
            Use {themeLabel}
          </button>
        ) : (
          <span className="text-xs text-subtle">Using {themeLabel}</span>
        )}
      </div>
      {themed ? (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Preview in both themes">
          {[
            { label: "Light mode", bg: LIGHT_BG, fg: themed.light },
            { label: "Dark mode", bg: DARK_BG, fg: themed.dark },
          ].map((p) => (
            <div
              key={p.label}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
              style={{ background: p.bg }}
            >
              <span className="text-lg font-black tracking-tight" style={{ color: p.fg, fontFamily: "var(--font-anton), Impact, sans-serif" }}>
                BUILD
              </span>
              <span className="font-mono text-[0.7rem]" style={{ color: p.fg }}>
                {p.label} · {p.fg}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </FieldShell>
  );
}
