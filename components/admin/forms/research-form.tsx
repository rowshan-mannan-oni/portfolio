"use client";

import type { ResearchRow } from "@/types/database";
import type { ActionResult } from "@/lib/admin/action-result";
import { AdminForm, FormSection } from "@/components/admin/admin-form";
import { CheckboxField, ListField, PartialDateField, SelectField, TagsField, TextAreaField, TextField } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/image-field";
import { MarkdownEditor } from "@/components/admin/markdown-editor";

type Props = {
  row: ResearchRow | null;
  action: (fd: FormData) => Promise<ActionResult>;
  publications: Array<{ id: string; title: string }>;
};

export function ResearchForm({ row, action, publications }: Props) {
  return (
    <AdminForm action={action} submitLabel={row ? "Save research" : "Create research item"} stickyFooter>
      <FormSection title="Overview">
        <TextField name="title" label="Title" required defaultValue={row?.title} wide maxLength={300} />
        <TextAreaField name="short_description" label="Summary" defaultValue={row?.short_description} rows={3} hint="The first thing visitors read — keep it accessible." />
        <TextField name="research_type" label="Type" defaultValue={row?.research_type} placeholder="e.g. Undergraduate thesis" />
        <TextField name="status" label="Status" defaultValue={row?.status} placeholder="e.g. Ongoing, Completed" />
        <TextField name="institution" label="Institution" defaultValue={row?.institution} />
        <TextField name="supervisor" label="Supervisor" defaultValue={row?.supervisor} />
        <PartialDateField name="start_date" label="Start" defaultValue={row?.start_date} />
        <PartialDateField name="end_date" label="End" defaultValue={row?.end_date} />
      </FormSection>

      <FormSection title="Narrative" description="Shown as three short columns. Leave any of them empty to omit it.">
        <TextAreaField name="problem" label="The problem" defaultValue={row?.problem} rows={3} />
        <TextAreaField name="approach" label="Approach" defaultValue={row?.approach} rows={3} />
        <TextAreaField name="significance" label="Why it matters" defaultValue={row?.significance} rows={3} />
      </FormSection>

      <FormSection title="Details">
        <TagsField name="methods" label="Methods" defaultValue={row?.methods} wide />
        <ListField name="highlights" label="Key findings" defaultValue={row?.highlights} rows={4} />
        <TextField name="dataset" label="Dataset" defaultValue={row?.dataset} wide />
        <TagsField name="keywords" label="Keywords" defaultValue={row?.keywords} wide />
        <MarkdownEditor name="full_description" label="Extended description" defaultValue={row?.full_description} rows={8} hint="Shown behind “Read more”. Markdown supported." />
      </FormSection>

      <FormSection title="Links & media">
        <TextField name="paper_url" label="Paper" type="url" defaultValue={row?.paper_url} />
        <TextField name="code_url" label="Code" type="url" defaultValue={row?.code_url} />
        <TextField name="project_url" label="Project page" type="url" defaultValue={row?.project_url} />
        <SelectField
          name="related_publication_id"
          label="Related publication"
          defaultValue={row?.related_publication_id}
          placeholder="None"
          options={publications.map((p) => ({ value: p.id, label: p.title.length > 80 ? `${p.title.slice(0, 80)}…` : p.title }))}
        />
        <ImageField name="image" label="Figure or image" folder={`research/${row?.id ?? "drafts"}`} defaultValue={row?.image} altName="image_alt" altDefaultValue={row?.image_alt} hint="PNG or WebP up to 5 MB. Portrait figures (e.g. 960 × 1440) suit the 320 px desktop column. The full image is shown without cropping on the site." />
      </FormSection>

      <FormSection title="Publishing">
        <CheckboxField name="visible" label="Visible on the site" defaultChecked={row?.visible ?? true} />
        <CheckboxField name="featured" label="Featured" hint="Featured items are listed first." defaultChecked={row?.featured ?? false} />
      </FormSection>
    </AdminForm>
  );
}
