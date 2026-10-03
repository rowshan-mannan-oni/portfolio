"use client";

import type { PublicationRow } from "@/types/database";
import { VENUE_TYPES } from "@/types/database";
import type { ActionResult } from "@/lib/admin/action-result";
import { AdminForm, FormSection } from "@/components/admin/admin-form";
import { CheckboxField, ListField, SelectField, TextAreaField, TextField } from "@/components/admin/fields";

type Props = { row: PublicationRow | null; action: (fd: FormData) => Promise<ActionResult> };

const VENUE_LABELS: Record<(typeof VENUE_TYPES)[number], string> = {
  journal: "Journal article",
  conference: "Conference paper",
  workshop: "Workshop paper",
  preprint: "Preprint",
  thesis: "Thesis",
  book_chapter: "Book chapter",
  other: "Other",
};

export function PublicationForm({ row, action }: Props) {
  return (
    <AdminForm action={action} submitLabel={row ? "Save publication" : "Add publication"} stickyFooter>
      <FormSection title="Citation">
        <TextAreaField name="title" label="Title" required defaultValue={row?.title} rows={2} maxLength={400} />
        <ListField
          name="authors"
          label="Authors"
          defaultValue={row?.authors}
          rows={4}
          hint="One author per line, in publication order. Your name is highlighted automatically (configure name variants under Profile)."
        />
        <TextField name="venue" label="Venue" defaultValue={row?.venue} wide placeholder="Journal or conference name" />
        <SelectField
          name="venue_type"
          label="Type"
          defaultValue={row?.venue_type}
          options={VENUE_TYPES.map((v) => ({ value: v, label: VENUE_LABELS[v] }))}
        />
        <TextField name="publisher" label="Publisher" defaultValue={row?.publisher} placeholder="e.g. IEEE" />
        <TextField name="year" label="Year" defaultValue={row?.year} inputMode="numeric" maxLength={4} />
        <TextField name="quartile" label="Quartile / ranking" defaultValue={row?.quartile} placeholder="e.g. Q1" />
        <TextField name="volume" label="Volume" defaultValue={row?.volume} />
        <TextField name="issue" label="Issue" defaultValue={row?.issue} />
        <TextField name="pages" label="Pages" defaultValue={row?.pages} placeholder="e.g. 7182–7223" />
        <TextField name="doi" label="DOI" defaultValue={row?.doi} placeholder="10.xxxx/…" />
      </FormSection>

      <FormSection title="Links" description="Each filled link becomes a small action under the publication.">
        <TextField name="publisher_url" label="Publisher page" type="url" defaultValue={row?.publisher_url} />
        <TextField name="pdf_url" label="PDF" type="url" defaultValue={row?.pdf_url} />
        <TextField name="code_url" label="Code" type="url" defaultValue={row?.code_url} />
        <TextField name="dataset_url" label="Dataset" type="url" defaultValue={row?.dataset_url} />
      </FormSection>

      <FormSection title="Abstract & citation">
        <TextAreaField name="abstract" label="Abstract" defaultValue={row?.abstract} rows={6} />
        <TextAreaField
          name="citation"
          label="Citation text"
          defaultValue={row?.citation}
          rows={3}
          hint="Optional. When empty, an IEEE-style citation is generated from the fields above."
        />
      </FormSection>

      <FormSection title="Publishing">
        <CheckboxField name="visible" label="Visible on the site" defaultChecked={row?.visible ?? true} />
        <CheckboxField name="featured" label="Featured" defaultChecked={row?.featured ?? false} />
      </FormSection>
    </AdminForm>
  );
}
