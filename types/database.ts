/**
 * Database types, mirroring supabase/migrations.
 *
 * Shaped like the output of `supabase gen types typescript`, so you can replace
 * this file with generated types at any time:
 *   npx supabase gen types typescript --project-id <ref> > types/database.ts
 * (then re-export the row aliases at the bottom of this file).
 */

type Timestamps = { created_at: string; updated_at: string };

export const PORTRAIT_STYLES = ["photo", "cutout"] as const;
export type PortraitStyle = (typeof PORTRAIT_STYLES)[number];
export const PORTRAIT_TEXT_POSITIONS = ["top", "center", "bottom"] as const;
export type PortraitTextPosition = (typeof PORTRAIT_TEXT_POSITIONS)[number];

export type SiteSettingsRow = {
  id: boolean;
  full_name: string;
  professional_title: string | null;
  monogram: string | null;
  hero_headline: string | null;
  hero_description: string | null;
  hero_focus_areas: string[];
  about_heading: string | null;
  about_short_bio: string | null;
  about_long_bio: string | null;
  current_status: string | null;
  availability: string | null;
  research_intro: string | null;
  research_interests: string[];
  author_names: string[];
  location: string | null;
  email: string | null;
  profile_image_path: string | null;
  profile_image_alt: string | null;
  profile_image_position: string;
  portrait_style: PortraitStyle;
  cutout_image_path: string | null;
  portrait_backdrop_text: string | null;
  portrait_text_position: PortraitTextPosition;
  portrait_text_color: string | null;
  /** Palette overrides ({ light: {...}, dark: {...} }); see lib/theme-palette.ts. */
  theme_palette: Record<string, unknown> | null;
  cv_path: string | null;
  cv_file_name: string | null;
  cv_updated_at: string | null;
  cv_visible: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[];
  og_image_path: string | null;
  footer_text: string | null;
  updated_at: string;
};

export const SECTION_KEYS = [
  "about",
  "experience",
  "research",
  "publications",
  "projects",
  "skills",
  "education",
  "awards",
  "blog",
  "contact",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export type SectionSettingsRow = {
  key: SectionKey;
  visible: boolean;
  nav_label: string | null;
  heading: string;
  subheading: string | null;
  display_order: number;
  updated_at: string;
};

export const SOCIAL_PLATFORMS = [
  "email",
  "phone",
  "location",
  "website",
  "github",
  "linkedin",
  "google_scholar",
  "orcid",
  "researchgate",
  "semantic_scholar",
  "arxiv",
  "codeforces",
  "leetcode",
  "kaggle",
  "huggingface",
  "x",
  "youtube",
  "medium",
  "custom",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export type SocialLinkRow = Timestamps & {
  id: string;
  platform: SocialPlatform;
  label: string;
  value: string | null;
  display_order: number;
  visible: boolean;
};

export type ExperienceRow = Timestamps & {
  id: string;
  organization: string;
  organization_url: string | null;
  organization_logo: string | null;
  role: string;
  employment_type: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  currently_working: boolean;
  short_description: string | null;
  detailed_description: string | null;
  achievements: string[];
  technologies: string[];
  display_order: number;
  visible: boolean;
};

export type EducationRow = Timestamps & {
  id: string;
  institution: string;
  degree: string | null;
  department: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  grade: string | null;
  description: string | null;
  logo: string | null;
  institution_url: string | null;
  display_order: number;
  visible: boolean;
};

export const VENUE_TYPES = [
  "journal",
  "conference",
  "workshop",
  "preprint",
  "thesis",
  "book_chapter",
  "other",
] as const;
export type VenueType = (typeof VENUE_TYPES)[number];

export type PublicationRow = Timestamps & {
  id: string;
  title: string;
  slug: string | null;
  authors: string[];
  venue: string | null;
  venue_type: VenueType | null;
  publisher: string | null;
  year: number | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  quartile: string | null;
  doi: string | null;
  abstract: string | null;
  citation: string | null;
  publisher_url: string | null;
  pdf_url: string | null;
  code_url: string | null;
  dataset_url: string | null;
  image: string | null;
  image_alt: string | null;
  featured: boolean;
  visible: boolean;
  display_order: number;
};

export type ResearchRow = Timestamps & {
  id: string;
  title: string;
  short_description: string | null;
  problem: string | null;
  approach: string | null;
  significance: string | null;
  full_description: string | null;
  research_type: string | null;
  institution: string | null;
  supervisor: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  keywords: string[];
  methods: string[];
  dataset: string | null;
  highlights: string[];
  image: string | null;
  image_alt: string | null;
  paper_url: string | null;
  code_url: string | null;
  project_url: string | null;
  related_publication_id: string | null;
  featured: boolean;
  visible: boolean;
  display_order: number;
};

export const PROJECT_STATUSES = ["active", "completed", "research", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type ProjectRow = Timestamps & {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  full_description: string | null;
  start_date: string | null;
  end_date: string | null;
  organization: string | null;
  role: string | null;
  technologies: string[];
  thumbnail: string | null;
  thumbnail_alt: string | null;
  github_url: string | null;
  live_url: string | null;
  video_url: string | null;
  docs_url: string | null;
  paper_url: string | null;
  featured: boolean;
  status: ProjectStatus | null;
  display_order: number;
  visible: boolean;
};

export type ProjectImageRow = {
  id: string;
  project_id: string;
  path: string;
  alt_text: string | null;
  caption: string | null;
  display_order: number;
  created_at: string;
};

export type SkillCategoryRow = Timestamps & {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  visible: boolean;
};

export type SkillRow = Timestamps & {
  id: string;
  category_id: string;
  name: string;
  icon: string | null;
  proficiency: string | null;
  featured: boolean;
  display_order: number;
  visible: boolean;
};

export type AwardRow = Timestamps & {
  id: string;
  title: string;
  issuer: string | null;
  award_date: string | null;
  description: string | null;
  url: string | null;
  image: string | null;
  image_alt: string | null;
  featured: boolean;
  visible: boolean;
  display_order: number;
};

export type BlogStatus = "draft" | "published";

export type BlogPostRow = Timestamps & {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  cover_image_alt: string | null;
  tags: string[];
  status: BlogStatus;
  featured: boolean;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

export type ContactStatus = "unread" | "read" | "archived";

export type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  subject: string;
  message: string;
  status: ContactStatus;
  ip_hash: string | null;
  read_at: string | null;
  created_at: string;
};

export type ThemePaletteRow = {
  id: string;
  name: string;
  /** Full palette: { light: {...}, dark: {...} }; see lib/theme-palette.ts. */
  palette: Record<string, unknown>;
  created_at: string;
};

export type AdminUserRow = {
  user_id: string;
  role: "admin";
  created_at: string;
};

/** Insert: columns with DB defaults become optional. */
type InsertOf<Row, Required extends keyof Row> = Partial<Row> & Pick<Row, Required>;

type TableDef<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: InsertOf<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      admin_users: TableDef<AdminUserRow, "user_id">;
      site_settings: TableDef<SiteSettingsRow, never>;
      section_settings: TableDef<SectionSettingsRow, "key" | "heading">;
      social_links: TableDef<SocialLinkRow, "label">;
      experiences: TableDef<ExperienceRow, "organization" | "role">;
      education: TableDef<EducationRow, "institution">;
      publications: TableDef<PublicationRow, "title">;
      research: TableDef<ResearchRow, "title">;
      projects: TableDef<ProjectRow, "title" | "slug">;
      project_images: TableDef<ProjectImageRow, "project_id" | "path">;
      skill_categories: TableDef<SkillCategoryRow, "name">;
      skills: TableDef<SkillRow, "category_id" | "name">;
      awards: TableDef<AwardRow, "title">;
      blog_posts: TableDef<BlogPostRow, "title" | "slug">;
      theme_palettes: TableDef<ThemePaletteRow, "name" | "palette">;
      contact_messages: TableDef<
        ContactMessageRow,
        "name" | "email" | "subject" | "message"
      >;
    };
    Views: Record<never, never>;
    Functions: {
      is_admin: { Args: Record<never, never>; Returns: boolean };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type TableName = keyof Database["public"]["Tables"];
