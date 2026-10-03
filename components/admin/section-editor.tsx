"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import type { SectionSettingsRow } from "@/types/database";
import type { ActionResult } from "@/lib/admin/action-result";
import { AdminForm } from "@/components/admin/admin-form";
import { CheckboxField, TextField } from "@/components/admin/fields";
import { ActionButton } from "@/components/admin/confirm-action";
import { StatusPill } from "@/components/admin/row-actions";

type Props = {
  section: SectionSettingsRow;
  save: (fd: FormData) => Promise<ActionResult>;
  moveUp: () => Promise<ActionResult>;
  moveDown: () => Promise<ActionResult>;
  isFirst: boolean;
  isLast: boolean;
  hasContent: boolean;
};

export function SectionEditor({ section, save, moveUp, moveDown, isFirst, isLast, hasContent }: Props) {
  return (
    <details className="card group overflow-hidden">
      <summary className="flex items-center gap-3 p-4">
        <span className="meta w-6">{String(section.display_order).padStart(2, "0")}</span>
        <span className="flex-1 font-medium">
          {section.heading}
          <span className="ml-2 font-mono text-xs text-subtle">#{section.key}</span>
        </span>
        {!section.visible ? <StatusPill tone="muted">Hidden</StatusPill> : null}
        {section.visible && !hasContent ? <StatusPill tone="warning">No content — not shown</StatusPill> : null}
        <span className="flex gap-0.5" onClick={(e) => e.preventDefault()}>
          <ActionButton action={moveUp} label={`Move ${section.heading} up`} className="btn btn-ghost btn-icon size-8 min-h-8" disabled={isFirst}>
            <ArrowUp className="size-4" aria-hidden="true" />
          </ActionButton>
          <ActionButton action={moveDown} label={`Move ${section.heading} down`} className="btn btn-ghost btn-icon size-8 min-h-8" disabled={isLast}>
            <ArrowDown className="size-4" aria-hidden="true" />
          </ActionButton>
        </span>
      </summary>
      <div className="border-t border-border p-4">
        <AdminForm action={save} submitLabel="Save section" className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField name="heading" label="Heading" required defaultValue={section.heading} />
            <TextField
              name="nav_label"
              label="Navigation label"
              defaultValue={section.nav_label}
              hint="Leave empty to keep this section out of the menu."
            />
            <TextField name="subheading" label="Subheading" defaultValue={section.subheading} wide />
          </div>
          <CheckboxField
            name="visible"
            label="Show this section"
            hint="Hidden sections disappear from the page and the navigation."
            defaultChecked={section.visible}
          />
        </AdminForm>
      </div>
    </details>
  );
}
