import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, Download } from "lucide-react";
import type { SiteSettingsRow } from "@/types/database";
import type { ResolvedLink } from "@/components/public/social-icon";
import { SocialIcon } from "@/components/public/social-icon";
import { storageUrl } from "@/lib/storage";
import { monogramFor } from "@/lib/site";

type Props = {
  settings: SiteSettingsRow;
  cvUrl: string | null;
  links: ResolvedLink[];
  /** Section anchors that exist on the page, so CTAs never point nowhere. */
  anchors: { work: string | null; research: string | null; contact: string | null };
};

export function Hero({ settings, cvUrl, links, anchors }: Props) {
  const photo = storageUrl(settings.profile_image_path);
  const status = settings.current_status ?? settings.availability;
  const heroLinks = links.filter((l) => l.href && l.platform !== "email").slice(0, 4);

  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden">
      <div className="container-page relative grid grid-cols-1 items-center gap-10 pb-16 pt-10 sm:pt-14 md:pb-24 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-16 lg:pt-20">
        <div className="order-2 min-w-0 lg:order-1" data-reveal>
          {status ? (
            <p className="mb-6 inline-flex max-w-full items-start gap-2.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-[0.8rem] leading-snug text-muted sm:items-center sm:rounded-full sm:py-1">
              <span className="relative mt-[0.3rem] flex size-2 shrink-0 sm:mt-0" aria-hidden="true">
                <span className="absolute inline-flex size-full rounded-full bg-accent/50 motion-safe:animate-ping [animation-duration:2.5s]" />
                <span className="relative inline-flex size-2 rounded-full bg-accent" />
              </span>
              <span className="min-w-0 sm:truncate">{status}</span>
            </p>
          ) : null}

          <h1
            id="hero-heading"
            className="text-[2.5rem] font-semibold leading-[1.04] tracking-[-0.03em] text-fg [overflow-wrap:anywhere] sm:text-6xl lg:text-[4.1rem]"
          >
            {settings.full_name}
          </h1>

          {settings.professional_title ? (
            <p className="mt-4 font-serif text-[1.45rem] italic leading-snug text-primary sm:text-[1.75rem]">
              {settings.professional_title}
            </p>
          ) : null}

          {settings.hero_headline ? (
            <p className="mt-7 max-w-xl text-[1.15rem] leading-relaxed text-fg sm:text-[1.25rem]">
              {settings.hero_headline}
            </p>
          ) : null}
          {settings.hero_description ? (
            <p className="mt-4 max-w-xl text-[1rem] leading-relaxed text-muted">
              {settings.hero_description}
            </p>
          ) : null}

          <div className="mt-9 flex flex-wrap items-center gap-3">
            {anchors.work ? (
              <Link href={anchors.work} className="btn btn-primary">
                View my work
                <ArrowDownRight className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
            {anchors.research ? (
              <Link href={anchors.research} className="btn btn-secondary">
                Research &amp; publications
              </Link>
            ) : null}
            {cvUrl ? (
              <a href={cvUrl} className="btn btn-ghost" download>
                <Download className="size-4" aria-hidden="true" />
                Download CV
              </a>
            ) : null}
            {anchors.contact ? (
              <Link href={anchors.contact} className="btn btn-ghost">
                Contact
              </Link>
            ) : null}
          </div>

          {settings.hero_focus_areas.length > 0 || heroLinks.length > 0 ? (
            <div className="mt-12 flex flex-col gap-5 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              {settings.hero_focus_areas.length > 0 ? (
                <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Focus areas">
                  {settings.hero_focus_areas.map((area, i) => (
                    <li key={area} className="meta flex items-center gap-2 text-muted">
                      <span className="text-primary">{String(i + 1).padStart(2, "0")}</span>
                      {area}
                    </li>
                  ))}
                </ul>
              ) : null}
              {heroLinks.length > 0 ? (
                <ul className="-ml-2 flex items-center gap-0.5 sm:ml-0">
                  {heroLinks.map((link) => (
                    <li key={link.id}>
                      <a
                        href={link.href!}
                        aria-label={link.label}
                        title={link.label}
                        className="btn btn-ghost btn-icon"
                        {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        <SocialIcon platform={link.platform} className="size-[17px]" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="order-1 lg:order-2" data-reveal>
          <figure className="relative w-36 sm:w-44 lg:ml-auto lg:w-full lg:max-w-[22rem]">
            <div
              aria-hidden="true"
              className="absolute inset-0 translate-x-2.5 translate-y-2.5 rounded-2xl border border-primary/30 lg:translate-x-4 lg:translate-y-4"
            />
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-surface-muted">
              {photo ? (
                <Image
                  src={photo}
                  alt={settings.profile_image_alt ?? `Portrait of ${settings.full_name}`}
                  fill
                  loading="eager"
                  fetchPriority="high"
                  sizes="(min-width: 1024px) 352px, (min-width: 640px) 176px, 144px"
                  className="object-cover"
                  style={{ objectPosition: settings.profile_image_position || "center 30%" }}
                />
              ) : (
                <PortraitFallback monogram={monogramFor(settings)} />
              )}
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}

function PortraitFallback({ monogram }: { monogram: string }) {
  return (
    <div className="texture-dots relative flex size-full items-center justify-center bg-soft/60" role="presentation">
      <span className="font-serif text-5xl font-medium tracking-tight text-primary/80 lg:text-8xl">{monogram}</span>
      <span aria-hidden="true" className="absolute bottom-[18%] h-px w-1/4 bg-primary/40" />
    </div>
  );
}
