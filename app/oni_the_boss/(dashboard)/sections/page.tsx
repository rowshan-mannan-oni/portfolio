import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { SectionEditor } from "@/components/admin/section-editor";
import { moveSection, saveSection } from "@/lib/admin/actions/settings";
import { adminDb } from "@/lib/admin/page-data";
import { getHomeContent, getSections, getSiteSettings, sectionHasContent } from "@/lib/data/public";

export const metadata: Metadata = { title: "Sections" };

export default async function SectionsPage() {
  await adminDb();
  // Read through the public layer: this shows exactly what visitors get.
  const [sections, settings, content] = await Promise.all([getSections(), getSiteSettings(), getHomeContent()]);

  return (
    <>
      <PageHeader
        title="Sections"
        description="Show, hide, rename and reorder homepage sections. A visible section with no visible content is skipped automatically."
      />
      <div className="space-y-3">
        {sections.map((section, i) => (
          <SectionEditor
            key={section.key}
            section={{ ...section, display_order: i + 1 }}
            save={saveSection.bind(null, section.key)}
            moveUp={moveSection.bind(null, section.key, "up")}
            moveDown={moveSection.bind(null, section.key, "down")}
            isFirst={i === 0}
            isLast={i === sections.length - 1}
            hasContent={sectionHasContent(section.key, settings, content)}
          />
        ))}
      </div>
    </>
  );
}
