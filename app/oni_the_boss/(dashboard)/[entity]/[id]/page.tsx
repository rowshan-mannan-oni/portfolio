import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { EntityForm } from "@/components/admin/entity-form";
import { PageHeader } from "@/components/admin/page-header";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { ProjectImagesManager } from "@/components/admin/project-images-manager";
import { deleteEntity, saveEntity } from "@/lib/admin/actions/content";
import { ENTITY_CONFIG, isRoutedEntity } from "@/lib/admin/entity-config";
import { adminDb } from "@/lib/admin/page-data";
import { adminPath } from "@/lib/admin/routes";
import { generic, isUuid } from "@/lib/admin/server-utils";
import type { ProjectImageRow } from "@/types/database";

type Props = { params: Promise<{ entity: string; id: string }> };

export const metadata: Metadata = { title: "Edit" };

export default async function EditEntityPage({ params }: Props) {
  const { entity, id } = await params;
  if (!isRoutedEntity(entity) || !isUuid(id)) notFound();
  const config = ENTITY_CONFIG[entity];
  const typed = await adminDb();
  const db = generic(typed);

  const { data: row, error } = await db.from(config.table).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!row) notFound();

  const [publications, images] = await Promise.all([
    entity === "research"
      ? typed.from("publications").select("id, title").order("display_order").then((r) => r.data ?? [])
      : Promise.resolve([]),
    entity === "projects"
      ? typed.from("project_images").select("*").eq("project_id", id).order("display_order").then((r) => r.data ?? [])
      : Promise.resolve([] as ProjectImageRow[]),
  ]);

  const record = row as Record<string, unknown>;
  const title = String(record[config.titleColumn] ?? `Edit ${config.singular}`);

  return (
    <>
      <PageHeader
        title={title}
        back={{ href: adminPath(entity), label: config.label }}
        actions={
          <ConfirmAction
            action={async () => {
              "use server";
              const result = await deleteEntity(entity, id);
              return result.ok ? { ...result, redirectTo: adminPath(entity) } : result;
            }}
            className="btn btn-ghost btn-sm text-danger"
            confirmTitle={`Delete this ${config.singular}?`}
            confirmBody={`“${title}” will be permanently deleted${config.mediaColumns.length > 0 ? " with its uploaded images" : ""}.`}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete
          </ConfirmAction>
        }
      />
      <div className="space-y-8">
        <EntityForm key={String(record.updated_at ?? "")} entity={entity} row={record} action={saveEntity.bind(null, entity, id)} publications={publications} />
        {entity === "projects" ? <ProjectImagesManager projectId={id} images={images as ProjectImageRow[]} /> : null}
      </div>
    </>
  );
}
