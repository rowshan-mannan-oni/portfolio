import type {
  AwardRow,
  EducationRow,
  ExperienceRow,
  ProjectRow,
  PublicationRow,
  ResearchRow,
  SocialLinkRow,
} from "@/types/database";
import type { RoutedEntityKey } from "@/lib/admin/entity-config";
import { formatDateRange, formatPartialDate } from "@/lib/format/date";

export type Summary = { title: string; subtitle: string | null; warning?: string | null };

type RowFor = {
  projects: ProjectRow;
  research: ResearchRow;
  publications: PublicationRow;
  experience: ExperienceRow;
  education: EducationRow;
  awards: AwardRow;
  social: SocialLinkRow;
};

const join = (...parts: Array<string | null | undefined | false>) =>
  parts.filter(Boolean).join(" · ") || null;

/** Title + one-line context for admin list rows. */
export function summarize<K extends RoutedEntityKey>(entity: K, row: RowFor[K]): Summary {
  switch (entity) {
    case "projects": {
      const r = row as ProjectRow;
      return { title: r.title, subtitle: join(r.organization, formatDateRange(r.start_date, r.end_date), r.technologies.slice(0, 4).join(", ")) };
    }
    case "research": {
      const r = row as ResearchRow;
      return { title: r.title, subtitle: join(r.research_type, r.institution, formatDateRange(r.start_date, r.end_date)) };
    }
    case "publications": {
      const r = row as PublicationRow;
      return { title: r.title, subtitle: join(r.venue, r.year ? String(r.year) : null, r.quartile) };
    }
    case "experience": {
      const r = row as ExperienceRow;
      return { title: r.role, subtitle: join(r.organization, formatDateRange(r.start_date, r.end_date, r.currently_working)) };
    }
    case "education": {
      const r = row as EducationRow;
      return { title: r.institution, subtitle: join(r.degree, formatDateRange(r.start_date, r.end_date)) };
    }
    case "awards": {
      const r = row as AwardRow;
      return { title: r.title, subtitle: join(r.issuer, formatPartialDate(r.award_date)) };
    }
    case "social": {
      const r = row as SocialLinkRow;
      return {
        title: r.label,
        subtitle: r.value ?? null,
        warning: r.value ? null : "No value — not shown on the site",
      };
    }
  }
  return { title: "Untitled", subtitle: null };
}
