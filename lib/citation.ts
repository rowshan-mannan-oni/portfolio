import type { PublicationRow } from "@/types/database";

/** IEEE-style reference built from structured fields (used when no citation is stored). */
export function formatIeeeCitation(p: PublicationRow): string | null {
  if (p.authors.length === 0 || !p.venue) return null;
  const authors =
    p.authors.length <= 2
      ? p.authors.join(" and ")
      : `${p.authors.slice(0, -1).join(", ")}, and ${p.authors[p.authors.length - 1]}`;
  const parts = [
    `${authors}, “${p.title},”`,
    `${p.venue}`,
    p.volume ? `vol. ${p.volume}` : null,
    p.issue ? `no. ${p.issue}` : null,
    p.pages ? `pp. ${p.pages}` : null,
    p.year ? String(p.year) : null,
    p.doi ? `doi: ${p.doi}` : null,
  ].filter(Boolean);
  return `${parts.join(", ")}.`.replace(",”,", ",”");
}

export function citationFor(p: PublicationRow): string | null {
  return p.citation?.trim() || formatIeeeCitation(p);
}
