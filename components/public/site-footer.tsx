import Link from "next/link";
import { SocialIcon, type ResolvedLink } from "@/components/public/social-icon";

type Props = {
  name: string;
  title: string | null;
  footerText: string | null;
  links: ResolvedLink[];
};

export function SiteFooter({ name, title, footerText, links }: Props) {
  const iconLinks = links.filter((l) => l.href !== null);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="container-page flex flex-col gap-8 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <Link href="/" className="text-[0.95rem] font-medium tracking-tight hover:text-primary">
            {name}
          </Link>
          {title ? <p className="text-sm text-muted">{title}</p> : null}
          {footerText ? <p className="max-w-md pt-1 text-sm text-subtle">{footerText}</p> : null}
        </div>
        <div className="flex flex-col gap-4 sm:items-end">
          {iconLinks.length > 0 ? (
            <ul className="-ml-2 flex flex-wrap items-center gap-1 sm:ml-0 sm:-mr-2">
              {iconLinks.map((link) => (
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
          <p className="meta" suppressHydrationWarning>
            © {year} {name}
          </p>
        </div>
      </div>
    </footer>
  );
}
