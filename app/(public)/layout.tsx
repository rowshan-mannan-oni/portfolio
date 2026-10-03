import type { Metadata } from "next";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { RevealObserver } from "@/components/public/reveal-observer";
import { resolveSocialLink, type ResolvedLink } from "@/components/public/social-icon";
import {
  getHomeContent,
  getSections,
  getSiteSettings,
  getSocialLinks,
  sectionHasContent,
} from "@/lib/data/public";
import { buildNavItems, cvDownloadUrl, monogramFor } from "@/lib/site";
import { storageUrl } from "@/lib/storage";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title =
    settings.seo_title ??
    [settings.full_name, settings.professional_title].filter(Boolean).join(" — ");
  const description = settings.seo_description ?? settings.hero_description ?? undefined;
  const ogImage = storageUrl(settings.og_image_path) ?? "/og";

  return {
    title: { default: title, template: `%s — ${settings.full_name}` },
    description,
    keywords: settings.seo_keywords.length > 0 ? settings.seo_keywords : undefined,
    authors: [{ name: settings.full_name }],
    creator: settings.full_name,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: settings.full_name,
      title,
      description,
      url: "/",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
    robots: { index: true, follow: true },
  };
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, sections, socialLinks, content] = await Promise.all([
    getSiteSettings(),
    getSections(),
    getSocialLinks(),
    getHomeContent(),
  ]);

  const navItems = buildNavItems(sections, (key) => sectionHasContent(key, settings, content));
  const links = socialLinks
    .map(resolveSocialLink)
    .filter((l): l is ResolvedLink => l !== null);

  return (
    <>
      <SiteHeader
        name={settings.full_name}
        monogram={monogramFor(settings)}
        items={navItems}
        cvUrl={cvDownloadUrl(settings)}
      />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter
        name={settings.full_name}
        title={settings.professional_title}
        footerText={settings.footer_text}
        links={links}
      />
      <RevealObserver />
    </>
  );
}
