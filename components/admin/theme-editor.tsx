"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bookmark, Check, Loader2, RotateCcw, Sparkles, TriangleAlert, X } from "lucide-react";
import { contrast, isHex } from "@/lib/color";
import { deleteNamedPalette, saveNamedPalette, saveThemePalette } from "@/lib/admin/actions/settings";
import { ConfirmAction } from "@/components/admin/confirm-action";
import {
  CONTRAST_CHECKS,
  DEFAULT_PALETTE,
  THEME_TOKENS,
  generatePalette,
  type ThemeMode,
  type ThemePalette,
  type ThemeToken,
} from "@/lib/theme-palette";
import { cn } from "@/lib/utils";

const PRESETS: Array<{ name: string; brand: string | null }> = [
  { name: "Teal (default)", brand: null },
  { name: "Indigo", brand: "#4f46e5" },
  { name: "Ocean", brand: "#0369a1" },
  { name: "Forest", brand: "#15803d" },
  { name: "Plum", brand: "#9333ea" },
  { name: "Rose", brand: "#e11d48" },
  { name: "Amber", brand: "#d97706" },
];

const GROUPS = ["Backgrounds", "Text", "Brand", "Lines"] as const;
const clone = (p: ThemePalette): ThemePalette => ({ light: { ...p.light }, dark: { ...p.dark } });
const samePalette = (a: ThemePalette, b: ThemePalette) =>
  THEME_TOKENS.every(({ key }) => a.light[key] === b.light[key] && a.dark[key] === b.dark[key]);

export type SavedPalette = { id: string; name: string; palette: ThemePalette };

export function ThemeEditor({ initial, library }: { initial: ThemePalette; library: SavedPalette[] }) {
  const router = useRouter();
  const [saved, setSaved] = useState<ThemePalette>(() => clone(initial));
  const [palette, setPalette] = useState<ThemePalette>(() => clone(initial));
  const [brand, setBrand] = useState(initial.light.primary);
  const [tint, setTint] = useState(true);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");

  const dirty = !samePalette(palette, saved);
  const isDefault = samePalette(palette, DEFAULT_PALETTE);

  const setToken = (mode: ThemeMode, key: ThemeToken, value: string) =>
    setPalette((p) => ({ ...p, [mode]: { ...p[mode], [key]: value.toLowerCase() } }));

  function applyBrand(hex: string | null, tintNeutrals = tint) {
    if (hex === null) {
      setPalette(clone(DEFAULT_PALETTE));
      setBrand(DEFAULT_PALETTE.light.primary);
      return;
    }
    const generated = generatePalette(hex, tintNeutrals);
    if (!generated) return toast.error("Enter a colour like #4f46e5.");
    setPalette(generated);
    setBrand(hex);
  }

  function saveToLibrary() {
    startTransition(async () => {
      const result = await saveNamedPalette(name, palette);
      if (result.ok) {
        setName("");
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function save() {
    startTransition(async () => {
      const result = await saveThemePalette(palette);
      if (result.ok) {
        setSaved(clone(palette));
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Library */}
      <section className="card p-5 sm:p-6" aria-labelledby="library-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Bookmark className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <h2 id="library-heading" className="text-[0.95rem] font-semibold">
                My palettes
              </h2>
              <p className="mt-1 text-sm text-muted">
                Click a palette to load it into the editor. Saving here does not change the site; use
                &ldquo;Publish to site&rdquo; for that.
              </p>
            </div>
          </div>
          <form
            className="flex w-full flex-wrap gap-2 sm:w-auto"
            onSubmit={(e) => {
              e.preventDefault();
              saveToLibrary();
            }}
          >
            <label htmlFor="palette-name" className="sr-only">
              Palette name
            </label>
            <input
              id="palette-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="Name this palette…"
              className="input h-9 min-h-9 min-w-0 flex-1 text-sm sm:w-52 sm:flex-none"
            />
            <button type="submit" className="btn btn-secondary btn-sm" disabled={pending || !name.trim()}>
              Save current
            </button>
          </form>
        </div>

        {library.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border-strong px-4 py-3 text-sm text-muted">
            No saved palettes yet. Generate or tweak one below, then save it here to compare options.
          </p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {library.map((item) => {
              const loaded = samePalette(item.palette, palette);
              const live = samePalette(item.palette, saved);
              return (
                <li key={item.id}>
                  <div
                    className={cn(
                      "flex items-center rounded-full border pr-1 transition-colors",
                      loaded ? "border-primary bg-soft" : "border-border hover:border-border-strong",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setPalette(clone(item.palette))}
                      className="flex items-center gap-2 py-1.5 pl-2 pr-1 text-sm"
                      aria-pressed={loaded}
                      title={`Load “${item.name}” into the editor`}
                    >
                      <Swatches palette={item.palette} />
                      <span className="max-w-[10rem] truncate">{item.name}</span>
                      {live ? (
                        <span className="rounded-full bg-primary px-1.5 text-[0.65rem] font-semibold text-primary-fg">Live</span>
                      ) : null}
                    </button>
                    <ConfirmAction
                      action={() => deleteNamedPalette(item.id)}
                      label={`Delete palette “${item.name}”`}
                      className="grid size-6 place-items-center rounded-full text-subtle hover:bg-danger-soft hover:text-danger"
                      confirmTitle={`Delete “${item.name}”?`}
                      confirmBody="It is removed from your saved palettes. The live site is not affected."
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </ConfirmAction>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Generator */}
      <section className="card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="text-[0.95rem] font-semibold">Start from one colour</h2>
            <p className="mt-1 text-sm text-muted">
              Pick a brand colour and a matching palette is generated for both light and dark mode, with readable
              contrast. Fine-tune any colour below afterwards.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => {
            const swatch = p.brand ?? DEFAULT_PALETTE.light.primary;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => applyBrand(p.brand)}
                className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:border-border-strong"
              >
                <span className="size-3.5 rounded-full ring-1 ring-black/10" style={{ background: swatch }} />
                {p.name}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <ColorInput label="Brand colour" value={brand} onChange={setBrand} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={tint}
              onChange={(e) => setTint(e.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />
            Tint backgrounds and text with this hue
          </label>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyBrand(brand)} disabled={!isHex(brand)}>
            <Sparkles className="size-3.5" aria-hidden="true" />
            Generate palette
          </button>
        </div>
      </section>

      {/* Preview */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-label="Preview">
        {(["light", "dark"] as const).map((mode) => (
          <Preview key={mode} mode={mode} colors={palette[mode]} />
        ))}
      </section>

      {/* Contrast */}
      <section className="card p-5 sm:p-6">
        <h2 className="text-[0.95rem] font-semibold">Readability</h2>
        <p className="mt-1 text-sm text-muted">WCAG contrast ratios. Aim for at least 4.5 for body text and 3 for large text.</p>
        <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-1 md:grid-cols-2">
          {(["light", "dark"] as const).map((mode) => (
            <ul key={mode} className="space-y-1">
              <li className="meta mb-1 capitalize">{mode} mode</li>
              {CONTRAST_CHECKS.map((c) => {
                const ratio = contrast(palette[mode][c.fg], palette[mode][c.bg]);
                const ok = ratio >= c.min;
                return (
                  <li key={c.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className={ok ? "text-muted" : "text-fg"}>{c.label}</span>
                    <span className={cn("inline-flex items-center gap-1 font-mono text-xs", ok ? "text-primary" : "text-warning")}>
                      {ok ? <Check className="size-3.5" aria-hidden="true" /> : <TriangleAlert className="size-3.5" aria-hidden="true" />}
                      {ratio.toFixed(1)}
                      <span className="sr-only">{ok ? " passes" : ` below ${c.min}`}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      </section>

      {/* Tokens */}
      {GROUPS.map((group) => (
        <section key={group} className="card overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 border-b border-border bg-surface-muted/60 px-5 py-2.5 text-xs text-subtle sm:px-6">
            <span className="font-semibold text-fg">{group}</span>
            <span className="w-[9.5rem]">Light mode</span>
            <span className="w-[9.5rem]">Dark mode</span>
          </div>
          <ul className="divide-y divide-border">
            {THEME_TOKENS.filter((t) => t.group === group).map((t) => {
              const changed =
                palette.light[t.key] !== DEFAULT_PALETTE.light[t.key] || palette.dark[t.key] !== DEFAULT_PALETTE.dark[t.key];
              return (
                <li key={t.key} className="grid grid-cols-1 gap-3 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-x-4 sm:px-6">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {t.label}
                      {changed ? (
                        <button
                          type="button"
                          className="text-xs font-normal text-subtle underline-offset-2 hover:text-fg hover:underline"
                          onClick={() => {
                            setToken("light", t.key, DEFAULT_PALETTE.light[t.key]);
                            setToken("dark", t.key, DEFAULT_PALETTE.dark[t.key]);
                          }}
                        >
                          reset
                        </button>
                      ) : null}
                    </p>
                    {"hint" in t ? <p className="text-xs text-subtle">{t.hint}</p> : null}
                  </div>
                  <ColorInput label={`${t.label}, light mode`} value={palette.light[t.key]} onChange={(v) => setToken("light", t.key, v)} />
                  <ColorInput label={`${t.label}, dark mode`} value={palette.dark[t.key]} onChange={(v) => setToken("dark", t.key, v)} />
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {/* Sticky actions */}
      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-2 border-t border-border bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <p className="text-sm text-muted">{dirty ? "Not published yet: the site still shows the previous colours" : "This palette is live on the site"}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setPalette(clone(DEFAULT_PALETTE))}
            disabled={pending || isDefault}
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Default colours
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPalette(clone(saved))} disabled={pending || !dirty}>
            Discard changes
          </button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={pending || !dirty}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {pending ? "Publishing…" : "Publish to site"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Four dots: light background, light primary, dark background, dark primary. */
function Swatches({ palette }: { palette: ThemePalette }) {
  const dots = [palette.light.bg, palette.light.primary, palette.dark.bg, palette.dark.primary];
  return (
    <span className="flex -space-x-1" aria-hidden="true">
      {dots.map((c, i) => (
        <span key={i} className="size-4 rounded-full ring-2 ring-surface" style={{ background: c }} />
      ))}
    </span>
  );
}

/** Native picker + hex box; invalid hex is kept as a draft and not applied. */
function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? value;
  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        type="color"
        aria-label={`${label} picker`}
        value={isHex(value) ? value : "#000000"}
        onChange={(e) => {
          setDraft(null);
          onChange(e.target.value);
        }}
        className="h-9 w-10 cursor-pointer rounded-md border border-border-strong bg-surface p-0.5"
      />
      <input
        aria-label={`${label} hex`}
        value={shown}
        maxLength={7}
        onChange={(e) => {
          const next = e.target.value.trim();
          const withHash = next.startsWith("#") ? next : `#${next}`;
          if (isHex(withHash)) {
            setDraft(null);
            onChange(withHash);
          } else {
            setDraft(next);
          }
        }}
        onBlur={() => setDraft(null)}
        className={cn("input h-9 min-h-9 w-[5.5rem] px-2 font-mono text-xs", draft !== null && "border-danger")}
      />
    </span>
  );
}

/** A miniature of the public site, painted with one mode's colours. */
function Preview({ mode, colors }: { mode: ThemeMode; colors: ThemePalette[ThemeMode] }) {
  const vars = useMemo(
    () => Object.fromEntries(THEME_TOKENS.map(({ key }) => [`--${key}`, colors[key]])) as React.CSSProperties,
    [colors],
  );
  return (
    <div className="overflow-hidden rounded-xl border border-border shadow-sm" style={vars}>
      <div className="bg-bg text-fg">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <span className="flex items-center gap-2 text-sm font-medium">
            <span className="grid size-6 place-items-center rounded-md bg-primary text-[0.6rem] font-semibold text-primary-fg">RO</span>
            Rowshan Mannan Oni
          </span>
          <span className="meta capitalize">{mode}</span>
        </div>
        <div className="space-y-3 px-4 py-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 text-[0.7rem] text-muted">
            <span className="size-1.5 rounded-full bg-accent" />
            Open to research opportunities
          </span>
          <p className="text-xl font-semibold tracking-tight">Software Engineer</p>
          <p className="text-sm text-muted">Secondary text sits here, with a <span className="text-primary underline">link</span>.</p>
          <p className="text-xs text-subtle">Oct 2025 – Feb 2026 · subtle metadata</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-fg">Primary button</span>
            <span className="rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs">Secondary</span>
            <span className="rounded-md bg-soft px-2 py-1 text-[0.7rem] text-soft-fg">Q1</span>
          </div>
        </div>
        <div className="border-t border-border bg-bg-alt px-4 py-4">
          <div className="rounded-lg border border-border bg-surface p-3">
            <p className="text-sm font-medium">Card on alternate band</p>
            <p className="mt-0.5 text-xs text-muted">React · TypeScript · MongoDB</p>
            <div className="mt-2 flex gap-1.5">
              <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[0.65rem] text-muted">chip</span>
              <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[0.65rem] text-muted">chip</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
