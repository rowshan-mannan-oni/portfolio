import { z } from "zod";
import { isSafeStoragePath } from "@/lib/storage";
import { slugify } from "@/lib/utils";

/*
 * Reusable field parsers for admin forms. Every optional field turns "" into
 * null so the database never stores empty strings (the public UI relies on
 * NULL to omit content cleanly).
 */

const toNull = (v: string) => (v.trim().length > 0 ? v.trim() : null);

export const requiredText = (label: string, max = 200) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be at most ${max} characters.`);

export const optionalText = (max = 500, label = "This field") =>
  z
    .string()
    .max(max, `${label} must be at most ${max} characters.`)
    .optional()
    .default("")
    .transform(toNull);

export const optionalUrl = z
  .string()
  .trim()
  .max(2048, "URL is too long.")
  .optional()
  .default("")
  .refine((v) => {
    if (!v) return true;
    try {
      const url = new URL(v);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Enter a full URL starting with https://")
  .transform(toNull);

/** "2024", "2024-09" or "2024-09-15" (or empty). */
export const optionalPartialDate = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine(
    (v) => !v || /^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/.test(v),
    "Use a year, or a year and month.",
  )
  .transform(toNull);

export const optionalYear = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine((v) => !v || (/^\d{4}$/.test(v) && Number(v) >= 1900 && Number(v) <= 2200), "Enter a 4-digit year.")
  .transform((v) => (v ? Number(v) : null));

export const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
  .optional()
  .transform((v) => v === "on" || v === "true");

/** Array of short strings, normalized: trimmed, de-duplicated, non-empty. */
export const stringList = (maxItems = 40, maxLength = 200) =>
  z
    .array(z.string())
    .optional()
    .default([])
    .transform((items) => {
      const seen = new Set<string>();
      const out: string[] = [];
      for (const raw of items) {
        const v = raw.trim();
        if (!v || seen.has(v.toLowerCase())) continue;
        seen.add(v.toLowerCase());
        out.push(v);
      }
      return out;
    })
    .refine((items) => items.length <= maxItems, `At most ${maxItems} items.`)
    .refine((items) => items.every((i) => i.length <= maxLength), `Each item must be at most ${maxLength} characters.`);

/** Storage path produced by the uploader (validated, never a URL). */
export const optionalStoragePath = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine((v) => !v || isSafeStoragePath(v), "Invalid file path.")
  .transform(toNull);

export const slugField = z
  .string()
  .trim()
  .max(80, "Slug must be at most 80 characters.")
  .transform((v) => slugify(v))
  .refine((v) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v), "Use lowercase letters, numbers and hyphens.");

/**
 * Converts FormData into a plain object for Zod. Keys ending in "[]" become
 * arrays; list fields (one item per line) are split on newlines.
 */
export function formDataToObject(formData: FormData, listFields: readonly string[] = []) {
  const out: Record<string, string | string[]> = {};
  for (const [rawKey, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    if (rawKey.startsWith("$ACTION")) continue;
    if (rawKey.endsWith("[]")) {
      const key = rawKey.slice(0, -2);
      const existing = out[key];
      out[key] = Array.isArray(existing) ? [...existing, value] : [value];
    } else if (listFields.includes(rawKey)) {
      out[rawKey] = value.split(/\r?\n/);
    } else {
      out[rawKey] = value;
    }
  }
  return out;
}

export type FieldErrors = Record<string, string>;

export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
