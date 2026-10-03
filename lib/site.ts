import type { SectionKey, SectionSettingsRow, SiteSettingsRow } from "@/types/database";
import { DOCUMENTS_BUCKET, storageUrl } from "@/lib/storage";
import { initials } from "@/lib/utils";

export type NavItem = { id: string; label: string; href: string };

/**
 * Navigation built from section settings: only visible sections that have a
 * nav label, in display order. Hidden sections disappear automatically.
 * `available` lets the homepage drop sections that have no content.
 */
export function buildNavItems(
  sections: SectionSettingsRow[],
  available: (key: SectionKey) => boolean,
): NavItem[] {
  return sections
    .filter((s) => s.visible && s.nav_label && available(s.key))
    .map((s) => ({
      id: s.key,
      label: s.nav_label!,
      href: s.key === "blog" ? "/blog" : `/#${s.key}`,
    }));
}

/** Public CV URL that downloads with a friendly file name, or null. */
export function cvDownloadUrl(settings: SiteSettingsRow): string | null {
  if (!settings.cv_visible || !settings.cv_path) return null;
  const url = storageUrl(settings.cv_path, DOCUMENTS_BUCKET);
  if (!url) return null;
  const fileName =
    settings.cv_file_name ?? `${settings.full_name.replace(/[^\w]+/g, "_")}_CV.pdf`;
  return `${url}?download=${encodeURIComponent(fileName)}`;
}

export function monogramFor(settings: SiteSettingsRow): string {
  return settings.monogram?.trim() || initials(settings.full_name);
}
