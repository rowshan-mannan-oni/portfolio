import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, Download } from "lucide-react";
import type { PortraitTextPosition, SiteSettingsRow } from "@/types/database";
import type { ResolvedLink } from "@/components/public/social-icon";
import { SocialIcon } from "@/components/public/social-icon";
import { storageUrl } from "@/lib/storage";
import { monogramFor } from "@/lib/site";
import { adaptColor } from "@/lib/color";

type Props = {
  settings: SiteSettingsRow;
  cvUrl: string | null;
  links: ResolvedLink[];
  /** Section anchors that exist on the page, so CTAs never point nowhere. */
  anchors: { work: string | null; research: string | null; contact: string | null };
};

export function Hero({ settings, cvUrl, links, anchors }: Props) {
  const photo = storageUrl(settings.profile_image_path);
  // The cutout style needs an uploaded cutout; otherwise fall back to the photo.
  const cutout = settings.portrait_style === "cutout" ? storageUrl(settings.cutout_image_path) : null;
  const backdropText =
    settings.portrait_backdrop_text?.trim() || settings.professional_title?.split("&")[0]?.trim() || "Engineer";
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
          {cutout ? (
            <CutoutPortrait
              src={cutout}
              alt={settings.profile_image_alt ?? `Portrait of ${settings.full_name}`}
              text={backdropText}
              position={settings.portrait_text_position ?? "center"}
              color={settings.portrait_text_color ?? null}
            />
          ) : (
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
          )}
        </div>
      </div>
    </section>
  );
}

const TEXT_POSITION: Record<PortraitTextPosition, string> = {
  top: "justify-start pt-[7%]",
  center: "justify-center",
  bottom: "justify-end pb-[7%]",
};

/**
 * How the front copy moves on hover: it grows from the edge it is anchored
 * to, so it never leaves the frame, and drifts towards the person.
 */
const HOVER_MOTION: Record<PortraitTextPosition, string> = {
  top: "origin-top group-hover:translate-y-[4%]",
  center: "origin-center group-hover:-translate-y-[3%]",
  bottom: "origin-bottom group-hover:-translate-y-[5%]",
};

/** Indent per step, in em of the backdrop text. */
const STEP_EM = 0.6;
/** Average advance of an uppercase glyph in Anton, in em (measured). */
const GLYPH_EM = 0.48;

type BackdropLine = { word: string; step: number };

/**
 * Turns the admin's backdrop text into staggered lines.
 *  - Several lines: one row each; leading spaces push a row right
 *    (e.g. "Eat", " Sleep", "  Code", "Repeat").
 *  - One line: each word becomes a row, stepping right ("Software / Engineer").
 */
export function parseBackdrop(text: string): BackdropLine[] {
  const raw = text.replace(/\t/g, "  ");
  if (/\r?\n/.test(raw)) {
    return raw
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .slice(0, 6)
      .map((line) => ({
        word: line.trim().toUpperCase(),
        step: Math.min(6, line.length - line.trimStart().length),
      }));
  }
  return raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .map((word, i) => ({ word: word.toUpperCase(), step: Math.min(6, i) }));
}

/**
 * Background-free cutout standing in front of large solid text. The words are
 * sized with container query units so the widest row always fits the panel.
 * On hover (or tap), the words come forward in front of the cutout and grow.
 * The text is decorative; the real name and title are in the heading.
 */
function CutoutPortrait({
  src,
  alt,
  text,
  position,
  color,
}: {
  src: string;
  alt: string;
  text: string;
  position: PortraitTextPosition;
  /** Custom #RRGGBB; null uses the theme teal. */
  color: string | null;
}) {
  // Picked colour, adapted per theme (darkened if too pale in light mode,
  // lightened to stay vivid in dark mode). Null keeps the theme teal.
  const themed = adaptColor(color);
  const lines = parseBackdrop(text);
  // Width of a row in em: measured ~GLYPH_EM per uppercase Anton glyph, plus
  // the row's indent. Without a frame the words may run slightly wider than
  // the cutout, which makes them feel bigger and bolder.
  const units = Math.max(2, ...lines.map((l) => l.word.length * GLYPH_EM + l.step * STEP_EM));
  const fontSize = `min(60cqw, calc(108cqw / ${units.toFixed(2)}))`;

  // Gentle ease-out: motion is spread evenly instead of jumping at the start.
  const EASE = "cubic-bezier(0.25, 0.8, 0.35, 1)";

  const words = (front: boolean) => (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 flex select-none flex-col items-center ${TEXT_POSITION[position]} ${HOVER_MOTION[position]} ${
        front
          ? "z-20 opacity-0 blur-[10px] group-hover:scale-[1.18] group-hover:opacity-100 group-hover:blur-[0px]"
          : "z-0 group-hover:scale-[1.18] group-hover:opacity-0"
      }`}
      style={{
        // Tailwind v4 animates size/position via the `scale` and `translate`
        // properties (not `transform`), so those are listed explicitly.
        transitionProperty: "opacity, scale, translate, filter",
        transitionTimingFunction: EASE,
        // Front copy fades in a little slower than the back copy fades out,
        // so the words never "blink" while crossing over the face.
        transitionDuration: front ? "800ms, 1200ms, 1200ms, 800ms" : "600ms, 1200ms, 1200ms, 600ms",
        willChange: "scale, translate, opacity",
      }}
    >
      <div
        className={`flex flex-col items-start uppercase leading-[0.88] tracking-[0.005em] ${
          themed ? "text-[var(--cut-light)] dark:text-[var(--cut-dark)]" : "text-primary"
        } ${
          front ? "[text-shadow:0_8px_32px_rgba(0,0,0,0.28)]" : ""
        }`}
        style={{
          fontSize,
          fontFamily: "var(--font-anton), Impact, 'Arial Narrow', sans-serif",
          ...(themed ? ({ "--cut-light": themed.light, "--cut-dark": themed.dark } as React.CSSProperties) : {}),
        }}
      >
        {lines.map((line, i) => (
          <span
            key={`${line.word}-${i}`}
            className={`block whitespace-nowrap ${front ? "translate-y-[0.35em] group-hover:translate-y-0" : ""}`}
            style={{
              marginLeft: `${line.step * STEP_EM}em`,
              // Rows rise one after another on the front copy.
              ...(front
                ? {
                    transitionProperty: "translate",
                    transitionDuration: "1100ms",
                    transitionTimingFunction: EASE,
                    transitionDelay: `${i * 90}ms`,
                  }
                : {}),
            }}
          >
            {line.word}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    // No frame: the cutout floats on the page and the words are free to grow.
    <figure className="relative mx-auto w-64 sm:w-72 lg:ml-auto lg:mr-4 lg:w-full lg:max-w-[23rem]">
      <div className="group relative aspect-[4/5]" style={{ containerType: "inline-size" }}>
        {/* Behind the person; fades away as its copy comes forward. */}
        {words(false)}

        {/* With the words on top, the person moves down so they stay readable. */}
        <div
          className={`absolute inset-x-0 bottom-0 z-10 origin-bottom group-hover:scale-[0.97] group-hover:brightness-90 ${
            position === "top" ? "top-[20%]" : "top-[12%]"
          }`}
          style={{
            transition: `scale 1200ms ${EASE}, filter 800ms ${EASE}`,
            // The photo is usually cut at the waist: dissolve that edge into the page.
            maskImage: "linear-gradient(to bottom, #000 72%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, #000 72%, transparent 100%)",
          }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 1024px) 384px, 288px"
            className="object-contain object-bottom"
          />
        </div>

        {/* In front of the person: un-blurs, rises row by row and grows on hover. */}
        {words(true)}
      </div>
    </figure>
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
