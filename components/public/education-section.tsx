import Image from "next/image";
import type { EducationRow } from "@/types/database";
import { ExternalLink, MetaList, Section } from "@/components/public/section";
import { formatDateRange } from "@/lib/format/date";
import { storageUrl } from "@/lib/storage";
import { safeUrl } from "@/lib/utils";

type Props = {
  index: number;
  heading: string;
  subheading: string | null;
  items: EducationRow[];
};

export function EducationSection({ index, heading, subheading, items }: Props) {
  return (
    <Section id="education" index={index} heading={heading} subheading={subheading}>
      <ul className={`grid grid-cols-1 gap-4 ${items.length > 1 ? "md:grid-cols-2" : "max-w-2xl"}`}>
        {items.map((item) => {
          const url = safeUrl(item.institution_url);
          const logo = storageUrl(item.logo);
          const range = formatDateRange(item.start_date, item.end_date);
          return (
            <li key={item.id} className="card flex gap-4 p-6 sm:p-7" data-reveal>
              {logo ? (
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                  <Image src={logo} alt="" fill sizes="48px" className="object-contain p-1.5" />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <MetaList className="meta" items={[range, item.location]} />
                <h3 className="mt-2 text-lg font-semibold leading-snug tracking-tight">
                  {url ? (
                    <ExternalLink href={url} className="hover:text-primary">
                      {item.institution}
                    </ExternalLink>
                  ) : (
                    item.institution
                  )}
                </h3>
                {item.degree ? <p className="mt-1 text-[0.97rem]">{item.degree}</p> : null}
                {item.department ? <p className="mt-0.5 text-sm text-muted">{item.department}</p> : null}
                {item.grade ? <p className="badge mt-3">{item.grade}</p> : null}
                {item.description ? (
                  <p className="mt-3 text-[0.93rem] leading-relaxed text-muted">{item.description}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
