import { z } from "zod";
import { PORTRAIT_STYLES, PORTRAIT_TEXT_POSITIONS, PROJECT_STATUSES, SOCIAL_PLATFORMS, VENUE_TYPES } from "@/types/database";
import {
  checkbox,
  optionalPartialDate,
  optionalStoragePath,
  optionalText,
  optionalUrl,
  optionalYear,
  requiredText,
  slugField,
  stringList,
} from "@/lib/validation/fields";

/*
 * Zod schemas for every admin-editable entity. They are the single source of
 * truth for server-side validation; the browser only gets convenience checks.
 */

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .union([z.enum(values), z.literal("")])
    .optional()
    .transform((v) => (v ? (v as T[number]) : null));

export const experienceSchema = z
  .object({
    role: requiredText("Role", 160),
    organization: requiredText("Organization", 160),
    organization_url: optionalUrl,
    organization_logo: optionalStoragePath,
    employment_type: optionalText(80),
    location: optionalText(120),
    start_date: optionalPartialDate,
    end_date: optionalPartialDate,
    currently_working: checkbox,
    short_description: optionalText(1000),
    detailed_description: optionalText(10000),
    achievements: stringList(20, 400),
    technologies: stringList(40, 60),
    visible: checkbox,
  })
  .refine((d) => !d.start_date || !d.end_date || d.currently_working || d.start_date <= d.end_date, {
    message: "End date must be after the start date.",
    path: ["end_date"],
  });

export const educationSchema = z.object({
  institution: requiredText("Institution", 200),
  degree: optionalText(200),
  department: optionalText(200),
  location: optionalText(120),
  start_date: optionalPartialDate,
  end_date: optionalPartialDate,
  grade: optionalText(80),
  description: optionalText(2000),
  logo: optionalStoragePath,
  institution_url: optionalUrl,
  visible: checkbox,
});

export const publicationSchema = z.object({
  title: requiredText("Title", 400),
  authors: stringList(60, 120),
  venue: optionalText(300),
  venue_type: optionalEnum(VENUE_TYPES),
  publisher: optionalText(120),
  year: optionalYear,
  volume: optionalText(20),
  issue: optionalText(20),
  pages: optionalText(40),
  quartile: optionalText(20),
  doi: optionalText(200)
    .refine((v) => !v || /^(https?:\/\/(dx\.)?doi\.org\/)?10\.\d{4,9}\/\S+$/i.test(v), "Enter a DOI such as 10.1109/…")
    .transform((v) => (v ? v.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "") : null)),
  abstract: optionalText(6000),
  citation: optionalText(3000),
  publisher_url: optionalUrl,
  pdf_url: optionalUrl,
  code_url: optionalUrl,
  dataset_url: optionalUrl,
  image: optionalStoragePath,
  image_alt: optionalText(300),
  featured: checkbox,
  visible: checkbox,
});

export const researchSchema = z.object({
  title: requiredText("Title", 300),
  short_description: optionalText(1200),
  problem: optionalText(1500),
  approach: optionalText(1500),
  significance: optionalText(1500),
  full_description: optionalText(20000),
  research_type: optionalText(80),
  institution: optionalText(200),
  supervisor: optionalText(200),
  start_date: optionalPartialDate,
  end_date: optionalPartialDate,
  status: optionalText(60),
  keywords: stringList(30, 80),
  methods: stringList(30, 80),
  dataset: optionalText(300),
  highlights: stringList(20, 500),
  image: optionalStoragePath,
  image_alt: optionalText(300),
  paper_url: optionalUrl,
  code_url: optionalUrl,
  project_url: optionalUrl,
  related_publication_id: z
    .union([z.uuid(), z.literal("")])
    .optional()
    .transform((v) => v || null),
  featured: checkbox,
  visible: checkbox,
});

export const projectSchema = z.object({
  title: requiredText("Title", 200),
  slug: slugField,
  short_description: optionalText(600),
  full_description: optionalText(20000),
  start_date: optionalPartialDate,
  end_date: optionalPartialDate,
  organization: optionalText(160),
  role: optionalText(120),
  technologies: stringList(40, 60),
  thumbnail: optionalStoragePath,
  thumbnail_alt: optionalText(300),
  github_url: optionalUrl,
  live_url: optionalUrl,
  video_url: optionalUrl,
  docs_url: optionalUrl,
  paper_url: optionalUrl,
  status: optionalEnum(PROJECT_STATUSES),
  featured: checkbox,
  visible: checkbox,
});

export const awardSchema = z.object({
  title: requiredText("Title", 200),
  issuer: optionalText(200),
  award_date: optionalPartialDate,
  description: optionalText(1000),
  url: optionalUrl,
  image: optionalStoragePath,
  image_alt: optionalText(300),
  featured: checkbox,
  visible: checkbox,
});

export const socialLinkSchema = z
  .object({
    platform: z.enum(SOCIAL_PLATFORMS, { error: "Choose a platform." }),
    label: requiredText("Label", 60),
    value: optionalText(500),
    visible: checkbox,
  })
  .superRefine((d, ctx) => {
    if (!d.value) return; // empty is allowed — the link is simply not shown
    if (d.platform === "email") {
      if (!z.email().safeParse(d.value.replace(/^mailto:/i, "")).success)
        ctx.addIssue({ code: "custom", message: "Enter a valid email address.", path: ["value"] });
    } else if (d.platform === "phone") {
      if (!/^[+()\d\s.-]{5,30}$/.test(d.value.replace(/^tel:/i, "")))
        ctx.addIssue({ code: "custom", message: "Enter a valid phone number.", path: ["value"] });
    } else if (d.platform !== "location") {
      try {
        const url = new URL(d.value);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      } catch {
        ctx.addIssue({ code: "custom", message: "Enter a full URL starting with https://", path: ["value"] });
      }
    }
  });

export const skillCategorySchema = z.object({
  name: requiredText("Name", 80),
  description: optionalText(300),
  visible: checkbox,
});

export const skillSchema = z.object({
  category_id: z.uuid("Choose a category."),
  name: requiredText("Name", 80),
  proficiency: optionalText(40),
  icon: optionalText(40),
  featured: checkbox,
  visible: checkbox,
});

export const blogPostSchema = z.object({
  title: requiredText("Title", 200),
  slug: slugField,
  slug_manual: checkbox,
  excerpt: optionalText(500),
  content: z.string().max(100_000, "The article is too long (100,000 characters max).").default(""),
  cover_image: optionalStoragePath,
  cover_image_alt: optionalText(300),
  tags: stringList(12, 40).transform((tags) =>
    tags.map((t) => t.toLowerCase().replace(/[^a-z0-9+#.\- ]/g, "").trim()).filter(Boolean),
  ),
  featured: checkbox,
  published_at: z
    .string()
    .optional()
    .default("")
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Invalid date.")
    .transform((v) => (v ? new Date(v).toISOString() : null)),
  seo_title: optionalText(70, "SEO title"),
  seo_description: optionalText(200, "SEO description"),
  intent: z.enum(["save", "publish", "unpublish"]).default("save"),
});

export const siteSettingsSchema = z.object({
  full_name: requiredText("Name", 120),
  professional_title: optionalText(120),
  monogram: optionalText(4, "Monogram"),
  hero_headline: optionalText(300),
  hero_description: optionalText(800),
  hero_focus_areas: stringList(5, 60),
  about_heading: optionalText(200),
  about_short_bio: optionalText(600),
  about_long_bio: optionalText(10000),
  current_status: optionalText(160),
  availability: optionalText(300),
  research_intro: optionalText(1000),
  research_interests: stringList(20, 100),
  author_names: stringList(10, 100),
  location: optionalText(120),
  email: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => !v || z.email().safeParse(v).success, "Enter a valid email address.")
    .transform((v) => v || null),
  profile_image_path: optionalStoragePath,
  profile_image_alt: optionalText(300),
  profile_image_position: z
    .string()
    .trim()
    .regex(/^[a-z0-9% .]{1,40}$/i, "Use a CSS position such as “center 30%”.")
    .default("center 30%"),
  portrait_style: z.enum(PORTRAIT_STYLES).default("photo"),
  cutout_image_path: optionalStoragePath,
  portrait_backdrop_text: optionalText(120, "Backdrop text"),
  portrait_text_position: z.enum(PORTRAIT_TEXT_POSITIONS).default("center"),
  portrait_text_color: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => !v || /^#[0-9a-f]{6}$/i.test(v), "Use a colour like #0f766e.")
    .transform((v) => (v ? v.toLowerCase() : null)),
  seo_title: optionalText(120, "SEO title"),
  seo_description: optionalText(300, "SEO description"),
  seo_keywords: stringList(20, 60),
  og_image_path: optionalStoragePath,
  footer_text: optionalText(300),
});

export const sectionSchema = z.object({
  visible: checkbox,
  nav_label: optionalText(30, "Navigation label"),
  heading: requiredText("Heading", 80),
  subheading: optionalText(300, "Subheading"),
});
