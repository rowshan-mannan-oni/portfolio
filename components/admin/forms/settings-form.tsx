"use client";

import type { SiteSettingsRow } from "@/types/database";
import type { ActionResult } from "@/lib/admin/action-result";
import { AdminForm, FormSection } from "@/components/admin/admin-form";
import { ListField, SelectField, TagsField, TextAreaField, TextField } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/image-field";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { CutoutField } from "@/components/admin/cutout-field";
import { ColorField } from "@/components/admin/color-field";

const POSITIONS = [
  { value: "center top", label: "Top" },
  { value: "center 20%", label: "Upper (20%)" },
  { value: "center 30%", label: "Upper-middle (30%) — default" },
  { value: "center 40%", label: "Slightly above centre (40%)" },
  { value: "center", label: "Centre" },
  { value: "center bottom", label: "Bottom" },
];

export function SettingsForm({ settings, action }: { settings: SiteSettingsRow; action: (fd: FormData) => Promise<ActionResult> }) {
  const s = settings;
  return (
    <AdminForm action={action} submitLabel="Save settings" stickyFooter>
      <FormSection title="Identity" description="Shown in the hero, navigation, footer and metadata.">
        <TextField name="full_name" label="Full name" required defaultValue={s.full_name} />
        <TextField name="professional_title" label="Professional title" defaultValue={s.professional_title} />
        <TextField name="monogram" label="Monogram" defaultValue={s.monogram} maxLength={4} hint="1–4 characters, used in the logo mark and photo fallback." />
        <TextField name="email" label="Public email" type="email" defaultValue={s.email} hint="Used in structured data. Contact links are managed under Contact & social." />
        <TextField name="location" label="Location" defaultValue={s.location} />
        <TextField name="current_status" label="Current status" defaultValue={s.current_status} hint="e.g. “Research assistant at …”. Shown in the hero badge." />
        <TextField name="availability" label="Availability" defaultValue={s.availability} wide hint="e.g. “Open to graduate research opportunities”." />
      </FormSection>

      <FormSection title="Profile photo" description="Without a photo, an elegant monogram placeholder is shown.">
        <ImageField
          name="profile_image_path"
          label="Photo"
          folder="profile"
          aspect="portrait"
          defaultValue={s.profile_image_path}
          altName="profile_image_alt"
          altDefaultValue={s.profile_image_alt}
          hint="A portrait (4:5) photo of at least 800 px wide works best."
        />
        <SelectField
          name="profile_image_position"
          label="Crop focus"
          required
          defaultValue={POSITIONS.some((p) => p.value === s.profile_image_position) ? s.profile_image_position : "center 30%"}
          options={POSITIONS}
          hint="Which part of the photo stays visible when cropped."
        />
      </FormSection>

      <FormSection
        title="Hero portrait style"
        description="Show the photo above, or a background-free cutout of you standing in front of large text."
      >
        <SelectField
          name="portrait_style"
          label="Style"
          required
          defaultValue={s.portrait_style}
          options={[
            { value: "photo", label: "Photo" },
            { value: "cutout", label: "Cutout with text behind" },
          ]}
          hint="If the cutout is missing, the photo is shown instead."
        />
        <TextAreaField
          name="portrait_backdrop_text"
          label="Text behind the cutout"
          defaultValue={s.portrait_backdrop_text}
          rows={4}
          maxLength={120}
          placeholder={"Eat\n Sleep\n  Code\nRepeat"}
          hint="One row per line; start a line with spaces to push it right. Written on one line, the words stagger automatically (Software → Engineer). Empty uses your title."
        />
        <SelectField
          name="portrait_text_position"
          label="Text position"
          required
          defaultValue={s.portrait_text_position ?? "center"}
          options={[
            { value: "top", label: "Top — above your head" },
            { value: "center", label: "Centre — behind you" },
            { value: "bottom", label: "Bottom" },
          ]}
          hint="Where the words sit behind the cutout."
        />
        <ColorField
          name="portrait_text_color"
          label="Text colour"
          defaultValue={s.portrait_text_color ?? null}
          themeLabel="theme teal"
          hint="Empty keeps the theme teal. Any colour you pick is adapted automatically: darkened if too pale on the light page, brightened to stay vivid in dark mode."
        />
        <CutoutField name="cutout_image_path" defaultValue={s.cutout_image_path} photoPath={s.profile_image_path} />
      </FormSection>

      <FormSection title="Hero">
        <TextAreaField name="hero_headline" label="Headline" defaultValue={s.hero_headline} rows={2} />
        <TextAreaField name="hero_description" label="Introduction" defaultValue={s.hero_description} rows={3} />
        <TagsField name="hero_focus_areas" label="Focus areas" defaultValue={s.hero_focus_areas} wide hint="Up to 5 short phrases shown under the buttons." />
      </FormSection>

      <FormSection title="About">
        <TextField name="about_heading" label="Lead sentence" defaultValue={s.about_heading} wide />
        <TextAreaField name="about_short_bio" label="Short bio" defaultValue={s.about_short_bio} rows={3} />
        <MarkdownEditor name="about_long_bio" label="Biography" defaultValue={s.about_long_bio} rows={10} />
      </FormSection>

      <FormSection title="Research profile">
        <TextAreaField name="research_intro" label="Research introduction" defaultValue={s.research_intro} rows={3} />
        <ListField name="research_interests" label="Research interests" defaultValue={s.research_interests} rows={8} hint="One per line, in display order." />
        <ListField
          name="author_names"
          label="Your author name variants"
          defaultValue={s.author_names}
          rows={3}
          hint="Matching names are subtly highlighted in publication author lists (e.g. “R. M. Oni”)."
        />
      </FormSection>

      <FormSection title="SEO & sharing">
        <TextField name="seo_title" label="Site title" defaultValue={s.seo_title} wide maxLength={120} />
        <TextAreaField name="seo_description" label="Site description" defaultValue={s.seo_description} rows={3} maxLength={300} />
        <TagsField name="seo_keywords" label="Keywords" defaultValue={s.seo_keywords} wide />
        <ImageField
          name="og_image_path"
          label="Social preview image"
          folder="site"
          defaultValue={s.og_image_path}
          hint="1200 × 630 recommended. When empty, a clean preview is generated automatically."
        />
      </FormSection>

      <FormSection title="Footer">
        <TextField name="footer_text" label="Footer note" defaultValue={s.footer_text} wide />
      </FormSection>
    </AdminForm>
  );
}
