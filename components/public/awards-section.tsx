import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { AwardRow } from "@/types/database";
import { ExternalLink, Section } from "@/components/public/section";
import { formatPartialDate } from "@/lib/format/date";
import { storageUrl } from "@/lib/storage";
import { safeUrl } from "@/lib/utils";

type Props = {
  index: number;
  heading: string;
  subheading: string | null;
  items: AwardRow[];
};

export function AwardsSection({ index, heading, subheading, items }: Props) {
  const anyDates = items.some((a) => a.award_date);

  return (
    <Section id="awards" index={index} heading={heading} subheading={subheading} tone="alt">
      <ul className="divide-y divide-border border-y border-border">
        {items.map((award) => {
          const url = safeUrl(award.url);
          const image = storageUrl(award.image);
          const date = formatPartialDate(award.award_date);
          return (
            <li
              key={award.id}
              className={`grid grid-cols-1 gap-x-8 gap-y-1 py-5 ${anyDates ? "sm:grid-cols-[7rem_minmax(0,1fr)]" : ""}`}
              data-reveal
            >
              {anyDates ? <p className="meta pt-1 max-sm:empty:hidden">{date}</p> : null}
              <div className="flex min-w-0 items-start gap-4">
                {image ? (
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                    <Image src={image} alt={award.image_alt ?? ""} fill sizes="44px" className="object-contain p-1" />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold leading-snug tracking-tight">
                    {url ? (
                      <ExternalLink href={url} className="group inline-flex items-start gap-1 hover:text-primary">
                        {award.title}
                        <ArrowUpRight
                          className="mt-0.5 size-3.5 shrink-0 text-subtle transition-colors group-hover:text-primary"
                          aria-hidden="true"
                        />
                      </ExternalLink>
                    ) : (
                      award.title
                    )}
                  </h3>
                  {award.issuer ? <p className="mt-0.5 text-sm text-primary">{award.issuer}</p> : null}
                  {award.description ? (
                    <p className="mt-1.5 max-w-3xl text-[0.93rem] leading-relaxed text-muted">{award.description}</p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
