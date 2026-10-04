import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Code2, FileText } from "lucide-react";
import type { ResearchWithPublication } from "@/lib/data/public";
import { Markdown } from "@/components/markdown";
import { ExternalLink, MetaList, Section, TagList } from "@/components/public/section";
import { formatDateRange } from "@/lib/format/date";
import { storageUrl } from "@/lib/storage";
import { safeUrl } from "@/lib/utils";

type Props = {
  index: number;
  heading: string;
  subheading: string | null;
  intro: string | null;
  interests: string[];
  items: ResearchWithPublication[];
  showPublicationLinks: boolean;
};

export function ResearchSection({ index, heading, subheading, intro, interests, items, showPublicationLinks }: Props) {
  return (
    <Section id="research" index={index} heading={heading} subheading={subheading}>
      {intro || interests.length > 0 ? (
        <div className="mb-14 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16" data-reveal>
          {intro ? (
            <p className="font-serif text-[1.35rem] leading-relaxed text-fg sm:text-[1.5rem]">{intro}</p>
          ) : (
            <span className="hidden lg:block" />
          )}
          {interests.length > 0 ? (
            <div>
              <h3 className="meta mb-3">Research interests</h3>
              <ol className="grid grid-cols-1 border-t border-border sm:grid-cols-2">
                {interests.map((interest, i) => (
                  <li
                    key={interest}
                    className="flex items-baseline gap-3 border-b border-border py-2.5 text-[0.95rem] sm:odd:pr-6"
                  >
                    <span className="meta text-primary">{String(i + 1).padStart(2, "0")}</span>
                    <span>{interest}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="space-y-8">
          {items.map((item) => (
            <ResearchItem key={item.id} item={item} showPublicationLink={showPublicationLinks} />
          ))}
        </div>
      ) : null}
    </Section>
  );
}

function ResearchItem({ item, showPublicationLink }: { item: ResearchWithPublication; showPublicationLink: boolean }) {
  const range = formatDateRange(item.start_date, item.end_date);
  const image = storageUrl(item.image);
  const narrative = [
    { label: "The problem", text: item.problem },
    { label: "Approach", text: item.approach },
    { label: "Why it matters", text: item.significance },
  ].filter((n): n is { label: string; text: string } => Boolean(n.text));
  const highlights = item.highlights.filter((h) => h.trim());
  const links = [
    { href: safeUrl(item.paper_url), label: "Paper", icon: FileText },
    { href: safeUrl(item.code_url), label: "Code", icon: Code2 },
    { href: safeUrl(item.project_url), label: "Project", icon: ArrowUpRight },
  ].filter((l): l is { href: string; label: string; icon: typeof FileText } => Boolean(l.href));
  const hasDetails = Boolean(item.full_description || item.dataset || item.keywords.length > 0);

  return (
    <article className="card overflow-hidden" data-reveal>
      <div className={image ? "grid lg:grid-cols-[minmax(0,1fr)_20rem]" : undefined}>
        <div className="p-6 sm:p-8 lg:p-10">
          <MetaList
            className="eyebrow"
            items={[item.research_type, item.status, range]}
          />
          <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-[1.7rem]">
            {item.title}
          </h3>
          <MetaList
            className="mt-3 text-sm text-muted"
            items={[
              item.institution,
              item.supervisor ? <>Supervised by {item.supervisor}</> : null,
            ]}
          />
          {item.short_description ? (
            <p className="mt-5 max-w-3xl text-[1.05rem] leading-relaxed">{item.short_description}</p>
          ) : null}

          {narrative.length > 0 ? (
            <dl
              className={`mt-8 grid gap-6 border-t border-border pt-6 ${
                narrative.length === 3 ? "md:grid-cols-3" : narrative.length === 2 ? "md:grid-cols-2" : ""
              }`}
            >
              {narrative.map((n) => (
                <div key={n.label}>
                  <dt className="meta text-primary">{n.label}</dt>
                  <dd className="mt-2 text-[0.94rem] leading-relaxed text-muted">{n.text}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {item.methods.length > 0 ? (
            <div className="mt-7">
              <h4 className="meta mb-2.5">Methods</h4>
              <TagList tags={item.methods} />
            </div>
          ) : null}

          {highlights.length > 0 ? (
            <div className="mt-7">
              <h4 className="meta mb-2.5">Key findings</h4>
              <ul className="max-w-3xl space-y-2 text-[0.95rem] leading-relaxed">
                {highlights.map((h) => (
                  <li key={h} className="relative pl-5">
                    <span aria-hidden="true" className="absolute left-0 top-[0.62em] size-1.5 rounded-full bg-accent" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {hasDetails ? (
            <details className="group mt-7 border-t border-border pt-5">
              <summary className="action-link text-primary">
                <span className="group-open:hidden">Read more about this work</span>
                <span className="hidden group-open:inline">Show less</span>
              </summary>
              <div className="mt-4 space-y-5">
                {item.full_description ? (
                  <Markdown size="sm" className="max-w-3xl text-muted">
                    {item.full_description}
                  </Markdown>
                ) : null}
                {item.dataset ? (
                  <p className="text-sm">
                    <span className="meta mr-2">Dataset</span>
                    {item.dataset}
                  </p>
                ) : null}
                {item.keywords.length > 0 ? <TagList tags={item.keywords} /> : null}
              </div>
            </details>
          ) : null}

          {links.length > 0 || (item.publication && showPublicationLink) ? (
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
              {links.map(({ href, label, icon: Icon }) => (
                <ExternalLink key={label} href={href} className="action-link">
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </ExternalLink>
              ))}
              {item.publication && showPublicationLink ? (
                <Link href={`/#pub-${item.publication.id}`} className="action-link">
                  <BookOpen className="size-4" aria-hidden="true" />
                  Related publication
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        {image ? (
          <div className="relative min-h-[30rem] border-t border-border bg-surface-muted lg:border-l lg:border-t-0">
            <Image
              src={image}
              alt={item.image_alt ?? ""}
              fill
              sizes="(min-width: 1024px) 320px, 100vw"
              className="object-contain"
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}
