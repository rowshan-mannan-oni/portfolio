/*
 * Colour utilities for theme-aware custom colours.
 *
 * A colour picked in the dashboard is adapted per theme in OKLCH, a
 * perceptual colour space: hue and chroma are kept, only lightness moves until
 * the colour has enough contrast against that theme's background. This is the
 * same relationship the built-in teal has (#0f766e light → #4cc9b7 dark).
 */

type Rgb = [number, number, number]; // 0–1, gamma-encoded sRGB
type Oklch = { l: number; c: number; h: number };

/** Page backgrounds of the two themes (see app/globals.css). */
export const LIGHT_BG = "#f7fbfa";
export const DARK_BG = "#071716";

/** Contrast targets: large display text needs ≥3:1; dark mode matches the built-in teal (~9:1). */
const LIGHT_TARGET = 3.5;
const DARK_TARGET = 9;

const HEX = /^#([0-9a-f]{6})$/i;

function hexToRgb(hex: string): Rgb | null {
  const m = HEX.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function rgbToHex([r, g, b]: Rgb): string {
  const to = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const toGamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

function rgbToOklch(rgb: Rgb): Oklch {
  const [r, g, b] = rgb.map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: L, c: Math.hypot(A, B), h: Math.atan2(B, A) };
}

/** OKLCH → linear sRGB (may be out of gamut). */
function oklchToLinear({ l: L, c, h }: Oklch): Rgb {
  const A = c * Math.cos(h);
  const B = c * Math.sin(h);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = (rgb: Rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/** OKLCH → hex, lowering chroma (never hue) until the colour is displayable. */
function oklchToHex(color: Oklch): string {
  let lo = 0;
  let hi = color.c;
  let lin = oklchToLinear(color);
  if (!inGamut(lin)) {
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear({ ...color, c: mid }))) lo = mid;
      else hi = mid;
    }
    lin = oklchToLinear({ ...color, c: lo });
  }
  return rgbToHex(lin.map((v) => toGamma(Math.min(1, Math.max(0, v)))) as Rgb);
}

function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colours. */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/**
 * Moves lightness (keeping hue and chroma) until `target` contrast against
 * `bg` is reached. `direction` says whether to lighten or darken.
 */
function fitLightness(base: Oklch, bg: string, target: number, direction: "up" | "down"): string {
  const start = oklchToHex(base);
  if (contrast(start, bg) >= target) return start;
  let lo = base.l;
  let hi = direction === "up" ? 1 : 0;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (contrast(oklchToHex({ ...base, l: mid }), bg) >= target) hi = mid;
    else lo = mid;
  }
  return oklchToHex({ ...base, l: hi });
}

/**
 * Returns the colour to use in each theme, or null for an invalid input.
 *  - light: the picked colour, darkened only if it's too pale for the light page.
 *  - dark:  the picked colour, lightened until it glows on the dark page.
 */
export function adaptColor(hex: string | null | undefined): { light: string; dark: string } | null {
  const rgb = hex ? hexToRgb(hex) : null;
  if (!rgb) return null;
  const base = rgbToOklch(rgb);
  return {
    light: fitLightness(base, LIGHT_BG, LIGHT_TARGET, "down"),
    dark: fitLightness(base, DARK_BG, DARK_TARGET, "up"),
  };
}
