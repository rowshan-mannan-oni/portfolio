import type { SiteSettingsRow } from "@/types/database";
import { Markdown } from "@/components/markdown";
import { Section } from "@/components/public/section";

type Props = {
  index: number;
  heading: string;
  subheading: string | null;
  settings: SiteSettingsRow;
};

export function AboutSection({ index, heading, subheading, settings }: Props) {
  const facts = [
    { label: "Currently", value: settings.current_status },
    { label: "Based in", value: settings.location },
    { label: "Open to", value: settings.availability },
  ].filter((f): f is { label: string; value: string } => Boolean(f.value));

  return (
    <Section id="about" index={index} heading={heading} subheading={subheading}>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16" data-reveal>
        <div className="space-y-6">
          {settings.about_heading ? (
            <p className="font-serif text-[1.65rem] leading-snug text-fg sm:text-[1.9rem]">
              {settings.about_heading}
            </p>
          ) : null}
          {settings.about_short_bio ? (
            <p className="text-[1.02rem] leading-relaxed text-muted">{settings.about_short_bio}</p>
          ) : null}
          {facts.length > 0 ? (
            <dl className="divide-y divide-border border-y border-border">
              {facts.map((fact) => (
                <div key={fact.label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-4 py-3 text-sm">
                  <dt className="meta pt-px">{fact.label}</dt>
                  <dd className="text-fg">{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
        {settings.about_long_bio ? (
          <Markdown className="text-muted [&_strong]:text-fg">{settings.about_long_bio}</Markdown>
        ) : null}
      </div>
    </Section>
  );
}
