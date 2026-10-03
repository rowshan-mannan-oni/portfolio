import { Code2, Database, ExternalLink as ExternalIcon, FileText, Link2 } from "lucide-react";
import type { PublicationRow, VenueType } from "@/types/database";
import { CopyButton } from "@/components/public/copy-button";
import { ExternalLink, MetaList, Section } from "@/components/public/section";
import { citationFor } from "@/lib/citation";
import { doiUrl, safeUrl } from "@/lib/utils";

const VENUE_LABEL: Record<VenueType, string> = {
  journal: "Journal article",
  conference: "Conference paper",
  workshop: "Workshop paper",
  preprint: "Preprint",
  thesis: "Thesis",
  book_chapter: "Book chapter",
  other: "Publication",
};

type Props = {
  index: number;
  heading: string;
  subheading: string | null;
  items: PublicationRow[];
  authorNames: string[];
};

export function PublicationsSection({ index, heading, subheading, items, authorNames }: Props) {
  return (
    <Section id="publications" index={index} heading={heading} subheading={subheading} tone="alt">
      <ol className="divide-y divide-border border-y border-border">
        {items.map((pub) => (
          <PublicationItem key={pub.id} pub={pub} authorNames={authorNames} />
        ))}
      </ol>
    </Section>
  );
}

function normalizeName(name: string) {
  return name.toLowerCase().replace(/[^a-z]/g, "");
}

function Authors({ authors, highlight }: { authors: string[]; highlight: string[] }) {
  const own = new Set(highlight.map(normalizeName));
  return (
    <p className="text-[0.92rem] leading-relaxed text-muted">
      {authors.map((author, i) => (
        <span key={`${author}-${i}`}>
          {own.has(normalizeName(author)) ? (
            <span className="font-medium text-fg underline decoration-primary/40 decoration-1 underline-offset-[3px]">
              {author}
            </span>
          ) : (
            author
          )}
          {i < authors.length - 2 ? ", " : i === authors.length - 2 ? (authors.length > 2 ? ", and " : " and ") : ""}
        </span>
      ))}
    </p>
  );
}

function PublicationItem({ pub, authorNames }: { pub: PublicationRow; authorNames: string[] }) {
  const publisherHref = safeUrl(pub.publisher_url);
  const doiHref = doiUrl(pub.doi);
  const titleHref = publisherHref ?? doiHref;
  const citation = citationFor(pub);

  const actions = [
    { href: publisherHref, label: pub.publisher ? pub.publisher : "Publisher", icon: ExternalIcon },
    { href: doiHref, label: "DOI", icon: Link2 },
    { href: safeUrl(pub.pdf_url), label: "PDF", icon: FileText },
    { href: safeUrl(pub.code_url), label: "Code", icon: Code2 },
    { href: safeUrl(pub.dataset_url), label: "Dataset", icon: Database },
  ].filter((a): a is { href: string; label: string; icon: typeof Link2 } => Boolean(a.href));

  const details = [
    pub.volume ? `Vol. ${pub.volume}` : null,
    pub.issue ? `No. ${pub.issue}` : null,
    pub.pages ? `pp. ${pub.pages}` : null,
  ];

  return (
    <li id={`pub-${pub.id}`} className="scroll-mt-24 py-8 first:pt-8" data-reveal>
      <article className="grid grid-cols-1 gap-x-10 gap-y-3 md:grid-cols-[7rem_minmax(0,1fr)]">
        <div className="flex items-center gap-3 md:block">
          {pub.year ? (
            <p className="font-mono text-2xl font-medium tracking-tight text-fg md:text-[1.7rem]">{pub.year}</p>
          ) : null}
          {pub.venue_type ? <p className="meta md:mt-1">{VENUE_LABEL[pub.venue_type]}</p> : null}
        </div>

        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-snug tracking-tight sm:text-[1.2rem]">
            {titleHref ? (
              <ExternalLink href={titleHref} className="transition-colors hover:text-primary">
                {pub.title}
              </ExternalLink>
            ) : (
              pub.title
            )}
          </h3>

          {pub.authors.length > 0 ? (
            <div className="mt-2">
              <Authors authors={pub.authors} highlight={authorNames} />
            </div>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.9rem]">
            {pub.venue ? <span className="font-serif text-[1.02rem] italic text-fg/90">{pub.venue}</span> : null}
            <MetaList className="meta" items={details} />
            {pub.quartile ? <span className="badge">{pub.quartile}</span> : null}
          </div>

          {actions.length > 0 || citation ? (
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1">
              {actions.map(({ href, label, icon: Icon }) => (
                <ExternalLink key={label} href={href} className="action-link">
                  <Icon className="size-3.5" aria-hidden="true" />
                  {label}
                </ExternalLink>
              ))}
              {citation ? <CopyButton text={citation} label="Copy citation" copiedLabel="Citation copied" /> : null}
            </div>
          ) : null}

          {pub.abstract ? (
            <details className="group mt-3">
              <summary className="action-link text-primary">
                <span className="group-open:hidden">Abstract</span>
                <span className="hidden group-open:inline">Hide abstract</span>
              </summary>
              <p className="mt-3 max-w-3xl text-[0.94rem] leading-relaxed text-muted">{pub.abstract}</p>
            </details>
          ) : null}
        </div>
      </article>
    </li>
  );
}
