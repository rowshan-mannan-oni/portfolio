import { cn } from "@/lib/utils";

type Props = {
  id: string;
  index: number;
  heading: string;
  subheading?: string | null;
  tone?: "plain" | "alt";
  /** Optional element shown to the right of the heading on wide screens. */
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/**
 * Homepage section shell: numbered editorial label, heading, optional
 * subheading. `tone="alt"` gives the section a faint tinted band so long
 * pages get rhythm without boxing everything into cards.
 */
export function Section({ id, index, heading, subheading, tone = "plain", aside, children, className }: Props) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "section-y scroll-mt-16",
        tone === "alt" && "border-y border-border/70 bg-bg-alt",
        className,
      )}
    >
      <div className="container-page">
        <div
          data-reveal
          className="mb-10 flex flex-col gap-4 md:mb-14 md:flex-row md:items-end md:justify-between"
        >
          <div className="max-w-2xl">
            <p className="eyebrow flex items-center gap-3">
              <span>{String(index).padStart(2, "0")}</span>
              <span aria-hidden="true" className="h-px w-8 bg-primary/40" />
              <span className="sr-only">—</span>
            </p>
            <h2 id={headingId} className="mt-3 text-3xl font-semibold tracking-tight sm:text-[2.15rem]">
              {heading}
            </h2>
            {subheading ? <p className="mt-3 text-[1.02rem] leading-relaxed text-muted">{subheading}</p> : null}
          </div>
          {aside ? <div className="shrink-0">{aside}</div> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

/** Short horizontal list joined by thin middots; omits empty values entirely. */
export function MetaList({
  items,
  className,
}: {
  items: Array<React.ReactNode | null | undefined | false>;
  className?: string;
}) {
  const present = items.filter((item): item is React.ReactNode => Boolean(item));
  if (present.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
      {present.map((item, i) => (
        <li key={i} className="flex items-center gap-2">
          {i > 0 ? (
            <span aria-hidden="true" className="text-border-strong">
              ·
            </span>
          ) : null}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function TagList({ tags, className }: { tags: string[]; className?: string }) {
  const present = tags.filter((t) => t.trim().length > 0);
  if (present.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)} aria-label="Technologies and topics">
      {present.map((tag) => (
        <li key={tag} className="chip">
          {tag}
        </li>
      ))}
    </ul>
  );
}

/** External-aware anchor with safe rel attributes. */
export function ExternalLink({
  href,
  children,
  className,
  label,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  const external = /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      className={className}
      aria-label={label}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
