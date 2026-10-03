/** Joins class names, skipping falsy values. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Trims a string and turns empty strings into null. */
export function clean(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Non-empty, trimmed entries only. */
export function compact(values: ReadonlyArray<string | null | undefined> | null | undefined): string[] {
  return (values ?? []).map((v) => clean(v)).filter((v): v is string => v !== null);
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Estimated reading time in whole minutes (minimum 1) at ~220 wpm. */
export function readingTime(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#>*_`~\-[\]()]/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function initials(name: string, fallback = "·"): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

/**
 * Returns the URL only if it is an absolute http(s) or mailto/tel URL.
 * Blocks javascript:, data: and other dangerous schemes.
 */
export function safeUrl(value: string | null | undefined): string | null {
  const v = clean(value);
  if (!v) return null;
  try {
    const url = new URL(v);
    if (["http:", "https:", "mailto:", "tel:"].includes(url.protocol)) return url.toString();
  } catch {
    return null;
  }
  return null;
}

export function isExternalUrl(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export function doiUrl(doi: string | null | undefined): string | null {
  const v = clean(doi);
  if (!v) return null;
  const bare = v.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");
  return `https://doi.org/${bare}`;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}
