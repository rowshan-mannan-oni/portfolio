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
import type { ActionResult } from "@/lib/admin/action-result";
import { ProjectForm } from "@/components/admin/forms/project-form";
import { ResearchForm } from "@/components/admin/forms/research-form";
import { PublicationForm } from "@/components/admin/forms/publication-form";
import { AwardForm, EducationForm, ExperienceForm, SocialLinkForm } from "@/components/admin/forms/simple-forms";

type Props = {
  entity: RoutedEntityKey;
  row: Record<string, unknown> | null;
  action: (fd: FormData) => Promise<ActionResult>;
  publications: Array<{ id: string; title: string }>;
};

/** Picks the right form for an entity (server component; forms are client). */
export function EntityForm({ entity, row, action, publications }: Props) {
  switch (entity) {
    case "projects":
      return <ProjectForm row={row as ProjectRow | null} action={action} />;
    case "research":
      return <ResearchForm row={row as ResearchRow | null} action={action} publications={publications} />;
    case "publications":
      return <PublicationForm row={row as PublicationRow | null} action={action} />;
    case "experience":
      return <ExperienceForm row={row as ExperienceRow | null} action={action} />;
    case "education":
      return <EducationForm row={row as EducationRow | null} action={action} />;
    case "awards":
      return <AwardForm row={row as AwardRow | null} action={action} />;
    case "social":
      return <SocialLinkForm row={row as SocialLinkRow | null} action={action} />;
  }
}
