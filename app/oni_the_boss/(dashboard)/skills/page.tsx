import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { SkillsManager } from "@/components/admin/skills-manager";
import { adminDb } from "@/lib/admin/page-data";

export const metadata: Metadata = { title: "Skills" };

export default async function SkillsPage() {
  const db = await adminDb();
  const [categories, skills] = await Promise.all([
    db.from("skill_categories").select("*").order("display_order").order("created_at"),
    db.from("skills").select("*").order("display_order").order("created_at"),
  ]);
  if (categories.error) throw categories.error;
  if (skills.error) throw skills.error;

  const grouped = categories.data.map((c) => ({
    ...c,
    skills: skills.data.filter((s) => s.category_id === c.id),
  }));

  return (
    <>
      <PageHeader
        title="Skills"
        description="Grouped by category. Empty or hidden categories are not shown publicly. Proficiency is optional text — no percentages."
      />
      <SkillsManager categories={grouped} />
    </>
  );
}
