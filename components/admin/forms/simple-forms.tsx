"use client";

import type { AwardRow, EducationRow, ExperienceRow, SocialLinkRow } from "@/types/database";
import { SOCIAL_PLATFORMS } from "@/types/database";
import type { ActionResult } from "@/lib/admin/action-result";
import { AdminForm, FormSection } from "@/components/admin/admin-form";
import { CheckboxField, ListField, PartialDateField, SelectField, TagsField, TextAreaField, TextField } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/image-field";
import { MarkdownEditor } from "@/components/admin/markdown-editor";

type Action = (fd: FormData) => Promise<ActionResult>;

export function ExperienceForm({ row, action }: { row: ExperienceRow | null; action: Action }) {
  return (
    <AdminForm action={action} submitLabel={row ? "Save experience" : "Add experience"} stickyFooter>
      <FormSection title="Role">
        <TextField name="role" label="Role" required defaultValue={row?.role} />
        <TextField name="employment_type" label="Employment type" defaultValue={row?.employment_type} placeholder="e.g. Internship" />
        <TextField name="organization" label="Organization" required defaultValue={row?.organization} />
        <TextField name="organization_url" label="Organization website" type="url" defaultValue={row?.organization_url} />
        <TextField name="location" label="Location" defaultValue={row?.location} />
        <div className="hidden sm:block" />
        <PartialDateField name="start_date" label="Start" defaultValue={row?.start_date} />
        <PartialDateField name="end_date" label="End" defaultValue={row?.end_date} />
        <CheckboxField name="currently_working" label="I currently work here" hint="Shows “Present” instead of an end date." defaultChecked={row?.currently_working ?? false} />
      </FormSection>
      <FormSection title="Description">
        <TextAreaField name="short_description" label="Summary" defaultValue={row?.short_description} rows={3} />
        <ListField name="achievements" label="Key contributions" defaultValue={row?.achievements} rows={5} />
        <TagsField name="technologies" label="Technologies" defaultValue={row?.technologies} wide />
        <MarkdownEditor name="detailed_description" label="Extended description" defaultValue={row?.detailed_description} rows={6} hint="Shown behind “More detail”." />
      </FormSection>
      <FormSection title="Logo & visibility">
        <ImageField name="organization_logo" label="Organization logo" folder={`experience/${row?.id ?? "drafts"}`} defaultValue={row?.organization_logo} aspect="square" hint="Square logos work best. Omitted when empty." />
        <CheckboxField name="visible" label="Visible on the site" defaultChecked={row?.visible ?? true} />
      </FormSection>
    </AdminForm>
  );
}

export function EducationForm({ row, action }: { row: EducationRow | null; action: Action }) {
  return (
    <AdminForm action={action} submitLabel={row ? "Save education" : "Add education"} stickyFooter>
      <FormSection title="Institution">
        <TextField name="institution" label="Institution" required defaultValue={row?.institution} />
        <TextField name="institution_url" label="Website" type="url" defaultValue={row?.institution_url} />
        <TextField name="degree" label="Degree / programme" defaultValue={row?.degree} />
        <TextField name="department" label="Department / school" defaultValue={row?.department} />
        <TextField name="location" label="Location" defaultValue={row?.location} />
        <TextField name="grade" label="Grade" defaultValue={row?.grade} placeholder="e.g. CGPA 3.96 / 4.00" />
        <PartialDateField name="start_date" label="Start" defaultValue={row?.start_date} />
        <PartialDateField name="end_date" label="End" defaultValue={row?.end_date} />
        <TextAreaField name="description" label="Description" defaultValue={row?.description} rows={3} />
      </FormSection>
      <FormSection title="Logo & visibility">
        <ImageField name="logo" label="Logo" folder={`education/${row?.id ?? "drafts"}`} defaultValue={row?.logo} aspect="square" />
        <CheckboxField name="visible" label="Visible on the site" hint="Hidden entries are stored privately." defaultChecked={row?.visible ?? true} />
      </FormSection>
    </AdminForm>
  );
}

export function AwardForm({ row, action }: { row: AwardRow | null; action: Action }) {
  return (
    <AdminForm action={action} submitLabel={row ? "Save award" : "Add award"} stickyFooter>
      <FormSection title="Award">
        <TextField name="title" label="Title" required defaultValue={row?.title} />
        <TextField name="issuer" label="Issuer / event" defaultValue={row?.issuer} />
        <PartialDateField name="award_date" label="Date" defaultValue={row?.award_date} />
        <TextField name="url" label="Link" type="url" defaultValue={row?.url} />
        <TextAreaField name="description" label="Description" defaultValue={row?.description} rows={3} hint="One factual sentence is usually enough." />
      </FormSection>
      <FormSection title="Image & visibility">
        <ImageField name="image" label="Image or badge" folder={`awards/${row?.id ?? "drafts"}`} defaultValue={row?.image} aspect="square" altName="image_alt" altDefaultValue={row?.image_alt} />
        <CheckboxField name="visible" label="Visible on the site" defaultChecked={row?.visible ?? true} />
        <CheckboxField name="featured" label="Featured" defaultChecked={row?.featured ?? false} />
      </FormSection>
    </AdminForm>
  );
}

const PLATFORM_LABELS: Record<(typeof SOCIAL_PLATFORMS)[number], string> = {
  email: "Email",
  phone: "Phone",
  location: "Location (text)",
  website: "Personal website",
  github: "GitHub",
  linkedin: "LinkedIn",
  google_scholar: "Google Scholar",
  orcid: "ORCID",
  researchgate: "ResearchGate",
  semantic_scholar: "Semantic Scholar",
  arxiv: "arXiv",
  codeforces: "Codeforces",
  leetcode: "LeetCode",
  kaggle: "Kaggle",
  huggingface: "Hugging Face",
  x: "X (Twitter)",
  youtube: "YouTube",
  medium: "Medium",
  custom: "Other (generic link icon)",
};

export function SocialLinkForm({ row, action }: { row: SocialLinkRow | null; action: Action }) {
  return (
    <AdminForm action={action} submitLabel={row ? "Save link" : "Add link"}>
      <FormSection title="Link" description="Email → address, phone → number, location → plain text, everything else → full URL.">
        <SelectField
          name="platform"
          label="Platform"
          required
          defaultValue={row?.platform ?? "custom"}
          options={SOCIAL_PLATFORMS.map((p) => ({ value: p, label: PLATFORM_LABELS[p] }))}
        />
        <TextField name="label" label="Label" required defaultValue={row?.label} hint="Shown as the accessible name and in the contact list." />
        <TextField name="value" label="URL / value" defaultValue={row?.value} wide hint="Leave empty to keep the entry without showing it." />
        <CheckboxField name="visible" label="Visible on the site" defaultChecked={row?.visible ?? true} />
      </FormSection>
    </AdminForm>
  );
}
