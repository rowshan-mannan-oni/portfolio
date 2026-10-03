/**
 * The single date-formatting layer.
 *
 * Portfolio dates are stored as partial ISO strings ("2024", "2024-09",
 * "2024-09-15") so that year-only and month-only facts don't need invented
 * days. Blog timestamps are full ISO timestamps.
 */

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const PARTIAL_DATE = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;

type Parsed = { year: number; month: number | null; day: number | null };

export function parsePartialDate(value: string | null | undefined): Parsed | null {
  if (!value) return null;
  const match = PARTIAL_DATE.exec(value.trim());
  if (!match) return null;
  const month = match[2] ? Number(match[2]) : null;
  if (month !== null && (month < 1 || month > 12)) return null;
  return { year: Number(match[1]), month, day: match[3] ? Number(match[3]) : null };
}

/** "Sep 2024", or "2024" when only the year is known. */
export function formatPartialDate(value: string | null | undefined): string | null {
  const parsed = parsePartialDate(value);
  if (!parsed) return null;
  if (parsed.month === null) return String(parsed.year);
  return `${MONTHS_SHORT[parsed.month - 1]} ${parsed.year}`;
}

/**
 * Human date range.
 *  - "Oct 2024 – Jan 2025"
 *  - "Oct 2025 – Present"   (current)
 *  - "Sep 2024 – Jun 2025"
 *  - "2021"                 (end only)
 *  - null                   (nothing known)
 */
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  current = false,
): string | null {
  const s = formatPartialDate(start);
  const e = current ? "Present" : formatPartialDate(end);
  if (s && e) return s === e ? s : `${s} – ${e}`;
  return s ?? e ?? null;
}

/** "March 4, 2026" for blog posts. Uses UTC to avoid server/client drift. */
export function formatLongDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** "Mar 4, 2026, 14:05" for admin tables. */
export function formatDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date) + " UTC";
}

/** Year of a partial date, for compact labels. */
export function partialYear(value: string | null | undefined): string | null {
  const parsed = parsePartialDate(value);
  return parsed ? String(parsed.year) : null;
}
