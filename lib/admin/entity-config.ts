import type { MediaFolder } from "@/lib/storage";
import type { TableName } from "@/types/database";

/*
 * Plain configuration for admin-managed entities. Safe to import from both
 * server and client code (no functions, no secrets).
 */

export type Flag = "visible" | "featured";

export type EntityConfig = {
  table: Extract<
    TableName,
    | "projects"
    | "research"
    | "publications"
    | "experiences"
    | "education"
    | "awards"
    | "social_links"
    | "skill_categories"
    | "skills"
  >;
  label: string;
  singular: string;
  /** Columns holding storage paths owned by the row (cleaned up on delete/replace). */
  mediaColumns: readonly string[];
  folder: MediaFolder | null;
  flags: readonly Flag[];
  /** Ordering is scoped by this column (e.g. skills within a category). */
  orderScope?: "category_id";
  /** Fields edited as one-item-per-line text areas. */
  listFields: readonly string[];
  /** Column used for the title in lists and search. */
  titleColumn: string;
  description: string;
};

export const ENTITY_CONFIG = {
  projects: {
    table: "projects",
    label: "Projects",
    singular: "project",
    mediaColumns: ["thumbnail"],
    folder: "projects",
    flags: ["visible", "featured"],
    listFields: [],
    titleColumn: "title",
    description: "Featured projects get a large editorial layout; others appear as compact cards.",
  },
  research: {
    table: "research",
    label: "Research",
    singular: "research item",
    mediaColumns: ["image"],
    folder: "research",
    flags: ["visible", "featured"],
    listFields: ["highlights"],
    titleColumn: "title",
    description: "Research is presented narratively: problem, approach, significance and findings.",
  },
  publications: {
    table: "publications",
    label: "Publications",
    singular: "publication",
    mediaColumns: ["image"],
    folder: "publications",
    flags: ["visible", "featured"],
    listFields: ["authors"],
    titleColumn: "title",
    description: "Only the actions you fill in (DOI, PDF, code…) are shown publicly.",
  },
  experience: {
    table: "experiences",
    label: "Experience",
    singular: "experience",
    mediaColumns: ["organization_logo"],
    folder: "experience",
    flags: ["visible"],
    listFields: ["achievements"],
    titleColumn: "role",
    description: "Shown as a timeline in the order below.",
  },
  education: {
    table: "education",
    label: "Education",
    singular: "education entry",
    mediaColumns: ["logo"],
    folder: "education",
    flags: ["visible"],
    listFields: [],
    titleColumn: "institution",
    description: "Hidden entries are kept but never shown publicly.",
  },
  awards: {
    table: "awards",
    label: "Honors & awards",
    singular: "award",
    mediaColumns: ["image"],
    folder: "awards",
    flags: ["visible", "featured"],
    listFields: [],
    titleColumn: "title",
    description: "Keep descriptions short and factual.",
  },
  social: {
    table: "social_links",
    label: "Contact & social links",
    singular: "link",
    mediaColumns: [],
    folder: null,
    flags: ["visible"],
    listFields: [],
    titleColumn: "label",
    description: "Links without a value are never shown, even when visible.",
  },
  skill_categories: {
    table: "skill_categories",
    label: "Skill categories",
    singular: "category",
    mediaColumns: [],
    folder: null,
    flags: ["visible"],
    listFields: [],
    titleColumn: "name",
    description: "",
  },
  skills: {
    table: "skills",
    label: "Skills",
    singular: "skill",
    mediaColumns: [],
    folder: null,
    flags: ["visible", "featured"],
    orderScope: "category_id",
    listFields: [],
    titleColumn: "name",
    description: "",
  },
} as const satisfies Record<string, EntityConfig>;

export type EntityKey = keyof typeof ENTITY_CONFIG;

/** Entities with generic list/new/edit pages under /oni_the_boss/[entity]. */
export const ROUTED_ENTITIES = [
  "projects",
  "research",
  "publications",
  "experience",
  "education",
  "awards",
  "social",
] as const;
export type RoutedEntityKey = (typeof ROUTED_ENTITIES)[number];

export function isEntityKey(value: unknown): value is EntityKey {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(ENTITY_CONFIG, value);
}

export function isRoutedEntity(value: unknown): value is RoutedEntityKey {
  return typeof value === "string" && (ROUTED_ENTITIES as readonly string[]).includes(value);
}
