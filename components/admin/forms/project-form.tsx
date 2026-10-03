"use client";

import { useState } from "react";
import type { ProjectRow } from "@/types/database";
import { PROJECT_STATUSES } from "@/types/database";
import type { ActionResult } from "@/lib/admin/action-result";
import { AdminForm, FormSection } from "@/components/admin/admin-form";
import { CheckboxField, FieldShell, PartialDateField, SelectField, TagsField, TextAreaField, TextField } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/image-field";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { slugify } from "@/lib/utils";

type Props = { row: ProjectRow | null; action: (fd: FormData) => Promise<ActionResult> };

export function ProjectForm({ row, action }: Props) {
  const [slug, setSlug] = useState(row?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(row));

  return (
    <AdminForm action={action} submitLabel={row ? "Save project" : "Create project"} stickyFooter>
      <FormSection title="Basics">
        <FieldShell name="title" label="Title" required htmlFor="project-title">
          <input
            id="project-title"
            name="title"
            defaultValue={row?.title ?? ""}
            required
            maxLength={200}
            className="input"
            onChange={(e) => {
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </FieldShell>
        <FieldShell name="slug" label="Slug" required htmlFor="project-slug" hint="Used as a stable identifier.">
          <input
            id="project-slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            required
            maxLength={80}
            className="input font-mono text-sm"
          />
        </FieldShell>
        <TextAreaField
          name="short_description"
          label="Short description"
          defaultValue={row?.short_description}
          rows={3}
          maxLength={600}
          hint="One or two sentences shown on the card."
        />
        <TagsField name="technologies" label="Technologies" defaultValue={row?.technologies} wide />
      </FormSection>

      <FormSection title="Context">
        <TextField name="organization" label="Organization / event" defaultValue={row?.organization} />
        <TextField name="role" label="Your role" defaultValue={row?.role} />
        <PartialDateField name="start_date" label="Start" defaultValue={row?.start_date} />
        <PartialDateField name="end_date" label="End" defaultValue={row?.end_date} />
        <SelectField
          name="status"
          label="Status"
          defaultValue={row?.status}
          placeholder="Not shown"
          options={PROJECT_STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))}
        />
      </FormSection>

      <FormSection title="Links" description="Only links you fill in are shown.">
        <TextField name="github_url" label="Source code (GitHub)" type="url" defaultValue={row?.github_url} />
        <TextField name="live_url" label="Live demo" type="url" defaultValue={row?.live_url} />
        <TextField name="video_url" label="Video demo" type="url" defaultValue={row?.video_url} />
        <TextField name="docs_url" label="Documentation" type="url" defaultValue={row?.docs_url} />
        <TextField name="paper_url" label="Research paper" type="url" defaultValue={row?.paper_url} />
      </FormSection>

      <FormSection title="Media & details">
        <ImageField
          name="thumbnail"
          label="Thumbnail"
          folder={`projects/${row?.id ?? "drafts"}`}
          defaultValue={row?.thumbnail}
          altName="thumbnail_alt"
          altDefaultValue={row?.thumbnail_alt}
          hint="Shown on the project card. Without one, a calm placeholder is used."
        />
        <MarkdownEditor name="full_description" label="Full description" defaultValue={row?.full_description} rows={8} />
      </FormSection>

      <FormSection title="Publishing">
        <CheckboxField name="visible" label="Visible on the site" defaultChecked={row?.visible ?? true} />
        <CheckboxField
          name="featured"
          label="Featured"
          hint="Featured projects get a larger editorial layout."
          defaultChecked={row?.featured ?? false}
        />
      </FormSection>
    </AdminForm>
  );
}
