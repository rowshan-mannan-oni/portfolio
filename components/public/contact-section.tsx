import { ContactForm } from "@/components/public/contact-form";
import { Section } from "@/components/public/section";
import { SocialIcon, type ResolvedLink } from "@/components/public/social-icon";

type Props = {
  index: number;
  heading: string;
  subheading: string | null;
  availability: string | null;
  links: ResolvedLink[];
};

export function ContactSection({ index, heading, subheading, availability, links }: Props) {
  return (
    <Section id="contact" index={index} heading={heading} subheading={subheading} tone="alt">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div className="space-y-8" data-reveal>
          {availability ? (
            <p className="font-serif text-[1.35rem] leading-relaxed text-fg">{availability}</p>
          ) : null}
          {links.length > 0 ? (
            <ul className="divide-y divide-border border-y border-border">
              {links.map((link) => (
                <li key={link.id}>
                  {link.href ? (
                    <a
                      href={link.href}
                      className="group flex items-center gap-4 py-3.5"
                      {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      <ContactRow link={link} />
                    </a>
                  ) : (
                    <div className="flex items-center gap-4 py-3.5">
                      <ContactRow link={link} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div data-reveal>
          <ContactForm />
        </div>
      </div>
    </Section>
  );
}

function ContactRow({ link }: { link: ResolvedLink }) {
  return (
    <>
      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-muted transition-colors group-hover:border-primary/40 group-hover:text-primary">
        <SocialIcon platform={link.platform} className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="meta block">{link.label}</span>
        <span className="block truncate text-[0.95rem] text-fg transition-colors group-hover:text-primary">
          {link.display}
        </span>
      </span>
    </>
  );
}
