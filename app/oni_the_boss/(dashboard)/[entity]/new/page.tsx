import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityForm } from "@/components/admin/entity-form";
import { PageHeader } from "@/components/admin/page-header";
import { saveEntity } from "@/lib/admin/actions/content";
import { ENTITY_CONFIG, isRoutedEntity } from "@/lib/admin/entity-config";
import { adminDb } from "@/lib/admin/page-data";
import { adminPath } from "@/lib/admin/routes";

type Props = { params: Promise<{ entity: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { entity } = await params;
  return { title: isRoutedEntity(entity) ? `New ${ENTITY_CONFIG[entity].singular}` : "Not found" };
}

export default async function NewEntityPage({ params }: Props) {
  const { entity } = await params;
  if (!isRoutedEntity(entity)) notFound();
  const config = ENTITY_CONFIG[entity];
  const db = await adminDb();

  const publications =
    entity === "research"
      ? ((await db.from("publications").select("id, title").order("display_order")).data ?? [])
      : [];

  return (
    <>
      <PageHeader title={`New ${config.singular}`} back={{ href: adminPath(entity), label: config.label }} />
      <EntityForm entity={entity} row={null} action={saveEntity.bind(null, entity, null)} publications={publications} />
    </>
  );
}
