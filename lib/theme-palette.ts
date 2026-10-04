import { hexToOklch, isHex, oklch, ensureContrast } from "@/lib/color";

/*
 * Site colour palette, editable from the dashboard.
 *
 * DEFAULT_PALETTE mirrors the tokens in app/globals.css exactly — keep them in
 * sync. The database stores only the tokens the admin changed (overrides), so
 * defaults can evolve without touching saved data.
 */

export const THEME_TOKENS = [
  { key: "bg", label: "Page background", group: "Backgrounds" },
  { key: "bg-alt", label: "Alternate band", group: "Backgrounds", hint: "Tinted sections such as Experience" },
  { key: "surface", label: "Cards & panels", group: "Backgrounds" },
  { key: "surface-muted", label: "Muted surface", group: "Backgrounds", hint: "Placeholders, inputs, chips" },
  { key: "fg", label: "Main text", group: "Text" },
  { key: "fg-muted", label: "Secondary text", group: "Text" },
  { key: "fg-subtle", label: "Subtle text", group: "Text", hint: "Dates, metadata" },
  { key: "primary", label: "Primary", group: "Brand", hint: "Buttons, links, accents" },
  { key: "primary-hover", label: "Primary (hover)", group: "Brand" },
  { key: "primary-fg", label: "Text on primary", group: "Brand", hint: "Button labels" },
  { key: "accent", label: "Accent", group: "Brand", hint: "Status dot, highlights" },
  { key: "soft", label: "Soft tint", group: "Brand", hint: "Badges, active menu items" },
  { key: "soft-fg", label: "Text on soft tint", group: "Brand" },
  { key: "ring", label: "Focus ring", group: "Brand" },
  { key: "border", label: "Border", group: "Lines" },
  { key: "border-strong", label: "Strong border", group: "Lines" },
] as const;

export type ThemeToken = (typeof THEME_TOKENS)[number]["key"];
export type ThemeMode = "light" | "dark";
export type PaletteColors = Record<ThemeToken, string>;
export type ThemePalette = Record<ThemeMode, PaletteColors>;
/** What is stored: only changed tokens. */
export type ThemeOverrides = Partial<Record<ThemeMode, Partial<PaletteColors>>>;

const TOKEN_KEYS = new Set<string>(THEME_TOKENS.map((t) => t.key));

export const DEFAULT_PALETTE: ThemePalette = {
  light: {
    bg: "#f7fbfa",
    "bg-alt": "#eff6f5",
    surface: "#ffffff",
    "surface-muted": "#f4f9f8",
    fg: "#102a2a",
    "fg-muted": "#4f6967",
    "fg-subtle": "#6a8381",
    primary: "#0f766e",
    "primary-hover": "#0c5f59",
    "primary-fg": "#ffffff",
    accent: "#14b8a6",
    soft: "#dcf3ee",
    "soft-fg": "#0d5c55",
    ring: "#14b8a6",
    border: "#dbe7e4",
    "border-strong": "#c3d6d2",
  },
  dark: {
    bg: "#071716",
    "bg-alt": "#0b201e",
    surface: "#102724",
    "surface-muted": "#0d2321",
    fg: "#e3eeec",
    "fg-muted": "#9ab2ae",
    "fg-subtle": "#7d9793",
    primary: "#4cc9b7",
    "primary-hover": "#6fd8c8",
    "primary-fg": "#04201d",
    accent: "#2dd4bf",
    // CSS default is rgba(76, 201, 183, 0.12); this is its opaque equivalent on the dark page.
    soft: "#0f2c29",
    "soft-fg": "#8fe0d3",
    ring: "#4cc9b7",
    border: "#1b3532",
    "border-strong": "#29504a",
  },
};

/** Keeps only known tokens with valid #RRGGBB values. Never trusts stored JSON blindly. */
export function sanitizeOverrides(input: unknown): ThemeOverrides {
  const out: ThemeOverrides = {};
  if (!input || typeof input !== "object") return out;
  for (const mode of ["light", "dark"] as const) {
    const source = (input as Record<string, unknown>)[mode];
    if (!source || typeof source !== "object") continue;
    const clean: Partial<PaletteColors> = {};
    for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
      if (TOKEN_KEYS.has(key) && isHex(value)) clean[key as ThemeToken] = value.toLowerCase();
    }
    if (Object.keys(clean).length > 0) out[mode] = clean;
  }
  return out;
}

export function resolvePalette(overrides: unknown): ThemePalette {
  const o = sanitizeOverrides(overrides);
  return {
    light: { ...DEFAULT_PALETTE.light, ...o.light },
    dark: { ...DEFAULT_PALETTE.dark, ...o.dark },
  };
}

/** Only the values that differ from the defaults. */
export function diffFromDefaults(palette: ThemePalette): ThemeOverrides {
  const out: ThemeOverrides = {};
  for (const mode of ["light", "dark"] as const) {
    const changed: Partial<PaletteColors> = {};
    for (const { key } of THEME_TOKENS) {
      const value = palette[mode][key]?.toLowerCase();
      if (isHex(value) && value !== DEFAULT_PALETTE[mode][key]) changed[key] = value;
    }
    if (Object.keys(changed).length > 0) out[mode] = changed;
  }
  return out;
}

/**
 * CSS that overrides the token variables. Values are re-validated here, so
 * nothing but #RRGGBB can ever reach the stylesheet.
 */
export function buildThemeCss(overrides: unknown): string | null {
  const o = sanitizeOverrides(overrides);
  const block = (selector: string, colors?: Partial<PaletteColors>) => {
    const entries = Object.entries(colors ?? {}).filter(([k, v]) => TOKEN_KEYS.has(k) && isHex(v));
    return entries.length > 0 ? `${selector}{${entries.map(([k, v]) => `--${k}:${v}`).join(";")}}` : "";
  };
  // `:root:not(.dark)` so light overrides never leak into dark mode (a plain
  // `:root` rule here would outrank the built-in `.dark` tokens).
  const css = block(":root:not(.dark)", o.light) + block(":root.dark", o.dark);
  return css || null;
}

/**
 * Builds a complete palette for both modes from a single brand colour, in
 * OKLCH so lightness changes never shift the hue. With `tintNeutrals`, the
 * backgrounds, text and borders take a faint cast of the brand hue (the
 * default teal palette is built the same way).
 */
export function generatePalette(brandHex: string, tintNeutrals = true): ThemePalette | null {
  const brand = hexToOklch(brandHex);
  if (!brand) return null;
  const h = brand.h;
  const c = Math.max(0.06, Math.min(brand.c, 0.2));
  const n = tintNeutrals ? 1 : 0; // neutral tint strength

  const lightBg = oklch(0.985, 0.006 * n, h);
  const darkBg = oklch(0.2, 0.022 * n, h);

  const lightPrimary = ensureContrast(oklch(Math.min(brand.l, 0.55), c, h), lightBg, 4.6);
  const darkPrimary = ensureContrast(oklch(Math.max(brand.l, 0.76), c, h), darkBg, 7);
  const lp = hexToOklch(lightPrimary)!;
  const dp = hexToOklch(darkPrimary)!;

  return {
    light: {
      bg: lightBg,
      "bg-alt": oklch(0.968, 0.01 * n, h),
      surface: "#ffffff",
      "surface-muted": oklch(0.978, 0.008 * n, h),
      fg: oklch(0.27, 0.035 * n, h),
      "fg-muted": oklch(0.49, 0.03 * n, h),
      "fg-subtle": oklch(0.58, 0.025 * n, h),
      primary: lightPrimary,
      "primary-hover": oklch(lp.l - 0.07, lp.c, h),
      "primary-fg": "#ffffff",
      accent: oklch(0.7, c, h),
      soft: oklch(0.94, 0.035, h),
      "soft-fg": oklch(0.42, c * 0.8, h),
      ring: oklch(0.7, c, h),
      border: oklch(0.915, 0.012 * n, h),
      "border-strong": oklch(0.855, 0.018 * n, h),
    },
    dark: {
      bg: darkBg,
      "bg-alt": oklch(0.225, 0.026 * n, h),
      surface: oklch(0.255, 0.03 * n, h),
      "surface-muted": oklch(0.235, 0.028 * n, h),
      fg: oklch(0.94, 0.012 * n, h),
      "fg-muted": oklch(0.76, 0.028 * n, h),
      "fg-subtle": oklch(0.66, 0.028 * n, h),
      primary: darkPrimary,
      "primary-hover": oklch(dp.l + 0.06, dp.c, h),
      "primary-fg": oklch(0.2, 0.04, h),
      accent: oklch(0.8, c, h),
      soft: oklch(0.29, 0.045, h),
      "soft-fg": oklch(0.86, c * 0.6, h),
      ring: darkPrimary,
      border: oklch(0.31, 0.026 * n, h),
      "border-strong": oklch(0.39, 0.032 * n, h),
    },
  };
}

/** Pairs worth checking for legibility (WCAG AA: 4.5 for text, 3 for large/UI). */
export const CONTRAST_CHECKS: Array<{ label: string; fg: ThemeToken; bg: ThemeToken; min: number }> = [
  { label: "Main text on page", fg: "fg", bg: "bg", min: 4.5 },
  { label: "Secondary text on page", fg: "fg-muted", bg: "bg", min: 4.5 },
  { label: "Subtle text on page", fg: "fg-subtle", bg: "bg", min: 3 },
  { label: "Main text on cards", fg: "fg", bg: "surface", min: 4.5 },
  { label: "Links on page", fg: "primary", bg: "bg", min: 4.5 },
  { label: "Button label on primary", fg: "primary-fg", bg: "primary", min: 4.5 },
  { label: "Text on soft tint", fg: "soft-fg", bg: "soft", min: 4.5 },
];
