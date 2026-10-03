import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { ExperienceRow } from "@/types/database";
import { Markdown } from "@/components/markdown";
import { ExternalLink, MetaList, Section, TagList } from "@/components/public/section";
import { formatDateRange } from "@/lib/format/date";
import { storageUrl } from "@/lib/storage";
import { safeUrl } from "@/lib/utils";

type Props = {
  index: number;
  heading: string;
  subheading: string | null;
  items: ExperienceRow[];
};

export function ExperienceSection({ index, heading, subheading, items }: Props) {
  return (
    <Section id="experience" index={index} heading={heading} subheading={subheading} tone="alt">
      <ol className="relative">
        {items.map((item, i) => (
          <ExperienceItem key={item.id} item={item} last={i === items.length - 1} />
        ))}
      </ol>
    </Section>
  );
}

function ExperienceItem({ item, last }: { item: ExperienceRow; last: boolean }) {
  const range = formatDateRange(item.start_date, item.end_date, item.currently_working);
  const orgUrl = safeUrl(item.organization_url);
  const logo = storageUrl(item.organization_logo);
  const achievements = item.achievements.filter((a) => a.trim());

  return (
    <li className="grid grid-cols-1 gap-x-10 md:grid-cols-[12rem_minmax(0,1fr)]" data-reveal>
      {/* Date column (desktop) */}
      <div className="hidden pt-1 text-right md:block">
        {range ? <p className="meta text-muted">{range}</p> : null}
        {item.location ? <p className="mt-1 text-[0.8rem] text-subtle">{item.location}</p> : null}
      </div>

      <div className={`relative border-l border-border pl-6 sm:pl-8 ${last ? "pb-2" : "pb-12"}`}>
        <span
          aria-hidden="true"
          className="absolute -left-[5px] top-2 size-[9px] rounded-full border-2 border-primary bg-bg-alt"
        />
        {/* Date line (mobile) */}
        <MetaList className="meta mb-2 md:hidden" items={[range, item.location]} />

        <div className="flex items-start gap-3">
          {logo ? (
            <div className="relative mt-0.5 size-10 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
              <Image src={logo} alt="" fill sizes="40px" className="object-contain p-1" />
            </div>
          ) : null}
          <div className="min-w-0">
            <h3 className="text-lg font-semibold leading-snug tracking-tight">{item.role}</h3>
            <p className="mt-0.5 text-[0.95rem] text-muted">
              {orgUrl ? (
                <ExternalLink href={orgUrl} className="inline-flex items-center gap-1 hover:text-primary">
                  {item.organization}
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </ExternalLink>
              ) : (
                item.organization
              )}
              {item.employment_type ? (
                <span className="text-subtle"> · {item.employment_type}</span>
              ) : null}
            </p>
          </div>
        </div>

        {item.short_description ? (
          <p className="mt-4 max-w-2xl leading-relaxed text-fg/90">{item.short_description}</p>
        ) : null}

        {achievements.length > 0 ? (
          <ul className="mt-3 max-w-2xl space-y-1.5 text-[0.95rem] leading-relaxed text-muted">
            {achievements.map((a) => (
              <li key={a} className="relative pl-4">
                <span aria-hidden="true" className="absolute left-0 top-[0.7em] h-px w-2 bg-primary/60" />
                {a}
              </li>
            ))}
          </ul>
        ) : null}

        {item.detailed_description ? (
          <details className="group mt-3 max-w-2xl">
            <summary className="action-link text-primary">
              <span className="group-open:hidden">More detail</span>
              <span className="hidden group-open:inline">Less detail</span>
            </summary>
            <Markdown size="sm" className="mt-3 text-muted">
              {item.detailed_description}
            </Markdown>
          </details>
        ) : null}

        <TagList tags={item.technologies} className="mt-4" />
      </div>
    </li>
  );
}
