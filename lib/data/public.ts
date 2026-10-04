import "server-only";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { readingTime } from "@/lib/utils";
import { createPublicClient } from "@/lib/supabase/public";
import {
  SECTION_KEYS,
  type AwardRow,
  type BlogPostRow,
  type EducationRow,
  type ExperienceRow,
  type ProjectImageRow,
  type ProjectRow,
  type PublicationRow,
  type ResearchRow,
  type SectionKey,
  type SectionSettingsRow,
  type SiteSettingsRow,
  type SkillCategoryRow,
  type SkillRow,
  type SocialLinkRow,
} from "@/types/database";

/*
 * Public read layer. Everything here uses the anonymous client, so RLS
 * guarantees that hidden rows and drafts are never returned.
 *
 * Failure policy: when Supabase is not configured (e.g. a local build without
 * .env.local) we fall back to empty content so the site still renders. When it
 * IS configured, query errors are thrown: during incremental regeneration
 * Next.js then keeps serving the last good page instead of caching an empty one.
 */

export const DEFAULT_SETTINGS: SiteSettingsRow = {
  id: true,
  full_name: "Rowshan Mannan Oni",
  professional_title: "Software Engineer & AI Researcher",
  monogram: "RO",
  hero_headline: null,
  hero_description: null,
  hero_focus_areas: [],
  about_heading: null,
  about_short_bio: null,
  about_long_bio: null,
  current_status: null,
  availability: null,
  research_intro: null,
  research_interests: [],
  author_names: [],
  location: null,
  email: null,
  profile_image_path: null,
  profile_image_alt: null,
  profile_image_position: "center 30%",
  portrait_style: "photo",
  cutout_image_path: null,
  portrait_backdrop_text: null,
  portrait_text_position: "center",
  portrait_text_color: null,
  cv_path: null,
  cv_file_name: null,
  cv_updated_at: null,
  cv_visible: false,
  seo_title: null,
  seo_description: null,
  seo_keywords: [],
  og_image_path: null,
  footer_text: null,
  updated_at: new Date(0).toISOString(),
};

const DEFAULT_HEADINGS: Record<SectionKey, string> = {
  about: "About",
  experience: "Experience",
  research: "Research",
  publications: "Publications",
  projects: "Projects",
  skills: "Skills & Tools",
  education: "Education",
  awards: "Honors & Awards",
  blog: "Writing",
  contact: "Contact",
};

function defaultSections(): SectionSettingsRow[] {
  return SECTION_KEYS.map((key, index) => ({
    key,
    visible: true,
    nav_label: null,
    heading: DEFAULT_HEADINGS[key],
    subheading: null,
    display_order: index + 1,
    updated_at: new Date(0).toISOString(),
  }));
}

class ContentError extends Error {
  constructor(what: string, cause: unknown) {
    super(`Failed to load ${what}`, { cause });
    this.name = "ContentError";
  }
}

function unwrap<T>(what: string, result: { data: T | null; error: unknown }): T {
  if (result.error) throw new ContentError(what, result.error);
  return result.data as T;
}

export const getSiteSettings = cache(async (): Promise<SiteSettingsRow> => {
  if (!isSupabaseConfigured()) return DEFAULT_SETTINGS;
  const supabase = createPublicClient();
  const data = unwrap(
    "site settings",
    await supabase.from("site_settings").select("*").eq("id", true).maybeSingle(),
  );
  return data ?? DEFAULT_SETTINGS;
});

/** All sections, ordered. Missing rows fall back to visible defaults. */
export const getSections = cache(async (): Promise<SectionSettingsRow[]> => {
  if (!isSupabaseConfigured()) return defaultSections();
  const supabase = createPublicClient();
  const rows = unwrap(
    "section settings",
    await supabase.from("section_settings").select("*").order("display_order"),
  );
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return defaultSections()
    .map((fallback) => byKey.get(fallback.key) ?? fallback)
    .sort((a, b) => a.display_order - b.display_order);
});

export const getSocialLinks = cache(async (): Promise<SocialLinkRow[]> => {
  if (!isSupabaseConfigured()) return [];
  const supabase = createPublicClient();
  const rows = unwrap(
    "social links",
    await supabase.from("social_links").select("*").order("display_order"),
  );
  // A link without a value is never shown.
  return rows.filter((r) => r.value && r.value.trim().length > 0);
});

export type ProjectWithImages = ProjectRow & { images: ProjectImageRow[] };
export type SkillCategoryWithSkills = SkillCategoryRow & { skills: SkillRow[] };
export type ResearchWithPublication = ResearchRow & {
  publication: Pick<PublicationRow, "id" | "title" | "venue" | "year"> | null;
};

export type HomeContent = {
  experiences: ExperienceRow[];
  research: ResearchWithPublication[];
  publications: PublicationRow[];
  projects: ProjectWithImages[];
  skillCategories: SkillCategoryWithSkills[];
  education: EducationRow[];
  awards: AwardRow[];
  posts: BlogPostSummary[];
};

const EMPTY_HOME: HomeContent = {
  experiences: [],
  research: [],
  publications: [],
  projects: [],
  skillCategories: [],
  education: [],
  awards: [],
  posts: [],
};

export type BlogPostSummary = Pick<
  BlogPostRow,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "cover_image"
  | "cover_image_alt"
  | "tags"
  | "featured"
  | "published_at"
> & { reading_minutes: number };

const POST_SUMMARY_COLUMNS =
  "id, title, slug, excerpt, cover_image, cover_image_alt, tags, featured, published_at, content";

function toSummary(
  row: Pick<
    BlogPostRow,
    | "id"
    | "title"
    | "slug"
    | "excerpt"
    | "cover_image"
    | "cover_image_alt"
    | "tags"
    | "featured"
    | "published_at"
    | "content"
  >,
): BlogPostSummary {
  const { content, ...rest } = row;
  return { ...rest, reading_minutes: readingTime(content) };
}

export const getHomeContent = cache(async (): Promise<HomeContent> => {
  if (!isSupabaseConfigured()) return EMPTY_HOME;
  const supabase = createPublicClient();
  const sections = await getSections();
  const on = (key: SectionKey) => sections.find((s) => s.key === key)?.visible ?? false;

  const [experiences, research, publications, projects, images, categories, skills, education, awards, posts] =
    await Promise.all([
      on("experience")
        ? supabase.from("experiences").select("*").order("display_order")
        : null,
      on("research")
        ? supabase
            .from("research")
            .select("*")
            .order("featured", { ascending: false })
            .order("display_order")
        : null,
      // Publications are also needed to resolve research → publication links.
      on("publications") || on("research")
        ? supabase.from("publications").select("*").order("display_order")
        : null,
      on("projects")
        ? supabase.from("projects").select("*").order("display_order")
        : null,
      on("projects")
        ? supabase.from("project_images").select("*").order("display_order")
        : null,
      on("skills") ? supabase.from("skill_categories").select("*").order("display_order") : null,
      on("skills") ? supabase.from("skills").select("*").order("display_order") : null,
      on("education") ? supabase.from("education").select("*").order("display_order") : null,
      on("awards") ? supabase.from("awards").select("*").order("display_order") : null,
      on("blog")
        ? supabase
            .from("blog_posts")
            .select(POST_SUMMARY_COLUMNS)
            .order("featured", { ascending: false })
            .order("published_at", { ascending: false })
            .limit(3)
        : null,
    ]);

  const publicationRows: PublicationRow[] = publications
    ? unwrap("publications", publications)
    : [];
  const pubById = new Map(publicationRows.map((p) => [p.id, p]));

  const researchRows: ResearchRow[] = research ? unwrap("research", research) : [];
  const projectRows: ProjectRow[] = projects ? unwrap("projects", projects) : [];
  const imageRows: ProjectImageRow[] = images ? unwrap("project images", images) : [];
  const skillRows: SkillRow[] = skills ? unwrap("skills", skills) : [];
  const categoryRows: SkillCategoryRow[] = categories ? unwrap("skill categories", categories) : [];

  return {
    experiences: experiences ? unwrap("experience", experiences) : [],
    research: researchRows.map((r) => {
      const pub = r.related_publication_id ? pubById.get(r.related_publication_id) : undefined;
      return {
        ...r,
        publication: pub ? { id: pub.id, title: pub.title, venue: pub.venue, year: pub.year } : null,
      };
    }),
    publications: on("publications") ? publicationRows : [],
    projects: projectRows.map((p) => ({
      ...p,
      images: imageRows.filter((img) => img.project_id === p.id),
    })),
    skillCategories: categoryRows
      .map((c) => ({ ...c, skills: skillRows.filter((s) => s.category_id === c.id) }))
      .filter((c) => c.skills.length > 0),
    education: education ? unwrap("education", education) : [],
    awards: awards ? unwrap("awards", awards) : [],
    posts: posts ? unwrap("posts", posts).map((p) => toSummary(p)) : [],
  };
});

export const getPublishedPosts = cache(async (): Promise<BlogPostSummary[]> => {
  if (!isSupabaseConfigured()) return [];
  const supabase = createPublicClient();
  const rows = unwrap(
    "posts",
    await supabase
      .from("blog_posts")
      .select(POST_SUMMARY_COLUMNS)
      .order("published_at", { ascending: false }),
  );
  return rows.map((p) => toSummary(p));
});

export const getPostBySlug = cache(async (slug: string): Promise<BlogPostRow | null> => {
  if (!isSupabaseConfigured()) return null;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  const supabase = createPublicClient();
  return unwrap(
    "post",
    await supabase.from("blog_posts").select("*").eq("slug", slug).maybeSingle(),
  );
});

export const isSectionVisible = (sections: SectionSettingsRow[], key: SectionKey) =>
  sections.find((s) => s.key === key)?.visible ?? false;

/** Whether a visible section actually has something to show. */
export function sectionHasContent(
  key: SectionKey,
  settings: SiteSettingsRow,
  content: HomeContent,
): boolean {
  switch (key) {
    case "about":
      return Boolean(settings.about_long_bio || settings.about_short_bio);
    case "experience":
      return content.experiences.length > 0;
    case "research":
      return content.research.length > 0 || settings.research_interests.length > 0;
    case "publications":
      return content.publications.length > 0;
    case "projects":
      return content.projects.length > 0;
    case "skills":
      return content.skillCategories.length > 0;
    case "education":
      return content.education.length > 0;
    case "awards":
      return content.awards.length > 0;
    case "blog":
      return content.posts.length > 0;
    case "contact":
      return true;
  }
}
