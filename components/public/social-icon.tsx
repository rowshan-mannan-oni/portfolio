import {
  siArxiv,
  siCodeforces,
  siGithub,
  siGooglescholar,
  siHuggingface,
  siKaggle,
  siLeetcode,
  siMedium,
  siOrcid,
  siResearchgate,
  siSemanticscholar,
  siX,
  siYoutube,
} from "simple-icons";
import { Globe, Link2, Mail, MapPin, Phone } from "lucide-react";
import type { SocialLinkRow, SocialPlatform } from "@/types/database";
import { safeUrl } from "@/lib/utils";

type BrandIcon = { path: string };

const BRAND_ICONS: Partial<Record<SocialPlatform, BrandIcon>> = {
  github: siGithub,
  google_scholar: siGooglescholar,
  orcid: siOrcid,
  researchgate: siResearchgate,
  semantic_scholar: siSemanticscholar,
  arxiv: siArxiv,
  codeforces: siCodeforces,
  leetcode: siLeetcode,
  kaggle: siKaggle,
  huggingface: siHuggingface,
  x: siX,
  youtube: siYoutube,
  medium: siMedium,
};

/** LinkedIn's mark is not distributed by simple-icons; this is a neutral "in" glyph. */
function LinkedInGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M20.45 2H3.55A1.55 1.55 0 0 0 2 3.55v16.9C2 21.3 2.7 22 3.55 22h16.9c.85 0 1.55-.7 1.55-1.55V3.55C22 2.7 21.3 2 20.45 2ZM8.06 19.04H5.09V9.5h2.97v9.54ZM6.58 8.2a1.72 1.72 0 1 1 0-3.44 1.72 1.72 0 0 1 0 3.44Zm12.46 10.84h-2.96v-4.64c0-1.1-.02-2.53-1.54-2.53-1.55 0-1.78 1.2-1.78 2.45v4.72H9.8V9.5h2.84v1.3h.04c.4-.75 1.37-1.54 2.81-1.54 3 0 3.56 1.98 3.56 4.55v5.23Z" />
    </svg>
  );
}

export function SocialIcon({ platform, className = "size-4" }: { platform: SocialPlatform; className?: string }) {
  if (platform === "linkedin") return <LinkedInGlyph className={className} />;
  const brand = BRAND_ICONS[platform];
  if (brand) {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
        <path d={brand.path} />
      </svg>
    );
  }
  const Icon =
    platform === "email"
      ? Mail
      : platform === "phone"
        ? Phone
        : platform === "location"
          ? MapPin
          : platform === "website"
            ? Globe
            : Link2;
  return <Icon className={className} aria-hidden="true" strokeWidth={1.75} />;
}

export type ResolvedLink = {
  id: string;
  platform: SocialPlatform;
  label: string;
  /** Text shown for the link value, e.g. the address or a short handle. */
  display: string;
  href: string | null;
  external: boolean;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Turns a stored link into something renderable, or null if it has no usable
 * value. Email → mailto:, phone → tel:, location → plain text, others → http(s).
 */
export function resolveSocialLink(link: SocialLinkRow): ResolvedLink | null {
  const value = link.value?.trim();
  if (!value) return null;
  const base = { id: link.id, platform: link.platform, label: link.label };

  if (link.platform === "email") {
    const address = value.replace(/^mailto:/i, "");
    if (!EMAIL.test(address)) return null;
    return { ...base, display: address, href: `mailto:${address}`, external: false };
  }
  if (link.platform === "phone") {
    const digits = value.replace(/^tel:/i, "").replace(/[^\d+]/g, "");
    if (digits.length < 5) return null;
    return { ...base, display: value.replace(/^tel:/i, ""), href: `tel:${digits}`, external: false };
  }
  if (link.platform === "location") {
    return { ...base, display: value, href: null, external: false };
  }

  const href = safeUrl(value);
  if (!href || !/^https?:/i.test(href)) return null;
  const display = href.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
  return { ...base, display, href, external: true };
}
