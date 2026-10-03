import Link from "next/link";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Star, Trash2 } from "lucide-react";
import { ActionButton, ConfirmAction } from "@/components/admin/confirm-action";
import { deleteEntity, moveEntity, toggleEntityFlag } from "@/lib/admin/actions/content";
import { ENTITY_CONFIG, type EntityKey } from "@/lib/admin/entity-config";
import { cn } from "@/lib/utils";

type Props = {
  entity: EntityKey;
  id: string;
  title: string;
  visible?: boolean;
  featured?: boolean;
  isFirst: boolean;
  isLast: boolean;
  editHref?: string;
  /** Hide the reorder buttons (e.g. while a search filter is active). */
  orderable?: boolean;
};

/** Standard per-row controls: reorder, visibility, feature, edit, delete. */
export function RowActions({ entity, id, title, visible, featured, isFirst, isLast, editHref, orderable = true }: Props) {
  const config = ENTITY_CONFIG[entity];
  const flags = config.flags as readonly string[];
  const iconBtn = "btn btn-ghost btn-icon size-8 min-h-8";

  return (
    <div className="flex flex-wrap items-center justify-end gap-0.5">
      {orderable ? (
        <>
          <ActionButton action={moveEntity.bind(null, entity, id, "up")} label={`Move “${title}” up`} className={iconBtn} disabled={isFirst}>
            <ArrowUp className="size-4" aria-hidden="true" />
          </ActionButton>
          <ActionButton action={moveEntity.bind(null, entity, id, "down")} label={`Move “${title}” down`} className={iconBtn} disabled={isLast}>
            <ArrowDown className="size-4" aria-hidden="true" />
          </ActionButton>
        </>
      ) : null}
      {flags.includes("featured") && featured !== undefined ? (
        <ActionButton
          action={toggleEntityFlag.bind(null, entity, id, "featured")}
          label={featured ? `Unfeature “${title}”` : `Feature “${title}”`}
          className={cn(iconBtn, featured && "text-warning")}
        >
          <Star className="size-4" aria-hidden="true" fill={featured ? "currentColor" : "none"} />
        </ActionButton>
      ) : null}
      {flags.includes("visible") && visible !== undefined ? (
        <ActionButton
          action={toggleEntityFlag.bind(null, entity, id, "visible")}
          label={visible ? `Hide “${title}”` : `Show “${title}”`}
          className={iconBtn}
        >
          {visible ? <Eye className="size-4" aria-hidden="true" /> : <EyeOff className="size-4 text-subtle" aria-hidden="true" />}
        </ActionButton>
      ) : null}
      {editHref ? (
        <Link href={editHref} className={iconBtn} aria-label={`Edit “${title}”`} title="Edit">
          <Pencil className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
      <ConfirmAction
        action={deleteEntity.bind(null, entity, id)}
        label={`Delete “${title}”`}
        className={cn(iconBtn, "hover:text-danger")}
        confirmTitle={`Delete this ${config.singular}?`}
        confirmBody={`“${title}” will be permanently deleted${config.mediaColumns.length > 0 ? ", along with its uploaded images" : ""}. This cannot be undone.`}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </ConfirmAction>
    </div>
  );
}

export function StatusPill({ tone, children }: { tone: "muted" | "primary" | "warning" | "danger"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-medium",
        tone === "muted" && "bg-surface-muted text-subtle ring-1 ring-border",
        tone === "primary" && "bg-soft text-soft-fg",
        tone === "warning" && "bg-warning-soft text-warning",
        tone === "danger" && "bg-danger-soft text-danger",
      )}
    >
      {children}
    </span>
  );
}
