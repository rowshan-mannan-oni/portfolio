import Image from "next/image";
import { BookOpen, FileText, Globe, PlayCircle } from "lucide-react";
import { SocialIcon } from "@/components/public/social-icon";
import type { ProjectWithImages } from "@/lib/data/public";
import type { ProjectStatus } from "@/types/database";
import { Markdown } from "@/components/markdown";
import { ProjectGallery } from "@/components/public/project-gallery";
import { ExternalLink, MetaList, Section, TagList } from "@/components/public/section";
import { formatDateRange } from "@/lib/format/date";
import { storageUrl } from "@/lib/storage";
import { cn, initials, safeUrl } from "@/lib/utils";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "Active",
  completed: "Completed",
  research: "Research",
  archived: "Archived",
};

type Props = {
  index: number;
  heading: string;
  subheading: string | null;
  items: ProjectWithImages[];
};

export function ProjectsSection({ index, heading, subheading, items }: Props) {
  const featured = items.filter((p) => p.featured);
  const others = items.filter((p) => !p.featured);

  return (
    <Section id="projects" index={index} heading={heading} subheading={subheading}>
      {featured.length > 0 ? (
        <div className="space-y-16 md:space-y-24">
          {featured.map((project, i) => (
            <FeaturedProject key={project.id} project={project} flip={i % 2 === 1} />
          ))}
        </div>
      ) : null}

      {others.length > 0 ? (
        <div className={featured.length > 0 ? "mt-20 md:mt-28" : undefined}>
          {featured.length > 0 ? (
            <h3 className="eyebrow mb-6 flex items-center gap-3" data-reveal>
              Other projects
              <span aria-hidden="true" className="h-px flex-1 bg-border" />
            </h3>
          ) : null}
          <ul className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((project) => (
              <li key={project.id} className="flex" data-reveal>
                <CompactProject project={project} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Section>
  );
}

type ProjectLink = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

function GithubIcon({ className }: { className?: string }) {
  return <SocialIcon platform="github" className={className} />;
}

function projectLinks(project: ProjectWithImages): ProjectLink[] {
  const candidates: Array<Omit<ProjectLink, "href"> & { href: string | null }> = [
    { href: safeUrl(project.live_url), label: "Live demo", icon: Globe },
    { href: safeUrl(project.github_url), label: "Source", icon: GithubIcon },
    { href: safeUrl(project.video_url), label: "Video", icon: PlayCircle },
    { href: safeUrl(project.docs_url), label: "Docs", icon: FileText },
    { href: safeUrl(project.paper_url), label: "Paper", icon: BookOpen },
  ];
  return candidates.filter((l): l is ProjectLink => l.href !== null);
}

function ProjectMeta({ project }: { project: ProjectWithImages }) {
  return (
    <MetaList
      className="meta"
      items={[
        project.organization,
        formatDateRange(project.start_date, project.end_date),
        project.role,
        project.status ? STATUS_LABEL[project.status] : null,
      ]}
    />
  );
}

function ProjectPlaceholder({ title, technologies }: { title: string; technologies: string[] }) {
  return (
    <div className="texture-dots flex size-full flex-col justify-between bg-soft/50 p-6 sm:p-8" aria-hidden="true">
      <span className="font-serif text-5xl text-primary/70 sm:text-6xl">{initials(title)}</span>
      {technologies.length > 0 ? (
        <span className="meta text-soft-fg/80">{technologies.slice(0, 3).join(" / ")}</span>
      ) : null}
    </div>
  );
}

function FeaturedProject({ project, flip }: { project: ProjectWithImages; flip: boolean }) {
  const thumb = storageUrl(project.thumbnail);
  const links = projectLinks(project);
  const gallery = project.images
    .map((img) => {
      const url = storageUrl(img.path);
      return url ? { id: img.id, url, alt: img.alt_text ?? "", caption: img.caption } : null;
    })
    .filter((g) => g !== null);
  const hasDetails = Boolean(project.full_description) || gallery.length > 0;

  return (
    <article className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12 lg:gap-16" data-reveal>
      <div className={cn("relative", flip && "md:order-2")}>
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-surface-muted">
          {thumb ? (
            <Image
              src={thumb}
              alt={project.thumbnail_alt ?? `${project.title} preview`}
              fill
              sizes="(min-width: 1152px) 540px, (min-width: 768px) 45vw, 100vw"
              className="object-cover transition-transform duration-700 hover:scale-[1.02]"
            />
          ) : (
            <ProjectPlaceholder title={project.title} technologies={project.technologies} />
          )}
        </div>
      </div>

      <div className={cn("min-w-0", flip && "md:order-1")}>
        <ProjectMeta project={project} />
        <h3 className="mt-2.5 text-2xl font-semibold leading-tight tracking-tight sm:text-[1.65rem]">
          {project.title}
        </h3>
        {project.short_description ? (
          <p className="mt-4 leading-relaxed text-muted">{project.short_description}</p>
        ) : null}
        <TagList tags={project.technologies} className="mt-5" />
        {links.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {links.map(({ href, label, icon: Icon }) => (
              <ExternalLink key={label} href={href} className="action-link" label={`${label}: ${project.title}`}>
                <Icon className="size-4" />
                {label}
              </ExternalLink>
            ))}
          </div>
        ) : null}
        {hasDetails ? (
          <details className="group mt-5 border-t border-border pt-4">
            <summary className="action-link text-primary">
              <span className="group-open:hidden">Project details</span>
              <span className="hidden group-open:inline">Hide details</span>
            </summary>
            <div className="mt-4 space-y-5">
              {project.full_description ? (
                <Markdown size="sm" className="text-muted">
                  {project.full_description}
                </Markdown>
              ) : null}
              <ProjectGallery images={gallery} title={project.title} />
            </div>
          </details>
        ) : null}
      </div>
    </article>
  );
}

function CompactProject({ project }: { project: ProjectWithImages }) {
  const links = projectLinks(project);
  const thumb = storageUrl(project.thumbnail);
  const tech = project.technologies.slice(0, 5);
  const extra = project.technologies.length - tech.length;

  return (
    <article className="card flex w-full flex-col p-5 transition-colors hover:border-border-strong sm:p-6">
      {thumb ? (
        <div className="relative -mx-5 -mt-5 mb-5 aspect-[16/9] overflow-hidden rounded-t-[13px] border-b border-border bg-surface-muted sm:-mx-6 sm:-mt-6">
          <Image
            src={thumb}
            alt={project.thumbnail_alt ?? `${project.title} preview`}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}
      <ProjectMeta project={project} />
      <h4 className="mt-1.5 text-[1.075rem] font-semibold leading-snug tracking-tight">{project.title}</h4>
      {project.short_description ? (
        <p className="mt-2.5 line-clamp-4 text-[0.92rem] leading-relaxed text-muted">{project.short_description}</p>
      ) : null}
      {tech.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          <TagList tags={tech} />
          {extra > 0 ? <span className="chip">+{extra}</span> : null}
        </div>
      ) : null}
      {links.length > 0 ? (
        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-5">
          {links.map(({ href, label, icon: Icon }) => (
            <ExternalLink key={label} href={href} className="action-link" label={`${label}: ${project.title}`}>
              <Icon className="size-3.5" />
              {label}
            </ExternalLink>
          ))}
        </div>
      ) : null}
    </article>
  );
}
