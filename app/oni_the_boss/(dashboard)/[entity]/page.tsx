import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/admin/page-header";
import { RowActions, StatusPill } from "@/components/admin/row-actions";
import { ENTITY_CONFIG, isRoutedEntity, type RoutedEntityKey } from "@/lib/admin/entity-config";
import { summarize } from "@/lib/admin/entity-summary";
import { adminDb } from "@/lib/admin/page-data";
import { adminPath } from "@/lib/admin/routes";
import { generic } from "@/lib/admin/server-utils";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ entity: string }>;
  searchParams: Promise<{ q?: string; filter?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { entity } = await params;
  return { title: isRoutedEntity(entity) ? ENTITY_CONFIG[entity].label : "Not found" };
}

type ListRow = { id: string; visible: boolean; featured?: boolean } & Record<string, unknown>;

export default async function EntityListPage({ params, searchParams }: Props) {
  const { entity } = await params;
  if (!isRoutedEntity(entity)) notFound();
  const { q = "", filter = "all" } = await searchParams;
  const config = ENTITY_CONFIG[entity];
  const db = generic(await adminDb());

  let query = db.from(config.table).select("*").order("display_order").order("created_at");
  const search = q.trim().slice(0, 100);
  if (search) query = query.ilike(config.titleColumn, `%${search.replace(/[%_,()]/g, " ")}%`);
  if (filter === "visible") query = query.eq("visible", true);
  if (filter === "hidden") query = query.eq("visible", false);
  if (filter === "featured" && (config.flags as readonly string[]).includes("featured")) query = query.eq("featured", true);

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as ListRow[];
  const filtered = Boolean(search) || filter !== "all";

  const filters = [
    { key: "all", label: "All" },
    { key: "visible", label: "Visible" },
    { key: "hidden", label: "Hidden" },
    ...((config.flags as readonly string[]).includes("featured") ? [{ key: "featured", label: "Featured" }] : []),
  ];

  return (
    <>
      <PageHeader
        title={config.label}
        description={config.description}
        actions={
          <Link href={adminPath(entity, "new")} className="btn btn-primary btn-sm">
            <Plus className="size-4" aria-hidden="true" />
            New {config.singular}
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Filter" className="flex flex-wrap gap-1">
          {filters.map((f) => (
            <Link
              key={f.key}
              href={`?filter=${f.key}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
              aria-current={filter === f.key ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm",
                filter === f.key ? "bg-soft font-medium text-soft-fg" : "text-muted hover:bg-surface",
              )}
            >
              {f.label}
            </Link>
          ))}
        </nav>
        <form role="search" className="relative sm:w-64">
          <input type="hidden" name="filter" value={filter} />
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
          <label htmlFor="admin-search" className="sr-only">
            Search {config.label.toLowerCase()}
          </label>
          <input id="admin-search" name="q" defaultValue={search} placeholder="Search…" className="input pl-9" />
        </form>
      </div>

      {rows.length === 0 ? (
        filtered ? (
          <EmptyState title="Nothing matches this filter." action={<Link href="?" className="link text-sm">Clear filters</Link>} />
        ) : (
          <EmptyState
            title={`No ${config.label.toLowerCase()} yet.`}
            body={`Add your first ${config.singular}. Hidden or empty sections never appear on the public site.`}
            action={
              <Link href={adminPath(entity, "new")} className="btn btn-primary btn-sm">
                <Plus className="size-4" aria-hidden="true" />
                New {config.singular}
              </Link>
            }
          />
        )
      ) : (
        <ul className="card divide-y divide-border overflow-hidden">
          {rows.map((row, i) => {
            const s = summarize(entity as RoutedEntityKey, row as never);
            return (
              <li key={row.id} className={cn("flex flex-col gap-3 p-4 sm:flex-row sm:items-center", !row.visible && "bg-surface-muted/60")}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={adminPath(entity, row.id)} className="font-medium hover:text-primary">
                      {s.title}
                    </Link>
                    {!row.visible ? <StatusPill tone="muted">Hidden</StatusPill> : null}
                    {row.featured ? <StatusPill tone="primary">Featured</StatusPill> : null}
                    {s.warning ? <StatusPill tone="warning">{s.warning}</StatusPill> : null}
                  </div>
                  {s.subtitle ? <p className="mt-0.5 truncate text-sm text-muted">{s.subtitle}</p> : null}
                </div>
                <RowActions
                  entity={entity}
                  id={row.id}
                  title={s.title}
                  visible={row.visible}
                  featured={typeof row.featured === "boolean" ? row.featured : undefined}
                  isFirst={i === 0}
                  isLast={i === rows.length - 1}
                  editHref={adminPath(entity, row.id)}
                  orderable={!filtered}
                />
              </li>
            );
          })}
        </ul>
      )}
      {filtered && rows.length > 0 ? (
        <p className="mt-3 text-xs text-subtle">Clear the filter to reorder items.</p>
      ) : null}
    </>
  );
}
