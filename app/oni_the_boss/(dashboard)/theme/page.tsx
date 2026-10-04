import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ThemeEditor } from "@/components/admin/theme-editor";
import { adminDb } from "@/lib/admin/page-data";
import { resolvePalette } from "@/lib/theme-palette";

export const metadata: Metadata = { title: "Theme & colours" };

export default async function ThemePage() {
  const db = await adminDb();
  const [settings, library] = await Promise.all([
    db.from("site_settings").select("theme_palette").eq("id", true).maybeSingle(),
    db.from("theme_palettes").select("id, name, palette").order("created_at", { ascending: false }),
  ]);
  if (settings.error) throw settings.error;
  // The library is optional: if its migration hasn't run yet, show it empty.
  const saved = (library.data ?? []).map((row) => ({ id: row.id, name: row.name, palette: resolvePalette(row.palette) }));

  return (
    <>
      <PageHeader
        title="Theme & colours"
        description="Control every colour on the public site, separately for light and dark mode. The dashboard keeps its own neutral colours."
      />
      <ThemeEditor initial={resolvePalette(settings.data?.theme_palette)} library={saved} />
    </>
  );
}
